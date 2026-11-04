import { build } from "esbuild";
import { copyFile } from "node:fs/promises";
await build({
  entryPoints: ["server/main.ts", "server/cli.ts", "server/validate-worker.ts"],
  outdir: "dist-server",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  packages: "external",
  sourcemap: true,
});
await copyFile("server/schema.sql", "dist-server/schema.sql");
