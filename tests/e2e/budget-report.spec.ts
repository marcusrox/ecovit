import { test, expect, type Page } from "./auth";
import {
  createProject,
  makeWall,
  defaultGroutSettings,
} from "../../src/domain/project";
import { addFloor } from "../../src/domain/floors";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

async function fixture(page: Page) {
  let doc = createProject(
    "Relatório de orçamento - projeto com quatro pavimentos e nomes extensos",
    { length: 2000, width: 1000, height: 1000 },
    10000,
  );
  doc.project.channelLevels = [];
  doc.project.groutSettings = defaultGroutSettings(false);
  doc.project.unitPrices = {
    whole: 100,
    half: 50,
    channel: 200,
    "half-channel": 100,
  };
  doc.project.settlement = { ac1: { percent: 10000, price: 3000 } };
  for (let i = 1; i < 4; i++)
    doc = addFloor(doc, {
      name: `Pavimento ${i} - nome extenso para conferir quebra de linhas e identificação completa no relatório`,
      level: i * 10000,
      defaultHeight: 10000,
    });
  doc.model.walls = doc.model.floors
    .slice(0, 3)
    .map((f) =>
      makeWall({ x: 0, y: 0 }, { x: 40000, y: 0 }, 1000, f.id, 10000, 1)!,
    );
  doc.model.openings = doc.model.walls.map((w, i) => ({
    id: crypto.randomUUID(),
    wallId: w.id,
    kind: "door",
    offset: 4000,
    width: 8000 + i * 2000,
    base: 0,
    height: 7000,
    appearance: { type: "swing", orientation: 0 },
    material: {
      kind: "other",
      description:
        "Madeira com acabamento especial e descrição extensa de referência comercial",
    },
  }));
  await page.getByTestId("import-file").setInputFiles({
    name: "report.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(doc)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo", {
    timeout: 60000,
  });
  await page.getByRole("button", { name: "Orçamento", exact: true }).click();
  return page.getByRole("dialog", { name: "Orçamento", exact: true });
}
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const s = (await import(path)).useStore.getState();
    return JSON.stringify({
      doc: s.doc,
      history: s.history,
      select: s.select,
      activeFloorId: s.activeFloorId,
      mode: s.mode,
      saved: s.saved,
    });
  });
}
test(
  "T-038 baixa PDF A4 completo apesar do filtro e preserva projeto e somente leitura",
  { tag: "@fluxo" },
  async ({ page }) => {
    const dialog = await fixture(page);
    await page.setViewportSize({ width: 900, height: 680 });
    await dialog
      .getByLabel("Pavimento da consulta")
      .selectOption({ label: "Térreo · 0 cm" });
    const before = await snapshot(page);
    await dialog
      .getByRole("button", { name: "Baixar orçamento em PDF" })
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: ".tools/t038/budget-screen.png" });
    const download = page.waitForEvent("download");
    await dialog
      .getByRole("button", { name: "Baixar orçamento em PDF" })
      .click();
    const file = await download;
    const bytes = await readFile((await file.path())!);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(4);
    for (const p of pdf.getPages()) {
      expect(p.getWidth()).toBeCloseTo((210 * 72) / 25.4, 3);
      expect(p.getHeight()).toBeCloseTo((297 * 72) / 25.4, 3);
    }
    await file.saveAs(".tools/t038/budget.pdf");
    expect(await snapshot(page)).toBe(before);
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      (await import(path)).useStore.setState({ readonly: true });
    });
    const readonlyBefore = await snapshot(page);
    const second = page.waitForEvent("download");
    await dialog
      .getByRole("button", { name: "Baixar orçamento em PDF" })
      .click();
    expect((await second).suggestedFilename()).toMatch(/-orcamento\.pdf$/);
    expect(await snapshot(page)).toBe(readonlyBefore);
    await dialog.getByRole("button", { name: "Voltar ao desenho" }).click();
    await expect(
      page.getByRole("button", { name: "Orçamento", exact: true }),
    ).toBeFocused();
  },
);

