import { beforeEach, expect, it, vi } from "vitest";
vi.mock("../src/persistence/database", () => ({
  saveProject: vi.fn().mockResolvedValue(1),
  loadProject: vi.fn(),
  acquireProject: vi.fn().mockResolvedValue(() => {}),
}));
import { saveProject, acquireProject } from "../src/persistence/database";
import { createProject, makeWall } from "../src/domain/project";
import {
  addFloor,
  editFloor,
  removeFloor,
  duplicateFloor,
} from "../src/domain/floors";
import {
  floorPlanBounds,
  resolveFloorReference,
} from "../src/domain/floor-reference";
import * as engine from "../src/domain/composition";
import { serializeFile, importedCopy } from "../src/persistence/files";
import { useStore } from "../src/state/store";

function fixture(m = 1250, h = 700) {
  let d = createProject(
    "Comparação",
    { length: 2 * m, width: m, height: h },
    4 * h,
  );
  d.project.channelLevels = [];
  for (const level of [50 * h, -3 * h, 40 * h])
    d = addFloor(d, { name: "Mesmo nome", level, defaultHeight: 4 * h });
  return d;
}
beforeEach(() => {
  useStore.setState({ busy: false });
  useStore.getState().close();
  vi.restoreAllMocks();
  vi.mocked(saveProject).mockReset().mockResolvedValue(1);
  vi.mocked(acquireProject).mockResolvedValue(() => {});
});

it("EX-80: adjacência por cota e identidade, sem saltar vizinho vazio", () => {
  const d = fixture(),
    [a, b, c, e] = d.model.floors;
  d.model.floors.reverse();
  expect(resolveFloorReference(d, b.id, "below")).toEqual(a);
  expect(resolveFloorReference(d, b.id, "above")).toEqual(c);
  expect(resolveFloorReference(d, a.id, "below")).toBeUndefined();
  expect(resolveFloorReference(d, e.id, "above")).toBeUndefined();
  expect(resolveFloorReference(d, b.id, "none")).toBeUndefined();
  expect(resolveFloorReference(d, "ausente", "above")).toBeUndefined();
  expect(d.model.floors.map((f) => f.id)).toEqual([e.id, c.id, b.id, a.id]);
});

it.each([1250, 1500, 1400, 1251])(
  "EX-84: caixa independente da cota, m=%i",
  (m) => {
    const d = fixture(m),
      [a, b, c] = d.model.floors;
    d.model.walls = [
      makeWall({ x: 0, y: 0 }, { x: 4 * m, y: 0 }, m, b.id, 1400, 1)!,
    ];
    d.model.slabs = [
      {
        id: crypto.randomUUID(),
        floorId: c.id,
        thickness: 2100,
        contour: [
          { x: -8 * m, y: -4 * m },
          { x: -2 * m, y: -4 * m },
          { x: -2 * m, y: 2 * m },
          { x: -8 * m, y: 2 * m },
        ],
        openings: [],
      },
    ];
    expect(floorPlanBounds(d, [b.id, c.id])).toEqual({
      x: -8 * m,
      y: -4 * m,
      width: 12 * m,
      height: 6 * m,
    });
    expect(floorPlanBounds(d, [a.id, c.id])).toEqual({
      x: -8 * m,
      y: -4 * m,
      width: 6 * m,
      height: 6 * m,
    });
    expect(floorPlanBounds(d, [a.id])).toBeNull();
    expect(floorPlanBounds(d, [b.id, c.id], false)).toEqual({
      x: 0,
      y: 0,
      width: 4 * m,
      height: m,
    });
  },
);

it.each([false, true])(
  "EX-85: só comparar conserva documento e histórico, readonly=%s",
  async (readonly) => {
    const d = fixture();
    if (readonly) vi.mocked(acquireProject).mockResolvedValueOnce(null);
    await useStore.getState().open(d, true);
    const s = useStore.getState(),
      doc = s.doc!,
      history = s.history,
      text = serializeFile(doc).text;
    const spy = vi.spyOn(engine, "generate");
    vi.mocked(saveProject).mockClear();
    s.choose("seleção ativa");
    const draft = { points: [{ x: 0, y: 0 }], closed: false, thickness: "21" };
    s.inspect({ slabDraft: draft, slabEditing: true });
    s.inspect({ floorReference: "above" });
    expect(useStore.getState().floorReference).toBe("above");
    expect(useStore.getState().slabDraft).toBe(draft);
    expect(useStore.getState().select).toBe("seleção ativa");
    s.inspect({ floorReference: "none" });
    expect(useStore.getState().doc).toBe(doc);
    expect(useStore.getState().history).toBe(history);
    expect(serializeFile(useStore.getState().doc!).text).toBe(text);
    expect(spy).not.toHaveBeenCalled();
    expect(saveProject).not.toHaveBeenCalled();
  },
);

