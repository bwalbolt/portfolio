# Blog content workflow

To publish a post, add one `.mdx` file in this directory, import its default export in `src/app/(marketing)/_content/posts.ts`, add it to `postContent`, and add its matching typed metadata entry to `postDefinitions`. The registry is the single source of truth for titles, summaries, publication dates, display sequences, routes, and classifications.

Use an ISO `YYYY-MM-DD` publication date, a unique kebab-case slug, and only tags listed in `POST_TAGS`. The registry validates duplicate slugs at build time and TypeScript rejects unsupported tags. Blog and tutorial listings consume the registry directly, so no route component changes are required for a new post.
