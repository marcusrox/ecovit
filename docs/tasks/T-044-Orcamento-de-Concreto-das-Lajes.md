# T-044 — Orçamento de concreto das lajes

**Tipo** — Implementação

**Resumo** — Estime o concreto das lajes com consumo por m² e perdas próprios, selecione a classe FCK com preço de referência da Administração e consulte volumes e custos no Orçamento e no PDF.

**Execução** — Pendente

**Data de execução** — —

**Aceite manual** — Pendente

## Alteração e limites

Acrescentar o grupo **Concreto** ao Orçamento, com uma linha por laje existente, referências de preço por classe na Administração → Preços e inclusão no relatório de orçamento em PDF. O Ecovit calcula a área líquida da laje; o usuário informa o consumo de concreto por m², as perdas e a classe. O volume estimado decorre desses parâmetros, sem calcular volumes pela espessura ou pela geometria interna do sistema construtivo.

Esta task registra a definição solicitada. **Sua criação não autoriza implementação, commit, push ou publicação.**

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

Projetos existentes continuam utilizáveis e não recebem classe, consumo ou perdas presumidos. Atualizar os contratos responsáveis durante a futura implementação, incluindo fórmulas e exemplos no Caderno Técnico, referências e totais em Quantitativos e transporte em Persistência, preservando IDs e aceites anteriores. Nesta etapa, criar somente esta task.

## Critérios de aceite

- [ ] **A01** — Administração → Preços permite manter independentemente as referências de concreto FCK 30, 40 e 50 MPa em R$/m³, com permissões e validações vigentes, distinguindo preço ausente de zero e sem impor preços iniciais.
- [ ] **A02** — Orçamento apresenta uma linha por laje existente, com pavimento, tipo configurado ou ausência identificada, área líquida, consumo em L/m², perdas, classe, preço, volume estimado e custo; sem lajes, mostra estado vazio e subtotal zero.
- [ ] **A03** — Consumo e perdas são informados independentemente por laje, respeitam precisão e validação especificadas, aceitam 0% de perdas e não recebem valores presumidos pelo tipo, altura ou capa. Tipo ausente não impede o cálculo por coeficiente.
- [ ] **A04** — Selecionar uma classe incorpora sua referência disponível àquela laje; trocar a classe substitui o preço pela nova referência ou o deixa pendente quando ela não existe, sem conservar preço incompatível. Falha de consulta preserva o estado confirmado.
- [ ] **A05** — Preço próprio, preço incorporado e limpeza intencional são preservados ao reabrir e frente a atualizações administrativas; alteração em uma laje não modifica outras lajes ou a Administração. Cópia explícita da referência e incorporação de campo nunca preenchido seguem o ciclo especificado, sem escrita em somente leitura.
- [ ] **A06** — Área líquida desconta aberturas e o volume segue exclusivamente área × consumo ÷ 1.000 × (1 + perdas ÷ 100), sem usar espessura ou geometria interna para volume. O exemplo de 100 m², 60 L/m², 5% e R$ 500,00/m³ resulta em 6,30 m³ e R$ 3.150,00; 0% resulta em 6 m³ e R$ 3.000,00.
- [ ] **A07** — Volume total, volumes por classe e subtotal usam os valores das lajes sem arredondamento intermediário; preços diferentes na mesma classe produzem custos próprios. Filtros não alteram totais e o subtotal integra uma única vez o total dos materiais, preservando os demais grupos.
- [ ] **A08** — Ausências, rascunhos inválidos e limites numéricos identificam a laje e o campo pertinentes, preservam valores independentes conhecidos e impedem totais completos indevidos. Volume conhecido sem classe permanece identificável e não é atribuído a outra classe.
- [ ] **A09** — PDF inclui todas as lajes, parâmetros efetivos, volumes e custos, agrupamentos e subtotal no resumo, coerentes com a revisão capturada e com os bloqueios existentes; filtros e mudanças posteriores de referências não alteram o relatório.
- [ ] **A10** — Parâmetros e origem/limpeza de preços sobrevivem a salvamento, reabertura, histórico, cópia e arquivo nativo; duplicação de pavimento mantém cópias independentes, exclusão não deixa parcelas órfãs e projetos legados não recebem parâmetros presumidos.
- [ ] **A11** — Contratos responsáveis refletem o comportamento implementado e o limite de estimativa orçamentária, sem dimensionamento estrutural, inclusão de outros elementos ou alteração do graute de preenchimento.

Escolher a conferência proporcional ao impacto conforme [Qualidade e desempenho](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração), sem impor suíte completa ou matriz ampla por esta especificação.

## Resultado

Task criada a pedido do solicitante. Implementação não iniciada; critérios A01–A11 e aceite manual permanecem pendentes.
