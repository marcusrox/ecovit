import {
  bounds,
  length,
  LIMIT,
  type Opening,
  type EditableProject as Project,
  type Wall,
  type Point,
} from "./project";

export const openingLabel = { door: "Porta", window: "Janela", opening: "Vão" };
export const MAX_OPENINGS = 1000;
export const wallAxis = (w: Wall) => (w.a.y === w.b.y ? "x" : "y");
export const wallStart = (w: Wall) =>
  Math.min(w.a[wallAxis(w)], w.b[wallAxis(w)]);
export const openingOffset = (w: Wall, p: Point) =>
  p[wallAxis(w)] - wallStart(w);
export function openingBox(o: Opening, w: Wall, m: number) {
  const b = bounds(w, m);
  return w.a.y === w.b.y
    ? { x: wallStart(w) + o.offset, y: b.y, width: o.width, height: m }
    : { x: b.x, y: wallStart(w) + o.offset, width: m, height: o.width };
}
export function openingIssue(
  doc: Project,
  o: Opening,
): { code: string; message: string } | null {
  const w = doc.model.walls.find((w) => w.id === o.wallId);
  if (!w)
    return { code: "opening-wall-missing", message: "Parede do vão ausente." };
  const m = doc.project.base.width,
    h = doc.project.base.height,
    f = doc.model.floors.find((f) => f.id === w.floorId)!;
  const B = f.level + o.base,
    T = B + o.height;
  if (
    [o.offset, o.width, o.base, o.height, B, T].some(
      (n) => !Number.isSafeInteger(n) || Math.abs(n) > LIMIT,
    ) ||
    o.width <= 0 ||
    o.height <= 0
  )
    return {
      code: "opening-measure",
      message: "Medidas do vão inválidas ou fora do limite.",
    };
  if (
    o.offset < 0 ||
    o.offset + o.width > length(w) ||
    B < f.level ||
    T > f.level + w.height
  )
    return {
      code: "opening-outside-wall",
      message:
        "Vão fora dos limites da parede. Edite o vão ou a parede; sua posição foi preservada.",
    };
  if (o.offset % m || o.width % m || (B - f.level) % h || (T - f.level) % h)
    return {
      code: "opening-off-grid",
      message:
        "Posição, largura, base ou topo do vão fora da malha de módulos/fiadas.",
    };
  for (const other of doc.model.openings) {
    if (other.id === o.id || other.wallId !== o.wallId) continue;
    const horizontal =
      Math.min(o.offset + o.width, other.offset + other.width) -
      Math.max(o.offset, other.offset);
    const vertical =
      Math.min(o.base + o.height, other.base + other.height) -
      Math.max(o.base, other.base);
    if (horizontal > 0 && vertical > 0)
      return {
        code: "opening-overlap",
        message:
          "Vãos sobrepostos: duas aberturas não podem ocupar o mesmo volume.",
      };
    if (vertical > 0 && horizontal > -m)
      return {
        code: "opening-separation",
        message:
          "Vãos lado a lado precisam de um módulo de alvenaria entre eles.",
      };
    if (horizontal > 0 && vertical > -h)
      return {
        code: "opening-stacked-gap",
        message:
          "Vãos empilhados precisam de pelo menos uma fiada completa entre eles.",
      };
  }
  return null;
}
export function putOpening<T extends Project>(doc: T, opening: Opening): T {
  const issue = openingIssue(doc, opening);
  if (issue) throw new Error(issue.message);
  const exists = doc.model.openings.some((o) => o.id === opening.id);
  if (!exists && doc.model.openings.length >= MAX_OPENINGS)
    throw new Error("Limite de mil vãos por projeto atingido.");
  return {
    ...doc,
    model: {
      ...doc.model,
      openings: exists
        ? doc.model.openings.map((o) => (o.id === opening.id ? opening : o))
        : [...doc.model.openings, opening],
    },
  };
}
export function reconcileOpenings<T extends Project>(previous: T, next: T): T {
  return {
    ...next,
    model: {
      ...next.model,
      openings: next.model.openings
        .filter(
          (o) =>
            !previous.model.walls.some((w) => w.id === o.wallId) ||
            next.model.walls.some((w) => w.id === o.wallId),
        )
        .map((o) => {
          const old = previous.model.walls.find((w) => w.id === o.wallId),
            w = next.model.walls.find((w) => w.id === o.wallId)!;
          return old && w
            ? { ...o, offset: o.offset + wallStart(old) - wallStart(w) }
            : o;
        }),
    },
  };
}
export function removeElement<T extends Project>(doc: T, id: string): T {
  return {
    ...doc,
    model: {
      ...doc.model,
      walls: doc.model.walls.filter((w) => w.id !== id),
      measurements: doc.model.measurements.filter((m) => m.id !== id),
      openings: doc.model.openings.filter(
        (o) => o.id !== id && o.wallId !== id,
      ),
    },
  };
}
export function modularOptions(
  value: number,
  step: number,
  origin: number,
  min: number,
  max: number,
): number[] {
  return [
    ...new Set([
      Math.floor((value - origin) / step) * step + origin,
      Math.ceil((value - origin) / step) * step + origin,
    ]),
  ].filter((n) => n >= min && n <= max);
}
