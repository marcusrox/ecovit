import { test, expect, type Page } from "./auth";
import { createProject, type Project } from "../../src/domain/project";
import { newText, textSchema } from "../../src/domain/text";
import { readFile } from "node:fs/promises";

async function state(page: Page) {
  return page.evaluate(async () => {
    const file = "/src/state/store.ts";
    const s = (await import(file)).useStore.getState();
    return {
      doc: s.doc as Project,
      history: s.history,
      draft: s.textDraft,
      select: s.select,
      busy: s.busy,
      saving: s.saving,
    };
  });
}
async function open(
  page: Page,
  doc = createProject("T-033", { length: 2500, width: 1250, height: 700 }),
) {
  await page.getByTestId("import-file").setInputFiles({
    name: "textos.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(doc)),
  });
  await expect(page.getByRole("status")).toHaveText("Salvo");
  await expect(page.getByTestId("drawing")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Texto", exact: true }),
  ).toBeEnabled();
}
async function at(page: Page, x: number, y: number) {
  const drawing = page.getByTestId("drawing"),
    box = (await drawing.boundingBox())!,
    camera = JSON.parse((await drawing.getAttribute("data-camera"))!);
  return {
    x: box.x + camera.x + x * camera.scale,
    y: box.y + camera.y + y * camera.scale,
    scale: camera.scale,
  };
}
async function click(page: Page, x: number, y: number) {
  const p = await at(page, x, y);
  await page.mouse.click(p.x, p.y);
}
async function saved(page: Page) {
  await expect(page.getByRole("status")).toHaveText("Salvo");
}

