import { z } from "zod";
import { LIMIT, type EditableProject, type Point } from "./project";

export const normalizeText = (value: string) => value.replace(/\r\n?/g, "\n");
export const textSchema = z
  .object({
    id: z.string().uuid(),
    floorId: z.string().uuid(),
    content: z
      .string()
      .transform(normalizeText)
      .refine(
        (s) => !!s.trim() && s.length <= 2000,
        "Informe texto com até 2.000 caracteres.",
      ),
    x: z.number().int().min(-LIMIT).max(LIMIT),
    y: z.number().int().min(-LIMIT).max(LIMIT),
    size: z.number().int().min(100).max(10000),
    width: z.number().int().max(1000000),
    rotation: z.union([
      z.literal(0),
      z.literal(90),
      z.literal(180),
      z.literal(270),
    ]),
    bold: z.boolean(),
    color: z.string().regex(/^#[\da-fA-F]{6}$/),
    align: z.enum(["left", "center", "right"]),
    background: z.boolean(),
    border: z.boolean(),
  })
  .strict()
  .refine(
    (t) => t.width >= 2 * t.size,
    "A largura mínima é duas vezes o tamanho do texto.",
  );
export type TextAnnotation = z.infer<typeof textSchema>;
export type TextDraft = {
  annotation: TextAnnotation;
  width: string;
  size: string;
  fresh: boolean;
  placing: boolean;
  focus: boolean;
};
export const newText = (floorId: string, p: Point): TextAnnotation => ({
  id: crypto.randomUUID(),
  floorId,
  content: "",
  x: Math.round(p.x),
  y: Math.round(p.y),
  size: 1000,
  width: 20000,
  rotation: 0,
  bold: false,
  color: "#263d33",
  align: "left",
  background: false,
  border: false,
});
export function putText<T extends EditableProject>(
  doc: T,
  text: TextAnnotation | null,
  id = text?.id,
): T {
  const texts = text
    ? doc.model.texts.some((t) => t.id === text.id)
      ? doc.model.texts.map((t) => (t.id === text.id ? text : t))
      : [...doc.model.texts, text]
    : doc.model.texts.filter((t) => t.id !== id);
  return { ...doc, model: { ...doc.model, texts } };
}
export function textLocal(t: TextAnnotation, p: Point): Point {
  const a = (t.rotation * Math.PI) / 180,
    dx = p.x - t.x,
    dy = p.y - t.y;
  return {
    x: dx * Math.cos(a) + dy * Math.sin(a),
    y: -dx * Math.sin(a) + dy * Math.cos(a),
  };
}
export function textWorld(t: TextAnnotation, p: Point): Point {
  const a = (t.rotation * Math.PI) / 180;
  return {
    x: t.x + p.x * Math.cos(a) - p.y * Math.sin(a),
    y: t.y + p.x * Math.sin(a) + p.y * Math.cos(a),
  };
}
export function textBox(t: TextAnnotation, height: number) {
  const points = [
    { x: 0, y: 0 },
    { x: t.width, y: 0 },
    { x: t.width, y: height },
    { x: 0, y: height },
  ].map((p) => textWorld(t, p));
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}
// Layout takes a font metric supplied by presentation; no DOM or font dependency in the model.
export function wrapText(
  content: string,
  width: number,
  measure: (value: string) => number,
): string[] {
  const segmenter = new Intl.Segmenter("pt-BR", { granularity: "grapheme" });
  return normalizeText(content)
    .split("\n")
    .flatMap((paragraph) => {
      const lines: string[] = [];
      let line = "";
      for (const { segment } of segmenter.segment(paragraph)) {
        if (line && measure(line + segment) > width) {
          const space = line.lastIndexOf(" ");
          if (space > 0) {
            lines.push(line.slice(0, space + 1));
            line = line.slice(space + 1);
          } else {
            lines.push(line);
            line = "";
          }
          if (line && measure(line + segment) > width) {
            lines.push(line);
            line = "";
          }
        }
        line += segment;
      }
      lines.push(line);
      return lines;
    });
}
