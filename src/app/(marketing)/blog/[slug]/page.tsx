import { notFound } from "next/navigation";

import { getPostBySlug, getPosts } from "../../_content/posts";
import { RoutePlaceholder } from "../../_components/route-placeholder";

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

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <RoutePlaceholder
      description={post.description}
      eyebrow={post.dateLabel}
      title={post.title}
    />
  );
}
