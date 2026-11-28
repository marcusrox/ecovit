# T-044 — Orçamento de concreto das lajes

**Tipo** — Implementação

**Resumo** — Estime o concreto das lajes com consumo por m² e perdas próprios, selecione a classe FCK com preço de referência da Administração e consulte volumes e custos no Orçamento e no PDF.

**Execução** — Verificada

**Data de execução** — 2026-11-27

**Aceite manual** — Confirmado em 27/11/2026

## Alteração e limites

Acrescentar o grupo **Concreto** ao Orçamento, com uma linha por laje existente, referências de preço por classe na Administração → Preços e inclusão no relatório de orçamento em PDF. O Ecovit calcula a área líquida da laje; o usuário informa o consumo de concreto por m², as perdas e a classe. O volume estimado decorre desses parâmetros, sem calcular volumes pela espessura ou pela geometria interna do sistema construtivo.

Esta task registrou inicialmente somente a definição solicitada. Implementação autorizada posteriormente pelo solicitante em 27/11/2026; sem autorização de commit, push ou publicação neste pedido.

O escopo inicial abrange somente o concreto aplicado na obra nas lajes. Não incluir pilares, colunas, vigas, fundações, dimensionamento estrutural, armaduras, traços, ingredientes, mão de obra, bombeamento, frete ou compra de elementos pré-fabricados. Preservar o grupo independente de graute de preenchimento da T-043. A seleção de FCK é informação orçamentária do usuário, sem recomendação de resistência pelo Ecovit.

