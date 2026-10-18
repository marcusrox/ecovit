import "fake-indexeddb/auto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  db,
  saveProject,
  loadProject,
  listProjects,
  duplicateProject,
} from "../src/persistence/database";
import { createProject, makeWall } from "../src/domain/project";
import { addFloor } from "../src/domain/floors";
import { generate } from "../src/domain/composition";

beforeEach(() =>
  vi.stubGlobal("navigator", {
    locks: {
      request: (
        _name: string,
        _options: unknown,
        callback: (lock: object) => unknown,
      ) => callback({}),
    },
  }),
);
afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await db.table("projects").clear();
});
function fixture() {
  let d = createProject("Origem", { length: 2500, width: 1250, height: 700 });
  for (const level of [-2100, 28000, 35000])
    d = addFloor(d, { name: "Mesmo", level, defaultHeight: 28000 });
  const f = d.model.floors[0].id;
  d.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 10000, y: 0 }, 1250, f, 2100, 1)!,
  ];
  d.model.slabs = [
    {
      id: crypto.randomUUID(),
      floorId: f,
      thickness: 2100,
      contour: [
        { x: 0, y: 0 },
        { x: 10000, y: 0 },
        { x: 10000, y: 10000 },
        { x: 0, y: 10000 },
      ],
      openings: [
        {
          id: crypto.randomUUID(),
          contour: [
            { x: 1250, y: 1250 },
            { x: 2500, y: 1250 },
            { x: 2500, y: 2500 },
            { x: 1250, y: 2500 },
          ],
        },
      ],
    },
  ];
  d.generated = generate(d);
  const c = d.generated.floors.find((g) => g.floorId === f)!.components[0];
  d.adjustments.junctions = [
    {
      id: crypto.randomUUID(),
      floorId: f,
      anchor: { x: c.x, y: c.y },
      binding: "pending",
      componentId: c.id,
      signature: c.signature,
      wallIds: c.wallIds,
      phase: 0,
    },
  ];
  d.generated = generate(d);
  d.generationState = {
    status: "current",
    diagnostics: d.generated.diagnostics,
  };
  return d;
}
it("EX-93: cópia persistida independente, intenção/referências/pendências intactas", async () => {
  const source = fixture();
  await saveProject(source);
  const copy = await duplicateProject(source.project.id, "  Minha cópia  ");
  expect(copy.project.id).not.toBe(source.project.id);
  expect(copy.project.name).toBe("Minha cópia");
  expect(copy.model).toEqual(source.model);
  expect(copy.adjustments).toEqual(source.adjustments);
  expect(copy.generated).toEqual(source.generated);
  expect(copy.metadata.appVersion).toBe("0.11.0");
  expect(await loadProject(source.project.id)).toEqual(source);
  expect(await loadProject(copy.project.id)).toEqual(copy);
  copy.model.walls[0].a.x = 1250;
  copy.adjustments.junctions[0].binding = "active";
  copy.generated = null;
  copy.generationState = { status: "outdated", diagnostics: [] };
  await saveProject(copy);
  expect((await loadProject(source.project.id)).model).toEqual(source.model);
  expect((await loadProject(copy.project.id)).adjustments).toEqual(
    copy.adjustments,
  );
  expect(await loadProject(source.project.id)).toEqual(source);
});
it("EX-93: v9 e desatualizado preservam intenção e esperam recomposição ao abrir", async () => {
  const source = fixture();
  const old = structuredClone(source) as unknown as {
    generated: { convention: string };
  };
  old.generated.convention = "nominal-v9";
  await db.table("projects").put({
    id: source.project.id,
    updatedAt: source.metadata.updatedAt,
    doc: old,
  });
  const copy = await duplicateProject(source.project.id, "Legado");
  expect(copy.generated).toBeNull();
  expect(copy.generationState).toEqual({ status: "outdated", diagnostics: [] });
  expect(copy.model).toEqual(source.model);
  expect(copy.adjustments).toEqual(source.adjustments);
  expect(
    (await db.table("projects").get(source.project.id)).doc.generated
      .convention,
  ).toBe("nominal-v9");
});
it("EX-93: quota, nome inválido, leitura e incompatibilidade não criam cópia", async () => {
  const source = fixture();
  await saveProject(source);
  const before = await db.table("projects").toArray();
  await expect(duplicateProject(source.project.id, "   ")).rejects.toThrow();
  await expect(
    duplicateProject(source.project.id, "x".repeat(101)),
  ).rejects.toThrow();
  await expect(
    duplicateProject(crypto.randomUUID(), "Ausente"),
  ).rejects.toThrow();
  const spy = vi
    .spyOn(db.table("projects"), "add")
    .mockRejectedValueOnce(new Error("QuotaExceeded"));
  await expect(
    duplicateProject(source.project.id, "Sem espaço"),
  ).rejects.toThrow("QuotaExceeded");
  spy.mockRestore();
  expect(await db.table("projects").toArray()).toEqual(before);
  expect(await listProjects()).toHaveLength(1);
  const invalid = structuredClone(source) as unknown as {
    schemaVersion: number;
  };
  invalid.schemaVersion = 8;
  await db.table("projects").put({ ...before[0], doc: invalid });
  await expect(duplicateProject(source.project.id, "Antigo")).rejects.toThrow();
  expect(await listProjects()).toHaveLength(1);
});

it("revisão M5: nome da cópia não pode ultrapassar intenção de 50 MiB", async () => {
  const source = fixture();
  source.generated = null;
  source.generationState = { status: "outdated", diagnostics: [] };
  source.adjustments.junctions[0].signature = "";
  const maximum = 50 * 1024 * 1024;
  const baseSize = new TextEncoder().encode(JSON.stringify(source)).byteLength;
  source.adjustments.junctions[0].signature = "s".repeat(
    maximum - 1 - baseSize,
  );
  await saveProject(source);
  let message = "";
  try {
    await duplicateProject(source.project.id, "x".repeat(100));
  } catch (e) {
    message = (e as Error).message;
  }
  expect(message).toContain("limite");
  expect(await db.table("projects").count()).toBe(1);
  const original = await loadProject(source.project.id);
  expect(original.project.name).toBe(source.project.name);
  expect(original.adjustments.junctions[0].signature.length).toBe(
    source.adjustments.junctions[0].signature.length,
  );
}, 30000);

it("revisão M5: duplicar rascunho íntegro conserva resultado ausente e pendências", async () => {
  const source = fixture();
  source.generated = null;
  source.generationState = { status: "outdated", diagnostics: [] };
  await saveProject(source);
  const copy = await duplicateProject(source.project.id, "Rascunho");
  expect(copy.generated).toBeNull();
  expect(copy.generationState).toEqual(source.generationState);
  expect(copy.adjustments).toEqual(source.adjustments);
  expect(copy.model).toEqual(source.model);
  expect(await loadProject(copy.project.id)).toEqual(copy);
  expect(await loadProject(source.project.id)).toEqual(source);
});
