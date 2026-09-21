import { defineConfig, devices } from "@playwright/test";

const baseURLFromEnv = process.env.BASE_URL;
const port =
  process.env.PORT ??
  (baseURLFromEnv ? new URL(baseURLFromEnv).port : undefined) ??
  "3100";
const baseURL = baseURLFromEnv ?? `http://127.0.0.1:${port}`;
const reuseExistingServer =
  process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  outputDir: "test-results",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run start -- -H 127.0.0.1 -p ${port}`,
    url: baseURL,
    reuseExistingServer,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
