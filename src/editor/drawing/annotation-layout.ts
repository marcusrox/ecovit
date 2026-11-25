import { wrapText, type TextAnnotation } from "../../domain/text";
let context: CanvasRenderingContext2D | null = null;
let layouts = new WeakMap<
  TextAnnotation,
  { lines: string[]; height: number }
>();
export function annotationLayout(t: TextAnnotation) {
  const known = layouts.get(t);
  if (known) return known;
  context ??= document.createElement("canvas").getContext("2d");
  if (!context) throw new Error("Não foi possível medir o texto.");
  context.font = `${t.bold ? 600 : 400} 100px "IBM Plex Sans"`;
  const ctx = context;
  const lines = wrapText(
    t.content,
    Math.max(t.size * 2, t.width),
    (value) => (ctx.measureText(value).width * t.size) / 100,
  );
  const result = { lines, height: lines.length * t.size * 1.25 };
  layouts.set(t, result);
  return result;
}

export function resetAnnotationLayouts() {
  layouts = new WeakMap();
}
