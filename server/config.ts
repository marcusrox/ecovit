import path from "node:path";
import { z } from "zod";

export const emailSchema = z
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

export type Config = ReturnType<typeof readConfig>;
export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  function positive(
    name: string,
    fallback: number,
    maximum = Number.MAX_SAFE_INTEGER,
  ) {
    const value = Number(env[name] ?? fallback);
    if (!Number.isSafeInteger(value) || value <= 0 || value > maximum)
      throw new Error(
        `${name} precisa ser um inteiro positivo até ${maximum}.`,
      );
    return value;
  }
  const production = env.NODE_ENV === "production";
  const secret = env.SESSION_SECRET ?? "";
  if (secret.length < 32)
    throw new Error("SESSION_SECRET precisa de pelo menos 32 caracteres.");
  if (!env.DATABASE_URL)
    throw new Error("Configure DATABASE_URL para PostgreSQL 18.0.");
  const origin = new URL(env.APP_ORIGIN ?? "http://127.0.0.1:5174").origin;
  if (production && !origin.startsWith("https://"))
    throw new Error("APP_ORIGIN exige HTTPS em produção.");
  let devLoginEmail: string | undefined;
  if (env.NODE_ENV === "development" && env.DEV_LOGIN_EMAIL?.trim()) {
    const email = emailSchema.safeParse(env.DEV_LOGIN_EMAIL);
    if (!email.success)
      throw new Error("DEV_LOGIN_EMAIL precisa ser um e-mail válido.");
    if (
      new URL(origin).hostname !== "127.0.0.1" ||
      !origin.startsWith("http://")
    )
      throw new Error("DEV_LOGIN_EMAIL exige APP_ORIGIN em http://127.0.0.1.");
    devLoginEmail = email.data;
  }
  const mailCapture =
    !production && env.NODE_ENV === "test" ? env.MAIL_CAPTURE_DIR : undefined;
  if (!mailCapture && (!env.RESEND_API_KEY || !env.MAIL_FROM))
    throw new Error("Configure RESEND_API_KEY e MAIL_FROM.");
  return {
    production,
    devLoginEmail,
    secret,
    origin,
    databaseUrl: env.DATABASE_URL,
    port: positive("API_PORT", 3001, 65535),
    host: "127.0.0.1",
    dataDir: path.resolve(env.DATA_DIR || ".data/ecovit"),
    mailCapture: mailCapture ? path.resolve(mailCapture) : undefined,
    resendKey: env.RESEND_API_KEY ?? "",
    mailFrom: env.MAIL_FROM ?? "",
    projectLimit: positive("PROJECT_LIMIT", 20),
    imageLimit: positive("IMAGE_LIMIT", 524288000),
    validationMs: positive("VALIDATION_TIMEOUT_MS", 90000, 90000),
    cookie: production ? "__Host-ecovit" : devLoginEmail ? "ecovit-dev" : "ecovit",
  };
}
