# T-030 — Consultar ambientes, áreas úteis e área construída do projeto

**Tipo** — Implementação

**Resumo** — Reúne os ambientes e suas áreas úteis em um relatório, com totais do projeto, áreas por pavimento e localização na planta. A área construída considera faces externas das paredes e linhas de fechamento.

**Execução** — Verificada

**Data de execução** — 2026-11-19

**Aceite manual** — Aprovado pelo solicitante em 2026-11-19

## Alteração e limites

Criar a consulta Áreas do projeto conforme as definições abaixo. Esta especificação não autoriza implementação por si só.

Referências: [PRD — RF-21](../Ecovit-PRD.md#rf-21--etiquetas-de-área-e-limites-de-ambientes), [Caderno Técnico — CT-18](../Ecovit-Caderno-Tecnico.md#14-área-de-ambientes-ct-18), [Medidas e imagens — Etiquetas](../arquitetura/Medidas-e-Imagens.md#etiquetas-de-área-e-linhas-de-fechamento), [Editor e interação](../arquitetura/Editor-e-Interacao.md#etiquetas-e-fechamento-de-ambientes), [Estado e histórico](../arquitetura/Estado-Historico-e-Operacoes.md#revisão-de-etiquetas-de-área) e [Persistência](../arquitetura/Persistencia-e-Compatibilidade.md).

### Estrutura do relatório

Botão Áreas na barra superior, ao lado de Orçamento. A consulta identifica o projeto e segue a estética de documento do Orçamento, sem painel lateral permanente.

| Parte | Conteúdo |
|---|---|
| **Resumo do projeto** | Indicadores globais de área útil dos ambientes e área construída total, identificados como Totais do projeto. |
| **Áreas por pavimento** | Tabela com Pavimento, Área útil e Área construída, incluindo suas indicações de pendência. |
| **Ambientes** | Tabela com Pavimento, Ambiente, Área útil e ação Localizar. |

O filtro Todos / pavimento específico começa em Todos e altera as duas tabelas; o resumo permanece global. Identificar pavimentos por nome e cota. Consultar e filtrar preservam o contexto confirmado do editor.

Localizar fecha o relatório, ativa o pavimento, entra em Planta e seleciona o registro do ambiente. Para um ambiente válido, enquadrar sua região; para um ambiente em revisão, localizar a posição gráfica de seu identificador, sem recuperar a região anterior.

Retorno ao desenho, teclado e controles seguem os padrões existentes. Consultar a iconografia central na implementação.

### Ambientes e área útil

Cada ambiente listado corresponde a uma etiqueta existente do projeto. Esse é o vínculo técnico com os dados atuais, sem criar outro cadastro de ambientes. Na apresentação ao usuário, usar o termo ambiente.

Manter a medição vigente de CT-18 pelas faces internas das paredes e linhas de fechamento. Nome e referência vêm do registro existente; mover seu identificador gráfico para fora do recinto não muda a área. Contar cada ambiente válido uma vez, independentemente de nomes repetidos. Regiões sem identificação não são incluídas nem nomeadas automaticamente.

O indicador Área útil dos ambientes usa a explicação **“Soma das áreas dos ambientes válidos.”** Seu alcance é a listagem identificada, não uma afirmação de que todos os espaços da casa foram cadastrados.

O resumo soma os ambientes válidos de todo o projeto; cada linha de pavimento soma os daquele pavimento. Filtrar muda apenas as linhas visíveis, nunca esses totais.

| Situação | Apresentação |
|---|---|
| Nenhum ambiente identificado | Nenhum ambiente identificado. |
| Ambientes válidos, sem revisão | Soma das áreas válidas. |
| Ambientes válidos e outros em revisão | Soma válida identificada como parcial, com a quantidade de ambientes a revisar. |
| Somente ambientes em revisão | —, com a quantidade de ambientes a revisar. |

Ambientes em revisão permanecem na tabela sem área antiga ou zero fictício. Preservar a revisão persistente: fechar novamente uma região não a recupera automaticamente.

### Área construída

Reconhecer os espaços fechados por paredes e linhas de fechamento e medir seus contornos externos, incluindo as paredes delimitadoras e todo o interior. Unir as áreas **dentro de cada pavimento**, sem descontar contornos internos nem contar sobreposições duas vezes. O total do projeto soma os pavimentos, inclusive quando ocupam as mesmas coordenadas na planta.

Disso decorrem as regras aprovadas:

- Incluir pátios e vazios internos; não há exclusões nesta entrega.
- Incluir contornos somente por linhas. Varandas e garagens abertas entram quando as linhas completam seu fechamento.
- As linhas existentes participam das duas medições, sem classificação por finalidade; nomes como Jardim não alteram a inclusão.
- Divisões internas não multiplicam a área nem descontam a ocupação das paredes. O simples retângulo sólido da espessura de uma parede, sem espaço fechado, não constitui área construída.
- Portas e janelas mantêm a continuidade das paredes. Lajes, terreno, imagens e mobiliários não delimitam essa medição.

Paredes são consideradas com sua espessura; linhas, sem espessura. Há conexão quando uma linha toca ou entra na faixa real da parede, inclusive pela face interna ou por uma extremidade. O contorno externo é derivado desse conjunto, sem alterar os elementos desenhados ou exigir que a linha atravesse a espessura. Lacunas reais permanecem abertas.

A área construída independe dos ambientes identificados e não é obtida pela soma de suas áreas úteis. A condição de uma medição não altera a condição da outra.

| Situação | Apresentação da área construída |
|---|---|
| Sem paredes nem linhas | 0,00 m². |
| Há desenho, mas nenhum espaço fechado | Não determinada. |
| Há espaços fechados e paredes/linhas externas não abrangidas | Valor conhecido · Parcial. |
| Todos os elementos estão abrangidos pelos contornos reconhecidos | Valor calculado. |

Elementos internos ao perímetro não geram parcialidade por si só. Qualquer parede ou linha externa não abrangida gera a indicação de parcialidade, mesmo que tenha sido desenhada intencionalmente. Usar o aviso descritivo **“Há paredes ou linhas fora das áreas delimitadas.”**, sem inferir sua finalidade.

Considerar trechos geométricos, não a parede inteira por ID: se uma parede delimitadora continua para fora, somente o trecho delimitador integra a medição. Mostrar um aviso por pavimento afetado e a indicação global de pendência, sem diagnósticos por elemento, sobreposições ou ferramentas de reparo.

A mesma lógica vale para o projeto: somar os valores conhecidos dos pavimentos e conservar as pendências no resumo global. Se houver desenho, mas nenhum espaço fechado em todo o projeto, o total é não determinado. Não transformar partes desconhecidas em zero ou estimar sua área.

### Precisão

Exibir áreas em m² com duas casas decimais. Somar os valores calculados antes de arredondar, sem usar o texto exibido como entrada. Usar a nota **“Valores arredondados para apresentação; os totais usam a precisão do cálculo.”**

Determinar existência de fechamento e estados antes do arredondamento. Uma área fechada pequena que apareça como 0,00 m² continua determinada; não introduzir área mínima ou tolerância geométrica.

### Registro das decisões aprovadas

D01–D05 permanecem fechadas. A tabela resume as definições funcionais acima para rastreabilidade.

| ID | Assunto | Decisão |
|---|---|---|
| **D01** | Pátios e vazios internos | Incluir todo o interior do perímetro externo, sem exclusões. |
| **D02** | Fechamento somente por linhas | Incluir, sem exigir paredes ou classificar a finalidade das linhas. |
| **D03** | Partes abertas e componentes separados | Unir as áreas fechadas por pavimento; elementos externos não abrangidos tornam o valor conhecido parcial. |
| **D04** | Conexão entre linhas e paredes | Contato com a faixa real da parede participa do fechamento, sem prolongar ou editar a linha. |
| **D05** | Filtro | Resumo global fixo; filtro inicialmente em Todos, aplicado às duas tabelas. |

### Exemplos de referência

| ID | Entrada | Resultado esperado |
|---|---|---|
| **T030-E01** | Perímetro externo de 10 × 8 m, divisões e pátio interno de 6 m² | Construída 80 m², com paredes e pátio incluídos. |
| **T030-E02** | Retângulo de 3 × 2 m somente por linhas, chamado Jardim ou sem nome | Construída 6 m²; área útil só entra se houver ambiente identificado válido, conforme CT-18. |
| **T030-E03** | Dois contornos desconectados de 80 e 6 m² no mesmo pavimento | Construída 86 m²; sobreposições contam uma vez. Dois pavimentos sobrepostos de 80 m² cada totalizam 160 m² no projeto. |
| **T030-E04** | Contorno de 80 m² e parede/linha externa não abrangida, inclusive continuação de uma parede delimitadora | 80 m² · Parcial, sem acrescentar a faixa excedente. Uma divisória interna não tem esse efeito. |
| **T030-E05** | Parede isolada ou linhas abertas; comparação com pavimento sem desenho | Com desenho aberto: Não determinada. Sem paredes/linhas: 0,00 m². No projeto: vazio + aberto = Não determinada; fechado de 80 m² + aberto = 80 m² · Parcial; dois vazios = 0,00 m². |
| **T030-E06** | Linha terminando na face interna da parede; variante com lacuna antes dela | Contato real fecha sem editar a linha; lacuna real não é fechada automaticamente. |
| **T030-E07** | Perímetro fechado sem ambientes identificados; depois, um válido e um em revisão | Construída permanece determinada. Área útil passa de Nenhum ambiente identificado para soma válida parcial, com um ambiente a revisar. |
| **T030-E08** | Dois ambientes de 1,234 m²; filtro em um pavimento | Linhas de 1,23 m² e total de 2,47 m². Tabelas seguem o filtro; resumo permanece global. Área fechada menor que 0,005 m² exibe 0,00 m² e permanece determinada. |

### Dados e limites da entrega

Consultar não altera intenção, histórico, salvamento, composição de tijolos, diagnósticos construtivos ou orçamento. Medir pelo desenho atual, sem depender do snapshot de peças ou chamar o motor construtivo apenas para abrir o relatório. Áreas, totais e filtros são derivados/transitórios; não criar dados de exclusão, finalidade de linhas ou novo cadastro de ambientes.

Manter uma fonte para cada valor: reutilizar a medição vigente dos ambientes e derivar separadamente a construída. Resumo e tabelas consomem esses mesmos resultados, sem recálculos próprios nem criação de um motor genérico de áreas.

Edições, desfazer/refazer, reabertura, arquivo, cópias e operações de pavimento devem refletir-se na consulta, preservando os contratos atuais. Manter somente leitura e os estados de processamento/recuperação existentes.

Na implementação, atualizar os contratos responsáveis por produto, geometria, interação e dados, preservando IDs e aceites anteriores. Não inclui preço por m², orçamento por ambiente, PDF, impressão ou novos quantitativos de materiais.

## Critérios de aceite

- [x] **A01** — As três partes do relatório apresentam o conteúdo definido; filtro e resumo têm os alcances distintos previstos. Acesso, teclado e retorno ao desenho seguem os padrões do aplicativo.
- [x] **A02** — Ambientes válidos têm áreas coerentes com a planta; revisão, ausência de identificação e nomes repetidos são tratados conforme a definição de área útil.
- [x] **A03** — A área construída segue os contornos externos e D01–D04, sem deduções internas, duplicação de sobreposições ou área criada apenas pela espessura de paredes isoladas.
- [x] **A04** — Localizar seleciona e enquadra o ambiente válido ou localiza o identificador gráfico do ambiente em revisão, no pavimento correto. Consultar e filtrar preservam o contexto do editor.
- [x] **A05** — Alterações e operações existentes atualizam a consulta sem mudar a medição útil vigente, recalcular tijolos ou persistir totais apenas por consulta.
- [x] **A06** — Exemplos T030-E01–E08 e precisão seguem as definições; contratos e resultados técnicos são atualizados, com aceite manual separado.
- [x] **A07** — Área útil e construída têm estados independentes; valores conhecidos e pendências são apresentados conforme as tabelas, inclusive no total global.

## Resultado

Task criada em 2026-11-19 a pedido do solicitante, inicialmente com D01–D05 em aberto. Na mesma data, o solicitante aprovou a inclusão de todo o interior do perímetro externo e D02–D05 conforme a revisão.

Nesta revisão, foram aprovadas sete correções: estrutura do relatório explícita, regra construída unificada, conexão linha/parede clarificada, estados compactados, apresentação útil simplificada, nota de arredondamento corrigida e duplicações reduzidas. D01–D05 e os IDs de critérios/exemplos foram preservados. Textos apresentados ao usuário usam ambiente, incluindo Soma das áreas dos ambientes válidos.

A fase documental foi concluída antes da autorização de implementação. Em 2026-11-19, o solicitante aprovou outras seis correções e autorizou a execução: medição por trechos de parede; alcance explícito dos totais úteis; exemplos globais de vazio/aberto/fechado; estados anteriores ao arredondamento; aviso por pavimento e indicador global; fonte única dos valores. D01–D05 e os IDs existentes foram preservados.

Implementado no aplicativo: acesso Áreas junto de Orçamento, relatório documental com as três partes, filtro inicialmente Todos, resumo global fixo, estados independentes de área útil/construída, cotas dos pavimentos e Localizar. A localização enquadra a região válida ou centraliza o identificador em revisão, entrando em Planta no pavimento correto.

O cálculo útil reutiliza a geometria vigente; a construída deriva a união externa de regiões e trechos de paredes delimitadoras, preenchendo interiores e detectando trechos externos sem incluir prolongamentos por ID. Totais, estados e filtro não são persistidos. Contratos de produto, geometria, interação, iconografia e dados derivados atualizados, sem alterar o formato de arquivo ou adicionar dependências.

Verificação proporcional pelo impacto geométrico e pela nova interação: 23 testes de domínio/integração passaram em 1,79 s (`tests/project-areas.test.ts` e `tests/rooms.test.ts`), incluindo E01–E08, concavidade, interseções diagonais, revisão, desfazer/refazer, cópia/remoção de pavimento e transporte. Cenário direcionado no Chrome passou em 17,6 s (6,2 s de cenário): filtro sem mudança de totais, contexto/câmera preservados, foco/Escape, Localizar válido/em revisão e consulta em somente leitura sem gravação. Captura visual conferida em `.tools/t030-areas.png`; sem rolagem horizontal no relatório. Typecheck e ESLint dos arquivos afetados passaram. Logs com códigos de saída em `.tools/t030-{unit,e2e,types,lint}.log`. A restrição EACCES do sandbox ao banco isolado foi resolvida executando o cenário autorizado fora dele; porta 5173 preservada.

A01–A07 verificados tecnicamente. Em 2026-11-19, o solicitante confirmou o aceite manual com “Ficou bom” e autorizou commit e push das alterações da T-030 para main, com publicação pelo workflow existente.
