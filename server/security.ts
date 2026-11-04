import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { FastifyRequest } from "fastify";
import type { Pool, PoolClient } from "pg";
import type { Config } from "./config";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
export const token = () => randomBytes(32).toString("base64url");
export const sign = (secret: string, value: string) =>
  createHmac("sha256", secret).update(value).digest("hex");
export function equal(a: string, b: string) {
  const left = Buffer.from(a),
    right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function cookie(request: FastifyRequest, name: string) {
  return (
    request.headers.cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? ""
  );
}
export function cookieHeader(
  config: Config,
  name: string,
  value: string,
  seconds: number,
  httpOnly = true,
) {
  return `${name}=${value}; Path=/; SameSite=Lax; Max-Age=${seconds}${httpOnly ? "; HttpOnly" : ""}${config.production ? "; Secure" : ""}`;
}
export async function rate(
  db: Pool | PoolClient,
  key: string,
  maximum: number,
  period = 3600,
) {
  const bucket = Math.floor(Date.now() / (period * 1000));
  const result = await db.query(
    "INSERT INTO ecovit_rate_limits(key,bucket) VALUES($1,$2) ON CONFLICT(key,bucket) DO UPDATE SET hits=ecovit_rate_limits.hits+1 RETURNING hits",
    [key, bucket],
  );
  if (result.rows[0].hits > maximum)
    throw new ApiError(
      429,
      "rate_limit",
      "Limite de solicitações atingido. Aguarde antes de tentar novamente.",
    );
}
export type Identity = {
  id: string;
  email: string;
  sessionHash: string;
  csrf: string;
};
export async function identity(
  db: Pool | PoolClient,
  request: FastifyRequest,
  config: Config,
  lock = false,
): Promise<Identity> {
  const sessionHash = hash(cookie(request, config.cookie));
  // The account coordinator must be locked before the session row everywhere.
  if (lock) {
    const session = await db.query(
      "SELECT account_id FROM ecovit_sessions WHERE hash=$1",
      [sessionHash],
    );
    const account = session.rowCount
      ? await db.query(
          "SELECT id,email FROM ecovit_accounts WHERE id=$1 AND state='active' FOR UPDATE",
          [session.rows[0].account_id],
        )
      : null;
    if (!account?.rowCount)
      throw new ApiError(
        401,
        "session_expired",
        "Entre por código para continuar. Seu trabalho permanece nesta página.",
      );
    const current = await db.query(
      "SELECT csrf FROM ecovit_sessions WHERE hash=$1 AND account_id=$2 AND created_at>clock_timestamp()-interval '30 days' AND last_seen>clock_timestamp()-interval '7 days' FOR UPDATE",
      [sessionHash, account.rows[0].id],
    );
    if (!current.rowCount)
      throw new ApiError(
        401,
        "session_expired",
        "Entre por código para continuar. Seu trabalho permanece nesta página.",
      );
    return { ...account.rows[0], csrf: current.rows[0].csrf, sessionHash };
  }
  const result = await db.query(
    "SELECT a.id,a.email,s.csrf FROM ecovit_accounts a JOIN ecovit_sessions s ON s.account_id=a.id WHERE s.hash=$1 AND a.state='active' AND s.created_at>clock_timestamp()-interval '30 days' AND s.last_seen>clock_timestamp()-interval '7 days'",
    [sessionHash],
  );
  if (!result.rowCount)
    throw new ApiError(
      401,
      "session_expired",
      "Entre por código para continuar. Seu trabalho permanece nesta página.",
    );
  return { ...result.rows[0], sessionHash };
}
export function requireOrigin(request: FastifyRequest, config: Config) {
  if (request.headers.origin !== config.origin)
    throw new ApiError(403, "origin", "Origem não autorizada.");
}
export function requireCsrf(request: FastifyRequest, expected: string) {
  const supplied = request.headers["x-csrf-token"];
  if (typeof supplied !== "string" || !equal(supplied, expected))
    throw new ApiError(403, "csrf", "Atualize a sessão antes de continuar.");
}
export function requireAccountScope(request: FastifyRequest, account: string) {
  const intended = request.headers["x-ecovit-account"];
  if (intended && intended !== account)
    throw new ApiError(
      409,
      "account_changed",
      "A conta mudou. Entre na conta original para retomar esta página.",
    );
}
