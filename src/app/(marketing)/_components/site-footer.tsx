import Link from "next/link";

import {
  COPYRIGHT_LABEL,
  NAV_ITEMS,
  SITE_NAME,
  SITE_TAGLINE,
} from "../_content/site-content";
import { Container } from "./primitives";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Container className={styles.inner}>
        <div className={styles.brandBlock}>
          <Link className={styles.brand} href="/">
            {SITE_NAME}
          </Link>
          <p className={styles.tagline}>{SITE_TAGLINE}</p>
        </div>

        <nav aria-label="Footer" className={styles.nav}>
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link className={styles.navLink} href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className={styles.copyright}>{COPYRIGHT_LABEL}</p>
      </Container>
    </footer>
  );
}
