# ADR-001 — Stack tecnológica

Data do registro: 07/10/2026. Status: **decisão vigente, documentada a partir do PRD 1.1**. Este registro não aprova uma troca de arquitetura.

## Contexto

O MVP é um editor desktop no navegador, com contas individuais e projetos privados na nuvem desde M0. O cálculo geométrico deve ser independente de autenticação e latência. O [PRD](../PRD.md), seções 4–5 e 15, define uma stack com poucos serviços operacionais e um único projeto npm.

## Decisão

- React + TypeScript strict + Vite, React Router e CSS Modules.
- Um `package.json`, npm, versões exatas no lockfile, Node 24 LTS para desenvolvimento/build e GitHub Actions para verificações.
- Supabase Auth + PostgreSQL via SDK no navegador; leitura protegida por RLS e mutações por RPC.
- Zod para o contrato de documentos; validação e autorização adicionais no banco.
- Cloudflare Pages para publicação estática, planejada para M5.
- Konva/react-konva, Zustand, Dexie e Web Worker adicionados quando seus recursos forem implementados.
- Sem backend próprio, ORM, Docker obrigatório, monorepo ou framework visual no MVP vigente.

A versão de desenvolvimento fixada nesta base é Node 24.18.0/npm 11.16.0. As dependências instaladas são registradas no [package.json](../../package.json); bibliotecas planejadas não devem ser descritas como já instaladas.

## Alternativas discutidas

| Alternativa | Impacto no projeto | Situação |
| --- | --- | --- |
| API própria + SQLite, eventual migração para MySQL | Exige backend, autenticação/autorização, hospedagem com armazenamento persistente, backups e migrações diferentes | Discutida, não adotada |
| Persistência somente local com IndexedDB/Dexie | Permite priorizar o editor, mas adia contas e reabertura na nuvem | Não atende ao escopo vigente sem revisão do PRD |
| Backend e frontend no mesmo repositório | Seria possível manter um projeto npm e publicação conjunta se a alternativa de API própria fosse aprovada | Possibilidade futura, sem implementação |

A discussão dessas alternativas não autoriza remover Supabase nem criar `server/` na base atual.

## Consequências

O serviço gerencia identidade e exposição de dados, reduzindo código operacional próprio. Em contrapartida, o projeto depende de configuração Auth/SMTP, do serviço externo e de funções/migrações específicas do PostgreSQL. A chave publicável não substitui RLS nem verificações de propriedade.

Frontend estático não contém credenciais administrativas. Homologação e produção precisam de ambientes separados. Backups e restauração devem ser comprovados antes da liberação de dados reais.

## Validação e revisão

M0 tem evidências locais, mas o aceite externo ainda precisa ser registrado. Consulte [M0 — Base](../milestones/M0-base.md) e [relatório](../M0-verificacao.md).

Uma mudança para API própria/SQLite/MySQL exige novo ADR, revisão explícita do PRD e testes equivalentes de isolamento, validação e persistência. Preserve este registro histórico e marque sua substituição quando houver decisão aprovada.
