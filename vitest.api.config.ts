import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/server/*.integration.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
