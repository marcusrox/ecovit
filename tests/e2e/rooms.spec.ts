import { test, expect, blockEditing, type Page } from "./auth";
import { createProject, type Project } from "../../src/domain/project";
import { readFile } from "node:fs/promises";
import { parseFile } from "../../src/persistence/files";

async function state(page: Page): Promise<Project> {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    return (await import(path)).useStore.getState().doc;
  });
}
async function open(page: Page, rectangle = true) {
  const d = createProject("T-018 Ambientes", {
    length: 2000,
    width: 1000,
    height: 700,
  });
  if (rectangle) {
    const ring = [
      { x: 0, y: 0 },
      { x: 30000, y: 0 },
      { x: 30000, y: 40000 },
      { x: 0, y: 40000 },
    ];
    d.model.roomBoundaries = ring.map((a, i) => ({
      id: crypto.randomUUID(),
      floorId: d.model.floors[0].id,
      a,
      b: ring[(i + 1) % 4],
    }));
  }
  await page.getByTestId("import-file").setInputFiles({
    name: "ambientes.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  await expect(page.getByTestId("drawing")).toBeVisible();
}
async function point(page: Page, x: number, y: number) {
  const el = page.getByTestId("drawing"),
    box = (await el.boundingBox())!,
    c = JSON.parse((await el.getAttribute("data-camera"))!);
  return { x: box.x + c.x + x * c.scale, y: box.y + c.y + y * c.scale };
}
async function click(page: Page, x: number, y: number) {
  const q = await point(page, x, y);
  await page.mouse.click(q.x, q.y);
}
async function draw(
  page: Page,
  a: [number, number],
  b: [number, number],
  count: number,
) {
  await click(page, ...a);
  await click(page, ...b);
  await expect
    .poll(async () => (await state(page)).model.roomBoundaries.length)
    .toBe(count);
  await expect(page.getByRole("status")).toContainText("Salvo");
}

test(
  "T-018 cria contorno somente por linhas, etiqueta, renomeia, move e preserva no transporte",
  { tag: "@fluxo" },
  async ({ page }) => {
    await open(page, false);
    await page.getByRole("button", { name: "Fechamento", exact: true }).click();
    await draw(page, [0, 0], [30000, 0], 1);
    await draw(page, [30000, 0], [30000, 40000], 2);
    await draw(page, [30000, 40000], [0, 40000], 3);
    await draw(page, [0, 40000], [0, 0], 4);
    await page.getByRole("button", { name: "Etiqueta", exact: true }).click();
    await click(page, 15000, 15000);
    await expect
      .poll(async () => (await state(page)).model.roomLabels.length)
      .toBe(1);
    await expect(page.getByLabel("Nome do ambiente")).toHaveValue("Ambiente 1");
    await expect(
      page.getByText("Área: 12,00 m²", { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Nome do ambiente")).not.toBeFocused();
    await page.getByLabel("Nome do ambiente").fill("Sala de estar");
    await page.getByLabel("Nome do ambiente").press("Enter");
    await expect
      .poll(async () => (await state(page)).model.roomLabels[0].name)
      .toBe("Sala de estar");
    const before = (await state(page)).model.roomLabels[0];
    const a = await point(page, 15000, 15000),
      b = await point(page, 36000, 15000);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 8 });
    await page.mouse.up();
    await expect
      .poll(async () => (await state(page)).model.roomLabels[0].position.x)
      .toBeGreaterThan(30000);
    expect((await state(page)).model.roomLabels[0].reference).toEqual(
      before.reference,
    );
    await click(page, 10000, 25000);
    expect((await state(page)).model.roomLabels).toHaveLength(1);
    await expect(page.getByLabel("Nome do ambiente")).toHaveValue(
      "Sala de estar",
    );
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    const file = await download;
    const exported = parseFile(await readFile((await file.path())!, "utf8"));
    expect(exported.model.roomLabels).toEqual(
      (await state(page)).model.roomLabels,
    );
    await page.reload();
    await page
      .getByRole("button", { name: /T-018 Ambientes/ })
      .first()
      .click();
    await expect(page.getByTestId("drawing")).toBeVisible();
    expect((await state(page)).model.roomLabels).toEqual(
      exported.model.roomLabels,
    );
  },
);

test(
  "T-018 revisão persiste, desfazer restaura e recriar usa próximo número",
  { tag: "@fluxo" },
  async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Etiqueta", exact: true }).click();
    await click(page, 10000, 10000);
    await expect(page.getByLabel("Nome do ambiente")).toHaveValue("Ambiente 1");
    const original = await state(page);
    await page
      .getByLabel("Selecionar elemento")
      .selectOption(original.model.roomBoundaries[1].id);
    await page
      .getByRole("button", { name: "Excluir linha", exact: true })
      .click();
    await expect
      .poll(async () => (await state(page)).model.roomLabels[0].review)
      .toBe(true);
    await page.getByRole("button", { name: /Desfazer/ }).click();
    await expect
      .poll(async () => (await state(page)).model.roomLabels[0].review)
      .toBe(false);
    await page.getByRole("button", { name: /Refazer/ }).click();
    await expect
      .poll(async () => (await state(page)).model.roomLabels[0].review)
      .toBe(true);
    await page.getByRole("button", { name: "Fechamento", exact: true }).click();
    await draw(page, [30000, 0], [30000, 40000], 4);
    expect((await state(page)).model.roomLabels[0].review).toBe(true);
    await page
      .getByLabel("Selecionar elemento")
      .selectOption(original.model.roomLabels[0].id);
    await expect(
      page.getByText("Revisar ambiente", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/Exclua esta etiqueta/)).toBeVisible();
    await page.screenshot({ path: ".tools/t018-revisao.png" });
    await page
      .getByRole("button", { name: "Excluir etiqueta", exact: true })
      .click();
    await page.getByRole("button", { name: "Etiqueta", exact: true }).click();
    await click(page, 10000, 10000);
    await expect(page.getByLabel("Nome do ambiente")).toHaveValue("Ambiente 2");
  },
);

test(
  "T-018 move corpo e ajusta ponta da linha com revisão e desfazer",
  { tag: "@fluxo" },
  async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Etiqueta", exact: true }).click();
    await click(page, 10000, 10000);
    await expect(page.getByLabel("Nome do ambiente")).toHaveValue("Ambiente 1");
    const original = await state(page),
      boundaryId = original.model.roomBoundaries[1].id;
    const drag = async (a: [number, number], b: [number, number]) => {
      const from = await point(page, ...a),
        to = await point(page, ...b);
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(to.x, to.y, { steps: 6 });
      await page.mouse.up();
      await expect(page.getByRole("status")).toContainText("Salvo");
    };
    await page.getByLabel("Selecionar elemento").selectOption(boundaryId);
    await drag([30000, 20000], [40000, 20000]);
    await expect
      .poll(async () => (await state(page)).model.roomBoundaries[1].a.x)
      .toBe(40000);
    expect((await state(page)).model.roomLabels[0].review).toBe(true);
    await page.getByRole("button", { name: /Desfazer/ }).click();
    await expect
      .poll(async () => (await state(page)).model.roomLabels[0].review)
      .toBe(false);
    await page.getByLabel("Selecionar elemento").selectOption(boundaryId);
    await drag([30000, 0], [30000, 2000]);
    await expect
      .poll(async () => (await state(page)).model.roomBoundaries[1].a.y)
      .toBe(2000);
    expect((await state(page)).model.roomBoundaries[1].b).toEqual(
      original.model.roomBoundaries[1].b,
    );
    expect((await state(page)).model.roomLabels[0].review).toBe(true);
  },
);

test(
  "T-018 controles compactos, cancelamento e bloqueios",
  { tag: "@interface" },
  async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await open(page);
    const label = page.getByRole("button", { name: "Etiqueta", exact: true }),
      boundary = page.getByRole("button", { name: "Fechamento", exact: true });
    await expect(label).toHaveAttribute("title", "Etiqueta com área");
    await expect(boundary).toHaveAttribute("title", "Fechamento de ambiente");
    await boundary.click();
    await click(page, 5000, 5000);
    await expect(
      page.getByText(/^Clique no ponto final · Alt suspende atração/),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(boundary).toHaveAttribute("aria-pressed", "true");
    expect((await state(page)).model.roomBoundaries).toHaveLength(4);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Selecionar", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await label.click();
    await click(page, 10000, 10000);
    await expect(page.getByLabel("Nome do ambiente")).toBeVisible();
    await page
      .getByLabel("Nome do ambiente")
      .fill(
        "Ambiente com nome longo para conferir quebra de texto centralizado",
      );
    await page.getByLabel("Nome do ambiente").press("Enter");
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.screenshot({ path: ".tools/t018-planta-1280.png" });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const selectedId = (await state(page)).model.roomLabels[0].id;
    await page.getByRole("button", { name: "Fiada", exact: true }).click();
    await expect(label).toHaveCount(0);
    await expect(boundary).toHaveCount(0);
    await expect(
      page.getByText("Clique no interior do ambiente · Esc encerra Etiqueta", {
        exact: true,
      }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Planta", exact: true }).click();
    await page.getByLabel("Selecionar elemento").selectOption(selectedId);
    await blockEditing(page);
    await expect(label).toBeDisabled();
    await expect(boundary).toBeDisabled();
    await expect(page.getByLabel("Nome do ambiente")).toBeDisabled();
  },
);
