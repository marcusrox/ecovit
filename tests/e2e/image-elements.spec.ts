import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createProject, type Project } from "../../src/domain/project";
import { catalogItem, imageCatalog } from "../../src/domain/image-catalog";
import {
  elementCorners,
  elementSideHandle,
  standardElement,
} from "../../src/domain/image-elements";
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
async function insert(page: Page, name = "Sofá", category = "Sala") {
  await page.getByRole("button", { name: "Mobiliários", exact: true }).click();
  await page.getByLabel("Buscar no acervo").fill(name);
  await page
    .getByRole("button", { name: `Inserir ${name} · ${category}`, exact: true })
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

for (const kind of ["catalog", "custom"] as const) {
  test(`M10 espelhamento ${kind}: renderização girada, histórico, cópia, arquivo e readonly`, async ({
    page,
    context,
  }, info) => {
    test.setTimeout(90000);
    await page.addInitScript(() => {
      const records = new Map<
        HTMLCanvasElement,
        { a: number; b: number; c: number; d: number; x: number; y: number }
      >();
      const draw = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (
        this: CanvasRenderingContext2D,
        ...args: Parameters<typeof draw>
      ) {
        if (this.canvas.isConnected && args.length === 9) {
          const t = this.getTransform();
          const width = Number(args[7]),
            height = Number(args[8]);
          records.set(this.canvas, {
            a: t.a,
            b: t.b,
            c: t.c,
            d: t.d,
            x: t.e + (t.a * width) / 2 + (t.c * height) / 2,
            y: t.f + (t.b * width) / 2 + (t.d * height) / 2,
          });
        }
        return draw.apply(this, args);
      } as typeof draw;
      Object.assign(window, {
        mirrorDraw: () =>
          [...records].filter(([canvas]) => canvas.isConnected).at(-1)?.[1],
      });
    });
    await open(page);
    if (kind === "catalog") await insert(page, "Sofá em L");
    else {
      const data = await page.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 160;
        canvas.height = 100;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#b4563d";
        ctx.fillRect(5, 5, 60, 35);
        ctx.fillStyle = "#496b45";
        ctx.fillRect(100, 50, 50, 45);
        return canvas.toDataURL("image/png").split(",")[1];
      });
      await page
        .getByRole("button", { name: "Mobiliários", exact: true })
        .click();
      await page.getByText("Imagem personalizada", { exact: true }).click();
      await page.getByLabel("Arquivo PNG ou JPEG").setInputFiles({
        name: "assimetrica.png",
        mimeType: "image/png",
        buffer: Buffer.from(data, "base64"),
      });
      await page.getByLabel("Largura (cm)", { exact: true }).fill("160");
      await page
        .getByRole("button", { name: "Usar assimetrica.png", exact: true })
        .click();
      const p = await at(page, 25000, 20000);
      await page.mouse.click(p.x, p.y);
      await settled(page);
      await page
        .getByLabel("Selecionar elemento", { exact: true })
        .selectOption((await state(page)).doc.model.imageElements[0].id);
    }
    const panel = page.getByRole("complementary", {
      name: "Propriedades do mobiliário",
    });
    await panel.getByLabel("Rotação (graus)").fill("37");
    await panel
      .getByRole("button", { name: "Aplicar imagem", exact: true })
      .click();
    await settled(page);
    const before = await state(page),
      original = before.doc.model.imageElements[0];
    const probe = () =>
      page.evaluate(() => {
        const t = (
          window as unknown as {
            mirrorDraw: () => {
              a: number;
              b: number;
              c: number;
              d: number;
              x: number;
              y: number;
            };
          }
        ).mirrorDraw();
        if (!t) return null;
        const angle = (37 * Math.PI) / 180;
        return {
          sx: Math.sign(t.a * Math.cos(angle) + t.b * Math.sin(angle)),
          sy: Math.sign(-t.c * Math.sin(angle) + t.d * Math.cos(angle)),
          x: t.x,
          y: t.y,
        };
      });
    await expect.poll(async () => (await probe())?.sx).toBe(1);
    const center = (await probe())!;
    const horizontal = panel.getByRole("button", {
      name: "Espelhar horizontalmente",
      exact: true,
    });
    const vertical = panel.getByRole("button", {
      name: "Espelhar verticalmente",
      exact: true,
    });
    await horizontal.click();
    await settled(page);
    await expect(horizontal).toHaveAttribute("aria-pressed", "true");
    await expect(horizontal).toBeFocused();
    await expect.poll(async () => (await probe())?.sx).toBe(-1);
    expect((await probe())!.sy).toBe(1);
    expect((await probe())!.x).toBeCloseTo(center.x, 3);
    expect((await probe())!.y).toBeCloseTo(center.y, 3);
    expect((await state(page)).history.past).toHaveLength(
      before.history.past.length + 1,
    );
    await page.getByRole("button", { name: /Desfazer/ }).click();
    await settled(page);
    await page
      .getByLabel("Selecionar elemento", { exact: true })
      .selectOption(original.id);
    await expect(horizontal).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: /Refazer/ }).click();
    await settled(page);
    await page
      .getByLabel("Selecionar elemento", { exact: true })
      .selectOption(original.id);
    await vertical.click();
    await settled(page);
    await expect.poll(async () => (await probe())?.sy).toBe(-1);
    await horizontal.press("Space");
    await settled(page);
    await expect.poll(async () => (await probe())?.sx).toBe(1);
    expect((await probe())!.sy).toBe(-1);
    await horizontal.click();
    await settled(page);
    await expect.poll(async () => (await probe())?.sx).toBe(-1);
    const mirrored = (await state(page)).doc.model.imageElements[0];
    expect(mirrored).toEqual({ ...original, flipX: true, flipY: true });
    expect((await state(page)).doc.generated).toEqual(before.doc.generated);
    expect((await state(page)).doc.model.customImageAssets).toEqual(
      before.doc.model.customImageAssets,
    );
    for (const [width, height] of [
      [1366, 768],
      [1280, 720],
      [900, 680],
    ]) {
      await page.setViewportSize({ width, height });
      await horizontal.scrollIntoViewIfNeeded();
      await expect(horizontal).toBeVisible();
      await expect(vertical).toBeVisible();
      const actions = [
        horizontal,
        vertical,
        panel.getByRole("button", { name: "Duplicar imagem", exact: true }),
        panel.getByRole("button", { name: "Excluir imagem", exact: true }),
      ];
      const rows = [];
      for (const button of actions) {
        const alignment = await button.evaluate((el) => {
          const box = el.getBoundingClientRect(),
            svg = el.querySelector("svg")!.getBoundingClientRect();
          return {
            y: box.y,
            dx: Math.abs(svg.x + svg.width / 2 - box.x - box.width / 2),
            dy: Math.abs(svg.y + svg.height / 2 - box.y - box.height / 2),
            width: svg.width,
            height: svg.height,
            text: el.textContent?.trim(),
          };
        });
        rows.push(alignment.y);
        expect(alignment.dx).toBeLessThanOrEqual(1);
        expect(alignment.dy).toBeLessThanOrEqual(1);
        expect(alignment).toMatchObject({
          width: 18,
          height: 18,
          text: "",
        });
        await expect(button.locator("svg")).toHaveAttribute(
          "aria-hidden",
          "true",
        );
      }
      expect(Math.max(...rows) - Math.min(...rows)).toBeLessThanOrEqual(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await panel.screenshot({
        path: `.tools/mirror-${kind}-${info.project.name}-${width}.png`,
      });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await panel
      .getByRole("button", { name: "Duplicar imagem", exact: true })
      .click();
    await settled(page);
    const current = (await state(page)).doc;
    expect(current.model.imageElements[1]).toMatchObject({
      flipX: true,
      flipY: true,
      source: original.source,
    });
    const event = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    const text = await readFile((await (await event).path())!, "utf8");
    expect(JSON.parse(text).schemaVersion).toBe(15);
    await page.reload();
    await page
      .getByRole("button", { name: /M10 teste/ })
      .first()
      .click();
    await settled(page);
    expect((await state(page)).doc.model).toEqual(current.model);
    const other = await context.newPage();
    await other.goto("/");
    await other
      .getByRole("button", { name: /M10 teste/ })
      .first()
      .click();
    await expect(other.getByRole("status")).toContainText("Somente leitura");
    await other
      .getByLabel("Selecionar elemento", { exact: true })
      .selectOption(original.id);
    await expect(
      other.getByRole("button", {
        name: "Espelhar horizontalmente",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(
      other.getByRole("button", {
        name: "Espelhar verticalmente",
        exact: true,
      }),
    ).toBeDisabled();
    await other.close();
    await page.getByTestId("import-file").setInputFiles({
      name: "espelhado.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(text),
    });
    await settled(page);
    expect((await state(page)).doc.model).toEqual(current.model);
  });
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
    10,
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
  expect(output.schemaVersion).toBe(15);
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

test("M10 alças quadradas independentes, cantos proporcionais e transporte da deformação", async ({
  page,
}) => {
  await open(page);
  let e = await insert(page);
  const original = e;
  const panel = page.getByRole("complementary", {
    name: "Propriedades do mobiliário",
  });
  async function drag(
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) {
    const a = await at(page, from.x, from.y),
      b = await at(page, to.x, to.y);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 5 });
    await page.mouse.up();
    await settled(page);
  }
  let start = elementSideHandle(e, "width");
  await drag(start, { x: start.x + 4000, y: start.y });
  e = (await state(page)).doc.model.imageElements[0];
  expect(Math.abs(e.width - original.width - 4000)).toBeLessThan(100);
  expect(e.depth).toBe(original.depth);
  expect(e.x - e.width / 2).toBeCloseTo(original.x - original.width / 2);
  const widened = e;
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await settled(page);
  expect((await state(page)).doc.model.imageElements[0]).toEqual(original);
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  await settled(page);
  expect((await state(page)).doc.model.imageElements[0]).toEqual(widened);
  await page
    .getByLabel("Selecionar elemento", { exact: true })
    .selectOption(e.id);
  await panel.getByLabel("Rotação (graus)").fill("45");
  await panel.getByRole("button", { name: "Aplicar imagem" }).click();
  await settled(page);
  e = (await state(page)).doc.model.imageElements[0];
  const beforeDepth = e,
    c = Math.SQRT1_2;
  start = elementSideHandle(e, "depth");
  await drag(start, { x: start.x - c * 3000, y: start.y + c * 3000 });
  e = (await state(page)).doc.model.imageElements[0];
  expect(e.width).toBe(beforeDepth.width);
  expect(Math.abs(e.depth - beforeDepth.depth - 3000)).toBeLessThan(100);
  expect(e.angle).toBe(45);
  for (const i of [0, 1]) {
    expect(elementCorners(e)[i].x).toBeCloseTo(
      elementCorners(beforeDepth)[i].x,
    );
    expect(elementCorners(e)[i].y).toBeCloseTo(
      elementCorners(beforeDepth)[i].y,
    );
  }
  const beforeCancel = await state(page);

  start = elementSideHandle(e, "depth");
  const screen = await at(page, start.x, start.y);
  await page.mouse.move(screen.x, screen.y);
  await page.mouse.down();
  await page.mouse.move(screen.x - 20, screen.y + 20, { steps: 3 });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  expect((await state(page)).history).toEqual(beforeCancel.history);
  expect((await state(page)).doc).toEqual(beforeCancel.doc);
  await drag(start, {
    x: start.x + c * (e.depth + 2000),
    y: start.y - c * (e.depth + 2000),
  });
  expect((await state(page)).doc).toEqual(beforeCancel.doc);
  const beforeCorner = e,
    corners = elementCorners(e),
    anchor = corners[0],
    corner = corners[2];
  await drag(corner, {
    x: anchor.x + (corner.x - anchor.x) * 1.15,
    y: anchor.y + (corner.y - anchor.y) * 1.15,
  });
  e = (await state(page)).doc.model.imageElements[0];
  expect(e.width).toBeGreaterThan(beforeCorner.width);
  expect(e.width / e.depth).toBeCloseTo(
    beforeCorner.width / beforeCorner.depth,
    10,
  );
  expect(elementCorners(e)[0].x).toBeCloseTo(anchor.x);
  expect(elementCorners(e)[0].y).toBeCloseTo(anchor.y);
  const ratio = e.width / e.depth;
  await panel.getByLabel("Largura (cm)", { exact: true }).fill("300");
  await panel.getByRole("button", { name: "Aplicar imagem" }).click();
  await settled(page);
  e = (await state(page)).doc.model.imageElements[0];
  expect(e.width / e.depth).toBeCloseTo(ratio, 3);
  const event = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Baixar projeto", exact: true })
    .click();
  const file = await event,
    text = await readFile((await file.path())!, "utf8");
  await page.getByTestId("import-file").setInputFiles({
    name: "deformado.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(text),
  });
  await settled(page);
  expect((await state(page)).doc.model.imageElements[0]).toEqual(e);
});

for (const group of [
  {
    name: "ampliação de oito itens",
    ids: [
      "sofa-em-l",
      "escrivaninha",
      "cadeira-escritorio",
      "berco",
      "banheira",
      "churrasqueira",
      "bicicleta",
      "aparador",
    ],
  },
  {
    name: "Arquitetura",
    ids: imageCatalog
      .filter((i) => i.category === "Arquitetura")
      .map((i) => i.id),
  },
])
  test(`M10 ${group.name}: busca, inserção, reabertura e transporte de referências`, async ({
    page,
  }, info) => {
    test.setTimeout(90000);
    await open(page);
    const initial = (await state(page)).doc;
    const ids = group.ids;
    if (group.name === "Arquitetura") {
      await page
        .getByRole("button", { name: "Mobiliários", exact: true })
        .click();
      const dialog = page.getByRole("dialog", {
        name: "Mobiliários",
        exact: true,
      });
      await dialog
        .getByRole("button", { name: "Arquitetura", exact: true })
        .click();
      await expect(
        dialog.getByRole("button", { name: /^Inserir / }),
      ).toHaveCount(11);
      await expect
        .poll(() =>
          dialog
            .locator("img")
            .evaluateAll((images) =>
              images.every(
                (image) =>
                  (image as HTMLImageElement).complete &&
                  (image as HTMLImageElement).naturalWidth > 0,
              ),
            ),
        )
        .toBe(true);
      await dialog.screenshot({
        path: `.tools/architecture-${info.project.name}.png`,
      });
      await page.keyboard.press("Escape");
    }
    for (const id of ids) {
      const item = imageCatalog.find((i) => i.id === id)!;
      const element = await insert(page, item.name, item.category);
      expect(element.source).toEqual({
        kind: "catalog",
        itemId: id,
        revision: item.revision,
      });
      expect(element.width).toBe(item.width);
      expect(element.depth).toBe(item.depth);
    }
    const current = (await state(page)).doc;
    expect(current.model.imageElements).toHaveLength(ids.length);
    expect(current.model.customImageAssets).toEqual([]);
    expect(current.generated).toEqual(initial.generated);
    expect(current.generationState).toEqual(initial.generationState);
    const event = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    const file = await event;
    const text = await readFile((await file.path())!, "utf8");
    expect(text).not.toContain("data:image");
    expect(Buffer.byteLength(text)).toBeLessThan(20000);
    await page.reload();
    await page
      .getByRole("button", { name: /M10 teste/ })
      .first()
      .click();
    await settled(page);
    expect((await state(page)).doc.model.imageElements).toEqual(
      current.model.imageElements,
    );
    await page.getByTestId("import-file").setInputFiles({
      name: "m10-ampliacao.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(text),
    });
    await settled(page);
    const imported = (await state(page)).doc;
    expect(imported.project.id).not.toBe(current.project.id);
    expect(imported.model.imageElements).toEqual(current.model.imageElements);
  });

test("M10 bloco de contenção: revisão plana e histórica coexistem", async ({
  page,
}) => {
  await open(page);
  const d = (await state(page)).doc;
  const old = standardElement(
    catalogItem("bloco-concreto-contencao", 1)!,
    d.model.floors[0].id,
  );
  d.model.imageElements.push(old);
  await page.getByTestId("import-file").setInputFiles({
    name: "bloco-historico.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await settled(page);
  const current = await insert(
    page,
    "Bloco de concreto para contenção",
    "Arquitetura",
  );
  expect(current.source).toEqual({
    kind: "catalog",
    itemId: "bloco-concreto-contencao",
    revision: 2,
  });
  const elements = (await state(page)).doc.model.imageElements;
  expect(elements[0]).toEqual(old);
  for (const revision of [1, 2]) {
    expect(
      await page.evaluate(async (url) => {
        const image = new Image();
        image.src = url;
        await image.decode();
        return image.naturalWidth;
      }, `/catalog/m10/bloco-concreto-contencao-r${revision}.png`),
    ).toBe(1600);
  }
  await page.reload();
  await page
    .getByRole("button", { name: /M10 teste/ })
    .first()
    .click();
  await settled(page);
  expect((await state(page)).doc.model.imageElements).toEqual(elements);
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
    }, `/catalog/m10/${i.asset}-r${i.revision}.png`);
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
test("M10 resoluções em memória e qualidade alta local sem alterar projeto ou arquivo", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const records = new Map<
      HTMLCanvasElement,
      {
        canvasSource: boolean;
        sourceWidth: number;
        width: number;
        quality: string;
      }[]
    >();
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      records.set(this.canvas, []);
      return clear.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.drawImage = function (
      this: CanvasRenderingContext2D,
      ...args: Parameters<typeof draw>
    ) {
      if (this.canvas.isConnected) {
        const entries = records.get(this.canvas) ?? [],
          source = args[0];
        entries.push({
          canvasSource: source instanceof HTMLCanvasElement,
          sourceWidth: args[3],
          width: args[7],
          quality: this.imageSmoothingQuality,
        });
        records.set(this.canvas, entries);
      }
      return draw.apply(this, args);
    } as typeof draw;
    Object.assign(window, {
      furnitureDraws: () =>
        [...records.entries()]
          .filter(([canvas]) => canvas.isConnected)
          .flatMap(([, entries]) => entries),
    });
  });
  await open(page);
  const cache = await page.evaluate(async () => {
    const path = "/src/editor/furniture-bitmaps.ts";
    const { acquireFurnitureBitmap, furnitureBitmapLevel } = await import(path);
    const url = "/catalog/m10/sofa-r1.png";
    const first = acquireFurnitureBitmap(url),
      second = acquireFurnitureBitmap(url);
    const bitmap = await first.promise;
    const reduced = furnitureBitmapLevel(bitmap, 100, 40);
    const enlarged = furnitureBitmapLevel(bitmap, 10000, 4000);
    first.release();
    const third = acquireFurnitureBitmap(url);
    const shared =
      first.promise === second.promise && third.promise === first.promise;
    second.release();
    third.release();
    const fresh = acquireFurnitureBitmap(url);
    const released = fresh.promise !== first.promise;
    await fresh.promise;
    fresh.release();
    return {
      shared,
      released,
      reduced: reduced.crop.width < enlarged.crop.width,
      original: enlarged.image instanceof HTMLImageElement,
    };
  });
  expect(cache).toEqual({
    shared: true,
    released: true,
    reduced: true,
    original: true,
  });
  await insert(page);
  for (let i = 0; i < 5; i++)
    await page
      .getByRole("button", { name: "Reduzir zoom", exact: true })
      .click();
  const draws = () =>
    page.evaluate(() =>
      (
        window as unknown as {
          furnitureDraws: () => {
            canvasSource: boolean;
            sourceWidth: number;
            width: number;
            quality: string;
          }[];
        }
      ).furnitureDraws(),
    );
  await expect
    .poll(async () =>
      (await draws()).some(
        (d) =>
          d.canvasSource &&
          d.sourceWidth < 1024 &&
          d.sourceWidth >= d.width &&
          d.quality === "high",
      ),
    )
    .toBe(true);
  const before = await state(page);
  const exportText = async () => {
    const event = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    return readFile((await (await event).path())!, "utf8");
  };
  const exported = await exportText();
  await page
    .getByRole("button", { name: "Preferências do Ecovit", exact: true })
    .click();
  const checkbox = page.getByRole("checkbox", {
    name: "Suavização em qualidade alta",
    exact: true,
  });
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect
    .poll(async () =>
      (await draws()).some((d) => d.canvasSource && d.quality === "low"),
    )
    .toBe(true);
  expect((await state(page)).doc).toEqual(before.doc);
  expect((await state(page)).history).toEqual(before.history);
  expect(await exportText()).toBe(exported);
  await page.reload();
  await page
    .getByRole("button", { name: /M10 teste/ })
    .first()
    .click();
  await settled(page);
  await page
    .getByRole("button", { name: "Preferências do Ecovit", exact: true })
    .click();
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    const dialog = page.getByRole("dialog", { name: "Preferências do Ecovit" });
    await dialog.screenshot({
      path: `.tools/m10-render-preferences-${info.project.name}-${width}.png`,
    });
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  for (let i = 0; i < 5; i++)
    await page
      .getByRole("button", { name: "Reduzir zoom", exact: true })
      .click();
  await expect
    .poll(async () => (await draws()).some((d) => d.quality === "high"))
    .toBe(true);
  await page.screenshot({
    path: `.tools/m10-render-reduced-${info.project.name}.png`,
  });
});
