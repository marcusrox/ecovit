import { test, expect, type Page } from "./auth";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import {
  createProject,
  makeWall,
  defaultGroutSettings,
} from "../../src/domain/project";

async function open(page: Page, rich = false, reinforced = false) {
  const doc = createProject(
      "Planta e fiadas · T-037",
      { length: 2500, width: 1250, height: 700 },
      4200,
    ),
    floorId = doc.model.floors[0].id;
  doc.project.channelLevels = [];
  doc.project.groutSettings = defaultGroutSettings(false);
  doc.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 20000, y: 0 }, 1250, floorId, 4200, 1)!,
  ];
  doc.model.openings = [
    {
      id: crypto.randomUUID(),
      wallId: doc.model.walls[0].id,
      kind: "door",
      offset: 2500,
      width: 5000,
      base: 0,
      height: 2100,
      appearance: { type: "swing", orientation: 0 },
    },
  ];
  if (rich) {
    doc.project.name =
      "Projeto de demonstração com ambientes, mobiliário, terreno, medidas e anotações";
    for (const [a, b] of [
      [
        { x: 20000, y: 0 },
        { x: 20000, y: 15000 },
      ],
      [
        { x: 0, y: 15000 },
        { x: 20000, y: 15000 },
      ],
      [
        { x: 0, y: 0 },
        { x: 0, y: 15000 },
      ],
    ] as const)
      doc.model.walls.push(makeWall(a, b, 1250, floorId, 4200, 1)!);
    doc.model.terrain = {
      id: crypto.randomUUID(),
      contour: [
        { x: -5000, y: -5000 },
        { x: 30000, y: -5000 },
        { x: 30000, y: 30000 },
        { x: -5000, y: 30000 },
      ],
      material: "soft",
      revision: 1,
      textureOrigin: { x: -5000, y: -5000 },
      compass: {
        visible: true,
        center: { x: 25000, y: 5000 },
        size: 8000,
        angle: 0,
      },
    };
    doc.model.imageElements = [
      {
        id: crypto.randomUUID(),
        floorId,
        name: "Cadeira",
        source: { kind: "catalog", itemId: "cadeira", revision: 1 },
        x: 13000,
        y: 8500,
        width: 4500,
        depth: 5000,
        angle: 30,
        flipX: true,
      },
    ];
    doc.model.roomLabels = [
      {
        id: crypto.randomUUID(),
        floorId,
        name: "Sala",
        position: { x: 8000, y: 7000 },
        reference: { x: 8000, y: 7000 },
        review: false,
      },
    ];
    doc.model.measurements = [
      {
        id: crypto.randomUUID(),
        floorId,
        a: { x: 0, y: 15000 },
        b: { x: 20000, y: 15000 },
        offset: 4000,
      },
    ];
    doc.model.texts = [
      {
        id: crypto.randomUUID(),
        floorId,
        content: "Anotação do projeto\nConferir as medidas",
        x: 1000,
        y: 23000,
        width: 19000,
        size: 1300,
        rotation: 0,
        bold: false,
        color: "#203b2b",
        align: "left",
        background: true,
        border: true,
      },
    ];
    doc.model.slabs = [
      {
        id: crypto.randomUUID(),
        floorId,
        thickness: 1400,
        contour: [
          { x: 0, y: 0 },
          { x: 20000, y: 0 },
          { x: 20000, y: 15000 },
          { x: 0, y: 15000 },
        ],
        openings: [
          {
            id: crypto.randomUUID(),
            contour: [
              { x: 15000, y: 10000 },
              { x: 17500, y: 10000 },
              { x: 17500, y: 12500 },
              { x: 15000, y: 12500 },
            ],
          },
        ],
      },
    ];
  }
  if (reinforced) {
    doc.project.groutSettings = defaultGroutSettings(true);
    doc.project.channelLevels = [{ id: crypto.randomUUID(), top: 2800 }];
    doc.model.floors[0].groutMode = "reinforced";
    doc.model.floors[0].clamps = {
      enabled: true,
      diameter: 63,
      length: 3250,
      schedule: { mode: "list", courses: [4] },
    };
    doc.model.floors[0].channelReinforcement = {
      enabled: true,
      count: 2,
      diameter: 100,
    };
  }
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "drawing.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(doc)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo", {
    timeout: 60000,
  });
  return doc;
}
async function downloadProject(page: Page) {
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Baixar projeto", exact: true })
    .click();
  return readFile((await (await download).path())!, "utf8");
}

