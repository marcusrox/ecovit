import { randomBytes } from "node:crypto";
import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { parseEnv } from "node:util";
import { Client, escapeLiteral } from "pg";
import { database, migrate } from "./db";

export class LocalSetupError extends Error {}

function localHost(host: string) {
  if (host === "localhost") return "127.0.0.1";
  if (["127.0.0.1", "::1", "[::1]"].includes(host))
    return host.replace(/^\[|\]$/g, "");
  throw new LocalSetupError(
    "Use uma instância local em 127.0.0.1, localhost ou ::1.",
  );
}

async function readLocalEnv(directory: string) {
  try {
    return await readFile(path.join(directory, ".env"), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw new LocalSetupError(
      "Não foi possível ler o .env. Confira as permissões do arquivo.",
    );
  }
}

type SetupOptions = {
  directory: string;
  host: string;
  port: number;
  user: string;
  password: string;
  secret: (prompt: string) => Promise<string>;
  report: (message: string) => void;
};

export async function setupLocal(options: SetupOptions) {
  let stage = "conferir a configuração local";
  const host = localHost(options.host);
  if (
    !Number.isInteger(options.port) ||
    options.port < 1 ||
    options.port > 65535
  )
    throw new LocalSetupError("Informe uma porta PostgreSQL entre 1 e 65535.");
  const admin = new Client({
    host,
    port: options.port,
    user: options.user,
    password: options.password,
    database: "postgres",
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
  });
  let target: Client | undefined;
  try {
    const original = await readLocalEnv(options.directory);
    const source =
      original ??
      (await readFile(path.join(options.directory, ".env.example"), "utf8"));
    // Consume complete quoted values so their contents cannot become assignments.
    const assignment =
      /^([\uFEFF\t ]*(?:export[\t ]+)?([A-Za-z_]\w*)[\t ]*=[\t ]*)("[^"]*"|'[^']*'|`[^`]*`|[^#\r\n]*)([^\r\n]*)/gm;
    const definitions = [...source.matchAll(assignment)];
    const connections = definitions.filter(
      (entry) => entry[2] === "DATABASE_URL",
    );
    if (connections.length > 1)
      throw new LocalSetupError(
        "O .env contém DATABASE_URL duplicada. Resolva as definições antes do setup.",
      );
    const sessionDefinitions = definitions.filter(
      (entry) => entry[2] === "SESSION_SECRET",
    );
    if (sessionDefinitions.length > 1)
      throw new LocalSetupError(
        "O .env contém SESSION_SECRET duplicado. Resolva as definições antes do setup.",
      );
    const parsed = parseEnv(source);
    const configured = original === undefined ? undefined : parsed.DATABASE_URL;
    let apiPassword = "";
    if (configured) {
      if (/[\r\n]/.test(configured))
        throw new LocalSetupError(
          "Configure DATABASE_URL em uma única linha antes de executar o setup.",
        );
      let url: URL;
      try {
        url = new URL(configured);
      } catch {
        throw new LocalSetupError(
          "DATABASE_URL inválida no .env. Confira a configuração antes do setup.",
        );
      }
      if (
        !["postgres:", "postgresql:"].includes(url.protocol) ||
        localHost(url.hostname) !== host ||
        Number(url.port || 5432) !== options.port ||
        url.pathname !== "/ecovit" ||
        decodeURIComponent(url.username) !== "ecovit" ||
        url.search ||
        url.hash
      )
        throw new LocalSetupError(
          "DATABASE_URL aponta para outro destino ou usa opções incompatíveis. Confira o .env antes do setup.",
        );
      apiPassword = decodeURIComponent(url.password);
      if (apiPassword === "CHANGE_ME") apiPassword = "";
    }

    stage = "conectar como administrador";
    await admin.connect();
    const version = await admin.query("SHOW server_version_num");
    if (
      Number(version.rows[0].server_version_num) < 180000 ||
      Number(version.rows[0].server_version_num) >= 190000
    )
      throw new LocalSetupError("O setup local exige PostgreSQL da linha 18.");
    const administrator = await admin.query(
      "SELECT rolsuper FROM pg_roles WHERE rolname = current_user",
    );
    if (!administrator.rows[0].rolsuper)
      throw new LocalSetupError(
        "Informe um usuário administrador PostgreSQL com privilégio superuser para o setup local.",
      );
    const lock = await admin.query(
      "SELECT pg_try_advisory_lock(72121) AS acquired",
    );
    if (!lock.rows[0].acquired)
      throw new LocalSetupError(
        "Outro setup local está em execução. Aguarde a conclusão e tente novamente.",
      );

    stage = "conferir roles e banco existentes";
    const roles =
      await admin.query(`SELECT rolname, rolsuper, rolcreatedb, rolcreaterole,
      rolreplication, rolbypassrls, rolcanlogin FROM pg_roles
      WHERE rolname IN ('ecovit', 'ecovit_owner')`);
    for (const role of roles.rows) {
      if (
        role.rolsuper ||
        role.rolcreatedb ||
        role.rolcreaterole ||
        role.rolreplication ||
        role.rolbypassrls ||
        !role.rolcanlogin
      )
        throw new LocalSetupError(
          `A role ${role.rolname} possui atributos incompatíveis. Confira os recursos existentes antes do setup.`,
        );
    }
    const memberships =
      await admin.query(`SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member
      WHERE r.rolname IN ('ecovit', 'ecovit_owner')`);
    if (memberships.rowCount)
      throw new LocalSetupError(
        "As roles do Ecovit possuem associação a outras roles. Confira o conflito antes do setup.",
      );
    const databases =
      await admin.query(`SELECT datname, pg_get_userbyid(datdba) AS owner,
      pg_encoding_to_char(encoding) AS encoding FROM pg_database
      WHERE datname='ecovit' OR datdba IN (SELECT oid FROM pg_roles WHERE rolname IN ('ecovit', 'ecovit_owner'))`);
    for (const entry of databases.rows) {
      if (
        entry.datname !== "ecovit" ||
        entry.owner !== "ecovit_owner" ||
        entry.encoding !== "UTF8"
      )
        throw new LocalSetupError(
          "Banco ou propriedade das roles do Ecovit incompatível. Confira os recursos existentes antes do setup.",
        );
    }
    const exists = databases.rows.some((entry) => entry.datname === "ecovit");
    if (exists) {
      target = new Client({
        host,
        port: options.port,
        user: options.user,
        password: options.password,
        database: "ecovit",
        options: "-c search_path=public",
        connectionTimeoutMillis: 5000,
        statement_timeout: 15000,
      });
      await target.connect();
      const schema =
        await target.query(`SELECT nspname, pg_get_userbyid(nspowner) AS owner FROM pg_namespace
        WHERE nspname NOT LIKE 'pg_%' AND nspname <> 'information_schema'`);
      if (
        schema.rows.some(
          (entry) =>
            entry.nspname !== "public" ||
            !["pg_database_owner", "ecovit_owner"].includes(entry.owner),
        )
      )
        throw new LocalSetupError(
          "O banco ecovit possui schemas incompatíveis. Confira os recursos existentes antes do setup.",
        );
      const sql = await readFile(
        new URL("./schema.sql", import.meta.url),
        "utf8",
      );
      // Ask PostgreSQL to describe the same schema used by migrate(). The
      // reference schema and its data are rolled back even when validation fails.
      const reference = `ecovit_setup_${randomBytes(8).toString("hex")}`;
      await target.query("BEGIN");
      try {
        await target.query(
          `CREATE SCHEMA ${reference}; SET LOCAL search_path TO ${reference}`,
        );
        await target.query(sql);
        const compatibility = await target.query(`WITH shapes AS (
          SELECT c.oid, c.relname, c.relkind, c.relnamespace, c.relowner,
            c.relrowsecurity, c.relforcerowsecurity,
            (SELECT jsonb_agg(jsonb_build_array(a.attname, a.atttypid, a.atttypmod,
              a.attnotnull, a.attcollation, a.attidentity, a.attgenerated,
              pg_get_expr(d.adbin, d.adrelid)) ORDER BY a.attname)
             FROM pg_attribute a LEFT JOIN pg_attrdef d
               ON d.adrelid=a.attrelid AND d.adnum=a.attnum
             WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped) AS columns,
            (SELECT jsonb_agg(jsonb_build_array(k.contype, k.convalidated,
              replace(pg_get_constraintdef(k.oid), 'public.', ''))
              ORDER BY replace(pg_get_constraintdef(k.oid), 'public.', ''))
             FROM pg_constraint k WHERE k.conrelid=c.oid) AS constraints
          FROM pg_class c WHERE c.relnamespace IN ('public'::regnamespace, '${reference}'::regnamespace)
            AND c.relkind IN ('r','p','S','v','m','f')
        ) SELECT NOT EXISTS (
          SELECT 1 FROM shapes actual LEFT JOIN shapes expected
            ON expected.relnamespace='${reference}'::regnamespace AND expected.relname=actual.relname
          WHERE actual.relnamespace='public'::regnamespace AND (
            expected.oid IS NULL OR actual.relkind <> expected.relkind OR
            actual.relowner <> 'ecovit_owner'::regrole OR
            actual.relrowsecurity <> expected.relrowsecurity OR
            actual.relforcerowsecurity <> expected.relforcerowsecurity OR
            actual.columns IS DISTINCT FROM expected.columns OR
            actual.constraints IS DISTINCT FROM expected.constraints
          )
        ) AS compatible`);
        if (!compatibility.rows[0].compatible)
          throw new LocalSetupError(
            "O banco ecovit contém objetos incompatíveis com o schema do aplicativo. Confira o conflito antes do setup.",
          );
      } finally {
        await target.query("ROLLBACK");
      }
    }

    const apiExists = roles.rows.some((role) => role.rolname === "ecovit");
    if (!apiPassword)
      apiPassword = apiExists
        ? await options.secret("Senha atual da role ecovit: ")
        : randomBytes(32).toString("hex");
    if (!apiPassword)
      throw new LocalSetupError(
        "Informe a senha existente da role ecovit para preservar a configuração.",
      );
    const runtime = new URL("postgresql://ecovit@127.0.0.1/ecovit");
    runtime.hostname = host === "::1" ? "[::1]" : host;
    runtime.port = String(options.port);
    runtime.password = encodeURIComponent(apiPassword);
    if (apiExists) {
      stage = "validar a senha existente da role ecovit";
      const checkUrl = new URL(runtime);
      checkUrl.pathname = exists ? "/ecovit" : "/postgres";
      const check = new Client({
        connectionString: checkUrl.toString(),
        connectionTimeoutMillis: 5000,
      });
      try {
        await check.connect();
      } catch (error) {
        // Missing CONNECT grants are repaired after the migration.
        if ((error as NodeJS.ErrnoException).code !== "42501") throw error;
      } finally {
        await check.end();
      }
    }

    stage = "configurar o .env";
    const connection =
      configured &&
      decodeURIComponent(new URL(configured).password) === apiPassword
        ? configured
        : runtime.toString();
    const newline = source.includes("\r\n") ? "\r\n" : "\n";
    const replacements: Record<string, string> = {};
    if (parsed.DATABASE_URL !== connection)
      replacements.DATABASE_URL = connection;
    if (!parsed.SESSION_SECRET?.trim())
      replacements.SESSION_SECRET = randomBytes(32).toString("base64url");
    let updated = source.replace(
      assignment,
      (line, prefix: string, name: string, value: string, suffix: string) => {
        if (!Object.hasOwn(replacements, name)) return line;
        const replacement = replacements[name];
        delete replacements[name];
        const spacing = value.match(/[\t ]*$/)?.[0] ?? "";
        return `${prefix}${replacement}${spacing}${suffix}`;
      },
    );
    for (const [name, value] of Object.entries(replacements))
      updated += `${updated.endsWith("\n") ? "" : newline}${name}=${value}${newline}`;
    const envPath = path.join(options.directory, ".env");
    if (updated !== original) {
      const temporary = `${envPath}.${randomBytes(8).toString("hex")}.tmp`;
      try {
        await writeFile(temporary, updated, { flag: "wx", mode: 0o600 });
        if ((await readLocalEnv(options.directory)) !== original)
          throw new LocalSetupError(
            "O .env mudou durante o setup. Execute novamente para preservar as alterações.",
          );
        await rename(temporary, envPath);
      } finally {
        await unlink(temporary).catch(() => {});
      }
    }
    options.report("Configuração de execução preservada no .env.");

    stage = "criar roles e banco";
    await admin.query("SET password_encryption = 'scram-sha-256'");
    await admin.query("BEGIN");
    try {
      if (!roles.rows.some((role) => role.rolname === "ecovit_owner"))
        await admin.query(
          `CREATE ROLE ecovit_owner LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD ${escapeLiteral(randomBytes(32).toString("hex"))}`,
        );
      if (!apiExists)
        await admin.query(
          `CREATE ROLE ecovit LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD ${escapeLiteral(apiPassword)}`,
        );
      await admin.query("COMMIT");
    } catch (error) {
      await admin.query("ROLLBACK");
      throw error;
    }
    if (!exists)
      await admin.query(
        "CREATE DATABASE ecovit OWNER ecovit_owner ENCODING 'UTF8' TEMPLATE template0",
      );
    options.report("Banco e roles locais conferidos.");

    stage = "aplicar a migração como ecovit_owner";
    const ownerUrl = new URL(runtime);
    ownerUrl.username = encodeURIComponent(options.user);
    ownerUrl.password = encodeURIComponent(options.password);
    ownerUrl.searchParams.set(
      "options",
      "-c role=ecovit_owner -c search_path=public",
    );
    const owner = database(ownerUrl.toString());
    try {
      const identity = await owner.query("SELECT current_user");
      if (identity.rows[0].current_user !== "ecovit_owner")
        throw new LocalSetupError(
          "A sessão de migração precisa executar como ecovit_owner.",
        );
      await migrate(owner);
    } finally {
      await owner.end();
    }

    stage = "conceder permissões à API";
    target ??= new Client({
      host,
      port: options.port,
      user: options.user,
      password: options.password,
      database: "ecovit",
      options: "-c search_path=public",
      connectionTimeoutMillis: 5000,
      statement_timeout: 15000,
    });
    if (!exists) await target.connect();
    await target.query(`BEGIN;
      REVOKE CREATE ON DATABASE ecovit FROM PUBLIC, ecovit;
      REVOKE CREATE ON SCHEMA public FROM PUBLIC, ecovit;
      GRANT CONNECT ON DATABASE ecovit TO ecovit;
      GRANT USAGE ON SCHEMA public TO ecovit;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ecovit;
      REVOKE ALL ON TABLE ecovit_migrations FROM PUBLIC, ecovit;
      COMMIT;`);

    stage = "validar a conexão e os privilégios da API";
    const api = database(runtime.toString());
    try {
      const permissions = await api.query(`SELECT
        NOT has_database_privilege(current_database(), 'CREATE') AND
        NOT has_schema_privilege('public', 'CREATE') AND
        NOT has_table_privilege('ecovit_migrations', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN') AND
        NOT has_any_column_privilege('ecovit_migrations', 'SELECT,INSERT,UPDATE,REFERENCES') AND
        has_schema_privilege('public', 'USAGE') AND
        (SELECT bool_and(has_table_privilege(c.oid, 'SELECT') AND has_table_privilege(c.oid, 'INSERT') AND
          has_table_privilege(c.oid, 'UPDATE') AND has_table_privilege(c.oid, 'DELETE'))
         FROM pg_class c WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p') AND relname <> 'ecovit_migrations') AS valid`);
      if (permissions.rows[0].valid !== true)
        throw new LocalSetupError(
          "Os privilégios efetivos da API são incompatíveis. Confira as concessões existentes antes de repetir o setup.",
        );
      // Verify actual DML without leaving a test account behind.
      const client = await api.connect();
      try {
        await client.query("BEGIN");
        const id = randomBytes(16).toString("hex");
        await client.query(
          "INSERT INTO ecovit_accounts(id,email) VALUES($1,$2)",
          [id, `setup-${id}@example.invalid`],
        );
        await client.query("SELECT id FROM ecovit_accounts WHERE id=$1", [id]);
        await client.query(
          "UPDATE ecovit_accounts SET email=email WHERE id=$1",
          [id],
        );
        await client.query("DELETE FROM ecovit_accounts WHERE id=$1", [id]);
      } finally {
        try {
          await client.query("ROLLBACK");
        } finally {
          client.release();
        }
      }
    } finally {
      await api.end();
    }
    options.report(
      "Setup local concluído. Migração, conexão e permissões da API verificadas.",
    );
  } catch (error) {
    if (error instanceof LocalSetupError) throw error;
    const code = (error as NodeJS.ErrnoException).code;
    const reason =
      code === "28P01"
        ? "Autenticação recusada. Confira a senha da etapa indicada."
        : code === "ECONNREFUSED"
          ? "PostgreSQL recusou a conexão. Confira o serviço, endereço e porta."
          : code === "42501"
            ? "Permissão insuficiente. Confira o acesso administrativo e os recursos existentes."
            : "Confira a disponibilidade do PostgreSQL, as permissões e a configuração local.";
    throw new LocalSetupError(
      `Falha ao ${stage}. ${reason} O setup pode ser repetido após a correção.`,
    );
  } finally {
    await target?.end();
    await admin.end();
  }
}
