# Progress Notes

Session notes are appended here after each completed task.

<!-- Format:
## YYYY-MM-DD - {slug}: Task {id} - {title}

- What was implemented
- Key decisions and why
- Evaluator verdict (PASS on first try / PASS after N retries / issues found)
- Bugs found (if any)
- What to work on next
-->

## 2026-07-09 - harness-readiness: Task 1 - Practical v1 setup

- Added isolated harness verification scripts that run Playwright against an explicit port.
- Updated Playwright to respect `PORT` and `BASE_URL`, avoid server reuse during harness runs, and retain screenshot/trace evidence for browser QA.
- Added `ARCHITECTURE.md` as the short agent map and linked it from harness-facing docs.
- Documented that interactive Codex sessions are the primary path today; the checked-in headless runner remains Claude-specific until a future portability task.
- Added sandbox-friendly verification scripts using `next build --webpack` for non-browser checks when managed sandboxing blocks Turbopack port binding.

## 2026-07-09 - improve-root-design-md: Task 1 - Document the implemented design system

- Added root `DESIGN.md` following Google's DESIGN.md structure with YAML front matter for colors, typography, spacing, rounding, and component examples.
- Grounded guidance in the implemented `globals.css`, marketing CSS modules, local fonts, content records, and UI documentation.
- Kept the Figma file as a comparison source for future exact-fidelity work, but did not need to pull it for this code-grounded documentation pass.
- Verification: `npx --yes @google/design.md lint DESIGN.md` reported 0 errors and unused-token warnings only; `npm run verify:sandbox` passed.
- Evaluator verdict: local PASS because the current sub-agent tool policy disallows spawning without explicit user delegation.

## 2026-07-09 - improve-root-design-md: Follow-up - Link DESIGN.md from AGENTS.md

- Added `DESIGN.md` to the `AGENTS.md` "Where To Look" list so future agents consult the implemented design system tokens and visual guardrails during UI work.
- Verification: `npm run verify:sandbox` passed.
