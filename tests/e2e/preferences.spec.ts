import { test, expect, type Page } from "@playwright/test";
import { createProject, makeWall } from "../../src/domain/project";

async function open(page: Page) {
  await page.addInitScript(() => {
    const contexts = new Map<HTMLCanvasElement, string[]>();
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    const text = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      contexts.set(this.canvas, []);
      return clear.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.fillText = function (...args) {
      const entries = contexts.get(this.canvas) ?? [];
      entries.push(args[0]);
      contexts.set(this.canvas, entries);
      return text.apply(this, args);
    };
    Object.assign(window, {
      renderedTexts: () =>
        [...contexts.entries()]
          .filter(([canvas]) => canvas.isConnected)
          .flatMap(([, texts]) => texts),
    });
  });
  await page.goto("/");
  const doc = createProject("Preferências " + "nome longo ".repeat(7), {
    length: 2500,
    width: 1250,
    height: 700,
  });
  const floor = doc.model.floors[0].id;
  doc.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      { x: 20000, y: 0 },
      1250,
      floor,
      28000,
      1,
      "10000000-0000-4000-8000-000000000001",
    )!,
    makeWall(
      { x: 30000, y: 20000 },
      { x: 30000, y: 0 },
      1250,
      floor,
      21000,
      1,
      "10000000-0000-4000-8000-000000000002",
    )!,
  ];
  doc.model.openings = [
    {
      id: "10000000-0000-4000-8000-000000000003",
      wallId: "10000000-0000-4000-8000-000000000001",
      kind: "door",
      offset: 5000,
      width: 7500,
      base: 0,
      height: 21000,
    },
    {
      id: "10000000-0000-4000-8000-000000000004",
      wallId: "10000000-0000-4000-8000-000000000002",
      kind: "window",
      offset: 2500,
      width: 5000,
      base: 7000,
      height: 14000,
    },
    {
      id: "10000000-0000-4000-8000-000000000005",
      wallId: "10000000-0000-4000-8000-000000000002",
      kind: "opening",
      offset: 12500,
      width: 5000,
      base: 0,
      height: 21000,
    },
  ];
  await page.getByTestId("import-file").setInputFiles({
    name: "m6.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(doc)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function texts(page: Page) {
  return page.evaluate(() =>
    (window as unknown as { renderedTexts: () => string[] }).renderedTexts(),
  );
}
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const { useStore } = await import(path);
    const { doc, history } = useStore.getState();
    return JSON.stringify({ doc, history });
  });
}
const trigger = (page: Page) =>
  page.getByRole("button", { name: "Preferências do Ecovit", exact: true });

test("M6 preferências independentes, medidas de paredes, persistência e integridade", async ({
  page,
}) => {
  await open(page);
  await expect.poll(() => texts(page)).toContain("C: 200 cm · H: 280 cm");
  await expect.poll(() => texts(page)).toContain("C: 200 cm · H: 210 cm");
  const before = await snapshot(page);
  await trigger(page).click();
  const dialog = page.getByRole("dialog");
  for (const name of ["Portas", "Janelas", "Vãos", "Paredes"])
    await expect(
      dialog.getByRole("checkbox", { name, exact: true }),
    ).toBeChecked();
  await dialog
    .getByRole("checkbox", { name: "Paredes", exact: true })
    .uncheck();
  await expect
    .poll(async () => (await texts(page)).some((t) => t.startsWith("C:")))
    .toBe(false);
  await expect
    .poll(async () => (await texts(page)).some((t) => t.startsWith("Porta ·")))
    .toBe(true);
  await dialog.getByRole("checkbox", { name: "Portas", exact: true }).uncheck();
  await expect
    .poll(async () => (await texts(page)).some((t) => t.startsWith("Janela ·")))
    .toBe(true);
  await expect
    .poll(async () => (await texts(page)).some((t) => t.startsWith("Vão ·")))
    .toBe(true);
  await dialog
    .getByRole("checkbox", { name: "Janelas", exact: true })
    .uncheck();
  await expect
    .poll(async () => (await texts(page)).some((t) => t.startsWith("Janela ·")))
    .toBe(false);
  await expect
    .poll(async () => (await texts(page)).some((t) => t.startsWith("Vão ·")))
    .toBe(true);
  await dialog.getByRole("checkbox", { name: "Vãos", exact: true }).uncheck();
  await expect
    .poll(async () => (await texts(page)).some((t) => t.startsWith("Vão ·")))
    .toBe(false);
  await page.keyboard.press("Escape");
  await expect(trigger(page)).toBeFocused();
  expect(await snapshot(page)).toBe(before);
  await page.reload();
  await page
    .getByRole("button", { name: /Preferências nome longo/ })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  await expect
    .poll(async () =>
      (await texts(page)).some(
        (t) => t.startsWith("C:") || t.startsWith("Porta ·"),
      ),
    )
    .toBe(false);
  await trigger(page).click();
  await expect(
    page.getByRole("checkbox", { name: "Paredes", exact: true }),
  ).not.toBeChecked();
  await page.getByRole("checkbox", { name: "Paredes", exact: true }).check();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect.poll(() => texts(page)).toContain("C: 200 cm · H: 280 cm");
});

