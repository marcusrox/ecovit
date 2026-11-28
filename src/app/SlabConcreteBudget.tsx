import { useContext, useState } from "react";
import { display, type Project } from "../domain/project";
import { money } from "../domain/budget";
import {
  concreteClasses,
  concreteFields,
  concreteLabels,
  concreteFieldText,
  parseConcreteField,
  slabConcreteBudget,
  withSlabConcrete,
  withConcretePrice,
  slabAreaScale,
  concreteVolumeScale,
  type ConcreteErrors,
  type ConcreteField,
} from "../domain/slab-concrete-budget";
import { useStore } from "../state/store";
import {
  BudgetReferenceContext,
  ReferencePriceButton,
} from "./PriceReferences";
import { useBudgetConfirmation } from "./BudgetConfirmation";
import styles from "../ui/App.module.css";

export function useSlabConcreteBudget(
  doc: Project,
  busy: boolean,
  readonly: boolean,
  priceSaving: boolean,
  setPriceSaving: (v: boolean) => void,
) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const errors: ConcreteErrors = {};
  const preview = {
    ...doc,
    model: {
      ...doc.model,
      slabs: doc.model.slabs.map((s) => {
        const config = { ...s.concrete };
        for (const key of ["consumption", "loss", "price"] as const) {
          const draft = drafts[`${s.id}:${key}`];
          if (draft === undefined) continue;
          try {
            const value = parseConcreteField(key, draft);
            if (value === undefined) delete config[key];
            else config[key] = value;
            if (key === "price")
              config.source = value === undefined ? "cleared" : "own";
          } catch (e) {
            (errors[s.id] ??= {})[key] = (e as Error).message;
          }
        }
        return { ...s, concrete: config };
      }),
    },
  };
  const clearDraft = (id: string, key: ConcreteField, expected?: string) =>
    setDrafts((previous) => {
      const target = `${id}:${key}`;
      if (expected !== undefined && previous[target] !== expected)
        return previous;
      const next = { ...previous };
      delete next[target];
      return next;
    });
  async function confirm(id: string, key: Exclude<ConcreteField, "class">) {
    const state = useStore.getState(),
      latest = state.doc,
      draft = drafts[`${id}:${key}`];
    if (
      !latest ||
      latest.project.id !== doc.project.id ||
      state.busy ||
      state.readonly ||
      draft === undefined
    )
      return;
    const slab = latest.model.slabs.find((s) => s.id === id);
    if (!slab) return;
    let value: number | undefined;
    try {
      value = parseConcreteField(key, draft);
    } catch {
      return;
    }
    let next: Project;
    if (key === "price") next = withConcretePrice(latest, id, value);
    else {
      const config = { ...slab.concrete };
      if (value === undefined) delete config[key];
      else config[key] = value;
      next = withSlabConcrete(latest, id, config);
    }
    if (next !== latest) {
      setPriceSaving(true);
      try {
        await state.commit(next, "budget");
      } finally {
        setPriceSaving(false);
      }
    }
    clearDraft(id, key, draft);
  }
  return {
    report: slabConcreteBudget(preview, busy && !priceSaving, errors),
    drafts,
    setDrafts,
    clearDraft,
    confirm,
    blocked: busy || readonly,
  };
}

