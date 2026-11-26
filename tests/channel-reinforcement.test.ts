import { describe, expect, it } from "vitest";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
  type Project,
} from "../src/domain/project";
import { generate } from "../src/domain/composition";
import {
  defaultChannelReinforcement,
  parseChannelReinforcement,
  validateChannelReinforcement,
} from "../src/domain/channel-reinforcement";
import {
  addFloor,
  duplicateFloor,
  editFloor,
  removeFloor,
} from "../src/domain/floors";
import { suppressBand } from "../src/domain/channels";
import { putOpening } from "../src/domain/openings";
import {
  parseFile,
  serializeFile,
  validateProject,
  importedCopy,
} from "../src/persistence/files";
import { dehydrate, hydrate } from "../src/persistence/remote-document";
import { quantities } from "../src/domain/quantities";

function fixture(vertical = false, reverse = false, m = 1250) {
  const d = createProject(
      "Armadura das cintas",
      { length: 2 * m, width: m, height: 700 },
      7000,
    ),
    floor = d.model.floors[0];
  d.project.channelLevels = [{ id: crypto.randomUUID(), top: 3500 }];
  d.project.groutSettings = defaultGroutSettings(false);
  floor.channelReinforcement = {
    ...defaultChannelReinforcement(),
    enabled: true,
  };
  const a = { x: 0, y: 0 },
    b = vertical ? { x: 0, y: 8 * m } : { x: 8 * m, y: 0 };
  d.model.walls = [
    makeWall(reverse ? b : a, reverse ? a : b, m, floor.id, 7000, 1)!,
  ];
  return d;
}
function current(d: Project): Project {
  const generated = generate(d);
  return {
    ...d,
    generated,
    generationState: { status: "current", diagnostics: generated.diagnostics },
  };
}
const runs = (d: Project) => generate(d).floors[0].reinforcement!;

