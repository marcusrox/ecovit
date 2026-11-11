import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
  appendFileSync,
  openSync,
  closeSync,
} from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool } from "pg";
import { loadTestEnvironment, validateTestDatabaseUrl } from "./load-test-env";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = path.join(root, ".tools/test-environment");
const data = path.join(directory, "pgdata");
const marker = path.join(directory, "managed.json");
const envFile = path.join(root, ".env.test");
const port = 55432;
const localUrl = `postgresql://ecovit_test@127.0.0.1:${port}/ecovit_test`;

export async function assertFreePorts(ports = [5174, 3002]) {
  for (const number of ports) {
    await new Promise<void>((resolve, reject) => {
      const server = createServer();
      server.once("error", () =>
        reject(
          new Error(
            `Porta ${number} indisponível. Identifique a instância; nenhum processo foi encerrado.`,
          ),
        ),
      );
      server.listen(number, "127.0.0.1", () => server.close(() => resolve()));
    });
  }
}

export function postgresBin() {
  const explicit = process.env.ECOVIT_TEST_PG_BIN;
  const candidates =
    explicit !== undefined
      ? [explicit]
      : [
          ...(process.env.PATH ?? "").split(path.delimiter),
          path.join(
            process.env.ProgramFiles ?? "C:/Program Files",
            "PostgreSQL/18/bin",
          ),
          "/usr/lib/postgresql/18/bin",
          "/opt/homebrew/opt/postgresql@18/bin",
          "/usr/local/opt/postgresql@18/bin",
        ];
  for (const candidate of new Set(candidates)) {
    if (
      !candidate ||
      !["initdb", "pg_ctl", "postgres"].every((name) =>
        existsSync(
          path.join(
            candidate,
            name + (process.platform === "win32" ? ".exe" : ""),
          ),
        ),
      )
    )
      continue;
    try {
      const version = execFileSync(
        path.join(
          candidate,
          "postgres" + (process.platform === "win32" ? ".exe" : ""),
        ),
        ["--version"],
        { encoding: "utf8", windowsHide: true, timeout: 5000, stdio: "pipe" },
      );
      if (/\b18\./.test(version)) return path.resolve(candidate);
    } catch {
      /* Continue only within the selected search paths. */
    }
  }
  throw new Error(
    explicit !== undefined
      ? "ECOVIT_TEST_PG_BIN não contém binários utilizáveis do PostgreSQL 18. Corrija o diretório informado."
      : "PostgreSQL 18 não encontrado. Instale-o ou defina ECOVIT_TEST_PG_BIN com o diretório bin.",
  );
}

function run(bin: string, command: string, args: string[]) {
  const log = openSync(path.join(directory, "setup.log"), "a");
  try {
    const output = execFileSync(
      path.join(bin, command + (process.platform === "win32" ? ".exe" : "")),
      args,
      {
        encoding: "utf8",
        timeout: 30000,
        windowsHide: true,
        // A Windows postgres child may inherit pipe handles from pg_ctl.
        // File descriptors keep startup bounded after pg_ctl itself exits.
        stdio: command === "postgres" ? "pipe" : ["ignore", log, log],
      },
    );
    if (output) appendFileSync(path.join(directory, "setup.log"), output);
    return output ?? "";
  } catch (error) {
    const result = error as { stdout?: string; stderr?: string };
    appendFileSync(
      path.join(directory, "setup.log"),
      String(result.stdout ?? "") + String(result.stderr ?? ""),
    );
    throw new Error(
      `Falha em ${command}. Consulte .tools/test-environment/setup.log; nenhuma configuração pessoal foi alterada.`,
    );
  } finally {
    closeSync(log);
  }
}

async function withDatabase<T>(
  url: string,
  operation: (pool: Pool) => Promise<T>,
) {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: validateTestDatabaseUrl(url),
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
  });
  try {
    return await operation(pool);
  } finally {
    await pool.end();
  }
}

