import {
  groutInfo,
  parseGroutField,
  groutFieldText,
} from "../domain/grout-budget";
import { useEffect, useRef, useState } from "react";
import { api, getAccountScope, requestTime } from "../persistence/http";
import {
  priceItemKey,
  priceItemLabel,
  type PriceReference,
} from "../domain/price-references";
import { priceText, parseUnitPrice } from "../domain/budget";
import {
  referenceDescriptionSchema,
  parseSurfaceField,
} from "../domain/surface-budget";
import { settlementNumber } from "../domain/settlement-budget";
import css from "./Admin.module.css";

type PriceJob = {
  item: PriceReference["item"];
  key: string;
  text: string;
  price: number | null;
  description?: string;
  descriptionText?: string;
  yield?: number;
  yieldText?: string;
};
type PriceRequest = {
  job: PriceJob;
  input: {
    item: PriceReference["item"];
    price: number | null;
    expectedPrice: number | null;
    description?: string | null;
    expectedDescription?: string | null;
    yield?: number | null;
    expectedYield?: number | null;
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
  const [descriptionDrafts, setDescriptionDrafts] = useState<
    Record<string, string>
  >({});
  const [yieldDrafts, setYieldDrafts] = useState<Record<string, string>>({});
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
    setYieldDrafts((previous) => {
      if (previous[job.key] !== job.yieldText) return previous;
      const next = { ...previous };
      delete next[job.key];
      return next;
    });
    setDescriptionDrafts((previous) => {
      if (previous[job.key] !== job.descriptionText) return previous;
      const next = { ...previous };
      delete next[job.key];
      return next;
    });
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
          const expectedDescription =
            confirmed.current.get(job.key)?.description ?? null;
          const expectedYield = confirmed.current.get(job.key)?.yield ?? null;
          if (
            job.price === expectedPrice &&
            (job.description ?? null) === expectedDescription &&
            (job.yield ?? null) === expectedYield
          ) {
            clearDraft(job);
            continue;
          }
          pending.current = {
            job,
            input: {
              item: job.item,
              price: job.price,
              expectedPrice,
              ...(job.item.group === "surface"
                ? {
                    description: job.description ?? null,
                    expectedDescription,
                    yield: job.yield ?? null,
                    expectedYield,
                  }
                : {}),
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
        const updated: PriceReference = {
          item: request.job.item,
          price: request.job.price,
          ...(request.job.yield === undefined
            ? {}
            : { yield: request.job.yield }),
          ...(request.job.description === undefined
            ? {}
            : { description: request.job.description }),
        };
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
      text =
        drafts[key] ??
        (row.item.group === "grout"
          ? groutFieldText(row.item.key, row.price ?? undefined)
          : priceText(row.price ?? undefined));
    if (
      drafts[key] === undefined &&
      descriptionDrafts[key] === undefined &&
      yieldDrafts[key] === undefined
    )
      return;
    let value: number | undefined;
    let description: string | undefined;
    const descriptionText = descriptionDrafts[key] ?? row.description ?? "";
    const yieldText =
      yieldDrafts[key] ??
      (row.yield === undefined
        ? ""
        : settlementNumber(BigInt(row.yield), 1000n));
    let referenceYield: number | undefined;
    try {
      value =
        row.item.group === "grout"
          ? parseGroutField(row.item.key, text)
          : parseUnitPrice(text);
      // A new description without a price remains a draft until the pair is complete.
      if (
        row.item.group === "surface" &&
        value === undefined &&
        drafts[key] === undefined
      )
        return;
      if (row.item.group === "surface" && value !== undefined) {
        description = referenceDescriptionSchema.parse(descriptionText);
        referenceYield = parseSurfaceField("yield", yieldText);
        if (referenceYield === undefined) return;
      }
    } catch {
      return;
    }
    const job: PriceJob = {
      item: row.item,
      key,
      text,
      price: value ?? null,
      description,
      descriptionText,
      yield: referenceYield,
      yieldText,
    };
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
        Salvo ao sair do campo ou pressionar Enter. Para impermeabilizantes e
        rejunte, confirme produto, embalagem, rendimento e preço juntos. Valores
        já incorporados aos projetos não mudam. Zero é válido para preços e
        perdas; consumos devem ser positivos; campo vazio indica referência
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
        ["bricks", "steel", "settlement", "openings", "surface", "grout"].map(
          (group, index) => (
            <section key={group}>
              <h4>
                {
                  [
                    "Tijolos · R$/unidade",
                    "Ferragens · R$/kg",
                    "Assentamento · R$/embalagem",
                    "Esquadrias · Preço do conjunto (R$/un.)",
                    "Impermeabilizantes e rejunte · R$/embalagem",
                    "Graute de preenchimento — microconcreto",
                  ][index]
                }
              </h4>
              {group === "openings" && (
                <p>
                  Informe a referência por conjunto completo: para portas de
                  madeira, inclua folha, batente, guarnições e ferragens
                  previstas; para as demais portas e janelas, inclua marco,
                  folhas, ferragens e vidro, quando aplicáveis. Não inclua
                  instalação.
                </p>
              )}
              {group === "surface" && (
                <p>
                  Identifique o produto e a embalagem de referência. Preencha a
                  descrição, o rendimento em m² por embalagem para o tratamento
                  completo e o preço; as alterações são salvas ao sair do campo
                  ou por Enter quando o conjunto estiver completo. Referências
                  antigas sem rendimento precisam ser completadas. O usuário
                  poderá ajustar os valores no projeto.
                </p>
              )}
              {group === "grout" && (
                <p>
                  {groutInfo} Os consumos são base, sem perdas embutidas; cada
                  percentual é aplicado uma única vez à aplicação
                  correspondente.
                </p>
              )}
              <ul className={css.priceGrid}>
                {data.references
                  .filter((row) => row.item.group === group)
                  .map((row, index) => {
                    const key = priceItemKey(row.item),
                      value =
                        drafts[key] ??
                        (row.item.group === "grout"
                          ? groutFieldText(row.item.key, row.price ?? undefined)
                          : priceText(row.price ?? undefined));
                    let invalid = "",
                      descriptionError = "",
                      yieldError = "";
                    const description =
                      descriptionDrafts[key] ?? row.description ?? "";
                    const yieldText =
                      yieldDrafts[key] ??
                      (row.yield === undefined
                        ? ""
                        : settlementNumber(BigInt(row.yield), 1000n));
                    try {
                      if (row.item.group === "grout")
                        parseGroutField(row.item.key, value);
                      else parseUnitPrice(value);
                    } catch (e) {
                      invalid = (e as Error).message;
                    }
                    if (group === "surface") {
                      const hasPrice = value.trim() !== "";
                      if (
                        (hasPrice || description.trim()) &&
                        !referenceDescriptionSchema.safeParse(description)
                          .success
                      )
                        descriptionError =
                          "Informe o produto e a embalagem de referência (até 160 caracteres).";
                      if (hasPrice || yieldText.trim()) {
                        try {
                          if (
                            parseSurfaceField("yield", yieldText) === undefined
                          )
                            yieldError =
                              "Informe o rendimento em m² por embalagem para completar a referência.";
                        } catch (e) {
                          yieldError = (e as Error).message;
                        }
                      }
                    }
                    const id = `reference-price-${group}-${index}`,
                      errorId = `${id}-error`;
                    return (
                      <li
                        key={key}
                        className={`${css.priceItem} ${group === "surface" ? css.surfacePriceItem : ""}`}
                      >
                        <label htmlFor={id}>{priceItemLabel(row.item)}</label>
                        {group === "surface" && (
                          <label>
                            Produto e embalagem de referência
                            <input
                              aria-label={`Produto e embalagem de referência de ${priceItemLabel(row.item)}`}
                              maxLength={160}
                              value={description}
                              onChange={(e) =>
                                setDescriptionDrafts((previous) => ({
                                  ...previous,
                                  [key]: e.target.value,
                                }))
                              }
                              aria-invalid={!!descriptionError}
                              aria-describedby={
                                descriptionError
                                  ? `${id}-description-error`
                                  : undefined
                              }
                              onBlur={() => save(row)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  e.currentTarget.blur();
                                }
                              }}
                            />
                            {descriptionError && (
                              <span
                                id={`${id}-description-error`}
                                role="alert"
                                className={css.fieldValidation}
                              >
                                {descriptionError}
                              </span>
                            )}
                          </label>
                        )}
                        {group === "surface" && (
                          <label>
                            Rendimento (m²/embalagem)
                            <input
                              aria-label={`Rendimento de referência de ${priceItemLabel(row.item)} (m²/embalagem)`}
                              inputMode="decimal"
                              placeholder="Não informado"
                              value={yieldText}
                              aria-invalid={!!yieldError}
                              aria-describedby={
                                yieldError ? `${id}-yield-error` : undefined
                              }
                              onChange={(e) =>
                                setYieldDrafts((previous) => ({
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
                            {yieldError && (
                              <span
                                id={`${id}-yield-error`}
                                role="alert"
                                className={css.fieldValidation}
                              >
                                {yieldError}
                              </span>
                            )}
                          </label>
                        )}
                        <span className={css.priceControl}>
                          {group === "surface" && (
                            <label htmlFor={id}>Preço</label>
                          )}
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
                              className={
                                group === "surface"
                                  ? css.fieldValidation
                                  : css.priceValidation
                              }
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
          ),
        )}
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
