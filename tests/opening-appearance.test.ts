import { afterEach, expect, it, vi } from "vitest";
vi.mock("../src/persistence/database", () => ({
  saveProject: vi.fn().mockResolvedValue(1),
  loadProject: vi.fn(),
  acquireProject: vi.fn().mockResolvedValue(() => {}),
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
import { saveProject } from "../src/persistence/database";

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
  vi.mocked(saveProject).mockReset().mockResolvedValue(1);
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
    "double-swing",
    "center-sliding",
    "tilt",
  ] as const) {
    let a: OpeningAppearance = { type, orientation: 0 };
    const values = [];
    for (let i = 0; i < (type === "swing" || type === "sliding" ? 4 : 2); i++) {
      values.push(a.orientation);
      a = nextOrientation(a);
    }
    expect(values).toEqual(
      type === "swing" || type === "sliding" ? [0, 1, 2, 3] : [0, 1],
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
    "center-sliding",
    "tilt",
  ].map((type) => JSON.stringify(shape(type as OpeningAppearance["type"])));
  expect(new Set(signatures).size).toBe(5);
});

it("EX-99 transporte/cópias e envelopes anteriores preservam genéricos sem tocar origem", () => {
  const d = fixture();
  for (const version of [9, 10, 11]) {
    const old = JSON.parse(JSON.stringify(d));
    old.schemaVersion = version;
    delete old.model.imageElements;
    delete old.model.customImageAssets;
    if (version < 11) delete old.model.referenceImages;
    if (version === 9) delete old.model.measurements;
    const original = JSON.stringify(old);
    const restored = validateProject(old);
    expect(restored.schemaVersion).toBe(13);
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
