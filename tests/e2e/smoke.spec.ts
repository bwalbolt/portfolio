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
