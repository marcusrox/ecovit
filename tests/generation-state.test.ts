import { beforeEach, expect, it, vi } from "vitest";
import { createProject, makeWall } from "../src/domain/project";
import * as engine from "../src/domain/composition";
vi.mock("../src/persistence/database", () => ({
  saveProject: vi.fn().mockResolvedValue(1),
  loadProject: vi.fn(),
  acquireProject: vi.fn().mockResolvedValue(() => {}),
}));
import { saveProject, acquireProject } from "../src/persistence/database";
import { useStore } from "../src/state/store";
const save = vi.mocked(saveProject);
beforeEach(() => {
  vi.restoreAllMocks();
  vi.mocked(acquireProject).mockResolvedValue(() => {});
  useStore.setState({ busy: false });
  useStore.getState().close();
  save.mockReset().mockResolvedValue("ok");
});
async function opened() {
  const d = createProject("Estado", { length: 2500, width: 1250, height: 700 });
  d.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      { x: 10000, y: 0 },
      1250,
      d.model.floors[0].id,
      2100,
      1,
    )!,
  ];
  await useStore.getState().open(d, true);
  expect(useStore.getState().message).toBe("");
  expect(useStore.getState().doc).not.toBeNull();
  save.mockClear();
  return useStore.getState().doc!;
}
it("salva modelo desatualizado antes do resultado; histórico sem peças", async () => {
  const d = await opened();
  await useStore
    .getState()
    .commit({ ...d, project: { ...d.project, name: "Editado" } });
  expect(useStore.getState().message).toBe("");
  expect(save.mock.calls.map((c) => c[0].generationState.status)).toEqual([
    "outdated",
    "current",
  ]);
  expect(useStore.getState().history.past[0].generated).toBeNull();
  await useStore.getState().undo();
  expect(useStore.getState().doc!.project.name).toBe("Estado");
  expect(useStore.getState().doc!.generationState.status).toBe("current");
});
it("falha da primeira gravação conserva memória e resultado antigo; retry recupera", async () => {
  const d = await opened();
  save.mockRejectedValueOnce(new Error("quota"));
  await useStore
    .getState()
    .commit({ ...d, project: { ...d.project, name: "Em memória" } });
  expect(save).toHaveBeenCalledTimes(1);
  expect(useStore.getState()).toMatchObject({ busy: false, saved: "error" });
  expect(useStore.getState().doc!.project.name).toBe("Em memória");
  expect(useStore.getState().doc!.generationState.status).toBe("outdated");
  await useStore.getState().retry();
  expect(useStore.getState().saved).toBe("saved");
  expect(useStore.getState().message).toBe("");
});
it("falha na gravação do resultado mantém composição atual em memória", async () => {
  const d = await opened();
  save.mockResolvedValueOnce("ok").mockRejectedValueOnce(new Error("quota"));
  await useStore
    .getState()
    .commit({ ...d, project: { ...d.project, name: "Segundo save" } });
  expect(useStore.getState()).toMatchObject({ busy: false, saved: "error" });
  expect(useStore.getState().doc!.generationState.status).toBe("current");
  await useStore.getState().retry();
  expect(useStore.getState().saved).toBe("saved");
});
it("falha do motor salva modelo e libera controles com resultado desatualizado", async () => {
  const d = await opened();
  vi.spyOn(engine, "generate").mockImplementationOnce(() => {
    throw new Error("falha simulada");
  });
  await useStore
    .getState()
    .commit({ ...d, project: { ...d.project, name: "Falha motor" } });
  expect(useStore.getState()).toMatchObject({ busy: false, saved: "saved" });
  expect(useStore.getState().doc!.generationState.status).toBe("outdated");
  expect(save).toHaveBeenCalledTimes(1);
  await useStore.getState().retry();
  expect(useStore.getState().doc!.generationState.status).toBe("current");
});
it("não aceita segunda edição enquanto grava; não cria fila", async () => {
  const d = await opened();
  let release!: () => void;
  save.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = () => resolve("ok");
      }),
  );
  const pending = useStore
    .getState()
    .commit({ ...d, project: { ...d.project, name: "Primeira" } });
  await useStore
    .getState()
    .commit({ ...d, project: { ...d.project, name: "Segunda" } });
  expect(useStore.getState().doc!.project.name).toBe("Primeira");
  release();
  await pending;
  expect(save).toHaveBeenCalledTimes(2);
});
it("excluir parede remove ajuste na mesma operação; desfazer recupera escolha", async () => {
  const d = await opened();
  d.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      { x: 3750, y: 0 },
      1250,
      d.model.floors[0].id,
      2100,
      1,
    )!,
    makeWall(
      { x: 0, y: 0 },
      { x: 0, y: 3750 },
      1250,
      d.model.floors[0].id,
      2100,
      1,
    )!,
  ];
  await useStore.getState().commit(d);
  const current = useStore.getState().doc!,
    c = current.generated!.components[0];
  await useStore.getState().commit({
    ...current,
    adjustments: {
      ...current.adjustments,
      junctions: [
        {
          componentId: c.id,
          signature: c.signature,
          wallIds: c.wallIds,
          phase: 1,
        },
      ],
    },
  });
  const chosen = useStore.getState().doc!;
  await useStore.getState().commit({
    ...chosen,
    model: { ...chosen.model, walls: chosen.model.walls.slice(0, 1) },
  });
  expect(useStore.getState().doc!.adjustments.junctions).toEqual([]);
  await useStore.getState().undo();
  expect(useStore.getState().doc!.adjustments.junctions[0].phase).toBe(1);
});
