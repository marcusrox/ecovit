import { useEffect, useRef, useState } from "react";
import { Layer, Shape, Line, Circle, Rect, Text } from "react-konva";
import {
  cm,
  display,
  snapPoint,
  hitWalls,
  type Point,
  type Slab,
  type LocalProject,
  type Tool,
} from "../domain/project";
import { openingBox, openingLabel } from "../domain/openings";
import {
  putSlab,
  removeSlabElement,
  ringEdges,
  ringLocation,
  onSegment,
  slabIssue,
  translateSlab,
  shiftSlabEdge,
  validateRing,
} from "../domain/slabs";
import { useStore } from "../state/store";
import { Icon } from "../ui/Icon";
import styles from "../ui/App.module.css";

const startDraft = (slab?: Slab, openingId?: string) => ({
  tool: slab ? ("select" as const) : ("slab" as const),
  slabId: slab?.id,
  openingId,
  points: [],
  closed: false,
  thickness: slab ? display(slab.thickness) : "",
});
export function deleteSlabSelection() {
  const s = useStore.getState();
  const slab = s.doc?.model.slabs.find(
    (a) => a.id === s.select || a.openings.some((o) => o.id === s.select),
  );
  if (!slab || !s.doc || s.busy || s.readonly) return false;
  if (
    s.select === slab.id &&
    !window.confirm("Excluir esta laje e todas as suas aberturas?")
  )
    return true;
  const id = s.select!;
  void s.commit(removeSlabElement(s.doc, id), "slab").then(() => {
    if (
      !useStore
        .getState()
        .doc?.model.slabs.some(
          (a) => a.id === id || a.openings.some((o) => o.id === id),
        )
    )
      useStore.getState().choose(id === slab.id ? null : slab.id);
  });
  return true;
}
export function SlabProperties({
  doc,
  setTool,
}: {
  doc: LocalProject;
  setTool: (t: Tool) => void;
}) {
  const selected = useStore((s) => s.select),
    busy = useStore((s) => s.busy),
    readonly = useStore((s) => s.readonly),
    editing = useStore((s) => s.slabEditing);
  const slab = doc.model.slabs[0],
    opening = slab?.openings.find((o) => o.id === selected);
  const [text, setText] = useState(slab ? display(slab.thickness) : "");
  useEffect(() => setText(slab ? display(slab.thickness) : ""), [slab]);
  if (!slab) return null;
  const disabled = busy || readonly || editing;
  const draw = (id?: string) => {
    setTool("select");
    useStore
      .getState()
      .inspect({ slabDraft: startDraft(slab, id), slabEditing: true });
  };
  return (
    <aside className={styles.properties} aria-label="Propriedades da laje">
      <div className={styles.panelTitle}>
        {opening ? "ABERTURA DE LAJE" : "LAJE SELECIONADA"}
      </div>
      <h2>
        {opening ? `Abertura ${slab.openings.indexOf(opening) + 1}` : "Laje"} ·{" "}
        {doc.model.floors[0].name}
      </h2>
      <p className={styles.muted}>
        Face superior: {display(doc.model.floors[0].level)} cm
        <br />
        Face inferior: {display(doc.model.floors[0].level - slab.thickness)} cm
      </p>
      <label className={styles.field}>
        Espessura da laje (cm)
        <input
          aria-label="Espessura da laje (cm)"
          disabled={disabled}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setText(display(slab.thickness));
          }}
        />
      </label>
      <div className={styles.slabActions}>
        <button
          className={styles.iconButton}
          aria-label="Aplicar espessura"
          title="Aplicar espessura"
          data-tooltip="Aplicar espessura"
          disabled={disabled}
          onClick={() => {
            try {
              void useStore
                .getState()
                .commit(putSlab(doc, { ...slab, thickness: cm(text) }), "slab");
            } catch (e) {
              useStore.getState().notify((e as Error).message);
            }
          }}
        >
          <Icon name="apply" />
        </button>
        <button
          className={styles.iconButton}
          aria-label="Cancelar espessura"
          title="Cancelar espessura"
          data-tooltip="Cancelar espessura"
          disabled={disabled}
          onClick={() => setText(display(slab.thickness))}
        >
          <Icon name="close" />
        </button>
      </div>
      <label className={styles.field}>
        Selecionar elemento da laje
        <select
          aria-label="Selecionar elemento da laje"
          disabled={busy}
          value={selected === slab.id ? slab.id : (opening?.id ?? "")}
          onChange={(e) => {
            useStore
              .getState()
              .inspect({ slabDraft: null, slabEditing: false });
            useStore.getState().choose(e.target.value);
          }}
        >
          <option value={slab.id}>Laje · {doc.model.floors[0].name}</option>
          {slab.openings.map((o, i) => (
            <option key={o.id} value={o.id}>
              Abertura {i + 1} · Laje
            </option>
          ))}
        </select>
      </label>
      <div className={styles.slabActions}>
        <button
          className={styles.iconButton}
          aria-label="Adicionar abertura"
          title="Adicionar abertura"
          data-tooltip="Adicionar abertura"
          disabled={disabled}
          onClick={() => draw(crypto.randomUUID())}
        >
          <Icon name="plus" />
        </button>
        <button
          className={styles.iconButton}
          aria-label="Redesenhar contorno"
          title="Redesenhar contorno"
          data-tooltip="Redesenhar contorno"
          disabled={disabled}
          onClick={() => draw(opening?.id)}
        >
          <Icon name="redraw" />
        </button>
        <button
          className={styles.iconButton}
          aria-label={opening ? "Excluir abertura" : "Excluir laje"}
          title={opening ? "Excluir abertura" : "Excluir laje"}
          data-tooltip={opening ? "Excluir abertura" : "Excluir laje"}
          disabled={disabled}
          onClick={deleteSlabSelection}
        >
          <Icon name="delete" />
        </button>
      </div>
      <p className={styles.muted}>
        Arraste o corpo para mover. As alças deslocam arestas perpendicularmente
        na malha. Para acrescentar ou retirar cantos, redesenhe o contorno.
      </p>
    </aside>
  );
}

