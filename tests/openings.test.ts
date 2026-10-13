import { describe, expect, it } from "vitest";
import {
  createProject,
  makeWall,
  resizeLength,
  type Opening,
  type Project,
} from "../src/domain/project";
import { generate } from "../src/domain/composition";
import {
  modularOptions,
  openingBox,
  openingIssue,
  putOpening,
  reconcileOpenings,
  removeElement,
} from "../src/domain/openings";
import { importedCopy, parseFile } from "../src/persistence/files";

function fixture(
  m = 1250,
  h = 700,
  vertical = false,
  reverse = false,
  side: 1 | -1 = 1,
) {
  const d = createProject("Vãos", { length: 2 * m, width: m, height: h });
  const a = { x: 0, y: 0 },
    b = vertical ? { x: 0, y: 32 * m } : { x: 32 * m, y: 0 };
  d.model.walls = [
    makeWall(
      reverse ? b : a,
      reverse ? a : b,
      m,
      d.model.floors[0].id,
      40 * h,
      side,
    )!,
  ];
  return d;
}
function opening(
  d: Project,
  offset = 10000,
  width = 10000,
  base = 0,
  height = 21000,
): Opening {
  return {
    id: crypto.randomUUID(),
    wallId: d.model.walls[0].id,
    kind: "door",
    offset,
    width,
    base,
    height,
  };
}
const counts = (d: Project, n: number) => {
  const ps = generate(d, "nominal-v4").courses[n - 1].pieces;
  return [
    ps.filter((p) => p.kind === "whole").length,
    ps.filter((p) => p.kind === "half").length,
  ];
};
describe("M3.1 geometria e arquivo", () => {
  it("limites de vãos e convenção incompatível são recusados sem truncar", () => {
    const d = fixture(),
      o = opening(d);
    d.model.openings = Array.from({ length: 1001 }, () => ({
      ...o,
      id: crypto.randomUUID(),
    }));
    expect(generate(d).diagnostics[0].code).toBe("limit");
    expect(() => parseFile(JSON.stringify(d))).toThrow();
    d.model.openings = [o];
    d.generated = generate(d, "nominal-v3");
    d.generationState = {
      status: "current",
      diagnostics: d.generated.diagnostics,
    };
    expect(() => parseFile(JSON.stringify(d))).toThrow("Convenção");
  });
  it("EX-21 porta interrompe pares sem reiniciar fase e retoma na fiada 31", () => {
    let d = fixture();
    d = putOpening(d, opening(d));
    expect(counts(d, 1)).toEqual([12, 0]);
    expect(counts(d, 2)).toEqual([10, 4]);
    expect(counts(d, 30)).toEqual([10, 4]);
    expect(counts(d, 31)).toEqual([16, 0]);
    const ps = generate(d, "nominal-v4").courses[1].pieces.filter(
      (p) => p.kind === "half",
    );
    expect(ps.map((p) => p.x / 1250)).toEqual([0, 7, 16, 31]);
  });
  it("EX-22 janela preserva fiadas inferiores e superiores", () => {
    let d = fixture();
    d = putOpening(d, {
      ...opening(d, 10000, 10000, 9800, 11200),
      kind: "window",
    });
    expect(counts(d, 14)).toEqual([15, 2]);
    expect(counts(d, 15)).toEqual([12, 0]);
    expect(counts(d, 30)).toEqual([10, 4]);
    expect(counts(d, 31)).toEqual([16, 0]);
  });
  it("EX-23 duas aberturas respeitam posição e meios esperados", () => {
    let d = fixture();
    d = putOpening(d, opening(d, 10000, 8750));
    d = putOpening(d, {
      ...opening(d, 25000, 10000, 9800, 11200),
      kind: "window",
    });
    expect(counts(d, 15)).toEqual([8, 1]);
    expect(counts(d, 16)).toEqual([6, 5]);
    expect(
      generate(d, "nominal-v4")
        .courses[15].pieces.filter((p) => p.kind === "half")
        .map((p) => p.x / 1250),
    ).toEqual([0, 7, 19, 28, 31]);
  });
  it.each([1250, 1500, 1400])(
    "EX-29 bases, rotações, lados e sentido com módulo %i",
    (m) => {
      for (const vertical of [false, true])
        for (const reverse of [false, true])
          for (const side of [1, -1] as const) {
            let d = fixture(m, 700, vertical, reverse, side);
            d = putOpening(d, opening(d, 8 * m, 8 * m, 9800, 11200));
            expect(counts(d, 15)).toEqual([12, 0]);
            expect(counts(d, 16)).toEqual([10, 4]);
            const g = generate(d),
              b = openingBox(d.model.openings[0], d.model.walls[0], m);
            for (const p of g.courses[14].pieces)
              expect(
                p.x < b.x + b.width &&
                  p.x + p.width > b.x &&
                  p.y < b.y + b.height &&
                  p.y + p.height > b.y,
              ).toBe(false);
          }
    },
  );
  it("altura-base personalizada de 6 cm abre somente fiadas 15–30", () => {
    let d = fixture(1400, 600);
    d = putOpening(d, opening(d, 11200, 11200, 8400, 9600));
    expect(counts(d, 14)).toEqual([15, 2]);
    expect(counts(d, 15)).toEqual([12, 0]);
    expect(counts(d, 31)).toEqual([16, 0]);
  });
  it("EX-24 piso e início diferentes; alternativas sem arredondar", () => {
    const d = fixture();
    d.model.floors[0].level = 1000;
    d.model.floors[0].start = 1200;
    expect(openingIssue(d, opening(d))?.code).toBe("opening-outside-wall");
    const o = opening(d, 10000, 10000, 10000, 11200);
    expect(openingIssue(d, o)).toBeNull();
    expect(modularOptions(10000, 700, 0, 0, 28000)).toEqual([9800, 10500]);
    expect(modularOptions(10300, 1250, 0, 1250, 40000)).toEqual([10000, 11250]);
  });
  it("EX-25 redimensionar ambas as pontas preserva posição mundial e pendência", () => {
    let d = fixture();
    d = putOpening(d, opening(d));
    let next = {
      ...d,
      model: {
        ...d.model,
        walls: [resizeLength(d.model.walls[0], "a", 37500, 1250)],
      },
    };
    next = reconcileOpenings(d, next);
    expect(next.model.openings[0].offset).toBe(7500);
    const tooShort = reconcileOpenings(next, {
      ...next,
      model: {
        ...next.model,
        walls: [resizeLength(next.model.walls[0], "a", 27500, 1250)],
      },
    });
    expect(tooShort.model.openings[0].offset).toBe(-2500);
    expect(
      generate(tooShort).diagnostics.some(
        (d) => d.code === "opening-outside-wall",
      ),
    ).toBe(true);
    expect(generate(tooShort).courses.every((c) => !c.pieces.length)).toBe(
      true,
    );
  });
  it("EX-26 sobreposição/contacto lateral recusados e um módulo aceito", () => {
    let d = fixture();
    d = putOpening(d, opening(d));
    expect(() => putOpening(d, opening(d, 18750, 6250))).toThrow("sobrepostos");
    expect(() => putOpening(d, opening(d, 20000, 5000))).toThrow("módulo");
    expect(putOpening(d, opening(d, 21250, 3750)).model.openings).toHaveLength(
      2,
    );
  });
  it.each([10000, 15000])(
    "EX-26 empilhados com coincidência total/parcial %i",
    (offset) => {
      let d = fixture();
      d = putOpening(d, opening(d, 10000, 10000, 0, 10500));
      expect(() =>
        putOpening(d, opening(d, offset, 10000, 10500, 10500)),
      ).toThrow("fiada completa");
      d = putOpening(d, opening(d, offset, 10000, 11200, 9800));
      expect(counts(d, 16)).toEqual([15, 2]);
      expect(generate(d, "nominal-v4").courses[16].pieces.length).toBeLessThan(
        16,
      );
    },
  );
  it("EX-27 conflito no encontro preserva intenção e componente independente", () => {
    let d = fixture();
    d.model.walls[0].b.x = 10000;
    d.model.walls.push(
      makeWall(
        { x: 0, y: 0 },
        { x: 0, y: 10000 },
        1250,
        d.model.floors[0].id,
        28000,
        1,
      )!,
    );
    d.model.walls.push(
      makeWall(
        { x: 20000, y: 20000 },
        { x: 25000, y: 20000 },
        1250,
        d.model.floors[0].id,
        28000,
        1,
      )!,
    );
    d = putOpening(d, opening(d, 0, 2500));
    let g = generate(d);
    expect(g.diagnostics.some((x) => x.code === "opening-at-junction")).toBe(
      true,
    );
    expect(g.courses[0].pieces).toHaveLength(2);
    d = putOpening(d, { ...d.model.openings[0], offset: 1250 });
    g = generate(d);
    expect(g.diagnostics.some((x) => x.severity === "error")).toBe(false);
    expect(
      g.courses[0].pieces.some(
        (p) => p.x === 0 && p.y === 0 && p.kind === "half",
      ),
    ).toBe(true);
    expect(
      g.courses[1].pieces.some(
        (p) => p.x === 0 && p.y === 0 && p.height === 2500,
      ),
    ).toBe(true);
  });
  it("exclusão individual/parede preserva entidades independentes", () => {
    let d = fixture();
    d = putOpening(d, opening(d));
    d = putOpening(d, opening(d, 25000, 5000));
    expect(
      removeElement(d, d.model.openings[0].id).model.openings,
    ).toHaveLength(1);
    expect(removeElement(d, d.model.openings[0].id).model.walls).toEqual(
      d.model.walls,
    );
    expect(removeElement(d, d.model.walls[0].id).model.openings).toEqual([]);
  });
  it("EX-30 transporte conserva snapshot e recusa adulteração/orfão/duplicata", () => {
    let d = fixture();
    d = putOpening(d, opening(d));
    const g = generate(d);
    d = {
      ...d,
      generated: g,
      generationState: { status: "current", diagnostics: g.diagnostics },
    };
    expect(parseFile(JSON.stringify(d))).toEqual(d);
    expect(importedCopy(d).model).toEqual(d.model);
    const bad = structuredClone(d);
    bad.generated!.courses[0].pieces[0].width += 1250;
    expect(() => parseFile(JSON.stringify(bad))).toThrow("inconsistente");
    expect(() =>
      parseFile(
        JSON.stringify({
          ...d,
          model: {
            ...d.model,
            openings: [{ ...d.model.openings[0], wallId: crypto.randomUUID() }],
          },
        }),
      ),
    ).toThrow("referência");
    expect(() =>
      parseFile(
        JSON.stringify({
          ...d,
          model: {
            ...d.model,
            openings: [d.model.openings[0], d.model.openings[0]],
          },
        }),
      ),
    ).toThrow("duplicado");
  });
  it("rascunho fora da parede permanece íntegro no arquivo", () => {
    let d = fixture();
    d = putOpening(d, opening(d));
    d.model.openings[0].offset = -1250;
    const g = generate(d);
    d.generated = g;
    d.generationState = { status: "current", diagnostics: g.diagnostics };
    expect(parseFile(JSON.stringify(d))).toEqual(d);
  });
  it("sem vãos reproduz nominal-v3 e valida versão 2 antes de migrar", () => {
    const d = fixture();
    const {
      openingSettings: _settings,
      channelLevels: _levels,
      ...project
    } = d.project;
    void _settings;
    void _levels;
    const g = generate(d, "nominal-v3");
    const old = {
      ...d,
      schemaVersion: 2,
      project,
      generated: g,
      generationState: { status: "current", diagnostics: g.diagnostics },
    };
    const migrated = parseFile(JSON.stringify(old));
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.generationState.status).toBe("outdated");
    expect(generate(migrated).courses).toEqual(g.courses);
    const bad = structuredClone(old);
    bad.generated.courses[0].pieces[0].x++;
    expect(() => parseFile(JSON.stringify(bad))).toThrow("inconsistente");
  });
});
