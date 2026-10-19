import { beforeEach, expect, it, vi } from "vitest";
vi.mock("../src/persistence/database", () => ({
  saveProject: vi.fn().mockResolvedValue(1),
  loadProject: vi.fn(),
  acquireProject: vi.fn().mockResolvedValue(() => {}),
}));
import {
  createProject,
  makeWall,
  LIMIT,
  type Measurement,
} from "../src/domain/project";
import {
  measurementLength,
  measurementText,
  measurementTargets,
  attractMeasurement,
  nearMeasurement,
  projection,
  validMeasurement,
} from "../src/domain/measurements";
import {
  duplicateFloor,
  mergeFloorView,
  removeFloor,
} from "../src/domain/floors";
import { floorPlanBounds } from "../src/domain/floor-reference";
import * as engine from "../src/domain/composition";
import {
  parseFile,
  serializeFile,
  validateProject,
  importedCopy,
} from "../src/persistence/files";
import { useStore } from "../src/state/store";
import { saveProject } from "../src/persistence/database";

const fixture = () =>
  createProject("Medidas", { length: 2500, width: 1250, height: 700 });
function measurement(
  floorId: string,
  a = { x: -123, y: 456 },
  b = { x: 29877, y: 40456 },
): Measurement {
  return { id: crypto.randomUUID(), floorId, a, b };
}
beforeEach(() => {
  vi.restoreAllMocks();
  useStore.setState({ busy: false });
  useStore.getState().close();
  vi.mocked(saveProject).mockClear();
});

