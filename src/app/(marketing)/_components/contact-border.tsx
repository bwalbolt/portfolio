"use client";

import { useEffect, useRef } from "react";
import type { PulsingBorderUniforms, ShaderMount } from "@paper-design/shaders";
import styles from "./contact-border.module.css";

// Base settings and focus targets stay together for visual tuning.
const colors = ["#00aeff", "#e34fda", "#ffb30085"];
const speed = 0.46;
const focusPulse = { smoke: 0.78, speed: 1.1, duration: 300 };
const settings: Omit<PulsingBorderUniforms, "u_colors" | "u_colorBack"> = {
  u_colorsCount: colors.length,
  u_roundness: 0.08,
  u_thickness: 0.07,
  u_softness: 1,
  u_aspectRatio: 0, // auto
  u_intensity: 0.05,
  u_bloom: 0.19,
  u_spots: 4,
  u_spotSize: 0.5,
  u_pulse: 0.04,
  u_smoke: 0.49,
  u_smokeSize: 0.57,
  u_scale: 0.6,
  u_offsetX: -0.02,
  u_offsetY: 0,
  u_marginLeft: 0,
  u_marginRight: 0,
  u_marginTop: 0,
  u_marginBottom: 0,
  u_fit: 1,
  u_rotation: 0,
  u_originX: 0.5,
  u_originY: 0.5,
  u_worldWidth: 0,
  u_worldHeight: 0,
};

export function ContactBorder() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let loading = false;
    let nearby = false;
    let mount: ShaderMount | undefined;
    let pulseFrame: number | undefined;
    let pulseAmount = 0;
    let pendingFocus = false;
    // Keep the static form server-rendered; listen only within this form frame.
    const form = host.parentElement?.querySelector("form");
    const isField = (target: EventTarget | null) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement;

    const stopPulse = () => {
      if (pulseFrame !== undefined) cancelAnimationFrame(pulseFrame);
      pulseFrame = undefined;
      pulseAmount = 0;
    };

    const pulse = () => {
      if (!mount || motion.matches || document.hidden) return;
      if (pulseFrame !== undefined) cancelAnimationFrame(pulseFrame);
      // A new focus rises from the current intensity instead of snapping to base.
      const from = pulseAmount;
      const started = performance.now();
      const tick = (now: number) => {
        if (!mount) return;
        const elapsed = now - started;
        const rising = elapsed < focusPulse.duration;
        const progress = Math.min(
          1,
          (rising ? elapsed : elapsed - focusPulse.duration) / focusPulse.duration,
        );
        const eased = progress * progress * (3 - 2 * progress);
        pulseAmount = rising ? from + (1 - from) * eased : 1 - eased;
        mount.setUniforms({
          u_smoke: settings.u_smoke + (focusPulse.smoke - settings.u_smoke) * pulseAmount,
        });
        mount.setSpeed(speed + (focusPulse.speed - speed) * pulseAmount);
        pulseFrame = elapsed < focusPulse.duration * 2
          ? requestAnimationFrame(tick)
          : undefined;
      };
      pulseFrame = requestAnimationFrame(tick);
    };

    const reset = () => {
      stopPulse();
      mount?.dispose();
      mount = undefined;
      host.replaceChildren();
      delete host.dataset.ready;
    };

    const start = async () => {
      if (disposed || loading || mount || !nearby || motion.matches) return;
      loading = true;
      try {
        const paper = await import("@paper-design/shaders");
        const noise = paper.getShaderNoiseTexture();
        await noise?.decode();
        if (disposed || motion.matches || !nearby) return;

        mount = new paper.ShaderMount(
          host,
          paper.pulsingBorderFragmentShader,
          {
            ...settings,
            u_colors: colors.map(paper.getShaderColorFromString),
            u_colorBack: paper.getShaderColorFromString("#000000"),
            u_noiseTexture: noise,
          },
          undefined,
          speed,
          0,
          1,
          1280 * 720,
        );
        host.dataset.ready = "true";
        if (pendingFocus && form?.contains(document.activeElement) && isField(document.activeElement)) {
          pulse();
        }
        pendingFocus = false;
      } catch {
        // Decoration must never prevent access to the server-rendered form.
        reset();
      } finally {
        loading = false;
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      nearby = entry.isIntersecting;
      void start();
    }, { rootMargin: "200px" });
    observer.observe(host);

    const onMotionChange = () => {
      if (motion.matches) reset();
      else void start();
    };
    const onFocus = (event: FocusEvent) => {
      if (!isField(event.target) || motion.matches) return;
      if (mount) pulse();
      else {
        pendingFocus = true;
        void start();
      }
    };
    const onVisibilityChange = () => {
      if (!document.hidden) return;
      pendingFocus = false;
      stopPulse();
      mount?.setUniforms({ u_smoke: settings.u_smoke });
      mount?.setSpeed(speed);
    };
    // Retain the fallback if a device loses its GPU context during the visit.
    const onContextLost = () => reset();
    host.addEventListener("webglcontextlost", onContextLost, true);
    motion.addEventListener("change", onMotionChange);
    form?.addEventListener("focusin", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      observer.disconnect();
      motion.removeEventListener("change", onMotionChange);
      form?.removeEventListener("focusin", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      host.removeEventListener("webglcontextlost", onContextLost, true);
      reset();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className={styles.border} data-contact-border="" />;
}
