import { beforeEach, expect, it, vi } from "vitest";
import { createProject, makeWall, type Project } from "../src/domain/project";
import * as engine from "../src/domain/composition";
vi.mock("../src/persistence/database", () => ({
  saveProject: vi.fn().mockResolvedValue(1),
  loadProject: vi.fn(),
  acquireProject: vi.fn().mockResolvedValue(() => {}),
}));
import { saveProject, acquireProject } from "../src/persistence/database";
import { useStore } from "../src/state/store";
import { putOpening, removeElement } from "../src/domain/openings";
import { suppressBand, restoreBand } from "../src/domain/channels";
const save = vi.mocked(saveProject);
async function channelProject() {
  const d = await opened();
  await useStore.getState().commit({
    ...d,
    project: {
      ...d.project,
      channelLevels: [{ id: crypto.randomUUID(), top: 1400 }],
    },
  });
  save.mockClear();
  return useStore.getState().doc!;
}
it("M3.2 supressão/restauração e histórico conservam identidade e outras fiadas", async () => {
  const d = await channelProject(),
    wallId = d.model.walls[0].id;
  await useStore.getState().commit(suppressBand(d, wallId, 1400));
  const suppressed = useStore.getState().doc!;
  expect(
    suppressed.generated!.courses[1].pieces.every(
      (p) => p.kind === "whole" || p.kind === "half",
    ),
  ).toBe(true);
  expect(suppressed.generated!.courses[0]).toEqual(d.generated!.courses[0]);
  await useStore.getState().commit(restoreBand(suppressed, wallId, 1400));
  await useStore.getState().undo();
  expect(useStore.getState().doc!.adjustments.channels).toEqual(
    suppressed.adjustments.channels,
  );
  await useStore.getState().undo();
  expect(useStore.getState().doc!.generated).toEqual(d.generated);
  await useStore.getState().undo(true);
  expect(useStore.getState().doc!.adjustments.channels).toEqual(
    suppressed.adjustments.channels,
  );
});
it("M3.2 falha do motor preserva supressão e retry recompõe; segundo save preserva restauração", async () => {
  const d = await channelProject(),
    wallId = d.model.walls[0].id;
  vi.spyOn(engine, "generate").mockImplementationOnce(() => {
    throw new Error("canaleta simulada");
  });
  await useStore.getState().commit(suppressBand(d, wallId, 1400));
  expect(useStore.getState()).toMatchObject({ busy: false, saved: "saved" });
  expect(useStore.getState().doc!.adjustments.channels).toHaveLength(1);
  expect(useStore.getState().doc!.generationState.status).toBe("outdated");
  await useStore.getState().retry();
  expect(useStore.getState().doc!.generated!.channels).toEqual([]);
  save.mockResolvedValueOnce("ok").mockRejectedValueOnce(new Error("quota"));
  await useStore
    .getState()
    .commit(restoreBand(useStore.getState().doc!, wallId, 1400));
  expect(useStore.getState()).toMatchObject({ busy: false, saved: "error" });
  expect(useStore.getState().doc!.generated!.channels).toHaveLength(1);
  await useStore.getState().retry();
  expect(useStore.getState().saved).toBe("saved");
});
it("M3.2 excluir parede remove supressão dependente na mesma operação desfazível", async () => {
  const d = await channelProject();
  await useStore.getState().commit(suppressBand(d, d.model.walls[0].id, 1400));
  const previous = useStore.getState().doc!;
  await useStore
    .getState()
    .commit({ ...previous, model: { ...previous.model, walls: [] } });
  expect(useStore.getState().doc!.adjustments.channels).toEqual([]);
  await useStore.getState().undo();
  expect(useStore.getState().doc!.adjustments.channels).toEqual(
    previous.adjustments.channels,
  );
});
function editWall(d: Project, name: string): Project {
  return {
    ...d,
    project: { ...d.project, name },
    model: {
      ...d.model,
      walls: d.model.walls.map((w) => ({
        ...w,
        height: w.height + d.project.base.height,
      })),
    },
  };
}
it("RF-09 nome/seleção/câmera e desfazer nome não geram peças novamente", async () => {
  const d = await opened(),
    spy = vi.spyOn(engine, "generate");
  await useStore
    .getState()
    .commit({ ...d, project: { ...d.project, name: "Renomeado" } });
  useStore.getState().choose(d.model.walls[0].id);
  useStore.getState().inspect({ focus: { x: 2500, y: 2500 } });
  expect(spy).not.toHaveBeenCalled();
  expect(save).toHaveBeenCalledTimes(1);
  expect(useStore.getState().doc!.generated).toEqual(d.generated);
  await useStore.getState().undo();
  expect(spy).not.toHaveBeenCalled();
  expect(useStore.getState().doc!.project.name).toBe(d.project.name);
});
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
  await useStore.getState().commit(editWall(d, "Editado"));
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
it("falha da primeira gravação conserva memória e continua cálculo; retry recupera", async () => {
  const d = await opened();
  save.mockRejectedValue(new Error("quota"));
  await useStore.getState().commit(editWall(d, "Em memória"));
  expect(save).toHaveBeenCalledTimes(2);
  expect(useStore.getState()).toMatchObject({ busy: false, saved: "error" });
  expect(useStore.getState().doc!.project.name).toBe("Em memória");
  expect(useStore.getState().doc!.generationState.status).toBe("current");
  save.mockResolvedValue("ok");
  await useStore.getState().retry();
  expect(useStore.getState().saved).toBe("saved");
  expect(useStore.getState().message).toBe("");
});
it("falha na gravação do resultado mantém composição atual em memória", async () => {
  const d = await opened();
  save.mockResolvedValueOnce("ok").mockRejectedValueOnce(new Error("quota"));
  await useStore.getState().commit(editWall(d, "Segundo save"));
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
  await useStore.getState().commit(editWall(d, "Falha motor"));
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
  const pending = useStore.getState().commit(editWall(d, "Primeira"));
  await useStore.getState().commit(editWall(d, "Segunda"));
  expect(useStore.getState().doc!.project.name).toBe("Primeira");
  release();
  await pending;
  expect(save).toHaveBeenCalledTimes(2);
});
it("excluir parede remove ajuste na mesma operação; desfazer recupera escolha", async () => {
  const d = await opened();
  const modelWalls = [
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
  await useStore
    .getState()
    .commit({ ...d, model: { ...d.model, walls: modelWalls } });
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

it("M3.1 edição/exclusão e histórico restauram IDs e configurações", async () => {
  const d = await opened(),
    o = {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "door" as const,
      offset: 2500,
      width: 2500,
      base: 0,
      height: 700,
    };
  await useStore.getState().commit(putOpening(d, o));
  expect(save.mock.calls.map((c) => c[0].generationState.status)).toEqual([
    "outdated",
    "current",
  ]);
  expect(useStore.getState().doc!.model.openings).toEqual([o]);
  await useStore
    .getState()
    .commit(removeElement(useStore.getState().doc!, o.id));
  await useStore.getState().undo();
  expect(useStore.getState().doc!.model.openings).toEqual([o]);
  const current = useStore.getState().doc!;
  await useStore.getState().commit({
    ...current,
    project: {
      ...current.project,
      openingSettings: { base: 9800, top: 21000 },
    },
  });
  expect(useStore.getState().doc!.model.openings).toEqual([o]);
  await useStore.getState().undo();
  expect(useStore.getState().doc!.project.openingSettings).toEqual({
    base: 11200,
    top: 21700,
  });
});
it("M3.1 falha do motor após inserir conserva abertura e libera controles", async () => {
  const d = await opened(),
    o = {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "door" as const,
      offset: 2500,
      width: 2500,
      base: 0,
      height: 700,
    };
  vi.spyOn(engine, "generate").mockImplementationOnce(() => {
    throw new Error("falha de vão simulada");
  });
  await useStore.getState().commit(putOpening(d, o));
  expect(useStore.getState()).toMatchObject({ busy: false, saved: "saved" });
  expect(useStore.getState().doc!.generationState.status).toBe("outdated");
  expect(useStore.getState().doc!.model.openings).toEqual([o]);
  await useStore.getState().retry();
  expect(useStore.getState().doc!.generationState.status).toBe("current");
});
it("M3.1 segunda gravação preserva abertura e recuperação da primeira registra salvo real", async () => {
  const d = await opened(),
    o = {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "door" as const,
      offset: 2500,
      width: 2500,
      base: 0,
      height: 700,
    };
  save.mockResolvedValueOnce("ok").mockRejectedValueOnce(new Error("quota"));
  await useStore.getState().commit(putOpening(d, o));
  expect(useStore.getState()).toMatchObject({ busy: false, saved: "error" });
  expect(useStore.getState().doc!.model.openings).toEqual([o]);
  expect(useStore.getState().doc!.generationState.status).toBe("current");
  save.mockResolvedValue("ok");
  await useStore.getState().retry();
  const current = useStore.getState().doc!;
  save.mockRejectedValueOnce(new Error("quota"));
  await useStore.getState().commit(putOpening(current, { ...o, width: 3750 }));
  expect(useStore.getState().saved).toBe("saved");
  expect(useStore.getState().doc!.model.openings[0].width).toBe(3750);
});
