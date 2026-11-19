# T-028 — Incluir ferragens e custos por peso no Orçamento

**Tipo** — Implementação

**Resumo** — Acrescenta comprimentos, pesos e custos das ferragens ao Orçamento, com preços por quilo salvos no projeto, emendas verticais e acréscimo horizontal configuráveis por pavimento.

**Execução** — Verificada

**Data de execução** — 2026-11-18

**Aceite manual** — Confirmado pelo solicitante

**Data do aceite manual** — 2026-11-18

## Alteração e limites

Incluir no popup **Orçamento** os quantitativos de aço dos grautes verticais, dos grampos dos encontros e da armadura das cintas, vergas e contravergas. Apresentar aplicação, categoria do aço, bitola, comprimento, peso nominal e custo, preservando o orçamento de tijolos existente.

Task solicitada em 2026-11-18, após aprovação explícita das regras de material, emendas, acréscimos e preços abaixo. A implementação foi autorizada explicitamente pelo solicitante na mesma data. Commit, push e publicação dependem de pedido próprio.

Referências: [PRD, RF-07/RF-11](../Ecovit-PRD.md), [Caderno Técnico, CT-09/CT-10/CT-16 e grampos](../Ecovit-Caderno-Tecnico.md), [Orçamento e quantitativos](../arquitetura/Quantitativos.md), [Elementos construtivos](../arquitetura/Elementos-Construtivos.md), [Estado e operações](../arquitetura/Estado-Historico-e-Operacoes.md), [Persistência](../arquitetura/Persistencia-e-Compatibilidade.md), [Interface](../arquitetura/Interface-e-Iconografia.md) e [T-027](T-027-Popup-de-Ferragens-do-Pavimento.md).

### Aço e tabela de massas

Adotar **CA-50** para as bitolas de 6,3, 8,0, 10,0 e 12,5 mm. A opção de **5,0 mm dos grampos usa CA-60**, conforme confirmado pelo solicitante. Não acrescentar seletor livre de categoria nesta entrega: identificar o material efetivamente usado no Orçamento e na informação pertinente dos formulários. Não converter bitola nem substituir aço silenciosamente.

| Categoria | Bitola nominal | Massa nominal |
|---|---:|---:|
| CA-60 | 5,0 mm | 0,154 kg/m |
| CA-50 | 6,3 mm | 0,245 kg/m |
| CA-50 | 8,0 mm | 0,395 kg/m |
| CA-50 | 10,0 mm | 0,617 kg/m |
| CA-50 | 12,5 mm | 0,963 kg/m |

