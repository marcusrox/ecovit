import { createContext, useContext, useEffect, useRef, useState } from "react";
import { api } from "../persistence/http";
import { useStore } from "../state/store";
import {
  incorporatePrices,
  projectPriceItems,
  priceItemKey,
  priceItemLabel,
  withProjectPrice,
  completePriceReference,
  type PriceItem,
  type PriceReference,
} from "../domain/price-references";
import type { Project } from "../domain/project";
import { Icon } from "../ui/Icon";
import styles from "../ui/App.module.css";
import { settlementNumber } from "../domain/settlement-budget";

const lookup = (items: PriceItem[]) =>
  api<{ references: PriceReference[] }>("/prices/lookup", {
    method: "POST",
    body: { items },
  });
export function useBudgetReferences(
  doc: Project,
  open: boolean,
  busy: boolean,
  readonly: boolean,
  saved: string,
  setPriceSaving: (value: boolean) => void,
) {
  const [references, setReferences] = useState<PriceReference[]>([]);
  const [working, setWorking] = useState(false),
    [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const attempted = useRef(false),
    lifecycle = useRef({ active: true });
  useEffect(() => {
    const token = { active: true };
    lifecycle.current = token;
    attempted.current = false;
    setReferences([]);
    setWorking(false);
    setError("");
    return () => {
      token.active = false;
    };
  }, [open, doc.project.id]);
  useEffect(() => {
    if (!open || busy || readonly || saved !== "saved" || attempted.current)
      return;
    attempted.current = true;
    const token = lifecycle.current,
      id = doc.project.id;
    setWorking(true);
    setError("");
    void (async () => {
      try {
        const result = await lookup(projectPriceItems(doc));
        if (!token.active) return;
        setReferences(result.references);
        const s = useStore.getState();
        if (
          !s.doc ||
          s.doc.project.id !== id ||
          s.busy ||
          s.readonly ||
          s.saved !== "saved"
        )
          throw new Error(
            "Aguarde concluir a operação do projeto e tente consultar as referências novamente.",
          );
        const next = incorporatePrices(s.doc, result.references);
        if (next !== s.doc) {
          setPriceSaving(true);
          try {
            await s.commit(next, "budget");
          } finally {
            setPriceSaving(false);
          }
        }
      } catch (e) {
        if (token.active)
          setError(
            e instanceof Error
              ? e.message
              : "Não foi possível consultar os preços de referência.",
          );
      } finally {
        if (token.active) setWorking(false);
      }
    })();
  }, [open, busy, readonly, saved, retry, doc, setPriceSaving]);
  async function apply(item: PriceItem) {
    const token = lifecycle.current,
      id = doc.project.id;
    const current = useStore.getState();
    if (
      working ||
      !current.doc ||
      current.doc.project.id !== id ||
      current.busy ||
      current.readonly ||
      current.saved !== "saved"
    )
      return false;
    setWorking(true);
    setError("");
    try {
      const result = await lookup([item]);
      if (!token.active) return false;
      const reference = result.references.find(
        (r) => priceItemKey(r.item) === priceItemKey(item),
      );
      if (!reference || !completePriceReference(reference))
        throw new Error(
          item.group === "surface"
            ? "Referência indisponível ou incompleta. Complete produto, embalagem, rendimento e preço na Administração."
            : "Preço de referência não disponível para este item.",
        );
      const s = useStore.getState();
      if (
        !s.doc ||
        s.doc.project.id !== id ||
        s.busy ||
        s.readonly ||
        s.saved !== "saved"
      )
        throw new Error(
          "Aguarde concluir a operação do projeto antes de usar a referência.",
        );
      const next = withProjectPrice(
        s.doc,
        item,
        reference.price!,
        "reference",
        reference.description,
        reference.yield,
      );
      if (next !== s.doc) {
        setPriceSaving(true);
        try {
          await s.commit(next, "budget");
        } finally {
          setPriceSaving(false);
        }
      }
      return true;
    } catch (e) {
      if (token.active)
        setError(
          e instanceof Error
            ? e.message
            : "Não foi possível usar o preço de referência.",
        );
      return false;
    } finally {
      if (token.active) setWorking(false);
    }
  }
  return {
    references,
    working,
    error,
    apply,
    reload: () => {
      attempted.current = false;
      setRetry((n) => n + 1);
    },
    blocked: busy || readonly || saved !== "saved" || working,
  };
}
export const BudgetReferenceContext = createContext<ReturnType<
  typeof useBudgetReferences
> | null>(null);
export function ReferencePriceButton({
  item,
  clearDraft,
}: {
  item: PriceItem;
  clearDraft: () => void;
}) {
  const context = useContext(BudgetReferenceContext);
  if (!context) return null;
  const reference = context.references.find(
    (r) => priceItemKey(r.item) === priceItemKey(item) && r.price !== null,
  );
  const available =
    reference !== undefined && completePriceReference(reference);
  const hint = available
    ? item.group === "surface"
      ? `Usar referência completa: ${reference.description} · ${settlementNumber(BigInt(reference.yield!), 1000n)} m²/embalagem`
      : item.group === "openings"
        ? "Usar preço de referência do conjunto completo, sem instalação"
        : "Usar preço de referência"
    : reference?.item.group === "surface"
      ? "Referência incompleta: informe o rendimento na Administração"
      : "Preço de referência indisponível";
  return (
    <span className={styles.referenceHint} data-tooltip={hint}>
      <button
        type="button"
        className={`${styles.iconButton} ${styles.referencePrice}`}
        aria-label={`${item.group === "surface" ? "Usar referência completa" : "Usar preço de referência"} de ${priceItemLabel(item)}`}
        title={hint}
        aria-disabled={context.blocked || !available}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          if (!context.blocked && available)
            void context.apply(item).then((applied) => {
              if (applied) clearDraft();
            });
        }}
      >
        <Icon name="referencePrice" size="compact" />
      </button>
    </span>
  );
}
