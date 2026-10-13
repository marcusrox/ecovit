import { z } from "zod";
import {
  LIMIT,
  bounds,
  validateBase,
  defaultGroutSettings,
  type Project,
} from "../domain/project";
import {
  MAX_GROUT_ADJUSTMENTS,
  MAX_GROUT_AXES,
  MAX_GROUT_INTERVALS,
  groutId,
} from "../domain/grout";
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
    convention: z.enum([
      "nominal-v1",
      "nominal-v2",
      "nominal-v3",
      "nominal-v4",
      "nominal-v5",
      "nominal-v6",
    ]),
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
    grouts: z
      .array(
        z
          .object({
            id: z.string(),
            x: integer,
            y: integer,
            wallIds: z.array(id),
            origins: z.array(z.string()),
            intervals: z
              .array(
                z
                  .object({ bottom: integer, top: integer })
                  .strict()
                  .refine((i) => i.top > i.bottom),
              )
              .max(MAX_GROUT_INTERVALS),
          })
          .strict(),
      )
      .max(MAX_GROUT_AXES)
      .optional(),
    channels: z
      .array(
        z
          .object({
            id: z.string(),
            wallId: id,
            top: integer,
            course: positive,
            cells: z
              .array(
                z
                  .object({
                    x: integer,
                    y: integer,
                    origins: z.array(z.string()),
                  })
                  .strict(),
              )
              .max(20000),
          })
          .strict(),
      )
      .max(100000)
      .optional(),
  })
  .strict();
