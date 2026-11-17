import { useState } from "react";
import { Layer, Line, Label, Tag, Text, Group } from "react-konva";
import { display } from "../domain/project";
import type { Clamp } from "../domain/clamps";
import { useEditingProject, useStore } from "../state/store";
import styles from "../ui/App.module.css";

const description = (c: Clamp) =>
  `Sobre a fiada ${c.course} · Ø ${display(c.diameter * 10)} mm · total nominal ${display(c.length)} cm (${display(c.length - 2 * c.leg)} + ${display(c.leg)} + ${display(c.leg)} cm)`;

export function ClampsCanvas({
  camera,
  width,
}: {
  camera: { x: number; y: number; scale: number };
  width: number;
}) {
  const s = useStore(),
    doc = useEditingProject()!;
  const [hover, setHover] = useState<string | null>(null);
  const clamps =
    !s.busy && doc.generationState.status === "current"
      ? (doc.generated?.clamps?.filter(
          (c) => c.course === s.course && !c.pending,
        ) ?? [])
      : [];
  const current = clamps.find((c) => c.id === hover),
    m = doc.project.base.width;
  return (
    <Layer>
      {clamps.map((c) => {
        const points = [
          (c.a.x + m / 2) * camera.scale + camera.x,
          (c.a.y + m / 2) * camera.scale + camera.y,
          (c.b.x + m / 2) * camera.scale + camera.x,
          (c.b.y + m / 2) * camera.scale + camera.y,
        ];
        return (
          <Group
            key={c.id}
            name="clamp"
            onMouseEnter={() => setHover(c.id)}
            onMouseLeave={() => setHover(null)}
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
              stroke="#a74416"
              strokeWidth={3}
              hitStrokeWidth={12}
              lineCap="round"
            />
          </Group>
        );
      })}
      {current && (
        <Label
          listening={false}
          x={Math.max(
            4,
            Math.min(
              width - 270,
              (current.a.x + m / 2) * camera.scale + camera.x + 12,
            ),
          )}
          y={Math.max(4, (current.a.y + m / 2) * camera.scale + camera.y - 80)}
        >
          <Tag fill="#fffefb" stroke="#c4d5c7" cornerRadius={4} />
          <Text
            text={
              description(current) +
              "\nDuas pontas para baixo · sem escala física"
            }
            width={260}
            padding={8}
            fontSize={12}
            fill="#214c40"
          />
        </Label>
      )}
    </Layer>
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
        Traço laranja: ligação entre grautes, sobre a fiada ativa. Duas pontas
        para baixo; dimensões nominais, sem escala física.
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
