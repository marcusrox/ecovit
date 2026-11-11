# T-011 — Adotar validação proporcional e limitar diagnóstico ambiental

**Tipo** — Implementação

**Execução** — Verificada

**Data de execução** — 2026-11-11

**Aceite manual** — Não aplicável

## Referências e pré-condições

Solicitação de 11/11/2026, [AGENTS.md](../../AGENTS.md#validação-proporcional), [Qualidade e desempenho](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração), [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md#recorte-de-validação-da-interface) e [preparação do ambiente](../arquitetura/Persistencia-e-Compatibilidade.md#desenvolvimento-e-verificações-isoladas).

## Comportamento atual e objetivo

A prioridade para Chrome e a seleção por finalidade já existiam, mas ainda havia exigências genéricas de tipos/lint/build e matriz visual, além de investigação ambiental sem limite operacional claro. Mudanças mínimas podiam repetir fluxos extensos e gerar configurações alternativas de testes.

Definir a seleção por risco e o limite de diagnóstico no contrato de qualidade, com instruções operacionais coerentes no AGENTS.md e referências nos demais documentos.

## Escopo e limites

Alteração somente de documentação. Preservar compatibilidade, integridade, isolamento, asserções, timeouts e critérios específicos exigidos pelo solicitante. Homologações completas continuam integrais. Não alterar aplicativo, comandos, testes, tarefas anteriores ou evidências históricas. O orçamento de diagnóstico pertence ao contrato de qualidade, sem duplicá-lo nas demais referências.

## Recorte de validação

Revisar consistência entre instruções, contratos, README e modelo de task; conferir referências e diff. Não iniciar aplicativo, banco ou navegador e não executar testes/build para esta alteração documental.

## Critérios de aceite

- [x] **A01** — A política distingue documentação, texto simples, risco visual, comportamento, contratos sensíveis e homologação completa; texto simples não dispara automaticamente fluxo completo, matriz visual ou build.
- [x] **A02** — Diagnóstico ambiental tem orçamento e limite de reexecução, sem criação de infraestrutura alternativa na entrega simples; regressões do produto não são classificadas como ambientais para dispensar sua investigação.
- [x] **A03** — Validação obrigatória impedida permanece pendente/bloqueada, sem declarar a task Verificada ou presumir aceite manual. Trabalho independente pode ser concluído e informado separadamente.
- [x] **A04** — Instruções de interface, preparação e registro de tasks remetem à política central; exigências específicas e homologações completas permanecem obrigatórias, sem alteração dos resultados anteriores.

## Resultado da execução

- **Contratos atualizados** — AGENTS.md, Qualidade e desempenho, Interface e iconografia, Persistência e compatibilidade, README e modelo de task.
- **A01** — Matriz de impacto e regras de seleção/reaproveitamento documentadas; build já cobre typecheck e não deve provocar execução duplicada sem motivo.
- **A02** — Limite definido em Qualidade e desempenho, incluindo condições da única reexecução e distinção entre ambiente e regressão. Testes legítimos em andamento mantêm seus limites próprios.
- **A03** — Critérios impedidos e separação entre implementação e validação constam no contrato, AGENTS.md e modelo; nenhuma aprovação automática por falta de ambiente.
- **A04** — Revisadas as exigências genéricas de interface e o preparo obrigatório de ambiente: o recorte por risco passa a orientar sua aplicação. Novos registros distinguem evidência anterior, execução atual e pendência.
- **Verificação automatizada** — Testes do aplicativo não executados; revisão documental e git diff --check, sem alteração de código.
- **Verificação manual ou operacional** — Consistência e referências revisadas. Alterações pendentes da T-010 preservadas.
- **Aceite do solicitante** — Não aplicável: política expressamente solicitada, sem homologação do produto nesta task. Sem commit ou push.
