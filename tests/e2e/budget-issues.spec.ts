import { test, expect, type Page } from "./auth";
import {
  createProject,
  makeWall,
  defaultGroutSettings,
} from "../../src/domain/project";
import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";

async function fixture(page: Page, pendingOpenings = false) {
  const doc = createProject(
    "Pendências T-041",
    { length: 2500, width: 1250, height: 700 },
    2100,
  );
  doc.project.channelLevels = [];
  doc.project.groutSettings = defaultGroutSettings(false);
  doc.model.floors.push({
    ...doc.model.floors[0],
    id: crypto.randomUUID(),
    name: "Superior vazio",
    level: 28000,
  });
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
  doc.project.unitPrices = { half: 0, channel: 0, "half-channel": 0 };
  doc.project.priceSources = [
    { item: { group: "bricks", key: "whole" }, source: "cleared" },
  ];
  doc.project.steelPrices = {
    "ca60-5": 0,
    "ca50-6.3": 0,
    "ca50-8": 0,
    "ca50-10": 0,
    "ca50-12.5": 0,
  };
  doc.project.settlement = { ac1: { percent: 10000, price: 0 } };
  doc.project.surface = { waterproofing: { percent: 5000, price: 0 } };
  if (pendingOpenings) {
    const wall = makeWall(
      { x: 20000, y: 20000 },
      { x: 30000, y: 20000 },
      1250,
      doc.model.floors[1].id,
      2100,
      1,
    )!;
    doc.model.walls.push(wall);
    doc.model.openings = [0, 5000].map((offset) => ({
      id: crypto.randomUUID(),
      wallId: wall.id,
      kind: "door",
      appearance: { type: "swing", orientation: 0 },
      offset,
      width: 2500,
      base: 0,
      height: 1400,
    }));
  }
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "issues.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(doc)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo", {
    timeout: 60000,
  });
  await page.getByRole("button", { name: "Orçamento", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Orçamento", exact: true });
  await expect(
    dialog.getByText("Consultando e incorporando preços de referência…", {
      exact: true,
    }),
  ).toBeHidden();
  return dialog;
}
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const state = (await import(path)).useStore.getState();
    return JSON.stringify({
      doc: state.doc,
      history: state.history,
      activeFloorId: state.activeFloorId,
      mode: state.mode,
      saved: state.saved,
    });
  });
}

