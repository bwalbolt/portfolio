import {
  CONTACT_SECTION_HREF,
  NAV_ITEMS,
  SITE_NAME,
} from "../_content/site-content";
import { Button, Icon } from "./primitives";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import styles from "./route-placeholder.module.css";

type RoutePlaceholderProps = {
  description: string;
  eyebrow: string;
  title: string;
};

export function RoutePlaceholder({
  description,
  eyebrow,
  title,
}: RoutePlaceholderProps) {
  return (
    <div className={styles.page}>
      <SiteHeader
        contactHref={CONTACT_SECTION_HREF}
        items={NAV_ITEMS}
      />

      <main className={styles.main} id="main-content">
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.card}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.description}>{description}</p>

            <div className={styles.actions}>
              <Button href="/">Back Home</Button>
              <Button
                href={CONTACT_SECTION_HREF}
                icon={<Icon name="arrow" />}
                kind="text"
              >
                Jump to Contact
              </Button>
            </div>

            <div className={styles.note}>
              <p className={styles.noteTitle}>Scaffolded Route</p>
              <p className={styles.noteBody}>
                This page exists so the homepage navigation and card links stay
                valid while the detailed {title.toLowerCase()} content is built
                out.
              </p>
              <p className={styles.noteFoot}>{SITE_NAME}</p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
