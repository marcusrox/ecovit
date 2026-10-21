import {
  LIMIT,
  type Point,
  type Terrain,
  type TerrainCompass,
} from "./project";

// A graphic size, in world units; it has no construction or surveying meaning.
export const MIN_COMPASS_SIZE = 100;
export const MAX_COMPASS_SIZE = LIMIT;
export const compassSelectionId = (t: Terrain | null) =>
  t ? `compass:${t.id}` : null;

export function compassPoint(c: TerrainCompass, x: number, y: number): Point {
  const a = (c.angle * Math.PI) / 180;
  return {
    x: c.center.x + x * Math.cos(a) - y * Math.sin(a),
    y: c.center.y + x * Math.sin(a) + y * Math.cos(a),
  };
}
export const compassCorners = (c: TerrainCompass): Point[] =>
  [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([x, y]) => compassPoint(c, (x * c.size) / 2, (y * c.size) / 2));

export function validateCompass(c: TerrainCompass) {
  if (
    typeof c.visible !== "boolean" ||
    ![c.center.x, c.center.y, c.size, c.angle].every(Number.isFinite) ||
    !Number.isSafeInteger(c.center.x) ||
    !Number.isSafeInteger(c.center.y) ||
    !Number.isSafeInteger(c.size) ||
    c.size < MIN_COMPASS_SIZE ||
    c.size > MAX_COMPASS_SIZE ||
    c.angle < 0 ||
    c.angle >= 360 ||
    compassCorners(c).some(
      (p) => Math.abs(p.x) > LIMIT || Math.abs(p.y) > LIMIT,
    )
  )
    throw new Error("Posição, tamanho ou ângulo da rosa dos ventos inválidos.");
}

export function initialCompass(t: Terrain): TerrainCompass {
  const xs = t.contour.map((p) => p.x),
    ys = t.contour.map((p) => p.y);
  const left = Math.min(...xs),
    right = Math.max(...xs),
    top = Math.min(...ys),
    bottom = Math.max(...ys);
  const c = {
    visible: true,
    center: {
      x: Math.round((left + right) / 2),
      y: Math.round((top + bottom) / 2),
    },
    size: Math.round(
      Math.max(5000, Math.min(20000, Math.min(right - left, bottom - top) / 4)),
    ),
    angle: 0,
  };
  const margin = Math.ceil(c.size / 2);
  c.center.x = Math.max(-LIMIT + margin, Math.min(LIMIT - margin, c.center.x));
  c.center.y = Math.max(-LIMIT + margin, Math.min(LIMIT - margin, c.center.y));
  validateCompass(c);
  return c;
}

export function compassContains(c: TerrainCompass, p: Point) {
  const a = (-c.angle * Math.PI) / 180,
    dx = p.x - c.center.x,
    dy = p.y - c.center.y;
  return (
    Math.max(
      Math.abs(dx * Math.cos(a) - dy * Math.sin(a)),
      Math.abs(dx * Math.sin(a) + dy * Math.cos(a)),
    ) <=
    c.size / 2
  );
}

export function resizeCompass(c: TerrainCompass, p: Point): TerrainCompass {
  const a = (-c.angle * Math.PI) / 180,
    dx = p.x - c.center.x,
    dy = p.y - c.center.y;
  const size = Math.round(
    2 *
      Math.max(
        Math.abs(dx * Math.cos(a) - dy * Math.sin(a)),
        Math.abs(dx * Math.sin(a) + dy * Math.cos(a)),
      ),
  );
  const next = { ...c, size };
  validateCompass(next);
  return next;
}
