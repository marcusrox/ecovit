import { expect, test, type Page } from "@playwright/test";
import {
  createProject,
  defaultGroutSettings,
  makeWall,
  type Project,
  type GroutAdjustment,
} from "../../src/domain/project";

function fixture(automatic = true) {
  const d = createProject("Restaurar grautes", {
      length: 2500,
      width: 1250,
      height: 700,
    }),
    f = d.model.floors[0].id,
    upper = crypto.randomUUID();
  d.model.floors.push({
    ...d.model.floors[0],
    id: upper,
    name: "Superior",
    level: 28000,
  });
  d.project.groutSettings = defaultGroutSettings(automatic);
  d.project.channelLevels = [];
  d.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 40000, y: 0 }, 1250, f, 28000, 1)!,
    makeWall({ x: 0, y: 0 }, { x: 0, y: 30000 }, 1250, f, 28000, 1)!,
    makeWall({ x: 0, y: 40000 }, { x: 30000, y: 40000 }, 1250, f, 28000, 1)!,
    makeWall({ x: 0, y: 0 }, { x: 40000, y: 0 }, 1250, upper, 28000, 1)!,
  ];
  const [a, b, c, u] = d.model.walls.map((w) => w.id);
  const adjustment = (
    floorId: string,
    wallIds: string[],
    x: number,
    y: number,
    action: GroutAdjustment["action"],
  ): GroutAdjustment => ({
    id: crypto.randomUUID(),
    floorId,
    wallIds,
    x,
    y,
    action,
  });
  d.adjustments.grout = [
    adjustment(f, [a], 5000, 0, "include"),
    adjustment(f, [a, b], 0, 0, "exclude"),
    adjustment(f, [b], 0, 5000, "include"),
    adjustment(f, [c], 0, 40000, "exclude"),
    adjustment(f, [c], 90000, 90000, "include"),
    adjustment(upper, [u], 2500, 0, "include"),
  ];
  return d;
}
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts",
      s = (await import(path)).useStore.getState();
    return {
      doc: s.doc as Project,
      select: s.select as string | null,
      component: s.component as string | null,
      past: s.history.past.length,
    };
  });
}
async function open(page: Page, d = fixture()) {
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "grautes.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
}
async function click(page: Page, x: number, y: number) {
  const host = page.getByTestId("drawing"),
    box = (await host.boundingBox())!,
    c = JSON.parse((await host.getAttribute("data-camera"))!);
  await page.mouse.click(box.x + c.x + x * c.scale, box.y + c.y + y * c.scale);
}
const panel = (page: Page) =>
  page.getByRole("region", { name: "Graute vertical" });

test("grautes mantêm paredes e navegação visíveis durante inclusão e remoção, sem editar o resultado antigo", async ({
  page,
}, info) => {
  await open(page, fixture(false));
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    const pixels = () =>
      page.getByTestId("drawing").evaluate(async (host) => {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        const camera = JSON.parse(host.getAttribute("data-camera")!);
        return [...host.querySelectorAll("canvas")].map((canvas) => {
          const ratio = canvas.width / canvas.getBoundingClientRect().width;
          return [
            ...canvas
              .getContext("2d")!
              .getImageData(
                Math.round((camera.x + 11250 * camera.scale) * ratio),
                Math.round((camera.y + 100 * camera.scale) * ratio),
                1,
                1,
              ).data,
          ];
        });
      });
    for (const action of ["include", "exclude"]) {
      const before = await snapshot(page);
      const toolbarButton = page.getByRole("button", {
        name: "Graute",
        exact: true,
      });
      const toolbarBox = await toolbarButton.boundingBox();
      const drawingBox = await page.getByTestId("drawing").boundingBox();
      const oldPixels = await pixels();
      expect(oldPixels.some((p) => p[3] > 0)).toBe(true);
      await page.evaluate(async () => {
        const path = "/src/persistence/database.ts";
        const { db } = await import(path);
        const table = db.table("projects"),
          original = table.put;
        let release!: () => void;
        const gate = new Promise<void>((resolve) => {
          release = resolve;
        });
        (window as unknown as { resumeGroutSave: () => void }).resumeGroutSave =
          release;
        table.put = async function (...args: unknown[]) {
          table.put = original;
          await gate;
          return original.apply(this, args);
        };
      });
      await click(page, 625, 10625);
      await expect(page.getByTestId("composition-status")).toBeVisible();
      await expect(page.getByTestId("composition-status")).toHaveText(
        "Recalculando grautes…",
      );
      expect(await toolbarButton.boundingBox()).toEqual(toolbarBox);
      expect(await page.getByTestId("drawing").boundingBox()).toEqual(
        drawingBox,
      );
      await expect(page.getByLabel("Número da fiada")).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Graute", exact: true }),
      ).toBeDisabled();
      expect(await pixels()).toEqual(oldPixels);
      const waiting = await snapshot(page);
      expect(waiting.doc.generated).toBeNull();
      expect(waiting.doc.generationState.status).toBe("outdated");
      expect(waiting.past).toBe(before.past + 1);
      await click(page, 20625, 625);
      expect((await snapshot(page)).doc).toEqual(waiting.doc);
      if (action === "include")
        await page.screenshot({
          path: info.outputPath(`recalculando-${width}.png`),
        });
      await page.evaluate(() =>
        (
          window as unknown as { resumeGroutSave: () => void }
        ).resumeGroutSave(),
      );
      await expect(page.getByRole("status")).toContainText("Salvo");
      const after = await snapshot(page);
      expect(after.doc.generationState.status).toBe("current");
      expect(after.doc.adjustments.grout).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ x: 0, y: 10000, action }),
        ]),
      );
      expect(
        after.doc.generated!.floors[0].grouts!.some(
          (g) => g.x === 0 && g.y === 10000,
        ),
      ).toBe(action === "include");
    }
  }
  await page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const { useStore } = await import(path);
    const doc = useStore.getState().doc!;
    useStore.setState({
      retainedGroutResult: doc.generated,
      doc: {
        ...doc,
        generated: null,
        generationState: { status: "outdated", diagnostics: [] },
      },
      message: "Cálculo não concluído: falha simulada.",
    });
  });
  await expect(page.getByTestId("composition-status")).toHaveText(
    "Desenho anterior · resultado desatualizado",
  );
  await expect(
    page.getByRole("button", { name: "Graute", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: info.outputPath("resultado-desatualizado-900.png"),
  });
  await page.getByRole("button", { name: "Recalcular", exact: true }).click();
  await expect(page.getByTestId("composition-status")).toHaveText(
    "Atualizado · com pendências",
  );
});

