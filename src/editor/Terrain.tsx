import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Layer, Shape } from "react-konva";
import {
  display,
  type LocalProject,
  type Point,
  type Terrain,
  type Tool,
} from "../domain/project";
import {
  terrainAreaText,
  terrainContains,
  terrainLabelPoint,
  translateTerrain,
  validateTerrain,
  validateTerrainContour,
  TERRAIN_MATERIALS,
} from "../domain/terrain";
import { useStore } from "../state/store";
import { usePreferences } from "../state/preferences";
import { Icon } from "../ui/Icon";
import { terrainTexture, TERRAIN_TILE_WORLD } from "./terrain-textures";
import styles from "../ui/App.module.css";

type Camera = { x: number; y: number; scale: number };
const rounded = (p: Point) => ({ x: Math.round(p.x), y: Math.round(p.y) });
function MaterialPreview({ material }: { material: Terrain["material"] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    const texture = terrainTexture(material);
    ctx.drawImage(texture, 0, 0, 400, 250, 0, 0, 64, 40);
  }, [material]);
  return <canvas ref={ref} width={64} height={40} aria-hidden="true" />;
}
export function TerrainProperties({ doc }: { doc: LocalProject }) {
  const { busy, readonly, terrainEditing } = useStore();
  const terrain = doc.model.terrain;
  if (!terrain) return null;
  return (
    <aside
      className={`${styles.properties} ${styles.terrainProperties}`}
      aria-label="Propriedades do terreno"
    >
      <div className={styles.panelTitle}>TERRENO DO PROJETO</div>
      <h2>Terreno</h2>
      <p className={styles.propertyInfo}>
        Área: <strong>{terrainAreaText(terrain.contour)}</strong>
        <br />
        Mesmo terreno em todos os pavimentos.
      </p>
      <fieldset disabled={busy || readonly}>
        <legend>Aparência</legend>
        <div className={styles.terrainMaterials}>
          {Object.entries(TERRAIN_MATERIALS).map(([key, name]) => (
            <button
              key={key}
              type="button"
              aria-pressed={terrain.material === key}
              className={terrain.material === key ? styles.active : ""}
              onClick={() => {
                useStore
                  .getState()
                  .inspect({ terrainEditing: false, terrainDraft: null });
                void useStore.getState().commit(
                  {
                    ...doc,
                    model: {
                      ...doc.model,
                      terrain: {
                        ...terrain,
                        material: key as Terrain["material"],
                      },
                    },
                  },
                  "terrain",
                );
              }}
            >
              <MaterialPreview material={key as Terrain["material"]} />
              <span>{name}</span>
            </button>
          ))}
        </div>
        <div className={styles.propertyGroup}>
          <button
            className={styles.iconText}
            aria-pressed={terrainEditing}
            onClick={() =>
              useStore.getState().inspect({ terrainEditing: !terrainEditing })
            }
          >
            <Icon name={terrainEditing ? "apply" : "redraw"} />
            {terrainEditing ? "Concluir ajuste" : "Ajustar"}
          </button>
          <p className={styles.note}>
            Em Ajustar, arraste o interior para mover o terreno ou um ponto para
            alterar o perímetro. Esc encerra o ajuste.
          </p>
        </div>
        <button
          className={`${styles.iconText} ${styles.danger}`}
          onClick={() => {
            useStore
              .getState()
              .inspect({ terrainEditing: false, terrainDraft: null });
            void useStore
              .getState()
              .commit(
                { ...doc, model: { ...doc.model, terrain: null } },
                "terrain",
              );
            useStore.getState().choose(null);
          }}
        >
          <Icon name="delete" />
          Excluir terreno
        </button>
      </fieldset>
    </aside>
  );
}

