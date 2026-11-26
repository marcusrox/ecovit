import { CURRENT_PROJECT_FORMAT } from "../src/domain/project-format";
import { expect, it } from "vitest";
import { createProject, makeWall } from "../src/domain/project";
import { addFloor } from "../src/domain/floors";
import { generate } from "../src/domain/composition";
import { surfaceBudget, parseSurfaceField } from "../src/domain/surface-budget";
import { assignedAreaScale } from "../src/domain/settlement-budget";
import {
  incorporatePrices,
  withProjectPrice,
  priceSource,
  type PriceItem,
} from "../src/domain/price-references";
import {
  parseFile,
  serializeFile,
  validateProject,
  importedCopy,
} from "../src/persistence/document";

function fixture(areas = [100]) {
  let doc = createProject(
    "Acabamento",
    { length: 2000, width: 1000, height: 1000 },
    10000,
  );
  doc.project.channelLevels = [];
  for (let i = 1; i < areas.length; i++)
    doc = addFloor(doc, {
      name: `P${i}`,
      level: i * 20000,
      defaultHeight: 10000,
    });
  doc.model.walls = areas.flatMap((area, i) =>
    area
      ? [
          makeWall(
            { x: 0, y: 0 },
            { x: area * 10000, y: 0 },
            1000,
            doc.model.floors[i].id,
            10000,
            1,
          )!,
        ]
      : [],
  );
  doc.generated = generate(doc);
  doc.generationState = {
    status: "current",
    diagnostics: doc.generated.diagnostics,
  };
  return doc;
}
it("T-040: duas faces, percentuais independentes, compra global e exemplos de custo", () => {
  const doc = fixture();
  doc.project.surface = {
    waterproofing: { percent: 5000, yield: 30000, price: 15000 },
    jointing: { percent: 4500, yield: 20000, price: 8000 },
  };
  const before = structuredClone(doc),
    report = surfaceBudget(doc);
  expect(report.rows).toMatchObject([
    { area: 100n * assignedAreaScale, packages: 4, cost: 60000 },
    { area: 90n * assignedAreaScale, packages: 5, cost: 40000 },
  ]);
  expect(doc).toEqual(before);
});
it("T-040: consolida antes de arredondar e concilia rateio, inclusive centavos e pavimento vazio", () => {
  const doc = fixture([5, 10]);
  doc.project.surface = {
    waterproofing: { percent: 10000, yield: 30000, price: 15000 },
  };
  let report = surfaceBudget(doc);
  expect(report.rows[0]).toMatchObject({ packages: 1, cost: 15000 });
  expect(report.floors.map((f) => f.rows[0].cost)).toEqual([5000, 10000]);
  const ties = fixture([1, 1, 1, 0]);
  ties.project.surface = {
    jointing: { percent: 10000, yield: 100000, price: 1 },
  };
  report = surfaceBudget(ties);
  expect(report.floors.map((f) => f.rows[1].cost)).toEqual([1, 0, 0, 0]);
});
it("T-040: zero dispensa parâmetros; área indisponível e entradas inválidas não viram zero", () => {
  const doc = fixture();
  doc.generationState.status = "outdated";
  expect(surfaceBudget(doc).rows.every((r) => r.cost === 0)).toBe(true);
  doc.project.surface = { jointing: { percent: 1000 } };
  expect(surfaceBudget(doc).rows[1].cost).toBeUndefined();
  expect(surfaceBudget(doc).rows[1].area).toBeUndefined();
  expect(
    surfaceBudget(doc, false, { waterproofing: { percent: "Inválido" } })
      .rows[0].cost,
  ).toBeUndefined();
  const valid = fixture();
  valid.project.surface = { jointing: { percent: 100, yield: 1000 } };
  expect(surfaceBudget(valid).rows[1]).toMatchObject({ packages: 2 });
  expect(surfaceBudget(valid).rows[1].cost).toBeUndefined();
  expect(
    surfaceBudget(valid, false, { jointing: { yield: "Inválido" } }).rows[1]
      .packages,
  ).toBeUndefined();
  valid.project.surface.jointing!.price = 0;
  expect(surfaceBudget(valid).rows[1].cost).toBe(0);
  valid.project.surface.jointing!.yield = 1;
  valid.project.surface.jointing!.price = Number.MAX_SAFE_INTEGER;
  expect(surfaceBudget(valid).rows[1].cost).toBeUndefined();
});
it("T-040: preserva descrição e origem sem vínculo futuro, permite próprio/limpeza e transporta formato 37", () => {
  const item: PriceItem = { group: "surface", key: "jointing" };
  const reference = {
    item,
    price: 8000,
    description: "Rejunte escolhido · saco de 5 kg",
  };
  const original = fixture();
  const doc = incorporatePrices(original, [reference]);
  expect(doc.project.surface?.jointing?.referenceDescription).toBe(
    reference.description,
  );
  expect(
    incorporatePrices(doc, [
      { ...reference, description: "Outro · 10 kg", price: 9000 },
    ]),
  ).toBe(doc);
  const restored = parseFile(serializeFile(doc).text);
  expect(restored.schemaVersion).toBe(CURRENT_PROJECT_FORMAT);
  expect(importedCopy(restored).project.surface).toEqual(doc.project.surface);
  const own = withProjectPrice(restored, item, 8000);
  expect(own.project.surface?.jointing?.referenceDescription).toBeUndefined();
  expect(own.project.surface?.jointing?.productDescription).toBe(
    reference.description,
  );
  expect(priceSource(own, item)).toBe("own");
  const cleared = withProjectPrice(doc, item, undefined);
  expect(cleared.project.surface?.jointing?.productDescription).toBe(
    reference.description,
  );
  expect(incorporatePrices(cleared, [reference])).toBe(cleared);
  expect(() => validateProject({ ...doc, schemaVersion: 35 }, false)).toThrow(
    /formato anterior/,
  );
  expect(
    validateProject({ ...original, schemaVersion: 35 }, false).schemaVersion,
  ).toBe(CURRENT_PROJECT_FORMAT);
  const invalid = structuredClone(doc);
  delete invalid.project.surface!.jointing!.referenceDescription;
  expect(() => validateProject(invalid, false)).toThrow(/inconsistente/);
});
it("descrição do produto é editável e preservada no arquivo; copiar referência substitui a descrição própria", () => {
  const item: PriceItem = { group: "surface", key: "waterproofing" };
  const description = "Produto próprio · embalagem de 5 L";
  const doc = fixture();
  doc.project.surface = { waterproofing: { productDescription: description } };
  expect(
    validateProject(doc, false).project.surface?.waterproofing
      ?.productDescription,
  ).toBe(description);
  expect(() => validateProject({ ...doc, schemaVersion: 36 }, false)).toThrow(
    /formato anterior/,
  );
  const priced = withProjectPrice(doc, item, 100);
  expect(priced.project.surface?.waterproofing?.productDescription).toBe(
    description,
  );
  const captured = withProjectPrice(
    priced,
    item,
    100,
    "reference",
    "Referência · 18 L",
  );
  captured.project.surface!.waterproofing!.productDescription =
    "Outra descrição";
  expect(
    withProjectPrice(captured, item, 100, "reference", "Referência · 18 L")
      .project.surface?.waterproofing?.productDescription,
  ).toBe("Referência · 18 L");
  const restored = parseFile(serializeFile(priced).text);
  expect(restored.project.surface?.waterproofing?.productDescription).toBe(
    description,
  );
});
it("T-040: parsing respeita precisão e permite limpar rendimento", () => {
  expect(parseSurfaceField("yield", "12,345")).toBe(12345);
  expect(parseSurfaceField("percent", "45,25")).toBe(4525);
  expect(parseSurfaceField("yield", "")).toBeUndefined();
  for (const raw of ["0", "-1", "1.0001", "1e3"])
    expect(() => parseSurfaceField("yield", raw)).toThrow();
  expect(() => parseSurfaceField("percent", "100,01")).toThrow();
});
