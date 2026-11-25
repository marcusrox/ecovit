import { openFerragens, closeFerragens } from "./floor-reinforcement-helpers";
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
  await openFerragens(page);
  return d;
}
const apply = (page: Page) =>
  page.getByRole("button", { name: "Aplicar alterações", exact: true }).click();
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
async function connectedBars(page: Page) {
  return page.locator("canvas").evaluateAll((elements) => {
    let components = 0;
    for (const node of elements) {
      const c = node as HTMLCanvasElement,
        ctx = c.getContext("2d");
      if (!ctx) continue;
      const data = ctx.getImageData(0, 0, c.width, c.height).data,
        mask = new Uint8Array(c.width * c.height);
      for (let p = 0; p < mask.length; p++) {
        const i = p * 4;
        if (
          data[i] === 107 &&
          data[i + 1] === 63 &&
          data[i + 2] === 160 &&
          data[i + 3] > 0
        )
          mask[p] = 1;
      }
      for (let p = 0; p < mask.length; p++)
        if (mask[p]) {
          const stack = [p];
          mask[p] = 0;
          let size = 0;
          while (stack.length) {
            const index = stack.pop()!,
              x = index % c.width,
              y = Math.floor(index / c.width);
            size++;
            for (let dy = -1; dy <= 1; dy++)
              for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx,
                  ny = y + dy,
                  n = ny * c.width + nx;
                if (
                  nx >= 0 &&
                  nx < c.width &&
                  ny >= 0 &&
                  ny < c.height &&
                  mask[n]
                ) {
                  mask[n] = 0;
                  stack.push(n);
                }
              }
          }
          if (size > 5) components++;
        }
    }
    return components;
  });
}
test(
  "Armaduras: continuidade visual nos encontros L e T sem alterar o projeto",
  { tag: "@interface" },
  async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const d = createProject(
        "Continuidade L e T",
        { length: 2500, width: 1250, height: 700 },
        7000,
      ),
      m = 1250,
      f = d.model.floors[0];
    d.project.channelLevels = [{ id: crypto.randomUUID(), top: 3500 }];
    d.project.groutSettings = {
      ...defaultGroutSettings(false),
      junctions: true,
    };
    f.groutMode = "reinforced";
    f.channelReinforcement = { enabled: true, count: 2, diameter: 80 };
    d.model.walls = [
      makeWall({ x: 0, y: 0 }, { x: 8 * m, y: 0 }, m, f.id, 7000, 1)!,
      makeWall({ x: 0, y: m }, { x: 0, y: 6 * m }, m, f.id, 7000, 1)!,
      makeWall({ x: 12 * m, y: 0 }, { x: 12 * m, y: 8 * m }, m, f.id, 7000, 1)!,
      makeWall(
        { x: 7 * m, y: 4 * m },
        { x: 12 * m, y: 4 * m },
        m,
        f.id,
        7000,
        1,
      )!,
    ];
    await page.getByTestId("import-file").setInputFiles({
      name: "encontros.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(d)),
    });
    await expect(page.getByRole("status")).toContainText("Salvo");
    const before = await state(page);
    expect(before.generated!.floors[0].reinforcement).toHaveLength(4);
    await closeFerragens(page);
    await page.getByRole("button", { name: "Fiada", exact: true }).click();
    await page.getByLabel("Número da fiada", { exact: true }).fill("5");
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    // Two complete L paths, plus one connected network at T. The former gaps yielded eight components.
    await expect.poll(() => connectedBars(page)).toBe(3);
    await page.screenshot({ path: ".tools/reinforcement-junctions.png" });
    expect(await state(page)).toEqual(before);
  },
);
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
    await expect(diameter).toHaveValue("10");
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
        (r) => r.count === 2 && r.diameter === 100,
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
    await diameter.selectOption("12,5");
    await apply(page);
    await expect(page.getByRole("status")).toContainText("Salvo");
    await closeFerragens(page);
    await page.getByRole("button", { name: /Desfazer/ }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await openFerragens(page);
    await expect(count).toHaveValue("2");
    await closeFerragens(page);
    await page.getByRole("button", { name: /Refazer/ }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await openFerragens(page);
    await expect(diameter).toHaveValue("12,5");
    await count.fill("1.5");
    await apply(page);
    await expect(form.getByRole("alert")).toContainText("inteira positiva");
    expect(
      (await state(page)).model.floors[0].channelReinforcement!.count,
    ).toBe(3);
    await count.fill("3");
    await closeFerragens(page);
    await page.getByLabel("Pavimento", { exact: true }).selectOption(upper);
    await openFerragens(page);
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
    await closeFerragens(page);
    await page.getByLabel("Pavimento", { exact: true }).selectOption(first);
    await openFerragens(page);
    await expect(count).toHaveValue("3");
    // Return to the default two bars to inspect their distinct parallel rendering.
    await count.fill("2");
    await diameter.selectOption("8");
    await apply(page);
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.screenshot({ path: ".tools/t026-propriedades.png" });
    await closeFerragens(page);
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
    expect(downloaded.schemaVersion).toBe(33);
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
    await openFerragens(page);
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
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
      "Não salvo",
    );
    await expect(
      page.getByLabel("Quantidade de barras longitudinais", { exact: true }),
    ).toBeDisabled();
    expect((await state(page)).model.floors[0].channelReinforcement).toEqual({
      enabled: true,
      count: 2,
      diameter: 100,
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
      page.getByLabel("Quantidade de barras longitudinais", { exact: true }),
    ).toBeEnabled();
    expect((await state(page)).generated!.floors[0].reinforcement).toHaveLength(
      2,
    );
  },
);
