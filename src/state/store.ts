import { decodeReference, type ImageDraft } from "../domain/reference-image";
import {
  decodeCustomAssets,
  decodeCatalogElements,
} from "../domain/image-elements";
import {
  generate,
  signature,
  floorView,
  type Composition,
} from "../domain/composition";
import { create } from "zustand";
import {
  remember,
  travel,
  type History,
  type Project,
  type Opening,
  type EditableProject,
  type Point,
  type ImageElement,
  type CustomImageAsset,
} from "../domain/project";
import { loadProject, saveProject, checkRevision } from "../persistence/remote";
import { validateProject } from "../persistence/files";
import { forgetProject, pendingErrorKind } from "../persistence/remote";
import { mergeFloorView } from "../domain/floors";
import { useMemo } from "react";
import { reconcileOpenings } from "../domain/openings";
import { constructionOpenings } from "../domain/opening-appearance";
import {
  resolveFloorReference,
  type FloorReference,
} from "../domain/floor-reference";
let retired = false;
const changedInputs = (previous: Project, next: Project) =>
  JSON.stringify([
    {
      ...previous.model,
      openings: constructionOpenings(previous.model.openings),
      terrain: undefined,
      measurements: undefined,
      referenceImages: undefined,
      imageElements: undefined,
      customImageAssets: undefined,
      floors: previous.model.floors.map((f) => ({
        id: f.id,
        level: f.level,
        defaultHeight: f.defaultHeight,
      })),
    },
    previous.adjustments,
    previous.project.base,
    previous.project.openingSettings,
    previous.project.channelLevels,
    previous.project.groutSettings,
  ]) !==
  JSON.stringify([
    {
      ...next.model,
      openings: constructionOpenings(next.model.openings),
      terrain: undefined,
      measurements: undefined,
      referenceImages: undefined,
      imageElements: undefined,
      customImageAssets: undefined,
      floors: next.model.floors.map((f) => ({
        id: f.id,
        level: f.level,
        defaultHeight: f.defaultHeight,
      })),
    },
    next.adjustments,
    next.project.base,
    next.project.openingSettings,
    next.project.channelLevels,
    next.project.groutSettings,
  ]);
