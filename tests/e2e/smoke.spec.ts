import { expect, test } from "@playwright/test";

// Representative mobile width plus immediately below and at each shared threshold.
const responsiveWidths = [390, 479, 480, 767, 768, 991, 992, 1279, 1280];

const primaryRoutes = [
  { href: "/case-studies", label: "Case Studies", title: "Case Studies" },
  { href: "/blog", label: "Blog", title: "Blog" },
  { href: "/tutorial", label: "Tutorials", title: "Tutorials" },
  { href: "/about", label: "About", title: "About" },
] as const;

test("renders the homepage and contact form landmarks", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /Building hand-crafted experiences,\s+using AI-accelerated workflows/,
    }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contact Me" })).toBeVisible();
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Message")).toBeVisible();
});

test("body owns the noisy background and the hero uses square SVG artwork", async ({
  page,
}) => {
  const viewports = [
    { height: 900, name: "desktop", width: 1280 },
    { height: 900, name: "tablet", width: 768 },
    { height: 740, name: "mobile", width: 390 },
  ] as const;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const shellStyles = await page.locator("main").evaluate((main) => {
      const pageShell = main.parentElement;
      const hero = main.querySelector("section");
      const sectionStack = hero?.nextElementSibling;

      if (!pageShell || !hero || !sectionStack) {
        throw new Error("Homepage shell structure was not found");
      }

      const bodyStyle = getComputedStyle(document.body);
      const bodyBeforeStyle = getComputedStyle(document.body, "::before");
      const pageStyle = getComputedStyle(pageShell);
      const pageBeforeStyle = getComputedStyle(pageShell, "::before");
      const heroStyle = getComputedStyle(hero);
      const stackStyle = getComputedStyle(sectionStack);

      return {
        bodyBackgroundBlendMode: bodyStyle.backgroundBlendMode,
        bodyBackgroundColor: bodyStyle.backgroundColor,
        bodyBackgroundImage: bodyStyle.backgroundImage,
        bodyBeforeBackgroundImage: bodyBeforeStyle.backgroundImage,
        bodyBeforeContent: bodyBeforeStyle.content,
        heroClipPath: heroStyle.clipPath,
        heroBackgroundImage: heroStyle.backgroundImage,
        pageBackgroundColor: pageStyle.backgroundColor,
        pageBackgroundImage: pageStyle.backgroundImage,
        pageBeforeBackgroundImage: pageBeforeStyle.backgroundImage,
        pageBeforeContent: pageBeforeStyle.content,
        sectionStackBackgroundColor: stackStyle.backgroundColor,
        sectionStackBackgroundImage: stackStyle.backgroundImage,
      };
    });

    expect(shellStyles.bodyBackgroundColor, viewport.name).toBe("rgb(2, 20, 29)");
    expect(shellStyles.bodyBackgroundImage, viewport.name).toContain(
      "/images/nnnoise.svg",
    );
    expect(shellStyles.bodyBackgroundImage, viewport.name).not.toContain(
      "gradient",
    );
    expect(shellStyles.bodyBackgroundBlendMode, viewport.name).toBe("normal");
    expect(shellStyles.bodyBeforeBackgroundImage, viewport.name).toBe("none");
    expect(shellStyles.bodyBeforeContent, viewport.name).toBe("none");
    expect(shellStyles.pageBackgroundColor, viewport.name).toBe(
      "rgba(0, 0, 0, 0)",
    );
    expect(shellStyles.pageBackgroundImage, viewport.name).toBe("none");
    expect(shellStyles.pageBeforeBackgroundImage, viewport.name).toBe("none");
    expect(shellStyles.pageBeforeContent, viewport.name).toBe("none");
    expect(shellStyles.sectionStackBackgroundColor, viewport.name).toBe(
      "rgba(0, 0, 0, 0)",
    );
    expect(shellStyles.sectionStackBackgroundImage, viewport.name).toBe("none");
    expect(shellStyles.heroClipPath, viewport.name).toBe("none");
    expect(shellStyles.heroBackgroundImage, viewport.name).toContain(
      viewport.width >= 768
        ? "/images/bg-home-hero.svg"
        : "/images/bg-home-hero-mobile.svg",
    );
    expect(shellStyles.heroBackgroundImage, viewport.name).toContain(
      "/images/hero-nnnoise.svg",
    );
    expect(shellStyles.heroBackgroundImage, viewport.name).not.toContain("gradient");
  }
});

