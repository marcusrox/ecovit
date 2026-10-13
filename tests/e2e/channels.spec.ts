import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  createProject,
  makeWall,
  type Project,
} from "../../src/domain/project";
import { generate } from "../../src/domain/composition";
import { putOpening } from "../../src/domain/openings";
const base = { length: 2500, width: 1250, height: 700 };
test("M3.2 carga de 100 janelas com demandas globais coincidentes", async ({
  page,
}, info) => {
  const d = createProject("Carga canaletas", base);
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
      offset: 6250,
      width: 10000,
      base: 11200,
      height: 10500,
    });
  }
  const start = Date.now();
  await load(page, d);
  const elapsed = Date.now() - start,
    result = await exported(page);
  expect(
    result.generated!.courses.reduce((sum, c) => sum + c.pieces.length, 0),
  ).toBe(36800);
  expect(result.generated!.channels).toHaveLength(200);
  expect(
    result.generated!.courses[15].pieces.filter((p) => p.kind === "channel"),
  ).toHaveLength(900);
  expect(
    result.generated!.courses[15].pieces.filter(
      (p) => p.kind === "half-channel",
    ),
  ).toHaveLength(200);
  expect(result.generated!.diagnostics).toEqual([]);
  await course(page, 16);
  await page.screenshot({ path: `.tools/m32-load-${info.project.name}.png` });
  console.log(
    `M3.2 carga ${info.project.name}: 100 janelas, 40 fiadas, 36.800 peças e 200 faixas em ${elapsed} ms (inclui abertura, importação, geração e salvamento).`,
  );
});
test("M3.2 diagnóstico localiza nível incompatível e permite corrigir sem apagar intenção", async ({
  page,
}) => {
  const d = fixture(false);
  d.project.channelLevels = [{ id: crypto.randomUUID(), top: 11300 }];
  await load(page, d);
  await page
    .getByRole("button", { name: "Diagnósticos (1)", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Diagnósticos do projeto" }),
  ).toContainText("Topo configurado: 113 cm");
  await page.getByRole("button", { name: "Editar níveis de canaleta" }).click();
  await expect(
    page.getByLabel("Topo de canaleta 1", { exact: true }),
  ).toHaveValue("113");
  await page.getByLabel("Topo de canaleta 1", { exact: true }).fill("112");
  await page.getByRole("button", { name: "Aplicar configurações" }).click();
  expect((await exported(page)).project.channelLevels[0].id).toBe(
    d.project.channelLevels[0].id,
  );
  expect((await exported(page)).generated!.diagnostics).toEqual([]);
});
function fixture(window = true) {
  let d = createProject("Canaletas", base);
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
    name: "canaletas.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function exported(page: Page) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  return JSON.parse(
    await readFile((await (await pending).path())!, "utf8"),
  ) as Project;
}
async function course(page: Page, n: number) {
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await page.getByLabel("Número da fiada").fill(String(n));
}
async function click(page: Page, x: number, y: number) {
  const drawing = page.getByTestId("drawing"),
    box = (await drawing.boundingBox())!,
    c = JSON.parse((await drawing.getAttribute("data-camera"))!);
  await page.mouse.click(box.x + c.x + x * c.scale, box.y + c.y + y * c.scale);
}
test("M3.2 níveis com alternativas, cancelar/restaurar e origens coincidentes", async ({
  page,
}) => {
  await load(page, fixture());
  await course(page, 14);
  let d = await exported(page);
  expect(
    d.generated!.courses[13].pieces.filter((p) => p.kind === "channel"),
  ).toHaveLength(5);
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Canaletas", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Adicionar nível de canaleta" })
    .click();
  await page.getByLabel("Topo de canaleta 1", { exact: true }).fill("100");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  expect((await exported(page)).project.channelLevels).toEqual([]);
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Adicionar nível de canaleta" })
    .click();
  await page.getByLabel("Topo de canaleta 1", { exact: true }).fill("100");
  await page.getByRole("button", { name: "Aplicar configurações" }).click();
  await page.getByRole("button", { name: /98 cm \(diferença/ }).click();
  await page.getByRole("button", { name: "Aplicar configurações" }).click();
  d = await exported(page);
  expect(d.project.channelLevels[0].top).toBe(9800);
  const merged = d.generated!.channels!.find((b) => b.course === 14)!;
  expect(merged.cells).toHaveLength(32);
  expect(
    merged.cells.filter((c) => c.origins.length === 2).map((c) => c.x),
  ).toEqual(Array.from({ length: 10 }, (_, i) => 8750 + i * 1250));
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Adicionar nível de canaleta" })
    .click();
  await page.getByLabel("Topo de canaleta 2", { exact: true }).fill("98");
  await page.getByRole("button", { name: "Aplicar configurações" }).click();
  await expect(page.getByRole("dialog")).toContainText("Não repita");
  await page
    .getByRole("button", { name: "Remover nível de canaleta 2", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restaurar padrões de canaletas" })
    .click();
  await page.screenshot({ path: ".tools/m32-config.png" });
  await page.getByRole("button", { name: "Aplicar configurações" }).click();
  expect(
    (await exported(page)).project.channelLevels.map((l) => l.top),
  ).toEqual([11200, 22400]);
  await course(page, 16);
  await page.screenshot({ path: ".tools/m32-levels.png" });
});
test("M3.2 EX-35 remover toda faixa, preservar outras e restaurar após reabertura", async ({
  page,
}) => {
  let d = fixture();
  d.project.channelLevels = [
    { id: crypto.randomUUID(), top: 11200 },
    { id: crypto.randomUUID(), top: 22400 },
  ];
  d = putOpening(d, {
    id: crypto.randomUUID(),
    wallId: d.model.walls[0].id,
    kind: "window",
    offset: 25000,
    width: 10000,
    base: 11200,
    height: 10500,
  });
  await load(page, d);
  await course(page, 16);
  const before = await exported(page),
    band = before.generated!.channels!.find((b) => b.course === 16)!;
  await page.getByLabel("Selecionar faixa de canaleta").selectOption(band.id);
  await expect(
    page.getByText(/24 células de canaleta realçadas/),
  ).toBeVisible();
  await page.screenshot({ path: ".tools/m32-selected.png" });
  await page
    .getByRole("button", { name: "Remover faixa de canaleta", exact: true })
    .click();
  let after = await exported(page);
  expect(
    after.generated!.courses[15].pieces.some((p) => p.kind.includes("channel")),
  ).toBe(false);
  expect(after.generated!.courses[31].pieces).toEqual(
    before.generated!.courses[31].pieces,
  );
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restaurar padrões de canaletas" })
    .click();
  await page.getByRole("button", { name: "Aplicar configurações" }).click();
  expect((await exported(page)).adjustments.channels).toEqual(
    after.adjustments.channels,
  );
  await page.reload();
  await page.getByRole("button", { name: /Canaletas.*cópia/ }).click();
  await course(page, 16);
  after = await exported(page);
  expect(
    after.generated!.courses[15].pieces.some((p) => p.kind.includes("channel")),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Restaurar faixa suprimida", exact: true })
    .click();
  expect((await exported(page)).generated!.courses[15].pieces).toEqual(
    before.generated!.courses[15].pieces,
  );
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect(
    (await exported(page)).generated!.courses[15].pieces.some((p) =>
      p.kind.includes("channel"),
    ),
  ).toBe(false);
});
test("M3.2 célula compartilhada escolhe parede e referência não recebe remoção", async ({
  page,
}) => {
  const d = fixture(false);
  d.model.walls[0].b.x = 10000;
  d.model.walls.push(
    makeWall(
      { x: 0, y: 0 },
      { x: 0, y: 10000 },
      1250,
      d.model.floors[0].id,
      28000,
      1,
    )!,
  );
  d.project.channelLevels = [{ id: crypto.randomUUID(), top: 11200 }];
  await load(page, d);
  await course(page, 16);
  await click(page, 625, 625);
  await page
    .getByRole("button", { name: /Parede 2 · canaleta na fiada 16/ })
    .click();
  await page
    .getByRole("button", { name: "Remover faixa de canaleta", exact: true })
    .click();
  const after = await exported(page);
  expect(after.adjustments.channels[0].wallId).toBe(d.model.walls[1].id);
  const corner = after.generated!.courses[15].pieces.find(
    (p) => p.x === 0 && p.y === 0,
  )!;
  expect(corner.kind).toBe("whole");
  await course(page, 15);
  await page.getByLabel("Fiada de referência").selectOption("next");
  await click(page, 625, 625);
  await expect(
    page.getByRole("button", {
      name: "Remover faixa de canaleta",
      exact: true,
    }),
  ).toHaveCount(0);
  expect((await exported(page)).adjustments).toEqual(after.adjustments);
});
test("M3.2 extensão e nível movido preservam supressão na cota original", async ({
  page,
}) => {
  const d = fixture(false);
  d.project.channelLevels = [{ id: crypto.randomUUID(), top: 11200 }];
  await load(page, d);
  await course(page, 16);
  await click(page, 15000, 625);
  await page
    .getByRole("button", { name: "Remover faixa de canaleta", exact: true })
    .click();
  await page.getByRole("button", { name: "Planta", exact: true }).click();
  await click(page, 30000, 625);
  await page.getByLabel("Comprimento", { exact: true }).fill("450");
  await page.getByLabel("Comprimento", { exact: true }).press("Enter");
  expect(
    (await exported(page)).generated!.courses[15].pieces.some((p) =>
      p.kind.includes("channel"),
    ),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page.getByLabel("Topo de canaleta 1", { exact: true }).fill("119");
  await page.getByRole("button", { name: "Aplicar configurações" }).click();
  const after = await exported(page);
  expect(after.adjustments.channels[0].top).toBe(11200);
  expect(
    after.generated!.courses[16].pieces.every((p) =>
      p.kind.includes("channel"),
    ),
  ).toBe(true);
  expect(after.generated!.diagnostics).toEqual([]);
});
test("M3.2 snapshot M3.1 validado antes da migração e adulterado recusado", async ({
  page,
}) => {
  const d = fixture();
  const {
    channelLevels: _levels,
    groutSettings: _grout,
    ...project
  } = d.project;
  void _levels;
  void _grout;
  const g = generate(d, "nominal-v4"),
    old = {
      ...d,
      schemaVersion: 3,
      project,
      generated: g,
      generationState: { status: "current", diagnostics: g.diagnostics },
    };
  await load(page, old);
  const before = await exported(page);
  expect(before.schemaVersion).toBe(5);
  expect(before.project.channelLevels).toEqual([]);
  expect(before.generated!.convention).toBe("nominal-v6");
  expect(before.generated!.channels!.map((b) => b.course)).toEqual([14, 31]);
  const bad = structuredClone(old);
  bad.generated.courses[0].pieces[0].width += 1250;
  await page.getByTestId("import-file").setInputFiles({
    name: "adulterado.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(bad)),
  });
  await expect(page.getByRole("alert")).toContainText("inconsistente");
  expect(await exported(page)).toEqual(before);
});
test("M3.2 falha de armazenamento preserva supressão e resultado em download", async ({
  page,
}) => {
  await load(page, fixture());
  await course(page, 14);
  await click(page, 15000, 625);
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("Falha simulada", "QuotaExceededError");
    };
  });
  await page
    .getByRole("button", { name: "Remover faixa de canaleta", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Não salvo");
  const after = await exported(page);
  expect(after.adjustments.channels).toHaveLength(1);
  expect(after.generationState.status).toBe("current");
  expect(
    after.generated!.courses[13].pieces.some((p) => p.kind.includes("channel")),
  ).toBe(false);
  await expect(
    page.getByRole("button", {
      name: "Restaurar faixa suprimida",
      exact: true,
    }),
  ).toBeEnabled();
});
