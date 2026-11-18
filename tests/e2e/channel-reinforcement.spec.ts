import { test, expect, rejectSaves, type Page } from "./auth";
import { readFile } from "node:fs/promises";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
  type Project,
} from "../../src/domain/project";
import { duplicateFloor } from "../../src/domain/floors";
import { putOpening } from "../../src/domain/openings";
import { parseFile } from "../../src/persistence/files";

async function state(page: Page): Promise<Project> {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    return (await import(path)).useStore.getState().doc;
  });
}
async function open(page: Page, multiple = false) {
  let d = createProject(
    "Armadura das canaletas",
    { length: 2500, width: 1250, height: 700 },
    7000,
  );
  const f = d.model.floors[0].id;
  d.project.groutSettings = defaultGroutSettings(false);
  d.project.channelLevels = [{ id: crypto.randomUUID(), top: 2100 }];
  d.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 10000, y: 0 }, 1250, f, 7000, 1)!,
  ];
  d = putOpening(d, {
    id: crypto.randomUUID(),
    wallId: d.model.walls[0].id,
    kind: "window",
    offset: 2500,
    width: 2500,
    base: 2100,
    height: 700,
  });
  if (multiple) d = duplicateFloor(d, f, 14000, "Superior");
  await page.getByTestId("import-file").setInputFiles({
    name: "armadura.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  return d;
}
const apply = (page: Page) =>
  page
    .getByRole("button", { name: "Aplicar armadura das cintas", exact: true })
    .click();
async function pixels(page: Page) {
  return page.locator("canvas").evaluateAll((elements) =>
    elements.reduce((sum, node) => {
      const c = node as HTMLCanvasElement,
        ctx = c.getContext("2d");
      if (!ctx) return sum;
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      for (let i = 0; i < data.length; i += 4)
        if (
          data[i] === 107 &&
          data[i + 1] === 63 &&
          data[i + 2] === 160 &&
          data[i + 3] > 0
        )
          sum++;
      return sum;
    }, 0),
  );
}
test(
  "T-026 configuração compartilhada, pavimentos, histórico, arquivo e barras reais na Fiada",
  { tag: "@interface" },
  async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, true);
    const initial = await state(page),
      first = initial.model.floors[0].id,
      upper = initial.model.floors[1].id;
    const form = page.getByRole("region", {
      name: "Armadura das cintas",
      exact: true,
    });
    const count = page.getByLabel("Quantidade de barras longitudinais", {
        exact: true,
      }),
      diameter = page.getByLabel("Diâmetro das barras (mm)", { exact: true });
    await expect(count).toHaveValue("2");
    await expect(diameter).toHaveValue("8");
    await expect(form).toContainText("cintas, vergas e contravergas");
    await page
      .getByLabel("Ativar armadura das canaletas", { exact: true })
      .check();
    await apply(page);
    await expect(page.getByRole("status")).toContainText("Salvo");
    let doc = await state(page);
    expect(doc.generated!.floors.map((f) => f.reinforcement!.length)).toEqual([
      2, 0,
    ]);
    expect(
      doc.generated!.floors[0].reinforcement!.every(
        (r) => r.count === 2 && r.diameter === 80,
      ),
    ).toBe(true);
    expect(doc.generated!.floors[0].courses).toEqual(
      initial.generated!.floors[0].courses,
    );
    expect(doc.generated!.floors[0].grouts).toEqual(
      initial.generated!.floors[0].grouts,
    );
    expect(doc.generated!.floors[0].clamps).toEqual(
      initial.generated!.floors[0].clamps,
    );
    await count.fill("3");
    await diameter.fill("6,3");
    await apply(page);
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.getByRole("button", { name: /Desfazer/ }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await expect(count).toHaveValue("2");
    await page.getByRole("button", { name: /Refazer/ }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await expect(diameter).toHaveValue("6,3");
    await count.fill("1.5");
    await apply(page);
    await expect(form.getByRole("alert")).toContainText("inteira positiva");
    expect(
      (await state(page)).model.floors[0].channelReinforcement!.count,
    ).toBe(3);
    await count.fill("3");
    await page.getByLabel("Pavimento", { exact: true }).selectOption(upper);
    await expect(count).toHaveValue("2");
    await expect(
      page.getByLabel("Ativar armadura das canaletas", { exact: true }),
    ).not.toBeChecked();
    await page
      .getByLabel("Ativar armadura das canaletas", { exact: true })
      .check();
    await count.fill("1");
    await apply(page);
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.getByLabel("Pavimento", { exact: true }).selectOption(first);
    await expect(count).toHaveValue("3");
    // Return to the default two bars to inspect their distinct parallel rendering.
    await count.fill("2");
    await diameter.fill("8");
    await apply(page);
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.screenshot({ path: ".tools/t026-propriedades.png" });
    await page.getByRole("button", { name: "Fiada", exact: true }).click();
    await page.getByLabel("Número da fiada", { exact: true }).fill("3");
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    const inspection = page.getByRole("region", {
      name: "Armadura das canaletas da fiada",
      exact: true,
    });
    await inspection
      .getByText("Identificar armaduras (1)", { exact: true })
      .click();
    await expect(inspection).toContainText(
      "2 barras de Ø 8 mm · trecho nominal 100 cm",
    );
    await page.screenshot({ path: ".tools/t026-fiada.png" });
    await expect.poll(() => pixels(page)).toBeGreaterThan(10);
    await page.getByLabel("Número da fiada", { exact: true }).fill("5");
    await expect(inspection).toContainText("trecho nominal 50 cm");
    await expect.poll(() => pixels(page)).toBeGreaterThan(10);
    await page.getByLabel("Número da fiada", { exact: true }).fill("4");
    await expect(inspection).toContainText("Nenhum trecho de armadura");
    await expect.poll(() => pixels(page)).toBe(0);
    await page.getByRole("button", { name: "Planta", exact: true }).click();
    await expect.poll(() => pixels(page)).toBe(0);
    const exported = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    doc = await state(page);
    const downloaded = parseFile(
      await readFile((await (await exported).path())!, "utf8"),
    );
    expect(downloaded.model.floors).toEqual(doc.model.floors);
    expect(downloaded.schemaVersion).toBe(24);
    await page.reload();
    await page.getByText(doc.project.name, { exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    expect(
      (await state(page)).model.floors.map(
        (f) => f.channelReinforcement!.count,
      ),
    ).toEqual([2, 1]);
    await page
      .getByRole("button", { name: "Recolher propriedades", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Propriedades", exact: true })
      .click();
    await expect(form).toBeAttached();
  },
);
test(
  "T-026 falha de salvamento preserva dados, bloqueia edição e permite recuperar",
  { tag: "@fluxo" },
  async ({ page }) => {
    await open(page);
    await rejectSaves(page);
    await page
      .getByLabel("Ativar armadura das canaletas", { exact: true })
      .check();
    await apply(page);
    const form = page.getByRole("region", {
      name: "Armadura das cintas",
      exact: true,
    });
    await expect(form.getByRole("alert")).toContainText("Não salvo");
    await expect(
      page.getByLabel("Quantidade de barras longitudinais", { exact: true }),
    ).toBeDisabled();
    expect((await state(page)).model.floors[0].channelReinforcement).toEqual({
      enabled: true,
      count: 2,
      diameter: 80,
    });
    await page.evaluate(() => {
      (window as unknown as { restorePut: () => void }).restorePut();
    });
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await expect(
      page.getByLabel("Quantidade de barras longitudinais", { exact: true }),
    ).toBeEnabled();
    expect((await state(page)).generated!.floors[0].reinforcement).toHaveLength(
      2,
    );
  },
);
