import { defineConfig, devices } from "@playwright/test";

const harnessRunId = process.env.PORTFOLIO_HARNESS_RUN_ID;
const harnessMode = process.env.PORTFOLIO_HARNESS_SERVER_MODE;
const baseURLFromEnv = process.env.BASE_URL;
const port =
  process.env.PORT ??
  (baseURLFromEnv ? new URL(baseURLFromEnv).port : undefined) ??
  "3100";
const baseURL = baseURLFromEnv ?? `http://127.0.0.1:${port}`;
const reuseExistingServer =
  process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === "1";

if (harnessRunId || harnessMode) {
  if (
    !harnessRunId ||
    !/^(dev|production)-\d+-[0-9a-f-]{36}$/.test(harnessRunId) ||
    !harnessMode ||
    !["dev", "production"].includes(harnessMode) ||
    !harnessRunId.startsWith(`${harnessMode}-`) ||
    !/^\d+$/.test(port)
  ) {
    throw new Error("Invalid internal harness Playwright configuration");
  }
}

const serverScript = harnessMode === "dev" ? "dev" : "start";
const harnessOutputDir = harnessRunId
  ? `.next-harness/${harnessRunId}/playwright-results`
  : "test-results";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  outputDir: harnessOutputDir,
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run ${serverScript} -- -H 127.0.0.1 -p ${port}`,
    url: baseURL,
    reuseExistingServer: harnessRunId ? false : reuseExistingServer,
    timeout: 120_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
