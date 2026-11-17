import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { readReleaseInfo } from "../scripts/release-info";
import { ReleaseHistory, VersionFooter } from "../src/app/ReleaseHistory";

test("rodapé identifica a revisão e vincula somente o identificador ao histórico", () => {
  const { version, commit } = readReleaseInfo();
  const html = renderToStaticMarkup(createElement(VersionFooter));
  const links = [...html.matchAll(/<a\b([^>]*)>(.*?)<\/a>/gs)];
  expect(html.replace(/<[^>]*>/g, "")).toBe(`Versão: ${version}`);
  expect(links).toHaveLength(1);
  expect(links[0][1]).toContain('href="#historico-de-tasks"');
  expect(links[0][1]).toContain(`Versão ${version} · Histórico de Alterações`);
  expect(links[0][2]).toBe(commit);
});

test("histórico mostra título e resumo, commit de entrega e data nessa ordem", () => {
  const release = readReleaseInfo();
  const html = renderToStaticMarkup(createElement(ReleaseHistory));
  expect(html).toContain("<span>Commit</span><span>Data/Hora</span>");
  const items = [...html.matchAll(/<li\b[^>]*>(.*?)<\/li>/gs)];
  expect(items).toHaveLength(release.tasks.length);
  for (const [index, task] of release.tasks.entries()) {
    const text = items[index][1].replace(/<[^>]*>/g, "");
    expect(text).toBe(
      `${task.id}${task.title}${task.summary ? ` — ${task.summary}` : ""}${task.commit}${task.dateTime}`,
    );
    expect(items[index][1]).toContain(`dateTime="${task.date}"`);
    expect(items[index][1]).toContain("horário de São Paulo");
  }
});
