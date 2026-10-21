import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  createProject,
  makeWall,
  type Project,
} from "../../src/domain/project";
import { parseFile } from "../../src/persistence/files";

async function open(page: Page, wall = false, terrain = false) {
  await page.addInitScript(() => {
    const contexts = new Map<HTMLCanvasElement, string[]>();
    const clear = CanvasRenderingContext2D.prototype.clearRect,
      fill = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      contexts.set(this.canvas, []);
      return clear.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.fillText = function (...args) {
      const texts = contexts.get(this.canvas) ?? [];
      texts.push(args[0]);
      contexts.set(this.canvas, texts);
      return fill.apply(this, args);
    };
    Object.assign(window, {
      drawnTexts: () =>
        [...contexts.entries()]
          .filter(([canvas]) => canvas.isConnected)
          .flatMap(([, texts]) => texts),
    });
  });
  await page.goto("/");
  const d = createProject("M7 Medidas independentes", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  if (terrain) {
    d.model.terrain = {
      id: crypto.randomUUID(),
      material: "soft",
      revision: 1,
      textureOrigin: { x: 0, y: 0 },
      contour: [
        { x: 0, y: 0 },
        { x: 40000, y: 0 },
        { x: 40000, y: 30000 },
        { x: 20000, y: 20000 },
        { x: 0, y: 30000 },
      ],
    };
    d.model.floors.push({
      ...d.model.floors[0],
      id: crypto.randomUUID(),
      name: "Superior",
      level: 28000,
    });
  }
  if (wall)
    d.model.walls.push(
      makeWall(
        { x: 0, y: 0 },
        { x: 30000, y: 0 },
        1250,
        d.model.floors[0].id,
        28000,
        1,
      )!,
    );
  await page.getByTestId("import-file").setInputFiles({
    name: "medidas.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function state(page: Page): Promise<Project> {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    return (await import(path)).useStore.getState().doc;
  });
}
async function point(page: Page, x: number, y: number) {
  const el = page.getByTestId("drawing"),
    box = (await el.boundingBox())!;
  const c = JSON.parse((await el.getAttribute("data-camera"))!);
  return { x: box.x + c.x + x * c.scale, y: box.y + c.y + y * c.scale };
}
async function drag(page: Page, a: [number, number], b: [number, number]) {
  const from = await point(page, ...a),
    to = await point(page, ...b);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function createMeasurement(
  page: Page,
  a: [number, number],
  b: [number, number],
  line: [number, number] = b,
) {
  const before = (await state(page)).model.measurements;
  const from = await point(page, ...a),
    to = await point(page, ...b);
  await page.mouse.click(from.x, from.y);
  expect((await state(page)).model.measurements).toEqual(before);
  await expect(page.getByText(/^Clique no ponto final ·/)).toBeVisible();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  expect((await state(page)).model.measurements).toEqual(before);
  await page.mouse.click(to.x, to.y);
  expect((await state(page)).model.measurements).toEqual(before);
  await expect(
    page.getByText(/^Clique para posicionar a linha da cota ·/),
  ).toBeVisible();
  const position = await point(page, ...line);
  await page.mouse.move(position.x, position.y, { steps: 4 });
  expect((await state(page)).model.measurements).toEqual(before);
  await page.mouse.click(position.x, position.y);
  await expect
    .poll(async () => (await state(page)).model.measurements.length)
    .toBe(before.length + 1);
  await expect(page.getByRole("status")).toContainText("Salvo");
}
const measure = (page: Page) =>
  page.getByRole("button", { name: "Medida", exact: true });
async function texts(page: Page) {
  return page.evaluate(() =>
    (window as unknown as { drawnTexts: () => string[] }).drawnTexts(),
  );
}

test("M7 encaixa criação e alças nos vértices do terreno, com Alt e zoom em outro pavimento", async ({
  page,
}) => {
  await open(page, false, true);
  const before = await state(page);
  const near = async (x: number, y: number): Promise<[number, number]> => {
    const camera = JSON.parse(
      (await page.getByTestId("drawing").getAttribute("data-camera"))!,
    );
    return [x + 6 / camera.scale, y];
  };
  await measure(page).click();
  await createMeasurement(
    page,
    await near(0, 0),
    await near(40000, 30000),
    [20000, 5000],
  );
  let m = (await state(page)).model.measurements[0];
  expect(m.a).toEqual({ x: 0, y: 0 });
  expect(m.b).toEqual({ x: 40000, y: 30000 });
  await page.getByRole("button", { name: "Selecionar", exact: true }).click();
  await drag(page, [m.b.x, m.b.y], await near(20000, 20000));
  m = (await state(page)).model.measurements[0];
  expect(m.a).toEqual({ x: 0, y: 0 });
  expect(m.b).toEqual({ x: 20000, y: 20000 });
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await state(page)).model.measurements[0].b).toEqual({
    x: 40000,
    y: 30000,
  });
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(before.model.floors[1].id);
  const zoomAt = await point(page, 20000, 15000);
  await page.mouse.move(zoomAt.x, zoomAt.y);
  await page.mouse.wheel(0, -120);
  await measure(page).click();
  await createMeasurement(
    page,
    await near(0, 30000),
    await near(40000, 0),
    [20000, 5000],
  );
  const upper = (await state(page)).model.measurements.find(
    (m) => m.floorId === before.model.floors[1].id,
  )!;
  expect(upper.a).toEqual({ x: 0, y: 30000 });
  expect(upper.b).toEqual({ x: 40000, y: 0 });
  await page.keyboard.down("Alt");
  await createMeasurement(
    page,
    await near(0, 0),
    await near(20000, 20000),
    [20000, 10000],
  );
  await page.keyboard.up("Alt");
  const free = (await state(page)).model.measurements.at(-1)!;
  expect(free.a).not.toEqual({ x: 0, y: 0 });
  expect(free.b).not.toEqual({ x: 20000, y: 20000 });
  const saved = await state(page);
  expect(saved.model.terrain).toEqual(before.model.terrain);
  expect(saved.generated).toEqual(before.generated);
  // Moving a referenced terrain later does not move the confirmed measurements.
  await page.evaluate(async () => {
    const path = "/src/state/store.ts",
      s = (await import(path)).useStore.getState(),
      d = s.doc;
    await s.commit(
      {
        ...d,
        model: {
          ...d.model,
          terrain: {
            ...d.model.terrain,
            contour: d.model.terrain.contour.map(
              (p: { x: number; y: number }) => ({
                x: p.x + 1000,
                y: p.y + 1000,
              }),
            ),
          },
        },
      },
      "terrain",
    );
  });
  expect((await state(page)).model.measurements).toEqual(
    saved.model.measurements,
  );
});

