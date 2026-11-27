import { expect, it } from "vitest";
import { budgetIssues, firstPendingOpening } from "../src/app/budget-issues";
import {
  createProject,
  makeWall,
  defaultGroutSettings,
} from "../src/domain/project";
import { generate } from "../src/domain/composition";
import { quantities, estimateLosses } from "../src/domain/quantities";
import { steelQuantities, steelCosts } from "../src/domain/steel-budget";
import { settlementBudget } from "../src/domain/settlement-budget";
import { surfaceBudget } from "../src/domain/surface-budget";
import { openingBudget } from "../src/domain/opening-budget";
import { renderBudgetMarkup } from "../src/app/budget-report/model";

function fixture() {
  const doc = createProject(
    "Pendências",
    { length: 2500, width: 1250, height: 700 },
    2100,
  );
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
  doc.project.unitPrices = { whole: 0, half: 0, channel: 0, "half-channel": 0 };
  doc.project.settlement = { ac1: { percent: 10000, price: 0 } };
  doc.generated = generate(doc);
  doc.generationState = {
    status: "current",
    diagnostics: doc.generated.diagnostics,
  };
  return doc;
}
function input(doc = fixture()): Parameters<typeof budgetIssues>[0] {
  const report = quantities(doc);
  const steel = steelQuantities(doc);
  return {
    doc,
    processing: false,
    report,
    estimate: report.available ? estimateLosses(report.counts, 0) : undefined,
    lossError: "",
    prices: doc.project.unitPrices ?? {},
    priceErrors: {},
    budgetError: "",
    steel: { report: steel, costs: steelCosts(steel, {}), errors: {} },
    settlement: { report: settlementBudget(doc), errors: {} },
    openings: { report: { available: true, ...openingBudget(doc) } },
    surface: {
      report: surfaceBudget(doc),
      settings: doc.project.surface ?? {},
      errors: {},
      descriptionErrors: {},
    },
  };
}

it("zero confirmado e materiais sem uso não exigem parâmetros, e a projeção não altera o documento", () => {
  const m = input();
  const before = structuredClone(m.doc);
  expect(budgetIssues(m)).toEqual([]);
  expect(m.doc).toEqual(before);
});

it("identifica materiais distintos e segue impedimentos encadeados de rendimento e preço", () => {
  const doc = fixture();
  delete doc.project.unitPrices!.whole;
  doc.project.priceSources = [
    { item: { group: "bricks", key: "whole" }, source: "cleared" },
  ];
  doc.project.surface = { waterproofing: { percent: 5000 } };
  let issues = budgetIssues(input(doc));
  expect(issues.map((i) => i.target)).toEqual([
    "bricks:whole",
    "surface:waterproofing:yield",
  ]);
  doc.project.surface.waterproofing!.yield = 30000;
  issues = budgetIssues(input(doc));
  expect(issues.map((i) => i.target)).toEqual([
    "bricks:whole",
    "surface:waterproofing:price",
  ]);
  doc.project.surface.waterproofing!.price = 0;
  doc.project.unitPrices!.whole = 0;
  expect(budgetIssues(input(doc))).toEqual([]);
});

it("base indisponível tem uma causa comum, preserva esquadrias independentes e não presume preços", () => {
  const doc = fixture();
  doc.generationState = { status: "outdated", diagnostics: [] };
  doc.project.unitPrices = {};
  doc.project.surface = { waterproofing: { percent: 5000 } };
  doc.model.openings.push({
    id: "door",
    wallId: doc.model.walls[0].id,
    kind: "door",
    offset: 2500,
    width: 2500,
    base: 0,
    height: 1400,
  });
  const issues = budgetIssues(input(doc));
  expect(issues).toHaveLength(2);
  expect(issues[0].label).toBe(
    "Tijolos / Ferragens / Assentamento / Impermeabilizante",
  );
  expect(issues[0].reason).toContain("Composição indisponível");
  expect(issues[1].label).toContain("Esquadrias");
  expect(issues[1].guidance).toContain("propriedades");
  expect(issues.every((i) => !i.target)).toBe(true);
});

it("localiza a primeira esquadria igual ainda pendente e mantém preços no orçamento", () => {
  const doc = fixture();
  const first = {
    id: "first",
    wallId: doc.model.walls[0].id,
    kind: "door" as const,
    appearance: { type: "swing" as const, orientation: 0 as const },
    offset: 0,
    width: 2500,
    base: 0,
    height: 1400,
  };
  doc.model.openings = [first, { ...first, id: "second", offset: 5000 }];
  const before = structuredClone(doc);
  const issue = budgetIssues(input(doc)).find((i) => i.openingKey)!;
  expect(firstPendingOpening(doc, issue.openingKey!)?.id).toBe("first");
  expect(doc).toEqual(before);
  doc.model.openings[0].material = { kind: "aluminium" };
  expect(firstPendingOpening(doc, issue.openingKey!)?.id).toBe("second");
  const priceIssue = budgetIssues(input(doc)).find((i) =>
    i.target?.startsWith("openings:"),
  )!;
  expect(priceIssue.openingKey).toBeUndefined();
  doc.model.openings[1].material = { kind: "aluminium" };
  expect(firstPendingOpening(doc, issue.openingKey!)).toBeUndefined();
});

