import { useMemo, useState } from "react";
import type { Project } from "../domain/project";
import { display } from "../domain/project";
import { money, priceText } from "../domain/budget";
import { lossPercentText } from "../domain/quantities";
import {
  assignedAreaScale,
  settlementNumber,
} from "../domain/settlement-budget";
import {
  surfaceBudget,
  surfaceProducts,
  parseSurfaceField,
  type SurfaceErrors,
  type SurfaceField,
  type SurfaceKey,
  type SurfaceRow,
} from "../domain/surface-budget";
import { withProjectPrice } from "../domain/price-references";
import { useStore } from "../state/store";
import { ReferencePriceButton } from "./PriceReferences";
import { useBudgetConfirmation } from "./BudgetConfirmation";
import styles from "../ui/App.module.css";

export function useSurfaceBudget(
  doc: Project,
  open: boolean,
  busy: boolean,
  readonly: boolean,
  priceSaving: boolean,
  setPriceSaving: (value: boolean) => void,
) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const settings = { ...doc.project.surface };
  const errors: SurfaceErrors = {};
  for (const { key } of surfaceProducts) {
    settings[key] = { ...settings[key] };
    for (const field of ["percent", "yield", "price"] as const) {
      const draft = drafts[`${key}:${field}`];
      if (draft === undefined) continue;
      try {
        const value = parseSurfaceField(field, draft);
        if (value === undefined) delete settings[key]![field];
        else settings[key]![field] = value;
        if (field === "price") delete settings[key]!.referenceDescription;
      } catch (e) {
        errors[key] = { ...errors[key], [field]: (e as Error).message };
      }
    }
  }
  const signature = JSON.stringify([settings, errors]);
  const report = useMemo(() => {
    const [surface, invalid] = JSON.parse(signature);
    return surfaceBudget(
      { ...doc, project: { ...doc.project, surface } },
      !open || (busy && !priceSaving),
      invalid,
    );
  }, [doc, open, busy, priceSaving, signature]);
  const confirm = async (key: SurfaceKey, field: SurfaceField) => {
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
      value = parseSurfaceField(field, draft);
    } catch {
      return;
    }
    const current =
      latest.project.surface?.[key]?.[field] ??
      (field === "percent" ? 0 : undefined);
    let next = latest;
    if (field === "price")
      next = withProjectPrice(latest, { group: "surface", key }, value);
    else if (current !== value) {
      const entry = { ...latest.project.surface?.[key] };
      if (value === undefined) delete entry[field];
      else entry[field] = value;
      next = {
        ...latest,
        project: {
          ...latest.project,
          surface: { ...latest.project.surface, [key]: entry },
        },
      };
    }
    if (next !== latest) {
      setPriceSaving(true);
      try {
        await state.commit(next, "budget");
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
    settings,
    errors,
    drafts,
    setDrafts,
    confirm,
    blocked: busy || readonly,
  };
}
type Model = ReturnType<typeof useSurfaceBudget>;
const areaText = (area: bigint | undefined) =>
  area === undefined
    ? "Indisponível"
    : `${settlementNumber(area, assignedAreaScale)} m²`;

