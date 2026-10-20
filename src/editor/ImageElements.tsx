import Konva from "konva";
import { usePreferences } from "../state/preferences";
import {
  acquireFurnitureBitmap,
  furnitureBitmapLevel,
  setFurnitureSmoothing,
  type FurnitureBitmap,
} from "./furniture-bitmaps";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  Circle,
  Rect,
  Group,
  Image as KonvaImage,
  Layer,
  Line,
} from "react-konva";
import {
  cm,
  display,
  hitWalls,
  type CustomImageAsset,
  type ImageElement,
  type LocalProject,
  type Point,
  type Tool,
} from "../domain/project";
import {
  catalogUrl,
  imageCatalog,
  imageCategories,
} from "../domain/image-catalog";
import {
  elementCorners,
  elementSideHandle,
  resizeElementSide,
  elementRatio,
  elementUrl,
  hitImageElement,
  setImageElement,
  snapFurnitureAngle,
  standardElement,
  validateElement,
} from "../domain/image-elements";
import { loadReference } from "../domain/reference-image";
import { useStore } from "../state/store";
import { Icon } from "../ui/Icon";
import styles from "../ui/App.module.css";

type Camera = { x: number; y: number; scale: number };
function ObjectBitmap({
  element,
  assets,
  camera,
  ghost = false,
}: {
  element: ImageElement;
  assets: CustomImageAsset[];
  camera: Camera;
  ghost?: boolean;
}) {
  const url = elementUrl(element, assets),
    [bitmap, setBitmap] = useState<FurnitureBitmap | null>(null);
  useEffect(() => {
    let live = true;
    setBitmap(null);
    const resource = acquireFurnitureBitmap(url);
    void resource.promise
      .then((i) => {
        if (live) setBitmap(i);
      })
      .catch(() => {
        if (live)
          useStore
            .getState()
            .notify(
              "Não foi possível carregar a imagem do mobiliário. Reabra o projeto para tentar novamente.",
            );
      });
    return () => {
      live = false;
      resource.release();
    };
  }, [url]);
  if (!bitmap) return null;
  const sourceRatio = elementRatio(element, assets);
  const fit = Math.min(sourceRatio / bitmap.crop.width, 1 / bitmap.crop.height);
  const width =
    ((bitmap.crop.width * fit * element.width) / sourceRatio) * camera.scale;
  const height = bitmap.crop.height * fit * element.depth * camera.scale;
  const ratio = Konva.pixelRatio || window.devicePixelRatio || 1;
  const level = furnitureBitmapLevel(bitmap, width * ratio, height * ratio);
  return (
    <KonvaImage
      image={level.image}
      crop={level.crop}
      x={element.x * camera.scale + camera.x}
      y={element.y * camera.scale + camera.y}
      offsetX={width / 2}
      offsetY={height / 2}
      width={width}
      height={height}
      rotation={element.angle}
      scaleX={element.flipX ? -1 : 1}
      scaleY={element.flipY ? -1 : 1}
      opacity={ghost ? 0.65 : 1}
    />
  );
}

