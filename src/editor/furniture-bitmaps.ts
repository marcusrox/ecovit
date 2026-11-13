import type { Layer } from "konva/lib/Layer";
import catalogCrops from "./furniture-crops.json";

type Crop = { x: number; y: number; width: number; height: number };
type Level = { image: HTMLImageElement | HTMLCanvasElement; crop: Crop };
export type FurnitureBitmap = { crop: Crop; levels: Level[] };
type CacheEntry = {
  users: number;
  promise: Promise<FurnitureBitmap>;
  bitmap?: FurnitureBitmap;
};
const crops: Readonly<Record<string, Crop>> = catalogCrops;
const cache = new Map<string, CacheEntry>();
// Only idle public catalog resources are retained. Mounted users are never evicted.
const MAX_IDLE_BYTES = 192 * 1024 * 1024;
const MAX_IDLE_ENTRIES = 32;

function bitmapBytes(bitmap: FurnitureBitmap) {
  return bitmap.levels.reduce(
    (bytes, { image }) =>
      bytes +
      4 *
        ("naturalWidth" in image
          ? image.naturalWidth * image.naturalHeight
          : image.width * image.height),
    0,
  );
}

function trimIdle() {
  const idle = [...cache].filter(([, entry]) => entry.users === 0);
  let bytes = idle.reduce(
    (sum, [, entry]) => sum + (entry.bitmap ? bitmapBytes(entry.bitmap) : 0),
    0,
  );
  let count = idle.length;
  for (const [url, entry] of idle) {
    if (bytes <= MAX_IDLE_BYTES && count <= MAX_IDLE_ENTRIES) break;
    cache.delete(url);
    bytes -= entry.bitmap ? bitmapBytes(entry.bitmap) : 0;
    count--;
  }
}

async function load(url: string): Promise<FurnitureBitmap> {
  const image = new Image();
  image.src = url;
  await image.decode();
  let crop = {
    x: 0,
    y: 0,
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
  if (Object.hasOwn(crops, url)) {
    crop = { ...crops[url] };
  } else if (!url.startsWith("data:")) {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width,
      top = canvas.height,
      right = -1,
      bottom = -1;
    for (let y = 0; y < canvas.height; y++)
      for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3] > 8) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
    if (right < left) throw new Error("Imagem inteiramente transparente.");
    crop = {
      x: left,
      y: top,
      width: right - left + 1,
      height: bottom - top + 1,
    };
  }
  return { crop, levels: [{ image, crop }] };
}

// Public immutable catalog art survives unmounting; private uploads do not.
export function acquireFurnitureBitmap(url: string) {
  let entry = cache.get(url);
  if (!entry) {
    const created: CacheEntry = { users: 0, promise: load(url) };
    created.promise = created.promise.then(
      (bitmap) => {
        created.bitmap = bitmap;
        return bitmap;
      },
      (error: unknown) => {
        if (cache.get(url) === created) cache.delete(url);
        throw error;
      },
    );
    entry = created;
    cache.set(url, entry);
  }
  entry.users++;
  const held = entry;
  let released = false;
  return {
    promise: held.promise,
    release() {
      if (released) return;
      released = true;
      if (--held.users !== 0 || cache.get(url) !== held) return;
      cache.delete(url);
      if (held.bitmap && Object.hasOwn(crops, url)) {
        // Map insertion order is the last-use order of released catalog entries.
        cache.set(url, held);
        trimIdle();
      }
    },
  };
}

export function furnitureBitmapLevel(
  bitmap: FurnitureBitmap,
  width: number,
  height: number,
): Level {
  let index = 0;
  while (true) {
    const current = bitmap.levels[index],
      crop = current.crop;
    const w = Math.max(1, Math.ceil(crop.width / 2)),
      h = Math.max(1, Math.ceil(crop.height / 2));
    // Keep enough physical pixels on BOTH axes, including stretched furniture.
    if ((w === crop.width && h === crop.height) || w < width || h < height)
      return current;
    if (!bitmap.levels[index + 1]) {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        current.image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        w,
        h,
      );
      bitmap.levels.push({
        image: canvas,
        crop: { x: 0, y: 0, width: w, height: h },
      });
    }
    index++;
  }
}

export function setFurnitureSmoothing(layer: Layer, high: boolean) {
  const context = layer.getCanvas().getContext()._context;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = high ? "high" : "low";
}
