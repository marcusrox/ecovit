import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Pool, PoolClient } from "pg";
import { z } from "zod";
import {
  priceItemSchema,
  priceItemKey,
  priceItemLabel,
  fixedPriceItems,
  projectPriceItems,
  projectPrice,
  priceSource,
  referenceCents,
} from "../src/domain/price-references";
import type { RemoteProject } from "../src/persistence/remote-document";
import type { Config } from "./config";
import { transaction } from "./db";
import { adminIdentity } from "./admin";
import {
  identity,
  requireAccountScope,
  requireCsrf,
  requireOrigin,
  rate,
  hash,
  ApiError,
} from "./security";

export async function learnOpeningPrices(
  client: PoolClient,
  doc: RemoteProject,
  previous?: RemoteProject,
) {
  if (!previous) return; // An import/create is not a user confirmation in the budget.
  for (const item of projectPriceItems(doc)
    .filter((i) => i.group === "openings")
    .sort((a, b) => priceItemKey(a).localeCompare(priceItemKey(b)))) {
    const value = projectPrice(doc, item);
    if (value === undefined || priceSource(doc, item) !== "own") continue;
    if (
      projectPrice(previous, item) === value &&
      priceSource(previous, item) === "own"
    )
      continue;
    await client.query(
      "INSERT INTO ecovit_price_references(key,item,price) VALUES($1,$2::jsonb,$3) ON CONFLICT DO NOTHING",
      [priceItemKey(item), JSON.stringify(item), value],
    );
  }
}
const patchSchema = z
  .object({
    item: priceItemSchema,
    price: referenceCents.nullable(),
    expectedPrice: referenceCents.nullable(),
    operationId: z.string().uuid(),
    requestIssuedAt: z.string().datetime(),
  })
  .strict();
export function priceRoutes(app: FastifyInstance, db: Pool, config: Config) {
  async function user(request: FastifyRequest) {
    const account = await identity(db, request, config);
    requireAccountScope(request, account.id);
    await rate(db, `prices:${account.id}`, 120, 60);
    return account;
  }
  app.post("/api/prices/lookup", async (request) => {
    const account = await user(request);
    requireOrigin(request, config);
    requireCsrf(request, account.csrf);
    const { items } = z
      .object({ items: z.array(priceItemSchema) })
      .strict()
      .parse(request.body);
    const result = await db.query(
      "SELECT item,price::text FROM ecovit_price_references WHERE key=ANY($1::text[])",
      [[...new Set(items.map(priceItemKey))]],
    );
    return {
      references: result.rows.map((r) => ({
        item: r.item,
        price: r.price === null ? null : Number(r.price),
      })),
    };
  });
  app.get("/api/admin/prices", async (request) => {
    const admin = await adminIdentity(db, request, config);
    await rate(db, `admin:${admin.id}`, 120, 60);
    const { page } = z
      .object({ page: z.coerce.number().int().min(1).max(100000).default(1) })
      .strict()
      .parse(request.query);
    const fixed = await db.query(
      "SELECT key,item,price::text FROM ecovit_price_references WHERE item->>'group'<>'openings'",
    );
    const openings = await db.query(
      "SELECT item,price::text FROM ecovit_price_references WHERE item->>'group'='openings' ORDER BY key LIMIT 26 OFFSET $1",
      [(page - 1) * 25],
    );
    const map = new Map(fixed.rows.map((r) => [r.key, r]));
    return {
      references: [
        ...fixedPriceItems.map((item) => ({
          item,
          price:
            map.get(priceItemKey(item))?.price === undefined ||
            map.get(priceItemKey(item))?.price === null
              ? null
              : Number(map.get(priceItemKey(item))!.price),
        })),
        ...openings.rows.slice(0, 25).map((r) => ({
          item: r.item,
          price: r.price === null ? null : Number(r.price),
        })),
      ],
      hasMore: openings.rows.length > 25,
    };
  });
  app.post("/api/admin/prices", async (request) => {
    const initial = await adminIdentity(db, request, config);
    requireOrigin(request, config);
    requireCsrf(request, initial.csrf);
    await rate(db, `admin-prices:${initial.id}`, 120, 60);
    const input = patchSchema.parse(request.body);
    return transaction(db, async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(72122)");
      const actor = await adminIdentity(client, request, config, true);
      requireCsrf(request, actor.csrf);
      const fingerprint = hash(JSON.stringify(input));
      const previous = await client.query(
        "SELECT fingerprint FROM ecovit_admin_audit WHERE actor_id=$1 AND operation_id=$2",
        [actor.id, input.operationId],
      );
      if (previous.rowCount) {
        if (previous.rows[0].fingerprint !== fingerprint)
          throw new ApiError(
            409,
            "operation_content",
            "Operação já utilizada com outro conteúdo.",
          );
        return { outcome: "success" };
      }
      const age = Date.now() - Date.parse(input.requestIssuedAt);
      if (age > 86400000 || age < -300000)
        throw new ApiError(
          409,
          "operation_expired",
          "Operação expirada. Atualize os preços antes de tentar novamente.",
        );
      const key = priceItemKey(input.item);
      // Coordinate this key with first contributions made while saving projects.
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1,72123))",
        [key],
      );
      const row = (
        await client.query(
          "SELECT price::text FROM ecovit_price_references WHERE key=$1 FOR UPDATE",
          [key],
        )
      ).rows[0];
      if (input.item.group === "openings" && !row)
        throw new ApiError(
          422,
          "unused_opening",
          "A esquadria ainda não foi cadastrada por uso em projeto.",
        );
      const current = row?.price == null ? null : Number(row.price);
      if (current !== input.expectedPrice)
        throw new ApiError(
          409,
          "price_changed",
          "A referência mudou. Atualize a consulta antes de confirmar outro valor.",
        );
      await client.query(
        "INSERT INTO ecovit_price_references(key,item,price) VALUES($1,$2::jsonb,$3) ON CONFLICT(key) DO UPDATE SET price=EXCLUDED.price,updated_at=clock_timestamp()",
        [key, JSON.stringify(input.item), input.price],
      );
      await client.query(
        "INSERT INTO ecovit_admin_audit(id,actor_id,target_id,source,action,reason,outcome,operation_id,fingerprint) VALUES($1,$2,$2,'panel','price',$3,'success',$4,$5)",
        [
          randomUUID(),
          actor.id,
          `Referência ${priceItemLabel(input.item)}: ${current ?? "ausente"} → ${input.price ?? "ausente"} centavos.`,
          input.operationId,
          fingerprint,
        ],
      );
      return { outcome: "success" };
    });
  });
}
