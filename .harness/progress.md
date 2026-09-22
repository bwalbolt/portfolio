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

## 2026-09-20 - fix-isolated-verification: Task 1 - Isolate verification runtime and document narrow approvals

- Replaced the chained verification script with a Node wrapper that builds into `.next-verify`, selects an available loopback port, and launches Playwright without attaching to an existing server.
- Added success/failure cleanup for the isolated build and snapshot/restore protection for `next-env.d.ts` and `tsconfig.json`, which Next.js can rewrite when using a custom `distDir`.
- Made Playwright server reuse opt-in via `PLAYWRIGHT_REUSE_EXISTING_SERVER=1` and updated agent, architecture, and harness documentation around the safe defaults.
- Documented a narrow Codex rule for the repository's named npm verification scripts, explicitly avoiding broad `npm`, `node`, or `node -e` allowlists and full-access mode.
- Verification: `npm run verify` passed with 10 Playwright tests on dynamically selected ports while the existing port-3000 server retained PID 76918; `.next-verify` was removed and generated config hashes were unchanged.
- Evaluator verdict: PASS on the completed implementation. The evaluator also forced a failure and confirmed cleanup/restoration still ran; TDD was WARN because runtime behavior was exercised directly rather than through a dedicated wrapper unit test.
- Bugs found: custom Next.js `distDir` builds rewrite generated TypeScript config references unless explicitly restored.
- Next task: none.

## 2026-09-20 - improve-homepage-about-links: Task 1 - Resize read-more arrows and align mobile view-all links

- Sized homepage read-more arrows to 16px with a 4px label gap, reusing the existing glyph that matches the Figma asset.
- Centered both mobile View all links with a 24px gap above and 8px label/icon gap. Matched callout separation to 64px on mobile and 48px on desktop, with 80px before About Me.
- Used Figma design context and screenshots from desktop `1:549` and mobile `79:219` in file `0J2JF0nYrI8EJrttdHNes4`. Kept unrelated section spacing and shared icon styles intact.
- Added browser geometry assertions at 390, 640, 768, and 1280px for arrow size, link visibility/alignment, and spacing.
- Verification: baseline passed; implementation and independent evaluator `npm run verify` passed with 11 Playwright tests. The sandboxed CSS build stalled; rerunning full verification with narrow escalation passed. `git diff --check` passed.
- Evaluator verdict: PASS on first try; frontend implementation and regression coverage were added together, with a non-blocking TDD history warning.
- Bugs found: none.
- Next task: task 2, rework About Me image, paragraph, and mobile layout. Tasks 2 and 3 remain pending.

## 2026-09-20 - improve-homepage-about-links: Task 2 - Rework About Me image, paragraph, and mobile layout

- Removed the gradient overlay from the mosaic and added a paragraph-owned white backdrop with 40px blur and 20px outset, matching Figma nodes `29:204` and `79:308`. The design uses a blurred white fill rather than a literal linear gradient. Isolated the backdrop behind the copy so it cannot wash out the heading.
- Consolidated the existing copy into one paragraph, matched 18px body text and responsive heading sizes, and centered the 160 × 179px mobile portrait. Applied a -6° frame skew and inverse image skew with uniform scaling to keep the portrait unwarped.
- Kept tablet intro content stacked until 1024px, expanded the mobile mosaic across tablet width, and matched the desktop portrait dimensions and intro columns. Skill-card changes remain scoped to task 3.
- Added responsive browser checks and inspected screenshots at 390, 768, and 1280px for paragraph structure, backdrop styling, transform cancellation, centering, image loading, and overflow.
- Verification: baseline and final `npm run verify` passed; independent evaluator verification passed lint, TypeScript, static production build, and all 12 Playwright tests. `git diff --check` passed.
- Evaluator verdict: PASS on first review; frontend implementation and regression coverage were added together, with a non-blocking TDD history warning.
- Bugs found: visual review caught blur overlapping the heading and a narrow tablet mosaic; both were corrected before completion.
- Next task: task 3, restyle About Me skill cards. The plan remains in progress.

## 2026-09-21 - improve-responsive-breakpoints: Task 1 - Document and normalize responsive breakpoints

- Documented preferred 30rem, 48rem, 62rem, and 80rem thresholds in DESIGN.md and linked the strategy from AGENTS.md. Defined mobile-first range syntax, larger-bucket boundary ownership, fluid sizing, image sizes alignment, and commented bespoke exceptions without adding dependencies or a checker.
- Converted existing width conditions to native ranges, preserved 48rem transitions, moved About desktop layout and portrait sizes to 62rem, and limited the mobile mosaic to widths below 30rem.
- Extended browser checks to 390px and immediately below, at, and above 480, 768, 992, and 1280px, covering navigation visibility, About geometry, artwork selection/loading, and horizontal overflow. Reviewed full-page screenshots at 390, 768, and 1280px plus the About layout at 992px.
- Verification: baseline, implementation, and independent evaluator npm run verify passed lint, TypeScript, static production build, and all 13 Playwright tests. git diff --check passed.
- Evaluator verdict: PASS on first review; non-blocking TDD chronology warning because implementation and test changes remain uncommitted.
- Unrelated follow-up: existing tablet case-study artwork crowds text, and the contact form inputs are narrow around 768px. Retained the approved 48rem transitions; consider these in a separate tablet-layout refinement.
- Next task: none for this plan.

## 2026-09-22 - improve-responsive-breakpoints: Task 2 - Remove redundant above-breakpoint test iterations

- Removed 481, 769, 993, and 1281px from the shared responsive width list at the user's request. Both loops now run nine widths: representative 390px mobile plus immediately below and at each threshold. Existing assertions remain intact.
- Updated the list comment and plan criteria to reflect the reduced coverage.
- Verification: implementation and independent evaluator npm run verify passed lint, TypeScript, production build, and all 13 Playwright tests. Evaluator verdict: PASS, no issues.
- Next task: none for this plan.
