import { bounds, type EditableProject as Project, type Wall } from "./project";
import { openingBox, openingIssue } from "./openings";
import { applyChannels, type ChannelBand } from "./channels";
import { applyGrout, type GroutAxis } from "./grout";
export type Diagnostic = {
  floorId?: string;
  code: string;
  severity: "error" | "info";
  message: string;
  wallIds: string[];
  course: number;
  x: number;
  y: number;
  openingIds?: string[];
  lastCourse?: number;
  category?: "input" | "geometry" | "limit";
  levelIds?: string[];
  adjustmentIds?: string[];
};
export type JunctionChoice = {
  floorId: string;
  id: string;
  anchor: {
    x: number;
    y: number;
  };
  binding: "active" | "pending";
  componentId: string;
  signature: string;
  wallIds: string[];
  phase: 0 | 1;
};
export type Piece = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: "whole" | "half" | "channel" | "half-channel";
  origins?: string[];
  wallIds: string[];
};
export type Component = {
  id: string;
  signature: string;
  wallIds: string[];
  x: number;
  y: number;
  junctions: {
    x: number;
    y: number;
    kind: "L" | "T" | "cross";
  }[];
  alternative: boolean;
  phase: 0 | 1;
};
export type Composition = {
  convention: "nominal-v10";
  channels?: ChannelBand[];
  grouts?: GroutAxis[];
  courses: {
    number: number;
    bottom: number;
    top: number;
    pieces: Piece[];
  }[];
  components: Component[];
  diagnostics: Diagnostic[];
};
type Cell = {
  x: number;
  y: number;
  walls: Wall[];
};
const key = (x: number, y: number) => `${x},${y}`;
const sort = (a: Cell, b: Cell) => a.y - b.y || a.x - b.x;
const neighbors = (c: Cell, map: Map<string, Cell>) =>
  [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ]
    .map(([x, y]) => map.get(key(c.x + x, c.y + y)))
    .filter((c): c is Cell => !!c);
const activeCells = (cells: Cell[], height: number): Cell[] =>
  cells
    .map((c) => ({ ...c, walls: c.walls.filter((w) => w.height > height) }))
    .filter((c) => c.walls.length);
function junctions(cells: Cell[]): Component["junctions"] {
  const map = new Map(cells.map((c) => [key(c.x, c.y), c]));
  return cells.flatMap((c) => {
    const ns = neighbors(c, map);
    const kind =
      ns.length === 4
        ? "cross"
        : ns.length === 3
          ? "T"
          : ns.length === 2 && ns[0].x !== ns[1].x && ns[0].y !== ns[1].y
            ? "L"
            : null;
    return kind ? [{ x: c.x, y: c.y, kind }] : [];
  });
}
export const componentId = (ids: string[]) => [...ids].sort().join("|");
export const signature = (walls: Wall[]) =>
  JSON.stringify(
    [...walls]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((w) => [
        w.id,
        Math.min(w.a.x, w.b.x),
        Math.min(w.a.y, w.b.y),
        Math.max(w.a.x, w.b.x),
        Math.max(w.a.y, w.b.y),
        w.side,
      ]),
  );