test(
  "T-033 painel, prévia conjunta, cancelamento, transporte e reabertura",
  { tag: "@fluxo" },
  async ({ page }) => {
    await open(page);
    const before = await state(page);
    await page.getByRole("button", { name: "Texto", exact: true }).click();
    await click(page, 0, 0);
    const content = page.getByLabel("Conteúdo do texto");
    await expect(content).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Aplicar texto" }),
    ).toBeDisabled();
    await expect(page.getByLabel("Tamanho do texto (cm)")).toHaveValue("10");
    await expect(page.getByLabel("Largura do texto (cm)")).toHaveValue("200");
    await content.fill("Observação acentuada");
    await content.press("End");
    await content.press("Enter");
    await content.press("A");
    await page.getByLabel("Negrito", { exact: true }).check();
    await page.getByLabel("Fundo claro", { exact: true }).check();
    await page.getByLabel("Contorno", { exact: true }).check();
    await page.getByLabel("Cor do texto", { exact: true }).fill("#884422");
    await page.getByLabel("Alinhamento do texto").selectOption("right");
    await page.getByRole("button", { name: /Girar texto 90/ }).click();
    await page.keyboard.press("Delete");
    expect((await state(page)).doc.model.texts[0]).toMatchObject({
      content: "Observação acentuada\nA",
      bold: false,
      rotation: 0,
    });
    expect((await state(page)).history.past).toHaveLength(1);
    await page.getByLabel("Tamanho do texto (cm)").fill("100");
    await page.getByLabel("Largura do texto (cm)").fill("20");
    await expect(page.getByRole("alert")).toContainText("200 cm");
    await expect(
      page.getByRole("button", { name: "Aplicar texto" }),
    ).toBeDisabled();
    await page.getByLabel("Tamanho do texto (cm)").fill("10");
    await page.getByLabel("Largura do texto (cm)").fill("60");
    await page.getByRole("button", { name: "Aplicar texto" }).click();
    await saved(page);
    const confirmed = await state(page),
      t = confirmed.doc.model.texts[0];
    expect(t).toMatchObject({
      content: "Observação acentuada\nA",
      size: 1000,
      width: 6000,
      rotation: 90,
      bold: true,
      background: true,
      border: true,
      color: "#884422",
      align: "right",
    });
    expect(confirmed.history.past).toHaveLength(2);
    expect(confirmed.doc.generated).toEqual(before.doc.generated);
    await page.setViewportSize({ width: 900, height: 768 });
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    await expect(
      page.getByText("Trace a primeira parede.", { exact: true }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: ".tools/t033-properties-900.png" });
    const p = await at(page, t.x - 500, t.y + 500);
    await page.mouse.dblclick(p.x, p.y);
    await expect(content).toBeFocused();
    expect(
      await content.evaluate((field: HTMLTextAreaElement) => [
        field.selectionStart,
        field.selectionEnd,
      ]),
    ).toEqual([0, t.content.length]);
    await content.fill("Texto salvo ao sair");
    await page
      .getByRole("button", { name: "Recolher propriedades", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Propriedades do texto", exact: true })
      .click();
    await expect(content).toHaveValue("Texto salvo ao sair");
    await saved(page);
    const afterBlur = await state(page);
    expect(afterBlur.doc.model.texts[0]).toEqual({
      ...t,
      content: "Texto salvo ao sair",
    });
    expect(afterBlur.history.past).toHaveLength(3);
    await content.fill("Não aplicar");
    await content.press("Escape");
    await expect(content).toHaveValue("Texto salvo ao sair");
    expect((await state(page)).history).toEqual(afterBlur.history);
    const downloading = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    const result = JSON.parse(
      await readFile((await (await downloading).path())!, "utf8"),
    );
    expect(result.model.texts).toEqual(afterBlur.doc.model.texts);
    await page.getByRole("button", { name: "Projetos", exact: true }).click();
    await page.getByRole("button", { name: /T-033.*parede/ }).click();
    await saved(page);
    expect((await state(page)).doc.model.texts).toEqual(
      afterBlur.doc.model.texts,
    );
  },
);

test(
  "T-033 movimentos, alça rotacionada, cópia independente, Delete e histórico",
  { tag: "@fluxo" },
  async ({ page }) => {
    const doc = createProject("T-033 Gestos", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    const t = textSchema.parse({
      ...newText(doc.model.floors[0].id, { x: 0, y: 0 }),
      content: "ABCDEFGHIJKL".repeat(4),
      width: 10000,
      rotation: 90,
    });
    doc.model.texts = [t];
    await open(page, doc);
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    await page
      .getByLabel("Selecionar elemento", { exact: true })
      .selectOption(t.id);
    const p = await at(page, -500, 500);
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.move(p.x + 40, p.y + 25, { steps: 4 });
    await page.mouse.up();
    await saved(page);
    const moved = (await state(page)).doc.model.texts[0];
    expect(moved.x).not.toBe(t.x);
    expect(moved.rotation).toBe(90);
    const dimensions = await page.evaluate(async (t) => {
      const file = "/src/editor/Text.tsx";
      const { annotationLayout } = await import(file);
      return annotationLayout(t);
    }, moved);
    const handle = await at(
      page,
      moved.x - dimensions.height / 2,
      moved.y + moved.width,
    );
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();
    await page.mouse.move(
      handle.x,
      handle.y - moved.width * handle.scale - 15,
      { steps: 4 },
    );
    await page.mouse.up();
    await saved(page);
    expect((await state(page)).doc.model.texts[0]).toMatchObject({
      x: moved.x,
      y: moved.y,
      width: 2000,
      rotation: 90,
    });
    await page
      .getByRole("button", { name: "Duplicar texto", exact: true })
      .click();
    const copyAt = await at(page, moved.x - 2000, moved.y + 2000);
    await page.mouse.click(copyAt.x, copyAt.y);
    await saved(page);
    const copied = (await state(page)).doc.model.texts;
    expect(copied).toHaveLength(2);
    expect(copied[1].id).not.toBe(t.id);
    await page.getByLabel("Conteúdo do texto").fill("Alteração da cópia");
    await page.getByLabel("Tamanho do texto (cm)").fill("9");
    const pending = await state(page);
    const locked = await at(page, copied[1].x - 300, copied[1].y + 300);
    await page.mouse.move(locked.x, locked.y);
    await page.mouse.down();
    await page.mouse.move(locked.x + 25, locked.y + 20, { steps: 3 });
    await page.mouse.up();
    expect((await state(page)).doc.model.texts).toEqual(
      pending.doc.model.texts,
    );
    expect((await state(page)).history).toEqual(pending.history);
    await expect(
      page.getByRole("button", { name: "Duplicar texto" }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Aplicar texto" }).click();
    await saved(page);
    expect((await state(page)).doc.model.texts[0].content).toBe(t.content);
    await page.getByRole("button", { name: "Selecionar", exact: true }).focus();
    await page.keyboard.press("Delete");
    await saved(page);
    expect((await state(page)).doc.model.texts).toHaveLength(1);
    await page.getByRole("button", { name: "Desfazer", exact: true }).click();
    await saved(page);
    expect((await state(page)).doc.model.texts).toHaveLength(2);
  },
);

test(
  "T-033 sobreposição, ferramentas, rascunho e somente leitura",
  { tag: "@interface" },
  async ({ page }) => {
    const doc = createProject("T-033 Seleção", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    const t = textSchema.parse({
      ...newText(doc.model.floors[0].id, { x: 0, y: 0 }),
      content: "Primeiro\n\nÚltimo",
    });
    doc.model.texts = [
      t,
      { ...t, id: crypto.randomUUID(), content: "Mais recente" },
    ];
    doc.model.walls = [
      {
        id: crypto.randomUUID(),
        floorId: t.floorId,
        a: { x: 0, y: 0 },
        b: { x: 20000, y: 0 },
        side: 1,
        height: 2800,
      },
    ];
    await open(page, doc);
    await click(page, 1000, 500);
    expect((await state(page)).select).toBe(doc.model.texts[1].id);
    await page
      .getByLabel("Selecionar elemento", { exact: true })
      .selectOption(t.id);
    await page.getByLabel("Tamanho do texto (cm)").fill("9");
    await page.getByRole("button", { name: "Parede", exact: true }).click();
    expect((await state(page)).draft).toBeNull();
    expect((await state(page)).doc.model.texts[0].content).toBe(t.content);
    await page.getByRole("button", { name: "Selecionar", exact: true }).click();
    await page
      .getByLabel("Selecionar elemento", { exact: true })
      .selectOption(doc.model.walls[0].id);
    const handle = await at(page, 0, 0);
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();
    await page.mouse.move(handle.x - 20, handle.y, { steps: 3 });
    await page.mouse.up();
    await saved(page);
    expect((await state(page)).select).toBe(doc.model.walls[0].id);
    await page
      .getByLabel("Selecionar elemento", { exact: true })
      .selectOption(t.id);
    await page.evaluate(async () => {
      const file = "/src/state/store.ts";
      (await import(file)).useStore.setState({ readonly: true });
    });
    await expect(page.getByLabel("Conteúdo do texto")).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Excluir texto", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Texto", exact: true }),
    ).toBeDisabled();
    await page.screenshot({ path: ".tools/t033-text-properties.png" });
  },
);

test(
  "T-033 conteúdo salva no blur sem perder contexto, Cancelar ou ajustes pendentes",
  { tag: "@fluxo" },
  async ({ page }) => {
    const doc = createProject("T-033 Blur", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    const first = textSchema.parse({
      ...newText(doc.model.floors[0].id, { x: 0, y: 0 }),
      content: "Antes",
    });
    const second = {
      ...first,
      id: crypto.randomUUID(),
      x: 30000,
      content: "Outro",
    };
    doc.model.texts = [first, second];
    await open(page, doc);
    const field = page.getByLabel("Conteúdo do texto");
    await page
      .getByLabel("Selecionar elemento", { exact: true })
      .selectOption(first.id);
    await field.fill("Salvo ao selecionar outro");
    await click(page, second.x + 1000, second.y + 500);
    await saved(page);
    expect((await state(page)).select).toBe(second.id);
    expect((await state(page)).doc.model.texts[0].content).toBe(
      "Salvo ao selecionar outro",
    );
    expect((await state(page)).history.past).toHaveLength(1);
    const p = await at(page, second.x + 1000, second.y + 500);
    await page.mouse.dblclick(p.x, p.y);
    expect(
      await field.evaluate((el: HTMLTextAreaElement) => [
        el.selectionStart,
        el.selectionEnd,
      ]),
    ).toEqual([0, second.content.length]);
    await field.fill("   ");
    await field.press("Tab");
    await expect(page.getByRole("alert")).toContainText("texto não vazio");
    expect((await state(page)).doc.model.texts[1].content).toBe("Outro");
    await field.fill("Cancelar sem salvar");
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    expect((await state(page)).doc.model.texts[1].content).toBe("Outro");
    expect((await state(page)).history.past).toHaveLength(1);
    await field.fill("Salvo por Tab");
    await field.press("Tab");
    await saved(page);
    expect((await state(page)).doc.model.texts[1].content).toBe(
      "Salvo por Tab",
    );
    await page.getByRole("button", { name: "Desfazer", exact: true }).click();
    await saved(page);
    expect((await state(page)).doc.model.texts[1].content).toBe("Outro");
    await page.getByRole("button", { name: "Refazer", exact: true }).click();
    await saved(page);
    expect((await state(page)).doc.model.texts[1].content).toBe(
      "Salvo por Tab",
    );
    await page.mouse.click(p.x, p.y);
    await page.getByLabel("Tamanho do texto (cm)").fill("12");
    await field.fill("Conteúdo independente");
    await field.press("Tab");
    await saved(page);
    expect((await state(page)).doc.model.texts[1]).toMatchObject({
      content: "Conteúdo independente",
      size: 1000,
    });
    await expect(page.getByLabel("Tamanho do texto (cm)")).toHaveValue("12");
    await page
      .getByRole("button", { name: "Aplicar texto", exact: true })
      .click();
    await saved(page);
    expect((await state(page)).doc.model.texts[1].size).toBe(1200);
    expect((await state(page)).history.past).toHaveLength(4);
    await field.fill("Aplicado uma única vez");
    await page
      .getByRole("button", { name: "Aplicar texto", exact: true })
      .click();
    await saved(page);
    expect((await state(page)).history.past).toHaveLength(5);
    expect((await state(page)).doc.model.texts[1].content).toBe(
      "Aplicado uma única vez",
    );
    await page.setViewportSize({ width: 900, height: 768 });
    await page
      .getByRole("button", { name: "Aplicar texto", exact: true })
      .scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: ".tools/t033-blur-actions-900.png" });
  },
);
