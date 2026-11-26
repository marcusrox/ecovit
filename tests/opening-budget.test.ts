import { expect, it } from "vitest";
import { createProject, makeWall, type Opening } from "../src/domain/project";
import { addFloor, duplicateFloor } from "../src/domain/floors";
import {
  openingBudget,
  openingOption,
  openingOptionKey,
  withOpeningPrice,
  openingMaterialSchema,
} from "../src/domain/opening-budget";
import {
  validateProject,
  parseFile,
  serializeFile,
  importedCopy,
} from "../src/persistence/files";
import { dehydrate, hydrate } from "../src/persistence/remote-document";
import { generate } from "../src/domain/composition";

function fixture() {
  let d = createProject(
    "Esquadrias",
    { length: 2000, width: 1000, height: 1000 },
    30000,
  );
  d = addFloor(d, { name: "Superior", level: 30000, defaultHeight: 30000 });
  d = addFloor(d, { name: "Vazio", level: 60000, defaultHeight: 30000 });
  d.model.walls = d.model.floors
    .slice(0, 2)
    .map((f) =>
      makeWall({ x: 0, y: 0 }, { x: 40000, y: 0 }, 1000, f.id, 30000, 1)!,
    );
  d.model.openings = [0, 0, 1].map((floor, i): Opening => ({
    id: crypto.randomUUID(),
    wallId: d.model.walls[floor].id,
    kind: "door",
    width: 8000,
    height: 21000,
    offset: i * 10000,
    base: 0,
    appearance: { type: "swing", orientation: i as 0 | 1 | 2 },
    material: { kind: "wood-hollow" },
  }));
  return d;
}
it("agrupa sem orientação/pavimento e fecha quantidades e custos locais/globais sem composição", () => {
  let d = fixture();
  d.model.openings.forEach((o) => (o.material = { kind: "wood-glass" }));
  d = withOpeningPrice(d, openingOption(d.model.openings[0]), 50000);
  const before = structuredClone(d),
    r = openingBudget(d);
  expect(r.rows).toHaveLength(1);
  expect(r.rows[0]).toMatchObject({ count: 3, price: 50000, cost: 150000 });
  expect(r.floors.map((f) => [f.count, f.total])).toEqual([
    [2, 100000],
    [1, 50000],
    [0, 0],
  ]);
  expect(r.total).toBe(150000);
  expect(d).toEqual(before);
  const solid = {
    ...d.model.openings[0],
    material: { kind: "wood-solid" as const },
  };
  d.model.openings.push(
    ...[1, 2].map(() => ({ ...solid, id: crypto.randomUUID() })),
  );
  d = withOpeningPrice(d, openingOption(solid), 80000);
  expect(openingBudget(d).total).toBe(310000);
});
it("separa tipo, dimensão exata e material, contando inclusive vão fora da parede e ignorando vão livre", () => {
  const d = fixture();
  d.model.openings[0].material = { kind: "wood-glass" };
  d.model.openings[1].material = { kind: "aluminium-glass" };
  d.model.openings[2].width++;
  d.model.openings[2].offset = 90000;
  d.model.openings.push({
    ...d.model.openings[0],
    id: crypto.randomUUID(),
    kind: "opening",
    appearance: undefined,
    material: undefined,
  });
  const r = openingBudget(d);
  expect(r.rows).toHaveLength(3);
  expect(r.count).toBe(3);
  expect(r.total).toBeUndefined();
  expect(r.floors[2].total).toBe(0);
  expect(
    openingOptionKey({
      ...openingOption(d.model.openings[0]),
      type: "double-swing",
    }),
  ).not.toBe(openingOptionKey(openingOption(d.model.openings[0])));
});
it("configuração e preço ausentes não são zero e não afetam pavimentos independentes", () => {
  let d = fixture();
  delete d.model.openings[0].material;
  d = withOpeningPrice(d, openingOption(d.model.openings[2]), 0);
  let r = openingBudget(d);
  expect(r.total).toBeUndefined();
  expect(r.floors.map((f) => f.total)).toEqual([undefined, 0, 0]);
  expect(r.rows.find((x) => !x.option.material)?.error).toContain("material");
  delete d.model.openings[0].appearance;
  r = openingBudget(d);
  expect(r.rows.find((x) => !x.option.type)?.error).toContain(
    "tipo e material",
  );
  expect(openingBudget(createProject("Vazio", d.project.base)).total).toBe(0);
});
it("Outro normaliza agrupamento/preço sem catálogo e valida descrição estrita", () => {
  let d = fixture();
  d.model.openings.forEach(
    (o, i) =>
      (o.material = {
        kind: "other",
        description: i ? "ALUMÍNIO azul" : " Alumínio azul ",
      }),
  );
  d = withOpeningPrice(d, openingOption(d.model.openings[0]), 100);
  expect(openingBudget(d).rows).toHaveLength(1);
  expect(openingBudget(d).total).toBe(300);
  for (const description of ["", " ", "a\nb", "a\rb", "x".repeat(101)])
    expect(
      openingMaterialSchema.safeParse({ kind: "other", description }).success,
    ).toBe(false);
  expect(
    openingMaterialSchema.safeParse({
      kind: "wood-glass",
      description: "extra",
    }).success,
  ).toBe(false);
});
it("preço retido só contribui quando a combinação está presente, sem transferência para outro material", () => {
  let d = fixture();
  const option = openingOption(d.model.openings[0]);
  d = withOpeningPrice(d, option, 50000);
  d.model.openings.forEach((o) => (o.material = { kind: "aluminium" }));
  expect(openingBudget(d).total).toBeUndefined();
  expect(d.project.openingPrices).toHaveLength(1);
  d.model.openings.forEach((o) => (o.material = { kind: "wood-hollow" }));
  expect(openingBudget(d).total).toBe(150000);
  d.model.openings = [];
  expect(openingBudget(d).rows).toEqual([]);
  expect(openingBudget(d).total).toBe(0);
  expect(d.project.openingPrices).toHaveLength(1);
});
it("overflow e rascunho inválido preservam quantidades e custos independentes", () => {
  let d = fixture();
  d = withOpeningPrice(
    d,
    openingOption(d.model.openings[0]),
    Number.MAX_SAFE_INTEGER,
  );
  const r = openingBudget(d);
  expect(r.count).toBe(3);
  expect(r.total).toBeUndefined();
  expect(r.floors.map((f) => f.total)).toEqual([
    undefined,
    Number.MAX_SAFE_INTEGER,
    0,
  ]);
  expect(r.rows[0].error).toContain("Custo");
  const key = r.rows[0].key;
  expect(
    openingBudget(d, { [key]: "Preço inválido" }).floors[1].total,
  ).toBeUndefined();
});
it("formato 33 preserva dados, preços ausentes do desenho e cópia de pavimento por valor", () => {
  let d = fixture();
  d = withOpeningPrice(d, openingOption(d.model.openings[0]), 12345);
  const loaded = parseFile(serializeFile(d).text);
  expect(loaded.schemaVersion).toBe(37);
  expect(loaded.project.openingPrices).toEqual(d.project.openingPrices);
  expect(loaded.model.openings).toEqual(d.model.openings);
  expect(importedCopy(loaded).project.openingPrices).toEqual(
    d.project.openingPrices,
  );
  expect(hydrate(dehydrate(d, {}), {}).project.openingPrices).toEqual(
    d.project.openingPrices,
  );
  const copied = duplicateFloor(d, d.model.floors[0].id, 90000, "Cópia");
  const last = copied.model.openings.at(-1)!;
  expect(last.material).toEqual(d.model.openings[0].material);
  expect(last.material).not.toBe(d.model.openings[0].material);
});
it("legado 32 abre sem material/preço e recusa campos novos, dados inválidos e preços duplicados", () => {
  const d = fixture();
  d.model.openings.forEach((o) => delete o.material);
  const old = { ...d, schemaVersion: 32 },
    before = structuredClone(old);
  expect(validateProject(old, false).schemaVersion).toBe(37);
  expect(old).toEqual(before);
  expect(() =>
    validateProject(
      { ...old, project: { ...old.project, openingPrices: [] } },
      false,
    ),
  ).toThrow("formato anterior");
  expect(() =>
    validateProject(
      {
        ...old,
        model: {
          ...old.model,
          openings: [
            { ...old.model.openings[0], material: { kind: "wood-glass" } },
          ],
        },
      },
      false,
    ),
  ).toThrow("formato anterior");
  for (const material of [
    null,
    { kind: "invalid" },
    { kind: "wood" },
    { kind: "wood-glass", extra: 1 },
    { kind: "other", description: "" },
  ])
    expect(() =>
      validateProject(
        {
          ...d,
          model: {
            ...d.model,
            openings: [{ ...d.model.openings[0], material }],
          },
        },
        false,
      ),
    ).toThrow();
  const valid = withOpeningPrice(
    fixture(),
    openingOption(fixture().model.openings[0]),
    0,
  );
  expect(() =>
    validateProject(
      {
        ...valid,
        project: {
          ...valid.project,
          openingPrices: [
            ...valid.project.openingPrices!,
            ...valid.project.openingPrices!,
          ],
        },
      },
      false,
    ),
  ).toThrow();
  expect(() => validateProject({ ...valid, schemaVersion: 36 }, false)).toThrow(
    "Formato incompatível",
  );
});
it("material não muda a composição nominal", () => {
  const d = fixture();
  const result = generate(d);
  d.model.openings.forEach((o) => (o.material = { kind: "aluminium" }));
  expect(generate(d)).toEqual(result);
});
