import { Pool, type PoolClient } from "pg";
import { readFile } from "node:fs/promises";

export function database(connectionString: string) {
  const pool = new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
    lock_timeout: 5000,
    idle_in_transaction_session_timeout: 15000,
  });
  pool.on("error", () =>
    console.error(
      JSON.stringify({
        event: "database_idle_connection_error",
        time: new Date().toISOString(),
      }),
    ),
  );
  return pool;
}
export async function transaction<T>(
  pool: Pool,
  action: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL READ COMMITTED");
    const value = await action(client);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export async function migrate(pool: Pool) {
  const version = await pool.query("SHOW server_version_num");
  if (
    Number(version.rows[0].server_version_num) < 180000 ||
    Number(version.rows[0].server_version_num) >= 190000
  )
    throw new Error("M12 exige PostgreSQL 18.");
  const sql = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  await transaction(pool, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(72120)");
    await client.query(sql);
  });
}
