import { useEffect, useMemo, useRef, useState } from "react";
import { useStore, useEditingProject } from "../state/store";
import { display } from "../domain/project";
import {
  activeGrout,
  courseCells,
  discardGroutAdjustment,
  groutId,
  toggleGrout,
  groutAdjustmentsInScope,
  restoreAutomaticGrouts,
} from "../domain/grout";
import styles from "../ui/App.module.css";

type RestoreScope = { projectId: string; floorId: string; wallId?: string };
function RestoreGroutsDialog({
  scope,
  close,
}: {
  scope: RestoreScope;
  close: () => void;
}) {
  const s = useStore(),
    ref = useRef<HTMLDialogElement>(null),
    [submitting, setSubmitting] = useState(false);
  const doc = s.doc;
  const valid =
    !!doc &&
    doc.project.id === scope.projectId &&
    s.activeFloorId === scope.floorId &&
    s.mode === "course" &&
    doc.model.floors.some((f) => f.id === scope.floorId) &&
    (!scope.wallId ||
      doc.model.walls.some(
        (w) => w.id === scope.wallId && w.floorId === scope.floorId,
      ));
  const adjustments = valid
    ? groutAdjustmentsInScope(doc!, scope.floorId, scope.wallId)
    : [];
  const includes = adjustments.filter((a) => a.action === "include").length,
    excludes = adjustments.length - includes;
  const shared = scope.wallId
    ? adjustments.filter((a) => a.wallIds.some((id) => id !== scope.wallId))
        .length
    : 0;
  const wallIndex =
    doc?.model.walls
      .filter((w) => w.floorId === scope.floorId)
      .findIndex((w) => w.id === scope.wallId) ?? -1;
  const title = scope.wallId
    ? `Restaurar grautes da parede ${wallIndex + 1}?`
    : `Restaurar grautes do pavimento “${doc?.model.floors.find((f) => f.id === scope.floorId)?.name ?? ""}”?`;
  useEffect(() => {
    const focus = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      if (focus instanceof HTMLButtonElement && focus.disabled)
        document
          .querySelector<HTMLSelectElement>('[aria-label="Parede dos grautes"]')
          ?.focus();
      else focus?.focus();
    };
  }, []);
  useEffect(() => {
    if (!valid) close();
  }, [valid, close]);
  const blocked =
    !valid ||
    submitting ||
    s.busy ||
    s.readonly ||
    !!s.preview ||
    doc?.generationState.status !== "current" ||
    !adjustments.length;
  return (
    <dialog
      ref={ref}
      className={`${styles.copyDialog} ${styles.groutRestoreDialog}`}
      aria-labelledby="restore-grouts-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!submitting) close();
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (blocked || !doc) return;
          setSubmitting(true);
          try {
            const next = restoreAutomaticGrouts(
              doc,
              scope.floorId,
              scope.wallId,
            );
            s.inspect({ groutCell: null });
            await s.commit(next, "restore-grouts");
            close();
          } catch (error) {
            s.notify(error instanceof Error ? error.message : String(error));
            setSubmitting(false);
          }
        }}
      >
        <h2 id="restore-grouts-title">{title}</h2>
        <p>
          Serão descartadas {includes}{" "}
          {includes === 1 ? "inclusão manual" : "inclusões manuais"} e{" "}
          {excludes} {excludes === 1 ? "exclusão manual" : "exclusões manuais"},
          incluindo ajustes pendentes, em todas as fiadas{" "}
          {scope.wallId ? "desta parede" : "deste pavimento"}.
        </p>
        <p>
          A distribuição seguirá as categorias e a distância atuais. Você poderá
          desfazer esta operação.
        </p>
        {!!shared && (
          <p className={styles.errorText}>
            {shared}{" "}
            {shared === 1
              ? "ajuste é compartilhado"
              : "ajustes são compartilhados"}{" "}
            com outras paredes. Restaurá-los também pode alterar os grautes
            nesses encontros.
          </p>
        )}
        {doc &&
          !Object.entries(doc.project.groutSettings).some(
            ([key, value]) => key !== "distance" && value === true,
          ) && (
            <p>
              As categorias automáticas estão desligadas. A restauração removerá
              os ajustes sem criar novos grautes automáticos.
            </p>
          )}
        <div className={styles.groutDialogActions}>
          <button type="button" disabled={submitting} onClick={close}>
            Cancelar
          </button>
          <button className={styles.primary} type="submit" disabled={blocked}>
            Restaurar automáticos
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function GroutPanel() {
  const s = useStore(),
    d = useEditingProject()!,
    m = d.project.base.width;
  const wall = d.model.walls.find((w) => w.id === s.select);
  const [restoreScope, setRestoreScope] = useState<RestoreScope | null>(null);
  const adjustments = groutAdjustmentsInScope(d, d.viewFloorId, wall?.id);
  const floorAdjustments = groutAdjustmentsInScope(d, d.viewFloorId);
  const cells = useMemo(
    () => (d.generated ? courseCells(d, d.generated, s.course, wall?.id) : []),
    [d, s.course, wall?.id],
  );
  const selected = cells.find(
    (c) => s.groutCell && groutId(c) === groutId(s.groutCell),
  );
  const row = d.generated?.courses[s.course - 1],
    bottom = (row?.bottom ?? 0) + d.model.floors[0].level,
    top = (row?.top ?? 0) + d.model.floors[0].level;
  const axis = d.generated?.grouts?.find(
    (a) => selected && groutId(a) === groutId(selected),
  );
  const present = !!axis && activeGrout(axis, bottom, top);
  const blocked =
    s.busy ||
    s.readonly ||
    !!s.preview ||
    d.generationState.status !== "current";
  useEffect(() => {
    if (s.groutCell && !selected) s.inspect({ groutCell: null });
  }, [s, selected]);
  return (
    <section className={styles.propertyGroup} aria-label="Graute vertical">
      <h3>Graute vertical</h3>
      <label className={styles.field}>
        Parede dos grautes
        <select
          aria-label="Parede dos grautes"
          disabled={s.busy || !!s.preview}
          value={wall?.id ?? ""}
          onChange={(e) => s.choose(e.target.value || null)}
        >
          <option value="">Todas as paredes do pavimento</option>
          {d.model.walls.map((w, i) => (
            <option key={w.id} value={w.id}>
              Parede {i + 1}
            </option>
          ))}
        </select>
      </label>
      <p className={styles.note}>
        {wall
          ? `Parede ${d.model.walls.indexOf(wall) + 1} selecionada.`
          : "Alcance: todas as paredes do pavimento."}
      </p>
      {!Object.entries(d.project.groutSettings).some(
        ([key, value]) => key !== "distance" && value === true,
      ) && (
        <p>
          Automáticos desativados. Inclua grautes manualmente ou habilite
          categorias nas Configurações.
        </p>
      )}
      <p>
        ● Preenchido · ○ Disponível. Inclusão/remoção afeta todos os intervalos
        de alvenaria do eixo; vazios não recebem graute.
      </p>
      {s.groutMode && (
        <>
          <label className={styles.field}>
            Selecionar furo nesta fiada
            <select
              aria-label="Selecionar furo de graute"
              disabled={blocked}
              value={selected ? groutId(selected) : ""}
              onChange={(e) =>
                s.inspect({
                  groutCell:
                    cells.find((c) => groutId(c) === e.target.value) ?? null,
                })
              }
            >
              <option value="">Selecione um furo…</option>
              {cells.map((c) => (
                <option key={groutId(c)} value={groutId(c)}>
                  x {display(c.x + m / 2)} · y {display(c.y + m / 2)} cm
                </option>
              ))}
            </select>
          </label>
          {selected && (
            <>
              <p>
                Eixo x={display(selected.x + m / 2)}, y=
                {display(selected.y + m / 2)} cm · {selected.wallIds.length}{" "}
                parede(s).
              </p>
              {selected.wallIds.length > 1 && (
                <p className={styles.note}>
                  Eixo compartilhado: a alteração também afeta as outras paredes
                  deste encontro.
                </p>
              )}
              {axis?.intervals.map((i) => (
                <p key={i.bottom}>
                  Graute: {display(i.bottom - d.model.floors[0].level)}–
                  {display(i.top - d.model.floors[0].level)} cm em relação ao
                  piso.
                </p>
              ))}
              <button
                disabled={blocked}
                onClick={() => {
                  try {
                    void s.commit(toggleGrout(d, selected, present));
                  } catch (err) {
                    s.notify((err as Error).message);
                  }
                }}
              >
                {present ? "Remover graute" : "Adicionar graute"}
              </button>
            </>
          )}
        </>
      )}
      {!!adjustments.length && (
        <details>
          <summary>Ajustes de graute ({adjustments.length})</summary>
          {adjustments.map((a) => (
            <div key={a.id}>
              <p>
                {a.action === "include" ? "Inclusão" : "Exclusão"} em x=
                {display(a.x + m / 2)}, y={display(a.y + m / 2)} cm.
              </p>
              <button
                disabled={blocked}
                onClick={() => void s.commit(discardGroutAdjustment(d, a.id))}
              >
                Descartar ajuste de graute
              </button>
            </div>
          ))}
        </details>
      )}
      <div className={styles.groutActions}>
        <button
          disabled={blocked || !wall || !adjustments.length}
          title={
            !wall
              ? "Selecione uma parede"
              : !adjustments.length
                ? "Nenhum ajuste manual nesta parede"
                : undefined
          }
          onClick={() =>
            setRestoreScope({
              projectId: d.project.id,
              floorId: d.viewFloorId,
              wallId: wall!.id,
            })
          }
        >
          Restaurar nesta parede…
        </button>
        <button
          disabled={blocked || !floorAdjustments.length}
          title={
            !floorAdjustments.length
              ? "Nenhum ajuste manual neste pavimento"
              : undefined
          }
          onClick={() =>
            setRestoreScope({ projectId: d.project.id, floorId: d.viewFloorId })
          }
        >
          Restaurar no pavimento…
        </button>
      </div>
      {!adjustments.length && (
        <p className={styles.note}>Nenhum ajuste manual neste alcance.</p>
      )}
      {restoreScope && (
        <RestoreGroutsDialog
          scope={restoreScope}
          close={() => setRestoreScope(null)}
        />
      )}
    </section>
  );
}
