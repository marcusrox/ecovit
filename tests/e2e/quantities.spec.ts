import { remoteSnapshot, rejectSaves } from "./auth";
import { blockEditing } from "./auth";
import { test, expect, type Page } from "./auth";
import { readFile } from "node:fs/promises";
import {
  createProject,
  makeWall,
  defaultGroutSettings,
  type Project,
} from "../../src/domain/project";
import { addFloor } from "../../src/domain/floors";

function fixture() {
  let d = createProject(
    "Quantitativos M5",
    { length: 2500, width: 1250, height: 700 },
    2100,
  );
  d.project.channelLevels = [];
  d.project.groutSettings = defaultGroutSettings(false);
  const f = d.model.floors[0].id;
  d = addFloor(d, { name: "Mesmo", level: 28000, defaultHeight: 2100 });
  d = addFloor(d, { name: "Mesmo", level: -2100, defaultHeight: 2100 });
  d = addFloor(d, { name: "Mesmo", level: 35000, defaultHeight: 2100 });
  d.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 10000, y: 0 }, 1250, f, 2100, 1)!,
  ];
  d.model.slabs = [
    {
      id: crypto.randomUUID(),
      floorId: d.model.floors[3].id,
      thickness: 2100,
      contour: [
        { x: 0, y: 0 },
        { x: 5000, y: 0 },
        { x: 5000, y: 5000 },
        { x: 0, y: 5000 },
      ],
      openings: [],
    },
  ];
  return d;
}
async function load(page: Page, d = fixture()) {
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "m5.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo", {
    timeout: 60000,
  });
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(d.model.walls[0]?.floorId ?? d.model.floors[0].id);
  return d;
}
async function exported(page: Page): Promise<Project> {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  return JSON.parse(await readFile((await (await download).path())!, "utf8"));
}
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const { useStore } = await import(/* @vite-ignore */ path);
    const s = useStore.getState();
    return JSON.stringify({
      doc: s.doc,
      history: s.history,
      active: s.activeFloorId,
      mode: s.mode,
      course: s.course,
      select: s.select,
      reference: s.floorReference,
      saved: s.saved,
    });
  });
}
const report = (page: Page) =>
  page.getByRole("dialog", { name: "Orçamento", exact: true });
const summary = (page: Page) =>
  report(page).getByRole("region", { name: "Resumo do projeto" });

