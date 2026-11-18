import { test, expect, type Page } from "./auth";
import { openFerragens, closeFerragens } from "./floor-reinforcement-helpers";
import { createProject, makeWall } from "../../src/domain/project";
import { duplicateFloor } from "../../src/domain/floors";

async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const s = (await import(path)).useStore.getState();
    return {
      doc: s.doc,
      past: s.history.past.length,
      activeFloorId: s.activeFloorId,
      mode: s.mode,
      course: s.course,
      select: s.select,
      collapsed: s.propertiesCollapsed,
    };
  });
}
async function fixture(page: Page, legacy = false) {
  let d = createProject(
    "Ferragens T-027",
    { length: 2500, width: 1250, height: 700 },
    9800,
  );
  const f = d.model.floors[0].id;
  d.project.channelLevels = [{ id: crypto.randomUUID(), top: 3500 }];
  d.project.groutSettings = {
    junctions: true,
    openings: false,
    ends: false,
    intervals: false,
    distance: 10000,
  };
  d.model.walls = [
    makeWall({ x: -6250, y: 0 }, { x: 7500, y: 0 }, 1250, f, 9800, 1)!,
    makeWall({ x: 0, y: 1250 }, { x: 0, y: 7500 }, 1250, f, 9800, 1)!,
  ];
  if (legacy) {
    d.model.floors[0].clamps = {
      enabled: false,
      diameter: 71,
      length: 3250,
      schedule: { mode: "list", courses: [] },
    };
    d.model.floors[0].channelReinforcement = {
      enabled: true,
      count: 2,
      diameter: 63,
    };
  }
  d = duplicateFloor(d, f, 14000, "Superior");
  await page.getByTestId("import-file").setInputFiles({
    name: "ferragens.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  return d;
}
const apply = (page: Page) =>
  page.getByRole("button", { name: "Aplicar alterações", exact: true }).click();

test(
  "T-027 confirmação atômica, validação, histórico e contexto do pavimento",
  { tag: "@interface" },
  async ({ page }) => {
    await fixture(page);
    const before = await snapshot(page);
    const copy = page.getByRole("button", {
      name: "Duplicar pavimento",
      exact: true,
    });
    const remove = page.getByRole("button", {
      name: "Excluir pavimento",
      exact: true,
    });
    for (const button of [copy, remove]) {
      await expect(button).not.toHaveAttribute("data-tooltip");
      await expect(button).toHaveAttribute("title", /pavimento/);
    }
    const centered = await copy.evaluate((button) => {
      const group = button.parentElement!,
        box = group.getBoundingClientRect();
      const controls = Array.from(group.querySelectorAll("button")).map(
        (node) => node.getBoundingClientRect(),
      );
      return (
        Math.abs(
          (controls[0].left + controls[1].right) / 2 -
            (box.left + box.right) / 2,
        ) < 2 && Math.abs(controls[0].top - controls[1].top) < 2
      );
    });
    expect(centered).toBe(true);
    await page.screenshot({ path: ".tools/t027/sidebar-refined.png" });
    await openFerragens(page);
    const dialog = page.getByRole("dialog", {
      name: "Ferragens do pavimento",
      exact: true,
    });
    await expect(
      dialog.getByRole("heading", {
        name: "Ferragens do pavimento",
        exact: true,
      }),
    ).toBeFocused();
    await expect(dialog).toContainText("Térreo · Cota 0 cm");
    const clampDiameter = page.getByLabel("Diâmetro do ferro (mm)", {
      exact: true,
    });
    const channelDiameter = page.getByLabel("Diâmetro das barras (mm)", {
      exact: true,
    });
    const groutDiameter = page.getByLabel(
      "Diâmetro das barras do graute (mm)",
      { exact: true },
    );
    await expect(clampDiameter).toHaveValue("6,3");
    await expect(channelDiameter).toHaveValue("10");
    await expect(groutDiameter).toHaveValue("8");
    await expect(clampDiameter.locator("option")).toHaveText([
      '5,0 mm (3/16")',
      '6,3 mm (1/4")',
      '8,0 mm (5/16")',
    ]);
    await expect(channelDiameter.locator("option")).toHaveText([
      '8,0 mm (5/16")',
      '10,0 mm (3/8")',
      '12,5 mm (1/2")',
    ]);
    await expect(groutDiameter.locator("option")).toHaveText([
      '8,0 mm (5/16")',
      '10,0 mm (3/8")',
      '12,5 mm (1/2")',
    ]);
    const bounds = await dialog.boundingBox();
    expect(bounds!.width).toBeLessThanOrEqual(1180);
    expect(bounds!.height).toBeLessThan(850);
    await expect(
      page.getByRole("button", { name: "Aplicar grampos", exact: true }),
    ).toHaveCount(0);
    await apply(page);
    expect((await snapshot(page)).past).toBe(before.past);
    await page
      .getByLabel("Graute nos encontros", { exact: true })
      .selectOption("reinforced");
    await page
      .getByLabel("Ativar grampos neste pavimento", { exact: true })
      .check();
    await page.getByLabel("Fiadas dos grampos", { exact: true }).fill("5, 9");
    await groutDiameter.selectOption("12,5");
    await page
      .getByLabel("Ativar armadura das canaletas", { exact: true })
      .check();
    await page
      .getByLabel("Quantidade de barras longitudinais", { exact: true })
      .fill("1.5");
    await apply(page);
    await expect(dialog.getByRole("alert")).toContainText("inteira positiva");
    expect((await snapshot(page)).doc).toEqual(before.doc);
    await page
      .getByLabel("Quantidade de barras longitudinais", { exact: true })
      .fill("2");
    await apply(page);
    await expect(page.getByRole("status")).toContainText("Salvo");
    const after = await snapshot(page);
    expect(after.past).toBe(before.past + 1);
    expect(after.doc.model.floors[0]).toMatchObject({
      groutMode: "reinforced",
      clamps: { enabled: true },
      groutDiameter: 125,
      channelReinforcement: { enabled: true, count: 2, diameter: 100 },
    });
    expect(after.doc.model.floors[1]).toEqual(before.doc.model.floors[1]);
    expect(after.doc.generated.floors[0].clamps).toHaveLength(6);
    expect(after.doc.generated.floors[0].reinforcement.length).toBeGreaterThan(
      0,
    );
    await apply(page);
    expect((await snapshot(page)).past).toBe(after.past);
    await page.screenshot({ path: ".tools/t027/desktop.png" });
    await closeFerragens(page);
    await expect(
      page.getByRole("button", { name: "Ferragens do pavimento", exact: true }),
    ).toBeFocused();
    await page.getByRole("button", { name: /Desfazer/ }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    expect((await snapshot(page)).doc.model.floors).toEqual(
      before.doc.model.floors,
    );
    await page.getByRole("button", { name: /Refazer/ }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    expect((await snapshot(page)).doc.model.floors).toEqual(
      after.doc.model.floors,
    );
    await page
      .getByLabel("Pavimento", { exact: true })
      .selectOption(before.doc.model.floors[1].id);
    await openFerragens(page);
    await expect(dialog).toContainText("Superior · Cota 140 cm");
    await expect(
      page.getByLabel("Graute nos encontros", { exact: true }),
    ).toHaveValue("simple");
    await expect(
      page.getByLabel("Ativar grampos neste pavimento", { exact: true }),
    ).not.toBeChecked();
    await closeFerragens(page);
    await page.reload();
    await page.getByText(after.doc.project.name, { exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await openFerragens(page);
    await expect(
      page.getByLabel("Diâmetro das barras do graute (mm)", { exact: true }),
    ).toHaveValue("12,5");
  },
);

test(
  "Bitolas legadas fora das listas permanecem intactas ao aplicar outro grupo",
  { tag: "@interface" },
  async ({ page }) => {
    await fixture(page, true);
    const before = await snapshot(page);
    await openFerragens(page);
    const clamps = page.getByLabel("Diâmetro do ferro (mm)", { exact: true });
    const channels = page.getByLabel("Diâmetro das barras (mm)", {
      exact: true,
    });
    await expect(clamps).toHaveValue("7,1");
    await expect(channels).toHaveValue("6,3");
    await expect(
      clamps.getByRole("option", { name: "7,1 mm (valor salvo)", exact: true }),
    ).toHaveJSProperty("disabled", true);
    await expect(
      channels.getByRole("option", {
        name: "6,3 mm (valor salvo)",
        exact: true,
      }),
    ).toHaveJSProperty("disabled", true);
    await page
      .getByLabel("Diâmetro das barras do graute (mm)", { exact: true })
      .selectOption("10");
    await apply(page);
    await expect(page.getByRole("status")).toContainText("Salvo");
    const after = await snapshot(page);
    expect(after.doc.model.floors[0].clamps).toEqual(
      before.doc.model.floors[0].clamps,
    );
    expect(after.doc.model.floors[0].channelReinforcement).toEqual(
      before.doc.model.floors[0].channelReinforcement,
    );
    expect(after.doc.generated).toEqual(before.doc.generated);
    expect(after.doc.model.floors[0].groutDiameter).toBe(100);
  },
);

test(
  "T-027 rascunhos, descarte, responsividade e renomeação no primeiro clique",
  { tag: "@interface" },
  async ({ page }) => {
    await fixture(page);
    const name = page.getByLabel("Nome do projeto", { exact: true });
    await name.fill("Ferragens renomeadas");
    await openFerragens(page);
    await expect(page.getByRole("status")).not.toContainText("Salvando");
    await closeFerragens(page);
    await expect(page.getByRole("status")).toContainText("Salvo");
    expect((await snapshot(page)).doc.project.name).toBe(
      "Ferragens renomeadas",
    );
    await page.setViewportSize({ width: 600, height: 720 });
    await openFerragens(page);
    const before = await snapshot(page);
    await page
      .getByLabel("Graute nos encontros", { exact: true })
      .selectOption("reinforced");
    await page.mouse.click(1, 1);
    await expect(
      page.getByRole("dialog", { name: "Ferragens do pavimento", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    const confirm = page.getByRole("dialog", {
      name: "Descartar alterações não aplicadas?",
      exact: true,
    });
    await expect(confirm).toBeVisible();
    await expect(
      confirm.getByRole("button", { name: "Continuar editando", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(confirm).not.toBeVisible();
    await expect(
      page.getByLabel("Graute nos encontros", { exact: true }),
    ).toHaveValue("reinforced");
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await confirm
      .getByRole("button", { name: "Descartar e fechar", exact: true })
      .click();
    expect(await snapshot(page)).toEqual(before);
    await openFerragens(page);
    await expect(
      page.getByLabel("Graute nos encontros", { exact: true }),
    ).toHaveValue("simple");
    const dialog = page.getByRole("dialog", {
      name: "Ferragens do pavimento",
      exact: true,
    });
    const fits = await dialog.evaluate(
      (node) => node.scrollWidth <= node.clientWidth,
    );
    expect(fits).toBe(true);
    await page
      .getByLabel("Diâmetro das barras (mm)", { exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("button", { name: "Aplicar alterações", exact: true }),
    ).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Fechar", exact: true }),
    ).toBeInViewport();
    await page.screenshot({ path: ".tools/t027/narrow.png" });
  },
);

test(
  "T-027 envio bloqueia fechamento e falha mantém candidato para recuperação",
  { tag: "@fluxo" },
  async ({ page }) => {
    await fixture(page);
    await openFerragens(page);
    await page
      .getByLabel("Graute nos encontros", { exact: true })
      .selectOption("reinforced");
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const pattern = "**/api/projects/*";
    await page.route(pattern, async (route) => {
      if (route.request().method() !== "PUT") return route.continue();
      await held;
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          code: "test_rejection",
          message: "Gravação recusada no ensaio.",
        }),
      });
    });
    await apply(page);
    await expect(
      page.getByRole("button", { name: "Fechar", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Cancelar", exact: true }),
    ).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("dialog", { name: "Ferragens do pavimento", exact: true }),
    ).toBeVisible();
    release();
    const dialog = page.getByRole("dialog", {
      name: "Ferragens do pavimento",
      exact: true,
    });
    await expect(dialog.getByRole("alert")).toContainText("Não salvo");
    await expect(
      page.getByRole("button", { name: "Aplicar alterações", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByLabel("Graute nos encontros", { exact: true }),
    ).toBeDisabled();
    await closeFerragens(page);
    expect((await snapshot(page)).doc.model.floors[0].groutMode).toBe(
      "reinforced",
    );
    await page.unroute(pattern);
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await openFerragens(page);
    await expect(
      page.getByLabel("Graute nos encontros", { exact: true }),
    ).toHaveValue("reinforced");
    await closeFerragens(page);
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      (await import(path)).useStore.setState({ readonly: true });
    });
    const before = await snapshot(page);
    await openFerragens(page);
    await expect(
      page.getByLabel("Graute nos encontros", { exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Aplicar alterações", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("dialog", { name: "Ferragens do pavimento", exact: true }),
    ).toContainText("Somente leitura");
    await closeFerragens(page);
    expect(await snapshot(page)).toEqual(before);
  },
);
