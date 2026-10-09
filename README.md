# Ecovit · M0

Base do sistema de projetos em tijolo ecológico, conforme o **[PRD versão 1.1](docs/PRD.md)**, documento oficial em `docs/PRD.md`. Uma SPA React + TypeScript strict + Vite, npm e CSS Modules, com Supabase direto do navegador. Sem servidor próprio e sem Docker.

## Documentação do projeto

- [PRD 1.1 integral](docs/PRD.md) e [roadmap dos marcos M0–M5](docs/ROADMAP.md).
- [Arquitetura](docs/architecture/overview.md), [modelo de dados](docs/architecture/data-model.md) e [módulos](docs/architecture/modules.md).
- Decisões: [stack](docs/adr/ADR-001-stack-tecnologica.md), [modelo](docs/adr/ADR-002-modelo-de-dados.md) e [renderização 2D](docs/adr/ADR-003-renderizacao-2d.md).
- [Changelog](docs/CHANGELOG.md) e [verificação inicial de M0](docs/verification/M0-verificacao.md).

Os seis arquivos em `docs/milestones/` seguem diretamente os marcos M0–M5 do PRD: Base, Núcleo, Editor, Inspeção, Persistência e Liberação.

O PRD define os requisitos. Os milestones concentram entregáveis, dependências, critérios de aceite e situação da implementação. Os ADRs registram contexto, decisão, motivos, alternativas e consequências; seu estado indica se a decisão está vigente, não se a entrega foi concluída. As evidências de execução ficam em `docs/verification/`, com data e limitações dos testes.

## Estado da entrega

Implementados: rotas de login/cadastro/recuperação/redefinição, sessão Supabase, proteção de rotas, lista paginada de projetos privados, configuração inicial com altura/juntas confirmadas, criação na nuvem via RPC, leitura validada e editor vazio. O projeto só abre após confirmação da criação; falhas não simulam salvamento. Repetir a criação após uma resposta perdida usa os mesmos IDs enquanto o formulário permanece aberto e inalterado.

Sem configuração externa, a aplicação abre e explica quais variáveis faltam. **Não existe login fictício nem armazenamento de projetos em memória na aplicação.** Os testes E2E interceptam a rede exclusivamente no Playwright.

**Aceite externo do M0 ainda pendente:** aplicar migrações em Supabase de homologação, configurar Auth/SMTP e comprovar login, criação e reabertura reais. O CI foi preparado; sua execução hospedada depende de enviar o repositório ao GitHub. Consulte `docs/verification/M0-verificacao.md` para evidências locais.

## Windows / PowerShell

Ferramentas fixadas: **Node.js 24.18.0** e **npm 11.16.0**. `.node-version`, `.nvmrc`, `package.json` e CI registram essas versões. Use o instalador do Node ou, se já usa nvm-windows, `nvm install 24.18.0` e `nvm use 24.18.0`. Abra um novo PowerShell depois de instalar.

```powershell
Set-Location C:\Projects\ecovit
node --version
npm --version
npm install
Copy-Item .env.example .env.local
# Edite .env.local conforme a seção Supabase e salve.
npm run dev
```

URL: **http://127.0.0.1:5173**. A porta é fixa: se estiver ocupada, o comando informa erro. Encerre o servidor com Ctrl+C. Para usar outra porta, `npm run dev -- --port 5175` e inclua essa origem nas URLs permitidas do Auth.

Se a política do PowerShell bloquear `npm.ps1`/`npx.ps1`, use `npm.cmd`/`npx.cmd` em todos os comandos (sem alterar a política do sistema). Por exemplo: `npm.cmd install` e `npm.cmd run dev`.

As versões diretas estão fixadas no `package.json` e a árvore completa no `package-lock.json`. Em instalação reprodutível/CI, use `npm ci`. Não é necessário atualizar dependências para começar.

| Comando | Finalidade |
| --- | --- |
| `npm install` | Instalar dependências |
| `npm run dev` | Vite em 127.0.0.1:5173 |
| `npm run lint` | ESLint sem warnings |
| `npm run typecheck` | TypeScript strict, incluindo testes/scripts |
| `npm test` | Vitest: documentos e erros |
| `npm run test:watch` | Vitest interativo |
| `npm run schema:check` | Comparar estrutura Zod e JSON Schema versionado no SQL |
| `npm run build` | Checar tipos e gerar `dist` |
| `npm run preview` | Servir `dist` localmente, padrão 127.0.0.1:4173 |
| `npm run check` | lint + tipos + unitários + contrato SQL + build |
| `npm run test:e2e` | Playwright com Supabase simulado em 4173 |
| `npm run test:cloud` | Integração real com homologação explicitamente configurada |

