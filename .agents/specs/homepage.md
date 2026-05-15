# Initial Homepage Implementation Plan

## Summary

Build the first coded pass as a polished, mobile-first marketing shell centered on `/`, with the homepage fully implemented and the shared site foundation ready for later routes. Use the Figma homepage mobile frame as the source-of-truth base layout, scale upward to the desktop frame at `1280px`, and turn the Figma variables into a real design token system with primitive and semantic layers.

Chosen defaults:

- Scope: homepage plus shared shell and placeholder route scaffolding
- Motion: CSS-first, no animation library in v1 unless a specific interaction cannot be achieved cleanly
- Tokens: Figma-derived primitives plus semantic aliases

## Implementation Changes

### 1. Capture the design correctly before coding

- Use Figma MCP during implementation to pull section-level design context from `Homepage` and `Homepage - Mobile`.
- Break the long homepage into section-sized node reads before coding: header/nav, hero, feature or card groups, testimonial/social proof, about/contact CTA, footer.
- Treat the two frame widths as typography and layout anchors:
  - Mobile min width: `393px`
  - Desktop max width: `1280px`

### 2. Establish the app and design-system foundation

- Replace the starter scaffold with a route-grouped marketing structure under `src/app`, keeping the root layout minimal and shared.
- Create a small shared UI system for homepage-grade primitives only: `Container`, `Section`, `Heading`, `Eyebrow`, `Button/LinkButton`, `Card`, `Icon`, and `VisuallyHidden`.
- Add typed static content modules for nav items, homepage section copy, social links, and teaser cards so content stays out of JSX and can later be swapped for MD/MDX or CMS data without rewrites.
- Add baseline app metadata, skip link, focus-visible treatment, global 404/error pages, and placeholder route files for future sections linked from nav.

### 3. Build tokens from Figma into a durable CSS contract

- Define token layers in global CSS:
  - Primitive tokens: raw Figma colors, raw spacing scale, radii, borders, shadows, font families, font weights
  - Semantic tokens: page background, panel background, text levels, accent, interactive states, overlay/scrim, card borders
- Map the available Figma variable set into initial tokens now:
  - Colors: `background`, `white`, `white-*`, `black-*`, `blue`, `pink`, `orange`, `purple`
  - Typography families: `Switzer Variable`, `Source Serif 4`, `Source Code Pro`
  - Type roles already visible in Figma variables: `Header-2/3/4/5`, `Paragraph`, `Paragraph-Small`, `Input`, `Code`, `Code-Small`, `Lead-In`, `Read-More`, `View-All`
- Normalize tokens into naming that supports reuse outside the homepage, while preserving a documented mapping back to Figma variable names.
- Prefer CSS custom properties as the runtime design-system surface; do not bury token values inside component modules.

### 4. Implement mobile-first responsive layout and fluid type

- Build from the mobile artboard first, then enhance at larger widths rather than shrinking the desktop layout down.
- Use a small breakpoint model:
  - Base/mobile styles from `393px`
  - Tablet adjustments only where layout genuinely changes
  - Desktop refinements by `1280px`
- Use `clamp()` for responsive typography and spacing, with min/max values derived from the paired Figma mobile/desktop styles.
- Treat Figma sizes as the clamp endpoints and use viewport interpolation between `393px` and `1280px`; avoid arbitrary extra font jumps unless Figma shows a true structural change.
- Keep line lengths, spacing, and card dimensions tokenized so later blog/case-study pages can reuse the same scale.

### 5. Handle fonts and images using current Next 16 best practices

- Replace `next/font/google` starter fonts with `next/font/local` using the checked-in local assets:
  - Display/UI: `Switzer Variable`
  - Body/editorial: `Source Serif 4`
  - Code: `Source Code Pro`
- Prefer variable-font loading and expose them as CSS vars for token-driven typography.
- Audit and convert homepage images to `next/image`, using static imports where practical for intrinsic sizing and blur placeholders.
- Use art direction where mobile and desktop assets differ meaningfully, especially for the hero/background imagery already present in `public/images`.
- Mark only truly above-the-fold imagery as `priority`; everything else should remain lazy.

## Important Interfaces and Contracts

- Global token contract in CSS custom properties:
  - `--color-*`, `--surface-*`, `--text-*`, `--space-*`, `--radius-*`, `--border-*`, `--shadow-*`, `--font-*`, `--type-*`
- Typed static content interfaces for homepage data:
  - navigation links
  - hero content/actions
  - case study teaser cards
  - testimonial/social proof
  - footer/social links
- Shared section/component props should be strict and serializable so future blog/case-study data can plug in without reworking the homepage primitives.

## Test Plan

- Visual verification against Figma at `393px` and `1280px`, plus at least one in-between viewport to validate fluid interpolation.
- Accessibility checks:
  - keyboard navigation
  - visible focus states
  - skip link
  - semantic heading order
  - alt text
  - reduced-motion behavior
  - contrast against WCAG 2.2 AA
- Performance checks:
  - `next build`
  - image sizing and priority audit
  - zero unexpected layout shift from fonts or images
  - Lighthouse pass on homepage with attention to Performance, Accessibility, Best Practices, and SEO
- Robustness checks:
  - no unnecessary client components
  - no request-time APIs in root layout
  - CSS order remains predictable
  - homepage still reads well with animations reduced or disabled

## Assumptions

- Homepage content remains static in v1; blog, case studies, forms, and CMS wiring come later.
- Shared shell includes nav/footer and placeholder route files, but only `/` is fully designed and production-polished in this pass.
- Motion stays CSS-first unless a specific Figma interaction proves impossible or materially worse without JS.
