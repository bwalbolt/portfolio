import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createPostRegistry, parsePostFrontmatter, selectTutorialPosts, type RegisteredPost } from "../../../content/blog/post-registry";

export type Post = RegisteredPost;

const BLOG_DIRECTORY = join(process.cwd(), "src/content/blog");

function discoverPosts(): readonly Post[] {
  const files = readdirSync(BLOG_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .map((entry) => entry.name);
  return createPostRegistry(files.map((filename) => parsePostFrontmatter(filename, readFileSync(join(BLOG_DIRECTORY, filename), "utf8"))));
}

const POSTS = discoverPosts();

export function getPosts(): readonly Post[] { return POSTS; }
export function getTutorialPosts(): readonly Post[] { return selectTutorialPosts(POSTS); }
export function getPostBySlug(slug: string): Post | undefined { return POSTS.find((post) => post.slug === slug); }
