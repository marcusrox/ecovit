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
    await dialog.getByRole("button", { name: "Exibir detalhamento" }).click();
    await dialog
      .getByLabel("Pavimento da consulta")
      .selectOption({ label: "Térreo · 0 cm" });
    await dialog.getByRole("button", { name: "Ocultar detalhamento" }).click();
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

test(
  "T-038 compartilha conteúdo e ordem da tela com valores estáticos e tabelas completas",
  { tag: "@fluxo" },
  async ({ page }) => {
    const dialog = await fixture(page);
    await expect(
      dialog.getByRole("button", { name: "Baixar orçamento em PDF" }),
    ).toBeEnabled();
    await dialog.getByRole("button", { name: "Exibir detalhamento" }).click();
    await dialog.getByLabel("Pavimento da consulta").selectOption("all");
    const data = await page.evaluate(async () => {
      const storePath = "/src/state/store.ts",
        reportPath = "/src/app/budget-report/model.ts";
      const s = (await import(storePath)).useStore.getState();
      const before = JSON.stringify(s.doc);
      const report = (await import(reportPath)).prepareBudgetReport(
        s.doc,
        new Date(),
        true,
      );
      const screen = document
        .querySelector("[data-budget-content]")!
        .cloneNode(true) as HTMLElement;
      screen
        .querySelectorAll(
          "[data-print-omit], button, svg, [aria-hidden='true']",
        )
        .forEach((n) => n.remove());
      screen
        .querySelectorAll("input")
        .forEach((n) =>
          n.replaceWith(
            document.createTextNode(
              ` ${n.value || n.placeholder || "Não informado"} `,
            ),
          ),
        );
      const clean = (n: Node): string =>
        (n.nodeType === 3
          ? (n.textContent ?? "")
          : [...n.childNodes]
              .map((child) =>
                child.nodeType === 3 ? child.textContent : ` ${clean(child)} `,
              )
              .join("")
        )
          .replace(/\s+/g, " ")
          .trim();
      return {
        report,
        before,
        after: JSON.stringify(s.doc),
        headings: [...screen.querySelectorAll("h1,h2,h3,h4")].map(clean),
        tables: [...screen.querySelectorAll("table")].map((t) =>
          [...t.rows]
            .filter((r) => r.parentElement?.tagName !== "THEAD")
            .map((r) =>
              [...r.cells].flatMap((c) => [
                clean(c),
                ...Array(c.colSpan - 1).fill(""),
              ]),
            ),
        ),
      };
    });
    expect(data.after).toBe(data.before);
    expect(
      data.report.blocks
        .filter((b: { kind: string }) => b.kind === "heading")
        .map((b: { text: string }) => b.text),
    ).toEqual(data.headings);
    expect(
      data.report.blocks
        .filter(
          (b: { kind: string; summary?: boolean }) =>
            b.kind === "table" && !b.summary,
        )
        .map((b: { rows: string[][] }) => b.rows),
    ).toEqual(data.tables);
    const reportText = JSON.stringify(data.report);
    expect(reportText).toContain("Não salvo");
    expect(reportText).toContain("Fiadas locais");
    expect(reportText).toContain("CA-50 · Ø 12,5 mm");
    expect(reportText).toContain("Cola especial");
    expect(reportText).toContain("Pavimento 3");
    expect(reportText).toContain("Custos rateados da compra global");
    expect(reportText).not.toContain("pressione Enter");
    expect(reportText).not.toContain("Saia do campo");
    expect(reportText).not.toContain("Pavimento da consulta");
  },
);