test(
  "M5 A01/03/05/06/10: consulta sem escrita, perdas persistidas e contexto preservado",
  { tag: "@fluxo" },
  async ({ page }) => {
    const d = await load(page);
    await page.getByRole("button", { name: "Fiada", exact: true }).click();
    const before = await snapshot(page),
      camera = await page.getByTestId("drawing").getAttribute("data-camera"),
      document = await exported(page);
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(
      summary(page).getByRole("row", { name: /^Inteiro 11 0 11(?:\s|$)/ }),
    ).toBeVisible();
    await expect(
      summary(page).getByRole("row", {
        name: /^Total de peças 13 0 13(?:\s|$)/,
      }),
    ).toBeVisible();
    expect(await snapshot(page)).toBe(before);
    await report(page).getByLabel("Perdas de tijolos (%)").fill("10");
    await expect(
      summary(page).getByRole("row", { name: /^Inteiro 11 2 13(?:\s|$)/ }),
    ).toBeVisible();
    await expect(
      summary(page).getByRole("row", {
        name: /^Total de peças 13 3 16(?:\s|$)/,
      }),
    ).toBeVisible();
    await report(page).getByLabel("Perdas de tijolos (%)").press("Enter");
    await report(page)
      .getByLabel("Pavimento da consulta")
      .selectOption(d.model.floors[0].id);
    await expect(
      report(page).getByText(
        "Este pavimento não tem fiadas. Quantidades zero.",
      ),
    ).toBeVisible();
    await expect(report(page).getByRole("status")).toContainText("Salvo");
    const afterTen = await snapshot(page);
    expect(JSON.parse(afterTen).doc.project.brickLossPercent).toBe(1000);
    await report(page).getByLabel("Perdas de tijolos (%)").fill("-1");
    await expect(report(page).getByRole("alert")).toContainText("não negativo");
    await expect(
      summary(page).getByRole("row", { name: /^Inteiro 11 — —(?:\s|$)/ }),
    ).toBeVisible();
    expect(await snapshot(page)).toBe(afterTen);
    await report(page).getByLabel("Perdas de tijolos (%)").fill("2,50");
    await report(page)
      .getByRole("heading", { name: "Orçamento preliminar", exact: true })
      .focus();
    await expect(report(page).getByRole("status")).toContainText("Salvo");
    const confirmed = await snapshot(page);
    expect(JSON.parse(confirmed).doc.project.brickLossPercent).toBe(250);
    expect(JSON.parse(confirmed).history.past).toHaveLength(
      JSON.parse(before).history.past.length + 2,
    );
    expect(JSON.parse(confirmed).doc.generated).toEqual(document.generated);
    expect(JSON.parse(confirmed).doc.model).toEqual(document.model);
    await page.keyboard.press("Control+z");
    await page.keyboard.press("Delete");
    expect(await snapshot(page)).toBe(confirmed);
    await report(page)
      .getByRole("button", { name: "Voltar ao desenho" })
      .click();
    await expect(
      page.getByRole("button", { name: "Orçamento", exact: true }),
    ).toBeFocused();
    expect(await page.getByTestId("drawing").getAttribute("data-camera")).toBe(
      camera,
    );
    const persisted = await exported(page);
    expect(persisted.project).toEqual({
      ...document.project,
      brickLossPercent: 250,
    });
    expect(persisted.model).toEqual(document.model);
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(report(page).getByLabel("Perdas de tijolos (%)")).toHaveValue(
      "2,50",
    );
    await page.keyboard.press("Escape");
    await expect(report(page)).not.toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: /Quantitativos M5/ }).click();
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(report(page).getByLabel("Perdas de tijolos (%)")).toHaveValue(
      "2,50",
    );
  },
);

