import { describe, expect, it } from "vitest";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
  type Project,
} from "../src/domain/project";
import { generate, floorView, generateFloor } from "../src/domain/composition";
import { toggleGrout, restoreAutomaticGrouts } from "../src/domain/grout";
import { putOpening } from "../src/domain/openings";
import { duplicateFloor, addFloor, editFloor } from "../src/domain/floors";
import { quantities } from "../src/domain/quantities";
import { dehydrate, hydrate } from "../src/persistence/remote-document";
import {
  importedCopy,
  parseFile,
  serializeFile,
  validateProject,
} from "../src/persistence/files";

type Kind = "L" | "T" | "cross";
const offsets: Record<Kind, [number, number][]> = {
  L: [
    [0, 0],
    [1, 0],
    [0, 1],
  ],
  T: [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, 1],
  ],
  cross: [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ],
};
function fixture(
  kind: Kind,
  m = 1250,
  rotation = 0,
  reflect = false,
  reverse = false,
) {
  const doc = createProject("Graute de encontro", {
    length: 2 * m,
    width: m,
    height: 700,
  });
  doc.project.channelLevels = [];
  doc.project.groutSettings = {
    ...defaultGroutSettings(false),
    junctions: true,
  };
  const transform = ([x, y]: [number, number]): [number, number] => {
    if (reflect) x = -x;
    for (let i = 0; i < rotation; i++) [x, y] = [-y, x];
    return [x, y];
  };
  const line = (start: number, end: number, vertical: boolean) => {
    const points = Array.from({ length: end - start + 1 }, (_, i) =>
      transform(vertical ? [0, start + i] : [start + i, 0]),
    );
    const xs = points.map((p) => p[0]),
      ys = points.map((p) => p[1]);
    const horizontal = new Set(ys).size === 1;
    const a = { x: Math.min(...xs) * m, y: Math.min(...ys) * m };
    const b = {
      x: (Math.max(...xs) + (horizontal ? 1 : 0)) * m,
      y: (Math.max(...ys) + (horizontal ? 0 : 1)) * m,
    };
    doc.model.walls.push(
      makeWall(
        reverse ? b : a,
        reverse ? a : b,
        m,
        doc.model.floors[0].id,
        2100,
        1,
      )!,
    );
  };
  line(kind === "L" ? 0 : -3, kind === "L" ? 4 : 3, false);
  line(kind === "cross" ? -3 : 0, kind === "L" ? 4 : 3, true);
  if (reverse) doc.model.walls.reverse();
  return {
    doc,
    expected: offsets[kind]
      .map(transform)
      .map(([x, y]) => [x * m || 0, y * m || 0]),
  };
}
const points = (doc: Project) =>
  generate(doc).floors[0].grouts!.map((a) => [a.x, a.y]);
const sorted = (ps: number[][]) =>
  ps.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
const current = (doc: Project): Project => {
  const generated = generate(doc);
  return {
    ...doc,
    generated,
    generationState: { status: "current", diagnostics: generated.diagnostics },
  };
};

