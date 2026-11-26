# T-038 — Exportar relatório de orçamento em PDF

**Tipo** — Implementação

**Resumo** — Permite baixar o Orçamento em PDF para o projeto completo, acompanhando sua estrutura e informações, com valores estáticos no lugar dos campos editáveis e indicação de valores incompletos.

**Execução** — Verificada

**Data de execução** — 2026-11-26

**Aceite manual** — Confirmado pelo solicitante em 2026-11-26

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

Referências: [PRD — RF-11](../Ecovit-PRD.md#rf-11--orçamento-quantitativos-e-arquivo-nativo), [Quantitativos](../arquitetura/Quantitativos.md), [Estado e histórico](../arquitetura/Estado-Historico-e-Operacoes.md) e [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md). A saída PDF integra os contratos responsáveis; manter ferramentas compatíveis sem serviço externo desnecessário.

## Critérios de aceite

### Critérios verificados na implementação anterior

- [x] **A01** — A ação baixa um PDF identificado, legível e paginado, com resumo global e os quatro grupos previstos; integra o quadro, os preços e os custos de esquadrias implementados na T-036, incluindo somente opções presentes no projeto.
- [x] **A02** — Quantidades, parâmetros, preços, custos e total correspondem à mesma revisão do orçamento do aplicativo; filtro local não reduz a abrangência do relatório e os pavimentos ficam identificados.
- [x] **A03** — Ausência de preços, valores zero, resultados parciais, indisponibilidade e limites monetários preservam seus significados; nenhuma soma conhecida é apresentada como total completo quando faltam valores necessários.
- [x] **A04** — Tabelas longas, nomes extensos e múltiplos pavimentos permanecem legíveis, com unidades, cabeçalhos e páginas coerentes, sem cortes de conteúdo.
- [x] **A05** — Exportar, inclusive em somente leitura, não grava nem modifica o projeto; processamento e falhas não expõem resultados antigos como atuais. Contratos e evidências da verificação pertinente são atualizados.

### Refinamentos da especificação local — verificados em 2026-11-26

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

### Implementação e verificação técnica — 2026-11-25

Implementação autorizada pelo solicitante nesta data. A01–A05 verificados tecnicamente; aceite manual permanece pendente. Sem commit, push ou publicação.

- **A01/A02** — Ação de download integrada ao Orçamento existente, com ícone central download. Documento identificado por projeto, emissão no fuso de São Paulo, base nominal e pavimentos com nome/cota. Captura única antes do carregamento sob demanda; resumo e detalhes dos quatro grupos consomem as projeções existentes. Soma segura compartilhada com a consulta em `materialCosts`. Filtro local não entra no relatório. Esquadrias incluem somente opções presentes e seus preços/custos; não há total dos quatro grupos por andar.
- **A03** — Casos de preço ausente/zero, tipo/material faltante, preço retido sem ocorrência, distribuição intermediária de assentamento, parcialidade, base desatualizada e limite monetário cobertos no recorte unitário. Grupos independentes conservam seus valores conhecidos; nenhum total dependente incompleto aparece como completo. Revisão em memória não salva fica identificada no documento.
- **A04** — A4 retrato, fontes locais, quebras de texto/células, cabeçalhos repetidos, continuidade de linha maior que uma página e cabeçalho junto da primeira linha verificados. PDF de oito páginas com quatro pavimentos (incluindo vazio), nomes/descrições extensos e tabelas continuadas gerado e inspecionado visualmente; botão/consulta conferidos em 900 × 680. Páginas rasterizadas a 300 dpi com JPEG de alta qualidade codificado pelo navegador. O relatório é saída de leitura; não oferece texto selecionável ou pesquisa textual.
- **A05** — Chrome verificou preservação do documento/histórico/contexto e exportação em somente leitura, bloqueio durante processamento, recusa de rascunho inválido, falha de fonte com nova tentativa, captura anterior a alteração posterior e cancelamento ao fechar sem download tardio. Geração não salva nem chama motor. PRD e contratos de Quantitativos, Estado e Interface atualizados; motor, banco, envelope e dependências preservados.

Validação proporcional ampliada pela nova saída PDF e seu download: **13 testes unitários aprovados em dois arquivos** (sete de relatório/paginação e seis do orçamento existente; rodada final 0,84 s); **três cenários distintos no Chrome aprovados**, em 56,3 s com preparo. Após ajuste de paginação, revalidado somente o cenário afetado; conferência final de download/layout/somente leitura aprovada em 9,6 s (20,4 s com preparo), sem somar reexecuções como cobertura. Build com typecheck e lint do recorte aprovados. Build conserva aviso de tamanho do chunk principal e aviso de anotação de dependência; gerador do relatório é carregado sob demanda.

A primeira rodada de navegador encontrou demora na recompressão de páginas PNG, corrigida com codificação nativa JPEG antes de concluir. Tentativa posterior de PNG a 200 dpi também ultrapassou o limite do cenário; descartada. A versão final JPEG passou sem ampliar timeout. Revisão visual também corrigiu cabeçalho de tabela isolado no fim da página, com teste específico. A conferência de preservação textual das células considera as quebras de linha, mantendo a verificação de todo o conteúdo. Não foram enfraquecidas asserções.

Evidências locais ignoradas pelo Git em `.tools/t038/`: `unit-final.log`, `browser-final.log`, `browser-layout.log`, `browser-delivery.log`, `build-final.log`, `lint-final.log`, `budget.pdf` e `budget-screen.png`; renderização final em `delivery-page-*.png`. Testes usam servidor próprio na 5174, API 3002 e banco isolado. Porta 5173 preservada. Preparo das dependências e do ambiente exigiu acesso fora do sandbox para DNS/conexão local, concluído sem alterar infraestrutura de produção.

### Integração dos registros — 2026-11-26

Integrados o refinamento documental local e o registro remoto da implementação anterior, preservando seus critérios e evidências. A verificação registrada em 2026-11-25 refere-se aos critérios anteriores; não comprova automaticamente os critérios refinados, que permanecem pendentes de confronto com o aplicativo. Os registros de prontidão acima descrevem a etapa anterior à implementação remota. Aceite manual permanece pendente. Integração documental conferida por diff, sem nova execução de testes.

### Conferência dos refinamentos — 2026-11-26

Inspeção dirigida do código, sem alteração funcional ou nova execução de testes. Diferenças confirmadas:

- **A01** — `src/app/budget-report/model.ts` monta blocos, tabelas e textos próprios; compartilha projeções de domínio, mas não a estrutura de apresentação dos componentes do Orçamento. A tela concentra os resumos dos quatro grupos antes do detalhamento; o PDF intercala resumo e detalhes de cada grupo. Falta atender à apresentação compartilhada, com a mesma organização e preservação das informações, evitando evolução independente.
- **A02/A05** — `src/app/Quantities.tsx` desabilita o botão e recusa a exportação quando `saved === "saving"`. Falta permitir exportar a revisão confirmada durante o salvamento remoto, com sua condição identificada, conforme o refinamento.
- **A05** — A exportação recusa qualquer rascunho e não possui espera explícita pela confirmação normal disparada no blur. Falta assegurar o encadeamento dessa confirmação com a captura da revisão e conferir o clique diretamente após editar um campo válido; rascunhos inválidos ou outros rascunhos devem continuar exigindo correção ou desfazimento.

Já presentes no código e/ou na evidência anterior: projeto completo sem filtro local, tabela por fiada, pavimentos com nome/cota, captura única antes da geração assíncrona, aviso de revisão não salva, motivos de indisponibilidade por grupo e esquadrias independentes da composição. A04 conserva a evidência anterior de paginação e legibilidade para a apresentação atual; mudanças futuras na apresentação exigem conferir o recorte afetado. Os critérios refinados não foram marcados como integralmente aprovados. Aceite manual permanece pendente. Nenhuma correção funcional foi implementada nesta conferência.


### Implementação dos três refinamentos pendentes — 2026-11-26

Implementação autorizada expressamente pelo solicitante nesta data. Concluídos os três pontos identificados na conferência anterior; A01–A05 refinados verificados tecnicamente. Aceite manual permanece pendente.

- **A01/A02** — PDF deriva sua apresentação dos mesmos componentes da tela, por renderização estática sem efeitos ou consulta de referências. Preserva ordem de resumos/detalhes, tabelas, explicações, linhas sem uso e tabela por fiada; campos viram valores estáticos com rótulos/unidades, sem botões, filtro ou instruções de edição. Apresentação considera todos os pavimentos da revisão capturada; células mescladas dos totais são preservadas na paginação. Não há fórmulas paralelas ou seleção independente de conteúdo.
- **A02/A05** — Retirado bloqueio por salvamento remoto. Ensaio reteve o PUT real enquanto o clique confirmou perdas de tijolos e baixou o PDF da revisão local; aviso Não salvo e preservação após rejeição do salvamento conferidos. Documento e condição de salvamento continuam capturados juntos antes da geração assíncrona.
- **A05** — Confirmações normais de perdas/preços dos quatro grupos são acompanhadas localmente. Exportação aguarda as já iniciadas ao sair do campo, sincroniza a limpeza dos rascunhos no React e só então captura a revisão, sem esperar o envio remoto ou confirmar outros rascunhos. Cenário com confirmação de aço artificialmente atrasada verificou espera, download posterior e preservação de outro rascunho inválido. Processamento, somente leitura, falha/nova tentativa, captura anterior a edição posterior e cancelamento conservam os comportamentos conferidos.
- **A03/A04** — Projeções de domínio e tratamento de ausência/zero, configuração faltante, parcialidade, base desatualizada e limites monetários preservados nos componentes compartilhados e nos testes dirigidos. PDF A4 de nove páginas, quatro pavimentos (um vazio), nomes/descrições extensos e tabelas continuadas renderizado com Poppler; todas as páginas inspecionadas, com conferência ampliada da primeira e última. Sem cortes, sobreposição ou perda de unidades/cabeçalhos.

Validação proporcional pela apresentação compartilhada e pelo encadeamento de confirmação/exportação: **14 testes unitários aprovados em dois arquivos (690 ms)**; **seis cenários distintos aprovados no Chrome em recortes**, reaproveitando aspectos preservados sem somar reexecuções como cobertura. Rodadas finais pertinentes: apresentação/download/continuidade durante salvamento em browser-refinement-final.log (três aprovados, um caso de atraso falhou e foi corrigido); confirmação atrasada em browser-delayed-refinement.log (um aprovado, 13,4 s com preparo); captura/cancelamento e salvamento em browser-capture-refinement-final.log (dois aprovados, 19,2 s com preparo). Os casos anteriores de falha/nova tentativa/entradas inválidas permaneceram aprovados em browser-refinement.log. Lint do recorte e build com typecheck aprovados; frontend compilado em 10,25 s. Build conserva os avisos anteriores de tamanho do chunk principal e anotação da dependência; o renderizador estático acompanha o gerador sob demanda, sem biblioteca nova.

Falhas corrigidas durante a entrega: pré-otimização explícita do renderizador para impedir recarga do Vite no primeiro download; extração consistente de nós de texto adjacentes entre renderização estática e tela; atualização efetiva do React após confirmação local atrasada. Testes foram adaptados à apresentação compartilhada, conservando verificações de totais, número de linhas de fiadas, indisponibilidade, limites, integridade e paginação. Nenhuma asserção foi enfraquecida e nenhum timeout foi ampliado.

Evidências em .tools/t038/: unit-refinement-final.log, lint-refinement-final.log, build-refinement-final.log, logs de navegador acima, budget.pdf, final-page-*.png e final-contact.png. Preparo isolado inicialmente impedido pelo sandbox; reexecução com acesso autorizado confirmou o ambiente mantido Node 24/PostgreSQL 18/ecovit_test, sem infraestrutura alternativa. Navegador usou somente 5174/3002 e dados isolados; 5173 preservada. Sem commit, push ou publicação nesta implementação.


### Totais no início do Orçamento — 2026-11-26

A pedido do solicitante, movido o quadro de subtotais dos quatro grupos e total geral para a abertura do resumo do projeto, antes dos materiais. Bloco recebe fundo suave, borda e espaçamento próprios; total geral mantém o destaque existente. Avisos de valores incompletos acompanham o quadro. A apresentação compartilhada reflete a ordem no PDF. Conferência proporcional: inspeção do deslocamento/estilos e um teste existente do componente aprovado (1,41 s), verificando posição anterior aos materiais e preservação dos valores; sem navegador ou build para este ajuste local. Evidência: .tools/t038/totals-first-unit.log. Aceite manual continua pendente.


### Ação de PDF flutuante — 2026-11-26

A pedido do solicitante, movido Baixar orçamento em PDF para o topo esquerdo flutuante, no lado oposto a Voltar ao desenho. Reaproveitados os estilos flutuantes existentes, com distribuição específica do Orçamento, preservando a tela Áreas. Eventos, estados e mensagens de exportação mantidos. Testes não executados por instrução expressa do solicitante. Aceite manual permanece pendente.


### Formatação do quadro de totais no PDF — 2026-11-26

Corrigida a conversão do quadro compartilhado de subtotais/total: deixa de produzir parágrafos e passa a gerar tabela de duas colunas, com valores à direita e total geral em negrito, valor maior e fundo destacado. Dados/rótulos continuam provenientes dos mesmos componentes do Orçamento. Paginação mantém o quadro junto quando cabe em uma página. Conferência por inspeção do código e prévia estática do quadro renderizada com Poppler em .tools/t038/summary-format.png; esta prévia isola o paginador/estilos e não constitui novo teste do download completo. Não foram executados testes, preservando a instrução expressa anterior. Comparação de tabelas no cenário existente ajustada para distinguir o quadro de totais das tabelas de materiais. Aceite manual permanece pendente.


### Unidades ao lado dos rendimentos — 2026-11-26

A pedido do solicitante, movidas as unidades kg/m² e ml/m² para depois do campo de rendimento, na mesma linha, usando alinhamento flexível centralizado para manter os inputs na altura dos campos vizinhos. Valores, eventos e nomes acessíveis preservados; PDF compartilhado acompanha a ordem valor/unidade. Conferência por inspeção do componente e dos estilos, sem execução de testes conforme orientação vigente do solicitante. Aceite manual permanece pendente.


### Aceite manual — 2026-11-26

Aceite manual integral confirmado expressamente pelo solicitante em 2026-11-26, com autorização de commit e push. Registros anteriores de aceite pendente descrevem as etapas anteriores. Preservadas as evidências técnicas e seus limites; nenhum teste adicional foi executado para registrar este aceite.
