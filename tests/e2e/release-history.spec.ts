import { readReleaseInfo } from "../../scripts/release-info";
import { expect, rejectSaves, test, type Page } from "./auth";

const versionLink = (page: Page) =>
  page
    .locator("footer")
    .getByRole("link", { name: /Versão .*Histórico de tasks/ });
const historyHeading = (page: Page) =>
  page.getByRole("heading", { name: "Histórico de tasks" });
const viewports = [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 900, height: 680 },
];

test("mostra a revisão nos três rodapés e abre o histórico por teclado", async ({
  browser,
  baseURL,
  page,
}, info) => {
  const { version, tasks } = readReleaseInfo();
  const anonymous = await browser.newPage({ baseURL });
  await anonymous.goto("/");
  await expect(
    anonymous.getByRole("heading", { name: "Entrar no Ecovit" }),
  ).toBeVisible();
  await expect(versionLink(anonymous)).toHaveText(version);
  const versionText = await versionLink(anonymous).innerText();

  async function checkFooter(surface: Page, label: string) {
    for (const viewport of viewports) {
      await surface.setViewportSize(viewport);
      const link = versionLink(surface);
      await expect(link).toHaveText(versionText);
      if (label === "lista") await link.scrollIntoViewIfNeeded();
      await expect(link).toBeInViewport();
      expect(
        await surface.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await link.focus();
      await surface.keyboard.press("Shift+Tab");
      await surface.keyboard.press("Tab");
      await expect(link).toBeFocused();
      expect(
        await link.evaluate(
          (element) => getComputedStyle(element).outlineStyle,
        ),
      ).toBe("solid");
      await surface.screenshot({
        path: `.tools/t004/${label}-${info.project.name}-${viewport.width}.png`,
      });
      await link.press("Enter");
      await expect(historyHeading(surface)).toBeVisible();
      const history = surface.getByRole("dialog");
      await expect(history).toContainText(versionText);
      if (tasks.length) {
        await expect(history.getByRole("listitem")).toHaveText(
          tasks.map(
            ({ id, title, date }) =>
              `${id}${title}${date.split("-").reverse().join("/")}`,
          ),
        );
      } else {
        await expect(history).toContainText(
          "Nenhuma task implementada nesta versão",
        );
      }
      await surface
        .getByRole("button", { name: "Voltar", exact: true })
        .click();
      await expect(historyHeading(surface)).toHaveCount(0);
      await expect(link).toBeFocused();
    }
  }

  await checkFooter(anonymous, "login");
  await anonymous.goto("/#historico-de-tasks");
  await anonymous.reload();
  await expect(historyHeading(anonymous)).toBeVisible();
  await expect(
    anonymous.getByRole("heading", { name: "Entrar no Ecovit" }),
  ).toHaveCount(0);
  await expect(
    anonymous.getByRole("link", { name: "Voltar ao Ecovit" }),
  ).toBeVisible();
  await anonymous.close();

  await checkFooter(page, "lista");
  await page.getByRole("button", { name: /Novo projeto/ }).click();
  await page.getByLabel("Nome do projeto").fill("Projeto com histórico");
  await page
    .getByRole("button", { name: "Criar projeto", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Salvo");
  await checkFooter(page, "editor");
  await expect(page.locator("footer")).toContainText("Face externa");
  await expect(
    page.getByRole("button", { name: /Diagnósticos/ }),
  ).toBeVisible();

  await rejectSaves(page);
  await page
    .getByRole("textbox", { name: "Nome do projeto" })
    .fill("Candidato em memória");
  await page.getByRole("textbox", { name: "Nome do projeto" }).press("Enter");
  await expect(page.getByRole("status")).toHaveText("Não salvo");
  await versionLink(page).click();
  await expect(historyHeading(page)).toBeVisible();
  await page.goBack();
  await expect(historyHeading(page)).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "Nome do projeto" }),
  ).toHaveValue("Candidato em memória");
  await expect(page.getByRole("status")).toHaveText("Não salvo");
});
