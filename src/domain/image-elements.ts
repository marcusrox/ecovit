import {
  LIMIT,
  type ImageElement,
  type CustomImageAsset,
  type EditableProject,
  type Point,
} from "./project";
import { catalogItem, catalogUrl, type CatalogItem } from "./image-catalog";
import { imageBytes, inspectImage, decodeReference } from "./reference-image";

export const MAX_IMAGE_ELEMENTS = 2000;
export const MAX_CUSTOM_ASSETS = 200;
export const FURNITURE_ROTATION_SNAP = 5;
export function snapFurnitureAngle(angle: number) {
  const normalized = ((angle % 360) + 360) % 360;
  const nearest = Math.round(normalized / 45) * 45;
  return Math.abs(normalized - nearest) <= FURNITURE_ROTATION_SNAP
    ? nearest % 360
    : normalized;
}
export function elementCorners(e: ImageElement): Point[] {
  const a = (e.angle * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a);
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([x, y]) => ({
    x: e.x + ((x * e.width) / 2) * c - ((y * e.depth) / 2) * s,
    y: e.y + ((x * e.width) / 2) * s + ((y * e.depth) / 2) * c,
  }));
}
export function elementLocal(e: ImageElement, p: Point): Point {
  const a = (e.angle * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a);
  return {
    x: (p.x - e.x) * c + (p.y - e.y) * s,
    y: -(p.x - e.x) * s + (p.y - e.y) * c,
  };
}
export function elementSideHandle(
  e: ImageElement,
  axis: "width" | "depth",
): Point {
  const a = (e.angle * Math.PI) / 180;
  return axis === "width"
    ? {
        x: e.x + (Math.cos(a) * e.width) / 2,
        y: e.y + (Math.sin(a) * e.width) / 2,
      }
    : {
        x: e.x - (Math.sin(a) * e.depth) / 2,
        y: e.y + (Math.cos(a) * e.depth) / 2,
      };
}
export function resizeElementSide(
  e: ImageElement,
  axis: "width" | "depth",
  p: Point,
): ImageElement {
  const local = elementLocal(e, p);
  const size = (axis === "width" ? local.x : local.y) + e[axis] / 2;
  if (!Number.isFinite(size) || size <= 0)
    throw new Error(
      "Mantenha largura e profundidade positivas, sem cruzar o lado oposto.",
    );
  const delta = (size - e[axis]) / 2,
    a = (e.angle * Math.PI) / 180;
  return {
    ...e,
    [axis]: size,
    x: e.x + (axis === "width" ? Math.cos(a) : -Math.sin(a)) * delta,
    y: e.y + (axis === "width" ? Math.sin(a) : Math.cos(a)) * delta,
  };
}
export const hitImageElement = (e: ImageElement, p: Point, tolerance = 0) => {
  const q = elementLocal(e, p);
  return (
    Math.abs(q.x) <= e.width / 2 + tolerance &&
    Math.abs(q.y) <= e.depth / 2 + tolerance
  );
};
export function elementRatio(
  e: ImageElement,
  assets: readonly CustomImageAsset[],
) {
  if (e.source.kind === "catalog") {
    const i = catalogItem(e.source.itemId, e.source.revision);
    if (!i)
      throw new Error(
        "Imagem padrão ou revisão indisponível nesta versão do Ecovit.",
      );
    return i.width / i.depth;
  }
  const assetId = e.source.assetId;
  const i = assets.find((a) => a.id === assetId);
  if (!i) throw new Error("Imagem personalizada não encontrada no projeto.");
  return i.width / i.height;
}
export function validateElement(
  e: ImageElement,
  assets: readonly CustomImageAsset[],
) {
  elementRatio(e, assets);
  if (
    ![e.x, e.y, e.width, e.depth, e.angle].every(Number.isFinite) ||
    e.width <= 0 ||
    e.depth <= 0 ||
    Math.abs(e.angle) > 360 ||
    elementCorners(e).some(
      (p) => Math.abs(p.x) > LIMIT || Math.abs(p.y) > LIMIT,
    )
  )
    throw new Error("Dimensões ou posição da imagem inválidas.");
}
export function validateCustomAsset(a: CustomImageAsset) {
  const info = inspectImage(imageBytes(a.data));
  if (
    info.mime !== a.mime ||
    info.width !== a.width ||
    info.height !== a.height
  )
    throw new Error(
      "Conteúdo ou dimensões da imagem personalizada inconsistentes.",
    );
}
export function standardElement(i: CatalogItem, floorId: string): ImageElement {
  return {
    id: crypto.randomUUID(),
    floorId,
    name: i.name,
    source: { kind: "catalog", itemId: i.id, revision: i.revision },
    x: 0,
    y: 0,
    width: i.width,
    depth: i.depth,
    angle: 0,
  };
}
export function elementUrl(
  e: ImageElement,
  assets: readonly CustomImageAsset[],
) {
  if (e.source.kind === "catalog") {
    const item = catalogItem(e.source.itemId, e.source.revision);
    if (!item) throw new Error("Imagem padrão indisponível.");
    return catalogUrl(item);
  }
  const assetId = e.source.assetId,
    a = assets.find((i) => i.id === assetId);
  if (!a) throw new Error("Imagem personalizada ausente.");
  return `data:${a.mime};base64,${a.data}`;
}
export function setImageElement<T extends EditableProject>(
  doc: T,
  next: ImageElement | null,
  id = next?.id,
): T {
  if (next) validateElement(next, doc.model.customImageAssets);
  return {
    ...doc,
    model: {
      ...doc.model,
      imageElements: [
        ...doc.model.imageElements.filter((i) => i.id !== id),
        ...(next ? [next] : []),
      ],
    },
  };
}
export async function decodeCustomAssets(assets: readonly CustomImageAsset[]) {
  for (const a of assets) await decodeReference(a);
}
export async function decodeCatalogElements(elements: readonly ImageElement[]) {
  const urls = new Set(
    elements
      .filter((e) => e.source.kind === "catalog")
      .map((e) => elementUrl(e, [])),
  );
  for (const url of urls) {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new Error(
        "Imagem padrão indisponível nesta distribuição do Ecovit. O projeto aberto foi preservado.",
      );
    }
  }
}
