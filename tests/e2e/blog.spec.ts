import { expect, test } from "@playwright/test";

const allPosts = [
  {
    date: "APR 06, 2026 // 003",
    description: "Most frontend devs agree on one-side margin, but which side?",
    slug: "margin-top-for-the-win",
    title: "Margin-top For the Win",
  },
  {
    date: "APR 05, 2026 // 002",
    description: "How practical can a 2015 MacBook Air be for full-stack work?",
    slug: "working-on-old-hardware",
    title: "Working on Old Hardware",
  },
  {
    date: "APR 04, 2026 // 001",
    description: "It's been a while since I had a site live. It's time to start fresh.",
    slug: "hello-world",
    title: "Hello World",
  },
] as const;

test("blog lists every canonical post once in newest-first order", async ({ page }) => {
  await page.goto("/blog");

  await expect(page.getByRole("heading", { level: 1, name: "Latest Insights" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.locator("main article")).toHaveCount(allPosts.length);
  await expect(page.getByRole("navigation", { name: "Legal" })).toBeVisible();
  await expect(page.getByText(/page \d+|next|previous/i)).toHaveCount(0);

  for (const [index, post] of allPosts.entries()) {
    const card = page.locator("main article").nth(index);
    await expect(card).toContainText(post.date);
    await expect(card).toContainText(post.title);
    await expect(card).toContainText(post.description);
    await expect(card.getByRole("link", { name: `Read more about ${post.title}` })).toHaveAttribute(
      "href",
      `/blog/${post.slug}`,
    );
  }
});

test("tutorial lists only tutorial-tagged posts", async ({ page }) => {
  await page.goto("/tutorial");

  await expect(page.getByRole("heading", { level: 1, name: "Tutorials" })).toBeVisible();
  const cards = page.locator("main article");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Margin-top For the Win");
  await expect(cards.first().getByRole("link")).toHaveAttribute(
    "href",
    "/blog/margin-top-for-the-win",
  );
  await expect(page.getByText("Working on Old Hardware")).toHaveCount(0);
  await expect(page.getByText("Hello World")).toHaveCount(0);
});

test("post cards retain a single keyboard-accessible destination and responsive grid", async ({
  page,
}) => {
  for (const [width, columns] of [[390, 1], [768, 2], [992, 3]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/blog");

    const cards = page.locator("main article");
    const positions = await cards.evaluateAll((elements) =>
      elements.map((element) => Math.round(element.getBoundingClientRect().top)),
    );

    expect(new Set(positions).size, `${width}px grid`).toBe(
      Math.ceil(allPosts.length / columns),
    );
  }

  const firstCard = page.locator("main article").first();
  const destination = firstCard.getByRole("link", { name: "Read more about Margin-top For the Win" });
  await expect(firstCard.getByRole("link")).toHaveCount(1);
  await destination.focus();
  await expect(destination).toBeFocused();
  await expect(firstCard).toHaveCSS("isolation", "isolate");
  await expect(firstCard.locator(":scope > div")).toHaveCSS(
    "background-color",
    "rgb(7, 25, 34)",
  );
  await expect(firstCard.locator(":scope > div")).toHaveCSS(
    "border-color",
    "rgba(255, 255, 255, 0.4)",
  );

  await destination.click();
  await expect(page).toHaveURL("/blog/margin-top-for-the-win");
});

test("canonical post cards use the homepage type scale and equal row heights", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/blog");

  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-size", "62px");
  const grid = page.locator("main ul");
  await expect(grid).toHaveCSS("column-gap", "32px");
  await expect(grid).toHaveCSS("row-gap", "32px");

  const card = page.locator("main article").first().locator(":scope > div");
  await expect(card).toHaveCSS("padding", "40px");
  await expect(card).toHaveCSS("border-top-left-radius", "24px");
  await expect(card).toHaveCSS("border-top-right-radius", "8px");
  await expect(card).toHaveCSS("border-bottom-right-radius", "24px");
  await expect(card).toHaveCSS("border-bottom-left-radius", "8px");
  await expect(card).toHaveCSS("min-height", "0px");
  await expect(card.locator("h2")).toHaveCSS("font-size", "20px");
  await expect(card.locator("p").first()).toHaveCSS("font-size", "10px");
  await expect(card.locator("p").nth(1)).toHaveCSS("font-size", "14px");
  const listingReadMore = card.getByRole("link");
  await expect(listingReadMore).toHaveCSS("font-size", "10px");
  const readMoreTypography = await listingReadMore.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      letterSpacing: style.letterSpacing,
      lineHeight: style.lineHeight,
      textTransform: style.textTransform,
    };
  });

  const blogHeights = await page.locator("main article").evaluateAll((cards) =>
    cards.map((item) => item.getBoundingClientRect().height),
  );
  expect(new Set(blogHeights.map(Math.round)).size).toBe(1);

  await page.goto("/");
  const homepageCard = page.locator("#insights article").first();
  await expect(homepageCard.locator(":scope > div")).toHaveCSS("min-height", "0px");
  await expect(homepageCard.locator("h3")).toHaveCSS("font-size", "20px");
  await expect(homepageCard.locator("p").first()).toHaveCSS("font-size", "10px");
  await expect(homepageCard.locator("p").nth(1)).toHaveCSS("font-size", "14px");
  const homepageReadMore = homepageCard.getByRole("link");
  await expect(homepageReadMore).toHaveCSS("font-size", readMoreTypography.fontSize);
  await expect(homepageReadMore).toHaveCSS("font-family", readMoreTypography.fontFamily);
  await expect(homepageReadMore).toHaveCSS("font-weight", readMoreTypography.fontWeight);
  await expect(homepageReadMore).toHaveCSS("letter-spacing", readMoreTypography.letterSpacing);
  await expect(homepageReadMore).toHaveCSS("line-height", readMoreTypography.lineHeight);
  await expect(homepageReadMore).toHaveCSS("text-transform", readMoreTypography.textTransform);

  const homepageHeights = await page.locator("#insights article").evaluateAll((cards) =>
    cards.map((item) => item.getBoundingClientRect().height),
  );
  expect(new Set(homepageHeights.map(Math.round)).size).toBe(1);
});
