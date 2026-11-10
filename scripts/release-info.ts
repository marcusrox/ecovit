import { execFileSync } from "node:child_process";

type PublishedTask = { id: string; title: string; date: string };
export type ReleaseInfo = { version: string; tasks: PublishedTask[] };

function publishedTask(markdown: string): PublishedTask | undefined {
  const heading = /^# (T-\d+) — (.+)$/m.exec(markdown);
  const metadata =
    heading &&
    markdown.slice(heading.index + heading[0].length).split(/^## /m, 1)[0];
  if (
    !heading ||
    !metadata ||
    !/^\*\*Tipo\*\* — Implementação\s*$/m.test(metadata) ||
    !/^\*\*Execução\*\* — Verificada\s*$/m.test(metadata)
  )
    return;
  const date = /^\*\*Data de execução\*\* — (\d{4}-\d{2}-\d{2})\s*$/m.exec(
    metadata,
  )?.[1];
  if (!date) return;
  const parsed = new Date(date);
  if (isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date)
    return;
  return { id: heading[1], title: heading[2].trim(), date };
}

export function readReleaseInfo(cwd = process.cwd()): ReleaseInfo {
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd, encoding: "utf8" });
  const [sha, timestamp] = git("show", "-s", "--format=%H%n%cI", "HEAD")
    .trim()
    .split(/\r?\n/);
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const part = (type: string) =>
    date.find((entry) => entry.type === type)?.value;
  const version = `${part("year")}${part("day")}${part("month")}-${sha.slice(0, 7)}`;
  const tasks = git(
    "ls-tree",
    "-r",
    "-z",
    "--name-only",
    sha,
    "--",
    "docs/tasks/",
  )
    .split("\0")
    .filter((file) => /^docs\/tasks\/T-[^/]*\.md$/.test(file))
    .map((file) => publishedTask(git("show", `${sha}:${file}`)))
    .filter((task) => task !== undefined);
  tasks.sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      Number(b.id.slice(2)) - Number(a.id.slice(2)),
  );
  return { version, tasks };
}
