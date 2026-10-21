import { LIMIT, type Point, type Terrain } from "./project";
import { validateCompass } from "./terrain-compass";

export const TERRAIN_MATERIALS = {
  grass: "Grama",
  earth: "Terra",
  sand: "Areia",
  gravel: "Brita",
  pavers: "Piso intertravado",
  soft: "Verde suave",
} as const;
export const MAX_TERRAIN_POINTS = 256;

/** Drawing aid relative to the plan axes (+X right, +Y down), not a contour rule. */
export function terrainDrawingDirection(
  origin: Point,
  target: Point,
  suspended = false,
): { point: Point; angle: number | null } {
  const free = { x: Math.round(target.x), y: Math.round(target.y) };
  const dx = target.x - origin.x,
    dy = target.y - origin.y,
    length = Math.hypot(dx, dy);
  if (suspended || length === 0) return { point: free, angle: null };
  const degrees = (Math.atan2(dy, dx) * 180) / Math.PI;
  const nearest = Math.round(degrees / 45) * 45;
  if (Math.abs(degrees - nearest) > 5 + 1e-10)
    return { point: free, angle: null };
  const angle = ((nearest % 360) + 360) % 360;
  const [ux, uy] = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ][angle / 45];
  const step = Math.round(length / Math.hypot(ux, uy));
  const point = {
    x: origin.x + step * ux,
    y: origin.y + step * uy,
  };
  return {
    point,
    angle: point.x === origin.x && point.y === origin.y ? null : angle,
  };
}

const cross = (a: Point, b: Point, c: Point) =>
  BigInt(b.x - a.x) * BigInt(c.y - a.y) - BigInt(b.y - a.y) * BigInt(c.x - a.x);
const equal = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
const on = (p: Point, a: Point, b: Point) =>
  cross(a, b, p) === 0n &&
  p.x >= Math.min(a.x, b.x) &&
  p.x <= Math.max(a.x, b.x) &&
  p.y >= Math.min(a.y, b.y) &&
  p.y <= Math.max(a.y, b.y);
const intersects = (a: Point, b: Point, c: Point, d: Point) => {
  const abC = cross(a, b, c),
    abD = cross(a, b, d);
  const cdA = cross(c, d, a),
    cdB = cross(c, d, b);
  return (
    on(c, a, b) ||
    on(d, a, b) ||
    on(a, c, d) ||
    on(b, c, d) ||
    (((abC < 0n && abD > 0n) || (abC > 0n && abD < 0n)) &&
      ((cdA < 0n && cdB > 0n) || (cdA > 0n && cdB < 0n)))
  );
};
export function terrainTwiceArea(points: Point[]) {
  return points.reduce((sum, a, i) => {
    const b = points[(i + 1) % points.length];
    return sum + BigInt(a.x) * BigInt(b.y) - BigInt(b.x) * BigInt(a.y);
  }, 0n);
}
export function terrainArea(points: Point[]) {
  const area = terrainTwiceArea(points);
  return Number(area < 0n ? -area : area) / 200_000_000;
}
export const terrainAreaText = (points: Point[]) =>
  `${terrainArea(points).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;

/** Exact predicates for free (including diagonal) rings; no construction grid. */
export function validateTerrainContour(points: Point[], closed = true) {
  if (points.length > MAX_TERRAIN_POINTS || (closed && points.length < 3))
    throw new Error(`Use de 3 a ${MAX_TERRAIN_POINTS} pontos no terreno.`);
  points.forEach((p, i) => {
    if (
      ![p.x, p.y].every((n) => Number.isSafeInteger(n) && Math.abs(n) <= LIMIT)
    )
      throw new Error(
        "Ponto do terreno fora da precisão ou do limite do editor.",
      );
    if (points.slice(0, i).some((q) => equal(p, q)))
      throw new Error("O terreno não pode ter pontos repetidos.");
  });
  const count = closed ? points.length : Math.max(0, points.length - 1);
  for (let i = 0; i < count; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    for (let j = i + 1; j < count; j++) {
      const c = points[j],
        d = points[(j + 1) % points.length];
      if (j === i + 1 || (closed && i === 0 && j === count - 1)) {
        const shared = j === i + 1 ? b : a;
        const first = j === i + 1 ? a : b;
        const last = j === i + 1 ? d : c;
        if (on(first, shared, last) || on(last, first, shared))
          throw new Error(
            "As arestas do terreno não podem retornar sobre si mesmas.",
          );
      } else if (intersects(a, b, c, d))
        throw new Error(
          "As arestas do terreno não podem se cruzar ou se tocar.",
        );
    }
  }
  if (closed && terrainTwiceArea(points) === 0n)
    throw new Error("O terreno precisa ter área maior que zero.");
}
export function validateTerrain(terrain: Terrain) {
  if (terrain.compass) validateCompass(terrain.compass);
  if (!(terrain.material in TERRAIN_MATERIALS) || terrain.revision !== 1)
    throw new Error("Material ou revisão de terreno não suportados.");
  if (
    ![terrain.textureOrigin.x, terrain.textureOrigin.y].every(
      (n) => Number.isSafeInteger(n) && Math.abs(n) <= LIMIT,
    )
  )
    throw new Error("Origem da textura fora do limite do editor.");
  validateTerrainContour(terrain.contour);
}
export function translateTerrain(terrain: Terrain, delta: Point): Terrain {
  const shift = (p: Point) => ({ x: p.x + delta.x, y: p.y + delta.y });
  const next = {
    ...terrain,
    contour: terrain.contour.map(shift),
    textureOrigin: shift(terrain.textureOrigin),
  };
  validateTerrain(next);
  return next;
}
export function terrainContains(p: Point, points: Point[]) {
  let inside = false;
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}
/** Top centre of the terrain bounds; screen spacing belongs to the renderer. */
export function terrainLabelPoint(points: Point[]): Point {
  return {
    x:
      (Math.min(...points.map((p) => p.x)) +
        Math.max(...points.map((p) => p.x))) /
      2,
    y: Math.min(...points.map((p) => p.y)),
  };
}
