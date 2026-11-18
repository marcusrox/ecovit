import { describe, expect, it } from "vitest";
import { channelReinforcementLines } from "../src/editor/channel-reinforcement-drawing";
import type { ChannelReinforcement } from "../src/domain/channel-reinforcement";

const camera = { x: 0, y: 0, scale: 1 };
function run(
  id: string,
  a: number[],
  b: number[],
  count = 2,
): ChannelReinforcement {
  return {
    id,
    a: { x: a[0], y: a[1] },
    b: { x: b[0], y: b[1] },
    course: 5,
    top: 3500,
    count,
    diameter: 80,
    wallIds: [],
    origins: [],
  };
}
function sharedEndpoints(result: ReturnType<typeof channelReinforcementLines>) {
  const [a, b] = result;
  const endpoints = (lines: number[][]) =>
    lines.flatMap((l) => [l.slice(0, 2).join(","), l.slice(2).join(",")]);
  const other = new Set(endpoints(b.lines));
  return endpoints(a.lines).filter((p) => other.has(p));
}
describe("continuidade gráfica da armadura das canaletas", () => {
  it("L encostado pela face forma duas quinas completas e conserva os dados nominais", () => {
    const segments = [run("h", [0, 0], [400, 0]), run("v", [0, 100], [0, 400])],
      before = structuredClone(segments);
    expect(channelReinforcementLines(segments, 100, camera)).toEqual([
      {
        id: "h",
        lines: [
          [44, 44, 400, 44],
          [56, 56, 400, 56],
        ],
      },
      {
        id: "v",
        lines: [
          [44, 44, 44, 400],
          [56, 56, 56, 400],
        ],
      },
    ]);
    expect(segments).toEqual(before);
  });
  it("L mantém as duas ligações em todas as rotações e reflexões", () => {
    for (let rotation = 0; rotation < 4; rotation++)
      for (const reflection of [false, true]) {
        const transform = (x: number, y: number) => {
          if (reflection) x = -x;
          for (let i = 0; i < rotation; i++) [x, y] = [-y, x];
          return [x, y];
        };
        const rectangle = (
          id: string,
          x: number,
          y: number,
          width: number,
          height: number,
        ) => {
          const points = [
            [x, y],
            [x + width, y],
            [x, y + height],
            [x + width, y + height],
          ].map(([a, b]) => transform(a, b));
          const xs = points.map((p) => p[0]),
            ys = points.map((p) => p[1]),
            left = Math.min(...xs),
            top = Math.min(...ys);
          return run(
            id,
            [left, top],
            width > height
              ? rotation % 2
                ? [left, Math.max(...ys)]
                : [Math.max(...xs), top]
              : rotation % 2
                ? [Math.max(...xs), top]
                : [left, Math.max(...ys)],
          );
        };
        const result = channelReinforcementLines(
          [rectangle("h", 0, 0, 400, 100), rectangle("v", 0, 100, 100, 300)],
          100,
          camera,
        );
        expect(new Set(sharedEndpoints(result)).size).toBe(2);
      }
  });
  it("T de ramal horizontal alcança ambas as barras da parede contínua", () => {
    const result = channelReinforcementLines(
      [run("h", [-300, 0], [0, 0]), run("v", [0, -300], [0, 400])],
      100,
      camera,
    );
    expect(result[0].lines).toEqual([
      [-300, 44, 56, 44],
      [-300, 56, 56, 56],
    ]);
    expect(result[1].lines).toEqual([
      [44, -300, 44, 400],
      [56, -300, 56, 400],
    ]);
  });
  it("T de ramal vertical fecha o espaço até as barras da faixa contínua", () => {
    const result = channelReinforcementLines(
      [run("h", [-300, 0], [400, 0]), run("v", [0, 100], [0, 400])],
      100,
      camera,
    );
    expect(result[0].lines).toEqual([
      [-300, 44, 400, 44],
      [-300, 56, 400, 56],
    ]);
    expect(result[1].lines).toEqual([
      [44, 44, 44, 400],
      [56, 44, 56, 400],
    ]);
  });
  it.each([1, 3, 5000])(
    "L conserva as ligações com %i barras e zoom limitado",
    (count) => {
      const result = channelReinforcementLines(
        [
          run("h", [0, 0], [400, 0], count),
          run("v", [0, 100], [0, 400], count),
        ],
        100,
        { x: 200, y: 100, scale: 0.1 },
      );
      expect(sharedEndpoints(result)).toHaveLength(result[0].lines.length);
      expect(result[0].lines.length).toBeLessThanOrEqual(6);
    },
  );
  it("vazio, contato só pelo vértice ou outra fiada não cria ligação", () => {
    const h = run("h", [0, 0], [400, 0]);
    for (const v of [
      run("v", [0, 200], [0, 400]),
      run("v", [400, 100], [400, 400]),
      { ...run("v", [0, 100], [0, 400]), course: 6 },
    ]) {
      const separate = channelReinforcementLines([h], 100, camera)[0];
      expect(channelReinforcementLines([h, v], 100, camera)[0]).toEqual(
        separate,
      );
    }
  });
});
