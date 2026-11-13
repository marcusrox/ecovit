import { expect, it } from "vitest";
import { labelFontSize, LABEL_REFERENCE_SCALE } from "../src/editor/label-font";
import { MIN_CAMERA_SCALE } from "../src/editor/useProjectCamera";

it("T-019 dimensiona etiquetas nos zooms de referência e limita os extremos", () => {
  expect(labelFontSize(13, 0.012 * 0.25, "room")).toBe(10);
  expect(labelFontSize(13, LABEL_REFERENCE_SCALE, "room")).toBe(13);
  expect(labelFontSize(13, 0.012, "room")).toBeCloseTo(16.6448, 3);
  expect(labelFontSize(13, 0.012 * 1.5, "room")).toBe(20);
  expect(labelFontSize(13, MIN_CAMERA_SCALE, "room")).toBe(10);
  expect(labelFontSize(13, 0.12, "room")).toBe(20);
});

it("T-019 conserva bases por tipo e aplica limites dos demais rótulos", () => {
  for (const base of [11, 12, 13]) {
    expect(labelFontSize(base, LABEL_REFERENCE_SCALE)).toBe(base);
    expect(labelFontSize(base, MIN_CAMERA_SCALE)).toBe(9);
    expect(labelFontSize(base, 0.12)).toBe(18);
  }
  expect(labelFontSize(11, 0.012 * 0.25)).toBe(9);
  expect(labelFontSize(11, 0.012 * 1.5)).toBeCloseTo(17.2492, 3);
});

it("T-019 usa escala contínua, cresce parcialmente e permanece finito no intervalo válido", () => {
  const a = LABEL_REFERENCE_SCALE,
    b = a * 1.0001;
  expect(labelFontSize(13, b, "room")).toBeGreaterThan(
    labelFontSize(13, a, "room"),
  );
  expect(
    labelFontSize(13, b, "room") - labelFontSize(13, a, "room"),
  ).toBeLessThan(0.001);
  expect(labelFontSize(11, a * 2)).toBeCloseTo(11 * Math.SQRT2);
  let last = 0;
  for (let i = 0; i <= 100; i++) {
    const scale = MIN_CAMERA_SCALE * (0.12 / MIN_CAMERA_SCALE) ** (i / 100);
    const size = labelFontSize(13, scale, "room");
    expect(Number.isFinite(size)).toBe(true);
    expect(size).toBeGreaterThanOrEqual(last);
    expect(size).toBeGreaterThanOrEqual(10);
    expect(size).toBeLessThanOrEqual(20);
    last = size;
  }
});

it("T-019 aplica a escala uma vez a fontes originalmente proporcionais ao símbolo", () => {
  const worldSize = 10000,
    base = worldSize * LABEL_REFERENCE_SCALE * 0.14;
  expect(labelFontSize(base, LABEL_REFERENCE_SCALE)).toBeCloseTo(base);
  expect(labelFontSize(base, 0.012 * 1.5)).toBeCloseTo(
    base * Math.sqrt(150 / 61),
  );
});
