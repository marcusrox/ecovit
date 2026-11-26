import { CURRENT_PROJECT_FORMAT } from "../src/domain/project-format";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("../src/persistence/remote", () => ({
  forgetProject: vi.fn(),
  pendingErrorKind: () => "falhou",
  saveProject: vi.fn().mockResolvedValue({
    projectId: "test-project",
    revision: "1",
    operationId: "test-operation",
  }),
  loadProject: vi.fn(),
}));
import {
  createProject,
  makeWall,
  type Opening,
  type OpeningAppearance,
} from "../src/domain/project";
import {
  defaultAppearance,
  nextOrientation,
  appearanceOptions,
  validAppearance,
} from "../src/domain/opening-appearance";
import { openingSymbolStrokes } from "../src/domain/opening-symbol";
import { floorPlanBounds } from "../src/domain/floor-reference";
import { duplicateFloor } from "../src/domain/floors";
import { putOpening } from "../src/domain/openings";
import {
  parseFile,
  serializeFile,
  validateProject,
  importedCopy,
} from "../src/persistence/files";
import * as engine from "../src/domain/composition";
import { useStore } from "../src/state/store";
import { saveProject } from "../src/persistence/remote";

function fixture() {
  const d = createProject("M9", { length: 2500, width: 1250, height: 700 });
  const w = makeWall(
    { x: 0, y: 0 },
    { x: 40000, y: 0 },
    1250,
    d.model.floors[0].id,
    28000,
    1,
  )!;
  d.model.walls = [w];
  d.model.openings = [
    {
      id: crypto.randomUUID(),
      wallId: w.id,
      kind: "door",
      offset: 5000,
      width: 10000,
      base: 0,
      height: 21700,
    },
  ];
  return d;
}
afterEach(() => {
  useStore.getState().close();
  vi.restoreAllMocks();
  vi.mocked(saveProject).mockReset().mockResolvedValue({
    projectId: "test-project",
    revision: "1",
    operationId: "test-operation",
  });
});

it("EX-95/97 ciclos completos e padrões de criação", () => {
  expect(defaultAppearance("door")).toEqual({ type: "swing", orientation: 0 });
  expect(defaultAppearance("window")).toEqual({
    type: "sliding",
    orientation: 0,
  });
  expect(defaultAppearance("opening")).toBeUndefined();
  for (const type of [
    "swing",
    "sliding",
    "double-sliding",
    "double-swing",
    "center-sliding",
    "quad-sliding",
    "tilt",
  ] as const) {
    let a: OpeningAppearance = { type, orientation: 0 };
    const values = [];
    for (
      let i = 0;
      i <
      (type === "swing" || type === "sliding" || type === "double-sliding"
        ? 4
        : 2);
      i++
    ) {
      values.push(a.orientation);
      a = nextOrientation(a);
    }
    expect(values).toEqual(
      type === "swing" || type === "sliding" || type === "double-sliding"
        ? [0, 1, 2, 3]
        : [0, 1],
    );
    expect(a).toEqual({ type, orientation: 0 });
  }
});

it("EX-95/96 extremos e raio do giro, rotação e espelhamentos literais", () => {
  const door = (
    orientation: 0 | 1 | 2 | 3,
  ): Pick<Opening, "kind" | "appearance"> => ({
    kind: "door",
    appearance: { type: "swing", orientation },
  });
  const points = (orientation: 0 | 1 | 2 | 3, horizontal = true) =>
    openingSymbolStrokes(
      door(orientation),
      horizontal,
      0,
      0,
      horizontal ? 100 : 10,
      horizontal ? 10 : 100,
    ).flatMap((s) => s.points);
  expect(points(0)).toContainEqual({ x: 0, y: -95 });
  expect(points(1)).toContainEqual({ x: 100, y: -95 });
  expect(points(2)).toContainEqual({ x: 0, y: 105 });
  expect(points(3)).toContainEqual({ x: 100, y: 105 });
  expect(points(0, false)).toContainEqual({ x: 105, y: 0 });
  const arc = openingSymbolStrokes(door(0), true, 0, 0, 100, 10).at(-1)!;
  for (const p of arc.points)
    expect(Math.hypot(p.x, p.y - 5)).toBeCloseTo(100, 9);
});

