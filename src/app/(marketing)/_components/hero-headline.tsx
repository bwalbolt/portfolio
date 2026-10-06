"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { gsap as Gsap } from "gsap";
import styles from "./homepage.module.css";
import motion from "./hero-headline.module.css";

// Seconds, degrees, and relative distances live together for motion refinement.
const choreography = {
  cursorFade: 0.45,
  blueFade: 0.35,
  pickup: 0.65,
  overshoot: 1.15,
  blueRecover: 1.151,
  release: 1.5,
  race: 1.8,
  raceExit: 2.2,
  wrap: 2.26,
  approach: 2.8,
  brake: 2.95,
  brakeRelease: 3.05,
  stop: 3.25,
  compressed: 3.88,
  settled: 4.55,
  fade: 4.55,
  end: 5,
  tilt: 6,
  skew: 8,
  impactSkew: -27,
  // The previous curve peaked at ~0.64–0.73em, beyond its nominal endpoint.
  blueOvershootEm: 0.3,
  blueRecoveryLiftEm: 0.4,
  compressionX: 0.7,
  compressionY: 1.2,
};

/** Shared decorative artwork; the parent timeline owns its transform. */
export function AnimationCursor() {
  return (
    <span aria-hidden="true" className={motion.cursor} data-animation-cursor>
      <Image alt="" src="/images/animation-cursor.svg" width={64.3877} height={63.0708} unoptimized />
    </span>
  );
}

