import type { Opening } from "../domain/project";
import { openingSymbolStrokes } from "../domain/opening-symbol";

export function drawOpeningSymbol(
  ctx: Pick<
    CanvasRenderingContext2D,
    "beginPath" | "moveTo" | "lineTo" | "stroke" | "setLineDash" | "getLineDash"
  >,
  opening: Pick<Opening, "kind" | "appearance">,
  horizontal: boolean,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const dash = ctx.getLineDash();
  for (const stroke of openingSymbolStrokes(
    opening,
    horizontal,
    x,
    y,
    width,
    height,
  )) {
    ctx.setLineDash(stroke.dashed ? [5, 4] : dash);
    ctx.beginPath();
    stroke.points.forEach((p, i) =>
      i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
    );
    ctx.stroke();
  }
  ctx.setLineDash(dash);
}
