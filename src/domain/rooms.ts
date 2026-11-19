import {
  bounds,
  LIMIT,
  type Point,
  type Project,
  type RoomLabel,
  type RoomBoundary,
  type EditableProject,
} from "./project";
import {
  attractMeasurement,
  projection,
  type MeasurementTargets,
} from "./measurements";

/** Snap to an actual representable point on the segment, never round a
 * projection off a diagonal and advertise a connection that does not exist. */
export function attractRoomPoint(
  p: Point,
  targets: MeasurementTargets,
  scale: number,
  disabled = false,
) {
  const vertices = attractMeasurement(
    p,
    { vertices: targets.vertices, segments: [] },
    scale,
    disabled,
  );
  if (disabled || vertices.snapped) return vertices;
  const points = targets.segments.map(([a, b]) => {
    const dx = b.x - a.x,
      dy = b.y - a.y;
    let u = Math.abs(dx),
      v = Math.abs(dy);
    while (v) {
      const rest = u % v;
      u = v;
      v = rest;
    }
    if (!u) return a;
    const projected = projection(p, a, b);
    const t = dx ? (projected.x - a.x) / dx : (projected.y - a.y) / dy;
    const k = Math.max(0, Math.min(u, Math.round(t * u)));
    return { x: a.x + (dx / u) * k, y: a.y + (dy / u) * k };
  });
  return attractMeasurement(p, { vertices: points, segments: [] }, scale);
}

// Only intersections are rational. User-entered coordinates remain integers in
// 0.1 mm; graph identity never depends on pixels, rounding or an epsilon.
type Q = { n: bigint; d: bigint };
type P = { x: Q; y: Q };
const gcd = (a: bigint, b: bigint): bigint =>
  b ? gcd(b, a % b) : a < 0n ? -a : a;
function q(n: bigint, d = 1n): Q {
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}
const add = (a: Q, b: Q) => q(a.n * b.d + b.n * a.d, a.d * b.d);
const neg = (a: Q) => ({ n: -a.n, d: a.d });
const sub = (a: Q, b: Q) => add(a, neg(b));
const mul = (a: Q, b: Q) => q(a.n * b.n, a.d * b.d);
const div = (a: Q, b: Q) => q(a.n * b.d, a.d * b.n);
const cmp = (a: Q, b: Q) => {
  const n = a.n * b.d - b.n * a.d;
  return n < 0n ? -1 : n > 0n ? 1 : 0;
};
const zero = q(0n),
  one = q(1n),
  half = q(1n, 2n);
