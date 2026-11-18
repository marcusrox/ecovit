import type { ChannelReinforcement } from "../domain/channel-reinforcement";

type Camera = { x: number; y: number; scale: number };
type End = "start" | "end";

/** Screen-space strokes only; the saved straight runs and their lengths stay intact. */
export function channelReinforcementLines(
  segments: ChannelReinforcement[],
  module: number,
  camera: Camera,
) {
  const drawings = segments.map((segment) => {
    const horizontal = segment.a.y === segment.b.y;
    const visible = Math.min(
      segment.count,
      Math.max(1, Math.min(6, Math.floor((module * camera.scale) / 4))),
    );
    const span = Math.min(12, module * camera.scale * 0.55);
    const offsets = Array.from({ length: visible }, (_, i) =>
      visible === 1 ? 0 : (i / (visible - 1) - 0.5) * span,
    );
    const lines = offsets.map((offset) => [
      (segment.a.x + (horizontal ? 0 : module / 2)) * camera.scale +
        camera.x +
        (horizontal ? 0 : offset),
      (segment.a.y + (horizontal ? module / 2 : 0)) * camera.scale +
        camera.y +
        (horizontal ? offset : 0),
      (segment.b.x + (horizontal ? 0 : module / 2)) * camera.scale +
        camera.x +
        (horizontal ? 0 : offset),
      (segment.b.y + (horizontal ? module / 2 : 0)) * camera.scale +
        camera.y +
        (horizontal ? offset : 0),
    ]);
    return { segment, horizontal, lines };
  });
  const endAt = (
    from: number,
    to: number,
    near: number,
    far: number,
  ): End | undefined => {
    if (from >= near && from <= far && to > far) return "start";
    if (to >= near && to <= far && from < near) return "end";
  };
  for (const h of drawings.filter((d) => d.horizontal))
    for (const v of drawings.filter((d) => !d.horizontal)) {
      const H = h.segment,
        V = v.segment;
      if (H.course !== V.course || H.top !== V.top) continue;
      // The actual channel strips must overlap or share a face, never just a vertex.
      const overlapX = Math.min(H.b.x, V.a.x + module) - Math.max(H.a.x, V.a.x);
      const overlapY = Math.min(H.a.y + module, V.b.y) - Math.max(H.a.y, V.a.y);
      if (overlapX < 0 || overlapY < 0 || (overlapX === 0 && overlapY === 0))
        continue;
      if (
        !(H.a.x < V.a.x || H.b.x > V.a.x + module) ||
        !(V.a.y < H.a.y || V.b.y > H.a.y + module)
      )
        continue;
      const hEnd = endAt(H.a.x, H.b.x, V.a.x, V.a.x + module);
      const vEnd = endAt(V.a.y, V.b.y, H.a.y, H.a.y + module);
      if (hEnd && vEnd && h.lines.length === v.lines.length) {
        // L: pair inner/outer strokes at a common corner, including reflections.
        const reverse = hEnd !== vEnd;
        for (let i = 0; i < h.lines.length; i++) {
          const horizontal = h.lines[i],
            vertical = v.lines[reverse ? v.lines.length - 1 - i : i];
          horizontal[hEnd === "start" ? 0 : 2] = vertical[0];
          vertical[vEnd === "start" ? 1 : 3] = horizontal[1];
        }
      } else if (hEnd && !vEnd) {
        // T: the branch reaches both parallel strokes of the continuing run.
        const x =
          hEnd === "start"
            ? Math.min(...v.lines.map((l) => l[0]))
            : Math.max(...v.lines.map((l) => l[0]));
        for (const line of h.lines) line[hEnd === "start" ? 0 : 2] = x;
      } else if (vEnd && !hEnd) {
        const y =
          vEnd === "start"
            ? Math.min(...h.lines.map((l) => l[1]))
            : Math.max(...h.lines.map((l) => l[1]));
        for (const line of v.lines) line[vEnd === "start" ? 1 : 3] = y;
      }
    }
  return drawings.map((d) => ({ id: d.segment.id, lines: d.lines }));
}
