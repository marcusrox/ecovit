import { useEffect, useRef, useState } from "react";
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
} from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import styles from "./DrawingExport.module.css";

GlobalWorkerOptions.workerSrc = workerUrl;
export default function PdfPreview({
  bytes,
  onReady,
  onError,
}: {
  bytes: Uint8Array<ArrayBuffer>;
  onReady: () => void;
  onError: (message: string) => void;
}) {
  const [doc, setDoc] = useState<PDFDocumentProxy>();
  const [page, setPage] = useState(1),
    [zoom, setZoom] = useState(1);
  const canvas = useRef<HTMLCanvasElement>(null),
    host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live = true;
    const task = getDocument({ data: bytes.slice() });
    void task.promise
      .then((pdf) => {
        if (live) {
          setDoc(pdf);
          setPage(1);
        }
      })
      .catch(() => {
        if (live)
          onError(
            "Não foi possível visualizar o PDF. Gere novamente para tentar de novo.",
          );
      });
    return () => {
      live = false;
      setDoc(undefined);
      void task.destroy();
    };
  }, [bytes, onError]);
  useEffect(() => {
    if (!doc) return;
    let live = true;
    let cancel: (() => void) | undefined;
    void doc
      .getPage(page)
      .then((p) => {
        if (!live) return;
        const viewport = p.getViewport({ scale: 1 });
        const scale =
          Math.min(1, (host.current!.clientWidth - 32) / viewport.width) * zoom;
        const view = p.getViewport({ scale: Math.max(0.1, scale) }),
          ratio = window.devicePixelRatio || 1,
          c = canvas.current!;
        c.width = Math.ceil(view.width * ratio);
        c.height = Math.ceil(view.height * ratio);
        c.style.width = `${view.width}px`;
        c.style.height = `${view.height}px`;
        const task = p.render({
          canvas: c,
          canvasContext: c.getContext("2d")!,
          viewport: view,
          transform: [ratio, 0, 0, ratio, 0, 0],
        });
        cancel = () => task.cancel();
        return task.promise.then(() => {
          if (live) onReady();
        });
      })
      .catch((error) => {
        if (
          live &&
          !(
            error instanceof Error &&
            error.name === "RenderingCancelledException"
          )
        )
          onError("Não foi possível desenhar a página do PDF. Gere novamente.");
      });
    return () => {
      live = false;
      cancel?.();
    };
  }, [doc, page, zoom, onReady, onError]);
  return (
    <section className={styles.preview} aria-label="Prévia do PDF">
      <div className={styles.previewActions}>
        <button
          disabled={!doc || page === 1}
          onClick={() => setPage((p) => p - 1)}
          aria-label="Página anterior"
        >
          Anterior
        </button>
        <span role="status">
          Página {page} de {doc?.numPages ?? "…"}
        </span>
        <button
          disabled={!doc || page === doc.numPages}
          onClick={() => setPage((p) => p + 1)}
          aria-label="Próxima página"
        >
          Próxima
        </button>
        <label>
          Ampliação da prévia{" "}
          <select
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          >
            {[0.5, 0.75, 1, 1.25, 1.5, 2, 3].map((z) => (
              <option key={z} value={z}>
                {Math.round(z * 100)}%
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.sheet} ref={host}>
        <canvas ref={canvas} aria-label={`Página ${page} do PDF gerado`} />
      </div>
    </section>
  );
}
