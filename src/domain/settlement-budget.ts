import { type Project } from "./project";
import { wallBudgetAreas } from "./wall-budget-area";
import { parseUnitPrice } from "./budget";
import { parseLossPercent } from "./quantities";

export const settlementCatalog = [
  {
    key: "ac1",
    label: "Argamassa AC1",
    capacity: 20,
    unit: "kg",
    package: "Saco de 20 kg",
    yield: 1400,
  },
  {
    key: "ac2",
    label: "Argamassa AC2",
    capacity: 20,
    unit: "kg",
    package: "Saco de 20 kg",
    yield: 1400,
  },
  {
    key: "ac3",
    label: "Argamassa AC3",
    capacity: 20,
    unit: "kg",
    package: "Saco de 20 kg",
    yield: 1400,
  },
  {
    key: "polymer",
    label: "Argamassa polimérica",
    capacity: 3,
    unit: "kg",
    package: "Pacote de 3 kg",
    yield: 1400,
  },
  {
    key: "white-glue",
    label: "Cola branca",
    capacity: 1000,
    unit: "ml",
    package: "Embalagem de 1 litro",
    yield: 80000,
  },
  {
    key: "special-glue",
    label: "Cola especial",
    capacity: 1000,
    unit: "ml",
    package: "Embalagem de 1 litro",
    yield: 80000,
  },
] as const;
export type SettlementKey = (typeof settlementCatalog)[number]["key"];
export type SettlementField = "percent" | "yield" | "price";
export type SettlementSettings = Partial<
  Record<
    SettlementKey,
    {
      percent?: number;
      yield?: number;
      price?: number;
    }
  >
>;
export type SettlementErrors = Partial<
  Record<SettlementKey, Partial<Record<SettlementField, string>>>
>;
export const areaScale = 100000000n;
export const assignedAreaScale = areaScale * 10000n;
export const consumptionScale = assignedAreaScale * 1000n;
const max = BigInt(Number.MAX_SAFE_INTEGER);

export function parseSettlementField(
  field: SettlementField,
  text: string,
): number | undefined {
  if (field === "price") return parseUnitPrice(text);
  if (field === "percent") {
    const value = parseLossPercent(text);
    if (value > 10000)
      throw new Error("Informe um percentual entre 0% e 100%.");
    return value;
  }
  const raw = text.trim();
  if (!/^\d+(?:[.,]\d{1,3})?$/.test(raw))
    throw new Error(
      "Informe um rendimento positivo com até três casas decimais.",
    );
  const [whole, fraction = ""] = raw.replace(",", ".").split(".");
  const value = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0"));
  if (value <= 0n || value > max)
    throw new Error(
      "Rendimento fora da representação numérica segura ou não positivo.",
    );
  return Number(value);
}

export type SettlementRow = {
  key: SettlementKey;
  area?: bigint; // denominator assignedAreaScale, m²
  consumption?: bigint; // denominator consumptionScale, kg or ml
  packages?: number;
  cost?: number;
  error?: string;
};
export type SettlementFloor = {
  id: string;
  name: string;
  level: number;
  partial: boolean;
  gross: bigint;
  openings: bigint;
  net: bigint;
  rows: SettlementRow[];
  total?: number;
};
export type SettlementReport =
  | { available: false; reason: string }
  | {
      available: true;
      partial: boolean;
      gross: bigint;
      openings: bigint;
      net: bigint;
      percent: number;
      distributionValid: boolean;
      rows: SettlementRow[];
      floors: SettlementFloor[];
      total?: number;
      error?: string;
    };
function sumCosts(rows: SettlementRow[]) {
  if (rows.some((r) => r.cost === undefined)) return undefined;
  const sum = rows.reduce((n, r) => n + BigInt(r.cost!), 0n);
  return sum <= max ? Number(sum) : undefined;
}