export function ImageCatalog({
  close,
  select,
}: {
  close: () => void;
  select: (element: ImageElement, asset?: CustomImageAsset) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    request = useRef({ sequence: 0 });
  const [category, setCategory] = useState(imageCategories[0]),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState<CustomImageAsset | null>(null),
    [width, setWidth] = useState("100");
  const assets = useStore((s) => s.doc?.model.customImageAssets ?? []),
    floorId = useStore((s) => s.activeFloorId)!;
  useEffect(() => {
    const focus = document.activeElement as HTMLElement | null;
    const operation = request.current;
    ref.current?.showModal();
    ref.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => {
      operation.sequence++;
      focus?.focus();
    };
  }, []);
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const source = uploaded;
  async function upload(file: File) {
    const token = ++request.current.sequence;
    setError("");
    setLoading(true);
    try {
      const i = await loadReference(file, floorId);
      if (token !== request.current.sequence) return;
      setUploaded({
        id: crypto.randomUUID(),
        name: i.name,
        mime: i.mime,
        data: i.data,
        width: i.width,
        height: i.height,
      });
    } catch (e) {
      if (token === request.current.sequence)
        setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (token === request.current.sequence) setLoading(false);
    }
  }
  function insertCustom(a: CustomImageAsset) {
    try {
      const w = cm(width);
      if (w <= 0) throw new Error("Informe uma largura positiva em cm.");
      const element: ImageElement = {
        id: crypto.randomUUID(),
        floorId,
        name: a.name,
        source: { kind: "custom", assetId: a.id },
        x: 0,
        y: 0,
        width: w,
        depth: (w * a.height) / a.width,
        angle: 0,
      };
      validateElement(element, [a]);
      select(element, a);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }
  return (
    <dialog
      ref={ref}
      className={styles.furnitureDialog}
      aria-labelledby="furniture-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className={styles.furnitureHeader}>
        <h2 id="furniture-title">Mobiliários</h2>
        <button
          className={styles.iconButton}
          aria-label="Fechar catálogo"
          title="Fechar catálogo"
          data-tooltip="Fechar catálogo"
          onClick={close}
        >
          <Icon name="close" />
        </button>
      </div>
      <label>
        Buscar no acervo
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nome do item"
        />
      </label>
      <div className={styles.furnitureTabs} aria-label="Categorias">
        {imageCategories.map((c) => (
          <button
            key={c}
            aria-pressed={category === c && !query}
            onClick={() => {
              setCategory(c);
              setQuery("");
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div className={styles.furnitureGrid}>
        {imageCatalog
          .filter((i) =>
            query
              ? normalize(i.name + " " + i.category).includes(normalize(query))
              : i.category === category,
          )
          .map((i) => (
            <button
              key={i.id}
              onClick={() => select(standardElement(i, floorId))}
              aria-label={`Inserir ${i.name} · ${i.category}`}
            >
              <img src={catalogUrl(i)} alt="" loading="lazy" decoding="async" />
              <span>{i.name}</span>
              <small>
                {display(i.width)} × {display(i.depth)} cm
              </small>
            </button>
          ))}
      </div>
      {query &&
        !imageCatalog.some((i) =>
          normalize(i.name + " " + i.category).includes(normalize(query)),
        ) && <p>Nenhum item encontrado.</p>}
      <p className={styles.furnitureNote}>
        Dimensões genéricas e editáveis. Escolha um item e clique na Planta para
        posicionar.
      </p>
      <details>
        <summary>Imagem personalizada</summary>
        <label>
          Arquivo PNG ou JPEG
          <input
            type="file"
            accept="image/png,image/jpeg"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
        </label>
        <label>
          Largura (cm)
          <input
            value={width}
            inputMode="decimal"
            onChange={(e) => setWidth(e.target.value)}
          />
        </label>
        {loading && <p role="status">Validando imagem…</p>}
        {source && (
          <div className={styles.furnitureUpload}>
            <img
              src={`data:${source.mime};base64,${source.data}`}
              alt="Prévia da imagem personalizada"
            />
            <button disabled={loading} onClick={() => insertCustom(source)}>
              Usar {source.name}
            </button>
          </div>
        )}
        {!!assets.length && (
          <div className={styles.furnitureCustom}>
            {assets.map((a) => (
              <button key={a.id} onClick={() => insertCustom(a)}>
                <img src={`data:${a.mime};base64,${a.data}`} alt="" />
                {a.name}
              </button>
            ))}
          </div>
        )}
        <p className={styles.furnitureNote}>
          Uploads são incorporados ao projeto e ao arquivo .ecovit. Até 10 MiB e
          16 megapixels por imagem.
        </p>
      </details>
      {error && <p role="alert">{error}</p>}
    </dialog>
  );
}

export function ImageElementProperties({ doc }: { doc: LocalProject }) {
  const { select, busy, readonly } = useStore(),
    e = doc.model.imageElements.find((i) => i.id === select)!;
  const [name, setName] = useState(e.name),
    [width, setWidth] = useState(display(e.width)),
    [depth, setDepth] = useState(display(e.depth)),
    [angle, setAngle] = useState(String(e.angle)),
    [error, setError] = useState("");
  useEffect(() => {
    setName(e.name);
    setWidth(display(e.width));
    setDepth(display(e.depth));
    setAngle(String(e.angle));
  }, [e]);
  const ratio = e.width / e.depth;
  function size(value: string, axis: "width" | "depth") {
    if (axis === "width") setWidth(value);
    else setDepth(value);
    const n = Number(value.replace(",", "."));
    if (Number.isFinite(n) && n > 0) {
      const complementary = axis === "width" ? n / ratio : n * ratio;
      const text = complementary.toLocaleString("pt-BR", {
        maximumFractionDigits: 6,
        useGrouping: false,
      });
      if (axis === "width") setDepth(text);
      else setWidth(text);
    }
  }
  async function apply() {
    try {
      const w = Number(width.replace(",", ".")) * 100;
      const next = {
        ...e,
        name: name.trim(),
        width: w,
        depth: w / ratio,
        angle: Number(angle.replace(",", ".")),
      };
      if (!next.name || next.name.length > 200 || !angle.trim())
        throw new Error("Informe nome e rotação válidos.");
      validateElement(next, doc.model.customImageAssets);
      setError("");
      await useStore.getState().commit(setImageElement(doc, next), "furniture");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  return (
    <aside
      className={`${styles.properties} ${styles.furnitureProperties}`}
      aria-label="Propriedades do mobiliário"
    >
      <div className={styles.panelTitle}>MOBILIÁRIOS</div>
      <h2>{e.name}</h2>
      <fieldset disabled={busy || readonly}>
        <section
          className={styles.propertyGroup}
          aria-label="Identificação do mobiliário"
        >
          <label>
            Nome
            <input
              value={name}
              maxLength={200}
              onChange={(v) => setName(v.target.value)}
            />
          </label>
        </section>
        <section
          className={styles.propertyGroup}
          aria-label="Dimensões e rotação do mobiliário"
        >
          <h3>Dimensões e rotação</h3>
          <label>
            Largura (cm)
            <input
              value={width}
              onChange={(v) => size(v.target.value, "width")}
              inputMode="decimal"
            />
          </label>
          <label>
            Profundidade (cm)
            <input
              value={depth}
              onChange={(v) => size(v.target.value, "depth")}
              inputMode="decimal"
            />
          </label>
          <label>
            Rotação (graus)
            <input
              value={angle}
              onChange={(v) => setAngle(v.target.value)}
              inputMode="decimal"
            />
          </label>
        </section>
        <button
          className={`${styles.iconText} ${styles.propertyApply}`}
          onClick={() => void apply()}
        >
          <Icon name="apply" />
          Aplicar imagem
        </button>
        <div className={styles.furnitureActions}>
          {(["flipX", "flipY"] as const).map((axis) => (
            <button
              key={axis}
              className={styles.iconButton}
              aria-label={
                axis === "flipX"
                  ? "Espelhar horizontalmente"
                  : "Espelhar verticalmente"
              }
              title={
                axis === "flipX"
                  ? "Espelhar horizontalmente"
                  : "Espelhar verticalmente"
              }
              data-tooltip={
                axis === "flipX"
                  ? "Espelhar horizontalmente"
                  : "Espelhar verticalmente"
              }
              aria-pressed={!!e[axis]}
              onClick={(event) => {
                const button = event.currentTarget;
                setError("");
                void useStore
                  .getState()
                  .commit(
                    setImageElement(doc, { ...e, [axis]: !e[axis] }),
                    "furniture",
                  )
                  .then(() =>
                    requestAnimationFrame(() => {
                      if (
                        button.isConnected &&
                        document.activeElement === document.body
                      )
                        button.focus({ preventScroll: true });
                    }),
                  );
              }}
            >
              <Icon
                name={axis === "flipX" ? "flipHorizontal" : "flipVertical"}
              />
            </button>
          ))}
          <button
            className={styles.iconButton}
            aria-label="Duplicar imagem"
            title="Duplicar imagem"
            data-tooltip="Duplicar imagem"
            onClick={() => {
              const next = {
                ...e,
                source: { ...e.source },
                id: crypto.randomUUID(),
                x: e.x + 1000,
                y: e.y + 1000,
              };
              try {
                validateElement(next, doc.model.customImageAssets);
                void useStore
                  .getState()
                  .commit(setImageElement(doc, next), "furniture");
                useStore.getState().choose(next.id);
              } catch (err) {
                setError(String(err));
              }
            }}
          >
            <Icon name="copy" />
          </button>
          <button
            className={styles.iconButton}
            aria-label="Excluir imagem"
            title="Excluir imagem"
            data-tooltip="Excluir imagem"
            onClick={() => {
              void useStore
                .getState()
                .commit(setImageElement(doc, null, e.id), "furniture");
              useStore.getState().choose(null);
            }}
          >
            <Icon name="delete" />
          </button>
        </div>
      </fieldset>
      <p className={`${styles.furnitureNote} ${styles.propertyInfo}`}>
        Cantos mantêm a proporção atual. Alças quadradas ajustam só largura ou
        profundidade e podem deformar a imagem. Arraste o corpo para mover.
        Dimensões genéricas, sem validação física.
      </p>
      {error && <p role="alert">{error}</p>}
    </aside>
  );
}

export function useImageElements(
  doc: LocalProject,
  tool: Tool,
  camera: Camera,
  host: RefObject<HTMLDivElement | null>,
  setTool: (tool: Tool) => void,
) {
  const { select, mode, busy, readonly, furnitureDraft, imageDraft } =
    useStore();
  const bitmapLayer = useRef<Konva.Layer>(null);
  const highQuality = usePreferences((s) => s.highQualityImages);
  useLayoutEffect(() => {
    const layer = bitmapLayer.current;
    if (!layer) return;
    const apply = () => setFurnitureSmoothing(layer, highQuality);
    layer.on("beforeDraw.furnitureQuality", apply);
    apply();
    layer.batchDraw();
    return () => {
      layer.off("beforeDraw.furnitureQuality", apply);
    };
  }, [highQuality, mode]);
  const [preview, setPreviewState] = useState<ImageElement | null>(null),
    [position, setPosition] = useState<Point | null>(null);
  const previewRef = useRef<ImageElement | null>(null);
  const setPreview = (e: ImageElement | null) => {
    previewRef.current = e;
    setPreviewState(e);
  };
  const drag = useRef<{
    original: ImageElement;
    start: Point;
    kind: "move" | "resize" | "rotate" | "width" | "depth";
    corner?: number;
  } | null>(null);
  const draft =
    furnitureDraft?.element.floorId === doc.viewFloorId && tool === "furniture"
      ? furnitureDraft
      : null;
  const active = doc.model.imageElements.find((e) => e.id === select),
    shown = preview ?? active;
  const cancel = () => {
    drag.current = null;
    setPreview(null);
  };
  useEffect(() => {
    drag.current = null;
    setPreview(null);
    setPosition(null);
  }, [tool, mode, doc.viewFloorId]);
  useEffect(() => {
    if (busy || readonly || imageDraft) {
      drag.current = null;
      previewRef.current = null;
      setPreviewState(null);
    }
  }, [busy, readonly, imageDraft]);
  useEffect(() => {
    const blur = () => {
      cancel();
      useStore.getState().inspect({ furnitureDraft: null });
    };
    const key = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        !document.querySelector("dialog[open]") &&
        (drag.current ||
          !(e.target as HTMLElement).closest("input,textarea,select"))
      )
        blur();
    };
    const outside = (e: MouseEvent) => {
      if (!host.current?.contains(e.target as Node)) cancel();
    };
    window.addEventListener("blur", blur);
    // Cancel before canvas shortcuts can change store state and replace listeners.
    window.addEventListener("keydown", key, true);
    window.addEventListener("mouseup", outside);
    return () => {
      window.removeEventListener("blur", blur);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("mouseup", outside);
    };
  });
  const control = (e: ImageElement) => {
    const a = (e.angle * Math.PI) / 180;
    return {
      x: e.x + Math.sin(a) * (e.depth / 2 + 24 / camera.scale),
      y: e.y - Math.cos(a) * (e.depth / 2 + 24 / camera.scale),
    };
  };
  function move(p: Point) {
    if (mode !== "plan" || busy || readonly || imageDraft) return false;
    if (draft) {
      setPosition(p);
      return true;
    }
    const g = drag.current;
    if (!g) return false;
    const e = g.original;
    if (g.kind === "move")
      setPreview({ ...e, x: e.x + p.x - g.start.x, y: e.y + p.y - g.start.y });
    else if (g.kind === "rotate")
      setPreview({
        ...e,
        angle: snapFurnitureAngle(
          (Math.atan2(p.y - e.y, p.x - e.x) * 180) / Math.PI + 90,
        ),
      });
    else if (g.kind === "width" || g.kind === "depth") {
      try {
        setPreview(resizeElementSide(e, g.kind, p));
      } catch {
        setPreview(null);
      }
    } else {
      const corners = elementCorners(e),
        anchor = corners[(g.corner! + 2) % 4],
        end = corners[g.corner!];
      const vx = end.x - anchor.x,
        vy = end.y - anchor.y,
        scale =
          ((p.x - anchor.x) * vx + (p.y - anchor.y) * vy) / (vx * vx + vy * vy);
      if (scale > 0.001)
        setPreview({
          ...e,
          width: e.width * scale,
          depth: e.depth * scale,
          x: anchor.x + (vx * scale) / 2,
          y: anchor.y + (vy * scale) / 2,
        });
    }
    return true;
  }
  function down(p: Point) {
    if (mode !== "plan" || busy || readonly || imageDraft) return false;
    if (draft) {
      const next = { ...draft.element, ...p };
      try {
        const assets =
          draft.asset &&
          !doc.model.customImageAssets.some((a) => a.id === draft.asset!.id)
            ? [...doc.model.customImageAssets, draft.asset]
            : doc.model.customImageAssets;
        const candidate = {
          ...doc,
          model: { ...doc.model, customImageAssets: assets },
        };
        validateElement(next, assets);
        void useStore
          .getState()
          .commit(setImageElement(candidate, next), "furniture")
          .then(() => {
            const s = useStore.getState();
            if (s.doc?.model.imageElements.some((e) => e.id === next.id)) {
              setTool("select");
              s.choose(next.id);
            }
          });
      } catch (e) {
        useStore.getState().notify(e instanceof Error ? e.message : String(e));
      }
      return true;
    }
    if (tool !== "select") return false;
    if (active) {
      const near = (q: Point) =>
        Math.hypot(q.x - p.x, q.y - p.y) * camera.scale <= 9;
      if (near(control(active))) {
        drag.current = { original: active, start: p, kind: "rotate" };
        setPreview(active);
        return true;
      }
      const corner = elementCorners(active).findIndex(near);
      if (corner >= 0) {
        drag.current = { original: active, start: p, kind: "resize", corner };
        setPreview(active);
        return true;
      }
      for (const axis of ["width", "depth"] as const) {
        if (near(elementSideHandle(active, axis))) {
          drag.current = { original: active, start: p, kind: axis };
          setPreview(active);
          return true;
        }
      }
    }
    if (
      hitWalls(doc.model.walls, p, doc.project.base.width, 4 / camera.scale)
        .length
    )
      return false;
    // Give technical measurement lines their existing selection priority.
    if (
      doc.model.measurements.some((m) => {
        const vx = m.b.x - m.a.x,
          vy = m.b.y - m.a.y,
          t = Math.max(
            0,
            Math.min(
              1,
              ((p.x - m.a.x) * vx + (p.y - m.a.y) * vy) / (vx * vx + vy * vy),
            ),
          );
        return (
          Math.hypot(p.x - m.a.x - t * vx, p.y - m.a.y - t * vy) *
            camera.scale <
          6
        );
      })
    )
      return false;
    const hits = doc.model.imageElements
      .filter((e) => hitImageElement(e, p))
      .reverse();
    const hit = hits.find((e) => e.id === select) ?? hits[0];
    if (!hit) return false;
    useStore.getState().choose(hit.id);
    drag.current = { original: hit, start: p, kind: "move" };
    setPreview(hit);
    return true;
  }
  function up(p: Point) {
    if (!drag.current) return false;
    if (
      Math.hypot(p.x - drag.current.start.x, p.y - drag.current.start.y) *
        camera.scale >
      0.5
    ) {
      move(p);
      const e = previewRef.current;
      if (e)
        try {
          validateElement(e, doc.model.customImageAssets);
          void useStore.getState().commit(setImageElement(doc, e), "furniture");
        } catch (err) {
          useStore
            .getState()
            .notify(err instanceof Error ? err.message : String(err));
        }
    }
    cancel();
    return true;
  }
  const assets = draft?.asset
    ? [...doc.model.customImageAssets, draft.asset]
    : doc.model.customImageAssets;
  return {
    down,
    move,
    up,
    cancel,
    hint:
      drag.current?.kind === "rotate" && preview
        ? `Rotação: ${preview.angle.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}° · atração a cada 45°`
        : "",
    isDragging: () => !!drag.current,
    bounds: doc.model.imageElements.flatMap(elementCorners),
    layer:
      mode === "plan" ? (
        <Layer ref={bitmapLayer} listening={false}>
          {doc.model.imageElements.map((e) => (
            <ObjectBitmap
              key={e.id}
              element={preview?.id === e.id ? preview : e}
              assets={doc.model.customImageAssets}
              camera={camera}
            />
          ))}
          {draft && position && (
            <ObjectBitmap
              element={{ ...draft.element, ...position }}
              assets={assets}
              camera={camera}
              ghost
            />
          )}
        </Layer>
      ) : null,
    controls:
      mode === "plan" && shown && !readonly ? (
        <Layer listening={false}>
          <Group>
            <Line
              points={[
                ...elementCorners(shown),
                elementCorners(shown)[0],
              ].flatMap((p) => [
                p.x * camera.scale + camera.x,
                p.y * camera.scale + camera.y,
              ])}
              stroke="#245d49"
              strokeWidth={1}
              dash={[5, 3]}
            />
            {elementCorners(shown).map((p, i) => (
              <Circle
                key={i}
                x={p.x * camera.scale + camera.x}
                y={p.y * camera.scale + camera.y}
                radius={5}
                fill="white"
                stroke="#245d49"
                strokeWidth={2}
              />
            ))}
            {(["width", "depth"] as const).map((axis) => {
              const p = elementSideHandle(shown, axis);
              return (
                <Rect
                  key={axis}
                  x={p.x * camera.scale + camera.x}
                  y={p.y * camera.scale + camera.y}
                  width={10}
                  height={10}
                  offsetX={5}
                  offsetY={5}
                  rotation={shown.angle}
                  fill="white"
                  stroke="#245d49"
                  strokeWidth={2}
                />
              );
            })}
            <Line
              points={[
                shown.x * camera.scale + camera.x,
                shown.y * camera.scale + camera.y,
                control(shown).x * camera.scale + camera.x,
                control(shown).y * camera.scale + camera.y,
              ]}
              stroke="#245d49"
              dash={[3, 3]}
            />
            <Circle
              x={control(shown).x * camera.scale + camera.x}
              y={control(shown).y * camera.scale + camera.y}
              radius={6}
              fill="white"
              stroke="#245d49"
              strokeWidth={2}
            />
          </Group>
        </Layer>
      ) : null,
  };
}
