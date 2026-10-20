import type {
  Composition,
  ProjectComposition,
  Diagnostic,
  JunctionChoice,
} from "./composition";
export type Point = { x: number; y: number };
export type CustomImageAsset = {
  id: string;
  name: string;
  mime: "image/png" | "image/jpeg";
  data: string;
  width: number;
  height: number;
};
export type ImageElement = {
  id: string;
  floorId: string;
  name: string;
  source:
    | { kind: "catalog"; itemId: string; revision: number }
    | { kind: "custom"; assetId: string };
  x: number;
  y: number;
  width: number;
  depth: number;
  angle: number;
  flipX?: boolean;
  flipY?: boolean;
};
export type ReferenceImage = {
  floorId: string;
  name: string;
  mime: "image/png" | "image/jpeg";
  data: string;
  width: number;
  height: number;
  x: number;
  y: number;
  scale: number;
  angle: number;
  opacity: number;
  visible: boolean;
};
export type Measurement = {
  id: string;
  floorId: string;
  a: Point;
  b: Point;
  offset?: number;
};
export type Terrain = {
  id: string;
  contour: Point[];
  material: "grass" | "earth" | "sand" | "gravel" | "pavers";
  revision: 1;
  textureOrigin: Point;
};
export type SlabOpening = { id: string; contour: Point[] };
export type Slab = {
  id: string;
  floorId: string;
  thickness: number;
  contour: Point[];
  openings: SlabOpening[];
};
export type Base = { length: number; width: number; height: number };
export type Wall = {
  id: string;
  floorId: string;
  a: Point;
  b: Point;
  side: 1 | -1;
  height: number;
};
export type OpeningAppearance = {
  type: "swing" | "double-swing" | "sliding" | "center-sliding" | "tilt";
  orientation: 0 | 1 | 2 | 3;
};
export type Opening = {
  id: string;
  wallId: string;
  kind: "door" | "window" | "opening";
  appearance?: OpeningAppearance;
  offset: number;
  width: number;
  base: number;
  height: number;
};
export type OpeningSettings = { base: number; top: number };
export type ChannelLevel = { id: string; top: number };
export type ChannelSuppression = {
  floorId: string;
  id: string;
  wallId: string;
  top: number;
  scope?: { kind: "wall" } | { kind: "range"; from: number; to: number };
};
export type GroutSettings = {
  junctions: boolean;
  openings: boolean;
  ends: boolean;
  intervals: boolean;
  distance: number;
};
export type GroutAdjustment = Point & {
  floorId: string;
  id: string;
  wallIds: string[];
  action: "include" | "exclude";
};
export const defaultGroutSettings = (enabled = true): GroutSettings => ({
  junctions: enabled,
  openings: enabled,
  ends: enabled,
  intervals: enabled,
  distance: 10000,
});
export const defaultChannelLevels = (): ChannelLevel[] =>
  [11200, 22400].map((top) => ({ id: crypto.randomUUID(), top }));
export type Tool =
  | "select"
  | "wall"
  | "slab"
  | "measure"
  | "furniture"
  | "terrain"
  | Opening["kind"];
