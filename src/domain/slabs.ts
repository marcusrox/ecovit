import { LIMIT, type Point, type Slab, type EditableProject } from "./project";

const equal = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
const between = (n: number, a: number, b: number) =>
  n >= Math.min(a, b) && n <= Math.max(a, b);
export const onSegment = (p: Point, a: Point, b: Point) =>
  (a.x === b.x && p.x === a.x && between(p.y, a.y, b.y)) ||
  (a.y === b.y && p.y === a.y && between(p.x, a.x, b.x));
function intersects(a: Point, b: Point, c: Point, d: Point) {
  return (
    Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) <=
      Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) &&
    Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) <=
      Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y))
  );
}
export function ringEdges(points: Point[]) {
  return points.map((a, i) => [a, points[(i + 1) % points.length]] as const);
}
export function validateRing(points: Point[], module: number, closed = true) {
  if (closed && points.length < 4)
    throw new Error("O contorno precisa de pelo menos quatro vértices.");
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (
      ![p.x, p.y].every(
        (n) =>
          Number.isSafeInteger(n) && Math.abs(n) <= LIMIT && n % module === 0,
      )
    )
      throw new Error(`Vértice ${i + 1} fora da malha ou do limite do editor.`);
    if (points.slice(0, i).some((q) => equal(p, q)))
      throw new Error(`Vértice ${i + 1} repetido.`);
  }
  const edges = closed
    ? ringEdges(points)
    : points.slice(0, -1).map((p, i) => [p, points[i + 1]] as const);
  edges.forEach(([a, b], i) => {
    if ((a.x === b.x) === (a.y === b.y))
      throw new Error(
        `Aresta ${i + 1}: use um segmento ortogonal de comprimento positivo.`,
      );
    const next = edges[(i + 1) % edges.length];
    if (
      next &&
      (closed || i + 1 < edges.length) &&
      (a.x === b.x) === (next[0].x === next[1].x)
    )
      throw new Error(
        `Aresta ${i + 1}: retire o vértice colinear ou o retorno.`,
      );
    for (let j = i + 1; j < edges.length; j++) {
      if (j === i + 1 || (closed && i === 0 && j === edges.length - 1))
        continue;
      if (intersects(a, b, ...edges[j]))
        throw new Error(`Arestas ${i + 1} e ${j + 1} se cruzam ou se tocam.`);
    }
  });
  if (closed) {
    const area = edges.reduce(
      (sum, [a, b]) =>
        sum + BigInt(a.x) * BigInt(b.y) - BigInt(b.x) * BigInt(a.y),
      0n,
    );
    if (area === 0n) throw new Error("O contorno não tem área.");
  }
}
/** -1 outside, 0 boundary, 1 strictly inside, without floating point predicates. */
export function ringLocation(p: Point, points: Point[]): -1 | 0 | 1 {
  let inside = false;
  for (const [a, b] of ringEdges(points)) {
    if (onSegment(p, a, b)) return 0;
    if (a.x === b.x && a.y > p.y !== b.y > p.y && a.x > p.x) inside = !inside;
  }
  return inside ? 1 : -1;
}
function touching(a: Point[], b: Point[]) {
  return ringEdges(a).some(([p, q]) =>
    ringEdges(b).some(([r, s]) => intersects(p, q, r, s)),
  );
}
export function validateSlab(slab: Slab, module: number, level: number) {
  if (
    !Number.isSafeInteger(slab.thickness) ||
    slab.thickness <= 0 ||
    slab.thickness > LIMIT ||
    Math.abs(level - slab.thickness) > LIMIT
  )
    throw new Error(
      "Espessura positiva e face inferior devem respeitar o limite do editor.",
    );
  validateRing(slab.contour, module);
  slab.openings.forEach((opening, i) => {
    try {
      validateRing(opening.contour, module);
    } catch (e) {
      throw new Error(`Abertura ${i + 1}: ${(e as Error).message}`);
    }
    if (
      touching(slab.contour, opening.contour) ||
      ringLocation(opening.contour[0], slab.contour) !== 1
    )
      throw new Error(
        `Abertura ${i + 1} deve ficar estritamente dentro da laje, sem tocar sua borda.`,
      );
    for (let j = 0; j < i; j++) {
      const other = slab.openings[j];
      if (
        touching(other.contour, opening.contour) ||
        ringLocation(opening.contour[0], other.contour) !== -1 ||
        ringLocation(other.contour[0], opening.contour) !== -1
      )
        throw new Error(
          `Aberturas ${j + 1} e ${i + 1} se tocam, se sobrepõem ou estão contidas uma na outra.`,
        );
    }
  });
}
export function putSlab<T extends EditableProject>(doc: T, slab: Slab): T {
  const floor = doc.model.floors.find((f) => f.id === slab.floorId);
  if (!floor) throw new Error("Pavimento da laje ausente.");
  if (
    doc.model.slabs.some((s) => s.id !== slab.id && s.floorId === slab.floorId)
  )
    throw new Error("Este pavimento já tem uma laje.");
  validateSlab(slab, doc.project.base.width, floor.level);
  const slabs = [...doc.model.slabs.filter((s) => s.id !== slab.id), slab].sort(
    (a, b) =>
      doc.model.floors.findIndex((f) => f.id === a.floorId) -
      doc.model.floors.findIndex((f) => f.id === b.floorId),
  );
  return { ...doc, model: { ...doc.model, slabs } };
}
export function removeSlabElement<T extends EditableProject>(
  doc: T,
  id: string,
): T {
  return {
    ...doc,
    model: {
      ...doc.model,
      slabs: doc.model.slabs
        .filter((s) => s.id !== id)
        .map((s) => ({
          ...s,
          openings: s.openings.filter((o) => o.id !== id),
        })),
    },
  };
}
export function translateSlab(
  slab: Slab,
  delta: Point,
  openingId?: string,
): Slab {
  if (openingId && !slab.openings.some((o) => o.id === openingId))
    throw new Error("Abertura de laje ausente.");
  const shift = (points: Point[]) =>
    points.map((p) => ({ x: p.x + delta.x, y: p.y + delta.y }));
  return {
    ...slab,
    contour: openingId ? slab.contour : shift(slab.contour),
    openings: slab.openings.map((o) => ({
      ...o,
      contour: !openingId || o.id === openingId ? shift(o.contour) : o.contour,
    })),
  };
}
export function shiftSlabEdge(
  slab: Slab,
  index: number,
  delta: Point,
  openingId?: string,
): Slab {
  const contour = openingId
    ? slab.openings.find((o) => o.id === openingId)?.contour
    : slab.contour;
  if (!contour) throw new Error("Abertura de laje ausente.");
  if (!Number.isInteger(index) || index < 0 || index >= contour.length)
    throw new Error("Aresta de laje ausente.");
  const edit = (points: Point[]) => {
    const a = points[index],
      b = points[(index + 1) % points.length];
    const moved = points.map((p, i) =>
      i === index || i === (index + 1) % points.length
        ? {
            x: p.x + (a.x === b.x ? delta.x : 0),
            y: p.y + (a.y === b.y ? delta.y : 0),
          }
        : p,
    );
    for (const i of [
      (index + points.length - 1) % points.length,
      (index + 1) % points.length,
    ]) {
      const j = (i + 1) % points.length;
      if (
        Math.sign(points[j].x - points[i].x) !==
          Math.sign(moved[j].x - moved[i].x) ||
        Math.sign(points[j].y - points[i].y) !==
          Math.sign(moved[j].y - moved[i].y)
      )
        throw new Error(
          "A aresta não pode atravessar o contorno nem inverter ou colapsar as arestas vizinhas.",
        );
    }
    return moved;
  };
  return {
    ...slab,
    contour: openingId ? slab.contour : edit(slab.contour),
    openings: slab.openings.map((o) => ({
      ...o,
      contour: o.id === openingId ? edit(o.contour) : o.contour,
    })),
  };
}
export function slabIssue(slab: Slab, module: number, level: number) {
  try {
    validateSlab(slab, module, level);
    return "";
  } catch (e) {
    return (e as Error).message;
  }
}
