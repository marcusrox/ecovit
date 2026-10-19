import { expect, test, type Page } from "@playwright/test";
import {
  createProject,
  makeWall,
  type Opening,
} from "../../src/domain/project";

async function doc(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    return (await import(path)).useStore.getState().doc;
  });
}
async function drag(page: Page, start: number, end: number) {
  const drawing = page.getByTestId("drawing"),
    box = (await drawing.boundingBox())!;
  const camera = JSON.parse((await drawing.getAttribute("data-camera"))!);
  await page.mouse.move(
    box.x + camera.x + start * camera.scale,
    box.y + camera.y + 625 * camera.scale,
  );
  await page.mouse.down();
  await page.mouse.move(
    box.x + camera.x + end * camera.scale,
    box.y + camera.y + 625 * camera.scale,
    { steps: 6 },
  );
  await page.mouse.up();
}
test("M9 criação real usa padrões e edição dimensional conserva tipo/orientação", async ({
  page,
}) => {
  const d = createProject("M9 Criação", {
    length: 2500,
    width: 1250,
    height: 700,
  });
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
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "defaults.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  await page.getByRole("button", { name: "Porta", exact: true }).click();
  await drag(page, 5000, 15000);
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await doc(page)).model.openings[0].appearance).toEqual({
    type: "swing",
    orientation: 0,
  });
  await page.getByRole("button", { name: "Janela", exact: true }).click();
  await drag(page, 20000, 30000);
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await doc(page)).model.openings[1].appearance).toEqual({
    type: "sliding",
    orientation: 0,
  });
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption((await doc(page)).model.openings[0].id);
  await page.getByLabel("Tipo da esquadria").selectOption("tilt");
  await expect(
    page.getByRole("button", { name: "Alternar orientação" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Alternar orientação" }).click();
  await expect(page.getByLabel("Tipo da esquadria")).toBeEnabled();
  await page.getByLabel("Largura do vão").fill("112,5");
  await page.getByRole("button", { name: "Aplicar vão" }).click();
  await expect(page.getByLabel("Tipo da esquadria")).toBeEnabled();
  const door = (await doc(page)).model.openings[0];
  expect(door.width).toBe(11250);
  expect(door.appearance).toEqual({ type: "tilt", orientation: 1 });
});

test("M9 criação pendente só confirma aparência com dimensões válidas", async ({
  page,
}) => {
  const d = createProject(
    "M9 Pendente",
    { length: 2800, width: 1400, height: 600 },
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
  await page.goto("/");
  await page
    .getByTestId("import-file")
    .setInputFiles({
      name: "pending.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(d)),
    });
  await expect(page.getByRole("status")).toContainText("Salvo");
  await page.getByRole("button", { name: "Janela", exact: true }).click();
  await drag(page, 11200, 22400);
  await expect(page.getByText("CONFIRMAR NOVO VÃO")).toBeVisible();
  await page.getByLabel("Tipo da esquadria").selectOption("tilt");
  await page.getByRole("button", { name: "Alternar orientação" }).click();
  expect((await doc(page)).model.openings).toEqual([]);
  await page.getByLabel("Base do vão").fill("108");
  await page.getByLabel("Altura do vão").fill("108");
  await page.getByRole("button", { name: "Aplicar vão" }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await doc(page)).model.openings[0]).toMatchObject({
    base: 10800,
    height: 10800,
    appearance: { type: "tilt", orientation: 1 },
  });
});

test("M9 prancha no aplicativo com as nove variantes", async ({
  page,
}, info) => {
  const d = createProject("M9 Nove variantes", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  const variants: [
    Opening["kind"],
    NonNullable<Opening["appearance"]>["type"],
  ][] = [
    ["door", "swing"],
    ["door", "double-swing"],
    ["door", "sliding"],
    ["door", "center-sliding"],
    ["door", "tilt"],
    ["window", "swing"],
    ["window", "double-swing"],
    ["window", "sliding"],
    ["window", "tilt"],
  ];
  variants.forEach(([kind, type], i) => {
    const x = (i % 3) * 30000,
      y = Math.floor(i / 3) * 25000;
    const w = makeWall(
      { x, y },
      { x: x + 20000, y },
      1250,
      d.model.floors[0].id,
      28000,
      1,
    )!;
    d.model.walls.push(w);
    d.model.openings.push({
      id: crypto.randomUUID(),
      wallId: w.id,
      kind,
      appearance: { type, orientation: 0 },
      offset: 5000,
      width: 10000,
      base: kind === "window" ? 11200 : 0,
      height: kind === "window" ? 10500 : 21700,
    });
  });
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "prancha.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  await page.setViewportSize({ width: 1366, height: 768 });
  const imported = await doc(page);
  for (const index of [0, 4, 8]) {
    await page
      .getByLabel("Selecionar elemento", { exact: true })
      .selectOption(imported.model.openings[index].id);
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    await expect(
      page.getByRole("img", { name: "Prévia da esquadria" }),
    ).toBeVisible();
    await page.screenshot({
      path: `.tools/m9-catalog-${index}-${info.project.name}.png`,
    });
  }
});
