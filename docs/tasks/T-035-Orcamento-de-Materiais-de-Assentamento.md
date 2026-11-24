# T-035 — Orçar materiais de assentamento dos tijolos ecológicos

**Tipo** — Implementação

**Resumo** — Estimar colas e argamassas pela área de paredes descontada dos vãos, com percentuais, rendimentos e preços editáveis, compra em embalagens inteiras e subtotais por pavimento proporcionais à área líquida.

**Execução** — Em execução

**Data de execução** — —

**Aceite manual** — Pendente

## Alteração e limites

Acrescentar uma terceira seção, Material de assentamento, ao Orçamento existente, após tijolos e ferragens. Calcular consumo, embalagens necessárias, custo por produto e subtotal de assentamento; incorporar esse subtotal ao total dos materiais orçados. Acrescentar consumo por produto e subtotal de custo de assentamento por pavimento, proporcionais à sua área líquida de paredes. Preservar quantitativos, perdas, preços e detalhamentos existentes de tijolos e ferragens. Implementação autorizada pelo solicitante em 2026-11-23, após a revisão; commit, push e publicação não foram autorizados.

Referências: [PRD — RF-11](../Ecovit-PRD.md#rf-11--orçamento-quantitativos-e-arquivo-nativo), [Orçamento e quantitativos](../arquitetura/Quantitativos.md), [Caderno Técnico](../Ecovit-Caderno-Tecnico.md), [Estado, histórico e operações](../arquitetura/Estado-Historico-e-Operacoes.md), [Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md) e [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md#orçamento).

### Produtos e parâmetros

Manter seis linhas independentes, inclusive quando não utilizadas. Cada produto tem percentual de aplicação, rendimento e preço próprios; não compartilhar preço entre classes de argamassa ou tipos de cola.

| Produto | Embalagem de compra | Consumo padrão por m² | Preço informado |
|---|---|---|---|
| Argamassa AC1 | Saco de 20 kg | 1,4 kg/m² | R$/saco de 20 kg |
| Argamassa AC2 | Saco de 20 kg | 1,4 kg/m² | R$/saco de 20 kg |
| Argamassa AC3 | Saco de 20 kg | 1,4 kg/m² | R$/saco de 20 kg |
| Argamassa polimérica | Pacote de 3 kg | 1,4 kg/m² | R$/pacote de 3 kg |
| Cola branca | Embalagem de 1 litro | 80 ml/m² | R$/litro |
| Cola especial | Embalagem de 1 litro | 80 ml/m² | R$/litro |

Os rendimentos da tabela foram fornecidos pelo solicitante e são parâmetros editáveis de estimativa, sem comprovação de desempenho de fabricante ou recomendação de produto. Identificar as unidades junto aos campos; neste orçamento, rendimento representa consumo por área (kg/m² ou ml/m²), não sua razão inversa. Embalagens mantêm as capacidades da tabela nesta versão.

O usuário informa o percentual da área líquida que receberá cada produto. Cada percentual admite de 0% a 100%, com até duas casas decimais; a soma dos seis deve ser exatamente 100%, conforme confirmado pelo solicitante. Mostrar a soma e o percentual que falta ou excede. Não normalizar os valores nem alterar outro produto automaticamente. Permitir distribuir a área entre produtos, sem aplicar dois produtos à mesma parcela por sobreposição de percentuais.

A distribuição, os rendimentos e os preços são únicos por projeto e aplicados igualmente a todos os pavimentos. A divisão é uma estimativa agregada, sem associar produto a paredes específicas. O detalhamento por pavimento não oferece percentuais ou preços próprios.

Não escolher produto padrão pelo usuário: projeto sem configuração começa com percentuais zerados, rendimentos padrão e preços ausentes. Até completar 100%, identificar a distribuição como não configurada/incompleta e não apresentar consumo, custo ou total geral como orçamento completo. A edição precisa permitir valores intermediários cuja soma seja diferente de 100%, sem bloquear o preenchimento da próxima linha.

Percentuais individuais válidos podem ser confirmados e persistidos mesmo com a soma intermediária diferente de 100%. Nessa situação, ocultar os consumos, embalagens e custos dependentes da distribuição, mantendo áreas, parâmetros e seções de tijolos/ferragens consultáveis. Não conservar resultados anteriores como se correspondessem à distribuição em edição. A soma é verificada em centésimos de ponto percentual, sem tolerância de ponto flutuante.

Preços não negativos em reais, com até duas casas decimais; zero explícito é diferente de preço ausente. Rendimentos devem ser positivos, finitos e editáveis individualmente. Aceitar vírgula ou ponto decimal conforme convenções existentes. Entradas inválidas permanecem rascunho, com erro associado; não substituir por zero, truncar ou corrigir silenciosamente.

Rendimentos aceitam até três casas decimais, sem notação exponencial. Persistir inteiros positivos seguros em milésimos da unidade de consumo por m²: `1,4 kg/m²` corresponde a `1400` e `80 ml/m²` corresponde a `80000`. Rejeitar excesso de casas, zero, negativos, valores não finitos e valores fora da representação segura, sem arredondar a entrada. O usuário pode ajustar o rendimento para refletir o consumo que considerar adequado à sua execução.

### Área de referência

Usar a área vertical total de alvenaria do projeto, em m², considerando todos os pavimentos e descontando os vãos de portas, janelas e demais aberturas nas paredes. Não usar área útil de ambientes, área construída em planta, área de lajes, soma das duas faces de acabamento ou quantidade de tijolos como substituto dessa metragem.

Apresentar a área bruta, o desconto dos vãos e a área líquida usada na estimativa. Para cada parede, usar seu comprimento entre os pontos `a` e `b`, conforme a função de comprimento existente, multiplicado por sua altura confirmada. Considerar as dimensões efetivamente adotadas pelo modelo vigente, incluindo alturas distintas e vãos compatibilizados.

Calcular o desconto pela união dos retângulos dos vãos no plano longitudinal/vertical da respectiva parede, recortados aos limites de seu comprimento e altura. Assim, somente a parte efetivamente contida na parede é descontada e regiões coincidentes de vãos da mesma parede não são descontadas duas vezes. A área líquida da parede é a área bruta menos esse desconto; a área do pavimento é a soma das áreas de suas paredes e a global é a soma dos pavimentos.

Conforme esclarecido pelo solicitante, o orçamento não considera espessuras: não converter volume em área, unir faixas em planta, descontar espessura nos encontros nem aplicar fatores por espessura ou quantidade de tijolos. Cada parede entra uma vez por sua identidade, com o comprimento registrado, inclusive em L, T ou cruz. A superposição em planta entre paredes distintas não gera desconto adicional nesta convenção; diagnósticos de paredes duplicadas ou sobrepostas continuam vigentes, sem correção automática. Ajustes de consumo são feitos pelo usuário nos rendimentos dos produtos.

Exemplo de referência: paredes de 4 m e 3 m, ambas com 3 m de altura, totalizam 21 m² brutos, inclusive quando formam um encontro; um vão válido de 2 m² em uma delas deixa 19 m² líquidos. A espessura não altera esse orçamento quando comprimentos, alturas, vãos, percentuais, rendimentos e preços permanecem iguais. A implementação deve registrar essa convenção nominal no Caderno Técnico, sem alterar a geometria ou a paginação.

Usar a disponibilidade e a identificação de parcialidade geométrica do resultado vigente, por pavimento e globalmente. Pendência exclusiva de ferragem não torna a área ou o assentamento parcial; mantém o efeito existente no total geral. Sem base atual válida, não exibir valores de uma revisão anterior; preservar os parâmetros configurados. Área válida igual a zero resulta em consumo, embalagens e custo zero, mesmo sem distribuição ou preços preenchidos, distinguindo ausência de alvenaria de resultado indisponível. Um pavimento vazio continua com zero mesmo se outros pavimentos tiverem área. Perdas dos tijolos e acréscimos das ferragens não se aplicam ao assentamento; não acrescentar margem de perda nova.

### Cálculo e arredondamento

Para área líquida global `A` e percentual `p_i` de cada produto:

- Área destinada ao produto: `A_i = A × p_i / 100`.
- Argamassas: consumo em kg `M_i = A_i × rendimento_i`; embalagens `N_i = ceil(M_i / capacidade_i)`, usando 20 kg ou 3 kg conforme o produto.
- Colas: consumo em ml `V_i = A_i × rendimento_i`; consumo em litros `L_i = V_i / 1000`; embalagens `N_i = ceil(L_i / 1 litro)`.
- Custo por produto: `C_i = N_i × preço_da_embalagem_i`. Para as colas, cada embalagem de 1 litro custa o preço por litro informado.
- Subtotal de assentamento: soma dos seis custos. Total geral: subtotal de tijolos + subtotal de ferragens + subtotal de assentamento, respeitando os estados de parcialidade e indisponibilidade de cada seção.

Conforme confirmado pelo solicitante, custos consideram a compra de embalagens inteiras, arredondando a quantidade para cima. Arredondar uma única vez por produto sobre o consumo consolidado do projeto, sem arredondar por parede ou pavimento e depois somar. Exibir separadamente consumo calculado e número de embalagens a comprar; não apresentar o conteúdo das embalagens como consumo exato. Produto com percentual zero tem consumo, embalagens e custo zero, sem exigir preço.

Usar aritmética inteira/racional exata nos cálculos intermediários de áreas, percentuais, rendimentos, consumos, embalagens e rateio, seguindo o padrão do orçamento vigente; as dimensões do modelo são inteiras em unidades de 0,1 mm. Não acrescentar uma embalagem por erro de ponto flutuante em múltiplo exato nem usar os números arredondados para apresentação como entrada dos cálculos. Custos usam centavos inteiros e verificam representabilidade conforme o orçamento existente. Resultado fora da representação permitida deixa os valores dependentes indisponíveis, com mensagem, preservando parâmetros e demais resultados válidos. Preço ausente em produto necessário mantém seu quantitativo consultável, mas deixa seu custo e os totais dependentes incompletos. Não exibir a soma apenas dos produtos precificados como total completo.

Exemplos de referência para área líquida de 100 m²:

| Distribuição e preços | Resultado esperado |
|---|---|
| AC1 100%, rendimento 1,4 kg/m², saco a R$ 30,00 | 100 m²; consumo 140 kg; compra de 7 sacos; custo R$ 210,00. |
| AC1 50% a R$ 30,00/saco e cola branca 50% a R$ 20,00/litro, rendimentos padrão | AC1: 50 m², 70 kg, 4 sacos, R$ 120,00. Cola: 50 m², 4.000 ml = 4 litros, 4 embalagens, R$ 80,00. Subtotal R$ 200,00. |
| Argamassa polimérica 100%, rendimento 1,4 kg/m², pacote a R$ 15,00 | Consumo 140 kg; compra de 47 pacotes de 3 kg; custo R$ 705,00. |

### Consumo e subtotal por pavimento

Para cada pavimento `f`, mostrar área bruta, desconto dos vãos e área líquida `A_f`, área destinada a cada produto `A_fi = A_f × p_i / 100`, consumo em kg ou litros conforme o produto, custo rateado por produto e subtotal de assentamento do pavimento. Não somar massas e volumes em um único quantitativo sem unidade. Identificar pavimentos por nome e cota, usando IDs como chaves, na ordem de cotas do modelo; incluir vazios com zero.

`A = soma(A_f)`. Os consumos globais de cada produto correspondem à soma de seus consumos por pavimento, antes do arredondamento de apresentação. Conforme confirmado pelo solicitante, ratear o custo da compra global pela área líquida: para `A > 0`, o custo teórico do produto no pavimento é `C_fi = C_i × A_f / A`. O mesmo percentual global de produtos em todos os andares torna essa razão também proporcional ao consumo de cada produto. Não calcular nem arredondar compras independentes por pavimento.

Distribuir os centavos de cada custo global por produto pelo método dos maiores restos: atribuir inicialmente a parte inteira em centavos de cada cota e distribuir os centavos restantes aos maiores restos fracionários. Empates usam a ordem de cotas dos pavimentos e, persistindo o empate, o ID em ordem lexical. Pavimentos sem área recebem zero. Somar os custos rateados dos produtos para o subtotal de cada pavimento; a soma dos subtotais deve ser exatamente igual ao subtotal global de assentamento. Se `A = 0`, todos os valores são zero, sem divisão.

Identificar esses valores como rateio do custo de compra, incluindo a parcela das sobras de embalagens. Não apresentá-los como custo exato do consumo ou compra independente por andar. Embalagens inteiras aparecem somente no resumo global. Produto necessário sem preço impede seu custo rateado e os subtotais dependentes nos pavimentos com área, preservando consumos e demais custos conhecidos; pavimento vazio continua com zero. Ratear valores de uma base geométrica parcial mantém a indicação de parcialidade, inclusive nos subtotais.

Exemplos adicionais:

| Situação | Resultado esperado |
|---|---|
| Área líquida de 60 m² no térreo e 40 m² no superior; AC1 100%, 1,4 kg/m² e saco a R$ 30,00 | Consumos de 84 kg e 56 kg; compra global de 7 sacos por R$ 210,00; subtotais rateados de R$ 126,00 e R$ 84,00. Não comprar 5 + 3 sacos para formar o total. |
| Três pavimentos de 1 m²; AC1 100%, 1,4 kg/m² e saco a R$ 10,00 | Compra global de 1 saco; consumo de 1,4 kg por andar; rateio de R$ 3,34, R$ 3,33 e R$ 3,33, conforme o desempate definido, somando R$ 10,00. |

### Interface, estado e persistência

Reutilizar o modal, a apresentação documental, a rolagem e os padrões de campos do Orçamento. A terceira seção mostra os seis produtos, percentuais, rendimentos, preços, áreas destinadas, consumos, embalagens e custos, com subtotal próprio. A distribuição e o arredondamento de compra devem estar compreensíveis ao usuário. Resumo e arredondamento são globais. O seletor local de pavimento existente passa a filtrar também o detalhamento de assentamento: Todos mostra todos os pavimentos com seus subtotais; um pavimento mostra somente seu detalhamento. Filtrar não altera a base global, o rateio, as compras ou os totais do resumo, nem o pavimento ativo do editor. O subtotal por pavimento acrescentado aqui é exclusivamente de assentamento, sem criar custo total por andar para tijolos/ferragens.

Percentuais, rendimentos e preços são configurações persistidas por projeto; consumo, áreas derivadas, embalagens e custos são projeções de leitura, não novos snapshots persistidos. Seguir confirmação por Enter/perda de foco, histórico, salvamento em segundo plano, recuperação de falhas e somente leitura do orçamento vigente. Alterar exclusivamente esses parâmetros não chama o motor nem invalida composição ou diagnósticos. Consultar o orçamento não cria gravação nem materializa padrões ausentes.

Preservar parâmetros confirmados ao reabrir, duplicar projeto, baixar/importar `.ecovit`, desfazer/refazer e recuperar falhas. Documentos anteriores recebem os padrões descritos sem escolher produto nem inventar preço.

Introduzir envelope `schemaVersion=32`, desde que esse número permaneça disponível na implementação; se ocupado por outra evolução, usar a próxima versão livre preservando o mesmo contrato. Acrescentar um grupo opcional de parâmetros de assentamento em `project`, com objeto estrito de seis chaves fixas correspondentes aos produtos da tabela. Cada produto possui campos opcionais de percentual em centésimos de ponto percentual, rendimento em milésimos da unidade indicada e preço em centavos por embalagem. Ausência usa os padrões desta task sem materializá-los ao consultar; zero explícito só é válido para percentual e preço. Percentuais individualmente válidos cuja soma difere de 100% são configuração incompleta permitida no arquivo, sem cálculo completo.

O novo leitor aceita os envelopes 9–31 já suportados e o novo envelope, normalizando os anteriores somente em memória, sem mutar a fonte, alterar a intenção anterior ou criar gravação automática. Recusar o grupo de assentamento em envelopes anteriores, mesmo vazio, além de chaves desconhecidas, tipos inválidos, null e números fora dos limites. Leitores antigos devem recusar o novo envelope antes de substituir o trabalho aberto, sem descarte silencioso dos parâmetros. Persistir somente configurações, nunca áreas, consumos, embalagens, rateios ou custos derivados.

A composição permanece `nominal-v13`, a representação remota permanece versão 1 e os parâmetros não exigem migração SQL, pois pertencem ao documento JSON existente. Cliente e API devem compartilhar a validação e o suporte ao novo envelope; uma versão antiga não pode aceitar uma gravação descartando os novos parâmetros.

Na implementação autorizada, atualizar RF-11 e os contratos responsáveis de Quantitativos, Estado/Histórico, Persistência e Interface; registrar a convenção de área e as fórmulas no Caderno Técnico, preservando IDs e evidências anteriores. Não alterar regras de paginação, graute, ferragens, fabricação ou dimensionamento estrutural. Sem novos serviços, bibliotecas, exportações ou orçamento de mão de obra.

### Decisões da revisão

As três pendências de especificação foram resolvidas pelo solicitante: área por comprimento × altura menos vãos, sem consideração de espessura; rendimentos com até três casas decimais e representação inteira/racional exata; novo envelope 32 com leitura dos legados e rejeição por leitores antigos. A aprovação das regras não representou critérios executados; a implementação foi autorizada posteriormente, conforme o escopo acima.

As restrições anteriores do PRD/Quantitativos a tijolos e ferragens e a ausência de subtotais monetários no detalhamento são revistas somente no alcance desta task, preservando regras e evidências dos grupos existentes.

## Critérios de aceite

- [ ] **A01** — O Orçamento apresenta a terceira seção com os seis produtos, embalagens e rendimentos padrão solicitados, com percentuais, preços e rendimentos independentes e editáveis.
- [ ] **A02** — A área soma comprimento × altura de cada parede, descontando a união dos vãos contidos nela, por pavimento e projeto, sem fatores de espessura nem descontos nos encontros. Cada parede entra uma vez; área bruta, desconto e área líquida ficam identificados. O exemplo de 21 m² brutos e 19 m² líquidos é atendido.
- [ ] **A03** — A distribuição admite de 0% a 100% por produto e exige soma exata de 100% para cálculo completo, sem ajuste automático. Estados intermediários e entradas inválidas são identificados e permitem concluir a configuração.
- [ ] **A04** — Consumo e compra em embalagens inteiras seguem as fórmulas e os exemplos, com arredondamento global por produto, conversão correta de ml para litros e atualização por rendimento editado, sem aplicar perdas dos tijolos.
- [ ] **A05** — Custos por produto, subtotal de assentamento e total geral dos três grupos são coerentes; preço ausente difere de zero, produto sem uso não exige preço e valores incompletos, parciais ou indisponíveis não são apresentados como totais completos.
- [ ] **A06** — Configurações confirmadas sobrevivem a reabertura, cópia, arquivo, histórico e recuperação conforme os contratos existentes; legados conservam integridade. Edições orçamentárias não recalculam a alvenaria e respeitam somente leitura e bloqueios vigentes.
- [ ] **A07** — Tijolos e ferragens preservam seus quantitativos, preços, perdas, detalhamentos e filtros; contratos responsáveis refletem a nova seção e a convenção nominal, sem ampliar o escopo construtivo.
- [ ] **A08** — Cada pavimento apresenta área líquida, consumo por produto e subtotal de assentamento; custos da compra global são rateados pela área líquida, com centavos conciliados por produto, sem compra independente por andar. Exemplos de 60/40 m², empate de centavos e pavimento vazio são atendidos.
- [ ] **A09** — O seletor existente filtra o detalhamento de assentamento sem alterar parâmetros, compra global, rateio, totais do resumo ou o pavimento ativo; Todos apresenta os pavimentos com seus subtotais e identificação inequívoca.
- [ ] **A10** — Rendimentos aceitam até três casas decimais e são persistidos em milésimos; entradas inválidas não são arredondadas. Cálculo exato preserva múltiplos de embalagem e identifica resultados não representáveis sem invalidar parâmetros ou resultados independentes.
- [ ] **A11** — O novo envelope transporta os parâmetros com validação estrita no cliente/API; legados abrem sem gravação automática e sem preço/produto inventado. Campos novos em envelope anterior são recusados; leitores antigos recusam o novo formato sem substituir o trabalho aberto. Composição nominal-v13, representação remota versão 1 e estrutura SQL são preservadas.

## Resultado

Especificação criada e revisada a pedido do solicitante. Confirmados: distribuição total de 100%, compra em embalagens inteiras e rateio global pela área líquida de cada pavimento. Incluídos consumo e subtotais por pavimento, conciliação de centavos e filtro existente. Esclarecidos distribuição global uniforme, percentuais intermediários, área zero, parcialidade e conflitos com os limites do orçamento vigente. Em 2026-11-23, o solicitante descartou consideração de espessura na área e aceitou as propostas de precisão de rendimentos e compatibilidade; as três pendências de especificação foram encerradas com as regras acima. Conferência documental não constitui verificação técnica da funcionalidade: implementação e verificação técnica continuam pendentes; aceite manual pendente.