test(
  "M5 A06: cancela contorno fechado sem confirmar nem deixar prévia ao voltar",
  { tag: "@fluxo" },
  async ({ page }) => {
    await load(page);
    const before = await exported(page);
    await page.getByRole("button", { name: "Laje", exact: true }).click();
    const host = page.getByTestId("drawing"),
      box = (await host.boundingBox())!,
      camera = JSON.parse((await host.getAttribute("data-camera"))!);
    await page.getByLabel("Espessura inicial da laje (cm)").fill("21");
    for (const [x, y] of [
      [0, 0],
      [8, 0],
      [8, 8],
      [0, 8],
    ])
      await page.mouse.click(
        box.x + camera.x + x * 1250 * camera.scale,
        box.y + camera.y + y * 1250 * camera.scale,
      );
    await page
      .getByRole("button", { name: "Fechar contorno", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Confirmar contorno", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await report(page)
      .getByRole("button", { name: "Voltar ao desenho" })
      .click();
    await expect(page.getByLabel("Desenho de laje")).toHaveCount(0);
    expect(await exported(page)).toEqual(before);
    await expect(
      page.getByRole("button", { name: "Desfazer", exact: true }),
    ).toBeDisabled();
  },
);

test(
  "M5 A07/08: cancelar, duplicar último salvo com origem bloqueada e editar cópia independente",
  { tag: "@fluxo" },
  async ({ page, context }) => {
    await load(page);
    const source = await exported(page);
    const second = await context.newPage();
    await second.goto("/");
    await second.getByRole("button", { name: "Duplicar", exact: true }).click();
    await expect(second.getByRole("dialog")).toContainText(
      "último estado salvo",
    );
    await second.keyboard.press("Escape");
    await expect(second.getByRole("dialog")).toHaveCount(0);
    await second.getByRole("button", { name: "Duplicar", exact: true }).click();
    await second.getByLabel("Nome da cópia").fill("Minha cópia M5");
    await second
      .getByRole("button", { name: "Duplicar projeto", exact: true })
      .click();
    await expect(second.getByRole("dialog")).toHaveCount(0);
    await expect(
      second.getByRole("button", { name: "Duplicar", exact: true }),
    ).toHaveCount(2);
    await second
      .getByRole("button", { name: /Minha cópia M5.*parede/ })
      .click();
    const copy = await exported(second);
    expect(copy.project.id).not.toBe(source.project.id);
    expect(copy.model).toEqual(source.model);
    expect(copy.adjustments).toEqual(source.adjustments);
    expect(copy.generated).toEqual(source.generated);
    await expect(second.getByRole("status")).toContainText("Salvo");
    await second
      .getByLabel("Nome do projeto", { exact: true })
      .fill("Cópia editada");
    await second.getByLabel("Nome do projeto", { exact: true }).press("Tab");
    await expect(second.getByRole("status")).toContainText("Salvo");
    expect(await exported(page)).toEqual(source);
    await second.getByRole("button", { name: "Projetos", exact: true }).click();
    await second
      .getByRole("button", { name: /Quantitativos M5.*parede/ })
      .click();
    await blockEditing(second);
    await second
      .getByRole("button", { name: "Orçamento", exact: true })
      .click();
    await expect(
      summary(second).getByRole("row", {
        name: /^Total de peças 13 0 13(?:\s|$)/,
      }),
    ).toBeVisible();
  },
);

test(
  "M5 A04: parcial e diagnóstico; ausente/busy não exibem números antigos",
  { tag: "@fluxo" },
  async ({ page }) => {
    const d = fixture(),
      f = d.model.walls[0].floorId;
    const w = makeWall(
      { x: 20000, y: 0 },
      { x: 30000, y: 0 },
      1250,
      f,
      2100,
      1,
    )!;
    d.model.walls.push(w, { ...w, id: crypto.randomUUID() });
    await load(page, d);
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(
      report(page).getByText("Parcial — há pendências", { exact: true }),
    ).toBeVisible();
    await expect(
      summary(page).getByRole("row", {
        name: /^Total de peças 13 0 13(?:\s|$)/,
      }),
    ).toBeVisible();
    await report(page)
      .getByRole("button", { name: "Ver diagnósticos" })
      .click();
    await expect(report(page)).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Localizar", exact: true }).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      const { useStore } = await import(path);
      useStore.setState({ busy: true });
    });
    await expect(report(page).getByRole("alert")).toContainText("andamento");
    await expect(
      summary(page).locator("tbody tr").first().locator("td"),
    ).toHaveText(["—", "—", "—", "", "—"]);
    await page.keyboard.press("Escape");
    await expect(report(page)).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Orçamento", exact: true }),
    ).toBeDisabled();
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      const { useStore } = await import(path);
      useStore.setState({ busy: false });
    });
    await expect(
      page.getByRole("button", { name: "Orçamento", exact: true }),
    ).toBeFocused();
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      const { useStore } = await import(path);
      const s = useStore.getState();
      useStore.setState({
        busy: false,
        doc: {
          ...s.doc,
          generated: null,
          generationState: { status: "outdated", diagnostics: [] },
        },
      });
    });
    await expect(report(page).getByRole("alert")).toContainText("indisponível");
    await expect(
      summary(page).locator("tbody tr").first().locator("td"),
    ).toHaveText(["—", "—", "—", "", "—"]);
  },
);