function groups(
  map: Map<string, Cell>,
  adjacent = (c: Cell) => neighbors(c, map),
) {
  const seen = new Set<string>(),
    result: Cell[][] = [];
  for (const start of [...map.values()].sort(sort)) {
    if (seen.has(key(start.x, start.y))) continue;
    const group: Cell[] = [start];
    seen.add(key(start.x, start.y));
    for (let i = 0; i < group.length; i++)
      for (const c of adjacent(group[i]))
        if (!seen.has(key(c.x, c.y))) {
          seen.add(key(c.x, c.y));
          group.push(c);
        }
    result.push(group.sort(sort));
  }
  return result;
}
function pack(cells: Cell[], phase: number): Cell[][] {
  const result: Cell[][] = [];
  let i = 0;
  if (phase && cells.length) result.push([cells[i++]]);
  while (i + 1 < cells.length) result.push([cells[i++], cells[i++]]);
  if (i < cells.length) result.push([cells[i]]);
  return result;
}
// Pair consecutive cells along a non-branching path or cycle. Corners inherit
// parity from the route; a pair always occupies two orthogonally adjacent cells.
function continuousPattern(
  cells: Cell[],
  adjacent: (c: Cell) => Cell[],
  phase: number,
): Cell[][] | null {
  if (cells.length === 1) return [[cells[0]]];
  const ends = cells.filter((c) => adjacent(c).length === 1);
  if (
    cells.some((c) => adjacent(c).length < 1 || adjacent(c).length > 2) ||
    (ends.length !== 0 && ends.length !== 2)
  )
    return null;
  const closed = ends.length === 0;
  const route = [closed ? cells[0] : ends[0]];
  const visited = new Set(route);
  while (route.length < cells.length) {
    const next = adjacent(route.at(-1)!)
      .filter((c) => !visited.has(c))
      .sort((a, b) => b.x - a.x || a.y - b.y)[0];
    if (!next) return null;
    route.push(next);
    visited.add(next);
  }
  if (closed) {
    if (route.length % 2 || !adjacent(route.at(-1)!).includes(route[0]))
      return null;
    return pack(phase ? [...route.slice(1), route[0]] : route, 0);
  }
  const firstCorner = cells.find((c) => {
    const ns = adjacent(c);
    return ns.length === 2 && ns[0].x !== ns[1].x && ns[0].y !== ns[1].y;
  });
  if (!firstCorner) return pack(route, phase);
  const index = route.indexOf(firstCorner);
  // Anchor A horizontally only at the first geometric corner. Other corners
  // follow the route, rather than receiving independent orientation mandates.
  const offset = (index % 2) ^ (route[index + 1].y === firstCorner.y ? 0 : 1);
  return pack(route, offset ^ phase);
}
function tile(cells: Cell[], phase: number): Cell[][] | null {
  const map = new Map(cells.map((c) => [key(c.x, c.y), c]));
  const cuts = new Set<string>();
  const edge = (a: Cell, b: Cell) =>
    [key(a.x, a.y), key(b.x, b.y)].sort().join(":");
  for (const c of cells) {
    const ns = neighbors(c, map);
    if (ns.length === 4) return null;
    if (ns.length === 3) {
      const horizontal = ns.filter((n) => n.y === c.y);
      const stem =
        horizontal.length === 2
          ? ns.find((n) => n.x === c.x)!
          : ns.find((n) => n.y === c.y)!;
      cuts.add(edge(c, stem));
    }
  }
  const adjacent = (c: Cell) =>
    neighbors(c, map).filter((n) => !cuts.has(edge(c, n)));
  const result: Cell[][] = [];
  for (const group of groups(map, adjacent)) {
    let p = continuousPattern(group, adjacent, phase);
    // A T branch is paginated from its contact, including reversed branches.
    if (
      group.every((c) => c.x === group[0].x) ||
      group.every((c) => c.y === group[0].y)
    ) {
      const contacts = group.filter((c) =>
        neighbors(c, map).some(
          (n) => cuts.has(edge(c, n)) && neighbors(n, map).length === 3,
        ),
      );
      if (contacts.length === 1 && contacts[0] === group.at(-1))
        p = pack([...group].reverse(), phase);
    }
    if (!p) return null;
    result.push(...p);
  }
  return result;
}
// CT-12: change route connections, never masonry occupancy. Continuity at
// every junction is reserved before cutting branches, so adjacent demands
// cannot silently override one another.
function tileCross(
  cells: Cell[],
  phase: number,
): {
  pieces: Cell[][] | null;
  conflict?: Cell;
} {
  const map = new Map(cells.map((c) => [key(c.x, c.y), c])),
    cuts = new Set<string>(),
    keep = new Set<string>();
  const edge = (a: Cell, b: Cell) =>
    [key(a.x, a.y), key(b.x, b.y)].sort().join(":");
  for (const c of cells) {
    const ns = neighbors(c, map);
    if (ns.length < 3) continue;
    const horizontal =
      ns.length === 4
        ? phase === 0
        : ns.filter((n) => n.y === c.y).length === 2;
    for (const n of ns) {
      if (horizontal ? n.y === c.y : n.x === c.x) keep.add(edge(c, n));
      else cuts.add(edge(c, n));
    }
  }
  for (const c of cells)
    if (
      neighbors(c, map).some(
        (n) => cuts.has(edge(c, n)) && keep.has(edge(c, n)),
      )
    )
      return { pieces: null, conflict: c };
  const adjacent = (c: Cell) =>
      neighbors(c, map).filter((n) => !cuts.has(edge(c, n))),
    result: Cell[][] = [];
  for (const group of groups(map, adjacent)) {
    let pieces = continuousPattern(group, adjacent, phase);
    if (
      group.every((c) => c.x === group[0].x) ||
      group.every((c) => c.y === group[0].y)
    ) {
      const contacts = group.filter((c) =>
        neighbors(c, map).some(
          (n) => cuts.has(edge(c, n)) && neighbors(n, map).length >= 3,
        ),
      );
      if (contacts.length === 1 && contacts[0] === group.at(-1))
        pieces = pack([...group].reverse(), phase);
    }
    if (!pieces) return { pieces: null };
    result.push(...pieces);
  }
  return { pieces: result };
}
function composeFloor(doc: Project): Composition {
  const { width: m, height: h } = doc.project.base,
    floor = doc.model.floors[0];
  const result: Composition = {
    convention: "nominal-v10",
    courses: [],
    components: [],
    diagnostics: [],
    ...{ channels: [] },
    ...{ grouts: [] },
  };
  const error = (
    code: string,
    message: string,
    wallIds: string[],
    x = 0,
    y = 0,
    course = 1,
    severity: "error" | "info" = "error",
  ) =>
    result.diagnostics.push({
      code,
      message:
        severity === "error"
          ? `Composição suspensa em ${new Set(wallIds).size} paredes conectadas: ${message}`
          : message,
      wallIds: [...wallIds].sort(),
      x,
      y,
      course,
      severity,
      ...{
        category:
          code === "limit"
            ? ("limit" as const)
            : code === "height"
              ? ("input" as const)
              : ("geometry" as const),
      },
    });
  const total = Math.max(
    0,
    ...doc.model.walls
      .filter((w) => w.height % h === 0)
      .map((w) => w.height / h),
  );
  const map = new Map<string, Cell>();
  for (const w of doc.model.walls) {
    const b = bounds(w, m);
    for (let y = b.y / m; y < (b.y + b.height) / m; y++)
      for (let x = b.x / m; x < (b.x + b.width) / m; x++) {
        const k = key(x, y),
          c = map.get(k) ?? { x, y, walls: [] };
        c.walls.push(w);
        map.set(k, c);
      }
  }
  for (let n = 1; n <= total; n++)
    result.courses.push({
      number: n,
      bottom: floor.level + (n - 1) * h - floor.level,
      top: floor.level + n * h - floor.level,
      pieces: [],
    });
  const usedChoices = new Set<string>();
  for (const cells of groups(map)) {
    const walls = [
      ...new Map(cells.flatMap((c) => c.walls).map((w) => [w.id, w])).values(),
    ];
    const ids = walls.map((w) => w.id).sort(),
      id = `${floor.id}:${componentId(ids)}`,
      sig = signature(walls);
    const comp: Component = {
      id,
      signature: sig,
      wallIds: ids,
      x: cells[0].x * m,
      y: cells[0].y * m,
      junctions: [],
      alternative: false,
      phase: 0,
    };
    const seenJunctions = new Set<string>();
    for (const height of [0, ...new Set(walls.map((w) => w.height))].sort(
      (a, b) => a - b,
    )) {
      for (const j of junctions(activeCells(cells, height))) {
        const id = `${key(j.x, j.y)}:${j.kind}`;
        if (seenJunctions.has(id)) continue;
        seenJunctions.add(id);
        comp.junctions.push({ x: j.x * m, y: j.y * m, kind: j.kind });
      }
    }
    result.components.push(comp);
    const hasCross = comp.junctions.some((j) => j.kind === "cross");
    if (
      !comp.junctions.length &&
      cells.some(
        (c) =>
          c.walls.some((w) => w.a.y === w.b.y) &&
          c.walls.some((w) => w.a.x === w.b.x),
      )
    ) {
      error(
        "unsupported",
        "O padrão L exige dois módulos em cada ramo, incluindo o canto.",
        ids,
        comp.x,
        comp.y,
      );
      continue;
    }
    const related = doc.adjustments.junctions.filter((a) =>
      a.wallIds.some((w) => ids.includes(w)),
    );
    if (
      related.some((a) => a.binding === "pending") ||
      related.filter((a) => a.componentId === id).length > 1
    ) {
      for (const a of related) {
        usedChoices.add(a.id!);
        error(
          "adjustment",
          "Escolha de encontro pendente. Descarte o ajuste ou escolha novamente na primeira fiada.",
          ids,
          a.anchor?.x ?? comp.x,
          a.anchor?.y ?? comp.y,
        );
        result.diagnostics.at(-1)!.adjustmentIds = [a.id!];
      }
      continue;
    }
    const choice = doc.adjustments.junctions.find((a) => a.componentId === id);
    if (choice) {
      usedChoices.add(choice.id!);
      comp.phase = choice.phase;
    }
    if (walls.some((w) => w.height % h)) {
      error(
        "height",
        "Altura incompatível com as fiadas. Escolha um múltiplo da altura-base.",
        ids,
        comp.x,
        comp.y,
      );
      continue;
    }
    if (
      cells.some(
        (c) =>
          c.walls.filter((w) => w.a.y === w.b.y).length > 1 ||
          c.walls.filter((w) => w.a.x === w.b.x).length > 1,
      )
    ) {
      error(
        "overlap",
        "Paredes colineares sobrepostas. Ajuste o desenho.",
        ids,
        comp.x,
        comp.y,
      );
      continue;
    }
    if (
      choice &&
      (choice.signature !== sig ||
        !comp.junctions.some((j) => j.kind === "L" || j.kind === "cross"))
    ) {
      error(
        "adjustment",
        "A escolha do encontro não é mais aplicável. Retorne ao automático ou escolha novamente.",
        ids,
        comp.x,
        comp.y,
      );
      continue;
    }
    const openings = doc.model.openings
      .filter((o) => ids.includes(o.wallId))
      .sort((a, b) => a.id.localeCompare(b.id));
    let invalidOpening = false;
    for (const o of openings) {
      const wall = walls.find((w) => w.id === o.wallId)!;
      const box = openingBox(o, wall, m);
      const issue =
        openingIssue(doc, o) ??
        (cells.some(
          (c) =>
            c.walls.filter((w) => floor.level + w.height > floor.level + o.base)
              .length > 1 &&
            c.x * m >= box.x &&
            c.x * m < box.x + box.width &&
            c.y * m >= box.y &&
            c.y * m < box.y + box.height,
        )
          ? {
              code: "opening-at-junction",
              message:
                "Vão invade células compartilhadas de um encontro. O conjunto fica sem peças até corrigir o vão.",
            }
          : null);
      if (issue) invalidOpening = true;
      if (!issue) continue;
      error(
        issue?.code ?? "opening-elements-pending",
        issue?.message ??
          "Elementos sobre e sob vãos ainda não calculados nesta entrega.",
        issue ? ids : [wall.id],
        box.x,
        box.y,
        Math.max(1, Math.floor((floor.level + o.base - floor.level) / h) + 1),
        issue ? "error" : "info",
      );
      Object.assign(result.diagnostics.at(-1)!, {
        openingIds: [o.id],
        lastCourse: Math.max(
          1,
          Math.ceil((floor.level + o.base + o.height - floor.level) / h),
        ),
        category: issue ? "geometry" : "limit",
      });
    }
    if (invalidOpening) continue;
    const courses: Piece[][] = [];
    let failed = false;
    for (let n = 1; n <= total; n++) {
      const active = activeCells(cells, (n - 1) * h);
      if (!active.length) {
        courses.push([]);
        continue;
      }
      const phase = ((n - 1) % 2) ^ comp.phase;
      const activeCross = junctions(active).some((j) => j.kind === "cross");
      const current: ReturnType<typeof tileCross> = activeCross
        ? tileCross(active, phase)
        : { pieces: tile(active, phase) };
      const other: ReturnType<typeof tileCross> = activeCross
        ? tileCross(active, 1 - phase)
        : { pieces: tile(active, 1 - phase) };
      const pieces = current.pieces;
      if (!pieces || !other.pieces) {
        error(
          current.conflict || other.conflict
            ? "junction-reservation-conflict"
            : "unsupported",
          current.conflict || other.conflict
            ? "Encontros próximos exigem continuidade e contato incompatíveis na mesma conexão."
            : "Sem solução automática para esta combinação de encontros.",
          ids,
          (current.conflict ?? other.conflict)?.x !== undefined
            ? (current.conflict ?? other.conflict)!.x * m
            : comp.x,
          (current.conflict ?? other.conflict)?.y !== undefined
            ? (current.conflict ?? other.conflict)!.y * m
            : comp.y,
          n,
        );
        failed = true;
        break;
      }
      const removed = new Set<string>();
      for (const o of openings) {
        const bottom = floor.level + (n - 1) * h,
          B = floor.level + o.base;
        if (bottom >= B + o.height || bottom + h <= B) continue;
        const b = openingBox(
          o,
          walls.find((w) => w.id === o.wallId)!,
          m,
        );
        for (let y = b.y / m; y < (b.y + b.height) / m; y++)
          for (let x = b.x / m; x < (b.x + b.width) / m; x++)
            removed.add(key(x, y));
      }
      const isRemoved = (c: Cell) => removed.has(key(c.x, c.y));
      const remaining = pieces
        .map((cs) => cs.filter((c) => !isRemoved(c)))
        .filter((cs) => cs.length);
      const covered = new Set<string>();
      for (const piece of remaining)
        for (const c of piece) {
          const k = key(c.x, c.y);
          if (covered.has(k)) throw new Error("Colisão interna na composição.");
          covered.add(k);
        }
      if (covered.size !== active.filter((c) => !isRemoved(c)).length)
        throw new Error("Lacuna interna na composição.");
      courses.push(
        remaining.map((cs) => {
          const x = Math.min(...cs.map((c) => c.x)) * m,
            y = Math.min(...cs.map((c) => c.y)) * m,
            width = Math.max(...cs.map((c) => c.x)) * m - x + m,
            height = Math.max(...cs.map((c) => c.y)) * m - y + m;
          return {
            id: `${n}:${x}:${y}:${width}:${height}`,
            x,
            y,
            width,
            height,
            kind: cs.length === 2 ? "whole" : "half",
            wallIds: [
              ...new Set(
                cs.flatMap((c) =>
                  c.walls.filter((w) => w.height >= n * h).map((w) => w.id),
                ),
              ),
            ].sort(),
          };
        }),
      );
    }
    if (failed) continue;
    comp.alternative = comp.junctions.some(
      (j) => j.kind === "L" || j.kind === "cross",
    );
    courses.forEach((pieces, i) => result.courses[i].pieces.push(...pieces));
    if (hasCross) {
      const j = comp.junctions.find((j) => j.kind === "cross")!;
      error(
        "cross-connection",
        "Composição nominal; ligação entre paredes não dimensionada.",
        ids,
        j.x,
        j.y,
        1,
        "info",
      );
    } else if (comp.junctions.some((j) => j.kind === "T")) {
      const j = comp.junctions.find((j) => j.kind === "T")!;
      error(
        "connection",
        "Composição geométrica resolvida; ligação complementar necessária.",
        ids,
        j.x,
        j.y,
        1,
        "info",
      );
    }
    if (cells.length === 1)
      error(
        "single",
        "Trecho de um módulo: somente meio tijolo, sem alternativa de amarração.",
        ids,
        comp.x,
        comp.y,
        1,
        "info",
      );
  }
  for (const a of doc.adjustments.junctions)
    if (!usedChoices.has(a.id!)) {
      error(
        "adjustment",
        "Encontro alterado: retorne ao automático para resolver a escolha pendente.",
        a.wallIds.filter((id) => doc.model.walls.some((w) => w.id === id)),
        a.anchor?.x ?? 0,
        a.anchor?.y ?? 0,
      );
      result.diagnostics.at(-1)!.adjustmentIds = [a.id!];
    }
  applyChannels(doc, result);
  return applyGrout(doc, result);
}
export type FloorComposition = Omit<Composition, "convention"> & {
  floorId: string;
};
export type ProjectComposition = {
  convention: "nominal-v10";
  floors: FloorComposition[];
  diagnostics: Diagnostic[];
};
export function floorView(
  doc: Project,
  floorId: string,
): import("./project").LocalProject {
  const floor = doc.model.floors.find((f) => f.id === floorId);
  if (!floor) throw new Error("Pavimento ausente.");
  const walls = doc.model.walls.filter((w) => w.floorId === floorId);
  const wallIds = new Set(walls.map((w) => w.id));
  const generated =
    doc.generated && "floors" in doc.generated
      ? (() => {
          const f = doc.generated.floors.find((f) => f.floorId === floorId);
          return f ? { ...f, convention: "nominal-v10" as const } : null;
        })()
      : doc.generated;
  return {
    ...doc,
    viewFloorId: floorId,
    model: {
      ...doc.model,
      floors: [floor],
      walls,
      openings: doc.model.openings.filter((o) => wallIds.has(o.wallId)),
      slabs: doc.model.slabs.filter((s) => s.floorId === floorId),
      measurements: doc.model.measurements.filter((m) => m.floorId === floorId),
      referenceImages: doc.model.referenceImages.filter(
        (m) => m.floorId === floorId,
      ),
    },
    adjustments: {
      junctions: doc.adjustments.junctions.filter((a) => a.floorId === floorId),
      channels: doc.adjustments.channels.filter((a) => a.floorId === floorId),
      grout: doc.adjustments.grout.filter((a) => a.floorId === floorId),
    },
    generated,
  };
}
export function generateFloor(
  doc: Project,
  floorId = doc.model.floors[0].id,
): Composition & {
  floorId: string;
} {
  const local = floorView(doc, floorId);
  const result = composeFloor(local);
  for (const row of result.courses)
    for (const p of row.pieces) p.id = `${floorId}:${p.id}`;
  for (const b of result.channels ?? []) b.id = `${floorId}:${b.id}`;
  for (const a of result.grouts ?? []) a.id = `${floorId}:${a.id}`;
  for (const d of result.diagnostics) d.floorId = floorId;
  return { ...result, floorId };
}
export function generate(doc: Project): ProjectComposition {
  const floors = [...doc.model.floors]
    .sort((a, b) => a.level - b.level)
    .map((f) => {
      const result = generateFloor(doc, f.id);
      return {
        floorId: result.floorId,
        courses: result.courses,
        components: result.components,
        channels: result.channels,
        grouts: result.grouts,
        diagnostics: result.diagnostics,
      };
    });
  return {
    convention: "nominal-v10",
    floors,
    diagnostics: floors.flatMap((f) => f.diagnostics),
  };
}
