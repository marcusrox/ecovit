import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { randomUUID } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { parseEnv } from "node:util";
import { Client } from "pg";
import { createServer } from "node:net";
import { setupLocal } from "../server/setup-local";

const connection = process.env.ECOVIT_SETUP_TEST_ADMIN_URL;

// This suite creates/drops the fixed setup resources, exclusively in a cluster
// marked ecovit_setup_tests. It never targets the developer's default instance.
describe.skipIf(!connection)("local database setup", () => {
  const url = new URL(
    connection ?? "postgresql://postgres@127.0.0.1:55437/postgres",
  );
  const admin = new Client({ connectionString: connection });
  let directory: string;
  let messages: string[];
  let verifiedCluster = false;

  async function reset() {
    if (!verifiedCluster) throw new Error("Isolated cluster was not verified.");
    await admin.query("DROP DATABASE IF EXISTS ecovit WITH (FORCE)");
    await admin.query("DROP ROLE IF EXISTS ecovit");
    await admin.query("DROP ROLE IF EXISTS ecovit_owner");
  }

  function options() {
    return {
      directory,
      host: url.hostname,
      port: Number(url.port),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      secret: async () => {
        throw new Error("Unexpected password prompt");
      },
      report: (message: string) => messages.push(message),
    };
  }

  async function configureEnv(extra = "") {
    const template = await readFile(".env.example", "utf8");
    const configured = template.replace(":5432/ecovit", `:${url.port}/ecovit`);
    await writeFile(path.join(directory, ".env.example"), configured + extra);
  }

  async function env() {
    return await readFile(path.join(directory, ".env"), "utf8");
  }

  beforeAll(async () => {
    if (url.port === "5432" || url.pathname !== "/postgres")
      throw new Error("Use a dedicated PostgreSQL test cluster and port.");
    await admin.connect();
    const cluster = await admin.query("SHOW cluster_name");
    if (cluster.rows[0].cluster_name !== "ecovit_setup_tests")
      throw new Error("The cluster must be marked ecovit_setup_tests.");
    verifiedCluster = true;
    await mkdir(".tools/t007-tests", { recursive: true });
  });

  beforeEach(async () => {
    await reset();
    directory = await mkdtemp(path.resolve(".tools/t007-tests/run-"));
    await copyFile(".env.example", path.join(directory, ".env.example"));
    await configureEnv();
    messages = [];
  });

  afterAll(async () => {
    if (verifiedCluster) await reset();
    await admin.end();
  });

  it("creates the database, migrates as owner, and verifies API privileges", async () => {
    await setupLocal(options());
    const text = await env();
    const runtime = parseEnv(text).DATABASE_URL!;
    const api = new Client({ connectionString: runtime });
    try {
      await api.connect();
      const owner =
        await api.query(`SELECT pg_get_userbyid(relowner) AS owner FROM pg_class
        WHERE oid='ecovit_accounts'::regclass`);
      expect(owner.rows[0].owner).toBe("ecovit_owner");
      expect(
        (await api.query("SELECT count(*)::int AS count FROM ecovit_accounts"))
          .rows[0].count,
      ).toBe(0);
      for (const sql of [
        "SELECT * FROM ecovit_migrations",
        "CREATE TABLE forbidden(id int)",
        "CREATE SCHEMA forbidden",
      ]) {
        await expect(api.query(sql)).rejects.toMatchObject({ code: "42501" });
      }
      await api.query("BEGIN");
      const id = randomUUID();
      await api.query("INSERT INTO ecovit_accounts(id,email) VALUES($1,$2)", [
        id,
        "setup-test@example.invalid",
      ]);
      await api.query("UPDATE ecovit_accounts SET email=email WHERE id=$1", [
        id,
      ]);
      await api.query("DELETE FROM ecovit_accounts WHERE id=$1", [id]);
      await api.query("ROLLBACK");
      expect(messages.join(" ")).not.toContain(new URL(runtime).password);
      expect(text).not.toContain(options().password);
      expect(parseEnv(text).DATABASE_MIGRATION_URL).toBeUndefined();
    } finally {
      await api.end();
    }
  });

  it("preserves existing data, role passwords, comments and unrelated env values on rerun", async () => {
    await configureEnv("\n# preserve this comment\nOTHER_VALUE='a # b'\n");
    const template = await readFile(
      path.join(directory, ".env.example"),
      "utf8",
    );
    await writeFile(
      path.join(directory, ".env"),
      template.replace(/(DATABASE_URL=.*)/, "$1 # local database"),
    );
    await setupLocal(options());
    const initial = await env();
    const passwords = await admin.query(
      "SELECT rolname,rolpassword FROM pg_authid WHERE rolname IN ('ecovit','ecovit_owner') ORDER BY rolname",
    );
    const api = new Client({
      connectionString: parseEnv(initial).DATABASE_URL,
    });
    try {
      await api.connect();
      const id = randomUUID();
      await api.query("INSERT INTO ecovit_accounts(id,email) VALUES($1,$2)", [
        id,
        "preserved@example.invalid",
      ]);
      await setupLocal(options());
      expect(await env()).toBe(initial);
      expect(initial).toContain("# local database");
      expect(initial).toContain("OTHER_VALUE='a # b'");
      expect(
        (await api.query("SELECT id FROM ecovit_accounts WHERE id=$1", [id]))
          .rowCount,
      ).toBe(1);
      expect(
        (
          await admin.query(
            "SELECT rolname,rolpassword FROM pg_authid WHERE rolname IN ('ecovit','ecovit_owner') ORDER BY rolname",
          )
        ).rows,
      ).toEqual(passwords.rows);
    } finally {
      await api.end();
    }
  });

  it("resumes after roles and env were created but the database was not", async () => {
    await setupLocal(options());
    const initial = await env();
    const passwords = await admin.query(
      "SELECT rolname,rolpassword FROM pg_authid WHERE rolname IN ('ecovit','ecovit_owner') ORDER BY rolname",
    );
    await admin.query("DROP DATABASE ecovit WITH (FORCE)");
    await setupLocal(options());
    expect(await env()).toBe(initial);
    expect(
      (
        await admin.query(
          "SELECT rolname,rolpassword FROM pg_authid WHERE rolname IN ('ecovit','ecovit_owner') ORDER BY rolname",
        )
      ).rows,
    ).toEqual(passwords.rows);
  });

  it("resumes when an empty database exists before migration", async () => {
    await admin.query(
      "CREATE ROLE ecovit_owner LOGIN PASSWORD 'unused-fixture-owner'",
    );
    await admin.query(
      "CREATE DATABASE ecovit OWNER ecovit_owner ENCODING 'UTF8' TEMPLATE template0",
    );
    await setupLocal(options());
    expect(messages.at(-1)).toContain("Setup local concluído");
  });

  it("rejects a configured foreign destination before changing files or roles", async () => {
    const text =
      "# preserve\nDATABASE_URL=postgresql://ecovit:secret@192.0.2.1:5432/ecovit\n";
    await writeFile(path.join(directory, ".env"), text);
    await expect(setupLocal(options())).rejects.toThrow(/local|destino/);
    expect(await env()).toBe(text);
    expect(
      (await admin.query("SELECT 1 FROM pg_roles WHERE rolname='ecovit'"))
        .rowCount,
    ).toBe(0);
  });

  it("rejects database ownership and privileged role conflicts", async () => {
    await admin.query("CREATE DATABASE ecovit");
    await expect(setupLocal(options())).rejects.toThrow(/incompatível/);
    await admin.query("DROP DATABASE ecovit");
    await admin.query("CREATE ROLE ecovit LOGIN SUPERUSER");
    await expect(setupLocal(options())).rejects.toThrow(
      /atributos incompatíveis/,
    );
    expect(messages).toHaveLength(0);
  });

  it("rejects duplicate configuration, remote hosts, and invalid ports", async () => {
    await writeFile(
      path.join(directory, ".env"),
      "DATABASE_URL=one\nDATABASE_URL=two\n",
    );
    await expect(setupLocal(options())).rejects.toThrow(/duplicada/);
    await expect(
      setupLocal({ ...options(), host: "192.0.2.1" }),
    ).rejects.toThrow(/instância local/);
    await expect(setupLocal({ ...options(), port: 0 })).rejects.toThrow(
      /porta/,
    );
  });

  it("reports authentication failures without logging or saving administrative secrets", async () => {
    const password = "deliberately-invalid-secret";
    await expect(setupLocal({ ...options(), password })).rejects.toThrow(
      /Autenticação recusada/,
    );
    expect(messages.join(" ")).not.toContain(password);
    await expect(env()).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects concurrent setup before any mutation", async () => {
    await admin.query("SELECT pg_advisory_lock(72121)");
    try {
      await expect(setupLocal(options())).rejects.toThrow(/Outro setup/);
      await expect(env()).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await admin.query("SELECT pg_advisory_unlock(72121)");
    }
  });

  it("requests an existing API password without changing it", async () => {
    await setupLocal(options());
    const initial = await env();
    const password = decodeURIComponent(
      new URL(parseEnv(initial).DATABASE_URL!).password,
    );
    await writeFile(
      path.join(directory, ".env"),
      initial.replace(
        parseEnv(initial).DATABASE_URL!,
        `postgresql://ecovit:CHANGE_ME@127.0.0.1:${url.port}/ecovit`,
      ),
    );
    const secret = vi.fn(async () => password);
    await setupLocal({ ...options(), secret });
    expect(secret).toHaveBeenCalledTimes(1);
    expect(await env()).toBe(initial);
  });

  it("rejects unavailable PostgreSQL before creating the env file", async () => {
    const socket = createServer();
    await new Promise<void>((resolve) =>
      socket.listen(0, "127.0.0.1", resolve),
    );
    const address = socket.address();
    if (!address || typeof address === "string")
      throw new Error("Missing local port");
    await new Promise<void>((resolve) => socket.close(() => resolve()));
    await expect(
      setupLocal({ ...options(), port: address.port }),
    ).rejects.toThrow(/recusou a conexão/);
    await expect(env()).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects an unsupported PostgreSQL version before mutation", async () => {
    // Exercise the version boundary while keeping the remainder on the real cluster.
    const query = Client.prototype.query;
    const spy = vi
      .spyOn(Client.prototype, "query")
      .mockImplementation(function (this: Client, ...args: unknown[]) {
        if (args[0] === "SHOW server_version_num")
          return Promise.resolve({
            rows: [{ server_version_num: "170000" }],
          });
        return Reflect.apply(query, this, args);
      });
    try {
      await expect(setupLocal(options())).rejects.toThrow(/linha 18/);
      await expect(env()).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      spy.mockRestore();
    }
  });

  it("preserves an incompatible database's existing tables", async () => {
    await admin.query("CREATE ROLE ecovit_owner LOGIN");
    await admin.query(
      "CREATE DATABASE ecovit OWNER ecovit_owner ENCODING 'UTF8' TEMPLATE template0",
    );
    const targetUrl = new URL(connection!);
    targetUrl.pathname = "/ecovit";
    const target = new Client({ connectionString: targetUrl.toString() });
    try {
      await target.connect();
      await target.query("CREATE TABLE unrelated_data(value text)");
      await target.query("INSERT INTO unrelated_data VALUES('preserved')");
      await expect(setupLocal(options())).rejects.toThrow(
        /objetos incompatíveis/,
      );
      expect(
        (await target.query("SELECT value FROM unrelated_data")).rows,
      ).toEqual([{ value: "preserved" }]);
      await expect(env()).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await target.end();
    }
  });

  it("preserves an env edit made while credentials are being requested", async () => {
    await setupLocal(options());
    const initial = await env();
    const runtime = parseEnv(initial).DATABASE_URL!;
    const password = decodeURIComponent(new URL(runtime).password);
    await writeFile(
      path.join(directory, ".env"),
      initial.replace(
        runtime,
        `postgresql://ecovit:CHANGE_ME@127.0.0.1:${url.port}/ecovit`,
      ),
    );
    const secret = async () => {
      await writeFile(
        path.join(directory, ".env"),
        `${await env()}\n# developer edit\n`,
      );
      return password;
    };
    await expect(setupLocal({ ...options(), secret })).rejects.toThrow(
      /mudou durante/,
    );
    expect(await env()).toContain("# developer edit");
    expect(await env()).toContain("CHANGE_ME");
  });

  it("preserves passwords containing percent signs and URL delimiters", async () => {
    const password = "local%password #@/?é";
    const text = `# custom credentials\nDATABASE_URL=postgresql://ecovit:${encodeURIComponent(password)}@127.0.0.1:${url.port}/ecovit\nSESSION_SECRET=preserved-session-secret\n`;
    await writeFile(path.join(directory, ".env"), text);
    await setupLocal(options());
    await setupLocal(options());
    expect(await env()).toBe(text);
  });

  it("generates a private session secret and preserves it on rerun", async () => {
    await setupLocal(options());
    const initial = await env();
    const secret = parseEnv(initial).SESSION_SECRET!;
    expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(secret, "base64url")).toHaveLength(32);
    expect(messages.join(" ")).not.toContain(secret);
    await setupLocal(options());
    expect(await env()).toBe(initial);
  });

  it.each([undefined, "", '""', "''", "  ", '"  "', '"\n \n"'])(
    "fills missing or empty session secret %j while preserving other settings",
    async (value) => {
      const template = await readFile(
        path.join(directory, ".env.example"),
        "utf8",
      );
      const base = template.replace(/^SESSION_SECRET=.*\r?\n?/m, "");
      const source =
        base +
        (value === undefined ? "" : `SESSION_SECRET=${value} # keep comment\n`);
      await writeFile(path.join(directory, ".env"), source);
      await setupLocal(options());
      const text = await env();
      expect(parseEnv(text).SESSION_SECRET).toMatch(/^[A-Za-z0-9_-]{43}$/);
      const expected = parseEnv(base);
      const actual = parseEnv(text);
      delete expected.DATABASE_URL;
      delete actual.DATABASE_URL;
      delete actual.SESSION_SECRET;
      expect(actual).toEqual(expected);
      if (value !== undefined) expect(text).toContain("# keep comment");
      expect(text.match(/^SESSION_SECRET=/gm)).toHaveLength(1);
    },
  );

  it("preserves an existing session secret exactly as configured", async () => {
    const template = await readFile(
      path.join(directory, ".env.example"),
      "utf8",
    );
    const source = template.replace(
      "SESSION_SECRET=",
      'SESSION_SECRET="already configured # preserve" # keep comment',
    );
    await writeFile(path.join(directory, ".env"), source);
    await setupLocal(options());
    expect(await env()).toContain(
      'SESSION_SECRET="already configured # preserve" # keep comment',
    );
  });

  it("preserves multiline values containing apparent setup assignments", async () => {
    const template = await readFile(
      path.join(directory, ".env.example"),
      "utf8",
    );
    const unrelated =
      'NOTES="first line\nDATABASE_URL=example\nSESSION_SECRET=example\nlast line"\n';
    await writeFile(path.join(directory, ".env"), unrelated + template);
    await setupLocal(options());
    const generated = await env();
    expect(generated.startsWith(unrelated)).toBe(true);
    expect(parseEnv(generated).SESSION_SECRET).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const runtime = parseEnv(generated).DATABASE_URL!;
    const formatted = generated.replace(
      `DATABASE_URL=${runtime}`,
      `export DATABASE_URL = "${runtime}" # connection`,
    );
    await writeFile(path.join(directory, ".env"), formatted);
    await setupLocal(options());
    expect(await env()).toBe(formatted);
  });

  it("preserves a UTF-8 BOM, CRLF and comments when filling empty values", async () => {
    const source = `\uFEFFDATABASE_URL=postgresql://ecovit:CHANGE_ME@127.0.0.1:${url.port}/ecovit # database\r\nSESSION_SECRET='' # session\r\nOTHER=value\r\n`;
    await writeFile(path.join(directory, ".env"), source);
    await setupLocal(options());
    const text = await env();
    expect(text.startsWith("\uFEFFDATABASE_URL=")).toBe(true);
    expect(text).toContain(" # database\r\n");
    expect(text).toContain(" # session\r\nOTHER=value\r\n");
    expect(text.match(/DATABASE_URL=/g)).toHaveLength(1);
    expect(parseEnv(text).SESSION_SECRET).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it.each(["column", "constraint"])(
    "rejects an existing table with an incompatible %s without changing data",
    async (kind) => {
      await setupLocal(options());
      const initial = await env();
      const targetUrl = new URL(connection!);
      targetUrl.pathname = "/ecovit";
      const target = new Client({ connectionString: targetUrl.toString() });
      try {
        await target.connect();
        const id = randomUUID();
        await target.query(
          "INSERT INTO ecovit_accounts(id,email) VALUES($1,$2)",
          [id, "keep@example.invalid"],
        );
        if (kind === "column")
          await target.query("ALTER TABLE ecovit_accounts DROP COLUMN state");
        else
          await target.query(
            "ALTER TABLE ecovit_accounts DROP CONSTRAINT ecovit_accounts_email_key",
          );
        await expect(setupLocal(options())).rejects.toThrow(
          /objetos incompatíveis/,
        );
        expect(await env()).toBe(initial);
        expect(
          (
            await target.query("SELECT id FROM ecovit_accounts WHERE id=$1", [
              id,
            ])
          ).rowCount,
        ).toBe(1);
        expect(
          (
            await target.query(
              "SELECT nspname FROM pg_namespace WHERE nspname LIKE 'ecovit_setup_%'",
            )
          ).rowCount,
        ).toBe(0);
      } finally {
        await target.end();
      }
    },
  );

  it("migrates public even when the administrator has a different search path", async () => {
    const password = randomUUID();
    await admin.query(
      `CREATE ROLE ecovit_setup_path_test LOGIN SUPERUSER PASSWORD '${password}'`,
    );
    try {
      await admin.query(
        "ALTER ROLE ecovit_setup_path_test SET search_path=pg_catalog",
      );
      await setupLocal({
        ...options(),
        user: "ecovit_setup_path_test",
        password,
      });
      expect(messages.at(-1)).toContain("Setup local concluído");
      await setupLocal({
        ...options(),
        user: "ecovit_setup_path_test",
        password,
      });
      expect(parseEnv(await env()).DATABASE_URL).not.toContain(password);
    } finally {
      await admin.query("DROP ROLE ecovit_setup_path_test");
    }
  });
});
