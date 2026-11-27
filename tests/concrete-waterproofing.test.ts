import { expect, it } from "vitest";
import { createProject, type Project } from "../src/domain/project";
import { surfaceBudget, concreteAreaScale } from "../src/domain/surface-budget";
import { duplicateFloor, removeFloor } from "../src/domain/floors";
import {
  validateProject,
  importedCopy,
  parseFile,
  serializeFile,
} from "../src/persistence/document";
import {
  incorporatePrices,
  withProjectPrice,
  priceSource,
} from "../src/domain/price-references";
import { renderBudgetMarkup } from "../src/app/budget-report/model";

const ring = (x: number, y: number, width: number, height: number) => [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
];
export function concreteFixture(): Project {
  const doc = createProject(
    "Concreto",
    { length: 3000, width: 1500, height: 1000 },
    1000,
  );
  doc.model.floors.push({
    ...doc.model.floors[0],
    id: crypto.randomUUID(),
    name: "Superior",
    level: 30000,
  });
  doc.model.floors.forEach(
    (f, i) => (f.waterproofingPercent = i ? 5000 : 6000),
  );
  doc.model.walls = [1000000, 400000].map((distance, i) => ({
    id: crypto.randomUUID(),
    floorId: doc.model.floors[i].id,
    a: { x: 0, y: 0 },
    b: { x: distance, y: 0 },
    side: 1,
    height: 1000,
  }));
  doc.model.slabs = [
    {
      id: crypto.randomUUID(),
      floorId: doc.model.floors[0].id,
      thickness: 1000,
      contour: ring(0, 0, 100000, 100000),
      openings: [
        { id: crypto.randomUUID(), contour: ring(10000, 10000, 40000, 50000) },
      ],
      waterproofingPercent: 5000,
    },
    {
      id: crypto.randomUUID(),
      floorId: doc.model.floors[1].id,
      thickness: 1000,
      contour: ring(0, 0, 50000, 60000),
      openings: [],
      waterproofingPercent: 0,
    },
  ];
  doc.project.surface = {
    wallBase: { yield: 10000, price: 10000, productDescription: "Base · lata" },
    slabs: { yield: 30000, price: 15000, productDescription: "Laje · balde" },
  };
  return doc;
}

it("T-042 calcula os exemplos sem descontar vãos nas bases, sem margem nas lajes e com compras separadas", () => {
  const doc = concreteFixture();
  doc.model.openings = [
    {
      id: crypto.randomUUID(),
      wallId: doc.model.walls[0].id,
      kind: "door",
      offset: 0,
      width: 10000,
      base: 0,
      height: 1000,
    },
  ];
  const before = structuredClone(doc);
  const report = surfaceBudget(doc);
  expect(report.rows.slice(2)).toEqual([
    {
      key: "wallBase",
      area: 18n * concreteAreaScale,
      packages: 2,
      cost: 20000,
    },
    { key: "slabs", area: 40n * concreteAreaScale, packages: 2, cost: 30000 },
  ]);
  expect(report.applications.map((e) => e.area)).toEqual([
    (135n * concreteAreaScale) / 10n,
    (45n * concreteAreaScale) / 10n,
    40n * concreteAreaScale,
    0n,
  ]);
  expect(report.floors.map((f) => f.rows[2].cost)).toEqual([15000, 5000]);
  expect(doc).toEqual(before);
});

it("T-042 preserva frações exatas, zero, erros independentes e compra conhecida sem preço", () => {
  const doc = concreteFixture();
  doc.project.base.width = 1251;
  doc.model.walls[0].b.x = 1251;
  doc.model.floors[0].waterproofingPercent = 1;
  doc.model.floors[1].waterproofingPercent = 0;
  expect(surfaceBudget(doc).rows[2].area).toBe(4695003n);
  doc.model.floors.forEach((f) => (f.waterproofingPercent = 0));
  doc.model.slabs = [];
  doc.project.surface = {};
  expect(
    surfaceBudget(doc, true)
      .rows.slice(2)
      .map((r) => r.cost),
  ).toEqual([0, 0]);
  doc.model.floors[0].waterproofingPercent = 10000;
  expect(surfaceBudget(doc, true).rows[2].area).toBeUndefined();
  doc.project.surface.wallBase = { yield: 1000 };
  expect(surfaceBudget(doc).rows[2]).toMatchObject({
    packages: 1,
    errorField: "price",
  });
  expect(
    surfaceBudget(doc, false, {
      wallBase: { [`percent:${doc.model.floors[0].id}`]: "Inválido" },
    }).rows[2],
  ).toMatchObject({ errorField: `percent:${doc.model.floors[0].id}` });
  const unavailable = surfaceBudget(doc, false, {
    wallBase: { [`percent:${doc.model.floors[0].id}`]: "Inválido" },
  });
  expect(unavailable.applications[1]).toMatchObject({ area: 0n, cost: 0 });
  expect(unavailable.floors[1].rows[2]).toMatchObject({ area: 0n, cost: 0 });
  doc.project.surface.wallBase = { yield: 1, price: Number.MAX_SAFE_INTEGER };
  doc.model.walls[0].b.x = 1000000;
  expect(surfaceBudget(doc).rows[2].cost).toBeUndefined();
});

