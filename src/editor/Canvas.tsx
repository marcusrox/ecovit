import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Rect, Line, Circle, Text, Shape } from "react-konva";
import {
  bounds,
  connection,
  display,
  hitWalls,
  length,
  resizeWall,
  snapPoint,
  type Point,
  type Wall,
  type Opening,
  type Tool,
} from "../domain/project";
import {
  openingBox,
  openingIssue,
  openingLabel,
  openingOffset,
  putOpening,
} from "../domain/openings";
import {
  createContinuation,
  moveWall,
  type WallEdit,
} from "../domain/wall-editing";
import {
  cursorCell,
  openingCell,
  openingDrawRange,
  wallDraw,
} from "../domain/drawing";
import { useStore, useEditingProject } from "../state/store";
import styles from "../ui/App.module.css";
import { Icon } from "../ui/Icon";
import { isChannel } from "../domain/channels";
import {
  activeGrout,
  courseCells,
  groutId,
  toggleGrout,
} from "../domain/grout";
type Camera = { x: number; y: number; scale: number };
type Gesture =
  | { type: "draw"; start: Point; cell: Point }
  | { type: "wall-move"; wall: Wall; start: Point; delta: Point }
  | { type: "resize"; wall: Wall; end: "a" | "b" }
  | {
      type: "opening-draw";
      wall: Wall;
      start: number;
      press: number;
      opening: Opening;
    }
  | { type: "opening-move"; wall: Wall; start: number; opening: Opening }
  | { type: "opening-resize"; wall: Wall; end: "a" | "b"; opening: Opening }
  | { type: "pan"; start: Point; camera: Camera; button: 0 | 1 }
  | { type: "grout"; start: Point; cell: Point & { wallIds: string[] } };