Antes do primeiro E2E:

```powershell
npx playwright install chromium
npm run check
npm run test:e2e
```

O Playwright inicia e encerra seu próprio Vite na porta 4173. Deixe-a livre. Os testes não precisam de conta, `.env.local`, Docker nem banco; o servidor de teste sobrescreve as duas variáveis com valores fictícios. O relatório fica em `playwright-report/index.html`.

O servidor dos testes usa um cache de dependências separado (`node_modules/.vite-e2e`), permitindo manter a aplicação aberta na porta 5173. Se uma atualização de dependências provocar tela em branco com `504 — Outdated Optimize Dep`, encerre o Vite, execute `npm.cmd run dev -- --force` e recarregue o navegador com Ctrl+F5.

## Supabase de homologação

1. Crie um projeto Supabase **exclusivo de homologação**, separado de produção. Nenhum projeto remoto foi criado por esta entrega.
2. No SQL Editor administrativo desse projeto, execute **cada arquivo completo, em ordem**, uma única vez:
   - `supabase/migrations/202610070001_document_validation.sql`
   - `supabase/migrations/202610070002_projects.sql`
3. As migrações usam `pg_jsonschema` e `pgcrypto` no schema `extensions`. Se já tiver habilitado essas extensões em outro schema, confira a instalação antes de aplicar; estes arquivos destinam-se a um projeto novo. Cada arquivo usa transação. Registre quais arquivos foram aplicados. Não reexecute/edite migrações já aplicadas: mudanças posteriores exigem novo arquivo.
4. Confirme RLS habilitado em `projects` e `project_revisions`. `anon` não lê/grava; `authenticated` só lê os próprios projetos ativos e revisões; escrita direta está revogada. A única mutação M0 é `create_project`, com `SECURITY DEFINER`, `search_path` vazio, proprietário obtido de `auth.uid()`, validação de documento, criação atômica da revisão 1 e idempotência por ID/conteúdo.
5. Em Connect/API Keys, copie a URL HTTPS do projeto e a **publishable key** (`sb_publishable_…`) para `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE
```

6. Reinicie `npm run dev`. O Vite lê as variáveis na inicialização/build. URL vazia/inválida ou chave sem o prefixo publicável desabilitam a conexão.

Somente essas duas variáveis são públicas. Senha do banco, chaves secretas e `service_role` **nunca** entram em `VITE_*`, código, CI do frontend ou bundle. As migrações são aplicadas pelo administrador no Supabase, não pelo navegador. Não há `/api/projects`, `/health` ou `/ready`.

### Autenticação, confirmação e recuperação

No painel Supabase Auth, habilite email/senha e confirmação de e-mail. Configure política de senha com mínimo de 8 caracteres, SMTP próprio (host/porta/remetente/credenciais e domínio de envio verificado) e os limites de envio. O formulário de cadastro/redefinição exige pelo menos 8 caracteres. O provedor pode aplicar exigências adicionais.

Para homologação local:

- Site URL: `http://127.0.0.1:5173`.
- Redirect URLs: `http://127.0.0.1:5173/auth/callback` e `http://127.0.0.1:5173/auth/redefinir-senha`.
- O cadastro envia `emailRedirectTo` para `/auth/callback`; a recuperação usa `/auth/redefinir-senha`.
- Mantenha os templates de e-mail usando o link de confirmação do Supabase (`ConfirmationURL`); o SDK processa a sessão do retorno. Não implementamos validação JWT própria.
- Se usar `localhost`, outra porta ou preview hospedado, cadastre as respectivas origens/caminhos. Previews usam somente o projeto de homologação. Produção terá projeto, domínio, Site URL e redirects próprios com HTTPS.

Prova manual após configurar: criar conta → abrir confirmação por e-mail → entrar → criar projeto informando altura/juntas → verificar editor → sair → entrar em outro navegador e reabrir → solicitar recuperação → abrir link → trocar senha → entrar com nova senha. A entrega local não comprova envio SMTP ou links reais.

### Testes diretos da nuvem

Crie/confirme duas contas descartáveis distintas no Auth de homologação. Crie `.env.cloud` na raiz (ignorado pelo Git), sem prefixo VITE:

```dotenv
CLOUD_TEST_CONFIRM=homologacao
SUPABASE_TEST_URL=https://SEU-PROJETO.supabase.co
SUPABASE_TEST_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE
TEST_USER_A_EMAIL=conta-a@seu-dominio.com
TEST_USER_A_PASSWORD=senha-da-conta-a
TEST_USER_B_EMAIL=conta-b@seu-dominio.com
TEST_USER_B_PASSWORD=senha-da-conta-b
```

