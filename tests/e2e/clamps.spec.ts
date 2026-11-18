import { openFerragens, closeFerragens } from "./floor-reinforcement-helpers";
import { test, expect, rejectSaves, type Page } from "./auth";
import { readFile } from "node:fs/promises";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
  type Project,
} from "../../src/domain/project";
import { parseFile } from "../../src/persistence/files";

async function state(page: Page): Promise<Project> {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    return (await import(path)).useStore.getState().doc;
  });
}
async function open(page: Page) {
  const d = createProject(
      "Grampos por pavimento",
      { length: 2500, width: 1250, height: 700 },
      9800,
    ),
    m = 1250,
    f = d.model.floors[0].id;
  d.project.channelLevels = [];
  d.project.groutSettings = { ...defaultGroutSettings(false), junctions: true };
  d.model.floors[0].groutMode = "reinforced";
  d.model.walls = [
    makeWall({ x: -5 * m, y: 0 }, { x: 6 * m, y: 0 }, m, f, 9800, 1)!,
    makeWall({ x: 0, y: m }, { x: 0, y: 6 * m }, m, f, 9800, 1)!,
  ];
  await page.getByTestId("import-file").setInputFiles({
    name: "grampos.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  await openFerragens(page);
  return d;
}
async function configure(page: Page) {
  await page
    .getByLabel("Fiadas dos grampos", { exact: true })
    .fill("13, 5, 9, 9");
  await page
    .getByLabel("Ativar grampos neste pavimento", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "Aplicar alterações", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function orangePixels(page: Page) {
  return page.locator("canvas").evaluateAll((elements) =>
    elements.reduce((sum, node) => {
      const canvas = node as HTMLCanvasElement,
        ctx = canvas.getContext("2d");
      if (!ctx) return sum;
      const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < rgba.length; i += 4)
        if (
          rgba[i] === 167 &&
          rgba[i + 1] === 68 &&
          rgba[i + 2] === 22 &&
          rgba[i + 3] > 0
        )
          sum++;
      return sum;
    }, 0),
  );
}
test(
  "T-025 formulário por pavimento, persistência, histórico e grampos visíveis só na fiada programada",
  { tag: "@interface" },
  async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page);
    const panel = page.getByRole("region", {
      name: "Grampos dos encontros",
      exact: true,
    });
    await expect(
      page.getByLabel("Diâmetro do ferro (mm)", { exact: true }),
    ).toHaveValue("6,3");
    await expect(
      page.getByLabel("Comprimento nominal de cada grampo (cm)", {
        exact: true,
      }),
    ).toHaveValue("32,5");
    await page
      .getByLabel("Fiadas dos grampos", { exact: true })
      .fill("5, 8, 13");
    await page
      .getByLabel("Programação dos grampos", { exact: true })
      .selectOption("interval");
    await expect(panel.getByRole("alert")).toContainText("Lista irregular");
    await expect(
      page.getByLabel("Primeira fiada dos grampos", { exact: true }),
    ).toHaveValue("");
    await page
      .getByLabel("Programação dos grampos", { exact: true })
      .selectOption("list");
    const before = (await state(page)).generated!.floors[0];
    await configure(page);
    const doc = await state(page);
    expect(doc.model.floors[0].clamps!.schedule).toEqual({
      mode: "list",
      courses: [5, 9, 13],
    });
    expect(doc.generated!.floors[0].clamps).toHaveLength(9);
    expect(doc.generated!.floors[0].courses).toEqual(before.courses);
    expect(doc.generated!.floors[0].grouts).toEqual(before.grouts);
    await page
      .getByLabel("Programação dos grampos", { exact: true })
      .selectOption("interval");
    await expect(
      page.getByLabel("Primeira fiada dos grampos", { exact: true }),
    ).toHaveValue("5");
    await expect(
      page.getByLabel("Repetir a cada (fiadas)", { exact: true }),
    ).toHaveValue("4");
    await page
      .getByLabel("Última fiada dos grampos", { exact: true })
      .fill("14");
    await page
      .getByLabel("Comprimento nominal de cada grampo (cm)", { exact: true })
      .fill("40,5");
    await page
      .getByLabel("Diâmetro do ferro (mm)", { exact: true })
      .selectOption("6,3");
    await page
      .getByRole("button", { name: "Aplicar alterações", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    expect((await state(page)).model.floors[0].clamps).toMatchObject({
      diameter: 63,
      length: 4050,
      schedule: { mode: "interval", first: 5, every: 4, last: 14 },
    });
    await closeFerragens(page);
    await page.getByRole("button", { name: /Desfazer/ }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await openFerragens(page);
    await expect(
      page.getByLabel("Programação dos grampos", { exact: true }),
    ).toHaveValue("list");
    await closeFerragens(page);
    await page.getByRole("button", { name: /Refazer/ }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await openFerragens(page);
    await page
      .getByLabel("Comprimento nominal de cada grampo (cm)", { exact: true })
      .fill("12,51");
    await page
      .getByRole("button", { name: "Aplicar alterações", exact: true })
      .click();
    await expect(panel.getByRole("alert")).toContainText("duas pontas");
    expect((await state(page)).model.floors[0].clamps!.length).toBe(4050);
    await page
      .getByLabel("Comprimento nominal de cada grampo (cm)", { exact: true })
      .fill("40,5");
    await page.screenshot({ path: ".tools/t025-propriedades.png" });
    await closeFerragens(page);
    await page.getByRole("button", { name: "Fiada", exact: true }).click();
    await page.getByLabel("Número da fiada", { exact: true }).fill("5");
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    const inspection = page.getByRole("region", {
      name: "Grampos da fiada",
      exact: true,
    });
    await inspection
      .getByText("Identificar grampos (3)", { exact: true })
      .click();
    await expect(inspection).toContainText("Ø 6,3 mm");
    await expect(inspection).toContainText("40,5 cm (12,5 + 14 + 14 cm)");
    await expect.poll(() => orangePixels(page)).toBeGreaterThan(10);
    await page.screenshot({ path: ".tools/t025-fiada.png" });
    await page.getByLabel("Número da fiada", { exact: true }).fill("6");
    await expect(inspection).toContainText("Nenhum grampo nesta fiada");
    await expect.poll(() => orangePixels(page)).toBe(0);
    await page.getByRole("button", { name: "Planta", exact: true }).click();
    await expect.poll(() => orangePixels(page)).toBe(0);
    const exported = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    const downloaded = parseFile(
      await readFile((await (await exported).path())!, "utf8"),
    );
    expect(downloaded.model.floors[0].clamps).toEqual(
      (await state(page)).model.floors[0].clamps,
    );
    const name = (await state(page)).project.name;
    await page.reload();
    await page.getByText(name, { exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await openFerragens(page);
    await expect(
      page.getByLabel("Diâmetro do ferro (mm)", { exact: true }),
    ).toHaveValue("6,3");
    expect((await state(page)).generated!.floors[0].clamps).toHaveLength(9);
  },
);
test(
  "T-025 falha de salvamento conserva configuração e permite recuperar",
  { tag: "@fluxo" },
  async ({ page }) => {
    await open(page);
    await rejectSaves(page);
    await page.getByLabel("Fiadas dos grampos", { exact: true }).fill("5");
    await page
      .getByLabel("Ativar grampos neste pavimento", { exact: true })
      .check();
    await page
      .getByRole("button", { name: "Aplicar alterações", exact: true })
      .click();
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
      "Não salvo",
    );
    await expect(
      page.getByRole("button", { name: "Aplicar alterações", exact: true }),
    ).toBeDisabled();
    expect((await state(page)).model.floors[0].clamps!.schedule).toEqual({
      mode: "list",
      courses: [5],
    });
    await page.evaluate(() => {
      (window as unknown as { restorePut: () => void }).restorePut();
    });
    await closeFerragens(page);
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await openFerragens(page);
    await expect(
      page.getByRole("button", { name: "Aplicar alterações", exact: true }),
    ).toBeEnabled();
    expect((await state(page)).generated!.floors[0].clamps).toHaveLength(3);
  },
);
