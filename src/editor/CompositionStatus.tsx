import { useStore } from "../state/store";
import styles from "../ui/App.module.css";

export function CompositionStatus() {
  const { doc, busy, readonly, retry, retainedGroutResult } = useStore();
  if (!doc) return null;
  const outdated = doc.generationState.status === "outdated";
  const message = busy
    ? retainedGroutResult
      ? "Recalculando grautes…"
      : "Processando…"
    : outdated
      ? retainedGroutResult
        ? "Desenho anterior · resultado desatualizado"
        : "Resultado desatualizado"
      : doc.generationState.diagnostics.some((d) => d.severity === "error")
        ? "Atualizado · com pendências"
        : "Composição nominal atualizada";
  return (
    <div className={styles.compositionStatus}>
      <span
        aria-live="polite"
        aria-atomic="true"
        data-testid="composition-status"
      >
        {message}
      </span>
      {outdated && (
        <button disabled={busy || readonly} onClick={() => void retry()}>
          Recalcular
        </button>
      )}
    </div>
  );
}
