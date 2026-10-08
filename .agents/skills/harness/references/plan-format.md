# Plan File Format

Per-ticket plans live at `.harness/plans/{slug}.json`. Plans are kept forever as historical record.

## Schema

```json
{
  "slug": "fix-csv-naming",
  "title": "Fix CSV download naming convention",
  "type": "bug|feature|improvement|chore",
  "created": "2026-03-26",
  "status": "planned|in_progress|complete",
  "context": "Brief description of why this work is needed and any relevant background",
  "tasks": [
    {
      "id": "1",
      "title": "Update CSV filename to use DDMMYY HH:MM format",
      "status": "pending|in_progress|complete",
      "acceptance_criteria": [
        "CSV download filename follows DDMMYY HH:MM {Name} format",
        "Filename is generated using sanitized user input"
      ],
      "files": ["src/components/TableViewer.tsx"],
      "depends_on": []
    }
  ]
}
```

## Field Reference

| Field                         | Required | Description                                               |
| ----------------------------- | -------- | --------------------------------------------------------- |
| `slug`                        | Yes      | Auto-generated: lowercase, hyphenated, max 40 chars       |
| `title`                       | Yes      | Human-readable title for the ticket                       |
| `type`                        | Yes      | One of: `bug`, `feature`, `improvement`, `chore`          |
| `created`                     | Yes      | ISO date (YYYY-MM-DD)                                     |
| `status`                      | Yes      | Overall plan status                                       |
| `context`                     | Yes      | Why this work is needed — motivation, user feedback, etc. |
| `tasks[].id`                  | Yes      | Sequential string ID ("1", "2", ...)                      |
| `tasks[].title`               | Yes      | Short, imperative description of the task                 |
| `tasks[].status`              | Yes      | Task-level status                                         |
| `tasks[].acceptance_criteria` | Yes      | List of testable criteria — the evaluator checks these    |
| `tasks[].files`               | No       | Hint for which files will be touched                      |
| `tasks[].depends_on`          | No       | List of task IDs that must complete first                 |

## Slug Generation

Generate from the title/description:

- Lowercase, replace spaces with hyphens
- Remove special characters
- Prefix with exactly one approved conventional-commit type:
  - `feat-` for a `feature` plan that introduces a new capability
  - `fix-` for a `bug` plan that patches a defect
  - `chore-` for maintenance that does not modify source or test files
  - `refactor-` for an `improvement` plan, including performance work, redesigns, and tweaks
- Max 40 chars, truncate at word boundary
- Do not use `test-`; tests belong to the applicable `fix-` or `refactor-` plan.
- This applies to newly created plans only. Existing historical plan slugs, including `improve-`, remain unchanged.

Examples:

- "CSV download naming" -> `fix-csv-naming`
- "Sticky status bar" -> `feat-sticky-statusbar`
- "Login form broken" -> `fix-login-form`
- "Improve homepage navigation" -> `refactor-homepage-nav`
- "Refresh documentation" -> `chore-refresh-documentation`

## Planning Rules

1. Each task should be completable in one focused session (1-2 hours)
2. Every task MUST have `acceptance_criteria` — the evaluator needs them
3. Acceptance criteria must be specific and testable, not vague
4. Group related changes into a single task (component + test + wiring)
5. Use `depends_on` to express ordering between tasks
6. Include `files` as hints — helps the generator focus

## Targeted Feedback Amendments

Keep feedback that applies to an existing plan in that plan. Create a new plan only when no plan or task can be reasonably identified as its target.

1. Before evaluation begins for the current unfinished task, add the feedback as one or more specific, testable acceptance criteria to that task.
2. After evaluation begins, or when feedback targets a completed task, insert a new pending task immediately after the target. Name it `Address feedback on task {id}: {title}`, record the requested behavior as its acceptance criteria, and set `depends_on` to the target ID.
3. Preserve the target task's status. Increment every following task ID and rewrite every `depends_on` value that refers to an incremented ID.
4. Set the amended plan status to `in_progress` when the new task is pending, including when the plan had previously been `complete`.

## Bad vs Good Acceptance Criteria

| Bad                   | Good                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| "CSV works correctly" | "CSV filename follows DDMMYY HH:MM {Name} format"                   |
| "UI looks better"     | "Status bar is sticky at bottom with cost, tokens, and time"         |
| "Fix the bug"         | "Login form renders email field and submit button on /login route"   |
| "Add tests"           | "Unit test verifies filename generation with mock input"             |
