import { useState } from "react";
import {
  defaultChannelReinforcement,
  parseChannelReinforcement,
} from "../domain/channel-reinforcement";
import { display } from "../domain/project";
import { editFloor } from "../domain/floors";
import { useStore } from "../state/store";
import styles from "../ui/App.module.css";

export function FloorChannelReinforcement() {
  const s = useStore(),
    doc = s.doc!,
    floor = doc.model.floors.find((f) => f.id === s.activeFloorId)!;
  const original = floor.channelReinforcement ?? defaultChannelReinforcement();
  const [enabled, setEnabled] = useState(original.enabled);
  const [count, setCount] = useState(String(original.count));
  const [diameter, setDiameter] = useState(display(original.diameter * 10));
  const [error, setError] = useState("");
  const blocked = s.busy || s.readonly || !!s.imageDraft;
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
      <form
        onChange={() => setError("")}
        onSubmit={async (e) => {
          e.preventDefault();
          if (blocked) return;
          try {
            const candidate = parseChannelReinforcement(
                enabled,
                count,
                diameter,
              ),
              state = useStore.getState();
            if (
              !state.doc ||
              state.doc.project.id !== doc.project.id ||
              state.activeFloorId !== floor.id ||
              state.busy ||
              state.readonly
            )
              return;
            setError("");
            if (
              JSON.stringify(candidate) !==
              JSON.stringify(floor.channelReinforcement)
            )
              await state.commit(
                editFloor(state.doc, floor.id, {
                  channelReinforcement: candidate,
                }),
                "floor",
              );
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
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
            <input
              inputMode="decimal"
              value={diameter}
              onChange={(e) => setDiameter(e.target.value)}
            />
          </label>
          <p className={styles.note}>Conjunto: {invalid ? "—" : preview}.</p>
          {(error || invalid) && (
            <p role="alert" className={styles.errorText}>
              {error || invalid}
            </p>
          )}
          <button type="submit">Aplicar armadura das cintas</button>
        </fieldset>
        {s.saved !== "saved" && s.saved !== "saving" && (
          <p role="alert" className={styles.errorText}>
            Não salvo. {s.message} Use a recuperação no aviso do projeto.
          </p>
        )}
      </form>
      <p className={styles.note}>
        Representação nominal, sem escala física de diâmetro ou cobrimento; não
        substitui o detalhamento estrutural ou de fabricação.
      </p>
    </section>
  );
}
