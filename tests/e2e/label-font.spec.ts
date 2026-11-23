import { test, expect, type Page } from "./auth";
import { createProject, type Project } from "../../src/domain/project";
import { newText } from "../../src/domain/text";
import { addRoomLabel } from "../../src/domain/rooms";

type DrawnText = {
  text: string;
  font: number;
  family: string;
  x: number;
  y: number;
};
async function state(page: Page): Promise<Project> {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    return (await import(path)).useStore.getState().doc;
  });
}
async function texts(page: Page): Promise<DrawnText[]> {
  return page.evaluate(() =>
    (window as unknown as { drawnTexts: () => DrawnText[] }).drawnTexts(),
  );
}
async function recordTexts(page: Page) {
  await page.evaluate(() => {
    const contexts = new Map<HTMLCanvasElement, DrawnText[]>();
    const clear = CanvasRenderingContext2D.prototype.clearRect,
      fill = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      contexts.set(this.canvas, []);
      return clear.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.fillText = function (...args) {
      const entries = contexts.get(this.canvas) ?? [];
      entries.push({
        text: args[0],
        font: Number(this.font.match(/([\d.]+)px/)?.[1]),
        family: this.font,
        x:
          this.getTransform().transformPoint({ x: args[1], y: args[2] }).x /
          (this.canvas.width / this.canvas.getBoundingClientRect().width),
        y:
          this.getTransform().transformPoint({ x: args[1], y: args[2] }).y /
          (this.canvas.height / this.canvas.getBoundingClientRect().height),
      });
      contexts.set(this.canvas, entries);
      return fill.apply(this, args);
    };
    Object.assign(window, {
      drawnTexts: () =>
        [...contexts]
          .filter(([canvas]) => canvas.isConnected)
          .flatMap(([, entries]) => entries),
    });
  });
}
function fixture() {
  let d = createProject("T-019 Fontes", {
    length: 2000,
    width: 1000,
    height: 700,
  });
  const floorId = d.model.floors[0].id;
  d.model.walls = [
    {
      id: crypto.randomUUID(),
      floorId,
      a: { x: 0, y: 0 },
      b: { x: 32000, y: 0 },
      side: 1,
      height: 28000,
    },
    {
      id: crypto.randomUUID(),
      floorId,
      a: { x: 0, y: 41000 },
      b: { x: 32000, y: 41000 },
      side: 1,
      height: 28000,
    },
    {
      id: crypto.randomUUID(),
      floorId,
      a: { x: 0, y: 1000 },
      b: { x: 0, y: 41000 },
      side: -1,
      height: 28000,
    },
    {
      id: crypto.randomUUID(),
      floorId,
      a: { x: 31000, y: 1000 },
      b: { x: 31000, y: 41000 },
      side: -1,
      height: 28000,
    },
  ];
  d.model.openings = [
    {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "door",
      offset: 2000,
      width: 6000,
      base: 0,
      height: 14000,
    },
    {
      id: crypto.randomUUID(),
      wallId: d.model.walls[3].id,
      kind: "window",
      offset: 5000,
      width: 4000,
      base: 11200,
      height: 7000,
    },
    {
      id: crypto.randomUUID(),
      wallId: d.model.walls[1].id,
      kind: "opening",
      offset: 2000,
      width: 6000,
      base: 0,
      height: 14000,
    },
  ];
  d.model.measurements = [
    {
      id: crypto.randomUUID(),
      floorId,
      a: { x: 4000, y: 12000 },
      b: { x: 26000, y: 12000 },
    },
  ];
  d.model.terrain = {
    id: crypto.randomUUID(),
    revision: 1,
    material: "soft",
    textureOrigin: { x: -5000, y: -5000 },
    contour: [
      { x: -5000, y: -5000 },
      { x: 45000, y: -5000 },
      { x: 45000, y: 47000 },
      { x: -5000, y: 47000 },
    ],
    compass: {
      visible: true,
      center: { x: 37000, y: 28000 },
      size: 10000,
      angle: 0,
    },
  };
  d = addRoomLabel(d, floorId, { x: 15000, y: 25000 }).doc;
  d.model.roomLabels[0].name = "Sala de estar";
  d.model.texts = [
    {
      ...newText(floorId, { x: 16000, y: 32000 }),
      content: "Texto livre",
      size: 1500,
    },
  ];
  return d;
}

