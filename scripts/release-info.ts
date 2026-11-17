import { execFileSync } from "node:child_process";

type PublishedTask = {
  id: string;
  title: string;
  summary: string;
  commit: string;
  date: string;
  dateTime: string;
};
export type ReleaseInfo = {
  version: string;
  dateTime: string;
  commit: string;
  tasks: PublishedTask[];
};

function publishedTask(
  markdown: string,
): Omit<PublishedTask, "dateTime" | "commit"> | undefined {
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
  const summary = /^\*\*Resumo\*\* — (.+)$/m.exec(metadata)?.[1].trim() ?? "";
  return { id: heading[1], title: heading[2].trim(), summary, date };
}

function formatDateTime(timestamp: string): string {
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(timestamp));
  const part = (type: string) =>
    date.find((entry) => entry.type === type)?.value;
  return `${part("day")}/${part("month")}/${part("year")} ${part("hour")}:${part("minute")}`;
}

export function readReleaseInfo(cwd = process.cwd()): ReleaseInfo {
  const git = (...args: string[]) =>
    execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
  if (git("rev-parse", "--is-shallow-repository").trim() === "true")
    throw new Error(
      "Histórico de Alterações requer histórico Git completo; obtenha os ancestrais antes de gerar os metadados.",
    );
  const [sha, timestamp] = git("show", "-s", "--format=%H%n%cI", "HEAD")
    .trim()
    .split(/\r?\n/);
  const dateTime = formatDateTime(timestamp);
  const commit = sha.slice(0, 7);
  const version = `${dateTime} · ${commit}`;
  const files = git(
    "ls-tree",
    "-r",
    "-z",
    "--name-only",
    sha,
    "--",
    "docs/tasks/",
  )
    .split("\0")
    .filter((file) => /^docs\/tasks\/T-[^/]*\.md$/.test(file));
  const history: { revision: string; timestamp: string; file: string }[] = [];
  let revision = "",
    deliveredAt = "";
  for (const line of git(
    "log",
    "--reverse",
    "--topo-order",
    "--full-history",
    "--no-renames",
    "--diff-filter=AM",
    "--format=COMMIT %H %cI",
    "--name-only",
    sha,
    "--",
    "docs/tasks/",
  ).split(/\r?\n/)) {
    if (line.startsWith("COMMIT ")) [, revision, deliveredAt] = line.split(" ");
    else if (/^docs\/tasks\/T-[^/]*\.md$/.test(line))
      history.push({ revision, timestamp: deliveredAt, file: line });
  }
  const specs = [
    ...new Set([
      ...files.map((file) => `${sha}:${file}`),
      ...history.map((entry) => `${entry.revision}:${entry.file}`),
    ]),
  ];
  const snapshots = new Map<string, string>();
  if (specs.length) {
    const output = execFileSync("git", ["cat-file", "--batch"], {
      cwd,
      input: specs.join("\n") + "\n",
      maxBuffer: 16 * 1024 * 1024,
    });
    let offset = 0;
    for (const spec of specs) {
      const headerEnd = output.indexOf(10, offset);
      const header = output.subarray(offset, headerEnd).toString("utf8");
      const match = /^[0-9a-f]+ blob (\d+)$/.exec(header);
      if (!match)
        throw new Error(
          `Objeto Git indisponível para o Histórico de Alterações: ${spec}`,
        );
      const size = Number(match[1]);
      offset = headerEnd + 1;
      snapshots.set(
        spec,
        output.subarray(offset, offset + size).toString("utf8"),
      );
      offset += size + 1;
    }
  }
  const deliveries = new Map<string, { timestamp: string; revision: string }>();
  for (const entry of history) {
    const task = publishedTask(
      snapshots.get(`${entry.revision}:${entry.file}`)!,
    );
    if (task && !deliveries.has(task.id)) deliveries.set(task.id, entry);
  }
  const tasks = files
    .map((file): PublishedTask | undefined => {
      const task = publishedTask(snapshots.get(`${sha}:${file}`)!);
      if (!task) return;
      const delivery = deliveries.get(task.id);
      if (!delivery)
        throw new Error(
          `Não foi possível determinar o commit de entrega de ${task.id}. Verifique o histórico Git de ${file}.`,
        );
      const { timestamp, revision } = delivery;
      return {
        id: task.id,
        title: task.title,
        summary: task.summary,
        commit: revision.slice(0, 7),
        date: timestamp,
        dateTime: formatDateTime(timestamp),
      };
    })
    .filter((task) => task !== undefined);
  tasks.sort(
    (a, b) =>
      Date.parse(b.date) - Date.parse(a.date) ||
      Number(b.id.slice(2)) - Number(a.id.slice(2)),
  );
  return { version, dateTime, commit, tasks };
}
