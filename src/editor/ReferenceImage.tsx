import { useEffect, useRef, useState } from "react";
import { Circle, Image as KonvaImage, Layer, Line } from "react-konva";
import { cm, type Point, type ReferenceImage } from "../domain/project";
import {
  calibrateImage,
  decodeReference,
  imageCorners,
  imagePoint,
  loadReference,
  pixelPoint,
  validImageTransform,
} from "../domain/reference-image";
import { useStore } from "../state/store";
import { Icon } from "../ui/Icon";
import styles from "../ui/App.module.css";

const cancelImage = () =>
  useStore.getState().inspect({ imageDraft: null, imageRequest: null });
async function saveImage(image: ReferenceImage | null) {
  const s = useStore.getState();
  if (!s.doc || !s.activeFloorId || s.busy || s.readonly) return;
  const previous =
    s.doc.model.referenceImages.find((i) => i.floorId === s.activeFloorId) ??
    null;
  if (JSON.stringify(previous) === JSON.stringify(image)) {
    s.inspect({ imageDraft: null, imageOpacity: null });
    return;
  }
  await s.commit(
    {
      ...s.doc,
      model: {
        ...s.doc.model,
        referenceImages: [
          ...s.doc.model.referenceImages.filter(
            (i) => i.floorId !== s.activeFloorId,
          ),
          ...(image ? [image] : []),
        ],
      },
    },
    "image",
  );
}