it("A01/A05/A09: direção indisponível e busy são recusados; Fiada limpa só comparação de pavimento", async () => {
  await useStore.getState().open(fixture(), true);
  const s = useStore.getState();
  s.inspect({ floorReference: "below" });
  expect(useStore.getState().floorReference).toBe("none");
  useStore.setState({ busy: true });
  s.inspect({ floorReference: "above" });
  expect(useStore.getState().floorReference).toBe("none");
  useStore.setState({ busy: false });
  s.inspect({ floorReference: "above", ghost: "next" });
  s.inspect({ mode: "course" });
  expect(useStore.getState().floorReference).toBe("none");
  expect(useStore.getState().ghost).toBe("next");
  s.inspect({ floorReference: "above" });
  s.inspect({ mode: "plan" });
  expect(useStore.getState().floorReference).toBe("none");
});

it("EX-81: reordenação/remoção resolvem direção sem restaurar preferência no histórico", async () => {
  await useStore.getState().open(fixture(), true);
  const [a, b, c, e] = useStore.getState().doc!.model.floors;
  const s = useStore.getState();
  s.switchFloor(b.id);
  s.inspect({ floorReference: "above" });
  const ref = () =>
    resolveFloorReference(
      useStore.getState().doc!,
      useStore.getState().activeFloorId,
      useStore.getState().floorReference,
    )?.id;
  expect(ref()).toBe(c.id);
  await s.commit(
    editFloor(useStore.getState().doc!, c.id, { name: "Renomeado" }),
    "floor",
  );
  expect(
    resolveFloorReference(useStore.getState().doc!, b.id, "above")!.name,
  ).toBe("Renomeado");
  expect(useStore.getState().floorReference).toBe("above");
  await s.commit(
    editFloor(useStore.getState().doc!, c.id, { level: 42000 }),
    "floor",
  );
  expect(ref()).toBe(e.id);
  await s.commit(removeFloor(useStore.getState().doc!, e.id), "floor");
  expect(ref()).toBe(c.id);
  await s.commit(removeFloor(useStore.getState().doc!, c.id), "floor");
  expect(useStore.getState().floorReference).toBe("none");
  await s.undo();
  expect(ref()).toBeUndefined();
  s.inspect({ floorReference: "above" });
  expect(ref()).toBe(c.id);
  await s.commit(
    editFloor(useStore.getState().doc!, b.id, { level: 49000 }),
    "floor",
  );
  expect(useStore.getState().activeFloorId).toBe(b.id);
  expect(ref()).toBeUndefined();
  s.switchFloor(a.id);
  expect(useStore.getState().floorReference).toBe("none");
});

it("A05/A06: novo pavimento inicia sem referência; histórico recupera escolha do ativo; reabrir/importar e fechar limpam", async () => {
  const d = fixture();
  d.model.floors.pop();
  await useStore.getState().open(d, true);
  const s = useStore.getState();
  s.inspect({ floorReference: "above" });
  await s.commit(
    duplicateFloor(s.doc!, s.activeFloorId!, 49000, "Cópia"),
    "floor",
  );
  expect(useStore.getState().floorReference).toBe("none");
  s.inspect({ floorReference: "below" });
  await s.undo();
  expect(useStore.getState().floorReference).toBe("above");
  s.inspect({ floorReference: "above" });
  const current = useStore.getState().doc!;
  const invalid = structuredClone(current);
  Object.assign(invalid, { schemaVersion: 8 });
  await s.open(invalid, true);
  expect(useStore.getState().doc).toBe(current);
  expect(useStore.getState().floorReference).toBe("above");
  await s.open(importedCopy(current), true);
  expect(useStore.getState().floorReference).toBe("none");
  s.inspect({ floorReference: "above" });
  s.close();
  expect(useStore.getState().floorReference).toBe("none");
  expect(useStore.getState().floorReferencesByFloor).toEqual({});
});

