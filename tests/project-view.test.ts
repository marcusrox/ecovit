import { afterEach, expect, it, vi } from "vitest";
import {
  projectViewKey,
  readProjectView,
} from "../src/editor/useProjectCamera";

afterEach(() => vi.unstubAllGlobals());

it("recupera visualização somente do projeto solicitado", () => {
  const value = { centerX: -12000.5, centerY: 45000, scale: 0.024 };
  vi.stubGlobal("localStorage", {
    getItem: (key: string) =>
      key === projectViewKey("a") ? JSON.stringify(value) : null,
  });
  expect(readProjectView("a")).toEqual(value);
  expect(readProjectView("b")).toBeNull();
});

it("recusa preferências corrompidas, coordenadas inválidas e zoom fora dos limites", () => {
  for (const value of [
    "bad",
    "null",
    "{}",
    "[]",
    '{"centerX":"0","centerY":0,"scale":0.012}',
    '{"centerX":1e999,"centerY":0,"scale":0.012}',
    ...[0, -1, 0.001, 0.13, null].map((scale) =>
      JSON.stringify({ centerX: 0, centerY: 0, scale }),
    ),
  ]) {
    vi.stubGlobal("localStorage", { getItem: () => value });
    expect(readProjectView("a")).toBeNull();
  }
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw new Error("blocked");
    },
  });
  expect(readProjectView("a")).toBeNull();
});
