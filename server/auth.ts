import { randomInt, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Pool } from "pg";
import { z } from "zod";
import type { Config } from "./config";
import { transaction } from "./db";
import {
  ApiError,
  cookie,
  cookieHeader,
  equal,
  hash,
  identity,
  rate,
  requireCsrf,
  requireOrigin,
  requireAccountScope,
  sign,
  token,
} from "./security";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .email()
  .refine(
    (email) =>
      /^[\x21-\x7e]+$/.test(email) &&
      email.split("@")[0].length <= 64 &&
      !email.includes('"'),
    "Use um endereço de e-mail de formato usual.",
  );
const challengeSchema = z
  .object({ email: emailSchema, purpose: z.enum(["login", "delete"]) })
  .strict();
const verifySchema = z
  .object({ id: z.string().uuid(), code: z.string().regex(/^\d{6}$/) })
  .strict();
const deletionSchema = z
  .object({
    proof: z.string().min(32).max(100),
    receipt: z.string().min(32).max(100),
  })
  .strict();

export function authRoutes(app: FastifyInstance, db: Pool, config: Config) {
  function flow(request: FastifyRequest) {
    return cookie(request, `${config.cookie}-flow`);
  }
  async function csrf(request: FastifyRequest) {
    requireOrigin(request, config);
    try {
      const account = await identity(db, request, config);
      requireCsrf(request, account.csrf);
    } catch (error) {
      if (!(error instanceof ApiError) || error.statusCode !== 401) throw error;
      if (!flow(request))
        throw new ApiError(403, "csrf", "Carregue a página antes de entrar.");
      requireCsrf(request, sign(config.secret, `csrf:${flow(request)}`));
    }
  }
  app.get("/api/session", async (request, reply) => {
    let nonce = flow(request);
    if (!nonce) {
      nonce = token();
      reply.header(
        "Set-Cookie",
        cookieHeader(config, `${config.cookie}-flow`, nonce, 86400),
      );
    }
    let account = null;
    try {
      account = await identity(db, request, config);
      await db.query(
        "UPDATE ecovit_sessions SET last_seen=clock_timestamp() WHERE hash=$1",
        [account.sessionHash],
      );
    } catch (error) {
      if (!(error instanceof ApiError) || error.statusCode !== 401) throw error;
    }
    return {
      account: account ? { id: account.id, email: account.email } : null,
      csrf: account?.csrf ?? sign(config.secret, `csrf:${nonce}`),
      serverTime: new Date().toISOString(),
    };
  });
  app.post(
    "/api/auth/code",
    { bodyLimit: 2048, onRequest: csrf },
    async (request) => {
      const input = challengeSchema.parse(request.body);
      const current =
        input.purpose === "delete" ? await identity(db, request, config) : null;
      if (current) requireAccountScope(request, current.id);
      if (current && current.email !== input.email)
        throw new ApiError(403, "email", "Use o e-mail da conta autenticada.");
      const providerWait = await db.query(
        "SELECT 1 FROM ecovit_rate_limits WHERE key='mail-provider' AND bucket=0 AND expires_at>clock_timestamp()",
      );
      if (providerWait.rowCount)
        throw new ApiError(
          503,
          "mail_unavailable",
          "O serviço de e-mail pediu uma pausa. Aguarde antes de solicitar outro código.",
        );
      await rate(db, `mail:${hash(input.email)}`, 5);
      await rate(db, `mail-ip:${hash(request.ip)}`, 20);
      const flowHash = hash(flow(request));
      const id = randomUUID(),
        code = String(randomInt(0, 1000000)).padStart(6, "0");
      await transaction(db, async (client) => {
        await client.query(
          "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
          [`challenge:${flowHash}`],
        );
        if (current) await identity(client, request, config, true);
        const cooldown = await client.query(
          "INSERT INTO ecovit_rate_limits(key,bucket,expires_at) VALUES($1,0,clock_timestamp()+interval '60 seconds') ON CONFLICT(key,bucket) DO UPDATE SET expires_at=EXCLUDED.expires_at WHERE ecovit_rate_limits.expires_at<=clock_timestamp() RETURNING key",
          [`mail-cooldown:${flowHash}`],
        );
        if (!cooldown.rowCount)
          throw new ApiError(
            429,
            "resend_wait",
            "Aguarde 60 segundos para solicitar outro código.",
          );
        await client.query(
          "DELETE FROM ecovit_challenges WHERE flow_hash=$1 AND purpose=$2",
          [flowHash, input.purpose],
        );
        await client.query(
          "INSERT INTO ecovit_challenges(id,email,purpose,code_hash,flow_hash,session_hash,expires_at) VALUES($1,$2,$3,$4,$5,$6,clock_timestamp()+interval '10 minutes')",
          [
            id,
            input.email,
            input.purpose,
            sign(config.secret, `${id}:${code}`),
            flowHash,
            current?.sessionHash ?? null,
          ],
        );
      });
      let uncertain = false;
      try {
        if (config.mailCapture) {
          await mkdir(config.mailCapture, { recursive: true });
          await writeFile(
            path.join(config.mailCapture, `${id}.json`),
            JSON.stringify({
              id,
              email: input.email,
              code,
              purpose: input.purpose,
            }),
            { flag: "wx", mode: 0o600 },
          );
        } else {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            signal: AbortSignal.timeout(15000),
            headers: {
              Authorization: `Bearer ${config.resendKey}`,
              "Content-Type": "application/json",
              "Idempotency-Key": `ecovit-code/${id}`,
            },
            body: JSON.stringify({
              from: config.mailFrom,
              to: [input.email],
              subject:
                input.purpose === "delete"
                  ? "Ecovit — confirmar exclusão da conta"
                  : "Seu código de acesso ao Ecovit",
              text: `Seu código é ${code}. Válido por 10 minutos. ${input.purpose === "delete" ? "Este código confirma a exclusão da sua conta e dos projetos." : "Não compartilhe este código."}`,
            }),
          });
          const retry = response.headers.get("Retry-After");
          const waitSeconds = retry
            ? /^\d+$/.test(retry)
              ? Number(retry)
              : Math.ceil((Date.parse(retry) - Date.now()) / 1000)
            : response.status === 429
              ? 60
              : 0;
          if (Number.isFinite(waitSeconds) && waitSeconds > 0)
            await db.query(
              "INSERT INTO ecovit_rate_limits(key,bucket,expires_at) VALUES('mail-provider',0,clock_timestamp()+($1*interval '1 second')) ON CONFLICT(key,bucket) DO UPDATE SET expires_at=GREATEST(ecovit_rate_limits.expires_at,EXCLUDED.expires_at)",
              [Math.min(waitSeconds, 86400)],
            );
          if (response.status >= 500) uncertain = true;
          else if (!response.ok)
            throw new ApiError(
              503,
              "mail_unavailable",
              "Não foi possível solicitar o código. Aguarde e tente novamente.",
            );
        }
      } catch (error) {
        if (error instanceof ApiError) {
          await db.query("DELETE FROM ecovit_challenges WHERE id=$1", [id]);
          throw error;
        }
        uncertain = true;
      }
      await db.query("UPDATE ecovit_challenges SET sent=true WHERE id=$1", [
        id,
      ]);
      return {
        id,
        uncertain,
        retryAfter: 60,
        message: "Código solicitado. Confira seu e-mail e a pasta de spam.",
      };
    },
  );
  app.post(
    "/api/auth/verify",
    { bodyLimit: 2048, onRequest: csrf },
    async (request, reply) => {
      const input = verifySchema.parse(request.body);
      await rate(db, `verify-ip:${hash(request.ip)}`, 60);
      const rawSession = token(),
        csrfToken = token();
      const outcome = await transaction(db, async (client) => {
        const peek = await client.query(
          "SELECT email FROM ecovit_challenges WHERE id=$1 AND flow_hash=$2",
          [input.id, hash(flow(request))],
        );
        if (peek.rowCount)
          await client.query(
            "SELECT id FROM ecovit_accounts WHERE email=$1 FOR UPDATE",
            [peek.rows[0].email],
          );
        const rows = await client.query(
          "SELECT * FROM ecovit_challenges WHERE id=$1 AND flow_hash=$2 FOR UPDATE",
          [input.id, hash(flow(request))],
        );
        const challenge = rows.rows[0];
        if (
          !challenge ||
          !challenge.sent ||
          challenge.attempts >= 5 ||
          new Date(challenge.expires_at).getTime() <= Date.now()
        )
          return { error: "Código expirado ou indisponível. Solicite outro." };
        await client.query(
          "UPDATE ecovit_challenges SET attempts=attempts+1 WHERE id=$1",
          [input.id],
        );
        if (
          !equal(
            challenge.code_hash,
            sign(config.secret, `${input.id}:${input.code}`),
          )
        )
          return { error: "Código inválido." };
        if (challenge.purpose === "delete") {
          // identity locks are obtained before the deletion is finalized, never grant access via a receipt.
          const account = await identity(client, request, config);
          if (
            account.sessionHash !== challenge.session_hash ||
            account.email !== challenge.email
          )
            return {
              error: "A sessão mudou. Solicite outro código de exclusão.",
            };
          const proof = token(),
            receipt = token();
          await client.query(
            "INSERT INTO ecovit_deletions(token_hash,account_id,session_hash,proof_hash,expires_at,proof_expires_at) VALUES($1,$2,$3,$4,clock_timestamp()+interval '24 hours',clock_timestamp()+interval '10 minutes')",
            [hash(receipt), account.id, account.sessionHash, hash(proof)],
          );
          await client.query("DELETE FROM ecovit_challenges WHERE id=$1", [
            input.id,
          ]);
          return { deletion: { proof, receipt } };
        }
        await client.query(
          "INSERT INTO ecovit_accounts(id,email) VALUES($1,$2) ON CONFLICT(email) DO NOTHING",
          [randomUUID(), challenge.email],
        );
        const accounts = await client.query(
          "SELECT id,email,state FROM ecovit_accounts WHERE email=$1 FOR UPDATE",
          [challenge.email],
        );
        const account = accounts.rows[0];
        if (account.state !== "active")
          return { error: "A exclusão da conta está em processamento." };
        await client.query(
          "INSERT INTO ecovit_sessions(hash,account_id,csrf) VALUES($1,$2,$3)",
          [hash(rawSession), account.id, csrfToken],
        );
        await client.query("DELETE FROM ecovit_sessions WHERE hash=$1", [
          hash(cookie(request, config.cookie)),
        ]);
        await client.query("DELETE FROM ecovit_challenges WHERE id=$1", [
          input.id,
        ]);
        return {
          account: { id: account.id as string, email: account.email as string },
        };
      });
      if (outcome.error) throw new ApiError(422, "invalid_code", outcome.error);
      if (outcome.account)
        reply.header(
          "Set-Cookie",
          cookieHeader(config, config.cookie, rawSession, 30 * 86400),
        );
      return {
        ...outcome,
        csrf: outcome.account ? csrfToken : undefined,
        serverTime: new Date().toISOString(),
      };
    },
  );
  app.post("/api/logout", { onRequest: csrf }, async (request, reply) => {
    const account = await identity(db, request, config);
    requireAccountScope(request, account.id);
    await db.query("DELETE FROM ecovit_sessions WHERE hash=$1", [
      account.sessionHash,
    ]);
    reply.header("Set-Cookie", cookieHeader(config, config.cookie, "", 0));
    return { ok: true };
  });
  app.post(
    "/api/account/delete",
    { bodyLimit: 2048, onRequest: csrf },
    async (request, reply) => {
      const input = deletionSchema.parse(request.body);
      await transaction(db, async (client) => {
        const account = await identity(client, request, config, true);
        requireAccountScope(request, account.id);
        const result = await client.query(
          "SELECT * FROM ecovit_deletions WHERE token_hash=$1 AND account_id=$2 FOR UPDATE",
          [hash(input.receipt), account.id],
        );
        const row = result.rows[0];
        if (
          !row ||
          row.session_hash !== account.sessionHash ||
          !equal(row.proof_hash, hash(input.proof)) ||
          new Date(row.proof_expires_at).getTime() <= Date.now() ||
          row.accepted_at
        )
          throw new ApiError(
            422,
            "deletion_proof",
            "Solicite um novo código de exclusão.",
          );
        await client.query(
          "UPDATE ecovit_accounts SET state='deleting',deleting_at=clock_timestamp() WHERE id=$1",
          [account.id],
        );
        await client.query(
          "UPDATE ecovit_deletions SET accepted_at=clock_timestamp() WHERE token_hash=$1",
          [hash(input.receipt)],
        );
        await client.query("DELETE FROM ecovit_sessions WHERE account_id=$1", [
          account.id,
        ]);
        await client.query("DELETE FROM ecovit_challenges WHERE email=$1", [
          account.email,
        ]);
      });
      reply.header("Set-Cookie", cookieHeader(config, config.cookie, "", 0));
      return { accepted: true };
    },
  );
  app.post(
    "/api/account/deletion-receipt",
    {
      bodyLimit: 1024,
      onRequest: async (request) => requireOrigin(request, config),
    },
    async (request) => {
      const input = z
        .object({ receipt: z.string().min(32).max(100) })
        .strict()
        .parse(request.body);
      await rate(db, `receipt-ip:${hash(request.ip)}`, 120);
      const result = await db.query(
        "SELECT accepted_at,completed FROM ecovit_deletions WHERE token_hash=$1 AND expires_at>clock_timestamp()",
        [hash(input.receipt)],
      );
      if (!result.rowCount)
        throw new ApiError(
          404,
          "receipt_missing",
          "Recibo indisponível ou expirado.",
        );
      return {
        accepted: !!result.rows[0].accepted_at,
        completed: result.rows[0].completed,
      };
    },
  );
}