export function useTerrainCanvas(
  doc: LocalProject,
  tool: Tool,
  setTool: (tool: Tool) => void,
  camera: Camera,
  host: RefObject<HTMLDivElement | null>,
) {
  const showLabel = usePreferences((s) => s.labels.terrain);
  const { mode, readonly, busy, select, terrainDraft, terrainEditing } =
    useStore();
  const drag = useRef<{
    original: Terrain;
    start: Point;
    vertex: number;
  } | null>(null);
  const [preview, setPreview] = useState<Terrain | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);
  const terrain = preview ?? doc.model.terrain;
  const active = mode === "plan" && !readonly && !busy;
  const editing = active && terrainEditing && select === doc.model.terrain?.id;
  const creating = active && tool === "terrain" && !doc.model.terrain;
  const cancel = useCallback(() => {
    drag.current = null;
    setPreview(null);
    setCursor(null);
    useStore.getState().inspect({ terrainDraft: null, terrainEditing: false });
  }, []);
  useEffect(() => {
    cancel();
  }, [doc.viewFloorId, doc.project.id, tool, mode, cancel]);
  useEffect(() => {
    if (!terrainEditing) {
      drag.current = null;
      setPreview(null);
    }
  }, [terrainEditing]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
    };
    const outside = (e: MouseEvent) => {
      if (drag.current && !host.current?.contains(e.target as Node)) cancel();
    };
    const clickOutside = (e: MouseEvent) => {
      if (
        useStore.getState().terrainDraft &&
        !host.current?.contains(e.target as Node)
      )
        cancel();
    };
    window.addEventListener("keydown", key);
    window.addEventListener("blur", cancel);
    window.addEventListener("mouseup", outside);
    window.addEventListener("mousedown", clickOutside);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("mouseup", outside);
      window.removeEventListener("mousedown", clickOutside);
    };
  }, [cancel, host]);
  const points = terrainDraft?.points ?? [];
  const closePoint = (p: Point) =>
    points.length >= 3 &&
    Math.hypot(p.x - points[0].x, p.y - points[0].y) * camera.scale <= 10
      ? points[0]
      : rounded(p);
  const candidate = (p: Point) => {
    const g = drag.current!;
    if (g.vertex < 0)
      return translateTerrain(
        g.original,
        rounded({ x: p.x - g.start.x, y: p.y - g.start.y }),
      );
    const next = {
      ...g.original,
      contour: g.original.contour.map((q, i) =>
        i === g.vertex ? rounded(p) : q,
      ),
    };
    return next;
  };
  const notify = (e: unknown) =>
    useStore.getState().notify(e instanceof Error ? e.message : String(e));
  const down = (p: Point) => {
    if (creating) {
      const point = closePoint(p);
      if (points.length >= 3 && point === points[0]) {
        try {
          validateTerrainContour(points);
          const next: Terrain = {
            id: crypto.randomUUID(),
            contour: points,
            material: "grass",
            revision: 1,
            textureOrigin: { ...points[0] },
          };
          useStore.getState().inspect({ terrainDraft: null });
          void useStore
            .getState()
            .commit(
              { ...doc, model: { ...doc.model, terrain: next } },
              "terrain",
            )
            .then(() => {
              setTool("select");
              if (useStore.getState().doc?.model.terrain?.id === next.id)
                useStore.getState().choose(next.id);
            });
        } catch (e) {
          notify(e);
        }
      } else {
        try {
          validateTerrainContour([...points, point], false);
          useStore
            .getState()
            .inspect({ terrainDraft: { points: [...points, point] } });
          setCursor(point);
        } catch (e) {
          notify(e);
        }
      }
      return true;
    }
    if (editing && doc.model.terrain) {
      const original = doc.model.terrain;
      const vertex = original.contour.findIndex(
        (q) => Math.hypot(p.x - q.x, p.y - q.y) * camera.scale <= 10,
      );
      if (vertex >= 0 || terrainContains(p, original.contour)) {
        drag.current = { original, start: rounded(p), vertex };
        setPreview(original);
      }
      return true;
    }
    return false;
  };
  const move = (p: Point) => {
    if (creating) {
      setCursor(closePoint(p));
      return true;
    }
    if (editing && drag.current) {
      try {
        setPreview(candidate(p));
      } catch (e) {
        notify(e);
      }
      return true;
    }
    return false;
  };
  const up = (p: Point) => {
    if (!drag.current || !editing) return false;
    try {
      const next = candidate(p);
      validateTerrain(next);
      drag.current = null;
      setPreview(null);
      void useStore
        .getState()
        .commit({ ...doc, model: { ...doc.model, terrain: next } }, "terrain");
    } catch (e) {
      drag.current = null;
      setPreview(null);
      notify(e);
    }
    return true;
  };
  const material = terrain?.material ?? "grass";
  const tile = useMemo(() => terrainTexture(material), [material]);
  const screen = (p: Point) => ({
    x: camera.x + p.x * camera.scale,
    y: camera.y + p.y * camera.scale,
  });
  const rendering = mode === "plan" && terrain;
  let valid = true;
  if (preview) {
    try {
      validateTerrain(preview);
    } catch {
      valid = false;
    }
  }
  const drawingPoints = creating
    ? [...points, ...(cursor && points.length ? [cursor] : [])]
    : [];
  const hint = creating
    ? `Clique ${points.length ? "no próximo ponto ou no primeiro para fechar" : "no primeiro ponto"} · Esc cancela`
    : editing
      ? "Arraste o terreno ou um ponto · Concluir ajuste ou Esc encerra"
      : "";
  return {
    down,
    move,
    up,
    cancel,
    isDragging: () => !!drag.current,
    selectAt: (p: Point) => {
      if (
        mode === "plan" &&
        tool === "select" &&
        doc.model.terrain &&
        terrainContains(p, doc.model.terrain.contour)
      ) {
        useStore.getState().choose(doc.model.terrain.id);
        return true;
      }
      return false;
    },
    hint,
    layer: rendering ? (
      <Layer listening={false}>
        <Shape
          sceneFunc={(context) => {
            const ctx = context._context;
            ctx.save();
            ctx.beginPath();
            terrain.contour.forEach((p, i) => {
              const q = screen(p);
              if (i) ctx.lineTo(q.x, q.y);
              else ctx.moveTo(q.x, q.y);
            });
            ctx.closePath();
            const pattern = ctx.createPattern(tile, "repeat")!;
            const origin = screen(terrain.textureOrigin),
              scale = (TERRAIN_TILE_WORLD / tile.width) * camera.scale;
            pattern.setTransform(
              new DOMMatrix([scale, 0, 0, scale, origin.x, origin.y]),
            );
            ctx.fillStyle = pattern;
            ctx.fill();
            ctx.strokeStyle = "#64794f";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
          }}
        />
      </Layer>
    ) : null,
    controls:
      mode === "plan" ? (
        <Layer listening={false}>
          <Shape
            sceneFunc={(context) => {
              const ctx = context._context;
              ctx.save();
              const line = (ring: Point[], closed: boolean, color: string) => {
                if (!ring.length) return;
                ctx.beginPath();
                ring.forEach((p, i) => {
                  const q = screen(p);
                  if (i) ctx.lineTo(q.x, q.y);
                  else ctx.moveTo(q.x, q.y);
                });
                if (closed) ctx.closePath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
              };
              const text = (value: string, p: Point, offset = 0) => {
                const q = screen(p);
                ctx.font = "600 12px Arial";
                const w = ctx.measureText(value).width;
                ctx.fillStyle = "rgba(255,255,255,.92)";
                ctx.fillRect(q.x - w / 2 - 6, q.y - 10 + offset, w + 12, 22);
                ctx.fillStyle = "#254d38";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(value, q.x, q.y + offset + 1);
              };
              if (terrain) {
                const label = terrainLabelPoint(terrain.contour);
                if (valid && showLabel)
                  text(
                    `Terreno · ${terrainAreaText(terrain.contour)}`,
                    label,
                    -18,
                  );
                if (select === terrain.id || editing)
                  line(terrain.contour, true, valid ? "#245d49" : "#a82c2c");
                if (editing)
                  terrain.contour.forEach((p) => {
                    const q = screen(p);
                    ctx.beginPath();
                    ctx.arc(q.x, q.y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = "white";
                    ctx.fill();
                    ctx.strokeStyle = "#245d49";
                    ctx.stroke();
                  });
                if (editing && drag.current) {
                  const vertex = drag.current.vertex;
                  terrain.contour.forEach((a, i) => {
                    const b = terrain.contour[(i + 1) % terrain.contour.length];
                    if (
                      vertex < 0 ||
                      i === vertex ||
                      (i + 1) % terrain.contour.length === vertex
                    )
                      text(
                        `${display(Math.hypot(b.x - a.x, b.y - a.y))} cm`,
                        { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
                        -16,
                      );
                  });
                }
              }
              if (drawingPoints.length) {
                ctx.setLineDash([6, 4]);
                line(drawingPoints, false, "#245d49");
                ctx.setLineDash([]);
                const q = screen(points[0]);
                ctx.beginPath();
                ctx.arc(
                  q.x,
                  q.y,
                  cursor === points[0] && points.length >= 3 ? 9 : 6,
                  0,
                  Math.PI * 2,
                );
                ctx.fillStyle = "white";
                ctx.fill();
                ctx.strokeStyle = "#245d49";
                ctx.stroke();
                if (cursor && points.length) {
                  const a = points[points.length - 1];
                  text(
                    `${display(Math.hypot(cursor.x - a.x, cursor.y - a.y))} cm`,
                    { x: (a.x + cursor.x) / 2, y: (a.y + cursor.y) / 2 },
                    -16,
                  );
                }
              }
              ctx.restore();
            }}
          />
        </Layer>
      ) : null,
  };
}
