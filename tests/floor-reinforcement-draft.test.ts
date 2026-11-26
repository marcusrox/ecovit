import { describe, it, expect } from "vitest";
import { createProject, makeWall } from "../src/domain/project";
import { editFloor, duplicateFloor } from "../src/domain/floors";
import {
  validateProject,
  serializeFile,
  parseFile,
} from "../src/persistence/files";
import { generate } from "../src/domain/composition";
import {
  floorReinforcementDraft,
  floorReinforcementChanges,
} from "../src/app/floor-reinforcement-draft";

function fixture() {
  const doc = createProject(
    "Ferragens",
    { length: 2500, width: 1250, height: 700 },
    9800,
  );
  const floor = doc.model.floors[0];
  doc.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 10000, y: 0 }, 1250, floor.id, 9800, 1)!,
  ];
  doc.project.groutSettings.junctions = true;
  return { doc, floor, draft: floorReinforcementDraft(floor, doc) };
}
describe("Confirmação conjunta das ferragens", () => {
  it("graute guarda a bitola por pavimento, copia e transporta sem mudar o desenho", () => {
    const { doc, floor, draft } = fixture();
    const before = generate(doc);
    draft.groutDiameter = "12,5";
    const result = floorReinforcementChanges(draft, doc, floor);
    expect(result.changes).toEqual({ groutDiameter: 125 });
    const next = editFloor(doc, floor.id, result.changes!);
    expect(generate(next)).toEqual(before);
    const copy = duplicateFloor(next, floor.id, 14000, "Superior");
    expect(copy.model.floors[1].groutDiameter).toBe(125);
    const restored = parseFile(serializeFile(copy).text);
    expect(restored.schemaVersion).toBe(37);
    expect(restored.model.floors.map((f) => f.groutDiameter)).toEqual([
      125, 125,
    ]);
    expect(floor.groutDiameter).toBeUndefined();
    for (const invalid of [0, 63, 81, 8, "8", null])
      expect(() =>
        validateProject({
          ...doc,
          model: {
            ...doc.model,
            floors: [{ ...floor, groutDiameter: invalid }],
          },
        }),
      ).toThrow();
    draft.groutDiameter = "6,3";
    expect(
      floorReinforcementChanges(draft, doc, floor).changes,
    ).toBeUndefined();
  });
  it("normaliza o formato anterior sem inventar bitola ou alterar valores já salvos", () => {
    const { doc, floor } = fixture();
    floor.clamps = {
      enabled: false,
      diameter: 71,
      length: 3250,
      schedule: { mode: "list", courses: [] },
    };
    floor.channelReinforcement = { enabled: true, count: 2, diameter: 63 };
    const old = { ...doc, schemaVersion: 24 };
    const source = JSON.stringify(old);
    const loaded = validateProject(old);
    expect(loaded.schemaVersion).toBe(37);
    expect(loaded.model.floors[0]).toEqual(floor);
    expect(JSON.stringify(old)).toBe(source);
    const draft = floorReinforcementDraft(loaded.model.floors[0], loaded);
    expect(
      floorReinforcementChanges(draft, loaded, loaded.model.floors[0]).changes,
    ).toEqual({});
    expect(() =>
      validateProject({
        ...old,
        model: { ...doc.model, floors: [{ ...floor, groutDiameter: 80 }] },
      }),
    ).toThrow("formato anterior");
  });
  it("não materializa configurações opcionais ao consultar/aplicar padrões", () => {
    const { doc, floor, draft } = fixture();
    const before = JSON.stringify(doc);
    expect(floorReinforcementChanges(draft, doc, floor)).toEqual({
      errors: {},
      changes: {},
    });
    draft.reinforcement.count = "02";
    expect(floorReinforcementChanges(draft, doc, floor).changes).toEqual({});
    expect(JSON.stringify(doc)).toBe(before);
  });
  it("erro em qualquer grupo impede o conjunto e conserva todos os rascunhos", () => {
    const { doc, floor, draft } = fixture();
    draft.groutMode = "reinforced";
    draft.clamps.enabled = true;
    draft.clamps.list = "15";
    draft.reinforcement.count = "1.5";
    const result = floorReinforcementChanges(draft, doc, floor);
    expect(result.changes).toBeUndefined();
    expect(result.errors.clamps).toContain("entre 1 e 14");
    expect(result.errors.reinforcement).toContain("inteira positiva");
    expect(floor.groutMode).toBeUndefined();
    expect(draft.groutMode).toBe("reinforced");
  });
  it("produz um único conjunto válido sem alterar a fonte", () => {
    const { doc, floor, draft } = fixture();
    draft.groutMode = "reinforced";
    draft.clamps = { ...draft.clamps, enabled: true, list: "9, 5, 5" };
    draft.reinforcement = { enabled: true, count: "3", diameter: "6,3" };
    expect(floorReinforcementChanges(draft, doc, floor)).toEqual({
      errors: {},
      changes: {
        groutMode: "reinforced",
        clamps: {
          enabled: true,
          diameter: 63,
          length: 3250,
          schedule: { mode: "list", courses: [5, 9] },
        },
        channelReinforcement: { enabled: true, count: 3, diameter: 63 },
      },
    });
    expect(floor.clamps).toBeUndefined();
  });
  it("preserva grupos não editados, inclusive grampos pendentes após redução da altura", () => {
    const { doc, floor } = fixture();
    floor.groutMode = "reinforced";
    floor.clamps = {
      enabled: true,
      diameter: 63,
      length: 4050,
      schedule: { mode: "list", courses: [20] },
    };
    doc.project.groutSettings.junctions = false;
    const draft = floorReinforcementDraft(floor, doc);
    draft.groutMode = "simple";
    draft.reinforcement.enabled = true;
    expect(floorReinforcementChanges(draft, doc, floor).changes).toEqual({
      channelReinforcement: { enabled: true, count: 2, diameter: 100 },
    });
  });
});