const rp = (p: Point): P => ({ x: q(BigInt(p.x)), y: q(BigInt(p.y)) });
const number = (a: Q) => {
  const n = (a.n < 0n ? -a.n : a.n).toString(),
    d = a.d.toString();
  return (
    (a.n < 0n ? -1 : 1) *
    (Number(n.slice(0, 16)) / Number(d.slice(0, 16))) *
    10 ** (Math.max(0, n.length - 16) - Math.max(0, d.length - 16))
  );
};
function coordinate(n: number): Q {
  const [value, exponent = "0"] = n.toString().split("e");
  const decimals = (value.split(".")[1] ?? "").length - Number(exponent);
  return decimals >= 0
    ? q(BigInt(value.replace(".", "")), 10n ** BigInt(decimals))
    : q(BigInt(value.replace(".", "")) * 10n ** BigInt(-decimals));
}
const point = (p: P): Point => ({ x: number(p.x), y: number(p.y) });
const plus = (a: P, b: P): P => ({ x: add(a.x, b.x), y: add(a.y, b.y) });
const minus = (a: P, b: P): P => ({ x: sub(a.x, b.x), y: sub(a.y, b.y) });
const times = (a: P, t: Q): P => ({ x: mul(a.x, t), y: mul(a.y, t) });
const cross = (a: P, b: P) => sub(mul(a.x, b.y), mul(a.y, b.x));
const key = (p: P) => `${p.x.n}/${p.x.d},${p.y.n}/${p.y.d}`;
const eq = (a: P, b: P) => key(a) === key(b);
const between = (t: Q) => cmp(t, zero) >= 0 && cmp(t, one) <= 0;
type Segment = { a: P; b: P; source: string };
type Box = { x: number; y: number; width: number; height: number };
function on(p: P, a: P, b: P) {
  if (cross(minus(p, a), minus(b, a)).n) return false;
  const axis = cmp(a.x, b.x) ? "x" : "y";
  return between(div(sub(p[axis], a[axis]), sub(b[axis], a[axis])));
}
function intersections(a: Segment, b: Segment): P[] {
  const r = minus(a.b, a.a),
    s = minus(b.b, b.a),
    den = cross(r, s),
    delta = minus(b.a, a.a);
  if (!den.n)
    return [a.a, a.b, b.a, b.b].filter(
      (p) => on(p, a.a, a.b) && on(p, b.a, b.b),
    );
  const t = div(cross(delta, s), den),
    u = div(cross(delta, r), den);
  return between(t) && between(u) ? [plus(a.a, times(r, t))] : [];
}
function location(p: P, ring: P[]) {
  let inside = false;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i],
      b = ring[(i + 1) % ring.length];
    if (eq(a, b)) continue;
    if (on(p, a, b)) return 0;
    if (cmp(a.y, p.y) > 0 !== cmp(b.y, p.y) > 0) {
      const x = add(a.x, div(mul(sub(p.y, a.y), sub(b.x, a.x)), sub(b.y, a.y)));
      if (cmp(x, p.x) > 0) inside = !inside;
    }
  }
  return inside ? 1 : -1;
}
function boxContains(p: P, b: Box, direction?: P) {
  // Evaluate strict inequalities at p + infinitesimal*direction.
  const positive = (v: Q, d: Q) =>
    cmp(v, zero) > 0 || (!v.n && cmp(d, zero) > 0);
  const d = direction ?? { x: zero, y: zero };
  return (
    positive(sub(p.x, q(BigInt(b.x))), d.x) &&
    positive(sub(q(BigInt(b.x + b.width)), p.x), neg(d.x)) &&
    positive(sub(p.y, q(BigInt(b.y))), d.y) &&
    positive(sub(q(BigInt(b.y + b.height)), p.y), neg(d.y))
  );
}
type Edge = {
  a: P;
  b: P;
  sources: Set<string>;
  twin: Edge;
  next?: Edge;
  cycle?: number;
};
type Cycle = { ring: P[]; edges: Edge[]; area: Q; sample: P };
export type RoomRegion = {
  contour: Point[];
  holes: Point[][];
  area: number;
  signature: string;
  outerTokens: Set<string>;
  sample: Point;
  probe: P;
  containsExact: (p: P) => boolean;
  contains: (p: Point) => boolean;
};
export type RoomGeometry = {
  regions: RoomRegion[];
  at: (p: Point) => RoomRegion | undefined;
};

function deriveRooms(doc: Pick<Project, "model" | "project">, floorId: string) {
  const boxes = doc.model.walls
    .filter((w) => w.floorId === floorId)
    .map((w) => ({
      ...bounds(w, doc.project.base.width),
      id: w.id,
      horizontal: w.a.y === w.b.y,
    }));
  const segments: Segment[] = [];
  for (const b of boxes) {
    const corners = [
      { x: b.x, y: b.y },
      { x: b.x + b.width, y: b.y },
      { x: b.x + b.width, y: b.y + b.height },
      { x: b.x, y: b.y + b.height },
    ];
    corners.forEach((a, i) =>
      segments.push({
        a: rp(a),
        b: rp(corners[(i + 1) % 4]),
        source: `w:${b.id}:${i}`,
      }),
    );
  }
  for (const line of doc.model.roomBoundaries.filter(
    (l) => l.floorId === floorId,
  )) {
    // Normalize direction so changing endpoint order does not change identity.
    const [a, b] =
      line.a.x < line.b.x || (line.a.x === line.b.x && line.a.y < line.b.y)
        ? [line.a, line.b]
        : [line.b, line.a];
    if (a.x !== b.x || a.y !== b.y)
      segments.push({ a: rp(a), b: rp(b), source: `l:${line.id}` });
  }
  const cycles = planarCycles(segments, boxes);
  const positive = cycles.filter((c) => c.area.n > 0n);
  const holes = new Map<Cycle, Cycle[]>();
  for (const c of cycles.filter((c) => c.area.n < 0n)) {
    const owner = positive
      .filter((p) => location(c.sample, p.ring) === 1)
      .sort((a, b) => cmp(a.area, b.area))[0];
    if (owner) holes.set(owner, [...(holes.get(owner) ?? []), c]);
  }
  const tokens = (c: Cycle) =>
    new Set(
      c.edges
        .filter((e) => e.cycle !== e.twin.cycle)
        .flatMap((e) => [...e.sources]),
    );
  const regions = positive.map((c) => {
    const inner = holes.get(c) ?? [],
      outerTokens = tokens(c);
    const partitions = inner.filter((h) =>
      positive.some((p) => location(p.sample, h.ring) === 1),
    );
    const signature =
      [...outerTokens].sort().join("|") +
      "#" +
      partitions
        .map((h) => [...tokens(h)].sort().join("|"))
        .sort()
        .join("#");
    const containsR = (p: P) =>
      location(p, c.ring) === 1 &&
      inner.every((h) => location(p, h.ring) === -1);
    return {
      contour: c.ring.map(point),
      holes: inner.map((h) => h.ring.map(point)),
      area:
        number(inner.reduce((a, h) => add(a, h.area), c.area)) / 200_000_000,
      signature,
      outerTokens,
      sample: point(c.sample),
      probe: c.sample,
      containsExact: containsR,
      contains: (p: Point) =>
        Number.isFinite(p.x) &&
        Number.isFinite(p.y) &&
        containsR({ x: coordinate(p.x), y: coordinate(p.y) }),
    };
  });
  return {
    regions,
    at: (p: Point) => regions.find((r) => r.contains(p)),
    boxes,
    segments,
    positive,
  };
}

