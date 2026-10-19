import {
  LIMIT,
  type Project,
  type EditableProject,
  type LocalProject,
} from "./project";
import { componentId, signature } from "./composition";
import { validateSlab } from "./slabs";

export type Floor = Project["model"]["floors"][number];
export function validateFloor(doc: Project, floor: Floor) {
  const h = doc.project.base.height;
  if (!floor.name.trim() || floor.name.trim().length > 100)
    throw new Error("Informe um nome de pavimento com até 100 caracteres.");
  if (
    ![
      floor.level,
      floor.defaultHeight,
      floor.level + floor.defaultHeight,
    ].every((n) => Number.isSafeInteger(n) && Math.abs(n) <= LIMIT)
  )
    throw new Error("Cota ou altura fora do limite do editor.");
  if (floor.level % h || floor.defaultHeight <= 0 || floor.defaultHeight % h)
    throw new Error(
      "Escolha cota e altura compatíveis com a altura do tijolo.",
    );
  if (
    doc.model.floors.some((f) => f.id !== floor.id && f.level === floor.level)
  )
    throw new Error("Já existe um pavimento nesta cota.");
}
const sorted = (floors: Floor[]) =>
  [...floors].sort((a, b) => a.level - b.level);
export function addFloor(doc: Project, input: Omit<Floor, "id">): Project {
  if (doc.model.floors.length >= 4)
    throw new Error("O projeto admite até quatro pavimentos.");
  const floor = { ...input, name: input.name.trim(), id: crypto.randomUUID() };
  validateFloor(doc, floor);
  return {
    ...doc,
    model: { ...doc.model, floors: sorted([...doc.model.floors, floor]) },
  };
}
export function editFloor(
  doc: Project,
  floorId: string,
  change: Partial<Omit<Floor, "id">>,
): Project {
  const previous = doc.model.floors.find((f) => f.id === floorId);
  if (!previous) throw new Error("Pavimento ausente.");
  const next = {
    ...previous,
    ...change,
    name: (change.name ?? previous.name).trim(),
  };
  validateFloor(doc, next);
  const delta = next.level - previous.level;
  for (const slab of doc.model.slabs.filter((s) => s.floorId === floorId))
    validateSlab(slab, doc.project.base.width, next.level);
  const channels = doc.adjustments.channels.map((a) => {
    if (a.floorId !== floorId) return a;
    const top = a.top + delta;
    if (!Number.isSafeInteger(top) || Math.abs(top) > LIMIT)
      throw new Error("A mudança de cota excede o limite de uma supressão.");
    return { ...a, top };
  });
  for (const w of doc.model.walls.filter((w) => w.floorId === floorId))
    if (Math.abs(next.level + w.height) > LIMIT)
      throw new Error("Topo da parede fora do limite do editor.");
  return {
    ...doc,
    model: {
      ...doc.model,
      floors: sorted(
        doc.model.floors.map((f) => (f.id === floorId ? next : f)),
      ),
      slabs: [...doc.model.slabs].sort(
        (a, b) =>
          (a.floorId === floorId
            ? next.level
            : doc.model.floors.find((f) => f.id === a.floorId)!.level) -
          (b.floorId === floorId
            ? next.level
            : doc.model.floors.find((f) => f.id === b.floorId)!.level),
      ),
    },
    adjustments: { ...doc.adjustments, channels },
  };
}
export function removeFloor(doc: Project, floorId: string): Project {
  if (doc.model.floors.length === 1)
    throw new Error("Mantenha ao menos um pavimento.");
  if (!doc.model.floors.some((f) => f.id === floorId))
    throw new Error("Pavimento ausente.");
  const walls = doc.model.walls.filter((w) => w.floorId !== floorId);
  const ids = new Set(walls.map((w) => w.id));
  return {
    ...doc,
    model: {
      ...doc.model,
      floors: doc.model.floors.filter((f) => f.id !== floorId),
      walls,
      openings: doc.model.openings.filter((o) => ids.has(o.wallId)),
      slabs: doc.model.slabs.filter((s) => s.floorId !== floorId),
      measurements: doc.model.measurements.filter((m) => m.floorId !== floorId),
      referenceImages: doc.model.referenceImages.filter(
        (m) => m.floorId !== floorId,
      ),
    },
    adjustments: {
      junctions: doc.adjustments.junctions.filter((a) => a.floorId !== floorId),
      channels: doc.adjustments.channels.filter((a) => a.floorId !== floorId),
      grout: doc.adjustments.grout.filter((a) => a.floorId !== floorId),
    },
  };
}
export function duplicateFloor(
  doc: Project,
  floorId: string,
  level: number,
  name: string,
): Project {
  const source = doc.model.floors.find((f) => f.id === floorId);
  if (!source) throw new Error("Pavimento ausente.");
  const added = addFloor(doc, {
    name,
    level,
    defaultHeight: source.defaultHeight,
  });
  const target = added.model.floors.find(
    (f) => !doc.model.floors.some((old) => old.id === f.id),
  )!;
  const original = doc.model.walls.filter((w) => w.floorId === floorId);
  const ids = new Map(original.map((w) => [w.id, crypto.randomUUID()]));
  const remap = (list: string[]) => list.map((id) => ids.get(id)!);
  const walls = original.map((w) => ({
    ...w,
    id: ids.get(w.id)!,
    floorId: target.id,
  }));
  const channels = doc.adjustments.channels
    .filter((a) => a.floorId === floorId)
    .map((a) => ({
      ...a,
      id: crypto.randomUUID(),
      floorId: target.id,
      wallId: ids.get(a.wallId)!,
      top: a.top + level - source.level,
    }));
  if (
    channels.some(
      (a) => !Number.isSafeInteger(a.top) || Math.abs(a.top) > LIMIT,
    )
  )
    throw new Error("Cota de supressão fora do limite do editor.");
  const result: Project = {
    ...added,
    model: {
      ...added.model,
      slabs: [
        ...doc.model.slabs,
        ...doc.model.slabs
          .filter((s) => s.floorId === floorId)
          .map((s) => ({
            ...s,
            id: crypto.randomUUID(),
            floorId: target.id,
            contour: s.contour.map((p) => ({ ...p })),
            openings: s.openings.map((o) => ({
              ...o,
              id: crypto.randomUUID(),
              contour: o.contour.map((p) => ({ ...p })),
            })),
          })),
      ].sort(
        (a, b) =>
          added.model.floors.findIndex((f) => f.id === a.floorId) -
          added.model.floors.findIndex((f) => f.id === b.floorId),
      ),
      walls: [...doc.model.walls, ...walls],
      referenceImages: [
        ...doc.model.referenceImages,
        ...doc.model.referenceImages
          .filter((i) => i.floorId === floorId)
          .map((i) => ({ ...i, floorId: target.id })),
      ],
      measurements: [
        ...doc.model.measurements,
        ...doc.model.measurements
          .filter((m) => m.floorId === floorId)
          .map((m) => ({
            ...m,
            id: crypto.randomUUID(),
            floorId: target.id,
            a: { ...m.a },
            b: { ...m.b },
          })),
      ],
      openings: [
        ...doc.model.openings,
        ...doc.model.openings
          .filter((o) => ids.has(o.wallId))
          .map((o) => ({
            ...o,
            id: crypto.randomUUID(),
            wallId: ids.get(o.wallId)!,
          })),
      ],
    },
    adjustments: {
      channels: [...doc.adjustments.channels, ...channels],
      grout: [
        ...doc.adjustments.grout,
        ...doc.adjustments.grout
          .filter((a) => a.floorId === floorId)
          .map((a) => ({
            ...a,
            id: crypto.randomUUID(),
            floorId: target.id,
            wallIds: remap(a.wallIds),
          })),
      ],
      junctions: [
        ...doc.adjustments.junctions,
        ...doc.adjustments.junctions
          .filter((a) => a.floorId === floorId)
          .map((a) => {
            const wallIds = remap(a.wallIds);
            const compatible =
              a.componentId === `${source.id}:${componentId(a.wallIds)}` &&
              a.signature ===
                signature(original.filter((w) => a.wallIds.includes(w.id)));
            return {
              ...a,
              binding: compatible ? a.binding : ("pending" as const),
              id: crypto.randomUUID(),
              floorId: target.id,
              wallIds,
              componentId: `${target.id}:${componentId(wallIds)}`,
              signature: signature(walls.filter((w) => wallIds.includes(w.id))),
            };
          }),
      ],
    },
  };
  if (
    result.model.walls.length > 10000 ||
    result.model.openings.length > 1000 ||
    Object.values(result.adjustments).some((a) => a.length > 10000)
  )
    throw new Error("A cópia excede o limite de registros do documento.");
  for (const slab of result.model.slabs)
    validateSlab(
      slab,
      result.project.base.width,
      result.model.floors.find((f) => f.id === slab.floorId)!.level,
    );
  return result;
}

