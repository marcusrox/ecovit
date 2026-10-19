import { afterEach, expect, it, vi } from "vitest";
import {
  preferencesKey,
  readPreferences,
  usePreferences,
  renderingPreferencesKey,
  readHighQualityImages,
} from "../src/state/preferences";

afterEach(() => vi.unstubAllGlobals());

it("M10 qualidade alta tem padrão seguro, persiste separadamente e mantém a sessão após falha", () => {
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  expect(readHighQualityImages()).toBe(true);
  usePreferences.getState().setLabel("wall", false);
  const labels = storage.get(preferencesKey);
  usePreferences.getState().setHighQualityImages(false);
  expect(readHighQualityImages()).toBe(false);
  expect(storage.get(preferencesKey)).toBe(labels);
  storage.set(renderingPreferencesKey, '"false"');
  expect(readHighQualityImages()).toBe(true);
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("quota");
    },
  });
  expect(readHighQualityImages()).toBe(true);
  usePreferences.getState().setHighQualityImages(false);
  expect(usePreferences.getState().highQualityImages).toBe(false);
  expect(usePreferences.getState().error).toContain("não foi salva");
});

it("usa padrões visíveis em armazenamento ausente, inválido ou inacessível", () => {
  for (const value of [
    null,
    "invalid",
    "{}",
    '{"door":false,"window":true,"opening":true,"wall":"false"}',
  ]) {
    vi.stubGlobal("localStorage", { getItem: () => value });
    expect(Object.values(readPreferences())).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
  }
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw new Error("blocked");
    },
  });
  expect(Object.values(readPreferences())).toEqual([
    true,
    true,
    true,
    true,
    true,
  ]);
});

it("preserva preferência na sessão após falha e permite salvar em nova tentativa", () => {
  const storage = new Map<string, string>();
  const setItem = vi.fn(() => {
    throw new Error("quota");
  });
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem,
  });
  usePreferences.setState({ labels: readPreferences(), error: "" });
  usePreferences.getState().setLabel("wall", false);
  expect(usePreferences.getState().labels).toEqual({
    door: true,
    window: true,
    opening: true,
    wall: false,
    measure: true,
  });
  expect(usePreferences.getState().error).toContain("não foi salva");
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  usePreferences.getState().setLabel("door", false);
  expect(usePreferences.getState().error).toBe("");
  expect(readPreferences()).toEqual({
    door: false,
    window: true,
    opening: true,
    wall: false,
    measure: true,
  });
  expect(storage.size).toBe(1);
  expect(storage.has(preferencesKey)).toBe(true);
});

it("M7 acrescenta Medidas sem redefinir escolhas de M6", () => {
  vi.stubGlobal("localStorage", {
    getItem: () =>
      JSON.stringify({
        door: false,
        window: true,
        opening: false,
        wall: false,
      }),
  });
  expect(readPreferences()).toEqual({
    door: false,
    window: true,
    opening: false,
    wall: false,
    measure: true,
  });
});
