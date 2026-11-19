import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { imageCatalog, catalogUrl } from "../src/domain/image-catalog";
import { standardElement } from "../src/domain/image-elements";
import crops from "../src/editor/furniture-crops.json";

const rendered = vi.hoisted(() => ({
  bitmap: {
    crop: { x: 0, y: 0, width: 1, height: 1 },
    levels: [],
  },
  image: vi.fn<(props: Record<string, unknown>) => null>(() => null),
  level: vi.fn(),
}));
// Supply an already decoded bitmap; exercise the actual component's drawing props.
vi.mock("react", async (original) => {
  const react = await original<typeof import("react")>();
  return {
    ...react,
    useState: (initial: unknown) => [
      initial === null ? rendered.bitmap : initial,
      vi.fn(),
    ],
  };
});
vi.mock("konva", () => ({ default: { pixelRatio: 2 } }));
vi.mock("react-konva", () => ({
  Image: rendered.image,
  Circle: () => null,
  Rect: () => null,
  Group: () => null,
  Layer: () => null,
  Line: () => null,
}));
vi.mock("../src/editor/furniture-bitmaps", () => ({
  acquireFurnitureBitmap: vi.fn(),
  furnitureBitmapLevel: rendered.level,
  setFurnitureSmoothing: vi.fn(),
}));
import { ObjectBitmap } from "../src/editor/ImageElements";

afterEach(() => vi.clearAllMocks());

const catalog = [
  ...imageCatalog,
  { ...imageCatalog.find((i) => i.id === "tv")!, revision: 1 },
  { ...imageCatalog.find((i) => i.id === "tv")!, revision: 2 },
  {
    ...imageCatalog.find((i) => i.id === "bloco-concreto-contencao")!,
    revision: 1,
  },
];

it.each(catalog)(
  "$id r$revision ocupa o retângulo nominal e redimensionado, inclusive em prévia",
  (item) => {
    rendered.bitmap.crop = crops[catalogUrl(item) as keyof typeof crops];
    rendered.level.mockReturnValue({ image: {}, crop: rendered.bitmap.crop });
    const original = standardElement(item, "floor");
    const camera = { x: 25, y: -30, scale: 0.02 };
    for (const ghost of [false, true]) {
      const element = {
        ...original,
        x: 12000,
        y: 23000,
        width: original.width * (ghost ? 1.5 : 1),
        depth: original.depth * (ghost ? 0.7 : 1),
        angle: 90,
        flipX: true,
        flipY: true,
      };
      renderToStaticMarkup(
        createElement(ObjectBitmap, { element, assets: [], camera, ghost }),
      );
      const width = element.width * camera.scale;
      const height = element.depth * camera.scale;
      expect(rendered.image.mock.calls.at(-1)?.[0]).toMatchObject({
        width,
        height,
        offsetX: width / 2,
        offsetY: height / 2,
        x: element.x * camera.scale + camera.x,
        y: element.y * camera.scale + camera.y,
        rotation: 90,
        scaleX: -1,
        scaleY: -1,
        opacity: ghost ? 0.65 : 1,
        crop: rendered.bitmap.crop,
      });
      expect(rendered.level).toHaveBeenLastCalledWith(
        rendered.bitmap,
        width * 2,
        height * 2,
      );
    }
  },
);

it("upload conserva a imagem completa, com suas margens, no retângulo da ocorrência", () => {
  rendered.bitmap.crop = { x: 0, y: 0, width: 800, height: 600 };
  rendered.level.mockReturnValue({ image: {}, crop: rendered.bitmap.crop });
  const element = {
    ...standardElement(imageCatalog[0], "floor"),
    source: { kind: "custom" as const, assetId: "upload" },
    width: 12000,
    depth: 5000,
  };
  renderToStaticMarkup(
    createElement(ObjectBitmap, {
      element,
      assets: [
        {
          id: "upload",
          name: "Upload",
          mime: "image/png",
          width: 800,
          height: 600,
          data: "bytes",
        },
      ],
      camera: { x: 0, y: 0, scale: 0.02 },
    }),
  );
  expect(rendered.image.mock.calls.at(-1)?.[0]).toMatchObject({
    width: 240,
    height: 100,
    crop: { x: 0, y: 0, width: 800, height: 600 },
  });
});
