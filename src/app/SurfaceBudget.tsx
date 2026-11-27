import { useMemo, useState } from "react";
import type { Project } from "../domain/project";
import { display } from "../domain/project";
import { money, priceText, materialCosts } from "../domain/budget";
import { lossPercentText } from "../domain/quantities";
import {
  assignedAreaScale,
  settlementNumber,
} from "../domain/settlement-budget";
import {
  surfaceBudget,
  surfaceProducts,
  parseSurfaceField,
  type SurfaceErrors,
  type SurfaceField,
  type SurfaceKey,
  type SurfaceRow,
  type SurfaceConfig,
  isConcreteProduct,
  concreteAreaScale,
} from "../domain/surface-budget";
import { withProjectPrice } from "../domain/price-references";
import { useStore } from "../state/store";
import { ReferencePriceButton } from "./PriceReferences";
import { useBudgetConfirmation } from "./BudgetConfirmation";
import styles from "../ui/App.module.css";

export function useSurfaceBudget(
  doc: Project,
  open: boolean,
  busy: boolean,
  readonly: boolean,
  priceSaving: boolean,
  setPriceSaving: (value: boolean) => void,
) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const settings: Partial<Record<SurfaceKey, SurfaceConfig>> = {
    ...doc.project.surface,
  };
  const percentages: Record<string, number> = {};
  const errors: SurfaceErrors = {};
  const descriptionErrors: Partial<Record<SurfaceKey, string>> = {};
  for (const { key } of surfaceProducts) {
    settings[key] = { ...settings[key] };
    const description = drafts[`${key}:description`];
    if (description !== undefined) {
      if (description.trim().length > 160)
        descriptionErrors[key] =
          "Informe até 160 caracteres para produto e embalagem.";
      else settings[key]!.productDescription = description.trim();
    }
    for (const field of ["percent", "yield", "price"] as const) {
      if (field === "percent" && isConcreteProduct(key)) continue;
      const draft = drafts[`${key}:${field}`];
      if (draft === undefined) continue;
      try {
        const value = parseSurfaceField(field, draft);
        if (value === undefined) delete settings[key]![field];
        else settings[key]![field] = value;
        if (field === "price") {
          if (settings[key]!.productDescription === undefined)
            settings[key]!.productDescription =
              settings[key]!.referenceDescription;
          delete settings[key]!.referenceDescription;
        }
      } catch (e) {
        errors[key] = { ...errors[key], [field]: (e as Error).message };
      }
    }
    if (isConcreteProduct(key)) {
      const entries = key === "wallBase" ? doc.model.floors : doc.model.slabs;
      for (const entry of entries) {
        const field = `percent:${entry.id}` as const;
        const draft = drafts[`${key}:${field}`];
        if (draft === undefined) continue;
        try {
          percentages[entry.id] = parseSurfaceField("percent", draft) ?? 0;
        } catch (e) {
          errors[key] = { ...errors[key], [field]: (e as Error).message };
        }
      }
    }
  }
  const signature = JSON.stringify([settings, errors, percentages]);
  const report = useMemo(() => {
    const [surface, invalid, local] = JSON.parse(signature);
    return surfaceBudget(
      {
        ...doc,
        project: { ...doc.project, surface },
        model: {
          ...doc.model,
          floors: doc.model.floors.map((f) =>
            local[f.id] === undefined
              ? f
              : { ...f, waterproofingPercent: local[f.id] },
          ),
          slabs: doc.model.slabs.map((s) =>
            local[s.id] === undefined
              ? s
              : { ...s, waterproofingPercent: local[s.id] },
          ),
        },
      },
      !open || (busy && !priceSaving),
      invalid,
    );
  }, [doc, open, busy, priceSaving, signature]);
  const confirm = async (
    key: SurfaceKey,
    field: SurfaceField | "description",
    targetId?: string,
  ) => {
    const state = useStore.getState(),
      latest = state.doc;
    const id = `${key}:${field}${targetId ? `:${targetId}` : ""}`,
      draft = drafts[id];
    if (
      !latest ||
      latest.project.id !== doc.project.id ||
      state.busy ||
      state.readonly ||
      draft === undefined
    )
      return;
    if (field === "percent" && targetId && isConcreteProduct(key)) {
      let percent: number;
      try {
        percent = parseSurfaceField("percent", draft) ?? 0;
      } catch {
        return;
      }
      const collection = key === "wallBase" ? "floors" : "slabs";
      const entry = latest.model[collection].find((e) => e.id === targetId);
      if (!entry) return;
      if ((entry.waterproofingPercent ?? 0) !== percent) {
        const next = {
          ...latest,
          model: {
            ...latest.model,
            [collection]: latest.model[collection].map((e) =>
              e.id === targetId ? { ...e, waterproofingPercent: percent } : e,
            ),
          },
        };
        setPriceSaving(true);
        try {
          await state.commit(next, "budget");
        } finally {
          setPriceSaving(false);
        }
      }
      setDrafts((previous) => {
        if (previous[id] !== draft) return previous;
        const next = { ...previous };
        delete next[id];
        return next;
      });
      return;
    }
    if (field === "description") {
      if (draft.trim().length > 160) return;
      const description = draft.trim();
      const entry = latest.project.surface?.[key];
      if (
        description !==
        (entry?.productDescription ?? entry?.referenceDescription ?? "")
      ) {
        setPriceSaving(true);
        try {
          await state.commit(
            {
              ...latest,
              project: {
                ...latest.project,
                surface: {
                  ...latest.project.surface,
                  [key]: { ...entry, productDescription: description },
                },
              },
            },
            "budget",
          );
        } finally {
          setPriceSaving(false);
        }
      }
      setDrafts((previous) => {
        if (previous[id] !== draft) return previous;
        const next = { ...previous };
        delete next[id];
        return next;
      });
      return;
    }
    let value: number | undefined;
    try {
      value = parseSurfaceField(field, draft);
    } catch {
      return;
    }
    const current =
      (latest.project.surface?.[key] as SurfaceConfig | undefined)?.[field] ??
      (field === "percent" ? 0 : undefined);
    let next = latest;
    if (field === "price")
      next = withProjectPrice(latest, { group: "surface", key }, value);
    else if (current !== value) {
      const entry: SurfaceConfig = { ...latest.project.surface?.[key] };
      if (value === undefined) delete entry[field];
      else entry[field] = value;
      next = {
        ...latest,
        project: {
          ...latest.project,
          surface: { ...latest.project.surface, [key]: entry },
        },
      };
    }
    if (next !== latest) {
      setPriceSaving(true);
      try {
        await state.commit(next, "budget");
      } finally {
        setPriceSaving(false);
      }
    }
    setDrafts((previous) => {
      if (previous[id] !== draft) return previous;
      const next = { ...previous };
      delete next[id];
      return next;
    });
  };
  return {
    report,
    settings,
    errors,
    descriptionErrors,
    drafts,
    setDrafts,
    confirm,
    blocked: busy || readonly,
  };
}
type Model = ReturnType<typeof useSurfaceBudget>;
const areaText = (area: bigint | undefined, concrete = false) =>
  area === undefined
    ? "Indisponível"
    : `${settlementNumber(area, concrete ? concreteAreaScale : assignedAreaScale)} m²`;

