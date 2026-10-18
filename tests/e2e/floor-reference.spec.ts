import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  createProject,
  makeWall,
  type Project,
} from "../../src/domain/project";
import { addFloor } from "../../src/domain/floors";

const m = 1250;
const rect = (a: number, b: number, c: number, d: number) => [
  { x: a * m, y: b * m },
  { x: c * m, y: b * m },
  { x: c * m, y: d * m },
  { x: a * m, y: d * m },
];
function fixture() {
  let d = createProject("Comparação M4.3", {
    length: 2500,
    width: m,
    height: 700,
  });
  d = addFloor(d, { name: "Mesmo nome", level: 28000, defaultHeight: 28000 });
  d = addFloor(d, { name: "Mesmo nome", level: -2100, defaultHeight: 28000 });
  const [, b, c] = d.model.floors;
  d.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 16 * m, y: 0 }, m, b.id, 2800, 1)!,
    makeWall({ x: 0, y: 0 }, { x: 16 * m, y: 0 }, m, c.id, 3500, 1)!,
    makeWall(
      { x: -8 * m, y: 2 * m },
      { x: -8 * m, y: 10 * m },
      m,
      c.id,
      2800,
      1,
    )!,
  ];
  d.model.openings = [
    {
      id: crypto.randomUUID(),
      wallId: d.model.walls[0].id,
      kind: "window",
      offset: 4 * m,
      width: 2 * m,
      base: 700,
      height: 700,
    },
    {
      id: crypto.randomUUID(),
      wallId: d.model.walls[1].id,
      kind: "door",
      offset: 10 * m,
      width: 2 * m,
      base: 0,
      height: 2100,
    },
  ];
  d.model.slabs = [
    {
      id: crypto.randomUUID(),
      floorId: b.id,
      thickness: 2100,
      contour: rect(0, 0, 16, 12),
      openings: [{ id: crypto.randomUUID(), contour: rect(2, 2, 4, 4) }],
    },
    {
      id: crypto.randomUUID(),
      floorId: c.id,
      thickness: 1400,
      contour: rect(-8, -4, 16, 12),
      openings: [
        { id: crypto.randomUUID(), contour: rect(-6, -2, -4, 0) },
        { id: crypto.randomUUID(), contour: rect(8, 6, 12, 9) },
      ],
    },
  ];
  return d;
}
async function load(page: Page, d = fixture()) {
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "comparação.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(d.model.floors[1].id);
  return d;
}
async function exported(page: Page): Promise<Project> {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  return JSON.parse(await readFile((await (await download).path())!, "utf8"));
}
async function stored(page: Page, id: string) {
  return page.evaluate(
    (id) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("ecovit");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            row = db.transaction("projects").objectStore("projects").get(id);
          row.onsuccess = () => {
            db.close();
            resolve(row.result.doc);
          };
          row.onerror = () => {
            db.close();
            reject(row.error);
          };
        };
      }),
    id,
  );
}
async function point(page: Page, x: number, y: number) {
  const drawing = page.getByTestId("drawing"),
    box = (await drawing.boundingBox())!,
    c = JSON.parse((await drawing.getAttribute("data-camera"))!);
  return { x: box.x + c.x + x * m * c.scale, y: box.y + c.y + y * m * c.scale };
}
async function click(page: Page, x: number, y: number) {
  const p = await point(page, x, y);
  await page.mouse.click(p.x, p.y);
}
async function drag(page: Page, a: number[], b: number[]) {
  const p = await point(page, a[0], a[1]),
    q = await point(page, b[0], b[1]);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(q.x, q.y, { steps: 5 });
  await page.mouse.up();
}