Fontes primárias consultadas em 2026-11-18: [Gerdau GG 50 — especificações técnicas](https://mais.gerdau.com.br/produtos/vergalhao-gerdau-gg-50) e [Gerdau CA-60 — especificações técnicas](https://mais.gerdau.com.br/produtos/vergalhao-ca-60-gerdau). As massas são nominais de catálogo; não representam pesagem de uma entrega. Preservar a fonte e a precisão da tabela em um catálogo único, sem espalhar coeficientes pelos componentes ou depender de consulta on-line para calcular.

Projetos anteriores podem conter bitolas fora da tabela. Conservar os dados e o comprimento consultável, identificando massa/categoria não cadastradas e custo indisponível; não arredondar para outra bitola, inventar massa ou atribuir custo zero. A futura ampliação do catálogo depende de definição própria.

O catálogo associa categoria à bitola, independentemente da aplicação: um registro legado de 5 mm também é identificado como CA-60; 6,3/8/10/12,5 mm usam CA-50. Essa associação é a preferência comercial aprovada para a estimativa, não uma categoria recuperada de documentos antigos, que não a registravam. Bitola fora dessas cinco entradas permanece sem cadastro e não recebe campo para preço avulso ou massa manual nesta entrega.

### Grautes verticais: uma barra por eixo e emendas por trecho útil

Considerar **uma linha de armadura por eixo final de graute**, usando a bitola do pavimento configurada na T-027; ausência do campo mantém o padrão de 8 mm. O aço extra da sobreposição integra essa mesma armadura, sem criar outro eixo de graute.

Somar os intervalos finais grauteados de cada eixo, respeitando alturas de paredes, vãos, exclusões e inclusões manuais. Eixo compartilhado entre paredes é contado uma vez no pavimento; não multiplicar por `wallIds` ou origens. Processar separadamente cada intervalo contínuo, sem atravessar aberturas ou unir intervalos interrompidos.

Adicionar no grupo **Graute vertical**, em **Ferragens do pavimento**, os parâmetros por pavimento:

- **Comprimento útil por trecho (cm): 150**, padrão.
- **Sobreposição por emenda (cm): 20**, padrão.

Para um intervalo contínuo de altura `H > 0`, comprimento útil `U > 0` e sobreposição `O ≥ 0`:

`N = ceil(H / U)`; `emendas = N − 1`; `comprimento de aço = H + (N − 1) × O`.

U é o comprimento **útil** de referência para contar etapas; não é limite de corte da peça. Portanto, 3 m de altura exigem duas etapas úteis e uma sobreposição: **3,20 m de aço**. Duas peças de 1,50 m com sobreposição de 20 cm cobririam somente 2,80 m e não devem ser apresentadas como suficientes para esse intervalo. Não produzir plano de corte ou impor que todas as peças físicas tenham 1,50 m.

Calcular e exibir separadamente comprimento vertical base, adicional de emendas e comprimento estimado. Aceitar comprimentos na precisão do editor, sem arredondar a altura ou a quantidade de emendas por ponto flutuante. Recusar útil nulo/negativo, sobreposição negativa, entrada inválida e valores/resultados não representáveis.

Os comprimentos útil e de sobreposição não precisam ser múltiplos da altura do tijolo. Sobreposição zero é permitida e produz adicional zero, mesmo quando N > 1. Altura, quantidade de etapas e emendas pertencem ao intervalo individual: não calcular `ceil` depois de somar eixos ou intervalos. Todos os eixos finais entram, inclusive os originados de ajustes manuais e de categorias diferentes de Encontros; desativar somente Encontros não desativa a configuração orçamentária dos demais grautes.

**Sem arranques, ancoragens ou ligações entre pavimentos nesta entrega.** Cada pavimento e intervalo são independentes para a estimativa, mesmo quando os eixos estão alinhados. Os 20 cm são a preferência orçamentária aprovada pelo solicitante; o Ecovit não certifica a suficiência estrutural dessa emenda. Contexto: [Gerdau — emendas de vergalhões](https://voce.mais.gerdau.com.br/concreto-armado/emendas-de-vergalhoes-eficientes).

### Armaduras horizontais: acréscimo configurável

Usar os trechos finais de armadura das canaletas já gerados na T-026. Para cada trecho, multiplicar sua extensão pela quantidade configurada de barras; somar apenas uma vez cada trecho final, preservando a unificação de faixas coincidentes existente.

Adicionar ao grupo **Armadura das cintas**, em **Ferragens do pavimento**, o campo **Acréscimo para emendas e dobras (%)**, por pavimento, com **10% como padrão**. A mesma configuração vale para cintas, vergas e contravergas. Aceitar percentual não negativo com até duas casas decimais, sem recomendação estrutural implícita.

`comprimento estimado = comprimento base das barras × (1 + percentual / 100)`.

Aplicar o percentual uma vez sobre o comprimento base agregado do material no pavimento. Identificar base, adicional e estimativa; não confundir com quantidade de barras ou com a extensão desenhada. Dobras/continuidade gráfica de L/T não são novos trechos de aço a somar separadamente. Não criar detalhamento físico de dobras ou comprimento normativo de ancoragem.

O padrão de 10% é uma hipótese orçamentária aprovada, configurável, sem caráter normativo. Não reutilizar automaticamente o percentual de perdas dos tijolos nem aplicar dois acréscimos para a mesma finalidade.

### Grampos: comprimento completo existente

Usar cada grampo final elegível da T-025 uma vez na fiada programada, com sua bitola e comprimento nominal total já configurado, **incluindo as duas pontas dobradas para baixo**. Não aplicar aos grampos o percentual horizontal de 10% ou outra emenda automática.

Grampos com `pending` são apresentados separadamente como pendentes, identificados individualmente pela fiada e pelas duas células, sem repetir a mensagem do diagnóstico correspondente, sem entrar na soma de peças elegíveis como se estivessem executáveis. Conservar identificação/localização existentes; indicar parcialidade do quantitativo de ferragens enquanto houver pendências pertinentes. Grampos e armaduras desativados têm quantidade zero, sem gerar material fictício.

Considerar também os diagnósticos `clamp-pending` que não possuem objeto em `generated.floors[].clamps`, como programação de fiada acima da altura atual do pavimento. Esses avisos geram pendência de ferragens mesmo com `severity: info`; não fabricar quantidade ou peso para uma ligação que não foi gerada. Não tornar a contagem de tijolos parcial apenas por esses avisos. Outros diagnósticos informativos não tornam automaticamente as ferragens parciais; erros geométricos do resultado mantêm a parcialidade existente.

### Orçamento, pesos e preços

Manter o popup Orçamento e acrescentar um quadro **Ferragens do projeto**, consolidado por **categoria do aço + bitola**, com comprimento base, adicional, comprimento estimado, peso nominal estimado, preço em **R$/kg** e custo. Oferecer detalhamento por aplicação — graute vertical, grampos e armadura das cintas/vergas/contravergas — e por pavimento, aproveitando o filtro de consulta existente. A mesma chave de material reúne aplicações e pavimentos com a mesma categoria/bitola.

O resumo principal mantém as cinco linhas do catálogo, inclusive quando não usadas, permitindo cadastrar preços antes de existir aço daquele material. Com resultado disponível e material não usado, comprimentos/pesos/custo são zero e preço ausente não impede o total. Bitolas legadas sem cadastro aparecem em linhas identificadas, com o comprimento conhecido e peso/preço/custo indisponíveis.

O resumo consolidado, os subtotais e o total geral abrangem sempre o projeto inteiro. O seletor de pavimento filtra somente o detalhamento, sem alterar esses totais ou o pavimento ativo do editor. Usar três aplicações: Grautes verticais, Grampos dos encontros e Armadura das canaletas (cintas/vergas/contravergas agrupadas); não exigir repartição de um trecho compartilhado entre verga e cinta nem contá-lo duas vezes por origem. Não acrescentar seletor de fiada ou edição de preço no detalhamento.

Trocar o rótulo do campo existente de perdas para **Perdas de tijolos (%)**, ajustando nome acessível e ajuda para deixar explícito que não afeta ferragens. Conservar seu valor de sessão e seu cálculo. O percentual horizontal salvo por pavimento é apresentado no detalhamento correspondente, sem acrescentar outro percentual global de aço no Orçamento. Preservar o modal, cabeçalho/fechamento e rolagem existentes; tabelas largas usam a região rolável acessível já adotada, sem cortar campos ou valores.

`peso estimado (kg) = comprimento estimado (m) × massa nominal (kg/m)`.

`custo do material = peso estimado (kg) × preço (R$/kg)`.

O preço é **único no projeto para cada categoria + bitola**, editado no resumo consolidado; o detalhamento usa esse mesmo preço, sem valores divergentes por pavimento ou aplicação. Preços de tijolos continuam independentes. Campos de preço seguem a T-024: confirmação por Enter/perda de foco, duas casas decimais, zero explícito diferente de ausência, histórico, salvamento e recuperação existentes; informar preço não recalcula a alvenaria.

Guardar preços em centavos por kg e realizar cálculos com precisão inteira/racional adequada às unidades do editor, à tabela e aos percentuais. Não arredondar metros ou kg para exibição antes de calcular custos. Arredondar o custo do material ao centavo uma vez no agrupamento global, com meio centavo arredondado para cima; o subtotal de ferragens soma as linhas consolidadas. Eventual arredondamento de detalhamento não pode substituir essa base nem produzir outro total. Validar limites aritméticos e entradas sem truncamento ou arredondamento oculto.

Exibir comprimentos em metros e pesos em kg com até três casas decimais, mantendo a precisão integral no cálculo e informando que a apresentação é arredondada. Casas omitidas ou arredondamentos dos pesos exibidos não são reutilizados para calcular o custo. O detalhamento apresenta quantitativos e o preço de referência, mas não subtotais monetários independentes por aplicação/pavimento: a consolidação é a fonte única do custo por material, evitando diferenças de centavos entre agrupamentos. Preços e custos usam duas casas decimais.

Mostrar **subtotal de tijolos**, **subtotal de ferragens** e **total geral**. Se houver material utilizado sem preço ou massa cadastrada, sinalizar a incompletude e não apresentar soma conhecida como total completo. Manter subtotais conhecidos consultáveis. Resultado parcial continua parcial também no custo e no total geral, independentemente do pavimento filtrado. Resultado desatualizado/ausente permanece indisponível; não misturar uma revisão anterior com as configurações atuais.

Identificar o total geral como **Total dos materiais orçados (tijolos + ferragens)**. Distinguir os estados:

- **Quantitativo parcial, mas todos os itens quantificados têm preço/massa:** permitir valor numérico com identificação explícita de subtotal/total parcial; não tratá-lo como orçamento completo.
- **Material utilizado sem preço/massa, entrada de preço inválida ou cálculo não representável:** o custo afetado e os totais que dependem dele ficam indisponíveis, com motivo. Preservar os demais subtotais conhecidos, sem preencher a lacuna com zero ou valor anterior.
- **Resultado geométrico ausente/desatualizado ou operação construtiva em andamento:** não apresentar totais de aço antigos. Preços cadastrados permanecem consultáveis e, quando o estado existente permitir edição, podem ser configurados sem quantitativos disponíveis.
- **Perdas de tijolos inválidas:** manter a estimativa independente de ferragens consultável; subtotal estimado de tijolos e total geral ficam indisponíveis até a correção.

O estado parcial do total geral combina as pendências dos tijolos e das ferragens. Não reutilizar somente a flag atual de parcialidade dos tijolos para decidir sobre grampos pendentes.

Consultar, filtrar e fechar não salva nem chama o motor. Consulta em somente leitura conserva os dados e bloqueia edição. Processamento, falha/incerteza, reabertura e retorno ao editor seguem os contratos existentes.

### Configuração e persistência

Os parâmetros de trechos úteis/sobreposição e percentual horizontal são independentes por pavimento, carregados com os valores confirmados ao abrir **Ferragens do pavimento**. Integram o mesmo rascunho, validação conjunta e único **Aplicar alterações** da T-027: nenhum grupo é confirmado parcialmente se outro estiver inválido. Cancelamento/descarte, contexto de origem e recuperação seguem o popup existente.

Novos pavimentos usam 150 cm/20 cm/10%; duplicação copia os parâmetros por valor. Documentos sem esses campos usam os mesmos padrões em memória, sem escrita ao consultar. Projetos anteriores passam a ter a estimativa de ferragens segundo essas regras, sem mudar as bitolas, desenhos ou configurações construtivas que já possuíam.

Persistir somente os novos parâmetros de intenção por pavimento e os preços por material no projeto. Não persistir pesos, comprimentos totais, custos ou filtros derivados. Preservar parâmetros/preços em salvamento remoto, transporte, importação, cópias e desfazer/refazer. Configurações exclusivamente orçamentárias não invalidam a composição nem mudam a convenção do motor; os novos quantitativos são derivados do resultado atual mais esses parâmetros.

Guardar parâmetros exclusivamente orçamentários separados dos objetos construtivos de grampos/armadura cuja comparação atual invalida o resultado. Incluí-los no candidato e no histórico do pavimento, mas excluí-los da assinatura de insumos construtivos. Se Aplicar alterações também mudar bitola/ativação/programação construtiva, continuar com uma única operação e o recálculo normal pertinente; se mudar só os parâmetros de orçamento, salvar sem recálculo. Uma confirmação equivalente aos padrões ausentes não materializa campos.

Os percentuais são não negativos, com até duas casas, sem teto implícito de 100%; recusar entrada ou resultado fora da representação segura. Parâmetros continuam editáveis quando não há grautes/canaletas no andar ou quando a respectiva geração está desativada, para permitir configuração prévia; apenas os bloqueios gerais de edição impedem a alteração. Não apagar parâmetros nem preços ao remover/desativar os elementos que os utilizavam. Reativar ou criar novos elementos reutiliza os valores confirmados.

Versionar o envelope de arquivo conforme o contrato vigente ao implementar, validando os novos campos estritamente e preservando leitura dos anteriores. Não fazer migração SQL ou alterar a representação remota sem necessidade demonstrada. Evitar materializar padrões ou criar operações para confirmações sem mudança.

### Exemplos de referência

| Caso | Resultado esperado |
|---|---|
| Graute contínuo de 3 m, Ø8 CA-50, U=1,50 m e O=0,20 m | 1 eixo, 2 etapas, 1 emenda; 3 m base + 0,20 m adicional = 3,20 m; massa 1,264 kg. A R$12/kg: R$15,17. |
| Graute de exatamente 1,50 m; variante de 1,51 m, mesmos parâmetros | 1,50 m: nenhuma emenda. 1,51 m: uma emenda, 1,71 m de aço. |
| Dois eixos distintos de 1 m; variante com sobreposição zero | Somar 2 m sem emenda; não gerar uma emenda calculando sobre a soma das alturas. Com O=0, o adicional permanece zero para qualquer N. |
| Mesmo eixo com intervalos de 1 m abaixo e 1 m acima de um vão | 2 m de aço e nenhuma emenda; não criar aço no vão nem tratar como intervalo contínuo de 2 m. |
| Mesmo eixo compartilhado por duas paredes de um T | Contar a armadura uma vez no pavimento, sem multiplicar pelas associações. |
| Trecho horizontal de 10 m com 2 barras Ø10 CA-50 e acréscimo 10% | 20 m base + 2 m adicional = 22 m; massa 13,574 kg. A R$10/kg: R$135,74. |
| 10 grampos elegíveis Ø6,3 CA-50 com comprimento total de 32,5 cm | 3,25 m; massa 0,79625 kg. A R$8/kg: R$6,37. Não acrescentar novamente as pontas ou os 10%. |
| Mesmo material usado em dois pavimentos e aplicações diferentes | Um preço por kg e uma linha consolidada; detalhe conserva os comprimentos e pesos de cada origem. |
| Programação de grampo acima da altura atual, com `clamp-pending` informativo e sem objeto de ligação | Aviso de pendência e quantitativo de ferragens parcial, sem fabricar grampo/peso; a contagem de tijolos não muda de estado por esse aviso. |
| Catálogo sem uso de aço; preço ausente, zero explícito e preço removido em material utilizado | Sem uso: zero válido e preços configuráveis. Uso com preço zero: custo zero válido. Uso sem preço/removido: custo e totais dependentes indisponíveis. |
| Alterar somente a sobreposição/percentual e depois desfazer; alterar esses parâmetros junto da bitola | Só orçamento: atualizar consulta e salvar/desfazer sem recalcular. Mudança conjunta: um snapshot e o recálculo construtivo pertinente. |
| Grampo pendente, bitola legada sem tabela, preço ausente ou resultado desatualizado | Distinguir pendência/incompletude/indisponibilidade; nunca converter para custo zero ou total completo. |

Não incluir compra por barras comerciais, plano de corte, aproveitamento de sobras, arame de amarração, luvas, solda, mão de obra, volume de graute/concreto, aço de lajes ou cálculo resistente. Não aplicar perdas de tijolos ao aço. Essa estimativa não modifica o desenho e não é um detalhamento de fabricação.

Na implementação, atualizar os trechos responsáveis no PRD, Caderno Técnico e contratos de Quantitativos, Elementos construtivos, Estado/Histórico, Persistência e Interface. Preservar os aceites históricos das T-024/T-025/T-026/T-027; registrar a ampliação nesta task.

## Critérios de aceite

- [x] **A01** — O Orçamento apresenta ferragens consolidadas por aço/bitola e detalhadas por aplicação/pavimento, usando a tabela nominal com fontes registradas; CA-60 Ø5 e CA-50 nas demais bitolas previstas são identificados corretamente.
- [x] **A02** — Grautes usam uma barra por eixo e a fórmula de trechos úteis/emendas por intervalo contínuo, com padrões 150/20 cm; aberturas, eixos compartilhados, fronteiras exatas de trecho e ausência de arranques entre pavimentos respeitam os exemplos.
- [x] **A03** — Cintas/vergas/contravergas somam extensão × quantidade de barras e aplicam o acréscimo configurável de 10% uma vez; grampos usam o comprimento completo existente e não recebem esse percentual nem duplicação de dobras.
- [x] **A04** — Novos parâmetros por pavimento integram a aplicação conjunta da T-027, sem gravação parcial ou redundante, com validação, padrões, isolamento entre andares, cópias, histórico e preservação dos dados anteriores.
- [x] **A05** — Preços em R$/kg são compartilhados por material no projeto e preservados ao salvar/reabrir/transportar; pesos e custos usam precisão adequada, arredondamento único por material e subtotais/total geral coerentes com os exemplos.
- [x] **A06** — Pendências, inclusive `clamp-pending` sem ligação gerada, massa/preço ausentes, entrada inválida, somente leitura, processamento e resultados indisponíveis/parciais são distinguíveis; falha de salvamento conserva candidato e recuperação, sem apresentar zero ou sucesso indevido. Filtrar não altera o resumo global e as perdas de tijolos não afetam ferragens.
- [x] **A07** — Consultar e mudar parâmetros/preços exclusivamente orçamentários não altera composição, câmera/contexto ou dados de tijolos. Formato/compatibilidade e contratos são atualizados, com resultados reais registrados e aceite manual separado.

- [x] **A08** — Ajuste solicitado após a entrega inicial: cada grampo pendente tem uma mensagem no Orçamento, sem colapsar ligações distintas nem perder diagnósticos sem peça; na Fiada, recebe traço vermelho tracejado e !, com hover explicativo e consulta preservada na inspeção. Edição de grautes e gestos permanecem funcionais.

## Resultado

Task criada em 2026-11-18 com as definições expressamente aprovadas pelo solicitante e as fontes primárias pesquisadas para massas lineares. Conferência documental de ID disponível, modelo, dados existentes e coerência dos exemplos. Na criação, implementação, execução dos critérios e aceite manual estavam pendentes. Nenhuma alteração de código ou execução de testes nesta etapa. A validação futura deve selecionar os contratos de agregação, precisão monetária, persistência e interface efetivamente afetados, conforme a [política proporcional](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração), sem impor suíte completa ou matriz ampla por rotina.

Revisão documental na mesma data: preservadas as regras aprovadas de aço/massas, trechos úteis, sobreposição, percentual horizontal e ausência de arranques. Esclarecidos mapeamento de legados, edição prévia de preços/parâmetros, pendências sem objeto de grampo, totais globais versus filtro local, separação das perdas de tijolos, precisão/apresentação monetária, estados de parcialidade e armazenamento sem recálculo indevido. Nenhuma implementação ou execução de testes nesta revisão.

### Implementação e verificação — 2026-11-18

Implementada após autorização explícita. Critérios A01–A07 conferidos tecnicamente; o aceite manual ainda aguardava confirmação nesta etapa. O Orçamento agora consolida as cinco entradas CA-50/CA-60, preserva legados sem cadastro, calcula comprimentos/pesos/custos e mostra subtotais e total dos materiais. Preços por kg confirmados em Enter/blur são salvos no projeto. O detalhamento por aplicação/pavimento conserva o resumo global e distingue grampos pendentes, inclusive diagnósticos sem peça gerada.

Útil de 150 cm, sobreposição de 20 cm e acréscimo horizontal de 10% integram o rascunho e a aplicação conjunta de Ferragens do pavimento, independentes por andar, com histórico e recuperação. Campos e preços podem ser configurados sem uso do material. Parâmetros exclusivamente orçamentários ficam fora da assinatura construtiva: confirmação e desfazer/refazer não invalidam nem recalculam a composição. Mudança construtiva conjunta conserva o fluxo anterior. Não há arranques entre andares, plano de corte ou alteração de nominal-v13.

Dados em model.floors[].steelBudget e project.steelPrices, com formato 26 e leitura dos envelopes 9–26; representação remota versão 1 e sem migração SQL. Validações estritas recusam campos novos em envelopes anteriores e entradas/chaves inválidas. Preços, parâmetros e ausência/padrões equivalentes sobrevivem ao transporte/cópias sem persistir derivados. PRD, Caderno Técnico, contratos responsáveis e indicação do formato no README atualizados. Aceites anteriores preservados, incluindo a confirmação manual da T-027 já existente no diretório de trabalho.

Verificação proporcional justificada por novas regras de agregação/precisão monetária, dados persistidos e controles de interface:

- 43 testes unitários distintos aprovados nos arquivos steel-budget, floor-reinforcement-draft, budget e quantities: exemplos literais, fronteiras de emenda, intervalos/eixos independentes, arredondamento único/meio centavo, estouro, legados, pendências, configuração atômica e transporte/compatibilidade. Rodada inicial de 42 casos aprovada (2,79 s); acréscimo do caso de meio centavo/subtotal com estouro conferido no arquivo de 13 testes (1,41 s), sem contar repetição como cobertura extra.
- Três cenários novos no Chrome aprovados (30,7 s): preços/subtotais/total, filtro global versus detalhe, dados por pavimento, histórico, exportação/reabertura, zero/ausente/inválido, perdas independentes, legados/pendências, somente leitura e falha/recuperação de preços e parâmetros. A observação das transições do store confirmou zero invalidações da composição ao mudar apenas orçamento e desfazer/refazer.
- Cinco regressões direcionadas no Chrome aprovadas (24,9 s): dois fluxos de preços/recuperação da T-024, aplicação atômica da T-027 e dois fluxos M5 de consulta/perdas/contexto e resultado parcial/indisponível. Sem suíte ampla ou cargas não afetadas.
- Capturas de 1440×1000 e 900×720 inspecionadas: tabelas e campos acessíveis, cabeçalho/fechamento preservados, sem expansão horizontal do diálogo. Evidências locais ignoradas em .tools/t028/desktop.png e narrow.png. Ajuste final de texto de categoria por consulta ao catálogo inspecionado e conferido com lint específico, evitando atribuir CA-50 a bitola legada desconhecida.
- Typecheck aprovado; lint aprovado sem erros, com o aviso preexistente de dependência de useEffect em src/editor/Rooms.tsx. Diff conferido. Logs, stdout/stderr e códigos de saída em .tools/t028/. Ambiente e dados isolados, com servidores dos runners nas portas 5174/3002; porta 5173 preservada. Não foi necessário repetir preparo ou investigar falha ambiental.

Sem commit ou push nesta execução. A aprovação das definições não foi tratada como aceite manual da implementação.

### Ajuste de pendências por grampo — 2026-11-18

A pedido do solicitante, eliminada a duplicação entre clamp-pending e Clamp.pending no Orçamento. Cada ligação tem entrada identificada por fiada e ambas as células; diagnósticos sem peça permanecem. Não se deduplica só por texto/fiada, preservando ligações diferentes. A validação geométrica e a exclusão de pendentes do peso/custo permanecem inalteradas.

Na Fiada, pendentes agora são visíveis em vermelho tracejado com ! no meio da ligação, acima das barras horizontais. Hover individual informa motivo, fiada, bitola, dimensões e células, além da exclusão do orçamento. Tooltip HTML sem captura de ponteiro, com escopo de pavimento/fiada/resultado; ligações válidas conservam laranja e identificação. Legenda/consulta textual atualizadas na inspeção. Sem novo formato ou dado persistido.

Verificação direcionada: 14 testes de steel-budget aprovados (1,71 s), incluindo duas ligações distintas com o mesmo motivo/fiada e aviso sem peça, sem duplicação nem alteração dos totais elegíveis. Dois cenários distintos do Chrome aprovados: novo fluxo de aviso/marker/hover, edição do furo sob a ponta do grampo, desfazer, troca de fiada e retorno à Planta; e regressão existente de grampos válidos, formulário, histórico, transporte e visualização. A primeira tentativa do novo cenário clicou o meio da ligação, fora do alvo dos furos; o teste foi corrigido para clicar o centro do furo sob a ponta, preservando a asserção de remoção de um eixo e o comportamento existente. O recorte novo passou em 10,9 s. Tipos e lint aprovados (somente o aviso preexistente em Rooms.tsx); captura .tools/t028/grampo-pendente.png inspecionada. Logs em .tools/t028/pending-*. Sem suíte ampla, novo aceite manual, commit ou push.

### Aceite manual

Em 2026-11-18, o solicitante aprovou explicitamente a T-028, incluindo o orçamento de ferragens por peso, os preços em R$/kg salvos no projeto, os parâmetros por pavimento e os ajustes de identificação das pendências dos grampos no Orçamento e no canvas. Aceite manual confirmado, separado dos resultados técnicos registrados acima.
