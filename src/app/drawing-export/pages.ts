import type { LocalProject, Project } from "../../domain/project";
import { floorView } from "../../domain/composition";
import { relevantCourses } from "../../domain/relevant-courses";

export const scales = [10, 20, 25, 50, 75, 100, 200] as const;
export type ExportOptions = {
  floorId: string;
  content: "plan" | "course" | "both";
  selection: "current" | "range" | "all" | "relevant";
  first: string;
  last: string;
  paper: "A4" | "A3";
  landscape: boolean;
  planScale: number;
  courseScale: number;
  furniture: boolean;
  terrain: boolean;
  image: boolean;
};
export type DrawingPage = {
  mode: "plan" | "course";
  course: number;
  scale: number;
};
export type PreparedPages = {
  local: LocalProject;
  drawings: DrawingPage[];
  width: number;
  height: number;
};

export function preparePages(
  doc: Project,
  options: ExportOptions,
): PreparedPages {
  const local = floorView(doc, options.floorId);
  if (
    ![options.planScale, options.courseScale].every((s) =>
      scales.some((v) => v === s),
    )
  )
    throw new Error("Escolha uma das escalas disponíveis.");
  const drawings: DrawingPage[] = [];
  if (options.content !== "course")
    drawings.push({ mode: "plan", course: 1, scale: options.planScale });
  if (options.content !== "plan") {
    if (
      doc.generationState.status !== "current" ||
      doc.generated?.convention !== "nominal-v14" ||
      !local.generated
    )
      throw new Error(
        "Fiadas indisponíveis: aguarde a composição vigente ou escolha somente Planta.",
      );
    const rows = local.generated.courses;
    const integer = (value: string) =>
      /^\d+$/.test(value) &&
      Number.isSafeInteger(Number(value)) &&
      Number(value) > 0;
    let numbers: number[];
    if (options.selection === "all") numbers = rows.map((r) => r.number);
    else if (options.selection === "relevant") numbers = relevantCourses(local);
    else {
      const first = Number(options.first),
        last = options.selection === "current" ? first : Number(options.last);
      if (
        !integer(options.first) ||
        (options.selection === "range" && !integer(options.last)) ||
        first > last ||
        !rows.some((r) => r.number === first) ||
        !rows.some((r) => r.number === last)
      )
        throw new Error(
          "Selecione fiadas existentes e um intervalo válido, em ordem crescente.",
        );
      numbers = rows
        .filter((r) => r.number >= first && r.number <= last)
        .map((r) => r.number);
    }
    if (!numbers.length)
      throw new Error(
        "Este pavimento não tem fiadas selecionáveis. Escolha somente Planta, se desejar.",
      );
    drawings.push(
      ...numbers.map((course) => ({
        mode: "course" as const,
        course,
        scale: options.courseScale,
      })),
    );
  }
  const [small, large] = options.paper === "A4" ? [210, 297] : [297, 420];
  return {
    local,
    drawings,
    width: options.landscape ? large : small,
    height: options.landscape ? small : large,
  };
}
