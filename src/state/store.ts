import { reconcileRooms } from "../domain/rooms";
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
import type { TextDraft } from "../domain/text";
import { reconcileOpenings } from "../domain/openings";
import { constructionOpenings } from "../domain/opening-appearance";
import {
  resolveFloorReference,
  type FloorReference,
} from "../domain/floor-reference";
let retired = false;
type Snapshot = {
  doc: Project;
  history: History;
  activeFloorId: string | null;
  calculate: boolean;
};
const changedInputs = (previous: Project, next: Project) =>
  JSON.stringify([
    {
      ...previous.model,
      texts: undefined,
      openings: constructionOpenings(previous.model.openings),
      terrain: undefined,
      measurements: undefined,
      roomLabels: undefined,
      roomBoundaries: undefined,
      referenceImages: undefined,
      imageElements: undefined,
      customImageAssets: undefined,
      floors: previous.model.floors.map((f) => ({
        id: f.id,
        level: f.level,
        defaultHeight: f.defaultHeight,
        groutMode: f.groutMode,
        clamps: f.clamps,
        channelReinforcement: f.channelReinforcement,
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
      texts: undefined,
      openings: constructionOpenings(next.model.openings),
      terrain: undefined,
      measurements: undefined,
      roomLabels: undefined,
      roomBoundaries: undefined,
      referenceImages: undefined,
      imageElements: undefined,
      customImageAssets: undefined,
      floors: next.model.floors.map((f) => ({
        id: f.id,
        level: f.level,
        defaultHeight: f.defaultHeight,
        groutMode: f.groutMode,
        clamps: f.clamps,
        channelReinforcement: f.channelReinforcement,
      })),
    },
    next.adjustments,
    next.project.base,
    next.project.openingSettings,
    next.project.channelLevels,
    next.project.groutSettings,
  ]);
type Inspection = {
  textDraft: TextDraft | null;
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
  focus: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    scale?: number;
  } | null;
  pendingOpening: Opening | null;
  roomNameRequest: string | null;
  channelBand: string | null;
  groutMode: boolean;
  groutCell: { x: number; y: number; wallIds: string[] } | null;
  diagnosticWalls: string[];
};
const inspection: Inspection = {
  textDraft: null,
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
  roomNameRequest: null,
  channelBand: null,
  groutMode: false,
  groutCell: null,
  diagnosticWalls: [],
};
type State = Inspection & {
  propertiesCollapsed: boolean;
  setPropertiesCollapsed: (collapsed: boolean) => void;
  inspect: (change: Partial<Inspection>) => void;
  doc: Project | null;
  retainedGroutResult: Project["generated"];
  activeFloorId: string | null;
  coursesByFloor: Record<string, number>;
  floorReferencesByFloor: Record<string, FloorReference>;
  switchFloor: (id: string) => void;
  history: History;
  busy: boolean;
  saving: boolean;
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
      | "room"
      | "image"
      | "furniture"
      | "terrain"
      | "restore-grouts"
      | "text"
      | "budget",
  ) => Promise<void>;
  undo: (redo?: boolean) => Promise<void>;
  notify: (message: string) => void;
  choose: (id: string | null) => void;
  retry: () => Promise<void>;
  recalculate: () => Promise<void>;
  suspend: (message?: string) => void;
  discard: () => Promise<void>;
};
type Handoff = {
  state: State;
  queued: Snapshot | null;
  attempt: Snapshot | null;
  calculationPending: Snapshot | null;
  checkpoint: Pick<State, "doc" | "history" | "activeFloorId"> | null;
  suspended: boolean;
  lastWriteStarted: number | null;
};
const incomingHandoff = import.meta.hot?.data.handoff as
  Promise<Handoff> | undefined;
const incomingState = import.meta.hot?.data.state as State | undefined;
const stateValues = (state: State) =>
  Object.fromEntries(
    Object.entries(state).filter(([, value]) => typeof value !== "function"),
  ) as Partial<State>;
let handoff: () => Promise<Handoff>;
export const useStore = create<State>((set, get) => {
  let queued: Snapshot | null = null;
  let attempt: Snapshot | null = null;
  let calculationPending: Snapshot | null = null;
  let draining: Promise<void> | null = null;
  let suspended = false;
  let suspensionEpoch = 0;
  let lastWriteStarted: number | null = null;
  let wake: (() => void) | null = null;
  let checkpoint: Pick<State, "doc" | "history" | "activeFloorId"> | null =
    null;
  handoff = async () => {
    if (get().busy || get().saving)
      await new Promise<void>((resolve) => {
        const unsubscribe = useStore.subscribe((state) => {
          if (!state.busy && !state.saving) {
            unsubscribe();
            resolve();
          }
        });
      });
    return {
      state: get(),
      queued,
      attempt,
      calculationPending,
      checkpoint,
      suspended,
      lastWriteStarted,
    };
  };
  if (incomingHandoff)
    void incomingHandoff.then((previous) => {
      ({
        queued,
        attempt,
        calculationPending,
        checkpoint,
        suspended,
        lastWriteStarted,
      } = previous);
      // Preserve session work, while installing the replacement module's actions.
      set(stateValues(previous.state));
    });
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
  async function calculateDocument(doc: Project) {
    let courseMessage = "";
    if (doc.generationState.status === "outdated") {
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
          message: `Modelo salvo. Cálculo não concluído: ${error instanceof Error ? error.message : String(error)}. Use Recalcular.`,
        });
        return doc;
      }
    }
    set({ doc, message: courseMessage });
    return doc;
  }
  function fail(error: unknown) {
    suspended = true;
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
      terrainDraft: null,
      terrainEditing: false,
      furnitureDraft: null,
      slabDraft: null,
      slabEditing: false,
      imageDraft: null,
      imageRequest: null,
      imageOpacity: null,
      pendingOpening: null,
    });
  }
  // The slot is occupied before preparing resources. Only the latest unsent
  // snapshot is retained; history still records every accepted gesture.
  function drain(): Promise<void> {
    if (draining) return draining;
    const run = async () => {
      try {
        while (!suspended && (attempt || queued || calculationPending)) {
          if (calculationPending) {
            const snapshot = calculationPending;
            const calculated = await calculateDocument(snapshot.doc);
            checkpoint = {
              doc: calculated,
              history: snapshot.history,
              activeFloorId: snapshot.activeFloorId,
            };
            calculationPending = null;
            continue;
          }
          if (!attempt) {
            const delay =
              lastWriteStarted === null
                ? 0
                : Math.max(0, lastWriteStarted + 1000 - Date.now());
            if (delay)
              await new Promise<void>((resolve) => {
                const timer = setTimeout(() => {
                  wake = null;
                  resolve();
                }, delay);
                wake = () => {
                  clearTimeout(timer);
                  wake = null;
                  resolve();
                };
              });
            if (suspended) break;
            attempt = queued;
            queued = null;
          }
          const snapshot = attempt!;
          const receipt = await saveProject(snapshot.doc, () => {
            lastWriteStarted = Date.now();
          });
          let confirmed = snapshot.doc;
          if (receipt?.updatedAt)
            confirmed = {
              ...confirmed,
              metadata: {
                ...confirmed.metadata,
                updatedAt: receipt.updatedAt,
                createdAt: receipt.createdAt ?? confirmed.metadata.createdAt,
              },
            };
          checkpoint = {
            doc: confirmed,
            history: snapshot.history,
            activeFloorId: snapshot.activeFloorId,
          };
          attempt = null;
          // A response may acknowledge an older local intention. Never restore
          // its drawing, resources, inspection or history over newer work.
          if (get().doc === snapshot.doc) set({ doc: confirmed });
          if (snapshot.calculate) {
            if (suspended) {
              // The write is confirmed, but offline recovery must finish the
              // constructive calculation before releasing editing.
              calculationPending = { ...snapshot, doc: confirmed };
              break;
            }
            const calculated = await calculateDocument(confirmed);
            checkpoint = { ...checkpoint, doc: calculated };
          }
        }
        if (!suspended) set({ saved: "saved", readonly: false });
      } catch (error) {
        fail(error);
      } finally {
        set({ busy: false, saving: false });
      }
    };
    // Assign before any async completion can release the slot.
    draining = run().finally(() => {
      draining = null;
    });
    return draining;
  }
  async function persist(
    doc: Project,
    calculate = true,
    write = true,
    background = false,
  ) {
    if (!write) {
      set({ busy: true });
      try {
        doc = await calculateDocument(doc);
        checkpoint = {
          doc,
          history: get().history,
          activeFloorId: get().activeFloorId,
        };
      } finally {
        set({ busy: false });
      }
      return;
    }
    doc = { ...doc, metadata: { ...doc.metadata, appVersion: "0.17.0" } };
    queued = {
      doc,
      calculate,
      history: get().history,
      activeFloorId: get().activeFloorId,
    };
    set({
      doc,
      saving: true,
      saved: "saving",
      busy: !background || get().busy,
    });
    const completion = drain();
    if (!background) await completion;
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
    propertiesCollapsed: false,
    setPropertiesCollapsed: (propertiesCollapsed) =>
      set({ propertiesCollapsed }),
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
                textDraft: null,
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
    busy: !!incomingHandoff,
    saving: !!incomingHandoff,
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
              textDraft: null,
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
      if (retired || get().busy || get().saving) return;
      const id =
        typeof requested === "string" ? requested : requested.project.id;
      if (get().doc?.project.id === id && !fresh) return;
      suspended = false;
      queued = attempt = calculationPending = null;
      lastWriteStarted = null;
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
      if (get().busy || get().saving) return;
      if (get().doc) forgetProject(get().doc!.project.id);
      checkpoint = null;
      queued = attempt = calculationPending = null;
      suspended = false;
      lastWriteStarted = null;
      set({
        doc: null,
        textDraft: null,
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
        if (
          command === "text" &&
          [...candidate.model.texts, ...s.doc.model.texts].some(
            (t) =>
              t.floorId !== s.activeFloorId &&
              JSON.stringify(
                candidate.model.texts.find((x) => x.id === t.id),
              ) !==
                JSON.stringify(s.doc!.model.texts.find((x) => x.id === t.id)),
          )
        )
          throw new Error("Edite textos somente no pavimento ativo.");
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
        if (
          command === "room" &&
          [
            ...candidate.model.roomLabels,
            ...candidate.model.roomBoundaries,
            ...s.doc.model.roomLabels,
            ...s.doc.model.roomBoundaries,
          ].some(
            (m) =>
              m.floorId !== s.activeFloorId &&
              JSON.stringify(
                [
                  ...candidate.model.roomLabels,
                  ...candidate.model.roomBoundaries,
                ].find((x) => x.id === m.id),
              ) !==
                JSON.stringify(
                  [
                    ...s.doc!.model.roomLabels,
                    ...s.doc!.model.roomBoundaries,
                  ].find((x) => x.id === m.id),
                ),
          )
        )
          throw new Error("Edite ambientes somente no pavimento ativo.");
        candidate = reconcileRooms(s.doc, candidate);
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
        await persist(doc, changed, true, !changed);
      } catch (e) {
        set({ message: e instanceof Error ? e.message : String(e) });
      }
    },
    undo: async (redo = false) => {
      const s = get();
      if (
        retired ||
        !s.doc ||
        s.busy ||
        s.readonly ||
        s.saved !== "saved" ||
        s.saving
      )
        return;
      if (s.textDraft) {
        set({ textDraft: null });
        return;
      }
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
        const changed = changedInputs(s.doc, next.doc);
        await persist(doc, changed, true, !changed);
      }
    },
    discard: async () => {
      const s = get();
      if (!s.doc || s.busy || s.saving) return;
      const id = s.doc.project.id;
      if (s.saved === "uncertain") {
        set({
          message:
            "Confira a confirmação por Tentar novamente antes de descartar. Você pode baixar sua versão em memória.",
        });
        return;
      }
      forgetProject(id);
      queued = attempt = calculationPending = null;
      suspended = false;
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
      if (retired || !s.doc || s.busy || s.saving) return;
      const recoveryEpoch = suspensionEpoch;
      if (attempt || queued || calculationPending) {
        set({ busy: true, saving: true, saved: "saving", message: "" });
        try {
          if (!attempt) await checkRevision(s.doc.project.id);
          if (recoveryEpoch !== suspensionEpoch) {
            set({ busy: false, saving: false });
            return;
          }
          suspended = false;
          await drain();
        } catch (error) {
          fail(error);
          set({ busy: false, saving: false });
        }
        return;
      }
      if (
        !retired &&
        s.doc &&
        !s.busy &&
        (s.saved === "unavailable" || (s.saved === "saved" && s.readonly))
      ) {
        set({ busy: true });
        try {
          await checkRevision(s.doc.project.id);
          if (recoveryEpoch !== suspensionEpoch) return;
          suspended = false;
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
    recalculate: async () => {
      const s = get();
      if (
        retired ||
        !s.doc ||
        s.busy ||
        s.saving ||
        s.readonly ||
        s.saved !== "saved"
      )
        return;
      await persist(s.doc, true, false);
    },
    suspend: (
      message = "Sem conexão. O desenho foi preservado. Use Tentar novamente para conferir o servidor antes de editar.",
    ) => {
      if (!get().doc) return;
      suspensionEpoch++;
      suspended = true;
      wake?.();
      set({
        readonly: true,
        saved: "unavailable",
        message,
        terrainDraft: null,
        terrainEditing: false,
        furnitureDraft: null,
        imageDraft: null,
        imageRequest: null,
        imageOpacity: null,
        slabDraft: null,
        slabEditing: false,
        pendingOpening: null,
      });
    },
    ...(incomingState
      ? { ...stateValues(incomingState), busy: true, saving: true }
      : {}),
  };
});

if (import.meta.hot) {
  import.meta.hot.dispose((data) => {
    // A replaced store must finish its current write before replacement,
    // and must not start new writes while Vite loads its replacement.
    retired = true;
    data.state = useStore.getState();
    data.handoff = handoff();
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