export type Project = {
  format: "ecovit";
  schemaVersion: 17;
  project: {
    id: string;
    name: string;
    units: "0.1mm";
    base: Base;
    initialWallHeight?: number;
    origin: Point;
    openingSettings: OpeningSettings;
    channelLevels: ChannelLevel[];
    groutSettings: GroutSettings;
  };
  model: {
    terrain: Terrain | null;
    floors: {
      id: string;
      name: string;
      level: number;
      defaultHeight: number;
    }[];
    walls: Wall[];
    openings: Opening[];
    slabs: Slab[];
    measurements: Measurement[];
    referenceImages: ReferenceImage[];
    imageElements: ImageElement[];
    customImageAssets: CustomImageAsset[];
  };
  adjustments: {
    junctions: JunctionChoice[];
    grout: GroutAdjustment[];
    channels: ChannelSuppression[];
  };
  generated: ProjectComposition | null;
  generationState: {
    status: "outdated" | "current";
    diagnostics: Diagnostic[];
  };
  metadata: { createdAt: string; updatedAt: string; appVersion: string };
};
// Bounds protect serialization, arithmetic and canvas rendering; they are not construction rules.
export const LIMIT = 100_000_000;
export function cm(value: string | number): number {
  const raw =
    typeof value === "number" ? String(value) : value.trim().replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(raw))
    throw new Error(
      "Use uma medida em cm com precisão de até 0,01 cm (0,1 mm).",
    );
  const n = Math.round(Number(raw) * 100);
  if (!Number.isSafeInteger(n) || Math.abs(n) > LIMIT)
    throw new Error("Medida fora do limite do editor.");
  return n;
}
export const display = (n: number) =>
  (n / 100).toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
    useGrouping: false,
  });
export function validateBase(base: Base) {
  if (
    Object.values(base).some(
      (n) => !Number.isSafeInteger(n) || n <= 0 || n > LIMIT,
    )
  )
    throw new Error(
      "As medidas do tijolo devem ser positivas e representáveis em 0,1 mm.",
    );
  if (base.length !== base.width * 2)
    throw new Error("O comprimento deve ser o dobro da largura.");
}
export function createProject(
  name: string,
  base: Base,
  defaultHeight = 28000,
): Project {
  validateBase(base);
  if (
    !Number.isSafeInteger(defaultHeight) ||
    defaultHeight <= 0 ||
    defaultHeight > LIMIT ||
    defaultHeight % base.height
  )
    throw new Error(
      "Escolha uma altura inicial de paredes compatível com a altura do tijolo.",
    );
  if (!name.trim() || name.trim().length > 100)
    throw new Error("Informe um nome com até 100 caracteres.");
  const now = new Date().toISOString();
  return {
    format: "ecovit",
    schemaVersion: 17,
    project: {
      id: crypto.randomUUID(),
      name: name.trim(),
      units: "0.1mm",
      base,
      initialWallHeight: defaultHeight,
      origin: { x: 0, y: 0 },
      openingSettings: { base: 11200, top: 21700 },
      channelLevels: defaultChannelLevels(),
      groutSettings: defaultGroutSettings(),
    },
    model: {
      terrain: null,
      floors: [
        {
          id: crypto.randomUUID(),
          name: "Térreo",
          level: 0,
          defaultHeight,
        },
      ],
      walls: [],
      openings: [],
      slabs: [],
      measurements: [],
      referenceImages: [],
      imageElements: [],
      customImageAssets: [],
    },
    adjustments: { junctions: [], grout: [], channels: [] },
    generated: null,
    generationState: { status: "outdated", diagnostics: [] },
    metadata: { createdAt: now, updatedAt: now, appVersion: "0.16.0" },
  };
}
export const snap = (n: number, module: number) =>
  Math.round(n / module) * module;
export const snapPoint = (p: Point, module: number): Point => ({
  x: snap(p.x, module),
  y: snap(p.y, module),
});
export const length = (w: Wall) =>
  Math.abs(w.b.x - w.a.x) + Math.abs(w.b.y - w.a.y);
