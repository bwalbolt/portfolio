import { load } from "js-yaml";

export type SocialImage = { readonly alt: string; readonly src: `/${string}` };

export type PostMetadata = {
  readonly description: string;
  readonly filename: string;
  readonly publishedAt: string;
  readonly socialImage?: SocialImage;
  readonly tags: readonly string[];
  readonly title: string;
};

export type RegisteredPost = Omit<PostMetadata, "filename"> & {
  readonly dateLabel: string;
  readonly displaySequence: number;
  readonly href: `/blog/${string}`;
  readonly slug: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FILENAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\.mdx$/;
const TAG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(filename: string, message: string): never {
  throw new Error(`Invalid blog post ${filename}: ${message}`);
}

function nonEmptyString(value: unknown, filename: string, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(filename, `frontmatter ${field} must be a non-empty string`);
  }
  return value.trim();
}

function parseDate(value: string, filename: string): string {
  if (!DATE_PATTERN.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    fail(filename, "frontmatter publishedAt must be a YYYY-MM-DD date");
  }
  if (new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    fail(filename, "frontmatter publishedAt must be a real calendar date");
  }
  return value;
}

function parseTags(value: unknown, filename: string): readonly string[] {
  if (!Array.isArray(value) || !value.every((tag) => typeof tag === "string" && TAG_PATTERN.test(tag))) {
    fail(filename, "frontmatter tags must be normalized kebab-case strings");
  }
  if (new Set(value).size !== value.length) {
    fail(filename, "frontmatter tags must not contain duplicates");
  }
  return value;
}

function parseSocialImage(value: unknown, filename: string): SocialImage | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(filename, "frontmatter socialImage must provide both src and alt");
  }
  const image = value as Record<string, unknown>;
  const src = nonEmptyString(image.src, filename, "socialImage.src");
  const alt = nonEmptyString(image.alt, filename, "socialImage.alt");
  if (!src.startsWith("/") || src.startsWith("//")) {
    fail(filename, "frontmatter socialImage.src must be a public-root path");
  }
  return { alt, src: src as `/${string}` };
}

export function parsePostFrontmatter(filename: string, source: string): PostMetadata {
  if (!FILENAME_PATTERN.test(filename)) {
    fail(filename, "filename must be lowercase kebab-case and end in .mdx");
  }
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) fail(filename, "YAML frontmatter must start and end with ---");

  let data: unknown;
  try {
    data = load(match[1]);
  } catch (error) {
    fail(filename, `YAML frontmatter could not be parsed (${error instanceof Error ? error.message : "unknown error"})`);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    fail(filename, "YAML frontmatter must be a mapping");
  }
  const frontmatter = data as Record<string, unknown>;
  return {
    description: nonEmptyString(frontmatter.description, filename, "description"),
    filename,
    publishedAt: parseDate(nonEmptyString(frontmatter.publishedAt, filename, "publishedAt"), filename),
    socialImage: parseSocialImage(frontmatter.socialImage, filename),
    tags: parseTags(frontmatter.tags, filename),
    title: nonEmptyString(frontmatter.title, filename, "title"),
  };
}

function formatDateLabel(publishedAt: string, sequence: number) {
  const formattedDate = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", timeZone: "UTC", year: "numeric" })
    .format(new Date(`${publishedAt}T00:00:00Z`)).toUpperCase();
  return `${formattedDate} // ${String(sequence).padStart(3, "0")}`;
}

export function createPostRegistry(definitions: readonly PostMetadata[]): readonly RegisteredPost[] {
  const filenames = new Set<string>();
  const chronological = [...definitions].map((definition) => {
    if (filenames.has(definition.filename)) throw new Error(`Duplicate blog post filename: ${definition.filename}`);
    filenames.add(definition.filename);
    return definition;
  }).sort((left, right) => left.publishedAt.localeCompare(right.publishedAt) || left.filename.localeCompare(right.filename));

  return chronological.map((definition, index) => {
    const slug = definition.filename.slice(0, -".mdx".length);
    const displaySequence = index + 1;
    return { ...definition, dateLabel: formatDateLabel(definition.publishedAt, displaySequence), displaySequence, href: `/blog/${slug}` as const, slug };
  }).sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || left.slug.localeCompare(right.slug)).map((post) => ({
    dateLabel: post.dateLabel,
    description: post.description,
    displaySequence: post.displaySequence,
    href: post.href,
    publishedAt: post.publishedAt,
    slug: post.slug,
    socialImage: post.socialImage,
    tags: post.tags,
    title: post.title,
  }));
}

export function selectTutorialPosts<T extends RegisteredPost>(posts: readonly T[]): readonly T[] {
  return posts.filter((post) => post.tags.includes("tutorial"));
}
