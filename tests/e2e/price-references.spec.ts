import { test, expect, rejectSaves, type Page } from "./auth";
import { database } from "../../server/db";
import { validateTestDatabaseUrl } from "../../scripts/load-test-env";
import {
  createProject,
  makeWall,
  defaultGroutSettings,
} from "../../src/domain/project";
import {
  priceItemKey,
  projectPriceItems,
  type PriceItem,
} from "../../src/domain/price-references";
import { readFile } from "node:fs/promises";
const url = new URL(validateTestDatabaseUrl(process.env.M12_TEST_DATABASE_URL));
url.searchParams.set("options", "-c search_path=m12_browser");
const db = database(url.toString());
test.afterAll(async () => {
  await db.end();
});
async function seed(item: PriceItem, value: number) {
  await db.query(
    "INSERT INTO ecovit_price_references(key,item,price) VALUES($1,$2::jsonb,$3) ON CONFLICT(key) DO UPDATE SET price=EXCLUDED.price",
    [priceItemKey(item), JSON.stringify(item), value],
  );
}
async function fixture(page: Page) {
  const doc = createProject(
    "Referências T-039",
    { length: 2000, width: 1000, height: 1000 },
    10000,
  );
  doc.project.channelLevels = [];
  doc.project.groutSettings = defaultGroutSettings(false);
  doc.project.unitPrices = { whole: 0 };
  doc.model.walls = [
    makeWall(
      { x: 0, y: 0 },
      { x: 20000, y: 0 },
      1000,
      doc.model.floors[0].id,
      10000,
      1,
    )!,
  ];
  doc.model.openings = [
    {
      id: crypto.randomUUID(),
      wallId: doc.model.walls[0].id,
      kind: "door",
      offset: 4000,
      width: 8000,
      base: 0,
      height: 7000,
      appearance: { type: "swing", orientation: 0 },
      material: { kind: "wood-solid" },
    },
  ];
  const imported = page.waitForResponse(
    (response) =>
      /\/api\/projects\/[0-9a-f-]+$/.test(response.url()) &&
      response.request().method() === "POST",
  );
  await page.getByTestId("import-file").setInputFiles({
    name: "prices.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(doc)),
  });
  expect((await imported).status()).toBe(200);
  await expect(page.getByRole("status")).toContainText("Salvo");
  return doc;
}
const budget = (p: Page) =>
  p.getByRole("dialog", { name: "Orçamento", exact: true });
const brick = (p: Page) =>
  budget(p).getByRole("textbox", {
    name: "Preço unitário de Meio",
    exact: true,
  });
const button = (p: Page) =>
  budget(p).getByRole("button", {
    name: "Usar preço de referência de Meio · un.",
    exact: true,
  });
