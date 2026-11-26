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
  measurementTargets,
  projection,
  roundedPoint,
} from "../domain/measurements";
import { removeElement } from "../domain/openings";
import {
  type LocalProject,
  type Point,
  type RoomBoundary,
  type RoomLabel,
  type Tool,
} from "../domain/project";
import {
  addRoomLabel,
  attractRoomPoint,
  revalidateRoomLabel,
  roomAreaText,
  roomGeometry,
  validRoomBoundary,
  validRoomPoint,
} from "../domain/rooms";
import { useStore } from "../state/store";
import styles from "../ui/App.module.css";
import { Icon } from "../ui/Icon";
import { drawRooms, roomLabelLayout } from "./drawing/room-label";

export function RoomProperties({ doc }: { doc: LocalProject }) {
  const {
    select,
    busy,
    readonly,
    commit,
    choose,
    notify,
    roomNameRequest,
    inspect,
  } = useStore();
  const label = doc.model.roomLabels.find((l) => l.id === select);
  const boundary = doc.model.roomBoundaries.find((l) => l.id === select);
  const [name, setName] = useState(label?.name ?? "");
  const collapsed = useStore((s) => s.propertiesCollapsed);
  const setCollapsed = useStore((s) => s.setPropertiesCollapsed);
  const nameInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (label && roomNameRequest === label.id && !busy && !readonly) {
      if (collapsed) setCollapsed(false);
      else {
        nameInput.current?.focus();
        nameInput.current?.select();
        inspect({ roomNameRequest: null });
      }
    }
  }, [
    label,
    roomNameRequest,
    busy,
    readonly,
    collapsed,
    inspect,
    setCollapsed,
  ]);
  useEffect(() => {
    setName(label?.name ?? "");
  }, [label?.name]);
  if (!label && !boundary) return null;
  const region =
    label && !label.review
      ? roomGeometry(doc, doc.viewFloorId).at(label.reference)
      : undefined;
  const saveName = () => {
    const value = name.trim();
    if (!label || busy || readonly || value === label.name) return;
    if (!value || value.length > 100) {
      notify("Informe um nome de ambiente com 1 a 100 caracteres.");
      setName(label.name);
      return;
    }
    void commit(
      {
        ...doc,
        model: {
          ...doc.model,
          roomLabels: doc.model.roomLabels.map((l) =>
            l.id === label.id ? { ...l, name: value } : l,
          ),
        },
      },
      "room",
    );
  };
  if (collapsed)
    return (
      <button
        className={`${styles.reopen} ${styles.iconText}`}
        onClick={() => setCollapsed(false)}
      >
        {label ? "Propriedades do ambiente" : "Propriedades do fechamento"}
        <Icon name="left" />
      </button>
    );
  return (
    <aside
      className={styles.properties}
      aria-label={
        label ? "Propriedades do ambiente" : "Propriedades do fechamento"
      }
    >
      <div className={styles.panelTitle}>
        <span>
          {label ? "PROPRIEDADES DO AMBIENTE" : "FECHAMENTO SELECIONADO"}
        </span>
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
      <h2>{label?.name ?? "Linha de fechamento"}</h2>
      {label && (
        <>
          <section
            className={styles.propertyGroup}
            aria-label="Identificação do ambiente"
          >
            <label className={styles.field}>
              Nome do ambiente
              <input
                ref={nameInput}
                value={name}
                maxLength={100}
                disabled={busy || readonly}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setName(label.name);
                  }
                }}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={label.excludedFromAreas ?? false}
                disabled={busy || readonly}
                onChange={(e) => {
                  const excludedFromAreas = e.target.checked;
                  void commit(
                    {
                      ...doc,
                      model: {
                        ...doc.model,
                        roomLabels: doc.model.roomLabels.map((l) =>
                          l.id === label.id ? { ...l, excludedFromAreas } : l,
                        ),
                      },
                    },
                    "room",
                  );
                }}
              />
              Desconsiderar das áreas útil e construída
            </label>
            <p className={styles.note}>
              Mantém o nome e mostra 0,00 m². Desconta somente o espaço interno;
              as paredes continuam na área construída.
            </p>
          </section>
          <section
            className={styles.propertyInfo}
            aria-label="Área do ambiente"
          >
            <dl className={styles.propertyFacts}>
              <dt>Área</dt>
              <dd>
                {label.excludedFromAreas
                  ? roomAreaText(0)
                  : label.review
                    ? "Revisar ambiente"
                    : region
                      ? roomAreaText(region.area)
                      : "Revisar ambiente"}
              </dd>
            </dl>
          </section>
          <p className={styles.note}>
            {label.review
              ? "Clique na etiqueta para reavaliar o fechamento na referência original. O nome será preservado se o ambiente estiver fechado e sem outra etiqueta válida."
              : "Arraste a etiqueta para mover o texto, inclusive para fora do ambiente. A referência permanece no local do clique inicial."}
          </p>
        </>
      )}
      {boundary && (
        <p className={styles.note}>
          Arraste o corpo para mover ou uma ponta para ajustar. Alt suspende a
          atração. A linha não acompanha paredes movidas; se o contorno abrir, a
          etiqueta entrará em revisão e poderá ser reavaliada com um clique.
        </p>
      )}
      <button
        className={`${styles.iconText} ${styles.danger}`}
        disabled={busy || readonly}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          void commit(removeElement(doc, (label ?? boundary)!.id), "room");
          choose(null);
        }}
      >
        <Icon name="delete" />
        {label ? "Excluir ambiente" : "Excluir linha"}
      </button>
    </aside>
  );
}

