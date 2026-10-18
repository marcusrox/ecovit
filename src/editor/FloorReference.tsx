import { Layer, Shape } from "react-konva";
import { bounds, type Project } from "../domain/project";
import { openingBox } from "../domain/openings";
import { drawOpeningSymbol } from "./opening-symbol";

export function FloorReferenceLayer({
  doc,
  floorId,
  camera,
}: {
  doc: Project;
  floorId: string;
  camera: { x: number; y: number; scale: number };
}) {
  const walls = doc.model.walls.filter((w) => w.floorId === floorId),
    wallMap = new Map(walls.map((w) => [w.id, w])),
    slabs = doc.model.slabs.filter((s) => s.floorId === floorId),
    m = doc.project.base.width;
  return (
    <Layer listening={false} name="floor-reference">
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const xx = (x: number) => x * camera.scale + camera.x,
            yy = (y: number) => y * camera.scale + camera.y;
          ctx.save();
          ctx.strokeStyle = "#4880a1";
          ctx.globalAlpha = 0.6;
          ctx.lineWidth = 1.25;
          ctx.setLineDash([5, 4]);
          for (const slab of slabs)
            for (const ring of [
              slab.contour,
              ...slab.openings.map((o) => o.contour),
            ]) {
              ctx.beginPath();
              ring.forEach((p, i) =>
                i ? ctx.lineTo(xx(p.x), yy(p.y)) : ctx.moveTo(xx(p.x), yy(p.y)),
              );
              ctx.closePath();
              ctx.stroke();
            }
          for (const w of walls) {
            const b = bounds(w, m);
            ctx.strokeRect(
              xx(b.x),
              yy(b.y),
              b.width * camera.scale,
              b.height * camera.scale,
            );
          }
          for (const o of doc.model.openings) {
            const w = wallMap.get(o.wallId);
            if (!w) continue;
            const b = openingBox(o, w, m),
              x = xx(b.x),
              y = yy(b.y),
              width = b.width * camera.scale,
              height = b.height * camera.scale;
            ctx.strokeRect(x, y, width, height);
            drawOpeningSymbol(
              ctx,
              o.kind,
              w.a.y === w.b.y,
              x,
              y,
              width,
              height,
            );
          }
          ctx.restore();
        }}
      />
    </Layer>
  );
}
