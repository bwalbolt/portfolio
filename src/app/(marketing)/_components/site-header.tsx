"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { NavigationItem } from "../_content/site-content";
import { SITE_NAME } from "../_content/site-content";
import { Icon, LinkButton, VisuallyHidden, cx } from "./primitives";
import styles from "./site-header.module.css";

type SiteHeaderProps = {
  contactHref: string;
  items: readonly NavigationItem[];
  overlay?: boolean;
};

export function SiteHeader({
  contactHref,
  items,
  overlay = false,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={cx(styles.header, overlay && styles.headerOverlay)}>
      <div className={styles.bar}>
        <Link className={styles.brand} href="/" onClick={closeMenu}>
          {SITE_NAME}
        </Link>

        <nav aria-label="Primary" className={styles.desktopNav}>
          <ul className={styles.desktopNavList}>
            {items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    className={cx(styles.navLink, isActive && styles.navLinkActive)}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.actions}>
          <LinkButton className={styles.contactCta} href={contactHref}>
            Get in Touch
          </LinkButton>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            className={styles.menuButton}
            onClick={() => setIsMenuOpen((current) => !current)}
            type="button"
          >
            <VisuallyHidden>Toggle navigation</VisuallyHidden>
            <Icon name="menu" />
          </button>
        </div>
      </div>

      <div
        className={cx(styles.mobilePanel, isMenuOpen && styles.mobilePanelOpen)}
        id="mobile-navigation"
      >
        <nav aria-label="Mobile">
          <ul className={styles.mobileNavList}>
            {items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    className={cx(
                      styles.mobileNavLink,
                      isActive && styles.mobileNavLinkActive,
                    )}
                    href={item.href}
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
