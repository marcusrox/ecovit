# T-038 — Exportar relatório de orçamento em PDF

**Tipo** — Implementação

**Resumo** — Permite baixar um relatório do orçamento com identificação do projeto, quantitativos, parâmetros, preços e custos de tijolos, ferragens, assentamento e esquadrias presentes, indicando valores incompletos.

**Execução** — Verificada

**Data de execução** — 2026-11-25

**Aceite manual** — Pendente

## Alteração e limites

Adicionar ao Orçamento existente uma ação para baixar um relatório em PDF, produzido a partir da revisão confirmada em memória. Identificar projeto, data de emissão, base nominal e pavimentos abrangidos. Reunir resumo global, quantitativos, unidades, parâmetros utilizados, preços unitários, custos e detalhamentos pertinentes dos grupos de tijolos, ferragens, materiais de assentamento e esquadrias. Usar as projeções do aplicativo, sem criar fórmulas paralelas ou persistir totais.

O relatório inclui o quadro e os custos das esquadrias da [T-036](T-036-Quadro-e-Orcamento-de-Esquadrias.md), somente para opções presentes no projeto. Esta task é responsável por integrar esses dados ao PDF e depende da conclusão técnica da T-036 e da [T-035](T-035-Orcamento-de-Materiais-de-Assentamento.md), já verificada. A T-036 pode ser implementada e concluída independentemente deste relatório. O total geral inclui os quatro grupos; preço ausente, parcialidade ou indisponibilidade de um grupo deve permanecer identificável no PDF e nos totais dependentes. Valores conhecidos podem ser apresentados sem serem chamados de orçamento completo.

Exportar o projeto completo, com pavimentos identificados por nome e cota; o filtro local de consulta não muda a abrangência do relatório. Conservar a distinção entre quantidade geométrica, perdas, consumo, compra em embalagens e rateio. Informar o caráter nominal da estimativa, sem incluir mão de obra, serviços ou cálculos estruturais. Não incluir desenhos de planta/fiadas neste relatório: pertencem à T-037.

Gerar um documento legível em A4 retrato, com paginação, cabeçalhos de tabelas repetidos quando necessário e sem cortar valores ou misturar unidades. O PDF é uma saída de leitura: consultar/exportar não altera projeto, histórico, câmera, pavimento ativo ou salvamento. Somente leitura pode exportar os dados disponíveis. Não exportar resultados antigos como atuais durante processamento ou sem base vigente; informar o impedimento ou a indisponibilidade correspondente. Falha na geração preserva o projeto e permite nova tentativa.

