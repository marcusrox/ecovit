import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createProject, type Project } from "../../src/domain/project";
import { terrainArea, terrainAreaText } from "../../src/domain/terrain";
import { parseFile } from "../../src/persistence/files";

const panel = (page: Page) =>
  page.getByRole("complementary", { name: "Propriedades do terreno" });
async function state(page: Page): Promise<Project> {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    return (await import(path)).useStore.getState().doc;
  });
}
async function history(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    return (await import(path)).useStore.getState().history.past.length;
  });
}
async function instrument(page: Page) {
  await page.addInitScript(() => {
    const texts = new Map<HTMLCanvasElement, string[]>();
    const positions = new Map<HTMLCanvasElement, { x: number; y: number }[]>();
    const clear = CanvasRenderingContext2D.prototype.clearRect,
      fill = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      texts.set(this.canvas, []);
      positions.set(this.canvas, []);
      return clear.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.fillText = function (...args) {
      const list = texts.get(this.canvas) ?? [];
      list.push(args[0]);
      if (args[0].startsWith("Terreno ·")) {
        const points = positions.get(this.canvas) ?? [];
        points.push({ x: args[1], y: args[2] });
        positions.set(this.canvas, points);
      }
      texts.set(this.canvas, list);
      return fill.apply(this, args);
    };
    const transforms: number[][] = [];
    const transform = CanvasPattern.prototype.setTransform;
    CanvasPattern.prototype.setTransform = function (matrix) {
      if (matrix)
        transforms.push([
          matrix.a ?? 1,
          matrix.d ?? 1,
          matrix.e ?? 0,
          matrix.f ?? 0,
        ]);
      return transform.call(this, matrix);
    };
    Object.assign(window, {
      terrainTexts: () =>
        [...texts.entries()]
          .filter(([canvas]) => canvas.isConnected)
          .flatMap(([, text]) => text),
      terrainLabelPositions: () =>
        [...positions.entries()]
          .filter(([canvas]) => canvas.isConnected)
          .flatMap(([, points]) => points),
      terrainTransforms: transforms,
    });
  });
}
async function open(
  page: Page,
  doc = createProject("M11 Terreno", {
    length: 2500,
    width: 1250,
    height: 700,
  }),
) {
  await instrument(page);
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "terreno.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(doc)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function point(page: Page, x: number, y: number) {
  const host = page.getByTestId("drawing"),
    box = (await host.boundingBox())!;
  const c = JSON.parse((await host.getAttribute("data-camera"))!);
  return { x: box.x + c.x + x * c.scale, y: box.y + c.y + y * c.scale };
}
async function click(page: Page, x: number, y: number) {
  const p = await point(page, x, y);
  await page.mouse.click(p.x, p.y);
}
async function move(page: Page, x: number, y: number) {
  const p = await point(page, x, y);
  await page.mouse.move(p.x, p.y, { steps: 5 });
}
async function drag(page: Page, a: [number, number], b: [number, number]) {
  await move(page, ...a);
  await page.mouse.down();
  await move(page, ...b);
  await page.mouse.up();
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function texts(page: Page) {
  return page.evaluate(() =>
    (window as unknown as { terrainTexts: () => string[] }).terrainTexts(),
  );
}
async function draw(page: Page) {
  await page.getByRole("button", { name: "Terreno", exact: true }).click();
  for (const [x, y] of [
    [0, 0],
    [40000, 0],
    [40000, 30000],
    [0, 30000],
    [0, 0],
  ])
    await click(page, x, y);
  await expect(panel(page)).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Salvo");
}

test("M11 desenho livre com medida dinâmica, fechamento, label e cancelamento sem resíduos", async ({
  page,
}) => {
  await open(page);
  const count = await history(page);
  await page.getByRole("button", { name: "Terreno", exact: true }).click();
  await click(page, 0, 0);
  await move(page, 30000, 40000);
  await expect.poll(() => texts(page)).toContain("500 cm");
  expect((await state(page)).model.terrain).toBeNull();
  expect(await history(page)).toBe(count);
  await page.keyboard.press("Escape");
  expect((await state(page)).model.terrain).toBeNull();
  await draw(page);
  expect(await history(page)).toBe(count + 1);
  await expect(panel(page)).toContainText("12,00 m²");
  await expect.poll(() => texts(page)).toContain("Terreno · 12,00 m²");
  const terrain = (await state(page)).model.terrain!;
  await click(page, 18000, 16000);
  await drag(page, [18000, 16000], [20000, 18000]);
  expect((await state(page)).model.terrain).toEqual(terrain);
  await panel(page)
    .getByRole("button", { name: "Ajustar", exact: true })
    .click();
  await move(page, 40000, 30000);
  await page.mouse.down();
  await move(page, 10000, 0);
  expect((await state(page)).model.terrain).toEqual(terrain);
  await page.mouse.up();
  expect((await state(page)).model.terrain).toEqual(terrain);
  await drag(page, [40000, 30000], [40000, 40000]);
  const edited = (await state(page)).model.terrain!;
  // Native mouse events round client pixels; allow less than one screen pixel.
  expect(Math.abs(edited.contour[2].y - 40000)).toBeLessThan(100);
  expect(terrainArea(edited.contour)).toBeCloseTo(14, 1);
  await expect(panel(page)).toContainText(terrainAreaText(edited.contour));
  await expect
    .poll(() => texts(page))
    .toContain(`Terreno · ${terrainAreaText(edited.contour)}`);
  // An active edit is canceled before undo travels through confirmed history.
  const h = await history(page);
  await page.keyboard.press("Control+z");
  expect(await history(page)).toBe(h);
  await page.keyboard.press("Control+z");
  expect((await state(page)).model.terrain).toEqual(terrain);
  await page.keyboard.press("Control+y");
  expect((await state(page)).model.terrain).toEqual(edited);
});

test("M11 materiais, movimento, pavimentos, arquivo e somente leitura", async ({
  page,
  context,
}, info) => {
  const d = createProject("M11 Compartilhado", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  d.model.floors.push({
    ...d.model.floors[0],
    id: crypto.randomUUID(),
    name: "Superior",
    level: 28000,
  });
  await open(page, d);
  await draw(page);
  const original = await state(page),
    generated = original.generated;
  for (const name of [
    "Terra",
    "Areia",
    "Brita",
    "Piso intertravado",
    "Grama",
    "Verde suave",
  ]) {
    await panel(page).getByRole("button", { name, exact: true }).click();
    await expect(
      panel(page).getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("status")).toContainText("Salvo");
    expect((await state(page)).generated).toEqual(generated);
    await page.screenshot({ path: info.outputPath(`material-${name}.png`) });
  }
  await panel(page)
    .getByRole("button", { name: "Ajustar", exact: true })
    .click();
  await drag(page, [20000, 15000], [25000, 18000]);
  expect((await state(page)).model.terrain!.textureOrigin).toEqual({
    x: 5000,
    y: 3000,
  });
  await panel(page).getByRole("button", { name: "Concluir ajuste" }).click();
  const moved = (await state(page)).model.terrain;
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(d.model.floors[1].id);
  await page.getByRole("button", { name: "Terreno", exact: true }).click();
  await expect(panel(page)).toContainText("12,00 m²");
  expect((await state(page)).model.terrain).toEqual(moved);
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect.poll(() => texts(page)).not.toContain("Terreno · 12,00 m²");
  await page.getByRole("button", { name: "Planta", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  const file = await download;
  const text = await readFile((await file.path())!, "utf8");
  expect(parseFile(text).model.terrain).toEqual(moved);
  await page.reload();
  await page
    .getByRole("button", { name: /M11 Compartilhado/ })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await state(page)).model.terrain).toEqual(moved);
  const other = await context.newPage();
  await other.goto("/");
  await other
    .getByRole("button", { name: /M11 Compartilhado/ })
    .first()
    .click();
  await expect(other.getByRole("status")).toContainText("Somente leitura");
  await other.getByRole("button", { name: "Terreno", exact: true }).click();
  await expect(
    panel(other).getByRole("button", { name: "Ajustar", exact: true }),
  ).toBeDisabled();
  await other.close();
  await page.getByRole("button", { name: "Terreno", exact: true }).click();
  await panel(page).getByRole("button", { name: "Excluir terreno" }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await state(page)).model.terrain).toBeNull();
  await page.keyboard.press("Control+z");
  expect((await state(page)).model.terrain).toEqual(moved);
});

test("M11 escala real de textura e revisão responsiva", async ({
  page,
}, info) => {
  await open(page);
  await draw(page);
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
            contour: [
              { x: 0, y: 0 },
              { x: 50000, y: 0 },
              { x: 50000, y: 50000 },
              { x: 0, y: 50000 },
            ],
          },
        },
      },
      "terrain",
    );
  });
  await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
  const transform = async () =>
    page.evaluate(() =>
      (
        window as unknown as { terrainTransforms: number[][] }
      ).terrainTransforms.at(-1)!,
    );
  const getScale = async () =>
    JSON.parse((await page.getByTestId("drawing").getAttribute("data-camera"))!)
      .scale;
  await expect
    .poll(async () => (await transform())[0] / (await getScale()))
    .toBeCloseTo(50); // 40,000 world units / 800 tile pixels
  // Expand a ring through the domain/store, observing the actual CanvasPattern transform.
  await page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const s = (await import(path)).useStore.getState();
    const d = s.doc,
      t = d.model.terrain;
    await s.commit(
      {
        ...d,
        model: {
          ...d.model,
          terrain: {
            ...t,
            contour: [
              { x: 0, y: 0 },
              { x: 500000, y: 0 },
              { x: 500000, y: 500000 },
              { x: 0, y: 500000 },
            ],
          },
        },
      },
      "terrain",
    );
  });
  await expect
    .poll(async () => (await transform())[0] / (await getScale()))
    .toBeCloseTo(50);
  await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
  await page.getByRole("button", { name: "Terreno", exact: true }).click();
  await expect(panel(page)).toContainText("2.500,00 m²");
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    await expect(
      panel(page).getByRole("button", { name: "Ajustar", exact: true }),
    ).toBeVisible();
    expect(
      await panel(page).evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    const box = (await page.getByTestId("drawing").boundingBox())!;
    const first = await point(page, 0, 0),
      last = await point(page, 500000, 500000);
    expect(first.x).toBeGreaterThan(box.x);
    expect(first.y).toBeGreaterThan(box.y);
    expect(last.x).toBeLessThan(box.x + box.width);
    expect(last.y).toBeLessThan(box.y + box.height);
    await panel(page)
      .getByRole("button", { name: "Ajustar", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`terreno-${width}.png`) });
  }
});