test(
  "T-038 confirma o campo ao clicar e exporta durante salvamento remoto e após falha",
  { tag: "@fluxo" },
  async ({ page }) => {
    const dialog = await fixture(page);
    const button = dialog.getByRole("button", {
      name: "Baixar orçamento em PDF",
    });
    await expect(button).toBeEnabled();
    // Hold only the remote write; the normal local commit and history must finish.
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/api/projects/*", async (route) => {
      if (route.request().method() !== "PUT") return route.continue();
      await gate;
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          code: "test_rejection",
          message: "Gravação recusada no ensaio.",
        }),
      });
    });
    try {
      const field = dialog.getByRole("textbox", {
        name: "Perdas de tijolos (%)",
        exact: true,
      });
      await field.fill("7");
      const first = page.waitForEvent("download");
      await button.click();
      const download = await first;
      const state = await page.evaluate(async () => {
        const storePath = "/src/state/store.ts",
          reportPath = "/src/app/budget-report/model.ts";
        const s = (await import(storePath)).useStore.getState();
        return {
          percent: s.doc.project.brickLossPercent,
          saved: s.saved,
          report: (await import(reportPath)).prepareBudgetReport(
            s.doc,
            new Date(),
            s.saved !== "saved",
          ),
          history: s.history.past.length,
        };
      });
      expect(state.percent).toBe(700);
      expect(state.saved).toBe("saving");
      expect(state.history).toBeGreaterThan(0);
      expect(JSON.stringify(state.report)).toContain("Não salvo");
      expect(state.report.blocks).toContainEqual({
        kind: "text",
        text: "Perdas de tijolos (%) 7",
      });
      expect(
        (
          await PDFDocument.load(await readFile((await download.path())!))
        ).getPageCount(),
      ).toBeGreaterThan(4);
      release();
      await expect
        .poll(async () =>
          page.evaluate(async () => {
            const path = "/src/state/store.ts";
            return (await import(path)).useStore.getState().saved;
          }),
        )
        .not.toBe("saving");
      const before = await snapshot(page);
      const second = page.waitForEvent("download");
      await button.click();
      await second;
      expect(await snapshot(page)).toBe(before);
    } finally {
      release();
    }
  },
);

test(
  "T-038 aguarda confirmação local atrasada do aço e preserva outro rascunho inválido",
  { tag: "@fluxo" },
  async ({ page }) => {
    const dialog = await fixture(page);
    const button = dialog.getByRole("button", {
      name: "Baixar orçamento em PDF",
    });
    await expect(button).toBeEnabled();
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      const { useStore } = await import(path);
      const original = useStore.getState().commit;
      const gate = window as unknown as {
        releaseBudgetConfirmation: () => void;
      };
      const ready = new Promise<void>((resolve) => {
        gate.releaseBudgetConfirmation = resolve;
      });
      useStore.setState({
        commit: async (...args: Parameters<typeof original>) => {
          await ready;
          await original(...args);
        },
      });
    });
    const steel = dialog.getByRole("textbox", {
      name: "Preço por kg de CA-60 · Ø 5 mm",
      exact: true,
    });
    await steel.fill("12,34");
    const downloads: string[] = [];
    page.on("download", (file) => downloads.push(file.suggestedFilename()));
    const first = page.waitForEvent("download");
    await button.click();
    await expect(
      dialog.getByRole("button", { name: "Gerando relatório…" }),
    ).toBeDisabled();
    expect(downloads).toEqual([]);
    await page.evaluate(() =>
      (
        window as unknown as { releaseBudgetConfirmation: () => void }
      ).releaseBudgetConfirmation(),
    );
    await first;
    await expect(steel).toHaveValue("12,34");
    const value = await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      return (await import(path)).useStore.getState().doc.project.steelPrices;
    });
    expect(Object.values(value)).toContain(1234);
    await steel.fill("inválido");
    await dialog
      .getByRole("textbox", { name: "Perdas de tijolos (%)", exact: true })
      .fill("8");
    await button.click();
    await expect(
      dialog.getByRole("alert").filter({ hasText: "Conclua ou corrija" }),
    ).toBeVisible();
    await expect(steel).toHaveValue("inválido");
    expect(downloads).toHaveLength(1);
  },
);