test("M4.3 A01/A02/A04: vizinhos, vazios transparentes, projeção e enquadramento", async ({
  page,
}) => {
  const d = await load(page),
    select = page.getByLabel("Comparar pavimento");
  await expect(select).toHaveValue("none");
  await expect(select.locator("option")).toHaveText([
    "Sem referência",
    "Inferior — Mesmo nome · -21 cm",
    "Superior — Mesmo nome · 280 cm",
  ]);
  const drawing = page.getByTestId("drawing"),
    camera = await drawing.getAttribute("data-camera"),
    before = await exported(page);
  await select.selectOption("below");
  await expect(page.getByTestId("floor-reference-label")).toContainText(
    "sem elementos",
  );
  await select.selectOption("above");
  await expect(drawing).toHaveAttribute("data-camera", camera!);
  await page.getByRole("button", { name: "Enquadrar" }).click();
  const alpha = await drawing.evaluate((host) => {
    const c = JSON.parse(host.getAttribute("data-camera")!),
      layer = host.querySelectorAll("canvas")[1],
      ctx = layer.getContext("2d")!;
    const pixel = (x: number, y: number) =>
      ctx.getImageData(
        Math.round(
          ((c.x + x * 1250 * c.scale) * layer.width) / host.clientWidth,
        ),
        Math.round(
          ((c.y + y * 1250 * c.scale) * layer.height) / host.clientHeight,
        ),
        1,
        1,
      ).data[3];
    return {
      hole: pixel(-5, -1),
      interior: pixel(-3, 4),
      ink: [...ctx.getImageData(0, 0, layer.width, layer.height).data]
        .filter((_, i) => i % 4 === 3)
        .some((v) => v > 0),
    };
  });
  expect(alpha).toEqual({ hole: 0, interior: 0, ink: true });
  const box = (await drawing.boundingBox())!,
    c = JSON.parse((await drawing.getAttribute("data-camera"))!);
  for (const [x, y] of [
    [-8, -4],
    [16, 12],
  ]) {
    expect(c.x + x * m * c.scale).toBeGreaterThanOrEqual(0);
    expect(c.x + x * m * c.scale).toBeLessThanOrEqual(box.width);
    expect(c.y + y * m * c.scale).toBeGreaterThanOrEqual(0);
    expect(c.y + y * m * c.scale).toBeLessThanOrEqual(box.height);
  }
  expect(await exported(page)).toEqual(before);
  expect(before.model).toEqual(d.model);
  await expect(
    page.getByRole("button", { name: "Desfazer", exact: true }),
  ).toBeDisabled();
});

