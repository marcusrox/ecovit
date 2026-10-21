import { test, expect, type Page } from "@playwright/test";

async function seed(page: Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    const domainPath = "/src/domain/project.ts",
      databasePath = "/src/persistence/database.ts";
    const { createProject } = await import(domainPath);
    const { saveProject } = await import(databasePath);
    for (const name of ["Abrir casa de teste", "Outro projeto"])
      await saveProject(
        createProject(name, { length: 2500, width: 1250, height: 700 }),
      );
  });
  await page.reload();
}

async function pauseRead(page: Page, fail = false) {
  await page.evaluate(async (fail) => {
    const path = "/src/persistence/database.ts";
    const { db } = await import(path);
    const table = db.table("projects");
    const get = table.get.bind(table);
    const state = {
      reads: 0,
      cursorBeforeRead: "",
      feedbackBeforeRead: false,
      fail,
    };
    let resume = () => {};
    const gate = new Promise<void>((resolve) => {
      resume = resolve;
    });
    Object.assign(window, { openingProbe: state, resumeOpening: resume });
    table.get = async (id: string) => {
      state.reads++;
      const status = [...document.querySelectorAll('[role="status"]')].find(
        (el) => el.textContent === "Abrindo projeto…",
      );
      state.feedbackBeforeRead =
        !!status && status.getBoundingClientRect().height > 0;
      state.cursorBeforeRead = getComputedStyle(
        document.elementFromPoint(400, 400)!,
      ).cursor;
      await gate;
      if (state.fail) throw new Error("Falha ao ler projeto para teste.");
      return get(id);
    };
  }, fail);
}

async function resume(page: Page) {
  await page.evaluate(() =>
    (window as unknown as { resumeOpening: () => void }).resumeOpening(),
  );
}