for (const zoom of [25, 61, 150]) {
  const ratio = zoom / 61,
    roomFont = 13 * ratio,
    smallFont = 11 * ratio,
    terrainFont = 12 * ratio,
    compassFont = ((10000 * 0.012 * zoom) / 100) * 0.14;
  test(
    `T-034 fontes do desenho em ${zoom}% e controles fixos`,
    { tag: "@interface" },
    async ({ page }) => {
      if (zoom === 150)
        await page.setViewportSize({ width: 1600, height: 1400 });
      await recordTexts(page);
      const d = fixture();
      await page.getByTestId("import-file").setInputFiles({
        name: "fontes.ecovit",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(d)),
      });
      await expect(page.getByTestId("drawing")).toBeVisible();
      await expect(page.getByRole("status")).toContainText("Salvo");
      const original = await state(page),
        button = page.getByRole("button", { name: "Etiqueta", exact: true });
      const interfaceFont = await button.evaluate(
        (el) => getComputedStyle(el).fontSize,
      );
      // Reopen with the existing camera preference to inspect exact, not rounded,
      // zoom values without adding a test-only control to the editor.
      await page.getByRole("button", { name: "Projetos", exact: true }).click();
      await page.evaluate(
        ({ id, scale }) =>
          localStorage.setItem(
            `ecovit:project-view:v1:${id}`,
            JSON.stringify({ centerX: 17000, centerY: 21000, scale }),
          ),
        { id: original.project.id, scale: (0.012 * zoom) / 100 },
      );
      await page
        .getByRole("button", { name: /T-019 Fontes/ })
        .first()
        .click();
      await expect(page.getByTestId("drawing")).toBeVisible();
      await expect
        .poll(
          async () =>
            JSON.parse(
              (await page.getByTestId("drawing").getAttribute("data-camera"))!,
            ).scale,
        )
        .toBeCloseTo((0.012 * zoom) / 100, 8);
      await page.evaluate(async () => {
        const path = "/src/state/store.ts",
          s = (await import(path)).useStore;
        s.getState().choose(s.getState().doc.model.walls[0].id);
      });
      const fontOf = async (prefix: string) =>
        (await texts(page)).find((e) => e.text.startsWith(prefix))?.font;
      await expect.poll(() => fontOf("Sala de estar")).toBeCloseTo(roomFont, 2);
      await expect.poll(() => fontOf("12,00 m²")).toBeCloseTo(roomFont, 2);
      const roomTexts = await texts(page);
      const name = roomTexts.find((e) => e.text === "Sala de estar")!;
      const area = roomTexts.find((e) => e.text === "12,00 m²")!;
      expect(area.y - name.y).toBeCloseTo(18 * ratio, 1);
      for (const prefix of [
        "C: ",
        "Porta ·",
        "Janela ·",
        "Vão ·",
        "220 cm",
        "A",
        "B",
      ]) {
        await expect.poll(() => fontOf(prefix)).toBeCloseTo(smallFont, 2);
      }
      await expect.poll(() => fontOf("Terreno ·")).toBeCloseTo(terrainFont, 2);
      await expect.poll(() => fontOf("N")).toBeCloseTo(compassFont, 2);
      await expect
        .poll(() => fontOf("Texto livre"))
        .toBeCloseTo((1500 * 0.012 * zoom) / 100, 2);
      for (const prefix of [
        "Sala de estar",
        "12,00 m²",
        "Porta ·",
        "Janela ·",
        "Vão ·",
        "C: ",
        "220 cm",
        "Terreno ·",
        "N",
        "A",
        "B",
        "Texto livre",
      ]) {
        expect(
          (await texts(page)).find((e) => e.text.startsWith(prefix))?.family,
        ).toContain("IBM Plex Sans");
      }
      // The area line belongs to the same hit box as the name at every zoom.
      const host = await page.getByTestId("drawing").boundingBox();
      await page.mouse.click(host!.x + area.x, host!.y + area.y);
      await expect(
        page.getByLabel("Nome do ambiente", { exact: true }),
      ).toBeVisible();
      expect(await button.evaluate((el) => getComputedStyle(el).fontSize)).toBe(
        interfaceFont,
      );
      expect((await state(page)).model).toEqual(original.model);
      await page.screenshot({ path: `.tools/t034-fontes-${zoom}.png` });
    },
  );
}

test(
  "T-034 nomes longos conservam linhas e seleção ao mudar zoom",
  { tag: "@interface" },
  async ({ page }) => {
    await recordTexts(page);
    const d = fixture();
    d.model.roomLabels[0].name =
      "Sala de estar e jantar integrada com cozinha e varanda";
    await page
      .getByTestId("import-file")
      .setInputFiles({
        name: "nomes.ecovit",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(d)),
      });
    await expect(page.getByTestId("drawing")).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Salvo");
    const original = await state(page);
    const camera = async () =>
      JSON.parse(
        (await page.getByTestId("drawing").getAttribute("data-camera"))!,
      );
    const roomLines = async () => {
      const c = await camera();
      return (await texts(page)).filter(
        (t) => Math.abs(t.font - (13 * c.scale) / (0.012 * 0.61)) < 0.001,
      );
    };
    await expect
      .poll(async () => (await roomLines()).length)
      .toBeGreaterThan(2);
    const before = await roomLines();
    for (let i = 0; i < 2; i++)
      await page
        .getByRole("button", { name: "Ampliar zoom", exact: true })
        .click();
    await expect
      .poll(async () => (await roomLines()).map((t) => t.text))
      .toEqual(before.map((t) => t.text));
    const after = await roomLines(),
      c = await camera();
    expect(after[0].font / before[0].font).toBeCloseTo(1.44, 4);
    expect(after[1].y - after[0].y).toBeCloseTo(
      (18 * c.scale) / (0.012 * 0.61),
      2,
    );
    const host = await page.getByTestId("drawing").boundingBox();
    await page.mouse.dblclick(host!.x + after[0].x, host!.y + after[0].y);
    const field = page.getByLabel("Nome do ambiente", { exact: true });
    await expect(field).toBeFocused();
    await expect(field).toHaveValue(d.model.roomLabels[0].name);
    expect(
      await field.evaluate((el: HTMLInputElement) => [
        el.selectionStart,
        el.selectionEnd,
      ]),
    ).toEqual([0, d.model.roomLabels[0].name.length]);
    expect((await state(page)).model).toEqual(original.model);
    await page.screenshot({ path: ".tools/t034-long-name.png" });
  },
);
