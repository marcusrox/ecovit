import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { database, migrate } from "../../server/db";
import { loadMigrations, type Migration } from "../../server/migrations";
import { validateTestDatabaseUrl } from "../../scripts/load-test-env";

const url = new URL(validateTestDatabaseUrl(process.env.M12_TEST_DATABASE_URL));
const root = database(url.toString());
const schema = `t017_${randomUUID().replaceAll("-", "")}`;
url.searchParams.set("options", `-c search_path=${schema}`);
const db = database(url.toString());
let initial: Migration[];

beforeAll(async () => {
  initial = await loadMigrations();
  await root.query(`CREATE SCHEMA ${schema}`);
});
beforeEach(async () => {
  await root.query(`DROP SCHEMA ${schema} CASCADE; CREATE SCHEMA ${schema}`);
});
afterAll(async () => {
  await db.end();
  await root.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await root.end();
});

async function history() {
  return (
    await db.query(
      "SELECT version,applied_at FROM ecovit_migrations ORDER BY version",
    )
  ).rows;
}
async function structure() {
  return (
    await db.query(`SELECT c.relname,c.relkind,a.attname,a.atttypid,a.attnotnull,
    pg_get_expr(d.adbin,d.adrelid) AS default_value
    FROM pg_class c LEFT JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0
    LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
    WHERE c.relnamespace=current_schema()::regnamespace ORDER BY c.relname,a.attnum`)
  ).rows;
}

describe("incremental PostgreSQL migrations", () => {
  it("preserves the legacy SQL structure, data and original history on repeat", async () => {
    // Start with the previously delivered SQL, not the new executor.
    await db.query(initial[0].sql);
    const originalStructure = await structure();
    const originalHistory = await history();
    const id = randomUUID();
    await db.query("INSERT INTO ecovit_accounts(id,email) VALUES($1,$2)", [
      id,
      "preserved@example.invalid",
    ]);
    await migrate(db);
    await migrate(db);
    expect(await structure()).toEqual(originalStructure);
    expect(await history()).toEqual(originalHistory);
    expect(
      (await db.query("SELECT id FROM ecovit_accounts WHERE id=$1", [id]))
        .rowCount,
    ).toBe(1);
  });

  it("creates the same initial schema in an empty schema", async () => {
    await migrate(db);
    expect((await history()).map((r) => r.version)).toEqual([1]);
    const actual = await structure();
    await root.query(`DROP SCHEMA ${schema} CASCADE; CREATE SCHEMA ${schema}`);
    await db.query(initial[0].sql);
    expect(await structure()).toEqual(actual);
  });

  it("rolls back a failing version and resumes after successful predecessors", async () => {
    const second = {
      version: 2,
      sql: "CREATE TABLE migration_probe(value int); INSERT INTO migration_probe VALUES(2)",
    };
    await expect(
      migrate(db, [
        ...initial,
        second,
        {
          version: 3,
          sql: "INSERT INTO migration_probe VALUES(3); SELECT 1/0",
        },
      ]),
    ).rejects.toThrow("migração 3");
    expect((await history()).map((r) => r.version)).toEqual([1, 2]);
    expect((await db.query("SELECT value FROM migration_probe")).rows).toEqual([
      { value: 2 },
    ]);
    await migrate(db, [
      ...initial,
      second,
      { version: 3, sql: "INSERT INTO migration_probe VALUES(3)" },
    ]);
    expect(
      (await db.query("SELECT value FROM migration_probe ORDER BY value")).rows,
    ).toEqual([{ value: 2 }, { value: 3 }]);
    expect((await history()).map((r) => r.version)).toEqual([1, 2, 3]);
  });

  it("serializes concurrent runners across inspection and pending versions", async () => {
    const sequence = [
      ...initial,
      {
        version: 2,
        sql: "SELECT pg_sleep(0.15); CREATE TABLE migration_probe(value int); INSERT INTO migration_probe VALUES(1)",
      },
    ];
    await Promise.all([migrate(db, sequence), migrate(db, sequence)]);
    expect((await history()).map((r) => r.version)).toEqual([1, 2]);
    expect(
      (await db.query("SELECT count(*)::int AS count FROM migration_probe"))
        .rows[0].count,
    ).toBe(1);
  });

  it.each([[1, 1], [1, 3], [2], [1, 2, 2]])(
    "rejects invalid migration sequence %j before mutation",
    async (...versions: number[]) => {
      await expect(
        migrate(
          db,
          versions.map((version) => ({
            version,
            sql: "CREATE TABLE forbidden(id int)",
          })),
        ),
      ).rejects.toThrow("Sequência");
      expect(
        (
          await db.query(
            "SELECT count(*)::int AS count FROM pg_class WHERE relnamespace=current_schema()::regnamespace",
          )
        ).rows[0].count,
      ).toBe(0);
    },
  );

  it.each(["gap", "empty", "future"])(
    "rejects %s history without applying new SQL",
    async (kind) => {
      await migrate(db);
      if (kind === "gap")
        await db.query("UPDATE ecovit_migrations SET version=2");
      if (kind === "empty") await db.query("DELETE FROM ecovit_migrations");
      if (kind === "future")
        await db.query("INSERT INTO ecovit_migrations(version) VALUES(2)");
      const previous = await history();
      await expect(migrate(db)).rejects.toThrow(/inconsistente|desconhecida/);
      expect(await history()).toEqual(previous);
    },
  );

  it("refuses to adopt preexisting data without migration history", async () => {
    await db.query(
      "CREATE TABLE unrelated(value text); INSERT INTO unrelated VALUES('keep')",
    );
    await expect(migrate(db)).rejects.toThrow("histórico de migrações ausente");
    expect((await db.query("SELECT * FROM unrelated")).rows).toEqual([
      { value: "keep" },
    ]);
    expect(
      (await db.query("SELECT to_regclass('ecovit_accounts') AS name")).rows[0]
        .name,
    ).toBeNull();
  });
});
