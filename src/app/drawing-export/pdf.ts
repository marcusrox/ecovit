import { wrapText } from "../../domain/text";
import { PDFDocument } from "pdf-lib";
import { display, type Project } from "../../domain/project";
import type { LabelPreferences } from "../../state/preferences";
import { preparePages, type ExportOptions } from "./pages";
import {
  drawScene,
  sceneBounds,
  type Scene,
  type Resources,
  type DrawingBounds,
} from "../../editor/drawing/scene";
import { acquireFurnitureBitmap } from "../../editor/furniture-bitmaps";
import { elementUrl } from "../../domain/image-elements";
import { decodeReference } from "../../domain/reference-image";
import { resetAnnotationLayouts } from "../../editor/drawing/annotation-layout";

const PX = 96 / 25.4,
  PT = 72 / 25.4;
const DPI = 300;
export type ExportSnapshot = {
  doc: Project;
  options: ExportOptions;
  labels: LabelPreferences;
  unsaved: boolean;
  emitted: Date;
};
export type GeneratedDrawing = {
  bytes: Uint8Array<ArrayBuffer>;
  filename: string;
  pages: number;
};
const union = (boxes: DrawingBounds[]): DrawingBounds => {
  const x = Math.min(...boxes.map((b) => b.x)),
    y = Math.min(...boxes.map((b) => b.y));
  return {
    x,
    y,
    width: Math.max(...boxes.map((b) => b.x + b.width)) - x,
    height: Math.max(...boxes.map((b) => b.y + b.height)) - y,
  };
};
function lines(ctx: CanvasRenderingContext2D, text: string, width: number) {
  return wrapText(text, width, (value) => ctx.measureText(value).width);
}
function canvas(width: number, height: number) {
  const c = document.createElement("canvas");
  c.width = Math.ceil((width * DPI) / 25.4);
  c.height = Math.ceil((height * DPI) / 25.4);
  const ctx = c.getContext("2d")!;
  ctx.scale(DPI / 96, DPI / 96);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width * PX, height * PX);
  return { canvas: c, ctx };
}
function font(ctx: CanvasRenderingContext2D, size = 12, bold = false) {
  ctx.font = `${bold ? 600 : 400} ${size}px "IBM Plex Sans"`;
  ctx.fillStyle = "#203b2b";
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
}

