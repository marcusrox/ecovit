import { test, expect, blockEditing, type Page } from "./auth";
import {
  createProject,
  makeWall,
  type Project,
} from "../../src/domain/project";
import { roomGeometry, roomAreaText } from "../../src/domain/rooms";
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
      page
        .getByRole("region", { name: "Área do ambiente" })
        .getByText("12,00 m²", { exact: true }),
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
  "Etiqueta: painel recolhível, duplo clique e nome aplicado ao sair do campo",
  { tag: "@interface" },
  async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Etiqueta", exact: true }).click();
    await click(page, 15000, 15000);
    await expect(page.getByRole("status")).toContainText("Salvo");
    const original = (await state(page)).model.roomLabels[0];
    const panel = page.getByRole("complementary", {
      name: "Propriedades da etiqueta",
    });
    await expect(
      panel.getByText("PROPRIEDADES DA ETIQUETA", { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Nome do ambiente")).not.toBeFocused();
    await panel.getByRole("button", { name: "Recolher propriedades" }).click();
    await expect(panel).toHaveCount(0);
    await page
      .getByRole("button", { name: "Propriedades da etiqueta", exact: true })
      .click();
    await expect(panel).toBeVisible();
    await panel.getByRole("button", { name: "Recolher propriedades" }).click();
    const p = await point(page, original.position.x, original.position.y);
    await page.mouse.dblclick(p.x, p.y);
    const name = page.getByLabel("Nome do ambiente");
    await expect(name).toBeFocused();
    await name.fill("Sala/Cozinha");
    await expect
      .poll(async () => (await state(page)).model.roomLabels[0].name)
      .toBe(original.name);
    await panel
      .getByRole("heading", { name: original.name, exact: true })
      .click();
    await expect
      .poll(async () => (await state(page)).model.roomLabels[0].name)
      .toBe("Sala/Cozinha");
    await expect(page.getByRole("status")).toContainText("Salvo");
    expect((await state(page)).model.roomLabels[0]).toEqual({
      ...original,
      name: "Sala/Cozinha",
    });
    await page.screenshot({ path: ".tools/room-label-properties.png" });
    const renamed = await point(page, original.position.x, original.position.y);
    await page.mouse.dblclick(renamed.x, renamed.y);
    await expect(name).toBeFocused();
    await name.fill("Nome cancelado");
    await name.press("Escape");
    await name.press("Tab");
    expect((await state(page)).model.roomLabels[0].name).toBe("Sala/Cozinha");
    await blockEditing(page);
    await page.mouse.dblclick(renamed.x, renamed.y);
    await expect(name).toBeDisabled();
    await expect(name).not.toBeFocused();
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
    await expect(
      page.getByText(/Clique na etiqueta para reavaliar/),
    ).toBeVisible();
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
  "reavalia etiqueta por clique, preserva nome e referência, sem recuperar no arraste",
  { tag: "@fluxo" },
  async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Etiqueta", exact: true }).click();
    await click(page, 10000, 10000);
    const name = page.getByLabel("Nome do ambiente");
    await name.fill("Sala de estar");
    await name.press("Enter");
    await expect(page.getByRole("status")).toContainText("Salvo");
    const original = (await state(page)).model.roomLabels[0];
    const boundary = (await state(page)).model.roomBoundaries[1];
    await page.getByLabel("Selecionar elemento").selectOption(boundary.id);
    await page
      .getByRole("button", { name: "Excluir linha", exact: true })
      .click();
    await expect
      .poll(async () => (await state(page)).model.roomLabels[0].review)
      .toBe(true);
    await expect(page.getByRole("status")).toContainText("Salvo");
    const pending = await state(page);
    await click(page, 10000, 10000);
    expect(await state(page)).toEqual(pending);
    await page.getByRole("button", { name: "Fechamento", exact: true }).click();
    await draw(page, [30000, 0], [30000, 40000], 4);
    expect((await state(page)).model.roomLabels[0].review).toBe(true);
    const start = await point(page, 10000, 10000),
      end = await point(page, 50000, 10000);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 5 });
    await page.mouse.up();
    await expect
      .poll(async () => (await state(page)).model.roomLabels[0].position.x)
      .toBe(50000);
    expect((await state(page)).model.roomLabels[0].review).toBe(true);
    await expect(page.getByRole("status")).toContainText("Salvo");
    await click(page, 50000, 10000);
    await expect
      .poll(async () => (await state(page)).model.roomLabels[0].review)
      .toBe(false);
    await expect(name).toHaveValue("Sala de estar");
    await expect(page.getByText("12,00 m²", { exact: true })).toBeVisible();
    expect((await state(page)).model.roomLabels[0]).toEqual({
      ...original,
      position: { x: 50000, y: 10000 },
    });
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.getByRole("button", { name: /Desfazer/ }).click();
    await expect
      .poll(async () => (await state(page)).model.roomLabels[0].review)
      .toBe(true);
    await page.getByRole("button", { name: /Refazer/ }).click();
    await expect
      .poll(async () => (await state(page)).model.roomLabels[0].review)
      .toBe(false);
  },
);

