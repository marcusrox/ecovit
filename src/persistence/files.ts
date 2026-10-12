import { z } from "zod";
import { LIMIT, bounds, validateBase, type Project } from "../domain/project";
import { generate } from "../domain/composition";
const integer = z.number().int().min(-LIMIT).max(LIMIT);
const positive = integer.refine((n) => n > 0);
const point = z.object({ x: integer, y: integer }).strict();
const id = z.string().uuid();
const empty = z.array(z.never()).max(0);
const diagnostic = z
  .object({
    code: z.string(),
    severity: z.enum(["error", "info"]),
    message: z.string(),
    wallIds: z.array(id),
    course: positive,
    x: integer,
    y: integer,
  })
  .strict();
const piece = z
  .object({
    id: z.string(),
    x: integer,
    y: integer,
    width: positive,
    height: positive,
    kind: z.enum(["whole", "half"]),
    wallIds: z.array(id),
  })
  .strict();
const component = z
  .object({
    id: z.string(),
    signature: z.string(),
    wallIds: z.array(id),
    x: integer,
    y: integer,
    junctions: z.array(
      z
        .object({ x: integer, y: integer, kind: z.enum(["L", "T", "cross"]) })
        .strict(),
    ),
    alternative: z.boolean(),
    phase: z.union([z.literal(0), z.literal(1)]),
  })
  .strict();
const composition = z
  .object({
    convention: z.enum(["nominal-v1", "nominal-v2", "nominal-v3"]),
    courses: z
      .array(
        z
          .object({
            number: positive,
            bottom: integer,
            top: integer,
            pieces: z.array(piece).max(100000),
          })
          .strict(),
      )
      .max(1000),
    components: z.array(component).max(20000),
    diagnostics: z.array(diagnostic),
  })
  .strict();
const schema = z
  .object({
    format: z.literal("ecovit"),
    schemaVersion: z.literal(2),
    project: z
      .object({
        id,
        name: z.string().trim().min(1).max(100),
        units: z.literal("0.1mm"),
        base: z
          .object({ length: positive, width: positive, height: positive })
          .strict(),
        origin: z.object({ x: z.literal(0), y: z.literal(0) }).strict(),
      })
      .strict(),
    model: z
      .object({
        floors: z
          .array(
            z
              .object({
                id,
                name: z.literal("Térreo"),
                level: integer,
                start: integer,
                defaultHeight: positive,
              })
              .strict(),
          )
          .length(1),
        walls: z
          .array(
            z
              .object({
                id,
                floorId: id,
                a: point,
                b: point,
                side: z.union([z.literal(1), z.literal(-1)]),
                height: positive,
              })
              .strict(),
          )
          .max(10000),
        openings: empty,
        slabs: empty,
      })
      .strict(),
    adjustments: z
      .object({
        junctions: z
          .array(
            z
              .object({
                componentId: z.string(),
                signature: z.string(),
                wallIds: z.array(id),
                phase: z.union([z.literal(0), z.literal(1)]),
              })
              .strict(),
          )
          .max(10000),
        grout: empty,
        channels: empty,
      })
      .strict(),
    generated: composition.nullable(),
    generationState: z
      .object({
        status: z.enum(["outdated", "current"]),
        diagnostics: z.array(diagnostic),
      })
      .strict(),
    metadata: z
      .object({
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime(),
        appVersion: z.string().max(30),
      })
      .strict(),
  })
  .strict();
export const MAX_FILE = 50 * 1024 * 1024;
export function validateProject(
  value: unknown,
  checkGenerated = true,
): Project {
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    value.schemaVersion === 1
  ) {
    const legacy = schema
      .extend({
        schemaVersion: z.literal(1),
        adjustments: z
          .object({ junctions: empty, grout: empty, channels: empty })
          .strict(),
        generated: z.null(),
        generationState: z
          .object({ status: z.literal("outdated"), diagnostics: empty })
          .strict(),
      })
      .safeParse(value);
    if (!legacy.success) throw new Error("Arquivo versão 1 inválido.");
    value = { ...legacy.data, schemaVersion: 2 };
  }
  const result = schema.safeParse(value);
  if (!result.success)
    throw new Error(
      "Arquivo inválido ou conteúdo/versão ainda não suportados pelo Ecovit.",
    );
  const doc = result.data as Project;
  validateBase(doc.project.base);
  const module = doc.project.base.width,
    ids = new Set<string>([doc.project.id, doc.model.floors[0].id]);
  for (const wall of doc.model.walls) {
    const box = bounds(wall, module),
      floor = doc.model.floors[0];
    if (
      [
        box.x,
        box.y,
        box.x + box.width,
        box.y + box.height,
        floor.start - floor.level,
        floor.start + wall.height - floor.level,
      ].some((n) => Math.abs(n) > LIMIT)
    )
      throw new Error("Medidas da parede ou cotas excedem o limite do editor.");
    if (ids.has(wall.id) || wall.floorId !== doc.model.floors[0].id)
      throw new Error(
        "Arquivo contém identificadores duplicados ou referências inválidas.",
      );
    ids.add(wall.id);
    if (
      (wall.a.x === wall.b.x) === (wall.a.y === wall.b.y) ||
      [wall.a.x, wall.a.y, wall.b.x, wall.b.y].some((n) => n % module !== 0)
    )
      throw new Error(
        "Arquivo contém parede fora da malha ou sem comprimento.",
      );
  }
  const choices = new Set<string>();
  for (const a of doc.adjustments.junctions) {
    if (
      choices.has(a.componentId) ||
      a.wallIds.some((id) => !doc.model.walls.some((w) => w.id === id))
    )
      throw new Error("Escolhas de encontros inválidas.");
    choices.add(a.componentId);
  }
  if (doc.generationState.status === "current") {
    if (!doc.generated) throw new Error("Composição atual ausente.");
    if (checkGenerated) {
      // Normalize both snapshots through the same schema before comparing JSON:
      // object property insertion order is not a change in project contents.
      const expected = composition.parse(
        generate(doc, doc.generated.convention),
      );
      if (
        JSON.stringify(doc.generated) !== JSON.stringify(expected) ||
        JSON.stringify(doc.generationState.diagnostics) !==
          JSON.stringify(expected.diagnostics)
      )
        throw new Error("Composição salva inconsistente com o modelo.");
      // Validate the old snapshot before requesting regeneration on open.
      // Never accept tampered legacy data merely because the engine evolved.
      if (doc.generated.convention !== "nominal-v3") {
        doc.generationState = { status: "outdated", diagnostics: [] };
      }
    }
  }
  return doc;
}
export function parseFile(text: string): Project {
  if (new TextEncoder().encode(text).byteLength > MAX_FILE)
    throw new Error("O arquivo excede o limite de 50 MB.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("O arquivo não contém um projeto JSON válido.");
  }
  return validateProject(value);
}
export async function readFile(file: File): Promise<Project> {
  if (file.size > MAX_FILE)
    throw new Error("O arquivo excede o limite de 50 MB.");
  return parseFile(await file.text());
}
export function importedCopy(doc: Project): Project {
  const now = new Date().toISOString();
  return {
    ...doc,
    project: {
      ...doc.project,
      id: crypto.randomUUID(),
      name: `${doc.project.name.slice(0, 90)} (cópia)`,
    },
    metadata: { ...doc.metadata, createdAt: now, updatedAt: now },
  };
}
export function download(doc: Project) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.project.name.replace(/[^\p{L}\p{N} _-]/gu, "_") || "projeto"}.ecovit`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
