# T-038 — Exportar relatório de orçamento em PDF

**Tipo** — Implementação

**Resumo** — Permite baixar um relatório do orçamento com identificação do projeto, quantitativos, parâmetros, preços e custos de tijolos, ferragens, assentamento e esquadrias presentes, indicando valores incompletos.

**Execução** — Pendente

**Data de execução** — —

**Aceite manual** — Pendente

## Alteração e limites

Adicionar ao Orçamento existente uma ação para baixar um relatório em PDF, produzido a partir da revisão confirmada em memória. Identificar projeto, data de emissão, base nominal e pavimentos abrangidos. Reunir resumo global, quantitativos, unidades, parâmetros utilizados, preços unitários, custos e detalhamentos pertinentes dos grupos de tijolos, ferragens, materiais de assentamento e esquadrias. Usar as projeções do aplicativo, sem criar fórmulas paralelas ou persistir totais.

O relatório inclui o quadro e os custos das esquadrias da [T-036](T-036-Quadro-e-Orcamento-de-Esquadrias.md), somente para opções presentes no projeto. Esta task é responsável por integrar esses dados ao PDF e depende da conclusão técnica da T-036 e da [T-035](T-035-Orcamento-de-Materiais-de-Assentamento.md), já verificada. A T-036 pode ser implementada e concluída independentemente deste relatório. O total geral inclui os quatro grupos; preço ausente, parcialidade ou indisponibilidade de um grupo deve permanecer identificável no PDF e nos totais dependentes. Valores conhecidos podem ser apresentados sem serem chamados de orçamento completo.

Exportar o projeto completo, com pavimentos identificados por nome e cota; o filtro local de consulta não muda a abrangência do relatório. Conservar a distinção entre quantidade geométrica, perdas, consumo, compra em embalagens e rateio. Informar o caráter nominal da estimativa, sem incluir mão de obra, serviços ou cálculos estruturais. Não incluir desenhos de planta/fiadas neste relatório: pertencem à T-037.

Gerar um documento legível em A4 retrato, com paginação, cabeçalhos de tabelas repetidos quando necessário e sem cortar valores ou misturar unidades. O PDF é uma saída de leitura: consultar/exportar não altera projeto, histórico, câmera, pavimento ativo ou salvamento. Somente leitura pode exportar os dados disponíveis. Não exportar resultados antigos como atuais durante processamento ou sem base vigente; informar o impedimento ou a indisponibilidade correspondente. Falha na geração preserva o projeto e permite nova tentativa.

Referências: [PRD — RF-11](../Ecovit-PRD.md#rf-11--orçamento-quantitativos-e-arquivo-nativo), [Quantitativos](../arquitetura/Quantitativos.md), [Estado e histórico](../arquitetura/Estado-Historico-e-Operacoes.md) e [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md). Na implementação, atualizar os contratos responsáveis para incorporar a nova saída PDF, hoje fora do escopo vigente; selecionar ferramentas compatíveis sem serviço externo desnecessário.

## Critérios de aceite

- [ ] **A01** — A ação baixa um PDF identificado, legível e paginado, com resumo global e os quatro grupos previstos; integra o quadro, os preços e os custos de esquadrias implementados na T-036, incluindo somente opções presentes no projeto.
- [ ] **A02** — Quantidades, parâmetros, preços, custos e total correspondem à mesma revisão do orçamento do aplicativo; filtro local não reduz a abrangência do relatório e os pavimentos ficam identificados.
- [ ] **A03** — Ausência de preços, valores zero, resultados parciais, indisponibilidade e limites monetários preservam seus significados; nenhuma soma conhecida é apresentada como total completo quando faltam valores necessários.
- [ ] **A04** — Tabelas longas, nomes extensos e múltiplos pavimentos permanecem legíveis, com unidades, cabeçalhos e páginas coerentes, sem cortes de conteúdo.
- [ ] **A05** — Exportar, inclusive em somente leitura, não grava nem modifica o projeto; processamento e falhas não expõem resultados antigos como atuais. Contratos e evidências da verificação pertinente são atualizados.

## Resultado

Task criada a pedido do solicitante em 2026-11-25, originalmente como T-036. Renumerada para T-038 por solicitação explícita na mesma data, em troca com a task de esquadrias. A integração das esquadrias ao PDF é responsabilidade desta task, que depende da nova T-036; a dependência é unidirecional. Implementação e verificação técnica pendentes; a criação e a renumeração desta especificação não autorizam implementação, commit, push ou publicação.
