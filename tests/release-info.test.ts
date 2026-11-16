import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { readReleaseInfo } from "../scripts/release-info";

let repo: string;
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  rmSync(repo, { recursive: true, force: true });
});

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
    version: `24/03/2026 23:00 · ${git("rev-parse", "HEAD").slice(0, 7)}`,
    dateTime: "24/03/2026 23:00",
    commit: git("rev-parse", "HEAD").slice(0, 7),
    tasks: [
      {
        id: "T-003",
        title: "Exemplo T-003",
        date: "2026-03-25T02:00:00Z",
        dateTime: "24/03/2026 23:00",
      },
      {
        id: "T-002",
        title: "Exemplo T-002",
        date: "2026-03-25T02:00:00Z",
        dateTime: "24/03/2026 23:00",
      },
      {
        id: "T-001",
        title: "Exemplo T-001",
        date: "2026-03-25T02:00:00Z",
        dateTime: "24/03/2026 23:00",
      },
    ],
  };
  expect(readReleaseInfo(repo)).toEqual(expected);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2030-01-01T00:00:00Z"));
  expect(readReleaseInfo(repo)).toEqual(expected);
});

it("preserva a entrega original em merges e edições posteriores, limitada à revisão compilada", () => {
  repo = mkdtempSync(join(tmpdir(), "ecovit-release-"));
  let timestamp = "2026-11-16T02:00:00Z";
  const git = (...args: string[]) =>
    execFileSync(
      "git",
      [
        "-c",
        "core.autocrlf=false",
        "-c",
        "user.name=Teste",
        "-c",
        "user.email=teste@example.com",
        ...args,
      ],
      {
        cwd: repo,
        encoding: "utf8",
        env: {
          ...process.env,
          GIT_AUTHOR_DATE: timestamp,
          GIT_COMMITTER_DATE: timestamp,
        },
      },
    ).trim();
  const taskDir = join(repo, "docs", "tasks");
  mkdirSync(taskDir, { recursive: true });
  const task = (id: string, status: string, title = id) =>
    writeFileSync(
      join(taskDir, `${id}.md`),
      `# ${id} — ${title}\n\n**Tipo** — Implementação\n**Execução** — ${status}\n**Data de execução** — 2026-01-01\n**Aceite manual** — Pendente\n`,
    );
  const commit = () => {
    git("add", "docs");
    git("commit", "--quiet", "-m", "Atualização");
  };
  git("init", "--quiet", "-b", "main");
  task("T-001", "Pendente");
  commit();
  timestamp = "2026-11-16T03:00:00Z";
  task("T-001", "Verificada");
  commit();
  const delivered = readReleaseInfo(repo).tasks[0];
  expect(delivered.dateTime).toBe("16/11/2026 00:00");
  git("checkout", "--quiet", "-b", "entrega");
  timestamp = "2026-11-16T10:30:00Z";
  task("T-002", "Verificada");
  task("T-003", "Verificada");
  commit();
  git("checkout", "--quiet", "main");
  timestamp = "2026-11-16T12:00:00Z";
  task("T-001", "Verificada", "Título atualizado após aceite");
  commit();
  expect(readReleaseInfo(repo).tasks).toEqual([
    { ...delivered, title: "Título atualizado após aceite" },
  ]);
  timestamp = "2026-11-16T13:00:00Z";
  git("merge", "--quiet", "--no-ff", "entrega", "-m", "Integração");
  const release = readReleaseInfo(repo);
  expect(release.tasks.map(({ id, dateTime }) => ({ id, dateTime }))).toEqual([
    { id: "T-003", dateTime: "16/11/2026 07:30" },
    { id: "T-002", dateTime: "16/11/2026 07:30" },
    { id: "T-001", dateTime: "16/11/2026 00:00" },
  ]);
  expect(readReleaseInfo(repo)).toEqual(release);
});

it("diagnostica checkout raso sem atribuir horários fictícios", () => {
  repo = mkdtempSync(join(tmpdir(), "ecovit-release-"));
  const git = (...args: string[]) =>
    execFileSync(
      "git",
      ["-c", "user.name=Teste", "-c", "user.email=teste@example.com", ...args],
      { cwd: repo, encoding: "utf8" },
    ).trim();
  git("init", "--quiet");
  git("commit", "--quiet", "--allow-empty", "-m", "Raiz");
  writeFileSync(join(repo, ".git", "shallow"), `${git("rev-parse", "HEAD")}\n`);
  expect(() => readReleaseInfo(repo)).toThrow("requer histórico Git completo");
});

it("usa horário de committer em São Paulo para revisões distintas no mesmo dia", () => {
  vi.stubEnv("TZ", "Asia/Tokyo");
  repo = mkdtempSync(join(tmpdir(), "ecovit-release-"));
  const git = (timestamp: string, ...args: string[]) =>
    execFileSync(
      "git",
      [
        "-c",
        "user.name=Ecovit Teste",
        "-c",
        "user.email=teste@example.com",
        ...args,
      ],
      {
        cwd: repo,
        encoding: "utf8",
        env: {
          ...process.env,
          TZ: "Asia/Tokyo",
          GIT_AUTHOR_DATE: "2025-01-01T12:00:00Z",
          GIT_COMMITTER_DATE: timestamp,
        },
      },
    ).trim();
  git("2026-11-16T03:00:35Z", "init", "--quiet");
  git(
    "2026-11-16T03:00:35Z",
    "commit",
    "--allow-empty",
    "--quiet",
    "-m",
    "Meia-noite",
  );
  const first = readReleaseInfo(repo);
  expect(first.dateTime).toBe("16/11/2026 00:00");
  git(
    "2026-11-16T18:31:35Z",
    "commit",
    "--allow-empty",
    "--quiet",
    "-m",
    "Tarde",
  );
  const second = readReleaseInfo(repo);
  expect(second.dateTime).toBe("16/11/2026 15:31");
  expect(second.commit).not.toBe(first.commit);
  expect(second.version).toBe(`16/11/2026 15:31 · ${second.commit}`);
});
