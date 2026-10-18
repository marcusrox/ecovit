// Single-floor views for the existing geometry regression cases. Persistence
// still exercises the real envelope 9 reader; no legacy reader is supplied.
import {
  createProject,
  type Base,
  type LocalProject,
  type EditableProject,
} from "../src/domain/project";
import { floorView, generateFloor } from "../src/domain/composition";
import * as files from "../src/persistence/files";
import * as channels from "../src/domain/channels";
import * as openings from "../src/domain/openings";
import * as grout from "../src/domain/grout";
export type Project = LocalProject;
export function createLocalProject(name: string, base: Base): LocalProject {
  const doc = createProject(name, base, 40 * base.height);
  // Geometry fixtures explicitly supply their wall heights; keep their floor
  // default valid for a custom height as required by envelope 8.
  doc.model.floors[0].defaultHeight = 40 * base.height;
  return floorView(doc, doc.model.floors[0].id);
}
export const generate = (doc: EditableProject, convention?: string) => {
  void convention;
  return generateFloor(doc);
};
export function root(
  doc: EditableProject,
): import("../src/domain/project").Project {
  if (!("viewFloorId" in doc)) return doc;
  const { viewFloorId, ...data } = doc;
  const output = doc.generated
    ? {
        courses: doc.generated.courses,
        components: doc.generated.components,
        channels: doc.generated.channels,
        grouts: doc.generated.grouts,
        diagnostics: doc.generated.diagnostics,
      }
    : null;
  return {
    ...data,
    generated: output
      ? {
          convention: "nominal-v10",
          floors: [{ ...output, floorId: viewFloorId }],
          diagnostics: output.diagnostics,
        }
      : null,
  };
}
export const parseFile = (text: string) => {
  const value = JSON.parse(text);
  if (value.viewFloorId) text = JSON.stringify(root(value));
  const doc = files.parseFile(text);
  return floorView(doc, doc.model.floors[0].id);
};
export const validateProject = (doc: EditableProject) =>
  parseFile(JSON.stringify(doc));
export const importedCopy = (doc: Project) => {
  const next = files.importedCopy(root(doc));
  return floorView(next, next.model.floors[0].id);
};
export const suppressBand = <T extends EditableProject>(
  ...args: [T, string, number]
) => channels.suppressBand(...args) as T;
export const restoreBand = <T extends EditableProject>(
  ...args: [T, string, number]
) => channels.restoreBand(...args) as T;
export const restoreSuppression = <T extends EditableProject>(
  ...args: [T, string]
) => channels.restoreSuppression(...args) as T;
export const putOpening = <T extends EditableProject>(
  ...args: [T, import("../src/domain/project").Opening]
) => openings.putOpening(...args) as T;
export const removeElement = <T extends EditableProject>(
  ...args: [T, string]
) => openings.removeElement(...args) as T;
export const reconcileOpenings = <T extends EditableProject>(...args: [T, T]) =>
  openings.reconcileOpenings(...args) as T;
export const toggleGrout = <T extends EditableProject>(
  ...args: [
    T,
    import("../src/domain/project").Point & { wallIds: string[] },
    boolean,
  ]
) => grout.toggleGrout(...args) as T;
export const discardGroutAdjustment = <T extends EditableProject>(
  ...args: [T, string]
) => grout.discardGroutAdjustment(...args) as T;
