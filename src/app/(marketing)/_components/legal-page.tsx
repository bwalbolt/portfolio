import { ReactNode } from "react";

import { CONTACT_SECTION_HREF, NAV_ITEMS } from "../_content/site-content";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import styles from "./legal-page.module.css";

type LegalPageProps = {
  children: ReactNode;
  title: string;
  updated: string;
};

export function LegalPage({ children, title, updated }: LegalPageProps) {
  return (
    <div className={styles.page}>
      <SiteHeader contactHref={CONTACT_SECTION_HREF} items={NAV_ITEMS} />
      <main className={styles.main} id="main-content">
        <article className={styles.article}>
          <header className={styles.header}>
            <p className={styles.eyebrow}>Legal</p>
            <h1>{title}</h1>
            <p className={styles.updated}>Last updated: {updated}</p>
          </header>
          <div className={styles.content}>{children}</div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
