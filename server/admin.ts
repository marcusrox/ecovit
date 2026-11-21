import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Pool, PoolClient } from "pg";
import { z } from "zod";
import type { Config } from "./config";
import { transaction } from "./db";
import {
  ApiError,
  hash,
  identity,
  isAdmin,
  rate,
  requireAccountScope,
  requireCsrf,
  requireOrigin,
} from "./security";

const filters = z
  .object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    days: z.coerce
      .number()
      .pipe(z.union([z.literal(7), z.literal(30)]))
      .default(7),
    search: z.string().max(254).default(""),
    state: z.enum(["", "active", "blocked", "deleting"]).default(""),
    category: z
      .enum(["", "auth", "mail", "save", "upload", "import"])
      .default(""),
    code: z.string().max(64).default(""),
    actor: z.union([z.string().uuid(), z.literal("")]).default(""),
    target: z.union([z.string().uuid(), z.literal("")]).default(""),
    action: z
      .enum([
        "",
        "block",
        "unblock",
        "sessions",
        "grant",
        "revoke",
        "recover",
        "configured",
      ])
      .default(""),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .strict();
const mutation = z
  .object({
    operationId: z.string().uuid(),
    requestIssuedAt: z.string().datetime(),
    action: z.enum(["block", "unblock", "sessions", "grant", "revoke"]),
    reason: z.string().trim().min(3).max(300),
  })
  .strict();
const pageSize = 25;
export async function auditPermanent(db: Pool | PoolClient, id: string) {
  await db.query(
    "INSERT INTO ecovit_admin_audit(id,target_id,source,action,reason,outcome,operation_id,fingerprint) VALUES($1,$2,'server','configured','Administrador permanente configurado no servidor.','success',$3,$4) ON CONFLICT DO NOTHING",
    [randomUUID(), id, randomUUID(), hash(id)],
  );
}
const since =
  "((clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date-($1::int-1)) AT TIME ZONE 'America/Sao_Paulo'";
const accountFields = `a.id,a.email,a.state,a.created_at,a.last_activity,(a.is_admin OR a.email=$1) AS admin,(a.email=$1) AS permanent,
 (SELECT count(*)::int FROM ecovit_projects p WHERE p.owner_id=a.id) AS projects,
 (SELECT COALESCE(sum(bytes),0)::float8 FROM ecovit_assets r WHERE r.owner_id=a.id) AS bytes`;

async function adminIdentity(
  db: Pool | PoolClient,
  request: FastifyRequest,
  config: Config,
  lock = false,
) {
  const user = await identity(db, request, config, lock);
  requireAccountScope(request, user.id);
  if (!isAdmin(user, config))
    throw new ApiError(
      403,
      "admin_required",
      "Acesso restrito à administração.",
    );
  return user;
}

export async function recoverAdmin(
  db: Pool,
  config: Config,
  id: string,
  reason: string,
) {
  z.string().uuid().parse(id);
  z.string().trim().min(3).max(300).parse(reason);
  return transaction(db, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(72122)");
    const row = await client.query(
      "SELECT id FROM ecovit_accounts WHERE id=$1 AND state='active' FOR UPDATE",
      [id],
    );
    if (!row.rowCount)
      throw new ApiError(404, "account_missing", "Conta ativa não encontrada.");
    await client.query("UPDATE ecovit_accounts SET is_admin=true WHERE id=$1", [
      id,
    ]);
    await client.query(
      "INSERT INTO ecovit_admin_audit(id,target_id,source,action,reason,outcome,operation_id,fingerprint) VALUES($1,$2,'server','recover',$3,'success',$4,$5)",
      [randomUUID(), id, reason, randomUUID(), hash(id)],
    );
    return { ok: true, permanent: config.adminEmail !== undefined };
  });
}

