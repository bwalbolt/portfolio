import { expect, test, type Locator } from "@playwright/test";

const cardSelector = "#insights article";
const caseCardSelector = "#case-studies article";

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

async function surfacePoint(card: Locator, x: number, y: number) {
  return card.evaluate((element, coordinates) => {
    const surface = element.firstElementChild as HTMLElement;
    const wrapperBounds = element.getBoundingClientRect();
    const style = getComputedStyle(surface);
    const width = surface.offsetWidth;
    const height = surface.offsetHeight;
    const originTokens = style.transformOrigin.split(" ");
    const resolveOrigin = (token: string | undefined, size: number) => token?.endsWith("%")
      ? (parseFloat(token) / 100) * size
      : parseFloat(token ?? "") || size / 2;
    const originX = resolveOrigin(originTokens[0], width);
    const originY = resolveOrigin(originTokens[1], height);
    const matrix = new DOMMatrix(style.transform === "none" ? undefined : style.transform);
    const point = (localX: number, localY: number) => {
      const transformed = new DOMPoint(localX - originX, localY - originY).matrixTransform(matrix);
      return {
        x: wrapperBounds.left + surface.offsetLeft + transformed.x + originX,
        y: wrapperBounds.top + surface.offsetTop + transformed.y + originY,
      };
    };
    return point(coordinates.x * width, coordinates.y * height);
  }, { x, y });
}

async function slantedState(card: Locator) {
  return card.evaluate((element) => {
    const surface = element.firstElementChild as HTMLElement;
    const frame = surface.firstElementChild as HTMLElement;
    const surfaceStyle = getComputedStyle(surface);
    const surfaceBounds = surface.getBoundingClientRect();
    return {
      frameTransform: getComputedStyle(frame).transform,
      amber: {
        height: parseFloat(getComputedStyle(element, "::after").height),
        left: parseFloat(getComputedStyle(element, "::after").left),
        top: parseFloat(getComputedStyle(element, "::after").top),
        transform: getComputedStyle(element, "::after").transform,
        width: parseFloat(getComputedStyle(element, "::after").width),
      },
      overflow: surfaceStyle.overflow,
      pink: {
        height: parseFloat(getComputedStyle(element, "::before").height),
        left: parseFloat(getComputedStyle(element, "::before").left),
        top: parseFloat(getComputedStyle(element, "::before").top),
        transform: getComputedStyle(element, "::before").transform,
        width: parseFloat(getComputedStyle(element, "::before").width),
      },
      surfaceHeight: surfaceBounds.height,
      surfaceTransform: surfaceStyle.transform,
      surfaceWidth: surface.offsetWidth,
      surfaceX: surfaceBounds.x,
      surfaceY: surfaceBounds.y,
      width: surface.offsetWidth,
      wrapperOverflow: getComputedStyle(element).overflow,
    };
  });
}

