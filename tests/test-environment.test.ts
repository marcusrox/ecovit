import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename, dirname, resolve, delimiter } from "node:path";
import { createServer } from "node:net";
import { afterEach, expect, test, vi } from "vitest";
import {
  loadTestEnvironment,
  validateTestDatabaseUrl,
} from "../scripts/load-test-env";
import {
  assertFreePorts,
  main,
  postgresBin,
} from "../scripts/test-environment";

const execute = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", () => ({ execFileSync: execute }));
const temporaryDirectories: string[] = [];
function temporaryDirectory() {
  const directory = mkdtempSync(join(tmpdir(), "ecovit-test-env-"));
  temporaryDirectories.push(directory);
  return directory;
}
afterEach(() => {
  vi.unstubAllEnvs();
  execute.mockReset();
  for (const directory of temporaryDirectories.splice(0)) {
    if (
      dirname(resolve(directory)) !== resolve(tmpdir()) ||
      !basename(directory).startsWith("ecovit-test-env-")
    )
      throw new Error("Diretório temporário inesperado; limpeza recusada.");
    rmSync(directory, { recursive: true });
  }
});

test("configuração privada mantém a precedência do ambiente e não carrega .env", () => {
  const directory = temporaryDirectory();
  writeFileSync(join(directory, ".env"), "DATABASE_URL=producao\n");
  writeFileSync(
    join(directory, ".env.test"),
    'M12_TEST_DATABASE_URL="postgresql://test@localhost/ecovit_test"\nECOVIT_TEST_PG_BIN=/bin/test\n',
  );
  const environment: NodeJS.ProcessEnv = {
    M12_TEST_DATABASE_URL: "postgresql://ci@localhost/ecovit_test",
  };
  loadTestEnvironment(join(directory, ".env.test"), environment);
  expect(environment).toEqual({
    M12_TEST_DATABASE_URL: "postgresql://ci@localhost/ecovit_test",
    ECOVIT_TEST_PG_BIN: "/bin/test",
  });
  expect(environment.DATABASE_URL).toBeUndefined();
  loadTestEnvironment(join(directory, "missing"), environment);
  expect(environment.M12_TEST_DATABASE_URL).toContain("ci@");
});

test("conexão explicitamente vazia é recusada antes de provisionar", async () => {
  vi.stubEnv("M12_TEST_DATABASE_URL", "");
  await expect(main(["prepare"])).rejects.toThrow(
    /banco PostgreSQL isolado chamado ecovit_test/,
  );
  expect(execute).not.toHaveBeenCalled();
});

test("descoberta ignora outra versão no PATH e respeita diretório explícito inválido", () => {
  const directory = temporaryDirectory();
  const older = join(directory, "16"),
    supported = join(directory, "18");
  for (const bin of [older, supported]) {
    mkdirSync(bin);
    for (const name of ["postgres", "initdb", "pg_ctl"])
      writeFileSync(
        join(bin, name + (process.platform === "win32" ? ".exe" : "")),
        "",
      );
  }
  vi.stubEnv("ECOVIT_TEST_PG_BIN", undefined);
  vi.stubEnv("PATH", [older, supported].join(delimiter));
  execute.mockImplementation((file: string) =>
    file.startsWith(older)
      ? "postgres (PostgreSQL) 16.9"
      : "postgres (PostgreSQL) 18.6",
  );
  expect(postgresBin()).toBe(supported);
  vi.stubEnv("ECOVIT_TEST_PG_BIN", older);
  expect(() => postgresBin()).toThrow(/ECOVIT_TEST_PG_BIN/);
  vi.stubEnv("ECOVIT_TEST_PG_BIN", join(directory, "missing"));
  expect(() => postgresBin()).toThrow(/ECOVIT_TEST_PG_BIN/);
});

test("banco de testes exige nome exato e não revela credenciais na recusa", () => {
  for (const url of [
    undefined,
    "",
    "https://localhost/ecovit_test",
    "postgresql://user:segredo@localhost/ecovit?x=ecovit_test",
    "postgresql://user:segredo@localhost/ecovit_test_extra",
    "postgresql://user:segredo@localhost/ecovit_test/outro",
  ]) {
    expect(() => validateTestDatabaseUrl(url)).toThrow(
      /banco PostgreSQL isolado chamado ecovit_test/,
    );
    try {
      validateTestDatabaseUrl(url);
    } catch (error) {
      expect((error as Error).message).not.toContain("segredo");
    }
  }
  expect(
    validateTestDatabaseUrl("postgresql://test@127.0.0.1:55432/ecovit_test"),
  ).toContain("/ecovit_test");
});

test("porta ocupada é diagnosticada sem encerrar o serviço existente", async () => {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Porta ausente");
  try {
    await expect(assertFreePorts([address.port])).rejects.toThrow(
      /nenhum processo foi encerrado/,
    );
    expect(server.listening).toBe(true);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
  await expect(assertFreePorts([address.port])).resolves.toBeUndefined();
});
