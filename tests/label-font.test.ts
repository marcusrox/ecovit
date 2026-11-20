import { expect, it } from "vitest";
import {
  labelFontSize,
  labelSpacing,
  LABEL_REFERENCE_SCALE,
} from "../src/editor/label-font";
import { MIN_CAMERA_SCALE } from "../src/editor/useProjectCamera";

it("T-019 dimensiona etiquetas nos zooms de referência e limita os extremos", () => {
  expect(labelFontSize(13, 0.012 * 0.25, "room")).toBeCloseTo(7.613, 2);
  expect(labelFontSize(13, LABEL_REFERENCE_SCALE, "room")).toBe(13);
  expect(labelFontSize(13, 0.012, "room")).toBeCloseTo(16.6448, 3);
  expect(labelFontSize(13, 0.012 * 1.5, "room")).toBe(20);
  expect(labelFontSize(13, MIN_CAMERA_SCALE, "room")).toBe(7);
  expect(labelFontSize(13, 0.12, "room")).toBe(20);
});

it("T-019 conserva bases por tipo e aplica limites dos demais rótulos", () => {
  for (const base of [11, 12, 13]) {
    expect(labelFontSize(base, LABEL_REFERENCE_SCALE)).toBe(base);
    expect(labelFontSize(base, MIN_CAMERA_SCALE)).toBe(6);
    expect(labelFontSize(base, 0.12)).toBe(18);
  }
  expect(labelFontSize(11, 0.012 * 0.25)).toBeCloseTo(6.442, 2);
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
    expect(size).toBeGreaterThanOrEqual(7);
    expect(size).toBeLessThanOrEqual(20);
    last = size;
  }
});

it("compacta espaçamentos e entrelinhas no zoom pequeno sem alterar escalas maiores", () => {
  expect(labelSpacing(18, 0.012 * 0.25)).toBeCloseTo(10.542, 2);
  expect(labelSpacing(5, 0.012 * 0.25)).toBeCloseTo(2.928, 2);
  expect(labelSpacing(14, MIN_CAMERA_SCALE)).toBeCloseTo((14 * 6) / 11);
  for (const scale of [LABEL_REFERENCE_SCALE, 0.012, 0.12]) {
    expect(labelSpacing(18, scale)).toBe(18);
  }
  expect(labelSpacing(18, LABEL_REFERENCE_SCALE * 0.999999)).toBeCloseTo(18, 4);
  for (const zoom of [1, 10, 25, 40, 61]) {
    const scale = (0.012 * zoom) / 100;
    expect(labelSpacing(18, scale)).toBeGreaterThan(
      labelFontSize(13, scale, "room"),
    );
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
