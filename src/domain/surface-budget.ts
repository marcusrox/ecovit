import { z } from "zod";
import { length, type Project, type Point } from "./project";
import { wallBudgetAreas } from "./wall-budget-area";
import { assignedAreaScale, parseSettlementField } from "./settlement-budget";

export const surfaceProducts = [
  { key: "waterproofing", label: "Impermeabilizante de superfície de paredes" },
  { key: "jointing", label: "Rejunte" },
  { key: "wallBase", label: "Base das paredes" },
  { key: "slabs", label: "Superfície das lajes" },
] as const;
export const isConcreteProduct = (key: SurfaceKey) =>
  key === "wallBase" || key === "slabs";
export const concreteAreaScale = assignedAreaScale * 2n;
export type SurfaceKey = (typeof surfaceProducts)[number]["key"];
export type SurfaceField = "percent" | "yield" | "price";
export const referenceDescriptionSchema = z.string().trim().min(1).max(160);
export const referenceYieldSchema = z
  .number()
  .int()
  .min(1)
  .max(Number.MAX_SAFE_INTEGER);
const productSchema = z
  .object({
    percent: z.number().int().min(0).max(10000).optional(),
    yield: referenceYieldSchema.optional(),
    price: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
    referenceDescription: referenceDescriptionSchema.optional(),
    productDescription: z.string().trim().max(160).optional(),
  })
  .strict();
export const surfaceSettingsSchema = z
  .object({
    waterproofing: productSchema.optional(),
    jointing: productSchema.optional(),
    wallBase: productSchema.omit({ percent: true }).strict().optional(),
    slabs: productSchema.omit({ percent: true }).strict().optional(),
  })
  .strict();
export type SurfaceSettings = z.infer<typeof surfaceSettingsSchema>;
export type SurfaceErrors = Partial<
  Record<
    SurfaceKey,
    Partial<Record<SurfaceField | `percent:${string}`, string>>
  >
>;
export type SurfaceConfig = z.infer<typeof productSchema>;
export type SurfaceApplication = {
  id: string;
  floorId: string;
  label: string;
  key: "wallBase" | "slabs";
  percent: number;
  base: bigint;
  area?: bigint;
  cost?: number;
};
export type SurfaceRow = {
  key: SurfaceKey;
  area?: bigint; // m²: concreteAreaScale for wallBase/slabs, assignedAreaScale otherwise
  packages?: number;
  cost?: number;
  error?: string;
  errorField?: SurfaceField | `percent:${string}`;
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
  const applications: SurfaceApplication[] = [];
  const rows = surfaceProducts.map(({ key }) => {
    if (key === "wallBase" || key === "slabs") {
      const result = concreteBudget(doc, key, busy, invalid[key]);
      applications.push(...result.applications);
      floors.forEach((floor) => floor.rows.push(result.floors.get(floor.id)!));
      return result.row;
    }
    const config = doc.project.surface?.[key];
    const row: SurfaceRow = { key };
    const local = floors.map((f) => {
      const r: SurfaceRow = { key };
      f.rows.push(r);
      return r;
    });
    const fail = (message: string, field?: SurfaceField) => {
      row.error = message;
      if (field) row.errorField = field;
      return row;
    };
    if (invalid[key]?.percent) return fail(invalid[key]!.percent!, "percent");
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
    if (invalid[key]?.yield) return fail(invalid[key]!.yield!, "yield");
    if (config?.yield === undefined)
      return fail("Informe o rendimento por embalagem.", "yield");
    // Yield is stored in thousandths of m² per package.
    const denominator = assignedAreaScale * BigInt(config.yield);
    const packages = (row.area * 1000n + denominator - 1n) / denominator;
    if (packages > max)
      return fail("Compra fora da representação numérica segura.");
    row.packages = Number(packages);
    if (invalid[key]?.price) return fail(invalid[key]!.price!, "price");
    if (config.price === undefined)
      return fail("Informe o preço por embalagem.", "price");
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
  return {
    area,
    rows,
    floors,
    applications,
    partial: area.available && area.partial,
  };
}

// Twice the polygon area, using exact internal coordinates (0.1 mm).
function ringArea2(points: Point[]) {
  const value = points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length];
    return sum + BigInt(p.x) * BigInt(q.y) - BigInt(q.x) * BigInt(p.y);
  }, 0n);
  return value < 0n ? -value : value;
}