export function Canvas({
  tool,
  setTool,
  side,
  setSide,
}: {
  tool: Tool;
  setTool: (t: Tool) => void;
  side: 1 | -1;
  setSide: (s: 1 | -1) => void;
}) {
  const mode = useStore((s) => s.mode),
    course = useStore((s) => s.course),
    ghost = useStore((s) => s.ghost),
    compositionPreview = useStore((s) => s.preview),
    selectedComponent = useStore((s) => s.component),
    focus = useStore((s) => s.focus);
  const doc = useEditingProject()!,
    selected = useStore((s) => s.select),
    busy = useStore((s) => s.busy),
    readonly = useStore((s) => s.readonly);
  const host = useRef<HTMLDivElement>(null),
    gesture = useRef<Gesture | null>(null),
    space = useRef(false);
  const [size, setSize] = useState({ width: 900, height: 700 }),
    [camera, setCamera] = useState<Camera>({ x: 120, y: 100, scale: 0.012 });
  const [preview, setPreview] = useState<Wall | null>(null),
    [target, setTarget] = useState<Point | null>(null),
    [hover, setHover] = useState<string | null>(null),
    [choices, setChoices] = useState<Wall[]>([]),
    [panning, setPanning] = useState(false);
  const [wallEdit, setWallEdit] = useState<WallEdit | null>(null);
  const [mouseScreen, setMouseScreen] = useState<Point | null>(null);
  const [hostWallId, setHostWallId] = useState<string | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [openingPreview, setOpeningPreview] = useState<Opening | null>(null),
    [openingChoices, setOpeningChoices] = useState<Opening[]>([]);
  const [channelChoices, setChannelChoices] = useState<string[]>([]);
  const selectedBand = useStore((s) => s.channelBand);
  const diagnosticWalls = useStore((s) => s.diagnosticWalls);
  const groutMode = useStore((s) => s.groutMode);
  const selectedGrout = useStore((s) => s.groutCell);
  const [groutHover, setGroutHover] = useState<
    (Point & { wallIds: string[] }) | null
  >(null);
  const module = doc.project.base.width,
    walls = doc.model.walls;
  const output = compositionPreview ?? doc.generated;
  const markers = useMemo(
    () => (output && mode === "course" ? courseCells(doc, output, course) : []),
    [doc, output, mode, course],
  );
  const groutBlocked =
    busy ||
    readonly ||
    !!compositionPreview ||
    doc.generationState.status !== "current";
  const groutHit = (p: Point) =>
    module * camera.scale >= 9
      ? markers.find(
          (c) =>
            Math.hypot(p.x - c.x - module / 2, p.y - c.y - module / 2) *
              camera.scale <=
            Math.min(9, module * camera.scale * 0.4),
        )
      : undefined;
  const groutPresent = (p: Point) => {
    const row = output?.courses[course - 1],
      axis = output?.grouts?.find((a) => groutId(a) === groutId(p));
    return (
      !!row &&
      !!axis &&
      activeGrout(
        axis,
        doc.model.floors[0].level + row.bottom,
        doc.model.floors[0].level + row.top,
      )
    );
  };
  const active =
    mode === "plan" ? walls.find((w) => w.id === selected) : undefined;
  const activeOpening = doc.model.openings.find((o) => o.id === selected);
  const openingHits = (p: Point, onlyCourse = false) =>
    doc.model.openings
      .filter((o) => {
        const w = walls.find((w) => w.id === o.wallId);
        if (!w) return false;
        const b = openingBox(o, w, module),
          t = 3 / camera.scale,
          f = doc.model.floors[0],
          h = doc.project.base.height;
        return (
          p.x >= b.x - t &&
          p.x <= b.x + b.width + t &&
          p.y >= b.y - t &&
          p.y <= b.y + b.height + t &&
          (!onlyCourse ||
            (f.level + (course - 1) * h < f.level + o.base + o.height &&
              f.level + course * h > f.level + o.base))
        );
      })
      .reverse();
  const cancel = () => {
    gesture.current = null;
    setPreview(null);
    setWallEdit(null);
    setTarget(null);
    setPanning(false);
    setOpeningPreview(null);
    setGroutHover(null);
  };
  useEffect(() => {
    cancel();
    setHover(null);
    setChoices([]);
    setOpeningChoices([]);
    setHostWallId(null);
    setChannelChoices([]);
  }, [doc.viewFloorId]);
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ width: r.width, height: r.height });
    });
    if (host.current) observer.observe(host.current);
    const blur = () => {
      space.current = false;
      setSpaceHeld(false);
      setMouseScreen(null);
      cancel();
    };
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select, button"))
        return;
      if (e.code === "Space") {
        e.preventDefault();
        space.current = true;
        setSpaceHeld(true);
      }
      if (e.key === "Escape") {
        cancel();
        setChoices([]);
        setOpeningChoices([]);
        useStore
          .getState()
          .inspect({ pendingOpening: null, groutMode: false, groutCell: null });
        setTool("select");
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        space.current = false;
        setSpaceHeld(false);
        if (gesture.current?.type === "pan" && gesture.current.button === 0)
          cancel();
      }
    };
    const outside = (e: MouseEvent) => {
      const g = gesture.current;
      if (
        g &&
        e.button === (g.type === "pan" ? g.button : 0) &&
        (g.type === "pan" || !host.current?.contains(e.target as Node))
      )
        cancel();
    };
    const pan = (e: MouseEvent) => {
      const g = gesture.current,
        rect = host.current?.getBoundingClientRect();
      if (g?.type !== "pan" || !rect) return;
      if (!(e.buttons & (g.button === 1 ? 4 : 1))) {
        cancel();
        return;
      }
      setCamera({
        ...g.camera,
        x: g.camera.x + e.clientX - rect.left - g.start.x,
        y: g.camera.y + e.clientY - rect.top - g.start.y,
      });
    };
    window.addEventListener("blur", blur);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("mouseup", outside);
    window.addEventListener("mousemove", pan);
    return () => {
      observer.disconnect();
      window.removeEventListener("blur", blur);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mouseup", outside);
      window.removeEventListener("mousemove", pan);
    };
  }, [setTool]);
  useEffect(() => {
    if (preview && gesture.current?.type === "draw")
      setPreview((p) => (p ? { ...p, side } : null));
  }, [side]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (focus)
      setCamera((c) => ({
        ...c,
        x: size.width / 2 - focus.x * c.scale,
        y: size.height / 2 - focus.y * c.scale,
      }));
  }, [focus, size.width, size.height]);
  useEffect(() => {
    cancel();
    setChoices([]);
    setOpeningChoices([]);
    setChannelChoices([]);
    useStore.getState().inspect({ pendingOpening: null });
  }, [mode]);
  useEffect(() => {
    cancel();
    setHostWallId(null);
  }, [tool]);
  useEffect(() => {
    cancel();
  }, [course, groutMode]);
  const world = (p: Point) => ({
    x: (p.x - camera.x) / camera.scale,
    y: (p.y - camera.y) / camera.scale,
  });
  const pointer = (clientX: number, clientY: number) => {
    const r = host.current!.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };
  const endpoint = (p: Point, exclude?: string) =>
    connection(
      p,
      walls.filter((w) => w.id !== exclude),
      module,
      10 / camera.scale,
    );
  const update = (screen: Point) => {
    const p = world(screen),
      g = gesture.current;
    if (g?.type === "pan" || g?.type === "grout") return;
    if (mode === "course" && groutMode) {
      setGroutHover(groutBlocked ? null : (groutHit(p) ?? null));
      return;
    }
    if (g?.type === "wall-move") {
      const delta = snapPoint(
        { x: p.x - g.start.x, y: p.y - g.start.y },
        module,
      );
      g.delta = delta;
      try {
        const planned = moveWall(doc, g.wall.id, delta, false);
        setWallEdit(planned);
        setPreview(
          planned.doc.model.walls.find((w) => w.id === planned.selectedId) ??
            null,
        );
      } catch (err) {
        setWallEdit(null);
        setPreview(null);
        useStore.getState().notify((err as Error).message);
      }
      setTarget(null);
      return;
    }
    if (g?.type.startsWith("opening-")) {
      const og = g as Extract<
        Gesture,
        { type: "opening-draw" | "opening-move" | "opening-resize" }
      >;
      const position = Math.round(openingOffset(og.wall, p) / module) * module;
      const next = { ...og.opening };
      if (og.type === "opening-draw") {
        const rawPosition = openingOffset(og.wall, p),
          delta = rawPosition - og.press;
        if (Math.abs(delta) * camera.scale < 3) next.width = 0;
        else
          Object.assign(
            next,
            openingDrawRange(og.start, rawPosition, module, delta > 0),
          );
      } else if (og.type === "opening-move")
        next.offset = og.opening.offset + position - og.start;
      else if (og.end === "a") {
        next.offset = position;
        next.width = og.opening.offset + og.opening.width - position;
      } else next.width = position - og.opening.offset;
      setOpeningPreview(next);
      setTarget(null);
      return;
    }
    const connected = endpoint(p, g?.type === "resize" ? g.wall.id : undefined);
    setTarget(g ? connected : null);
    if (g?.type === "draw") {
      const next =
        Math.hypot(p.x - g.start.x, p.y - g.start.y) * camera.scale < 3
          ? null
          : wallDraw(
              g.cell,
              g.start,
              p,
              module,
              doc.model.floors[0].id,
              doc.model.floors[0].defaultHeight,
              side,
              connected,
            );
      try {
        const planned = next ? createContinuation(doc, next, false) : null;
        setWallEdit(planned);
        setPreview(
          planned?.doc.model.walls.find((w) => w.id === planned.selectedId) ??
            null,
        );
      } catch (err) {
        setWallEdit(null);
        setPreview(null);
        useStore.getState().notify((err as Error).message);
      }
      if (
        connected &&
        (!next || next.b.x !== connected.x || next.b.y !== connected.y)
      )
        setTarget(null);
    } else if (g?.type === "resize") {
      try {
        const next = resizeWall(g.wall, g.end, connected ?? p, module);
        setPreview(next);
        if (
          connected &&
          (next[g.end].x !== connected.x || next[g.end].y !== connected.y)
        )
          setTarget(null);
      } catch {
        setPreview(null);
      }
    } else
      setHover(hitWalls(walls, p, module, 3 / camera.scale)[0]?.id ?? null);
  };
  const zoom = (
    factor: number,
    point = { x: size.width / 2, y: size.height / 2 },
  ) => {
    const w = world(point),
      scale = Math.max(0.0015, Math.min(0.12, camera.scale * factor));
    setCamera({ scale, x: point.x - w.x * scale, y: point.y - w.y * scale });
  };
  const fit = () => {
    if (!walls.length) {
      setCamera({ x: 120, y: 100, scale: 0.012 });
      return;
    }
    const boxes = walls.map((w) => bounds(w, module)),
      minX = Math.min(...boxes.map((b) => b.x)),
      minY = Math.min(...boxes.map((b) => b.y)),
      maxX = Math.max(...boxes.map((b) => b.x + b.width)),
      maxY = Math.max(...boxes.map((b) => b.y + b.height));
    const scale = Math.max(
      0.0015,
      Math.min(
        0.06,
        (size.width - 160) / (maxX - minX),
        (size.height - 160) / (maxY - minY),
      ),
    );
    setCamera({
      scale,
      x: (size.width - (maxX + minX) * scale) / 2,
      y: (size.height - (maxY + minY) * scale) / 2,
    });
  };
  const grid: React.ReactNode[] = [];
  const step = module * Math.max(1, Math.ceil(9 / (module * camera.scale)));
  for (
    let x = Math.floor(-camera.x / camera.scale / step) * step;
    x < (size.width - camera.x) / camera.scale;
    x += step
  )
    grid.push(
      <Line
        key={`x${x}`}
        points={[
          x * camera.scale + camera.x,
          0,
          x * camera.scale + camera.x,
          size.height,
        ]}
        stroke={x === 0 ? "#c3cec5" : "#e6eae3"}
        strokeWidth={1}
        listening={false}
      />,
    );
  for (
    let y = Math.floor(-camera.y / camera.scale / step) * step;
    y < (size.height - camera.y) / camera.scale;
    y += step
  )
    grid.push(
      <Line
        key={`y${y}`}
        points={[
          0,
          y * camera.scale + camera.y,
          size.width,
          y * camera.scale + camera.y,
        ]}
        stroke={y === 0 ? "#c3cec5" : "#e6eae3"}
        strokeWidth={1}
        listening={false}
      />,
    );
  const renderDoc = wallEdit?.doc ?? doc;
  const rendered = renderDoc.model.walls.map((w) =>
    preview?.id === w.id ? preview : w,
  );
  const showModule =
    mode === "plan" &&
    tool !== "select" &&
    !busy &&
    !readonly &&
    !panning &&
    !spaceHeld &&
    !gesture.current &&
    mouseScreen;
  let moduleHover: (Point & { anchor: Point }) | null = null;
  if (showModule) {
    const p = world(mouseScreen);
    if (tool === "wall") {
      const cell = cursorCell(p, module);
      moduleHover = { ...cell, anchor: cell };
    } else {
      const hits = hitWalls(walls, p, module, 3 / camera.scale);
      const w =
        hits.find((w) => w.id === hostWallId) ??
        (hits.length === 1 ? hits[0] : undefined);
      if (w) {
        const selected = openingCell(w, p, module);
        if (selected) moduleHover = { ...selected.cell, anchor: selected.cell };
      }
    }
  }
  return (
    <div className={styles.canvasWrap}>
      <div
        ref={host}
        className={styles.canvas}
        data-testid="drawing"
        data-camera={JSON.stringify(camera)}
        data-module={module}
        data-module-hover={moduleHover ? JSON.stringify(moduleHover) : ""}
        data-wall-preview={
          wallEdit
            ? JSON.stringify({
                id: wallEdit.selectedId,
                participants: wallEdit.participants,
                message: wallEdit.message,
              })
            : ""
        }
        style={{
          cursor: panning
            ? "grabbing"
            : tool !== "select"
              ? "crosshair"
              : "default",
        }}
        onMouseDown={(e) => {
          if (e.button === 1) e.preventDefault();
          if (
            (e.button !== 0 && e.button !== 1) ||
            gesture.current ||
            busy ||
            (e.target as HTMLElement).closest("button")
          )
            return;
          const screen = pointer(e.clientX, e.clientY),
            p = world(screen);
          setChoices([]);
          setOpeningChoices([]);
          setChannelChoices([]);
          if (e.button === 1 || space.current) {
            e.preventDefault();
            gesture.current = {
              type: "pan",
              start: screen,
              camera,
              button: e.button as 0 | 1,
            };
            setPanning(true);
            return;
          }
          if (mode === "course") {
            if (groutMode) {
              if (!groutBlocked) {
                const cell = groutHit(p);
                if (cell) {
                  gesture.current = { type: "grout", start: screen, cell };
                  useStore
                    .getState()
                    .inspect({ groutCell: cell, channelBand: null });
                }
              }
              return;
            }
            const hits = openingHits(p, true);
            if (hits.length) {
              useStore.getState().choose(hits[0].id);
              if (hits.length > 1) setOpeningChoices(hits);
              return;
            }
            useStore.getState().choose(null);
            const output = compositionPreview ?? doc.generated;
            const piece = output?.courses[course - 1]?.pieces.find(
              (b) =>
                p.x >= b.x &&
                p.x < b.x + b.width &&
                p.y >= b.y &&
                p.y < b.y + b.height,
            );
            const comp = output?.components.find((c) =>
              piece?.wallIds.some((id) => c.wallIds.includes(id)),
            );
            const bands =
              piece && isChannel(piece)
                ? (output?.channels?.filter(
                    (b) =>
                      b.course === course &&
                      b.cells.some(
                        (c) =>
                          p.x >= c.x &&
                          p.x < c.x + module &&
                          p.y >= c.y &&
                          p.y < c.y + module,
                      ),
                  ) ?? [])
                : [];
            if (bands.length > 1) setChannelChoices(bands.map((b) => b.id));
            useStore.getState().inspect({
              component: comp?.id ?? null,
              channelBand: bands[0]?.id ?? null,
              preview: null,
            });
            return;
          }
          if (readonly) return;
          useStore.getState().inspect({ pendingOpening: null });
          if (activeOpening && tool === "select") {
            const w = walls.find((w) => w.id === activeOpening.wallId)!,
              b = openingBox(activeOpening, w, module);
            const points =
              w.a.y === w.b.y
                ? [
                    { x: b.x, y: b.y + module / 2 },
                    { x: b.x + b.width, y: b.y + module / 2 },
                  ]
                : [
                    { x: b.x + module / 2, y: b.y },
                    { x: b.x + module / 2, y: b.y + b.height },
                  ];
            for (let i = 0; i < 2; i++)
              if (
                Math.hypot(points[i].x - p.x, points[i].y - p.y) *
                  camera.scale <
                9
              ) {
                gesture.current = {
                  type: "opening-resize",
                  wall: w,
                  end: i === 0 ? "a" : "b",
                  opening: activeOpening,
                };
                setOpeningPreview(activeOpening);
                return;
              }
          }
          if (tool !== "wall" && tool !== "select") {
            const hits = hitWalls(walls, p, module, 3 / camera.scale);
            const w =
              hits.find((w) => w.id === hostWallId) ??
              (hits.length === 1 ? hits[0] : undefined);
            if (hits.length > 1 && !w) {
              setChoices(hits);
              return;
            }
            if (!w) {
              useStore
                .getState()
                .notify("Arraste sobre uma parede para inserir o vão.");
              return;
            }
            const selectedCell = openingCell(w, p, module);
            if (!selectedCell) return;
            const offset = selectedCell.offset,
              base = tool === "door" ? 0 : doc.project.openingSettings.base;
            const opening: Opening = {
              id: crypto.randomUUID(),
              wallId: w.id,
              kind: tool,
              offset,
              width: 0,
              base,
              height: doc.project.openingSettings.top - base,
            };
            gesture.current = {
              type: "opening-draw",
              wall: w,
              start: offset,
              press: openingOffset(w, p),
              opening,
            };
            setOpeningPreview(opening);
            return;
          }
          if (active)
            for (const end of ["a", "b"] as const) {
              if (
                Math.hypot(active[end].x - p.x, active[end].y - p.y) *
                  camera.scale <
                11
              ) {
                gesture.current = { type: "resize", wall: active, end };
                setPreview(active);
                return;
              }
            }
          if (tool === "wall") {
            gesture.current = {
              type: "draw",
              start: p,
              cell: cursorCell(p, module),
            };
            return;
          }
          const hits = hitWalls(walls, p, module, 3 / camera.scale);
          const openings = openingHits(p);
          if (openings.length) {
            useStore.getState().choose(openings[0].id);
            if (openings.length > 1) setOpeningChoices(openings);
            else {
              const o = openings[0],
                w = walls.find((w) => w.id === o.wallId)!;
              gesture.current = {
                type: "opening-move",
                wall: w,
                start: Math.round(openingOffset(w, p) / module) * module,
                opening: o,
              };
              setOpeningPreview(o);
            }
            return;
          }
          const chosen = hits.find((w) => w.id === hostWallId);
          useStore.getState().choose(chosen?.id ?? hits[0]?.id ?? null);
          if (hits.length > 1 && !chosen) setChoices(hits);
          else if (chosen ?? hits[0]) {
            const wall = chosen ?? hits[0];
            gesture.current = {
              type: "wall-move",
              wall,
              start: p,
              delta: { x: 0, y: 0 },
            };
          }
        }}
        onAuxClick={(e) => {
          if (e.button === 1) e.preventDefault();
        }}
        onMouseMove={(e) => {
          setMouseScreen(pointer(e.clientX, e.clientY));
          if (gesture.current?.type !== "pan")
            update(pointer(e.clientX, e.clientY));
        }}
        onMouseUp={(e) => {
          const g = gesture.current;
          if (e.button !== (g?.type === "pan" ? g.button : 0)) return;
          if (g && g.type !== "pan" && !busy && !readonly) {
            if (g.type === "grout") {
              const screen = pointer(e.clientX, e.clientY);
              if (
                !groutBlocked &&
                Math.hypot(screen.x - g.start.x, screen.y - g.start.y) <= 6 &&
                groutHit(world(screen)) &&
                groutId(groutHit(world(screen))!) === groutId(g.cell)
              ) {
                try {
                  void useStore
                    .getState()
                    .commit(toggleGrout(doc, g.cell, groutPresent(g.cell)));
                } catch (err) {
                  useStore.getState().notify((err as Error).message);
                }
              }
              cancel();
              return;
            }
            if (
              g.type === "opening-draw" ||
              g.type === "opening-move" ||
              g.type === "opening-resize"
            ) {
              if (openingPreview && openingPreview.width >= module) {
                try {
                  const next = putOpening(doc, openingPreview);
                  if (
                    g.type === "opening-draw" ||
                    JSON.stringify(openingPreview) !== JSON.stringify(g.opening)
                  )
                    void useStore.getState().commit(next);
                  useStore.getState().choose(openingPreview.id);
                } catch (err) {
                  const issue = openingIssue(doc, openingPreview);
                  if (
                    g.type === "opening-draw" &&
                    (issue?.code === "opening-off-grid" ||
                      issue?.code === "opening-outside-wall")
                  ) {
                    useStore
                      .getState()
                      .inspect({ pendingOpening: openingPreview });
                    useStore.getState().choose(openingPreview.id);
                  }
                  useStore.getState().notify((err as Error).message);
                }
              } else
                useStore
                  .getState()
                  .notify(
                    "O vão precisa manter ao menos um módulo, sem cruzar a ponta fixa.",
                  );
              cancel();
              return;
            }
            if (g.type === "wall-move" || g.type === "draw") {
              try {
                const next =
                  g.type === "wall-move"
                    ? g.delta.x || g.delta.y
                      ? moveWall(doc, g.wall.id, g.delta)
                      : null
                    : wallEdit && preview
                      ? createContinuation(
                          doc,
                          wallDraw(
                            g.cell,
                            g.start,
                            world(pointer(e.clientX, e.clientY)),
                            module,
                            doc.model.floors[0].id,
                            doc.model.floors[0].defaultHeight,
                            side,
                            endpoint(world(pointer(e.clientX, e.clientY))),
                          )!,
                        )
                      : null;
                if (next) {
                  void useStore
                    .getState()
                    .commit(
                      next.doc,
                      g.type === "draw" ? "create/merge" : "move",
                    )
                    .then(() => {
                      if (
                        useStore
                          .getState()
                          .doc?.model.walls.some(
                            (w) => w.id === next.selectedId,
                          )
                      )
                        useStore.getState().choose(next.selectedId);
                    });
                  if (next.message) useStore.getState().notify(next.message);
                }
              } catch (err) {
                useStore.getState().notify((err as Error).message);
              }
              cancel();
              return;
            }
            if (preview) {
              const newWalls = walls.map((w) =>
                w.id === preview.id ? preview : w,
              );
              void useStore
                .getState()
                .commit({ ...doc, model: { ...doc.model, walls: newWalls } });
              useStore.getState().choose(preview.id);
            } else if (g.type === "resize")
              useStore
                .getState()
                .notify(
                  "A parede precisa manter ao menos um módulo, sem cruzar a ponta fixa.",
                );
          }
          cancel();
        }}
        onMouseLeave={() => {
          setHover(null);
          setMouseScreen(null);
          setGroutHover(null);
          if (!gesture.current) setTarget(null);
        }}
      >
        <Stage
          width={size.width}
          height={size.height}
          onWheel={(e) => {
            e.evt.preventDefault();
            if (!busy && !gesture.current)
              zoom(
                e.evt.deltaY < 0 ? 1.12 : 1 / 1.12,
                pointer(e.evt.clientX, e.evt.clientY),
              );
          }}
        >
          <Layer listening={false}>{grid}</Layer>
          <Layer listening={false}>
            {mode === "plan" &&
              rendered.map((w, i) => {
                const b = bounds(w, module),
                  selectedWall = selected === w.id,
                  draft = preview?.id === w.id;
                return (
                  <Rect
                    key={w.id}
                    x={b.x * camera.scale + camera.x}
                    y={b.y * camera.scale + camera.y}
                    width={b.width * camera.scale}
                    height={b.height * camera.scale}
                    fill={
                      draft
                        ? "#bbd5c9"
                        : selectedWall
                          ? "#759c8b"
                          : hover === w.id
                            ? "#a7bbae"
                            : "#c0c9bc"
                    }
                    stroke={selectedWall || draft ? "#245d49" : "#637969"}
                    strokeWidth={selectedWall ? 2 : 1}
                    opacity={i === rendered.length - 1 && draft ? 0.8 : 1}
                  />
                );
              })}
            {active && !readonly && (
              <>
                <Line
                  points={[
                    active.a.x * camera.scale + camera.x,
                    active.a.y * camera.scale + camera.y,
                    active.b.x * camera.scale + camera.x,
                    active.b.y * camera.scale + camera.y,
                  ]}
                  stroke="#215f4b"
                  dash={[5, 4]}
                />
                {(["a", "b"] as const).map((end) => (
                  <Circle
                    key={end}
                    x={
                      (preview?.id === active.id ? preview : active)[end].x *
                        camera.scale +
                      camera.x
                    }
                    y={
                      (preview?.id === active.id ? preview : active)[end].y *
                        camera.scale +
                      camera.y
                    }
                    radius={6}
                    fill="#ffffff"
                    stroke="#205d48"
                    strokeWidth={2}
                  />
                ))}
                {(["a", "b"] as const).map((end) => (
                  <Text
                    key={`label-${end}`}
                    text={end.toUpperCase()}
                    x={
                      (preview?.id === active.id ? preview : active)[end].x *
                        camera.scale +
                      camera.x +
                      9
                    }
                    y={
                      (preview?.id === active.id ? preview : active)[end].y *
                        camera.scale +
                      camera.y -
                      18
                    }
                    fontSize={11}
                    fill="#205d48"
                  />
                ))}
              </>
            )}
            {mode === "plan" && target && (
              <Circle
                x={target.x * camera.scale + camera.x}
                y={target.y * camera.scale + camera.y}
                radius={9}
                stroke="#bd792c"
                strokeWidth={2}
              />
            )}
            {preview && (
              <Text
                x={Math.min(preview.a.x, preview.b.x) * camera.scale + camera.x}
                y={
                  Math.min(preview.a.y, preview.b.y) * camera.scale +
                  camera.y -
                  26
                }
                text={`${display(length(preview))} cm · face externa${wallEdit?.participants.length ? " · continuidade" : ""}${wallEdit?.message ? ` · ${wallEdit.message}` : ""}`}
                fontSize={13}
                fill="#174332"
              />
            )}
          </Layer>
          <Layer listening={false}>
            {walls
              .filter((w) => diagnosticWalls.includes(w.id))
              .map((w) => {
                const b = bounds(w, module);
                return (
                  <Rect
                    key={`diagnostic-${w.id}`}
                    x={b.x * camera.scale + camera.x}
                    y={b.y * camera.scale + camera.y}
                    width={b.width * camera.scale}
                    height={b.height * camera.scale}
                    stroke="#bd4930"
                    strokeWidth={2}
                    dash={[5, 3]}
                  />
                );
              })}
          </Layer>
          {mode === "course" && (
            <Layer listening={false}>
              <Shape
                sceneFunc={(ctx) => {
                  const output = compositionPreview ?? doc.generated;
                  const axes = new Map(
                    output?.grouts?.map((a) => [groutId(a), a]) ?? [],
                  );
                  const render = (index: number, reference: boolean) => {
                    for (const p of output?.courses[index]?.pieces ?? []) {
                      const x = p.x * camera.scale + camera.x,
                        y = p.y * camera.scale + camera.y,
                        w = p.width * camera.scale,
                        h = p.height * camera.scale;
                      if (
                        x + w < 0 ||
                        y + h < 0 ||
                        x > size.width ||
                        y > size.height
                      )
                        continue;
                      ctx.save();
                      ctx.globalAlpha = reference
                        ? 0.7
                        : doc.generationState.status === "outdated"
                          ? 0.4
                          : 1;
                      ctx.strokeStyle = reference ? "#4880a1" : "#42392f";
                      ctx.lineWidth = reference ? 2 : 1;
                      ctx.setLineDash(reference ? [4, 3] : []);
                      if (!reference) {
                        ctx.fillStyle = isChannel(p)
                          ? p.kind === "channel"
                            ? "#d5b565"
                            : "#b38a37"
                          : p.kind === "whole"
                            ? "#ba906e"
                            : "#895b3f";
                        ctx.fillRect(x, y, w, h);
                      }
                      ctx.strokeRect(x, y, w, h);
                      if (isChannel(p)) {
                        ctx.strokeStyle = reference ? "#4880a1" : "#fff0b9";
                        ctx.lineWidth = Math.max(
                          2,
                          module * camera.scale * 0.24,
                        );
                        ctx.beginPath();
                        if (p.width > p.height) {
                          ctx.moveTo(x + 2, y + h / 2);
                          ctx.lineTo(x + w - 2, y + h / 2);
                        } else if (p.height > p.width) {
                          ctx.moveTo(x + w / 2, y + 2);
                          ctx.lineTo(x + w / 2, y + h - 2);
                        } else {
                          const ws = doc.model.walls.filter(
                            (w) =>
                              p.wallIds.includes(w.id) &&
                              w.height >= course * doc.project.base.height,
                          );
                          if (ws.some((w) => w.a.y === w.b.y)) {
                            ctx.moveTo(x + 2, y + h / 2);
                            ctx.lineTo(x + w - 2, y + h / 2);
                          }
                          if (ws.some((w) => w.a.x === w.b.x)) {
                            ctx.moveTo(x + w / 2, y + 2);
                            ctx.lineTo(x + w / 2, y + h - 2);
                          }
                        }
                        ctx.stroke();
                      }
                      if (module * camera.scale >= 9) {
                        ctx.fillStyle = "#f7eadd";
                        for (let xx = 0; xx < p.width / module; xx++)
                          for (let yy = 0; yy < p.height / module; yy++) {
                            const axis = axes.get(
                                groutId({
                                  x: p.x + xx * module,
                                  y: p.y + yy * module,
                                }),
                              ),
                              row = output!.courses[index];
                            const present =
                              !!axis &&
                              activeGrout(
                                axis,
                                doc.model.floors[0].level + row.bottom,
                                doc.model.floors[0].level + row.top,
                              );
                            if (
                              (reference && !present) ||
                              (isChannel(p) && !groutMode && !present)
                            )
                              continue;
                            ctx.fillStyle = present
                              ? reference
                                ? "#4880a1"
                                : "#302c28"
                              : "#f7eadd";
                            ctx.beginPath();
                            ctx.arc(
                              x + (xx + 0.5) * module * camera.scale,
                              y + (yy + 0.5) * module * camera.scale,
                              module * camera.scale * 0.19,
                              0,
                              Math.PI * 2,
                              false,
                            );
                            ctx.fill();
                          }
                      }
                      ctx.restore();
                    }
                  };
                  render(course - 1, false);
                  if (ghost === "previous" && course > 1)
                    render(course - 2, true);
                  if (ghost === "next") render(course, true);
                }}
              />
              {groutMode &&
                !groutBlocked &&
                (groutHover ?? selectedGrout) &&
                (() => {
                  const c = groutHover ?? selectedGrout!;
                  if (!markers.some((m) => groutId(m) === groutId(c)))
                    return null;
                  return (
                    <>
                      <Circle
                        x={(c.x + module / 2) * camera.scale + camera.x}
                        y={(c.y + module / 2) * camera.scale + camera.y}
                        radius={Math.max(4, module * camera.scale * 0.25)}
                        stroke="#235e49"
                        strokeWidth={2}
                      />
                      {groutHover && (
                        <Text
                          x={(c.x + module / 2) * camera.scale + camera.x + 10}
                          y={(c.y + module / 2) * camera.scale + camera.y - 14}
                          text={groutPresent(c) ? "−" : "+"}
                          fill="#174332"
                          fontSize={22}
                        />
                      )}
                    </>
                  );
                })()}
              {(compositionPreview ?? doc.generated)?.channels
                ?.find((b) => b.id === selectedBand && b.course === course)
                ?.cells.map((c) => (
                  <Rect
                    key={`channel-${c.x}-${c.y}`}
                    x={c.x * camera.scale + camera.x}
                    y={c.y * camera.scale + camera.y}
                    width={module * camera.scale}
                    height={module * camera.scale}
                    stroke="#1d6959"
                    strokeWidth={2}
                  />
                ))}
              {(compositionPreview ?? doc.generated)?.components
                .filter((c) => c.id === selectedComponent)
                .flatMap((c) =>
                  c.junctions.map((j, i) => (
                    <Rect
                      key={`${c.id}:${i}`}
                      x={j.x * camera.scale + camera.x - 3}
                      y={j.y * camera.scale + camera.y - 3}
                      width={module * camera.scale + 6}
                      height={module * camera.scale + 6}
                      stroke={compositionPreview ? "#ab5b1e" : "#17644b"}
                      strokeWidth={3}
                    />
                  )),
                )}
              {doc.generationState.diagnostics
                .filter((d) => d.severity === "error")
                .map((d, i) => (
                  <Circle
                    key={i}
                    x={(d.x + module / 2) * camera.scale + camera.x}
                    y={(d.y + module / 2) * camera.scale + camera.y}
                    radius={9}
                    stroke="#b74430"
                    strokeWidth={3}
                  />
                ))}
            </Layer>
          )}
          <Layer listening={false}>
            <Shape
              sceneFunc={(ctx) => {
                const visible = renderDoc.model.openings.map((o) =>
                  openingPreview?.id === o.id ? openingPreview : o,
                );
                if (openingPreview && gesture.current?.type === "opening-draw")
                  visible.push(openingPreview);
                visible.sort(
                  (a, b) =>
                    Number(a.id === selected) - Number(b.id === selected),
                );
                const labels: {
                  x: number;
                  y: number;
                  width: number;
                  height: number;
                }[] = [];
                for (const o of visible) {
                  const w = rendered.find((w) => w.id === o.wallId);
                  if (!w || o.width <= 0) continue;
                  const f = doc.model.floors[0],
                    h = doc.project.base.height;
                  if (
                    mode === "course" &&
                    !(
                      f.level + (course - 1) * h <
                        f.level + o.base + o.height &&
                      f.level + course * h > f.level + o.base
                    )
                  )
                    continue;
                  const b = openingBox(o, w, module),
                    x = b.x * camera.scale + camera.x,
                    y = b.y * camera.scale + camera.y,
                    width = b.width * camera.scale,
                    height = b.height * camera.scale;
                  ctx.save();
                  ctx.strokeStyle = openingIssue(renderDoc, o)
                    ? "#a0392c"
                    : selected === o.id
                      ? "#215f4b"
                      : "#4b6072";
                  ctx.lineWidth = selected === o.id ? 2 : 1;
                  ctx.fillStyle = "#f6f8f3";
                  ctx.fillRect(x, y, width, height);
                  ctx.setLineDash(o.kind === "opening" ? [4, 3] : []);
                  ctx.strokeRect(x, y, width, height);
                  if (o.kind === "window") {
                    ctx.beginPath();
                    if (w.a.y === w.b.y) {
                      ctx.moveTo(x, y + height / 3);
                      ctx.lineTo(x + width, y + height / 3);
                      ctx.moveTo(x, y + (2 * height) / 3);
                      ctx.lineTo(x + width, y + (2 * height) / 3);
                    } else {
                      ctx.moveTo(x + width / 3, y);
                      ctx.lineTo(x + width / 3, y + height);
                      ctx.moveTo(x + (2 * width) / 3, y);
                      ctx.lineTo(x + (2 * width) / 3, y + height);
                    }
                    ctx.stroke();
                  } else if (o.kind === "door") {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + width, y + height);
                    ctx.stroke();
                  }
                  ctx.setLineDash([]);
                  ctx.fillStyle = "#234b40";
                  ctx.font = "11px sans-serif";
                  const label = `${openingLabel[o.kind]} · ${display(o.base)}–${display(o.base + o.height)} cm`,
                    metrics = ctx.measureText(label),
                    ascent = metrics.actualBoundingBoxAscent,
                    descent = metrics.actualBoundingBoxDescent,
                    vertical = w.a.x === w.b.x;
                  let labelX = vertical ? x - 5 - ascent : x,
                    labelY = vertical ? y + height : y - 5;
                  const labelBounds = () => ({
                    x: vertical ? labelX - descent : labelX,
                    y: vertical ? labelY - metrics.width : labelY - ascent,
                    width: vertical ? ascent + descent : metrics.width,
                    height: vertical ? metrics.width : ascent + descent,
                  });
                  let bounds = labelBounds();
                  while (
                    (vertical ? bounds.x >= 0 : bounds.y >= 0) &&
                    labels.some(
                      (l) =>
                        bounds.x < l.x + l.width + 3 &&
                        bounds.x + bounds.width + 3 > l.x &&
                        bounds.y < l.y + l.height + 3 &&
                        bounds.y + bounds.height + 3 > l.y,
                    )
                  ) {
                    if (vertical) labelX -= 14;
                    else labelY -= 14;
                    bounds = labelBounds();
                  }
                  if (vertical ? bounds.x >= 0 : bounds.y >= 0) {
                    labels.push(bounds);
                    ctx.save();
                    ctx.translate(labelX, labelY);
                    if (vertical) ctx.rotate(-Math.PI / 2);
                    ctx.fillText(label, 0, 0);
                    ctx.restore();
                  }
                  if (mode === "plan" && selected === o.id && !readonly) {
                    for (const [xx, yy] of w.a.y === w.b.y
                      ? [
                          [x, y + height / 2],
                          [x + width, y + height / 2],
                        ]
                      : [
                          [x + width / 2, y],
                          [x + width / 2, y + height],
                        ]) {
                      ctx.beginPath();
                      ctx.arc(xx, yy, 5, 0, Math.PI * 2);
                      ctx.fillStyle = "#fff";
                      ctx.fill();
                      ctx.stroke();
                    }
                  }
                  ctx.restore();
                }
              }}
            />
            {openingPreview && (
              <Text
                x={16}
                y={16}
                fontSize={13}
                fill="#174332"
                text={`${openingLabel[openingPreview.kind]} · posição ${display(openingPreview.offset)} · largura ${display(openingPreview.width)} cm · base ${display(openingPreview.base)} · topo ${display(openingPreview.base + openingPreview.height)} cm${openingIssue(doc, openingPreview) ? " · medida pendente" : ""}`}
              />
            )}
          </Layer>
          {moduleHover && (
            <Layer listening={false}>
              <Rect
                x={moduleHover.x * camera.scale + camera.x}
                y={moduleHover.y * camera.scale + camera.y}
                width={module * camera.scale}
                height={module * camera.scale}
                fill="rgba(110,120,115,0.35)"
                stroke="#78827b"
                strokeWidth={1}
              />
            </Layer>
          )}
        </Stage>
      </div>
      {!walls.length && !preview && (
        <div className={styles.canvasHint}>
          <span>SEU PROJETO COMEÇA AQUI</span>
          <h2>Trace a primeira parede.</h2>
          <p>
            Escolha Parede e arraste sobre a malha.
            <br />
            As medidas se ajustam ao módulo do tijolo.
          </p>
        </div>
      )}
      <div className={styles.canvasTop}>
        <span className={styles.pill}>
          TÉRREO <span> / </span>{" "}
          {mode === "plan"
            ? "PLANTA"
            : compositionPreview
              ? "FIADA · PRÉVIA"
              : "FIADA"}
        </span>
        {mode === "plan" && tool === "wall" && (
          <button
            disabled={busy || readonly}
            onClick={() => setSide(side === 1 ? -1 : 1)}
          >
            Inverter lado <b>{side === 1 ? "↓ / →" : "↑ / ←"}</b>
          </button>
        )}
      </div>
      {choices.length > 1 && (
        <div className={styles.overlap}>
          <span>Selecionar parede</span>
          {choices.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                useStore.getState().choose(w.id);
                setHostWallId(w.id);
                setChoices([]);
              }}
            >
              Parede {walls.indexOf(w) + 1} · {display(length(w))} cm
            </button>
          ))}
        </div>
      )}
      {openingChoices.length > 1 && (
        <div className={styles.overlap}>
          <span>Selecionar vão</span>
          {openingChoices.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                useStore.getState().choose(o.id);
                setOpeningChoices([]);
              }}
            >
              {openingLabel[o.kind]} · base {display(o.base)} · topo{" "}
              {display(o.base + o.height)} cm
            </button>
          ))}
        </div>
      )}
      {channelChoices.length > 1 && (
        <div className={styles.overlap}>
          <span>Selecionar parede da faixa</span>
          {channelChoices.map((id) => {
            const b = doc.generated?.channels?.find((b) => b.id === id);
            return (
              b && (
                <button
                  key={id}
                  onClick={() => {
                    useStore.getState().inspect({ channelBand: id });
                    setChannelChoices([]);
                  }}
                >
                  Parede {walls.findIndex((w) => w.id === b.wallId) + 1} ·
                  canaleta na fiada {b.course}
                </button>
              )
            );
          })}
        </div>
      )}
      <div className={styles.canvasBottom}>
        <span title="Navegar: botão do meio + arraste ou Espaço + arraste. Roda: zoom.">
          {readonly
            ? "Somente leitura"
            : mode === "course"
              ? groutMode
                ? groutHover
                  ? groutPresent(groutHover)
                    ? "Remover graute · eixo completo"
                    : "Adicionar graute · eixo completo"
                  : "Clique num furo · Esc encerra Graute"
                : "Inspecione um conjunto"
              : tool === "wall"
                ? "Arraste para desenhar · Esc cancela"
                : "Clique para selecionar · Arraste o corpo para mover ou uma alça para editar"}
          {" · Botão do meio + arraste para navegar"}
        </span>
        <div className={styles.zoom}>
          <button
            disabled={busy}
            title="Reduzir zoom"
            aria-label="Reduzir zoom"
            className={styles.iconButton}
            data-tooltip="Reduzir zoom"
            onClick={() => zoom(1 / 1.2)}
          >
            <Icon name="minus" />
          </button>
          <span>{Math.round((camera.scale / 0.012) * 100)}%</span>
          <button
            disabled={busy}
            title="Ampliar zoom"
            aria-label="Ampliar zoom"
            className={styles.iconButton}
            data-tooltip="Ampliar zoom"
            onClick={() => zoom(1.2)}
          >
            <Icon name="plus" />
          </button>
          <button disabled={busy} onClick={fit} className={styles.iconText}>
            <Icon name="fit" /> Enquadrar
          </button>
        </div>
      </div>
    </div>
  );
}