const schema = z
  .object({
    format: z.literal("ecovit"),
    schemaVersion: z.literal(5),
    project: z
      .object({
        id,
        name: z.string().trim().min(1).max(100),
        units: z.literal("0.1mm"),
        base: z
          .object({ length: positive, width: positive, height: positive })
          .strict(),
        origin: z.object({ x: z.literal(0), y: z.literal(0) }).strict(),
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
                componentId: z.string(),
                signature: z.string(),
                wallIds: z.array(id),
                phase: z.union([z.literal(0), z.literal(1)]),
              })
              .strict(),
          )
          .max(10000),
        grout: z
          .array(
            z
              .object({
                id,
                x: integer,
                y: integer,
                wallIds: z.array(id).min(1).max(10000),
                action: z.enum(["include", "exclude"]),
              })
              .strict(),
          )
          .max(MAX_GROUT_ADJUSTMENTS),
        channels: z
          .array(z.object({ id, wallId: id, top: integer }).strict())
          .max(MAX_CHANNEL_SUPPRESSIONS),
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
const m32Composition = composition
  .omit({ grouts: true })
  .extend({
    convention: z.enum([
      "nominal-v1",
      "nominal-v2",
      "nominal-v3",
      "nominal-v4",
      "nominal-v5",
    ]),
  });
const m32Schema = schema.extend({
  schemaVersion: z.literal(4),
  project: schema.shape.project.omit({ groutSettings: true }),
  adjustments: schema.shape.adjustments.extend({ grout: empty }),
  generated: m32Composition.nullable(),
});
const oldComposition = composition
  .omit({ channels: true, grouts: true })
  .extend({
    convention: z.enum([
      "nominal-v1",
      "nominal-v2",
      "nominal-v3",
      "nominal-v4",
    ]),
    courses: z
      .array(
        composition.shape.courses.element.extend({
          pieces: z
            .array(
              piece
                .omit({ origins: true })
                .extend({ kind: z.enum(["whole", "half"]) }),
            )
            .max(100000),
        }),
      )
      .max(1000),
  });
const m31Schema = schema.extend({
  schemaVersion: z.literal(3),
  project: schema.shape.project.omit({
    channelLevels: true,
    groutSettings: true,
  }),
  adjustments: schema.shape.adjustments.extend({
    channels: empty,
    grout: empty,
  }),
  generated: oldComposition.nullable(),
});
const legacySchema = schema.extend({
  schemaVersion: z.literal(2),
  project: schema.shape.project.omit({
    openingSettings: true,
    channelLevels: true,
    groutSettings: true,
  }),
  model: schema.shape.model.extend({ openings: empty }),
  adjustments: schema.shape.adjustments.extend({
    channels: empty,
    grout: empty,
  }),
  generated: oldComposition
    .extend({ convention: z.enum(["nominal-v1", "nominal-v2", "nominal-v3"]) })
    .nullable(),
});
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
    const legacy = legacySchema
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
  const isV2 =
    !!value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    value.schemaVersion === 2;
  const isV3 =
    !!value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    value.schemaVersion === 3;
  const isV4 =
    !!value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    value.schemaVersion === 4;
  const isLegacy = isV2 || isV3 || isV4;
  const result = (
    isV2 ? legacySchema : isV3 ? m31Schema : isV4 ? m32Schema : schema
  ).safeParse(value);
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
  for (const o of doc.model.openings) {
    if (ids.has(o.id) || !doc.model.walls.some((w) => w.id === o.wallId))
      throw new Error("Vão com ID duplicado ou referência de parede inválida.");
    ids.add(o.id);
    const box = openingBox(
      o,
      doc.model.walls.find((w) => w.id === o.wallId)!,
      module,
    );
    if (
      [
        o.offset + o.width,
        o.base + o.height,
        doc.model.floors[0].level + o.base + o.height,
        box.x,
        box.y,
        box.x + box.width,
        box.y + box.height,
      ].some((n) => !Number.isSafeInteger(n) || Math.abs(n) > LIMIT)
    )
      throw new Error("Medidas do vão excedem o limite do editor.");
  }
  if (
    !isV2 &&
    doc.project.openingSettings.top <= doc.project.openingSettings.base
  )
    throw new Error("O topo padrão deve ser maior que a base padrão.");
  if (!isV2 && !isV3) {
    const tops = new Set<number>();
    for (const l of doc.project.channelLevels) {
      if (ids.has(l.id) || tops.has(l.top))
        throw new Error("Níveis de canaleta duplicados.");
      ids.add(l.id);
      tops.add(l.top);
      if (Math.abs(doc.model.floors[0].level + l.top) > LIMIT)
        throw new Error("Cota de canaleta excede o limite.");
    }
    const targets = new Set<string>();
    for (const a of doc.adjustments.channels) {
      const target = `${a.wallId}:${a.top}`;
      if (
        ids.has(a.id) ||
        targets.has(target) ||
        !doc.model.walls.some((w) => w.id === a.wallId)
      )
        throw new Error(
          "Supressão de canaleta duplicada ou com referência inválida.",
        );
      ids.add(a.id);
      targets.add(target);
    }
  }
  if (!isLegacy) {
    const targets = new Set<string>();
    for (const a of doc.adjustments.grout) {
      const target = groutId(a);
      if (
        ids.has(a.id) ||
        targets.has(target) ||
        new Set(a.wallIds).size !== a.wallIds.length ||
        a.wallIds.some((id) => !doc.model.walls.some((w) => w.id === id))
      )
        throw new Error(
          "Ajuste de graute duplicado ou com referência inválida.",
        );
      ids.add(a.id);
      targets.add(target);
    }
  }
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
    if (
      (!isLegacy && doc.generated.convention !== "nominal-v6") ||
      (isV4 && doc.generated.convention !== "nominal-v5") ||
      (isV3 && doc.generated.convention !== "nominal-v4")
    )
      throw new Error(
        "Convenção de composição incompatível com a versão do arquivo.",
      );
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
      if (doc.generated.convention !== "nominal-v6") {
        doc.generationState = { status: "outdated", diagnostics: [] };
      }
    }
  }
  if (isLegacy) {
    doc.schemaVersion = 5;
    doc.project = {
      ...doc.project,
      openingSettings: doc.project.openingSettings ?? {
        base: 11200,
        top: 21700,
      },
      channelLevels: doc.project.channelLevels ?? [],
      groutSettings: defaultGroutSettings(false),
    };
    doc.generationState = { status: "outdated", diagnostics: [] };
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
