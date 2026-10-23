import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  acquireHarnessRuntime,
  createHarnessEnvironment,
  createRunId,
  getPlaywrightArgs,
  releaseHarnessRuntime,
  validateRuntimePath,
} from "./harness-runtime.mjs";

const uuidA = "00000000-0000-4000-8000-000000000001";
const uuidB = "00000000-0000-4000-8000-000000000002";

async function createProject() {
  const projectRoot = await mkdtemp(join(tmpdir(), "portfolio-harness-"));
  await writeFile(join(projectRoot, "next-env.d.ts"), "original next env\n", "utf8");
  await writeFile(join(projectRoot, "tsconfig.json"), "{}\n", "utf8");
  return projectRoot;
}

test("run ids and output paths are unique and constrained", () => {
  const first = createRunId("dev", 42, uuidA);
  const second = createRunId("dev", 42, uuidB);
  assert.notEqual(first, second);
  assert.equal(
    validateRuntimePath("/project", `.next-harness/${first}/output`, first),
    `.next-harness/${first}/output`,
  );
  assert.throws(
    () => validateRuntimePath("/project", "../outside", first),
    /Invalid harness output directory/,
  );
  assert.throws(() => createRunId("preview"), /Unsupported harness server mode/);
});

test("Playwright arguments and the managed environment preserve filters", () => {
  assert.deepEqual(
    getPlaywrightArgs(["node", "script", "tests/e2e/blog.spec.ts", "-g", "article"]),
    ["tests/e2e/blog.spec.ts", "-g", "article"],
  );

  const environment = createHarnessEnvironment(
    {
      port: "43123",
      runId: `dev-42-${uuidA}`,
      distDir: `.next-harness/dev-42-${uuidA}/output`,
      tsconfigPath: `.next-harness/dev-42-${uuidA}/tsconfig.json`,
      mode: "dev",
    },
    {
      BASE_URL: "http://example.test",
      PLAYWRIGHT_REUSE_EXISTING_SERVER: "1",
      KEEP_ME: "yes",
    },
  );

  assert.equal(environment.KEEP_ME, "yes");
  assert.equal(environment.PORT, "43123");
  assert.equal(environment.BASE_URL, undefined);
  assert.equal(environment.PLAYWRIGHT_REUSE_EXISTING_SERVER, undefined);
  assert.equal(
    environment.PORTFOLIO_HARNESS_RUN_ID,
    `dev-42-${uuidA}`,
  );
});

test("overlapping runs retain artifacts until the final owner exits", async () => {
  const projectRoot = await createProject();
  const first = await acquireHarnessRuntime({
    mode: "dev",
    projectRoot,
    uuid: uuidA,
    portAllocator: async () => "43123",
  });
  await writeFile(join(projectRoot, "next-env.d.ts"), "generated next env\n", "utf8");
  const second = await acquireHarnessRuntime({
    mode: "production",
    projectRoot,
    uuid: uuidB,
    portAllocator: async () => "43124",
  });

  assert.notEqual(first.port, second.port);
  await releaseHarnessRuntime(first);
  assert.equal(
    await readFile(join(projectRoot, first.tsconfigPath), "utf8"),
    '{\n  "extends": "../../tsconfig.json"\n}\n',
  );
  assert.equal(await readFile(join(projectRoot, "next-env.d.ts"), "utf8"), "generated next env\n");

  await releaseHarnessRuntime(second);
  assert.equal(await readFile(join(projectRoot, "next-env.d.ts"), "utf8"), "original next env\n");
  await assert.rejects(readFile(join(projectRoot, first.tsconfigPath), "utf8"), {
    code: "ENOENT",
  });
});

test("a new run reclaims artifacts owned by a stale process", async () => {
  const projectRoot = await createProject();
  const stale = await acquireHarnessRuntime({
    mode: "dev",
    projectRoot,
    uuid: uuidA,
    portAllocator: async () => "43123",
  });
  const statePath = join(projectRoot, ".next-harness", "runtime-state.json");
  const state = JSON.parse(await readFile(statePath, "utf8"));
  state.runs[stale.runId].pid = 2_147_483_647;
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");

  const replacement = await acquireHarnessRuntime({
    mode: "dev",
    projectRoot,
    uuid: uuidB,
    portAllocator: async () => "43124",
  });
  await assert.rejects(readFile(join(projectRoot, stale.tsconfigPath), "utf8"), {
    code: "ENOENT",
  });
  await releaseHarnessRuntime(replacement);
});

test("non-browser runs isolate and clean artifacts without allocating a port", async () => {
  const projectRoot = await createProject();
  const runtime = await acquireHarnessRuntime({
    mode: "production",
    projectRoot,
    needsPort: false,
    portAllocator: async () => {
      throw new Error("Non-browser verification must not bind a port");
    },
  });
  try {
    assert.equal(runtime.port, undefined);
    const environment = createHarnessEnvironment(runtime, { PORT: "3000" });
    assert.equal(environment.PORT, undefined);
    assert.equal(environment.PORTFOLIO_HARNESS_DIST_DIR, runtime.distDir);
    assert.equal(
      await readFile(join(projectRoot, runtime.tsconfigPath), "utf8"),
      '{\n  "extends": "../../tsconfig.json"\n}\n',
    );
    await writeFile(join(projectRoot, "next-env.d.ts"), "generated next env\n");
  } finally {
    await releaseHarnessRuntime(runtime);
  }
  assert.equal(await readFile(join(projectRoot, "next-env.d.ts"), "utf8"), "original next env\n");
  await assert.rejects(readFile(join(projectRoot, runtime.tsconfigPath)), { code: "ENOENT" });
});
