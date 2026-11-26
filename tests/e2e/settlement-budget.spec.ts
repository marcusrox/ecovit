import { test, expect, rejectSaves, type Page } from "./auth";
import {
  createProject,
  makeWall,
  defaultGroutSettings,
} from "../../src/domain/project";
import { addFloor } from "../../src/domain/floors";
import { parseFile } from "../../src/persistence/files";
import { readFile } from "node:fs/promises";

const dialog = (p: Page) =>
  p.getByRole("dialog", { name: "Orçamento", exact: true });
const totals = (p: Page) => dialog(p).getByRole("definition");
const inputs = (p: Page, label: string) =>
  dialog(p).getByLabel(label, { exact: true });
async function saved(p: Page) {
  await expect(dialog(p).getByRole("status")).toContainText("Salvo");
}
async function open(p: Page) {
  await p.getByRole("button", { name: "Orçamento", exact: true }).click();
  await expect(dialog(p)).toBeVisible();
}
async function close(p: Page) {
  await dialog(p).getByRole("button", { name: "Voltar ao desenho" }).click();
}
async function set(p: Page, label: string, value: string) {
  await inputs(p, label).fill(value);
  await inputs(p, label).press("Enter");
  await saved(p);
}
async function snapshot(p: Page) {
  return p.evaluate(async () => {
    const path = "/src/state/store.ts";
    const { useStore } = await import(path);
    const s = useStore.getState();
    return { doc: s.doc, past: s.history.past.length, active: s.activeFloorId };
  });
}
async function fixture(p: Page, configured = false) {
  let d = createProject(
    "Assentamento T-035",
    { length: 2000, width: 1000, height: 1000 },
    10000,
  );
  d.project.groutSettings = defaultGroutSettings(false);
  d.project.channelLevels = [];
  d.project.unitPrices = { whole: 0, half: 0, channel: 0, "half-channel": 0 };
  if (configured)
    d.project.settlement = { ac1: { percent: 10000, price: 3000 } };
  d = addFloor(d, { name: "Superior", level: 20000, defaultHeight: 10000 });
  d = addFloor(d, { name: "Vazio", level: 40000, defaultHeight: 10000 });
  d.model.walls = [60, 40].map((a, i) =>
    makeWall(
      { x: 0, y: 0 },
      { x: a * 10000, y: 0 },
      1000,
      d.model.floors[i].id,
      10000,
      1,
    )!,
  );
  await p.getByTestId("import-file").setInputFiles({
    name: "assentamento.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(p.getByRole("status")).toContainText("Salvo");
  return d;
}

test(
  "T-035 parâmetros, compra global, rateio, filtros e layout estreito",
  { tag: "@interface" },
  async ({ page }) => {
    const original = await fixture(page),
      before = await snapshot(page);
    await open(page);
    await expect(
      dialog(page)
        .getByRole("region", {
          name: "Parâmetros de assentamento",
          exact: true,
        })
        .locator("tbody tr"),
    ).toHaveCount(6);
    await expect(
      inputs(page, "Rendimento de Argamassa AC1 (kg/m²)"),
    ).toHaveValue("1,4");
    await expect(inputs(page, "Rendimento de Cola branca (ml/m²)")).toHaveValue(
      "80",
    );
    await expect(dialog(page)).toContainText("Faltam 100%");
    await expect(totals(page)).toHaveText([
      "R$ 0,00",
      "R$ 0,00",
      "Indisponível",
      "R$ 0,00",
      "R$ 0,00",
      "R$ 0,00",
      "Indisponível",
    ]);
    expect((await snapshot(page)).past).toBe(before.past);
    await set(page, "Percentual de Argamassa AC1 (%)", "60");
    await expect(dialog(page)).toContainText("Faltam 40%");
    await set(page, "Percentual de Argamassa AC1 (%)", "100");
    await set(page, "Preço de Argamassa AC1 (R$/saco de 20 kg)", "30");
    const global = dialog(page).getByRole("region", {
      name: "Quantitativos de assentamento",
      exact: true,
    });
    await expect(global.locator('[data-settlement-key="ac1"]')).toHaveText(
      "Argamassa AC1100140 kg7R$ 210,00",
    );
    await expect(totals(page)).toHaveText([
      "R$ 0,00",
      "R$ 0,00",
      "R$ 210,00",
      "R$ 0,00",
      "R$ 0,00",
      "R$ 0,00",
      "R$ 210,00",
    ]);
    await dialog(page)
      .getByRole("button", { name: "Exibir detalhamento" })
      .click();
    await inputs(page, "Pavimento da consulta").selectOption("all");
    const detail = dialog(page).getByRole("region", {
      name: "Assentamento do pavimento consultado",
      exact: true,
    });
    await expect(detail).toHaveCount(3);
    await expect(detail.nth(0).locator("tfoot")).toContainText("R$ 126,00");
    await expect(detail.nth(1).locator("tfoot")).toContainText("R$ 84,00");
    await expect(detail.nth(2).locator("tfoot")).toContainText("R$ 0,00");
    await inputs(page, "Pavimento da consulta").selectOption(
      original.model.floors[1].id,
    );
    await expect(detail).toHaveCount(1);
    await expect(detail).toContainText("40 m²");
    await expect(totals(page)).toHaveText([
      "R$ 0,00",
      "R$ 0,00",
      "R$ 210,00",
      "R$ 0,00",
      "R$ 0,00",
      "R$ 0,00",
      "R$ 210,00",
    ]);
    expect((await snapshot(page)).active).toBe(before.active);
    await inputs(page, "Rendimento de Argamassa AC1 (kg/m²)").fill("1,4001");
    await expect(
      inputs(page, "Rendimento de Argamassa AC1 (kg/m²)"),
    ).toHaveAttribute("aria-invalid", "true");
    await expect(
      global.locator('[data-settlement-key="ac1"]'),
    ).not.toContainText("140 kg");
    await expect(totals(page).last()).toHaveText("Indisponível");
    await set(page, "Rendimento de Argamassa AC1 (kg/m²)", "1,5");
    await expect(global.locator('[data-settlement-key="ac1"]')).toHaveText(
      "Argamassa AC1100150 kg8R$ 240,00",
    );
    const after = await snapshot(page);
    expect(after.doc.generated).toEqual(before.doc.generated);
    expect(after.doc.generationState).toEqual(before.doc.generationState);
    await page.setViewportSize({ width: 900, height: 680 });
    await dialog(page)
      .getByRole("heading", { name: "Material de assentamento", exact: true })
      .scrollIntoViewIfNeeded();
    expect(
      await dialog(page).evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await expect(inputs(page, "Percentual de Argamassa AC1 (%)")).toBeVisible();
    await page.screenshot({ path: ".tools/t035-settlement-900.png" });
    // A default-equivalent value must not materialize configuration or history.
    const unchanged = await snapshot(page);
    await set(page, "Rendimento de Argamassa AC2 (kg/m²)", "1,4");
    expect(await snapshot(page)).toEqual(unchanged);
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      (await import(path)).useStore.setState({ readonly: true });
    });
    await expect(
      inputs(page, "Percentual de Argamassa AC1 (%)"),
    ).toBeDisabled();
    await expect(
      inputs(page, "Rendimento de Cola especial (ml/m²)"),
    ).toBeDisabled();
    await expect(
      inputs(page, "Preço de Argamassa AC1 (R$/saco de 20 kg)"),
    ).toBeDisabled();
    expect(await snapshot(page)).toEqual(unchanged);
  },
);

test(
  "T-035 mistura de produtos, distribuição inválida e preços ausente e zero",
  { tag: "@interface" },
  async ({ page }) => {
    await fixture(page, true);
    await open(page);
    await set(page, "Percentual de Argamassa AC1 (%)", "50");
    await set(page, "Percentual de Cola branca (%)", "50");
    await set(page, "Preço de Cola branca (R$/litro)", "20");
    const global = dialog(page).getByRole("region", {
      name: "Quantitativos de assentamento",
      exact: true,
    });
    const ac1 = global.locator('[data-settlement-key="ac1"]');
    const glue = global.locator('[data-settlement-key="white-glue"]');
    await expect(ac1).toHaveText("Argamassa AC15070 kg4R$ 120,00");
    await expect(glue).toHaveText("Cola branca504 litros4R$ 80,00");
    await expect(totals(page).last()).toHaveText("R$ 200,00");
    const before = await snapshot(page);
    await inputs(page, "Percentual de Argamassa AC1 (%)").fill("100,01");
    await inputs(page, "Percentual de Argamassa AC1 (%)").press("Enter");
    await expect(
      inputs(page, "Percentual de Argamassa AC1 (%)"),
    ).toHaveAttribute("aria-invalid", "true");
    await expect(dialog(page)).toContainText("Distribuição inválida");
    await expect(ac1).not.toContainText("70 kg");
    await expect(totals(page).last()).toHaveText("Indisponível");
    expect(await snapshot(page)).toEqual(before);
    await set(page, "Percentual de Argamassa AC1 (%)", "50");
    await set(page, "Preço de Cola branca (R$/litro)", "");
    await expect(glue).toContainText("4 litros4—Informe o preço");
    await expect(ac1).toContainText("R$ 120,00");
    await expect(totals(page).last()).toHaveText("Indisponível");
    await set(page, "Preço de Cola branca (R$/litro)", "0");
    await expect(totals(page).last()).toHaveText("R$ 120,00");
    await set(page, "Preço de Cola branca (R$/litro)", "20");
    await expect(totals(page).last()).toHaveText("R$ 200,00");
    const after = await snapshot(page);
    expect(after.doc.generated).toEqual(before.doc.generated);
    expect(after.doc.generationState).toEqual(before.doc.generationState);
    expect(after.doc.project.unitPrices).toEqual(before.doc.project.unitPrices);
  },
);

test(
  "T-035 histórico, reabertura, arquivo e falha preservam parâmetros e recuperação",
  { tag: "@fluxo" },
  async ({ page }) => {
    await fixture(page, true);
    await open(page);
    await set(page, "Rendimento de Argamassa AC1 (kg/m²)", "1,5");
    await close(page);
    await page.getByRole("button", { name: "Desfazer", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    expect(
      (await snapshot(page)).doc.project.settlement.ac1.yield,
    ).toBeUndefined();
    await page.getByRole("button", { name: "Refazer", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    const name = (await snapshot(page)).doc.project.name;
    await page.reload();
    await page.getByText(name, { exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await open(page);
    await expect(
      inputs(page, "Rendimento de Argamassa AC1 (kg/m²)"),
    ).toHaveValue("1,5");
    await rejectSaves(page);
    await inputs(page, "Preço de Argamassa AC1 (R$/saco de 20 kg)").fill("35");
    await inputs(page, "Preço de Argamassa AC1 (R$/saco de 20 kg)").press(
      "Enter",
    );
    await expect(dialog(page).getByRole("status")).toContainText("Não salvo");
    await expect(
      inputs(page, "Percentual de Argamassa AC1 (%)"),
    ).toBeDisabled();
    await expect(totals(page)).toHaveText([
      "R$ 0,00",
      "R$ 0,00",
      "R$ 280,00",
      "R$ 0,00",
      "R$ 0,00",
      "R$ 0,00",
      "R$ 280,00",
    ]);
    await close(page);
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    const file = await download,
      loaded = parseFile(await readFile((await file.path())!, "utf8"));
    expect(loaded.schemaVersion).toBe(36);
    expect(loaded.project.settlement?.ac1).toEqual({
      percent: 10000,
      yield: 1500,
      price: 3500,
    });
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      const { useStore } = await import(path);
      await useStore.getState().discard();
    });
    expect((await snapshot(page)).doc.project.settlement.ac1.price).toBe(3000);
  },
);
