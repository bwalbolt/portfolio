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

## 2026-09-22 - improve-homepage-about-links: Task 3 - Restyle About Me skill cards to match Figma

- Matched the Figma skill-card treatment with square corners, 4px skill-colored left borders, the existing translucent black elevated surface, 8px backdrop blur, and 16px spacing between cards.
- Kept cards stacked and paragraph-width through tablet, then aligned a three-column grid to the desktop paragraph column at 62rem. Equalized implicit grid rows so differing copy lengths produce equal-height cards at every viewport.
- Added browser coverage across all nine shared responsive widths for paragraph alignment, exact borders and colors, surface styling, equal heights, mobile separation, and horizontal overflow.
- Verification: baseline and final `npm run verify` passed lint, TypeScript, production build, and all 14 Playwright tests. `git diff --check` passed.
- Evaluator verdict: PASS after 1 retry; the first review found that equal height only held on desktop, prompting equal implicit rows and all-breakpoint height assertions.
- Bugs found: none.
- Next task: none; the plan is complete.

## 2026-09-22 - improve-homepage-lower-sections: Task 1 - Match testimonial quote styling across desktop and mobile

- Matched the Figma testimonial treatment with a mobile-first white quote and a desktop-only gradient fill plus approximately 7px white outline. Kept the outline in a separate aria-hidden layer so the browser cannot paint it over the readable gradient.
- Matched desktop attribution sizing, kept tablet on the mobile quote treatment until the 62rem desktop bucket, and added padding/spacing that keeps the quote and attribution separated across responsive layouts.
- Added browser coverage at 390, 768, 991, 992, and 1280px for quote colors, outline state, stroke size, breakpoint ownership, typography, vertical separation, and horizontal overflow. Narrowly repaired the stale About paragraph locator that made the baseline verification fail after the prior skill-card changes.
- Verification: `npm run verify` passed lint, TypeScript, production build, and all 15 Playwright tests. `git diff --check` passed.
- Evaluator verdict: PASS after 2 retries; the first review found the direct stroke obscured the gradient, and the follow-up review requested softer outline/readability and breakpoint-edge coverage. The final evaluator found no blocking issues; TDD chronology remains a warning because changes are uncommitted.
- Bugs found: none.
- Next task: task 2, align contact form background and mobile gutters with Figma.

## 2026-09-22 - improve-homepage-lower-sections: Task 1 feedback - Align quote outline and restore full opacity

- Corrected the desktop outline offset caused by positioning the absolute outline layer at the parent edge while the gradient layer was inset by 7px of padding. The outline now uses the same 7px inset, so both text layers share identical geometry.
- Removed the unjustified `0.82` opacity; the Figma white stroke now renders at full opacity.
- Added browser assertions at the 62rem boundary and desktop width that compare the outline and gradient bounding boxes exactly and require opacity `1`.
- Verification: `npm run verify` passed lint, TypeScript, production build, and all 15 Playwright tests. `git diff --check` passed.
- Evaluator verdict: PASS on first review with no issues.
- Next task: task 2, align contact form background and mobile gutters with Figma.

## 2026-09-22 - improve-homepage-lower-sections: Task 2 - Align contact form background and mobile gutters with Figma

- Added a desktop-only 345 × 274px `bg-flare` treatment from the 690 × 548px asset, positioned above the contact form and hidden below the desktop bucket to avoid mobile/tablet seams or overflow.
- Removed the mobile form inset so fields use only the site gutter, and aligned social-link copy to the availability content with a 26px inset accounting for the availability card border.
- Added browser coverage at 390, 768, 992, and 1280px for flare visibility and geometry, responsive gutters, text alignment, focus styling, label IDs, and horizontal overflow. Also corrected the pre-existing 7px testimonial stroke regression before task verification.
- Verification: `npm run verify` passed with 16 Playwright tests. `git diff --check` passed.
- Evaluator verdict: PASS on first try; the evaluator noted only a non-blocking TDD chronology warning because task 2 remains uncommitted.
- Bugs found: none.
- Next task: task 3, tighten footer height, typography, and mobile logo behavior.

## 2026-09-22 - harness: Update Codex evaluator adapter for the current CLI

