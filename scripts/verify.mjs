import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import {
  acquireHarnessRuntime,
  createHarnessEnvironment,
  npmExecutable,
  releaseHarnessRuntime,
  runOwnedCommand,
} from "./harness-runtime.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const playwrightCli = require.resolve("@playwright/test/cli");
const sandboxOnly = process.argv.includes("--sandbox");
const runtime = await acquireHarnessRuntime({ mode: "production", projectRoot });
const environment = createHarnessEnvironment(runtime);

console.log(`Verification build directory: ${runtime.distDir}`);

async function runNpm(script, env = process.env) {
  const status = await runOwnedCommand(npmExecutable(), ["run", script], {
    cwd: projectRoot,
    env,
  });
  if (status !== 0) {
    process.exitCode = status;
    return false;
  }
  return true;
}

try {
  for (const script of ["lint", "typecheck", "test:harness-runtime"]) {
    if (!(await runNpm(script))) {
      break;
    }
  }

  if (!process.exitCode) {
    await runNpm(sandboxOnly ? "build:sandbox" : "build", environment);
  }

  if (!sandboxOnly && !process.exitCode) {
    console.log(`Playwright server port: ${runtime.port}`);
    process.exitCode = await runOwnedCommand(
      process.execPath,
      [playwrightCli, "test"],
      { cwd: projectRoot, env: environment },
    );
  }
} finally {
  await releaseHarnessRuntime(runtime);
}
