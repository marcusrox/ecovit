import { openFerragens, closeFerragens } from "./floor-reinforcement-helpers";
import { test, expect, blockEditing, type Page } from "./auth";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
  type Project,
} from "../../src/domain/project";
import { duplicateFloor } from "../../src/domain/floors";
import { parseFile } from "../../src/persistence/files";
import { readFile } from "node:fs/promises";

async function state(page: Page): Promise<Project> {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    return (await import(path)).useStore.getState().doc;
  });
}

test(
  "T-023 reforça os braços encostados em conjunto de L, T e cruz",
  { tag: "@interface" },
  async ({ page }) => {
    const doc = createProject("Contatos entre paredes", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    const m = 1250,
      floorId = doc.model.floors[0].id;
    const segments = [
      [
        [0, 0],
        [51, 0],
      ],
      [
        [0, 32],
        [51, 32],
      ],
      [
        [0, 1],
        [0, 32],
      ],
      [
        [50, 1],
        [50, 32],
      ],
      [
        [15, 1],
        [15, 11],
      ],
      [
        [34, 1],
        [34, 32],
      ],
      [
        [27, 19],
        [50, 19],
      ],
    ];
    doc.model.walls = segments.map(([a, b]) =>
      makeWall(
        { x: a[0] * m, y: a[1] * m },
        { x: b[0] * m, y: b[1] * m },
        m,
        floorId,
        28000,
        1,
      )!,
    );
    doc.model.floors[0].groutMode = "reinforced";
    doc.project.channelLevels = [];
    doc.project.groutSettings = {
      ...defaultGroutSettings(),
    };
    await page.getByTestId("import-file").setInputFiles({
      name: "contatos.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(doc)),
    });
    await expect(page.getByRole("status")).toContainText("Salvo");
    const result = (await state(page)).generated!.floors[0];
    expect(result.diagnostics.filter((d) => d.severity === "error")).toEqual(
      [],
    );
    const junctions = result.components.flatMap((c) => c.junctions);
    expect(junctions).toHaveLength(9);
    for (const j of junctions) {
      const origin = `junction:${j.kind}:${j.x}:${j.y}`;
      expect(
        result.grouts!.filter((a) => a.origins.includes(origin)),
      ).toHaveLength(j.kind === "L" ? 3 : j.kind === "T" ? 4 : 5);
    }
    await page.getByRole("button", { name: "Fiada", exact: true }).click();
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    await page.screenshot({ path: ".tools/t023-contatos-corrigidos.png" });
  },
);
test(
  "T-023 modalidade por pavimento, categorias globais e transporte",
  { tag: "@interface" },
  async ({ page }) => {
    let doc = createProject("Graute por pavimento", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    const m = 1250,
      floorId = doc.model.floors[0].id;
    doc.project.channelLevels = [];
    doc.project.groutSettings = {
      ...defaultGroutSettings(false),
      junctions: true,
    };
    doc.model.walls = [
      makeWall({ x: -3 * m, y: 0 }, { x: 4 * m, y: 0 }, m, floorId, 2100, 1)!,
      makeWall({ x: 0, y: -3 * m }, { x: 0, y: 4 * m }, m, floorId, 2100, 1)!,
    ];
    doc = duplicateFloor(doc, floorId, 28000, "Superior");
    const upper = doc.model.floors[1].id;
    await page.getByTestId("import-file").setInputFiles({
      name: "pavimentos.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(doc)),
    });
    await expect(page.getByRole("status")).toContainText("Salvo");
    const counts = async () =>
      (await state(page)).generated?.floors.map((f) => f.grouts?.length);
    const mode = page.getByLabel("Graute nos encontros", { exact: true });
    const floor = page.getByLabel("Pavimento", { exact: true });
    const settings = page.getByRole("button", {
      name: "Configurações",
      exact: true,
    });
    const dialog = page.getByRole("dialog");
    await openFerragens(page);
    await expect(mode).toHaveValue("simple");
    await closeFerragens(page);
    await settings.click();
    await expect(
      dialog.getByLabel("Graute nos encontros", { exact: true }),
    ).toHaveCount(0);
    await expect(
      dialog.getByLabel("Distância máxima de graute", { exact: true }),
    ).toBeVisible();
    await dialog.getByLabel("Encontros", { exact: true }).uncheck();
    await dialog
      .getByRole("button", { name: "Aplicar configurações", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await openFerragens(page);
    await expect(mode).toBeDisabled();
    await closeFerragens(page);
    await settings.click();
    await dialog.getByLabel("Encontros", { exact: true }).check();
    await dialog
      .getByRole("button", { name: "Aplicar configurações", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await openFerragens(page);
    await expect(mode).toBeEnabled();
    await mode.selectOption("reinforced");
    await page
      .getByRole("button", { name: "Aplicar alterações", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await closeFerragens(page);
    await expect.poll(counts).toEqual([5, 1]);
    await expect(page.getByRole("status")).toContainText("Salvo");
    await floor.selectOption(upper);
    await openFerragens(page);
    await expect(mode).toHaveValue("simple");
    await mode.selectOption("reinforced");
    await page
      .getByRole("button", { name: "Aplicar alterações", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await closeFerragens(page);
    await expect.poll(counts).toEqual([5, 5]);
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.getByRole("button", { name: /Desfazer/ }).click();
    await expect.poll(counts).toEqual([5, 1]);
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.getByRole("button", { name: /Refazer/ }).click();
    await expect.poll(counts).toEqual([5, 5]);
    await expect(page.getByRole("status")).toContainText("Salvo");
    await floor.selectOption(floorId);
    await openFerragens(page);
    await expect(mode).toHaveValue("reinforced");
    await mode.selectOption("simple");
    await page
      .getByRole("button", { name: "Aplicar alterações", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await closeFerragens(page);
    await expect.poll(counts).toEqual([1, 5]);
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.screenshot({ path: ".tools/t023-por-pavimento.png" });
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    const file = await download;
    const loaded = parseFile(await readFile((await file.path())!, "utf8"));
    expect(loaded.schemaVersion).toBe(35);
    expect(loaded.model.floors.map((f) => f.groutMode)).toEqual([
      "simple",
      "reinforced",
    ]);
    expect(loaded.project.groutSettings).not.toHaveProperty("junctionMode");
    await page.reload();
    await page
      .getByRole("button", { name: /Graute por pavimento/ })
      .first()
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await expect.poll(counts).toEqual([1, 5]);
    await floor.selectOption(upper);
    await openFerragens(page);
    await expect(mode).toHaveValue("reinforced");
    await closeFerragens(page);
    await blockEditing(page);
    await openFerragens(page);
    await expect(mode).toBeDisabled();
  },
);
