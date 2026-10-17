import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  createProject,
  makeWall,
  type Project,
} from "../../src/domain/project";
import { putOpening } from "../../src/domain/openings";
import { suppressBand } from "../../src/domain/channels";

function fixture() {
  const d = createProject("Edição M3.4", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  d.project.groutSettings = {
    junctions: false,
    openings: false,
    ends: false,
    intervals: false,
    distance: 10000,
  };
  d.project.channelLevels = [];
  return d;
}
function wall(d: Project, from: [number, number], to: [number, number]) {
  return makeWall(
    { x: from[0], y: from[1] },
    { x: to[0], y: to[1] },
    1250,
    d.model.floors[0].id,
    28000,
    1,
  )!;
}
async function load(page: Page, d: unknown) {
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "m34.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function exported(page: Page): Promise<Project> {
  await expect(page.getByRole("status")).toContainText("Salvo");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  return JSON.parse(await readFile((await (await pending).path())!, "utf8"));
}
async function point(page: Page, x: number, y: number) {
  const drawing = page.getByTestId("drawing"),
    b = (await drawing.boundingBox())!,
    c = JSON.parse((await drawing.getAttribute("data-camera"))!);
  return { x: b.x + c.x + x * c.scale, y: b.y + c.y + y * c.scale };
}
async function beginDrag(
  page: Page,
  from: [number, number],
  to: [number, number],
) {
  const a = await point(page, ...from),
    b = await point(page, ...to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 8 });
}
async function course(page: Page, n: number) {
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await page.getByLabel("Número da fiada").fill(String(n));
}

test("M3.4 ponte pela ferramenta Parede, prévia, IDs, undo e transporte", async ({
  page,
}) => {
  let d = fixture();
  const a = wall(d, [0, 0], [10000, 0]),
    b = wall(d, [20000, 0], [30000, 0]);
  d.model.walls = [a, b];
  d = putOpening(d, {
    id: crypto.randomUUID(),
    wallId: b.id,
    kind: "window",
    offset: 2500,
    width: 2500,
    base: 9800,
    height: 11200,
  });
  await load(page, d);
  await page
    .getByRole("button", { name: "Parede", exact: false })
    .first()
    .click();
  await beginDrag(page, [10000, 0], [20000, 0]);
  await expect(page.getByTestId("drawing")).toHaveAttribute(
    "data-wall-preview",
    /participants/,
  );
  await page.screenshot({ path: ".tools/m34-bridge-preview.png" });
  await page.mouse.up();
  const merged = await exported(page);
  expect(merged.model.walls).toHaveLength(1);
  expect(merged.model.walls[0].id).toBe(a.id);
  expect(merged.model.openings[0]).toMatchObject({
    id: d.model.openings[0].id,
    offset: 22500,
  });
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).model).toEqual(d.model);
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  expect((await exported(page)).model).toEqual(merged.model);
  await load(page, merged);
  expect((await exported(page)).model).toEqual(merged.model);
});

test("M3.4 mover com janela e supressão até intervalo une em uma operação", async ({
  page,
}) => {
  let d = fixture();
  d.project.channelLevels = [{ id: crypto.randomUUID(), top: 11200 }];
  const a = wall(d, [0, 0], [10000, 0]),
    b = wall(d, [20000, 0], [30000, 0]),
    c = wall(d, [0, 5000], [10000, 5000]);
  d.model.walls = [a, b, c];
  d = putOpening(d, {
    id: crypto.randomUUID(),
    wallId: c.id,
    kind: "window",
    offset: 2500,
    width: 2500,
    base: 9800,
    height: 11200,
  });
  d = suppressBand(d, c.id, 11200);
  await load(page, d);
  await page
    .getByRole("button", { name: "Selecionar", exact: false })
    .first()
    .click();
  await beginDrag(page, [7500, 5625], [17500, 625]);
  await page.screenshot({ path: ".tools/m34-move-merge-preview.png" });
  await page.mouse.up();
  const merged = await exported(page);
  expect(merged.model.walls).toHaveLength(1);
  expect(merged.model.walls[0].id).toBe(a.id);
  expect(merged.model.openings[0]).toMatchObject({
    wallId: a.id,
    offset: 12500,
  });
  expect(merged.adjustments.channels[0].scope).toEqual({
    kind: "range",
    from: 10000,
    to: 20000,
  });
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).model).toEqual(d.model);
  expect((await exported(page)).adjustments).toEqual(d.adjustments);
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  expect((await exported(page)).model).toEqual(merged.model);
  await course(page, 16);
  const band = merged.generated!.floors[0].channels!.find(
    (b) => b.course === 16,
  )!;
  await page.getByLabel("Selecionar faixa de canaleta").selectOption(band.id);
  await page
    .getByRole("button", { name: "Remover faixa de canaleta", exact: true })
    .click();
  expect((await exported(page)).adjustments.channels).toHaveLength(2);
  await expect(page.getByText(/trecho herdado 100–200 cm/)).toBeVisible();
  await page
    .getByRole("button", { name: "Restaurar faixa suprimida", exact: true })
    .last()
    .click();
  expect((await exported(page)).adjustments.channels).toEqual(
    merged.adjustments.channels,
  );
});

