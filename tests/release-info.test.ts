import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { readReleaseInfo } from "../scripts/release-info";

let repo: string;
afterEach(() => rmSync(repo, { recursive: true, force: true }));

it("publica somente dados de implementações verificadas do commit compilado", () => {
  repo = mkdtempSync(join(tmpdir(), "ecovit-release-"));
  const git = (...args: string[]) =>
    execFileSync("git", ["-c", "core.autocrlf=false", ...args], {
      cwd: repo,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: "2026-03-25T02:00:00Z",
        GIT_COMMITTER_DATE: "2026-03-25T02:00:00Z",
      },
    }).trim();
  const taskDir = join(repo, "docs", "tasks");
  mkdirSync(taskDir, { recursive: true });
  const task = (
    id: string,
    date: string,
    type = "Implementação",
    status = "Verificada",
  ) =>
    writeFileSync(
      join(taskDir, `${id}-exemplo.md`),
      `# ${id} — Exemplo ${id}\n\n**Tipo** — ${type}\n**Execução** — ${status}\n**Data de execução** — ${date}\n**Aceite manual** — Pendente\n\n## Resultado\nEvidência interna.`,
    );
  git("init", "--quiet");
  git("config", "user.name", "Ecovit Teste");
  git("config", "user.email", "teste@example.com");
  git("commit", "--allow-empty", "--quiet", "-m", "Sem tasks");
  expect(readReleaseInfo(repo).tasks).toEqual([]);

  task("T-001", "2026-02-28");
  task("T-002", "2026-03-01");
  task("T-003", "2026-03-01");
  task("T-004", "2026-03-02", "Verificação");
  task("T-005", "2026-03-02", "Implementação", "Pendente");
  task("T-006", "2026-02-30");
  task("T-007", "");
  writeFileSync(
    join(taskDir, "Modelo.md"),
    "# T-008 — Modelo\n**Tipo** — Implementação\n**Execução** — Verificada\n**Data de execução** — 2026-03-02",
  );
  git("add", "docs");
  git("commit", "--quiet", "-m", "Tasks de exemplo");
  task("T-009", "2026-03-24");
  task("T-001", "2026-03-24");
  git("add", "docs");

  const expected = {
    version: `20262403-${git("rev-parse", "HEAD").slice(0, 7)}`,
    tasks: [
      { id: "T-003", title: "Exemplo T-003", date: "2026-03-01" },
      { id: "T-002", title: "Exemplo T-002", date: "2026-03-01" },
      { id: "T-001", title: "Exemplo T-001", date: "2026-02-28" },
    ],
  };
  expect(readReleaseInfo(repo)).toEqual(expected);
  expect(readReleaseInfo(repo)).toEqual(expected);
});
