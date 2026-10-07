import { describe, expect, it } from 'vitest';
import { createEmptyDocument, parseProjectDocument } from '../../src/domain/project';
import { validDocuments, invalidDocuments } from '../fixtures/documents';

describe('contrato de documento v1', () => {
  for (const fixture of validDocuments) it(`aceita ${fixture.name}`, () => { expect(parseProjectDocument(fixture.document)).toEqual(fixture.document); });
  for (const fixture of invalidDocuments) it(`recusa ${fixture.name}`, () => { expect(() => parseProjectDocument(fixture.document)).toThrow(); });
  it('cria documento vazio com IDs independentes e altura explícita', () => {
    const options = { lengthMm: 300, heightMm: 70, horizontalJointMm: 0, defaultWallHeightMm: 2800 };
    const first = createEmptyDocument(' Casa ', options);
    expect(first.name).toBe('Casa'); expect(first.brickSystem.widthMm).toBe(150);
    expect(first.floor.walls).toEqual([]);
    expect(first.floor.id).not.toBe(createEmptyDocument('Casa', options).floor.id);
    expect(parseProjectDocument(JSON.parse(JSON.stringify(first)))).toEqual(first);
  });
});