type Camera = { x: number; y: number; scale: number };
type Drag =
  | { kind: "label"; original: RoomLabel; start: Point }
  | { kind: "line"; original: RoomBoundary; start: Point; end?: "a" | "b" };
export function useRoomCanvas(
  doc: LocalProject,
  tool: Tool,
  camera: Camera,
  host: RefObject<HTMLDivElement | null>,
  navigating: boolean,
) {
  const { mode, select, busy, readonly, imageDraft } = useStore();
  const geometry = useMemo(
    () =>
      doc.model.roomLabels.length || tool === "room"
        ? roomGeometry(doc, doc.viewFloorId)
        : { regions: [], at: () => undefined },
    [doc, tool],
  );
  const canvas = useMemo(
    () => document.createElement("canvas").getContext("2d")!,
    [],
  );
  const drag = useRef<Drag | null>(null),
    draft = useRef<RoomBoundary | null>(null),
    cursor = useRef<Point | null>(null);
  const [linePreview, setLinePreview] = useState<RoomBoundary | null>(null),
    [labelPreview, setLabelPreview] = useState<RoomLabel | null>(null),
    [target, setTarget] = useState<Point | null>(null);
  const cancel = useCallback(() => {
    drag.current = null;
    draft.current = null;
    cursor.current = null;
    setLinePreview(null);
    setLabelPreview(null);
    setTarget(null);
  }, []);
  useEffect(() => {
    cancel();
  }, [doc.viewFloorId, mode, tool, cancel]);
  useEffect(() => {
    if (busy || readonly || imageDraft) cancel();
  }, [busy, readonly, imageDraft, cancel]);
  const excludedBoundaryId = linePreview?.id ?? select;
  const targets = useMemo(() => {
    const wallsOnly = {
      ...doc,
      model: {
        ...doc.model,
        terrain: null,
        openings: [],
        slabs: [],
        measurements: [],
        roomLabels: [],
      },
    };
    const result = measurementTargets(wallsOnly, doc.viewFloorId);
    for (const line of doc.model.roomBoundaries)
      if (line.id !== excludedBoundaryId) {
        result.vertices.push(line.a, line.b);
        result.segments.push([line.a, line.b]);
      }
    return result;
  }, [doc, excludedBoundaryId]);
  const snap = (p: Point, alt: boolean) => {
    const r = attractRoomPoint(p, targets, camera.scale, alt);
    setTarget(r.snapped ? r.point : null);
    return r.point;
  };
  const enabled = mode === "plan" && !busy && !readonly && !imageDraft;
  const layout = (l: RoomLabel) =>
    roomLabelLayout(l, geometry, canvas, camera.scale);
  const commitLine = (line: RoomBoundary) => {
    if (!validRoomBoundary(line)) {
      useStore
        .getState()
        .notify("Escolha pontos distintos dentro dos limites do editor.");
      return false;
    }
    const editing = doc.model.roomBoundaries.some((l) => l.id === line.id);
    void useStore
      .getState()
      .commit(
        {
          ...doc,
          model: {
            ...doc.model,
            roomBoundaries: doc.model.roomBoundaries.some(
              (l) => l.id === line.id,
            )
              ? doc.model.roomBoundaries.map((l) =>
                  l.id === line.id ? line : l,
                )
              : [...doc.model.roomBoundaries, line],
          },
        },
        "room",
      )
      .then(() => {
        if (
          useStore
            .getState()
            .doc?.model.roomBoundaries.some((l) => l.id === line.id)
        )
          useStore.getState().choose(editing ? line.id : null);
      });
    return true;
  };
  const move = (p: Point, alt: boolean) => {
    cursor.current = p;
    if (!enabled || navigating) return false;
    const g = drag.current;
    if (g) {
      const delta = roundedPoint({ x: p.x - g.start.x, y: p.y - g.start.y });
      if (g.kind === "label")
        setLabelPreview({
          ...g.original,
          position: {
            x: g.original.position.x + delta.x,
            y: g.original.position.y + delta.y,
          },
        });
      else
        setLinePreview(
          g.end
            ? { ...g.original, [g.end]: snap(p, alt) }
            : {
                ...g.original,
                a: { x: g.original.a.x + delta.x, y: g.original.a.y + delta.y },
                b: { x: g.original.b.x + delta.x, y: g.original.b.y + delta.y },
              },
        );
      return true;
    }
    if (tool === "room-boundary") {
      const b = snap(p, alt);
      if (draft.current) setLinePreview({ ...draft.current, b });
      return true;
    }
    return tool === "room";
  };
  useEffect(() => {
    const outside = (e: MouseEvent) => {
      if (e.button === 0 && !host.current?.contains(e.target as Node)) cancel();
    };
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest(
          "input,textarea,select,button,[contenteditable]",
        ) ||
        document.querySelector("dialog[open]")
      )
        return;
      if (
        (e.key === "Escape" ||
          ((e.ctrlKey || e.metaKey) &&
            e.key.toLowerCase() === "z" &&
            !e.shiftKey)) &&
        (draft.current || drag.current)
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        cancel();
        return;
      }
      if (
        e.key === "Alt" &&
        cursor.current &&
        enabled &&
        !navigating &&
        (tool === "room-boundary" || drag.current?.kind === "line")
      ) {
        e.preventDefault();
        move(cursor.current, e.type === "keydown");
      }
    };
    window.addEventListener("blur", cancel);
    window.addEventListener("mouseup", outside);
    window.addEventListener("keydown", key, true);
    window.addEventListener("keyup", key);
    return () => {
      window.removeEventListener("blur", cancel);
      window.removeEventListener("mouseup", outside);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("keyup", key);
    };
  });
  const down = (p: Point, alt: boolean) => {
    if (!enabled || navigating) return false;
    if (draft.current) {
      const next = { ...draft.current, b: snap(p, alt) };
      if (commitLine(next)) cancel();
      return true;
    }
    if (!["select", "room", "room-boundary"].includes(tool)) return false;
    const active = doc.model.roomBoundaries.find((l) => l.id === select);
    if (active)
      for (const end of ["a", "b"] as const)
        if (
          Math.hypot(p.x - active[end].x, p.y - active[end].y) * camera.scale <=
          9
        ) {
          drag.current = { kind: "line", original: active, start: p, end };
          setLinePreview(active);
          return true;
        }
    const hit = [...doc.model.roomLabels].reverse().find((l) => {
      const box = layout(l);
      return (
        Math.abs(p.x - l.position.x) * camera.scale <= box.width / 2 &&
        Math.abs(p.y - l.position.y) * camera.scale <= box.height / 2
      );
    });
    if (hit) {
      useStore.getState().choose(hit.id);
      drag.current = { kind: "label", original: hit, start: p };
      return true;
    }
    const line = doc.model.roomBoundaries.find(
      (l) =>
        (tool !== "room-boundary" || l.id === select) &&
        Math.hypot(
          p.x - projection(p, l.a, l.b).x,
          p.y - projection(p, l.a, l.b).y,
        ) *
          camera.scale <=
          6,
    );
    if (line) {
      useStore.getState().choose(line.id);
      drag.current = { kind: "line", original: line, start: p };
      setLinePreview(line);
      return true;
    }
    if (tool === "room-boundary") {
      const a = snap(p, alt);
      draft.current = {
        id: crypto.randomUUID(),
        floorId: doc.viewFloorId,
        a,
        b: a,
      };
      setLinePreview(draft.current);
      return true;
    }
    if (tool === "room") {
      try {
        const result = addRoomLabel(doc, doc.viewFloorId, roundedPoint(p));
        if (result.doc === doc) useStore.getState().choose(result.id);
        else
          void useStore
            .getState()
            .commit(result.doc, "room")
            .then(() => {
              if (
                useStore
                  .getState()
                  .doc?.model.roomLabels.some((l) => l.id === result.id)
              )
                useStore.getState().choose(result.id);
            });
      } catch (error) {
        useStore.getState().notify((error as Error).message);
      }
      return true;
    }
    return false;
  };
  const up = (p: Point, alt: boolean) => {
    const g = drag.current;
    if (!g) return !!draft.current;
    if (
      enabled &&
      Math.hypot(p.x - g.start.x, p.y - g.start.y) * camera.scale >= 3
    ) {
      const delta = roundedPoint({ x: p.x - g.start.x, y: p.y - g.start.y });
      if (g.kind === "label") {
        const position = {
          x: g.original.position.x + delta.x,
          y: g.original.position.y + delta.y,
        };
        if (validRoomPoint(position))
          void useStore.getState().commit(
            {
              ...doc,
              model: {
                ...doc.model,
                roomLabels: doc.model.roomLabels.map((l) =>
                  l.id === g.original.id ? { ...l, position } : l,
                ),
              },
            },
            "room",
          );
        else
          useStore
            .getState()
            .notify("Mantenha a etiqueta dentro dos limites do editor.");
      } else
        commitLine(
          g.end
            ? { ...g.original, [g.end]: snap(p, alt) }
            : {
                ...g.original,
                a: { x: g.original.a.x + delta.x, y: g.original.a.y + delta.y },
                b: { x: g.original.b.x + delta.x, y: g.original.b.y + delta.y },
              },
        );
    } else if (enabled && g.kind === "label" && g.original.review) {
      const next = revalidateRoomLabel(doc, g.original.id);
      if (next !== doc) void useStore.getState().commit(next, "room");
    }
    cancel();
    return true;
  };
  const selectedLabel = doc.model.roomLabels.find(
    (l) => l.id === select && !l.review,
  );
  const selectedRegion = selectedLabel
    ? geometry.at(selectedLabel.reference)
    : undefined;
  return {
    doubleClick: (p: Point) => {
      if (!enabled || navigating || !["select", "room"].includes(tool))
        return false;
      const label = [...doc.model.roomLabels].reverse().find((l) => {
        const box = layout(l);
        return (
          Math.abs(p.x - l.position.x) * camera.scale <= box.width / 2 &&
          Math.abs(p.y - l.position.y) * camera.scale <= box.height / 2
        );
      });
      if (!label) return false;
      cancel();
      useStore.getState().choose(label.id);
      useStore.getState().inspect({ roomNameRequest: label.id });
      return true;
    },
    down,
    move,
    up,
    cancel,
    hint:
      mode !== "plan"
        ? ""
        : tool === "room"
          ? "Clique dentro de uma região fechada para identificar o ambiente e calcular sua área. · Esc encerra Ambiente"
          : tool === "room-boundary"
            ? `${draft.current ? "Clique no ponto final" : "Clique no ponto inicial"} · Alt suspende atração · Esc cancela`
            : "",
    escape: () => {
      const active = !!draft.current || !!drag.current;
      if (active) cancel();
      return active;
    },
    isDragging: () => !!drag.current,
    leave: () => {
      if (drag.current) cancel();
      setTarget(null);
    },
    layer:
      mode === "plan" ? (
        <Layer listening={false}>
          {selectedRegion && (
            <Shape
              fill="rgba(69,130,90,0.14)"
              sceneFunc={(ctx, shape) => {
                ctx.beginPath();
                for (const ring of [
                  selectedRegion.contour,
                  ...selectedRegion.holes,
                ]) {
                  ring.forEach((p, i) => {
                    const x = camera.x + p.x * camera.scale,
                      y = camera.y + p.y * camera.scale;
                    if (!i) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                  });
                  ctx.closePath();
                }
                ctx.fillStrokeShape(shape);
              }}
            />
          )}
          <Shape
            sceneFunc={(ctx) => {
              drawRooms(ctx._context, {
                doc,
                camera,
                layout,
                select,
                linePreview,
                labelPreview,
                target,
              });
            }}
          />
        </Layer>
      ) : null,
  };
}