export async function generateDrawingPdf(
  snapshot: ExportSnapshot,
  signal: AbortSignal,
  progress: (text: string) => void,
): Promise<GeneratedDrawing> {
  const { doc, options, labels, emitted, unsaved } = snapshot;
  const prepared = preparePages(doc, options),
    { local, width, height, drawings } = prepared;
  const floor = local.model.floors[0];
  const held: ReturnType<typeof acquireFurnitureBitmap>[] = [];
  const resources: Resources = { furniture: new Map() };
  const check = () => {
    if (signal.aborted)
      throw new DOMException("Geração cancelada.", "AbortError");
  };
  try {
    progress("Carregando fontes e imagens…");
    const fonts = await Promise.all([
      document.fonts.load('400 100px "IBM Plex Sans"'),
      document.fonts.load('600 100px "IBM Plex Sans"'),
    ]);
    if (fonts.some((f) => !f.length))
      throw Error(
        "Não foi possível carregar as fontes do documento. Tente novamente.",
      );
    resetAnnotationLayouts();
    check();
    if (options.content !== "course") {
      if (options.furniture)
        for (const element of local.model.imageElements) {
          const url = elementUrl(element, local.model.customImageAssets);
          if (resources.furniture.has(url)) continue;
          const resource = acquireFurnitureBitmap(url);
          held.push(resource);
          resources.furniture.set(url, await resource.promise);
          check();
        }
      if (options.image && local.model.referenceImages[0])
        resources.reference = await decodeReference(
          local.model.referenceImages[0],
        );
    }
    check();
    const scenes: Scene[] = drawings.map((d) => ({
      doc: local,
      mode: d.mode,
      course: d.course,
      labels,
      furniture: options.furniture,
      terrain: options.terrain,
      image: options.image,
    }));
    const probe = document.createElement("canvas").getContext("2d")!;
    const bounds = scenes.map((scene) => sceneBounds(scene, probe));
    const courseBoxes = bounds.filter((_, i) => drawings[i].mode === "course");
    const common = courseBoxes.length ? union(courseBoxes) : null;
    const drawWidth = (width - 24) * PX,
      drawHeight = (height - 88) * PX;
    for (let i = 0; i < drawings.length; i++) {
      const b = drawings[i].mode === "course" ? common! : bounds[i],
        s = (0.1 * PX) / drawings[i].scale;
      if (b.width * s > drawWidth || b.height * s > drawHeight)
        throw Error(
          `${drawings[i].mode === "plan" ? "Planta" : `Fiada ${drawings[i].course}`} não cabe inteira em ${options.paper} na escala 1:${drawings[i].scale}. Escolha outro papel, orientação ou escala.`,
        );
    }
    const notes: string[] = [];
    const seen = new Set<string>();
    const add = (text: string) => {
      if (!seen.has(text)) {
        seen.add(text);
        notes.push(text);
      }
    };
    for (const c of local.generated?.clamps ?? [])
      if (
        c.pending &&
        drawings.some((d) => d.mode === "course" && d.course === c.course)
      )
        add(
          `Fiada ${c.course} · Grampo (${display(c.a.x)}, ${display(c.a.y)}) → (${display(c.b.x)}, ${display(c.b.y)}) cm: ${c.pending}`,
        );
    if (doc.generationState.status !== "current")
      add(
        "Planta baseada na intenção confirmada; composição de fiadas indisponível ou desatualizada.",
      );
    for (const d of (doc.generationState.status === "current"
      ? doc.generationState.diagnostics
      : []
    ).filter((d) => !d.floorId || d.floorId === floor.id)) {
      if (
        d.code === "clamp-pending" &&
        (local.generated?.clamps ?? []).some(
          (c) =>
            c.pending &&
            c.course === d.course &&
            c.a.x === d.x &&
            c.a.y === d.y &&
            d.message.endsWith(c.pending),
        )
      )
        continue;
      add(`${d.course ? `Fiada ${d.course} · ` : ""}${d.message}`);
    }
    // Keep the same legend and drawing rectangle on every course page.
    const kinds = new Set(
      drawings
        .filter((d) => d.mode === "course")
        .flatMap(
          (d) =>
            local.generated?.courses
              .find((r) => r.number === d.course)
              ?.pieces.map((p) => p.kind) ?? [],
        ),
    );
    const legend = [
      ...(kinds.has("whole") ? ["Inteiro"] : []),
      ...(kinds.has("half") ? ["Meio"] : []),
      ...(kinds.has("channel") ? ["Canaleta"] : []),
      ...(kinds.has("half-channel") ? ["Meia canaleta"] : []),
    ];
    if (
      drawings.some(
        (d) =>
          d.mode === "course" && (local.generated?.grouts?.length ?? 0) > 0,
      )
    )
      legend.push("Furo preenchido: graute vertical");
    if (
      drawings.some(
        (d) =>
          d.mode === "course" &&
          local.generated?.clamps?.some((c) => c.course === d.course),
      )
    )
      legend.push("Laranja: grampo; vermelho/!: pendente");
    if (
      drawings.some(
        (d) =>
          d.mode === "course" &&
          local.generated?.reinforcement?.some((r) => r.course === d.course),
      )
    )
      legend.push("Roxo: armadura de canaleta");
    probe.font = '400 12px "IBM Plex Sans"';
    const noteLines = notes.flatMap((n, i) =>
      lines(probe, `${i + 1}. ${n}`, (width - 20) * PX),
    );
    const perPage = Math.floor(((height - 63) * PX) / 18),
      notePages = Math.ceil(noteLines.length / perPage),
      total = drawings.length + notePages;
    const pdf = await PDFDocument.create();
    pdf.setTitle(`${doc.project.name} · Desenhos`);
    pdf.setCreator("Ecovit");
    pdf.setCreationDate(emitted);
    async function append(c: HTMLCanvasElement) {
      check();
      const image = await pdf.embedPng(c.toDataURL("image/png"));
      const page = pdf.addPage([width * PT, height * PT]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: width * PT,
        height: height * PT,
      });
      // Compress this page now, releasing its decoded RGB buffer before the next.
      await image.embed();
      c.width = 1;
      c.height = 1;
      await new Promise((resolve) => setTimeout(resolve, 0));
      check();
    }
    const partial =
      doc.generationState.status === "current" &&
      doc.generationState.diagnostics.some(
        (d) => (!d.floorId || d.floorId === floor.id) && d.severity === "error",
      );
    function frame(
      ctx: CanvasRenderingContext2D,
      index: number,
      subtitle: string,
    ) {
      font(ctx, 12, true);
      ctx.fillText("ECOVIT · DESENHOS", 10 * PX, 15 * PX);
      const fit = (text: string, size: number, bold: boolean) => {
        font(ctx, size, bold);
        let wrapped = lines(ctx, text, (width - 20) * PX);
        while (wrapped.length > 2 && size > 8) {
          font(ctx, --size, bold);
          wrapped = lines(ctx, text, (width - 20) * PX);
        }
        if (wrapped.length > 2)
          throw Error(
            "A identificação não cabe no cabeçalho. Revise os nomes do projeto e do pavimento.",
          );
        return wrapped;
      };
      fit(doc.project.name, 18, true).forEach((line, i) =>
        ctx.fillText(line, 10 * PX, 22 * PX + i * 21),
      );
      fit(
        `${floor.name} · Cota ${display(floor.level)} cm · ${subtitle}`,
        12,
        false,
      ).forEach((line, i) => ctx.fillText(line, 10 * PX, 36 * PX + i * 16));
      ctx.strokeStyle = "#b6c5bb";
      ctx.beginPath();
      ctx.moveTo(10 * PX, 43 * PX);
      ctx.lineTo((width - 10) * PX, 43 * PX);
      ctx.stroke();
      font(ctx, 10);
      ctx.fillText(
        "Desenho nominal · Sem detalhamento executivo",
        10 * PX,
        (height - 13) * PX,
      );
      if (unsaved)
        ctx.fillText(
          "Inclui alterações confirmadas ainda não salvas",
          10 * PX,
          (height - 17) * PX,
        );
      const stamp = emitted.toLocaleString("pt-BR");
      ctx.fillText(stamp, 10 * PX, (height - 9) * PX);
      ctx.textAlign = "right";
      ctx.fillText(
        `Página ${index + 1} de ${total}`,
        (width - 10) * PX,
        (height - 9) * PX,
      );
      ctx.textAlign = "left";
    }
    for (let i = 0; i < drawings.length; i++) {
      check();
      progress(`Gerando folha ${i + 1} de ${total}…`);
      const drawing = drawings[i],
        row = local.generated?.courses.find((r) => r.number === drawing.course);
      const title =
        drawing.mode === "plan"
          ? "Planta"
          : `Fiada ${drawing.course} · ${display(row!.bottom)}–${display(row!.top)} cm`;
      const { canvas: c, ctx } = canvas(width, height);
      frame(ctx, i, `${title} · Escala 1:${drawing.scale}`);
      const b = drawing.mode === "course" ? common! : bounds[i],
        scale = (0.1 * PX) / drawing.scale;
      const camera = {
        scale,
        x: 12 * PX + (drawWidth - b.width * scale) / 2 - b.x * scale,
        y: 47 * PX + (drawHeight - b.height * scale) / 2 - b.y * scale,
      };
      // A page rectangle is independent of the editor's camera and viewport.
      ctx.save();
      ctx.beginPath();
      ctx.rect(10 * PX, 45 * PX, (width - 20) * PX, (height - 84) * PX);
      ctx.clip();
      drawScene(
        ctx,
        scenes[i],
        camera,
        { width: width * PX, height: height * PX },
        resources,
      );
      ctx.restore();
      font(ctx, 11);
      const explanation =
        drawing.mode === "course"
          ? legend.join(" · ")
          : "Planta · Paredes, vãos e elementos conforme as opções de exportação";
      lines(ctx, explanation, (width - 20) * PX).forEach((line, j) =>
        ctx.fillText(line, 10 * PX, (height - 34) * PX + j * 14),
      );
      font(ctx, 10);
      ctx.fillStyle = "#934b19";
      if (partial || notes.length)
        ctx.fillText(
          `${partial ? "Resultado parcial. " : ""}${notes.length ? "Consulte as observações ao final." : ""}`,
          10 * PX,
          (height - 20) * PX,
        );
      await append(c);
    }
    for (let i = 0; i < notePages; i++) {
      const { canvas: c, ctx } = canvas(width, height);
      frame(
        ctx,
        drawings.length + i,
        "Observações · Referências às fiadas indicadas abaixo",
      );
      font(ctx, 12);
      noteLines
        .slice(i * perPage, (i + 1) * perPage)
        .forEach((line, j) => ctx.fillText(line, 10 * PX, 50 * PX + j * 18));
      await append(c);
    }
    progress("Concluindo PDF…");
    check();
    const bytes = await pdf.save();
    check();
    return {
      bytes: new Uint8Array(bytes),
      filename: `Desenhos-${doc.project.name.replace(/[^\p{L}\p{N} _-]/gu, "_") || "projeto"}-${emitted.toISOString().slice(0, 10)}.pdf`,
      pages: total,
    };
  } finally {
    held.forEach((h) => h.release());
  }
}
