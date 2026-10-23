import { expect, test } from "@playwright/test";

const allPosts = [
  {
    date: "APR 06, 2026 // 003",
    body: "When a vertical stack is made of independent components",
    description: "Most frontend devs agree on one-side margin, but which side?",
    slug: "margin-top-for-the-win",
    title: "Margin-top For the Win",
  },
  {
    date: "APR 05, 2026 // 002",
    body: "The best improvements were unglamorous",
    description: "How practical can a 2015 MacBook Air be for full-stack work?",
    slug: "working-on-old-hardware",
    title: "Working on Old Hardware",
  },
  {
    date: "APR 04, 2026 // 001",
    body: "The goal is not to publish for the sake of it.",
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

test("article navigation preserves its listing origin without polluting canonical URLs", async ({ browser, page }) => {
  const articlePath = "/blog/margin-top-for-the-win";

  const freshContext = await browser.newContext();
  const freshPage = await freshContext.newPage();
  await freshPage.goto(articlePath);
  await expect(freshPage.getByRole("link", { name: "< Back to Blog" })).toHaveAttribute("href", "/blog");
  await expect(freshPage.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Blog" })).toHaveAttribute("aria-current", "page");
  await freshContext.close();

  await page.goto("/blog");
  const blogCard = page.getByRole("link", { name: "Read more about Margin-top For the Win" });
  await expect(blogCard).toHaveAttribute("href", articlePath);
  await blogCard.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(articlePath);
  await expect(page.getByRole("link", { name: "< Back to Blog" })).toHaveAttribute("href", "/blog");
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Blog" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Tutorials" })).not.toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "< Back to Blog" }).click();
  await expect(page).toHaveURL("/blog");

  await page.goto("/tutorial");
  const tutorialCard = page.getByRole("link", { name: "Read more about Margin-top For the Win" });
  await expect(tutorialCard).toHaveAttribute("href", articlePath);
  await tutorialCard.click();
  await expect(page).toHaveURL(articlePath);
  await expect(page.getByRole("link", { name: "< Back to Tutorials" })).toHaveAttribute("href", "/tutorial");
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Tutorials" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Blog" })).not.toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "< Back to Tutorials" }).click();
  await expect(page).toHaveURL("/tutorial");

  await page.goto("/");
  await page.getByRole("link", { name: "Read more about Margin-top For the Win" }).click();
  await expect(page).toHaveURL(articlePath);
  await expect(page.getByRole("link", { name: "< Back to Blog" })).toBeVisible();

  await page.goto(`${articlePath}?from=tutorial`);
  await expect(page.getByRole("link", { name: "< Back to Tutorials" })).toHaveAttribute("href", "/tutorial");
  await expect(page.getByRole("heading", { level: 1, name: "Margin-top For the Win" })).toBeVisible();

  await page.goto(`${articlePath}?from=unrecognized`);
  await expect(page.getByRole("link", { name: "< Back to Blog" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "< Back to Blog" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${articlePath}?from=tutorial`);
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  const mobileNavigation = page.getByRole("navigation", { name: "Mobile" });
  await expect(mobileNavigation.getByRole("link", { name: "Tutorials" })).toHaveAttribute("aria-current", "page");
  await expect(mobileNavigation.getByRole("link", { name: "Blog" })).not.toHaveAttribute("aria-current", "page");
});

test("canonical blog posts are static, semantic, and use the responsive reading scale", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  for (const post of allPosts) {
    await page.goto(`/blog/${post.slug}`);

    await expect(page).toHaveTitle(`${post.title} | Brent Walbolt`);
    await expect(page.locator("main article")).toHaveCount(1);
    await expect(page.locator("main article h1")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1, name: post.title })).toBeVisible();
    await expect(page.locator("main article")).toContainText(post.description);
    await expect(page.locator("main article")).toContainText(post.body);
    await expect(page.locator("main article .responsive-text")).toHaveCount(1);
  }

  await page.goto("/blog/margin-top-for-the-win");
  const article = page.locator("main article");
  const responsiveText = article.locator(".responsive-text");
  await expect(responsiveText).toHaveCSS("font-family", /sourceSerif/);
  expect(
    await responsiveText.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
  ).toBeCloseTo(17.3056, 1);
  expect(
    await responsiveText.evaluate((element) => Number.parseFloat(getComputedStyle(element).width)),
  ).toBeCloseTo(776.5, 0);
  expect(
    await article.locator("h2").evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
  ).toBeCloseTo(29.7656, 1);
  await expect(article.locator("h2")).toHaveCSS("font-family", /switzer/);
  await expect(page.locator("main article > .responsive-text > header")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Legal" })).toBeVisible();

  const unknownResponse = await page.goto("/blog/not-a-post");
  expect(unknownResponse?.status()).toBe(404);
});

test("responsive article text is bounded on mobile and protects rich MDX content", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/blog/margin-top-for-the-win");

  const responsiveText = page.locator("main article .responsive-text");
  expect(
    await responsiveText.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
  ).toBeCloseTo(14.625, 1);
  expect(await page.locator("html").evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(390);

  await responsiveText.evaluate((element) => {
    element.insertAdjacentHTML(
      "beforeend",
      `<ul><li>List treatment</li></ul>
       <blockquote>Quote treatment</blockquote>
       <p><a href="#rich-mdx">Link treatment</a> and <code>inline_code</code></p>
       <pre><code>${"long_technical_token_".repeat(20)}</code></pre>
       <img alt="Responsive treatment example" src="/images/file.svg">`,
    );
  });

  const richContent = responsiveText.locator(":scope > :nth-last-child(-n + 5)");
  await expect(richContent).toHaveCount(5);
  await expect(responsiveText.locator("ul").last()).toHaveCSS("list-style-type", "disc");
  await expect(responsiveText.locator("blockquote").last()).toHaveCSS("border-left-width", "2px");
  await expect(responsiveText.locator("pre").last()).toHaveCSS("overflow-x", "auto");
  await expect(responsiveText.locator("img").last()).toHaveCSS("max-width", "100%");

  const link = responsiveText.locator("a").last();
  await link.focus();
  await expect(link).toBeFocused();
  await expect(link).toHaveCSS("text-decoration-line", "underline");
  await expect(
    link,
  ).toHaveCSS("box-shadow", /rgba\(2, 20, 29, 0\.92\).*rgba\(0, 176, 255, 0\.7\)/);
  expect(await page.locator("html").evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(390);
});

test("blog pages publish canonical social metadata, structured data, and crawl routes", async ({ page, request }) => {
  const publishedPosts = [
    { slug: "margin-top-for-the-win", title: "Margin-top For the Win", description: "Most frontend devs agree on one-side margin, but which side?", publishedAt: "2026-04-06", tags: ["tutorial"], image: "/images/social-card.png", imageAlt: "Brent Walbolt — Hand-crafted interfaces, accessibility, performance, and AI-accelerated workflows." },
    { slug: "working-on-old-hardware", title: "Working on Old Hardware", description: "How practical can a 2015 MacBook Air be for full-stack work?", publishedAt: "2026-04-05", tags: [], image: "/images/social-card.png", imageAlt: "Brent Walbolt — Hand-crafted interfaces, accessibility, performance, and AI-accelerated workflows." },
    { slug: "hello-world", title: "Hello World", description: "It's been a while since I had a site live. It's time to start fresh.", publishedAt: "2026-04-04", tags: [], image: "/images/hero-background.jpg", imageAlt: "A dark navy and cyan abstract portfolio backdrop." },
  ] as const;

  await page.goto("/");
  await expect(page.locator('meta[name="author"]')).toHaveAttribute("content", "Brent Walbolt");
  await expect(page.locator('meta[name="creator"]')).toHaveAttribute("content", "Brent Walbolt");
  await expect(page.locator('meta[name="publisher"]')).toHaveAttribute("content", "Brent Walbolt");

  for (const post of publishedPosts) {
    const canonicalUrl = `https://brent.walbolt.com/blog/${post.slug}`;
    await page.goto(`/blog/${post.slug}${post.slug === "margin-top-for-the-win" ? "?from=tutorial" : ""}`);
    await expect(page).toHaveTitle(`${post.title} | Brent Walbolt`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", post.description);
    await expect(page.locator('meta[name="keywords"]')).toHaveAttribute("content", [post.title, ...post.tags].join(","));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonicalUrl);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonicalUrl);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", post.title);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", post.description);
    await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute("content", post.publishedAt);
    await expect(page.locator('meta[property="article:author"]')).toHaveAttribute("content", "Brent Walbolt");
    await expect(page.locator('meta[property="article:tag"]')).toHaveCount(post.tags.length);
    if (post.tags.length) await expect(page.locator('meta[property="article:tag"]')).toHaveAttribute("content", post.tags[0]);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `https://brent.walbolt.com${post.image}`);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", post.imageAlt);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", post.title);
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute("content", post.description);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", `https://brent.walbolt.com${post.image}`);
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute("content", post.imageAlt);

    const structuredData = JSON.parse(await page.locator('main article script[type="application/ld+json"]').textContent() ?? "{}");
    expect(structuredData).toMatchObject({
      "@type": "BlogPosting", author: { name: "Brent Walbolt" }, datePublished: post.publishedAt,
      description: post.description, headline: post.title, image: `https://brent.walbolt.com${post.image}`,
      keywords: post.tags, mainEntityOfPage: canonicalUrl, url: canonicalUrl,
    });
  }

  for (const route of [
    ["/blog", "Latest Insights | Brent Walbolt", "Notes on design engineering, accessible interfaces, performance, and practical frontend workflows.", "https://brent.walbolt.com/blog"],
    ["/tutorial?from=tutorial", "Tutorials | Brent Walbolt", "Practical design engineering tutorials from Brent Walbolt.", "https://brent.walbolt.com/tutorial"],
  ] as const) {
    await page.goto(route[0]);
    await expect(page).toHaveTitle(route[1]);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", route[2]);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", route[3]);
  }

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toMatch(/Allow: \/[\s\S]*Sitemap: https:\/\/brent\.walbolt\.com\/sitemap\.xml/);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const sitemapText = await sitemap.text();
  for (const route of ["/", "/blog", "/tutorial", "/case-studies", "/privacy-policy", "/terms-of-use"]) {
    expect(sitemapText).toContain(`<loc>https://brent.walbolt.com${route}</loc>`);
  }
  for (const post of publishedPosts) {
    expect(sitemapText).toContain(`<loc>https://brent.walbolt.com/blog/${post.slug}</loc>`);
    expect(sitemapText).toContain(`<lastmod>${post.publishedAt}</lastmod>`);
  }

  const missingPost = await page.goto("/blog/not-a-post");
  expect(missingPost?.status()).toBe(404);
});
