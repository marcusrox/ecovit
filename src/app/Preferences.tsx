import { useEffect, useRef } from "react";
import { usePreferences, type LabelType } from "../state/preferences";
import styles from "../ui/App.module.css";

export function PreferencesDialog({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { labels, error, setLabel, highQualityImages, setHighQualityImages } =
    usePreferences();
  useEffect(() => {
    const node = dialog.current!;
    node.showModal();
    return () => node.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`${styles.modal} ${styles.preferencesDialog}`}
      aria-labelledby="preferences-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <h2 id="preferences-title">Preferências do Ecovit</h2>
      <fieldset>
        <legend>Visibilidade dos rótulos</legend>
        {(
          [
            ["door", "Portas"],
            ["window", "Janelas"],
            ["opening", "Vãos"],
            ["wall", "Paredes"],
            ["measure", "Medidas"],
          ] as [LabelType, string][]
        ).map(([type, label]) => (
          <label key={type}>
            <input
              type="checkbox"
              checked={labels[type]}
              onChange={(e) => setLabel(type, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Imagens dos mobiliários</legend>
        <label>
          <input
            type="checkbox"
            checked={highQualityImages}
            onChange={(e) => setHighQualityImages(e.target.checked)}
          />
          Suavização em qualidade alta
        </label>
      </fieldset>
      <p>
        Suaviza imagens ao reduzir ou girar. Pode exigir mais processamento.
      </p>
      <p>
        As alterações são imediatas e valem para todos os projetos neste
        navegador.
      </p>
      {error && (
        <p role="alert" className={styles.errorText}>
          {error}
        </p>
      )}
      <button onClick={close}>Fechar</button>
    </dialog>
  );
}
