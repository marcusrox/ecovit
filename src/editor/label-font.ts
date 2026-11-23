// Category sizes at 61%, expressed as drawing dimensions like Text annotations.
// Use the actual camera scale, never the rounded UI zoom.
export const LABEL_REFERENCE_SCALE = 0.012 * 0.61;
export const DRAWING_FONT_FAMILY = "IBM Plex Sans";
export function labelFontSize(base: number, cameraScale: number) {
  return (base / LABEL_REFERENCE_SCALE) * cameraScale;
}
export function labelSpacing(base: number, cameraScale: number) {
  return labelFontSize(base, cameraScale);
}
export function labelFont(base: number, cameraScale: number, weight = 400) {
  return `${weight} ${labelFontSize(base, cameraScale)}px "${DRAWING_FONT_FAMILY}"`;
}
