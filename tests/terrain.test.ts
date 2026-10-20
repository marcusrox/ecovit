import { beforeEach, expect, it, vi } from "vitest";
vi.mock("../src/persistence/database", () => ({
  saveProject: vi.fn().mockResolvedValue(1),
  loadProject: vi.fn(),
  acquireProject: vi.fn().mockResolvedValue(() => {}),
}));
import {
  createProject,
  LIMIT,
  type Point,
  type Terrain,
} from "../src/domain/project";
import {
  terrainArea,
  terrainAreaText,
  terrainContains,
  terrainLabelPoint,
  translateTerrain,
  validateTerrain,
  validateTerrainContour,
} from "../src/domain/terrain";
import {
  parseFile,
  serializeFile,
  validateProject,
  importedCopy,
} from "../src/persistence/files";
import {
  duplicateFloor,
  removeFloor,
  mergeFloorView,
} from "../src/domain/floors";
import * as engine from "../src/domain/composition";
import { useStore } from "../src/state/store";
import { saveProject } from "../src/persistence/database";

const fixture = () =>
  createProject("Terreno", { length: 2500, width: 1250, height: 700 });
const ring = (points: number[][]): Point[] =>
  points.map(([x, y]) => ({ x, y }));
const rectangle = ring([
  [0, 0],
  [50000, 0],
  [50000, 50000],
  [0, 50000],
]);
const terrain = (): Terrain => ({
  id: crypto.randomUUID(),
  material: "grass",
  revision: 1,
  contour: structuredClone(rectangle),
  textureOrigin: { x: 0, y: 0 },
});
beforeEach(() => {
  vi.restoreAllMocks();
  useStore.setState({ busy: false });
  useStore.getState().close();
  vi.mocked(saveProject).mockResolvedValue(1);
  vi.mocked(saveProject).mockClear();
});
it("M11 anéis livres convexos/côncavos, área exata e âncora interior independente do sentido", () => {
  const triangle = ring([
    [-20000, -10000],
    [10000, -10000],
    [-20000, 30000],
  ]);
  validateTerrainContour(triangle);
  expect(terrainArea(triangle)).toBe(6);
  expect(terrainArea([...triangle].reverse())).toBe(6);
  expect(terrainAreaText(rectangle)).toBe("25,00 m²");
  const concave = ring([
    [0, 0],
    [100000, 0],
    [100000, 10000],
    [10000, 10000],
    [10000, 90000],
    [100000, 90000],
    [100000, 100000],
    [0, 100000],
  ]);
  validateTerrainContour(concave);
  expect(terrainArea(concave)).toBe(28);
  expect(terrainContains(terrainLabelPoint(concave), concave)).toBe(true);
  // A tiny triangle at the arithmetic bounds still has a positive exact area.
  const far = ring([
    [LIMIT, LIMIT],
    [LIMIT - 1, LIMIT],
    [LIMIT, LIMIT - 1],
  ]);
  validateTerrainContour(far);
  expect(terrainArea(far)).toBe(0.000000005);
});
it("M11 recusa cruzamentos, retornos, pontos repetidos e contatos não adjacentes", () => {
  const bad = [
    [
      [0, 0],
      [100, 100],
      [0, 100],
      [100, 0],
    ],
    [
      [0, 0],
      [100, 0],
      [50, 0],
      [50, 100],
    ],
    [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 0],
    ],
    [
      [0, 0],
      [100, 0],
      [100, 100],
      [50, 0],
      [0, 100],
    ],
    [
      [0, 0],
      [100, 0],
      [200, 0],
    ],
    [
      [0.5, 0],
      [100, 0],
      [100, 100],
    ],
    [
      [LIMIT + 1, 0],
      [100, 0],
      [100, 100],
    ],
  ];
  for (const points of bad)
    expect(() => validateTerrainContour(ring(points))).toThrow();
  expect(() =>
    validateTerrainContour(
      Array.from({ length: 257 }, (_, x) => ({ x, y: x })),
    ),
  ).toThrow();
  // A forward collinear intermediate point is valid; a return is not.
  validateTerrainContour(
    ring([
      [0, 0],
      [50, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ]),
  );
  expect(() =>
    validateTerrainContour(
      ring([
        [0, 0],
        [100, 0],
        [50, 0],
      ]),
      false,
    ),
  ).toThrow();
});
it("M11 translação mantém área, material e fase da textura; inválidos não alteram origem", () => {
  const original = terrain();
  const before = structuredClone(original);
  const shifted = translateTerrain(original, { x: -123, y: 456 });
  expect(terrainArea(shifted.contour)).toBe(25);
  expect(shifted.textureOrigin).toEqual({ x: -123, y: 456 });
  expect(shifted.material).toBe(original.material);
  expect(() => translateTerrain(original, { x: LIMIT, y: 0 })).toThrow();
  expect(original).toEqual(before);
  expect(() => validateTerrain({ ...original, revision: 2 as 1 })).toThrow();
});
it("M11 formato 17 conserva terreno e lê 9–16 sem mutação ou campos novos disfarçados", () => {
  const d = fixture();
  d.model.terrain = terrain();
  const text = serializeFile(d).text;
  expect(parseFile(text).model.terrain).toEqual(d.model.terrain);
  expect(importedCopy(d).model.terrain).toEqual(d.model.terrain);
  for (let version = 9; version <= 16; version++) {
    const old = JSON.parse(JSON.stringify(fixture()));
    old.schemaVersion = version;
    delete old.model.terrain;
    if (version === 9) delete old.model.measurements;
    if (version < 11) delete old.model.referenceImages;
    if (version < 13) {
      delete old.model.imageElements;
      delete old.model.customImageAssets;
    }
    const before = JSON.stringify(old);
    expect(validateProject(old).model.terrain).toBeNull();
    expect(validateProject(old).schemaVersion).toBe(17);
    expect(JSON.stringify(old)).toBe(before);
    expect(() =>
      validateProject({ ...old, model: { ...old.model, terrain: null } }),
    ).toThrow(/formato anterior/);
  }
  expect(() =>
    validateProject({
      ...d,
      model: { ...d.model, terrain: { ...d.model.terrain, id: d.project.id } },
    }),
  ).toThrow(/duplicados/);
  expect(() =>
    validateProject({
      ...d,
      model: {
        ...d.model,
        terrain: { ...d.model.terrain, material: "unknown" },
      },
    }),
  ).toThrow();
  expect(() =>
    validateProject({
      ...d,
      model: {
        ...d.model,
        terrain: { ...d.model.terrain, contour: rectangle.slice(0, 2) },
      },
    }),
  ).toThrow();
});
it("M11 terreno global preservado em cópias/remoção e edição da vista de qualquer pavimento", () => {
  let d = fixture();
  d.model.terrain = terrain();
  const first = d.model.floors[0].id;
  d = duplicateFloor(d, first, 28000, "Superior");
  expect(d.model.terrain!.id).toBeDefined();
  const view = engine.floorView(d, d.model.floors[1].id);
  const moved = translateTerrain(view.model.terrain!, { x: 100, y: 0 });
  const merged = mergeFloorView(d, {
    ...view,
    model: { ...view.model, terrain: moved },
  });
  expect(merged.model.terrain).toEqual(moved);
  expect(engine.floorView(merged, first).model.terrain).toEqual(moved);
  expect(removeFloor(merged, first).model.terrain).toEqual(moved);
});
it.each([false, true])(
  "M11 histórico sem motor, rejeição atômica, cancelamento, somente leitura e quota; desatualizado=%s",
  async (stale) => {
    await useStore.getState().open(fixture(), true);
    if (stale) {
      const d = useStore.getState().doc!;
      useStore.setState({
        doc: {
          ...d,
          generated: null,
          generationState: { status: "outdated", diagnostics: [] },
        },
      });
    }
    const original = useStore.getState().doc!;
    const spy = vi.spyOn(engine, "generate");
    const next = {
      ...original,
      model: { ...original.model, terrain: terrain() },
    };
    await useStore.getState().commit(next, "terrain");
    expect(useStore.getState().doc!.generated).toEqual(original.generated);
    expect(useStore.getState().history.past).toHaveLength(1);
    useStore.getState().inspect({ terrainDraft: { points: [{ x: 0, y: 0 }] } });
    await useStore.getState().undo();
    expect(useStore.getState().terrainDraft).toBeNull();
    expect(useStore.getState().doc!.model.terrain).toEqual(next.model.terrain);
    await useStore.getState().undo();
    expect(useStore.getState().doc!.model.terrain).toBeNull();
    await useStore.getState().undo(true);
    expect(useStore.getState().doc!.model.terrain).toEqual(next.model.terrain);
    const confirmed = useStore.getState().doc;
    await useStore.getState().commit(
      {
        ...next,
        model: {
          ...next.model,
          terrain: { ...next.model.terrain!, contour: rectangle.slice(0, 2) },
        },
      },
      "terrain",
    );
    expect(useStore.getState().doc).toBe(confirmed);
    useStore.setState({ readonly: true });
    await useStore.getState().commit(original, "terrain");
    expect(useStore.getState().doc).toBe(confirmed);
    useStore.setState({ readonly: false });
    vi.mocked(saveProject).mockRejectedValueOnce(new Error("quota"));
    await useStore.getState().commit(
      {
        ...next,
        model: {
          ...next.model,
          terrain: { ...next.model.terrain!, material: "sand" },
        },
      },
      "terrain",
    );
    expect(useStore.getState().saved).toBe("error");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    expect(
      parseFile(serializeFile(useStore.getState().doc!).text).model.terrain!
        .material,
    ).toBe("sand");
  },
);
