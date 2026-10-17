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
let release: (() => void) | null = null;
const changedInputs = (previous: Project, next: Project) =>
  JSON.stringify([
    {
      ...previous.model,
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
  mode: "plan" | "course";
  course: number;
  ghost: "none" | "previous" | "next";
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
  mode: "plan",
  course: 1,
  ghost: "none",
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
    command?: "resize" | "move" | "create/merge" | "floor",
  ) => Promise<void>;
  undo: (redo?: boolean) => Promise<void>;
  notify: (message: string) => void;
  choose: (id: string | null) => void;
  retry: () => Promise<void>;
};
export const useStore = create<State>((set, get) => {
  async function persist(doc: Project) {
    doc = { ...doc, metadata: { ...doc.metadata, appVersion: "0.8.0" } };
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
      if (doc.generationState.status === "outdated") {
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
  return {
    ...inspection,
    inspect: (change) =>
      set({
        ...change,
        ...(change.mode === "plan"
          ? { groutMode: false, groutCell: null }
          : {}),
      }),
    activeFloorId: null,
    coursesByFloor: {},
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
    choose: (select) => set({ select, diagnosticWalls: [] }),
    open: async (requested, fresh = false) => {
      if (get().busy) return;
      set({ busy: true, message: "" });
      let nextRelease: (() => void) | null = null;
      try {
        nextRelease = await acquireProject(requested.project.id);
        const doc = fresh
          ? validateProject(requested)
          : await loadProject(requested.project.id);
        release?.();
        release = nextRelease;
        set({
          ...inspection,
          doc,
          activeFloorId: doc.model.floors[0].id,
          coursesByFloor: {},
          readonly: !release,
          history: { past: [], future: [] },
          select: null,
          saved: "saved",
          message: !release
            ? "Este projeto está aberto em outra aba. Feche a outra aba e reabra este projeto para editar."
            : "",
        });
        if (release && (fresh || doc.generationState.status === "outdated"))
          await persist(doc);
      } catch (e) {
        nextRelease?.();
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
        select: null,
        readonly: false,
        history: { past: [], future: [] },
      });
    },
    commit: async (candidate, command = "resize") => {
      const s = get();
      if (s.busy || s.readonly || !s.doc) return;
      try {
        candidate = mergeFloorView(s.doc, candidate);
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
              appVersion: "0.8.0",
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
          coursesByFloor: {
            ...s.coursesByFloor,
            ...(s.activeFloorId ? { [s.activeFloorId]: s.course } : {}),
          },
          ...(active !== s.activeFloorId
            ? { select: null, course: s.coursesByFloor[active!] ?? 1 }
            : {}),
          preview: null,
          pendingOpening: null,
          channelBand: null,
          groutCell: null,
          component: null,
          diagnosticWalls: [],
          doc,
          history: remember(s.history, s.doc),
          message: "",
        });
        await persist(doc);
      } catch (e) {
        set({ message: e instanceof Error ? e.message : String(e) });
      }
    },
    undo: async (redo = false) => {
      const s = get();
      if (!s.doc || s.busy || s.readonly) return;
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
          coursesByFloor: {
            ...s.coursesByFloor,
            ...(s.activeFloorId ? { [s.activeFloorId]: s.course } : {}),
          },
          history: next.history,
          select: null,
        });
        await persist(doc);
      }
    },
    retry: async () => {
      const s = get();
      if (s.doc && !s.busy && !s.readonly) await persist(s.doc);
    },
  };
});

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
