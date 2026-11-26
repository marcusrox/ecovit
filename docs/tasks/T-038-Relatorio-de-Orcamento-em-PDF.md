# T-038 — Exportar relatório de orçamento em PDF

**Tipo** — Implementação

**Resumo** — Permite baixar o Orçamento em PDF para o projeto completo, acompanhando sua estrutura e informações, com valores estáticos no lugar dos campos editáveis e indicação de valores incompletos.

**Execução** — Pendente

**Prontidão** — Pronta para implementação; início aguardando autorização do solicitante.

**Data de execução** — —

**Aceite manual** — Pendente

## Alteração e limites

Adicionar ao Orçamento existente uma ação para baixar um relatório em PDF, produzido a partir da revisão confirmada em memória. Identificar projeto, data de emissão, base nominal e pavimentos abrangidos. Reunir resumo global, quantitativos, unidades, parâmetros utilizados, preços unitários, custos e detalhamentos pertinentes dos grupos de tijolos, ferragens, materiais de assentamento e esquadrias. Usar as projeções do aplicativo, sem criar fórmulas paralelas ou persistir totais.

O PDF é a versão para impressão do Orçamento existente: acompanha a mesma organização, ordem das seções, agrupamentos, tabelas e informações. Compartilhar a estrutura de apresentação e os dados para que melhorias de conteúdo e organização do Orçamento se reflitam também no PDF, evitando manter uma seleção de conteúdo independente. Substituir campos editáveis pelos respectivos valores estáticos, preservando rótulos e unidades; omitir botões e controles de interação. Exportar todas as seções e seus detalhamentos, independentemente de estarem expandidos na tela. As adaptações próprias de impressão abrangem disposição em A4, quebras de página, paginação e repetição de cabeçalhos; a evolução da tela continua exigindo verificar a legibilidade do PDF.

Reaproveitar dados, seções e componentes pertinentes com adaptações de impressão, sem criar um sistema genérico de relatórios. Manter as linhas sem uso conforme o Orçamento, sem filtros exclusivos do PDF para ocultar produtos ou bitolas zerados. Omitir instruções exclusivas de edição, como confirmar um campo por Enter, preservando explicações sobre perdas, consumo, rateio e limitações. Identidade visual, nome do arquivo e formato da data seguem padrões simples do aplicativo; não incluir capa, opções de conteúdo ou configuração adicional nesta entrega.

O relatório inclui o quadro e os custos das esquadrias da [T-036](T-036-Quadro-e-Orcamento-de-Esquadrias.md), somente para opções presentes no projeto. Esta task é responsável por integrar esses dados ao PDF; as dependências técnicas da T-036 e da [T-035](T-035-Orcamento-de-Materiais-de-Assentamento.md) já estão atendidas. A T-036 permanece independente deste relatório. O total geral inclui os quatro grupos; preço ausente, parcialidade ou indisponibilidade de um grupo deve permanecer identificável no PDF e nos totais dependentes. Valores conhecidos podem ser apresentados sem serem chamados de orçamento completo.

Exportar o projeto completo, com pavimentos identificados por nome e cota; o filtro local de consulta não muda a abrangência do relatório. Incluir a tabela existente de quantidades por fiada. Conservar a distinção entre quantidade geométrica, perdas, consumo, compra em embalagens e rateio. Informar o caráter nominal da estimativa, sem incluir mão de obra, serviços ou cálculos estruturais. Não incluir desenhos de planta/fiadas neste relatório: pertencem à T-037, sem dependência desta task.

Respeitar a confirmação normal do campo ao sair dele e aguardar sua conclusão antes de capturar a revisão para exportação. Se restar entrada inválida ou não confirmada, orientar o usuário a corrigir ou desfazer a edição antes de exportar. Não confirmar outros rascunhos automaticamente nem exportar prévias como dados confirmados. A confirmação normal de edição mantém seus efeitos existentes de histórico e salvamento; a geração do PDF é somente leitura.

Permitir exportar alterações confirmadas em memória mesmo que o salvamento remoto ainda não tenha terminado ou tenha falhado, identificando no documento a existência de alterações não salvas. Capturar uma única revisão confirmada e sua condição de salvamento para toda a geração, evitando misturar quantidades, parâmetros, preços e totais de momentos diferentes.

Durante processamento que altera os dados, aguardar sua conclusão antes de exportar; isso não exige aguardar apenas o salvamento remoto de uma revisão já confirmada. Fora desse processamento, permitir gerar o documento com as informações disponíveis e os motivos de indisponibilidade de cada grupo. Preservar a independência das esquadrias em relação à composição geométrica. Nunca apresentar resultados antigos como atuais, nem recalcular a geometria para exportar.