test(
  "T-037 exporta o próprio PDF da prévia com Planta e fiadas relevantes e preserva o editor",
  { tag: "@fluxo" },
  async ({ page }) => {
    await open(page);
    const original = await downloadProject(page);
    await expect(
      page.getByRole("button", { name: "Carregar arquivo", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Exportar desenhos", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Exportar desenhos em PDF",
    });
    await dialog
      .getByRole("combobox", { name: "Conteúdo", exact: true })
      .selectOption("both");
    await dialog
      .getByRole("combobox", { name: "Selecionar fiadas", exact: true })
      .selectOption("relevant");
    await expect(dialog).toContainText("Fiadas selecionadas: 1, 4, 6");
    await dialog
      .getByRole("button", { name: "Gerar PDF", exact: true })
      .click();
    const downloadButton = dialog.getByRole("button", {
      name: "Baixar PDF",
      exact: true,
    });
    await expect(downloadButton).toBeEnabled({ timeout: 30000 });
    await expect(dialog.getByLabel("Página 1 do PDF gerado")).toBeVisible();
    await expect(dialog).toContainText("Página 1 de 4");
    await dialog
      .getByRole("button", { name: "Próxima página", exact: true })
      .click();
    await expect(dialog.getByLabel("Página 2 do PDF gerado")).toBeVisible();
    const event = page.waitForEvent("download");
    await downloadButton.click();
    const file = await event;
    const path = (await file.path())!;
    const bytes = await readFile(path);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(4);
    expect(pdf.getPage(0).getWidth()).toBeCloseTo((210 * 72) / 25.4, 3);
    expect(pdf.getPage(0).getHeight()).toBeCloseTo((297 * 72) / 25.4, 3);
    await file.saveAs(".tools/t037/drawings.pdf");
    await dialog
      .getByRole("combobox", { name: "Papel", exact: true })
      .selectOption("A3");
    await expect(downloadButton).toBeDisabled();
    await expect(dialog).toContainText("Prévia desatualizada");
    await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Exportar desenhos", exact: true }),
    ).toBeFocused();
    expect(JSON.parse(await downloadProject(page))).toEqual(
      JSON.parse(original),
    );
  },
);

test(
  "T-037 informa conteúdo que não cabe, números inválidos e mantém o PDF fiel às novas opções",
  { tag: "@interface" },
  async ({ page }) => {
    await open(page);
    await page.setViewportSize({ width: 900, height: 680 });
    await page
      .getByRole("button", { name: "Exportar desenhos", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Exportar desenhos em PDF",
    });
    await dialog
      .getByRole("combobox", { name: "Conteúdo", exact: true })
      .selectOption("course");
    await dialog
      .getByRole("textbox", { name: "Número da fiada", exact: true })
      .fill("80");
    await expect(
      dialog.getByRole("button", { name: "Gerar PDF", exact: true }),
    ).toBeDisabled();
    await dialog
      .getByRole("textbox", { name: "Número da fiada", exact: true })
      .fill("1");
    await dialog
      .getByRole("combobox", { name: "Escala das fiadas", exact: true })
      .selectOption("10");
    await dialog
      .getByRole("button", { name: "Gerar PDF", exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toContainText("não cabe inteira");
    await expect(
      dialog.getByRole("button", { name: "Baixar PDF", exact: true }),
    ).toBeDisabled();
    await dialog
      .getByRole("combobox", { name: "Papel", exact: true })
      .selectOption("A3");
    await dialog
      .getByRole("combobox", { name: "Orientação", exact: true })
      .selectOption("true");
    await dialog
      .getByRole("combobox", { name: "Escala das fiadas", exact: true })
      .selectOption("25");
    await dialog
      .getByRole("button", { name: "Gerar PDF", exact: true })
      .click();
    await expect(
      dialog.getByRole("button", { name: "Baixar PDF", exact: true }),
    ).toBeEnabled({ timeout: 30000 });
    await page.screenshot({ path: ".tools/t037/preview-900.png" });
    await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
  },
);

test(
  "T-037 exporta os elementos da Planta em PDF e permite somente leitura após falha de salvamento",
  { tag: "@fluxo" },
  async ({ page }) => {
    await open(page, true);
    const original = await downloadProject(page);
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      const { useStore } = await import(path);
      useStore.setState({ readonly: true, saved: "error" });
    });
    await page
      .getByRole("button", { name: "Exportar desenhos", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Exportar desenhos em PDF",
    });
    await dialog
      .getByRole("button", { name: "Gerar PDF", exact: true })
      .click();
    const button = dialog.getByRole("button", {
      name: "Baixar PDF",
      exact: true,
    });
    await expect(button).toBeEnabled({ timeout: 30000 });
    const event = page.waitForEvent("download");
    await button.click();
    const file = await event;
    await file.saveAs(".tools/t037/rich-plan.pdf");
    const pdf = await PDFDocument.load(await readFile((await file.path())!));
    expect(pdf.getPageCount()).toBe(1);
    await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
    expect(JSON.parse(await downloadProject(page))).toEqual(
      JSON.parse(original),
    );
  },
);