test("M11 referência opaca/translúcida sobre a textura, seleção e ajuste por cima", async ({
  page,
}) => {
  await open(page);
  await draw(page);
  await page.evaluate(async () => {
    const path = "/src/state/store.ts",
      s = (await import(path)).useStore.getState();
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 400, 300);
    await s.commit(
      {
        ...s.doc,
        model: {
          ...s.doc.model,
          referenceImages: [
            {
              floorId: s.activeFloorId,
              name: "referencia.png",
              mime: "image/png",
              data: canvas.toDataURL().split(",")[1],
              width: 400,
              height: 300,
              x: 0,
              y: 0,
              scale: 100,
              angle: 0,
              opacity: 1,
              visible: true,
            },
          ],
        },
      },
      "image",
    );
  });
  const sample = async () =>
    page.getByTestId("drawing").evaluate((host) => {
      const c = JSON.parse(host.getAttribute("data-camera")!),
        x = c.x + 10543 * c.scale,
        y = c.y + 7311 * c.scale;
      const canvas = document.createElement("canvas");
      canvas.width = host.clientWidth;
      canvas.height = host.clientHeight;
      const ctx = canvas.getContext("2d")!;
      for (const layer of host.querySelectorAll(".konvajs-content canvas")) {
        ctx.drawImage(
          layer as HTMLCanvasElement,
          0,
          0,
          (layer as HTMLElement).clientWidth,
          (layer as HTMLElement).clientHeight,
        );
      }
      return [...ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data];
    });
  await expect.poll(sample).toEqual([255, 255, 255, 255]);
  await page.getByRole("button", { name: "Terreno", exact: true }).click();
  await expect(panel(page)).toBeVisible();
  await panel(page)
    .getByRole("button", { name: "Ajustar", exact: true })
    .click();
  await drag(page, [40000, 30000], [40000, 40000]);
  const adjusted = (await state(page)).model.terrain!;
  expect(terrainArea(adjusted.contour)).toBeCloseTo(14, 1);
  await expect(panel(page)).toContainText(terrainAreaText(adjusted.contour));
  await panel(page).getByRole("button", { name: "Concluir ajuste" }).click();
  await page.evaluate(async () => {
    const path = "/src/state/store.ts",
      s = (await import(path)).useStore.getState(),
      d = s.doc;
    await s.commit(
      {
        ...d,
        model: {
          ...d.model,
          referenceImages: d.model.referenceImages.map((r: object) => ({
            ...r,
            opacity: 0.5,
          })),
        },
      },
      "image",
    );
  });
  await expect.poll(async () => (await sample())[0]).toBeLessThan(245);
  const visible = await sample();
  expect(visible[0]).toBeGreaterThan(140);
  expect(visible[3]).toBe(255);
  expect(
    Math.abs((await state(page)).model.terrain!.contour[2].y - 40000),
  ).toBeLessThan(100);
});

