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
import {
  acquireProject,
  loadProject,
  saveProject,
} from "../persistence/database";
import { validateProject } from "../persistence/files";
import { mergeFloorView } from "../domain/floors";
import { useMemo } from "react";
import { reconcileOpenings } from "../domain/openings";
import { constructionOpenings } from "../domain/opening-appearance";
import {
  resolveFloorReference,
  type FloorReference,
} from "../domain/floor-reference";
let release: (() => void) | null = null;
let retired = false;
const changedInputs = (previous: Project, next: Project) =>
  JSON.stringify([
    {
      ...previous.model,
      openings: constructionOpenings(previous.model.openings),
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
  activeFloorId: string | null;
  coursesByFloor: Record<string, number>;
  floorReferencesByFloor: Record<string, FloorReference>;
  switchFloor: (id: string) => void;
  history: History;
  busy: boolean;
  readonly: boolean;
  saved: "saved" | "saving" | "error";
  message: string;
  select: string | null;
  open: (doc: Project, fresh?: boolean) => Promise<void>;
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
      | "furniture",
  ) => Promise<void>;
  undo: (redo?: boolean) => Promise<void>;
  notify: (message: string) => void;
  choose: (id: string | null) => void;
  retry: () => Promise<void>;
};
export const useStore = create<State>((set, get) => {
  async function persist(doc: Project, calculate = true) {
    doc = { ...doc, metadata: { ...doc.metadata, appVersion: "0.15.1" } };
    set({ doc });
    set({ busy: true, saved: "saving" });
    let saveFailed = false;
    let courseMessage = "";
    try {
      try {
        await saveProject(doc);
      } catch {
        saveFailed = true;
      }
      if (calculate && doc.generationState.status === "outdated") {
        if (typeof requestAnimationFrame === "function")
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => setTimeout(resolve, 0)),
          );
        let generated;
        try {
          generated = generate(doc);
        } catch (e) {
          set({
            saved: saveFailed ? "error" : "saved",
            message: `Cálculo não concluído: ${e instanceof Error ? e.message : String(e)}. ${saveFailed ? "O trabalho está em memória; baixe uma cópia." : "O modelo foi salvo; tente recalcular."}`,
          });
          return;
        }
        const current: Project = {
          ...doc,
          generated,
          generationState: {
            status: "current",
            diagnostics: generated.diagnostics,
          },
        };
        const s = get();
        const total =
          generated.floors.find((f) => f.floorId === s.activeFloorId)?.courses
            .length ?? 0;
        const course = Math.min(s.course, Math.max(1, total));
        if (course !== s.course)
          courseMessage =
            total > 0
              ? `A fiada anterior deixou de existir. Selecionada a fiada ${total}.`
              : "Este pavimento não tem fiadas disponíveis.";
        set({ doc: current, course });
        await saveProject(current);
        saveFailed = false;
      }
      set({
        saved: saveFailed ? "error" : "saved",
        message: saveFailed
          ? "A primeira gravação falhou. O trabalho e o cálculo foram preservados; baixe uma cópia ou tente salvar."
          : courseMessage,
      });
    } catch {
      set({
        saved: "error",
        message:
          "Não foi possível salvar no navegador. Seu trabalho está nesta aba; baixe uma cópia antes de sair.",
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
    history: { past: [], future: [] },
    busy: false,
    readonly: false,
    saved: "saved",
    message: "",
    select: null,
    notify: (message) => set({ message }),
    choose: (select) =>
      set((s) => ({
        select,
        diagnosticWalls: [],
        ...(select !== s.select
          ? {
              slabDraft: null,
              slabEditing: false,
              imageDraft: null,
              imageOpacity: null,
            }
          : {}),
      })),
    open: async (requested, fresh = false) => {
      if (retired || get().busy) return;
      // A delayed/repeated open must not compete with the lock already owned
      // by this store, or replace unsaved work with an older stored document.
      const ownedRelease =
        get().doc?.project.id === requested.project.id ? release : null;
      if (ownedRelease && !fresh) return;
      set({ busy: true, message: "" });
      let nextRelease: (() => void) | null = null;
      try {
        nextRelease =
          ownedRelease ?? (await acquireProject(requested.project.id));
        let doc = fresh
          ? validateProject(requested)
          : await loadProject(requested.project.id);
        if (typeof Image !== "undefined") {
          await decodeCustomAssets(doc.model.customImageAssets);
          await decodeCatalogElements(doc.model.imageElements);
          for (const image of doc.model.referenceImages)
            await decodeReference(image);
        }
        let calculationMessage = "";
        // A read-only tab may update disposable results in memory, never the shared record.
        if (!nextRelease && doc.generationState.status === "outdated") {
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
          } catch (e) {
            calculationMessage = `Cálculo não concluído: ${e instanceof Error ? e.message : String(e)}. O desenho foi preservado; baixe uma cópia ou reabra para tentar novamente.`;
          }
        }
        if (release !== nextRelease) release?.();
        release = nextRelease;
        set({
          ...inspection,
          doc,
          activeFloorId: doc.model.floors[0].id,
          coursesByFloor: {},
          floorReferencesByFloor: {},
          readonly: !release,
          history: { past: [], future: [] },
          select: null,
          saved: "saved",
          message: !release
            ? `Este projeto está aberto em outra aba. Feche a outra aba e reabra este projeto para editar.${calculationMessage ? ` ${calculationMessage}` : ""}`
            : "",
        });
        if (release && (fresh || doc.generationState.status === "outdated"))
          await persist(doc);
      } catch (e) {
        if (nextRelease !== release) nextRelease?.();
        set({ message: String(e instanceof Error ? e.message : e) });
      } finally {
        set({ busy: false });
      }
    },
    close: () => {
      if (get().busy) return;
      release?.();
      release = null;
      set({
        doc: null,
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
        const changed = changedInputs(s.doc, candidate);
        const doc = validateProject(
          {
            ...(command === "resize"
              ? reconcileOpenings(s.doc, candidate)
              : candidate),
            adjustments: !changed
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
              appVersion: "0.15.1",
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
    retry: async () => {
      const s = get();
      if (!retired && s.doc && !s.busy && !s.readonly) await persist(s.doc);
    },
  };
});

if (import.meta.hot) {
  import.meta.hot.dispose(async () => {
    // A replaced store must finish its current write before releasing ownership,
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
    release?.();
    release = null;
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
