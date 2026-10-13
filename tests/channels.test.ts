import { describe, expect, it } from "vitest";
import {
  createProject,
  makeWall,
  type Project,
  type Opening,
} from "../src/domain/project";
import { generate, type Piece } from "../src/domain/composition";
import {
  isChannel,
  restoreBand,
  suppressBand,
  validateChannelLevels,
} from "../src/domain/channels";
import { parseFile, importedCopy } from "../src/persistence/files";
import { putOpening } from "../src/domain/openings";
function fixture(m = 1250, h = 700, vertical = false, side: 1 | -1 = 1) {
  const d = createProject("Canaletas", { length: 2 * m, width: m, height: h });
  d.project.channelLevels = [];
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
function window(
  d: Project,
  offset = 8 * d.project.base.width,
  width = 8 * d.project.base.width,
  base = 9800,
  height = 11200,
): Opening {
  return {
    id: crypto.randomUUID(),
    wallId: d.model.walls[0].id,
    kind: "window",
    offset,
    width,
    base,
    height,
  };
}
const counts = (ps: Piece[]) => [
  ps.filter((p) => p.kind === "channel").length,
  ps.filter((p) => p.kind === "half-channel").length,
];
function current(d: Project) {
  const g = generate(d);
  return {
    ...d,
    generated: g,
    generationState: { status: "current" as const, diagnostics: g.diagnostics },
  };
}
function covered(ps: Piece[], m: number) {
  const cells = new Set<string>();
  for (const p of ps)
    for (let y = p.y; y < p.y + p.height; y += m)
      for (let x = p.x; x < p.x + p.width; x += m) {
        const k = `${x},${y}`;
        expect(cells.has(k)).toBe(false);
        cells.add(k);
      }
  return cells;
}
describe("M3.2 canaletas nominais", () => {
  it("EX-28 canaletas locais e meios de borda com contagens independentes", () => {
    let d = fixture();
    d = putOpening(d, window(d));
    const g = generate(d);
    expect(counts(g.courses[13].pieces)).toEqual([5, 0]);
    expect(counts(g.courses[30].pieces)).toEqual([4, 2]);
    expect(
      g.channels!.find((b) => b.course === 14)!.cells.map((c) => c.x),
    ).toEqual([
      8750, 10000, 11250, 12500, 13750, 15000, 16250, 17500, 18750, 20000,
    ]);
    expect(g.courses[14].pieces.some(isChannel)).toBe(false);
    expect(covered(g.courses[30].pieces, 1250).size).toBe(32);
  });
  it("EX-31 níveis globais e demandas locais coincidentes têm duas origens por célula", () => {
    let d = fixture();
    const id1 = crypto.randomUUID(),
      id2 = crypto.randomUUID();
    d.project.channelLevels = [
      { id: id1, top: 11200 },
      { id: id2, top: 22400 },
    ];
    const o = window(d, 10000, 10000, 11200, 10500);
    d = putOpening(d, o);
    const g = generate(d);
    expect(counts(g.courses[15].pieces)).toEqual([15, 2]);
    expect(counts(g.courses[31].pieces)).toEqual([15, 2]);
    const band = g.channels!.find((b) => b.course === 16)!;
    expect(band.cells).toHaveLength(32);
    expect(band.cells[7].origins).toEqual(
      [`level:${id1}`, `opening-bottom:${o.id}`].sort(),
    );
    expect(band.cells[0].origins).toEqual([`level:${id1}`]);
    expect(covered(g.courses[15].pieces, 1250).size).toBe(32);
  });
  it("EX-26 fiada entre empilhados é compartilhada sem duplicar peças", () => {
    let d = fixture();
    const low = { ...window(d, 10000, 10000, 0, 10500), kind: "door" as const },
      high = window(d, 10000, 10000, 11200, 9800);
    d = putOpening(putOpening(d, low), high);
    const g = generate(d),
      b = g.channels!.find((b) => b.course === 16)!;
    expect(counts(g.courses[15].pieces)).toEqual([5, 0]);
    expect(b.cells).toHaveLength(10);
    expect(b.cells.every((c) => c.origins.length === 2)).toBe(true);
    expect(b.cells[0].origins).toEqual(
      [`opening-top:${low.id}`, `opening-bottom:${high.id}`].sort(),
    );
  });
  it("porta na base sem inferior; elevada com inferior; topo da parede sem superior", () => {
    let d = fixture();
    d = putOpening(d, { ...window(d, 10000, 10000, 0, 21000), kind: "door" });
    let g = generate(d);
    expect(g.channels!.map((b) => b.course)).toEqual([31]);
    d = fixture();
    d = putOpening(d, { ...window(d, 10000, 10000, 700, 21000), kind: "door" });
    g = generate(d);
    expect(g.channels!.map((b) => b.course)).toEqual([1, 32]);
    d = fixture();
    d = putOpening(d, window(d, 10000, 10000, 9800, 18200));
    g = generate(d);
    expect(g.channels!.map((b) => b.course)).toEqual([14]);
  });
  it("vão na ponta livre não prolonga a parede nem canaleta", () => {
    let d = fixture();
    d = putOpening(d, window(d, 0, 10000));
    const g = generate(d);
    expect(
      g.channels!.every((b) => b.cells.every((c) => c.x >= 0 && c.x < 40000)),
    ).toBe(true);
    expect(g.channels![0].cells.map((c) => c.x)).toEqual([
      0, 1250, 2500, 3750, 5000, 6250, 7500, 8750, 10000,
    ]);
  });
  it("EX-35 supressão cobre toda a parede, incluindo trechos descontínuos e origens", () => {
    let d = fixture();
    d.project.channelLevels = [
      { id: crypto.randomUUID(), top: 11200 },
      { id: crypto.randomUUID(), top: 22400 },
    ];
    d = putOpening(d, window(d));
    d = putOpening(d, window(d, 25000, 10000, 11200, 10500));
    const g = generate(d);
    const band = g.channels!.find((b) => b.course === 16)!;
    expect(band.cells).toHaveLength(24);
    d = suppressBand(d, d.model.walls[0].id, 11200);
    let after = generate(d);
    expect(after.courses[15].pieces.some(isChannel)).toBe(false);
    expect(after.courses[31].pieces).toEqual(g.courses[31].pieces);
    expect(after.courses[15].pieces).toEqual(
      generate(d, "nominal-v4").courses[15].pieces,
    );
    expect(
      after.diagnostics.some((x) => x.code === "adjustment-target-missing"),
    ).toBe(false);
    d = restoreBand(d, d.model.walls[0].id, 11200);
    after = generate(d);
    expect(after.courses[15].pieces).toEqual(g.courses[15].pieces);
  });
  it("extensão da parede fica abrangida; nível movido não desloca exclusão", () => {
    let d = fixture();
    const id = crypto.randomUUID();
    d.project.channelLevels = [{ id, top: 11200 }];
    d = suppressBand(d, d.model.walls[0].id, 11200);
    d.model.walls[0].b.x = 50000;
    expect(generate(d).courses[15].pieces.some(isChannel)).toBe(false);
    d.project.channelLevels = [{ id, top: 11900 }];
    let g = generate(d);
    expect(g.courses[16].pieces.every(isChannel)).toBe(true);
    expect(d.adjustments.channels[0].top).toBe(11200);
    d.project.channelLevels = [{ id, top: 11200 }];
    g = generate(d);
    expect(g.courses[15].pieces.some(isChannel)).toBe(false);
  });
  it("cota absoluta preservada e ajuste pendente após mudar início; pode restaurar", () => {
    let d = fixture();
    d = suppressBand(d, d.model.walls[0].id, 11200);
    d.model.floors[0].start = 1000;
    d.model.floors[0].level = 1000;
    const g = generate(d);
    expect(
      g.diagnostics.some((x) => x.code === "adjustment-target-missing"),
    ).toBe(true);
    expect(d.adjustments.channels[0].top).toBe(11200);
    expect(parseFile(JSON.stringify(current(d))).adjustments.channels).toEqual(
      d.adjustments.channels,
    );
    d = restoreBand(d, d.model.walls[0].id, 11200);
    expect(
      generate(d).diagnostics.some(
        (x) => x.code === "adjustment-target-missing",
      ),
    ).toBe(false);
  });
  it("nível incompatível preserva alvenaria e fica não aplicado; alternativa depende de piso/início", () => {
    const d = fixture();
    d.project.channelLevels = [{ id: crypto.randomUUID(), top: 11200 }];
    d.model.floors[0].level = 1000;
    d.model.floors[0].start = 1200;
    expect(() => validateChannelLevels(d)).toThrow("fiada");
    let g = generate(d);
    expect(g.channels).toEqual([]);
    expect(g.diagnostics[0].code).toBe("channel-level-off-grid");
    expect(g.courses[0].pieces).toHaveLength(16);
    d.project.channelLevels[0].top = 10700;
    g = generate(d);
    expect(g.diagnostics).toEqual([]);
    expect(g.channels![0].course).toBe(15);
  });
  it("nível fora da altura de uma parede não acrescenta material", () => {
    const d = fixture();
    d.model.walls[0].height = 2100;
    d.project.channelLevels = [{ id: crypto.randomUUID(), top: 11200 }];
    const g = generate(d);
    expect(g.channels).toEqual([]);
    expect(g.diagnostics).toEqual([]);
    expect(g.courses).toHaveLength(3);
  });
  it.each([1250, 1500, 1400])("bases, direções e lados com módulo %i", (m) => {
    for (const vertical of [false, true])
      for (const side of [1, -1] as const) {
        let d = fixture(m, 700, vertical, side);
        d = putOpening(d, window(d));
        const g = generate(d);
        expect(counts(g.courses[13].pieces)).toEqual([5, 0]);
        expect(counts(g.courses[30].pieces)).toEqual([4, 2]);
        expect(covered(g.courses[30].pieces, m).size).toBe(32);
      }
  });
  it("passo de 6 cm não fixa fiadas em 16/32", () => {
    let d = fixture(1400, 600);
    d = putOpening(d, window(d, 11200, 11200, 8400, 9600));
    const g = generate(d);
    expect(g.channels!.map((b) => b.course)).toEqual([14, 31]);
  });
  it("célula compartilhada suprimida prevalece também sobre a origem vizinha", () => {
    let d = fixture();
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
    d.project.channelLevels = [{ id: crypto.randomUUID(), top: 11200 }];
    const before = generate(d);
    expect(before.channels!.filter((b) => b.course === 16)).toHaveLength(2);
    d = suppressBand(d, d.model.walls[0].id, 11200);
    const g = generate(d),
      corner = g.courses[15].pieces.find((p) => p.x === 0 && p.y === 0)!;
    expect(corner.kind).toBe("half");
    expect(
      g
        .channels!.find((b) => b.wallId === d.model.walls[1].id)!
        .cells.every((c) => c.y > 0),
    ).toBe(true);
    expect(covered(g.courses[15].pieces, 1250).size).toBe(15);
  });
  it("união determinística por ordem de paredes/níveis; não perde células", () => {
    const d = fixture();
    d.project.channelLevels = [
      { id: crypto.randomUUID(), top: 11200 },
      { id: crypto.randomUUID(), top: 22400 },
    ];
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
    const a = generate(d),
      b = generate({
        ...d,
        project: {
          ...d.project,
          channelLevels: [...d.project.channelLevels].reverse(),
        },
        model: { ...d.model, walls: [...d.model.walls].reverse() },
      });
    expect(b).toEqual(a);
  });
  it("arquivo preserva configuração/origens/supressões e recusa adulteração e órfão", () => {
    let d = fixture();
    d = putOpening(d, window(d));
    d = suppressBand(d, d.model.walls[0].id, 9800);
    d = current(d);
    expect(parseFile(JSON.stringify(d))).toEqual(d);
    expect(importedCopy(d).adjustments).toEqual(d.adjustments);
    const bad = structuredClone(d);
    bad.generated!.channels![0].cells[0].origins = ["opening-top:adulterado"];
    expect(() => parseFile(JSON.stringify(bad))).toThrow("inconsistente");
    const orphan = {
      ...d,
      adjustments: {
        ...d.adjustments,
        channels: [
          { id: crypto.randomUUID(), wallId: crypto.randomUUID(), top: 9800 },
        ],
      },
    };
    expect(() => parseFile(JSON.stringify(orphan))).toThrow("referência");
  });
  it("migra snapshot M3.1 pela convenção original, sem níveis globais adicionados", () => {
    let d = fixture();
    d = putOpening(d, window(d));
    const { channelLevels: _levels, ...project } = d.project;
    void _levels;
    const g = generate(d, "nominal-v4"),
      old = {
        ...d,
        schemaVersion: 3,
        project,
        generated: g,
        generationState: { status: "current", diagnostics: g.diagnostics },
      };
    const migrated = parseFile(JSON.stringify(old));
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.project.channelLevels).toEqual([]);
    expect(migrated.model).toEqual(d.model);
    expect(migrated.generationState.status).toBe("outdated");
    expect(generate(migrated).channels!.map((b) => b.course)).toEqual([14, 31]);
    const bad = structuredClone(old);
    bad.generated.courses[0].pieces[0].x++;
    expect(() => parseFile(JSON.stringify(bad))).toThrow("inconsistente");
  });
  it("limites e duplicatas são recusados sem truncamento", () => {
    const d = fixture();
    d.project.channelLevels = Array.from({ length: 101 }, (_, i) => ({
      id: crypto.randomUUID(),
      top: (i + 1) * 700,
    }));
    expect(
      generate(d).diagnostics.some((d) => d.code === "channel-limit"),
    ).toBe(true);
    expect(() => parseFile(JSON.stringify(d))).toThrow();
    d.project.channelLevels = [
      { id: crypto.randomUUID(), top: 11200 },
      { id: crypto.randomUUID(), top: 11200 },
    ];
    expect(() => parseFile(JSON.stringify(d))).toThrow("duplicados");
  });
});
