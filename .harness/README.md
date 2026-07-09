# Agent Harness

Local orchestration for turning feature requests, bugs, and improvements into verified portfolio changes.

## How It Works

```
User feedback -> Triage -> Clarify -> Plan -> Execute -> Verify -> Evaluate -> Done
```

Use the `harness` skill interactively for planning and execution discipline. The optional headless runner can batch through plan tasks, but it currently launches Claude Code directly; broader agent launch support is a later improvement.

## Files

| File                | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `plans/{slug}.json` | Per-ticket plans with tasks and inline acceptance criteria |
| `progress.md`       | Durable session notes and follow-up findings              |
| `runner.py`         | Headless executor + evaluator orchestrator                |
| `evaluator.py`      | Skeptical evaluator session launcher                      |
| `eval_feedback/`    | Evaluator verdict JSONs                                   |

## Verification

The project verification command is:

```bash
npm run verify
```

It runs linting, TypeScript, a production build, and Playwright smoke tests:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

Playwright uses `npm run start` against the production build. Run `npm run build` before `npm run test:e2e` when executing the smoke tests directly.

## Interactive Workflow

1. Read all feedback before acting.
2. Triage each item as `bug`, `feature`, `improvement`, or `chore`.
3. Ask only for clarification that cannot be discovered from the repo.
4. Create `.harness/plans/{slug}.json` with focused tasks and acceptance criteria.
5. Implement one task at a time.
6. Run `npm run verify`.
7. Use an independent evaluator/review pass before marking a task complete.
8. Append notes to `.harness/progress.md`.

Frontend work does not require TDD by default. Add or update tests when acceptance criteria involve navigation, user flows, accessibility behavior, complex state, data transformation, or regression-prone logic.

## Headless Runner

```bash
python3 .harness/runner.py --plan .harness/plans/{slug}.json
python3 .harness/runner.py --plan .harness/plans/{slug}.json --loop
python3 .harness/runner.py --plan .harness/plans/{slug}.json --task 2
python3 .harness/runner.py --plan .harness/plans/{slug}.json --dry-run
python3 .harness/runner.py --plan .harness/plans/{slug}.json --eval-only 1
```

The runner verifies with `npm run verify`, runs the evaluator, and only marks a task complete after evaluator PASS. If verification or evaluation fails after retries, it resets the task to `pending` and exits non-zero.

The runner requires a clean worktree before execution and creates local-only commits with its own small git adapter:

1. `harness: implement {slug} task {id}` after implementation verification passes.
2. `harness: address evaluation for {slug} task {id}` only when evaluator-driven fixes were needed and verified.
3. `harness: complete {slug} task {id}` after evaluator PASS and harness state updates.

If the worktree is dirty, commit or stash those changes before running the harness. The runner stages explicit changed paths for each phase and never pushes or opens PRs.

Interactive agents can use a commit skill or their normal git workflow when the user requests commits. The headless runner does not depend on an ambient commit skill because it needs deterministic, agent-neutral local commits.

## Evaluator Notes

The evaluator checks:

- `npm run verify` passes.
- Acceptance criteria are implemented and wired into the app.
- Tests are meaningful for the behavior under review.
- Implementation files do not contain unfinished placeholders.
- Test timing is noted for TDD awareness when relevant.
- Harness implementation commits before evaluation and evaluator-fix commits after review are expected runner history, not failures by themselves.

Placeholder checks should focus on unfinished implementation markers such as `TODO`, `FIXME`, `throw new Error("Not implemented")`, `NotImplementedError`, or empty stubs. Do not fail normal JSX/TypeScript spread syntax or legitimate form placeholder copy.

## Plan Format

Per-ticket plans use this structure:

```json
{
  "slug": "improve-homepage-nav",
  "title": "Improve homepage navigation",
  "type": "improvement",
  "created": "2026-06-17",
  "status": "planned",
  "context": "Why this work is needed",
  "tasks": [
    {
      "id": "1",
      "title": "Add keyboard-safe navigation behavior",
      "status": "pending",
      "acceptance_criteria": [
        "Primary nav links are reachable by keyboard in visual order"
      ],
      "files": ["src/app/(marketing)/_components/site-header.tsx"],
      "depends_on": []
    }
  ]
}
```

Plans are kept in `.harness/plans/` as historical records.
