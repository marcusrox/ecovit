import { beforeEach, expect, it, vi } from "vitest";
vi.mock("../src/persistence/database", () => ({
  saveProject: vi.fn().mockResolvedValue(1),
  loadProject: vi.fn(),
  acquireProject: vi.fn().mockResolvedValue(() => {}),
}));
import {
  createProject,
  LIMIT,
  type CustomImageAsset,
} from "../src/domain/project";
import {
  catalogItem,
  imageCatalog,
  imageCategories,
} from "../src/domain/image-catalog";
import {
  elementCorners,
  elementLocal,
  elementSideHandle,
  resizeElementSide,
  hitImageElement,
  setImageElement,
  snapFurnitureAngle,
  standardElement,
  validateElement,
} from "../src/domain/image-elements";
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
const project = () =>
  createProject("M10", { length: 2500, width: 1250, height: 700 });
const sofa = (d: ReturnType<typeof project>) =>
  standardElement(catalogItem("sofa", 1)!, d.model.floors[0].id);
const asset = (): CustomImageAsset => ({
  id: crypto.randomUUID(),
  name: "custom.png",
  mime: "image/png",
  width: 1,
  height: 1,
  data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==",
});
beforeEach(() => {
  useStore.getState().close();
  vi.mocked(saveProject).mockResolvedValue(1);
  vi.clearAllMocks();
});

