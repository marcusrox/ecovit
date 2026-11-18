import { useState } from "react";
import { Group, Label, Layer, Line, Tag, Text } from "react-konva";
import { display } from "../domain/project";
import type { ChannelReinforcement } from "../domain/channel-reinforcement";
import { useEditingProject, useStore } from "../state/store";
import styles from "../ui/App.module.css";
import { channelReinforcementLines } from "./channel-reinforcement-drawing";

const description = (r: ChannelReinforcement) =>
  `Fiada ${r.course} · ${r.count} ${r.count === 1 ? "barra" : "barras"} de Ø ${display(r.diameter * 10)} mm · trecho nominal ${display(Math.abs(r.b.x - r.a.x) + Math.abs(r.b.y - r.a.y))} cm`;

export function ChannelReinforcementCanvas({
  camera,
  width,
}: {
  camera: { x: number; y: number; scale: number };
  width: number;
}) {
  const s = useStore(),
    doc = useEditingProject()!;
  const [hover, setHover] = useState<string | null>(null);
  const segments =
    !s.busy && doc.generationState.status === "current"
      ? (doc.generated?.reinforcement?.filter((r) => r.course === s.course) ??
        [])
      : [];
  const current = segments.find((r) => r.id === hover),
    m = doc.project.base.width;
  const drawings = channelReinforcementLines(segments, m, camera);
  return (
    <Layer>
      {drawings.flatMap((d) =>
        d.lines.map((points, i) => (
          <Line
            key={`halo-${d.id}-${i}`}
            points={points}
            stroke="#fff8e9"
            strokeWidth={4}
            listening={false}
          />
        )),
      )}
      {drawings.map((r) => {
        return (
          <Group
            name="channel-reinforcement"
            key={r.id}
            onMouseEnter={() => setHover(r.id)}
            onMouseLeave={() => setHover(null)}
          >
            {r.lines.map((points, i) => {
              return (
                <Group key={i}>
                  <Line
                    name="reinforcement-bar"
                    points={points}
                    stroke="#6b3fa0"
                    strokeWidth={2}
                    hitStrokeWidth={8}
                    lineCap="butt"
                  />
                </Group>
              );
            })}
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
          y={Math.max(4, (current.a.y + m / 2) * camera.scale + camera.y - 90)}
        >
          <Tag fill="#fffefb" stroke="#c4d5c7" cornerRadius={4} />
          <Text
            text={`${doc.model.floors[0].name}\n${description(current)}\nSem detalhamento de corte, emenda ou dobra`}
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

export function ChannelReinforcementPanel() {
  const s = useStore(),
    doc = useEditingProject()!,
    floor = doc.model.floors[0];
  if (!floor.channelReinforcement?.enabled) return null;
  const current = !s.busy && doc.generationState.status === "current";
  const segments = current
    ? (doc.generated?.reinforcement?.filter((r) => r.course === s.course) ?? [])
    : [];
  return (
    <section
      className={styles.propertyGroup}
      aria-label="Armadura das canaletas da fiada"
    >
      <h3>Armadura das canaletas</h3>
      <p className={styles.note}>
        Linhas roxas: barras longitudinais de cintas, vergas e contravergas.
        Quantidade e bitola são nominais; cruzamentos não detalham ligações
        físicas.
      </p>
      {!current ? (
        <p>Armadura indisponível até atualizar a composição.</p>
      ) : !segments.length ? (
        <p>Nenhum trecho de armadura nesta fiada.</p>
      ) : (
        <details>
          <summary>Identificar armaduras ({segments.length})</summary>
          <ol>
            {segments.map((r) => (
              <li key={r.id}>
                <p>
                  {floor.name} · {description(r)}
                </p>
                <p className={styles.note}>
                  {r.a.y === r.b.y ? "Horizontal" : "Vertical"} · (
                  {display(r.a.x)}, {display(r.a.y)}) → ({display(r.b.x)},{" "}
                  {display(r.b.y)}) cm, faces da faixa. Sem comprimentos de
                  ancoragem, emenda ou fabricação.
                </p>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
