import { Pool, type PoolClient } from "pg";
export { migrate } from "./migrations";

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