/** Merge a transient editor view without discarding another floor's intention. */
export function mergeFloorView(
  root: Project,
  candidate: EditableProject,
): Project {
  if (!("viewFloorId" in candidate)) return candidate;
  const local = candidate as LocalProject,
    id = local.viewFloorId;
  const owned = new Set(
    root.model.walls.filter((w) => w.floorId === id).map((w) => w.id),
  );
  return {
    ...root,
    project: local.project,
    model: {
      ...root.model,
      floors: sorted(
        root.model.floors.map((f) => (f.id === id ? local.model.floors[0] : f)),
      ),
      slabs: [
        ...root.model.slabs.filter((s) => s.floorId !== id),
        ...local.model.slabs,
      ].sort(
        (a, b) =>
          (a.floorId === id
            ? local.model.floors[0].level
            : root.model.floors.find((f) => f.id === a.floorId)!.level) -
          (b.floorId === id
            ? local.model.floors[0].level
            : root.model.floors.find((f) => f.id === b.floorId)!.level),
      ),
      walls: [
        ...root.model.walls.filter((w) => w.floorId !== id),
        ...local.model.walls,
      ],
      referenceImages: [
        ...root.model.referenceImages.filter((i) => i.floorId !== id),
        ...local.model.referenceImages,
      ],
      measurements: [
        ...root.model.measurements.filter((m) => m.floorId !== id),
        ...local.model.measurements,
      ],
      openings: [
        ...root.model.openings.filter((o) => !owned.has(o.wallId)),
        ...local.model.openings,
      ],
    },
    adjustments: {
      junctions: [
        ...root.adjustments.junctions.filter((a) => a.floorId !== id),
        ...local.adjustments.junctions,
      ],
      channels: [
        ...root.adjustments.channels.filter((a) => a.floorId !== id),
        ...local.adjustments.channels,
      ],
      grout: [
        ...root.adjustments.grout.filter((a) => a.floorId !== id),
        ...local.adjustments.grout,
      ],
    },
  };
}
