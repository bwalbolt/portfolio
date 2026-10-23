import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  mkdir,
  open,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { basename, join, relative, resolve, sep } from "node:path";

const runtimeDirectoryName = ".next-harness";
const stateFilename = "runtime-state.json";
const lockFilename = "runtime-state.lock";
const allowedModes = new Set(["dev", "production"]);

const delay = (milliseconds) =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

export function createRunId(mode, pid = process.pid, uuid = randomUUID()) {
  if (!allowedModes.has(mode)) {
    throw new Error(`Unsupported harness server mode: ${mode}`);
  }

  return `${mode}-${pid}-${uuid}`;
}

export function getPlaywrightArgs(argv = process.argv) {
  return argv.slice(2);
}

export function validateRuntimePath(projectRoot, candidate, runId) {
  const expected = join(runtimeDirectoryName, runId, "output");
  const normalized = candidate.split("/").join(sep);
  const absolute = resolve(projectRoot, normalized);
  const expectedAbsolute = resolve(projectRoot, expected);

  if (absolute !== expectedAbsolute || relative(projectRoot, absolute).startsWith("..")) {
    throw new Error(`Invalid harness output directory: ${candidate}`);
  }

  return candidate;
}

export function isProcessAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return Boolean(error && typeof error === "object" && error.code === "EPERM");
  }
}

async function readOptional(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function readState(statePath) {
  const content = await readOptional(statePath);
  if (content === null) {
    return null;
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`Harness runtime state is invalid: ${statePath}`);
  }
}

async function writeState(statePath, state) {
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function acquireCoordinatorLock(lockPath) {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    try {
      const handle = await open(lockPath, "wx");
      await handle.writeFile(`${process.pid}\n`, "utf8");
      return handle;
    } catch (error) {
      if (!error || typeof error !== "object" || error.code !== "EEXIST") {
        throw error;
      }

      const ownerText = await readOptional(lockPath);
      const ownerPid = Number.parseInt(ownerText ?? "", 10);
      if (!isProcessAlive(ownerPid)) {
        await rm(lockPath, { force: true });
        continue;
      }

      await delay(25);
    }
  }

  throw new Error("Timed out waiting for the harness runtime coordinator");
}

async function withCoordinatorLock(runtimeRoot, callback) {
  await mkdir(runtimeRoot, { recursive: true });
  const lockPath = join(runtimeRoot, lockFilename);
  const lockHandle = await acquireCoordinatorLock(lockPath);

  try {
    return await callback();
  } finally {
    await lockHandle.close();
    await rm(lockPath, { force: true });
  }
}

async function removeArtifacts(projectRoot, artifacts) {
  for (const artifact of artifacts) {
    const absolute = resolve(projectRoot, artifact);
    const runtimeRoot = resolve(projectRoot, runtimeDirectoryName);
    if (absolute !== runtimeRoot && !absolute.startsWith(`${runtimeRoot}${sep}`)) {
      throw new Error(`Refusing to clean non-harness path: ${artifact}`);
    }
    await rm(absolute, { force: true, recursive: true });
  }
}

async function restoreNextEnv(projectRoot, content) {
  const nextEnvPath = join(projectRoot, "next-env.d.ts");
  if (content === null) {
    await rm(nextEnvPath, { force: true });
  } else {
    await writeFile(nextEnvPath, content, "utf8");
  }
}

function pruneRuns(state) {
  const activeRuns = {};
  const retiredArtifacts = [...(state.retiredArtifacts ?? [])];

  for (const [runId, run] of Object.entries(state.runs ?? {})) {
    if (isProcessAlive(run.pid)) {
      activeRuns[runId] = run;
    } else {
      retiredArtifacts.push(...run.artifacts);
    }
  }

  return { ...state, runs: activeRuns, retiredArtifacts };
}

export async function reserveAvailablePort() {
  const server = createServer();
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Unable to allocate an isolated harness port");
  }

  await new Promise((resolveClose, reject) => {
    server.close((error) => (error ? reject(error) : resolveClose()));
  });
  return String(address.port);
}

