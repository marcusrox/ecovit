import { parseChannelReinforcement } from "../domain/channel-reinforcement";
import { display } from "../domain/project";
import styles from "../ui/App.module.css";

import type { ReinforcementDraft } from "./floor-reinforcement-draft";
import { BarDiameterSelect } from "./BarDiameterSelect";
import { steelCatalog } from "../domain/steel-budget";
export function FloorChannelReinforcement({
  draft,
  change,
  blocked,
  error,
  horizontalExtra,
  changeExtra,
  extraError,
}: {
  draft: ReinforcementDraft;
  change: (draft: ReinforcementDraft) => void;
  blocked: boolean;
  error?: string;
  horizontalExtra: string;
  changeExtra: (value: string) => void;
  extraError?: string;
}) {
  const { enabled, count, diameter } = draft;
  const setEnabled = (enabled: boolean) => change({ ...draft, enabled });
  const setCount = (count: string) => change({ ...draft, count });
  const setDiameter = (diameter: string) => change({ ...draft, diameter });
  let preview = "",
    invalid = "";
  try {
    const candidate = parseChannelReinforcement(enabled, count, diameter);
    preview = `${candidate.count} ${candidate.count === 1 ? "barra" : "barras"} de Ø ${display(candidate.diameter * 10)} mm`;
  } catch (e) {
    invalid = (e as Error).message;
  }
  return (
    <section className={styles.propertyGroup} aria-label="Armadura das cintas">
      <h3>Armadura das cintas</h3>
      <p className={styles.note}>
        Configuração única neste pavimento, aplicada às cintas, vergas e
        contravergas. As barras acompanham as canaletas existentes.
      </p>
      <div>
        <fieldset
          disabled={blocked}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Ativar armadura das canaletas
          </label>
          <label className={styles.field}>
            Quantidade de barras longitudinais
            <input
              inputMode="numeric"
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            Diâmetro das barras (mm)
            <BarDiameterSelect
              label="Diâmetro das barras (mm)"
              options={["8", "10", "12,5"]}
              value={diameter}
              onChange={setDiameter}
            />
          </label>
          <p className={styles.note}>Conjunto: {invalid ? "—" : preview}.</p>
          <p className={styles.note}>
            Aço para orçamento:{" "}
            {steelCatalog.find(
              (s) => s.diameter === Number(diameter.replace(",", ".")) * 10,
            )?.category ?? "bitola sem cadastro"}
            .
          </p>
          <label className={styles.field}>
            Acréscimo para emendas e dobras (%)
            <input
              inputMode="decimal"
              value={horizontalExtra}
              aria-invalid={!!extraError}
              onChange={(e) => changeExtra(e.target.value)}
            />
          </label>
          <p className={styles.note}>
            Estimativa de orçamento para cintas, vergas e contravergas. Não se
            aplica aos grampos nem modifica o desenho.
          </p>
          {extraError && (
            <p role="alert" className={styles.errorText}>
              {extraError}
            </p>
          )}
          {(error || invalid) && (
            <p role="alert" className={styles.errorText}>
              {error || invalid}
            </p>
          )}
        </fieldset>
      </div>
      <p className={styles.note}>
        Representação nominal, sem escala física de diâmetro ou cobrimento; não
        substitui o detalhamento estrutural ou de fabricação.
      </p>
    </section>
  );
}