test("M7 diagonal livre, seleção, corpo/alças, histórico, preferências e transporte", async ({
  page,
}) => {
  await open(page);
  const before = await state(page);
  await measure(page).click();
  await createMeasurement(page, [500, 2500], [30500, 42500]);
  let d = await state(page);
  expect(d.model.measurements).toHaveLength(1);
  expect(d.model.measurements[0].a).toEqual({ x: 500, y: 2500 });
  expect(d.model.measurements[0].b).toEqual({ x: 30500, y: 42500 });
  expect(d.generated).toEqual(before.generated);
  await expect.poll(() => texts(page)).toContain("500 cm");
  await page.getByRole("button", { name: "Selecionar", exact: true }).click();
  await drag(page, [15500, 22500], [18000, 25000]);
  d = await state(page);
  expect(d.model.measurements[0].a).toEqual({ x: 3000, y: 5000 });
  expect(d.model.measurements[0].b).toEqual({ x: 33000, y: 45000 });
  await drag(page, [33000, 45000], [43000, 35000]);
  await expect.poll(() => texts(page)).toContain("500 cm");
  expect((await state(page)).model.measurements[0].b).toEqual({
    x: 43000,
    y: 35000,
  });
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await state(page)).model.measurements[0].b).toEqual({
    x: 33000,
    y: 45000,
  });
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption((await state(page)).model.measurements[0].id);
  await expect(
    page.getByRole("complementary", { name: "Propriedades da medida" }),
  ).toContainText("500 cm");
  await page
    .getByRole("button", { name: "Preferências do Ecovit", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "Medidas", exact: true }).uncheck();
  await page.keyboard.press("Escape");
  await expect
    .poll(async () => (await texts(page)).includes("500 cm"))
    .toBe(false);
  const hiddenStart = await point(page, 23000, 20000);
  const beforeClick = await state(page);
  await page.mouse.move(hiddenStart.x, hiddenStart.y);
  await page.mouse.down();
  await expect
    .poll(async () => (await texts(page)).includes("500 cm"))
    .toBe(false);
  await page.mouse.up();
  expect(await state(page)).toEqual(beforeClick);
  await page.mouse.down();
  await page.mouse.move(hiddenStart.x + 30, hiddenStart.y, { steps: 4 });
  await expect
    .poll(async () => (await texts(page)).includes("500 cm"))
    .toBe(true);
  await page.mouse.up();
  await expect(page.getByRole("status")).toContainText("Salvo");
  await expect
    .poll(async () => (await texts(page)).includes("500 cm"))
    .toBe(false);
  await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  const output = parseFile(
    await readFile((await (await download).path())!, "utf8"),
  );
  expect(output.schemaVersion).toBe(18);
  expect(output.model.measurements).toEqual(
    (await state(page)).model.measurements,
  );
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect(measure(page)).toHaveCount(0);
  await expect
    .poll(async () => (await texts(page)).includes("500 cm"))
    .toBe(false);
  await page.reload();
  await page
    .getByRole("button", { name: /M7 Medidas independentes/ })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await state(page)).model.measurements).toEqual(
    output.model.measurements,
  );
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(output.model.measurements[0].id);
  await page
    .getByRole("button", { name: "Excluir medida", exact: true })
    .click();
  await expect
    .poll(async () => (await state(page)).model.measurements.length)
    .toBe(0);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect
    .poll(async () => (await state(page)).model.measurements.length)
    .toBe(1);
});

