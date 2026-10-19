import { expect, test, type Page } from "@playwright/test";

async function create(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Novo projeto/ }).click();
  await page
    .getByRole("textbox", { name: "Nome do projeto" })
    .fill("Diagnóstico de trava");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByRole("status")).toContainText("Salvo");
}
async function locks(page: Page) {
  return page.evaluate(async () => {
    const path = "/src/state/store.ts";
    const s = (await import(path)).useStore.getState();
    return {
      projectId: s.doc?.project.id,
      readonly: s.readonly,
      locks: await navigator.locks.query(),
    };
  });
}

test("M1 aba na lista libera o projeto para edição em outra aba", async ({
  page,
  context,
}) => {
  await create(page);
  const second = await context.newPage();
  await second.goto("/");
  await second
    .getByRole("button", { name: /Diagnóstico de trava/ })
    .first()
    .click();
  await expect(second.getByRole("status")).toContainText("Somente leitura");
  await page.getByRole("button", { name: "Projetos", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Diagnóstico de trava/ }).first(),
  ).toBeVisible();
  await second.getByRole("button", { name: "Projetos", exact: true }).click();
  await second
    .getByRole("button", { name: /Diagnóstico de trava/ })
    .first()
    .click();
  await expect(
    second.getByRole("button", { name: "Parede", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: /Diagnóstico de trava/ })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Somente leitura");
  await second.close();
});

test("M1 descarte do store no hot reload aguarda operação e libera a trava", async ({
  page,
  context,
}) => {
  await create(page);
  const before = await locks(page);
  const observer = await context.newPage();
  await observer.goto("/");
  await observer
    .getByRole("button", { name: /Diagnóstico de trava/ })
    .first()
    .click();
  await expect(observer.getByRole("status")).toContainText("Somente leitura");
  const during = await page.evaluate(async () => {
    const storePath = "/src/state/store.ts",
      clientPath = "/@vite/client";
    const { useStore } = await import(storePath);
    // Invoke the actual disposer registered with the isolated Vite test runtime,
    // without editing source files or triggering the user's server on 5173.
    const hot = (await import(clientPath)).createHotContext(
      "/__test_lock_dispose__",
    );
    const dispose = hot.hmrClient.disposeMap.get(storePath);
    if (!dispose) throw new Error("Disposer do store não registrado");
    useStore.setState({ busy: true });
    const finished = dispose({});
    const whileBusy = await navigator.locks.query();
    useStore.setState({ busy: false });
    await finished;
    const original = useStore.getState().doc;
    await useStore.getState().commit({
      ...original,
      project: {
        ...original.project,
        name: "Store descartado não pode gravar",
      },
    });
    return { whileBusy, name: useStore.getState().doc.project.name };
  });
  expect(
    during.whileBusy.held?.find((l) => l.name === `ecovit:${before.projectId}`),
  ).toBeDefined();
  expect(during.name).toBe("Diagnóstico de trava");
  await expect
    .poll(async () =>
      (await locks(page)).locks.held?.some(
        (l) => l.name === `ecovit:${before.projectId}`,
      ),
    )
    .toBe(false);
  await observer.getByRole("button", { name: "Projetos", exact: true }).click();
  await observer
    .getByRole("button", { name: /Diagnóstico de trava/ })
    .first()
    .click();
  await expect(
    observer.getByRole("button", { name: "Parede", exact: true }),
  ).toBeEnabled();
  await observer.close();
});
test("diagnóstico: F5 repetido libera a trava da página anterior", async ({
  page,
}) => {
  await create(page);
  for (let i = 0; i < 3; i++) {
    await page.reload();
    await page
      .getByRole("button", { name: /Diagnóstico de trava/ })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: "Parede", exact: true }),
    ).toBeEnabled();
    const state = await locks(page);
    console.log("F5", i, JSON.stringify(state));
    expect(state.readonly).toBe(false);
    expect(
      state.locks.held?.filter((l) => l.name === `ecovit:${state.projectId}`),
    ).toHaveLength(1);
  }
});
test("diagnóstico: reabrir pela API na mesma página", async ({ page }) => {
  await create(page);
  const before = await locks(page);
  await page.evaluate(async () => {
    const path = "/src/state/store.ts",
      { useStore } = await import(path);
    await useStore.getState().open(useStore.getState().doc);
  });
  console.log("REABERTURA NA MESMA PÁGINA", JSON.stringify(await locks(page)));
  await expect(
    page.getByRole("button", { name: "Parede", exact: true }),
  ).toBeEnabled();
  expect((await locks(page)).locks.held).toEqual(before.locks.held);
  const fresh = await page.evaluate(async () => {
    const path = "/src/state/store.ts",
      { useStore } = await import(path);
    const s = useStore.getState(),
      original = s.doc;
    await s.open(
      {
        ...original,
        project: { ...original.project, name: "Abertura explícita" },
      },
      true,
    );
    const afterFresh = await navigator.locks.query();
    await s.open({ ...original, format: "inválido" }, true);
    return {
      afterFresh,
      afterInvalid: await navigator.locks.query(),
      name: useStore.getState().doc.project.name,
      readonly: useStore.getState().readonly,
    };
  });
  expect(fresh.afterFresh.held).toEqual(before.locks.held);
  expect(fresh.afterInvalid.held).toEqual(before.locks.held);
  expect(fresh.name).toBe("Abertura explícita");
  expect(fresh.readonly).toBe(false);
});
test("diagnóstico: recarga não remove trava legítima de outra aba", async ({
  page,
  context,
}) => {
  await create(page);
  const owner = await locks(page);
  const other = await context.newPage();
  await other.goto("/");
  await other
    .getByRole("button", { name: /Diagnóstico de trava/ })
    .first()
    .click();
  await expect(other.getByRole("status")).toContainText("Somente leitura");
  await other.reload();
  await other
    .getByRole("button", { name: /Diagnóstico de trava/ })
    .first()
    .click();
  await expect(other.getByRole("status")).toContainText("Somente leitura");
  console.log("OUTRA ABA APÓS F5", JSON.stringify(await locks(other)));
  expect(
    (await locks(other)).locks.held?.find(
      (l) => l.name === `ecovit:${owner.projectId}`,
    )?.clientId,
  ).toBe(
    owner.locks.held?.find((l) => l.name === `ecovit:${owner.projectId}`)
      ?.clientId,
  );
  await other.close();
});
test("diagnóstico: voltar à lista e reabrir repetidamente", async ({
  page,
}) => {
  await create(page);
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: "Projetos", exact: true }).click();
    await page
      .getByRole("button", { name: /Diagnóstico de trava/ })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: "Parede", exact: true }),
    ).toBeEnabled();
  }
});
