import { expect, it } from "vitest";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
  type Project,
} from "../src/domain/project";
import { generate, signature } from "../src/domain/composition";
import {
  groutBudget,
  groutDefaults,
  groutVolumeScale as scale,
  parseGroutField,
  groutFields,
} from "../src/domain/grout-budget";
import {
  incorporatePrices,
  withProjectPrice,
  priceSource,
} from "../src/domain/price-references";
import {
  importedCopy,
  validateProject,
  serializeFile,
  parseFile,
} from "../src/persistence/document";
import { dehydrate } from "../src/persistence/remote-document";
import { renderBudgetMarkup } from "../src/app/budget-report/model";

function fixture() {
  const doc = createProject(
    "Microconcreto",
    { length: 2500, width: 1250, height: 700 },
    700,
  );
  doc.project.channelLevels = [{ id: crypto.randomUUID(), top: 700 }];
  doc.project.groutSettings = defaultGroutSettings(false);
  doc.project.groutBudget = { ...groutDefaults, price: 100000 };
  doc.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      { x: 500000, y: 0 },
      1250,
      doc.model.floors[0].id,
      700,
      1,
    )!,
  ];
  doc.generated = generate(doc);
  doc.generationState = {
    status: "current",
    diagnostics: doc.generated.diagnostics,
  };
  return doc;
}
function report(doc: Project, invalid: Parameters<typeof groutBudget>[2] = {}) {
  const r = groutBudget(doc, false, invalid);
  if (!r.available) throw new Error(r.reason);
  return r;
}
it("T-043 calcula 4,22 + 5% e 2,56 + 10% sem depender da ativação ou quantidade de barras", () => {
  const doc = fixture(),
    f = doc.generated!.floors[0];
  f.grouts = [
    {
      id: "a",
      x: 0,
      y: 0,
      wallIds: [],
      origins: [],
      intervals: [{ bottom: 0, top: 1000000 }],
    },
  ];
  const before = JSON.stringify(doc),
    r = report(doc);
  expect(r.rows.map((row) => row.length)).toEqual([1000000n, 500000n]);
  expect(r.rows.map((row) => row.base)).toEqual([422n * scale, 128n * scale]);
  expect(r.rows.map((row) => row.estimated)).toEqual([
    (4431n * scale) / 10n,
    (1408n * scale) / 10n,
  ]);
  expect(r.total).toBe((5839n * scale) / 10n);
  expect(r.cost).toBe(58390);
  expect(JSON.stringify(doc)).toBe(before);
  doc.model.floors[0].channelReinforcement = {
    enabled: true,
    count: 4,
    diameter: 100,
  };
  expect(report(doc).total).toBe(r.total);
  doc.project.groutBudget!.verticalLoss = 0;
  doc.project.groutBudget!.horizontalLoss = 0;
  expect(report(doc).total).toBe(550n * scale);
  expect(report(doc).cost).toBe(55000);
  doc.project.groutBudget!.horizontalLoss = 1000;
  expect(report(doc).rows[0].estimated).toBe(422n * scale);
});
it("T-043 unifica eixos/intervalos, respeita lacunas e não repete demandas horizontais", () => {
  const doc = fixture(),
    f = doc.generated!.floors[0];
  const axis = {
    id: "a",
    x: 0,
    y: 0,
    wallIds: [],
    origins: [],
    intervals: [
      { bottom: 0, top: 10000 },
      { bottom: 20000, top: 30000 },
    ],
  };
  f.grouts = [
    axis,
    { ...axis, id: "duplicate", intervals: [{ bottom: 5000, top: 10000 }] },
  ];
  f.channels!.push(...structuredClone(f.channels!));
  expect(report(doc).rows.map((r) => r.length)).toEqual([20000n, 500000n]);
  f.courses[0].pieces = f.courses[0].pieces.filter((p) => p.x >= 10000);
  expect(report(doc).rows[1].length).toBe(490000n);
});
it("T-043 preserva base com perda ausente e parcelas independentes; zero dispensa parâmetros", () => {
  const doc = fixture();
  delete doc.project.groutBudget!.horizontalLoss;
  const r = report(doc);
  expect(r.rows[1].base).toBe(128n * scale);
  expect(r.total).toBeUndefined();
  expect(r.rows[1].field).toBe("horizontalLoss");
  expect(r.cost).toBeUndefined();
  doc.project.groutBudget = {
    horizontalConsumption: 2560,
    horizontalLoss: 0,
    price: 0,
  };
  expect(report(doc).cost).toBe(0);
  expect(
    report(doc, { horizontalConsumption: "inválido" }).rows[1].base,
  ).toBeUndefined();
  doc.generated!.floors[0].channels = [];
  doc.project.groutBudget = {};
  expect(report(doc).total).toBe(0n);
  expect(report(doc).cost).toBe(0);
  doc.generationState = { status: "outdated", diagnostics: [] };
  expect(groutBudget(doc).available).toBe(false);
});
it("T-043 valida entrada exata, ausência, zero e limites sem arredondar para aprovação", () => {
  expect(parseGroutField("verticalConsumption", "4,22")).toBe(4220);
  expect(parseGroutField("horizontalConsumption", "2.560")).toBe(2560);
  expect(parseGroutField("verticalLoss", "0")).toBe(0);
  expect(parseGroutField("price", "")).toBeUndefined();
  for (const value of ["0", "-1", "1.0001", "1e3", "9007199254740992"])
    expect(() => parseGroutField("verticalConsumption", value)).toThrow();
  const doc = fixture();
  doc.project.groutBudget!.horizontalLoss = Number.MAX_SAFE_INTEGER;
  doc.project.groutBudget!.horizontalConsumption = Number.MAX_SAFE_INTEGER;
  expect(report(doc).total).toBeUndefined();
});
it("T-043 formato, migração, cópia e transporte preservam parâmetros e origens sem mudar insumos", () => {
  let doc = createProject("Dados", { length: 2500, width: 1250, height: 700 });
  const previous = signature(doc.model.walls);
  const refs = groutFields.map((key) => ({
    item: { group: "grout" as const, key },
    price: key === "price" ? 0 : groutDefaults[key],
  }));
  doc = incorporatePrices(doc, refs);
  expect(doc.project.groutBudget).toEqual({ ...groutDefaults, price: 0 });
  expect(signature(doc.model.walls)).toEqual(previous);
  doc = withProjectPrice(doc, { group: "grout", key: "verticalLoss" }, 0);
  doc = withProjectPrice(
    doc,
    { group: "grout", key: "horizontalConsumption" },
    undefined,
  );
  const preserved = incorporatePrices(doc, refs);
  expect(preserved).toBe(doc);
  expect(
    priceSource(doc, { group: "grout", key: "horizontalConsumption" }),
  ).toBe("cleared");
  const loaded = parseFile(serializeFile(doc).text),
    copy = importedCopy(loaded);
  expect(copy.project.groutBudget).toEqual(doc.project.groutBudget);
  copy.project.groutBudget!.verticalLoss = 999;
  expect(doc.project.groutBudget!.verticalLoss).toBe(0);
  expect(dehydrate(loaded, {}).project.groutBudget).toEqual(
    doc.project.groutBudget,
  );
  expect(() => validateProject({ ...doc, schemaVersion: 38 }, false)).toThrow(
    /formato anterior/,
  );
  const legacy = createProject("Legado", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  expect(
    validateProject({ ...legacy, schemaVersion: 38 }, false).project
      .groutBudget,
  ).toBeUndefined();
  expect(() =>
    validateProject(
      {
        ...doc,
        project: { ...doc.project, groutBudget: { verticalConsumption: 0 } },
      },
      false,
    ),
  ).toThrow();
});
it("T-043 relatório compartilha parâmetros em L/m, perdas, litros, m³ e todos os pavimentos", () => {
  const doc = fixture();
  doc.model.floors.push({
    ...doc.model.floors[0],
    id: crypto.randomUUID(),
    name: "Superior",
    level: 28000,
  });
  doc.generated!.floors.push({
    ...structuredClone(doc.generated!.floors[0]),
    floorId: doc.model.floors[1].id,
  });
  const r = report(doc);
  expect(r.floors.reduce((n, f) => n + f.cost!, 0)).toBe(r.cost);
  const html = renderBudgetMarkup(doc);
  expect(html).toContain("Graute de preenchimento");
  expect(html).toContain("Superior");
  expect(html).toContain('value="4,220"');
  expect(html).toContain('value="5,00"');
  expect(html).toContain("L/m");
  expect(html).toContain("m³");
  expect(html).toContain("281,6");
});
it("T-043 apresentação conserva parcelas pequenas e a soma exata entre aplicações", () => {
  const doc = fixture(),
    result = doc.generated!.floors[0];
  result.grouts = [
    {
      id: "tiny",
      x: 0,
      y: 0,
      wallIds: [],
      origins: [],
      intervals: [{ bottom: 0, top: 1 }],
    },
  ];
  result.channels = [];
  doc.project.groutBudget = {
    verticalConsumption: 1,
    verticalLoss: 0,
    price: 100000,
  };
  const html = renderBudgetMarkup(doc);
  expect(report(doc).total).toBe(10000n);
  expect(html).toContain("0,0000001");
  expect(html).toContain("0,0000000001");
});