export function ReferenceImageProperties() {
  const {
    doc,
    activeFloorId,
    imageDraft: draft,
    busy,
    readonly,
    mode,
  } = useStore();
  const file = useRef<HTMLInputElement>(null),
    operation = useRef(0),
    trigger = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false),
    [distance, setDistance] = useState(""),
    [error, setError] = useState("");
  const opacity = useStore((s) => s.imageOpacity);
  const setOpacity = (imageOpacity: number | null) =>
    useStore.getState().inspect({ imageOpacity });
  const image =
    draft?.image ??
    doc?.model.referenceImages.find((i) => i.floorId === activeFloorId);
  const disabled = busy || readonly || loading;
  useEffect(
    () => () => {
      operation.current++;
    },
    [],
  );
  if (!doc || mode !== "plan") return null;
  function start() {
    if (!image) return;
    useStore.getState().choose(null);
    useStore.getState().inspect({
      imageDraft: {
        image: { ...image },
        phase: "adjust",
        points: [],
        calibrated: true,
        fit: false,
      },
      slabDraft: null,
      slabEditing: false,
      pendingOpening: null,
    });
    setError("");
  }
  async function upload(input?: File) {
    if (!input || !activeFloorId) return;
    const token = ++operation.current,
      projectId = doc!.project.id;
    const request = crypto.randomUUID();
    useStore.getState().inspect({ imageRequest: request });
    setLoading(true);
    setError("");
    try {
      const image = await loadReference(input, activeFloorId);
      const current = useStore.getState();
      if (
        token !== operation.current ||
        current.imageRequest !== request ||
        current.doc?.project.id !== projectId ||
        current.activeFloorId !== activeFloorId ||
        current.mode !== "plan" ||
        current.busy ||
        current.readonly
      )
        return;
      current.choose(null);
      current.inspect({
        imageDraft: {
          image,
          phase: "first",
          points: [],
          calibrated: false,
          fit: true,
        },
        slabDraft: null,
        slabEditing: false,
        pendingOpening: null,
      });
    } catch (e) {
      if (token === operation.current) setError((e as Error).message);
    } finally {
      if (useStore.getState().imageRequest === request)
        useStore.getState().inspect({ imageRequest: null });
      if (token === operation.current) setLoading(false);
      if (file.current) file.current.value = "";
    }
  }
  function calibrate() {
    if (!draft || draft.points.length !== 2) return;
    try {
      const image = calibrateImage(
        draft.image,
        draft.points[0],
        draft.points[1],
        cm(distance),
      );
      useStore.getState().inspect({
        imageDraft: {
          ...draft,
          image,
          phase: "adjust",
          calibrated: true,
          points: [],
        },
      });
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function opacityCommit(value: number) {
    if (!image || draft) return;
    setOpacity(null);
    void saveImage({ ...image, opacity: value / 100 });
  }
  return (
    <section
      className={`${styles.referenceImage} ${styles.propertyGroup}`}
      aria-label="Imagem de referência"
    >
      <h3>Imagem de referência</h3>
      <input
        ref={file}
        hidden
        type="file"
        accept="image/png,image/jpeg,.png,.jpg,.jpeg"
        data-testid="reference-image-file"
        onChange={(e) => void upload(e.target.files?.[0])}
      />
      {!image ? (
        <button
          ref={trigger}
          disabled={disabled}
          className={styles.iconText}
          onClick={() => file.current?.click()}
        >
          <Icon name="image" /> {loading ? "Abrindo…" : "Adicionar imagem"}
        </button>
      ) : (
        <>
          <div className={styles.imageName} title={image.name}>
            {image.name}
          </div>
          {!draft && (
            <div className={styles.imageActions}>
              <label>
                <input
                  type="checkbox"
                  aria-label="Mostrar imagem"
                  disabled={disabled}
                  checked={image.visible}
                  onChange={(e) =>
                    void saveImage({ ...image, visible: e.target.checked })
                  }
                />{" "}
                Mostrar
              </label>
              <button
                ref={trigger}
                className={styles.iconText}
                disabled={disabled}
                onClick={start}
              >
                <Icon name="redraw" size="compact" /> Ajustar
              </button>
              <details>
                <summary
                  aria-label="Mais ações da imagem"
                  title="Mais ações da imagem"
                >
                  <Icon name="more" size="compact" />
                </summary>
                <div>
                  <button
                    disabled={disabled}
                    onClick={() => file.current?.click()}
                  >
                    Substituir
                  </button>
                  <button
                    disabled={disabled}
                    onClick={() => void saveImage(null)}
                  >
                    Remover
                  </button>
                </div>
              </details>
            </div>
          )}
          <label className={styles.imageOpacity}>
            Opacidade <span>{opacity ?? Math.round(image.opacity * 100)}%</span>
            <input
              aria-label="Opacidade da imagem"
              type="range"
              min="0"
              max="100"
              disabled={disabled}
              value={opacity ?? Math.round(image.opacity * 100)}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (draft)
                  useStore.getState().inspect({
                    imageDraft: {
                      ...draft,
                      image: { ...image, opacity: n / 100 },
                    },
                  });
                else setOpacity(n);
              }}
              onPointerUp={(e) => opacityCommit(Number(e.currentTarget.value))}
              onKeyUp={(e) => opacityCommit(Number(e.currentTarget.value))}
              onBlur={(e) => opacityCommit(Number(e.currentTarget.value))}
            />
          </label>
          {draft && (
            <>
              {draft.phase === "distance" ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    calibrate();
                  }}
                  className={styles.imageDistance}
                >
                  <label>
                    Distância (cm)
                    <input
                      autoFocus
                      aria-label="Distância real em cm"
                      inputMode="decimal"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                    />
                  </label>
                  <button type="submit" disabled={disabled}>
                    Calibrar
                  </button>
                </form>
              ) : draft.phase === "adjust" ? (
                <>
                  <label className={styles.imageAngle}>
                    Ângulo (°)
                    <input
                      aria-label="Ângulo da imagem"
                      type="number"
                      min="-360"
                      max="360"
                      step="0.1"
                      defaultValue={image.angle}
                      disabled={disabled}
                      onChange={(e) => {
                        const angle = e.target.valueAsNumber;
                        if (Number.isFinite(angle) && Math.abs(angle) <= 360) {
                          setError(
                            validImageTransform({ ...image, angle })
                              ? ""
                              : "Imagem fora dos limites do editor.",
                          );
                          useStore.getState().inspect({
                            imageDraft: {
                              ...draft,
                              image: { ...image, angle },
                            },
                          });
                        } else setError("Use um ângulo entre −360° e 360°.");
                      }}
                    />
                  </label>
                  <button
                    disabled={disabled}
                    onClick={() => {
                      setDistance("");
                      setError("");
                      useStore.getState().inspect({
                        imageDraft: { ...draft, phase: "first", points: [] },
                      });
                    }}
                  >
                    Definir escala novamente
                  </button>
                </>
              ) : (
                <p className={styles.note}>
                  {draft.phase === "first"
                    ? "Marque dois pontos na imagem."
                    : "Marque o segundo ponto."}
                </p>
              )}
              <div className={styles.imageActions}>
                <button
                  className={styles.iconText}
                  disabled={
                    disabled ||
                    !draft.calibrated ||
                    draft.phase !== "adjust" ||
                    !validImageTransform(image) ||
                    !!error
                  }
                  onClick={() => {
                    void saveImage(image).then(() => {
                      if (!useStore.getState().imageDraft)
                        trigger.current?.focus();
                    });
                  }}
                >
                  <Icon name="apply" size="compact" /> Concluir
                </button>
                <button
                  disabled={busy}
                  onClick={() => {
                    cancelImage();
                    setError("");
                    trigger.current?.focus();
                  }}
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </>
      )}
      {error && (
        <p role="alert" className={styles.note}>
          {error}
        </p>
      )}
    </section>
  );
}

