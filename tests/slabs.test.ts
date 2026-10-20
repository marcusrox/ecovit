import { describe, expect, it } from "vitest";
import {
  createProject,
  LIMIT,
  makeWall,
  type Point,
  type Slab,
} from "../src/domain/project";
import {
  validateRing,
  validateSlab,
  ringLocation,
  translateSlab,
  shiftSlabEdge,
  putSlab,
  removeSlabElement,
} from "../src/domain/slabs";
import {
  addFloor,
  duplicateFloor,
  editFloor,
  removeFloor,
  mergeFloorView,
} from "../src/domain/floors";
import { floorView, generate } from "../src/domain/composition";
import {
  importedCopy,
  parseFile,
  serializeFile,
  validateProject,
} from "../src/persistence/files";
const polygon = (coordinates: number[][], m = 1250): Point[] =>
  coordinates.map(([x, y]) => ({ x: x * m, y: y * m }));
const rectangle = (a: number, b: number, c: number, d: number, m = 1250) =>
  polygon(
    [
      [a, b],
      [c, b],
      [c, d],
      [a, d],
    ],
    m,
  );
function fixture(m = 1250) {
  const doc = createProject("Lajes M4.2", {
    length: 2 * m,
    width: m,
    height: 700,
  });
  const slab: Slab = {
    id: crypto.randomUUID(),
    floorId: doc.model.floors[0].id,
    thickness: 2100,
    contour: rectangle(0, 0, 16, 12, m),
    openings: [
      { id: crypto.randomUUID(), contour: rectangle(2, 2, 4, 4, m) },
      { id: crypto.randomUUID(), contour: rectangle(8, 6, 12, 9, m) },
    ],
  };
  return { doc, slab };
}
describe("CT-13 / EX-65–74", () => {
  it("revisão M4.2: anéis de união de células concordam com um oráculo independente de ocupação", () => {
    const key = (p: Point) => `${p.x},${p.y}`;
    let checked = 0;
    for (let mask = 1; mask < 512; mask++) {
      const boundary = new Map<string, [Point, Point]>();
      for (let bit = 0; bit < 9; bit++)
        if (mask & (1 << bit)) {
          const x = bit % 3,
            y = Math.floor(bit / 3),
            square = [
              { x, y },
              { x: x + 1, y },
              { x: x + 1, y: y + 1 },
              { x, y: y + 1 },
            ];
          for (let i = 0; i < 4; i++) {
            const a = square[i],
              b = square[(i + 1) % 4],
              reverse = `${key(b)}:${key(a)}`;
            if (boundary.has(reverse)) boundary.delete(reverse);
            else boundary.set(`${key(a)}:${key(b)}`, [a, b]);
          }
        }
      const outgoing = new Map<string, Point>();
      let ambiguous = false;
      for (const [a, b] of boundary.values()) {
        if (outgoing.has(key(a))) {
          ambiguous = true;
          break;
        }
        outgoing.set(key(a), b);
      }
      if (ambiguous) continue; // A corner shared by separate regions is not a simple ring.
      const start = boundary.values().next().value![0],
        ring: Point[] = [];
      let p = start;
      do {
        ring.push(p);
        p = outgoing.get(key(p))!;
      } while (key(p) !== key(start) && ring.length <= boundary.size);
      if (ring.length !== boundary.size) continue; // Disconnected boundaries or a hole.
      let simplified = true;
      while (simplified) {
        simplified = false;
        for (let i = 0; i < ring.length; i++) {
          const a = ring[(i + ring.length - 1) % ring.length],
            b = ring[i],
            c = ring[(i + 1) % ring.length];
          if ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y)) {
            ring.splice(i, 1);
            simplified = true;
            break;
          }
        }
      }
      const contour = ring.map((p) => ({ x: p.x * 1251, y: p.y * 1251 }));
      expect(() => validateRing(contour, 1251)).not.toThrow();
      for (let x = -1; x <= 3; x++)
        for (let y = -1; y <= 3; y++)
          expect(
            ringLocation(
              { x: (x + 0.5) * 1251, y: (y + 0.5) * 1251 },
              contour,
            ) === 1,
          ).toBe(
            x >= 0 && x < 3 && y >= 0 && y < 3 && !!(mask & (1 << (3 * y + x))),
          );
      checked++;
    }
    expect(checked).toBeGreaterThan(100);
  });
  it("revisão M4.2: alça não atravessa a aresta oposta nem inverte vizinhas", () => {
    const { slab } = fixture();
    const plain = { ...slab, openings: [] };
    for (const ring of [plain.contour, [...plain.contour].reverse()]) {
      const original = { ...plain, contour: ring };
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i],
          b = ring[(i + 1) % ring.length],
          vertical = a.x === b.x;
        const delta = vertical
          ? { x: a.x === 0 ? 21250 : -21250, y: 0 }
          : { x: 0, y: a.y === 0 ? 16250 : -16250 };
        expect(() => shiftSlabEdge(original, i, delta)).toThrow(
          /inverter|atravessar/,
        );
      }
    }
    const first = slab.openings[0];
    expect(() => shiftSlabEdge(slab, 1, { x: -3750, y: 0 }, first.id)).toThrow(
      /inverter|atravessar/,
    );
    expect(slab.openings[0]).toEqual(first);
  });
  it("EX-65/66 área material por amostragem independente na malha", () => {
    const { slab } = fixture();
    const count = (s: Slab) => {
      let total = 0;
      for (let x = 0; x < 16; x++)
        for (let y = 0; y < 12; y++) {
          const p = { x: (x + 0.5) * 1250, y: (y + 0.5) * 1250 };
          if (
            ringLocation(p, s.contour) === 1 &&
            s.openings.every((o) => ringLocation(p, o.contour) === -1)
          )
            total++;
        }
      return total;
    };
    expect(count(slab)).toBe(176);
    expect(
      count({
        ...slab,
        contour: polygon([
          [0, 0],
          [12, 0],
          [12, 4],
          [6, 4],
          [6, 10],
          [0, 10],
        ]),
        openings: [{ id: crypto.randomUUID(), contour: rectangle(1, 5, 4, 8) }],
      }),
    ).toBe(75);
  });
  it("EX-74 quatro lajes com propriedade e vazios próprios sobrevivem ao transporte", () => {
    const { doc, slab } = fixture();
    let d = putSlab(doc, slab);
    for (const level of [-2100, 28000, 35000]) {
      d = addFloor(d, { name: String(level), level, defaultHeight: 28000 });
      const id = d.model.floors.find((f) => f.level === level)!.id;
      d = putSlab(d, {
        ...structuredClone(slab),
        id: crypto.randomUUID(),
        floorId: id,
        openings: slab.openings.map((o) => ({ ...o, id: crypto.randomUUID() })),
      });
    }
    expect(d.model.slabs).toHaveLength(4);
    expect(parseFile(serializeFile(d).text).model).toEqual(d.model);
    const without = removeFloor(d, slab.floorId);
    expect(without.model.slabs).toHaveLength(3);
    expect(without.model.slabs.map((s) => s.id)).toEqual(
      d.model.slabs.filter((s) => s.id !== slab.id).map((s) => s.id),
    );
  });
  it.each([1250, 1500, 1400, 1251])(
    "EX-65/66 malha %i, sentidos, rotação e reflexão",
    (m) => {
      const { slab } = fixture(m);
      for (const transform of [
        (p: Point) => p,
        (p: Point) => ({ x: -p.y, y: p.x }),
        (p: Point) => ({ x: -p.x - 3 * m, y: p.y - 5 * m }),
      ]) {
        for (const reverse of [false, true]) {
          const ring = (points: Point[]) => {
            const r = points.map(transform);
            return reverse ? [...r.slice(2), ...r.slice(0, 2)].reverse() : r;
          };
          const variant = {
            ...slab,
            contour: ring(slab.contour),
            openings: slab.openings.map((o) => ({
              ...o,
              contour: ring(o.contour),
            })),
          };
          expect(() => validateSlab(variant, m, 0)).not.toThrow();
          expect(
            ringLocation(
              transform({ x: 3 * m, y: 3 * m }),
              variant.openings[0].contour,
            ),
          ).toBe(1);
          expect(
            ringLocation(transform({ x: 6 * m, y: 3 * m }), variant.contour),
          ).toBe(1);
        }
      }
      const concave = {
        ...slab,
        contour: polygon(
          [
            [0, 0],
            [12, 0],
            [12, 4],
            [6, 4],
            [6, 10],
            [0, 10],
          ],
          m,
        ),
        openings: [
          { id: crypto.randomUUID(), contour: rectangle(1, 5, 4, 8, m) },
        ],
      };
      expect(() => validateSlab(concave, m, 0)).not.toThrow();
      expect(ringLocation({ x: 6 * m, y: 6 * m }, concave.contour)).toBe(0);
      expect(() =>
        validateSlab(
          {
            ...concave,
            openings: [
              { id: crypto.randomUUID(), contour: rectangle(7, 5, 9, 7, m) },
            ],
          },
          m,
          0,
        ),
      ).toThrow("estritamente");
    },
  );
  it.each([
    [0, 2, 2, 4],
    [-1, 2, 2, 4],
    [15, 2, 17, 4],
  ])("EX-67 abertura fora/tocando %j", (...coords) => {
    const { slab } = fixture();
    slab.openings = [
      {
        id: crypto.randomUUID(),
        contour: rectangle(...(coords as [number, number, number, number])),
      },
    ];
    expect(() => validateSlab(slab, 1250, 0)).toThrow("estritamente");
  });
  it.each([
    [5, 2, 7, 4],
    [5, 5, 7, 7],
    [4, 4, 7, 7],
    [3, 3, 4, 4],
    [2, 2, 5, 5],
  ])("EX-68 contatos, sobreposição e contenção %j", (...coords) => {
    const { slab } = fixture();
    slab.openings = [
      { id: crypto.randomUUID(), contour: rectangle(2, 2, 5, 5) },
      {
        id: crypto.randomUUID(),
        contour: rectangle(...(coords as [number, number, number, number])),
      },
    ];
    expect(() => validateSlab(slab, 1250, 0)).toThrow("Aberturas");
    expect(() =>
      validateSlab(
        { ...slab, openings: [...slab.openings].reverse() },
        1250,
        0,
      ),
    ).toThrow("Aberturas");
  });
  it("EX-69/70 recusa diagonal, repetição, zero, colinearidade, cruzamento e aresta que atravessa U", () => {
    for (const coordinates of [
      [
        [0, 0],
        [4, 0],
        [4, 4],
        [1, 3],
      ],
      [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 0],
      ],
      [
        [0, 0],
        [0, 0],
        [4, 4],
        [0, 4],
      ],
      [
        [0, 0],
        [2, 0],
        [4, 0],
        [4, 4],
        [0, 4],
      ],
      [
        [0, 0],
        [6, 0],
        [6, 6],
        [2, 6],
        [2, -2],
        [4, -2],
        [4, 4],
        [0, 4],
      ],
    ])
      expect(() => validateRing(polygon(coordinates), 1250)).toThrow();
    expect(() =>
      validateRing([{ x: 1, y: 0 }, ...rectangle(0, 0, 4, 4).slice(1)], 1250),
    ).toThrow("malha");
    expect(() => validateRing(rectangle(0, 0, 1, 1), 1250)).not.toThrow();
    const { slab } = fixture();
    slab.contour = polygon([
      [0, 0],
      [10, 0],
      [10, 10],
      [7, 10],
      [7, 3],
      [3, 3],
      [3, 10],
      [0, 10],
    ]);
    slab.openings = [
      { id: crypto.randomUUID(), contour: rectangle(2, 5, 8, 7) },
    ];
    expect(
      slab.openings[0].contour.every(
        (p) => ringLocation(p, slab.contour) === 1,
      ),
    ).toBe(true);
    expect(() => validateSlab(slab, 1250, 0)).toThrow("estritamente");
  });
  it("EX-71 edição atômica conserva original, transporta vazios e recusa colapso/invasão", () => {
    const { doc, slab } = fixture(),
      before = structuredClone(slab);
    const moved = translateSlab(slab, { x: -3750, y: 2500 });
    expect(moved.openings[0].contour[0]).toEqual({ x: -1250, y: 5000 });
    expect(() => putSlab(doc, moved)).not.toThrow();
    expect(() =>
      putSlab(doc, shiftSlabEdge(slab, 1, { x: -6250, y: 0 })),
    ).toThrow("estritamente");
    expect(() =>
      putSlab(
        doc,
        shiftSlabEdge(slab, 3, { x: 2500, y: 0 }, slab.openings[0].id),
      ),
    ).toThrow();
    const openingMoved = translateSlab(
      slab,
      { x: 1250, y: 1250 },
      slab.openings[0].id,
    );
    expect(openingMoved.contour).toEqual(slab.contour);
    expect(openingMoved.openings[1]).toEqual(slab.openings[1]);
    expect(slab).toEqual(before);
  });
  it("EX-72/74 cópia/cota/remoção, histórico de intenção e isolamento da view", () => {
    const { doc, slab } = fixture();
    const origin = putSlab(doc, slab);
    const copied = duplicateFloor(origin, slab.floorId, 28000, "Superior"),
      copy = copied.model.slabs[1];
    expect(copy.contour).toEqual(slab.contour);
    expect(copy.thickness).toBe(2100);
    expect(copy.id).not.toBe(slab.id);
    expect(copy.openings[0].id).not.toBe(slab.openings[0].id);
    const changed = editFloor(copied, copy.floorId, { level: -2100 });
    expect(changed.model.slabs.find((s) => s.id === copy.id)).toEqual(copy);
    expect(validateProject(changed).schemaVersion).toBe(17);
    expect(removeFloor(copied, copy.floorId).model.slabs).toEqual([slab]);
    const local = floorView(copied, copy.floorId);
    expect(local.model.slabs).toEqual([copy]);
    expect(
      mergeFloorView(copied, removeSlabElement(local, copy.openings[0].id))
        .model.slabs[0],
    ).toEqual(slab);
    expect(() =>
      editFloor(origin, slab.floorId, { level: -99999900 }),
    ).toThrow();
    expect(() =>
      duplicateFloor(origin, slab.floorId, -99999900, "Baixo"),
    ).toThrow();
    expect(() => putSlab(origin, { ...slab, thickness: 0 })).toThrow();
    expect(() => putSlab(origin, { ...slab, thickness: 1401 })).not.toThrow();
    expect(() =>
      validateRing(
        rectangle(-100000000, -100000000, 100000000, 100000000, 1),
        1,
      ),
    ).not.toThrow();
    expect(() =>
      putSlab(origin, translateSlab(slab, { x: LIMIT, y: 0 })),
    ).toThrow();
  });
  it("EX-73 laje não altera composição nominal nem paredes/ajustes", () => {
    const { doc, slab } = fixture();
    doc.model.walls = [
      makeWall(
        { x: 0, y: 0 },
        { x: 10000, y: 0 },
        1250,
        slab.floorId,
        2100,
        1,
      )!,
    ];
    const expected = generate(doc);
    expect(generate(putSlab(doc, slab))).toEqual(expected);
    expect(doc.model.slabs).toEqual([]);
  });
  it("EX-74 transporte confere laje independentemente do snapshot e rejeita referências/versões", () => {
    const { doc, slab } = fixture();
    let d = putSlab(doc, slab);
    d = {
      ...d,
      generated: generate(d),
      generationState: { status: "current", diagnostics: [] },
    };
    const parsed = parseFile(serializeFile(d).text);
    expect(parsed).toEqual(d);
    const copy = importedCopy(parsed);
    expect(copy.model).toEqual(d.model);
    expect(copy.project.id).not.toBe(d.project.id);
    for (const invalid of [
      { ...slab, floorId: crypto.randomUUID() },
      { ...slab, thickness: -1 },
      {
        ...slab,
        openings: [{ ...slab.openings[0], contour: rectangle(0, 2, 2, 4) }],
      },
      { ...slab, openings: [{ ...slab.openings[0], id: slab.id }] },
    ])
      expect(() =>
        validateProject({ ...d, model: { ...d.model, slabs: [invalid] } }),
      ).toThrow();
    expect(() =>
      validateProject({
        ...d,
        model: {
          ...d.model,
          slabs: [slab, { ...slab, id: crypto.randomUUID() }],
        },
      }),
    ).toThrow();
    expect(() => validateProject({ ...d, schemaVersion: 8 })).toThrow(
      "incompatível",
    );
    expect(() =>
      putSlab(
        addFloor(d, { name: "Novo", level: 28000, defaultHeight: 28000 }),
        { ...slab, id: crypto.randomUUID() },
      ),
    ).toThrow("já tem");
  });
});
