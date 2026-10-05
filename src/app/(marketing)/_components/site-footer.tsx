import Link from "next/link";

import { COPYRIGHT_LABEL, SITE_TAGLINE } from "../_content/site-content";
import { Container } from "./primitives";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Container className={styles.inner}>
        <div className={styles.details}>
          <p className={styles.tagline}>{SITE_TAGLINE}</p>
          <p className={styles.copyright}>{COPYRIGHT_LABEL}</p>
        </div>

        <nav aria-label="Legal" className={styles.legal}>
          <ul className={styles.navList}>
            <li>
              <Link className={styles.navLink} href="/privacy-policy">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link className={styles.navLink} href="/terms-of-use">
                Terms of Use
              </Link>
            </li>
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
