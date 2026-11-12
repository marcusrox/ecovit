import { readFile, readdir } from "node:fs/promises";
import type { Client, Pool, PoolClient } from "pg";

export type Migration = { version: number; sql: string };
export class MigrationError extends Error {}

export function validateMigrations(migrations: readonly Migration[]) {
  if (
    !migrations.length ||
    migrations.some((m, i) => m.version !== i + 1 || !m.sql.trim())
  )
    throw new MigrationError(
      "Sequência de migrações inválida: use versões únicas e consecutivas desde 1.",
    );
}

export async function loadMigrations(): Promise<Migration[]> {
  const directory = new URL("./migrations/", import.meta.url);
  const files = (await readdir(directory)).filter((name) =>
    name.endsWith(".sql"),
  );
  const migrations = [
    {
      version: 1,
      sql: await readFile(new URL("./schema.sql", import.meta.url), "utf8"),
    },
  ];
  for (const name of files) {
    if (!/^\d{3,}-[a-z0-9-]+\.sql$/.test(name))
      throw new MigrationError(
        "Nome de migração inválido: use NNN-descricao.sql.",
      );
    migrations.push({
      version: Number(name.split("-")[0]),
      sql: await readFile(new URL(name, directory), "utf8"),
    });
  }
  migrations.sort((a, b) => a.version - b.version);
  validateMigrations(migrations);
  return migrations;
}

type QueryClient = Pick<Client | PoolClient, "query">;

// Scope the history and empty-schema check to current_schema(), including test schemas.
export async function readMigrationVersion(
  client: QueryClient,
  migrations: readonly Migration[],
) {
  validateMigrations(migrations);
  const relation = await client.query(`SELECT c.relkind FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname=current_schema() AND c.relname='ecovit_migrations'`);
  if (!relation.rowCount) {
    const objects = await client.query(`SELECT EXISTS (
      SELECT 1 FROM pg_class WHERE relnamespace=current_schema()::regnamespace
      UNION ALL SELECT 1 FROM pg_proc WHERE pronamespace=current_schema()::regnamespace
      UNION ALL SELECT 1 FROM pg_type WHERE typnamespace=current_schema()::regnamespace AND typtype IN ('e','d')
    ) AS present`);
    if (objects.rows[0].present)
      throw new MigrationError(
        "Schema com objetos incompatíveis: histórico de migrações ausente. Confira o banco antes de migrar.",
      );
    return 0;
  }
  if (relation.rows[0].relkind !== "r")
    throw new MigrationError("Tabela de histórico de migrações incompatível.");
  const history = await client.query(
    "SELECT version FROM ecovit_migrations ORDER BY version",
  );
  if (!history.rowCount || history.rows.some((row, i) => row.version !== i + 1))
    throw new MigrationError(
      "Histórico de migrações inconsistente: versões devem ser consecutivas desde 1.",
    );
  if (history.rows.length > migrations.length)
    throw new MigrationError(
      "O banco possui versão desconhecida por este código. Use a revisão correspondente.",
    );
  return history.rows.length;
}

export async function migrate(pool: Pool, migrations?: readonly Migration[]) {
  const sequence = migrations ?? (await loadMigrations());
  validateMigrations(sequence);
  const client = await pool.connect();
  let locked = false;
  let discard = false;
  try {
    const version = await client.query("SHOW server_version_num");
    if (
      Number(version.rows[0].server_version_num) < 180000 ||
      Number(version.rows[0].server_version_num) >= 190000
    )
      throw new MigrationError("M12 exige PostgreSQL 18.");
    // A session lock spans history inspection and all per-version transactions.
    await client.query("SELECT pg_advisory_lock(72120)");
    locked = true;
    const current = await readMigrationVersion(client, sequence);
    for (const migration of sequence.slice(current)) {
      await client.query("BEGIN");
      try {
        await client.query(migration.sql);
        // The immutable initial SQL already records version 1.
        await client.query(
          "INSERT INTO ecovit_migrations(version) VALUES($1) ON CONFLICT DO NOTHING",
          [migration.version],
        );
        await client.query("COMMIT");
      } catch {
        await client.query("ROLLBACK");
        throw new MigrationError(
          `Falha na migração ${migration.version}; transação revertida. Corrija a causa e execute novamente.`,
        );
      }
    }
  } finally {
    if (locked) {
      try {
        await client.query("SELECT pg_advisory_unlock(72120)");
      } catch {
        discard = true;
      }
    }
    client.release(discard);
  }
}
