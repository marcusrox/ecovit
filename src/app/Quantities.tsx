import { useEffect, useMemo, useRef, useState } from "react";
import {
  quantities,
  estimateLosses,
  parseLossPercent,
  pieceKinds,
  pieceLabels,
  type Counts,
} from "../domain/quantities";
import { display, type Project } from "../domain/project";
import {
  budgetCosts,
  parseUnitPrice,
  priceText,
  money,
} from "../domain/budget";
import { useStore } from "../state/store";
import { Icon } from "../ui/Icon";
import styles from "../ui/App.module.css";

const number = (n: number) => n.toLocaleString("pt-BR");
function CountCells({ counts }: { counts: Counts }) {
  return (
    <>
      {pieceKinds.map((k) => (
        <td key={k}>{number(counts[k])}</td>
      ))}
      <td>
        <strong>{number(counts.total)}</strong>
      </td>
    </>
  );
}

export function Quantities({
  doc,
  diagnostics,
}: {
  doc: Project;
  diagnostics: () => void;
}) {
  const busy = useStore((s) => s.busy);
  const readonly = useStore((s) => s.readonly);
  const saved = useStore((s) => s.saved);
  const saveMessage = useStore((s) => s.message);
  const [priceSaving, setPriceSaving] = useState(false);
  const [drafts, setDrafts] = useState<
    Partial<Record<(typeof pieceKinds)[number], string>>
  >({});
  const activeFloorId = useStore((s) => s.activeFloorId);
  const [open, setOpen] = useState(false);
  const [percent, setPercent] = useState("0");
  const [floorId, setFloorId] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const report = useMemo(() => {
    if (!open) return { available: false as const, reason: "" };
    try {
      return quantities(doc, busy && !priceSaving);
    } catch (e) {
      return { available: false as const, reason: (e as Error).message };
    }
  }, [doc, busy, priceSaving, open]);
  useEffect(() => {
    const node = dialog.current!;
    if (open) {
      node.showModal();
      heading.current?.focus();
    } else if (node.open) {
      node.close();
      restoreFocus.current = true;
    }
  }, [open]);
  useEffect(() => {
    if (!open && !busy && restoreFocus.current) {
      trigger.current?.focus();
      restoreFocus.current = false;
    }
  }, [open, busy]);
  const selectedFloor = report.available
    ? (report.floors.find((f) => f.id === floorId) ??
      report.floors.find((f) => f.id === activeFloorId) ??
      report.floors[0])
    : undefined;
  let estimate: ReturnType<typeof estimateLosses> | undefined;
  let lossError = "";
  if (report.available) {
    try {
      estimate = estimateLosses(report.counts, parseLossPercent(percent));
    } catch (e) {
      lossError = (e as Error).message;
    }
  }
  const priceErrors: Partial<Record<(typeof pieceKinds)[number], string>> = {};
  const previewPrices = { ...doc.project.unitPrices };
  for (const kind of pieceKinds) {
    if (drafts[kind] === undefined) continue;
    try {
      const value = parseUnitPrice(drafts[kind]!);
      if (value === undefined) delete previewPrices[kind];
      else previewPrices[kind] = value;
    } catch (e) {
      priceErrors[kind] = (e as Error).message;
    }
  }
  let budget: ReturnType<typeof budgetCosts> | undefined,
    budgetError = "";
  if (estimate) {
    try {
      budget = budgetCosts(estimate.estimated, previewPrices);
    } catch (e) {
      budgetError = (e as Error).message;
    }
  }
  const confirmPrice = async (kind: (typeof pieceKinds)[number]) => {
    const state = useStore.getState(),
      latest = state.doc;
    if (
      !latest ||
      latest.project.id !== doc.project.id ||
      state.busy ||
      state.readonly ||
      drafts[kind] === undefined
    )
      return;
    let value: number | undefined;
    try {
      value = parseUnitPrice(drafts[kind]!);
    } catch {
      return;
    }
    if (value !== latest.project.unitPrices?.[kind]) {
      const prices = { ...latest.project.unitPrices };
      if (value === undefined) delete prices[kind];
      else prices[kind] = value;
      const { unitPrices, ...project } = latest.project;
      void unitPrices;
      setPriceSaving(true);
      try {
        await state.commit(
          {
            ...latest,
            project: {
              ...project,
              ...(Object.keys(prices).length ? { unitPrices: prices } : {}),
            },
          },
          "budget",
        );
      } finally {
        setPriceSaving(false);
      }
    }
    setDrafts((previous) => {
      const next = { ...previous };
      delete next[kind];
      return next;
    });
  };
  const invalidPrices = Object.keys(priceErrors).length > 0;
  return (
    <>
      <button
        ref={trigger}
        className={styles.iconText}
        disabled={busy}
        // Focus the dialog after opening, so committing a name on blur cannot swallow the click.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          // Cancel local canvas gestures too; keep its mounted camera and confirmed selection.
          window.dispatchEvent(new Event("blur"));
          useStore.getState().inspect({
            slabDraft: null,
            slabEditing: false,
            pendingOpening: null,
            preview: null,
            groutCell: null,
          });
          setOpen(true);
        }}
      >
        <Icon name="quantities" /> Orçamento
      </button>
      <dialog
        ref={dialog}
        className={`${styles.releasePage} ${styles.quantityScreen}`}
        aria-labelledby="quantities-title"
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
      >
        <div className={styles.releaseHeader}>
          <div>
            <h1 ref={heading} tabIndex={-1} id="quantities-title">
              Orçamento
            </h1>
            <p>{doc.project.name}</p>
          </div>
          <button className={styles.iconText} onClick={() => setOpen(false)}>
            <Icon name="left" /> Voltar ao desenho
          </button>
        </div>
        <div className={styles.quantityContent}>
          <p>
            Base nominal: {display(doc.project.base.length)} ×{" "}
            {display(doc.project.base.width)} ×{" "}
            {display(doc.project.base.height)} cm. Quantidades em unidades.
          </p>
          <p className={styles.note}>
            Quantidade geométrica nominal. Consumo de peças-base para preparação
            não determinado: meios e canaletas não são automaticamente cortes de
            inteiros. Lajes, concreto, graute e aço não incluídos.
          </p>
          {!report.available && <p role="alert">{report.reason}</p>}
          <>
            <h2>Resumo do projeto</h2>
            <p>
              {!report.available
                ? "Quantitativos indisponíveis"
                : report.partial
                  ? "Parcial — há pendências"
                  : "Composição atualizada"}
            </p>
            {report.available && report.partial && (
              <button
                onClick={() => {
                  setOpen(false);
                  diagnostics();
                }}
              >
                Ver diagnósticos
              </button>
            )}
            <label className={styles.quantityLoss}>
              Perdas (%)
              <input
                aria-label="Perdas (%)"
                inputMode="decimal"
                value={percent}
                aria-invalid={!!lossError}
                aria-describedby="loss-note"
                onChange={(e) => setPercent(e.target.value)}
              />
            </label>
            <p id="loss-note" className={styles.note}>
              Opcional. Percentual da sessão, não salvo no projeto. Aplicado por
              tipo sobre o total do projeto, com arredondamento para cima.
              Custos usam o total estimado, incluindo perdas. Preços unitários
              ficam salvos no projeto; ao reabri-lo, as perdas voltam a 0%. Saia
              do campo de preço ou pressione Enter para salvar a edição.
            </p>
            <p role="status" aria-live="polite">
              {priceSaving || saved === "saving"
                ? "Salvando preços…"
                : saved === "saved"
                  ? "Salvo · preços no projeto"
                  : `Não salvo. ${saveMessage} Feche o orçamento para acessar a recuperação do salvamento.`}
            </p>
            {lossError && (
              <p role="alert" className={styles.errorText}>
                {lossError}
              </p>
            )}
            <div
              className={styles.quantityTable}
              tabIndex={0}
              role="region"
              aria-label="Resumo do projeto"
            >
              <table>
                <caption>
                  {report.available && report.partial
                    ? "Estimativa parcial do projeto"
                    : "Peças do projeto"}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Tipo</th>
                    <th scope="col">Geométrica</th>
                    <th scope="col">Acréscimo de perdas</th>
                    <th scope="col">Total estimado</th>
                    <th scope="col">Preço unitário (R$)</th>
                    <th scope="col">Custo (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...pieceKinds, "total" as const].map((kind) => (
                    <tr key={kind}>
                      <th scope="row">
                        {kind === "total"
                          ? "Total de peças"
                          : pieceLabels[kind]}
                      </th>
                      <td>
                        {report.available ? number(report.counts[kind]) : "—"}
                      </td>
                      <td>{estimate ? number(estimate.added[kind]) : "—"}</td>
                      <td>
                        {estimate ? number(estimate.estimated[kind]) : "—"}
                      </td>
                      <td>
                        {kind === "total" ? (
                          "—"
                        ) : (
                          <>
                            <input
                              className={styles.budgetPrice}
                              aria-label={`Preço unitário de ${pieceLabels[kind]}`}
                              aria-invalid={!!priceErrors[kind]}
                              aria-describedby={
                                priceErrors[kind]
                                  ? `price-error-${kind}`
                                  : undefined
                              }
                              inputMode="decimal"
                              placeholder="Não informado"
                              value={
                                drafts[kind] ??
                                priceText(doc.project.unitPrices?.[kind])
                              }
                              disabled={busy || readonly}
                              onChange={(e) =>
                                setDrafts((previous) => ({
                                  ...previous,
                                  [kind]: e.target.value,
                                }))
                              }
                              onBlur={() => void confirmPrice(kind)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  e.currentTarget.blur();
                                }
                              }}
                            />
                            {priceErrors[kind] && (
                              <span
                                role="alert"
                                id={`price-error-${kind}`}
                                className={styles.budgetPriceError}
                              >
                                {priceErrors[kind]}
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td>
                        {kind === "total"
                          ? !estimate
                            ? "—"
                            : !invalidPrices && budget?.total !== undefined
                              ? money(budget.total)
                              : "Incompleto"
                          : !priceErrors[kind] &&
                              budget?.costs[kind] !== undefined
                            ? money(budget.costs[kind]!)
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {budgetError && <p role="alert">{budgetError}</p>}
            {estimate &&
              (invalidPrices || budget?.total === undefined) &&
              !budgetError && (
                <p className={styles.note}>
                  Orçamento incompleto: informe preços válidos para os tipos com
                  peças. Preço não informado é diferente de zero.
                </p>
              )}
            {report.available && (
              <>
                <h2>Detalhamento por pavimento</h2>
                <label className={styles.quantityLoss}>
                  Pavimento da consulta
                  <select
                    aria-label="Pavimento da consulta"
                    value={selectedFloor?.id ?? ""}
                    onChange={(e) => setFloorId(e.target.value)}
                  >
                    {report.floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} · {display(f.level)} cm
                        {f.partial ? " · Parcial" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedFloor && (
                  <>
                    <p>
                      {selectedFloor.name} · {display(selectedFloor.level)} cm
                      {selectedFloor.partial
                        ? " · Parcial — há pendências"
                        : ""}
                      . Quantidades geométricas, sem perdas.
                    </p>
                    <div
                      className={styles.quantityTable}
                      tabIndex={0}
                      role="region"
                      aria-label="Peças por fiada"
                    >
                      <table>
                        <caption>Fiadas locais</caption>
                        <thead>
                          <tr>
                            <th scope="col">Fiada</th>
                            {pieceKinds.map((kind) => (
                              <th scope="col" key={kind}>
                                {pieceLabels[kind]}
                              </th>
                            ))}
                            <th scope="col">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedFloor.courses.map((c) => (
                            <tr key={c.number}>
                              <th scope="row">{c.number}</th>
                              <CountCells counts={c.counts} />
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <th scope="row">Total do pavimento</th>
                            <CountCells counts={selectedFloor.counts} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    {!selectedFloor.courses.length && (
                      <p>Este pavimento não tem fiadas. Quantidades zero.</p>
                    )}
                  </>
                )}
              </>
            )}
          </>
        </div>
      </dialog>
    </>
  );
}
