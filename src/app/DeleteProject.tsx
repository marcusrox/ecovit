import { useEffect, useRef, useState } from "react";
import { deleteProject, loadStoredProject } from "../persistence/database";
import { download } from "../persistence/files";
import { Icon } from "../ui/Icon";
import styles from "../ui/App.module.css";

export function DeleteProjectDialog({
  source,
  close,
  deleted,
  trigger,
}: {
  source: { id: string; name: string };
  close: () => void;
  deleted: () => void;
  trigger: HTMLButtonElement | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const running = useRef(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [backup, setBackup] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const node = dialog.current!;
    node.showModal();
    return () => {
      node.close();
      queueMicrotask(() => {
        if (trigger?.isConnected) trigger.focus();
      });
    };
  }, [trigger]);
  async function act(remove: boolean) {
    if (running.current) return;
    running.current = true;
    setWorking(true);
    setError("");
    try {
      if (remove) {
        await deleteProject(source.id);
        deleted();
      } else {
        const omitted = download(await loadStoredProject(source.id));
        setBackup(true);
        setNotice(
          "Download solicitado. Confira se o arquivo foi salvo antes de excluir." +
            (omitted
              ? " O backup contém o desenho sem o resultado calculado."
              : ""),
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      running.current = false;
      setWorking(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className={`${styles.modal} ${styles.copyDialog}`}
      aria-labelledby="delete-project-title"
      aria-describedby="delete-project-description"
      onCancel={(e) => {
        e.preventDefault();
        if (!running.current) close();
      }}
    >
      <h2 id="delete-project-title">Excluir projeto</h2>
      <p id="delete-project-description">
        Deseja baixar o arquivo .ecovit de {source.name} para ter um backup
        antes de excluir? O backup usa o último estado salvo neste navegador. A
        exclusão não pode ser desfeita e não remove arquivos já baixados.
      </p>
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert" className={styles.errorText}>
          {error}
        </p>
      )}
      <div className={styles.deleteActions}>
        <button autoFocus disabled={working} onClick={close}>
          Cancelar
        </button>
        <button
          className={styles.iconText}
          disabled={working}
          onClick={() => void act(false)}
        >
          <Icon name="download" /> Baixar backup .ecovit
        </button>
        <button
          className={`${styles.iconText} ${styles.deleteProject}`}
          disabled={working}
          onClick={() => void act(true)}
        >
          <Icon name="delete" />{" "}
          {backup ? "Excluir projeto" : "Excluir sem backup"}
        </button>
      </div>
    </dialog>
  );
}