test(
  "T-038 captura a revisão antes da geração e cancela ao fechar",
  { tag: "@fluxo" },
  async ({ page }) => {
    const dialog = await fixture(page);
    const original = await page
      .getByRole("textbox", { name: "Nome do projeto", exact: true })
      .inputValue();
    const delayFonts = async () => {
      await page.evaluate(() => {
        const original = document.fonts.load.bind(document.fonts);
        const gate = window as unknown as {
          releaseFonts: () => void;
          fontCalls: number;
        };
        gate.fontCalls = 0;
        const ready = new Promise<void>((resolve) => {
          gate.releaseFonts = resolve;
        });
        document.fonts.load = async (...args) => {
          gate.fontCalls++;
          await ready;
          return original(...args);
        };
      });
    };
    await delayFonts();
    await dialog
      .getByRole("button", { name: "Baixar orçamento em PDF" })
      .click();
    await page.waitForFunction(
      () => (window as unknown as { fontCalls: number }).fontCalls === 2,
    );
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      const { useStore } = await import(path);
      const doc = useStore.getState().doc;
      useStore.setState({
        doc: {
          ...doc,
          project: { ...doc.project, name: "Alterado após captura" },
        },
      });
    });
    const event = page.waitForEvent("download");
    await page.evaluate(() =>
      (window as unknown as { releaseFonts: () => void }).releaseFonts(),
    );
    const file = await event;
    const pdf = await PDFDocument.load(await readFile((await file.path())!));
    expect(pdf.getTitle()).toBe(`Orçamento - ${original}`);
    await delayFonts();
    await dialog
      .getByRole("button", { name: "Baixar orçamento em PDF" })
      .click();
    await page.waitForFunction(
      () => (window as unknown as { fontCalls: number }).fontCalls === 2,
    );
    const downloads: string[] = [];
    page.on("download", (d) => downloads.push(d.suggestedFilename()));
    await dialog.getByRole("button", { name: "Voltar ao desenho" }).click();
    await page.evaluate(() =>
      (window as unknown as { releaseFonts: () => void }).releaseFonts(),
    );
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(
      dialog.getByRole("button", { name: "Baixar orçamento em PDF" }),
    ).toBeEnabled();
    expect(downloads).toEqual([]);
  },
);
test(
  "T-038 informa falha, permite nova tentativa e bloqueia processamento e campos inválidos",
  { tag: "@fluxo" },
  async ({ page }) => {
    const dialog = await fixture(page);
    const button = dialog.getByRole("button", {
      name: "Baixar orçamento em PDF",
    });
    const input = dialog.getByRole("textbox", {
      name: "Perdas de tijolos (%)",
      exact: true,
    });
    await input.fill("inválido");
    await button.click();
    await expect(
      dialog.getByRole("alert").filter({ hasText: "Conclua ou corrija" }),
    ).toBeVisible();
    await input.fill("0");
    await input.press("Enter");
    await page.evaluate(() => {
      const original = document.fonts.load.bind(document.fonts);
      (window as unknown as { restoreFonts: () => void }).restoreFonts = () => {
        document.fonts.load = original;
      };
      document.fonts.load = async () => [];
    });
    const before = await snapshot(page);
    await button.click();
    await expect(dialog.getByRole("alert")).toContainText(
      "Não foi possível carregar as fontes",
    );
    expect(await snapshot(page)).toBe(before);
    await page.evaluate(() => {
      (window as unknown as { restoreFonts: () => void }).restoreFonts();
    });
    const download = page.waitForEvent("download");
    await button.click();
    await download;
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      (await import(path)).useStore.setState({ busy: true });
    });
    await expect(button).toBeDisabled();
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      (await import(path)).useStore.setState({ busy: false });
    });
  },
);