test("M4.3 A03/A10: referência não seleciona/une; prioridades, alça e arraste ativos", async ({
  page,
}) => {
  const d = await load(page),
    select = page.getByLabel("Comparar pavimento");
  await select.selectOption("above");
  await page.getByRole("button", { name: "Enquadrar" }).click();
  const before = await exported(page);
  await click(page, -7.5, 5);
  await page.getByTestId("drawing").click({ position: { x: 40, y: 100 } });
  await page.keyboard.press("Delete");
  expect(await exported(page)).toEqual(before);
  await click(page, 5, 0.5);
  await expect(page.getByLabel("Selecionar elemento")).toHaveValue(
    d.model.openings[0].id,
  );
  await click(page, 7, 0.5);
  await expect(
    page.getByLabel("Altura da parede", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Selecionar elemento")
    .selectOption(d.model.slabs[0].id);
  await drag(page, [7, 0.5], [8, 1.5]);
  await expect(page.getByRole("status")).toContainText("Salvo");
  let changed = await exported(page);
  expect(changed.model.slabs[0].contour[0]).toEqual({ x: m, y: m });
  expect(changed.model.slabs[1]).toEqual(before.model.slabs[1]);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await page
    .getByLabel("Selecionar elemento")
    .selectOption(d.model.slabs[0].id);
  await drag(page, [8, 0], [8, -1]);
  await expect(page.getByRole("status")).toContainText("Salvo");
  changed = await exported(page);
  expect(changed.model.slabs[0].contour[0].y).toBe(-m);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await page.getByRole("button", { name: "Parede", exact: true }).click();
  await drag(page, [-8, 2], [-8, -2]);
  await expect(page.getByRole("status")).toContainText("Salvo");
  changed = await exported(page);
  const created = changed.model.walls.filter(
    (w) => !before.model.walls.some((old) => old.id === w.id),
  );
  expect(created).toHaveLength(1);
  expect(created[0].floorId).toBe(d.model.floors[1].id);
  expect(
    changed.model.walls.filter((w) => w.floorId === d.model.floors[2].id),
  ).toEqual(
    before.model.walls.filter((w) => w.floorId === d.model.floors[2].id),
  );
});

test("M4.3 A05/A06: cotas, rótulos, histórico, Fiada e troca com prévia cancelada", async ({
  page,
}) => {
  const d = await load(page),
    select = page.getByLabel("Comparar pavimento");
  await select.selectOption("above");
  await page.getByLabel("Cota do pavimento", { exact: true }).fill("287");
  await page.getByLabel("Cota do pavimento", { exact: true }).press("Tab");
  await expect(page.getByRole("status")).toContainText("Salvo");
  await expect(select).toHaveValue("none");
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(select).toHaveValue("none");
  await select.selectOption("above");
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect(select).toHaveCount(0);
  await expect(page.getByTestId("floor-reference-label")).toHaveCount(0);
  await page.getByLabel("Fiada de referência").selectOption("next");
  await page.getByRole("button", { name: "Planta", exact: true }).click();
  await expect(select).toHaveValue("none");
  await select.selectOption("above");
  await page
    .getByLabel("Selecionar elemento")
    .selectOption(d.model.slabs[0].id);
  await page
    .getByRole("button", { name: "Redesenhar contorno", exact: true })
    .click();
  await click(page, 0, 0);
  await click(page, 8, 0);
  const before = await exported(page),
    camera = await page.getByTestId("drawing").getAttribute("data-camera");
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(d.model.floors[2].id);
  await expect(select).toHaveValue("none");
  await expect(page.getByLabel("Desenho de laje")).toHaveCount(0);
  await expect(page.getByTestId("drawing")).toHaveAttribute(
    "data-camera",
    camera!,
  );
  expect(await exported(page)).toEqual(before);
  await select.selectOption("below");
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(d.model.floors[1].id);
  await expect(select).toHaveValue("above");
  await expect(page.getByTestId("floor-reference-label")).toContainText(
    "Superior",
  );
  await expect(page.getByLabel("Desenho de laje")).toHaveCount(0);
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(d.model.floors[2].id);
  await expect(select).toHaveValue("below");
  await expect(page.getByTestId("floor-reference-label")).toContainText(
    "Inferior",
  );
  await select.selectOption("none");
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(d.model.floors[1].id);
  await expect(select).toHaveValue("above");
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(d.model.floors[2].id);
  await expect(select).toHaveValue("none");
  expect(await exported(page)).toEqual(before);
  expect(await stored(page, before.project.id)).toEqual(before);
});

test("M4.3 A07/A08: ativo vazio, só laje, download/reabertura e readonly sem escrita", async ({
  page,
  context,
}) => {
  const d = await load(page);
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(d.model.floors[0].id);
  await page.getByLabel("Comparar pavimento").selectOption("above");
  await page.getByRole("button", { name: "Enquadrar" }).click();
  const before = await exported(page);
  await page.reload();
  await page
    .getByRole("button", { name: /Comparação M4.3/ })
    .first()
    .click();
  await expect(page.getByLabel("Comparar pavimento")).toHaveValue("none");
  const second = await context.newPage();
  await second.goto("/");
  await second
    .getByRole("button", { name: /Comparação M4.3/ })
    .first()
    .click();
  await expect(second.getByRole("status")).toContainText("Somente leitura");
  await second.getByLabel("Comparar pavimento").selectOption("above");
  await second.getByRole("button", { name: "Enquadrar" }).click();
  expect(await exported(second)).toEqual(before);
  expect(await stored(page, before.project.id)).toEqual(before);
  await second.close();
  expect(await exported(page)).toEqual(before);
  await page.getByTestId("import-file").setInputFiles({
    name: "cópia.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(before)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  await expect(page.getByLabel("Comparar pavimento")).toHaveValue("none");
});

test("M4.3 A09: teclado e apresentação nos três tamanhos", async ({
  page,
}, info) => {
  await load(page);
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    const select = page.getByLabel("Comparar pavimento");
    await select.focus();
    await expect(select).toBeFocused();
    await select.press("Home");
    await select.press("ArrowDown");
    await select.press("ArrowDown");
    await select.press("Enter");
    await expect(select).toHaveValue("above");
    expect((await select.boundingBox())!.width).toBeGreaterThan(150);
    const panel = page.getByRole("complementary", { name: "Propriedades" });
    await expect(panel.getByLabel("Comparar pavimento")).toBeVisible();
    expect((await select.boundingBox())!.width).toBeLessThanOrEqual(
      (await panel.boundingBox())!.width,
    );
    await page.getByRole("button", { name: "Enquadrar" }).click();
    const label = page.getByTestId("floor-reference-label"),
      box = (await label.boundingBox())!,
      drawing = (await page.getByTestId("drawing").boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(drawing.x);
    expect(box.x + box.width).toBeLessThanOrEqual(
      drawing.x + drawing.width + 1,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.tools/m43-${info.project.name}-${width}.png`,
    });
  }
});

test("M4.3 A01/A07: um/dois/quatro andares, só laje e intenção com pendência", async ({
  page,
}) => {
  const single = createProject("Vizinhos", {
    length: 2500,
    width: m,
    height: 700,
  });
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "um.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(single)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  await expect(page.getByLabel("Comparar pavimento")).toHaveCount(0);
  let d = addFloor(single, {
    name: "Laje",
    level: 28000,
    defaultHeight: 28000,
  });
  const active = d.model.floors[0].id,
    upper = d.model.floors[1].id;
  d.model.slabs = [
    {
      id: crypto.randomUUID(),
      floorId: upper,
      thickness: 2100,
      contour: rect(0, 0, 16, 12),
      openings: [],
    },
  ];
  await load(page, d);
  await page.getByLabel("Pavimento", { exact: true }).selectOption(active);
  await page.getByLabel("Comparar pavimento").selectOption("above");
  await expect(page.getByTestId("floor-reference-label")).toContainText("Laje");
  await expect(page.getByTestId("floor-reference-label")).not.toContainText(
    "sem elementos",
  );
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect(
    page.getByText("Este pavimento não tem paredes", { exact: false }).first(),
  ).toBeVisible();
  d = addFloor(d, { name: "Inferior", level: -2100, defaultHeight: 28000 });
  d = addFloor(d, { name: "Distante", level: 35000, defaultHeight: 28000 });
  const w = makeWall({ x: 0, y: 0 }, { x: 8 * m, y: 0 }, m, upper, 2800, 1)!;
  d.model.walls = [w, { ...w, id: crypto.randomUUID() }];
  await load(page, d);
  await page.getByLabel("Pavimento", { exact: true }).selectOption(active);
  await page.getByLabel("Comparar pavimento").selectOption("above");
  await expect(page.getByTestId("floor-reference-label")).toContainText("Laje");
  await expect(
    page.getByLabel("Comparar pavimento").locator("option"),
  ).toHaveCount(3);
  await expect(page.getByLabel("Comparar pavimento")).not.toContainText(
    "Distante",
  );
  const before = await exported(page);
  expect(
    before.generationState.diagnostics.some((diag) => diag.code === "overlap"),
  ).toBe(true);
  await page.getByLabel("Comparar pavimento").selectOption("none");
  expect(await exported(page)).toEqual(before);
});

test("revisão M4.3: comparação conserva prévia fechada e Desfazer cancela antes do histórico", async ({
  page,
}) => {
  const d = fixture();
  d.model.slabs = d.model.slabs.filter(
    (s) => s.floorId !== d.model.floors[1].id,
  );
  await load(page, d);
  const select = page.getByLabel("Comparar pavimento");
  await page.getByLabel("Nome do pavimento").fill("Ativo renomeado");
  await page.getByLabel("Nome do pavimento").press("Tab");
  await expect(page.getByRole("status")).toContainText("Salvo");
  const before = await exported(page);
  await page.getByRole("button", { name: "Laje", exact: true }).click();
  await page.getByLabel("Espessura inicial da laje (cm)").fill("21");
  for (const [x, y] of [
    [0, 0],
    [18, 0],
    [18, 14],
    [0, 14],
  ])
    await click(page, x, y);
  await page
    .getByRole("button", { name: "Fechar contorno", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirmar contorno", exact: true }),
  ).toBeEnabled();
  const camera = await page.getByTestId("drawing").getAttribute("data-camera");
  for (const value of ["above", "below", "none", "above"]) {
    await select.selectOption(value);
    await expect(
      page.getByRole("button", { name: "Confirmar contorno", exact: true }),
    ).toBeEnabled();
    await expect(page.getByTestId("drawing")).toHaveAttribute(
      "data-camera",
      camera!,
    );
  }
  expect(await exported(page)).toEqual(before);
  expect(await stored(page, before.project.id)).toEqual(before);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(page.getByLabel("Desenho de laje")).toHaveCount(0);
  expect(await exported(page)).toEqual(before);
  await expect(select).toHaveValue("above");
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(page.getByLabel("Nome do pavimento")).toHaveValue("Térreo");
  await expect(select).toHaveValue("above");
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  await expect(page.getByLabel("Nome do pavimento")).toHaveValue(
    "Ativo renomeado",
  );
  expect((await exported(page)).model).toEqual(before.model);
});

test("revisão M4.3: geometria exclusiva da referência não recebe hover, seleção ou Delete", async ({
  page,
}) => {
  const d = fixture(),
    refWall = d.model.walls[2];
  d.model.openings.push({
    id: crypto.randomUUID(),
    wallId: refWall.id,
    kind: "window",
    offset: 3 * m,
    width: 2 * m,
    base: 700,
    height: 700,
  });
  await load(page, d);
  await page.getByLabel("Comparar pavimento").selectOption("above");
  await page.getByRole("button", { name: "Enquadrar" }).click();
  const before = await exported(page),
    drawing = page.getByTestId("drawing");
  for (const [x, y] of [
    [-7.5, 6],
    [-8, -3],
    [-5, -2],
    [-5, -1],
  ]) {
    const p = await point(page, x, y);
    await page.mouse.move(p.x, p.y);
    await expect(drawing).toHaveAttribute("data-module-hover", "");
    await page.mouse.click(p.x, p.y);
    await expect(page.getByLabel("Selecionar elemento")).toHaveValue("");
    await expect(
      page.getByLabel("Altura da parede", { exact: true }),
    ).toHaveCount(0);
    await page.keyboard.press("Delete");
  }
  expect(await exported(page)).toEqual(before);
  expect(await stored(page, before.project.id)).toEqual(before);
  await expect(
    page.getByRole("button", { name: "Desfazer", exact: true }),
  ).toBeDisabled();
});

test("revisão M4.3: nomes máximos mantêm identificação e controles dentro do canvas", async ({
  page,
}, info) => {
  const d = fixture();
  d.model.floors[1].name = "A".repeat(100);
  d.model.floors[2].name = "B".repeat(100);
  await load(page, d);
  await page.getByLabel("Comparar pavimento").selectOption("above");
  await page.getByRole("button", { name: "Parede", exact: true }).click();
  await expect(
    page.getByRole("contentinfo").getByTitle("A".repeat(100), { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("contentinfo")).toContainText("Face externa");
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    const canvas = (await page.getByTestId("drawing").boundingBox())!;
    for (const target of [
      page
        .getByTestId("floor-reference-label")
        .locator("..")
        .locator(":scope > span")
        .first(),
      page.getByTestId("floor-reference-label"),
      page.getByRole("button", { name: /Inverter lado/ }),
    ]) {
      const box = (await target.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(canvas.x);
      expect(box.x + box.width).toBeLessThanOrEqual(
        canvas.x + canvas.width + 1,
      );
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.tools/m43-review-long-${info.project.name}-${width}.png`,
    });
  }
});

test("referência no painel do pavimento: recolher e selecionar elementos preservam comparação", async ({
  page,
}) => {
  await load(page);
  const panel = page.getByRole("complementary", { name: "Propriedades" });
  const select = panel.getByLabel("Comparar pavimento");
  await expect(select).toBeVisible();
  await expect(
    page.locator('[class*="fiadaToolbar"]').getByLabel("Comparar pavimento"),
  ).toHaveCount(0);
  const before = await exported(page);
  await select.selectOption("above");
  await panel.getByRole("button", { name: "Recolher propriedades" }).click();
  await expect(page.getByLabel("Comparar pavimento")).toHaveCount(0);
  await expect(page.getByTestId("floor-reference-label")).toBeVisible();
  await page.getByRole("button", { name: "Propriedades", exact: true }).click();
  await expect(select).toHaveValue("above");
  await click(page, 7, 0.5);
  await expect(
    page.getByLabel("Altura da parede", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Comparar pavimento")).toHaveCount(0);
  await expect(page.getByTestId("floor-reference-label")).toBeVisible();
  await page.getByLabel("Selecionar elemento").selectOption("");
  await expect(select).toHaveValue("above");
  await select.selectOption("none");
  expect(await exported(page)).toEqual(before);
  await expect(
    page.getByRole("button", { name: "Desfazer", exact: true }),
  ).toBeDisabled();
});
