import { z } from "zod";
import type { Project, Slab, Point } from "./project";
import { validateSlab } from "./slabs";
import { parseGroutField, groutFieldText } from "./grout-budget";

export const concreteClasses = ["30", "40", "50"] as const;
export type ConcreteClass = (typeof concreteClasses)[number];
export const concreteFields = [
  "consumption",
  "loss",
  "class",
  "price",
] as const;
export type ConcreteField = (typeof concreteFields)[number];
export const concreteLabels: Record<ConcreteField, string> = {
  consumption: "Consumo de concreto (L/m²)",
  loss: "Perdas (%)",
  class: "Classe do concreto",
  price: "Preço (R$/m³)",
};
const safe = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const slabConcreteSchema = z
  .object({
    consumption: safe.min(1).optional(),
    loss: safe.optional(),
    class: z.enum(concreteClasses).optional(),
    price: safe.optional(),
    source: z.enum(["own", "reference", "cleared"]).optional(),
  })
  .strict()
  .refine(
    (v) =>
      (v.source === undefined ||
        (v.source === "cleared") === (v.price === undefined)) &&
      (v.source !== "reference" || v.class !== undefined),
    "Origem de preço de concreto inconsistente.",
  );
export type SlabConcreteSettings = z.infer<typeof slabConcreteSchema>;
export type ConcreteErrors = Record<
  string,
  Partial<Record<ConcreteField, string>>
>;
export const parseConcreteField = (
  key: Exclude<ConcreteField, "class">,
  text: string,
) =>
  parseGroutField(
    key === "consumption"
      ? "verticalConsumption"
      : key === "loss"
        ? "verticalLoss"
        : "price",
    text,
  );
export const concreteFieldText = (
  key: Exclude<ConcreteField, "class">,
  n?: number,
) =>
  groutFieldText(
    key === "consumption"
      ? "verticalConsumption"
      : key === "loss"
        ? "verticalLoss"
        : "price",
    n,
  );
export function withSlabConcrete(
  doc: Project,
  id: string,
  config: SlabConcreteSettings,
): Project {
  slabConcreteSchema.parse(config);
  const slab = doc.model.slabs.find((s) => s.id === id);
  if (!slab || JSON.stringify(slab.concrete ?? {}) === JSON.stringify(config))
    return doc;
  return {
    ...doc,
    model: {
      ...doc.model,
      slabs: doc.model.slabs.map((s) =>
        s.id === id ? { ...s, concrete: { ...config } } : s,
      ),
    },
  };
}
export function withConcretePrice(
  doc: Project,
  id: string,
  price: number | undefined,
  source: "own" | "reference" = "own",
) {
  const slab = doc.model.slabs.find((s) => s.id === id);
  if (!slab) return doc;
  const config = {
    ...slab.concrete,
    source: price === undefined ? ("cleared" as const) : source,
  };
  if (price === undefined) delete config.price;
  else config.price = price;
  return withSlabConcrete(doc, id, config);
}
export function withConcreteClass(
  doc: Project,
  id: string,
  selected: ConcreteClass | undefined,
  price?: number,
) {
  const slab = doc.model.slabs.find((s) => s.id === id);
  if (!slab || slab.concrete?.class === selected) return doc;
  const config = { ...slab.concrete };
  delete config.price;
  delete config.source;
  delete config.class;
  if (selected) config.class = selected;
  if (selected && price !== undefined) {
    config.price = price;
    config.source = "reference";
  }
  return withSlabConcrete(doc, id, config);
}
// Twice the polygon area in (0.1 mm)²; avoid floating point and early rounding.
export const slabAreaScale = 200_000_000n;
export const concreteVolumeScale = slabAreaScale * 1000n * 1000n * 10000n;
function area2(ring: Point[]) {
  const a = ring.reduce((n, p, i) => {
    const q = ring[(i + 1) % ring.length];
    return n + BigInt(p.x) * BigInt(q.y) - BigInt(q.x) * BigInt(p.y);
  }, 0n);
  return a < 0n ? -a : a;
}
export type ConcreteRow = {
  slab: Slab;
  name: string;
  level: number;
  area?: bigint;
  base?: bigint;
  estimated?: bigint;
  cost?: number;
  errors: Partial<Record<ConcreteField, string>>;
  error?: string;
};
const max = BigInt(Number.MAX_SAFE_INTEGER);
export function slabConcreteBudget(
  doc: Project,
  busy = false,
  invalid: ConcreteErrors = {},
) {
  const rows: ConcreteRow[] = doc.model.slabs.map((slab) => {
    const floor = doc.model.floors.find((f) => f.id === slab.floorId);
    const r: ConcreteRow = {
      slab,
      name: floor?.name ?? "Pavimento ausente",
      level: floor?.level ?? 0,
      errors: { ...invalid[slab.id] },
    };
    if (busy) {
      r.error = "Operação em andamento. Aguarde.";
      return r;
    }
    try {
      if (!floor) throw new Error("Pavimento ausente.");
      validateSlab(slab, doc.project.base.width, floor.level);
      const c = slabConcreteSchema.parse(slab.concrete ?? {});
      r.area =
        area2(slab.contour) -
        slab.openings.reduce((n, o) => n + area2(o.contour), 0n);
      if (r.area > max * slabAreaScale)
        throw new Error("Área fora da representação segura.");
      for (const key of concreteFields)
        if (c[key] === undefined && !r.errors[key])
          r.errors[key] = `Informe ${concreteLabels[key].toLowerCase()}.`;
      if (!r.errors.consumption) {
        r.base = r.area * BigInt(c.consumption!) * 10000n;
        if (r.base > max * concreteVolumeScale) {
          r.base = undefined;
          throw new Error("Volume base fora da representação segura.");
        }
        if (!r.errors.loss) {
          r.estimated =
            r.area * BigInt(c.consumption!) * (10000n + BigInt(c.loss!));
          if (r.estimated > max * concreteVolumeScale) {
            r.estimated = undefined;
            throw new Error("Volume estimado fora da representação segura.");
          }
          if (!r.errors.class && !r.errors.price) {
            const cents =
              (r.estimated * BigInt(c.price!) + concreteVolumeScale / 2n) /
              concreteVolumeScale;
            if (cents > max)
              throw new Error("Custo fora da representação segura.");
            r.cost = Number(cents);
          }
        }
      }
    } catch (e) {
      r.error = (e as Error).message;
    }
    return r;
  });
  const sumVolume = (subset: ConcreteRow[]) => {
    if (!subset.every((r) => r.estimated !== undefined)) return undefined;
    const n = subset.reduce((sum, r) => sum + r.estimated!, 0n);
    return n <= max * concreteVolumeScale ? n : undefined;
  };
  const cost = rows.every((r) => r.cost !== undefined)
    ? rows.reduce((n, r) => n + BigInt(r.cost!), 0n)
    : undefined;
  return {
    rows,
    total: sumVolume(rows),
    cost: cost !== undefined && cost <= max ? Number(cost) : undefined,
    groups: [...concreteClasses, undefined].map((key) => ({
      key,
      volume: sumVolume(rows.filter((r) => r.slab.concrete?.class === key)),
    })),
    error:
      cost !== undefined && cost > max
        ? "Subtotal de concreto fora da representação segura."
        : rows.every((r) => r.estimated !== undefined) &&
            sumVolume(rows) === undefined
          ? "Volume total fora da representação segura."
          : undefined,
  };
}