it("M10-A01 catálogo tem nove categorias e 59 opções com referências únicas e dimensões genéricas", () => {
  expect(imageCategories).toHaveLength(9);
  expect(imageCatalog).toHaveLength(59);
  expect(new Set(imageCatalog.map((i) => i.id)).size).toBe(59);
  expect(imageCatalog.filter((i) => i.asset === "armario")).toHaveLength(2);
  expect(
    imageCatalog.every(
      (i) =>
        i.width > 0 &&
        i.depth > 0 &&
        Number.isInteger(i.revision) &&
        i.revision > 0,
    ),
  ).toBe(true);
});
it("bloco de contenção insere r2 e conserva r1 em arquivos existentes", () => {
  const d = project();
  const latest = imageCatalog.find((i) => i.id === "bloco-concreto-contencao")!;
  expect(latest.revision).toBe(2);
  for (const revision of [1, 2]) {
    const item = catalogItem(latest.id, revision)!;
    expect(item).toMatchObject({ width: 4000, depth: 2000, revision });
    d.model.imageElements.push(standardElement(item, d.model.floors[0].id));
  }
  expect(catalogItem(latest.id, 3)).toBeUndefined();
  expect(parseFile(serializeFile(d).text).model.imageElements).toEqual(
    d.model.imageElements,
  );
});
it("M10-A04 atração angular cobre os oito múltiplos de 45°, contorno 360/0 e ângulos livres", () => {
  for (const angle of [0, 45, 90, 135, 180, 225, 270, 315]) {
    for (const delta of [-5, -2, 0, 2, 5])
      expect(snapFurnitureAngle(angle + delta)).toBe(angle);
    expect(snapFurnitureAngle(angle + 6)).toBeCloseTo(angle + 6);
  }
  expect(snapFurnitureAngle(359)).toBe(0);
  expect(snapFurnitureAngle(-1)).toBe(0);
  expect(snapFurnitureAngle(-88)).toBe(270);
  expect(snapFurnitureAngle(22.5)).toBe(22.5);
});
it("M10-A04/10 transformação do retângulo rotacionado e seleção respeitam proporção e limites", () => {
  const d = project(),
    e = { ...sofa(d), x: 10000, y: -2000, angle: 90 };
  const corners = elementCorners(e);
  expect(corners[0].x).toBeCloseTo(e.x + e.depth / 2);
  expect(corners[0].y).toBeCloseTo(e.y - e.width / 2);
  expect(elementLocal(e, corners[2]).x).toBeCloseTo(e.width / 2);
  expect(hitImageElement(e, { x: e.x, y: e.y })).toBe(true);
  expect(hitImageElement(e, { x: e.x + e.depth, y: e.y })).toBe(false);
  expect(() =>
    validateElement({ ...e, width: e.width * 2, depth: e.depth * 2 }, []),
  ).not.toThrow();
  for (const bad of [
    { width: 0 },
    { depth: Infinity },
    { angle: 361 },
    { x: LIMIT },
  ])
    expect(() => validateElement({ ...e, ...bad }, [])).toThrow();
});
it("M10-A04 duas alças laterais alteram um eixo local e fixam a aresta oposta, inclusive após giro", () => {
  for (const angle of [0, 45, 90, 135, 270]) {
    for (const axis of ["width", "depth"] as const) {
      const e = { ...sofa(project()), x: -10000, y: 20000, angle };
      const handle = elementSideHandle(e, axis),
        a = (angle * Math.PI) / 180;
      // Movement perpendicular to the active axis must have no effect on its size.
      const u =
        axis === "width"
          ? { x: Math.cos(a), y: Math.sin(a) }
          : { x: -Math.sin(a), y: Math.cos(a) };
      const resized = resizeElementSide(e, axis, {
        x: handle.x + u.x * 4000 - u.y * 2300,
        y: handle.y + u.y * 4000 + u.x * 2300,
      });
      expect(resized[axis]).toBeCloseTo(e[axis] + 4000);
      expect(resized[axis === "width" ? "depth" : "width"]).toBe(
        e[axis === "width" ? "depth" : "width"],
      );
      expect(resized.angle).toBe(angle);
      const before = elementCorners(e),
        after = elementCorners(resized);
      for (const i of axis === "width" ? [0, 3] : [0, 1]) {
        expect(after[i].x).toBeCloseTo(before[i].x);
        expect(after[i].y).toBeCloseTo(before[i].y);
      }
      expect(() => validateElement(resized, [])).not.toThrow();
      const shrunk = resizeElementSide(e, axis, {
        x: handle.x - u.x * 1000,
        y: handle.y - u.y * 1000,
      });
      expect(shrunk[axis]).toBeCloseTo(e[axis] - 1000);
      expect(() =>
        resizeElementSide(e, axis, {
          x: handle.x - u.x * e[axis] * 2,
          y: handle.y - u.y * e[axis] * 2,
        }),
      ).toThrow();
    }
  }
});
it("M10-A07 padrões são referências, uploads reutilizados uma vez e cópia transporta intenção", () => {
  const d = project(),
    a = asset(),
    e = sofa(d);
  d.model.customImageAssets = [a];
  d.model.imageElements = [
    { ...e, depth: e.depth * 1.3 },
    {
      ...e,
      id: crypto.randomUUID(),
      name: "Custom",
      source: { kind: "custom", assetId: a.id },
      width: 10000,
      depth: 7000,
    },
  ];
  d.model.imageElements.push({
    ...d.model.imageElements[1],
    id: crypto.randomUUID(),
    x: 30000,
  });
  const { text } = serializeFile(d),
    copy = parseFile(text);
  expect(copy.model).toEqual(d.model);
  expect(text.split(a.data)).toHaveLength(2);
  expect(copy.model.imageElements[0].source).toEqual({
    kind: "catalog",
    itemId: "sofa",
    revision: 1,
  });
  expect(text).not.toContain("/catalog/");
  expect(text).not.toContain("data:image");
});
it("M10-A08 lê envelope 13 preservando ocorrências e bytes sem modificar a origem", () => {
  const d = project(),
    a = asset();
  d.model.customImageAssets = [a];
  d.model.imageElements = [
    sofa(d),
    {
      ...sofa(d),
      id: crypto.randomUUID(),
      source: { kind: "custom", assetId: a.id },
      width: 1000,
      depth: 1000,
    },
  ];
  const old = { ...d, schemaVersion: 13 },
    original = JSON.stringify(old);
  const restored = validateProject(old);
  expect(restored.schemaVersion).toBe(15);
  expect(restored.model).toEqual(d.model);
  expect(JSON.stringify(old)).toBe(original);
});
it("M10-A06/08 recusa fontes órfãs, padrão desconhecido, IDs repetidos e conteúdo adulterado", () => {
  const d = project(),
    a = asset();
  d.model.customImageAssets = [a];
  d.model.imageElements = [sofa(d)];
  const cases = [
    () => {
      d.model.imageElements[0].source = {
        kind: "catalog",
        itemId: "unknown",
        revision: 1,
      };
    },
    () => {
      d.model.imageElements[0].source = {
        kind: "catalog",
        itemId: "sofa",
        revision: 9,
      };
    },
    () => {
      d.model.imageElements[0].source = {
        kind: "custom",
        assetId: crypto.randomUUID(),
      };
    },
    () => {
      d.model.imageElements[0].floorId = crypto.randomUUID();
    },
    () => {
      d.model.customImageAssets[0].data = "AAAA";
    },
    () => {
      d.model.customImageAssets[0].width = 2;
    },
    () => {
      d.model.customImageAssets[0].id = d.model.imageElements[0].id;
    },
  ];
  for (const change of cases) {
    d.model.customImageAssets = [{ ...a }];
    d.model.imageElements = [sofa(d)];
    change();
    expect(() => validateProject(d)).toThrow();
  }
});
it("M10-A08 leitura 9–12 normaliza coleções vazias sem modificar origem ou aceitar dados disfarçados", () => {
  for (const version of [9, 10, 11, 12]) {
    const d = project(),
      old = JSON.parse(JSON.stringify(d));
    old.schemaVersion = version;
    delete old.model.imageElements;
    delete old.model.customImageAssets;
    if (version < 11) delete old.model.referenceImages;
    if (version === 9) delete old.model.measurements;
    const original = JSON.stringify(old),
      restored = validateProject(old);
    expect(restored.schemaVersion).toBe(15);
    expect(restored.model.imageElements).toEqual([]);
    expect(JSON.stringify(old)).toBe(original);
    old.model.imageElements = [];
    expect(() => validateProject(old)).toThrow(/anterior/);
  }
});
it("M10-A09 cópia/remoção de pavimento e merge preservam recursos e identidades independentes", () => {
  const d = setImageElement(project(), null);
  d.model.imageElements = [sofa(d)];
  const copy = duplicateFloor(d, d.model.floors[0].id, 28000, "Superior"),
    other = copy.model.floors[1].id;
  expect(copy.model.imageElements).toHaveLength(2);
  expect(copy.model.imageElements[1].id).not.toBe(
    copy.model.imageElements[0].id,
  );
  copy.model.imageElements[1].name = "Outro";
  expect(d.model.imageElements[0].name).toBe("Sofá");
  const view = engine.floorView(copy, other);
  expect(view.model.imageElements).toHaveLength(1);
  const merged = mergeFloorView(
    copy,
    setImageElement(view, { ...view.model.imageElements[0], x: 777 }),
  );
  expect(merged.model.imageElements[0]).toEqual(d.model.imageElements[0]);
  expect(removeFloor(merged, other).model.imageElements).toEqual(
    d.model.imageElements,
  );
});
it("M10-A05/11/12 histórico visual preserva resultado atual e desatualizado, falha de quota e readonly", async () => {
  await useStore.getState().open(project(), true);
  const current = useStore.getState().doc!,
    result = current.generated;
  const spy = vi.spyOn(engine, "generate");
  spy.mockClear();
  const e = sofa(current);
  await useStore.getState().commit(setImageElement(current, e), "furniture");
  expect(spy).not.toHaveBeenCalled();
  expect(useStore.getState().doc!.generated).toEqual(result);
  await useStore.getState().undo();
  expect(useStore.getState().doc!.model.imageElements).toEqual([]);
  await useStore.getState().undo(true);
  expect(useStore.getState().doc!.model.imageElements).toEqual([e]);
  const stale = {
    ...useStore.getState().doc!,
    generated: null,
    generationState: { status: "outdated" as const, diagnostics: [] },
  };
  useStore.setState({ doc: stale });
  vi.mocked(saveProject).mockRejectedValueOnce(new Error("quota"));
  await useStore
    .getState()
    .commit(setImageElement(stale, { ...e, x: 1000 }), "furniture");
  expect(useStore.getState().saved).toBe("error");
  expect(useStore.getState().doc!.generated).toBeNull();
  expect(
    parseFile(serializeFile(useStore.getState().doc!).text).model
      .imageElements[0].x,
  ).toBe(1000);
  expect(spy).not.toHaveBeenCalled();
  spy.mockRestore();
  const before = useStore.getState().doc;
  useStore.setState({ readonly: true });
  await useStore
    .getState()
    .commit(setImageElement(before!, null, e.id), "furniture");
  expect(useStore.getState().doc).toBe(before);
});

