import { CURRENT_PROJECT_FORMAT } from "../src/domain/project-format";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../src/persistence/remote", () => ({
  forgetProject: vi.fn(),
  pendingErrorKind: () => "falhou",
  saveProject: vi.fn().mockResolvedValue({ revision: "1" }),
  loadProject: vi.fn(),
  checkRevision: vi.fn(),
}));
import {
  createProject,
  type Point,
  type Project,
  type RoomBoundary,
} from "../src/domain/project";
import {
  addRoomLabel,
  attractRoomPoint,
  reconcileRooms,
  revalidateRoomLabel,
  roomAreaText,
  roomGeometry,
} from "../src/domain/rooms";
import {
  duplicateFloor,
  mergeFloorView,
  removeFloor,
} from "../src/domain/floors";
import * as engine from "../src/domain/composition";
import { floorView, generate } from "../src/domain/composition";
import {
  parseFile,
  serializeFile,
  validateProject,
} from "../src/persistence/files";
import { useStore } from "../src/state/store";
import { saveProject } from "../src/persistence/remote";
import { projectAreas } from "../src/domain/project-areas";
import { dehydrate, hydrate } from "../src/persistence/remote-document";
import { removeElement } from "../src/domain/openings";

const fixture = () =>
  createProject("Ambientes", { length: 2000, width: 1000, height: 700 });
const p = (x: number, y: number): Point => ({ x, y });
function line(d: Project, a: Point, b: Point): RoomBoundary {
  return { id: crypto.randomUUID(), floorId: d.model.floors[0].id, a, b };
}
function rect(d: Project, x = 0, y = 0, w = 30000, h = 40000) {
  const ring = [p(x, y), p(x + w, y), p(x + w, y + h), p(x, y + h)];
  return ring.map((a, i) => line(d, a, ring[(i + 1) % 4]));
}
function enclosed() {
  const d = fixture();
  d.model.roomBoundaries = rect(d);
  return d;
}
const geometry = (d: Project) => roomGeometry(d, d.model.floors[0].id);
const label = (d: Project, at = p(10000, 10000)) =>
  addRoomLabel(d, d.model.floors[0].id, at).doc;