const types = {
  solid: "Maciça",
  "lattice-clay": "Treliçada com lajota",
  "lattice-eps": "Treliçada com EPS",
  "hollow-core": "Alveolar",
};
const number = (n: bigint | undefined, scale: bigint, decimals?: number) => {
  if (n === undefined) return "Indisponível";
  if (decimals !== undefined) {
    const factor = 10n ** BigInt(decimals),
      rounded = (n * factor + scale / 2n) / scale;
    return `${(rounded / factor).toLocaleString("pt-BR")},${String(rounded % factor).padStart(decimals, "0")}`;
  }
  const digits = String(scale).length,
    factor = 10n ** BigInt(digits);
  const fraction = String(((n % scale) * factor) / scale)
    .padStart(digits, "0")
    .replace(/0+$/, "");
  return (n / scale).toLocaleString("pt-BR") + (fraction ? "," + fraction : "");
};
export function SlabConcreteBudget({
  model: m,
}: {
  model: ReturnType<typeof useSlabConcreteBudget>;
}) {
  const references = useContext(BudgetReferenceContext),
    track = useBudgetConfirmation();
  return (
    <section
      className={styles.quantityGroup}
      data-budget-section="slabConcrete"
      aria-label="Concreto das lajes"
    >
      <h3 tabIndex={-1}>Concreto</h3>
      <p className={styles.note}>
        Informe consumo e perdas por laje. O consumo deve incluir todo o
        concreto aplicado na obra, inclusive capa e nervuras quando aplicável.
        Na alveolar, não inclui automaticamente o concreto dos painéis
        adquiridos. Tipo e espessura não determinam o volume; a classe FCK é uma
        escolha orçamentária, sem dimensionamento estrutural.
      </p>
      {m.report.rows.length === 0 ? (
        <p>Não há lajes no projeto.</p>
      ) : (
        <div
          className={`${styles.quantityTable} ${styles.slabConcreteTable}`}
          role="region"
          aria-label="Concreto por laje"
          tabIndex={0}
        >
          <table>
            <caption>Concreto · lajes do projeto</caption>
            <thead>
              <tr>
                <th>Pavimento / tipo de laje</th>
                <th>Área líquida (m²)</th>
                {concreteFields.map((key) => (
                  <th key={key}>{concreteLabels[key]}</th>
                ))}
                <th>Volume base (m³)</th>
                <th>Volume estimado (m³)</th>
                <th>Custo estimado (R$)</th>
              </tr>
            </thead>
            <tbody>
              {m.report.rows.map((r) => (
                <tr key={r.slab.id}>
                  <th scope="row">
                    {r.name} · {display(r.level)} cm
                    <br />
                    {r.slab.construction
                      ? types[r.slab.construction.type]
                      : "Tipo não informado"}
                  </th>
                  <td>{number(r.area, slabAreaScale, 2)}</td>
                  {concreteFields.map((key) => {
                    const target = `${r.slab.id}:${key}`,
                      id = `slabConcrete-${target}`,
                      error = r.errors[key],
                      label = `${concreteLabels[key]} · ${r.name}`;
                    return (
                      <td key={key}>
                        {key === "class" ? (
                          <select
                            id={id}
                            aria-label={label}
                            data-budget-target={`slabConcrete:${target}`}
                            disabled={
                              m.blocked || !references || references.blocked
                            }
                            value={r.slab.concrete?.class ?? ""}
                            aria-invalid={!!error}
                            aria-describedby={error ? `${id}-error` : undefined}
                            onChange={(e) =>
                              track(
                                references!.changeConcreteClass(
                                  r.slab.id,
                                  (e.target.value || undefined) as
                                    "30" | "40" | "50" | undefined,
                                ),
                              )
                            }
                          >
                            <option value="">Não informada</option>
                            {concreteClasses.map((c) => (
                              <option key={c} value={c}>
                                FCK {c} MPa
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={styles.groutValue}>
                            <input
                              id={id}
                              aria-label={label}
                              data-budget-target={`slabConcrete:${target}`}
                              inputMode="decimal"
                              placeholder="Não informado"
                              disabled={m.blocked}
                              value={
                                m.drafts[target] ??
                                (key === "consumption" &&
                                r.slab.concrete?.consumption !== undefined
                                  ? number(
                                      BigInt(r.slab.concrete.consumption),
                                      1000n,
                                      2,
                                    ).replaceAll(".", "")
                                  : concreteFieldText(
                                      key,
                                      r.slab.concrete?.[key],
                                    ))
                              }
                              aria-invalid={!!error}
                              aria-describedby={
                                error ? `${id}-error` : undefined
                              }
                              onChange={(e) =>
                                m.setDrafts((previous) => ({
                                  ...previous,
                                  [target]: e.target.value,
                                }))
                              }
                              onBlur={() => track(m.confirm(r.slab.id, key))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  e.currentTarget.blur();
                                }
                              }}
                            />
                            {key === "price" && r.slab.concrete?.class && (
                              <ReferencePriceButton
                                item={{
                                  group: "concrete",
                                  key: r.slab.concrete.class,
                                }}
                                slabId={r.slab.id}
                                clearDraft={() => m.clearDraft(r.slab.id, key)}
                              />
                            )}
                          </span>
                        )}
                        {error && (
                          <span id={`${id}-error`} className={styles.errorText}>
                            {error}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td>{number(r.base, concreteVolumeScale, 2)}</td>
                  <td>
                    {number(r.estimated, concreteVolumeScale, 2)}
                    {r.error && (
                      <span className={styles.errorText}> · {r.error}</span>
                    )}
                  </td>
                  <td>{r.cost === undefined ? "Incompleto" : money(r.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p>
        Volume estimado total:{" "}
        <strong>{number(m.report.total, concreteVolumeScale, 2)} m³</strong>.
        Subtotal de concreto:{" "}
        <strong>
          {m.report.cost === undefined ? "Incompleto" : money(m.report.cost)}
        </strong>
        .
      </p>
      {m.report.rows.length > 0 && (
        <ul>
          {m.report.groups.map((g) => (
            <li key={g.key ?? "none"}>
              {g.key ? `FCK ${g.key} MPa` : "Sem classe"}:{" "}
              {number(g.volume, concreteVolumeScale, 2)} m³
            </li>
          ))}
        </ul>
      )}
      {m.report.error && <p className={styles.errorText}>{m.report.error}</p>}
    </section>
  );
}