test("navigation uses the supplied accessible wordmark and has a unified responsive shell", async ({
  page,
}) => {
  for (const width of [767, 768, 1280]) {
    await page.setViewportSize({ height: 900, width });
    await page.goto("/");

    const banner = page.getByRole("banner");
    const navigationBar = banner.locator("div").first();
    const brand = banner.getByRole("link", { name: "Brent Walbolt" });
    const wordmark = brand.locator("svg");

    await expect(banner).toHaveCSS("position", "fixed");
    await expect(navigationBar).toHaveCSS("height", "56px");
    await expect(wordmark).toHaveAttribute("viewBox", "0 0 163 28");
    await expect(wordmark).toHaveAttribute("width", "163");
    await expect(wordmark).toHaveAttribute("height", "28");
    await expect(wordmark).toHaveAttribute("aria-hidden", "true");
    await expect(wordmark.locator('path[fill="currentColor"]')).toHaveCount(8);
    await expect(banner.locator('nav[aria-label="Primary"]')).toHaveCSS(
      "display",
      width >= 768 ? "block" : "none",
    );
    await expect(
      banner.locator('button[aria-controls="mobile-navigation"]'),
    ).toHaveCSS("display", width >= 768 ? "none" : "flex");
    await expect(banner.getByRole("link", { name: "Get in Touch" })).toHaveAttribute(
      "data-size",
      "small",
    );
  }
});

test("hero geometry, typography, and artwork follow the responsive Figma composition", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1280 });
  await page.goto("/");

  const hero = page.locator("main > section").first();
  const title = hero.getByRole("heading", { level: 1 });
  const titleLines = title.locator('[class*="heroLine"]');
  const highlights = title.locator('[class*="heroHighlight"]');
  const scrollIndicator = hero.getByText("Scroll", { exact: true });

  const [heroBox, titleBox, scrollBox] = await Promise.all([
    hero.boundingBox(),
    title.boundingBox(),
    scrollIndicator.boundingBox(),
  ]);

  expect(heroBox).not.toBeNull();
  expect(titleBox).not.toBeNull();
  expect(scrollBox).not.toBeNull();
  expect(heroBox?.height).toBeCloseTo(900 * 0.95, 0);
  expect(
    (titleBox?.y ?? 0) + (titleBox?.height ?? 0) / 2,
  ).toBeCloseTo((heroBox?.y ?? 0) + (heroBox?.height ?? 0) / 2, 0);
  expect((scrollBox?.y ?? 0) / (heroBox?.height ?? 1)).toBeGreaterThan(0.78);
  expect((scrollBox?.y ?? 0) / (heroBox?.height ?? 1)).toBeLessThan(0.84);

  await expect(titleLines).toHaveCount(2);
  const fontFamilies = await title.evaluate((heading) => {
    const rootStyle = getComputedStyle(document.documentElement);
    const normaliseFontName = (fontFamily: string) =>
      fontFamily.split(",")[0]?.replaceAll('"', "").trim();
    const highlightElement = heading.querySelector('[class*="heroHighlight"]');

    if (!highlightElement) {
      throw new Error("Hero typography elements were not found");
    }

    return {
      copy: normaliseFontName(getComputedStyle(heading).fontFamily),
      display: normaliseFontName(rootStyle.getPropertyValue("--font-display")),
      highlight: normaliseFontName(getComputedStyle(highlightElement).fontFamily),
      serif: normaliseFontName(rootStyle.getPropertyValue("--font-serif")),
    };
  });
  expect(fontFamilies.serif).not.toBe("");
  expect(fontFamilies.display).not.toBe("");
  expect(fontFamilies.copy).toBe(fontFamilies.serif);
  expect(fontFamilies.highlight).toBe(fontFamilies.display);
  await expect(title.locator('[class*="heroCopy"]')).toHaveCount(0);
  await expect(title).toHaveCSS("font-style", "italic");
  await expect(title).toHaveCSS("font-weight", "800");
  await expect(title).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(highlights.first()).toHaveCSS(
    "font-family",
    new RegExp(fontFamilies.display),
  );
  await expect(highlights.first()).toHaveCSS("font-style", "normal");
  await expect(highlights.first()).toHaveCSS("font-weight", "800");
  const highlightGradients = await highlights.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).backgroundImage),
  );
  expect(highlightGradients[0]).toContain(
    "rgb(0, 176, 255), rgb(102, 208, 255) 43%, rgb(124, 77, 255)",
  );
  expect(highlightGradients[1]).toContain(
    "rgb(124, 77, 255), rgb(221, 178, 255) 40%, rgb(228, 79, 255)",
  );
  for (const highlight of await highlights.all()) {
    await expect(highlight).toHaveCSS("color", "rgba(0, 0, 0, 0)");
  }

  for (const height of [667, 844]) {
    await page.setViewportSize({ height, width: 390 });
    await page.goto("/");

    const mobileHero = page.locator("main > section").first();
    const mobileTitle = mobileHero.getByRole("heading", { level: 1 });
    const [mobileHeroBox, mobileTitleMaxWidth] = await Promise.all([
      mobileHero.boundingBox(),
      mobileTitle.evaluate((element) => getComputedStyle(element).maxWidth),
    ]);

    expect(mobileHeroBox?.height, `${height}px-tall mobile viewport`).toBeCloseTo(
      400,
      0,
    );
    expect(mobileTitleMaxWidth).toBe("none");
    await expect(mobileTitle).toHaveCSS("width", "342px");
    await expect(mobileHero.getByText("Scroll", { exact: true })).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  }

  for (const width of [768, 1280]) {
    await page.setViewportSize({ height: 900, width });
    await page.goto("/");

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});

