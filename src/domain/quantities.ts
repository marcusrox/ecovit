import type { Piece } from "./composition";
import type { Project } from "./project";

export const pieceKinds = ["whole", "half", "channel", "half-channel"] as const;
export const pieceLabels: Record<Piece["kind"], string> = {
  whole: "Inteiro",
  half: "Meio",
  channel: "Canaleta",
  "half-channel": "Meia canaleta",
};
export type Counts = Record<Piece["kind"], number> & { total: number };
const empty = (): Counts => ({
  whole: 0,
  half: 0,
  channel: 0,
  "half-channel": 0,
  total: 0,
});
function add(target: Counts, source: Counts) {
  for (const kind of [...pieceKinds, "total"] as const) {
    target[kind] += source[kind];
    if (!Number.isSafeInteger(target[kind]))
      throw new Error("Quantidade fora da representação numérica segura.");
  }
}
export type QuantityReport =
  | { available: false; reason: string }
  | {
      available: true;
      counts: Counts;
      partial: boolean;
      floors: {
        id: string;
        name: string;
        level: number;
        partial: boolean;
        counts: Counts;
        courses: { number: number; counts: Counts }[];
      }[];
    };

export function quantities(doc: Project, busy = false): QuantityReport {
  if (busy)
    return {
      available: false,
      reason: "Cálculo ou operação em andamento. Aguarde.",
    };
  if (
    doc.generationState.status !== "current" ||
    doc.generated?.convention !== "nominal-v10"
  )
    return {
      available: false,
      reason:
        "Composição indisponível. Aguarde o recálculo ou tente recalcular o projeto.",
    };
  const generated = doc.generated;
  const counts = empty();
  const floors = [...doc.model.floors]
    .sort((a, b) => a.level - b.level)
    .map((floor) => {
      const result = generated.floors.find((f) => f.floorId === floor.id);
      if (!result)
        throw new Error("Resultado incompleto para os pavimentos do projeto.");
      const floorCounts = empty();
      const courses = [...result.courses]
        .sort((a, b) => a.number - b.number)
        .map((course) => {
          const counts = empty();
          for (const piece of course.pieces) {
            counts[piece.kind]++;
            counts.total++;
          }
          add(floorCounts, counts);
          return { number: course.number, counts };
        });
      add(counts, floorCounts);
      return {
        id: floor.id,
        name: floor.name,
        level: floor.level,
        partial: generated.diagnostics.some(
          (d) => d.floorId === floor.id && d.severity === "error",
        ),
        counts: floorCounts,
        courses,
      };
    });
  return {
    available: true,
    counts,
    floors,
    partial: generated.diagnostics.some((d) => d.severity === "error"),
  };
}

export function parseLossPercent(text: string): number {
  const value = text.trim();
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value))
    throw new Error(
      "Informe um percentual não negativo com até duas casas decimais.",
    );
  const [whole, decimals = ""] = value.replace(",", ".").split(".");
  const p = BigInt(whole) * 100n + BigInt(decimals.padEnd(2, "0"));
  if (p > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("Percentual fora da representação numérica segura.");
  return Number(p);
}
export function estimateLosses(counts: Counts, p: number) {
  if (!Number.isSafeInteger(p) || p < 0)
    throw new Error("Percentual inválido.");
  const estimated = empty(),
    added = empty();
  for (const kind of pieceKinds) {
    const q = counts[kind];
    if (!Number.isSafeInteger(q) || q < 0)
      throw new Error("Quantidade inválida.");
    const e = (BigInt(q) * (10000n + BigInt(p)) + 9999n) / 10000n;
    if (e > BigInt(Number.MAX_SAFE_INTEGER))
      throw new Error("Estimativa fora da representação numérica segura.");
    estimated[kind] = Number(e);
    added[kind] = Number(e) - q;
  }
  for (const kind of pieceKinds) {
    estimated.total += estimated[kind];
    added.total += added[kind];
  }
  if (
    !Number.isSafeInteger(estimated.total) ||
    !Number.isSafeInteger(added.total)
  )
    throw new Error("Estimativa fora da representação numérica segura.");
  return { estimated, added };
}