Gerar um documento legível em A4 retrato, com paginação, cabeçalhos de tabelas repetidos quando necessário e sem cortar valores ou misturar unidades. O PDF é uma saída de leitura: sua geração não altera projeto, histórico, câmera, pavimento ativo ou salvamento. Somente leitura pode exportar os dados disponíveis. Falha na geração preserva o projeto e permite nova tentativa.

Referências: [PRD — RF-11](../Ecovit-PRD.md#rf-11--orçamento-quantitativos-e-arquivo-nativo), [Quantitativos](../arquitetura/Quantitativos.md), [Estado e histórico](../arquitetura/Estado-Historico-e-Operacoes.md) e [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md). Na implementação, atualizar os contratos responsáveis para incorporar a nova saída PDF, hoje fora do escopo vigente; selecionar ferramentas compatíveis sem serviço externo desnecessário.

## Critérios de aceite

- [ ] **A01** — A ação baixa um PDF identificado, legível e paginado que acompanha a estrutura compartilhada do Orçamento, incluindo resumo global, os quatro grupos e seus detalhamentos na mesma organização e ordem. Melhorias de conteúdo e organização refletem-se nos dois formatos; campos editáveis aparecem como valores estáticos com rótulos e unidades, sem controles ou instruções exclusivas de edição. Explicações orçamentárias e linhas sem uso seguem o Orçamento; esquadrias incluem somente opções presentes no projeto.
- [ ] **A02** — Quantidades, parâmetros, preços, custos e total correspondem à mesma revisão confirmada em memória e abrangem o projeto completo, incluindo a tabela de quantidades por fiada, com pavimentos identificados por nome e cota; o filtro local e o estado expandido ou recolhido das seções não reduzem o conteúdo exportado. Alterações confirmadas ainda não salvas, inclusive após falha de salvamento, podem ser exportadas com essa condição identificada no documento.
- [ ] **A03** — Ausência de preços, valores zero, resultados parciais, indisponibilidade e limites monetários preservam seus significados; nenhuma soma conhecida é apresentada como total completo quando faltam valores necessários. Fora de processamento que altera dados, grupos indisponíveis não impedem exportar as demais informações com os motivos correspondentes; esquadrias conservam sua independência da composição geométrica.
- [ ] **A04** — Tabelas longas, nomes extensos e múltiplos pavimentos permanecem legíveis, com unidades, cabeçalhos e páginas coerentes, sem cortes de conteúdo.
- [ ] **A05** — A exportação respeita e aguarda a confirmação normal do campo ao sair dele; entradas inválidas ou ainda não confirmadas exigem correção ou desfazimento, sem confirmação automática de outros rascunhos. A geração, inclusive em somente leitura, não grava, modifica ou recalcula o projeto. Processamento que altera dados precisa terminar antes da exportação; processamento e falhas não expõem resultados antigos como atuais, e falha de geração permite nova tentativa. Contratos e evidências da verificação pertinente são atualizados.

## Resultado

Task criada a pedido do solicitante em 2026-11-25, originalmente como T-036. Renumerada para T-038 por solicitação explícita na mesma data, em troca com a task de esquadrias. A integração das esquadrias ao PDF é responsabilidade desta task, que depende da nova T-036; a dependência é unidirecional. Implementação e verificação técnica pendentes; a criação e a renumeração desta especificação não autorizam implementação, commit, push ou publicação.

Especificação refinada a pedido do solicitante em 2026-11-25: PDF acompanha a estrutura e as informações do Orçamento por apresentação e dados compartilhados, com adaptações de impressão e valores estáticos no lugar dos campos editáveis. Confirmada a exportação do projeto completo, independentemente de filtros e seções recolhidas na tela. Conferência documental do diff e da coerência dos critérios; implementação e aceite manual permanecem pendentes. Esta atualização não autoriza implementação, commit, push ou publicação.

Nova revisão incorporada por autorização do solicitante em 2026-11-25: definidos o tratamento de campos em edição, a exportação de alterações confirmadas ainda não salvas e a disponibilidade por grupo após o processamento. Explicitados tabela por fiada, preservação das linhas sem uso, adaptação das instruções de edição e reaproveitamento sem sistema genérico de relatórios. Dependências técnicas registradas como atendidas. Conferência documental do diff e dos critérios, sem alteração de código; implementação, verificação técnica e aceite manual permanecem pendentes.

Marcada como pronta para implementação a pedido do solicitante em 2026-11-25, com a especificação refinada e as dependências técnicas atendidas. Execução permanece pendente por orientação explícita de não implementar ainda; este registro não autoriza implementação, commit, push ou publicação.
