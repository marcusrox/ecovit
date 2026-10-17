import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
  type Project,
} from "../../src/domain/project";
import { addFloor, editFloor } from "../../src/domain/floors";
import { generate } from "../../src/domain/composition";
import { suppressBand } from "../../src/domain/channels";

test("M4.1 A09 troca descarta alternativas numéricas e identifica o ativo no rodapé", async ({
  page,
}) => {
  const d = fixture();
  await load(page, d);
  await page.getByLabel("Cota do pavimento", { exact: true }).fill("1");
  await page.getByLabel("Cota do pavimento", { exact: true }).press("Tab");
  await expect(
    page.getByRole("button", { name: "7 cm", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(d.model.floors[1].id);
  await expect(
    page.getByRole("button", { name: "7 cm", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel("Cota do pavimento", { exact: true }),
  ).toHaveValue("287");
  await expect(page.getByRole("contentinfo")).toContainText("Superior");
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(d.model.floors[0].id);
  await expect(
    page.getByLabel("Cota do pavimento", { exact: true }),
  ).toHaveValue("0");
  await expect(page.getByRole("contentinfo")).toContainText("Térreo");
  expect((await exported(page)).model).toEqual(d.model);
  await expect(
    page.getByRole("button", { name: "Desfazer", exact: true }),
  ).toBeDisabled();
});

test("M4.1 A09 diagnóstico da Fiada identifica e abre o pavimento proprietário", async ({
  page,
}) => {
  const d = fixture();
  d.model.walls.push({ ...d.model.walls[1], id: crypto.randomUUID() });
  await load(page, d);
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  const diagnostic = page
    .getByRole("button")
    .filter({ hasText: "Paredes colineares sobrepostas" });
  await expect(diagnostic).toContainText("Superior");
  await diagnostic.click();
  await expect(page.getByLabel("Pavimento", { exact: true })).toHaveValue(
    d.model.floors[1].id,
  );
  await expect(page.getByRole("contentinfo")).toContainText("Superior");
  expect((await exported(page)).model).toEqual(d.model);
});

function fixture(two = true) {
  let d = createProject("Pavimentos M4.1", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  d.project.channelLevels = [];
  d.project.groutSettings = defaultGroutSettings(false);
  if (two)
    d = addFloor(d, { name: "Superior", level: 28700, defaultHeight: 28000 });
  for (const f of d.model.floors)
    d.model.walls.push(
      makeWall({ x: 0, y: 0 }, { x: 10000, y: 0 }, 1250, f.id, 2100, 1)!,
    );
  return d;
}
async function load(page: Page, d: Project, timeout = 15000) {
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "pavimentos.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo", { timeout });
}
async function exported(page: Page): Promise<Project> {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  return JSON.parse(await readFile((await (await pending).path())!, "utf8"));
}
async function createFloor(page: Page, name: string, level: string) {
  await page
    .getByRole("button", { name: "Novo pavimento", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome do pavimento").fill(name);
  await dialog.getByLabel("Cota do pavimento (cm)").fill(level);
  await dialog
    .getByRole("button", { name: "Criar pavimento", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function point(page: Page, x: number, y: number) {
  const node = page.getByTestId("drawing"),
    box = (await node.boundingBox())!,
    c = JSON.parse((await node.getAttribute("data-camera"))!);
  return { x: box.x + c.x + x * c.scale, y: box.y + c.y + y * c.scale };
}
test("M4.1 A01 altura inicial personalizada resiste a edição, reabertura e remoção do térreo", async ({
  page,
}) => {
  let d = createProject(
    "Padrão personalizado",
    { length: 2800, width: 1400, height: 600 },
    27600,
  );
  d.project.channelLevels = [];
  d.project.groutSettings = defaultGroutSettings(false);
  d = editFloor(d, d.model.floors[0].id, { defaultHeight: 24000 });
  await load(page, d);
  await page
    .getByRole("button", { name: "Novo pavimento", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Altura de novas paredes (cm)")).toHaveValue(
    "276",
  );
  await dialog.getByLabel("Cota do pavimento (cm)").fill("300");
  await dialog
    .getByRole("button", { name: "Criar pavimento", exact: true })
    .click();
  const original = (await exported(page)).model.floors[0].id;
  await page.getByLabel("Pavimento", { exact: true }).selectOption(original);
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Excluir pavimento", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  await page.reload();
  await page.getByRole("button", { name: /Padrão personalizado/ }).click();
  await page
    .getByRole("button", { name: "Novo pavimento", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Altura de novas paredes (cm)")).toHaveValue(
    "276",
  );
});

test("M4.1 A07/A10 duplicar escolha incompatível preserva pendência até resolução explícita", async ({
  page,
}) => {
  const d = fixture(false);
  const f = d.model.floors[0].id;
  d.model.walls.push(
    makeWall({ x: 0, y: 0 }, { x: 0, y: 10000 }, 1250, f, 2100, 1)!,
  );
  const c = generate(d).floors[0].components[0];
  d.adjustments.junctions = [
    {
      id: crypto.randomUUID(),
      floorId: f,
      anchor: { x: c.x, y: c.y },
      binding: "active",
      componentId: c.id,
      signature: "geometria-anterior",
      wallIds: c.wallIds,
      phase: 1,
    },
  ];
  await load(page, d);
  const before = await exported(page);
  await page
    .getByRole("button", { name: "Duplicar pavimento", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Cota do pavimento (cm)")
    .fill("280");
  await page
    .getByRole("button", { name: "Confirmar cópia", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  const copy = await exported(page);
  const choice = copy.adjustments.junctions[1];
  expect(copy.adjustments.junctions[0]).toEqual(
    before.adjustments.junctions[0],
  );
  expect(copy.generated!.floors[0]).toEqual(before.generated!.floors[0]);
  expect(choice.binding).toBe("pending");
  expect(
    copy.generated!.floors[1].diagnostics.some((d) => d.code === "adjustment"),
  ).toBe(true);
  expect(
    copy.generated!.floors[1].courses.every((c) => c.pieces.length === 0),
  ).toBe(true);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await exported(page)).adjustments).toEqual(before.adjustments);
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await exported(page)).adjustments).toEqual(copy.adjustments);
  await page.reload();
  await page.getByRole("button", { name: /Pavimentos M4.1/ }).click();
  const reopened = await exported(page);
  expect(reopened.generated).toEqual(copy.generated);
  expect(reopened.adjustments).toEqual(copy.adjustments);
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(choice.floorId);
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await page
    .getByRole("button", { name: "Descartar escolha de encontro", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  const resolved = await exported(page);
  expect(resolved.adjustments.junctions).toEqual(before.adjustments.junctions);
  expect(resolved.generated!.floors[0]).toEqual(before.generated!.floors[0]);
  expect(resolved.generated!.floors[1].diagnostics).toEqual([]);
  expect(
    resolved.generated!.floors[1].courses.some((c) => c.pieces.length > 0),
  ).toBe(true);
});

test("M4.1 A01/A10 renomear pavimento com escolha incompatível mantém arquivo reabrível", async ({
  page,
}) => {
  const d = fixture(false),
    f = d.model.floors[0].id;
  d.model.walls.push(
    makeWall({ x: 0, y: 0 }, { x: 0, y: 10000 }, 1250, f, 2100, 1)!,
  );
  const c = generate(d).floors[0].components[0];
  d.adjustments.junctions = [
    {
      id: crypto.randomUUID(),
      floorId: f,
      anchor: { x: c.x, y: c.y },
      binding: "active",
      componentId: c.id,
      signature: "geometria-anterior",
      wallIds: c.wallIds,
      phase: 1,
    },
  ];
  d.generated = generate(d);
  d.generationState = {
    status: "current",
    diagnostics: d.generated.diagnostics,
  };
  await load(page, d);
  await page.getByLabel("Nome do pavimento", { exact: true }).fill("Renomeado");
  await page.getByLabel("Nome do pavimento", { exact: true }).press("Tab");
  const copy = await exported(page);
  expect(copy.adjustments).toEqual(d.adjustments);
  expect(copy.generated).toEqual(d.generated);
  await page.reload();
  await page.getByRole("button", { name: /Pavimentos M4.1/ }).click();
  await expect(
    page.getByLabel("Nome do pavimento", { exact: true }),
  ).toHaveValue("Renomeado");
  expect((await exported(page)).generated).toEqual(copy.generated);
});

test("M4.1 A01/02/08/09 criar, cotas negativas, vazio, câmera, limites e histórico", async ({
  page,
}) => {
  await load(page, fixture(false));
  const initial = (await exported(page)).model.floors[0].id;
  const camera = await page.getByTestId("drawing").getAttribute("data-camera");
  await createFloor(page, "Subsolo", "-21");
  await expect(page.getByLabel("Pavimento", { exact: true })).toHaveValue(
    (await exported(page)).model.floors[0].id,
  );
  expect(await page.getByTestId("drawing").getAttribute("data-camera")).toBe(
    camera,
  );
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect(page.getByText("Este pavimento não tem paredes")).toBeVisible();
  await expect(page.getByLabel("Número da fiada")).toHaveCount(0);
  await page.getByRole("button", { name: "Planta", exact: true }).click();
  await createFloor(page, "Primeiro", "280");
  await page
    .getByRole("button", { name: "Novo pavimento", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Cota do pavimento (cm)").fill("281");
  await expect(
    dialog.getByRole("button", { name: "280 cm", exact: true }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "287 cm", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Criar pavimento", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Novo pavimento", exact: true }),
  ).toBeDisabled();
  const before = await exported(page);
  expect(before.model.floors.map((f) => f.level)).toEqual([
    -2100, 0, 28000, 28700,
  ]);
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Excluir pavimento", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).model.floors).toEqual(before.model.floors);
  await page.getByLabel("Pavimento", { exact: true }).selectOption(initial);
  await page.getByLabel("Nome do pavimento", { exact: true }).fill("Novo nome");
  await page.getByLabel("Nome do pavimento", { exact: true }).press("Tab");
  expect(
    (await exported(page)).model.floors.find((f) => f.id === initial)?.name,
  ).toBe("Novo nome");
});
test("M4.1 A04/05 isolamento de graute, fiada local e coordenadas coincidentes", async ({
  page,
}) => {
  await load(page, fixture());
  const d = await exported(page),
    [low, high] = d.model.floors;
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await page.getByLabel("Número da fiada").fill("2");
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  const p = await point(page, 625, 625);
  await page.mouse.click(p.x, p.y);
  let next = await exported(page);
  expect(next.adjustments.grout).toHaveLength(1);
  expect(next.adjustments.grout[0].floorId).toBe(low.id);
  await page.getByLabel("Pavimento", { exact: true }).selectOption(high.id);
  await expect(page.getByLabel("Número da fiada")).toHaveValue("1");
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  await page.mouse.click(p.x, p.y);
  next = await exported(page);
  expect(new Set(next.adjustments.grout.map((a) => a.floorId)).size).toBe(2);
  expect(next.generated!.floors.map((f) => f.grouts?.[0].intervals)).toEqual([
    [{ bottom: 0, top: 2100 }],
    [{ bottom: 28700, top: 30800 }],
  ]);
  await page.getByLabel("Pavimento", { exact: true }).selectOption(low.id);
  await expect(page.getByLabel("Número da fiada")).toHaveValue("2");
});
test("M4.1 A09 redução de altura informa a fiada ajustada e Desfazer recupera o andar lembrado", async ({
  page,
}) => {
  await load(page, fixture());
  const low = (await exported(page)).model.floors[0].id;
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await page.getByLabel("Número da fiada").fill("3");
  await page.getByRole("button", { name: "Planta", exact: true }).click();
  const p = await point(page, 5000, 625);
  await page.mouse.click(p.x, p.y);
  await page.getByLabel("Altura da parede", { exact: true }).fill("14");
  await page.getByLabel("Altura da parede", { exact: true }).press("Enter");
  await expect(page.getByRole("status")).toContainText("Salvo");
  await expect(
    page.getByText(
      "A fiada anterior deixou de existir. Selecionada a fiada 2.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect(page.getByLabel("Número da fiada")).toHaveValue("2");
  await createFloor(page, "Vazio", "350");
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(page.getByLabel("Pavimento", { exact: true })).toHaveValue(low);
  await expect(page.getByLabel("Número da fiada")).toHaveValue("2");
});

test("M4.1 EX-60 cópia de encontro, delta de cota e persistência", async ({
  page,
}) => {
  let d = fixture(false);
  const f = d.model.floors[0].id;
  d = editFloor(d, f, { level: 28000 });
  d.model.walls[0].height = 28000;
  d.model.walls.push(
    makeWall({ x: 0, y: 0 }, { x: 0, y: 10000 }, 1250, f, 28000, 1)!,
  );
  d.project.channelLevels = [{ id: crypto.randomUUID(), top: 11200 }];
  const c = generate(d).floors[0].components[0];
  d.adjustments.junctions = [
    {
      id: crypto.randomUUID(),
      floorId: f,
      anchor: { x: c.x, y: c.y },
      binding: "active",
      componentId: c.id,
      signature: c.signature,
      wallIds: c.wallIds,
      phase: 1,
    },
  ];
  d = suppressBand(d, d.model.walls[0].id, 39200);
  await load(page, d);
  await page
    .getByRole("button", { name: "Duplicar pavimento", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Cota do pavimento (cm)").fill("420");
  await dialog.getByRole("button", { name: "Confirmar cópia" }).click();
  await expect(dialog).not.toBeVisible();
  let copy = await exported(page);
  expect(copy.adjustments.channels.map((a) => a.top)).toEqual([39200, 53200]);
  expect(copy.generated!.floors.map((f) => f.components[0].phase)).toEqual([
    1, 1,
  ]);
  await page.getByLabel("Cota do pavimento", { exact: true }).fill("490");
  await page.getByLabel("Cota do pavimento", { exact: true }).press("Tab");
  copy = await exported(page);
  expect(copy.adjustments.channels.map((a) => a.top)).toEqual([39200, 60200]);
  await page.reload();
  await page.getByRole("button", { name: /Pavimentos M4.1/ }).click();
  expect((await exported(page)).adjustments).toEqual(copy.adjustments);
});
test("M4.1 A09 diagnóstico de outro andar muda para o proprietário", async ({
  page,
}) => {
  const d = fixture();
  d.model.walls.push({ ...d.model.walls[0], id: crypto.randomUUID() });
  await load(page, d);
  const doc = await exported(page),
    [low, high] = doc.model.floors;
  await page.getByLabel("Pavimento", { exact: true }).selectOption(high.id);
  await page.getByRole("button", { name: /Diagnósticos \(/ }).click();
  await page
    .getByRole("button", { name: "Localizar", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Pavimento", { exact: true })).toHaveValue(
    low.id,
  );
  await page
    .getByRole("button", { name: "Ver fiada", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Fiada", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("M4.1 A11 arquivo antigo recusado sem perder o aberto; outra aba somente leitura", async ({
  page,
  context,
}) => {
  await load(page, fixture());
  const before = await exported(page);
  await page.getByTestId("import-file").setInputFiles({
    name: "antigo.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ ...before, schemaVersion: 7 })),
  });
  await expect(page.getByRole("alert")).toContainText("Formato incompatível");
  expect(await exported(page)).toEqual(before);
  const second = await context.newPage();
  await second.goto("/");
  await second.getByRole("button", { name: /Pavimentos M4.1/ }).click();
  await expect(second.getByRole("status")).toContainText("Somente leitura");
  await expect(
    second.getByRole("button", { name: "Novo pavimento", exact: true }),
  ).toBeDisabled();
  expect(await exported(second)).toEqual(before);
  await second.close();
});
test("M4.1 A14 apresentação e controles nos três tamanhos previstos", async ({
  page,
}, info) => {
  await load(page, fixture());
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(page.getByLabel("Pavimento", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Novo pavimento", exact: true }),
    ).toBeVisible();
    for (const name of [
      "Novo pavimento",
      "Duplicar pavimento",
      "Excluir pavimento",
    ]) {
      const button = page.getByRole("button", { name, exact: true });
      await expect(button).toHaveText("");
      await expect(button).toHaveAttribute("title", name);
      await expect(button.locator("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      const box = (await button.boundingBox())!;
      const glyph = (await button.locator("svg").boundingBox())!;
      expect(box.width).toBeLessThanOrEqual(32);
      expect(
        Math.abs(box.x + box.width / 2 - glyph.x - glyph.width / 2),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(box.y + box.height / 2 - glyph.y - glyph.height / 2),
      ).toBeLessThanOrEqual(1);
      await button.focus();
      await expect(button).toBeFocused();
      expect(
        await button.evaluate((el) => getComputedStyle(el, "::after").display),
      ).toBe("block");
    }
    await page.getByLabel("Pavimento", { exact: true }).focus();
    const overflow = await page
      .locator("button")
      .evaluateAll((buttons) =>
        buttons
          .filter(
            (b) =>
              b.getClientRects().length && b.scrollWidth > b.clientWidth + 2,
          )
          .map((b) => b.textContent),
      );
    expect(overflow).toEqual([]);
    await page.screenshot({
      path: `.tools/m41-${info.project.name}-${width}.png`,
    });
  }
});

test("M4.1 A14 carga de quatro pavimentos, 400 paredes e 110 mil peças", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  let d = createProject("Carga M4.1", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  d.project.channelLevels = [];
  d.project.groutSettings = defaultGroutSettings(false);
  for (const level of [42000, 84000, 126000])
    d = addFloor(d, { name: `Andar ${level}`, level, defaultHeight: 28000 });
  for (const f of d.model.floors)
    for (let i = 0; i < 100; i++)
      d.model.walls.push(
        makeWall(
          { x: 0, y: i * 3750 },
          { x: 12500, y: i * 3750 },
          1250,
          f.id,
          35000,
          1,
        )!,
      );
  const start = Date.now();
  await load(page, d, 60000);
  const elapsed = Date.now() - start,
    output = await exported(page);
  expect(output.generated!.floors.map((f) => f.courses.length)).toEqual([
    50, 50, 50, 50,
  ]);
  expect(
    output.generated!.floors.map((f) => f.courses[0].pieces.length),
  ).toEqual([500, 500, 500, 500]);
  expect(
    output.generated!.floors.map((f) => f.courses[1].pieces.length),
  ).toEqual([600, 600, 600, 600]);
  expect(
    output
      .generated!.floors.flatMap((f) => f.courses)
      .reduce((n, r) => n + r.pieces.length, 0),
  ).toBe(110000);
  expect(output.generated!.diagnostics).toEqual([]);
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await page.getByLabel("Número da fiada").fill("50");
  await page.screenshot({ path: `.tools/m41-load-${info.project.name}.png` });
  console.log(
    `M4.1 carga ${info.project.name}: quatro pavimentos, 100 paredes/50 fiadas por andar, 110.000 peças em ${elapsed} ms (abertura/importação/cálculo/salvamento).`,
  );
});
import { MAX_FILE } from "../../src/persistence/files";

test("M4.1 A10/A12 backup grande reconstrói o resultado sem limitar geração ou perder intenção", async ({
  page,
}) => {
  test.setTimeout(120000);
  let d = createProject("Backup M4.1", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  d.project.channelLevels = [];
  d.project.groutSettings = defaultGroutSettings(false);
  for (const level of [42000, 84000, 126000])
    d = addFloor(d, { name: `Andar ${level}`, level, defaultHeight: 28000 });
  for (const f of d.model.floors)
    for (let i = 0; i < 100; i++)
      d.model.walls.push(
        makeWall(
          { x: 0, y: i * 3750 },
          { x: 12500, y: i * 3750 },
          1250,
          f.id,
          140000,
          1,
        )!,
      );
  await load(page, d, 60000);
  const file = await exported(page);
  await expect(page.getByRole("alert")).toContainText(
    "resultado calculado será reconstruído",
  );
  expect(file.model).toEqual(d.model);
  expect(file.adjustments).toEqual(d.adjustments);
  expect(file.generated).toBeNull();
  expect(file.generationState.status).toBe("outdated");
  const json = JSON.stringify(file);
  expect(Buffer.byteLength(json)).toBeLessThanOrEqual(MAX_FILE);
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect(page.getByLabel("Número da fiada")).toHaveAttribute(
    "max",
    "200",
  );
  await page.getByTestId("import-file").setInputFiles({
    name: "backup.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(json),
  });
  await expect(page.getByRole("status")).toContainText("Salvo", {
    timeout: 60000,
  });
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect(page.getByLabel("Número da fiada")).toHaveAttribute(
    "max",
    "200",
  );
  expect((await exported(page)).model).toEqual(d.model);
});
