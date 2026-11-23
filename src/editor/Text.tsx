import {
  useEffect,
  useCallback,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Group, Layer, Rect, Text, Circle } from "react-konva";
import {
  cm,
  display,
  type LocalProject,
  type Point,
  type Tool,
} from "../domain/project";
import {
  newText,
  normalizeText,
  putText,
  textBox,
  textLocal,
  textSchema,
  textWorld,
  wrapText,
  type TextAnnotation,
  type TextDraft,
} from "../domain/text";
import { useStore } from "../state/store";
import { Icon } from "../ui/Icon";
import styles from "../ui/App.module.css";

const draftOf = (annotation: TextAnnotation, fresh = false): TextDraft => ({
  annotation: { ...annotation },
  size: display(annotation.size),
  width: display(annotation.width),
  fresh,
  placing: false,
  focus: true,
});
function candidate(d: TextDraft): TextAnnotation {
  const size = cm(d.size),
    width = cm(d.width);
  if (size >= 100 && size <= 10000 && width < 2 * size)
    throw new Error(
      `A largura mínima para este tamanho é ${display(2 * size)} cm.`,
    );
  return textSchema.parse({
    ...d.annotation,
    size,
    width,
  });
}
export function textPending(
  d: TextDraft | null,
  doc: { model: { texts: TextAnnotation[] } },
) {
  if (!d) return false;
  try {
    return (
      d.fresh ||
      JSON.stringify(candidate(d)) !==
        JSON.stringify(doc.model.texts.find((t) => t.id === d.annotation.id))
    );
  } catch {
    return true;
  }
}
function edit(annotation: TextAnnotation, fresh = false) {
  const s = useStore.getState();
  if (s.busy || s.readonly || s.imageDraft) return;
  s.choose(annotation.id);
  s.setPropertiesCollapsed(false);
  s.inspect({
    textDraft:
      s.textDraft?.annotation.id === annotation.id
        ? { ...s.textDraft, focus: true }
        : draftOf(annotation, fresh),
  });
}
async function apply(d: TextDraft, setTool: (t: Tool) => void) {
  const s = useStore.getState();
  if (
    !s.doc ||
    s.busy ||
    s.readonly ||
    s.imageDraft ||
    s.activeFloorId !== d.annotation.floorId
  )
    return;
  const next = candidate(d),
    current = s.doc.model.texts.find((t) => t.id === next.id);
  if (current) {
    next.x = current.x;
    next.y = current.y;
  }
  if (JSON.stringify(current) !== JSON.stringify(next))
    void s.commit(putText(s.doc, next), "text");
  const latest = useStore.getState();
  if (
    JSON.stringify(latest.doc?.model.texts.find((t) => t.id === next.id)) !==
    JSON.stringify(next)
  )
    throw new Error(latest.message || "Não foi possível aplicar o texto.");
  latest.inspect({ textDraft: null });
  if (d.fresh) setTool("select");
  latest.choose(next.id);
}
async function saveContent(d: TextDraft, setTool: (t: Tool) => void) {
  const s = useStore.getState();
  if (
    !s.doc ||
    s.busy ||
    s.readonly ||
    s.imageDraft ||
    s.activeFloorId !== d.annotation.floorId ||
    d.placing
  )
    return;
  const current = s.doc.model.texts.find((t) => t.id === d.annotation.id);
  if (!current) {
    if (d.fresh && s.textDraft?.annotation.id === d.annotation.id)
      await apply(d, setTool);
    return;
  }
  const next = textSchema.parse({ ...current, content: d.annotation.content });
  if (next.content !== current.content)
    void s.commit(putText(s.doc, next), "text");
  const latest = useStore.getState();
  if (
    latest.doc?.model.texts.find((t) => t.id === next.id)?.content !==
    next.content
  )
    throw new Error(latest.message || "Não foi possível aplicar o texto.");
  if (
    latest.doc &&
    latest.textDraft?.annotation.id === next.id &&
    !textPending(latest.textDraft, latest.doc)
  )
    latest.inspect({ textDraft: null });
}
export function deleteTextSelection() {
  if (useStore.getState().textDraft?.fresh) return true;
  const s = useStore.getState(),
    text = s.doc?.model.texts.find((t) => t.id === s.select);
  if (!text) return false;
  if (s.busy || s.readonly || (s.doc && textPending(s.textDraft, s.doc)))
    return true;
  void s.commit(putText(s.doc!, null, text.id), "text");
  s.choose(null);
  return true;
}
export function TextProperties({ setTool }: { setTool: (t: Tool) => void }) {
  const s = useStore(),
    input = useRef<HTMLTextAreaElement>(null),
    [error, setError] = useState("");
  const original = s.doc?.model.texts.find((t) => t.id === s.select);
  const d = s.textDraft ?? (original ? draftOf(original) : null);
  useEffect(() => {
    const current = useStore.getState();
    if (current.textDraft?.focus && !current.propertiesCollapsed) {
      input.current?.focus();
      input.current?.select();
      current.inspect({ textDraft: { ...current.textDraft, focus: false } });
    }
  }, [s.textDraft, s.propertiesCollapsed]);
  useEffect(() => {
    setError("");
  }, [s.select]);
  useEffect(() => {
    // Save before a canvas/tool pointer handler can replace the focused annotation.
    const leave = (event: PointerEvent) => {
      const field = input.current;
      if (
        field &&
        document.activeElement === field &&
        event.target !== field &&
        !(event.target as Element).closest("[data-text-explicit]")
      )
        field.blur();
    };
    document.addEventListener("pointerdown", leave, true);
    return () => document.removeEventListener("pointerdown", leave, true);
  }, []);
  if (!d || !s.doc) return null;
  const pending = textPending(s.textDraft, s.doc),
    disabled = s.busy || s.readonly || !!s.imageDraft;
  let validation = "";
  try {
    candidate(d);
  } catch (e) {
    validation =
      e instanceof Error
        ? "issues" in e
          ? "Confira o conteúdo (até 2.000 caracteres), cor e medidas. Largura mínima: duas vezes o tamanho."
          : e.message
        : String(e);
  }
  const change = (
    patch: Partial<TextAnnotation>,
    fields: Partial<TextDraft> = {},
  ) => {
    const latest = useStore.getState();
    if (latest.select !== d.annotation.id) return;
    const current = latest.doc?.model.texts.find(
      (t) => t.id === d.annotation.id,
    );
    const base =
      latest.textDraft?.annotation.id === d.annotation.id
        ? latest.textDraft
        : current
          ? draftOf(current)
          : d;
    setError("");
    s.inspect({
      textDraft: {
        ...base,
        annotation: { ...base.annotation, ...patch },
        focus: false,
        ...fields,
      },
    });
  };
  if (s.propertiesCollapsed)
    return (
      <button
        className={`${styles.reopen} ${styles.iconText}`}
        onClick={() => s.setPropertiesCollapsed(false)}
      >
        Propriedades do texto <Icon name="left" />
      </button>
    );
  return (
    <aside
      className={`${styles.properties} ${styles.textProperties}`}
      aria-label="Propriedades do texto"
    >
      <div className={styles.panelTitle}>
        <span>TEXTO SELECIONADO</span>
        <button
          className={styles.iconButton}
          aria-label="Recolher propriedades"
          onClick={() => s.setPropertiesCollapsed(true)}
        >
          <Icon name="right" />
        </button>
      </div>
      <div
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            s.inspect({ textDraft: null });
            setError("");
          }
        }}
      >
        <label>
          Conteúdo
          <textarea
            ref={input}
            aria-label="Conteúdo do texto"
            rows={5}
            value={d.annotation.content}
            disabled={disabled}
            onChange={(e) => change({ content: normalizeText(e.target.value) })}
            onBlur={() => {
              const draft = useStore.getState().textDraft;
              if (draft?.annotation.id === d.annotation.id)
                void saveContent(draft, setTool).catch((e) => {
                  if (useStore.getState().select === d.annotation.id)
                    setError(
                      e instanceof Error && "issues" in e
                        ? "Informe um texto não vazio com até 2.000 caracteres."
                        : e.message,
                    );
                });
            }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />
        </label>
        <label>
          Tamanho (cm)
          <input
            aria-label="Tamanho do texto (cm)"
            value={d.size}
            disabled={disabled}
            onChange={(e) => change({}, { size: e.target.value })}
          />
        </label>
        <label>
          Largura (cm)
          <input
            aria-label="Largura do texto (cm)"
            value={d.width}
            disabled={disabled}
            onChange={(e) => change({}, { width: e.target.value })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={d.annotation.bold}
            disabled={disabled}
            onChange={(e) => change({ bold: e.target.checked })}
          />
          Negrito
        </label>
        <label>
          Cor do texto
          <input
            aria-label="Cor do texto"
            type="color"
            value={d.annotation.color}
            disabled={disabled}
            onChange={(e) => change({ color: e.target.value })}
          />
        </label>
        <label>
          Alinhamento
          <select
            aria-label="Alinhamento do texto"
            value={d.annotation.align}
            disabled={disabled}
            onChange={(e) =>
              change({ align: e.target.value as TextAnnotation["align"] })
            }
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={d.annotation.background}
            disabled={disabled}
            onChange={(e) => change({ background: e.target.checked })}
          />
          Fundo claro
        </label>
        <label>
          <input
            type="checkbox"
            checked={d.annotation.border}
            disabled={disabled}
            onChange={(e) => change({ border: e.target.checked })}
          />
          Contorno
        </label>
        <p className={styles.note}>
          O conteúdo é salvo ao sair do campo. Use Aplicar ou Cancelar para os
          demais ajustes pendentes.
        </p>
        {d.placing && <p>Clique na planta para posicionar a cópia.</p>}
        {(validation || error) && (
          <p role="alert" className={styles.errorText}>
            {error || validation}
          </p>
        )}
        <div className={styles.propertyActions}>
          <button
            className={`${styles.iconText} ${styles.propertyApply}`}
            data-text-explicit
            onMouseDown={(e) => e.preventDefault()}
            disabled={disabled || !!validation || d.placing || !pending}
            onClick={() =>
              void apply(d, setTool).catch((e) => setError(e.message))
            }
          >
            <Icon name="apply" /> Aplicar texto
          </button>
        </div>
        <div className={styles.furnitureActions}>
          <button
            className={styles.iconButton}
            aria-label="Cancelar"
            title="Cancelar alterações não aplicadas"
            data-tooltip="Cancelar alterações não aplicadas"
            data-text-explicit
            onMouseDown={(e) => e.preventDefault()}
            disabled={disabled || !pending}
            onClick={() => {
              s.inspect({ textDraft: null });
              setError("");
            }}
          >
            <Icon name="close" />
          </button>
          <button
            className={styles.iconButton}
            disabled={disabled}
            aria-label={`Girar texto 90° (${d.annotation.rotation}°)`}
            title={`Girar texto 90° (${d.annotation.rotation}°)`}
            data-tooltip={`Girar texto 90° (${d.annotation.rotation}°)`}
            onClick={() =>
              change({
                rotation: ((d.annotation.rotation + 90) %
                  360) as TextAnnotation["rotation"],
              })
            }
          >
            <Icon name="rotate" />
          </button>
          {original && (
            <>
              <button
                className={styles.iconButton}
                aria-label="Duplicar texto"
                title="Duplicar texto"
                data-tooltip="Duplicar texto"
                disabled={disabled || pending}
                onClick={() => {
                  const copy = { ...original, id: crypto.randomUUID() };
                  setTool("text");
                  s.choose(copy.id);
                  s.inspect({
                    textDraft: {
                      ...draftOf(copy, true),
                      placing: true,
                      focus: false,
                    },
                  });
                }}
              >
                <Icon name="copy" />
              </button>
              <button
                className={`${styles.iconButton} ${styles.danger}`}
                aria-label="Excluir texto"
                title="Excluir texto"
                data-tooltip="Excluir texto"
                disabled={disabled || pending}
                onClick={deleteTextSelection}
              >
                <Icon name="delete" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

let context: CanvasRenderingContext2D | null = null;
let layouts = new WeakMap<
  TextAnnotation,
  { lines: string[]; height: number }
>();
export function annotationLayout(t: TextAnnotation) {
  const known = layouts.get(t);
  if (known) return known;
  context ??= document.createElement("canvas").getContext("2d");
  if (!context) throw new Error("Não foi possível medir o texto.");
  context.font = `${t.bold ? 600 : 400} 100px "IBM Plex Sans"`;
  const ctx = context;
  const lines = wrapText(
    t.content,
    Math.max(t.size * 2, t.width),
    (value) => (ctx.measureText(value).width * t.size) / 100,
  );
  const result = { lines, height: lines.length * t.size * 1.25 };
  layouts.set(t, result);
  return result;
}
export function useTextCanvas(
  doc: LocalProject,
  tool: Tool,
  camera: { x: number; y: number; scale: number },
  host: RefObject<HTMLDivElement | null>,
  setTool: (t: Tool) => void,
) {
  const { mode, busy, readonly, select, textDraft, imageDraft } = useStore();
  const [fontReady, setFontReady] = useState(false);
  const [preview, setPreview] = useState<TextAnnotation | null>(null);
  const drag = useRef<{
    original: TextAnnotation;
    start: Point;
    resize: boolean;
    next: TextAnnotation;
  } | null>(null);
  const cancel = useCallback(() => {
    drag.current = null;
    setPreview(null);
  }, []);
  useEffect(() => {
    let live = true;
    void Promise.all([
      document.fonts.load('400 100px "IBM Plex Sans"'),
      document.fonts.load('600 100px "IBM Plex Sans"'),
    ]).then(() => {
      layouts = new WeakMap();
      if (live) setFontReady(true);
    });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    cancel();
  }, [tool, mode, doc.viewFloorId, cancel]);
  useEffect(() => {
    if (busy || readonly || imageDraft) cancel();
  }, [busy, readonly, imageDraft, cancel]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) {
        cancel();
        useStore.getState().inspect({ textDraft: null });
      }
    };
    const blur = () => cancel();
    const outside = (e: MouseEvent) => {
      if (!host.current?.contains(e.target as Node)) cancel();
    };
    window.addEventListener("keydown", key);
    window.addEventListener("blur", blur);
    window.addEventListener("mouseup", outside);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", blur);
      window.removeEventListener("mouseup", outside);
    };
  }, [host, cancel]);
  const hit = (p: Point) =>
    [...doc.model.texts].reverse().find((t) => {
      const q = textLocal(t, p);
      return (
        q.x >= 0 &&
        q.x <= t.width &&
        q.y >= 0 &&
        q.y <= annotationLayout(t).height
      );
    });
  const enabled = mode === "plan" && !busy && !imageDraft;
  const down = (p: Point) => {
    if (!enabled || !["select", "text"].includes(tool)) return false;
    if (textDraft?.placing && !readonly) {
      const d = {
        ...textDraft,
        annotation: {
          ...textDraft.annotation,
          x: Math.round(p.x),
          y: Math.round(p.y),
        },
        placing: false,
      };
      void apply(d, setTool).catch((e) =>
        useStore.getState().notify(e.message),
      );
      return true;
    }
    const active = doc.model.texts.find((t) => t.id === select);
    const handle =
      active &&
      textWorld(active, {
        x: active.width,
        y: annotationLayout(active).height / 2,
      });
    const resizing =
      tool === "select" &&
      handle &&
      Math.hypot(handle.x - p.x, handle.y - p.y) * camera.scale <= 9;
    const target = resizing ? active : hit(p);
    if (target) {
      if (target.id === select && textPending(textDraft, doc)) return true;
      useStore.getState().choose(target.id);
      if (textDraft && !textDraft.fresh)
        useStore.getState().inspect({ textDraft: null });
      if (!readonly && tool === "select") {
        drag.current = {
          original: target,
          start: p,
          resize: !!resizing,
          next: target,
        };
        setPreview(target);
      }
      return true;
    }
    if (tool === "text" && !readonly) {
      edit(newText(doc.viewFloorId, p), true);
      return true;
    }
    return false;
  };
  const move = (p: Point) => {
    if (textDraft?.placing && enabled && !readonly) {
      useStore.getState().inspect({
        textDraft: {
          ...textDraft,
          annotation: {
            ...textDraft.annotation,
            x: Math.round(p.x),
            y: Math.round(p.y),
          },
        },
      });
      return true;
    }
    const g = drag.current;
    if (!g) return false;
    const t = g.original;
    const next = g.resize
      ? {
          ...t,
          width: Math.min(
            1000000,
            Math.max(2 * t.size, Math.round(textLocal(t, p).x)),
          ),
        }
      : {
          ...t,
          x: Math.round(t.x + p.x - g.start.x),
          y: Math.round(t.y + p.y - g.start.y),
        };
    const valid = textSchema.safeParse(next);
    if (valid.success) {
      g.next = valid.data;
      setPreview(valid.data);
    }
    return true;
  };
  const up = (p: Point) => {
    const g = drag.current;
    if (!g) return false;
    move(p);
    const next = g.next;
    cancel();
    if (
      !busy &&
      !readonly &&
      Math.hypot(p.x - g.start.x, p.y - g.start.y) * camera.scale >= 3 &&
      JSON.stringify(next) !== JSON.stringify(g.original)
    ) {
      const s = useStore.getState();
      if (s.doc) void s.commit(putText(s.doc, next), "text");
    }
    return true;
  };
  let shown = textDraft?.annotation;
  if (textDraft) {
    try {
      shown = {
        ...shown!,
        size: cm(textDraft.size),
        width: cm(textDraft.width),
      };
      if (
        shown.size < 100 ||
        shown.size > 10000 ||
        shown.width < 2 * shown.size ||
        shown.width > 1000000
      )
        shown = textDraft.annotation;
    } catch {
      shown = textDraft.annotation;
    }
  }
  const texts = doc.model.texts.filter(
    (t) => t.id !== preview?.id && t.id !== shown?.id,
  );
  if (preview) texts.push(preview);
  if (shown) texts.push(shown);
  const layer =
    mode === "plan" && fontReady ? (
      <Layer listening={false}>
        {texts.map((t) => {
          const layout = annotationLayout(t),
            selected = t.id === select;
          return (
            <Group
              key={t.id}
              x={camera.x + t.x * camera.scale}
              y={camera.y + t.y * camera.scale}
              rotation={t.rotation}
            >
              <Rect
                width={t.width * camera.scale}
                height={layout.height * camera.scale}
                fill={t.background ? "#f5f4ee" : undefined}
                stroke={t.border ? "#64794f" : undefined}
                strokeWidth={1}
              />
              <Text
                text={layout.lines.join("\n")}
                width={t.width * camera.scale}
                fontFamily="IBM Plex Sans"
                fontStyle={t.bold ? "600" : "400"}
                fontSize={t.size * camera.scale}
                lineHeight={1.25}
                wrap="none"
                align={t.align}
                fill={t.color}
              />
              {selected && (
                <Rect
                  width={t.width * camera.scale}
                  height={layout.height * camera.scale}
                  stroke="#34795d"
                  strokeWidth={1}
                  dash={[4, 3]}
                />
              )}
            </Group>
          );
        })}
      </Layer>
    ) : null;
  const active = texts.find((t) => t.id === select),
    h =
      active &&
      textWorld(active, {
        x: active.width,
        y: annotationLayout(active).height / 2,
      });
  return {
    down,
    move,
    up,
    cancel,
    hit,
    isDragging: () => !!drag.current,
    ready: fontReady,
    doubleClick: (p: Point) => {
      const t =
        enabled && !readonly && ["select", "text"].includes(tool) && hit(p);
      if (!t) return false;
      cancel();
      edit(t);
      return true;
    },
    bounds: doc.model.texts.flatMap((t) => {
      const b = textBox(t, annotationLayout(t).height);
      return [
        { x: b.x, y: b.y },
        { x: b.x + b.width, y: b.y + b.height },
      ];
    }),
    layer,
    controls:
      mode === "plan" &&
      tool === "select" &&
      h &&
      !readonly &&
      !textPending(textDraft, doc) ? (
        <Layer listening={false}>
          <Circle
            x={camera.x + h.x * camera.scale}
            y={camera.y + h.y * camera.scale}
            radius={5}
            fill="white"
            stroke="#34795d"
            strokeWidth={2}
          />
        </Layer>
      ) : null,
  };
}
