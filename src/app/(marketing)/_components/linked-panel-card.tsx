"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { Icon, cx } from "./primitives";
import { projectPointer } from "./panel-perimeter";
import styles from "./linked-panel-card.module.css";

type LinkedPanelVariant = "rounded" | "slanted";

interface LinkedPanelCardProps {
  href: string;
  linkLabel: string;
  children: ReactNode;
  className?: string;
  linkClassName?: string;
  variant?: LinkedPanelVariant;
}

interface SurfaceGeometry {
  height: number;
  layoutLeft: number;
  layoutTop: number;
  matrix: DOMMatrixReadOnly;
  originX: number;
  originY: number;
  width: number;
}

function resolveTransformOrigin(value: string, size: number, fallback: number) {
  const token = value.split(" ")[0] ?? "";
  if (token.endsWith("%")) return (parseFloat(token) / 100) * size;
  const pixels = parseFloat(token);
  return Number.isFinite(pixels) ? pixels : fallback;
}

function applyMatrix(matrix: DOMMatrixReadOnly, x: number, y: number) {
  return {
    x: matrix.a * x + matrix.c * y + matrix.e,
    y: matrix.b * x + matrix.d * y + matrix.f,
  };
}

function readSurfaceGeometry(wrapper: HTMLElement, surface: HTMLElement): SurfaceGeometry {
  const wrapperBounds = wrapper.getBoundingClientRect();
  const surfaceBounds = surface.getBoundingClientRect();
  const computed = getComputedStyle(surface);
  const width = computed.transform === "none" ? surfaceBounds.width : surface.offsetWidth;
  const height = computed.transform === "none" ? surfaceBounds.height : surface.offsetHeight;
  const matrix = new DOMMatrix(computed.transform === "none" ? undefined : computed.transform);

  return {
    height,
    layoutLeft: wrapperBounds.left + surface.offsetLeft,
    layoutTop: wrapperBounds.top + surface.offsetTop,
    matrix,
    originX: resolveTransformOrigin(computed.transformOrigin, width, width / 2),
    originY: resolveTransformOrigin(computed.transformOrigin.split(" ").slice(1).join(" "), height, height / 2),
    width,
  };
}

function toSurfacePoint(geometry: SurfaceGeometry, clientX: number, clientY: number) {
  const inverse = geometry.matrix.inverse();
  const point = applyMatrix(
    inverse,
    clientX - geometry.layoutLeft - geometry.originX,
    clientY - geometry.layoutTop - geometry.originY,
  );
  return {
    x: point.x + geometry.originX,
    y: point.y + geometry.originY,
  };
}

/** A single-destination article. Children must not contain interactive controls. */
export function LinkedPanelCard({
  href,
  linkLabel,
  children,
  className,
  linkClassName,
  variant = "rounded",
}: LinkedPanelCardProps) {
  const wrapperRef = useRef<HTMLElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const surface = surfaceRef.current;
    if (!wrapper || !surface) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const hover = matchMedia("(any-hover: hover) and (any-pointer: fine)");
    const breakpoint = matchMedia("(width >= 48rem)");
    const slanted = variant === "slanted";
    const interactive = slanted ? surface : wrapper;
    let pointer: { x: number; y: number } | undefined;
    let position = { x: 0, y: 0 };
    let geometry = readSurfaceGeometry(wrapper, surface);

    const paint = () => {
      wrapper.style.setProperty("--glow-x", String(position.x));
      wrapper.style.setProperty("--glow-y", String(position.y));
      if (slanted) {
        const surfaceLeft = surface.offsetLeft;
        const surfaceTop = surface.offsetTop;
        const pinkLeft = surfaceLeft + position.x * (geometry.width - geometry.width * 0.54);
        const pinkTop = surfaceTop + geometry.height * (0.05 + position.y * 0.14);
        const amberLeft = surfaceLeft + position.x * (geometry.width - 32);
        const amberTop = surfaceTop + position.y * (geometry.height - 32);
        const originX = surfaceLeft + geometry.originX;
        const originY = surfaceTop + geometry.originY;

        wrapper.style.setProperty("--glow-pink-left", `${pinkLeft}px`);
        wrapper.style.setProperty("--glow-pink-top", `${pinkTop}px`);
        wrapper.style.setProperty("--glow-pink-origin-x", `${originX - pinkLeft}px`);
        wrapper.style.setProperty("--glow-pink-origin-y", `${originY - pinkTop}px`);
        wrapper.style.setProperty("--glow-amber-left", `${amberLeft}px`);
        wrapper.style.setProperty("--glow-amber-top", `${amberTop}px`);
        wrapper.style.setProperty("--glow-amber-origin-x", `${originX - amberLeft}px`);
        wrapper.style.setProperty("--glow-amber-origin-y", `${originY - amberTop}px`);
        wrapper.style.setProperty("--slanted-glow-transform", geometry.matrix.toString());
      }
    };
    const update = () => {
      if (!pointer || reduced.matches || !hover.matches || wrapper.querySelector(":focus-visible")) return;
      geometry = readSurfaceGeometry(wrapper, surface);
      const point = toSurfacePoint(geometry, pointer.x, pointer.y);
      if (!geometry.width || !geometry.height || point.x < 0 || point.x > geometry.width || point.y < 0 || point.y > geometry.height || (slanted && !surface.matches(":hover"))) {
        pointer = undefined;
        return;
      }
      position = projectPointer(
        point.x,
        point.y,
        geometry.width,
        geometry.height,
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
    const reset = () => { position = { x: 0, y: 0 }; geometry = readSurfaceGeometry(wrapper, surface); paint(); };
    const geometryChanged = () => {
      geometry = readSurfaceGeometry(wrapper, surface);
      update();
    };
    const observer = new ResizeObserver(geometryChanged);
    observer.observe(surface);
    interactive.addEventListener("pointerenter", move);
    interactive.addEventListener("pointermove", move);
    interactive.addEventListener("pointerleave", leave);
    interactive.addEventListener("pointercancel", leave);
    wrapper.addEventListener("focusin", reset);
    window.addEventListener("scroll", geometryChanged, true);
    window.addEventListener("resize", geometryChanged);
    reduced.addEventListener("change", reset);
    hover.addEventListener("change", reset);
    breakpoint.addEventListener("change", geometryChanged);
    paint();
    return () => {
      observer.disconnect();
      interactive.removeEventListener("pointerenter", move);
      interactive.removeEventListener("pointermove", move);
      interactive.removeEventListener("pointerleave", leave);
      interactive.removeEventListener("pointercancel", leave);
      wrapper.removeEventListener("focusin", reset);
      window.removeEventListener("scroll", geometryChanged, true);
      window.removeEventListener("resize", geometryChanged);
      reduced.removeEventListener("change", reset);
      hover.removeEventListener("change", reset);
      breakpoint.removeEventListener("change", geometryChanged);
    };
  }, [variant]);

  return (
    <article className={cx(styles.wrapper, variant === "slanted" && styles.slanted)} ref={wrapperRef}>
      <div className={cx(styles.surface, variant === "slanted" && styles.slantedSurface, className)} ref={surfaceRef}>
        {children}
        <Link href={href} aria-label={linkLabel} className={cx(styles.link, linkClassName)}>
          <span className={styles.linkContent}>
            <span>Read more</span>
            <Icon name="arrow" />
          </span>
        </Link>
      </div>
    </article>
  );
}
