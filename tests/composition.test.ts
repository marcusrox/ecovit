import {
  generate,
  createLocalProject as createProject,
  type Project,
} from "./floor-support";
import { describe, it, expect } from "vitest";

import { makeWall } from "../src/domain/project";

const base = { length: 2500, width: 1250, height: 700 };
function doc() {
  return createProject("M2", base);
}
function wall(
  d: Project,
  a: number[],
  b: number[],
  height = 2100,
  side: 1 | -1 = 1,
) {
  const m = d.project.base.width;
  d.model.walls.push(
    makeWall(
      { x: a[0] * m, y: a[1] * m },
      { x: b[0] * m, y: b[1] * m },
      m,
      d.model.floors[0].id,
      height,
      side,
    )!,
  );
}
function l() {
  const d = doc();
  wall(d, [0, 0], [3, 0]);
  wall(d, [0, 0], [0, 3]);
  return d;
}
const counts = (d: ReturnType<typeof generate>, n: number) => [
  d.courses[n].pieces.filter((p) => p.kind === "whole").length,
  d.courses[n].pieces.filter((p) => p.kind === "half").length,
];
function coverage(d: Project) {
  const g = generate(d),
    m = d.project.base.width;
  for (const row of g.courses) {
    const cells = new Set<string>();
    for (const p of row.pieces) {
      expect(p.width * p.height).toBe((p.kind === "whole" ? 2 : 1) * m * m);
      for (let x = p.x; x < p.x + p.width; x += m)
        for (let y = p.y; y < p.y + p.height; y += m) {
          const k = `${x},${y}`;
          expect(cells.has(k)).toBe(false);
          cells.add(k);
        }
    }
  }
  return g;
}
describe("M2 composição nominal", () => {
  it("L de ramo insuficiente não vira reta válida por sobreposição", () => {
    const d = doc();
    wall(d, [0, 0], [1, 0]);
    wall(d, [0, 0], [0, 3]);
    expect(generate(d).diagnostics[0].code).toBe("unsupported");
  });
  it("centros em meia unidade preservam alinhamento nominal", () => {
    const d = doc();
    d.project.base = { length: 2502, width: 1251, height: 700 };
    wall(d, [0, 0], [8, 0]);
    const g = generate(d);
    const centers = (n: number) =>
      g.courses[n].pieces.flatMap((p) =>
        Array.from({ length: p.width / 1251 }, (_, i) => [
          2 * p.x + (2 * i + 1) * 1251,
          2 * p.y + 1251,
        ]),
      );
    expect(centers(0)).toEqual(centers(1));
  });
  it.each([1250, 1500, 1400, 1251])(
    "EX-01/05/06: reta com módulo %i e meios nas pontas",
    (m) => {
      const d = doc();
      d.project.base = { length: m * 2, width: m, height: 700 };
      wall(d, [0, 0], [8, 0]);
      const g = coverage(d);
      expect(g.courses).toHaveLength(3);
      expect(counts(g, 0)).toEqual([4, 0]);
      expect(counts(g, 1)).toEqual([3, 2]);
      expect(
        g.courses[1].pieces.filter((p) => p.kind === "half").map((p) => p.x),
      ).toEqual([0, 7 * m]);
    },
  );
  it("EX-02: reta ímpar alterna ponta do meio", () => {
    const d = doc();
    wall(d, [0, 0], [7, 0]);
    const g = generate(d);
    expect(counts(g, 0)).toEqual([3, 1]);
    expect(g.courses[0].pieces.at(-1)?.x).toBe(7500);
    expect(g.courses[1].pieces[0].kind).toBe("half");
  });
  it("EX-03/14: L pares e ímpares, rotações/reflexões", () => {
    for (let a = 2; a <= 5; a++)
      for (let b = 2; b <= 5; b++)
        for (const sx of [-1, 1])
          for (const sy of [-1, 1]) {
            const d = doc();
            wall(d, [0, 0], [a * sx, 0], 2100, sy as 1 | -1);
            wall(d, [0, 0], [0, b * sy], 2100, sx as 1 | -1);
            const g = coverage(d);
            expect(g.diagnostics.filter((d) => d.severity === "error")).toEqual(
              [],
            );
            expect(counts(g, 0)).toEqual([
              Math.floor(a / 2) + Math.floor((b - 1) / 2),
              (a % 2) + ((b - 1) % 2),
            ]);
            expect(counts(g, 1)).toEqual([
              Math.floor(b / 2) + Math.floor((a - 1) / 2),
              (b % 2) + ((a - 1) % 2),
            ]);
          }
  });
  it("EX-04/17: anel 32×24 tem 54 inteiros por fiada e alternativa", () => {
    const d = doc();
    wall(d, [0, 0], [32, 0]);
    wall(d, [0, 24], [32, 24], 2100, -1);
    wall(d, [0, 0], [0, 24]);
    wall(d, [32, 0], [32, 24], 2100, -1);
    const g = coverage(d);
    expect(g.diagnostics).toEqual([]);
    for (let i = 0; i < 3; i++) expect(counts(g, i)).toEqual([54, 0]);
    expect(g.components[0].alternative).toBe(true);
    const c = g.components[0];
    d.adjustments.junctions = [
      {
        floorId: d.model.floors[0].id,
        id: crypto.randomUUID(),
        anchor: { x: 0, y: 0 },
        binding: "active",
        componentId: c.id,
        signature: c.signature,
        wallIds: c.wallIds,
        phase: 1,
      },
    ];
    expect(generate(d).courses[0].pieces).not.toEqual(g.courses[0].pieces);
  });
  it("EX-10/13: T contínuo, ramal e aviso", () => {
    const d = doc();
    wall(d, [-4, 0], [4, 0]);
    wall(d, [0, 1], [0, 5]);
    const g = coverage(d);
    expect(counts(g, 0)).toEqual([6, 0]);
    expect(counts(g, 1)).toEqual([4, 4]);
    expect(g.diagnostics.map((x) => x.code)).toEqual(["connection"]);
    expect(g.courses[0].pieces.every((p) => p.wallIds.length === 1)).toBe(true);
  });
  it("T invertido pagina ramal a partir do contato", () => {
    const d = doc();
    wall(d, [-4, 0], [4, 0]);
    wall(d, [0, -4], [0, 0]);
    const g = coverage(d);
    expect(counts(g, 1)).toEqual([4, 4]);
    expect(
      g.courses[1].pieces.some((p) => p.y === -1250 && p.kind === "half"),
    ).toBe(true);
  });
  it("EX-11/12: cruz e duplicação não ocultam componente independente", () => {
    const d = doc();
    wall(d, [-1, 0], [2, 0]);
    wall(d, [0, -1], [0, 2]);
    wall(d, [10, 0], [18, 0]);
    const g = generate(d, "nominal-v7");
    expect(g.diagnostics.some((x) => x.code === "cross-connection")).toBe(true);
    expect(g.courses[0].pieces.filter((p) => p.x >= 12500)).toHaveLength(4);
    d.model.walls.push({ ...d.model.walls[2], id: crypto.randomUUID() });
    expect(generate(d).diagnostics.some((x) => x.code === "overlap")).toBe(
      true,
    );
  });
  it("contato por vértice não conecta componentes", () => {
    const d = doc();
    wall(d, [0, 0], [2, 0]);
    wall(d, [2, 1], [4, 1]);
    expect(generate(d).components).toHaveLength(2);
  });
  it("EX-08/09: preserva altura incompatível e intervalos relativos ao piso", () => {
    const d = doc();
    wall(d, [0, 0], [8, 0], 2000);
    expect(generate(d).diagnostics[0].code).toBe("height");
    expect(d.model.walls[0].height).toBe(2000);
    d.model.walls[0].height = 2100;
    d.model.floors[0].level = 1400;
    expect(generate(d).courses.map((c) => [c.bottom, c.top])).toEqual([
      [0, 700],
      [700, 1400],
      [1400, 2100],
    ]);
  });
  it.each([700, 1400])("EX-15/16: término em %i mantém fase", (height) => {
    const d = l();
    d.model.walls[1].height = height;
    const g = coverage(d);
    expect(counts(g, 2)).toEqual([1, 1]);
    expect(g.courses[2].pieces[0]).toMatchObject({
      x: 0,
      y: 0,
      width: 2500,
      height: 1250,
    });
    if (height === 700)
      expect(g.courses[1].pieces[0]).toMatchObject({
        kind: "half",
        x: 0,
        y: 0,
      });
  });
  it("EX-18: U estreito coordena cantos sem disputa na célula intermediária", () => {
    const d = l();
    wall(d, [2, 0], [2, 3]);
    const g = coverage(d);
    expect(g.diagnostics).toEqual([]);
    expect(counts(g, 0)).toEqual([3, 1]);
    expect(counts(g, 1)).toEqual([3, 1]);
    expect(
      g.courses[0].pieces
        .filter((p) => p.kind === "half")
        .map((p) => [p.x, p.y]),
    ).toEqual([[2500, 2500]]);
    expect(
      g.courses[1].pieces
        .filter((p) => p.kind === "half")
        .map((p) => [p.x, p.y]),
    ).toEqual([[0, 2500]]);
  });
  it("ordem e sentido do desenho não alteram peças", () => {
    const d = l(),
      a = generate(d);
    d.model.walls.reverse();
    d.model.walls = d.model.walls.map((w) => ({ ...w, a: w.b, b: w.a }));
    expect(generate(d)).toEqual(a);
  });
  it("M4.1 não bloqueia geração pelo antigo teto de mil fiadas", () => {
    const d = doc();
    wall(d, [0, 0], [2, 0], 1001 * 700);
    const g = generate(d);
    expect(g.diagnostics.some((a) => a.code === "limit")).toBe(false);
    expect(g.courses).toHaveLength(1001);
    expect(g.courses[1000].pieces).toHaveLength(1);
  });
  it("ajuste incompatível não é aplicado silenciosamente", () => {
    const d = l(),
      g = generate(d),
      c = g.components[0];
    d.adjustments.junctions = [
      {
        floorId: d.model.floors[0].id,
        id: crypto.randomUUID(),
        anchor: { x: 0, y: 0 },
        binding: "active",
        componentId: c.id,
        signature: c.signature,
        wallIds: c.wallIds,
        phase: 1,
      },
    ];
    d.model.walls[0].b.x += 1250;
    expect(generate(d).diagnostics[0].code).toBe("adjustment");
  });
});
