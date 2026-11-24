import { useMemo, useState } from "react";
import { display, type Project } from "../domain/project";
import { money, priceText } from "../domain/budget";
import { lossPercentText } from "../domain/quantities";
import {
  settlementBudget,
  settlementCatalog,
  settlementNumber,
  parseSettlementField,
  assignedAreaScale,
  consumptionScale,
  type SettlementKey,
  type SettlementField,
  type SettlementErrors,
  type SettlementReport,
  type SettlementRow,
} from "../domain/settlement-budget";
import { useStore } from "../state/store";
import styles from "../ui/App.module.css";

export function useSettlementBudget(
  doc: Project,
  open: boolean,
  busy: boolean,
  readonly: boolean,
  priceSaving: boolean,
  setPriceSaving: (saving: boolean) => void,
) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const settings = { ...doc.project.settlement };
  const errors: SettlementErrors = {};
  for (const product of settlementCatalog) {
    const key = product.key;
    settings[key] = { ...settings[key] };
    for (const field of ["percent", "yield", "price"] as const) {
      const draft = drafts[`${key}:${field}`];
      if (draft === undefined) continue;
      try {
        const value = parseSettlementField(field, draft);
        if (value === undefined) delete settings[key]![field];
        else settings[key]![field] = value;
      } catch (e) {
        errors[key] = { ...errors[key], [field]: (e as Error).message };
      }
    }
  }
  // The budget is a read projection. Preview fields never mutate the document.
  const signature = JSON.stringify([settings, errors]);
  const report: SettlementReport = useMemo(() => {
    if (!open) return { available: false, reason: "" };
    const [settlement, invalid] = JSON.parse(signature);
    try {
      return settlementBudget(
        { ...doc, project: { ...doc.project, settlement } },
        busy && !priceSaving,
        invalid,
      );
    } catch (e) {
      return { available: false, reason: (e as Error).message };
    }
  }, [doc, open, busy, priceSaving, signature]);
  const confirm = async (key: SettlementKey, field: SettlementField) => {
    const state = useStore.getState(),
      latest = state.doc;
    const id = `${key}:${field}`,
      draft = drafts[id];
    if (
      !latest ||
      latest.project.id !== doc.project.id ||
      state.busy ||
      state.readonly ||
      draft === undefined
    )
      return;
    let value: number | undefined;
    try {
      value = parseSettlementField(field, draft);
    } catch {
      return;
    }
    const product = settlementCatalog.find((s) => s.key === key)!;
    const fallback =
      field === "percent" ? 0 : field === "yield" ? product.yield : undefined;
    if (value !== (latest.project.settlement?.[key]?.[field] ?? fallback)) {
      const next = {
        ...latest.project.settlement,
        [key]: { ...latest.project.settlement?.[key] },
      };
      if (value === undefined) delete next[key]![field];
      else next[key]![field] = value;
      setPriceSaving(true);
      try {
        await state.commit(
          { ...latest, project: { ...latest.project, settlement: next } },
          "budget",
        );
      } finally {
        setPriceSaving(false);
      }
    }
    setDrafts((previous) => {
      if (previous[id] !== draft) return previous;
      const next = { ...previous };
      delete next[id];
      return next;
    });
  };
  return {
    report,
    errors,
    drafts,
    setDrafts,
    confirm,
    blocked: busy || readonly,
    settings,
  };
}
type Model = ReturnType<typeof useSettlementBudget>;
function Consumption({ row }: { row: SettlementRow }) {
  const product = settlementCatalog.find((s) => s.key === row.key)!;
  return (
    <>
      {row.consumption === undefined
        ? "—"
        : `${settlementNumber(row.consumption, consumptionScale * (product.unit === "ml" ? 1000n : 1n))} ${product.unit === "ml" ? "litros" : "kg"}`}
    </>
  );
}
function Areas({
  area,
}: {
  area: { gross: bigint; openings: bigint; net: bigint };
}) {
  return (
    <p>
      Área bruta: {settlementNumber(area.gross)} m² · Desconto de vãos:{" "}
      {settlementNumber(area.openings)} m² · Área líquida:{" "}
      {settlementNumber(area.net)} m².
    </p>
  );
}
export function SettlementBudgetSummary({ model: m }: { model: Model }) {
  const r = m.report;
  const fields = ["percent", "yield", "price"] as const;
  return (
    <section
      className={styles.quantityGroup}
      aria-label="Material de assentamento"
    >
      <h3>Material de assentamento</h3>
      <p className={styles.note}>
        Área de paredes pelo comprimento × altura, descontando vãos, sem ajuste
        por espessura. Distribua 100% entre os produtos. Rendimentos são
        consumos por m² editáveis conforme sua execução. Saia do campo ou
        pressione Enter para salvar.
      </p>
      {!r.available ? (
        <p>{r.reason}</p>
      ) : (
        <>
          <Areas area={r} />
          {r.partial && (
            <p className={styles.errorText}>
              Assentamento parcial — há pendências geométricas.
            </p>
          )}
          <p aria-live="polite">
            {Object.values(m.errors).some((e) => e.percent)
              ? "Distribuição inválida — corrija os percentuais."
              : `Distribuição: ${lossPercentText(r.percent)}%. ${r.distributionValid ? "Completa." : r.percent < 10000 ? `Faltam ${lossPercentText(10000 - r.percent)}%.` : `Excede ${lossPercentText(r.percent - 10000)}%.`}`}
          </p>
          {!r.distributionValid && r.net > 0n && (
            <p>
              Configuração incompleta: a soma deve ser 100% para calcular
              consumos e custos.
            </p>
          )}
        </>
      )}
      <div
        className={styles.quantityTable}
        role="region"
        aria-label="Parâmetros de assentamento"
        tabIndex={0}
      >
        <table>
          <caption>Produtos de assentamento · parâmetros do projeto</caption>
          <thead>
            <tr>
              <th scope="col">Produto / embalagem</th>
              <th scope="col">Aplicação (%)</th>
              <th scope="col">Rendimento por m²</th>
              <th scope="col">Preço (R$/embalagem)</th>
            </tr>
          </thead>
          <tbody>
            {settlementCatalog.map((s) => (
              <tr key={s.key}>
                <th scope="row">
                  {s.label}
                  <br />
                  <span className={styles.note}>{s.package}</span>
                </th>
                {fields.map((field) => {
                  const id = `${s.key}:${field}`,
                    error = m.errors[s.key]?.[field];
                  const label =
                    field === "percent"
                      ? `Percentual de ${s.label} (%)`
                      : field === "yield"
                        ? `Rendimento de ${s.label} (${s.unit}/m²)`
                        : `Preço de ${s.label} (R$/${s.unit === "ml" ? "litro" : s.key === "polymer" ? "pacote de 3 kg" : "saco de 20 kg"})`;
                  const value = m.settings[s.key]?.[field];
                  return (
                    <td key={field}>
                      {field === "yield" && (
                        <span className={styles.note}>{s.unit}/m²</span>
                      )}
                      <input
                        className={styles.budgetPrice}
                        aria-label={label}
                        inputMode="decimal"
                        aria-invalid={!!error}
                        aria-describedby={
                          error ? `settlement-${id}` : undefined
                        }
                        disabled={m.blocked}
                        placeholder={
                          field === "price" ? "Não informado" : undefined
                        }
                        value={
                          m.drafts[id] ??
                          (field === "price"
                            ? priceText(value)
                            : field === "percent"
                              ? lossPercentText(value ?? 0)
                              : settlementNumber(
                                  BigInt(value ?? s.yield),
                                  1000n,
                                ).replace(/\./g, ""))
                        }
                        onChange={(e) =>
                          m.setDrafts((previous) => ({
                            ...previous,
                            [id]: e.target.value,
                          }))
                        }
                        onBlur={() => void m.confirm(s.key, field)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.currentTarget.blur();
                          }
                        }}
                      />
                      {error && (
                        <span
                          role="alert"
                          id={`settlement-${id}`}
                          className={styles.budgetPriceError}
                        >
                          {error}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.note}>
        Compra consolidada em embalagens inteiras, arredondada para cima uma vez
        por produto no projeto. O consumo calculado não inclui sobras de
        embalagem nem perdas adicionais. Rendimentos fornecidos pelo usuário são
        estimativas.
      </p>
      <div
        className={styles.quantityTable}
        role="region"
        aria-label="Quantitativos de assentamento"
        tabIndex={0}
      >
        <table>
          <caption>Consumo e compra global de assentamento</caption>
          <thead>
            <tr>
              <th scope="col">Produto</th>
              <th scope="col">Área destinada (m²)</th>
              <th scope="col">Consumo</th>
              <th scope="col">Embalagens</th>
              <th scope="col">Custo (R$)</th>
            </tr>
          </thead>
          <tbody>
            {settlementCatalog.map((s) => {
              const row = r.available
                ? r.rows.find((row) => row.key === s.key)
                : undefined;
              return (
                <tr key={s.key} data-settlement-key={s.key}>
                  <th scope="row">{s.label}</th>
                  <td>
                    {row?.area !== undefined
                      ? settlementNumber(row.area, assignedAreaScale)
                      : "—"}
                  </td>
                  <td>{row ? <Consumption row={row} /> : "—"}</td>
                  <td>{row?.packages?.toLocaleString("pt-BR") ?? "—"}</td>
                  <td>
                    {row?.cost !== undefined ? money(row.cost) : "—"}
                    {row?.error && (
                      <span className={styles.budgetPriceError}>
                        {row.error}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={4}>
                Subtotal de assentamento
                {r.available && r.partial ? " · parcial" : ""}
              </th>
              <td>
                {r.available && r.total !== undefined
                  ? money(r.total)
                  : "Incompleto"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {r.available && r.error && <p role="alert">{r.error}</p>}
    </section>
  );
}
export function SettlementBudgetDetail({
  model: m,
  floorId,
}: {
  model: Model;
  floorId: string;
}) {
  const r = m.report;
  const floor = r.available
    ? r.floors.find((f) => f.id === floorId)
    : undefined;
  if (!floor || !r.available) return null;
  return (
    <section
      className={styles.quantityFloorDetail}
      aria-label="Assentamento do pavimento consultado"
    >
      <h3>
        Assentamento · {floor.name} · {display(floor.level)} cm
        {r.partial ? " · Parcial" : ""}
      </h3>
      <Areas area={floor} />
      <p className={styles.note}>
        Custos rateados da compra global pela área líquida, incluindo sobras de
        embalagens. Não representam compra independente por pavimento.
      </p>
      <div
        className={styles.quantityTable}
        role="region"
        aria-label={`Assentamento de ${floor.name} · ${display(floor.level)} cm`}
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th scope="col">Produto</th>
              <th scope="col">Área destinada (m²)</th>
              <th scope="col">Consumo</th>
              <th scope="col">Custo rateado (R$)</th>
            </tr>
          </thead>
          <tbody>
            {floor.rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">
                  {settlementCatalog.find((s) => s.key === row.key)!.label}
                </th>
                <td>
                  {row.area !== undefined
                    ? settlementNumber(row.area, assignedAreaScale)
                    : "—"}
                </td>
                <td>
                  <Consumption row={row} />
                </td>
                <td>{row.cost !== undefined ? money(row.cost) : "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={3}>
                Subtotal de assentamento do pavimento
                {r.partial ? " · parcial" : ""}
              </th>
              <td>
                {floor.total !== undefined ? money(floor.total) : "Incompleto"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
