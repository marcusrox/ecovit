import { test, expect, rejectSaves, type Page } from "./auth";
import { openFerragens, closeFerragens } from "./floor-reinforcement-helpers";
import {
  createProject,
  makeWall,
  defaultGroutSettings,
} from "../../src/domain/project";
import { addFloor } from "../../src/domain/floors";
import { parseFile } from "../../src/persistence/files";
import { readFile } from "node:fs/promises";

async function fixture(page: Page, pending = false) {
  let doc = createProject(
    "Orçamento de aço T-028",
    { length: 2500, width: 1250, height: 600 },
    30000,
  );
  const floor = doc.model.floors[0];
  doc.project.groutSettings = { ...defaultGroutSettings(false), ends: true };
  doc.project.channelLevels = [{ id: crypto.randomUUID(), top: 30000 }];
  doc.project.unitPrices = {
    whole: 100,
    half: 100,
    channel: 100,
    "half-channel": 100,
  };
  doc.project.settlement = { ac1: { percent: 10000, price: 0 } };
  floor.channelReinforcement = {
    enabled: true,
    count: 2,
    diameter: pending ? 71 : 100,
  };
  if (pending)
    floor.clamps = {
      enabled: true,
      diameter: 63,
      length: 3250,
      schedule: { mode: "list", courses: [90] },
    };
  doc.model.walls = [
    makeWall({ x: 0, y: 0 }, { x: 10000, y: 0 }, 1250, floor.id, 30000, 1)!,
  ];
  doc = addFloor(doc, { name: "Superior", level: 36000, defaultHeight: 30000 });
  await page.getByTestId("import-file").setInputFiles({
    name: "aco.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(doc)),
  });
  await expect(page.getByRole("status")).toContainText("Salvo");
  return doc;
}
const budget = (page: Page) =>
  page.getByRole("dialog", { name: "Orçamento", exact: true });
const totals = (page: Page) => page.getByRole("definition");
const price = (page: Page, diameter = "8") =>
  page.getByLabel(`Preço por kg de CA-50 · Ø ${diameter} mm`, { exact: true });
const close = (page: Page) =>
  budget(page)
    .getByRole("button", { name: "Voltar ao desenho", exact: true })
    .click();
async function open(page: Page) {
  await page.getByRole("button", { name: "Orçamento", exact: true }).click();
}
async function state(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts",
      { useStore } = await import(path),
      s = useStore.getState();
    return {
      doc: s.doc,
      past: s.history.past.length,
      active: s.activeFloorId,
      mode: s.mode,
      selected: s.select,
    };
  });
}
async function setPrice(page: Page, diameter: string, value: string) {
  await price(page, diameter).fill(value);
  await price(page, diameter).press("Enter");
  await expect(budget(page).getByRole("status")).toContainText("Salvo");
}