it("EX-97/98 giro duplo e basculantes têm dimensões gráficas explícitas", () => {
  const shape = (
    type: OpeningAppearance["type"],
    kind: Opening["kind"] = "door",
  ) =>
    openingSymbolStrokes(
      { kind, appearance: { type, orientation: 0 } },
      true,
      0,
      0,
      100,
      10,
    );
  const double = shape("double-swing").flatMap((s) => s.points);
  expect(double).toContainEqual({ x: 0, y: -45 });
  expect(double).toContainEqual({ x: 100, y: -45 });
  expect(
    shape("tilt")
      .filter((s) => s.dashed)
      .flatMap((s) => s.points),
  ).toContainEqual({ x: 0, y: -55 });
  expect(
    shape("tilt", "window")
      .filter((s) => s.dashed)
      .flatMap((s) => s.points),
  ).toContainEqual({ x: 0, y: -25 });
  const signatures = [
    "swing",
    "double-swing",
    "sliding",
    "double-sliding",
    "center-sliding",
    "quad-sliding",
    "tilt",
  ].map((type) => JSON.stringify(shape(type as OpeningAppearance["type"])));
  expect(new Set(signatures).size).toBe(7);
});

it("EX-99 transporte/cópias e envelopes anteriores preservam genéricos sem tocar origem", () => {
  const d = fixture();
  for (const version of [9, 10, 11]) {
    const old = JSON.parse(JSON.stringify(d));
    old.schemaVersion = version;
    Reflect.deleteProperty(old.model, "terrain");
    Reflect.deleteProperty(old.model, "roomLabels");
    Reflect.deleteProperty(old.model, "roomBoundaries");
    delete old.model.imageElements;
    delete old.model.customImageAssets;
    if (version < 11) delete old.model.referenceImages;
    if (version === 9) delete old.model.measurements;
    const original = JSON.stringify(old);
    const restored = validateProject(old);
    expect(restored.schemaVersion).toBe(CURRENT_PROJECT_FORMAT);
    expect(restored.model.openings[0].appearance).toBeUndefined();
    expect(JSON.stringify(old)).toBe(original);
    old.model.openings[0].appearance = { type: "swing", orientation: 0 };
    expect(() => validateProject(old)).toThrow(/anterior/);
  }
  d.model.openings[0].appearance = { type: "tilt", orientation: 1 };
  expect(parseFile(serializeFile(d).text).model.openings).toEqual(
    d.model.openings,
  );
  expect(importedCopy(d).model.openings).toEqual(d.model.openings);
  const copied = duplicateFloor(d, d.model.floors[0].id, 28000, "Superior");
  expect(copied.model.openings[1].appearance).toEqual({
    type: "tilt",
    orientation: 1,
  });
  expect(copied.model.openings[1].wallId).not.toBe(d.model.openings[0].wallId);
  copied.model.openings[1].appearance!.orientation = 0;
  expect(d.model.openings[0].appearance.orientation).toBe(1);
});

it.each([
  ["door", { type: "tilt", orientation: 2 }],
  ["door", { type: "swing", orientation: 4 }],
  ["window", { type: "center-sliding", orientation: 0 }],
  ["opening", { type: "swing", orientation: 0 }],
  ["door", { type: "unknown", orientation: 0 }],
  ["door", { type: "swing", orientation: -1 }],
  ["door", { type: "swing", orientation: 0.5 }],
  ["door", { type: "swing", orientation: "0" }],
  ["door", { type: "swing", orientation: 0, extra: true }],
])("M9 arquivo recusa combinação inválida %s %j", (kind, appearance) => {
  const d = fixture();
  Object.assign(d.model.openings[0], { kind, appearance });
  expect(() => validateProject(d)).toThrow();
});

it("M9 enquadramento inclui folha em Planta e preserva caixa construtiva em Fiada", () => {
  const d = fixture(),
    floor = d.model.floors[0].id;
  d.model.openings[0].appearance = { type: "swing", orientation: 0 };
  expect(floorPlanBounds(d, [floor])).toEqual({
    x: 0,
    y: -9375,
    width: 40000,
    height: 10625,
  });
  expect(floorPlanBounds(d, [floor], false, undefined, false)).toEqual({
    x: 0,
    y: 0,
    width: 40000,
    height: 1250,
  });
});

