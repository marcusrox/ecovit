import { describe, expect, it, vi } from "vitest";
import {
  createProject,
  makeWall,
  type Project,
  type Wall,
  type Point,
  LIMIT,
} from "../src/domain/project";
import { createContinuation, moveWall } from "../src/domain/wall-editing";
import { generate } from "../src/domain/composition";
import { putOpening } from "../src/domain/openings";
import { suppressBand, restoreSuppression } from "../src/domain/channels";
import { toggleGrout } from "../src/domain/grout";
import { parseFile } from "../src/persistence/files";

function fixture(m = 1250) {
  const d = createProject("M3.4", { length: m * 2, width: m, height: 700 });
  d.project.channelLevels = [];
  d.project.groutSettings = {
    junctions: false,
    openings: false,
    ends: false,
    intervals: false,
    distance: 10000,
  };
  return d;
}
function wall(d: Project, a: Point, b: Point, side: 1 | -1 = 1): Wall {
  return makeWall(
    a,
    b,
    d.project.base.width,
    d.model.floors[0].id,
    28000,
    side,
  )!;
}
function snapshot(d: Project) {
  const generated = generate(d);
  return {
    ...d,
    generated,
    generationState: {
      status: "current" as const,
      diagnostics: generated.diagnostics,
    },
  };
}
describe("M3.4 continuidade e movimento", () => {
  for (const vertical of [false, true])
    for (const reverse of [false, true])
      for (const side of [1, -1] as const)
        it(`EX-36/37 ponte e extensão: vertical=${vertical}, reverso=${reverse}, lado=${side}`, () => {
          const d = fixture();
          const p = (s: number) => (vertical ? { x: 0, y: s } : { x: s, y: 0 });
          const w = (a: number, b: number) =>
            wall(d, p(reverse ? b : a), p(reverse ? a : b), side);
          const a = w(0, 10000),
            b = w(20000, 30000);
          d.model.walls = [b, a];
          const merged = createContinuation(d, w(10000, 20000));
          expect(merged.doc.model.walls).toHaveLength(1);
          expect(merged.selectedId).toBe(a.id);
          const final = merged.doc.model.walls[0];
          expect([final.a, final.b]).toEqual(
            reverse ? [p(30000), p(0)] : [p(0), p(30000)],
          );
          expect(d.model.walls).toEqual([b, a]);
          const extended = createContinuation(merged.doc, w(30000, 40000));
          expect(extended.selectedId).toBe(a.id);
          expect(extended.doc.model.walls).toHaveLength(1);
          expect(generate(extended.doc).courses[0].pieces).toHaveLength(16);
        });
  it("EX-37/47 preserva vãos mundiais, ramal e conflitos após consolidar", () => {
    let d = fixture();
    const a = wall(d, { x: 0, y: 0 }, { x: 10000, y: 0 }),
      b = wall(d, { x: 10000, y: 0 }, { x: 20000, y: 0 });
    const ramal = wall(d, { x: 10000, y: 0 }, { x: 10000, y: 10000 });
    d.model.walls = [a, b, ramal];
    for (const [w, offset] of [
      [a, 7500],
      [b, 0],
    ] as const)
      d = putOpening(d, {
        id: crypto.randomUUID(),
        wallId: w.id,
        kind: "door",
        offset,
        width: 2500,
        base: 0,
        height: 10500,
      });
    const merged = createContinuation(
      d,
      wall(d, { x: 20000, y: 0 }, { x: 30000, y: 0 }),
    ).doc;
    expect(merged.model.walls).toHaveLength(2);
    expect(merged.model.walls).toContainEqual(ramal);
    expect(merged.model.openings.map((o) => o.offset)).toEqual([7500, 10000]);
    expect(merged.model.openings.map((o) => o.id)).toEqual(
      d.model.openings.map((o) => o.id),
    );
    expect(
      generate(merged).diagnostics.some((d) => d.code === "opening-separation"),
    ).toBe(true);
  });
  it("EX-38/44 herda alcance, permite remoção inteira e restaura por ID", () => {
    let d = fixture();
    d.project.channelLevels = [{ id: crypto.randomUUID(), top: 11200 }];
    const a = wall(d, { x: 0, y: 0 }, { x: 10000, y: 0 }),
      b = wall(d, { x: 25000, y: 0 }, { x: 30000, y: 0 });
    d.model.walls = [a, b];
    d = suppressBand(d, a.id, 11200);
    const inheritedId = d.adjustments.channels[0].id;
    d = createContinuation(
      d,
      wall(d, { x: 10000, y: 0 }, { x: 20000, y: 0 }),
    ).doc;
    expect(d.adjustments.channels[0].scope).toEqual({ kind: "wall" });
    d = {
      ...d,
      model: {
        ...d.model,
        walls: d.model.walls.map((w) =>
          w.id === b.id ? { ...w, a: { x: 20000, y: 0 } } : w,
        ),
      },
    };
    d = createContinuation(
      d,
      wall(d, { x: 30000, y: 0 }, { x: 40000, y: 0 }),
    ).doc;
    expect(d.adjustments.channels[0]).toMatchObject({
      id: inheritedId,
      scope: { kind: "range", from: 0, to: 20000 },
    });
    const before = generate(d);
    expect(before.channels![0].cells.map((c) => c.x)).toEqual(
      Array.from({ length: 16 }, (_, i) => 20000 + i * 1250),
    );
    const all = suppressBand(d, a.id, 11200);
    expect(all.adjustments.channels).toHaveLength(2);
    expect(generate(all).channels).toEqual([]);
    const restored = restoreSuppression(all, all.adjustments.channels[1].id);
    expect(generate(restored).channels).toEqual(before.channels);
    expect(parseFile(JSON.stringify(snapshot(restored))).adjustments).toEqual(
      restored.adjustments,
    );
  });
  it("EX-39 move parede com janela e eixo exclusivo, sem mover vizinha", () => {
    let d = fixture();
    const a = wall(d, { x: 0, y: 0 }, { x: 40000, y: 0 }),
      b = wall(d, { x: 0, y: -5000 }, { x: 10000, y: -5000 });
    d.model.walls = [a, b];
    d = putOpening(d, {
      id: crypto.randomUUID(),
      wallId: a.id,
      kind: "window",
      offset: 10000,
      width: 10000,
      base: 9800,
      height: 11200,
    });
    d = toggleGrout(d, { x: 10000, y: 0, wallIds: [a.id] }, false);
    const moved = moveWall(d, a.id, { x: 2500, y: 5000 }).doc;
    expect(moved.model.walls).toContainEqual(b);
    expect(moved.model.openings).toEqual(d.model.openings);
    expect(moved.adjustments.grout[0]).toMatchObject({
      id: d.adjustments.grout[0].id,
      x: 12500,
      y: 5000,
    });
    expect(generate(moved).grouts![0].intervals).toEqual([
      { bottom: 0, top: 9800 },
      { bottom: 21000, top: 28000 },
    ]);
  });
  it.each(["include", "exclude"] as const)(
    "EX-40 desdobra ajuste compartilhado %s sem transferir vizinha",
    (action) => {
      const d = fixture(),
        a = wall(d, { x: 0, y: 0 }, { x: 10000, y: 0 }),
        b = wall(d, { x: 0, y: 0 }, { x: 0, y: 10000 });
      d.model.walls = [a, b];
      const id = crypto.randomUUID();
      d.adjustments.grout = [{ id, x: 0, y: 0, wallIds: [a.id, b.id], action }];
      const moved = moveWall(d, a.id, { x: 2500, y: 5000 }).doc;
      expect(moved.adjustments.grout[0]).toEqual({
        id,
        x: 0,
        y: 0,
        wallIds: [b.id],
        action,
      });
      expect(moved.adjustments.grout[1]).toMatchObject({
        x: 2500,
        y: 5000,
        wallIds: [a.id],
        action,
      });
      expect(moved.adjustments.grout[1].id).not.toBe(id);
      expect(d.adjustments.grout).toHaveLength(1);
    },
  );
  it("EX-43 movimento até ponte une cadeia com janela/supressão no destino", () => {
    let d = fixture();
    const a = wall(d, { x: 0, y: 0 }, { x: 10000, y: 0 }),
      b = wall(d, { x: 20000, y: 0 }, { x: 30000, y: 0 }),
      c = wall(d, { x: 0, y: 5000 }, { x: 10000, y: 5000 });
    d.model.walls = [c, b, a];
    d = putOpening(d, {
      id: crypto.randomUUID(),
      wallId: c.id,
      kind: "window",
      offset: 2500,
      width: 2500,
      base: 9800,
      height: 11200,
    });
    d = suppressBand(d, c.id, 11200);
    const final = moveWall(d, c.id, { x: 10000, y: -5000 });
    expect(final.selectedId).toBe(a.id);
    expect(final.doc.model.walls).toHaveLength(1);
    expect(final.doc.model.openings[0]).toMatchObject({
      id: d.model.openings[0].id,
      wallId: a.id,
      offset: 12500,
    });
    expect(final.doc.adjustments.channels[0].scope).toEqual({
      kind: "range",
      from: 10000,
      to: 20000,
    });
    expect(parseFile(JSON.stringify(snapshot(final.doc))).model).toEqual(
      final.doc.model,
    );
  });
  it("EX-41 não une alturas/lados diferentes nem sobreposições", () => {
    const d = fixture(),
      a = wall(d, { x: 0, y: 0 }, { x: 10000, y: 0 }),
      b = wall(d, { x: 20000, y: 0 }, { x: 30000, y: 0 });
    b.height = 27300;
    d.model.walls = [a, b];
    const bridge = createContinuation(
      d,
      wall(d, { x: 10000, y: 0 }, { x: 20000, y: 0 }),
    );
    expect(bridge.doc.model.walls).toHaveLength(3);
    expect(bridge.message).toContain("Alturas");
    d.model.walls = [a];
    expect(
      createContinuation(d, wall(d, { x: 10000, y: 0 }, { x: 20000, y: 0 }, -1))
        .doc.model.walls,
    ).toHaveLength(2);
    expect(
      createContinuation(d, wall(d, { x: 5000, y: 0 }, { x: 15000, y: 0 })).doc
        .model.walls,
    ).toHaveLength(2);
  });
  it("EX-45 exclusão coincidente não depende da ordem e clique conserva IDs", () => {
    let d = fixture();
    const a = wall(d, { x: 0, y: 0 }, { x: 40000, y: 0 });
    d.model.walls = [a];
    d.adjustments.grout = [
      {
        id: crypto.randomUUID(),
        x: 10000,
        y: 0,
        wallIds: [a.id],
        action: "exclude",
      },
      {
        id: crypto.randomUUID(),
        x: 10000,
        y: 0,
        wallIds: [a.id],
        action: "include",
      },
    ];
    expect(generate(d).grouts).toEqual([]);
    const ids = d.adjustments.grout.map((a) => a.id);
    d.adjustments.grout.reverse();
    expect(generate(d).grouts).toEqual([]);
    d = toggleGrout(d, { x: 10000, y: 0, wallIds: [a.id] }, false);
    expect(generate(d).grouts).toHaveLength(1);
    expect(d.adjustments.grout.map((a) => a.id).sort()).toEqual(ids.sort());
    expect(parseFile(JSON.stringify(snapshot(d))).adjustments.grout).toEqual(
      d.adjustments.grout,
    );
  });
  it("EX-46 escolha fica pendente com âncora e ID após desconexão", () => {
    const d = fixture(),
      a = wall(d, { x: 0, y: 0 }, { x: 10000, y: 0 }),
      b = wall(d, { x: 0, y: 0 }, { x: 0, y: 10000 });
    d.model.walls = [a, b];
    const c = generate(d).components[0],
      id = crypto.randomUUID();
    d.adjustments.junctions = [
      {
        id,
        anchor: { x: c.x, y: c.y },
        binding: "active",
        componentId: c.id,
        signature: c.signature,
        wallIds: c.wallIds,
        phase: 1,
      },
    ];
    const moved = moveWall(d, a.id, { x: 2500, y: 5000 }).doc;
    expect(moved.adjustments.junctions[0]).toMatchObject({
      id,
      binding: "pending",
      anchor: { x: 0, y: 0 },
    });
    expect(
      generate(moved).diagnostics.some((d) => d.adjustmentIds?.includes(id)),
    ).toBe(true);
    expect(
      parseFile(JSON.stringify(snapshot(moved))).adjustments.junctions,
    ).toEqual(moved.adjustments.junctions);
  });
  it.each([1250, 1500, 1400, 1251])(
    "delta relativo, zero sem operação e limites: módulo %i",
    (m) => {
      const d = fixture(m),
        a = wall(d, { x: 0, y: 0 }, { x: 8 * m, y: 0 });
      d.model.walls = [a];
      expect(moveWall(d, a.id, { x: 0, y: 0 }).doc).toBe(d);
      expect(
        moveWall(d, a.id, { x: m + 1, y: 3 * m - 1 }).doc.model.walls[0].a,
      ).toEqual({ x: m, y: 3 * m });
      expect(() => moveWall(d, a.id, { x: LIMIT, y: LIMIT })).toThrow("limite");
    },
  );
  it("prévia não materializa UUID nem altera documento", () => {
    const d = fixture(),
      a = wall(d, { x: 0, y: 0 }, { x: 10000, y: 0 }),
      b = wall(d, { x: 0, y: 0 }, { x: 0, y: 10000 });
    d.model.walls = [a, b];
    d.adjustments.grout = [
      {
        id: crypto.randomUUID(),
        x: 0,
        y: 0,
        wallIds: [a.id, b.id],
        action: "include",
      },
    ];
    const before = JSON.stringify(d),
      spy = vi.spyOn(crypto, "randomUUID");
    moveWall(d, a.id, { x: 2500, y: 5000 }, false);
    createContinuation(
      d,
      {
        ...a,
        id: "preview-wall",
        a: { x: 10000, y: 0 },
        b: { x: 20000, y: 0 },
      },
      false,
    );
    expect(spy).not.toHaveBeenCalled();
    expect(JSON.stringify(d)).toBe(before);
    spy.mockRestore();
  });
  it("v5 confere snapshot antes de migrar sem ativar flags nem normalizar paredes", () => {
    const d = fixture(),
      a = wall(d, { x: 0, y: 0 }, { x: 10000, y: 0 }),
      b = wall(d, { x: 10000, y: 0 }, { x: 20000, y: 0 });
    d.model.walls = [a, b];
    const g = generate(d, "nominal-v6"),
      old = {
        ...d,
        schemaVersion: 5,
        generated: g,
        generationState: { status: "current", diagnostics: g.diagnostics },
      };
    const migrated = parseFile(JSON.stringify(old));
    expect(migrated.schemaVersion).toBe(6);
    expect(migrated.model.walls).toEqual([a, b]);
    expect(migrated.generationState.status).toBe("outdated");
    expect(migrated.project.groutSettings).toEqual(d.project.groutSettings);
    const bad = structuredClone(old);
    bad.generated.courses[0].pieces[0].width++;
    expect(() => parseFile(JSON.stringify(bad))).toThrow("inconsistente");
  });
  it("arquivo v6 recusa alcance não modular, ID duplicado e referência órfã", () => {
    let d = fixture();
    d.model.walls = [wall(d, { x: 0, y: 0 }, { x: 40000, y: 0 })];
    d = suppressBand(d, d.model.walls[0].id, 11200);
    const bad = snapshot(d);
    bad.adjustments.channels[0].scope = { kind: "range", from: 1, to: 10000 };
    expect(() => parseFile(JSON.stringify(bad))).toThrow("malha");
    bad.adjustments.channels[0].scope = { kind: "wall" };
    bad.adjustments.channels.push({ ...bad.adjustments.channels[0] });
    expect(() => parseFile(JSON.stringify(bad))).toThrow("duplicada");
    bad.adjustments.channels.pop();
    bad.adjustments.channels[0].wallId = crypto.randomUUID();
    expect(() => parseFile(JSON.stringify(bad))).toThrow("referência");
  });
});
