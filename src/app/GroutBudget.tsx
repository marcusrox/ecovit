import { useMemo, useState } from "react";
import { type Project, display } from "../domain/project";
import { money } from "../domain/budget";
import {
  groutBudget,
  groutFields,
  groutLabels,
  groutInfo,
  groutVolumeScale,
  parseGroutField,
  groutFieldText,
  type GroutField,
  type GroutRow,
  type GroutFloor,
} from "../domain/grout-budget";
import { withProjectPrice } from "../domain/price-references";
import { useStore } from "../state/store";
import { ReferencePriceButton } from "./PriceReferences";
import { useBudgetConfirmation } from "./BudgetConfirmation";
import styles from "../ui/App.module.css";

export function useGroutBudget(
  doc: Project,
  open: boolean,
  busy: boolean,
  readonly: boolean,
  priceSaving: boolean,
  setPriceSaving: (v: boolean) => void,
) {
  const [drafts, setDrafts] = useState<Partial<Record<GroutField, string>>>({});
  const settings = { ...doc.project.groutBudget };
  const errors: Partial<Record<GroutField, string>> = {};
  for (const key of groutFields) {
    if (drafts[key] === undefined) continue;
    try {
      const value = parseGroutField(key, drafts[key]!);
      if (value === undefined) delete settings[key];
      else settings[key] = value;
    } catch (e) {
      errors[key] = (e as Error).message;
    }
  }
  const signature = JSON.stringify([settings, errors]);
  const report = useMemo(() => {
    const [groutBudgetSettings, invalid] = JSON.parse(signature);
    return groutBudget(
      { ...doc, project: { ...doc.project, groutBudget: groutBudgetSettings } },
      !open || (busy && !priceSaving),
      invalid,
    );
  }, [doc, open, busy, priceSaving, signature]);
  const clearDraft = (key: GroutField, expected?: string) =>
    setDrafts((previous) => {
      if (expected !== undefined && previous[key] !== expected) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  async function confirm(key: GroutField) {
    const state = useStore.getState(),
      latest = state.doc,
      draft = drafts[key];
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
      value = parseGroutField(key, draft);
    } catch {
      return;
    }
    const next = withProjectPrice(latest, { group: "grout", key }, value);
    if (next !== latest) {
      setPriceSaving(true);
      try {
        await state.commit(next, "budget");
      } finally {
        setPriceSaving(false);
      }
    }
    clearDraft(key, draft);
  }
  return {
    report,
    settings,
    errors,
    drafts,
    setDrafts,
    clearDraft,
    confirm,
    blocked: busy || readonly,
  };
}
type Model = ReturnType<typeof useGroutBudget>;
function numberText(n: bigint | undefined, scale: bigint, decimals?: number) {
  if (n !== undefined && decimals !== undefined) {
    const factor = 10n ** BigInt(decimals),
      rounded = (n * factor + scale / 2n) / scale;
    return `${(rounded / factor).toLocaleString("pt-BR")},${String(rounded % factor).padStart(decimals, "0")}`;
  }
  if (n === undefined) return "Indisponível";
  // All scales are powers of ten: preserve exact sums across applications/floors.
  const fraction = String(n % scale)
    .padStart(String(scale).length - 1, "0")
    .replace(/0+$/, "");
  return `${(n / scale).toLocaleString("pt-BR")}${fraction ? `,${fraction}` : ""}`;
}

function Results({
  rows,
  total,
  cost,
  caption,
}: {
  rows: GroutRow[];
  total?: bigint;
  cost?: number;
  caption: string;
}) {
  return (
    <>
      <div
        className={styles.quantityTable}
        role="region"
        aria-label={caption}
        tabIndex={0}
      >
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th>Aplicação</th>
              <th>Comprimento (m)</th>
              <th>Consumo base (L)</th>
              <th>Com perdas (L)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.application}>
                <th scope="row">
                  {r.application === "vertical"
                    ? "Grautes verticais"
                    : "Canaletas horizontais"}
                </th>
                <td>{numberText(r.length, 10000n)}</td>
                <td>{numberText(r.base, groutVolumeScale, 2)}</td>
                <td>
                  {numberText(r.estimated, groutVolumeScale, 2)}
                  {r.error && (
                    <span className={styles.errorText}> · {r.error}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Total estimado:{" "}
        <strong>
          {numberText(total, groutVolumeScale, 2)} L ·{" "}
          {numberText(total, groutVolumeScale * 1000n)} m³
        </strong>
        . Custo:{" "}
        <strong>{cost === undefined ? "Incompleto" : money(cost)}</strong>.
      </p>
    </>
  );
}
export function GroutBudgetSummary({ model: m }: { model: Model }) {
  const track = useBudgetConfirmation();
  return (
    <section
      className={styles.quantityGroup}
      data-budget-section="grout"
      aria-label="Graute de preenchimento"
    >
      <h3 tabIndex={-1}>Graute de preenchimento — microconcreto</h3>
      <p className={styles.note}>{groutInfo}</p>
      <p className={styles.note}>
        Consumos base, sem perdas embutidas. Perdas verticais e horizontais são
        aplicadas separadamente, uma única vez. Não inclui ferragens, mão de
        obra ou frete.
      </p>
      <div
        className={`${styles.quantityTable} ${styles.groutParameters}`}
        role="region"
        aria-label="Parâmetros do microconcreto"
        tabIndex={0}
      >
        <table>
          <caption>Microconcreto · parâmetros do projeto</caption>
          <thead>
            <tr>
              <th scope="col">Consumo / preço</th>
              <th scope="col">Perdas</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ["verticalConsumption", "verticalLoss"],
                ["horizontalConsumption", "horizontalLoss"],
                ["price"],
              ] as GroutField[][]
            ).map((keys, index) => (
              <tr key={index}>
                {keys.map((key) => {
                  const id = `grout-${key}`,
                    error = m.errors[key];
                  return (
                    <td key={key}>
                      <label
                        className={styles.groutParameterLabel}
                        htmlFor={id}
                      >
                        {groutLabels[key]}
                      </label>
                      <span className={styles.groutValue}>
                        <input
                          id={id}
                          aria-label={groutLabels[key]}
                          data-budget-target={`grout:${key}`}
                          inputMode="decimal"
                          placeholder="Não informado"
                          disabled={m.blocked}
                          value={
                            m.drafts[key] ??
                            (key.endsWith("Consumption") &&
                            m.settings[key] !== undefined
                              ? numberText(
                                  BigInt(m.settings[key]!),
                                  1000n,
                                  2,
                                ).replaceAll(".", "")
                              : groutFieldText(key, m.settings[key]))
                          }
                          aria-invalid={!!error}
                          aria-describedby={error ? `${id}-error` : undefined}
                          onChange={(e) =>
                            m.setDrafts((previous) => ({
                              ...previous,
                              [key]: e.target.value,
                            }))
                          }
                          onBlur={() => track(m.confirm(key))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                          }}
                        />
                        <ReferencePriceButton
                          item={{ group: "grout", key }}
                          clearDraft={() => m.clearDraft(key)}
                        />
                      </span>
                      {error && (
                        <span
                          id={`${id}-error`}
                          role="alert"
                          className={styles.errorText}
                        >
                          {error}
                        </span>
                      )}
                    </td>
                  );
                })}
                {keys.length === 1 && <td />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {m.report.available ? (
        <>
          {m.report.partial && (
            <p className={styles.errorText}>
              Estimativa parcial — há pendências geométricas.
            </p>
          )}
          <Results
            rows={m.report.rows}
            total={m.report.total}
            cost={m.report.cost}
            caption="Microconcreto · resumo do projeto"
          />
          {m.report.error && (
            <p className={styles.errorText}>{m.report.error}</p>
          )}
        </>
      ) : (
        <p>{m.report.reason}</p>
      )}
    </section>
  );
}
export function GroutBudgetDetail({
  model: m,
  floorId,
}: {
  model: Model;
  floorId: string;
}) {
  if (!m.report.available) return null;
  const floor: GroutFloor | undefined = m.report.floors.find(
    (f) => f.id === floorId,
  );
  if (!floor) return null;
  return (
    <section className={styles.quantityGroup}>
      <h3>
        Graute de preenchimento · {floor.name} · {display(floor.level)} cm
      </h3>
      {floor.partial && <p>Estimativa parcial.</p>}
      <Results
        rows={floor.rows}
        total={floor.total}
        cost={floor.cost}
        caption={`Microconcreto · ${floor.name} · ${display(floor.level)} cm`}
      />
    </section>
  );
}