it.each([false, true])(
  "M9 visual não chama motor em edição/histórico, desatualizado=%s",
  async (stale) => {
    const s = useStore.getState();
    await s.open(fixture(), true);
    if (stale)
      useStore.setState({
        doc: {
          ...useStore.getState().doc!,
          generated: null,
          generationState: { status: "outdated", diagnostics: [] },
        },
      });
    const before = useStore.getState().doc!,
      result = structuredClone(before.generated),
      state = structuredClone(before.generationState);
    const spy = vi.spyOn(engine, "generate");
    spy.mockClear();
    await s.commit(
      putOpening(before, {
        ...before.model.openings[0],
        appearance: { type: "tilt", orientation: 1 },
      }),
    );
    expect(useStore.getState().doc!.model.openings[0].appearance).toEqual({
      type: "tilt",
      orientation: 1,
    });
    expect(useStore.getState().doc!.generated).toEqual(result);
    expect(useStore.getState().doc!.generationState).toEqual(state);
    await s.undo();
    await s.undo(true);
    expect(useStore.getState().doc!.generated).toEqual(result);
    expect(spy).not.toHaveBeenCalled();
    vi.mocked(saveProject).mockRejectedValueOnce(new Error("quota"));
    await s.commit(
      putOpening(useStore.getState().doc!, {
        ...before.model.openings[0],
        appearance: { type: "sliding", orientation: 3 },
      }),
    );
    expect(useStore.getState().saved).toBe("error");
    expect(spy).not.toHaveBeenCalled();
    expect(
      parseFile(serializeFile(useStore.getState().doc!).text).model.openings[0]
        .appearance,
    ).toEqual({ type: "sliding", orientation: 3 });
    useStore.setState({ readonly: true });
    await s.commit(before);
    expect(
      useStore.getState().doc!.model.openings[0].appearance?.orientation,
    ).toBe(3);
  },
);

it("M9 dimensão ainda recalcula e snapshot adulterado continua recusado", async () => {
  await useStore.getState().open(fixture(), true);
  const d = useStore.getState().doc!,
    spy = vi.spyOn(engine, "generate");
  spy.mockClear();
  await useStore
    .getState()
    .commit(putOpening(d, { ...d.model.openings[0], width: 11250 }));
  expect(spy).toHaveBeenCalledTimes(1);
  const tampered = structuredClone(useStore.getState().doc!);
  tampered.generated!.floors[0].courses[0].pieces.pop();
  expect(() => validateProject(tampered)).toThrow(/inconsistente/);
});

it("portas de correr de duas e quatro folhas: catálogo, folhas iguais e movimentos centrais", () => {
  const options = appearanceOptions("door");
  expect(options.filter((o) => o.type === "center-sliding")).toEqual([
    { type: "center-sliding", label: "Correr · abertura central" },
  ]);
  expect(options.filter((o) => o.type === "quad-sliding")).toEqual([
    { type: "quad-sliding", label: "Correr · quatro folhas" },
  ]);
  expect(
    appearanceOptions("window").some((o) => o.type === "quad-sliding"),
  ).toBe(false);
  expect(
    validAppearance({
      kind: "window",
      appearance: { type: "quad-sliding", orientation: 0 },
    }),
  ).toBe(false);
  const door = {
    kind: "door",
    appearance: { type: "quad-sliding", orientation: 0 },
  } as const;
  const strokes = openingSymbolStrokes(door, true, 0, 0, 100, 10);
  const panels = strokes.filter((s) => s.points.length === 5);
  expect(panels).toHaveLength(4);
  expect(panels.map((p) => p.points[0])).toEqual([
    { x: 0, y: 2.5 },
    { x: 75, y: 2.5 },
    { x: 12.5, y: 7 },
    { x: 62.5, y: 7 },
  ]);
  for (const panel of panels)
    expect(panel.points[1].x - panel.points[0].x).toBe(25);
  expect(strokes.at(-4)!.points).toEqual([
    { x: 45, y: -12 },
    { x: 25, y: -12 },
  ]);
  expect(strokes.at(-2)!.points).toEqual([
    { x: 55, y: -12 },
    { x: 75, y: -12 },
  ]);
  const mirrored = openingSymbolStrokes(
    { ...door, appearance: { type: "quad-sliding", orientation: 1 } },
    true,
    0,
    0,
    100,
    10,
  );
  const vertical = openingSymbolStrokes(door, false, 0, 0, 10, 100);
  strokes.forEach((stroke, i) =>
    stroke.points.forEach((p, j) => {
      expect(mirrored[i].points[j].x).toBeCloseTo(p.x, 9);
      expect(mirrored[i].points[j].y).toBeCloseTo(10 - p.y, 9);
      expect(vertical[i].points[j].x).toBeCloseTo(10 - p.y, 9);
      expect(vertical[i].points[j].y).toBeCloseTo(p.x, 9);
    }),
  );
});