async function verifyDatabase(url: string) {
  try {
    await withDatabase(url, async (pool) => {
      const { rows } = await pool.query(
        "SELECT current_database() AS name, current_setting('server_version_num')::int AS version, current_setting('server_encoding') AS encoding, has_database_privilege(current_user, current_database(), 'CREATE') AS can_create",
      );
      if (
        rows[0].name !== "ecovit_test" ||
        rows[0].version < 180000 ||
        rows[0].version >= 190000 ||
        rows[0].encoding !== "UTF8" ||
        !rows[0].can_create
      )
        throw new Error();
    });
  } catch {
    throw new Error(
      "Banco de testes indisponível ou incompatível. Exige PostgreSQL 18, UTF8 e permissão CREATE no ecovit_test. Confira .env.test; execute npm run test:env para iniciar o banco gerenciado.",
    );
  }
}

function managedBin() {
  if (!existsSync(marker))
    throw new Error(
      "Cluster sem identificação gerenciada; nenhum servidor será alterado.",
    );
  let managed: Record<string, unknown> | null;
  try {
    managed = JSON.parse(readFileSync(marker, "utf8"));
  } catch {
    throw new Error(
      "Identificação do cluster ilegível; nenhum servidor será alterado.",
    );
  }
  if (
    !managed ||
    typeof managed !== "object" ||
    managed.version !== 1 ||
    managed.data !== data ||
    managed.port !== port ||
    managed.url !== localUrl ||
    typeof managed.bin !== "string"
  )
    throw new Error(
      "Identificação do cluster divergente; nenhum servidor será alterado.",
    );
  if (existsSync(data) && realpathSync(data) !== path.resolve(data))
    throw new Error(
      "Diretório gerenciado redirecionado; nenhum servidor será alterado.",
    );
  return managed.bin;
}

async function verifyManagedServer() {
  await withDatabase(localUrl, async (pool) => {
    const { rows } = await pool.query(
      "SELECT current_setting('data_directory') AS directory",
    );
    if (realpathSync(rows[0].directory) !== realpathSync(data))
      throw new Error(
        "A porta do banco pertence a outra instância; nenhum servidor será alterado.",
      );
  });
}

function managedRunning(bin: string) {
  try {
    execFileSync(
      path.join(bin, "pg_ctl" + (process.platform === "win32" ? ".exe" : "")),
      ["status", "-D", data],
      { stdio: "pipe", windowsHide: true, timeout: 5000 },
    );
    return true;
  } catch (error) {
    if ((error as { status?: number }).status === 3) return false;
    throw new Error(
      "Não foi possível conferir o estado do cluster gerenciado. Confira permissões e PostgreSQL; nenhum processo foi encerrado.",
    );
  }
}

async function prepareLocalDatabase() {
  mkdirSync(directory, { recursive: true });
  const bin = existsSync(marker) ? managedBin() : postgresBin();
  if (!/\b18\./.test(run(bin, "postgres", ["--version"])))
    throw new Error("O provisionamento local exige PostgreSQL 18.");
  if (!existsSync(marker)) {
    if (existsSync(data))
      throw new Error(
        "Diretório pgdata existente sem identificação. Inspecione-o antes de preparar; nada foi apagado.",
      );
    writeFileSync(
      marker,
      JSON.stringify({ version: 1, data, port, url: localUrl, bin }, null, 2),
      { flag: "wx" },
    );
    run(bin, "initdb", [
      "-D",
      data,
      "-U",
      "ecovit_test",
      "-A",
      "trust",
      "--no-locale",
      "--encoding=UTF8",
    ]);
  }
  if (!existsSync(path.join(data, "PG_VERSION")))
    throw new Error(
      "Inicialização do cluster incompleta. Consulte setup.log e inspecione o diretório; nada foi apagado.",
    );
  if (!managedRunning(bin)) {
    await assertFreePorts([port]);
    run(bin, "pg_ctl", [
      "start",
      "-D",
      data,
      "-l",
      path.join(directory, "postgres.log"),
      "-o",
      `-h 127.0.0.1 -p ${port}`,
      "-w",
      "-t",
      "15",
    ]);
  }
  // Connect to the maintenance database only for our own identified cluster.
  const maintenanceUrl = new URL(localUrl);
  maintenanceUrl.pathname = "/postgres";
  const { Pool } = await import("pg");
  const admin = new Pool({
    connectionString: maintenanceUrl.toString(),
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
  });
  try {
    const { rows } = await admin.query(
      "SELECT current_setting('data_directory') AS directory",
    );
    if (realpathSync(rows[0].directory) !== realpathSync(data))
      throw new Error("Instância divergente; banco não será criado.");
    const database = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = 'ecovit_test'",
    );
    if (!database.rowCount)
      await admin.query(
        "CREATE DATABASE ecovit_test TEMPLATE template0 ENCODING 'UTF8'",
      );
  } finally {
    await admin.end();
  }
  if (process.env.M12_TEST_DATABASE_URL === undefined) {
    appendFileSync(
      envFile,
      `\n# Banco local descartável preparado por npm run test:env\nM12_TEST_DATABASE_URL=${localUrl}\n`,
      { mode: 0o600 },
    );
    process.env.M12_TEST_DATABASE_URL = localUrl;
  }
}

