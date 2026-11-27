import { useBudgetConfirmation } from "./BudgetConfirmation";
import { useMemo, useState } from "react";
import { display, type Project } from "../domain/project";
import { money, parseUnitPrice, priceText } from "../domain/budget";
import {
  openingBudget,
  openingOptionLabel,
  openingMaterialLabel,
  withOpeningPrice,
  type OpeningBudgetRow,
  type OpeningBudgetReport,
} from "../domain/opening-budget";
import { useStore } from "../state/store";
import styles from "../ui/App.module.css";
import { withProjectPrice, priceItemSchema } from "../domain/price-references";
import { ReferencePriceButton } from "./PriceReferences";

export function useOpeningBudget(
  doc: Project,
  busy: boolean,
  readonly: boolean,
) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const errors: Record<string, string> = {};
  let preview = doc;
  for (const row of openingBudget(doc).rows) {
    if (drafts[row.key] === undefined) continue;
    try {
      preview = withOpeningPrice(
        preview,
        row.option,
        parseUnitPrice(drafts[row.key]),
      );
    } catch (e) {
      errors[row.key] = (e as Error).message;
    }
  }
  const signature = JSON.stringify([preview.project.openingPrices, errors]);
  const report = useMemo(() => {
    try {
      const [openingPrices, invalid] = JSON.parse(signature);
      return {
        available: true as const,
        ...openingBudget(
          { ...doc, project: { ...doc.project, openingPrices } },
          invalid,
        ),
      };
    } catch (e) {
      return { available: false as const, reason: (e as Error).message };
    }
  }, [doc, signature]);
  const confirm = async (row: OpeningBudgetRow) => {
    const state = useStore.getState(),
      latest = state.doc;
    const draft = drafts[row.key];
    if (
      !latest ||
      latest.project.id !== doc.project.id ||
      state.busy ||
      state.readonly ||
      draft === undefined
    )
      return;
    try {
      const price = parseUnitPrice(draft);
      const next = withProjectPrice(
        latest,
        priceItemSchema.parse({ group: "openings", option: row.option }),
        price,
      );
      if (next !== latest) await state.commit(next, "budget");
      setDrafts((previous) => {
        if (previous[row.key] !== draft) return previous;
        const next = { ...previous };
        delete next[row.key];
        return next;
      });
    } catch {
      /* Invalid input remains a draft with its associated error. */
    }
  };
  return { report, drafts, setDrafts, confirm, blocked: busy || readonly };
}
type Model = ReturnType<typeof useOpeningBudget>;
function Identity({ row }: { row: OpeningBudgetRow }) {
  return (
    <>
      <th scope="row">
        {openingOptionLabel(row.option)}
        <br />
        <span className={styles.note}>
          {openingMaterialLabel(row.option.material)}
        </span>
      </th>
      <td>
        {display(row.option.width)} × {display(row.option.height)} cm
      </td>
      <td>{row.count.toLocaleString("pt-BR")}</td>
    </>
  );
}
export function OpeningBudgetSummary({ model: m }: { model: Model }) {
  const trackConfirmation = useBudgetConfirmation();
  const r = m.report;
  return (
    <section
      className={styles.quantityGroup}
      aria-label="Esquadrias do projeto"
      data-budget-section="openings"
    >
      <h3 tabIndex={-1}>Esquadrias do projeto</h3>
      <p className={styles.note}>
        Portas e janelas por tipo, tamanho e material. Dimensões de referência
        do vão bruto, não de fabricação. Informe o preço por conjunto completo:
        para portas de madeira, inclua folha, batente, guarnições e ferragens
        previstas; para as demais portas e janelas, inclua marco, folhas,
        ferragens e vidro, quando aplicáveis. Não inclua instalação. Os preços
        de referência seguem a mesma composição. Defina tipo e material nas
        propriedades do elemento.
      </p>
      {!r.available ? (
        <p role="alert">{r.reason}</p>
      ) : (
        <>
          {!r.rows.length && <p>Este projeto não tem portas ou janelas.</p>}
          <div
            className={styles.quantityTable}
            role="region"
            aria-label="Orçamento de esquadrias"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Esquadria / material</th>
                  <th scope="col">Vão bruto (L × H)</th>
                  <th scope="col">Quantidade</th>
                  <th scope="col">Preço do conjunto (R$/un.)</th>
                  <th scope="col">Custo (R$)</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((row, i) => (
                  <tr key={row.key}>
                    <Identity row={row} />
                    <td>
                      {row.option.type && row.option.material ? (
                        <span className={styles.priceField}>
                          <input
                            data-budget-target={`openings:${row.key}`}
                            className={styles.budgetPrice}
                            aria-label={`Preço de ${openingOptionLabel(row.option)} · ${display(row.option.width)} × ${display(row.option.height)} cm · ${openingMaterialLabel(row.option.material)} (R$/unidade)`}
                            inputMode="decimal"
                            disabled={m.blocked}
                            placeholder="Não informado"
                            aria-invalid={
                              m.drafts[row.key] !== undefined && !!row.error
                            }
                            aria-describedby={
                              row.error ? `opening-price-error-${i}` : undefined
                            }
                            value={m.drafts[row.key] ?? priceText(row.price)}
                            onChange={(e) =>
                              m.setDrafts((previous) => ({
                                ...previous,
                                [row.key]: e.target.value,
                              }))
                            }
                            onBlur={() => trackConfirmation(m.confirm(row))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.currentTarget.blur();
                              }
                            }}
                          />
                          <ReferencePriceButton
                            item={priceItemSchema.parse({
                              group: "openings",
                              option: row.option,
                            })}
                            clearDraft={() =>
                              m.setDrafts((previous) => {
                                const next = { ...previous };
                                delete next[row.key];
                                return next;
                              })
                            }
                          />
                        </span>
                      ) : (
                        "Não configurado"
                      )}
                    </td>
                    <td>
                      {row.cost !== undefined ? money(row.cost) : "—"}
                      {row.error && (
                        <span
                          id={`opening-price-error-${i}`}
                          className={styles.budgetPriceError}
                        >
                          {row.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={2} scope="row">
                    Subtotal de esquadrias
                  </th>
                  <td>{r.count.toLocaleString("pt-BR")}</td>
                  <td>—</td>
                  <td>
                    {r.total !== undefined ? money(r.total) : "Incompleto"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {r.error && <p role="alert">{r.error}</p>}
        </>
      )}
    </section>
  );
}
export function OpeningBudgetDetail({
  report,
  floorId,
}: {
  report: OpeningBudgetReport;
  floorId: string;
}) {
  const f = report.floors.find((floor) => floor.id === floorId);
  if (!f) return null;
  return (
    <section
      className={styles.quantityFloorDetail}
      aria-label={`Esquadrias de ${f.name} · ${display(f.level)} cm`}
    >
      <h3>
        Esquadrias · {f.name} · {display(f.level)} cm
      </h3>
      {!f.rows.length && <p>Este pavimento não tem portas ou janelas.</p>}
      <div
        className={styles.quantityTable}
        role="region"
        aria-label={`Custos de esquadrias de ${f.name}`}
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th scope="col">Esquadria / material</th>
              <th scope="col">Vão bruto (L × H)</th>
              <th scope="col">Quantidade</th>
              <th scope="col">Preço do conjunto (R$/un.)</th>
              <th scope="col">Custo (R$)</th>
            </tr>
          </thead>
          <tbody>
            {f.rows.map((row) => (
              <tr key={row.key}>
                <Identity row={row} />
                <td>{row.price !== undefined ? money(row.price) : "—"}</td>
                <td>
                  {row.cost !== undefined ? money(row.cost) : "—"}
                  {row.error && (
                    <span className={styles.budgetPriceError}>{row.error}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={2} scope="row">
                Subtotal de esquadrias do pavimento
              </th>
              <td>{f.count.toLocaleString("pt-BR")}</td>
              <td>—</td>
              <td>{f.total !== undefined ? money(f.total) : "Incompleto"}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {f.error && <p role="alert">{f.error}</p>}
    </section>
  );
}
