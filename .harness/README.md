# Agent Harness

Local orchestration for turning feature requests, bugs, and improvements into verified portfolio changes.

## How It Works

```
User feedback -> Triage -> Clarify -> Plan -> Execute -> Verify -> Evaluate -> Done
```

Use the `harness` skill interactively for planning and execution discipline. Interactive Codex sessions are still the most transparent path for this repo, and the optional headless runner can batch through plan tasks by spawning Codex sessions by default. Claude support is available with `--agent claude` on machines where Claude Code is installed.

## Files

| File                | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `plans/{slug}.json` | Per-ticket plans with tasks and inline acceptance criteria |
| `progress.md`       | Durable session notes and follow-up findings              |
| `runner.py`         | Headless executor + evaluator orchestrator                |
| `evaluator.py`      | Skeptical evaluator session launcher                      |
| `eval_feedback/`    | Evaluator verdict JSONs                                   |

For the short architecture and verification map, start with `ARCHITECTURE.md`.

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

The default verification command is self-isolating:

- it builds into the dedicated `.next-verify` directory instead of `.next`, so a running `next dev` or `next start` process is not invalidated;
- it asks the operating system for an available loopback port instead of assuming port 3000;
- it forces Playwright to start the production server for that build rather than reusing an unrelated process; and
- it removes the isolated build directory and restores Next.js-generated config files after either success or failure.

In Codex's managed sandbox, Turbopack can fail during `next build` because its worker path attempts a local port bind. Use the sandbox-friendly non-browser check for fast feedback:

```bash
npm run verify:sandbox
npm run harness:check:sandbox
```

These commands use `next build --webpack`, which is a supported Next.js 16 build mode, and avoid starting a browser server. They do not replace full browser verification.

For targeted harness browser work, use an explicit free port:

```bash
PORT=3101 npm run harness:test:e2e
```

`npm run harness:verify` is an alias of `npm run verify` and therefore chooses its own available port. Direct Playwright runs target `BASE_URL` or `http://127.0.0.1:$PORT` and refuse to reuse an existing server by default. Set `PLAYWRIGHT_REUSE_EXISTING_SERVER=1` only for an intentional test against a server you started yourself.

Playwright keeps browser QA evidence in ignored output directories: traces are retained on first retry and screenshots are captured on failure. For UI bugs, reproduce the issue with Playwright, inspect the DOM or screenshot evidence, implement the fix, then re-run the same browser path.

Full browser verification needs permission to bind a loopback port and launch Chromium. Keep Codex in `workspace-write` / on-request mode and add a narrow command rule instead of enabling full access. For example, place this in `~/.codex/rules/default.rules`, then restart Codex:

```python
prefix_rule(
    pattern = ["npm", "run", ["verify", "verify:sandbox", "harness:verify", "harness:test:e2e", "test:e2e"]],
    decision = "allow",
    justification = "Allow this portfolio's test and verification scripts outside the sandbox",
    match = [
        "npm run verify",
        "npm run verify:sandbox",
        "npm run harness:verify",
        "npm run harness:test:e2e",
        "npm run test:e2e",
    ],
    not_match = [
        "npm run start",
        "node -e arbitrary-code",
    ],
)
```

Check the rule before relying on it:

```bash
codex execpolicy check --pretty \
  --rules ~/.codex/rules/default.rules \
  -- npm run verify
```

Codex rules match argument prefixes, so keep the allowed npm script names specific and do not allow broad prefixes such as `npm`, `node`, or `node -e`. See the [official Codex rules documentation](https://learn.chatgpt.com/docs/agent-configuration/rules).

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

The headless runner and evaluator spawn Codex by default and pass prompts through stdin. Model selection inherits the Codex CLI configuration unless you pass `--model`, `--implementer-model`, or `--evaluator-model`; Codex profiles can be selected with `--profile`.

The Codex adapter uses the current CLI contract: ephemeral sessions, an explicit `approval_policy = "never"` override for non-interactive runs, the requested sandbox mode, and the Codex runtime directory as an additional writable root so evaluator startup does not require a separate approval just to update its state database. Evaluator sessions remain practical read-only: the prompt disallows edits and the harness rejects unexpected worktree changes.

```bash
python3 .harness/runner.py --plan .harness/plans/{slug}.json
python3 .harness/runner.py --plan .harness/plans/{slug}.json --loop
python3 .harness/runner.py --plan .harness/plans/{slug}.json --task 2
python3 .harness/runner.py --plan .harness/plans/{slug}.json --dry-run
python3 .harness/runner.py --plan .harness/plans/{slug}.json --eval-only 1
python3 .harness/runner.py --plan .harness/plans/{slug}.json --agent codex --model gpt-5.5
```

The runner verifies with the isolated `npm run verify`, runs the evaluator, and only marks a task complete after evaluator PASS. If verification or evaluation fails after retries, it resets the task to `pending` and exits non-zero.

The runner requires a clean worktree before execution and creates local-only commits with its own small git adapter:

1. `harness: implement {slug} task {id}` after implementation verification passes.
2. `harness: address evaluation for {slug} task {id}` only when evaluator-driven fixes were needed and verified.
3. `harness: complete {slug} task {id}` after evaluator PASS and harness state updates.

If the worktree is dirty, commit or stash those changes before running the harness. The runner stages explicit changed paths for each phase and never pushes or opens PRs. In non-fix mode, the evaluator is practical read-only: it may run checks, but the harness fails evaluation if the evaluator leaves file changes behind.

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