test("Fiada seleciona parede individual, pergunta no encontro e mantém conjuntos no painel", async ({
  page,
}, info) => {
  const d = fixture();
  await open(page, d);
  const before = await snapshot(page);
  await click(page, 10625, 625);
  expect(await snapshot(page)).toMatchObject({
    select: d.model.walls[0].id,
    component: null,
    past: before.past,
    doc: before.doc,
  });
  await expect(page.getByLabel("Parede dos grautes")).toHaveValue(
    d.model.walls[0].id,
  );
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  const holes = page.getByLabel("Selecionar furo de graute");
  const holeCount = await holes.locator("option").count();
  await expect(holes.locator('option[value="0:10000"]')).toHaveCount(1);
  await expect(holes.locator('option[value="10000:40000"]')).toHaveCount(1);
  await holes.selectOption("0:0");
  await expect(panel(page)).toContainText("Eixo compartilhado");
  await page.getByRole("button", { name: /Conjunto 1/ }).click();
  expect(await snapshot(page)).toMatchObject({
    select: null,
    component: before.doc.generated!.floors[0].components.find((c) =>
      c.wallIds.includes(d.model.walls[0].id),
    )!.id,
  });
  await expect(page.getByLabel("Parede dos grautes")).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Graute", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("button", { name: "Prévia da alternativa B" }),
  ).toBeVisible();
  await click(page, 625, 625);
  await page.getByRole("button", { name: /Parede 2 · 300 cm/ }).click();
  expect(await snapshot(page)).toMatchObject({
    select: d.model.walls[1].id,
    component: null,
  });
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  await expect(holes.locator("option")).toHaveCount(holeCount);
  await page.getByRole("button", { name: "Graute", exact: true }).click();
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    await page.getByRole("button", { name: "Enquadrar", exact: true }).click();
    await page.getByLabel("Parede dos grautes").scrollIntoViewIfNeeded();
    await expect(page.getByLabel("Parede dos grautes")).toBeInViewport();
    await page.screenshot({
      path: info.outputPath(`parede-fiada-${width}.png`),
    });
  }
  await click(page, 20000, 15000);
  expect(await snapshot(page)).toMatchObject({
    select: null,
    component: null,
    doc: before.doc,
    past: before.past,
  });
});

test("Graute edita outras paredes sem trocar a parede selecionada e permite desfazer", async ({
  page,
}) => {
  const d = fixture(false);
  await open(page, d);
  await click(page, 10625, 625);
  const before = await snapshot(page);
  const tool = page.getByRole("button", { name: "Graute", exact: true });
  await tool.click();
  for (const [x, y, wall] of [
    [0, 10000, d.model.walls[1].id],
    [10000, 40000, d.model.walls[2].id],
  ] as const) {
    const previous = await snapshot(page);
    await click(page, x + 625, y + 625);
    await expect(page.getByRole("status")).toContainText("Salvo");
    const added = await snapshot(page);
    expect(added.select).toBe(d.model.walls[0].id);
    expect(added.doc.adjustments.grout).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ x, y, action: "include", wallIds: [wall] }),
      ]),
    );
    await expect(tool).toHaveAttribute("aria-pressed", "true");
    await page
      .getByLabel("Selecionar furo de graute")
      .selectOption(`${x}:${y}`);
    await expect(
      panel(page).getByRole("button", { name: "Remover graute", exact: true }),
    ).toBeVisible();
    await click(page, x + 625, y + 625);
    await expect(page.getByRole("status")).toContainText("Salvo");
    const removed = await snapshot(page);
    expect(removed.doc.adjustments.grout).toEqual(
      added.doc.adjustments.grout.map((a) =>
        a.x === x && a.y === y && a.wallIds.includes(wall)
          ? { ...a, action: "exclude" }
          : a,
      ),
    );
    const others = removed.doc.adjustments.grout.filter(
      (a) => !(a.x === x && a.y === y && a.wallIds.includes(wall)),
    );
    expect(others).toHaveLength(previous.doc.adjustments.grout.length);
    expect(others).toEqual(
      expect.arrayContaining(previous.doc.adjustments.grout),
    );
  }
  expect((await snapshot(page)).select).toBe(before.select);
  const final = await snapshot(page);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await snapshot(page)).doc.adjustments.grout).toEqual(
    final.doc.adjustments.grout.map((a) =>
      a.x === 10000 && a.y === 40000 ? { ...a, action: "include" } : a,
    ),
  );
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await snapshot(page)).doc.adjustments.grout).toEqual(
    final.doc.adjustments.grout,
  );
});