test("M7 atração inicial/final, Alt, cancelamentos e independência da parede", async ({
  page,
}) => {
  await open(page, true);
  await measure(page).click();
  await createMeasurement(page, [10000, 500], [20000, 500]);
  expect((await state(page)).model.measurements[0]).toMatchObject({
    a: { x: 10000, y: 0 },
    b: { x: 20000, y: 0 },
  });
  await page.getByRole("button", { name: "Selecionar", exact: true }).click();
  const blank = await point(page, 45000, 25000);
  await page.mouse.click(blank.x, blank.y);
  await measure(page).click();
  await page.keyboard.down("Alt");
  await createMeasurement(page, [10000, 500], [20000, 500]);
  await page.keyboard.up("Alt");
  expect((await state(page)).model.measurements[1]).toMatchObject({
    a: { x: 10000, y: 500 },
    b: { x: 20000, y: 500 },
  });
  const saved = (await state(page)).model.measurements;
  await page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const { useStore } = await import(path);
    const d = useStore.getState().doc;
    await useStore
      .getState()
      .commit({ ...d, model: { ...d.model, walls: [] } });
  });
  expect((await state(page)).model.measurements).toEqual(saved);
  const start = await point(page, 40000, 10000),
    end = await point(page, 50000, 20000);
  for (const cancel of ["escape", "blur", "outside"]) {
    await measure(page).click();
    await page.mouse.click(start.x, start.y);
    await page.mouse.move(end.x, end.y);
    if (cancel === "escape") await page.keyboard.press("Escape");
    else if (cancel === "blur")
      await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    else await page.mouse.click(2, 2);
    expect((await state(page)).model.measurements).toEqual(saved);
  }
});

