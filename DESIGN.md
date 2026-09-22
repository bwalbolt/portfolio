---
version: alpha
name: Brent Walbolt Portfolio
description: Dark, editorial, lightly game-inspired portfolio system for a senior design engineer.
colors:
  primary: "#02141d"
  on-primary: "#ffffff"
  secondary: "rgba(255, 255, 255, 0.63)"
  tertiary: "rgba(255, 255, 255, 0.4)"
  background: "#02141d"
  background-top: "#071a24"
  background-bottom: "#041019"
  surface: "rgba(255, 255, 255, 0.02)"
  surface-border: "rgba(255, 255, 255, 0.08)"
  surface-elevated: "rgba(0, 0, 0, 0.66)"
  surface-contact: "rgba(1, 12, 17, 0.96)"
  footer: "#000000"
  input: "rgba(255, 255, 255, 0.08)"
  accent-blue: "#00b0ff"
  accent-blue-soft: "#66d0ff"
  accent-pink: "#e44fd9"
  accent-orange: "#ffb300"
  accent-purple: "#7c4dff"
  black: "#000000"
  black-soft: "rgba(0, 0, 0, 0.4)"
  light-section-text: "rgba(0, 0, 0, 0.8)"
typography:
  hero:
    fontFamily: Switzer
    fontSize: 4.375rem
    fontWeight: 600
    lineHeight: 1.11
    letterSpacing: -0.057em
  section-title:
    fontFamily: Switzer
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.075rem
  card-title:
    fontFamily: Switzer
    fontSize: 1.25rem
    fontWeight: 700
    lineHeight: 1.33
  body:
    fontFamily: Source Serif 4
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: Source Serif 4
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.4
  label-caps:
    fontFamily: Switzer
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.08em
  mono-label:
    fontFamily: Source Code Pro
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1.4
spacing:
  1: 0.25rem
  2: 0.5rem
  3: 0.75rem
  4: 1rem
  5: 1.5rem
  6: 2rem
  7: 2.5rem
  8: 3rem
  9: 4rem
  10: 5rem
  section: 7.5rem
  page-gutter: 2rem
  content-width: 76rem
  content-width-narrow: 58rem
rounded:
  sm: 0.25rem
  md: 0.5rem
  panel: 1.5rem
  panel-compact: 1.25rem
  full: 999px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.card-title}"
    rounded: "{rounded.md}"
    padding: 1rem
  button-primary-hover:
    backgroundColor: "{colors.background-top}"
    textColor: "{colors.on-primary}"
  panel-card:
    backgroundColor: "{colors.background-bottom}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.panel}"
    padding: 2rem
  tag:
    backgroundColor: "{colors.background-bottom}"
    textColor: "{colors.on-primary}"
    typography: "{typography.mono-label}"
    padding: 0.75rem
  input:
    backgroundColor: "{colors.background-bottom}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: 1rem
---

# DESIGN.md

## Overview

This portfolio should feel like a senior front-end craft showcase: professional, performant, accessible, and quietly playful. The implemented style is dark, editorial, and lightly game-inspired through angled geometry, luminous accent gradients, metadata-like labels, and layered panels. It should never drift into a sci-fi control panel, a generic SaaS dashboard, or a decorative landing page that hides the work.

The design source of truth is the implemented code, especially [src/app/globals.css](src/app/globals.css), the marketing CSS modules, and the content records in [src/app/(marketing)/\_content/site-content.ts](<src/app/(marketing)/_content/site-content.ts>). The Figma file can be used for visual comparison when exact composition is required, but new implementation should first preserve the shipped tokens and component patterns.

Audience: hiring managers, design-engineering peers, collaborators, and clients. The desired impression is "thoughtful senior design engineer who can ship polished interfaces", with visible care for accessibility, static performance, and interaction craft.

## Colors

The base theme is dark and high contrast. The page foundation moves from deep blue-black to near-black, with thin translucent borders and small amounts of glow used to create depth.

