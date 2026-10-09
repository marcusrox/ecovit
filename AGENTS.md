# Ecovit

- Fonte de escopo: `docs/PRD.md`, versão 1.1. Preserve o documento; implemente por marcos.
- Uma SPA React + TypeScript strict + Vite, npm, CSS Modules, pt-BR. Sem servidor próprio, ORM, Docker ou framework visual.
- `src/domain` é TypeScript puro. `src/persistence` concentra Supabase e contratos de dados. UI em `src/app`; editor em `src/editor`.
- Modelo em milímetros inteiros; valide documentos com Zod. Peças e objetos de canvas nunca são a fonte persistida.
- Variáveis VITE são públicas. Nunca incluir credenciais administrativas. RLS e RPCs validam usuário e documento no banco.
- Migrações aplicadas são imutáveis; crie nova migração para evoluir o contrato. Não altere arquivos existentes sem necessidade.
- Antes de concluir: `npm run check` e `npm run test:e2e`. Diferencie mocks locais de integração Supabase real.
- Não implemente paginação/encontros sem o catálogo validado em M1. Adicione Konva, Zustand e Dexie quando seus recursos forem implementados.