- Replaced the removed `--ask-for-approval never` flag with the current `--config approval_policy="never"` override, while preserving the requested sandbox mode.
- Added ephemeral sessions and the configured Codex runtime directory as an additional writable root so nested evaluator startup can update its state without broad project access or a user approval prompt.
- Adapter command assertions and a smoke Codex launch passed. `npm run verify` passed with all 16 Playwright tests.
- The full evaluator entrypoint started with the corrected command but its model session stalled before producing a verdict and was interrupted; this was no longer a permissions or obsolete-flag failure.
- Independent adapter review: PASS; no issues found.
- Next task: task 3, tighten footer height, typography, and mobile logo behavior.

## 2026-09-22 - improve-homepage-lower-sections: Task 2 follow-up - Restore quote outline stroke and adjust contact flare position

- Restored the desktop testimonial outline to the requested `0.8rem` stroke while retaining the separate z-indexed outline layer and matching inset so the gradient text remains readable and aligned.
- Adjusted the desktop contact flare to `width: 21rem`, `top: -4rem`, and `right: 16rem`, with the aspect-ratio-based height assertion kept responsive.
- Updated the browser contracts for the 12.8px computed stroke and the revised flare geometry.
- Verification: `npm run verify` passed with 16 Playwright tests. `git diff --check` passed.
- Evaluator verdict: PASS on first try; no functional issues found. TDD chronology remains a non-blocking warning because the follow-up is uncommitted.
- Bugs found: none.
- Next task: task 3, tighten footer height, typography, and mobile logo behavior.

## 2026-09-22 - improve-homepage-lower-sections: Task 3 - Tighten footer height, typography, and mobile logo behavior

- Removed the homepage section stack's bottom padding so the contact section flows directly into the footer without an extra gap.
- Matched Figma footer geometry with a 116px mobile footer that hides the brand block and a 124px desktop footer with a 24px Brent Walbolt mark and 48px vertical padding.
- Made footer links block-level to preserve the exact mobile line-box height while keeping the existing semantic navigation and focus behavior.
- Added browser coverage for footer height, contact/footer adjacency, brand visibility and typography, mobile/desktop padding, navigation visibility, and keyboard focus.
- Verification: `npm run verify` passed with 17 Playwright tests. `git diff --check` passed.
- Evaluator verdict: PASS on first try; no issues found. TDD chronology remains a non-blocking warning because implementation and test changes are uncommitted.
- Bugs found: none.
- Next task: none; the plan is complete.

## 2026-09-23 - feat-linked-panel-hover: Task 1 - Interactive linked insight panels

- Added reusable `LinkedPanelCard` with an explicit destination and descriptive native stretched link. Integrated insight cards only, retaining server-rendered content and ordinary panel behavior.
- Matched Figma node 65:111 with an opaque hover surface, white border, amber shadow, fixed 32px amber glow and proportional pink glow. Isolated zero-index decorations fade behind the surface without showing through it.
- Added nearest-edge projection and synchronized 180ms perimeter motion with frame-based DOM updates, resize/scroll handling and cleanup. Keyboard and reduced-motion feedback use static top-left glows; touch and no-JavaScript navigation stay native.
- Added five browser tests covering mirrored corners, rendered perimeter frames, geometry, hit targets, modifier-click, keyboard, reduced motion, responsive resize/scroll, touch and no-JavaScript navigation. Updated the existing link selector for descriptive accessible names and documented component usage in DESIGN.md.
- Verification: baseline passed 17 tests. Implementation and independent evaluator each passed `npm run verify` with all 22 tests; static prerendering preserved. A sandboxed build stalled and was interrupted; approved full verification outside the sandbox passed. `git diff --check` passed.
- Visually inspected the 384x214 reference screenshot against Figma: matching corner positions, glow softness, border, opaque mask and shadow. Evidence: test-results/linked-panel-linked-panels-de7e3-imeter-and-mask-their-glows-chromium/linked-panel-reference.png (ignored test output).
- Independent evaluator: PASS; no concrete implementation defects. Optional supplemental geometry-server inspection was aborted after waiting for approval; required verification and review were complete.
- Next task: none; plan complete. Changes are uncommitted.

## 2026-09-23 - improve-linked-panel-tracking: Task 1 - Immediate radial tracking