it.each([
  [false, false],
  [true, false],
  [false, true],
  [true, true],
])(
  "espelhamento X=%s/Y=%s conserva geometria, bytes, cópias e transporte",
  (flipX, flipY) => {
    const d = project(),
      a = asset();
    d.model.customImageAssets = [a];
    const original = {
      ...sofa(d),
      x: 12345,
      y: -6789,
      width: 18500,
      depth: 9100,
      angle: 37,
    };
    d.model.imageElements = [
      { ...original, flipX, flipY },
      {
        ...original,
        id: crypto.randomUUID(),
        source: { kind: "custom", assetId: a.id },
        flipX,
        flipY,
      },
    ];
    for (const element of d.model.imageElements) {
      expect(elementCorners(element)).toEqual(elementCorners(original));
      expect(hitImageElement(element, { x: original.x, y: original.y })).toBe(
        true,
      );
    }
    const decoded = parseFile(serializeFile(d).text);
    expect(decoded.model).toEqual(d.model);
    expect(decoded.schemaVersion).toBe(15);
    expect(importedCopy(decoded).model).toEqual(d.model);
    const floors = duplicateFloor(
      decoded,
      decoded.model.floors[0].id,
      28000,
      "Superior",
    );
    expect(
      floors.model.imageElements
        .slice(2)
        .every((e) => e.flipX === flipX && e.flipY === flipY),
    ).toBe(true);
    expect(floors.model.customImageAssets).toEqual([a]);
  },
);

