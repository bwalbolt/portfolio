import { getTutorialPosts } from "../_content/posts";
import { CONTACT_SECTION_HREF, NAV_ITEMS } from "../_content/site-content";
import { PostListing } from "../_components/post-listing";
import styles from "../_components/post-listing.module.css";
import { Container } from "../_components/primitives";
import { SiteFooter } from "../_components/site-footer";
import { SiteHeader } from "../_components/site-header";

export default function TutorialPage() {
  return (
    <div className={styles.page}>
      <SiteHeader contactHref={CONTACT_SECTION_HREF} items={NAV_ITEMS} overlay />
      <main className={styles.main} id="main-content">
        <Container className={styles.content}>
          <h1 className={styles.heading}>Tutorials</h1>
          <PostListing articleOrigin="tutorial" posts={getTutorialPosts()} />
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
