import { CURRENT_PROJECT_FORMAT } from "../src/domain/project-format";
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
  defaultClampSettings,
  clampCourses,
  intervalFromList,
  parseClampList,
  validateClampSettings,
} from "../src/domain/clamps";
import {
  addFloor,
  duplicateFloor,
  editFloor,
  removeFloor,
} from "../src/domain/floors";
import { restoreAutomaticGrouts, toggleGrout } from "../src/domain/grout";
import {
  importedCopy,
  parseFile,
  serializeFile,
  validateProject,
} from "../src/persistence/files";
import { dehydrate, hydrate } from "../src/persistence/remote-document";
import { putOpening, wallAxis, wallStart } from "../src/domain/openings";
import { steelQuantities } from "../src/domain/steel-budget";

function fixture(
  kind: "L" | "T" | "cross",
  reinforced = true,
  rotation = 0,
  reflect = false,
  m = 1250,
) {
  const d = createProject(
    "Grampos",
    { length: 2 * m, width: m, height: 700 },
    9800,
  );
  d.project.channelLevels = [];
  d.project.groutSettings = { ...defaultGroutSettings(false), junctions: true };
  const f = d.model.floors[0];
  f.groutMode = reinforced ? "reinforced" : "simple";
  f.clamps = {
    ...defaultClampSettings(m),
    enabled: true,
    schedule: { mode: "list", courses: [5] },
  };
  function line(start: number, end: number, vertical: boolean) {
    const cells = Array.from({ length: end - start + 1 }, (_, i) => {
      let [x, y] = vertical ? [0, start + i] : [start + i, 0];
      if (reflect) x = -x;
      for (let j = 0; j < rotation; j++) [x, y] = [-y, x];
      return [x, y];
    });
    const xs = cells.map((p) => p[0]),
      ys = cells.map((p) => p[1]),
      horizontal = new Set(ys).size === 1;
    const a = { x: Math.min(...xs) * m, y: Math.min(...ys) * m };
    const b = {
      x: (Math.max(...xs) + (horizontal ? 1 : 0)) * m,
      y: (Math.max(...ys) + (horizontal ? 0 : 1)) * m,
    };
    d.model.walls.push(makeWall(b, a, m, f.id, 9800, 1)!);
  }
  line(kind === "L" ? 0 : -5, 5, false);
  line(kind === "cross" ? -5 : 0, 5, true);
  return d;
}
const clamps = (d: Project) => generate(d).floors[0].clamps!;
const calculated = (d: Project): Project => {
  const generated = generate(d);
  return {
    ...d,
    generated,
    generationState: { status: "current", diagnostics: generated.diagnostics },
  };
};