test(
  "T-028 preços, totais, parâmetros por pavimento, histórico e reabertura sem recálculo",
  { tag: "@interface" },
  async ({ page }) => {
    const original = await fixture(page),
      before = await state(page);
    await page.evaluate(async () => {
      const path = "/src/state/store.ts",
        { useStore } = await import(path);
      const tracked = window as unknown as { budgetInvalidations: number };
      tracked.budgetInvalidations = 0;
      useStore.subscribe(
        (s: { doc?: { generationState: { status: string } } }) => {
          if (s.doc?.generationState.status === "outdated")
            tracked.budgetInvalidations++;
        },
      );
    });
    await open(page);
    const steel = budget(page).getByRole("region", {
      name: "Tabela de ferragens",
      exact: true,
    });
    await expect(steel.locator("tbody tr")).toHaveCount(5);
    await expect(totals(page)).toHaveText([
      "R$ 225,00",
      "Indisponível",
      "R$ 0,00",
      "Indisponível",
    ]);
    await setPrice(page, "8", "12");
    await setPrice(page, "10", "10");
    await expect(steel.locator('[data-steel-key="ca50-8"]')).toContainText(
      "2,528",
    );
    await expect(steel.locator('[data-steel-key="ca50-10"]')).toContainText(
      "1,357",
    );
    await expect(totals(page)).toHaveText([
      "R$ 225,00",
      "R$ 43,91",
      "R$ 0,00",
      "R$ 268,91",
    ]);
    const priced = await state(page);
    expect(priced.doc.generated).toEqual(before.doc.generated);
    expect(priced.past).toBe(before.past + 2);
    await budget(page)
      .getByLabel("Pavimento da consulta", { exact: true })
      .selectOption(original.model.floors[1].id);
    await expect(
      page.getByRole("region", {
        name: "Ferragens do pavimento consultado",
        exact: true,
      }),
    ).toContainText("Sem ferragens elegíveis");
    await expect(totals(page)).toHaveText([
      "R$ 225,00",
      "R$ 43,91",
      "R$ 0,00",
      "R$ 268,91",
    ]);
    expect((await state(page)).active).toBe(before.active);
    await page.screenshot({ path: ".tools/t028/desktop.png" });
    await close(page);
    await openFerragens(page);
    await page
      .getByLabel("Comprimento útil por trecho (cm)", { exact: true })
      .fill("100");
    await page
      .getByLabel("Sobreposição por emenda (cm)", { exact: true })
      .fill("30");
    await page
      .getByLabel("Acréscimo para emendas e dobras (%)", { exact: true })
      .fill("20");
    await page
      .getByRole("button", { name: "Aplicar alterações", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    expect((await state(page)).past).toBe(priced.past + 1);
    expect((await state(page)).doc.generated).toEqual(before.doc.generated);
    await closeFerragens(page);
    await open(page);
    await expect(totals(page)).toHaveText([
      "R$ 225,00",
      "R$ 48,94",
      "R$ 0,00",
      "R$ 273,94",
    ]);
    await close(page);
    await page.getByRole("button", { name: /Desfazer/ }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    expect((await state(page)).doc.model.floors[0].steelBudget).toBeUndefined();
    await page.getByRole("button", { name: /Refazer/ }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { budgetInvalidations: number })
            .budgetInvalidations,
      ),
    ).toBe(0);
    const exported = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    const restored = parseFile(
      await readFile((await (await exported).path())!, "utf8"),
    );
    expect(restored.schemaVersion).toBe(32);
    expect(restored.project.steelPrices).toEqual({
      "ca50-8": 1200,
      "ca50-10": 1000,
    });
    expect(restored.model.floors[0].steelBudget).toEqual({
      usefulLength: 10000,
      overlapLength: 3000,
      horizontalExtra: 2000,
    });
    expect(restored.model.floors[1].steelBudget).toBeUndefined();
    const name = (await state(page)).doc.project.name;
    await page.reload();
    await page.getByText(name, { exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await open(page);
    await expect(totals(page)).toHaveText([
      "R$ 225,00",
      "R$ 48,94",
      "R$ 0,00",
      "R$ 273,94",
    ]);
  },
);

test(
  "T-028 zero, preço inválido, perdas de tijolos e consulta parcial/estreita",
  { tag: "@interface" },
  async ({ page }) => {
    await fixture(page);
    await open(page);
    await setPrice(page, "8", "0");
    await setPrice(page, "10", "0");
    await expect(totals(page)).toHaveText([
      "R$ 225,00",
      "R$ 0,00",
      "R$ 0,00",
      "R$ 225,00",
    ]);
    const saved = await state(page);
    await price(page).fill("-1");
    await expect(price(page)).toHaveAttribute("aria-invalid", "true");
    await expect(totals(page)).toHaveText([
      "R$ 225,00",
      "Indisponível",
      "R$ 0,00",
      "Indisponível",
    ]);
    expect((await state(page)).past).toBe(saved.past);
    await setPrice(page, "8", "");
    expect((await state(page)).doc.project.steelPrices).toEqual({
      "ca50-10": 0,
    });
    await setPrice(page, "8", "0");
    await page.getByLabel("Perdas de tijolos (%)", { exact: true }).fill("x");
    await expect(totals(page)).toHaveText([
      "Indisponível",
      "R$ 0,00",
      "R$ 0,00",
      "Indisponível",
    ]);
    await close(page);
    await fixture(page, true);
    await open(page);
    await expect(budget(page)).toContainText("Ferragens parciais");
    await expect(
      page.getByRole("region", {
        name: "Ferragens do pavimento consultado",
        exact: true,
      }),
    ).toContainText("fiada fora da altura");
    await expect(
      budget(page).locator('[data-steel-key="unknown-71"]'),
    ).toContainText("Sem cadastro");
    await page.setViewportSize({ width: 900, height: 720 });
    await price(page).scrollIntoViewIfNeeded();
    expect(
      await budget(page).evaluate((n) => n.scrollWidth <= n.clientWidth),
    ).toBe(true);
    await page.screenshot({ path: ".tools/t028/narrow.png" });
    await close(page);
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      (await import(path)).useStore.setState({ readonly: true });
    });
    await open(page);
    await expect(price(page)).toBeDisabled();
  },
);

test(
  "T-028 falhas de preço e parâmetros preservam candidato e permitem recuperar",
  { tag: "@fluxo" },
  async ({ page }) => {
    await fixture(page);
    await open(page);
    await rejectSaves(page);
    await price(page).fill("12");
    await price(page).press("Enter");
    await expect(budget(page).getByRole("status")).toContainText("Não salvo");
    await expect(price(page)).toBeDisabled();
    expect((await state(page)).doc.project.steelPrices).toEqual({
      "ca50-8": 1200,
    });
    await close(page);
    await page.evaluate(() =>
      (window as unknown as { restorePut: () => void }).restorePut(),
    );
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await openFerragens(page);
    await rejectSaves(page);
    await page
      .getByLabel("Sobreposição por emenda (cm)", { exact: true })
      .fill("40");
    await page
      .getByRole("button", { name: "Aplicar alterações", exact: true })
      .click();
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
      "Não salvo",
    );
    expect(
      (await state(page)).doc.model.floors[0].steelBudget.overlapLength,
    ).toBe(4000);
    await closeFerragens(page);
    await page.evaluate(() =>
      (window as unknown as { restorePut: () => void }).restorePut(),
    );
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Salvo");
    await openFerragens(page);
    await expect(
      page.getByLabel("Sobreposição por emenda (cm)", { exact: true }),
    ).toHaveValue("40");
  },
);
