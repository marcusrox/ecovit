import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
  type Project,
} from "../../src/domain/project";
import { putOpening } from "../../src/domain/openings";
const base = { length: 2500, width: 1250, height: 700 };
function frame() {
  const d = createProject("Cruz com contorno", base);
  d.project.channelLevels = [];
  d.project.groutSettings = defaultGroutSettings(false);
  for (const [a, b] of [
    [
      [0, 0],
      [16, 0],
    ],
    [
      [0, 11],
      [16, 11],
    ],
    [
      [0, 0],
      [0, 12],
    ],
    [
      [15, 0],
      [15, 12],
    ],
    [
      [8, 1],
      [8, 8],
    ],
    [
      [1, 4],
      [13, 4],
    ],
  ] as const)
    d.model.walls.push(
      makeWall(
        { x: a[0] * 1250, y: a[1] * 1250 },
        { x: b[0] * 1250, y: b[1] * 1250 },
        1250,
        d.model.floors[0].id,
        2100,
        1,
      )!,
    );
  return d;
}
async function load(page: Page, d: unknown) {
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "cruz.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function exported(page: Page): Promise<Project> {
  const wait = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  return JSON.parse(await readFile((await (await wait).path())!, "utf8"));
}
async function fiada(page: Page, n = 1) {
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await page.getByLabel("Número da fiada").fill(String(n));
}
test("M3.5 EX-53 seis paredes visíveis, prévia cancelar/confirmar, histórico e transporte", async ({
  page,
}) => {
  await load(page, frame());
  await fiada(page);
  const before = await exported(page);
  expect(before.schemaVersion).toBe(8);
  expect(before.generated!.convention).toBe("nominal-v9");
  expect(
    before.generated!.floors[0].courses.map((c) => c.pieces.length),
  ).toEqual([36, 37, 36]);
  await page.getByRole("button", { name: /Conjunto 1.*cruz/ }).click();
  await page.getByRole("button", { name: "Prévia da alternativa B" }).click();
  await expect(
    page.getByText("Prévia — todos os cantos destacados serão alterados.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancelar prévia" }).click();
  expect(await exported(page)).toEqual(before);
  await page.getByRole("button", { name: "Prévia da alternativa B" }).click();
  await page.screenshot({ path: ".tools/m35-preview.png" });
  await page.getByRole("button", { name: "Confirmar alternativa" }).click();
  const chosen = await exported(page);
  expect(
    chosen.generated!.floors[0].courses.map((c) => c.pieces.length),
  ).toEqual([37, 36, 37]);
  expect(chosen.adjustments.junctions[0].binding).toBe("active");
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect(
    (await exported(page)).generated!.floors[0].courses.map(
      (c) => c.pieces.length,
    ),
  ).toEqual([36, 37, 36]);
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  expect((await exported(page)).adjustments).toEqual(chosen.adjustments);
  await page.reload();
  await page.getByRole("button", { name: /Cruz com contorno.*cópia/ }).click();
  expect((await exported(page)).generated).toEqual(chosen.generated);
  await fiada(page, 2);
  await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
  await page.screenshot({ path: ".tools/m35-frame.png" });
  await load(page, chosen);
  expect((await exported(page)).adjustments).toEqual(chosen.adjustments);
});
test("M3.5 cruz sem L oferece alternativa e cruza → reta sem reiniciar fase", async ({
  page,
}) => {
  const d = frame();
  d.model.walls = [
    makeWall(
      { x: -3750, y: 0 },
      { x: 5000, y: 0 },
      1250,
      d.model.floors[0].id,
      2100,
      1,
    )!,
    makeWall(
      { x: 0, y: -3750 },
      { x: 0, y: 5000 },
      1250,
      d.model.floors[0].id,
      1400,
      1,
    )!,
  ];
  await load(page, d);
  await fiada(page);
  await page
    .getByRole("button", { name: "Conjunto 1 · cruz", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Prévia da alternativa B" }),
  ).toBeEnabled();
  await fiada(page, 3);
  const r = await exported(page);
  expect(r.generated!.floors[0].courses[2].pieces).toHaveLength(4);
  expect(
    r.generated!.floors[0].courses[2].pieces.find((p) => p.kind === "half")!.x,
  ).toBe(3750);
  await page.screenshot({ path: ".tools/m35-height.png" });
  d.model.openings = [
    {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "window",
      offset: 3750,
      width: 1250,
      base: 1400,
      height: 700,
    },
  ];
  await load(page, d);
  await fiada(page, 3);
  const opened = await exported(page);
  expect(opened.generated!.floors[0].courses[2].pieces).toHaveLength(4);
  expect(
    opened.generated!.diagnostics.some((a) => a.severity === "error"),
  ).toBe(false);
  expect(
    opened.generated!.floors[0].courses[2].pieces.some(
      (p) => p.x <= 0 && p.x + p.width > 0,
    ),
  ).toBe(false);
});
test("M3.5 EX-55 elementos associados e falha de gravação preservam trabalho", async ({
  page,
}) => {
  let d = frame();
  d.model.walls = d.model.walls.map((w) => ({ ...w, height: 28000 }));
  d.project.channelLevels = [{ id: crypto.randomUUID(), top: 11200 }];
  d.project.groutSettings.junctions = true;
  d = putOpening(d, {
    id: crypto.randomUUID(),
    wallId: d.model.walls[1].id,
    kind: "window",
    offset: 5000,
    width: 2500,
    base: 9800,
    height: 11200,
  });
  await load(page, d);
  await fiada(page, 16);
  const before = await exported(page);
  expect(
    before.generated!.floors[0].courses[15].pieces.reduce(
      (s, p) => s + (p.width * p.height) / 1250 ** 2,
      0,
    ),
  ).toBe(68);
  expect(
    before.generated!.floors[0].grouts!.filter(
      (a) => a.x === 10000 && a.y === 5000,
    ),
  ).toHaveLength(1);
  await page
    .getByLabel("Selecionar faixa de canaleta")
    .selectOption(
      before.generated!.floors[0].channels!.find(
        (b) => b.wallId === d.model.walls[0].id && b.course === 16,
      )!.id,
    );
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    (window as unknown as { restorePut: () => void }).restorePut = () => {
      IDBObjectStore.prototype.put = put;
    };
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("simulada", "QuotaExceededError");
    };
  });
  await page
    .getByRole("button", { name: "Remover faixa de canaleta", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Não salvo");
  const after = await exported(page);
  expect(after.generated!.floors[0].grouts).toEqual(
    before.generated!.floors[0].grouts,
  );
  expect(after.adjustments.channels).toHaveLength(1);
  await page.evaluate(() => {
    (window as unknown as { restorePut: () => void }).restorePut();
  });
  await page
    .getByRole("button", { name: "Tentar salvar", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  await page.screenshot({ path: ".tools/m35-elements.png" });
});
test("M3.5 diagnóstico real informa alcance, mantém independente e localiza", async ({
  page,
}) => {
  const d = frame();
  d.model.walls = [
    makeWall(
      { x: -2500, y: 0 },
      { x: 5000, y: 0 },
      1250,
      d.model.floors[0].id,
      2100,
      1,
    )!,
    makeWall(
      { x: 0, y: -2500 },
      { x: 0, y: 3750 },
      1250,
      d.model.floors[0].id,
      2100,
      1,
    )!,
    makeWall(
      { x: 1250, y: -2500 },
      { x: 1250, y: 3750 },
      1250,
      d.model.floors[0].id,
      2100,
      1,
    )!,
    makeWall(
      { x: 12500, y: 0 },
      { x: 22500, y: 0 },
      1250,
      d.model.floors[0].id,
      2100,
      1,
    )!,
  ];
  await load(page, d);
  await fiada(page);
  await expect(
    page.getByText(/Composição suspensa em 3 paredes conectadas/),
  ).toBeVisible();
  expect(
    (await exported(page)).generated!.floors[0].courses[0].pieces,
  ).toHaveLength(4);
  await page
    .getByRole("button", { name: "Diagnósticos (1)", exact: true })
    .click();
  await page.getByRole("button", { name: "Localizar", exact: true }).click();
  await page.screenshot({ path: ".tools/m35-diagnostic.png" });
});
test("M3.5 carga de vinte contornos com cruz preserva posições e contagens", async ({
  page,
}, info) => {
  const d = frame(),
    originals = d.model.walls;
  d.model.walls = [];
  for (let i = 0; i < 20; i++)
    for (const w of originals)
      d.model.walls.push({
        ...w,
        id: crypto.randomUUID(),
        a: { x: w.a.x + i * 30000, y: w.a.y },
        b: { x: w.b.x + i * 30000, y: w.b.y },
        height: 28000,
      });
  const start = Date.now();
  await load(page, d);
  const elapsed = Date.now() - start,
    g = (await exported(page)).generated!.floors[0];
  expect(g.components).toHaveLength(20);
  expect(g.courses.reduce((s, c) => s + c.pieces.length, 0)).toBe(29200);
  expect(g.courses[0].pieces).toHaveLength(720);
  expect(g.courses[1].pieces).toHaveLength(740);
  expect(g.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  console.log(
    `M3.5 carga ${info.project.name}: 20 contornos, 40 fiadas, 29.200 peças em ${elapsed} ms (abertura/importação/geração/salvamento).`,
  );
});