describe("T-023 padrões nominais de graute nos encontros", () => {
  it("T simples inclui o ramal que encosta pela face e Encontros desligado remove ambos", () => {
    const { doc } = fixture("T");
    doc.model.walls.find((w) => w.a.x === w.b.x)!.a.y = 1250;
    expect(points(doc)).toEqual([
      [0, 0],
      [0, 1250],
    ]);
    doc.project.groutSettings.junctions = false;
    expect(points(doc)).toEqual([]);
  });
  it("T simples preserva exclusão do ramal, alturas e descarta snapshot v10 sem mudar intenção", () => {
    let { doc } = fixture("T");
    const stem = doc.model.walls.find((w) => w.a.x === w.b.x)!;
    stem.height = 700;
    const result = generate(doc);
    expect(
      result.floors[0].grouts!.map((a) => [a.x, a.y, a.intervals]),
    ).toEqual([
      [0, 0, [{ bottom: 0, top: 2100 }]],
      [0, 1250, [{ bottom: 0, top: 700 }]],
    ]);
    const old = JSON.parse(serializeFile(current(doc)).text);
    old.generated.convention = "nominal-v10";
    old.generated.floors[0].grouts = old.generated.floors[0].grouts.filter(
      (a: { y: number }) => a.y === 0,
    );
    const source = structuredClone(old);
    const loaded = validateProject(old);
    expect(loaded.generated).toBeNull();
    expect(loaded.generationState.status).toBe("outdated");
    expect(loaded.model).toEqual(doc.model);
    expect(old).toEqual(source);
    expect(points(loaded)).toEqual([
      [0, 0],
      [0, 1250],
    ]);
    doc = toggleGrout(doc, result.floors[0].grouts![1], true);
    expect(points(doc)).toEqual([[0, 0]]);
    doc = restoreAutomaticGrouts(doc, doc.model.floors[0].id);
    expect(points(doc)).toEqual([
      [0, 0],
      [0, 1250],
    ]);
  });
  it("modalidade independente por pavimento, novo em Simples e cópia preservada sem vínculo", () => {
    let { doc } = fixture("cross");
    const first = doc.model.floors[0].id;
    doc = editFloor(doc, first, { groutMode: "reinforced" });
    doc = duplicateFloor(doc, first, 28000, "Cópia");
    expect(generate(doc).floors.map((f) => f.grouts?.length)).toEqual([5, 5]);
    const copy = doc.model.floors[1].id;
    doc = editFloor(doc, copy, { groutMode: "simple" });
    expect(generate(doc).floors.map((f) => f.grouts?.length)).toEqual([5, 1]);
    doc = addFloor(doc, { name: "Novo", level: 56000, defaultHeight: 28000 });
    expect(doc.model.floors[2].groutMode ?? "simple").toBe("simple");
    expect(doc.model.floors[0].groutMode).toBe("reinforced");
    expect(doc.project.groutSettings).toEqual({
      ...defaultGroutSettings(false),
      junctions: true,
    });
  });
  it("reforça L/T/cruz em conjunto com braços encostados pela face, sem compartilhar a célula central", () => {
    const { doc } = fixture("L");
    const m = 1250,
      floorId = doc.model.floors[0].id;
    const segments = [
      [
        [0, 0],
        [51, 0],
      ],
      [
        [0, 32],
        [51, 32],
      ],
      [
        [0, 1],
        [0, 32],
      ],
      [
        [50, 1],
        [50, 32],
      ],
      [
        [15, 1],
        [15, 11],
      ],
      [
        [34, 1],
        [34, 32],
      ],
      [
        [27, 19],
        [50, 19],
      ],
    ];
    doc.model.walls = segments.map(([a, b]) =>
      makeWall(
        { x: a[0] * m, y: a[1] * m },
        { x: b[0] * m, y: b[1] * m },
        m,
        floorId,
        2100,
        1,
      )!,
    );
    doc.project.groutSettings = defaultGroutSettings();
    doc.model.floors[0].groutMode = "reinforced";
    const result = generate(doc).floors[0];
    expect(result.diagnostics.filter((d) => d.severity === "error")).toEqual(
      [],
    );
    const expected = [
      {
        kind: "L",
        x: 0,
        y: 0,
        points: [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
      },
      {
        kind: "L",
        x: 50,
        y: 0,
        points: [
          [50, 0],
          [49, 0],
          [50, 1],
        ],
      },
      {
        kind: "L",
        x: 0,
        y: 32,
        points: [
          [0, 32],
          [0, 31],
          [1, 32],
        ],
      },
      {
        kind: "L",
        x: 50,
        y: 32,
        points: [
          [50, 32],
          [50, 31],
          [49, 32],
        ],
      },
      {
        kind: "T",
        x: 15,
        y: 0,
        points: [
          [15, 0],
          [14, 0],
          [16, 0],
          [15, 1],
        ],
      },
      {
        kind: "T",
        x: 34,
        y: 0,
        points: [
          [34, 0],
          [33, 0],
          [35, 0],
          [34, 1],
        ],
      },
      {
        kind: "T",
        x: 34,
        y: 32,
        points: [
          [34, 32],
          [33, 32],
          [35, 32],
          [34, 31],
        ],
      },
      {
        kind: "T",
        x: 50,
        y: 19,
        points: [
          [50, 19],
          [50, 18],
          [50, 20],
          [49, 19],
        ],
      },
      {
        kind: "cross",
        x: 34,
        y: 19,
        points: [
          [34, 19],
          [33, 19],
          [35, 19],
          [34, 18],
          [34, 20],
        ],
      },
    ];
    expect(result.components.flatMap((c) => c.junctions)).toHaveLength(
      expected.length,
    );
    for (const j of expected) {
      const origin = `junction:${j.kind}:${j.x * m}:${j.y * m}`;
      expect(
        result
          .grouts!.filter((a) => a.origins.includes(origin))
          .map((a) => [a.x, a.y]),
      ).toEqual(sorted(j.points.map(([x, y]) => [x * m, y * m])));
    }
  });
  it("não completa o reforço através de abertura nem desloca o candidato ausente", () => {
    let { doc } = fixture("T");
    doc.model.floors[0].groutMode = "reinforced";
    const wall = doc.model.walls.find((w) => w.a.y === w.b.y)!;
    doc = putOpening(doc, {
      id: crypto.randomUUID(),
      wallId: wall.id,
      kind: "opening",
      offset: 4 * 1250,
      width: 1250,
      base: 0,
      height: 2100,
    });
    expect(points(doc)).toEqual(
      [
        [0, 0],
        [-1250, 0],
        [0, 1250],
      ].sort((a, b) => a[1] - b[1] || a[0] - b[0]),
    );
  });
  it("novos furos ancoram intervalos; exclusão manual não redistribui a proposta", () => {
    let { doc } = fixture("L");
    const m = 1250;
    doc.project.groutSettings.intervals = true;
    doc.project.groutSettings.distance = 2 * m;
    expect(points(doc)).toEqual([
      [0, 0],
      [2 * m, 0],
      [0, 2 * m],
    ]);
    doc.model.floors[0].groutMode = "reinforced";
    const expected = [
      [0, 0],
      [m, 0],
      [3 * m, 0],
      [0, m],
      [0, 3 * m],
    ];
    expect(points(doc)).toEqual(expected);
    const axis = generate(doc).floors[0].grouts!.find(
      (a) => a.x === m && a.y === 0,
    )!;
    doc = toggleGrout(doc, axis, true);
    expect(points(doc)).toEqual(
      expected.filter(([x, y]) => x !== m || y !== 0),
    );
  });
  it.each([1250, 1500, 1251])(
    "EX-100–102 L/T/cruz nas orientações, módulo %i",
    (m) => {
      for (const kind of ["L", "T", "cross"] as const)
        for (let rotation = 0; rotation < 4; rotation++)
          for (const reflect of [false, true]) {
            const { doc, expected } = fixture(
              kind,
              m,
              rotation,
              reflect,
              rotation % 2 === 0,
            );
            const simple = generate(doc);
            expect(
              simple.diagnostics.filter((d) => d.severity === "error"),
            ).toEqual([]);
            expect(sorted(points(doc))).toEqual(
              sorted(
                kind === "T"
                  ? expected.filter(
                      ([x, y]) =>
                        (x === 0 && y === 0) ||
                        !expected.some(([ox, oy]) => ox === -x && oy === -y),
                    )
                  : [[0, 0]],
              ),
            );
            doc.model.floors[0].groutMode = "reinforced";
            const reinforced = generate(doc);
            expect(points(doc)).toEqual(sorted(expected));
            expect(reinforced.floors[0].courses).toEqual(
              simple.floors[0].courses,
            );
            expect(reinforced.floors[0].channels).toEqual(
              simple.floors[0].channels,
            );
            expect(quantities(current(doc))).toEqual(
              quantities({ ...current(doc), generated: simple }),
            );
          }
    },
  );
  it("EX-103 desconta abertura e respeita alturas sem transferir para outro furo", () => {
    let { doc } = fixture("T");
    doc.model.floors[0].groutMode = "reinforced";
    const wall = doc.model.walls.find((w) => w.a.y === w.b.y)!;
    doc = putOpening(doc, {
      id: crypto.randomUUID(),
      wallId: wall.id,
      kind: "window",
      offset: 4 * 1250,
      width: 1250,
      base: 700,
      height: 700,
    });
    expect(
      generate(doc).floors[0].grouts!.find((a) => a.x === 1250 && a.y === 0)
        ?.intervals,
    ).toEqual([
      { bottom: 0, top: 700 },
      { bottom: 1400, top: 2100 },
    ]);
    doc.model.walls.find((w) => w.id !== wall.id)!.height = 700;
    expect(
      generate(doc).floors[0].grouts!.find((a) => a.y === 1250)?.intervals,
    ).toEqual([{ bottom: 0, top: 700 }]);
    expect(points(doc)).toEqual(
      sorted(offsets.T.map(([x, y]) => [x * 1250, y * 1250])),
    );
  });
  it("EX-104 deduplica o eixo proposto por dois cantos e conserva origens", () => {
    const { doc } = fixture("L");
    const m = 1250,
      floorId = doc.model.floors[0].id;
    doc.model.walls = [
      makeWall({ x: 0, y: 0 }, { x: 3 * m, y: 0 }, m, floorId, 2100, 1)!,
      makeWall({ x: 0, y: 0 }, { x: 0, y: 4 * m }, m, floorId, 2100, 1)!,
      makeWall(
        { x: 2 * m, y: 0 },
        { x: 2 * m, y: 4 * m },
        m,
        floorId,
        2100,
        1,
      )!,
    ];
    doc.model.floors[0].groutMode = "reinforced";
    const result = generate(doc).floors[0];
    expect(result.diagnostics.filter((d) => d.severity === "error")).toEqual(
      [],
    );
    expect(result.grouts!.filter((a) => a.x === m && a.y === 0)).toHaveLength(
      1,
    );
    expect(
      result.grouts!.find((a) => a.x === m && a.y === 0)!.origins,
    ).toHaveLength(2);
  });
  it("EX-105 preserva inclusões, exclusões e pendências; restauração usa modalidade atual", () => {
    let { doc } = fixture("cross");
    doc.model.floors[0].groutMode = "reinforced";
    const result = generate(doc).floors[0],
      axis = result.grouts!.find((a) => a.x === 1250 && a.y === 0)!;
    doc = toggleGrout(doc, axis, true);
    const wall = doc.model.walls.find((w) => w.a.y === w.b.y)!;
    doc = toggleGrout(doc, { x: 3 * 1250, y: 0, wallIds: [wall.id] }, false);
    const pending = {
      id: crypto.randomUUID(),
      floorId: wall.floorId,
      x: 100 * 1250,
      y: 0,
      wallIds: [wall.id],
      action: "exclude" as const,
    };
    doc.adjustments.grout.push(pending);
    const adjustments = structuredClone(doc.adjustments);
    expect(points(doc)).toHaveLength(5); // four automatic + one manual
    doc.model.floors[0].groutMode = "simple";
    expect(points(doc)).toEqual([
      [0, 0],
      [3750, 0],
    ]);
    expect(doc.adjustments).toEqual(adjustments);
    doc.model.floors[0].groutMode = "reinforced";
    const restored = restoreAutomaticGrouts(doc, wall.floorId);
    expect(points(restored)).toEqual(
      sorted(offsets.cross.map(([x, y]) => [x * 1250, y * 1250])),
    );
    doc.project.groutSettings.junctions = false;
    expect(points(doc)).toEqual([[3750, 0]]);
    expect(doc.model.floors[0].groutMode).toBe("reinforced");
  });
  it("persiste em transporte, cópia, representação remota e pavimentos independentes", () => {
    let { doc } = fixture("cross");
    doc.model.floors[0].groutMode = "reinforced";
    doc = duplicateFloor(doc, doc.model.floors[0].id, 28000, "Superior");
    doc = current(doc);
    expect(generate(doc).floors.map((f) => f.grouts!.length)).toEqual([5, 5]);
    const transported = parseFile(serializeFile(doc).text);
    expect(transported).toEqual(doc);
    expect(importedCopy(doc).model.floors[0].groutMode).toBe("reinforced");
    expect(hydrate(dehydrate(doc, {}), {}).model.floors[0].groutMode).toBe(
      "reinforced",
    );
    const view = floorView(doc, doc.model.floors[1].id);
    expect(
      generateFloor(view).grouts!.every((a) => a.intervals[0].bottom === 28000),
    ).toBe(true);
  });
  it("migra a modalidade global de 20 para todos os pavimentos sem mutar a fonte", () => {
    let { doc } = fixture("L");
    doc.model.floors[0].groutMode = "reinforced";
    doc = duplicateFloor(doc, doc.model.floors[0].id, 28000, "Superior");
    doc = current(doc);
    const old = {
      ...doc,
      schemaVersion: 20,
      project: {
        ...doc.project,
        groutSettings: {
          ...doc.project.groutSettings,
          junctionMode: "reinforced",
        },
      },
      model: {
        ...doc.model,
        floors: doc.model.floors.map(({ groutMode, ...f }) => {
          void groutMode;
          return f;
        }),
      },
    };
    const source = JSON.stringify(old);
    const restored = validateProject(old);
    expect(restored.schemaVersion).toBe(26);
    expect(restored.model.floors.map((f) => f.groutMode)).toEqual([
      "reinforced",
      "reinforced",
    ]);
    expect(restored.project.groutSettings).not.toHaveProperty("junctionMode");
    expect(restored.generated).toEqual(doc.generated);
    expect(JSON.stringify(old)).toBe(source);
    const simple = validateProject({
      ...old,
      generated: null,
      generationState: { status: "outdated", diagnostics: [] },
      project: { ...old.project, groutSettings: defaultGroutSettings(false) },
    });
    expect(generate(simple).floors.map((f) => f.grouts?.length)).toEqual([
      0, 0,
    ]);
    expect(
      simple.model.floors.every((f) => (f.groutMode ?? "simple") === "simple"),
    ).toBe(true);
    expect(() => validateProject({ ...doc, schemaVersion: 20 })).toThrow(
      "anterior",
    );
    expect(() => validateProject({ ...old, schemaVersion: 19 })).toThrow(
      "anterior",
    );
    expect(() => validateProject({ ...doc, project: old.project })).toThrow(
      "estrutura",
    );
    for (const mode of ["other", null, 1])
      expect(() =>
        validateProject({
          ...doc,
          model: {
            ...doc.model,
            floors: doc.model.floors.map((f) => ({ ...f, groutMode: mode })),
          },
        }),
      ).toThrow("estrutura");
    expect(() => validateProject({ ...doc, schemaVersion: 27 })).toThrow(
      "incompatível",
    );
    const invalid = current(doc);
    invalid.generated!.floors[0].grouts!.pop();
    expect(() => validateProject(invalid)).toThrow("inconsistente");
  });
});
