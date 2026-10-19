import { create } from "zustand";

export const preferencesKey = "ecovit:preferences:v1";
export const renderingPreferencesKey = "ecovit:rendering:v1";
export function readHighQualityImages(): boolean {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(renderingPreferencesKey) ?? "null",
    );
    if (typeof value === "boolean") return value;
  } catch {
    /* Keep rendering available when storage fails. */
  }
  return true;
}
export type LabelType = "door" | "window" | "opening" | "wall" | "measure";
export type LabelPreferences = Record<LabelType, boolean>;
const defaults: LabelPreferences = {
  door: true,
  window: true,
  opening: true,
  wall: true,
  measure: true,
};

export function readPreferences(): LabelPreferences {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(preferencesKey) ?? "null",
    );
    if (
      value &&
      typeof value === "object" &&
      Object.keys(defaults).every(
        (key) =>
          (key === "measure" && !(key in value)) ||
          typeof (value as Record<string, unknown>)[key] === "boolean",
      )
    )
      return Object.fromEntries(
        Object.keys(defaults).map((key) => [
          key,
          (value as Record<string, boolean>)[key] ?? true,
        ]),
      ) as LabelPreferences;
  } catch {
    /* Unavailable storage must not prevent editing. */
  }
  return { ...defaults };
}

export const usePreferences = create<{
  labels: LabelPreferences;
  highQualityImages: boolean;
  setHighQualityImages: (high: boolean) => void;
  error: string;
  setLabel: (type: LabelType, visible: boolean) => void;
}>((set, get) => ({
  labels: readPreferences(),
  highQualityImages: readHighQualityImages(),
  setHighQualityImages(high) {
    let error = "";
    try {
      localStorage.setItem(renderingPreferencesKey, JSON.stringify(high));
    } catch {
      error =
        "A preferência foi aplicada nesta sessão, mas não foi salva para a próxima abertura.";
    }
    set({ highQualityImages: high, error });
  },
  error: "",
  setLabel(type, visible) {
    const labels = { ...get().labels, [type]: visible };
    let error = "";
    try {
      localStorage.setItem(preferencesKey, JSON.stringify(labels));
    } catch {
      error =
        "A preferência foi aplicada nesta sessão, mas não foi salva para a próxima abertura.";
    }
    set({ labels, error });
  },
}));
