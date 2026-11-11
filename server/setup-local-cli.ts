import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import path from "node:path";
import { setupLocal, LocalSetupError } from "./setup-local";

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error(
    "Execute npm run db:setup:local em um terminal interativo para informar as credenciais localmente.",
  );
  process.exitCode = 1;
} else {
  let hidden = false;
  const output = new Writable({
    write(chunk, _encoding, done) {
      if (!hidden) process.stdout.write(chunk);
      done();
    },
  });
  Object.defineProperty(output, "columns", {
    get: () => process.stdout.columns,
  });
  const input = createInterface({
    input: process.stdin,
    output,
    terminal: true,
    historySize: 0,
  });
  const cancelled = new AbortController();
  input.on("SIGINT", () => {
    cancelled.abort();
  });
  async function ask(label: string, fallback = "", secret = false) {
    const answer = input.question(
      `${label}${fallback ? ` [${fallback}]` : ""}: `,
      { signal: cancelled.signal },
    );
    hidden = secret;
    try {
      return (await answer) || fallback;
    } finally {
      hidden = false;
      if (secret) process.stdout.write("\n");
    }
  }
  try {
    console.log(
      "Configuração do PostgreSQL local. Informe um administrador superuser da instância.",
    );
    console.log("Pressione Enter para aceitar os valores entre colchetes.");
    const host = await ask("Endereço", "127.0.0.1");
    const port = Number(await ask("Porta", "5432"));
    const user = await ask("Usuário administrador", "postgres");
    const password = await ask(
      "Senha administrativa (entrada oculta)",
      "",
      true,
    );
    await setupLocal({
      directory: path.resolve(import.meta.dirname, ".."),
      host,
      port,
      user,
      password,
      secret: (label) => ask(label.replace(/: $/, ""), "", true),
      report: console.log,
    });
    console.log(
      "Complete as configurações de e-mail no .env conforme o README e execute .\\Start-Ecovit.ps1.",
    );
  } catch (error) {
    console.error(
      error instanceof LocalSetupError
        ? error.message
        : "Setup interrompido. Confira a configuração e execute novamente.",
    );
    process.exitCode = 1;
  } finally {
    input.close();
  }
}
