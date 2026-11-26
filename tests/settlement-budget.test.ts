import { expect, it } from "vitest";
import { createProject, makeWall, type Project } from "../src/domain/project";
import { generate } from "../src/domain/composition";
import { addFloor } from "../src/domain/floors";
import {
  validateProject,
  serializeFile,
  parseFile,
  importedCopy,
} from "../src/persistence/files";
import { dehydrate, hydrate } from "../src/persistence/remote-document";
import {
  areaScale,
  consumptionScale,
  settlementBudget,
  parseSettlementField,
  type SettlementReport,
} from "../src/domain/settlement-budget";

function fixture(areas = [100]) {
  let d = createProject(
    "Assentamento",
    { length: 2000, width: 1000, height: 1000 },
    10000,
  );
  d.project.channelLevels = [];
  for (let i = 1; i < areas.length; i++)
    d = addFloor(d, {
      name: "Superior",
      level: i * 20000,
      defaultHeight: 10000,
    });
  d.model.walls = areas.flatMap((a, i) =>
    a
      ? [
          makeWall(
            { x: 0, y: 0 },
            { x: a * 10000, y: 0 },
            1000,
            d.model.floors[i].id,
            10000,
            1,
          )!,
        ]
      : [],
  );
  d.generated = generate(d);
  d.generationState = {
    status: "current",
    diagnostics: d.generated.diagnostics,
  };
  return d;
}
function report(d: Project) {
  const r = settlementBudget(d);
  if (!r.available) throw new Error(r.reason);
  return r;
}
const row = (r: Extract<SettlementReport, { available: true }>, key = "ac1") =>
  r.rows.find((r) => r.key === key)!;

