import { expect, test } from "vitest";
import { groupArguments } from "../scripts/run-e2e-group";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

function matches(args: string[], title: string) {
  const filter = args.at(-1)!;
  const lastSlash = filter.lastIndexOf("/");
  return new RegExp(
    filter.slice(1, lastSlash),
    filter.slice(lastSlash + 1),
  ).test(title);
}

test("filtro adicional restringe a finalidade e nunca admite carga na interface", () => {
  const args = groupArguments("interface", [
    "floors.spec.ts",
    "--grep",
    "T-006|backup",
    "--list",
  ]);
  expect(matches(args, "chrome floors T-006 @interface")).toBe(true);
  expect(matches(args, "chrome floors backup grande @carga")).toBe(false);
  expect(matches(args, "chrome floors T-006 @fluxo")).toBe(false);
  expect(matches(args, "chrome floors apresentação @interface")).toBe(false);
  expect(matches(args, "chrome floors T-006 menciona @interface @fluxo")).toBe(
    false,
  );
  expect(args).toContain("--list");
});

test("grupo seleciona Chrome por padrão e permite Edge explícito", () => {
  expect(groupArguments("flows", [])).toContain("--project=chrome");
  const args = groupArguments("load", ["--project=edge", "--grep=carga"]);
  expect(args).not.toContain("--project=chrome");
  expect(matches(args, "edge carga de paredes @carga")).toBe(true);
  expect(matches(args, "edge carga de paredes @interface")).toBe(false);
});

test("recusa seleções ambíguas ou inválidas em vez de ampliar o alcance", () => {
  expect(() => groupArguments("other", [])).toThrow(/Finalidade inválida/);
  expect(() => groupArguments("constructor", [])).toThrow(
    /Finalidade inválida/,
  );
  expect(() => groupArguments("__proto__", [])).toThrow(/Finalidade inválida/);
  expect(() => groupArguments("interface", ["--grep"])).toThrow(/Falta/);
  expect(() => groupArguments("interface", ["--grep", "x", "-g", "y"])).toThrow(
    /apenas um/,
  );
  expect(() => groupArguments("interface", ["-g", "["])).toThrow();
  expect(() => groupArguments("interface", ["--grep", "--list"])).toThrow(
    /Falta/,
  );
});

test("preserva expressões literais e flags do Playwright", () => {
  expect(
    matches(
      groupArguments("interface", ["--grep", "/t-006/i"]),
      "chrome T-006 @interface",
    ),
  ).toBe(true);
  expect(
    matches(
      groupArguments("interface", ["--grep", "/t-006/"]),
      "chrome T-006 @interface",
    ),
  ).toBe(false);
  expect(
    matches(
      groupArguments("interface", ["--grep", "t-006"]),
      "chrome T-006 @interface",
    ),
  ).toBe(true);
  expect(
    matches(
      groupArguments("interface", ["--grep=--teste"]),
      "chrome --teste @interface",
    ),
  ).toBe(true);
});

test("todos os cenários descobertos mantêm uma única finalidade válida", () => {
  const report = JSON.parse(
    execFileSync(
      process.execPath,
      [
        fileURLToPath(
          new URL("../node_modules/@playwright/test/cli.js", import.meta.url),
        ),
        "test",
        "--project=chrome",
        "--list",
        "--reporter=json",
      ],
      { encoding: "utf8", windowsHide: true },
    ),
  );
  const counts = new Map([
    ["interface", 0],
    ["fluxo", 0],
    ["carga", 0],
  ]);
  type Suite = {
    suites?: Suite[];
    specs?: { title: string; tags: string[] }[];
  };
  function visit(suite: Suite) {
    for (const spec of suite.specs ?? []) {
      expect(spec.tags, spec.title).toHaveLength(1);
      expect(counts.has(spec.tags[0]), spec.title).toBe(true);
      counts.set(spec.tags[0], counts.get(spec.tags[0])! + 1);
    }
    suite.suites?.forEach(visit);
  }
  visit(report);
  expect([...counts.values()].every((count) => count > 0)).toBe(true);
});