test("M11 cancelamento por blur, fora, troca de pavimento e terreno inválido na importação", async ({
  page,
}) => {
  const d = createProject("M11 Cancelamento", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  d.model.floors.push({
    ...d.model.floors[0],
    id: crypto.randomUUID(),
    name: "Superior",
    level: 28000,
  });
  await open(page, d);
  for (const cancel of ["blur", "outside", "floor", "undo"]) {
    await page.getByRole("button", { name: "Terreno", exact: true }).click();
    await click(page, 0, 0);
    await click(page, 40000, 0);
    if (cancel === "blur")
      await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    if (cancel === "outside")
      await page
        .getByRole("textbox", { name: "Nome do projeto", exact: true })
        .click();
    await page
      .getByTestId("drawing")
      .click({ position: { x: 20, y: 20 }, button: "right" });
    if (cancel === "floor")
      await page
        .getByLabel("Pavimento", { exact: true })
        .selectOption(d.model.floors[1].id);
    if (cancel === "undo") await page.keyboard.press("Control+z");
    expect((await state(page)).model.terrain).toBeNull();
    expect(await history(page)).toBe(0);
  }
  await draw(page);
  const saved = await state(page);
  const bad = {
    ...saved,
    model: {
      ...saved.model,
      terrain: { ...saved.model.terrain, revision: 99 },
    },
  };
  await page.getByTestId("import-file").setInputFiles({
    name: "invalido.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(bad)),
  });
  expect((await state(page)).model.terrain).toEqual(saved.model.terrain);
});

test("M11 contorno côncavo com diagonal conserva área e recorta a textura", async ({
  page,
}, info) => {
  await open(page);
  await page.getByRole("button", { name: "Terreno", exact: true }).click();
  for (const [x, y] of [
    [0, 0],
    [40000, 0],
    [50000, 10000],
    [10000, 10000],
    [10000, 30000],
    [40000, 30000],
    [40000, 40000],
    [0, 40000],
    [0, 0],
  ])
    await click(page, x, y);
  await expect(panel(page)).toContainText("10,50 m²");
  await expect.poll(() => texts(page)).toContain("Terreno · 10,50 m²");
  const coverage = await page.getByTestId("drawing").evaluate((host) => {
    const c = JSON.parse(host.getAttribute("data-camera")!);
    const layer = host.querySelector(
      ".konvajs-content canvas",
    ) as HTMLCanvasElement;
    const ratio = layer.width / layer.clientWidth;
    const alpha = (x: number, y: number) =>
      layer
        .getContext("2d")!
        .getImageData(
          Math.round((c.x + x * c.scale) * ratio),
          Math.round((c.y + y * c.scale) * ratio),
          1,
          1,
        ).data[3];
    return [alpha(5000, 20000), alpha(30000, 20000)];
  });
  expect(coverage).toEqual([255, 0]);
  await page.screenshot({ path: info.outputPath("terreno-concavo.png") });
});

for (const [width, height] of [
  [1366, 768],
  [1280, 720],
  [900, 680],
]) {
  test(`M11 Verde suave: preenchimento liso e controles em ${width}×${height}`, async ({
    page,
  }, info) => {
    await open(page);
    await draw(page);
    await page.setViewportSize({ width, height });
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    const before = await state(page);
    const button = panel(page).getByRole("button", {
      name: "Verde suave",
      exact: true,
    });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("status")).toContainText("Salvo");
    expect((await state(page)).model.terrain).toEqual({
      ...before.model.terrain,
      material: "soft",
    });
    expect((await state(page)).generated).toEqual(before.generated);
    const preview = await button.locator("canvas").evaluate((canvas) => {
      const ctx = (canvas as HTMLCanvasElement).getContext("2d")!;
      return [...ctx.getImageData(32, 20, 1, 1).data];
    });
    expect(preview).toEqual([238, 243, 232, 255]);
    await page.getByRole("button", { name: "Desfazer", exact: true }).click();
    await page.getByRole("button", { name: "Terreno", exact: true }).click();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    expect((await state(page)).model.terrain!.material).toBe("grass");
    await page.getByRole("button", { name: "Refazer", exact: true }).click();
    await page.getByRole("button", { name: "Terreno", exact: true }).click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    const samples = () =>
      page.getByTestId("drawing").evaluate((host) => {
        const camera = JSON.parse(host.getAttribute("data-camera")!);
        const canvas = host.querySelector<HTMLCanvasElement>(
          ".konvajs-content canvas",
        )!;
        const ratio = canvas.width / canvas.clientWidth;
        const ctx = canvas.getContext("2d")!;
        return [
          [10543, 7311],
          [27432, 21321],
          [-1000, -1000],
        ].map(([x, y]) => [
          ...ctx.getImageData(
            Math.floor((camera.x + x * camera.scale) * ratio),
            Math.floor((camera.y + y * camera.scale) * ratio),
            1,
            1,
          ).data,
        ]);
      });
    await expect.poll(samples).toEqual([
      [238, 243, 232, 255],
      [238, 243, 232, 255],
      [0, 0, 0, 0],
    ]);
    expect(
      await panel(page).evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      panel(page).getByRole("button", { name: "Ajustar", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath(`verde-suave-${width}.png`),
    });
  });
}

test("M11 rótulo superior: preferência persistida, prévia, readonly e três resoluções", async ({
  page,
  context,
}, info) => {
  await open(page);
  await draw(page);
  const label = "Terreno · 12,00 m²";
  const snapshot = (target: Page) =>
    target.evaluate(async () => {
      const path = "/src/state/store.ts";
      const { doc, history } = (await import(path)).useStore.getState();
      return JSON.stringify({ doc, history });
    });
  const before = await snapshot(page);
  const preferences = (target: Page) =>
    target.getByRole("button", { name: "Preferências do Ecovit", exact: true });
  const positionError = () =>
    page.getByTestId("drawing").evaluate((host) => {
      const camera = JSON.parse(host.getAttribute("data-camera")!);
      const positions = (
        window as unknown as {
          terrainLabelPositions: () => { x: number; y: number }[];
        }
      ).terrainLabelPositions();
      if (positions.length !== 1) return 1e9;
      return Math.max(
        Math.abs(positions[0].x - (camera.x + 20000 * camera.scale)),
        Math.abs(positions[0].y - (camera.y - 17)),
      );
    });
  await expect.poll(positionError).toBeLessThan(0.01);
  await preferences(page).click();
  const checkbox = page.getByRole("checkbox", { name: "Terreno", exact: true });
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await page.keyboard.press("Escape");
  await expect.poll(() => texts(page)).not.toContain(label);
  expect(await snapshot(page)).toBe(before);
  await page.getByRole("button", { name: "Terreno", exact: true }).click();
  await expect(panel(page)).toContainText("12,00 m²");
  await panel(page)
    .getByRole("button", { name: "Ajustar", exact: true })
    .click();
  const start = await point(page, 20000, 15000);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 20, start.y + 10, { steps: 3 });
  await expect
    .poll(async () =>
      (await texts(page)).some((value) => value.endsWith(" cm")),
    )
    .toBe(true);
  await expect.poll(() => texts(page)).not.toContain(label);
  await page.keyboard.press("Escape");
  await page.mouse.up();
  expect(await snapshot(page)).toBe(before);
  await page.reload();
  await page
    .getByRole("button", { name: /M11 Terreno/ })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  await expect.poll(() => texts(page)).not.toContain(label);
  await preferences(page).click();
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await page.keyboard.press("Escape");
  await expect.poll(() => texts(page)).toContain(label);
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    await expect.poll(positionError).toBeLessThan(0.01);
    await page.screenshot({
      path: `.tools/terrain-label-${info.project.name}-${width}.png`,
    });
    await preferences(page).click();
    await expect(checkbox).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Fechar", exact: true }),
    ).toBeInViewport();
    await page.screenshot({
      path: `.tools/terrain-label-preferences-${info.project.name}-${width}.png`,
    });
    await page.keyboard.press("Escape");
  }
  const other = await context.newPage();
  await instrument(other);
  await other.goto("/");
  await other
    .getByRole("button", { name: /M11 Terreno/ })
    .first()
    .click();
  await expect(other.getByRole("status")).toContainText("Somente leitura");
  const storedSnapshot = () =>
    other.evaluate(async () => {
      const path = "/src/persistence/database.ts";
      return JSON.stringify(
        await (await import(path)).db.table("projects").toArray(),
      );
    });
  const stored = await storedSnapshot();
  const readonlyBefore = await snapshot(other);
  await expect.poll(() => texts(other)).toContain(label);
  await preferences(other).click();
  await other.getByRole("checkbox", { name: "Terreno", exact: true }).uncheck();
  await other.keyboard.press("Escape");
  await expect.poll(() => texts(other)).not.toContain(label);
  expect(await snapshot(other)).toBe(readonlyBefore);
  expect(await storedSnapshot()).toBe(stored);
  await other.close();
});
