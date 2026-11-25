import type { LocalProject } from "./project";

/** Select existing rows from the current composition; never generate masonry. */
export function relevantCourses(doc: LocalProject): number[] {
  if (doc.generationState.status !== "current" || !doc.generated)
    throw new Error("Fiadas indisponíveis: aguarde uma composição vigente.");
  const rows = doc.generated.courses;
  const selected = new Set<number>();
  const add = (number: number | undefined) => {
    if (number !== undefined && rows.some((r) => r.number === number))
      selected.add(number);
  };
  add(1);
  for (const row of rows)
    if (
      row.pieces.some((p) => p.kind === "channel" || p.kind === "half-channel")
    )
      add(row.number);
  for (const clamp of doc.generated.clamps ?? []) add(clamp.course);
  for (const wall of doc.model.walls) {
    const occupied = rows.filter((r) => r.bottom < wall.height && r.top > 0);
    const last = occupied.at(-1);
    add(last?.number);
    if (last) add(rows.find((r) => r.number > last.number)?.number);
    for (const opening of doc.model.openings.filter(
      (o) => o.wallId === wall.id,
    )) {
      let previous = false;
      for (const row of rows) {
        const cut =
          row.bottom < wall.height &&
          row.bottom < opening.base + opening.height &&
          row.top > opening.base;
        if (cut !== previous) add(row.number);
        previous = cut;
      }
    }
  }
  return [...selected].sort((a, b) => a - b);
}
