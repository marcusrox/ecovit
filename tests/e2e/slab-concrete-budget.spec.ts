import { test, expect } from "./auth";
import { database } from "../../server/db";
import { validateTestDatabaseUrl } from "../../scripts/load-test-env";
import { createProject } from "../../src/domain/project";
import { readFile } from "node:fs/promises";

test(
  "T-044 tabela compacta cabe na consulta e conserva campos legíveis em 900px",
  { tag: "@interface" },
  async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const doc = createProject("Concreto visual", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    doc.model.slabs.push({
      id: crypto.randomUUID(),
      floorId: doc.model.floors[0].id,
      thickness: 800,
      contour: [
        { x: 0, y: 0 },
        { x: 100000, y: 0 },
        { x: 100000, y: 100000 },
        { x: 0, y: 100000 },
      ],
      openings: [],
      concrete: {
        consumption: 60000,
        loss: 500,
        class: "30",
        price: 50000,
        source: "own",
      },
    });
    await page
      .getByTestId("import-file")
      .setInputFiles({
        name: "visual.ecovit",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(doc)),
      });
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    const group = page.getByRole("region", {
      name: "Concreto das lajes",
      exact: true,
    });
    const price = group.getByRole("textbox", { name: /Preço/ }),
      selected = group.getByRole("combobox");
    await expect(price).toBeEnabled();
    const table = group.getByRole("region", {
      name: "Concreto por laje",
      exact: true,
    });
    await group.scrollIntoViewIfNeeded();
    expect(
      await table.evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
    await page.screenshot({ path: ".tools/logs/t044-compact.png" });
    await page.setViewportSize({ width: 900, height: 680 });
    await table.evaluate((node) => {
      node.scrollLeft = 420;
    });
    await group.scrollIntoViewIfNeeded();
    const priceBox = await price.boundingBox(),
      selectedBox = await selected.boundingBox();
    expect(priceBox!.width).toBeGreaterThanOrEqual(80);
    expect(selectedBox!.x + selectedBox!.width).toBeLessThanOrEqual(
      priceBox!.x,
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(900);
    await page.screenshot({ path: ".tools/logs/t044-layout.png" });
  },
);

test(
  "T-044 edita laje, troca FCK atomicamente, conserva limpeza, pendências, reabertura e PDF",
  { tag: "@fluxo" },
  async ({ page }) => {
    const url = new URL(
      validateTestDatabaseUrl(process.env.M12_TEST_DATABASE_URL),
    );
    url.searchParams.set("options", "-c search_path=m12_browser");
    const db = database(url.toString());
    try {
      await db.query(
        `INSERT INTO ecovit_price_references(key,item,price) VALUES ('concrete:30','{"group":"concrete","key":"30"}',50000),('concrete:40','{"group":"concrete","key":"40"}',60000)`,
      );
    } finally {
      await db.end();
    }
    const doc = createProject("Concreto T-044", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    doc.model.slabs.push({
      id: crypto.randomUUID(),
      floorId: doc.model.floors[0].id,
      thickness: 800,
      contour: [
        { x: 0, y: 0 },
        { x: 100000, y: 0 },
        { x: 100000, y: 100000 },
        { x: 0, y: 100000 },
      ],
      openings: [],
    });
    await page.getByTestId("import-file").setInputFiles({
      name: "concrete.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(doc)),
    });
    await expect(page.getByRole("status")).toContainText("Salvo");
    const snapshot = () =>
      page.evaluate(async () => {
        const path = "/src/state/store.ts";
        return (await import(path)).useStore.getState().doc;
      });
    const generated = (await snapshot()).generated;
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Orçamento", exact: true });
    const group = dialog.getByRole("region", {
      name: "Concreto das lajes",
      exact: true,
    });
    const input = (name: string) =>
      group.getByRole("textbox", { name: new RegExp(name) });
    const consumption = input("Consumo de concreto"),
      loss = input("Perdas"),
      price = input("Preço");
    const selected = group.getByRole("combobox");
    await expect(consumption).toBeEnabled();
    await consumption.fill("60");
    await consumption.press("Enter");
    await expect(loss).toBeEnabled();
    await loss.fill("5");
    await loss.press("Enter");
    await expect(selected).toBeEnabled();
    await selected.selectOption("30");
    await expect(price).toHaveValue("500,00");
    await expect(group).toContainText("3.150,00");
    await expect(price).toBeEnabled();
    await price.fill("0");
    await price.press("Enter");
    await expect(selected).toBeEnabled();
    await selected.selectOption("40");
    await expect(price).toHaveValue("600,00");
    await page.route("**/api/prices/lookup", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          code: "test_unavailable",
          message: "Referências indisponíveis",
        }),
      }),
    );
    await expect(selected).toBeEnabled();
    await selected.selectOption("50");
    await expect(selected).toHaveValue("40");
    await expect(price).toHaveValue("600,00");
    await expect(dialog).toContainText("Referências indisponíveis");
    await page.unroute("**/api/prices/lookup");
    await expect(selected).toBeEnabled();
    await selected.selectOption("50");
    await expect(selected).toHaveValue("50");
    await expect(price).toHaveValue("");
    await expect(selected).toBeEnabled();
    await selected.selectOption("30");
    await expect(price).toHaveValue("500,00");
    await expect(price).toBeEnabled();
    await price.fill("");
    await price.press("Enter");
    await expect(consumption).toBeEnabled();
    await consumption.fill("0");
    const locate = dialog.getByRole("button", {
      name: /Localizar: Consumo de concreto/,
    });
    await locate.click();
    await expect(consumption).toBeFocused();
    await consumption.fill("60");
    await consumption.press("Enter");
    await dialog
      .getByRole("button", { name: "Voltar ao desenho", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    expect((await snapshot()).generated).toEqual(generated);
    await page.reload();
    await page.getByText("Concreto T-044 (cópia)", { exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(consumption).toBeEnabled();
    await expect(price).toHaveValue("");
    await group
      .getByRole("button", { name: /Usar preço de referência de Concreto/ })
      .click();
    await expect(price).toHaveValue("500,00");
    expect((await snapshot()).generated).toEqual(generated);
    // Inspect the actual shared report blocks, including selected FCK as static text.
    const report = await page.evaluate(async () => {
      const p = "/src/app/budget-report/model.ts",
        s = "/src/state/store.ts";
      return (await import(p)).prepareBudgetReport(
        (await import(s)).useStore.getState().doc,
        new Date(),
        false,
      );
    });
    const table = report.blocks.find(
      (b: { title?: string }) => b.title === "Concreto · lajes do projeto",
    );
    expect(JSON.stringify(table)).toContain("FCK 30 MPa");
    expect(JSON.stringify(table)).toContain("3.150,00");
    const download = page.waitForEvent("download");
    await dialog
      .getByRole("button", { name: "Baixar orçamento em PDF" })
      .click();
    const file = await download,
      bytes = await readFile((await file.path())!);
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    await page.setViewportSize({ width: 900, height: 680 });
    await group.scrollIntoViewIfNeeded();
    await page.screenshot({ path: ".tools/logs/t044-budget.png" });
  },
);
