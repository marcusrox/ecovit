import { test as base, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export { expect };
export type { Page };
export async function rejectSaves(page: Page) {
  await page.evaluate(() => {
    const original = window.fetch.bind(window);
    (window as unknown as { restorePut: () => void }).restorePut = () => {
      window.fetch = original;
    };
    window.fetch = async (input, options) =>
      options?.method === "PUT" && String(input).includes("/api/projects/")
        ? new Response(
            JSON.stringify({
              code: "test_rejection",
              message: "Gravação recusada no ensaio.",
            }),
            { status: 422 },
          )
        : original(input, options);
  });
}
export async function blockEditing(page: Page) {
  await expect(page.getByRole("status")).toContainText("Salvo");
  const pattern = "**/api/projects/*";
  await page.route(pattern, (route) =>
    route.request().method() === "PUT"
      ? route.fulfill({
          status: 422,
          contentType: "application/json",
          body: JSON.stringify({
            code: "test_rejection",
            message: "Gravação recusada no ensaio de acesso bloqueado.",
          }),
        })
      : route.continue(),
  );
  await page.evaluate(async () => {
    const file = "/src/state/store.ts";
    const { useStore } = await import(file);
    useStore.setState({ saved: "error" });
    await useStore.getState().retry();
  });
  await page.unroute(pattern);
  await expect(page.getByRole("status")).toHaveText("Não salvo");
}
export async function remoteSnapshot(page: Page) {
  return page.evaluate(async () => {
    const file = "/src/persistence/http.ts";
    const { api } = await import(file);
    const { projects } = await api("/projects");
    return JSON.stringify(
      await Promise.all(
        projects.map((p: { id: string }) => api(`/projects/${p.id}`)),
      ),
    );
  });
}
export async function login(page: Page, email = `${randomUUID()}@example.com`) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Entrar no Ecovit" }),
  ).toBeVisible();
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  const sent = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/code") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Enviar código", exact: true })
    .click();
  const response = await sent;
  expect(response.status()).toBe(200);
  const { id } = await response.json();
  const capture = JSON.parse(
    await readFile(path.resolve(`.tools/m12/browser-mail/${id}.json`), "utf8"),
  );
  await page.getByLabel("Código de acesso", { exact: true }).fill(capture.code);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Novo projeto/ }),
  ).toBeVisible();
  return email;
}
export const test = base.extend({
  page: async ({ page, context }, provide) => {
    const ip = [...crypto.getRandomValues(new Uint8Array(3))]
      .map((n) => n || 1)
      .join(".");
    // The isolated loopback test proxy supplies an independent visitor address.
    await context.setExtraHTTPHeaders({ "X-Forwarded-For": `10.${ip}` });
    await login(page);
    const navigate = page.goto.bind(page);
    page.goto = async (...args) => {
      const response = await navigate(...args);
      await expect(
        page.getByRole("button", { name: "Conta", exact: true }).or(
          page.getByRole("heading", {
            name: "Entrar no Ecovit",
            exact: true,
          }),
        ),
      ).toBeVisible();
      return response;
    };
    const reload = page.reload.bind(page);
    page.reload = async (...args) => {
      const response = await reload(...args);
      await expect(
        page
          .getByRole("button", { name: "Conta", exact: true })
          .or(
            page.getByRole("heading", {
              name: "Entrar no Ecovit",
              exact: true,
            }),
          ),
      ).toBeVisible();
      return response;
    };
    await provide(page);
  },
});
