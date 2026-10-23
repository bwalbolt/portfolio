import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import {
  acquireHarnessRuntime,
  createHarnessEnvironment,
  getPlaywrightArgs,
  releaseHarnessRuntime,
  runOwnedCommand,
} from "./harness-runtime.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const playwrightCli = require.resolve("@playwright/test/cli");
const runtime = await acquireHarnessRuntime({ mode: "dev", projectRoot });
const environment = createHarnessEnvironment(runtime);

console.log(`Harness test port: ${runtime.port}`);
console.log(`Harness test directory: ${runtime.distDir}`);

try {
  process.exitCode = await runOwnedCommand(
    process.execPath,
    [playwrightCli, "test", ...getPlaywrightArgs()],
    { cwd: projectRoot, env: environment },
  );
} finally {
  await releaseHarnessRuntime(runtime);
}
