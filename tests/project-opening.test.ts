import { afterEach, expect, it, vi } from "vitest";
const records = vi.hoisted(() => new Map<string, unknown>());
vi.mock("../src/persistence/remote", () => ({
  forgetProject: vi.fn(),
  pendingErrorKind: () => "falhou",
  checkRevision: vi.fn(),
  saveProject: vi.fn(async (doc) => {
    records.set(doc.project.id, structuredClone(doc));
    return { revision: "1", projectId: doc.project.id, operationId: "test" };
  }),
  loadProject: vi.fn(async (id) => {
    const doc = records.get(id);
    if (!doc) throw new Error("Projeto não encontrado.");
    return structuredClone(doc);
  }),
}));
import * as remote from "../src/persistence/remote";
import { createProject } from "../src/domain/project";
import { useStore } from "../src/state/store";
const project = () =>
  createProject("Original", { length: 2500, width: 1250, height: 700 });
afterEach(() => {
  useStore.getState().close();
  records.clear();
  vi.restoreAllMocks();
  vi.mocked(remote.loadProject).mockClear();
  vi.mocked(remote.saveProject).mockClear();
  vi.unstubAllGlobals();
});
it("pinta feedback antes da leitura, bloqueia abertura concorrente e não grava ao abrir", async () => {
  const doc = project();
  records.set(doc.project.id, doc);
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    frames.push(callback),
  );
  const opening = useStore.getState().open(doc.project.id);
  expect(useStore.getState()).toMatchObject({
    busy: true,
    openingProjectId: doc.project.id,
    doc: null,
  });
  expect(remote.loadProject).not.toHaveBeenCalled();
  await useStore.getState().open("ignored");
  frames.shift()!(0);
  await new Promise((resolve) => setTimeout(resolve, 5));
  frames.shift()!(0);
  await opening;
  expect(remote.loadProject).toHaveBeenCalledExactlyOnceWith(doc.project.id);
  expect(remote.saveProject).not.toHaveBeenCalled();
  expect(useStore.getState()).toMatchObject({
    busy: false,
    openingProjectId: null,
    readonly: false,
    doc: { project: doc.project },
  });
});
it("falha de leitura preserva documento e histórico anteriores e permite nova abertura", async () => {
  const doc = project();
  records.set(doc.project.id, doc);
  await useStore.getState().open(doc.project.id);
  const before = useStore.getState();
  await before.open(crypto.randomUUID());
  expect(useStore.getState()).toMatchObject({
    busy: false,
    openingProjectId: null,
    doc: before.doc,
    history: before.history,
    message: "Projeto não encontrado.",
  });
  useStore.getState().close();
  await useStore.getState().open(doc.project.id);
  expect(useStore.getState().message).toBe("");
});
it("reabrir a mesma identificação não substitui candidato rejeitado nem duplica histórico", async () => {
  const doc = project();
  await useStore.getState().open(doc, true);
  vi.mocked(remote.saveProject).mockRejectedValueOnce(new Error("quota"));
  await useStore
    .getState()
    .commit({ ...doc, project: { ...doc.project, name: "Em memória" } });
  const before = useStore.getState();
  await before.open(doc.project.id);
  await before.open(doc);
  expect(useStore.getState().doc).toBe(before.doc);
  expect(useStore.getState().history).toBe(before.history);
  expect(useStore.getState().readonly).toBe(true);
  expect(remote.loadProject).not.toHaveBeenCalled();
});
it("fresh inválido preserva documento e histórico sem escrita remota", async () => {
  const doc = project();
  await useStore.getState().open(doc, true);
  const before = useStore.getState();
  vi.mocked(remote.saveProject).mockClear();
  await before.open(
    { ...doc, schemaVersion: 1 } as unknown as typeof doc,
    true,
  );
  expect(useStore.getState().doc).toBe(before.doc);
  expect(useStore.getState().history).toBe(before.history);
  expect(remote.saveProject).not.toHaveBeenCalled();
  expect(useStore.getState().message).not.toBe("");
});
it("descartar rejeição restaura checkpoint e pilhas, sem refazer a tentativa rejeitada", async () => {
  const doc = project();
  await useStore.getState().open(doc, true);
  await useStore
    .getState()
    .commit({ ...doc, project: { ...doc.project, name: "Confirmado" } });
  const confirmed = useStore.getState();
  vi.mocked(remote.saveProject).mockRejectedValueOnce(new Error("quota"));
  await useStore.getState().undo();
  expect(useStore.getState()).toMatchObject({ readonly: true, saved: "error" });
  await useStore.getState().discard();
  expect(useStore.getState().doc).toBe(confirmed.doc);
  expect(useStore.getState().history).toBe(confirmed.history);
  expect(useStore.getState()).toMatchObject({
    readonly: false,
    saved: "saved",
  });
});