export function settlementBudget(
  doc: Project,
  busy = false,
  invalid: SettlementErrors = {},
): SettlementReport {
  const area = wallBudgetAreas(doc, busy);
  if (!area.available) return area;
  const { gross, openings, net } = area;
  const floors: SettlementFloor[] = area.floors.map((f) => ({
    ...f,
    rows: [],
  }));
  const settings = doc.project.settlement ?? {};
  const percent = settlementCatalog.reduce(
    (n, s) => n + (settings[s.key]?.percent ?? 0),
    0,
  );
  const distributionValid =
    percent === 10000 &&
    !settlementCatalog.some((s) => invalid[s.key]?.percent);
  const rows: SettlementRow[] = settlementCatalog.map((s) => {
    const config = settings[s.key],
      p = BigInt(config?.percent ?? 0);
    const row: SettlementRow = { key: s.key };
    const local = floors.map((f) => {
      const r: SettlementRow = { key: s.key };
      f.rows.push(r);
      if (f.net === 0n)
        Object.assign(r, { area: 0n, consumption: 0n, cost: 0 });
      return r;
    });
    if (net === 0n)
      return { ...row, area: 0n, consumption: 0n, packages: 0, cost: 0 };
    if (!distributionValid) return row;
    row.area = net * p;
    floors.forEach((f, i) => {
      local[i].area = f.net * p;
    });
    if (p === 0n) {
      local.forEach((r) => Object.assign(r, { consumption: 0n, cost: 0 }));
      return { ...row, consumption: 0n, packages: 0, cost: 0 };
    }
    if (invalid[s.key]?.yield) return { ...row, error: invalid[s.key]!.yield };
    const consumption = row.area * BigInt(config?.yield ?? s.yield);
    if (consumption > max * consumptionScale)
      return {
        ...row,
        error: "Consumo fora da representação numérica segura.",
      };
    row.consumption = consumption;
    floors.forEach((f, i) => {
      local[i].consumption = f.net * p * BigInt(config?.yield ?? s.yield);
    });
    const packageScale = consumptionScale * BigInt(s.capacity);
    const packages = (consumption + packageScale - 1n) / packageScale;
    if (packages > max)
      return {
        ...row,
        error: "Embalagens fora da representação numérica segura.",
      };
    row.packages = Number(packages);
    if (invalid[s.key]?.price) return { ...row, error: invalid[s.key]!.price };
    if (config?.price === undefined)
      return { ...row, error: "Informe o preço por embalagem." };
    const cost = packages * BigInt(config.price);
    if (cost > max)
      return { ...row, error: "Custo fora da representação numérica segura." };
    row.cost = Number(cost);
    const shares = floors.map((f, i) => ({
      i,
      whole: (cost * f.net) / net,
      rest: (cost * f.net) % net,
    }));
    let remainder = cost - shares.reduce((n, s) => n + s.whole, 0n);
    for (const share of [...shares].sort((a, b) =>
      a.rest === b.rest ? a.i - b.i : a.rest > b.rest ? -1 : 1,
    )) {
      if (remainder <= 0n) break;
      if (floors[share.i].net > 0n) {
        share.whole++;
        remainder--;
      }
    }
    shares.forEach((share) => {
      local[share.i].cost = Number(share.whole);
    });
    return row;
  });
  for (const floor of floors) floor.total = sumCosts(floor.rows);
  const total = sumCosts(rows);
  return {
    available: true,
    gross,
    openings,
    net,
    partial: area.partial,
    percent,
    distributionValid,
    rows,
    floors,
    total,
    error:
      rows.every((r) => r.cost !== undefined) && total === undefined
        ? "Subtotal de assentamento fora da representação numérica segura."
        : undefined,
  };
}

export function settlementNumber(n: bigint, denominator = areaScale) {
  const rounded = (n * 1000n + denominator / 2n) / denominator;
  const fraction = String(rounded % 1000n)
    .padStart(3, "0")
    .replace(/0+$/, "");
  return `${(rounded / 1000n).toLocaleString("pt-BR")}${fraction ? `,${fraction}` : ""}`;
}
