import { expect, test } from "@playwright/test";
import type { PaperShaderElement } from "@paper-design/shaders";

type PulseProbe = PaperShaderElement & {
  samples: { smoke: number; speed: number }[];
};

test("field focus smoothly pulses smoke and speed, returns to base, and restarts without a jump", async ({ page }) => {
  await page.clock.install({ time: new Date("2030-01-01T00:00:00Z") });
  await page.goto("/");
  await page.locator("#contact").scrollIntoViewIfNeeded();
  const border = page.locator("[data-contact-border]");
  await expect(border).toHaveAttribute("data-ready", "true");
  await page.clock.pauseAt(new Date("2030-01-02T00:00:00Z"));
  await border.evaluate((element) => {
    const host = element as PulseProbe;
    const mount = host.paperShaderMount!;
    // This test inspects uniform timing; full-resolution visuals have separate coverage.
    mount.setMaxPixelCount(10_000);
    const setUniforms = mount.setUniforms;
    const setSpeed = mount.setSpeed;
    let smoke = 0.49;
    host.samples = [];
    mount.setUniforms = (uniforms) => {
      if (typeof uniforms.u_smoke === "number") smoke = uniforms.u_smoke;
      setUniforms(uniforms);
    };
    mount.setSpeed = (speed = 1) => {
      host.samples.push({ smoke, speed });
      setSpeed(speed);
    };
  });
  const latest = () => border.evaluate((element) => (element as PulseProbe).samples.at(-1)!);

  for (const label of ["Name", "Email", "Message"]) {
    await page.getByLabel(label, { exact: true }).focus();
    await page.clock.runFor(128);
    const rising = await latest();
    expect(rising.smoke).toBeGreaterThan(0.54);
    expect(rising.smoke).toBeLessThan(0.64);
    expect(rising.speed).toBeGreaterThan(0.65);
    expect(rising.speed).toBeLessThan(1);
    await page.clock.runFor(192);
    const peak = await latest();
    expect(peak.smoke).toBeCloseTo(0.78, 1);
    expect(peak.speed).toBeCloseTo(1.1, 1);
    await page.clock.runFor(128);
    const falling = await latest();
    expect(falling.smoke).toBeLessThan(peak.smoke);
    expect(falling.smoke).toBeGreaterThan(0.49);
    await page.clock.runFor(176);
    expect(await latest()).toEqual({ smoke: 0.49, speed: 0.46 });
  }

  await page.getByLabel("Name", { exact: true }).focus();
  await page.clock.runFor(128);
  const beforeRestart = await latest();
  await page.getByLabel("Email", { exact: true }).focus();
  expect(await latest()).toEqual(beforeRestart);
  await page.clock.runFor(16);
  const afterRestart = await latest();
  expect(afterRestart.smoke).toBeGreaterThanOrEqual(beforeRestart.smoke);
  expect(afterRestart.smoke - beforeRestart.smoke).toBeLessThan(0.01);
  await page.clock.runFor(640);
  expect(await latest()).toEqual({ smoke: 0.49, speed: 0.46 });
  const count = await border.evaluate((element) => (element as PulseProbe).samples.length);
  await page.getByRole("button", { name: "Get in Touch", exact: true }).focus();
  await page.clock.runFor(512);
  expect(await border.evaluate((element) => (element as PulseProbe).samples.length)).toBe(count);
});

test("contact shader loads near the form, animates, pauses offscreen and respects motion changes", async ({ page }, testInfo) => {
  await page.goto("/");
  const border = page.locator("[data-contact-border]");
  await expect(border.locator("canvas")).toHaveCount(0);
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect(border).toHaveAttribute("data-ready", "true");
  const frame = () => border.evaluate((element) =>
    (element as PaperShaderElement).paperShaderMount?.getCurrentFrame() ?? 0);
  const first = await frame();
  await expect.poll(frame).toBeGreaterThan(first);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hiddenFrame = await frame();
  await page.waitForTimeout(150);
  expect(await frame()).toBe(hiddenFrame);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(frame).toBeGreaterThan(hiddenFrame);
  await page.getByLabel("Name", { exact: true }).fill("Shader preview");
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Shader preview");
  await page.locator("#contact").screenshot({ path: testInfo.outputPath("contact-border-desktop.png") });

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(border).not.toBeInViewport();
  // Allow IntersectionObserver to deliver the exit before sampling the clock.
  await page.waitForTimeout(150);
  const paused = await frame();
  await page.waitForTimeout(150);
  expect(await frame()).toBe(paused);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(border.locator("canvas")).toHaveCount(0);
  await expect(border).not.toHaveAttribute("data-ready");
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(border).toHaveAttribute("data-ready", "true");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Email", { exact: true }).fill("preview@example.com");
  await page.locator("#contact").screenshot({ path: testInfo.outputPath("contact-border-mobile.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await border.locator("canvas").evaluate((canvas) => {
    canvas.dispatchEvent(new Event("webglcontextlost"));
  });
  await expect(border.locator("canvas")).toHaveCount(0);
  await expect(border).not.toHaveAttribute("data-ready");
});

for (const mode of ["reduced-motion", "no-webgl", "no-javascript"] as const) {
  test(`contact form retains static decoration with ${mode}`, async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: mode !== "no-javascript",
      reducedMotion: mode === "reduced-motion" ? "reduce" : "no-preference",
    });
    if (mode === "no-webgl") {
      await context.addInitScript(() => {
        HTMLCanvasElement.prototype.getContext = () => {
          document.documentElement.dataset.webglAttempted = "true";
          return null;
        };
      });
    }
    const page = await context.newPage();
    await page.goto("/");
    await page.locator("#contact").scrollIntoViewIfNeeded();
    const border = page.locator("[data-contact-border]");
    if (mode === "no-webgl") {
      await expect(page.locator("html")).toHaveAttribute("data-webgl-attempted", "true");
      await expect(border.locator("canvas")).toHaveCount(0);
    }
    await expect(border).not.toHaveAttribute("data-ready");
    expect(await border.evaluate((element) => getComputedStyle(element, "::before").opacity)).toBe("0.6");
    await page.getByLabel("Name", { exact: true }).fill("Still usable");
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Still usable");
    await context.close();
  });
}
