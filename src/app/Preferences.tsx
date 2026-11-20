import { useEffect, useRef, useState } from "react";
import { usePreferences, type LabelType } from "../state/preferences";
import { Icon } from "../ui/Icon";
import styles from "../ui/App.module.css";

export function PreferencesDialog({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const preferences = usePreferences();
  const [labels, setLabels] = useState(preferences.labels);
  const [highQualityImages, setHighQualityImages] = useState(
    preferences.highQualityImages,
  );
  useEffect(() => {
    const node = dialog.current!;
    node.showModal();
    node.querySelector<HTMLInputElement>("input")?.focus();
    return () => node.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`${styles.modal} ${styles.settingsModal} ${styles.preferencesDialog}`}
      aria-labelledby="preferences-title"
      onKeyDown={(e) => e.stopPropagation()}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <header className={styles.settingsHeader}>
        <div>
          <span className={styles.eyebrow}>ECOVIT</span>
          <h2 id="preferences-title">Preferências do Ecovit</h2>
          <p>Apresentação de todos os projetos neste navegador</p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Fechar preferências"
          className={`${styles.settingsClose} ${styles.iconButton}`}
          title="Fechar preferências"
          data-tooltip="Fechar preferências"
        >
          <Icon name="close" />
        </button>
      </header>
      <form
        className={styles.settingsForm}
        onSubmit={(e) => {
          e.preventDefault();
          preferences.apply({ labels, highQualityImages });
          if (!usePreferences.getState().error) close();
        }}
      >
        <div className={styles.settingsBody}>
          <div className={styles.preferencesGrid}>
            <section
              className={styles.settingsCard}
              aria-labelledby="preferences-labels-title"
            >
              <div className={styles.settingsCardHeading}>
                <h3 id="preferences-labels-title">Visibilidade dos rótulos</h3>
              </div>
              <div className={styles.preferencesOptions}>
                {(
                  [
                    ["door", "Portas"],
                    ["window", "Janelas"],
                    ["opening", "Vãos"],
                    ["wall", "Paredes"],
                    ["measure", "Medidas"],
                    ["terrain", "Terreno"],
                  ] as [LabelType, string][]
                ).map(([type, label]) => (
                  <label key={type}>
                    <input
                      type="checkbox"
                      checked={labels[type]}
                      onChange={(e) =>
                        setLabels({ ...labels, [type]: e.target.checked })
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </section>
            <section
              className={styles.settingsCard}
              aria-labelledby="preferences-images-title"
            >
              <div className={styles.settingsCardHeading}>
                <h3 id="preferences-images-title">Imagens dos mobiliários</h3>
              </div>
              <div className={styles.preferencesOptions}>
                <label>
                  <input
                    type="checkbox"
                    checked={highQualityImages}
                    onChange={(e) => setHighQualityImages(e.target.checked)}
                  />
                  Suavização em qualidade alta
                </label>
              </div>
              <p className={styles.settingsCaption}>
                Suaviza imagens ao reduzir ou girar. Pode exigir mais
                processamento.
              </p>
            </section>
          </div>
          {preferences.error && (
            <p role="alert" className={styles.errorText}>
              {preferences.error}
            </p>
          )}
        </div>
        <footer className={styles.settingsFooter}>
          <span>As alterações são salvas ao aplicar.</span>
          <button type="button" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className={styles.primary}>
            Aplicar preferências
          </button>
        </footer>
      </form>
    </dialog>
  );
}