test("overlay navigation is transparent at the top and gains a scroll surface", async ({
  page,
}) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ height: 740, width });
    await page.goto("/", { waitUntil: "networkidle" });

    const banner = page.getByRole("banner");

    await expect(banner).toHaveCSS("position", "fixed");
    await expect(banner).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

    if (width < 768) {
      const menuButton = banner.getByRole("button", {
        name: "Toggle navigation",
      });
      await menuButton.click();
      await expect(menuButton).toHaveAttribute("aria-expanded", "true");
      await menuButton.click();
      await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    }

    await page.evaluate(() => window.scrollTo({ behavior: "instant", top: 9 }));
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(8);
    await expect(banner).toHaveCSS("background-color", "rgb(0, 0, 0)");
  }
});

for (const route of primaryRoutes) {
  test(`primary navigation reaches ${route.title}`, async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: route.label })
      .click();

    await expect(page).toHaveURL(route.href);
    await expect(
      page.getByRole("heading", { level: 1, name: route.title }),
    ).toBeVisible();
  });
}

test("keyboard users can reach primary navigation and the contact CTA", async ({
  page,
}) => {
  await page.goto("/");

  const banner = page.getByRole("banner");
  const primaryNav = page.getByRole("navigation", { name: "Primary" });

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(
    banner.getByRole("link", { name: "Brent Walbolt" }),
  ).toBeFocused();
  await expect(
    banner.getByRole("link", { name: "Brent Walbolt" }),
  ).not.toHaveCSS("box-shadow", "none");

  await page.keyboard.press("Tab");
  await expect(
    primaryNav.getByRole("link", { name: "Case Studies" }),
  ).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(primaryNav.getByRole("link", { name: "Blog" })).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(primaryNav.getByRole("link", { name: "Tutorials" })).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(primaryNav.getByRole("link", { name: "About" })).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(banner.getByRole("link", { name: "Get in Touch" })).toBeFocused();
});

