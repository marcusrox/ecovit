import { bounds, type Project, type Wall } from "./project";

export type Diagnostic = {
  code: string;
  severity: "error" | "info";
  message: string;
  wallIds: string[];
  course: number;
  x: number;
  y: number;
};
export type JunctionChoice = {
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
  kind: "whole" | "half";
  wallIds: string[];
};
export type Component = {
  id: string;
  signature: string;
  wallIds: string[];
  x: number;
  y: number;
  junctions: { x: number; y: number; kind: "L" | "T" | "cross" }[];
  alternative: boolean;
  phase: 0 | 1;
};
export type Composition = {
  convention: "nominal-v1" | "nominal-v2" | "nominal-v3";
  courses: { number: number; bottom: number; top: number; pieces: Piece[] }[];
  components: Component[];
  diagnostics: Diagnostic[];
};
type Cell = { x: number; y: number; walls: Wall[] };
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
export const MAX_CELLS = 20000;
export const MAX_COURSES = 1000;
export const MAX_PIECES = 100000;
export const componentId = (ids: string[]) => [...ids].sort().join("|");
const signature = (walls: Wall[]) =>
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
// Legacy patterns retained solely to validate saved v1/v2 snapshots.
function pattern(
  cells: Cell[],
  adjacent: (c: Cell) => Cell[],
  phase: number,
  openU: boolean,
): Cell[][] | null {
  if (
    cells.every((c) => c.x === cells[0].x) ||
    cells.every((c) => c.y === cells[0].y)
  )
    return pack(cells, phase);
  const corners = cells.filter((c) => {
    const ns = adjacent(c);
    return ns.length === 2 && ns[0].x !== ns[1].x && ns[0].y !== ns[1].y;
  });
  const ends = cells.filter((c) => adjacent(c).length === 1);
  if (
    corners.length === 1 &&
    ends.length === 2 &&
    cells.every((c) => adjacent(c).length <= 2)
  ) {
    const c = corners[0];
    const horizontal = cells
      .filter((a) => a.y === c.y)
      .sort((a, b) => Math.abs(a.x - c.x) - Math.abs(b.x - c.x));
    const vertical = cells
      .filter((a) => a.x === c.x)
      .sort((a, b) => Math.abs(a.y - c.y) - Math.abs(b.y - c.y));
    if (
      horizontal.length < 2 ||
      vertical.length < 2 ||
      horizontal.length + vertical.length - 1 !== cells.length
    )
      return null;
    return phase
      ? [...pack(vertical, 0), ...pack(horizontal.slice(1), 0)]
      : [...pack(horizontal, 0), ...pack(vertical.slice(1), 0)];
  }
  if (
    openU &&
    corners.length === 2 &&
    ends.length === 2 &&
    cells.every((c) => adjacent(c).length <= 2)
  ) {
    const [a, b] = corners;
    const horizontal = a.y === b.y;
    if (!horizontal && a.x !== b.x) return null;
    const along = (c: Cell) => (horizontal ? c.x : c.y);
    const across = (c: Cell) => (horizontal ? c.y : c.x);
    const bridge = cells
      .filter((c) => across(c) === across(a))
      .sort((c, d) => along(c) - along(d));
    const legs = [a, b].map((corner) =>
      cells
        .filter((c) => along(c) === along(corner))
        .sort(
          (c, d) =>
            Math.abs(across(c) - across(corner)) -
            Math.abs(across(d) - across(corner)),
        ),
    );
    // Reserve a whole brick at each corner before filling the straight spans.
    // Three bridge cells would make the two horizontal reservations collide.
    if (
      bridge.length < 4 ||
      legs.some((leg) => leg.length < 2) ||
      bridge[0] !== a ||
      bridge.at(-1) !== b ||
      Math.sign(across(legs[0][1]) - across(a)) !==
        Math.sign(across(legs[1][1]) - across(b)) ||
      bridge.length + legs[0].length + legs[1].length - 2 !== cells.length
    )
      return null;
    return phase
      ? [
          ...pack(legs[0], 0),
          ...pack(bridge.slice(1, -1), 0),
          ...pack(legs[1], 0),
        ]
      : [
          [bridge[0], bridge[1]],
          ...pack(bridge.slice(2, -2), 0),
          [bridge.at(-2)!, bridge.at(-1)!],
          ...pack(legs[0].slice(1), 0),
          ...pack(legs[1].slice(1), 0),
        ];
  }
  if (corners.length === 4 && cells.every((c) => adjacent(c).length === 2)) {
    const xs = cells.map((c) => c.x),
      ys = cells.map((c) => c.y),
      minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minY = Math.min(...ys),
      maxY = Math.max(...ys);
    if (
      cells.some(
        (c) => c.x !== minX && c.x !== maxX && c.y !== minY && c.y !== maxY,
      ) ||
      cells.length !== 2 * (maxX - minX + maxY - minY)
    )
      return null;
    const route = [cells[0]],
      visited = new Set([cells[0]]);
    let prev: Cell | undefined;
    while (route.length < cells.length) {
      const cur = route.at(-1)!;
      const next = adjacent(cur)
        .filter((n) => n !== prev)
        .sort((a, b) => b.x - a.x || a.y - b.y)[0];
      if (!next || visited.has(next)) return null;
      prev = cur;
      route.push(next);
      visited.add(next);
    }
    const shifted = phase ? [...route.slice(1), route[0]] : route;
    return pack(shifted, 0);
  }
  return null;
}
function tile(
  cells: Cell[],
  phase: number,
  convention: Composition["convention"],
): Cell[][] | null {
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
    let p =
      convention === "nominal-v3"
        ? continuousPattern(group, adjacent, phase)
        : pattern(group, adjacent, phase, convention === "nominal-v2");
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
export function generate(
  doc: Project,
  convention: Composition["convention"] = "nominal-v3",
): Composition {
  const { width: m, height: h } = doc.project.base,
    floor = doc.model.floors[0];
  const result: Composition = {
    convention,
    courses: [],
    components: [],
    diagnostics: [],
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
      message,
      wallIds: [...wallIds].sort(),
      x,
      y,
      course,
      severity,
    });
  const total = Math.max(
    0,
    ...doc.model.walls
      .filter((w) => w.height % h === 0)
      .map((w) => w.height / h),
  );
  const estimated = doc.model.walls.reduce(
    (s, w) => s + (Math.abs(w.b.x - w.a.x) + Math.abs(w.b.y - w.a.y)) / m,
    0,
  );
  if (
    estimated > MAX_CELLS ||
    total > MAX_COURSES ||
    estimated * total > MAX_PIECES
  ) {
    error(
      "limit",
      "Limite de geração excedido (20 mil células, mil fiadas ou 100 mil células por todas as fiadas). O modelo foi preservado.",
      doc.model.walls.map((w) => w.id),
    );
    return result;
  }
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
      bottom: floor.start + (n - 1) * h - floor.level,
      top: floor.start + n * h - floor.level,
      pieces: [],
    });
  const usedChoices = new Set<string>();
  for (const cells of groups(map)) {
    const walls = [
      ...new Map(cells.flatMap((c) => c.walls).map((w) => [w.id, w])).values(),
    ];
    const ids = walls.map((w) => w.id).sort(),
      id = componentId(ids),
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
    for (const c of cells) {
      const ns = neighbors(c, map);
      const kind =
        ns.length === 4
          ? "cross"
          : ns.length === 3
            ? "T"
            : ns.length === 2 && ns[0].x !== ns[1].x && ns[0].y !== ns[1].y
              ? "L"
              : null;
      if (kind) comp.junctions.push({ x: c.x * m, y: c.y * m, kind });
    }
    result.components.push(comp);
    if (
      comp.junctions.length > 1 &&
      new Set(walls.map((w) => w.height)).size > 1
    ) {
      error(
        "unsupported",
        "Transição de alturas fora do padrão L simples suportado.",
        ids,
        comp.x,
        comp.y,
      );
      continue;
    }
    if (
      comp.junctions.some((j) => j.kind === "T") &&
      new Set(walls.map((w) => w.height)).size > 1
    ) {
      error(
        "unsupported",
        "Transição de alturas em T ainda sem solução automática.",
        ids,
        comp.x,
        comp.y,
      );
      continue;
    }
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
    const choice = doc.adjustments.junctions.find((a) => a.componentId === id);
    if (choice) {
      usedChoices.add(id);
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
    if (comp.junctions.some((j) => j.kind === "cross")) {
      const j = comp.junctions.find((j) => j.kind === "cross")!;
      error(
        "cross",
        "Sem solução automática para encontro em cruz no M2.",
        ids,
        j.x,
        j.y,
      );
      continue;
    }
    if (
      choice &&
      (choice.signature !== sig || !comp.junctions.some((j) => j.kind === "L"))
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
    const courses: Piece[][] = [];
    let failed = false;
    for (let n = 1; n <= total; n++) {
      const active = cells.filter((c) =>
        c.walls.some((w) => w.height >= n * h),
      );
      if (!active.length) {
        courses.push([]);
        continue;
      }
      const pieces = tile(active, ((n - 1) % 2) ^ comp.phase, convention);
      if (
        !pieces ||
        !tile(active, ((n - 1) % 2) ^ (1 - comp.phase), convention)
      ) {
        error(
          "unsupported",
          "Sem solução automática para esta combinação de encontros.",
          ids,
          comp.x,
          comp.y,
          n,
        );
        failed = true;
        break;
      }
      const covered = new Set<string>();
      for (const piece of pieces)
        for (const c of piece) {
          const k = key(c.x, c.y);
          if (covered.has(k)) throw new Error("Colisão interna na composição.");
          covered.add(k);
        }
      if (covered.size !== active.length)
        throw new Error("Lacuna interna na composição.");
      courses.push(
        pieces.map((cs) => {
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
    comp.alternative = comp.junctions.some((j) => j.kind === "L");
    courses.forEach((pieces, i) => result.courses[i].pieces.push(...pieces));
    if (comp.junctions.some((j) => j.kind === "T")) {
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
    if (!usedChoices.has(a.componentId))
      error(
        "adjustment",
        "Encontro alterado: retorne ao automático para resolver a escolha pendente.",
        a.wallIds.filter((id) => doc.model.walls.some((w) => w.id === id)),
      );
  return result;
}
