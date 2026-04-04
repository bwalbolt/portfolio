<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Context & Agent Instructions

Welcome to the Personal Portfolio project. This repository is a demonstration of senior-level front-end craftsmanship. As an AI agent working on this codebase, your highest priority is to output **expertly written, pristine code**.

## Project Goals & Standards
Every piece of code you touch must reflect the highest industry standards:
- **Performance First**: We are targeting a perfect 100 on Lighthouse (Performance, Accessibility, Best Practices, SEO). Optimize everything (lazy load images/animations, code split, build statically).
- **Accessibility (a11y)**: Must be WCAG 2.2 AA compliant. Use semantic HTML, ARIA attributes where necessary, ensure keyboard navigability, visible focus states, and respect `prefers-reduced-motion`.
- **Cleanliness & Craftsmanship**: The code itself is a portfolio piece. It must be highly legible, modular, and flawlessly typed (TypeScript). No hacky solutions. 
- **Aesthetics & Motion**: The UI is lightly video-game inspired but highly professional. Animations should be smooth, intentional, and not interfere with performance or accessibility.

## Using the `/docs/`
Before proposing architectural changes or adding major features, review the documentation in `/docs/`:
- **`product-requirements-document.md`**: Outlines the "Why" and the "Who." Use this to understand target audiences, user stories, and engagement goals.
- **`software-requirements-specification.md`**: Outlines the "How." Reference this for architectural decisions (Jamstack, SSG), state management guidelines, routing, and data flow patterns.
- **`user-interface-design-document.md`**: Outlines the "What - Look & Feel." Reference this for layout structures, visual design elements, typography choices, interaction patterns, and responsive behavior. Always ensure new UI aligns with these guidelines.

## Using Skills
You have access to specialized skills in this repository to assist with implementation. 
- **Figma Integration**: When implementing UI components or dealing with a design spec, use the `figma-implement-design` skill located in `.agents/skills/`. This workflow utilizes the Figma MCP server to fetch design context, verify node structures, and ensure 1:1 visual fidelity between the codebase and the design.

## Agent Workflow & Execution
To maintain the high standards of this project, follow this workflow for every task:
1.  **Analyze First**: Always review the relevant documentation in `/docs/` before writing code. Understand the "Why," "How," and "What" to ensure alignment with project goals.
2.  **Define Strict Types**: This is a zero-tolerance `any` codebase. Define comprehensive TypeScript interfaces and types for all data structures and component props before implementation.
3.  **Figma-First UI**: If instructed to build or modify a UI feature, you MUST either:
    - Refer to an existing Figma node/URL provided in the task.
    - Ask the user for the relevant Figma context if it is missing.
    - Use the `figma-implement-design` skill to ensure 1:1 visual fidelity and accurate component generation using the Figma MCP.

## General Execution Reminders
- You are writing code that peers, prospective freelance clients, and hiring managers will scrutinize. Impress them.
- Build mobile-first and fully responsive designs.
- Avoid heavy global state libraries; prefer local component state or lightweight context whenever possible.
