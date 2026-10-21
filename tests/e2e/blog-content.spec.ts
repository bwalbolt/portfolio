import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

import {
  createPostRegistry,
  selectTutorialPosts,
  type PostMetadata,
} from "../../src/content/blog/post-registry";

const fixturePost: PostMetadata = {
  description: "A test post.",
  displaySequence: 1,
  publishedAt: "2026-04-01",
  slug: "test-post",
  tags: [],
  title: "Test Post",
};

test("post registry sorts metadata and rejects invalid collection entries", () => {
  const posts = createPostRegistry([
    fixturePost,
    {
      ...fixturePost,
      displaySequence: 2,
      publishedAt: "2026-04-02",
      slug: "tutorial-post",
      tags: ["tutorial"],
      title: "Tutorial Post",
    },
  ]);

  expect(posts.map((post) => post.slug)).toEqual(["tutorial-post", "test-post"]);
  expect(posts[0]).toMatchObject({
    dateLabel: "APR 02, 2026 // 002",
    href: "/blog/tutorial-post",
    tags: ["tutorial"],
  });
  expect(selectTutorialPosts(posts)).toEqual([posts[0]]);
  expect(() => createPostRegistry([fixturePost, fixturePost])).toThrow(
    "Duplicate blog post slug: test-post",
  );
  expect(() =>
    createPostRegistry([
      { ...fixturePost, tags: ["unsupported" as never] },
    ]),
  ).toThrow("Unsupported blog post tag on test-post");
});

test("authored MDX files and homepage insight cards use the canonical blog metadata", async ({
  page,
}) => {
  const authoredPosts = [
    {
      date: "APR 06, 2026 // 003",
      description: "Most frontend devs agree on one-side margin, but which side?",
      file: "margin-top-for-the-win",
      slug: "margin-top-for-the-win",
      title: "Margin-top For the Win",
    },
    {
      date: "APR 05, 2026 // 002",
      description: "How practical can a 2015 MacBook Air be for full-stack work?",
      file: "working-on-old-hardware",
      slug: "working-on-old-hardware",
      title: "Working on Old Hardware",
    },
    {
      date: "APR 04, 2026 // 001",
      description: "It's been a while since I had a site live. It's time to start fresh.",
      file: "hello-world",
      slug: "hello-world",
      title: "Hello World",
    },
  ] as const;

  for (const post of authoredPosts) {
    const source = await readFile(`src/content/blog/${post.file}.mdx`, "utf8");
    expect(source).toContain(`# ${post.title}`);
  }

  await page.setViewportSize({ height: 900, width: 1280 });
  await page.goto("/");

  const cards = page.locator("#insights li");
  await expect(cards).toHaveCount(3);

  for (const [index, post] of authoredPosts.entries()) {
    const card = cards.nth(index);
    await expect(card).toContainText(post.date);
    await expect(card).toContainText(post.title);
    await expect(card).toContainText(post.description);
    await expect(card.getByRole("link", { name: `Read more about ${post.title}` })).toHaveAttribute(
      "href",
      `/blog/${post.slug}`,
    );
  }
});