Referências: [RF-11 do PRD](../Ecovit-PRD.md#rf-11--orçamento-quantitativos-e-arquivo-nativo), [Quantitativos](../arquitetura/Quantitativos.md), [Elementos construtivos — Lajes](../arquitetura/Elementos-Construtivos.md#lajes), [Caderno Técnico](../Ecovit-Caderno-Tecnico.md), [Estado e histórico](../arquitetura/Estado-Historico-e-Operacoes.md), [Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md) e [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md). Reaproveitar os comportamentos pertinentes das tasks [T-039](T-039-Precos-de-Referencia-na-Administracao.md), [T-041](T-041-Pendencias-do-Orcamento.md) e [T-038](T-038-Relatorio-de-Orcamento-em-PDF.md).

### Administração — Preços

Cadastrar três referências fixas e independentes, com preço em **R$/m³**:

- **Concreto — FCK 30 MPa**.
- **Concreto — FCK 40 MPa**.
- **Concreto — FCK 50 MPa**.

Não impor preço inicial. Preço ausente é diferente de zero; preço zero é válido. Reutilizar as permissões administrativas, validação cliente/API, confirmação, tratamento de conflitos e auditoria existentes. A edição do preço em um projeto não cria nem atualiza a referência administrativa. Consumo e perdas são parâmetros de cada laje no projeto, sem cadastro administrativo ou padrões presumidos nesta task.

### Seção Concreto no Orçamento

Apresentar uma linha para cada laje existente, identificada pelo pavimento, com os campos abaixo. Consumo, perdas, classe e preço são independentes por laje, mesmo quando várias usam a mesma classe.

| Campo | Origem e comportamento |
|---|---|
| Pavimento | Nome e cota do pavimento da laje |
| Tipo de laje | Tipo já configurado: maciça, treliçada com lajota, treliçada com EPS ou alveolar; ausência permanece identificada como não informada |
| Área (m²) | Área horizontal do contorno externo menos suas aberturas, pela geometria vigente de CT-13 |
| Consumo de concreto (L/m²) | Informado pelo usuário, sem preenchimento automático pelo tipo, altura ou capa |
| Perdas (%) | Informadas pelo usuário; 0% é válido e ausência não equivale a zero |
| Classe do concreto | Seleção entre FCK 30 MPa, FCK 40 MPa e FCK 50 MPa |
| Preço (R$/m³) | Referência da classe selecionada, editável para aquela laje |
| Volume estimado (m³) | Resultado do consumo informado, acrescido das perdas |
| Custo estimado (R$) | Volume estimado multiplicado pelo preço efetivo da linha |

Consumo deve ser positivo, com até três casas decimais em L/m². Perdas são não negativas, com até duas casas decimais. Preço é não negativo, com até duas casas decimais. Seguir o padrão vigente de entrada com ponto ou vírgula, limites numéricos seguros e erros associados aos campos, sem arredondar silenciosamente entradas inválidas.

O tipo da laje é informativo e não interfere na fórmula. Uma laje sem tipo continua estimável quando seus parâmetros orçamentários estiverem preenchidos; não assumir concreto maciço nem tornar a classificação construtiva requisito do cálculo. Não acrescentar complementos manuais de volume, cálculo de nervuras ou preenchimentos, nem uma parcela automática de capa. O consumo informado deve contemplar todo o concreto que o usuário deseja estimar naquela laje, inclusive capa e nervuras quando aplicável, evitando sua contagem em separado. Na alveolar, a estimativa refere-se ao concreto aplicado na obra, sem incluir automaticamente o concreto dos painéis adquiridos.

Usar confirmação, prévia, histórico, salvamento e bloqueios de edição dos formulários orçamentários vigentes. Alterar parâmetros financeiros não recalcula a composição da alvenaria. Somente leitura permite consulta, sem edição ou incorporação de referências.

### Referência de preço por laje

Ao selecionar uma classe, preencher o preço com sua referência administrativa disponível. Se não houver referência, deixar o preço pendente, permitindo preenchimento próprio; não usar preço da classe anterior ou de outra classe.

O usuário pode alterar o preço apenas daquela laje. Mudanças posteriores na Administração não atualizam preços já incorporados ou próprios do projeto. Ao trocar a classe, substituir o preço anterior pela referência da nova classe, inclusive quando o anterior era próprio; na ausência da nova referência, deixá-lo ausente. Confirmar classe e preço correspondente de forma coerente, sem exibir preço antigo como válido para a nova classe. Selecionar novamente a mesma classe não descarta o preço próprio.

Reutilizar o ciclo de origem, limpeza intencional e cópia explícita da referência da T-039, adaptado ao preço por laje e classe. Uma limpeza confirmada não é reposta automaticamente enquanto a classe permanecer a mesma. Uma referência ausente conserva a elegibilidade de incorporação posterior na abertura editável, desde que o preço nunca tenha sido preenchido ou intencionalmente limpo. Consulta de referência com falha não deve confirmar uma troca de classe com preço incoerente; preservar o estado confirmado e permitir nova tentativa pelo fluxo existente. PDF e consulta em somente leitura não buscam referências para preencher o projeto.

### Cálculo, resumo e disponibilidade

Para cada laje, usar a área líquida em m² e calcular:

```text
Volume base (m³) = área líquida × consumo (L/m²) ÷ 1.000
Volume estimado (m³) = volume base × (1 + perdas ÷ 100)
Custo estimado (R$) = volume estimado × preço efetivo (R$/m³)
```

Exemplo apenas aritmético: uma laje de 100 m², com consumo de 60 L/m² e perdas de 5%, tem volume base de 6 m³ e volume estimado de **6,30 m³**. A R$ 500,00/m³, seu custo é **R$ 3.150,00**. Com 0% de perdas, são 6 m³ e R$ 3.000,00. O tipo da laje não altera esses resultados.

Descontar cada abertura conforme a área líquida já validada, sem descontar faixas de paredes ou inventar apoios. Não arredondar áreas ou volumes antes dos cálculos e consolidações; preservar precisão decimal exata e conciliação monetária pelos contratos vigentes. O subtotal deve fechar com os custos das linhas, inclusive quando lajes da mesma classe tiverem preços próprios distintos. Não aplicar perdas de outros grupos.

Apresentar o volume estimado total do projeto, os volumes estimados agrupados por classe e o subtotal de concreto. Somar os custos efetivos de cada laje, sem aplicar um preço único da classe às linhas com preços diferentes. Integrar o subtotal de concreto uma única vez ao total dos materiais orçados. Filtro local de pavimento e recolhimento de seções não modificam totais globais.

Sem lajes, apresentar estado vazio e subtotal zero, sem exigir parâmetros. Consumo ausente preserva a área conhecida; perdas ausentes preservam área e volume base, impedindo volume estimado e custo dependentes. Classe ausente impede preço referenciado e custo, mas não o volume quando consumo e perdas forem conhecidos; identificar o volume sem classe sem atribuí-lo a uma das três classes. Preço ausente preserva o volume estimado. Identificar pendências de consumo, perdas, classe e preço por laje, com acesso ao campo correspondente, conforme T-041. Não tratar parcelas desconhecidas como zero ou totais incompletos como completos. Campos inválidos, processamento e estouros seguem os bloqueios vigentes, preservando parcelas independentes conhecidas e sem mostrar resultados antigos como atuais.

### PDF e persistência

Incluir a seção Concreto no PDF pela apresentação compartilhada com o Orçamento, com todas as lajes da revisão capturada, seus campos efetivos, volumes e custos, agrupamentos por classe e subtotal integrado ao resumo. Ignorar filtros locais, preservar pendências e indisponibilidades e não consultar preços administrativos durante a exportação. Aplicar os bloqueios existentes para rascunhos inválidos e demais condições de exportação.

Consumo, perdas, classe, preço efetivo e origem/limpeza do preço acompanham salvamento, reabertura, desfazer/refazer, cópia do projeto e arquivo nativo. Vincular os parâmetros à identidade da laje; duplicação de pavimento copia os parâmetros por valor para a nova laje, mantendo independência. Exclusão e histórico acompanham a laje, sem parcelas órfãs. Não persistir áreas, volumes ou custos derivados.

Projetos existentes continuam utilizáveis e não recebem classe, consumo ou perdas presumidos. Atualizar os contratos responsáveis durante a implementação, incluindo fórmulas e exemplos no Caderno Técnico, referências e totais em Quantitativos e transporte em Persistência, preservando IDs e aceites anteriores. A etapa inicial autorizou somente a criação da task; a implementação foi autorizada posteriormente.

## Critérios de aceite

- [x] **A01** — Administração → Preços permite manter independentemente as referências de concreto FCK 30, 40 e 50 MPa em R$/m³, com permissões e validações vigentes, distinguindo preço ausente de zero e sem impor preços iniciais.
- [x] **A02** — Orçamento apresenta uma linha por laje existente, com pavimento, tipo configurado ou ausência identificada, área líquida, consumo em L/m², perdas, classe, preço, volume estimado e custo; sem lajes, mostra estado vazio e subtotal zero.
- [x] **A03** — Consumo e perdas são informados independentemente por laje, respeitam precisão e validação especificadas, aceitam 0% de perdas e não recebem valores presumidos pelo tipo, altura ou capa. Tipo ausente não impede o cálculo por coeficiente.
- [x] **A04** — Selecionar uma classe incorpora sua referência disponível àquela laje; trocar a classe substitui o preço pela nova referência ou o deixa pendente quando ela não existe, sem conservar preço incompatível. Falha de consulta preserva o estado confirmado.
- [x] **A05** — Preço próprio, preço incorporado e limpeza intencional são preservados ao reabrir e frente a atualizações administrativas; alteração em uma laje não modifica outras lajes ou a Administração. Cópia explícita da referência e incorporação de campo nunca preenchido seguem o ciclo especificado, sem escrita em somente leitura.
- [x] **A06** — Área líquida desconta aberturas e o volume segue exclusivamente área × consumo ÷ 1.000 × (1 + perdas ÷ 100), sem usar espessura ou geometria interna para volume. O exemplo de 100 m², 60 L/m², 5% e R$ 500,00/m³ resulta em 6,30 m³ e R$ 3.150,00; 0% resulta em 6 m³ e R$ 3.000,00.
- [x] **A07** — Volume total, volumes por classe e subtotal usam os valores das lajes sem arredondamento intermediário; preços diferentes na mesma classe produzem custos próprios. Filtros não alteram totais e o subtotal integra uma única vez o total dos materiais, preservando os demais grupos.
- [x] **A08** — Ausências, rascunhos inválidos e limites numéricos identificam a laje e o campo pertinentes, preservam valores independentes conhecidos e impedem totais completos indevidos. Volume conhecido sem classe permanece identificável e não é atribuído a outra classe.
- [x] **A09** — PDF inclui todas as lajes, parâmetros efetivos, volumes e custos, agrupamentos e subtotal no resumo, coerentes com a revisão capturada e com os bloqueios existentes; filtros e mudanças posteriores de referências não alteram o relatório.
- [x] **A10** — Parâmetros e origem/limpeza de preços sobrevivem a salvamento, reabertura, histórico, cópia e arquivo nativo; duplicação de pavimento mantém cópias independentes, exclusão não deixa parcelas órfãs e projetos legados não recebem parâmetros presumidos.
- [x] **A11** — Contratos responsáveis refletem o comportamento implementado e o limite de estimativa orçamentária, sem dimensionamento estrutural, inclusão de outros elementos ou alteração do graute de preenchimento.

Escolher a conferência proporcional ao impacto conforme [Qualidade e desempenho](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração), sem impor suíte completa ou matriz ampla por esta especificação.

## Resultado

Implementação concluída em 27/11/2026, autorizada pelo solicitante após a criação da especificação. Critérios A01–A11 verificados tecnicamente. Aceite manual da T-044 permanece pendente; não houve commit, push ou publicação.

- A01/A04/A05: três referências fixas sem preços iniciais na Administração, com autorização, auditoria, conflito, repetição segura e limpeza existentes. Troca de FCK consulta antes de confirmar classe/preço; ausência deixa preço elegível e falha preserva o confirmado. Preço próprio/zero/limpeza e cópia manual são independentes por laje. Origens ficam na própria laje.
- A02/A03/A06/A07/A08: tabela por laje com tipo informativo, área líquida, consumo/perdas próprios e volumes/custos. Domínio usa bigint, sem arredondamento intermediário; centavos por linha e soma conciliada. Exemplo de 6,30 m³/R$3.150,00, aberturas, 0%, preços diferentes na mesma classe, ausências, sem classe, rascunhos e limites seguros cobertos. Grupo integrado uma vez ao resumo e pendências com foco nos campos.
- A09: PDF usa os mesmos componentes e todas as lajes da revisão capturada, incluindo classe FCK convertida em texto, parâmetros, grupos e subtotal. Sem consulta/incorporação durante relatório. Preservados filtros e bloqueios existentes.
- A10/A11: formato 40, migração de 9–39 sem parâmetros presumidos e rejeição de concreto em envelopes anteriores. Validação compartilhada cliente/API, reabertura remota, cópias independentes de projeto/pavimento, exclusão e histórico conferidos. Detector de insumos exclui concreto; edição financeira preserva composição. Contratos atualizados em PRD, Caderno Técnico e assuntos de arquitetura responsáveis.

Validação ampliada para domínio, formatos, API e Chrome porque a mudança afeta cálculo, transporte, referências administrativas, foco e PDF. Evidências locais em .tools/logs:

- t044-unit-final.log: 32 testes aprovados em 2,07 s, incluindo domínio novo e regressões de referências, pendências e relatório.
- t044-formats.log: 79 cenários de formatos aprovados em 7,87 s (246 cenários fora do recorte), sem banco ou navegador.
- t044-api-retry.log: um cenário T-044 aprovado em 3,53 s; t044-api-references.log: regressão de autorização/auditoria/conflito/repetição administrativa aprovada em 2,59 s. O catálogo agora contém 27 referências fixas; a expectativa antiga de 19 foi corrigida para refletir o catálogo atual.
- t044-browser-complete.log: fluxo Chrome aprovado em 27,2 s (cenário em 15,8 s), cobrindo edição, FCK com/sem referência, falha de consulta sem troca incoerente, limpeza, foco, reabertura, composição preservada, blocos reais do relatório e download PDF válido. As duas falhas anteriores eram da montagem dos testes: resposta simulada sem código obrigatório e comparação textual da composição com diferente ordem de propriedades após transporte. Corrigidas sem remover cobertura ou ampliar timeouts.
- t044-types-final.log e t044-lint.log: tipos cliente/servidor e lint dos arquivos afetados aprovados. Sem build adicional; nenhuma mudança de empacotamento ou dependência.

O primeiro preparo de ambiente não pôde reconhecer o processo PostgreSQL já existente por restrições do sandbox. O PID 18584/porta 55432 foi identificado como PostgreSQL 18 do diretório gerenciado .tools/test-environment/pgdata e o preparo foi repetido uma vez com acesso adequado, com sucesso. O teste da API também precisou de acesso à conexão local após EACCES. Somente ecovit_test e schemas isolados foram usados. Nenhum processo desconhecido foi encerrado; porta 5173 preservada. Logs t044-env.log, t044-env-retry.log e t044-api.log.

### Conferência visual final

A captura inicial em 900 × 680 revelou sobreposição entre seletor de classe e preço na tabela de nove colunas. Corrigida com largura mínima e rolagem interna exclusiva da tabela, preservando a largura da página. Recorte @interface t044-layout.log aprovado em 17,0 s (cenário em 4,9 s): preço com largura legível, classe sem invadir o preço e página sem exceder 900 px. Captura .tools/logs/t044-layout.png inspecionada visualmente. O fluxo funcional/PDF anterior permanece coberto; não foi repetido após esta alteração restrita ao layout. Tipos e lint finais registrados em t044-final-types.log e t044-final-lint.log. Diff conferido sem erros.

### Ajuste posterior — duas casas decimais nos campos marcados

Em 27/11/2026, o solicitante pediu duas casas decimais para área líquida, consumo de concreto em L/m² e volume base em m³. A apresentação compartilhada do Orçamento/PDF arredonda somente esses valores, preservando dados salvos, precisão aceita na edição e cálculo integral. Campo sem rascunho apresenta o consumo com duas casas; consultar/sair sem edição não confirma o texto arredondado. Aceite manual deste ajuste permanece pendente.

Validação proporcional por teste específico do componente compartilhado, sem navegador/build: oito testes aprovados em 3,26 s, incluindo 110,703125 m² → 110,70 m², 120 L/m² → 120,00 e 13,284375 m³ → 13,28 m³; consumo salvo de 120,005 aparece como 120,01 sem alteração do dado original. Domínio e transporte existentes preservados. Log: .tools/logs/t044-decimals.log.

### Complemento — volume estimado com duas casas decimais

Pedido posterior em 27/11/2026 estende a apresentação com duas casas ao volume estimado de cada laje e ao volume estimado total, no Orçamento/PDF compartilhado. Precisão dos cálculos e dados preservada. Conferência específica: oito testes aprovados em 1,89 s, incluindo 13,94859375 m³ → 13,95 m³ por laje e no total, sem alterar o documento ou o resultado integral. Log: .tools/logs/t044-estimated-decimals.log. Sem navegador/build; estrutura e controles preservados. Aceite manual do complemento pendente.

### Ajustes posteriores — tabela compacta e volumes por classe

Em 27/11/2026, a pedido do solicitante, reduzidas as larguras das colunas da tabela de concreto: largura mínima passou de 1250 para 980 px, com distribuição proporcional para pavimento/tipo, classe, preço e custo, menor espaçamento nas células e seletor compacto. A tabela cabe inteira na largura padrão da consulta; em janela menor conserva rolagem interna e campos legíveis. Conferência direcionada no Chrome necessária para verificar o risco concreto de sobreposição: cenário @interface aprovado em 31,6 s (11,6 s de cenário), com ausência de rolagem na consulta em 1280 px, preço legível, seletor sem invadir preço e página sem exceder 900 px. Capturas t044-compact.png e t044-layout.png inspecionadas. Log .tools/logs/t044-compact.log. Sem repetir cálculo/API/PDF, preservados por este ajuste de CSS.

Pedido seguinte estende as duas casas decimais aos volumes dos agrupamentos FCK 30/40/50 e sem classe, incluindo zero como 0,00 m³, no Orçamento e PDF compartilhado. Arredondamento somente visual, preservando os cálculos e valores salvos. Oito testes específicos aprovados em 1,97 s, incluindo 13,94859375 → 13,95 m³ e grupos vazios → 0,00 m³. Log .tools/logs/t044-class-decimals.log. Sem navegador/build adicional para esta mudança de apresentação. Aceite manual dos ajustes permanece pendente.

### Aceite manual e autorização de publicação — 2026-11-27

Aceite manual confirmado expressamente pelo solicitante em 27/11/2026, abrangendo a implementação e todos os ajustes posteriores de apresentação, arredondamento e largura das colunas registrados nesta task. As menções anteriores de pendência descrevem o estado histórico antes desta confirmação. No mesmo pedido, o solicitante autorizou commit e push para main, com publicação pelo workflow existente conforme AGENTS.md.
