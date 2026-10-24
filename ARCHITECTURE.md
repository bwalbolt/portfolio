# Architecture Map

This document is the short map for agents. Use the deeper product, software, and UI documents when a task needs more context.

## Application Shape

- Next.js 16 App Router portfolio site under `src/app`.
- Marketing routes live in `src/app/(marketing)` and share header, footer, primitives, route placeholders, and homepage components.
- Portfolio copy and current content records live in `src/app/(marketing)/_content/site-content.ts`.
- Blog posts are filesystem-authored MDX files in `src/content/blog`. Their lowercase kebab-case filenames become slugs; validated YAML frontmatter supplies title, description, publication date, tags, and an optional social image. The registry discovers files at build time, assigns chronological display sequences (with filename tie-breaking), then exposes listings newest-first. The `tutorial` tag is the tutorial classification.
- Styling is plain CSS and CSS Modules; keep component styles local unless a rule is truly global.
- The current site is mostly static. Blog article bodies are statically imported and prerendered from the discovered registry; there is no runtime post fetch or client content loader. The small article-origin client boundary only remembers a Blog or Tutorials entry for the back link and active navigation; `?from=tutorial` is a shareable hint and never changes canonical URLs or social metadata.

## Boundaries

- Presentation components belong in route-local `_components` folders.
- General presentation data belongs in `_content`; blog content belongs in the validated filesystem MDX pipeline under `src/content/blog`.
- Cross-route layout belongs in `src/app/layout.tsx` and shared marketing shell components.
- Tests that drive browser behavior belong in `tests/e2e`.
- `/blog` and `/tutorial` are intentionally separate route compositions. They share focused post-card/grid primitives, while each route owns its heading, selector, metadata, and future divergence.

## Blog Content and Reading Routes

- A post’s `publishedAt` determines its derived `001`-style display sequence: oldest first for numbering, filename ascending to break same-day ties; rendered listings remain newest-date-first with the same deterministic tie-break.
- Article metadata derives canonical URLs, Open Graph/Twitter cards, and `BlogPosting` JSON-LD from the same post registry. A post frontmatter social image, when present, overrides the branded default image and its alt text for both social formats and structured data.
- `ResponsiveText` is a route-neutral long-form primitive. Its continuous bounded root scale uses em-relative descendants, while article composition constrains the Source Serif reading measure in `ch` (87.5ch, approximately 776px at a 1280px viewport). Privacy Policy and Terms of Use intentionally retain their existing typography and are not migrated as part of the blog feature.

## Verification

- Default verification: `npm run verify`. The verification wrapper selects an available loopback port and unique `.next-harness/<run>/output` production directory, then removes owned output when the final overlapping harness run exits.
- Sandbox-friendly non-browser check: `npm run verify:sandbox`.
- Harness verification: `npm run harness:verify` (an alias of the isolated default verification).
- Harness sandbox check: `npm run harness:check:sandbox`.
- `npm run harness:test:e2e -- <Playwright arguments>` starts an isolated development server for targeted work and forwards file/title filters. Final verification starts an isolated production server. Direct `npm run test:e2e` runs may still use `PORT`, `BASE_URL`, or `PLAYWRIGHT_REUSE_EXISTING_SERVER=1` when intentionally testing a separately managed build or server.
- Playwright writes traces and failure screenshots to ignored test output directories for browser QA evidence.
- In Codex's managed sandbox, Turbopack build and Playwright server startup may require port-binding permission. Use the sandbox check for fast non-browser feedback, then allowlist only the verification npm scripts needed by this repository rather than disabling the sandbox.

## Harness Workflow

- Use `.harness/plans/{slug}.json` for focused task plans with acceptance criteria.
- Append durable notes to `.harness/progress.md` after harness work.
- The checked-in headless runner is optional and currently Claude-specific; interactive Codex sessions are the primary path for this repo.