test(
  "M5 A12: nomes máximos, tabelas/foco/ícones em três resoluções",
  { tag: "@interface" },
  async ({ page }, info) => {
    const d = fixture();
    d.project.name = "P".repeat(100);
    for (const f of d.model.floors) f.name = "A".repeat(100);
    await load(page, d);
    for (const [width, height] of [
      [1366, 768],
      [1280, 720],
      [900, 680],
    ]) {
      await page.setViewportSize({ width, height });
      await page
        .getByRole("button", { name: "Orçamento", exact: true })
        .click();
      await expect(
        report(page).getByRole("heading", {
          name: "Orçamento preliminar",
          exact: true,
        }),
      ).toBeFocused();
      expect(
        await report(page).evaluate((e) => e.scrollWidth <= e.clientWidth),
      ).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(summary(page)).toBeVisible();
      await page.screenshot({
        path: `.tools/m5-${info.project.name}-${width}.png`,
      });
      await page.keyboard.press("Tab");
      await expect(
        report(page).getByRole("button", { name: "Voltar ao desenho" }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(report(page)).not.toBeVisible();
    }
    await page.getByRole("button", { name: "Projetos", exact: true }).click();
    await page.getByRole("button", { name: "Duplicar", exact: true }).click();
    const copyDialog = page.getByRole("dialog", {
      name: "Duplicar projeto",
      exact: true,
    });
    await expect(copyDialog.getByLabel("Nome da cópia")).toHaveAttribute(
      "maxlength",
      "100",
    );
    expect(
      (await copyDialog.getByLabel("Nome da cópia").inputValue()).length,
    ).toBe(100);
    for (const [width, height] of [
      [1366, 768],
      [1280, 720],
      [900, 680],
    ]) {
      await page.setViewportSize({ width, height });
      expect(
        await copyDialog.evaluate((e) => e.scrollWidth <= e.clientWidth),
      ).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `.tools/m5-copy-${info.project.name}-${width}.png`,
      });
    }
    await page.keyboard.press("Escape");
    await expect(copyDialog).toHaveCount(0);
  },
);

