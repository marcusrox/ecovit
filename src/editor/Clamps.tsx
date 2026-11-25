import { clampPoints } from "./drawing/primitives";
import { Layer, Line, Circle, Text, Group } from "react-konva";
import { display, type Project } from "../domain/project";
import type { Clamp } from "../domain/clamps";
import { useEditingProject, useStore } from "../state/store";
import styles from "../ui/App.module.css";

const description = (c: Clamp) =>
  `Sobre a fiada ${c.course} · Ø ${display(c.diameter * 10)} mm · total nominal ${display(c.length)} cm (${display(c.length - 2 * c.leg)} + ${display(c.leg)} + ${display(c.leg)} cm)`;

export type ClampHover = {
  id: string;
  floorId: string;
  generated: Project["generated"];
};

export function ClampsCanvas({
  camera,
  onHover,
}: {
  camera: { x: number; y: number; scale: number };
  onHover: (hover: ClampHover | null) => void;
}) {
  const s = useStore(),
    doc = useEditingProject()!;
  const clamps =
    !s.busy && doc.generationState.status === "current"
      ? (doc.generated?.clamps?.filter((c) => c.course === s.course) ?? [])
      : [];
  const m = doc.project.base.width;
  return (
    <Layer>
      {clamps.map((c) => {
        const points = clampPoints(c, m, camera);
        const x = (points[0] + points[2]) / 2,
          y = (points[1] + points[3]) / 2;
        return (
          <Group
            key={c.id}
            name={c.pending ? "clamp clamp-pending" : "clamp"}
            onMouseEnter={() =>
              onHover({
                id: c.id,
                floorId: s.activeFloorId!,
                generated: s.doc!.generated,
              })
            }
            onMouseLeave={() => onHover(null)}
          >
            <Line
              points={points}
              stroke="#fff8e9"
              strokeWidth={7}
              listening={false}
            />
            <Line
              name="clamp-link"
              points={points}
              stroke={c.pending ? "#b33a29" : "#a74416"}
              strokeWidth={3}
              dash={c.pending ? [5, 4] : undefined}
              hitStrokeWidth={12}
              lineCap="round"
            />
            {c.pending && (
              <>
                <Circle
                  name="clamp-pending-marker"
                  x={x}
                  y={y}
                  radius={7}
                  fill="#b33a29"
                  stroke="#fff8e9"
                  strokeWidth={2}
                />
                <Text
                  x={x - 5}
                  y={y - 6}
                  width={10}
                  text="!"
                  align="center"
                  fontSize={12}
                  fontStyle="bold"
                  fill="#fff"
                  listening={false}
                />
              </>
            )}
          </Group>
        );
      })}
    </Layer>
  );
}

export function ClampsTooltip({
  hover,
  camera,
  width,
  height,
}: {
  hover: ClampHover | null;
  camera: { x: number; y: number; scale: number };
  width: number;
  height: number;
}) {
  const s = useStore(),
    doc = useEditingProject()!;
  if (
    !hover ||
    s.busy ||
    s.mode !== "course" ||
    doc.generationState.status !== "current" ||
    hover.floorId !== s.activeFloorId ||
    hover.generated !== s.doc?.generated
  )
    return null;
  const current = doc.generated?.clamps?.find(
    (c) => c.id === hover.id && c.course === s.course,
  );
  if (!current) return null;
  const m = doc.project.base.width,
    tooltipWidth = Math.min(300, Math.max(120, width - 16));
  const x = ((current.a.x + current.b.x) / 2 + m / 2) * camera.scale + camera.x;
  const y = ((current.a.y + current.b.y) / 2 + m / 2) * camera.scale + camera.y;
  return (
    <div
      role="tooltip"
      className={styles.clampTooltip}
      style={{
        width: tooltipWidth,
        left: Math.max(8, Math.min(width - tooltipWidth - 8, x + 12)),
        top: Math.max(8, Math.min(height - 190, y - 145)),
      }}
    >
      <strong>
        {current.pending ? "Grampo pendente" : "Grampo entre grautes"}
      </strong>
      <p>{description(current)}</p>
      <p>
        Células: ({display(current.a.x)}, {display(current.a.y)}) → (
        {display(current.b.x)}, {display(current.b.y)}) cm.
      </p>
      {current.pending ? (
        <>
          <p className={styles.errorText}>{current.pending}</p>
          <p>Não incluído na estimativa do Orçamento.</p>
        </>
      ) : (
        <p>Duas pontas para baixo · sem escala física.</p>
      )}
    </div>
  );
}

export function ClampsPanel() {
  const s = useStore(),
    doc = useEditingProject()!;
  if (!doc.model.floors[0].clamps?.enabled) return null;
  const current = !s.busy && doc.generationState.status === "current";
  const clamps = current
    ? (doc.generated?.clamps?.filter((c) => c.course === s.course) ?? [])
    : [];
  return (
    <section className={styles.propertyGroup} aria-label="Grampos da fiada">
      <h3>Grampos da fiada</h3>
      <p className={styles.note}>
        Traço laranja: ligação elegível. Vermelho tracejado e !: grampo
        pendente; passe o mouse para ver o motivo. Sobre a fiada ativa, duas
        pontas para baixo; dimensões nominais, sem escala física.
      </p>
      {!current ? (
        <p>Grampos indisponíveis até atualizar a composição.</p>
      ) : !clamps.length ? (
        <p>Nenhum grampo nesta fiada.</p>
      ) : (
        <details>
          <summary>Identificar grampos ({clamps.length})</summary>
          <ol>
            {clamps.map((c) => (
              <li key={c.id}>
                <p>{description(c)}</p>
                <p className={styles.note}>
                  Eixos: ({display(c.a.x)}, {display(c.a.y)}) → (
                  {display(c.b.x)}, {display(c.b.y)}) cm, origens das células.
                </p>
                {c.pending && (
                  <p className={styles.errorText}>Pendente: {c.pending}</p>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
