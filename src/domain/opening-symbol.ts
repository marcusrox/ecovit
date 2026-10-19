import type { Opening, Point } from "./project";
import { orientationCount } from "./opening-appearance";

export type SymbolStroke = { points: Point[]; dashed: boolean };

// Shared schematic geometry, in the same units as the supplied opening box.
export function openingSymbolStrokes(
  o: Pick<Opening, "kind" | "appearance">,
  horizontal: boolean,
  x: number,
  y: number,
  width: number,
  height: number,
): SymbolStroke[] {
  if (o.kind === "opening" || width <= 0 || height <= 0) return [];
  if (!o.appearance) {
    if (o.kind === "door")
      return [
        {
          points: [
            { x, y },
            { x: x + width, y: y + height },
          ],
          dashed: false,
        },
      ];
    return [1 / 3, 2 / 3].map((r) => ({
      points: horizontal
        ? [
            { x, y: y + height * r },
            { x: x + width, y: y + height * r },
          ]
        : [
            { x: x + width * r, y },
            { x: x + width * r, y: y + height },
          ],
      dashed: false,
    }));
  }
  const a = o.appearance,
    length = horizontal ? width : height,
    t = horizontal ? height : width,
    half = length / 2,
    thin = Math.min(t * 0.22, length * 0.025),
    sx = orientationCount(a.type) === 4 && a.orientation % 2 ? -1 : 1,
    sy = (
      orientationCount(a.type) === 4 ? a.orientation >= 2 : a.orientation === 1
    )
      ? -1
      : 1;
  const strokes: SymbolStroke[] = [];
  const map = (u: number, v: number): Point =>
    horizontal
      ? { x: x + width / 2 + u * sx, y: y + height / 2 + v * sy }
      : { x: x + width / 2 - v * sy, y: y + height / 2 + u * sx };
  const line = (p: number[][], dashed = false) =>
    strokes.push({ points: p.map(([u, v]) => map(u, v)), dashed });
  const rect = (l: number, top: number, w: number, h: number) =>
    line([
      [l, top],
      [l + w, top],
      [l + w, top + h],
      [l, top + h],
      [l, top],
    ]);
  const arrow = (u: number, v: number, endU: number, endV: number) => {
    const angle = Math.atan2(endV - v, endU - u),
      size = Math.min(length * 0.055, Math.hypot(endU - u, endV - v) * 0.3);
    line([
      [u, v],
      [endU, endV],
    ]);
    line([
      [
        endU - size * Math.cos(angle - 0.45),
        endV - size * Math.sin(angle - 0.45),
      ],
      [endU, endV],
      [
        endU - size * Math.cos(angle + 0.45),
        endV - size * Math.sin(angle + 0.45),
      ],
    ]);
  };
  const arc = (center: number, radius: number, right = false) =>
    line(
      Array.from({ length: 33 }, (_, i) => {
        const angle = ((i / 32) * Math.PI) / 2;
        return [
          center + (right ? -1 : 1) * radius * Math.cos(angle),
          -radius * Math.sin(angle),
        ];
      }),
    );
  line([
    [-half, -t / 2],
    [-half, t / 2],
  ]);
  line([
    [half, -t / 2],
    [half, t / 2],
  ]);
  if (o.kind === "window") {
    line([
      [-half, -t * 0.4],
      [half, -t * 0.4],
    ]);
    line([
      [-half, t * 0.4],
      [half, t * 0.4],
    ]);
  }
  switch (a.type) {
    case "swing":
      rect(-half, -length, thin, length);
      arc(-half, length);
      break;
    case "double-swing":
      rect(-half, -half, thin, half);
      rect(half - thin, -half, thin, half);
      arc(-half, half);
      arc(half, half, true);
      break;
    case "sliding":
      if (o.kind === "window") {
        rect(-half, -t * 0.25, half, thin);
        rect(-length * 0.07, t * 0.2, length * 0.57, thin);
        arrow(
          length * 0.27,
          -t / 2 - length * 0.12,
          -length * 0.27,
          -t / 2 - length * 0.12,
        );
      } else {
        rect(-length * 1.08, -t / 2 - thin * 2, length, thin);
        arrow(
          length * 0.33,
          -t / 2 - length * 0.2,
          -length * 0.33,
          -t / 2 - length * 0.2,
        );
        line(
          [
            [-half, 0],
            [half, 0],
          ],
          true,
        );
      }
      break;
    case "center-sliding":
      rect(-length * 0.95, -t / 2 - thin * 2, half, thin);
      rect(length * 0.45, -t / 2 - thin * 2, half, thin);
      arrow(
        -length * 0.1,
        -t / 2 - length * 0.2,
        -length * 0.65,
        -t / 2 - length * 0.2,
      );
      arrow(
        length * 0.1,
        -t / 2 - length * 0.2,
        length * 0.65,
        -t / 2 - length * 0.2,
      );
      line(
        [
          [-half, 0],
          [half, 0],
        ],
        true,
      );
      break;
    case "tilt": {
      const depth = length * (o.kind === "door" ? 0.6 : 0.3);
      rect(-half, -thin / 2, length, thin);
      line(
        [
          [-half, -thin / 2],
          [-half, -depth],
          [half, -depth],
          [half, -thin / 2],
        ],
        true,
      );
      arrow(0, -depth * 0.2, 0, -depth * 0.85);
    }
  }
  return strokes;
}
