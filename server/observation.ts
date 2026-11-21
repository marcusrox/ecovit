import type { Pool, PoolClient } from "pg";

export async function recordActivity(db: Pool | PoolClient, account: string) {
  // Account lock coordinates activity with deletion, including project reads.
  await db.query(
    "UPDATE ecovit_accounts SET last_activity=clock_timestamp() WHERE id=$1 AND state='active'",
    [account],
  );
  await db.query(
    "INSERT INTO ecovit_activity(account_id,day) SELECT id,(clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date FROM ecovit_accounts WHERE id=$1 AND state='active' ON CONFLICT DO NOTHING",
    [account],
  );
}

export async function recordEvent(
  db: Pool,
  category: string,
  code: string,
  outcome: string,
  requestId?: string,
) {
  await db.query(
    "INSERT INTO ecovit_operation_events(category,code,outcome,request_id) VALUES($1,$2,$3,$4)",
    [category, code, outcome, requestId ?? null],
  );
}