it("AC1 100%: 140 kg, sete sacos e R$ 210, sem mutar o documento", () => {
  const d = fixture();
  d.project.settlement = { ac1: { percent: 10000, price: 3000 } };
  const before = structuredClone(d),
    r = report(d);
  expect(r.net).toBe(100n * areaScale);
  expect(row(r)).toMatchObject({
    consumption: 140n * consumptionScale,
    packages: 7,
    cost: 21000,
  });
  expect(r.total).toBe(21000);
  expect(d).toEqual(before);
});
it("50/50 de argamassa/cola converte ml em litros e compra sem mistura de unidades", () => {
  const d = fixture();
  d.project.settlement = {
    ac1: { percent: 5000, price: 3000 },
    "white-glue": { percent: 5000, price: 2000 },
  };
  const r = report(d);
  expect(row(r)).toMatchObject({
    consumption: 70n * consumptionScale,
    packages: 4,
    cost: 12000,
  });
  expect(row(r, "white-glue")).toMatchObject({
    consumption: 4000n * consumptionScale,
    packages: 4,
    cost: 8000,
  });
  expect(r.total).toBe(20000);
});
it("polimérica arredonda 140 kg para 47 pacotes e R$ 705", () => {
  const d = fixture();
  d.project.settlement = { polymer: { percent: 10000, price: 1500 } };
  expect(row(report(d), "polymer")).toMatchObject({
    packages: 47,
    cost: 70500,
  });
});
it("rateio 60/40 compartilha sete sacos, sem comprar cinco mais três", () => {
  const d = fixture([60, 40, 0]);
  d.project.settlement = { ac1: { percent: 10000, price: 3000 } };
  const r = report(d);
  expect(r.floors.map((f) => f.total)).toEqual([12600, 8400, 0]);
  expect(r.floors.map((f) => f.rows[0].consumption)).toEqual([
    84n * consumptionScale,
    56n * consumptionScale,
    0n,
  ]);
  expect(row(r).packages).toBe(7);
  expect(r.total).toBe(21000);
});
it("maiores restos distribui centavos por produto, com empate determinístico e soma exata", () => {
  const d = fixture([1, 1, 1]);
  d.project.settlement = {
    ac1: { percent: 5000, price: 1000 },
    ac2: { percent: 5000, price: 1000 },
  };
  const r = report(d);
  expect(r.floors.map((f) => f.rows[0].cost)).toEqual([334, 333, 333]);
  expect(r.floors.map((f) => f.total)).toEqual([668, 666, 666]);
  expect(r.floors.reduce((n, f) => n + f.total!, 0)).toBe(r.total);
});
it("área usa comprimentos e alturas sem desconto nos encontros ou dependência da espessura", () => {
  const d = fixture([0]),
    f = d.model.floors[0].id;
  d.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 40000, y: 0 }, 1000, f, 30000, 1)!,
    makeWall({ x: 0, y: 0 }, { x: 0, y: 30000 }, 1000, f, 30000, 1)!,
  ];
  d.model.openings = [
    {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "door",
      offset: 10000,
      width: 10000,
      base: 0,
      height: 20000,
    },
  ];
  const r = report(d);
  expect([r.gross, r.openings, r.net]).toEqual([
    21n * areaScale,
    2n * areaScale,
    19n * areaScale,
  ]);
  d.project.base = { length: 4000, width: 2000, height: 1000 };
  expect(report(d).net).toBe(r.net);
  d.model.walls[1].height = 20000;
  expect(report(d).net).toBe(16n * areaScale);
});
it("recorta e une vãos no plano de cada parede, sem desconto duplicado ou negativo", () => {
  const d = fixture([4]),
    wallId = d.model.walls[0].id;
  d.model.openings = [
    {
      id: crypto.randomUUID(),
      wallId,
      kind: "window",
      offset: -10000,
      width: 30000,
      base: -10000,
      height: 20000,
    },
    {
      id: crypto.randomUUID(),
      wallId,
      kind: "door",
      offset: 10000,
      width: 40000,
      base: 0,
      height: 20000,
    },
    {
      id: crypto.randomUUID(),
      wallId,
      kind: "opening",
      offset: 0,
      width: 40000,
      base: 10000,
      height: 10000,
    },
  ];
  expect(report(d).openings).toBe(4n * areaScale);
  expect(report(d).net).toBe(0n);
});
it("incompletude de distribuição oculta derivados, preserva áreas e aceita soma acima/abaixo de 100", () => {
  const d = fixture([1, 0]);
  for (const percent of [0, 5000, 10001]) {
    d.project.settlement =
      percent === 10001
        ? { ac1: { percent: 10000 }, ac2: { percent: 1 } }
        : { ac1: { percent } };
    const r = report(d);
    expect(r.distributionValid).toBe(false);
    expect(r.total).toBeUndefined();
    expect(row(r).consumption).toBeUndefined();
    expect(row(r).packages).toBeUndefined();
    expect(r.net).toBe(areaScale);
    expect(r.floors[1].total).toBe(0);
    expect(validateProject(d, false).project.settlement).toEqual(
      d.project.settlement,
    );
  }
});
it("área zero dispensa configuração e preços; preço ausente difere de zero", () => {
  expect(report(fixture([0])).total).toBe(0);
  const d = fixture();
  d.project.settlement = { ac1: { percent: 10000 } };
  expect(row(report(d)).packages).toBe(7);
  expect(report(d).total).toBeUndefined();
  d.project.settlement.ac1!.price = 0;
  expect(report(d).total).toBe(0);
});
it("rascunhos inválidos não mostram resultados antigos como válidos nem escondem seções independentes", () => {
  const d = fixture();
  d.project.settlement = {
    ac1: { percent: 5000, price: 3000 },
    ac2: { percent: 5000, price: 3000 },
  };
  let r = settlementBudget(d, false, { ac1: { percent: "inválido" } });
  expect(r.available && r.rows[0].consumption).toBeUndefined();
  r = settlementBudget(d, false, { ac1: { yield: "inválido" } });
  expect(r.available && r.rows[0].consumption).toBeUndefined();
  expect(r.available && r.rows[1].cost).toBe(12000);
  r = settlementBudget(d, false, { ac1: { price: "inválido" } });
  expect(r.available && r.rows[0].packages).toBe(4);
  expect(r.available && r.total).toBeUndefined();
});
it("indisponibilidade não usa composição antiga; parcialidade geométrica independe de ferragem", () => {
  const d = fixture();
  expect(settlementBudget(d, true).available).toBe(false);
  d.generationState.status = "outdated";
  expect(settlementBudget(d).available).toBe(false);
  d.generationState.status = "current";
  const diagnostic = {
    floorId: d.model.floors[0].id,
    code: "clamp-pending",
    severity: "info" as const,
    wallIds: [],
    course: 1,
    x: 0,
    y: 0,
    message: "Pendente",
  };
  d.generated!.diagnostics.push(diagnostic);
  expect(report(d).partial).toBe(false);
  d.generated!.diagnostics.push({
    ...diagnostic,
    code: "unsupported",
    severity: "error",
  });
  expect(report(d).partial).toBe(true);
  expect(report(d).floors[0].partial).toBe(true);
});
it("parsing exato, unidades e rejeição de entradas fora do contrato", () => {
  expect(parseSettlementField("yield", "1,4")).toBe(1400);
  expect(parseSettlementField("yield", "80.001")).toBe(80001);
  expect(parseSettlementField("yield", "0,001")).toBe(1);
  expect(parseSettlementField("percent", "99,99")).toBe(9999);
  expect(parseSettlementField("price", "")).toBeUndefined();
  for (const s of [
    "0",
    "-1",
    "NaN",
    "Infinity",
    "1e3",
    "1,0001",
    "",
    "9007199254741",
  ])
    expect(() => parseSettlementField("yield", s)).toThrow();
  for (const s of ["100.01", "-1", "1,001"])
    expect(() => parseSettlementField("percent", s)).toThrow();
});
it("rendimento editado em limite exato não compra embalagem adicional; overflow mantém parâmetros e outros produtos", () => {
  const d = fixture([3]);
  d.project.settlement = {
    polymer: { percent: 10000, yield: 1000, price: 1000 },
  };
  expect(row(report(d), "polymer").packages).toBe(1);
  d.project.settlement.polymer!.yield = 1001;
  expect(row(report(d), "polymer").packages).toBe(2);
  d.project.settlement = {
    ac1: { percent: 10000, price: Number.MAX_SAFE_INTEGER },
  };
  expect(row(report(d)).cost).toBe(Number.MAX_SAFE_INTEGER);
  d.model.walls[0].b.x = 1000000;
  const r = report(d);
  expect(row(r).error).toContain("Custo");
  expect(r.total).toBeUndefined();
  expect(row(r, "ac2").cost).toBe(0);
  expect(d.project.settlement.ac1!.price).toBe(Number.MAX_SAFE_INTEGER);
});
it("formato 32 preserva configuração estrita em arquivo, cópia e transporte remoto", () => {
  const d = fixture([1]);
  d.project.settlement = { ac1: { percent: 10000, yield: 1401, price: 3000 } };
  const loaded = parseFile(serializeFile(d).text);
  expect(loaded.schemaVersion).toBe(35);
  expect(loaded.project.settlement).toEqual(d.project.settlement);
  expect(importedCopy(loaded).project.settlement).toEqual(d.project.settlement);
  expect(hydrate(dehydrate(d, {}), {}).project.settlement).toEqual(
    d.project.settlement,
  );
  for (const settlement of [
    null,
    { ac4: {} },
    { ac1: null },
    { ac1: { extra: 0 } },
    { ac1: { yield: 0 } },
    { ac1: { yield: 1.1 } },
    { ac1: { percent: 10001 } },
    { ac1: { price: -1 } },
    { ac1: { price: Number.MAX_SAFE_INTEGER + 1 } },
  ])
    expect(() =>
      validateProject({ ...d, project: { ...d.project, settlement } }, false),
    ).toThrow();
  expect(() => validateProject({ ...d, schemaVersion: 36 }, false)).toThrow(
    "Formato incompatível",
  );
});
it("legados normalizam em memória sem materializar parâmetros; campo novo em formato antigo é recusado", () => {
  const d = fixture([0]);
  for (let schemaVersion = 9; schemaVersion <= 31; schemaVersion++) {
    // Use only fields that actually existed in the target envelope.
    const model: Partial<Project["model"]> = structuredClone(d.model);
    if (schemaVersion < 17) delete model.terrain;
    if (schemaVersion === 9) delete model.measurements;
    if (schemaVersion < 11) delete model.referenceImages;
    if (schemaVersion < 13) {
      delete model.imageElements;
      delete model.customImageAssets;
    }
    if (schemaVersion < 19) {
      delete model.roomLabels;
      delete model.roomBoundaries;
    }
    const old = { ...d, schemaVersion, model },
      before = structuredClone(old);
    const loaded = validateProject(old, false);
    expect(loaded.schemaVersion).toBe(35);
    expect(loaded.project).not.toHaveProperty("settlement");
    expect(old).toEqual(before);
    for (const settlement of [{}, null, { ac1: { percent: 0 } }])
      expect(() =>
        validateProject(
          { ...old, project: { ...old.project, settlement } },
          false,
        ),
      ).toThrow("formato anterior");
  }
});