- **Primary / background (`#02141d`):** The core deep blue-black. Use it as the brand's default darkness, not plain black.
- **Surface (`rgba(255, 255, 255, 0.02)`):** Main panel fill. It should feel subtle, letting borders, content, and images carry the hierarchy.
- **Surface border (`rgba(255, 255, 255, 0.08)`):** Default panel, card, and divider border.
- **Text primary (`#ffffff`):** Headlines, key labels, and critical controls.
- **Text secondary (`rgba(255, 255, 255, 0.63)`):** Body support copy, nav links, captions, and descriptions.
- **Text tertiary (`rgba(255, 255, 255, 0.4)`):** Placeholders and low-priority metadata.
- **Accent blue (`#00b0ff`):** Primary interaction and availability signal.
- **Accent purple (`#7c4dff`):** Gradient partner for primary calls to action and AI/workflow emphasis.
- **Accent pink (`#e44fd9`):** Editorial highlight, insight metadata, and quote gradient energy.
- **Accent orange (`#ffb300`):** Warm counterpoint used in tags and multicolor emphasis.

Use gradients sparingly and intentionally: primary CTAs use blue to purple; hero and quote highlights can use blue, purple, pink, and orange. Avoid adding a new accent hue unless it maps to a durable content category.

The About band deliberately introduces a light, image-backed section with dark text. Treat that as a special editorial break, not a second global theme.

## Typography

Typography uses three local font families loaded in [src/app/layout.tsx](src/app/layout.tsx):

- **Switzer:** Display, section titles, nav, buttons, labels, and compact UI. It carries the crisp product voice.
- **Source Serif 4:** Body and long-form reading. It adds editorial warmth and distinguishes the portfolio from a generic product site.
- **Source Code Pro:** Tags, field labels, technical metadata, and small system-like annotations.

Headlines should be confident and compact. Section titles use Switzer Bold with a white-to-muted gradient text treatment and tight tracking. Body copy should remain comfortable and readable, generally Source Serif 4 at `1rem` to `1.125rem` with `1.5` line height.

Use uppercase labels for navigation affordances, small metadata, and CTAs only when the element is short. Do not uppercase long prose or paragraph-style calls to action.

## Layout

The layout is mobile-first, static-friendly, and centered around a constrained content width:

- Page gutters use `--page-gutter`, currently clamped around `1.5rem` to `2rem`.
- Standard content max width is `76rem`.
- Narrow reading or status surfaces should stay closer to `34rem` to `58rem`.
- Homepage sections stack with generous vertical rhythm using `--space-section`.
- Desktop grids move to three columns for insights, two columns for case studies, and three columns for skill cards.

The homepage begins with an immersive hero image and centered headline, then uses a rotated dark cutaway to transition into the content stack. Preserve that feeling of deliberate scene-setting. Do not replace it with a split hero card or a generic text-and-image marketing layout.

Cards and panels should use real content density. Favor scan-friendly titles, short descriptions, tags, and clear links over decorative copy blocks.

### Responsive breakpoints

Prefer these shared viewport buckets for layout changes:

| Bucket | Viewport width |
| --- | --- |
| Mobile | Below `30rem` |
| Large mobile | `30rem` to below `48rem` |
| Tablet | `48rem` to below `62rem` |
| Desktop | `62rem` to below `80rem` |
| Large desktop | `80rem` and above |

The large-desktop threshold matches the `76rem` content cap plus two `2rem` page gutters. At the default browser font size, the thresholds correspond to 480, 768, 992, and 1280 CSS pixels. Media-query `rem` units use the browser's initial font size, so these pixel equivalents can change with user font preferences.

Start with mobile base styles and use native range queries for wider layouts. Exact thresholds belong to the larger bucket; use `<` for rules below a threshold to avoid gaps or overlap from approximate values such as `47.999rem`.

```css
.exampleGrid {
  display: grid;
  grid-template-columns: 1fr;
}

@media (width >= 48rem) {
  .exampleGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width < 48rem) {
  .exampleHeadingAction {
    display: none;
  }
}
```

Components need changes only where their content requires them, not at every threshold. Keep fluid sizing (`clamp()`, flexible grids, and content caps) where it already works. The bucket names describe viewport ranges, not device detection or a requirement that all desktop-looking components switch at `62rem`.

