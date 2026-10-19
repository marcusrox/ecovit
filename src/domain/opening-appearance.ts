import type { Opening, OpeningAppearance } from "./project";

export const appearanceOptions = (kind: Opening["kind"]) =>
  kind === "opening"
    ? []
    : ([
        { type: "swing", label: "Giro · uma folha" },
        { type: "double-swing", label: "Giro · duas folhas" },
        {
          type: "sliding",
          label:
            kind === "door" ? "Correr · uma folha" : "Correr · duas folhas",
        },
        ...(kind === "door"
          ? [
              {
                type: "center-sliding",
                label: "Correr · abertura central",
              } as const,
            ]
          : []),
        {
          type: "tilt",
          label: kind === "door" ? "Basculante · garagem" : "Basculante",
        },
      ] satisfies { type: OpeningAppearance["type"]; label: string }[]);

export function orientationCount(type: OpeningAppearance["type"]) {
  return type === "swing" || type === "sliding" ? 4 : 2;
}

export function defaultAppearance(
  kind: Opening["kind"],
): OpeningAppearance | undefined {
  return kind === "opening"
    ? undefined
    : { type: kind === "door" ? "swing" : "sliding", orientation: 0 };
}

export function validAppearance(o: Pick<Opening, "kind" | "appearance">) {
  const a = o.appearance;
  return (
    !a ||
    (appearanceOptions(o.kind).some((option) => option.type === a.type) &&
      Number.isInteger(a.orientation) &&
      a.orientation >= 0 &&
      a.orientation < orientationCount(a.type))
  );
}

export function nextOrientation(a: OpeningAppearance): OpeningAppearance {
  return {
    ...a,
    orientation: ((a.orientation + 1) %
      orientationCount(a.type)) as OpeningAppearance["orientation"],
  };
}

export function orientationDescription(
  a: OpeningAppearance,
  horizontal: boolean,
) {
  const four = orientationCount(a.type) === 4;
  const opposite = four ? a.orientation >= 2 : a.orientation === 1;
  const face = horizontal
    ? opposite
      ? "abaixo"
      : "acima"
    : opposite
      ? "à esquerda"
      : "à direita";
  const start = a.orientation % 2 === 0;
  const end = horizontal
    ? start
      ? "esquerda"
      : "direita"
    : start
      ? "cima"
      : "baixo";
  if (a.type === "swing")
    return `Dobradiça ${horizontal ? (start ? "à esquerda" : "à direita") : start ? "em cima" : "embaixo"} · abre ${face}`;
  if (a.type === "sliding") return `Desliza para ${end} · folha ${face}`;
  if (a.type === "tilt") return `Projeção ${face} · movimento vertical`;
  return a.type === "double-swing"
    ? `Folhas abrem ${face}`
    : `Abertura central · folhas ${face}`;
}

// Presentation is excluded from construction inputs, never the opening's geometry.
export function constructionOpenings(openings: Opening[]) {
  return openings.map((opening) => {
    const result = { ...opening };
    delete result.appearance;
    return result;
  });
}
