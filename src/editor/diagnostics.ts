import {
  bounds,
  display,
  type EditableProject,
  type Point,
} from "../domain/project";
import type { Diagnostic } from "../domain/composition";

export type DisplayDiagnostic = Diagnostic & {
  region?: ReturnType<typeof bounds>;
  focus: Point;
};

// Presentation only: keep saved nominal-v10 results and their integrity checks intact.
export function displayDiagnostics(doc: EditableProject): DisplayDiagnostic[] {
  const m = doc.project.base.width;
  return doc.generationState.diagnostics.flatMap((d): DisplayDiagnostic[] => {
    const fallback = { ...d, focus: { x: d.x, y: d.y } };
    if (d.code !== "overlap") return [fallback];
    const walls = doc.model.walls.filter(
      (w) => w.floorId === d.floorId && d.wallIds.includes(w.id),
    );
    const conflicts: DisplayDiagnostic[] = [];
    for (let i = 0; i < walls.length; i++) {
      const a = walls[i],
        r = bounds(a, m);
      for (const b of walls.slice(i + 1)) {
        if ((a.a.y === a.b.y) !== (b.a.y === b.b.y)) continue;
        const s = bounds(b, m),
          x = Math.max(r.x, s.x),
          y = Math.max(r.y, s.y),
          width = Math.min(r.x + r.width, s.x + s.width) - x,
          height = Math.min(r.y + r.height, s.y + s.height) - y;
        if (width <= 0 || height <= 0) continue;
        const numbers = [a, b]
          .map((w) => doc.model.walls.indexOf(w) + 1)
          .sort((a, b) => a - b);
        conflicts.push({
          ...d,
          wallIds: [a.id, b.id].sort(),
          x,
          y,
          region: { x, y, width, height },
          focus: { x: x + width / 2, y: y + height / 2 },
          message: `Paredes colineares sobrepostas: paredes ${numbers[0]} e ${numbers[1]}. Região de ${display(width)} × ${display(height)} cm em x=${display(x)}, y=${display(y)} cm. Composição suspensa em ${d.wallIds.length} paredes conectadas. Ajuste os trechos destacados na Planta.`,
        });
      }
    }
    return conflicts.length
      ? conflicts.sort(
          (a, b) =>
            a.y - b.y ||
            a.x - b.x ||
            a.wallIds.join().localeCompare(b.wallIds.join()),
        )
      : [fallback];
  });
}
