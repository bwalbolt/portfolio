import { notFound } from "next/navigation";

import { INSIGHTS } from "../../_content/site-content";
import { RoutePlaceholder } from "../../_components/route-placeholder";

type BlogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return INSIGHTS.map((insight) => ({
    slug: insight.slug,
  }));
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const insight = INSIGHTS.find((entry) => entry.slug === slug);

  if (!insight) {
    notFound();
  }

  return (
    <RoutePlaceholder
      description={insight.description}
      eyebrow={insight.date}
      title={insight.title}
    />
  );
}