test("M3.4 movimento compartilha intenção, cancelamentos e zero sem mudanças", async ({
  page,
}) => {
  const d = fixture(),
    a = wall(d, [0, 0], [10000, 0]),
    b = wall(d, [0, 0], [0, 10000]);
  d.model.walls = [a, b];
  d.adjustments.grout = [
    {
      floorId: d.model.floors[0].id,
      id: crypto.randomUUID(),
      x: 0,
      y: 0,
      wallIds: [a.id, b.id].sort(),
      action: "include",
    },
  ];
  await load(page, d);
  await page
    .getByRole("button", { name: "Selecionar", exact: false })
    .first()
    .click();
  const before = await exported(page);
  await beginDrag(page, [7500, 625], [10000, 5625]);
  await page.keyboard.press("Escape");
  await page.mouse.up();
  expect((await exported(page)).model).toEqual(before.model);
  expect((await exported(page)).adjustments).toEqual(before.adjustments);
  await beginDrag(page, [7500, 625], [10000, 5625]);
  await page.mouse.move(3, 5);
  await page.mouse.up();
  expect((await exported(page)).model).toEqual(before.model);
  await beginDrag(page, [7500, 625], [10000, 5625]);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.mouse.up();
  expect((await exported(page)).model).toEqual(before.model);
  const p = await point(page, 7500, 625);
  await page.mouse.click(p.x, p.y);
  expect(await exported(page)).toEqual(before);
  await beginDrag(page, [7500, 625], [10000, 5625]);
  await page.mouse.up();
  const moved = await exported(page);
  expect(moved.adjustments.grout).toHaveLength(2);
  expect(moved.adjustments.grout[0]).toMatchObject({
    id: d.adjustments.grout[0].id,
    x: 0,
    y: 0,
    wallIds: [b.id],
  });
  expect(moved.adjustments.grout[1]).toMatchObject({
    x: 2500,
    y: 5000,
    wallIds: [a.id],
  });
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).adjustments).toEqual(before.adjustments);
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  expect((await exported(page)).adjustments).toEqual(moved.adjustments);
});

test("M3.4 célula nas quatro ferramentas, zoom e início inverso do vão", async ({
  page,
}) => {
  const d = fixture();
  d.model.walls = [wall(d, [0, 0], [10000, 0])];
  await load(page, d);
  const before = await exported(page);
  const drawing = page.getByTestId("drawing");
  for (const name of ["Parede", "Porta", "Janela", "Vão"]) {
    await page.getByRole("button", { name, exact: false }).first().click();
    const p = await point(page, 5000, 625);
    await page.mouse.move(p.x, p.y);
    await expect(drawing).toHaveAttribute("data-module-hover", /anchor/);
    expect(await exported(page)).toEqual(before);
  }
  await page.getByRole("button", { name: "Janela", exact: true }).click();
  const p = await point(page, 10000, 625);
  await page.mouse.move(p.x, p.y);
  const hover = JSON.parse((await drawing.getAttribute("data-module-hover"))!);
  expect(hover.x).toBe(8750);
  expect(hover.anchor.x).toBe(8750);
  const cameraBefore = JSON.parse((await drawing.getAttribute("data-camera"))!);
  await page.mouse.wheel(0, -100);
  await expect
    .poll(
      async () =>
        JSON.parse((await drawing.getAttribute("data-camera"))!).scale,
    )
    .toBeGreaterThan(cameraBefore.scale);
  expect(
    JSON.parse((await drawing.getAttribute("data-module-hover"))!).anchor.x,
  ).toBe(8750);
  await page.screenshot({ path: ".tools/m34-module-hover.png" });
  await beginDrag(page, [10000, 625], [7500, 625]);
  await page.mouse.up();
  expect((await exported(page)).model.openings[0]).toMatchObject({
    offset: 7500,
    width: 2500,
  });
  const out = await point(page, 30000, 15000);
  await page.mouse.move(out.x, out.y);
  await expect(drawing).toHaveAttribute("data-module-hover", "");
});

