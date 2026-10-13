import {
  bounds,
  length,
  LIMIT,
  snapPoint,
  type Point,
  type Project,
  type Wall,
} from "./project";
import { wallAxis, wallStart } from "./openings";
import { componentId, signature } from "./composition";
import { MAX_GROUT_ADJUSTMENTS } from "./grout";

export type WallEdit = {
  doc: Project;
  selectedId: string;
  participants: string[];
  message: string;
};
const unique = (ids: string[]) => [...new Set(ids)].sort();
const end = (w: Wall) => wallStart(w) + length(w);
function sameLine(a: Wall, b: Wall, m: number) {
  const axis = wallAxis(a),
    ba = bounds(a, m),
    bb = bounds(b, m);
  return (
    axis === wallAxis(b) &&
    a.floorId === b.floorId &&
    a.side === b.side &&
    (axis === "x"
      ? a.a.y === b.a.y && ba.y === bb.y
      : a.a.x === b.a.x && ba.x === bb.x)
  );
}
const touches = (a: Wall, b: Wall) =>
  end(a) === wallStart(b) || end(b) === wallStart(a);
const overlaps = (a: Wall, b: Wall) =>
  Math.min(end(a), end(b)) > Math.max(wallStart(a), wallStart(b));

function checkGeometry(doc: Project) {
  const m = doc.project.base.width;
  for (const w of doc.model.walls) {
    const b = bounds(w, m);
    if (
      [
        w.a.x,
        w.a.y,
        w.b.x,
        w.b.y,
        b.x,
        b.y,
        b.x + b.width,
        b.y + b.height,
      ].some((n) => !Number.isSafeInteger(n) || Math.abs(n) > LIMIT)
    )
      throw new Error(
        "Movimento ou união excede o limite de coordenadas do editor.",
      );
  }
  for (const a of doc.adjustments.grout)
    if ([a.x, a.y].some((n) => !Number.isSafeInteger(n) || Math.abs(n) > LIMIT))
      throw new Error("Ajuste de graute excede o limite de coordenadas.");
  for (const a of doc.adjustments.channels)
    if (
      a.scope?.kind === "range" &&
      [a.scope.from, a.scope.to].some(
        (n) => !Number.isSafeInteger(n) || Math.abs(n) > LIMIT,
      )
    )
      throw new Error("Alcance de canaleta excede o limite de coordenadas.");
}

/** Geometry-only planning: no generation or persistent UUIDs while dragging. */
function consolidate(
  input: Project,
  candidate: Wall,
  moving: boolean,
  materialize: boolean,
): WallEdit {
  const m = input.project.base.width;
  const others = input.model.walls.filter((w) => w.id !== candidate.id);
  const direct = others.filter(
    (w) => sameLine(candidate, w, m) && touches(candidate, w),
  );
  let message = "";
  if (!moving && direct.length) {
    if (new Set(direct.map((w) => w.height)).size > 1)
      message = "Alturas diferentes: as paredes permanecerão separadas.";
    else candidate = { ...candidate, height: direct[0].height };
  }
  const participants = [candidate];
  if (!message) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const w of others) {
        if (participants.some((p) => p.id === w.id)) continue;
        if (
          sameLine(candidate, w, m) &&
          participants.some((p) => touches(p, w))
        ) {
          if (w.height !== candidate.height) {
            message = "Alturas diferentes: a união para nesta parede.";
            continue;
          }
          participants.push(w);
          changed = true;
        }
      }
    }
  }
  // Never use consolidation to repair positive overlap, including old chains.
  if (
    participants.some((p) =>
      others.some((w) => w.id !== p.id && sameLine(p, w, m) && overlaps(p, w)),
    )
  ) {
    participants.splice(1);
    message = "Sobreposição: as paredes serão preservadas para revisão.";
  }
  const existing = participants.filter((p) =>
    input.model.walls.some((w) => w.id === p.id),
  );
  const survivor =
    [...existing].sort(
      (a, b) => wallStart(a) - wallStart(b) || a.id.localeCompare(b.id),
    )[0] ?? candidate;
  const axis = wallAxis(candidate),
    lo = Math.min(...participants.map(wallStart)),
    hi = Math.max(...participants.map(end));
  const selectedId =
    survivor.id === "preview-wall" && materialize
      ? crypto.randomUUID()
      : survivor.id;
  const merged: Wall = {
    ...survivor,
    id: selectedId,
    a: {
      ...survivor.a,
      [axis]: survivor.a[axis] <= survivor.b[axis] ? lo : hi,
    },
    b: {
      ...survivor.b,
      [axis]: survivor.a[axis] <= survivor.b[axis] ? hi : lo,
    },
  };
  const absorbed = new Set(participants.map((w) => w.id));
  const mapping = (id: string) => (absorbed.has(id) ? selectedId : id);
  const source = new Map(input.model.walls.map((w) => [w.id, w]));
  const openings = input.model.openings.map((o) => {
    const old = source.get(o.wallId);
    return old && absorbed.has(o.wallId)
      ? { ...o, wallId: selectedId, offset: o.offset + wallStart(old) - lo }
      : o;
  });
  const channels = input.adjustments.channels.map((a) => {
    const w = source.get(a.wallId);
    if (!w || !absorbed.has(w.id)) return a;
    return {
      ...a,
      wallId: selectedId,
      scope:
        existing.length > 1 && a.scope?.kind !== "range"
          ? { kind: "range" as const, from: wallStart(w), to: end(w) }
          : (a.scope ?? { kind: "wall" as const }),
    };
  });
  const walls = [...others.filter((w) => !absorbed.has(w.id)), merged];
  const junctions = input.adjustments.junctions.map((a) => {
    if (!a.wallIds.some((id) => absorbed.has(id))) return a;
    const wallIds = unique(a.wallIds.map(mapping));
    // A pure resegmentation may keep phase; geometry added/translated cannot.
    const unchanged =
      existing.length > 1 &&
      existing.reduce((n, w) => n + length(w), 0) === hi - lo &&
      !moving &&
      a.binding !== "pending" &&
      signature(a.wallIds.map((id) => source.get(id)!).filter(Boolean)) ===
        a.signature;
    return {
      ...a,
      wallIds,
      componentId: unchanged ? componentId(wallIds) : a.componentId,
      signature: unchanged
        ? signature(walls.filter((w) => wallIds.includes(w.id)))
        : a.signature,
      binding: unchanged ? ("active" as const) : ("pending" as const),
    };
  });
  const doc: Project = {
    ...input,
    model: { ...input.model, walls, openings },
    adjustments: {
      ...input.adjustments,
      channels,
      junctions,
      grout: input.adjustments.grout.map((a) => ({
        ...a,
        wallIds: unique(a.wallIds.map(mapping)),
      })),
    },
  };
  checkGeometry(doc);
  return { doc, selectedId, participants: existing.map((w) => w.id), message };
}