export function useReferenceImageCanvas(
  camera: { x: number; y: number; scale: number },
  size: { width: number; height: number },
) {
  const {
    doc,
    activeFloorId,
    imageDraft: draft,
    mode,
    readonly,
    busy,
  } = useStore();
  const confirmed = doc?.model.referenceImages.find(
      (i) => i.floorId === activeFloorId,
    ),
    image = draft?.image ?? confirmed;
  const opacityPreview = useStore((s) => s.imageOpacity);
  const data = image?.data,
    mime = image?.mime;
  const [bitmap, setBitmap] = useState<{
    data: string;
    image: HTMLImageElement;
  } | null>(null);
  const move = useRef<{ start: Point; image: ReferenceImage } | null>(null);
  useEffect(() => {
    let alive = true;
    if (data && mime)
      void decodeReference({ data, mime })
        .then((bitmap) => {
          if (alive) setBitmap({ data, image: bitmap });
        })
        .catch((e) => {
          if (alive) {
            cancelImage();
            useStore.getState().notify((e as Error).message);
          }
        });
    return () => {
      alive = false;
    };
  }, [data, mime]);
  useEffect(() => {
    if (!draft?.fit) return;
    const i = draft.image,
      scale =
        Math.min((size.width - 80) / i.width, (size.height - 100) / i.height) /
        camera.scale;
    useStore.getState().inspect({
      imageDraft: {
        ...draft,
        fit: false,
        image: {
          ...i,
          scale,
          x: (size.width / 2 - camera.x) / camera.scale - (i.width * scale) / 2,
          y:
            (size.height / 2 - camera.y) / camera.scale -
            (i.height * scale) / 2,
        },
      },
    });
  }, [draft, camera, size]);
  useEffect(() => {
    move.current = null;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && useStore.getState().imageDraft) {
        cancelImage();
      }
    };
    const outside = (e: MouseEvent) => {
      if (e.button === 0) move.current = null;
    };
    const blur = () => {
      move.current = null;
    };
    window.addEventListener("keydown", key);
    window.addEventListener("mouseup", outside);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("mouseup", outside);
      window.removeEventListener("blur", blur);
    };
  }, [activeFloorId, mode]);
  const corners = image ? imageCorners(image) : [];
  const screen = (p: Point) => ({
    x: p.x * camera.scale + camera.x,
    y: p.y * camera.scale + camera.y,
  });
  const pointClick = (p: Point) => {
    if (!draft || busy || readonly) return false;
    const pixel = pixelPoint(draft.image, p);
    if (
      pixel.x < 0 ||
      pixel.y < 0 ||
      pixel.x > draft.image.width ||
      pixel.y > draft.image.height
    )
      return true;
    if (draft.phase === "first")
      useStore.getState().inspect({
        imageDraft: { ...draft, phase: "second", points: [pixel] },
      });
    else if (draft.phase === "second") {
      if (
        Math.hypot(pixel.x - draft.points[0].x, pixel.y - draft.points[0].y) <
        1e-8
      )
        useStore.getState().notify("Marque dois pontos distintos.");
      else
        useStore.getState().inspect({
          imageDraft: {
            ...draft,
            phase: "distance",
            points: [draft.points[0], pixel],
            cursor: undefined,
          },
        });
    } else if (draft.phase === "adjust")
      move.current = { start: p, image: draft.image };
    return true;
  };
  return {
    down: pointClick,
    move: (p: Point) => {
      if (!draft || busy || readonly) return false;
      if (draft.phase === "second")
        useStore.getState().inspect({
          imageDraft: { ...draft, cursor: pixelPoint(draft.image, p) },
        });
      const g = move.current;
      if (g && draft.phase === "adjust") {
        const image = {
          ...g.image,
          x: g.image.x + p.x - g.start.x,
          y: g.image.y + p.y - g.start.y,
        };
        if (validImageTransform(image))
          useStore.getState().inspect({ imageDraft: { ...draft, image } });
      }
      return true;
    },
    up: () => {
      const active = !!draft;
      move.current = null;
      return active;
    },
    hint: draft
      ? draft.phase === "first"
        ? "Marque dois pontos · Esc cancela"
        : draft.phase === "second"
          ? "Clique no segundo ponto · Esc cancela"
          : draft.phase === "distance"
            ? "Informe a distância em cm na lateral"
            : "Arraste a imagem · Concluir na lateral"
      : "",
    bounds: image && (image.visible || draft) ? corners : [],
    layer: mode === "plan" && image && (image.visible || draft) && (
      <Layer listening={false}>
        {bitmap?.data === image.data && (
          <KonvaImage
            image={bitmap.image}
            x={image.x * camera.scale + camera.x}
            y={image.y * camera.scale + camera.y}
            width={image.width * image.scale * camera.scale}
            height={image.height * image.scale * camera.scale}
            rotation={image.angle}
            opacity={
              draft
                ? image.opacity
                : (opacityPreview ?? image.opacity * 100) / 100
            }
          />
        )}
        {draft && (
          <Line
            points={corners.concat(corners[0]).flatMap((p) => {
              const s = screen(p);
              return [s.x, s.y];
            })}
            stroke="#205d48"
            strokeWidth={1}
            dash={[5, 4]}
          />
        )}
      </Layer>
    ),
    markers: mode === "plan" && draft && (
      <Layer listening={false}>
        {draft.points.length > 0 && (
          <Line
            points={[
              draft.points[0],
              draft.points[1] ?? draft.cursor ?? draft.points[0],
            ].flatMap((p) => {
              const s = screen(imagePoint(draft.image, p));
              return [s.x, s.y];
            })}
            stroke="#bd792c"
            strokeWidth={2}
            dash={[5, 3]}
          />
        )}
        {draft.points.map((p, n) => {
          const s = screen(imagePoint(draft.image, p));
          return (
            <Circle
              key={n}
              x={s.x}
              y={s.y}
              radius={5}
              stroke="#205d48"
              strokeWidth={2}
              fill="white"
            />
          );
        })}
      </Layer>
    ),
  };
}
