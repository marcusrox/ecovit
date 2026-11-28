import { bounds, LIMIT, type EditableProject, type Point } from "./project";
import type { Composition } from "./composition";
import { groutId } from "./grout";
import { openingBox, openingIssue } from "./openings";

export type ClampSchedule =
  | { mode: "list"; courses: number[] }
  | { mode: "interval"; first: number; every: number; last: number };
export type ClampSettings = {
  enabled: boolean;
  diameter: number;
  length: number;
  schedule: ClampSchedule;
};
export type Clamp = {
  id: string;
  course: number;
  top: number;
  a: Point;
  b: Point;
  diameter: number;
  length: number;
  leg: number;
  origins: string[];
  wallIds: string[];
  pending?: string;
};
export const defaultClampSettings = (module: number): ClampSettings => ({
  enabled: false,
  diameter: 63,
  length: module + 2000,
  schedule: { mode: "list", courses: [] },
});
export function validateClampSettings(
  settings: ClampSettings,
  module: number,
  height: number,
) {
  if (
    ![settings.diameter, settings.length].every(
      (n) => Number.isSafeInteger(n) && n > 0 && n <= LIMIT,
    )
  )
    throw new Error(
      "Diâmetro e comprimento devem ser positivos, na precisão de 0,1 mm.",
    );
  if (settings.length <= module || (settings.length - module) % 2)
    throw new Error(
      "O total deve superar a distância entre furos e produzir duas pontas iguais na precisão de 0,1 mm.",
    );
  const schedule = settings.schedule;
  const valid = (n: number) =>
    Number.isSafeInteger(n) && n > 0 && n * height <= LIMIT;
  if (schedule.mode === "interval") {
    if (
      ![schedule.first, schedule.every, schedule.last].every(valid) ||
      schedule.first > schedule.last
    )
      throw new Error(
        "Informe primeira/última fiadas válidas e intervalo inteiro positivo.",
      );
  } else if (schedule.mode === "list") {
    if (
      !schedule.courses.every(valid) ||
      new Set(schedule.courses).size !== schedule.courses.length ||
      schedule.courses.some((n, i) => i > 0 && n <= schedule.courses[i - 1])
    )
      throw new Error(
        "A lista deve conter fiadas inteiras positivas, ordenadas e sem repetição.",
      );
    if (settings.enabled && !schedule.courses.length)
      throw new Error("Escolha as fiadas antes de ativar os grampos.");
  } else throw new Error("Escolha programação por intervalo ou lista.");
}
export function parseClampList(text: string): number[] {
  if (!text.trim()) return [];
  if (!/^\s*\d+(?:\s*,\s*\d+)*\s*$/.test(text))
    throw new Error("Use números inteiros de fiadas separados por vírgula.");
  const courses = [...new Set(text.split(",").map(Number))].sort(
    (a, b) => a - b,
  );
  if (courses.some((n) => !Number.isSafeInteger(n) || n <= 0))
    throw new Error("As fiadas devem ser inteiras e positivas.");
  return courses;
}
export function* clampCourses(schedule: ClampSchedule): Generator<number> {
  if (schedule.mode === "list") yield* schedule.courses;
  else
    for (let n = schedule.first; n <= schedule.last; n += schedule.every)
      yield n;
}
export function intervalFromList(courses: number[]): ClampSchedule {
  if (!courses.length)
    throw new Error("Defina a primeira fiada, o intervalo e a última fiada.");
  const every = courses.length > 1 ? courses[1] - courses[0] : 1;
  if (courses.some((n, i) => n !== courses[0] + i * every))
    throw new Error(
      "Lista irregular: defina um novo intervalo antes de aplicar.",
    );
  return { mode: "interval", first: courses[0], every, last: courses.at(-1)! };
}
export function clampCourseLimit(doc: EditableProject, floorId: string) {
  return doc.model.walls.reduce(
    (max, w) =>
      w.floorId === floorId
        ? Math.max(max, Math.floor(w.height / doc.project.base.height))
        : max,
    0,
  );
}