it("T-042 contrato de formatos: transporte, legados e cópia de pavimento preservam vínculos e rejeitam versão incorreta", () => {
  const doc = concreteFixture();
  doc.project.base = { length: 2000, width: 1000, height: 1000 };
  const restored = parseFile(serializeFile(doc).text);
  expect(restored.project.surface).toEqual(doc.project.surface);
  expect(restored.model.floors.map((f) => f.waterproofingPercent)).toEqual([
    6000, 5000,
  ]);
  expect(restored.model.slabs.map((s) => s.waterproofingPercent)).toEqual([
    5000, 0,
  ]);
  const copy = importedCopy(restored);
  copy.model.floors[0].waterproofingPercent = 0;
  copy.project.surface!.wallBase!.price = 0;
  expect(restored.model.floors[0].waterproofingPercent).toBe(6000);
  expect(restored.project.surface!.wallBase!.price).toBe(10000);
  const duplicated = duplicateFloor(
    restored,
    restored.model.floors[0].id,
    60000,
    "Cópia",
  );
  expect(duplicated.model.floors[2].waterproofingPercent).toBe(6000);
  const slab = duplicated.model.slabs.find(
    (s) => s.floorId === duplicated.model.floors[2].id,
  )!;
  expect(slab.waterproofingPercent).toBe(5000);
  expect(slab.id).not.toBe(restored.model.slabs[0].id);
  expect(
    validateProject(
      removeFloor(duplicated, duplicated.model.floors[2].id),
      false,
    ).model.slabs,
  ).toHaveLength(2);
  expect(() => validateProject({ ...doc, schemaVersion: 37 }, false)).toThrow(
    /formato anterior/,
  );
  const legacy = createProject("Legado", doc.project.base, 1000);
  expect(
    surfaceBudget(validateProject({ ...legacy, schemaVersion: 37 }, false))
      .rows.slice(2)
      .map((r) => r.cost),
  ).toEqual([0, 0]);
  const invalid = structuredClone(doc);
  invalid.model.slabs[0].waterproofingPercent = 10001;
  expect(() => validateProject(invalid, false)).toThrow();
});

it("T-042 captura referências independentes, conserva limpeza/zero e inclui produtos e áreas no relatório compartilhado", () => {
  let doc = concreteFixture();
  doc.project.surface = {};
  doc = incorporatePrices(doc, [
    {
      item: { group: "surface", key: "wallBase" },
      price: 0,
      description: "Base A · lata",
      yield: 10000,
    },
    {
      item: { group: "surface", key: "slabs" },
      price: 15000,
      description: "Laje B · balde",
      yield: 30000,
    },
  ]);
  const cleared = withProjectPrice(
    doc,
    { group: "surface", key: "slabs" },
    undefined,
  );
  expect(priceSource(cleared, { group: "surface", key: "slabs" })).toBe(
    "cleared",
  );
  expect(cleared.project.surface!.slabs!.productDescription).toBe(
    "Laje B · balde",
  );
  const next = incorporatePrices(cleared, [
    {
      item: { group: "surface", key: "wallBase" },
      price: 900,
      description: "Outro",
    },
    {
      item: { group: "surface", key: "slabs" },
      price: 800,
      description: "Outro",
    },
  ]);
  expect(next.project.surface!.wallBase!.price).toBe(0);
  expect(next.project.surface!.slabs!.price).toBeUndefined();
  doc.project.surface!.wallBase!.yield = 10000;
  doc.project.surface!.slabs!.yield = 30000;
  const before = structuredClone(doc);
  const markup = renderBudgetMarkup(doc);
  expect(markup).toContain("Impermeabilização de base de paredes e lajes");
  expect(markup).toContain("Base A · lata");
  expect(markup).toContain("Laje B · balde");
  expect(markup).toContain("13,5 m²");
  expect(markup).toContain("40 m²");
  expect(doc).toEqual(before);
});
