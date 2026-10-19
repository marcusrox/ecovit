import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  createProject,
  makeWall,
  type Project,
  type Opening,
} from "../../src/domain/project";
async function point(page: Page, x: number, y: number) {
  const el = page.getByTestId("drawing"),
    b = (await el.boundingBox())!,
    c = JSON.parse((await el.getAttribute("data-camera"))!);
  return { x: b.x + c.x + x * c.scale, y: b.y + c.y + y * c.scale };
}
async function drag(page: Page, a: [number, number], b: [number, number]) {
  const p = await point(page, ...a),
    q = await point(page, ...b);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(q.x, q.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function click(page: Page, x: number, y: number) {
  const p = await point(page, x, y);
  await page.mouse.click(p.x, p.y);
}
async function exported(page: Page) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  return JSON.parse(
    await readFile((await (await pending).path())!, "utf8"),
  ) as Project;
}
function fixture() {
  const d = createProject("M3.1", { length: 2500, width: 1250, height: 700 });
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
  return d;
}
test("M3.1 carga com 100 portas e 40 fiadas preserva contagem", async ({
  page,
}, info) => {
  const d = fixture();
  d.model.walls = [];
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
      kind: "door",
      offset: 6250,
      width: 10000,
      base: 0,
      height: 21700,
    });
  }
  const start = Date.now();
  await load(page, d);
  const elapsed = Date.now() - start;
  const result = await exported(page);
  expect(
    result.generated!.floors[0].courses.reduce(
      (sum, c) => sum + c.pieces.length,
      0,
    ),
  ).toBe(31200);
  expect(
    result.generated!.diagnostics.filter((d) => d.severity === "error"),
  ).toEqual([]);
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await page.getByLabel("Número da fiada").fill("32");
  console.log(
    `M3.1 carga ${info.project.name}: 100 portas, 40 fiadas, 31.200 peças em ${elapsed} ms (importação, geração e salvamento, incluindo abertura da página).`,
  );
});
function opening(
  d: Project,
  base = 0,
  height = 10500,
  kind: Opening["kind"] = "opening",
): Opening {
  return {
    id: crypto.randomUUID(),
    wallId: d.model.walls[0].id,
    kind,
    offset: 10000,
    width: 10000,
    base,
    height,
  };
}
async function load(page: Page, d = fixture()) {
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "m3.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  return d;
}
test("M3.1 três tipos, corpo, duas alças, campos, excluir/desfazer e transporte", async ({
  page,
  browser,
}) => {
  await load(page);
  await page.getByRole("button", { name: "Porta", exact: true }).click();
  await drag(page, [10000, 625], [20000, 625]);
  await page.getByRole("button", { name: "Janela", exact: true }).click();
  await drag(page, [25000, 625], [35000, 625]);
  await page.getByRole("button", { name: "Vão", exact: true }).click();
  await drag(page, [2500, 625], [7500, 625]);
  const initial = await exported(page);
  expect(initial.model.openings.map((o) => o.kind)).toEqual([
    "door",
    "window",
    "opening",
  ]);
  expect(initial.schemaVersion).toBe(12);
  expect(initial.generated!.convention).toBe("nominal-v10");
  await page
    .getByRole("button", { name: "Selecionar", exact: false })
    .first()
    .click();
  await drag(page, [15000, 625], [16250, 625]);
  await expect(page.getByLabel("Posição do vão", { exact: true })).toHaveValue(
    "112,5",
  );
  await drag(page, [11250, 625], [10000, 625]);
  await drag(page, [21250, 625], [22500, 625]);
  await expect(page.getByLabel("Largura do vão")).toHaveValue("125");
  await page.getByLabel("Largura do vão").fill("103");
  await page.getByRole("button", { name: "Aplicar vão" }).click();
  await page.getByRole("button", { name: /112,5 cm \(diferença/ }).click();
  await page.getByRole("button", { name: "Aplicar vão" }).click();
  const changed = await exported(page);
  expect(changed.model.openings[0].width).toBe(11250);
  await page.getByRole("button", { name: "Excluir vão", exact: true }).click();
  expect((await exported(page)).model.openings).toHaveLength(2);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).model.openings).toEqual(changed.model.openings);
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  const cam = await page.getByTestId("drawing").getAttribute("data-camera");
  await page.getByLabel("Número da fiada").fill("31");
  await page.getByRole("button", { name: "Planta", exact: true }).click();
  expect(await page.getByTestId("drawing").getAttribute("data-camera")).toBe(
    cam,
  );
  await page.screenshot({ path: ".tools/m3-plan.png" });
  await page.reload();
  await page.getByRole("button", { name: /M3.1.*cópia/ }).click();
  expect((await exported(page)).model).toEqual(changed.model);
  const context = await browser.newContext(),
    other = await context.newPage();
  await load(other, changed);
  expect((await exported(other)).model).toEqual(changed.model);
  await context.close();
});
test("M3.1 configurações cancelar/aplicar/restaurar, histórico e padrões só para novas aberturas", async ({
  page,
}) => {
  await load(page);
  await page.getByRole("button", { name: "Janela", exact: true }).click();
  await drag(page, [10000, 625], [20000, 625]);
  const first = (await exported(page)).model.openings[0];
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page.getByLabel("Base padrão de janela/vão").fill("98");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  expect((await exported(page)).project.openingSettings.base).toBe(11200);
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page.getByLabel("Base padrão de janela/vão").fill("100");
  await page.screenshot({ path: ".tools/m3-settings.png" });
  await page.getByRole("button", { name: "Aplicar configurações" }).click();
  await page.getByRole("button", { name: /98 cm \(diferença/ }).click();
  await page.getByRole("button", { name: "Aplicar configurações" }).click();
  expect((await exported(page)).model.openings[0]).toEqual(first);
  await drag(page, [25000, 625], [35000, 625]);
  expect((await exported(page)).model.openings[1].base).toBe(9800);
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page.getByRole("button", { name: "Restaurar padrões de vãos" }).click();
  await page.getByRole("button", { name: "Aplicar configurações" }).click();
  expect((await exported(page)).project.openingSettings.base).toBe(11200);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).project.openingSettings.base).toBe(9800);
});
test("M3.1 empilhados identificados na Planta, contato recusado e edição na Fiada", async ({
  page,
}) => {
  const d = fixture();
  d.model.openings = [
    opening(d, 0, 10500, "door"),
    opening(d, 11200, 9800, "window"),
  ];
  await load(page, d);
  await click(page, 15000, 625);
  await page
    .getByRole("button", { name: /Janela · base 112 · topo 210/ })
    .click();
  await page.getByLabel("Base do vão").fill("105");
  await page.getByRole("button", { name: "Aplicar vão" }).click();
  await expect(page.getByRole("alert")).toContainText("fiada completa");
  await page.getByRole("button", { name: "Cancelar edição" }).click();
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await page.getByLabel("Número da fiada").fill("16");
  expect(
    (await exported(page)).generated!.floors[0].courses[15].pieces,
  ).toHaveLength(17);
  await page.getByLabel("Número da fiada").fill("17");
  await click(page, 15000, 625);
  await page
    .getByRole("button", { name: "Editar na Planta", exact: true })
    .click();
  await expect(page.getByLabel("Base do vão")).toHaveValue("112");
  await page.screenshot({ path: ".tools/m3-stacked.png" });
});
test("M3.1 Escape, perda de foco, saída do canvas e navegação não inserem vãos", async ({
  page,
}) => {
  await load(page);
  await page.getByRole("button", { name: "Porta", exact: true }).click();
  const p = await point(page, 10000, 625),
    q = await point(page, 20000, 625);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(q.x, q.y);
  await page.keyboard.press("Escape");
  await page.mouse.up();
  expect((await exported(page)).model.openings).toEqual([]);
  await page.getByRole("button", { name: "Porta", exact: true }).click();
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(q.x, q.y);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.mouse.up();
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(10, 10);
  await page.mouse.up();
  expect((await exported(page)).model.openings).toEqual([]);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(q.x, q.y);
  await page.mouse.up({ button: "middle" });
  expect((await exported(page)).model.openings).toEqual([]);
  await drag(page, [10000, 625], [20000, 625]);
  expect((await exported(page)).model.openings).toHaveLength(1);
});
test("M3.1 encurtar parede conserva vão pendente, diagnóstico localiza e desfazer restaura", async ({
  page,
}) => {
  const d = fixture();
  d.model.openings = [opening(d, 0, 21000, "door")];
  await load(page, d);
  await click(page, 30000, 625);
  await page.getByLabel("Comprimento", { exact: true }).fill("150");
  await page.getByLabel("Comprimento", { exact: true }).press("Enter");
  const pending = await exported(page);
  expect(pending.model.openings[0].offset).toBe(10000);
  expect(
    pending.generated!.floors[0].courses.every((c) => !c.pieces.length),
  ).toBe(true);
  await page.getByRole("button", { name: /Diagnósticos \(/ }).click();
  await expect(page.getByLabel("Diagnósticos do projeto")).toContainText(
    "fora dos limites",
  );
  await page
    .getByRole("button", { name: "Editar na Planta", exact: true })
    .click();
  await expect(page.getByLabel("Posição do vão", { exact: true })).toHaveValue(
    "100",
  );
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  const restored = await exported(page);
  expect(restored.model.walls[0].b.x).toBe(40000);
  await click(page, 30000, 625);
  await expect(
    page.getByText(/Excluir esta parede também remove seus 1 vãos/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Excluir parede", exact: true })
    .click();
  expect((await exported(page)).model.openings).toEqual([]);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).model.openings[0].id).toBe(
    d.model.openings[0].id,
  );
});
test("M3.1 defaults incompatíveis em base de 6 cm exigem escolha antes de inserir", async ({
  page,
}) => {
  const d = createProject(
    "Altura 6",
    {
      length: 2800,
      width: 1400,
      height: 600,
    },
    24000,
  );
  d.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      { x: 44800, y: 0 },
      1400,
      d.model.floors[0].id,
      24000,
      1,
    )!,
  ];
  await load(page, d);
  await page.getByRole("button", { name: "Janela", exact: true }).click();
  await drag(page, [11200, 700], [22400, 700]);
  expect((await exported(page)).model.openings).toEqual([]);
  await expect(page.getByText("CONFIRMAR NOVO VÃO")).toBeVisible();
  await page.getByLabel("Base do vão").fill("108");
  await page.getByLabel("Altura do vão").fill("108");
  await page.getByRole("button", { name: "Aplicar vão" }).click();
  expect((await exported(page)).model.openings[0]).toMatchObject({
    base: 10800,
    height: 10800,
  });
});