async function slantedGlowGeometry(card: Locator) {
  return card.evaluate((element) => {
    const surface = element.firstElementChild as HTMLElement;
    const wrapperStyle = getComputedStyle(element);
    const surfaceStyle = getComputedStyle(surface);
    const surfaceWidth = surface.offsetWidth;
    const surfaceHeight = surface.offsetHeight;
    const [surfaceOriginXToken, surfaceOriginYToken] = surfaceStyle.transformOrigin.split(" ");
    const surfaceOrigin = {
      x: surface.offsetLeft + (parseFloat(surfaceOriginXToken) || surfaceWidth / 2),
      y: surface.offsetTop + (parseFloat(surfaceOriginYToken) || surfaceHeight / 2),
    };
    const surfaceMatrix = new DOMMatrix(surfaceStyle.transform);
    const mapAround = (matrix: DOMMatrix, origin: { x: number; y: number }, point: { x: number; y: number }) => {
      const mapped = new DOMPoint(point.x - origin.x, point.y - origin.y).matrixTransform(matrix);
      return { x: mapped.x + origin.x, y: mapped.y + origin.y };
    };
    const position = {
      x: Number(wrapperStyle.getPropertyValue("--glow-x")),
      y: Number(wrapperStyle.getPropertyValue("--glow-y")),
    };
    const describe = (pseudo: "::before" | "::after", expected: { x: number; y: number }) => {
      const style = getComputedStyle(element, pseudo);
      const [originXToken, originYToken] = style.transformOrigin.split(" ");
      const point = { x: parseFloat(style.left), y: parseFloat(style.top) };
      const origin = {
        x: point.x + (parseFloat(originXToken) || 0),
        y: point.y + (parseFloat(originYToken) || 0),
      };
      return {
        actual: mapAround(new DOMMatrix(style.transform), origin, point),
        expected: mapAround(surfaceMatrix, surfaceOrigin, expected),
        origin,
      };
    };
    const pinkWidth = parseFloat(getComputedStyle(element, "::before").width);
    return {
      amber: describe("::after", {
        x: surface.offsetLeft + position.x * (surfaceWidth - 32),
        y: surface.offsetTop + position.y * (surfaceHeight - 32),
      }),
      pink: describe("::before", {
        x: surface.offsetLeft + position.x * (surfaceWidth - pinkWidth),
        y: surface.offsetTop + surfaceHeight * (0.05 + position.y * 0.14),
      }),
      surfaceOrigin,
    };
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

test("slanted case-study panels map transformed pointer rays without moving the layout", async ({ page }) => {
  await page.goto("/");
  const card = page.locator(caseCardSelector).first();
  const widths = [390, 767, 768, 1280];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await card.scrollIntoViewIfNeeded();
    const state = await slantedState(card);
    if (width < 768) {
      expect(state.surfaceTransform).toBe("none");
      expect(state.frameTransform).toBe("none");
    } else {
      expect(state.surfaceTransform).not.toBe("none");
      expect(state.frameTransform).not.toBe("none");
    }
    expect(state.overflow).toBe("clip");
    expect(state.wrapperOverflow).toBe("visible");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);

    // Read in the same browser task as each pointer event: delayed tracking cannot pass.
    const diagonal = await surfacePoint(card, 0.7, 0.7);
    await page.mouse.move(diagonal.x, diagonal.y);
    const diagonalPosition = await card.evaluate((element) => [
      Number(getComputedStyle(element).getPropertyValue("--glow-x")),
      Number(getComputedStyle(element).getPropertyValue("--glow-y")),
    ]);
    expect(diagonalPosition[0]).toBeCloseTo(1, 2);
    expect(diagonalPosition[1]).toBeCloseTo(1, 2);

    const edge = await surfacePoint(card, 0.7, 0.6);
    await page.mouse.move(edge.x, edge.y);
    const edgePosition = await card.evaluate((element) => [
      Number(getComputedStyle(element).getPropertyValue("--glow-x")),
      Number(getComputedStyle(element).getPropertyValue("--glow-y")),
    ]);
    expect(edgePosition[0]).toBeCloseTo(1, 2);
    expect(edgePosition[1]).toBeCloseTo(0.75, 2);
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await card.scrollIntoViewIfNeeded();
  const corners = [[0, 0], [1, 0], [1, 1], [0, 1]];
  for (const [x, y] of corners) {
    const point = await surfacePoint(card, x ? 0.7 : 0.3, y ? 0.7 : 0.3);
    await page.mouse.move(point.x, point.y);
    for (const [axis, expected] of [x, y].entries()) {
      const property = axis === 0 ? "--glow-x" : "--glow-y";
      await expect.poll(() => card.evaluate((element, propertyName) => Number(getComputedStyle(element).getPropertyValue(propertyName)), property)).toBeCloseTo(expected, 6);
    }
    const glows = await slantedGlowGeometry(card);
    for (const glow of [glows.pink, glows.amber]) {
      expect(glow.origin.x).toBeCloseTo(glows.surfaceOrigin.x, 3);
      expect(glow.origin.y).toBeCloseTo(glows.surfaceOrigin.y, 3);
      expect(Math.abs(glow.actual.x - glow.expected.x)).toBeLessThan(0.02);
      expect(Math.abs(glow.actual.y - glow.expected.y)).toBeLessThan(0.02);
    }
  }

  const edgePoint = await surfacePoint(card, 0.7, 0.6);
  await page.mouse.move(edgePoint.x, edgePoint.y);
  for (const [property, expected] of [["--glow-x", 1], ["--glow-y", 0.75]] as const) {
    await expect.poll(() => card.evaluate((element, propertyName) => Number(getComputedStyle(element).getPropertyValue(propertyName)), property)).toBeCloseTo(expected, 6);
  }

  const center = await surfacePoint(card, 0.5, 0.5);
  await page.mouse.move(center.x, center.y);
  for (const [property, expected] of [["--glow-x", 1], ["--glow-y", 0.75]] as const) {
    await expect.poll(() => card.evaluate((element, propertyName) => Number(getComputedStyle(element).getPropertyValue(propertyName)), property)).toBeCloseTo(expected, 6);
  }

  const active = await slantedState(card);
  expect(active.pink.width).toBeCloseTo(active.width * 0.54, 1);
  expect(active.pink.height).toBeCloseTo(active.surfaceHeight * 0.76, 1);
  expect(active.amber.width).toBe(32);
  expect(active.amber.height).toBe(32);
  expect(active.pink.transform).toBe(active.surfaceTransform);
  expect(active.amber.transform).toBe(active.surfaceTransform);
  expect(active.pink.left).toBeGreaterThanOrEqual(-20);
  expect(active.pink.top).toBeGreaterThanOrEqual(-20);
  await expect(card.locator(":scope > div")).toHaveCSS("background-color", "rgb(7, 25, 34)");

  await page.setViewportSize({ width: 767, height: 900 });
  await page.setViewportSize({ width: 768, height: 900 });
  await card.scrollIntoViewIfNeeded();
  const afterBreakpoint = await surfacePoint(card, 0.7, 0.6);
  await page.mouse.move(afterBreakpoint.x, afterBreakpoint.y);
  await expect.poll(() => card.evaluate((element) => getComputedStyle(element.firstElementChild as HTMLElement).transform)).not.toBe("none");

  await page.evaluate(() => window.scrollBy(0, 24));
  const afterScroll = await surfacePoint(card, 0.7, 0.6);
  await page.mouse.move(afterScroll.x, afterScroll.y);
  for (const [property, expected] of [["--glow-x", 1], ["--glow-y", 0.75]] as const) {
    await expect.poll(() => card.evaluate((element, propertyName) => Number(getComputedStyle(element).getPropertyValue(propertyName)), property)).toBeCloseTo(expected, 6);
  }
});

test("slanted case-study links follow only the visible surface and preserve upright content", async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const card = page.locator(caseCardSelector).first();
  await card.scrollIntoViewIfNeeded();
  const link = card.getByRole("link");
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAccessibleName(/^Read more about .+/);

  const points = await card.evaluate((element) => {
    const surface = element.firstElementChild as HTMLElement;
    const bounds = surface.getBoundingClientRect();
    const wrapper = element.getBoundingClientRect();
    const style = getComputedStyle(surface);
    const width = surface.offsetWidth;
    const height = surface.offsetHeight;
    const [originXToken, originYToken] = style.transformOrigin.split(" ");
    const originX = parseFloat(originXToken) || width / 2;
    const originY = parseFloat(originYToken) || height / 2;
    const matrix = new DOMMatrix(style.transform);
    const point = (x: number, y: number) => {
      const transformed = new DOMPoint(x - originX, y - originY).matrixTransform(matrix);
      return {
        x: wrapper.left + surface.offsetLeft + transformed.x + originX,
        y: wrapper.top + surface.offsetTop + transformed.y + originY,
      };
    };
    const hrefAt = (coordinates: { x: number; y: number }) => surface.ownerDocument.elementFromPoint(coordinates.x, coordinates.y)?.closest("a")?.getAttribute("href");
    const protrudingTopRight = point(width * 0.99, height * 0.1);
    const protrudingBottomLeft = point(width * 0.01, height * 0.9);
    return {
      emptyBottomRightHref: hrefAt({ x: bounds.right - 1, y: bounds.bottom - 1 }),
      emptyTopLeftHref: hrefAt({ x: bounds.left + 1, y: bounds.top + 1 }),
      protrudingBottomLeft: {
        href: hrefAt(protrudingBottomLeft),
        outsideWrapper: protrudingBottomLeft.x < wrapper.left,
      },
      protrudingTopRight: {
        href: hrefAt(protrudingTopRight),
        outsideWrapper: protrudingTopRight.x > wrapper.right,
      },
      visibleHref: hrefAt(point(width / 2, height / 2)),
    };
  });
  expect(points.visibleHref).toBe(await link.getAttribute("href"));
  expect(points.protrudingTopRight.outsideWrapper).toBe(true);
  expect(points.protrudingTopRight.href).toBe(await link.getAttribute("href"));
  expect(points.protrudingBottomLeft.outsideWrapper).toBe(true);
  expect(points.protrudingBottomLeft.href).toBe(await link.getAttribute("href"));
  expect(points.emptyTopLeftHref).toBeFalsy();
  expect(points.emptyBottomRightHref).toBeFalsy();

  const transforms = await card.evaluate((element) => {
    const surface = element.firstElementChild as HTMLElement;
    const image = [...surface.querySelectorAll("img")].find((candidate) => candidate.getBoundingClientRect().width > 0)!;
    return {
      artworkFrame: getComputedStyle(image.parentElement as HTMLElement).transform,
      frame: getComputedStyle(surface.firstElementChild as HTMLElement).transform,
      image: getComputedStyle(image).transform,
      surface: getComputedStyle(surface).transform,
    };
  });
  expect(transforms.surface).not.toBe("none");
  expect(transforms.frame).not.toBe("none");
  expect(transforms.artworkFrame).not.toBe("none");
  expect(transforms.image).toBe("none");

  const contentAlignment = await page.locator(caseCardSelector).evaluateAll((cards) => cards.map((element) => {
    const title = element.querySelector("h3") as HTMLElement;
    const linkLabel = element.querySelector("a > span > span") as HTMLElement;
    return {
      labelLeft: linkLabel.getBoundingClientRect().left,
      titleLeft: title.getBoundingClientRect().left,
    };
  }));
  for (const alignment of contentAlignment) {
    expect(alignment.labelLeft).toBeCloseTo(alignment.titleLeft, 1);
  }

  const artworkCoverage = await page.locator(caseCardSelector).evaluateAll((cards) => cards.map((element) => {
    const surface = element.firstElementChild as HTMLElement;
    const image = [...surface.querySelectorAll("img")].find((candidate) => candidate.getBoundingClientRect().width > 0)!;
    const style = getComputedStyle(surface);
    const width = surface.offsetWidth;
    const height = surface.offsetHeight;
    const [originXToken, originYToken] = style.transformOrigin.split(" ");
    const originX = parseFloat(originXToken) || width / 2;
    const originY = parseFloat(originYToken) || height / 2;
    const matrix = new DOMMatrix(style.transform);
    const topRight = new DOMPoint(width - originX, -originY).matrixTransform(matrix);
    const wrapper = element.getBoundingClientRect();
    const imageBounds = image.getBoundingClientRect();
    return {
      cornerCovered: imageBounds.left <= wrapper.left + surface.offsetLeft + topRight.x + originX
        && imageBounds.right >= wrapper.left + surface.offsetLeft + topRight.x + originX
        && imageBounds.top <= wrapper.top + surface.offsetTop + topRight.y + originY
        && imageBounds.bottom >= wrapper.top + surface.offsetTop + topRight.y + originY,
    };
  }));
  for (const artwork of artworkCoverage) {
    expect(artwork.cornerCovered).toBe(true);
  }

  const href = (await link.getAttribute("href"))!;
  const cardBox = (await card.boundingBox())!;
  const visiblePoint = await surfacePoint(card, 0.5, 0.5);
  const popupPromise = context.waitForEvent("page");
  await card.click({ position: { x: visiblePoint.x - cardBox.x, y: visiblePoint.y - cardBox.y }, modifiers: ["ControlOrMeta"] });
  const popup = await popupPromise;
  await expect(popup).toHaveURL(href);
  await popup.close();
});

test("slanted case-study cards use static keyboard and reduced-motion feedback", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const card = page.locator(caseCardSelector).first();
  const link = card.getByRole("link");
  await link.focus();
  await expect(link).toBeFocused();
  await expect(card.locator(":scope > div")).toHaveCSS("outline-style", "solid");
  expect(await card.evaluate((element) => [
    Number(getComputedStyle(element).getPropertyValue("--glow-x")),
    Number(getComputedStyle(element).getPropertyValue("--glow-y")),
  ])).toEqual([0, 0]);

  await page.evaluate(() => document.body.click());
  await page.emulateMedia({ reducedMotion: "reduce" });
  const point = await surfacePoint(card, 0.7, 0.6);
  await page.mouse.move(point.x, point.y);
  expect(await card.evaluate((element) => [
    Number(getComputedStyle(element).getPropertyValue("--glow-x")),
    Number(getComputedStyle(element).getPropertyValue("--glow-y")),
  ])).toEqual([0, 0]);
  expect(await card.locator(":scope > div").evaluate((element) => parseFloat(getComputedStyle(element).transitionDuration))).toBeLessThan(0.001);
});

for (const mode of ["touch", "no-javascript"] as const) {
  test(`${mode} follows a slanted case-study surface link natively`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, hasTouch: mode === "touch", isMobile: mode === "touch", javaScriptEnabled: mode !== "no-javascript", viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/");
    const card = page.locator(caseCardSelector).first();
    const link = card.getByRole("link");
    const href = (await link.getAttribute("href"))!;
    if (mode === "touch") await card.tap({ position: { x: 12, y: 12 } });
    else await card.click({ position: { x: 12, y: 12 } });
    await expect(page).toHaveURL(href);
    await context.close();
  });
}
