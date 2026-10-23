import {
  CONTACT_SECTION_HREF,
  NAV_ITEMS,
} from "../_content/site-content";
import type { Post } from "../_content/posts";
import type { ComponentType } from "react";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { ResponsiveText } from "./responsive-text";
import styles from "./blog-post.module.css";

type BlogPostProps = {
  Content: ComponentType;
  post: Post;
};

export function BlogPost({ Content, post }: BlogPostProps) {
  return (
    <div className={styles.page}>
      <SiteHeader contactHref={CONTACT_SECTION_HREF} items={NAV_ITEMS} overlay />
      <main className={styles.main} id="main-content">
        <article className={styles.article}>
          <ResponsiveText>
            <header className={styles.header}>
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
