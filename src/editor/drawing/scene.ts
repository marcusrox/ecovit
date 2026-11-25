import { drawWallBand, furniturePlacement, clampPoints } from "./primitives";
import { bounds, type LocalProject, type Point } from "../../domain/project";
import { openingBox } from "../../domain/openings";
import { openingSymbolStrokes } from "../../domain/opening-symbol";
import { elementCorners } from "../../domain/image-elements";
import { imageCorners } from "../../domain/reference-image";
import { textWorld } from "../../domain/text";
import { roomGeometry } from "../../domain/rooms";
import { measurementGeometry } from "../../domain/measurements";
import { compassCorners } from "../../domain/terrain-compass";
import type { LabelPreferences } from "../../state/preferences";
import {
  drawCoursePieces,
  drawWallOpenings,
  type DrawingCamera,
} from "./shared";
import {
  drawSlab,
  drawTerrainText,
  drawMeasurements,
  drawTerrain,
  drawCompass,
} from "./elements";
import { drawAnnotation } from "./annotations";
import { annotationLayout } from "./annotation-layout";
import { roomLabelLayout, drawRooms } from "./room-label";
import { labelFont, labelSpacing } from "../label-font";
import { channelReinforcementLines } from "../channel-reinforcement-drawing";
import { terrainAreaText, terrainLabelPoint } from "../../domain/terrain";
import { terrainTexture } from "../terrain-textures";
import type { FurnitureBitmap } from "../furniture-bitmaps";
import { elementUrl } from "../../domain/image-elements";

export type Scene = {
  doc: LocalProject;
  mode: "plan" | "course";
  course: number;
  labels: LabelPreferences;
  furniture: boolean;
  terrain: boolean;
  image: boolean;
};
export type Resources = {
  furniture: Map<string, FurnitureBitmap>;
  reference?: HTMLImageElement;
};
export type DrawingBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};
const rectPoints = (b: DrawingBounds) => [
  { x: b.x, y: b.y },
  { x: b.x + b.width, y: b.y + b.height },
];

