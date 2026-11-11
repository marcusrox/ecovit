import { defineConfig } from "vitest/config";
import { loadTestEnvironment } from "./scripts/load-test-env";
loadTestEnvironment();
export default defineConfig({
  test: {
    include: ["tests/server/*.integration.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
