import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  createProject,
  makeWall,
  type Opening,
  type Project,
} from "../../src/domain/project";

function fixture() {
  const d = createProject("M9 Esquadrias", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  const floor = d.model.floors[0].id;
  d.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 40000, y: 0 }, 1250, floor, 28000, 1)!,
    makeWall(
      { x: 50000, y: 40000 },
      { x: 50000, y: 0 },
      1250,
      floor,
      28000,
      -1,
    )!,
  ];
  d.model.openings = d.model.walls.flatMap(
    (w) =>
      [
        {
          id: crypto.randomUUID(),
          wallId: w.id,
          kind: "door",
          offset: 5000,
          width: 10000,
          base: 0,
          height: 21700,
        },
        {
          id: crypto.randomUUID(),
          wallId: w.id,
          kind: "window",
          offset: 20000,
          width: 10000,
          base: 11200,
          height: 10500,
        },
      ] satisfies Opening[],
  );
  return d;
}
async function load(page: Page, value: unknown = fixture()) {
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "m9.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(value)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  return doc(page);
}
async function doc(page: Page): Promise<Project> {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    return (await import(path)).useStore.getState().doc;
  });
}
async function choose(page: Page, id: string) {
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(id);
}
async function settled(page: Page) {
  await expect(page.getByLabel("Tipo da esquadria")).toBeEnabled();
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function canvases(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  return page
    .getByTestId("drawing")
    .locator("canvas")
    .evaluateAll((elements) =>
      elements.map((c) => (c as HTMLCanvasElement).toDataURL()),
    );
}
async function exported(page: Page) {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  return JSON.parse(
    await readFile((await (await download).path())!, "utf8"),
  ) as Project;
}

test("M9 nove variantes, ciclos no canvas horizontal/vertical, teclado e dimensões pendentes", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const before = await load(page);
  for (const opening of before.model.openings) {
    await choose(page, opening.id);
    await expect(page.getByLabel("Tipo da esquadria")).toHaveValue("");
    await expect(
      page.getByRole("button", { name: "Alternar orientação" }),
    ).toBeDisabled();
    const types =
      opening.kind === "door"
        ? ["swing", "double-swing", "sliding", "center-sliding", "tilt"]
        : ["swing", "double-swing", "sliding", "tilt"];
    for (const type of types) {
      await page.getByLabel("Tipo da esquadria").selectOption(type);
      await settled(page);
      await page
        .getByRole("button", { name: "Enquadrar", exact: true })
        .click();
      const first = await canvases(page);
      const count = type === "swing" || type === "sliding" ? 4 : 2;
      const button = page.getByRole("button", {
        name: "Alternar orientação",
        exact: true,
      });
      await expect(button).toHaveCount(1);
      for (let i = 1; i <= count; i++) {
        await button.focus();
        await page.keyboard.press("Enter");
        await settled(page);
        await expect(button).toBeFocused();
        await expect(page.getByLabel("Orientação da esquadria")).toContainText(
          `${(i % count) + 1}/${count}`,
        );
        const current = (await doc(page)).model.openings.find(
          (o) => o.id === opening.id,
        )!;
        expect(current.appearance).toEqual({ type, orientation: i % count });
        if (i === 1) expect(await canvases(page)).not.toEqual(first);
      }
      expect(await canvases(page)).toEqual(first);
    }
  }
  const door = before.model.openings[0];
  await choose(page, door.id);
  await page.getByLabel("Largura do vão").fill("112,5");
  await page.getByLabel("Tipo da esquadria").selectOption("swing");
  await settled(page);
  await page.getByRole("button", { name: "Alternar orientação" }).click();
  await settled(page);
  await expect(page.getByLabel("Largura do vão")).toHaveValue("112,5");
  const visual = await doc(page);
  expect(visual.model.openings[0].width).toBe(10000);
  expect(visual.generated).toEqual(before.generated);
  await page.getByRole("button", { name: "Aplicar vão" }).click();
  await settled(page);
  expect((await doc(page)).model.openings[0].width).toBe(11250);
  expect((await doc(page)).model.openings[0].appearance).toEqual({
    type: "swing",
    orientation: 1,
  });
  expect(errors).toEqual([]);
});

