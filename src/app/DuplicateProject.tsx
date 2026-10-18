import { useEffect, useRef, useState } from "react";
import { duplicateProject } from "../persistence/database";
import { Icon } from "../ui/Icon";
import styles from "../ui/App.module.css";

export function DuplicateProjectDialog({
  source,
  close,
  saved,
}: {
  source: { id: string; name: string };
  close: () => void;
  saved: () => void;
}) {
  const [name, setName] = useState(`${source.name.slice(0, 92)} (cópia)`);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const running = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current!;
    node.showModal();
    return () => node.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`${styles.modal} ${styles.copyDialog}`}
      aria-labelledby="duplicate-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!running.current) close();
      }}
    >
      <h2 id="duplicate-title">Duplicar projeto</h2>
      <p>
        A cópia usa o último estado salvo de {source.name}, inclusive se estiver
        aberto em outra aba. Alterações não salvas não serão copiadas.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (running.current) return;
          running.current = true;
          setWorking(true);
          setError("");
          void duplicateProject(source.id, name)
            .then(saved)
            .catch((e) => setError((e as Error).message))
            .finally(() => {
              running.current = false;
              setWorking(false);
            });
        }}
      >
        <label className={styles.field}>
          Nome da cópia
          <input
            autoFocus
            required
            maxLength={100}
            value={name}
            disabled={working}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className={styles.errorText}>
            {error}
          </p>
        )}
        <div className={styles.quantityHeader}>
          <button type="button" disabled={working} onClick={close}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={working}
            className={`${styles.primary} ${styles.iconText}`}
          >
            <Icon name="copy" />
            {working ? "Duplicando…" : "Duplicar projeto"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
