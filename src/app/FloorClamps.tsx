import { useState } from "react";
import { display } from "../domain/project";
import {
  clampCourses,
  clampCourseLimit,
  intervalFromList,
  parseClampList,
} from "../domain/clamps";
import { useStore } from "../state/store";
import styles from "../ui/App.module.css";

import { parseClamps, type ClampsDraft } from "./floor-reinforcement-draft";
import { BarDiameterSelect } from "./BarDiameterSelect";
import { steelCatalog } from "../domain/steel-budget";

export function FloorClamps({
  draft,
  change,
  blocked,
  error,
}: {
  draft: ClampsDraft;
  change: (draft: ClampsDraft) => void;
  blocked: boolean;
  error?: string;
}) {
  const s = useStore(),
    doc = s.doc!,
    floor = doc.model.floors.find((f) => f.id === s.activeFloorId)!;
  const { enabled, diameter, length, mode, list, first, every, last } = draft;
  const setEnabled = (enabled: boolean) => change({ ...draft, enabled });
  const setDiameter = (diameter: string) => change({ ...draft, diameter });
  const setLength = (length: string) => change({ ...draft, length });
  const setList = (list: string) => change({ ...draft, list });
  const setFirst = (first: string) => change({ ...draft, first });
  const setEvery = (every: string) => change({ ...draft, every });
  const setLast = (last: string) => change({ ...draft, last });
  const [conversionError, setError] = useState("");
  const max = clampCourseLimit(doc, floor.id),
    m = doc.project.base.width;
  const settings = () => parseClamps(draft, doc);
  let preview = "",
    leg = "—",
    invalid = "";
  try {
    const candidate = settings();
    leg = display((candidate.length - m) / 2);
    const values: number[] = [];
    for (const n of clampCourses(candidate.schedule)) {
      values.push(n);
      if (values.length === 81) break;
    }
    preview = values.length
      ? values.slice(0, 80).join(", ") + (values.length > 80 ? ", …" : "")
      : "Nenhuma fiada selecionada";
  } catch (e) {
    invalid = (e as Error).message;
  }
  const changeMode = (mode: "list" | "interval") => {
    setError("");
    try {
      const current = settings();
      if (mode === "list")
        change({
          ...draft,
          mode,
          list: [...clampCourses(current.schedule)].join(", "),
        });
      else {
        const interval = intervalFromList(parseClampList(list));
        if (interval.mode === "interval")
          change({
            ...draft,
            mode,
            first: String(interval.first),
            every: String(interval.every),
            last: String(interval.last),
          });
      }
    } catch (e) {
      change({
        ...draft,
        mode,
        ...(mode === "interval" ? { first: "", every: "", last: "" } : {}),
      });
      setError((e as Error).message);
    }
  };
  return (
    <section
      className={styles.propertyGroup}
      aria-label="Grampos dos encontros"
    >
      <h3>Grampos dos encontros</h3>
      <p className={styles.note}>
        Aço para orçamento:{" "}
        {steelCatalog.find(
          (s) => s.diameter === Number(diameter.replace(",", ".")) * 10,
        )?.category ?? "bitola sem cadastro"}
        .
      </p>
      <div onChangeCapture={() => setError("")}>
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
            Ativar grampos neste pavimento
          </label>
          <label className={styles.field}>
            Diâmetro do ferro (mm)
            <BarDiameterSelect
              label="Diâmetro do ferro (mm)"
              options={["5", "6,3", "8"]}
              value={diameter}
              onChange={setDiameter}
            />
          </label>
          <label className={styles.field}>
            Comprimento nominal de cada grampo (cm)
            <input
              inputMode="decimal"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            />
          </label>
          <p className={styles.note}>
            Horizontal: {display(m)} cm + duas pontas de {leg} cm para baixo.
          </p>
          <label className={styles.field}>
            Programação dos grampos
            <select
              aria-label="Programação dos grampos"
              value={mode}
              onChange={(e) =>
                changeMode(e.target.value as "list" | "interval")
              }
            >
              <option value="list">Por lista</option>
              <option value="interval">Por intervalo</option>
            </select>
          </label>
          {mode === "list" ? (
            <label className={styles.field}>
              Fiadas dos grampos
              <input
                value={list}
                placeholder="Ex.: 5, 9, 13"
                onChange={(e) => setList(e.target.value)}
              />
            </label>
          ) : (
            <>
              <label className={styles.field}>
                Primeira fiada dos grampos
                <input
                  inputMode="numeric"
                  value={first}
                  onChange={(e) => setFirst(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                Repetir a cada (fiadas)
                <input
                  inputMode="numeric"
                  value={every}
                  onChange={(e) => setEvery(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                Última fiada dos grampos
                <input
                  inputMode="numeric"
                  value={last}
                  onChange={(e) => setLast(e.target.value)}
                />
              </label>
            </>
          )}
          <p className={styles.note}>
            Sobre as fiadas: {invalid ? "—" : preview}. Limite atual: {max}.
          </p>
          {(error || invalid || conversionError) && (
            <p className={styles.errorText} role="alert">
              {error || conversionError || invalid}
            </p>
          )}
        </fieldset>
      </div>
      <p className={styles.note}>
        Dimensões e distribuição nominais; não substituem o detalhamento
        estrutural. O total inclui as duas pontas e não é comprimento de
        corte/fabricação.
      </p>
    </section>
  );
}
