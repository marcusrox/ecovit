import { hasPendingEditorEdits } from "../../editor/pending-edit";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useStore } from "../../state/store";
import { usePreferences } from "../../state/preferences";
import { display } from "../../domain/project";
import { textPending } from "../../editor/Text";
import { preparePages, scales, type ExportOptions } from "./pages";
import type { GeneratedDrawing } from "./pdf";
import styles from "./DrawingExport.module.css";
import { Icon } from "../../ui/Icon";

const Preview = lazy(() => import("./PdfPreview"));
export default function DrawingExportDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  const doc = useStore((s) => s.doc)!,
    busy = useStore((s) => s.busy);
  const [options, setOptions] = useState<ExportOptions>(() => {
    const s = useStore.getState();
    return {
      floorId: s.activeFloorId ?? doc.model.floors[0].id,
      content: s.mode,
      selection: "current",
      first: String(s.course),
      last: String(s.course),
      paper: "A4",
      landscape: false,
      planScale: 50,
      courseScale: 20,
      furniture: true,
      terrain: true,
      image: false,
    };
  });
  const [error, setError] = useState(""),
    [progress, setProgress] = useState(""),
    [generating, setGenerating] = useState(false),
    [ready, setReady] = useState(false);
  const [result, setResult] = useState<{
    file: GeneratedDrawing;
    key: string;
  }>();
  const dialog = useRef<HTMLDialogElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    controller = useRef<AbortController | undefined>(undefined),
    ticket = useRef(0),
    mounted = useRef(true);
  const optionsKey = JSON.stringify(options),
    currentKey = useRef(optionsKey);
  currentKey.current = optionsKey;
  const stale = result && result.key !== optionsKey;
  useEffect(() => {
    mounted.current = true;
    dialog.current!.showModal();
    heading.current?.focus();
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  const previewReady = useCallback(() => setReady(true), []),
    previewError = useCallback((message: string) => {
      setReady(false);
      setError(message);
    }, []);
  let selection = "",
    selectionError = "";
  try {
    const p = preparePages(doc, options);
    selection = p.drawings
      .filter((d) => d.mode === "course")
      .map((d) => d.course)
      .join(", ");
  } catch (e) {
    selectionError = (e as Error).message;
  }
  function change<K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K],
  ) {
    setOptions((o) => ({ ...o, [key]: value }));
    setError("");
  }
  async function generate() {
    const s = useStore.getState();
    if (!s.doc || s.busy) {
      setError("Aguarde a conclusão do processamento antes de gerar o PDF.");
      return;
    }
    if (
      hasPendingEditorEdits() ||
      s.imageOpacity !== null ||
      textPending(s.textDraft, s.doc) ||
      s.furnitureDraft ||
      s.imageDraft ||
      s.terrainDraft ||
      s.slabDraft ||
      s.pendingOpening ||
      s.preview
    ) {
      setError(
        "Conclua ou cancele as edições pendentes no editor antes de exportar.",
      );
      return;
    }
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const id = ++ticket.current,
      key = currentKey.current;
    setGenerating(true);
    setError("");
    setReady(false);
    setResult(undefined);
    // Store updates replace documents. Capture one immutable revision and all visual options.
    const snapshot = {
      doc: s.doc,
      options: { ...options },
      labels: { ...usePreferences.getState().labels },
      unsaved: s.saved !== "saved",
      emitted: new Date(),
    };
    try {
      const { generateDrawingPdf } = await import("./pdf");
      const file = await generateDrawingPdf(
        snapshot,
        abort.signal,
        (message) => {
          if (mounted.current && ticket.current === id) setProgress(message);
        },
      );
      if (
        mounted.current &&
        ticket.current === id &&
        currentKey.current === key
      )
        setResult({ file, key });
      else if (mounted.current)
        setError("As opções mudaram durante a geração. Gere o PDF novamente.");
    } catch (e) {
      if (mounted.current && !abort.signal.aborted)
        setError(
          e instanceof Error
            ? e.message
            : "Não foi possível gerar o PDF. Tente novamente.",
        );
    } finally {
      if (mounted.current && ticket.current === id) {
        setGenerating(false);
        setProgress("");
      }
    }
  }
  function download() {
    if (!result || stale || !ready || generating) return;
    const url = URL.createObjectURL(
      new Blob([result.file.bytes], { type: "application/pdf" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = result.file.filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const scale = (key: "planScale" | "courseScale", label: string) => (
    <label>
      {label}
      <select
        value={options[key]}
        onChange={(e) => change(key, Number(e.target.value))}
      >
        {scales.map((s) => (
          <option key={s} value={s}>
            1:{s}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label="Exportar desenhos em PDF"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <h1 id="drawing-export-title" ref={heading} tabIndex={-1}>
          Exportar desenhos em PDF
        </h1>
        <button aria-label="Fechar exportação" onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>
      <div className={styles.body}>
        <section
          className={styles.settings}
          aria-label="Configurações da exportação"
        >
          <label>
            Pavimento da exportação
            <select
              value={options.floorId}
              onChange={(e) => change("floorId", e.target.value)}
            >
              {doc.model.floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} · {display(f.level)} cm
                </option>
              ))}
            </select>
          </label>
          <label>
            Conteúdo
            <select
              value={options.content}
              onChange={(e) =>
                change("content", e.target.value as ExportOptions["content"])
              }
            >
              <option value="plan">Planta</option>
              <option value="course">Fiadas</option>
              <option value="both">Planta e fiadas</option>
            </select>
          </label>
          {options.content !== "plan" && (
            <fieldset>
              <legend>Fiadas</legend>
              <label>
                Selecionar fiadas
                <select
                  value={options.selection}
                  onChange={(e) =>
                    change(
                      "selection",
                      e.target.value as ExportOptions["selection"],
                    )
                  }
                >
                  <option value="current">Atual</option>
                  <option value="range">Intervalo</option>
                  <option value="all">Todas</option>
                  <option value="relevant">Relevantes</option>
                </select>
              </label>
              {["current", "range"].includes(options.selection) && (
                <label>
                  {options.selection === "current"
                    ? "Número da fiada"
                    : "Fiada inicial"}
                  <input
                    inputMode="numeric"
                    value={options.first}
                    onChange={(e) => change("first", e.target.value)}
                  />
                </label>
              )}
              {options.selection === "range" && (
                <label>
                  Fiada final
                  <input
                    inputMode="numeric"
                    value={options.last}
                    onChange={(e) => change("last", e.target.value)}
                  />
                </label>
              )}
              {selection && <p>Fiadas selecionadas: {selection}</p>}
            </fieldset>
          )}
          <label>
            Papel
            <select
              value={options.paper}
              onChange={(e) =>
                change("paper", e.target.value as ExportOptions["paper"])
              }
            >
              <option>A4</option>
              <option>A3</option>
            </select>
          </label>
          <label>
            Orientação
            <select
              value={String(options.landscape)}
              onChange={(e) => change("landscape", e.target.value === "true")}
            >
              <option value="false">Retrato</option>
              <option value="true">Paisagem</option>
            </select>
          </label>
          {options.content !== "course" &&
            scale("planScale", "Escala da planta")}
          {options.content !== "plan" &&
            scale("courseScale", "Escala das fiadas")}
          {options.content !== "course" && (
            <fieldset>
              <legend>Elementos da planta</legend>
              {(
                [
                  ["furniture", "Mobiliários"],
                  ["terrain", "Terreno e rosa dos ventos"],
                  ["image", "Imagem de referência"],
                ] as const
              ).map(([key, label]) => (
                <label className={styles.checkbox} key={key}>
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={(e) => change(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          )}
          <p>
            Margens de 10 mm. Para imprimir o PDF, use tamanho real (100%) e o
            papel escolhido, sem ajustar à página.
          </p>
        </section>
        <div className={styles.output}>
          {(error || selectionError) && (
            <p role="alert" className={styles.error}>
              {error || selectionError}
            </p>
          )}
          {generating && <p role="status">{progress || "Preparando PDF…"}</p>}
          {stale && (
            <p role="status">
              Prévia desatualizada. Gere o PDF com as novas opções antes de
              baixar.
            </p>
          )}
          {result ? (
            <Suspense fallback={<p role="status">Abrindo PDF…</p>}>
              <Preview
                bytes={result.file.bytes}
                onReady={previewReady}
                onError={previewError}
              />
            </Suspense>
          ) : (
            !generating && (
              <p>
                Escolha as opções e clique em Gerar PDF para visualizar as
                páginas do arquivo.
              </p>
            )
          )}
        </div>
      </div>
      <footer>
        <button onClick={onClose}>Cancelar</button>
        <button
          disabled={generating || busy || !!selectionError}
          onClick={() => void generate()}
        >
          {generating ? "Gerando…" : "Gerar PDF"}
        </button>
        <button
          disabled={!result || !!stale || !ready || generating}
          onClick={download}
        >
          Baixar PDF
        </button>
      </footer>
    </dialog>
  );
}
