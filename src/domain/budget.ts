import type { Project } from "./project";
import { pieceKinds, type Counts } from "./quantities";

export type UnitPrices = NonNullable<Project["project"]["unitPrices"]>;
const limit = BigInt(Number.MAX_SAFE_INTEGER);

export function parseUnitPrice(text: string): number | undefined {
  const value = text.trim();
  if (!value) return undefined;
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value))
    throw new Error(
      "Informe um preço não negativo com até duas casas decimais.",
    );
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (cents > limit)
    throw new Error("Preço fora da representação numérica segura.");
  return Number(cents);
}

export function priceText(cents: number | undefined): string {
  if (cents === undefined) return "";
  if (!Number.isSafeInteger(cents) || cents < 0)
    throw new Error("Preço inválido.");
  const n = BigInt(cents);
  return `${n / 100n},${String(n % 100n).padStart(2, "0")}`;
}

export function money(cents: number): string {
  const [whole, fraction] = priceText(cents).split(",");
  return `R$ ${BigInt(whole).toLocaleString("pt-BR")},${fraction}`;
}

export function budgetCosts(counts: Counts, prices: UnitPrices) {
  const costs: Partial<Record<(typeof pieceKinds)[number], number>> = {};
  let total = 0n,
    complete = true;
  for (const kind of pieceKinds) {
    const quantity = counts[kind],
      price = prices[kind];
    if (!Number.isSafeInteger(quantity) || quantity < 0)
      throw new Error("Quantidade inválida.");
    if (price !== undefined && (!Number.isSafeInteger(price) || price < 0))
      throw new Error("Preço inválido.");
    if (quantity > 0 && price === undefined) {
      complete = false;
      continue;
    }
    const cost = BigInt(quantity) * BigInt(price ?? 0);
    if (cost > limit)
      throw new Error("Custo fora da representação numérica segura.");
    costs[kind] = Number(cost);
    total += cost;
  }
  if (total > limit)
    throw new Error("Total fora da representação numérica segura.");
  return { costs, total: complete ? Number(total) : undefined };
}
