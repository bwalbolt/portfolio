# Blog content workflow

Each post is one `.mdx` file in this directory—no listing, route, or import-map edits are needed. Name the file with a unique lowercase kebab-case slug, for example `a-useful-note.mdx`. The filename becomes `/blog/a-useful-note`.

Start every post with this copy/paste YAML frontmatter template:

```mdx
---
title: A useful note
description: A concise, reader-facing summary of the post.
publishedAt: "2026-04-07"
tags:
  - tutorial
socialImage:
  src: /images/example-social-card.png
  alt: A concise description of the social image.
---

Write the article body here. Do not add an H1: the article route supplies it.
```

`title`, `description`, `publishedAt`, and `tags` are required. Descriptions should be useful as a card summary and search snippet. Quote `publishedAt` and use a real `YYYY-MM-DD` calendar date. Tags are unique lowercase kebab-case strings; include `tutorial` to publish the post on `/tutorial`. New tags need no central registration.

`socialImage` is optional, but when included it must contain both a public-root `src` (starting with `/`) and non-empty `alt` text. Posts are automatically ordered newest-first; the oldest date receives `001`, with filename order breaking same-day ties.

Build validation rejects malformed filenames, missing or invalid frontmatter, invalid dates, invalid or duplicate tags, and partial social-image data with the file and field that need correction.
