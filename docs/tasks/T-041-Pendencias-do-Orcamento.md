# T-041 — Identificar e resolver pendências do Orçamento

**Tipo** — Implementação

**Resumo** — Consulte o que falta para completar o orçamento e acesse os campos que precisam de ajuste. Os motivos de valores incompletos ou parciais também acompanham o relatório PDF.

**Execução** — Verificada

**Data de execução** — 2026-11-27

**Aceite manual** — Pendente

## Alteração e limites

Acrescentar, junto ao resumo do Orçamento do aplicativo, uma lista de pendências que explique por que os custos ou o total estão incompletos, parciais ou indisponíveis. Cada entrada identifica o grupo/material afetado, o motivo e o próximo passo possível. Permitir acessar diretamente o campo ou a seção correspondente para realizar o ajuste pelo fluxo existente.

Criação da especificação solicitada em 26/11/2026. Implementação autorizada posteriormente pelo solicitante na mesma data, sem commit ou push. Considerar os grupos vigentes, incluindo impermeabilizante e rejunte da T-040; esta task não encerra nem presume a validação ou o aceite daquela entrega.

### Identificação das pendências

Derivar os motivos dos mesmos dados e estados que determinam a disponibilidade dos resultados, sem criar fórmulas ou validações concorrentes. Abranger:

- Preço ausente ou inválido de material utilizado, incluindo limpeza explícita de preço.
- Parâmetro necessário ausente ou inválido, como rendimento, percentual de aplicação, perdas ou distribuição de assentamento incompleta.
- Configuração de esquadria que impeça seu orçamento, conforme as regras existentes.
- Massa nominal indisponível para ferragem presente, sem cadastrar ou estimar massa automaticamente.
- Composição indisponível ou desatualizada e diagnósticos que tornem os quantitativos ou as ferragens parciais.
- Limite numérico que impeça representar um resultado ou total.

Exibir somente motivos aplicáveis ao estado atual. Preço zero confirmado continua válido; material sem uso não exige preço ou rendimento quando o contrato vigente os dispensa. Não exigir parâmetros opcionais nem tratar ausência de referência administrativa como pendência adicional quando o preço efetivo já estiver disponível. Falha de consulta de referência não invalida por si um preço próprio.

Agrupar por grupo de materiais, na ordem apresentada no Orçamento. Não repetir a mesma causa em cada subtotal e no total geral; preservar entradas distintas para materiais ou alvos diferentes. Distinguir falta de preenchimento, entrada inválida, resultado parcial e indisponibilidade. Não classificar o orçamento como completo apenas por desaparecer uma pendência financeira enquanto houver parcialidade geométrica.

Apresentar os impedimentos conhecidos na etapa atual de cada cálculo. Quando uma base estiver indisponível, explicar essa causa sem presumir materiais utilizados ou listar preços/rendimentos cuja necessidade ainda não possa ser determinada. Para dependências encadeadas, seguir a ordem de validação existente: um rendimento necessário ausente pode aparecer antes do preço, que será identificado após resolver o rendimento. Não exigir enumerar antecipadamente todas as falhas possíveis. Grupos independentes continuam apresentando seus próprios motivos; ausência de composição não impede identificar pendências de esquadrias calculadas pela intenção.

Uma causa comum de indisponibilidade deve aparecer uma vez, identificando os grupos efetivamente afetados. Para parcialidade, resumir por grupo e indicar os pavimentos envolvidos quando essa informação já existir. Não reproduzir cada ocorrência geométrica, fiada ou grampo na lista: o detalhe permanece no relatório de diagnósticos ou na seção de ferragens existente. Somente erros/pendências que afetem a disponibilidade ou parcialidade orçamentária entram nesse resumo; não ampliar as regras de severidade do motor. Se apenas a soma geral exceder o limite numérico, identificar o total geral como alvo, preservando os subtotais válidos.

A lista acompanha as prévias dos campos em edição, sem confirmar rascunhos nem substituir os eventos Enter/blur. Atualizar ou remover cada motivo quando o estado correspondente mudar. Ao resolver a última pendência, apresentar indicação discreta de ausência de pendências nos materiais abrangidos pelo Ecovit, sem afirmar completude do custo da obra ou validação estrutural.

