import { z } from "zod";
import { LIMIT, type Opening, type Project } from "./project";
import { appearanceOptions, validAppearance } from "./opening-appearance";

export const openingMaterials = [
  { kind: "wood-hollow", label: "Madeira semioca" },
  { kind: "wood-solid", label: "Madeira maciça" },
  { kind: "wood-glass", label: "Madeira e vidro" },
  { kind: "aluminium", label: "Alumínio" },
  { kind: "aluminium-glass", label: "Alumínio e vidro" },
  { kind: "tempered-glass", label: "Vidro temperado" },
  { kind: "other", label: "Outro" },
] as const;
export const openingMaterialSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.enum([
        "wood-hollow",
        "wood-solid",
        "wood-glass",
        "aluminium",
        "aluminium-glass",
        "tempered-glass",
      ]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("other"),
      description: z
        .string()
        .refine(
          (s) =>
            !Array.from(s).some(
              (c) => c.charCodeAt(0) < 32 || c === "\u2028" || c === "\u2029",
            ),
          "Use uma descrição de uma linha.",
        )
        .trim()
        .min(1)
        .max(100),
    })
    .strict(),
]);
export type OpeningMaterial = z.infer<typeof openingMaterialSchema>;
export const openingPriceSchema = z
  .object({
    kind: z.enum(["door", "window"]),
    type: z.enum([
      "swing",
      "double-swing",
      "sliding",
      "double-sliding",
      "center-sliding",
      "quad-sliding",
      "tilt",
    ]),
    width: z.number().int().positive().max(LIMIT),
    height: z.number().int().positive().max(LIMIT),
    material: openingMaterialSchema,
    price: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  })
  .strict()
  .refine(
    (s) =>
      validAppearance({
        kind: s.kind,
        appearance: { type: s.type, orientation: 0 },
      }),
    "Tipo de esquadria incompatível.",
  );
export type OpeningPrice = z.infer<typeof openingPriceSchema>;
type Option = Pick<Opening, "kind" | "width" | "height" | "material"> & {
  type?: NonNullable<Opening["appearance"]>["type"];
};
export function openingOption(o: Opening): Option {
  return {
    kind: o.kind,
    type: o.appearance?.type,
    width: o.width,
    height: o.height,
    material: o.material,
  };
}
export function openingOptionKey(o: Option) {
  return JSON.stringify([
    o.kind,
    o.type ?? null,
    o.width,
    o.height,
    o.material?.kind ?? null,
    o.material?.kind === "other"
      ? o.material.description.trim().toLowerCase()
      : null,
  ]);
}
export const openingPricesSchema = z
  .array(openingPriceSchema)
  .refine(
    (prices) => new Set(prices.map(openingOptionKey)).size === prices.length,
    "Preços duplicados para a mesma opção de esquadria.",
  );
export function openingMaterialLabel(m?: OpeningMaterial) {
  return m?.kind === "other"
    ? m.description
    : (openingMaterials.find((s) => s.kind === m?.kind)?.label ??
        "Não definido");
}
export function openingOptionLabel(o: Option) {
  const type =
    appearanceOptions(o.kind).find((s) => s.type === o.type)?.label ??
    "Genérico (legado)";
  return `${o.kind === "door" ? "Porta" : "Janela"} · ${type}`;
}
export function withOpeningPrice(
  doc: Project,
  option: Option,
  price?: number,
): Project {
  if (!option.type || !option.material || option.kind === "opening")
    throw new Error("Defina tipo e material nas propriedades.");
  const key = openingOptionKey(option);
  const prices = (doc.project.openingPrices ?? []).filter(
    (p) => openingOptionKey(p) !== key,
  );
  if (price !== undefined)
    prices.push(openingPriceSchema.parse({ ...option, price }));
  const { openingPrices, ...project } = doc.project;
  void openingPrices;
  return {
    ...doc,
    project: {
      ...project,
      ...(prices.length ? { openingPrices: prices } : {}),
    },
  };
}
export type OpeningBudgetRow = {
  key: string;
  option: Option;
  count: number;
  price?: number;
  cost?: number;
  error?: string;
};
export type OpeningBudgetFloor = {
  id: string;
  name: string;
  level: number;
  rows: OpeningBudgetRow[];
  count: number;
  total?: number;
  error?: string;
};
export type OpeningBudgetReport = {
  rows: OpeningBudgetRow[];
  floors: OpeningBudgetFloor[];
  count: number;
  total?: number;
  error?: string;
};
const max = BigInt(Number.MAX_SAFE_INTEGER);
function subtotal(rows: OpeningBudgetRow[]) {
  if (rows.some((r) => r.cost === undefined)) return {};
  const sum = rows.reduce((n, r) => n + BigInt(r.cost!), 0n);
  return sum > max
    ? { error: "Subtotal de esquadrias fora da representação numérica segura." }
    : { total: Number(sum) };
}
export function openingBudget(
  doc: Project,
  errors: Record<string, string> = {},
): OpeningBudgetReport {
  const prices = new Map(
    (doc.project.openingPrices ?? []).map((p) => [
      openingOptionKey(p),
      p.price,
    ]),
  );
  const walls = new Map(doc.model.walls.map((w) => [w.id, w.floorId]));
  const floors: OpeningBudgetFloor[] = [...doc.model.floors]
    .sort((a, b) => a.level - b.level || a.id.localeCompare(b.id))
    .map((f) => ({
      id: f.id,
      name: f.name,
      level: f.level,
      rows: [],
      count: 0,
    }));
  const byFloor = new Map(
    floors.map((f) => [f.id, new Map<string, OpeningBudgetRow>()]),
  );
  const global = new Map<string, OpeningBudgetRow>();
  const seen = new Set<string>();
  for (const o of doc.model.openings) {
    if (o.kind === "opening") continue;
    if (seen.has(o.id)) throw new Error("Esquadria duplicada no documento.");
    seen.add(o.id);
    const floor = byFloor.get(walls.get(o.wallId) ?? "");
    if (!floor) throw new Error("Pavimento da esquadria indisponível.");
    const option = openingOption(o),
      key = openingOptionKey(option);
    for (const map of [global, floor]) {
      const row = map.get(key) ?? { key, option, count: 0 };
      row.count++;
      map.set(key, row);
    }
  }
  const finish = (map: Map<string, OpeningBudgetRow>) =>
    [...map.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((r) => {
        const missing = [
          !r.option.type && "tipo",
          !r.option.material && "material",
        ].filter(Boolean);
        r.price = prices.get(r.key);
        if (missing.length)
          r.error = `Defina ${missing.join(" e ")} nas propriedades.`;
        else if (errors[r.key]) r.error = errors[r.key];
        else if (r.price === undefined) r.error = "Informe o preço unitário.";
        else {
          const cost = BigInt(r.count) * BigInt(r.price);
          if (cost > max)
            r.error = "Custo fora da representação numérica segura.";
          else r.cost = Number(cost);
        }
        return r;
      });
  const rows = finish(global);
  for (const f of floors) {
    f.rows = finish(byFloor.get(f.id)!);
    f.count = f.rows.reduce((n, r) => n + r.count, 0);
    Object.assign(f, subtotal(f.rows));
  }
  return {
    rows,
    floors,
    count: rows.reduce((n, r) => n + r.count, 0),
    ...subtotal(rows),
  };
}
