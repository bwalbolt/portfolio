# Architecture Map

This document is the short map for agents. Use the deeper product, software, and UI documents when a task needs more context.

## Application Shape

- Next.js 16 App Router portfolio site under `src/app`.
- Marketing routes live in `src/app/(marketing)` and share header, footer, primitives, route placeholders, and homepage components.
- Portfolio copy and current content records live in `src/app/(marketing)/_content/site-content.ts`.
- Styling is plain CSS and CSS Modules; keep component styles local unless a rule is truly global.
- The current site is mostly static. Preserve static rendering and avoid adding client JavaScript unless an interaction requires it.

## Boundaries

- Presentation components belong in route-local `_components` folders.
- Content data belongs in `_content` until a richer Markdown/MDX content pipeline is implemented.
- Cross-route layout belongs in `src/app/layout.tsx` and shared marketing shell components.
- Tests that drive browser behavior belong in `tests/e2e`.

## Verification

- Default verification: `npm run verify`.
- Sandbox-friendly non-browser check: `npm run verify:sandbox`.
- Harness verification: `PORT=3100 npm run harness:verify`.
- Harness sandbox check: `npm run harness:check:sandbox`.
- Harness Playwright runs set `HARNESS=1`, use the requested `PORT`, and do not reuse an existing server. This prevents one worktree from accidentally testing another worktree's app.
- Playwright writes traces and failure screenshots to ignored test output directories for browser QA evidence.
- In Codex's managed sandbox, Turbopack build and Playwright server startup may require port-binding permission. Use the sandbox check for fast non-browser feedback, then run full harness verification with a narrow approval for port-bound commands.

## Harness Workflow

- Use `.harness/plans/{slug}.json` for focused task plans with acceptance criteria.
- Append durable notes to `.harness/progress.md` after harness work.
- The checked-in headless runner is optional and currently Claude-specific; interactive Codex sessions are the primary path for this repo.
