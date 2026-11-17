import { useState } from "react";
import { cm, display } from "../domain/project";
import { editFloor } from "../domain/floors";
import {
  clampCourses,
  clampCourseLimit,
  defaultClampSettings,
  intervalFromList,
  parseClampList,
  validateClampSettings,
  type ClampSettings,
} from "../domain/clamps";
import { useStore } from "../state/store";
import styles from "../ui/App.module.css";

export function FloorClamps() {
  const s = useStore(),
    doc = s.doc!,
    floor = doc.model.floors.find((f) => f.id === s.activeFloorId)!;
  const original = floor.clamps ?? defaultClampSettings(doc.project.base.width);
  const [enabled, setEnabled] = useState(original.enabled);
  const [diameter, setDiameter] = useState(
    String(original.diameter / 10).replace(".", ","),
  );
  const [length, setLength] = useState(display(original.length));
  const [mode, setMode] = useState(original.schedule.mode);
  const [list, setList] = useState(
    original.schedule.mode === "list"
      ? original.schedule.courses.join(", ")
      : "",
  );
  const [first, setFirst] = useState(
    original.schedule.mode === "interval"
      ? String(original.schedule.first)
      : "",
  );
  const [every, setEvery] = useState(
    original.schedule.mode === "interval"
      ? String(original.schedule.every)
      : "",
  );
  const [last, setLast] = useState(
    original.schedule.mode === "interval" ? String(original.schedule.last) : "",
  );
  const [error, setError] = useState("");
  const max = clampCourseLimit(doc, floor.id),
    m = doc.project.base.width;
  const blocked = s.busy || s.readonly || !!s.imageDraft;
  const settings = (): ClampSettings => {
    const value = diameter.trim().replace(",", ".");
    if (!/^\d+(\.\d)?$/.test(value))
      throw new Error("Use diâmetro em mm, com até uma casa decimal (0,1 mm).");
    const [whole, part = "0"] = value.split(".");
    if (
      mode === "interval" &&
      ![first, every, last].every((n) => /^\d+$/.test(n.trim()))
    )
      throw new Error(
        "Informe fiadas e intervalo como números inteiros positivos.",
      );
    const candidate: ClampSettings = {
      enabled,
      diameter: Number(whole) * 10 + Number(part),
      length: cm(length),
      schedule:
        mode === "list"
          ? { mode, courses: parseClampList(list) }
          : {
              mode,
              first: Number(first),
              every: Number(every),
              last: Number(last),
            },
    };
    validateClampSettings(candidate, m, doc.project.base.height);
    return candidate;
  };
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
  const changeMode = (value: "list" | "interval") => {
    setError("");
    try {
      const current = settings();
      if (value === "list")
        setList([...clampCourses(current.schedule)].join(", "));
      else {
        const interval = intervalFromList(parseClampList(list));
        if (interval.mode === "interval") {
          setFirst(String(interval.first));
          setEvery(String(interval.every));
          setLast(String(interval.last));
        }
      }
    } catch (e) {
      if (value === "interval") {
        setFirst("");
        setEvery("");
        setLast("");
      }
      setError((e as Error).message);
    }
    setMode(value);
  };
  return (
    <section
      className={styles.propertyGroup}
      aria-label="Grampos dos encontros"
    >
      <h3>Grampos dos encontros</h3>
      <form
        onChange={() => setError("")}
        onSubmit={async (e) => {
          e.preventDefault();
          if (blocked) return;
          try {
            const candidate = settings();
            const upper =
              candidate.schedule.mode === "list"
                ? (candidate.schedule.courses.at(-1) ?? 0)
                : candidate.schedule.last;
            if (candidate.enabled && (max < 1 || upper > max))
              throw new Error(
                `Escolha fiadas entre 1 e ${max}; use a altura das paredes existentes.`,
              );
            const state = useStore.getState();
            if (
              !state.doc ||
              state.doc.project.id !== doc.project.id ||
              state.activeFloorId !== floor.id ||
              state.busy ||
              state.readonly
            )
              return;
            setError("");
            if (JSON.stringify(candidate) !== JSON.stringify(floor.clamps))
              await state.commit(
                editFloor(state.doc, floor.id, { clamps: candidate }),
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
            Ativar grampos neste pavimento
          </label>
          <label className={styles.field}>
            Diâmetro do ferro (mm)
            <input
              inputMode="decimal"
              value={diameter}
              onChange={(e) => setDiameter(e.target.value)}
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
          {(error || invalid) && (
            <p className={styles.errorText} role="alert">
              {error || invalid}
            </p>
          )}
          <button type="submit">Aplicar grampos</button>
        </fieldset>
        {s.saved !== "saved" && s.saved !== "saving" && (
          <p className={styles.errorText} role="alert">
            Não salvo. {s.message} Use a recuperação de salvamento no aviso do
            projeto.
          </p>
        )}
      </form>
      <p className={styles.note}>
        Dimensões e distribuição nominais; não substituem o detalhamento
        estrutural. O total inclui as duas pontas e não é comprimento de
        corte/fabricação.
      </p>
    </section>
  );
}
