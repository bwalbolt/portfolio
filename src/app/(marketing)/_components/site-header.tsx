"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { NavigationItem } from "../_content/site-content";
import { SITE_NAME } from "../_content/site-content";
import { BrandLogo } from "./brand-logo";
import { useArticleOrigin, useArticleOriginHint } from "./article-origin";
import { Button, Icon, VisuallyHidden, cx } from "./primitives";
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
  const { articleOrigin } = useArticleOrigin();
  const queryOrigin = useArticleOriginHint();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) {
      return;
    }

    const updateScrolledState = () => {
      setIsScrolled(window.scrollY > 8);
    };

    updateScrolledState();
    window.addEventListener("scroll", updateScrolledState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrolledState);
    };
  }, [overlay]);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isArticleRoute = /^\/blog\/[^/]+$/.test(pathname);
  const isActive = (href: string) => {
    if (isArticleRoute) {
      const resolvedOrigin = queryOrigin ?? articleOrigin;
      return (href === "/blog" && resolvedOrigin === "blog")
        || (href === "/tutorial" && resolvedOrigin === "tutorial");
    }

    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  return (
    <header
      className={cx(
        styles.header,
        overlay && styles.headerOverlay,
        overlay && isScrolled && styles.headerOverlayScrolled,
      )}
    >
      <div className={styles.bar}>
        <Link
          aria-label={SITE_NAME}
          className={styles.brand}
          href="/"
          onClick={closeMenu}
        >
          <BrandLogo />
        </Link>

        <nav aria-label="Primary" className={styles.desktopNav}>
          <ul className={styles.desktopNavList}>
            {items.map((item) => {
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={cx(styles.navLink, active && styles.navLinkActive)}
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
          <Button
            className={styles.contactCta}
            href={contactHref}
            size="small"
          >
            Get in Touch
          </Button>

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
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      styles.mobileNavLink,
                      active && styles.mobileNavLinkActive,
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
