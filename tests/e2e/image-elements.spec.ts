import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createProject, type Project } from "../../src/domain/project";
import { imageCatalog } from "../../src/domain/image-catalog";
async function state(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const s = (await import(path)).useStore.getState();
    return {
      doc: s.doc as Project,
      busy: s.busy,
      saved: s.saved,
      history: s.history,
      furnitureDraft: s.furnitureDraft,
      readonly: s.readonly,
    };
  });
}
async function settled(page: Page) {
  await expect
    .poll(async () => {
      const s = await state(page);
      return !s.busy && s.saved === "saved";
    })
    .toBe(true);
}
async function open(page: Page) {
  await page.goto("/");
  const d = createProject("M10 teste", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  await page.getByTestId("import-file").setInputFiles({
    name: "m10.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await settled(page);
}
async function at(page: Page, x: number, y: number) {
  const canvas = page.getByTestId("drawing"),
    box = (await canvas.boundingBox())!,
    camera = JSON.parse((await canvas.getAttribute("data-camera"))!);
  return {
    x: box.x + camera.x + x * camera.scale,
    y: box.y + camera.y + y * camera.scale,
  };
}
async function insert(page: Page, name = "Sofá") {
  await page.getByRole("button", { name: "Mobiliários", exact: true }).click();
  await page.getByLabel("Buscar no acervo").fill(name);
  await page
    .getByRole("button", { name: `Inserir ${name} · Sala`, exact: true })
    .click();
  const p = await at(page, 25000, 20000);
  await page.mouse.move(p.x, p.y);
  await page.mouse.click(p.x, p.y);
  await settled(page);
  const s = await state(page);
  const e = s.doc.model.imageElements.at(-1)!;
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(e.id);
  return e;
}

test("M10 catálogo, inserção/cancelamento, propriedades, histórico e exportação compacta", async ({
  page,
}) => {
  await open(page);
  const initial = await state(page);
  await page.getByRole("button", { name: "Mobiliários", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Mobiliários",
  });
  await expect(dialog.getByRole("button", { name: /^Inserir / })).toHaveCount(
    8,
  );
  await dialog.getByRole("button", { name: "Paisagismo", exact: true }).click();
  await expect(dialog.getByRole("button", { name: /^Inserir / })).toHaveCount(
    4,
  );
  await page.keyboard.press("Escape");
  expect((await state(page)).history).toEqual(initial.history);
  await insert(page);
  const s = await state(page);
  expect(s.doc.generated).toEqual(initial.doc.generated);
  expect(s.doc.model.imageElements).toHaveLength(1);
  const panel = page.getByRole("complementary", {
    name: "Propriedades do mobiliário",
  });
  await panel.getByLabel("Largura (cm)", { exact: true }).fill("300");
  await panel.getByLabel("Rotação (graus)").fill("30");
  await panel.getByRole("button", { name: "Aplicar imagem" }).click();
  await settled(page);
  const edited = (await state(page)).doc.model.imageElements[0];
  expect(edited.width).toBe(30000);
  expect(edited.depth).toBeCloseTo(12000);
  expect(edited.angle).toBe(30);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await settled(page);
  expect((await state(page)).doc.model.imageElements[0].angle).toBe(0);
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  await settled(page);
  expect((await state(page)).doc.model.imageElements[0]).toEqual(edited);
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(edited.id);
  await panel.getByRole("button", { name: "Duplicar imagem" }).click();
  await settled(page);
  expect((await state(page)).doc.model.imageElements).toHaveLength(2);
  await panel.getByRole("button", { name: "Excluir imagem" }).click();
  await settled(page);
  expect((await state(page)).doc.model.imageElements).toHaveLength(1);
  const event = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Baixar projeto", exact: true })
    .click();
  const file = await event;
  const text = await readFile((await file.path())!, "utf8"),
    output = JSON.parse(text);
  expect(output.schemaVersion).toBe(13);
  expect(output.model.customImageAssets).toEqual([]);
  expect(text).not.toContain("data:image");
  expect(Buffer.byteLength(text)).toBeLessThan(10000);
  await page.reload();
  await page
    .getByRole("button", { name: /M10 teste/ })
    .first()
    .click();
  await settled(page);
  expect((await state(page)).doc.model.imageElements).toEqual(
    output.model.imageElements,
  );
});
test("M10 upload reutilizado, invalidez atômica e transporte PNG incorporado", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Mobiliários", exact: true }).click();
  await page.getByText("Imagem personalizada", { exact: true }).click();
  const buffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==",
    "base64",
  );
  await page
    .getByLabel("Arquivo PNG ou JPEG")
    .setInputFiles({ name: "custom.png", mimeType: "image/png", buffer });
  await page.getByLabel("Largura (cm)", { exact: true }).fill("100");
  await page
    .getByRole("button", { name: "Usar custom.png", exact: true })
    .click();
  const p = await at(page, 20000, 20000);
  await page.mouse.move(p.x, p.y);
  await page.mouse.click(p.x, p.y);
  await settled(page);
  let s = await state(page);
  expect(s.doc.model.customImageAssets).toHaveLength(1);
  expect(s.doc.model.imageElements[0].width).toBe(10000);
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(s.doc.model.imageElements[0].id);
  await page.getByRole("button", { name: "Duplicar imagem" }).click();
  await settled(page);
  s = await state(page);
  expect(s.doc.model.imageElements).toHaveLength(2);
  expect(s.doc.model.customImageAssets).toHaveLength(1);
  await page.getByRole("button", { name: "Mobiliários", exact: true }).click();
  await page.getByText("Imagem personalizada", { exact: true }).click();
  await page.getByLabel("Arquivo PNG ou JPEG").setInputFiles({
    name: "bad.png",
    mimeType: "image/png",
    buffer: Buffer.from("broken"),
  });
  await expect(page.getByRole("alert")).toBeVisible();
  await page.keyboard.press("Escape");
  expect((await state(page)).doc).toEqual(s.doc);
  const event = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Baixar projeto", exact: true })
    .click();
  const download = await event;
  const text = await readFile((await download.path())!, "utf8");
  expect(text.split(buffer.toString("base64"))).toHaveLength(2);
  await page.getByTestId("import-file").setInputFiles({
    name: "copy.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(text),
  });
  await settled(page);
  expect((await state(page)).doc.model).toEqual(s.doc.model);
});
test("M10 gestos, cópia por pavimento e ausência de objetos em Fiada", async ({
  page,
}) => {
  await open(page);
  const e = await insert(page);
  await page.getByRole("button", { name: "Selecionar", exact: true }).click();
  const a = await at(page, e.x, e.y);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(a.x + 60, a.y + 30, { steps: 5 });
  await page.mouse.up();
  await settled(page);
  const moved = (await state(page)).doc.model.imageElements[0];
  expect(moved.x).toBeCloseTo(e.x + 5000);
  expect(moved.y).toBeCloseTo(e.y + 2500);
  const corner = await at(
    page,
    moved.x + moved.width / 2,
    moved.y + moved.depth / 2,
  );
  const end = await at(page, moved.x + moved.width, moved.y + moved.depth);
  await page.mouse.move(corner.x, corner.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
  await settled(page);
  const resized = (await state(page)).doc.model.imageElements[0];
  expect(Math.abs(resized.width - moved.width * 1.5) * 0.012).toBeLessThan(1);
  expect(resized.width / resized.depth).toBeCloseTo(
    moved.width / moved.depth,
    10,
  );
  expect(resized.x - resized.width / 2).toBeCloseTo(moved.x - moved.width / 2);
  expect(Math.abs(resized.depth - moved.depth * 1.5) * 0.012).toBeLessThan(1);
  const control = await at(
      page,
      resized.x,
      resized.y - resized.depth / 2 - 24 / 0.012,
    ),
    turn = await at(
      page,
      resized.x + resized.depth / 2 + 24 / 0.012,
      resized.y,
    );
  await page.mouse.move(control.x, control.y);
  await page.mouse.down();
  await page.mouse.move(turn.x, turn.y, { steps: 5 });
  await page.mouse.up();
  await settled(page);
  expect((await state(page)).doc.model.imageElements[0].angle).toBeCloseTo(
    90,
    0,
  );
  const beforeCancel = await state(page);
  await page.getByRole("button", { name: "Mobiliários", exact: true }).click();
  await page
    .getByRole("button", { name: "Inserir Poltrona · Sala", exact: true })
    .click();
  await page.mouse.move(a.x, a.y);
  await page.keyboard.press("Escape");
  expect((await state(page)).doc).toEqual(beforeCancel.doc);
  expect((await state(page)).history).toEqual(beforeCancel.history);
  await page.evaluate(async () => {
    const path = "/src/state/store.ts",
      floorPath = "/src/domain/floors.ts",
      s = (await import(path)).useStore.getState();
    await s.commit(
      (await import(floorPath)).duplicateFloor(
        s.doc,
        s.activeFloorId,
        28000,
        "Superior",
      ),
      "floor",
    );
  });
  await settled(page);
  let s = await state(page);
  expect(s.doc.model.imageElements).toHaveLength(2);
  expect(new Set(s.doc.model.imageElements.map((i) => i.id)).size).toBe(2);
  await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
  const camera = JSON.parse(
    (await page.getByTestId("drawing").getAttribute("data-camera"))!,
  );
  expect(camera.scale).toBeGreaterThan(0.012);
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Mobiliários",
      exact: true,
    }),
  ).toHaveCount(0);
  s = await state(page);
  expect(s.doc.model.imageElements).toHaveLength(2);
});
test("M10 mesas com cadeiras, propriedades compactas e atração angular pela alça", async ({
  page,
}) => {
  await open(page);
  let e = await insert(page, "Mesa redonda com 4 cadeiras");
  expect(e.source).toEqual({
    kind: "catalog",
    itemId: "mesa-redonda-4-cadeiras",
    revision: 1,
  });
  expect(e.width).toBe(20000);
  expect(e.depth).toBe(20000);
  const panel = page.getByRole("complementary", {
    name: "Propriedades do mobiliário",
  });
  await expect(panel.getByLabel("Posição X (cm)", { exact: true })).toHaveCount(
    0,
  );
  await expect(panel.getByLabel("Posição Y (cm)", { exact: true })).toHaveCount(
    0,
  );
  async function turnTo(angle: number) {
    const camera = JSON.parse(
      (await page.getByTestId("drawing").getAttribute("data-camera"))!,
    );
    const radius = e.depth / 2 + 24 / camera.scale,
      a = (e.angle * Math.PI) / 180,
      target = ((angle - 90) * Math.PI) / 180;
    const start = await at(
        page,
        e.x + Math.sin(a) * radius,
        e.y - Math.cos(a) * radius,
      ),
      end = await at(
        page,
        e.x + Math.cos(target) * radius,
        e.y + Math.sin(target) * radius,
      );
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 5 });
  }
  const before = await state(page);
  await turnTo(43);
  await expect(
    page.getByText("Rotação: 45° · atração a cada 45°", { exact: true }),
  ).toBeVisible();
  await page.mouse.up();
  await settled(page);
  e = (await state(page)).doc.model.imageElements[0];
  expect(e.angle).toBe(45);
  expect((await state(page)).history.past).toHaveLength(
    before.history.past.length + 1,
  );
  await turnTo(60);
  await page.mouse.up();
  await settled(page);
  e = (await state(page)).doc.model.imageElements[0];
  expect(Math.abs(e.angle - 60)).toBeLessThan(0.6);
  const p = await at(page, e.x, e.y);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(p.x + 13, p.y + 7, { steps: 3 });
  await page.mouse.up();
  await settled(page);
  const position = (await state(page)).doc.model.imageElements[0];
  await panel.getByLabel("Rotação (graus)").fill("43");
  await panel.getByRole("button", { name: "Aplicar imagem" }).click();
  await settled(page);
  const applied = (await state(page)).doc.model.imageElements[0];
  expect(applied.angle).toBe(43);
  expect(applied.x).toBe(position.x);
  expect(applied.y).toBe(position.y);
  const rect = await insert(page, "Mesa retangular com 6 cadeiras");
  expect(rect.source).toEqual({
    kind: "catalog",
    itemId: "mesa-retangular-6-cadeiras",
    revision: 1,
  });
  expect(rect.width).toBe(26000);
  expect(rect.depth).toBe(19000);
});

