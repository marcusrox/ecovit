import { test, expect, rejectSaves, type Page } from "./auth";
import {
  createProject,
  makeWall,
  defaultGroutSettings,
  type Opening,
} from "../../src/domain/project";
import { addFloor } from "../../src/domain/floors";
import { parseFile } from "../../src/persistence/files";
import { readFile } from "node:fs/promises";
const dialog = (p: Page) =>
  p.getByRole("dialog", { name: "Orçamento", exact: true });
const totals = (p: Page) => dialog(p).getByRole("definition");
const material = (p: Page) =>
  p.getByLabel("Material da esquadria", { exact: true });
const description = (p: Page) =>
  p.getByLabel("Descrição do material", { exact: true });
const price = (p: Page) =>
  dialog(p).getByRole("textbox", { name: /^Preço de Porta/ });
async function snapshot(p: Page) {
  return p.evaluate(async () => {
    const path = "/src/state/store.ts";
    const s = (await import(path)).useStore.getState();
    return { doc: s.doc, history: s.history, active: s.activeFloorId };
  });
}
async function saved(p: Page) {
  await expect(p.getByRole("status")).toContainText("Salvo");
}
async function choose(p: Page, id: string) {
  const current = await snapshot(p);
  const opening = current.doc.model.openings.find((o: Opening) => o.id === id)!;
  const floorId = current.doc.model.walls.find(
    (w: { id: string }) => w.id === opening.wallId,
  )!.floorId;
  if (floorId !== current.active)
    await p.getByLabel("Pavimento", { exact: true }).selectOption(floorId);
  await p.getByLabel("Selecionar elemento", { exact: true }).selectOption(id);
}
async function open(p: Page) {
  await p.getByRole("button", { name: "Orçamento", exact: true }).click();
}
async function close(p: Page) {
  await dialog(p).getByRole("button", { name: "Voltar ao desenho" }).click();
}
async function setPrice(p: Page, value: string) {
  await price(p).fill(value);
  await price(p).press("Enter");
  await expect(dialog(p).getByRole("status")).toContainText("Salvo");
}
async function fixture(p: Page, configured = false) {
  let d = createProject(
    "Esquadrias T-036",
    { length: 2000, width: 1000, height: 1000 },
    30000,
  );
  d.project.channelLevels = [];
  d.project.groutSettings = defaultGroutSettings(false);
  d.project.unitPrices = { whole: 0, half: 0, channel: 0, "half-channel": 0 };
  d.project.settlement = { ac1: { percent: 10000, price: 0 } };
  d = addFloor(d, { name: "Superior", level: 30000, defaultHeight: 30000 });
  d = addFloor(d, { name: "Vazio", level: 60000, defaultHeight: 30000 });
  d.model.walls = d.model.floors
    .slice(0, 2)
    .map((f) =>
      makeWall({ x: 0, y: 0 }, { x: 40000, y: 0 }, 1000, f.id, 30000, 1)!,
    );
  d.model.openings = [0, 0, 1].map((f, i): Opening => ({
    id: crypto.randomUUID(),
    wallId: d.model.walls[f].id,
    kind: "door",
    appearance: { type: "swing", orientation: i as 0 | 1 | 2 },
    ...(configured ? { material: { kind: "wood-hollow" as const } } : {}),
    offset: f ? 10000 : 5000 + i * 15000,
    width: 8000,
    height: 21000,
    base: 0,
  }));
  await p.getByTestId("import-file").setInputFiles({
    name: "esquadrias.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await saved(p);
  return d;
}

test(
  "T-036 materiais, preços, subtotais por pavimento e consulta independente da composição",
  { tag: "@interface" },
  async ({ page }) => {
    const input = await fixture(page),
      before = await snapshot(page);
    for (const o of input.model.openings) {
      await choose(page, o.id);
      await expect(material(page).locator("option")).toHaveCount(8);
      await expect(material(page)).toHaveValue("");
      await expect(material(page).locator('option[value="wood"]')).toHaveCount(
        0,
      );
      if (o.id === input.model.openings[0].id) {
        await material(page).selectOption("aluminium-glass");
        await saved(page);
        expect(
          (await snapshot(page)).doc.model.openings.find(
            (item: Opening) => item.id === o.id,
          ).material.kind,
        ).toBe("aluminium-glass");
      }
      await material(page).selectOption("wood-glass");
      await saved(page);
    }
    await page
      .getByLabel("Pavimento", { exact: true })
      .selectOption(before.active);
    const configured = await snapshot(page);
    expect(configured.doc.generated).toEqual(before.doc.generated);
    expect(configured.doc.generationState).toEqual(before.doc.generationState);
    await open(page);
    const group = dialog(page).getByRole("region", {
      name: "Orçamento de esquadrias",
      exact: true,
    });
    await expect(group.locator("tbody tr")).toHaveCount(1);
    await setPrice(page, "500");
    await expect(group.locator("tfoot")).toContainText("R$ 1.500,00");
    await expect(totals(page)).toHaveText([
      "R$ 0,00",
      "R$ 0,00",
      "R$ 0,00",
      "R$ 1.500,00",
      "R$ 0,00",
      "R$ 0,00",
      "R$ 1.500,00",
    ]);
    await dialog(page)
      .getByRole("button", { name: "Exibir detalhamento" })
      .click();
    await dialog(page).getByLabel("Pavimento da consulta").selectOption("all");
    const detail = dialog(page).getByRole("region", {
      name: /^Esquadrias de /,
    });
    await expect(detail).toHaveCount(3);
    await expect(detail.nth(0).locator("tfoot")).toContainText("R$ 1.000,00");
    await expect(detail.nth(1).locator("tfoot")).toContainText("R$ 500,00");
    await expect(detail.nth(2).locator("tfoot")).toContainText("R$ 0,00");
    await dialog(page)
      .getByLabel("Pavimento da consulta")
      .selectOption(input.model.floors[1].id);
    await expect(detail).toHaveCount(1);
    expect((await snapshot(page)).active).toBe(before.active);
    await price(page).fill("-1");
    await expect(price(page)).toHaveAttribute("aria-invalid", "true");
    await expect(totals(page).last()).toHaveText("Indisponível");
    await setPrice(page, "500");
    await page.setViewportSize({ width: 900, height: 680 });
    await group.scrollIntoViewIfNeeded();
    expect(
      await dialog(page).evaluate((e) => e.scrollWidth <= e.clientWidth),
    ).toBe(true);
    await page.screenshot({ path: ".tools/t036-budget-900.png" });
    await page.evaluate(async () => {
      const path = "/src/state/store.ts",
        store = (await import(path)).useStore;
      store.setState((s: { doc: object }) => ({
        doc: {
          ...s.doc,
          generated: null,
          generationState: { status: "outdated", diagnostics: [] },
        },
      }));
    });
    await expect(group.locator("tfoot")).toContainText("R$ 1.500,00");
    await expect(detail.locator("tfoot")).toContainText("R$ 500,00");
    await expect(totals(page).last()).toHaveText("Indisponível");
  },
);

test(
  "T-036 Outro cancela antes do blur, troca de seleção descarta e confirmação valida material",
  { tag: "@interface" },
  async ({ page }) => {
    const input = await fixture(page, true);
    await choose(page, input.model.openings[0].id);
    const before = await snapshot(page);
    await material(page).selectOption("other");
    await description(page).fill("Madeira azul");
    await page
      .getByRole("button", { name: "Cancelar edição", exact: true })
      .click();
    await expect(material(page)).toHaveValue("wood-hollow");
    expect(await snapshot(page)).toEqual(before);
    await material(page).selectOption("other");
    await description(page).fill("Não gravar");
    await choose(page, input.model.openings[1].id);
    await expect(material(page)).toHaveValue("wood-hollow");
    expect(await snapshot(page)).toEqual(before);
    await material(page).selectOption("other");
    await description(page).fill("Descartar");
    await description(page).press("Escape");
    await expect(material(page)).toHaveValue("wood-hollow");
    expect(await snapshot(page)).toEqual(before);
    await material(page).selectOption("other");
    await description(page).fill("x".repeat(101));
    await description(page).press("Enter");
    await expect(description(page)).toHaveAttribute("aria-invalid", "true");
    expect(await snapshot(page)).toEqual(before);
    await description(page).fill("  Madeira azul  ");
    await description(page).press("Enter");
    await saved(page);
    await expect(description(page)).toHaveValue("Madeira azul");
    const after = await snapshot(page);
    expect(after.history.past.length).toBe(before.history.past.length + 1);
    expect(after.doc.generated).toEqual(before.doc.generated);
    await page.setViewportSize({ width: 900, height: 680 });
    await description(page).scrollIntoViewIfNeeded();
    await expect(description(page)).toBeVisible();
    await page.screenshot({ path: ".tools/t036-material-900.png" });
  },
);

test(
  "T-036 histórico, reabertura e falha preservam material e preço em arquivo e recuperação",
  { tag: "@fluxo" },
  async ({ page }) => {
    await fixture(page, true);
    await open(page);
    await setPrice(page, "500");
    await close(page);
    await page.getByRole("button", { name: "Desfazer", exact: true }).click();
    await saved(page);
    expect((await snapshot(page)).doc.project.openingPrices).toBeUndefined();
    await page.getByRole("button", { name: "Refazer", exact: true }).click();
    await saved(page);
    const name = (await snapshot(page)).doc.project.name;
    await page.reload();
    await page.getByText(name, { exact: true }).click();
    await saved(page);
    await open(page);
    await expect(price(page)).toHaveValue("500,00");
    await rejectSaves(page);
    await price(page).fill("600");
    await price(page).press("Enter");
    await expect(dialog(page).getByRole("status")).toContainText("Não salvo");
    await expect(price(page)).toBeDisabled();
    await expect(totals(page).nth(3)).toHaveText("R$ 1.800,00");
    await close(page);
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    const file = await download;
    const loaded = parseFile(await readFile((await file.path())!, "utf8"));
    expect(loaded.schemaVersion).toBe(37);
    expect(loaded.project.openingPrices?.[0].price).toBe(60000);
    expect(loaded.model.openings[0].material?.kind).toBe("wood-hollow");
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      await (await import(path)).useStore.getState().discard();
    });
    expect((await snapshot(page)).doc.project.openingPrices?.[0].price).toBe(
      50000,
    );
  },
);
