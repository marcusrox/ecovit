import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  // Test browsers use 5174 and must not contend with the user's Vite cache.
  cacheDir:
    process.argv.includes("5174") || !!process.env.API_PROXY
      ? "node_modules/.vite-ecovit-tests"
      : "node_modules/.vite",
  plugins: [react()],
  server: {
    proxy: { "/api": process.env.API_PROXY ?? "http://127.0.0.1:3001" },
  },
  test: { include: ["tests/**/*.test.ts"] },
});
