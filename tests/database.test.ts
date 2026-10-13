import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import { createProject, makeWall } from "../src/domain/project";
import { generate } from "../src/domain/composition";
import { defaultGroutSettings } from "../src/domain/project";
import { parseFile } from "../src/persistence/files";
import {
  db,
  loadProject,
  saveProject,
  listProjects,
} from "../src/persistence/database";
it("M3.3 IndexedDB migra M3.2 só em memória e confere snapshot original", async () => {
  const d = createProject("Legado canaletas", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  d.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      { x: 10000, y: 0 },
      1250,
      d.model.floors[0].id,
      28000,
      1,
    )!,
  ];
  const { groutSettings: _settings, ...project } = d.project;
  void _settings;
  const g = generate(d, "nominal-v5"),
    old = {
      ...d,
      project,
      schemaVersion: 4,
      generated: g,
      generationState: { status: "current", diagnostics: g.diagnostics },
    };
  await db
    .table("projects")
    .put({
      id: d.project.id,
      name: d.project.name,
      updatedAt: d.metadata.updatedAt,
      doc: old,
    });
  try {
    const loaded = await loadProject(d.project.id);
    expect(loaded.schemaVersion).toBe(5);
    expect(loaded.project.groutSettings).toEqual(defaultGroutSettings(false));
    expect((await db.table("projects").get(d.project.id)).doc).toEqual(old);
    expect(loaded.generated).toEqual(g);
    const bad = structuredClone(old);
    bad.generated.courses[0].pieces[0].kind = "half-channel";
    await db
      .table("projects")
      .put({
        id: d.project.id,
        name: d.project.name,
        updatedAt: d.metadata.updatedAt,
        doc: bad,
      });
    await expect(loadProject(d.project.id)).rejects.toThrow("inconsistente");
  } finally {
    await db.table("projects").delete(d.project.id);
  }
});
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
    expect(
      doc.generated.diagnostics.some(
        (d) => d.severity === (kind === "T" ? "info" : "error"),
      ),
    ).toBe(true);
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

it("migra U legado do IndexedDB sem sobrescrever antes do fluxo de salvamento", async () => {
  const { readFileSync } = await import("node:fs");
  const old = JSON.parse(
    readFileSync(
      new URL("./fixtures/open-u-legacy.ecovit", import.meta.url),
      "utf8",
    ),
  );
  await saveProject(old);
  try {
    const loaded = await loadProject(old.project.id);
    expect(loaded.model).toEqual(old.model);
    expect(loaded.generationState.status).toBe("outdated");
    expect((await db.table("projects").get(old.project.id)).doc).toEqual(old);
    loaded.generated = generate(loaded);
    loaded.generationState = {
      status: "current",
      diagnostics: loaded.generated.diagnostics,
    };
    await saveProject(loaded);
    expect(await loadProject(old.project.id)).toEqual(loaded);
  } finally {
    await db.table("projects").delete(old.project.id);
  }
});
