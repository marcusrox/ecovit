import { expect, it } from "vitest";
import {
  cursorCell,
  openingCell,
  openingDrawRange,
  wallDraw,
} from "../src/domain/drawing";
import { bounds, makeWall } from "../src/domain/project";

it.each([1250, 1500, 1400, 1251])(
  "célula contém o cursor em todas as metades, inclusive negativas: %i",
  (m) => {
    for (const x of [0.2, 0.7, 0.99])
      for (const y of [0.2, 0.7, 0.99]) {
        expect(cursorCell({ x: (4 + x) * m, y: (4 + y) * m }, m)).toEqual({
          x: 4 * m,
          y: 4 * m,
        });
        expect(cursorCell({ x: (-4 + x) * m, y: (-4 + y) * m }, m)).toEqual({
          x: -4 * m,
          y: -4 * m,
        });
      }
  },
);
it.each(["right", "left", "up", "down"])(
  "parede inclui módulo inicial em %s, nos dois lados da espessura",
  (direction) => {
    const m = 1250,
      cell = { x: 5000, y: 5000 },
      press = { x: 5875, y: 5875 };
    const end =
      direction === "right"
        ? { x: 10000, y: 5875 }
        : direction === "left"
          ? { x: 2500, y: 5875 }
          : direction === "up"
            ? { x: 5875, y: 2500 }
            : { x: 5875, y: 10000 };
    for (const side of [1, -1] as const) {
      const w = wallDraw(cell, press, end, m, "floor", 28000, side)!,
        b = bounds(w, m);
      expect(b.x).toBeLessThanOrEqual(cell.x);
      expect(b.y).toBeLessThanOrEqual(cell.y);
      expect(b.x + b.width).toBeGreaterThanOrEqual(cell.x + m);
      expect(b.y + b.height).toBeGreaterThanOrEqual(cell.y + m);
      expect([w.a.x, w.a.y, w.b.x, w.b.y].every((n) => n % m === 0)).toBe(true);
    }
  },
);
it("vão seleciona célula interior, início inverso inclui célula e borda final", () => {
  const w = makeWall(
    { x: 0, y: 0 },
    { x: 10000, y: 0 },
    1250,
    "floor",
    28000,
    1,
  )!;
  expect(openingCell(w, { x: 5875, y: 625 }, 1250)?.cell).toEqual({
    x: 5000,
    y: 0,
  });
  expect(openingDrawRange(5000, 2500, 1250, false)).toEqual({
    offset: 2500,
    width: 3750,
  });
  expect(openingDrawRange(5000, 7500, 1250, true)).toEqual({
    offset: 5000,
    width: 2500,
  });
  expect(openingCell(w, { x: 10000, y: 625 }, 1250)?.offset).toBe(8750);
  expect(openingDrawRange(8750, 7500, 1250, false)).toEqual({
    offset: 7500,
    width: 2500,
  });
});
it("alvo de conexão não desloca faixa para fora da célula escolhida", () => {
  const cell = { x: 5000, y: 5000 },
    press = { x: 5875, y: 5875 };
  const w = wallDraw(
    cell,
    press,
    { x: 10000, y: 5875 },
    1250,
    "floor",
    28000,
    1,
    { x: 10000, y: 6250 },
  )!;
  expect(bounds(w, 1250).y).toBe(5000);
  expect(w.b).toEqual({ x: 10000, y: 5000 });
});
