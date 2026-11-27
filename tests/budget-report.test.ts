import { groutBudget, groutDefaults } from "../src/domain/grout-budget";
import { expect, it } from "vitest";
import {
  createProject,
  makeWall,
  defaultGroutSettings,
} from "../src/domain/project";
import { generate } from "../src/domain/composition";
import { quantities, estimateLosses } from "../src/domain/quantities";
import { budgetCosts, materialCosts, money } from "../src/domain/budget";
import {
  openingBudget,
  withOpeningPrice,
  openingOption,
} from "../src/domain/opening-budget";
import { settlementBudget } from "../src/domain/settlement-budget";
import { steelCosts, steelQuantities } from "../src/domain/steel-budget";
import {
  renderBudgetMarkup,
  budgetReportIdentification,
  type BudgetReport,
} from "../src/app/budget-report/model";
import {
  layoutBudgetReport,
  pageHeight,
  pageWidth,
} from "../src/app/budget-report/layout";

const emitted = new Date("2026-11-25T22:00:00Z");
function fixture() {
  let doc = createProject(
    "Relatório Ω 漢字",
    { length: 2500, width: 1250, height: 700 },
    4200,
  );
  doc.project.channelLevels = [];
  doc.project.groutSettings = defaultGroutSettings(false);
  doc.model.floors.push({
    ...doc.model.floors[0],
    id: crypto.randomUUID(),
    name: "Superior vazio",
    level: 28000,
  });
  doc.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      { x: 20000, y: 0 },
      1250,
      doc.model.floors[0].id,
      4200,
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
      height: 2100,
      appearance: { type: "swing", orientation: 0 },
      material: { kind: "wood-solid" },
    },
  ];
  doc = withOpeningPrice(doc, openingOption(doc.model.openings[0]), 12345);
  doc.project.unitPrices = {
    whole: 100,
    half: 50,
    channel: 200,
    "half-channel": 100,
  };
  doc.project.brickLossPercent = 500;
  doc.project.groutBudget = { ...groutDefaults, price: 100000 };
  doc.project.settlement = { ac1: { percent: 10000, price: 3000 } };
  doc.generated = generate(doc);
  doc.generationState = {
    status: "current",
    diagnostics: doc.generated.diagnostics,
  };
  return doc;
}
const sharedBudgetPresentation = (
  doc: ReturnType<typeof fixture>,
  emitted: Date,
  unsaved = false,
) =>
  budgetReportIdentification(doc, emitted, unsaved).join("\n") +
  renderBudgetMarkup(doc);
