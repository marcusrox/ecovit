import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  createProject,
  makeWall,
  type Project,
} from "../../src/domain/project";
const base = { length: 2500, width: 1250, height: 700 };
test("M2 carga nominal de 42 mil peças", async ({ page }, info) => {
  const d = fixture("Carga M2");
  for (let i = 0; i < 100; i++) wall(d, [0, i * 3], [20, i * 3], 28000);
  const start = Date.now();
  await load(page, d);
  const elapsed = Date.now() - start;
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect(page.getByLabel("Número da fiada")).toHaveAttribute("max", "40");
  const result = await exported(page);
  expect(
    result.generated!.floors[0].courses.reduce(
      (n, c) => n + c.pieces.length,
      0,
    ),
  ).toBe(42000);
  console.log(
    `M2 carga ${info.project.name}: importação/migração, geração e salvamento de 42.000 peças em ${elapsed} ms (inclui abertura da página).`,
  );
});
function fixture(name: string) {
  return createProject(name, base);
}
function wall(
  d: Project,
  a: number[],
  b: number[],
  height = 2100,
  side: 1 | -1 = 1,
) {
  d.model.walls.push(
    makeWall(
      { x: a[0] * 1250, y: a[1] * 1250 },
      { x: b[0] * 1250, y: b[1] * 1250 },
      1250,
      d.model.floors[0].id,
      height,
      side,
    )!,
  );
}
async function load(page: Page, d: Project) {
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "m1.ecovit",
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
test("M2 L: prévia, escolha na primeira fiada, histórico e reabertura", async ({
  page,
}) => {
  const d = fixture("Canto M2");
  wall(d, [0, 0], [3, 0]);
  wall(d, [0, 0], [0, 3]);
  await load(page, d);
  const original = (await exported(page)).generated;
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await page
    .getByRole("button", { name: "Conjunto 1 · L", exact: true })
    .click();
  await page.getByRole("button", { name: "Próxima fiada" }).click();
  await page
    .getByRole("button", { name: "Altere o encontro na primeira fiada" })
    .click();
  await expect(page.getByLabel("Número da fiada")).toHaveValue("1");
  await page.getByRole("button", { name: "Prévia da alternativa B" }).click();
  expect((await exported(page)).adjustments.junctions).toHaveLength(0);
  await page.getByRole("button", { name: "Confirmar alternativa" }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  const chosen = await exported(page);
  expect(chosen.adjustments.junctions[0].phase).toBe(1);
  expect(chosen.generated).not.toEqual(original);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await exported(page)).generated).toEqual(original);
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  await page.reload();
  await page.getByRole("button", { name: /Canto M2/ }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await exported(page)).generated).toEqual(chosen.generated);
});
test("M2 T, cruz, anel e altura menor; revisão visual", async ({
  page,
}, info) => {
  const d = fixture("Composição M2");
  wall(d, [0, 0], [32, 0]);
  wall(d, [0, 24], [32, 24], 2100, -1);
  wall(d, [0, 0], [0, 24]);
  wall(d, [32, 0], [32, 24], 2100, -1);
  wall(d, [40, 0], [48, 0]);
  wall(d, [44, 1], [44, 5]);
  wall(d, [40, 10], [43, 10]);
  wall(d, [41, 9], [41, 12]);
  wall(d, [40, 18], [43, 18]);
  wall(d, [40, 18], [40, 21], 1400);
  await load(page, d);
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
  await expect(
    page.getByText(
      "Composição geométrica resolvida; ligação complementar necessária.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Composição nominal; ligação entre paredes não dimensionada.",
      {
        exact: true,
      },
    ),
  ).toBeVisible();
  const saved = await exported(page);
  expect(saved.generated!.floors[0].courses[0].pieces).toHaveLength(
    54 + 6 + 3 + 4,
  );
  expect(saved.generated!.floors[0].courses[2].pieces).toHaveLength(
    54 + 6 + 2 + 4,
  );
  await page.getByRole("button", { name: "Projetos", exact: true }).click();
  await page.getByRole("button", { name: /Composição M2/ }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect(await exported(page)).toEqual(saved);
  await page.reload();
  await page.getByRole("button", { name: /Composição M2/ }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect(await exported(page)).toEqual(saved);
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
  await page.screenshot({
    path: info.outputPath("m2-fiada.png"),
    fullPage: true,
  });
  await page.getByLabel("Número da fiada").fill("3");
  expect((await exported(page)).generated).toEqual(saved.generated);
});
test("M2 altura incompatível oferece alternativas e não altera silenciosamente", async ({
  page,
}) => {
  const d = fixture("Altura M2");
  wall(d, [0, 0], [8, 0]);
  await load(page, d);
  const canvas = page.getByTestId("drawing"),
    box = (await canvas.boundingBox())!,
    camera = JSON.parse((await canvas.getAttribute("data-camera"))!);
  await page.mouse.click(
    box.x + camera.x + 5000 * camera.scale,
    box.y + camera.y + 625 * camera.scale,
  );
  await page.getByLabel("Altura da parede", { exact: true }).fill("20");
  await page.getByLabel("Altura da parede", { exact: true }).press("Tab");
  expect((await exported(page)).model.walls[0].height).toBe(2100);
  await page.getByRole("button", { name: "14 cm", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await exported(page)).generated!.floors[0].courses).toHaveLength(2);
});

for (const snapshot of ["legacy", "v2"])
  test(`U referência ${snapshot}: geometria no formato atual, alternativa e reabertura`, async ({
    page,
  }) => {
    const old = JSON.parse(
      await readFile(`tests/fixtures/open-u-${snapshot}.ecovit`, "utf8"),
    ) as Project;
    // Reuse only the reference drawing, not its obsolete file contract.
    const reference = fixture(old.project.name);
    reference.project.base = old.project.base;
    reference.project.channelLevels = [];
    reference.model.walls = old.model.walls.map((w) => ({
      ...w,
      floorId: reference.model.floors[0].id,
    }));
    await load(page, reference);
    await page.getByRole("button", { name: "Fiada", exact: true }).click();
    await expect(
      page.getByText("Geometria nominal verificada", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Composição geométrica resolvida; ligação complementar necessária.",
      ),
    ).toBeVisible();
    let d = await exported(page);
    expect(d.model).toEqual(reference.model);
    expect(d.generated!.convention).toBe("nominal-v9");
    expect(
      d
        .generated!.floors[0].courses[0].pieces.filter((p) => p.kind === "half")
        .map((p) => [p.x, p.y]),
    ).toEqual([[52500, 22500]]);
    expect(d.generated!.floors[0].courses).toHaveLength(40);
    expect(
      d.generated!.floors[0].courses.every((c) => c.pieces.length > 0),
    ).toBe(true);
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    await page.screenshot({
      path: `test-results/open-u-first-${snapshot}-${test.info().project.name}.png`,
    });
    await page.getByRole("button", { name: /Conjunto 1/ }).click();
    await page.getByRole("button", { name: "Prévia da alternativa B" }).click();
    await page.getByRole("button", { name: "Confirmar alternativa" }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    d = await exported(page);
    expect(d.adjustments.junctions[0].phase).toBe(1);
    await page.getByLabel("Número da fiada").fill("40");
    await expect(page.getByText("273–280 cm em relação ao piso")).toBeVisible();
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    await page.screenshot({
      path: `test-results/open-u-${test.info().project.name}.png`,
    });
    await page.reload();
    await page.getByRole("button", { name: /Meu projeto FR/ }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    expect(await exported(page)).toEqual(d);
  });