test("homepage links follow Figma sizing and responsive spacing", async ({ page }) => {
  for (const width of [390, 640, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const sections = [page.locator("#insights"), page.locator("#case-studies")];
    for (const section of sections) {
      const arrows = section.getByRole("link", { name: /^Read more/ }).locator("svg");
      for (const arrow of await arrows.all()) {
        if (await arrow.isVisible()) {
          await expect(arrow).toHaveCSS("width", "16px");
          await expect(arrow).toHaveCSS("height", "16px");
        }
      }
      const headingLink = section.getByRole("link", { name: "View All", exact: true });
      const mobileLink = section.getByRole("link", { name: /View All Insights|View More Work/ });
      const grid = section.locator("ul").first();
      const gridBox = (await grid.boundingBox())!;
      if (width < 768) {
        await expect(headingLink).toBeHidden();
        await expect(mobileLink).toBeVisible();
        const linkBox = (await mobileLink.boundingBox())!;
        expect(linkBox.x + linkBox.width / 2).toBeCloseTo(width / 2, 1);
        expect(linkBox.y - gridBox.y - gridBox.height).toBeCloseTo(24, 1);
        await expect(mobileLink).toHaveCSS("gap", "8px");
      } else {
        await expect(mobileLink).toBeHidden();
        await expect(headingLink).toBeVisible();
        const linkBox = (await headingLink.boundingBox())!;
        expect(linkBox.x + linkBox.width).toBeCloseTo(gridBox.x + gridBox.width, 1);
        const headingBox = (await section.getByRole("heading", { level: 2 }).boundingBox())!;
        expect(linkBox.y + linkBox.height).toBeCloseTo(headingBox.y + headingBox.height, 1);
        expect(gridBox.y - headingBox.y - headingBox.height).toBeCloseTo(24, 1);
      }
    }
    const insights = (await sections[0].boundingBox())!;
    const studies = (await sections[1].boundingBox())!;
    const about = (await page.locator("#about").boundingBox())!;
    expect(studies.y - insights.y - insights.height).toBeCloseTo(width < 768 ? 64 : 48, 1);
    expect(about.y - studies.y - studies.height).toBeCloseTo(80, 1);
  }
});

test("About Me keeps its blur local and its portrait unwarped across layouts", async ({ page }, testInfo) => {
  for (const width of responsiveWidths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const primaryNav = page.getByRole("navigation", { name: "Primary" });
    const menuToggle = page.getByRole("button", { name: "Toggle navigation" });
    if (width < 768) {
      await expect(primaryNav).toBeHidden();
      await expect(menuToggle).toBeVisible();
    } else {
      await expect(primaryNav).toBeVisible();
      await expect(menuToggle).toBeHidden();
    }
    const about = page.locator("#about");
    const portrait = about.getByRole("img", { name: "Portrait of Brent Walbolt" });
    const frame = portrait.locator("..");
    const title = about.getByRole("heading", { name: "About Me", exact: true });
    const copy = title.locator("..");
    const paragraph = copy.locator("p").filter({ hasText: "Senior Design Engineer" });
    await expect(paragraph).toHaveCount(1);
    await expect(paragraph).toContainText("experiences. Expert at translating");
    await expect(paragraph).toContainText("modern web technologies.");
    await expect(paragraph).toHaveCSS("font-size", "18px");
    const backdrop = await about.evaluate((element) => getComputedStyle(element, "::before").backgroundImage);
    expect(backdrop).toContain(width >= 480 ? "mosaic-broken.png" : "mosaic-broken-mobile.png");
    expect(backdrop).not.toContain("gradient");
    const blur = await paragraph.locator("..").evaluate((element) => {
      const style = getComputedStyle(element, "::before");
      return { inset: style.inset, filter: style.filter, background: style.backgroundColor, zIndex: style.zIndex, pointerEvents: style.pointerEvents };
    });
    expect(blur).toEqual({ inset: "-20px", filter: "blur(40px)", background: "rgb(255, 255, 255)", zIndex: "-1", pointerEvents: "none" });
    const transform = await portrait.evaluate((element) => {
      const imageStyle = getComputedStyle(element);
      const frameStyle = getComputedStyle(element.parentElement!);
      const outer = new DOMMatrix(frameStyle.transform);
      const combined = outer.multiply(new DOMMatrix(imageStyle.transform));
      return { skew: outer.c, a: combined.a, b: combined.b, c: combined.c, d: combined.d, fit: imageStyle.objectFit };
    });
    expect(transform.skew).toBeCloseTo(-Math.tan(Math.PI / 30), 5);
    expect(transform.b).toBeCloseTo(0, 5);
    expect(transform.c).toBeCloseTo(0, 5);
    expect(transform.a).toBeCloseTo(transform.d, 5);
    expect(transform.fit).toBe("cover");
    const frameBox = (await frame.boundingBox())!;
    const titleBox = (await title.boundingBox())!;
    if (width < 992) {
      await expect(frame).toHaveCSS("width", "160px");
      expect(frameBox.height).toBeCloseTo(179.168, 1);
      expect(frameBox.x + frameBox.width / 2).toBeCloseTo(width / 2, 1);
      expect(titleBox.x + titleBox.width / 2).toBeCloseTo(width / 2, 1);
      await expect(title).toHaveCSS("text-align", "center");
      expect(titleBox.y - frameBox.y - frameBox.height).toBeCloseTo(32, 1);
    } else {
      expect(frameBox.height).toBeCloseTo(347.248, 1);
      expect(titleBox.x).toBeGreaterThan(frameBox.x + frameBox.width);
      await expect(title).toHaveCSS("text-align", "left");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await portrait.scrollIntoViewIfNeeded();
    await expect(portrait).toBeVisible();
    await expect.poll(() => portrait.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    await expect(portrait).toHaveAttribute("sizes", "(width >= 62rem) 22rem, 11rem");
    await about.screenshot({ path: testInfo.outputPath(`about-${width}.png`) });
    if ([390, 768, 1280].includes(width)) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({ path: testInfo.outputPath(`homepage-${width}.png`), fullPage: true });
    }
  }
});

test("About Me skill cards follow the responsive Figma layout", async ({ page }) => {
  for (const width of responsiveWidths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const about = page.locator("#about");
    const paragraph = about.getByText("Senior Design Engineer", { exact: false });
    const skillList = about.locator("ul");
    const cards = skillList.locator("article");
    await expect(cards).toHaveCount(3);

    const paragraphBox = (await paragraph.boundingBox())!;
    const listBox = (await skillList.boundingBox())!;
    expect(listBox.x).toBeCloseTo(paragraphBox.x, 1);
    expect(listBox.width).toBeCloseTo(paragraphBox.width, 1);

    const expectedColors = ["rgb(255, 179, 0)", "rgb(228, 79, 217)", "rgb(0, 176, 255)"];
    const boxes = [];
    for (let index = 0; index < 3; index += 1) {
      const card = cards.nth(index);
      await expect(card).toHaveCSS("border-radius", "0px");
      await expect(card).toHaveCSS("border-left-width", "4px");
      await expect(card).toHaveCSS("border-left-color", expectedColors[index]);
      await expect(card).toHaveCSS("background-color", "rgba(0, 0, 0, 0.66)");
      await expect(card).toHaveCSS("column-gap", "8px");
      boxes.push((await card.boundingBox())!);
    }

    expect(boxes[0].height).toBeCloseTo(boxes[1].height, 1);
    expect(boxes[1].height).toBeCloseTo(boxes[2].height, 1);
    if (width < 992) {
      expect(boxes[1].y).toBeGreaterThanOrEqual(boxes[0].y + boxes[0].height + 16);
      expect(boxes[2].y).toBeGreaterThanOrEqual(boxes[1].y + boxes[1].height + 16);
    } else {
      expect(boxes[0].y).toBeCloseTo(boxes[1].y, 1);
      expect(boxes[1].y).toBeCloseTo(boxes[2].y, 1);
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});

test("testimonial quote uses the responsive Figma treatment without overlap", async ({ page }) => {
  const viewports = [
    { width: 390, height: 900, name: "mobile" },
    { width: 768, height: 900, name: "tablet" },
    { width: 991, height: 900, name: "tablet-edge" },
    { width: 992, height: 900, name: "desktop-edge" },
    { width: 1280, height: 900, name: "desktop" },
  ] as const;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const quote = page.locator("#about blockquote");
    const quoteOutline = quote.locator('span[aria-hidden="true"]');
    const quoteGradient = quote.locator('span:not([aria-hidden="true"])');
    const attribution = page.locator("#about figcaption");
    const quoteStyles = await quoteGradient.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundImage: style.backgroundImage,
        color: style.color,
        fontSize: style.fontSize,
        letterSpacing: style.letterSpacing,
        stroke: style.webkitTextStroke,
      };
    });
    const outlineStyles = await quoteOutline.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        display: style.display,
        opacity: style.opacity,
        stroke: style.webkitTextStroke,
      };
    });
    const quoteBox = (await quote.boundingBox())!;
    const attributionBox = (await attribution.boundingBox())!;

    if (viewport.width < 992) {
      expect(quoteStyles.backgroundImage, viewport.name).toBe("none");
      expect(quoteStyles.color, viewport.name).toBe("rgb(255, 255, 255)");
      expect(Number.parseFloat(quoteStyles.fontSize), viewport.name).toBeGreaterThanOrEqual(24);
      expect(Number.parseFloat(quoteStyles.fontSize), viewport.name).toBeLessThan(48);
      expect(outlineStyles.display, viewport.name).toBe("none");
    } else {
      expect(quoteStyles.backgroundImage, viewport.name).toContain("linear-gradient");
      expect(quoteStyles.color, viewport.name).toBe("rgba(0, 0, 0, 0)");
      const fontSize = Number.parseFloat(quoteStyles.fontSize);
      expect(fontSize, viewport.name).toBeGreaterThan(24);
      expect(fontSize, viewport.name).toBeLessThanOrEqual(48);
      expect(outlineStyles.display, viewport.name).toBe("block");
      expect(outlineStyles.opacity, viewport.name).toBe("1");
      expect(outlineStyles.stroke, viewport.name).toContain("12.8px");
      const outlineBox = (await quoteOutline.boundingBox())!;
      const gradientBox = (await quoteGradient.boundingBox())!;
      expect(outlineBox.x, viewport.name).toBeCloseTo(gradientBox.x, 1);
      expect(outlineBox.y, viewport.name).toBeCloseTo(gradientBox.y, 1);
      expect(outlineBox.width, viewport.name).toBeCloseTo(gradientBox.width, 1);
      expect(outlineBox.height, viewport.name).toBeCloseTo(gradientBox.height, 1);
      if (viewport.width >= 1280) {
        expect(Number.parseFloat(quoteStyles.fontSize), viewport.name).toBeCloseTo(48, 0);
      }
    }

    expect(quoteStyles.letterSpacing, viewport.name).toBe("-1.2px");
    expect(attributionBox.y, viewport.name).toBeGreaterThanOrEqual(
      quoteBox.y + quoteBox.height,
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth), viewport.name).toBe(
      viewport.width,
    );
  }
});

