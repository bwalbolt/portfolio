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

## 2026-07-16 - improve-homepage-shell-hero: Task 1 - Apply the homepage background and hero cutaway treatment

- Added the homepage foundation background using `--color-background` with `/images/nnnoise.svg` as a low-opacity overlay.
- Reworked the hero cutaway to use the same background/noise treatment with a clipped angled polygon matching the Figma rotated-rectangle transition.
- Made the lower homepage section stack transparent so the shared page foundation remains continuous across the hero transition.
- Added a Playwright CSS contract test that checks the background, noise layer, transparent stack, and cutaway polygon at desktop, tablet, and mobile widths.
- Verification: `npm run verify` passed.
- Evaluator verdict: PASS after 2 retries; earlier retries requested automated coverage and stronger responsive/clip-path assertions.
- Bugs found: none.
- Next task: update fixed navigation and top hero gradient behavior.

## 2026-07-16 - improve-homepage-shell-hero: Task 1 feedback - Body background and direct hero clip

- Moved the baked `/images/nnnoise.svg` background to `body` with `--color-background` and removed the old body radial gradients.
- Removed homepage-owned noise/overlay styling so page sections let the body background show through directly.
- Removed the `heroCutaway` element and applied the angled `clip-path` directly to the hero.
- Tightened the Playwright CSS contract to verify body ownership, no gradient/blend/pseudo overlay, no higher-level background images, no cutaway node, and direct hero clipping at desktop, tablet, and mobile widths.
- Verification: `npm run verify` passed.
- Evaluator verdict: PASS after 1 retry; the retry strengthened negative assertions for gradients, overlays, and higher-level background ownership.

## 2026-09-18 - improve-homepage-shell-hero: Task 2 - Update fixed navigation and top hero gradient behavior

- Fixed the homepage navigation over the hero with a 54px bar matching the Figma composition while leaving non-homepage headers in normal document flow.
- Kept the mobile header transparent at the top, added a passive scroll-aware black surface transition, and added a hero-owned black-to-transparent gradient that remains fully black behind the navigation.
- Expanded Playwright coverage for desktop spacing and collision avoidance, mobile transparent/scrolled states, the hero gradient, mobile menu hydration, and visible keyboard focus.
- Verification: `PORT=3101 npm run harness:verify` and evaluator verification via `CI=1 PORT=3102 npm run verify` passed with 9 Playwright tests. A pre-existing server on port 3000 was left untouched.
- Evaluator verdict: PASS on first try.
- Bugs found: none.
- Next task: match hero sizing, headline position, and scroll indicator spacing.

## 2026-09-18 - improve-homepage-shell-hero: Task 3 - Match hero sizing, headline position, and scroll indicator spacing

- Matched the responsive hero composition to Figma with a fixed 400px mobile frame and a 95vh desktop hero, centering the headline within the desktop hero area.
- Positioned the desktop scroll indicator near the Figma reference at the lower edge of the hero and kept it hidden on mobile.
- Removed the mobile headline max-width constraint and moved gradient ownership to each full-width headline line so the highlighted words sample shared color stops rather than restarting their own gradients.
- Added Playwright coverage for desktop hero geometry, exact gradient colors/stops, per-word gradient removal, and fixed mobile sizing across two viewport heights.
- Verification: `CI=1 PORT=3102 npm run verify` passed with 10 Playwright tests. The isolated port avoided a user-owned server already listening on port 3000.
- Evaluator verdict: PASS after 1 retry; the first review requested exact gradient-stop assertions and a second mobile viewport height.
- Bugs found: none. The apparent mobile hydration failure on the default verification port was caused by Playwright reusing the existing port-3000 server while the build output changed.
- Next task: none; the plan is complete.
