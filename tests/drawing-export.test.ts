import { expect, it } from "vitest";
import {
  createProject,
  makeWall,
  defaultGroutSettings,
} from "../src/domain/project";
import { floorView, generate } from "../src/domain/composition";
import { relevantCourses } from "../src/domain/relevant-courses";
import {
  preparePages,
  type ExportOptions,
} from "../src/app/drawing-export/pages";

function fixture() {
  const doc = createProject(
    "Desenhos",
    { length: 2500, width: 1250, height: 700 },
    4200,
  );
  doc.project.channelLevels = [];
  doc.project.groutSettings = defaultGroutSettings(false);
  const floor = doc.model.floors[0].id;
  doc.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 20000, y: 0 }, 1250, floor, 4200, 1)!,
  ];
  doc.generated = generate(doc);
  doc.generationState = {
    status: "current",
    diagnostics: doc.generated.diagnostics,
  };
  const options: ExportOptions = {
    floorId: floor,
    content: "both",
    selection: "relevant",
    first: "1",
    last: "6",
    paper: "A4",
    landscape: false,
    planScale: 50,
    courseScale: 20,
    furniture: true,
    terrain: true,
    image: false,
  };
  return { doc, options };
}
it("seleciona primeira e término, sem selecionar alternância normal ou todos os grautes verticais", () => {
  const { doc } = fixture();
  doc.project.groutSettings = defaultGroutSettings(true);
  doc.generated = generate(doc);
  expect(relevantCourses(floorView(doc, doc.model.floors[0].id))).toEqual([
    1, 6,
  ]);
});
it("inclui transições dos vãos e os dois lados do término de paredes mais baixas", () => {
  const { doc, options } = fixture();
  doc.model.walls.push(
    makeWall(
      { x: 30000, y: 0 },
      { x: 40000, y: 0 },
      1250,
      options.floorId,
      2800,
      1,
    )!,
  );
  doc.model.openings.push({
    id: crypto.randomUUID(),
    wallId: doc.model.walls[0].id,
    kind: "window",
    offset: 2500,
    width: 5000,
    base: 700,
    height: 1400,
  });
  doc.generated = generate(doc);
  expect(relevantCourses(floorView(doc, options.floorId))).toEqual([
    1, 2, 4, 5, 6,
  ]);
});
it("usa peças efetivas de canaleta e inclui grampos pendentes sem inventar fiadas", () => {
  const { doc, options } = fixture();
  const local = floorView(doc, options.floorId);
  local.generated!.courses[2].pieces[0].kind = "channel";
  local.generated!.clamps = [
    {
      id: "pending",
      course: 5,
      top: 3500,
      a: { x: 0, y: 0 },
      b: { x: 1250, y: 0 },
      diameter: 63,
      length: 3250,
      leg: 1000,
      origins: [],
      wallIds: [],
      pending: "Descida insuficiente",
    },
    {
      id: "above",
      course: 20,
      top: 14000,
      a: { x: 0, y: 0 },
      b: { x: 1250, y: 0 },
      diameter: 63,
      length: 3250,
      leg: 1000,
      origins: [],
      wallIds: [],
      pending: "Acima da parede",
    },
  ];
  expect(relevantCourses(local)).toEqual([1, 3, 5, 6]);
});
it("canaleta suprimida deixa de selecionar sua fiada", () => {
  const { doc, options } = fixture();
  doc.project.channelLevels = [{ id: "level", top: 2100 }];
  doc.generated = generate(doc);
  expect(relevantCourses(floorView(doc, options.floorId))).toEqual([1, 3, 6]);
  const band = doc.generated.floors[0].channels![0];
  doc.adjustments.channels = [
    {
      id: crypto.randomUUID(),
      floorId: options.floorId,
      wallId: doc.model.walls[0].id,
      top: band.top,
    },
  ];
  doc.generated = generate(doc);
  expect(relevantCourses(floorView(doc, options.floorId))).toEqual([1, 6]);
});
it("ordena Planta, Fiadas e mantém escalas e papel sem alterar documento", () => {
  const { doc, options } = fixture(),
    before = JSON.stringify(doc);
  expect(preparePages(doc, options)).toMatchObject({
    width: 210,
    height: 297,
    drawings: [
      { mode: "plan", scale: 50 },
      { mode: "course", course: 1, scale: 20 },
      { mode: "course", course: 6, scale: 20 },
    ],
  });
  expect(
    preparePages(doc, {
      ...options,
      paper: "A3",
      landscape: true,
      selection: "range",
      first: "2",
      last: "4",
    }).drawings.map((d) => (d.mode === "plan" ? 0 : d.course)),
  ).toEqual([0, 2, 3, 4]);
  expect(JSON.stringify(doc)).toBe(before);
});
it.each([
  ["0", "2"],
  ["2", "1"],
  ["2", "7"],
  ["1.5", "3"],
  ["x", "2"],
])("recusa intervalo inválido %s–%s sem corrigir", (first, last) => {
  const { doc, options } = fixture();
  expect(() =>
    preparePages(doc, { ...options, selection: "range", first, last }),
  ).toThrow("intervalo válido");
});
it("Planta independe de composição, mas ambos não omite Fiadas indisponíveis", () => {
  const { doc, options } = fixture();
  doc.generated = null;
  doc.generationState.status = "outdated";
  expect(
    preparePages(doc, { ...options, content: "plan" }).drawings,
  ).toHaveLength(1);
  expect(() => preparePages(doc, options)).toThrow("somente Planta");
});
it("recusa pavimento sem fiadas e número atual inexistente após troca de pavimento", () => {
  const { doc, options } = fixture();
  doc.generated!.floors[0].courses = [];
  expect(() => preparePages(doc, options)).toThrow("não tem fiadas");
  expect(() =>
    preparePages(doc, { ...options, selection: "current", first: "6" }),
  ).toThrow("fiadas existentes");
});
