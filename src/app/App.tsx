import { ReferenceImageProperties } from "../editor/ReferenceImage";
import { FloorControls } from "./Floors";
import { PreferencesDialog } from "./Preferences";
import { MeasurementProperties } from "../editor/Measurements";
import { ImageCatalog, ImageElementProperties } from "../editor/ImageElements";
import { setImageElement } from "../domain/image-elements";
import { measurementText } from "../domain/measurements";
import {
  resolveFloorReference,
  type FloorReference,
} from "../domain/floor-reference";
import { Quantities } from "./Quantities";
import { DuplicateProjectDialog } from "./DuplicateProject";
import { DeleteProjectDialog } from "./DeleteProject";
import { editFloor } from "../domain/floors";
import { FiadaPanel, FiadaToolbar } from "../editor/Fiada";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Canvas } from "../editor/Canvas";
import { SlabProperties, deleteSlabSelection } from "../editor/Slabs";
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
  type LocalProject as Project,
  type Tool,
} from "../domain/project";
import { download, importedCopy, readFile } from "../persistence/files";
import { listProjects } from "../persistence/database";
import { useStore, useEditingProject } from "../state/store";
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
                  ].filter((n) => !positive || n > 0),
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
  const imageDraft = useStore((s) => s.imageDraft);
  const root = useStore((s) => s.doc)!;
  const floorReference = useStore((s) => s.floorReference);
  const selected = useStore((s) => s.select),
    busy = useStore((s) => s.busy),
    readonly = useStore((s) => s.readonly);
  const wall = doc.model.walls.find((w) => w.id === selected),
    floor = doc.model.floors[0],
    disabled = busy || readonly || !!imageDraft;
  const [end, setEnd] = useState<"a" | "b">("b"),
    [alternatives, setAlternatives] = useState<number[]>([]),
    [collapsed, setCollapsed] = useState(false);
  useEffect(() => setAlternatives([]), [selected]);
  const updateFloor = (key: "level" | "defaultHeight", n: number) => {
    const root = useStore.getState().doc!;
    try {
      void useStore
        .getState()
        .commit(editFloor(root, floor.id, { [key]: n }), "floor");
    } catch (e) {
      useStore.getState().notify((e as Error).message);
    }
  };
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
      <button
        className={`${styles.reopen} ${styles.iconText}`}
        onClick={() => setCollapsed(false)}
      >
        Propriedades <Icon name="left" />
      </button>
    );
  return (
    <aside className={styles.properties} aria-label="Propriedades">
      <div className={styles.panelTitle}>
        <span>{wall ? "PAREDE SELECIONADA" : "PROPRIEDADES DO PAVIMENTO"}</span>
        <button
          aria-label="Recolher propriedades"
          className={styles.iconButton}
          title="Recolher propriedades"
          data-tooltip="Recolher propriedades"
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
          <h2>{floor.name}</h2>
          <label className={styles.field}>
            Nome do pavimento
            <input
              aria-label="Nome do pavimento"
              key={floor.id + floor.name}
              defaultValue={floor.name}
              maxLength={100}
              disabled={disabled}
              onBlur={(e) => {
                try {
                  void useStore.getState().commit(
                    editFloor(useStore.getState().doc!, floor.id, {
                      name: e.target.value,
                    }),
                    "floor",
                  );
                } catch (err) {
                  useStore.getState().notify((err as Error).message);
                  e.target.value = floor.name;
                }
              }}
            />
          </label>
          {root.model.floors.length > 1 && (
            <label className={styles.field}>
              Referência de pavimento
              <select
                aria-label="Comparar pavimento"
                title="Comparar pavimento"
                disabled={busy}
                value={floorReference}
                onChange={(e) =>
                  useStore.getState().inspect({
                    floorReference: e.target.value as FloorReference,
                  })
                }
              >
                <option value="none">Sem referência</option>
                {(["below", "above"] as const).map((direction) => {
                  const neighbor = resolveFloorReference(
                    root,
                    doc.viewFloorId,
                    direction,
                  );
                  return (
                    neighbor && (
                      <option key={direction} value={direction}>
                        {direction === "below" ? "Inferior" : "Superior"} —{" "}
                        {neighbor.name} · {display(neighbor.level)} cm
                      </option>
                    )
                  );
                })}
              </select>
            </label>
          )}
          <ReferenceImageProperties key={floor.id} />
          <p className={styles.muted}>Referências verticais do desenho</p>
          <Numeric
            label="Cota do pavimento"
            module={doc.project.base.height}
            value={floor.level}
            disabled={disabled}
            commit={(n) => updateFloor("level", n)}
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
          Mobiliários: escolha no catálogo e clique na Planta. Arraste para
          mover; os quatro cantos preservam a proporção atual. As duas alças
          quadradas ajustam largura ou profundidade separadamente; o controle
          circular externo gira. Ajuste dimensões em cm nas propriedades. Escape
          cancela. Uploads são incorporados ao .ecovit; imagens padrão usam o
          catálogo do aplicativo.
        </p>
        <p>
          Imagem: marque um trecho longo de distância conhecida e informe seu
          tamanho em cm. Ajustar libera posição e ângulo; Concluir salva. A
          escala não corrige perspectiva.
        </p>
        <p>
          Clique: selecionar. Arraste o corpo: mover. Arraste uma alça:
          redimensionar.
          <br />
          Roda do mouse: zoom.
          <br />
          Botão do meio + arraste ou Espaço + arraste: navegar.
          <br />
          Esc: cancelar e selecionar.
          <br />
          Delete: excluir seleção.
          <br />
          Ctrl+Z: desfazer.
          <br />
          Ctrl+Y: refazer.
          <br />
          Medida: clique no ponto inicial e depois no ponto final. Alt suspende
          a atração. Arraste o corpo para mover ou uma ponta para ajustar.
        </p>
        <p>
          Portas e janelas: escolha o tipo nas propriedades. Alternar orientação
          percorre as posições e salva imediatamente. No basculante, o tracejado
          indica a projeção do painel; o movimento é vertical.
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
  const slabEditing = useStore((s) => s.slabEditing);
  const editingDoc = useEditingProject();
  const doc = useStore((s) => s.doc),
    busy = useStore((s) => s.busy),
    openingProjectId = useStore((s) => s.openingProjectId),
    readonly = useStore((s) => s.readonly),
    saved = useStore((s) => s.saved),
    message = useStore((s) => s.message),
    history = useStore((s) => s.history);
  useLayoutEffect(() => {
    if (!openingProjectId) return;
    document.documentElement.dataset.openingProject = "true";
    return () => {
      delete document.documentElement.dataset.openingProject;
    };
  }, [openingProjectId]);
  const [tool, setTool] = useState<Tool>("select"),
    [furnitureCatalog, setFurnitureCatalog] = useState(false),
    [settings, setSettings] = useState(false),
    [preferences, setPreferences] = useState(false),
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
    [initialHeight, setInitialHeight] = useState("280"),
    [importing, setImporting] = useState(false),
    [editorName, setEditorName] = useState("");
  const [duplicating, setDuplicating] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const preferencesTrigger = useRef<HTMLButtonElement>(null);
  const [returnPreferencesFocus, setReturnPreferencesFocus] = useState(false);
  useEffect(() => {
    if (returnPreferencesFocus && !busy) {
      preferencesTrigger.current?.focus();
      setReturnPreferencesFocus(false);
    }
  }, [returnPreferencesFocus, busy]);
  const deleteTrigger = useRef<HTMLButtonElement>(null);
  const [fadingProjects, setFadingProjects] = useState<string[]>([]);
  const [incompatibleProject, setIncompatibleProject] = useState<string | null>(
    null,
  );
  useEffect(() => {
    if (incompatibleProject)
      document
        .getElementById(`project-compatibility-${incompatibleProject}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [incompatibleProject]);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(
    null,
  );
  const changeTool = useCallback((t: Tool) => {
    useStore
      .getState()
      .inspect({
        imageDraft: null,
        imageOpacity: null,
        imageRequest: null,
        furnitureDraft: null,
      });
    setTool(t);
  }, []);
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
      if (document.querySelector("dialog[open]")) {
        if (
          !(e.target as HTMLElement).closest(
            "input,textarea,select,[contenteditable]",
          ) &&
          (e.key === "Delete" ||
            ((e.ctrlKey || e.metaKey) &&
              ["z", "y"].includes(e.key.toLowerCase())))
        )
          e.preventDefault();
        return;
      }
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
        if (s.imageDraft || s.slabDraft || s.slabEditing || s.furnitureDraft)
          return;
        if (s.pendingOpening) s.inspect({ pendingOpening: null });
        else if (s.doc.model.imageElements.some((i) => i.id === s.select)) {
          void s.commit(setImageElement(s.doc, null, s.select), "furniture");
        } else if (deleteSlabSelection()) return;
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
            <button
              className={`${styles.projectsReturn} ${styles.iconText}`}
              title="Voltar à lista de projetos"
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
              <Icon name="back" /> Projetos
            </button>
            <div className={styles.divider} />
            <div className={styles.projectIdentity}>
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
                  if (
                    editorName.trim() &&
                    editorName.trim() !== doc.project.name
                  )
                    void useStore.getState().commit({
                      ...doc,
                      project: { ...doc.project, name: editorName.trim() },
                    });
                  else setEditorName(doc.project.name);
                }}
              />
              <button
                disabled={busy || readonly}
                // Let the dialog focus commit the name after this click opens it.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSettings(true)}
                className={styles.iconButton}
                aria-label="Configurações"
                title="Configurações do projeto"
                data-tooltip="Configurações do projeto"
              >
                <Icon name="settings" />
              </button>
              <button
                ref={preferencesTrigger}
                disabled={busy}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setPreferences(true)}
                className={styles.iconButton}
                aria-label="Preferências do Ecovit"
                title="Preferências do Ecovit"
                data-tooltip="Preferências do Ecovit"
              >
                <Icon name="preferences" />
              </button>
            </div>
            <span
              className={`${styles.saveStatus} ${saved === "error" ? styles.errorText : ""}`}
              role="status"
            >
              <Icon
                name={
                  readonly
                    ? "readonly"
                    : saved === "saving"
                      ? "saving"
                      : saved === "error"
                        ? "warning"
                        : "saved"
                }
                size="compact"
              />
              {readonly
                ? "Somente leitura"
                : saved === "saving"
                  ? "Salvando…"
                  : saved === "error"
                    ? "Não salvo"
                    : "Salvo no navegador"}
            </span>
            <div className={styles.headerActions}>
              <Quantities
                key={doc.project.id}
                doc={doc}
                diagnostics={() => setDiagnostics(true)}
              />
              <button
                disabled={busy || importing}
                onClick={() => input.current?.click()}
                className={`${styles.iconButton} ${styles.fileAction}`}
                aria-label="Carregar arquivo"
                title="Carregar arquivo .ecovit"
                data-tooltip="Carregar arquivo .ecovit"
              >
                <Icon name="upload" />
              </button>
              <button
                className={`${styles.iconButton} ${styles.fileAction}`}
                aria-label="Baixar projeto"
                title="Baixar projeto .ecovit"
                data-tooltip="Baixar projeto .ecovit"
                disabled={busy || importing}
                onClick={() => {
                  try {
                    if (download(doc))
                      useStore
                        .getState()
                        .notify(
                          "Projeto baixado com todos os desenhos, configurações e ajustes. Para caber no arquivo, o resultado calculado será reconstruído ao abrir; o projeto nesta aba permanece atualizado.",
                        );
                  } catch (e) {
                    useStore.getState().notify((e as Error).message);
                  }
                }}
              >
                <Icon name="download" />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.headerActions}>
            <span className={styles.localBadge}>Salvo neste navegador</span>
            <button
              disabled={busy || importing}
              onClick={() => input.current?.click()}
              className={styles.iconText}
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
            className={styles.iconButton}
            title="Fechar aviso"
            data-tooltip="Fechar aviso"
            onClick={() => useStore.getState().notify("")}
          >
            <Icon name="close" />
          </button>
        </div>
      )}
      {doc ? (
        <>
          <div className={styles.editorControls}>
            <FloorControls />
            <div className={styles.toolbar}>
              <div className={styles.tools}>
                <button
                  className={`${styles.iconText} ${tool === "select" && !groutMode ? styles.active : ""}`}
                  aria-pressed={tool === "select" && !groutMode}
                  disabled={busy || readonly}
                  onClick={() => {
                    changeTool("select");
                    useStore
                      .getState()
                      .inspect({ groutMode: false, groutCell: null });
                  }}
                >
                  <Icon name="select" /> Selecionar
                </button>
                <button
                  className={`${styles.iconText} ${tool === "wall" ? styles.active : ""}`}
                  aria-pressed={tool === "wall"}
                  disabled={busy || readonly}
                  onClick={() => {
                    useStore
                      .getState()
                      .inspect({ mode: "plan", preview: null });
                    changeTool("wall");
                  }}
                >
                  <Icon name="wall" /> Parede
                </button>
                <span className={styles.divider} />
                {mode === "plan" && (
                  <button
                    aria-pressed={tool === "slab"}
                    className={`${styles.iconText} ${tool === "slab" ? styles.active : ""}`}
                    disabled={
                      busy || readonly || !!editingDoc?.model.slabs.length
                    }
                    title={
                      editingDoc?.model.slabs.length
                        ? "Este pavimento já tem uma laje"
                        : "Desenhar laje"
                    }
                    onClick={() => changeTool("slab")}
                  >
                    <Icon name="slab" /> Laje
                  </button>
                )}
                {mode === "plan" &&
                  (["door", "window", "opening"] as const).map((kind) => (
                    <button
                      key={kind}
                      aria-pressed={tool === kind}
                      className={`${styles.iconText} ${tool === kind ? styles.active : ""}`}
                      disabled={busy || readonly}
                      onClick={() => {
                        useStore.getState().inspect({ pendingOpening: null });
                        changeTool(kind);
                      }}
                    >
                      <Icon name={kind} />
                      {openingLabel[kind]}
                    </button>
                  ))}
                {mode === "plan" && (
                  <button
                    className={`${styles.iconText} ${tool === "measure" ? styles.active : ""}`}
                    aria-pressed={tool === "measure"}
                    disabled={busy || readonly}
                    onClick={() => changeTool("measure")}
                  >
                    <Icon name="measure" /> Medida
                  </button>
                )}
                {mode === "plan" && (
                  <button
                    className={styles.iconText}
                    disabled={busy || readonly}
                    onClick={() => {
                      changeTool("select");
                      useStore
                        .getState()
                        .inspect({
                          slabDraft: null,
                          slabEditing: false,
                          pendingOpening: null,
                        });
                      setFurnitureCatalog(true);
                    }}
                  >
                    <Icon name="furniture" />
                    Mobiliários
                  </button>
                )}
                {mode === "plan" &&
                  (!!editingDoc!.model.slabs.length ||
                    !!editingDoc!.model.imageElements.length ||
                    !!editingDoc!.model.measurements.length ||
                    !!editingDoc!.model.openings.length) && (
                    <select
                      aria-label="Selecionar elemento"
                      disabled={busy}
                      value={
                        editingDoc!.model.openings.some(
                          (o) => o.id === selected,
                        ) ||
                        editingDoc!.model.imageElements.some(
                          (i) => i.id === selected,
                        ) ||
                        editingDoc!.model.measurements.some(
                          (m) => m.id === selected,
                        ) ||
                        editingDoc!.model.slabs.some(
                          (s) =>
                            s.id === selected ||
                            s.openings.some((o) => o.id === selected),
                        )
                          ? selected!
                          : ""
                      }
                      onChange={(e) => {
                        useStore.getState().inspect({
                          slabDraft: null,
                          slabEditing: false,
                          pendingOpening: null,
                        });
                        changeTool("select");
                        useStore.getState().choose(e.target.value || null);
                      }}
                    >
                      <option value="">Selecionar elemento…</option>
                      {!!editingDoc!.model.imageElements.length && (
                        <optgroup label="Mobiliários">
                          {editingDoc!.model.imageElements.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {!!editingDoc!.model.measurements.length && (
                        <optgroup label="Medidas">
                          {editingDoc!.model.measurements.map((m, i) => (
                            <option key={m.id} value={m.id}>
                              Medida {i + 1} · {measurementText(m)}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {!!editingDoc!.model.slabs.length && (
                        <optgroup label="Laje">
                          {editingDoc!.model.slabs.flatMap((s) => [
                            <option key={s.id} value={s.id}>
                              Laje · {editingDoc!.model.floors[0].name}
                            </option>,
                            ...s.openings.map((o, i) => (
                              <option key={o.id} value={o.id}>
                                Abertura {i + 1} · Laje
                              </option>
                            )),
                          ])}
                        </optgroup>
                      )}
                      {!!editingDoc!.model.openings.length && (
                        <optgroup label="Vãos de parede">
                          {editingDoc!.model.openings.map((o, i) => (
                            <option key={o.id} value={o.id}>
                              {openingLabel[o.kind]} {i + 1} · Parede{" "}
                              {editingDoc!.model.walls.findIndex(
                                (w) => w.id === o.wallId,
                              ) + 1}{" "}
                              · base {display(o.base)} / topo{" "}
                              {display(o.base + o.height)} cm
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  )}
                <button
                  aria-label="Desfazer"
                  className={styles.iconButton}
                  data-tooltip="Desfazer (Ctrl+Z)"
                  title="Desfazer (Ctrl+Z)"
                  disabled={
                    busy || readonly || (!history.past.length && !slabEditing)
                  }
                  onClick={() => void useStore.getState().undo()}
                >
                  <Icon name="undo" />
                </button>
                <button
                  aria-label="Refazer"
                  className={styles.iconButton}
                  data-tooltip="Refazer (Ctrl+Y)"
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
              editingDoc!.model.measurements.some((m) => m.id === selected) ? (
                <MeasurementProperties doc={editingDoc!} />
              ) : editingDoc!.model.imageElements.some(
                  (e) => e.id === selected,
                ) ? (
                <ImageElementProperties key={selected} doc={editingDoc!} />
              ) : editingDoc!.model.slabs.some(
                  (s) =>
                    s.id === selected ||
                    s.openings.some((o) => o.id === selected),
                ) ? (
                <SlabProperties
                  key={`${editingDoc!.viewFloorId}-${tool}-${selected}`}
                  doc={editingDoc!}
                  setTool={changeTool}
                />
              ) : pendingOpening ||
                doc.model.openings.some((o) => o.id === selected) ? (
                <OpeningProperties doc={editingDoc!} />
              ) : (
                <Properties key={editingDoc!.viewFloorId} doc={editingDoc!} />
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
              <span
                className={styles.footerFloorName}
                title={editingDoc!.model.floors[0].name}
              >
                {editingDoc!.model.floors[0].name}
              </span>
              {" · Módulo "}
              <b>{display(doc.project.base.width)} cm</b> · Face externa
            </span>
            <span>
              {doc.model.walls.length}{" "}
              {doc.model.walls.length === 1 ? "parede" : "paredes"} · Planta em
              centímetros
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
              disabled={busy || importing}
              onClick={() => {
                setFormError("");
                setCreating(true);
              }}
            >
              <span className={styles.bigPlus} aria-hidden="true">
                <Icon name="plus" size="feature" />
              </span>
              <strong>Novo projeto</strong>
              <span>Escolha o tijolo-base e dê forma à sua próxima ideia.</span>
              <b className={styles.iconText}>
                Criar planta <Icon name="next" />
              </b>
            </button>
            <section
              className={styles.projectList}
              aria-labelledby="projects-title"
            >
              {!projects.length ? (
                <div className={styles.empty}>
                  <span aria-hidden="true">
                    <Icon name="home" size="feature" />
                  </span>
                  <h3>Um espaço para suas ideias</h3>
                  <p>
                    Os projetos salvos neste navegador
                    <br />
                    aparecerão aqui.
                  </p>
                </div>
              ) : (
                projects.map((p) => (
                  <div
                    className={`${styles.projectSlot} ${fadingProjects.includes(p.id) ? styles.projectRowExiting : ""}`}
                    key={p.id}
                    inert={fadingProjects.includes(p.id)}
                    onAnimationEnd={(event) => {
                      if (
                        event.target !== event.currentTarget ||
                        !fadingProjects.includes(p.id)
                      )
                        return;
                      setProjects((current) =>
                        current.filter((project) => project.id !== p.id),
                      );
                      setFadingProjects((current) =>
                        current.filter((id) => id !== p.id),
                      );
                    }}
                  >
                    <div className={styles.projectRow}>
                      <button
                        disabled={busy}
                        key={p.id}
                        className={`${styles.projectCard} ${openingProjectId === p.id ? styles.projectOpeningCard : ""}`}
                        aria-expanded={
                          !p.compatible
                            ? incompatibleProject === p.id
                            : undefined
                        }
                        aria-describedby={
                          !p.compatible && incompatibleProject === p.id
                            ? `project-compatibility-${p.id}`
                            : undefined
                        }
                        onClick={() => {
                          if (!p.compatible) {
                            setIncompatibleProject(p.id);
                            return;
                          }
                          void useStore.getState().open(p.id);
                        }}
                      >
                        <span className={styles.projectIcon} aria-hidden="true">
                          {openingProjectId === p.id ? (
                            <span className={styles.openingSpinner}>
                              <Icon name="saving" size="card" />
                            </span>
                          ) : (
                            <Icon name="plan" size="card" />
                          )}
                        </span>
                        <span className={styles.projectInfo}>
                          <strong title={p.name}>{p.name}</strong>
                          {openingProjectId === p.id ? (
                            <small role="status">Abrindo projeto…</small>
                          ) : (
                            <small>
                              {!p.compatible && (
                                <span>Formato incompatível · </span>
                              )}
                              {p.walls} {p.walls === 1 ? "parede" : "paredes"} ·
                              Atualizado em{" "}
                              {new Date(p.updatedAt).toLocaleDateString(
                                "pt-BR",
                              )}
                            </small>
                          )}
                          {!p.compatible && incompatibleProject === p.id && (
                            <small
                              id={`project-compatibility-${p.id}`}
                              role="status"
                              className={styles.projectCompatibilityMessage}
                            >
                              Este projeto usa um formato antigo e não pode ser
                              aberto nesta versão. Arquivos de marcos anteriores
                              não são convertidos. Crie um novo projeto.
                            </small>
                          )}
                        </span>
                      </button>
                      <div className={styles.projectActions}>
                        <button
                          className={styles.iconButton}
                          aria-label="Duplicar"
                          data-tooltip="Duplicar"
                          disabled={busy || !!duplicating || !p.compatible}
                          title="Duplicar o último estado salvo"
                          onClick={() =>
                            setDuplicating({ id: p.id, name: p.name })
                          }
                        >
                          <Icon name="copy" />
                        </button>
                        <button
                          className={`${styles.iconButton} ${styles.deleteProject}`}
                          aria-label="Excluir"
                          title="Excluir projeto"
                          data-tooltip="Excluir"
                          disabled={busy}
                          onClick={(event) => {
                            deleteTrigger.current = event.currentTarget;
                            setDeleting({ id: p.id, name: p.name });
                          }}
                        >
                          <Icon name="delete" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
          <p className={styles.localNote}>
            <span aria-hidden="true">
              <Icon name="download" />
            </span>
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
              className={`${styles.close} ${styles.iconButton}`}
              aria-label="Fechar criação"
              title="Fechar criação"
              data-tooltip="Fechar criação"
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
                  const d = createProject(
                    name,
                    {
                      length: l,
                      width: w,
                      height: h,
                    },
                    28000 % h === 0 ? 28000 : cm(initialHeight),
                  );
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
              {preset === "custom" &&
                (() => {
                  try {
                    const h = cm(dimensions[2]);
                    if (h <= 0 || 28000 % h === 0) return null;
                    return (
                      <label className={styles.field}>
                        Altura inicial das paredes (cm)
                        <input
                          aria-label="Altura inicial das paredes"
                          value={initialHeight}
                          onChange={(e) => setInitialHeight(e.target.value)}
                        />
                        <span>
                          Escolha uma altura modular:{" "}
                          {[Math.floor(28000 / h) * h, Math.ceil(28000 / h) * h]
                            .filter((v) => v > 0)
                            .map((v) => (
                              <button
                                type="button"
                                key={v}
                                onClick={() => setInitialHeight(display(v))}
                              >
                                {display(v)} cm
                              </button>
                            ))}
                        </span>
                      </label>
                    );
                  } catch {
                    return null;
                  }
                })()}
              <div className={styles.infoBox}>
                O comprimento é sempre o dobro da largura. O tamanho-base será o
                mesmo em todo o projeto.
              </div>
              {formError && (
                <p className={styles.errorText} role="alert">
                  {formError}
                </p>
              )}
              <button
                disabled={busy}
                className={`${styles.primary} ${styles.iconText}`}
                type="submit"
              >
                Criar projeto <Icon name="next" />
              </button>
            </form>
          </section>
        </div>
      )}
      {duplicating && (
        <DuplicateProjectDialog
          source={duplicating}
          close={() => setDuplicating(null)}
          saved={() => {
            setDuplicating(null);
            void listProjects()
              .then(setProjects)
              .catch(() =>
                useStore
                  .getState()
                  .notify(
                    "Cópia salva. Não foi possível atualizar a lista; reabra Projetos.",
                  ),
              );
          }}
        />
      )}
      {deleting && (
        <DeleteProjectDialog
          source={deleting}
          trigger={deleteTrigger.current}
          close={() => setDeleting(null)}
          deleted={() => {
            setFadingProjects((current) => [...current, deleting.id]);
            setDeleting(null);
          }}
        />
      )}
      {settings && doc && (
        <OpeningSettingsDialog
          doc={editingDoc!}
          close={() => setSettings(false)}
        />
      )}
      {furnitureCatalog && doc && (
        <ImageCatalog
          close={() => setFurnitureCatalog(false)}
          select={(element, asset) => {
            changeTool("furniture");
            useStore.getState().choose(null);
            useStore.getState().inspect({ furnitureDraft: { element, asset } });
            setFurnitureCatalog(false);
          }}
        />
      )}
      {preferences && doc && (
        <PreferencesDialog
          close={() => {
            setPreferences(false);
            setReturnPreferencesFocus(true);
          }}
        />
      )}
    </div>
  );
}