Bespoke thresholds are allowed for a specific text, image, or layout problem when the shared values do not fit. Add a nearby comment explaining the problem and why the custom threshold is needed. Keep image `sizes` media conditions aligned with the corresponding layout transitions.

Use literal `rem` thresholds in CSS queries. CSS custom properties cannot supply media-query thresholds through `var()`. This preference is maintained through documentation and review, without a custom checker or additional CSS processing.

## Elevation & Depth

Depth is created through tonal layering, translucent borders, selective blur, and moderate shadow. The default panel shadow is `0 18px 48px rgba(0, 0, 0, 0.18)`. Use it for cards and floating mobile panels, not for every section.

Background atmosphere comes from radial blue and purple light on the body plus specific image assets:

- `hero-background.jpg` and `hero-background-mobile.jpg` for the first viewport.
- `mosaic-broken.png` and `mosaic-broken-mobile.png` for the About band.
- Case study thumbnail art for project cards.

Keep backgrounds inspectable and relevant. Avoid abstract decorative blobs or unrelated stock-style imagery.

## Shapes

The shape language combines compact radii with asymmetric panels:

- Small controls and inputs use `0.25rem` to `0.5rem`.
- Standard panels use `1.5rem 0.5rem 1.5rem 0.5rem`.
- Compact framed images and availability cards use `1.25rem 0.375rem 1.25rem 0.375rem`.
- Pills and avatars use `999px`.

Case study cards on desktop use skewed containers to create the game-inspired edge. Keep skew effects structural and rare. Most UI should remain readable, stable, and aligned.

## Components

**Header:** Use a black or near-black bar with uppercase Switzer navigation. Desktop nav is horizontal; mobile uses an icon button and an elevated dropdown panel with blur. Active and hover states move from secondary text to white.

**Hero:** Use a full-bleed background image with a dark overlay. The H1 is centered, two-line, and gradient-highlighted only on key words. The scroll label is small, uppercase, and hidden on mobile.

**Section heading:** Pair a large gradient section title with a compact uppercase action link. Hide the desktop action on small viewports when a more explicit mobile link appears below the grid.

**Panel card:** Use a translucent surface, thin border, asymmetric radius, and the shared panel shadow. Cards should be content-first and not nested inside other cards.

**Case study card:** Mobile uses a conventional panel with artwork anchored at the bottom right. Desktop removes the generic card shell and uses a skewed shape with artwork clipped inside.

**Tags:** Use Source Code Pro, translucent background, compact padding, and a colored left border. Tag colors should come from the named accent tones.

**Buttons and links:** Primary buttons use blue-to-purple gradients, white text, Switzer Bold, and a subtle hover lift. Text links use uppercase labels with arrow or external icons. Hover color should brighten, not introduce a new visual language.

**Forms:** Contact inputs sit on the near-black contact surface. Labels use purple Source Code Pro. Inputs use translucent fills, small radius, clear focus borders, and visible focus shadows from the global focus token.

**Motion and states:** Default transitions are `180ms ease`. Hover lift should be subtle, usually `translateY(-1px)`. Always honor `prefers-reduced-motion` by reducing animation and transition duration.

## Do's and Don'ts

Do:

- Preserve static rendering and avoid client JavaScript unless interaction requires it.
- Use existing CSS custom properties before introducing new values.
- Keep body copy readable with Source Serif 4 and sufficient line height.
- Maintain WCAG 2.2 AA contrast, keyboard access, semantic structure, labels, and visible focus states.
- Use real portfolio assets for hero, case studies, portrait, and testimonial imagery.
- Keep the playful/game-inspired cues restrained: angled panels, luminous accents, compact metadata, and purposeful hover states.

Don't:

- Replace the homepage with a generic marketing hero, split hero layout, or decorative card-heavy landing page.
- Add unrelated accent colors, oversized gradients, decorative orbs, or stock-like atmospheric imagery.
- Put cards inside cards or turn full page sections into floating card containers.
- Use scroll-jacking, or motion that blocks reading.
- Introduce unlabeled form fields, invisible focus states, or low-contrast text.
- Expand global CSS for component-specific styling unless the rule is truly global.