type Inspection = {
  terrainDraft: { points: Point[] } | null;
  terrainEditing: boolean;
  furnitureDraft: { element: ImageElement; asset?: CustomImageAsset } | null;
  imageRequest: string | null;
  imageDraft: ImageDraft | null;
  imageOpacity: number | null;
  slabDraft: {
    tool?: "select" | "slab";
    slabId?: string;
    openingId?: string;
    points: Point[];
    closed: boolean;
    thickness: string;
  } | null;
  slabEditing: boolean;
  mode: "plan" | "course";
  course: number;
  ghost: "none" | "previous" | "next";
  floorReference: FloorReference;
  component: string | null;
  preview: Composition | null;
  focus: { x: number; y: number } | null;
  pendingOpening: Opening | null;
  channelBand: string | null;
  groutMode: boolean;
  groutCell: { x: number; y: number; wallIds: string[] } | null;
  diagnosticWalls: string[];
};
const inspection: Inspection = {
  terrainDraft: null,
  terrainEditing: false,
  furnitureDraft: null,
  imageDraft: null,
  imageRequest: null,
  imageOpacity: null,
  slabDraft: null,
  slabEditing: false,
  mode: "plan",
  course: 1,
  ghost: "none",
  floorReference: "none",
  component: null,
  preview: null,
  focus: null,
  pendingOpening: null,
  channelBand: null,
  groutMode: false,
  groutCell: null,
  diagnosticWalls: [],
};
type State = Inspection & {
  inspect: (change: Partial<Inspection>) => void;
  doc: Project | null;
  retainedGroutResult: Project["generated"];
  activeFloorId: string | null;
  coursesByFloor: Record<string, number>;
  floorReferencesByFloor: Record<string, FloorReference>;
  switchFloor: (id: string) => void;
  history: History;
  busy: boolean;
  openingProjectId: string | null;
  readonly: boolean;
  saved:
    "saved" | "saving" | "error" | "uncertain" | "conflict" | "unavailable";
  message: string;
  select: string | null;
  open: (project: Project | string, fresh?: boolean) => Promise<void>;
  close: () => void;
  commit: (
    doc: EditableProject,
    command?:
      | "resize"
      | "move"
      | "create/merge"
      | "floor"
      | "slab"
      | "measure"
      | "image"
      | "furniture"
      | "terrain"
      | "restore-grouts",
  ) => Promise<void>;
  undo: (redo?: boolean) => Promise<void>;
  notify: (message: string) => void;
  choose: (id: string | null) => void;
  retry: () => Promise<void>;
  discard: () => Promise<void>;
};
export const useStore = create<State>((set, get) => {
  let checkpoint: Pick<State, "doc" | "history" | "activeFloorId"> | null =
    null;
  function retainGroutResult(previous: Project, next: Project) {
    if (!changedInputs(previous, next)) return get().retainedGroutResult;
    // Merging a floor view can reorder records from other floors. Compare
    // membership by ID here so that ordering alone does not hide the drawing.
    const byId = <T extends { id: string }>(items: T[]) =>
      [...items].sort((a, b) => a.id.localeCompare(b.id));
    const withoutGrouts = (doc: Project): Project => ({
      ...doc,
      model: {
        ...doc.model,
        floors: byId(doc.model.floors),
        walls: byId(doc.model.walls),
        openings: byId(doc.model.openings),
        slabs: byId(doc.model.slabs),
      },
      adjustments: {
        grout: [],
        channels: byId(doc.adjustments.channels),
        junctions: byId(doc.adjustments.junctions),
      },
    });
    if (changedInputs(withoutGrouts(previous), withoutGrouts(next)))
      return null;
    return JSON.stringify(byId(previous.adjustments.grout)) !==
      JSON.stringify(byId(next.adjustments.grout))
      ? (previous.generated ?? get().retainedGroutResult)
      : get().retainedGroutResult;
  }
  async function persist(doc: Project, calculate = true, write = true) {
    doc = { ...doc, metadata: { ...doc.metadata, appVersion: "0.17.0" } };
    set({ doc, busy: true, saved: write ? "saving" : "saved" });
    let courseMessage = "";
    try {
      if (write) {
        const receipt = await saveProject(doc);
        if (receipt?.updatedAt)
          doc = {
            ...doc,
            metadata: {
              ...doc.metadata,
              updatedAt: receipt.updatedAt,
              createdAt: receipt.createdAt ?? doc.metadata.createdAt,
            },
          };
      }
      set({ doc, readonly: false });
      if (calculate && doc.generationState.status === "outdated") {
        if (typeof requestAnimationFrame === "function")
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => setTimeout(resolve, 0)),
          );
        try {
          const generated = generate(doc);
          doc = {
            ...doc,
            generated,
            generationState: {
              status: "current",
              diagnostics: generated.diagnostics,
            },
          };
          const current = get();
          const count =
            generated.floors.find(
              (floor) => floor.floorId === current.activeFloorId,
            )?.courses.length ?? 0;
          const nextCourse = Math.min(current.course, Math.max(1, count));
          if (nextCourse !== current.course)
            courseMessage =
              count > 0
                ? `A fiada anterior deixou de existir. Selecionada a fiada ${count}.`
                : "Este pavimento não tem fiadas disponíveis.";
          set({ doc, course: nextCourse, retainedGroutResult: null });
        } catch (error) {
          set({
            saved: "saved",
            message: `Modelo salvo. Cálculo não concluído: ${error instanceof Error ? error.message : String(error)}. Use Recalcular.`,
          });
          checkpoint = {
            doc,
            history: get().history,
            activeFloorId: get().activeFloorId,
          };
          return;
        }
      }
      set({ doc, saved: "saved", readonly: false, message: courseMessage });
      checkpoint = {
        doc,
        history: get().history,
        activeFloorId: get().activeFloorId,
      };
    } catch (error) {
      const kind = pendingErrorKind(error);
      set({
        saved:
          kind === "incerto"
            ? "uncertain"
            : kind === "conflito"
              ? "conflict"
              : "error",
        readonly: true,
        message: `${kind === "incerto" ? "Confirmação pendente. " : kind === "conflito" ? "Conflito. " : "Não salvo. "}${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      set({ busy: false });
    }
  }
  function referenceState(doc: Project, active: string | null, s: State) {
    const floorReferencesByFloor = Object.fromEntries(
      doc.model.floors.map((floor) => {
        const direction = s.floorReferencesByFloor[floor.id] ?? "none";
        return [
          floor.id,
          resolveFloorReference(doc, floor.id, direction) ? direction : "none",
        ];
      }),
    ) as Record<string, FloorReference>;
    return {
      floorReferencesByFloor,
      floorReference:
        s.mode === "plan" && active
          ? (floorReferencesByFloor[active] ?? "none")
          : ("none" as FloorReference),
    };
  }
  return {
    ...inspection,
    inspect: (change) =>
      set((s) => {
        const direction = s.busy
          ? s.floorReference
          : (change.floorReference ?? s.floorReference);
        const floorReference =
          (change.mode ?? s.mode) === "plan" &&
          s.doc &&
          resolveFloorReference(s.doc, s.activeFloorId, direction)
            ? direction
            : "none";
        return {
          floorReferencesByFloor: {
            ...s.floorReferencesByFloor,
            ...(s.activeFloorId ? { [s.activeFloorId]: floorReference } : {}),
          },
          ...(change.mode && change.mode !== s.mode
            ? {
                terrainDraft: null,
                terrainEditing: false,
                furnitureDraft: null,
                slabDraft: null,
                slabEditing: false,
                imageDraft: null,
                imageRequest: null,
                imageOpacity: null,
              }
            : {}),
          ...change,
          floorReference,
          ...(change.mode === "plan"
            ? { groutMode: false, groutCell: null }
            : {}),
        };
      }),
    activeFloorId: null,
    coursesByFloor: {},
    floorReferencesByFloor: {},
    switchFloor: (id) => {
      const s = get();
      if (
        s.busy ||
        !s.doc?.model.floors.some((f) => f.id === id) ||
        id === s.activeFloorId
      )
        return;
      set({
        ...inspection,
        mode: s.mode,
        activeFloorId: id,
        ...referenceState(s.doc, id, s),
        coursesByFloor: {
          ...s.coursesByFloor,
          ...(s.activeFloorId ? { [s.activeFloorId]: s.course } : {}),
        },
        course: s.coursesByFloor[id] ?? 1,
        select: null,
      });
    },
    doc: null,
    retainedGroutResult: null,
    history: { past: [], future: [] },
    busy: false,
    openingProjectId: null,
    readonly: false,
    saved: "saved",
    message: "",
    select: null,
    notify: (message) => set({ message }),
    choose: (select) =>
      set((s) => ({
        select,
        diagnosticWalls: [],
        ...(s.mode === "course"
          ? {
              component: null,
              preview: null,
              channelBand: null,
              groutCell: null,
            }
          : {}),
        ...(select !== s.select
          ? {
              terrainDraft: null,
              terrainEditing: false,
              slabDraft: null,
              slabEditing: false,
              imageDraft: null,
              imageOpacity: null,
            }
          : {}),
      })),
    open: async (requested, fresh = false) => {
      if (retired || get().busy) return;
      const id =
        typeof requested === "string" ? requested : requested.project.id;
      if (get().doc?.project.id === id && !fresh) return;
      set({ busy: true, openingProjectId: id, message: "" });
      try {
        // Let React paint the opening feedback and wait cursor before validation.
        if (typeof requestAnimationFrame === "function")
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => setTimeout(resolve, 0)),
          );
        const doc =
          fresh && typeof requested !== "string"
            ? validateProject(requested)
            : await loadProject(id);
        if (typeof Image !== "undefined") {
          await decodeCustomAssets(doc.model.customImageAssets);
          await decodeCatalogElements(doc.model.imageElements);
          for (const image of doc.model.referenceImages)
            await decodeReference(image);
        }
        set({
          ...inspection,
          doc,
          retainedGroutResult: null,
          activeFloorId: doc.model.floors[0].id,
          coursesByFloor: {},
          floorReferencesByFloor: {},
          readonly: false,
          history: { past: [], future: [] },
          select: null,
          saved: "saved",
          message: "",
        });
        await persist(doc, true, fresh && typeof requested !== "string");
      } catch (e) {
        set({ message: String(e instanceof Error ? e.message : e) });
      } finally {
        set({ busy: false, openingProjectId: null });
      }
    },
    close: () => {
      if (get().busy) return;
      if (get().doc) forgetProject(get().doc!.project.id);
      checkpoint = null;
      set({
        doc: null,
        saved: "saved",
        message: "",
        retainedGroutResult: null,
        terrainDraft: null,
        terrainEditing: false,
        furnitureDraft: null,
        imageDraft: null,
        imageRequest: null,
        floorReference: "none",
        floorReferencesByFloor: {},
        select: null,
        readonly: false,
        history: { past: [], future: [] },
      });
    },
    commit: async (candidate, command = "resize") => {
      const s = get();
      if (retired || s.busy || s.readonly || !s.doc) return;
      try {
        if (s.imageDraft && command !== "image" && command !== "floor")
          throw new Error("Conclua ou cancele o ajuste da imagem.");
        candidate = mergeFloorView(s.doc, candidate);
        if (command === "furniture") {
          if (
            [
              ...candidate.model.imageElements,
              ...s.doc.model.imageElements,
            ].some(
              (e) =>
                e.floorId !== s.activeFloorId &&
                JSON.stringify(
                  candidate.model.imageElements.find((i) => i.id === e.id),
                ) !==
                  JSON.stringify(
                    s.doc!.model.imageElements.find((i) => i.id === e.id),
                  ),
            )
          )
            throw new Error("Edite mobiliário somente no pavimento ativo.");
          if (
            s.doc.model.customImageAssets.some(
              (a) =>
                candidate.model.imageElements.some(
                  (e) =>
                    e.floorId !== s.activeFloorId &&
                    e.source.kind === "custom" &&
                    e.source.assetId === a.id,
                ) &&
                JSON.stringify(
                  candidate.model.customImageAssets.find((i) => i.id === a.id),
                ) !== JSON.stringify(a),
            )
          )
            throw new Error("Não altere recursos usados por outro pavimento.");
        }
        if (
          command === "image" &&
          [
            ...candidate.model.referenceImages,
            ...s.doc.model.referenceImages,
          ].some(
            (i) =>
              i.floorId !== s.activeFloorId &&
              JSON.stringify(
                candidate.model.referenceImages.find(
                  (x) => x.floorId === i.floorId,
                ),
              ) !==
                JSON.stringify(
                  s.doc!.model.referenceImages.find(
                    (x) => x.floorId === i.floorId,
                  ),
                ),
          )
        )
          throw new Error("Edite a imagem somente no pavimento ativo.");
        if (
          command === "measure" &&
          [...candidate.model.measurements, ...s.doc.model.measurements].some(
            (m) =>
              m.floorId !== s.activeFloorId &&
              JSON.stringify(
                candidate.model.measurements.find((x) => x.id === m.id),
              ) !==
                JSON.stringify(
                  s.doc!.model.measurements.find((x) => x.id === m.id),
                ),
          )
        )
          throw new Error("Edite medidas somente no pavimento ativo.");
        if (
          command === "slab" &&
          [...candidate.model.slabs, ...s.doc.model.slabs].some(
            (slab) =>
              slab.floorId !== s.activeFloorId &&
              JSON.stringify(
                candidate.model.slabs.find((a) => a.id === slab.id),
              ) !==
                JSON.stringify(
                  s.doc!.model.slabs.find((a) => a.id === slab.id),
                ),
          )
        )
          throw new Error("Edite a laje somente no pavimento ativo.");
        if (
          JSON.stringify(candidate.project) === JSON.stringify(s.doc.project) &&
          JSON.stringify(candidate.model) === JSON.stringify(s.doc.model) &&
          JSON.stringify(candidate.adjustments) ===
            JSON.stringify(s.doc.adjustments)
        )
          return;
        if (
          command === "restore-grouts" &&
          (JSON.stringify(candidate.project) !==
            JSON.stringify(s.doc.project) ||
            JSON.stringify(candidate.model) !== JSON.stringify(s.doc.model) ||
            JSON.stringify(candidate.adjustments.channels) !==
              JSON.stringify(s.doc.adjustments.channels) ||
            JSON.stringify(candidate.adjustments.junctions) !==
              JSON.stringify(s.doc.adjustments.junctions) ||
            candidate.adjustments.grout.some(
              (a) =>
                JSON.stringify(a) !==
                JSON.stringify(
                  s.doc!.adjustments.grout.find((old) => old.id === a.id),
                ),
            ) ||
            s.doc.adjustments.grout.some(
              (a) =>
                !candidate.adjustments.grout.some((next) => next.id === a.id) &&
                a.floorId !== s.activeFloorId,
            ))
        )
          throw new Error(
            "Restaure somente ajustes de graute do pavimento ativo.",
          );
        const changed = changedInputs(s.doc, candidate);
        const doc = validateProject(
          {
            ...(command === "resize"
              ? reconcileOpenings(s.doc, candidate)
              : candidate),
            adjustments:
              !changed || command === "restore-grouts"
                ? candidate.adjustments
                : {
                    ...candidate.adjustments,
                    grout: candidate.adjustments.grout
                      .map((a) => ({
                        ...a,
                        wallIds: a.wallIds.filter((id) =>
                          candidate.model.walls.some((w) => w.id === id),
                        ),
                      }))
                      .filter((a) => a.wallIds.length),
                    channels: candidate.adjustments.channels.filter((a) =>
                      candidate.model.walls.some((w) => w.id === a.wallId),
                    ),
                    junctions: candidate.adjustments.junctions
                      .map((a) => {
                        const wallIds = a.wallIds.filter((id) =>
                          candidate.model.walls.some((w) => w.id === id),
                        );
                        const applicable =
                          wallIds.length === a.wallIds.length &&
                          signature(
                            candidate.model.walls.filter((w) =>
                              wallIds.includes(w.id),
                            ),
                          ) === a.signature;
                        const geometryChanged =
                          wallIds.length !== a.wallIds.length ||
                          wallIds.some(
                            (id) =>
                              s.doc!.model.walls.find((w) => w.id === id)
                                ?.height !==
                              candidate.model.walls.find((w) => w.id === id)
                                ?.height,
                          ) ||
                          signature(
                            s.doc!.model.walls.filter((w) =>
                              a.wallIds.includes(w.id),
                            ),
                          ) !==
                            signature(
                              candidate.model.walls.filter((w) =>
                                wallIds.includes(w.id),
                              ),
                            );
                        return {
                          ...a,
                          wallIds,
                          binding:
                            !geometryChanged || applicable
                              ? a.binding
                              : ("pending" as const),
                        };
                      })
                      .filter((a) => a.wallIds.length),
                  },
            generated: changed ? null : s.doc.generated,
            generationState: changed
              ? { status: "outdated", diagnostics: [] }
              : s.doc.generationState,
            metadata: {
              ...candidate.metadata,
              appVersion: "0.16.0",
              updatedAt: new Date().toISOString(),
            },
          },
          false,
        );
        const added = doc.model.floors.find(
          (f) => !s.doc!.model.floors.some((old) => old.id === f.id),
        );
        const oldIndex = s.doc.model.floors.findIndex(
          (f) => f.id === s.activeFloorId,
        );
        const active =
          added?.id ??
          (doc.model.floors.some((f) => f.id === s.activeFloorId)
            ? s.activeFloorId
            : (doc.model.floors[Math.max(0, oldIndex - 1)]?.id ??
              doc.model.floors[0].id));
        set({
          activeFloorId: active,
          retainedGroutResult: retainGroutResult(s.doc, doc),
          ...referenceState(doc, active, s),
          coursesByFloor: {
            ...s.coursesByFloor,
            ...(s.activeFloorId ? { [s.activeFloorId]: s.course } : {}),
          },
          ...(active !== s.activeFloorId
            ? {
                select: null,
                course: s.coursesByFloor[active!] ?? 1,
                slabDraft: null,
                slabEditing: false,
              }
            : {}),
          preview: null,
          pendingOpening: null,
          channelBand: null,
          groutCell: null,
          component: null,
          diagnosticWalls: [],
          doc,
          imageDraft: null,
          furnitureDraft: null,
          imageOpacity: null,
          history: remember(s.history, s.doc),
          message: "",
        });
        await persist(doc, changed);
      } catch (e) {
        set({ message: e instanceof Error ? e.message : String(e) });
      }
    },
    undo: async (redo = false) => {
      const s = get();
      if (retired || !s.doc || s.busy || s.readonly) return;
      if (s.terrainDraft || s.terrainEditing) {
        set({ terrainDraft: null, terrainEditing: false });
        return;
      }
      if (s.furnitureDraft) {
        set({ furnitureDraft: null });
        return;
      }
      if (s.imageDraft) {
        set({ imageDraft: null });
        return;
      }
      if (s.slabDraft || s.slabEditing) {
        set({ slabDraft: null, slabEditing: false });
        return;
      }
      const next = travel(s.history, s.doc, redo);
      if (next) {
        const doc = {
          ...next.doc,
          generated: changedInputs(s.doc, next.doc) ? null : s.doc.generated,
          generationState: changedInputs(s.doc, next.doc)
            ? next.doc.generationState
            : s.doc.generationState,
          metadata: {
            ...next.doc.metadata,
            updatedAt: new Date().toISOString(),
          },
        };
        const active = doc.model.floors.some((f) => f.id === s.activeFloorId)
          ? s.activeFloorId
          : doc.model.floors[0].id;
        set({
          ...(active !== s.activeFloorId
            ? {
                ...inspection,
                mode: s.mode,
                course: s.coursesByFloor[active!] ?? 1,
              }
            : {}),
          preview: null,
          pendingOpening: null,
          doc,
          retainedGroutResult: retainGroutResult(s.doc, doc),
          activeFloorId: active,
          ...referenceState(doc, active, s),
          coursesByFloor: {
            ...s.coursesByFloor,
            ...(s.activeFloorId ? { [s.activeFloorId]: s.course } : {}),
          },
          history: next.history,
          select: null,
        });
        await persist(doc, changedInputs(s.doc, next.doc));
      }
    },
    discard: async () => {
      const s = get();
      if (!s.doc || s.busy) return;
      const id = s.doc.project.id;
      if (s.saved === "uncertain") {
        set({
          message:
            "Confira a confirmação por Tentar novamente antes de descartar. Você pode baixar sua versão em memória.",
        });
        return;
      }
      forgetProject(id);
      if (s.saved === "conflict") {
        await get().open(id, true);
        return;
      }
      if (checkpoint?.doc?.project.id === id)
        set({
          ...checkpoint,
          readonly: false,
          saved: "saved",
          message: "",
          retainedGroutResult: null,
          ...inspection,
        });
      else {
        set({ readonly: false, saved: "saved" });
        get().close();
      }
    },
    retry: async () => {
      const s = get();
      if (
        !retired &&
        s.doc &&
        !s.busy &&
        (s.saved === "unavailable" || (s.saved === "saved" && s.readonly))
      ) {
        set({ busy: true });
        try {
          await checkRevision(s.doc.project.id);
          set({ readonly: false, saved: "saved", message: "" });
        } catch (error) {
          set({
            readonly: true,
            saved:
              pendingErrorKind(error) === "conflito"
                ? "conflict"
                : "unavailable",
            message: error instanceof Error ? error.message : String(error),
          });
        } finally {
          set({ busy: false });
        }
        return;
      }
      if (!retired && s.doc && !s.busy)
        await persist(
          s.doc,
          s.doc.generationState.status === "outdated",
          s.saved !== "saved",
        );
    },
  };
});

if (import.meta.hot) {
  import.meta.hot.dispose(async () => {
    // A replaced store must finish its current write before replacement,
    // and must not start new writes while Vite loads its replacement.
    retired = true;
    if (useStore.getState().busy)
      await new Promise<void>((resolve) => {
        const unsubscribe = useStore.subscribe((state) => {
          if (!state.busy) {
            unsubscribe();
            resolve();
          }
        });
      });
  });
}

export function editingProject(s: Pick<State, "doc" | "activeFloorId">) {
  return s.doc
    ? floorView(s.doc, s.activeFloorId ?? s.doc.model.floors[0].id)
    : null;
}
export function useEditingProject() {
  const doc = useStore((s) => s.doc),
    activeFloorId = useStore((s) => s.activeFloorId);
  return useMemo(
    () => editingProject({ doc, activeFloorId }),
    [doc, activeFloorId],
  );
}

// Display only: the saved document and every editing path keep generated=null
// until the new calculation has finished.
export function useCourseDisplayComposition() {
  const doc = useStore((s) => s.doc),
    activeFloorId = useStore((s) => s.activeFloorId),
    retained = useStore((s) => s.retainedGroutResult);
  return useMemo(
    () =>
      doc
        ? floorView(
            { ...doc, generated: doc.generated ?? retained },
            activeFloorId ?? doc.model.floors[0].id,
          ).generated
        : null,
    [doc, activeFloorId, retained],
  );
}
