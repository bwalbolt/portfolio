import { expect, test } from "@playwright/test";

test("contact field grid switches to two columns at the 62rem breakpoint", async ({ page }) => {
  const fieldGrid = page.locator("#contact form > div").first();

  const columnCount = () =>
    fieldGrid.evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length,
    );

  await page.setViewportSize({ height: 900, width: 991 });
  await page.goto("/");
  await expect.poll(columnCount).toBe(1);

  await page.setViewportSize({ height: 900, width: 992 });
  await expect.poll(columnCount).toBe(2);
});

test("contact form validates, submits, and announces its result", async ({ page }) => {
  let releaseSubmission: (() => void) | undefined;

  await page.route(/\/api\/contact$/, async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.postDataJSON()).toEqual({
      company: "",
      email: "ada@example.com",
      message: "I would like to discuss a project.",
      name: "Ada Lovelace",
    });
    await new Promise<void>((resolve) => {
      releaseSubmission = resolve;
    });
    await route.fulfill({
      body: JSON.stringify({ ok: true }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/");
  const defaultReservedSpace = await page.evaluate(() => ({
    email: getComputedStyle(document.querySelector('[data-field="email"]')!).paddingBottom,
    message: getComputedStyle(document.querySelector('[data-field="message"]')!).paddingBottom,
    name: getComputedStyle(document.querySelector('[data-field="name"]')!).paddingBottom,
  }));
  expect(defaultReservedSpace).toEqual({
    email: "24px",
    message: "0px",
    name: "24px",
  });

  await page.getByRole("button", { name: "Get in Touch" }).click();
  await expect(page.getByText("Please enter your name.", { exact: true })).toBeVisible();
  await expect(page.getByText("Please enter a valid email address.", { exact: true })).toBeVisible();
  await expect(page.getByText("Please enter a message.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Name")).toHaveAttribute("aria-describedby", "contact-name-error");
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Message")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator('[data-status="idle"]')).toBeEmpty();

  const errorLayout = await page.locator('[data-field="name"]').evaluate((element) => {
    const group = getComputedStyle(element);
    const error = getComputedStyle(element.querySelector("p")!);
    const form = getComputedStyle(element.closest("form")!);
    const messageGroup = getComputedStyle(document.querySelector('[data-field="message"]')!);

    return {
      errorBottom: error.bottom,
      errorColor: error.color,
      errorPosition: error.position,
      formGap: form.rowGap,
      groupPaddingBottom: group.paddingBottom,
      groupPosition: group.position,
      invalidBorder: getComputedStyle(document.querySelector("#contact-name")!).borderColor,
      messagePaddingBottom: messageGroup.paddingBottom,
    };
  });
  expect(errorLayout).toEqual({
    errorBottom: "0px",
    errorColor: "rgb(209, 38, 0)",
    errorPosition: "absolute",
    formGap: "16px",
    groupPaddingBottom: "24px",
    groupPosition: "relative",
    invalidBorder: "rgb(209, 38, 0)",
    messagePaddingBottom: "24px",
  });

  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Message").fill("I would like to discuss a project.");
  await page.getByRole("button", { name: "Get in Touch" }).click();

  const sendingButton = page.getByRole("button", { name: "Sending…" });
  await expect(sendingButton).toBeDisabled();
  await expect(page.locator('[data-status="sending"]')).toHaveText("Sending your message…");
  await expect.poll(() => Boolean(releaseSubmission)).toBe(true);
  releaseSubmission?.();

  await expect(page.locator('[data-status="success"]')).toHaveText(
    "Success! Thanks — your message is on its way. I’ll be in touch soon.",
  );
  await expect(page.locator('[data-status="success"]')).toHaveCSS(
    "background-color",
    "rgb(186, 242, 220)",
  );
  await expect(page.locator('[data-status="success"] strong')).toHaveCSS(
    "color",
    "rgb(0, 97, 66)",
  );
  await expect(page.getByLabel("Name")).toHaveValue("");
  await expect(page.locator("#contact").getByRole("link", { name: "Privacy Policy" })).toBeVisible();
});

test("contact form reports a delivery failure without exposing provider details", async ({ page }) => {
  await page.route(/\/api\/contact$/, (route) =>
    route.fulfill({
      body: JSON.stringify({ message: "provider error" }),
      contentType: "application/json",
      status: 502,
    }),
  );
  await page.goto("/");
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Message").fill("I would like to discuss a project.");
  await page.getByRole("button", { name: "Get in Touch" }).click();

  await expect(page.locator('[data-status="error"]')).toHaveText(
    "Error: Your message could not be sent. Please try again shortly.",
  );
  await expect(page.locator('[data-status="error"] strong')).toHaveCSS(
    "color",
    "rgb(168, 31, 0)",
  );
  await expect(page.getByText("provider error")).toHaveCount(0);
});

test("contact route validates payloads and silently suppresses honeypots", async ({ request }) => {
  const siteResponse = await request.get("/");
  const origin = new URL(siteResponse.url()).origin;
  const headers = { "content-type": "application/json", origin };

  const crossOrigin = await request.post("/api/contact", {
    data: { email: "ada@example.com", message: "Hello", name: "Ada" },
    headers: { "content-type": "application/json", origin: "https://example.com" },
  });
  expect(crossOrigin.status()).toBe(403);

  const invalid = await request.post("/api/contact", {
    data: { email: "not-an-email", message: "Hello", name: "Ada" },
    headers,
  });
  expect(invalid.status()).toBe(400);

  const oversized = await request.post("/api/contact", {
    data: { email: "ada@example.com", message: "Hello", name: "A".repeat(121) },
    headers,
  });
  expect(oversized.status()).toBe(400);

  const honeypot = await request.post("/api/contact", {
    data: {
      company: "Automation LLC",
      email: "ada@example.com",
      message: "Hello",
      name: "Ada",
    },
    headers,
  });
  expect(honeypot.status()).toBe(200);
  await expect(honeypot.json()).resolves.toEqual({ ok: true });

  const unavailable = await request.post("/api/contact", {
    data: { email: "ada@example.com", message: "Hello", name: "Ada" },
    headers,
  });
  expect(unavailable.status()).toBe(502);
});
