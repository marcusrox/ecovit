import { labelFont, labelSpacing, LABEL_REFERENCE_SCALE } from "../label-font";
import { roomAreaText, roomGeometry } from "../../domain/rooms";
import type { RoomLabel } from "../../domain/project";
const wrappingFont = labelFont(13, LABEL_REFERENCE_SCALE);
function textLines(text: string, ctx: CanvasRenderingContext2D) {
  ctx.font = wrappingFont;
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= 164) {
      line = candidate;
      continue;
    }
    if (line) {
      lines.push(line);
      line = "";
    }
    for (const char of word) {
      if (line && ctx.measureText(line + char).width > 164) {
        lines.push(line);
        line = "";
      }
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function roomLabelLayout(
  l: RoomLabel,
  geometry: ReturnType<typeof roomGeometry>,
  canvas: CanvasRenderingContext2D,
  scale: number,
) {
  const region = l.review ? undefined : geometry.at(l.reference);
  const lines = l.excludedFromAreas
    ? [
        ...textLines(l.name, canvas),
        roomAreaText(0),
        ...(l.review || !region ? ["Revisar ambiente"] : []),
      ]
    : l.review || !region
      ? ["Revisar ambiente"]
      : [...textLines(l.name, canvas), roomAreaText(region.area)];
  canvas.font = labelFont(13, scale);
  return {
    lines,
    width:
      Math.max(...lines.map((t) => canvas.measureText(t).width)) +
      labelSpacing(12, scale),
    height: lines.length * labelSpacing(18, scale) + labelSpacing(8, scale),
  };
}

export function drawRooms(
  ctx: CanvasRenderingContext2D,
  {
    doc,
    camera,
    layout,
    select = null,
    linePreview = null,
    labelPreview = null,
    target = null,
  }: {
    doc: import("../../domain/project").LocalProject;
    camera: import("./shared").DrawingCamera;
    layout: (l: RoomLabel) => {
      lines: string[];
      width: number;
      height: number;
    };
    select?: string | null;
    linePreview?: import("../../domain/project").RoomBoundary | null;
    labelPreview?: RoomLabel | null;
    target?: import("../../domain/project").Point | null;
  },
) {
  const native = ctx;
  const font = labelFont(13, camera.scale),
    lineHeight = labelSpacing(18, camera.scale);
  const screen = (p: import("../../domain/project").Point) => ({
    x: camera.x + p.x * camera.scale,
    y: camera.y + p.y * camera.scale,
  });
  const lines = doc.model.roomBoundaries.map((l) =>
    linePreview?.id === l.id ? linePreview : l,
  );
  if (linePreview && !lines.some((l) => l.id === linePreview.id))
    lines.push(linePreview);
  for (const l of lines) {
    const a = screen(l.a),
      b = screen(l.b);
    native.strokeStyle =
      l.id === select || l.id === linePreview?.id ? "#156d46" : "#596f65";
    native.lineWidth = 1.5;
    native.setLineDash([7, 5]);
    native.beginPath();
    native.moveTo(a.x, a.y);
    native.lineTo(b.x, b.y);
    native.stroke();
    native.setLineDash([]);
    if (l.id === select)
      for (const p of [a, b]) {
        native.fillStyle = "#fff";
        native.beginPath();
        native.arc(p.x, p.y, 5, 0, Math.PI * 2);
        native.fill();
        native.stroke();
      }
  }
  for (const original of doc.model.roomLabels) {
    const l = labelPreview?.id === original.id ? labelPreview : original,
      box = layout(l),
      p = screen(l.position);
    if (l.id === select) {
      native.strokeStyle = "#156d46";
      native.lineWidth = 1;
      native.strokeRect(
        p.x - box.width / 2,
        p.y - box.height / 2,
        box.width,
        box.height,
      );
    }
    native.fillStyle = l.review ? "#934b19" : "#203b2b";
    native.font = font;
    native.textAlign = "center";
    native.textBaseline = "middle";
    box.lines.forEach((text, i) =>
      native.fillText(
        text,
        p.x,
        p.y - ((box.lines.length - 1) * lineHeight) / 2 + i * lineHeight,
      ),
    );
  }
  if (target) {
    const p = screen(target);
    native.strokeStyle = "#156d46";
    native.lineWidth = 2;
    native.strokeRect(p.x - 4, p.y - 4, 8, 8);
  }
}