- Replaced the 180ms positional tween and nearest-edge projection with synchronous center-to-pointer ray projection in normalized panel coordinates. Each diagonal arm now maps to its corner at every distance from the center; exact center retains the previous position (initially top-left).
- Both ellipses share the projected fractions. Removed the animation loop and obsolete perimeter interpolation helpers. Border/fade transitions and the opaque exit mask remain intact.
- Simplified pink ::before to 54% width, 76% height, 46% horizontal travel, and 5% vertical inset plus 14% travel. Amber remains 32px square.
- Updated DESIGN.md and browser regressions: same-task assertions reject positional delays, twelve diagonal samples reach all four corners, intermediate directions stay on edges, and center retains its position. Existing navigation/accessibility/responsive coverage remains green.
- Baseline, revised implementation, and independent evaluator each passed npm run verify with all 22 tests. git diff --check passed. Inspected the updated reference screenshot; rounded proportions retain the intended glow treatment.
- Independent evaluator verdict: PASS. No functional issues; uncommitted chronology noted as a nonblocking TDD warning.
- Next task: none; follow-up plan complete. Changes are uncommitted.

## 2026-09-25 - feat-contact-pulsing-border: Task 1 - Contact shader

- Replaced the homepage contact flare with Paper Pulsing Border, pinned @paper-design/shaders 0.0.81. Used the core ShaderMount API in a small client boundary; homepage and form remain statically rendered.
- Preserved supplied visual settings, with responsive form-relative canvas dimensions instead of fixed 1280x720 CSS dimensions. Capped rendering to 921,600 pixels; isolated uniforms support future field-focus interactions without forking GLSL.
- Lazy-load near contact; Paper pauses offscreen/hidden-document animation. CSS glow remains for reduced motion, unavailable WebGL, context loss, and disabled JavaScript. Cleanup disposes mount and listeners.
- Inspected desktop/mobile screenshots and corrected stacking contexts so screen blending does not introduce a black canvas rectangle or obscure social links. Documented the integration in DESIGN.md.
- Verification: baseline passed 22 tests; implementation passed 26 tests, lint, typecheck, and static production build. Independent evaluator PASS after an unchanged verification rerun; git diff --check passed.
- Unrelated finding: evaluator's initial run intermittently failed existing linked-panel.spec.ts:124 hover positioning; unchanged rerun passed all 26 tests. Record for future test-stability investigation if it recurs.
- Next: user visual iteration, then optional field-focus responses. No focus-driven effects added in this first pass. Changes uncommitted.

## 2026-09-25 - feat-contact-pulsing-border: Task 2 - Contact spacing

- Set contactForm padding to 2.5rem 3.5rem at all breakpoints, removing the previous tablet override. Set shader offsets to top -33%, right -36%, bottom -30%, left -25%.
- Inspected desktop/mobile screenshots. Implementation and independent evaluator verification passed all 26 tests, lint, typecheck, and build. Sandboxed build stalled; approved full verification succeeded outside sandbox. git diff --check passed.
- Independent evaluator: PASS. No new tests needed for the CSS-only adjustment. Changes uncommitted.

## 2026-09-25 - feat-contact-pulsing-border: Task 3 - Field-focus pulse

- Changed roundness to 0.08. Input/textarea/select focus raises smoke 0.49 to 0.68 and speed 0.46 to 1.14 with smoothstep easing over 250ms, then restores both over 250ms. Rapid retriggers rise from current intensity and cancel the previous frame loop. Pending focus is replayed after shader loading if a field remains focused.
- Kept the form server-rendered; scoped native focus listener to its form. Reduced motion uses existing static fallback. Hidden-document handling resets pulse values; cleanup cancels frames and removes listeners. Preserved previous mobile padding adjustment.
- Added deterministic browser timing coverage for all three existing fields, ascent/descent/base values, smooth rapid retriggers, and non-field focus. Timing test uses a small render budget; separate existing tests retain full-resolution visual/lifecycle coverage.
- Baseline passed 26 tests. Implementation and independent evaluator each passed npm run verify with 27 tests; git diff --check passed. Initial clock setup was corrected; an intermediate run encountered the previously recorded unrelated linked-panel hover flake. Final runs passed. Inspected desktop screenshot.
- Independent evaluator: PASS, no blocking issues. Changes uncommitted.

## 2026-09-26 - feat-contact-pulsing-border: Sync tests and design guidance with manual values

- Reviewed the user's follow-up styling changes, preserving the implementation: focus pulse targets are smoke `0.78`, speed `1.1`, and `300ms` per leg; contact labels use Switzer, fields brighten on hover and use a white focus border without the global shadow, and the CTA uses the updated animated gradient/press treatment.
- Updated the deterministic focus test's peak and completion timing to match the 300ms pulse, and updated DESIGN.md plus the plan acceptance criterion. Historical notes remain unchanged.
- Full `npm run verify` passed: lint, typecheck, production build, and all 27 browser tests. `git diff --check` passed. Changes remain uncommitted.
