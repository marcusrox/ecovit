import { test, expect, login, type Page } from "./auth";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { createProject } from "../../src/domain/project";

async function authClock(page: Page, expire = false) {
  const { account } = await (await page.request.get("/api/session")).json();
  const connection = new URL(process.env.M12_TEST_DATABASE_URL!);
  connection.searchParams.set("options", "-c search_path=m12_browser");
  const db = new Pool({ connectionString: connection.toString() });
  try {
    if (expire)
      await db.query(
        "UPDATE ecovit_sessions SET last_seen=clock_timestamp()-interval '8 days' WHERE account_id=$1",
        [account.id],
      );
    await db.query(
      "DELETE FROM ecovit_rate_limits WHERE key LIKE 'mail-cooldown:%'",
    );
  } finally {
    await db.end();
  }
}
async function capturedCode(response: { json: () => Promise<{ id: string }> }) {
  const { id } = await response.json();
  return JSON.parse(
    await readFile(`.tools/m12/browser-mail/${id}.json`, "utf8"),
  ).code as string;
}

async function create(page: Page, name = "Conta privada") {
  await page.getByRole("button", { name: /Novo projeto/ }).click();
  await page.getByLabel("Nome do projeto").fill(name);
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
  "M12 troca de conta em outra aba não transfere candidato nem contexto privado",
  { tag: "@fluxo" },
  async ({ page, context }, info) => {
    await create(page, "Somente conta A");
    const emailA = await page
      .getByRole("button", { name: "Conta", exact: true })
      .getAttribute("title");
    const second = await context.newPage();
    await second.goto("/");
    await second.getByRole("button", { name: "Conta", exact: true }).click();
    await second
      .getByRole("button", { name: "Sair da conta", exact: true })
      .click();
    await authClock(second);
    const emailB = await login(second);
    await create(second, "Somente conta B");
    await authClock(page);
    await rename(page, "Candidato privado de A");
    const dialog = page.getByRole("dialog", {
      name: "Sessão expirada",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("E-mail", { exact: true })).toHaveValue(
      emailA!,
    );
    for (const [width, height] of [
      [1366, 768],
      [1280, 720],
      [900, 680],
    ]) {
      await page.setViewportSize({ width, height });
      const box = (await dialog.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.width).toBeLessThanOrEqual(width);
      expect(box.height).toBeLessThanOrEqual(height);
      await page.screenshot({
        path: `.tools/m12/reauth-${info.project.name}-${width}.png`,
      });
    }
    const sent = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/code") &&
        response.request().method() === "POST",
    );
    await dialog
      .getByRole("button", { name: "Enviar código", exact: true })
      .click();
    expect((await sent).status()).toBe(200);
    await dialog
      .getByRole("button", {
        name: "Voltar ao desenho para baixar",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Conta", exact: true }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("E-mail", { exact: true })).toHaveValue(
      emailA!,
    );
    await expect(page.getByText(emailB, { exact: true })).toHaveCount(0);
    await dialog
      .getByRole("button", {
        name: "Voltar ao desenho para baixar",
        exact: true,
      })
      .click();
    const downloading = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    expect(
      JSON.parse(await readFile((await (await downloading).path())!, "utf8"))
        .project.name,
    ).toBe("Candidato privado de A");
    page.once("dialog", (message) => message.accept());
    await page.getByRole("button", { name: "Projetos", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Entre novamente", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Novo projeto/ }),
    ).toHaveCount(0);
    await second.reload();
    await expect(
      second.getByRole("button", { name: /Somente conta B.*parede/ }),
    ).toHaveCount(1);
    await expect(
      second.getByText("Candidato privado de A", { exact: true }),
    ).toHaveCount(0);
  },
);

test(
  "M12 falha na lista conserva cartões sem apresentar zero projetos ou permitir ações",
  { tag: "@fluxo" },
  async ({ page }, info) => {
    await create(page, "Projeto conservado na lista");
    await page.getByRole("button", { name: "Projetos", exact: true }).click();
    const card = page.getByRole("button", {
      name: /Projeto conservado na lista.*parede/,
    });
    await expect(card).toBeEnabled();
    await page.route("**/api/projects", (route) =>
      route.request().method() === "GET"
        ? route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({
              code: "unavailable",
              message: "Lista temporariamente indisponível.",
            }),
          })
        : route.continue(),
    );
    await page
      .getByRole("button", { name: "Atualizar lista", exact: true })
      .click();
    await expect(
      page.getByText("Lista indisponível", { exact: true }),
    ).toBeVisible();
    await expect(card).toBeDisabled();
    await expect(
      page.getByRole("button", { name: /Novo projeto/ }),
    ).toBeDisabled();
    await expect(
      page.getByText("0 projetos salvos", { exact: true }),
    ).toHaveCount(0);
    for (const [width, height] of [
      [1366, 768],
      [1280, 720],
      [900, 680],
    ]) {
      await page.setViewportSize({ width, height });
      await page.screenshot({
        path: `.tools/m12/list-error-${info.project.name}-${width}.png`,
      });
    }
    await page.unroute("**/api/projects");
    await page
      .getByRole("button", { name: "Atualizar lista", exact: true })
      .click();
    await expect(card).toBeEnabled();
    await expect(
      page.getByText("1 projeto salvo", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Lista indisponível", { exact: true }),
    ).toHaveCount(0);
  },
);

test(
  "M12 lista atrasada não bloqueia controles ou download do projeto importado",
  { tag: "@fluxo" },
  async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Novo projeto/ }),
    ).toBeEnabled();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started!: () => void;
    const reading = new Promise<void>((resolve) => {
      started = resolve;
    });
    await page.route("**/api/projects", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      started();
      await gate;
      await route.continue();
    });
    try {
      await page
        .getByRole("button", { name: "Atualizar lista", exact: true })
        .click();
      await reading;
      await page.getByTestId("import-file").setInputFiles({
        name: "importado.ecovit",
        mimeType: "application/json",
        buffer: Buffer.from(
          JSON.stringify(
            createProject("Lista ainda pendente", {
              length: 2500,
              width: 1250,
              height: 700,
            }),
          ),
        ),
      });
      await expect(page.getByRole("status")).toHaveText("Salvo");
      await expect(
        page.getByRole("button", {
          name: "Preferências do Ecovit",
          exact: true,
        }),
      ).toBeEnabled();
      await expect(
        page.getByRole("button", { name: "Diagnósticos (0)", exact: true }),
      ).toBeEnabled();
      const downloading = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Baixar projeto", exact: true })
        .click();
      expect(
        JSON.parse(await readFile((await (await downloading).path())!, "utf8"))
          .project.name,
      ).toBe("Lista ainda pendente (cópia)");
      await expect(
        page.getByRole("button", { name: "Projetos", exact: true }),
      ).toBeEnabled();
    } finally {
      release();
    }
  },
);
test(
  "M12 salvamento, resposta perdida e conflito preservam memória e download",
  { tag: "@fluxo" },
  async ({ page, context }) => {
    await create(page);
    let saves = 0;
    page.on("request", (request) => {
      if (request.method() === "PUT" && /\/api\/projects\//.test(request.url()))
        saves++;
    });
    await rename(page, "Confirmado");
    expect(saves).toBe(1);
    const second = await context.newPage();
    await second.goto("/");
    await second.getByRole("button", { name: /Confirmado/ }).click();
    await expect(second.getByRole("status")).toHaveText("Salvo");
    await rename(page, "Alterado na primeira sessão");
    await rename(second, "Meu candidato em conflito");
    await expect(second.getByRole("status")).toHaveText("Conflito");
    await expect(
      second.getByRole("button", { name: "Desfazer", exact: true }),
    ).toBeDisabled();
    const downloading = second.waitForEvent("download");
    await second
      .getByRole("button", { name: "Baixar projeto", exact: true })
      .click();
    const file = await downloading;
    expect(
      JSON.parse(await readFile((await file.path())!, "utf8")).project.name,
    ).toBe("Meu candidato em conflito");
    second.once("dialog", (dialog) => dialog.accept());
    await second
      .getByRole("button", { name: "Abrir versão remota", exact: true })
      .click();
    await expect(second.getByRole("status")).toHaveText("Salvo");
    await page.route("**/api/projects/*", async (route) => {
      if (route.request().method() !== "PUT") return route.continue();
      await route.fetch();
      await route.abort("connectionreset");
    });
    await rename(page, "Resposta perdida");
    await expect(page.getByRole("status")).toHaveText("Confirmação pendente");
    await page.unroute("**/api/projects/*");
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText("Salvo");
    await page.reload();
    await page.getByRole("button", { name: /Resposta perdida/ }).click();
    await expect(page.getByRole("status")).toHaveText("Salvo");
  },
);

test(
  "M12 lixeira restaura projeto; conta e login cabem nas três resoluções",
  { tag: "@fluxo" },
  async ({ page }, info) => {
    await create(page, "Restaurar meu projeto");
    await page.getByRole("button", { name: "Projetos", exact: true }).click();
    await page.getByRole("button", { name: "Excluir", exact: true }).click();
    await page
      .getByRole("button", { name: "Enviar à lixeira sem backup", exact: true })
      .click();
    await page.getByRole("button", { name: "Conta", exact: true }).click();
    await expect(
      page.getByText("Restaurar meu projeto", { exact: true }),
    ).toBeVisible();
    for (const [width, height] of [
      [1366, 768],
      [1280, 720],
      [900, 680],
    ]) {
      await page.setViewportSize({ width, height });
      const dialog = page.getByRole("dialog");
      const box = (await dialog.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.width).toBeLessThanOrEqual(width);
      expect(box.height).toBeLessThanOrEqual(height);
      await page.screenshot({
        path: `.tools/m12/account-${info.project.name}-${width}.png`,
      });
    }
    await page.getByRole("button", { name: "Restaurar", exact: true }).click();
    await expect(
      page.getByText("Lixeira vazia.", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Sair da conta", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Entrar no Ecovit" }),
    ).toBeVisible();
    for (const [width, height] of [
      [1366, 768],
      [1280, 720],
      [900, 680],
    ]) {
      await page.setViewportSize({ width, height });
      await page.screenshot({
        path: `.tools/m12/login-${info.project.name}-${width}.png`,
      });
    }
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Entrar no Ecovit" }),
    ).toBeVisible();
  },
);

