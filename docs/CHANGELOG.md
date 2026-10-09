# Changelog

Histórico de alterações relevantes do Ecovit. Versões de pacote não representam aceite automático de marcos. Critérios e situação ficam no [roadmap](ROADMAP.md).

## Não publicado

### Simplificação dos ADRs — 08/10/2026

- ADRs limitados ao contexto, decisão, motivos, alternativas e consequências, com links para os marcos correspondentes.
- Removido o acompanhamento de implementação e testes dos ADRs: execução/aceite permanecem nos milestones e evidências em `docs/verification/`.
- Decisões técnicas e requisitos do PRD preservados; esclarecida no README a finalidade de cada documento.

### Relatórios de verificação — 07/10/2026

- Relatório inicial de M0 movido para `docs/verification/M0-verificacao.md`, com conteúdo preservado e referências atualizadas.

### Centralização do PRD — 07/10/2026

- Após o commit `69c7c8f`, removida a cópia duplicada da raiz; `docs/PRD.md` passa a ser o documento oficial, com conteúdo inalterado.
- Referências de README, roadmap e AGENTS atualizadas. O arquivo original continua recuperável no histórico do Git.

### Documentação — 07/10/2026

- Organização de `docs/` com PRD 1.1 integral, roadmap, seis documentos de marcos, três ADRs e arquitetura.
- Marcos alinhados diretamente ao PRD: M0 Base, M1 Núcleo, M2 Editor, M3 Inspeção, M4 Persistência e M5 Liberação. Substituída a divisão temática inicial para manter uma única numeração e o mesmo escopo do PRD.
- Registro da arquitetura vigente com Supabase e da alternativa discutida de API própria/SQLite/MySQL, ainda não adotada.
- PRD original e relatório `M0-verificacao.md` preservados no commit de organização `69c7c8f`.

## 0.1.0 — Base M0 — 07/10/2026

Commit: `95ed59c` — `feat: implementa base M0 com React e Supabase`. Essa identificação corresponde ao `package.json`; não houve comprovação de publicação de uma release/tag.

### Adicionado

- SPA React + TypeScript strict + Vite com React Router, CSS Modules e versões npm fixadas.
- Telas de autenticação, recuperação, projetos, configuração inicial e editor vazio protegido por sessão.
- Schemas Zod, modelo paramétrico, normalização de falhas e contratos de criação/lista/leitura.
- Integração Supabase e migrações iniciais para validação, projetos, revisões, RLS e `create_project`.
- Vitest, Playwright, script de homologação, workflow CI, fallback SPA, `.env.example`, AGENTS e README Windows.

### Corrigido

- Cache do servidor de testes separado do desenvolvimento para evitar invalidação de dependências; documentada recuperação de `504 — Outdated Optimize Dep` com reinício forçado do Vite.

### Verificação e limitações

- Lint, tipos, schema estrutural e build aprovados; 28 testes unitários e 8 E2E locais aprovados.
- E2E utiliza Supabase simulado. Integração real, aplicação de migrações, entrega de e-mails e isolamento no serviço ainda precisam de evidências de homologação.
- Editor sem desenho/paginação; demais marcos não implementados.
- Commit enviado à `main`; execução hospedada do CI não foi verificada nesta documentação.

## Documento inicial — 07/10/2026

Commit: `62b9e21` — `Initial commit`. Inclusão do PRD versão 1.1 originalmente na raiz do repositório, recuperável pelo histórico do Git.
