import { display, LIMIT, type Project } from "./project";

// Nominal masses, Gerdau GG 50 / CA-60 catalogues consulted 2026-11-18.
export const steelCatalog = [
  { key: "ca60-5", category: "CA-60", diameter: 50, gramsPerMetre: 154 },
  { key: "ca50-6.3", category: "CA-50", diameter: 63, gramsPerMetre: 245 },
  { key: "ca50-8", category: "CA-50", diameter: 80, gramsPerMetre: 395 },
  { key: "ca50-10", category: "CA-50", diameter: 100, gramsPerMetre: 617 },
  { key: "ca50-12.5", category: "CA-50", diameter: 125, gramsPerMetre: 963 },
] as const;
export type SteelKey = (typeof steelCatalog)[number]["key"];
export type SteelPrices = Partial<Record<SteelKey, number>>;
export type SteelBudgetSettings = {
  usefulLength: number;
  overlapLength: number;
  horizontalExtra: number; // hundredths of a percentage point, 1000 = 10%.
};
export const defaultSteelBudget = (): SteelBudgetSettings => ({
  usefulLength: 15000,
  overlapLength: 2000,
  horizontalExtra: 1000,
});
export function validateSteelBudget(s: SteelBudgetSettings) {
  if (
    !Number.isSafeInteger(s.usefulLength) ||
    s.usefulLength <= 0 ||
    s.usefulLength > LIMIT
  )
    throw new Error(
      "Informe comprimento útil positivo, na precisão do editor.",
    );
  if (
    !Number.isSafeInteger(s.overlapLength) ||
    s.overlapLength < 0 ||
    s.overlapLength > LIMIT
  )
    throw new Error(
      "Informe sobreposição não negativa, na precisão do editor.",
    );
  if (!Number.isSafeInteger(s.horizontalExtra) || s.horizontalExtra < 0)
    throw new Error(
      "Informe acréscimo não negativo com até duas casas decimais.",
    );
}

export const steelApplications = ["vertical", "clamps", "channels"] as const;
export type SteelApplication = (typeof steelApplications)[number];
export const steelApplicationLabels: Record<SteelApplication, string> = {
  vertical: "Grautes verticais",
  clamps: "Grampos dos encontros",
  channels: "Armadura das canaletas",
};
// All lengths use rational units: 0.1 mm / 10000 = 10^-8 m.
export const steelLengthScale = 100_000_000n;
const weightScale = steelLengthScale * 1000n; // kg numerator = length * g/m.
const max = BigInt(Number.MAX_SAFE_INTEGER);
export type SteelQuantity = {
  key: string;
  diameter: number;
  base: bigint;
  extra: bigint;
  estimated: bigint;
  weight?: bigint;
  error?: string;
};
export type SteelFloor = {
  id: string;
  name: string;
  level: number;
  partial: boolean;
  settings: SteelBudgetSettings;
  pending: string[];
  details: (SteelQuantity & { application: SteelApplication })[];
};
export type SteelReport =
  | { available: false; reason: string }
  | {
      available: true;
      partial: boolean;
      rows: SteelQuantity[];
      floors: SteelFloor[];
    };
function quantity(diameter: number): SteelQuantity {
  return {
    key:
      steelCatalog.find((s) => s.diameter === diameter)?.key ??
      `unknown-${diameter}`,
    diameter,
    base: 0n,
    extra: 0n,
    estimated: 0n,
  };
}
function finish<T extends SteelQuantity>(q: T): T {
  q.estimated = q.base + q.extra;
  if (q.estimated > max * 10000n)
    q.error = "Comprimento fora da representação numérica segura.";
  const material = steelCatalog.find((s) => s.key === q.key);
  if (!material) q.error = "Bitola sem categoria/massa cadastrada.";
  else if (!q.error) {
    const weight = q.estimated * BigInt(material.gramsPerMetre);
    if (weight > max * steelLengthScale)
      q.error = "Peso fora da representação numérica segura.";
    else q.weight = weight;
  }
  return q;
}

