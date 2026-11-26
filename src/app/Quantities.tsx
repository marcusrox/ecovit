import { useEffect, useMemo, useRef, useState } from "react";
import {
  quantities,
  estimateLosses,
  parseLossPercent,
  lossPercentText,
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
  materialCosts,
} from "../domain/budget";
import { useStore } from "../state/store";
import { Icon } from "../ui/Icon";
import { withProjectPrice } from "../domain/price-references";
import {
  BudgetReferenceContext,
  useBudgetReferences,
  ReferencePriceButton,
} from "./PriceReferences";
import {
  useSteelBudget,
  SteelBudgetSummary,
  SteelBudgetDetail,
} from "./SteelBudget";
import styles from "../ui/App.module.css";
import {
  useOpeningBudget,
  OpeningBudgetSummary,
  OpeningBudgetDetail,
} from "./OpeningBudget";
import {
  useSettlementBudget,
  SettlementBudgetSummary,
  SettlementBudgetDetail,
} from "./SettlementBudget";

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
  const references = useBudgetReferences(
    doc,
    open,
    busy,
    readonly,
    saved,
    setPriceSaving,
  );
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const exportController = useRef<AbortController | null>(null);
  useEffect(() => () => exportController.current?.abort(), []);
  useEffect(() => {
    if (!open) exportController.current?.abort();
  }, [open]);
  const [lossDraft, setLossDraft] = useState<string>();
  const percent =
    lossDraft ?? lossPercentText(doc.project.brickLossPercent ?? 0);
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
  const consultedFloors = report.available
    ? floorId === "all"
      ? report.floors
      : selectedFloor
        ? [selectedFloor]
        : []
    : [];
  const documentFloors = [...doc.model.floors].sort(
    (a, b) => a.level - b.level || a.id.localeCompare(b.id),
  );
  const selectedDocumentFloor =
    documentFloors.find((f) => f.id === floorId) ??
    documentFloors.find((f) => f.id === activeFloorId) ??
    documentFloors[0];
  const consultedDocumentFloors =
    floorId === "all" ? documentFloors : [selectedDocumentFloor];
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
    const next = withProjectPrice(
      latest,
      { group: "bricks", key: kind },
      value,
    );
    if (next !== latest) {
      setPriceSaving(true);
      try {
        await state.commit(next, "budget");
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
  const confirmLoss = async () => {
    const state = useStore.getState(),
      latest = state.doc;
    if (
      !latest ||
      latest.project.id !== doc.project.id ||
      state.busy ||
      state.readonly ||
      lossDraft === undefined
    )
      return;
    let value: number;
    try {
      value = parseLossPercent(lossDraft);
    } catch {
      return;
    }
    if (value !== (latest.project.brickLossPercent ?? 0)) {
      setPriceSaving(true);
      try {
        await state.commit(
          {
            ...latest,
            project: { ...latest.project, brickLossPercent: value },
          },
          "budget",
        );
      } finally {
        setPriceSaving(false);
      }
    }
    setLossDraft(undefined);
  };
  const invalidPrices = Object.keys(priceErrors).length > 0;
  const steel = useSteelBudget(
    doc,
    open,
    busy || references.working,
    readonly,
    priceSaving,
    setPriceSaving,
  );
  const settlement = useSettlementBudget(
    doc,
    open,
    busy || references.working,
    readonly,
    priceSaving,
    setPriceSaving,
  );
  const openings = useOpeningBudget(doc, busy || references.working, readonly);
  const totals = [
    {
      label: "Subtotal de tijolos",
      value: !invalidPrices ? budget?.total : undefined,
      partial: report.available && report.partial,
    },
    {
      label: "Subtotal de ferragens",
      value: steel.costs.total,
      partial: steel.report.available && steel.report.partial,
    },
    {
      label: "Subtotal de assentamento",
      value: settlement.report.available ? settlement.report.total : undefined,
      partial: settlement.report.available && settlement.report.partial,
    },
    {
      label: "Subtotal de esquadrias",
      value: openings.report.available ? openings.report.total : undefined,
      partial: false,
    },
  ];
  const { total: materialTotal, error: materialError } = materialCosts(
    totals.map((t) => t.value),
  );
  async function exportPdf() {
    const state = useStore.getState();
    if (
      !state.doc ||
      state.busy ||
      references.working ||
      state.saved === "saving" ||
      exporting
    )
      return;
    // Fields commit on blur. An invalid/unconfirmed draft must not be silently exported.
    const hasDrafts =
      lossDraft !== undefined ||
      Object.keys(drafts).length > 0 ||
      Object.keys(steel.drafts).length > 0 ||
      Object.keys(settlement.drafts).length > 0 ||
      Object.keys(openings.drafts).length > 0;
    if (hasDrafts) {
      setExportError(
        "Conclua ou corrija os campos do orçamento antes de exportar o PDF.",
      );
      return;
    }
    const snapshot = state.doc,
      emitted = new Date(),
      unsaved = state.saved !== "saved";
    const abort = new AbortController();
    exportController.current = abort;
    setExporting(true);
    setExportError("");
    try {
      const { generateBudgetPdf } = await import("./budget-report/pdf");
      const file = await generateBudgetPdf(
        snapshot,
        emitted,
        unsaved,
        abort.signal,
      );
      if (abort.signal.aborted) return;
      const url = URL.createObjectURL(
        new Blob([file.bytes], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = file.filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      if (!abort.signal.aborted)
        setExportError(
          e instanceof Error
            ? e.message
            : "Não foi possível gerar o relatório PDF. Tente novamente.",
        );
    } finally {
      if (exportController.current === abort) {
        exportController.current = null;
        setExporting(false);
      }
    }
  }
  return (
    <BudgetReferenceContext.Provider value={references}>
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
        aria-label="Orçamento"
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
      >
        <div className={styles.quantityActions}>
          <button className={styles.iconText} onClick={() => setOpen(false)}>
            <Icon name="left" /> Voltar ao desenho
          </button>
        </div>
        <div className={styles.quantityContent}>
          <header className={styles.quantityMasthead}>
            <h1
              ref={heading}
              tabIndex={-1}
              id="quantities-title"
              className={styles.quantityEyebrow}
            >
              Orçamento preliminar
            </h1>
            <h2>{doc.project.name}</h2>
            <p className={styles.quantityMetadata}>
              Tijolo base: {display(doc.project.base.length)} ×{" "}
              {display(doc.project.base.width)} ×{" "}
              {display(doc.project.base.height)} cm
            </p>
            <p className={styles.note}>
              Quantitativos e estimativa de custos de tijolos, ferragens,
              materiais de assentamento e esquadrias do projeto, com base nos
              preços informados e nas perdas de tijolos definidas. Inclui resumo
              dos materiais e detalhamento por pavimento e fiada.
            </p>
          </header>
          <button
            className={styles.iconText}
            disabled={
              busy || references.working || saved === "saving" || exporting
            }
            onClick={() => void exportPdf()}
          >
            <Icon name="download" />{" "}
            {exporting ? "Gerando relatório…" : "Baixar orçamento em PDF"}
          </button>
          <p className={styles.note}>
            O relatório inclui todos os pavimentos e os valores confirmados nos
            campos, independentemente do filtro da consulta.
          </p>
          {exporting && <p role="status">Preparando relatório PDF…</p>}
          {exportError && (
            <p role="alert" className={styles.errorText}>
              {exportError}
            </p>
          )}
          {references.working && (
            <p role="status">
              Consultando e incorporando preços de referência…
            </p>
          )}
          {references.error && (
            <p role="alert">
              {references.error}{" "}
              <button
                disabled={
                  busy || readonly || saved !== "saved" || references.working
                }
                onClick={references.reload}
              >
                Tentar consultar referências novamente
              </button>
            </p>
          )}
          {!report.available && <p role="alert">{report.reason}</p>}
          <section className={styles.quantitySection}>
            <h2 id="budget-summary-title">
              <span className={styles.quantitySectionIndex} aria-hidden="true">
                01
              </span>
              Resumo do projeto
            </h2>
            {(!report.available || report.partial) && (
              <p>
                {!report.available
                  ? "Quantitativos indisponíveis"
                  : "Parcial — há pendências"}
              </p>
            )}
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
            <section
              className={styles.quantityGroup}
              aria-labelledby="budget-bricks-title"
            >
              <h3 id="budget-bricks-title">Tijolos do Projeto</h3>
              <label className={styles.quantityLoss}>
                Perdas de tijolos (%)
                <input
                  aria-label="Perdas de tijolos (%)"
                  inputMode="decimal"
                  value={percent}
                  aria-invalid={!!lossError}
                  aria-describedby="loss-note"
                  disabled={busy || readonly || references.working}
                  onChange={(e) => setLossDraft(e.target.value)}
                  onBlur={() => void confirmLoss()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                />
              </label>
              <p id="loss-note" className={styles.note}>
                Opcional. Aplicado por tipo de tijolo sobre o total do projeto,
                com arredondamento para cima. Não afeta ferragens nem
                assentamento. Custos usam o total estimado, incluindo perdas.
                Perdas e preços ficam salvos no projeto. Saia do campo ou
                pressione Enter para salvar a edição.
              </p>
              <p role="status" aria-live="polite">
                {priceSaving || saved === "saving"
                  ? "Salvando orçamento…"
                  : saved === "saved"
                    ? "Salvo · orçamento no projeto"
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
                  <caption className={styles.visuallyHidden}>
                    Tijolos do Projeto
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
                              <span className={styles.priceField}>
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
                                  disabled={
                                    busy || readonly || references.working
                                  }
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
                                <ReferencePriceButton
                                  item={{ group: "bricks", key: kind }}
                                  clearDraft={() =>
                                    setDrafts((previous) => {
                                      const next = { ...previous };
                                      delete next[kind];
                                      return next;
                                    })
                                  }
                                />
                              </span>
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
                    Orçamento incompleto: informe preços válidos para os tipos
                    com peças. Preço não informado é diferente de zero.
                  </p>
                )}
            </section>
            <SteelBudgetSummary model={steel} />
            <SettlementBudgetSummary model={settlement} />
            <OpeningBudgetSummary model={openings} />
            <dl
              className={styles.materialTotals}
              aria-label="Totais dos materiais"
            >
              {totals.map((t) => (
                <div key={t.label}>
                  <dt>
                    {t.label}
                    {t.partial ? " · parcial" : ""}
                  </dt>
                  <dd>
                    {t.value !== undefined ? money(t.value) : "Indisponível"}
                  </dd>
                </div>
              ))}
              <div>
                <dt>
                  Total dos materiais orçados (tijolos + ferragens +
                  assentamento + esquadrias)
                  {totals.some((t) => t.partial) ? " · parcial" : ""}
                </dt>
                <dd>
                  {materialTotal !== undefined
                    ? money(materialTotal)
                    : "Indisponível"}
                </dd>
              </div>
            </dl>
            {materialError && <p role="alert">{materialError}</p>}
            {materialTotal === undefined && (
              <p className={styles.note}>
                O total depende de quantitativos disponíveis, massas
                cadastradas, perdas de tijolos válidas, distribuição de
                assentamento completa, tipo/material de esquadrias definidos e
                preços informados para os materiais utilizados. Preço zero é
                diferente de preço ausente.
              </p>
            )}
          </section>
          <section
            className={styles.quantitySection}
            aria-labelledby="budget-detail-title"
          >
            <h2 id="budget-detail-title">
              <span className={styles.quantitySectionIndex} aria-hidden="true">
                02
              </span>
              Detalhamento por pavimento
            </h2>
            <label className={styles.quantityLoss}>
              Pavimento da consulta
              <select
                aria-label="Pavimento da consulta"
                value={
                  floorId === "all" ? "all" : (selectedDocumentFloor?.id ?? "")
                }
                onChange={(e) => setFloorId(e.target.value)}
              >
                <option value="all">Todos</option>
                {documentFloors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} · {display(f.level)} cm
                    {report.available &&
                    report.floors.find((r) => r.id === f.id)?.partial
                      ? " · Parcial"
                      : ""}
                  </option>
                ))}
              </select>
            </label>
            {openings.report.available &&
              consultedDocumentFloors.map((f) => (
                <OpeningBudgetDetail
                  key={`openings:${f.id}`}
                  report={
                    openings.report as Extract<
                      typeof openings.report,
                      { available: true }
                    >
                  }
                  floorId={f.id}
                />
              ))}
            {report.available && consultedFloors.length > 0 && (
              <>
                <p>
                  {floorId === "all"
                    ? "Todos os pavimentos"
                    : `${selectedFloor!.name} · ${display(selectedFloor!.level)} cm`}
                  {consultedFloors.some((f) => f.partial)
                    ? " · Parcial — há pendências"
                    : ""}
                  . Quantidades geométricas, sem perdas.
                </p>
                {consultedFloors.map((floor) => (
                  <SettlementBudgetDetail
                    key={`settlement:${floor.id}`}
                    model={settlement}
                    floorId={floor.id}
                  />
                ))}
                {consultedFloors.map((floor) => (
                  <SteelBudgetDetail
                    key={floor.id}
                    model={steel}
                    floorId={floor.id}
                  />
                ))}
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
                        <th scope="col">Pavimento</th>
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
                      {consultedFloors.flatMap((floor) =>
                        floor.courses.map((c) => (
                          <tr key={`${floor.id}:${c.number}`}>
                            <th scope="row">
                              {floor.name} · {display(floor.level)} cm
                            </th>
                            <td>{c.number}</td>
                            <CountCells counts={c.counts} />
                          </tr>
                        )),
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th scope="row" colSpan={2}>
                          {floorId === "all"
                            ? "Total dos pavimentos"
                            : "Total do pavimento"}
                        </th>
                        <CountCells
                          counts={
                            floorId === "all"
                              ? report.counts
                              : selectedFloor!.counts
                          }
                        />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {!consultedFloors.some((f) => f.courses.length) && (
                  <p>
                    {floorId === "all"
                      ? "Estes pavimentos não têm fiadas. Quantidades zero."
                      : "Este pavimento não tem fiadas. Quantidades zero."}
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      </dialog>
    </BudgetReferenceContext.Provider>
  );
}
