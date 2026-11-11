// Invoked only by the browser test runner. No test endpoints or fixed codes exist.
import { createServer } from "vite";
import { database, migrate } from "./db";
import { readConfig } from "./config";
import { createApi } from "./app";
import { mkdir, writeFile } from "node:fs/promises";
import {
  loadTestEnvironment,
  validateTestDatabaseUrl,
} from "../scripts/load-test-env";

loadTestEnvironment();
if (process.env.NODE_ENV === "production")
  throw new Error("Servidor de testes bloqueado em produção.");
const url = validateTestDatabaseUrl(process.env.M12_TEST_DATABASE_URL);
const setup = database(url);
await setup.query("CREATE SCHEMA IF NOT EXISTS m12_browser");
await setup.end();
const scoped = new URL(url);
scoped.searchParams.set("options", "-c search_path=m12_browser");
process.env.API_PROXY = "http://127.0.0.1:3002";
const config = readConfig({
  ...process.env,
  NODE_ENV: "test",
  DATABASE_URL: scoped.toString(),
  APP_ORIGIN: "http://127.0.0.1:5174",
  SESSION_SECRET: "isolated-browser-test-secret-not-for-production",
  API_PORT: "3002",
  DATA_DIR: ".tools/m12/browser-assets",
  MAIL_CAPTURE_DIR: ".tools/m12/browser-mail",
});
const db = database(config.databaseUrl);
await migrate(db);
await db.query(
  "TRUNCATE ecovit_accounts,ecovit_challenges,ecovit_deletions,ecovit_rate_limits CASCADE",
);
const api = await createApi(db, config);
await api.listen({ host: "127.0.0.1", port: 3002 });
const vite = await createServer({
  server: { host: "127.0.0.1", port: 5174, strictPort: true },
});
await vite.listen();
await mkdir(".tools/m12", { recursive: true });
await writeFile(
  ".tools/m12/browser-server.json",
  JSON.stringify({ pid: process.pid, runId: process.env.M12_RUN_ID }),
);
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  clearInterval(parentWatch);
  await vite.close();
  await api.close();
  await db.end();
  process.exit(0);
}
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => void close());
// Windows can terminate the runner's command shell before its Node child.
const parent = process.ppid;
const parentWatch = setInterval(() => {
  try {
    process.kill(parent, 0);
  } catch {
    void close();
  }
}, 1000);
parentWatch.unref();