test("M9 histórico, transporte, legado 11 e bloqueio real entre abas", async ({
  page,
  context,
}) => {
  const legacy = JSON.parse(JSON.stringify(fixture()));
  legacy.schemaVersion = 11;
    Reflect.deleteProperty(legacy.model, "terrain");
  delete legacy.model.imageElements;
  delete legacy.model.customImageAssets;
  const before = await load(page, legacy),
    id = before.model.openings[0].id;
  await choose(page, id);
  await expect(page.getByLabel("Tipo da esquadria")).toHaveValue("");
  await page.getByLabel("Tipo da esquadria").selectOption("tilt");
  await settled(page);
  await page.getByRole("button", { name: "Alternar orientação" }).click();
  await settled(page);
  const selected = await doc(page);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await choose(page, id);
  await settled(page);
  expect((await doc(page)).model.openings[0].appearance?.orientation).toBe(0);
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  await choose(page, id);
  await settled(page);
  expect((await doc(page)).model.openings).toEqual(selected.model.openings);
  const copy = await exported(page);
  expect(copy.schemaVersion).toBe(17);
  expect(copy.model.openings).toEqual(selected.model.openings);
  expect(copy.generated).toEqual(before.generated);
  const second = await context.newPage();
  await second.goto("/");
  await second
    .getByRole("button", { name: /M9 Esquadrias/ })
    .first()
    .click();
  await expect(second.getByRole("status")).toContainText("Somente leitura");
  await choose(second, id);
  await expect(second.getByLabel("Tipo da esquadria")).toBeDisabled();
  await expect(
    second.getByRole("button", { name: "Alternar orientação" }),
  ).toBeDisabled();
  await second.close();
  await page.reload();
  await page
    .getByRole("button", { name: /M9 Esquadrias/ })
    .first()
    .click();
  await choose(page, id);
  await settled(page);
  await expect(page.getByLabel("Tipo da esquadria")).toHaveValue("tilt");
  expect((await doc(page)).model.openings).toEqual(copy.model.openings);
});

test("M9 Fiada ignora aparência e preferências preservam os símbolos", async ({
  page,
}) => {
  const d = await load(page);
  await choose(page, d.model.openings[0].id);
  await page.getByLabel("Tipo da esquadria").selectOption("swing");
  await settled(page);
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  const before = await canvases(page);
  await page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const { useStore } = await import(path);
    const d = useStore.getState().doc;
    await useStore.getState().commit({
      ...d,
      model: {
        ...d.model,
        openings: d.model.openings.map((o: Opening) => ({
          ...o,
          appearance: { type: "tilt", orientation: 1 },
        })),
      },
    });
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect(await canvases(page)).toEqual(before);
  await page.getByRole("button", { name: "Planta", exact: true }).click();
  await choose(page, d.model.openings[0].id);
  await page
    .getByRole("button", { name: "Preferências do Ecovit", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "Portas", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "Janelas", exact: true }).uncheck();
  await page.keyboard.press("Escape");
  const shapes = await canvases(page);
  await page.getByRole("button", { name: "Alternar orientação" }).click();
  await settled(page);
  expect(await canvases(page)).not.toEqual(shapes);
});

test("M9 comparação, cópia de pavimento e apresentação nas três resoluções", async ({
  page,
}, info) => {
  const d = await load(page);
  await choose(page, d.model.openings[0].id);
  await page.getByLabel("Tipo da esquadria").selectOption("tilt");
  await settled(page);
  await page.evaluate(async () => {
    const storePath = "/src/state/store.ts",
      floorsPath = "/src/domain/floors.ts";
    const { useStore } = await import(storePath),
      { duplicateFloor } = await import(floorsPath);
    const d = useStore.getState().doc;
    await useStore
      .getState()
      .commit(
        duplicateFloor(d, d.model.floors[0].id, 28000, "Superior"),
        "floor",
      );
    useStore.getState().inspect({ floorReference: "below" });
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  const copied = await doc(page);
  expect(copied.model.openings[4].appearance).toEqual({
    type: "tilt",
    orientation: 0,
  });
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    await choose(page, copied.model.openings[4].id);
    await page.getByLabel("Tipo da esquadria").selectOption("tilt");
    await settled(page);
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    const button = page.getByRole("button", { name: "Alternar orientação" });
    await expect(button).toBeInViewport();
    await expect(page.getByLabel("Tipo da esquadria")).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const panel = page.getByRole("complementary", {
      name: "Propriedades do vão",
    });
    expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `.tools/m9-garage-${info.project.name}-${width}.png`,
    });
    await page.getByLabel("Tipo da esquadria").selectOption("swing");
    await settled(page);
    await choose(page, copied.model.openings[6].id);
    await page.getByLabel("Tipo da esquadria").selectOption("swing");
    await settled(page);
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    await page.screenshot({
      path: `.tools/m9-vertical-${info.project.name}-${width}.png`,
    });
  }
});
