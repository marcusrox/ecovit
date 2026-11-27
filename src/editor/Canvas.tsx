import type Konva from "konva";
import {
  Fragment as ReactFragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Circle, Layer, Line, Rect, Shape, Stage, Text } from "react-konva";
import {
  cursorCell,
  openingCell,
  openingDrawRange,
  wallDraw,
} from "../domain/drawing";
import {
  floorPlanBounds,
  resolveFloorReference,
} from "../domain/floor-reference";
import {
  activeGrout,
  courseCells,
  groutId,
  toggleGrout,
} from "../domain/grout";
import { defaultAppearance } from "../domain/opening-appearance";
import {
  openingBox,
  openingIssue,
  openingLabel,
  openingOffset,
  putOpening,
} from "../domain/openings";
import {
  bounds,
  connection,
  display,
  hitWalls,
  length,
  resizeWall,
  snapPoint,
  type Opening,
  type Point,
  type Tool,
  type Wall,
} from "../domain/project";
import {
  createContinuation,
  moveWall,
  type WallEdit,
} from "../domain/wall-editing";
import { usePreferences } from "../state/preferences";
import {
  useCourseDisplayComposition,
  useEditingProject,
  useStore,
} from "../state/store";
import styles from "../ui/App.module.css";
import { Icon } from "../ui/Icon";
import { ChannelReinforcementCanvas } from "./ChannelReinforcement";
import { ClampsCanvas, ClampsTooltip, type ClampHover } from "./Clamps";
import { CompositionStatus } from "./CompositionStatus";
import { displayDiagnostics } from "./diagnostics";
import { drawWallBand } from "./drawing/primitives";
import { drawCoursePieces, drawWallOpenings } from "./drawing/shared";
import { FloorReferenceLayer } from "./FloorReference";
import { useImageElements } from "./ImageElements";
import { DRAWING_FONT_FAMILY, labelFontSize, labelSpacing } from "./label-font";
import { useMeasurementCanvas } from "./Measurements";
import { useReferenceImageCanvas } from "./ReferenceImage";
import { useRoomCanvas } from "./Rooms";
import { selectionHandles } from "./selection-handles";
import { useSlabCanvas } from "./Slabs";
import { useTerrainCanvas } from "./Terrain";
import { useTerrainCompass } from "./TerrainCompass";
import { useTextCanvas } from "./Text";
import { MIN_CAMERA_SCALE, useProjectCamera } from "./useProjectCamera";
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
  onReady,
  tool,
  setTool,
  side,
  setSide,
}: {
  onReady: (id: string) => void;
  tool: Tool;
  setTool: (t: Tool) => void;
  side: 1 | -1;
  setSide: (s: 1 | -1) => void;
}) {
  const labelVisibility = usePreferences((s) => s.labels);
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
  const project = useStore((s) => s.doc)!,
    floorReference = useStore((s) => s.floorReference),
    reference =
      mode === "plan"
        ? resolveFloorReference(project, doc.viewFloorId, floorReference)
        : undefined,
    referenceEmpty =
      !reference ||
      (!project.model.walls.some((w) => w.floorId === reference.id) &&
        !project.model.slabs.some((s) => s.floorId === reference.id));
  const stage = useRef<Konva.Stage>(null);
  const announcedReady = useRef(false);
  const [clampHover, setClampHover] = useState<ClampHover | null>(null);
  const host = useRef<HTMLDivElement>(null),
    gesture = useRef<Gesture | null>(null),
    space = useRef(false);
  const [preview, setPreview] = useState<Wall | null>(null),
    [target, setTarget] = useState<Point | null>(null),
    [hover, setHover] = useState<string | null>(null),
    [choices, setChoices] = useState<Wall[]>([]),
    [panning, setPanning] = useState(false);
  const {
    camera,
    setCamera,
    size,
    resize,
    ready: cameraReady,
    error: viewError,
  } = useProjectCamera(project.project.id, panning);
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
  const diagnostics = useMemo(
    () =>
      displayDiagnostics(project).filter((d) => d.floorId === doc.viewFloorId),
    [project, doc.viewFloorId],
  );
  const courseWalls = walls.filter(
    (w) => w.height > (course - 1) * doc.project.base.height,
  );
  // Room draft cancellation must run before generic Escape handlers reset store listeners.
  const rooms = useRoomCanvas(doc, tool, camera, host, panning || spaceHeld);
  const imageCanvas = useReferenceImageCanvas(camera, size);
  const imageDraft = useStore((s) => s.imageDraft);
  const terrain = useTerrainCanvas(doc, tool, setTool, camera, host);
  const compass = useTerrainCompass(doc, tool, camera, host);
  const furniture = useImageElements(doc, tool, camera, host, setTool);
  const texts = useTextCanvas(doc, tool, camera, host, setTool);
  const annotationHandles =
    mode === "plan" && tool === "select" && doc.model.texts.length > 0
      ? selectionHandles(
          doc,
          selected,
          camera.scale,
          useStore.getState().terrainEditing,
        )
      : [];
  useLayoutEffect(() => {
    const element = host.current;
    if (element)
      resize({ width: element.clientWidth, height: element.clientHeight });
  }, [resize]);
  useLayoutEffect(() => {
    if (
      announcedReady.current ||
      busy ||
      !cameraReady ||
      !furniture.ready ||
      !texts.ready ||
      !imageCanvas.ready
    )
      return;
    const frame = requestAnimationFrame(() => {
      // React-Konva schedules layer paints; finish them before revealing the editor.
      stage.current?.draw();
      announcedReady.current = true;
      onReady(project.project.id);
    });
    return () => cancelAnimationFrame(frame);
  }, [
    busy,
    cameraReady,
    furniture.ready,
    texts.ready,
    imageCanvas.ready,
    camera,
    size,
    onReady,
    project.project.id,
  ]);
  const slabs = useSlabCanvas(doc, tool, setTool, camera);
  const measurements = useMeasurementCanvas(
    doc,
    tool,
    camera,
    host,
    panning || spaceHeld,
  );
  const displayComposition = useCourseDisplayComposition();
  const output = compositionPreview ?? displayComposition;
  const courseWall =
    mode === "course" ? walls.find((w) => w.id === selected) : undefined;
  const courseChoicePoint = useRef<Point | null>(null);
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
  const chooseCourseWall = (id: string | null, p?: Point) => {
    useStore.getState().choose(id);
    const bands =
      p && id
        ? output?.channels?.filter(
            (b) =>
              b.course === course &&
              b.wallId === id &&
              b.cells.some(
                (c) =>
                  p.x >= c.x &&
                  p.x < c.x + module &&
                  p.y >= c.y &&
                  p.y < c.y + module,
              ),
          )
        : [];
    useStore.getState().inspect({ channelBand: bands?.[0]?.id ?? null });
  };
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
    if (readonly) cancel();
  }, [readonly]);
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
      resize({ width: r.width, height: r.height });
    });
    if (host.current) observer.observe(host.current);
    const blur = () => {
      space.current = false;
      setSpaceHeld(false);
      setMouseScreen(null);
      cancel();
    };
    const down = (e: KeyboardEvent) => {
      if (document.querySelector("dialog[open]")) return;
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
      if (document.querySelector("dialog[open]")) return;
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
  }, [setTool, resize, setCamera]);
  useEffect(() => {
    if (preview && gesture.current?.type === "draw")
      setPreview((p) => (p ? { ...p, side } : null));
  }, [side]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (focus)
      setCamera((c) => {
        const scale =
          focus.scale ??
          (focus.width !== undefined && focus.height !== undefined
            ? Math.max(
                MIN_CAMERA_SCALE,
                Math.min(
                  0.06,
                  (size.width - 160) / Math.max(1, focus.width),
                  (size.height - 160) / Math.max(1, focus.height),
                ),
              )
            : c.scale);
        return {
          scale,
          x: size.width / 2 - focus.x * scale,
          y: size.height / 2 - focus.y * scale,
        };
      });
  }, [focus, size.width, size.height, setCamera]);
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
      scale = Math.max(MIN_CAMERA_SCALE, Math.min(0.12, camera.scale * factor));
    setCamera({ scale, x: point.x - w.x * scale, y: point.y - w.y * scale });
  };
  const fit = () => {
    let box = floorPlanBounds(
      project,
      [doc.viewFloorId, ...(reference ? [reference.id] : [])],
      mode === "plan",
      mode === "plan" ? doc.viewFloorId : undefined,
      mode === "plan",
    );
    if (
      mode === "plan" &&
      (imageCanvas.bounds.length ||
        furniture.bounds.length ||
        texts.bounds.length ||
        doc.model.terrain)
    ) {
      const points = [
        ...imageCanvas.bounds,
        ...texts.bounds,
        ...(doc.model.terrain?.contour ?? []),
        ...compass.bounds,
        ...(mode === "plan" ? furniture.bounds : []),
        ...(box
          ? [
              { x: box.x, y: box.y },
              { x: box.x + box.width, y: box.y + box.height },
            ]
          : []),
      ];
      const x = Math.min(...points.map((p) => p.x)),
        y = Math.min(...points.map((p) => p.y));
      box = {
        x,
        y,
        width: Math.max(...points.map((p) => p.x)) - x,
        height: Math.max(...points.map((p) => p.y)) - y,
      };
    }
    if (!box) {
      // Keep the existing Fiada behavior for a floor containing only a slab.
      if (mode === "course" && doc.model.slabs.length) return;
      setCamera({ x: 120, y: 100, scale: 0.012 });
      return;
    }
    const minX = box.x,
      minY = box.y,
      maxX = box.x + box.width,
      maxY = box.y + box.height;
    const scale = Math.max(
      MIN_CAMERA_SCALE,
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
    tool !== "measure" &&
    tool !== "terrain" &&
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
        onDoubleClick={(e) => {
          if (e.button !== 0 || (e.target as HTMLElement).closest("button"))
            return;
          if (
            texts.doubleClick(world(pointer(e.clientX, e.clientY))) ||
            rooms.doubleClick(world(pointer(e.clientX, e.clientY)))
          )
            e.preventDefault();
        }}
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
            texts.isDragging() ||
            rooms.isDragging() ||
            measurements.isDragging() ||
            furniture.isDragging() ||
            terrain.isDragging() ||
            compass.isDragging() ||
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
            const cell = markers.find(
              (c) =>
                p.x >= c.x &&
                p.x < c.x + module &&
                p.y >= c.y &&
                p.y < c.y + module,
            );
            const candidates = walls.filter((w) =>
              cell?.wallIds.includes(w.id),
            );
            courseChoicePoint.current = p;
            chooseCourseWall(
              candidates.length === 1 ? candidates[0].id : null,
              p,
            );
            if (candidates.length > 1) setChoices(candidates);
            return;
          }
          if (imageDraft) {
            if (!readonly) imageCanvas.down(p);
            return;
          }
          const priorityHandle =
            !readonly &&
            !imageDraft &&
            !useStore.getState().slabDraft &&
            !useStore.getState().furnitureDraft &&
            !useStore.getState().terrainDraft &&
            tool === "select" &&
            annotationHandles.find(
              (h) =>
                Math.hypot(h.point.x - p.x, h.point.y - p.y) * camera.scale <=
                h.radius,
            );
          if (priorityHandle) {
            const h = priorityHandle;
            if (h.kind === "wall") {
              const wall = walls.find((w) => w.id === selected)!;
              gesture.current = { type: "resize", wall, end: h.end! };
              setPreview(wall);
              return;
            }
            if (h.kind === "opening" && activeOpening) {
              const wall = walls.find((w) => w.id === activeOpening.wallId)!;
              gesture.current = {
                type: "opening-resize",
                wall,
                opening: activeOpening,
                end: h.end!,
              };
              setOpeningPreview(activeOpening);
              return;
            }
            if (h.kind === "measurement" && measurements.down(p, e.altKey))
              return;
            if (h.kind === "room" && rooms.down(p, e.altKey)) return;
            if (h.kind === "furniture" && furniture.down(p)) return;
            if (h.kind === "slab" && slabs.down(p)) return;
            if (h.kind === "terrain" && terrain.down(p, e.altKey)) return;
            if (h.kind === "compass" && compass.down(p)) return;
          }
          if (texts.down(p)) {
            e.preventDefault();
            return;
          }
          if (tool === "text") return;
          if (readonly) return;
          if (rooms.down(p, e.altKey)) return;
          if (tool === "room" || tool === "room-boundary") return;
          if (compass.down(p)) return;
          if (terrain.down(p, e.altKey)) return;
          if (tool === "terrain") return;
          if (imageCanvas.down(p)) return;
          if (furniture.down(p)) return;
          if (tool === "furniture") return;
          useStore.getState().inspect({ pendingOpening: null });
          if (measurements.down(p, e.altKey)) return;
          if (slabs.down(p)) return;
          if (activeOpening && (tool === "select" || tool === "measure")) {
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
          if (
            tool !== "wall" &&
            tool !== "select" &&
            tool !== "slab" &&
            tool !== "measure"
          ) {
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
              ...(defaultAppearance(tool)
                ? { appearance: defaultAppearance(tool) }
                : {}),
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
          const bodyTarget = slabs.bodyTarget();
          const forcedWall = hits.find((w) => w.id === bodyTarget);
          const openingCandidates = openingHits(p);
          const forcedOpening = openingCandidates.find(
            (o) => o.id === bodyTarget,
          );
          const openings = forcedWall
            ? []
            : forcedOpening
              ? [forcedOpening]
              : openingCandidates;
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
          const chosen = forcedWall ?? hits.find((w) => w.id === hostWallId);
          if (!hits.length && !openings.length && terrain.selectAt(p)) return;
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
        onLostPointerCapture={() => {
          terrain.cancel();
          compass.cancel();
          furniture.cancel();
          texts.cancel();
          if (rooms.isDragging()) rooms.cancel();
          measurements.cancel();
          cancel();
          slabs.cancel();
        }}
        onMouseMove={(e) => {
          if (
            gesture.current?.type !== "pan" &&
            texts.move(world(pointer(e.clientX, e.clientY)))
          )
            return;
          if (
            gesture.current?.type !== "pan" &&
            rooms.move(world(pointer(e.clientX, e.clientY)), e.altKey)
          )
            return;
          setMouseScreen(pointer(e.clientX, e.clientY));
          if (
            gesture.current?.type !== "pan" &&
            compass.move(world(pointer(e.clientX, e.clientY)))
          )
            return;
          if (
            gesture.current?.type !== "pan" &&
            terrain.move(world(pointer(e.clientX, e.clientY)), e.altKey)
          )
            return;
          if (
            gesture.current?.type !== "pan" &&
            furniture.move(world(pointer(e.clientX, e.clientY)))
          )
            return;
          if (
            gesture.current?.type !== "pan" &&
            imageCanvas.move(world(pointer(e.clientX, e.clientY)))
          )
            return;
          if (
            gesture.current?.type !== "pan" &&
            slabs.move(world(pointer(e.clientX, e.clientY)))
          )
            return;
          if (gesture.current?.type !== "pan") {
            if (
              measurements.move(world(pointer(e.clientX, e.clientY)), e.altKey)
            )
              return;
            update(pointer(e.clientX, e.clientY));
          }
        }}
        onMouseUp={(e) => {
          if (
            e.button === 0 &&
            gesture.current?.type !== "pan" &&
            texts.up(world(pointer(e.clientX, e.clientY)))
          )
            return;
          if (
            e.button === 0 &&
            gesture.current?.type !== "pan" &&
            rooms.up(world(pointer(e.clientX, e.clientY)), e.altKey)
          )
            return;
          if (
            e.button === 0 &&
            gesture.current?.type !== "pan" &&
            compass.up(world(pointer(e.clientX, e.clientY)))
          )
            return;
          if (
            e.button === 0 &&
            gesture.current?.type !== "pan" &&
            terrain.up(world(pointer(e.clientX, e.clientY)))
          )
            return;
          if (
            e.button === 0 &&
            gesture.current?.type !== "pan" &&
            furniture.up(world(pointer(e.clientX, e.clientY)))
          )
            return;
          if (
            e.button === 0 &&
            gesture.current?.type !== "pan" &&
            imageCanvas.up()
          )
            return;
          if (
            e.button === 0 &&
            gesture.current?.type !== "pan" &&
            measurements.up(world(pointer(e.clientX, e.clientY)), e.altKey)
          )
            return;
          if (
            e.button === 0 &&
            gesture.current?.type !== "pan" &&
            slabs.up(world(pointer(e.clientX, e.clientY)))
          ) {
            cancel();
            return;
          }
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
          rooms.leave();
          measurements.leave();
          setHover(null);
          setMouseScreen(null);
          setGroutHover(null);
          setClampHover(null);
          if (!gesture.current) setTarget(null);
        }}
      >
        <Stage
          ref={stage}
          width={size.width}
          height={size.height}
          onWheel={(e) => {
            e.evt.preventDefault();
            if (
              !busy &&
              !gesture.current &&
              !texts.isDragging() &&
              !rooms.isDragging() &&
              !measurements.isDragging() &&
              !terrain.isDragging() &&
              !compass.isDragging()
            )
              zoom(
                e.evt.deltaY < 0 ? 1.12 : 1 / 1.12,
                pointer(e.evt.clientX, e.evt.clientY),
              );
          }}
        >
          {terrain.layer}
          {imageCanvas.layer}
          <Layer listening={false}>{grid}</Layer>
          {reference && (
            <FloorReferenceLayer
              doc={project}
              floorId={reference.id}
              camera={camera}
            />
          )}
          {slabs.before}
          {furniture.layer}
          <Layer listening={false}>
            {mode === "plan" &&
              rendered.map((w, i) => {
                const selectedWall = selected === w.id,
                  draft = preview?.id === w.id;
                return (
                  <Shape
                    key={w.id}
                    sceneFunc={(ctx) =>
                      drawWallBand(ctx._context, w, module, camera, {
                        fill: draft
                          ? "#bbd5c9"
                          : selectedWall
                            ? "#759c8b"
                            : hover === w.id
                              ? "#a7bbae"
                              : "#c0c9bc",
                        stroke: selectedWall || draft ? "#245d49" : "#637969",
                        width: selectedWall ? 2 : 1,
                        opacity: i === rendered.length - 1 && draft ? 0.8 : 1,
                      })
                    }
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
                {labelVisibility.wall &&
                  (["a", "b"] as const).map((end) => (
                    <Text
                      key={`label-${end}`}
                      text={end.toUpperCase()}
                      x={
                        (preview?.id === active.id ? preview : active)[end].x *
                          camera.scale +
                        camera.x +
                        labelSpacing(9, camera.scale)
                      }
                      y={
                        (preview?.id === active.id ? preview : active)[end].y *
                          camera.scale +
                        camera.y -
                        labelSpacing(18, camera.scale)
                      }
                      fontFamily={DRAWING_FONT_FAMILY}
                      fontSize={labelFontSize(11, camera.scale)}
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
                  labelSpacing(26, camera.scale)
                }
                text={`${display(length(preview))} cm · face externa${wallEdit?.participants.length ? " · continuidade" : ""}${wallEdit?.message ? ` · ${wallEdit.message}` : ""}`}
                fontFamily={DRAWING_FONT_FAMILY}
                fontSize={labelFontSize(13, camera.scale)}
                fill="#174332"
              />
            )}
          </Layer>
          {mode === "course" && (
            <Layer listening={false}>
              {courseWalls.map((w) => {
                return (
                  <Shape
                    key={`contour-${w.id}`}
                    name="course-wall-contour"
                    sceneFunc={(ctx) =>
                      drawWallBand(ctx._context, w, module, camera, {
                        contour: true,
                      })
                    }
                  />
                );
              })}
              <Shape
                sceneFunc={(ctx) => {
                  drawCoursePieces(ctx._context, {
                    doc,
                    output,
                    camera,
                    size,
                    course,
                    ghost,
                    busy,
                    groutMode,
                  });
                }}
              />
              {courseWall &&
                courseWall.height >= course * doc.project.base.height &&
                output?.courses[course - 1]?.pieces
                  .filter((p) => p.wallIds.includes(courseWall.id))
                  .map((p) => {
                    const b = bounds(courseWall, module),
                      x = Math.max(b.x, p.x),
                      y = Math.max(b.y, p.y);
                    const width = Math.min(b.x + b.width, p.x + p.width) - x,
                      height = Math.min(b.y + b.height, p.y + p.height) - y;
                    return width > 0 && height > 0 ? (
                      <Rect
                        key={`selected-wall-${p.id}`}
                        x={x * camera.scale + camera.x}
                        y={y * camera.scale + camera.y}
                        width={width * camera.scale}
                        height={height * camera.scale}
                        fill="rgba(36,93,73,0.10)"
                        stroke="#245d49"
                        strokeWidth={2}
                      />
                    ) : null;
                  })}
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
              {output?.channels
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
              {output?.components
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
            </Layer>
          )}
          <Layer listening={false}>
            <Shape
              sceneFunc={(ctx) => {
                drawWallOpenings(ctx._context, {
                  doc,
                  renderDoc,
                  rendered,
                  camera,
                  mode,
                  course,
                  openingPreview,
                  creating: gesture.current?.type === "opening-draw",
                  selected,
                  readonly,
                  labelVisibility,
                });
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
          <Layer listening={false}>
            {(mode === "course" ? courseWalls : walls)
              .filter((w) => diagnosticWalls.includes(w.id))
              .map((w) => {
                const b = bounds(w, module);
                return (
                  <Rect
                    key={`diagnostic-${w.id}`}
                    name="diagnostic-wall"
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
            {diagnostics
              .filter(
                (d) =>
                  d.severity === "error" &&
                  (mode === "course" || d.region) &&
                  (!d.region ||
                    mode === "plan" ||
                    d.wallIds.every((id) =>
                      courseWalls.some((w) => w.id === id),
                    )),
              )
              .map((d, i) => (
                <ReactFragment key={i}>
                  {d.region && (
                    <Rect
                      name="diagnostic-conflict"
                      x={d.region.x * camera.scale + camera.x}
                      y={d.region.y * camera.scale + camera.y}
                      width={d.region.width * camera.scale}
                      height={d.region.height * camera.scale}
                      fill="rgba(189,73,48,0.25)"
                      stroke="#b74430"
                      strokeWidth={3}
                    />
                  )}
                  <Circle
                    name="diagnostic-marker"
                    x={
                      (d.region ? d.focus.x : d.x + module / 2) * camera.scale +
                      camera.x
                    }
                    y={
                      (d.region ? d.focus.y : d.y + module / 2) * camera.scale +
                      camera.y
                    }
                    radius={9}
                    stroke="#b74430"
                    strokeWidth={3}
                  />
                </ReactFragment>
              ))}
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
          {slabs.after}
          {measurements.layer}
          {rooms.layer}
          {compass.layer}
          {texts.layer}
          {furniture.controls}
          {imageCanvas.markers}
          {terrain.controls}
          {mode === "plan" && !readonly && doc.model.texts.length > 0 && (
            <Layer listening={false}>
              {annotationHandles.map((h, i) => (
                <Circle
                  key={i}
                  x={camera.x + h.point.x * camera.scale}
                  y={camera.y + h.point.y * camera.scale}
                  radius={5}
                  fill="white"
                  stroke="#34795d"
                  strokeWidth={2}
                />
              ))}
            </Layer>
          )}
          {texts.controls}
          {mode === "course" && (
            <ChannelReinforcementCanvas camera={camera} width={size.width} />
          )}
          {mode === "course" && (
            <ClampsCanvas camera={camera} onHover={setClampHover} />
          )}
        </Stage>
        <ClampsTooltip
          hover={clampHover}
          camera={camera}
          width={size.width}
          height={size.height}
        />
        {measurements.menu}
      </div>
      {slabs.controls}
      {!walls.length &&
        !doc.model.slabs.length &&
        !doc.model.measurements.length &&
        !doc.model.roomBoundaries.length &&
        !doc.model.roomLabels.length &&
        !doc.model.texts.length &&
        !useStore.getState().textDraft &&
        !doc.model.referenceImages.length &&
        !doc.model.imageElements.length &&
        !doc.model.terrain &&
        !imageDraft &&
        referenceEmpty &&
        tool !== "slab" &&
        tool !== "measure" &&
        tool !== "furniture" &&
        tool !== "terrain" &&
        tool !== "text" &&
        !preview && (
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
          {doc.model.floors[0].name} <span> / </span>{" "}
          {mode === "plan"
            ? "PLANTA"
            : compositionPreview
              ? "FIADA · PRÉVIA"
              : "FIADA"}
        </span>
        {reference && (
          <span
            className={`${styles.pill} ${styles.floorReferenceBadge}`}
            data-testid="floor-reference-label"
          >
            Referência: {floorReference === "below" ? "Inferior" : "Superior"} ·{" "}
            {reference.name} · {display(reference.level)} cm
            {referenceEmpty ? " · sem elementos" : ""}
          </span>
        )}
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
                if (mode === "course")
                  chooseCourseWall(
                    w.id,
                    courseChoicePoint.current ?? undefined,
                  );
                else {
                  useStore.getState().choose(w.id);
                  setHostWallId(w.id);
                }
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
        <div className={styles.canvasMessages}>
          <CompositionStatus />
          {viewError && <span role="alert">{viewError}</span>}
          <span>
            {readonly
              ? "Somente leitura"
              : terrain.hint
                ? terrain.hint
                : imageCanvas.hint
                  ? imageCanvas.hint
                  : rooms.hint
                    ? rooms.hint
                    : furniture.hint
                      ? furniture.hint
                      : mode === "course"
                        ? groutMode
                          ? groutHover
                            ? groutPresent(groutHover)
                              ? "Remover graute · eixo completo"
                              : "Adicionar graute · eixo completo"
                            : "Clique num furo · Esc encerra Graute"
                          : ""
                        : tool === "furniture"
                          ? "Clique para posicionar a imagem · Esc cancela"
                          : tool === "wall"
                            ? "Arraste para desenhar · Esc cancela"
                            : tool === "measure"
                              ? `${measurements.placing ? "Clique para posicionar a linha da cota" : measurements.creating ? "Clique no ponto final" : "Clique no ponto inicial"} · ${measurements.placing ? "Mova o mouse para ajustar o afastamento" : "Alt suspende atração"} · Esc cancela`
                              : ""}
          </span>
        </div>
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