describe("T-025 grampos nominais", () => {
  it.each([1250, 1500, 1251])(
    "padrões em L/T/cruz, rotações e reflexões; módulo %i",
    (m) => {
      for (const kind of ["L", "T", "cross"] as const)
        for (const reinforced of [false, true])
          for (let r = 0; r < 4; r++)
            for (const reflection of [false, true]) {
              const d = fixture(kind, reinforced, r, reflection, m),
                generated = generate(d).floors[0];
              const result = generated.clamps!;
              expect(result).toHaveLength(
                reinforced
                  ? { L: 2, T: 3, cross: 4 }[kind]
                  : kind === "T"
                    ? 1
                    : 0,
              );
              expect(
                result.every(
                  (c) =>
                    !c.pending &&
                    c.course === 5 &&
                    c.top === 3500 &&
                    c.length === m + 2000 &&
                    c.leg === 1000 &&
                    c.diameter === 63,
                ),
              ).toBe(true);
              for (const c of result) {
                expect(Math.abs(c.a.x - c.b.x) + Math.abs(c.a.y - c.b.y)).toBe(
                  m,
                );
                expect(
                  generated.grouts!.some((g) => g.x === c.a.x && g.y === c.a.y),
                ).toBe(true);
                expect(
                  generated.grouts!.some((g) => g.x === c.b.x && g.y === c.b.y),
                ).toBe(true);
              }
              const without = structuredClone(d);
              delete without.model.floors[0].clamps;
              const baseline = generate(without).floors[0];
              expect(generated.courses).toEqual(baseline.courses);
              expect(generated.grouts).toEqual(baseline.grouts);
              expect(generated.channels).toEqual(baseline.channels);
            }
    },
  );
  it("intervalo/lista têm o mesmo conjunto, normalização e conversão sem aproximação", () => {
    expect([
      ...clampCourses({ mode: "interval", first: 5, every: 4, last: 14 }),
    ]).toEqual([5, 9, 13]);
    expect(parseClampList("13, 5, 9, 9")).toEqual([5, 9, 13]);
    expect(intervalFromList([5, 9, 13])).toEqual({
      mode: "interval",
      first: 5,
      every: 4,
      last: 13,
    });
    expect(intervalFromList([5])).toEqual({
      mode: "interval",
      first: 5,
      every: 1,
      last: 5,
    });
    expect(() => intervalFromList([2, 5, 9])).toThrow("irregular");
    for (const bad of ["1.5", "1e2", "-1", "1,", "0", "NaN"])
      expect(() => parseClampList(bad)).toThrow();
    const d = fixture("T");
    d.model.floors[0].clamps!.schedule = {
      mode: "interval",
      first: 5,
      every: 4,
      last: 14,
    };
    expect(clamps(d).map((c) => c.course)).toEqual([
      5, 5, 5, 9, 9, 9, 13, 13, 13,
    ]);
  });
  it("recusa dimensões inválidas e pontas não representáveis; altera tamanho sem mudar furos", () => {
    const d = fixture("T"),
      s = d.model.floors[0].clamps!;
    for (const diameter of [0, -1, 8.5, Infinity, Number.MAX_SAFE_INTEGER])
      expect(() =>
        validateClampSettings({ ...s, diameter }, 1250, 700),
      ).toThrow();
    for (const length of [1250, 0, 1251, Infinity])
      expect(() =>
        validateClampSettings({ ...s, length }, 1250, 700),
      ).toThrow();
    s.length = 4050;
    expect(clamps(d).every((c) => c.leg === 1400 && c.length === 4050)).toBe(
      true,
    );
    expect(() =>
      validateClampSettings(
        { ...s, schedule: { mode: "list", courses: [] } },
        1250,
        700,
      ),
    ).toThrow();
  });
  it("exclusão mantém pendência localizada, preserva peças e restauração reaplica", () => {
    let d = fixture("T");
    const before = generate(d).floors[0];
    const axis = before.grouts!.find((g) => g.x === 0 && g.y === 1250)!;
    d = toggleGrout(d, axis, true);
    const result = generate(d).floors[0];
    expect(result.clamps!.filter((c) => c.pending)).toHaveLength(1);
    expect(result.clamps!.filter((c) => !c.pending)).toHaveLength(2);
    expect(
      result.diagnostics.some(
        (x) =>
          x.code === "clamp-pending" && x.course === 5 && x.wallIds.length > 0,
      ),
    ).toBe(true);
    expect(result.courses).toEqual(before.courses);
    d = restoreAutomaticGrouts(d, d.model.floors[0].id);
    expect(clamps(d).every((c) => !c.pending)).toBe(true);
  });
  it("pontas, alturas e fiadas fora do alcance não são compensadas", () => {
    const d = fixture("T", false);
    d.model.floors[0].clamps!.schedule = { mode: "list", courses: [1, 5, 15] };
    const g = generate(d).floors[0];
    expect(g.clamps!.find((c) => c.course === 1)!.pending).toContain("pontas");
    expect(g.clamps!.find((c) => c.course === 5)!.pending).toBeUndefined();
    expect(
      g.diagnostics.some((x) => x.code === "clamp-pending" && x.course === 15),
    ).toBe(true);
    d.model.walls.find((w) => w.a.x === w.b.x)!.height = 2100;
    expect(clamps(d).some((c) => c.course === 5)).toBe(false);
    expect(d.model.floors[0].clamps!.schedule).toEqual({
      mode: "list",
      courses: [1, 5, 15],
    });
  });
  it("uma abertura abaixo da fiada omite a ligação cuja ponta atravessaria o vazio", () => {
    let d = fixture("T");
    const stem = d.model.walls.find((w) => w.a.x === w.b.x)!;
    d = putOpening(d, {
      id: crypto.randomUUID(),
      wallId: stem.id,
      kind: "window",
      offset: 1250,
      width: 1250,
      base: 2100,
      height: 700,
    });
    const result = generate(d).floors[0];
    expect(result.clamps!.some((c) => c.b.y === 1250)).toBe(false);
    expect(result.clamps!.filter((c) => !c.pending)).toHaveLength(2);
    expect(result.diagnostics.some((d) => d.code === "clamp-pending")).toBe(
      false,
    );
    expect(
      result.grouts!.find((a) => a.x === 0 && a.y === 1250)!.intervals,
    ).toEqual([
      { bottom: 0, top: 2100 },
      { bottom: 2800, top: 9800 },
    ]);
    const steel = steelQuantities(calculated(d));
    expect(steel.available).toBe(true);
    if (!steel.available) return;
    expect(steel.partial).toBe(false);
    expect(steel.floors[0].pending).toEqual([]);
    expect(
      steel.floors[0].details.find((row) => row.application === "clamps")!.base,
    ).toBe(65000000n);
  });
  it.each(["door", "window", "opening"] as const)(
    "%s omite somente o braço impedido, em rotações/reflexões, e remover a abertura restaura a programação",
    (kind) => {
      for (let rotation = 0; rotation < 4; rotation++)
        for (const reflect of [false, true]) {
          let doc = fixture("T", true, rotation, reflect);
          const before = generate(doc).floors[0],
            stem = doc.model.walls[1];
          const box = bounds(stem, doc.project.base.width);
          const branch = before.clamps!.find(
            (c) =>
              c.b.x >= box.x &&
              c.b.x < box.x + box.width &&
              c.b.y >= box.y &&
              c.b.y < box.y + box.height,
          )!;
          expect(branch).toBeDefined();
          doc = putOpening(doc, {
            id: crypto.randomUUID(),
            wallId: stem.id,
            kind,
            offset: branch.b[wallAxis(stem)] - wallStart(stem),
            width: 1250,
            base: kind === "window" ? 2100 : 0,
            height: kind === "window" ? 2100 : 4200,
          });
          const result = generate(doc).floors[0];
          expect(result.clamps).toEqual(
            before.clamps!.filter((c) => c.id !== branch.id),
          );
          expect(
            result.diagnostics.some((d) => d.code === "clamp-pending"),
          ).toBe(false);
          const without = structuredClone(doc);
          without.model.floors[0].clamps!.enabled = false;
          const baseline = generate(without).floors[0];
          expect(result.courses).toEqual(baseline.courses);
          expect(result.grouts).toEqual(baseline.grouts);
          expect(result.channels).toEqual(baseline.channels);
          doc.model.openings = [];
          expect(generate(doc).floors[0].clamps).toEqual(before.clamps);
        }
    },
  );
  it("janela dispensa só as fiadas cuja descida cruza o vazio, sem incluir contato de borda", () => {
    let doc = fixture("T", false);
    doc.model.floors[0].level = 14000;
    doc.model.floors[0].clamps!.length = 4050; // legs 14 cm = two courses
    doc.model.floors[0].clamps!.schedule = {
      mode: "list",
      courses: [2, 3, 5, 6],
    };
    const stem = doc.model.walls[1];
    doc = putOpening(doc, {
      id: crypto.randomUUID(),
      wallId: stem.id,
      kind: "window",
      offset: 1250,
      width: 1250,
      base: 2100,
      height: 700,
    });
    const result = generate(doc).floors[0];
    // Below sill (2), top at sill (3), descent into window (5),
    // and descent starting exactly at the window top (6).
    expect(result.clamps!.map((c) => c.course)).toEqual([2, 3, 6]);
    expect(result.clamps!.every((c) => !c.pending)).toBe(true);
    expect(result.diagnostics.some((d) => d.code === "clamp-pending")).toBe(
      false,
    );
  });
  it("abertura distante não dispensa graute excluído; abertura inválida mantém erro e pendência", () => {
    let doc = fixture("T");
    const before = generate(doc).floors[0];
    const branch = before.grouts!.find((g) => g.x === 0 && g.y === 1250)!;
    doc = toggleGrout(doc, branch, true);
    doc = putOpening(doc, {
      id: crypto.randomUUID(),
      wallId: doc.model.walls[1].id,
      kind: "window",
      offset: 3750,
      width: 1250,
      base: 2100,
      height: 2100,
    });
    expect(
      generate(doc).floors[0].clamps!.find((c) => c.b.y === 1250)!.pending,
    ).toContain("grauteado");
    doc.model.openings[0].offset = 1250;
    doc.model.openings[0].height = 20000; // invalid: beyond the wall
    const invalid = generate(doc).floors[0];
    expect(
      invalid.diagnostics.some((d) => d.code === "opening-outside-wall"),
    ).toBe(true);
    expect(invalid.diagnostics.some((d) => d.code === "clamp-pending")).toBe(
      true,
    );
  });
  it("leitor descarta snapshot nominal-v13 para recalcular grampos e recusa adulteração atual", () => {
    const doc = calculated(fixture("T"));
    const old = JSON.parse(serializeFile(doc).text);
    old.generated.convention = "nominal-v13";
    const loaded = validateProject(old);
    expect(loaded.generated).toBeNull();
    expect(loaded.generationState.status).toBe("outdated");
    expect(loaded.model).toEqual(doc.model);
    const tampered = structuredClone(doc);
    tampered.generated!.floors[0].clamps = [];
    expect(() => validateProject(tampered)).toThrow();
  });
  it("arquivo, remoto, cópia e pavimentos preservam intenção sem compartilhar mutações", () => {
    let d = calculated(fixture("T"));
    d.project.unitPrices = { whole: 250 };
    expect(parseFile(serializeFile(d).text)).toEqual(d);
    expect(hydrate(dehydrate(d, {}), {}).model.floors[0].clamps).toEqual(
      d.model.floors[0].clamps,
    );
    const copy = importedCopy(d);
    expect(copy.model.floors[0].clamps).toEqual(d.model.floors[0].clamps);
    d = duplicateFloor(d, d.model.floors[0].id, 14000, "Cópia");
    expect(generate(d).floors.map((f) => f.clamps!.length)).toEqual([3, 3]);
    expect(generate(d).floors[1].clamps![0].top).toBe(17500);
    expect(d.model.floors[1].clamps).not.toBe(d.model.floors[0].clamps);
    d = editFloor(d, d.model.floors[1].id, {
      clamps: { ...d.model.floors[1].clamps!, enabled: false },
    });
    expect(generate(d).floors.map((f) => f.clamps!.length)).toEqual([3, 0]);
    d = addFloor(d, { name: "Novo", level: 28000, defaultHeight: 9800 });
    expect(d.model.floors[2].clamps).toBeUndefined();
    d = removeFloor(d, d.model.floors[1].id);
    expect(d.model.floors[0].clamps!.enabled).toBe(true);
    expect(d.project.unitPrices).toEqual({ whole: 250 });
  });
  it("leitor 23 normaliza legado sem grampos e recusa campos antigos, adulteração e valores inválidos", () => {
    const d = calculated(fixture("T")),
      old = JSON.parse(serializeFile(d).text);
    old.schemaVersion = 22;
    delete old.model.floors[0].clamps;
    old.generated.convention = "nominal-v11";
    delete old.generated.floors[0].clamps;
    const source = structuredClone(old),
      restored = validateProject(old);
    expect(restored.schemaVersion).toBe(CURRENT_PROJECT_FORMAT);
    expect(restored.generated).toBeNull();
    expect(restored.model.floors[0].clamps).toBeUndefined();
    expect(old).toEqual(source);
    expect(() => validateProject({ ...d, schemaVersion: 22 })).toThrow(
      "grampos",
    );
    for (const change of [
      { enabled: "yes" },
      { diameter: 0 },
      { length: 1251 },
      { schedule: { mode: "list", courses: [5, 5] } },
      { schedule: { mode: "interval", first: 9, every: 0, last: 5 } },
    ]) {
      const bad = structuredClone(d);
      Object.assign(bad.model.floors[0].clamps!, change);
      expect(() => validateProject(bad)).toThrow();
    }
    const bad = structuredClone(d);
    bad.generated!.floors[0].clamps!.pop();
    expect(() => validateProject(bad)).toThrow("inconsistente");
    expect(() =>
      validateProject({ ...d, schemaVersion: CURRENT_PROJECT_FORMAT + 1 }),
    ).toThrow("incompatível");
  });
});