export function SurfaceBudgetSummary({ model: m }: { model: Model }) {
  const trackConfirmation = useBudgetConfirmation();
  const { area } = m.report;
  return (
    <section
      className={styles.quantityGroup}
      aria-label="Impermeabilizante e rejunte"
    >
      <h3>Impermeabilizante e rejunte</h3>
      <p className={styles.note}>
        Área das duas faces das paredes, descontando portas, janelas e vãos. Os
        percentuais são independentes e estimados por você: 50% não seleciona
        automaticamente paredes externas. Informe o rendimento de uma embalagem
        para o tratamento completo, incluindo todas as demãos previstas. Não
        inclui instalação ou mão de obra.
      </p>
      <p>
        Área-base das duas faces:{" "}
        {area.available
          ? `${settlementNumber(area.net * 2n)} m²`
          : "Indisponível"}
        .
      </p>
      {!area.available && <p>{area.reason}</p>}
      {area.available && area.partial && (
        <p className={styles.errorText}>
          Estimativa parcial — há pendências geométricas.
        </p>
      )}
      <p className={styles.note}>
        Confira se preço e rendimento correspondem ao mesmo produto e embalagem.
        Você pode alterar o preço de referência conforme sua compra.
      </p>
      <div
        className={styles.quantityTable}
        role="region"
        aria-label="Parâmetros de impermeabilizante e rejunte"
        tabIndex={0}
      >
        <table>
          <caption>Impermeabilizante e rejunte · parâmetros do projeto</caption>
          <thead>
            <tr>
              <th scope="col">Produto</th>
              <th scope="col">Aplicação (%)</th>
              <th scope="col">Rendimento (m²/embalagem)</th>
              <th scope="col">Preço (R$/embalagem)</th>
            </tr>
          </thead>
          <tbody>
            {surfaceProducts.map(({ key, label }) => (
              <tr key={key}>
                <th scope="row">
                  {label}
                  {m.settings[key]?.referenceDescription && (
                    <p className={styles.note}>
                      Referência: {m.settings[key]!.referenceDescription}
                    </p>
                  )}
                </th>
                {(["percent", "yield", "price"] as const).map((field) => {
                  const id = `${key}:${field}`,
                    error = m.errors[key]?.[field];
                  const value = m.settings[key]?.[field];
                  const text =
                    field === "percent"
                      ? lossPercentText(value ?? 0)
                      : field === "price"
                        ? priceText(value)
                        : value === undefined
                          ? ""
                          : settlementNumber(BigInt(value), 1000n);
                  const input = (
                    <input
                      className={styles.budgetPrice}
                      aria-label={`${field === "percent" ? "Percentual de" : field === "yield" ? "Rendimento de" : "Preço de"} ${label} (${field === "percent" ? "%" : field === "yield" ? "m²/embalagem" : "R$/embalagem"})`}
                      inputMode="decimal"
                      placeholder="Não informado"
                      value={m.drafts[id] ?? text}
                      disabled={m.blocked}
                      aria-invalid={!!error}
                      aria-describedby={
                        error ? `surface-error-${key}-${field}` : undefined
                      }
                      onChange={(e) =>
                        m.setDrafts((previous) => ({
                          ...previous,
                          [id]: e.target.value,
                        }))
                      }
                      onBlur={() => trackConfirmation(m.confirm(key, field))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                    />
                  );
                  return (
                    <td key={field}>
                      {field === "price" ? (
                        <span className={styles.priceField}>
                          {input}
                          <ReferencePriceButton
                            item={{ group: "surface", key }}
                            clearDraft={() =>
                              m.setDrafts((previous) => {
                                const next = { ...previous };
                                delete next[id];
                                return next;
                              })
                            }
                          />
                        </span>
                      ) : (
                        input
                      )}
                      {error && (
                        <span
                          id={`surface-error-${key}-${field}`}
                          role="alert"
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
      <div
        className={styles.quantityTable}
        role="region"
        aria-label="Compra de impermeabilizante e rejunte"
        tabIndex={0}
      >
        <table>
          <caption>Compra consolidada do projeto</caption>
          <thead>
            <tr>
              <th scope="col">Produto</th>
              <th scope="col">Área de aplicação</th>
              <th scope="col">Embalagens para compra</th>
              <th scope="col">Custo (R$)</th>
            </tr>
          </thead>
          <tbody>
            {m.report.rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">
                  {surfaceProducts.find((p) => p.key === row.key)!.label}
                </th>
                <td>{areaText(row.area)}</td>
                <td>
                  {row.packages?.toLocaleString("pt-BR") ?? "Indisponível"}
                </td>
                <td>
                  {row.cost === undefined ? "Incompleto" : money(row.cost)}
                  {row.error && (
                    <span className={styles.budgetPriceError}>{row.error}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function SurfaceBudgetDetail({
  model: m,
  floorId,
}: {
  model: Model;
  floorId: string;
}) {
  const floor = m.report.floors.find((f) => f.id === floorId);
  if (!floor) return null;
  return (
    <section
      className={styles.quantityFloorDetail}
      aria-label={`Impermeabilizante e rejunte de ${floor.name} · ${display(floor.level)} cm`}
    >
      <h3>
        Impermeabilizante e rejunte · {floor.name} · {display(floor.level)} cm
      </h3>
      <p className={styles.note}>
        Custos rateados da compra global pela área de aplicação, incluindo
        sobras. Não representam compra independente por pavimento.
        {m.report.partial
          ? " Estimativa parcial — há pendências geométricas."
          : ""}
      </p>
      <div
        className={styles.quantityTable}
        role="region"
        aria-label={`Rateio de impermeabilizante e rejunte de ${floor.name}`}
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th scope="col">Produto</th>
              <th scope="col">Área de aplicação</th>
              <th scope="col">Custo rateado (R$)</th>
            </tr>
          </thead>
          <tbody>
            {floor.rows.map((row: SurfaceRow) => (
              <tr key={row.key}>
                <th scope="row">
                  {surfaceProducts.find((p) => p.key === row.key)!.label}
                </th>
                <td>{areaText(row.area)}</td>
                <td>
                  {row.cost === undefined ? "Incompleto" : money(row.cost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
