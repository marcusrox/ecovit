import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { readReleaseInfo } from "./scripts/release-info";
export default defineConfig(({ mode }) => ({
  // Vitest uses test mode; browser tests override cacheDir in test-main.ts.
  cacheDir:
    mode === "test" ? "node_modules/.vite-ecovit-tests" : "node_modules/.vite",
  plugins: [react()],
  // The PDF loads this renderer on demand; optimize it before serving so the
  // first export does not trigger a development reload and cancel the download.
  optimizeDeps: { include: ["react-dom/server"] },
  define: { __ECOVIT_RELEASE__: JSON.stringify(readReleaseInfo()) },
  server: {
    // Logs, databases and extracted traces are diagnostics, not application inputs.
    watch: { ignored: ["**/.tools/**", "**/playwright-report/**"] },
    proxy: {
      "/api": {
        target: process.env.API_PROXY ?? "http://127.0.0.1:3001",
        changeOrigin: false,
      },
    },
  },
  test: { include: ["tests/**/*.test.ts"] },
}));
