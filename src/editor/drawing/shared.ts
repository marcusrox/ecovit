import {
  bounds,
  display,
  length,
  type EditableProject,
  type LocalProject,
  type Wall,
  type Opening,
} from "../../domain/project";
import { openingBox, openingIssue, openingLabel } from "../../domain/openings";
import { openingSymbolStrokes } from "../../domain/opening-symbol";
import { isChannel } from "../../domain/channels";
import { activeGrout, groutId } from "../../domain/grout";
import { drawPlanOpening } from "../opening-symbol";
import { labelFont, labelSpacing } from "../label-font";
import type { LabelPreferences } from "../../state/preferences";
export type DrawingCamera = { x: number; y: number; scale: number };
export function drawCoursePieces(
  ctx: CanvasRenderingContext2D,
  {
    doc,
    output,
    camera,
    size,
    course,
    ghost = "none",
    busy = false,
    groutMode = false,
    detail = false,
  }: {
    doc: LocalProject;
    output: LocalProject["generated"];
    camera: DrawingCamera;
    size: { width: number; height: number };
    course: number;
    ghost?: string;
    busy?: boolean;
    groutMode?: boolean;
    detail?: boolean;
  },
) {
  const module = doc.project.base.width;
  const axes = new Map(output?.grouts?.map((a) => [groutId(a), a]) ?? []);
  const render = (index: number, reference: boolean) => {
    for (const p of output?.courses[index]?.pieces ?? []) {
      const x = p.x * camera.scale + camera.x,
        y = p.y * camera.scale + camera.y,
        w = p.width * camera.scale,
        h = p.height * camera.scale;
      if (x + w < 0 || y + h < 0 || x > size.width || y > size.height) continue;
      ctx.save();
      ctx.globalAlpha = reference
        ? 0.7
        : doc.generationState.status === "outdated" && !busy
          ? 0.4
          : 1;
      ctx.strokeStyle = reference ? "#4880a1" : "#42392f";
      ctx.lineWidth = reference ? 2 : 1;
      ctx.setLineDash(reference ? [4, 3] : []);
      if (!reference) {
        ctx.fillStyle = isChannel(p)
          ? p.kind === "channel"
            ? "#d5b565"
            : "#b38a37"
          : p.kind === "whole"
            ? "#ba906e"
            : "#895b3f";
        ctx.fillRect(x, y, w, h);
      }
      ctx.strokeRect(x, y, w, h);
      if (isChannel(p)) {
        ctx.strokeStyle = reference ? "#4880a1" : "#fff0b9";
        ctx.lineWidth = Math.max(2, module * camera.scale * 0.24);
        ctx.beginPath();
        if (p.width > p.height) {
          ctx.moveTo(x + 2, y + h / 2);
          ctx.lineTo(x + w - 2, y + h / 2);
        } else if (p.height > p.width) {
          ctx.moveTo(x + w / 2, y + 2);
          ctx.lineTo(x + w / 2, y + h - 2);
        } else {
          const ws = doc.model.walls.filter(
            (w) =>
              p.wallIds.includes(w.id) &&
              w.height >= course * doc.project.base.height,
          );
          if (ws.some((w) => w.a.y === w.b.y)) {
            ctx.moveTo(x + 2, y + h / 2);
            ctx.lineTo(x + w - 2, y + h / 2);
          }
          if (ws.some((w) => w.a.x === w.b.x)) {
            ctx.moveTo(x + w / 2, y + 2);
            ctx.lineTo(x + w / 2, y + h - 2);
          }
        }
        ctx.stroke();
      }
      if (detail || module * camera.scale >= 9) {
        ctx.fillStyle = "#f7eadd";
        for (let xx = 0; xx < p.width / module; xx++)
          for (let yy = 0; yy < p.height / module; yy++) {
            const axis = axes.get(
                groutId({
                  x: p.x + xx * module,
                  y: p.y + yy * module,
                }),
              ),
              row = output!.courses[index];
            const present =
              !!axis &&
              activeGrout(
                axis,
                doc.model.floors[0].level + row.bottom,
                doc.model.floors[0].level + row.top,
              );
            if (
              (reference && !present) ||
              (isChannel(p) && !groutMode && !present)
            )
              continue;
            ctx.fillStyle = present
              ? reference
                ? "#4880a1"
                : "#302c28"
              : "#f7eadd";
            ctx.beginPath();
            ctx.arc(
              x + (xx + 0.5) * module * camera.scale,
              y + (yy + 0.5) * module * camera.scale,
              module * camera.scale * 0.19,
              0,
              Math.PI * 2,
              false,
            );
            ctx.fill();
          }
      }
      ctx.restore();
    }
  };
  render(course - 1, false);
  if (ghost === "previous" && course > 1) render(course - 2, true);
  if (ghost === "next") render(course, true);
}
export function drawWallOpenings(
  ctx: CanvasRenderingContext2D,
  {
    doc,
    renderDoc = doc,
    rendered = doc.model.walls,
    camera,
    mode,
    course = 1,
    openingPreview = null,
    creating = false,
    selected = null,
    readonly = true,
    labelVisibility,
  }: {
    doc: LocalProject;
    renderDoc?: EditableProject;
    rendered?: Wall[];
    camera: DrawingCamera;
    mode: "plan" | "course";
    course?: number;
    openingPreview?: Opening | null;
    creating?: boolean;
    selected?: string | null;
    readonly?: boolean;
    labelVisibility: LabelPreferences;
  },
) {
  const module = doc.project.base.width;
  const visible = renderDoc.model.openings.map((o) =>
    openingPreview?.id === o.id ? openingPreview : o,
  );
  if (openingPreview && creating) visible.push(openingPreview);
  visible.sort((a, b) => Number(a.id === selected) - Number(b.id === selected));
  const labels: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[] = [];
  const gap = labelSpacing(5, camera.scale);
  const clearance = labelSpacing(3, camera.scale);
  const step = labelSpacing(14, camera.scale);
  if (mode === "plan" && labelVisibility.wall) {
    for (const wall of rendered) {
      const vertical = wall.a.x === wall.b.x;
      const text = `C: ${display(length(wall))} cm · H: ${display(wall.height)} cm`;
      ctx.save();
      ctx.font = labelFont(11, camera.scale);
      ctx.fillStyle = "#234b40";
      const metrics = ctx.measureText(text);
      const ascent = metrics.actualBoundingBoxAscent;
      const descent = metrics.actualBoundingBoxDescent;
      const box = bounds(wall, module);
      let x = vertical
        ? box.x * camera.scale + camera.x - gap - ascent
        : ((wall.a.x + wall.b.x) / 2) * camera.scale +
          camera.x -
          metrics.width / 2;
      let y = vertical
        ? ((wall.a.y + wall.b.y) / 2) * camera.scale +
          camera.y +
          metrics.width / 2
        : box.y * camera.scale + camera.y - gap;
      const rect = () => ({
        x: vertical ? x - descent : x,
        y: vertical ? y - metrics.width : y - ascent,
        width: vertical ? ascent + descent : metrics.width,
        height: vertical ? metrics.width : ascent + descent,
      });
      let r = rect();
      while (
        labels.some(
          (l) =>
            r.x < l.x + l.width + clearance &&
            r.x + r.width + clearance > l.x &&
            r.y < l.y + l.height + clearance &&
            r.y + r.height + clearance > l.y,
        )
      ) {
        if (vertical) x -= step;
        else y -= step;
        r = rect();
      }
      labels.push(r);
      ctx.translate(x, y);
      if (vertical) ctx.rotate(-Math.PI / 2);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }
  for (const o of visible) {
    const w = rendered.find((w) => w.id === o.wallId);
    if (!w || o.width <= 0) continue;
    const f = doc.model.floors[0],
      h = doc.project.base.height;
    if (
      mode === "course" &&
      !(
        f.level + (course - 1) * h < f.level + o.base + o.height &&
        f.level + course * h > f.level + o.base
      )
    )
      continue;
    const b = openingBox(o, w, module),
      x = b.x * camera.scale + camera.x,
      y = b.y * camera.scale + camera.y,
      width = b.width * camera.scale,
      height = b.height * camera.scale;
    ctx.save();
    ctx.strokeStyle = openingIssue(renderDoc, o)
      ? "#a0392c"
      : selected === o.id
        ? "#215f4b"
        : "#4b6072";
    ctx.lineWidth = selected === o.id ? 2 : 1;
    ctx.fillStyle = "#f6f8f3";
    ctx.setLineDash(o.kind === "opening" ? [4, 3] : []);
    if (mode === "plan")
      drawPlanOpening(ctx, o, w.a.y === w.b.y, x, y, width, height);
    else {
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
    }
    ctx.setLineDash([]);
    ctx.fillStyle = "#234b40";
    ctx.font = labelFont(11, camera.scale);
    const label = `${openingLabel[o.kind]} · ${display(o.base)}–${display(o.base + o.height)} cm`,
      metrics = ctx.measureText(label),
      ascent = metrics.actualBoundingBoxAscent,
      descent = metrics.actualBoundingBoxDescent,
      vertical = w.a.x === w.b.x;
    let labelX = vertical ? x - gap - ascent : x,
      labelY = vertical ? y + height : y - gap;
    if (mode === "plan" && o.appearance?.type === "double-sliding") {
      for (const stroke of openingSymbolStrokes(
        o,
        !vertical,
        x,
        y,
        width,
        height,
      )) {
        for (const point of stroke.points) {
          if (vertical) labelX = Math.min(labelX, point.x - gap - ascent);
          else labelY = Math.min(labelY, point.y - gap);
        }
      }
    }
    const labelBounds = () => ({
      x: vertical ? labelX - descent : labelX,
      y: vertical ? labelY - metrics.width : labelY - ascent,
      width: vertical ? ascent + descent : metrics.width,
      height: vertical ? metrics.width : ascent + descent,
    });
    let bounds = labelBounds();
    while (
      (vertical ? bounds.x >= 0 : bounds.y >= 0) &&
      labels.some(
        (l) =>
          bounds.x < l.x + l.width + clearance &&
          bounds.x + bounds.width + clearance > l.x &&
          bounds.y < l.y + l.height + clearance &&
          bounds.y + bounds.height + clearance > l.y,
      )
    ) {
      if (vertical) labelX -= step;
      else labelY -= step;
      bounds = labelBounds();
    }
    if (labelVisibility[o.kind] && (vertical ? bounds.x >= 0 : bounds.y >= 0)) {
      labels.push(bounds);
      ctx.save();
      ctx.translate(labelX, labelY);
      if (vertical) ctx.rotate(-Math.PI / 2);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
    if (mode === "plan" && selected === o.id && !readonly) {
      for (const [xx, yy] of w.a.y === w.b.y
        ? [
            [x, y + height / 2],
            [x + width, y + height / 2],
          ]
        : [
            [x + width / 2, y],
            [x + width / 2, y + height],
          ]) {
        ctx.beginPath();
        ctx.arc(xx, yy, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  return labels;
}
