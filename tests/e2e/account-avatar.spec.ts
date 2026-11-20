import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test, expect, login } from "./auth";

test(
  "Gravatar na conta: foto, padrão local, falha de rede e troca de identidade",
  { tag: "@interface" },
  async ({ page }) => {
    const deployment = await readFile(
      "docs/arquitetura/Persistencia-e-Compatibilidade.md",
      "utf8",
    );
    const imagePolicy = deployment.match(/img-src [^;]+;/)![0];
    await page.route(`${new URL(page.url()).origin}/`, async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: {
          ...response.headers(),
          "content-security-policy": imagePolicy,
        },
      });
    });
    const account = (await (await page.request.get("/api/session")).json())
      .account;
    let mode: "photo" | "missing" | "network" = "photo";
    let release!: () => void;
    const loading = new Promise<void>((resolve) => {
      release = resolve;
    });
    const requests: { url: string; referer?: string; mode: string }[] = [];
    await page.route("https://gravatar.com/avatar/**", async (route) => {
      const request = route.request();
      requests.push({
        url: request.url(),
        referer: request.headers().referer,
        mode,
      });
      if (mode === "photo") {
        await loading;
        await route.fulfill({
          contentType: "image/svg+xml",
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#245d49"/></svg>',
        });
      } else if (mode === "missing")
        await route.fulfill({ status: 404, body: "" });
      else await route.abort();
    });
    await page.reload();
    const button = page.getByRole("button", { name: "Conta", exact: true });
    const dialog = page.getByRole("dialog", { name: "Sua conta", exact: true });
    const hash = createHash("sha256")
      .update(account.email.trim().toLowerCase())
      .digest("hex");
    const url = `https://gravatar.com/avatar/${hash}?s=128&d=404&r=g`;
    await expect(button.locator("img")).toHaveAttribute("src", url);
    await expect(button.locator("svg")).toBeVisible();
    await expect(button.locator("img")).toHaveCSS("opacity", "0");
    const position = await button.boundingBox();
    release();
    await expect(button.locator("img")).toHaveCSS("opacity", "1");
    expect(await button.boundingBox()).toEqual(position);
    await button.click();
    await expect(dialog.locator("header img")).toHaveAttribute("src", url);
    await expect(dialog.locator("header img")).toHaveCSS("opacity", "1");
    const link = dialog.getByRole("link", {
      name: "Alterar foto no Gravatar",
      exact: true,
    });
    await expect(link).toHaveAttribute(
      "href",
      "https://gravatar.com/profile/avatars",
    );
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await dialog.screenshot({ path: ".tools/account-avatar-photo.png" });
    await page.keyboard.press("Escape");
    for (const failure of ["missing", "network"] as const) {
      mode = failure;
      await page.reload();
      await expect
        .poll(() => requests.filter((r) => r.mode === failure).length)
        .toBeGreaterThan(0);
      await expect(button.locator("img")).toHaveCount(0);
      await expect(button.locator("svg")).toBeVisible();
      await button.click();
      await expect
        .poll(() => requests.filter((r) => r.mode === failure).length)
        .toBeGreaterThan(1);
      await expect(dialog.locator("header img")).toHaveCount(0);
      await expect(
        dialog.locator("header span[aria-hidden] svg"),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button", {
          name: "Atualizar dados da conta",
          exact: true,
        }),
      ).toBeEnabled();
      if (failure === "missing")
        await dialog.screenshot({ path: ".tools/account-avatar-default.png" });
      await page.keyboard.press("Escape");
    }
    await button.click();
    await dialog
      .getByRole("button", { name: "Sair da conta", exact: true })
      .click();
    mode = "photo";
    const nextEmail = `${randomUUID()}@example.com`;
    // Use a new authentication flow; the first flow retains its resend cooldown.
    await page.context().clearCookies();
    await login(page, nextEmail);
    const nextHash = createHash("sha256").update(nextEmail).digest("hex");
    await expect(button.locator("img")).toHaveAttribute(
      "src",
      `https://gravatar.com/avatar/${nextHash}?s=128&d=404&r=g`,
    );
    await expect(button.locator("img")).toHaveCSS("opacity", "1");
    expect(
      requests.every((r) => r.referer === undefined && !r.url.includes("@")),
    ).toBe(true);
  },
);