test("contact section preserves responsive form gutters with the shader decoration", async ({ page }) => {
  const viewports = [
    { width: 390, height: 900, name: "mobile" },
    { width: 768, height: 900, name: "tablet" },
    { width: 992, height: 900, name: "desktop-edge" },
    { width: 1280, height: 900, name: "desktop" },
  ] as const;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const contact = page.locator("#contact");
    const layout = contact.locator(":scope > div");
    const form = contact.locator("form");
    const socialGroup = contact.getByText("Social Links", { exact: true }).locator("..");
    const socialEyebrow = contact.getByText("Social Links", { exact: true });
    const availabilityBody = contact.getByText("Currently seeking innovative", { exact: false });
    const availability = contact.getByText("Currently Available", { exact: false }).locator("../..");
    const border = contact.locator("[data-contact-border]");
    const layoutBox = (await layout.boundingBox())!;
    const formBox = (await form.boundingBox())!;
    const socialBox = (await socialGroup.boundingBox())!;
    const socialEyebrowBox = (await socialEyebrow.boundingBox())!;
    const availabilityBodyBox = (await availabilityBody.boundingBox())!;
    const availabilityBox = (await availability.boundingBox())!;

    expect(formBox.x, viewport.name).toBeCloseTo(layoutBox.x, 1);
    expect(socialBox.x, viewport.name).toBeCloseTo(availabilityBox.x, 1);
    expect(socialBox.width, viewport.name).toBeCloseTo(availabilityBox.width, 1);
    expect(socialEyebrowBox.x, viewport.name).toBeCloseTo(availabilityBodyBox.x, 1);

    await expect(border).toHaveAttribute("aria-hidden", "true");
    await expect(border).toHaveCSS("pointer-events", "none");

    const nameField = page.getByLabel("Name");
    await nameField.focus();
    await expect(nameField).toHaveCSS("border-top-color", "rgba(255, 255, 255, 0.8)");
    await expect(nameField).toHaveAttribute("id", "contact-name");
    await expect(page.getByLabel("Email")).toHaveAttribute("id", "contact-email");
    await expect(page.getByLabel("Message")).toHaveAttribute("id", "contact-message");
    expect(await page.evaluate(() => document.documentElement.scrollWidth), viewport.name).toBe(
      viewport.width,
    );
  }
});

