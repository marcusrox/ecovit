import type { Opening } from "../domain/project";

export function drawOpeningSymbol(
  ctx: Pick<
    CanvasRenderingContext2D,
    "beginPath" | "moveTo" | "lineTo" | "stroke"
  >,
  kind: Opening["kind"],
  horizontal: boolean,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (kind === "opening") return;
  ctx.beginPath();
  if (kind === "window") {
    if (horizontal) {
      ctx.moveTo(x, y + height / 3);
      ctx.lineTo(x + width, y + height / 3);
      ctx.moveTo(x, y + (2 * height) / 3);
      ctx.lineTo(x + width, y + (2 * height) / 3);
    } else {
      ctx.moveTo(x + width / 3, y);
      ctx.lineTo(x + width / 3, y + height);
      ctx.moveTo(x + (2 * width) / 3, y);
      ctx.lineTo(x + (2 * width) / 3, y + height);
    }
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y + height);
  }
  ctx.stroke();
}
