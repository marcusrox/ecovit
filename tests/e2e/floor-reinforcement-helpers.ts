import { expect, type Page } from "./auth";

export async function openFerragens(page: Page) {
  await page
    .getByRole("button", { name: "Ferragens do pavimento", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Ferragens do pavimento", exact: true }),
  ).toBeVisible();
}

export async function closeFerragens(page: Page) {
  const dialog = page.getByRole("dialog", {
    name: "Ferragens do pavimento",
    exact: true,
  });
  await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
}
