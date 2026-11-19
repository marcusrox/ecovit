import { useMemo, useState } from "react";
import { display, type Project } from "../domain/project";
import {
  steelCatalog,
  steelCosts,
  steelQuantities,
  steelLabel,
  steelNumber,
  steelWeight,
  steelApplicationLabels,
  type SteelKey,
  type SteelReport,
  type SteelQuantity,
} from "../domain/steel-budget";
import { money, parseUnitPrice, priceText } from "../domain/budget";
import { useStore } from "../state/store";
import styles from "../ui/App.module.css";

export function useSteelBudget(
  doc: Project,
  open: boolean,
  busy: boolean,
  readonly: boolean,
  priceSaving: boolean,
  setPriceSaving: (saving: boolean) => void,
) {
  const [drafts, setDrafts] = useState<Partial<Record<SteelKey, string>>>({});
  const report: SteelReport = useMemo(() => {
    if (!open) return { available: false, reason: "" };
    try {
      return steelQuantities(doc, busy && !priceSaving);
    } catch (e) {
      return { available: false, reason: (e as Error).message };
    }
  }, [doc, open, busy, priceSaving]);
  const errors: Partial<Record<SteelKey, string>> = {},
    prices = { ...doc.project.steelPrices };
  for (const s of steelCatalog)
    if (drafts[s.key] !== undefined) {
      try {
        const value = parseUnitPrice(drafts[s.key]!);
        if (value === undefined) delete prices[s.key];
        else prices[s.key] = value;
      } catch (e) {
        errors[s.key] = (e as Error).message;
      }
    }
  const costs = steelCosts(report, prices, errors);
  const confirm = async (key: SteelKey) => {
    const state = useStore.getState(),
      latest = state.doc;
    if (
      !latest ||
      latest.project.id !== doc.project.id ||
      state.busy ||
      state.readonly ||
      drafts[key] === undefined
    )
      return;
    let value: number | undefined;
    try {
      value = parseUnitPrice(drafts[key]!);
    } catch {
      return;
    }
    if (value !== latest.project.steelPrices?.[key]) {
      const next = { ...latest.project.steelPrices };
      if (value === undefined) delete next[key];
      else next[key] = value;
      const { steelPrices, ...project } = latest.project;
      void steelPrices;
      setPriceSaving(true);
      try {
        await state.commit(
          {
            ...latest,
            project: {
              ...project,
              ...(Object.keys(next).length ? { steelPrices: next } : {}),
            },
          },
          "budget",
        );
      } finally {
        setPriceSaving(false);
      }
    }
    setDrafts((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };
  return {
    report,
    costs,
    prices,
    errors,
    drafts,
    setDrafts,
    confirm,
    blocked: busy || readonly,
  };
}
type Model = ReturnType<typeof useSteelBudget>;
function Measures({ row }: { row?: SteelQuantity }) {
  return (
    <>
      <td>{row ? steelNumber(row.base) : "—"}</td>
      <td>{row ? steelNumber(row.extra) : "—"}</td>
      <td>{row ? steelNumber(row.estimated) : "—"}</td>
      <td>{row?.weight !== undefined ? steelWeight(row.weight) : "—"}</td>
    </>
  );
}

export function SteelBudgetSummary({
  model: m,
  brickTotal,
  brickPartial,
}: {
  model: Model;
  brickTotal?: number;
  brickPartial: boolean;
}) {
  const { report, costs } = m;
  const rows = report.available
    ? report.rows
    : steelCatalog.map((s) => ({ key: s.key, diameter: s.diameter }));
  const partial = brickPartial || (report.available && report.partial);
  let total: number | undefined,
    totalError = "";
  if (brickTotal !== undefined && costs.total !== undefined) {
    const sum = BigInt(brickTotal) + BigInt(costs.total);
    if (sum > BigInt(Number.MAX_SAFE_INTEGER))
      totalError = "Total dos materiais fora da representação numérica segura.";
    else total = Number(sum);
  }
  return (
    <section className={styles.quantityGroup} aria-label="Ferragens do projeto">
      <h3>Ferragens do projeto</h3>
      {!report.available ? (
        <p>{report.reason}</p>
      ) : (
        report.partial && (
          <p className={styles.errorText}>
            Ferragens parciais — há pendências. Itens não gerados não entram na
            estimativa.
          </p>
        )
      )}
      <p className={styles.note}>
        Massas nominais de catálogo Gerdau. Comprimentos (m) e pesos (kg)
        apresentados com até três casas decimais; custos calculados antes desse
        arredondamento. Preços em R$/kg ficam salvos no projeto.
      </p>
      <div
        className={styles.quantityTable}
        role="region"
        aria-label="Tabela de ferragens"
        tabIndex={0}
      >
        <table>
          <caption>Ferragens consolidadas do projeto</caption>
          <thead>
            <tr>
              <th scope="col">Aço / bitola</th>
              <th scope="col">Base (m)</th>
              <th scope="col">Adicional (m)</th>
              <th scope="col">Estimado (m)</th>
              <th scope="col">Peso (kg)</th>
              <th scope="col">Preço (R$/kg)</th>
              <th scope="col">Custo (R$)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const row = report.available
                ? (item as SteelQuantity)
                : undefined;
              const known = steelCatalog.find((s) => s.key === item.key),
                key = item.key as SteelKey;
              return (
                <tr key={key} data-steel-key={key}>
                  <th scope="row">{steelLabel(item)}</th>
                  <Measures row={row} />
                  <td>
                    {known ? (
                      <>
                        <input
                          className={styles.budgetPrice}
                          aria-label={`Preço por kg de ${steelLabel(item)}`}
                          aria-invalid={!!m.errors[key]}
                          aria-describedby={
                            m.errors[key] ? `steel-price-${key}` : undefined
                          }
                          inputMode="decimal"
                          placeholder="Não informado"
                          disabled={m.blocked}
                          value={m.drafts[key] ?? priceText(m.prices[key])}
                          onChange={(e) =>
                            m.setDrafts((previous) => ({
                              ...previous,
                              [key]: e.target.value,
                            }))
                          }
                          onBlur={() => void m.confirm(key)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                          }}
                        />
                        {m.errors[key] && (
                          <span
                            id={`steel-price-${key}`}
                            role="alert"
                            className={styles.budgetPriceError}
                          >
                            {m.errors[key]}
                          </span>
                        )}
                      </>
                    ) : (
                      "Sem cadastro"
                    )}
                  </td>
                  <td>
                    {costs.costs[key] !== undefined
                      ? money(costs.costs[key]!)
                      : "—"}
                    {costs.errors[key] && (
                      <span className={styles.budgetPriceError}>
                        {costs.errors[key]}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {costs.error && <p role="alert">{costs.error}</p>}
      <dl className={styles.materialTotals} aria-label="Totais dos materiais">
        <div>
          <dt>Subtotal de tijolos{brickPartial ? " · parcial" : ""}</dt>
          <dd>
            {brickTotal !== undefined ? money(brickTotal) : "Indisponível"}
          </dd>
        </div>
        <div>
          <dt>
            Subtotal de ferragens
            {report.available && report.partial ? " · parcial" : ""}
          </dt>
          <dd>
            {costs.total !== undefined ? money(costs.total) : "Indisponível"}
          </dd>
        </div>
        <div>
          <dt>
            Total dos materiais orçados (tijolos + ferragens)
            {partial ? " · parcial" : ""}
          </dt>
          <dd>{total !== undefined ? money(total) : "Indisponível"}</dd>
        </div>
      </dl>
      {totalError && <p role="alert">{totalError}</p>}
      {total === undefined && (
        <p className={styles.note}>
          O total depende de quantitativos disponíveis, massas cadastradas,
          perdas de tijolos válidas e preços informados para os materiais
          utilizados. Preço zero é diferente de preço ausente.
        </p>
      )}
    </section>
  );
}

export function SteelBudgetDetail({
  model: m,
  floorId,
}: {
  model: Model;
  floorId: string;
}) {
  const floor = m.report.available
    ? m.report.floors.find((f) => f.id === floorId)
    : undefined;
  if (!floor) return null;
  return (
    <section
      className={styles.quantityFloorDetail}
      aria-label="Ferragens do pavimento consultado"
    >
      <h3>
        Ferragens · {floor.name} · {display(floor.level)} cm
        {floor.partial ? " · Parcial" : ""}
      </h3>
      <p className={styles.note}>
        Trecho útil: {display(floor.settings.usefulLength)} cm; sobreposição:{" "}
        {display(floor.settings.overlapLength)} cm; acréscimo horizontal:{" "}
        {steelNumber(BigInt(floor.settings.horizontalExtra), 100n)}%. Sem
        arranques entre pavimentos. Grampos já incluem as pontas.
      </p>
      {floor.details.length ? (
        <div
          className={styles.quantityTable}
          role="region"
          aria-label="Ferragens por aplicação"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Aplicação</th>
                <th scope="col">Aço / bitola</th>
                <th scope="col">Base (m)</th>
                <th scope="col">Adicional (m)</th>
                <th scope="col">Estimado (m)</th>
                <th scope="col">Peso (kg)</th>
                <th scope="col">Preço de referência (R$/kg)</th>
              </tr>
            </thead>
            <tbody>
              {floor.details.map((row) => (
                <tr key={`${row.application}:${row.key}`}>
                  <th scope="row">{steelApplicationLabels[row.application]}</th>
                  <td>
                    {steelLabel(row)}
                    {row.error && (
                      <span className={styles.budgetPriceError}>
                        {row.error}
                      </span>
                    )}
                  </td>
                  <Measures row={row} />
                  <td>
                    {m.errors[row.key as SteelKey]
                      ? "Inválido"
                      : m.prices[row.key as SteelKey] !== undefined
                        ? money(m.prices[row.key as SteelKey]!)
                        : "Não informado"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Sem ferragens elegíveis neste pavimento.</p>
      )}
      {floor.pending.length > 0 && (
        <>
          <h4>Pendências de ferragens</h4>
          <ul>
            {floor.pending.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
