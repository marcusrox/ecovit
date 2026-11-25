import type {
  Terrain,
  TerrainCompass,
  Slab,
  Measurement,
  Point,
} from "../../domain/project";
import { TERRAIN_TILE_WORLD } from "../terrain-textures";
import {
  measurementGeometry,
  measurementText,
} from "../../domain/measurements";
import { labelFont, labelSpacing, LABEL_REFERENCE_SCALE } from "../label-font";
import type { DrawingCamera } from "./shared";

export function drawTerrain(
  ctx: CanvasRenderingContext2D,
  terrain: Terrain,
  tile: HTMLCanvasElement,
  camera: DrawingCamera,
) {
  const screen = (p: Point) => ({
    x: camera.x + p.x * camera.scale,
    y: camera.y + p.y * camera.scale,
  });

  ctx.save();
  ctx.beginPath();
  terrain.contour.forEach((p, i) => {
    const q = screen(p);
    if (i) ctx.lineTo(q.x, q.y);
    else ctx.moveTo(q.x, q.y);
  });
  ctx.closePath();
  const pattern = ctx.createPattern(tile, "repeat")!;
  const origin = screen(terrain.textureOrigin),
    scale = (TERRAIN_TILE_WORLD / tile.width) * camera.scale;
  pattern.setTransform(new DOMMatrix([scale, 0, 0, scale, origin.x, origin.y]));
  ctx.fillStyle = pattern;
  ctx.fill();
  ctx.strokeStyle = "#64794f";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

export function drawCompass(
  ctx: CanvasRenderingContext2D,
  compass: TerrainCompass,
  camera: DrawingCamera,
  selected = false,
) {
  const s = compass.size * camera.scale;
  ctx.save();
  ctx.translate(
    camera.x + compass.center.x * camera.scale,
    camera.y + compass.center.y * camera.scale,
  );
  ctx.rotate((compass.angle * Math.PI) / 180);
  ctx.lineWidth = Math.max(0.7, s * 0.008);
  ctx.strokeStyle = "#245d49";
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 4);
    const r = s * (i % 2 ? 0.22 : 0.32),
      w = s * 0.055;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(side * w, 0);
      ctx.lineTo(0, s * 0.06);
      ctx.closePath();
      ctx.fillStyle = side < 0 ? "#245d49" : "#f8faf5";
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.fillStyle = "#183d31";
  ctx.font = labelFont(
    compass.size * LABEL_REFERENCE_SCALE * 0.14,
    camera.scale,
    600,
  );
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const [label, x, y] of [
    ["N", 0, -0.42],
    ["L", 0.42, 0],
    ["S", 0, 0.42],
    ["O", -0.42, 0],
  ] as const)
    ctx.fillText(label, s * x, s * y);
  if (selected) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#245d49";
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(-s / 2, -s / 2, s, s);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, -s / 2);
    ctx.lineTo(0, -s / 2 - 24);
    ctx.stroke();
    ctx.fillStyle = "white";
    for (const [x, y] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      ctx.fillRect((x * s) / 2 - 4, (y * s) / 2 - 4, 8, 8);
      ctx.strokeRect((x * s) / 2 - 4, (y * s) / 2 - 4, 8, 8);
    }
    ctx.beginPath();
    ctx.arc(0, -s / 2 - 24, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function drawSlab(
  ctx: CanvasRenderingContext2D,
  s: Slab,
  camera: DrawingCamera,
  color = "#809291",
  fill = true,
) {
  const native = ctx;
  const screen = (p: Point) => ({
    x: camera.x + p.x * camera.scale,
    y: camera.y + p.y * camera.scale,
  });

  ctx.beginPath();
  for (const ring of [s.contour, ...s.openings.map((o) => o.contour)]) {
    ring.forEach((p, i) => {
      const q = screen(p);
      if (i) ctx.lineTo(q.x, q.y);
      else ctx.moveTo(q.x, q.y);
    });
    ctx.closePath();
  }

  native.fillStyle = "rgba(115,145,145,0.17)";
  if (fill) native.fill("evenodd");
  native.strokeStyle = color;
  native.lineWidth = 1.5;
  native.stroke();
}

export function drawMeasurements(
  ctx: CanvasRenderingContext2D,
  rendered: Measurement[],
  camera: DrawingCamera,
  visibleLabel: boolean,
  select: string | null = null,
  preview: Measurement | null = null,
  isEditing?: (m: Measurement) => boolean,
) {
  for (const m of rendered) {
    const line = measurementGeometry(m);
    const a = {
      x: line.a.x * camera.scale + camera.x,
      y: line.a.y * camera.scale + camera.y,
    };
    const b = {
      x: line.b.x * camera.scale + camera.x,
      y: line.b.y * camera.scale + camera.y,
    };
    ctx.save();
    ctx.strokeStyle =
      m.id === select || m.id === preview?.id ? "#205d48" : "#52627b";
    ctx.lineWidth = m.id === select ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    // Witness lines join the measured anchors to the parallel cota.
    if (m.offset) {
      const sign = Math.sign(m.offset);
      for (const [anchor, end] of [
        [m.a, a],
        [m.b, b],
      ] as const) {
        ctx.moveTo(
          anchor.x * camera.scale + camera.x,
          anchor.y * camera.scale + camera.y,
        );
        ctx.lineTo(
          end.x + line.normal.x * sign * 4,
          end.y + line.normal.y * sign * 4,
        );
      }
    }
    // Diagonal end marks use a constant screen size at every zoom.
    if (m.a.x !== m.b.x || m.a.y !== m.b.y) {
      const tx = (line.normal.y + line.normal.x) * 4;
      const ty = (-line.normal.x + line.normal.y) * 4;
      for (const end of [a, b]) {
        ctx.moveTo(end.x - tx, end.y - ty);
        ctx.lineTo(end.x + tx, end.y + ty);
      }
    }
    ctx.stroke();
    const showEditingLabel = isEditing?.(m);
    if (visibleLabel || showEditingLabel) {
      let angle = Math.atan2(b.y - a.y, b.x - a.x);
      if (angle > Math.PI / 2) angle -= Math.PI;
      if (angle <= -Math.PI / 2) angle += Math.PI;
      ctx.translate((a.x + b.x) / 2, (a.y + b.y) / 2);
      ctx.rotate(angle);
      ctx.font = labelFont(11, camera.scale);
      ctx.fillStyle = "#234b40";
      const text = measurementText(m),
        width = ctx.measureText(text).width;
      ctx.fillText(text, -width / 2, -labelSpacing(6, camera.scale));
    }
    ctx.restore();
  }
}

export function drawTerrainText(
  ctx: CanvasRenderingContext2D,
  value: string,
  p: Point,
  camera: DrawingCamera,
  offset = 0,
) {
  const screen = (p: Point) => ({
    x: camera.x + p.x * camera.scale,
    y: camera.y + p.y * camera.scale,
  });
  const q = screen(p);
  const spacing = (value: number) => labelSpacing(value, camera.scale);
  offset = spacing(offset);
  ctx.font = labelFont(12, camera.scale, 600);
  const w = ctx.measureText(value).width;
  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.fillRect(
    q.x - w / 2 - spacing(6),
    q.y - spacing(10) + offset,
    w + spacing(12),
    spacing(22),
  );
  ctx.fillStyle = "#254d38";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(value, q.x, q.y + offset + spacing(1));
}
