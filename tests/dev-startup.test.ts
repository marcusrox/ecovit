import { afterAll, beforeAll, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

let directory: string;
const launcher = path.resolve("scripts/dev.mjs");
const secret = "never-print-local-credentials";
beforeAll(async () => {
  await mkdir(".tools/dev-startup", { recursive: true });
  directory = await mkdtemp(path.resolve(".tools/dev-startup/run-"));
  // Intercept only child creation in a separate Node process. Exercise the real
  // launcher without reading the application's .env, connecting to DB or ports.
  await writeFile(
    path.join(directory, "processes.mjs"),
    `
import children from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { appendFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
const record = (kind, args, options) => appendFileSync('calls.jsonl', JSON.stringify({ kind, args, stdio: options?.stdio, nodeEnv: options?.env?.NODE_ENV, proxy: options?.env?.API_PROXY })+'\\n');
children.spawnSync = (_command, args, options) => {
  record('migration', args, options);
  switch (process.env.DEV_STARTUP_RESULT) {
    case 'error': return { status: null, error: new Error('spawn failed') };
    case 'signal': return { status: null, signal: 'SIGTERM' };
    case 'failure': console.error('Falha dirigida da CLI.'); return { status: 1 };
    default: return { status: 0 };
  }
};
let started = 0;
children.spawn = (_command, args, options) => {
  record('service', args, options);
  const child = new EventEmitter();
  child.kill = () => true;
  if (++started === (process.argv.includes('--api-only') ? 1 : 2))
    process.nextTick(() => child.emit('exit', 0));
  return child;
};
syncBuiltinESMExports();
`,
  );
});
afterAll(async () => {
  // The temporary directory was created inside this test's fixed workspace root.
  const root = path.resolve(".tools/dev-startup") + path.sep;
  if (!directory.startsWith(root)) throw new Error("Unexpected test directory");
  await rm(directory, { recursive: true, force: true });
});
type Call = {
  kind: string;
  args: string[];
  stdio: string;
  nodeEnv?: string;
  proxy?: string;
};
async function run(result: string, apiOnly = false, envFile = true) {
  const cwd = await mkdtemp(path.join(directory, "case-"));
  if (envFile)
    await writeFile(
      path.join(cwd, ".env"),
      `DATABASE_URL=${secret}\nDATABASE_MIGRATION_URL=${secret}\n`,
    );
  const child = spawnSync(
    process.execPath,
    [
      "--import",
      pathToFileURL(path.join(directory, "processes.mjs")).href,
      launcher,
      ...(apiOnly ? ["--api-only"] : []),
    ],
    {
      cwd,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        DEV_STARTUP_RESULT: result,
        API_PORT: "3009",
        API_PROXY: "",
      },
    },
  );
  const calls: Call[] = existsSync(path.join(cwd, "calls.jsonl"))
    ? (await readFile(path.join(cwd, "calls.jsonl"), "utf8"))
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line))
    : [];
  expect(child.error).toBeUndefined();
  expect(child.stderr + child.stdout).not.toContain(secret);
  return { ...child, calls };
}
it.each([false, true])(
  "migrations precede services; API-only=%s",
  async (apiOnly) => {
    const result = await run("success", apiOnly);
    expect(result.status).toBe(0);
    expect(result.calls.map((call) => call.kind)).toEqual(
      apiOnly ? ["migration", "service"] : ["migration", "service", "service"],
    );
    expect(result.calls[0].args).toEqual([
      "--import",
      "tsx",
      "server/cli.ts",
      "migrate",
    ]);
    expect(result.calls[0].stdio).toBe("inherit");
    expect(result.calls[1]).toMatchObject({
      args: [
        "--watch",
        "--watch-preserve-output",
        "--import",
        "tsx",
        "server/main.ts",
      ],
      nodeEnv: "development",
    });
    if (!apiOnly)
      expect(result.calls[2].args).toEqual([
        "node_modules/vite/bin/vite.js",
        "--host",
        "127.0.0.1",
        "--port",
        "5173",
        "--strictPort",
      ]);
  },
);
it.each(["failure", "signal", "error"])(
  "migration %s prevents every service from starting",
  async (failure) => {
    const result = await run(failure);
    expect(result.status).toBe(1);
    expect(result.calls.map((call) => call.kind)).toEqual(["migration"]);
    expect(result.stderr).toContain("Inicialização interrompida");
    expect(result.stderr).toContain("DATABASE_MIGRATION_URL");
    expect(result.stderr).not.toContain("Error:");
    if (failure === "failure")
      expect(result.stderr).toContain("Falha dirigida da CLI.");
  },
);
it("missing .env stops before migration or services", async () => {
  const result = await run("success", false, false);
  expect(result.status).toBe(1);
  expect(result.calls).toEqual([]);
  expect(result.stderr).toContain("Crie .env");
  expect(result.stderr).not.toContain("Error:");
});
