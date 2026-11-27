import { z } from "zod";
import { type Project } from "./project";
import { channelSegments } from "./channel-reinforcement";

export const groutFields = [
  "verticalConsumption",
  "verticalLoss",
  "horizontalConsumption",
  "horizontalLoss",
  "price",
] as const;
export type GroutField = (typeof groutFields)[number];
export const groutLabels: Record<GroutField, string> = {
  verticalConsumption: "Consumo vertical (L/m)",
  verticalLoss: "Perdas verticais (%)",
  horizontalConsumption: "Consumo horizontal — canaletas (L/m)",
  horizontalLoss: "Perdas horizontais — canaletas (%)",
  price: "Preço do microconcreto (R$/m³)",
};
export const groutDefaults = {
  verticalConsumption: 4220,
  verticalLoss: 500,
  horizontalConsumption: 2560,
  horizontalLoss: 1000,
};
const safe = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const groutSettingsSchema = z
  .object({
    verticalConsumption: safe.min(1).optional(),
    horizontalConsumption: safe.min(1).optional(),
    verticalLoss: safe.optional(),
    horizontalLoss: safe.optional(),
    price: safe.optional(),
  })
  .strict();
export type GroutBudgetSettings = z.infer<typeof groutSettingsSchema>;
export const groutInfo =
  "Microconcreto é uma mistura à base de cimento, água e agregados de pequena dimensão, podendo conter aditivos, usada no preenchimento dos grautes. Informe o consumo em litros por metro linear para cada aplicação, conforme o material e o projeto adotados.";
export function validateGroutValue(key: GroutField, value: number) {
  groutSettingsSchema.parse({ [key]: value });
}
export function parseGroutField(
  key: GroutField,
  text: string,
): number | undefined {
  const value = text.trim();
  if (!value) return undefined;
  const decimals = key.endsWith("Consumption") ? 3 : 2;
  if (!new RegExp(`^\\d+(?:[.,]\\d{1,${decimals}})?$`).test(value))
    throw new Error(
      `Informe valor ${decimals === 3 ? "positivo" : "não negativo"} com até ${decimals} casas decimais.`,
    );
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  const scaled =
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, "0"));
  if (
    scaled > BigInt(Number.MAX_SAFE_INTEGER) ||
    (decimals === 3 && scaled === 0n)
  )
    throw new Error(
      "Valor fora da representação segura ou consumo não positivo.",
    );
  return Number(scaled);
}
export function groutFieldText(key: GroutField, value: number | undefined) {
  if (value === undefined) return "";
  const decimals = key.endsWith("Consumption") ? 3 : 2;
  const scale = 10n ** BigInt(decimals),
    n = BigInt(value);
  return `${n / scale},${String(n % scale).padStart(decimals, "0")}`;
}
// Raw lengths are 0.1 mm; coefficients are thousandths L/m and losses hundredths %.
export const groutVolumeScale = 100_000_000_000n; // litre denominator
const max = BigInt(Number.MAX_SAFE_INTEGER);
export type GroutRow = {
  application: "vertical" | "horizontal";
  length: bigint;
  base?: bigint;
  estimated?: bigint;
  error?: string;
  field?: GroutField;
};
export type GroutFloor = {
  id: string;
  name: string;
  level: number;
  partial: boolean;
  rows: GroutRow[];
  total?: bigint;
  cost?: number;
};
export type GroutReport =
  | { available: false; reason: string }
  | {
      available: true;
      partial: boolean;
      rows: GroutRow[];
      floors: GroutFloor[];
      total?: bigint;
      cost?: number;
      error?: string;
      field?: GroutField;
    };
function row(
  application: GroutRow["application"],
  length: bigint,
  config: GroutBudgetSettings,
  invalid: Partial<Record<GroutField, string>>,
): GroutRow {
  const r: GroutRow = { application, length };
  if (length === 0n) return { ...r, base: 0n, estimated: 0n };
  const consumption = `${application}Consumption` as GroutField,
    loss = `${application}Loss` as GroutField;
  const fail = (field: GroutField, error: string) =>
    Object.assign(r, { field, error });
  if (length > max)
    return {
      ...r,
      error: "Comprimento fora da representação numérica segura.",
    };
  if (invalid[consumption]) return fail(consumption, invalid[consumption]!);
  if (config[consumption] === undefined)
    return fail(consumption, "Informe o consumo em L/m.");
  r.base = length * BigInt(config[consumption]!) * 10000n;
  if (r.base > max * groutVolumeScale)
    return {
      ...r,
      base: undefined,
      error: "Consumo fora da representação numérica segura.",
    };
  if (invalid[loss]) return fail(loss, invalid[loss]!);
  if (config[loss] === undefined)
    return fail(loss, "Informe as perdas em % (0% é válido).");
  const estimated =
    length * BigInt(config[consumption]!) * (10000n + BigInt(config[loss]!));
  if (estimated > max * groutVolumeScale)
    return {
      ...r,
      error: "Consumo estimado fora da representação numérica segura.",
    };
  return { ...r, estimated };
}
const sumRows = (rows: GroutRow[]) =>
  rows.every((r) => r.estimated !== undefined)
    ? rows.reduce((sum, r) => sum + r.estimated!, 0n)
    : undefined;
