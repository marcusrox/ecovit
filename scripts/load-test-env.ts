import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";

export function loadTestEnvironment(
  file = fileURLToPath(new URL("../.env.test", import.meta.url)),
  environment: NodeJS.ProcessEnv = process.env,
) {
  if (!existsSync(file)) return;
  for (const [key, value] of Object.entries(
    parseEnv(readFileSync(file, "utf8")),
  )) {
    if (environment[key] === undefined) environment[key] = value;
  }
}

export function validateTestDatabaseUrl(value: string | undefined): string {
  try {
    const url = new URL(value ?? "");
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      url.pathname !== "/ecovit_test" ||
      !url.hostname
    )
      throw new Error();
    return url.toString();
  } catch {
    throw new Error(
      "Configure M12_TEST_DATABASE_URL em .env.test para um banco PostgreSQL isolado chamado ecovit_test. Execute npm run test:env.",
    );
  }
}
