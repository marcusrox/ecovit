import Fastify from "fastify";
import { mkdir } from "node:fs/promises";
import { ZodError } from "zod";
import type { Pool } from "pg";
import type { Config } from "./config";
import { authRoutes } from "./auth";
import { projectsRoutes } from "./projects";
import { ApiError } from "./security";

export async function createApi(db: Pool, config: Config) {
  await mkdir(config.dataDir, { recursive: true });
  const app = Fastify({
    logger: false,
    bodyLimit: 64 * 1024,
    requestTimeout: 120000,
    handlerTimeout: 100000,
    connectionTimeout: 120000,
    trustProxy: ["127.0.0.1", "::1"],
  });
  app.addHook("onRequest", async (_request, reply) => {
    reply
      .header("Cache-Control", "no-store")
      .header("X-Content-Type-Options", "nosniff")
      .header("Referrer-Policy", "no-referrer");
    reply.header(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    );
  });
  app.setErrorHandler((error, request, reply) => {
    const known = error instanceof ApiError;
    const status =
      error instanceof ZodError
        ? 422
        : known
          ? error.statusCode
          : ((error as { statusCode?: number }).statusCode ?? 500);
    if (status >= 500) {
      const reason = (error as { code?: unknown }).code;
      console.error(
        JSON.stringify({
          event: "api_failure",
          time: new Date().toISOString(),
          requestId: request.id,
          route: request.routeOptions.url,
          status,
          durationMs: Math.round(reply.elapsedTime),
          code:
            typeof reason === "string" && /^[A-Z0-9_]{1,64}$/i.test(reason)
              ? reason
              : "server_error",
        }),
      );
    }
    if (status === 429) reply.header("Retry-After", "60");
    reply.code(status >= 400 && status <= 599 ? status : 500).send({
      code: known
        ? error.code
        : error instanceof ZodError
          ? "invalid_input"
          : status === 413
            ? "payload_size"
            : "server_error",
      message: known
        ? error.message
        : error instanceof ZodError
          ? "Dados inválidos. Confira os campos e o formato enviado."
          : status === 413
            ? "O conteúdo excede o tamanho permitido."
            : "Não foi possível concluir a solicitação. Confira a confirmação antes de tentar novamente.",
      requestId: request.id,
    });
  });
  app.get("/api/health", async () => {
    await db.query("SELECT 1");
    return { ok: true };
  });
  authRoutes(app, db, config);
  projectsRoutes(app, db, config);
  return app;
}
