import { beforeEach, expect, it, vi } from "vitest";
vi.mock("../src/persistence/database", () => ({
  saveProject: vi.fn().mockResolvedValue(1),
  loadProject: vi.fn(),
  acquireProject: vi.fn().mockResolvedValue(() => {}),
}));
import {
  createProject,
  LIMIT,
  type ReferenceImage,
} from "../src/domain/project";
import {
  calibrateImage,
  imagePoint,
  pixelPoint,
  imageCorners,
  inspectImage,
  imageBytes,
  MAX_IMAGE_BYTES,
  validImageTransform,
} from "../src/domain/reference-image";
import {
  parseFile,
  serializeFile,
  validateProject,
} from "../src/persistence/files";
import {
  duplicateFloor,
  removeFloor,
  mergeFloorView,
} from "../src/domain/floors";
import * as engine from "../src/domain/composition";
import { useStore } from "../src/state/store";
import { saveProject } from "../src/persistence/database";
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==";
function sealPNG(bytes: Uint8Array) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let at = 8; at + 12 <= bytes.length;) {
    const n = v.getUint32(at);
    let c = 0xffffffff;
    for (let k = at + 4; k < at + 8 + n; k++) {
      c ^= bytes[k];
      for (let bit = 0; bit < 8; bit++)
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    v.setUint32(at + 8 + n, (c ^ 0xffffffff) >>> 0);
    at += n + 12;
  }
  return bytes;
}
const project = () =>
  createProject("Imagem", { length: 2500, width: 1250, height: 700 });
const image = (floorId: string): ReferenceImage => ({
  floorId,
  name: "planta.png",
  mime: "image/png",
  data: png,
  width: 1,
  height: 1,
  x: -1234,
  y: 5678,
  scale: 10000,
  angle: 27,
  opacity: 0.4,
  visible: true,
});
beforeEach(() => {
  vi.restoreAllMocks();
  useStore.setState({ busy: false });
  useStore.getState().close();
  vi.mocked(saveProject).mockReset().mockResolvedValue(1);
});

it("M8 calibração euclidiana conserva primeira âncora sob rotação e transformação inversa", () => {
  for (const angle of [-180, -37, 0, 90, 360]) {
    const i = { ...image(crypto.randomUUID()), angle },
      a = { x: 0.1, y: 0.2 },
      b = { x: 0.7, y: 1 };
    const fixed = imagePoint(i, a),
      next = calibrateImage(i, a, b, 40000),
      end = imagePoint(next, b);
    expect(imagePoint(next, a).x).toBeCloseTo(fixed.x, 8);
    expect(imagePoint(next, a).y).toBeCloseTo(fixed.y, 8);
    expect(Math.hypot(end.x - fixed.x, end.y - fixed.y)).toBeCloseTo(40000, 8);
    expect(pixelPoint(next, end).x).toBeCloseTo(b.x, 8);
    expect(pixelPoint(next, end).y).toBeCloseTo(b.y, 8);
    expect(i.scale).toBe(10000);
  }
});
it("M8 recusa pontos coincidentes, distância inválida e imagem além dos limites", () => {
  const i = image(crypto.randomUUID()),
    a = { x: 0, y: 0 };
  for (const d of [0, -1, NaN, Infinity])
    expect(() => calibrateImage(i, a, { x: 1, y: 0 }, d)).toThrow();
  expect(() => calibrateImage(i, a, a, 100)).toThrow();
  expect(validImageTransform({ ...i, x: LIMIT })).toBe(false);
  expect(validImageTransform({ ...i, scale: -1 })).toBe(false);
  expect(validImageTransform({ ...i, angle: 361 })).toBe(false);
  expect(validImageTransform({ ...i, opacity: 1.1 })).toBe(false);
  expect(imageCorners(i)).toHaveLength(4);
});
it("M8 valida tipo real, dimensões e limites individuais sem confiar na extensão", () => {
  const bytes = imageBytes(png);
  expect(inspectImage(bytes)).toEqual({
    mime: "image/png",
    width: 1,
    height: 1,
  });
  expect(() => inspectImage(new TextEncoder().encode("<svg/>"))).toThrow(
    /PNG ou JPEG/,
  );
  expect(() => inspectImage(bytes.slice(0, -4))).toThrow();
  expect(() => inspectImage(new Uint8Array(MAX_IMAGE_BYTES + 1))).toThrow(
    /10 MiB/,
  );
  const large = bytes.slice(),
    view = new DataView(large.buffer);
  view.setUint32(16, 4000);
  view.setUint32(20, 4000);
  expect(inspectImage(sealPNG(large)).width).toBe(4000);
  view.setUint32(20, 4001);
  expect(() => inspectImage(sealPNG(large))).toThrow(/16 megapixels/);
  expect(() => imageBytes("!!!!")).toThrow();
});
it("M8 arquivo 11, leitura 9/10 sem tocar origem e referências inválidas recusadas", () => {
  const d = project();
  d.model.referenceImages = [image(d.model.floors[0].id)];
  expect(parseFile(serializeFile(d).text)).toEqual(d);
  for (const version of ["9", "10", "11", null])
    expect(() => validateProject({ ...d, schemaVersion: version })).toThrow(
      /incompatível/,
    );
  for (const version of [9, 10]) {
    const old = JSON.parse(JSON.stringify(d));
    old.schemaVersion = version;
    delete old.model.imageElements;
    delete old.model.customImageAssets;
    delete old.model.referenceImages;
    if (version === 9) delete old.model.measurements;
    const original = JSON.stringify(old),
      normalized = validateProject(old);
    expect(normalized.schemaVersion).toBe(16);
    expect(normalized.model.referenceImages).toEqual([]);
    expect(JSON.stringify(old)).toBe(original);
    old.model.referenceImages = [];
    expect(() => validateProject(old)).toThrow();
  }
  for (const invalid of [
    { floorId: crypto.randomUUID() },
    { mime: "image/jpeg" },
    { width: 2 },
    { scale: 0 },
    { data: "AAAA" },
  ]) {
    const bad = structuredClone(d);
    Object.assign(bad.model.referenceImages[0], invalid);
    expect(() => validateProject(bad)).toThrow();
  }
  const twice = structuredClone(d);
  twice.model.referenceImages.push({ ...twice.model.referenceImages[0] });
  expect(() => validateProject(twice)).toThrow(/duplicada/);
});