Erros de validação de rascunhos que bloqueiem a exportação também devem ser identificáveis na lista, mesmo quando não alterem um custo, como descrição de produto acima do limite. Distinguir esse motivo dos impedimentos financeiros. Um rascunho válido ainda não confirmado não é uma nova pendência de custo; sua confirmação e o bloqueio de exportação continuam no fluxo existente. A ausência de pendências não equivale a confirmação de gravação, autorização de exportação ou término de processamento. Durante consulta/incorporação de referências ou processamento, conservar a indicação transitória existente e não anunciar conclusão antecipada.

### Acesso ao ajuste

Para pendência de preenchimento, a ação leva à seção, revela o conteúdo necessário e posiciona o foco no campo correspondente. Usar a rolagem geral do diálogo; não abrir outro editor de orçamento. Navegação por teclado e foco visível seguem os componentes existentes. A atualização da lista não deve roubar o foco de quem está digitando.

Quando houver vários campos possíveis para uma causa, como a soma dos percentuais de assentamento, levar à seção ou ao controle coletivo pertinente, sem escolher arbitrariamente um valor a corrigir. Se o destino estiver desabilitado por somente leitura ou bloqueio transitório, localizar o título/aviso da seção em vez de tentar focar o input desabilitado. Preservar as mensagens de impedimento de edição. A ação deve continuar coerente se o blur do campo de origem confirmar uma edição e remover a pendência antes de concluir a navegação; nesse caso, não focar alvo inexistente nem descartar a edição, podendo permanecer na seção pertinente.

Para problema que dependa do editor, levar à seção/aviso pertinente e oferecer o acesso existente ao diagnóstico, quando disponível. Para composição desatualizada ou ausente, orientar a seguir o fluxo vigente de abertura/atualização; não criar comando de recomposição dentro do Orçamento. Preservar as transições e bloqueios atuais. Quando não houver ação direta, explicar o próximo passo sem apresentar botão inoperante. Não criar correção automática de geometria, preenchimento de parâmetros ou atualização silenciosa de preços. A ampliação solicitada em 27/11/2026 permite localizar individualmente a primeira esquadria de um grupo com tipo/material pendente, conforme o registro abaixo.

O resumo de pendências permanece global, independentemente do filtro de pavimento ou das seções recolhidas. Localizar uma esquadria com tipo/material pendente ativa seu pavimento e a seleciona em Planta; os demais destinos dentro do Orçamento não alteram o pavimento ativo do editor; a mudança de contexto para localizar diagnóstico segue exclusivamente o fluxo existente. Somente leitura mantém as explicações e a navegação de consulta, sem habilitar edição ou ações de escrita. Processamento, salvamento e recuperação conservam seus bloqueios e mensagens próprios.

### Relatório PDF e integridade

Incluir no PDF os motivos de incompletude, parcialidade e indisponibilidade aplicáveis ao documento capturado, com identificação do grupo/material e explicação suficiente para compreender os totais. Compartilhar a origem dos motivos entre tela e relatório. O PDF inclui todos os pavimentos, sem depender do filtro ou das seções recolhidas, e apresenta texto estático no lugar das ações interativas.

Preservar os bloqueios de exportação por rascunho inválido e demais estados existentes: esta task não autoriza exportar um estado que hoje é recusado. Quando a exportação for permitida, os motivos devem corresponder aos valores efetivamente impressos, sem transportar rascunhos descartados ou pendências de outra revisão.

A lista é uma projeção de consulta. Produzir a lista e acionar sua navegação não criam operações de documento próprias. Preservar a incorporação de referências ao abrir o Orçamento editável e a confirmação normal por blur de um campo já editado ao navegar; esses efeitos existentes podem salvar e criar histórico. Não suprimir o blur nem acrescentar confirmação forçada. A correção feita pelo usuário usa os campos e operações existentes, com seus efeitos normais de confirmação, histórico e salvamento. Não persistir a lista, criar API, alterar formato de arquivo ou acrescentar grupos de custos. Reutilizar os modelos de consulta e a renderização compartilhada com o PDF; a task não requer motor genérico de regras, novo gerenciamento global de estado ou refatoração geral dos grupos.

