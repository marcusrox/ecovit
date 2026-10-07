import { z } from 'zod';

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const integer = z.number().int();
const positive = integer.positive();
const uuid = z.uuid();
const point = z.strictObject({ x: integer.min(-100_000).max(100_000), y: integer.min(-100_000).max(100_000) });
const anchor = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('wallEndpoint'), wallId: uuid, endpoint: z.enum(['start', 'end']) }),
  z.strictObject({ kind: z.literal('openingEdge'), openingId: uuid, edge: z.enum(['start', 'end']) }),
]);

// Exportado para gerar o mesmo contrato estrutural no PostgreSQL (pg_jsonschema).
export const projectStructureSchema = z.strictObject({
  schemaVersion: z.literal(1), ruleSetId: z.literal('orthogonal-half-bond-v1'), units: z.literal('mm'),
  name: z.string().min(1).max(160).regex(/\S/),
  brickSystem: z.strictObject({ lengthMm: positive, widthMm: positive, heightMm: positive,
    horizontalJointMm: integer.min(0).max(10), verticalJointMm: z.literal(0) }),
  defaultWallHeightMm: positive, wastePercent: z.number().min(0).max(30),
  floor: z.strictObject({
    id: uuid, name: z.string().min(1), elevationMm: z.literal(0),
    walls: z.array(z.strictObject({ id: uuid, label: z.string(), start: point, end: point, heightMm: positive, phase: z.union([z.literal(0), z.literal(1)]) })).max(100),
    openings: z.array(z.strictObject({ id: uuid, label: z.string(), wallId: uuid,
      kind: z.enum(['door', 'window']), offsetMm: integer.nonnegative(), widthMm: positive,
      heightMm: positive, sillMm: integer.nonnegative(), hinge: z.enum(['start', 'end']).optional(),
      swingSide: z.enum(['left', 'right']).optional() })).max(100),
    dimensions: z.array(z.strictObject({ id: uuid, axis: z.enum(['x', 'y']), from: anchor, to: anchor, offsetMm: integer })),
  }),
});

export const projectDocumentSchema = projectStructureSchema.superRefine((doc, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  const brick = doc.brickSystem;
  if (brick.lengthMm !== brick.widthMm * 2) issue('O comprimento do tijolo deve ser o dobro da largura.');
  const course = brick.heightMm + brick.horizontalJointMm;
  if ([doc.defaultWallHeightMm, ...doc.floor.walls.map(w => w.heightMm)].some(h => Math.floor(h / course) > 60)) issue('Limite de 60 fiadas por parede excedido.');
  const entities = [doc.floor, ...doc.floor.walls, ...doc.floor.openings, ...doc.floor.dimensions];
  const ids = entities.map(e => e.id.toLowerCase());
  if (new Set(ids).size !== ids.length) issue('Os UUIDs devem ser únicos no documento.');
  const walls = new Set(doc.floor.walls.map(w => w.id.toLowerCase()));
  const openings = new Set(doc.floor.openings.map(o => o.id.toLowerCase()));
  for (const opening of doc.floor.openings) {
    if (!walls.has(opening.wallId.toLowerCase())) issue('A abertura referencia uma parede inexistente.');
    if (opening.kind === 'door' && opening.sillMm !== 0) issue('Portas devem ter peitoril zero.');
  }
  for (const dimension of doc.floor.dimensions) for (const ref of [dimension.from, dimension.to]) {
    if (ref.kind === 'wallEndpoint' ? !walls.has(ref.wallId.toLowerCase()) : !openings.has(ref.openingId.toLowerCase())) issue('A cota referencia um elemento inexistente.');
  }
  const points = doc.floor.walls.flatMap(w => [w.start, w.end]);
  for (const axis of ['x', 'y'] as const) {
    const values = points.map(p => p[axis]);
    if (values.length && Math.max(...values) - Math.min(...values) > 100_000) issue('A extensão máxima por eixo é de 100 m.');
  }
});

export type ProjectDocument = z.infer<typeof projectDocumentSchema>;

export function parseProjectDocument(input: unknown): ProjectDocument {
  const serialized = JSON.stringify(input);
  if (serialized && new TextEncoder().encode(serialized).byteLength > MAX_DOCUMENT_BYTES) throw new Error('DOCUMENT_TOO_LARGE');
  return projectDocumentSchema.parse(input);
}

export function createEmptyDocument(name: string, options: { lengthMm: number; heightMm: number; horizontalJointMm: number; defaultWallHeightMm: number }): ProjectDocument {
  return parseProjectDocument({
    schemaVersion: 1, ruleSetId: 'orthogonal-half-bond-v1', units: 'mm', name: name.trim(),
    brickSystem: { lengthMm: options.lengthMm, widthMm: options.lengthMm / 2, heightMm: options.heightMm, horizontalJointMm: options.horizontalJointMm, verticalJointMm: 0 },
    defaultWallHeightMm: options.defaultWallHeightMm, wastePercent: 0,
    floor: { id: crypto.randomUUID(), name: 'Térreo', elevationMm: 0, walls: [], openings: [], dimensions: [] },
  });
}
