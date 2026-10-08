# Módulos e responsabilidades

Referência: [PRD](../PRD.md), seção 5. A aplicação é um único pacote npm; as pastas são módulos internos, não workspaces.

## Implementação atual

| Local | Responsabilidade | Arquivos principais |
| --- | --- | --- |
| `src/main.tsx` | Inicializar React e estilos globais | [main.tsx](../../src/main.tsx) |
| `src/app` | Rotas, estado de sessão, autenticação, lista e formulário de projeto | [App.tsx](../../src/app/App.tsx), [SessionProvider.tsx](../../src/app/SessionProvider.tsx), [ProjectsPage.tsx](../../src/app/ProjectsPage.tsx) |
| `src/editor` | Carregar/apresentar documento e configuração no editor vazio | [EditorPage.tsx](../../src/editor/EditorPage.tsx) |
| `src/domain` | Modelo, validação e criação de documento vazio | [project.ts](../../src/domain/project.ts) |
| `src/persistence` | Cliente Supabase, operações Auth/projetos e falhas normalizadas | [supabase.ts](../../src/persistence/supabase.ts), [auth.ts](../../src/persistence/auth.ts), [projects.ts](../../src/persistence/projects.ts), [errors.ts](../../src/persistence/errors.ts) |
| `supabase/migrations` | Validação SQL, tabelas, RLS e criação por RPC | [Migração inicial](../../supabase/migrations/202610070002_projects.sql) |
| `tests/fixtures` | Documentos aceitos/rejeitados comuns a Zod e SQL | [documents.ts](../../tests/fixtures/documents.ts) |
| `tests/unit` | Testes de schema e erros | [project.test.ts](../../tests/unit/project.test.ts), [errors.test.ts](../../tests/unit/errors.test.ts) |
| `tests/e2e` | Fluxos de navegador com Supabase simulado | [m0.spec.ts](../../tests/e2e/m0.spec.ts) |
| `scripts` | Consistência estrutural do schema e integração real opcional | [check-schema.ts](../../scripts/check-schema.ts), [test-cloud.ts](../../scripts/test-cloud.ts) |

## Regras de dependência

1. `domain` não importa React, Konva, Zustand, Supabase ou componentes de interface. Usa TypeScript e Zod para o contrato.
2. `app` e `editor` chamam as funções de `persistence`; componentes não dispersam consultas a tabelas/RPCs.
3. `persistence` valida documentos com `domain`, normaliza falhas e não depende da renderização do editor.
4. Editor/renderização consomem documento e resultados; não se tornam fonte autoritativa dos dados.
5. Objetos Konva, tokens e estados de ferramentas não entram no documento exportado/persistido.

O contexto de sessão fica em `app`, com operações Auth em `persistence`. O cliente Supabase permanece centralizado, e sua configuração ausente desabilita o acesso com orientação visível.

## Evolução planejada

| Módulo | Próximas responsabilidades | Marco oficial |
| --- | --- | --- |
| `domain` | Geometria, paginação, encontros, vãos, diagnósticos e agregação | M1 |
| `editor` | Canvas, transformação, comunicação com worker e descarte de respostas antigas | M1 |
| `editor` | Ferramentas, comandos, seleção, histórico, snaps e propriedades | M2 |
| `persistence` | Rascunhos IndexedDB/Dexie; confiabilidade de recuperação | Início no editor, conclusão M4 |
| `editor` / `domain` | Inspeção de fiadas/elevações, relatórios, importação/exportação | M3 |
| `persistence` / migrações | Autosave, save/delete, idempotência, conflitos, retenção e purga | M4 |

As linhas acima descrevem responsabilidades, não diretórios ou funções já criados. Adicionar dependências e arquivos quando a funcionalidade correspondente for implementada.

## Verificação por fronteira

- Domínio: fixtures/invariantes independentes da interface.
- Interface: Playwright com rede simulada e, separadamente, prova manual com serviço real.
- Persistência/banco: mesmos documentos contra Zod e RPCs; duas contas, acesso anônimo e escrita direta para verificar isolamento.
- Operação: build estático, fallback de rotas, CI, Auth/SMTP, publicação e restauração nos ambientes correspondentes.

Comandos e configuração para Windows ficam no [README](../../README.md). Critérios completos e dependências estão no [roadmap](../ROADMAP.md).
