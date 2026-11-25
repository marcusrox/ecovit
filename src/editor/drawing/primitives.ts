import type { Wall, ImageElement } from "../../domain/project";
import { bounds } from "../../domain/project";
import type { DrawingCamera } from "./shared";
import type { Clamp } from "../../domain/clamps";

export function drawWallBand(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  module: number,
  camera: DrawingCamera,
  {
    fill = "#c0c9bc",
    stroke = "#637969",
    width = 1,
    opacity = 1,
    contour = false,
  }: {
    fill?: string;
    stroke?: string;
    width?: number;
    opacity?: number;
    contour?: boolean;
  } = {},
) {
  const b = bounds(wall, module);
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  const x = b.x * camera.scale + camera.x,
    y = b.y * camera.scale + camera.y,
    w = b.width * camera.scale,
    h = b.height * camera.scale;
  if (contour) ctx.setLineDash([4, 3]);
  else ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
export function furniturePlacement(
  element: ImageElement,
  camera: DrawingCamera,
) {
  const width = element.width * camera.scale,
    height = element.depth * camera.scale;
  return {
    x: element.x * camera.scale + camera.x,
    y: element.y * camera.scale + camera.y,
    offsetX: width / 2,
    offsetY: height / 2,
    width,
    height,
    rotation: element.angle,
    scaleX: element.flipX ? -1 : 1,
    scaleY: element.flipY ? -1 : 1,
  };
}
export function clampPoints(c: Clamp, module: number, camera: DrawingCamera) {
  return [
    (c.a.x + module / 2) * camera.scale + camera.x,
    (c.a.y + module / 2) * camera.scale + camera.y,
    (c.b.x + module / 2) * camera.scale + camera.x,
    (c.b.y + module / 2) * camera.scale + camera.y,
  ];
}
