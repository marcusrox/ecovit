import { test, expect, type Page } from "./auth";
import { database } from "../../server/db";
import { validateTestDatabaseUrl } from "../../scripts/load-test-env";
import { readFile } from "node:fs/promises";
import {
  createProject,
  makeWall,
  defaultGroutSettings,
} from "../../src/domain/project";
import { groutLabels } from "../../src/domain/grout-budget";

async function seed(page: Page, admin = false) {
  const url = new URL(
    validateTestDatabaseUrl(process.env.M12_TEST_DATABASE_URL),
  );
  url.searchParams.set("options", "-c search_path=m12_browser");
  const db = database(url.toString());
  try {
    await db.query(
      await readFile(
        "server/migrations/006-grout-budget-references.sql",
        "utf8",
      ),
    );
    if (admin) {
      const email = await page.evaluate(async () => {
        const path = "/src/persistence/http.ts";
        return (await import(path)).currentSession().account.email;
      });
      await db.query(
        "UPDATE ecovit_accounts SET is_admin=true WHERE email=$1",
        [email],
      );
    } else
      await db.query(
        'INSERT INTO ecovit_price_references(key,item,price) VALUES(\'grout:price\',\'{"group":"grout","key":"price"}\',100000)',
      );
  } finally {
    await db.end();
  }
}
test(
  "T-043 incorpora referências, edita perdas, preserva composição e exporta o microconcreto",
  { tag: "@fluxo" },
  async ({ page }) => {
    await seed(page);
    const doc = createProject(
      "Graute T-043",
      { length: 2500, width: 1250, height: 700 },
      700,
    );
    doc.project.channelLevels = [{ id: crypto.randomUUID(), top: 700 }];
    doc.project.groutSettings = defaultGroutSettings(false);
    doc.model.walls = [
      makeWall(
        { x: 0, y: 0 },
        { x: 50000, y: 0 },
        1250,
        doc.model.floors[0].id,
        700,
        1,
      )!,
    ];
    await page.getByTestId("import-file").setInputFiles({
      name: "grout.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(doc)),
    });
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Orçamento", exact: true });
    const group = dialog.getByRole("region", {
      name: "Graute de preenchimento",
      exact: true,
    });
    await expect(
      group.getByLabel(groutLabels.verticalConsumption, { exact: true }),
    ).toHaveValue("4,22");
    await expect(
      group.getByLabel(groutLabels.horizontalConsumption, { exact: true }),
    ).toHaveValue("2,56");
    await expect(
      group.getByLabel(groutLabels.horizontalLoss, { exact: true }),
    ).toBeEnabled();
    await expect(group).toContainText("14,08 L · 0,01408 m³");
    const generation = await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      return JSON.stringify(
        (await import(path)).useStore.getState().doc.generated,
      );
    });
    await group
      .getByLabel(groutLabels.horizontalLoss, { exact: true })
      .fill("0");
    await group
      .getByLabel(groutLabels.horizontalLoss, { exact: true })
      .press("Enter");
    await expect(group).toContainText("12,80 L · 0,0128 m³");
    await expect(
      dialog.getByRole("status").filter({ hasText: "Salvo" }),
    ).toBeVisible();
    expect(
      await page.evaluate(async () => {
        const path = "/src/state/store.ts";
        return JSON.stringify(
          (await import(path)).useStore.getState().doc.generated,
        );
      }),
    ).toBe(generation);
    const download = page.waitForEvent("download");
    await dialog
      .getByRole("button", { name: "Baixar orçamento em PDF" })
      .click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.pdf$/);
    const bytes = await readFile((await file.path())!);
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    await page.setViewportSize({ width: 900, height: 680 });
    await group.scrollIntoViewIfNeeded();
    const parameters = group.getByRole("region", {
      name: "Parâmetros do microconcreto",
      exact: true,
    });
    await expect(parameters.getByRole("columnheader")).toHaveCount(2);
    await expect(parameters.locator("tbody > tr")).toHaveCount(3);
    const input = await parameters
      .getByLabel(groutLabels.verticalConsumption, { exact: true })
      .boundingBox();
    const reference = await parameters
      .getByRole("button", {
        name: `Usar referência de ${groutLabels.verticalConsumption}`,
        exact: true,
      })
      .boundingBox();
    expect(input).not.toBeNull();
    expect(reference).not.toBeNull();
    expect(
      Math.abs(
        input!.y + input!.height / 2 - reference!.y - reference!.height / 2,
      ),
    ).toBeLessThan(2);
    expect(reference!.x).toBeGreaterThanOrEqual(input!.x + input!.width);
    await page.screenshot({ path: ".tools/logs/t043-budget.png" });
  },
);
test(
  "T-043 Administração apresenta padrões em L/m e salva perdas sem alterar consumo",
  { tag: "@fluxo" },
  async ({ page }) => {
    await seed(page, true);
    await page.reload();
    await page
      .getByRole("button", { name: "Administração", exact: true })
      .click();
    const panel = page.getByRole("dialog", {
      name: "Administração",
      exact: true,
    });
    await panel.getByRole("button", { name: "Preços", exact: true }).click();
    const field = (key: keyof typeof groutLabels) =>
      panel.getByRole("textbox", {
        name: `Referência de ${groutLabels[key]}`,
        exact: true,
      });
    await expect(field("verticalConsumption")).toHaveValue("4,220");
    await expect(field("horizontalConsumption")).toHaveValue("2,560");
    await expect(field("verticalLoss")).toHaveValue("5,00");
    await expect(field("horizontalLoss")).toHaveValue("10,00");
    await field("verticalLoss").fill("0");
    const saved = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/admin/prices") &&
        r.request().method() === "POST",
    );
    await field("verticalLoss").press("Enter");
    expect((await saved).status()).toBe(200);
    await panel
      .getByRole("button", { name: "Atualizar preços", exact: true })
      .click();
    await expect(field("verticalLoss")).toHaveValue("0,00");
    await expect(field("verticalConsumption")).toHaveValue("4,220");
    await field("horizontalConsumption").fill("0");
    await expect(field("horizontalConsumption")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await page.setViewportSize({ width: 900, height: 680 });
    await field("horizontalLoss").scrollIntoViewIfNeeded();
    await page.screenshot({ path: ".tools/logs/t043-admin.png" });
  },
);
