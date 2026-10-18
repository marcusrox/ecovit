import {
  createLocalProject as createProject,
  type Project,
  generate,
  parseFile,
  putOpening,
  suppressBand,
  restoreSuppression,
  toggleGrout,
} from "./floor-support";
import { describe, expect, it } from "vitest";
import { defaultGroutSettings, makeWall } from "../src/domain/project";
import { type Composition } from "../src/domain/composition";

import { moveWall } from "../src/domain/wall-editing";

function project(m = 1250, h = 700) {
  const d = createProject("Cruz", { length: 2 * m, width: m, height: h });
  d.project.channelLevels = [];
  d.project.groutSettings = defaultGroutSettings(false);
  return d;
}
function wall(
  d: Project,
  a: [number, number],
  b: [number, number],
  height = 3 * d.project.base.height,
) {
  const m = d.project.base.width;
  d.model.walls.push(
    makeWall(
      { x: a[0] * m, y: a[1] * m },
      { x: b[0] * m, y: b[1] * m },
      m,
      d.model.floors[0].id,
      height,
      1,
    )!,
  );
}
function cross(r = 1, m = 1250, h = 700) {
  const d = project(m, h);
  wall(d, [-r, 0], [r + 1, 0]);
  wall(d, [0, -r], [0, r + 1]);
  return d;
}
function ring(m = 1250, h = 700) {
  const d = project(m, h);
  wall(d, [0, 0], [16, 0]);
  wall(d, [0, 11], [16, 11]);
  wall(d, [0, 0], [0, 12]);
  wall(d, [15, 0], [15, 12]);
  wall(d, [8, 1], [8, 8]);
  wall(d, [1, 4], [13, 4]);
  return d;
}
function counts(g: Composition, n: number) {
  const ps = g.courses[n - 1].pieces;
  return [
    ps.filter((p) => p.width * p.height === 2 * 1250 * 1250).length,
    ps.filter((p) => p.width * p.height === 1250 * 1250).length,
  ];
}
function coverage(d: Project, g = generate(d)) {
  const m = d.project.base.width;
  for (const row of g.courses) {
    const seen = new Set<string>();
    for (const p of row.pieces) {
      expect([m, 2 * m]).toContain(p.width);
      expect([m, 2 * m]).toContain(p.height);
      expect(p.width * p.height).toBeLessThanOrEqual(2 * m * m);
      for (let y = p.y; y < p.y + p.height; y += m)
        for (let x = p.x; x < p.x + p.width; x += m) {
          const k = `${x}:${y}`;
          expect(seen.has(k)).toBe(false);
          seen.add(k);
        }
    }
  }
  return g;
}
function current(
  d: Project,
  convention: Composition["convention"] = "nominal-v10",
) {
  const g = generate(d, convention);
  return {
    ...d,
    generated: g,
    generationState: { status: "current" as const, diagnostics: g.diagnostics },
  };
}
describe("M3.5 CT-12 cruz nominal", () => {
  it("EX-51 posições independentes nas fases e centro único", () => {
    const d = cross(),
      g = coverage(d);
    expect(counts(g, 1)).toEqual([1, 3]);
    expect(counts(g, 2)).toEqual([1, 3]);
    expect(g.courses[0].pieces.find((p) => p.width === 2500)).toMatchObject({
      x: -1250,
      y: 0,
      width: 2500,
      height: 1250,
    });
    expect(g.courses[1].pieces.find((p) => p.height === 2500)).toMatchObject({
      x: 0,
      y: 0,
      width: 1250,
      height: 2500,
    });
    expect(g.components[0].alternative).toBe(true);
    expect(g.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  });
  it("EX-52 centro muda de direção, 13 células em cada fase", () => {
    const d = cross(3),
      g = coverage(d);
    expect(counts(g, 1)).toEqual([5, 3]);
    expect(counts(g, 2)).toEqual([5, 3]);
    expect(
      g.courses[0].pieces.some(
        (p) => p.x === -1250 && p.y === 0 && p.width === 2500,
      ),
    ).toBe(true);
    expect(
      g.courses[1].pieces.some(
        (p) => p.x === 0 && p.y === 0 && p.height === 2500,
      ),
    ).toBe(true);
  });
  it("EX-53 contorno com seis paredes nunca desaparece", () => {
    const d = ring(),
      g = coverage(d);
    expect(counts(g, 1)).toEqual([34, 2]);
    expect(counts(g, 2)).toEqual([33, 4]);
    expect(g.components).toHaveLength(1);
    expect(g.components[0].wallIds).toHaveLength(6);
    expect(g.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    for (const row of g.courses)
      expect(
        row.pieces.reduce(
          (sum, p) => sum + (p.width * p.height) / 1250 ** 2,
          0,
        ),
      ).toBe(70);
  });
  it("alternativa global inverte todas as fiadas e preserva IDs ao transportar", () => {
    const d = ring(),
      g = generate(d),
      c = g.components[0];
    d.adjustments.junctions = [
      {
        floorId: d.model.floors[0].id,
        id: crypto.randomUUID(),
        anchor: { x: c.x, y: c.y },
        binding: "active",
        componentId: c.id,
        signature: c.signature,
        wallIds: c.wallIds,
        phase: 1,
      },
    ];
    const chosen = current(d);
    expect(counts(chosen.generated!, 1)).toEqual([33, 4]);
    expect(counts(chosen.generated!, 2)).toEqual([34, 2]);
    expect(parseFile(JSON.stringify(chosen))).toEqual(chosen);
  });
  it.each([false, true])("EX-54 cruz → reta, altura trocada %s", (swap) => {
    const d = cross(3);
    d.model.walls[swap ? 0 : 1].height = 1400;
    const g = coverage(d);
    expect(counts(g, 1)).toEqual([5, 3]);
    expect(counts(g, 2)).toEqual([5, 3]);
    expect(counts(g, 3)).toEqual([3, 1]);
    const half = g.courses[2].pieces.find((p) => p.kind === "half")!;
    expect(swap ? half.y : half.x).toBe(3750);
  });
  it.each([1250, 1500, 1400, 1251])("bases e rotações/reflexões, m=%i", (m) => {
    const d = cross(3, m, 600);
    for (const swap of [false, true])
      for (const sign of [-1, 1]) {
        const candidate = {
          ...d,
          model: {
            ...d.model,
            walls: d.model.walls.map((w) => ({
              ...w,
              a: swap
                ? { x: w.a.y * sign, y: w.a.x }
                : { x: w.a.x * sign, y: w.a.y },
              b: swap
                ? { x: w.b.y * sign, y: w.b.x }
                : { x: w.b.x * sign, y: w.b.y },
              side: (swap
                ? w.a.y === w.b.y
                  ? sign
                  : 1
                : w.a.y === w.b.y
                  ? 1
                  : sign) as 1 | -1,
            })),
          },
        };
        const g = coverage(candidate);
        expect(g.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
        for (const row of g.courses) {
          expect(
            row.pieces.filter((p) => p.width * p.height === 2 * m * m),
          ).toHaveLength(5);
          expect(
            row.pieces.filter((p) => p.width * p.height === m * m),
          ).toHaveLength(3);
        }
      }
  });
  it("IDs/ordem/sentido não alteram posições; cota única mantém fase", () => {
    const d = ring();
    d.model.floors[0].level = 1400;
    const g = generate(d);
    const rev = {
      ...d,
      model: {
        ...d.model,
        walls: d.model.walls.map((w) => ({ ...w, a: w.b, b: w.a })).reverse(),
      },
    };
    expect(generate(rev)).toEqual(g);
    const ids = {
      ...d,
      model: {
        ...d.model,
        walls: d.model.walls.map((w) => ({ ...w, id: crypto.randomUUID() })),
      },
    };
    expect(
      generate(ids).courses.map((row) =>
        row.pieces.map(({ wallIds: _ids, ...p }) => {
          void _ids;
          return p;
        }),
      ),
    ).toEqual(
      g.courses.map((row) =>
        row.pieces.map(({ wallIds: _ids, ...p }) => {
          void _ids;
          return p;
        }),
      ),
    );
    expect(g.courses[0].bottom).toBe(0);
  });
  it("EX-55 vãos, canaletas, graute compartilhado e supressão íntegros", () => {
    let d = ring();
    d.model.walls = d.model.walls.map((w) => ({ ...w, height: 28000 }));
    d = putOpening(d, {
      id: crypto.randomUUID(),
      wallId: d.model.walls[1].id,
      kind: "window",
      offset: 5000,
      width: 2500,
      base: 9800,
      height: 11200,
    });
    d.project.groutSettings.junctions = true;
    d.project.channelLevels = [{ id: crypto.randomUUID(), top: 11200 }];
    d = toggleGrout(
      d,
      { x: 5000, y: 13750, wallIds: [d.model.walls[1].id] },
      false,
    );
    const g = coverage(d);
    expect(
      g.courses[14].pieces.reduce(
        (s, p) => s + (p.width * p.height) / 1250 ** 2,
        0,
      ),
    ).toBe(68);
    expect(g.grouts!.filter((a) => a.x === 10000 && a.y === 5000)).toHaveLength(
      1,
    );
    expect(
      g.grouts!.find((a) => a.x === 5000 && a.y === 13750)!.intervals,
    ).toEqual([
      { bottom: 0, top: 9800 },
      { bottom: 21000, top: 28000 },
    ]);
    const suppressed = suppressBand(d, d.model.walls[1].id, 11200);
    expect(generate(suppressed).grouts).toEqual(g.grouts);
    expect(
      generate(
        restoreSuppression(suppressed, suppressed.adjustments.channels[0].id),
      ).courses,
    ).toEqual(g.courses);
    expect(parseFile(JSON.stringify(current(suppressed))).adjustments).toEqual(
      suppressed.adjustments,
    );
  });
  it("reservas conflitantes suspende só conjunto e localiza motivo", () => {
    const d = project();
    wall(d, [-2, 0], [4, 0]);
    wall(d, [0, -2], [0, 3]);
    wall(d, [1, -2], [1, 3]);
    wall(d, [10, 0], [18, 0]);
    const g = generate(d);
    expect(
      g.diagnostics.some((a) => a.code === "junction-reservation-conflict"),
    ).toBe(true);
    expect(
      g.diagnostics.find((a) => a.severity === "error")!.message,
    ).toContain("3 paredes conectadas");
    expect(g.courses[0].pieces).toHaveLength(4);
  });
  it("vão na célula compartilhada e altura inválida preservam desenho", () => {
    let d = cross(3);
    d = putOpening(d, {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "door",
      offset: 3750,
      width: 1250,
      base: 0,
      height: 700,
    });
    const g = generate(d);
    expect(g.courses[0].pieces).toEqual([]);
    expect(g.diagnostics[0]).toMatchObject({
      code: "opening-at-junction",
      wallIds: d.model.walls.map((w) => w.id).sort(),
    });
    expect(g.diagnostics[0].message).toContain("2 paredes conectadas");
    d.model.walls[0].height = 2000;
    expect(generate(d).diagnostics[0].category).toBe("input");
  });
  it("vão acima da parede encerrada não invade encontro ativo", () => {
    let d = cross(3);
    d.model.walls[0].height = 2100;
    d.model.walls[1].height = 1400;
    d = putOpening(d, {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "window",
      offset: 3750,
      width: 1250,
      base: 1400,
      height: 700,
    });
    const g = generate(d);
    expect(g.diagnostics.filter((a) => a.severity === "error")).toEqual([]);
    expect(counts(g, 3)).toEqual([2, 2]);
    expect(g.courses[2].pieces.some((p) => p.x <= 0 && p.x + p.width > 0)).toBe(
      false,
    );
  });
  it("snapshot nominal-v8 adulterado e futuro recusados", () => {
    const d = current(ring());
    const bad = structuredClone(d);
    bad.generated!.courses[0].pieces[0].width += 1250;
    expect(() => parseFile(JSON.stringify(bad))).toThrow("inconsistente");
    expect(() =>
      parseFile(JSON.stringify({ ...d, schemaVersion: 99 })),
    ).toThrow();
  });
  it("escolha pending não se torna ativa com suporte novo", () => {
    const d = ring(),
      c = generate(d).components[0];
    d.adjustments.junctions = [
      {
        floorId: d.model.floors[0].id,
        id: crypto.randomUUID(),
        anchor: { x: 10000, y: 5000 },
        binding: "pending",
        componentId: c.id,
        signature: c.signature,
        wallIds: c.wallIds,
        phase: 1,
      },
    ];
    const g = generate(d);
    expect(g.courses[0].pieces).toEqual([]);
    expect(g.diagnostics[0].code).toBe("adjustment");
  });
  it("movimento de parede mantém intenção da cruz e desfazer por documento restaura", () => {
    const d = cross(3),
      moved = moveWall(d, d.model.walls[1].id, { x: 12500, y: 0 }, true);
    expect(generate(moved.doc).courses[0].pieces.length).toBeGreaterThan(0);
    expect(counts(generate(d), 1)).toEqual([5, 3]);
  });
});
