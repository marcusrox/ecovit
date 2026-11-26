import { CURRENT_PROJECT_FORMAT } from "../src/domain/project-format";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createProject, type Project } from "../src/domain/project";
import {
  newText,
  putText,
  textSchema,
  textWorld,
  textLocal,
  textBox,
  wrapText,
} from "../src/domain/text";
import {
  validateProject,
  parseFile,
  serializeFile,
  importedCopy,
} from "../src/persistence/files";
import {
  duplicateFloor,
  removeFloor,
  mergeFloorView,
} from "../src/domain/floors";
import { floorView } from "../src/domain/composition";
import * as engine from "../src/domain/composition";
vi.mock("../src/persistence/remote", () => ({
  saveProject: vi.fn().mockResolvedValue({ revision: "1" }),
  loadProject: vi.fn(),
  forgetProject: vi.fn(),
  pendingErrorKind: () => "falhou",
}));
import { saveProject } from "../src/persistence/remote";
import { useStore } from "../src/state/store";
const state = () => useStore.getState();
const project = () =>
  createProject("Texto", { length: 2500, width: 1250, height: 700 });
const text = (d: Project) =>
  textSchema.parse({
    ...newText(d.model.floors[0].id, { x: 1000, y: -2000 }),
    content: "Observação",
  });
