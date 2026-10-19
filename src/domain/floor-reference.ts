import { bounds, type EditableProject, type Project } from "./project";

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

// Confirmed world geometry only. Openings never enlarge their hosts' bounds.
export function floorPlanBounds(
  doc: EditableProject,
  floorIds: readonly string[],
  includeSlabs = true,
  measureFloorId?: string,
) {
  const boxes = doc.model.walls
    .filter((w) => floorIds.includes(w.floorId))
    .map((w) => bounds(w, doc.project.base.width));
  for (const m of doc.model.measurements.filter(
    (m) => m.floorId === measureFloorId,
  )) {
    boxes.push({
      x: Math.min(m.a.x, m.b.x),
      y: Math.min(m.a.y, m.b.y),
      width: Math.abs(m.b.x - m.a.x),
      height: Math.abs(m.b.y - m.a.y),
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
