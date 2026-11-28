import { expect, it } from "vitest";
import { createProject, remember, travel } from "../src/domain/project";
import { duplicateFloor, removeFloor } from "../src/domain/floors";
import {
  importedCopy,
  parseFile,
  serializeFile,
  validateProject,
} from "../src/persistence/document";
import {
  incorporatePrices,
  fixedPriceItems,
} from "../src/domain/price-references";
import {
  slabConcreteBudget,
  concreteVolumeScale as scale,
  slabAreaScale,
  parseConcreteField,
  withConcreteClass,
  withConcretePrice,
  withSlabConcrete,
} from "../src/domain/slab-concrete-budget";
import { renderBudgetMarkup } from "../src/app/budget-report/model";
import { CURRENT_PROJECT_FORMAT } from "../src/domain/project-format";

function fixture() {
  const doc = createProject("Lajes", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  doc.model.slabs.push({
    id: crypto.randomUUID(),
    floorId: doc.model.floors[0].id,
    thickness: 800,
    contour: [
      { x: 0, y: 0 },
      { x: 100000, y: 0 },
      { x: 100000, y: 100000 },
      { x: 0, y: 100000 },
    ],
    openings: [],
    concrete: {
      consumption: 60000,
      loss: 500,
      class: "30",
      price: 50000,
      source: "own",
    },
  });
  return doc;
}
it("T-044 exemplo independente: 100 m², 60 L/m², 5%, R$500/m³; tipo ausente e 0% válidos", () => {
  const doc = fixture(),
    r = slabConcreteBudget(doc);
  expect(r.rows[0].area).toBe(100n * slabAreaScale);
  expect(r.rows[0].base).toBe(6n * scale);
  expect(r.total).toBe((63n * scale) / 10n);
  expect(r.cost).toBe(315000);
  doc.model.slabs[0].concrete!.loss = 0;
  expect(slabConcreteBudget(doc).cost).toBe(300000);
  doc.model.slabs[0].construction = { type: "hollow-core", height: 800 };
  expect(slabConcreteBudget(doc).total).toBe(6n * scale);
  doc.model.slabs[0].openings.push({
    id: crypto.randomUUID(),
    contour: [
      { x: 12500, y: 12500 },
      { x: 62500, y: 12500 },
      { x: 62500, y: 52500 },
      { x: 12500, y: 52500 },
    ],
  });
  expect(slabConcreteBudget(doc).total).toBe((48n * scale) / 10n);
});
it("T-044 ausências e rascunhos inválidos preservam somente os derivados independentes", () => {
  const doc = fixture(),
    id = doc.model.slabs[0].id;
  for (const key of ["consumption", "loss", "class", "price"] as const) {
    const copy = structuredClone(doc);
    delete copy.model.slabs[0].concrete![key];
    if (key === "price") delete copy.model.slabs[0].concrete!.source;
    const r = slabConcreteBudget(copy).rows[0];
    expect(r.area).toBeDefined();
    expect(r.cost).toBeUndefined();
    expect(r.errors[key]).toBeDefined();
    expect(r.base !== undefined).toBe(key !== "consumption");
    expect(r.estimated !== undefined).toBe(key === "class" || key === "price");
  }
  const r = slabConcreteBudget(doc, false, { [id]: { loss: "Inválido" } })
    .rows[0];
  expect(r.base).toBeDefined();
  expect(r.estimated).toBeUndefined();
  expect(slabConcreteBudget(doc, true).rows[0].area).toBeUndefined();
  doc.model.slabs[0].concrete = { consumption: 60000, loss: 0 };
  expect(slabConcreteBudget(doc).groups.find((g) => !g.key)!.volume).toBe(
    6n * scale,
  );
});
it("T-044 referências por classe, estabilidade, limpeza e troca atômica", () => {
  let doc = fixture();
  const id = doc.model.slabs[0].id;
  doc = withConcreteClass(doc, id, "40", 60000);
  expect(doc.model.slabs[0].concrete).toMatchObject({
    class: "40",
    price: 60000,
    source: "reference",
  });
  doc = withConcretePrice(doc, id, 0);
  expect(withConcreteClass(doc, id, "40", 70000)).toBe(doc);
  const refs = [
    { item: { group: "concrete" as const, key: "40" as const }, price: 90000 },
  ];
  expect(incorporatePrices(doc, refs)).toBe(doc);
  doc = withConcretePrice(doc, id, undefined);
  expect(incorporatePrices(doc, refs)).toBe(doc);
  doc = withConcreteClass(doc, id, "50");
  expect(doc.model.slabs[0].concrete!.price).toBeUndefined();
  expect(doc.model.slabs[0].concrete!.source).toBeUndefined();
  doc = incorporatePrices(doc, [
    { item: { group: "concrete", key: "50" }, price: 80000 },
  ]);
  expect(doc.model.slabs[0].concrete!.price).toBe(80000);
  expect(fixedPriceItems.filter((i) => i.group === "concrete")).toHaveLength(3);
});
it("T-044 preços diferentes na mesma classe, centavos conciliados e limites seguros", () => {
  let doc = fixture();
  doc = duplicateFloor(doc, doc.model.floors[0].id, 28000, "Superior");
  doc.model.slabs[1].concrete!.price = 60000;
  const r = slabConcreteBudget(doc);
  expect(r.cost).toBe(693000);
  expect(r.rows.reduce((n, r) => n + r.cost!, 0)).toBe(r.cost);
  expect(r.groups.find((g) => g.key === "30")!.volume).toBe(
    (126n * scale) / 10n,
  );
  doc.model.slabs[0].concrete!.consumption = Number.MAX_SAFE_INTEGER;
  doc.model.slabs[0].concrete!.loss = Number.MAX_SAFE_INTEGER;
  const overflow = slabConcreteBudget(doc);
  expect(overflow.cost).toBeUndefined();
  expect(overflow.rows[1].cost).toBeDefined();
  expect(overflow.rows[0].error).toMatch(/segura/);
});
it("T-044 parse decimal exato e rejeição de precisão, negativos e overflow", () => {
  expect(parseConcreteField("consumption", "60,125")).toBe(60125);
  expect(parseConcreteField("loss", "0")).toBe(0);
  expect(parseConcreteField("price", "")).toBeUndefined();
  for (const [key, text] of [
    ["consumption", "0"],
    ["loss", "-1"],
    ["price", "0.001"],
    ["consumption", "1.0001"],
    ["price", "999999999999999999999"],
  ] as const)
    expect(() => parseConcreteField(key, text)).toThrow();
});
it("T-044 formato, migração, transporte, cópia independente, exclusão e histórico", () => {
  const doc = fixture(),
    id = doc.model.slabs[0].id;
  expect(parseFile(serializeFile(doc).text).model.slabs[0].concrete).toEqual(
    doc.model.slabs[0].concrete,
  );
  const copy = importedCopy(doc);
  copy.model.slabs[0].concrete!.price = 1;
  expect(doc.model.slabs[0].concrete!.price).toBe(50000);
  const duplicate = duplicateFloor(
    doc,
    doc.model.floors[0].id,
    28000,
    "Superior",
  );
  duplicate.model.slabs[1].concrete!.loss = 0;
  expect(doc.model.slabs[0].concrete!.loss).toBe(500);
  expect(
    removeFloor(duplicate, duplicate.model.floors[1].id).model.slabs,
  ).toHaveLength(1);
  expect(() =>
    validateProject(
      { ...doc, schemaVersion: CURRENT_PROJECT_FORMAT - 1 },
      false,
    ),
  ).toThrow(/formato anterior/);
  const legacy = structuredClone(doc);
  delete legacy.model.slabs[0].concrete;
  expect(
    validateProject({ ...legacy, schemaVersion: 39 }, false).model.slabs[0]
      .concrete,
  ).toBeUndefined();
  expect(() =>
    withSlabConcrete(doc, id, { price: 0, source: "cleared" }),
  ).toThrow();
  const next = withConcretePrice(doc, id, undefined);
  // History restores the slab and its complete financial intent together.
  const history = remember({ past: [], future: [] }, doc);
  expect(travel(history, next)!.doc.model.slabs[0].concrete).toEqual(
    doc.model.slabs[0].concrete,
  );
});
it("T-044 relatório compartilha lajes, parâmetros, resumo e grupos sem consultar referências", () => {
  const doc = fixture(),
    html = renderBudgetMarkup(doc);
  expect(html).toContain("Concreto · lajes do projeto");
  expect(html).toContain('value="60,00"');
  expect(html).toContain('value="30" selected=""');
  expect(html).toContain("<td>6,30</td>");
  expect(html).toContain("<strong>6,30 m³</strong>");
  expect(html).toContain("3.150,00");
  doc.model.slabs = [];
  expect(slabConcreteBudget(doc)).toMatchObject({ total: 0n, cost: 0 });
  expect(renderBudgetMarkup(doc)).toContain("Não há lajes no projeto.");
});
it("T-044 apresenta área, consumo, volume base e estimado com duas casas sem alterar os dados ou cálculos", () => {
  const doc = fixture();
  doc.model.slabs[0].contour = [
    { x: 0, y: 0 },
    { x: 81250, y: 0 },
    { x: 81250, y: 136250 },
    { x: 0, y: 136250 },
  ];
  doc.model.slabs[0].concrete!.consumption = 120000;
  const before = structuredClone(doc),
    result = slabConcreteBudget(doc);
  const html = renderBudgetMarkup(doc);
  expect(html).toContain("<td>110,70</td>");
  expect(html).toContain('value="120,00"');
  expect(html).toContain("<td>13,28</td>");
  expect(html).toContain("<td>13,95</td>");
  expect(html).toContain("<strong>13,95 m³</strong>");
  expect(html).toContain("FCK 30 MPa: 13,95 m³");
  expect(html).toContain("FCK 40 MPa: 0,00 m³");
  expect(html).toContain("FCK 50 MPa: 0,00 m³");
  expect(html).toContain("Sem classe: 0,00 m³");
  expect(doc).toEqual(before);
  expect(slabConcreteBudget(doc)).toEqual(result);
  doc.model.slabs[0].concrete!.consumption = 120005;
  expect(renderBudgetMarkup(doc)).toContain('value="120,01"');
  expect(doc.model.slabs[0].concrete!.consumption).toBe(120005);
});
