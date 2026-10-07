import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { emptyDocument, validDocuments, invalidDocuments } from '../tests/fixtures/documents';

function required(name: string) { const value = process.env[name]; if (!value) throw new Error(`Configure ${name} em .env.cloud.`); return value; }
assert.equal(required('CLOUD_TEST_CONFIRM'), 'homologacao', 'Execute somente em homologação isolada.');
const url = required('SUPABASE_TEST_URL');
const key = required('SUPABASE_TEST_PUBLISHABLE_KEY');
assert.ok(key.startsWith('sb_publishable_'), 'Use somente chave publicável.');
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const a = client(), b = client(), anon = client(), reopened = client();
const loginA = await a.auth.signInWithPassword({ email: required('TEST_USER_A_EMAIL'), password: required('TEST_USER_A_PASSWORD') });
const loginB = await b.auth.signInWithPassword({ email: required('TEST_USER_B_EMAIL'), password: required('TEST_USER_B_PASSWORD') });
assert.ifError(loginA.error); assert.ifError(loginB.error);
assert.notEqual(loginA.data.user?.id, loginB.data.user?.id, 'Use duas contas distintas.');
const id = crypto.randomUUID();
const document = { ...emptyDocument, name: `Teste M0 ${id}` };
const args = { p_project_id: id, p_document: document };
const [created, retry] = await Promise.all([a.rpc('create_project', args), a.rpc('create_project', args)]);
assert.ifError(created.error); assert.ifError(retry.error); assert.deepEqual(created.data, retry.data);
const changed = await a.rpc('create_project', { ...args, p_document: { ...document, name: 'Conteúdo diferente' } });
assert.match(changed.error?.message ?? '', /IDEMPOTENCY_CONFLICT/);
const read = await a.from('projects').select('document,current_revision').eq('id', id).single();
assert.ifError(read.error); assert.deepEqual(read.data?.document, document); assert.equal(read.data?.current_revision, 1);
const revisions = await a.from('project_revisions').select('revision,document').eq('project_id', id);
assert.ifError(revisions.error); assert.equal(revisions.data?.length, 1);
const otherLogin = await reopened.auth.signInWithPassword({ email: required('TEST_USER_A_EMAIL'), password: required('TEST_USER_A_PASSWORD') });
assert.ifError(otherLogin.error);
const otherRead = await reopened.from('projects').select('document').eq('id', id).single();
assert.ifError(otherRead.error); assert.deepEqual(otherRead.data?.document, document);
for (const table of ['projects', 'project_revisions']) {
  const field = table === 'projects' ? 'id' : 'project_id';
  const other = await b.from(table).select('*').eq(field, id);
  assert.ifError(other.error); assert.deepEqual(other.data, [], `B conseguiu ler ${table}`);
  const anonymous = await anon.from(table).select('*').eq(field, id);
  assert.ok(anonymous.error || anonymous.data?.length === 0, `anon conseguiu ler ${table}`);
  for (const identity of [a, b]) {
    assert.ok((await identity.from(table).update(table === 'projects' ? { name: 'alterado' } : { engine_version: 'alterado' }).eq(field, id)).error, `UPDATE direto permitido: ${table}`);
    assert.ok((await identity.from(table).delete().eq(field, id)).error, `DELETE direto permitido: ${table}`);
  }
}
assert.match((await b.rpc('create_project', args)).error?.message ?? '', /NOT_FOUND/);
assert.ok((await anon.rpc('create_project', { ...args, p_project_id: crypto.randomUUID() })).error);
assert.ok((await a.from('projects').insert({ id: crypto.randomUUID(), owner_id: loginA.data.user!.id, name: 'Direto', schema_version: 1, document })).error);
assert.ok((await a.from('project_revisions').insert({ project_id: id, revision: 2, document, engine_version: 'test', idempotency_key: crypto.randomUUID(), content_hash: 'test' })).error);
for (const fixture of validDocuments) {
  const result = await a.rpc('create_project', { p_project_id: crypto.randomUUID(), p_document: fixture.document });
  assert.ifError(result.error); console.log(`SQL aceita: ${fixture.name}`);
}
for (const fixture of invalidDocuments) {
  const result = await a.rpc('create_project', { p_project_id: crypto.randomUUID(), p_document: fixture.document });
  assert.match(result.error?.message ?? '', /INVALID_DOCUMENT|DOCUMENT_TOO_LARGE/, `SQL aceitou: ${fixture.name}`);
}
await Promise.all([a.auth.signOut(), b.auth.signOut(), reopened.auth.signOut()]);
console.log('Homologação M0: login, criação, retry concorrente, reabertura, RLS, escrita direta e fixtures SQL verificados.');
console.log('Foram mantidos 7 projetos sintéticos na conta A. A exclusão via aplicação começa em M4.');
