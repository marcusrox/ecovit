import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
  bounds,
  createProject,
  makeWall,
  type Project,
} from "../src/domain/project";
import { generate } from "../src/domain/composition";
import { openingBox } from "../src/domain/openings";
import { parseFile, serializeFile } from "../src/persistence/files";

const legacyText = readFileSync(
  new URL("./fixtures/unequal-heights-v9.ecovit", import.meta.url),
  "utf8",
);
it("CT-14: cruz torna-se T, L e reta sem perder células ou reiniciar fase", () => {
  const d = createProject("Transições", {
      length: 2500,
      width: 1250,
      height: 700,
    }),
    f = d.model.floors[0].id,
    m = 1250;
  d.model.walls = [
    makeWall({ x: -3 * m, y: 0 }, { x: 0, y: 0 }, m, f, 700, 1)!,
    makeWall({ x: 0, y: 0 }, { x: 4 * m, y: 0 }, m, f, 2800, 1)!,
    makeWall({ x: 0, y: -3 * m }, { x: 0, y: 0 }, m, f, 1400, 1)!,
    makeWall({ x: 0, y: m }, { x: 0, y: 4 * m }, m, f, 2100, 1)!,
  ];
  const floor = exactCoverage(d).floors[0];
  expect(floor.components[0].junctions.map((j) => j.kind)).toEqual([
    "cross",
    "T",
    "L",
  ]);
  expect(
    floor.courses.map((r) =>
      r.pieces.reduce((sum, p) => sum + (p.width * p.height) / m ** 2, 0),
    ),
  ).toEqual([13, 10, 7, 4]);
  expect(
    floor.courses[3].pieces.filter((p) => p.kind === "half").map((p) => p.x),
  ).toEqual([0, 3 * m]);
});
function exactCoverage(doc: Project) {
  const result = generate(doc),
    m = doc.project.base.width,
    h = doc.project.base.height;
  expect(result.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  for (const floor of result.floors)
    for (const row of floor.courses) {
      const expected = new Set<string>();
      for (const w of doc.model.walls.filter(
        (w) => w.floorId === floor.floorId && w.height >= row.number * h,
      )) {
        const b = bounds(w, m);
        for (let x = b.x; x < b.x + b.width; x += m)
          for (let y = b.y; y < b.y + b.height; y += m)
            expected.add(`${x}:${y}`);
      }
      for (const o of doc.model.openings) {
        const w = doc.model.walls.find((w) => w.id === o.wallId)!;
        if (
          w.floorId !== floor.floorId ||
          row.bottom >= o.base + o.height ||
          row.top <= o.base
        )
          continue;
        const b = openingBox(o, w, m);
        for (let x = b.x; x < b.x + b.width; x += m)
          for (let y = b.y; y < b.y + b.height; y += m)
            expected.delete(`${x}:${y}`);
      }
      const actual = new Set<string>();
      for (const p of row.pieces) {
        expect([m * m, 2 * m * m]).toContain(p.width * p.height);
        for (const id of p.wallIds)
          expect(
            doc.model.walls.find((w) => w.id === id)!.height,
          ).toBeGreaterThanOrEqual(row.number * h);
        for (let x = p.x; x < p.x + p.width; x += m)
          for (let y = p.y; y < p.y + p.height; y += m) {
            expect(actual.has(`${x}:${y}`)).toBe(false);
            actual.add(`${x}:${y}`);
          }
      }
      expect(actual).toEqual(expected);
    }
  return result;
}

it.each([700, 1400])(
  "CT-14: vão na célula de cruzamento respeita o término da vizinha, base=%i",
  (base) => {
    const d = createProject("Vão acima da vizinha", {
        length: 2500,
        width: 1250,
        height: 700,
      }),
      f = d.model.floors[0].id,
      m = 1250;
    d.model.walls = [
      makeWall({ x: 0, y: 0 }, { x: 5 * m, y: 0 }, m, f, 2800, 1)!,
      makeWall({ x: 2 * m, y: -2 * m }, { x: 2 * m, y: 3 * m }, m, f, 1400, 1)!,
    ];
    d.model.openings = [
      {
        id: crypto.randomUUID(),
        wallId: d.model.walls[0].id,
        kind: "window",
        offset: 2 * m,
        width: m,
        base,
        height: 700,
      },
    ];
    if (base === 1400) {
      const floor = exactCoverage(d).floors[0];
      expect(
        floor.courses[2].pieces.every(
          (p) => p.x + p.width <= 2 * m || p.x >= 3 * m,
        ),
      ).toBe(true);
      expect(
        floor.channels!.some(
          (band) => band.wallId === d.model.walls[0].id && band.top === 2800,
        ),
      ).toBe(true);
      const axis = floor.grouts!.find((g) => g.x === 2 * m && g.y === 0)!;
      expect(axis.intervals).toEqual([
        { bottom: 0, top: 1400 },
        { bottom: 2100, top: 2800 },
      ]);
    } else {
      const floor = generate(d).floors[0];
      expect(
        floor.diagnostics.some((diag) => diag.code === "opening-at-junction"),
      ).toBe(true);
      expect(floor.courses.every((row) => row.pieces.length === 0)).toBe(true);
    }
  },
);

it("EX-78/79: projeto real preserva desenho e compõe 40+2 fiadas", () => {
  const original = JSON.parse(legacyText),
    doc = parseFile(legacyText);
  expect(doc.model).toEqual({
    ...original.model,
    measurements: [],
    referenceImages: [],
  });
  expect(doc.adjustments).toEqual(original.adjustments);
  expect(doc.generated).toBeNull();
  expect(doc.generationState).toEqual({ status: "outdated", diagnostics: [] });
  const result = exactCoverage(doc);
  expect(result.convention).toBe("nominal-v10");
  expect(result.floors[0].courses).toHaveLength(42);
  const tall = doc.model.walls
    .filter((w) => w.height === 29400)
    .map((w) => w.id)
    .sort();
  for (const row of result.floors[0].courses.slice(40))
    expect([...new Set(row.pieces.flatMap((p) => p.wallIds))].sort()).toEqual(
      tall,
    );
  doc.generated = result;
  doc.generationState = { status: "current", diagnostics: result.diagnostics };
  expect(parseFile(serializeFile(doc).text)).toEqual(doc);
  const bad = structuredClone(doc);
  bad.generated!.floors[0].courses[0].pieces.pop();
  expect(() => parseFile(JSON.stringify(bad))).toThrow("inconsistente");
  const invalid = JSON.parse(legacyText);
  invalid.model.slabs[0].thickness = 0;
  expect(() => parseFile(JSON.stringify(invalid))).toThrow();
});

it.each([false, true])(
  "EX-75/76: T com ramo/barra curta e fases absolutas (%s)",
  (shortBar) => {
    const d = createProject("T", { length: 2500, width: 1250, height: 700 }),
      f = d.model.floors[0].id;
    d.model.walls = [
      makeWall(
        { x: 0, y: 0 },
        { x: 6250, y: 0 },
        1250,
        f,
        shortBar ? 1400 : 2100,
        1,
      )!,
      makeWall(
        { x: 2500, y: 1250 },
        { x: 2500, y: 3750 },
        1250,
        f,
        shortBar ? 2100 : 1400,
        1,
      )!,
    ];
    const g = exactCoverage(d);
    const pieces = g.floors[0].courses[2].pieces;
    expect(pieces.filter((p) => p.kind === "whole")).toHaveLength(
      shortBar ? 1 : 2,
    );
    expect(pieces.filter((p) => p.kind === "half")).toHaveLength(
      shortBar ? 0 : 1,
    );
  },
);

it.each([
  [1250, 700],
  [1500, 600],
  [1251, 700],
])("EX-77: vários encontros mantêm cobertura e fases, m=%i/h=%i", (m, h) => {
  const d = createProject(
      "Anel",
      { length: 2 * m, width: m, height: h },
      4 * h,
    ),
    f = d.model.floors[0].id;
  d.project.channelLevels = [];
  const add = (a: number[], b: number[], height: number) =>
    d.model.walls.push(
      makeWall(
        { x: a[0] * m, y: a[1] * m },
        { x: b[0] * m, y: b[1] * m },
        m,
        f,
        height,
        1,
      )!,
    );
  add([0, 0], [8, 0], 2 * h);
  add([0, 1], [0, 5], 2 * h);
  add([7, 1], [7, 5], 2 * h);
  add([0, 5], [8, 5], 2 * h);
  add([3, 1], [3, 6], 4 * h);
  const g = exactCoverage(d),
    floor = g.floors[0],
    comp = floor.components[0];
  expect(
    floor.courses[0].pieces.reduce(
      (n, p) => n + (p.width * p.height) / (m * m),
      0,
    ),
  ).toBe(28);
  expect(floor.courses[2].pieces.find((p) => p.kind === "half")!.y).toBe(5 * m);
  expect(floor.courses[3].pieces.find((p) => p.kind === "half")!.y).toBe(m);
  d.adjustments.junctions = [
    {
      id: crypto.randomUUID(),
      floorId: f,
      componentId: comp.id,
      signature: comp.signature,
      wallIds: comp.wallIds,
      phase: 1,
      binding: "active",
      anchor: { x: comp.x, y: comp.y },
    },
  ];
  const alternative = exactCoverage(d).floors[0];
  expect(alternative.courses[2].pieces.find((p) => p.kind === "half")!.y).toBe(
    m,
  );
  expect(alternative.courses[3].pieces.find((p) => p.kind === "half")!.y).toBe(
    5 * m,
  );
  d.model.walls.reverse();
  expect(generate(d).floors[0]).toEqual(alternative);
});

it("CT-14: separação de conjunto não reinicia fase; graute de ponta livre respeita alvenaria", () => {
  const d = createProject("Separação", {
      length: 2500,
      width: 1250,
      height: 700,
    }),
    f = d.model.floors[0].id,
    m = 1250;
  d.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 5 * m, y: 0 }, m, f, 700, 1)!,
    makeWall({ x: 0, y: m }, { x: 0, y: 4 * m }, m, f, 2800, 1)!,
    makeWall({ x: 4 * m, y: m }, { x: 4 * m, y: 4 * m }, m, f, 2800, 1)!,
  ];
  d.project.groutSettings = {
    junctions: false,
    openings: false,
    ends: true,
    intervals: false,
    distance: 10000,
  };
  const floor = exactCoverage(d).floors[0];
  expect(
    floor.courses[1].pieces.filter((p) => p.kind === "half").map((p) => p.y),
  ).toEqual([m, m]);
  const axis = floor.grouts!.find((g) => g.x === 0 && g.y === m)!;
  expect(axis.origins).toContain(`end:${d.model.walls[1].id}`);
  expect(axis.intervals).toEqual([{ bottom: 0, top: 2800 }]);
  for (const g of floor.grouts!)
    for (const span of g.intervals) expect(span.top).toBeLessThanOrEqual(2800);
});