export function steelQuantities(doc: Project, busy = false): SteelReport {
  if (busy)
    return {
      available: false,
      reason: "Cálculo ou operação em andamento. Aguarde.",
    };
  if (
    doc.generationState.status !== "current" ||
    doc.generated?.convention !== "nominal-v13"
  )
    return {
      available: false,
      reason: "Ferragens indisponíveis. Aguarde o recálculo do projeto.",
    };
  const rows = new Map<string, SteelQuantity>(
    steelCatalog.map((s) => [s.key, quantity(s.diameter)]),
  );
  const floors: SteelFloor[] = [];
  for (const floor of [...doc.model.floors].sort((a, b) => a.level - b.level)) {
    const result = doc.generated.floors.find((f) => f.floorId === floor.id);
    if (!result)
      return {
        available: false,
        reason: "Resultado incompleto para os pavimentos do projeto.",
      };
    const settings = floor.steelBudget ?? defaultSteelBudget();
    validateSteelBudget(settings);
    const details = new Map<
      string,
      SteelQuantity & { application: SteelApplication }
    >();
    const add = (
      application: SteelApplication,
      diameter: number,
      base: bigint,
      extra: bigint,
    ) => {
      const item = quantity(diameter),
        id = `${application}:${item.key}`;
      const detail = details.get(id) ?? { ...item, application };
      detail.base += base;
      detail.extra += extra;
      details.set(id, detail);
      const row = rows.get(item.key) ?? item;
      row.base += base;
      row.extra += extra;
      rows.set(item.key, row);
    };
    for (const axis of result.grouts ?? [])
      for (const interval of axis.intervals) {
        const h = BigInt(interval.top) - BigInt(interval.bottom);
        if (h <= 0n) throw new Error("Intervalo de graute inválido.");
        const useful = BigInt(settings.usefulLength),
          stages = (h + useful - 1n) / useful;
        add(
          "vertical",
          floor.groutDiameter ?? 80,
          h * 10000n,
          (stages - 1n) * BigInt(settings.overlapLength) * 10000n,
        );
      }
    const pendingClamps = (result.clamps ?? []).filter((c) => c.pending);
    const represented = new Set(
      pendingClamps.map((c) => `${c.course}:${c.a.x}:${c.a.y}:${c.pending}`),
    );
    const pending = new Map<string, string>();
    for (const d of result.diagnostics.filter(
      (d) => d.code === "clamp-pending",
    )) {
      const prefix = `Grampo pendente na fiada ${d.course}: `;
      const reason = d.message.startsWith(prefix)
        ? d.message.slice(prefix.length)
        : d.message;
      if (represented.has(`${d.course}:${d.x}:${d.y}:${reason}`)) continue;
      pending.set(
        `diagnostic:${d.course}:${d.x}:${d.y}:${d.message}`,
        d.message +
          (d.wallIds.length
            ? ` Referência: (${display(d.x)}, ${display(d.y)}) cm.`
            : ""),
      );
    }
    for (const clamp of result.clamps ?? []) {
      if (clamp.pending) {
        pending.set(
          `clamp:${clamp.id}`,
          `Grampo pendente na fiada ${clamp.course} · células (${display(clamp.a.x)}, ${display(clamp.a.y)}) → (${display(clamp.b.x)}, ${display(clamp.b.y)}) cm: ${clamp.pending}`,
        );
        continue;
      }
      add("clamps", clamp.diameter, BigInt(clamp.length) * 10000n, 0n);
    }
    for (const bar of result.reinforcement ?? []) {
      const length =
        (BigInt(Math.abs(bar.b.x - bar.a.x)) +
          BigInt(Math.abs(bar.b.y - bar.a.y))) *
        BigInt(bar.count);
      add(
        "channels",
        bar.diameter,
        length * 10000n,
        length * BigInt(settings.horizontalExtra),
      );
    }
    floors.push({
      id: floor.id,
      name: floor.name,
      level: floor.level,
      settings,
      partial:
        pending.size > 0 ||
        result.diagnostics.some((d) => d.severity === "error"),
      pending: [...pending.values()],
      details: [...details.values()].map(finish),
    });
  }
  return {
    available: true,
    partial:
      floors.some((f) => f.partial) ||
      doc.generated.diagnostics.some((d) => d.severity === "error"),
    rows: [...rows.values()].map(finish),
    floors,
  };
}

export function steelCosts(
  report: SteelReport,
  prices: SteelPrices,
  invalid: Partial<Record<SteelKey, string>> = {},
) {
  const costs: Record<string, number | undefined> = {},
    errors: Record<string, string> = {};
  let total = 0n,
    complete = report.available;
  if (report.available)
    for (const row of report.rows) {
      const key = row.key as SteelKey,
        price = prices[key];
      let error = invalid[key] ?? row.error;
      if (
        !error &&
        price !== undefined &&
        (!Number.isSafeInteger(price) || price < 0)
      )
        error = "Preço inválido.";
      if (!error && row.estimated > 0n && price === undefined)
        error = "Informe o preço por kg.";
      if (!error && row.weight !== undefined) {
        const cost =
          (row.weight * BigInt(price ?? 0) + weightScale / 2n) / weightScale;
        if (cost > max) error = "Custo fora da representação numérica segura.";
        else {
          costs[row.key] = Number(cost);
          total += cost;
        }
      }
      if (error) {
        errors[row.key] = error;
        complete = false;
      }
    }
  const error =
    total > max
      ? "Subtotal de ferragens fora da representação numérica segura."
      : "";
  return {
    costs,
    errors,
    total: complete && !error ? Number(total) : undefined,
    error,
  };
}

export function steelNumber(n: bigint, denominator = steelLengthScale) {
  const rounded = (n * 1000n + denominator / 2n) / denominator;
  const fraction = String(rounded % 1000n)
    .padStart(3, "0")
    .replace(/0+$/, "");
  return `${(rounded / 1000n).toLocaleString("pt-BR")}${fraction ? `,${fraction}` : ""}`;
}
export const steelWeight = (n: bigint) => steelNumber(n, weightScale);
export const steelLabel = (q: Pick<SteelQuantity, "key" | "diameter">) =>
  `${steelCatalog.find((s) => s.key === q.key)?.category ?? "Sem cadastro"} · Ø ${(q.diameter / 10).toLocaleString("pt-BR")} mm`;
