import { PDFDocument } from "pdf-lib";
import type { Project } from "../../domain/project";
import { prepareBudgetReport } from "./model";
import { layoutBudgetReport, pageWidth, pageHeight } from "./layout";

export async function generateBudgetPdf(
  doc: Project,
  emitted: Date,
  unsaved: boolean,
  signal: AbortSignal,
) {
  const check = () => {
    if (signal.aborted)
      throw new DOMException("Geração cancelada.", "AbortError");
  };
  check();
  const fonts = await Promise.all([
    document.fonts.load('400 12px "IBM Plex Sans"'),
    document.fonts.load('600 12px "IBM Plex Sans"'),
  ]);
  if (fonts.some((f) => !f.length))
    throw new Error(
      "Não foi possível carregar as fontes do relatório. Tente novamente.",
    );
  check();
  const report = prepareBudgetReport(doc, emitted, unsaved);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error(
      "Não foi possível preparar o relatório PDF. Tente novamente.",
    );
  const font = (size: number, bold: boolean) =>
    `${bold ? 600 : 400} ${size}px "IBM Plex Sans"`;
  const pages = layoutBudgetReport(report, (text, size, bold) => {
    ctx.font = font(size, bold);
    return ctx.measureText(text).width;
  });
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Orçamento - ${doc.project.name}`);
  pdf.setCreator("Ecovit");
  pdf.setCreationDate(emitted);
  const ratio = 300 / 72;
  try {
    for (const marks of pages) {
      check();
      canvas.width = Math.ceil(pageWidth * ratio);
      canvas.height = Math.ceil(pageHeight * ratio);
      ctx.scale(ratio, ratio);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pageWidth, pageHeight);
      for (const mark of marks) {
        if (mark.kind === "rect") {
          ctx.fillStyle = mark.header ? "#e8eee8" : "#ffffff";
          ctx.fillRect(mark.x, mark.y, mark.width, mark.height);
          ctx.strokeStyle = "#cbd6cc";
          ctx.lineWidth = 0.4;
          ctx.strokeRect(mark.x, mark.y, mark.width, mark.height);
        } else {
          ctx.font = font(mark.size, mark.bold);
          ctx.fillStyle = "#203b2b";
          ctx.fillText(mark.text, mark.x, mark.y);
        }
      }
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) =>
            b
              ? resolve(b)
              : reject(
                  new Error("Não foi possível gerar a página do relatório."),
                ),
          "image/jpeg",
          0.98,
        ),
      );
      check();
      const image = await pdf.embedJpg(await blob.arrayBuffer());
      pdf
        .addPage([pageWidth, pageHeight])
        .drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight });
      // Release each raster before preparing the next page.
      canvas.width = canvas.height = 1;
    }
    check();
    const bytes = new Uint8Array(await pdf.save());
    check();
    const name =
      Array.from(doc.project.name, (c) => (c.charCodeAt(0) < 32 ? "_" : c))
        .join("")
        .replace(/[<>:"/\\|?*]/g, "_")
        .slice(0, 100)
        .trim() || "projeto";
    return { bytes, filename: `${name}-orcamento.pdf` };
  } finally {
    canvas.width = canvas.height = 1;
  }
}
