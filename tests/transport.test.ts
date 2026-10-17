import { expect, it } from "vitest";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
} from "../src/domain/project";
import { addFloor, editFloor } from "../src/domain/floors";
import { generate } from "../src/domain/composition";
import {
  MAX_FILE,
  parseFile,
  serializeFile,
  validateProject,
} from "../src/persistence/files";

it("A01 altura inicial personalizada persiste sem herdar edição, cópia ou remoção de andares", () => {
  let d = createProject(
    "Personalizado",
    { length: 2800, width: 1400, height: 600 },
    27600,
  );
  const first = d.model.floors[0].id;
  d = editFloor(d, first, { defaultHeight: 24000 });
  expect(parseFile(serializeFile(d).text).project.initialWallHeight).toBe(
    27600,
  );
  expect(() =>
    validateProject({
      ...d,
      project: { ...d.project, initialWallHeight: 28000 },
    }),
  ).toThrow("modular");
  const old = structuredClone(d);
  delete old.project.initialWallHeight;
  expect(() => validateProject(old)).not.toThrow();
});

it("A10 transporte normal conserva snapshot e diagnósticos completos", () => {
  const d = createProject("Transporte", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  d.generated = generate(d);
  d.generationState = {
    status: "current",
    diagnostics: d.generated.diagnostics,
  };
  const file = serializeFile(d);
  expect(file.omittedResult).toBe(false);
  expect(parseFile(file.text)).toEqual(d);
});

it("A10/A12 backup de 440 mil peças preserva toda intenção e permite recomposição sem teto de geração", () => {
  let d = createProject("Backup grande", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  d.project.channelLevels = [];
  d.project.groutSettings = defaultGroutSettings(false);
  for (const level of [42000, 84000, 126000])
    d = addFloor(d, { name: "Andar", level, defaultHeight: 28000 });
  for (const f of d.model.floors)
    for (let i = 0; i < 100; i++)
      d.model.walls.push(
        makeWall(
          { x: 0, y: i * 3750 },
          { x: 12500, y: i * 3750 },
          1250,
          f.id,
          140000,
          1,
        )!,
      );
  d.generated = generate(d);
  d.generationState = {
    status: "current",
    diagnostics: d.generated.diagnostics,
  };
  const original = d.generated;
  expect(
    original.floors
      .flatMap((f) => f.courses)
      .reduce((n, r) => n + r.pieces.length, 0),
  ).toBe(440000);
  const file = serializeFile(d);
  expect(file.omittedResult).toBe(true);
  expect(new TextEncoder().encode(file.text).byteLength).toBeLessThanOrEqual(
    MAX_FILE,
  );
  const loaded = parseFile(file.text);
  expect(loaded.model).toEqual(d.model);
  expect(loaded.project).toEqual(d.project);
  expect(loaded.adjustments).toEqual(d.adjustments);
  expect(loaded.metadata).toEqual(d.metadata);
  expect(loaded.generated).toBeNull();
  expect(loaded.generationState).toEqual({
    status: "outdated",
    diagnostics: [],
  });
  expect(d.generated).toBe(original);
  const regenerated = generate(loaded);
  expect(regenerated.floors.map((f) => f.courses.length)).toEqual([
    200, 200, 200, 200,
  ]);
  expect(
    regenerated.floors
      .flatMap((f) => f.courses)
      .reduce((n, r) => n + r.pieces.length, 0),
  ).toBe(440000);
  expect(regenerated.diagnostics).toEqual([]);
  // Confere integridade do transporte, sem exigir uma meta de desempenho.
}, 120000);
