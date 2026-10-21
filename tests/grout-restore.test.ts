import { beforeEach, expect, it, vi } from "vitest";
vi.mock("../src/persistence/database", () => ({
  saveProject: vi.fn().mockResolvedValue(1),
  loadProject: vi.fn(),
  acquireProject: vi.fn().mockResolvedValue(() => {}),
}));
import {
  createProject,
  makeWall,
  type GroutAdjustment,
} from "../src/domain/project";
import { generate, floorView, generateFloor } from "../src/domain/composition";
import {
  courseCells,
  groutAdjustmentsInScope,
  restoreAutomaticGrouts,
} from "../src/domain/grout";
import { parseFile, serializeFile } from "../src/persistence/files";
import { useStore } from "../src/state/store";
import { saveProject } from "../src/persistence/database";

function fixture() {
  const d = createProject("Restaurar grautes", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  const f = d.model.floors[0].id,
    upper = crypto.randomUUID();
  d.model.floors.push({
    ...d.model.floors[0],
    id: upper,
    name: "Superior",
    level: 28000,
  });
  d.project.channelLevels = [];
  d.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 40000, y: 0 }, 1250, f, 28000, 1)!,
    makeWall({ x: 0, y: 0 }, { x: 0, y: 30000 }, 1250, f, 28000, 1)!,
    makeWall({ x: 0, y: 40000 }, { x: 30000, y: 40000 }, 1250, f, 28000, 1)!,
    makeWall({ x: 0, y: 0 }, { x: 40000, y: 0 }, 1250, upper, 28000, 1)!,
  ];
  const [a, b, c, u] = d.model.walls.map((w) => w.id);
  const adjustment = (
    floorId: string,
    wallIds: string[],
    x: number,
    y: number,
    action: GroutAdjustment["action"],
  ): GroutAdjustment => ({
    id: crypto.randomUUID(),
    floorId,
    wallIds,
    x,
    y,
    action,
  });
  d.adjustments.grout = [
    adjustment(f, [a], 5000, 0, "include"),
    adjustment(f, [a, b], 0, 0, "exclude"),
    adjustment(f, [b], 0, 5000, "include"),
    adjustment(f, [c], 0, 40000, "exclude"),
    adjustment(f, [c], 90000, 90000, "include"),
    adjustment(upper, [u], 2500, 0, "include"),
  ];
  return d;
}
beforeEach(() => {
  vi.restoreAllMocks();
  useStore.getState().close();
  vi.mocked(saveProject).mockResolvedValue(1);
});

