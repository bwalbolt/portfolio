import { readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const distDirName = ".next-verify";
const distDirPath = fileURLToPath(new URL(`../${distDirName}/`, import.meta.url));
const generatedConfigPaths = ["next-env.d.ts", "tsconfig.json"].map((path) => ({
  path: fileURLToPath(new URL(`../${path}`, import.meta.url)),
  source: path,
}));
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const sandboxOnly = process.argv.includes("--sandbox");

function runNpm(script, env) {
  const result = spawnSync(npmCommand, ["run", script], {
    cwd: projectRoot,
    env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return false;
  }

  return true;
}

async function snapshotGeneratedConfig() {
  return Promise.all(
    generatedConfigPaths.map(async ({ path, source }) => {
      try {
        return { path, source, content: await readFile(path, "utf8") };
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
          return { path, source, content: null };
        }

        throw error;
      }
    }),
  );
}

async function restoreGeneratedConfig(snapshots) {
  for (const { content, path } of snapshots) {
    if (content === null) {
      await rm(path, { force: true });
    } else {
      await writeFile(path, content, "utf8");
    }
  }
}

async function reserveAvailablePort() {
  const server = createServer();

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Unable to allocate an isolated verification port");
  }

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  return String(address.port);
}

const verificationEnv = {
  ...process.env,
  HARNESS: "1",
  PORTFOLIO_VERIFY_BUILD: "1",
};

// Verification must never attach to a caller-provided app instance.
delete verificationEnv.BASE_URL;
delete verificationEnv.PORT;

console.log(`Verification build directory: ${distDirName}`);

const generatedConfigSnapshots = await snapshotGeneratedConfig();

try {
  await rm(distDirPath, { force: true, recursive: true });

  const scripts = ["lint", "typecheck", sandboxOnly ? "build:sandbox" : "build"];

  for (const script of scripts) {
    if (!runNpm(script, verificationEnv)) {
      break;
    }
  }

  if (!sandboxOnly && !process.exitCode) {
    const port = await reserveAvailablePort();
    console.log(`Playwright server port: ${port}`);
    runNpm("test:e2e", { ...verificationEnv, PORT: port });
  }
} finally {
  await rm(distDirPath, { force: true, recursive: true });
  await restoreGeneratedConfig(generatedConfigSnapshots);
}
