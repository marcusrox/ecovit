import { expect, it } from "vitest";
import {
  createProject,
  makeWall,
  defaultGroutSettings,
  type Project,
} from "../src/domain/project";
import { generate, type Piece } from "../src/domain/composition";
import { addFloor, duplicateFloor, removeFloor } from "../src/domain/floors";
import {
  quantities,
  parseLossPercent,
  estimateLosses,
} from "../src/domain/quantities";
import { parseFile, serializeFile } from "../src/persistence/files";

function fixture(m = 1250, h = 700) {
  const d = createProject(
    "EX-86",
    { length: 2 * m, width: m, height: h },
    3 * h,
  );
  d.project.channelLevels = [];
  d.project.groutSettings = defaultGroutSettings(false);
  d.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      { x: 8 * m, y: 0 },
      m,
      d.model.floors[0].id,
      3 * h,
      1,
    )!,
  ];
  return d;
}
function calculated(d: Project) {
  d.generated = generate(d);
  d.generationState = {
    status: "current",
    diagnostics: d.generated.diagnostics,
  };
  return d;
}
function available(d: Project) {
  const r = quantities(d);
  if (!r.available) throw Error(r.reason);
  return r;
}
const vector = (whole: number, half: number, channel = 0, halfChannel = 0) => ({
  whole,
  half,
  channel,
  "half-channel": halfChannel,
  total: whole + half + channel + halfChannel,
});
it.each([
  [1250, 700],
  [1500, 700],
  [1400, 600],
  [1251, 700],
])("EX-86: contagens literais, módulo %i e altura %i", (m, h) => {
  const d = calculated(fixture(m, h)),
    before = structuredClone(d),
    r = available(d);
  expect(r.counts).toEqual(vector(11, 2));
  expect(r.floors[0].courses.map((c) => c.counts)).toEqual([
    vector(4, 0),
    vector(3, 2),
    vector(4, 0),
  ]);
  expect(d).toEqual(before);
  d.model.walls[0].a = { x: -3 * m, y: -2 * m };
  d.model.walls[0].b = { x: -3 * m, y: 6 * m };
  expect(available(calculated(d)).counts).toEqual(vector(11, 2));
});
it("EX-87: contorno/T/cruz contado uma vez por peça, sem somar paredes", () => {
  const d = fixture(),
    m = 1250;
  d.model.walls = [];
  for (const [ax, ay, bx, by] of [
    [0, 0, 16, 0],
    [0, 11, 16, 11],
    [0, 0, 0, 12],
    [15, 0, 15, 12],
    [8, 1, 8, 8],
    [1, 4, 13, 4],
  ])
    d.model.walls.push(
      makeWall(
        { x: ax * m, y: ay * m },
        { x: bx * m, y: by * m },
        m,
        d.model.floors[0].id,
        2100,
        1,
      )!,
    );
  const r = available(calculated(d));
  expect(r.counts).toEqual(vector(101, 8));
  expect(r.floors[0].courses.map((c) => c.counts)).toEqual([
    vector(34, 2),
    vector(33, 4),
    vector(34, 2),
  ]);
  expect(r.partial).toBe(false);
});
it("EX-88/91: somente peças finais, origens/associações não multiplicam", () => {
  const d = calculated(fixture());
  const pieces = (v: number[]) =>
    v.flatMap((n, i) =>
      Array.from(
        { length: n },
        (_, j) =>
          ({
            id: `${i}:${j}`,
            x: j * 1250,
            y: 0,
            width: 1250,
            height: 1250,
            kind: (["whole", "half", "channel", "half-channel"] as const)[i],
            origins: ["a", "b"],
            wallIds: [d.model.walls[0].id, d.model.walls[0].id],
          }) satisfies Piece,
      ),
    );
  d.generated!.floors[0].courses = d.generated!.floors[0].courses.slice(0, 2);
  d.generated!.floors[0].courses[0].pieces = pieces([1, 2, 3, 1]);
  d.generated!.floors[0].courses[1].pieces = pieces([2, 0, 1, 2]);
  expect(available(d).counts).toEqual(vector(3, 2, 4, 3));
  d.generated!.floors[0].courses = d.generated!.floors[0].courses.slice(0, 1);
  d.generated!.floors[0].courses[0].pieces = pieces([0, 1, 0, 1]);
  expect(available(d).counts).toEqual(vector(0, 1, 0, 1));
});
it("EX-89: quatro pavimentos, vazios/laje, cópia/remoção e mesmo nome", () => {
  let d = fixture();
  d = duplicateFloor(d, d.model.floors[0].id, -2100, "Mesmo");
  d = addFloor(d, { name: "Mesmo", level: 28000, defaultHeight: 2100 });
  d = addFloor(d, { name: "Mesmo", level: 35000, defaultHeight: 2100 });
  d.model.slabs = [
    {
      id: crypto.randomUUID(),
      floorId: d.model.floors[3].id,
      thickness: 2100,
      contour: [
        { x: 0, y: 0 },
        { x: 5000, y: 0 },
        { x: 5000, y: 5000 },
        { x: 0, y: 5000 },
      ],
      openings: [],
    },
  ];
  const r = available(calculated(d));
  expect(r.counts).toEqual(vector(22, 4));
  expect(r.floors.map((f) => f.level)).toEqual([-2100, 0, 28000, 35000]);
  expect(r.floors.slice(2).map((f) => [f.counts, f.courses])).toEqual([
    [vector(0, 0), []],
    [vector(0, 0), []],
  ]);
  expect(
    available(calculated(removeFloor(d, d.model.floors[0].id))).counts,
  ).toEqual(vector(11, 2));
});
it("EX-90: parcial real por erro, info não parcial, ausente/outdated/busy indisponíveis", () => {
  const d = fixture(),
    f = d.model.floors[0].id;
  d.model.walls.push(
    makeWall({ x: 20000, y: 0 }, { x: 30000, y: 0 }, 1250, f, 2100, 1)!,
  );
  d.model.walls.push({ ...d.model.walls[1], id: crypto.randomUUID() });
  const r = available(calculated(d));
  expect(r.partial).toBe(true);
  expect(r.floors[0].partial).toBe(true);
  expect(r.counts).toEqual(vector(11, 2));
  d.generated!.diagnostics = d.generated!.diagnostics.map((e) => ({
    ...e,
    severity: "info",
  }));
  expect(available(d).partial).toBe(false);
  expect(quantities(d, true).available).toBe(false);
  d.generationState.status = "outdated";
  expect(quantities(d).available).toBe(false);
  d.generationState.status = "current";
  d.generated = null;
  expect(quantities(d).available).toBe(false);
});
it.each([
  "",
  "-1",
  "1.234",
  "NaN",
  "Infinity",
  "1e2",
  "9999999999999999999999",
])("EX-92: percentual inválido %s", (text) =>
  expect(() => parseLossPercent(text)).toThrow(),
);
it("EX-92: perdas exatas, só sobre projeto por tipo e saída segura", () => {
  expect(parseLossPercent("2,50")).toBe(250);
  expect(parseLossPercent("2.5")).toBe(250);
  expect(estimateLosses(vector(11, 2), 1000)).toEqual({
    estimated: vector(13, 3),
    added: vector(2, 1),
  });
  expect(estimateLosses(vector(11, 2), 0).estimated).toEqual(vector(11, 2));
  expect(estimateLosses(vector(10, 0), 1000).estimated).toEqual(vector(11, 0));
  expect(estimateLosses(vector(10000, 0), 1).estimated).toEqual(
    vector(10001, 0),
  );
  expect(estimateLosses(vector(0, 2), 1000).estimated).toEqual(vector(0, 3));
  expect(
    estimateLosses(vector(0, 0), Number.MAX_SAFE_INTEGER).estimated,
  ).toEqual(vector(0, 0));
  expect(() => estimateLosses(vector(Number.MAX_SAFE_INTEGER, 0), 1)).toThrow();
});
it("EX-94: edição/round trip/nominal-v9 preservam intenção e contagem atual", () => {
  const d = calculated(fixture()),
    before = structuredClone(d);
  const text = serializeFile(d).text;
  expect(available(parseFile(text)).counts).toEqual(vector(11, 2));
  const old = JSON.parse(text);
  old.generated.convention = "nominal-v9";
  const loaded = parseFile(JSON.stringify(old));
  expect(quantities(loaded).available).toBe(false);
  expect(loaded.model).toEqual(d.model);
  expect(available(calculated(loaded)).counts).toEqual(vector(11, 2));
  estimateLosses(available(d).counts, parseLossPercent("10"));
  expect(d).toEqual(before);
  d.model.walls[0].height = 700;
  expect(available(calculated(d)).counts).toEqual(vector(4, 0));
  expect(JSON.parse(serializeFile(d).text).project).not.toHaveProperty(
    "lossPercent",
  );
});

