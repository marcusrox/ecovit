import { describe, it, expect } from "vitest";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
  type Project,
} from "../src/domain/project";
import { generate } from "../src/domain/composition";
import { duplicateFloor, editFloor } from "../src/domain/floors";
import {
  parseFile,
  serializeFile,
  validateProject,
} from "../src/persistence/files";
import {
  floorReinforcementDraft,
  floorReinforcementChanges,
} from "../src/app/floor-reinforcement-draft";
import {
  defaultSteelBudget,
  steelQuantities,
  steelCosts,
  steelNumber,
  steelWeight,
  steelCatalog,
  type SteelKey,
} from "../src/domain/steel-budget";

function fixture() {
  const doc = createProject(
    "Aço",
    { length: 2500, width: 1250, height: 700 },
    35000,
  );
  doc.project.groutSettings = defaultGroutSettings(false);
  doc.project.channelLevels = [];
  doc.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      { x: 100000, y: 0 },
      1250,
      doc.model.floors[0].id,
      35000,
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
function available(doc: Project) {
  const r = steelQuantities(doc);
  if (!r.available) throw new Error(r.reason);
  return r;
}
function axis(doc: Project, intervals = [{ bottom: 0, top: 30000 }]) {
  return {
    id: "0:0",
    x: 0,
    y: 0,
    wallIds: doc.model.walls.map((w) => w.id),
    origins: ["junction"],
    intervals,
  };
}
function references() {
  const doc = fixture(),
    f = doc.generated!.floors[0],
    w = doc.model.walls[0].id;
  f.grouts = [axis(doc)];
  f.clamps = Array.from({ length: 10 }, (_, i) => ({
    id: `c${i}`,
    course: i + 1,
    top: (i + 1) * 700,
    a: { x: 0, y: 0 },
    b: { x: 1250, y: 0 },
    diameter: 63,
    length: 3250,
    leg: 1000,
    origins: [],
    wallIds: [w],
  }));
  f.reinforcement = [
    {
      id: "bar",
      course: 5,
      top: 3500,
      a: { x: 0, y: 0 },
      b: { x: 100000, y: 0 },
      count: 2,
      diameter: 100,
      wallIds: [w],
      origins: [],
    },
  ];
  return doc;
}
describe("T-028 comprimentos, massas e custos nominais", () => {
  it("mostra uma pendência por grampo sem repetir o diagnóstico nem perder avisos sem peça", () => {
    const doc = references(),
      floor = doc.generated!.floors[0];
    const reason =
      "as duas pontas precisam de intervalo contínuo de graute e alvenaria em toda a descida.";
    floor.clamps![0] = { ...floor.clamps![0], course: 8, pending: reason };
    floor.clamps![1] = {
      ...floor.clamps![1],
      course: 8,
      pending: reason,
      b: { x: 0, y: 1250 },
    };
    for (const c of floor.clamps!.slice(0, 2))
      floor.diagnostics.push({
        code: "clamp-pending",
        severity: "info",
        wallIds: c.wallIds,
        course: 8,
        x: c.a.x,
        y: c.a.y,
        message: `Grampo pendente na fiada 8: ${reason}`,
      });
    floor.diagnostics.push({
      code: "clamp-pending",
      severity: "info",
      wallIds: [],
      course: 90,
      x: 0,
      y: 0,
      message:
        "Grampo pendente na fiada 90: fiada fora da altura atual do pavimento; programação preservada.",
    });
    const source = JSON.stringify(doc),
      report = available(doc),
      pending = report.floors[0].pending;
    expect(pending).toHaveLength(3);
    expect(pending.filter((p) => p.includes("fiada 8"))).toHaveLength(2);
    expect(pending.some((p) => p.includes("(12,5, 0)"))).toBe(true);
    expect(pending.some((p) => p.includes("(0, 12,5)"))).toBe(true);
    expect(pending.some((p) => p.includes("fiada 90"))).toBe(true);
    expect(
      steelNumber(report.rows.find((r) => r.key === "ca50-6.3")!.estimated),
    ).toBe("2,6");
    expect(report.partial).toBe(true);
    expect(JSON.stringify(doc)).toBe(source);
  });
  it("arredonda meio centavo para cima e não publica subtotal com estouro", () => {
    const doc = references(),
      floor = doc.generated!.floors[0];
    floor.grouts = [];
    floor.reinforcement = [];
    floor.clamps = [{ ...floor.clamps![0], diameter: 50, length: 10000 }];
    expect(steelCosts(available(doc), { "ca60-5": 250 }).total).toBe(39); // 0.154 kg × R$2.50 = R$0.385.
    const report = available(doc);
    for (const row of report.rows.filter(
      (r) => r.key === "ca50-8" || r.key === "ca50-10",
    )) {
      row.estimated = 100_000_000n;
      row.weight = 100_000_000_000n;
    }
    const result = steelCosts(report, {
      "ca60-5": 0,
      "ca50-8": Number.MAX_SAFE_INTEGER,
      "ca50-10": Number.MAX_SAFE_INTEGER,
    });
    expect(result.total).toBeUndefined();
    expect(result.error).toContain("fora da representação");
    expect(result.costs["ca50-8"]).toBe(Number.MAX_SAFE_INTEGER);
  });
  it("fecha os três exemplos com valores literais e não altera o documento", () => {
    const doc = references(),
      source = JSON.stringify(doc),
      report = available(doc);
    const vertical = report.rows.find((r) => r.key === "ca50-8")!,
      horizontal = report.rows.find((r) => r.key === "ca50-10")!,
      clamps = report.rows.find((r) => r.key === "ca50-6.3")!;
    expect(steelNumber(vertical.base)).toBe("3");
    expect(steelNumber(vertical.extra)).toBe("0,2");
    expect(steelNumber(vertical.estimated)).toBe("3,2");
    expect(steelWeight(vertical.weight!)).toBe("1,264");
    expect(steelNumber(horizontal.estimated)).toBe("22");
    expect(steelWeight(horizontal.weight!)).toBe("13,574");
    expect(steelNumber(clamps.estimated)).toBe("3,25");
    expect(clamps.extra).toBe(0n);
    expect(clamps.weight).toBe(79_625_000_000n); // exactly 0.79625 kg, no display rounding.
    expect(
      steelCosts(report, { "ca50-8": 1200, "ca50-10": 1000, "ca50-6.3": 800 }),
    ).toMatchObject({
      costs: { "ca50-8": 1517, "ca50-10": 13574, "ca50-6.3": 637 },
      total: 15728,
    });
    expect(JSON.stringify(doc)).toBe(source);
  });
  it.each([
    [15000, "1,5"],
    [15100, "1,71"],
    [30000, "3,2"],
    [30001, "3,4"],
  ])("conta etapas antes de arredondar altura %i", (height, expected) => {
    const doc = fixture();
    doc.generated!.floors[0].grouts = [axis(doc, [{ bottom: 0, top: height }])];
    expect(
      steelNumber(
        available(doc).rows.find((r) => r.key === "ca50-8")!.estimated,
      ),
    ).toBe(expected);
  });
  it("trata intervalos/eixos separados e sobreposição zero sem somar emendas entre eles", () => {
    const doc = fixture(),
      f = doc.generated!.floors[0];
    f.grouts = [
      axis(doc, [
        { bottom: 0, top: 10000 },
        { bottom: 20000, top: 30000 },
      ]),
      { ...axis(doc, [{ bottom: 0, top: 10000 }]), id: "1250:0", x: 1250 },
    ];
    expect(
      steelNumber(
        available(doc).rows.find((r) => r.key === "ca50-8")!.estimated,
      ),
    ).toBe("3");
    doc.model.floors[0].steelBudget = {
      ...defaultSteelBudget(),
      overlapLength: 0,
    };
    f.grouts = [axis(doc)];
    expect(
      steelNumber(
        available(doc).rows.find((r) => r.key === "ca50-8")!.estimated,
      ),
    ).toBe("3");
  });
  it("consolida preço e arredonda uma vez entre pavimentos/aplicações", () => {
    let doc = fixture();
    doc = duplicateFloor(doc, doc.model.floors[0].id, 35000, "Superior");
    doc.generated = generate(doc);
    doc.generationState = {
      status: "current",
      diagnostics: doc.generated.diagnostics,
    };
    for (const f of doc.generated.floors)
      f.grouts = [axis(doc, [{ bottom: 0, top: 10000 }])];
    const report = available(doc);
    expect(
      steelNumber(report.rows.find((r) => r.key === "ca50-8")!.estimated),
    ).toBe("2");
    // 0.79 kg at R$0.01/kg -> R$0.01, not twice-rounded R$0.00.
    expect(steelCosts(report, { "ca50-8": 1 }).total).toBe(1);
    expect(report.floors).toHaveLength(2);
  });
  it("distingue zero, ausência, inválido, legado sem cadastro, pendência e indisponibilidade", () => {
    const empty = available(fixture());
    expect(empty.rows).toHaveLength(5);
    expect(steelCosts(empty, {}).total).toBe(0);
    const doc = references(),
      result = doc.generated!.floors[0];
    result.clamps![0].pending = "furo removido";
    result.diagnostics.push({
      code: "clamp-pending",
      severity: "info",
      wallIds: [],
      course: 90,
      x: 0,
      y: 0,
      message: "fiada acima da altura",
    });
    expect(available(doc).partial).toBe(true);
    expect(available(doc).floors[0].pending).toContain("fiada acima da altura");
    const prices = Object.fromEntries(steelCatalog.map((s) => [s.key, 0]));
    expect(steelCosts(available(doc), prices).total).toBe(0);
    expect(steelCosts(available(doc), {}).total).toBeUndefined();
    expect(
      steelCosts(available(doc), prices, { "ca50-8": "Inválido" }).costs[
        "ca50-8"
      ],
    ).toBeUndefined();
    result.clamps![1].diameter = 71;
    expect(
      available(doc).rows.find((r) => r.key === "unknown-71")?.error,
    ).toContain("sem categoria/massa");
    expect(steelCosts(available(doc), prices).total).toBeUndefined();
    expect(steelQuantities(doc, true).available).toBe(false);
    doc.generationState.status = "outdated";
    expect(steelQuantities(doc).available).toBe(false);
  });
  it("identifica CA-60 Ø5 e limita estouros sem ocultar outras linhas", () => {
    const doc = references();
    doc.generated!.floors[0].clamps![0].diameter = 50;
    expect(available(doc).rows.find((r) => r.key === "ca60-5")?.weight).toBe(
      5_005_000_000n,
    );
    const report = available(doc),
      prices = { "ca50-8": Number.MAX_SAFE_INTEGER, "ca60-5": 800 };
    const costs = steelCosts(report, prices);
    expect(costs.errors["ca50-8"]).toContain("fora");
    expect(costs.costs["ca60-5"]).toBe(40);
    doc.generated!.floors[0].reinforcement![0].count = Number.MAX_SAFE_INTEGER;
    expect(
      available(doc).rows.find((r) => r.key === "ca50-10")?.error,
    ).toContain("fora");
  });
});

describe("T-028 parâmetros e transporte", () => {
  it("aplica parâmetros juntos, preserva padrões ausentes e rejeita erro sem candidato parcial", () => {
    const doc = fixture(),
      floor = doc.model.floors[0],
      draft = floorReinforcementDraft(floor, doc);
    expect(floorReinforcementChanges(draft, doc, floor).changes).toEqual({});
    draft.horizontalExtra = "12,25";
    draft.usefulLength = "120";
    draft.overlapLength = "25";
    expect(floorReinforcementChanges(draft, doc, floor).changes).toEqual({
      steelBudget: {
        usefulLength: 12000,
        overlapLength: 2500,
        horizontalExtra: 1225,
      },
    });
    draft.groutDiameter = "12,5";
    draft.usefulLength = "0";
    expect(
      floorReinforcementChanges(draft, doc, floor).changes,
    ).toBeUndefined();
    expect(
      floorReinforcementChanges(draft, doc, floor).errors.usefulLength,
    ).toBeTruthy();
    draft.usefulLength = "150";
    draft.overlapLength = "-1";
    draft.horizontalExtra = "1,001";
    expect(floorReinforcementChanges(draft, doc, floor).errors).toMatchObject({
      overlapLength: expect.any(String),
      horizontalExtra: expect.any(String),
    });
  });
  it("copia, transporta e migra sem mudar composição, preços ou fonte", () => {
    const original = fixture(),
      floor = original.model.floors[0];
    let doc = editFloor(original, floor.id, {
      steelBudget: {
        usefulLength: 12000,
        overlapLength: 0,
        horizontalExtra: 15000,
      },
    });
    doc = {
      ...doc,
      project: { ...doc.project, steelPrices: { "ca50-8": 1250, "ca60-5": 0 } },
    };
    expect(doc.generated).toEqual(original.generated);
    const restored = parseFile(serializeFile(doc).text);
    expect(restored.schemaVersion).toBe(34);
    expect(restored.project.steelPrices).toEqual(doc.project.steelPrices);
    doc = duplicateFloor(doc, floor.id, 35000, "Superior");
    expect(doc.model.floors[1].steelBudget).toEqual(
      doc.model.floors[0].steelBudget,
    );
    expect(doc.model.floors[1].steelBudget).not.toBe(
      doc.model.floors[0].steelBudget,
    );
    const old = { ...original, schemaVersion: 25 },
      source = JSON.stringify(old);
    expect(validateProject(old).schemaVersion).toBe(34);
    expect(JSON.stringify(old)).toBe(source);
    expect(() => validateProject({ ...restored, schemaVersion: 25 })).toThrow(
      "formato anterior",
    );
  });
  it("recusa campos não previstos, valores inválidos e versões futuras", () => {
    const doc = fixture();
    for (const steelPrices of [
      { "ca50-8": -1 },
      { "ca50-8": 1.5 },
      { "ca50-8": Number.MAX_SAFE_INTEGER + 1 },
      { invalid: 100 },
    ])
      expect(() =>
        validateProject({ ...doc, project: { ...doc.project, steelPrices } }),
      ).toThrow();
    for (const b of [
      { ...defaultSteelBudget(), usefulLength: 0 },
      { ...defaultSteelBudget(), overlapLength: -1 },
      { ...defaultSteelBudget(), horizontalExtra: 1.1 },
      { ...defaultSteelBudget(), other: true },
    ])
      expect(() =>
        validateProject({
          ...doc,
          model: {
            ...doc.model,
            floors: [{ ...doc.model.floors[0], steelBudget: b }],
          },
        }),
      ).toThrow();
    expect(() => validateProject({ ...doc, schemaVersion: 35 })).toThrow(
      "incompatível",
    );
    expect(steelCatalog.map((s) => s.key)).toEqual([
      "ca60-5",
      "ca50-6.3",
      "ca50-8",
      "ca50-10",
      "ca50-12.5",
    ] satisfies SteelKey[]);
  });
});
