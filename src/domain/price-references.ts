import { z } from "zod";
import { display, type Project } from "./project";
import { pieceKinds, pieceLabels } from "./quantities";
import { steelCatalog, steelLabel } from "./steel-budget";
import { settlementCatalog } from "./settlement-budget";
import {
  openingPriceSchema,
  openingOption,
  openingOptionKey,
  openingOptionLabel,
  openingMaterialLabel,
  withOpeningPrice,
} from "./opening-budget";

const { price: ignoredPrice, ...optionShape } = openingPriceSchema.shape;
void ignoredPrice;
export const priceItemSchema = z.discriminatedUnion("group", [
  z.object({ group: z.literal("bricks"), key: z.enum(pieceKinds) }).strict(),
  z
    .object({
      group: z.literal("steel"),
      key: z.enum(steelCatalog.map((s) => s.key)),
    })
    .strict(),
  z
    .object({
      group: z.literal("settlement"),
      key: z.enum(settlementCatalog.map((s) => s.key)),
    })
    .strict(),
  z
    .object({
      group: z.literal("openings"),
      option: z
        .object(optionShape)
        .strict()
        .refine(
          (o) => openingPriceSchema.safeParse({ ...o, price: 0 }).success,
        ),
    })
    .strict(),
]);
export type PriceItem = z.infer<typeof priceItemSchema>;
export const referenceCents = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);
export const priceSourcesSchema = z
  .array(
    z
      .object({
        item: priceItemSchema,
        source: z.enum(["own", "reference", "cleared"]),
      })
      .strict(),
  )
  .refine(
    (rows) =>
      new Set(rows.map((r) => priceItemKey(r.item))).size === rows.length,
    "Origem de preço duplicada.",
  );
export type PriceSources = z.infer<typeof priceSourcesSchema>;
export type PriceReference = { item: PriceItem; price: number | null };
export const priceItemKey = (item: PriceItem) =>
  item.group === "openings"
    ? `openings:${openingOptionKey(item.option)}`
    : `${item.group}:${item.key}`;
export function priceItemLabel(item: PriceItem) {
  if (item.group === "bricks") return `${pieceLabels[item.key]} · un.`;
  if (item.group === "steel")
    return `${steelLabel(steelCatalog.find((s) => s.key === item.key)!)} · kg`;
  if (item.group === "settlement") {
    const s = settlementCatalog.find((s) => s.key === item.key)!;
    return `${s.label} · ${s.package}`;
  }
  return `${openingOptionLabel(item.option)} · ${display(item.option.width)} × ${display(item.option.height)} cm · ${openingMaterialLabel(item.option.material)}`;
}
export const fixedPriceItems: PriceItem[] = [
  ...pieceKinds.map((key) => ({ group: "bricks" as const, key })),
  ...steelCatalog.map((s) => ({ group: "steel" as const, key: s.key })),
  ...settlementCatalog.map((s) => ({
    group: "settlement" as const,
    key: s.key,
  })),
];
export function projectPriceItems(doc: {
  model: Pick<Project["model"], "openings">;
}): PriceItem[] {
  const openings = new Map<string, PriceItem>();
  for (const o of doc.model.openings) {
    const parsed = priceItemSchema.safeParse({
      group: "openings",
      option: openingOption(o),
    });
    if (parsed.success) openings.set(priceItemKey(parsed.data), parsed.data);
  }
  return [...fixedPriceItems, ...openings.values()];
}
export function projectPrice(doc: Pick<Project, "project">, item: PriceItem) {
  if (item.group === "bricks") return doc.project.unitPrices?.[item.key];
  if (item.group === "steel") return doc.project.steelPrices?.[item.key];
  if (item.group === "settlement")
    return doc.project.settlement?.[item.key]?.price;
  return doc.project.openingPrices?.find(
    (p) => openingOptionKey(p) === openingOptionKey(item.option),
  )?.price;
}
export function priceSource(doc: Pick<Project, "project">, item: PriceItem) {
  return (
    doc.project.priceSources?.find(
      (p) => priceItemKey(p.item) === priceItemKey(item),
    )?.source ?? (projectPrice(doc, item) === undefined ? undefined : "own")
  );
}
export function withProjectPrice(
  doc: Project,
  item: PriceItem,
  price: number | undefined,
  source: "own" | "reference" = "own",
): Project {
  if (price !== undefined) referenceCents.parse(price);
  const actualSource = price === undefined ? "cleared" : source;
  if (
    projectPrice(doc, item) === price &&
    priceSource(doc, item) === actualSource
  )
    return doc;
  let next = doc;
  if (item.group === "openings")
    next = withOpeningPrice(doc, item.option, price);
  else if (item.group === "settlement") {
    const entry = { ...doc.project.settlement?.[item.key] };
    if (price === undefined) delete entry.price;
    else entry.price = price;
    next = {
      ...doc,
      project: {
        ...doc.project,
        settlement: { ...doc.project.settlement, [item.key]: entry },
      },
    };
  } else {
    const field = item.group === "bricks" ? "unitPrices" : "steelPrices";
    const entries: Record<string, number> = { ...doc.project[field] };
    if (price === undefined) delete entries[item.key];
    else entries[item.key] = price;
    next = { ...doc, project: { ...doc.project, [field]: entries } };
  }
  const states = (doc.project.priceSources ?? []).filter(
    (p) => priceItemKey(p.item) !== priceItemKey(item),
  );
  states.push({ item, source: actualSource });
  return { ...next, project: { ...next.project, priceSources: states } };
}
export function incorporatePrices(doc: Project, references: PriceReference[]) {
  const eligible = new Set(
    projectPriceItems(doc)
      .filter((i) => priceSource(doc, i) === undefined)
      .map(priceItemKey),
  );
  return references.reduce(
    (current, r) =>
      r.price !== null && eligible.has(priceItemKey(r.item))
        ? withProjectPrice(current, r.item, r.price, "reference")
        : current,
    doc,
  );
}
export function validatePriceSources(doc: Project) {
  for (const entry of doc.project.priceSources ?? []) {
    const price = projectPrice(doc, entry.item);
    if ((entry.source === "cleared") !== (price === undefined))
      throw new Error("Origem de preço inconsistente com o valor do projeto.");
  }
}
