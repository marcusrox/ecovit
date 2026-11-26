import { describe, expect, it } from "vitest";
import { createProject, type Project, type Point } from "../src/domain/project";
import { addRoomLabel, roomAreaText } from "../src/domain/rooms";
import { projectAreas } from "../src/domain/project-areas";
import { duplicateFloor, removeFloor } from "../src/domain/floors";
import { parseFile, serializeFile } from "../src/persistence/files";
import { validateProject } from "../src/persistence/document";

const p = (x: number, y: number): Point => ({ x, y });
const fixture = () =>
  createProject("Áreas", { length: 2000, width: 1000, height: 700 });
function rect(
  d: Project,
  x: number,
  y: number,
  w: number,
  h: number,
  floorId = d.model.floors[0].id,
) {
  const ring = [p(x, y), p(x + w, y), p(x + w, y + h), p(x, y + h)];
  d.model.roomBoundaries.push(
    ...ring.map((a, i) => ({
      id: crypto.randomUUID(),
      floorId,
      a,
      b: ring[(i + 1) % 4],
    })),
  );
}
function house(d: Project) {
  const floorId = d.model.floors[0].id;
  const wall = (a: Point, b: Point, side: 1 | -1) => ({
    id: crypto.randomUUID(),
    floorId,
    a,
    b,
    side,
    height: 28000,
  });
  d.model.walls = [
    wall(p(0, 0), p(100000, 0), 1),
    wall(p(0, 79000), p(100000, 79000), 1),
    wall(p(0, 0), p(0, 80000), 1),
    wall(p(99000, 0), p(99000, 80000), 1),
  ];
}
const constructed = (d: Project) => projectAreas(d).constructed;
describe("T-030 áreas do projeto", () => {
  it("desconsidera só o interior do jardim, mantém paredes, nome e região externa", () => {
    let d = fixture();
    house(d);
    rect(d, 30000, 30000, 30000, 20000);
    d = addRoomLabel(d, d.model.floors[0].id, p(10000, 10000)).doc;
    d = addRoomLabel(d, d.model.floors[0].id, p(40000, 40000)).doc;
    const garden = d.model.roomLabels[1];
    garden.name = "Jardim interno";
    garden.excludedFromAreas = true;
    garden.position = p(150000, 150000);
    const result = projectAreas(d);
    expect(result.useful.area).toBeCloseTo(70.44);
    expect(result.constructed).toEqual({
      area: 74,
      closed: true,
      pending: false,
    });
    expect(result.floors[0].rooms[1].region!.area).toBe(6);
    const copied = parseFile(
      serializeFile(duplicateFloor(d, d.model.floors[0].id, 28000, "Superior"))
        .text,
    );
    expect(
      copied.model.roomLabels.filter((l) => l.excludedFromAreas),
    ).toHaveLength(2);
    expect(copied.model.roomLabels[1].name).toBe("Jardim interno");
    expect(projectAreas(copied).constructed.area).toBe(148);
    garden.excludedFromAreas = false;
    expect(projectAreas(d).constructed.area).toBe(80);
    expect(projectAreas(d).useful.area).toBeCloseTo(76.44);
  });
  it("não desconta duas vezes regiões aninhadas nem a parede sólida dentro do jardim", () => {
    let d = fixture();
    house(d);
    rect(d, 30000, 30000, 30000, 20000);
    d.model.walls.push({
      id: crypto.randomUUID(),
      floorId: d.model.floors[0].id,
      a: p(40000, 35000),
      b: p(50000, 35000),
      side: 1,
      height: 28000,
    });
    d = addRoomLabel(d, d.model.floors[0].id, p(10000, 10000)).doc;
    d = addRoomLabel(d, d.model.floors[0].id, p(55000, 45000)).doc;
    d.model.roomLabels[1].excludedFromAreas = true;
    expect(projectAreas(d).constructed.area).toBeCloseTo(74.1);
    d.model.roomLabels[0].excludedFromAreas = true;
    expect(projectAreas(d).constructed.area).toBeCloseTo(3.66);
    expect(projectAreas(d).useful.area).toBe(0);
  });
  it("preserva exclusão em revisão sem inventar desconto de uma região perdida", () => {
    let d = fixture();
    rect(d, 0, 0, 30000, 20000);
    d = addRoomLabel(d, d.model.floors[0].id, p(10000, 10000)).doc;
    d.model.roomLabels[0].excludedFromAreas = true;
    expect(projectAreas(d).constructed.area).toBe(0);
    expect(projectAreas(d).useful.area).toBe(0);
    d.model.roomLabels[0].review = true;
    expect(projectAreas(d).constructed).toEqual({
      area: null,
      closed: true,
      pending: true,
    });
    expect(projectAreas(d).useful).toEqual({ area: 0, count: 1, review: 1 });
    expect(
      parseFile(serializeFile(d).text).model.roomLabels[0].excludedFromAreas,
    ).toBe(true);
  });
  it("formato 35 preserva a marca e converte 34 sem inventá-la; recusa tipo inválido e campo em legado", () => {
    let d = fixture();
    rect(d, 0, 0, 30000, 20000);
    d = addRoomLabel(d, d.model.floors[0].id, p(10000, 10000)).doc;
    const old = { ...d, schemaVersion: 34 };
    const loaded = validateProject(old);
    expect(loaded.schemaVersion).toBe(35);
    expect(loaded.model.roomLabels[0].excludedFromAreas).toBeUndefined();
    d.model.roomLabels[0].excludedFromAreas = true;
    expect(validateProject(d).model.roomLabels[0].excludedFromAreas).toBe(true);
    expect(() => validateProject({ ...d, schemaVersion: 34 })).toThrow(
      /formato anterior/,
    );
    expect(() =>
      validateProject({
        ...d,
        model: {
          ...d.model,
          roomLabels: [{ ...d.model.roomLabels[0], excludedFromAreas: "true" }],
        },
      }),
    ).toThrow();
  });
  it("E01/E04 inclui paredes e vazios internos, exclui continuação exterior da mesma parede", () => {
    const d = fixture();
    house(d);
    rect(d, 30000, 30000, 30000, 20000);
    expect(constructed(d)).toEqual({ area: 80, closed: true, pending: false });
    d.model.walls[0].b.x = 120000;
    expect(constructed(d)).toEqual({ area: 80, closed: true, pending: true });
  });
  it("E02/E03 une linhas sobrepostas e contornos separados, preenche contornos internos", () => {
    const d = fixture();
    rect(d, 0, 0, 30000, 20000);
    rect(d, 10000, 0, 30000, 20000);
    rect(d, 50000, 0, 30000, 20000);
    rect(d, 5000, 5000, 5000, 5000);
    expect(constructed(d)).toEqual({ area: 14, closed: true, pending: false });
    expect(projectAreas(d).useful.count).toBe(0);
  });
  it("E05 distingue vazio, aberto e totais entre pavimentos", () => {
    const d = fixture();
    const first = d.model.floors[0];
    d.model.floors.push({ ...first, id: crypto.randomUUID(), level: 28000 });
    expect(constructed(d)).toEqual({ area: 0, closed: false, pending: false });
    d.model.roomBoundaries.push({
      id: crypto.randomUUID(),
      floorId: first.id,
      a: p(0, 0),
      b: p(50000, 0),
    });
    expect(constructed(d).area).toBeNull();
    rect(d, 0, 0, 100000, 80000, d.model.floors[1].id);
    expect(constructed(d)).toEqual({ area: 80, closed: true, pending: true });
    rect(d, 0, 0, 100000, 80000);
    expect(constructed(d)).toEqual({ area: 160, closed: true, pending: false });
  });
  it("parede sólida isolada não constitui fechamento", () => {
    const d = fixture();
    house(d);
    d.model.walls = d.model.walls.slice(0, 1);
    expect(constructed(d)).toEqual({
      area: null,
      closed: false,
      pending: true,
    });
  });
  it("E06 contato na face interna fecha; lacuna real não fecha", () => {
    const d = fixture();
    house(d);
    d.model.walls = d.model.walls.slice(0, 1);
    const f = d.model.floors[0].id;
    d.model.roomBoundaries = [
      { id: crypto.randomUUID(), floorId: f, a: p(0, 1000), b: p(0, 80000) },
      {
        id: crypto.randomUUID(),
        floorId: f,
        a: p(0, 80000),
        b: p(100000, 80000),
      },
      {
        id: crypto.randomUUID(),
        floorId: f,
        a: p(100000, 80000),
        b: p(100000, 1000),
      },
    ];
    expect(constructed(d)).toEqual({ area: 80, closed: true, pending: false });
    d.model.roomBoundaries[0].a.y++;
    expect(constructed(d).area).toBeNull();
  });
  it("E07/E08 usa áreas vigentes, mantém revisão e soma antes de arredondar", () => {
    let d = fixture();
    rect(d, 0, 0, 12340, 10000);
    rect(d, 20000, 0, 12340, 10000);
    d = addRoomLabel(d, d.model.floors[0].id, p(100, 100)).doc;
    d = addRoomLabel(d, d.model.floors[0].id, p(20100, 100)).doc;
    d.model.roomLabels[1].name = d.model.roomLabels[0].name;
    d.model.roomLabels[0].position = p(-50000, -50000);
    const before = JSON.stringify(d);
    const report = projectAreas(d);
    expect(roomAreaText(report.useful.area!)).toBe("2,47 m²");
    expect(
      report.floors[0].rooms.map((r) => roomAreaText(r.region!.area)),
    ).toEqual(["1,23 m²", "1,23 m²"]);
    expect(JSON.stringify(d)).toBe(before);
    d.model.roomLabels[1].review = true;
    expect(projectAreas(d).useful).toEqual({
      area: 1.234,
      count: 2,
      review: 1,
    });
    d.model.roomLabels[0].review = true;
    expect(projectAreas(d).useful).toEqual({ area: null, count: 2, review: 2 });
    expect(constructed(d).pending).toBe(false);
  });
  it("E08 fechamento minúsculo permanece determinado antes da formatação", () => {
    const d = fixture();
    rect(d, 0, 0, 1, 1);
    const result = constructed(d);
    expect(result).toEqual({ area: 0.00000001, closed: true, pending: false });
    expect(roomAreaText(result.area!)).toBe("0,00 m²");
  });
  it("contornos côncavos, diagonais racionais e elementos internos mantêm união e cobertura", () => {
    const d = fixture();
    const f = d.model.floors[0].id;
    const ring = [
      p(0, 0),
      p(30000, 0),
      p(30000, 20000),
      p(10000, 20000),
      p(10000, 40000),
      p(0, 40000),
    ];
    d.model.roomBoundaries = ring.map((a, i) => ({
      id: crypto.randomUUID(),
      floorId: f,
      a,
      b: ring[(i + 1) % ring.length],
    }));
    d.model.roomBoundaries.push({
      id: crypto.randomUUID(),
      floorId: f,
      a: p(0, 0),
      b: p(30000, 19999),
    });
    d.model.walls.push({
      id: crypto.randomUUID(),
      floorId: f,
      a: p(2000, 2000),
      b: p(8000, 2000),
      side: 1,
      height: 28000,
    });
    expect(constructed(d)).toEqual({ area: 8, closed: true, pending: false });
    d.model.roomBoundaries.push({
      id: crypto.randomUUID(),
      floorId: f,
      a: p(30000, 19999),
      b: p(40000, 25000),
    });
    expect(constructed(d)).toEqual({ area: 8, closed: true, pending: true });
  });
  it("áreas acompanham cópia e remoção de pavimento e transporte, sem campos derivados", () => {
    let d = fixture();
    rect(d, 0, 0, 30000, 20000);
    d = addRoomLabel(d, d.model.floors[0].id, p(10000, 10000)).doc;
    const doubled = duplicateFloor(d, d.model.floors[0].id, 28000, "Superior");
    expect(projectAreas(doubled).useful.area).toBe(12);
    expect(constructed(doubled).area).toBe(12);
    const transported = parseFile(serializeFile(doubled).text);
    expect(projectAreas(transported).useful.area).toBe(12);
    expect(constructed(transported).area).toBe(12);
    expect(serializeFile(transported).text).not.toContain('"constructed"');
    const removed = removeFloor(transported, transported.model.floors[1].id);
    expect(projectAreas(removed).useful.area).toBe(6);
    expect(constructed(removed).area).toBe(6);
  });
});
