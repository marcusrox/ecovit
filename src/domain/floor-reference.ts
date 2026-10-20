import { bounds, type EditableProject, type Project } from "./project";
import { openingBox } from "./openings";
import { openingSymbolStrokes } from "./opening-symbol";
import { measurementGeometry } from "./measurements";

export type FloorReference = "none" | "below" | "above";

export function resolveFloorReference(
  doc: Pick<Project, "model">,
  activeFloorId: string | null,
  direction: FloorReference,
) {
  const floors = [...doc.model.floors].sort((a, b) => a.level - b.level),
    index = floors.findIndex((f) => f.id === activeFloorId);
  if (index < 0 || direction === "none") return undefined;
  return floors[index + (direction === "below" ? -1 : 1)];
}

// Confirmed world geometry, including schematic projections in Planta.
export function floorPlanBounds(
  doc: EditableProject,
  floorIds: readonly string[],
  includeSlabs = true,
  measureFloorId?: string,
  includeSymbols = true,
) {
  const boxes = doc.model.walls
    .filter((w) => floorIds.includes(w.floorId))
    .map((w) => bounds(w, doc.project.base.width));
  if (includeSymbols) {
    const walls = new Map(
      doc.model.walls
        .filter((w) => floorIds.includes(w.floorId))
        .map((w) => [w.id, w]),
    );
    for (const o of doc.model.openings) {
      const w = walls.get(o.wallId);
      if (!w) continue;
      const b = openingBox(o, w, doc.project.base.width);
      for (const stroke of openingSymbolStrokes(
        o,
        w.a.y === w.b.y,
        b.x,
        b.y,
        b.width,
        b.height,
      ))
        for (const p of stroke.points)
          boxes.push({ ...p, width: 0, height: 0 });
    }
  }
  for (const m of doc.model.measurements.filter(
    (m) => m.floorId === measureFloorId,
  )) {
    const line = measurementGeometry(m);
    const xs = [m.a.x, m.b.x, line.a.x, line.b.x];
    const ys = [m.a.y, m.b.y, line.a.y, line.b.y];
    boxes.push({
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    });
  }
  if (includeSlabs)
    for (const slab of doc.model.slabs.filter((s) =>
      floorIds.includes(s.floorId),
    )) {
      const xs = slab.contour.map((p) => p.x),
        ys = slab.contour.map((p) => p.y),
        x = Math.min(...xs),
        y = Math.min(...ys);
      boxes.push({
        x,
        y,
        width: Math.max(...xs) - x,
        height: Math.max(...ys) - y,
      });
    }
  if (!boxes.length) return null;
  const x = Math.min(...boxes.map((b) => b.x)),
    y = Math.min(...boxes.map((b) => b.y));
  return {
    x,
    y,
    width: Math.max(...boxes.map((b) => b.x + b.width)) - x,
    height: Math.max(...boxes.map((b) => b.y + b.height)) - y,
  };
}
