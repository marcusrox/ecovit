import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { editFloor, type Floor } from "../domain/floors";
import { display, type Project } from "../domain/project";
import { useStore } from "../state/store";
import { Icon } from "../ui/Icon";
import { FloorClamps } from "./FloorClamps";
import { BarDiameterSelect } from "./BarDiameterSelect";
import { FloorChannelReinforcement } from "./FloorChannelReinforcement";
import {
  floorReinforcementDraft,
  floorReinforcementChanges,
  type FerragensErrors,
} from "./floor-reinforcement-draft";
import styles from "../ui/App.module.css";

export function FloorReinforcement() {
  const s = useStore();
  const [origin, setOrigin] = useState<{ doc: Project; floor: Floor } | null>(
    null,
  );
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOrigin(null);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  return (
    <>
      <button
        ref={trigger}
        className={`${styles.iconText} ${styles.ferragensTrigger}`}
        disabled={s.busy || !!s.imageDraft}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const state = useStore.getState(),
            doc = state.doc;
          const floor = doc?.model.floors.find(
            (f) => f.id === state.activeFloorId,
          );
          if (!doc || !floor || state.busy || state.imageDraft) return;
          setOrigin({ doc, floor });
        }}
      >
        <Icon name="settings" /> Ferragens do pavimento
      </button>
      {origin &&
        createPortal(
          <FerragensSession origin={origin} close={close} />,
          document.body,
        )}
    </>
  );
}