describe("T-026 armaduras longitudinais nominais", () => {
  it.each([1250, 1500, 1251])(
    "trecho de 8 células, orientação e sentido sem alterar peças, módulo %i",
    (m) => {
      for (const vertical of [false, true])
        for (const reverse of [false, true]) {
          const d = fixture(vertical, reverse, m),
            result = generate(d).floors[0];
          expect(result.reinforcement).toHaveLength(1);
          const r = result.reinforcement![0];
          expect(r).toMatchObject({
            course: 5,
            top: 3500,
            count: 2,
            diameter: 100,
            a: { x: 0, y: 0 },
            b: vertical ? { x: 0, y: 8 * m } : { x: 8 * m, y: 0 },
          });
          const before = structuredClone(d);
          delete before.model.floors[0].channelReinforcement;
          const baseline = generate(before).floors[0];
          expect(result.courses).toEqual(baseline.courses);
          expect(result.channels).toEqual(baseline.channels);
          expect(result.grouts).toEqual(baseline.grouts);
          expect(result.clamps).toEqual(baseline.clamps);
          expect(quantities(current(d))).toEqual(quantities(current(before)));
        }
    },
  );
  it("nível, verga e contraverga usam o mesmo conjunto, sem duplicar demandas", () => {
    let d = fixture();
    d = putOpening(d, {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "window",
      offset: 2500,
      width: 2500,
      base: 2100,
      height: 700,
    });
    d.project.channelLevels[0].top = 2100;
    d.model.floors[0].channelReinforcement = {
      enabled: true,
      count: 3,
      diameter: 63,
    };
    const result = runs(d);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.course)).toEqual([3, 5]);
    expect(result.every((r) => r.count === 3 && r.diameter === 63)).toBe(true);
    expect(result[0].b.x - result[0].a.x).toBe(10000);
    expect(result[1].b.x - result[1].a.x).toBe(5000);
    expect(result[0].origins).toEqual(
      expect.arrayContaining([
        `level:${d.project.channelLevels[0].id}`,
        expect.stringMatching(/^opening-bottom:/),
      ]),
    );
    expect(result[1].origins).toEqual([expect.stringMatching(/^opening-top:/)]);
  });
  it("aberturas e supressões interrompem o aço sem preencher lacunas", () => {
    let d = fixture();
    d = putOpening(d, {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "door",
      offset: 2500,
      width: 2500,
      base: 0,
      height: 4200,
    });
    expect(
      runs(d)
        .filter((r) => r.course === 5)
        .map((r) => [r.a.x, r.b.x]),
    ).toEqual([
      [0, 2500],
      [5000, 10000],
    ]);
    d = suppressBand(d, d.model.walls[0].id, 3500);
    expect(runs(d).some((r) => r.course === 5)).toBe(false);
    expect(runs(d).some((r) => r.course === 7)).toBe(true);
  });
  it("paredes contíguas colineares deduplicam e unificam os trechos nas duas fases", () => {
    const d = fixture(),
      id = d.model.floors[0].id;
    d.model.walls = [
      makeWall({ x: 0, y: 0 }, { x: 5000, y: 0 }, 1250, id, 7000, 1)!,
      makeWall({ x: 10000, y: 0 }, { x: 5000, y: 0 }, 1250, id, 7000, 1)!,
    ];
    const result = runs(d);
    expect(result).toHaveLength(1);
    expect(result[0].wallIds).toHaveLength(2);
    expect(result[0].a).toEqual({ x: 0, y: 0 });
    expect(result[0].b).toEqual({ x: 10000, y: 0 });
    d.model.walls.reverse();
    expect(runs(d)).toEqual(result);
    const hole = suppressBand(d, d.model.walls[0].id, 3500);
    expect(runs(hole)).toHaveLength(1);
    expect(runs(hole)[0].b.x).toBe(5000);
  });
  it.each(["L", "T", "cross"] as const)(
    "encontro %s mantém direções separadas, sem emenda inventada",
    (kind) => {
      const d = fixture(),
        f = d.model.floors[0].id;
      d.model.walls = [
        makeWall(
          { x: kind === "L" ? 0 : -5000, y: 0 },
          { x: 5000, y: 0 },
          1250,
          f,
          7000,
          1,
        )!,
        makeWall(
          { x: 0, y: kind === "cross" ? -5000 : 0 },
          { x: 0, y: 5000 },
          1250,
          f,
          7000,
          1,
        )!,
      ];
      const result = runs(d);
      expect(result).toHaveLength(2);
      expect(result.filter((r) => r.a.y === r.b.y)).toHaveLength(1);
      expect(result.filter((r) => r.a.x === r.b.x)).toHaveLength(1);
      expect(new Set(result.map((r) => r.id)).size).toBe(2);
    },
  );
  it("padrões, precisão, valores inválidos e quantidade grande não expandem barras", () => {
    expect(defaultChannelReinforcement()).toEqual({
      enabled: false,
      count: 2,
      diameter: 100,
    });
    expect(parseChannelReinforcement(true, "3", "6,3")).toEqual({
      enabled: true,
      count: 3,
      diameter: 63,
    });
    expect(parseChannelReinforcement(false, "1", "8.0")).toEqual({
      enabled: false,
      count: 1,
      diameter: 80,
    });
    for (const count of ["0", "-1", "1.5", "1e2", "NaN", "9007199254740992"])
      expect(() => parseChannelReinforcement(true, count, "8")).toThrow();
    for (const diameter of ["0", "-1", "8.01", "NaN", "Infinity", "1e2"])
      expect(() => parseChannelReinforcement(true, "2", diameter)).toThrow();
    expect(() =>
      validateChannelReinforcement({
        enabled: true,
        count: 2,
        diameter: Infinity,
      }),
    ).toThrow();
    const d = fixture();
    d.model.floors[0].channelReinforcement!.count = Number.MAX_SAFE_INTEGER;
    expect(runs(d)).toHaveLength(1);
    d.model.floors[0].channelReinforcement!.enabled = false;
    expect(runs(d)).toEqual([]);
  });
  it("pavimentos, cópia, arquivo e representação remota preservam parâmetros isolados", () => {
    let d = current(fixture());
    d.project.unitPrices = { whole: 250 };
    expect(parseFile(serializeFile(d).text)).toEqual(d);
    expect(hydrate(dehydrate(d, {}), {}).model.floors).toEqual(d.model.floors);
    expect(importedCopy(d).model.floors).toEqual(d.model.floors);
    d = duplicateFloor(d, d.model.floors[0].id, 14000, "Superior");
    expect(d.model.floors[1].channelReinforcement).not.toBe(
      d.model.floors[0].channelReinforcement,
    );
    expect(generate(d).floors.map((f) => f.reinforcement![0].top)).toEqual([
      3500, 17500,
    ]);
    d = editFloor(d, d.model.floors[1].id, {
      channelReinforcement: { enabled: true, count: 1, diameter: 100 },
    });
    expect(generate(d).floors.map((f) => f.reinforcement![0].count)).toEqual([
      2, 1,
    ]);
    d = addFloor(d, { name: "Novo", level: 28000, defaultHeight: 7000 });
    expect(d.model.floors[2].channelReinforcement).toBeUndefined();
    d = removeFloor(d, d.model.floors[1].id);
    expect(d.model.floors[0].channelReinforcement!.count).toBe(2);
    expect(d.project.unitPrices).toEqual({ whole: 250 });
  });
  it("leitor 24 conserva legado e recusa campo antigo, dados inválidos e resultado adulterado", () => {
    const d = current(fixture()),
      old = JSON.parse(serializeFile(d).text);
    old.schemaVersion = 23;
    delete old.model.floors[0].channelReinforcement;
    old.generated.convention = "nominal-v12";
    delete old.generated.floors[0].reinforcement;
    const source = structuredClone(old),
      loaded = validateProject(old);
    expect(loaded.schemaVersion).toBe(34);
    expect(loaded.model.floors[0].channelReinforcement).toBeUndefined();
    expect(loaded.generated).toBeNull();
    expect(old).toEqual(source);
    expect(() => validateProject({ ...d, schemaVersion: 23 })).toThrow(
      "armadura",
    );
    for (const settings of [
      { enabled: false, count: 0, diameter: 80 },
      { enabled: "yes", count: 2, diameter: 80 },
      { enabled: true, count: 2, diameter: 8.5 },
      { enabled: true, count: 2, diameter: 80, verga: {} },
    ]) {
      const bad = structuredClone(d);
      Object.assign(bad.model.floors[0], { channelReinforcement: settings });
      expect(() => validateProject(bad)).toThrow();
    }
    const bad = structuredClone(d);
    bad.generated!.floors[0].reinforcement![0].count = 7;
    expect(() => validateProject(bad)).toThrow("inconsistente");
    expect(() => validateProject({ ...d, schemaVersion: 35 })).toThrow(
      "incompatível",
    );
  });
});
