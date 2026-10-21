import {
  bounds,
  display,
  LIMIT,
  type EditableProject,
  type Measurement,
  type Point,
} from "./project";
import { openingBox } from "./openings";

export const measurementLength = (m: Pick<Measurement, "a" | "b">) =>
  Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y);
export const measurementText = (m: Pick<Measurement, "a" | "b">) =>
  `${display(measurementLength(m))} cm`;
export const roundedPoint = (p: Point): Point => ({
  x: Math.round(p.x),
  y: Math.round(p.y),
});
// Signed perpendicular distance in project units; endpoints always remain the
// measured anchors. Derived drawing points need not lie on the integer grid.
export function measurementGeometry(
  m: Pick<Measurement, "a" | "b" | "offset">,
) {
  const length = measurementLength(m);
  const normal = length
    ? { x: -(m.b.y - m.a.y) / length, y: (m.b.x - m.a.x) / length }
    : { x: 0, y: 1 };
  const offset = m.offset ?? 0;
  return {
    normal,
    a: { x: m.a.x + normal.x * offset, y: m.a.y + normal.y * offset },
    b: { x: m.b.x + normal.x * offset, y: m.b.y + normal.y * offset },
  };
}
export function measurementOffset(m: Pick<Measurement, "a" | "b">, p: Point) {
  const { normal } = measurementGeometry(m);
  return Math.round((p.x - m.a.x) * normal.x + (p.y - m.a.y) * normal.y);
}
export function validMeasurement(m: Measurement) {
  const line = measurementGeometry(m);
  return (
    [m.a.x, m.a.y, m.b.x, m.b.y].every(
      (n) => Number.isSafeInteger(n) && Math.abs(n) <= LIMIT,
    ) &&
    measurementLength(m) > 0 &&
    Number.isSafeInteger(m.offset ?? 0) &&
    Math.abs(m.offset ?? 0) <= LIMIT &&
    [line.a.x, line.a.y, line.b.x, line.b.y].every(
      (n) => Number.isFinite(n) && Math.abs(n) <= LIMIT,
    )
  );
}
export function projection(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const t =
    dx || dy
      ? Math.max(
          0,
          Math.min(
            1,
            ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy),
          ),
        )
      : 0;
  return { x: a.x + t * dx, y: a.y + t * dy };
}
export const nearMeasurement = (
  p: Point,
  m: Measurement,
  tolerance: number,
) => {
  const line = measurementGeometry(m);
  return [
    [line.a, line.b],
    [m.a, line.a],
    [m.b, line.b],
  ].some(([a, b]) => {
    const q = projection(p, a, b);
    return Math.hypot(p.x - q.x, p.y - q.y) <= tolerance;
  });
};
export type MeasurementTargets = {
  vertices: Point[];
  segments: [Point, Point][];
};
export function measurementTargets(
  doc: EditableProject,
  floorId: string,
  exclude?: string,
): MeasurementTargets {
  const vertices: Point[] = [],
    segments: [Point, Point][] = [];
  // Terrain is global to the project; only its confirmed vertices are anchors.
  if (doc.model.terrain) vertices.push(...doc.model.terrain.contour);
  const ring = (points: Point[]) =>
    points.forEach((p, i) => {
      vertices.push(p);
      segments.push([p, points[(i + 1) % points.length]]);
    });
  const rectangle = (b: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) =>
    ring([
      { x: b.x, y: b.y },
      { x: b.x + b.width, y: b.y },
      { x: b.x + b.width, y: b.y + b.height },
      { x: b.x, y: b.y + b.height },
    ]);
  const walls = doc.model.walls.filter((w) => w.floorId === floorId);
  walls.forEach((w) => rectangle(bounds(w, doc.project.base.width)));
  doc.model.openings.forEach((o) => {
    const w = walls.find((w) => w.id === o.wallId);
    if (w) rectangle(openingBox(o, w, doc.project.base.width));
  });
  doc.model.slabs
    .filter((s) => s.floorId === floorId)
    .forEach((s) => {
      ring(s.contour);
      s.openings.forEach((o) => ring(o.contour));
    });
  doc.model.measurements
    .filter((m) => m.floorId === floorId && m.id !== exclude)
    .forEach((m) => vertices.push(m.a, m.b));
  return { vertices, segments };
}
// Distance is evaluated before quantization; deterministic coordinates break ties.
export function attractMeasurement(
  p: Point,
  targets: MeasurementTargets,
  scale: number,
  disabled = false,
) {
  const free = roundedPoint(p);
  if (disabled) return { point: free, snapped: false };
  const closest = (points: Point[]) =>
    points
      .map((q) => ({ q, d: Math.hypot(p.x - q.x, p.y - q.y) * scale }))
      .filter(({ d }) => d <= 9)
      .sort((a, b) => a.d - b.d || a.q.x - b.q.x || a.q.y - b.q.y)[0]?.q;
  const q =
    closest(targets.vertices) ??
    closest(targets.segments.map(([a, b]) => projection(p, a, b)));
  return { point: q ? roundedPoint(q) : free, snapped: !!q };
}
