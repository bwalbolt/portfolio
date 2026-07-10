import { defineConfig, devices } from "@playwright/test";

const isHarnessRun = process.env.HARNESS === "1";
const baseURLFromEnv = process.env.BASE_URL;
const port =
  process.env.PORT ??
  (baseURLFromEnv ? new URL(baseURLFromEnv).port : undefined) ??
  (isHarnessRun ? "3100" : "3000");
const baseURL = baseURLFromEnv ?? `http://127.0.0.1:${port}`;

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
    reuseExistingServer: !process.env.CI && !isHarnessRun,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