it("restauração por parede remove inclusões/exclusões e eixo compartilhado, preservando outras paredes, pendentes e pavimentos", () => {
  const d = fixture(),
    original = structuredClone(d),
    f = d.model.floors[0].id,
    a = d.model.walls[0].id;
  expect(groutAdjustmentsInScope(d, f, a)).toEqual(
    d.adjustments.grout.slice(0, 2),
  );
  const next = restoreAutomaticGrouts(d, f, a);
  expect(next.adjustments.grout).toEqual(d.adjustments.grout.slice(2));
  expect(next.project.groutSettings).toEqual(d.project.groutSettings);
  expect(next.model).toEqual(d.model);
  expect(next.adjustments.channels).toEqual(d.adjustments.channels);
  expect(d).toEqual(original);
  const g = generate(next).floors[0];
  expect(
    g
      .grouts!.find((c) => c.x === 0 && c.y === 0)
      ?.origins.every((o) => !o.startsWith("manual:")),
  ).toBe(true);
});
it("restauração por pavimento recupera distribuição sem ajustes, inclusive pendentes, preservando o vizinho; escopo inválido recusado", () => {
  const d = fixture(),
    f = d.model.floors[0].id;
  const next = restoreAutomaticGrouts(d, f);
  expect(next.adjustments.grout).toEqual([d.adjustments.grout.at(-1)]);
  const before = generate(d),
    after = generate(next),
    baseline = generate({ ...d, adjustments: { ...d.adjustments, grout: [] } });
  expect(after.floors[0]).toEqual(baseline.floors[0]);
  expect(after.floors[1]).toEqual(before.floors[1]);
  expect(restoreAutomaticGrouts(next, f)).toBe(next);
  expect(() => restoreAutomaticGrouts(d, "missing")).toThrow();
  expect(() => restoreAutomaticGrouts(d, f, d.model.walls[3].id)).toThrow();
});
it("filtro de furos usa associação da célula à parede, incluindo compartilhados sem capturar peça inteira ou outra parede", () => {
  const d = fixture(),
    g = generateFloor(floorView(d, d.model.floors[0].id)),
    [a, b] = d.model.walls;
  const horizontal = courseCells(d, g, 1, a.id),
    vertical = courseCells(d, g, 1, b.id);
  expect(horizontal.every((c) => c.wallIds.includes(a.id) && c.y === 0)).toBe(
    true,
  );
  expect(vertical.every((c) => c.wallIds.includes(b.id) && c.x === 0)).toBe(
    true,
  );
  expect(horizontal.find((c) => c.x === 0 && c.y === 0)?.wallIds).toEqual(
    [a.id, b.id].sort(),
  );
  expect(courseCells(d, g, 1, "missing")).toEqual([]);
});
it("comando de restauração gera uma ação desfazível, conserva pendentes externos, arquivo e recuperação de falha", async () => {
  const d = fixture();
  await useStore.getState().open(d, true);
  const original = useStore.getState().doc!,
    f = d.model.floors[0].id;
  const next = restoreAutomaticGrouts(original, f, d.model.walls[0].id);
  await useStore.getState().commit(next, "restore-grouts");
  expect(useStore.getState().history.past).toHaveLength(1);
  expect(useStore.getState().doc!.adjustments).toEqual(next.adjustments);
  expect(
    parseFile(serializeFile(useStore.getState().doc!).text).adjustments,
  ).toEqual(next.adjustments);
  await useStore.getState().undo();
  expect(useStore.getState().doc!.adjustments).toEqual(original.adjustments);
  await useStore.getState().undo(true);
  expect(useStore.getState().doc!.adjustments).toEqual(next.adjustments);
  const confirmed = useStore.getState().doc!;
  await useStore
    .getState()
    .commit(
      restoreAutomaticGrouts(confirmed, d.model.floors[1].id),
      "restore-grouts",
    );
  expect(useStore.getState().doc).toBe(confirmed);
  useStore.setState({ readonly: true });
  await useStore
    .getState()
    .commit(restoreAutomaticGrouts(confirmed, f), "restore-grouts");
  expect(useStore.getState().doc).toBe(confirmed);
  useStore.setState({ readonly: false });
  vi.mocked(saveProject).mockRejectedValue(new Error("quota"));
  await useStore
    .getState()
    .commit(restoreAutomaticGrouts(confirmed, f), "restore-grouts");
  expect(useStore.getState().saved).toBe("error");
  expect(
    parseFile(serializeFile(useStore.getState().doc!).text).adjustments.grout,
  ).toEqual([d.adjustments.grout.at(-1)]);
});
it("seleção de parede em Fiada descarta contexto de conjunto/prévia/furo sem mudar intenção, câmera ou histórico", async () => {
  await useStore.getState().open(fixture(), true);
  const s = useStore.getState(),
    doc = s.doc!,
    past = s.history;
  s.inspect({
    mode: "course",
    component: doc.generated!.floors[0].components[0].id,
    preview: {
      ...doc.generated!.floors[0],
      convention: doc.generated!.convention,
    },
    groutCell: { x: 0, y: 0, wallIds: [doc.model.walls[0].id] },
  });
  s.choose(doc.model.walls[0].id);
  expect(useStore.getState()).toMatchObject({
    select: doc.model.walls[0].id,
    component: null,
    preview: null,
    groutCell: null,
  });
  expect(useStore.getState().doc).toBe(doc);
  expect(useStore.getState().history).toBe(past);
});
