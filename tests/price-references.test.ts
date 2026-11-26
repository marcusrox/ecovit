import { expect, it } from "vitest";
import { createProject, makeWall } from "../src/domain/project";
import { openingOption } from "../src/domain/opening-budget";
import {
  fixedPriceItems,
  priceItemKey,
  priceItemSchema,
  priceSource,
  projectPrice,
  projectPriceItems,
  withProjectPrice,
  incorporatePrices,
  type PriceItem,
} from "../src/domain/price-references";
import {
  validateProject,
  parseFile,
  serializeFile,
  importedCopy,
} from "../src/persistence/document";
const brick: PriceItem = { group: "bricks", key: "whole" };
const steel: PriceItem = { group: "steel", key: "ca50-8" };
const settlement: PriceItem = { group: "settlement", key: "ac1" };
function fixture() {
  const doc = createProject(
    "Referências",
    { length: 2500, width: 1250, height: 700 },
    28000,
  );
  doc.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      { x: 40000, y: 0 },
      1250,
      doc.model.floors[0].id,
      28000,
      1,
    )!,
  ];
  doc.model.openings = [
    {
      id: crypto.randomUUID(),
      wallId: doc.model.walls[0].id,
      kind: "door",
      offset: 2500,
      width: 5000,
      base: 0,
      height: 21000,
      appearance: { type: "swing", orientation: 0 },
      material: { kind: "wood-solid" },
    },
  ];
  return doc;
}
it("incorpora por item nos quatro grupos, conserva preços próprios e zero e não muda a origem", () => {
  const doc = fixture();
  doc.project.unitPrices = { whole: 0 };
  const before = structuredClone(doc),
    opening = projectPriceItems(doc).find((i) => i.group === "openings")!;
  const refs = [
    { item: brick, price: 100 },
    { item: steel, price: 500 },
    { item: settlement, price: 3000 },
    { item: opening, price: 12345 },
  ];
  const next = incorporatePrices(doc, refs);
  expect(projectPrice(next, brick)).toBe(0);
  expect(priceSource(next, brick)).toBe("own");
  for (const r of refs.slice(1)) {
    expect(projectPrice(next, r.item)).toBe(r.price);
    expect(priceSource(next, r.item)).toBe("reference");
  }
  expect(doc).toEqual(before);
  expect(next.generated).toBe(doc.generated);
  expect(
    incorporatePrices(
      next,
      refs.map((r) => ({ ...r, price: 99999 })),
    ),
  ).toBe(next);
});
it("limpeza é distinta de ausência e o uso manual pode recuperá-la sem vínculo futuro", () => {
  const doc = fixture(),
    reference = [{ item: brick, price: 100 }];
  const cleared = withProjectPrice(doc, brick, undefined);
  expect(priceSource(cleared, brick)).toBe("cleared");
  expect(incorporatePrices(cleared, reference)).toBe(cleared);
  const restored = withProjectPrice(cleared, brick, 200, "reference");
  expect(projectPrice(restored, brick)).toBe(200);
  expect(withProjectPrice(restored, brick, 200, "reference")).toBe(restored);
  const own = withProjectPrice(restored, brick, 200);
  expect(priceSource(own, brick)).toBe("own");
  expect(own).not.toBe(restored);
  expect(incorporatePrices(own, reference)).toBe(own);
});
it("ausência de referência mantém elegibilidade; valores inexistentes de esquadrias não entram", () => {
  const doc = fixture();
  expect(incorporatePrices(doc, [{ item: brick, price: null }])).toBe(doc);
  const fake = priceItemSchema.parse({
    group: "openings",
    option: { ...openingOption(doc.model.openings[0]), width: 7500 },
  });
  expect(incorporatePrices(doc, [{ item: fake, price: 100 }])).toBe(doc);
  expect(projectPriceItems(doc)).toHaveLength(fixedPriceItems.length + 1);
  const next = incorporatePrices(doc, [{ item: brick, price: 0 }]);
  expect(projectPrice(next, brick)).toBe(0);
  expect(priceSource(next, brick)).toBe("reference");
});
it("combinações de esquadrias usam identidade normalizada e não orientação ou posição", () => {
  const doc = fixture();
  doc.model.openings[0].material = { kind: "other", description: " Madeira " };
  doc.model.openings.push({
    ...doc.model.openings[0],
    id: crypto.randomUUID(),
    offset: 15000,
    appearance: { type: "swing", orientation: 1 },
    material: { kind: "other", description: "madeira" },
  });
  expect(
    projectPriceItems(doc).filter((i) => i.group === "openings"),
  ).toHaveLength(1);
  expect(priceItemKey(projectPriceItems(doc).at(-1)!)).toContain("madeira");
});
it("arquivo, cópia e leitor preservam estado e preço; legado não recebe metadados inventados", () => {
  let doc = fixture();
  for (const item of [brick, steel, settlement, projectPriceItems(doc).at(-1)!])
    doc = withProjectPrice(
      doc,
      item,
      item === steel ? undefined : 100,
      "reference",
    );
  const text = serializeFile(doc).text;
  expect(parseFile(text).project.priceSources).toEqual(
    doc.project.priceSources,
  );
  expect(importedCopy(parseFile(text)).project.priceSources).toEqual(
    doc.project.priceSources,
  );
  const legacy = fixture();
  legacy.project.unitPrices = { whole: 0 };
  const old = { ...legacy, schemaVersion: 33 };
  const loaded = validateProject(old, false);
  expect(loaded.schemaVersion).toBe(35);
  expect(loaded.project.priceSources).toBeUndefined();
  expect(priceSource(loaded, brick)).toBe("own");
  expect(old.schemaVersion).toBe(33);
});
it("recusa estados inconsistentes, duplicados, identidades inválidas e campos novos em legado", () => {
  const doc = withProjectPrice(fixture(), brick, 100, "reference");
  expect(() => validateProject({ ...doc, schemaVersion: 33 }, false)).toThrow(
    /formato anterior/,
  );
  const inconsistent = structuredClone(doc);
  inconsistent.project.priceSources![0].source = "cleared";
  expect(() => validateProject(inconsistent, false)).toThrow(/inconsistente/);
  const duplicate = structuredClone(doc);
  duplicate.project.priceSources!.push(duplicate.project.priceSources![0]);
  expect(() => validateProject(duplicate, false)).toThrow();
  expect(
    priceItemSchema.safeParse({ group: "steel", key: "unknown" }).success,
  ).toBe(false);
  expect(() => withProjectPrice(doc, brick, -1)).toThrow();
});
