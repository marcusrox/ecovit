import { readFile } from "node:fs/promises";
import type { FullConfig } from "@playwright/test";

export default async function stopServer(config: FullConfig) {
  // Windows command shells can keep the runner's captured output pipe open.
  // Stop only the Node test server that proves it belongs to this exact run.
  try {
    const server = JSON.parse(
      await readFile(".tools/m12/browser-server.json", "utf8"),
    );
    if (
      server.runId === config.metadata.m12RunId &&
      Number.isSafeInteger(server.pid) &&
      server.pid > 0
    )
      process.kill(server.pid);
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code !== "ESRCH" &&
      (error as NodeJS.ErrnoException).code !== "ENOENT"
    )
      throw error;
  }
}
