import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Pool, PoolClient } from "pg";
import { z } from "zod";
import {
  canonical,
  hydrate,
  resourceIds,
  type RemoteProject,
} from "../src/persistence/remote-document";
import { validateProject } from "../src/persistence/document";
import { MAX_CUSTOM_ASSETS } from "../src/domain/image-elements";
import type { Config } from "./config";
import { transaction } from "./db";
import {
  ApiError,
  hash,
  identity,
  rate,
  requireCsrf,
  requireOrigin,
  requireAccountScope,
} from "./security";
import { validateIsolated } from "./validation";

const uuid = z
  .string()
  .uuid()
  .transform((value) => value.toLowerCase());
const revision = z.string().regex(/^[1-9]\d{0,18}$/);
const mutation = z
  .object({
    operationId: uuid,
    requestIssuedAt: z.string().datetime(),
    expectedRevision: revision.optional(),
    doc: z.unknown().optional(),
    sourceFile: z.string().optional(),
    name: z.string().trim().min(1).max(100).optional(),
    newId: uuid.optional(),
  })
  .strict();
const remoteImage = z
  .object({ resourceId: uuid })
  .passthrough()
  .refine((value) => !("data" in value));
const remoteBoundary = z
  .object({
    model: z
      .object({
        referenceImages: z.array(remoteImage).max(4),
        customImageAssets: z.array(remoteImage).max(MAX_CUSTOM_ASSETS),
      })
      .passthrough(),
  })
  .passthrough();
