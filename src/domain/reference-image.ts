import { LIMIT, type Point, type ReferenceImage } from "./project";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 16_000_000;
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let bit = 0; bit < 8; bit++)
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
export type ImageDraft = {
  image: ReferenceImage;
  phase: "first" | "second" | "distance" | "adjust";
  points: Point[];
  cursor?: Point;
  calibrated: boolean;
  fit: boolean;
};
export function imagePoint(i: ReferenceImage, p: Point): Point {
  const a = (i.angle * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a);
  return {
    x: i.x + i.scale * (p.x * c - p.y * s),
    y: i.y + i.scale * (p.x * s + p.y * c),
  };
}
export function pixelPoint(i: ReferenceImage, p: Point): Point {
  const a = (i.angle * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a);
  return {
    x: ((p.x - i.x) * c + (p.y - i.y) * s) / i.scale,
    y: (-(p.x - i.x) * s + (p.y - i.y) * c) / i.scale,
  };
}
export function imageCorners(i: ReferenceImage) {
  return [
    { x: 0, y: 0 },
    { x: i.width, y: 0 },
    { x: i.width, y: i.height },
    { x: 0, y: i.height },
  ].map((p) => imagePoint(i, p));
}
export function validImageTransform(i: ReferenceImage) {
  return (
    [i.x, i.y, i.scale, i.angle, i.opacity].every(Number.isFinite) &&
    i.scale > 0 &&
    Math.abs(i.angle) <= 360 &&
    i.opacity >= 0 &&
    i.opacity <= 1 &&
    imageCorners(i).every(
      (p) => Math.abs(p.x) <= LIMIT && Math.abs(p.y) <= LIMIT,
    )
  );
}
export function calibrateImage(
  i: ReferenceImage,
  a: Point,
  b: Point,
  distance: number,
) {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  if (
    !Number.isFinite(distance) ||
    distance <= 0 ||
    !Number.isFinite(d) ||
    d < 1e-8
  )
    throw new Error(
      "Marque dois pontos distintos e informe uma distância positiva.",
    );
  const fixed = imagePoint(i, a),
    next = { ...i, scale: distance / d };
  const moved = imagePoint(next, a);
  next.x += fixed.x - moved.x;
  next.y += fixed.y - moved.y;
  if (!validImageTransform(next))
    throw new Error("Imagem fora dos limites do editor.");
  return next;
}
export function imageBytes(data: string) {
  if (
    data.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 ||
    data.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(data)
  )
    throw new Error("Imagem inválida ou acima de 10 MiB.");
  const raw = atob(data);
  if (!raw.length || raw.length > MAX_IMAGE_BYTES)
    throw new Error("Imagem acima de 10 MiB ou vazia.");
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
export function inspectImage(bytes: Uint8Array): {
  mime: ReferenceImage["mime"];
  width: number;
  height: number;
} {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES)
    throw new Error("Imagem acima de 10 MiB ou vazia.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0,
    height = 0,
    mime: ReferenceImage["mime"];
  if (
    bytes.length >= 33 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((b, n) => bytes[n] === b)
  ) {
    mime = "image/png";
    if (view.getUint32(8) !== 13 || view.getUint32(12) !== 0x49484452)
      throw new Error("PNG inválido.");
    width = view.getUint32(16);
    height = view.getUint32(20);
    let offset = 8,
      data = false,
      end = false;
    while (offset + 12 <= bytes.length) {
      const size = view.getUint32(offset),
        kind = view.getUint32(offset + 4);
      if (size > bytes.length - offset - 12) throw new Error("PNG incompleto.");
      let crc = 0xffffffff;
      for (let n = offset + 4; n < offset + 8 + size; n++)
        crc = crcTable[(crc ^ bytes[n]) & 255] ^ (crc >>> 8);
      if ((crc ^ 0xffffffff) >>> 0 !== view.getUint32(offset + 8 + size))
        throw new Error("PNG corrompido. Escolha outra imagem.");
      if (kind === 0x49444154) data = true;
      offset += size + 12;
      if (kind === 0x49454e44) {
        end = size === 0 && offset === bytes.length;
        break;
      }
    }
    if (!data || !end) throw new Error("PNG incompleto.");
  } else if (
    bytes.length >= 4 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes.at(-2) === 255 &&
    bytes.at(-1) === 217
  ) {
    mime = "image/jpeg";
    let offset = 2,
      orientation = 1;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 255) throw new Error("JPEG inválido.");
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 218 || marker === 217) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      const size = view.getUint16(offset);
      if (size < 2 || offset + size > bytes.length)
        throw new Error("JPEG incompleto.");
      if (
        marker === 225 &&
        size >= 16 &&
        [69, 120, 105, 102, 0, 0].every((v, n) => bytes[offset + 2 + n] === v)
      ) {
        const tiff = offset + 8,
          end = offset + size;
        const little = view.getUint16(tiff) === 0x4949;
        if (
          (little || view.getUint16(tiff) === 0x4d4d) &&
          view.getUint16(tiff + 2, little) === 42
        ) {
          const directory = tiff + view.getUint32(tiff + 4, little);
          if (directory >= tiff && directory + 2 <= end) {
            const count = view.getUint16(directory, little);
            for (
              let n = 0;
              n < count && directory + 2 + (n + 1) * 12 <= end;
              n++
            ) {
              const entry = directory + 2 + n * 12;
              if (
                view.getUint16(entry, little) === 274 &&
                view.getUint16(entry + 2, little) === 3 &&
                view.getUint32(entry + 4, little) === 1
              )
                orientation = view.getUint16(entry + 8, little);
            }
          }
        }
      }
      if (
        [
          192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
        ].includes(marker)
      ) {
        if (size < 8) throw new Error("JPEG inválido.");
        height = view.getUint16(offset + 3);
        width = view.getUint16(offset + 5);
      }
      offset += size;
    }
    if ([5, 6, 7, 8].includes(orientation)) [width, height] = [height, width];
  } else throw new Error("Use uma imagem PNG ou JPEG válida.");
  if (!width || !height || width * height > MAX_IMAGE_PIXELS)
    throw new Error("Imagem deve ter até 16 megapixels.");
  return { mime, width, height };
}
export function validateReference(i: ReferenceImage) {
  const metadata = inspectImage(imageBytes(i.data));
  if (
    metadata.mime !== i.mime ||
    metadata.width !== i.width ||
    metadata.height !== i.height ||
    !validImageTransform(i)
  )
    throw new Error("Conteúdo ou transformação da imagem inválidos.");
}
export async function decodeReference(
  i: Pick<ReferenceImage, "data" | "mime">,
): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = `data:${i.mime};base64,${i.data}`;
  try {
    await img.decode();
  } catch {
    throw new Error("Não foi possível decodificar a imagem.");
  }
  if (
    "width" in i &&
    "height" in i &&
    (img.naturalWidth !== i.width || img.naturalHeight !== i.height)
  )
    throw new Error("Dimensões da imagem inconsistentes.");
  return img;
}
export async function loadReference(
  file: File,
  floorId: string,
): Promise<ReferenceImage> {
  if (file.size > MAX_IMAGE_BYTES)
    throw new Error("Imagem deve ter até 10 MiB.");
  const bytes = new Uint8Array(await file.arrayBuffer()),
    info = inspectImage(bytes);
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
  const image: ReferenceImage = {
    ...info,
    floorId,
    name: file.name.slice(0, 200) || "Imagem",
    data,
    x: 0,
    y: 0,
    scale: 100,
    angle: 0,
    opacity: 0.4,
    visible: true,
  };
  await decodeReference(image);
  return image;
}