export function applyClamps(
  doc: EditableProject,
  result: Composition,
): Composition {
  result.clamps = [];
  const floor = doc.model.floors[0],
    settings = floor.clamps;
  if (!settings?.enabled) return result;
  const m = doc.project.base.width,
    h = doc.project.base.height;
  validateClampSettings(settings, m, h);
  const leg = (settings.length - m) / 2,
    limit = clampCourseLimit(doc, floor.id);
  const axes = new Map((result.grouts ?? []).map((a) => [groutId(a), a]));
  const pieces = new Map<string, Clamp>();
  // Only valid openings can dispense a connection. Invalid geometry keeps its
  // existing diagnostics and composition checks.
  const openings = doc.model.openings.flatMap((opening) => {
    const wall = doc.model.walls.find((w) => w.id === opening.wallId);
    if (
      !wall ||
      wall.floorId !== floor.id ||
      openingIssue(doc, opening) ||
      result.diagnostics.some(
        (d) => d.severity === "error" && d.openingIds?.includes(opening.id),
      )
    )
      return [];
    return [
      {
        box: openingBox(opening, wall, m),
        bottom: floor.level + opening.base,
        top: floor.level + opening.base + opening.height,
      },
    ];
  });
  const diagnostic = (
    course: number,
    p: Point,
    wallIds: string[],
    reason: string,
  ) => {
    result.diagnostics.push({
      code: "clamp-pending",
      severity: "info",
      category: "geometry",
      course,
      x: p.x,
      y: p.y,
      wallIds,
      message: `Grampo pendente na fiada ${course}: ${reason}`,
    });
  };
  for (const course of clampCourses(settings.schedule)) {
    if (course > limit) {
      diagnostic(
        course,
        { x: 0, y: 0 },
        [],
        "fiada fora da altura atual do pavimento; programação preservada.",
      );
      continue;
    }
    const row = result.courses[course - 1];
    const top = floor.level + course * h;
    for (const comp of result.components) {
      const walls = doc.model.walls.filter(
        (w) => comp.wallIds.includes(w.id) && w.height >= course * h,
      );
      const at = (p: Point) =>
        walls.some((w) => {
          const b = bounds(w, m);
          return (
            p.x >= b.x &&
            p.x < b.x + b.width &&
            p.y >= b.y &&
            p.y < b.y + b.height
          );
        });
      const centers = new Map(comp.junctions.map((j) => [groutId(j), j]));
      for (const center of centers.values()) {
        if (!at(center)) continue;
        const neighbors = [
          [m, 0],
          [-m, 0],
          [0, m],
          [0, -m],
        ]
          .map(([dx, dy]) => ({ x: center.x + dx, y: center.y + dy }))
          .filter(at);
        const kind =
          neighbors.length === 4
            ? "cross"
            : neighbors.length === 3
              ? "T"
              : neighbors.length === 2 &&
                  neighbors[0].x !== neighbors[1].x &&
                  neighbors[0].y !== neighbors[1].y
                ? "L"
                : null;
        if (!kind) continue;
        const targets =
          floor.groutMode === "reinforced"
            ? neighbors
            : kind === "T"
              ? neighbors.filter(
                  (p) =>
                    !neighbors.some(
                      (q) =>
                        q.x === 2 * center.x - p.x &&
                        q.y === 2 * center.y - p.y,
                    ),
                )
              : [];
        for (const b of targets) {
          const a = { x: center.x, y: center.y };
          const pair = [groutId(a), groutId(b)].sort();
          const id = `${course}:${pair.join("|")}`;
          const origin = `junction:${kind}:${groutId(center)}`;
          const old = pieces.get(id);
          if (old) {
            old.origins = [...new Set([...old.origins, origin])].sort();
            continue;
          }
          const wallIds = walls.map((w) => w.id).sort();
          let pending: string | undefined;
          if (
            !row?.pieces.some((p) =>
              p.wallIds.some((id) => comp.wallIds.includes(id)),
            )
          )
            pending = "composição do encontro indisponível.";
          else if (
            openings.some(
              (opening) =>
                opening.bottom < top &&
                opening.top > top - leg &&
                [a, b].some(
                  (p) =>
                    p.x >= opening.box.x &&
                    p.x < opening.box.x + opening.box.width &&
                    p.y >= opening.box.y &&
                    p.y < opening.box.y + opening.box.height,
                ),
            )
          )
            continue;
          else if (![a, b].every((p) => axes.has(groutId(p))))
            pending = "um dos furos previstos não está grauteado.";
          else if (
            ![a, b].every((p) =>
              axes
                .get(groutId(p))!
                .intervals.some((i) => i.bottom <= top - leg && i.top >= top),
            )
          )
            pending =
              "as duas pontas precisam de intervalo contínuo de graute e alvenaria em toda a descida.";
          const clamp: Clamp = {
            id,
            course,
            top,
            a,
            b,
            diameter: settings.diameter,
            length: settings.length,
            leg,
            wallIds,
            origins: [origin],
            ...(pending ? { pending } : {}),
          };
          pieces.set(id, clamp);
          if (pending) diagnostic(course, a, wallIds, pending);
        }
      }
    }
  }
  result.clamps = [...pieces.values()].sort(
    (a, b) =>
      a.course - b.course ||
      a.a.y - b.a.y ||
      a.a.x - b.a.x ||
      a.b.y - b.b.y ||
      a.b.x - b.b.x,
  );
  return result;
}