it("M7 distância euclidiana, arredondamento só no texto e segmentos finitos", () => {
  const m = measurement(crypto.randomUUID());
  expect(measurementLength(m)).toBe(50000);
  expect(measurementText(m)).toBe("500 cm");
  expect(measurementText({ a: m.b, b: m.a })).toBe("500 cm");
  const diagonal = { a: { x: 0, y: 0 }, b: { x: 10000, y: 10000 } };
  expect(measurementText(diagonal)).toBe("141,42 cm");
  expect(diagonal.b).toEqual({ x: 10000, y: 10000 });
  expect(projection({ x: 20, y: 8 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toEqual({
    x: 10,
    y: 0,
  });
  expect(nearMeasurement({ x: 0, y: 0 }, m, 1000)).toBe(true);
  expect(validMeasurement({ ...m, b: m.a })).toBe(false);
  expect(validMeasurement({ ...m, a: { x: LIMIT + 1, y: 0 } })).toBe(false);
});

it("M7 atração prioriza vértices, Alt libera, zoom conserva tolerância e empate é estável", () => {
  const targets = {
    vertices: [
      { x: 100, y: 8 },
      { x: 100, y: -8 },
    ],
    segments: [
      [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
      ] as [{ x: number; y: number }, { x: number; y: number }],
    ],
  };
  expect(attractMeasurement({ x: 100, y: 1 }, targets, 1)).toEqual({
    point: { x: 100, y: 8 },
    snapped: true,
  });
  expect(attractMeasurement({ x: 100, y: 0 }, targets, 1).point).toEqual({
    x: 100,
    y: -8,
  });
  expect(
    attractMeasurement(
      { x: 100, y: 0 },
      { ...targets, vertices: [...targets.vertices].reverse() },
      1,
    ).point,
  ).toEqual({ x: 100, y: -8 });
  expect(attractMeasurement({ x: 100.3, y: 1.2 }, targets, 1, true)).toEqual({
    point: { x: 100, y: 1 },
    snapped: false,
  });
  expect(attractMeasurement({ x: 80, y: 10 }, targets, 1).snapped).toBe(false);
  expect(attractMeasurement({ x: 80, y: 10 }, targets, 0.5).point).toEqual({
    x: 80,
    y: 0,
  });
});

it("M7 alvos de faces, vãos, lajes, aberturas e outras medidas só no ativo", () => {
  const d = fixture(),
    floor = d.model.floors[0].id;
  const w = makeWall(
    { x: 0, y: 0 },
    { x: 10000, y: 0 },
    1250,
    floor,
    28000,
    1,
  )!;
  d.model.walls.push(w, {
    ...w,
    id: crypto.randomUUID(),
    floorId: "other",
    a: { x: 90000, y: 90000 },
    b: { x: 100000, y: 90000 },
  });
  d.model.openings.push({
    id: crypto.randomUUID(),
    wallId: w.id,
    kind: "door",
    offset: 2500,
    width: 2500,
    base: 0,
    height: 21000,
  });
  d.model.slabs.push({
    id: crypto.randomUUID(),
    floorId: floor,
    thickness: 2100,
    contour: [
      { x: 20000, y: 0 },
      { x: 30000, y: 0 },
      { x: 30000, y: 10000 },
      { x: 20000, y: 10000 },
    ],
    openings: [
      {
        id: crypto.randomUUID(),
        contour: [
          { x: 22500, y: 2500 },
          { x: 25000, y: 2500 },
          { x: 25000, y: 5000 },
          { x: 22500, y: 5000 },
        ],
      },
    ],
  });
  const m = measurement(floor);
  d.model.measurements.push(m);
  const targets = measurementTargets(d, floor);
  for (const p of [
    { x: 0, y: 1250 },
    { x: 2500, y: 0 },
    { x: 20000, y: 0 },
    { x: 22500, y: 2500 },
    m.a,
  ])
    expect(targets.vertices).toContainEqual(p);
  expect(targets.vertices).not.toContainEqual({ x: 90000, y: 90000 });
  expect(measurementTargets(d, floor, m.id).vertices).not.toContainEqual(m.a);
  expect(targets.segments).toHaveLength(16);
});

it("M7 validação, transporte, envelope 9 e cópias de pavimento preservam intenção", () => {
  const d = fixture(),
    floor = d.model.floors[0].id;
  d.model.measurements.push(measurement(floor));
  const transported = parseFile(serializeFile(d).text);
  expect(transported.model.measurements).toEqual(d.model.measurements);
  expect(importedCopy(transported).model.measurements).toEqual(
    d.model.measurements,
  );
  const legacy = structuredClone(d) as unknown as {
    schemaVersion: number;
    model: { measurements?: Measurement[]; referenceImages?: unknown[]; imageElements?: unknown[]; customImageAssets?: unknown[] };
  };
  legacy.schemaVersion = 9;
  delete legacy.model.imageElements;
  delete legacy.model.customImageAssets;
  delete legacy.model.referenceImages;
  delete legacy.model.measurements;
  expect(validateProject(legacy).model.measurements).toEqual([]);
  expect(legacy.schemaVersion).toBe(9);
  const copied = duplicateFloor(d, floor, 28000, "Cópia");
  expect(copied.model.measurements).toHaveLength(2);
  expect(copied.model.measurements[1].a).toEqual(d.model.measurements[0].a);
  expect(copied.model.measurements[1].id).not.toBe(d.model.measurements[0].id);
  expect(removeFloor(copied, floor).model.measurements).toEqual([
    copied.model.measurements[1],
  ]);
  const local = engine.floorView(copied, floor);
  expect(local.model.measurements).toHaveLength(1);
  const merged = mergeFloorView(copied, {
    ...local,
    model: { ...local.model, measurements: [] },
  });
  expect(merged.model.measurements).toEqual([copied.model.measurements[1]]);
  expect(floorPlanBounds(d, [floor], true, floor)).toEqual({
    x: -123,
    y: 456,
    width: 30000,
    height: 40000,
  });
  for (const invalid of [
    { ...d.model.measurements[0], b: d.model.measurements[0].a },
    { ...d.model.measurements[0], floorId: crypto.randomUUID() },
    { ...d.model.measurements[0], a: { x: 0.1, y: 0 } },
  ]) {
    expect(() =>
      validateProject({ ...d, model: { ...d.model, measurements: [invalid] } }),
    ).toThrow();
  }
  expect(() =>
    validateProject({
      ...d,
      model: {
        ...d.model,
        measurements: [d.model.measurements[0], d.model.measurements[0]],
      },
    }),
  ).toThrow(/duplicados/);
});

it("M7 salvar e desfazer medidas não chama motor nem altera resultado ou pendências", async () => {
  await useStore.getState().open(fixture(), true);
  const current = useStore.getState().doc!;
  const spy = vi.spyOn(engine, "generate");
  const m = measurement(current.model.floors[0].id);
  await useStore
    .getState()
    .commit(
      { ...current, model: { ...current.model, measurements: [m] } },
      "measure",
    );
  expect(spy).not.toHaveBeenCalled();
  expect(useStore.getState().doc!.generated).toEqual(current.generated);
  expect(useStore.getState().doc!.generationState).toEqual(
    current.generationState,
  );
  await useStore.getState().undo();
  await useStore.getState().undo(true);
  expect(spy).not.toHaveBeenCalled();
  expect(useStore.getState().doc!.model.measurements).toEqual([m]);
  useStore.setState({
    doc: {
      ...current,
      generated: null,
      generationState: { status: "outdated", diagnostics: [] },
    },
  });
  await useStore.getState().commit(
    {
      ...useStore.getState().doc!,
      model: { ...current.model, measurements: [m] },
    },
    "measure",
  );
  expect(spy).not.toHaveBeenCalled();
  expect(useStore.getState().doc!.generationState.status).toBe("outdated");
  expect(saveProject).toHaveBeenCalled();
});

it("M7 falha de gravação conserva medida em memória e no arquivo sem chamar motor", async () => {
  await useStore.getState().open(fixture(), true);
  const d = useStore.getState().doc!,
    m = measurement(d.model.floors[0].id);
  const spy = vi.spyOn(engine, "generate");
  vi.mocked(saveProject).mockRejectedValueOnce(new Error("quota"));
  await useStore
    .getState()
    .commit({ ...d, model: { ...d.model, measurements: [m] } }, "measure");
  const s = useStore.getState();
  expect(s.saved).toBe("error");
  expect(s.doc!.model.measurements).toEqual([m]);
  expect(parseFile(serializeFile(s.doc!).text).model.measurements).toEqual([m]);
  // File validation above recomputes for integrity; the edit itself did not.
  expect(spy).toHaveBeenCalledTimes(1);
});

it("M7 rejeita edição em outro pavimento e mantém somente leitura intacto", async () => {
  const d = fixture();
  const copied = duplicateFloor(d, d.model.floors[0].id, 28000, "Outro");
  await useStore.getState().open(copied, true);
  const before = useStore.getState().doc!,
    history = useStore.getState().history;
  const foreign = measurement(before.model.floors[1].id);
  const spy = vi.spyOn(engine, "generate");
  await useStore
    .getState()
    .commit(
      { ...before, model: { ...before.model, measurements: [foreign] } },
      "measure",
    );
  expect(useStore.getState().doc).toBe(before);
  expect(useStore.getState().history).toBe(history);
  useStore.setState({ readonly: true });
  await useStore.getState().commit(
    {
      ...before,
      model: {
        ...before.model,
        measurements: [measurement(before.model.floors[0].id)],
      },
    },
    "measure",
  );
  expect(useStore.getState().doc).toBe(before);
  expect(spy).not.toHaveBeenCalled();
});
