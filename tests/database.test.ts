import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import { createProject, makeWall } from "../src/domain/project";
import { generate } from "../src/domain/composition";
import { parseFile } from "../src/persistence/files";
import {
  db,
  loadProject,
  saveProject,
  listProjects,
} from "../src/persistence/database";
it("salva e reabre documento estruturado sem perder medidas", async () => {
  const doc = createProject("Persistência", {
    length: 2800,
    width: 1400,
    height: 700,
  });
  await saveProject(doc);
  expect(await loadProject(doc.project.id)).toEqual(doc);
  expect(
    (await listProjects()).find((p) => p.id === doc.project.id)?.name,
  ).toBe("Persistência");
  await db.table("projects").delete(doc.project.id);
});

it.each(["T", "cruz"])(
  "reabre e importa composição com diagnóstico de %s",
  async (kind) => {
    const doc = createProject("Diagnóstico", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    for (const [a, b] of [
      [
        { x: 0, y: 0 },
        { x: 10000, y: 0 },
      ],
      [
        { x: 5000, y: kind === "T" ? 1250 : -2500 },
        { x: 5000, y: 5000 },
      ],
    ]) {
      doc.model.walls.push(
        makeWall(a, b, 1250, doc.model.floors[0].id, 2100, 1)!,
      );
    }
    doc.generated = generate(doc);
    doc.generationState = {
      status: "current",
      diagnostics: doc.generated.diagnostics,
    };
    expect(doc.generated.diagnostics.some((d) => d.severity === "info")).toBe(
      true,
    );
    await saveProject(doc);
    try {
      expect(await loadProject(doc.project.id)).toEqual(doc);
      expect(parseFile(JSON.stringify(doc))).toEqual(doc);
      const bad = structuredClone(doc);
      bad.generated!.diagnostics[0].message = "Conteúdo alterado";
      bad.generationState.diagnostics = bad.generated!.diagnostics;
      expect(() => parseFile(JSON.stringify(bad))).toThrow("inconsistente");
    } finally {
      await db.table("projects").delete(doc.project.id);
    }
  },
);