it("quatro folhas: arquivo, cópias, legado e combinações inválidas", () => {
  const d = fixture();
  d.model.openings[0].appearance = { type: "quad-sliding", orientation: 1 };
  expect(parseFile(serializeFile(d).text).model.openings).toEqual(
    d.model.openings,
  );
  expect(importedCopy(d).model.openings).toEqual(d.model.openings);
  const copied = duplicateFloor(d, d.model.floors[0].id, 28000, "Superior");
  expect(copied.model.openings[1].appearance).toEqual(
    d.model.openings[0].appearance,
  );
  expect(copied.model.openings[1].appearance).not.toBe(
    d.model.openings[0].appearance,
  );
  expect(() => validateProject({ ...d, schemaVersion: 28 })).toThrow(
    "formato anterior",
  );
  for (const change of [
    { kind: "window", appearance: { type: "quad-sliding", orientation: 0 } },
    { kind: "opening", appearance: { type: "quad-sliding", orientation: 0 } },
    { appearance: { type: "quad-sliding", orientation: 2 } },
  ]) {
    const invalid = structuredClone(d);
    Object.assign(invalid.model.openings[0], change);
    expect(() => validateProject(invalid)).toThrow();
  }
  const old = structuredClone(d) as unknown as {
    schemaVersion: number;
    model: { openings: Opening[] };
  };
  old.schemaVersion = 28;
  old.model.openings[0].appearance = { type: "center-sliding", orientation: 1 };
  const original = JSON.stringify(old);
  expect(validateProject(old).model.openings[0].appearance).toEqual({
    type: "center-sliding",
    orientation: 1,
  });
  expect(JSON.stringify(old)).toBe(original);
});

it("novas opções de correr preservam composição e dimensões no histórico", async () => {
  const d = fixture();
  d.generated = engine.generate(d);
  d.generationState = {
    status: "current",
    diagnostics: d.generated.diagnostics,
  };
  await useStore.getState().open(d, true);
  const spy = vi.spyOn(engine, "generate");
  for (const type of ["center-sliding", "quad-sliding"] as const) {
    const current = useStore.getState().doc!;
    await useStore.getState().commit({
      ...current,
      model: {
        ...current.model,
        openings: current.model.openings.map((o) => ({
          ...o,
          appearance: { type, orientation: 0 },
        })),
      },
    });
    expect(useStore.getState().doc!.generated).toEqual(d.generated);
    expect(useStore.getState().doc!.model.openings[0].width).toBe(10000);
  }
  await useStore.getState().undo();
  expect(useStore.getState().doc!.model.openings[0].appearance?.type).toBe(
    "center-sliding",
  );
  await useStore.getState().undo(true);
  expect(useStore.getState().doc!.model.openings[0].appearance?.type).toBe(
    "quad-sliding",
  );
  expect(spy).not.toHaveBeenCalled();
});

