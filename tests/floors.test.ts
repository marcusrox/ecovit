import { describe, expect, it } from "vitest";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
  LIMIT,
  type Project,
} from "../src/domain/project";
import {
  addFloor,
  duplicateFloor,
  editFloor,
  removeFloor,
  mergeFloorView,
} from "../src/domain/floors";
import { floorView, generate } from "../src/domain/composition";
import { putOpening } from "../src/domain/openings";
import { suppressBand } from "../src/domain/channels";
import { toggleGrout } from "../src/domain/grout";
import {
  importedCopy,
  parseFile,
  validateProject,
  MAX_FILE,
} from "../src/persistence/files";

function project(m = 1250, h = 700) {
  const d = createProject(
    "M4.1",
    { length: 2 * m, width: m, height: h },
    40 * h,
  );
  d.project.channelLevels = [];
  d.project.groutSettings = defaultGroutSettings(false);
  return d;
}
function wall(
  d: Project,
  floorId = d.model.floors[0].id,
  length = 8 * d.project.base.width,
  height = 3 * d.project.base.height,
) {
  const w = makeWall(
    { x: 0, y: 0 },
    { x: length, y: 0 },
    d.project.base.width,
    floorId,
    height,
    1,
  )!;
  d.model.walls.push(w);
  return w;
}
function snapshot(d: Project): Project {
  const generated = generate(d);
  return {
    ...d,
    generated,
    generationState: { status: "current", diagnostics: generated.diagnostics },
  };
}
describe("M4.1 — contratos e isolamento EX-56–64", () => {
  it("EX-56 cotas ordenadas, negativas, distintas, limites de pavimento e nome", () => {
    let d = project();
    const id = d.model.floors[0].id;
    d = addFloor(d, { name: "Superior", level: 28000, defaultHeight: 28000 });
    d = addFloor(d, { name: "Inferior", level: -2100, defaultHeight: 28000 });
    expect(d.model.floors.map((f) => f.level)).toEqual([-2100, 0, 28000]);
    expect(d.model.floors[1].id).toBe(id);
    expect(() =>
      addFloor(d, { name: "X", level: 28000, defaultHeight: 28000 }),
    ).toThrow("Já existe");
    expect(() =>
      addFloor(d, { name: "X", level: 28100, defaultHeight: 28000 }),
    ).toThrow("compatíveis");
    expect(() =>
      addFloor(d, { name: " ", level: 35000, defaultHeight: 28000 }),
    ).toThrow("nome");
    d = addFloor(d, { name: "Superior", level: 35000, defaultHeight: 28000 });
    expect(() =>
      addFloor(d, { name: "Quinto", level: 42000, defaultHeight: 28000 }),
    ).toThrow("quatro");
  });
  it.each([
    [1250, 700],
    [1500, 700],
    [1400, 600],
    [1251, 700],
  ])("EX-57 fase local e cobertura nominal m=%i h=%i", (m, h) => {
    let d = project(m, h);
    wall(d);
    d = addFloor(d, { name: "Superior", level: 41 * h, defaultHeight: 40 * h });
    const upper = d.model.floors[1];
    wall(d, upper.id);
    const g = generate(d);
    for (const f of g.floors) {
      expect(f.courses.map((r) => [r.bottom, r.top])).toEqual([
        [0, h],
        [h, 2 * h],
        [2 * h, 3 * h],
      ]);
      expect(
        f.courses.map((r) =>
          r.pieces.map((p) => (p.width * p.height) / (m * m)).sort(),
        ),
      ).toEqual([
        [2, 2, 2, 2],
        [1, 1, 2, 2, 2],
        [2, 2, 2, 2],
      ]);
      expect(f.diagnostics.filter((a) => a.severity === "error")).toEqual([]);
    }
    expect(g.floors[0].courses[0].pieces[0].id).not.toBe(
      g.floors[1].courses[0].pieces[0].id,
    );
    expect(validateProject(snapshot(d)).model.floors).toEqual(d.model.floors);
  });
  it("EX-58 grautes coincidentes independentes e colisões somente no mesmo andar", () => {
    let d = project();
    const lower = wall(d);
    d = addFloor(d, { name: "Sobreposto", level: 1400, defaultHeight: 28000 });
    const upper = wall(d, d.model.floors[1].id);
    d = toggleGrout(d, { x: 0, y: 0, wallIds: [lower.id] }, false);
    let g = generate(d);
    expect(g.floors[0].grouts?.[0].intervals).toEqual([
      { bottom: 0, top: 2100 },
    ]);
    expect(g.floors[1].grouts).toEqual([]);
    d = toggleGrout(d, { x: 0, y: 0, wallIds: [upper.id] }, false);
    d = toggleGrout(d, { x: 0, y: 0, wallIds: [lower.id] }, true);
    g = generate(d);
    expect(g.floors[0].grouts).toEqual([]);
    expect(g.floors[1].grouts?.[0].intervals).toEqual([
      { bottom: 1400, top: 3500 },
    ]);
    expect(g.diagnostics.filter((a) => a.severity === "error")).toEqual([]);
    d.model.walls.push({ ...lower, id: crypto.randomUUID() });
    g = generate(d);
    expect(g.floors[0].diagnostics.some((a) => a.code === "overlap")).toBe(
      true,
    );
    expect(g.floors[1].courses[0].pieces).toHaveLength(4);
  });
  it("EX-59 deslocamento de cotas conserva referências relativas e supressões dormentes", () => {
    let d = project();
    const low = wall(d);
    d = addFloor(d, { name: "Superior", level: 28000, defaultHeight: 28000 });
    const f = d.model.floors[1],
      w = wall(d, f.id, 40000, 28000);
    d = putOpening(d, {
      id: crypto.randomUUID(),
      wallId: w.id,
      kind: "window",
      offset: 10000,
      width: 10000,
      base: 11200,
      height: 10500,
    });
    d = suppressBand(d, w.id, 39200);
    d = suppressBand(d, w.id, 28700); // Dormant, but a valid absolute course.
    const before = structuredClone(d);
    const moved = editFloor(d, f.id, { level: 35000 });
    expect(moved.model.openings).toEqual(before.model.openings);
    expect(moved.adjustments.channels.map((a) => a.top)).toEqual([
      46200, 35700,
    ]);
    expect(moved.adjustments.channels.map((a) => a.id)).toEqual(
      before.adjustments.channels.map((a) => a.id),
    );
    expect(moved.model.walls.find((w) => w.id === low.id)).toEqual(low);
    expect(editFloor(moved, f.id, { level: 28000 })).toEqual(before);
    expect(validateProject(snapshot(moved)).model.floors[1].level).toBe(35000);
  });
  it("EX-60 cópia de L com escolha ativa e supressão não cria pendências", () => {
    let d = project();
    const f = d.model.floors[0].id;
    d = editFloor(d, f, { level: 28000 });
    const horizontal = wall(d, f, 40000, 28000);
    d.model.walls.push(
      makeWall({ x: 0, y: 0 }, { x: 0, y: 10000 }, 1250, f, 28000, 1)!,
    );
    d.project.channelLevels = [{ id: crypto.randomUUID(), top: 11200 }];
    const c = generate(d).floors[0].components[0];
    expect(c.alternative).toBe(true);
    d.adjustments.junctions = [
      {
        id: crypto.randomUUID(),
        floorId: f,
        anchor: { x: c.x, y: c.y },
        binding: "active",
        componentId: c.id,
        signature: c.signature,
        wallIds: c.wallIds,
        phase: 1,
      },
    ];
    d = suppressBand(d, horizontal.id, 39200);
    const before = structuredClone(d),
      copy = duplicateFloor(d, f, 42000, "Cópia");
    expect(d).toEqual(before);
    expect(copy.adjustments.channels.map((a) => a.top)).toEqual([39200, 53200]);
    expect(new Set(copy.model.walls.map((w) => w.id)).size).toBe(4);
    expect(copy.project.channelLevels).toEqual(before.project.channelLevels);
    const g = generate(copy);
    expect(g.floors.map((f) => f.components[0].phase)).toEqual([1, 1]);
    expect(g.diagnostics.filter((a) => a.severity === "error")).toEqual([]);
    expect(parseFile(JSON.stringify(snapshot(copy))).adjustments).toEqual(
      copy.adjustments,
    );
  });
  it.each(["signature", "componentId", "ambos"])(
    "EX-60 cópia conserva pendência de escolha ativa incompatível em %s",
    (field) => {
      const d = project();
      const f = d.model.floors[0].id;
      wall(d);
      d.model.walls.push(
        makeWall({ x: 0, y: 0 }, { x: 0, y: 10000 }, 1250, f, 2100, 1)!,
      );
      const c = generate(d).floors[0].components[0];
      d.adjustments.junctions = [
        {
          id: crypto.randomUUID(),
          floorId: f,
          anchor: { x: c.x, y: c.y },
          binding: "active",
          phase: 1,
          wallIds: c.wallIds,
          signature:
            field === "componentId" ? c.signature : "geometria-anterior",
          componentId: field === "signature" ? c.id : "encontro-anterior",
        },
      ];
      const before = snapshot(d);
      validateProject(before);
      const copy = duplicateFloor(before, f, 28000, "Cópia");
      const original = copy.adjustments.junctions[0];
      const choice = copy.adjustments.junctions[1];
      expect(original).toEqual(before.adjustments.junctions[0]);
      expect(choice.binding).toBe("pending");
      expect(choice.phase).toBe(original.phase);
      expect(choice.anchor).toEqual(original.anchor);
      expect(choice.id).not.toBe(original.id);
      expect(choice.wallIds.every((id) => !original.wallIds.includes(id))).toBe(
        true,
      );
      const current = snapshot(copy);
      expect(current.generated!.floors[0]).toEqual(before.generated!.floors[0]);
      expect(
        current.generated!.floors[1].diagnostics.some(
          (a) =>
            a.code === "adjustment" && a.adjustmentIds?.includes(choice.id),
        ),
      ).toBe(true);
      expect(
        current.generated!.floors[1].courses.every(
          (c) => c.pieces.length === 0,
        ),
      ).toBe(true);
      expect(parseFile(JSON.stringify(current))).toEqual(current);
    },
  );
  it("EX-61 remoção elimina dependentes locais e impede remover o último", () => {
    let d = project();
    const first = wall(d);
    d = addFloor(d, { name: "Outro", level: -2100, defaultHeight: 28000 });
    const second = wall(d, d.model.floors[0].id);
    d = toggleGrout(d, { x: 0, y: 0, wallIds: [first.id] }, false);
    d = suppressBand(d, first.id, 700);
    const next = removeFloor(d, first.floorId);
    expect(next.model.walls).toEqual([second]);
    expect(next.adjustments.grout).toEqual([]);
    expect(next.adjustments.channels).toEqual([]);
    expect(() => removeFloor(next, second.floorId)).toThrow("ao menos");
  });
  it("mescla da vista local preserva paredes, vãos e ajustes do outro pavimento", () => {
    let d = project();
    const first = wall(d);
    d = addFloor(d, { name: "Outro", level: 7000, defaultHeight: 28000 });
    wall(d, d.model.floors[1].id);
    const local = floorView(d, first.floorId);
    local.model.walls = [];
    const result = mergeFloorView(d, local);
    expect(result.model.walls).toEqual(d.model.walls.slice(1));
    expect(result.model.floors).toEqual(d.model.floors);
    expect("viewFloorId" in result).toBe(false);
  });
  it("EX-62 padrão usual 280 cm é modular; altura padrão só inicializa paredes futuras", () => {
    let d = project();
    const w = wall(d);
    d = editFloor(d, w.floorId, { defaultHeight: 21000 });
    d = addFloor(d, { name: "Novo", level: 28000, defaultHeight: 28000 });
    expect(d.model.floors[1].defaultHeight / 700).toBe(40);
    expect(d.model.walls[0].height).toBe(2100);
    expect(() => editFloor(d, w.floorId, { defaultHeight: 28100 })).toThrow(
      "compatíveis",
    );
  });
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 19, 99])(
    "EX-63 recusa envelope %i sem conversão",
    (version) => {
      const d = project();
      expect(() =>
        parseFile(JSON.stringify({ ...d, schemaVersion: version })),
      ).toThrow("incompatível");
    },
  );
  it("EX-63 reabertura, cópia, snapshot adulterado e associações cruzadas", () => {
    let d = project();
    const w = wall(d);
    d = addFloor(d, { name: "Outro", level: 7000, defaultHeight: 28000 });
    const other = wall(d, d.model.floors[1].id);
    const current = snapshot(d);
    expect(parseFile(JSON.stringify(current))).toEqual(current);
    const copy = importedCopy(current);
    expect(copy.project.id).not.toBe(current.project.id);
    expect(copy.model).toEqual(current.model);
    const bad = structuredClone(current);
    bad.generated!.floors[0].courses[0].pieces[0].x += 1250;
    expect(() => parseFile(JSON.stringify(bad))).toThrow("inconsistente");
    const cross = structuredClone(d);
    cross.adjustments.grout = [
      {
        id: crypto.randomUUID(),
        floorId: w.floorId,
        x: 0,
        y: 0,
        wallIds: [w.id, other.id],
        action: "include",
      },
    ];
    expect(() => validateProject(cross)).toThrow("pavimentos diferentes");
    expect(() =>
      validateProject({ ...d, model: { ...d.model, slabs: [{}] } }),
    ).toThrow();
    const stale = {
      ...current,
      generationState: { status: "outdated", diagnostics: [] },
    };
    expect(() => validateProject(stale)).toThrow("resultado ausente");
  });
  it("EX-60 cópia conserva escolhas pendentes sem promover seu vínculo", () => {
    const d = project(),
      w = wall(d);
    d.adjustments.junctions = [
      {
        id: crypto.randomUUID(),
        floorId: w.floorId,
        anchor: { x: 0, y: 0 },
        binding: "pending",
        componentId: "encontro-anterior",
        signature: "geometria-anterior",
        wallIds: [w.id],
        phase: 1,
      },
    ];
    const copy = duplicateFloor(d, w.floorId, 28000, "Cópia");
    expect(copy.adjustments.junctions.map((a) => a.binding)).toEqual([
      "pending",
      "pending",
    ]);
    expect(copy.adjustments.junctions[1].id).not.toBe(
      d.adjustments.junctions[0].id,
    );
    expect(
      generate(copy).diagnostics.filter((d) => d.code === "adjustment"),
    ).toHaveLength(2);
  });
  it.each([
    "walls",
    "openings",
    "levels",
    "junctions",
    "channels",
    "grout",
  ] as const)("EX-64 fronteira de registros de intenção: %s", (kind) => {
    const d = project(),
      w = wall(d),
      floorId = w.floorId;
    const count = kind === "levels" ? 100 : kind === "openings" ? 1000 : 10000;
    const records = Array.from({ length: count }, (_, i) => {
      const id = crypto.randomUUID();
      if (kind === "walls") return { ...w, id };
      if (kind === "openings")
        return {
          id,
          wallId: w.id,
          kind: "window",
          offset: 0,
          width: 1250,
          base: 0,
          height: 700,
        };
      if (kind === "levels") return { id, top: (i + 1) * 700 };
      if (kind === "junctions")
        return {
          id,
          floorId,
          anchor: { x: 0, y: 0 },
          binding: "pending",
          componentId: "anterior",
          signature: "anterior",
          wallIds: [w.id],
          phase: 0,
        };
      if (kind === "channels")
        return { id, floorId, wallId: w.id, top: 700, scope: { kind: "wall" } };
      return { id, floorId, x: 0, y: 0, wallIds: [w.id], action: "include" };
    });
    // The reader checks the canonical file contract, independently of UI limits.
    const target =
      kind === "levels"
        ? d.project
        : kind === "walls" || kind === "openings"
          ? d.model
          : d.adjustments;
    const key = kind === "levels" ? "channelLevels" : kind;
    Object.assign(target, { [key]: records });
    expect(() => validateProject(d)).not.toThrow();
    records.push({ ...records[0], id: crypto.randomUUID() });
    expect(() => validateProject(d)).toThrow("estrutura");
  });
  it("EX-64 limites de integridade preservados sem orçamento de geração", () => {
    let d = project();
    wall(d);
    for (const level of [7000, 14000, 21000]) {
      d = addFloor(d, { name: "Andar", level, defaultHeight: 28000 });
      wall(d, d.model.floors.find((f) => f.level === level)!.id);
    }
    const g = generate(d);
    expect(g.floors.map((f) => f.courses.length)).toEqual([3, 3, 3, 3]);
    expect(
      g.floors
        .flatMap((f) => f.courses)
        .reduce(
          (n, r) =>
            n +
            r.pieces.reduce((s, p) => s + (p.width * p.height) / 1250 ** 2, 0),
          0,
        ),
    ).toBe(96);
    expect(() => parseFile(" ".repeat(MAX_FILE + 1))).toThrow("50 MB");
    const a = d.model.floors[0];
    expect(() => editFloor(d, a.id, { level: LIMIT })).toThrow();
    const duplicates = {
      ...d,
      model: { ...d.model, walls: [d.model.walls[0], d.model.walls[0]] },
    };
    expect(() => validateProject(duplicates)).toThrow("duplicados");
  });
});