export function adminRoutes(app: FastifyInstance, db: Pool, config: Config) {
  async function protect(request: FastifyRequest) {
    const user = await adminIdentity(db, request, config);
    await rate(db, `admin:${user.id}`, 120, 60);
    if (request.method !== "GET") {
      requireOrigin(request, config);
      requireCsrf(request, user.csrf);
    }
    await db.query(
      "UPDATE ecovit_sessions SET last_seen=clock_timestamp() WHERE hash=$1",
      [user.sessionHash],
    );
  }
  app.get("/api/admin/overview", { onRequest: protect }, async (request) => {
    const q = filters.parse(request.query);
    const result = await db.query(
      `SELECT clock_timestamp() AS updated_at,
      (SELECT started_at FROM ecovit_observation WHERE id=1) AS coverage_since,
      (SELECT started_at>${since} FROM ecovit_observation WHERE id=1) AS coverage_partial,
      (SELECT count(*)::int FROM ecovit_accounts) AS accounts,
      (SELECT count(*)::int FROM ecovit_accounts WHERE state='active') AS active_accounts,
      (SELECT count(*)::int FROM ecovit_accounts WHERE state='blocked') AS blocked_accounts,
      (SELECT count(*)::int FROM ecovit_accounts WHERE state='deleting') AS deleting_accounts,
      (SELECT count(*)::int FROM ecovit_accounts WHERE created_at>=${since}) AS new_accounts,
      (SELECT count(DISTINCT account_id)::int FROM ecovit_activity WHERE day>=((clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date-($1::int-1))) AS active_users,
      (SELECT count(*)::int FROM ecovit_projects WHERE state='active') AS projects,
      (SELECT count(*)::int FROM ecovit_projects WHERE state IN ('trashed','purging')) AS trashed_projects,
      (SELECT COALESCE(sum(bytes),0)::float8 FROM ecovit_assets) AS bytes`,
      [q.days],
    );
    return { ...result.rows[0], days: q.days };
  });
  app.get("/api/admin/users", { onRequest: protect }, async (request) => {
    const q = filters.parse(request.query);
    const rows = await db.query(
      `SELECT ${accountFields},count(*) OVER()::int AS total FROM ecovit_accounts a WHERE strpos(a.email,$2)>0 AND ($3='' OR a.state=$3) ORDER BY a.created_at DESC,a.id LIMIT 25 OFFSET $4`,
      [
        config.adminEmail ?? "",
        q.search.toLowerCase().trim(),
        q.state,
        (q.page - 1) * pageSize,
      ],
    );
    return {
      items: rows.rows,
      page: q.page,
      hasMore: rows.rows.length === pageSize,
    };
  });
  app.get<{ Params: { id: string } }>(
    "/api/admin/users/:id",
    { onRequest: protect },
    async (request) => {
      const id = z.string().uuid().parse(request.params.id),
        q = filters.parse(request.query);
      const account = await db.query(
        `SELECT ${accountFields} FROM ecovit_accounts a WHERE a.id=$2`,
        [config.adminEmail ?? "", id],
      );
      if (!account.rowCount)
        throw new ApiError(404, "account_missing", "Conta não encontrada.");
      const projects = await db.query(
        `SELECT p.id,p.list_meta->>'name' AS name,p.state,p.created_at,p.updated_at,p.revision::text,
      (SELECT COALESCE(sum(bytes),0)::float8 FROM ecovit_assets r WHERE r.project_id=p.id AND r.owner_id=p.owner_id) AS bytes
      FROM ecovit_projects p WHERE p.owner_id=$1 ORDER BY p.updated_at DESC,p.id LIMIT 25 OFFSET $2`,
        [id, (q.page - 1) * pageSize],
      );
      return {
        account: account.rows[0],
        projects: projects.rows,
        hasMore: projects.rows.length === pageSize,
        page: q.page,
        projectLimit: config.projectLimit,
        imageLimit: config.imageLimit,
      };
    },
  );
  app.get("/api/admin/operation", { onRequest: protect }, async (request) => {
    const q = filters.parse(request.query);
    const rows = await db.query(
      `SELECT category,code,outcome,request_id,created_at FROM ecovit_operation_events WHERE created_at>=${since} AND created_at>clock_timestamp()-interval '30 days' AND ($2='' OR category=$2) AND ($3='' OR code=$3) ORDER BY created_at DESC,id DESC LIMIT 25 OFFSET $4`,
      [q.days, q.category, q.code, (q.page - 1) * pageSize],
    );
    const maintenance = await db.query(
      "SELECT last_success FROM ecovit_maintenance WHERE id=1",
    );
    const coverage = await db.query(
      "SELECT started_at FROM ecovit_observation WHERE id=1",
    );
    return {
      items: rows.rows,
      hasMore: rows.rows.length === pageSize,
      page: q.page,
      api: "ok",
      database: "ok",
      checkedAt: new Date().toISOString(),
      lastCleanup: maintenance.rows[0]?.last_success ?? null,
      coverageSince: coverage.rows[0]?.started_at ?? null,
    };
  });
  app.get("/api/admin/audit", { onRequest: protect }, async (request) => {
    const q = filters.parse(request.query);
    const rows = await db.query(
      `SELECT r.id,r.actor_id,r.target_id,r.source,r.action,r.reason,r.outcome,r.created_at,a.email AS actor_email,t.email AS target_email FROM ecovit_admin_audit r LEFT JOIN ecovit_accounts a ON a.id=r.actor_id JOIN ecovit_accounts t ON t.id=r.target_id WHERE r.created_at>clock_timestamp()-interval '180 days' AND ($1::uuid IS NULL OR r.actor_id=$1) AND ($2::uuid IS NULL OR r.target_id=$2) AND ($3='' OR r.action=$3) AND ($4::timestamptz IS NULL OR r.created_at >= $4) AND ($5::timestamptz IS NULL OR r.created_at <= $5) ORDER BY r.created_at DESC,r.id DESC LIMIT 25 OFFSET $6`,
      [
        q.actor || null,
        q.target || null,
        q.action,
        q.from ?? null,
        q.to ?? null,
        (q.page - 1) * pageSize,
      ],
    );
    return {
      items: rows.rows,
      hasMore: rows.rows.length === pageSize,
      page: q.page,
    };
  });
  app.post<{ Params: { id: string } }>(
    "/api/admin/users/:id/actions",
    { onRequest: protect },
    async (request) => {
      const id = z.string().uuid().parse(request.params.id),
        input = mutation.parse(request.body);
      const outcome = await transaction(db, async (client) => {
        // Serialize privilege changes before taking account/session coordinator locks.
        await client.query("SELECT pg_advisory_xact_lock(72122)");
        const actor = await adminIdentity(client, request, config, true);
        requireCsrf(request, actor.csrf);
        const target = (
          await client.query(
            "SELECT id,email,state,is_admin FROM ecovit_accounts WHERE id=$1 FOR UPDATE",
            [id],
          )
        ).rows[0];
        if (!target || target.state === "deleting")
          throw new ApiError(404, "account_missing", "Conta indisponível.");
        const fingerprint = hash(JSON.stringify({ id, ...input }));
        const previous = await client.query(
          "SELECT fingerprint,outcome FROM ecovit_admin_audit WHERE actor_id=$1 AND operation_id=$2",
          [actor.id, input.operationId],
        );
        if (previous.rowCount) {
          if (previous.rows[0].fingerprint !== fingerprint)
            throw new ApiError(
              409,
              "operation_content",
              "Operação já utilizada com outro conteúdo.",
            );
          return { outcome: previous.rows[0].outcome };
        }
        const age = Date.now() - Date.parse(input.requestIssuedAt);
        if (age > 86400000 || age < -300000)
          throw new ApiError(
            409,
            "operation_expired",
            "Operação expirada. Confira a situação antes de tentar novamente.",
          );
        let refusal = "";
        if (id === actor.id)
          refusal = "Não é permitido aplicar esta ação à própria conta.";
        else if (
          input.action === "revoke" &&
          target.email === config.adminEmail
        )
          refusal = "O administrador configurado no servidor é permanente.";
        else if (
          ["block", "unblock", "sessions"].includes(input.action) &&
          isAdmin(target, config)
        )
          refusal =
            "Retire o privilégio antes de agir sobre esta conta administrativa.";
        else if (input.action === "grant" && target.state !== "active")
          refusal = "Somente contas ativas podem receber o privilégio.";
        const unchanged =
          (input.action === "grant" && isAdmin(target, config)) ||
          (input.action === "revoke" && !isAdmin(target, config)) ||
          (input.action === "block" && target.state === "blocked") ||
          (input.action === "unblock" && target.state === "active");
        const status = refusal
          ? "refused"
          : unchanged
            ? "unchanged"
            : "success";
        if (status === "success") {
          if (input.action === "block" || input.action === "unblock")
            await client.query(
              "UPDATE ecovit_accounts SET state=$2 WHERE id=$1",
              [id, input.action === "block" ? "blocked" : "active"],
            );
          if (input.action === "grant" || input.action === "revoke")
            await client.query(
              "UPDATE ecovit_accounts SET is_admin=$2 WHERE id=$1",
              [id, input.action === "grant"],
            );
          if (["block", "sessions", "revoke"].includes(input.action))
            await client.query(
              "DELETE FROM ecovit_sessions WHERE account_id=$1",
              [id],
            );
        }
        await client.query(
          "INSERT INTO ecovit_admin_audit(id,actor_id,target_id,source,action,reason,outcome,operation_id,fingerprint) VALUES($1,$2,$3,'panel',$4,$5,$6,$7,$8)",
          [
            randomUUID(),
            actor.id,
            id,
            input.action,
            input.reason,
            status,
            input.operationId,
            fingerprint,
          ],
        );
        return { outcome: status, ...(refusal ? { refusal } : {}) };
      });
      if ("refusal" in outcome)
        throw new ApiError(403, "admin_action_refused", outcome.refusal!);
      return outcome;
    },
  );
}