type Camera = { x: number; y: number; scale: number };
type Hit = { id: string; label: string; slab?: Slab; openingId?: string };
type Drag = {
  slab: Slab;
  openingId?: string;
  edge?: number;
  start: Point;
  choices: Hit[];
};
export function useSlabCanvas(
  doc: LocalProject,
  tool: Tool,
  setTool: (t: Tool) => void,
  camera: Camera,
) {
  const mode = useStore((s) => s.mode),
    draft = useStore((s) => s.slabDraft),
    selected = useStore((s) => s.select),
    editing = useStore((s) => s.slabEditing);
  const slab = doc.model.slabs[0],
    module = doc.project.base.width,
    level = doc.model.floors[0].level;
  const [cursor, setCursor] = useState<Point | null>(null),
    [preview, setPreview] = useState<Slab | null>(null),
    [error, setError] = useState(""),
    [choices, setChoices] = useState<Hit[]>([]);
  const drag = useRef<Drag | null>(null),
    wallPress = useRef<{
      start: Point;
      choices: Hit[];
      selectedId: string;
    } | null>(null);
  const cancel = () => {
    drag.current = null;
    wallPress.current = null;
    setPreview(null);
    setCursor(null);
    setError("");
    setChoices([]);
    useStore.getState().inspect({ slabDraft: null, slabEditing: false });
  };
  useEffect(() => {
    const request = useStore.getState().slabDraft;
    if (!request || request.tool !== tool || mode !== "plan") cancel();
    if (
      tool === "slab" &&
      mode === "plan" &&
      !doc.model.slabs.length &&
      !request &&
      !useStore.getState().readonly
    )
      useStore
        .getState()
        .inspect({ slabDraft: startDraft(), slabEditing: true });
    // Context changes discard all unconfirmed slab input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, mode, doc.viewFloorId]);
  useEffect(() => {
    if (!editing) {
      drag.current = null;
      setPreview(null);
      setCursor(null);
      setError("");
    }
  }, [editing]);
  useEffect(() => {
    setChoices([]);
  }, [doc, selected]);
  useEffect(() => {
    const blur = () => cancel();
    const outside = (e: MouseEvent) => {
      if (
        (drag.current || wallPress.current) &&
        !(e.target as HTMLElement).closest('[data-testid="drawing"]')
      )
        cancel();
    };
    const escape = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        !(e.target as HTMLElement).closest("input,textarea,select")
      )
        cancel();
    };
    window.addEventListener("blur", blur);
    window.addEventListener("pointercancel", blur);
    window.addEventListener("mouseup", outside);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("blur", blur);
      window.removeEventListener("pointercancel", blur);
      window.removeEventListener("mouseup", outside);
      window.removeEventListener("keydown", escape);
    };
  });
  function candidate() {
    if (!draft) return null;
    const original = doc.model.slabs.find((s) => s.id === draft.slabId);
    if (draft.slabId && !original) return null;
    if (original)
      return draft.openingId
        ? {
            ...original,
            openings: original.openings.some((o) => o.id === draft.openingId)
              ? original.openings.map((o) =>
                  o.id === draft.openingId
                    ? { ...o, contour: draft.points }
                    : o,
                )
              : [
                  ...original.openings,
                  { id: draft.openingId, contour: draft.points },
                ],
          }
        : { ...original, contour: draft.points };
    let thickness = 0;
    try {
      thickness = cm(draft.thickness);
    } catch {
      /* shown by validation */
    }
    return {
      id: "draft",
      floorId: doc.viewFloorId,
      thickness,
      contour: draft.points,
      openings: [],
    } satisfies Slab;
  }
  const review = candidate();
  const issue = draft?.closed && review ? slabIssue(review, module, level) : "";
  function close() {
    if (!draft) return;
    try {
      validateRing(draft.points, module);
      useStore.getState().inspect({ slabDraft: { ...draft, closed: true } });
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const screen = (p: Point) => ({
    x: p.x * camera.scale + camera.x,
    y: p.y * camera.scale + camera.y,
  });
  const linePoints = (points: Point[]) =>
    points.flatMap((p) => {
      const q = screen(p);
      return [q.x, q.y];
    });
  function projected(p: Point) {
    const q = snapPoint(p, module),
      last = draft?.points.at(-1);
    if (last) {
      if (Math.abs(q.x - last.x) >= Math.abs(q.y - last.y)) q.y = last.y;
      else q.x = last.x;
    }
    return q;
  }
  function hits(p: Point): Hit[] {
    const tolerance = 5 / camera.scale;
    const near = (points: Point[]) =>
      ringEdges(points).some(
        ([a, b]) =>
          onSegment(
            {
              x: Math.max(
                Math.min(a.x, b.x),
                Math.min(Math.max(a.x, b.x), p.x),
              ),
              y: Math.max(
                Math.min(a.y, b.y),
                Math.min(Math.max(a.y, b.y), p.y),
              ),
            },
            a,
            b,
          ) &&
          Math.hypot(
            p.x -
              Math.max(Math.min(a.x, b.x), Math.min(Math.max(a.x, b.x), p.x)),
            p.y -
              Math.max(Math.min(a.y, b.y), Math.min(Math.max(a.y, b.y), p.y)),
          ) <= tolerance,
      );
    const result: Hit[] = [];
    if (slab) {
      for (const [i, o] of slab.openings.entries())
        if (ringLocation(p, o.contour) >= 0 || near(o.contour))
          result.push({
            id: o.id,
            label: `Abertura ${i + 1} · Laje · ${doc.model.floors[0].name}`,
            slab,
            openingId: o.id,
          });
      if (
        near(slab.contour) ||
        (ringLocation(p, slab.contour) === 1 &&
          slab.openings.every((o) => ringLocation(p, o.contour) === -1))
      )
        result.push({
          id: slab.id,
          label: `Laje · ${doc.model.floors[0].name}`,
          slab,
        });
    }
    if (!result.length) return [];
    const walls = hitWalls(doc.model.walls, p, module, 3 / camera.scale).sort(
      (a, b) => a.id.localeCompare(b.id),
    );
    const openings = doc.model.openings
      .filter((o) => {
        const w = doc.model.walls.find((w) => w.id === o.wallId)!;
        const b = openingBox(o, w, module);
        return (
          p.x >= b.x - tolerance &&
          p.x <= b.x + b.width + tolerance &&
          p.y >= b.y - tolerance &&
          p.y <= b.y + b.height + tolerance
        );
      })
      .sort((a, b) => a.id.localeCompare(b.id));
    return [
      ...openings.map((o) => ({
        id: o.id,
        label: `${openingLabel[o.kind]} · Parede ${doc.model.walls.findIndex((w) => w.id === o.wallId) + 1} · base ${display(o.base)} / topo ${display(o.base + o.height)} cm`,
      })),
      ...walls.map((w) => ({
        id: w.id,
        label: `Parede ${doc.model.walls.indexOf(w) + 1}`,
      })),
      ...result.sort(
        (a, b) =>
          Number(!a.openingId) - Number(!b.openingId) ||
          a.id.localeCompare(b.id),
      ),
    ];
  }
  function clickCandidates(all: Hit[]) {
    const openings = all.filter((h) =>
      doc.model.openings.some((o) => o.id === h.id),
    );
    if (openings.length) return openings;
    const walls = all.filter((h) => !h.slab);
    if (walls.length) return walls;
    const slabOpenings = all.filter((h) => h.openingId);
    return slabOpenings.length ? slabOpenings : all;
  }
  function selectClick(all: Hit[]) {
    const candidates = clickCandidates(all);
    if (candidates.length > 1) setChoices(candidates);
    else if (candidates.length) useStore.getState().choose(candidates[0].id);
  }
  function down(p: Point) {
    if (mode !== "plan" || useStore.getState().readonly) return false;
    if (draft) {
      if (draft.closed) return true;
      const clicked = snapPoint(p, module);
      if (
        draft.points.length &&
        clicked.x === draft.points[0].x &&
        clicked.y === draft.points[0].y &&
        Math.hypot(p.x - draft.points[0].x, p.y - draft.points[0].y) *
          camera.scale <=
          9
      ) {
        close();
        return true;
      }
      const points = [...draft.points, projected(p)];
      try {
        validateRing(points, module, false);
        useStore.getState().inspect({ slabDraft: { ...draft, points } });
        setError("");
      } catch (e) {
        setError((e as Error).message);
      }
      return true;
    }
    if (tool === "slab") {
      if (!slab)
        useStore.getState().inspect({
          slabDraft: { ...startDraft(), points: [snapPoint(p, module)] },
          slabEditing: true,
        });
      return true;
    }
    const opening = slab?.openings.find((o) => o.id === selected),
      contour =
        opening?.contour ?? (slab?.id === selected ? slab.contour : null);
    if (slab && contour) {
      const edge = ringEdges(contour).findIndex(
        ([a, b]) =>
          Math.hypot(p.x - (a.x + b.x) / 2, p.y - (a.y + b.y) / 2) *
            camera.scale <=
          8,
      );
      if (edge >= 0) {
        drag.current = {
          slab,
          openingId: opening?.id,
          edge,
          start: p,
          choices: [],
        };
        setPreview(slab);
        useStore.getState().inspect({ slabEditing: true });
        return true;
      }
    }
    if (tool !== "select") return false;
    // Existing wall/opening handles retain priority over overlapping slab bodies.
    const wall = doc.model.walls.find((w) => w.id === selected);
    if (
      wall &&
      [wall.a, wall.b].some(
        (q) => Math.hypot(q.x - p.x, q.y - p.y) * camera.scale < 11,
      )
    )
      return false;
    const selectedOpening = doc.model.openings.find((o) => o.id === selected);
    if (selectedOpening) {
      const w = doc.model.walls.find((w) => w.id === selectedOpening.wallId)!;
      const b = openingBox(selectedOpening, w, module);
      const ends =
        w.a.y === w.b.y
          ? [
              { x: b.x, y: b.y + module / 2 },
              { x: b.x + b.width, y: b.y + module / 2 },
            ]
          : [
              { x: b.x + module / 2, y: b.y },
              { x: b.x + module / 2, y: b.y + b.height },
            ];
      if (ends.some((q) => Math.hypot(q.x - p.x, q.y - p.y) * camera.scale < 9))
        return false;
    }
    const all = hits(p);
    setChoices([]);
    if (!all.length) return false;
    const chosen = all.find((h) => h.id === selected);
    if (chosen?.slab) {
      drag.current = {
        slab: chosen.slab,
        openingId: chosen.openingId,
        start: p,
        choices: all,
      };
      useStore.getState().inspect({ slabEditing: true });
      return true;
    }
    if (chosen) {
      wallPress.current = { start: p, choices: all, selectedId: chosen.id };
      return false;
    }
    // Delegate wall/opening gestures to the existing editor when no target was selected.
    if (clickCandidates(all).some((h) => !h.slab)) return false;
    selectClick(all);
    return true;
  }
  function dragCandidate(p: Point, g: Drag) {
    const delta = snapPoint({ x: p.x - g.start.x, y: p.y - g.start.y }, module);
    return g.edge === undefined
      ? translateSlab(g.slab, delta, g.openingId)
      : shiftSlabEdge(g.slab, g.edge, delta, g.openingId);
  }
  function move(p: Point) {
    if (draft) {
      setCursor(projected(p));
      return true;
    }
    if (drag.current) {
      try {
        const next = dragCandidate(p, drag.current);
        setPreview(next);
        setError(slabIssue(next, module, level));
      } catch (e) {
        setPreview(drag.current.slab);
        setError((e as Error).message);
      }
      return true;
    }
    return false;
  }
  function up(p: Point) {
    if (wallPress.current) {
      const press = wallPress.current;
      wallPress.current = null;
      if (
        Math.hypot(p.x - press.start.x, p.y - press.start.y) * camera.scale <
        3
      ) {
        selectClick(press.choices);
        return true;
      }
      return false;
    }
    const g = drag.current;
    if (!g) return !!draft;
    drag.current = null;
    setPreview(null);
    useStore.getState().inspect({ slabEditing: false });
    if (
      g.edge === undefined &&
      Math.hypot(p.x - g.start.x, p.y - g.start.y) * camera.scale < 3
    ) {
      selectClick(g.choices);
      return true;
    }
    try {
      const next = dragCandidate(p, g),
        problem = slabIssue(next, module, level);
      if (problem) throw new Error(problem);
      setError("");
      void useStore.getState().commit(putSlab(doc, next), "slab");
    } catch (e) {
      setError((e as Error).message);
      useStore.getState().notify((e as Error).message);
    }
    return true;
  }
  function paint(s: Slab, color: string, fill: boolean) {
    return (
      <Shape
        key={s.id}
        sceneFunc={(ctx) => {
          ctx.beginPath();
          for (const ring of [s.contour, ...s.openings.map((o) => o.contour)]) {
            ring.forEach((p, i) => {
              const q = screen(p);
              if (i) ctx.lineTo(q.x, q.y);
              else ctx.moveTo(q.x, q.y);
            });
            ctx.closePath();
          }
          const native = ctx._context;
          native.fillStyle = "rgba(115,145,145,0.17)";
          if (fill) native.fill("evenodd");
          native.strokeStyle = color;
          native.lineWidth = 1.5;
          native.stroke();
        }}
      />
    );
  }
  const chosenOpening = slab?.openings.find((o) => o.id === selected);
  const selectedContour =
    chosenOpening?.contour ?? (slab?.id === selected ? slab.contour : null);
  const currentContour = preview
    ? chosenOpening
      ? preview.openings.find((o) => o.id === chosenOpening.id)?.contour
      : preview.contour
    : selectedContour;
  const shownSlab =
    preview && !error
      ? preview
      : draft?.closed && review && !issue
        ? review
        : slab;
  return {
    bodyTarget: () => wallPress.current?.selectedId,
    down,
    move,
    up,
    cancel,
    before:
      mode === "plan" && shownSlab ? (
        <Layer listening={false}>{paint(shownSlab, "#809291", true)}</Layer>
      ) : null,
    after:
      mode === "plan" && (selectedContour || preview || draft) ? (
        <Layer listening={false}>
          {selectedContour && (
            <Line
              points={linePoints(selectedContour)}
              closed
              stroke="#245d49"
              strokeWidth={2}
            />
          )}
          {currentContour &&
            !draft &&
            ringEdges(currentContour).map(([a, b], i) => {
              const q = screen({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
              return (
                <Rect
                  key={i}
                  x={q.x - 4}
                  y={q.y - 4}
                  width={8}
                  height={8}
                  fill="white"
                  stroke="#245d49"
                />
              );
            })}
          {preview && paint(preview, error ? "#b03a32" : "#245d49", false)}
          {draft && (
            <>
              {review && draft.closed ? (
                paint(review, issue ? "#b03a32" : "#245d49", false)
              ) : (
                <Line
                  points={linePoints(
                    cursor ? [...draft.points, cursor] : draft.points,
                  )}
                  stroke={error ? "#b03a32" : "#245d49"}
                  strokeWidth={2}
                  dash={[6, 4]}
                />
              )}
              {draft.points.map((p, i) => {
                const q = screen(p);
                return (
                  <Circle
                    key={i}
                    x={q.x}
                    y={q.y}
                    radius={i === 0 ? 5 : 3}
                    fill={i === 0 ? "#245d49" : "white"}
                    stroke="#245d49"
                  />
                );
              })}
            </>
          )}
          {drag.current?.edge !== undefined && currentContour && (
            <Text
              x={12}
              y={55}
              text={`Aresta ${drag.current.edge + 1} · ${display(Math.abs(currentContour[drag.current.edge].x - currentContour[(drag.current.edge + 1) % currentContour.length].x) + Math.abs(currentContour[drag.current.edge].y - currentContour[(drag.current.edge + 1) % currentContour.length].y))} cm · Δ ${display(currentContour[drag.current.edge].x - selectedContour![drag.current.edge].x || currentContour[drag.current.edge].y - selectedContour![drag.current.edge].y)} cm`}
              fill="#245d49"
            />
          )}
        </Layer>
      ) : null,
    controls:
      mode === "plan" ? (
        <>
          {choices.length > 1 && (
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
          )}
          {draft && (
            <div className={styles.slabDraft} aria-label="Desenho de laje">
              <strong>
                {draft.openingId ? "Contorno da abertura" : "Contorno da laje"}
              </strong>
              <span>
                {draft.closed
                  ? "Confira a prévia antes de confirmar."
                  : "Clique nos vértices da malha. Feche pelo primeiro ponto ou pelo botão."}
              </span>
              {!draft.slabId && (
                <label>
                  Espessura (cm)
                  <input
                    aria-label="Espessura inicial da laje (cm)"
                    value={draft.thickness}
                    onChange={(e) =>
                      useStore.getState().inspect({
                        slabDraft: { ...draft, thickness: e.target.value },
                      })
                    }
                  />
                </label>
              )}
              <div className={styles.slabActions}>
                {draft.closed ? (
                  <>
                    <button
                      disabled={!review || !!issue || useStore.getState().busy}
                      onClick={() => {
                        if (!review) return;
                        const next = {
                          ...review,
                          id:
                            review.id === "draft"
                              ? crypto.randomUUID()
                              : review.id,
                        };
                        void useStore
                          .getState()
                          .commit(putSlab(doc, next), "slab")
                          .then(() => {
                            if (
                              useStore
                                .getState()
                                .doc?.model.slabs.some((s) => s.id === next.id)
                            ) {
                              cancel();
                              setTool("select");
                              useStore
                                .getState()
                                .choose(draft.openingId ?? next.id);
                            }
                          });
                      }}
                    >
                      Confirmar contorno
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      disabled={!draft.points.length}
                      onClick={() => {
                        useStore.getState().inspect({
                          slabDraft: {
                            ...draft,
                            points: draft.points.slice(0, -1),
                          },
                        });
                        setCursor(null);
                        setError("");
                      }}
                    >
                      Retirar último vértice
                    </button>
                    <button onClick={close}>Fechar contorno</button>
                  </>
                )}
                <button
                  onClick={() => {
                    cancel();
                    setTool("select");
                  }}
                >
                  {draft.closed ? "Cancelar" : "Cancelar contorno"}
                </button>
              </div>
              {(error || issue) && <p role="alert">{error || issue}</p>}
            </div>
          )}
          {error && !draft && (
            <div className={styles.slabError} role="alert">
              {error}
            </div>
          )}
        </>
      ) : null,
  };
}