test(
  "T-041 localiza a primeira esquadria pendente na planta sem alterar o documento",
  { tag: "@fluxo" },
  async ({ page }) => {
    const dialog = await fixture(page, true);
    const before = JSON.parse(await snapshot(page));
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      const state = (await import(path)).useStore.getState();
      state.inspect({ mode: "course" });
      state.setPropertiesCollapsed(true);
    });
    await dialog.getByRole("button", { name: /Localizar: Esquadrias/ }).click();
    await expect(dialog).toBeHidden();
    const destination = await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      const s = (await import(path)).useStore.getState();
      return {
        select: s.select,
        floor: s.activeFloorId,
        mode: s.mode,
        collapsed: s.propertiesCollapsed,
        focus: s.focus,
      };
    });
    expect(destination).toMatchObject({
      select: before.doc.model.openings[0].id,
      floor: before.doc.model.floors[1].id,
      mode: "plan",
      collapsed: false,
    });
    expect(destination.focus).toMatchObject({
      x: 21250,
      y: 20625,
      scale: 0.012,
    });
    await expect(page.getByText("100%", { exact: true })).toBeVisible();
    const after = JSON.parse(await snapshot(page));
    expect(after.doc).toEqual(before.doc);
    expect(after.history).toEqual(before.history);
    await expect(
      page.getByRole("complementary", { name: "Propriedades do vão" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(
      dialog.getByRole("button", { name: /Localizar: Esquadrias/ }),
    ).toBeVisible();
  },
);

test(
  "T-041 localiza campos por teclado e mouse, acompanha prévias e preserva confirmação por blur",
  { tag: "@fluxo" },
  async ({ page }) => {
    const dialog = await fixture(page);
    const issues = dialog.getByRole("region", {
      name: "Pendências do orçamento",
      exact: true,
    });
    await expect(issues.locator("li")).toHaveCount(2);
    const before = await snapshot(page);
    const locate = issues.getByRole("button", {
      name: /Localizar: Tijolos · Inteiro/,
    });
    await locate.scrollIntoViewIfNeeded();
    const initialBox = await locate.boundingBox();
    if (!initialBox) throw Error("Ação de pendência indisponível");
    await page.mouse.move(
      initialBox.x + initialBox.width / 2,
      initialBox.y + initialBox.height / 2,
    );
    await page.mouse.down();
    await expect(locate).toBeFocused();
    await page.mouse.move(initialBox.x + initialBox.width + 30, initialBox.y);
    await page.mouse.up();
    await expect(
      dialog.locator('[data-budget-target="bricks:whole"]'),
    ).not.toBeFocused();
    await locate.focus();
    await page.keyboard.press("Enter");
    const price = dialog.locator('[data-budget-target="bricks:whole"]');
    await expect(price).toBeFocused();
    expect(await snapshot(page)).toBe(before);
    await price.fill("inválido");
    await expect(issues).toContainText("Informe um preço não negativo");
    await expect(price).toBeFocused();
    await price.fill("0");
    await expect(issues.locator("li")).toHaveCount(1);
    await issues
      .getByRole("button", { name: /Localizar: Impermeabilizante/ })
      .click();
    const yieldField = dialog.locator(
      '[data-budget-target="surface:waterproofing:yield"]',
    );
    await expect(yieldField).toBeFocused();
    await expect(price).toHaveValue("0,00");
    await yieldField.fill("30");
    await expect(issues).toContainText(
      "Sem pendências nos materiais abrangidos",
    );
    await expect(yieldField).toBeFocused();
    await yieldField.press("Tab");
    await expect(
      dialog.getByText("Salvo · orçamento no projeto", { exact: true }),
    ).toBeVisible();
    await expect(
      dialog.locator('[data-budget-section="summary"]'),
    ).toContainText("Resumo do projeto");

    // Invalid drafts remain localizable; navigating away preserves their value
    // until the user corrects and confirms through the normal field events.
    await price.fill("");
    await price.press("Tab");
    await expect(
      issues.getByRole("button", { name: /Localizar: Tijolos · Inteiro/ }),
    ).toBeVisible();
    await issues
      .getByRole("button", { name: /Localizar: Tijolos · Inteiro/ })
      .click();
    await price.fill("-1");
    const changingIssue = issues.getByRole("button", {
      name: /Localizar: Tijolos · Inteiro/,
    });
    // Complete a real click while the invalid input is still active.
    await changingIssue.scrollIntoViewIfNeeded();
    const box = await changingIssue.boundingBox();
    if (!box) throw Error("Ação de pendência indisponível");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(price).toBeFocused();
    await price.fill("0");
    await price.press("Tab");
    await expect(issues).toContainText(
      "Sem pendências nos materiais abrangidos",
    );
  },
);

test(
  "T-041 consulta global, somente leitura e PDF preservam motivos e documento",
  { tag: "@interface" },
  async ({ page }) => {
    const dialog = await fixture(page);
    await page.setViewportSize({ width: 900, height: 680 });
    const issues = dialog.getByRole("region", {
      name: "Pendências do orçamento",
      exact: true,
    });
    const messages = await issues.locator("li p").allTextContents();
    const before = await snapshot(page);
    await dialog
      .getByRole("button", { name: "Exibir detalhamento", exact: true })
      .click();
    await dialog
      .getByLabel("Pavimento da consulta")
      .selectOption({ label: "Superior vazio · 280 cm" });
    await dialog
      .getByRole("button", { name: "Ocultar detalhamento", exact: true })
      .click();
    expect(await issues.locator("li p").allTextContents()).toEqual(messages);
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      (await import(path)).useStore.setState({ readonly: true });
    });
    await issues
      .getByRole("button", { name: /Localizar: Tijolos · Inteiro/ })
      .click();
    await expect(
      dialog.getByRole("heading", { name: "Tijolos do Projeto", exact: true }),
    ).toBeFocused();
    await expect(
      dialog.locator('[data-budget-target="bricks:whole"]'),
    ).toBeDisabled();
    expect(await snapshot(page)).toBe(before);
    const printed = await page.evaluate(async () => {
      const storePath = "/src/state/store.ts";
      const reportPath = "/src/app/budget-report/model.ts";
      const doc = (await import(storePath)).useStore.getState().doc;
      return (await import(reportPath)).prepareBudgetReport(doc, new Date())
        .blocks;
    });
    const content = JSON.stringify(printed);
    for (const message of messages)
      expect(content).toContain(message.replace(/\s+/g, " ").trim());
    expect(content).not.toContain("Localizar");
    const download = page.waitForEvent("download");
    await dialog
      .getByRole("button", { name: "Baixar orçamento em PDF" })
      .click();
    const file = await download;
    const pdf = await PDFDocument.load(await readFile((await file.path())!));
    expect(pdf.getPageCount()).toBeGreaterThan(0);
    await file.saveAs(".tools/logs/t041-budget.pdf");
    expect(await snapshot(page)).toBe(before);
    await issues.scrollIntoViewIfNeeded();
    await page.screenshot({ path: ".tools/logs/t041-issues-900.png" });
    expect(
      await issues.evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
  },
);

test(
  "T-041 descarta localização pendente ao fechar e reabrir o orçamento",
  { tag: "@fluxo" },
  async ({ page }) => {
    const dialog = await fixture(page);
    const price = dialog.locator('[data-budget-target="bricks:whole"]');
    await price.fill("0");
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      const { useStore } = await import(path);
      const original = useStore.getState().commit;
      let release: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      (
        window as unknown as { releaseBudgetConfirmation: () => void }
      ).releaseBudgetConfirmation = () => release();
      useStore.setState({
        commit: async (...args: Parameters<typeof original>) => {
          await gate;
          useStore.setState({ commit: original });
          return original(...args);
        },
      });
    });
    await dialog
      .getByRole("button", { name: /Localizar: Impermeabilizante/ })
      .click();
    await dialog.getByRole("button", { name: "Voltar ao desenho" }).click();
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(
      dialog.getByRole("heading", {
        name: "Orçamento preliminar",
        exact: true,
      }),
    ).toBeFocused();
    await page.evaluate(() =>
      (
        window as unknown as { releaseBudgetConfirmation: () => void }
      ).releaseBudgetConfirmation(),
    );
    await expect(
      dialog.getByText("Salvo · orçamento no projeto", { exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("heading", {
        name: "Orçamento preliminar",
        exact: true,
      }),
    ).toBeFocused();
  },
);
