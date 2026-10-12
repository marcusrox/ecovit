import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { generate } from "../src/domain/composition";
import {
  bounds,
  createProject,
  makeWall,
  type Project,
} from "../src/domain/project";
import { validateProject } from "../src/persistence/files";
const legacy = () =>
  JSON.parse(
    readFileSync(
      new URL("./fixtures/open-u-legacy.ecovit", import.meta.url),
      "utf8",
    ),
  ) as Project;
function verifyCoverage(d: Project) {
  const g = generate(d),
    m = d.project.base.width;
  for (const row of g.courses) {
    const expected = new Set<string>();
    for (const w of d.model.walls.filter(
      (w) => w.height >= row.number * d.project.base.height,
    )) {
      const b = bounds(w, m);
      for (let x = b.x; x < b.x + b.width; x += m)
        for (let y = b.y; y < b.y + b.height; y += m) expected.add(`${x},${y}`);
    }
    const actual = new Set<string>();
    for (const p of row.pieces) {
      expect([p.width, p.height].sort((a, b) => a - b)).toEqual(
        p.kind === "whole" ? [m, 2 * m] : [m, m],
      );
      for (let x = p.x; x < p.x + p.width; x += m)
        for (let y = p.y; y < p.y + p.height; y += m) {
          expect(actual.has(`${x},${y}`)).toBe(false);
          actual.add(`${x},${y}`);
        }
    }
    expect(actual).toEqual(expected);
  }
  return g;
}
describe("U aberto nominal", () => {
  it("migra v2 validada e rejeita peça v2 adulterada", () => {
    const old = JSON.parse(
      readFileSync(
        new URL("./fixtures/open-u-v2.ecovit", import.meta.url),
        "utf8",
      ),
    ) as Project;
    const d = validateProject(old);
    expect(d.generationState.status).toBe("outdated");
    expect(d.model).toEqual(old.model);
    expect(
      verifyCoverage(d)
        .courses[0].pieces.filter((p) => p.kind === "half")
        .map((p) => [p.x, p.y]),
    ).toEqual([[52500, 22500]]);
    old.generated!.courses[0].pieces[0].x += 1250;
    expect(() => validateProject(old)).toThrow("inconsistente");
  });
  it.each([false, true])(
    "percurso contínuo com vários cantos; fechado=%s",
    (closed) => {
      const d = createProject("Percurso", {
        length: 2500,
        width: 1250,
        height: 700,
      });
      const vertices = closed
        ? [
            [0, 0],
            [6, 0],
            [6, 3],
            [9, 3],
            [9, 7],
            [0, 7],
            [0, 0],
          ]
        : [
            [0, 0],
            [4, 0],
            [4, 4],
            [8, 4],
          ];
      for (let i = 1; i < vertices.length; i++) {
        const [a, b] = [vertices[i - 1], vertices[i]],
          horizontal = a[1] === b[1];
        const x = Math.min(a[0], b[0]),
          y = Math.min(a[1], b[1]);
        d.model.walls.push(
          makeWall(
            { x: x * 1250, y: y * 1250 },
            {
              x: (horizontal ? Math.max(a[0], b[0]) + 1 : x) * 1250,
              y: (horizontal ? y : Math.max(a[1], b[1]) + 1) * 1250,
            },
            1250,
            d.model.floors[0].id,
            2100,
            1,
          )!,
        );
      }
      const g = verifyCoverage(d);
      expect(g.diagnostics).toEqual([]);
      const corners = closed ? vertices.slice(0, -1) : vertices.slice(1, -1);
      for (const [x, y] of corners) {
        const pieces = g.courses
          .slice(0, 2)
          .map((row) =>
            row.pieces.find(
              (p) =>
                x * 1250 >= p.x &&
                x * 1250 < p.x + p.width &&
                y * 1250 >= p.y &&
                y * 1250 < p.y + p.height,
            )!,
          );
        expect(pieces.map((p) => p.kind)).toEqual(["whole", "whole"]);
        expect(pieces[0].width).not.toBe(pieces[1].width);
      }
      for (const row of g.courses)
        for (const p of row.pieces.filter((p) => p.kind === "half")) {
          expect(closed).toBe(false);
          expect([vertices[0].join(","), vertices.at(-1)!.join(",")]).toContain(
            [p.x / 1250, p.y / 1250].join(","),
          );
        }
    },
  );
  it("EX-19: posições independentes das duas fases", () => {
    const d = createProject("EX-19", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    for (const [a, b] of [
      [
        [0, 0],
        [5, 0],
      ],
      [
        [0, 1],
        [0, 3],
      ],
      [
        [4, 1],
        [4, 3],
      ],
    ]) {
      d.model.walls.push(
        makeWall(
          { x: a[0] * 1250, y: a[1] * 1250 },
          { x: b[0] * 1250, y: b[1] * 1250 },
          1250,
          d.model.floors[0].id,
          2100,
          1,
        )!,
      );
    }
    const g = verifyCoverage(d);
    const positions = (n: number) =>
      g.courses[n].pieces
        .map((p) =>
          [p.x / 1250, p.y / 1250, p.width / 1250, p.height / 1250].join(","),
        )
        .sort();
    expect(positions(0)).toEqual(
      ["0,0,2,1", "2,0,2,1", "4,0,1,2", "0,1,1,2", "4,2,1,1"].sort(),
    );
    expect(positions(1)).toEqual(
      ["0,0,1,2", "1,0,2,1", "3,0,2,1", "0,2,1,1", "4,1,1,2"].sort(),
    );
    expect(positions(2)).toEqual(positions(0));
  });
  it("arquivo real: migra snapshot validado, cobre 40 fiadas e preserva modelo", () => {
    const old = legacy(),
      d = validateProject(old);
    expect(d.model).toEqual(old.model);
    expect(d.project).toEqual(old.project);
    expect(d.adjustments).toEqual(old.adjustments);
    expect(d.generationState.status).toBe("outdated");
    const g = verifyCoverage(d);
    expect(g.courses).toHaveLength(40);
    // 400 cm of horizontal wholes, then a vertical whole spanning the corner.
    expect(
      g.courses[0].pieces.filter((p) => p.y === 2500 && p.height === 1250),
    ).toHaveLength(16);
    expect(g.courses[0].pieces).toContainEqual(
      expect.objectContaining({ x: 52500, y: 2500, width: 1250, height: 2500 }),
    );
    expect(
      g.courses[0].pieces
        .filter((p) => p.kind === "half")
        .map((p) => [p.x, p.y]),
    ).toEqual([[52500, 22500]]);
    expect(g.diagnostics.map((x) => x.code)).toEqual(["connection"]);
    expect(g.components[0].alternative).toBe(true);
    const c = g.components[0];
    d.adjustments.junctions = [
      {
        componentId: c.id,
        signature: c.signature,
        wallIds: c.wallIds,
        phase: 1,
      },
    ];
    const alternate = verifyCoverage(d);
    const geometry = (row: (typeof g.courses)[number]) =>
      row.pieces.map(({ x, y, width, height }) => [x, y, width, height]);
    expect(geometry(alternate.courses[0])).toEqual(geometry(g.courses[1]));
    expect(geometry(alternate.courses[1])).toEqual(geometry(g.courses[0]));
    d.generated = alternate;
    d.generationState = {
      status: "current",
      diagnostics: alternate.diagnostics,
    };
    expect(validateProject(JSON.parse(JSON.stringify(d)))).toEqual(d);
    d.model.walls.reverse();
    d.model.walls = d.model.walls.map((w) => ({ ...w, a: w.b, b: w.a }));
    expect(generate(d)).toEqual(alternate);
  });
  it("não usa migração para aceitar diagnóstico antigo adulterado", () => {
    const d = legacy();
    d.generated!.diagnostics[0].message = "alterado";
    expect(() => validateProject(d)).toThrow("inconsistente");
  });
  it.each([3, 4, 5, 6, 7])(
    "ponte de %i módulos: cantos alternam em rotações e reflexões",
    (n) => {
      for (const swap of [false, true])
        for (const sx of [-1, 1])
          for (const sy of [-1, 1]) {
            const d = createProject("U", {
                length: 2500,
                width: 1250,
                height: 700,
              }),
              m = 1250;
            // Build occupied cell runs directly to preserve reflected thickness.
            const runs = [
              Array.from({ length: n }, (_, x) => [x, 0]),
              Array.from({ length: 3 }, (_, y) => [0, y + 1]),
              Array.from({ length: 4 }, (_, y) => [n - 1, y + 1]),
            ];
            const transform = ([x, y]: number[]) =>
              swap ? [sy * y, sx * x] : [sx * x, sy * y];
            d.model.walls = runs.map((run) => {
              const cs = run.map(transform),
                xs = cs.map((c) => c[0]),
                ys = cs.map((c) => c[1]);
              const x = Math.min(...xs),
                y = Math.min(...ys),
                horizontal = ys.every((v) => v === y);
              return makeWall(
                { x: x * m, y: y * m },
                {
                  x: (horizontal ? Math.max(...xs) + 1 : x) * m,
                  y: (horizontal ? y : Math.max(...ys) + 1) * m,
                },
                m,
                d.model.floors[0].id,
                2100,
                1,
              )!;
            });
            const g = verifyCoverage(d);
            expect(g.diagnostics).toEqual([]);
            const tips = [
              [0, 3],
              [n - 1, 4],
            ].map((point) =>
              transform(point)
                .map((v) => v * m)
                .join(","),
            );
            for (const row of g.courses) {
              for (const piece of row.pieces.filter((p) => p.kind === "half")) {
                expect(tips).toContain([piece.x, piece.y].join(","));
              }
            }
            for (const corner of [
              [0, 0],
              [n - 1, 0],
            ]) {
              const [x, y] = transform(corner).map((v) => v * m);
              const covering = g.courses
                .slice(0, 2)
                .map((row) =>
                  row.pieces.find(
                    (p) =>
                      x >= p.x &&
                      x < p.x + p.width &&
                      y >= p.y &&
                      y < p.y + p.height,
                  )!,
                );
              expect(covering.map((p) => p.kind)).toEqual(["whole", "whole"]);
              expect(covering[0].width).not.toBe(covering[1].width);
            }
          }
    },
  );
});
