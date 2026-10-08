import { expect, test, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const headline = "Building hand-crafted experiences, using AI-accelerated workflows";
const headingSelector = "[data-hero-motion]";

interface MotionFrame {
  time: number;
  blue: { x: number; y: number; opacity: number; top: number };
  purple: { x: number; left: number; right: number; skew: number; opacity: number; scaleX: number; scaleY: number };
  cursor: { x: number; y: number; opacity: number };
  heading: { x: number; y: number; width: number; height: number };
  overflow: boolean;
}
declare global {
  interface Window { heroFrames: MotionFrame[] }
}

async function recordMotion(page: Page) {
  await page.addInitScript(() => {
    const samples: MotionFrame[] = [];
    window.heroFrames = samples;
    let started: number | undefined;
    const tick = () => {
      const heading = document.querySelector<HTMLElement>("[data-hero-motion]");
      if (heading?.dataset.heroMotion === "playing") {
        started ??= performance.now();
        const read = (selector: string) => {
          const element = heading.querySelector<HTMLElement>(selector)!;
          const style = getComputedStyle(element);
          const matrix = new DOMMatrix(style.transform === "none" ? undefined : style.transform);
          const box = element.getBoundingClientRect();
          return { x: matrix.e, y: matrix.f, opacity: Number(style.opacity), left: box.left, right: box.right, top: box.top, skew: matrix.c, scaleX: matrix.a, scaleY: matrix.d };
        };
        const box = heading.getBoundingClientRect();
        samples.push({
          time: performance.now() - started,
          blue: read('[data-highlight="blue"]'),
          purple: read('[data-highlight="purple"]'),
          cursor: read("[data-animation-cursor]"),
          heading: { x: box.x, y: box.y, width: box.width, height: box.height },
          overflow: document.documentElement.scrollWidth > innerWidth,
        });
      }
      if (!started || heading?.dataset.heroMotion === "playing") requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

async function expectStatic(page: Page) {
  const heading = page.locator(headingSelector);
  await expect(heading).toHaveAccessibleName(headline);
  for (const color of ["blue", "purple"]) {
    await expect(heading.locator(`[data-highlight="${color}"]`)).toHaveCSS("opacity", "1");
    await expect(heading.locator(`[data-highlight="${color}"]`)).toHaveCSS("transform", "none");
  }
  await expect(heading.locator("[data-animation-cursor]")).toHaveCSS("opacity", "0");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
}

for (const width of [320, 390, 1280]) {
  test(`hero choreographs the drag, full wrap and settling at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    // Drive rAF explicitly: parallel browser workers can otherwise skip the
    // short fade/exit windows, even when the timeline itself is correct.
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await recordMotion(page);
    await page.goto("/");
    await expect(page.locator("[data-animation-cursor]")).toHaveAttribute("style", /transform/);
    await page.clock.runFor(32);
    await expect(page.locator(headingSelector)).toHaveAttribute("data-hero-motion", "playing");
    let previousTime = 0;
    for (const [name, time] of [["pickup", 450], ["arc", 1000], ["recovery", 1200], ["arrival", 1350], ["braking", 3000], ["compression", 3880], ["settled", 4600]] as const) {
      await page.clock.runFor(time - previousTime);
      previousTime = time;
      const path = testInfo.outputPath(`hero-${width}-${name}.png`);
      await page.locator("main > section").first().screenshot({ path });
      await testInfo.attach(`hero-${width}-${name}`, { path, contentType: "image/png" });
    }
    await page.clock.runFor(700);
    await expect(page.locator(headingSelector)).toHaveAttribute("data-hero-motion", "complete");
    await expectStatic(page);
    const frames = await page.evaluate(() => window.heroFrames);
    await writeFile(testInfo.outputPath("motion-frames.json"), JSON.stringify(frames));
    const during = (from: number, to: number) => frames.filter(frame => frame.time >= from && frame.time < to);
    const em = await page.locator(headingSelector).evaluate(element => parseFloat(getComputedStyle(element).fontSize));
    const cursorFade = during(30, 350);
    expect(cursorFade.some(f => f.cursor.opacity > 0 && f.cursor.opacity < 1)).toBe(true);
    expect(Math.abs(cursorFade.at(-1)!.cursor.x - cursorFade[0].cursor.x)).toBeGreaterThan(1);
    const blueFade = during(400, 600);
    expect(blueFade.some(f => f.blue.opacity > 0 && f.blue.opacity < 1)).toBe(true);
    expect(Math.hypot(blueFade.at(-1)!.blue.x - blueFade[0].blue.x, blueFade.at(-1)!.blue.y - blueFade[0].blue.y)).toBeGreaterThan(1);
    expect(blueFade[0].blue.x).toBeGreaterThan(0);
    expect(blueFade[0].blue.y).toBeLessThan(0);
    expect(frames.every(f => f.blue.y <= 0.01)).toBe(true);
    const apex = Math.min(...frames.map(f => f.blue.x));
    expect(-apex / em).toBeGreaterThan(0.28);
    expect(-apex / em).toBeLessThanOrEqual(0.301);
    const apexFrame = frames.reduce((nearest, frame) => frame.blue.x < nearest.blue.x ? frame : nearest);
    expect(Math.abs(apexFrame.blue.y + em * 0.4)).toBeLessThan(em * 0.02);
    const recovery = during(1230, 1460);
    expect(recovery.every((f, i) => f.blue.y < 0 && (i === 0 || (f.blue.x > recovery[i - 1].blue.x && f.blue.y > recovery[i - 1].blue.y)))).toBe(true);
    // A curved exit departs visibly from the straight chord joining recovery
    // and rest; this catches both the old horizontal slide and a diagonal one.
    const chordLength = Math.hypot(-apex, em * 0.4);
    expect(Math.max(...recovery.map(f => Math.abs((-apex) * (f.blue.y + em * 0.4) - em * 0.4 * (f.blue.x - apex)) / chordLength))).toBeGreaterThan(em * 0.04);
    expect(during(1550, 1750).every(f => Math.abs(f.blue.x) < 0.1 && Math.abs(f.blue.y) < 0.1)).toBe(true);
    const drag = during(700, 1470);
    const gripX = drag.map(f => f.cursor.x - f.blue.x);
    const gripY = drag.map(f => f.cursor.y - f.blue.y);
    expect(Math.max(...gripX) - Math.min(...gripX)).toBeLessThan(0.1);
    expect(Math.max(...gripY) - Math.min(...gripY)).toBeLessThan(0.1);
    expect(during(0, 1750).every(f => f.purple.opacity === 0)).toBe(true);
    const firstRace = frames.find(f => f.purple.opacity > 0)!;
    expect(Math.abs(firstRace.blue.x)).toBeLessThan(0.1);
    expect(Math.abs(firstRace.blue.y)).toBeLessThan(0.1);
    expect(during(1850, 2180).every(f => f.purple.skew < 0)).toBe(true);
    expect(during(2190, 2260).some(f => f.purple.left > width)).toBe(true);
    expect(during(2260, 2450).some(f => f.purple.right < 0)).toBe(true);
    const speed = (from: number, to: number) => {
      const samples = during(from, to);
      return (samples.at(-1)!.purple.x - samples[0].purple.x) / (samples.at(-1)!.time - samples[0].time);
    };
    const brakeRatio = speed(2970, 3030) / speed(2840, 2920);
    expect(brakeRatio).toBeGreaterThan(0.3);
    expect(brakeRatio).toBeLessThan(0.6);
    expect(speed(3090, 3150)).toBeGreaterThan(speed(2970, 3030) * 1.5);
    expect(during(2300, 3240).every(f => f.purple.skew > 0.08)).toBe(true);
    expect(during(3800, 3870).some(f => f.purple.skew < -0.15)).toBe(true);
    const impact = during(3860, 3890);
    expect(impact.some(f => Math.abs(f.purple.scaleX - 0.7) < 0.015 && Math.abs(f.purple.scaleY - 1.2) < 0.04)).toBe(true);
    expect(during(3980, 4300).some(f => f.purple.scaleX > 1)).toBe(true);
    // The bounce is deformation only: the position remains at the finish line.
    const secondPass = during(2280, 4500);
    expect(secondPass.every((f, i) => f.purple.x <= 0.01 && (i === 0 || f.purple.x >= secondPass[i - 1].purple.x - 0.01))).toBe(true);
    expect(during(3290, 4900).every(f => Math.abs(f.purple.x) < 0.1)).toBe(true);
    expect(during(4600, 4800).every(f => Math.abs(f.purple.skew) < 0.001 && Math.abs(f.purple.scaleX - 1) < 0.001 && Math.abs(f.purple.scaleY - 1) < 0.001)).toBe(true);
    expect(during(4650, 4900).some(f => f.cursor.opacity > 0 && f.cursor.opacity < 1)).toBe(true);
    expect(frames.every(f => !f.overflow)).toBe(true);
    expect(frames.every(f => Math.abs(f.heading.height - frames[0].heading.height) < 0.1 && Math.abs(f.heading.y - frames[0].heading.y) < 0.1)).toBe(true);
    const animatedFinal = await page.locator(headingSelector).boundingBox();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await expectStatic(page);
    expect(await page.locator(headingSelector).boundingBox()).toEqual(animatedFinal);
  });
}

test("one copy of the headline follows the controlled mobile and desktop line groups", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 380, 381, 475, 476, 767, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expectStatic(page);
    const layout = await page.locator(headingSelector).evaluate(heading => {
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const lines: { center: number; words: string[] }[] = [];
      const words: string[] = [];
      const tolerance = parseFloat(getComputedStyle(heading).fontSize) * 0.4;
      let node: Node | null;
      while ((node = walker.nextNode())) {
        for (const match of (node.textContent ?? "").matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          const box = range.getBoundingClientRect();
          const center = box.top + box.height / 2;
          let line = lines.find(line => Math.abs(line.center - center) < tolerance);
          if (!line) { line = { center, words: [] }; lines.push(line); }
          line.words.push(match[0]);
          words.push(match[0]);
        }
      }
      return { lines: lines.map(line => line.words.join(" ")), words };
    });
    const expected = width < 381
      ? ["Building", "hand-crafted", "experiences, using", "AI-accelerated", "workflows"]
      : width < 476
        ? ["Building hand-crafted", "experiences, using", "AI-accelerated", "workflows"]
        : width < 768
          ? ["Building hand-crafted", "experiences, using", "AI-accelerated workflows"]
          : ["Building hand-crafted experiences,", "using AI-accelerated workflows"];
    expect(layout.lines, `${width}px line groups`).toEqual(expected);
    expect(layout.words, `${width}px has no duplicated words`).toEqual(headline.split(" "));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("reduced motion preserves final geometry at responsive boundaries", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 479, 480, 767, 768, 991, 992, 1279, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expectStatic(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const hero = page.locator("main > section").first();
    await expect(hero).toHaveCSS("height", width < 768 ? "400px" : "855px");
    await expect(hero).toHaveCSS("background-image", /hero-nnnoise\.svg/);
  }
});

test("disabled JavaScript exposes the complete static headline", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expectStatic(page);
  await context.close();
});

for (const asset of ["fonts", "cursor"] as const) {
test(`late ${asset} reveal the fallback and never start a late animation`, async ({ page }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  const url = asset === "fonts" ? /\.woff2?(\?|$)/ : /\/animation-cursor\.svg$/;
  await page.route(url, async route => { await gate; await route.continue(); });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-highlight="blue"]')).toHaveCSS("opacity", "0");
  await expectStatic(page);
  release();
  await page.waitForLoadState("load");
  await expect(page.locator(headingSelector)).toHaveAttribute("data-hero-motion", "complete");
  await expectStatic(page);
});
}

test("a failed cursor asset restores static text", async ({ page }) => {
  await page.route(/\/animation-cursor\.svg$/, route => route.abort());
  await page.goto("/");
  await expectStatic(page);
  await expect(page.locator(headingSelector)).toHaveAttribute("data-hero-motion", "complete");
});

for (const interruption of ["resize", "reduced-motion", "hidden", "scroll"] as const) {
  test(`${interruption} finishes playback without replaying`, async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(headingSelector)).toHaveAttribute("data-hero-motion", "playing");
    if (interruption === "resize") await page.setViewportSize({ width: 390, height: 844 });
    if (interruption === "reduced-motion") await page.emulateMedia({ reducedMotion: "reduce" });
    if (interruption === "hidden") await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    if (interruption === "scroll") await page.evaluate(() => {
      const hero = document.querySelector("main > section")!;
      window.scrollTo(0, hero.getBoundingClientRect().bottom + window.scrollY + 8);
    });
    await expect(page.locator(headingSelector)).toHaveAttribute("data-hero-motion", "complete", { timeout: 1000 });
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      Reflect.deleteProperty(document, "hidden");
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expectStatic(page);
    await expect(page.locator(headingSelector)).toHaveAttribute("data-hero-motion", "complete");
  });
}

test("navigation during motion cleans up and a fresh entry plays again", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(headingSelector)).toHaveAttribute("data-hero-motion", "playing");
  await page.getByRole("banner").getByRole("link", { name: "Case Studies", exact: true }).click();
  await expect(page).toHaveURL(/\/case-studies$/);
  await expect(page.locator(headingSelector)).toHaveCount(0);
  await page.getByRole("link", { name: "Brent Walbolt", exact: true }).click();
  await expect(page.locator(headingSelector)).toHaveAttribute("data-hero-motion", "playing");
  await expect(page.locator(headingSelector)).toHaveAttribute("data-hero-motion", "complete", { timeout: 6000 });
  await expectStatic(page);
  expect(errors).toEqual([]);
});
