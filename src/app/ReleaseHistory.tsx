import { useLayoutEffect, useRef } from "react";
import type { ReleaseInfo } from "../../scripts/release-info";
import styles from "../ui/App.module.css";

declare const __ECOVIT_RELEASE__: ReleaseInfo;

const release = __ECOVIT_RELEASE__;
export const releaseHistoryHash = "#historico-de-tasks";

export function VersionLink() {
  return (
    <a
      className={styles.versionLink}
      href={releaseHistoryHash}
      aria-label={`Versão ${release.version} · Histórico de tasks`}
    >
      {release.version}
    </a>
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
    page?.showModal();
    title.current?.focus();
    return () => page?.close();
  }, []);

  const content = (
    <main className={styles.releaseContent}>
      {back ? (
        <button type="button" onClick={back}>
          Voltar
        </button>
      ) : (
        <a className={styles.versionLink} href="./">
          Voltar ao Ecovit
        </a>
      )}
      <h1 id="release-title" ref={title} tabIndex={-1}>
        Histórico de tasks
      </h1>
      <p>Versão {release.version}</p>
      {release.tasks.length ? (
        <ol className={styles.releaseTasks}>
          {release.tasks.map(({ id, title, date }) => (
            <li key={id}>
              <strong>{id}</strong>
              <span>{title}</span>
              <time dateTime={date}>{date.split("-").reverse().join("/")}</time>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.releaseTasks}>
          Nenhuma task implementada nesta versão
        </p>
      )}
    </main>
  );
  if (!back) return content;
  return (
    <dialog
      ref={dialog}
      aria-labelledby="release-title"
      className={styles.releasePage}
      onKeyDown={(event) => event.stopPropagation()}
      onCancel={(event) => {
        event.preventDefault();
        back();
      }}
    >
      {content}
    </dialog>
  );
}
