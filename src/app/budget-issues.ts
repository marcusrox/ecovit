import type { useSlabConcreteBudget } from "./SlabConcreteBudget";
import { concreteLabels } from "../domain/slab-concrete-budget";
import { groutFields, groutLabels } from "../domain/grout-budget";
import type { useGroutBudget } from "./GroutBudget";
import { display, type Project } from "../domain/project";
import {
  pieceKinds,
  pieceLabels,
  type QuantityReport,
  type estimateLosses,
} from "../domain/quantities";
import type { UnitPrices } from "../domain/budget";
import { steelLabel, steelCatalog } from "../domain/steel-budget";
import {
  openingOptionLabel,
  openingMaterialLabel,
  openingOption,
  openingOptionKey,
} from "../domain/opening-budget";
import { settlementCatalog } from "../domain/settlement-budget";
import { surfaceProducts, isConcreteProduct } from "../domain/surface-budget";
import type { useSteelBudget } from "./SteelBudget";
import type { useSettlementBudget } from "./SettlementBudget";
import type { useOpeningBudget } from "./OpeningBudget";
import type { useSurfaceBudget } from "./SurfaceBudget";

export type BudgetSection =
  | "slabConcrete"
  | "grout"
  | "bricks"
  | "steel"
  | "settlement"
  | "openings"
  | "surface"
  | "concrete"
  | "summary"
  | "detail";
export type BudgetIssue = {
  id: string;
  label: string;
  reason: string;
  guidance: string;
  section: BudgetSection;
  target?: string;
  openingKey?: string;
};
type Input = {
  slabConcrete?: Pick<ReturnType<typeof useSlabConcreteBudget>, "report">;
  grout?: Pick<ReturnType<typeof useGroutBudget>, "report" | "errors">;
  doc: Project;
  processing: boolean;
  report: QuantityReport;
  estimate?: ReturnType<typeof estimateLosses>;
  lossError: string;
  prices: UnitPrices;
  priceErrors: Partial<Record<(typeof pieceKinds)[number], string>>;
  budgetError: string;
  materialError?: string;
  steel: Pick<ReturnType<typeof useSteelBudget>, "report" | "costs" | "errors">;
  settlement: Pick<ReturnType<typeof useSettlementBudget>, "report" | "errors">;
  openings: Pick<ReturnType<typeof useOpeningBudget>, "report">;
  surface: Pick<
    ReturnType<typeof useSurfaceBudget>,
    "report" | "settings" | "errors" | "descriptionErrors"
  >;
};

