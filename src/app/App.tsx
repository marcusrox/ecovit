import { FiadaPanel, FiadaToolbar } from "../editor/Fiada";
import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "../editor/Canvas";
import {
  OpeningProperties,
  OpeningSettingsDialog,
  Diagnostics,
} from "../editor/Openings";
import { removeElement, openingLabel } from "../domain/openings";
import {
  cm,
  createProject,
  display,
  length,
  resizeLength,
  type Project,
  type Tool,
} from "../domain/project";
import { download, importedCopy, readFile } from "../persistence/files";
import { listProjects, loadProject } from "../persistence/database";
import { useStore } from "../state/store";
import styles from "../ui/App.module.css";
import { Icon } from "../ui/Icon";

function Brand() {
  return (
    <div className={styles.brand}>
      <svg width="31" height="31" viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M3 16 16 4l13 12v13H3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M10 20h12M10 24h12M16 16v12"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <strong>
        ecovit<span>ESTÚDIO MODULAR</span>
      </strong>
    </div>
  );
}
function Numeric({
  label,
  value,
  commit,
  positive = false,
  disabled = false,
  module,
}: {
  label: string;
  value: number;
  commit: (n: number) => void;
  positive?: boolean;
  disabled?: boolean;
  module?: number;
}) {
  const [text, setText] = useState(display(value));
  const cancelled = useRef(false);
  const [heightOptions, setHeightOptions] = useState<number[]>([]);
  useEffect(() => setText(display(value)), [value]);
  return (
    <label className={styles.field}>
      {label}
      <div className={styles.unitInput}>
        <input
          aria-label={label}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              cancelled.current = true;
              setText(display(value));
              e.currentTarget.blur();
            }
          }}
          onBlur={() => {
            if (cancelled.current) {
              cancelled.current = false;
              return;
            }
            try {
              const n = cm(text);
              if (positive && n <= 0)
                throw new Error("Informe uma medida positiva.");
              if (module && n % module) {
                setHeightOptions(
                  [
                    Math.floor(n / module) * module,
                    Math.ceil(n / module) * module,
                  ].filter((n) => n > 0),
                );
                setText(display(value));
                return;
              }
              setHeightOptions([]);
              if (n !== value) commit(n);
              setText(display(value));
            } catch (e) {
              useStore.getState().notify((e as Error).message);
              setText(display(value));
            }
          }}
        />
        <span>cm</span>
      </div>
      {!!heightOptions.length && (
        <span>
          Escolha uma altura de fiada:{" "}
          {heightOptions.map((n) => (
            <button
              type="button"
              disabled={disabled}
              key={n}
              onClick={() => {
                commit(n);
                setHeightOptions([]);
              }}
            >
              {display(n)} cm
            </button>
          ))}
        </span>
      )}
    </label>
  );
}
function Properties({ doc }: { doc: Project }) {
  const selected = useStore((s) => s.select),
    busy = useStore((s) => s.busy),
    readonly = useStore((s) => s.readonly);
  const wall = doc.model.walls.find((w) => w.id === selected),
    floor = doc.model.floors[0],
    disabled = busy || readonly;
  const [end, setEnd] = useState<"a" | "b">("b"),
    [alternatives, setAlternatives] = useState<number[]>([]),
    [collapsed, setCollapsed] = useState(false);
  useEffect(() => setAlternatives([]), [selected]);
  const updateFloor = (key: "level" | "start" | "defaultHeight", n: number) =>
    void useStore.getState().commit({
      ...doc,
      model: { ...doc.model, floors: [{ ...floor, [key]: n }] },
    });
  const setLength = (n: number) => {
    if (!wall) return;
    const module = doc.project.base.width;
    if (n < module) {
      useStore
        .getState()
        .notify(`O comprimento mínimo é ${display(module)} cm.`);
      return;
    }
    if (n % module) {
      setAlternatives([
        Math.floor(n / module) * module,
        Math.ceil(n / module) * module,
      ]);
      return;
    }
    setAlternatives([]);
    void useStore.getState().commit({
      ...doc,
      model: {
        ...doc.model,
        walls: doc.model.walls.map((w) =>
          w.id === wall.id ? resizeLength(w, end, n, module) : w,
        ),
      },
    });
  };
  if (collapsed)
    return (
      <button className={styles.reopen} onClick={() => setCollapsed(false)}>
        Propriedades <Icon name="left" />
      </button>
    );
  return (
    <aside className={styles.properties} aria-label="Propriedades">
      <div className={styles.panelTitle}>
        <span>{wall ? "PAREDE SELECIONADA" : "PROPRIEDADES DO TÉRREO"}</span>
        <button
          aria-label="Recolher propriedades"
          onClick={() => setCollapsed(true)}
        >
          <Icon name="right" />
        </button>
      </div>
      {wall ? (
        <>
          <h2>Parede {doc.model.walls.indexOf(wall) + 1}</h2>
          <p className={styles.muted}>Referência pela face externa</p>
          <label className={styles.field}>
            Extremidade a alterar
            <select
              disabled={disabled}
              aria-label="Extremidade a alterar"
              value={end}
              onChange={(e) => setEnd(e.target.value as "a" | "b")}
            >
              <option value="a">A — início do desenho</option>
              <option value="b">B — final do desenho</option>
            </select>
          </label>
          <Numeric
            key={`${wall.id}-${length(wall)}-${end}`}
            label="Comprimento"
            value={length(wall)}
            commit={setLength}
            positive
            disabled={disabled}
          />
          {!!alternatives.length && (
            <div className={styles.alternatives}>
              <p>Escolha uma medida na malha:</p>
              {alternatives.map((n) => (
                <button
                  disabled={disabled}
                  key={n}
                  onClick={() => setLength(n)}
                >
                  {display(n)} cm
                </button>
              ))}
            </div>
          )}
          <Numeric
            module={doc.project.base.height}
            label="Altura da parede"
            value={wall.height}
            positive
            disabled={disabled}
            commit={(height) =>
              void useStore.getState().commit({
                ...doc,
                model: {
                  ...doc.model,
                  walls: doc.model.walls.map((w) =>
                    w.id === wall.id ? { ...w, height } : w,
                  ),
                },
              })
            }
          />
          <div className={styles.measure}>
            <span>Espessura</span>
            <b>{display(doc.project.base.width)} cm</b>
          </div>
          <div className={styles.measure}>
            <span>Orientação</span>
            <b>{wall.a.y === wall.b.y ? "Horizontal" : "Vertical"}</b>
          </div>
          <button
            className={styles.danger}
            disabled={disabled}
            onClick={() => {
              void useStore.getState().commit({
                ...doc,
                model: {
                  ...doc.model,
                  walls: doc.model.walls.filter((w) => w.id !== wall.id),
                },
              });
              useStore.getState().choose(null);
            }}
          >
            Excluir parede
          </button>
          {doc.model.openings.some((o) => o.wallId === wall.id) && (
            <p className={styles.note}>
              Excluir esta parede também remove seus{" "}
              {doc.model.openings.filter((o) => o.wallId === wall.id).length}{" "}
              vãos. Desfazer restaura os dependentes.
            </p>
          )}
        </>
      ) : (
        <>
          <h2>Térreo</h2>
          <p className={styles.muted}>Referências verticais do desenho</p>
          <Numeric
            label="Cota do piso"
            value={floor.level}
            disabled={disabled}
            commit={(n) => updateFloor("level", n)}
          />
          <Numeric
            label="Início da alvenaria"
            value={floor.start}
            disabled={disabled}
            commit={(n) => updateFloor("start", n)}
          />
          <Numeric
            module={doc.project.base.height}
            label="Altura de novas paredes"
            value={floor.defaultHeight}
            positive
            disabled={disabled}
            commit={(n) => updateFloor("defaultHeight", n)}
          />
          <p className={styles.note}>
            Valores iniciais de desenho. A altura padrão vale apenas para novas
            paredes.
          </p>
        </>
      )}
      <div className={styles.panelFoot}>
        <span>TIJOLO-BASE</span>
        <strong>
          {display(doc.project.base.length)} × {display(doc.project.base.width)}{" "}
          × {display(doc.project.base.height)} cm
        </strong>
        <small>Base única deste projeto</small>
      </div>
      <details>
        <summary>Como usar o editor</summary>
        <p>
          Roda do mouse: zoom.
          <br />
          Espaço + arraste: navegar.
          <br />
          Esc: cancelar e selecionar.
          <br />
          Delete: excluir seleção.
          <br />
          Ctrl+Z: desfazer.
          <br />
          Ctrl+Y: refazer.
        </p>
        <p>
          A e B são o início e o final do desenho. A face externa tracejada
          permanece fixa ao editar o comprimento.
        </p>
      </details>
    </aside>
  );
}
export default function App() {
  const mode = useStore((s) => s.mode);
  const groutMode = useStore((s) => s.groutMode);
  const selected = useStore((s) => s.select),
    pendingOpening = useStore((s) => s.pendingOpening);
  const doc = useStore((s) => s.doc),
    busy = useStore((s) => s.busy),
    readonly = useStore((s) => s.readonly),
    saved = useStore((s) => s.saved),
    message = useStore((s) => s.message),
    history = useStore((s) => s.history);
  const [tool, setTool] = useState<Tool>("select"),
    [settings, setSettings] = useState(false),
    [diagnostics, setDiagnostics] = useState(false),
    [side, setSide] = useState<1 | -1>(1),
    [creating, setCreating] = useState(false),
    [projects, setProjects] = useState<
      Awaited<ReturnType<typeof listProjects>>
    >([]),
    [name, setName] = useState("Meu projeto"),
    [preset, setPreset] = useState("25"),
    [dimensions, setDimensions] = useState(["25", "12,5", "7"]),
    [formError, setFormError] = useState(""),
    [importing, setImporting] = useState(false),
    [editorName, setEditorName] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const changeTool = useCallback((t: Tool) => setTool(t), []);
  useEffect(() => {
    if (!doc) {
      void listProjects()
        .then(setProjects)
        .catch(() =>
          useStore
            .getState()
            .notify(
              "Armazenamento indisponível. Você ainda pode criar e baixar seu projeto.",
            ),
        );
    } else setEditorName(doc.project.name);
  }, [doc]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest(
          "input,textarea,select,[contenteditable]",
        )
      )
        return;
      const s = useStore.getState();
      if (!s.doc || s.busy || s.readonly) return;
      if (
        (e.ctrlKey || e.metaKey) &&
        ["z", "y"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        void s.undo(e.key.toLowerCase() === "y" || e.shiftKey);
      }
      if (
        e.key === "Delete" &&
        useStore.getState().mode === "plan" &&
        s.select
      ) {
        e.preventDefault();
        if (s.pendingOpening) s.inspect({ pendingOpening: null });
        else void s.commit(removeElement(s.doc, s.select));
        s.choose(null);
      }
    };
    const leave = (e: BeforeUnloadEvent) => {
      const s = useStore.getState();
      if (s.doc && (s.saved !== "saved" || s.busy)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", key);
    window.addEventListener("beforeunload", leave);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("beforeunload", leave);
    };
  }, []);
  const importFile = async (file?: File) => {
    if (!file) return;
    setImporting(true);
    try {
      const copy = importedCopy(await readFile(file));
      if (
        doc &&
        saved === "error" &&
        !window.confirm(
          "O projeto atual não foi salvo. Baixe uma cópia antes de sair. Continuar mesmo assim?",
        )
      )
        return;
      await useStore.getState().open(copy, true);
      setTool("select");
    } catch (e) {
      useStore.getState().notify((e as Error).message);
    } finally {
      setImporting(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <div className={`${styles.app} ${doc ? styles.editorApp : styles.homeApp}`}>
      <input
        type="file"
        ref={input}
        hidden
        data-testid="import-file"
        accept=".ecovit,application/json"
        onChange={(e) => void importFile(e.target.files?.[0])}
      />
      <header className={styles.header}>
        <Brand />
        {doc ? (
          <>
            <div className={styles.divider} />
            <input
              className={styles.projectName}
              aria-label="Nome do projeto"
              disabled={busy || readonly}
              value={editorName}
              maxLength={100}
              onChange={(e) => setEditorName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              onBlur={() => {
                if (editorName.trim() && editorName.trim() !== doc.project.name)
                  void useStore.getState().commit({
                    ...doc,
                    project: { ...doc.project, name: editorName.trim() },
                  });
                else setEditorName(doc.project.name);
              }}
            />
            <span
              className={`${styles.saveStatus} ${saved === "error" ? styles.errorText : ""}`}
              role="status"
            >
              {readonly
                ? "◉ Somente leitura"
                : saved === "saving"
                  ? "◌ Salvando…"
                  : saved === "error"
                    ? "⚠ Não salvo"
                    : "✓ Salvo no navegador"}
            </span>
            <div className={styles.headerActions}>
              <button
                disabled={busy || importing}
                onClick={() => {
                  if (
                    saved === "error" &&
                    !window.confirm(
                      "O trabalho não foi salvo. Baixe uma cópia antes de sair. Continuar?",
                    )
                  )
                    return;
                  useStore.getState().close();
                }}
              >
                Projetos
              </button>
              <button
                disabled={busy || importing}
                onClick={() => input.current?.click()}
              >
                <Icon name="upload" /> Carregar arquivo
              </button>
              <button
                className={styles.primary}
                disabled={busy || importing}
                onClick={() => download(doc)}
              >
                <Icon name="download" /> Baixar projeto
              </button>
            </div>
          </>
        ) : (
          <div className={styles.headerActions}>
            <span className={styles.localBadge}>Salvo neste navegador</span>
            <button
              disabled={busy || importing}
              onClick={() => input.current?.click()}
            >
              <Icon name="upload" /> Carregar .ecovit
            </button>
          </div>
        )}
      </header>
      {message && (
        <div className={styles.message} role="alert">
          <span>{message}</span>
          {saved === "error" && doc && (
            <button
              disabled={busy}
              onClick={() => void useStore.getState().retry()}
            >
              Tentar salvar
            </button>
          )}
          <button
            aria-label="Fechar aviso"
            onClick={() => useStore.getState().notify("")}
          >
            <Icon name="close" />
          </button>
        </div>
      )}
      {doc ? (
        <>
          <div className={styles.editorControls}>
            <div className={styles.toolbar}>
              <div className={styles.tools}>
                <button
                  className={
                    tool === "select" && !groutMode ? styles.active : ""
                  }
                  aria-pressed={tool === "select" && !groutMode}
                  disabled={busy || readonly}
                  onClick={() => {
                    setTool("select");
                    useStore
                      .getState()
                      .inspect({ groutMode: false, groutCell: null });
                  }}
                >
                  <Icon name="select" /> Selecionar
                </button>
                <button
                  className={tool === "wall" ? styles.active : ""}
                  aria-pressed={tool === "wall"}
                  disabled={busy || readonly}
                  onClick={() => {
                    useStore
                      .getState()
                      .inspect({ mode: "plan", preview: null });
                    setTool("wall");
                  }}
                >
                  <Icon name="wall" /> Parede
                </button>
                <span className={styles.divider} />
                {mode === "plan" &&
                  (["door", "window", "opening"] as const).map((kind) => (
                    <button
                      key={kind}
                      aria-pressed={tool === kind}
                      className={tool === kind ? styles.active : ""}
                      disabled={busy || readonly}
                      onClick={() => {
                        useStore.getState().inspect({ pendingOpening: null });
                        setTool(kind);
                      }}
                    >
                      <Icon name={kind} />
                      {openingLabel[kind]}
                    </button>
                  ))}
                <button
                  disabled={busy || readonly}
                  onClick={() => setSettings(true)}
                >
                  <Icon name="settings" /> Configurações
                </button>
                {mode === "plan" &&
                  tool === "select" &&
                  doc.model.openings.length > 0 && (
                    <select
                      aria-label="Selecionar vão por teclado"
                      disabled={busy}
                      value={
                        doc.model.openings.some((o) => o.id === selected)
                          ? selected!
                          : ""
                      }
                      onChange={(e) =>
                        useStore.getState().choose(e.target.value || null)
                      }
                    >
                      <option value="">Selecionar vão…</option>
                      {doc.model.openings.map((o, i) => (
                        <option key={o.id} value={o.id}>
                          {i + 1} · {openingLabel[o.kind]} · base{" "}
                          {display(o.base)} / topo {display(o.base + o.height)}{" "}
                          cm
                        </option>
                      ))}
                    </select>
                  )}
                <button
                  aria-label="Desfazer"
                  title="Desfazer (Ctrl+Z)"
                  disabled={busy || readonly || !history.past.length}
                  onClick={() => void useStore.getState().undo()}
                >
                  <Icon name="undo" />
                </button>
                <button
                  aria-label="Refazer"
                  title="Refazer (Ctrl+Y)"
                  disabled={busy || readonly || !history.future.length}
                  onClick={() => void useStore.getState().undo(true)}
                >
                  <Icon name="redo" />
                </button>
              </div>
            </div>
            <FiadaToolbar />
          </div>
          <main className={styles.workspace}>
            <Canvas
              key={doc.project.id}
              tool={tool}
              setTool={changeTool}
              side={side}
              setSide={setSide}
            />
            {diagnostics ? (
              <Diagnostics
                close={() => setDiagnostics(false)}
                settings={() => setSettings(true)}
              />
            ) : mode === "plan" ? (
              pendingOpening ||
              doc.model.openings.some((o) => o.id === selected) ? (
                <OpeningProperties doc={doc} />
              ) : (
                <Properties doc={doc} />
              )
            ) : (
              <FiadaPanel />
            )}
          </main>
          <footer className={styles.footer}>
            <button disabled={busy} onClick={() => setDiagnostics((v) => !v)}>
              Diagnósticos ({doc.generationState.diagnostics.length})
            </button>
            <span className={styles.moduleLabel}>
              Térreo · Módulo <b>{display(doc.project.base.width)} cm</b> · Face
              externa
            </span>
            <span>
              {doc.model.walls.length}{" "}
              {doc.model.walls.length === 1 ? "parede" : "paredes"} · Planta em
              centímetros
            </span>
            <span>
              {doc.generationState.status === "outdated"
                ? "Composição desatualizada"
                : doc.generationState.diagnostics.some(
                      (d) => d.severity === "error",
                    )
                  ? "Composição atualizada · com pendências"
                  : "Composição nominal atualizada"}
            </span>
          </footer>
        </>
      ) : (
        <main className={styles.home}>
          <div className={styles.homeIntro}>
            <div>
              <span className={styles.eyebrow}>
                DO PRIMEIRO TRAÇO AO PROJETO
              </span>
              <h1>
                Ideias que se <em>encaixam.</em>
              </h1>
            </div>
            <p>
              Desenhe sua planta com tijolos ecológicos.
              <br />
              Uma malha precisa, um espaço para criar.
            </p>
          </div>
          <div className={styles.listHeading}>
            <h2 id="projects-title">Seu espaço de projetos</h2>
            <span>
              {projects.length}{" "}
              {projects.length === 1 ? "projeto salvo" : "projetos salvos"}
            </span>
          </div>
          <div className={styles.homeGrid}>
            <button
              className={styles.newCard}
              onClick={() => {
                setFormError("");
                setCreating(true);
              }}
            >
              <span className={styles.bigPlus} aria-hidden="true">
                <Icon name="plus" size={30} />
              </span>
              <strong>Novo projeto</strong>
              <span>Escolha o tijolo-base e dê forma à sua próxima ideia.</span>
              <b>Criar planta →</b>
            </button>
            <section
              className={styles.projectList}
              aria-labelledby="projects-title"
            >
              {!projects.length ? (
                <div className={styles.empty}>
                  <span aria-hidden="true">⌂</span>
                  <h3>Um espaço para suas ideias</h3>
                  <p>
                    Os projetos salvos neste navegador
                    <br />
                    aparecerão aqui.
                  </p>
                </div>
              ) : (
                projects.map((p) => (
                  <button
                    disabled={busy}
                    key={p.id}
                    className={styles.projectCard}
                    onClick={() =>
                      void loadProject(p.id)
                        .then((d) => useStore.getState().open(d))
                        .catch((e) => useStore.getState().notify(e.message))
                    }
                  >
                    <span className={styles.projectIcon} aria-hidden="true">
                      <Icon name="plan" size={26} />
                    </span>
                    <span className={styles.projectInfo}>
                      <strong>{p.name}</strong>
                      <small>
                        {p.walls} {p.walls === 1 ? "parede" : "paredes"} ·
                        Atualizado em{" "}
                        {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
                      </small>
                    </span>
                    <b aria-hidden="true">↗</b>
                  </button>
                ))
              )}
            </section>
          </div>
          <p className={styles.localNote}>
            <span aria-hidden="true">↳</span>
            <span>
              Seus desenhos ficam neste navegador. Baixe o arquivo .ecovit para
              fazer backup ou levar seu projeto para outro dispositivo.
            </span>
          </p>
        </main>
      )}
      {creating && (
        <div className={styles.modalBackdrop}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-title"
          >
            <button
              className={styles.close}
              aria-label="Fechar criação"
              onClick={() => setCreating(false)}
            >
              <Icon name="close" />
            </button>
            <span className={styles.eyebrow}>UM NOVO COMEÇO</span>
            <h2 id="create-title">Vamos criar sua planta.</h2>
            <p>Escolha a base. A malha se ajusta para você.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  const [l, w, h] = dimensions.map(cm);
                  const d = createProject(name, {
                    length: l,
                    width: w,
                    height: h,
                  });
                  void useStore.getState().open(d, true);
                  setCreating(false);
                  setTool("wall");
                } catch (err) {
                  setFormError((err as Error).message);
                }
              }}
            >
              <label className={styles.field}>
                Nome do projeto
                <input
                  autoFocus
                  value={name}
                  maxLength={100}
                  required
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                Tijolo-base
                <select
                  value={preset}
                  onChange={(e) => {
                    setPreset(e.target.value);
                    if (e.target.value === "25")
                      setDimensions(["25", "12,5", "7"]);
                    if (e.target.value === "30")
                      setDimensions(["30", "15", "7"]);
                  }}
                >
                  <option value="25">25 × 12,5 × 7 cm</option>
                  <option value="30">30 × 15 × 7 cm</option>
                  <option value="custom">Dimensões personalizadas</option>
                </select>
              </label>
              {preset === "custom" && (
                <div className={styles.dimensionFields}>
                  {[
                    "Comprimento do tijolo",
                    "Largura do tijolo",
                    "Altura do tijolo",
                  ].map((label, i) => (
                    <label className={styles.field} key={label}>
                      {label}
                      <input
                        value={dimensions[i]}
                        required
                        onChange={(e) =>
                          setDimensions(
                            dimensions.map((v, j) =>
                              i === j ? e.target.value : v,
                            ),
                          )
                        }
                      />
                      <small>cm</small>
                    </label>
                  ))}
                </div>
              )}
              <div className={styles.infoBox}>
                O comprimento é sempre o dobro da largura. O tamanho-base será o
                mesmo em todo o projeto.
              </div>
              {formError && (
                <p className={styles.errorText} role="alert">
                  {formError}
                </p>
              )}
              <button disabled={busy} className={styles.primary} type="submit">
                Criar projeto →
              </button>
            </form>
          </section>
        </div>
      )}
      {settings && doc && (
        <OpeningSettingsDialog doc={doc} close={() => setSettings(false)} />
      )}
    </div>
  );
}
