# T-021 — Exibir data e hora da versão no rodapé

**Tipo** — Implementação

**Execução** — Verificada

**Data de execução** — 2026-11-16

**Aceite manual** — Confirmado pelo solicitante

## Alteração e limites

Apresentar a versão nos rodapés do login, da lista de projetos e do editor no formato `Versão: DD/MM/AAAA HH:mm · <commit>`. Exemplo com a revisão de referência: `Versão: 16/11/2026 15:31 · f976a33`.

Usar a data e hora do commit da revisão compilada, obtidas do timestamp de committer já usado na geração dos metadados (`%cI`), convertidas para `America/Sao_Paulo`, em relógio de 24 horas, com dois dígitos para dia, mês, hora e minuto. Não usar o instante da compilação, da publicação ou da abertura da página, nem o fuso do navegador. Recompilar ou republicar a mesma revisão mantém a identificação.

Somente os sete primeiros caracteres do SHA são link para `#historico-de-tasks`. O prefixo, a data, a hora e o separador são texto visível sem link. Preservar sublinhado, foco visível e nome acessível que identifique a versão completa e o destino. Manter a apresentação compartilhada entre os três rodapés, sua posição e a altura do rodapé compacto do editor.

Manter a identificação exibida no conteúdo da página de histórico coerente com a data, hora e commit da revisão apresentada nos rodapés. Não alterar seleção, ordenação ou datas de execução das tasks, navegação de retorno ou estado do projeto.

Referências: [PRD — Versão e histórico de tasks](../Ecovit-PRD.md#versão-e-histórico-de-tasks), [Interface e iconografia — Versão e histórico de tasks](../arquitetura/Interface-e-Iconografia.md#versão-e-histórico-de-tasks), [T-004](T-004-Versao-e-Historico-de-Tasks.md) e [T-010](T-010-Rotulo-da-Versao-nos-Rodapes.md). Na implementação, atualizar os contratos pertinentes de PRD e arquitetura, preservando os aceites históricos dessas tasks.

## Critérios de aceite

- [x] **A01** — Login, lista de projetos e editor exibem o mesmo formato `Versão: DD/MM/AAAA HH:mm · <commit>`, com valores reais da revisão compilada. O commit `f976a33`, de `2026-11-16T15:31:35-03:00`, aparece como `Versão: 16/11/2026 15:31 · f976a33`; o exemplo não fica fixado no código.
- [x] **A02** — Data e hora correspondem ao timestamp de committer convertido para São Paulo, inclusive quando a conversão muda o dia. Dois commits no mesmo dia em horários distintos mostram seus respectivos horários e códigos. Recompilar a mesma revisão conserva a identificação, independentemente do relógio e fuso do ambiente ou navegador.
- [x] **A03** — Somente o código do commit é clicável e abre o histórico por clique ou teclado, com foco visível e nome acessível contendo a identificação completa e o destino. O grupo permanece legível e preserva posição e altura dos rodapés existentes.
- [x] **A04** — A página de histórico identifica a mesma revisão com data e hora coerentes; seleção, ordenação e datas das tasks, acesso público e retorno com o estado de trabalho preservado continuam seguindo os contratos vigentes.

A conferência segue a [política de qualidade](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração), com recorte direcionado à geração dos metadados e à apresentação compartilhada afetada.

## Resultado

Task especificada em 2026-11-16 a pedido do solicitante; implementação autorizada posteriormente e concluída na mesma data.

- **A01** — Metadados geram a identificação com data/hora e SHA abreviado. O componente compartilhado exibe a data/hora fora do link nos três rodapés. Cenário Chrome a 900×680 aprovado e capturas dos três contextos inspecionadas.
- **A02** — Testes aprovados para conversão UTC com mudança do dia, meia-noite como 00:00, dois commits no mesmo dia, diferença entre datas de autor e committer, ambiente em outro fuso e estabilidade ao mudar o relógio para 2030. A fonte continua sendo `%cI` da revisão compilada.
- **A03** — Teste de componente confirma que somente o SHA está no link e que o nome acessível contém a versão completa e o destino. Chrome confirma clique, teclado, foco visível, ausência de sobreposição/rolagem horizontal nos três rodapés e altura preservada de 26 px no editor. Nenhum CSS alterado.
- **A04** — Histórico usa a mesma identificação completa; abertura por teclado no login e por clique no editor, retorno de foco e conservação do projeto conferidos no Chrome. Filtragem e ordenação do histórico continuam cobertas pelo teste de metadados. A lista de tasks e os mecanismos de navegação/estado não foram alterados; as evidências anteriores dos demais fluxos preservados não constituem nova execução.

**Validação proporcional** — Três testes aprovados em `tests/release-info.test.ts` e `tests/version-footer.test.ts`, em 6,22 s. Typecheck, lint direcionado e formatação aprovados. O aumento do texto no espaço limitado do editor justificou um cenário Chrome direcionado à T-021 nos três contextos, em uma única resolução: cenário em 6,7 s e execução total de 27,5 s. Não houve build, suíte ampla ou matriz Chrome/Edge. PRD e Interface e iconografia atualizados; registros históricos de T-004/T-010 preservados.

**Ocorrências** — O sandbox bloqueou a conexão ao banco isolado com EACCES; o mesmo preparo autorizado fora do sandbox aprovou. A primeira execução Chrome chegou ao fim do fluxo e falhou somente na nova expectativa de altura: o teste considerava os 33 px da regra genérica, enquanto o CSS preexistente `.editorApp .footer` define 26 px. Corrigida a expectativa para esse contrato específico, o cenário passou, sem alteração de CSS, timeouts ou demais asserções. O servidor pertenceu ao runner na porta 5174; a porta 5173 foi preservada.

**Evidências locais ignoradas pelo Git** — Logs `.tools/t021-unit.log`, `.tools/t021-typecheck.log`, `.tools/t021-lint.log`, `.tools/t021-format-check.log`, `.tools/t021-env.log`, `.tools/t021-env-authorized.log`, `.tools/t021-e2e.log`, `.tools/t021-e2e-final.log` e `.tools/t021-diff.log`; capturas `.tools/release-history/t021-{login,lista,editor}-chrome-900.png`.

**Aceite manual na conclusão técnica** — Pendente à época; confirmação posterior registrada abaixo. Verificação técnica concluída; sem commit, push ou publicação naquela etapa.


## Confirmação de aceite — 2026-11-16

Aceite manual confirmado explicitamente pelo solicitante ao informar que o resultado ficou bom e solicitar o registro dos aceites da T-021 e da T-022, com commit e push. Esta confirmação encerra a pendência manual desta task, preservando as evidências técnicas anteriores, sem representar nova execução de testes.