const content = (markup: string) =>
  markup
    .replace(/<input[^>]*>/g, (input) => {
      const value = input.match(/value="([^"]*)"/)?.[1];
      const placeholder = input.match(/placeholder="([^"]*)"/)?.[1];
      return ` ${value || placeholder || "Não informado"} `;
    })
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");
it("projeta a mesma revisão dos quatro grupos, todos os pavimentos e fiadas, sem mutar o documento", () => {
  const doc = fixture(),
    before = structuredClone(doc);
  const result = sharedBudgetPresentation(doc, emitted);
  const q = quantities(doc);
  if (!q.available) throw Error(q.reason);
  const b = budgetCosts(
    estimateLosses(q.counts, 500).estimated,
    doc.project.unitPrices!,
  );
  const s = settlementBudget(doc);
  if (!s.available) throw Error(s.reason);
  const grout = groutBudget(doc);
  if (!grout.available) throw Error(grout.reason);
  const total = materialCosts([
    grout.cost,
    b.total,
    steelCosts(steelQuantities(doc), {}).total,
    s.total,
    openingBudget(doc).total,
  ]);
  expect(result.indexOf('aria-label="Totais dos materiais"')).toBeLessThan(
    result.indexOf('aria-labelledby="budget-bricks-title"'),
  );
  const text = content(result);
  expect(text).toContain(`Total dos materiais orçados ${money(total.total!)}`);
  expect(text).toContain("Superior vazio");
  expect(text).toContain("280");
  expect(text).toContain("19:00:00");
  expect(text).toContain("Relatório Ω 漢字");
  expect(text).toContain("R$ 123,45");
  expect(text).toContain("Custos rateados da compra global");
  expect(text).toContain("Fiadas locais");
  const coursesBody = result.match(
    /<caption>Fiadas locais<\/caption>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/,
  )?.[1];
  expect(coursesBody).toBeDefined();
  expect(coursesBody!.match(/<tr>/g)).toHaveLength(
    q.floors.flatMap((floor) => floor.courses).length,
  );
  expect(text).toContain("Térreo");
  expect(doc).toEqual(before);
});
it("distingue ausência, zero, configuração faltante e não inclui preços de esquadrias sem ocorrência", () => {
  const doc = fixture();
  doc.project.openingPrices![0].price = 0;
  doc.project.openingPrices!.push({
    ...doc.project.openingPrices![0],
    width: 7500,
    price: 99999,
  });
  delete doc.project.unitPrices!.whole;
  const text = content(sharedBudgetPresentation(doc, emitted));
  expect(text).toContain("Não informado");
  expect(text).toContain("R$ 0,00");
  expect(text).not.toContain("R$ 999,99");
  expect(text).toContain("Total dos materiais orçados Indisponível");
  delete doc.model.openings[0].material;
  expect(content(sharedBudgetPresentation(doc, emitted))).toContain(
    "Defina material nas propriedades.",
  );
});
it("base desatualizada nunca exporta peças antigas e mantém esquadrias independentes", () => {
  const doc = fixture();
  doc.generationState = { status: "outdated", diagnostics: [] };
  const text = content(sharedBudgetPresentation(doc, emitted, true));
  expect(text).toContain("Composição indisponível");
  expect(text).not.toContain("Fiadas locais");
  expect(text).toContain("R$ 123,45");
  expect(text).toContain("Não salvo");
});
it("parcialidade e distribuição intermediária conservam áreas e valores independentes", () => {
  const doc = fixture();
  doc.project.settlement!.ac1!.percent = 6000;
  doc.generated!.diagnostics.push({
    code: "test",
    course: 1,
    severity: "error",
    message: "Teste",
    floorId: doc.model.floors[0].id,
    wallIds: [],
    x: 0,
    y: 0,
  });
  const text = content(sharedBudgetPresentation(doc, emitted));
  expect(text).toContain("Parcial — há pendências");
  expect(text).toContain("Distribuição: 60%. Faltam 40%.");
  expect(text).toContain("Área bruta:");
  expect(text).toContain("R$ 123,45");
});
it("limites monetários não viram totais completos e preservam grupos independentes", () => {
  const doc = fixture();
  doc.project.unitPrices!.whole = Number.MAX_SAFE_INTEGER;
  const text = content(sharedBudgetPresentation(doc, emitted));
  expect(text).toContain("Custo fora da representação numérica segura");
  expect(text).toContain("Total dos materiais orçados Indisponível");
  expect(text).toContain("R$ 123,45");
  expect(materialCosts([Number.MAX_SAFE_INTEGER, 1]).error).toContain(
    "representação numérica segura",
  );
  expect(materialCosts([0, undefined]).total).toBeUndefined();
});
it("pagina tabelas extensas, repete cabeçalhos e conserva linhas maiores que uma página", () => {
  const report: BudgetReport = {
    title: "Projeto extenso",
    blocks: [
      {
        kind: "table",
        title: "Quadro",
        headers: ["Material", "Custo"],
        widths: [2, 1],
        rows: Array.from({ length: 110 }, (_, i) => [
          `Material ${i} ` +
            (i === 60 ? "Longo".repeat(1800) : "nome completo"),
          "R$ 90.071.992.547.409,91",
        ]),
      },
    ],
  };
  const measure = (t: string, s: number) => Array.from(t).length * s * 0.55;
  const pages = layoutBudgetReport(report, measure);
  expect(pages.length).toBeGreaterThan(5);
  for (const marks of pages) {
    expect(marks.some((m) => m.kind === "text" && m.text === "Material")).toBe(
      true,
    );
    for (const m of marks) {
      expect(m.y).toBeGreaterThan(0);
      expect(m.y).toBeLessThan(pageHeight);
      if (m.kind === "rect")
        expect(m.y + m.height).toBeLessThan(pageHeight - 35);
      else
        expect(m.x + measure(m.text, m.size)).toBeLessThanOrEqual(
          pageWidth - 30,
        );
    }
  }
  const all = pages
    .flat()
    .flatMap((m) =>
      m.kind === "text" && m.x === 41 && !m.bold ? [m.text] : [],
    )
    .join("")
    .replace(/\s/g, "");
  for (let i = 0; i < 110; i++) expect(all).toContain(`Material${i}`);
  expect((all.match(/Longo/g) ?? []).length).toBe(1800);
});

it("mantém o cabeçalho junto da primeira linha da tabela", () => {
  const report: BudgetReport = {
    title: "Quebra de página",
    blocks: [
      ...Array.from({ length: 31 }, () => ({
        kind: "text" as const,
        text: "Introdução",
      })),
      {
        kind: "table",
        title: "Quadro",
        headers: ["Material", "Custo"],
        widths: [1, 1],
        rows: [["Descrição extensa ".repeat(20), "R$ 1,00"]],
      },
    ],
  };
  for (const marks of layoutBudgetReport(
    report,
    (text, size) => text.length * size * 0.55,
  )) {
    if (marks.some((m) => m.kind === "rect" && m.header))
      expect(marks.some((m) => m.kind === "rect" && !m.header)).toBe(true);
  }
});

it("preserva células mescladas de totais sem cortar o rótulo na primeira coluna", () => {
  const report: BudgetReport = {
    title: "Totais",
    blocks: [
      {
        kind: "table",
        title: "Materiais",
        headers: ["Produto", "Quantidade", "Preço", "Custo"],
        widths: [1, 1, 1, 1],
        rows: [["Subtotal de assentamento do pavimento", "", "", "R$ 123,45"]],
        spans: [[3, 0, 0, 1]],
      },
    ],
  };
  const pages = layoutBudgetReport(
    report,
    (text, size) => text.length * size * 0.5,
  );
  expect(pages).toHaveLength(1);
  const boxes = pages[0].filter((m) => m.kind === "rect" && !m.header);
  expect(boxes).toHaveLength(2);
  if (boxes[0].kind !== "rect" || boxes[1].kind !== "rect")
    throw Error("Células ausentes");
  expect(boxes[0].width).toBeCloseTo(boxes[1].width * 3);
  expect(
    pages[0].some(
      (m) =>
        m.kind === "text" && m.text === "Subtotal de assentamento do pavimento",
    ),
  ).toBe(true);
});
