import type { ProjectDocument } from '../../src/domain/project';

export const emptyDocument: ProjectDocument = {
  schemaVersion: 1, ruleSetId: 'orthogonal-half-bond-v1', units: 'mm', name: 'Casa do jardim',
  brickSystem: { lengthMm: 250, widthMm: 125, heightMm: 70, horizontalJointMm: 0, verticalJointMm: 0 },
  defaultWallHeightMm: 2800, wastePercent: 0,
  floor: { id: '11111111-1111-4111-8111-111111111111', name: 'Térreo', elevationMm: 0, walls: [], openings: [], dimensions: [] },
};
const wall = { id: '22222222-2222-4222-8222-222222222222', label: 'P01', start: { x: 0, y: 0 }, end: { x: 3125, y: 0 }, heightMm: 140, phase: 0 as const };
const opening = { id: '33333333-3333-4333-8333-333333333333', label: 'D01', wallId: wall.id, kind: 'door' as const, offsetMm: 125, widthMm: 1000, heightMm: 2100, sillMm: 0 };
function change(update: (doc: ProjectDocument) => void) { const doc = structuredClone(emptyDocument); update(doc); return doc; }
export const validDocuments = [
  { name: 'vazio', document: emptyDocument },
  { name: 'parede e abertura (geometria incompatível permanece salvável)', document: change(d => { d.floor.walls.push(wall); d.floor.openings.push(opening); }) },
  { name: 'comprimento não modular', document: change(d => { d.floor.walls.push({ ...wall, end: { x: 3110, y: 0 } }); }) },
  { name: 'faces de 0,5 mm e altura não modular', document: change(d => { d.defaultWallHeightMm = 2805; }) },
  { name: 'limite de 60 fiadas', document: change(d => { d.defaultWallHeightMm = 4200; }) },
  { name: 'cota com referência válida', document: change(d => { d.floor.walls.push(wall); d.floor.dimensions.push({ id: '44444444-4444-4444-8444-444444444444', axis: 'x', from: { kind: 'wallEndpoint', wallId: wall.id, endpoint: 'start' }, to: { kind: 'wallEndpoint', wallId: wall.id, endpoint: 'end' }, offsetMm: -100 }); }) },
];
export const invalidDocuments: { name: string; document: unknown }[] = [
  { name: 'schema futuro', document: { ...emptyDocument, schemaVersion: 2 } },
  { name: 'campos derivados extras', document: { ...emptyDocument, pieces: [] } },
  { name: 'nome vazio', document: change(d => { d.name = '   '; }) },
  { name: 'dimensão fracionária', document: change(d => { d.brickSystem.heightMm = 70.5; }) },
  { name: 'proporção do tijolo', document: change(d => { d.brickSystem.lengthMm = 260; }) },
  { name: 'junta vertical', document: { ...emptyDocument, brickSystem: { ...emptyDocument.brickSystem, verticalJointMm: 1 } } },
  { name: 'junta horizontal fora do intervalo', document: change(d => { d.brickSystem.horizontalJointMm = 11; }) },
  { name: 'limite de fiadas', document: change(d => { d.defaultWallHeightMm = 4270; }) },
  { name: 'UUID inválido', document: change(d => { d.floor.id = 'x'; }) },
  { name: 'UUID duplicado', document: change(d => { d.floor.walls.push(wall, wall); }) },
  { name: 'abertura órfã', document: change(d => { d.floor.openings.push(opening); }) },
  { name: 'porta com peitoril', document: change(d => { d.floor.walls.push(wall); d.floor.openings.push({ ...opening, sillMm: 10 }); }) },
  { name: 'cota órfã', document: change(d => { d.floor.dimensions.push({ id: wall.id, axis: 'x', from: { kind: 'openingEdge', openingId: opening.id, edge: 'start' }, to: { kind: 'openingEdge', openingId: opening.id, edge: 'end' }, offsetMm: 0 }); }) },
  { name: 'mais de 100 paredes', document: change(d => { d.floor.walls = Array.from({ length: 101 }, (_, i) => ({ ...wall, id: `22222222-2222-4222-8222-${String(i).padStart(12, '0')}` })); }) },
  { name: 'mais de 100 aberturas', document: change(d => { d.floor.walls.push(wall); d.floor.openings = Array.from({ length: 101 }, (_, i) => ({ ...opening, id: `33333333-3333-4333-8333-${String(i).padStart(12, '0')}` })); }) },
  { name: 'extensão acima de 100 m', document: change(d => { d.floor.walls.push({ ...wall, start: { x: -60_000, y: 0 }, end: { x: 60_000, y: 0 } }); }) },
  { name: 'coordenada além do limite', document: change(d => { d.floor.walls.push({ ...wall, end: { x: 100_001, y: 0 } }); }) },
  { name: 'perdas acima de 30%', document: change(d => { d.wastePercent = 31; }) },
  { name: 'documento acima de 5 MiB UTF-8', document: change(d => { d.floor.name = 'á'.repeat(3 * 1024 * 1024); }) },
];
