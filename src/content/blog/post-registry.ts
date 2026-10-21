export const POST_TAGS = ["tutorial"] as const;

export type PostTag = (typeof POST_TAGS)[number];

export type PostMetadata = {
  readonly description: string;
  readonly displaySequence: number;
  readonly publishedAt: `${number}-${number}-${number}`;
  readonly slug: string;
  readonly tags: readonly PostTag[];
  readonly title: string;
};

export type RegisteredPost = PostMetadata & {
  readonly dateLabel: string;
  readonly href: `/blog/${string}`;
};

function formatDateLabel(publishedAt: PostMetadata["publishedAt"], sequence: number) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  })
    .format(new Date(`${publishedAt}T00:00:00Z`))
    .toUpperCase();

  return `${formattedDate} // ${String(sequence).padStart(3, "0")}`;
}

export function createPostRegistry(
  definitions: readonly PostMetadata[],
): readonly RegisteredPost[] {
  const slugs = new Set<string>();

  return definitions
    .map((definition) => {
      if (slugs.has(definition.slug)) {
        throw new Error(`Duplicate blog post slug: ${definition.slug}`);
      }

      if (definition.tags.some((tag) => !POST_TAGS.includes(tag))) {
        throw new Error(`Unsupported blog post tag on ${definition.slug}`);
      }

      slugs.add(definition.slug);

      return {
        ...definition,
        dateLabel: formatDateLabel(definition.publishedAt, definition.displaySequence),
        href: `/blog/${definition.slug}` as const,
      };
    })
    .sort(
      (left, right) =>
        Date.parse(right.publishedAt) - Date.parse(left.publishedAt) ||
        right.displaySequence - left.displaySequence,
    );
}

export function selectTutorialPosts<T extends RegisteredPost>(posts: readonly T[]): readonly T[] {
  return posts.filter((post) => post.tags.includes("tutorial"));
}
