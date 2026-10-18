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
      return quantities(doc, busy);
    } catch (e) {
      return { available: false as const, reason: (e as Error).message };
    }
  }, [doc, busy, open]);
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
        <Icon name="quantities" /> Quantitativos
      </button>
      <dialog
        ref={dialog}
        className={styles.quantityScreen}
        aria-labelledby="quantities-title"
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
      >
        <div className={styles.quantityHeader}>
          <div>
            <h1 ref={heading} tabIndex={-1} id="quantities-title">
              Quantitativos
            </h1>
            <p>{doc.project.name}</p>
          </div>
          <button className={styles.iconText} onClick={() => setOpen(false)}>
            <Icon name="left" /> Voltar ao desenho
          </button>
        </div>
        <p>
          Base nominal: {display(doc.project.base.length)} ×{" "}
          {display(doc.project.base.width)} × {display(doc.project.base.height)}{" "}
          cm. Quantidades em unidades.
        </p>
        <p className={styles.note}>
          Quantidade geométrica nominal. Consumo de peças-base para preparação
          não determinado: meios e canaletas não são automaticamente cortes de
          inteiros. Lajes, concreto, graute e aço não incluídos.
        </p>
        {!report.available ? (
          <p role="alert">{report.reason}</p>
        ) : (
          <>
            <h2>Resumo do projeto</h2>
            <p>
              {report.partial
                ? "Parcial — há pendências"
                : "Composição atualizada"}
            </p>
            {report.partial && (
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
                  {report.partial
                    ? "Estimativa parcial do projeto"
                    : "Peças do projeto"}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Tipo</th>
                    <th scope="col">Geométrica</th>
                    <th scope="col">Acréscimo de perdas</th>
                    <th scope="col">Total estimado</th>
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
                      <td>{number(report.counts[kind])}</td>
                      <td>{estimate ? number(estimate.added[kind]) : "—"}</td>
                      <td>
                        {estimate ? number(estimate.estimated[kind]) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  {selectedFloor.partial ? " · Parcial — há pendências" : ""}.
                  Quantidades geométricas, sem perdas.
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
      </dialog>
    </>
  );
}
