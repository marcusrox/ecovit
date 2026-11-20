import { afterEach, expect, it, vi } from "vitest";
import { gravatarUrl } from "../src/ui/gravatar";

afterEach(() => vi.unstubAllGlobals());

it("identifica o avatar pelo SHA-256 normalizado sem expor o e-mail na URL", async () => {
  const expected =
    "https://gravatar.com/avatar/84059b07d4be67b806386c0aad8070a23f18836bbaae342275dc0a83414c32ee?s=128&d=404&r=g";
  expect(await gravatarUrl(" MyEmailAddress@example.com ")).toBe(expected);
  expect(await gravatarUrl("myemailaddress@example.com")).toBe(expected);
  expect(await gravatarUrl("other@example.com")).not.toBe(expected);
});

it("permite que a interface use o avatar local quando Web Crypto estiver indisponível", async () => {
  vi.stubGlobal("crypto", {});
  await expect(gravatarUrl("user@example.com")).rejects.toThrow();
});