describe("T-018 geometria de ambientes", () => {
  it("atração diagonal oferece contato inteiro real, prioridade de ponta e suspensão por Alt", () => {
    const targets = {
      vertices: [p(0, 0), p(30000, 40000)],
      segments: [[p(0, 0), p(30000, 40000)] as [Point, Point]],
    };
    const result = attractRoomPoint(p(15003, 20001), targets, 0.012);
    expect(result.snapped).toBe(true);
    expect(
      Number.isInteger(result.point.x) && Number.isInteger(result.point.y),
    ).toBe(true);
    expect(result.point.x * 4).toBe(result.point.y * 3);
    expect(attractRoomPoint(p(5, 4), targets, 0.012).point).toEqual(p(0, 0));
    expect(attractRoomPoint(p(15003, 20001), targets, 0.012, true)).toEqual({
      point: p(15003, 20001),
      snapped: false,
    });
    // A primitive diagonal has no representable interior lattice point.
    expect(
      attractRoomPoint(
        p(15000, 20000),
        { vertices: [], segments: [[p(0, 0), p(30001, 40000)]] },
        0.012,
      ).snapped,
    ).toBe(false);
  });
  it("mede retângulo só por linhas, contorno côncavo, fronteiras e regiões abertas", () => {
    const d = enclosed();
    expect(geometry(d).at(p(10000, 10000))?.area).toBe(12);
    expect(geometry(d).at(p(0, 10000))).toBeUndefined();
    expect(roomAreaText(12)).toBe("12,00 m²");
    d.model.roomBoundaries.pop();
    expect(() => label(d)).toThrow(/contorno fechado/);
    const ring = [
      p(0, 0),
      p(30000, 0),
      p(30000, 20000),
      p(10000, 20000),
      p(10000, 40000),
      p(0, 40000),
    ];
    d.model.roomBoundaries = ring.map((a, i) =>
      line(d, a, ring[(i + 1) % ring.length]),
    );
    expect(geometry(d).at(p(5000, 5000))?.area).toBe(8);
  });
  it("mede faces internas e ignora recortes de portas, janelas e aberturas livres", () => {
    const d = fixture(),
      floorId = d.model.floors[0].id;
    d.model.walls = [
      {
        id: crypto.randomUUID(),
        floorId,
        a: p(0, 0),
        b: p(32000, 0),
        side: 1,
        height: 28000,
      },
      {
        id: crypto.randomUUID(),
        floorId,
        a: p(0, 41000),
        b: p(32000, 41000),
        side: 1,
        height: 28000,
      },
      {
        id: crypto.randomUUID(),
        floorId,
        a: p(0, 1000),
        b: p(0, 41000),
        side: -1,
        height: 28000,
      },
      {
        id: crypto.randomUUID(),
        floorId,
        a: p(31000, 1000),
        b: p(31000, 41000),
        side: -1,
        height: 28000,
      },
    ];
    expect(geometry(d).at(p(10000, 10000))?.area).toBe(12);
    for (const kind of ["door", "window", "opening"] as const) {
      d.model.openings = [
        {
          id: crypto.randomUUID(),
          wallId: d.model.walls[0].id,
          kind,
          offset: 2000,
          width: 4000,
          height: 14000,
          base: 0,
        },
      ];
      expect(geometry(d).at(p(10000, 10000))?.area).toBe(12);
    }
    d.model.walls.pop();
    d.model.roomBoundaries = [line(d, p(30000, 0), p(30000, 42000))];
    expect(geometry(d).at(p(10000, 10000))?.area).toBe(12);
    d.model.roomBoundaries[0].b.y = 40999;
    expect(geometry(d).at(p(10000, 10000))).toBeUndefined();
  });
  it("desconta ilhas sólidas e interiores aninhados sem duplicar áreas", () => {
    const d = enclosed(),
      floorId = d.model.floors[0].id;
    d.model.roomBoundaries.push(...rect(d, 5000, 5000, 10000, 10000));
    const g = geometry(d);
    expect(g.at(p(20000, 20000))?.area).toBe(11);
    expect(g.at(p(10000, 10000))?.area).toBe(1);
    d.model.roomBoundaries = rect(d);
    d.model.walls = [
      {
        id: crypto.randomUUID(),
        floorId,
        a: p(5000, 5000),
        b: p(15000, 5000),
        side: 1,
        height: 28000,
      },
    ];
    expect(geometry(d).at(p(20000, 20000))?.area).toBe(11.9);
    expect(geometry(d).at(p(10000, 5500))).toBeUndefined();
  });
  it("conecta T, cruzamentos e sobreposições, preservando interseções fracionárias e lacunas reais", () => {
    const d = enclosed();
    d.model.roomBoundaries.push(
      line(d, p(0, 0), p(30000, 40000)),
      line(d, p(0, 40000), p(30000, 0)),
    );
    let g = geometry(d);
    expect(g.regions).toHaveLength(4);
    expect(g.regions.reduce((s, r) => s + r.area, 0)).toBe(12);
    d.model.roomBoundaries.push({
      ...d.model.roomBoundaries[0],
      id: crypto.randomUUID(),
      a: p(1000, 0),
      b: p(20000, 0),
    });
    expect(geometry(d).regions).toHaveLength(4);
    const tiny = fixture();
    tiny.model.roomBoundaries = rect(tiny, 0, 0, 3, 2);
    tiny.model.roomBoundaries.push(
      line(tiny, p(0, 0), p(3, 2)),
      line(tiny, p(0, 2), p(3, 0)),
    );
    g = geometry(tiny);
    expect(g.regions).toHaveLength(4);
    expect(g.regions.reduce((s, r) => s + r.area, 0)).toBeCloseTo(
      6 / 100_000_000,
      15,
    );
    tiny.model.roomBoundaries = rect(tiny);
    tiny.model.roomBoundaries[3].b = p(0, 1);
    expect(geometry(tiny).regions).toHaveLength(0);
  });
});

