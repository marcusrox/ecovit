import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  // Test browsers use 5174 and must not contend with the user's Vite cache.
  cacheDir: process.argv.includes("5174")
    ? "node_modules/.vite-ecovit-tests"
    : "node_modules/.vite",
  plugins: [react()],
  test: { include: ["tests/**/*.test.ts"] },
});