test("M3.4 alturas distintas e sobreposição mantêm entidades, sem falsa união", async ({
  page,
}) => {
  const d = fixture(),
    a = wall(d, [0, 0], [10000, 0]),
    b = wall(d, [20000, 0], [30000, 0]);
  b.height = 27300;
  d.model.walls = [a, b];
  await load(page, d);
  await page
    .getByRole("button", { name: "Parede", exact: false })
    .first()
    .click();
  await beginDrag(page, [10000, 0], [20000, 0]);
  await expect(page.getByTestId("drawing")).toHaveAttribute(
    "data-wall-preview",
    /Alturas/,
  );
  await page.mouse.up();
  expect((await exported(page)).model.walls).toHaveLength(3);
});

test("M3.4 carga de movimento em 100 paredes mantém projeto íntegro", async ({
  page,
}, info) => {
  const d = fixture();
  for (let i = 0; i < 100; i++)
    d.model.walls.push(wall(d, [0, i * 3750], [25000, i * 3750]));
  await load(page, d);
  await page
    .getByRole("button", { name: "Selecionar", exact: false })
    .first()
    .click();
  const start = Date.now();
  await beginDrag(page, [7500, 625], [8750, 1875]);
  await page.mouse.up();
  await expect(page.getByRole("status")).toContainText("Salvo");
  const elapsed = Date.now() - start;
  const moved = await exported(page),
    changed = moved.model.walls.find((w) => w.id === d.model.walls[0].id)!;
  expect(changed.a).toEqual({ x: 1250, y: 1250 });
  expect(changed.b).toEqual({ x: 26250, y: 1250 });
  expect(moved.model.walls.filter((w) => w.id !== changed.id)).toEqual(
    d.model.walls.slice(1),
  );
  expect(
    moved.generated!.floors[0].courses.reduce((n, c) => n + c.pieces.length, 0),
  ).toBe(42000);
  console.log(
    `M3.4 movimento ${info.project.name}: 100 paredes/42.000 peças em ${elapsed} ms, inclui gesto e salvar/calcular/salvar.`,
  );
});

test("M3.4 hospedeira ambígua exige escolha antes de criar vão", async ({
  page,
}) => {
  const d = fixture(),
    a = wall(d, [0, 0], [10000, 0]),
    b = wall(d, [0, 0], [0, 10000]);
  d.model.walls = [a, b];
  await load(page, d);
  await page.getByRole("button", { name: "Janela", exact: true }).click();
  const p = await point(page, 625, 625);
  await page.mouse.move(p.x, p.y);
  await expect(page.getByTestId("drawing")).toHaveAttribute(
    "data-module-hover",
    "",
  );
  await page.mouse.click(p.x, p.y);
  await expect(
    page.getByText("Selecionar parede", { exact: true }),
  ).toBeVisible();
  expect((await exported(page)).model.openings).toEqual([]);
  await page
    .getByRole("button", { name: "Parede 1 · 100 cm", exact: true })
    .click();
  await beginDrag(page, [0, 625], [2500, 625]);
  await page.mouse.up();
  expect((await exported(page)).model.openings[0]).toMatchObject({
    wallId: a.id,
    offset: 0,
    width: 2500,
  });
});
