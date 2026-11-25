import { usePendingEditorEdit } from "./pending-edit";
import { useEffect, useRef, useState } from "react";
import type { Opening } from "../domain/project";
import {
  openingMaterials,
  openingMaterialSchema,
  type OpeningMaterial,
} from "../domain/opening-budget";
import { useStore } from "../state/store";
import styles from "../ui/App.module.css";

export function OpeningMaterialProperties({
  opening,
  pending,
}: {
  opening: Opening;
  pending: boolean;
}) {
  const disabled = useStore((s) => s.busy || s.readonly);
  const [other, setOther] = useState(opening.material?.kind === "other");
  const [text, setText] = useState(
    opening.material?.kind === "other" ? opening.material.description : "",
  );
  const [error, setError] = useState("");
  usePendingEditorEdit(
    other &&
      (opening.material?.kind !== "other" ||
        text.trim() !== opening.material.description),
  );
  const frame = useRef<number | undefined>(undefined);
  const section = useRef<HTMLElement>(null);
  const cancel = () => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    setOther(opening.material?.kind === "other");
    setText(
      opening.material?.kind === "other" ? opening.material.description : "",
    );
    setError("");
  };
  useEffect(
    () => () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    },
    [],
  );
  useEffect(() => {
    // Cancel takes precedence over blur, before its deferred confirmation.
    const discard = (e: PointerEvent) => {
      if ((e.target as Element)?.closest?.("[data-cancel-opening]")) cancel();
    };
    document.addEventListener("pointerdown", discard, true);
    return () => document.removeEventListener("pointerdown", discard, true);
  });
  const confirm = (material?: OpeningMaterial) => {
    const state = useStore.getState();
    if (
      state.busy ||
      state.readonly ||
      (state.select !== opening.id && !pending)
    )
      return;
    const source = pending
      ? state.pendingOpening
      : state.doc?.model.openings.find((o) => o.id === opening.id);
    if (!source || source.id !== opening.id) return;
    if (JSON.stringify(source.material) === JSON.stringify(material)) return;
    const next = { ...source };
    if (material) next.material = material;
    else delete next.material;
    if (pending) state.inspect({ pendingOpening: next });
    else if (state.doc)
      void state.commit(
        {
          ...state.doc,
          model: {
            ...state.doc.model,
            openings: state.doc.model.openings.map((o) =>
              o.id === next.id ? next : o,
            ),
          },
        },
        "budget",
      );
  };
  const confirmOther = () => {
    const parsed = openingMaterialSchema.safeParse({
      kind: "other",
      description: text,
    });
    if (!parsed.success) {
      setError("Informe uma descrição de uma linha, com 1 a 100 caracteres.");
      return;
    }
    setError("");
    confirm(parsed.data);
  };
  return (
    <section
      ref={section}
      className={styles.propertyGroup}
      aria-label="Configuração de material da esquadria"
    >
      <h3>Material</h3>
      <label className={styles.field}>
        Material da esquadria
        <select
          aria-label="Material da esquadria"
          disabled={disabled}
          value={other ? "other" : (opening.material?.kind ?? "")}
          onChange={(e) => {
            if (frame.current !== undefined)
              cancelAnimationFrame(frame.current);
            const kind = e.target.value;
            setOther(kind === "other");
            setError("");
            if (kind === "other") return;
            confirm(kind ? openingMaterialSchema.parse({ kind }) : undefined);
          }}
        >
          <option value="">Não definido</option>
          {openingMaterials.map((m) => (
            <option key={m.kind} value={m.kind}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      {other && (
        <label className={styles.field}>
          Descrição do material
          <input
            aria-label="Descrição do material"
            disabled={disabled}
            value={text}
            aria-invalid={!!error}
            aria-describedby={
              error ? `material-error-${opening.id}` : undefined
            }
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                cancel();
              }
              if (e.key === "Enter") {
                e.preventDefault();
                confirmOther();
              }
            }}
            onBlur={(e) => {
              if (
                (e.relatedTarget as Element | null)?.closest(
                  "[data-cancel-opening]",
                )
              ) {
                cancel();
                return;
              }
              frame.current = requestAnimationFrame(() => {
                if (
                  section.current?.isConnected &&
                  (pending || useStore.getState().select === opening.id)
                )
                  confirmOther();
              });
            }}
          />
        </label>
      )}
      {error && (
        <p
          role="alert"
          id={`material-error-${opening.id}`}
          className={styles.errorText}
        >
          {error}
        </p>
      )}
      <p className={styles.note}>
        Especificação para orçamento. O preço por unidade é informado no
        Orçamento.
      </p>
    </section>
  );
}
