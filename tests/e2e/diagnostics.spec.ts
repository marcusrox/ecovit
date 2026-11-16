import { test, expect } from "./auth";
import { readFile } from "node:fs/promises";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
} from "../../src/domain/project";
import { addFloor } from "../../src/domain/floors";

test(
  "T-020 localiza o par sobreposto e mantém contornos na Fiada",
  { tag: "@interface" },
  async ({ page }, testInfo) => {
    await page.evaluate(() => {
      type Row = {
        color: string;
        dash: number[];
        width: number;
        height: number;
      };
      const contexts = new Map<HTMLCanvasElement, Row[]>();
      const paths = new WeakMap<CanvasRenderingContext2D, number[][]>();
      const proto = CanvasRenderingContext2D.prototype;
      const clear = proto.clearRect,
        begin = proto.beginPath,
        rect = proto.rect,
        stroke = proto.stroke;
      proto.clearRect = function (...args) {
        contexts.set(this.canvas, []);
        return clear.apply(this, args);
      };
      proto.beginPath = function () {
        paths.set(this, []);
        return begin.call(this);
      };
      proto.rect = function (...args) {
        const entries = paths.get(this) ?? [];
        entries.push(args);
        paths.set(this, entries);
        return rect.apply(this, args);
      };
      proto.stroke = function (path?: Path2D) {
        const entries = contexts.get(this.canvas) ?? [];
        for (const r of paths.get(this) ?? [])
          entries.push({
            color: String(this.strokeStyle),
            dash: this.getLineDash(),
            width: r[2],
            height: r[3],
          });
        contexts.set(this.canvas, entries);
        return Reflect.apply(stroke, this, path ? [path] : []);
      };
      Object.assign(window, {
        drawnRectangles: () =>
          [...contexts]
            .filter(([canvas]) => canvas.isConnected)
            .flatMap(([, rows]) => rows),
      });
    });
    let d = createProject("Diagnóstico T-020", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    d = addFloor(d, { name: "Superior", level: 28000, defaultHeight: 28000 });
    d.project.channelLevels = [];
    d.project.groutSettings = defaultGroutSettings(false);
    const floor = d.model.floors[0].id;
    const wall = (
      ax: number,
      ay: number,
      bx: number,
      by: number,
      height = 2100,
    ) => makeWall({ x: ax, y: ay }, { x: bx, y: by }, 1250, floor, height, 1)!;
    d.model.walls = [
      wall(0, 20000, 15000, 20000),
      wall(13750, 20000, 40000, 20000, 1400),
      wall(13750, 0, 13750, 21250),
      wall(50000, 0, 60000, 0),
    ];
    d.model.walls.push({
      ...d.model.walls[0],
      id: crypto.randomUUID(),
      floorId: d.model.floors[1].id,
    });
    d.model.openings.push({
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "door",
      offset: 2500,
      width: 5000,
      base: 0,
      height: 700,
    });
    await page.getByTestId("import-file").setInputFiles({
      name: "sobreposicao.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(d)),
    });
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.getByRole("button", { name: "Fiada", exact: true }).click();
    const diagnostic = page
      .getByRole("button")
      .filter({ hasText: "Paredes colineares sobrepostas" });
    await expect(diagnostic).toContainText("paredes 1 e 2");
    await expect(diagnostic).toContainText("3 paredes conectadas");
    await diagnostic.click();
    const rectangles = () =>
      page.evaluate(() =>
        (
          window as unknown as {
            drawnRectangles: () => {
              color: string;
              dash: number[];
              width: number;
              height: number;
            }[];
          }
        ).drawnRectangles(),
      );
    await expect
      .poll(
        async () =>
          (await rectangles()).filter(
            (r) => r.color === "#637969" && r.dash.join() === "4,3",
          ).length,
      )
      .toBe(4);
    await expect
      .poll(
        async () =>
          (await rectangles()).filter((r) => r.color === "#bd4930").length,
      )
      .toBe(2);
    await expect
      .poll(
        async () =>
          (await rectangles()).filter((r) => r.color === "#b74430").length,
      )
      .toBe(1);
    const drawing = page.getByTestId("drawing"),
      box = (await drawing.boundingBox())!;
    const camera = JSON.parse((await drawing.getAttribute("data-camera"))!);
    expect(camera.x + 14375 * camera.scale).toBeCloseTo(box.width / 2, 0);
    expect(camera.y + 20625 * camera.scale).toBeCloseTo(box.height / 2, 0);
    await drawing.screenshot({
      path: testInfo.outputPath("fiada-suspensa.png"),
    });
    await page.getByLabel("Número da fiada", { exact: true }).fill("3");
    await page.getByLabel("Número da fiada", { exact: true }).press("Enter");
    await expect
      .poll(
        async () =>
          (await rectangles()).filter(
            (r) => r.color === "#637969" && r.dash.join() === "4,3",
          ).length,
      )
      .toBe(3);
    await expect
      .poll(
        async () =>
          (await rectangles()).filter((r) => r.color === "#b74430").length,
      )
      .toBe(0);
    await page
      .getByLabel("Pavimento", { exact: true })
      .selectOption(d.model.floors[1].id);
    await expect
      .poll(
        async () =>
          (await rectangles()).filter(
            (r) => r.color === "#637969" && r.dash.join() === "4,3",
          ).length,
      )
      .toBe(1);
    await expect
      .poll(
        async () =>
          (await rectangles()).filter((r) => r.color === "#b74430").length,
      )
      .toBe(0);
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Baixar projeto" }).click();
    const saved = JSON.parse(
      await readFile((await (await pending).path())!, "utf8"),
    );
    expect(saved.model).toEqual(d.model);
    expect(
      saved.generated.floors[0].courses[0].pieces.every(
        (p: { wallIds: string[] }) => p.wallIds.includes(d.model.walls[3].id),
      ),
    ).toBe(true);
  },
);
