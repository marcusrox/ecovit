// The editor displays 100% at 0.012 px per internal unit. Keep the actual
// camera scale here: the percentage in the toolbar is rounded for display.
export const LABEL_REFERENCE_SCALE = 0.012 * 0.61;

export function labelFontSize(
  base: number,
  cameraScale: number,
  category: "drawing" | "room" = "drawing",
) {
  const minimum = category === "room" ? 7 : 6;
  const maximum = category === "room" ? 20 : 18;
  const ratio = cameraScale / LABEL_REFERENCE_SCALE;
  return Math.min(
    maximum,
    Math.max(minimum, base * ratio ** (ratio < 1 ? 0.6 : 0.5)),
  );
}

// Compact label layout below 61%; retain screen spacing at larger scales.
export function labelSpacing(base: number, cameraScale: number) {
  return (
    base *
    Math.min(1, Math.max(6 / 11, (cameraScale / LABEL_REFERENCE_SCALE) ** 0.6))
  );
}