export async function acquireHarnessRuntime({
  mode,
  projectRoot,
  pid = process.pid,
  uuid,
  portAllocator = reserveAvailablePort,
}) {
  const runId = createRunId(mode, pid, uuid);
  const runtimeRoot = join(projectRoot, runtimeDirectoryName);
  const statePath = join(runtimeRoot, stateFilename);
  const runRoot = join(runtimeRoot, runId);
  const distDir = join(runtimeDirectoryName, runId, "output").split(sep).join("/");
  const tsconfigPath = join(runtimeDirectoryName, runId, "tsconfig.json")
    .split(sep)
    .join("/");
  validateRuntimePath(projectRoot, distDir, runId);
  const port = await portAllocator();

  await withCoordinatorLock(runtimeRoot, async () => {
    let state = pruneRuns((await readState(statePath)) ?? {
      originalNextEnv: await readOptional(join(projectRoot, "next-env.d.ts")),
      runs: {},
      retiredArtifacts: [],
    });

    if (Object.keys(state.runs).length === 0 && state.retiredArtifacts.length > 0) {
      await restoreNextEnv(projectRoot, state.originalNextEnv);
      await removeArtifacts(projectRoot, state.retiredArtifacts);
      state = {
        originalNextEnv: await readOptional(join(projectRoot, "next-env.d.ts")),
        runs: {},
        retiredArtifacts: [],
      };
    }

    await mkdir(runRoot, { recursive: true });
    await writeFile(
      resolve(projectRoot, tsconfigPath),
      `${JSON.stringify({ extends: "../../tsconfig.json" }, null, 2)}\n`,
      "utf8",
    );

    state.runs[runId] = {
      pid,
      artifacts: [join(runtimeDirectoryName, runId).split(sep).join("/")],
    };
    await writeState(statePath, state);
  });

  return {
    runId,
    mode,
    port,
    distDir,
    tsconfigPath,
    projectRoot,
  };
}

export async function releaseHarnessRuntime(runtime) {
  const runtimeRoot = join(runtime.projectRoot, runtimeDirectoryName);
  const statePath = join(runtimeRoot, stateFilename);

  await withCoordinatorLock(runtimeRoot, async () => {
    const loadedState = await readState(statePath);
    if (!loadedState) {
      return;
    }

    const state = pruneRuns(loadedState);
    const currentRun = state.runs[runtime.runId];
    if (currentRun) {
      state.retiredArtifacts.push(...currentRun.artifacts);
      delete state.runs[runtime.runId];
    }

    if (Object.keys(state.runs).length === 0) {
      await restoreNextEnv(runtime.projectRoot, state.originalNextEnv);
      await removeArtifacts(runtime.projectRoot, state.retiredArtifacts);
      await rm(statePath, { force: true });
    } else {
      await writeState(statePath, state);
    }
  });

  try {
    const remaining = await readdir(runtimeRoot);
    if (remaining.length === 0) {
      await rm(runtimeRoot, { force: true, recursive: true });
    }
  } catch (error) {
    if (!error || typeof error !== "object" || error.code !== "ENOENT") {
      throw error;
    }
  }
}

function signalExitCode(signal) {
  if (signal === "SIGINT") return 130;
  if (signal === "SIGHUP") return 129;
  return 143;
}

export async function runOwnedCommand(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: "inherit",
    detached: process.platform !== "win32",
  });
  let receivedSignal = null;

  const forwardSignal = (signal) => {
    receivedSignal = signal;
    if (child.pid && process.platform !== "win32") {
      try {
        process.kill(-child.pid, signal);
      } catch (error) {
        if (!error || typeof error !== "object" || error.code !== "ESRCH") {
          throw error;
        }
      }
    } else {
      child.kill(signal);
    }
  };

  const signalHandlers = new Map(
    ["SIGHUP", "SIGINT", "SIGTERM"].map((signal) => [
      signal,
      () => forwardSignal(signal),
    ]),
  );
  for (const [signal, handler] of signalHandlers) {
    process.on(signal, handler);
  }

  try {
    const result = await new Promise((resolveResult, reject) => {
      child.once("error", reject);
      child.once("close", (code, signal) => resolveResult({ code, signal }));
    });

    if (receivedSignal) {
      return signalExitCode(receivedSignal);
    }
    if (result.signal) {
      return signalExitCode(result.signal);
    }
    return result.code ?? 1;
  } finally {
    for (const [signal, handler] of signalHandlers) {
      process.removeListener(signal, handler);
    }
  }
}

export function createHarnessEnvironment(runtime, source = process.env) {
  const environment = {
    ...source,
    HARNESS: "1",
    PORT: runtime.port,
    PORTFOLIO_HARNESS_RUN_ID: runtime.runId,
    PORTFOLIO_HARNESS_DIST_DIR: runtime.distDir,
    PORTFOLIO_HARNESS_TSCONFIG: runtime.tsconfigPath,
    PORTFOLIO_HARNESS_SERVER_MODE: runtime.mode,
  };
  delete environment.BASE_URL;
  delete environment.PLAYWRIGHT_REUSE_EXISTING_SERVER;
  return environment;
}

export function npmExecutable() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

export function runtimeLabel(runtime) {
  return `${basename(runtime.distDir)} (${runtime.runId})`;
}
