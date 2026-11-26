import { publicTest as test, expect, login } from "./auth";
import { randomUUID } from "node:crypto";
import { database } from "../../server/db";
import { validateTestDatabaseUrl } from "../../scripts/load-test-env";

test("administração mostra consultas compactas, metadados e confirmação sem abrir desenhos @interface", async ({
  page,
}) => {
  const email = await login(page);
  const url = new URL(
    validateTestDatabaseUrl(process.env.M12_TEST_DATABASE_URL),
  );
  url.searchParams.set("options", "-c search_path=m12_browser");
  const db = database(url.toString());
  const target = randomUUID(),
    targetEmail = `support-${target}@example.com`;
  try {
    await db.query("UPDATE ecovit_accounts SET is_admin=true WHERE email=$1", [
      email,
    ]);
    await db.query("INSERT INTO ecovit_accounts(id,email) VALUES($1,$2)", [
      target,
      targetEmail,
    ]);
    await page.reload();
    await page
      .getByRole("button", { name: "Administração", exact: true })
      .click();
    const panel = page.getByRole("dialog", {
      name: "Administração",
      exact: true,
    });
    await expect(
      panel.getByRole("heading", { name: "Contas existentes", exact: true }),
    ).toBeVisible();
    const metric = panel
      .getByRole("heading", { name: "Contas existentes", exact: true })
      .locator("..")
      .locator("..");
    expect((await metric.boundingBox())!.height).toBeLessThan(95);
    expect(
      await metric.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).not.toBe("rgb(255, 255, 255)");
    await expect(
      panel.getByText("Cobertura parcial do período selecionado."),
    ).toBeVisible();
    await page.screenshot({ path: ".tools/t031/admin-overview.png" });
    await page.screenshot({ path: ".tools/admin-compact/overview-wide.png" });
    await page.setViewportSize({ width: 900, height: 680 });
    await page.screenshot({ path: ".tools/admin-compact/overview-narrow.png" });
    await panel.getByRole("button", { name: "Usuários", exact: true }).click();
    await panel.getByLabel("Buscar e-mail").fill(targetEmail);
    await panel.getByRole("button", { name: "Consultar", exact: true }).click();
    await expect(
      panel.getByRole("heading", { name: targetEmail, exact: true }),
    ).toBeVisible();
    await panel
      .getByRole("button", { name: "Adicionar administrador", exact: true })
      .click();
    await panel
      .getByLabel("Motivo (sem segredos ou dados pessoais de terceiros)")
      .fill("Atendimento autorizado");
    await page.screenshot({ path: ".tools/t031/admin-confirmation.png" });
    await panel
      .getByRole("button", { name: "Confirmar ação", exact: true })
      .click();
    await expect(
      panel.getByRole("status").filter({ hasText: /^Concluída$/ }),
    ).toHaveText("Concluída");
    await panel.getByRole("button", { name: "Operação", exact: true }).click();
    await expect(panel.getByText(/Banco: acesso confirmado/)).toBeVisible();
    await panel.getByRole("button", { name: "Auditoria", exact: true }).click();
    await expect(
      panel.getByRole("cell", { name: "Atendimento autorizado", exact: true }),
    ).toBeVisible();
    await panel
      .getByRole("button", { name: "Fechar administração", exact: true })
      .click();
    await expect(panel).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Administração", exact: true }),
    ).toBeFocused();
  } finally {
    await db.end();
  }
});
