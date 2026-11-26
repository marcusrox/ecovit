import { display, type Project } from "../../domain/project";
import { budgetCosts, money, materialCosts } from "../../domain/budget";
import {
  quantities,
  estimateLosses,
  lossPercentText,
  pieceKinds,
  pieceLabels,
} from "../../domain/quantities";
import {
  steelQuantities,
  steelCosts,
  steelLabel,
  steelNumber,
  steelWeight,
  steelApplicationLabels,
  steelCatalog,
  type SteelKey,
} from "../../domain/steel-budget";
import {
  settlementBudget,
  settlementCatalog,
  settlementNumber,
  assignedAreaScale,
  consumptionScale,
  type SettlementRow,
} from "../../domain/settlement-budget";
import {
  openingBudget,
  openingOptionLabel,
  openingMaterialLabel,
  type OpeningBudgetRow,
} from "../../domain/opening-budget";

export type ReportBlock =
  | { kind: "heading"; text: string }
  | { kind: "text"; text: string }
  | {
      kind: "table";
      title: string;
      headers: string[];
      widths: number[];
      rows: string[][];
    };
export type BudgetReport = { title: string; blocks: ReportBlock[] };
const number = (n: number | undefined) =>
  n === undefined ? "Indisponível" : n.toLocaleString("pt-BR");
const cost = (n: number | undefined) =>
  n === undefined ? "Incompleto / indisponível" : money(n);
const price = (n: number | undefined) =>
  n === undefined ? "Não informado" : money(n);
const partial = (p: boolean) => (p ? " · Parcial - há pendências" : "");
function attempt<T>(fn: () => T): T | { available: false; reason: string } {
  try {
    return fn();
  } catch (e) {
    return {
      available: false,
      reason: e instanceof Error ? e.message : "Consulta indisponível.",
    };
  }
}

