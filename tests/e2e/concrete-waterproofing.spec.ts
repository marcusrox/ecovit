import { test, expect } from "./auth";
import {
  createProject,
  makeWall,
  defaultGroutSettings,
} from "../../src/domain/project";
import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";

test(
  "T-042 edita percentuais locais, conserva composição, persiste e exporta produtos independentes",
  { tag: "@fluxo" },
  async ({ page }) => {
    const doc = createProject(
      "Impermeabilização T-042",
      { length: 2000, width: 1000, height: 1000 },
      1000,
    );
    doc.project.channelLevels = [];
    doc.project.groutSettings = defaultGroutSettings(false);
    doc.model.floors.push({
      ...doc.model.floors[0],
      id: crypto.randomUUID(),
      name: "Superior",
      level: 30000,
    });
    doc.model.walls = doc.model.floors.map((f) =>
      makeWall({ x: 0, y: 0 }, { x: 100000, y: 0 }, 1000, f.id, 1000, 1)!,
    );
    const ring = (x: number, y: number, w: number, h: number) => [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ];
    doc.model.slabs = [
      {
        id: crypto.randomUUID(),
        floorId: doc.model.floors[0].id,
        thickness: 1000,
        contour: ring(0, 0, 100000, 100000),
        openings: [
          {
            id: crypto.randomUUID(),
            contour: ring(10000, 10000, 40000, 50000),
          },
        ],
      },
    ];
    // Keep unrelated groups complete; reference lookups remain the real server flow.
    doc.project.unitPrices = {
      whole: 0,
      half: 0,
      channel: 0,
      "half-channel": 0,
    };
    doc.project.steelPrices = {
      "ca60-5": 0,
      "ca50-6.3": 0,
      "ca50-8": 0,
      "ca50-10": 0,
      "ca50-12.5": 0,
    };
    doc.project.settlement = { ac1: { percent: 10000, price: 0 } };
    await page.goto("/");
    await page.getByTestId("import-file").setInputFiles({
      name: "concrete.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(doc)),
    });
    await expect(page.getByRole("status")).toContainText("Salvo", {
      timeout: 60000,
    });
    const snapshot = () =>
      page.evaluate(async () => {
        const path = "/src/state/store.ts";
        const s = (await import(path)).useStore.getState();
        return {
          doc: s.doc!,
          history: s.history,
          activeFloorId: s.activeFloorId,
        };
      });
    const before = await snapshot();
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Orçamento", exact: true });
    await expect(
      dialog.getByText("Consultando e incorporando preços de referência…", {
        exact: true,
      }),
    ).toBeHidden();
    const section = dialog.getByRole("region", {
      name: "Impermeabilização de base de paredes e lajes",
      exact: true,
    });
    const change = async (name: string | RegExp, value: string) => {
      const input = section.getByRole("textbox", {
        name,
        exact: typeof name === "string",
      });
      await input.fill(value);
      await input.press("Enter");
      await expect(input).toBeEnabled();
    };
    await change(
      "Produto e embalagem de referência de Base das paredes",
      "Base A · lata de 1 L",
    );
    await change("Rendimento de Base das paredes (m²/embalagem)", "1");
    await change("Preço de Base das paredes (R$/embalagem)", "100");
    await change(
      "Produto e embalagem de referência de Superfície das lajes",
      "Laje B · balde de 18 L",
    );
    await change("Rendimento de Superfície das lajes (m²/embalagem)", "30");
    await change("Preço de Superfície das lajes (R$/embalagem)", "150");
    await change(/Paredes com base impermeabilizada.*Térreo/, "50");
    await change(/Área da laje impermeabilizada/, "50");
    const purchase = section.getByRole("region", {
      name: "Compra de Impermeabilização de base de paredes e lajes",
      exact: true,
    });
    await expect(
      purchase.getByRole("row", { name: /Base das paredes/ }),
    ).toContainText("0,75 m²");
    await expect(
      purchase.getByRole("row", { name: /Base das paredes/ }),
    ).toContainText("100,00");
    await expect(
      purchase.getByRole("row", { name: /Superfície das lajes/ }),
    ).toContainText("40 m²");
    await expect(
      purchase.getByRole("row", { name: /Superfície das lajes/ }),
    ).toContainText("300,00");
    await expect(
      section.getByText(
        /Subtotal de impermeabilização de base de paredes e lajes:/,
      ),
    ).toContainText("400,00");
    const after = await snapshot();
    expect(after.doc.generated).toEqual(before.doc.generated);
    expect(after.doc.generationState).toEqual(before.doc.generationState);
    expect(after.doc.model.floors[1].waterproofingPercent).toBeUndefined();
    expect(after.doc.project.surface?.waterproofing).toEqual(
      before.doc.project.surface?.waterproofing,
    );
    const percent = section.getByRole("textbox", {
      name: /Paredes com base impermeabilizada.*Térreo/,
    });
    await percent.fill("101");
    await expect(percent).toHaveAttribute("aria-invalid", "true");
    const issue = dialog
      .getByRole("region", { name: "Pendências do orçamento" })
      .getByRole("button", { name: /Localizar: Base das paredes/ });
    await issue.click();
    await expect(percent).toBeFocused();
    expect((await snapshot()).doc.model.floors[0].waterproofingPercent).toBe(
      5000,
    );
    await percent.fill("50");
    await percent.press("Enter");
    await dialog
      .getByRole("button", { name: "Voltar ao desenho", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.reload();
    await page
      .getByText("Impermeabilização T-042 (cópia)", { exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(
      section.getByRole("textbox", {
        name: /Paredes com base impermeabilizada.*Térreo/,
      }),
    ).toHaveValue("50");
    await expect(
      section.getByRole("textbox", {
        name: "Produto e embalagem de referência de Superfície das lajes",
        exact: true,
      }),
    ).toHaveValue("Laje B · balde de 18 L");
    const blocks = await page.evaluate(async () => {
      const storePath = "/src/state/store.ts",
        modelPath = "/src/app/budget-report/model.ts";
      const doc = (await import(storePath)).useStore.getState().doc!;
      return JSON.stringify(
        (await import(modelPath)).prepareBudgetReport(doc, new Date()).blocks,
      );
    });
    expect(blocks).toContain("Base A · lata de 1 L");
    expect(blocks).toContain("Laje B · balde de 18 L");
    expect(blocks).toContain("0,75 m²");
    expect(blocks).toContain("40 m²");
    const download = page.waitForEvent("download");
    await dialog
      .getByRole("button", { name: "Baixar orçamento em PDF", exact: true })
      .click();
    const file = await download;
    expect(
      (
        await PDFDocument.load(await readFile((await file.path())!))
      ).getPageCount(),
    ).toBeGreaterThan(0);
    await file.saveAs(".tools/logs/t042-budget.pdf");
    await section.scrollIntoViewIfNeeded();
    await page.screenshot({ path: ".tools/logs/t042-budget.png" });
  },
);
