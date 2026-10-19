import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  createProject,
  makeWall,
  type Project,
} from "../../src/domain/project";
import { putSlab } from "../../src/domain/slabs";
import { addFloor } from "../../src/domain/floors";

function project() {
  return createProject("Lajes M4.2", {
    length: 2500,
    width: 1250,
    height: 700,
  });
}
async function load(page: Page, doc = project()) {
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "lajes.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(doc)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function exported(page: Page): Promise<Project> {
  await expect(page.getByRole("status")).toContainText("Salvo");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  return JSON.parse(await readFile((await (await download).path())!, "utf8"));
}
async function screen(page: Page, x: number, y: number) {
  const canvas = page.getByTestId("drawing"),
    box = (await canvas.boundingBox())!,
    camera = JSON.parse((await canvas.getAttribute("data-camera"))!);
  return {
    x: box.x + camera.x + x * 1250 * camera.scale,
    y: box.y + camera.y + y * 1250 * camera.scale,
  };
}
async function click(page: Page, x: number, y: number) {
  const p = await screen(page, x, y);
  await page.mouse.click(p.x, p.y);
}
async function draw(page: Page, points: number[][]) {
  for (const [x, y] of points) await click(page, x, y);
  await page
    .getByRole("button", { name: "Fechar contorno", exact: true })
    .click();
  await expect(
    page.getByLabel("Desenho de laje").getByRole("button"),
  ).toHaveText(["Confirmar contorno", "Cancelar"]);
}
async function confirm(page: Page) {
  await page
    .getByRole("button", { name: "Confirmar contorno", exact: true })
    .click();
  await expect(page.getByLabel("Desenho de laje")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function drag(page: Page, a: number[], b: number[]) {
  const p = await screen(page, ...(a as [number, number])),
    q = await screen(page, ...(b as [number, number]));
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(q.x, q.y, { steps: 5 });
  await page.mouse.up();
}
async function create(page: Page) {
  await page.getByRole("button", { name: "Laje", exact: true }).click();
  await page.getByLabel("Espessura inicial da laje (cm)").fill("21");
  await draw(page, [
    [0, 0],
    [16, 0],
    [16, 12],
    [0, 12],
  ]);
  await confirm(page);
}
async function opening(
  page: Page,
  points = [
    [2, 2],
    [4, 2],
    [4, 4],
    [2, 4],
  ],
) {
  await page
    .getByRole("button", { name: "Adicionar abertura", exact: true })
    .click();
  await draw(page, points);
  if (points[0][0] === 2 && points[0][1] === 2) {
    // The new void must reveal the grid already in the preview, before saving.
    const alpha = await page.getByTestId("drawing").evaluate((host) => {
      const camera = JSON.parse(host.getAttribute("data-camera")!);
      const canvas = document.createElement("canvas");
      canvas.width = host.clientWidth;
      canvas.height = host.clientHeight;
      const ctx = canvas.getContext("2d")!;
      for (const layer of host.querySelectorAll("canvas"))
        ctx.drawImage(
          layer,
          0,
          0,
          layer.width,
          layer.height,
          0,
          0,
          layer.clientWidth,
          layer.clientHeight,
        );
      return ctx.getImageData(
        Math.floor(camera.x + 3.5 * 1250 * camera.scale),
        Math.floor(camera.y + 3.5 * 1250 * camera.scale),
        1,
        1,
      ).data[3];
    });
    expect(alpha).toBe(0);
  }
  await confirm(page);
}

test("M4.2 prévia fechada permite confirmar ou cancelar e reiniciar", async ({
  page,
}, info) => {
  const original = project();
  await load(page, original);
  await page.getByRole("button", { name: "Laje", exact: true }).click();
  await page.getByLabel("Espessura inicial da laje (cm)").fill("21");
  await draw(page, [
    [0, 0],
    [16, 0],
    [16, 12],
    [0, 12],
  ]);
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(
      page.getByRole("button", { name: "Cancelar", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `.tools/m42-closed-${info.project.name}-${width}.png`,
    });
  }
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.getByLabel("Desenho de laje")).toHaveCount(0);
  expect((await exported(page)).model).toEqual(original.model);
  await expect(
    page.getByRole("button", { name: "Desfazer", exact: true }),
  ).toBeDisabled();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await create(page);
  expect((await exported(page)).model.slabs).toHaveLength(1);
});

test("M4.2 criação, fechamento explícito, vazios, movimento, espessura e transporte", async ({
  page,
}) => {
  await load(page);
  await create(page);
  await expect(
    page.getByRole("button", { name: "Laje", exact: true }),
  ).toBeDisabled();
  await opening(page);
  const before = await exported(page),
    slab = before.model.slabs[0];
  expect(before.schemaVersion).toBe(13);
  expect(slab.openings).toHaveLength(1);
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(slab.id);
  await drag(page, [6, 3], [8, 4]);
  const moved = await exported(page);
  expect(moved.model.slabs[0].contour[0]).toEqual({ x: 2500, y: 1250 });
  expect(moved.model.slabs[0].openings[0].contour[0]).toEqual({
    x: 5000,
    y: 3750,
  });
  await page.getByLabel("Espessura da laje (cm)").fill("14,01");
  await page
    .getByRole("button", { name: "Aplicar espessura", exact: true })
    .click();
  await expect(page.getByLabel("Propriedades da laje")).toContainText(
    "Face inferior: -14,01 cm",
  );
  const saved = await exported(page);
  await page.reload();
  await page
    .getByRole("button", { name: /Lajes M4.2/ })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await exported(page)).model).toEqual(saved.model);
  await page.getByTestId("import-file").setInputFiles({
    name: "anterior.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ ...saved, schemaVersion: 8 })),
  });
  await expect(page.getByText(/Formato incompatível/)).toBeVisible();
  expect((await exported(page)).model).toEqual(saved.model);
});

