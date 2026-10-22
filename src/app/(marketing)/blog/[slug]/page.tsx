import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPostBySlug, getPosts } from "../../_content/posts";
import { BlogPost } from "../../_components/blog-post";

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

  return {
    description: post.description,
    title: post.title,
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <BlogPost post={post} />;
}
