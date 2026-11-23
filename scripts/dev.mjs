import { spawn, spawnSync } from "node:child_process";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile(".env");
} catch {
  console.error(
    "Crie .env a partir de .env.example e configure banco e envio de e-mail antes de iniciar.",
  );
  process.exit(1);
}
console.log("Conferindo e aplicando migrações pendentes do banco local…");
const migration = spawnSync(
  process.execPath,
  ["--import", "tsx", "server/cli.ts", "migrate"],
  { stdio: "inherit", windowsHide: true },
);
if (migration.error || migration.signal || migration.status !== 0) {
  console.error(
    "Inicialização interrompida: não foi possível concluir as migrações do banco local. Confira DATABASE_MIGRATION_URL no .env, a disponibilidade do PostgreSQL e as permissões de ecovit_owner. Corrija a falha indicada acima e execute o comando novamente.",
  );
  process.exit(1);
}
const children = [
  spawn(
    process.execPath,
    ["--watch", "--watch-preserve-output", "--import", "tsx", "server/main.ts"],
    {
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "development" },
    },
  ),
  ...(process.argv.includes("--api-only")
    ? []
    : [
        spawn(
          process.execPath,
          [
            "node_modules/vite/bin/vite.js",
            "--host",
            "127.0.0.1",
            "--port",
            "5173",
            "--strictPort",
          ],
          {
            stdio: "inherit",
            env: {
              ...process.env,
              API_PROXY:
                process.env.API_PROXY ??
                `http://127.0.0.1:${process.env.API_PORT || "3001"}`,
            },
          },
        ),
      ]),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
for (const child of children) child.once("exit", (code) => stop(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => stop());