async function open(p: Page) {
  await p.getByRole("button", { name: "Orçamento", exact: true }).click();
  await expect(
    budget(p)
      .getByRole("status")
      .filter({ hasText: "Consultando e incorporando" }),
  ).toHaveCount(0);
  await expect(
    budget(p).getByRole("status").filter({ hasText: "Salvo" }),
  ).toBeVisible();
}
async function close(p: Page) {
  await budget(p).getByRole("button", { name: "Voltar ao desenho" }).click();
}
async function state(p: Page) {
  return p.evaluate(async () => {
    const path = "/src/state/store.ts";
    const s = (await import(path)).useStore.getState();
    return {
      doc: s.doc,
      history: s.history,
      active: s.activeFloorId,
      saved: s.saved,
    };
  });
}
async function administrationPrices(page: Page) {
  const email = await page.evaluate(async () => {
    const path = "/src/persistence/http.ts";
    return (await import(path)).currentSession().account.email;
  });
  await db.query("UPDATE ecovit_accounts SET is_admin=true WHERE email=$1", [
    email,
  ]);
  await page.reload();
  await page
    .getByRole("button", { name: "Administração", exact: true })
    .click();
  const admin = page.getByRole("dialog", {
    name: "Administração",
    exact: true,
  });
  await admin.getByRole("button", { name: "Preços", exact: true }).click();
  return admin;
}
test(
  "T-039 incorpora os quatro grupos uma vez, mantém zero, permite limpar e usar referência por teclado",
  { tag: "@fluxo" },
  async ({ page }) => {
    const doc = await fixture(page);
    for (const item of projectPriceItems(doc)) await seed(item, 100);
    const initial = await state(page);
    await open(page);
    await expect(
      budget(page).getByRole("textbox", {
        name: "Preço unitário de Inteiro",
        exact: true,
      }),
    ).toHaveValue("0,00");
    await expect(brick(page)).toHaveValue("1,00");
    const incorporated = await state(page);
    expect(incorporated.history.past.length).toBe(
      initial.history.past.length + 1,
    );
    expect(incorporated.doc.generated).toEqual(initial.doc.generated);
    expect(incorporated.doc.project.priceSources).toHaveLength(15);
    await close(page);
    await seed({ group: "bricks", key: "half" }, 200);
    await open(page);
    await expect(brick(page)).toHaveValue("1,00");
    expect((await state(page)).history.past.length).toBe(
      incorporated.history.past.length,
    );
    await brick(page).fill("");
    await brick(page).press("Enter");
    await expect(
      budget(page).getByRole("status").filter({ hasText: "Salvo" }),
    ).toBeVisible();
    await close(page);
    await open(page);
    await expect(brick(page)).toHaveValue("");
    await button(page).focus();
    await expect(button(page)).toHaveAttribute(
      "title",
      "Usar preço de referência",
    );
    await button(page).press("Enter");
    await expect(brick(page)).toHaveValue("2,00");
    await expect(
      budget(page).getByRole("status").filter({ hasText: "Salvo" }),
    ).toBeVisible();
    await brick(page).fill("3,00");
    await brick(page).press("Enter");
    await expect(
      budget(page).getByRole("status").filter({ hasText: "Salvo" }),
    ).toBeVisible();
    await close(page);
    await seed({ group: "bricks", key: "half" }, 400);
    await open(page);
    await expect(brick(page)).toHaveValue("3,00");
    await page.setViewportSize({ width: 900, height: 680 });
    await brick(page).scrollIntoViewIfNeeded();
    await page.screenshot({ path: ".tools/t039/budget-prices.png" });
    await close(page);
    const event = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    const restored = JSON.parse(
      await readFile((await (await event).path())!, "utf8"),
    );
    expect(restored.project.priceSources).toEqual(
      (await state(page)).doc.project.priceSources,
    );
  },
);
test(
  "T-039 Administração mantém referências, recebe esquadria real e preserva preço do projeto",
  { tag: "@fluxo" },
  async ({ page }) => {
    const doc = await fixture(page);
    await open(page);
    const price = budget(page).getByRole("textbox", {
      name: /^Preço de Porta/,
    });
    await price.fill("123,45");
    await price.press("Enter");
    await expect(
      budget(page).getByRole("status").filter({ hasText: "Salvo" }),
    ).toBeVisible();
    await close(page);
    const admin = await administrationPrices(page);
    const ref = admin.getByRole("textbox", {
      name: "Referência de Meio · un.",
      exact: true,
    });
    await expect(ref).toBeVisible();
    await expect(
      admin.getByRole("button", { name: "Salvar preço" }),
    ).toHaveCount(0);
    const items = admin.locator("ul").first().locator("li");
    const first = await items.nth(0).boundingBox(),
      second = await items.nth(1).boundingBox();
    expect(first!.y).toBe(second!.y);
    expect(second!.x).toBeGreaterThan(first!.x);
    const original = await ref.boundingBox(),
      nextRow = await items.nth(2).boundingBox();
    await ref.fill("inválido");
    await expect(ref).toHaveAttribute("aria-invalid", "true");
    expect(await ref.boundingBox()).toEqual(original);
    expect(await items.nth(2).boundingBox()).toEqual(nextRow);
    await expect(
      admin.getByRole("alert").filter({ hasText: "Informe um preço" }),
    ).toBeVisible();
    await page.screenshot({
      path: ".tools/admin-compact/prices-invalid-wide.png",
    });
    await ref.fill("2,50");
    const saved = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/admin/prices") &&
        response.request().method() === "POST",
    );
    await ref.press("Tab");
    expect((await saved).status()).toBe(200);
    await expect(
      admin
        .getByRole("status")
        .filter({ hasText: "Preço de referência salvo" }),
    ).toContainText("Preço de referência salvo");
    await expect(ref).toHaveValue("2,50");
    await expect(
      admin.getByRole("textbox", {
        name: "Referência de Canaleta · un.",
        exact: true,
      }),
    ).toBeFocused();
    const opening = projectPriceItems(doc).find((i) => i.group === "openings")!;
    await expect(
      admin.getByRole("textbox", { name: /Referência de Porta/ }),
    ).toHaveValue("123,45");
    await page.screenshot({ path: ".tools/admin-compact/prices-wide.png" });
    await page.setViewportSize({ width: 900, height: 680 });
    await admin
      .getByRole("heading", { name: "Preços de referência", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: ".tools/t039/admin-prices.png" });
    const narrowFirst = await items.nth(0).boundingBox(),
      narrowSecond = await items.nth(1).boundingBox();
    expect(narrowSecond!.x).toBe(narrowFirst!.x);
    expect(narrowSecond!.y).toBeGreaterThan(narrowFirst!.y);
    await admin.getByRole("button", { name: "Auditoria", exact: true }).click();
    await expect(
      admin.getByRole("cell", {
        name: "Alterar preço de referência",
        exact: true,
      }),
    ).toBeVisible();
    await admin.getByRole("button", { name: "Fechar administração" }).click();
    await seed(opening, 90000);
    // Reopen the imported project from the private list after reload.
    await page
      .getByRole("button", { name: /Referências T-039/ })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: "Orçamento", exact: true }),
    ).toBeVisible();
    await open(page);
    await expect(
      budget(page).getByRole("textbox", { name: /^Preço de Porta/ }),
    ).toHaveValue("123,45");
  },
);
test(
  "Administração salva por Tab em sequência e recupera a fila sem perder rascunhos",
  { tag: "@fluxo" },
  async ({ page }) => {
    const admin = await administrationPrices(page);
    const half = admin.getByRole("textbox", {
      name: "Referência de Meio · un.",
      exact: true,
    });
    const channel = admin.getByRole("textbox", {
      name: "Referência de Canaleta · un.",
      exact: true,
    });
    const halfChannel = admin.getByRole("textbox", {
      name: "Referência de Meia canaleta · un.",
      exact: true,
    });
    await expect(half).toBeVisible();
    const requests: {
      operationId: string;
      expectedPrice: number | null;
      price: number | null;
      item: { key: string };
    }[] = [];
    let release = () => {},
      started = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const firstStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    await page.route("**/api/admin/prices", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      requests.push(route.request().postDataJSON());
      if (requests.length === 1) {
        started();
        await gate;
      } else if (requests.length === 2)
        return route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            code: "test",
            message: "Falha de gravação no ensaio",
          }),
        });
      await route.continue();
    });
    await half.fill("1,00");
    await half.press("Tab");
    await firstStarted;
    await expect(channel).toBeFocused();
    await channel.fill("2,00");
    await channel.press("Tab");
    await expect(halfChannel).toBeFocused();
    expect(requests).toHaveLength(1);
    release();
    await expect(admin.getByRole("alert")).toContainText(
      "Falha de gravação no ensaio",
    );
    await expect(half).toHaveValue("1,00");
    await expect(channel).toHaveValue("2,00");
    await expect(halfChannel).toBeFocused();
    await halfChannel.fill("0");
    await halfChannel.press("Tab");
    expect(requests).toHaveLength(2);
    await admin
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await expect(
      admin
        .getByRole("status")
        .filter({ hasText: "Preço de referência salvo" }),
    ).toBeVisible();
    expect(requests).toHaveLength(4);
    expect(requests[2]).toEqual(requests[1]);
    expect(requests[3].item.key).toBe("half-channel");
    expect(requests[3].price).toBe(0);
    await expect(halfChannel).toHaveValue("0,00");
    const saved = await db.query(
      "SELECT key,price::text FROM ecovit_price_references WHERE key=ANY($1::text[]) ORDER BY key",
      [["bricks:half", "bricks:channel", "bricks:half-channel"]],
    );
    expect(saved.rows).toEqual([
      { key: "bricks:channel", price: "200" },
      { key: "bricks:half", price: "100" },
      { key: "bricks:half-channel", price: "0" },
    ]);
  },
);
test(
  "T-039 somente leitura, falha de consulta e falha ao salvar preservam o projeto",
  { tag: "@fluxo" },
  async ({ page }) => {
    await fixture(page);
    await seed({ group: "bricks", key: "half" }, 500);
    const before = await state(page);
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      (await import(path)).useStore.setState({ readonly: true });
    });
    await open(page);
    await expect(brick(page)).toHaveValue("");
    expect((await state(page)).doc).toEqual(before.doc);
    await expect(button(page)).toHaveAttribute("aria-disabled", "true");
    await close(page);
    await page.evaluate(async () => {
      const path = "/src/state/store.ts";
      (await import(path)).useStore.setState({ readonly: false });
    });
    await page.route("**/api/prices/lookup", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          code: "test",
          message: "Falha de referência no ensaio",
        }),
      }),
    );
    await open(page);
    await expect(budget(page).getByRole("alert")).toContainText(
      "Falha de referência",
    );
    expect((await state(page)).doc).toEqual(before.doc);
    await page.unroute("**/api/prices/lookup");
    await rejectSaves(page);
    await budget(page)
      .getByRole("button", { name: "Tentar consultar referências novamente" })
      .click();
    await expect(
      budget(page).getByRole("status").filter({ hasText: "Não salvo" }),
    ).toBeVisible();
    await expect(brick(page)).toHaveValue("5,00");
    const failed = await state(page);
    expect(failed.saved).not.toBe("saved");
    expect(failed.doc.generated).toEqual(before.doc.generated);
    expect(failed.doc.project.priceSources).toContainEqual({
      item: { group: "bricks", key: "half" },
      source: "reference",
    });
  },
);
