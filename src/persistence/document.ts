import {
  validRoomBoundary,
  validRoomPoint,
  roomGeometry,
} from "../domain/rooms";
import { validateTerrain, MAX_TERRAIN_POINTS } from "../domain/terrain";
import { validateReference } from "../domain/reference-image";
import { validMeasurement } from "../domain/measurements";
import {
  validateElement,
  validateCustomAsset,
  MAX_IMAGE_ELEMENTS,
  MAX_CUSTOM_ASSETS,
} from "../domain/image-elements";
import { z } from "zod";
import { textSchema } from "../domain/text";
import { validateSlab } from "../domain/slabs";
import {
  LIMIT,
  bounds,
  validateBase,
  withoutResult,
  slabTypes,
  type Project,
} from "../domain/project";
import { MAX_GROUT_ADJUSTMENTS } from "../domain/grout";
import { generate } from "../domain/composition";
import { validateClampSettings } from "../domain/clamps";
import { validateChannelReinforcement } from "../domain/channel-reinforcement";
import { MAX_OPENINGS, openingBox } from "../domain/openings";
import { validAppearance } from "../domain/opening-appearance";
import {
  MAX_CHANNEL_LEVELS,
  MAX_CHANNEL_SUPPRESSIONS,
} from "../domain/channels";
const integer = z.number().int().min(-LIMIT).max(LIMIT);
const positive = integer.refine((n) => n > 0);
const cents = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const point = z.object({ x: integer, y: integer }).strict();
const id = z.string().uuid();
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
    reinforcement: z
      .array(
        z
          .object({
            id: z.string(),
            course: positive,
            top: integer,
            a: point,
            b: point,
            count: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
            diameter: positive,
            wallIds: z.array(id),
            origins: z.array(z.string()),
          })
          .strict(),
      )
      .optional(),
    clamps: z
      .array(
        z
          .object({
            id: z.string(),
            course: positive,
            top: integer,
            a: point,
            b: point,
            diameter: positive,
            length: positive,
            leg: positive,
            origins: z.array(z.string()),
            wallIds: z.array(id),
            pending: z.string().optional(),
          })
          .strict(),
      )
      .optional(),
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
    convention: z.enum([
      "nominal-v9",
      "nominal-v10",
      "nominal-v11",
      "nominal-v12",
      "nominal-v13",
    ]),
    floors: z.array(composition).min(1).max(4),
    diagnostics: z.array(diagnostic),
  })
  .strict();
