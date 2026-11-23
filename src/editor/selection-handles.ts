import type { LocalProject, Point } from "../domain/project";
import { openingBox } from "../domain/openings";
import { elementCorners, elementSideHandle } from "../domain/image-elements";
import {
  compassCorners,
  compassPoint,
  compassSelectionId,
} from "../domain/terrain-compass";

type Handle = {
  point: Point;
  kind:
    | "wall"
    | "opening"
    | "measurement"
    | "room"
    | "furniture"
    | "slab"
    | "terrain"
    | "compass";
  end?: "a" | "b";
  radius: number;
};
// These confirmed handles remain above annotation bodies for both painting and targeting.
export function selectionHandles(
  doc: LocalProject,
  id: string | null,
  scale: number,
  terrainEditing: boolean,
): Handle[] {
  const wall = doc.model.walls.find((w) => w.id === id);
  if (wall)
    return (["a", "b"] as const).map((end) => ({
      point: wall[end],
      kind: "wall",
      end,
      radius: 11,
    }));
  const opening = doc.model.openings.find((o) => o.id === id);
  if (opening) {
    const w = doc.model.walls.find((w) => w.id === opening.wallId)!;
    const b = openingBox(opening, w, doc.project.base.width);
    const points =
      w.a.y === w.b.y
        ? [
            { x: b.x, y: b.y + b.height / 2 },
            { x: b.x + b.width, y: b.y + b.height / 2 },
          ]
        : [
            { x: b.x + b.width / 2, y: b.y },
            { x: b.x + b.width / 2, y: b.y + b.height },
          ];
    return points.map((point, i) => ({
      point,
      kind: "opening",
      end: i ? "b" : "a",
      radius: 9,
    }));
  }
  const line =
    doc.model.measurements.find((m) => m.id === id) ??
    doc.model.roomBoundaries.find((m) => m.id === id);
  if (line)
    return [line.a, line.b].map((point) => ({
      point,
      kind: doc.model.measurements.includes(line) ? "measurement" : "room",
      radius: 9,
    }));
  const image = doc.model.imageElements.find((e) => e.id === id);
  if (image) {
    const a = (image.angle * Math.PI) / 180;
    return [
      ...elementCorners(image),
      elementSideHandle(image, "width"),
      elementSideHandle(image, "depth"),
      {
        x: image.x + Math.sin(a) * (image.depth / 2 + 24 / scale),
        y: image.y - Math.cos(a) * (image.depth / 2 + 24 / scale),
      },
    ].map((point) => ({ point, kind: "furniture", radius: 9 }));
  }
  for (const slab of doc.model.slabs) {
    const ring =
      slab.id === id
        ? slab.contour
        : slab.openings.find((o) => o.id === id)?.contour;
    if (ring)
      return ring.map((p, i) => ({
        point: {
          x: (p.x + ring[(i + 1) % ring.length].x) / 2,
          y: (p.y + ring[(i + 1) % ring.length].y) / 2,
        },
        kind: "slab",
        radius: 8,
      }));
  }
  const t = doc.model.terrain;
  if (t?.id === id && terrainEditing)
    return t.contour.map((point) => ({ point, kind: "terrain", radius: 10 }));
  if (t?.compass?.visible && compassSelectionId(t) === id)
    return [
      ...compassCorners(t.compass),
      compassPoint(t.compass, 0, -t.compass.size / 2 - 24 / scale),
    ].map((point) => ({ point, kind: "compass", radius: 9 }));
  return [];
}