// Presentation over the existing projections and validation results, never a
// second set of budget calculations. Targets are shared with the actual fields.
export function budgetIssues(m: Input): BudgetIssue[] {
  const issues: BudgetIssue[] = [];
  const ids = new Set<string>();
  const add = (issue: BudgetIssue) => {
    if (!ids.has(issue.id)) {
      ids.add(issue.id);
      issues.push(issue);
    }
  };
  const field = (
    section: BudgetSection,
    target: string,
    label: string,
    reason: string,
  ) =>
    add({
      id: target,
      label,
      reason,
      section,
      target,
      guidance: "Confira e preencha o campo indicado.",
    });
  const sectionIssue = (
    section: BudgetSection,
    label: string,
    reason: string,
    guidance: string,
    id = `${section}:${label}:${reason}`,
  ) => add({ id, label, reason, section, guidance });
  const unavailable = new Map<
    string,
    { groups: string[]; reason: string; section: BudgetSection }
  >();
  const missingBase = (
    section: BudgetSection,
    group: string,
    reason: string,
  ) => {
    const outdated =
      m.doc.generationState.status !== "current" ||
      m.doc.generated?.convention !== "nominal-v13";
    const key = m.processing ? "processing" : outdated ? "composition" : reason;
    const existing = unavailable.get(key);
    if (existing) existing.groups.push(group);
    else
      unavailable.set(key, {
        groups: [group],
        section,
        reason: m.processing
          ? "Operação em andamento. Aguarde."
          : outdated
            ? "Composição indisponível ou desatualizada."
            : reason,
      });
  };
  const partial = (
    section: BudgetSection,
    label: string,
    floors: { name: string; level: number; partial: boolean }[],
    guidance: string,
  ) => {
    const names = floors
      .filter((floor) => floor.partial)
      .map((floor) => `${floor.name} · ${display(floor.level)} cm`);
    sectionIssue(
      section,
      label,
      `Estimativa parcial${names.length ? ` — ${names.join("; ")}` : ""}.`,
      guidance,
      `${label}:partial`,
    );
  };

  if (!m.report.available) missingBase("bricks", "Tijolos", m.report.reason);
  else {
    if (m.report.partial)
      partial(
        "bricks",
        "Tijolos",
        m.report.floors,
        "Consulte Ver diagnósticos no resumo do Orçamento.",
      );
    if (m.estimate)
      for (const key of pieceKinds)
        if (
          m.estimate.estimated[key] > 0 &&
          m.prices[key] === undefined &&
          !m.priceErrors[key]
        )
          field(
            "bricks",
            `bricks:${key}`,
            `Tijolos · ${pieceLabels[key]}`,
            "Informe o preço unitário.",
          );
    if (m.budgetError)
      sectionIssue(
        "bricks",
        "Tijolos",
        m.budgetError,
        "Revise os valores e as quantidades antes de concluir o orçamento.",
      );
  }
  if (m.lossError)
    field("bricks", "bricks:loss", "Tijolos · perdas", m.lossError);
  for (const key of pieceKinds)
    if (m.priceErrors[key])
      field(
        "bricks",
        `bricks:${key}`,
        `Tijolos · ${pieceLabels[key]}`,
        m.priceErrors[key]!,
      );

  const steel = m.steel;
  if (!steel.report.available)
    missingBase("steel", "Ferragens", steel.report.reason);
  else {
    if (steel.report.partial)
      partial(
        "detail",
        "Ferragens",
        steel.report.floors,
        "Consulte as pendências no detalhamento de ferragens e os diagnósticos existentes.",
      );
    for (const row of steel.report.rows) {
      const error = steel.costs.errors[row.key];
      if (!error) continue;
      if (!row.error)
        field(
          "steel",
          `steel:${row.key}`,
          `Ferragens · ${steelLabel(row)}`,
          error,
        );
      else
        sectionIssue(
          "steel",
          `Ferragens · ${steelLabel(row)}`,
          error,
          "Confira a ferragem e sua configuração no editor; não há estimativa automática de massa fora do catálogo.",
        );
    }
    if (steel.costs.error)
      sectionIssue(
        "steel",
        "Ferragens",
        steel.costs.error,
        "Revise os valores e as quantidades das ferragens.",
      );
  }
  for (const [key, reason] of Object.entries(steel.errors))
    if (reason)
      field(
        "steel",
        `steel:${key}`,
        `Ferragens · ${steelLabel({ key, diameter: steelCatalog.find((p) => p.key === key)!.diameter })}`,
        reason,
      );

  const settlement = m.settlement.report;
  if (!settlement.available)
    missingBase("settlement", "Assentamento", settlement.reason);
  else {
    if (settlement.partial)
      partial(
        "settlement",
        "Assentamento",
        settlement.floors,
        "Consulte os diagnósticos geométricos pelo resumo do Orçamento.",
      );
    if (
      settlement.net > 0n &&
      !settlement.distributionValid &&
      !Object.values(m.settlement.errors).some((error) => error?.percent)
    )
      sectionIssue(
        "settlement",
        "Assentamento · distribuição",
        "A soma dos percentuais deve ser 100%, com entradas válidas.",
        "Revise a distribuição entre os produtos de assentamento.",
        "settlement:distribution",
      );
    for (const row of settlement.rows) {
      if (!row.error) continue;
      const label = `Assentamento · ${settlementCatalog.find((p) => p.key === row.key)!.label}`;
      const errors = m.settlement.errors[row.key];
      if (errors?.yield)
        field("settlement", `settlement:${row.key}:yield`, label, row.error);
      else if (row.packages !== undefined)
        field("settlement", `settlement:${row.key}:price`, label, row.error);
      else
        sectionIssue(
          "settlement",
          label,
          row.error,
          "Confira o rendimento e a aplicação do produto.",
        );
    }
    if (settlement.error)
      sectionIssue(
        "settlement",
        "Assentamento",
        settlement.error,
        "Revise os valores e as quantidades dos produtos.",
      );
  }
  for (const product of settlementCatalog)
    for (const [key, reason] of Object.entries(
      m.settlement.errors[product.key] ?? {},
    ))
      field(
        "settlement",
        `settlement:${product.key}:${key}`,
        `Assentamento · ${product.label}${settlement.available && settlement.rows.find((row) => row.key === product.key)?.cost !== undefined ? " · edição para exportação" : ""}`,
        reason,
      );

  const openings = m.openings.report;
  if (!openings.available)
    sectionIssue(
      "openings",
      "Esquadrias",
      openings.reason,
      "Confira as esquadrias do projeto no editor.",
    );
  else {
    for (const row of openings.rows) {
      if (!row.error) continue;
      const label = `Esquadrias · ${openingOptionLabel(row.option)} · ${display(row.option.width)} × ${display(row.option.height)} cm · ${openingMaterialLabel(row.option.material)}`;
      if (row.option.type && row.option.material)
        field("openings", `openings:${row.key}`, label, row.error);
      else
        add({
          id: `openings:configuration:${row.key}`,
          section: "openings",
          label,
          reason: row.error,
          guidance:
            "Localize a primeira esquadria pendente na planta e ajuste suas propriedades.",
          openingKey: row.key,
        });
    }
    if (openings.error)
      sectionIssue(
        "openings",
        "Esquadrias",
        openings.error,
        "Revise os valores e as quantidades das esquadrias.",
      );
  }

  const surface = m.surface;
  for (const { key, label } of surfaceProducts) {
    const row = surface.report.rows.find((r) => r.key === key)!;
    const section = isConcreteProduct(key) ? "concrete" : "surface";
    const localLabel = (field: string) => {
      const entry = surface.report.applications?.find(
        (e) => e.key === key && `percent:${e.id}` === field,
      );
      return entry ? `${label} · ${entry.label}` : label;
    };
    if (
      !surface.report.area.available &&
      (surface.settings[key]?.percent ?? 0) > 0 &&
      !surface.errors[key]?.percent
    )
      missingBase("surface", label, surface.report.area.reason);
    else if (row.error) {
      const target = row.errorField;
      if (target)
        field(
          section,
          `surface:${key}:${target}`,
          localLabel(target),
          row.error,
        );
      else
        sectionIssue(
          section,
          label,
          row.error,
          "Confira a aplicação e o rendimento do produto.",
        );
    }
    if (
      surface.report.partial &&
      (surface.settings[key]?.percent ?? 0) > 0 &&
      surface.report.area.available
    )
      partial(
        "surface",
        label,
        surface.report.area.floors,
        "Consulte os diagnósticos geométricos pelo resumo do Orçamento.",
      );
    for (const [name, reason] of Object.entries(surface.errors[key] ?? {}))
      field(
        section,
        `surface:${key}:${name}`,
        row.cost !== undefined
          ? `${localLabel(name)} · edição para exportação`
          : localLabel(name),
        reason!,
      );
    if (surface.descriptionErrors[key])
      field(
        section,
        `surface:${key}:description`,
        `${label} · edição para exportação`,
        surface.descriptionErrors[key]!,
      );
  }
  if (m.grout) {
    const g = m.grout;
    if (!g.report.available)
      missingBase("grout", "Graute de preenchimento", g.report.reason);
    else {
      for (const row of g.report.rows)
        if (row.error) {
          if (row.field)
            field(
              "grout",
              `grout:${row.field}`,
              groutLabels[row.field],
              row.error,
            );
          else
            sectionIssue(
              "grout",
              "Graute de preenchimento",
              row.error,
              "Confira os parâmetros do microconcreto.",
            );
        }
      if (g.report.error) {
        if (g.report.field)
          field(
            "grout",
            `grout:${g.report.field}`,
            groutLabels[g.report.field],
            g.report.error,
          );
        else
          sectionIssue(
            "grout",
            "Graute de preenchimento",
            g.report.error,
            "Confira os parâmetros do microconcreto.",
          );
      }
      if (g.report.partial)
        partial(
          "grout",
          "Graute de preenchimento",
          g.report.floors,
          "Confira as pendências geométricas do projeto.",
        );
    }
    for (const key of groutFields)
      if (g.errors[key])
        field("grout", `grout:${key}`, groutLabels[key], g.errors[key]!);
  }
  if (m.slabConcrete) {
    for (const row of m.slabConcrete.report.rows) {
      for (const [key, reason] of Object.entries(row.errors))
        field(
          "slabConcrete",
          `slabConcrete:${row.slab.id}:${key}`,
          `${concreteLabels[key as keyof typeof concreteLabels]} · ${row.name} · ${display(row.level)} cm`,
          reason,
        );
      if (row.error)
        sectionIssue(
          "slabConcrete",
          `Concreto · ${row.name}`,
          row.error,
          "Confira a laje e seus parâmetros.",
        );
    }
    if (m.slabConcrete.report.error)
      sectionIssue(
        "slabConcrete",
        "Concreto",
        m.slabConcrete.report.error,
        "Revise os parâmetros das lajes.",
      );
  }
  if (m.materialError)
    sectionIssue(
      "summary",
      "Total geral",
      m.materialError,
      "Revise os valores dos materiais; os subtotais representáveis continuam disponíveis.",
    );

  return [
    ...[...unavailable.values()].map(({ groups, reason, section }) => ({
      id: `base:${groups.join(":")}`,
      label: groups.join(" / "),
      reason,
      section,
      guidance: m.processing
        ? "Aguarde a conclusão da operação."
        : "Siga o fluxo existente de abertura e atualização do projeto no editor.",
    })),
    ...issues,
  ];
}

// Resolve against the current document after any normal blur confirmation.
export function firstPendingOpening(doc: Project, key: string) {
  return doc.model.openings.find(
    (opening) =>
      opening.kind !== "opening" &&
      (!opening.appearance?.type || !opening.material) &&
      openingOptionKey(openingOption(opening)) === key &&
      doc.model.walls.some((wall) => wall.id === opening.wallId),
  );
}
