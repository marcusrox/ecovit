import { expect, it } from "vitest";
import { parseUnitPrice, budgetCosts, money } from "../src/domain/budget";
import { estimateLosses, type Counts } from "../src/domain/quantities";
import {
  createProject,
  makeWall,
  defaultGroutSettings,
} from "../src/domain/project";
import { generate } from "../src/domain/composition";
import { addFloor, duplicateFloor, removeFloor } from "../src/domain/floors";
import {
  importedCopy,
  parseFile,
  serializeFile,
  validateProject,
} from "../src/persistence/files";
import { dehydrate, hydrate } from "../src/persistence/remote-document";

const counts: Counts = {
  whole: 10,
  half: 4,
  channel: 0,
  "half-channel": 0,
  total: 14,
};
it("A02 custos literais sobre total estimado com e sem perdas", () => {
  const prices = { whole: 250, half: 120 };
  expect(budgetCosts(counts, prices)).toEqual({
    costs: { whole: 2500, half: 480, channel: 0, "half-channel": 0 },
    total: 2980,
  });
  expect(budgetCosts(estimateLosses(counts, 1000).estimated, prices)).toEqual({
    costs: { whole: 2750, half: 600, channel: 0, "half-channel": 0 },
    total: 3350,
  });
  expect(money(3350)).toBe("R$ 33,50");
});
it("A03 preços ausentes, zero explícito e tipos sem peças não se confundem", () => {
  expect(parseUnitPrice("")).toBeUndefined();
  expect(parseUnitPrice("  ")).toBeUndefined();
  expect(parseUnitPrice("0")).toBe(0);
  expect(parseUnitPrice("2,50")).toBe(250);
  expect(parseUnitPrice("1.2")).toBe(120);
  expect(budgetCosts(counts, { whole: 0 }).total).toBeUndefined();
  expect(budgetCosts(counts, { whole: 0, half: 0 }).total).toBe(0);
  expect(
    budgetCosts({ ...counts, whole: 0, half: 0, total: 0 }, {}).total,
  ).toBe(0);
});
it("A03 valida entrada, custo e soma sem imprecisão de ponto flutuante", () => {
  for (const text of [
    "-1",
    "+1",
    "0,001",
    "1e3",
    "NaN",
    "Infinity",
    "1.000,00",
    "90071992547409.92",
  ])
    expect(() => parseUnitPrice(text)).toThrow();
  expect(parseUnitPrice("90071992547409.91")).toBe(Number.MAX_SAFE_INTEGER);
  expect(money(Number.MAX_SAFE_INTEGER)).toBe("R$ 90.071.992.547.409,91");
  expect(
    budgetCosts({ ...counts, whole: 3, half: 0, total: 3 }, { whole: 10 })
      .total,
  ).toBe(30);
  expect(() =>
    budgetCosts(counts, { whole: Number.MAX_SAFE_INTEGER, half: 0 }),
  ).toThrow("Custo");
  expect(() =>
    budgetCosts(
      { ...counts, whole: 1, half: 1, total: 2 },
      { whole: Number.MAX_SAFE_INTEGER, half: 1 },
    ),
  ).toThrow("Total");
  expect(() => budgetCosts(counts, { whole: 0.1 })).toThrow("Preço");
});
it("A04 preços são transportados e copiados sem mudar geometria ou resultado", () => {
  let doc = createProject("Orçamento", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  doc.project.channelLevels = [];
  doc.project.groutSettings = defaultGroutSettings(false);
  doc.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      { x: 10000, y: 0 },
      1250,
      doc.model.floors[0].id,
      2100,
      1,
    )!,
  ];
  doc.generated = generate(doc);
  doc.generationState = {
    status: "current",
    diagnostics: doc.generated.diagnostics,
  };
  const before = structuredClone(doc.generated);
  doc.project.unitPrices = { whole: 250, half: 120, channel: 0 };
  expect(generate(doc)).toEqual(before);
  expect(parseFile(serializeFile(doc).text)).toEqual(doc);
  expect(importedCopy(doc).project.unitPrices).toEqual(doc.project.unitPrices);
  expect(hydrate(dehydrate(doc, {}), {}).project.unitPrices).toEqual(
    doc.project.unitPrices,
  );
  const first = doc.model.floors[0].id;
  doc = duplicateFloor(doc, first, 28000, "Superior");
  doc = addFloor(doc, { name: "Novo", level: 56000, defaultHeight: 28000 });
  doc = removeFloor(doc, first);
  expect(doc.project.unitPrices).toEqual({ whole: 250, half: 120, channel: 0 });
});
it("A04 leitor normaliza 21 sem preço e recusa preços inválidos ou disfarçados em versões anteriores", () => {
  const doc = createProject("Anterior", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  const old = { ...doc, schemaVersion: 21 },
    source = JSON.stringify(old);
  const restored = validateProject(old);
  expect(restored.schemaVersion).toBe(30);
  expect(restored.project.unitPrices).toBeUndefined();
  expect(JSON.stringify(old)).toBe(source);
  expect(() =>
    validateProject({ ...old, project: { ...old.project, unitPrices: {} } }),
  ).toThrow("anterior");
  for (const prices of [
    { whole: -1 },
    { whole: 0.1 },
    { whole: null },
    { whole: Number.MAX_SAFE_INTEGER + 1 },
    { other: 10 },
    null,
  ])
    expect(() =>
      validateProject({
        ...doc,
        project: { ...doc.project, unitPrices: prices },
      }),
    ).toThrow("estrutura");
});

it("perdas persistidas: arquivo, cópias e legado preservam o percentual sem inferir valores", () => {
  const doc = createProject("Perdas", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  const legacy = { ...doc, schemaVersion: 27 };
  const restored = validateProject(legacy);
  expect(restored.schemaVersion).toBe(30);
  expect(restored.project.brickLossPercent).toBeUndefined();
  expect(legacy.schemaVersion).toBe(27);
  for (const value of [0, 250, Number.MAX_SAFE_INTEGER]) {
    const configured = {
      ...doc,
      project: { ...doc.project, brickLossPercent: value },
    };
    expect(
      parseFile(serializeFile(configured).text).project.brickLossPercent,
    ).toBe(value);
    expect(importedCopy(configured).project.brickLossPercent).toBe(value);
    const copied = duplicateFloor(
      configured,
      doc.model.floors[0].id,
      28000,
      "Superior",
    );
    expect(copied.project.brickLossPercent).toBe(value);
  }
  expect(() =>
    validateProject({
      ...legacy,
      project: { ...doc.project, brickLossPercent: 0 },
    }),
  ).toThrow("formato anterior");
  for (const value of [
    -1,
    0.1,
    null,
    "10",
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ])
    expect(() =>
      validateProject({
        ...doc,
        project: { ...doc.project, brickLossPercent: value },
      }),
    ).toThrow();
});
