import { expect, it } from "vitest";
import { createProject, LIMIT, type Terrain } from "../src/domain/project";
import {
  compassContains,
  compassCorners,
  compassPoint,
  initialCompass,
  resizeCompass,
  validateCompass,
} from "../src/domain/terrain-compass";
import {
  importedCopy,
  parseFile,
  serializeFile,
  validateProject,
} from "../src/persistence/files";
import { duplicateFloor } from "../src/domain/floors";

const terrain = (): Terrain => ({
  id: crypto.randomUUID(),
  material: "grass",
  revision: 1,
  textureOrigin: { x: 0, y: 0 },
  contour: [
    { x: 0, y: 0 },
    { x: 40000, y: 0 },
    { x: 40000, y: 30000 },
    { x: 0, y: 30000 },
  ],
});
const fixture = () => {
  const d = createProject("Rosa", { length: 2500, width: 1250, height: 700 });
  d.model.terrain = terrain();
  return d;
};

it("rosa inicia desligada em arquivos anteriores; ativação cria posição e tamanho gráficos válidos", () => {
  const d = fixture(),
    old = { ...d, schemaVersion: 17 };
  expect(validateProject(old).schemaVersion).toBe(18);
  expect(validateProject(old).model.terrain?.compass).toBeUndefined();
  expect(old.schemaVersion).toBe(17);
  const c = initialCompass(d.model.terrain!);
  expect(c).toEqual({
    visible: true,
    center: { x: 20000, y: 15000 },
    size: 7500,
    angle: 0,
  });
  const atLimit = {
    ...terrain(),
    contour: [
      { x: LIMIT - 2, y: LIMIT - 2 },
      { x: LIMIT, y: LIMIT - 2 },
      { x: LIMIT, y: LIMIT },
    ],
  };
  expect(() => validateCompass(initialCompass(atLimit))).not.toThrow();
});
it("rosa gira geometria e hit-test; tamanho uniforme mantém centro e ângulo", () => {
  const c = { ...initialCompass(terrain()), angle: 45 };
  expect(compassContains(c, c.center)).toBe(true);
  expect(compassContains(c, compassPoint(c, c.size * 0.49, 0))).toBe(true);
  expect(compassContains(c, compassPoint(c, c.size, 0))).toBe(false);
  const resized = resizeCompass(c, compassPoint(c, c.size, -c.size));
  expect(resized.size).toBe(c.size * 2);
  expect(resized.center).toEqual(c.center);
  expect(resized.angle).toBe(45);
  const corners = compassCorners({ ...c, angle: 90 });
  expect(corners[0].x).toBeCloseTo(c.center.x + c.size / 2);
  expect(corners[0].y).toBeCloseTo(c.center.y - c.size / 2);
});
it("rosa recusa transformações inválidas e extensões além do limite, inclusive oculta", () => {
  const c = initialCompass(terrain());
  for (const change of [
    { size: 0 },
    { size: NaN },
    { size: 100.2 },
    { angle: 360 },
    { angle: -1 },
    { center: { x: 0.1, y: 0 } },
    { center: { x: LIMIT, y: 0 } },
    { visible: "true" },
  ])
    expect(() => validateCompass({ ...c, ...change } as typeof c)).toThrow();
  expect(() =>
    validateCompass({ ...c, visible: false, center: { x: LIMIT, y: LIMIT } }),
  ).toThrow();
  expect(() => resizeCompass(c, c.center)).toThrow();
});
it("formato 18 preserva rosa oculta/transformada em arquivo, cópias e pavimentos; 17 recusa campo novo", () => {
  const d = fixture();
  d.model.terrain!.compass = {
    ...initialCompass(d.model.terrain!),
    visible: false,
    angle: 123.5,
    center: { x: -5000, y: 12000 },
  };
  const original = JSON.stringify(d);
  expect(parseFile(serializeFile(d).text)).toEqual(d);
  const copy = structuredClone(importedCopy(d));
  expect(copy.model.terrain).toEqual(d.model.terrain);
  copy.model.terrain!.compass!.center.x++;
  expect(JSON.stringify(d)).toBe(original);
  const floor = duplicateFloor(d, d.model.floors[0].id, 28000, "Superior");
  expect(floor.model.terrain).toEqual(d.model.terrain);
  expect(() => validateProject({ ...d, schemaVersion: 17 })).toThrow(
    /formato anterior/,
  );
  expect(() =>
    validateProject({
      ...d,
      model: {
        ...d.model,
        terrain: {
          ...d.model.terrain,
          compass: { ...d.model.terrain!.compass, visible: 1 },
        },
      },
    }),
  ).toThrow();
});
