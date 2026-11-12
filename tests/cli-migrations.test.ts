import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
let directory: string;
const cli = path.resolve("server/cli.ts");
const loader = import.meta.resolve("tsx");
beforeAll(async () => {
  await mkdir(".tools/t017-cli", { recursive: true });
  directory = await mkdtemp(path.resolve(".tools/t017-cli/run-"));
});
afterAll(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("migration CLI protected configuration", () => {
  it.each([
    undefined,
    "",
    "not-a-url",
    "postgresql://ecovit:secret@127.0.0.1/ecovit",
    "postgresql://ecovit_owner:CHANGE_ME@127.0.0.1/ecovit",
  ])(
    "rejects missing or invalid owner connection %j without runtime fallback",
    async (value) => {
      const marker = "never-log-this-runtime-secret";
      await writeFile(
        path.join(directory, ".env"),
        `DATABASE_URL=postgresql://ecovit:${marker}@127.0.0.1/ecovit\n${value === undefined ? "" : `DATABASE_MIGRATION_URL=${value}\n`}`,
      );
      const result = spawnSync(
        process.execPath,
        ["--import", loader, cli, "migrate"],
        { cwd: directory, encoding: "utf8" },
      );
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("DATABASE_MIGRATION_URL");
      expect(result.stderr).not.toContain(marker);
      expect(result.stderr).not.toContain("postgresql://");
      expect(result.stdout).not.toContain("Operação concluída");
    },
  );

  it("fails safely when the existing env file cannot be read", async () => {
    await rm(path.join(directory, ".env"));
    const result = spawnSync(
      process.execPath,
      ["--import", loader, cli, "migrate"],
      { cwd: directory, encoding: "utf8" },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Confira o .env");
    expect(result.stderr).not.toContain("Error:");
  });
});
