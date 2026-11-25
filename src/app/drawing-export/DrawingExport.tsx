import { lazy, Suspense, useRef, useState } from "react";
import { useStore } from "../../state/store";
import { Icon } from "../../ui/Icon";
import styles from "../../ui/App.module.css";

const Dialog = lazy(() => import("./DrawingExportDialog"));
export function DrawingExport() {
  const [open, setOpen] = useState(false),
    trigger = useRef<HTMLButtonElement>(null);
  const busy = useStore((s) => s.busy);
  return (
    <>
      <button
        ref={trigger}
        className={`${styles.iconButton} ${styles.fileAction}`}
        disabled={busy}
        aria-label="Exportar desenhos"
        title="Exportar desenhos em PDF"
        data-tooltip="Exportar desenhos em PDF"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen(true)}
      >
        <Icon name="drawingExport" />
      </button>
      {open && (
        <Suspense fallback={<p role="status">Preparando exportação…</p>}>
          <Dialog
            onClose={() => {
              setOpen(false);
              requestAnimationFrame(() => trigger.current?.focus());
            }}
          />
        </Suspense>
      )}
    </>
  );
}
