import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
  CURRENT_PROJECT_FORMAT,
  MIN_SUPPORTED_PROJECT_FORMAT,
  isSupportedProjectFormat,
} from "../src/domain/project-format";
import { createProject } from "../src/domain/project";
import {
  importedCopy,
  parseFile,
  serializeFile,
  validateProject,
} from "../src/persistence/document";
import { dehydrate, hydrate } from "../src/persistence/remote-document";

const fixture = () =>
  createProject(
    "Contrato de formatos",
    { length: 2500, width: 1250, height: 700 },
    28000,
  );

it("contrato de formatos: criação, leitor, arquivo, cópia e transporte usam a versão vigente", () => {
  const doc = fixture();
  expect(doc.schemaVersion).toBe(CURRENT_PROJECT_FORMAT);
  const loaded = parseFile(serializeFile(doc).text);
  expect(loaded).toEqual(doc);
  const copy = importedCopy(loaded);
  expect(copy.schemaVersion).toBe(CURRENT_PROJECT_FORMAT);
  expect(copy.project.id).not.toBe(doc.project.id);
  expect(copy.model).toEqual(doc.model);
  expect(hydrate(dehydrate(doc, {}), {})).toEqual(doc);
});

it("contrato de formatos: faixa inteira suportada e versões futuras são consistentes com o leitor", () => {
  for (
    let version = MIN_SUPPORTED_PROJECT_FORMAT;
    version <= CURRENT_PROJECT_FORMAT;
    version++
  )
    expect(isSupportedProjectFormat(version)).toBe(true);
  const doc = fixture();
  for (const version of [
    MIN_SUPPORTED_PROJECT_FORMAT - 1,
    CURRENT_PROJECT_FORMAT + 1,
    Number.MAX_SAFE_INTEGER,
    9.5,
    NaN,
    Infinity,
    String(CURRENT_PROJECT_FORMAT),
    null,
    undefined,
  ]) {
    expect(isSupportedProjectFormat(version)).toBe(false);
    expect(() =>
      validateProject({ ...doc, schemaVersion: version }, false),
    ).toThrow("Formato incompatível");
  }
});

it("contrato de formatos: fixture histórica 9 migra sem alterar a fonte", () => {
  const text = readFileSync(
    new URL("./fixtures/unequal-heights-v9.ecovit", import.meta.url),
    "utf8",
  );
  const source = JSON.parse(text),
    before = structuredClone(source);
  expect(source.schemaVersion).toBe(9);
  const loaded = validateProject(source);
  expect(loaded.schemaVersion).toBe(CURRENT_PROJECT_FORMAT);
  expect(loaded.project.id).toBe(source.project.id);
  expect(loaded.model.walls).toEqual(source.model.walls);
  expect(source).toEqual(before);
});

it.each([35, 36])(
  "contrato de formatos: legado %i preserva ausência sem inventar parâmetros novos",
  (version) => {
    const source = { ...fixture(), schemaVersion: version };
    const before = structuredClone(source);
    const loaded = validateProject(source, false);
    expect(loaded.schemaVersion).toBe(CURRENT_PROJECT_FORMAT);
    expect(loaded.project.surface).toBeUndefined();
    expect(loaded.project.priceSources).toBeUndefined();
    expect(source).toEqual(before);
  },
);

it("contrato de formatos: fronteiras históricas continuam recusando conteúdo novo em envelope antigo", () => {
  const doc = fixture();
  doc.project.surface = {
    waterproofing: { productDescription: "Produto · lata de 18 L" },
  };
  expect(() => validateProject({ ...doc, schemaVersion: 36 }, false)).toThrow(
    "formato anterior",
  );
  delete doc.project.surface.waterproofing!.productDescription;
  expect(() => validateProject({ ...doc, schemaVersion: 35 }, false)).toThrow(
    "formato anterior",
  );
});
