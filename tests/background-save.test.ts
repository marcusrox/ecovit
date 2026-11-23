import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("../src/persistence/remote", () => ({
  saveProject: vi.fn(),
  loadProject: vi.fn(),
  checkRevision: vi.fn(),
  forgetProject: vi.fn(),
  pendingErrorKind: (e: Error) =>
    e.message === "incerto" ? "incerto" : "falhou",
}));
import {
  saveProject,
  loadProject,
  checkRevision,
} from "../src/persistence/remote";
import { createProject, makeWall } from "../src/domain/project";
import { catalogItem } from "../src/domain/image-catalog";
import { standardElement, setImageElement } from "../src/domain/image-elements";
import * as engine from "../src/domain/composition";
import { useStore } from "../src/state/store";
import { serializeFile, parseFile } from "../src/persistence/files";

const state = () => useStore.getState();
const save = vi.mocked(saveProject);
const receipt = {
  projectId: "test",
  operationId: "operation",
  revision: "2",
  updatedAt: "2026-11-23T12:00:00Z",
};
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
async function flush() {
  await vi.advanceTimersByTimeAsync(0);
}
async function move(x: number) {
  const d = state().doc!,
    element = d.model.imageElements[0];
  await state().commit(setImageElement(d, { ...element, x }), "furniture");
}
beforeEach(async () => {
  vi.useFakeTimers();
  vi.mocked(checkRevision).mockResolvedValue(undefined);
  save.mockImplementation(async (_doc, started) => {
    started?.();
    return receipt;
  });
  const d = createProject("Segundo plano", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  d.model.imageElements = [
    standardElement(catalogItem("sofa", 1)!, d.model.floors[0].id),
  ];
  vi.mocked(loadProject).mockResolvedValue(d);
  await state().open(d.project.id);
  save.mockClear();
});
afterEach(async () => {
  await vi.runAllTimersAsync();
  state().close();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.useRealTimers();
});
it("aceita gestos locais, consolida envios e mantém histórico/checkpoint do pedido capturado", async () => {
  const first = deferred<typeof receipt>();
  save.mockImplementationOnce((_doc, started) => {
    started?.();
    return first.promise;
  });
  const generated = state().doc!.generated;
  const generate = vi.spyOn(engine, "generate");
  await move(1000);
  expect(save).toHaveBeenCalledTimes(1);
  expect(state()).toMatchObject({ busy: false, saving: true, saved: "saving" });
  await move(2000);
  await move(3000);
  const local = state().doc,
    history = state().history;
  state().inspect({
    focus: { x: 10, y: 20 },
    furnitureDraft: { element: { ...local!.model.imageElements[0], x: 4000 } },
  });
  await state().undo();
  await state().undo(true);
  await state().recalculate();
  state().close();
  await state().open("other");
  expect(state().doc).toBe(local);
  expect(state().history).toBe(history);
  first.resolve(receipt);
  await flush();
  expect(state().doc).toBe(local);
  expect(state().furnitureDraft).not.toBeNull();
  expect(state().focus).toEqual({ x: 10, y: 20 });
  expect(state().saved).toBe("saving");
  await vi.advanceTimersByTimeAsync(999);
  expect(save).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[0][0].model.imageElements[0].x).toBe(1000);
  expect(save.mock.calls[1][0].model.imageElements[0].x).toBe(3000);
  expect(state().history.past).toHaveLength(3);
  expect(state().doc!.generated).toEqual(generated);
  expect(generate).not.toHaveBeenCalled();
  expect(state().saved).toBe("saved");
  state().inspect({ furnitureDraft: null });
  await state().undo();
  expect(state().doc!.model.imageElements[0].x).toBe(2000);
  await vi.advanceTimersByTimeAsync(1000);
  await state().undo(true);
  expect(state().doc!.model.imageElements[0].x).toBe(3000);
  await vi.advanceTimersByTimeAsync(1000);
  expect(save).toHaveBeenCalledTimes(4);
  await vi.advanceTimersByTimeAsync(5000);
  expect(save).toHaveBeenCalledTimes(4);
});
it("não acrescenta espera quando a resposta levou mais de um segundo", async () => {
  const first = deferred<typeof receipt>();
  save.mockImplementationOnce((_doc, started) => {
    started?.();
    return first.promise;
  });
  await move(1000);
  await move(2000);
  await vi.advanceTimersByTimeAsync(1500);
  first.resolve(receipt);
  await flush();
  expect(save).toHaveBeenCalledTimes(2);
  expect(state().saved).toBe("saved");
});
it("a preparação ocupa o envio antes de uploads e inicia a cadência somente no PUT", async () => {
  const preparation = deferred<void>(),
    first = deferred<typeof receipt>();
  save.mockImplementationOnce(async (_doc, started) => {
    await preparation.promise;
    started?.();
    return first.promise;
  });
  await move(1000);
  await vi.advanceTimersByTimeAsync(2000);
  await move(2000);
  expect(save).toHaveBeenCalledTimes(1);
  preparation.resolve();
  await flush();
  first.resolve(receipt);
  await flush();
  await vi.advanceTimersByTimeAsync(999);
  expect(save).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(save).toHaveBeenCalledTimes(2);
});
it("transição construtiva bloqueia imediatamente e só calcula após confirmação integral", async () => {
  const first = deferred<typeof receipt>(),
    second = deferred<typeof receipt>();
  save.mockImplementationOnce((_doc, started) => {
    started?.();
    return first.promise;
  });
  save.mockImplementationOnce((_doc, started) => {
    started?.();
    return second.promise;
  });
  await move(1000);
  await move(2000);
  const d = state().doc!;
  const generate = vi.spyOn(engine, "generate");
  const committed = state().commit({
    ...d,
    model: {
      ...d.model,
      walls: [
        makeWall(
          { x: 0, y: 0 },
          { x: 10000, y: 0 },
          1250,
          d.model.floors[0].id,
          2100,
          1,
        )!,
      ],
    },
  });
  expect(state().busy).toBe(true);
  await move(3000);
  expect(state().doc!.model.imageElements[0].x).toBe(2000);
  expect(generate).not.toHaveBeenCalled();
  first.resolve(receipt);
  await vi.advanceTimersByTimeAsync(1000);
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[1][0].model.imageElements[0].x).toBe(2000);
  expect(generate).not.toHaveBeenCalled();
  second.resolve(receipt);
  await committed;
  expect(generate).toHaveBeenCalledTimes(1);
  expect(state()).toMatchObject({ busy: false, saved: "saved" });
});
it.each(["falhou", "incerto"])(
  "%s preserva pedido e posterior; retry não libera edição entre confirmações",
  async (message) => {
    const first = deferred<typeof receipt>();
    save.mockImplementationOnce((_doc, started) => {
      started?.();
      return first.promise;
    });
    await move(1000);
    await move(2000);
    const history = state().history;
    first.reject(new Error(message));
    await flush();
    expect(state()).toMatchObject({ readonly: true, saving: false });
    await move(3000);
    expect(state().history).toBe(history);
    const original = deferred<typeof receipt>(),
      latest = deferred<typeof receipt>();
    save.mockImplementationOnce(() => original.promise);
    save.mockImplementationOnce((_doc, started) => {
      started?.();
      return latest.promise;
    });
    const recovery = state().retry();
    expect(save.mock.calls[1][0]).toBe(save.mock.calls[0][0]);
    original.resolve(receipt);
    await vi.advanceTimersByTimeAsync(1000);
    expect(state()).toMatchObject({
      busy: true,
      readonly: true,
      saved: "saving",
    });
    expect(save.mock.calls[2][0].model.imageElements[0].x).toBe(2000);
    latest.resolve(receipt);
    await recovery;
    expect(state()).toMatchObject({
      busy: false,
      readonly: false,
      saved: "saved",
    });
    expect(state().history).toBe(history);
  },
);
it("offline suspende sequência; confirmação atrasada avança só checkpoint e descarte restaura suas pilhas", async () => {
  const first = deferred<typeof receipt>();
  save.mockImplementationOnce((_doc, started) => {
    started?.();
    return first.promise;
  });
  await move(1000);
  await move(2000);
  state().suspend();
  first.resolve(receipt);
  await flush();
  await vi.advanceTimersByTimeAsync(2000);
  expect(save).toHaveBeenCalledTimes(1);
  expect(state()).toMatchObject({ saved: "unavailable", readonly: true });
  expect(state().doc!.model.imageElements[0].x).toBe(2000);
  await state().discard();
  // Direct discard is available to the existing explicit-discard flow.
  expect(state().doc!.model.imageElements[0].x).toBe(1000);
  expect(state().history.past).toHaveLength(1);
  expect(state().history.future).toHaveLength(0);
});
it("retry não construtivo conserva resultado desatualizado sem chamar motor", async () => {
  const d = state().doc!;
  useStore.setState({
    doc: {
      ...d,
      generated: null,
      generationState: { status: "outdated", diagnostics: [] },
    },
  });
  const generate = vi.spyOn(engine, "generate");
  save.mockRejectedValueOnce(new Error("rejeição"));
  await move(1000);
  await flush();
  await state().retry();
  expect(generate).not.toHaveBeenCalled();
  expect(state().doc!.generationState.status).toBe("outdated");
  await state().recalculate();
  expect(generate).toHaveBeenCalledTimes(1);
  expect(save).toHaveBeenCalledTimes(2);
});