it.each([false, true])(
  "A05/A08: cada pavimento lembra sua direção sem salvar ou historicizar, readonly=%s",
  async (readonly) => {
    if (readonly) vi.mocked(acquireProject).mockResolvedValueOnce(null);
    await useStore.getState().open(fixture(), true);
    const s = useStore.getState(),
      [a, b, c] = s.doc!.model.floors;
    const doc = s.doc,
      history = s.history,
      text = serializeFile(doc!).text;
    const spy = vi.spyOn(engine, "generate");
    vi.mocked(saveProject).mockClear();
    s.inspect({ floorReference: "above" });
    s.switchFloor(b.id);
    expect(useStore.getState().floorReference).toBe("none");
    s.inspect({ floorReference: "below" });
    s.switchFloor(c.id);
    s.inspect({ floorReference: "above" });
    s.switchFloor(a.id);
    expect(useStore.getState().floorReference).toBe("above");
    s.switchFloor(b.id);
    expect(useStore.getState().floorReference).toBe("below");
    s.inspect({ floorReference: "none" });
    s.switchFloor(c.id);
    expect(useStore.getState().floorReference).toBe("above");
    s.switchFloor(b.id);
    expect(useStore.getState().floorReference).toBe("none");
    expect(useStore.getState().doc).toBe(doc);
    expect(useStore.getState().history).toBe(history);
    expect(serializeFile(useStore.getState().doc!).text).toBe(text);
    expect(saveProject).not.toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
  },
);

it("A06: normaliza também preferências de pavimentos inativos e não as restaura pelo histórico", async () => {
  await useStore.getState().open(fixture(), true);
  const s = useStore.getState(),
    [a, b, c, e] = s.doc!.model.floors;
  s.switchFloor(c.id);
  s.inspect({ floorReference: "above" });
  s.switchFloor(a.id);
  await s.commit(removeFloor(useStore.getState().doc!, e.id), "floor");
  await s.undo();
  s.switchFloor(c.id);
  expect(useStore.getState().floorReference).toBe("none");
  s.inspect({ floorReference: "above" });
  s.switchFloor(b.id);
  await s.commit(removeFloor(useStore.getState().doc!, c.id), "floor");
  expect(useStore.getState().floorReferencesByFloor[c.id]).toBeUndefined();
  await s.undo();
  s.switchFloor(c.id);
  expect(useStore.getState().floorReference).toBe("none");
});

it("revisão A04/A08: falha de gravação não é apagada por comparação ou navegação", async () => {
  await useStore.getState().open(fixture(), true);
  const s = useStore.getState(),
    [a, b] = s.doc!.model.floors;
  s.inspect({ floorReference: "above" });
  vi.mocked(saveProject).mockRejectedValueOnce(new Error("quota"));
  await s.commit(
    editFloor(s.doc!, b.id, { name: "Nome preservado em memória" }),
    "floor",
  );
  const failed = useStore.getState(),
    text = serializeFile(failed.doc!).text;
  expect(failed.saved).toBe("error");
  expect(failed.floorReference).toBe("above");
  const spy = vi.spyOn(engine, "generate");
  vi.mocked(saveProject).mockClear();
  s.inspect({ floorReference: "none" });
  s.inspect({ floorReference: "above" });
  s.inspect({ focus: { x: 1000, y: -1000 } });
  expect(useStore.getState().saved).toBe("error");
  expect(useStore.getState().message).toBe(failed.message);
  expect(useStore.getState().history).toBe(failed.history);
  expect(serializeFile(useStore.getState().doc!).text).toBe(text);
  expect(saveProject).not.toHaveBeenCalled();
  expect(spy).not.toHaveBeenCalled();
  expect(resolveFloorReference(failed.doc!, a.id, "above")!.name).toBe(
    "Nome preservado em memória",
  );
});

it("revisão A06/A07: falha de cálculo preserva novo vizinho e intenção; retry/histórico não restauram direção limpa", async () => {
  await useStore.getState().open(fixture(), true);
  const s = useStore.getState(),
    [, b, c, e] = s.doc!.model.floors;
  s.switchFloor(b.id);
  s.inspect({ floorReference: "above" });
  vi.spyOn(engine, "generate").mockImplementationOnce(() => {
    throw new Error("Falha simulada");
  });
  await s.commit(
    editFloor(useStore.getState().doc!, c.id, { level: 42000 }),
    "floor",
  );
  const failed = useStore.getState();
  expect(failed.doc!.generated).toBeNull();
  expect(failed.doc!.generationState.status).toBe("outdated");
  expect(failed.floorReference).toBe("above");
  expect(
    resolveFloorReference(failed.doc!, b.id, failed.floorReference)!.id,
  ).toBe(e.id);
  expect(failed.busy).toBe(false);
  s.inspect({ floorReference: "none" });
  await s.retry();
  expect(useStore.getState().doc!.generationState.status).toBe("current");
  expect(useStore.getState().floorReference).toBe("none");
  await s.undo();
  await s.undo(true);
  expect(useStore.getState().floorReference).toBe("none");
  expect(useStore.getState().doc!.model.floors.at(-1)!.id).toBe(c.id);
});
