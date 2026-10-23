import type { Metadata } from "next";
import { getPosts } from "../_content/posts";
import { CONTACT_SECTION_HREF, NAV_ITEMS } from "../_content/site-content";
import { PostListing } from "../_components/post-listing";
import styles from "../_components/post-listing.module.css";
import { Container } from "../_components/primitives";
import { SiteFooter } from "../_components/site-footer";
import { SiteHeader } from "../_components/site-header";
import { absoluteUrl } from "../../site-config";

export const metadata: Metadata = {
  title: "Latest Insights",
  description: "Notes on design engineering, accessible interfaces, performance, and practical frontend workflows.",
  alternates: { canonical: absoluteUrl("/blog") },
};

export default function BlogPage() {
  return (
    <div className={styles.page}>
      <SiteHeader contactHref={CONTACT_SECTION_HREF} items={NAV_ITEMS} overlay />
      <main className={styles.main} id="main-content">
        <Container className={styles.content}>
          <h1 className={styles.heading}>Latest Insights</h1>
          <PostListing articleOrigin="blog" posts={getPosts()} />
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