test(
  "M12 perda de conexão e sessão expirada preservam candidato e retomam na mesma página",
  { tag: "@fluxo" },
  async ({ page, context }) => {
    await create(page, "Retomar trabalho");
    let saves = 0;
    page.on("request", (request) => {
      if (request.method() === "PUT" && /\/api\/projects\//.test(request.url()))
        saves++;
    });
    await context.setOffline(true);
    await expect(page.getByRole("status")).toHaveText("Sem conexão");
    await expect(
      page.getByRole("button", { name: "Parede", exact: true }),
    ).toBeDisabled();
    await context.setOffline(false);
    await expect(page.getByRole("status")).toHaveText("Sem conexão");
    await page
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText("Salvo");
    expect(saves).toBe(0);
    await authClock(page, true);
    await rename(page, "Candidato conservado após expirar");
    const dialog = page.getByRole("dialog", {
      name: "Sessão expirada",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("E-mail", { exact: true })).toBeDisabled();
    const sent = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/code") &&
        response.request().method() === "POST",
    );
    await dialog
      .getByRole("button", { name: "Enviar código", exact: true })
      .click();
    await dialog
      .getByLabel("Código de acesso", { exact: true })
      .fill(await capturedCode(await sent));
    await dialog.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveText("Salvo");
    await expect(
      page.getByLabel("Nome do projeto", { exact: true }),
    ).toHaveValue("Candidato conservado após expirar");
    await expect(
      page.getByRole("button", { name: "Desfazer", exact: true }),
    ).toBeEnabled();
    await page.reload();
    await page
      .getByRole("button", { name: /Candidato conservado após expirar/ })
      .click();
    await expect(page.getByRole("status")).toHaveText("Salvo");
  },
);

test(
  "M12 exclusão da própria conta exige código específico e confirmação, encerrando acesso",
  { tag: "@fluxo" },
  async ({ page }) => {
    await create(page, "Excluir com a conta");
    await authClock(page);
    await page.getByRole("button", { name: "Conta", exact: true }).click();
    const sent = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/code") &&
        response.request().method() === "POST",
    );
    await page
      .getByRole("button", {
        name: "Solicitar código para excluir conta",
        exact: true,
      })
      .click();
    await page
      .getByLabel("Código de exclusão", { exact: true })
      .fill(await capturedCode(await sent));
    await page
      .getByRole("button", {
        name: "Verificar código de exclusão",
        exact: true,
      })
      .click();
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", {
        name: "Confirmar exclusão de toda a conta",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("heading", { name: "Entrar no Ecovit" }),
    ).toBeVisible();
    expect((await page.request.get("/api/projects")).status()).toBe(401);
  },
);

test(
  "M12 resposta perdida na duplicação conserva nome e cria uma única cópia",
  { tag: "@fluxo" },
  async ({ page }) => {
    await create(page, "Origem para copiar");
    await page.getByRole("button", { name: "Projetos", exact: true }).click();
    await page.getByRole("button", { name: "Duplicar", exact: true }).click();
    await page.getByLabel("Nome da cópia", { exact: true }).fill("Cópia única");
    await page.route("**/api/projects/*/duplicate", async (route) => {
      await route.fetch();
      await route.abort("connectionreset");
    });
    await page
      .getByRole("button", { name: "Duplicar projeto", exact: true })
      .click();
    await expect(
      page.getByLabel("Nome da cópia", { exact: true }),
    ).toBeDisabled();
    await expect(page.getByRole("dialog")).toContainText("mesma cópia");
    await page.unroute("**/api/projects/*/duplicate");
    await page
      .getByRole("button", { name: "Duplicar projeto", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Duplicar", exact: true }),
    ).toHaveCount(2);
    await expect(
      page.getByRole("button", { name: /Cópia única.*parede/ }),
    ).toHaveCount(1);
  },
);
