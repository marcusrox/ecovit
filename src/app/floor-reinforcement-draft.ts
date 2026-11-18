import { cm, display, type Project } from "../domain/project";
import type { Floor } from "../domain/floors";
import {
  defaultSteelBudget,
  validateSteelBudget,
} from "../domain/steel-budget";
import { parseLossPercent } from "../domain/quantities";
import {
  defaultClampSettings,
  parseClampList,
  validateClampSettings,
  clampCourseLimit,
  type ClampSettings,
} from "../domain/clamps";
import {
  defaultChannelReinforcement,
  parseChannelReinforcement,
} from "../domain/channel-reinforcement";

export type ClampsDraft = {
  enabled: boolean;
  diameter: string;
  length: string;
  mode: "list" | "interval";
  list: string;
  first: string;
  every: string;
  last: string;
};
export type ReinforcementDraft = {
  enabled: boolean;
  count: string;
  diameter: string;
};
export type FerragensDraft = {
  groutMode: "simple" | "reinforced";
  groutDiameter: string;
  usefulLength: string;
  overlapLength: string;
  horizontalExtra: string;
  clamps: ClampsDraft;
  reinforcement: ReinforcementDraft;
};
export type FerragensErrors = Partial<Record<keyof FerragensDraft, string>>;

export function floorReinforcementDraft(
  floor: Floor,
  doc: Project,
): FerragensDraft {
  const c = floor.clamps ?? defaultClampSettings(doc.project.base.width);
  const r = floor.channelReinforcement ?? defaultChannelReinforcement();
  const b = floor.steelBudget ?? defaultSteelBudget();
  return {
    groutMode: floor.groutMode ?? "simple",
    groutDiameter: display((floor.groutDiameter ?? 80) * 10),
    usefulLength: display(b.usefulLength),
    overlapLength: display(b.overlapLength),
    horizontalExtra: `${BigInt(b.horizontalExtra) / 100n},${String(BigInt(b.horizontalExtra) % 100n).padStart(2, "0")}`,
    clamps: {
      enabled: c.enabled,
      diameter: display(c.diameter * 10),
      length: display(c.length),
      mode: c.schedule.mode,
      list: c.schedule.mode === "list" ? c.schedule.courses.join(", ") : "",
      first: c.schedule.mode === "interval" ? String(c.schedule.first) : "",
      every: c.schedule.mode === "interval" ? String(c.schedule.every) : "",
      last: c.schedule.mode === "interval" ? String(c.schedule.last) : "",
    },
    reinforcement: {
      enabled: r.enabled,
      count: String(r.count),
      diameter: display(r.diameter * 10),
    },
  };
}

export function parseClamps(d: ClampsDraft, doc: Project): ClampSettings {
  const value = d.diameter.trim().replace(",", ".");
  if (!/^\d+(\.\d)?$/.test(value))
    throw new Error("Use diâmetro em mm, com até uma casa decimal (0,1 mm).");
  const [whole, part = "0"] = value.split(".");
  if (
    d.mode === "interval" &&
    ![d.first, d.every, d.last].every((n) => /^\d+$/.test(n.trim()))
  )
    throw new Error(
      "Informe fiadas e intervalo como números inteiros positivos.",
    );
  const candidate: ClampSettings = {
    enabled: d.enabled,
    diameter: Number(whole) * 10 + Number(part),
    length: cm(d.length),
    schedule:
      d.mode === "list"
        ? { mode: "list", courses: parseClampList(d.list) }
        : {
            mode: "interval",
            first: Number(d.first),
            every: Number(d.every),
            last: Number(d.last),
          },
  };
  validateClampSettings(
    candidate,
    doc.project.base.width,
    doc.project.base.height,
  );
  return candidate;
}

// Validate every group before constructing one floor operation. Optional defaults stay absent.
export function floorReinforcementChanges(
  d: FerragensDraft,
  doc: Project,
  floor: Floor,
) {
  const changes: Partial<
    Pick<
      Floor,
      | "groutMode"
      | "groutDiameter"
      | "clamps"
      | "channelReinforcement"
      | "steelBudget"
    >
  > = {};
  const errors: FerragensErrors = {};
  const b = floor.steelBudget ?? defaultSteelBudget();
  const candidateBudget = { ...b };
  try {
    candidateBudget.usefulLength = cm(d.usefulLength);
    validateSteelBudget({ ...b, usefulLength: candidateBudget.usefulLength });
  } catch (e) {
    errors.usefulLength = (e as Error).message;
  }
  try {
    candidateBudget.overlapLength = cm(d.overlapLength);
    validateSteelBudget({ ...b, overlapLength: candidateBudget.overlapLength });
  } catch (e) {
    errors.overlapLength = (e as Error).message;
  }
  try {
    candidateBudget.horizontalExtra = parseLossPercent(d.horizontalExtra);
  } catch (e) {
    errors.horizontalExtra = (e as Error).message;
  }
  if (
    !errors.usefulLength &&
    !errors.overlapLength &&
    !errors.horizontalExtra &&
    JSON.stringify(candidateBudget) !== JSON.stringify(b)
  )
    changes.steelBudget = candidateBudget;
  const groutDiameters: Record<string, 80 | 100 | 125> = {
    "8": 80,
    "10": 100,
    "12,5": 125,
  };
  const groutDiameter = groutDiameters[d.groutDiameter];
  if (!groutDiameter)
    errors.groutDiameter =
      "Escolha diâmetro de 8, 10 ou 12,5 mm para as barras do graute vertical.";
  else if (groutDiameter !== (floor.groutDiameter ?? 80))
    changes.groutDiameter = groutDiameter;
  if (d.groutMode !== "simple" && d.groutMode !== "reinforced")
    errors.groutMode = "Escolha graute Simples ou Reforçado.";
  else if (
    doc.project.groutSettings.junctions &&
    d.groutMode !== (floor.groutMode ?? "simple")
  )
    changes.groutMode = d.groutMode;
  try {
    const c = parseClamps(d.clamps, doc);
    const changed =
      JSON.stringify(c) !==
      JSON.stringify(
        floor.clamps ?? defaultClampSettings(doc.project.base.width),
      );
    const upper =
      c.schedule.mode === "list"
        ? (c.schedule.courses.at(-1) ?? 0)
        : c.schedule.last;
    const max = clampCourseLimit(doc, floor.id);
    // Existing out-of-height intentions remain pending, as in the engine contract.
    if (changed && c.enabled && (max < 1 || upper > max))
      throw new Error(
        `Escolha fiadas entre 1 e ${max}; use a altura das paredes existentes.`,
      );
    if (changed) changes.clamps = c;
  } catch (e) {
    errors.clamps = (e as Error).message;
  }
  try {
    const r = parseChannelReinforcement(
      d.reinforcement.enabled,
      d.reinforcement.count,
      d.reinforcement.diameter,
    );
    if (
      JSON.stringify(r) !==
      JSON.stringify(
        floor.channelReinforcement ?? defaultChannelReinforcement(),
      )
    )
      changes.channelReinforcement = r;
  } catch (e) {
    errors.reinforcement = (e as Error).message;
  }
  return Object.keys(errors).length
    ? { errors, changes: undefined }
    : { errors, changes };
}