type Mutation = z.infer<typeof mutation>;
function checkProject(value: unknown) {
  try {
    return validateProject(value);
  } catch {
    throw new ApiError(
      422,
      "document",
      "O projeto não atende aos limites ou ao formato suportado.",
    );
  }
}
export function assetPath(config: Config, id: string, owner: string) {
  return path.join(config.dataDir, `${uuid.parse(owner)}_${uuid.parse(id)}`);
}
export async function ownedProject(
  client: Pool | PoolClient,
  owner: string,
  id: string,
  lock = false,
) {
  const result = await client.query(
    `SELECT * FROM ecovit_projects WHERE id=$1 AND owner_id=$2 ${lock ? "FOR UPDATE" : ""}`,
    [uuid.parse(id), owner],
  );
  if (!result.rowCount)
    throw new ApiError(404, "project_missing", "Projeto indisponível.");
  return result.rows[0];
}
export async function assetData(
  db: Pool | PoolClient,
  owner: string,
  ids: string[],
  config: Config,
  projectId?: string,
) {
  const resources: Record<string, string> = {};
  for (const id of ids) {
    const rows = await db.query(
      "SELECT * FROM ecovit_assets WHERE id=$1 AND owner_id=$2 AND ready=true",
      [uuid.parse(id), owner],
    );
    const row = rows.rows[0];
    if (!row || (projectId && row.project_id !== projectId))
      throw new ApiError(
        422,
        "asset_missing",
        "Imagem privada ausente ou de outro projeto.",
      );
    const bytes = await readFile(assetPath(config, id, owner));
    if (hash(bytes) !== row.hash)
      throw new ApiError(
        422,
        "asset_integrity",
        "Não foi possível conferir a integridade da imagem.",
      );
    resources[id] = bytes.toString("base64");
  }
  return resources;
}
export function projectsRoutes(app: FastifyInstance, db: Pool, config: Config) {
  const uploading = new Set<string>();
  const largeRequests = new Set<FastifyRequest>();
  const handling = new WeakSet<FastifyRequest>();
  const imageReads = new Set<FastifyRequest>();
  const imageCancellation = new WeakMap<FastifyRequest, AbortController>();
  function needsSlot(request: FastifyRequest) {
    const route = request.routeOptions.url;
    return (
      !["GET", "HEAD"].includes(request.method) &&
      (route === "/api/projects/:id" ||
        route === "/api/uploads/:project/:asset" ||
        (route === "/api/projects/:id/:action" &&
          (request.params as { action?: string })?.action === "duplicate"))
    );
  }
  const finished = async (request: FastifyRequest) => {
    imageReads.delete(request);
    if (!handling.has(request)) largeRequests.delete(request);
  };
  app.addHook("onResponse", finished);
  app.addHook("onRequestAbort", finished);
  async function withSlot(
    request: FastifyRequest,
    work: () => Promise<unknown>,
  ) {
    if (needsSlot(request) && !largeRequests.has(request))
      throw new ApiError(
        408,
        "request_aborted",
        "A solicitação foi interrompida antes do processamento.",
      );
    handling.add(request);
    try {
      return await work();
    } finally {
      handling.delete(request);
      largeRequests.delete(request);
    }
  }
  const protectedRequest = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const user = await identity(db, request, config);
    requireAccountScope(request, user.id);
    if (request.raw.aborted || reply.raw.destroyed)
      throw new ApiError(408, "request_aborted", "Solicitação interrompida.");
    if (["GET", "HEAD"].includes(request.method)) {
      await rate(db, `read:${user.id}`, 1200, 60);
      await db.query(
        "UPDATE ecovit_sessions SET last_seen=clock_timestamp() WHERE hash=$1",
        [user.sessionHash],
      );
    }
    if (!["GET", "HEAD"].includes(request.method)) {
      requireOrigin(request, config);
      requireCsrf(request, user.csrf);
      await rate(db, `mutate:${user.id}`, 120, 60);
    }
    if (needsSlot(request)) {
      if (largeRequests.size >= 2)
        throw new ApiError(
          429,
          "server_busy",
          "O servidor está processando outros documentos. Aguarde e tente novamente.",
        );
      largeRequests.add(request);
    }
    if (request.routeOptions.url === "/api/images/:project/:asset") {
      if (imageReads.size >= 4)
        throw new ApiError(
          429,
          "image_busy",
          "Há outros downloads de imagens em andamento. Aguarde e tente novamente.",
        );
      imageReads.add(request);
      imageCancellation.set(request, new AbortController());
    }
    reply.raw.once("close", () => {
      imageCancellation.get(request)?.abort();
      void finished(request);
    });
  };
  async function run(
    request: FastifyRequest,
    input: Mutation,
    kind: string,
    id: string,
    action: (client: PoolClient, owner: string) => Promise<unknown>,
  ) {
    return transaction(db, async (client) => {
      const user = await identity(client, request, config, true);
      const fingerprint = hash(canonical({ kind, id, ...input }));
      const receipt = await client.query(
        "SELECT hash,result FROM ecovit_receipts WHERE account_id=$1 AND operation_id=$2",
        [user.id, input.operationId],
      );
      if (receipt.rowCount) {
        if (receipt.rows[0].hash !== fingerprint)
          throw new ApiError(
            409,
            "operation_content",
            "Esta operação já foi usada com outro conteúdo.",
          );
        return receipt.rows[0].result;
      }
      const issued = Date.parse(input.requestIssuedAt),
        elapsed = Date.now() - issued;
      if (elapsed > 86400000 || elapsed < -300000)
        throw new ApiError(
          409,
          "operation_expired",
          "Operação expirada. Confira a versão salva antes de continuar.",
        );
      const result = await action(client, user.id);
      if (Date.now() - issued > 86400000)
        throw new ApiError(
          409,
          "operation_expired",
          "Operação expirada; nenhuma alteração confirmada.",
        );
      await client.query(
        "INSERT INTO ecovit_receipts(account_id,operation_id,hash,result) VALUES($1,$2,$3,$4::json)",
        [user.id, input.operationId, fingerprint, JSON.stringify(result)],
      );
      await client.query(
        "UPDATE ecovit_sessions SET last_seen=clock_timestamp() WHERE hash=$1",
        [user.sessionHash],
      );
      return result;
    });
  }
  async function ensureRoom(client: Pool | PoolClient, owner: string) {
    const total = await client.query(
      "SELECT count(*)::int AS count FROM ecovit_projects WHERE owner_id=$1",
      [owner],
    );
    if (total.rows[0].count >= config.projectLimit)
      throw new ApiError(
        422,
        "project_quota",
        "Limite de projetos atingido. Confira também a lixeira.",
      );
  }
  async function associate(
    client: PoolClient,
    owner: string,
    projectId: string,
    doc: RemoteProject,
  ) {
    const ids = resourceIds(doc);
    for (const id of ids) {
      const row = await client.query(
        "SELECT ready,attached,created_at FROM ecovit_assets WHERE id=$1 AND owner_id=$2 AND project_id=$3 FOR UPDATE",
        [uuid.parse(id), owner, projectId],
      );
      if (
        !row.rowCount ||
        !row.rows[0].ready ||
        (!row.rows[0].attached &&
          Date.now() - new Date(row.rows[0].created_at).getTime() >= 86400000)
      )
        throw new ApiError(
          422,
          "asset_expired",
          "Envie novamente a imagem temporária.",
        );
    }
    const old = await client.query(
      "SELECT asset_id FROM ecovit_project_assets WHERE project_id=$1",
      [projectId],
    );
    await client.query(
      "DELETE FROM ecovit_project_assets WHERE project_id=$1",
      [projectId],
    );
    for (const row of old.rows)
      if (!ids.includes(row.asset_id))
        await client.query(
          "UPDATE ecovit_assets SET unreferenced_at=COALESCE(unreferenced_at,clock_timestamp()) WHERE id=$1",
          [row.asset_id],
        );
    for (const id of ids) {
      await client.query(
        "INSERT INTO ecovit_project_assets(project_id,asset_id) VALUES($1,$2)",
        [projectId, id],
      );
      await client.query(
        "UPDATE ecovit_assets SET attached=true,unreferenced_at=NULL WHERE id=$1",
        [id],
      );
    }
  }
  const meta = (doc: RemoteProject) =>
    JSON.stringify({ name: doc.project.name, walls: doc.model.walls.length });
  app.get("/api/projects", { onRequest: protectedRequest }, async (request) => {
    const user = await identity(db, request, config);
    const [rows, usage] = await Promise.all([
      db.query(
        "SELECT id,list_meta,revision::text,state,trashed_at,purge_after,updated_at FROM ecovit_projects WHERE owner_id=$1 AND state<>'purging' ORDER BY updated_at DESC",
        [user.id],
      ),
      db.query(
        "SELECT COALESCE(sum(bytes),0)::text AS bytes,(SELECT count(*)::int FROM ecovit_projects WHERE owner_id=$1) AS projects FROM ecovit_assets WHERE owner_id=$1",
        [user.id],
      ),
    ]);
    return {
      projects: rows.rows.map((row) => ({
        ...row.list_meta,
        id: row.id,
        revision: row.revision,
        state: row.state,
        updatedAt: row.updated_at.toISOString(),
        purgeAfter: row.purge_after?.toISOString() ?? null,
        compatible: true,
      })),
      usage: {
        projects: usage.rows[0].projects,
        bytes: Number(usage.rows[0].bytes),
        projectLimit: config.projectLimit,
        imageLimit: config.imageLimit,
      },
      serverTime: new Date().toISOString(),
    };
  });
  app.get<{ Params: { id: string } }>(
    "/api/projects/:id",
    { onRequest: protectedRequest },
    async (request) => {
      const user = await identity(db, request, config);
      const row = await ownedProject(db, user.id, request.params.id);
      if (
        row.state === "purging" ||
        (row.purge_after && row.purge_after.getTime() <= Date.now())
      )
        throw new ApiError(404, "project_missing", "Projeto indisponível.");
      return {
        remoteVersion: 1,
        doc: row.document,
        revision: row.revision,
        state: row.state,
        updatedAt: row.updated_at.toISOString(),
      };
    },
  );
  app.get<{ Params: { id: string } }>(
    "/api/operations/:id",
    { onRequest: protectedRequest },
    async (request) => {
      const user = await identity(db, request, config);
      const rows = await db.query(
        "SELECT result FROM ecovit_receipts WHERE account_id=$1 AND operation_id=$2",
        [user.id, uuid.parse(request.params.id)],
      );
      if (!rows.rowCount)
        throw new ApiError(
          404,
          "operation_unknown",
          "Confirmação ainda indisponível.",
        );
      return rows.rows[0].result;
    },
  );
  const save = async (request: FastifyRequest, id: string, create: boolean) => {
    const input = mutation.parse(request.body);
    const user = await identity(db, request, config);
    const prior = await db.query(
      "SELECT hash,result FROM ecovit_receipts WHERE account_id=$1 AND operation_id=$2",
      [user.id, input.operationId],
    );
    if (prior.rowCount) {
      if (
        prior.rows[0].hash !==
        hash(canonical({ kind: create ? "create" : "save", id, ...input }))
      )
        throw new ApiError(
          409,
          "operation_content",
          "Esta operação já foi usada com outro conteúdo.",
        );
      return prior.rows[0].result;
    }
    const candidate = remoteBoundary.parse(
      input.doc,
    ) as unknown as RemoteProject;
    if (create) await ensureRoom(db, user.id);
    else {
      const current = await ownedProject(db, user.id, id);
      if (current.state !== "active")
        throw new ApiError(
          409,
          "project_unavailable",
          "O projeto foi removido. Baixe sua versão em memória.",
        );
      if (String(current.revision) !== input.expectedRevision)
        throw new ApiError(
          409,
          "revision_conflict",
          "Outra sessão alterou o projeto. Baixe sua versão ou abra a versão remota.",
        );
    }
    if (
      !candidate?.model ||
      candidate.project?.id !== id ||
      candidate.generated !== null ||
      candidate.generationState?.status !== "outdated"
    )
      throw new ApiError(422, "document", "Intenção remota inválida.");
    const ids = resourceIds(candidate);
    const bytes = await assetData(db, user.id, ids, config, id);
    const storedAssets = await db.query(
      "SELECT id,mime,width,height FROM ecovit_assets WHERE id=ANY($1::uuid[]) AND owner_id=$2",
      [ids, user.id],
    );
    for (const image of [
      ...candidate.model.referenceImages,
      ...candidate.model.customImageAssets,
    ]) {
      const asset = storedAssets.rows.find(
        (row) => row.id === image.resourceId,
      );
      if (
        !asset ||
        asset.mime !== image.mime ||
        asset.width !== image.width ||
        asset.height !== image.height
      )
        throw new ApiError(
          422,
          "asset_metadata",
          "Tipo ou dimensões da imagem diferem do recurso privado.",
        );
    }
    const hydrated = hydrate(candidate, bytes);
    if (create || input.sourceFile)
      await validateIsolated(
        { doc: hydrated, sourceFile: input.sourceFile },
        config.validationMs,
      );
    else checkProject(hydrated);
    return run(
      request,
      input,
      create ? "create" : "save",
      id,
      async (client, owner) => {
        const now = new Date().toISOString();
        let createdAt = now;
        if (create) {
          await ensureRoom(client, owner);
          const existing = await client.query(
            "SELECT 1 FROM ecovit_projects WHERE id=$1",
            [uuid.parse(id)],
          );
          if (existing.rowCount)
            throw new ApiError(
              409,
              "project_exists",
              "Não foi possível criar esta identificação de projeto.",
            );
        } else {
          const row = await ownedProject(client, owner, id, true);
          createdAt = row.document.metadata.createdAt;
          if (row.state !== "active")
            throw new ApiError(
              409,
              "project_unavailable",
              "O projeto foi removido. Baixe sua versão em memória.",
            );
          if (String(row.revision) !== input.expectedRevision)
            throw new ApiError(
              409,
              "revision_conflict",
              "Outra sessão alterou o projeto. Baixe sua versão ou abra a versão remota.",
            );
        }
        const document = {
          ...candidate,
          metadata: {
            ...candidate.metadata,
            updatedAt: now,
            createdAt,
          },
        };
        let nextRevision: string;
        if (create) {
          await client.query(
            "INSERT INTO ecovit_projects(id,owner_id,document,list_meta,created_at,updated_at) VALUES($1,$2,$3::json,$4::json,$5,$5)",
            [id, owner, JSON.stringify(document), meta(document), now],
          );
          nextRevision = "1";
        } else {
          const updated = await client.query(
            "UPDATE ecovit_projects SET document=$1::json,list_meta=$2::json,revision=revision+1,updated_at=$3 WHERE id=$4 RETURNING revision::text",
            [JSON.stringify(document), meta(document), now, id],
          );
          nextRevision = updated.rows[0].revision;
        }
        await associate(client, owner, id, document);
        return {
          projectId: id,
          revision: nextRevision,
          updatedAt: now,
          createdAt,
          operationId: input.operationId,
        };
      },
    );
  };
  app.post<{ Params: { id: string } }>(
    "/api/projects/:id",
    { onRequest: protectedRequest, bodyLimit: 64 * 1024 * 1024 },
    (request) =>
      withSlot(request, () =>
        save(request, uuid.parse(request.params.id), true),
      ),
  );
  app.put<{ Params: { id: string } }>(
    "/api/projects/:id",
    { onRequest: protectedRequest, bodyLimit: 64 * 1024 * 1024 },
    (request) =>
      withSlot(request, () =>
        save(request, uuid.parse(request.params.id), false),
      ),
  );
  app.post<{ Params: { id: string; action: string } }>(
    "/api/projects/:id/:action",
    { onRequest: protectedRequest, bodyLimit: 4096 },
    (request) =>
      withSlot(request, async () => {
        const input = mutation.parse(request.body),
          id = uuid.parse(request.params.id);
        const action = z
          .enum(["trash", "restore", "purge", "duplicate"])
          .parse(request.params.action);
        const userForReceipt = await identity(db, request, config);
        const prior = await db.query(
          "SELECT hash,result FROM ecovit_receipts WHERE account_id=$1 AND operation_id=$2",
          [userForReceipt.id, input.operationId],
        );
        if (prior.rowCount) {
          if (
            prior.rows[0].hash !==
            hash(canonical({ kind: action, id, ...input }))
          )
            throw new ApiError(
              409,
              "operation_content",
              "Esta operação já foi usada com outro conteúdo.",
            );
          return prior.rows[0].result;
        }
        if (action === "duplicate") {
          if (!input.newId || !input.name)
            throw new ApiError(
              422,
              "copy",
              "Informe a identificação e o nome da cópia.",
            );
          const user = await identity(db, request, config);
          const source = await ownedProject(db, user.id, id);
          if (source.state !== "active")
            throw new ApiError(
              409,
              "project_unavailable",
              "A origem não está disponível para duplicar.",
            );
          if (String(source.revision) !== input.expectedRevision)
            throw new ApiError(
              409,
              "revision_conflict",
              "A origem mudou; atualize a lista antes de duplicar.",
            );
          await ensureRoom(db, user.id);
          const sourceDoc = source.document as RemoteProject;
          const preliminary = await db.query(
            "SELECT COALESCE(sum(bytes),0)::text AS used,COALESCE(sum(bytes) FILTER (WHERE id=ANY($2::uuid[])),0)::text AS extra FROM ecovit_assets WHERE owner_id=$1",
            [user.id, resourceIds(sourceDoc)],
          );
          if (
            Number(preliminary.rows[0].used) +
              Number(preliminary.rows[0].extra) >
            config.imageLimit
          )
            throw new ApiError(
              422,
              "image_quota",
              "Espaço de imagens insuficiente para duplicar.",
            );
          const byteMap = await assetData(
            db,
            user.id,
            resourceIds(sourceDoc),
            config,
            id,
          );
          // Copy bytes outside the transaction; final source revision and all permissions are rechecked.
          const replacement: Record<string, string> = {};
          const created: string[] = [];
          try {
            for (const assetId of resourceIds(sourceDoc)) {
              const nextId = randomUUID();
              created.push(nextId);
              replacement[assetId] = nextId;
              await writeFile(
                assetPath(config, nextId, user.id),
                Buffer.from(byteMap[assetId], "base64"),
                { flag: "wx", mode: 0o600 },
              );
            }
            const result = await run(
              request,
              input,
              action,
              id,
              async (client, owner) => {
                const row = await ownedProject(client, owner, id, true);
                if (
                  row.state !== "active" ||
                  String(row.revision) !== input.expectedRevision
                )
                  throw new ApiError(
                    409,
                    "revision_conflict",
                    "A origem mudou; atualize a lista antes de duplicar.",
                  );
                await ensureRoom(client, owner);
                const used = await client.query(
                  "SELECT COALESCE(sum(bytes),0)::text AS bytes FROM ecovit_assets WHERE owner_id=$1",
                  [owner],
                );
                const extra = Object.values(byteMap).reduce(
                  (n, data) => n + Buffer.byteLength(data, "base64"),
                  0,
                );
                if (Number(used.rows[0].bytes) + extra > config.imageLimit)
                  throw new ApiError(
                    422,
                    "image_quota",
                    "Espaço de imagens insuficiente para duplicar.",
                  );
                const doc = structuredClone(sourceDoc);
                doc.project.id = input.newId!;
                doc.project.name = input.name!;
                doc.metadata = {
                  ...doc.metadata,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                for (const image of [
                  ...doc.model.referenceImages,
                  ...doc.model.customImageAssets,
                ])
                  image.resourceId = replacement[image.resourceId];
                checkProject(
                  hydrate(
                    doc,
                    Object.fromEntries(
                      Object.entries(byteMap).map(([key, value]) => [
                        replacement[key],
                        value,
                      ]),
                    ),
                  ),
                );
                await client.query(
                  "INSERT INTO ecovit_projects(id,owner_id,document,list_meta) VALUES($1,$2,$3::json,$4::json)",
                  [input.newId, owner, JSON.stringify(doc), meta(doc)],
                );
                for (const old of Object.keys(replacement)) {
                  await client.query(
                    "INSERT INTO ecovit_assets(id,owner_id,project_id,bytes,hash,mime,width,height,ready,attached) SELECT $1,owner_id,$2,bytes,hash,mime,width,height,true,true FROM ecovit_assets WHERE id=$3 AND owner_id=$4",
                    [replacement[old], input.newId, old, owner],
                  );
                }
                await associate(client, owner, input.newId!, doc);
                return {
                  projectId: input.newId,
                  revision: "1",
                  operationId: input.operationId,
                };
              },
            );
            // A receipt returned by a retry did not consume this attempt's temporary copies.
            for (const file of created) {
              const exists = await db.query(
                "SELECT 1 FROM ecovit_assets WHERE id=$1",
                [file],
              );
              if (!exists.rowCount)
                await rm(assetPath(config, file, user.id), { force: true });
            }
            return result;
          } catch (error) {
            // Wait for the account coordinator: an uncertain COMMIT must finish
            // before absence of rows can prove that unlinking these files is safe.
            try {
              await transaction(db, async (client) => {
                await client.query(
                  "SELECT id FROM ecovit_accounts WHERE id=$1 FOR UPDATE",
                  [user.id],
                );
                for (const file of created) {
                  const row = await client.query(
                    "SELECT 1 FROM ecovit_assets WHERE id=$1",
                    [file],
                  );
                  if (!row.rowCount)
                    await rm(assetPath(config, file, user.id), { force: true });
                }
              });
            } catch {
              /* The orphan sweep retries after database recovery. */
            }
            throw error;
          }
        }
        return run(request, input, action, id, async (client, owner) => {
          const row = await ownedProject(client, owner, id, true);
          if (
            String(row.revision) !== input.expectedRevision ||
            row.state === "purging"
          )
            throw new ApiError(
              409,
              "revision_conflict",
              "O projeto mudou. Atualize a lista.",
            );
          if (
            action === "restore" &&
            (row.state !== "trashed" ||
              new Date(row.purge_after).getTime() <= Date.now())
          )
            throw new ApiError(
              409,
              "trash_expired",
              "O prazo de restauração terminou.",
            );
          if (action === "trash" && row.state !== "active")
            throw new ApiError(
              409,
              "project_unavailable",
              "Projeto já removido.",
            );
          if (action === "purge" && row.state !== "trashed")
            throw new ApiError(
              409,
              "project_unavailable",
              "Envie o projeto à lixeira primeiro.",
            );
          const state =
            action === "trash"
              ? "trashed"
              : action === "restore"
                ? "active"
                : "purging";
          const updated = await client.query(
            "UPDATE ecovit_projects SET state=$1,revision=revision+1,updated_at=clock_timestamp(),trashed_at=CASE WHEN $1='trashed' THEN clock_timestamp() ELSE NULL END,purge_after=CASE WHEN $1='trashed' THEN clock_timestamp()+interval '30 days' ELSE NULL END WHERE id=$2 RETURNING revision::text",
            [state, id],
          );
          return {
            projectId: id,
            revision: updated.rows[0].revision,
            state,
            operationId: input.operationId,
          };
        });
      }),
  );
  app.addContentTypeParser(
    "application/octet-stream",
    { parseAs: "buffer", bodyLimit: 10 * 1024 * 1024 },
    (_request, body, done) => done(null, body),
  );
  app.post<{ Params: { project: string; asset: string } }>(
    "/api/uploads/:project/:asset",
    { onRequest: protectedRequest, bodyLimit: 10 * 1024 * 1024 },
    (request) =>
      withSlot(request, async () => {
        const project = uuid.parse(request.params.project),
          id = uuid.parse(request.params.asset);
        const user = await identity(db, request, config);
        const bytes = request.body as Buffer;
        if (
          !Buffer.isBuffer(bytes) ||
          !bytes.length ||
          bytes.length > 10 * 1024 * 1024
        )
          throw new ApiError(413, "image_size", "Imagem deve ter até 10 MiB.");
        if (uploading.size >= 1)
          throw new ApiError(
            429,
            "upload_busy",
            "Outro envio está em andamento. Aguarde.",
          );
        uploading.add(id);
        let ownsUpload = false;
        try {
          const digest = hash(bytes);
          const completed = await transaction(db, async (client) => {
            const account = await identity(client, request, config, true);
            const target = await client.query(
              "SELECT owner_id,state FROM ecovit_projects WHERE id=$1",
              [project],
            );
            if (
              target.rowCount &&
              (target.rows[0].owner_id !== account.id ||
                target.rows[0].state !== "active")
            )
              throw new ApiError(
                404,
                "project_missing",
                "Projeto indisponível.",
              );
            const old = await client.query(
              "SELECT * FROM ecovit_assets WHERE id=$1",
              [id],
            );
            if (old.rowCount) {
              const row = old.rows[0];
              if (
                row.owner_id !== account.id ||
                row.project_id !== project ||
                row.hash !== digest ||
                Number(row.bytes) !== bytes.length
              )
                throw new ApiError(
                  409,
                  "upload_content",
                  "Identificação de upload já usada.",
                );
              ownsUpload = true;
              if (
                !row.attached &&
                Date.now() - new Date(row.created_at).getTime() > 86400000
              )
                throw new ApiError(
                  409,
                  "upload_expired",
                  "Upload expirado. Inicie uma nova ação.",
                );
              return row.ready;
            }
            const used = await client.query(
              "SELECT COALESCE(sum(bytes),0)::text AS bytes FROM ecovit_assets WHERE owner_id=$1",
              [account.id],
            );
            if (Number(used.rows[0].bytes) + bytes.length > config.imageLimit)
              throw new ApiError(
                422,
                "image_quota",
                "Limite de imagens atingido; temporários e lixeira também contam.",
              );
            await client.query(
              "INSERT INTO ecovit_assets(id,owner_id,project_id,bytes,hash) VALUES($1,$2,$3,$4,$5)",
              [id, account.id, project, bytes.length, digest],
            );
            ownsUpload = true;
            return false;
          });
          if (completed) return { id };
          const info = await validateIsolated(
            { image: bytes.toString("base64") },
            config.validationMs,
          );
          await mkdir(config.dataDir, { recursive: true });
          await writeFile(assetPath(config, id, user.id), bytes, {
            mode: 0o600,
          });
          await transaction(db, async (client) => {
            await identity(client, request, config, true);
            const result = await client.query(
              "UPDATE ecovit_assets SET ready=true,mime=$1,width=$2,height=$3 WHERE id=$4 AND owner_id=$5 AND created_at>clock_timestamp()-interval '24 hours'",
              [info.mime, info.width, info.height, id, user.id],
            );
            if (!result.rowCount)
              throw new ApiError(409, "upload_expired", "Upload expirado.");
          });
          return { id };
        } catch (error) {
          if (ownsUpload)
            try {
              await transaction(db, async (client) => {
                await client.query(
                  "SELECT id FROM ecovit_accounts WHERE id=$1 FOR UPDATE",
                  [user.id],
                );
                const current = await client.query(
                  "SELECT attached FROM ecovit_assets WHERE id=$1 AND owner_id=$2 FOR UPDATE",
                  [id, user.id],
                );
                if (!current.rowCount || !current.rows[0].attached) {
                  await rm(assetPath(config, id, user.id), { force: true });
                  await client.query(
                    "DELETE FROM ecovit_assets WHERE id=$1 AND owner_id=$2 AND attached=false",
                    [id, user.id],
                  );
                }
              });
            } catch {
              /* Retain uncertain resources for the maintenance sweep. */
            }
          throw error;
        } finally {
          uploading.delete(id);
        }
      }),
  );
  app.get<{ Params: { project: string; asset: string } }>(
    "/api/images/:project/:asset",
    { onRequest: protectedRequest },
    async (request, reply) => {
      const user = await identity(db, request, config);
      const row = await ownedProject(db, user.id, request.params.project);
      if (
        row.state === "purging" ||
        (row.purge_after && row.purge_after.getTime() <= Date.now())
      )
        throw new ApiError(404, "asset_missing", "Imagem indisponível.");
      const asset = await db.query(
        "SELECT a.* FROM ecovit_assets a JOIN ecovit_project_assets pa ON pa.asset_id=a.id WHERE pa.project_id=$1 AND a.id=$2 AND a.owner_id=$3 AND a.ready=true",
        [row.id, uuid.parse(request.params.asset), user.id],
      );
      if (!asset.rowCount)
        throw new ApiError(404, "asset_missing", "Imagem indisponível.");
      const bytes = await readFile(
        assetPath(config, asset.rows[0].id, user.id),
        { signal: imageCancellation.get(request)?.signal },
      );
      if (hash(bytes) !== asset.rows[0].hash)
        throw new ApiError(
          422,
          "asset_integrity",
          "Imagem não passou na conferência de integridade.",
        );
      return reply
        .type(asset.rows[0].mime)
        .header("Content-Disposition", "inline")
        .send(bytes);
    },
  );
}
