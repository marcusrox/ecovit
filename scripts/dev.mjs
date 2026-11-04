import { spawn } from "node:child_process";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile(".env");
} catch {
  throw new Error(
    "Crie .env a partir de .env.example e configure banco e envio de e-mail antes de iniciar.",
  );
}
const children = [
  spawn(process.execPath, ["--import", "tsx", "server/main.ts"], {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "development" },
  }),
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