function FerragensSession({
  origin,
  close,
}: {
  origin: { doc: Project; floor: Floor };
  close: () => void;
}) {
  const s = useStore();
  const [draft, setDraft] = useState(() =>
    floorReinforcementDraft(origin.floor, origin.doc),
  );
  const [baseline, setBaseline] = useState(() => JSON.stringify(draft));
  const [errors, setErrors] = useState<FerragensErrors>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const inFlight = submitting || s.busy;
  const failed = s.saved !== "saved" && s.saved !== "saving";
  const blocked = inFlight || s.readonly || !!s.imageDraft || failed;
  const dirty = JSON.stringify(draft) !== baseline;
  useEffect(() => {
    const node = dialog.current!;
    node.showModal();
    heading.current?.focus();
    return () => node.close();
  }, []);
  const requestClose = () => {
    if (inFlight) return;
    if (dirty) setConfirm(true);
    else close();
  };
  const apply = async () => {
    const state = useStore.getState(),
      doc = state.doc;
    if (blocked || state.busy || state.readonly || state.imageDraft) return;
    const floor = doc?.model.floors.find((f) => f.id === origin.floor.id);
    if (
      !doc ||
      !floor ||
      doc.project.id !== origin.doc.project.id ||
      state.activeFloorId !== origin.floor.id
    ) {
      setMessage(
        "O projeto ou pavimento mudou. Feche e reabra as ferragens do pavimento atual.",
      );
      return;
    }
    const result = floorReinforcementChanges(draft, doc, floor);
    setErrors(result.errors);
    setMessage("");
    if (!result.changes) return;
    if (!Object.keys(result.changes).length) {
      setBaseline(JSON.stringify(draft));
      setMessage("Nenhuma alteração para aplicar.");
      return;
    }
    setSubmitting(true);
    try {
      const candidate = editFloor(doc, floor.id, result.changes);
      await state.commit(candidate, "floor");
      // A failed save retains this submitted candidate in the store, not an unsent draft.
      const latest = useStore.getState();
      const applied =
        latest.doc?.project.id === doc.project.id
          ? latest.doc.model.floors.find((f) => f.id === floor.id)
          : undefined;
      if (
        applied &&
        Object.entries(result.changes).every(
          ([key, value]) =>
            JSON.stringify(applied[key as keyof Floor]) ===
            JSON.stringify(value),
        )
      ) {
        setBaseline(JSON.stringify(draft));
        if (latest.saved === "saved")
          setMessage("Salvo. Alterações aplicadas ao pavimento.");
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <dialog
      ref={dialog}
      className={`${styles.releasePage} ${styles.ferragensDialog}`}
      aria-labelledby="ferragens-title"
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
    >
      <header className={styles.releaseHeader}>
        <div>
          <h1 id="ferragens-title" ref={heading} tabIndex={-1}>
            Ferragens do pavimento
          </h1>
          <p>
            {origin.floor.name} · Cota {display(origin.floor.level)} cm
          </p>
        </div>
        <button disabled={inFlight} onClick={requestClose}>
          Fechar
        </button>
      </header>
      <div className={styles.ferragensContent}>
        <fieldset disabled={blocked} className={styles.ferragensGrid}>
          <section
            className={styles.propertyGroup}
            aria-label="Graute do pavimento"
          >
            <h3>Graute vertical</h3>
            <label className={styles.field}>
              Graute nos encontros
              <select
                aria-label="Graute nos encontros"
                value={draft.groutMode}
                disabled={blocked || !s.doc?.project.groutSettings.junctions}
                onChange={(e) => {
                  setDraft({
                    ...draft,
                    groutMode: e.target.value as "simple" | "reinforced",
                  });
                  setErrors({ ...errors, groutMode: undefined });
                  setMessage("");
                }}
              >
                <option value="simple">Simples</option>
                <option value="reinforced">Reforçado</option>
              </select>
            </label>
            <label className={styles.field}>
              Diâmetro das barras do graute (mm)
              <BarDiameterSelect
                label="Diâmetro das barras do graute (mm)"
                value={draft.groutDiameter}
                options={["8", "10", "12,5"]}
                onChange={(groutDiameter) => {
                  setDraft({ ...draft, groutDiameter });
                  setErrors({ ...errors, groutDiameter: undefined });
                  setMessage("");
                }}
              />
            </label>
            {errors.groutDiameter && (
              <p role="alert" className={styles.errorText}>
                {errors.groutDiameter}
              </p>
            )}
            {(
              [
                ["usefulLength", "Comprimento útil por trecho (cm)"],
                ["overlapLength", "Sobreposição por emenda (cm)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className={styles.field}>
                {label}
                <input
                  inputMode="decimal"
                  value={draft[key]}
                  aria-invalid={!!errors[key]}
                  onChange={(e) => {
                    setDraft({ ...draft, [key]: e.target.value });
                    setErrors({ ...errors, [key]: undefined });
                    setMessage("");
                  }}
                />
                {errors[key] && (
                  <span role="alert" className={styles.errorText}>
                    {errors[key]}
                  </span>
                )}
              </label>
            ))}
            <p className={styles.note}>
              Orçamento: uma barra por eixo, com sobreposição a cada trecho
              útil. Sem arranques entre pavimentos; não é plano de corte.
            </p>
            <p className={styles.note}>
              Somente neste pavimento. Simples: 1 furo no L e na cruz; 2 no T
              (centro e primeiro furo do ramal). Reforçado: 3 furos no L, 4 no T
              e 5 na cruz, incluindo o centro. Distribuição nominal, sem
              dimensionamento estrutural.
            </p>
            {!s.doc?.project.groutSettings.junctions && (
              <p className={styles.note}>
                Ative Encontros nas Configurações do projeto para usar esta
                opção.
              </p>
            )}
            {errors.groutMode && (
              <p role="alert" className={styles.errorText}>
                {errors.groutMode}
              </p>
            )}
          </section>
          <FloorClamps
            draft={draft.clamps}
            blocked={blocked}
            error={errors.clamps}
            change={(clamps) => {
              setDraft({ ...draft, clamps });
              setErrors({ ...errors, clamps: undefined });
              setMessage("");
            }}
          />
          <FloorChannelReinforcement
            draft={draft.reinforcement}
            blocked={blocked}
            error={errors.reinforcement}
            horizontalExtra={draft.horizontalExtra}
            extraError={errors.horizontalExtra}
            changeExtra={(horizontalExtra) => {
              setDraft({ ...draft, horizontalExtra });
              setErrors({ ...errors, horizontalExtra: undefined });
              setMessage("");
            }}
            change={(reinforcement) => {
              setDraft({ ...draft, reinforcement });
              setErrors({ ...errors, reinforcement: undefined });
              setMessage("");
            }}
          />
        </fieldset>
      </div>
      <footer className={styles.ferragensFooter}>
        <div aria-live="polite">
          {failed ? (
            <p role="alert" className={styles.errorText}>
              Não salvo. {s.message} Feche para acessar a recuperação no aviso
              do projeto.
            </p>
          ) : (
            <p>
              {inFlight
                ? "Salvando e recalculando…"
                : s.readonly
                  ? "Somente leitura"
                  : message ||
                    (dirty
                      ? "Alterações não aplicadas."
                      : "As alterações são salvas ao aplicar.")}
            </p>
          )}
        </div>
        <div className={styles.groutDialogActions}>
          <button disabled={inFlight} onClick={requestClose}>
            Cancelar
          </button>
          <button
            className={styles.primary}
            disabled={blocked}
            onClick={() => void apply()}
          >
            Aplicar alterações
          </button>
        </div>
      </footer>
      {confirm && <DiscardDraft close={close} keep={() => setConfirm(false)} />}
    </dialog>
  );
}

function DiscardDraft({
  close,
  keep,
}: {
  close: () => void;
  keep: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const keepButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const node = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    node.showModal();
    keepButton.current?.focus();
    return () => {
      node.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.copyDialog}
      aria-labelledby="ferragens-discard-title"
      onCancel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        keep();
      }}
    >
      <h2 id="ferragens-discard-title">Descartar alterações não aplicadas?</h2>
      <p>As edições desde a última aplicação serão descartadas.</p>
      <div className={styles.groutDialogActions}>
        <button ref={keepButton} onClick={keep}>
          Continuar editando
        </button>
        <button onClick={close}>Descartar e fechar</button>
      </div>
    </dialog>
  );
}