export function SurfaceBudgetSummary({
  model: m,
  concrete = false,
}: {
  model: Model;
  concrete?: boolean;
}) {
  const trackConfirmation = useBudgetConfirmation();
  const { area } = m.report;
  const title = concrete
    ? "Impermeabilização de base de paredes e lajes"
    : "Impermeabilizante de superfície de paredes e rejunte";
  const products = surfaceProducts.filter(
    (p) => isConcreteProduct(p.key) === concrete,
  );
  return (
    <section
      className={styles.quantityGroup}
      aria-label={title}
      data-budget-section={concrete ? "concrete" : "surface"}
    >
      <h3 tabIndex={-1}>{title}</h3>
      {concrete ? (
        <p className={styles.note}>
          Base das paredes: faixa sobre o concreto abaixo da primeira fiada, com
          largura igual à espessura da parede mais 50%. Lajes: área líquida,
          descontadas aberturas, sem margem extra. Defina os percentuais abaixo;
          0% dispensa a aplicação. Os produtos são independentes da
          impermeabilização da superfície de paredes. Informe o rendimento por
          embalagem para o tratamento completo; não inclui mão de obra.
        </p>
      ) : (
        <>
          <p className={styles.note}>
            Área das duas faces das paredes, descontando portas, janelas e vãos.
            Os percentuais são independentes e estimados por você: 50% não
            seleciona automaticamente paredes externas. Informe o rendimento de
            uma embalagem para o tratamento completo, incluindo todas as demãos
            previstas. Não inclui instalação ou mão de obra.
          </p>
          <p>
            Área-base das duas faces:{" "}
            {area.available
              ? `${settlementNumber(area.net * 2n)} m²`
              : "Indisponível"}
            .
          </p>
          {!area.available && <p>{area.reason}</p>}
          {area.available && area.partial && (
            <p className={styles.errorText}>
              Estimativa parcial — há pendências geométricas.
            </p>
          )}
        </>
      )}
      <p className={styles.note}>
        Confira se preço e rendimento correspondem ao mesmo produto e embalagem.
        Você pode alterar o preço de referência conforme sua compra.
      </p>
      <div
        className={`${styles.quantityTable} ${styles.surfaceParameters}`}
        role="region"
        aria-label={`Parâmetros de ${title}`}
        tabIndex={0}
      >
        <table>
          <caption>{title} · parâmetros do projeto</caption>
          <thead>
            <tr>
              <th scope="col">Produto</th>
              <th scope="col">Produto e embalagem de referência</th>
              {!concrete && <th scope="col">Aplicação (%)</th>}
              <th scope="col">Rendimento (m²/embalagem)</th>
              <th scope="col">Preço (R$/embalagem)</th>
            </tr>
          </thead>
          <tbody>
            {products.map(({ key, label }) => (
              <tr key={key}>
                <th scope="row">{label}</th>
                <td>
                  <input
                    data-budget-target={`surface:${key}:description`}
                    className={styles.surfaceProductDescription}
                    aria-label={`Produto e embalagem de referência de ${label}`}
                    maxLength={160}
                    placeholder="Não informado"
                    value={
                      m.drafts[`${key}:description`] ??
                      m.settings[key]?.productDescription ??
                      m.settings[key]?.referenceDescription ??
                      ""
                    }
                    disabled={m.blocked}
                    aria-invalid={!!m.descriptionErrors[key]}
                    aria-describedby={
                      m.descriptionErrors[key]
                        ? `surface-description-error-${key}`
                        : undefined
                    }
                    onChange={(e) =>
                      m.setDrafts((previous) => ({
                        ...previous,
                        [`${key}:description`]: e.target.value,
                      }))
                    }
                    onBlur={() =>
                      trackConfirmation(m.confirm(key, "description"))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                  />
                  {m.descriptionErrors[key] && (
                    <span
                      id={`surface-description-error-${key}`}
                      role="alert"
                      className={styles.budgetPriceError}
                    >
                      {m.descriptionErrors[key]}
                    </span>
                  )}
                </td>
                {(["percent", "yield", "price"] as const)
                  .filter((field) => !concrete || field !== "percent")
                  .map((field) => {
                    const id = `${key}:${field}`,
                      error = m.errors[key]?.[field];
                    const value = m.settings[key]?.[field];
                    const text =
                      field === "percent"
                        ? lossPercentText(value ?? 0)
                        : field === "price"
                          ? priceText(value)
                          : value === undefined
                            ? ""
                            : settlementNumber(BigInt(value), 1000n);
                    const input = (
                      <input
                        data-budget-target={`surface:${id}`}
                        className={styles.budgetPrice}
                        aria-label={`${field === "percent" ? "Percentual de" : field === "yield" ? "Rendimento de" : "Preço de"} ${label} (${field === "percent" ? "%" : field === "yield" ? "m²/embalagem" : "R$/embalagem"})`}
                        inputMode="decimal"
                        placeholder="Não informado"
                        value={m.drafts[id] ?? text}
                        disabled={m.blocked}
                        aria-invalid={!!error}
                        aria-describedby={
                          error ? `surface-error-${key}-${field}` : undefined
                        }
                        onChange={(e) =>
                          m.setDrafts((previous) => ({
                            ...previous,
                            [id]: e.target.value,
                          }))
                        }
                        onBlur={() => trackConfirmation(m.confirm(key, field))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.currentTarget.blur();
                          }
                        }}
                      />
                    );
                    return (
                      <td key={field}>
                        {field === "price" ? (
                          <span className={styles.priceField}>
                            {input}
                            <ReferencePriceButton
                              item={{ group: "surface", key }}
                              clearDraft={() =>
                                m.setDrafts((previous) => {
                                  const next = { ...previous };
                                  delete next[id];
                                  delete next[`${key}:description`];
                                  delete next[`${key}:yield`];
                                  return next;
                                })
                              }
                            />
                          </span>
                        ) : (
                          input
                        )}
                        {error && (
                          <span
                            id={`surface-error-${key}-${field}`}
                            role="alert"
                            className={styles.budgetPriceError}
                          >
                            {error}
                          </span>
                        )}
                      </td>
                    );
                  })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {concrete && <ConcreteApplications model={m} />}
      <div
        className={styles.quantityTable}
        role="region"
        aria-label={`Compra de ${title}`}
        tabIndex={0}
      >
        <table>
          <caption>Compra consolidada do projeto</caption>
          <thead>
            <tr>
              <th scope="col">Produto</th>
              <th scope="col">Área de aplicação</th>
              <th scope="col">Embalagens para compra</th>
              <th scope="col">Custo (R$)</th>
            </tr>
          </thead>
          <tbody>
            {m.report.rows
              .filter((row) => isConcreteProduct(row.key) === concrete)
              .map((row) => (
                <tr key={row.key}>
                  <th scope="row">
                    {surfaceProducts.find((p) => p.key === row.key)!.label}
                  </th>
                  <td>{areaText(row.area, concrete)}</td>
                  <td>
                    {row.packages?.toLocaleString("pt-BR") ?? "Indisponível"}
                  </td>
                  <td>
                    {row.cost === undefined ? "Incompleto" : money(row.cost)}
                    {row.error && (
                      <span className={styles.budgetPriceError}>
                        {row.error}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {concrete && (
        <p>
          Subtotal de impermeabilização de base de paredes e lajes:{" "}
          {(() => {
            const total = materialCosts(
              m.report.rows
                .filter((r) => isConcreteProduct(r.key))
                .map((r) => r.cost),
            ).total;
            return total === undefined ? "Incompleto" : money(total);
          })()}
        </p>
      )}
    </section>
  );
}

export function SurfaceBudgetDetail({
  model: m,
  floorId,
  concrete = false,
}: {
  model: Model;
  floorId: string;
  concrete?: boolean;
}) {
  const floor = m.report.floors.find((f) => f.id === floorId);
  if (!floor) return null;
  const title = concrete
    ? "Impermeabilização de base de paredes e lajes"
    : "Impermeabilizante de superfície de paredes e rejunte";
  return (
    <section
      className={styles.quantityFloorDetail}
      aria-label={`${title} de ${floor.name} · ${display(floor.level)} cm`}
    >
      <h3>
        {title} · {floor.name} · {display(floor.level)} cm
      </h3>
      <p className={styles.note}>
        Custos rateados da compra global pela área de aplicação, incluindo
        sobras. Não representam compra independente por pavimento.
        {!concrete && m.report.partial
          ? " Estimativa parcial — há pendências geométricas."
          : ""}
      </p>
      <div
        className={styles.quantityTable}
        role="region"
        aria-label={`Rateio de ${title} de ${floor.name}`}
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th scope="col">Produto</th>
              <th scope="col">Área de aplicação</th>
              <th scope="col">Custo rateado (R$)</th>
            </tr>
          </thead>
          <tbody>
            {floor.rows
              .filter((row) => isConcreteProduct(row.key) === concrete)
              .map((row: SurfaceRow) => (
                <tr key={row.key}>
                  <th scope="row">
                    {surfaceProducts.find((p) => p.key === row.key)!.label}
                  </th>
                  <td>{areaText(row.area, concrete)}</td>
                  <td>
                    {row.cost === undefined ? "Incompleto" : money(row.cost)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ConcreteApplications({ model: m }: { model: Model }) {
  const track = useBudgetConfirmation();
  return (
    <div
      className={styles.quantityTable}
      role="region"
      aria-label="Aplicação nas bases das paredes e lajes"
      tabIndex={0}
    >
      <table>
        <caption>Aplicação por pavimento e por laje</caption>
        <thead>
          <tr>
            <th scope="col">Aplicação</th>
            <th scope="col">Pavimento / laje</th>
            <th scope="col">Área-base</th>
            <th scope="col">Aplicação (%)</th>
            <th scope="col">Área aplicada</th>
          </tr>
        </thead>
        <tbody>
          {m.report.applications.map((entry) => {
            const id = `${entry.key}:percent:${entry.id}`;
            const error = m.errors[entry.key]?.[`percent:${entry.id}`];
            return (
              <tr key={id}>
                <th scope="row">
                  {entry.key === "wallBase"
                    ? "Base das paredes"
                    : "Superfície da laje"}
                </th>
                <td>{entry.label}</td>
                <td>{areaText(entry.base, true)}</td>
                <td>
                  <input
                    className={styles.budgetPrice}
                    data-budget-target={`surface:${id}`}
                    aria-label={`${entry.key === "wallBase" ? "Paredes com base impermeabilizada" : "Área da laje impermeabilizada"} (%) · ${entry.label}`}
                    inputMode="decimal"
                    value={m.drafts[id] ?? lossPercentText(entry.percent)}
                    disabled={m.blocked}
                    aria-invalid={!!error}
                    aria-describedby={error ? `surface-error-${id}` : undefined}
                    onChange={(e) =>
                      m.setDrafts((previous) => ({
                        ...previous,
                        [id]: e.target.value,
                      }))
                    }
                    onBlur={() =>
                      track(m.confirm(entry.key, "percent", entry.id))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                  />
                  {error && (
                    <span
                      role="alert"
                      id={`surface-error-${id}`}
                      className={styles.budgetPriceError}
                    >
                      {error}
                    </span>
                  )}
                </td>
                <td>{areaText(entry.area, true)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!m.report.applications.some((e) => e.key === "slabs") && (
        <p>Este projeto não tem lajes.</p>
      )}
    </div>
  );
}
