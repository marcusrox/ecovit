import { z } from "zod";
import type { Project } from "./project";
import { wallBudgetAreas } from "./wall-budget-area";
import { assignedAreaScale, parseSettlementField } from "./settlement-budget";

export const surfaceProducts = [
  { key: "waterproofing", label: "Impermeabilizante" },
  { key: "jointing", label: "Rejunte" },
] as const;
export type SurfaceKey = (typeof surfaceProducts)[number]["key"];
export type SurfaceField = "percent" | "yield" | "price";
export const referenceDescriptionSchema = z.string().trim().min(1).max(160);
const productSchema = z
  .object({
    percent: z.number().int().min(0).max(10000).optional(),
    yield: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
    price: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
    referenceDescription: referenceDescriptionSchema.optional(),
    productDescription: z.string().trim().max(160).optional(),
  })
  .strict();
export const surfaceSettingsSchema = z
  .object({
    waterproofing: productSchema.optional(),
    jointing: productSchema.optional(),
  })
  .strict();
export type SurfaceSettings = z.infer<typeof surfaceSettingsSchema>;
export type SurfaceErrors = Partial<
  Record<SurfaceKey, Partial<Record<SurfaceField, string>>>
>;
export type SurfaceRow = {
  key: SurfaceKey;
  area?: bigint; // m², denominator assignedAreaScale
  packages?: number;
  cost?: number;
  error?: string;
};
export function parseSurfaceField(field: SurfaceField, text: string) {
  if (field === "yield" && !text.trim()) return undefined;
  return parseSettlementField(field, text);
}
const max = BigInt(Number.MAX_SAFE_INTEGER);

export function surfaceBudget(
  doc: Project,
  busy = false,
  invalid: SurfaceErrors = {},
) {
  let area: ReturnType<typeof wallBudgetAreas>;
  try {
    area = wallBudgetAreas(doc, busy);
  } catch (e) {
    area = {
      available: false,
      reason: e instanceof Error ? e.message : "Área de paredes indisponível.",
    };
  }
  const floors = doc.model.floors
    .slice()
    .sort((a, b) => a.level - b.level || a.id.localeCompare(b.id))
    .map((f) => ({
      id: f.id,
      name: f.name,
      level: f.level,
      rows: [] as SurfaceRow[],
    }));
  const rows = surfaceProducts.map(({ key }) => {
    const config = doc.project.surface?.[key];
    const row: SurfaceRow = { key };
    const local = floors.map((f) => {
      const r: SurfaceRow = { key };
      f.rows.push(r);
      return r;
    });
    const fail = (message: string) => {
      row.error = message;
      return row;
    };
    if (invalid[key]?.percent) return fail(invalid[key]!.percent!);
    const percent = BigInt(config?.percent ?? 0);
    if (percent === 0n) {
      local.forEach((r) => Object.assign(r, { area: 0n, cost: 0 }));
      return { ...row, area: 0n, packages: 0, cost: 0 };
    }
    if (!area.available) return fail(area.reason);
    row.area = area.net * 2n * percent;
    area.floors.forEach((f, i) => {
      local[i].area = f.net * 2n * percent;
      if (f.net === 0n) local[i].cost = 0;
    });
    if (row.area === 0n) return { ...row, packages: 0, cost: 0 };
    if (row.area > max * assignedAreaScale)
      return fail("Área fora da representação numérica segura.");
    if (invalid[key]?.yield) return fail(invalid[key]!.yield!);
    if (config?.yield === undefined)
      return fail("Informe o rendimento por embalagem.");
    // Yield is stored in thousandths of m² per package.
    const denominator = assignedAreaScale * BigInt(config.yield);
    const packages = (row.area * 1000n + denominator - 1n) / denominator;
    if (packages > max)
      return fail("Compra fora da representação numérica segura.");
    row.packages = Number(packages);
    if (invalid[key]?.price) return fail(invalid[key]!.price!);
    if (config.price === undefined)
      return fail("Informe o preço por embalagem.");
    const cost = packages * BigInt(config.price);
    if (cost > max) return fail("Custo fora da representação numérica segura.");
    row.cost = Number(cost);
    const shares = area.floors.map((f, i) => ({
      i,
      whole: (cost * f.net) / area.net,
      rest: (cost * f.net) % area.net,
    }));
    let remainder = cost - shares.reduce((n, s) => n + s.whole, 0n);
    for (const share of [...shares].sort((a, b) =>
      a.rest === b.rest ? a.i - b.i : a.rest > b.rest ? -1 : 1,
    )) {
      if (remainder <= 0n) break;
      if (area.floors[share.i].net > 0n) {
        share.whole++;
        remainder--;
      }
    }
    shares.forEach((s) => {
      local[s.i].cost = Number(s.whole);
    });
    return row;
  });
  return { area, rows, floors, partial: area.available && area.partial };
}
