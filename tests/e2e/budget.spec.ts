import { test, expect, rejectSaves, type Page } from "./auth";
import { readFile } from "node:fs/promises";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
  type Project,
} from "../../src/domain/project";
import { parseFile } from "../../src/persistence/files";

async function state(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const s = (await import(path)).useStore.getState();
    return {
      doc: s.doc as Project,
      history: s.history,
      active: s.activeFloorId,
      mode: s.mode,
      select: s.select,
    };
  });
}
async function open(page: Page) {
  const doc = createProject(
    "Orçamento de tijolos",
    { length: 2500, width: 1250, height: 700 },
    2100,
  );
  doc.project.channelLevels = [];
  doc.project.groutSettings = defaultGroutSettings(false);
  doc.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      { x: 10000, y: 0 },
      1250,
      doc.model.floors[0].id,
      2100,
      1,
    )!,
  ];
  await page
    .getByTestId("import-file")
    .setInputFiles({
      name: "orcamento.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(doc)),
    });
  await expect(page.getByRole("status")).toContainText("Salvo");
  await page.getByRole("button", { name: "Orçamento", exact: true }).click();
}

test(
  "T-024 preços persistidos, perdas, campos inválidos, popup e histórico",
  { tag: "@interface" },
  async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await open(page);
    const dialog = page.getByRole("dialog", { name: "Orçamento", exact: true });
    const summary = dialog.getByRole("region", {
      name: "Resumo do projeto",
      exact: true,
    });
    const row = (name: string) =>
      summary
        .getByRole("row")
        .filter({ has: page.getByRole("rowheader", { name, exact: true }) });
    const total = row("Total de peças").locator("td").last();
    const whole = dialog.getByLabel("Preço unitário de Inteiro", {
      exact: true,
    });
    const half = dialog.getByLabel("Preço unitário de Meio", { exact: true });
    const before = await state(page);
    await expect(total).toHaveText("Incompleto");
    await whole.fill("2,50");
    await whole.press("Enter");
    await expect(dialog.getByRole("status")).toContainText("Salvo");
    await half.fill("1.20");
    await half.press("Tab");
    await expect(dialog.getByRole("status")).toContainText("Salvo");
    await expect(total).toHaveText("R$ 29,90");
    const priced = await state(page);
    expect(priced.doc.project.unitPrices).toEqual({ whole: 250, half: 120 });
    expect(priced.doc.generated).toEqual(before.doc.generated);
    expect(priced.doc.generationState).toEqual(before.doc.generationState);
    expect(priced.doc.model).toEqual(before.doc.model);
    expect(priced.history.past.length).toBe(before.history.past.length + 2);
    await dialog.getByLabel("Perdas de tijolos (%)").fill("10");
    await expect(total).toHaveText("R$ 36,10");
    await whole.fill("-1");
    await whole.press("Tab");
    await expect(whole).toHaveAttribute("aria-invalid", "true");
    await expect(row("Inteiro").locator("td").last()).toHaveText("—");
    await expect(total).toHaveText("Incompleto");
    expect((await state(page)).doc.project.unitPrices?.whole).toBe(250);
    await whole.fill("2,50");
    await whole.press("Enter");
    await expect(total).toHaveText("R$ 36,10");
    const rect = (await dialog.boundingBox())!;
    expect(rect.x).toBeGreaterThan(0);
    expect(rect.y).toBeGreaterThan(0);
    expect(rect.width).toBeLessThan(1280);
    expect(rect.height).toBeLessThan(720);
    expect(await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
      true,
    );
    await page.screenshot({ path: ".tools/t024-orcamento.png" });
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Orçamento", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Control+z");
    await expect
      .poll(async () => (await state(page)).doc.project.unitPrices?.half)
      .toBeUndefined();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.keyboard.press("Control+y");
    await expect
      .poll(async () => (await state(page)).doc.project.unitPrices?.half)
      .toBe(120);
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(dialog.getByLabel("Perdas de tijolos (%)")).toHaveValue("10");
    await expect(total).toHaveText("R$ 36,10");
    await page.keyboard.press("Escape");
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    const file = await download;
    const exported = parseFile(await readFile((await file.path())!, "utf8"));
    expect(exported.project.unitPrices).toEqual({ whole: 250, half: 120 });
    await page.reload();
    await page
      .getByRole("button", { name: /Orçamento de tijolos/ })
      .first()
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(dialog.getByLabel("Perdas de tijolos (%)")).toHaveValue("0");
    await expect(whole).toHaveValue("2,50");
    await expect(half).toHaveValue("1,20");
    await expect(total).toHaveText("R$ 29,90");
    await whole.fill("");
    await whole.press("Tab");
    await expect(dialog.getByRole("status")).toContainText("Salvo");
    await expect(total).toHaveText("Incompleto");
    expect((await state(page)).doc.project.unitPrices).toEqual({ half: 120 });
  },
);

test(
  "T-024 falha de salvamento mantém preço em memória, bloqueia edição e permite recuperar",
  { tag: "@fluxo" },
  async ({ page }) => {
    await open(page);
    const dialog = page.getByRole("dialog", { name: "Orçamento", exact: true });
    const whole = dialog.getByLabel("Preço unitário de Inteiro", {
      exact: true,
    });
    const before = (await state(page)).doc.generated;
    await rejectSaves(page);
    await whole.fill("3,00");
    await whole.press("Enter");
    await expect(dialog.getByRole("status")).toContainText("Não salvo");
    await expect(whole).toBeDisabled();
    await expect(whole).toHaveValue("3,00");
    expect((await state(page)).doc.project.unitPrices?.whole).toBe(300);
    expect((await state(page)).doc.generated).toEqual(before);
    await page.keyboard.press("Escape");
    await page.evaluate(() => {
      (window as unknown as { restorePut: () => void }).restorePut();
    });
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(whole).toBeEnabled();
    await expect(whole).toHaveValue("3,00");
  },
);