test("M7 três cliques, prévia sem gravação, ponto coincidente e navegação", async ({
  page,
}) => {
  await open(page);
  await measure(page).click();
  const before = await state(page);
  await drag(page, [500, 2500], [30500, 42500]);
  expect(await state(page)).toEqual(before);
  await expect.poll(() => texts(page)).toContain("500 cm");
  await expect(page.getByText(/^Clique no ponto final ·/)).toBeVisible();
  const start = await point(page, 500, 2500);
  await page.mouse.click(start.x, start.y);
  expect(await state(page)).toEqual(before);
  await expect(page.getByText(/^Clique no ponto final ·/)).toBeVisible();
  const scale = JSON.parse(
    (await page.getByTestId("drawing").getAttribute("data-camera"))!,
  ).scale;
  await page.mouse.wheel(0, -100);
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.getByTestId("drawing").getAttribute("data-camera"))!,
        ).scale,
    )
    .not.toBe(scale);
  const end = await point(page, 30500, 42500);
  await page.mouse.click(end.x, end.y);
  expect(await state(page)).toEqual(before);
  await expect(
    page.getByText(/^Clique para posicionar a linha da cota ·/),
  ).toBeVisible();
  await page.mouse.click(end.x, end.y);
  await expect
    .poll(async () => (await state(page)).model.measurements.length)
    .toBe(1);
  const created = (await state(page)).model.measurements[0];
  expect(created.a).toEqual({ x: 500, y: 2500 });
  const zoomedScale = JSON.parse(
    (await page.getByTestId("drawing").getAttribute("data-camera"))!,
  ).scale;
  // Browser clicks use whole screen pixels; after zoom, world coordinates
  // need not land on the exact free point used to calculate that pixel.
  expect(
    Math.hypot(created.b.x - 30500, created.b.y - 42500) * zoomedScale,
  ).toBeLessThanOrEqual(Math.SQRT2);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await state(page)).model.measurements).toHaveLength(0);
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  expect((await state(page)).model.measurements).toHaveLength(1);
  await measure(page).click();
  const next = await point(page, 40000, 10000);
  await page.mouse.click(next.x, next.y);
  await page.keyboard.press("Escape");
  await measure(page).click();
  await createMeasurement(page, [40000, 10000], [50000, 20000]);
});

test("M7 cota afastada: três cliques, seleção da linha visível, histórico e transporte", async ({
  page,
}, info) => {
  await open(page, true);
  const before = await state(page);
  const history = () =>
    page.evaluate(async () => {
      const path = "/src/state/store.ts";
      return (await import(path)).useStore.getState().history.past.length;
    });
  const count = await history();
  await measure(page).click();
  await createMeasurement(page, [5000, 0], [25000, 0], [20000, -6000]);
  const m = (await state(page)).model.measurements[0];
  expect(m).toMatchObject({
    a: { x: 5000, y: 0 },
    b: { x: 25000, y: 0 },
    offset: -6000,
  });
  expect(await history()).toBe(count + 1);
  expect((await state(page)).generated).toEqual(before.generated);
  await expect.poll(() => texts(page)).toContain("200 cm");
  await page.screenshot({ path: `.tools/m7-offset-${info.project.name}.png` });
  await page.getByRole("button", { name: "Selecionar", exact: true }).click();
  await drag(page, [15000, -6000], [16000, -5000]);
  expect((await state(page)).model.measurements[0]).toMatchObject({
    a: { x: 6000, y: 1000 },
    b: { x: 26000, y: 1000 },
    offset: -6000,
  });
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await state(page)).model.measurements).toEqual([m]);
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  const moved = (await state(page)).model.measurements;
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  const output = parseFile(
    await readFile((await (await download).path())!, "utf8"),
  );
  expect(output.model.measurements).toEqual(moved);
  await page.reload();
  await page
    .getByRole("button", { name: /M7 Medidas independentes/ })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await state(page)).model.measurements).toEqual(moved);
});