/** Shared exact arrangement; callers decide which filled faces constitute their measurement. */
function planarCycles(segments: Segment[], boxes: Box[] = []): Cycle[] {
  const cuts = segments.map(
    (s) =>
      new Map([
        [key(s.a), s.a],
        [key(s.b), s.b],
      ]),
  );
  for (let i = 0; i < segments.length; i++)
    for (let j = i + 1; j < segments.length; j++) {
      const a = segments[i],
        b = segments[j];
      // The constructed-area union also supplies rational vertices. Keep this
      // fast rejection exact, just like the intersection predicate itself.
      const disjoint = (axis: "x" | "y") => {
        const [a0, a1] =
          cmp(a.a[axis], a.b[axis]) < 0
            ? [a.a[axis], a.b[axis]]
            : [a.b[axis], a.a[axis]];
        const [b0, b1] =
          cmp(b.a[axis], b.b[axis]) < 0
            ? [b.a[axis], b.b[axis]]
            : [b.b[axis], b.a[axis]];
        return cmp(a1, b0) < 0 || cmp(b1, a0) < 0;
      };
      if (disjoint("x") || disjoint("y")) continue;
      for (const p of intersections(a, b)) {
        cuts[i].set(key(p), p);
        cuts[j].set(key(p), p);
      }
    }
  const unique = new Map<string, Edge>();
  const outgoing = new Map<string, Edge[]>();
  const edges: Edge[] = [];
  segments.forEach((s, i) => {
    const axis = cmp(s.a.x, s.b.x) ? "x" : "y",
      order = cmp(s.a[axis], s.b[axis]);
    const points = [...cuts[i].values()].sort(
      (a, b) => cmp(a[axis], b[axis]) * -order,
    );
    for (let j = 1; j < points.length; j++) {
      const a = points[j - 1],
        b = points[j],
        mid = times(plus(a, b), half),
        delta = minus(b, a),
        normal = { x: neg(delta.y), y: delta.x };
      const left = boxes.some((box) => boxContains(mid, box, normal)),
        right = boxes.some((box) =>
          boxContains(mid, box, times(normal, q(-1n))),
        );
      if (left && right) continue;
      const k = `${key(a)}|${key(b)}`,
        reverse = `${key(b)}|${key(a)}`;
      const existing = unique.get(k) ?? unique.get(reverse);
      if (existing) {
        const forward = eq(existing.a, a);
        existing.sources.add(`${s.source}:${forward ? "+" : "-"}`);
        existing.twin.sources.add(`${s.source}:${forward ? "-" : "+"}`);
        continue;
      }
      const edge = { a, b, sources: new Set([`${s.source}:+`]) } as Edge;
      const twin = {
        a: b,
        b: a,
        sources: new Set([`${s.source}:-`]),
        twin: edge,
      } as Edge;
      edge.twin = twin;
      unique.set(k, edge);
      edges.push(edge, twin);
      for (const e of [edge, twin]) {
        const list = outgoing.get(key(e.a)) ?? [];
        list.push(e);
        outgoing.set(key(e.a), list);
      }
    }
  });
  for (const list of outgoing.values())
    list.sort((a, b) => {
      const u = minus(a.b, a.a),
        v = minus(b.b, b.a);
      const upper = (d: P) =>
        cmp(d.y, zero) > 0 || (!d.y.n && cmp(d.x, zero) >= 0) ? 0 : 1;
      return upper(u) - upper(v) || -cmp(cross(u, v), zero);
    });
  for (const e of edges) {
    const list = outgoing.get(key(e.b))!;
    e.next = list[(list.indexOf(e.twin) + list.length - 1) % list.length];
  }
  function sample(e: Edge): P {
    const mid = times(plus(e.a, e.b), half),
      d = minus(e.b, e.a),
      normal = { x: neg(d.y), y: d.x };
    let distance = one;
    for (const other of unique.values()) {
      const v = minus(other.b, other.a),
        den = cross(normal, v);
      if (!den.n) continue;
      const delta = minus(other.a, mid),
        t = div(cross(delta, v), den),
        u = div(cross(delta, normal), den);
      if (cmp(t, zero) > 0 && between(u) && cmp(t, distance) < 0) distance = t;
    }
    return plus(mid, times(normal, mul(distance, half)));
  }
  const cycles: Cycle[] = [];
  let cycleIndex = 0;
  for (const start of edges) {
    if (start.cycle !== undefined) continue;
    const walk: Edge[] = [];
    let e = start;
    do {
      e.cycle = cycleIndex;
      walk.push(e);
      e = e.next!;
    } while (e !== start);
    cycleIndex++;
    const area = walk.reduce(
      (sum, edge) => add(sum, cross(edge.a, edge.b)),
      zero,
    );
    if (!area.n) continue;
    const p = sample(start);
    if (boxes.some((b) => boxContains(p, b))) continue;
    cycles.push({ ring: walk.map((e) => e.a), edges: walk, area, sample: p });
  }
  return cycles;
}

