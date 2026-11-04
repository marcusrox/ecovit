import { test, expect, type Page } from "./auth";
import { createProject } from "../../src/domain/project";

const sizes = [
  [1366, 768],
  [1280, 720],
  [900, 680],
] as const;
const band = (page: Page) =>
  page.getByRole("region", { name: "Status dos projetos" });

async function release(page: Page, name: string) {
  await page.evaluate(
    (name) => (window as unknown as Record<string, () => void>)[name](),
    name,
  );
}

test("faixa reserva espaço na atualização, mantém erro e permite recuperar lista", async ({
  page,
}, info) => {
  await expect(
    page.getByRole("button", { name: /Novo projeto/ }),
  ).toBeEnabled();
  const initialTop = (await page
    .getByRole("button", { name: /Novo projeto/ })
    .boundingBox())!.y;
  let finish!: () => void;
  const gate = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.route("**/api/projects", async (route) => {
    await gate;
    await route.fulfill({
      status: 503,
      json: { code: "unavailable", message: "Falha controlada" },
    });
  });
  await page
    .getByRole("button", { name: "Atualizar lista", exact: true })
    .click();
  try {
    await expect(band(page).getByRole("status")).toHaveText(
      "Atualizando lista…",
    );
    expect(
      (await page.getByRole("button", { name: /Novo projeto/ }).boundingBox())!
        .y,
    ).toBe(initialTop);
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      await expect(band(page)).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const heading = await page
        .getByRole("heading", { name: "Seu espaço de projetos" })
        .boundingBox();
      expect((await band(page).boundingBox())!.y).toBeGreaterThan(
        heading!.y + heading!.height,
      );
      await page.screenshot({
        path: `.tools/m12/home-status-list-${info.project.name}-${width}.png`,
      });
    }
  } finally {
    finish();
  }
  await expect(band(page).getByRole("alert")).toContainText(
    "Não foi possível consultar os projetos",
  );
  await expect(page.getByRole("alert")).toHaveCount(1);
  await page.unroute("**/api/projects");
  await page
    .getByRole("button", { name: "Atualizar lista", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Novo projeto/ }),
  ).toBeEnabled();
  await expect(band(page).getByRole("status")).toBeEmpty();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("importação sem cartão mantém faixa até preparar o desenho e respeita movimento reduzido", async ({
  page,
}, info) => {
  await expect(
    page.getByRole("button", { name: /Novo projeto/ }),
  ).toBeEnabled();
  const file = await page.evaluate(async () => {
    const domain = "/src/domain/project.ts";
    const elements = "/src/domain/image-elements.ts";
    const catalog = "/src/domain/image-catalog.ts";
    const { createProject } = await import(domain);
    const { standardElement } = await import(elements);
    const { imageCatalog } = await import(catalog);
    const project = createProject("Importação com status", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    project.model.imageElements.push(
      standardElement(imageCatalog[0], project.model.floors[0].id),
    );
    const text = File.prototype.text;
    const decode = HTMLImageElement.prototype.decode;
    let resumeRead!: () => void;
    let resumeBitmap!: () => void;
    const reading = new Promise<void>((resolve) => {
      resumeRead = resolve;
    });
    const bitmap = new Promise<void>((resolve) => {
      resumeBitmap = resolve;
    });
    Object.assign(window, { resumeRead, resumeBitmap });
    File.prototype.text = async function () {
      await reading;
      return text.call(this);
    };
    HTMLImageElement.prototype.decode = async function () {
      await bitmap;
      return decode.call(this);
    };
    return JSON.stringify(project);
  });
  await page
    .getByTestId("import-file")
    .setInputFiles({
      name: "status.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(file),
    });
  try {
    await expect(band(page).getByRole("status")).toHaveText(
      "Importando arquivo…",
    );
    await expect(
      page.getByRole("button", { name: /Novo projeto/ }),
    ).toBeDisabled();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(
      band(page).locator("[role=status] > div > span").first(),
    ).toHaveCSS("animation-name", "none");
    await release(page, "resumeRead");
    await expect(band(page).getByRole("status")).toHaveText("Abrindo projeto…");
    await expect(page.getByTestId("drawing")).toBeHidden();
    await expect(page.getByRole("status")).toHaveCount(1);
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      await expect(band(page)).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const icon = band(page).locator("svg");
      const i = (await icon.boundingBox())!;
      const c = (await icon.locator("..").boundingBox())!;
      expect(
        Math.abs(i.x + i.width / 2 - c.x - c.width / 2),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(i.y + i.height / 2 - c.y - c.height / 2),
      ).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: `.tools/m12/home-status-import-${info.project.name}-${width}.png`,
      });
    }
  } finally {
    await release(page, "resumeRead");
    await release(page, "resumeBitmap");
  }
  await expect(page.getByTestId("drawing")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Salvo");
  await expect(band(page)).toHaveCount(0);
});

test("erro de importação aparece na faixa, pode ser fechado e permite novo arquivo", async ({
  page,
}) => {
  await page
    .getByTestId("import-file")
    .setInputFiles({
      name: "invalido.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from("arquivo inválido"),
    });
  await expect(band(page).getByRole("alert")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(1);
  await band(page).getByRole("button", { name: "Fechar aviso" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page
    .getByTestId("import-file")
    .setInputFiles({
      name: "valido.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify(
          createProject("Nova tentativa", {
            length: 2500,
            width: 1250,
            height: 700,
          }),
        ),
      ),
    });
  await expect(page.getByTestId("drawing")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Salvo");
});
