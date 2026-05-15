import { notFound } from "next/navigation";

import { CASE_STUDIES } from "../../_content/site-content";
import { RoutePlaceholder } from "../../_components/route-placeholder";

type CaseStudyDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function slugFromHref(href: string) {
  return href.split("/").at(-1) ?? href;
}

export function generateStaticParams() {
  return CASE_STUDIES.map((caseStudy) => ({
    slug: slugFromHref(caseStudy.href),
  }));
}

export default async function CaseStudyDetailPage({
  params,
}: CaseStudyDetailPageProps) {
  const { slug } = await params;
  const caseStudy = CASE_STUDIES.find((entry) => slugFromHref(entry.href) === slug);

  if (!caseStudy) {
    notFound();
  }

  return (
    <RoutePlaceholder
      description={caseStudy.description}
      eyebrow="Case Study"
      title={caseStudy.title}
    />
  );
}
