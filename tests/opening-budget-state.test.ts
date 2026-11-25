import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("../src/persistence/remote", () => ({
  saveProject: vi.fn(),
  loadProject: vi.fn(),
  checkRevision: vi.fn(),
  forgetProject: vi.fn(),
  pendingErrorKind: () => "falhou",
}));
import { saveProject, checkRevision } from "../src/persistence/remote";
import { createProject, makeWall } from "../src/domain/project";
import { withOpeningPrice, openingOption } from "../src/domain/opening-budget";
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
  const d = createProject(
    "Esquadrias",
    { length: 2000, width: 1000, height: 1000 },
    30000,
  );
  d.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      { x: 40000, y: 0 },
      1000,
      d.model.floors[0].id,
      30000,
      1,
    )!,
  ];
  d.model.openings = [
    {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "door",
      appearance: { type: "swing", orientation: 0 },
      offset: 10000,
      width: 8000,
      height: 21000,
      base: 0,
    },
  ];
  await state().open(d, true);
  save.mockClear();
});
afterEach(async () => {
  await vi.runAllTimersAsync();
  state().close();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.useRealTimers();
});
it("material e preço salvam com histórico e undo/redo sem motor ou alteração de diagnóstico", async () => {
  const generated = state().doc!.generated,
    diagnostics = state().doc!.generationState;
  const generate = vi.spyOn(engine, "generate");
  const d = state().doc!;
  await state().commit(
    {
      ...d,
      model: {
        ...d.model,
        openings: d.model.openings.map((o) => ({
          ...o,
          material: { kind: "wood-solid" as const },
        })),
      },
    },
    "budget",
  );
  await vi.runAllTimersAsync();
  await state().commit(
    withOpeningPrice(
      state().doc!,
      openingOption(state().doc!.model.openings[0]),
      50000,
    ),
    "budget",
  );
  await vi.runAllTimersAsync();
  expect(state().history.past).toHaveLength(2);
  expect(state().doc!.generated).toEqual(generated);
  expect(state().doc!.generationState).toEqual(diagnostics);
  await state().undo();
  await vi.runAllTimersAsync();
  expect(state().doc!.project.openingPrices).toBeUndefined();
  await state().undo();
  await vi.runAllTimersAsync();
  expect(state().doc!.model.openings[0].material).toBeUndefined();
  await state().undo(true);
  await vi.runAllTimersAsync();
  await state().undo(true);
  await vi.runAllTimersAsync();
  expect(state().doc!.project.openingPrices?.[0].price).toBe(50000);
  expect(generate).not.toHaveBeenCalled();
});
it("resposta atrasada não substitui material posterior e falha preserva arquivo/descarte", async () => {
  let resolve!: (r: typeof receipt) => void;
  save.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const change = async (kind: "wood-glass" | "aluminium") => {
    const d = state().doc!;
    await state().commit(
      {
        ...d,
        model: {
          ...d.model,
          openings: d.model.openings.map((o) => ({ ...o, material: { kind } })),
        },
      },
      "budget",
    );
  };
  await change("wood-glass");
  await change("aluminium");
  expect(state().busy).toBe(false);
  resolve(receipt);
  await vi.runAllTimersAsync();
  expect(state().doc!.model.openings[0].material?.kind).toBe("aluminium");
  save.mockRejectedValueOnce(new Error("recusa"));
  await state().commit(
    withOpeningPrice(
      state().doc!,
      openingOption(state().doc!.model.openings[0]),
      30000,
    ),
    "budget",
  );
  await vi.runAllTimersAsync();
  expect(state().readonly).toBe(true);
  expect(
    parseFile(serializeFile(state().doc!).text).project.openingPrices?.[0]
      .price,
  ).toBe(30000);
  await state().discard();
  expect(state().doc!.project.openingPrices).toBeUndefined();
  expect(state().doc!.model.openings[0].material?.kind).toBe("aluminium");
});
