import { bounds, LIMIT, type Project, type Wall, type Point } from "./project";
import type { Composition, Piece } from "./composition";
import { openingBox } from "./openings";
export const MAX_CHANNEL_LEVELS = 100;
export const MAX_CHANNEL_SUPPRESSIONS = 10000;
export type ChannelBand = {
  id: string;
  wallId: string;
  top: number;
  course: number;
  cells: (Point & { origins: string[] })[];
};
export const channelBandId = (wallId: string, top: number) =>
  `${wallId}:${top}`;
export const isChannel = (p: Piece) =>
  p.kind === "channel" || p.kind === "half-channel";
const key = (x: number, y: number) => `${x},${y}`;
export function suppressBand(
  doc: Project,
  wallId: string,
  top: number,
): Project {
  if (!doc.model.walls.some((w) => w.id === wallId))
    throw new Error("Parede da faixa ausente.");
  if (
    doc.adjustments.channels.some(
      (a) => a.wallId === wallId && a.top === top && a.scope?.kind !== "range",
    )
  )
    return doc;
  if (doc.adjustments.channels.length >= MAX_CHANNEL_SUPPRESSIONS)
    throw new Error("Limite de supressões de canaleta atingido.");
  return {
    ...doc,
    adjustments: {
      ...doc.adjustments,
      channels: [
        ...doc.adjustments.channels,
        { id: crypto.randomUUID(), wallId, top, scope: { kind: "wall" } },
      ],
    },
  };
}
export function restoreBand(
  doc: Project,
  wallId: string,
  top: number,
): Project {
  return {
    ...doc,
    adjustments: {
      ...doc.adjustments,
      channels: doc.adjustments.channels.filter(
        (a) => a.wallId !== wallId || a.top !== top,
      ),
    },
  };
}
export function restoreSuppression(doc: Project, id: string): Project {
  return {
    ...doc,
    adjustments: {
      ...doc.adjustments,
      channels: doc.adjustments.channels.filter((a) => a.id !== id),
    },
  };
}
export function validateChannelLevels(doc: Project) {
  const f = doc.model.floors[0],
    h = doc.project.base.height;
  if (doc.project.channelLevels.length > MAX_CHANNEL_LEVELS)
    throw new Error("Limite de 100 níveis de canaleta atingido.");
  const seen = new Set<number>();
  for (const l of doc.project.channelLevels) {
    if (
      !Number.isSafeInteger(l.top) ||
      Math.abs(l.top) > LIMIT ||
      f.level + l.top <= f.start ||
      (f.level + l.top - f.start) % h
    )
      throw new Error(
        "O topo de canaleta deve coincidir com uma fiada acima do início da alvenaria.",
      );
    if (seen.has(l.top))
      throw new Error("Não repita a mesma cota de canaleta.");
    seen.add(l.top);
  }
}
type Cell = Point & { walls: string[]; origins: Set<string> };
function occupied(w: Wall, p: Point, m: number, n: number, h: number) {
  const b = bounds(w, m);
  return (
    w.height >= n * h &&
    p.x >= b.x &&
    p.x < b.x + b.width &&
    p.y >= b.y &&
    p.y < b.y + b.height
  );
}
export function applyChannels(doc: Project, result: Composition): Composition {
  const m = doc.project.base.width,
    h = doc.project.base.height,
    f = doc.model.floors[0],
    wallMap = new Map(doc.model.walls.map((w) => [w.id, w]));
  result.channels = [];
  if (
    doc.project.channelLevels.length > MAX_CHANNEL_LEVELS ||
    doc.adjustments.channels.length > MAX_CHANNEL_SUPPRESSIONS
  ) {
    result.courses = [];
    result.diagnostics.push({
      code: "channel-limit",
      severity: "error",
      category: "limit",
      message:
        "Limite de níveis ou supressões de canaleta excedido. Modelo preservado.",
      wallIds: [],
      course: 1,
      x: 0,
      y: 0,
    });
    return result;
  }
  const levels = [...doc.project.channelLevels].sort(
    (a, b) => a.top - b.top || a.id.localeCompare(b.id),
  );
  for (const l of levels)
    if (f.level + l.top <= f.start || (f.level + l.top - f.start) % h)
      result.diagnostics.push({
        code: "channel-level-off-grid",
        severity: "error",
        category: "input",
        message:
          "Nível de canaleta fora dos limites de fiada. Ajuste a cota nas configurações; o nível foi preservado e não aplicado.",
        wallIds: doc.model.walls.map((w) => w.id).sort(),
        levelIds: [l.id],
        course: Math.max(1, Math.ceil((f.level + l.top - f.start) / h)),
        x: 0,
        y: 0,
      });
  for (const a of [...doc.adjustments.channels].sort(
    (a, b) => a.wallId.localeCompare(b.wallId) || a.top - b.top,
  )) {
    const w = wallMap.get(a.wallId);
    if (
      !w ||
      (a.top - f.start) % h ||
      a.top <= f.start ||
      a.top > f.start + w.height ||
      ((result.convention === "nominal-v7" ||
        result.convention === "nominal-v8") &&
        a.scope?.kind === "range" &&
        (a.scope.from < (w.a.y === w.b.y ? bounds(w, m).x : bounds(w, m).y) ||
          a.scope.to >
            (w.a.y === w.b.y
              ? bounds(w, m).x + bounds(w, m).width
              : bounds(w, m).y + bounds(w, m).height)))
    ) {
      const b = w ? bounds(w, m) : { x: 0, y: 0 };
      result.diagnostics.push({
        code: "adjustment-target-missing",
        severity: "error",
        category: "geometry",
        message:
          "Supressão de canaleta sem fiada válida na parede. Ajuste preservado, não aplicado; restaure ou corrija a geometria.",
        wallIds: w ? [w.id] : [],
        adjustmentIds: [a.id],
        course: Math.max(1, Math.ceil((a.top - f.start) / h)),
        x: b.x,
        y: b.y,
      });
    }
  }
  for (const row of result.courses) {
    const top = f.level + row.top,
      n = row.number;
    const cells = new Map<string, Cell>();
    for (const p of row.pieces)
      for (let y = p.y; y < p.y + p.height; y += m)
        for (let x = p.x; x < p.x + p.width; x += m)
          cells.set(key(x, y), {
            x,
            y,
            walls: p.wallIds.filter((id) => {
              const w = wallMap.get(id);
              return !!w && occupied(w, { x, y }, m, n, h);
            }),
            origins: new Set(),
          });
    const demand = (w: Wall, from: number, to: number, origin: string) => {
      const b = bounds(w, m),
        horizontal = w.a.y === w.b.y;
      const start = horizontal ? b.x : b.y,
        end = start + (horizontal ? b.width : b.height);
      for (let s = Math.max(start, from); s < Math.min(end, to); s += m) {
        const c = cells.get(horizontal ? key(s, b.y) : key(b.x, s));
        if (c?.walls.includes(w.id)) c.origins.add(origin);
      }
    };
    for (const l of levels)
      if (f.level + l.top === top && (top - f.start) % h === 0 && top > f.start)
        for (const w of doc.model.walls)
          if (w.height >= n * h) demand(w, -LIMIT, LIMIT, `level:${l.id}`);
    for (const o of doc.model.openings) {
      const w = wallMap.get(o.wallId);
      if (!w) continue;
      const B = f.level + o.base,
        T = B + o.height,
        b = openingBox(o, w, m),
        start = w.a.y === w.b.y ? b.x : b.y;
      if (top === T + h && T + h <= f.start + w.height)
        demand(w, start - m, start + o.width + m, `opening-top:${o.id}`);
      if (top === B && B - h >= f.start)
        demand(w, start - m, start + o.width + m, `opening-bottom:${o.id}`);
    }
    const suppressedWalls = new Set(
      doc.adjustments.channels
        .filter((a) => a.top === top)
        .map((a) => a.wallId),
    );
    for (const c of cells.values()) {
      const suppressed =
        result.convention === "nominal-v7" || result.convention === "nominal-v8"
          ? doc.adjustments.channels.some((a) => {
              const w = wallMap.get(a.wallId);
              if (!w || a.top !== top || !c.walls.includes(w.id)) return false;
              const s = w.a.y === w.b.y ? c.x : c.y;
              return (
                a.scope?.kind !== "range" ||
                (s >= a.scope.from && s < a.scope.to)
              );
            })
          : c.walls.some((id) => suppressedWalls.has(id));
      if (suppressed) c.origins.clear();
    }
    const bands = new Map<string, ChannelBand>();
    for (const c of cells.values())
      if (c.origins.size)
        for (const id of c.walls) {
          const band = bands.get(id) ?? {
            id: channelBandId(id, top),
            wallId: id,
            top,
            course: n,
            cells: [],
          };
          band.cells.push({ x: c.x, y: c.y, origins: [...c.origins].sort() });
          bands.set(id, band);
        }
    for (const band of [...bands.values()].sort((a, b) =>
      a.wallId.localeCompare(b.wallId),
    )) {
      band.cells.sort((a, b) => a.y - b.y || a.x - b.x);
      result.channels.push(band);
    }
    row.pieces = row.pieces.flatMap((p) => {
      const cs: Cell[] = [];
      for (let y = p.y; y < p.y + p.height; y += m)
        for (let x = p.x; x < p.x + p.width; x += m)
          cs.push(cells.get(key(x, y))!);
      if (cs.every((c) => !c.origins.size)) return [p];
      if (cs.every((c) => c.origins.size))
        return [
          {
            ...p,
            kind:
              cs.length === 2
                ? ("channel" as const)
                : ("half-channel" as const),
            origins: [...new Set(cs.flatMap((c) => [...c.origins]))].sort(),
          },
        ];
      return cs.map((c) => ({
        id: `${n}:${c.x}:${c.y}:${m}:${m}`,
        x: c.x,
        y: c.y,
        width: m,
        height: m,
        kind: c.origins.size ? ("half-channel" as const) : ("half" as const),
        wallIds: [...c.walls].sort(),
        ...(c.origins.size ? { origins: [...c.origins].sort() } : {}),
      }));
    });
  }
  return result;
}