beforeEach(() => {
  vi.mocked(saveProject).mockResolvedValue({ revision: "1" } as Awaited<
    ReturnType<typeof saveProject>
  >);
});
afterEach(() => {
  state().close();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
it("valida limites, normaliza antes da contagem e preserva espaços/quebras", () => {
  const t = text(project());
  expect(textSchema.parse({ ...t, content: "  A\r\n\rB  " }).content).toBe(
    "  A\n\nB  ",
  );
  expect(
    textSchema.parse({ ...t, content: "\r\n".repeat(1999) + "A" }).content,
  ).toHaveLength(2000);
  for (const content of ["", " \n ", "a".repeat(2001)])
    expect(() => textSchema.parse({ ...t, content })).toThrow();
  for (const patch of [
    { size: 99 },
    { size: 10001 },
    { size: 1000.5 },
    { width: 1999 },
    { width: 1000001 },
    { width: NaN },
    { rotation: 45 },
    { color: "red" },
    { color: "#ffffff80" },
    { height: 100 },
  ])
    expect(() => textSchema.parse({ ...t, ...patch })).toThrow();
  expect(textSchema.parse({ ...t, size: 100, width: 200 })).toMatchObject({
    size: 100,
    width: 200,
  });
  expect(textSchema.parse({ ...t, size: 10000, width: 1000000 })).toMatchObject(
    { size: 10000, width: 1000000 },
  );
});
it.each([0, 90, 180, 270] as const)(
  "transformações e caixa completa na orientação %i",
  (rotation) => {
    const t = { ...text(project()), rotation };
    const local = { x: t.width, y: 1234 },
      world = textWorld(t, local);
    expect(textLocal(t, world).x).toBeCloseTo(local.x);
    expect(textLocal(t, world).y).toBeCloseTo(local.y);
    const box = textBox(t, 5000);
    expect(box.width).toBeCloseTo(rotation % 180 ? 5000 : t.width);
    expect(box.height).toBeCloseTo(rotation % 180 ? t.width : 5000);
    expect(textWorld(t, { x: 0, y: 0 })).toEqual({ x: t.x, y: t.y });
  },
);
it("quebra palavras longas por caracteres completos e conserva parágrafos vazios", () => {
  const measure = (s: string) =>
    [...new Intl.Segmenter("pt-BR", { granularity: "grapheme" }).segment(s)]
      .length;
  const input = "abc defghijkl\n\ne\u0301e\u0301😀😀";
  const lines = wrapText(input, 4, measure);
  expect(lines.every((s) => measure(s) <= 4)).toBe(true);
  expect(lines).toContain("");
  expect(lines.join("")).toBe(input.replace(/\n/g, ""));
  expect(lines.at(-1)).toBe("e\u0301e\u0301😀😀");
});
it("formato 31 preserva textos no arquivo/remoto e normaliza legados sem aceitar textos novos em envelopes antigos", () => {
  const d = project(),
    t = text(d),
    doc = putText(d, t);
  const loaded = parseFile(serializeFile(doc).text);
  expect(loaded.model.texts).toEqual([t]);
  expect(loaded.schemaVersion).toBe(CURRENT_PROJECT_FORMAT);
  expect(importedCopy(loaded).model.texts).toEqual([t]);
  for (const patch of [
    { floorId: crypto.randomUUID() },
    { id: d.project.id },
    { color: "invalid" },
    { rotation: 360 },
  ])
    expect(() =>
      validateProject({
        ...doc,
        model: { ...doc.model, texts: [{ ...t, ...patch }] },
      }),
    ).toThrow();
  expect(() => validateProject({ ...doc, schemaVersion: 30 })).toThrow(
    "textos em formato anterior",
  );
  const { texts, ...oldModel } = d.model;
  void texts;
  expect(
    validateProject({ ...d, schemaVersion: 30, model: oldModel }).model.texts,
  ).toEqual([]);
  expect(() =>
    validateProject({ ...doc, schemaVersion: CURRENT_PROJECT_FORMAT + 1 }),
  ).toThrow("Formato incompatível");
});
it("duplicação/remoção de pavimento e merge preservam isolamento e ordem dos textos", () => {
  const d = project(),
    t = text(d),
    original = putText(d, t);
  const copied = duplicateFloor(original, t.floorId, 28000, "Superior"),
    second = copied.model.floors[1].id;
  expect(copied.model.texts).toHaveLength(2);
  expect(copied.model.texts[1]).toMatchObject({
    content: t.content,
    floorId: second,
  });
  expect(copied.model.texts[1].id).not.toBe(t.id);
  const local = floorView(copied, second);
  expect(local.model.texts).toHaveLength(1);
  const merged = mergeFloorView(
    copied,
    putText(local, { ...local.model.texts[0], content: "Novo" }),
  );
  expect(merged.model.texts.find((x) => x.id === t.id)).toEqual(t);
  expect(removeFloor(merged, second).model.texts).toEqual([t]);
});
it("histórico de texto preserva composição/diagnósticos e não chama motor", async () => {
  await state().open(project(), true);
  const d = state().doc!,
    generated = d.generated,
    diagnostics = d.generationState;
  const generate = vi.spyOn(engine, "generate");
  await state().commit(putText(d, text(d)), "text");
  await vi.waitFor(() => expect(state().saved).toBe("saved"));
  expect(state().doc!.generated).toEqual(generated);
  expect(state().doc!.generationState).toEqual(diagnostics);
  expect(state().history.past).toHaveLength(1);
  await state().undo();
  await vi.waitFor(() => expect(state().saved).toBe("saved"));
  expect(state().doc!.model.texts).toEqual([]);
  await state().undo(true);
  await vi.waitFor(() => expect(state().saved).toBe("saved"));
  expect(state().doc!.model.texts).toHaveLength(1);
  expect(generate).not.toHaveBeenCalled();
});
it("resposta atrasada não apaga edição ou rascunho posterior; rejeição conserva download", async () => {
  await state().open(project(), true);
  let resolve!: (r: Awaited<ReturnType<typeof saveProject>>) => void;
  vi.mocked(saveProject).mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const d = state().doc!,
    t = text(d);
  await state().commit(putText(d, t), "text");
  await state().commit(putText(state().doc!, { ...t, x: 2000 }), "text");
  const draft = {
    annotation: { ...t, content: "Rascunho" },
    width: "200",
    size: "10",
    fresh: false,
    placing: false,
    focus: false,
  };
  state().inspect({ textDraft: draft });
  resolve({ revision: "2" } as Awaited<ReturnType<typeof saveProject>>);
  await vi.waitFor(() => expect(state().saved).toBe("saved"));
  expect(state().doc!.model.texts[0].x).toBe(2000);
  expect(state().textDraft).toBe(draft);
  state().inspect({ textDraft: null });
  vi.mocked(saveProject).mockRejectedValueOnce(new Error("recusa"));
  await state().commit(
    putText(state().doc!, { ...t, content: "Último local" }),
    "text",
  );
  await vi.waitFor(() => expect(state().readonly).toBe(true));
  expect(
    parseFile(serializeFile(state().doc!).text).model.texts[0].content,
  ).toBe("Último local");
  await state().discard();
  expect(state().doc!.model.texts[0].x).toBe(2000);
  expect(state().history.future).toEqual([]);
});