it("distribuição coletiva não inventa preços e erros de rascunho exclusivos de exportação têm destino", () => {
  const doc = fixture();
  doc.project.settlement!.ac1!.percent = 6000;
  const m = input(doc);
  m.surface.descriptionErrors.waterproofing =
    "Informe até 160 caracteres para produto e embalagem.";
  const issues = budgetIssues(m);
  expect(issues.map((i) => i.id)).toEqual([
    "settlement:distribution",
    "surface:waterproofing:description",
  ]);
  expect(issues[0].target).toBeUndefined();
  expect(issues[1].label).toContain("exportação");
});

it("parcialidade é resumida por grupo/pavimento, sem reproduzir diagnósticos", () => {
  const m = input();
  if (!m.report.available || !m.steel.report.available) throw Error("fixture");
  m.report.partial = true;
  m.report.floors[0].partial = true;
  m.steel.report.partial = true;
  m.steel.report.floors[0].partial = true;
  m.steel.report.floors[0].pending = ["Grampo A", "Grampo B"];
  const issues = budgetIssues(m);
  expect(issues).toHaveLength(2);
  expect(issues.every((i) => i.reason.includes("Térreo · 0 cm"))).toBe(true);
  expect(issues[1].section).toBe("detail");
  expect(JSON.stringify(issues)).not.toContain("Grampo A");
});

it("massa fora do catálogo e estouro exclusivo do total preservam a identificação dos alvos", () => {
  const m = input();
  if (!m.steel.report.available) throw Error("fixture");
  m.steel.report.rows.push({
    key: "unknown-70",
    diameter: 70,
    base: 1n,
    extra: 0n,
    estimated: 1n,
    error: "Bitola sem categoria/massa cadastrada.",
  });
  m.steel.costs = steelCosts(m.steel.report, {});
  m.materialError =
    "Total dos materiais fora da representação numérica segura.";
  const issues = budgetIssues(m);
  expect(issues[0].section).toBe("steel");
  expect(issues[0].target).toBeUndefined();
  expect(issues[0].reason).toContain("massa");
  expect(issues[1].label).toBe("Total geral");
  expect(m.steel.costs.costs["ca60-5"]).toBe(0);
  m.steel.report.rows.push({
    key: "unknown-90",
    diameter: 90,
    base: 1n,
    extra: 0n,
    estimated: 1n,
    error: "Bitola sem categoria/massa cadastrada.",
  });
  m.steel.costs = steelCosts(m.steel.report, {});
  expect(
    budgetIssues(m).filter((issue) => issue.reason.includes("massa")),
  ).toHaveLength(2);
});

it("validação inválida continua localizável mesmo em material sem uso ou base indisponível", () => {
  const m = input();
  m.priceErrors.channel = "Preço inválido.";
  m.steel.errors["ca60-5"] = "Preço inválido.";
  m.surface.errors.jointing = { price: "Preço inválido." };
  m.lossError = "Perdas inválidas.";
  m.report = { available: false, reason: "Base indisponível." };
  const issues = budgetIssues(m);
  expect(issues.map((i) => i.target).filter(Boolean)).toEqual([
    "bricks:loss",
    "bricks:channel",
    "steel:ca60-5",
    "surface:jointing:price",
  ]);
});

it("PDF compartilha os motivos da captura, sem ações interativas ou consulta de referências", () => {
  const doc = fixture();
  delete doc.project.unitPrices!.whole;
  doc.project.surface = { waterproofing: { percent: 10000 } };
  const before = structuredClone(doc);
  const markup = renderBudgetMarkup(doc);
  const summary = markup.slice(
    markup.indexOf('aria-labelledby="budget-issues-title"'),
    markup.indexOf('aria-labelledby="budget-bricks-title"'),
  );
  for (const issue of budgetIssues(input(doc))) {
    expect(summary).toContain(issue.label);
    expect(summary).toContain(issue.reason);
  }
  expect(summary).not.toContain("<button");
  expect(doc).toEqual(before);
});

it("falha de cálculo e rascunho inválido simultâneos mantêm motivos e destinos distintos", () => {
  const m = input();
  m.surface.settings.waterproofing = { percent: 5000, yield: 1000 };
  m.surface.errors.waterproofing = { yield: "Rendimento inválido." };
  // A projection can fail before reaching the invalid yield. The collector
  // must not infer that the earlier area error belongs to the yield field.
  m.surface.report.rows[0] = {
    key: "waterproofing",
    error: "Área fora da representação numérica segura.",
  };
  const issues = budgetIssues(m).filter((issue) =>
    issue.label.includes("Impermeabilizante"),
  );
  expect(issues).toHaveLength(2);
  expect(issues[0].target).toBeUndefined();
  expect(issues[0].reason).toContain("Área");
  expect(issues[1].target).toBe("surface:waterproofing:yield");
  expect(issues[1].reason).toBe("Rendimento inválido.");
});

it("erro de assentamento sem efeito no custo é identificado como edição para exportação", () => {
  const m = input();
  m.settlement.errors.ac2 = { yield: "Rendimento inválido." };
  const issues = budgetIssues(m);
  expect(issues).toHaveLength(1);
  expect(issues[0].label).toContain("edição para exportação");
  expect(issues[0].target).toBe("settlement:ac2:yield");
});
