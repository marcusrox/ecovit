import { useEffect, useState } from "react";
import { generateFloor } from "../domain/composition";
import { display } from "../domain/project";
import { useStore, useEditingProject } from "../state/store";
import styles from "../ui/App.module.css";
import { Icon } from "../ui/Icon";
import { restoreSuppression, suppressBand } from "../domain/channels";
import { GroutPanel } from "./Grout";

export function FiadaToolbar() {
  const s = useStore(),
    doc = useEditingProject()!,
    total = doc.generated?.courses.length ?? 0;
  useEffect(() => {
    if (doc.generated && s.course > Math.max(1, total)) {
      s.inspect({ course: Math.max(1, total) });
      s.notify(
        total > 0
          ? `A fiada anterior deixou de existir. Selecionada a fiada ${total}.`
          : "Este pavimento não tem fiadas disponíveis.",
      );
    }
    if (
      (s.ghost === "previous" && s.course <= 1) ||
      (s.ghost === "next" && s.course >= total)
    )
      s.inspect({ ghost: "none" });
  }, [s, total, doc.generated]);
  const active = doc.generated?.courses[s.course - 1];
  useEffect(() => {
    if (
      s.channelBand &&
      !doc.generated?.channels?.some(
        (b) => b.id === s.channelBand && b.course === s.course,
      )
    )
      s.inspect({ channelBand: null });
  }, [s, doc]);
  return (
    <div className={styles.fiadaToolbar}>
      <button
        disabled={s.busy}
        aria-pressed={s.mode === "plan"}
        onClick={() =>
          s.inspect({
            mode: "plan",
            preview: null,
            groutMode: false,
            groutCell: null,
          })
        }
      >
        Planta
      </button>
      <button
        disabled={s.busy}
        aria-pressed={s.mode === "course"}
        onClick={() => {
          s.choose(null);
          s.inspect({ mode: "course" });
        }}
      >
        Fiada
      </button>
      {s.mode === "course" && total > 0 && (
        <>
          <button
            aria-label="Fiada anterior"
            className={styles.iconButton}
            title="Fiada anterior"
            data-tooltip="Fiada anterior"
            disabled={s.busy || s.course <= 1}
            onClick={() => s.inspect({ course: s.course - 1, preview: null })}
          >
            <Icon name="left" />
          </button>
          <label>
            Fiada{" "}
            <input
              aria-label="Número da fiada"
              disabled={s.busy}
              type="number"
              min={1}
              max={Math.max(1, total)}
              value={s.course}
              onChange={(e) =>
                s.inspect({
                  course: Math.max(
                    1,
                    Math.min(total, Number(e.target.value) || 1),
                  ),
                  preview: null,
                })
              }
            />{" "}
            / {total}
          </label>
          <button
            aria-label="Próxima fiada"
            className={styles.iconButton}
            title="Próxima fiada"
            data-tooltip="Próxima fiada"
            disabled={s.busy || s.course >= total}
            onClick={() => s.inspect({ course: s.course + 1, preview: null })}
          >
            <Icon name="right" />
          </button>
          {active && (
            <span>
              {display(active.bottom)}–{display(active.top)} cm em relação ao
              piso
            </span>
          )}
          <label>
            Referência{" "}
            <select
              aria-label="Fiada de referência"
              disabled={s.busy}
              value={s.ghost}
              onChange={(e) =>
                s.inspect({ ghost: e.target.value as typeof s.ghost })
              }
            >
              <option value="none">Nenhuma</option>
              <option value="previous" disabled={s.course <= 1}>
                Anterior
              </option>
              <option value="next" disabled={s.course >= total}>
                Próxima
              </option>
            </select>
          </label>
          <button
            aria-pressed={s.groutMode}
            disabled={
              s.busy ||
              s.readonly ||
              !!s.preview ||
              doc.generationState.status !== "current"
            }
            onClick={() =>
              s.inspect({
                groutMode: !s.groutMode,
                groutCell: null,
                channelBand: null,
              })
            }
          >
            Graute
          </button>
        </>
      )}
      {s.mode === "course" && !doc.model.walls.length && (
        <span>Este pavimento não tem paredes</span>
      )}
    </div>
  );
}
export function FiadaPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const s = useStore(),
    doc = useEditingProject()!,
    generated = doc.generated;
  const opening = doc.model.openings.find((o) => o.id === s.select);
  const component = generated?.components.find((c) => c.id === s.component);
  const bands = generated?.channels?.filter((b) => b.course === s.course) ?? [];
  const band = bands.find((b) => b.id === s.channelBand);
  const blocked =
    s.busy || s.readonly || doc.generationState.status !== "current";
  function candidate() {
    if (!component) return doc;
    return {
      ...doc,
      adjustments: {
        ...doc.adjustments,
        junctions: [
          ...doc.adjustments.junctions.filter(
            (a) =>
              a.componentId !== component.id &&
              !a.wallIds.some((id) => component.wallIds.includes(id)),
          ),
          {
            id: crypto.randomUUID(),
            floorId: doc.viewFloorId,
            anchor: { x: component.x, y: component.y },
            binding: "active" as const,
            componentId: component.id,
            signature: component.signature,
            wallIds: component.wallIds,
            phase: (1 - component.phase) as 0 | 1,
          },
        ],
      },
    };
  }
  if (collapsed)
    return (
      <button
        className={`${styles.reopen} ${styles.iconText}`}
        aria-label="Abrir inspeção de fiadas"
        onClick={() => setCollapsed(false)}
      >
        Inspeção de fiadas <Icon name="left" />
      </button>
    );
  return (
    <aside className={styles.properties} aria-label="Inspeção de fiadas">
      <div className={styles.panelTitle}>
        <span>FIADAS E ENCONTROS</span>
        <button
          aria-label="Recolher inspeção de fiadas"
          className={styles.iconButton}
          title="Recolher inspeção de fiadas"
          data-tooltip="Recolher inspeção de fiadas"
          onClick={() => setCollapsed(true)}
        >
          <Icon name="right" />
        </button>
      </div>
      <h2>Inspeção de fiadas</h2>
      <p className={styles.muted}>
        Modelo nominal: passo igual à altura-base; furos indicam eixos. Confira
        as dimensões do produto utilizado.
      </p>
      {doc.generationState.status === "outdated" && (
        <p className={styles.errorText}>
          Resultado antigo: não representa as últimas alterações.
        </p>
      )}
      <details>
        <summary>Legenda</summary>
        <p>
          <span style={{ color: "#b88b67" }}>■</span> Inteiro · dois eixos
          <br />
          <span style={{ color: "#865537" }}>■</span> Meio · um eixo
          <br />○ Eixo nominal, sem diâmetro físico
          <br />▱ Canaleta / meia canaleta · canal longitudinal esquemático
          <br />
          Contorno azul tracejado: fiada de referência
        </p>
      </details>
      <h3>Canaletas</h3>
      {!!bands.length && (
        <label className={styles.field}>
          Selecionar faixa
          <select
            aria-label="Selecionar faixa de canaleta"
            disabled={s.busy}
            value={band?.id ?? ""}
            onChange={(e) => s.inspect({ channelBand: e.target.value || null })}
          >
            <option value="">Selecione uma faixa…</option>
            {bands.map((b) => (
              <option key={b.id} value={b.id}>
                Parede {doc.model.walls.findIndex((w) => w.id === b.wallId) + 1}{" "}
                · topo {display(b.top - doc.model.floors[0].level)} cm
              </option>
            ))}
          </select>
        </label>
      )}
      {band && (
        <section>
          <p>
            Alcance: toda a faixa da parede{" "}
            {doc.model.walls.findIndex((w) => w.id === band.wallId) + 1} na
            fiada {band.course}, incluindo trechos separados por aberturas.{" "}
            {band.cells.length} células de canaleta realçadas.
          </p>
          <p>
            {new Set(band.cells.flatMap((c) => c.origins)).size} origem(ns)
            automática(s) coincidente(s).
          </p>
          <button
            disabled={blocked || !!s.preview}
            onClick={() =>
              void s.commit(suppressBand(doc, band.wallId, band.top))
            }
          >
            Remover faixa de canaleta
          </button>
        </section>
      )}
      {!bands.length && <p>Nenhuma canaleta nesta fiada.</p>}
      {doc.adjustments.channels.map((a) => (
        <section key={a.id}>
          <p>
            Canaleta suprimida · parede{" "}
            {doc.model.walls.findIndex((w) => w.id === a.wallId) + 1} · cota
            absoluta {display(a.top)} cm
            {a.scope?.kind === "range"
              ? ` · trecho herdado ${display(a.scope.from)}–${display(a.scope.to)} cm`
              : " · parede inteira"}
          </p>
          <button
            disabled={blocked || !!s.preview}
            onClick={() => void s.commit(restoreSuppression(doc, a.id))}
          >
            Restaurar faixa suprimida
          </button>
        </section>
      ))}
      <GroutPanel />
      <h3>Encontros</h3>
      {generated?.components
        .filter((c) => c.junctions.length)
        .map((c, i) => (
          <button
            className={styles.junctionButton}
            aria-pressed={s.component === c.id}
            key={c.id}
            onClick={() =>
              s.inspect({
                component: c.id,
                preview: null,
                focus: { x: c.x, y: c.y },
              })
            }
          >
            Conjunto {i + 1} ·{" "}
            {[
              ...new Set(
                c.junctions.map((j) => (j.kind === "cross" ? "cruz" : j.kind)),
              ),
            ].join("/")}
          </button>
        ))}
      {component && (
        <section>
          <p>
            {component.wallIds.length} parede(s) no conjunto. A prévia inclui
            todos os encontros afetados.
          </p>
          {s.course !== 1 ? (
            <button onClick={() => s.inspect({ course: 1, preview: null })}>
              Altere o encontro na primeira fiada
            </button>
          ) : component.alternative ? (
            <>
              <button
                disabled={blocked}
                onClick={() => {
                  try {
                    s.inspect({ preview: generateFloor(candidate()) });
                  } catch (e) {
                    s.notify(String(e));
                  }
                }}
              >
                Prévia da alternativa {component.phase === 0 ? "B" : "A"}
              </button>
              {s.preview && (
                <div>
                  <p>Prévia — todos os cantos destacados serão alterados.</p>
                  <button
                    disabled={blocked}
                    onClick={() => void s.commit(candidate())}
                  >
                    Confirmar alternativa
                  </button>
                  <button onClick={() => s.inspect({ preview: null })}>
                    Cancelar prévia
                  </button>
                </div>
              )}
            </>
          ) : (
            <p>Sem alternativa de composição disponível.</p>
          )}
        </section>
      )}
      {doc.adjustments.junctions.map((a) => (
        <section key={a.id}>
          <p>
            Escolha de encontro ·{" "}
            {a.binding === "pending" ? "pendente" : "aplicada"} · x=
            {display(a.anchor?.x ?? 0)}, y={display(a.anchor?.y ?? 0)} cm
          </p>
          <button
            disabled={blocked || s.course !== 1}
            onClick={() =>
              void s.commit({
                ...doc,
                adjustments: {
                  ...doc.adjustments,
                  junctions: doc.adjustments.junctions.filter(
                    (b) => b.id !== a.id,
                  ),
                },
              })
            }
          >
            Descartar escolha de encontro
          </button>
        </section>
      ))}
      {doc.adjustments.junctions.length > 0 && (
        <button
          disabled={blocked || s.course !== 1}
          onClick={() =>
            void s.commit({
              ...doc,
              adjustments: { ...doc.adjustments, junctions: [] },
            })
          }
        >
          Retornar encontros ao automático
        </button>
      )}
      {opening && (
        <section>
          <h3>Vão selecionado</h3>
          <p>
            Base {display(opening.base)} · topo{" "}
            {display(opening.base + opening.height)} cm
          </p>
          <button
            disabled={s.busy}
            onClick={() => s.inspect({ mode: "plan", preview: null })}
          >
            Editar na Planta
          </button>
        </section>
      )}
      <h3>Diagnósticos</h3>
      {!doc.generationState.diagnostics.length && (
        <p>Nenhuma pendência geométrica nominal.</p>
      )}
      {doc.generationState.diagnostics.map((d, i) => (
        <button
          className={styles.diagnostic}
          key={i}
          disabled={s.busy}
          onClick={() => {
            if (d.floorId) s.switchFloor(d.floorId);
            s.inspect({
              course: Math.min(
                Math.max(
                  1,
                  s.doc?.generated?.floors.find((f) => f.floorId === d.floorId)
                    ?.courses.length ?? 1,
                ),
                d.course,
              ),
              focus: { x: d.x, y: d.y },
              diagnosticWalls: d.wallIds,
              preview: null,
            });
          }}
        >
          <strong>
            {d.severity === "error" ? "Pendência" : "Informação"} ·{" "}
            {s.doc?.model.floors.find((f) => f.id === d.floorId)?.name} · fiada{" "}
            {d.course}
          </strong>
          <span>{d.message}</span>
        </button>
      ))}
    </aside>
  );
}
