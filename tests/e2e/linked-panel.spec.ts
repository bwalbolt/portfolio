import { expect, test, type Locator } from "@playwright/test";

const cardSelector = "#insights article";

async function geometry(card: Locator) {
  return card.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const shapes = ["::after", "::before"].map((pseudo) => {
      const style = getComputedStyle(element, pseudo);
      return { x: parseFloat(style.left), y: parseFloat(style.top), width: parseFloat(style.width), height: parseFloat(style.height), opacity: style.opacity };
    });
    return { width: box.width, height: box.height, shapes };
  });
}

test("linked panels mirror corner geometry, stay on the perimeter and mask their glows", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const card = page.locator(cardSelector).nth(1);
  await card.scrollIntoViewIfNeeded();
  const surface = card.locator(":scope > div");
  const original = await card.boundingBox();
  for (const [x, y] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
    const box = (await card.boundingBox())!;
    await page.mouse.move(box.x + (x ? box.width - 0.01 : 0.01), box.y + (y ? box.height - 0.01 : 0.01));
    await expect.poll(async () => {
      const data = await geometry(card);
      return Math.abs(data.shapes[0].x - x * (data.width - 32)) + Math.abs(data.shapes[0].y - y * (data.height - 32));
    }).toBeLessThan(0.1);
    const data = await geometry(card);
    expect(data.shapes[0].width).toBe(32);
    expect(data.shapes[0].height).toBe(32);
    const pink = data.shapes[1];
    expect(pink.width).toBeCloseTo(data.width * 0.54, 1);
    expect(pink.height).toBeCloseTo(data.height * 0.76, 1);
    expect(pink.x).toBeCloseTo(x * (data.width - pink.width), 1);
    expect(pink.y).toBeCloseTo(data.height * (0.05 + y * 0.14), 1);
    await expect(surface).toHaveCSS("background-color", "rgb(7, 25, 34)");
    await expect(surface).toHaveCSS("border-top-color", "rgba(255, 255, 255, 0.4)");
  }
  expect(await card.boundingBox()).toEqual(original);

  // Read styles in the same task as pointer dispatch: a timed tween cannot pass.
  const samples = await card.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const point = (x: number, y: number) => {
      element.dispatchEvent(new PointerEvent("pointermove", {
        pointerType: "mouse", clientX: box.x + x * box.width,
        clientY: box.y + y * box.height,
      }));
      const style = getComputedStyle(element);
      return [Number(style.getPropertyValue("--glow-x")), Number(style.getPropertyValue("--glow-y"))];
    };
    const corners = [[0, 0], [1, 0], [1, 1], [0, 1]];
    return corners.flatMap(([x, y]) => [0.1, 0.5, 0.9].map((distance) => ({
      expected: [x, y],
      actual: point(0.5 + (x - 0.5) * distance, 0.5 + (y - 0.5) * distance),
      center: point(0.5, 0.5),
    }))).concat([
      { expected: [0.75, 0], actual: point(0.6, 0.3), center: point(0.5, 0.5) },
      { expected: [1, 0.75], actual: point(0.7, 0.6), center: point(0.5, 0.5) },
      { expected: [0.25, 1], actual: point(0.4, 0.7), center: point(0.5, 0.5) },
      { expected: [0, 0.25], actual: point(0.3, 0.4), center: point(0.5, 0.5) },
    ]);
  });
  for (const sample of samples) {
    for (const axis of [0, 1]) {
      expect(sample.actual[axis]).toBeCloseTo(sample.expected[axis], 6);
      expect(sample.center[axis]).toBeCloseTo(sample.expected[axis], 6);
    }
  }

  // Capture the exact Figma reference dimensions without changing production layout.
  await surface.evaluate((element) => { element.style.width = "384px"; element.style.height = "214px"; });
  await card.evaluate((element) => { element.style.width = "384px"; });
  const reference = (await card.boundingBox())!;
  await page.mouse.move(reference.x + 0.01, reference.y + 0.01);
  await page.waitForTimeout(220);
  await page.screenshot({ path: testInfo.outputPath("linked-panel-reference.png"), clip: { x: reference.x - 40, y: reference.y - 40, width: 464, height: 294 } });
  await page.mouse.move(0, 0);
  await expect.poll(async () => (await geometry(card)).shapes[0].opacity).toBe("0");
  await expect(surface).toHaveCSS("background-color", "rgba(255, 255, 255, 0.02)");
});

test("card content and padding hit the native link, including modifier-click", async ({ page, context }) => {
  await page.goto("/");
  const card = page.locator(cardSelector).first();
  await card.scrollIntoViewIfNeeded();
  const link = card.getByRole("link");
  await expect(link).toHaveAccessibleName(/^Read more about .+/);
  await expect(card.getByRole("link")).toHaveCount(1);
  const href = (await link.getAttribute("href"))!;
  const box = (await card.boundingBox())!;
  for (const [x, y] of [[10, 10], [box.width / 2, box.height / 2], [box.width - 12, box.height - 12]]) {
    expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest("a")?.getAttribute("href"), { x: box.x + x, y: box.y + y })).toBe(href);
  }
  const popupPromise = context.waitForEvent("page");
  await card.click({ position: { x: 12, y: 12 }, modifiers: ["ControlOrMeta"] });
  const popup = await popupPromise;
  await expect(popup).toHaveURL(href);
  await popup.close();
  await card.click({ position: { x: 12, y: 12 } });
  await expect(page).toHaveURL(href);
});

test("keyboard and reduced motion use static glows; resize and scroll preserve valid geometry", async ({ page }) => {
  await page.goto("/");
  const card = page.locator(cardSelector).first();
  const link = card.getByRole("link");
  await link.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(link).toBeFocused();
  await expect(card.locator(":scope > div")).toHaveCSS("outline-style", "solid");
  expect((await geometry(card)).shapes[0].x).toBe(0);
  await page.keyboard.press("Tab");
  await expect(page.locator(cardSelector).nth(1).getByRole("link")).toBeFocused();
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await card.scrollIntoViewIfNeeded();
    const box = (await card.boundingBox())!;
    await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2);
    await expect.poll(async () => (await geometry(card)).shapes[0].x).toBeCloseTo(box.width - 32, 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.evaluate(() => window.scrollBy(0, 10));
    await expect.poll(async () => (await geometry(card)).shapes[0].y).toBeGreaterThan((box.height - 32) / 2);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await card.hover({ position: { x: 40, y: 40 } });
  expect((await geometry(card)).shapes[0].x).toBe(0);
  expect((await geometry(card)).shapes[0].y).toBe(0);
  await expect(card.locator(":scope > div")).toHaveCSS("transition-delay", "0s");
  await link.focus();
  const href = (await link.getAttribute("href"))!;
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(href);
});

for (const mode of ["touch", "no-javascript"] as const) {
  test(`${mode} follows the whole-card link without sticky glow`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, hasTouch: mode === "touch", isMobile: mode === "touch", javaScriptEnabled: mode !== "no-javascript", viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/");
    const card = page.locator(cardSelector).first();
    const href = (await card.getByRole("link").getAttribute("href"))!;
    await card.scrollIntoViewIfNeeded();
    if (mode === "touch") {
      expect((await geometry(card)).shapes[0].opacity).toBe("0");
      await card.tap({ position: { x: 12, y: 12 } });
    } else await card.click({ position: { x: 12, y: 12 } });
    await expect(page).toHaveURL(href);
    await context.close();
  });
}
