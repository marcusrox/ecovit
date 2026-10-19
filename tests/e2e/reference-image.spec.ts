import { expect, test, type Page } from "@playwright/test";
import { createProject, type Project } from "../../src/domain/project";
import { readFile } from "node:fs/promises";
import { parseFile } from "../../src/persistence/files";
const panel = (page: Page) =>
  page.getByRole("region", { name: "Imagem de referência" });
async function state(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    return (await import(path)).useStore.getState();
  });
}
async function open(page: Page) {
  await page.goto("/");
  const d = createProject("M8 Imagem", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  await page.getByTestId("import-file").setInputFiles({
    name: "imagem.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function asset(page: Page, mime = "image/png") {
  const base64 = await page.evaluate((mime) => {
    const c = document.createElement("canvas");
    c.width = 400;
    c.height = 300;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 400, 300);
    ctx.strokeStyle = "#452f9b";
    ctx.lineWidth = 5;
    ctx.strokeRect(50, 50, 300, 200);
    return c.toDataURL(mime).split(",")[1];
  }, mime);
  return {
    name: mime === "image/png" ? "planta.png" : "planta.jpg",
    mimeType: mime,
    buffer: Buffer.from(base64, "base64"),
  };
}
async function clickPixel(page: Page, x: number, y: number) {
  const s = await state(page),
    i = s.imageDraft.image;
  const a = (i.angle * Math.PI) / 180,
    p = {
      x: i.x + i.scale * (x * Math.cos(a) - y * Math.sin(a)),
      y: i.y + i.scale * (x * Math.sin(a) + y * Math.cos(a)),
    };
  const el = page.getByTestId("drawing"),
    box = (await el.boundingBox())!,
    c = JSON.parse((await el.getAttribute("data-camera"))!);
  await page.mouse.click(
    box.x + c.x + p.x * c.scale,
    box.y + c.y + p.y * c.scale,
  );
}
async function add(page: Page, mime = "image/png") {
  await page
    .getByTestId("reference-image-file")
    .setInputFiles(await asset(page, mime));
  await expect
    .poll(async () => (await state(page)).imageDraft?.phase)
    .toBe("first");
  await expect
    .poll(async () => (await state(page)).imageDraft?.fit)
    .toBe(false);
  await clickPixel(page, 50, 100);
  const camera = await page.getByTestId("drawing").getAttribute("data-camera");
  await page.mouse.wheel(0, -100);
  await expect
    .poll(() => page.getByTestId("drawing").getAttribute("data-camera"))
    .not.toBe(camera);
  await clickPixel(page, 350, 100);
  await page.getByLabel("Distância real em cm").fill("600");
  await page.getByRole("button", { name: "Calibrar", exact: true }).click();
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  await expect
    .poll(async () => (await state(page)).doc.model.referenceImages.length)
    .toBe(1);
  await expect(page.getByRole("status")).toContainText("Salvo");
}
test("M8 calibração, ajuste compacto, âncora, histórico, opacidade e arquivo", async ({
  page,
}) => {
  await open(page);
  const before = (await state(page)).doc;
  await add(page);
  const s = await state(page);
  let i = s.doc.model.referenceImages[0];
  expect(s.doc.generated).toEqual(before.generated);
  expect(s.doc.model.measurements).toEqual([]);
  expect(i.scale * 300).toBeCloseTo(60000, -3);
  await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
  const saved = structuredClone(i);
  await page.getByRole("button", { name: "Ajustar", exact: true }).click();
  await page.getByLabel("Ângulo da imagem").fill("27");
  const drawing = page.getByTestId("drawing"),
    box = (await drawing.boundingBox())!;
  const d = (await state(page)).imageDraft.image,
    cam = JSON.parse((await drawing.getAttribute("data-camera"))!);
  const center = {
    x:
      box.x +
      cam.x +
      (d.x +
        d.scale *
          (200 * Math.cos((27 * Math.PI) / 180) -
            150 * Math.sin((27 * Math.PI) / 180))) *
        cam.scale,
    y:
      box.y +
      cam.y +
      (d.y +
        d.scale *
          (200 * Math.sin((27 * Math.PI) / 180) +
            150 * Math.cos((27 * Math.PI) / 180))) *
        cam.scale,
  };
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.mouse.move(center.x + 20, center.y + 15, { steps: 4 });
  await page.mouse.up();
  expect((await state(page)).doc.model.referenceImages[0]).toEqual(saved);
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  i = (await state(page)).doc.model.referenceImages[0];
  expect(i.angle).toBe(27);
  expect(i.x).not.toBe(saved.x);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await state(page)).doc.model.referenceImages[0]).toEqual(saved);
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  await page.getByRole("button", { name: "Ajustar", exact: true }).click();
  await page
    .getByRole("button", { name: "Definir escala novamente", exact: true })
    .click();
  await clickPixel(page, 60, 80);
  await clickPixel(page, 250, 80);
  const anchor = (await state(page)).imageDraft;
  await page.getByLabel("Distância real em cm").fill("400");
  await page.getByRole("button", { name: "Calibrar", exact: true }).click();
  const next = (await state(page)).imageDraft;
  function world(d: typeof next) {
    const i = d.image,
      p = anchor.points[0],
      r = (i.angle * Math.PI) / 180;
    return {
      x: i.x + i.scale * (p.x * Math.cos(r) - p.y * Math.sin(r)),
      y: i.y + i.scale * (p.x * Math.sin(r) + p.y * Math.cos(r)),
    };
  }
  expect(world(next).x).toBeCloseTo(world(anchor).x, 6);
  expect(world(next).y).toBeCloseTo(world(anchor).y, 6);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  const slider = page.getByLabel("Opacidade da imagem");
  await slider.focus();
  await page.keyboard.press("Home");
  await expect
    .poll(async () => (await state(page)).doc.model.referenceImages[0].opacity)
    .toBe(0);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await page.getByLabel("Mostrar imagem").uncheck();
  expect((await state(page)).doc.model.referenceImages[0].visible).toBe(false);
  await page.getByRole("button", { name: "Ajustar", exact: true }).click();
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  expect((await state(page)).doc.model.referenceImages[0].visible).toBe(false);
  await page.getByLabel("Mostrar imagem").check();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  const output = parseFile(
    await readFile((await (await download).path())!, "utf8"),
  );
  expect(output.schemaVersion).toBe(12);
  expect(output.model.referenceImages).toEqual(
    (await state(page)).doc.model.referenceImages,
  );
  await page.reload();
  await page
    .getByRole("button", { name: /M8 Imagem/ })
    .first()
    .click();
  await expect(panel(page)).toContainText("planta.png");
  expect((await state(page)).doc.model.referenceImages).toEqual(
    output.model.referenceImages,
  );
});
test("M8 substituição JPEG, cancelamentos e recusa íntegra de arquivos", async ({
  page,
}) => {
  await open(page);
  await add(page);
  const saved = (await state(page)).doc.model.referenceImages;
  const malformed = await asset(page);
  for (let at = 8; at + 12 < malformed.buffer.length;) {
    const size = malformed.buffer.readUInt32BE(at);
    if (malformed.buffer.toString("ascii", at + 4, at + 8) === "IDAT")
      malformed.buffer.fill(0, at + 8, at + 8 + size);
    at += size + 12;
  }
  await page
    .getByTestId("reference-image-file")
    .setInputFiles(await asset(page, "image/jpeg"));
  await expect
    .poll(async () => (await state(page)).imageDraft?.phase)
    .toBe("first");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  expect((await state(page)).doc.model.referenceImages).toEqual(saved);
  for (const payload of [
    malformed,
    {
      name: "planta.png",
      mimeType: "image/png",
      buffer: Buffer.from("<svg>inválido</svg>"),
    },
    {
      name: "grande.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
    },
  ]) {
    await page.getByTestId("reference-image-file").setInputFiles(payload);
    await expect(panel(page).getByRole("alert")).toBeVisible();
    expect((await state(page)).doc.model.referenceImages).toEqual(saved);
  }
  await page
    .getByTestId("reference-image-file")
    .setInputFiles(await asset(page, "image/jpeg"));
  await expect
    .poll(async () => (await state(page)).imageDraft?.fit)
    .toBe(false);
  await clickPixel(page, 50, 100);
  await clickPixel(page, 50, 100);
  expect((await state(page)).imageDraft.phase).toBe("second");
  await clickPixel(page, 350, 100);
  await page.getByLabel("Distância real em cm").fill("0");
  await page.getByRole("button", { name: "Calibrar", exact: true }).click();
  await expect(panel(page).getByRole("alert")).toBeVisible();
  await page.getByLabel("Distância real em cm").fill("600");
  await page.getByRole("button", { name: "Calibrar", exact: true }).click();
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  expect((await state(page)).doc.model.referenceImages[0].mime).toBe(
    "image/jpeg",
  );
  await page.getByRole("button", { name: "Ajustar", exact: true }).click();
  await page.getByRole("button", { name: "Parede", exact: true }).click();
  expect((await state(page)).imageDraft).toBeNull();
  await page.getByRole("button", { name: "Selecionar", exact: true }).click();
  await page.getByRole("button", { name: "Ajustar", exact: true }).click();
  await page.keyboard.press("Escape");
  expect((await state(page)).imageDraft).toBeNull();
});
test("M8 pavimentos, somente leitura e três resoluções", async ({
  page,
  context,
}, info) => {
  await open(page);
  await add(page);
  await page.evaluate(async () => {
    const path = "/src/state/store.ts",
      floors = "/src/domain/floors.ts";
    const { useStore } = await import(path),
      { duplicateFloor } = await import(floors);
    const d = useStore.getState().doc;
    await useStore
      .getState()
      .commit(
        duplicateFloor(d, d.model.floors[0].id, 28000, "Superior"),
        "floor",
      );
  });
  const copied = (await state(page)).doc as Project;
  expect(copied.model.referenceImages).toHaveLength(2);
  await page.getByRole("button", { name: "Ajustar", exact: true }).click();
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(copied.model.floors[0].id);
  expect((await state(page)).imageDraft).toBeNull();
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(copied.model.floors[1].id);
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect(panel(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Planta", exact: true }).click();
  await page.getByLabel("Mostrar imagem").uncheck();
  expect((await state(page)).doc.model.referenceImages[0].visible).toBe(true);
  await page.getByLabel("Mostrar imagem").check();
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    await expect(panel(page)).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Ajustar", exact: true }),
    ).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.tools/m8-${info.project.name}-${width}.png`,
    });
    await page.getByRole("button", { name: "Ajustar", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Concluir", exact: true }),
    ).toBeInViewport();
    await expect(page.getByLabel("Ângulo da imagem")).toBeInViewport();
    await page.screenshot({
      path: `.tools/m8-adjust-${info.project.name}-${width}.png`,
    });
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  }
  const second = await context.newPage();
  await second.goto("/");
  await second
    .getByRole("button", { name: /M8 Imagem/ })
    .first()
    .click();
  await expect(second.getByRole("status")).toContainText("Somente leitura");
  await expect(
    second.getByRole("button", { name: "Ajustar", exact: true }),
  ).toBeDisabled();
  await expect(second.getByLabel("Mostrar imagem")).toBeDisabled();
  await second.close();
  await page.getByLabel("Mais ações da imagem").click();
  await page.getByRole("button", { name: "Remover", exact: true }).click();
  expect((await state(page)).doc.model.referenceImages).toHaveLength(1);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await state(page)).doc.model.referenceImages).toHaveLength(2);
});
