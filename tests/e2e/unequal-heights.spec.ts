import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { type Project } from "../../src/domain/project";

async function exported(page: Page, readonly = false): Promise<Project> {
  await expect(page.getByRole("status")).toContainText(
    readonly ? "Somente leitura" : "Salvo",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  return JSON.parse(await readFile((await (await download).path())!, "utf8"));
}
test("CT-14 importa resultado antigo, preserva desenho, alturas e histórico ao reabrir", async ({
  page,
}) => {
  const text = await readFile(
      "tests/fixtures/unequal-heights-v9.ecovit",
      "utf8",
    ),
    original = JSON.parse(text);
  await page.goto("/");
  await page.getByTestId("import-file").setInputFiles({
    name: "Alturas.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(text),
  });
  const updated = await exported(page);
  expect(updated.generated!.convention).toBe("nominal-v10");
  expect(updated.model).toEqual(original.model);
  expect(updated.adjustments).toEqual(original.adjustments);
  expect(
    updated.generationState.diagnostics.filter((d) => d.severity === "error"),
  ).toEqual([]);
  expect(
    updated.generated!.floors[0].courses[41].pieces.length,
  ).toBeGreaterThan(0);
  await expect(
    page.getByRole("button", { name: "Desfazer", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await page.getByLabel("Número da fiada").fill("41");
  await page.getByLabel("Número da fiada").press("Tab");
  await expect(page.getByLabel("Número da fiada")).toHaveValue("41");
  await page.reload();
  await page
    .getByRole("button", { name: /Meu projeto R3/ })
    .first()
    .click();
  const reopened = await exported(page);
  expect(reopened.model).toEqual(original.model);
  expect(reopened.generated).toEqual(updated.generated);
  const drawing = page.getByTestId("drawing"),
    box = (await drawing.boundingBox())!;
  const camera = JSON.parse((await drawing.getAttribute("data-camera"))!);
  await page.mouse.click(
    box.x + camera.x + 43125 * camera.scale,
    box.y + camera.y + 1875 * camera.scale,
  );
  await page.getByLabel("Altura da parede", { exact: true }).fill("273");
  await page.getByLabel("Altura da parede", { exact: true }).press("Enter");
  const changed = await exported(page);
  expect(changed.model.walls[0].height).toBe(27300);
  expect(changed.model.slabs).toEqual(original.model.slabs);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  expect((await exported(page)).model).toEqual(original.model);
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  expect((await exported(page)).model.walls[0].height).toBe(27300);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await page
    .getByLabel("Pavimento", { exact: true })
    .selectOption(original.model.floors[1].id);
  await page.getByRole("button", { name: "Fiada", exact: true }).click();
  await expect(
    page.getByText("Este pavimento não tem paredes", { exact: false }).first(),
  ).toBeVisible();
});

for (const readonly of [false, true]) {
  test(`CT-14 reabre registro local v9, somente leitura=${readonly}`, async ({
    page,
    context,
  }) => {
    const original = JSON.parse(
      await readFile("tests/fixtures/unequal-heights-v9.ecovit", "utf8"),
    );
    await page.goto("/");
    await page.evaluate(async (doc) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("ecovit");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("projects", "readwrite");
          tx.objectStore("projects").put({
            id: doc.project.id,
            updatedAt: doc.metadata.updatedAt,
            doc,
          });
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      });
    }, original);
    const holder = readonly ? await context.newPage() : null;
    if (holder) {
      await holder.goto("/");
      await holder.evaluate((id) => {
        void navigator.locks.request(`ecovit:${id}`, () => {
          document.documentElement.dataset.locked = "yes";
          return new Promise<void>(() => {});
        });
      }, original.project.id);
      await expect(holder.locator("html")).toHaveAttribute(
        "data-locked",
        "yes",
      );
    }
    await page.reload();
    await page
      .getByRole("button", { name: /Meu projeto R3/ })
      .first()
      .click();
    const updated = await exported(page, readonly);
    expect(updated.project.id).toBe(original.project.id);
    expect(updated.model).toEqual(original.model);
    expect(updated.generated!.convention).toBe("nominal-v10");
    expect(
      updated.generationState.diagnostics.filter((d) => d.severity === "error"),
    ).toEqual([]);
    await expect(
      page.getByRole("button", { name: "Desfazer", exact: true }),
    ).toBeDisabled();
    const stored = await page.evaluate(async (id) => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open("ecovit");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const row = db
            .transaction("projects")
            .objectStore("projects")
            .get(id);
          row.onsuccess = () => {
            db.close();
            resolve(row.result.doc);
          };
          row.onerror = () => {
            db.close();
            reject(row.error);
          };
        };
      });
    }, original.project.id);
    expect(stored).toEqual(readonly ? original : updated);
    if (holder) {
      await expect(page.getByRole("alert")).toContainText("outra aba");
      await holder.close();
      await page.reload();
      await page
        .getByRole("button", { name: /Meu projeto R3/ })
        .first()
        .click();
      expect((await exported(page)).generated).toEqual(updated.generated);
    }
  });
}