test("feedback e cursor precedem leitura; clique repetido bloqueado; abre com uma leitura", async ({
  page,
}, testInfo) => {
  await seed(page);
  await pauseRead(page);
  await page.getByRole("button", { name: /Abrir casa de teste/ }).click();
  await expect(page.getByRole("status")).toHaveText("Abrindo projeto…");
  await expect(
    page.getByRole("button", { name: /Outro projeto/ }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /Novo projeto/ }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /Carregar .ecovit/ }),
  ).toBeDisabled();
  for (const button of await page
    .getByRole("button", { name: /^(Duplicar|Excluir)$/ })
    .all())
    await expect(button).toBeDisabled();
  // Dispatching another click also exercises the store's concurrency guard.
  await page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const { useStore } = await import(path);
    await useStore.getState().open("ignored");
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { openingProbe: { reads: number } })
            .openingProbe.reads,
      ),
    )
    .toBe(1);
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as {
            openingProbe: {
              feedbackBeforeRead: boolean;
              cursorBeforeRead: string;
            };
          }
        ).openingProbe,
    ),
  ).toMatchObject({ feedbackBeforeRead: true, cursorBeforeRead: "wait" });

  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [900, 680],
  ]) {
    await page.setViewportSize({ width, height });
    const card = page.getByRole("button", { name: /Abrir casa de teste/ });
    await expect(card).toBeDisabled();
    await expect(card).toHaveCSS("cursor", "wait");
    const icon = card.locator("svg"),
      container = icon.locator("..").locator("..");
    const i = (await icon.boundingBox())!,
      c = (await container.boundingBox())!;
    expect(Math.abs(i.x + i.width / 2 - c.x - c.width / 2)).toBeLessThanOrEqual(
      1,
    );
    expect(
      Math.abs(i.y + i.height / 2 - c.y - c.height / 2),
    ).toBeLessThanOrEqual(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.tools/opening-${testInfo.project.name}-${width}.png`,
      fullPage: true,
    });
  }
  await resume(page);
  await expect(page.getByTestId("drawing")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Salvo");
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-opening-project",
  );
  await expect(
    page.getByRole("button", { name: "Projetos", exact: true }),
  ).toHaveCSS("cursor", "pointer");
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { openingProbe: { reads: number } }).openingProbe
          .reads,
    ),
  ).toBe(1);
});

test("erro mantém a lista e restaura controles/cursor para tentar novamente", async ({
  page,
}) => {
  await seed(page);
  await pauseRead(page, true);
  await page.getByRole("button", { name: /Abrir casa de teste/ }).click();
  await expect(page.getByRole("status")).toHaveText("Abrindo projeto…");
  await resume(page);
  await expect(page.getByRole("alert")).toContainText(
    "Falha ao ler projeto para teste.",
  );
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-opening-project",
  );
  await expect(
    page.getByRole("button", { name: /Abrir casa de teste/ }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: /Novo projeto/ }),
  ).toBeEnabled();
  await expect(page.getByRole("button", { name: /Outro projeto/ })).toHaveCSS(
    "cursor",
    "pointer",
  );
  await page.evaluate(() => {
    (
      window as unknown as { openingProbe: { fail: boolean } }
    ).openingProbe.fail = false;
  });
  await page.getByRole("button", { name: /Abrir casa de teste/ }).click();
  await expect(page.getByTestId("drawing")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

for (const [width, height, failBitmap] of [
  [1366, 768, false],
  [1280, 720, false],
  [900, 680, false],
  [1366, 768, true],
] as const) {
  test(`primeiro quadro completo preserva câmera em ${width}×${height}${failBitmap ? " com falha de bitmap" : ""}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    await seed(page);
    await page.evaluate(async () => {
      const databasePath = "/src/persistence/database.ts";
      const elementsPath = "/src/domain/image-elements.ts";
      const catalogPath = "/src/domain/image-catalog.ts";
      const { db, saveProject } = await import(databasePath);
      const { standardElement } = await import(elementsPath);
      const { imageCatalog } = await import(catalogPath);
      const project = (await db.table("projects").toArray())
        .map((row: { doc: unknown }) => row.doc)
        .find(
          (p: { project: { name: string } }) =>
            p.project.name === "Abrir casa de teste",
        );
      project.model.imageElements.push({
        ...standardElement(imageCatalog[0], project.model.floors[0].id),
        x: 14000,
        y: 9000,
      });
      await saveProject(project);
      localStorage.setItem(
        `ecovit:project-view:v1:${project.project.id}`,
        JSON.stringify({ centerX: 14000, centerY: 9000, scale: 0.024 }),
      );
    });
    await page.reload();
    await page.evaluate((failBitmap) => {
      const decode = HTMLImageElement.prototype.decode;
      let calls = 0;
      let resume = () => {};
      const gate = new Promise<void>((resolve) => {
        resume = resolve;
      });
      const probe = {
        waiting: false,
        first: null as null | {
          scale: number;
          centerX: number;
          centerY: number;
        },
      };
      Object.assign(window, { bitmapProbe: probe, resumeBitmap: resume });
      HTMLImageElement.prototype.decode = async function () {
        if (++calls === 2) {
          probe.waiting = true;
          await gate;
          if (failBitmap) throw new Error("Falha de bitmap para teste");
        }
        return decode.call(this);
      };
      const sample = () => {
        const drawing = document.querySelector<HTMLElement>(
          '[data-testid="drawing"]',
        );
        if (drawing && getComputedStyle(drawing).visibility === "visible") {
          const box = drawing.getBoundingClientRect();
          const camera = JSON.parse(drawing.dataset.camera!);
          probe.first = {
            scale: camera.scale,
            centerX: (box.width / 2 - camera.x) / camera.scale,
            centerY: (box.height / 2 - camera.y) / camera.scale,
          };
        } else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }, failBitmap);
    await page.getByRole("button", { name: /Abrir casa de teste/ }).click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { bitmapProbe: { waiting: boolean } })
              .bitmapProbe.waiting,
        ),
      )
      .toBe(true);
    await expect(page.getByTestId("drawing")).toBeHidden();
    await expect(page.getByRole("status")).toHaveText("Abrindo projeto…");
    await expect(
      page.getByRole("button", { name: /Outro projeto/ }),
    ).toBeDisabled();
    await expect(page.locator("html")).toHaveAttribute(
      "data-opening-project",
      "true",
    );
    await page.screenshot({
      path: `.tools/canvas-preparing-${testInfo.project.name}-${width}.png`,
    });
    await page.evaluate(() =>
      (window as unknown as { resumeBitmap: () => void }).resumeBitmap(),
    );
    await expect(page.getByTestId("drawing")).toBeVisible();
    if (failBitmap)
      await expect(page.getByRole("alert")).toContainText(
        "Não foi possível carregar a imagem do mobiliário",
      );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { bitmapProbe: { first: unknown } })
              .bitmapProbe.first,
        ),
      )
      .not.toBeNull();
    const first = await page.evaluate(
      () =>
        (
          window as unknown as {
            bitmapProbe: {
              first: { scale: number; centerX: number; centerY: number };
            };
          }
        ).bitmapProbe.first,
    );
    expect(first.scale).toBe(0.024);
    expect(first.centerX).toBeCloseTo(14000, 4);
    expect(first.centerY).toBeCloseTo(9000, 4);
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-opening-project",
    );
    await page.screenshot({
      path: `.tools/canvas-ready-${testInfo.project.name}-${width}.png`,
    });
    await page.getByRole("button", { name: "Projetos", exact: true }).click();
    await page.getByRole("button", { name: /Abrir casa de teste/ }).click();
    await expect(page.getByTestId("drawing")).toBeVisible();
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-opening-project",
    );
  });
}