it("falha anterior preserva candidato construtivo; recuperação calcula só depois do envio posterior", async () => {
  const first = deferred<typeof receipt>();
  save.mockImplementationOnce((_doc, started) => {
    started?.();
    return first.promise;
  });
  await move(1000);
  const d = state().doc!,
    generate = vi.spyOn(engine, "generate");
  const construction = state().commit({
    ...d,
    model: {
      ...d.model,
      walls: [
        makeWall(
          { x: 0, y: 0 },
          { x: 10000, y: 0 },
          1250,
          d.model.floors[0].id,
          2100,
          1,
        )!,
      ],
    },
  });
  first.reject(new Error("incerto"));
  await construction;
  expect(generate).not.toHaveBeenCalled();
  const original = deferred<typeof receipt>();
  save.mockImplementationOnce(() => original.promise);
  const recovery = state().retry();
  original.resolve(receipt);
  await vi.advanceTimersByTimeAsync(1000);
  await recovery;
  expect(save).toHaveBeenCalledTimes(3);
  expect(generate).toHaveBeenCalledTimes(1);
  expect(state().doc!.model.imageElements[0].x).toBe(1000);
  expect(state().doc!.model.walls).toHaveLength(1);
});

it("offline após intenção construtiva confirmada não repete gravação só para calcular", async () => {
  const first = deferred<typeof receipt>();
  save.mockImplementationOnce((_doc, started) => {
    started?.();
    return first.promise;
  });
  const d = state().doc!,
    generate = vi.spyOn(engine, "generate");
  const construction = state().commit({
    ...d,
    model: {
      ...d.model,
      walls: [
        makeWall(
          { x: 0, y: 0 },
          { x: 10000, y: 0 },
          1250,
          d.model.floors[0].id,
          2100,
          1,
        )!,
      ],
    },
  });
  state().suspend();
  first.resolve(receipt);
  await construction;
  expect(generate).not.toHaveBeenCalled();
  expect(state()).toMatchObject({ readonly: true, saved: "unavailable" });
  await state().retry();
  expect(checkRevision).toHaveBeenCalledTimes(1);
  expect(generate).toHaveBeenCalledTimes(1);
  expect(save).toHaveBeenCalledTimes(1);
  expect(state()).toMatchObject({ readonly: false, saved: "saved" });
});