export function createContinuation(
  doc: Project,
  wall: Wall,
  materialize = true,
): WallEdit {
  return consolidate(doc, { ...wall, id: "preview-wall" }, false, materialize);
}
export function moveWall(
  doc: Project,
  id: string,
  delta: Point,
  materialize = true,
): WallEdit {
  const w = doc.model.walls.find((w) => w.id === id);
  if (!w) throw new Error("Parede não encontrada.");
  delta = snapPoint(delta, doc.project.base.width);
  if (!delta.x && !delta.y)
    return { doc, selectedId: id, participants: [], message: "" };
  const shared = doc.adjustments.grout.filter(
    (a) => a.wallIds.includes(id) && a.wallIds.length > 1,
  ).length;
  if (doc.adjustments.grout.length + shared > MAX_GROUT_ADJUSTMENTS)
    throw new Error(
      "Limite de ajustes de graute atingido; movimento cancelado.",
    );
  const translated: Project = {
    ...doc,
    model: {
      ...doc.model,
      walls: doc.model.walls.map((p) =>
        p.id === id
          ? {
              ...p,
              a: { x: p.a.x + delta.x, y: p.a.y + delta.y },
              b: { x: p.b.x + delta.x, y: p.b.y + delta.y },
            }
          : p,
      ),
    },
    adjustments: {
      ...doc.adjustments,
      channels: doc.adjustments.channels.map((a) =>
        a.wallId === id && a.scope?.kind === "range"
          ? {
              ...a,
              scope: {
                ...a.scope,
                from: a.scope.from + delta[wallAxis(w)],
                to: a.scope.to + delta[wallAxis(w)],
              },
            }
          : a,
      ),
      junctions: doc.adjustments.junctions.map((a) =>
        a.wallIds.includes(id) ? { ...a, binding: "pending" as const } : a,
      ),
      grout: doc.adjustments.grout.flatMap((a) => {
        if (!a.wallIds.includes(id)) return [a];
        const moved = {
          ...a,
          x: a.x + delta.x,
          y: a.y + delta.y,
          wallIds: [id],
        };
        return a.wallIds.length === 1
          ? [moved]
          : [
              { ...a, wallIds: a.wallIds.filter((w) => w !== id) },
              {
                ...moved,
                id: materialize ? crypto.randomUUID() : `preview-${a.id}`,
              },
            ];
      }),
    },
  };
  return consolidate(
    translated,
    translated.model.walls.find((p) => p.id === id)!,
    true,
    materialize,
  );
}
