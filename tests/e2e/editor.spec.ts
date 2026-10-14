import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function create(page: Page, name = "Casa de teste") {
  await page.goto("/");
  await page.getByRole("button", { name: /Novo projeto/ }).click();
  await page.getByRole("textbox", { name: "Nome do projeto" }).fill(name);
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function point(page: Page, x: number, y: number) {
  const drawing = page.getByTestId("drawing"),
    box = (await drawing.boundingBox())!;
  const camera = JSON.parse((await drawing.getAttribute("data-camera"))!);
  return {
    x: box.x + camera.x + x * camera.scale,
    y: box.y + camera.y + y * camera.scale,
  };
}
async function drag(page: Page, from: [number, number], to: [number, number]) {
  const a = await point(page, ...from),
    b = await point(page, ...to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function exported(page: Page) {
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  const file = await promise;
  return JSON.parse(await readFile((await file.path())!, "utf8"));
}

test("M1 criar, desenhar, editar ambas as pontas, histórico, salvar e transportar", async ({
  page,
  browser,
}) => {
  await create(page);
  await drag(page, [0, 0], [20000, 0]);
  await expect(page.getByText("1 parede ·")).toBeVisible();
  await drag(page, [20000, 0], [22500, 0]);
  await drag(page, [0, 0], [-2500, 0]);
  await expect(page.getByLabel("Comprimento", { exact: true })).toHaveValue(
    "250",
  );
  let doc = await exported(page);
  const wall = doc.model.walls[0];
  expect(wall.a).toEqual({ x: -2500, y: 0 });
  expect(wall.b).toEqual({ x: 22500, y: 0 });
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  doc = await exported(page);
  expect(doc.model.walls[0].a).toEqual({ x: 0, y: 0 });
  expect(doc.model.walls[0].id).toBe(wall.id);
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  await page.reload();
  await page.getByRole("button", { name: /Casa de teste/ }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await exported(page)).model.walls).toEqual([wall]);
  const context = await browser.newContext(),
    other = await context.newPage();
  await other.goto("/");
  await other.getByTestId("import-file").setInputFiles({
    name: "casa.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(await exported(page))),
  });
  await expect(other.getByRole("status")).toContainText("Salvo");
  const copy = await exported(other);
  expect(copy.project.id).not.toBe(doc.project.id);
  expect(copy.model.walls).toEqual([wall]);
  await context.close();
});

test("M1 medidas incompatíveis, base personalizada, lado e gestos cancelados", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Novo projeto/ }).click();
  await page.getByLabel("Tijolo-base").selectOption("custom");
  await page.getByLabel("Comprimento do tijolo").fill("28");
  await page.getByLabel("Largura do tijolo").fill("15");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByRole("alert")).toContainText("dobro");
  await page.getByLabel("Largura do tijolo").fill("14");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  await expect(page.getByTestId("drawing")).toHaveAttribute(
    "data-module",
    "1400",
  );
  const a = await point(page, 0, 0),
    b = await point(page, 14000, 0);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y);
  await page.keyboard.press("Escape");
  await page.mouse.up();
  expect((await exported(page)).model.walls).toHaveLength(0);
  await page.getByRole("button", { name: "Parede", exact: true }).click();
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y);
  await page.mouse.move(5, 5);
  await page.mouse.up();
  expect((await exported(page)).model.walls).toHaveLength(0);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.mouse.up();
  expect((await exported(page)).model.walls).toHaveLength(0);
  await page.getByRole("button", { name: /Inverter lado/ }).click();
  await drag(page, [0, 0], [14000, 0]);
  expect((await exported(page)).model.walls[0].side).toBe(-1);
  await page.getByLabel("Comprimento", { exact: true }).fill("143");
  await page.getByLabel("Comprimento", { exact: true }).press("Tab");
  await page.getByRole("button", { name: "154 cm", exact: true }).click();
  await expect(page.getByLabel("Comprimento", { exact: true })).toHaveValue(
    "154",
  );
});

test("M1 arquivo inválido preserva trabalho; falha de escrita permite download atual", async ({
  page,
}) => {
  await create(page);
  await drag(page, [0, 0], [20000, 0]);
  const original = await exported(page);
  await page.getByTestId("import-file").setInputFiles({
    name: "ruim.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from("invalid"),
  });
  await expect(page.getByRole("alert")).toContainText("JSON");
  expect((await exported(page)).model).toEqual(original.model);
  await page.getByTestId("import-file").setInputFiles({
    name: "futuro.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ ...original, schemaVersion: 999 })),
  });
  await expect(page.getByRole("alert")).toContainText("suportados");
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("Teste de armazenamento", "QuotaExceededError");
    };
  });
  await page.getByLabel("Nome do projeto", { exact: true }).fill("Em memória");
  await page.getByLabel("Nome do projeto", { exact: true }).press("Tab");
  await expect(page.getByRole("status")).toContainText("Não salvo");
  const current = await exported(page);
  expect(current.project.name).toBe("Em memória");
  expect(current.model).toEqual(original.model);
});

