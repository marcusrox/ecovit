import { length, type Project } from "./project";

// Exact rectangle union in the longitudinal/vertical plane of one wall.
function openingArea(
  wall: Project["model"]["walls"][number],
  openings: Project["model"]["openings"],
) {
  const size = length(wall);
  const rects = openings
    .map((o) => ({
      left: Math.max(0, o.offset),
      right: Math.min(size, o.offset + o.width),
      bottom: Math.max(0, o.base),
      top: Math.min(wall.height, o.base + o.height),
    }))
    .filter((r) => r.right > r.left && r.top > r.bottom);
  const xs = [...new Set(rects.flatMap((r) => [r.left, r.right]))].sort(
    (a, b) => a - b,
  );
  let area = 0n;
  for (let i = 1; i < xs.length; i++) {
    const intervals = rects
      .filter((r) => r.left < xs[i] && r.right > xs[i - 1])
      .sort((a, b) => a.bottom - b.bottom);
    let bottom = 0,
      top = 0,
      covered = 0n;
    for (const r of intervals) {
      if (r.bottom > top) {
        covered += BigInt(top - bottom);
        bottom = r.bottom;
      }
      top = Math.max(top, r.top);
    }
    covered += BigInt(top - bottom);
    area += BigInt(xs[i] - xs[i - 1]) * covered;
  }
  return area;
}
export function wallBudgetAreas(doc: Project, busy = false) {
  if (busy)
    return {
      available: false as const,
      reason: "Cálculo ou operação em andamento. Aguarde.",
    };
  if (
    doc.generationState.status !== "current" ||
    doc.generated?.convention !== "nominal-v14"
  )
    return {
      available: false as const,
      reason:
        "Composição indisponível. Aguarde o recálculo ou tente recalcular o projeto.",
    };
  const diagnostics = doc.generated.diagnostics.filter(
    (d) => d.severity === "error" && d.code !== "clamp-pending",
  );
  const byWall = new Map<string, Project["model"]["openings"]>();
  for (const opening of doc.model.openings) {
    const list = byWall.get(opening.wallId) ?? [];
    list.push(opening);
    byWall.set(opening.wallId, list);
  }
  const floors = [...doc.model.floors]
    .sort((a, b) => a.level - b.level || a.id.localeCompare(b.id))
    .map((f) => {
      if (!doc.generated!.floors.some((r) => r.floorId === f.id))
        throw new Error("Resultado incompleto para os pavimentos do projeto.");
      let gross = 0n,
        openings = 0n;
      for (const wall of doc.model.walls.filter((w) => w.floorId === f.id)) {
        gross += BigInt(length(wall)) * BigInt(wall.height);
        openings += openingArea(wall, byWall.get(wall.id) ?? []);
      }
      return {
        id: f.id,
        name: f.name,
        level: f.level,
        partial: diagnostics.some((d) => d.floorId === f.id),
        gross,
        openings,
        net: gross - openings,
      };
    });
  const gross = floors.reduce((n, f) => n + f.gross, 0n),
    openings = floors.reduce((n, f) => n + f.openings, 0n),
    net = gross - openings;
  return {
    available: true as const,
    gross,
    openings,
    net,
    floors,
    partial: diagnostics.length > 0,
  };
}