test("M7 afastamento transitório cancela sem histórico e permite escolher qualquer lado", async ({
  page,
}) => {
  await open(page);
  const before = await state(page);
  for (const action of ["escape", "blur", "outside", "mode"]) {
    await measure(page).click();
    const a = await point(page, 10000, 15000),
      b = await point(page, 30000, 15000),
      c = await point(page, 20000, 5000);
    await page.mouse.click(a.x, a.y);
    await page.mouse.click(b.x, b.y);
    await page.mouse.move(c.x, c.y);
    await expect(
      page.getByText(/^Clique para posicionar a linha da cota ·/),
    ).toBeVisible();
    expect(await state(page)).toEqual(before);
    if (action === "escape") await page.keyboard.press("Escape");
    if (action === "blur")
      await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    if (action === "outside") await page.mouse.click(2, 2);
    if (action === "mode") {
      await page.getByRole("button", { name: "Fiada", exact: true }).click();
      await page.getByRole("button", { name: "Planta", exact: true }).click();
    }
    expect(await state(page)).toEqual(before);
  }
  await measure(page).click();
  await createMeasurement(page, [10000, 10000], [30000, 10000], [20000, 15000]);
  expect((await state(page)).model.measurements[0].offset).toBe(5000);
});

test("M7 pavimentos, somente leitura e apresentação nas três resoluções", async ({
  page,
  context,
}, info) => {
  await open(page);
  await measure(page).click();
  await createMeasurement(page, [500, 2500], [30500, 42500], [5000, 20000]);
  await page.evaluate(async () => {
    const path = "/src/state/store.ts",
      floors = "/src/domain/floors.ts";
    const { useStore } = await import(path);
    const { duplicateFloor } = await import(floors);
    const d = useStore.getState().doc;
    await useStore
      .getState()
      .commit(
        duplicateFloor(d, d.model.floors[0].id, 28000, "Superior"),
        "floor",
      );
  });
  expect((await state(page)).model.measurements).toHaveLength(2);
  expect((await state(page)).model.measurements[1].offset).toBe(
    (await state(page)).model.measurements[0].offset,
  );
  await page.getByRole("button", { name: "Selecionar", exact: true }).click();
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption((await state(page)).model.measurements[1].id);
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    await expect(page.getByTestId("composition-status")).toBeInViewport();
    await expect(measure(page)).toBeInViewport();
    const buttonBox = (await measure(page).boundingBox())!;
    const iconBox = (await measure(page).locator("svg").boundingBox())!;
    const inset = await measure(page).evaluate((node) => {
      const css = getComputedStyle(node);
      return parseFloat(css.paddingLeft) + parseFloat(css.borderLeftWidth);
    });
    expect(Math.abs(iconBox.x - buttonBox.x - inset)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(
        iconBox.y + iconBox.height / 2 - buttonBox.y - buttonBox.height / 2,
      ),
    ).toBeLessThanOrEqual(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.tools/m7-${info.project.name}-${width}.png`,
    });
    await page
      .getByRole("button", { name: "Preferências do Ecovit", exact: true })
      .click();
    await expect(
      page.getByRole("checkbox", { name: "Medidas", exact: true }),
    ).toBeInViewport();
    await page.screenshot({
      path: `.tools/m7-preferences-${info.project.name}-${width}.png`,
    });
    await page.keyboard.press("Escape");
  }
  const second = await context.newPage();
  await second.goto("/");
  await second
    .getByRole("button", { name: /M7 Medidas independentes/ })
    .first()
    .click();
  await expect(second.getByRole("status")).toContainText("Somente leitura");
  await expect(measure(second)).toBeDisabled();
  const m = (await state(second)).model.measurements[0];
  await second
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(m.id);
  await expect(
    second.getByRole("button", { name: "Excluir medida", exact: true }),
  ).toBeDisabled();
  await second.close();
});
