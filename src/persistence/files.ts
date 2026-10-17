import { z } from "zod";
import {
  LIMIT,
  bounds,
  validateBase,
  withoutResult,
  type Project,
} from "../domain/project";
import { MAX_GROUT_ADJUSTMENTS } from "../domain/grout";
import { generate } from "../domain/composition";
import { MAX_OPENINGS, openingBox } from "../domain/openings";
import {
  MAX_CHANNEL_LEVELS,
  MAX_CHANNEL_SUPPRESSIONS,
} from "../domain/channels";
const integer = z.number().int().min(-LIMIT).max(LIMIT);
const positive = integer.refine((n) => n > 0);
const point = z.object({ x: integer, y: integer }).strict();
const id = z.string().uuid();
const empty = z.array(z.never()).max(0);
const diagnostic = z
  .object({
    floorId: id,
    code: z.string(),
    severity: z.enum(["error", "info"]),
    message: z.string(),
    wallIds: z.array(id),
    course: positive,
    x: integer,
    y: integer,
    openingIds: z.array(id).optional(),
    lastCourse: positive.optional(),
    category: z.enum(["input", "geometry", "limit"]).optional(),
    levelIds: z.array(id).optional(),
    adjustmentIds: z.array(id).optional(),
  })
  .strict();
const piece = z
  .object({
    id: z.string(),
    x: integer,
    y: integer,
    width: positive,
    height: positive,
    kind: z.enum(["whole", "half", "channel", "half-channel"]),
    origins: z.array(z.string()).optional(),
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
    floorId: id,
    courses: z.array(
      z
        .object({
          number: positive,
          bottom: integer,
          top: integer,
          pieces: z.array(piece),
        })
        .strict(),
    ),
    components: z.array(component),
    diagnostics: z.array(diagnostic),
    grouts: z.array(
      z
        .object({
          id: z.string(),
          x: integer,
          y: integer,
          wallIds: z.array(id),
          origins: z.array(z.string()),
          intervals: z.array(
            z
              .object({ bottom: integer, top: integer })
              .strict()
              .refine((i) => i.top > i.bottom),
          ),
        })
        .strict(),
    ),

    channels: z.array(
      z
        .object({
          id: z.string(),
          wallId: id,
          top: integer,
          course: positive,
          cells: z.array(
            z
              .object({
                x: integer,
                y: integer,
                origins: z.array(z.string()),
              })
              .strict(),
          ),
        })
        .strict(),
    ),
  })
  .strict();

export const MAX_FILE = 50 * 1024 * 1024;
const scope = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("wall") }).strict(),
  z
    .object({ kind: z.literal("range"), from: integer, to: integer })
    .strict()
    .refine((s) => s.to > s.from),
]);
const generated = z
  .object({
    convention: z.literal("nominal-v9"),
    floors: z.array(composition).min(1).max(4),
    diagnostics: z.array(diagnostic),
  })
  .strict();
const schema = z
  .object({
    format: z.literal("ecovit"),
    schemaVersion: z.literal(8),
    project: z
      .object({
        id,
        name: z.string().trim().min(1).max(100),
        units: z.literal("0.1mm"),
        base: z
          .object({ length: positive, width: positive, height: positive })
          .strict(),
        origin: point,
        initialWallHeight: positive.optional(),
        openingSettings: z.object({ base: integer, top: integer }).strict(),
        channelLevels: z
          .array(z.object({ id, top: integer }).strict())
          .max(MAX_CHANNEL_LEVELS),
        groutSettings: z
          .object({
            junctions: z.boolean(),
            openings: z.boolean(),
            ends: z.boolean(),
            intervals: z.boolean(),
            distance: positive,
          })
          .strict(),
      })
      .strict(),
    model: z
      .object({
        floors: z
          .array(
            z
              .object({
                id,
                name: z.string().trim().min(1).max(100),
                level: integer,
                defaultHeight: positive,
              })
              .strict(),
          )
          .min(1)
          .max(4),
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
        openings: z
          .array(
            z
              .object({
                id,
                wallId: id,
                kind: z.enum(["door", "window", "opening"]),
                offset: integer,
                width: positive,
                base: integer,
                height: positive,
              })
              .strict(),
          )
          .max(MAX_OPENINGS),
        slabs: empty,
      })
      .strict(),
    adjustments: z
      .object({
        junctions: z
          .array(
            z
              .object({
                id,
                floorId: id,
                anchor: point,
                binding: z.enum(["active", "pending"]),
                componentId: z.string(),
                signature: z.string(),
                wallIds: z.array(id).min(1).max(10000),
                phase: z.union([z.literal(0), z.literal(1)]),
              })
              .strict(),
          )
          .max(10000),
        channels: z
          .array(
            z
              .object({ id, floorId: id, wallId: id, top: integer, scope })
              .strict(),
          )
          .max(MAX_CHANNEL_SUPPRESSIONS),
        grout: z
          .array(
            z
              .object({
                id,
                floorId: id,
                x: integer,
                y: integer,
                wallIds: z.array(id).min(1).max(10000),
                action: z.enum(["include", "exclude"]),
              })
              .strict(),
          )
          .max(MAX_GROUT_ADJUSTMENTS),
      })
      .strict(),
    generated: generated.nullable(),
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
        appVersion: z.string(),
      })
      .strict(),
  })
  .strict();