it("formato 14 mantém a aparência sem espelhamento; campos novos disfarçados e flags inválidas são recusados", () => {
  const d = project();
  d.model.imageElements = [sofa(d)];
  const old = { ...d, schemaVersion: 14 },
    before = JSON.stringify(old);
  const decoded = validateProject(old);
  expect(decoded.schemaVersion).toBe(15);
  expect(decoded.model).toEqual(d.model);
  expect(JSON.stringify(old)).toBe(before);
  for (const flag of [true, false, "true", 1, null]) {
    const bad = {
      ...old,
      model: { ...old.model, imageElements: [{ ...sofa(d), flipX: flag }] },
    };
    expect(() => validateProject(bad)).toThrow(/anterior/);
  }
  for (const axis of ["flipX", "flipY"])
    for (const flag of ["true", 1, null]) {
      expect(() =>
        validateProject({
          ...d,
          model: { ...d.model, imageElements: [{ ...sofa(d), [axis]: flag }] },
        }),
      ).toThrow();
    }
});

it.each([false, true])(
  "espelhar integra histórico sem calcular; desatualizado=%s",
  async (stale) => {
    await useStore.getState().open(project(), true);
    const initial = useStore.getState().doc!,
      e = sofa(initial);
    await useStore.getState().commit(setImageElement(initial, e), "furniture");
    if (stale)
      useStore.setState({
        doc: {
          ...useStore.getState().doc!,
          generated: null,
          generationState: { status: "outdated", diagnostics: [] },
        },
      });
    const before = useStore.getState().doc!;
    const spy = vi.spyOn(engine, "generate");
    spy.mockClear();
    await useStore
      .getState()
      .commit(
        setImageElement(before, { ...e, flipX: true, flipY: true }),
        "furniture",
      );
    expect(useStore.getState().doc!.generated).toEqual(before.generated);
    await useStore.getState().undo();
    expect(useStore.getState().doc!.model.imageElements).toEqual([e]);
    await useStore.getState().undo(true);
    expect(useStore.getState().doc!.model.imageElements[0]).toMatchObject({
      flipX: true,
      flipY: true,
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  },
);
