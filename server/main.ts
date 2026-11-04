import { readConfig } from "./config";
import { database } from "./db";
import { createApi } from "./app";

const config = readConfig();
const db = database(config.databaseUrl);
const app = await createApi(db, config);
await app.listen({ host: config.host, port: config.port });
console.log(`API Ecovit: ${config.host}:${config.port}`);
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.once(signal, async () => {
    await app.close();
    await db.end();
  });
