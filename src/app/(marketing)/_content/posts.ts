import HelloWorld from "../../../content/blog/hello-world.mdx";
import MarginTopForTheWin from "../../../content/blog/margin-top-for-the-win.mdx";
import WorkingOnOldHardware from "../../../content/blog/working-on-old-hardware.mdx";
import {
  createPostRegistry,
  POST_TAGS,
  selectTutorialPosts,
  type PostMetadata,
  type PostTag,
} from "../../../content/blog/post-registry";

export { POST_TAGS, type PostTag };

export type Post = (ReturnType<typeof createPostRegistry>[number]) & {
  readonly content: typeof MarginTopForTheWin;
};

const postDefinitions = [
  {
    description: "Most frontend devs agree on one-side margin, but which side?",
    displaySequence: 3,
    publishedAt: "2026-04-06",
    slug: "margin-top-for-the-win",
    tags: ["tutorial"],
    title: "Margin-top For the Win",
  },
  {
    description: "How practical can a 2015 MacBook Air be for full-stack work?",
    displaySequence: 2,
    publishedAt: "2026-04-05",
    slug: "working-on-old-hardware",
    tags: [],
    title: "Working on Old Hardware",
  },
  {
    description: "It's been a while since I had a site live. It's time to start fresh.",
    displaySequence: 1,
    publishedAt: "2026-04-04",
    slug: "hello-world",
    tags: [],
    title: "Hello World",
  },
] as const satisfies readonly PostMetadata[];

const postContent = {
  "hello-world": HelloWorld,
  "margin-top-for-the-win": MarginTopForTheWin,
  "working-on-old-hardware": WorkingOnOldHardware,
} as const;

const POSTS: readonly Post[] = createPostRegistry(postDefinitions).map((post) => ({
  ...post,
  content: postContent[post.slug as keyof typeof postContent],
}));

export function getPosts(): readonly Post[] {
  return POSTS;
}

export function getTutorialPosts(): readonly Post[] {
  return selectTutorialPosts(POSTS);
}

export function getPostBySlug(slug: string): Post | undefined {
  return POSTS.find((post) => post.slug === slug);
}