test(
  "T-037 descarta geração ultrapassada e recupera falha sem modificar o projeto",
  { tag: "@fluxo" },
  async ({ page }) => {
    await open(page);
    const original = await downloadProject(page);
    await page
      .getByRole("button", { name: "Exportar desenhos", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Exportar desenhos em PDF",
    });
    await page.evaluate(() => {
      const load = document.fonts.load.bind(document.fonts);
      let release: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      document.fonts.load = async (...args) => {
        await gate;
        return load(...args);
      };
      (window as unknown as { releasePdfFonts: () => void }).releasePdfFonts =
        () => {
          document.fonts.load = load;
          release();
        };
    });
    await dialog
      .getByRole("button", { name: "Gerar PDF", exact: true })
      .click();
    await expect(
      dialog.getByRole("button", { name: "Gerando…", exact: true }),
    ).toBeDisabled();
    await dialog
      .getByRole("combobox", { name: "Papel", exact: true })
      .selectOption("A3");
    await page.evaluate(() =>
      (window as unknown as { releasePdfFonts: () => void }).releasePdfFonts(),
    );
    await expect(dialog.getByRole("alert")).toContainText("opções mudaram");
    await expect(
      dialog.getByRole("button", { name: "Baixar PDF", exact: true }),
    ).toBeDisabled();
    await page.evaluate(() => {
      const original = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function (...args) {
        HTMLCanvasElement.prototype.toDataURL = original;
        if (this.width > 2000) throw Error("Falha de geração no ensaio");
        return original.apply(this, args);
      };
    });
    await dialog
      .getByRole("button", { name: "Gerar PDF", exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toContainText(
      "Falha de geração no ensaio",
    );
    await dialog
      .getByRole("button", { name: "Gerar PDF", exact: true })
      .click();
    await expect(
      dialog.getByRole("button", { name: "Baixar PDF", exact: true }),
    ).toBeEnabled({ timeout: 30000 });
    await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
    expect(JSON.parse(await downloadProject(page))).toEqual(
      JSON.parse(original),
    );
  },
);

test(
  "T-037 pagina observações parciais extensas e informa falha de fontes sem omitir recursos",
  { tag: "@fluxo" },
  async ({ page }) => {
    await open(page);
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      const { useStore } = await import(path);
      const doc = useStore.getState().doc!;
      useStore.setState({
        doc: {
          ...doc,
          generationState: {
            status: "current",
            diagnostics: Array.from({ length: 40 }, (_, i) => ({
              floorId: doc.model.floors[0].id,
              code: "fixture-pending",
              severity: "error",
              course: 1,
              wallIds: [doc.model.walls[0].id],
              x: 0,
              y: 0,
              message: `Pendência ${i + 1}: ${"Informação detalhada de conferência do desenho. ".repeat(6)}`,
            })),
          },
        },
      });
      const load = document.fonts.load.bind(document.fonts);
      document.fonts.load = async () => {
        throw Error("Fonte indisponível no ensaio");
      };
      (window as unknown as { restorePdfFonts: () => void }).restorePdfFonts =
        () => {
          document.fonts.load = load;
        };
    });
    await page
      .getByRole("button", { name: "Exportar desenhos", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Exportar desenhos em PDF",
    });
    await dialog
      .getByRole("button", { name: "Gerar PDF", exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toContainText(
      "Fonte indisponível no ensaio",
    );
    await expect(
      dialog.getByRole("button", { name: "Baixar PDF", exact: true }),
    ).toBeDisabled();
    await page.evaluate(() =>
      (window as unknown as { restorePdfFonts: () => void }).restorePdfFonts(),
    );
    await dialog
      .getByRole("button", { name: "Gerar PDF", exact: true })
      .click();
    await expect(
      dialog.getByRole("button", { name: "Baixar PDF", exact: true }),
    ).toBeEnabled({ timeout: 30000 });
    const download = page.waitForEvent("download");
    await dialog
      .getByRole("button", { name: "Baixar PDF", exact: true })
      .click();
    const file = await download;
    await file.saveAs(".tools/t037/observations.pdf");
    const pdf = await PDFDocument.load(await readFile((await file.path())!));
    expect(pdf.getPageCount()).toBeGreaterThan(2);
    for (const p of pdf.getPages()) {
      expect(p.getWidth()).toBeCloseTo((210 * 72) / 25.4, 3);
      expect(p.getHeight()).toBeCloseTo((297 * 72) / 25.4, 3);
    }
  },
);

test(
  "T-037 representa canaletas, grautes, grampos e armaduras da fiada escolhida",
  { tag: "@fluxo" },
  async ({ page }) => {
    await open(page, true, true);
    const current = JSON.parse(await downloadProject(page));
    const floor = current.generated.floors[0];
    expect(
      floor.courses[3].pieces.some(
        (p: { kind: string }) =>
          p.kind === "channel" || p.kind === "half-channel",
      ),
    ).toBe(true);
    expect(floor.grouts.length).toBeGreaterThan(0);
    expect(floor.clamps.length).toBeGreaterThan(0);
    expect(floor.reinforcement.length).toBeGreaterThan(0);
    await page
      .getByRole("button", { name: "Exportar desenhos", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Exportar desenhos em PDF",
    });
    await dialog
      .getByRole("combobox", { name: "Conteúdo", exact: true })
      .selectOption("course");
    await dialog
      .getByRole("textbox", { name: "Número da fiada", exact: true })
      .fill("4");
    await dialog
      .getByRole("button", { name: "Gerar PDF", exact: true })
      .click();
    await expect(
      dialog.getByRole("button", { name: "Baixar PDF", exact: true }),
    ).toBeEnabled({ timeout: 30000 });
    const event = page.waitForEvent("download");
    await dialog
      .getByRole("button", { name: "Baixar PDF", exact: true })
      .click();
    await (await event).saveAs(".tools/t037/reinforced-course.pdf");
  },
);

test(
  "T-037 exige concluir campos do editor que ainda aguardam Aplicar",
  { tag: "@fluxo" },
  async ({ page }) => {
    const fixture = await open(page);
    const original = await downloadProject(page);
    await page
      .getByLabel("Selecionar elemento", { exact: true })
      .selectOption(fixture.model.openings[0].id);
    await page.getByLabel("Largura do vão", { exact: true }).fill("75");
    await page
      .getByRole("button", { name: "Exportar desenhos", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Exportar desenhos em PDF",
    });
    await dialog
      .getByRole("button", { name: "Gerar PDF", exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toContainText("edições pendentes");
    await expect(
      dialog.getByRole("button", { name: "Baixar PDF", exact: true }),
    ).toBeDisabled();
    await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
    expect(JSON.parse(await downloadProject(page))).toEqual(
      JSON.parse(original),
    );
    await page.getByLabel("Largura do vão", { exact: true }).fill("50");
    await page
      .getByRole("button", { name: "Exportar desenhos", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Gerar PDF", exact: true })
      .click();
    await expect(
      dialog.getByRole("button", { name: "Baixar PDF", exact: true }),
    ).toBeEnabled({ timeout: 30000 });
  },
);