test("M4.2 arestas/redesenho inválidos e cancelamento conservam toda intenção e histórico", async ({
  page,
}) => {
  await load(page);
  await create(page);
  await opening(page);
  const d = await exported(page),
    slab = d.model.slabs[0];
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(slab.openings[0].id);
  await drag(page, [3, 3], [0, 3]);
  expect((await exported(page)).model).toEqual(d.model);
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(slab.id);
  await drag(page, [16, 6], [4, 6]);
  expect((await exported(page)).model).toEqual(d.model);
  await page.getByRole("button", { name: "Parede", exact: true }).click();
  await drag(page, [16, 6], [18, 6]);
  const extended = await exported(page);
  expect(extended.model.slabs[0].contour[1].x).toBe(22500);
  expect(extended.model.walls).toHaveLength(0);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).model).toEqual(d.model);
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(slab.id);
  await page
    .getByRole("button", { name: "Redesenhar contorno", exact: true })
    .click();
  await draw(page, [
    [0, 0],
    [2, 0],
    [2, 8],
    [0, 8],
  ]);
  await expect(
    page.getByRole("button", { name: "Confirmar contorno", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  expect((await exported(page)).model).toEqual(d.model);
  await page
    .getByRole("button", { name: "Redesenhar contorno", exact: true })
    .click();
  await click(page, 0, 0);
  await page.keyboard.press("Control+z");
  await expect(page.getByLabel("Desenho de laje")).toHaveCount(0);
  expect((await exported(page)).model).toEqual(d.model);
  await page
    .getByRole("button", { name: "Adicionar abertura", exact: true })
    .click();
  await click(page, 8, 2);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.getByLabel("Desenho de laje")).toHaveCount(0);
  expect((await exported(page)).model).toEqual(d.model);
});

