import { test, expect, type Page } from "./auth";
import { createProject } from "../../src/domain/project";
import { catalogItem } from "../../src/domain/image-catalog";
import { standardElement } from "../../src/domain/image-elements";

async function opened(page: Page) {
  const doc = createProject("T-032", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  doc.model.imageElements = [0, 40000].map((x) => ({
    ...standardElement(catalogItem("sofa", 1)!, doc.model.floors[0].id),
    x,
  }));
  await page.getByTestId("import-file").setInputFiles({
    name: "segundo-plano.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(doc)),
  });
  await expect(page.getByRole("status")).toHaveText("Salvo");
  await expect(page.getByTestId("drawing")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Selecionar", exact: true }),
  ).toBeEnabled();
}
async function state(page: Page) {
  return page.evaluate(async () => {
    const file = "/src/state/store.ts";
    const s = (await import(file)).useStore.getState();
    return {
      doc: s.doc,
      history: s.history,
      busy: s.busy,
      saving: s.saving,
      readonly: s.readonly,
    };
  });
}
async function at(page: Page, x: number, y: number) {
  const drawing = page.getByTestId("drawing"),
    box = (await drawing.boundingBox())!;
  const camera = JSON.parse((await drawing.getAttribute("data-camera"))!);
  return {
    x: box.x + camera.x + x * camera.scale,
    y: box.y + camera.y + y * camera.scale,
  };
}
async function drag(page: Page, x: number, delta: number) {
  const p = await at(page, x, 0);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(p.x + delta, p.y + 20, { steps: 4 });
  await page.mouse.up();
}
test(
  "T-032 movimentos reais continuam durante resposta atrasada sem cancelar gesto posterior",
  { tag: "@fluxo" },
  async ({ page }) => {
    await opened(page);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let writes = 0,
      active = 0,
      maximum = 0;
    const requests: { operationId: string; expectedRevision: string }[] = [];
    await page.route("**/api/projects/*", async (route) => {
      if (route.request().method() !== "PUT") return route.continue();
      const index = ++writes;
      requests.push(route.request().postDataJSON());
      maximum = Math.max(maximum, ++active);
      const response = await route.fetch();
      if (index === 1) await gate;
      await route.fulfill({ response });
      active--;
    });
    await drag(page, 0, 45);
    await expect(page.getByRole("status")).toHaveText("Salvando…");
    await expect(
      page.getByRole("button", { name: "Desfazer", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Refazer", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Projetos", exact: true }),
    ).toBeDisabled();
    await drag(page, 40000, -40);
    const second = await state(page);
    expect(second.history.past).toHaveLength(2);
    expect(second.busy).toBe(false);
    await page.keyboard.press("Control+z");
    await page.keyboard.press("Control+y");
    expect((await state(page)).history).toEqual(second.history);
    const element = second.doc.model.imageElements[0];
    const p = await at(page, element.x, element.y);
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.move(p.x + 15, p.y + 10, { steps: 3 });
    release();
    // The first acknowledgment cannot terminate the gesture now under the mouse.
    await expect.poll(() => writes).toBeGreaterThanOrEqual(2);
    await page.mouse.move(p.x + 55, p.y + 25, { steps: 4 });
    await page.mouse.up();
    await expect(page.getByRole("status")).toHaveText("Salvo");
    const final = await state(page);
    expect(final.history.past).toHaveLength(3);
    expect(final.doc.model.imageElements[0].x).not.toBe(element.x);
    expect(maximum).toBe(1);
    expect(new Set(requests.map((r) => r.operationId)).size).toBe(
      requests.length,
    );
    for (let i = 1; i < requests.length; i++)
      expect(BigInt(requests[i].expectedRevision)).toBe(
        BigInt(requests[i - 1].expectedRevision) + 1n,
      );
    const remote = await (
      await page.request.get(`/api/projects/${final.doc.project.id}`)
    ).json();
    expect(remote.doc.model.imageElements).toEqual(
      final.doc.model.imageElements,
    );
    await expect(
      page.getByRole("button", { name: "Desfazer", exact: true }),
    ).toBeEnabled();
  },
);

test(
  "T-032 rejeição conserva trabalho posterior e recuperação repete o pedido original",
  { tag: "@fluxo" },
  async ({ page }) => {
    await opened(page);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const requests: string[] = [];
    await page.route("**/api/projects/*", async (route) => {
      if (route.request().method() !== "PUT") return route.continue();
      requests.push(route.request().postData()!);
      if (requests.length === 1) {
        await gate;
        return route.fulfill({
          status: 422,
          contentType: "application/json",
          body: JSON.stringify({
            code: "test_rejection",
            message: "Recusa dirigida T-032.",
          }),
        });
      }
      return route.continue();
    });
    await drag(page, 0, 45);
    await expect(page.getByRole("status")).toHaveText("Salvando…");
    await drag(page, 40000, -40);
    const pending = await state(page);
    release();
    await expect(page.getByRole("status")).toHaveText("Não salvo");
    expect((await state(page)).readonly).toBe(true);
    const downloading = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    const { readFile } = await import("node:fs/promises");
    const downloaded = JSON.parse(
      await readFile((await (await downloading).path())!, "utf8"),
    );
    expect(downloaded.model.imageElements).toEqual(
      pending.doc.model.imageElements,
    );
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText("Salvo");
    expect(requests).toHaveLength(3);
    expect(requests[1]).toBe(requests[0]);
    expect((await state(page)).history).toEqual(pending.history);
    expect((await state(page)).doc.model.imageElements).toEqual(
      pending.doc.model.imageElements,
    );
  },
);

test(
  "T-032 offline suspende pendência e Recalcular só atua após recuperação explícita",
  { tag: "@fluxo" },
  async ({ page }) => {
    await opened(page);
    await page.evaluate(async () => {
      const file = "/src/state/store.ts";
      const { useStore } = await import(file);
      const doc = useStore.getState().doc;
      useStore.setState({
        doc: {
          ...doc,
          generated: null,
          generationState: { status: "outdated", diagnostics: [] },
        },
      });
    });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let writes = 0;
    await page.route("**/api/projects/*", async (route) => {
      if (route.request().method() !== "PUT") return route.continue();
      const index = ++writes;
      const response = await route.fetch();
      if (index === 1) await gate;
      return route.fulfill({ response });
    });
    await drag(page, 0, 45);
    await expect(page.getByRole("status")).toHaveText("Salvando…");
    const recalculate = page.getByRole("button", {
      name: "Recalcular",
      exact: true,
    });
    await expect(recalculate).toBeDisabled();
    await drag(page, 40000, -40);
    const pending = await state(page);
    await page.evaluate(async () => {
      const file = "/src/state/store.ts";
      const { useStore } = await import(file);
      await useStore.getState().recalculate();
      window.dispatchEvent(new Event("offline"));
      window.dispatchEvent(new Event("online"));
    });
    release();
    await expect.poll(async () => (await state(page)).saving).toBe(false);
    await expect(page.getByRole("status")).toHaveText("Sem conexão");
    expect(writes).toBe(1);
    expect((await state(page)).doc.model.imageElements).toEqual(
      pending.doc.model.imageElements,
    );
    await expect(recalculate).toBeDisabled();
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText("Salvo");
    expect(writes).toBe(2);
    await expect(recalculate).toBeEnabled();
    await recalculate.click();
    await expect(recalculate).toHaveCount(0);
    expect(writes).toBe(2);
    expect((await state(page)).history).toEqual(pending.history);
  },
);
