import "fake-indexeddb/auto";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("../src/persistence/database", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/persistence/database")>()),
  acquireProject: vi.fn().mockResolvedValue(() => {}),
}));
import * as database from "../src/persistence/database";
import * as files from "../src/persistence/files";
import { createProject } from "../src/domain/project";
import { generate } from "../src/domain/composition";
import { useStore } from "../src/state/store";

afterEach(async () => {
  useStore.getState().close();
  await database.db.table("projects").clear();
  vi.restoreAllMocks();
  vi.mocked(database.acquireProject)
    .mockReset()
    .mockResolvedValue(() => {});
  vi.unstubAllGlobals();
});

it("ativa feedback antes de ler, bloqueia abertura concorrente e valida uma única vez", async () => {
  const doc = createProject("Abrir", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  doc.generated = generate(doc);
  doc.generationState = {
    status: "current",
    diagnostics: doc.generated.diagnostics,
  };
  await database.saveProject(doc);
  const load = vi.spyOn(database, "loadProject");
  const validate = vi.spyOn(files, "validateProject");
  let frame: FrameRequestCallback = () => {};
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frame = callback;
  });
  const opening = useStore.getState().open(doc.project.id);
  expect(useStore.getState()).toMatchObject({
    busy: true,
    openingProjectId: doc.project.id,
    doc: null,
  });
  expect(load).not.toHaveBeenCalled();
  await useStore.getState().open("another-project");
  frame(0);
  await opening;
  expect(load).toHaveBeenCalledExactlyOnceWith(doc.project.id);
  expect(validate).toHaveBeenCalledTimes(1);
  expect(useStore.getState()).toMatchObject({
    busy: false,
    openingProjectId: null,
    doc,
  });
});

it("falha libera o bloqueio e preserva o trabalho aberto; nova tentativa funciona", async () => {
  const doc = createProject("Preservar", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  await database.saveProject(doc);
  await useStore.getState().open(doc.project.id);
  const before = useStore.getState().doc;
  const unlock = vi.fn();
  vi.mocked(database.acquireProject).mockResolvedValueOnce(unlock);
  await useStore.getState().open("missing");
  expect(unlock).toHaveBeenCalledTimes(1);
  expect(useStore.getState()).toMatchObject({
    busy: false,
    openingProjectId: null,
    doc: before,
    message: "Projeto não encontrado.",
  });
  useStore.getState().close();
  await useStore.getState().open(doc.project.id);
  expect(useStore.getState().message).toBe("");
  expect(useStore.getState().doc?.project.id).toBe(doc.project.id);
});

it("reabrir por ID ou objeto conserva trabalho em memória, histórico e trava própria", async () => {
  const doc = createProject("Original", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  const unlock = vi.fn();
  vi.mocked(database.acquireProject).mockResolvedValueOnce(unlock);
  await useStore.getState().open(doc, true);
  await useStore.getState().commit({
    ...useStore.getState().doc!,
    project: { ...doc.project, name: "Trabalho em memória" },
  });
  // A stale record must not replace the active editing session.
  await database.saveProject(doc);
  const before = useStore.getState();
  const acquire = vi.mocked(database.acquireProject);
  acquire.mockClear();
  const load = vi.spyOn(database, "loadProject");
  await before.open(doc.project.id);
  await before.open(doc);
  expect(useStore.getState().doc).toBe(before.doc);
  expect(useStore.getState().history).toBe(before.history);
  expect(useStore.getState().readonly).toBe(false);
  expect(acquire).not.toHaveBeenCalled();
  expect(load).not.toHaveBeenCalled();
  expect(unlock).not.toHaveBeenCalled();
  useStore.getState().close();
  expect(unlock).toHaveBeenCalledTimes(1);
});

it("fresh reutiliza a trava própria e falha de validação preserva documento e bloqueio", async () => {
  const doc = createProject("Original", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  const unlock = vi.fn();
  vi.mocked(database.acquireProject).mockResolvedValueOnce(unlock);
  await useStore.getState().open(doc, true);
  const acquire = vi.mocked(database.acquireProject);
  acquire.mockClear();
  // Web Locks refuses another request while this store already owns the lock.
  acquire.mockResolvedValueOnce(null);
  await useStore
    .getState()
    .open(
      { ...doc, project: { ...doc.project, name: "Reinicializado" } },
      true,
    );
  expect(useStore.getState()).toMatchObject({
    readonly: false,
    doc: { project: { name: "Reinicializado" } },
  });
  const before = useStore.getState();
  await before.open(
    { ...doc, schemaVersion: 1 } as unknown as typeof doc,
    true,
  );
  expect(useStore.getState().doc).toBe(before.doc);
  expect(useStore.getState().history).toBe(before.history);
  expect(useStore.getState().readonly).toBe(false);
  expect(useStore.getState().message).not.toBe("");
  expect(acquire).not.toHaveBeenCalled();
  expect(unlock).not.toHaveBeenCalled();
  useStore.getState().close();
  expect(unlock).toHaveBeenCalledTimes(1);
});

it("somente leitura pode obter a trava ao reabrir sem escrever enquanto bloqueado", async () => {
  const doc = createProject("Outra aba", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  await database.saveProject(doc);
  const save = vi.spyOn(database, "saveProject");
  const unlock = vi.fn();
  vi.mocked(database.acquireProject)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(unlock);
  await useStore.getState().open(doc.project.id);
  expect(useStore.getState().readonly).toBe(true);
  expect(save).not.toHaveBeenCalled();
  await useStore.getState().open(doc.project.id);
  expect(useStore.getState().readonly).toBe(false);
  expect(useStore.getState().message).toBe("");
  expect(unlock).not.toHaveBeenCalled();
  useStore.getState().close();
  expect(unlock).toHaveBeenCalledTimes(1);
});