test("restaurar parede confirma contagens e compartilhados, cancela sem mudar e permite desfazer/reabrir", async ({
  page,
}, info) => {
  const d = fixture();
  await open(page, d);
  await click(page, 10625, 625);
  const before = await snapshot(page),
    action = page.getByRole("button", {
      name: "Restaurar nesta parede…",
      exact: true,
    });
  await action.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("1 inclusão manual e 1 exclusão manual");
  await expect(dialog).toContainText("compartilhado");
  await expect(
    dialog.getByRole("button", { name: "Cancelar", exact: true }),
  ).toBeFocused();
  await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(action).toBeFocused();
  expect((await snapshot(page)).doc).toEqual(before.doc);
  await action.click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await action.click();
  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(
      dialog.getByRole("button", {
        name: "Restaurar automáticos",
        exact: true,
      }),
    ).toBeInViewport();
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`restaurar-parede-${width}.png`),
    });
  }
  await dialog
    .getByRole("button", { name: "Restaurar automáticos", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status")).toContainText("Salvo");
  const after = await snapshot(page);
  expect(after.doc.adjustments.grout).toEqual(
    before.doc.adjustments.grout.slice(2),
  );
  expect(after.past).toBe(before.past + 1);
  expect(after.doc.project.groutSettings).toEqual(
    before.doc.project.groutSettings,
  );
  expect(
    after.doc.generated!.floors[0].grouts!.some((g) => g.x === 0 && g.y === 0),
  ).toBe(true);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await snapshot(page)).doc.adjustments).toEqual(
    before.doc.adjustments,
  );
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  expect((await snapshot(page)).doc.adjustments).toEqual(after.doc.adjustments);
  await page.reload();
  await page
    .getByRole("button", { name: /Restaurar grautes.*cópia/ })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  expect((await snapshot(page)).doc.adjustments).toEqual(after.doc.adjustments);
});

test("restaurar pavimento remove pendentes, preserva vizinho e respeita categorias desligadas", async ({
  page,
}) => {
  const d = fixture(false);
  await open(page, d);
  const before = await snapshot(page);
  await expect(
    page.getByRole("button", { name: "Restaurar nesta parede…", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Restaurar no pavimento…", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("pavimento “Térreo”");
  await expect(dialog).toContainText("categorias automáticas estão desligadas");
  await dialog
    .getByRole("button", { name: "Restaurar automáticos", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Salvo");
  const after = await snapshot(page);
  expect(after.doc.adjustments.grout).toEqual([
    before.doc.adjustments.grout.at(-1),
  ]);
  expect(after.doc.generated!.floors[0].grouts).toEqual([]);
  expect(after.doc.generated!.floors[1]).toEqual(
    before.doc.generated!.floors[1],
  );
  expect(after.doc.project.groutSettings).toEqual(d.project.groutSettings);
  expect(after.past).toBe(before.past + 1);
  await expect(
    page.getByRole("button", { name: "Restaurar no pavimento…", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await snapshot(page)).doc.adjustments).toEqual(
    before.doc.adjustments,
  );
});

test("parede em readonly permite consulta filtrada e bloqueia restauração e edição", async ({
  page,
  context,
}) => {
  const d = fixture();
  await open(page, d);
  const other = await context.newPage();
  await other.goto("/");
  await other
    .getByRole("button", { name: /Restaurar grautes.*cópia/ })
    .first()
    .click();
  await expect(other.getByRole("status")).toContainText("Somente leitura");
  await other.getByRole("button", { name: "Fiada", exact: true }).click();
  const before = await snapshot(other);
  await click(other, 10625, 625);
  await expect(other.getByLabel("Parede dos grautes")).toHaveValue(
    d.model.walls[0].id,
  );
  await expect(
    other.getByRole("button", { name: "Restaurar nesta parede…", exact: true }),
  ).toBeDisabled();
  await expect(
    other.getByRole("button", { name: "Restaurar no pavimento…", exact: true }),
  ).toBeDisabled();
  expect((await snapshot(other)).doc).toEqual(before.doc);
  await other.close();
});