it("EX-26/88: integração de canaleta compartilhada entre vãos empilhados", () => {
  const d = fixture(),
    f = d.model.floors[0].id;
  d.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 40000, y: 0 }, 1250, f, 28000, 1)!,
  ];
  d.model.openings = [
    {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "door",
      offset: 10000,
      width: 10000,
      base: 0,
      height: 10500,
    },
    {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "window",
      offset: 10000,
      width: 10000,
      base: 11200,
      height: 9800,
    },
  ];
  const r = available(calculated(d));
  expect(r.floors[0].courses[15].counts).toEqual(vector(10, 2, 5, 0));
  expect(
    d
      .generated!.floors[0].channels!.find((b) => b.course === 16)!
      .cells.every((c) => c.origins.length === 2),
  ).toBe(true);
});

it("revisão M5: perdas por quatro tipos, sem arredondar só o total nem perder precisão", () => {
  expect(estimateLosses(vector(1, 1, 1, 1), 100)).toEqual({
    estimated: vector(2, 2, 2, 2),
    added: vector(1, 1, 1, 1),
  });
  expect(estimateLosses(vector(11, 2), parseLossPercent("2,50"))).toEqual({
    estimated: vector(12, 3),
    added: vector(1, 1),
  });
  const q = Number.MAX_SAFE_INTEGER;
  expect(estimateLosses(vector(q, 0), 0).estimated).toEqual(vector(q, 0));
  expect(() =>
    estimateLosses(vector(Math.floor(q / 2), Math.floor(q / 2)), 1),
  ).toThrow("segura");
});
