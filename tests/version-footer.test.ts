import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { readReleaseInfo } from "../scripts/release-info";
import { VersionFooter } from "../src/app/ReleaseHistory";

test("rodapé identifica a revisão e vincula somente o identificador ao histórico", () => {
  const { version } = readReleaseInfo();
  const html = renderToStaticMarkup(createElement(VersionFooter));
  const links = [...html.matchAll(/<a\b([^>]*)>(.*?)<\/a>/gs)];
  expect(html.replace(/<[^>]*>/g, "")).toBe(`Versão: ${version}`);
  expect(links).toHaveLength(1);
  expect(links[0][1]).toContain('href="#historico-de-tasks"');
  expect(links[0][1]).toContain(`Versão ${version} · Histórico de tasks`);
  expect(links[0][2]).toBe(version);
});
