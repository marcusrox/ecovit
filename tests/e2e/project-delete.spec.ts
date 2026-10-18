import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { parseFile } from "../../src/persistence/files";

async function seed(page: Page, legacy = false) {
  await page.goto("/");
  await page.evaluate(async (legacy) => {
    const domainPath = "/src/domain/project.ts",
      databasePath = "/src/persistence/database.ts";
    const { createProject } = await import(domainPath);
    const { saveProject, db } = await import(databasePath);
    const d = createProject("Projeto para excluir", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    await saveProject(d);
    if (legacy)
      await db
        .table("projects")
        .update(d.project.id, { "doc.schemaVersion": 8 });
  }, legacy);
  await page.reload();
}

test("RF-12: cancelar, baixar backup íntegro, excluir e reabrir arquivo", async ({
  page,
}) => {
  await seed(page);
  const remove = page.getByRole("button", { name: "Excluir", exact: true });
  await remove.click();
  await expect(
    page.getByRole("button", { name: "Cancelar", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(remove).toBeFocused();
  await remove.click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(remove).toBeVisible();
  await remove.click();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar backup .ecovit" }).click();
  const file = await event;
  expect(file.suggestedFilename()).toBe("Projeto para excluir.ecovit");
  const text = await readFile((await file.path())!, "utf8");
  expect(parseFile(text).project.name).toBe("Projeto para excluir");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Excluir projeto", exact: true })
    .click();
  await expect(remove).toHaveCount(0);
  await page.reload();
  await expect(remove).toHaveCount(0);
  await page.getByTestId("import-file").setInputFiles({
    name: file.suggestedFilename(),
    mimeType: "application/json",
    buffer: Buffer.from(text),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
});

test("RF-12: backup legado preservado e exclusão sem backup", async ({
  page,
}) => {
  await seed(page, true);
  await expect(
    page.getByText("Formato incompatível ·", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Excluir", exact: true }).click();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar backup .ecovit" }).click();
  expect(
    JSON.parse(await readFile((await (await event).path())!, "utf8"))
      .schemaVersion,
  ).toBe(8);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.getByRole("button", { name: "Excluir", exact: true }).click();
  await page.getByRole("button", { name: "Excluir sem backup" }).click();
  await expect(page.getByText("0 projetos salvos")).toBeVisible();
});

test("RF-12: projeto em edição e falhas de backup/exclusão conservam registro", async ({
  page,
  context,
}) => {
  await seed(page);
  const other = await context.newPage();
  await other.goto("/");
  await other
    .getByRole("button", { name: /Projeto para excluir.*parede/ })
    .click();
  await expect(other.getByRole("status")).toContainText("Salvo");
  await page.getByRole("button", { name: "Excluir", exact: true }).click();
  await page.getByRole("button", { name: "Excluir sem backup" }).click();
  await expect(page.getByRole("alert")).toContainText("outra aba");
  await other.close();
  await expect
    .poll(() =>
      page.evaluate(
        async () => (await navigator.locks.query()).held?.length ?? 0,
      ),
    )
    .toBe(0);
  await page.evaluate(() => {
    URL.createObjectURL = () => {
      throw new Error("Falha no backup");
    };
    IDBObjectStore.prototype.delete = () => {
      throw new Error("Falha na exclusão");
    };
  });
  await page.getByRole("button", { name: "Baixar backup .ecovit" }).click();
  await expect(page.getByRole("alert")).toContainText("Falha no backup");
  await page.getByRole("button", { name: "Excluir sem backup" }).click();
  await expect(page.getByRole("alert")).toContainText("Falha na exclusão");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Excluir", exact: true }),
  ).toBeVisible();
});

test("RF-12: ações, ícones e confirmação nas resoluções de referência", async ({
  page,
}, info) => {
  await seed(page);
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    const remove = page.getByRole("button", { name: "Excluir", exact: true });
    const copy = page.getByRole("button", { name: "Duplicar", exact: true });
    const card = page.getByRole("button", {
      name: /Projeto para excluir.*parede/,
    });
    const row = card.locator("..");
    await page.getByRole("button", { name: "Carregar .ecovit" }).focus();
    await page.mouse.move(0, 0);
    await expect(copy.locator("..")).toHaveCSS("opacity", "0");
    await card.hover();
    await expect(copy.locator("..")).toHaveCSS("opacity", "1");
    expect((await row.boundingBox())!.height).toBe(80);
    expect((await remove.boundingBox())!.x).toBeGreaterThan(
      (await copy.boundingBox())!.x,
    );
    expect((await remove.boundingBox())!.y).toBe((await copy.boundingBox())!.y);
    expect((await remove.boundingBox())!.x + 32).toBeLessThan(
      (await row.boundingBox())!.x + (await row.boundingBox())!.width,
    );
    await card.focus();
    await page.mouse.move(0, 0);
    await page.keyboard.press("Tab");
    await expect(copy).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(remove).toBeFocused();
    await page.screenshot({
      path: `.tools/delete-home-${info.project.name}-${width}.png`,
    });
    await remove.click();
    const dialog = page.getByRole("dialog");
    for (const button of await dialog.getByRole("button").all())
      await expect(button).toBeInViewport();
    const offsets = await page
      .locator("button:has(> svg)")
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const box = button.getBoundingClientRect(),
            icon = button.querySelector("svg")!.getBoundingClientRect();
          return {
            center: Math.abs(icon.y + icon.height / 2 - box.y - box.height / 2),
            overflow: button.scrollWidth > button.clientWidth,
          };
        }),
      );
    for (const offset of offsets) {
      expect(offset.center).toBeLessThanOrEqual(1);
      expect(offset.overflow).toBe(false);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.tools/delete-dialog-${info.project.name}-${width}.png`,
    });
    await page.keyboard.press("Escape");
  }
});
