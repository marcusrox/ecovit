import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Quantities } from "../Quantities";
import { display, type Project } from "../../domain/project";

export type ReportBlock =
  | { kind: "heading"; text: string }
  | { kind: "text"; text: string }
  | {
      kind: "table";
      title: string;
      headers: string[];
      widths: number[];
      rows: string[][];
      spans?: number[][];
      summary?: boolean;
    };
export type BudgetReport = { title: string; blocks: ReportBlock[] };

// Render the actual budget components against one captured document. Server
// rendering runs no effects, reference lookups, commits or mounted editor changes.
export function renderBudgetMarkup(doc: Project) {
  return renderToStaticMarkup(
    createElement(Quantities, {
      doc,
      printing: true,
      diagnostics: () => {},
    }),
  );
}

export function prepareBudgetReport(
  doc: Project,
  emitted: Date,
  unsaved = false,
): BudgetReport {
  const dom = new DOMParser().parseFromString(
    renderBudgetMarkup(doc),
    "text/html",
  );
  const root = dom.querySelector("[data-budget-content]")!;
  root
    .querySelectorAll<HTMLSelectElement>(
      'select[data-budget-target^="slabConcrete:"]',
    )
    .forEach((select) => {
      select.replaceWith(
        dom.createTextNode(
          ` ${select.selectedOptions[0]?.textContent ?? "Não informado"} `,
        ),
      );
    });
  root
    .querySelectorAll(
      "[data-print-omit], button, select, svg, [aria-hidden='true']",
    )
    .forEach((node) => node.remove());
  root.querySelectorAll("input").forEach((input) => {
    input.replaceWith(
      dom.createTextNode(
        ` ${input.value || input.placeholder || "Não informado"} `,
      ),
    );
  });
  const blocks: ReportBlock[] = [];
  const text = (node: Node): string =>
    (node.nodeType === 3
      ? (node.textContent ?? "")
      : Array.from(node.childNodes)
          .map((child) =>
            child.nodeType === 3 ? child.textContent : ` ${text(child)} `,
          )
          .join("")
    )
      .replace(/\s+/g, " ")
      .trim();
  const paragraph = (value: string) => {
    if (value) blocks.push({ kind: "text", text: value });
  };
  budgetReportIdentification(doc, emitted, unsaved).forEach(paragraph);
  let title = "Orçamento preliminar";
  const visit = (node: Element) => {
    if (/^H[1-6]$/.test(node.tagName)) {
      title = text(node);
      blocks.push({ kind: "heading", text: title });
    } else if (node.tagName === "TABLE") {
      const expand = (row: HTMLTableRowElement) =>
        Array.from(row.cells).flatMap((cell) => [
          text(cell),
          ...Array.from({ length: cell.colSpan - 1 }, () => ""),
        ]);
      const rows = Array.from((node as HTMLTableElement).rows);
      const headerRows = rows.filter(
        (row) => row.parentElement?.tagName === "THEAD",
      );
      const bodyRows = rows.filter(
        (row) => row.parentElement?.tagName !== "THEAD",
      );
      const dataRows = bodyRows.map(expand);
      const spans = bodyRows.map((row) =>
        Array.from(row.cells).flatMap((cell) => [
          cell.colSpan,
          ...Array.from({ length: cell.colSpan - 1 }, () => 0),
        ]),
      );
      const headers = headerRows.length
        ? expand(headerRows[headerRows.length - 1])
        : [];
      const count = Math.max(
        headers.length,
        ...dataRows.map((row) => row.length),
      );
      while (headers.length < count) headers.push("");
      for (const row of dataRows) while (row.length < count) row.push("");
      if (count)
        blocks.push({
          kind: "table",
          title: node.querySelector("caption")
            ? text(node.querySelector("caption")!)
            : title,
          headers,
          widths: headers.map((_, i) =>
            i === 0 &&
            /^(Pavimento|Produto|Tipo|Esquadria|Aplicação)/.test(headers[0])
              ? 2
              : 1,
          ),
          rows: dataRows,
          spans,
        });
    } else if (["P", "LI", "LABEL"].includes(node.tagName)) {
      paragraph(text(node));
    } else if (node.tagName === "DL") {
      blocks.push({
        kind: "table",
        title: node.getAttribute("aria-label") ?? title,
        headers: ["Material", "Subtotal"],
        widths: [3, 1],
        rows: Array.from(node.children).map((entry) => [
          text(entry.querySelector("dt")!),
          text(entry.querySelector("dd")!),
        ]),
        summary: true,
      });
    } else {
      Array.from(node.children).forEach(visit);
    }
  };
  visit(root);
  return { title: doc.project.name, blocks };
}

export function budgetReportIdentification(
  doc: Project,
  emitted: Date,
  unsaved = false,
) {
  const lines: string[] = [];
  lines.push(
    `Emissão: ${emitted.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (São Paulo). Projeto completo.`,
  );
  lines.push(
    `Base nominal: ${display(doc.project.base.length)} × ${display(doc.project.base.width)} × ${display(doc.project.base.height)} cm. Composição: ${doc.generated?.convention ?? "indisponível"}.`,
  );
  lines.push(
    "Estimativa nominal. Não inclui mão de obra, serviços ou cálculos estruturais.",
  );
  lines.push(
    `Pavimentos: ${[...doc.model.floors]
      .sort((a, b) => a.level - b.level)
      .map((f) => `${f.name} · ${display(f.level)} cm`)
      .join("; ")}.`,
  );
  if (unsaved)
    lines.push(
      "Não salvo: relatório da revisão em memória, ainda sem confirmação de salvamento no servidor.",
    );
  return lines;
}
