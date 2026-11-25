import type { TextAnnotation } from "../../domain/text";
import { annotationLayout } from "./annotation-layout";
import type { DrawingCamera } from "./shared";

export function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  t: TextAnnotation,
  camera: DrawingCamera,
  position = true,
) {
  const layout = annotationLayout(t),
    s = camera.scale;
  ctx.save();
  if (position) {
    ctx.translate(camera.x + t.x * s, camera.y + t.y * s);
    ctx.rotate((t.rotation * Math.PI) / 180);
  }
  if (t.background) {
    ctx.fillStyle = "#f5f4ee";
    ctx.fillRect(0, 0, t.width * s, layout.height * s);
  }
  if (t.border) {
    ctx.strokeStyle = "#64794f";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, t.width * s, layout.height * s);
  }
  ctx.font = `${t.bold ? 600 : 400} ${t.size * s}px "IBM Plex Sans"`;
  ctx.fillStyle = t.color;
  ctx.textAlign = t.align;
  ctx.textBaseline = "middle";
  const x =
    t.align === "left" ? 0 : t.width * s * (t.align === "center" ? 0.5 : 1);
  layout.lines.forEach((line, i) =>
    ctx.fillText(line, x, (i + 0.5) * t.size * s * 1.25),
  );
  ctx.restore();
}
