import { useLayoutEffect, useRef } from "react";
import type { ReleaseInfo } from "../../scripts/release-info";
import styles from "../ui/App.module.css";

declare const __ECOVIT_RELEASE__: ReleaseInfo;

const release = __ECOVIT_RELEASE__;
export const releaseHistoryHash = "#historico-de-tasks";

export function VersionLink() {
  return (
    <span className={styles.versionLabel}>
      <span>Versão: {release.dateTime} ·</span>{" "}
      <a
        className={styles.versionLink}
        href={releaseHistoryHash}
        aria-label={`Versão ${release.version} · Histórico de Alterações`}
      >
        {release.commit}
      </a>
    </span>
  );
}

export function VersionFooter() {
  return (
    <footer className={styles.versionFooter}>
      <VersionLink />
    </footer>
  );
}

export function ReleaseHistory({ back }: { back?: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const page = dialog.current;
    const origin = document.activeElement;
    page?.showModal();
    title.current?.focus();
    return () => {
      page?.close();
      if (origin instanceof HTMLElement && origin.isConnected) origin.focus();
    };
  }, []);

  const close = () => {
    if (back) back();
    else window.location.hash = "";
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="release-title"
      className={styles.releasePage}
      onKeyDown={(event) => event.stopPropagation()}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <header className={styles.releaseHeader}>
        <div>
          <h1 id="release-title" ref={title} tabIndex={-1}>
            Histórico de Alterações
          </h1>
          <p>Versão {release.version}</p>
        </div>
        <button type="button" onClick={close}>
          {back ? "Fechar" : "Voltar ao Ecovit"}
        </button>
      </header>
      <main className={styles.releaseContent}>
        <div className={styles.releaseColumns} aria-hidden="true">
          <span>ID</span>
          <span>Alteração</span>
          <span>Commit</span>
          <span>Data/Hora</span>
        </div>
        {release.tasks.length ? (
          <ol className={styles.releaseTasks}>
            {release.tasks.map(
              ({ id, title, summary, commit, date, dateTime }) => (
                <li key={id}>
                  <strong>{id}</strong>
                  <span>
                    {title}
                    {summary ? ` - (${summary})` : ""}
                  </span>
                  <code className={styles.releaseCommit}>{commit}</code>
                  <time
                    dateTime={date}
                    aria-label={`Entrega em ${dateTime}, horário de São Paulo`}
                  >
                    {dateTime}
                  </time>
                </li>
              ),
            )}
          </ol>
        ) : (
          <p className={styles.releaseEmpty}>
            Nenhuma alteração disponível nesta versão.
          </p>
        )}
      </main>
    </dialog>
  );
}