const schema = z
  .object({
    format: z.literal("ecovit"),
    schemaVersion: z.literal(31),
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
        brickLossPercent: cents.optional(),
        steelPrices: z
          .object({
            "ca60-5": cents.optional(),
            "ca50-6.3": cents.optional(),
            "ca50-8": cents.optional(),
            "ca50-10": cents.optional(),
            "ca50-12.5": cents.optional(),
          })
          .strict()
          .optional(),
        unitPrices: z
          .object({
            whole: z
              .number()
              .int()
              .min(0)
              .max(Number.MAX_SAFE_INTEGER)
              .optional(),
            half: z
              .number()
              .int()
              .min(0)
              .max(Number.MAX_SAFE_INTEGER)
              .optional(),
            channel: z
              .number()
              .int()
              .min(0)
              .max(Number.MAX_SAFE_INTEGER)
              .optional(),
            "half-channel": z
              .number()
              .int()
              .min(0)
              .max(Number.MAX_SAFE_INTEGER)
              .optional(),
          })
          .strict()
          .optional(),
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
        terrain: z
          .object({
            id,
            contour: z.array(point).min(3).max(MAX_TERRAIN_POINTS),
            material: z.enum([
              "grass",
              "earth",
              "sand",
              "gravel",
              "pavers",
              "soft",
            ]),
            revision: z.literal(1),
            textureOrigin: point,
            compass: z
              .object({
                visible: z.boolean(),
                center: point,
                size: positive,
                angle: z.number().finite().min(0).lt(360),
              })
              .strict()
              .optional(),
          })
          .strict()
          .nullable(),
        floors: z
          .array(
            z
              .object({
                id,
                name: z.string().trim().min(1).max(100),
                level: integer,
                defaultHeight: positive,
                groutMode: z.enum(["simple", "reinforced"]).optional(),
                steelBudget: z
                  .object({
                    usefulLength: positive,
                    overlapLength: integer.refine((n) => n >= 0),
                    horizontalExtra: cents,
                  })
                  .strict()
                  .optional(),
                groutDiameter: z
                  .union([z.literal(80), z.literal(100), z.literal(125)])
                  .optional(),
                channelReinforcement: z
                  .object({
                    enabled: z.boolean(),
                    count: z
                      .number()
                      .int()
                      .positive()
                      .max(Number.MAX_SAFE_INTEGER),
                    diameter: positive,
                  })
                  .strict()
                  .optional(),
                clamps: z
                  .object({
                    enabled: z.boolean(),
                    diameter: positive,
                    length: positive,
                    schedule: z.discriminatedUnion("mode", [
                      z
                        .object({
                          mode: z.literal("list"),
                          courses: z.array(positive),
                        })
                        .strict(),
                      z
                        .object({
                          mode: z.literal("interval"),
                          first: positive,
                          every: positive,
                          last: positive,
                        })
                        .strict(),
                    ]),
                  })
                  .strict()
                  .optional(),
                roomSequence: z
                  .number()
                  .int()
                  .min(0)
                  .max(Number.MAX_SAFE_INTEGER)
                  .optional(),
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
                appearance: z
                  .object({
                    type: z.enum([
                      "swing",
                      "double-swing",
                      "sliding",
                      "double-sliding",
                      "center-sliding",
                      "quad-sliding",
                      "tilt",
                    ]),
                    orientation: z.union([
                      z.literal(0),
                      z.literal(1),
                      z.literal(2),
                      z.literal(3),
                    ]),
                  })
                  .strict()
                  .optional(),
                offset: integer,
                width: positive,
                base: integer,
                height: positive,
              })
              .strict(),
          )
          .max(MAX_OPENINGS),
        imageElements: z
          .array(
            z
              .object({
                id,
                floorId: id,
                name: z.string().trim().min(1).max(200),
                source: z.discriminatedUnion("kind", [
                  z
                    .object({
                      kind: z.literal("catalog"),
                      itemId: z.string().min(1).max(100),
                      revision: z.number().int().positive(),
                    })
                    .strict(),
                  z.object({ kind: z.literal("custom"), assetId: id }).strict(),
                ]),
                x: z.number().finite(),
                y: z.number().finite(),
                width: z.number().finite().positive(),
                depth: z.number().finite().positive(),
                angle: z.number().finite(),
                flipX: z.boolean().optional(),
                flipY: z.boolean().optional(),
              })
              .strict(),
          )
          .max(MAX_IMAGE_ELEMENTS),
        customImageAssets: z
          .array(
            z
              .object({
                id,
                name: z.string().min(1).max(200),
                mime: z.enum(["image/png", "image/jpeg"]),
                data: z.string(),
                width: positive,
                height: positive,
              })
              .strict(),
          )
          .max(MAX_CUSTOM_ASSETS),
        referenceImages: z
          .array(
            z
              .object({
                floorId: id,
                name: z.string().min(1).max(200),
                mime: z.enum(["image/png", "image/jpeg"]),
                data: z.string(),
                width: positive,
                height: positive,
                x: z.number().finite(),
                y: z.number().finite(),
                scale: z.number().finite().positive(),
                angle: z.number().finite(),
                opacity: z.number().min(0).max(1),
                visible: z.boolean(),
              })
              .strict(),
          )
          .max(4),
        texts: z.array(textSchema),
        roomLabels: z.array(
          z
            .object({
              id,
              floorId: id,
              name: z.string().trim().min(1).max(100),
              position: point,
              reference: point,
              review: z.boolean(),
            })
            .strict(),
        ),
        roomBoundaries: z.array(
          z.object({ id, floorId: id, a: point, b: point }).strict(),
        ),
        measurements: z.array(
          z
            .object({
              id,
              floorId: id,
              a: point,
              b: point,
              offset: z.number().int().min(-LIMIT).max(LIMIT).optional(),
            })
            .strict(),
        ),
        slabs: z
          .array(
            z
              .object({
                id,
                floorId: id,
                thickness: positive,
                construction: z
                  .object({
                    type: z.enum(slabTypes),
                    height: z.union([
                      z.literal(800),
                      z.literal(1200),
                      z.literal(1600),
                      z.literal(2000),
                      z.literal(2500),
                      z.literal(3000),
                    ]),
                    topping: positive.optional(),
                  })
                  .strict()
                  .optional(),
                contour: z.array(point).min(4),
                openings: z.array(
                  z.object({ id, contour: z.array(point).min(4) }).strict(),
                ),
              })
              .strict(),
          )
          .max(4),
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
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    typeof value.schemaVersion === "number" &&
    value.schemaVersion >= 9 &&
    value.schemaVersion <= 29 &&
    "model" in value &&
    value.model &&
    typeof value.model === "object" &&
    "openings" in value.model &&
    Array.isArray(value.model.openings) &&
    value.model.openings.some(
      (opening: unknown) =>
        opening &&
        typeof opening === "object" &&
        "appearance" in opening &&
        opening.appearance &&
        typeof opening.appearance === "object" &&
        "type" in opening.appearance &&
        opening.appearance.type === "double-sliding",
    )
  )
    throw new Error(
      "Arquivo inválido: porta de correr de duas folhas em formato anterior.",
    );
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    typeof value.schemaVersion === "number" &&
    value.schemaVersion >= 9 &&
    value.schemaVersion <= 28 &&
    "model" in value &&
    value.model &&
    typeof value.model === "object" &&
    "openings" in value.model &&
    Array.isArray(value.model.openings) &&
    value.model.openings.some(
      (opening: unknown) =>
        opening &&
        typeof opening === "object" &&
        "appearance" in opening &&
        opening.appearance &&
        typeof opening.appearance === "object" &&
        "type" in opening.appearance &&
        opening.appearance.type === "quad-sliding",
    )
  )
    throw new Error(
      "Arquivo inválido: porta de correr de quatro folhas em formato anterior.",
    );
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    typeof value.schemaVersion === "number" &&
    value.schemaVersion >= 9 &&
    value.schemaVersion <= 27 &&
    "project" in value &&
    value.project &&
    typeof value.project === "object" &&
    "brickLossPercent" in value.project
  )
    throw new Error("Arquivo inválido: perdas de tijolos em formato anterior.");
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    typeof value.schemaVersion === "number" &&
    value.schemaVersion >= 9 &&
    value.schemaVersion <= 26 &&
    "model" in value &&
    value.model &&
    typeof value.model === "object" &&
    "slabs" in value.model &&
    Array.isArray(value.model.slabs) &&
    value.model.slabs.some(
      (slab: unknown) =>
        slab && typeof slab === "object" && "construction" in slab,
    )
  )
    throw new Error(
      "Arquivo inválido: configuração da laje em formato anterior.",
    );
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    typeof value.schemaVersion === "number" &&
    value.schemaVersion <= 25
  ) {
    const legacy = value as {
      project?: object;
      model?: { floors?: unknown[] };
    };
    if (
      (legacy.project &&
        typeof legacy.project === "object" &&
        "steelPrices" in legacy.project) ||
      (Array.isArray(legacy.model?.floors) &&
        legacy.model.floors.some(
          (f) => f && typeof f === "object" && "steelBudget" in f,
        ))
    )
      throw new Error(
        "Arquivo inválido: orçamento de ferragens em formato anterior.",
      );
  }
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    typeof value.schemaVersion === "number" &&
    value.schemaVersion <= 24 &&
    "model" in value &&
    value.model &&
    typeof value.model === "object" &&
    "floors" in value.model &&
    Array.isArray(value.model.floors) &&
    value.model.floors.some(
      (f: unknown) => f && typeof f === "object" && "groutDiameter" in f,
    )
  )
    throw new Error(
      "Arquivo inválido: diâmetro do graute em formato anterior.",
    );
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    typeof value.schemaVersion === "number" &&
    value.schemaVersion <= 23 &&
    "model" in value &&
    value.model &&
    typeof value.model === "object" &&
    "floors" in value.model &&
    Array.isArray(value.model.floors) &&
    value.model.floors.some(
      (f: unknown) => f && typeof f === "object" && "channelReinforcement" in f,
    )
  )
    throw new Error(
      "Arquivo inválido: armadura das canaletas em formato anterior.",
    );
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    typeof value.schemaVersion === "number" &&
    value.schemaVersion <= 22 &&
    "model" in value &&
    value.model &&
    typeof value.model === "object" &&
    "floors" in value.model &&
    Array.isArray(value.model.floors) &&
    value.model.floors.some(
      (f: unknown) => f && typeof f === "object" && "clamps" in f,
    )
  )
    throw new Error("Arquivo inválido: grampos em formato anterior.");
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    typeof value.schemaVersion === "number" &&
    value.schemaVersion <= 21 &&
    "project" in value &&
    value.project &&
    typeof value.project === "object" &&
    "unitPrices" in value.project
  )
    throw new Error("Arquivo inválido: preços em formato anterior.");
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    typeof value.schemaVersion === "number" &&
    value.schemaVersion <= 20 &&
    "model" in value &&
    value.model &&
    typeof value.model === "object" &&
    "floors" in value.model &&
    Array.isArray(value.model.floors) &&
    value.model.floors.some(
      (f: unknown) => f && typeof f === "object" && "groutMode" in f,
    )
  )
    throw new Error(
      "Arquivo inválido: graute por pavimento em formato anterior.",
    );
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    typeof value.schemaVersion === "number" &&
    value.schemaVersion <= 19 &&
    "project" in value &&
    value.project &&
    typeof value.project === "object" &&
    "groutSettings" in value.project &&
    value.project.groutSettings &&
    typeof value.project.groutSettings === "object" &&
    "junctionMode" in value.project.groutSettings
  )
    throw new Error(
      "Arquivo inválido: modalidade de graute em formato anterior.",
    );
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    (value.schemaVersion === 9 ||
      value.schemaVersion === 10 ||
      value.schemaVersion === 11 ||
      value.schemaVersion === 12 ||
      value.schemaVersion === 13 ||
      value.schemaVersion === 14 ||
      value.schemaVersion === 15 ||
      value.schemaVersion === 16) &&
    "model" in value &&
    value.model &&
    typeof value.model === "object"
  ) {
    if (
      "terrain" in value.model ||
      (value.schemaVersion < 11 && "referenceImages" in value.model) ||
      (value.schemaVersion < 13 &&
        ("imageElements" in value.model ||
          "customImageAssets" in value.model)) ||
      (value.schemaVersion === 9 && "measurements" in value.model)
    )
      throw new Error("Arquivo inválido: campos em formato anterior.");
    if (
      value.schemaVersion < 16 &&
      "measurements" in value.model &&
      Array.isArray(value.model.measurements) &&
      value.model.measurements.some(
        (m: unknown) => m && typeof m === "object" && "offset" in m,
      )
    )
      throw new Error(
        "Arquivo inválido: afastamento de medida em formato anterior.",
      );
    if (
      value.schemaVersion < 15 &&
      "imageElements" in value.model &&
      Array.isArray(value.model.imageElements) &&
      value.model.imageElements.some(
        (element: unknown) =>
          element &&
          typeof element === "object" &&
          ("flipX" in element || "flipY" in element),
      )
    )
      throw new Error("Arquivo inválido: espelhamento em formato anterior.");
    if (
      value.schemaVersion < 12 &&
      "openings" in value.model &&
      Array.isArray(value.model.openings) &&
      value.model.openings.some(
        (o: unknown) => o && typeof o === "object" && "appearance" in o,
      )
    )
      throw new Error("Arquivo inválido: aparência em formato anterior.");
    value = {
      ...value,
      schemaVersion: 17,
      model: {
        ...value.model,
        terrain: null,
        ...(value.schemaVersion === 9 ? { measurements: [] } : {}),
        ...(value.schemaVersion < 11 ? { referenceImages: [] } : {}),
        ...(value.schemaVersion < 13
          ? { imageElements: [], customImageAssets: [] }
          : {}),
      },
    };
  }
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    value.schemaVersion === 17
  ) {
    if (
      "model" in value &&
      value.model &&
      typeof value.model === "object" &&
      "terrain" in value.model &&
      value.model.terrain &&
      typeof value.model.terrain === "object" &&
      "compass" in value.model.terrain
    )
      throw new Error("Arquivo inválido: rosa dos ventos em formato anterior.");
    value = { ...value, schemaVersion: 18 };
  }
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    value.schemaVersion === 18 &&
    "model" in value &&
    value.model &&
    typeof value.model === "object"
  ) {
    if (
      "roomLabels" in value.model ||
      "roomBoundaries" in value.model ||
      ("floors" in value.model &&
        Array.isArray(value.model.floors) &&
        value.model.floors.some(
          (f: unknown) => f && typeof f === "object" && "roomSequence" in f,
        ))
    )
      throw new Error("Arquivo inválido: ambientes em formato anterior.");
    value = {
      ...value,
      schemaVersion: 19,
      model: { ...value.model, roomLabels: [], roomBoundaries: [] },
    };
  }
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    value.schemaVersion === 19
  )
    value = { ...value, schemaVersion: 20 };
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    value.schemaVersion === 20 &&
    "project" in value &&
    value.project &&
    typeof value.project === "object" &&
    "groutSettings" in value.project &&
    value.project.groutSettings &&
    typeof value.project.groutSettings === "object" &&
    "model" in value &&
    value.model &&
    typeof value.model === "object" &&
    "floors" in value.model &&
    Array.isArray(value.model.floors)
  ) {
    const { junctionMode, ...groutSettings } = value.project
      .groutSettings as Record<string, unknown>;
    if (
      junctionMode !== undefined &&
      junctionMode !== "simple" &&
      junctionMode !== "reinforced"
    )
      throw new Error("Arquivo inválido: modalidade de graute não suportada.");
    value = {
      ...value,
      schemaVersion: 21,
      project: { ...value.project, groutSettings },
      model: {
        ...value.model,
        floors: value.model.floors.map((f: unknown) =>
          f && typeof f === "object"
            ? {
                ...f,
                ...(junctionMode !== undefined
                  ? { groutMode: junctionMode }
                  : {}),
              }
            : f,
        ),
      },
    };
  }
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    value.schemaVersion === 21
  )
    value = { ...value, schemaVersion: 22 };
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    value.schemaVersion === 22
  )
    value = { ...value, schemaVersion: 23 };
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    value.schemaVersion === 23
  )
    value = { ...value, schemaVersion: 24 };
  if (
    !value ||
    typeof value !== "object" ||
    !("schemaVersion" in value) ||
    (value.schemaVersion !== 24 &&
      value.schemaVersion !== 25 &&
      value.schemaVersion !== 26 &&
      value.schemaVersion !== 27 &&
      value.schemaVersion !== 28 &&
      value.schemaVersion !== 29 &&
      value.schemaVersion !== 30 &&
      value.schemaVersion !== 31)
  )
    throw new Error(
      "Formato incompatível. Use um projeto de versão 9 a 31; demais formatos não são convertidos.",
    );
  if (
    value.schemaVersion === 24 ||
    value.schemaVersion === 25 ||
    value.schemaVersion === 26 ||
    value.schemaVersion === 27 ||
    value.schemaVersion === 28 ||
    value.schemaVersion === 29
  )
    value = { ...value, schemaVersion: 30 };
  if (
    value &&
    typeof value === "object" &&
    "schemaVersion" in value &&
    value.schemaVersion === 30 &&
    "model" in value &&
    value.model &&
    typeof value.model === "object"
  ) {
    if (
      "texts" in value.model &&
      (!Array.isArray(value.model.texts) || value.model.texts.length)
    )
      throw new Error("Arquivo inválido: textos em formato anterior.");
    value = {
      ...value,
      schemaVersion: 31,
      model: { ...value.model, texts: [] },
    };
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success)
    throw new Error("Arquivo inválido: estrutura ou conteúdo não suportados.");
  // Old results are disposable; never weaken validation of the drawing or of current snapshots.
  const doc = (
    parsed.data.generated && parsed.data.generated.convention !== "nominal-v13"
      ? {
          ...parsed.data,
          generated: null,
          generationState: { status: "outdated", diagnostics: [] },
        }
      : parsed.data
  ) as Project;
  if (doc.model.openings.some((o) => !validAppearance(o)))
    throw new Error("Tipo ou orientação da esquadria inválidos.");
  const imageFloors = new Set<string>();
  for (const image of doc.model.referenceImages) {
    if (
      !doc.model.floors.some((f) => f.id === image.floorId) ||
      imageFloors.has(image.floorId)
    )
      throw new Error("Imagem duplicada ou pavimento inexistente.");
    imageFloors.add(image.floorId);
    validateReference(image);
  }
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
  if (doc.model.terrain) {
    take(doc.model.terrain.id);
    validateTerrain(doc.model.terrain);
  }
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
    if (f.clamps) validateClampSettings(f.clamps, m, h);
    if (f.channelReinforcement)
      validateChannelReinforcement(f.channelReinforcement);
  }
  const walls = new Map(doc.model.walls.map((w) => [w.id, w]));
  for (const text of doc.model.texts) {
    take(text.id);
    if (!floors.has(text.floorId))
      throw new Error("Texto com pavimento inválido.");
  }
  for (const asset of doc.model.customImageAssets) {
    take(asset.id);
    validateCustomAsset(asset);
  }
  for (const element of doc.model.imageElements) {
    take(element.id);
    if (!floors.has(element.floorId))
      throw new Error("Imagem com pavimento inválido.");
    validateElement(element, doc.model.customImageAssets);
  }
  for (const measurement of doc.model.measurements) {
    take(measurement.id);
    if (!floors.has(measurement.floorId) || !validMeasurement(measurement))
      throw new Error("Medida com geometria ou pavimento inválido.");
  }
  for (const boundary of doc.model.roomBoundaries) {
    take(boundary.id);
    if (!floors.has(boundary.floorId) || !validRoomBoundary(boundary))
      throw new Error("Fechamento com geometria ou pavimento inválido.");
  }
  for (const label of doc.model.roomLabels) {
    take(label.id);
    if (
      !floors.has(label.floorId) ||
      !validRoomPoint(label.position) ||
      !validRoomPoint(label.reference)
    )
      throw new Error("Etiqueta com referência ou pavimento inválido.");
  }
  const slabFloors = new Set<string>();
  let lastSlabFloor = -1;
  for (const slab of doc.model.slabs) {
    take(slab.id);
    const floor = floors.get(slab.floorId);
    const index = doc.model.floors.findIndex((f) => f.id === slab.floorId);
    if (!floor || slabFloors.has(slab.floorId) || index <= lastSlabFloor)
      throw new Error("Laje com pavimento ausente, repetido ou fora de ordem.");
    slabFloors.add(slab.floorId);
    lastSlabFloor = index;
    slab.openings.forEach((o) => take(o.id));
    validateSlab(slab, m, floor.level);
  }
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
  for (const floor of doc.model.floors) {
    const labels = doc.model.roomLabels.filter(
      (l) => l.floorId === floor.id && !l.review,
    );
    if (!labels.length) continue;
    const geometry = roomGeometry(doc, floor.id),
      used = new Set<object>();
    for (const label of labels) {
      const region = geometry.at(label.reference);
      if (!region || used.has(region))
        throw new Error("Etiqueta válida sem região fechada exclusiva.");
      used.add(region);
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
export function importedCopy(doc: Project): Project {
  const now = new Date().toISOString();
  return {
    ...doc,
    model: {
      ...doc.model,
      texts: doc.model.texts.map((t) => ({ ...t })),
      slabs: doc.model.slabs.map((slab) => ({
        ...slab,
        ...(slab.construction
          ? { construction: { ...slab.construction } }
          : {}),
      })),
    },
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