test("M4.2 seleção sobreposta, cópia/cota/remoção de pavimento e estado vazio da Fiada", async ({
  page,
}) => {
  let d = project();
  const f = d.model.floors[0].id;
  const contour = [
    { x: 0, y: 0 },
    { x: 20000, y: 0 },
    { x: 20000, y: 15000 },
    { x: 0, y: 15000 },
  ];
  d = putSlab(d, {
    id: crypto.randomUUID(),
    floorId: f,
    thickness: 2100,
    contour,
    openings: [],
  });
  d.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 20000, y: 0 }, 1250, f, 2100, 1)!,
  ];
  d = addFloor(d, { name: "Só laje", level: 28000, defaultHeight: 28000 });
  const other = d.model.floors[1].id;
  d = putSlab(d, {
    id: crypto.randomUUID(),
    floorId: other,
    thickness: 1401,
    contour,
    openings: [],
  });
  await load(page, d);
  await click(page, 6, 0.5);
  await expect(
    page.getByRole("group", { name: "Elementos sobrepostos" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Parede 1", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(d.model.slabs[0].id);
  await expect(page.getByLabel("Propriedades da laje")).toBeVisible();
  await page.getByLabel("Pavimento", { exact: true }).selectOption(other);
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect(
    page.getByText("Este pavimento não tem paredes", { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Planta", exact: true }).click();
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(d.model.slabs[1].id);
  await page
    .getByRole("button", { name: "Adicionar abertura", exact: true })
    .click();
  await click(page, 6, 3);
  await expect(
    page.getByRole("button", { name: "Excluir laje", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Duplicar pavimento", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Nome do pavimento", { exact: true })
    .fill("Cópia laje");
  await page
    .getByRole("dialog")
    .getByLabel("Cota do pavimento (cm)")
    .fill("350");
  await page
    .getByRole("button", { name: "Confirmar cópia", exact: true })
    .click();
  const copied = await exported(page);
  await expect(page.getByLabel("Desenho de laje")).toHaveCount(0);
  expect(copied.model.slabs).toHaveLength(3);
  expect(copied.model.slabs[2].id).not.toBe(copied.model.slabs[1].id);
  expect(copied.model.slabs[2].contour).toEqual(contour);
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Excluir pavimento", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).model).toEqual(copied.model);
});

test("M4.2 interface laje, abertura, alças e controles nas resoluções suportadas", async ({
  page,
}, info) => {
  await load(page);
  await create(page);
  await opening(page);
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    await page
      .getByLabel("Selecionar elemento", { exact: true })
      .selectOption((await exported(page)).model.slabs[0].id);
    await expect(
      page.getByRole("button", { name: "Redesenhar contorno", exact: true }),
    ).toBeVisible();
    const panel = page.getByLabel("Propriedades da laje");
    for (const name of [
      "Aplicar espessura",
      "Cancelar espessura",
      "Adicionar abertura",
      "Redesenhar contorno",
      "Excluir laje",
    ]) {
      const button = panel.getByRole("button", { name, exact: true });
      await expect(button).toBeVisible();
      await expect(button).toHaveText("");
      await expect(button).toHaveAttribute("title", name);
      await expect(button).toHaveAttribute("data-tooltip", name);
      await expect(button.locator("svg")).toHaveCount(1);
      const geometry = await button.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const icon = el.querySelector("svg")!.getBoundingClientRect();
        return {
          width: box.width,
          height: box.height,
          dx: Math.abs(icon.x + icon.width / 2 - box.x - box.width / 2),
          dy: Math.abs(icon.y + icon.height / 2 - box.y - box.height / 2),
        };
      });
      expect(geometry.width).toBeLessThanOrEqual(32);
      expect(geometry.height).toBeLessThanOrEqual(32);
      expect(geometry.dx).toBeLessThanOrEqual(1);
      expect(geometry.dy).toBeLessThanOrEqual(1);
      await button.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(button).toBeFocused();
      expect(
        await button.evaluate((el) => getComputedStyle(el, "::after").display),
      ).toBe("block");
    }
    const add = panel.getByRole("button", {
      name: "Adicionar abertura",
      exact: true,
    });
    await page.getByLabel("Espessura da laje (cm)").focus();
    await add.hover();
    expect(
      await add.evaluate((el) => getComputedStyle(el, "::after").display),
    ).toBe("block");
    await page.getByTestId("drawing").hover({ position: { x: 5, y: 5 } });
    expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `.tools/m42-${info.project.name}-${width}.png`,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test("M4.2 redesenho côncavo válido, abertura em contato e exclusões com confirmação/histórico", async ({
  page,
}) => {
  await load(page);
  await create(page);
  await opening(page);
  const initial = await exported(page),
    slab = initial.model.slabs[0];
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(slab.id);
  await page
    .getByRole("button", { name: "Redesenhar contorno", exact: true })
    .click();
  const points = [
    [0, 0],
    [16, 0],
    [16, 6],
    [10, 6],
    [10, 12],
    [0, 12],
  ];
  for (const [x, y] of points) await click(page, x, y);
  await click(page, 0, 0);
  await confirm(page);
  const concave = await exported(page);
  expect(concave.model.slabs[0].id).toBe(slab.id);
  expect(concave.model.slabs[0].openings).toEqual(slab.openings);
  expect(concave.model.slabs[0].contour).toHaveLength(6);
  await page
    .getByRole("button", { name: "Adicionar abertura", exact: true })
    .click();
  await draw(page, [
    [4, 2],
    [6, 2],
    [6, 4],
    [4, 4],
  ]);
  await expect(
    page.getByRole("button", { name: "Confirmar contorno", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText(/Aberturas/);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  expect((await exported(page)).model).toEqual(concave.model);
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(slab.openings[0].id);
  await page
    .getByRole("button", { name: "Excluir abertura", exact: true })
    .click();
  expect((await exported(page)).model.slabs[0].openings).toHaveLength(0);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).model).toEqual(concave.model);
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(slab.id);
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "Excluir laje", exact: true }).click();
  expect((await exported(page)).model).toEqual(concave.model);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Excluir laje", exact: true }).click();
  expect((await exported(page)).model.slabs).toEqual([]);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).model).toEqual(concave.model);
});

test("M4.2 captura perdida, soltura fora, zoom/pan e campos não alteram laje", async ({
  page,
}) => {
  await load(page);
  await create(page);
  const initial = await exported(page),
    slab = initial.model.slabs[0];
  const start = await screen(page, 6, 3);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 30, start.y + 30);
  await page.mouse.move(3, 3);
  await page.mouse.up();
  expect((await exported(page)).model).toEqual(initial.model);
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(slab.id);
  await page.getByLabel("Espessura da laje (cm)").fill("123");
  await page.getByLabel("Espessura da laje (cm)").press("Delete");
  await page
    .getByRole("button", { name: "Cancelar espessura", exact: true })
    .click();
  expect((await exported(page)).model).toEqual(initial.model);
  await page
    .getByRole("button", { name: "Adicionar abertura", exact: true })
    .click();
  await click(page, 6, 3);
  await page.evaluate(() => window.dispatchEvent(new Event("pointercancel")));
  await expect(page.getByLabel("Desenho de laje")).toHaveCount(0);
  const p = await screen(page, 6, 3);
  await page.mouse.move(p.x, p.y);
  await page.keyboard.down("Space");
  await page.mouse.down();
  await page.mouse.move(p.x + 30, p.y + 20);
  await page.mouse.up();
  await page.keyboard.up("Space");
  await page.mouse.wheel(0, -100);
  expect((await exported(page)).model).toEqual(initial.model);
});

test("revisão M4.2: contorno de um módulo com zoom reduzido não fecha por proximidade", async ({
  page,
}) => {
  await load(page);
  for (let i = 0; i < 5; i++)
    await page
      .getByRole("button", { name: "Reduzir zoom", exact: true })
      .click();
  await page.getByRole("button", { name: "Laje", exact: true }).click();
  await page.getByLabel("Espessura inicial da laje (cm)").fill("14,01");
  await draw(page, [
    [4, 4],
    [5, 4],
    [5, 5],
    [4, 5],
  ]);
  await expect(
    page.getByRole("button", { name: "Confirmar contorno", exact: true }),
  ).toBeEnabled();
  await confirm(page);
  expect((await exported(page)).model.slabs[0].contour).toEqual([
    { x: 5000, y: 5000 },
    { x: 6250, y: 5000 },
    { x: 6250, y: 6250 },
    { x: 5000, y: 6250 },
  ]);
});

test("revisão M4.2: inversão da alça preserva laje, arquivo e operação única no histórico", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await load(page);
  await create(page);
  const original = await exported(page);
  await drag(page, [16, 6], [-1, 6]);
  await expect(
    page.getByText(/não pode atravessar o contorno/).first(),
  ).toBeVisible();
  expect((await exported(page)).model).toEqual(original.model);
  expect((await exported(page)).generated).toEqual(original.generated);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).model.slabs).toEqual([]);
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  expect((await exported(page)).model).toEqual(original.model);
  expect(errors).toEqual([]);
});

