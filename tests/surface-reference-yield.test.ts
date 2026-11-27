import { it, expect } from "vitest";
import { createProject } from "../src/domain/project";
import {
  incorporatePrices,
  withProjectPrice,
  type PriceReference,
} from "../src/domain/price-references";
import {
  serializeFile,
  parseFile,
  importedCopy,
} from "../src/persistence/document";

it.each(["waterproofing", "wallBase", "slabs", "jointing"] as const)(
  "referência completa de %s transporta produto, embalagem, rendimento e preço juntos",
  (key) => {
    const doc = createProject(
      "Referência",
      { length: 2500, width: 1250, height: 700 },
      2100,
    );
    const item = { group: "surface" as const, key };
    const reference: PriceReference = {
      item,
      price: 0,
      description: "Produto A · balde de 18 L",
      yield: 12345,
    };
    const captured = incorporatePrices(doc, [reference]);
    expect(captured.project.surface?.[key]).toEqual({
      price: 0,
      referenceDescription: reference.description,
      productDescription: reference.description,
      yield: 12345,
    });
    expect(captured.generated).toBe(doc.generated);
    expect(incorporatePrices(captured, [{ ...reference, yield: 20000 }])).toBe(
      captured,
    );
    const copied = withProjectPrice(
      captured,
      item,
      0,
      "reference",
      reference.description,
      20000,
    );
    expect(copied.project.surface?.[key]?.yield).toBe(20000);
    expect(
      withProjectPrice(
        copied,
        item,
        0,
        "reference",
        reference.description,
        20000,
      ),
    ).toBe(copied);
    expect(parseFile(serializeFile(copied).text).project.surface).toEqual(
      copied.project.surface,
    );
    expect(importedCopy(copied).project.surface).toEqual(
      copied.project.surface,
    );
    expect(() =>
      withProjectPrice(doc, item, 100, "reference", reference.description),
    ).toThrow();
    const cleared = withProjectPrice(copied, item, undefined);
    expect(cleared.project.surface?.[key]?.yield).toBe(20000);
    expect(incorporatePrices(cleared, [reference])).toBe(cleared);
  },
);

it("referências antigas incompletas permanecem sem incorporação e valores próprios são preservados", () => {
  const doc = createProject(
    "Referência antiga",
    { length: 2500, width: 1250, height: 700 },
    2100,
  );
  const reference: PriceReference = {
    item: { group: "surface", key: "jointing" },
    price: 1200,
    description: "Rejunte · 5 kg",
  };
  expect(incorporatePrices(doc, [reference])).toBe(doc);
  const complete = { ...reference, yield: 10000 };
  for (const settings of [
    { yield: 5000 },
    { productDescription: "Produto próprio" },
    { productDescription: "" },
    { price: 0 },
  ]) {
    const own = {
      ...doc,
      project: { ...doc.project, surface: { jointing: settings } },
    };
    expect(incorporatePrices(own, [complete])).toBe(own);
  }
  const legacy = {
    ...doc,
    project: {
      ...doc.project,
      surface: {
        jointing: { price: 1200, referenceDescription: reference.description },
      },
      priceSources: [{ item: reference.item, source: "reference" as const }],
    },
  };
  expect(
    parseFile(serializeFile(legacy).text).project.surface?.jointing?.yield,
  ).toBeUndefined();
  expect(incorporatePrices(legacy, [complete])).toBe(legacy);
});