Execute `npm run test:cloud`. O script usa clientes Supabase reais sem credencial administrativa e verifica criação concorrente/retry, conteúdo diferente com mesmo ID, leitura em nova sessão, isolamento A/B/anon, revisões, escrita direta negada e **as mesmas fixtures aceitas/rejeitadas do Zod contra a RPC SQL**. Ele cria e mantém 7 projetos sintéticos na conta A; não realiza limpeza destrutiva. Use contas/projeto descartáveis. Falha de rede/configuração termina com erro, não com teste aprovado ou silenciosamente ignorado.

O teste não cobre ainda autosave/save/delete, retenção, purga, token expirado/forjado e conflitos entre abas (M4), nem entrega de e-mails. `schema:check` prova apenas igualdade estrutural do schema embutido; não executa PostgreSQL nem prova RLS. O gerador `scripts/check-schema.ts --write` foi usado na preparação inicial e não deve reescrever migração já aplicada.

## Organização

```text
src/
  app/                 # rotas, sessão, autenticação, projetos e CSS Modules
  editor/              # editor vazio e apresentação do documento
  domain/              # modelo, schema Zod e criação de documento
  persistence/         # cliente, Auth, normalização de falhas, criar/listar/carregar
supabase/migrations/   # contrato SQL, tabelas, RLS e RPC inicial
tests/
  fixtures/            # documentos comuns a testes Zod e SQL
  unit/                # Vitest
  e2e/                 # Playwright, rede simulada
scripts/               # consistência do contrato e prova de homologação
```

`domain` não depende de React nem Supabase. Componentes não consultam tabelas diretamente. Lista carrega metadados em páginas de 20, com cursor por data de criação/UUID; o documento só é lido ao abrir o editor. Documentos futuros/desconhecidos são recusados. Medidas são inteiras em mm; nomes de projeto têm até 160 caracteres. As incompatibilidades geométricas editáveis permanecem salváveis para diagnóstico em M1.

Konva, Zustand, Dexie e worker entram quando seus recursos forem implementados (M1/M2), como orienta a seção 14 do PRD. Não há paginação, desenho, quantitativos ou validação construtiva no M0. Limite de 50.000 peças derivadas será verificado pelo motor M1. As telas mostram essa limitação.

## CI e publicação estática

`.github/workflows/ci.yml` instala com `npm ci`, executa `npm run check`, instala Chromium e roda E2E; publica `dist` como artefato, sem credenciais externas. O build CI é para verificação, sem conexão de nuvem. Para publicar um build funcional, configure as duas variáveis VITE do ambiente escolhido antes de compilar.

Cloudflare Pages (M5): comando `npm run build`, saída `dist`, Node 24.18.0. `public/_redirects` gera fallback SPA para abertura direta de `/projetos/:id` e rotas Auth. Configure publicação da branch principal somente após verificações aprovadas. A entrega não cria/publica site nem configura conta Cloudflare. Rollback estático usa build anterior; alterações SQL posteriores devem preservar documentos existentes.

## Backup, privacidade e pendências

Verificação documental em 07/10/2026: o Supabase informa backups diários no plano Pro com retenção de 7 dias; preço de entrada de US$25/mês, sujeito a compute adicional, consumo e impostos. Plano Free não atende ao requisito de backup gerenciado de produção. Fontes: [backups oficiais](https://supabase.com/docs/guides/platform/backups) e [preços oficiais](https://supabase.com/pricing). Nenhum plano foi contratado/configurado e nenhuma restauração foi executada. Antes de dados reais, validar retenção no projeto contratado e provar restauração com RPO 24 h/RTO 8 h.

Ainda falta fornecer/configurar externamente:

- Projeto Supabase de homologação, URL e chave publicável; migrações aplicadas e testes reais aprovados.
- SMTP verificado e URLs/templates de confirmação/recuperação; duas contas de teste confirmadas.
- Para liberação futura: Supabase de produção separado, plano/backup/ensaio de restauração, Cloudflare Pages e domínio HTTPS.

M4 entregará `save_project`/`delete_project`, renomeação, autosave, IndexedDB/recuperação, retenção de 20 revisões, exclusão lógica e purga agendada após 30 dias. M0 reserva as colunas para essas operações, mas não expõe funções incompletas. Logout encerra a sessão e desmonta as telas protegidas; não há rascunhos locais no M0. Projetos sintéticos criados nos testes permanecem na nuvem até remoção administrativa do ambiente de teste.

Referências de implementação: [Vite](https://vite.dev/guide/), [Supabase Auth](https://supabase.com/docs/guides/auth/passwords), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) e [pg_jsonschema](https://supabase.com/docs/guides/database/extensions/pg_jsonschema).
