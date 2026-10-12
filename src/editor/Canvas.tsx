import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Line, Circle, Text, Shape } from "react-konva";
import {
  bounds,
  connection,
  display,
  hitWalls,
  length,
  makeWall,
  resizeWall,
  snapPoint,
  type Point,
  type Wall,
} from "../domain/project";
import { useStore } from "../state/store";
import styles from "../ui/App.module.css";
type Camera = { x: number; y: number; scale: number };
type Gesture =
  | { type: "draw"; start: Point }
  | { type: "resize"; wall: Wall; end: "a" | "b" }
  | { type: "pan"; start: Point; camera: Camera; button: 0 | 1 };
export function Canvas({
  tool,
  setTool,
  side,
  setSide,
}: {
  tool: "select" | "wall";
  setTool: (t: "select" | "wall") => void;
  side: 1 | -1;
  setSide: (s: 1 | -1) => void;
}) {
  const mode = useStore((s) => s.mode),
    course = useStore((s) => s.course),
    ghost = useStore((s) => s.ghost),
    compositionPreview = useStore((s) => s.preview),
    selectedComponent = useStore((s) => s.component),
    focus = useStore((s) => s.focus);
  const doc = useStore((s) => s.doc)!,
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
  const module = doc.project.base.width,
    walls = doc.model.walls;
  const active =
    mode === "plan" ? walls.find((w) => w.id === selected) : undefined;
  const cancel = () => {
    gesture.current = null;
    setPreview(null);
    setTarget(null);
    setPanning(false);
  };
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ width: r.width, height: r.height });
    });
    if (host.current) observer.observe(host.current);
    const blur = () => {
      space.current = false;
      cancel();
    };
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select, button"))
        return;
      if (e.code === "Space") {
        e.preventDefault();
        space.current = true;
      }
      if (e.key === "Escape") {
        cancel();
        setChoices([]);
        setTool("select");
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        space.current = false;
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
  }, [mode]);
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
    if (g?.type === "pan") return;
    const connected = endpoint(p, g?.type === "resize" ? g.wall.id : undefined);
    setTarget(connected);
    if (g?.type === "draw") {
      const next = makeWall(
        g.start,
        connected ?? p,
        module,
        doc.model.floors[0].id,
        doc.model.floors[0].defaultHeight,
        side,
      );
      setPreview(next);
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
  const rendered = walls.map((w) => (preview?.id === w.id ? preview : w));
  if (preview && gesture.current?.type === "draw") rendered.push(preview);
  return (
    <div className={styles.canvasWrap}>
      <div
        ref={host}
        className={styles.canvas}
        data-testid="drawing"
        data-camera={JSON.stringify(camera)}
        data-module={module}
        style={{
          cursor: panning
            ? "grabbing"
            : tool === "wall"
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
            const output = compositionPreview ?? doc.generated;
            const piece = output?.courses[course - 1]?.pieces.find(
              (b) =>
                p.x >= b.x &&
                p.x <= b.x + b.width &&
                p.y >= b.y &&
                p.y <= b.y + b.height,
            );
            const comp = output?.components.find((c) =>
              piece?.wallIds.some((id) => c.wallIds.includes(id)),
            );
            useStore
              .getState()
              .inspect({ component: comp?.id ?? null, preview: null });
            return;
          }
          if (readonly) return;
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
              start: endpoint(p) ?? snapPoint(p, module),
            };
            return;
          }
          const hits = hitWalls(walls, p, module, 3 / camera.scale);
          useStore.getState().choose(hits[0]?.id ?? null);
          if (hits.length > 1) setChoices(hits);
        }}
        onAuxClick={(e) => {
          if (e.button === 1) e.preventDefault();
        }}
        onMouseMove={(e) => {
          if (gesture.current?.type !== "pan")
            update(pointer(e.clientX, e.clientY));
        }}
        onMouseUp={(e) => {
          const g = gesture.current;
          if (e.button !== (g?.type === "pan" ? g.button : 0)) return;
          if (g && g.type !== "pan" && !busy && !readonly) {
            if (preview) {
              const newWalls =
                g.type === "draw"
                  ? [...walls, preview]
                  : walls.map((w) => (w.id === preview.id ? preview : w));
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
          if (!gesture.current) setTarget(null);
        }}
      >
        <Stage
          width={size.width}
          height={size.height}
          onWheel={(e) => {
            e.evt.preventDefault();
            if (!gesture.current)
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
                text={`${display(length(preview))} cm · face externa`}
                fontSize={13}
                fill="#174332"
              />
            )}
          </Layer>
          {mode === "course" && (
            <Layer listening={false}>
              <Shape
                sceneFunc={(ctx) => {
                  const output = compositionPreview ?? doc.generated;
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
                        ctx.fillStyle =
                          p.kind === "whole" ? "#ba906e" : "#895b3f";
                        ctx.fillRect(x, y, w, h);
                      }
                      ctx.strokeRect(x, y, w, h);
                      if (!reference && module * camera.scale >= 9) {
                        ctx.fillStyle = "#f7eadd";
                        for (let xx = 0; xx < p.width / module; xx++)
                          for (let yy = 0; yy < p.height / module; yy++) {
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
                setChoices([]);
              }}
            >
              Parede {walls.indexOf(w) + 1} · {display(length(w))} cm
            </button>
          ))}
        </div>
      )}
      <div className={styles.canvasBottom}>
        <span title="Navegar: botão do meio + arraste ou Espaço + arraste. Roda: zoom.">
          {readonly
            ? "Somente leitura"
            : mode === "course"
              ? "Inspecione um conjunto"
              : tool === "wall"
                ? "Arraste para desenhar · Esc cancela"
                : "Clique para selecionar · Arraste uma alça para editar"}
          {" · Botão do meio + arraste para navegar"}
        </span>
        <div className={styles.zoom}>
          <button
            title="Reduzir zoom"
            aria-label="Reduzir zoom"
            onClick={() => zoom(1 / 1.2)}
          >
            −
          </button>
          <span>{Math.round((camera.scale / 0.012) * 100)}%</span>
          <button
            title="Ampliar zoom"
            aria-label="Ampliar zoom"
            onClick={() => zoom(1.2)}
          >
            +
          </button>
          <button onClick={fit}>Enquadrar</button>
        </div>
      </div>
    </div>
  );
}
