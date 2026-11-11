# T-008 — Separar testes de navegador por finalidade

**Tipo** — Implementação

**Execução** — Verificada

**Data de execução** — 2026-11-11

**Aceite manual** — Não aplicável

## Referências e pré-condições

Solicitação de 11/11/2026, [T-007](T-007-Politica-de-Testes-em-Navegadores.md) e [Qualidade e desempenho](../arquitetura/Qualidade-e-Desempenho.md#verificação-em-navegadores).

## Comportamento atual e objetivo

Arquivos misturam revisão de interface, fluxos e carga. Classificar cada cenário explicitamente por finalidade para permitir recortes cotidianos sem executar carga por acidente.

## Escopo e limites

Usar tags Playwright @interface, @fluxo e @carga, com uma finalidade principal por cenário, inclusive casos parametrizados. Expor comandos dos grupos no Chrome e seleção por tag no Edge. Conservar nomes, asserções, timeouts, workers, os dois projetos e todos os cenários na homologação completa. Os grupos não substituem a seleção dos fluxos afetados nem a política de compatibilidade.

## Critérios de aceite

- [x] **A01** — A descoberta preserva todos os cenários existentes e cada um possui exatamente uma finalidade principal.
- [x] **A02** — Os comandos de interface, fluxos e carga selecionam conjuntos disjuntos cuja união é toda a suíte; Edge aceita as mesmas tags e a homologação completa conserva ambos os navegadores.
- [x] **A03** — Execução real de um cenário de interface e um fluxo passa pelos novos comandos; descoberta de carga conserva seus casos sem executar cargas desnecessárias nesta alteração de infraestrutura.

## Resultado da execução

- **Contratos atualizados** — Finalidades em Qualidade e desempenho; seleção operacional em AGENTS.md e README. Comandos no package.json e Start-Ecovit.ps1.
- **A01** — Aprovado: descoberta anterior e posterior preserva os 197 nomes/cenários existentes; cada cenário possui exatamente uma finalidade. Timeouts e expectedStatus conferidos sem alteração. Mudanças nos arquivos de cenários são metadados de finalidade e a formatação correspondente, mantendo suas asserções.
- **A02** — Aprovado: 26 cenários @interface, 162 @fluxo e 9 @carga; conjuntos disjuntos com união exata da suíte. Descoberta completa conserva 394 execuções Chrome/Edge. O seletor combina finalidade e --grep/-g adicional; verificação com T-006|backup no grupo de interface/Edge selecionou apenas T-006, sem admitir backup de carga. PowerShell agora invoca o CLI npm por Node, evitando interpretação de metacaracteres por npm.cmd.
- **A03** — Aprovado no Chrome: interface/T-006 em 14,8 s e fluxo/troca de pavimento em 16,8 s, pelo ambiente final UTF8 e sem exportar conexão manualmente. Listagem de carga validada sem executá-la. Execuções preliminares dos mesmos dois cenários também passaram; não contam como cobertura adicional.
- **Verificação automatizada** — Typecheck e lint aprovados. Três testes unitários de seleção aprovados: finalidade permanece obrigatória com filtro adicional, Edge explícito e recusa de argumentos ambíguos/inválidos. Foram executados junto aos três testes de ambiente da T-009: seis testes em 686 ms. Logs completos e comparação de descoberta em .tools/t008-*.log e .tools/t008-all-final.json, ignorados pelo Git. Não foi executada a suíte completa de navegador nem a carga nesta mudança de classificação/comandos.
- **Verificação manual ou operacional** — Revisão dos grupos e contratos concluída; nenhuma alteração visual no produto.
- **Aceite do solicitante** — Não aplicável; sem homologação de versão ou publicação.

## Revisão solicitada em 11/11/2026

- Corrigida a perda da semântica nativa de --grep com expressões /padrão/gi e flags explícitas; expressões comuns mantêm gi, como no Playwright. Grupo desconhecido herdado de Object.prototype e filtro sem valor antes de outra opção são recusados. A finalidade é conferida no sufixo de metadados, evitando que sua menção no título admita outro grupo.
- Acrescentada descoberta automatizada dos cenários para exigir exatamente uma finalidade válida de cada teste, inclusive os parametrizados. Não inicia servidor nem navegador. Os grupos e os 197 cenários foram preservados.
- Validação da revisão: cinco testes de seleção aprovados junto aos cinco de ambiente da T-009 (10 em 1,62 s), cenário T-006 no Chrome usando /t-006/i aprovado em 14,4 s, tipos/lint e build aprovados. Logs em .tools/review-008-009-*.log. Nenhuma suíte completa ou carga foi executada nesta revisão.