export function makeWall(
  a: Point,
  cursor: Point,
  module: number,
  floorId: string,
  height: number,
  side: 1 | -1,
  id: string = crypto.randomUUID(),
): Wall | null {
  const start = snapPoint(a, module),
    end = snapPoint(cursor, module);
  if (Math.abs(end.x - start.x) >= Math.abs(end.y - start.y)) end.y = start.y;
  else end.x = start.x;
  if (end.x === start.x && end.y === start.y) return null;
  return { id, floorId, a: start, b: end, height, side };
}
export function resizeWall(
  w: Wall,
  end: "a" | "b",
  p: Point,
  module: number,
): Wall {
  const axis = w.a.y === w.b.y ? "x" : "y";
  const point = { ...w[end], [axis]: snap(p[axis], module) };
  const result = { ...w, [end]: point };
  if (
    Math.sign(result.b[axis] - result.a[axis]) !==
      Math.sign(w.b[axis] - w.a[axis]) ||
    length(result) < module
  )
    throw new Error(
      "Mantenha ao menos um módulo sem cruzar a extremidade fixa.",
    );
  return result;
}
export function resizeLength(
  w: Wall,
  end: "a" | "b",
  size: number,
  module: number,
): Wall {
  if (size < module || size % module !== 0)
    throw new Error("Escolha um comprimento modular.");
  const axis = w.a.y === w.b.y ? "x" : "y",
    fixed = end === "a" ? w.b : w.a;
  const direction = Math.sign(w.b[axis] - w.a[axis]) * (end === "a" ? -1 : 1);
  return resizeWall(
    w,
    end,
    { ...fixed, [axis]: fixed[axis] + direction * size },
    module,
  );
}
export function bounds(w: Wall, thickness: number) {
  const horizontal = w.a.y === w.b.y;
  return {
    x: Math.min(w.a.x, w.b.x) + (!horizontal && w.side === -1 ? -thickness : 0),
    y: Math.min(w.a.y, w.b.y) + (horizontal && w.side === -1 ? -thickness : 0),
    width: horizontal ? length(w) : thickness,
    height: horizontal ? thickness : length(w),
  };
}
export function hitWalls(
  walls: Wall[],
  p: Point,
  thickness: number,
  tolerance: number,
): Wall[] {
  return walls
    .filter((w) => {
      const b = bounds(w, thickness);
      return (
        p.x >= b.x - tolerance &&
        p.x <= b.x + b.width + tolerance &&
        p.y >= b.y - tolerance &&
        p.y <= b.y + b.height + tolerance
      );
    })
    .reverse();
}
export function connection(
  p: Point,
  walls: Wall[],
  module: number,
  tolerance: number,
): Point | null {
  let best: Point | null = null,
    distance = tolerance;
  for (const w of walls) {
    const candidate =
      w.a.y === w.b.y
        ? {
            x: snap(
              Math.max(
                Math.min(w.a.x, w.b.x),
                Math.min(Math.max(w.a.x, w.b.x), p.x),
              ),
              module,
            ),
            y: w.a.y,
          }
        : {
            x: w.a.x,
            y: snap(
              Math.max(
                Math.min(w.a.y, w.b.y),
                Math.min(Math.max(w.a.y, w.b.y), p.y),
              ),
              module,
            ),
          };
    const d = Math.hypot(p.x - candidate.x, p.y - candidate.y);
    if (d <= distance) {
      best = candidate;
      distance = d;
    }
  }
  return best;
}
// A floor view is transient; persistence accepts only the complete Project.
export type LocalProject = Omit<Project, "generated"> & {
  viewFloorId: string;
  generated: Composition | null;
};
export type EditableProject = Project | LocalProject;
export type History = { past: Project[]; future: Project[] };
export const remember = (h: History, doc: Project): History => ({
  past: [...h.past, withoutResult(doc)].slice(-50),
  future: [],
});
export function travel(
  h: History,
  current: Project,
  redo = false,
): { history: History; doc: Project } | null {
  const stack = redo ? h.future : h.past,
    doc = stack.at(-1);
  if (!doc) return null;
  return {
    doc,
    history: redo
      ? {
          past: [...h.past, withoutResult(current)].slice(-50),
          future: h.future.slice(0, -1),
        }
      : {
          past: h.past.slice(0, -1),
          future: [...h.future, withoutResult(current)],
        },
  };
}

export const withoutResult = (doc: Project): Project => ({
  ...doc,
  generated: null,
  generationState: { status: "outdated", diagnostics: [] },
});