it("CT-14: T torna-se L e oferece alternativa global sem reiniciar a fase", () => {
  const d = createProject("T para L", {
      length: 2500,
      width: 1250,
      height: 700,
    }),
    f = d.model.floors[0].id,
    m = 1250;
  d.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 2 * m, y: 0 }, m, f, 700, 1)!,
    makeWall({ x: 2 * m, y: 0 }, { x: 5 * m, y: 0 }, m, f, 2100, 1)!,
    makeWall({ x: 2 * m, y: m }, { x: 2 * m, y: 3 * m }, m, f, 2100, 1)!,
  ];
  const floor = exactCoverage(d).floors[0],
    comp = floor.components[0];
  expect(comp.junctions.map((j) => j.kind)).toEqual(["T", "L"]);
  expect(comp.alternative).toBe(true);
  expect(floor.courses[1].pieces.find((p) => p.kind === "half")).toMatchObject({
    x: 2 * m,
    y: 2 * m,
  });
  d.adjustments.junctions = [
    {
      id: crypto.randomUUID(),
      floorId: f,
      componentId: comp.id,
      signature: comp.signature,
      wallIds: comp.wallIds,
      phase: 1,
      binding: "active",
      anchor: { x: comp.x, y: comp.y },
    },
  ];
  expect(
    exactCoverage(d).floors[0].courses[1].pieces.find((p) => p.kind === "half"),
  ).toMatchObject({ x: 4 * m, y: 0 });
});