test("footer uses legal links and closes the contact section without an extra gap", async ({
  page,
}) => {
  const viewports = [
    { width: 390, height: 900, name: "mobile" },
    { width: 1280, height: 900, name: "desktop" },
  ] as const;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const footer = page.locator("footer");
    const footerInner = footer.locator(":scope > div");
    const geometry = await footer.evaluate((element) => {
      const footerBox = element.getBoundingClientRect();
      const contactElement = document.querySelector("#contact");

      if (!contactElement) {
        throw new Error("Contact section was not found");
      }

      const contactBox = contactElement.getBoundingClientRect();
      return {
        footerHeight: footerBox.height,
        footerTop: footerBox.top,
        contactBottom: contactBox.bottom,
      };
    });
    const footerStyles = await footerInner.evaluate((element) => {
      const style = getComputedStyle(element);

      return {
        gap: style.rowGap,
        paddingBlockEnd: style.paddingBlockEnd,
        paddingBlockStart: style.paddingBlockStart,
      };
    });

    expect(geometry.footerTop, viewport.name).toBeCloseTo(geometry.contactBottom, 1);
    await expect(footer.getByRole("navigation", { name: "Legal" }), viewport.name).toBeVisible();
    await expect(footer.getByRole("link", { name: "Privacy Policy" }), viewport.name).toBeVisible();
    await expect(footer.getByRole("link", { name: "Terms of Use" }), viewport.name).toBeVisible();
    await expect(
      footer.getByText("Crafting performant, user-centered designs", { exact: true }),
      viewport.name,
    ).toBeVisible();
    await expect(
      footer.getByText("© 2026 Brent Walbolt. All rights reserved.", { exact: true }),
      viewport.name,
    ).toBeVisible();
    await expect(footer.getByRole("link", { name: "Blog" })).toHaveCount(0);
    await expect(footer.getByRole("link", { name: "Brent Walbolt" })).toHaveCount(0);

    if (viewport.width < 768) {
      expect(footerStyles.paddingBlockStart, viewport.name).toBe("24px");
      expect(footerStyles.paddingBlockEnd, viewport.name).toBe("24px");
      expect(footerStyles.gap, viewport.name).toBe("32px");
      const legalBox = (await footer.getByRole("navigation", { name: "Legal" }).boundingBox())!;
      const copyrightBox = (await footer.getByText("© 2026 Brent Walbolt. All rights reserved.", { exact: true }).boundingBox())!;
      expect(legalBox.y, viewport.name).toBeLessThan(copyrightBox.y);
    } else {
      expect(footerStyles.paddingBlockStart, viewport.name).toBe("40px");
      expect(footerStyles.paddingBlockEnd, viewport.name).toBe("40px");
    }

    const legalLink = footer.getByRole("link", { name: "Privacy Policy" });
    await legalLink.focus();
    await expect(legalLink, viewport.name).toBeFocused();
  }
});

test("footer legal links reach static branded placeholder pages", async ({ page }) => {
  for (const legalPage of [
    { href: "/privacy-policy", title: "Privacy Policy" },
    { href: "/terms-of-use", title: "Terms of Use" },
  ]) {
    await page.goto("/");
    await page.getByRole("link", { name: legalPage.title }).click();
    await expect(page).toHaveURL(legalPage.href);
    await expect(page.getByRole("heading", { name: legalPage.title })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back Home" })).toBeVisible();
  }
});

test("About mosaic loads only the appropriate crop at the 30rem breakpoint", async ({ browser }) => {
  for (const width of responsiveWidths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const mosaicRequests: string[] = [];
    page.on("request", (request) => {
      if (/\/mosaic-broken(?:-mobile)?\.png/.test(request.url())) {
        mosaicRequests.push(new URL(request.url()).pathname);
      }
    });
    await page.goto("/");
    const background = await page.locator("#about").evaluate((element) => {
      const style = getComputedStyle(element, "::before");
      return { image: style.backgroundImage, position: style.backgroundPosition, size: style.backgroundSize };
    });
    const asset = width < 480 ? "/images/mosaic-broken-mobile.png" : "/images/mosaic-broken.png";
    expect(background.image).toContain(asset);
    expect(background.position.split(" ").map(Number.parseFloat)).toEqual([0, 0]);
    // Browsers may omit the implicit auto height in the serialized value.
    const sizeAxes = background.size.replace(/\([^)]*\)/g, "(width)").split(" ");
    expect(sizeAxes[1] ?? "auto").toBe("auto");
    expect(mosaicRequests).toEqual([asset]);
    await page.close();
  }
});

