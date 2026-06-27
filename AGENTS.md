<!-- BEGIN:nextjs-agent-rules -->
# Next.js 16 Context

This project uses Next.js 16, which may differ from older conventions. Before changing Next APIs, routing, config, rendering, metadata, build behavior, or file conventions, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Portfolio Agent Guide

This repository is a senior front-end portfolio. Code should be polished enough for peers, hiring managers, and clients to inspect.

## Standards

- **Performance:** Preserve static rendering where possible, optimize images/fonts, avoid unnecessary client JavaScript, and keep Lighthouse 100 as the target.
- **Accessibility:** Meet WCAG 2.2 AA. Use semantic HTML, visible focus states, keyboard-friendly interactions, labels, landmarks, and reduced-motion fallbacks.
- **TypeScript:** Keep types strict. Do not introduce `any`; define clear interfaces and reusable domain types where they help comprehension.
- **Craft:** Prefer small, legible components, local state, vanilla CSS modules, and existing project patterns over broad new abstractions.
- **Motion/UI:** Keep the lightly game-inspired feel professional, intentional, performant, and non-blocking.

## Where To Look

Consult docs by task instead of loading everything by default:

- `docs/product-requirements-document.md` - audience, goals, user stories, and success metrics.
- `docs/software-requirements-specification.md` - architecture, routing, data flow, content model, and service expectations.
- `docs/user-interface-design-document.md` - visual language, layout, interaction, typography, and accessibility guidance.
- `docs/harness-best-practices.md` - harness engineering methodology and why verification/state artifacts matter.
- `.agents/specs/` - existing implementation specs and decisions.
- `.harness/README.md` - local harness workflow, plan format, and verification command.

## Workflow

- Start with targeted exploration: read the files and docs relevant to the requested change.
- For UI work tied to a Figma design, use `.agents/skills/figma-implement-design` and the Figma MCP context. If no Figma context exists, ask for it before aiming for 1:1 design fidelity.
- Keep each implementation focused on the requested task. Capture unrelated findings in `.harness/progress.md` or a future plan instead of expanding scope.
- Run `npm run verify` before marking implementation complete. For quick inner-loop checks, use `npm run lint`, `npm run typecheck`, `npm run build`, or `npm run test:e2e` as appropriate.

## Harness

When handling feature requests, bugs, or improvements, prefer the harness loop:

1. Triage the request into a concrete plan with acceptance criteria.
2. Implement one focused task at a time.
3. Verify with `npm run verify`.
4. Use an independent evaluator/review pass before marking work complete.
5. Append durable notes to `.harness/progress.md`.
