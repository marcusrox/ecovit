import { useEffect, useMemo, useRef, useState } from "react";
import { display, type Project } from "../domain/project";
import {
  projectAreas,
  type RoomArea,
  type UsefulArea,
} from "../domain/project-areas";
import { roomAreaText, type ConstructedArea } from "../domain/rooms";
import { useStore } from "../state/store";
import { Icon } from "../ui/Icon";
import styles from "../ui/App.module.css";

function Useful({ value }: { value: UsefulArea }) {
  return (
    <>
      <span>
        {value.count === 0
          ? "Nenhum ambiente identificado."
          : value.area === null
            ? "—"
            : roomAreaText(value.area)}
      </span>
      {value.review > 0 && (
        <small className={styles.areaPending}>
          {value.area !== null && "Parcial · "}
          {value.review}{" "}
          {value.review === 1 ? "ambiente a revisar" : "ambientes a revisar"}
        </small>
      )}
    </>
  );
}
function Constructed({ value }: { value: ConstructedArea }) {
  return (
    <>
      <span>
        {value.area === null ? "Não determinada" : roomAreaText(value.area)}
      </span>
      {value.pending && value.area !== null && (
        <small className={styles.areaPending}>Parcial</small>
      )}
    </>
  );
}

export function Areas({
  doc,
  selectTool,
}: {
  doc: Project;
  selectTool: () => void;
}) {
  const busy = useStore((s) => s.busy);
  const imageDraft = useStore((s) => s.imageDraft);
  const [open, setOpen] = useState(false);
  const [floorId, setFloorId] = useState("all");
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const report = useMemo(() => (open ? projectAreas(doc) : null), [open, doc]);
  useEffect(() => {
    const node = dialog.current!;
    if (open) {
      node.showModal();
      heading.current?.focus();
    } else if (node.open) {
      node.close();
      trigger.current?.focus();
    }
  }, [open]);
  const floors =
    report?.floors.filter((f) => floorId === "all" || f.floor.id === floorId) ??
    [];
  const locate = ({ label, region }: RoomArea) => {
    if (useStore.getState().busy) return;
    selectTool();
    const state = useStore.getState();
    state.switchFloor(label.floorId);
    state.choose(label.id);
    const points = region?.contour;
    const minX = points
      ? Math.min(...points.map((p) => p.x))
      : label.position.x;
    const maxX = points
      ? Math.max(...points.map((p) => p.x))
      : label.position.x;
    const minY = points
      ? Math.min(...points.map((p) => p.y))
      : label.position.y;
    const maxY = points
      ? Math.max(...points.map((p) => p.y))
      : label.position.y;
    state.inspect({
      mode: "plan",
      focus: {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
        ...(points ? { width: maxX - minX, height: maxY - minY } : {}),
      },
    });
    setOpen(false);
  };
  return (
    <>
      <button
        ref={trigger}
        className={styles.iconText}
        disabled={busy || !!imageDraft}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          window.dispatchEvent(new Event("blur"));
          useStore.getState().inspect({
            slabDraft: null,
            slabEditing: false,
            pendingOpening: null,
            preview: null,
            groutCell: null,
          });
          setFloorId("all");
          setOpen(true);
        }}
      >
        <Icon name="areas" /> Áreas
      </button>
      <dialog
        ref={dialog}
        className={`${styles.releasePage} ${styles.quantityScreen}`}
        aria-labelledby="areas-title"
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
      >
        <div className={styles.quantityActions}>
          <button className={styles.iconText} onClick={() => setOpen(false)}>
            <Icon name="left" /> Voltar ao desenho
          </button>
        </div>
        <div className={styles.quantityContent}>
          <header className={styles.quantityMasthead}>
            <h1
              ref={heading}
              tabIndex={-1}
              id="areas-title"
              className={styles.quantityEyebrow}
            >
              Áreas do projeto
            </h1>
            <h2>{doc.project.name}</h2>
            <p className={styles.note}>
              Ambientes identificados, suas áreas úteis e área construída por
              pavimento, medida pelos contornos externos das paredes e linhas de
              fechamento.
            </p>
          </header>
          {report && (
            <>
              <section
                className={styles.quantitySection}
                aria-labelledby="areas-summary"
              >
                <h2 id="areas-summary">
                  <span
                    className={styles.quantitySectionIndex}
                    aria-hidden="true"
                  >
                    01
                  </span>
                  Resumo do projeto
                </h2>
                <p className={styles.quantityMetadata}>Totais do projeto</p>
                <div className={styles.areaTotals}>
                  <div>
                    <h3>Área útil dos ambientes</h3>
                    <div className={styles.areaValue}>
                      <Useful value={report.useful} />
                    </div>
                    <p className={styles.note}>
                      Soma das áreas dos ambientes válidos, exceto os marcados
                      para desconsiderar.
                    </p>
                  </div>
                  <div>
                    <h3>Área construída</h3>
                    <div className={styles.areaValue}>
                      <Constructed value={report.constructed} />
                    </div>
                    <p className={styles.note}>
                      Inclui paredes e todo o interior dos perímetros externos,
                      descontando o espaço interno dos ambientes marcados para
                      desconsiderar. As paredes desses ambientes permanecem.
                    </p>
                  </div>
                </div>
                {report.constructed.pending && (
                  <p className={styles.areaPending}>
                    Há pendências de área construída em{" "}
                    {report.floors.filter((f) => f.constructed.pending).length}{" "}
                    pavimento(s).
                  </p>
                )}
              </section>
              <label className={styles.areaFilter}>
                Pavimentos
                <select
                  aria-label="Pavimentos do relatório de áreas"
                  value={floorId}
                  onChange={(e) => setFloorId(e.target.value)}
                >
                  <option value="all">Todos</option>
                  {report.floors.map(({ floor: f }) => (
                    <option key={f.id} value={f.id}>
                      {f.name} · cota {display(f.level)} cm
                    </option>
                  ))}
                </select>
              </label>
              <section
                className={styles.quantitySection}
                aria-labelledby="areas-floors"
              >
                <h2 id="areas-floors">
                  <span
                    className={styles.quantitySectionIndex}
                    aria-hidden="true"
                  >
                    02
                  </span>
                  Áreas por pavimento
                </h2>
                <div className={`${styles.quantityTable} ${styles.areaTable}`}>
                  <table>
                    <thead>
                      <tr>
                        <th>Pavimento</th>
                        <th>Área útil</th>
                        <th>Área construída</th>
                      </tr>
                    </thead>
                    <tbody>
                      {floors.map((f) => (
                        <tr key={f.floor.id}>
                          <td>
                            {f.floor.name}
                            <small>Cota {display(f.floor.level)} cm</small>
                          </td>
                          <td>
                            <Useful value={f.useful} />
                          </td>
                          <td>
                            <Constructed value={f.constructed} />
                            {f.constructed.pending && (
                              <small className={styles.areaPending}>
                                Há paredes ou linhas fora das áreas delimitadas.
                              </small>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section
                className={styles.quantitySection}
                aria-labelledby="areas-rooms"
              >
                <h2 id="areas-rooms">
                  <span
                    className={styles.quantitySectionIndex}
                    aria-hidden="true"
                  >
                    03
                  </span>
                  Ambientes
                </h2>
                {floors.some((f) => f.rooms.length) ? (
                  <div
                    className={`${styles.quantityTable} ${styles.areaTable} ${styles.areaRooms}`}
                  >
                    <table>
                      <thead>
                        <tr>
                          <th>Pavimento</th>
                          <th>Ambiente</th>
                          <th>Área útil</th>
                          <th>
                            <span className={styles.visuallyHidden}>
                              Localização
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {floors.flatMap((f) =>
                          f.rooms.map((room) => (
                            <tr key={room.label.id}>
                              <td>
                                {f.floor.name}
                                <small>Cota {display(f.floor.level)} cm</small>
                              </td>
                              <td>{room.label.name}</td>
                              <td>
                                {room.label.excludedFromAreas ? (
                                  <>
                                    {roomAreaText(0)}
                                    <small>Desconsiderado das áreas</small>
                                    {!room.region && (
                                      <small className={styles.areaPending}>
                                        Em revisão
                                      </small>
                                    )}
                                  </>
                                ) : room.region ? (
                                  roomAreaText(room.region.area)
                                ) : (
                                  <>
                                    <span>—</span>
                                    <small className={styles.areaPending}>
                                      Em revisão
                                    </small>
                                  </>
                                )}
                              </td>
                              <td>
                                <button
                                  disabled={busy}
                                  onClick={() => locate(room)}
                                  aria-label={`Localizar ${room.label.name}, ${f.floor.name}, cota ${display(f.floor.level)} cm`}
                                >
                                  Localizar
                                </button>
                              </td>
                            </tr>
                          )),
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className={styles.note}>Nenhum ambiente identificado.</p>
                )}
              </section>
              <p className={styles.note}>
                Valores arredondados para apresentação; os totais usam a
                precisão do cálculo.
              </p>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
