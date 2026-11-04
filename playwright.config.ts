import { defineConfig } from "@playwright/test";
import { randomUUID } from "node:crypto";
const runId = randomUUID();
export default defineConfig({
  metadata: { m12RunId: runId },
  globalTeardown: "./tests/e2e/stop-server.ts",
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:5174",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chrome", use: { channel: "chrome" } },
    { name: "edge", use: { channel: "msedge" } },
  ],
  webServer: {
    env: { M12_RUN_ID: runId },
    command: `"${process.execPath}" --import tsx server/test-main.ts`,
    url: "http://127.0.0.1:5174",
    reuseExistingServer: false,
  },
});
