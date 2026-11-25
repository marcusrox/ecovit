import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Layer, Shape } from "react-konva";
import type {
  LocalProject,
  Point,
  TerrainCompass,
  Tool,
} from "../domain/project";
import {
  compassContains,
  compassCorners,
  compassPoint,
  compassSelectionId,
  resizeCompass,
  validateCompass,
} from "../domain/terrain-compass";
import { useStore } from "../state/store";
import { drawCompass } from "./drawing/elements";

type Camera = { x: number; y: number; scale: number };
type Gesture = {
  type: "move" | "resize" | "rotate";
  start: Point;
  original: TerrainCompass;
};

export function useTerrainCompass(
  doc: LocalProject,
  tool: Tool,
  camera: Camera,
  host: RefObject<HTMLDivElement | null>,
) {
  const { mode, select, busy, readonly, terrainEditing } = useStore();
  const terrain = doc.model.terrain;
  const drag = useRef<Gesture | null>(null);
  const [preview, setPreview] = useState<TerrainCompass | null>(null);
  const compass = preview ?? terrain?.compass;
  const visible = mode === "plan" && compass?.visible;
  const editable =
    visible && tool === "select" && !busy && !readonly && !terrainEditing;
  const selected = editable && select === compassSelectionId(terrain);
  const cancel = useCallback(() => {
    drag.current = null;
    setPreview(null);
  }, []);
  useEffect(() => {
    cancel();
  }, [
    doc.project.id,
    doc.viewFloorId,
    mode,
    tool,
    busy,
    readonly,
    terrainEditing,
    cancel,
  ]);
  useEffect(() => {
    if (select !== compassSelectionId(terrain)) cancel();
  }, [select, terrain, cancel]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
    };
    const outside = (e: MouseEvent) => {
      if (!host.current?.contains(e.target as Node)) cancel();
    };
    window.addEventListener("keydown", key);
    window.addEventListener("blur", cancel);
    window.addEventListener("mouseup", outside);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("mouseup", outside);
    };
  }, [cancel, host]);
  const rotationHandle = (c: TerrainCompass) =>
    compassPoint(c, 0, -c.size / 2 - 24 / camera.scale);
  function candidate(p: Point) {
    const g = drag.current!,
      c = g.original;
    let next: TerrainCompass;
    if (g.type === "resize") return resizeCompass(c, p);
    if (g.type === "move")
      next = {
        ...c,
        center: {
          x: c.center.x + Math.round(p.x - g.start.x),
          y: c.center.y + Math.round(p.y - g.start.y),
        },
      };
    else {
      const a =
        Math.atan2(p.y - c.center.y, p.x - c.center.x) -
        Math.atan2(g.start.y - c.center.y, g.start.x - c.center.x);
      next = {
        ...c,
        angle: (((c.angle + (a * 180) / Math.PI) % 360) + 360) % 360,
      };
    }
    validateCompass(next);
    return next;
  }
  const down = (p: Point) => {
    if (!editable || !compass || !terrain) return false;
    const near = (q: Point) =>
      Math.hypot(p.x - q.x, p.y - q.y) * camera.scale <= 9;
    const type =
      selected && near(rotationHandle(compass))
        ? "rotate"
        : selected && compassCorners(compass).some(near)
          ? "resize"
          : compassContains(compass, p)
            ? "move"
            : null;
    if (!type) return false;
    useStore.getState().choose(compassSelectionId(terrain));
    drag.current = { type, original: compass, start: p };
    return true;
  };
  const move = (p: Point) => {
    if (!drag.current) return false;
    try {
      setPreview(candidate(p));
    } catch {
      /* Invalid candidates never replace the last valid preview. */
    }
    return true;
  };
  const up = (p: Point) => {
    if (!drag.current || !terrain) return false;
    try {
      const next = candidate(p),
        original = drag.current.original;
      cancel();
      if (JSON.stringify(next) !== JSON.stringify(original))
        void useStore.getState().commit(
          {
            ...doc,
            model: { ...doc.model, terrain: { ...terrain, compass: next } },
          },
          "terrain",
        );
    } catch (e) {
      cancel();
      useStore.getState().notify(e instanceof Error ? e.message : String(e));
    }
    return true;
  };
  return {
    down,
    move,
    up,
    cancel,
    isDragging: () => !!drag.current,
    bounds: terrain?.compass?.visible ? compassCorners(terrain.compass) : [],
    layer:
      visible && compass ? (
        <Layer listening={false}>
          <Shape
            sceneFunc={(context) => {
              drawCompass(context._context, compass, camera, selected);
            }}
          />
        </Layer>
      ) : null,
  };
}
