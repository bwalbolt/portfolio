import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPostBySlug, getPosts } from "../../_content/posts";
import { BlogPost } from "../../_components/blog-post";
import {
  absoluteUrl,
  DEFAULT_SOCIAL_IMAGE,
  SITE_AUTHOR,
} from "../../../site-config";

type BlogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getPosts().map((post) => ({
    slug: post.slug,
  }));
}

// The collection is authored locally, so routes outside this build-time list are 404s.
export const dynamicParams = false;

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {};
  }

  const canonicalUrl = absoluteUrl(post.href);
  const socialImage = post.socialImage ?? DEFAULT_SOCIAL_IMAGE;
  const socialImageUrl = absoluteUrl(socialImage.src);

  return {
    description: post.description,
    title: post.title,
    keywords: [post.title, ...post.tags],
    authors: [{ name: SITE_AUTHOR }],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      authors: [SITE_AUTHOR],
      tags: [...post.tags],
      images: [{ url: socialImageUrl, alt: socialImage.alt, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [{ url: socialImageUrl, alt: socialImage.alt }],
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // This is the documented local dynamic-MDX import pattern. `dynamicParams = false`
  // restricts it to the build-time filesystem inventory above.
  const { default: Content } = await import(`../../../../content/blog/${post.slug}.mdx`);

  return <BlogPost Content={Content} post={post} />;
}
