import { fork } from "node:child_process";
import type { Project } from "../src/domain/project";

let running = false;
export function validateIsolated(
  input: { doc?: unknown; sourceFile?: string; image?: string },
  timeout: number,
): Promise<{ doc?: Project; mime?: string; width?: number; height?: number }> {
  if (running)
    return Promise.reject(
      Object.assign(
        new Error("Validação ocupada. Tente novamente em instantes."),
        { statusCode: 429 },
      ),
    );
  running = true;
  return new Promise((resolve, reject) => {
    const development = import.meta.url.endsWith(".ts");
    const child = fork(
      new URL(
        development ? "./validate-worker.ts" : "./validate-worker.mjs",
        import.meta.url,
      ),
      [],
      {
        execArgv: [
          "--max-old-space-size=1024",
          ...(development ? ["--import", "tsx"] : []),
        ],
        env: {
          PATH: process.env.PATH,
          SystemRoot: process.env.SystemRoot,
          NODE_ENV: process.env.NODE_ENV,
        },
        stdio: ["ignore", "ignore", "ignore", "ipc"],
        serialization: "advanced",
      },
    );
    let finished = false;
    const done = (
      error?: Error,
      value?: Awaited<ReturnType<typeof validateIsolated>>,
    ) => {
      if (finished) return;
      finished = true;
      running = false;
      clearTimeout(timer);
      child.kill();
      if (error) reject(error);
      else resolve(value!);
    };
    const timer = setTimeout(
      () =>
        done(
          new Error(
            "A validação excedeu o tempo disponível; nenhum projeto foi confirmado.",
          ),
        ),
      timeout,
    );
    child.once("error", (error) => done(error));
    child.once("exit", () =>
      done(
        new Error(
          "Não foi possível concluir a validação; o projeto anterior foi preservado.",
        ),
      ),
    );
    child.once(
      "message",
      (message: {
        error?: string;
        result?: Awaited<ReturnType<typeof validateIsolated>>;
      }) => {
        done(
          message.error
            ? Object.assign(new Error(message.error), { statusCode: 422 })
            : undefined,
          message.result,
        );
      },
    );
    child.send(input);
  });
}
