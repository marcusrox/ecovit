import { blockEditing, remoteSnapshot } from "./auth";
import { test, expect, type Page } from "./auth";
import { readFile } from "node:fs/promises";
import { type Project } from "../../src/domain/project";

async function exported(page: Page): Promise<Project> {
  await expect(page.getByRole("status")).toContainText("Salvo");
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
  expect(updated.model).toEqual({
    ...original.model,
    measurements: [],
    referenceImages: [],
    imageElements: [],
    customImageAssets: [],
    terrain: null,
  });
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
  expect(reopened.model).toEqual({
    ...original.model,
    measurements: [],
    referenceImages: [],
    imageElements: [],
    customImageAssets: [],
    terrain: null,
  });
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
  expect((await exported(page)).model).toEqual({
    ...original.model,
    measurements: [],
    referenceImages: [],
    imageElements: [],
    customImageAssets: [],
    terrain: null,
  });
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

test("CT-14 registros locais não aparecem; importação manual mantém alturas sem alterar fonte", async ({
  page,
}) => {
  const text = await readFile(
      "tests/fixtures/unequal-heights-v9.ecovit",
      "utf8",
    ),
    original = JSON.parse(text);
  await page.evaluate(async (doc) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("ecovit", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("projects", { keyPath: "id" });
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
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      };
    });
  }, original);
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Meu projeto R3/ }),
  ).toHaveCount(0);
  await page.getByTestId("import-file").setInputFiles({
    name: "Alturas.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(text),
  });
  const updated = await exported(page);
  expect(updated.project.id).not.toBe(original.project.id);
  expect(updated.model.walls).toEqual(original.model.walls);
  expect(updated.generated!.convention).toBe("nominal-v10");
  expect(
    await readFile("tests/fixtures/unequal-heights-v9.ecovit", "utf8"),
  ).toBe(text);
});
test("CT-14 consulta bloqueada preserva alturas, snapshot e intenção remota", async ({
  page,
}) => {
  const text = await readFile(
    "tests/fixtures/unequal-heights-v9.ecovit",
    "utf8",
  );
  await page.getByTestId("import-file").setInputFiles({
    name: "Alturas.ecovit",
    mimeType: "application/json",
    buffer: Buffer.from(text),
  });
  const updated = await exported(page),
    disk = await remoteSnapshot(page);
  await blockEditing(page);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar projeto" }).click();
  const retained = JSON.parse(
    await readFile((await (await download).path())!, "utf8"),
  );
  expect(retained.model).toEqual(updated.model);
  expect(retained.generated).toEqual(updated.generated);
  expect(await remoteSnapshot(page)).toBe(disk);
});