function mergedLength(intervals: { bottom: number; top: number }[]) {
  let end: number | undefined,
    total = 0n;
  for (const i of [...intervals].sort(
    (a, b) => a.bottom - b.bottom || a.top - b.top,
  )) {
    if (i.top <= i.bottom) throw new Error("Intervalo de graute inválido.");
    total += BigInt(Math.max(0, i.top - Math.max(i.bottom, end ?? i.bottom)));
    end = Math.max(end ?? i.top, i.top);
  }
  return total;
}
export function groutBudget(
  doc: Project,
  busy = false,
  invalid: Partial<Record<GroutField, string>> = {},
): GroutReport {
  if (busy)
    return { available: false, reason: "Operação em andamento. Aguarde." };
  if (
    doc.generationState.status !== "current" ||
    doc.generated?.convention !== "nominal-v13"
  )
    return {
      available: false,
      reason: "Composição indisponível ou desatualizada. Aguarde o recálculo.",
    };
  try {
    const config = groutSettingsSchema.parse(doc.project.groutBudget ?? {});
    const floors: GroutFloor[] = [...doc.model.floors]
      .sort((a, b) => a.level - b.level || a.id.localeCompare(b.id))
      .map((f) => {
        const result = doc.generated!.floors.find((g) => g.floorId === f.id);
        if (!result)
          throw new Error(
            "Resultado incompleto para os pavimentos do projeto.",
          );
        const axes = new Map<string, { bottom: number; top: number }[]>();
        for (const axis of result.grouts ?? []) {
          const key = `${axis.x}:${axis.y}`;
          axes.set(key, [...(axes.get(key) ?? []), ...axis.intervals]);
        }
        const vertical = [...axes.values()].reduce(
          (n, intervals) => n + mergedLength(intervals),
          0n,
        );
        const horizontal = channelSegments(doc, result).reduce(
          (n, segment) =>
            n +
            BigInt(
              Math.abs(segment.b.x - segment.a.x) +
                Math.abs(segment.b.y - segment.a.y),
            ),
          0n,
        );
        const rows = [
          row("vertical", vertical, config, invalid),
          row("horizontal", horizontal, config, invalid),
        ];
        return {
          id: f.id,
          name: f.name,
          level: f.level,
          partial: result.diagnostics.some(
            (d) => d.severity === "error" && d.code !== "clamp-pending",
          ),
          rows,
          total: sumRows(rows),
        };
      });
    const rows = (["vertical", "horizontal"] as const).map((app, i) =>
      row(
        app,
        floors.reduce((n, f) => n + f.rows[i].length, 0n),
        config,
        invalid,
      ),
    );
    const total = sumRows(rows);
    const report: Extract<GroutReport, { available: true }> = {
      available: true,
      partial:
        floors.some((f) => f.partial) ||
        doc.generated.diagnostics.some(
          (d) => d.severity === "error" && d.code !== "clamp-pending",
        ),
      floors,
      rows,
      total,
    };
    if (total === undefined) return report;
    if (total > max * groutVolumeScale)
      return {
        ...report,
        total: undefined,
        error: "Consumo total fora da representação numérica segura.",
      };
    if (total === 0n) {
      report.cost = 0;
      floors.forEach((f) => (f.cost = 0));
      return report;
    }
    if (invalid.price || config.price === undefined)
      return {
        ...report,
        error: invalid.price ?? "Informe o preço do microconcreto em R$/m³.",
        field: "price",
      };
    const denominator = groutVolumeScale * 1000n;
    const cost =
      (total * BigInt(config.price) + denominator / 2n) / denominator;
    if (cost > max)
      return {
        ...report,
        error: "Custo fora da representação numérica segura.",
      };
    report.cost = Number(cost);
    // Reconcile floor costs with the rounded global cost using largest remainders.
    const shares = floors.map((f, i) => ({
      i,
      whole: (cost * f.total!) / total,
      rest: (cost * f.total!) % total,
    }));
    let remainder = cost - shares.reduce((n, s) => n + s.whole, 0n);
    for (const s of [...shares].sort((a, b) =>
      a.rest === b.rest ? a.i - b.i : a.rest > b.rest ? -1 : 1,
    )) {
      if (remainder === 0n) break;
      s.whole++;
      remainder--;
    }
    shares.forEach((s) => (floors[s.i].cost = Number(s.whole)));
    return report;
  } catch (e) {
    return {
      available: false,
      reason: e instanceof Error ? e.message : "Consumo indisponível.",
    };
  }
}
