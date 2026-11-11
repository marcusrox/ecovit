import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function groupArguments(group: string, args: string[]) {
  const tags: Record<string, string> = {
    interface: "@interface",
    flows: "@fluxo",
    load: "@carga",
  };
  if (group !== "all" && !Object.hasOwn(tags, group))
    throw new Error("Finalidade inválida: use all, interface, flows ou load.");
  const remaining: string[] = [];
  let filter: string | undefined;
  let explicitAll = false;
  for (let i = 0; i < args.length; i++) {
    const argument = args[i];
    if (argument === "--all") {
      explicitAll = true;
      continue;
    }
    if (
      argument === "--grep" ||
      argument === "-g" ||
      argument.startsWith("--grep=") ||
      argument.startsWith("-g=")
    ) {
      if (filter !== undefined)
        throw new Error("Informe apenas um filtro --grep por execução.");
      if (
        !argument.includes("=") &&
        (args[i + 1] === undefined || args[i + 1].startsWith("-"))
      )
        throw new Error(
          "Falta a expressão de --grep; use --grep=valor para uma expressão iniciada por hífen.",
        );
      filter = argument.includes("=")
        ? argument.slice(argument.indexOf("=") + 1)
        : args[++i];
      if (filter === undefined) throw new Error("Falta a expressão de --grep.");
    } else remaining.push(argument);
  }
  const diagnostic = remaining.some((arg) =>
    ["--list", "--help", "-h"].includes(arg),
  );
  const fileSelected = remaining.some(
    (arg) =>
      !arg.startsWith("-") &&
      /\.spec\.[cm]?[jt]sx?(?::\d+(?::\d+)?)?$/.test(arg),
  );
  if (!explicitAll && !diagnostic && !fileSelected && !filter)
    throw new Error(
      "Selecione um arquivo .spec.ts ou --grep. Para execução ampla, informe --all; homologação completa: npm run test:e2e:full.",
    );
  // Match Playwright's CLI semantics: /expression/gi, or an implicit gi.
  const literal = filter?.match(/^\/(.*)\/([gi]*)$/);
  const expression =
    filter === undefined
      ? undefined
      : new RegExp(literal ? literal[1] : filter, literal ? literal[2] : "gi");
  if (
    !remaining.some(
      (arg) => arg === "--project" || arg.startsWith("--project="),
    )
  )
    remaining.push("--project=chrome");
  if (group === "all")
    return filter === undefined ? remaining : [...remaining, "--grep", filter];
  const pattern = `^(?=[\\s\\S]*\\s${tags[group]}$)${expression === undefined ? "" : `(?=[\\s\\S]*(?:${expression.source}))`}[\\s\\S]*$`;
  return [...remaining, "--grep", `/${pattern}/${expression?.flags ?? "gi"}`];
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const args = groupArguments(process.argv[2], process.argv.slice(3));
    const child = spawn(
      process.execPath,
      [
        fileURLToPath(
          new URL("../node_modules/@playwright/test/cli.js", import.meta.url),
        ),
        "test",
        ...args,
      ],
      { stdio: "inherit", windowsHide: true },
    );
    child.once("error", () => {
      console.error(
        "Não foi possível iniciar Playwright. Execute npm ci e confira o runtime.",
      );
      process.exitCode = 1;
    });
    child.once("exit", (code) => {
      process.exitCode = code ?? 1;
    });
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Seleção de testes inválida.",
    );
    process.exitCode = 1;
  }
}
