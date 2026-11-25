import type { Opening } from "../domain/project";
import { openingSymbolStrokes } from "../domain/opening-symbol";

// Screen-space cutout: cover the wall stroke as well as its interior, without
// extending along the opening and erasing the adjacent wall/jambs.
export function drawPlanOpening(
  ctx: Pick<
    CanvasRenderingContext2D,
    | "save"
    | "restore"
    | "globalAlpha"
    | "globalCompositeOperation"
    | "fillRect"
    | "beginPath"
    | "moveTo"
    | "lineTo"
    | "stroke"
    | "setLineDash"
    | "getLineDash"
  >,
  opening: Pick<Opening, "kind" | "appearance">,
  horizontal: boolean,
  x: number,
  y: number,
  width: number,
  height: number,
  reference = false,
) {
  ctx.save();
  if (reference) {
    // Erase only this reference layer, preserving transparency over the active floor.
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-out";
  }
  const bleed = 1.5; // Includes the selected wall's 2 px stroke and antialiasing.
  ctx.fillRect(
    horizontal ? x : x - bleed,
    horizontal ? y - bleed : y,
    horizontal ? width : width + bleed * 2,
    horizontal ? height + bleed * 2 : height,
  );
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(horizontal ? x : x + width, horizontal ? y + height : y);
  ctx.moveTo(x + width, y + height);
  ctx.lineTo(horizontal ? x + width : x, horizontal ? y : y + height);
  ctx.stroke();
  drawOpeningSymbol(ctx, opening, horizontal, x, y, width, height);
}

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
