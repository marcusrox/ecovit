import { readReleaseInfo } from "../../scripts/release-info";
import { expect, rejectSaves, test, publicTest, type Page } from "./auth";

const { version, tasks } = readReleaseInfo();
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

async function openEditor(page: Page) {
  await page.getByRole("button", { name: /Novo projeto/ }).click();
  await page.getByLabel("Nome do projeto").fill("Projeto com histórico");
  await page
    .getByRole("button", { name: "Criar projeto", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Salvo");
}

async function checkKeyboard(page: Page) {
  const link = versionLink(page);
  await link.scrollIntoViewIfNeeded();
  await link.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(link).toBeFocused();
  expect(await link.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe(
    "solid",
  );
  await link.press("Enter");
  await expect(historyHeading(page)).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(version);
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(historyHeading(page)).toHaveCount(0);
  await expect(link).toBeFocused();
}

async function checkLayout(page: Page, label: string, browserName: string) {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const link = versionLink(page),
      footerLabel = link.locator("..");
    await expect(link).toHaveText(version);
    await expect(footerLabel).toHaveText(`Versão: ${version}`);
    await expect(footerLabel.getByRole("link")).toHaveCount(1);
    await expect(link).toHaveAttribute("href", "#historico-de-tasks");
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeInViewport();
    await expect(footerLabel).toBeInViewport({ ratio: 1 });
    const boxes = await page.locator("footer > *").evaluateAll((elements) =>
      elements
        .filter((el) => el.getClientRects().length)
        .map((el) => {
          const { left, right } = el.getBoundingClientRect();
          return { left, right };
        }),
    );
    for (let i = 1; i < boxes.length; i++)
      expect(boxes[i].left).toBeGreaterThanOrEqual(boxes[i - 1].right);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await link.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(link).toBeFocused();
    expect(await link.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe(
      "solid",
    );
    await page.screenshot({
      path: `.tools/release-history/${label}-${browserName}-${viewport.width}.png`,
    });
  }
}

publicTest(
  "histórico público: conteúdo e acesso direto sem autenticação",
  { tag: "@fluxo" },
  async ({ page }) => {
    await page.goto("/#historico-de-tasks");
    await page.reload();
    await expect(historyHeading(page)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Entrar no Ecovit" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Voltar ao Ecovit" }),
    ).toBeVisible();
    await expect(page.getByRole("main")).toContainText(version);
    if (tasks.length)
      await expect(page.getByRole("listitem")).toHaveText(
        tasks.map(
          ({ id, title, date }) =>
            `${id}${title}${date.split("-").reverse().join("/")}`,
        ),
      );
    else
      await expect(page.getByRole("main")).toContainText(
        "Nenhuma task implementada nesta versão",
      );
  },
);

publicTest(
  "histórico: teclado e retorno de foco no login",
  { tag: "@interface" },
  async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Entrar no Ecovit" }),
    ).toBeVisible();
    await checkKeyboard(page);
  },
);

test(
  "histórico: teclado e retorno de foco na lista",
  { tag: "@interface" },
  async ({ page }) => {
    await checkKeyboard(page);
  },
);

test(
  "histórico: teclado e informações do rodapé do editor",
  { tag: "@interface" },
  async ({ page }) => {
    await openEditor(page);
    await checkKeyboard(page);
    await expect(page.locator("footer")).toContainText("Face externa");
    await expect(
      page.getByRole("button", { name: /Diagnósticos/ }),
    ).toBeVisible();
  },
);

test(
  "histórico: voltar preserva candidato em memória após falha de salvamento",
  { tag: "@fluxo" },
  async ({ page }) => {
    await openEditor(page);
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
  },
);

publicTest(
  "rodapé: matriz visual do login",
  { tag: "@interface" },
  async ({ page }, info) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Entrar no Ecovit" }),
    ).toBeVisible();
    await checkLayout(page, "login", info.project.name);
  },
);

test(
  "rodapé: matriz visual da lista",
  { tag: "@interface" },
  async ({ page }, info) => {
    await checkLayout(page, "lista", info.project.name);
  },
);

test(
  "rodapé: matriz visual do editor",
  { tag: "@interface" },
  async ({ page }, info) => {
    await openEditor(page);
    await checkLayout(page, "editor", info.project.name);
    await expect(page.locator("footer")).toContainText("Face externa");
    await expect(
      page.getByRole("button", { name: /Diagnósticos/ }),
    ).toBeVisible();
  },
);
