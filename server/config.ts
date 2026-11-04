import path from "node:path";

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
  const mailCapture =
    !production && env.NODE_ENV === "test" ? env.MAIL_CAPTURE_DIR : undefined;
  if (!mailCapture && (!env.RESEND_API_KEY || !env.MAIL_FROM))
    throw new Error("Configure RESEND_API_KEY e MAIL_FROM.");
  return {
    production,
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
    cookie: production ? "__Host-ecovit" : "ecovit",
  };
}