test(
  "M5 A12: carga de quatro pavimentos e 110 mil peças",
  { tag: "@carga" },
  async ({ page }, info) => {
    test.setTimeout(120000);
    let d = createProject("Carga M5", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    d.project.channelLevels = [];
    d.project.groutSettings = defaultGroutSettings(false);
    for (const level of [42000, 84000, 126000])
      d = addFloor(d, { name: "Carga", level, defaultHeight: 35000 });
    for (const f of d.model.floors)
      for (let i = 0; i < 100; i++)
        d.model.walls.push(
          makeWall(
            { x: 0, y: i * 3750 },
            { x: 12500, y: i * 3750 },
            1250,
            f.id,
            35000,
            1,
          )!,
        );
    await load(page, d);
    const start = Date.now();
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(
      summary(page).getByRole("row", {
        name: /^Total de peças 110\.000 0 110\.000(?:\s|$)/,
      }),
    ).toBeVisible();
    console.log(
      `M5 carga ${info.project.name}: consulta 110.000 peças em ${Date.now() - start} ms`,
    );
  },
);

test(
  "revisão M5: abrir consulta durante renomeação confirma nome e abre no mesmo clique",
  { tag: "@fluxo" },
  async ({ page }) => {
    await load(page);
    await page
      .getByLabel("Nome do projeto", { exact: true })
      .fill("Nome confirmado M5");
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(report(page)).toBeVisible();
    await expect(report(page)).toContainText("Nome confirmado M5");
    await report(page)
      .getByRole("button", { name: "Voltar ao desenho" })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await expect(
      page.getByRole("button", { name: "Orçamento", exact: true }),
    ).toBeFocused();
    expect((await exported(page)).project.name).toBe("Nome confirmado M5");
  },
);

test(
  "revisão M5: falha remota preserva intenção e impede quantitativo desatualizado; retry calcula",
  { tag: "@fluxo" },
  async ({ page }) => {
    await load(page);
    const disk = await remoteSnapshot(page);
    await rejectSaves(page);
    await page.evaluate(async () => {
      const file = "/src/state/store.ts";
      const { useStore } = await import(file);
      const candidate = structuredClone(useStore.getState().doc);
      candidate.model.walls[0].height = 700;
      await useStore.getState().commit(candidate);
    });
    await expect(page.getByRole("status")).toHaveText("Não salvo");
    const memory = await snapshot(page);
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(report(page)).toContainText(
      /desatualizado|Recalcular|recalcule/i,
    );
    await expect(
      summary(page).getByRole("row", {
        name: /^Total de peças 4 0 4(?:\s|$)/,
      }),
    ).toHaveCount(0);
    await report(page)
      .getByRole("button", { name: "Voltar ao desenho" })
      .click();
    expect(await snapshot(page)).toBe(memory);
    expect(await remoteSnapshot(page)).toBe(disk);
    const candidate = await exported(page);
    expect(candidate.model.walls[0].height).toBe(700);
    expect(candidate.generated).toBeNull();
    await page.evaluate(() =>
      (window as unknown as { restorePut: () => void }).restorePut(),
    );
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText("Salvo");
    const confirmed = await snapshot(page);
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(
      summary(page).getByRole("row", {
        name: /^Total de peças 4 0 4(?:\s|$)/,
      }),
    ).toBeVisible();
    await report(page).getByLabel("Perdas de tijolos (%)").fill("10");
    await expect(
      summary(page).getByRole("row", {
        name: /^Total de peças 4 1 5(?:\s|$)/,
      }),
    ).toBeVisible();
    await report(page)
      .getByRole("button", { name: "Voltar ao desenho" })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    const afterLoss = JSON.parse(await snapshot(page)),
      previous = JSON.parse(confirmed);
    expect(afterLoss.doc.project.brickLossPercent).toBe(1000);
    expect(afterLoss.doc.model).toEqual(previous.doc.model);
    expect(afterLoss.doc.generated).toEqual(previous.doc.generated);
    expect(afterLoss.history.past).toHaveLength(
      previous.history.past.length + 1,
    );
  },
);

test(
  "Orçamento documento: Todos reúne pavimentos sem rolagens internas",
  { tag: "@interface" },
  async ({ page }) => {
    const d = fixture();
    const first = d.model.floors.find(
      (f) => f.id === d.model.walls[0].floorId,
    )!;
    const second = d.model.floors.find((f) => f.id !== first.id)!;
    first.name = "Térreo";
    second.name = "Superior";
    d.model.walls.push(
      makeWall({ x: 0, y: 0 }, { x: 10000, y: 0 }, 1250, second.id, 2100, 1)!,
    );
    await load(page, d);
    const before = await snapshot(page);
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    const modal = report(page);
    expect(
      await page.evaluate(async () => {
        const faces = await Promise.all([
          document.fonts.load('400 13px "IBM Plex Sans"', "Áreas Orçamento"),
          document.fonts.load('400 12px "IBM Plex Mono"', "1.234,56"),
          document.fonts.load('500 22px "IBM Plex Mono"', "1.234,56"),
        ]);
        return faces.every(
          (group) =>
            group.length > 0 && group.every((face) => face.status === "loaded"),
        );
      }),
    ).toBe(true);
    const filter = modal.getByLabel("Pavimento da consulta");
    await filter.selectOption("all");
    const courses = modal.getByRole("region", { name: "Peças por fiada" });
    await expect(
      courses.getByRole("columnheader", { name: "Pavimento", exact: true }),
    ).toBeVisible();
    await expect(courses.locator("tbody tr")).toHaveCount(6);
    await expect(
      courses.locator("tbody tr th").filter({ hasText: "Térreo" }),
    ).toHaveCount(3);
    await expect(
      courses.locator("tbody tr th").filter({ hasText: "Superior" }),
    ).toHaveCount(3);
    await expect(courses.locator("tfoot td")).toHaveText([
      "22",
      "4",
      "0",
      "0",
      "26",
    ]);
    await expect(
      modal.getByRole("region", { name: "Ferragens do pavimento consultado" }),
    ).toHaveCount(4);
    await expect(
      summary(page).locator("tbody tr").last().locator("td").first(),
    ).toHaveText("26");
    for (const width of [1366, 900]) {
      await page.setViewportSize({ width, height: 768 });
      await modal.evaluate((element) => {
        element.scrollTop = 0;
      });
      expect(
        await modal.evaluate((element) => {
          const tables = [...element.querySelectorAll('[role="region"]')];
          return (
            element.scrollWidth <= element.clientWidth &&
            tables.every(
              (table) =>
                table.scrollHeight <= table.clientHeight &&
                table.scrollWidth <= table.clientWidth &&
                getComputedStyle(table).overflowY === "visible",
            )
          );
        }),
      ).toBe(true);
      await page.screenshot({
        path: `.tools/budget-document-${width}.png`,
        fullPage: true,
      });
    }
    await modal.getByLabel("Totais dos materiais").scrollIntoViewIfNeeded();
    await page.screenshot({ path: ".tools/budget-report-totals-900.png" });
    const floatingReturn = modal.getByRole("button", {
      name: "Voltar ao desenho",
    });
    const closeBefore = await floatingReturn.boundingBox();
    await courses.scrollIntoViewIfNeeded();
    const closeAfter = await floatingReturn.boundingBox();
    expect(closeBefore).not.toBeNull();
    expect(closeAfter).not.toBeNull();
    expect(Math.abs(closeAfter!.y - closeBefore!.y)).toBeLessThanOrEqual(1);
    expect(closeAfter!.x + closeAfter!.width).toBeLessThan(900);
    await expect(floatingReturn).toBeVisible();
    await page.screenshot({ path: ".tools/budget-report-courses-900.png" });
    await filter.selectOption(second.id);
    await expect(courses.locator("tbody tr")).toHaveCount(3);
    await expect(courses.locator("tfoot td")).toHaveText([
      "11",
      "2",
      "0",
      "0",
      "13",
    ]);
    await expect(
      modal.getByRole("region", { name: "Ferragens do pavimento consultado" }),
    ).toHaveCount(1);
    await expect(
      summary(page).locator("tbody tr").last().locator("td").first(),
    ).toHaveText("26");
    expect(await snapshot(page)).toBe(before);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Orçamento", exact: true }),
    ).toBeFocused();
  },
);