function concreteBudget(
  doc: Project,
  key: "wallBase" | "slabs",
  busy: boolean,
  invalid: SurfaceErrors[SurfaceKey],
) {
  const applications: SurfaceApplication[] = [];
  const sorted = [...doc.model.floors].sort(
    (a, b) => a.level - b.level || a.id.localeCompare(b.id),
  );
  for (const floor of sorted) {
    if (key === "wallBase") {
      const seen = new Set<string>();
      const linear = doc.model.walls
        .filter((w) => w.floorId === floor.id)
        .reduce((sum, wall) => {
          if (seen.has(wall.id))
            throw new Error("Parede duplicada no documento.");
          seen.add(wall.id);
          return sum + BigInt(length(wall));
        }, 0n);
      // Twice the common area scale preserves half-unit fractions exactly.
      applications.push({
        key,
        id: floor.id,
        floorId: floor.id,
        label: `${floor.name} · ${floor.level / 100} cm`,
        percent: floor.waterproofingPercent ?? 0,
        base: linear * BigInt(doc.project.base.width) * 30000n,
      });
    } else {
      for (const slab of doc.model.slabs.filter(
        (s) => s.floorId === floor.id,
      )) {
        const net2 =
          ringArea2(slab.contour) -
          slab.openings.reduce(
            (sum, opening) => sum + ringArea2(opening.contour),
            0n,
          );
        applications.push({
          key,
          id: slab.id,
          floorId: floor.id,
          label: `Laje · ${floor.name} · ${floor.level / 100} cm`,
          percent: slab.waterproofingPercent ?? 0,
          base: net2 * 10000n,
        });
      }
    }
  }
  const row: SurfaceRow = { key };
  const floors = new Map(sorted.map((f) => [f.id, { key } as SurfaceRow]));
  const fail = (error: string, errorField?: SurfaceRow["errorField"]) => {
    Object.assign(row, { error, ...(errorField ? { errorField } : {}) });
    return { row, floors, applications };
  };
  let applicationError:
    { message: string; field?: SurfaceRow["errorField"] } | undefined;
  for (const entry of applications) {
    const error = invalid?.[`percent:${entry.id}`];
    if (error)
      applicationError ??= { message: error, field: `percent:${entry.id}` };
    else if (entry.percent === 0) {
      entry.area = 0n;
      entry.cost = 0;
    } else if (busy)
      applicationError ??= { message: "Aguarde a conclusão da operação." };
    else entry.area = (entry.base * BigInt(entry.percent)) / 10000n;
  }
  for (const [id, local] of floors) {
    const entries = applications.filter((e) => e.floorId === id);
    if (entries.every((e) => e.area !== undefined))
      local.area = entries.reduce((sum, e) => sum + e.area!, 0n);
    if (local.area === 0n) local.cost = 0;
  }
  if (applicationError)
    return fail(applicationError.message, applicationError.field);
  row.area = applications.reduce((sum, entry) => sum + entry.area!, 0n);
  if (row.area === 0n) {
    Object.assign(row, { packages: 0, cost: 0 });
    applications.forEach((entry) => (entry.cost = 0));
    return { row, floors, applications };
  }
  if (row.area > max * concreteAreaScale)
    return fail("Área fora da representação numérica segura.");
  const config = doc.project.surface?.[key];
  if (invalid?.yield) return fail(invalid.yield, "yield");
  if (config?.yield === undefined)
    return fail("Informe o rendimento por embalagem.", "yield");
  const denominator = concreteAreaScale * BigInt(config.yield);
  const packages = (row.area * 1000n + denominator - 1n) / denominator;
  if (packages > max)
    return fail("Compra fora da representação numérica segura.");
  row.packages = Number(packages);
  if (invalid?.price) return fail(invalid.price, "price");
  if (config.price === undefined)
    return fail("Informe o preço por embalagem.", "price");
  const cost = packages * BigInt(config.price);
  if (cost > max) return fail("Custo fora da representação numérica segura.");
  row.cost = Number(cost);
  const shares = applications.map((e, i) => ({
    i,
    whole: (cost * e.area!) / row.area!,
    rest: (cost * e.area!) % row.area!,
  }));
  let remainder = cost - shares.reduce((sum, s) => sum + s.whole, 0n);
  for (const share of [...shares].sort((a, b) =>
    a.rest === b.rest ? a.i - b.i : a.rest > b.rest ? -1 : 1,
  )) {
    if (!remainder) break;
    if (applications[share.i].area! > 0n) {
      share.whole++;
      remainder--;
    }
  }
  shares.forEach((s) => (applications[s.i].cost = Number(s.whole)));
  for (const [id, local] of floors)
    local.cost = applications
      .filter((e) => e.floorId === id)
      .reduce((sum, e) => sum + e.cost!, 0);
  return { row, floors, applications };
}