describe("T-018 referências e intenção", () => {
  it("paredes deslocadas atualizam áreas sem união falsa; linha não acompanha parede movida", () => {
    let d = fixture();
    const floorId = d.model.floors[0].id;
    d.model.walls = [
      {
        id: crypto.randomUUID(),
        floorId,
        a: p(0, 0),
        b: p(32000, 0),
        side: 1,
        height: 28000,
      },
      {
        id: crypto.randomUUID(),
        floorId,
        a: p(0, 41000),
        b: p(32000, 41000),
        side: 1,
        height: 28000,
      },
      {
        id: crypto.randomUUID(),
        floorId,
        a: p(0, 1000),
        b: p(0, 41000),
        side: -1,
        height: 28000,
      },
      {
        id: crypto.randomUUID(),
        floorId,
        a: p(31000, 1000),
        b: p(31000, 41000),
        side: -1,
        height: 28000,
      },
      {
        id: crypto.randomUUID(),
        floorId,
        a: p(15000, 1000),
        b: p(15000, 41000),
        side: -1,
        height: 28000,
      },
    ];
    d = label(label(d, p(10000, 10000)), p(20000, 10000));
    const moved = structuredClone(d);
    moved.model.walls[4].a.x = 18000;
    moved.model.walls[4].b.x = 18000;
    expect(
      reconcileRooms(d, moved).model.roomLabels.map((l) => l.review),
    ).toEqual([false, false]);
    expect(geometry(moved).at(p(10000, 10000))?.area).toBe(6.8);
    expect(geometry(moved).at(p(20000, 10000))?.area).toBe(4.8);
    const united = structuredClone(moved);
    united.model.walls.pop();
    expect(
      reconcileRooms(moved, united).model.roomLabels.every((l) => l.review),
    ).toBe(true);
    const mixed = structuredClone(united);
    mixed.model.roomLabels = [];
    mixed.model.walls.pop();
    mixed.model.roomBoundaries = [line(mixed, p(30000, 0), p(30000, 42000))];
    const labelled = label(mixed),
      opened = structuredClone(labelled);
    opened.model.walls[1].a.y += 1000;
    opened.model.walls[1].b.y += 1000;
    const result = reconcileRooms(labelled, opened);
    expect(result.model.roomBoundaries).toEqual(labelled.model.roomBoundaries);
    expect(result.model.roomLabels[0].review).toBe(true);
  });
  it("recinto interno novo exige revisão, região separada nova não afeta etiqueta existente", () => {
    const d = label(enclosed(), p(20000, 20000));
    let next = structuredClone(d);
    next.model.roomBoundaries.push(...rect(d, 5000, 5000, 5000, 5000));
    expect(reconcileRooms(d, next).model.roomLabels[0].review).toBe(true);
    next = structuredClone(d);
    next.model.roomBoundaries.push(...rect(d, 60000, 0, 10000, 10000));
    expect(reconcileRooms(d, next).model.roomLabels[0].review).toBe(false);
    next = structuredClone(d);
    next.model.roomBoundaries[1].a = p(10000, 0);
    next.model.roomBoundaries[1].b = p(10000, 40000);
    next.model.roomBoundaries[0].b = p(10000, 0);
    next.model.roomBoundaries[2].a = p(10000, 40000);
    expect(reconcileRooms(d, next).model.roomLabels[0].review).toBe(true);
  });
  it("preserva precisão perto dos limites e mede 100 regiões sem rasterizar a planta", () => {
    const d = fixture();
    d.model.roomBoundaries = rect(d, 99900000, 99900000, 30000, 40000);
    expect(geometry(d).at(p(99910000, 99910000))?.area).toBe(12);
    d.model.roomBoundaries = [];
    for (let i = 0; i < 10; i++)
      for (let j = 0; j < 10; j++)
        d.model.roomBoundaries.push(...rect(d, i * 60000, j * 60000));
    const started = performance.now(),
      g = geometry(d);
    expect(g.regions).toHaveLength(100);
    expect(g.regions.reduce((sum, r) => sum + r.area, 0)).toBe(1200);
    console.info(
      `T-018: 100 regiões/400 segmentos em ${(performance.now() - started).toFixed(0)} ms`,
    );
  });
  it("seleciona etiqueta existente, mantém referência ao mover e não reutiliza numeração", () => {
    const d = label(enclosed());
    const id = d.model.roomLabels[0].id;
    expect(addRoomLabel(d, d.model.floors[0].id, p(20000, 20000)).id).toBe(id);
    d.model.roomLabels[0].position = p(-10000, -10000);
    d.model.roomLabels[0].name = "Sala";
    expect(geometry(d).at(d.model.roomLabels[0].reference)?.area).toBe(12);
    const next = label(removeElement(d, id));
    expect(next.model.roomLabels[0].name).toBe("Ambiente 2");
    expect(next.model.roomLabels[0].reference).toEqual(p(10000, 10000));
  });
  it("atualiza dimensões e ilhas, exige revisão em divisão, união e perda de referência", () => {
    const d = label(enclosed());
    let next = structuredClone(d);
    next.model.roomBoundaries[0].b.x = 40000;
    next.model.roomBoundaries[1].a.x = 40000;
    next.model.roomBoundaries[1].b.x = 40000;
    next.model.roomBoundaries[2].a.x = 40000;
    next = reconcileRooms(d, next);
    expect(next.model.roomLabels[0].review).toBe(false);
    expect(geometry(next).at(p(10000, 10000))?.area).toBe(16);
    next = structuredClone(d);
    next.model.walls.push({
      id: crypto.randomUUID(),
      floorId: d.model.floors[0].id,
      a: p(15000, 20000),
      b: p(20000, 20000),
      height: 28000,
      side: 1,
    });
    expect(reconcileRooms(d, next).model.roomLabels[0].review).toBe(false);
    next = structuredClone(d);
    next.model.roomBoundaries.push(line(d, p(15000, 0), p(15000, 40000)));
    const split = reconcileRooms(d, next);
    expect(split.model.roomLabels[0].review).toBe(true);
    const labelled = label(split, p(20000, 10000));
    const merged = structuredClone(labelled);
    merged.model.roomBoundaries.pop();
    expect(
      reconcileRooms(labelled, merged).model.roomLabels.every((l) => l.review),
    ).toBe(true);
    next = structuredClone(d);
    next.model.roomBoundaries.pop();
    const open = reconcileRooms(d, next);
    expect(open.model.roomLabels[0].review).toBe(true);
    const restored = reconcileRooms(open, {
      ...d,
      model: { ...d.model, roomLabels: open.model.roomLabels },
    });
    expect(restored.model.roomLabels[0].review).toBe(true);
    expect(label(restored).model.roomLabels).toHaveLength(2);
  });
  it("mover divisória conserva os dois ambientes mesmo com sobreposição entre regiões antigas e novas", () => {
    let d = enclosed();
    d.model.roomBoundaries.push(line(d, p(15000, 0), p(15000, 40000)));
    d = label(label(d, p(2000, 10000)), p(28000, 10000));
    const next = structuredClone(d);
    next.model.roomBoundaries.at(-1)!.a.x = 25000;
    next.model.roomBoundaries.at(-1)!.b.x = 25000;
    const result = reconcileRooms(d, next);
    expect(result.model.roomLabels.map((l) => l.review)).toEqual([
      false,
      false,
    ]);
    expect(
      geometry(result)
        .regions.map((r) => r.area)
        .sort(),
    ).toEqual([10, 2]);
  });
  it("transporta, copia e remove pavimentos sem misturar associações; formatos anteriores continuam aceitos", () => {
    const d = label(enclosed());
    d.model.roomLabels[0].position = p(-10000, -10000);
    const loaded = parseFile(serializeFile(d).text);
    expect(loaded.model.roomLabels).toEqual(d.model.roomLabels);
    expect(hydrate(dehydrate(d, {}), {}).model.roomLabels).toEqual(
      d.model.roomLabels,
    );
    const copy = duplicateFloor(d, d.model.floors[0].id, 28000, "Superior"),
      target = copy.model.floors[1].id;
    expect(copy.model.roomLabels[1].id).not.toBe(d.model.roomLabels[0].id);
    expect(geometry(copy).regions).toHaveLength(1);
    const view = floorView(copy, target);
    expect(view.model.roomLabels).toHaveLength(1);
    expect(view.model.roomLabels[0].floorId).toBe(target);
    expect(mergeFloorView(copy, view).model.roomLabels).toHaveLength(2);
    expect(removeFloor(copy, target).model.roomBoundaries).toHaveLength(4);
    const old = JSON.parse(JSON.stringify(fixture()));
    old.schemaVersion = 18;
    delete old.model.roomLabels;
    delete old.model.roomBoundaries;
    expect(validateProject(old).schemaVersion).toBe(CURRENT_PROJECT_FORMAT);
    expect(validateProject(old).model.roomLabels).toEqual([]);
    old.model.roomLabels = [];
    expect(() => validateProject(old)).toThrow(/anterior/);
  });
  it("recusa IDs repetidos, referências órfãs, segmento nulo e etiquetas válidas sem região exclusiva", () => {
    const d = label(enclosed());
    const invalid = (change: (d: Project) => void) => {
      const next = structuredClone(d);
      change(next);
      expect(() => validateProject(next, false)).toThrow();
    };
    invalid((d) => (d.model.roomLabels[0].floorId = crypto.randomUUID()));
    invalid((d) => (d.model.roomLabels[0].id = d.model.roomBoundaries[0].id));
    invalid((d) => (d.model.roomBoundaries[0].b = d.model.roomBoundaries[0].a));
    invalid((d) => d.model.roomBoundaries.pop());
    invalid((d) =>
      d.model.roomLabels.push({
        ...d.model.roomLabels[0],
        id: crypto.randomUUID(),
      }),
    );
    invalid((d) => (d.model.roomLabels[0].name = " "));
    invalid((d) => (d.model.roomLabels[0].position.x = Infinity));
    const review = structuredClone(d);
    review.model.roomLabels[0].review = true;
    review.model.roomBoundaries = [];
    expect(validateProject(review, false).model.roomLabels[0].review).toBe(
      true,
    );
  });
});

