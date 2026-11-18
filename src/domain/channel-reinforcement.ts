import { bounds, LIMIT, type EditableProject, type Point } from "./project";
import type { Composition } from "./composition";
import { isChannel } from "./channels";

export type ChannelReinforcementSettings = {
  enabled: boolean;
  count: number;
  diameter: number;
};
export type ChannelReinforcement = {
  id: string;
  course: number;
  top: number;
  a: Point;
  b: Point;
  count: number;
  diameter: number;
  wallIds: string[];
  origins: string[];
};
export const defaultChannelReinforcement =
  (): ChannelReinforcementSettings => ({
    enabled: false,
    count: 2,
    diameter: 80,
  });
export function validateChannelReinforcement(
  settings: ChannelReinforcementSettings,
) {
  if (typeof settings.enabled !== "boolean")
    throw new Error("Ativação da armadura inválida.");
  if (!Number.isSafeInteger(settings.count) || settings.count <= 0)
    throw new Error(
      "Informe uma quantidade inteira positiva de barras, dentro da representação numérica segura.",
    );
  if (
    !Number.isSafeInteger(settings.diameter) ||
    settings.diameter <= 0 ||
    settings.diameter > LIMIT
  )
    throw new Error(
      "Informe diâmetro positivo na precisão de 0,1 mm, dentro do limite do editor.",
    );
}
export function parseChannelReinforcement(
  enabled: boolean,
  count: string,
  diameter: string,
): ChannelReinforcementSettings {
  const mm = diameter.trim().replace(",", ".");
  if (!/^\d+$/.test(count.trim()))
    throw new Error("Use uma quantidade inteira positiva de barras.");
  if (!/^\d+(?:\.\d)?$/.test(mm))
    throw new Error("Use diâmetro em mm com até uma casa decimal (0,1 mm).");
  const [whole, fraction = "0"] = mm.split(".");
  const result = {
    enabled,
    count: Number(count),
    diameter: Number(whole) * 10 + Number(fraction),
  };
  validateChannelReinforcement(result);
  return result;
}

export function applyChannelReinforcement(
  doc: EditableProject,
  result: Composition,
): Composition {
  result.reinforcement = [];
  const settings = doc.model.floors[0].channelReinforcement;
  if (!settings?.enabled) return result;
  validateChannelReinforcement(settings);
  const m = doc.project.base.width;
  const walls = new Map(doc.model.walls.map((w) => [w.id, w]));
  const finalCells = new Map<number, Set<string>>();
  for (const row of result.courses) {
    const cells = new Set<string>();
    for (const p of row.pieces)
      if (isChannel(p))
        for (let y = p.y; y < p.y + p.height; y += m)
          for (let x = p.x; x < p.x + p.width; x += m) cells.add(`${x}:${y}`);
    finalCells.set(row.number, cells);
  }
  type Interval = {
    from: number;
    to: number;
    wallId: string;
    origins: string[];
  };
  type Run = {
    course: number;
    top: number;
    horizontal: boolean;
    coordinate: number;
    intervals: Interval[];
  };
  const runs = new Map<string, Run>();
  for (const band of result.channels ?? []) {
    const wall = walls.get(band.wallId);
    if (!wall) continue;
    const b = bounds(wall, m),
      horizontal = wall.a.y === wall.b.y;
    const coordinate = horizontal ? b.y : b.x;
    const key = `${band.course}:${horizontal ? "h" : "v"}:${coordinate}`;
    const run = runs.get(key) ?? {
      course: band.course,
      top: band.top,
      horizontal,
      coordinate,
      intervals: [],
    };
    for (const cell of band.cells) {
      if (!finalCells.get(band.course)?.has(`${cell.x}:${cell.y}`)) continue;
      const from = horizontal ? cell.x : cell.y;
      run.intervals.push({
        from,
        to: from + m,
        wallId: wall.id,
        origins: cell.origins,
      });
    }
    runs.set(key, run);
  }
  for (const run of [...runs.values()].sort(
    (a, b) =>
      a.course - b.course ||
      Number(b.horizontal) - Number(a.horizontal) ||
      a.coordinate - b.coordinate,
  )) {
    const intervals = run.intervals.sort(
      (a, b) => a.from - b.from || a.to - b.to,
    );
    let merged:
      | { from: number; to: number; wallIds: Set<string>; origins: Set<string> }
      | undefined;
    const finish = () => {
      if (!merged) return;
      const { from, to, wallIds, origins } = merged;
      result.reinforcement!.push({
        id: `${run.course}:${run.horizontal ? "h" : "v"}:${run.coordinate}:${from}:${to}`,
        course: run.course,
        top: run.top,
        a: run.horizontal
          ? { x: from, y: run.coordinate }
          : { x: run.coordinate, y: from },
        b: run.horizontal
          ? { x: to, y: run.coordinate }
          : { x: run.coordinate, y: to },
        count: settings.count,
        diameter: settings.diameter,
        wallIds: [...wallIds].sort(),
        origins: [...origins].sort(),
      });
    };
    for (const i of intervals) {
      if (!merged || i.from > merged.to) {
        finish();
        merged = {
          from: i.from,
          to: i.to,
          wallIds: new Set(),
          origins: new Set(),
        };
      }
      merged.to = Math.max(merged.to, i.to);
      merged.wallIds.add(i.wallId);
      for (const origin of i.origins) merged.origins.add(origin);
    }
    finish();
  }
  return result;
}
