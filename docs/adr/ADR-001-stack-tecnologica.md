# ADR-001 — Stack tecnológica

Registro: 07/10/2026. Revisão editorial: 08/10/2026. Estado da decisão: **vigente, conforme o PRD 1.1**.

## Contexto

O MVP precisa de contas individuais e projetos privados na nuvem, enquanto o editor e o cálculo geométrico executam no navegador. O [PRD](../PRD.md), seções 4–5 e 15, prioriza poucos serviços operacionais e um único projeto npm.

## Decisão

- Uma SPA React + TypeScript strict + Vite, React Router e CSS Modules, com um `package.json` e npm.
- Supabase Auth + PostgreSQL acessado pelo SDK; autorização por RLS e mutações por RPC.
- Zod para contratos de dados e validação adicional no banco.
- Cloudflare Pages para o frontend estático; Node 24 LTS como ferramenta de desenvolvimento/build e GitHub Actions para verificações.
- Sem API própria, ORM, monorepo ou Docker obrigatório. Dependências de editor e persistência local entram junto aos recursos que as utilizam.

## Motivos

Reunir autenticação, API de dados e banco gerenciado reduz código de backend e operação própria. O cálculo no navegador permite hospedar o frontend como arquivos estáticos. A escolha do Supabase atende à simplificação operacional; não decorre de uma necessidade de desempenho do motor geométrico.

## Alternativas

- **API própria + SQLite, com eventual MySQL:** oferece controle da infraestrutura, mas transfere autenticação, autorização, hospedagem persistente e backups para o projeto. Poderia compartilhar repositório e publicação com o frontend. Foi discutida, sem adoção.
- **Somente IndexedDB/Dexie:** simplifica uma versão local do editor, mas adia contas e acesso aos projetos em outro dispositivo, alterando o escopo vigente.

## Consequências

Há dependência de serviço externo, configuração Auth/SMTP e SQL específico do PostgreSQL. A chave publicável exige autorização efetiva no banco; credenciais administrativas ficam fora do frontend. Homologação e produção usam ambientes separados.

Uma troca de infraestrutura exige revisão do PRD e novo ADR que substitua esta decisão, preservando seu histórico.

## Documentos relacionados

Entregas e aceite: [M0 — Base](../milestones/M0-base.md), [M4 — Persistência](../milestones/M4-persistencia.md) e [M5 — Liberação](../milestones/M5-liberacao.md). Organização técnica: [arquitetura](../architecture/overview.md). Versões instaladas: [package.json](../../package.json).
