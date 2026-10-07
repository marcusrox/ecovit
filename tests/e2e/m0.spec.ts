import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { emptyDocument } from '../fixtures/documents';

const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', aud: 'authenticated', role: 'authenticated', email: 'projetista@example.com', email_confirmed_at: '2026-10-07T12:00:00Z', app_metadata: {}, user_metadata: {}, created_at: '2026-10-07T12:00:00Z' };
const jwt = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.mock-signature`;
type Row = { id: string; name: string; document: typeof emptyDocument; current_revision: number; created_at: string; updated_at: string };
async function mockCloud(page: Page, options: { loginFails?: boolean; listFails?: boolean; invalidDocument?: boolean; loseCreateResponse?: boolean } = {}) {
  const rows: Row[] = [];
  let lost = false;
  const creations: unknown[] = [];
  await page.route('https://ecovit-test.supabase.co/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const respond = (body: unknown, status = 200) => route.fulfill({ status, headers: { 'X-Supabase-Api-Version': '2024-01-01', 'Access-Control-Expose-Headers': 'X-Supabase-Api-Version' }, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname.endsWith('/token')) return options.loginFails ? respond({ code: 'invalid_credentials', msg: 'Invalid login credentials' }, 400) : respond({ access_token: jwt, token_type: 'bearer', expires_in: 3600, refresh_token: 'mock-refresh', user });
    if (url.pathname.endsWith('/user')) return respond(user);
    if (url.pathname.endsWith('/signup')) return respond({ user, session: null });
    if (url.pathname.endsWith('/recover')) return respond({});
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204 });
    if (url.pathname.endsWith('/rpc/create_project')) {
      const body = request.postDataJSON() as { p_project_id: string; p_document: typeof emptyDocument };
      creations.push(body);
      if (!rows.some(row => row.id === body.p_project_id)) rows.push({ id: body.p_project_id, name: body.p_document.name, document: body.p_document, current_revision: 1, created_at: '2026-10-07T12:00:00Z', updated_at: '2026-10-07T12:00:00Z' });
      if (options.loseCreateResponse && !lost) { lost = true; return route.abort('failed'); }
      return respond({ id: body.p_project_id, revision: 1, updated_at: '2026-10-07T12:00:00Z' });
    }
    if (url.pathname.endsWith('/projects')) {
      if (url.searchParams.has('id')) {
        const row = rows.find(row => `eq.${row.id}` === url.searchParams.get('id'));
        return respond(row ? { ...row, document: options.invalidDocument ? { ...row.document, schemaVersion: 99 } : row.document } : null);
      }
      if (options.listFails) return respond({ code: 'XX000', message: 'internal detail' }, 500);
      return respond(rows.map(row => ({ id: row.id, name: row.name, current_revision: row.current_revision, created_at: row.created_at, updated_at: row.updated_at })));
    }
    throw new Error(`Chamada Supabase inesperada: ${request.method()} ${url.pathname}`);
  });
  return { rows, creations };
}
async function login(page: Page) {
  await page.goto('/entrar');
  await page.getByLabel('E-mail', { exact: true }).fill(user.email);
  await page.getByLabel('Senha', { exact: true }).fill('senha-de-teste');
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
}
async function fillProject(page: Page) {
  await page.getByRole('button', { name: 'Novo projeto', exact: false }).click();
  await page.getByLabel('Nome do projeto').fill('Casa do jardim');
  await page.getByLabel('Altura do tijolo (mm)').fill('70');
  await page.getByRole('checkbox').check();
}

test('rota protegida, login, criação, editor, reload, lista e logout (nuvem simulada)', async ({ page }, testInfo) => {
  const cloud = await mockCloud(page);
  await page.goto('/projetos/11111111-1111-4111-8111-111111111111');
  await expect(page).toHaveURL(/\/entrar$/);
  await login(page);
  await expect(page.getByRole('heading', { name: 'Meus projetos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Vamos começar seu primeiro projeto?' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('projetos.png'), fullPage: true });
  await fillProject(page);
  await page.getByRole('button', { name: 'Criar projeto', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Casa do jardim' })).toBeVisible();
  await expect(page.getByText('Carregado da nuvem')).toBeVisible();
  await expect(page.getByText('Editor vazio · M0')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('editor.png'), fullPage: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Casa do jardim' })).toBeVisible();
  await page.getByRole('link', { name: 'Meus projetos' }).click();
  await expect(page.getByRole('heading', { name: 'Casa do jardim' })).toBeVisible();
  expect(cloud.rows).toHaveLength(1);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/entrar$/);
  await page.goto('/projetos');
  await expect(page).toHaveURL(/\/entrar$/);
});
test('senha incorreta produz mensagem acionável', async ({ page }) => {
  await mockCloud(page, { loginFails: true }); await login(page);
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos');
});
test('cadastro e recuperação confirmam envio sem fingir sessão', async ({ page }) => {
  await mockCloud(page); await page.goto('/criar-conta');
  await page.getByLabel('E-mail', { exact: true }).fill(user.email);
  await page.getByLabel('Senha', { exact: true }).fill('senha-de-teste');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('confirme sua conta');
  await page.goto('/recuperar-senha');
  await page.getByLabel('E-mail', { exact: true }).fill(user.email);
  await page.getByRole('button', { name: 'Enviar link de recuperação' }).click();
  await expect(page.getByRole('status')).toContainText('Se houver uma conta');
});
test('link de recuperação ausente e callback inválido têm orientação', async ({ page }) => {
  await mockCloud(page); await page.goto('/auth/redefinir-senha');
  await expect(page.getByRole('button', { name: 'Salvar nova senha' })).toBeDisabled();
  await expect(page.getByText('Abra o link enviado')).toBeVisible();
  await page.goto('/auth/callback#error_description=expired');
  await expect(page.getByRole('alert')).toContainText('inválido ou expirou');
});
test('falha na lista não aparece como projeto vazio', async ({ page }) => {
  await mockCloud(page, { listFails: true }); await login(page);
  await expect(page.getByRole('alert')).toContainText('Não foi possível concluir');
  await expect(page.getByRole('heading', { name: 'Vamos começar seu primeiro projeto?' })).toHaveCount(0);
});
test('projeto ausente é tratado sem revelar acesso de terceiros', async ({ page }) => {
  await mockCloud(page); await login(page); await expect(page).toHaveURL(/\/projetos$/);
  await page.goto('/projetos/11111111-1111-4111-8111-111111111111');
  await expect(page.getByRole('alert')).toContainText('Projeto não encontrado');
});
test('documento de versão futura não abre no editor', async ({ page }) => {
  const cloud = await mockCloud(page, { invalidDocument: true });
  cloud.rows.push({ id: emptyDocument.floor.id, name: emptyDocument.name, document: emptyDocument, current_revision: 1, created_at: '2026-10-07T12:00:00Z', updated_at: '2026-10-07T12:00:00Z' });
  await login(page); await page.getByRole('link', { name: /Casa do jardim/ }).click();
  await expect(page.getByRole('alert')).toContainText('Documento inválido');
  await expect(page.getByText('Carregado da nuvem')).toHaveCount(0);
});
test('resposta perdida permite retry com mesmos IDs, sem duplicar projeto', async ({ page }) => {
  const cloud = await mockCloud(page, { loseCreateResponse: true });
  await login(page); await fillProject(page);
  await page.getByRole('button', { name: 'Criar projeto', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('conectar');
  await page.getByRole('button', { name: 'Criar projeto', exact: true }).click();
  await expect(page.getByText('Carregado da nuvem')).toBeVisible();
  expect(cloud.creations).toHaveLength(2);
  expect(cloud.creations[0]).toEqual(cloud.creations[1]);
  expect(cloud.rows).toHaveLength(1);
});
