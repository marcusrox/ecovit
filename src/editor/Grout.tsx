import { useEffect, useMemo } from "react";
import { useStore } from "../state/store";
import { display } from "../domain/project";
import {
  activeGrout,
  courseCells,
  discardGroutAdjustment,
  groutId,
  toggleGrout,
} from "../domain/grout";
import styles from "../ui/App.module.css";

export function GroutPanel() {
  const s = useStore(),
    d = s.doc!,
    m = d.project.base.width;
  const cells = useMemo(
    () => (d.generated ? courseCells(d, d.generated, s.course) : []),
    [d, s.course],
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
    <section>
      <h3>Graute vertical</h3>
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
      {!!d.adjustments.grout.length && (
        <details>
          <summary>Ajustes de graute ({d.adjustments.grout.length})</summary>
          {d.adjustments.grout.map((a) => (
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
    </section>
  );
}
