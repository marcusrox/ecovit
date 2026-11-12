import { readConfig } from "./config";
import { database, migrate } from "./db";
import { MigrationError } from "./migrations";
import { cleanup } from "./cleanup";
import { mkdir, readFile } from "node:fs/promises";
import { parseEnv } from "node:util";

let db: ReturnType<typeof database> | undefined;
try {
  if (process.argv[2] === "migrate") {
    // Read data, never source .env as shell or pass its secrets through argv.
    const env = parseEnv(await readFile(".env", "utf8"));
    const connection = env.DATABASE_MIGRATION_URL?.trim();
    if (!connection)
      throw new MigrationError(
        "Configure DATABASE_MIGRATION_URL no .env privado com a role ecovit_owner.",
      );
    let url: URL;
    try {
      url = new URL(connection);
    } catch {
      throw new MigrationError("DATABASE_MIGRATION_URL inválida no .env.");
    }
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      decodeURIComponent(url.username) !== "ecovit_owner" ||
      !url.password ||
      url.password === "CHANGE_ME" ||
      !url.hostname ||
      url.pathname.length < 2 ||
      url.search ||
      url.hash
    )
      throw new MigrationError(
        "DATABASE_MIGRATION_URL deve apontar para o banco com a role ecovit_owner, senha válida e sem opções adicionais.",
      );
    // Production migrations always target the application schema.
    url.searchParams.set("options", "-c search_path=public");
    db = database(url.toString());
    const identity =
      await db.query(`SELECT current_user='ecovit_owner' AND NOT r.rolsuper
      AND d.datdba=r.oid AS valid FROM pg_roles r JOIN pg_database d
      ON d.datname=current_database() WHERE r.rolname=current_user`);
    if (identity.rows[0]?.valid !== true)
      throw new MigrationError(
        "A migração exige ecovit_owner como proprietário do banco, sem superuser.",
      );
    await migrate(db);
  } else if (process.argv[2] === "cleanup") {
    const config = readConfig();
    db = database(config.databaseUrl);
    await mkdir(config.dataDir, { recursive: true });
    await cleanup(db, config);
  } else throw new MigrationError("Use migrate ou cleanup.");
  console.log("Operação concluída.");
} catch (error) {
  console.error(
    error instanceof MigrationError
      ? error.message
      : "Operação administrativa falhou. Confira o .env, a conexão, as permissões e a disponibilidade do PostgreSQL. Nenhum segredo é exibido.",
  );
  process.exitCode = 1;
} finally {
  await db?.end();
}