export function roomGeometry(
  doc: Pick<Project, "model" | "project">,
  floorId: string,
): RoomGeometry {
  return deriveRooms(doc, floorId);
}

export type ConstructedArea = {
  area: number | null;
  closed: boolean;
  pending: boolean;
};

/** Fill enclosed free faces, their bounding wall bands and corner joints.
 * Longitudinal intervals come from actual face edges, never whole wall IDs:
 * an exterior continuation therefore cannot inflate the enclosed footprint.
 * The second arrangement unions the pieces and fills nested courtyards. */
export function floorAreaGeometry(
  doc: Pick<Project, "model" | "project">,
  floorId: string,
): { rooms: RoomGeometry; constructed: ConstructedArea } {
  const rooms = deriveRooms(doc, floorId);
  const { positive, boxes, segments } = rooms;
  if (!positive.length)
    return {
      rooms,
      constructed: {
        area: segments.length ? null : 0,
        closed: false,
        pending: !!segments.length,
      },
    };
  const pieces: P[][] = positive.map((c) => c.ring);
  type Strip = { box: (typeof boxes)[number]; lo: P; hi: P };
  const strips: Strip[] = [];
  const rectangle = (lo: P, hi: P) => [
    lo,
    { x: hi.x, y: lo.y },
    hi,
    { x: lo.x, y: hi.y },
  ];
  for (const c of positive)
    for (const e of c.edges) {
      if (e.cycle === e.twin.cycle) continue;
      for (const box of boxes) {
        if (![...e.sources].some((s) => s.startsWith(`w:${box.id}:`))) continue;
        // End caps already are external faces; only long sides span thickness.
        if (box.horizontal ? cmp(e.a.y, e.b.y) !== 0 : cmp(e.a.x, e.b.x) !== 0)
          continue;
        const lo = {
          x: box.horizontal
            ? cmp(e.a.x, e.b.x) < 0
              ? e.a.x
              : e.b.x
            : q(BigInt(box.x)),
          y: box.horizontal
            ? q(BigInt(box.y))
            : cmp(e.a.y, e.b.y) < 0
              ? e.a.y
              : e.b.y,
        };
        const hi = {
          x: box.horizontal
            ? cmp(e.a.x, e.b.x) > 0
              ? e.a.x
              : e.b.x
            : q(BigInt(box.x + box.width)),
          y: box.horizontal
            ? q(BigInt(box.y + box.height))
            : cmp(e.a.y, e.b.y) > 0
              ? e.a.y
              : e.b.y,
        };
        strips.push({ box, lo, hi });
        pieces.push(rectangle(lo, hi));
      }
    }
  for (let i = 0; i < strips.length; i++)
    for (let j = i + 1; j < strips.length; j++) {
      const a = strips[i],
        b = strips[j];
      if (a.box.horizontal === b.box.horizontal) continue;
      const lo = rp({
        x: Math.max(a.box.x, b.box.x),
        y: Math.max(a.box.y, b.box.y),
      });
      const hi = rp({
        x: Math.min(a.box.x + a.box.width, b.box.x + b.box.width),
        y: Math.min(a.box.y + a.box.height, b.box.y + b.box.height),
      });
      if (cmp(lo.x, hi.x) >= 0 || cmp(lo.y, hi.y) >= 0) continue;
      const touches = (s: Strip) =>
        cmp(lo.x, s.hi.x) <= 0 &&
        cmp(hi.x, s.lo.x) >= 0 &&
        cmp(lo.y, s.hi.y) <= 0 &&
        cmp(hi.y, s.lo.y) >= 0;
      if (touches(a) && touches(b)) pieces.push(rectangle(lo, hi));
    }
  const pieceEdges = pieces.flatMap((ring, i) =>
    ring.flatMap((a, j) => {
      const b = ring[(j + 1) % ring.length];
      return eq(a, b) ? [] : [{ a, b, source: `p:${i}` }];
    }),
  );
  const exterior = planarCycles(pieceEdges).filter((c) => c.area.n < 0n);
  const outer = exterior.filter(
    (c) =>
      !exterior.some(
        (other) => other !== c && location(c.sample, other.ring) === 1,
      ),
  );
  const covered = (p: P) => outer.some((c) => location(p, c.ring) >= 0);
  const perimeter = outer.flatMap((c) => c.edges);
  const pending = segments.some((s) => {
    const points = new Map([
      [key(s.a), s.a],
      [key(s.b), s.b],
    ]);
    for (const edge of perimeter)
      for (const p of intersections(s, { ...edge, source: "perimeter" }))
        points.set(key(p), p);
    const axis = cmp(s.a.x, s.b.x) ? "x" : "y";
    const ordered = [...points.values()].sort((a, b) => cmp(a[axis], b[axis]));
    return ordered.some(
      (p, i) => i > 0 && !covered(times(plus(ordered[i - 1], p), half)),
    );
  });
  return {
    rooms,
    constructed: {
      area:
        number(neg(outer.reduce((sum, c) => add(sum, c.area), zero))) /
        200_000_000,
      closed: true,
      pending,
    },
  };
}

