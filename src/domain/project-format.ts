// Historical migration boundaries remain explicit in the document reader.
export const MIN_SUPPORTED_PROJECT_FORMAT = 9;
export const CURRENT_PROJECT_FORMAT = 40;

export function isSupportedProjectFormat(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_SUPPORTED_PROJECT_FORMAT &&
    value <= CURRENT_PROJECT_FORMAT
  );
}