async function stopManagedDatabase() {
  if (!existsSync(marker)) {
    console.log("Nenhum cluster gerenciado para encerrar.");
    return;
  }
  const bin = managedBin();
  if (!managedRunning(bin)) {
    console.log("Cluster gerenciado já está parado.");
    return;
  }
  await assertFreePorts();
  await verifyManagedServer();
  run(bin, "pg_ctl", ["stop", "-D", data, "-m", "fast", "-w", "-t", "15"]);
  console.log("Cluster gerenciado encerrado; dados locais preservados.");
}

export async function main(args = process.argv.slice(2)) {
  const [mode = "prepare", ...options] = args;
  if (
    !["prepare", "check", "stop"].includes(mode) ||
    options.some((arg) => arg !== "--edge")
  )
    throw new Error(
      "Uso: test:env [--edge], test:env:check [--edge] ou test:env:stop.",
    );
  if (process.versions.node.split(".")[0] !== "24")
    throw new Error("Use Node.js 24 para preparar os testes.");
  // Stopping our identified cluster does not depend on unrelated .env.test values.
  if (mode !== "stop") loadTestEnvironment();
  if (process.env.NODE_ENV === "production")
    throw new Error("Preparação de testes bloqueada em produção.");
  process.chdir(root);
  if (mode === "stop") return stopManagedDatabase();
  if (!existsSync(path.join(root, "node_modules/@playwright/test/cli.js")))
    throw new Error(
      "Dependências ausentes. Execute npm ci antes de preparar os testes.",
    );
  let url = process.env.M12_TEST_DATABASE_URL;
  if (url !== undefined) url = validateTestDatabaseUrl(url);
  await assertFreePorts();
  if (
    mode === "prepare" &&
    (url === undefined || (url === localUrl && existsSync(marker)))
  ) {
    await prepareLocalDatabase();
    url = localUrl;
  }
  await verifyDatabase(validateTestDatabaseUrl(url));
  const { chromium } = await import("@playwright/test");
  for (const channel of options.includes("--edge")
    ? ["chrome", "msedge"]
    : ["chrome"]) {
    try {
      const browser = await chromium.launch({ channel, headless: true });
      await browser.close();
    } catch {
      throw new Error(
        `Não foi possível iniciar ${channel}. Confira instalação e permissões do navegador; nenhum download foi iniciado.`,
      );
    }
  }
  console.log(
    `Ambiente pronto: Node 24, PostgreSQL 18/ecovit_test, portas 5174/3002 livres e ${options.includes("--edge") ? "Chrome/Edge" : "Chrome"}.`,
  );
  console.log(
    "Execute os testes por finalidade. O servidor 5174 pertence ao runner; 5173 permanece reservada ao solicitante.",
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    // Deliberately omit stacks and connection strings from diagnostics.
    console.error(
      error instanceof Error
        ? error.message
        : "Falha na preparação do ambiente de testes.",
    );
    process.exitCode = 1;
  });
}
