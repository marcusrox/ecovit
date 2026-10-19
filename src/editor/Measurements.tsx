import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Layer, Shape, Circle } from "react-konva";
import {
  bounds,
  type LocalProject,
  type Measurement,
  type Point,
  type Tool,
} from "../domain/project";
import { openingBox, openingLabel, removeElement } from "../domain/openings";
import {
  attractMeasurement,
  measurementTargets,
  measurementText,
  nearMeasurement,
  roundedPoint,
  validMeasurement,
} from "../domain/measurements";
import { useStore } from "../state/store";
import { usePreferences } from "../state/preferences";
import { Icon } from "../ui/Icon";
import styles from "../ui/App.module.css";

type Camera = { x: number; y: number; scale: number };
type Hit = { id: string; label: string };
type Drag = {
  original: Measurement;
  start: Point;
  type: "create" | "move" | "a" | "b";
  choices: Hit[];
};

export function MeasurementProperties({ doc }: { doc: LocalProject }) {
  const { select, busy, readonly } = useStore();
  const m = doc.model.measurements.find((m) => m.id === select);
  if (!m) return null;
  return (
    <aside className={styles.properties} aria-label="Propriedades da medida">
      <div className={styles.panelTitle}>MEDIDA SELECIONADA</div>
      <h2>Medida {doc.model.measurements.indexOf(m) + 1}</h2>
      <p>
        Comprimento: <strong>{measurementText(m)}</strong>
      </p>
      <p>
        Arraste o corpo para mover ou uma ponta para ajustar. Alt suspende a
        atração.
      </p>
      <button
        className={styles.iconText}
        disabled={busy || readonly}
        onClick={() => {
          void useStore.getState().commit(removeElement(doc, m.id), "measure");
          useStore.getState().choose(null);
        }}
      >
        <Icon name="delete" /> Excluir medida
      </button>
    </aside>
  );
}

