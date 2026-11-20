import { test, expect, type Page } from "./auth";
import { createProject, type Project } from "../../src/domain/project";
import { addRoomLabel } from "../../src/domain/rooms";

type DrawnText = { text: string; font: number; y: number };
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
  return d;
}

for (const [zoom, roomFont, smallFont, terrainFont, compassFont] of [
  [25, 7.613, 6.442, 7.027, 6],
  [61, 13, 11, 12, 10.248],
  [150, 20, 17.2492, 18, 16.0698],
]) {
  test(
    `T-019 fontes do desenho em ${zoom}% e controles fixos`,
    { tag: "@interface" },
    async ({ page }) => {
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
      expect(area.y - name.y).toBeCloseTo(zoom === 25 ? 10.542 : 18, 1);
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
      expect(await button.evaluate((el) => getComputedStyle(el).fontSize)).toBe(
        interfaceFont,
      );
      expect((await state(page)).model).toEqual(original.model);
      await page.screenshot({ path: `.tools/t019-fontes-${zoom}.png` });
    },
  );
}