Na implementação, registrar a regra de disponibilidade e apresentação dos motivos em Quantitativos, a navegação/foco em Interface e Iconografia e ajustar RF-11 somente no que for necessário ao comportamento acordado. Preservar os IDs e aceites anteriores; consultar o catálogo de ícones se houver novos controles com iconografia.

Referências: [PRD — RF-11](../Ecovit-PRD.md#rf-11--orçamento-quantitativos-e-arquivo-nativo), [Quantitativos](../arquitetura/Quantitativos.md), [Interface e Iconografia](../arquitetura/Interface-e-Iconografia.md), [Estado, Histórico e Operações](../arquitetura/Estado-Historico-e-Operacoes.md), [T-039](T-039-Precos-de-Referencia-na-Administracao.md) e [T-040](T-040-Orcamento-de-Impermeabilizante-e-Rejunte.md).

## Critérios de aceite

- [x] **A01** — O resumo identifica os motivos atuais que impedem custos/totais ou os tornam parciais, com grupo/material e orientação. Preço da canaleta ausente e rendimento necessário do impermeabilizante ausente aparecem como duas pendências distintas; a mesma causa não é repetida no subtotal e no total geral.
- [x] **A02** — Zero confirmado, material sem uso e parâmetros dispensados pelas regras existentes não geram pendência. Preço ausente, inclusive explicitamente limpo, é identificado quando necessário ao custo. Configuração incompleta, massa nominal indisponível, composição indisponível/desatualizada, parcialidade e limites numéricos preservam seus significados. Base indisponível não gera faltas presumidas de preços; a causa comum identifica seus grupos uma vez, sem ocultar motivos de grupos independentes. Impedimentos encadeados aparecem conforme a etapa conhecida do cálculo, e estouro exclusivo do total preserva subtotais válidos.
- [x] **A03** — Acionar uma pendência de campo revela a seção e foca o controle correto, inclusive por teclado; causas coletivas levam à seção pertinente. As pendências acompanham prévias e confirmações sem roubar foco, salvar rascunhos inválidos ou exibir valores anteriores como atuais; correções removem os motivos resolvidos. Erro de rascunho que bloqueie somente a exportação é distinguido de impedimento financeiro. A indicação de ausência de pendências não promete salvamento/exportação concluídos e não aparece antecipadamente durante processamento ou consulta/incorporação de referências.
- [x] **A04** — Pendências globais continuam visíveis ao filtrar pavimentos ou recolher detalhes. Parcialidade é resumida sem duplicar ocorrências do relatório de diagnósticos. Problemas dependentes do editor usam os acessos existentes ou orientação concreta, respeitando bloqueios e contexto; não há novo comando de recomposição ou correção automática. A navegação individual de esquadria com tipo/material pendente segue a ampliação de 27/11/2026. Somente leitura e bloqueios transitórios permitem localizar a seção sem focar campos desabilitados nem habilitar edição. Pendência resolvida pelo blur durante a navegação não causa perda de edição ou foco em alvo inexistente.
- [x] **A05** — O PDF permitido para um orçamento incompleto ou parcial explica os motivos correspondentes aos valores capturados e abrange todos os pavimentos. Tela e relatório compartilham os motivos; controles interativos não aparecem no PDF e os bloqueios de exportação existentes são preservados.
- [x] **A06** — A lista e sua navegação não criam operações de documento próprias; incorporação de referências ao abrir o Orçamento e confirmação por blur de campos já editados preservam seus efeitos existentes. Ajustes confirmados seguem o salvamento e a recuperação vigentes; cálculos, subtotais, total e estados de origem/limpeza continuam nos contratos atuais, sem persistência da lista ou mudança de formato/API.

Escolher a conferência proporcional conforme [Qualidade e desempenho](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração). Os critérios não impõem suíte completa, matriz de telas ou homologação ampla.

## Resultado

Especificação criada em 26/11/2026, sem implementação. Conferência documental de escopo, referências e diff; nenhum teste do aplicativo, banco, navegador ou build executado. Execução dos critérios e aceite manual permanecem pendentes. Sem commit, push ou publicação.

Revisão documental em 26/11/2026, solicitada antes da implementação: esclarecidos efeitos de blur/incorporação, causas encadeadas e compartilhadas, massa nominal indisponível, erros exclusivos de exportação, navegação em somente leitura e alvos alterados durante a confirmação. Limitado o resumo de parcialidade aos grupos/pavimentos, reaproveitando detalhes e acessos existentes, sem novo fluxo de recomposição ou infraestrutura genérica. A01–A06 preservados e refinados. Inspecionados os componentes e modelos atuais para conferir compatibilidade; sem execução funcional. Implementação, execução dos critérios e aceite manual continuam pendentes.

### Implementação e verificação — 2026-11-26

Implementação autorizada e realizada no aplicativo, sem commit, push ou publicação. Os registros anteriores descrevem as etapas documentais. Aceite manual permanece pendente.

| Critério | Resultado técnico |
|---|---|
| A01–A02 | `budget-issues.ts` reúne os motivos dos modelos/validações existentes: preços, parâmetros, configuração de esquadrias, massa fora do catálogo, disponibilidade, parcialidade e limites numéricos. Testes dirigidos verificam zero, ausência/limpeza, material sem uso, rendimento antes de preço, causas de base compartilhadas e independência de esquadrias; bitolas diferentes com o mesmo motivo não são colapsadas. |
| A03 | Chrome verificou localização por teclado e mouse, foco preservado durante edição inválida/válida, atualização das prévias e confirmação normal por blur. Destinos são os próprios campos; causas coletivas e destinos desabilitados/ausentes usam títulos com foco visível. Erro exclusivo de descrição/exportação tem cobertura de projeção; rascunhos válidos continuam no fluxo existente. |
| A04 | Lista calculada sem filtro local; Chrome verificou filtro/recolhimento e localização em somente leitura sem mutar documento/histórico/contexto. Teste de projeção cobre resumo de parcialidade por grupo/pavimento sem ocorrências individuais. Inspeção confirma que localizar ferragens parciais revela o detalhe para Todos e não chama troca de pavimento, motor ou novo acesso individual ao editor. Captura em 900 × 680 inspecionada, sem transbordamento na lista. |
| A05 | Renderização compartilhada verifica os motivos da revisão capturada, sem botões ou efeitos de consulta. Chrome comparou os textos com os blocos reais do paginador e baixou PDF válido em somente leitura, preservando o documento. Abrangência de todos os pavimentos e bloqueios de exportação reutilizam o fluxo da T-038, com regressões existentes do relatório aprovadas. |
| A06 | Testes de projeção/renderização e snapshots de Chrome confirmam ausência de operações próprias ao consultar/localizar e preservação do documento/histórico/contexto. Confirmação por blur foi verificada com preço zero. Escritores, salvamento, recuperação, incorporação/origem de referências e cálculos existentes preservados por inspeção; sem mudança em API, persistência ou formato. Não foi repetida homologação de falhas de rede ou de arquivos. |

Validação proporcional: projeção/relatório em Vitest e dois cenários direcionados de Chrome, pois a alteração afeta motivos compartilhados, foco e saída do PDF. Sem suíte completa, matriz de navegadores ou build; tipos e lint cobrem a integração estática.

- **Vitest:** 16 testes em `budget-issues.test.ts` e `budget-report.test.ts` aprovados; rodada final em 1,42 s (comando em 5,4 s), log `.tools/logs/t041-unit-final.log`.
- **Chrome:** dois cenários distintos aprovados em 27,6 s (comando em 29,1 s), log `.tools/logs/t041-browser-final.log`; captura `.tools/logs/t041-issues-900.png` e PDF `.tools/logs/t041-budget.pdf`. Sem somar repetições como cobertura. A primeira execução parou na importação por formato incorreto de `priceSources` na fixture, também identificado pelo typecheck; fixture corrigida para a estrutura vigente, sem ampliar timeouts ou reduzir asserções.
- **Tipos e lint:** aprovados na revisão final em 26,0 s e 6,5 s, logs `.tools/logs/t041-typecheck-final.log` e `.tools/logs/t041-lint-final.log`. Conferência de diff sem erros de whitespace.
- **Ambiente:** preparo inicial no sandbox informou a porta 55432 indisponível. Identificado o registro do PostgreSQL gerenciado em `.tools/test-environment/pgdata`; uma reexecução do preparo fora do sandbox aprovou em 2,5 s. Logs `.tools/logs/t041-environment.log` e `.tools/logs/t041-environment-retry.log`. Chrome usou servidor próprio na 5174, API 3002 e banco `ecovit_test`; nenhum processo desconhecido foi encerrado e a porta 5173 permaneceu reservada ao solicitante.

Contratos atualizados em RF-11, Quantitativos e Interface e Iconografia. Esta verificação não confirma aceite manual nem encerra a T-040.

### Revisão da implementação — 2026-11-27

Revisão, correção, commit e push solicitados expressamente. Aceite manual continua pendente; a autorização de integração/publicação não foi registrada como aceite funcional.

Problemas corrigidos:

- **A03/A04 — ativação e foco:** a ação executava em mousedown, inclusive antes de soltar o mouse e cancelar o clique. Substituída por clique normal, compartilhado com teclado, removendo a espera artificial de um timer. Cada navegação captura a abertura/projeto atual; aguardar uma confirmação não permite tomar o foco de uma abertura ou navegação posterior. Mantidos blur e confirmação normais, sem operação própria da lista.
- **A01–A03 — destino de erros simultâneos:** a apresentação reconstruía a ordem de validações de impermeabilizante/rejunte e podia associar erro de área a um rascunho inválido de rendimento. O modelo de consulta agora informa `errorField` somente quando a falha corresponde a um campo; falhas de cálculo levam à seção. Fórmulas, parâmetros persistidos e formato não mudaram. Erros independentes de rascunho continuam localizáveis.
- **A01/A02 — clareza e complexidade:** erros de assentamento sem efeito financeiro passam a identificar edição para exportação. Removidos o aviso genérico extenso sobre total indisponível e a repetição do mesmo erro de soma ao lado da lista específica. Deduplicação usa conjunto de IDs, preservando alvos distintos sem varrer a lista inteira a cada inclusão.

Evidências desta revisão, sem somar repetições como cobertura:

- **24 testes dirigidos aprovados** em `budget-issues.test.ts`, `budget-report.test.ts` e `surface-budget.test.ts`, em 3,65 s (comando: 9,8 s); log `.tools/logs/t041-review-unit.log`. Acrescentadas regressões de erro de cálculo concorrente com rascunho inválido, campo de origem da falha e erro de assentamento exclusivo de exportação.
- **Três cenários distintos de Chrome aprovados.** Fluxo de campos/clique cancelado e consulta global/somente leitura/PDF passaram em `.tools/logs/t041-review-browser-final.log`; reabertura durante confirmação pendente passou separadamente em 6,1 s (rodada: 16,3 s), log `.tools/logs/t041-review-browser-reopen.log`. Filtro agora usa um pavimento vazio real, preservando as pendências globais. A rodada inicial parou na importação porque a nova fixture usava ID de pavimento sem UUID; corrigido para `crypto.randomUUID()`. O novo cenário de reabertura também teve seu seletor corrigido para o título real, sem alterar timeouts ou enfraquecer a asserção de foco. Repetido somente o cenário afetado após essa correção.
- **Tipos aprovados** em 30,1 s, log `.tools/logs/t041-review-types.log`. **Lint final aprovado sem avisos** em 5,5 s, log `.tools/logs/t041-review-lint-final.log`; removida uma limpeza redundante do efeito de navegação, que gerava aviso sobre uso do ref. Diff conferido sem erros de whitespace.
- **Ambiente isolado preparado** em 2,7 s, log `.tools/logs/t041-review-environment.log`. Usados `ecovit_test`, API 3002 e frontend próprio do runner na 5174, sem intervenção na 5173 ou no banco do aplicativo.

Recorte proporcional: revalidados o coletor, o contrato de diagnóstico de superfícies e os eventos/foco modificados; aproveitada a evidência dos contratos preservados. Sem homologação ampla local ou mudança de infraestrutura. Quantitativos e Interface e Iconografia atualizados com os esclarecimentos pertinentes. A T-040 conserva seu estado anterior.

### Ampliação da navegação de esquadrias — 2026-11-27

Solicitada a navegação direta da pendência à planta, selecionando a primeira ocorrência quando houver várias esquadrias iguais. Implementado somente o acesso: para tipo/material ausente, Localizar fecha o Orçamento, ativa o pavimento, muda para Planta e seleção, centraliza a esquadria e abre suas propriedades. A primeira ocorrência é a primeira ainda pendente na ordem de `model.openings` que corresponda ao grupo; o destino é revalidado no documento corrente após as confirmações normais por blur. Preço ausente continua levando ao campo do Orçamento. Processamento, consulta/incorporação de referências e exportação bloqueiam a nova navegação; somente leitura conserva a consulta e os bloqueios de edição.

O acesso não corrige dados, não cria histórico e não altera o formato/API. O usuário reabre o Orçamento pelo acesso existente; a lista é recalculada com as pendências restantes. Se o destino deixar de existir, a navegação permanece na seção pertinente. Contratos atualizados em Quantitativos e Interface e Iconografia. A regra substitui a restrição anterior de acesso individual somente para estas esquadrias. Aceite manual desta ampliação permanece pendente. Sem commit, push ou publicação nesta solicitação.

Validação proporcional à mudança de navegação e contexto:

- **19 testes aprovados** em `budget-issues.test.ts` e `budget-report.test.ts`, duração Vitest de 1,84 s (comando: 3,51 s); log `.tools/logs/t041-locate-unit.log`. Cobre primeira ocorrência, próxima ocorrência após correção, destino já resolvido, preços no Orçamento e integridade da projeção/relatório. A primeira tentativa detectou um bloco inserido no manipulador errado; corrigido antes desta rodada final.
- **Um cenário dirigido de Chrome aprovado**, 6,4 s (rodada: 23,4 s; comando: 24,66 s); log `.tools/logs/t041-locate-browser.log`. Verifica fechamento, troca de pavimento e de Fiada para Planta, primeira ocorrência do grupo, pedido de centralização, propriedades abertas, documento/histórico preservados e reabertura do Orçamento.
- **Tipos e lint dos arquivos alterados aprovados**, 21,80 s e 16,05 s; logs `.tools/logs/t041-locate-types.log` e `.tools/logs/t041-locate-lint.log`.
- Ambiente isolado: o preparo no sandbox informou porta 55432 indisponível; identificado o registro do PostgreSQL gerenciado em `.tools/test-environment/pgdata/postmaster.pid`, uma reexecução fora do sandbox aprovou em 2,09 s. Logs `.tools/logs/t041-locate-environment.log` e `.tools/logs/t041-locate-environment-retry.log`. Chrome usou frontend próprio na 5174, API 3002 e `ecovit_test`, sem intervenção na 5173.

### Ajuste de zoom ao localizar — 2026-11-27

Solicitado zoom de 100% ao chegar à planta. O destino de esquadria passa a informar escala explícita de 0,012 (100% na convenção da câmera), mantendo o centro da esquadria, em vez de enquadrar sua caixa com ampliação automática até 500%. Outros destinos conservam o enquadramento existente. Interface e Iconografia atualizada; sem mudança de documento, histórico ou formato.

Cenário dirigido de Chrome aprovado, incluindo indicação visível de **100%**, seleção, pavimento e integridade: 5,8 s (rodada: 13,2 s; comando: 14,21 s), log `.tools/logs/t041-locate-zoom-browser.log`. Tipos e lint dos arquivos afetados aprovados em 12,71 s e 1,96 s, logs `.tools/logs/t041-locate-zoom-types.log` e `.tools/logs/t041-locate-zoom-lint.log`. Revalidado somente o fluxo afetado; demais evidências da ampliação preservadas. Aceite manual pendente; sem commit, push ou publicação.