test("M6 processamento, pendências, ajuda, readonly e falha de gravação", async ({
  page,
}) => {
  await open(page);
  const status = page.getByTestId("composition-status");
  await expect(status).toHaveText("Composição nominal atualizada");
  await page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const { useStore } = await import(path);
    useStore.setState({ busy: true });
  });
  await expect(status).toHaveText("Processando…");
  await page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const { useStore } = await import(path);
    const s = useStore.getState();
    useStore.setState({
      busy: false,
      readonly: true,
      doc: {
        ...s.doc,
        generated: null,
        generationState: { status: "outdated", diagnostics: [] },
      },
    });
  });
  await expect(status).toHaveText("Resultado desatualizado");
  await expect(
    page.getByRole("button", { name: "Recalcular", exact: true }),
  ).toBeDisabled();
  const before = await snapshot(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("quota");
    };
  });
  await trigger(page).click();
  await page.getByRole("checkbox", { name: "Paredes", exact: true }).uncheck();
  await expect(page.getByRole("alert")).toContainText("não foi salva");
  await page.keyboard.press("Escape");
  expect(await snapshot(page)).toBe(before);
  await page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const { useStore } = await import(path);
    const s = useStore.getState();
    useStore.setState({
      readonly: false,
      doc: {
        ...s.doc,
        generationState: {
          status: "current",
          diagnostics: [{ severity: "error", message: "Teste" }],
        },
      },
    });
  });
  await expect(status).toHaveText("Atualizado · com pendências");
  await page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const { useStore } = await import(path);
    const s = useStore.getState();
    useStore.setState({
      doc: {
        ...s.doc,
        generated: null,
        generationState: { status: "outdated", diagnostics: [] },
      },
    });
  });
  await page.getByRole("button", { name: "Recalcular", exact: true }).click();
  await expect(status).toHaveText("Composição nominal atualizada");
  await expect(
    page.getByRole("button", { name: "Recalcular", exact: true }),
  ).toHaveCount(0);
  await page.getByText("Como usar o editor", { exact: true }).click();
  await expect(page.getByText(/Clique: selecionar/)).toBeVisible();
  await expect(
    page.getByText(/Botão do meio \+ arraste ou Espaço/),
  ).toBeVisible();
  await expect(page.getByText(/Clique para selecionar/)).toHaveCount(0);
});

test("M6 apresentação e renomeação em um clique nas três resoluções", async ({
  page,
}, info) => {
  await open(page);
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({
      path: `.tools/m6-canvas-${info.project.name}-${width}.png`,
    });
    await page
      .getByLabel("Nome do projeto", { exact: true })
      .fill("Renomeado " + width);
    await trigger(page).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByLabel("Nome do projeto", { exact: true }),
    ).toHaveValue("Renomeado " + width);
    await expect(
      page.getByRole("checkbox", { name: "Portas", exact: true }),
    ).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Fechar", exact: true }),
    ).toBeInViewport();
    await page.screenshot({
      path: `.tools/m6-preferences-${info.project.name}-${width}.png`,
    });
    await page.keyboard.press("Escape");
    await expect(trigger(page)).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const settings = (await page
      .getByRole("button", { name: "Configurações", exact: true })
      .boundingBox())!;
    const preferences = (await trigger(page).boundingBox())!;
    expect(preferences.x).toBeGreaterThanOrEqual(settings.x + settings.width);
    const svg = (await trigger(page).locator("svg").boundingBox())!;
    expect(
      Math.abs(svg.x + svg.width / 2 - preferences.x - preferences.width / 2),
    ).toBeLessThanOrEqual(1);
  }
});

test("M6 rótulos acompanham edição, histórico, seleção e modos", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const { useStore } = await import(path);
    const s = useStore.getState();
    s.choose("10000000-0000-4000-8000-000000000001");
    await s.commit({
      ...s.doc,
      model: {
        ...s.doc.model,
        walls: s.doc.model.walls.map((w: { id: string }) =>
          w.id === "10000000-0000-4000-8000-000000000001"
            ? {
                ...w,
                a: { x: 1250, y: 1250 },
                b: { x: 23750, y: 1250 },
                height: 21000,
              }
            : w,
        ),
      },
    });
  });
  await expect.poll(() => texts(page)).toContain("C: 225 cm · H: 210 cm");
  await expect.poll(() => texts(page)).toContain("A");
  await trigger(page).click();
  await page.getByRole("checkbox", { name: "Paredes", exact: true }).uncheck();
  await page.keyboard.press("Escape");
  await expect
    .poll(async () =>
      (await texts(page)).some(
        (t) => t === "A" || t === "B" || t.startsWith("C:"),
      ),
    )
    .toBe(false);
  await expect(page.getByLabel("Comprimento", { exact: true })).toHaveValue(
    "225",
  );
  await trigger(page).click();
  await page.getByRole("checkbox", { name: "Paredes", exact: true }).check();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect.poll(() => texts(page)).toContain("C: 200 cm · H: 280 cm");
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  await expect.poll(() => texts(page)).toContain("C: 225 cm · H: 210 cm");
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect
    .poll(async () => (await texts(page)).some((t) => t.startsWith("C:")))
    .toBe(false);
  await expect
    .poll(async () => (await texts(page)).some((t) => t.startsWith("Porta ·")))
    .toBe(true);
  await trigger(page).click();
  await page.getByRole("checkbox", { name: "Portas", exact: true }).uncheck();
  await page.keyboard.press("Escape");
  await expect
    .poll(async () => (await texts(page)).some((t) => t.startsWith("Porta ·")))
    .toBe(false);
  await page.getByRole("button", { name: "Planta", exact: true }).click();
  await page.getByRole("button", { name: "Parede", exact: true }).click();
  await expect(
    page.getByText("Arraste para desenhar · Esc cancela", { exact: true }),
  ).toBeVisible();
});
