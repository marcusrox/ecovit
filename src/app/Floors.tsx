import { useEffect, useRef, useState } from "react";
import { addFloor, duplicateFloor, removeFloor } from "../domain/floors";
import { cm, display } from "../domain/project";
import { useStore } from "../state/store";
import { Icon } from "../ui/Icon";
import styles from "../ui/App.module.css";

export function FloorControls() {
  const s = useStore(),
    doc = s.doc!,
    floor = doc.model.floors.find((f) => f.id === s.activeFloorId)!;
  const [dialog, setDialog] = useState<"new" | "copy" | null>(null);
  const [name, setName] = useState(""),
    [level, setLevel] = useState(""),
    [height, setHeight] = useState("280");
  const [error, setError] = useState("");
  const opener = useRef<HTMLButtonElement | null>(null),
    form = useRef<HTMLFormElement>(null);
  const disabled = s.busy || s.readonly;
  const close = () => {
    setDialog(null);
    opener.current?.focus();
  };
  useEffect(() => {
    if (dialog) form.current?.querySelector("input")?.focus();
  }, [dialog]);
  const begin = (kind: "new" | "copy", button: HTMLButtonElement) => {
    opener.current = button;
    setDialog(kind);
    setName(kind === "copy" ? `${floor.name} (cópia)` : "Novo pavimento");
    setLevel("");
    setHeight(
      display(
        kind === "copy"
          ? floor.defaultHeight
          : (doc.project.initialWallHeight ?? 28000),
      ),
    );
    setError("");
  };
  return (
    <div className={styles.floorControls}>
      <label>
        Pavimento{" "}
        <select
          aria-label="Pavimento"
          value={floor.id}
          disabled={s.busy}
          onChange={(e) => s.switchFloor(e.target.value)}
        >
          {doc.model.floors.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} · {display(f.level)} cm
            </option>
          ))}
        </select>
      </label>
      <button
        disabled={disabled || doc.model.floors.length >= 4}
        className={styles.iconButton}
        aria-label="Novo pavimento"
        title="Novo pavimento"
        data-tooltip="Novo pavimento"
        onClick={(e) => begin("new", e.currentTarget)}
      >
        <Icon name="plus" />
      </button>
      <button
        disabled={disabled || doc.model.floors.length >= 4}
        className={styles.iconButton}
        aria-label="Duplicar pavimento"
        title="Duplicar pavimento"
        data-tooltip="Duplicar pavimento"
        onClick={(e) => begin("copy", e.currentTarget)}
      >
        <Icon name="copy" />
      </button>
      <button
        disabled={disabled || doc.model.floors.length === 1}
        className={styles.iconButton}
        aria-label="Excluir pavimento"
        title="Excluir pavimento"
        data-tooltip="Excluir pavimento"
        onClick={() => {
          if (
            window.confirm(
              `Excluir ${floor.name} e todos os seus elementos? A ação pode ser desfeita.`,
            )
          )
            void s.commit(removeFloor(doc, floor.id), "floor");
        }}
      >
        <Icon name="delete" />
      </button>
      <span>{doc.model.floors.length}/4</span>
      {dialog && (
        <div className={styles.modalBackdrop}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="floor-title"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                close();
              }
              if (e.key === "Tab") {
                const controls = Array.from(
                  form.current?.querySelectorAll<
                    HTMLInputElement | HTMLButtonElement
                  >("input,button") ?? [],
                ).filter((c) => !c.disabled);
                const first = controls[0],
                  last = controls.at(-1);
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            <h2 id="floor-title">
              {dialog === "new" ? "Novo pavimento" : "Duplicar pavimento"}
            </h2>
            <form
              ref={form}
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  const candidate =
                    dialog === "copy"
                      ? duplicateFloor(doc, floor.id, cm(level), name)
                      : addFloor(doc, {
                          name,
                          level: cm(level),
                          defaultHeight: cm(height),
                        });
                  void s.commit(candidate, "floor");
                  close();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <label className={styles.field}>
                Nome do pavimento
                <input
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                Cota do pavimento (cm)
                <input
                  required
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                />
              </label>
              {dialog === "new" && (
                <label className={styles.field}>
                  Altura de novas paredes (cm)
                  <input
                    required
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </label>
              )}
              {error && <p role="alert">{error}</p>}
              {level.trim() &&
                (() => {
                  try {
                    const n = cm(level),
                      h = doc.project.base.height;
                    if (!(n % h)) return null;
                    return (
                      <p>
                        Escolha uma cota modular:{" "}
                        {[Math.floor(n / h) * h, Math.ceil(n / h) * h].map(
                          (v) => (
                            <button
                              key={v}
                              type="button"
                              disabled={doc.model.floors.some(
                                (f) => f.level === v,
                              )}
                              onClick={() => setLevel(display(v))}
                            >
                              {display(v)} cm
                            </button>
                          ),
                        )}
                      </p>
                    );
                  } catch {
                    return null;
                  }
                })()}
              {dialog === "new" &&
                (() => {
                  try {
                    const n = cm(height),
                      h = doc.project.base.height;
                    if (!(n % h)) return null;
                    return (
                      <p>
                        Escolha uma altura modular:{" "}
                        {[Math.floor(n / h) * h, Math.ceil(n / h) * h]
                          .filter((v) => v > 0)
                          .map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setHeight(display(v))}
                            >
                              {display(v)} cm
                            </button>
                          ))}
                      </p>
                    );
                  } catch {
                    return null;
                  }
                })()}
              <button type="button" onClick={close}>
                Cancelar
              </button>
              <button className={styles.primary} type="submit">
                {dialog === "new" ? "Criar pavimento" : "Confirmar cópia"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
