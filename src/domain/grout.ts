import { bounds, type Point, type Project } from "./project";
import type { Composition } from "./composition";
import { openingBox } from "./openings";

export const MAX_GROUT_ADJUSTMENTS = 10000;
export const MAX_GROUT_AXES = 20000;
export const MAX_GROUT_INTERVALS = 200000;
// Identity uses the integer world origin of the nominal cell. Its displayed
// centre is derived, including for modules with an odd number of 0.1mm units.
export const groutId = (p: Point) => `${p.x}:${p.y}`;
export type GroutAxis = Point & {
  id: string;
  wallIds: string[];
  origins: string[];
  intervals: { bottom: number; top: number }[];
};
export function activeGrout(axis: GroutAxis, bottom: number, top: number) {
  return axis.intervals.some((i) => i.bottom < top && i.top > bottom);
}
export function courseCells(doc: Project, result: Composition, course: number) {
  const m = doc.project.base.width,
    cells = new Map<string, Point & { wallIds: string[] }>();
  const walls = new Map(doc.model.walls.map((w) => [w.id, w]));
  for (const p of result.courses[course - 1]?.pieces ?? [])
    for (let y = p.y; y < p.y + p.height; y += m)
      for (let x = p.x; x < p.x + p.width; x += m) {
        const cell = {
          x,
          y,
          wallIds: p.wallIds
            .filter((id) => {
              const w = walls.get(id);
              if (!w || w.height < course * doc.project.base.height)
                return false;
              const b = bounds(w, m);
              return (
                x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height
              );
            })
            .sort(),
        };
        cells.set(groutId(cell), cell);
      }
  return [...cells.values()].sort((a, b) => a.y - b.y || a.x - b.x);
}
export function toggleGrout(
  doc: Project,
  cell: Point & { wallIds: string[] },
  present: boolean,
): Project {
  if (doc.schemaVersion === 6) {
    const eligible = doc.adjustments.grout.filter(
      (a) =>
        groutId(a) === groutId(cell) &&
        a.wallIds.some((id) => cell.wallIds.includes(id)),
    );
    if (
      !eligible.length &&
      doc.adjustments.grout.length >= MAX_GROUT_ADJUSTMENTS
    )
      throw new Error("Limite de ajustes de graute atingido.");
    const action = present ? ("exclude" as const) : ("include" as const);
    return {
      ...doc,
      adjustments: {
        ...doc.adjustments,
        grout: eligible.length
          ? doc.adjustments.grout.map((a) =>
              eligible.includes(a) ? { ...a, action } : a,
            )
          : [
              ...doc.adjustments.grout,
              {
                id: crypto.randomUUID(),
                x: cell.x,
                y: cell.y,
                wallIds: [...cell.wallIds].sort(),
                action,
              },
            ],
      },
    };
  }
  const previous = doc.adjustments.grout.find(
    (a) => groutId(a) === groutId(cell),
  );
  if (!previous && doc.adjustments.grout.length >= MAX_GROUT_ADJUSTMENTS)
    throw new Error("Limite de ajustes de graute atingido.");
  return {
    ...doc,
    adjustments: {
      ...doc.adjustments,
      grout: [
        ...doc.adjustments.grout.filter((a) => groutId(a) !== groutId(cell)),
        {
          id: previous?.id ?? crypto.randomUUID(),
          x: cell.x,
          y: cell.y,
          wallIds: [...cell.wallIds].sort(),
          action: present ? "exclude" : "include",
        },
      ],
    },
  };
}
export function discardGroutAdjustment(doc: Project, id: string): Project {
  return {
    ...doc,
    adjustments: {
      ...doc.adjustments,
      grout: doc.adjustments.grout.filter((a) => a.id !== id),
    },
  };
}
export function applyGrout(doc: Project, result: Composition): Composition {
  const m = doc.project.base.width,
    f = doc.model.floors[0],
    settings = doc.project.groutSettings;
  const wallMap = new Map(doc.model.walls.map((w) => [w.id, w]));
  result.grouts = [];
  const report = (
    code: string,
    message: string,
    wallIds: string[] = [],
    p: Point = { x: 0, y: 0 },
    adjustmentIds?: string[],
  ) => {
    result.diagnostics.push({
      code,
      message,
      severity: "error",
      category:
        code === "grout-limit"
          ? "limit"
          : code === "grout-distance-off-grid"
            ? "input"
            : "geometry",
      wallIds: [...wallIds].sort(),
      course: 1,
      x: p.x,
      y: p.y,
      ...(adjustmentIds ? { adjustmentIds } : {}),
    });
  };
  if (doc.adjustments.grout.length > MAX_GROUT_ADJUSTMENTS) {
    report(
      "grout-limit",
      "Limite de ajustes de graute excedido. Modelo preservado; grautes não calculados.",
    );
    return result;
  }
  // Actual composed masonry defines both eligible markers and vertical spans.
  const cells = new Map<string, GroutAxis>();
  const byWall = new Map<string, Set<string>>();
  let intervalCount = 0;
  for (const row of result.courses) {
    for (const c of courseCells(doc, result, row.number)) {
      const id = groutId(c),
        axis = cells.get(id) ?? {
          id,
          x: c.x,
          y: c.y,
          wallIds: [],
          origins: [],
          intervals: [],
        };
      axis.wallIds = [...new Set([...axis.wallIds, ...c.wallIds])].sort();
      for (const wallId of c.wallIds) {
        const ids = byWall.get(wallId) ?? new Set<string>();
        ids.add(id);
        byWall.set(wallId, ids);
      }
      const bottom = f.level + row.bottom,
        top = f.level + row.top,
        last = axis.intervals.at(-1);
      if (last?.top === bottom) last.top = top;
      else {
        axis.intervals.push({ bottom, top });
        intervalCount++;
      }
      cells.set(id, axis);
      if (cells.size > MAX_GROUT_AXES || intervalCount > MAX_GROUT_INTERVALS) {
        report(
          "grout-limit",
          "Limite de eixos ou intervalos excedido. Modelo preservado; grautes não calculados.",
        );
        return result;
      }
    }
  }
  const candidates = new Map<string, Set<string>>();
  const add = (p: Point, origin: string) => {
    const id = groutId(p);
    if (!cells.has(id)) return;
    const origins = candidates.get(id) ?? new Set<string>();
    origins.add(origin);
    candidates.set(id, origins);
  };
  const junctions = new Set<string>();
  for (const comp of result.components)
    for (const j of comp.junctions) {
      if (j.kind === "cross") continue;
      junctions.add(groutId(j));
      if (settings.junctions) add(j, `junction:${j.kind}:${groutId(j)}`);
    }
  if (settings.openings)
    for (const o of doc.model.openings) {
      const w = wallMap.get(o.wallId);
      if (!w) continue;
      const b = openingBox(o, w, m),
        horizontal = w.a.y === w.b.y;
      for (const p of horizontal
        ? [
            { x: b.x - m, y: b.y },
            { x: b.x + b.width, y: b.y },
          ]
        : [
            { x: b.x, y: b.y - m },
            { x: b.x, y: b.y + b.height },
          ]) {
        if (cells.get(groutId(p))?.wallIds.includes(w.id))
          add(p, `opening:${o.id}`);
      }
    }
  if (settings.ends)
    for (const w of doc.model.walls) {
      const b = bounds(w, m),
        horizontal = w.a.y === w.b.y;
      for (const p of [
        { x: b.x, y: b.y },
        horizontal
          ? { x: b.x + b.width - m, y: b.y }
          : { x: b.x, y: b.y + b.height - m },
      ]) {
        const cell = cells.get(groutId(p));
        if (
          !cell?.wallIds.includes(w.id) ||
          cell.wallIds.length > 1 ||
          junctions.has(groutId(p))
        )
          continue;
        const meets = [
          [m, 0],
          [-m, 0],
          [0, m],
          [0, -m],
        ].some(([dx, dy]) =>
          cells
            .get(groutId({ x: p.x + dx, y: p.y + dy }))
            ?.wallIds.some((id) => id !== w.id),
        );
        if (!meets) add(p, `end:${w.id}`);
      }
    }
  const anchors = new Map<string, number[]>();
  for (const id of candidates.keys())
    for (const wallId of cells.get(id)!.wallIds) {
      const w = wallMap.get(wallId)!;
      const positions = anchors.get(wallId) ?? [];
      positions.push(w.a.y === w.b.y ? cells.get(id)!.x : cells.get(id)!.y);
      anchors.set(wallId, positions);
    }
  if (settings.intervals && settings.distance < m)
    report(
      "grout-distance-off-grid",
      "Distância de graute menor que um módulo. Ajuste explicitamente a distância nas configurações; distribuição por intervalos não aplicada.",
      doc.model.walls.map((w) => w.id),
    );
  else if (settings.intervals)
    for (const w of doc.model.walls) {
      if (!byWall.has(w.id)) continue;
      const b = bounds(w, m),
        horizontal = w.a.y === w.b.y,
        start = horizontal ? b.x : b.y,
        end = start + (horizontal ? b.width : b.height) - m;
      const sorted = [
          ...new Set([start, end, ...(anchors.get(w.id) ?? [])]),
        ].sort((a, b) => a - b),
        step = Math.floor(settings.distance / m) * m;
      for (let i = 1; i < sorted.length; i++)
        for (
          let s = sorted[i - 1] + step;
          sorted[i] - (s - step) > settings.distance;
          s += step
        ) {
          const p = horizontal ? { x: s, y: b.y } : { x: b.x, y: s };
          if (cells.get(groutId(p))?.wallIds.includes(w.id))
            add(p, `interval:${w.id}`);
        }
    }
  // Adjustments never participate in automatic anchors or redistribute removals.
  for (const a of [...doc.adjustments.grout].sort((a, b) =>
    result.convention === "nominal-v7"
      ? Number(a.action === "exclude") - Number(b.action === "exclude") ||
        a.y - b.y ||
        a.x - b.x ||
        a.id.localeCompare(b.id)
      : a.y - b.y || a.x - b.x,
  )) {
    const id = groutId(a),
      cell = cells.get(id);
    if (!cell || !a.wallIds.some((wallId) => cell.wallIds.includes(wallId))) {
      report(
        "grout-adjustment-target-missing",
        "Ajuste de graute sem alvenaria na coordenada original. Preservado e não aplicado; descarte o ajuste ou corrija a geometria.",
        a.wallIds,
        a,
        [a.id],
      );
      continue;
    }
    if (a.action === "exclude") candidates.delete(id);
    else add(a, `manual:${a.id}`);
  }
  result.grouts = [...candidates]
    .map(([id, origins]) => ({
      ...cells.get(id)!,
      origins: [...origins].sort(),
    }))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  return result;
}
