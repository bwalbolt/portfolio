#!/usr/bin/env python3
"""
Headless agent runner for the harness.

Orchestrates headless implementation sessions from per-ticket plans, then runs
verification and evaluation to ensure quality. Codex is the default spawned
agent, with best-effort Claude support when Claude Code is installed.

Usage:
    python .harness/runner.py --plan .harness/plans/fix-csv-naming.json
    python .harness/runner.py --plan .harness/plans/fix-csv-naming.json --loop
    python .harness/runner.py --plan .harness/plans/fix-csv-naming.json --task 2
    python .harness/runner.py --plan .harness/plans/fix-csv-naming.json --dry-run
    python .harness/runner.py --plan .harness/plans/fix-csv-naming.json --skip-eval
    python .harness/runner.py --plan .harness/plans/fix-csv-naming.json --eval-only 1
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import textwrap
from pathlib import Path

from agent_adapter import AgentOptions, build_agent_command, format_command_for_display
from agent_adapter import run_agent_session as launch_agent_session

ROOT = Path(__file__).resolve().parent.parent
PROGRESS_PATH = ROOT / ".harness" / "progress.md"
FEEDBACK_DIR = ROOT / ".harness" / "eval_feedback"

MAX_RETRIES = 2  # Max evaluator->generator retry cycles per task

# Command to verify the project (lint + typecheck + build + smoke tests).
VERIFY_CMD: list[str] = ["npm", "run", "verify"]

# Path to project AGENTS.md instructions (relative to ROOT). Set to None if not used.
AGENTS_MD_PATH: str | None = "AGENTS.md"

# Source directories to reference in prompts (for developer orientation).
# Examples: ["src/", "lib/"], ["app/", "tests/"]
SOURCE_DIRS: list[str] = ["src/", "tests/"]


# ---------------------------------------------------------------------------
# Plan I/O
# ---------------------------------------------------------------------------


def load_plan(plan_path: Path) -> dict:
    return json.loads(plan_path.read_text())


def save_plan(plan: dict, plan_path: Path) -> None:
    plan_path.write_text(json.dumps(plan, indent=2) + "\n")


# ---------------------------------------------------------------------------
# Git helpers
# ---------------------------------------------------------------------------


def run_git(args: list[str], *, capture: bool = True) -> subprocess.CompletedProcess:
    """Run a git command from the repository root."""
    return subprocess.run(
        ["git", *args],
        cwd=ROOT,
        capture_output=capture,
        text=True,
    )


def rel_path(path: Path) -> str:
    """Return a POSIX path relative to the repository root."""
    return path.resolve().relative_to(ROOT).as_posix()


def changed_paths() -> set[str]:
    """Return tracked and untracked paths changed in the working tree."""
    paths: set[str] = set()
    commands = [
        ["diff", "--name-only"],
        ["diff", "--name-only", "--cached"],
        ["ls-files", "--others", "--exclude-standard"],
    ]
    for args in commands:
        result = run_git(args)
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} failed")
        paths.update(line.strip() for line in result.stdout.splitlines() if line.strip())
    return paths


def harness_state_paths(plan_path: Path, slug: str | None, task_id: str | None) -> set[str]:
    """Paths the runner may update as harness bookkeeping."""
    paths = {rel_path(plan_path), rel_path(PROGRESS_PATH)}
    if slug and task_id:
        paths.add(rel_path(FEEDBACK_DIR / f"{slug}_{task_id}.json"))
        paths.add(rel_path(FEEDBACK_DIR / f"{task_id}.json"))
    return paths


def assert_clean_worktree(plan: dict) -> None:
    """Require a clean tree before the runner starts changing files."""
    current = changed_paths()
    blocking = sorted(current)
    if not blocking:
        return

    print("\nCannot run because the worktree is dirty.")
    print("Commit, stash, or otherwise clear these changes before running the harness:")
    for path in blocking:
        print(f"  - {path}")
    print(f"\nPlan: {plan.get('title', 'unknown plan')}")
    sys.exit(1)


def commit_lifecycle_lines() -> list[str]:
    return [
        "Commit lifecycle: required",
        "- implementation commit after verification passes",
        "- evaluator-fix commit after any verified review fixes",
        "- completion commit after evaluator PASS",
    ]


def stage_paths(paths: set[str]) -> None:
    if not paths:
        return
    result = run_git(["add", "--", *sorted(paths)])
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "git add failed")


def commit_paths(paths: set[str], subject: str, body_lines: list[str]) -> bool:
    """Stage explicit paths and create a local commit. Returns True if committed."""
    paths = {path for path in paths if path}
    if not paths:
        print(f"\n-- Commit skipped: no changes for '{subject}' --")
        return False

    stage_paths(paths)
    message = subject
    body = "\n".join(line for line in body_lines if line)
    args = ["commit", "-m", message]
    if body:
        args.extend(["-m", body])

    print(f"\n-- Commit: {subject} --")
    result = run_git(args, capture=False)
    if result.returncode != 0:
        raise RuntimeError(f"git commit failed for: {subject}")
    return True


def task_body(plan: dict, task: dict, plan_path: Path) -> list[str]:
    ac_lines = task.get("acceptance_criteria", [])
    body = [
        f"Task: {task['title']}",
        f"Plan: {rel_path(plan_path)}",
    ]
    if ac_lines:
        body.append("")
        body.append("Acceptance criteria:")
        body.extend(f"- {ac}" for ac in ac_lines)
    return body


def feedback_body(
    plan: dict, task: dict, plan_path: Path, feedback: dict | None
) -> list[str]:
    body = task_body(plan, task, plan_path)
    feedback_path = FEEDBACK_DIR / f"{plan['slug']}_{task['id']}.json"
    body.extend(["", f"Evaluator feedback: {rel_path(feedback_path)}"])
    issues = (feedback or {}).get("issues", [])
    if issues:
        body.append("")
        body.append("Issues addressed:")
        body.extend(f"- {issue}" for issue in issues)
    return body


def commit_task_changes(
    *,
    plan: dict,
    task: dict,
    plan_path: Path,
    baseline: set[str],
    subject: str,
    body_lines: list[str],
    include_harness_state: bool,
) -> bool:
    current = changed_paths()
    state_paths = harness_state_paths(plan_path, plan.get("slug"), task.get("id"))
    paths = current - baseline
    if not include_harness_state:
        paths -= state_paths
        paths = {path for path in paths if not path.startswith(".harness/eval_feedback/")}
    return commit_paths(paths, subject, body_lines)


# ---------------------------------------------------------------------------
# Task finding
# ---------------------------------------------------------------------------


def find_next_task(plan: dict, task_id: str | None = None):
    """Find next pending task. Returns (plan, task) or (None, None)."""
    for task in plan["tasks"]:
        if task_id and task["id"] != task_id:
            continue
        if task["status"] == "pending":
            # Check depends_on - all dependencies must be complete
            deps = task.get("depends_on", [])
            if deps:
                all_done = all(
                    any(
                        t["id"] == dep and t["status"] == "complete"
                        for t in plan["tasks"]
                    )
                    for dep in deps
                )
                if not all_done:
                    continue
            return plan, task
    return None, None


def find_task(plan: dict, task_id: str):
    """Find any task by ID."""
    for task in plan["tasks"]:
        if task["id"] == task_id:
            return plan, task
    return None, None


# ---------------------------------------------------------------------------
# Prompt building
# ---------------------------------------------------------------------------


def build_prompt(plan: dict, task: dict, plan_path: Path) -> str:
    """Build the prompt for a task."""
    ac_text = "\n".join(f"- {ac}" for ac in task.get("acceptance_criteria", []))
    files_text = "\n".join(f"- {f}" for f in task.get("files", []))

    context_line = ""
    if AGENTS_MD_PATH:
        context_line = f"1. Read {AGENTS_MD_PATH} for project context and rules."

    verify_cmd_str = " ".join(VERIFY_CMD)

    return textwrap.dedent(
        f"""\
        You are implementing task {task["id"]}: {task["title"]}

        This is part of: {plan["title"]} ({plan["slug"]})
        Type: {plan["type"]}
        Context: {plan.get("context", "")}

        ## Acceptance Criteria

        {ac_text}

        ## Files likely affected

        {files_text}

        ## Instructions

        {context_line}
        2. Read the plan at {plan_path.relative_to(ROOT)} to understand the full scope.
        3. Check git log --oneline -10 for recent changes.
        4. Run `{verify_cmd_str}` to verify the baseline is clean before starting.
        5. For backend changes: follow TDD - write failing tests first, then implement.
           For frontend changes: implement directly, unit tests only for complex logic.
        6. Run `{verify_cmd_str}` after implementation to verify everything passes.
        7. Do NOT mark task {task["id"]} complete yourself; the harness does that
           only after evaluator PASS.
        8. Append concise session notes to .harness/progress.md.
        9. Do NOT create commits yourself. The harness runner creates required
           local implementation, evaluator-fix, and completion commits.

        ## Task Focus

        Implement ONLY task {task["id"]}: {task["title"]}
        Do NOT work on other tasks. If you find bugs, note them in progress.md.
    """
    )


def build_fix_prompt(plan: dict, task: dict, feedback: dict, plan_path: Path) -> str:
    """Build fix prompt for evaluator feedback."""
    issues_text = "\n".join(f"- {issue}" for issue in feedback.get("issues", []))
    ac_text = "\n".join(f"- {ac}" for ac in task.get("acceptance_criteria", []))

    context_line = ""
    if AGENTS_MD_PATH:
        context_line = f"1. Read {AGENTS_MD_PATH} for project context."

    verify_cmd_str = " ".join(VERIFY_CMD)

    return textwrap.dedent(
        f"""\
        You are fixing issues flagged by the evaluator for task {task["id"]}: {task["title"]}

        This is part of: {plan["title"]} ({plan["slug"]})

        ## Evaluator Feedback

        The evaluator found the following issues:

        {issues_text}

        Verdict summary:
        - make_check: {feedback.get("make_check", "UNKNOWN")}
        - acceptance_criteria: {feedback.get("acceptance_criteria", "UNKNOWN")}
        - test_coverage: {feedback.get("test_coverage", "UNKNOWN")}
        - no_placeholders: {feedback.get("no_placeholders", "UNKNOWN")}

        ## Acceptance Criteria

        {ac_text}

        ## Instructions

        {context_line}
        2. Read the plan at {plan_path.relative_to(ROOT)}.
        3. Fix EACH issue listed above. Do not skip any.
        4. Run `{verify_cmd_str}` to verify everything passes.
        5. Append notes about what you fixed to .harness/progress.md.

        ## Task Focus

        Fix ONLY the issues listed above for task {task["id"]}: {task["title"]}
        Do NOT work on other tasks or refactor unrelated code.
    """
    )


def build_verify_fix_prompt(task: dict, check_output: str, context_name: str) -> str:
    """Build a prompt to fix verification failures."""
    # Truncate output to avoid blowing context - keep the tail where errors are
    max_chars = 4000
    if len(check_output) > max_chars:
        check_output = "...(truncated)...\n" + check_output[-max_chars:]

    context_line = ""
    if AGENTS_MD_PATH:
        context_line = f"1. Read {AGENTS_MD_PATH} for project context."

    verify_cmd_str = " ".join(VERIFY_CMD)

    return textwrap.dedent(
        f"""\
        You are fixing verification failures (`{verify_cmd_str}`) for task {task["id"]}: {task["title"]}

        This is part of {context_name}.

        ## Verification Output

        `{verify_cmd_str}` failed with the following output:

        ```
        {check_output}
        ```

        ## Instructions

        {context_line}
        2. Analyze the errors above - identify which are lint, type, or test failures.
        3. Fix EACH failure. Common fixes:
           - Test failures: fix the implementation bug (not the test) unless the test is wrong.
           - Type errors: add or correct type annotations.
           - Lint errors: apply the formatting/style fix.
        4. Run `{verify_cmd_str}` to verify everything passes.
        5. Leave task state unchanged; the harness updates it after verification
           and evaluator PASS.

        ## Task Focus

        Fix ONLY the `{verify_cmd_str}` failures for task {task["id"]}: {task["title"]}
        Do NOT work on other tasks or refactor unrelated code.
    """
    )


# ---------------------------------------------------------------------------
# Execution helpers
# ---------------------------------------------------------------------------


def load_eval_feedback(task_id: str, slug: str | None = None) -> dict | None:
    """Load evaluator feedback for a task, if it exists."""
    if slug:
        feedback_path = FEEDBACK_DIR / f"{slug}_{task_id}.json"
        if feedback_path.exists():
            return json.loads(feedback_path.read_text())
    feedback_path = FEEDBACK_DIR / f"{task_id}.json"
    if feedback_path.exists():
        return json.loads(feedback_path.read_text())
    return None


def run_verification() -> tuple[bool, str]:
    """Run the verification command and return (passed, output)."""
    cmd_str = " ".join(VERIFY_CMD)
    print(f"\n-- Verification: {cmd_str} --")
    result = subprocess.run(
        VERIFY_CMD,
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    output = (result.stdout or "") + (result.stderr or "")
    if output.strip():
        print(output)
    return result.returncode == 0, output


def run_evaluator(
    task_id: str,
    plan_path: Path,
    *,
    agent_options: AgentOptions,
    auto_fix: bool = False,
    verbose: bool = False,
) -> bool:
    """Run the evaluator agent against the completed task."""
    print(f"\n-- Evaluator: task {task_id} --")
    baseline = changed_paths()
    cmd = [sys.executable, str(ROOT / ".harness" / "evaluator.py"), "--task", task_id]
    cmd.extend(["--plan", str(plan_path)])
    cmd.extend(["--agent", agent_options.agent])
    cmd.extend(["--codex-sandbox", agent_options.codex_sandbox])
    if agent_options.model:
        cmd.extend(["--model", agent_options.model])
    if agent_options.profile:
        cmd.extend(["--profile", agent_options.profile])
    if auto_fix:
        cmd.append("--fix")
    if verbose:
        cmd.append("--verbose")
    result = subprocess.run(
        cmd,
        cwd=ROOT,
        capture_output=False,
    )
    if not auto_fix:
        plan = load_plan(plan_path)
        allowed = harness_state_paths(plan_path, plan.get("slug"), task_id)
        changed_by_evaluator = sorted((changed_paths() - baseline) - allowed)
        if changed_by_evaluator:
            print("\nEvaluator left file changes in read-only mode:")
            for path in changed_by_evaluator:
                print(f"  - {path}")
            return False
    return result.returncode == 0


def run_agent_session(prompt: str, agent_options: AgentOptions) -> int:
    """Launch a headless implementation session with the given prompt."""
    print(f"\n-- Launching headless {agent_options.agent} implementation session --")
    result = launch_agent_session(
        prompt=prompt,
        options=agent_options,
        root=ROOT,
        allowed_tools="Bash,Read,Edit,Write,Glob,Grep",
        capture_output=False,
    )
    return result.returncode


def print_dry_run_agent(agent_options: AgentOptions) -> None:
    cmd = build_agent_command(
        options=agent_options,
        root=ROOT,
        allowed_tools="Bash,Read,Edit,Write,Glob,Grep",
    )
    print(f"\n[dry-run] Agent command: {format_command_for_display(cmd)}")


def update_plan_status(plan: dict) -> None:
    """Update top-level status based on task completion."""
    tasks = plan.get("tasks", [])
    if all(t["status"] == "complete" for t in tasks):
        plan["status"] = "complete"
    elif any(t["status"] in ("in_progress", "complete") for t in tasks):
        plan["status"] = "in_progress"


def print_status(plan: dict) -> None:
    """Print current task status."""
    done = sum(1 for t in plan["tasks"] if t["status"] == "complete")
    total = len(plan["tasks"])
    status = "DONE" if done == total else f"{done}/{total}"
    print(f"  {plan['slug']}: {plan['title']} [{status}]")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="Agent harness runner")
    parser.add_argument("--plan", required=True, help="Path to plan file")
    parser.add_argument("--task", help="Run a specific task by ID (e.g., 2)")
    parser.add_argument("--dry-run", action="store_true", help="Show what would run")
    parser.add_argument(
        "--skip-eval", action="store_true", help="Skip evaluator after task"
    )
    parser.add_argument(
        "--loop", action="store_true", help="Keep running tasks until done"
    )
    parser.add_argument(
        "--eval-only", metavar="TASK_ID", help="Run evaluator on a task (no build)"
    )
    parser.add_argument(
        "--fix", action="store_true", help="Allow evaluator to auto-fix issues"
    )
    parser.add_argument(
        "--verbose", action="store_true", help="Show full evaluator output"
    )
    parser.add_argument(
        "--agent",
        choices=["codex", "claude"],
        default="codex",
        help="Agent CLI to spawn for implementation and evaluation",
    )
    parser.add_argument("--model", help="Model to use for all spawned sessions")
    parser.add_argument(
        "--implementer-model", help="Model to use for implementation sessions"
    )
    parser.add_argument("--evaluator-model", help="Model to use for evaluator sessions")
    parser.add_argument("--profile", help="Codex profile to use for spawned sessions")
    parser.add_argument(
        "--codex-sandbox",
        choices=["workspace-write", "read-only", "danger-full-access"],
        default="workspace-write",
        help="Codex sandbox mode for spawned sessions",
    )
    args = parser.parse_args()

    implementer_options = AgentOptions(
        agent=args.agent,
        model=args.implementer_model or args.model,
        profile=args.profile,
        codex_sandbox=args.codex_sandbox,
    )
    evaluator_options = AgentOptions(
        agent=args.agent,
        model=args.evaluator_model or args.model,
        profile=args.profile,
        codex_sandbox=args.codex_sandbox,
    )

    plan_path = Path(args.plan)
    if not plan_path.is_absolute():
        plan_path = ROOT / plan_path

    if not plan_path.exists():
        print(f"Plan file not found: {plan_path}")
        sys.exit(1)

    plan = load_plan(plan_path)

    if not args.dry_run and not args.eval_only:
        assert_clean_worktree(plan)

    # --eval-only: just run the evaluator on an existing task
    if args.eval_only:
        _, task = find_task(plan, args.eval_only)
        if not task:
            print(f"Task {args.eval_only} not found in plan.")
            sys.exit(1)
        passed = run_evaluator(
            args.eval_only,
            plan_path,
            agent_options=evaluator_options,
            auto_fix=args.fix,
            verbose=args.verbose,
        )
        sys.exit(0 if passed else 1)

    while True:
        _, task = find_next_task(plan, task_id=args.task)
        context_name = f"{plan['title']} ({plan['slug']})"

        if not task:
            print("No pending tasks found.")
            break

        task_label = f"Task {task['id']}: {task['title']}"
        print(f"\n{'='*60}")
        print(task_label)
        print(f"Context: {context_name}")
        print(f"{'='*60}")

        if args.dry_run:
            print("\n[dry-run] Would execute this task. Prompt:")
            print_dry_run_agent(implementer_options)
            print(build_prompt(plan, task, plan_path))
            print("\n[dry-run] " + "\n".join(commit_lifecycle_lines()))
            if not args.loop:
                break
            task["status"] = "complete"
            continue

        task_start_baseline = changed_paths()

        # Mark task as in progress
        task["status"] = "in_progress"
        save_plan(plan, plan_path)

        # Run the implementation session
        prompt = build_prompt(plan, task, plan_path)
        exit_code = run_agent_session(prompt, implementer_options)

        if exit_code != 0:
            print(f"\nImplementation session exited with code {exit_code}")
            task["status"] = "pending"
            save_plan(plan, plan_path)
            sys.exit(1)

        # Run verification with retry loop
        verify_passed, check_output = run_verification()
        verify_retries = 0

        while not verify_passed and verify_retries < MAX_RETRIES:
            verify_retries += 1
            print(
                f"\n-- Verify retry {verify_retries}/{MAX_RETRIES}: feeding output back to generator --"
            )

            fix_prompt = build_verify_fix_prompt(task, check_output, context_name)
            fix_exit = run_agent_session(fix_prompt, implementer_options)
            if fix_exit != 0:
                print(f"\nFix session exited with code {fix_exit}")
                break

            verify_passed, check_output = run_verification()

        if not verify_passed:
            print(
                f"\nVerification still failing after {verify_retries} retries. Task NOT marked complete."
            )
            task["status"] = "pending"
            save_plan(plan, plan_path)
            sys.exit(1)

        try:
            commit_task_changes(
                plan=plan,
                task=task,
                plan_path=plan_path,
                baseline=task_start_baseline,
                subject=f"harness: implement {plan['slug']} task {task['id']}",
                body_lines=task_body(plan, task, plan_path),
                include_harness_state=False,
            )
        except RuntimeError as error:
            print(f"\n{error}")
            task["status"] = "pending"
            save_plan(plan, plan_path)
            sys.exit(1)

        post_implementation_baseline = changed_paths()

        # Run evaluator with retry loop
        if not args.skip_eval:
            eval_passed = run_evaluator(
                task["id"],
                plan_path,
                agent_options=evaluator_options,
                auto_fix=False,
                verbose=args.verbose,
            )
            retries = 0
            slug = plan.get("slug")

            while not eval_passed and retries < MAX_RETRIES:
                retries += 1
                print(
                    f"\n-- Retry {retries}/{MAX_RETRIES}: feeding evaluator issues back to generator --"
                )

                feedback = load_eval_feedback(task["id"], slug=slug)
                if not feedback or not feedback.get("issues"):
                    print("No actionable feedback found. Cannot retry.")
                    break

                fix_prompt = build_fix_prompt(plan, task, feedback, plan_path)
                fix_exit = run_agent_session(fix_prompt, implementer_options)
                if fix_exit != 0:
                    print(f"\nFix session exited with code {fix_exit}")
                    break

                verify_ok, _ = run_verification()
                if not verify_ok:
                    print("\nVerification failed after fix attempt.")
                    break

                try:
                    commit_task_changes(
                        plan=plan,
                        task=task,
                        plan_path=plan_path,
                        baseline=post_implementation_baseline,
                        subject=(
                            f"harness: address evaluation for "
                            f"{plan['slug']} task {task['id']}"
                        ),
                        body_lines=feedback_body(plan, task, plan_path, feedback),
                        include_harness_state=False,
                    )
                except RuntimeError as error:
                    print(f"\n{error}")
                    break
                post_implementation_baseline = changed_paths()

                eval_passed = run_evaluator(
                    task["id"],
                    plan_path,
                    agent_options=evaluator_options,
                    auto_fix=False,
                    verbose=args.verbose,
                )

            if not eval_passed:
                print(
                    f"\nEvaluator still failing after {retries} retries. Task NOT marked complete."
                )
                task["status"] = "pending"
                save_plan(plan, plan_path)
                sys.exit(1)

        # Mark complete
        task["status"] = "complete"
        update_plan_status(plan)
        save_plan(plan, plan_path)

        try:
            commit_task_changes(
                plan=plan,
                task=task,
                plan_path=plan_path,
                baseline=set(),
                subject=f"harness: complete {plan['slug']} task {task['id']}",
                body_lines=task_body(plan, task, plan_path),
                include_harness_state=True,
            )
        except RuntimeError as error:
            print(f"\n{error}")
            task["status"] = "pending"
            save_plan(plan, plan_path)
            sys.exit(1)

        print(f"\nTask {task['id']} completed successfully.")

        # Reload plan in case the agent modified it
        plan = load_plan(plan_path)

        if not args.loop:
            break
        if args.task:
            break

    # Final status
    plan = load_plan(plan_path)
    print_status(plan)


if __name__ == "__main__":
    main()