it("correr de duas folhas é independente da abertura central e visualmente distinta da janela", () => {
  const options = appearanceOptions("door");
  expect(options.filter((o) => o.type === "double-sliding")).toEqual([
    { type: "double-sliding", label: "Correr · duas folhas" },
  ]);
  expect(options.filter((o) => o.type === "center-sliding")).toEqual([
    { type: "center-sliding", label: "Correr · abertura central" },
  ]);
  expect(
    validAppearance({
      kind: "window",
      appearance: { type: "double-sliding", orientation: 0 },
    }),
  ).toBe(false);
  const shape = (
    type: OpeningAppearance["type"],
    kind: Opening["kind"] = "door",
    orientation: OpeningAppearance["orientation"] = 0,
    horizontal = true,
  ) =>
    openingSymbolStrokes(
      { kind, appearance: { type, orientation } },
      horizontal,
      0,
      0,
      horizontal ? 100 : 10,
      horizontal ? 10 : 100,
    );
  const door = shape("double-sliding"),
    window = shape("sliding", "window");
  const panels = door.filter((stroke) => stroke.points.length === 5);
  expect(panels).toHaveLength(2);
  expect(panels[0].points[0].x).toBe(0);
  expect(panels[0].points[0].y).toBeCloseTo(2.8, 9);
  expect(panels[1].points[0]).toEqual({ x: 50, y: 5 });
  for (const panel of panels) {
    expect(panel.points[1].x - panel.points[0].x).toBe(50);
    expect(panel.points.every((p) => p.y >= 0 && p.y <= 10)).toBe(true);
  }
  expect(door.every((stroke) => !stroke.dashed)).toBe(true);
  expect(door[4].points).toEqual([
    { x: 38, y: -10 },
    { x: 62, y: -10 },
  ]);
  expect(door[5].points[1]).toEqual({ x: 62, y: -10 });
  expect(door[6].points[1]).toEqual({ x: 38, y: -10 });
  expect(window.some((stroke) => stroke.dashed)).toBe(false);
  expect(door).not.toEqual(window);
  for (const orientation of [1, 2, 3] as const) {
    const transformed = shape("double-sliding", "door", orientation);
    door.forEach((stroke, i) =>
      stroke.points.forEach((p, j) => {
        expect(transformed[i].points[j].x).toBeCloseTo(
          orientation % 2 ? 100 - p.x : p.x,
          9,
        );
        expect(transformed[i].points[j].y).toBeCloseTo(
          orientation >= 2 ? 10 - p.y : p.y,
          9,
        );
      }),
    );
  }
  const vertical = shape("double-sliding", "door", 0, false);
  door.forEach((stroke, i) =>
    stroke.points.forEach((p, j) => {
      expect(vertical[i].points[j].x).toBeCloseTo(10 - p.y, 9);
      expect(vertical[i].points[j].y).toBeCloseTo(p.x, 9);
    }),
  );
  // Pin the existing central-opening symbol; adding a separate type must not reinterpret it.
  const central = shape("center-sliding");
  expect(
    central
      .filter((stroke) => stroke.points.length === 5)
      .map((stroke) => [stroke.points[0].x, stroke.points[1].x]),
  ).toEqual([
    [-45, 5],
    [95, 145],
  ]);
  expect(central[4].points).toEqual([
    { x: 40, y: -20 },
    { x: -15, y: -20 },
  ]);
});

it("duas folhas: transporte, cópias e histórico não afetam a abertura central nem a composição", async () => {
  const d = fixture();
  d.model.openings[0].appearance = { type: "center-sliding", orientation: 1 };
  const legacy = { ...d, schemaVersion: 29 };
  expect(validateProject(legacy).model.openings[0].appearance).toEqual(
    d.model.openings[0].appearance,
  );
  d.generated = engine.generate(d);
  d.generationState = {
    status: "current",
    diagnostics: d.generated.diagnostics,
  };
  await useStore.getState().open(d, true);
  const before = useStore.getState().doc!;
  const spy = vi.spyOn(engine, "generate");
  const next = putOpening(before, {
    ...before.model.openings[0],
    appearance: { type: "double-sliding", orientation: 3 },
  });
  await useStore.getState().commit(next);
  const saved = useStore.getState().doc!;
  expect(saved.generated).toEqual(d.generated);
  expect(spy).not.toHaveBeenCalled();
  expect(saved.model.openings[0].width).toBe(d.model.openings[0].width);
  expect(parseFile(serializeFile(saved).text).model.openings).toEqual(
    saved.model.openings,
  );
  expect(importedCopy(saved).model.openings).toEqual(saved.model.openings);
  const copy = duplicateFloor(
    saved,
    saved.model.floors[0].id,
    28000,
    "Superior",
  );
  expect(copy.model.openings[1].appearance).toEqual({
    type: "double-sliding",
    orientation: 3,
  });
  expect(copy.model.openings[1].appearance).not.toBe(
    saved.model.openings[0].appearance,
  );
  expect(() => validateProject({ ...saved, schemaVersion: 29 })).toThrow(
    "formato anterior",
  );
  const validationCalls = spy.mock.calls.length;
  await useStore.getState().undo();
  expect(useStore.getState().doc!.model.openings[0].appearance).toEqual({
    type: "center-sliding",
    orientation: 1,
  });
  await useStore.getState().undo(true);
  expect(useStore.getState().doc!.model.openings[0].appearance).toEqual({
    type: "double-sliding",
    orientation: 3,
  });
  expect(spy).toHaveBeenCalledTimes(validationCalls);
});
