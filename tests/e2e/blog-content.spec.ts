import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import {
  createPostRegistry,
  parsePostFrontmatter,
  selectTutorialPosts,
} from "../../src/content/blog/post-registry";

const validFrontmatter = `---
title: Test post
description: A test post.
publishedAt: "2026-04-01"
tags: []
---

Body.`;

test("frontmatter validation reports actionable metadata failures", () => {
  expect(() => parsePostFrontmatter("Test Post.mdx", validFrontmatter)).toThrow("filename must be lowercase kebab-case");
  expect(() => parsePostFrontmatter("test-post.mdx", "# Missing frontmatter")).toThrow("YAML frontmatter");
  expect(() => parsePostFrontmatter("test-post.mdx", validFrontmatter.replace("2026-04-01", "2026-02-30"))).toThrow("real calendar date");
  expect(() => parsePostFrontmatter("test-post.mdx", validFrontmatter.replace("tags: []", "tags: [Not Normalized]"))).toThrow("normalized kebab-case");
  expect(() => parsePostFrontmatter("test-post.mdx", validFrontmatter.replace("tags: []", "tags: [tutorial, tutorial]"))).toThrow("must not contain duplicates");
  expect(() => parsePostFrontmatter("test-post.mdx", validFrontmatter.replace("tags: []", "tags: []\nsocialImage:\n  src: /images/card.png"))).toThrow("socialImage.alt");
});

test("registry derives sequences chronologically and lists same-day posts by filename", () => {
  const registry = createPostRegistry([
    parsePostFrontmatter("zulu.mdx", validFrontmatter.replace("2026-04-01", "2026-04-02")),
    parsePostFrontmatter("alpha.mdx", validFrontmatter.replace("2026-04-01", "2026-04-02").replace("tags: []", "tags: [tutorial, engineering]")),
    parsePostFrontmatter("oldest.mdx", validFrontmatter),
  ]);

  expect(registry.map(({ slug, displaySequence }) => [slug, displaySequence])).toEqual([
    ["alpha", 2], ["zulu", 3], ["oldest", 1],
  ]);
  expect(registry.map((post) => post.dateLabel)).toEqual([
    "APR 02, 2026 // 002", "APR 02, 2026 // 003", "APR 01, 2026 // 001",
  ]);
  expect(selectTutorialPosts(registry).map((post) => post.slug)).toEqual(["alpha"]);
});

test("authored files own canonical frontmatter and render without duplicate page headings", async ({ page }) => {
  const authoredPosts = [
    ["margin-top-for-the-win", "Margin-top For the Win", "APR 06, 2026 // 003"],
    ["working-on-old-hardware", "Working on Old Hardware", "APR 05, 2026 // 002"],
    ["hello-world", "Hello World", "APR 04, 2026 // 001"],
  ] as const;

  for (const [slug, title, dateLabel] of authoredPosts) {
    const source = await readFile(`src/content/blog/${slug}.mdx`, "utf8");
    expect(parsePostFrontmatter(`${slug}.mdx`, source)).toMatchObject({ title });
    expect(source).not.toMatch(/^# /m);

    await page.goto(`/blog/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toHaveCount(1);
    await expect(page.locator("main article")).toContainText(dateLabel);
    await expect(page.locator("main article")).not.toContainText("publishedAt:");
  }
});
