# Session Protocol

Follow this lifecycle for each task in a plan.

## 1. Orient

1. Read the plan file (`.harness/plans/{slug}.json`) for the current task
2. Read `.harness/progress.md` for prior session notes
3. Run `git log --oneline -10` for recent changes
4. Identify the next pending task - respect `depends_on` ordering

## 2. Verify Baseline

Run `npm run verify` before changing anything. If it fails, fix regressions first. Do not start new work on a broken baseline.

## 3. Implement

### Backend (TDD required)

1. **Write failing tests first** based on the task's `acceptance_criteria`
2. **Implement** the minimum code to make tests pass
3. **Refactor** if needed while keeping tests green
4. Run verification to confirm

### Frontend (targeted tests)

Implement directly. Add or update tests when acceptance criteria involve navigation, user flows, accessibility behavior, complex state, data transformations, or regression-prone logic. Prefer Playwright for browser-visible portfolio behavior.

### Rules

- **No unfinished implementation placeholders.** Every function must be fully implemented, not stubbed with markers such as `TODO`, `FIXME`, `throw new Error("Not implemented")`, or empty bodies. Normal JSX/TypeScript spread syntax and user-facing form placeholder copy are allowed.
- **No temp files.** Keep artifacts in memory or use proper storage.
- **Search before implementing.** Check if similar code already exists with Grep/Glob.
- **One task per session.** Stay focused. Note unrelated bugs in progress.md.
- **Document reasoning.** Add comments explaining _why_, not _what_.

- **Docs by relevance.** Use `AGENTS.md` as the project map and read only the docs needed for the current task.
- **Next.js 16.** Before changing Next APIs, routing, config, rendering, metadata, build behavior, or file conventions, read the relevant guide in `node_modules/next/dist/docs/`.
- **UI quality.** Preserve WCAG 2.2 AA, static rendering where practical, and the existing lightly game-inspired professional visual language.

## 4. Evaluate (mandatory - do NOT skip)

After verification passes, spawn an **evaluator subagent** before marking the task complete. See SKILL.md S5 for the subagent template and hard gate rules.

**Do NOT self-evaluate.** The executor is biased toward passing its own work. The subagent evaluates in a fresh context with no sunk-cost pressure.

- If the evaluator returns PASS -> proceed to step 5
- If the evaluator returns FAIL -> fix the flagged issues, re-run verification, spawn a new evaluator subagent. Max 2 retry cycles.

## 5. Update State

1. Mark the task `"complete"` in the plan JSON file - **only after evaluator PASS**
2. If all tasks are complete, set the plan's top-level `status` to `"complete"`
3. **Commit** - use the current agent's normal git workflow when the user requests commits.
4. Append session notes to `.harness/progress.md`

### Session Notes Format

```markdown
## YYYY-MM-DD - {slug}: Task {id} - {title}

- What was implemented
- Key decisions and why
- Evaluator verdict (PASS on first try / PASS after N retries / issues found)
- Bugs found (if any)
- What to work on next
```