it("consolidação mantém 50 intenções e não reinicia cadência durante movimentos contínuos", async () => {
  const first = deferred<typeof receipt>();
  save.mockImplementationOnce((_doc, started) => {
    started?.();
    return first.promise;
  });
  await move(1000);
  for (let i = 2; i <= 60; i++) await move(i * 1000);
  expect(save).toHaveBeenCalledTimes(1);
  expect(state().history.past).toHaveLength(50);
  first.resolve(receipt);
  await flush();
  for (let i = 0; i < 9; i++) {
    await vi.advanceTimersByTimeAsync(100);
    await move(61000 + i * 1000);
  }
  await vi.advanceTimersByTimeAsync(100);
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[1][0].model.imageElements[0].x).toBe(69000);
});

it("rejeição posterior restaura checkpoint anterior com histórico capturado, sem refazer descartados", async () => {
  const first = deferred<typeof receipt>();
  save.mockImplementationOnce((_doc, started) => {
    started?.();
    return first.promise;
  });
  save.mockRejectedValueOnce(new Error("recusado"));
  await move(1000);
  await move(2000);
  await move(3000);
  first.resolve(receipt);
  await vi.advanceTimersByTimeAsync(1000);
  await state().discard();
  expect(state().doc!.model.imageElements[0].x).toBe(1000);
  expect(state().history.past).toHaveLength(1);
  expect(state().history.future).toHaveLength(0);
});