// Only confirmed document data enters this projection; local filters/drafts are not inputs.
export function prepareBudgetReport(
  doc: Project,
  emitted: Date,
  unsaved = false,
): BudgetReport {
  const blocks: ReportBlock[] = [];
  const text = (value: string) => blocks.push({ kind: "text", text: value });
  const heading = (value: string) =>
    blocks.push({ kind: "heading", text: value });
  const table = (
    title: string,
    headers: string[],
    widths: number[],
    rows: string[][],
  ) => blocks.push({ kind: "table", title, headers, widths, rows });
  heading("Orçamento preliminar");
  text(doc.project.name);
  text(
    `Emissão: ${emitted.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (São Paulo). Projeto completo.`,
  );
  text(
    `Tijolo base nominal: ${display(doc.project.base.length)} × ${display(doc.project.base.width)} × ${display(doc.project.base.height)} cm. Composição: ${doc.generated?.convention ?? "indisponível"}.`,
  );
  text(
    "Estimativa nominal dos materiais com preços informados. Não inclui mão de obra, serviços ou cálculos estruturais. Quantidades e custos parciais não representam orçamento completo.",
  );
  if (unsaved)
    text(
      "Não salvo: relatório da revisão em memória, ainda sem confirmação de salvamento no servidor.",
    );
  table(
    "Pavimentos abrangidos",
    ["Pavimento", "Cota (cm)"],
    [3, 1],
    [...doc.model.floors]
      .sort((a, b) => a.level - b.level)
      .map((f) => [f.name, display(f.level)]),
  );

  const q = attempt(() => quantities(doc));
  const steel = attempt(() => steelQuantities(doc));
  const sc = steelCosts(steel, doc.project.steelPrices ?? {});
  const settlement = attempt(() => settlementBudget(doc));
  const openings = attempt(() => ({
    available: true as const,
    ...openingBudget(doc),
  }));
  const estimate = q.available
    ? attempt(() => ({
        available: true as const,
        ...estimateLosses(q.counts, doc.project.brickLossPercent ?? 0),
      }))
    : undefined;
  const bricks = estimate?.available
    ? attempt(() => ({
        available: true as const,
        ...budgetCosts(estimate.estimated, doc.project.unitPrices ?? {}),
      }))
    : undefined;
  const totals = [
    {
      label: "Tijolos",
      value: bricks?.available ? bricks.total : undefined,
      partial: q.available && q.partial,
    },
    {
      label: "Ferragens",
      value: sc.total,
      partial: steel.available && steel.partial,
    },
    {
      label: "Assentamento",
      value: settlement.available ? settlement.total : undefined,
      partial: settlement.available && settlement.partial,
    },
    {
      label: "Esquadrias",
      value: openings.available ? openings.total : undefined,
      partial: false,
    },
  ];
  const total = materialCosts(totals.map((t) => t.value));
  heading("Resumo global");
  table(
    "Custos dos materiais",
    ["Grupo", "Subtotal", "Situação"],
    [2, 2, 2],
    totals.map((t) => [
      t.label,
      cost(t.value),
      t.value === undefined
        ? "Incompleto / indisponível"
        : t.partial
          ? "Parcial"
          : "Completo",
    ]),
  );
  text(
    `Total dos materiais orçados${partial(totals.some((t) => t.partial))}: ${cost(total.total)}.`,
  );
  if (total.error) text(total.error);
  text(
    "Preço zero é válido e difere de preço ausente. Um grupo incompleto ou indisponível impede o total geral; valores conhecidos dos demais grupos permanecem identificados.",
  );

  heading(`Tijolos${partial(q.available && q.partial)}`);
  text(
    `Perdas: ${lossPercentText(doc.project.brickLossPercent ?? 0)}%. Aplicadas por tipo somente no resumo global; detalhamento geométrico sem perdas.`,
  );
  if (!q.available) text(q.reason);
  if (estimate && !estimate.available) text(estimate.reason);
  if (bricks && !bricks.available) text(bricks.reason);
  table(
    "Tijolos do projeto",
    [
      "Tipo",
      "Geométrica (un.)",
      "Perdas (un.)",
      "Estimado (un.)",
      "Preço / un.",
      "Custo",
    ],
    [1.5, 1, 1, 1, 1.5, 1.7],
    pieceKinds.map((k) => [
      pieceLabels[k],
      number(q.available ? q.counts[k] : undefined),
      number(estimate?.available ? estimate.added[k] : undefined),
      number(estimate?.available ? estimate.estimated[k] : undefined),
      price(doc.project.unitPrices?.[k]),
      cost(bricks?.available ? bricks.costs[k] : undefined),
    ]),
  );
  if (q.available)
    for (const f of q.floors) {
      table(
        `Tijolos · ${f.name} · ${display(f.level)} cm${partial(f.partial)}`,
        [
          "Fiada",
          ...pieceKinds.map((k) => `${pieceLabels[k]} (un.)`),
          "Total (un.)",
        ],
        [1, 1, 1, 1, 1.3, 1],
        [
          ...f.courses.map((c) => [
            number(c.number),
            ...pieceKinds.map((k) => number(c.counts[k])),
            number(c.counts.total),
          ]),
          [
            "Total",
            ...pieceKinds.map((k) => number(f.counts[k])),
            number(f.counts.total),
          ],
        ],
      );
    }

  heading(`Ferragens${partial(steel.available && steel.partial)}`);
  text(
    "Massas nominais de catálogo Gerdau. Comprimentos e pesos apresentados com até três casas; custos calculados antes do arredondamento. Sem compra em barras comerciais ou detalhamento de fabricação.",
  );
  if (!steel.available) {
    text(steel.reason);
    table(
      "Preços de ferragens",
      ["Aço / bitola", "Preço / kg"],
      [2, 1],
      steelCatalog.map((r) => [
        steelLabel(r),
        price(doc.project.steelPrices?.[r.key]),
      ]),
    );
  } else {
    table(
      "Ferragens do projeto",
      [
        "Aço / bitola",
        "Base (m)",
        "Adicional (m)",
        "Estimado (m)",
        "Peso (kg)",
        "Preço / kg",
        "Custo",
      ],
      [1.6, 1, 1, 1, 1, 1.5, 1.6],
      steel.rows.map((r) => [
        steelLabel(r),
        steelNumber(r.base),
        steelNumber(r.extra),
        steelNumber(r.estimated),
        r.weight === undefined ? "Indisponível" : steelWeight(r.weight),
        price(doc.project.steelPrices?.[r.key as SteelKey]),
        cost(sc.costs[r.key]),
      ]),
    );
    for (const message of Object.values(sc.errors)) text(message);
    if (sc.error) text(sc.error);
    for (const f of steel.floors) {
      heading(
        `Ferragens · ${f.name} · ${display(f.level)} cm${partial(f.partial)}`,
      );
      text(
        `Trecho útil: ${display(f.settings.usefulLength)} cm; sobreposição: ${display(f.settings.overlapLength)} cm; acréscimo horizontal: ${lossPercentText(f.settings.horizontalExtra)}%. Sem arranques entre pavimentos. Grampos incluem as pontas.`,
      );
      table(
        "Ferragens por aplicação",
        [
          "Aplicação / aço",
          "Base (m)",
          "Adicional (m)",
          "Estimado (m)",
          "Peso (kg)",
          "Preço / kg",
        ],
        [2, 1, 1, 1, 1, 1.5],
        f.details.map((r) => [
          `${steelApplicationLabels[r.application]} · ${steelLabel(r)}${r.error ? ` · ${r.error}` : ""}`,
          steelNumber(r.base),
          steelNumber(r.extra),
          steelNumber(r.estimated),
          r.weight === undefined ? "Indisponível" : steelWeight(r.weight),
          price(doc.project.steelPrices?.[r.key as SteelKey]),
        ]),
      );
      for (const message of f.pending) text(message);
    }
  }

  heading(
    `Materiais de assentamento${partial(settlement.available && settlement.partial)}`,
  );
  const consumption = (r: SettlementRow) => {
    const p = settlementCatalog.find((p) => p.key === r.key)!;
    return r.consumption === undefined
      ? "Indisponível"
      : `${settlementNumber(r.consumption, consumptionScale * (p.unit === "ml" ? 1000n : 1n))} ${p.unit === "ml" ? "litros" : "kg"}`;
  };
  const areas = (r: { gross: bigint; openings: bigint; net: bigint }) =>
    text(
      `Área bruta: ${settlementNumber(r.gross)} m²; desconto de vãos: ${settlementNumber(r.openings)} m²; líquida: ${settlementNumber(r.net)} m².`,
    );
  table(
    "Parâmetros de assentamento",
    [
      "Produto / embalagem",
      "Distribuição (%)",
      "Rendimento",
      "Preço / embalagem",
    ],
    [2.3, 1, 1.5, 1.7],
    settlementCatalog.map((p) => {
      const s = doc.project.settlement?.[p.key];
      return [
        `${p.label} · ${p.package}`,
        lossPercentText(s?.percent ?? 0),
        `${settlementNumber(BigInt(s?.yield ?? p.yield), 1000n)} ${p.unit}/m²`,
        price(s?.price),
      ];
    }),
  );
  if (!settlement.available) text(settlement.reason);
  else {
    areas(settlement);
    if (!settlement.distributionValid && settlement.net > 0n)
      text(
        `Distribuição incompleta: soma ${lossPercentText(settlement.percent)}%; é necessário 100%. Consumo, compra e custos dependentes indisponíveis.`,
      );
    table(
      "Compra global de assentamento",
      ["Produto", "Área (m²)", "Consumo", "Embalagens (un.)", "Custo"],
      [1.8, 1, 1.4, 1.3, 1.8],
      settlement.rows.map((r) => [
        settlementCatalog.find((p) => p.key === r.key)!.label,
        r.area === undefined
          ? "Indisponível"
          : settlementNumber(r.area, assignedAreaScale),
        consumption(r),
        number(r.packages),
        cost(r.cost),
      ]),
    );
    for (const r of settlement.rows)
      if (r.error)
        text(
          `${settlementCatalog.find((p) => p.key === r.key)!.label}: ${r.error}`,
        );
    if (settlement.error) text(settlement.error);
    text(
      "Compra global em embalagens inteiras inclui sobras. Rateio por pavimento não representa compra independente; não se aplicam perdas dos tijolos ou acréscimos do aço.",
    );
    for (const f of settlement.floors) {
      heading(
        `Assentamento · ${f.name} · ${display(f.level)} cm${partial(f.partial)}`,
      );
      areas(f);
      table(
        "Consumo e rateio da compra",
        ["Produto", "Área (m²)", "Consumo", "Custo rateado"],
        [2, 1, 1.5, 2],
        f.rows.map((r) => [
          settlementCatalog.find((p) => p.key === r.key)!.label,
          r.area === undefined
            ? "Indisponível"
            : settlementNumber(r.area, assignedAreaScale),
          consumption(r),
          cost(r.cost),
        ]),
      );
      text(
        `Subtotal de assentamento rateado${partial(f.partial)}: ${cost(f.total)}.`,
      );
    }
  }

  heading("Esquadrias");
  text(
    "Somente portas e janelas presentes. Dimensões do vão bruto, não de fabricação. Preço por unidade, sem instalação automática. Vãos livres não entram.",
  );
  const openingRows = (rows: OpeningBudgetRow[]) =>
    rows.map((r) => [
      `${openingOptionLabel(r.option)} · ${openingMaterialLabel(r.option.material)}${r.error ? ` · ${r.error}` : ""}`,
      `${display(r.option.width)} × ${display(r.option.height)}`,
      number(r.count),
      price(r.price),
      cost(r.cost),
    ]);
  if (!openings.available) text(openings.reason);
  else {
    const headers = [
        "Tipo / material",
        "Vão bruto (cm)",
        "Quantidade (un.)",
        "Preço / un.",
        "Custo",
      ],
      widths = [2.5, 1.2, 1, 1.5, 1.7];
    table("Esquadrias do projeto", headers, widths, openingRows(openings.rows));
    if (openings.error) text(openings.error);
    for (const f of openings.floors) {
      table(
        `Esquadrias · ${f.name} · ${display(f.level)} cm`,
        headers,
        widths,
        openingRows(f.rows),
      );
      text(
        `Subtotal de esquadrias: ${cost(f.total)}.${f.error ? ` ${f.error}` : ""}`,
      );
    }
  }
  return { title: doc.project.name, blocks };
}