Referências: [PRD — RF-11](../Ecovit-PRD.md#rf-11--orçamento-quantitativos-e-arquivo-nativo), [Quantitativos](../arquitetura/Quantitativos.md), [Estado e histórico](../arquitetura/Estado-Historico-e-Operacoes.md) e [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md). Na implementação, atualizar os contratos responsáveis para incorporar a nova saída PDF, hoje fora do escopo vigente; selecionar ferramentas compatíveis sem serviço externo desnecessário.

## Critérios de aceite

- [x] **A01** — A ação baixa um PDF identificado, legível e paginado, com resumo global e os quatro grupos previstos; integra o quadro, os preços e os custos de esquadrias implementados na T-036, incluindo somente opções presentes no projeto.
- [x] **A02** — Quantidades, parâmetros, preços, custos e total correspondem à mesma revisão do orçamento do aplicativo; filtro local não reduz a abrangência do relatório e os pavimentos ficam identificados.
- [x] **A03** — Ausência de preços, valores zero, resultados parciais, indisponibilidade e limites monetários preservam seus significados; nenhuma soma conhecida é apresentada como total completo quando faltam valores necessários.
- [x] **A04** — Tabelas longas, nomes extensos e múltiplos pavimentos permanecem legíveis, com unidades, cabeçalhos e páginas coerentes, sem cortes de conteúdo.
- [x] **A05** — Exportar, inclusive em somente leitura, não grava nem modifica o projeto; processamento e falhas não expõem resultados antigos como atuais. Contratos e evidências da verificação pertinente são atualizados.

## Resultado

Task criada a pedido do solicitante em 2026-11-25, originalmente como T-036. Renumerada para T-038 por solicitação explícita na mesma data, em troca com a task de esquadrias. A integração das esquadrias ao PDF é responsabilidade desta task, que depende da nova T-036; a dependência é unidirecional. Implementação e verificação técnica pendentes; a criação e a renumeração desta especificação não autorizam implementação, commit, push ou publicação.

### Implementação e verificação técnica — 2026-11-25

Implementação autorizada pelo solicitante nesta data. A01–A05 verificados tecnicamente; aceite manual permanece pendente. Sem commit, push ou publicação.

- **A01/A02** — Ação de download integrada ao Orçamento existente, com ícone central download. Documento identificado por projeto, emissão no fuso de São Paulo, base nominal e pavimentos com nome/cota. Captura única antes do carregamento sob demanda; resumo e detalhes dos quatro grupos consomem as projeções existentes. Soma segura compartilhada com a consulta em `materialCosts`. Filtro local não entra no relatório. Esquadrias incluem somente opções presentes e seus preços/custos; não há total dos quatro grupos por andar.
- **A03** — Casos de preço ausente/zero, tipo/material faltante, preço retido sem ocorrência, distribuição intermediária de assentamento, parcialidade, base desatualizada e limite monetário cobertos no recorte unitário. Grupos independentes conservam seus valores conhecidos; nenhum total dependente incompleto aparece como completo. Revisão em memória não salva fica identificada no documento.
- **A04** — A4 retrato, fontes locais, quebras de texto/células, cabeçalhos repetidos, continuidade de linha maior que uma página e cabeçalho junto da primeira linha verificados. PDF de oito páginas com quatro pavimentos (incluindo vazio), nomes/descrições extensos e tabelas continuadas gerado e inspecionado visualmente; botão/consulta conferidos em 900 × 680. Páginas rasterizadas a 300 dpi com JPEG de alta qualidade codificado pelo navegador. O relatório é saída de leitura; não oferece texto selecionável ou pesquisa textual.
- **A05** — Chrome verificou preservação do documento/histórico/contexto e exportação em somente leitura, bloqueio durante processamento, recusa de rascunho inválido, falha de fonte com nova tentativa, captura anterior a alteração posterior e cancelamento ao fechar sem download tardio. Geração não salva nem chama motor. PRD e contratos de Quantitativos, Estado e Interface atualizados; motor, banco, envelope e dependências preservados.

Validação proporcional ampliada pela nova saída PDF e seu download: **13 testes unitários aprovados em dois arquivos** (sete de relatório/paginação e seis do orçamento existente; rodada final 0,84 s); **três cenários distintos no Chrome aprovados**, em 56,3 s com preparo. Após ajuste de paginação, revalidado somente o cenário afetado; conferência final de download/layout/somente leitura aprovada em 9,6 s (20,4 s com preparo), sem somar reexecuções como cobertura. Build com typecheck e lint do recorte aprovados. Build conserva aviso de tamanho do chunk principal e aviso de anotação de dependência; gerador do relatório é carregado sob demanda.

A primeira rodada de navegador encontrou demora na recompressão de páginas PNG, corrigida com codificação nativa JPEG antes de concluir. Tentativa posterior de PNG a 200 dpi também ultrapassou o limite do cenário; descartada. A versão final JPEG passou sem ampliar timeout. Revisão visual também corrigiu cabeçalho de tabela isolado no fim da página, com teste específico. A conferência de preservação textual das células considera as quebras de linha, mantendo a verificação de todo o conteúdo. Não foram enfraquecidas asserções.

Evidências locais ignoradas pelo Git em `.tools/t038/`: `unit-final.log`, `browser-final.log`, `browser-layout.log`, `browser-delivery.log`, `build-final.log`, `lint-final.log`, `budget.pdf` e `budget-screen.png`; renderização final em `delivery-page-*.png`. Testes usam servidor próprio na 5174, API 3002 e banco isolado. Porta 5173 preservada. Preparo das dependências e do ambiente exigiu acesso fora do sandbox para DNS/conexão local, concluído sem alterar infraestrutura de produção.
