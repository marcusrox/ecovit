import { expect, test, type Page, remoteSnapshot } from "./auth";
async function create(page: Page) {
  await page.getByRole("button", { name: /Novo projeto/ }).click();
  await page.getByLabel("Nome do projeto").fill("Concorrência remota");
  await page
    .getByRole("button", { name: "Criar projeto", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Salvo");
}
async function rename(page: Page, name: string) {
  await page.evaluate(async (name) => {
    const file = "/src/state/store.ts";
    const { useStore } = await import(file);
    const { doc } = useStore.getState();
    await useStore
      .getState()
      .commit({ ...doc, project: { ...doc.project, name } });
  }, name);
}
test(
  "M12 duas abas editáveis usam revisão e recusam sobrescrita obsoleta",
  { tag: "@fluxo" },
  async ({ page, context }) => {
    await create(page);
    const other = await context.newPage();
    await other.goto("/");
    await other.getByRole("button", { name: /Concorrência remota/ }).click();
    await expect(
      other.getByRole("button", { name: "Parede", exact: true }),
    ).toBeEnabled();
    await rename(page, "Confirmado pela primeira aba");
    await rename(other, "Candidato da segunda");
    await expect(other.getByRole("status")).toHaveText("Conflito");
    expect(JSON.parse(await remoteSnapshot(page))[0].doc.project.name).toBe(
      "Confirmado pela primeira aba",
    );
  },
);
test(
  "M12 descarte do store no hot reload aguarda operação e impede novas escritas",
  { tag: "@fluxo" },
  async ({ page }) => {
    await create(page);
    const disk = await remoteSnapshot(page);
    await page.evaluate(async () => {
      const file = "/src/state/store.ts",
        client = "/@vite/client";
      const { useStore } = await import(file);
      const hot = (await import(client)).createHotContext(
        "/__test_remote_dispose__",
      );
      const dispose = hot.hmrClient.disposeMap.get(file);
      if (!dispose) throw new Error("Disposer não registrado");
      useStore.setState({ busy: true });
      const finished = dispose({});
      useStore.setState({ busy: false });
      await finished;
      const { doc } = useStore.getState();
      await useStore.getState().commit({
        ...doc,
        project: { ...doc.project, name: "Não pode gravar" },
      });
    });
    expect(await remoteSnapshot(page)).toBe(disk);
  },
);
test(
  "M12 F5 repetido recompõe em memória sem nova gravação",
  { tag: "@fluxo" },
  async ({ page }) => {
    await create(page);
    const disk = await remoteSnapshot(page);
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.getByRole("button", { name: /Concorrência remota/ }).click();
      await expect(page.getByRole("status")).toHaveText("Salvo");
      expect(await remoteSnapshot(page)).toBe(disk);
    }
  },
);
test(
  "M12 reabertura idempotente na mesma página preserva documento e pilhas",
  { tag: "@fluxo" },
  async ({ page }) => {
    await create(page);
    const disk = await remoteSnapshot(page);
    const same = await page.evaluate(async () => {
      const file = "/src/state/store.ts";
      const { useStore } = await import(file);
      const before = useStore.getState();
      await before.open(before.doc);
      await before.open(before.doc.project.id);
      return (
        useStore.getState().doc === before.doc &&
        useStore.getState().history === before.history
      );
    });
    expect(same).toBe(true);
    expect(await remoteSnapshot(page)).toBe(disk);
  },
);
test(
  "M12 recarga da segunda aba não depende de trava da primeira",
  { tag: "@fluxo" },
  async ({ page, context }) => {
    await create(page);
    const second = await context.newPage();
    await second.goto("/");
    for (let i = 0; i < 2; i++) {
      await second.getByRole("button", { name: /Concorrência remota/ }).click();
      await expect(
        second.getByRole("button", { name: "Parede", exact: true }),
      ).toBeEnabled();
      if (!i) await second.reload();
    }
    await rename(second, "Segunda confirmou");
    await expect(second.getByRole("status")).toHaveText("Salvo");
    await rename(page, "Primeira obsoleta");
    await expect(page.getByRole("status")).toHaveText("Conflito");
  },
);
test(
  "M12 voltar à lista e reabrir preserva intenção sem alterar revisão",
  { tag: "@fluxo" },
  async ({ page }) => {
    await create(page);
    const disk = await remoteSnapshot(page);
    for (let i = 0; i < 5; i++) {
      await page.getByRole("button", { name: "Projetos", exact: true }).click();
      await page.getByRole("button", { name: /Concorrência remota/ }).click();
      await expect(page.getByRole("status")).toHaveText("Salvo");
    }
    expect(await remoteSnapshot(page)).toBe(disk);
  },
);
