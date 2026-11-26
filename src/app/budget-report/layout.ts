import type { BudgetReport } from "./model";
import { wrapText } from "../../domain/text";

export const pageWidth = (210 * 72) / 25.4,
  pageHeight = (297 * 72) / 25.4;
const margin = 36,
  top = 65,
  bottom = pageHeight - 43,
  lineHeight = 13;
export type Mark =
  | {
      kind: "text";
      text: string;
      x: number;
      y: number;
      size: number;
      bold: boolean;
    }
  | {
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      header: boolean;
    };
export type Measure = (text: string, size: number, bold: boolean) => number;

export function wrap(
  value: string,
  width: number,
  measure: (text: string) => number,
) {
  return wrapText(value, width, measure).map((line) => line.trimEnd());
}

export function layoutBudgetReport(
  report: BudgetReport,
  measure: Measure,
): Mark[][] {
  const pages: Mark[][] = [[]];
  let y = top;
  const current = () => pages[pages.length - 1];
  const next = () => {
    pages.push([]);
    y = top;
  };
  const ensure = (height: number) => {
    if (y + height > bottom) next();
  };
  const label = (
    text: string,
    x: number,
    baseline: number,
    size = 9,
    bold = false,
  ) => current().push({ kind: "text", text, x, y: baseline, size, bold });
  const paragraph = (value: string, bold = false) => {
    const size = bold ? 12 : 9.5;
    const lines = wrap(value, pageWidth - 2 * margin, (t) =>
      measure(t, size, bold),
    );
    ensure(bold ? 42 : lineHeight);
    for (const line of lines) {
      ensure(lineHeight);
      label(line, margin, y + 10, size, bold);
      y += lineHeight + (bold ? 3 : 0);
    }
    y += bold ? 8 : 7;
  };
  for (const block of report.blocks) {
    if (block.kind !== "table") {
      paragraph(block.text, block.kind === "heading");
      continue;
    }
    const totalWidth = pageWidth - 2 * margin;
    const sum = block.widths.reduce((a, b) => a + b, 0);
    const widths = block.widths.map((w) => (totalWidth * w) / sum);
    const cells = (row: string[], bold: boolean) =>
      row.map((s, i) => wrap(s, widths[i] - 10, (t) => measure(t, 9, bold)));
    const headers = cells(block.headers, true);
    const title = wrap(block.title, totalWidth, (t) => measure(t, 10, true));
    const headerHeight =
      Math.max(...headers.map((c) => c.length)) * lineHeight + 10;
    const titleHeight = title.length * lineHeight + 6;
    const drawRow = (row: string[][], count: number, header: boolean) => {
      const height = count * lineHeight + 10;
      let x = margin;
      row.forEach((lines, i) => {
        current().push({
          kind: "rect",
          x,
          y,
          width: widths[i],
          height,
          header,
        });
        lines.forEach((line, j) =>
          label(line, x + 5, y + 14 + j * lineHeight, 9, header),
        );
        x += widths[i];
      });
      y += height;
    };
    const start = (firstRowLines = 1) => {
      const firstRowHeight = Math.min(
        firstRowLines * lineHeight + 10,
        bottom - top - titleHeight - headerHeight,
      );
      ensure(titleHeight + headerHeight + firstRowHeight);
      title.forEach((line) => {
        label(line, margin, y + 10, 10, true);
        y += lineHeight;
      });
      y += 6;
      drawRow(headers, Math.max(...headers.map((c) => c.length)), true);
    };
    const rows = block.rows.length
      ? block.rows
      : [["Sem itens neste grupo.", ...block.headers.slice(1).map(() => "-")]];
    start(Math.max(...cells(rows[0], false).map((c) => c.length)));
    for (const row of rows) {
      const lines = cells(row, false);
      let offset = 0;
      const count = Math.max(...lines.map((c) => c.length));
      // Ordinary rows stay together; a row taller than a page continues with headers.
      const height = count * lineHeight + 10;
      if (
        height <= bottom - top - titleHeight - headerHeight &&
        y + height > bottom
      ) {
        next();
        start();
      }
      while (offset < count) {
        const capacity = Math.floor((bottom - y - 10) / lineHeight);
        if (capacity < 1) {
          next();
          start();
          continue;
        }
        const take = Math.min(capacity, count - offset);
        drawRow(
          lines.map((c) => c.slice(offset, offset + take)),
          take,
          false,
        );
        offset += take;
        if (offset < count) {
          next();
          start();
        }
      }
    }
    y += 14;
  }
  pages.forEach((marks, i) => {
    marks.push({
      kind: "text",
      text: "ECOVIT · ORÇAMENTO PRELIMINAR",
      x: margin,
      y: 29,
      size: 9,
      bold: true,
    });
    const title = wrap(
      report.title,
      pageWidth - 2 * margin - measure("…", 8, false),
      (t) => measure(t, 8, false),
    );
    marks.push({
      kind: "text",
      text: title[0] + (title.length > 1 ? "…" : ""),
      x: margin,
      y: 44,
      size: 8,
      bold: false,
    });
    marks.push({
      kind: "text",
      text: `Estimativa nominal · Página ${i + 1} de ${pages.length}`,
      x: margin,
      y: pageHeight - 23,
      size: 8,
      bold: false,
    });
  });
  return pages;
}
