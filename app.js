import { loadEnvFile } from "node:process";

loadEnvFile();
await import("./dist-server/main.mjs");
