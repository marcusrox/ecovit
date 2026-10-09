# M0 — Base

Marco **M0 — Base** do [PRD 1.1](../PRD.md), seções 4, 5, 10 e 13. A numeração e o escopo seguem o [roadmap](../ROADMAP.md).

Status em 07/10/2026: implementação local entregue; aceite de nuvem pendente de comprovação.

## Objetivo

Permitir iniciar a aplicação com npm, autenticar uma conta e criar/reabrir um projeto privado na nuvem, com documento validado e editor vazio.

## Entregas implementadas

- React, TypeScript strict, Vite, React Router e CSS Modules, com um `package.json` e lockfile.
- Rotas de entrada, cadastro, recuperação, redefinição, projetos e editor protegido.
- Configuração inicial do tijolo, altura/juntas confirmadas e documento vazio.
- Schema Zod, limites e referências; rejeição de versões desconhecidas.
- Módulo Supabase para sessão, criação por RPC, lista de metadados e carregamento validado.
- Migrações iniciais com tabelas, RLS, validação e criação transacional/idempotente.
- Comandos de desenvolvimento, lint, tipos, testes, build, CI e README para Windows.
- Caches separados entre Vite de desenvolvimento e servidor E2E.

## Critérios de aceite

- [x] Instalação e execução do frontend sem backend próprio ou Docker.
- [x] `npm run check` aprovado localmente.
- [x] `npm run test:e2e` aprovado com Supabase simulado.
- [x] Ausência de configuração apresentada com orientação, sem login fictício.
- [ ] Migrações aplicadas e validadas em homologação real.
- [ ] Cadastro, confirmação e recuperação por e-mail comprovados.
- [ ] Criação e leitura de projeto real, inclusive em outro navegador.
- [ ] `npm run test:cloud` aprovado com duas contas distintas.

Itens marcados referem-se às evidências locais registradas; não atestam serviços externos. A tela de editor vazia não implementa desenho ou paginação.

## Dependências e limites

São necessários projeto Supabase de homologação, URL/chave publicável, SMTP, redirects e duas contas de teste. As instruções estão no [README](../../README.md); valores reais e senhas não pertencem à documentação.

RF01 e RF14 têm apenas sua base iniciada: renomeação, exclusão, autosave, recuperação e conflitos ficam em [M4 — Persistência](M4-persistencia.md). Publicação e restauração de produção ficam em [M5 — Liberação](M5-liberacao.md). O próximo marco de desenvolvimento é [M1 — Núcleo](M1-nucleo.md).

## Evidências

- [Relatório M0](../verification/M0-verificacao.md)
- [Testes de navegador](../../tests/e2e/m0.spec.ts)
- [Teste de homologação](../../scripts/test-cloud.ts)
- [ADR da stack](../adr/ADR-001-stack-tecnologica.md)
