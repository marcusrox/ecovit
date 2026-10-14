import { describe, expect, it } from "vitest";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
  bounds,
  type Project,
} from "../src/domain/project";
import { generate } from "../src/domain/composition";
import {
  activeGrout,
  courseCells,
  discardGroutAdjustment,
  toggleGrout,
  MAX_GROUT_ADJUSTMENTS,
} from "../src/domain/grout";
import { suppressBand } from "../src/domain/channels";
import { putOpening } from "../src/domain/openings";
import { parseFile } from "../src/persistence/files";

function fixture(m = 1250, h = 700, vertical = false, side: 1 | -1 = 1) {
  const d = createProject("Grautes", { length: 2 * m, width: m, height: h });
  d.project.groutSettings = { ...defaultGroutSettings(false), intervals: true };
  d.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      vertical ? { x: 0, y: 32 * m } : { x: 32 * m, y: 0 },
      m,
      d.model.floors[0].id,
      40 * h,
      side,
    )!,
  ];
  return d;
}
function snapshot(d: Project) {
  const g = generate(d);
  return {
    ...d,
    generated: g,
    generationState: { status: "current" as const, diagnostics: g.diagnostics },
  };
}
const xs = (d: Project) =>
  generate(d).grouts!.map((a) => a.x + d.project.base.width / 2);
const cell = (d: Project, x: number, y = 0) => ({
  x,
  y,
  wallIds: [d.model.walls[0].id],
});