test("M1 segunda aba bloqueada e desbloqueada após encerrar a primeira", async ({
  page,
  context,
}) => {
  await create(page);
  const other = await context.newPage();
  await other.goto("/");
  await other.getByRole("button", { name: /Casa de teste/ }).click();
  await expect(other.getByRole("status")).toContainText("Somente leitura");
  await expect(
    other.getByRole("button", { name: "Parede", exact: true }),
  ).toBeDisabled();
  await page.close();
  // Closing the tab and releasing its Web Lock are asynchronous in the browser.
  // Reopen only after the old owner is gone; no fixed sleep or forced unlock.
  await expect
    .poll(() =>
      other.evaluate(
        async () =>
          (await navigator.locks.query()).held?.some((lock) =>
            lock.name?.startsWith("ecovit:"),
          ) ?? false,
      ),
    )
    .toBe(false);
  await other.getByRole("button", { name: "Projetos", exact: true }).click();
  await other.getByRole("button", { name: /Casa de teste/ }).click();
  await expect(other.getByRole("status")).toContainText("Salvo");
  await expect(
    other.getByRole("button", { name: "Parede", exact: true }),
  ).toBeEnabled();
});

test("M1 encontro L/T, seleção, excluir e atalhos sem interferir em campos", async ({
  page,
}) => {
  await create(page);
  await drag(page, [0, 0], [20000, 0]);
  await page.getByRole("button", { name: "Selecionar", exact: true }).click();
  const empty = await point(page, 10000, 15000);
  await page.mouse.click(empty.x, empty.y);
  await page.getByRole("button", { name: "Parede", exact: true }).click();
  await drag(page, [20000, 10000], [20000, 0]);
  await page.getByRole("button", { name: "Selecionar", exact: true }).click();
  await page.mouse.click(empty.x, empty.y);
  await page.getByRole("button", { name: "Parede", exact: true }).click();
  await drag(page, [10000, 10000], [10000, 0]);
  expect((await exported(page)).model.walls).toHaveLength(3);
  await page.getByRole("button", { name: "Selecionar", exact: true }).click();
  const crossing = await point(page, 11000, 1000);
  await page.mouse.click(crossing.x, crossing.y);
  await expect(
    page.getByText("Selecionar parede", { exact: true }),
  ).toBeVisible();
  // The upward drag now includes the initial 100–112.5 cm cell.
  await page.getByRole("button", { name: "Parede 3 · 112,5 cm" }).click();
  await page
    .getByRole("button", { name: "Excluir parede", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  await page.getByTestId("drawing").click({ position: { x: 15, y: 100 } });
  await page.keyboard.press("Control+z");
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await exported(page)).model.walls).toHaveLength(3);
  await page.getByLabel("Nome do projeto", { exact: true }).fill("Texto");
  await page.getByLabel("Nome do projeto", { exact: true }).press("Home");
  await page.keyboard.press("Delete");
  await page.getByLabel("Nome do projeto", { exact: true }).press("Tab");
  expect((await exported(page)).model.walls).toHaveLength(3);
});

test("navegação com botão do meio, Espaço e saída do canvas preserva projeto", async ({
  page,
}) => {
  await create(page, "Navegação");
  await drag(page, [0, 0], [10000, 0]);
  const original = await exported(page);
  const drawing = page.getByTestId("drawing");
  const camera = async () =>
    JSON.parse((await drawing.getAttribute("data-camera"))!);
  for (const mode of ["Planta", "Fiada"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    const box = (await drawing.boundingBox())!;
    const x = box.x + 300,
      y = box.y + 220,
      before = await camera();
    await page.mouse.move(x, y);
    await page.mouse.down({ button: "middle" });
    await expect(drawing).toHaveCSS("cursor", "grabbing");
    // Releasing Space or a different mouse button must not end a middle pan.
    await page.keyboard.down("Space");
    await page.keyboard.up("Space");
    await page.mouse.down({ button: "left" });
    await page.mouse.up({ button: "left" });
    await page.mouse.move(x + 80, y + 45, { steps: 4 });
    await expect
      .poll(camera)
      .toEqual({ ...before, x: before.x + 80, y: before.y + 45 });
    await page.mouse.up({ button: "middle" });
    await expect(drawing).not.toHaveCSS("cursor", "grabbing");
    const stopped = await camera();
    await page.mouse.move(x + 110, y + 70);
    expect(await camera()).toEqual(stopped);
    // The pan follows the pointer outside the canvas and ends there too.
    await page.mouse.down({ button: "middle" });
    await page.mouse.move(10, 15, { steps: 4 });
    await page.mouse.up({ button: "middle" });
    await expect(drawing).not.toHaveCSS("cursor", "grabbing");
    const outside = await camera();
    await page.mouse.move(x, y);
    expect(await camera()).toEqual(outside);
    // Space + left drag remains available.
    await page.keyboard.down("Space");
    await page.mouse.down();
    await page.mouse.move(x + 30, y + 20);
    await page.mouse.up();
    await page.keyboard.up("Space");
    await expect
      .poll(camera)
      .toEqual({ ...outside, x: outside.x + 30, y: outside.y + 20 });
    await page.mouse.down({ button: "middle" });
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await page.mouse.up({ button: "middle" });
    await expect(drawing).not.toHaveCSS("cursor", "grabbing");
    const beforeWheel = await camera();
    await page.mouse.wheel(0, -100);
    await expect
      .poll(async () => (await camera()).scale)
      .toBeGreaterThan(beforeWheel.scale);
    expect(await exported(page)).toEqual(original);
  }
});