it("M8 limite total considera expansão base64 mesmo com imagens dentro do limite individual", () => {
  const original = imageBytes(png),
    payload = MAX_IMAGE_BYTES - original.length - 12;
  const large = new Uint8Array(MAX_IMAGE_BYTES),
    view = new DataView(large.buffer);
  large.set(original.subarray(0, original.length - 12));
  const at = original.length - 12;
  view.setUint32(at, payload);
  large.set([110, 112, 65, 68], at + 4);
  large.set(original.subarray(original.length - 12), large.length - 12);
  expect(inspectImage(sealPNG(large)).width).toBe(1);
  const data = Buffer.from(large).toString("base64"),
    d = project();
  const first = d.model.floors[0];
  d.model.floors = [0, 1, 2, 3].map((n) => ({
    ...first,
    id: crypto.randomUUID(),
    level: n * 28000,
  }));
  d.model.referenceImages = d.model.floors.map((f) => ({
    ...image(f.id),
    data,
  }));
  expect(() => serializeFile(d)).toThrow(/50 MB/);
}, 30000);
it("M8 imagem preservada e independente em cópia, remoção e merge de pavimento", () => {
  const d = project(),
    floor = d.model.floors[0].id;
  d.model.referenceImages = [image(floor)];
  const copy = duplicateFloor(d, floor, 28000, "Superior"),
    second = copy.model.floors.find((f) => f.id !== floor)!;
  expect(copy.model.referenceImages[1]).toEqual({
    ...d.model.referenceImages[0],
    floorId: second.id,
  });
  copy.model.referenceImages[1].x += 100;
  expect(d.model.referenceImages[0].x).toBe(-1234);
  const view = engine.floorView(copy, second.id);
  expect(view.model.referenceImages).toHaveLength(1);
  const merged = mergeFloorView(copy, {
    ...view,
    model: { ...view.model, referenceImages: [] },
  });
  expect(merged.model.referenceImages).toEqual(d.model.referenceImages);
  expect(removeFloor(copy, second.id).model.referenceImages).toEqual(
    d.model.referenceImages,
  );
});
it("M8 edição/histórico não chamam motor mesmo desatualizado; falha de gravação retém download", async () => {
  const s = useStore.getState();
  await s.open(project(), true);
  const doc = useStore.getState().doc!,
    generated = doc.generated,
    spy = vi.spyOn(engine, "generate");
  spy.mockClear();
  await s.commit(
    {
      ...doc,
      model: { ...doc.model, referenceImages: [image(doc.model.floors[0].id)] },
    },
    "image",
  );
  expect(useStore.getState().doc!.generated).toEqual(generated);
  expect(spy).not.toHaveBeenCalled();
  await s.undo();
  expect(useStore.getState().doc!.model.referenceImages).toEqual([]);
  await s.undo(true);
  expect(spy).not.toHaveBeenCalled();
  const stale = {
    ...useStore.getState().doc!,
    generated: null,
    generationState: { status: "outdated" as const, diagnostics: [] },
  };
  useStore.setState({ doc: stale });
  vi.mocked(saveProject).mockRejectedValue(new Error("quota"));
  await s.commit(
    {
      ...stale,
      model: {
        ...stale.model,
        referenceImages: [{ ...stale.model.referenceImages[0], x: 999 }],
      },
    },
    "image",
  );
  expect(spy).not.toHaveBeenCalled();
  expect(useStore.getState().saved).toBe("error");
  expect(
    parseFile(serializeFile(useStore.getState().doc!).text).model
      .referenceImages[0].x,
  ).toBe(999);
  useStore.setState({ readonly: true });
  await s.commit(
    { ...stale, model: { ...stale.model, referenceImages: [] } },
    "image",
  );
  expect(useStore.getState().doc!.model.referenceImages).toHaveLength(1);
});
