import { LIMIT, type Point, type Terrain } from "./project";

export const TERRAIN_MATERIALS = {
  grass: "Grama",
  earth: "Terra",
  sand: "Areia",
  gravel: "Brita",
  pavers: "Piso intertravado",
} as const;
export const MAX_TERRAIN_POINTS = 256;
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
/** An interior anchor, including concave rings whose centroid can lie outside. */
export function terrainLabelPoint(points: Point[]): Point {
  const levels = [...new Set(points.map((p) => p.y))].sort((a, b) => a - b);
  let best = { x: points[0].x, y: points[0].y },
    width = -1;
  for (let i = 1; i < levels.length; i++) {
    const y = (levels[i - 1] + levels[i]) / 2;
    const xs: number[] = [];
    points.forEach((a, j) => {
      const b = points[(j + 1) % points.length];
      if (a.y > y !== b.y > y)
        xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
    });
    xs.sort((a, b) => a - b);
    for (let j = 0; j + 1 < xs.length; j += 2) {
      const w = xs[j + 1] - xs[j];
      if (w > width) {
        width = w;
        best = { x: (xs[j] + xs[j + 1]) / 2, y };
      }
    }
  }
  return best;
}