describe("Reavaliação explícita de etiqueta em revisão", () => {
  it("preserva identidade, nome, posição, referência e contador ao recuperar a área atual", () => {
    const original = label(enclosed());
    original.model.roomLabels[0].name = "Sala de estar";
    original.model.roomLabels[0].position = p(50000, 10000);
    const open = reconcileRooms(original, {
      ...original,
      model: {
        ...original.model,
        roomBoundaries: original.model.roomBoundaries.slice(1),
      },
    });
    const closed = reconcileRooms(open, {
      ...open,
      model: { ...open.model, roomBoundaries: rect(open, 0, 0, 30000, 50000) },
    });
    expect(closed.model.roomLabels[0].review).toBe(true);
    const before = structuredClone(closed);
    const restored = revalidateRoomLabel(
      closed,
      original.model.roomLabels[0].id,
    );
    expect(closed).toEqual(before);
    expect(restored.model.roomLabels[0]).toEqual({
      ...original.model.roomLabels[0],
      review: false,
    });
    expect(restored.model.floors).toEqual(original.model.floors);
    expect(projectAreas(restored).useful.area).toBe(15);
    expect(parseFile(serializeFile(restored).text).model.roomLabels).toEqual(
      restored.model.roomLabels,
    );
    expect(revalidateRoomLabel(restored, original.model.roomLabels[0].id)).toBe(
      restored,
    );
  });
  it("mantém revisão sem fechamento, com referência fora ou coberta por parede, sem mover a referência até o texto", () => {
    for (const reference of [p(10000, 10000), p(50000, 10000), p(0, 10000)]) {
      const d = label(enclosed());
      d.model.roomLabels[0].review = true;
      d.model.roomLabels[0].reference = reference;
      if (reference.x === 10000) d.model.roomBoundaries = [];
      if (reference.x === 0)
        d.model.walls = [
          {
            id: crypto.randomUUID(),
            floorId: d.model.floors[0].id,
            a: p(0, 0),
            b: p(0, 40000),
            side: 1,
            height: 7000,
          },
        ];
      expect(revalidateRoomLabel(d, d.model.roomLabels[0].id)).toBe(d);
    }
  });
  it("não ocupa região com outra etiqueta válida; etiquetas em revisão não reservam região", () => {
    let d = label(enclosed());
    const id = d.model.roomLabels[0].id;
    d.model.roomLabels[0].review = true;
    d = label(d, p(20000, 20000));
    expect(revalidateRoomLabel(d, id)).toBe(d);
    d.model.roomLabels[1].review = true;
    expect(
      revalidateRoomLabel(d, id).model.roomLabels.map((l) => l.review),
    ).toEqual([false, true]);
    expect(revalidateRoomLabel(d, crypto.randomUUID())).toBe(d);
  });
});

