import { useEffect, useRef, useState } from "react";
import { api, getAccountScope, requestTime } from "../persistence/http";
import {
  priceItemKey,
  priceItemLabel,
  type PriceReference,
} from "../domain/price-references";
import { priceText, parseUnitPrice } from "../domain/budget";
import css from "./Admin.module.css";

type PriceJob = {
  item: PriceReference["item"];
  key: string;
  text: string;
  price: number | null;
};
type PriceRequest = {
  job: PriceJob;
  input: {
    item: PriceReference["item"];
    price: number | null;
    expectedPrice: number | null;
    operationId: string;
    requestIssuedAt: string;
  };
};
export function AdminPrices({
  account,
  setWorking,
}: {
  account: string;
  setWorking: (value: boolean) => void;
}) {
  const [page, setPage] = useState(1),
    [revision, setRevision] = useState(0);
  const [data, setData] = useState<{
    references: PriceReference[];
    hasMore: boolean;
  }>();
  const [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false),
    [failed, setFailed] = useState(false);
  const confirmed = useRef(new Map<string, PriceReference>()),
    queue = useRef<PriceJob[]>([]);
  const pending = useRef<PriceRequest | null>(null),
    running = useRef(false),
    alive = useRef(true),
    halted = useRef(false),
    afterSave = useRef<(() => void) | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    let live = true;
    setData(undefined);
    setError("");
    void api<{ references: PriceReference[]; hasMore: boolean }>(
      `/admin/prices?page=${page}`,
      { account },
    )
      .then((result) => {
        if (!live || getAccountScope() !== account) return;
        confirmed.current = new Map(
          result.references.map((row) => [priceItemKey(row.item), row]),
        );
        setData(result);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [account, page, revision]);
  function clearDraft(job: PriceJob) {
    setDrafts((previous) => {
      if (previous[job.key] !== job.text) return previous;
      const next = { ...previous };
      delete next[job.key];
      return next;
    });
  }
  async function drain() {
    if (running.current) return;
    running.current = true;
    setSaving(true);
    setWorking(true);
    setFailed(false);
    halted.current = false;
    setError("");
    setMessage("");
    try {
      while (pending.current || queue.current.length) {
        if (!alive.current || getAccountScope() !== account) return;
        if (!pending.current) {
          const job = queue.current.shift()!;
          const expectedPrice = confirmed.current.get(job.key)?.price ?? null;
          if (job.price === expectedPrice) {
            clearDraft(job);
            continue;
          }
          pending.current = {
            job,
            input: {
              item: job.item,
              price: job.price,
              expectedPrice,
              operationId: crypto.randomUUID(),
              requestIssuedAt: requestTime(),
            },
          };
        }
        const request = pending.current;
        await api("/admin/prices", {
          method: "POST",
          account,
          body: request.input,
        });
        if (!alive.current || getAccountScope() !== account) return;
        const updated = { item: request.job.item, price: request.job.price };
        confirmed.current.set(request.job.key, updated);
        setData(
          (previous) =>
            previous && {
              ...previous,
              references: previous.references.map((row) =>
                priceItemKey(row.item) === request.job.key ? updated : row,
              ),
            },
        );
        clearDraft(request.job);
        pending.current = null;
        setMessage("Preço de referência salvo.");
      }
    } catch (e) {
      if (alive.current) {
        halted.current = true;
        setFailed(true);
        setError(
          `${pending.current ? priceItemLabel(pending.current.job.item) + ": " : ""}${e instanceof Error ? e.message : "Não foi possível salvar a referência."}`,
        );
      }
    } finally {
      running.current = false;
      if (alive.current) {
        setSaving(false);
        setWorking(false);
        const navigate = afterSave.current;
        afterSave.current = null;
        if (!halted.current) navigate?.();
      }
    }
  }
  function save(row: PriceReference) {
    const key = priceItemKey(row.item),
      text = drafts[key];
    if (text === undefined) return;
    let value: number | undefined;
    try {
      value = parseUnitPrice(text);
    } catch {
      return;
    }
    const job = { item: row.item, key, text, price: value ?? null };
    const waiting = queue.current.findIndex((entry) => entry.key === key);
    if (waiting < 0) queue.current.push(job);
    else queue.current[waiting] = job;
    if (!halted.current) void drain();
  }
  function requestPage(nextPage = page) {
    if (document.activeElement instanceof HTMLInputElement)
      document.activeElement.blur();
    const navigate = () => {
      pending.current = null;
      queue.current = [];
      halted.current = false;
      setFailed(false);
      setMessage("");
      if (nextPage === page) setRevision((n) => n + 1);
      else setPage(nextPage);
    };
    if (running.current) afterSave.current = navigate;
    else navigate();
  }
  return (
    <section
      className={css.prices}
      aria-label="Preços de referência"
      aria-busy={saving}
    >
      <div className={css.priceHeading}>
        <h3>Preços de referência</h3>
        <button
          disabled={saving}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => requestPage()}
        >
          Atualizar preços
        </button>
      </div>
      <p>
        Salvo ao sair do campo ou pressionar Enter. Valores já incorporados aos
        projetos não mudam. Zero é válido; campo vazio indica referência
        ausente.
      </p>
      <p>
        Esquadrias aparecem após o primeiro preço confirmado de uma combinação
        utilizada em projeto.
      </p>
      <div className={css.priceFeedback}>
        <span role="status">{saving ? "Salvando preços…" : message}</span>
      </div>
      {error && (
        <p role="alert" className={css.priceFailure}>
          {error}{" "}
          {failed && (
            <button disabled={saving} onClick={() => void drain()}>
              Tentar novamente
            </button>
          )}
        </p>
      )}
      {!data && !error && <p role="status">Consultando preços…</p>}
      {data &&
        ["bricks", "steel", "settlement", "openings"].map((group, index) => (
          <section key={group}>
            <h4>
              {
                [
                  "Tijolos · R$/unidade",
                  "Ferragens · R$/kg",
                  "Assentamento · R$/embalagem",
                  "Esquadrias · R$/unidade",
                ][index]
              }
            </h4>
            <ul className={css.priceGrid}>
              {data.references
                .filter((row) => row.item.group === group)
                .map((row, index) => {
                  const key = priceItemKey(row.item),
                    value = drafts[key] ?? priceText(row.price ?? undefined);
                  let invalid = "";
                  try {
                    parseUnitPrice(value);
                  } catch (e) {
                    invalid = (e as Error).message;
                  }
                  const id = `reference-price-${group}-${index}`,
                    errorId = `${id}-error`;
                  return (
                    <li key={key} className={css.priceItem}>
                      <label htmlFor={id}>{priceItemLabel(row.item)}</label>
                      <span className={css.priceControl}>
                        <input
                          id={id}
                          aria-label={`Referência de ${priceItemLabel(row.item)}`}
                          inputMode="decimal"
                          aria-invalid={!!invalid}
                          aria-describedby={invalid ? errorId : undefined}
                          placeholder="Não informado"
                          value={value}
                          onChange={(e) =>
                            setDrafts((previous) => ({
                              ...previous,
                              [key]: e.target.value,
                            }))
                          }
                          onBlur={() => save(row)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                          }}
                        />
                        {invalid && (
                          <span
                            id={errorId}
                            role="alert"
                            className={css.priceValidation}
                          >
                            {invalid}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
            </ul>
            {group === "openings" &&
              !data.references.some((row) => row.item.group === group) && (
                <p>Nenhuma esquadria cadastrada nesta página.</p>
              )}
          </section>
        ))}
      <div className={css.actions}>
        <button
          disabled={page === 1 || saving || failed}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => requestPage(page - 1)}
        >
          Anterior
        </button>
        <span className={css.pageIndicator}>Página {page} de esquadrias</span>
        <button
          disabled={!data?.hasMore || saving || failed}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => requestPage(page + 1)}
        >
          Próxima
        </button>
      </div>
    </section>
  );
}
