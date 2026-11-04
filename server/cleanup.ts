import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import type { Pool } from "pg";
import type { Config } from "./config";
import { transaction } from "./db";
import { assetPath } from "./projects";

export async function cleanup(db: Pool, config: Config) {
  const coordinator = await db.connect();
  try {
    const locked = await coordinator.query(
      "SELECT pg_try_advisory_lock(72121) AS locked",
    );
    if (!locked.rows[0].locked) return { skipped: true };
    const accounts = await db.query(
      "SELECT id,email FROM ecovit_accounts ORDER BY deleting_at NULLS LAST",
    );
    for (const account of accounts.rows) {
      await transaction(db, async (client) => {
        const current = await client.query(
          "SELECT state FROM ecovit_accounts WHERE id=$1 FOR UPDATE",
          [account.id],
        );
        if (!current.rowCount) return;
        const deleting = current.rows[0].state === "deleting";
        await client.query(
          "UPDATE ecovit_projects SET state='purging' WHERE owner_id=$1 AND state='trashed' AND purge_after<=clock_timestamp()",
          [account.id],
        );
        const purging = await client.query(
          "SELECT id FROM ecovit_projects WHERE owner_id=$1 AND (state='purging' OR $2) FOR UPDATE",
          [account.id, deleting],
        );
        for (const project of purging.rows) {
          // File removal precedes row/quota removal; failure leaves a retryable purging project.
          const assets = await client.query(
            "SELECT id FROM ecovit_assets WHERE project_id=$1 AND owner_id=$2",
            [project.id, account.id],
          );
          for (const asset of assets.rows)
            await rm(assetPath(config, asset.id, account.id), { force: true });
          await client.query(
            "DELETE FROM ecovit_project_assets WHERE project_id=$1",
            [project.id],
          );
          await client.query(
            "DELETE FROM ecovit_assets WHERE project_id=$1 AND owner_id=$2",
            [project.id, account.id],
          );
          await client.query("DELETE FROM ecovit_projects WHERE id=$1", [
            project.id,
          ]);
        }
        const obsolete = await client.query(
          "SELECT id FROM ecovit_assets a WHERE owner_id=$1 AND NOT EXISTS(SELECT 1 FROM ecovit_project_assets pa WHERE pa.asset_id=a.id) AND ($2 OR (NOT attached AND created_at<=clock_timestamp()-interval '24 hours') OR (attached AND unreferenced_at<=clock_timestamp()-interval '7 days')) FOR UPDATE",
          [account.id, deleting],
        );
        for (const asset of obsolete.rows) {
          await rm(assetPath(config, asset.id, account.id), { force: true });
          await client.query("DELETE FROM ecovit_assets WHERE id=$1", [
            asset.id,
          ]);
        }
        if (deleting) {
          await client.query(
            "UPDATE ecovit_deletions SET completed=true WHERE account_id=$1 AND accepted_at IS NOT NULL",
            [account.id],
          );
          await client.query("DELETE FROM ecovit_challenges WHERE email=$1", [
            account.email,
          ]);
          await client.query("DELETE FROM ecovit_accounts WHERE id=$1", [
            account.id,
          ]);
        }
      });
    }
    await db.query(
      "DELETE FROM ecovit_sessions WHERE created_at<=clock_timestamp()-interval '30 days' OR last_seen<=clock_timestamp()-interval '7 days'",
    );
    await db.query(
      "DELETE FROM ecovit_challenges WHERE expires_at<=clock_timestamp()",
    );
    await db.query(
      "DELETE FROM ecovit_receipts WHERE created_at<=clock_timestamp()-interval '30 days'",
    );
    await db.query(
      "DELETE FROM ecovit_deletions WHERE expires_at<=clock_timestamp()",
    );
    await db.query(
      "DELETE FROM ecovit_rate_limits WHERE expires_at<=clock_timestamp()",
    );
    // Owner-prefixed names let account deletion sweep even files left by a
    // crash before association, without waiting the active-owner grace period.
    for (const filename of await readdir(config.dataDir)) {
      const match = /^([0-9a-f-]{36})_([0-9a-f-]{36})$/.exec(filename);
      if (!match) continue;
      const [, owner, id] = match;
      const file = path.join(config.dataDir, filename);
      const account = await db.query(
        "SELECT state FROM ecovit_accounts WHERE id=$1",
        [owner],
      );
      if (!account.rowCount || account.rows[0].state !== "active") {
        await rm(file, { force: true });
        continue;
      }
      let modified: number;
      try {
        modified = (await stat(file)).mtimeMs;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw error;
      }
      if (Date.now() - modified < 86400000) continue;
      const row = await db.query(
        "SELECT 1 FROM ecovit_assets WHERE id=$1 AND owner_id=$2",
        [id, owner],
      );
      if (!row.rowCount) await rm(file, { force: true });
    }
    await db.query(
      "INSERT INTO ecovit_maintenance(id,last_success) VALUES(1,clock_timestamp()) ON CONFLICT(id) DO UPDATE SET last_success=EXCLUDED.last_success",
    );
    return { skipped: false };
  } finally {
    await coordinator.query("SELECT pg_advisory_unlock(72121)");
    coordinator.release();
  }
}