function checked(values: number[]) {
  if (values.some((n) => !Number.isSafeInteger(n) || Math.abs(n) > LIMIT))
    throw new Error("Medidas ou cotas excedem o limite do editor.");
}
export function validateProject(
  value: unknown,
  checkGenerated = true,
): Project {
  if (
    !value ||
    typeof value !== "object" ||
    !("schemaVersion" in value) ||
    value.schemaVersion !== 8
  )
    throw new Error(
      "Formato incompatível. Crie um novo projeto; arquivos de marcos anteriores não são convertidos.",
    );
  const parsed = schema.safeParse(value);
  if (!parsed.success)
    throw new Error("Arquivo inválido: estrutura ou conteúdo não suportados.");
  const doc = parsed.data as Project;
  validateBase(doc.project.base);
  const m = doc.project.base.width,
    h = doc.project.base.height;
  if (
    doc.project.initialWallHeight !== undefined &&
    doc.project.initialWallHeight % h
  )
    throw new Error("A altura inicial das paredes deve ser modular.");
  const ids = new Set<string>();
  const take = (id: string) => {
    if (ids.has(id)) throw new Error("Identificadores duplicados.");
    ids.add(id);
  };
  take(doc.project.id);
  const floors = new Map(doc.model.floors.map((f) => [f.id, f]));
  for (let i = 0; i < doc.model.floors.length; i++) {
    const f = doc.model.floors[i];
    take(f.id);
    if (
      f.level % h ||
      f.defaultHeight % h ||
      (i > 0 && doc.model.floors[i - 1].level >= f.level)
    )
      throw new Error(
        "Pavimentos devem ter cotas modulares distintas e estar ordenados pela cota.",
      );
    checked([f.level + f.defaultHeight]);
  }
  const walls = new Map(doc.model.walls.map((w) => [w.id, w]));
  for (const w of doc.model.walls) {
    take(w.id);
    const f = floors.get(w.floorId);
    if (!f) throw new Error("Referência de pavimento inválida.");
    if (
      (w.a.x === w.b.x) === (w.a.y === w.b.y) ||
      [w.a.x, w.a.y, w.b.x, w.b.y].some((n) => n % m)
    )
      throw new Error("Parede fora da malha ou sem comprimento.");
    const b = bounds(w, m);
    checked([b.x, b.y, b.x + b.width, b.y + b.height, f.level + w.height]);
  }
  for (const o of doc.model.openings) {
    take(o.id);
    const w = walls.get(o.wallId);
    if (!w) throw new Error("Referência de parede do vão inválida.");
    const b = openingBox(o, w, m),
      Z = floors.get(w.floorId)!.level;
    checked([
      o.offset + o.width,
      o.base + o.height,
      Z + o.base,
      Z + o.base + o.height,
      b.x,
      b.y,
      b.x + b.width,
      b.y + b.height,
    ]);
  }
  if (doc.project.openingSettings.top <= doc.project.openingSettings.base)
    throw new Error("O topo padrão deve ser maior que a base padrão.");
  const tops = new Set<number>();
  for (const l of doc.project.channelLevels) {
    take(l.id);
    if (tops.has(l.top)) throw new Error("Níveis de canaleta duplicados.");
    tops.add(l.top);
    for (const f of floors.values()) checked([f.level + l.top]);
  }
  for (const a of [...doc.adjustments.junctions, ...doc.adjustments.grout]) {
    take(a.id);
    if (
      !floors.has(a.floorId) ||
      new Set(a.wallIds).size !== a.wallIds.length ||
      a.wallIds.some((id) => walls.get(id)?.floorId !== a.floorId)
    )
      throw new Error(
        "Ajuste com referência inválida ou entre pavimentos diferentes.",
      );
  }
  for (const a of doc.adjustments.channels) {
    take(a.id);
    if (walls.get(a.wallId)?.floorId !== a.floorId)
      throw new Error("Supressão com referência inválida.");
    if (a.scope?.kind === "range" && (a.scope.from % m || a.scope.to % m))
      throw new Error("Alcance de canaleta fora da malha.");
  }
  if (doc.generationState.status === "outdated") {
    if (doc.generated !== null || doc.generationState.diagnostics.length)
      throw new Error("Documento desatualizado deve ter resultado ausente.");
  } else {
    if (!doc.generated) throw new Error("Composição atual ausente.");
    if (checkGenerated) {
      const expected = generated.parse(generate(doc));
      if (
        JSON.stringify(doc.generated) !== JSON.stringify(expected) ||
        JSON.stringify(doc.generationState.diagnostics) !==
          JSON.stringify(expected.diagnostics)
      )
        throw new Error("Composição salva inconsistente com o modelo.");
    }
  }
  if (
    new TextEncoder().encode(JSON.stringify(withoutResult(doc))).byteLength >
    MAX_FILE
  )
    throw new Error(
      "A intenção do projeto excede o limite de arquivo de 50 MB.",
    );
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
export function serializeFile(doc: Project): {
  text: string;
  omittedResult: boolean;
} {
  const full = JSON.stringify(doc);
  if (new TextEncoder().encode(full).byteLength <= MAX_FILE)
    return { text: full, omittedResult: false };
  const text = JSON.stringify(withoutResult(doc));
  if (new TextEncoder().encode(text).byteLength > MAX_FILE)
    throw new Error(
      "A intenção do projeto excede o limite de arquivo de 50 MB.",
    );
  return { text, omittedResult: doc.generated !== null };
}
export function download(doc: Project) {
  const file = serializeFile(doc);
  const url = URL.createObjectURL(
    new Blob([file.text], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.project.name.replace(/[^\p{L}\p{N} _-]/gu, "_") || "projeto"}.ecovit`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return file.omittedResult;
}