function overlapFixture() {
  let d = project();
  const floor = d.model.floors[0].id;
  const wall = makeWall(
    { x: 0, y: 5000 },
    { x: 20000, y: 5000 },
    1250,
    floor,
    28000,
    1,
  )!;
  d.model.walls = [wall];
  d.model.openings = [
    {
      id: crypto.randomUUID(),
      wallId: wall.id,
      kind: "window",
      offset: 5000,
      width: 5000,
      base: 7000,
      height: 7000,
    },
  ];
  d = putSlab(d, {
    id: crypto.randomUUID(),
    floorId: floor,
    thickness: 2100,
    contour: [
      { x: 0, y: 0 },
      { x: 20000, y: 0 },
      { x: 20000, y: 15000 },
      { x: 0, y: 15000 },
    ],
    openings: [],
  });
  return d;
}
test("revisão M4.2/M4.1: escolha explícita da parede sob vão e laje controla o próximo arraste", async ({
  page,
}) => {
  const d = overlapFixture();
  await load(page, d);
  await click(page, 6, 4.5);
  await page
    .getByRole("button", { name: "Selecionar parede do vão", exact: true })
    .click();
  await drag(page, [6, 4.5], [6, 6.5]);
  const moved = await exported(page);
  expect(moved.model.walls[0].a.y).toBe(7500);
  expect(moved.model.openings[0].offset).toBe(5000);
  expect(moved.model.slabs).toEqual(d.model.slabs);
});
test("M4.2/M4.1: seletor unificado agrupa elementos do ativo e cancela prévia sem gravar", async ({
  page,
}, info) => {
  let d = overlapFixture();
  d = addFloor(d, { name: "Superior", level: 28000, defaultHeight: 28000 });
  const other = {
    ...d.model.walls[0],
    id: crypto.randomUUID(),
    floorId: d.model.floors[1].id,
  };
  d.model.walls.push(other);
  d.model.openings.push({
    ...d.model.openings[0],
    id: crypto.randomUUID(),
    wallId: other.id,
  });
  d = putSlab(d, {
    ...d.model.slabs[0],
    openings: [
      {
        id: crypto.randomUUID(),
        contour: [
          { x: 2500, y: 2500 },
          { x: 5000, y: 2500 },
          { x: 5000, y: 3750 },
          { x: 2500, y: 3750 },
        ],
      },
    ],
  });
  d = addFloor(d, { name: "Vazio", level: 56000, defaultHeight: 28000 });
  await load(page, d);
  const selector = page.getByLabel("Selecionar elemento", { exact: true });
  await expect(selector).toHaveCount(1);
  await expect(selector.locator("optgroup")).toHaveCount(2);
  await expect(selector.locator('optgroup[label="Laje"] option')).toHaveText([
    "Laje · Térreo",
    "Abertura 1 · Laje",
  ]);
  await expect(
    selector.locator('optgroup[label="Vãos de parede"] option'),
  ).toHaveText(["Janela 1 · Parede 1 · base 70 / topo 140 cm"]);
  await expect(selector.locator("option")).toHaveCount(4);
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(selector).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.tools/m42-elements-${info.project.name}-${width}.png`,
    });
  }
  await selector.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(selector).toHaveValue(d.model.slabs[0].id);
  await page
    .getByLabel("Selecionar elemento da laje", { exact: true })
    .selectOption(d.model.slabs[0].openings[0].id);
  await expect(selector).toHaveValue(d.model.slabs[0].openings[0].id);
  await page.getByRole("button", { name: "Parede", exact: true }).click();
  await selector.selectOption(d.model.slabs[0].id);
  await selector.selectOption(d.model.slabs[0].openings[0].id);
  await expect(
    page.getByRole("button", { name: "Selecionar", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Propriedades da laje")).toContainText(
    "ABERTURA DE LAJE",
  );
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(d.model.slabs[0].id);
  await page
    .getByRole("button", { name: "Adicionar abertura", exact: true })
    .click();
  await click(page, 2, 2);
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(d.model.openings[0].id);
  await expect(page.getByLabel("Desenho de laje")).toHaveCount(0);
  await expect(selector).toHaveValue(d.model.openings[0].id);
  await expect(page.getByLabel("Propriedades do vão")).toBeVisible();
  expect((await exported(page)).model).toEqual(d.model);
  await selector.selectOption(d.model.slabs[0].id);
  await page
    .getByRole("button", { name: "Redesenhar contorno", exact: true })
    .click();
  await draw(page, [
    [0, 0],
    [18, 0],
    [18, 12],
    [0, 12],
  ]);
  await expect(
    page.getByRole("button", { name: "Confirmar contorno", exact: true }),
  ).toBeEnabled();
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(other.floorId);
  await expect(page.getByLabel("Desenho de laje")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Desfazer", exact: true }),
  ).toBeDisabled();
  expect((await exported(page)).model).toEqual(d.model);
  await expect(selector.locator("option")).toHaveCount(2);
  await expect(selector.locator("optgroup")).toHaveCount(1);
  await expect(selector.locator("optgroup")).toHaveAttribute(
    "label",
    "Vãos de parede",
  );
  await expect(selector).toHaveValue("");
  await selector.selectOption(d.model.openings[1].id);
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect(selector).toHaveCount(0);
  await page.getByRole("button", { name: "Planta", exact: true }).click();
  await expect(selector).toHaveValue("");
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(d.model.floors[2].id);
  await expect(selector).toHaveCount(0);
});

test("revisão do seletor: escolher elemento descarta novo vão pendente", async ({
  page,
}) => {
  const d = overlapFixture();
  d.project.openingSettings = { base: 11300, top: 21800 };
  d.model.openings.push(
    { ...d.model.openings[0], id: crypto.randomUUID(), kind: "door", base: 0 },
    {
      ...d.model.openings[0],
      id: crypto.randomUUID(),
      kind: "opening",
      base: 14000,
    },
  );
  await load(page, d);
  await page.getByRole("button", { name: "Janela", exact: true }).click();
  await drag(page, [10, 4.5], [14, 4.5]);
  await expect(
    page.getByText("CONFIRMAR NOVO VÃO", { exact: true }),
  ).toBeVisible();
  const selector = page.getByLabel("Selecionar elemento", { exact: true });
  await selector.selectOption(d.model.openings[0].id);
  await expect(
    page.getByText("CONFIRMAR NOVO VÃO", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Base do vão", { exact: true })).toHaveValue(
    "70",
  );
  for (const o of d.model.openings) {
    await selector.selectOption(o.id);
    await expect(page.getByLabel("Base do vão", { exact: true })).toHaveValue(
      String(o.base / 100),
    );
    await expect(
      page.getByText("VÃO SELECIONADO", { exact: true }),
    ).toBeVisible();
  }
  await selector.selectOption(d.model.slabs[0].id);
  await expect(page.getByLabel("Propriedades da laje")).toBeVisible();
  await selector.selectOption("");
  await expect(page.getByLabel("Propriedades do vão")).toHaveCount(0);
  expect((await exported(page)).model).toEqual(d.model);
  await expect(
    page.getByRole("button", { name: "Desfazer", exact: true }),
  ).toBeDisabled();
});

test("prioridade do clique: vão, parede e laje sem pergunta entre categorias", async ({
  page,
}) => {
  for (const kind of ["door", "window", "opening"] as const) {
    const d = overlapFixture();
    d.model.openings[0].kind = kind;
    await load(page, d);
    const selector = page.getByLabel("Selecionar elemento", { exact: true });
    await click(page, 12, 8);
    await expect(selector).toHaveValue(d.model.slabs[0].id);
    await click(page, 12, 4.5);
    await expect(
      page.getByRole("heading", { name: "Parede 1", exact: true }),
    ).toBeVisible();
    await click(page, 6, 4.5);
    await expect(selector).toHaveValue(d.model.openings[0].id);
    await selector.selectOption(d.model.slabs[0].id);
    await click(page, 6, 4.5);
    await expect(selector).toHaveValue(d.model.openings[0].id);
    await expect(
      page.getByRole("group", { name: "Elementos sobrepostos" }),
    ).toHaveCount(0);
    expect((await exported(page)).model).toEqual(d.model);
    await expect(
      page.getByRole("button", { name: "Desfazer", exact: true }),
    ).toBeDisabled();
  }
});

test("prioridade do clique preserva arraste da laje pela lista e alça sobre parede", async ({
  page,
}) => {
  const d = overlapFixture();
  await load(page, d);
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(d.model.slabs[0].id);
  await drag(page, [6, 4.5], [6, 6.5]);
  const moved = await exported(page);
  expect(moved.model.slabs[0].contour[0].y).toBe(2500);
  expect(moved.model.walls).toEqual(d.model.walls);
  expect(moved.model.openings).toEqual(d.model.openings);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).model).toEqual(d.model);
  d.model.walls[0].a.y = 0;
  d.model.walls[0].b.y = 0;
  await load(page, d);
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(d.model.slabs[0].id);
  await drag(page, [8, 0], [8, -2]);
  const edged = await exported(page);
  expect(edged.model.slabs[0].contour[0].y).toBe(-2500);
  expect(edged.model.walls).toEqual(d.model.walls);
  expect(edged.model.openings).toEqual(d.model.openings);
});

test("revisão do seletor: lista substitui escolha contextual sobreposta", async ({
  page,
}) => {
  const d = overlapFixture();
  d.model.openings.push({
    ...d.model.openings[0],
    id: crypto.randomUUID(),
    base: 14000,
  });
  await load(page, d);
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(d.model.slabs[0].id);
  await click(page, 6, 4.5);
  const choices = page.getByRole("group", { name: "Elementos sobrepostos" });
  await expect(choices).toBeVisible();
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(d.model.openings[0].id);
  await expect(choices).toHaveCount(0);
  await expect(page.getByLabel("Propriedades do vão")).toBeVisible();
  expect((await exported(page)).model).toEqual(d.model);
});
