import "fake-indexeddb/auto";
import { afterEach, expect, it, vi } from "vitest";
import { createProject } from "../src/domain/project";
import {
  db,
  deleteProject,
  loadStoredProject,
  saveProject,
} from "../src/persistence/database";

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await db.table("projects").clear();
});
function locks(available = true) {
  vi.stubGlobal("navigator", {
    locks: {
      request: (
        _: string,
        __: unknown,
        callback: (lock: object | null) => unknown,
      ) => callback(available ? {} : null),
    },
  });
}
it("RF-12: excluir remove somente o projeto escolhido, inclusive incompatível", async () => {
  locks();
  const a = createProject("A", { length: 2500, width: 1250, height: 700 });
  const b = createProject("B", a.project.base);
  await saveProject(a);
  await saveProject(b);
  await db.table("projects").update(a.project.id, { "doc.schemaVersion": 8 });
  expect((await loadStoredProject(a.project.id)).schemaVersion).toBe(8);
  await deleteProject(a.project.id);
  await expect(loadStoredProject(a.project.id)).rejects.toThrow(
    "não encontrado",
  );
  expect(await loadStoredProject(b.project.id)).toEqual(b);
});
it("RF-12: bloqueio em outra aba preserva projeto", async () => {
  locks(false);
  const d = createProject("A", { length: 2500, width: 1250, height: 700 });
  await saveProject(d);
  await expect(deleteProject(d.project.id)).rejects.toThrow("outra aba");
  expect(await loadStoredProject(d.project.id)).toEqual(d);
});
it("RF-12: falha de armazenamento preserva projeto e libera bloqueio para tentar novamente", async () => {
  locks();
  const d = createProject("A", { length: 2500, width: 1250, height: 700 });
  await saveProject(d);
  vi.spyOn(db.table("projects"), "delete").mockRejectedValueOnce(
    new Error("Falha ao excluir"),
  );
  await expect(deleteProject(d.project.id)).rejects.toThrow("Falha ao excluir");
  expect(await loadStoredProject(d.project.id)).toEqual(d);
  await deleteProject(d.project.id);
  await expect(loadStoredProject(d.project.id)).rejects.toThrow();
});