describe("M3.3 grautes nominais", () => {
  it("EX-32 posições independentes, pontas e exclusão sem compensação", () => {
    let d = fixture();
    expect(xs(d)).toEqual([10625, 20625, 30625]);
    d.project.groutSettings.ends = true;
    expect(xs(d)).toEqual([625, 10625, 20625, 30625, 39375]);
    d = toggleGrout(d, cell(d, 20000), true);
    expect(xs(d)).toEqual([625, 10625, 30625, 39375]);
    expect(xs({ ...d, project: { ...d.project, name: "Outro nome" } })).toEqual(
      xs(d),
    );
    const id = d.adjustments.grout[0].id;
    d = toggleGrout(d, cell(d, 20000), false);
    expect(d.adjustments.grout[0].id).toBe(id);
    expect(xs(d)).toEqual([625, 10625, 20625, 30625, 39375]);
  });
  it("EX-33 eixo completo, janela interrompe intervalos e não oferece alvo no vazio", () => {
    let d = fixture();
    d.project.groutSettings = defaultGroutSettings(false);
    d = putOpening(d, {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "window",
      offset: 10000,
      width: 10000,
      base: 9800,
      height: 11200,
    });
    d = toggleGrout(d, cell(d, 10000), false);
    const g = generate(d),
      a = g.grouts![0];
    expect(a.intervals).toEqual([
      { bottom: 0, top: 9800 },
      { bottom: 21000, top: 28000 },
    ]);
    expect(courseCells(d, g, 10).some((c) => c.x === 10000)).toBe(true);
    expect(courseCells(d, g, 20).some((c) => c.x === 10000)).toBe(false);
    expect(activeGrout(a, 13300, 14000)).toBe(false);
    expect(generate(toggleGrout(d, cell(d, 10000), true)).grouts).toEqual([]);
  });
  it("categorias independentes e mudança de configuração preservam inclusões", () => {
    let d = fixture();
    d.project.groutSettings = defaultGroutSettings(false);
    expect(xs(d)).toEqual([]);
    d = putOpening(d, {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "door",
      offset: 10000,
      width: 10000,
      base: 0,
      height: 21000,
    });
    d.project.groutSettings.openings = true;
    expect(xs(d)).toEqual([9375, 20625]);
    d = toggleGrout(d, cell(d, 2500), false);
    d.project.groutSettings.openings = false;
    expect(xs(d)).toEqual([3125]);
    d = discardGroutAdjustment(d, d.adjustments.grout[0].id);
    expect(xs(d)).toEqual([]);
  });
  it.each([1500, 1400, 1251])(
    "EX-34 módulo %i, passos sem exceder distância e coordenadas inteiras",
    (m) => {
      const d = fixture(m),
        g = generate(d),
        expected =
          m === 1500
            ? [9750, 18750, 27750, 36750, 45750]
            : m === 1400
              ? [10500, 20300, 30100, 39900]
              : [9382.5, 18139.5, 26896.5, 35653.5];
      expect(xs(d)).toEqual(expected);
      expect(
        g.grouts!.every((a) => Number.isInteger(a.x) && Number.isInteger(a.y)),
      ).toBe(true);
      expect(parseFile(JSON.stringify(snapshot(d))).generated).toEqual(g);
    },
  );
  it("distância restante já menor que d não adiciona um eixo desnecessário", () => {
    const d = fixture(1500);
    d.model.walls[0].b.x = 8 * 1500;
    d.project.groutSettings.distance = 11000;
    expect(xs(d)).toEqual([]);
  });
  it("d menor que m preserva categorias e ajustes, com diagnóstico sem arredondar", () => {
    let d = fixture();
    d.project.groutSettings.distance = 1000;
    d.project.groutSettings.ends = true;
    d = toggleGrout(d, cell(d, 2500), false);
    const g = generate(d);
    expect(g.diagnostics.map((a) => a.code)).toEqual([
      "grout-distance-off-grid",
    ]);
    expect(xs(d)).toEqual([625, 3125, 39375]);
    expect(d.project.groutSettings.distance).toBe(1000);
  });
  it("encontro L é um eixo compartilhado; retas conectadas não criam pontas internas", () => {
    const d = fixture();
    d.project.groutSettings = defaultGroutSettings(false);
    d.project.groutSettings.junctions = true;
    d.model.walls[0].b.x = 10000;
    d.model.walls.push(
      makeWall(
        { x: 0, y: 0 },
        { x: 0, y: 10000 },
        1250,
        d.model.floors[0].id,
        28000,
        1,
      )!,
    );
    const g = generate(d);
    expect(g.grouts).toHaveLength(1);
    expect(g.grouts![0].origins).toEqual(["junction:L:0:0"]);
    expect(g.grouts![0]).toMatchObject({
      x: 0,
      y: 0,
      wallIds: d.model.walls.map((w) => w.id).sort(),
      intervals: [{ bottom: 0, top: 28000 }],
    });
    expect(
      generate(
        toggleGrout(d, { x: 0, y: 0, wallIds: g.grouts![0].wallIds }, true),
      ).grouts,
    ).toEqual([]);
    d.project.groutSettings.junctions = false;
    d.project.groutSettings.ends = true;
    d.model.walls[1] = makeWall(
      { x: 10000, y: 0 },
      { x: 20000, y: 0 },
      1250,
      d.model.floors[0].id,
      28000,
      1,
    )!;
    expect(xs(d)).toEqual([625, 19375]);
  });
  it("encontro T unifica coordenada e origens sem triplicar eixos", () => {
    const d = fixture();
    d.project.groutSettings = defaultGroutSettings(false);
    d.project.groutSettings.junctions = true;
    d.model.walls[0].a.x = -10000;
    d.model.walls[0].b.x = 10000;
    d.model.walls.push(
      makeWall(
        { x: 0, y: 0 },
        { x: 0, y: 10000 },
        1250,
        d.model.floors[0].id,
        28000,
        1,
      )!,
    );
    const g = generate(d);
    expect(g.grouts).toHaveLength(1);
    expect(g.grouts![0].origins).toHaveLength(1);
    expect(g.grouts![0].origins[0].length).toBeLessThan(80);
  });
  it("empilhados conservam fiada intermediária e intervalos distintos", () => {
    let d = fixture();
    d.project.groutSettings = defaultGroutSettings(false);
    for (const [base, height] of [
      [0, 10500],
      [11200, 9800],
    ])
      d = putOpening(d, {
        id: crypto.randomUUID(),
        wallId: d.model.walls[0].id,
        kind: "opening",
        offset: 10000,
        width: 10000,
        base,
        height,
      });
    d = toggleGrout(d, cell(d, 10000), false);
    expect(generate(d).grouts![0].intervals).toEqual([
      { bottom: 10500, top: 11200 },
      { bottom: 21000, top: 28000 },
    ]);
  });
  it.each([
    [false, 1],
    [true, 1],
    [false, -1],
    [true, -1],
  ] as const)("direção %s/lado %i e referência vertical", (vertical, side) => {
    const d = fixture(1400, 600, vertical, side);
    d.model.floors[0].level = 1000;
    d.model.floors[0].start = 1200;
    const b = bounds(d.model.walls[0], 1400),
      g = generate(d);
    expect(g.grouts!.map((a) => (vertical ? a.y : a.x))).toEqual([
      9800, 19600, 29400, 39200,
    ]);
    expect(g.grouts!.every((a) => (vertical ? a.x === b.x : a.y === b.y))).toBe(
      true,
    );
    expect(g.grouts![0].intervals).toEqual([{ bottom: 1200, top: 25200 }]);
  });
  it("supressão de canaleta preserva grautes e composição comum", () => {
    const d = fixture(),
      g = generate(d),
      after = generate(suppressBand(d, d.model.walls[0].id, 11200));
    expect(after.grouts).toEqual(g.grouts);
    expect(
      after.courses[15].pieces.every(
        (p) => p.kind === "whole" || p.kind === "half",
      ),
    ).toBe(true);
  });
  it("edição indireta mantém eixo pendente; recuperação reativa sem mover", () => {
    let d = fixture();
    d.project.groutSettings = defaultGroutSettings(false);
    d = toggleGrout(d, cell(d, 30000), false);
    const short = {
      ...d,
      model: {
        ...d.model,
        walls: d.model.walls.map((w) => ({ ...w, b: { ...w.b, x: 20000 } })),
      },
    };
    const g = generate(short);
    expect(g.grouts).toEqual([]);
    expect(g.diagnostics[0]).toMatchObject({
      code: "grout-adjustment-target-missing",
      x: 30000,
      adjustmentIds: [d.adjustments.grout[0].id],
    });
    expect(
      parseFile(JSON.stringify(snapshot(short))).adjustments.grout,
    ).toEqual(d.adjustments.grout);
    expect(generate(d).grouts![0].x).toBe(30000);
  });
  it("determinismo por ordem de paredes, vãos e ajustes", () => {
    let d = fixture();
    d.project.groutSettings = defaultGroutSettings();
    d.model.walls.push(
      makeWall(
        { x: 0, y: 5000 },
        { x: 40000, y: 5000 },
        1250,
        d.model.floors[0].id,
        28000,
        1,
      )!,
    );
    d = toggleGrout(d, cell(d, 20000), true);
    d = toggleGrout(d, cell(d, 2500), false);
    expect(
      generate({
        ...d,
        model: { ...d.model, walls: [...d.model.walls].reverse() },
        adjustments: {
          ...d.adjustments,
          grout: [...d.adjustments.grout].reverse(),
        },
      }),
    ).toEqual(generate(d));
  });
  it("migração M3.2 confere snapshot original, mantém canaletas/supressões e desliga grautes", () => {
    let d = fixture();
    d = suppressBand(d, d.model.walls[0].id, 11200);
    const { groutSettings: _grout, ...project } = d.project;
    void _grout;
    const g = generate(d, "nominal-v5"),
      old = {
        ...d,
        schemaVersion: 4,
        adjustments: {
          ...d.adjustments,
          channels: d.adjustments.channels.map(({ scope: _scope, ...a }) => {
            void _scope;
            return a;
          }),
        },
        project,
        generated: g,
        generationState: { status: "current", diagnostics: g.diagnostics },
      };
    const migrated = parseFile(JSON.stringify(old));
    expect(migrated.schemaVersion).toBe(7);
    expect(migrated.project.groutSettings).toEqual(defaultGroutSettings(false));
    expect(migrated.adjustments).toEqual(d.adjustments);
    expect(generate(migrated).grouts).toEqual([]);
    expect(generate(migrated).courses).toEqual(g.courses);
    const bad = structuredClone(old);
    bad.generated.courses[0].pieces[0].x++;
    expect(() => parseFile(JSON.stringify(bad))).toThrow("inconsistente");
  });
  it("arquivo íntegro e adulteração/órfãos/duplicatas recusados", () => {
    const d = fixture(),
      good = snapshot(toggleGrout(d, cell(d, 20000), true));
    expect(parseFile(JSON.stringify(good))).toEqual(good);
    const bad = structuredClone(good);
    bad.generated!.grouts![0].intervals[0].top -= 700;
    expect(() => parseFile(JSON.stringify(bad))).toThrow("inconsistente");
    const duplicate = {
      ...good,
      adjustments: {
        ...good.adjustments,
        grout: [...good.adjustments.grout, { ...good.adjustments.grout[0] }],
      },
    };
    expect(() => parseFile(JSON.stringify(duplicate))).toThrow("duplicado");
    const orphan = {
      ...good,
      adjustments: {
        ...good.adjustments,
        grout: [
          { ...good.adjustments.grout[0], wallIds: [crypto.randomUUID()] },
        ],
      },
    };
    expect(() => parseFile(JSON.stringify(orphan))).toThrow("referência");
  });
  it("limite de ajustes não trunca nem bloqueia cálculo da alvenaria", () => {
    const d = fixture();
    d.adjustments.grout = Array.from(
      { length: MAX_GROUT_ADJUSTMENTS + 1 },
      (_, i) => ({
        id: crypto.randomUUID(),
        x: i * 1250,
        y: 0,
        wallIds: [d.model.walls[0].id],
        action: "exclude" as const,
      }),
    );
    expect(generate(d).diagnostics.some((a) => a.code === "grout-limit")).toBe(
      true,
    );
    expect(generate(d).courses).toHaveLength(40);
    expect(() => parseFile(JSON.stringify(d))).toThrow();
  });
});