test("M10 acervo transparente e revisão visual nas três resoluções", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await open(page);
  for (const i of imageCatalog) {
    const result = await page.evaluate(async (url) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      const c = document.createElement("canvas");
      c.width = image.naturalWidth;
      c.height = image.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
      let empty = false,
        solid = false;
      for (let n = 3; n < pixels.length; n += 4) {
        empty ||= pixels[n] === 0;
        solid ||= pixels[n] > 8;
      }
      return { empty, solid };
    }, `/catalog/m10/${i.asset}-r1.png`);
    expect(result, i.id).toEqual({ empty: true, solid: true });
  }
  await page.getByRole("button", { name: "Mobiliários", exact: true }).click();
  for (const [index, category] of [
    ...new Set(imageCatalog.map((i) => i.category)),
  ].entries()) {
    const dialog = page.getByRole("dialog", {
      name: "Mobiliários",
    });
    await dialog.getByRole("button", { name: category, exact: true }).click();
    await expect
      .poll(() =>
        dialog
          .locator("img")
          .evaluateAll((imgs) =>
            imgs.every(
              (i) =>
                (i as HTMLImageElement).complete &&
                (i as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    await dialog.screenshot({
      path: `.tools/m10-category-${info.project.name}-${index}.png`,
    });
  }
  await page.keyboard.press("Escape");
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    await page
      .getByRole("button", { name: "Mobiliários", exact: true })
      .click();
    await page.getByRole("dialog").screenshot({
      path: `.tools/m10-catalog-${info.project.name}-${width}.png`,
    });
    const overflow = await page.evaluate(() => {
      const d = document.querySelector("dialog")!;
      return {
        page: document.documentElement.scrollWidth > innerWidth,
        dialog: d.scrollWidth > d.clientWidth + 1,
      };
    });
    expect(overflow).toEqual({ page: false, dialog: false });
    await page.keyboard.press("Escape");
  }
  await insert(page);
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    await page.screenshot({
      path: `.tools/m10-editor-${info.project.name}-${width}.png`,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const props = page.getByRole("complementary", {
      name: "Propriedades do mobiliário",
    });
    expect(await props.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
      true,
    );
  }
});
