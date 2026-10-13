import { useEffect, useState } from "react";
import {
  cm,
  display,
  length,
  defaultChannelLevels,
  type Opening,
  type Project,
} from "../domain/project";
import {
  modularOptions,
  openingLabel,
  putOpening,
  removeElement,
} from "../domain/openings";
import { useStore } from "../state/store";
import styles from "../ui/App.module.css";
import { validateChannelLevels, MAX_CHANNEL_LEVELS } from "../domain/channels";

type Suggestion = { field: string; requested: number; values: number[] };
function Suggestions({
  items,
  choose,
}: {
  items: Suggestion[];
  choose: (field: string, value: number) => void;
}) {
  return (
    <div className={styles.alternatives} role="status">
      {items.map((s) => (
        <div key={s.field}>
          <p>
            {s.field.startsWith("Nível ") ? "Topo de canaleta" : s.field}:
            escolha uma medida modular.
          </p>
          {s.values.map((n) => (
            <button type="button" key={n} onClick={() => choose(s.field, n)}>
              {display(n)} cm (diferença {display(n - s.requested)} cm)
            </button>
          ))}
          {!s.values.length && (
            <p>Nenhuma alternativa dentro dos limites da parede.</p>
          )}
        </div>
      ))}
    </div>
  );
}
function Field({
  label,
  value,
  set,
  disabled,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <label className={styles.field}>
      {label}
      <div className={styles.unitInput}>
        <input
          aria-label={label}
          value={value}
          onChange={(e) => set(e.target.value)}
          disabled={disabled}
        />
        <span>cm</span>
      </div>
    </label>
  );
}
export function OpeningProperties({ doc }: { doc: Project }) {
  const s = useStore(),
    o = s.pendingOpening ?? doc.model.openings.find((o) => o.id === s.select);
  if (!o) return null;
  return (
    <OpeningForm
      key={o.id}
      doc={doc}
      opening={o}
      pending={!!s.pendingOpening}
    />
  );
}
function OpeningForm({
  doc,
  opening: o,
  pending,
}: {
  doc: Project;
  opening: Opening;
  pending: boolean;
}) {
  const s = useStore(),
    disabled = s.busy || s.readonly;
  const w = doc.model.walls.find((w) => w.id === o.wallId)!;
  const [values, setValues] = useState<Record<string, string>>({
    "Posição do vão": display(o.offset),
    "Largura do vão": display(o.width),
    "Base do vão": display(o.base),
    "Altura do vão": display(o.height),
  });
  const [error, setError] = useState(""),
    [options, setOptions] = useState<Suggestion[]>([]);
  useEffect(() => {
    setValues({
      "Posição do vão": display(o.offset),
      "Largura do vão": display(o.width),
      "Base do vão": display(o.base),
      "Altura do vão": display(o.height),
    });
  }, [o.offset, o.width, o.base, o.height]);
  const field = (name: string, value: string) =>
    setValues((v) => ({ ...v, [name]: value }));
  const f = doc.model.floors[0],
    h = doc.project.base.height,
    m = doc.project.base.width;
  const diagnostics = doc.generationState.diagnostics.filter((d) =>
    d.openingIds?.includes(o.id),
  );
  const [collapsed, setCollapsed] = useState(false);
  if (collapsed)
    return (
      <button className={styles.reopen} onClick={() => setCollapsed(false)}>
        Propriedades do vão ‹
      </button>
    );
  return (
    <aside className={styles.properties} aria-label="Propriedades do vão">
      <div className={styles.panelTitle}>
        <span>{pending ? "CONFIRMAR NOVO VÃO" : "VÃO SELECIONADO"}</span>
        <button
          aria-label="Recolher propriedades"
          onClick={() => setCollapsed(true)}
        >
          ›
        </button>
      </div>
      <h2>{openingLabel[o.kind]}</h2>
      <p className={styles.muted}>
        Parede {doc.model.walls.indexOf(w) + 1} · distância desde a menor
        coordenada.
      </p>
      <form
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            if (pending) {
              s.inspect({ pendingOpening: null });
              s.choose(null);
            } else
              setValues({
                "Posição do vão": display(o.offset),
                "Largura do vão": display(o.width),
                "Base do vão": display(o.base),
                "Altura do vão": display(o.height),
              });
            setOptions([]);
            setError("");
          }
        }}
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          setOptions([]);
          try {
            const offset = cm(values["Posição do vão"]),
              width = cm(values["Largura do vão"]),
              base = cm(values["Base do vão"]),
              height = cm(values["Altura do vão"]);
            const constraints = [
              {
                field: "Posição do vão",
                n: offset,
                step: m,
                origin: 0,
                min: 0,
                max: length(w) - width,
              },
              {
                field: "Largura do vão",
                n: width,
                step: m,
                origin: 0,
                min: m,
                max: length(w) - offset,
              },
              {
                field: "Base do vão",
                n: base,
                step: h,
                origin: f.start - f.level,
                min: f.start - f.level,
                max: f.start + w.height - f.level - height,
              },
              {
                field: "Altura do vão",
                n: height,
                step: h,
                origin: 0,
                min: h,
                max: f.start + w.height - f.level - base,
              },
            ];
            const suggestions = constraints
              .filter(
                (c) => (c.n - c.origin) % c.step || c.n < c.min || c.n > c.max,
              )
              .map((c) => ({
                field: c.field,
                requested: c.n,
                values: modularOptions(c.n, c.step, c.origin, c.min, c.max),
              }));
            if (suggestions.length) {
              setOptions(suggestions);
              return;
            }
            const next = putOpening(doc, { ...o, offset, width, base, height });
            void s.commit(next);
            s.choose(o.id);
            s.inspect({ pendingOpening: null });
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        {Object.entries(values).map(([label, value]) => (
          <Field
            key={label}
            label={label}
            value={value}
            set={(v) => field(label, v)}
            disabled={disabled}
          />
        ))}
        <p className={styles.note}>
          Topo:{" "}
          {(() => {
            try {
              return display(
                cm(values["Base do vão"]) + cm(values["Altura do vão"]),
              );
            } catch {
              return "—";
            }
          })()}{" "}
          cm · início da alvenaria: {display(f.start - f.level)} cm. Altura de
          fiada: {display(h)} cm.
        </p>
        <p className={styles.note}>
          Fiadas atingidas: {Math.floor((f.level + o.base - f.start) / h) + 1}–
          {Math.ceil((f.level + o.base + o.height - f.start) / h)} · topo salvo{" "}
          {display(o.base + o.height)} cm.
        </p>
        {!!options.length && (
          <Suggestions
            items={options}
            choose={(key, n) => {
              field(key, display(n));
              setOptions((v) => v.filter((s) => s.field !== key));
            }}
          />
        )}
        {error && (
          <p role="alert" className={styles.errorText}>
            {error}
          </p>
        )}
        <button type="submit" disabled={disabled}>
          Aplicar vão
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (pending) {
              s.inspect({ pendingOpening: null });
              s.choose(null);
            } else {
              setValues({
                "Posição do vão": display(o.offset),
                "Largura do vão": display(o.width),
                "Base do vão": display(o.base),
                "Altura do vão": display(o.height),
              });
            }
            setOptions([]);
            setError("");
          }}
        >
          Cancelar edição
        </button>
      </form>
      {!pending && (
        <button
          className={styles.danger}
          disabled={disabled}
          onClick={() => {
            void s.commit(removeElement(doc, o.id));
            s.choose(null);
          }}
        >
          Excluir vão
        </button>
      )}
      {diagnostics.map((d) => (
        <p key={d.code} className={styles.note}>
          {d.message}
        </p>
      ))}
      {!pending && (
        <button disabled={s.busy} onClick={() => s.choose(w.id)}>
          Selecionar parede do vão
        </button>
      )}
      {doc.generated?.convention === "nominal-v4" &&
        !diagnostics.some((d) => d.code === "opening-elements-pending") && (
          <p className={styles.note}>
            Elementos sobre e sob vãos ainda não calculados nesta entrega.
          </p>
        )}
    </aside>
  );
}
export function OpeningSettingsDialog({
  doc,
  close,
}: {
  doc: Project;
  close: () => void;
}) {
  const s = useStore(),
    disabled = s.busy || s.readonly,
    f = doc.model.floors[0],
    h = doc.project.base.height;
  const [values, setValues] = useState<Record<string, string>>({
    "Base padrão de janela/vão": display(doc.project.openingSettings.base),
    "Topo padrão de aberturas": display(doc.project.openingSettings.top),
  });
  const [options, setOptions] = useState<Suggestion[]>([]),
    [error, setError] = useState("");
  const [levels, setLevels] = useState(
    doc.project.channelLevels.map((l) => ({ id: l.id, value: display(l.top) })),
  );
  const field = (key: string, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));
  useEffect(() => {
    (
      document.querySelector('[role="dialog"] input') as HTMLInputElement | null
    )?.focus();
  }, []);
  return (
    <div className={styles.modalBackdrop}>
      <section
        className={styles.modal}
        role="dialog"
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Escape") close();
        }}
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <h2 id="settings-title">Configurações do projeto</h2>
        <h3>Vãos</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            setOptions([]);
            try {
              const base = cm(values["Base padrão de janela/vão"]),
                top = cm(values["Topo padrão de aberturas"]),
                origin = f.start - f.level;
              const openingChanged =
                base !== doc.project.openingSettings.base ||
                top !== doc.project.openingSettings.top;
              const channelLevels = levels.map((l) => ({
                id: l.id,
                top: cm(l.value),
              }));
              const channelsChanged =
                JSON.stringify(channelLevels) !==
                JSON.stringify(doc.project.channelLevels);
              const opts = (
                openingChanged
                  ? [
                      {
                        field: "Base padrão de janela/vão",
                        n: base,
                        min: origin,
                      },
                      {
                        field: "Topo padrão de aberturas",
                        n: top,
                        min: origin + h,
                      },
                    ]
                  : []
              )
                .filter((c) => (c.n - origin) % h || c.n < c.min)
                .map((c) => ({
                  field: c.field,
                  requested: c.n,
                  values: modularOptions(c.n, h, origin, c.min, 100000000),
                }));
              const channelOpts = (channelsChanged ? channelLevels : [])
                .filter(
                  (l) =>
                    (f.level + l.top - f.start) % h ||
                    f.level + l.top <= f.start,
                )
                .map((l) => ({
                  field: `Nível ${l.id}`,
                  requested: l.top,
                  values: modularOptions(
                    l.top,
                    h,
                    origin,
                    origin + h,
                    100000000 - f.level,
                  ),
                }));
              if (opts.length || channelOpts.length) {
                setOptions([...opts, ...channelOpts]);
                return;
              }
              if (top <= base)
                throw new Error(
                  "O topo padrão deve ser maior que a base padrão.",
                );
              const next = {
                ...doc,
                project: {
                  ...doc.project,
                  openingSettings: { base, top },
                  channelLevels,
                },
              };
              if (channelsChanged) validateChannelLevels(next);
              if (openingChanged || channelsChanged) void s.commit(next);
              close();
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          {Object.entries(values).map(([label, value]) => (
            <Field
              key={label}
              label={label}
              value={value}
              set={(v) => field(label, v)}
              disabled={disabled}
            />
          ))}
          <p>
            Valores em relação ao piso. Porta parte de zero; janela/vão elevado
            tem altura igual ao topo menos a base. Os padrões só inicializam
            novas aberturas.
          </p>
          <p>
            Altura de fiada: {display(h)} cm · origem vertical:{" "}
            {display(f.start - f.level)} cm.
          </p>
          <p>
            {(() => {
              try {
                const b = cm(values["Base padrão de janela/vão"]),
                  t = cm(values["Topo padrão de aberturas"]);
                const limit = (n: number) =>
                  Number.isInteger(n) ? String(n) : "fora da malha";
                return `Altura de janela/vão: ${display(t - b)} cm · limites de fiadas: ${limit((f.level + b - f.start) / h)} / ${limit((f.level + t - f.start) / h)}.`;
              } catch {
                return "Informe base e topo para consultar a altura resultante.";
              }
            })()}
          </p>
          {!!options.length && (
            <Suggestions
              items={options}
              choose={(key, n) => {
                if (key.startsWith("Nível "))
                  setLevels((ls) =>
                    ls.map((l) =>
                      l.id === key.slice(6) ? { ...l, value: display(n) } : l,
                    ),
                  );
                else field(key, display(n));
                setOptions((v) => v.filter((s) => s.field !== key));
              }}
            />
          )}
          {error && (
            <p role="alert" className={styles.errorText}>
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setValues({
                "Base padrão de janela/vão": "112",
                "Topo padrão de aberturas": "217",
              });
              setOptions([]);
              setError("");
            }}
          >
            Restaurar padrões de vãos
          </button>
          <h3>Canaletas</h3>
          <p>
            Cotas de topo em relação ao piso. As faixas locais dos vãos são
            automáticas; níveis globais vazios preservam a configuração dos
            projetos anteriores.
          </p>
          {levels.map((l, i) => {
            let course = "—";
            try {
              const n = (f.level + cm(l.value) - f.start) / h;
              course =
                Number.isInteger(n) && n > 0 ? String(n) : "fora da malha";
            } catch {
              /* Campo em edição. */
            }
            return (
              <div key={l.id}>
                <Field
                  label={`Topo de canaleta ${i + 1}`}
                  value={l.value}
                  disabled={disabled}
                  set={(value) =>
                    setLevels((ls) =>
                      ls.map((row) =>
                        row.id === l.id ? { ...row, value } : row,
                      ),
                    )
                  }
                />
                <small>Fiada {course}</small>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Remover nível de canaleta ${i + 1}`}
                  onClick={() =>
                    setLevels((ls) => ls.filter((row) => row.id !== l.id))
                  }
                >
                  Remover nível
                </button>
              </div>
            );
          })}
          <button
            type="button"
            disabled={disabled || levels.length >= MAX_CHANNEL_LEVELS}
            onClick={() =>
              setLevels((ls) => [...ls, { id: crypto.randomUUID(), value: "" }])
            }
          >
            Adicionar nível de canaleta
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setLevels(
                defaultChannelLevels().map((l) => ({
                  id:
                    levels.find((row) => {
                      try {
                        return cm(row.value) === l.top;
                      } catch {
                        return false;
                      }
                    })?.id ?? l.id,
                  value: display(l.top),
                })),
              );
              setOptions([]);
              setError("");
            }}
          >
            Restaurar padrões de canaletas
          </button>
          <button type="submit" disabled={disabled}>
            Aplicar configurações
          </button>
          <button type="button" onClick={close}>
            Cancelar
          </button>
        </form>
      </section>
    </div>
  );
}
export function Diagnostics({
  close,
  settings,
}: {
  close: () => void;
  settings: () => void;
}) {
  const s = useStore(),
    doc = s.doc!;
  return (
    <aside className={styles.properties} aria-label="Diagnósticos do projeto">
      <div className={styles.panelTitle}>
        <span>DIAGNÓSTICOS</span>
        <button onClick={close}>Fechar diagnósticos</button>
      </div>
      <p>
        {doc.generationState.status === "current"
          ? "Resultado atualizado"
          : "Resultado desatualizado"}
      </p>
      {!doc.generationState.diagnostics.length && (
        <p>Nenhuma pendência nominal.</p>
      )}
      {doc.generationState.diagnostics.map((d, i) => (
        <section key={i} className={styles.note}>
          <strong>
            {d.severity === "error" ? "Pendência geométrica" : "Informação"} ·
            fiada {d.course}
            {d.lastCourse && d.lastCourse !== d.course
              ? `–${d.lastCourse}`
              : ""}
          </strong>
          <p>{d.message}</p>
          {d.levelIds?.map((id) => {
            const level = doc.project.channelLevels.find((l) => l.id === id);
            return (
              level && (
                <p key={id}>
                  Topo configurado: {display(level.top)} cm em relação ao piso.
                </p>
              )
            );
          })}
          {d.adjustmentIds?.map((id) => {
            const adjustment = doc.adjustments.channels.find(
              (a) => a.id === id,
            );
            return (
              adjustment && (
                <p key={id}>
                  Supressão na cota absoluta {display(adjustment.top)} cm. Use
                  Restaurar faixa suprimida na Fiada para descartá-la.
                </p>
              )
            );
          })}
          <small>
            {d.code} ·{" "}
            {d.wallIds
              .map(
                (id) =>
                  `Parede ${doc.model.walls.findIndex((w) => w.id === id) + 1}`,
              )
              .join(", ")}
          </small>
          <div>
            {!!d.levelIds?.length && (
              <button
                disabled={s.busy}
                onClick={() => {
                  close();
                  settings();
                }}
              >
                Editar níveis de canaleta
              </button>
            )}
            <button
              disabled={s.busy}
              onClick={() =>
                s.inspect({ focus: { x: d.x, y: d.y }, preview: null })
              }
            >
              Localizar
            </button>
            <button
              disabled={s.busy}
              onClick={() =>
                s.inspect({
                  mode: "course",
                  course: Math.min(
                    Math.max(1, doc.generated?.courses.length ?? 1),
                    d.course,
                  ),
                  focus: { x: d.x, y: d.y },
                  preview: null,
                })
              }
            >
              Ver fiada
            </button>
            <button
              disabled={s.busy}
              onClick={() => {
                s.choose(d.openingIds?.[0] ?? d.wallIds[0] ?? null);
                s.inspect({
                  mode: "plan",
                  focus: { x: d.x, y: d.y },
                  preview: null,
                });
                close();
              }}
            >
              Editar na Planta
            </button>
          </div>
        </section>
      ))}
    </aside>
  );
}
