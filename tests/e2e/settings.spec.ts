import { test, expect } from "@playwright/test";
import { createProject, makeWall } from "../../src/domain/project";

test("Configurações do projeto ficam junto ao nome, com ícone e dicas acessíveis", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "header.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify(
        createProject("Projeto com nome comprido", {
          length: 2500,
          width: 1250,
          height: 700,
        }),
      ),
    ),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  const button = page.getByRole("button", {
    name: "Configurações",
    exact: true,
  });
  await expect(button).toHaveCount(1);
  await expect(
    page
      .locator("header")
      .getByRole("button", { name: "Configurações", exact: true }),
  ).toBeVisible();
  await expect(button).toHaveText("");
  await expect(button).toHaveAttribute("title", "Configurações do projeto");
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    const name = (await page
      .getByLabel("Nome do projeto", { exact: true })
      .boundingBox())!;
    const box = (await button.boundingBox())!;
    const icon = (await button.locator("svg").boundingBox())!;
    expect(
      Math.abs(name.y + name.height / 2 - box.y - box.height / 2),
    ).toBeLessThanOrEqual(1);
    expect(box.x - name.x - name.width).toBeGreaterThanOrEqual(0);
    expect(box.x - name.x - name.width).toBeLessThanOrEqual(6);
    expect(
      Math.abs(icon.x + icon.width / 2 - box.x - box.width / 2),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(icon.y + icon.height / 2 - box.y - box.height / 2),
    ).toBeLessThanOrEqual(1);
    await page.getByLabel("Nome do projeto", { exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    expect(
      await button.evaluate((el) => getComputedStyle(el, "::after").display),
    ).toBe("block");
    await page.screenshot({
      path: `.tools/settings-header-${info.project.name}-${width}.png`,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  await page
    .getByLabel("Nome do projeto", { exact: true })
    .fill("Projeto renomeado");
  await button.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Nome do projeto", { exact: true })).toHaveValue(
    "Projeto renomeado",
  );
});

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
    const clipped = await dialog.evaluate((el) =>
      [el, ...el.querySelectorAll("*")]
        .filter((node) => {
          const style = getComputedStyle(node);
          return (
            ["auto", "scroll"].includes(style.overflowY) &&
            node.scrollHeight > node.clientHeight + 1
          );
        })
        .map((node) => ({
          className: node.className,
          height: node.clientHeight,
          content: node.scrollHeight,
        })),
    );
    expect(clipped).toEqual([]);
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

test("Lucide mantém rótulos, estados, foco e navegação nas superfícies do aplicativo", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await page.screenshot({
    path: `.tools/lucide-home-${info.project.name}.png`,
  });
  await page.getByRole("button", { name: /Novo projeto/ }).click();
  const close = page.getByRole("button", { name: "Fechar criação" });
  await page.keyboard.press("Tab");
  await close.focus();
  await expect(close).toBeFocused();
  expect(
    await close.evaluate((el) => getComputedStyle(el, "::after").display),
  ).toBe("block");
  await page.screenshot({
    path: `.tools/lucide-create-focus-${info.project.name}.png`,
  });
  await close.click();
  const doc = createProject("Ícones", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  doc.model.walls.push(
    makeWall(
      { x: 0, y: 0 },
      { x: 20000, y: 0 },
      1250,
      doc.model.floors[0].id,
      28000,
      1,
    )!,
  );
  await page.getByTestId("import-file").setInputFiles({
    name: "icons.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(doc)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo no navegador");
  await expect(page.getByRole("status").locator("svg")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(
    page.getByRole("button", { name: "Desfazer", exact: true }),
  ).toBeDisabled();
  for (const size of [
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 900, height: 680 },
  ]) {
    await page.setViewportSize(size);
    await page.getByRole("button", { name: "Parede", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Parede", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Tab");
    await page
      .getByRole("button", { name: "Configurações", exact: true })
      .focus();
    await page.screenshot({
      path: `.tools/lucide-toolbar-${info.project.name}-${size.width}.png`,
    });
    const overflow = await page
      .locator("button:has(> svg)")
      .evaluateAll((controls) =>
        controls
          .filter((el) => {
            const box = el.getBoundingClientRect();
            // Tooltips intentionally extend beyond the button; inspect its content.
            return [...el.childNodes].some((node) => {
              if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim())
                return false;
              const range = document.createRange();
              range.selectNode(node);
              return [...range.getClientRects()].some(
                (rect) =>
                  rect.left < box.left - 1 || rect.right > box.right + 1,
              );
            });
          })
          .map((el) => el.textContent),
      );
    expect(overflow).toEqual([]);
  }
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Fiada anterior", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Próxima fiada", exact: true })
    .click();
  const previous = page.getByRole("button", {
    name: "Fiada anterior",
    exact: true,
  });
  await page.keyboard.press("Tab");
  await previous.focus();
  await page.mouse.move(650, 450);
  expect(
    await previous.evaluate((el) => getComputedStyle(el, "::after").display),
  ).toBe("block");
  await expect(page.getByLabel("Número da fiada")).toHaveValue("2");
  await page.screenshot({
    path: `.tools/lucide-fiada-focus-${info.project.name}.png`,
  });
  await page
    .getByRole("button", { name: "Recolher inspeção de fiadas", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Abrir inspeção de fiadas", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Inspeção de fiadas", exact: true }),
  ).toBeVisible();
});