export const roomAreaText = (area: number) =>
  `${area.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false })} m²`;
export const validRoomPoint = (p: Point) =>
  [p.x, p.y].every((n) => Number.isSafeInteger(n) && Math.abs(n) <= LIMIT);
export const validRoomBoundary = (b: RoomBoundary) =>
  validRoomPoint(b.a) &&
  validRoomPoint(b.b) &&
  (b.a.x !== b.b.x || b.a.y !== b.b.y);

export function addRoomLabel<T extends EditableProject>(
  doc: T,
  floorId: string,
  p: Point,
): { doc: T; id: string } {
  if (!validRoomPoint(p))
    throw new Error("Escolha um ponto dentro dos limites do editor.");
  const geometry = roomGeometry(doc, floorId),
    region = geometry.at(p);
  if (!region)
    throw new Error(
      "Não foi encontrado um contorno fechado. Confira as paredes e linhas de fechamento.",
    );
  const existing = doc.model.roomLabels.find(
    (l) =>
      l.floorId === floorId && !l.review && geometry.at(l.reference) === region,
  );
  if (existing) return { doc, id: existing.id };
  const floor = doc.model.floors.find((f) => f.id === floorId);
  if (!floor) throw new Error("Pavimento ausente.");
  const sequence = (floor.roomSequence ?? 0) + 1;
  if (!Number.isSafeInteger(sequence))
    throw new Error("Limite da numeração de ambientes atingido.");
  const label: RoomLabel = {
    id: crypto.randomUUID(),
    floorId,
    name: `Ambiente ${sequence}`,
    position: { ...p },
    reference: { ...p },
    review: false,
  };
  return {
    doc: {
      ...doc,
      model: {
        ...doc.model,
        floors: doc.model.floors.map((f) =>
          f.id === floorId ? { ...f, roomSequence: sequence } : f,
        ),
        roomLabels: [...doc.model.roomLabels, label],
      },
    },
    id: label.id,
  };
}

