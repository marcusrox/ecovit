import { test, expect, type Page } from "./auth";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
} from "../../src/domain/project";

async function state(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts",
      s = (await import(path)).useStore.getState();
    return { doc: s.doc, past: s.history.past.length };
  });
}
async function redPixels(page: Page) {
  return page.locator("canvas").evaluateAll((elements) =>
    elements.reduce((sum, node) => {
      const c = node as HTMLCanvasElement,
        ctx = c.getContext("2d");
      if (!ctx) return sum;
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      for (let i = 0; i < d.length; i += 4)
        if (d[i] === 179 && d[i + 1] === 58 && d[i + 2] === 41 && d[i + 3] > 0)
          sum++;
      return sum;
    }, 0),
  );
}
async function midpoint(page: Page, end = false) {
  const s = await state(page),
    f = s.doc.generated.floors[0];
  const c = f.clamps.find(
    (c: { course: number; a: { x: number }; b: { x: number } }) =>
      c.course === 1 && c.b.x > c.a.x,
  );
  const host = page.getByTestId("drawing"),
    box = (await host.boundingBox())!,
    camera = JSON.parse((await host.getAttribute("data-camera"))!);
  const m = s.doc.project.base.width;
  return {
    x:
      box.x +
      camera.x +
      ((end ? c.b.x : (c.a.x + c.b.x) / 2) + m / 2) * camera.scale,
    y:
      box.y +
      camera.y +
      ((end ? c.b.y : (c.a.y + c.b.y) / 2) + m / 2) * camera.scale,
  };
}

test(
  "Grampos pendentes: aviso único por ligação, marcador, hover e edição de graute preservada",
  { tag: "@interface" },
  async ({ page }) => {
    const d = createProject(
        "Pendências por grampo",
        { length: 2500, width: 1250, height: 700 },
        9800,
      ),
      f = d.model.floors[0],
      m = 1250;
    d.project.channelLevels = [];
    d.project.groutSettings = {
      ...defaultGroutSettings(false),
      junctions: true,
    };
    f.groutMode = "reinforced";
    f.clamps = {
      enabled: true,
      diameter: 63,
      length: 3250,
      schedule: { mode: "list", courses: [1, 5, 15] },
    };
    d.model.walls = [
      makeWall({ x: -5 * m, y: 0 }, { x: 6 * m, y: 0 }, m, f.id, 9800, 1)!,
      makeWall({ x: 0, y: m }, { x: 0, y: 6 * m }, m, f.id, 9800, 1)!,
    ];
    await page.getByTestId("import-file").setInputFiles({
      name: "pendencias.ecovit",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(d)),
    });
    await expect(page.getByRole("status")).toContainText("Salvo");
    const original = await state(page);
    await page.getByRole("button", { name: "Orçamento", exact: true }).click();
    const detail = page.getByRole("region", {
      name: "Ferragens do pavimento consultado",
      exact: true,
    });
    await expect(detail.getByRole("listitem")).toHaveCount(4);
    await expect(
      detail.getByRole("listitem").filter({ hasText: "fiada 1 · células" }),
    ).toHaveCount(3);
    await expect(
      detail.getByRole("listitem").filter({ hasText: "fiada 15:" }),
    ).toHaveCount(1);
    await page
      .getByRole("button", { name: "Voltar ao desenho", exact: true })
      .click();
    await page.getByRole("button", { name: "Fiada", exact: true }).click();
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    await expect(
      page.getByRole("region", { name: "Grampos da fiada", exact: true }),
    ).toContainText("Vermelho tracejado e !");
    await expect.poll(() => redPixels(page)).toBeGreaterThan(20);
    const point = await midpoint(page);
    await page.mouse.move(point.x, point.y);
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toContainText("Grampo pendente");
    await expect(tooltip).toContainText("Sobre a fiada 1");
    await expect(tooltip).toContainText(
      "as duas pontas precisam de intervalo contínuo",
    );
    await expect(tooltip).toContainText(
      "Não incluído na estimativa do Orçamento",
    );
    await page.screenshot({ path: ".tools/t028/grampo-pendente.png" });
    expect(await state(page)).toEqual(original);
    await page.getByRole("button", { name: "Graute", exact: true }).click();
    const hole = await midpoint(page, true);
    await page.mouse.click(hole.x, hole.y);
    await expect(page.getByRole("status")).toContainText("Salvo");
    expect((await state(page)).doc.generated.floors[0].grouts.length).toBe(
      original.doc.generated.floors[0].grouts.length - 1,
    );
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /Desfazer/ }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await page.getByLabel("Número da fiada", { exact: true }).fill("5");
    await expect(tooltip).not.toBeVisible();
    await expect.poll(() => redPixels(page)).toBe(0);
    await page.mouse.move(point.x, point.y);
    await expect(tooltip).toContainText("Grampo entre grautes");
    await page.getByRole("button", { name: "Planta", exact: true }).click();
    await expect(tooltip).not.toBeVisible();
    await expect.poll(() => redPixels(page)).toBe(0);
  },
);
