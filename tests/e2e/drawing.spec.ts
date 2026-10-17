import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  createProject,
  makeWall,
  type Project,
} from "../../src/domain/project";

async function load(page: Page, vertical?: boolean) {
  const d = createProject("Cursor M3.4", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  if (vertical !== undefined)
    d.model.walls = [
      makeWall(
        { x: 0, y: 0 },
        vertical ? { x: 0, y: 40000 } : { x: 40000, y: 0 },
        1250,
        d.model.floors[0].id,
        28000,
        1,
      )!,
    ];
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "cursor.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function point(page: Page, x: number, y: number) {
  const drawing = page.getByTestId("drawing"),
    b = (await drawing.boundingBox())!,
    c = JSON.parse((await drawing.getAttribute("data-camera"))!);
  return { x: b.x + c.x + x * c.scale, y: b.y + c.y + y * c.scale };
}
async function drag(
  page: Page,
  start: [number, number],
  end: [number, number],
) {
  const a = await point(page, ...start),
    b = await point(page, ...end);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 6 });
  await page.mouse.up();
}
async function exported(page: Page): Promise<Project> {
  await expect(page.getByRole("status")).toContainText("Salvo");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  return JSON.parse(await readFile((await (await pending).path())!, "utf8"));
}
test("M3.4 centro da cruz mantém célula nas quatro metades e parede inclui início em todos os sentidos", async ({
  page,
}) => {
  for (const direction of ["right", "left", "up", "down"]) {
    await load(page);
    await page
      .getByRole("button", { name: "Parede", exact: false })
      .first()
      .click();
    const drawing = page.getByTestId("drawing");
    for (const [x, y] of [
      [5250, 5250],
      [5875, 5250],
      [5250, 5875],
      [5875, 5875],
    ]) {
      const p = await point(page, x, y);
      await page.mouse.move(p.x, p.y);
      const h = JSON.parse((await drawing.getAttribute("data-module-hover"))!);
      expect({ x: h.x, y: h.y }).toEqual({ x: 5000, y: 5000 });
    }
    const end: [number, number] =
      direction === "right"
        ? [10000, 5875]
        : direction === "left"
          ? [2500, 5875]
          : direction === "up"
            ? [5875, 2500]
            : [5875, 10000];
    await drag(page, [5875, 5875], end);
    const d = await exported(page),
      w = d.model.walls[0];
    expect(Math.min(w.a.x, w.b.x)).toBeLessThanOrEqual(5000);
    expect(Math.min(w.a.y, w.b.y)).toBeLessThanOrEqual(5000);
    if (direction === "right" || direction === "left") {
      expect(w.a.y).toBe(5000);
      expect(Math.max(w.a.x, w.b.x)).toBeGreaterThanOrEqual(6250);
    } else {
      expect(w.a.x).toBe(5000);
      expect(Math.max(w.a.y, w.b.y)).toBeGreaterThanOrEqual(6250);
    }
  }
});
test("M3.4 portas, janelas e vãos incluem célula da cruz em ambos eixos/sentidos", async ({
  page,
}) => {
  for (const vertical of [false, true])
    for (const kind of ["Porta", "Janela", "Vão"])
      for (const reverse of [false, true]) {
        await load(page, vertical);
        await page.getByRole("button", { name: kind, exact: true }).click();
        const start: [number, number] = vertical ? [625, 5875] : [5875, 625],
          end: [number, number] = vertical
            ? [625, reverse ? 2500 : 10000]
            : [reverse ? 2500 : 10000, 625];
        const p = await point(page, ...start);
        await page.mouse.move(p.x, p.y);
        const h = JSON.parse(
          (await page
            .getByTestId("drawing")
            .getAttribute("data-module-hover"))!,
        );
        expect(vertical ? h.y : h.x).toBe(5000);
        await drag(page, start, end);
        const d = await exported(page),
          o = d.model.openings[0];
        expect(o.offset).toBe(reverse ? 2500 : 5000);
        expect(o.width).toBe(reverse ? 3750 : 5000);
        expect(o.offset).toBeLessThanOrEqual(5000);
        expect(o.offset + o.width).toBeGreaterThanOrEqual(6250);
      }
});