/** Server-prerendered headline with a bounded, optional motion enhancement. */
export function HeroHeadline() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = headingRef.current;
    const blue = heading?.querySelector<HTMLElement>('[data-highlight="blue"]');
    const purple = heading?.querySelector<HTMLElement>('[data-highlight="purple"]');
    const cursor = heading?.querySelector<HTMLElement>("[data-animation-cursor]");
    const cursorImage = cursor?.querySelector("img");
    const hero = heading?.closest("section");
    if (!heading || !blue || !purple || !cursor || !cursorImage || !hero) return;

    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let finished = false;
    let timeline: ReturnType<typeof Gsap.timeline> | undefined;
    let context: ReturnType<typeof Gsap.context> | undefined;
    let cancelPlayback: (() => void) | undefined;
    const finish = () => {
      finished = true;
      cancelPlayback?.();
      timeline?.kill();
      context?.revert();
      heading.dataset.heroMotion = "complete";
      blue.style.removeProperty("opacity");
      blue.style.removeProperty("transform");
      purple.style.removeProperty("opacity");
      purple.style.removeProperty("transform");
      cursor.style.removeProperty("opacity");
      cursor.style.removeProperty("transform");
    };
    const onPreference = () => { if (preference.matches) finish(); };
    const onVisibility = () => { if (document.hidden) finish(); };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) finish();
    });
    observer.observe(hero);
    window.addEventListener("resize", finish);
    preference.addEventListener("change", onPreference);
    document.addEventListener("visibilitychange", onVisibility);
    const onPreparationEnd = (event: AnimationEvent) => {
      if (event.target === blue && heading.dataset.heroMotion === "preparing") finish();
    };
    blue.addEventListener("animationend", onPreparationEnd);

    async function start() {
      if (!heading || !blue || !purple || !cursor || !cursorImage || !hero) return;
      if (preference.matches || document.hidden || getComputedStyle(blue).opacity !== "0") {
        finish();
        return;
      }
      try {
        const [{ gsap }] = await Promise.all([
          import("gsap"),
          document.fonts.ready,
          cursorImage.decode(),
        ]);
        // The CSS deadline may have passed before its animationend was delivered.
        if (disposed || finished) return;
        if (preference.matches || document.hidden || getComputedStyle(blue).opacity !== "0") {
          finish();
          return;
        }

        const bounds = heading.getBoundingClientRect();
        const blueBox = blue.getBoundingClientRect();
        const purpleBox = purple.getBoundingClientRect();
        const heroBox = hero.getBoundingClientRect();
        if (heroBox.bottom <= 0 || heroBox.top >= innerHeight) { finish(); return; }
        const em = parseFloat(getComputedStyle(heading).fontSize);
        const scale = Math.min(1, em / 70);
        // Figma's revised pose is ~160px above and half a phrase-width right
        // at 70px type. Clamp the staging to the visible mobile hero area.
        const lift = Math.min(em * (160 / 70), Math.max(0, blueBox.top - heroBox.top - 56));
        const offsetX = Math.min(blueBox.width * 0.55, Math.max(0, innerWidth - blueBox.right - bounds.left));
        // The shared curve keeps the cursor tip attached through the overshoot.
        const gripX = blueBox.left - bounds.left + blueBox.width * 0.5;
        const gripY = blueBox.top - bounds.top + em * 0.22;
        const restX = Math.min(bounds.width - 51 * scale, purpleBox.right - bounds.left + em * 0.35);
        const restY = bounds.height + em * 0.45;
        const margin = em; // Include skewed glyph extents beyond the inline box.
        const offLeft = -purpleBox.right - margin;
        const offRight = innerWidth - purpleBox.left + margin;
        const overshoot = em * choreography.blueOvershootEm;

        context = gsap.context(() => {
          gsap.set([blue, purple], { opacity: 0 });
          gsap.set(blue, { x: offsetX + em * 0.08, y: -lift });
          gsap.set(purple, { x: offLeft, skewX: -choreography.skew, transformOrigin: "100% 85%" });
          gsap.set(cursor, {
            x: blueBox.left - bounds.left + em * 1.55,
            y: blueBox.top - bounds.top + em * (30 / 70),
            scale,
            rotation: -choreography.tilt,
          });
          const tl = gsap.timeline({ paused: true, onComplete: finish });
          timeline = tl;
          tl.to(cursor, { opacity: 1, duration: choreography.cursorFade }, 0)
            .to(cursor, { x: gripX + offsetX, y: gripY - lift, rotation: 0, duration: choreography.pickup, ease: "power2.out" }, 0)
            .to(cursor, { scale: scale * 0.94, duration: 0.12, yoyo: true, repeat: 1, ease: "sine.inOut" }, choreography.pickup)
            .to(blue, { opacity: 1, x: offsetX, duration: choreography.pickup - choreography.blueFade, ease: "sine.inOut" }, choreography.blueFade);

          // Two cubic sections form one smooth path through pickup, the raised
          // recovery point, and release. Equal vertical handles at recovery
          // preserve the tangent through the turn instead of a horizontal exit.
          const recoveryY = -em * choreography.blueRecoveryLiftEm;
          const handle = Math.max(0, Math.min((lift + recoveryY) / 2, -recoveryY / 2));
          const recovery = { x: -overshoot, y: recoveryY };
          const incoming = [
            { x: offsetX, y: -lift },
            { x: -overshoot, y: -lift },
            { x: -overshoot, y: recoveryY - handle },
            recovery,
          ] as const;
          const outgoing = [
            recovery,
            { x: -overshoot, y: recoveryY + handle },
            { x: -overshoot / 2, y: 0 },
            { x: 0, y: 0 },
          ] as const;
          // Quick setters update only transforms, without frame-by-frame layout.
          const setBlueX = gsap.quickSetter(blue, "x", "px");
          const setBlueY = gsap.quickSetter(blue, "y", "px");
          const setCursorX = gsap.quickSetter(cursor, "x", "px");
          const setCursorY = gsap.quickSetter(cursor, "y", "px");
          const arc = { progress: 0 };
          const renderArc = () => {
            const inbound = arc.progress <= 0.5;
            const [p0, p1, p2, p3] = inbound ? incoming : outgoing;
            const t = inbound ? arc.progress * 2 : (arc.progress - 0.5) * 2;
            const inverse = 1 - t;
            const x = inverse ** 3 * p0.x
              + 3 * inverse ** 2 * t * p1.x
              + 3 * inverse * t ** 2 * p2.x
              + t ** 3 * p3.x;
            const y = inverse ** 3 * p0.y
              + 3 * inverse ** 2 * t * p1.y
              + 3 * inverse * t ** 2 * p2.y
              + t ** 3 * p3.y;
            setBlueX(x);
            setBlueY(y);
            setCursorX(gripX + x);
            setCursorY(gripY + y);
          };
          tl.to(arc, {
            progress: 0.5,
            duration: choreography.overshoot - choreography.pickup,
            ease: "power1.inOut",
            onUpdate: renderArc,
          }, choreography.pickup);
          tl.to(arc, {
            progress: 1,
            duration: choreography.release - choreography.blueRecover,
            ease: "sine.inOut",
            onUpdate: renderArc,
          }, choreography.blueRecover);
          tl.to(cursor, { rotation: choreography.tilt, duration: 0.6, ease: "sine.inOut" }, choreography.pickup)
            .to(cursor, { rotation: 0, duration: 0.4 }, choreography.release - 0.4)
            .set(purple, { opacity: 1 }, choreography.race)
            .to(purple, { x: offRight, duration: choreography.raceExit - choreography.race, ease: "none" }, choreography.race)
            .set(purple, { x: offLeft, skewX: choreography.skew }, choreography.wrap)
            .to(purple, { x: -em * 2.7, duration: choreography.approach - choreography.wrap, ease: "none" }, choreography.wrap)
            .to(purple, { x: -em * 1.55, duration: choreography.brake - choreography.approach, ease: "none" }, choreography.approach)
            // One soft brake tap halves the local forward speed, then releases.
            // Keep the lean backward until translation reaches the stop.
            .to(purple, { x: -em * 1.25, skewX: 6, duration: choreography.brakeRelease - choreography.brake, ease: "none" }, choreography.brake)
            .to(purple, { x: 0, skewX: 5, duration: choreography.stop - choreography.brakeRelease, ease: "power1.out" }, choreography.brakeRelease)
            // The right/baseline anchor stays at the stopping line. Only shape
            // and lean recoil; there is no positional overshoot or bounce.
            .to(purple, { scaleX: choreography.compressionX, scaleY: choreography.compressionY, skewX: choreography.impactSkew, duration: choreography.compressed - choreography.stop, ease: "power2.out" }, choreography.stop)
            .to(purple, { scaleX: 1, scaleY: 1, skewX: 0, duration: choreography.settled - choreography.compressed, ease: "elastic.out(1, 0.5)" }, choreography.compressed)
            .to(cursor, { x: restX, duration: 0.8, ease: "sine.inOut" }, choreography.release)
            .to(cursor, { y: restY, duration: 0.9, ease: "power2.inOut" }, choreography.release)
            .to(cursor, { rotation: -choreography.tilt, duration: 0.35 }, choreography.release)
            .to(cursor, { rotation: 0, duration: 0.45, ease: "sine.out" }, choreography.release + 0.45)
            .to(cursor, { opacity: 0, duration: choreography.end - choreography.fade }, choreography.fade);
          // Start after GSAP updates its root clock; a cold import can leave
          // that clock behind wall time and otherwise skip the opening fade.
          const play = () => {
            if (disposed || finished) return;
            if (getComputedStyle(blue).opacity !== "0") { finish(); return; }
            heading.dataset.heroMotion = "playing";
            tl.play(0);
          };
          cancelPlayback = () => gsap.ticker.remove(play);
          gsap.ticker.add(play, true);
        }, heading);
      } catch {
        if (!disposed) finish();
      }
    }
    void start();
    return () => {
      disposed = true;
      cancelPlayback?.();
      timeline?.kill();
      context?.revert();
      observer.disconnect();
      window.removeEventListener("resize", finish);
      preference.removeEventListener("change", onPreference);
      document.removeEventListener("visibilitychange", onVisibility);
      blue.removeEventListener("animationend", onPreparationEnd);
    };
  }, []);

  return (
    <h1 ref={headingRef} className={`${styles.heroTitle} ${motion.title}`} data-hero-motion="preparing">
      <span className={styles.heroLine}>
        <span className={styles.heroPhrase}>
          {"Building "}<br className={styles.heroBreakNarrow} />
          <span className={styles.heroHighlightBlue} data-highlight="blue">hand-crafted</span>
        </span>{" "}
        <br className={styles.heroBreakMobile} />{"experiences,"}
      </span>{" "}
      <span className={styles.heroLine}>
        {"using "}<br className={styles.heroBreakMobile} />
        <span className={styles.heroPhrase}>
          <span className={styles.heroHighlightPurple} data-highlight="purple">AI-accelerated</span>{" "}
          <br className={styles.heroBreakSmall} />{"workflows"}
        </span>
      </span>
      <AnimationCursor />
    </h1>
  );
}