export function useMeasurementCanvas(
  doc: LocalProject,
  tool: Tool,
  camera: Camera,
  host: RefObject<HTMLDivElement | null>,
  navigating = false,
) {
  const { mode, select, readonly, busy } = useStore();
  const imageEditing = useStore((s) => !!s.imageDraft);
  const visibleLabel = usePreferences((s) => s.labels.measure);
  const drag = useRef<Drag | null>(null);
  const cursor = useRef<Point | null>(null);
  const [preview, setPreview] = useState<Measurement | null>(null);
  const [target, setTarget] = useState<Point | null>(null);
  const [choices, setChoices] = useState<Hit[]>([]);
  const targets = useMemo(
    () =>
      measurementTargets(
        doc,
        doc.viewFloorId,
        preview?.id ?? select ?? undefined,
      ),
    [doc, select, preview?.id],
  );
  const cancel = useCallback(() => {
    drag.current = null;
    cursor.current = null;
    setPreview(null);
    setTarget(null);
  }, []);
  const snap = (p: Point, alt: boolean) => {
    const result = attractMeasurement(p, targets, camera.scale, alt);
    setTarget(result.snapped ? result.point : null);
    return result.point;
  };
  const candidate = (p: Point, alt: boolean) => {
    const g = drag.current!;
    if (g.type === "move") {
      const delta = roundedPoint({ x: p.x - g.start.x, y: p.y - g.start.y });
      return {
        ...g.original,
        a: { x: g.original.a.x + delta.x, y: g.original.a.y + delta.y },
        b: { x: g.original.b.x + delta.x, y: g.original.b.y + delta.y },
      };
    }
    return { ...g.original, [g.type === "a" ? "a" : "b"]: snap(p, alt) };
  };
  const move = (p: Point, alt: boolean) => {
    cursor.current = p;
    if (mode !== "plan" || busy || readonly || imageEditing) return false;
    if (drag.current) {
      setPreview(candidate(p, alt));
      return true;
    }
    if (navigating) return false;
    if (tool === "measure") {
      snap(p, alt);
      return true;
    }
    return false;
  };
  useEffect(() => {
    cancel();
    setChoices([]);
  }, [doc.viewFloorId, tool, mode, cancel]);
  useEffect(() => {
    if (busy || readonly || imageEditing) cancel();
  }, [busy, readonly, imageEditing, cancel]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        document.querySelector("dialog[open]") ||
        (e.target as HTMLElement).closest(
          "input,textarea,select,[contenteditable]",
        )
      )
        return;
      if (e.key === "Escape") {
        cancel();
        setChoices([]);
      }
      if (
        e.key === "Alt" &&
        cursor.current &&
        (tool === "measure" || drag.current)
      ) {
        e.preventDefault();
        move(cursor.current, e.type === "keydown");
      }
    };
    const outside = (e: MouseEvent) => {
      if (e.button === 0 && !host.current?.contains(e.target as Node)) cancel();
    };
    window.addEventListener("blur", cancel);
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", key);
    window.addEventListener("mouseup", outside);
    return () => {
      window.removeEventListener("blur", cancel);
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", key);
      window.removeEventListener("mouseup", outside);
    };
  });
  const down = (p: Point, alt: boolean) => {
    if (mode !== "plan" || busy || readonly) return false;
    setChoices([]);
    if (drag.current?.type === "create") return up(p, alt, true);
    const active = doc.model.measurements.find((m) => m.id === select);
    if (active)
      for (const end of ["a", "b"] as const) {
        if (
          Math.hypot(p.x - active[end].x, p.y - active[end].y) * camera.scale <=
          9
        ) {
          drag.current = { original: active, start: p, type: end, choices: [] };
          setPreview(active);
          return true;
        }
      }
    // Preserve the existing priority of selected wall/slab/opening handles.
    const wall = doc.model.walls.find((w) => w.id === select);
    if (
      wall &&
      [wall.a, wall.b].some(
        (q) => Math.hypot(p.x - q.x, p.y - q.y) * camera.scale < 11,
      )
    )
      return false;
    for (const slab of doc.model.slabs) {
      const ring =
        slab.id === select
          ? slab.contour
          : slab.openings.find((o) => o.id === select)?.contour;
      if (
        ring?.some((a, i) => {
          const b = ring[(i + 1) % ring.length];
          return (
            Math.hypot(p.x - (a.x + b.x) / 2, p.y - (a.y + b.y) / 2) *
              camera.scale <=
            8
          );
        })
      )
        return false;
    }
    const selectedOpening = doc.model.openings.find((o) => o.id === select);
    if ((tool === "select" || tool === "measure") && selectedOpening) {
      const w = doc.model.walls.find((w) => w.id === selectedOpening.wallId)!;
      const b = openingBox(selectedOpening, w, doc.project.base.width);
      const ends =
        w.a.y === w.b.y
          ? [
              { x: b.x, y: b.y + b.height / 2 },
              { x: b.x + b.width, y: b.y + b.height / 2 },
            ]
          : [
              { x: b.x + b.width / 2, y: b.y },
              { x: b.x + b.width / 2, y: b.y + b.height },
            ];
      if (ends.some((q) => Math.hypot(p.x - q.x, p.y - q.y) * camera.scale < 9))
        return false;
    }
    if (tool === "measure") {
      const a = snap(p, alt);
      const m: Measurement = {
        id: crypto.randomUUID(),
        floorId: doc.viewFloorId,
        a,
        b: a,
      };
      drag.current = { original: m, start: p, type: "create", choices: [] };
      setPreview(m);
      cursor.current = p;
      return true;
    }
    if (tool !== "select") return false;
    const hits = doc.model.measurements
      .filter((m) => nearMeasurement(p, m, 6 / camera.scale))
      .sort((a, b) => a.id.localeCompare(b.id));
    if (!hits.length) return false;
    const all: Hit[] = hits.map((m) => ({
      id: m.id,
      label: `Medida ${doc.model.measurements.indexOf(m) + 1} · ${measurementText(m)}`,
    }));
    const contains = (b: {
      x: number;
      y: number;
      width: number;
      height: number;
    }) =>
      p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height;
    doc.model.openings.forEach((o, i) => {
      const w = doc.model.walls.find((w) => w.id === o.wallId)!;
      if (contains(openingBox(o, w, doc.project.base.width)))
        all.push({ id: o.id, label: `${openingLabel[o.kind]} ${i + 1}` });
    });
    doc.model.walls.forEach((w, i) => {
      if (contains(bounds(w, doc.project.base.width)))
        all.push({ id: w.id, label: `Parede ${i + 1}` });
    });
    // Slab hits are computed by the same polygon predicates as the slab editor.
    doc.model.slabs.forEach((s) => {
      if (ringLocationForMeasure(p, s.contour) >= 0) {
        for (const [i, o] of s.openings.entries())
          if (ringLocationForMeasure(p, o.contour) >= 0)
            all.push({ id: o.id, label: `Abertura ${i + 1} · Laje` });
        all.push({ id: s.id, label: "Laje" });
      }
    });
    const chosen = hits.find((m) => m.id === select);
    if (!chosen && all.some((h) => h.id === select)) return false;
    if (!chosen && all.length > 1) {
      setChoices(all);
      return true;
    }
    const m = chosen ?? hits[0];
    useStore.getState().choose(m.id);
    drag.current = { original: m, start: p, type: "move", choices: all };
    setPreview(m);
    return true;
  };
  const up = (p: Point, alt: boolean, confirmCreate = false) => {
    const g = drag.current;
    if (!g) return false;
    // Releasing the first click (even after moving) only leaves the preview.
    if (g.type === "create" && !confirmCreate) return true;
    if (busy || readonly) {
      cancel();
      return true;
    }
    const next = candidate(p, alt);
    if (
      g.type === "move" &&
      Math.hypot(p.x - g.start.x, p.y - g.start.y) * camera.scale < 3
    ) {
      if (g.choices.length > 1) setChoices(g.choices);
    } else if (!validMeasurement(next)) {
      useStore
        .getState()
        .notify(
          "A medida precisa de dois pontos distintos dentro dos limites do editor.",
        );
      if (g.type === "create") return true;
    } else if (
      g.type === "create" ||
      JSON.stringify(next) !== JSON.stringify(g.original)
    ) {
      void useStore
        .getState()
        .commit(
          {
            ...doc,
            model: {
              ...doc.model,
              measurements: doc.model.measurements.some((m) => m.id === next.id)
                ? doc.model.measurements.map((m) =>
                    m.id === next.id ? next : m,
                  )
                : [...doc.model.measurements, next],
            },
          },
          "measure",
        )
        .then(() => {
          if (
            useStore
              .getState()
              .doc?.model.measurements.some((m) => m.id === next.id)
          )
            useStore.getState().choose(next.id);
        });
    }
    cancel();
    return true;
  };
  const rendered = doc.model.measurements.map((m) =>
    preview?.id === m.id ? preview : m,
  );
  if (preview && !rendered.some((m) => m.id === preview.id))
    rendered.push(preview);
  return {
    down,
    move,
    up,
    cancel,
    isDragging: () => !!drag.current && drag.current.type !== "create",
    creating: drag.current?.type === "create",
    leave: () => {
      if (!drag.current) {
        setTarget(null);
        cursor.current = null;
      }
    },
    layer: mode === "plan" && (
      <Layer listening={false}>
        <Shape
          sceneFunc={(ctx) => {
            for (const m of rendered) {
              const a = {
                x: m.a.x * camera.scale + camera.x,
                y: m.a.y * camera.scale + camera.y,
              };
              const b = {
                x: m.b.x * camera.scale + camera.x,
                y: m.b.y * camera.scale + camera.y,
              };
              ctx.save();
              ctx.strokeStyle =
                m.id === select || m.id === preview?.id ? "#205d48" : "#52627b";
              ctx.lineWidth = m.id === select ? 2 : 1;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
              const editing = drag.current;
              const showEditingLabel =
                m.id === preview?.id &&
                editing &&
                (editing.type !== "move" ||
                  Math.hypot(
                    m.a.x - editing.original.a.x,
                    m.a.y - editing.original.a.y,
                  ) *
                    camera.scale >=
                    3);
              if (visibleLabel || showEditingLabel) {
                let angle = Math.atan2(b.y - a.y, b.x - a.x);
                if (angle > Math.PI / 2) angle -= Math.PI;
                if (angle <= -Math.PI / 2) angle += Math.PI;
                ctx.translate((a.x + b.x) / 2, (a.y + b.y) / 2);
                ctx.rotate(angle);
                ctx.font = "11px sans-serif";
                ctx.fillStyle = "#234b40";
                const text = measurementText(m),
                  width = ctx.measureText(text).width;
                ctx.fillText(text, -width / 2, -6);
              }
              ctx.restore();
            }
          }}
        />
        {!readonly &&
          rendered
            .filter(
              (m) =>
                m.id === select ||
                (m.id === preview?.id && drag.current?.type === "create"),
            )
            .flatMap((m) =>
              (["a", "b"] as const).map((end) => (
                <Circle
                  key={`${m.id}-${end}`}
                  x={m[end].x * camera.scale + camera.x}
                  y={m[end].y * camera.scale + camera.y}
                  radius={5}
                  fill="#fff"
                  stroke="#205d48"
                  strokeWidth={2}
                />
              )),
            )}
        {target && !readonly && !busy && (!navigating || !!drag.current) && (
          <Circle
            x={target.x * camera.scale + camera.x}
            y={target.y * camera.scale + camera.y}
            radius={8}
            stroke="#bd792c"
            strokeWidth={2}
          />
        )}
      </Layer>
    ),
    menu: choices.length > 1 && (
      <div
        className={styles.overlap}
        role="group"
        aria-label="Elementos sobrepostos"
      >
        <span>Selecionar elemento</span>
        {choices.map((h) => (
          <button
            key={h.id}
            onClick={() => {
              useStore.getState().choose(h.id);
              setChoices([]);
            }}
          >
            {h.label}
          </button>
        ))}
      </div>
    ),
  };
}

// Reuse the slab editor's exact polygon classification for selection candidates.
import { ringLocation as ringLocationForMeasure } from "../domain/slabs";
