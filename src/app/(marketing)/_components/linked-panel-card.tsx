"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { Icon, cx } from "./primitives";
import { projectPointer } from "./panel-perimeter";
import styles from "./linked-panel-card.module.css";

interface LinkedPanelCardProps {
  href: string;
  linkLabel: string;
  children: ReactNode;
  className?: string;
  linkClassName?: string;
}

/** A single-destination article. Children must not contain interactive controls. */
export function LinkedPanelCard({ href, linkLabel, children, className, linkClassName }: LinkedPanelCardProps) {
  const wrapperRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const hover = matchMedia("(any-hover: hover) and (any-pointer: fine)");
    let pointer: { x: number; y: number } | undefined;
    let position = { x: 0, y: 0 };

    const paint = () => {
      wrapper.style.setProperty("--glow-x", String(position.x));
      wrapper.style.setProperty("--glow-y", String(position.y));
    };
    const update = () => {
      if (!pointer || reduced.matches || !hover.matches || wrapper.querySelector(":focus-visible")) return;
      const bounds = wrapper.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      if (pointer.x < bounds.left || pointer.x > bounds.right || pointer.y < bounds.top || pointer.y > bounds.bottom) {
        pointer = undefined;
        return;
      }
      position = projectPointer(
        pointer.x - bounds.left,
        pointer.y - bounds.top,
        bounds.width,
        bounds.height,
        position,
      );
      paint();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer = { x: event.clientX, y: event.clientY };
      update();
    };
    const leave = () => { pointer = undefined; };
    const reset = () => { position = { x: 0, y: 0 }; paint(); };
    const geometryChanged = () => update();
    const observer = new ResizeObserver(geometryChanged);
    observer.observe(wrapper);
    wrapper.addEventListener("pointerenter", move);
    wrapper.addEventListener("pointermove", move);
    wrapper.addEventListener("pointerleave", leave);
    wrapper.addEventListener("pointercancel", leave);
    wrapper.addEventListener("focusin", reset);
    window.addEventListener("scroll", geometryChanged, true);
    reduced.addEventListener("change", reset);
    hover.addEventListener("change", reset);
    return () => {
      observer.disconnect();
      wrapper.removeEventListener("pointerenter", move);
      wrapper.removeEventListener("pointermove", move);
      wrapper.removeEventListener("pointerleave", leave);
      wrapper.removeEventListener("pointercancel", leave);
      wrapper.removeEventListener("focusin", reset);
      window.removeEventListener("scroll", geometryChanged, true);
      reduced.removeEventListener("change", reset);
      hover.removeEventListener("change", reset);
    };
  }, []);

  return (
    <article className={styles.wrapper} ref={wrapperRef}>
      <div className={cx(styles.surface, className)}>
        {children}
        <Link href={href} aria-label={linkLabel} className={cx(styles.link, linkClassName)}>
          <span>Read more</span>
          <Icon name="arrow" />
        </Link>
      </div>
    </article>
  );
}