test(
  "Perdas persistidas: falha, recuperação, zero, arquivo e bloqueios",
  { tag: "@fluxo" },
  async ({ page }) => {
    const d = createProject(
      "Perdas persistidas",
      { length: 3000, width: 1500, height: 700 },
      2100,
    );
    d.project.channelLevels = [];
    d.project.groutSettings = defaultGroutSettings(false);
    d.model.walls = [
      makeWall(
        { x: 0, y: 0 },
        { x: 12000, y: 0 },
        1500,
        d.model.floors[0].id,
        2100,
        1,
      )!,
    ];
    await load(page, d);
    const baseline = JSON.parse(await snapshot(page)),
      disk = await remoteSnapshot(page);
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(
      report(page).getByRole("heading", {
        name: "Orçamento preliminar",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      report(page).getByText("Tijolo base: 30 × 15 × 7 cm", { exact: true }),
    ).toBeVisible();
    const loss = report(page).getByLabel("Perdas de tijolos (%)", {
      exact: true,
    });
    await rejectSaves(page);
    await loss.fill("12,50");
    await loss.press("Enter");
    await expect(report(page).getByRole("status")).toContainText("Não salvo");
    await expect(loss).toBeDisabled();
    const memory = JSON.parse(await snapshot(page));
    expect(memory.doc.project.brickLossPercent).toBe(1250);
    expect(memory.doc.generated).toEqual(baseline.doc.generated);
    expect(memory.doc.generationState).toEqual(baseline.doc.generationState);
    expect(await remoteSnapshot(page)).toBe(disk);
    await report(page)
      .getByRole("button", { name: "Voltar ao desenho" })
      .click();
    await page.evaluate(() =>
      (window as unknown as { restorePut: () => void }).restorePut(),
    );
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText("Salvo");
    const file = await exported(page);
    expect(file.project.brickLossPercent).toBe(1250);
    await page.getByRole("button", { name: "Projetos", exact: true }).click();
    await load(page, file);
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(loss).toHaveValue("12,50");
    await loss.fill("0");
    await loss.press("Tab");
    await expect(report(page).getByRole("status")).toContainText("Salvo");
    const zero = await snapshot(page);
    expect(JSON.parse(zero).doc.project.brickLossPercent).toBe(0);
    await loss.fill("0");
    await loss.press("Enter");
    expect(await snapshot(page)).toBe(zero);
    await loss.fill("x");
    await loss.press("Enter");
    await expect(loss).toHaveAttribute("aria-invalid", "true");
    expect(await snapshot(page)).toBe(zero);
    await loss.fill("0");
    await loss.press("Enter");
    await report(page)
      .getByRole("button", { name: "Voltar ao desenho" })
      .click();
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      (await import(/* @vite-ignore */ path)).useStore.setState({
        readonly: true,
      });
    });
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    await expect(loss).toBeDisabled();
  },
);