describe("T-018 operação única e histórico", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useStore.setState({ busy: false });
    useStore.getState().close();
    vi.mocked(saveProject).mockClear();
  });
  it("recuperação salva uma operação desfazível sem recompor tijolos e respeita bloqueios", async () => {
    const d = validateProject(label(enclosed()), false);
    d.model.roomLabels[0].review = true;
    d.generated = generate(d);
    d.generationState = { status: "current", diagnostics: [] };
    useStore.setState({
      doc: d,
      activeFloorId: d.model.floors[0].id,
      readonly: false,
      busy: false,
      saved: "saved",
      history: { past: [], future: [] },
    });
    const output = d.generated;
    const calculation = vi.spyOn(engine, "generate");
    const next = revalidateRoomLabel(d, d.model.roomLabels[0].id);
    for (const block of [
      { busy: true, readonly: false },
      { busy: false, readonly: true },
    ]) {
      useStore.setState(block);
      await useStore.getState().commit(next, "room");
      expect(useStore.getState().doc).toEqual(d);
      expect(saveProject).not.toHaveBeenCalled();
    }
    useStore.setState({ busy: false, readonly: false });
    await useStore.getState().commit(next, "room");
    expect(saveProject).toHaveBeenCalledTimes(1);
    expect(useStore.getState().history.past).toHaveLength(1);
    expect(useStore.getState().doc?.model.roomLabels[0]).toEqual({
      ...d.model.roomLabels[0],
      review: false,
    });
    expect(useStore.getState().doc?.generated).toEqual(output);
    await useStore.getState().undo();
    expect(useStore.getState().doc?.model.roomLabels[0].review).toBe(true);
    await useStore.getState().undo(true);
    expect(useStore.getState().doc?.model.roomLabels[0].review).toBe(false);
    expect(calculation).not.toHaveBeenCalled();
  });
  it("salva perda de fechamento junto da geometria, desfaz/refaz revisão e não recompõe tijolos", async () => {
    // Match the canonical property order produced when the application opens a project.
    const d = validateProject(label(enclosed()), false);
    d.generated = generate(d);
    d.generationState = { status: "current", diagnostics: [] };
    useStore.setState({
      doc: d,
      activeFloorId: d.model.floors[0].id,
      readonly: false,
      busy: false,
      saved: "saved",
      history: { past: [], future: [] },
    });
    const output = d.generated;
    const calculation = vi.spyOn(engine, "generate");
    expect(projectAreas(d).useful.area).toBe(12);
    expect(projectAreas(d).constructed.area).toBe(12);
    await useStore
      .getState()
      .commit(removeElement(d, d.model.roomBoundaries[0].id), "room");
    expect(saveProject).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(saveProject).mock.calls[0][0].model.roomLabels[0].review,
    ).toBe(true);
    expect(useStore.getState().doc?.generated).toEqual(output);
    expect(calculation).not.toHaveBeenCalled();
    expect(useStore.getState().history.past).toHaveLength(1);
    expect(projectAreas(useStore.getState().doc!).useful.area).toBeNull();
    expect(projectAreas(useStore.getState().doc!).constructed.area).toBeNull();
    await useStore.getState().undo();
    expect(useStore.getState().doc?.model.roomLabels[0].review).toBe(false);
    expect(projectAreas(useStore.getState().doc!).constructed.area).toBe(12);
    await useStore.getState().undo(true);
    expect(useStore.getState().doc?.model.roomLabels[0].review).toBe(true);
    expect(projectAreas(useStore.getState().doc!).constructed.area).toBeNull();
    expect(calculation).not.toHaveBeenCalled();
    const saved = useStore.getState().doc!;
    expect(
      parseFile(serializeFile(saved).text).model.roomLabels[0].review,
    ).toBe(true);
  });
});
