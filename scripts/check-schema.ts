import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { projectStructureSchema } from '../src/domain/project';

const file = new URL('../supabase/migrations/202610070001_document_validation.sql', import.meta.url);
const schema = JSON.stringify(z.toJSONSchema(projectStructureSchema, { target: 'draft-7' }), null, 2);
const sql = await readFile(file, 'utf8');
if (process.argv.includes('--write')) {
  // Somente ao preparar esta migração, ANTES de aplicá-la em qualquer ambiente.
  await writeFile(file, sql.replace(/\$schema\$[\s\S]*?\$schema\$/, () => `$schema$\n${schema}\n$schema$`));
} else {
  const embedded = sql.match(/\$schema\$([\s\S]*?)\$schema\$/)?.[1];
  assert.ok(embedded, 'Schema SQL ausente');
  assert.deepEqual(JSON.parse(embedded), JSON.parse(schema), 'Contrato estrutural Zod/SQL divergente; criar migração de evolução.');
  console.log('Contrato estrutural Zod e JSON Schema da migração: idênticos.');
}
