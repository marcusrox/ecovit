import { test, expect } from "@playwright/test";
import { createProject } from "../../src/domain/project";

test("Configurações cabem na tela, ajuda por teclado e muitos níveis mantêm ações acessíveis", async ({
  page,
}, info) => {
  const doc = createProject("Configurações", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "config.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(doc)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  for (const size of [
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 900, height: 680 },
  ]) {
    await page.setViewportSize(size);
    await expect(
      dialog.getByRole("button", { name: "Aplicar configurações" }),
    ).toBeInViewport();
    const clipped = await dialog.evaluate(
      (el) =>
        [el, ...el.querySelectorAll("*")].filter((node) => {
          const style = getComputedStyle(node);
          return (
            ["auto", "scroll"].includes(style.overflowY) &&
            node.scrollHeight > node.clientHeight + 1
          );
        }).length,
    );
    expect(clipped).toBe(0);
    await page.screenshot({
      path: `.tools/settings-${info.project.name}-${size.width}.png`,
    });
  }
  const help = dialog.getByLabel("Ajuda sobre vãos", { exact: true });
  await help.focus();
  await page.keyboard.press("Enter");
  await expect(dialog.getByText(/Os padrões só inicializam/)).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(dialog.getByText(/Os padrões só inicializam/)).not.toBeVisible();
  for (let i = 0; i < 10; i++)
    await dialog
      .getByRole("button", { name: "Adicionar nível de canaleta" })
      .click();
  await expect(
    dialog.getByRole("button", { name: "Aplicar configurações" }),
  ).toBeInViewport();
  await dialog.getByLabel("Topo de canaleta 12", { exact: true }).fill("280");
  await expect(
    dialog.getByRole("button", { name: "Cancelar", exact: true }),
  ).toBeInViewport();
  await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await expect(
    dialog.getByLabel("Topo de canaleta 3", { exact: true }),
  ).toHaveCount(0);
  const offsets = await page
    .locator("button:has(> svg), summary:has(> svg)")
    .evaluateAll((controls) =>
      controls.map((el) => {
        const icon = el.querySelector("svg")!.getBoundingClientRect();
        const box = el.getBoundingClientRect();
        return {
          y: Math.abs(icon.y + icon.height / 2 - box.y - box.height / 2),
          x: el.textContent?.trim()
            ? 0
            : Math.abs(icon.x + icon.width / 2 - box.x - box.width / 2),
        };
      }),
    );
  for (const offset of offsets) {
    expect(offset.y).toBeLessThanOrEqual(1);
    expect(offset.x).toBeLessThanOrEqual(1);
  }
  const overflowing = await page
    .locator("button:has(> svg)")
    .evaluateAll((buttons) =>
      buttons
        .filter((button) => button.scrollWidth > button.clientWidth + 1)
        .map((button) => button.textContent),
    );
  expect(overflowing).toEqual([]);
  await dialog.getByRole("button", { name: "Fechar configurações" }).click();
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.screenshot({ path: `.tools/icons-${info.project.name}.png` });
});
