import { beforeEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
vi.mock("../src/persistence/database", () => ({
  saveProject: vi.fn().mockResolvedValue(1),
  loadProject: vi.fn(),
  acquireProject: vi.fn().mockResolvedValue(() => {}),
}));
import { saveProject, acquireProject } from "../src/persistence/database";
import * as engine from "../src/domain/composition";
import { createProject, makeWall } from "../src/domain/project";
import {
  addFloor,
  editFloor,
  duplicateFloor,
  removeFloor,
} from "../src/domain/floors";
import { useStore } from "../src/state/store";
import { putSlab, translateSlab } from "../src/domain/slabs";
import {
  validateProject,
  parseFile,
  serializeFile,
} from "../src/persistence/files";
const save = vi.mocked(saveProject);
it("revisão M4.2: escolher outro elemento cancela desenho sem salvar ou consumir histórico", async () => {
  const doc = await opened(),
    s = useStore.getState(),
    history = s.history;
  s.choose(doc.model.walls[0].id);
  s.inspect({
    slabEditing: true,
    slabDraft: {
      tool: "select",
      points: [{ x: 0, y: 0 }],
      closed: false,
      thickness: "21",
    },
  });
  s.choose(null);
  expect(useStore.getState().slabDraft).toBeNull();
  expect(useStore.getState().slabEditing).toBe(false);
  expect(useStore.getState().doc).toBe(doc);
  expect(useStore.getState().history).toBe(history);
  expect(save).not.toHaveBeenCalled();
});
it("M4.2 A05/A08/A12 inválido não grava/historiciza; prévia cancela antes do histórico", async () => {
  const d = await opened();
  const slab = {
    id: crypto.randomUUID(),
    floorId: d.model.floors[0].id,
    thickness: 2100,
    contour: [
      { x: 0, y: 0 },
      { x: 10000, y: 0 },
      { x: 10000, y: 10000 },
      { x: 0, y: 10000 },
    ],
    openings: [],
  };
  await useStore.getState().commit(putSlab(d, slab), "slab");
  const s = useStore.getState(),
    before = s.doc!,
    history = s.history;
  save.mockClear();
  const engineSpy = vi.spyOn(engine, "generate");
  await s.commit(
    {
      ...before,
      model: { ...before.model, slabs: [{ ...slab, thickness: 0 }] },
    },
    "slab",
  );
  expect(useStore.getState().doc).toBe(before);
  expect(useStore.getState().history).toBe(history);
  expect(save).not.toHaveBeenCalled();
  expect(engineSpy).not.toHaveBeenCalled();
  s.inspect({
    slabEditing: true,
    slabDraft: { slabId: slab.id, points: [], closed: false, thickness: "21" },
  });
  await s.undo();
  expect(useStore.getState().slabDraft).toBeNull();
  expect(useStore.getState().doc).toBe(before);
  expect(useStore.getState().history).toBe(history);
  await s.undo();
  expect(useStore.getState().doc!.model.slabs).toEqual([]);
  await s.undo(true);
  expect(useStore.getState().doc!.model.slabs).toEqual([slab]);
});
it("M4.2 A10/A12 laje conserva alvenaria/ajustes e falhas não perdem intenção", async () => {
  let d = await opened();
  d = structuredClone(d);
  const floor = d.model.floors[0].id;
  d.adjustments.junctions = [
    {
      id: crypto.randomUUID(),
      floorId: floor,
      anchor: { x: 0, y: 0 },
      binding: "active",
      componentId: "incompatível",
      signature: "incompatível",
      wallIds: [d.model.walls[0].id],
      phase: 1,
    },
  ];
  await useStore.getState().commit(d, "floor");
  d = useStore.getState().doc!;
  const previous = structuredClone(d),
    slab = {
      id: crypto.randomUUID(),
      floorId: floor,
      thickness: 1401,
      contour: [
        { x: 0, y: 0 },
        { x: 10000, y: 0 },
        { x: 10000, y: 10000 },
        { x: 0, y: 10000 },
      ],
      openings: [],
    };
  const spy = vi.spyOn(engine, "generate");
  save.mockClear();
  await useStore.getState().commit(putSlab(d, slab), "slab");
  let current = useStore.getState().doc!;
  expect(current.adjustments).toEqual(previous.adjustments);
  expect(current.model.walls).toEqual(previous.model.walls);
  expect(current.generated).toEqual(previous.generated);
  expect(spy).toHaveBeenCalledTimes(1);
  expect(save).toHaveBeenCalledTimes(2);
  save.mockReset().mockRejectedValue(new Error("quota"));
  await useStore
    .getState()
    .commit(putSlab(current, translateSlab(slab, { x: 1250, y: 0 })), "slab");
  current = useStore.getState().doc!;
  expect(current.model.slabs[0].contour[0].x).toBe(1250);
  expect(useStore.getState().busy).toBe(false);
  expect(useStore.getState().saved).toBe("error");
  expect(parseFile(serializeFile(current).text).model).toEqual(current.model);
  save.mockReset().mockResolvedValue(1);
  spy.mockImplementation(() => {
    throw new Error("motor indisponível");
  });
  await useStore
    .getState()
    .commit(
      putSlab(current, { ...current.model.slabs[0], thickness: 2100 }),
      "slab",
    );
  expect(useStore.getState().doc!.generated).toBeNull();
  expect(useStore.getState().doc!.model.slabs[0].thickness).toBe(2100);
  expect(useStore.getState().busy).toBe(false);
});
beforeEach(() => {
  useStore.setState({ busy: false });
  useStore.getState().close();
  vi.restoreAllMocks();
  save.mockReset().mockResolvedValue(1);
  vi.mocked(acquireProject).mockResolvedValue(() => {});
});
it.each([false, true])(
  "CT-14 atualiza resultado v9 ao abrir, somente leitura=%s",
  async (readonly) => {
    const original = JSON.parse(
      readFileSync(
        new URL("./fixtures/unequal-heights-v9.ecovit", import.meta.url),
        "utf8",
      ),
    );
    if (readonly) vi.mocked(acquireProject).mockResolvedValueOnce(null);
    await useStore.getState().open(original, true);
    const s = useStore.getState();
    expect(s.readonly).toBe(readonly);
    expect(s.doc!.model).toEqual(original.model);
    expect(s.doc!.adjustments).toEqual(original.adjustments);
    expect(s.doc!.generated!.convention).toBe("nominal-v10");
    expect(
      s.doc!.generated!.floors[0].courses[41].pieces.length,
    ).toBeGreaterThan(0);
    expect(s.doc!.generationState.status).toBe("current");
    expect(s.history.past).toEqual([]);
    expect(s.busy).toBe(false);
    expect(original.generated.convention).toBe("nominal-v9");
    if (readonly) expect(save).not.toHaveBeenCalled();
    else expect(save).toHaveBeenCalledTimes(2);
  },
);
it.each([false, true])(
  "CT-14 falha ao atualizar legado conserva desenho acessível, somente leitura=%s",
  async (readonly) => {
    const original = JSON.parse(
      readFileSync(
        new URL("./fixtures/unequal-heights-v9.ecovit", import.meta.url),
        "utf8",
      ),
    );
    if (readonly) vi.mocked(acquireProject).mockResolvedValueOnce(null);
    vi.spyOn(engine, "generate").mockImplementationOnce(() => {
      throw new Error("Falha simulada");
    });
    await useStore.getState().open(original, true);
    const s = useStore.getState();
    expect(s.doc?.model).toEqual(original.model);
    expect(s.doc?.adjustments).toEqual(original.adjustments);
    expect(s.doc?.generated).toBeNull();
    expect(s.doc?.generationState).toEqual({
      status: "outdated",
      diagnostics: [],
    });
    expect(s.readonly).toBe(readonly);
    expect(s.busy).toBe(false);
    expect(s.history).toEqual({ past: [], future: [] });
    expect(s.message).toContain("Cálculo não concluído: Falha simulada");
    expect(parseFile(serializeFile(s.doc!).text).model).toEqual(original.model);
    if (readonly) {
      expect(save).not.toHaveBeenCalled();
      expect(s.message).toContain("outra aba");
    } else {
      expect(save).toHaveBeenCalledTimes(1);
      await s.retry();
      expect(useStore.getState().doc!.generated!.convention).toBe(
        "nominal-v10",
      );
    }
  },
);
async function opened() {
  const d = createProject("Estado pavimentos", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  d.project.channelLevels = [];
  d.project.groutSettings = {
    junctions: false,
    openings: false,
    ends: false,
    intervals: false,
    distance: 10000,
  };
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
  save.mockClear();
  return useStore.getState().doc!;
}
it.each(["intenção", "convenção"])(
  "CT-14 recusa %s inválida antes de substituir o projeto aberto",
  async (invalid) => {
    const before = await opened(),
      original = JSON.parse(
        readFileSync(
          new URL("./fixtures/unequal-heights-v9.ecovit", import.meta.url),
          "utf8",
        ),
      ),
      spy = vi.spyOn(engine, "generate"),
      unlock = vi.fn();
    vi.mocked(acquireProject).mockResolvedValueOnce(unlock);
    if (invalid === "intenção") original.model.slabs[0].thickness = 0;
    else original.generated.convention = "nominal-v11";
    await useStore.getState().open(original, true);
    expect(useStore.getState().doc).toBe(before);
    expect(useStore.getState().busy).toBe(false);
    expect(useStore.getState().readonly).toBe(false);
    expect(unlock).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
    expect(useStore.getState().message).not.toBe("");
  },
);
it("A01/A13 renomeação e histórico de nome não calculam nem guardam peças", async () => {
  const d = await opened(),
    id = d.model.floors[0].id,
    output = d.generated;
  const spy = vi.spyOn(engine, "generate");
  await useStore
    .getState()
    .commit(editFloor(d, id, { name: "Nome novo" }), "floor");
  expect(useStore.getState().doc!.generated).toEqual(output);
  expect(spy).not.toHaveBeenCalled();
  expect(useStore.getState().history.past[0].generated).toBeNull();
  await useStore.getState().undo();
  await useStore.getState().undo(true);
  expect(spy).not.toHaveBeenCalled();
  expect(useStore.getState().doc!.model.floors[0].name).toBe("Nome novo");
  expect(save).toHaveBeenCalledTimes(3);
});
it("A01/A03/A10 renomear preserva escolha incompatível e snapshot reabrível, inclusive no histórico", async () => {
  const d = await opened(),
    f = d.model.floors[0].id;
  d.model.walls.push(
    makeWall({ x: 0, y: 0 }, { x: 0, y: 10000 }, 1250, f, 2100, 1)!,
  );
  const c = engine.generate(d).floors[0].components[0];
  d.adjustments.junctions = [
    {
      id: crypto.randomUUID(),
      floorId: f,
      componentId: c.id,
      signature: "geometria-anterior",
      wallIds: c.wallIds,
      phase: 1,
      binding: "active",
      anchor: { x: c.x, y: c.y },
    },
  ];
  d.generated = engine.generate(d);
  d.generationState = {
    status: "current",
    diagnostics: d.generated.diagnostics,
  };
  expect(() => validateProject(d)).not.toThrow();
  await useStore.getState().open(d, true);
  const spy = vi.spyOn(engine, "generate");
  await useStore
    .getState()
    .commit(
      editFloor(useStore.getState().doc!, f, { name: "Nome novo" }),
      "floor",
    );
  await useStore.getState().undo();
  await useStore.getState().undo(true);
  const renamed = useStore.getState().doc!;
  expect(spy).not.toHaveBeenCalled();
  expect(renamed.adjustments).toEqual(d.adjustments);
  expect(renamed.generated).toEqual(d.generated);
  expect(validateProject(renamed)).toEqual(renamed);
  expect(parseFile(serializeFile(renamed).text)).toEqual(renamed);
});
it.each(["criar", "duplicar", "editar outro"])(
  "A05/A07 %s preserva escolha incompatível na geometria não alterada",
  async (action) => {
    let d = await opened();
    const f = d.model.floors[0].id;
    d.model.walls.push(
      makeWall({ x: 0, y: 0 }, { x: 0, y: 10000 }, 1250, f, 2100, 1)!,
    );
    const c = engine.generate(d).floors[0].components[0];
    d.adjustments.junctions = [
      {
        id: crypto.randomUUID(),
        floorId: f,
        componentId: c.id,
        signature: "geometria-anterior",
        wallIds: c.wallIds,
        phase: 1,
        binding: "active",
        anchor: { x: c.x, y: c.y },
      },
    ];
    if (action === "editar outro") {
      d = addFloor(d, { name: "Outro", level: 28000, defaultHeight: 28000 });
      d.model.walls.push(
        makeWall(
          { x: 0, y: 0 },
          { x: 10000, y: 0 },
          1250,
          d.model.floors[1].id,
          2100,
          1,
        )!,
      );
    }
    d.generated = engine.generate(d);
    d.generationState = {
      status: "current",
      diagnostics: d.generated.diagnostics,
    };
    validateProject(d);
    await useStore.getState().open(d, true);
    const before = useStore.getState().doc!;
    const candidate =
      action === "criar"
        ? addFloor(before, { name: "Novo", level: 28000, defaultHeight: 28000 })
        : action === "duplicar"
          ? duplicateFloor(before, f, 28000, "Cópia")
          : {
              ...before,
              model: {
                ...before.model,
                walls: before.model.walls.map((w) =>
                  w.floorId === f ? w : { ...w, height: 2800 },
                ),
              },
            };
    await useStore
      .getState()
      .commit(candidate, action === "editar outro" ? "resize" : "floor");
    const after = useStore.getState().doc!;
    if (action === "duplicar") {
      expect(after.adjustments.junctions[1].binding).toBe("pending");
      expect(
        after.generated!.floors[1].diagnostics.some(
          (a) => a.code === "adjustment",
        ),
      ).toBe(true);
    }
    expect(after.adjustments.junctions.filter((a) => a.floorId === f)).toEqual(
      before.adjustments.junctions,
    );
    expect(after.generated).toEqual(engine.generate(after));
    expect(parseFile(serializeFile(after).text)).toEqual(after);
    await useStore.getState().undo();
    expect(useStore.getState().doc!.adjustments).toEqual(before.adjustments);
    await useStore.getState().undo(true);
    expect(useStore.getState().doc!.adjustments).toEqual(after.adjustments);
  },
);
it("A05 reconcilia escolha incompatível quando a altura da própria parede muda", async () => {
  const d = await opened();
  const wall = d.model.walls[0];
  d.adjustments.junctions = [
    {
      id: crypto.randomUUID(),
      floorId: wall.floorId,
      componentId: "anterior",
      signature: "geometria-anterior",
      wallIds: [wall.id],
      phase: 1,
      binding: "active",
      anchor: wall.a,
    },
  ];
  d.generated = engine.generate(d);
  d.generationState = {
    status: "current",
    diagnostics: d.generated.diagnostics,
  };
  await useStore.getState().open(d, true);
  const before = useStore.getState().doc!;
  await useStore.getState().commit({
    ...before,
    model: { ...before.model, walls: [{ ...wall, height: 2800 }] },
  });
  expect(useStore.getState().doc!.adjustments.junctions[0].binding).toBe(
    "pending",
  );
});
it("A07/A09 cópia é selecionada, recálculo completo, histórico e última fiada local", async () => {
  const d = await opened(),
    id = d.model.floors[0].id;
  useStore.getState().inspect({ mode: "course", course: 2 });
  const spy = vi.spyOn(engine, "generate");
  await useStore
    .getState()
    .commit(duplicateFloor(d, id, 28000, "Cópia"), "floor");
  const s = useStore.getState(),
    copy = s.activeFloorId!;
  expect(copy).not.toBe(id);
  expect(s.course).toBe(1);
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy.mock.calls[0][0].model.floors).toHaveLength(2);
  s.inspect({ course: 3 });
  s.switchFloor(id);
  expect(useStore.getState().course).toBe(2);
  useStore.getState().switchFloor(copy);
  expect(useStore.getState().course).toBe(3);
  const copyIds = s
    .doc!.model.walls.filter((w) => w.floorId === copy)
    .map((w) => w.id);
  await useStore.getState().undo();
  expect(useStore.getState().activeFloorId).toBe(id);
  expect(useStore.getState().course).toBe(2);
  await useStore.getState().undo(true);
  expect(
    useStore
      .getState()
      .doc!.model.walls.filter((w) => w.floorId === copy)
      .map((w) => w.id),
  ).toEqual(copyIds);
});
it("A09 reduzir altura conserva aviso de fiada após os dois salvamentos", async () => {
  const d = await opened();
  useStore.getState().inspect({ mode: "course", course: 3 });
  await useStore.getState().commit({
    ...d,
    model: {
      ...d.model,
      walls: d.model.walls.map((w) => ({ ...w, height: 1400 })),
    },
  });
  expect(useStore.getState().course).toBe(2);
  expect(useStore.getState().message).toBe(
    "A fiada anterior deixou de existir. Selecionada a fiada 2.",
  );
  expect(useStore.getState().saved).toBe("saved");
  expect(save).toHaveBeenCalledTimes(2);
});
it("A08/A09 remover ativo escolhe anterior; desfazer conserva ativo existente", async () => {
  let d = await opened();
  d = addFloor(d, { name: "Inferior", level: -2100, defaultHeight: 28000 });
  await useStore.getState().commit(d, "floor");
  const low = useStore.getState().activeFloorId!;
  const root = useStore.getState().doc!,
    zero = root.model.floors[1].id;
  useStore.getState().switchFloor(zero);
  await useStore.getState().commit(removeFloor(root, zero), "floor");
  expect(useStore.getState().activeFloorId).toBe(low);
  await useStore.getState().undo();
  expect(useStore.getState().activeFloorId).toBe(low);
  expect(useStore.getState().doc!.model.floors[1].id).toBe(zero);
});
it("A13 falha de cálculo conserva intenção e permite retry; nenhuma composição parcial", async () => {
  const d = await opened();
  vi.spyOn(engine, "generate").mockImplementationOnce(() => {
    throw new Error("Falha simulada");
  });
  await useStore
    .getState()
    .commit(
      addFloor(d, { name: "Novo", level: 28000, defaultHeight: 28000 }),
      "floor",
    );
  let s = useStore.getState();
  expect(s.busy).toBe(false);
  expect(s.doc!.model.floors).toHaveLength(2);
  expect(s.doc!.generated).toBeNull();
  expect(s.doc!.generationState.status).toBe("outdated");
  await s.retry();
  s = useStore.getState();
  expect(s.doc!.generated!.floors).toHaveLength(2);
  expect(s.doc!.generationState.status).toBe("current");
});
it("A11 leitura bloqueada só confere snapshot, sem regenerar/salvar", async () => {
  const d = await opened();
  useStore.getState().close();
  save.mockClear();
  vi.mocked(acquireProject).mockResolvedValueOnce(null);
  const spy = vi.spyOn(engine, "generate");
  await useStore.getState().open(d, true);
  expect(useStore.getState().readonly).toBe(true);
  expect(save).not.toHaveBeenCalled();
  expect(spy).toHaveBeenCalledTimes(1);
  expect(useStore.getState().doc!.generated).toEqual(d.generated);
});
it.each(["first", "second"])(
  "A13 falha da gravação %s mantém memória e libera controles",
  async (which) => {
    const d = await opened();
    if (which === "first") save.mockRejectedValueOnce(new Error("quota"));
    else
      save.mockResolvedValueOnce(1).mockRejectedValueOnce(new Error("quota"));
    await useStore
      .getState()
      .commit(
        addFloor(d, { name: "Novo", level: 28000, defaultHeight: 28000 }),
        "floor",
      );
    const s = useStore.getState();
    expect(s.busy).toBe(false);
    expect(s.doc!.model.floors).toHaveLength(2);
    expect(s.doc!.generationState.status).toBe("current");
    expect(s.saved).toBe(which === "first" ? "saved" : "error");
  },
);
it("A09 seletor não troca pavimento durante operação ocupada", async () => {
  let d = await opened();
  d = addFloor(d, { name: "Outro", level: 28000, defaultHeight: 28000 });
  await useStore.getState().commit(d, "floor");
  const id = useStore.getState().activeFloorId;
  useStore.setState({ busy: true });
  useStore.getState().switchFloor(d.model.floors[0].id);
  expect(useStore.getState().activeFloorId).toBe(id);
  useStore.setState({ busy: false });
});