it("recuperação em repouso permite voltar a salvar; nova desconexão durante conferência não retoma envios", async () => {
  state().suspend();
  await state().retry();
  await move(1000);
  await flush();
  expect(state().saved).toBe("saved");
  expect(save).toHaveBeenCalledTimes(1);
  state().suspend();
  const revision = deferred<void>();
  vi.mocked(checkRevision).mockImplementationOnce(() => revision.promise);
  const retry = state().retry();
  state().suspend();
  revision.resolve();
  await retry;
  expect(state()).toMatchObject({ readonly: true, saved: "unavailable" });
  expect(save).toHaveBeenCalledTimes(1);
});

it("substituição de imagem preserva recursos enviados, download local e checkpoint recuperável", async () => {
  const first = deferred<typeof receipt>();
  save.mockImplementationOnce((_doc, started) => {
    started?.();
    return first.promise;
  });
  save.mockRejectedValueOnce(new Error("recusado"));
  const asset = {
    id: crypto.randomUUID(),
    name: "primeira.png",
    mime: "image/png" as const,
    width: 1,
    height: 1,
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==",
  };
  const d = state().doc!,
    element = d.model.imageElements[0];
  await state().commit(
    {
      ...d,
      model: {
        ...d.model,
        customImageAssets: [asset],
        imageElements: [
          { ...element, source: { kind: "custom", assetId: asset.id } },
        ],
      },
    },
    "furniture",
  );
  const replacement = {
    ...asset,
    id: crypto.randomUUID(),
    name: "substituta.png",
  };
  const local = state().doc!;
  await state().commit(
    {
      ...local,
      model: {
        ...local.model,
        customImageAssets: [replacement],
        imageElements: [
          { ...element, source: { kind: "custom", assetId: replacement.id } },
        ],
      },
    },
    "furniture",
  );
  expect(
    parseFile(serializeFile(state().doc!).text).model.customImageAssets,
  ).toEqual([replacement]);
  expect(save.mock.calls[0][0].model.customImageAssets).toEqual([asset]);
  first.resolve(receipt);
  await vi.advanceTimersByTimeAsync(1000);
  expect(state().readonly).toBe(true);
  expect(
    parseFile(serializeFile(state().doc!).text).model.customImageAssets,
  ).toEqual([replacement]);
  await state().discard();
  expect(state().doc!.model.customImageAssets).toEqual([asset]);
  expect(state().doc!.model.imageElements[0].source).toEqual({
    kind: "custom",
    assetId: asset.id,
  });
  expect(state().history.past).toHaveLength(1);
  expect(state().history.future).toHaveLength(0);
});
