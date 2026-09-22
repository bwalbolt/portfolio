import { expect, test } from "@playwright/test";

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

test("body owns the noisy background and the hero clips its bottom edge", async ({
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
        heroCutawayCount: hero.querySelectorAll('[class*="heroCutaway"]').length,
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
    expect(shellStyles.heroCutawayCount, viewport.name).toBe(0);
    expect(shellStyles.heroClipPath, viewport.name).toMatch(
      /^polygon\(0(px)? 0(px)?, 100% 0(px)?, 100% 84%, 0(px)? 100%\)$/,
    );
  }
});

test("desktop navigation stays fixed over the hero without colliding with content", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1280 });
  await page.goto("/");

  const banner = page.getByRole("banner");
  const navigationBar = banner.locator("div").first();
  const hero = page.locator("main > section").first();
  const heroTitle = hero.getByRole("heading", { level: 1 });

  await expect(banner).toHaveCSS("position", "fixed");
  await expect(banner).toHaveCSS("background-color", "rgb(0, 0, 0)");

  const desktopLayout = await Promise.all([
    navigationBar.boundingBox(),
    hero.boundingBox(),
    heroTitle.boundingBox(),
  ]);
  const [navigationBarBox, heroBox, titleBox] = desktopLayout;

  expect(navigationBarBox).not.toBeNull();
  expect(heroBox).not.toBeNull();
  expect(titleBox).not.toBeNull();
  expect(navigationBarBox?.height).toBeCloseTo(54, 0);
  expect(heroBox?.y).toBe(0);
  expect(titleBox?.y).toBeGreaterThan(navigationBarBox?.height ?? 0);

  const desktopHeroBackground = await hero
    .locator('[class*="heroBackground"]')
    .evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(desktopHeroBackground).toContain("linear-gradient");
  expect(desktopHeroBackground).toContain("rgb(0, 0, 0) 0px");
  expect(desktopHeroBackground).toContain("rgb(0, 0, 0) 54px");
});

test("hero geometry and headline gradients follow the responsive Figma composition", async ({
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
  const lineGradients = await titleLines.evaluateAll((lines) =>
    lines.map((line) => getComputedStyle(line).backgroundImage),
  );
  expect(lineGradients[0]).toContain(
    "rgb(0, 176, 255) 20%, rgb(102, 208, 255) 35%, rgb(124, 77, 255) 50%",
  );
  expect(lineGradients[1]).toContain(
    "rgb(124, 77, 255) 15%, rgb(221, 178, 255) 32%, rgb(228, 79, 255) 53%",
  );
  for (const highlight of await highlights.all()) {
    await expect(highlight).toHaveCSS("background-image", "none");
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
  }
});

test("mobile navigation is transparent at the top and gains a scroll surface", async ({
  page,
}) => {
  await page.setViewportSize({ height: 740, width: 390 });
  await page.goto("/", { waitUntil: "networkidle" });

  const banner = page.getByRole("banner");

  await expect(banner).toHaveCSS("position", "fixed");
  await expect(banner).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

  const menuButton = banner.getByRole("button", { name: "Toggle navigation" });
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");

  await page.evaluate(() => window.scrollTo({ behavior: "instant", top: 160 }));
  await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(8);
  await expect(banner).toHaveCSS("background-color", "rgb(0, 0, 0)");
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
      const arrows = section.getByRole("link", { name: "Read more", exact: true }).locator("svg");
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
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const about = page.locator("#about");
    const portrait = about.getByRole("img", { name: "Portrait of Brent Walbolt" });
    const frame = portrait.locator("..");
    const title = about.getByRole("heading", { name: "About Me", exact: true });
    const copy = title.locator("..");
    const paragraph = copy.locator("p");
    await expect(paragraph).toHaveCount(1);
    await expect(paragraph).toContainText("experiences. Expert at translating");
    await expect(paragraph).toContainText("modern web technologies.");
    await expect(paragraph).toHaveCSS("font-size", "18px");
    const backdrop = await about.evaluate((element) => getComputedStyle(element, "::before").backgroundImage);
    expect(backdrop).toContain(width > 480 ? "mosaic-broken.png" : "mosaic-broken-mobile.png");
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
    if (width < 1024) {
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
    await about.screenshot({ path: testInfo.outputPath(`about-${width}.png`) });
  }
});

test("About mosaic loads only the appropriate crop at the 30rem breakpoint", async ({ browser }) => {
  for (const width of [390, 480, 481, 768, 1024, 1280]) {
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
    const asset = width <= 480 ? "/images/mosaic-broken-mobile.png" : "/images/mosaic-broken.png";
    expect(background.image).toContain(asset);
    expect(background.position.split(" ").map(Number.parseFloat)).toEqual([0, 0]);
    // Browsers may omit the implicit auto height in the serialized value.
    const sizeAxes = background.size.replace(/\([^)]*\)/g, "(width)").split(" ");
    expect(sizeAxes[1] ?? "auto").toBe("auto");
    expect(mosaicRequests).toEqual([asset]);
    await page.close();
  }
});
