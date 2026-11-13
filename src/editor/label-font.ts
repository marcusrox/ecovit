// The editor displays 100% at 0.012 px per internal unit. Keep the actual
// camera scale here: the percentage in the toolbar is rounded for display.
export const LABEL_REFERENCE_SCALE = 0.012 * 0.61;

export function labelFontSize(
  base: number,
  cameraScale: number,
  category: "drawing" | "room" = "drawing",
) {
  const minimum = category === "room" ? 10 : 9;
  const maximum = category === "room" ? 20 : 18;
  return Math.min(
    maximum,
    Math.max(minimum, base * Math.sqrt(cameraScale / LABEL_REFERENCE_SCALE)),
  );
}