it("overflow de consumo e de subtotal preserva resultados independentes e explicita a indisponibilidade", () => {
  const d = fixture([100]);
  // Isolate the area projection from the already-covered composition engine.
  d.model.walls[0].height = 300000;
  d.project.settlement = {
    ac1: { percent: 5000, yield: Number.MAX_SAFE_INTEGER, price: 1000 },
    ac2: { percent: 5000, price: 1000 },
  };
  const original = structuredClone(d.project.settlement);
  let r = report(d);
  expect(r.net).toBe(3000n * areaScale);
  expect(row(r).error).toContain("Consumo");
  expect(row(r).consumption).toBeUndefined();
  expect(row(r).packages).toBeUndefined();
  expect(row(r, "ac2").cost).toBe(105000);
  expect(r.total).toBeUndefined();
  expect(d.project.settlement).toEqual(original);
  d.model.walls[0].height = 10000;
  d.project.settlement = {
    ac1: { percent: 5000, yield: 1, price: Number.MAX_SAFE_INTEGER },
    ac2: { percent: 5000, yield: 1, price: Number.MAX_SAFE_INTEGER },
  };
  r = report(d);
  expect(row(r).cost).toBe(Number.MAX_SAFE_INTEGER);
  expect(row(r, "ac2").cost).toBe(Number.MAX_SAFE_INTEGER);
  expect(r.total).toBeUndefined();
  expect(r.floors[0].total).toBeUndefined();
  expect(r.error).toContain("Subtotal");
});
