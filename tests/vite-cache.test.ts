import { afterEach, expect, it, vi } from "vitest";
import configuration from "../vite.config";

afterEach(() => vi.unstubAllEnvs());

it.each(["http://127.0.0.1:3001", "http://127.0.0.1:3002"])(
  "proxy %s não mistura os caches de desenvolvimento e testes",
  async (proxy) => {
    vi.stubEnv("API_PROXY", proxy);
    const dev = await configuration({ command: "serve", mode: "development" });
    const test = await configuration({ command: "serve", mode: "test" });
    expect(dev.cacheDir).toBe("node_modules/.vite");
    expect(test.cacheDir).toBe("node_modules/.vite-ecovit-tests");
    expect(dev.cacheDir).not.toBe(test.cacheDir);
    expect(dev.server?.proxy?.["/api"]).toMatchObject({ target: proxy });
  },
);
