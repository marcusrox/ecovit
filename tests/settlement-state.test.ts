import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("../src/persistence/remote", () => ({
  saveProject: vi.fn(),
  loadProject: vi.fn(),
  checkRevision: vi.fn(),
  forgetProject: vi.fn(),
  pendingErrorKind: () => "falhou",
}));
import { saveProject, checkRevision } from "../src/persistence/remote";
import { createProject } from "../src/domain/project";
import { useStore } from "../src/state/store";
import * as engine from "../src/domain/composition";
import { parseFile, serializeFile } from "../src/persistence/files";
const state = () => useStore.getState();
const save = vi.mocked(saveProject);
const receipt = { revision: "2" } as Awaited<ReturnType<typeof saveProject>>;
beforeEach(async () => {
  vi.useFakeTimers();
  save.mockResolvedValue(receipt);
  vi.mocked(checkRevision).mockResolvedValue(undefined);
  await state().open(
    createProject("Assentamento", { length: 2000, width: 1000, height: 1000 }),
    true,
  );
  save.mockClear();
});
afterEach(async () => {
  await vi.runAllTimersAsync();
  state().close();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.useRealTimers();
});
async function edit(percent: number, price?: number) {
  const d = state().doc!;
  await state().commit(
    {
      ...d,
      project: { ...d.project, settlement: { ac1: { percent, price } } },
    },
    "budget",
  );
}
it("parâmetros de assentamento têm histórico, undo/redo e salvamento sem motor", async () => {
  const generated = state().doc!.generated,
    diagnostics = state().doc!.generationState;
  const generate = vi.spyOn(engine, "generate");
  await edit(10000, 3000);
  await vi.runAllTimersAsync();
  expect(state().history.past).toHaveLength(1);
  expect(state().doc!.generated).toEqual(generated);
  expect(state().doc!.generationState).toEqual(diagnostics);
  await state().undo();
  await vi.runAllTimersAsync();
  expect(state().doc!.project.settlement).toBeUndefined();
  await state().undo(true);
  await vi.runAllTimersAsync();
  expect(state().doc!.project.settlement).toEqual({
    ac1: { percent: 10000, price: 3000 },
  });
  expect(generate).not.toHaveBeenCalled();
  expect(state().saved).toBe("saved");
});
it("resposta atrasada preserva parâmetros posteriores e falha conserva download/descarte coerentes", async () => {
  let resolve!: (r: typeof receipt) => void;
  save.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  await edit(5000);
  await edit(10000, 3000);
  expect(state().busy).toBe(false);
  expect(state().saved).toBe("saving");
  resolve(receipt);
  await vi.runAllTimersAsync();
  expect(state().doc!.project.settlement?.ac1?.percent).toBe(10000);
  expect(state().history.past).toHaveLength(2);
  save.mockRejectedValueOnce(new Error("recusa"));
  await edit(2500, 4000);
  await vi.runAllTimersAsync();
  expect(state().readonly).toBe(true);
  expect(
    parseFile(serializeFile(state().doc!).text).project.settlement?.ac1,
  ).toEqual({ percent: 2500, price: 4000 });
  await state().discard();
  expect(state().doc!.project.settlement?.ac1).toEqual({
    percent: 10000,
    price: 3000,
  });
  expect(state().history.future).toEqual([]);
});
