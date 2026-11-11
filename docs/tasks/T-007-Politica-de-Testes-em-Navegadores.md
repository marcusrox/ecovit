# T-007 — Priorizar Chrome nas verificações cotidianas

**Tipo** — Implementação

**Execução** — Verificada

**Data de execução** — 2026-11-11

**Aceite manual** — Não aplicável

## Referências e pré-condições

- Solicitação de 11/11/2026: priorizar Chrome nas tasks cotidianas e usar Edge em verificações específicas e homologações completas.
- [AGENTS.md](../../AGENTS.md#validação), [Qualidade e desempenho](../arquitetura/Qualidade-e-Desempenho.md#verificação-em-navegadores) e [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md#iconografia).
- Compatibilidade Chrome/Edge desktop do PRD preservada. Exemplos de execução e configuração do banco no [README](../../README.md#verificações).

## Comportamento atual e objetivo

O comando cotidiano test:e2e executava todos os projetos Playwright selecionados na configuração, repetindo cada cenário no Chrome e no Edge. Os contratos também exigiam ambos nas revisões de interface de cada implementação.

Usar Chrome como padrão cotidiano e reservar Edge para verificações direcionadas de compatibilidade e homologações completas. A política de seleção é centralizada em Qualidade e desempenho, com referências nos contratos dos assuntos afetados.

## Escopo e limites

- test:e2e seleciona Chrome; test:e2e:edge seleciona Edge; test:e2e:full seleciona ambos. Manter os dois projetos na configuração Playwright.
- Permitir filtros e arquivos pelos comandos npm e pelo parâmetro TestArguments de Start-Ecovit.ps1. A homologação completa exige test:e2e:full sem filtros.
- Atualizar AGENTS.md, README e contratos vigentes, preservando resoluções, critérios de acessibilidade e registros históricos das execuções já realizadas.
- Manter banco/sessões isolados, porta 5174, servidor próprio por execução, timeouts, workers e todas as asserções. Porta 5173 reservada ao solicitante.
- Não alterar comportamento do produto, compatibilidade suportada, dependências, testes de domínio/API, casos de teste ou código de interface. Sem homologação completa de versão nesta task.

## Critérios de aceite

- [x] **A01** — A listagem de test:e2e contém somente Chrome, test:e2e:edge somente Edge e test:e2e:full todos os cenários de ambos, sem perda de casos. Verificação pela descoberta Playwright com --list e comparação dos conjuntos.
- [x] **A02** — Start-Ecovit.ps1 aceita os três comandos, encaminha arquivo/filtro e preserva o código de saída, incluindo seleção sem correspondência. Verificação por invocação do script com argumentos.
- [x] **A03** — Uma execução direcionada do cenário T-006 pelo comando cotidiano passa somente no Chrome; a mesma seleção pelo comando Edge passa somente no Edge, com servidor próprio em 5174. Verificação por teste real de navegador em banco descartável.
- [x] **A04** — As instruções e os contratos vigentes descrevem Chrome cotidiano, Edge por risco específico e ambos na homologação completa. Resoluções e compatibilidade continuam preservadas, sem reescrever resultados históricos. Verificação por revisão de consistência e busca nos documentos afetados.

## Resultado da execução

- **Contratos atualizados** — AGENTS.md, README e os assuntos Qualidade e desempenho, Interface e iconografia, Editor e interação, Medidas e imagens e Persistência e compatibilidade. A compatibilidade do PRD permanece Chrome/Edge desktop, sem mudança de produto. Resultados da T-006 e marcos anteriores preservados.
- **A01** — Aprovado: --list pelos três comandos identificou 197 cenários Chrome, 197 Edge e 394 no completo. Comparação dos conjuntos confirmou a mesma cobertura por navegador e união exata no completo. Nenhum cenário removido. playwright.config.ts manteve seus dois projetos e parâmetros originais.
- **A02** — Aprovado: os três comandos funcionaram pelo script local. Encaminhamento de arquivo e --grep, inclusive expressão com espaços, validado com --list; o filtro T-006 selecionou um cenário por navegador. Seleção sem correspondência com --list retornou No tests found, zero cenários e código 1 preservado. Invocações bem-sucedidas retornaram 0.
- **A03** — Aprovado: Start-Ecovit.ps1 -Task test:e2e com TestArguments para floors.spec.ts, --grep T-006 e --reporter=line executou um cenário somente no Chrome (19,2 s). A mesma seleção com -Task test:e2e:edge executou um cenário somente no Edge (19,5 s). Cada execução iniciou seu servidor na porta 5174 com banco PostgreSQL descartável ecovit_test; porta 5173 preservada.
- **A04** — Aprovado por revisão de consistência e busca nos contratos: prioridade cotidiana para Chrome, Edge direcionado conforme risco e suíte integral em ambos na homologação. Resoluções e critérios de interface, isolamento e compatibilidade preservados.
- **Verificação automatizada** — Typecheck e lint aprovados. Logs completos ignorados pelo Git em .tools/t007-*.log. Descoberta integral de 394 combinações cenário/navegador; execução real de duas combinações (mesmo cenário nos dois navegadores). A suíte completa de navegador, os testes de domínio/API e o build de produto não foram executados nesta task de comandos e política; sem alteração no código do aplicativo ou em dependências.
- **Verificação manual ou operacional** — Revisão documental concluída. Sem alteração visual ou funcional no produto. O banco descartável iniciado para esta validação foi encerrado ao concluir.
- **Aceite do solicitante** — Não aplicável: política solicitada explicitamente e verificada pelos comandos; nenhuma homologação de versão ou publicação declarada.