/** Explicit recovery keeps the original reference and never claims another valid label's region. */
export function revalidateRoomLabel<T extends EditableProject>(
  doc: T,
  id: string,
): T {
  const label = doc.model.roomLabels.find((l) => l.id === id);
  if (!label?.review) return doc;
  const geometry = roomGeometry(doc, label.floorId);
  const region = geometry.at(label.reference);
  if (
    !region ||
    doc.model.roomLabels.some(
      (l) =>
        l.floorId === label.floorId &&
        !l.review &&
        geometry.at(l.reference) === region,
    )
  )
    return doc;
  return {
    ...doc,
    model: {
      ...doc.model,
      roomLabels: doc.model.roomLabels.map((l) =>
        l.id === id ? { ...l, review: false } : l,
      ),
    },
  };
}

/** Run before the single save/history operation, never during undo/redo. */
export function reconcileRooms(previous: Project, next: Project): Project {
  let labels = next.model.roomLabels;
  for (const floor of next.model.floors) {
    const oldLabels = previous.model.roomLabels.filter(
      (l) => l.floorId === floor.id && !l.review,
    );
    if (!oldLabels.length) continue;
    const inputs = (d: Project) =>
      JSON.stringify([
        d.project.base.width,
        d.model.walls
          .filter((w) => w.floorId === floor.id)
          .map((w) => [w.id, w.a, w.b, w.side]),
        d.model.roomBoundaries.filter((b) => b.floorId === floor.id),
      ]);
    if (inputs(previous) === inputs(next)) continue;
    const before = roomGeometry(previous, floor.id),
      after = roomGeometry(next, floor.id);
    const matched = new Map<RoomRegion, RoomRegion>();
    for (const a of before.regions) {
      const candidates = after.regions.filter(
        (b) => a.signature === b.signature,
      );
      if (
        candidates.length === 1 &&
        before.regions.filter((r) => r.signature === a.signature).length === 1
      )
        matched.set(a, candidates[0]);
    }
    // Match remaining regions by the unchanged boundary sides. Exact matches
    // are removed first, so a moving divider does not look like a merge.
    const oldRest = before.regions.filter((r) => !matched.has(r)),
      newRest = after.regions.filter((r) => ![...matched.values()].includes(r));
    const related = (a: RoomRegion, b: RoomRegion) =>
      [...a.outerTokens].some((t) => b.outerTokens.has(t));
    for (const a of oldRest) {
      const choices = newRest.filter((b) => related(a, b));
      if (
        choices.length === 1 &&
        oldRest.filter((o) => related(o, choices[0])).length === 1
      )
        matched.set(a, choices[0]);
    }
    const unusedAfter = after.regions.filter(
      (r) => ![...matched.values()].includes(r),
    );
    const unusedBefore = before.regions.filter((r) => !matched.has(r));
    for (const [a, b] of matched) {
      // New/removed enclosed islands can partition a room without sharing any
      // original boundary ID (unlike a solid island, which has no free face).
      if (
        unusedAfter.some((r) => a.containsExact(r.probe)) ||
        unusedBefore.some((r) => b.containsExact(r.probe))
      )
        matched.delete(a);
    }
    labels = labels.map((l) => {
      if (
        l.floorId !== floor.id ||
        l.review ||
        !oldLabels.some((o) => o.id === l.id)
      )
        return l;
      const a = before.at(l.reference),
        b = after.at(l.reference);
      return !a || !b || matched.get(a) !== b ? { ...l, review: true } : l;
    });
  }
  return labels === next.model.roomLabels
    ? next
    : { ...next, model: { ...next.model, roomLabels: labels } };
}
