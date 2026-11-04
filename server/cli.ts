import { readConfig } from "./config";
import { database, migrate } from "./db";
import { cleanup } from "./cleanup";
import { mkdir } from "node:fs/promises";

const config = readConfig();
const db = database(
  process.argv[2] === "migrate"
    ? (process.env.DATABASE_MIGRATION_URL ?? config.databaseUrl)
    : config.databaseUrl,
);
try {
  if (process.argv[2] === "migrate") await migrate(db);
  else if (process.argv[2] === "cleanup") {
    await mkdir(config.dataDir, { recursive: true });
    await cleanup(db, config);
  } else throw new Error("Use migrate ou cleanup.");
  console.log("Operação concluída.");
} finally {
  await db.end();
}