test(
  "recupera etiqueta após mover uma parede e devolvê-la ao fechamento original",
  { tag: "@fluxo" },
  async ({ page }) => {
    const d = createProject(
      "Recuperação com paredes",
      { length: 2500, width: 1250, height: 700 },
      2100,
    );
    d.project.channelLevels = [];
    d.project.groutSettings = {
      ...d.project.groutSettings,
      junctions: false,
      openings: false,
      ends: false,
      intervals: false,
    };
    const corners = [
      { x: 0, y: 0 },
      { x: 40000, y: 0 },
      { x: 40000, y: 40000 },
      { x: 0, y: 40000 },
    ];
    d.model.walls = corners.map((a, i) =>
      makeWall(a, corners[(i + 1) % 4], 1250, d.model.floors[0].id, 2100, 1)!,
    );
    const area = roomGeometry(d, d.model.floors[0].id).at({
      x: 15000,
      y: 15000,
    })!.area;
    await page.getByTestId("import-file").setInputFiles({
      name: "paredes.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(d)),
    });
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.getByRole("button", { name: "Etiqueta", exact: true }).click();
    await click(page, 15000, 15000);
    await expect(page.getByLabel("Nome do ambiente")).toHaveValue("Ambiente 1");
    await page.getByLabel("Nome do ambiente").fill("Sala de estar");
    await page.getByLabel("Nome do ambiente").press("Enter");
    await expect(page.getByRole("status")).toContainText("Salvo");
    const original = (await state(page)).model.roomLabels[0];
    await page
      .getByRole("button", { name: "Selecionar", exact: false })
      .first()
      .click();
    const drag = async (from: [number, number], to: [number, number]) => {
      const a = await point(page, ...from),
        b = await point(page, ...to);
      await page.mouse.move(a.x, a.y);
      await page.mouse.down();
      await page.mouse.move(b.x, b.y, { steps: 8 });
      await page.mouse.up();
      await expect(page.getByRole("status")).toContainText("Salvo");
    };
    await drag([40625, 20000], [50625, 20000]);
    await expect
      .poll(
        async () =>
          (await state(page)).model.walls.find(
            (w) => w.id === d.model.walls[1].id,
          )!.a.x,
      )
      .toBe(50000);
    await expect
      .poll(async () => (await state(page)).model.roomLabels[0].review)
      .toBe(true);
    await drag([50625, 20000], [40625, 20000]);
    expect(
      [...(await state(page)).model.walls].sort((a, b) =>
        a.id.localeCompare(b.id),
      ),
    ).toEqual([...d.model.walls].sort((a, b) => a.id.localeCompare(b.id)));
    expect((await state(page)).model.roomLabels[0].review).toBe(true);
    await click(page, 15000, 15000);
    await expect
      .poll(async () => (await state(page)).model.roomLabels[0].review)
      .toBe(false);
    await expect(page.getByLabel("Nome do ambiente")).toHaveValue(
      "Sala de estar",
    );
    await expect(
      page.getByText(roomAreaText(area), { exact: true }),
    ).toBeVisible();
    expect((await state(page)).model.roomLabels[0]).toEqual(original);
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
