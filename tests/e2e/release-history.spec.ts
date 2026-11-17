import { readReleaseInfo } from "../../scripts/release-info";
import {
  expect,
  login,
  rejectSaves,
  test,
  publicTest,
  type Page,
} from "./auth";

const { version, commit, tasks } = readReleaseInfo();
const versionLink = (page: Page) =>
  page
    .locator("footer")
    .getByRole("link", { name: /Versão .*Histórico de Alterações/ });
const historyHeading = (page: Page) =>
  page.getByRole("heading", { name: "Histórico de Alterações" });
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
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(historyHeading(page)).toHaveCount(0);
  await expect(link).toBeFocused();
}

async function checkLayout(
  page: Page,
  label: string,
  browserName: string,
  sizes = viewports,
) {
  for (const viewport of sizes) {
    await page.setViewportSize(viewport);
    const link = versionLink(page),
      footerLabel = link.locator("..");
    await expect(link).toHaveText(commit);
    await expect(footerLabel).toHaveText(`Versão: ${version}`);
    await expect(footerLabel.getByRole("link")).toHaveCount(1);
    await expect(link).toHaveAttribute("href", "#historico-de-tasks");
    await expect(link).toHaveAccessibleName(
      `Versão ${version} · Histórico de Alterações`,
    );
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
  "T-021: versão com hora nos três rodapés compactos",
  { tag: "@interface" },
  async ({ page }, info) => {
    const sizes = [{ width: 900, height: 680 }];
    await page.goto("/");
    await checkLayout(page, "t021-login", info.project.name, sizes);
    await checkKeyboard(page);
    await login(page);
    await checkLayout(page, "t021-lista", info.project.name, sizes);
    await openEditor(page);
    const height = await page
      .locator("footer")
      .evaluate((el) => el.getBoundingClientRect().height);
    await checkLayout(page, "t021-editor", info.project.name, sizes);
    await versionLink(page).click();
    await expect(page.getByRole("dialog")).toContainText(version);
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "Nome do projeto" }),
    ).toHaveValue("Projeto com histórico");
    expect(height).toBe(26);
  },
);

publicTest(
  "T-022: popup compacto, foco e origem nos três contextos",
  { tag: "@interface" },
  async ({ page }) => {
    const dialog = page.getByRole("dialog", {
      name: "Histórico de Alterações",
    });
    const close = dialog.getByRole("button", { name: "Fechar", exact: true });
    await page.setViewportSize({ width: 900, height: 680 });
    await page.goto("/");
    await versionLink(page).click();
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((el) => el.matches(":modal"))).toBe(true);
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThan(0);
    expect(bounds!.y).toBeGreaterThan(0);
    expect(bounds!.width).toBeGreaterThan(850);
    expect(bounds!.height).toBeGreaterThan(630);
    await close.focus();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("main")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(close).toBeFocused();
    await versionLink(page).evaluate((el) => el.focus());
    await expect(close).toBeFocused();
    await page.screenshot({ path: ".tools/t022-login-900.png" });
    await page.setViewportSize({ width: 390, height: 640 });
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await expect(close).toBeInViewport();
    await page.screenshot({ path: ".tools/t022-login-390.png" });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(versionLink(page)).toBeFocused();
    await page.setViewportSize({ width: 900, height: 680 });
    await login(page);
    await versionLink(page).click();
    await expect(dialog).toBeVisible();
    await page.screenshot({ path: ".tools/t022-lista-900.png" });
    await close.click();
    await expect(versionLink(page)).toBeFocused();
    await openEditor(page);
    await versionLink(page).click();
    await page.setViewportSize({ width: 900, height: 420 });
    await expect(dialog).toBeVisible();
    const headerTop = await close.evaluate(
      (el) => el.getBoundingClientRect().top,
    );
    const list = dialog.getByRole("main");
    expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(
      true,
    );
    await list.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    expect(await close.evaluate((el) => el.getBoundingClientRect().top)).toBe(
      headerTop,
    );
    await page.screenshot({ path: ".tools/t022-editor-900.png" });
    await page.goBack();
    await expect(dialog).toHaveCount(0);
    await expect(versionLink(page)).toBeFocused();
    await expect(
      page.getByRole("textbox", { name: "Nome do projeto" }),
    ).toHaveValue("Projeto com histórico");
  },
);

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
      page.getByRole("button", { name: "Voltar ao Ecovit" }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toContainText(version);
    if (tasks.length)
      await expect(page.getByRole("listitem")).toHaveText(
        tasks.map(
          ({ id, title, summary, commit, dateTime }) =>
            `${id}${title}${summary ? ` - (${summary})` : ""}${commit}${dateTime}`,
        ),
      );
    else
      await expect(page.getByRole("main")).toContainText(
        "Nenhuma alteração disponível nesta versão.",
      );
    await page.getByRole("button", { name: "Voltar ao Ecovit" }).click();
    await expect(historyHeading(page)).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Entrar no Ecovit" }),
    ).toBeVisible();
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