export function sceneBounds(
  scene: Scene,
  ctx: CanvasRenderingContext2D,
): DrawingBounds {
  const { doc, mode, course } = scene,
    m = doc.project.base.width;
  const points: Point[] = [];
  const walls = doc.model.walls.filter(
    (w) => mode === "plan" || w.height > (course - 1) * doc.project.base.height,
  );
  walls.forEach((w) => points.push(...rectPoints(bounds(w, m))));
  if (mode === "course") {
    doc.generated?.courses
      .find((r) => r.number === course)
      ?.pieces.forEach((p) => points.push(...rectPoints(p)));
    const camera = { x: 1000000, y: 1000000, scale: 1 };
    for (const d of channelReinforcementLines(
      doc.generated?.reinforcement?.filter((r) => r.course === course) ?? [],
      m,
      camera,
    ))
      for (const line of d.lines)
        for (let i = 0; i < line.length; i += 2)
          points.push({ x: line[i] - camera.x, y: line[i + 1] - camera.y });
    for (const c of doc.generated?.clamps?.filter((c) => c.course === course) ??
      [])
      points.push(
        { x: c.a.x + m / 2, y: c.a.y + m / 2 },
        { x: c.b.x + m / 2, y: c.b.y + m / 2 },
      );
  } else {
    for (const slab of doc.model.slabs) points.push(...slab.contour);
    if (scene.furniture)
      doc.model.imageElements.forEach((e) => points.push(...elementCorners(e)));
    if (scene.image)
      doc.model.referenceImages.forEach((i) => points.push(...imageCorners(i)));
    if (scene.terrain && doc.model.terrain) {
      points.push(...doc.model.terrain.contour);
      if (doc.model.terrain.compass?.visible)
        points.push(...compassCorners(doc.model.terrain.compass));
      if (scene.labels.terrain) {
        const p = terrainLabelPoint(doc.model.terrain.contour);
        ctx.font = labelFont(12, 1, 600);
        const width = ctx.measureText(
          `Terreno · ${terrainAreaText(doc.model.terrain.contour)}`,
        ).width;
        points.push(
          { x: p.x - width / 2, y: p.y - 1600 },
          { x: p.x + width / 2, y: p.y + 1600 },
        );
      }
    }
    for (const t of doc.model.texts) {
      const h = annotationLayout(t).height;
      for (const p of [
        { x: 0, y: 0 },
        { x: t.width, y: 0 },
        { x: 0, y: h },
        { x: t.width, y: h },
      ])
        points.push(textWorld(t, p));
    }
    doc.model.roomBoundaries.forEach((l) => points.push(l.a, l.b));
    const geometry = roomGeometry(doc, doc.viewFloorId);
    for (const l of doc.model.roomLabels) {
      const b = roomLabelLayout(l, geometry, ctx, 1);
      points.push(
        { x: l.position.x - b.width / 2, y: l.position.y - b.height / 2 },
        { x: l.position.x + b.width / 2, y: l.position.y + b.height / 2 },
      );
    }
    for (const measurement of doc.model.measurements) {
      const l = measurementGeometry(measurement);
      points.push(measurement.a, measurement.b, l.a, l.b);
      if (scene.labels.measure) {
        ctx.font = labelFont(11, 1);
        const padding =
          ctx.measureText(
            `${Math.hypot(measurement.a.x - measurement.b.x, measurement.a.y - measurement.b.y) / 100} cm`,
          ).width /
            2 +
          labelSpacing(20, 1);
        const c = { x: (l.a.x + l.b.x) / 2, y: (l.a.y + l.b.y) / 2 };
        points.push(
          { x: c.x - padding, y: c.y - padding },
          { x: c.x + padding, y: c.y + padding },
        );
      }
    }
  }
  const camera = { x: 1000000, y: 1000000, scale: 1 };
  for (const b of drawWallOpenings(ctx, {
    doc,
    rendered: walls,
    camera,
    mode,
    course,
    labelVisibility: scene.labels,
  }))
    points.push(...rectPoints({ ...b, x: b.x - camera.x, y: b.y - camera.y }));
  if (mode === "plan")
    for (const o of doc.model.openings) {
      const w = walls.find((w) => w.id === o.wallId);
      if (!w) continue;
      const b = openingBox(o, w, m);
      for (const stroke of openingSymbolStrokes(
        o,
        w.a.y === w.b.y,
        b.x,
        b.y,
        b.width,
        b.height,
      ))
        points.push(...stroke.points);
    }
  if (!points.length) return { x: 0, y: 0, width: 1000, height: 1000 };
  let x = Infinity,
    y = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  for (const p of points) {
    x = Math.min(x, p.x);
    y = Math.min(y, p.y);
    right = Math.max(right, p.x);
    bottom = Math.max(bottom, p.y);
  }
  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
  };
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  camera: DrawingCamera,
  size: { width: number; height: number },
  resources: Resources,
) {
  const { doc, mode, course, labels } = scene,
    m = doc.project.base.width;
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const screen = (p: Point) => ({
    x: camera.x + p.x * camera.scale,
    y: camera.y + p.y * camera.scale,
  });
  if (mode === "plan") {
    if (scene.terrain && doc.model.terrain)
      drawTerrain(
        ctx,
        doc.model.terrain,
        terrainTexture(doc.model.terrain.material),
        camera,
      );
    const image = doc.model.referenceImages[0];
    if (scene.image && image && resources.reference) {
      ctx.save();
      const p = screen(image);
      ctx.translate(p.x, p.y);
      ctx.rotate((image.angle * Math.PI) / 180);
      ctx.globalAlpha = image.opacity;
      ctx.drawImage(
        resources.reference,
        0,
        0,
        image.width * image.scale * camera.scale,
        image.height * image.scale * camera.scale,
      );
      ctx.restore();
    }
    doc.model.slabs.forEach((s) => drawSlab(ctx, s, camera));
    if (scene.furniture)
      for (const e of doc.model.imageElements) {
        const bitmap = resources.furniture.get(
          elementUrl(e, doc.model.customImageAssets),
        );
        if (!bitmap) throw Error(`Imagem indisponível: ${e.name}`);
        const { image, crop } = bitmap.levels[0];
        ctx.save();
        const p = furniturePlacement(e, camera);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.scale(p.scaleX, p.scaleY);
        ctx.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          -p.offsetX,
          -p.offsetY,
          p.width,
          p.height,
        );
        ctx.restore();
      }
  }
  const walls = doc.model.walls.filter(
    (w) => mode === "plan" || w.height > (course - 1) * doc.project.base.height,
  );
  walls.forEach((w) =>
    drawWallBand(ctx, w, m, camera, { contour: mode === "course" }),
  );
  if (mode === "course")
    drawCoursePieces(ctx, {
      doc,
      output: doc.generated,
      camera,
      size,
      course,
      detail: true,
    });
  drawWallOpenings(ctx, {
    doc,
    rendered: walls,
    camera,
    mode,
    course,
    labelVisibility: labels,
  });
  if (mode === "course") {
    for (const r of channelReinforcementLines(
      doc.generated?.reinforcement?.filter((r) => r.course === course) ?? [],
      m,
      camera,
    ))
      for (const points of r.lines) {
        ctx.beginPath();
        ctx.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2)
          ctx.lineTo(points[i], points[i + 1]);
        ctx.strokeStyle = "#fff8e9";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.strokeStyle = "#6b3fa0";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    for (const c of doc.generated?.clamps?.filter((c) => c.course === course) ??
      []) {
      const points = clampPoints(c, m, camera),
        a = { x: points[0], y: points[1] },
        b = { x: points[2], y: points[3] };
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = "#fff8e9";
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.setLineDash(c.pending ? [5, 4] : []);
      ctx.strokeStyle = c.pending ? "#b33a29" : "#a74416";
      ctx.lineWidth = 3;
      ctx.stroke();
      if (c.pending) {
        ctx.fillStyle = "#b33a29";
        ctx.beginPath();
        ctx.arc((a.x + b.x) / 2, (a.y + b.y) / 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 12px "IBM Plex Sans"';
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("!", (a.x + b.x) / 2, (a.y + b.y) / 2 + 4);
      }
      ctx.restore();
    }
  } else {
    drawMeasurements(ctx, doc.model.measurements, camera, labels.measure);
    const geometry = roomGeometry(doc, doc.viewFloorId);
    drawRooms(ctx, {
      doc,
      camera,
      layout: (l) => roomLabelLayout(l, geometry, ctx, camera.scale),
    });
    if (scene.terrain && doc.model.terrain) {
      const t = doc.model.terrain;
      if (t.compass?.visible) drawCompass(ctx, t.compass, camera);
      if (labels.terrain)
        drawTerrainText(
          ctx,
          `Terreno · ${terrainAreaText(t.contour)}`,
          terrainLabelPoint(t.contour),
          camera,
        );
    }
    doc.model.texts.forEach((t) => drawAnnotation(ctx, t, camera));
  }
  ctx.restore();
}
