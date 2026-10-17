import {
  createLocalProject as createProject,
  importedCopy,
  parseFile,
  root,
} from "./floor-support";
import { describe, it, expect } from "vitest";
import {
  cm,
  makeWall,
  resizeWall,
  resizeLength,
  bounds,
  connection,
  remember,
  travel,
  validateBase,
} from "../src/domain/project";
import { readFile, MAX_FILE } from "../src/persistence/files";
const base = { length: 2500, width: 1250, height: 700 };
const project = () => createProject("Casa", base);
describe("precisão e malha", () => {
  it("converte decimais sem acumular erro e rejeita precisão indevida", () => {
    expect(cm("12,5")).toBe(1250);
    expect(cm("0.01")).toBe(1);
    expect(cm("-12.5")).toBe(-1250);
    expect(() => cm("12.501")).toThrow();
    expect(() => cm("")).toThrow();
  });
  it.each([
    [2500, 1250],
    [3000, 1500],
    [2800, 1400],
  ])("aceita base %i / %i", (length, width) => {
    expect(() => validateBase({ length, width, height: 700 })).not.toThrow();
  });
  it("recusa base fora da proporção e dimensões inválidas", () => {
    expect(() =>
      validateBase({ length: 2800, width: 1500, height: 700 }),
    ).toThrow();
    expect(() => validateBase({ ...base, height: 0 })).toThrow();
  });
  it("cria parede ortogonal e encaixa no meio tijolo", () => {
    const w = makeWall(
      { x: 20, y: 30 },
      { x: 2470, y: 340 },
      1250,
      "floor",
      28000,
      1,
    )!;
    expect(w.a).toEqual({ x: 0, y: 0 });
    expect(w.b).toEqual({ x: 2500, y: 0 });
    expect(
      makeWall({ x: 0, y: 0 }, { x: 100, y: 100 }, 1250, "floor", 28000, 1),
    ).toBeNull();
  });
  it("preserva face, ID e ponta fixa ao redimensionar por ambos os lados", () => {
    const w = makeWall(
      { x: 0, y: 0 },
      { x: 20000, y: 0 },
      1250,
      "floor",
      28000,
      -1,
    )!;
    const b = resizeLength(w, "b", 22500, 1250),
      a = resizeLength(b, "a", 25000, 1250);
    expect(b.a).toEqual(w.a);
    expect(a.b).toEqual({ x: 22500, y: 0 });
    expect(a.a).toEqual({ x: -2500, y: 0 });
    expect(a.id).toBe(w.id);
    expect(a.side).toBe(-1);
    expect(bounds(a, 1250).y).toBe(-1250);
    expect(() => resizeWall(w, "a", { x: 21000, y: 0 }, 1250)).toThrow();
    expect(() => resizeLength(w, "b", 20300, 1250)).toThrow();
  });
  it("edita paredes desenhadas no sentido inverso e verticais", () => {
    const w = makeWall(
      { x: 0, y: 10000 },
      { x: 0, y: 0 },
      1250,
      "floor",
      28000,
      1,
    )!;
    expect(resizeLength(w, "a", 12500, 1250).a).toEqual({ x: 0, y: 12500 });
    expect(resizeLength(w, "b", 12500, 1250).b).toEqual({ x: 0, y: -2500 });
  });
  it("localiza conexão no canto e no meio da face para L/T", () => {
    const w = makeWall(
      { x: 0, y: 0 },
      { x: 10000, y: 0 },
      1250,
      "floor",
      28000,
      1,
    )!;
    expect(connection({ x: 9970, y: 30 }, [w], 1250, 100)).toEqual({
      x: 10000,
      y: 0,
    });
    expect(connection({ x: 5000, y: 40 }, [w], 1250, 100)).toEqual({
      x: 5000,
      y: 0,
    });
    expect(connection({ x: 5000, y: 400 }, [w], 1250, 100)).toBeNull();
  });
});
describe("documento e histórico", () => {
  it("preserva identidade na ida e volta e copia sem sobrescrever projeto", () => {
    const d = project();
    d.model.walls.push(
      makeWall(
        { x: 0, y: 0 },
        { x: 10000, y: 0 },
        1250,
        d.model.floors[0].id,
        28000,
        -1,
      )!,
    );
    const restored = parseFile(JSON.stringify(d));
    expect(restored).toEqual(d);
    const copy = importedCopy(restored);
    expect(copy.project.id).not.toBe(d.project.id);
    expect(copy.model).toEqual(d.model);
  });
  it("rejeita futuro, entidades desconhecidas, duplicatas, referências e geometria inválida", () => {
    const d = project();
    expect(() =>
      parseFile(JSON.stringify({ ...d, schemaVersion: 999 })),
    ).toThrow();
    expect(() =>
      parseFile(JSON.stringify({ ...d, unexpected: true })),
    ).toThrow();
    const w = makeWall(
      { x: 0, y: 0 },
      { x: 10000, y: 0 },
      1250,
      d.model.floors[0].id,
      28000,
      1,
    )!;
    d.model.walls = [w, w];
    expect(() => parseFile(JSON.stringify(d))).toThrow();
    d.model.walls = [{ ...w, floorId: crypto.randomUUID() }];
    expect(() => parseFile(JSON.stringify(d))).toThrow();
    d.model.walls = [{ ...w, b: { x: 123, y: 1 } }];
    expect(() => parseFile(JSON.stringify(d))).toThrow();
  });
  it("rejeita arquivo grande antes de ler e JSON inválido", async () => {
    await expect(readFile({ size: MAX_FILE + 1 } as File)).rejects.toThrow(
      "50 MB",
    );
    expect(() => parseFile("not json")).toThrow();
  });
  it("desfaz/refaz sem alterar IDs e limita a 50 operações", () => {
    const a = root(project()),
      b = { ...a, project: { ...a.project, name: "Novo" } };
    const h = remember({ past: [], future: [] }, a);
    const undo = travel(h, b)!;
    expect(undo.doc).toEqual(a);
    expect(travel(undo.history, a, true)!.doc).toEqual(b);
    let history = h;
    for (let i = 0; i < 60; i++) history = remember(history, a);
    expect(history.past).toHaveLength(50);
    expect(remember(undo.history, a).future).toEqual([]);
  });
});