test("unified Button primitive shares gradient styling, default/small variants, hover/focus/active states, and reduced motion across native button and link elements", async ({
  page,
}) => {
  // Mobile layout (< 48rem): full-width and 3.5rem (56px) min-height
  await page.setViewportSize({ height: 740, width: 390 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  const contactButton = page.locator("#contact form button");
  const bannerLink = page
    .getByRole("banner")
    .getByRole("link", { name: "Get in Touch" });

  // Semantic rendering and size attributes
  await expect(contactButton).toBeVisible();
  await expect(contactButton).toHaveAttribute("type", "button");
  await expect(contactButton).toHaveAttribute("data-size", "default");
  await expect(bannerLink).toHaveAttribute("href", "/#contact");
  await expect(bannerLink).toHaveAttribute("data-size", "small");

  const formField = page.locator("#contact form input").first();
  const mobileButtonBox = (await contactButton.boundingBox())!;
  const mobileFieldBox = (await formField.boundingBox())!;
  expect(mobileButtonBox.width).toBeCloseTo(mobileFieldBox.width, 0);
  expect(mobileButtonBox.height).toBeGreaterThanOrEqual(56);

  // Desktop layout (>= 48rem): fit-content and min-width 14rem (224px)
  await page.setViewportSize({ height: 900, width: 1280 });
  const desktopButtonBox = (await contactButton.boundingBox())!;
  const desktopFormBox = (await page.locator("#contact form").boundingBox())!;
  expect(desktopButtonBox.width).toBeGreaterThanOrEqual(224);
  expect(desktopButtonBox.width).toBeLessThan(desktopFormBox.width * 0.7);

  // Shared typography, gradient styling, and metrics on default Button primitive
  const buttonStyle = await contactButton.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      bgImage: s.backgroundImage,
      bgSize: s.backgroundSize,
      color: s.color,
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      paddingBottom: s.paddingBottom,
      paddingLeft: s.paddingLeft,
      paddingRight: s.paddingRight,
      paddingTop: s.paddingTop,
      transitionDuration: s.transitionDuration,
      transitionProperty: s.transitionProperty,
    };
  });
  expect(buttonStyle.fontFamily.toLowerCase()).toContain("switzer");
  expect(buttonStyle.fontWeight).toBe("700");
  expect(buttonStyle.color).toBe("rgb(255, 255, 255)");
  expect(buttonStyle.bgImage).toContain("linear-gradient");
  expect(buttonStyle.bgImage).toContain("rgb(0, 176, 255)");
  expect(buttonStyle.bgImage).toContain("rgb(124, 77, 255)");
  expect(buttonStyle.bgImage).toContain("rgb(228, 79, 217)");
  expect(buttonStyle.bgSize).toBe("250%");
  expect(buttonStyle.fontSize).toBe("20px");
  expect(buttonStyle.paddingTop).toBe("16px");
  expect(buttonStyle.paddingBottom).toBe("16px");
  expect(buttonStyle.paddingLeft).toBe("24px");
  expect(buttonStyle.paddingRight).toBe("24px");
  const buttonProps = buttonStyle.transitionProperty.split(", ");
  const buttonDurations = buttonStyle.transitionDuration.split(", ");
  const buttonBgPosIndex = buttonProps.indexOf("background-position");
  expect(buttonBgPosIndex).toBeGreaterThanOrEqual(0);
  expect(buttonDurations[buttonBgPosIndex]).toBe("0.25s");

  // Shared typography, identical gradient styling, and small size metrics on Button primitive (rendered as navigation link)
  const linkSmallStyle = await bannerLink.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      bgImage: s.backgroundImage,
      bgSize: s.backgroundSize,
      color: s.color,
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      paddingBottom: s.paddingBottom,
      paddingLeft: s.paddingLeft,
      paddingRight: s.paddingRight,
      paddingTop: s.paddingTop,
      transitionDuration: s.transitionDuration,
      transitionProperty: s.transitionProperty,
    };
  });
  expect(linkSmallStyle.fontFamily.toLowerCase()).toContain("switzer");
  expect(linkSmallStyle.fontWeight).toBe(buttonStyle.fontWeight);
  expect(linkSmallStyle.color).toBe(buttonStyle.color);
  expect(linkSmallStyle.bgImage).toBe(buttonStyle.bgImage);
  expect(linkSmallStyle.bgSize).toBe(buttonStyle.bgSize);
  expect(linkSmallStyle.fontSize).toBe("16px");
  expect(linkSmallStyle.paddingTop).toBe("8px");
  expect(linkSmallStyle.paddingBottom).toBe("8px");
  expect(linkSmallStyle.paddingLeft).toBe("24px");
  expect(linkSmallStyle.paddingRight).toBe("24px");
  const linkProps = linkSmallStyle.transitionProperty.split(", ");
  const linkDurations = linkSmallStyle.transitionDuration.split(", ");
  const linkBgPosIndex = linkProps.indexOf("background-position");
  expect(linkBgPosIndex).toBeGreaterThanOrEqual(0);
  expect(linkDurations[linkBgPosIndex]).toBe("0.25s");

  // Shared animated hover sweep on Button primitive across native button and link elements
  await contactButton.hover();
  await expect
    .poll(async () =>
      contactButton.evaluate((el) => getComputedStyle(el).backgroundPosition),
    )
    .toMatch(/^100%/);

  await bannerLink.hover();
  await expect
    .poll(async () =>
      bannerLink.evaluate((el) => getComputedStyle(el).backgroundPosition),
    )
    .toMatch(/^100%/);

  // Shared visible white focus outline on Button primitive across native button and link elements
  await contactButton.focus();
  await expect(contactButton).toBeFocused();
  const buttonFocus = await contactButton.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      boxShadow: s.boxShadow,
      outlineColor: s.outlineColor,
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
    };
  });
  expect(buttonFocus.outlineStyle).toBe("solid");
  expect(buttonFocus.outlineColor).toBe("rgb(255, 255, 255)");
  expect(buttonFocus.outlineWidth).toBe("2px");
  expect(buttonFocus.boxShadow).toBe("none");

  await bannerLink.focus();
  await expect(bannerLink).toBeFocused();
  const linkFocus = await bannerLink.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      boxShadow: s.boxShadow,
      outlineColor: s.outlineColor,
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
    };
  });
  expect(linkFocus.outlineStyle).toBe("solid");
  expect(linkFocus.outlineColor).toBe("rgb(255, 255, 255)");
  expect(linkFocus.outlineWidth).toBe("2px");
  expect(linkFocus.boxShadow).toBe("none");

  // Shared active scale (transform: scale(0.95))
  const contactBtnBox = (await contactButton.boundingBox())!;
  await page.mouse.move(
    contactBtnBox.x + contactBtnBox.width / 2,
    contactBtnBox.y + contactBtnBox.height / 2,
  );
  await page.mouse.down();
  await expect
    .poll(async () =>
      contactButton.evaluate((el) => getComputedStyle(el).transform),
    )
    .toMatch(/matrix\(0\.95/);
  await page.mouse.up();

  const bannerLinkBox = (await bannerLink.boundingBox())!;
  await page.mouse.move(
    bannerLinkBox.x + bannerLinkBox.width / 2,
    bannerLinkBox.y + bannerLinkBox.height / 2,
  );
  await page.mouse.down();
  await expect
    .poll(async () =>
      bannerLink.evaluate((el) => getComputedStyle(el).transform),
    )
    .toMatch(/matrix\(0\.95/);
  await page.mouse.up();

  // Reduced motion behavior: transition is disabled and active transform is none across both primitives
  await page.emulateMedia({ reducedMotion: "reduce" });
  const buttonReducedTransition = await contactButton.evaluate((el) =>
    parseFloat(getComputedStyle(el).transitionDuration),
  );
  expect(buttonReducedTransition).toBeLessThan(0.001);

  const linkReducedTransition = await bannerLink.evaluate((el) =>
    parseFloat(getComputedStyle(el).transitionDuration),
  );
  expect(linkReducedTransition).toBeLessThan(0.001);

  await page.mouse.move(
    contactBtnBox.x + contactBtnBox.width / 2,
    contactBtnBox.y + contactBtnBox.height / 2,
  );
  await page.mouse.down();
  const buttonReducedActive = await contactButton.evaluate(
    (el) => getComputedStyle(el).transform,
  );
  expect(buttonReducedActive).toBe("none");
  await page.mouse.up();

  await page.mouse.move(
    bannerLinkBox.x + bannerLinkBox.width / 2,
    bannerLinkBox.y + bannerLinkBox.height / 2,
  );
  await page.mouse.down();
  const linkReducedActive = await bannerLink.evaluate(
    (el) => getComputedStyle(el).transform,
  );
  expect(linkReducedActive).toBe("none");
  await page.mouse.up();

  // Verify Button primitive with default size rendered as a link (on placeholder routes like /contact)
  await page.goto("/contact");
  await page.evaluate(() => document.fonts.ready);
  const backHomeLink = page.getByRole("link", { name: "Back Home" });
  await expect(backHomeLink).toBeVisible();
  await expect(backHomeLink).toHaveAttribute("data-size", "default");
  const linkDefaultStyle = await backHomeLink.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      bgImage: s.backgroundImage,
      bgSize: s.backgroundSize,
      fontSize: s.fontSize,
      paddingBottom: s.paddingBottom,
      paddingLeft: s.paddingLeft,
      paddingRight: s.paddingRight,
      paddingTop: s.paddingTop,
    };
  });
  expect(linkDefaultStyle.bgImage).toBe(buttonStyle.bgImage);
  expect(linkDefaultStyle.bgSize).toBe("250%");
  expect(linkDefaultStyle.fontSize).toBe("20px");
  expect(linkDefaultStyle.paddingTop).toBe("16px");
  expect(linkDefaultStyle.paddingBottom).toBe("16px");
  expect(linkDefaultStyle.paddingLeft).toBe("24px");
  expect(linkDefaultStyle.paddingRight).toBe("24px");
});
