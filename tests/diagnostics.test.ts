import { describe, expect, it } from "vitest";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
  type Project,
} from "../src/domain/project";
import { generate } from "../src/domain/composition";
import { parseFile } from "../src/persistence/document";
import { displayDiagnostics } from "../src/editor/diagnostics";

function fixture() {
  const d = createProject("Sobreposição", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  d.project.channelLevels = [];
  d.project.groutSettings = defaultGroutSettings(false);
  const wall = (a: [number, number], b: [number, number]) =>
    makeWall(
      { x: a[0], y: a[1] },
      { x: b[0], y: b[1] },
      1250,
      d.model.floors[0].id,
      2100,
      1,
    )!;
  d.model.walls = [
    wall([-42500, 13750], [-28750, 13750]),
    wall([-30000, 13750], [77500, 13750]),
    wall([-30000, -20000], [-30000, 15000]),
    wall([0, 30000], [10000, 30000]),
  ];
  return d;
}
function current(d: Project) {
  d.generated = generate(d);
  d.generationState = {
    status: "current",
    diagnostics: d.generated.diagnostics,
  };
  return d;
}

describe("T-020 diagnóstico localizado de sobreposição", () => {
  it("identifica somente o par e a região real, preservando a suspensão e os resultados salvos", () => {
    const d = current(fixture()),
      before = JSON.stringify(d);
    const [diagnostic] = displayDiagnostics(d);
    expect(diagnostic.wallIds).toEqual(
      d.model.walls
        .slice(0, 2)
        .map((w) => w.id)
        .sort(),
    );
    expect(diagnostic.region).toEqual({
      x: -30000,
      y: 13750,
      width: 1250,
      height: 1250,
    });
    expect(diagnostic.focus).toEqual({ x: -29375, y: 14375 });
    expect(diagnostic.message).toContain("paredes 1 e 2");
    expect(diagnostic.message).toContain("3 paredes conectadas");
    expect(diagnostic.message).toContain("12,5 × 12,5 cm");
    expect(
      d.generated!.floors[0].courses.every((c) =>
        c.pieces.every((p) => p.wallIds.includes(d.model.walls[3].id)),
      ),
    ).toBe(true);
    expect(d.generated!.floors[0].courses[0].pieces).toHaveLength(4);
    expect(JSON.stringify(d)).toBe(before);
    expect(parseFile(before)).toEqual(d);
  });

  it("localiza a mesma região com ordem e sentido das paredes invertidos", () => {
    const d = fixture(),
      expected = displayDiagnostics(current(d))[0];
    d.model.walls.reverse();
    d.model.walls.forEach((w) => {
      const a = w.a;
      w.a = w.b;
      w.b = a;
    });
    const actual = displayDiagnostics(current(d))[0];
    expect(actual.region).toEqual(expected.region);
    expect(actual.focus).toEqual(expected.focus);
    expect(actual.wallIds).toEqual(expected.wallIds);
  });

  it("separa múltiplos pares sobrepostos sem apontar paredes apenas conectadas", () => {
    const d = fixture();
    d.model.walls.push({ ...d.model.walls[0], id: crypto.randomUUID() });
    const rows = displayDiagnostics(current(d));
    expect(rows).toHaveLength(3);
    expect(
      rows.every(
        (r) =>
          r.wallIds.length === 2 && !r.wallIds.includes(d.model.walls[2].id),
      ),
    ).toBe(true);
    expect(new Set(rows.map((r) => r.wallIds.join())).size).toBe(3);
  });

  it("considera a faixa física de paredes verticais com lado negativo", () => {
    const d = fixture();
    d.model.walls = d.model.walls.slice(0, 2).map((w, i) => ({
      ...w,
      a: { x: 1250, y: i * 2500 },
      b: { x: 1250, y: 10000 + i * 2500 },
      side: -1,
    }));
    expect(displayDiagnostics(current(d))[0].region).toEqual({
      x: 0,
      y: 2500,
      width: 1250,
      height: 7500,
    });
  });

  it("não acusa contato colinear sem área nem encontro ortogonal normal", () => {
    const d = fixture();
    d.model.walls[0].b.x = -30000;
    expect(
      displayDiagnostics(current(d)).some((r) => r.code === "overlap"),
    ).toBe(false);
    expect(
      d.generated!.floors[0].courses[0].pieces.some((p) =>
        p.wallIds.includes(d.model.walls[0].id),
      ),
    ).toBe(true);
  });

  it("mantém outros diagnósticos e isola paredes de pavimentos distintos", () => {
    const d = current(fixture());
    const other = {
      ...d.model.floors[0],
      id: crypto.randomUUID(),
      name: "Superior",
      level: 28000,
    };
    d.model.floors.push(other);
    d.model.walls.push({
      ...d.model.walls[0],
      id: crypto.randomUUID(),
      floorId: other.id,
    });
    const original = d.generationState.diagnostics[0];
    d.generationState.diagnostics.push({
      ...original,
      code: "height",
      floorId: other.id,
    });
    const rows = displayDiagnostics(d);
    expect(rows).toHaveLength(2);
    expect(rows[0].wallIds).not.toContain(d.model.walls[4].id);
    expect(rows[1]).toMatchObject({
      code: "height",
      focus: { x: original.x, y: original.y },
    });
  });
});
