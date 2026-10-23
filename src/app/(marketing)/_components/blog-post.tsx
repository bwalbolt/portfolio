import {
  CONTACT_SECTION_HREF,
  NAV_ITEMS,
} from "../_content/site-content";
import type { Post } from "../_content/posts";
import type { ComponentType } from "react";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { ResponsiveText } from "./responsive-text";
import { ArticleBackLink } from "./article-back-link";
import styles from "./blog-post.module.css";
import { absoluteUrl, DEFAULT_SOCIAL_IMAGE, SITE_AUTHOR } from "../../site-config";

type BlogPostProps = {
  Content: ComponentType;
  post: Post;
};

export function BlogPost({ Content, post }: BlogPostProps) {
  const socialImage = post.socialImage ?? DEFAULT_SOCIAL_IMAGE;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    author: { "@type": "Person", name: SITE_AUTHOR },
    datePublished: post.publishedAt,
    description: post.description,
    headline: post.title,
    image: absoluteUrl(socialImage.src),
    keywords: post.tags,
    mainEntityOfPage: absoluteUrl(post.href),
    url: absoluteUrl(post.href),
  };

  return (
    <div className={styles.page}>
      <SiteHeader contactHref={CONTACT_SECTION_HREF} items={NAV_ITEMS} overlay />
      <main className={styles.main} id="main-content">
        <article className={styles.article}>
          <ResponsiveText>
            <script
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
              }}
              type="application/ld+json"
            />
            <header className={styles.header}>
              <ArticleBackLink />
              <p className={styles.metadata}>{post.dateLabel}</p>
              <h1>{post.title}</h1>
              <p className={styles.description}>{post.description}</p>
            </header>
            <div className={styles.prose}>
              <Content />
            </div>
          </ResponsiveText>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
