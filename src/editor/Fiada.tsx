import { useEffect, useState } from "react";
import { generate } from "../domain/composition";
import { display } from "../domain/project";
import { useStore } from "../state/store";
import styles from "../ui/App.module.css";

export function FiadaToolbar() {
  const s = useStore(),
    doc = s.doc!,
    total = doc.generated?.courses.length ?? 0;
  useEffect(() => {
    if (s.course > Math.max(1, total))
      s.inspect({ course: Math.max(1, total) });
    if (
      (s.ghost === "previous" && s.course <= 1) ||
      (s.ghost === "next" && s.course >= total)
    )
      s.inspect({ ghost: "none" });
  }, [s, total]);
  const active = doc.generated?.courses[s.course - 1];
  return (
    <div className={styles.fiadaToolbar}>
      <button
        aria-pressed={s.mode === "plan"}
        onClick={() => s.inspect({ mode: "plan", preview: null })}
      >
        Planta
      </button>
      <button
        aria-pressed={s.mode === "course"}
        onClick={() => {
          s.choose(null);
          s.inspect({ mode: "course" });
        }}
      >
        Fiada
      </button>
      {s.mode === "course" && (
        <>
          <button
            aria-label="Fiada anterior"
            disabled={s.course <= 1}
            onClick={() => s.inspect({ course: s.course - 1, preview: null })}
          >
            ‹
          </button>
          <label>
            Fiada{" "}
            <input
              aria-label="Número da fiada"
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
            disabled={s.course >= total}
            onClick={() => s.inspect({ course: s.course + 1, preview: null })}
          >
            ›
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
        </>
      )}
      <span>
        {s.busy
          ? "Processando…"
          : doc.generationState.status === "outdated"
            ? "Resultado desatualizado"
            : doc.generationState.diagnostics.some(
                  (d) => d.severity === "error",
                )
              ? "Atualizado · com pendências"
              : "Geometria nominal verificada"}
      </span>
      {doc.generationState.status === "outdated" && (
        <button disabled={s.busy || s.readonly} onClick={() => void s.retry()}>
          Recalcular
        </button>
      )}
    </div>
  );
}
export function FiadaPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const s = useStore(),
    doc = s.doc!,
    generated = doc.generated;
  const component = generated?.components.find((c) => c.id === s.component);
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
            (a) => a.componentId !== component.id,
          ),
          {
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
        className={styles.reopen}
        aria-label="Abrir inspeção de fiadas"
        onClick={() => setCollapsed(false)}
      >
        Inspeção de fiadas ‹
      </button>
    );
  return (
    <aside className={styles.properties} aria-label="Inspeção de fiadas">
      <div className={styles.panelTitle}>
        <span>FIADAS E ENCONTROS</span>
        <button
          aria-label="Recolher inspeção de fiadas"
          onClick={() => setCollapsed(true)}
        >
          ›
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
          <br />
          Contorno azul tracejado: fiada de referência
        </p>
      </details>
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
                    s.inspect({ preview: generate(candidate()) });
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
      <h3>Diagnósticos</h3>
      {!doc.generationState.diagnostics.length && (
        <p>Nenhuma pendência geométrica nominal.</p>
      )}
      {doc.generationState.diagnostics.map((d, i) => (
        <button
          className={styles.diagnostic}
          key={i}
          onClick={() =>
            s.inspect({
              course: Math.min(
                Math.max(1, generated?.courses.length ?? 1),
                d.course,
              ),
              focus: { x: d.x, y: d.y },
              preview: null,
            })
          }
        >
          <strong>
            {d.severity === "error" ? "Pendência" : "Informação"} · Térreo ·
            fiada {d.course}
          </strong>
          <span>{d.message}</span>
        </button>
      ))}
    </aside>
  );
}
