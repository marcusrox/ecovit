import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
  type Project,
} from "../../src/domain/project";
import { generate } from "../../src/domain/composition";
import { putOpening } from "../../src/domain/openings";
import { suppressBand } from "../../src/domain/channels";
const base = { length: 2500, width: 1250, height: 700 };
function fixture(window = false) {
  let d = createProject("Grautes", base);
  d.project.groutSettings = defaultGroutSettings(false);
  d.project.channelLevels = [];
  d.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      { x: 40000, y: 0 },
      1250,
      d.model.floors[0].id,
      28000,
      1,
    )!,
  ];
  if (window)
    d = putOpening(d, {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "window",
      offset: 10000,
      width: 10000,
      base: 9800,
      height: 11200,
    });
  return d;
}
async function load(page: Page, d: unknown) {
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "grautes.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function exported(page: Page): Promise<Project> {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  return JSON.parse(await readFile((await (await pending).path())!, "utf8"));
}
async function course(page: Page, n: number) {
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await page.getByLabel("Número da fiada").fill(String(n));
}
async function screen(page: Page, x: number, y: number) {
  const d = page.getByTestId("drawing"),
    box = (await d.boundingBox())!,
    c = JSON.parse((await d.getAttribute("data-camera"))!);
  return { x: box.x + c.x + x * c.scale, y: box.y + c.y + y * c.scale };
}
async function click(page: Page, x: number, y = 625) {
  const p = await screen(page, x, y);
  await page.mouse.click(p.x, p.y);
}
async function settings(page: Page) {
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
}
async function apply(page: Page) {
  await page.getByRole("button", { name: "Aplicar configurações" }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
}

test("M3.3 configuração cancelar, aplicar, alternativas, restaurar e histórico", async ({
  page,
}) => {
  await load(page, fixture());
  await settings(page);
  await page
    .getByRole("checkbox", { name: "Intervalos em paredes longas" })
    .check();
  await page
    .getByLabel("Distância máxima de graute", { exact: true })
    .fill("12");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  expect((await exported(page)).project.groutSettings).toEqual(
    defaultGroutSettings(false),
  );
  await settings(page);
  await page
    .getByRole("checkbox", { name: "Intervalos em paredes longas" })
    .check();
  await page
    .getByLabel("Distância máxima de graute", { exact: true })
    .fill("12");
  await page.getByRole("button", { name: "Aplicar configurações" }).click();
  await page.getByRole("button", { name: /12,5 cm \(diferença/ }).click();
  await apply(page);
  expect((await exported(page)).project.groutSettings.distance).toBe(1250);
  await settings(page);
  await page
    .getByRole("button", { name: "Restaurar padrões de graute" })
    .click();
  await page
    .getByRole("heading", { name: "Graute vertical", exact: true })
    .last()
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: ".tools/m33-settings.png" });
  await apply(page);
  expect((await exported(page)).project.groutSettings).toEqual(
    defaultGroutSettings(),
  );
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).project.groutSettings.distance).toBe(1250);
});
test("M3.3 EX-32 exclusão persistente sem compensação, teclado e transporte", async ({
  page,
}) => {
  const d = fixture();
  d.project.groutSettings.intervals = true;
  await load(page, d);
  await course(page, 1);
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  expect(
    (await exported(page)).generated!.grouts!.map((a) => a.x + 625),
  ).toEqual([10625, 20625, 30625]);
  await click(page, 20625);
  const excluded = await exported(page);
  expect(excluded.generated!.grouts!.map((a) => a.x + 625)).toEqual([
    10625, 30625,
  ]);
  await page.reload();
  await page.getByRole("button", { name: /Grautes.*cópia/ }).click();
  await course(page, 1);
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  await page.getByLabel("Selecionar furo de graute").selectOption("20000:0");
  await page
    .getByRole("button", { name: "Adicionar graute", exact: true })
    .click();
  expect((await exported(page)).adjustments.grout[0].id).toBe(
    excluded.adjustments.grout[0].id,
  );
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect(
    (await exported(page)).generated!.grouts!.map((a) => a.x + 625),
  ).toEqual([10625, 30625]);
  await load(page, excluded);
  expect((await exported(page)).adjustments.grout).toEqual(
    excluded.adjustments.grout,
  );
  await settings(page);
  await page
    .getByRole("button", { name: "Restaurar padrões de graute" })
    .click();
  await apply(page);
  const restored = await exported(page);
  expect(restored.adjustments.grout).toEqual(excluded.adjustments.grout);
  expect(restored.generated!.grouts!.some((a) => a.x === 20000)).toBe(false);
});
test("M3.3 EX-33 incluir e remover todos intervalos, vazio sem alvo e canaleta preservada", async ({
  page,
}) => {
  await load(page, fixture(true));
  await course(page, 10);
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  await click(page, 10625);
  let d = await exported(page);
  expect(d.generated!.grouts![0].intervals).toEqual([
    { bottom: 0, top: 9800 },
    { bottom: 21000, top: 28000 },
  ]);
  await course(page, 20);
  await click(page, 10625);
  expect((await exported(page)).adjustments.grout).toEqual(d.adjustments.grout);
  await expect(
    page.getByRole("button", { name: "Adicionar graute", exact: true }),
  ).toHaveCount(0);
  await course(page, 31);
  await page.getByLabel("Selecionar furo de graute").selectOption("10000:0");
  await page.screenshot({ path: ".tools/m33-window-channel.png" });
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  await click(page, 15000);
  await page
    .getByRole("button", { name: "Remover faixa de canaleta", exact: true })
    .click();
  expect((await exported(page)).generated!.grouts).toEqual(d.generated!.grouts);
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  await course(page, 35);
  await click(page, 10625);
  d = await exported(page);
  expect(d.generated!.grouts).toEqual([]);
});
test("M3.3 cancelamentos, navegação e referência não alteram graute", async ({
  page,
}) => {
  const d = fixture();
  d.model.walls[0].height = 700;
  await load(page, d);
  await course(page, 1);
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  const p = await screen(page, 10625, 625);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.keyboard.press("Escape");
  await page.mouse.up();
  expect((await exported(page)).adjustments.grout).toEqual([]);
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(5, 300);
  await page.mouse.up();
  expect((await exported(page)).adjustments.grout).toEqual([]);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(p.x + 25, p.y + 20);
  await page.mouse.up({ button: "middle" });
  expect((await exported(page)).adjustments.grout).toEqual([]);
  const tall = fixture();
  tall.model.walls[0].height = 1400;
  await load(page, tall);
  await course(page, 2);
  await page.getByLabel("Fiada de referência").selectOption("previous");
  // The second wall appears solely in the reference course.
  const withShort = fixture();
  withShort.model.walls[0].height = 1400;
  withShort.model.walls.push(
    makeWall(
      { x: 0, y: 5000 },
      { x: 40000, y: 5000 },
      1250,
      withShort.model.floors[0].id,
      700,
      1,
    )!,
  );
  await load(page, withShort);
  await course(page, 2);
  await page.getByLabel("Fiada de referência").selectOption("previous");
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  await click(page, 10625, 5625);
  expect((await exported(page)).adjustments.grout).toEqual([]);
  await page
    .getByRole("button", { name: "Selecionar", exact: false })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Graute", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});
test("M3.3 diagnósticos de eixo e distância, correção e descarte", async ({
  page,
}) => {
  await load(page, fixture());
  await course(page, 1);
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  await click(page, 30625);
  const before = await exported(page);
  await page.getByRole("button", { name: "Planta", exact: true }).click();
  await click(page, 30000);
  await page.getByLabel("Comprimento", { exact: true }).fill("200");
  await page.getByLabel("Comprimento", { exact: true }).press("Enter");
  const after = await exported(page);
  expect(after.adjustments.grout).toEqual(before.adjustments.grout);
  expect(after.generated!.grouts).toEqual([]);
  expect(
    after.generated!.diagnostics.some(
      (d) => d.code === "grout-adjustment-target-missing",
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Diagnósticos (1)", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Diagnósticos do projeto" }),
  ).toContainText("Descartar ajuste de graute");
  await page.getByRole("button", { name: "Fechar diagnósticos" }).click();
  await course(page, 1);
  await page.getByText("Ajustes de graute (1)", { exact: true }).click();
  await page
    .getByRole("button", { name: "Descartar ajuste de graute", exact: true })
    .click();
  expect((await exported(page)).adjustments.grout).toEqual([]);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).generated!.grouts).toEqual(
    before.generated!.grouts,
  );
  const invalid = fixture();
  invalid.project.groutSettings = {
    ...defaultGroutSettings(false),
    intervals: true,
    distance: 1200,
  };
  await load(page, invalid);
  await page
    .getByRole("button", { name: "Diagnósticos (1)", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Diagnósticos do projeto" }),
  ).toContainText("Entrada incompatível");
  await page
    .getByRole("button", { name: "Editar configurações de graute" })
    .click();
  await expect(
    page.getByLabel("Distância máxima de graute", { exact: true }),
  ).toHaveValue("12");
  await page
    .getByLabel("Distância máxima de graute", { exact: true })
    .fill("12,5");
  await apply(page);
  expect((await exported(page)).generated!.diagnostics).toEqual([]);
});
test("M3.3 legado M3.2 validado e adulterado recusado antes de migrar", async ({
  page,
}) => {
  let d = fixture(true);
  d.project.channelLevels = [{ id: crypto.randomUUID(), top: 11200 }];
  d = suppressBand(d, d.model.walls[0].id, 11200);
  const { groutSettings: _settings, ...project } = d.project;
  void _settings;
  const g = generate(d, "nominal-v5"),
    old = {
      ...d,
      schemaVersion: 4,
      adjustments: {
        ...d.adjustments,
        channels: d.adjustments.channels.map(({ scope: _scope, ...a }) => {
          void _scope;
          return a;
        }),
      },
      project,
      generated: g,
      generationState: { status: "current", diagnostics: g.diagnostics },
    };
  await load(page, old);
  const before = await exported(page);
  expect(before.schemaVersion).toBe(6);
  expect(before.generated!.convention).toBe("nominal-v7");
  expect(before.project.groutSettings).toEqual(defaultGroutSettings(false));
  expect(before.generated!.grouts).toEqual([]);
  expect(before.adjustments.channels).toEqual(d.adjustments.channels);
  const bad = structuredClone(old);
  bad.generated.channels![0].cells[0].origins = ["adulterado"];
  await page.getByTestId("import-file").setInputFiles({
    name: "adulterado.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(bad)),
  });
  await expect(page.getByRole("alert")).toContainText("inconsistente");
  expect(await exported(page)).toEqual(before);
});
test("M3.3 falha de armazenamento preserva download e recuperação", async ({
  page,
}) => {
  await load(page, fixture());
  await course(page, 1);
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    (window as unknown as { restorePut: () => void }).restorePut = () => {
      IDBObjectStore.prototype.put = original;
    };
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("simulada", "QuotaExceededError");
    };
  });
  await click(page, 10625);
  await expect(page.getByRole("status")).toContainText("Não salvo");
  const d = await exported(page);
  expect(d.generated!.grouts).toHaveLength(1);
  expect(d.adjustments.grout).toHaveLength(1);
  expect(d.generationState.status).toBe("current");
  await page.evaluate(() => {
    (window as unknown as { restorePut: () => void }).restorePut();
  });
  await page
    .getByRole("button", { name: "Tentar salvar", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await exported(page)).adjustments.grout).toEqual(d.adjustments.grout);
});
test("M3.3 carga 100 janelas com posições e intervalos independentes", async ({
  page,
}, info) => {
  const d = createProject("Carga grautes", base);
  d.project.groutSettings = { ...defaultGroutSettings(false), intervals: true };
  for (let i = 0; i < 100; i++) {
    const w = makeWall(
      { x: 0, y: i * 3750 },
      { x: 25000, y: i * 3750 },
      1250,
      d.model.floors[0].id,
      28000,
      1,
    )!;
    d.model.walls.push(w);
    d.model.openings.push({
      id: crypto.randomUUID(),
      wallId: w.id,
      kind: "window",
      offset: 10000,
      width: 10000,
      base: 9800,
      height: 11200,
    });
  }
  const start = Date.now();
  await load(page, d);
  const elapsed = Date.now() - start,
    r = await exported(page);
  expect(r.generated!.grouts).toHaveLength(200);
  expect(r.generated!.grouts!.flatMap((a) => a.intervals)).toHaveLength(300);
  expect(r.generated!.grouts!.slice(0, 2).map((a) => a.x + 625)).toEqual([
    10625, 20625,
  ]);
  expect(r.generated!.diagnostics).toEqual([]);
  expect(r.generated!.grouts![0].intervals).toEqual([
    { bottom: 0, top: 9800 },
    { bottom: 21000, top: 28000 },
  ]);
  await course(page, 14);
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  await page.screenshot({ path: `.tools/m33-load-${info.project.name}.png` });
  console.log(
    `M3.3 carga ${info.project.name}: 100 janelas, 200 eixos, 300 intervalos em ${elapsed} ms (abertura, importação, geração e salvamento).`,
  );
});
