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
