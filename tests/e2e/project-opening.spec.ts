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
