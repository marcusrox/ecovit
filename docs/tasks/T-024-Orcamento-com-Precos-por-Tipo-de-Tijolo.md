# T-024 — Consultar orçamento com preços por tipo de tijolo

**Tipo** — Implementação

**Resumo** — Transforma a consulta de quantitativos em Orçamento, com preços unitários salvos no projeto, custos por tipo de tijolo e total geral, apresentados em um popup amplo que preserva o contexto do desenho.

**Execução** — Verificada

**Data de execução** — 2026-11-17

**Aceite manual** — Pendente

## Alteração e limites

Renomear o botão **Quantitativos** do cabeçalho do editor para **Orçamento**, incluindo o título da consulta e os nomes acessíveis/dicas correspondentes. Manter os quantitativos existentes: resumo do projeto, quantidades por tipo, perdas opcionais e detalhamento por pavimento/fiada.

Adicionar preços unitários por tipo de tijolo no próprio **Resumo do projeto**, permitindo calcular o custo das peças e preservar os preços no projeto. Apresentar a consulta em um popup quase do tamanho da janela, seguindo a apresentação do **Histórico de Alterações**, em vez de ocupar a tela inteira.

Implementação autorizada pelo solicitante em 2026-11-17, com preços salvos no projeto, custos sobre o total estimado incluindo perdas e apresentação em popup. Commit, push e publicação não foram solicitados nesta execução.

### Preços e quadro Peças do projeto

- Um preço unitário para cada tipo já gerado: **Inteiro, Meio, Canaleta e Meia canaleta**. Os preços são comuns ao projeto, sem cadastro por pavimento, fiada, fabricante ou ocorrência.
- No quadro **Peças do projeto**, manter a identificação dos tipos e as quantidades geométricas, o acréscimo de perdas e o total estimado. Acrescentar a entrada de **Preço unitário (R$)** e fazer de **Custo (R$)** a última coluna. O custo não deve substituir nem esconder a quantidade usada no cálculo.
- A linha final mantém o total de peças e mostra, na última coluna, o **valor total do orçamento de tijolos**. Não somar preços unitários de tipos distintos; a célula de preço unitário dessa linha não é editável.
- O custo por tipo usa a quantidade **Total estimado**, que já inclui as perdas opcionais exibidas: `custo = quantidade estimada × preço unitário`. Com perdas em 0%, essa quantidade coincide com a geométrica. A coluna de custo e sua identificação devem deixar essa base compreensível.
- Exemplo independente: 10 inteiros a R$ 2,50 e 4 meios a R$ 1,20, sem perdas, custam R$ 25,00 e R$ 4,80; total R$ 29,80. Com perdas de 10%, os totais estimados existentes passam a 11 inteiros e 5 meios; custos R$ 27,50 e R$ 6,00, total R$ 33,50. Não arredondar a quantidade novamente ao calcular o custo.
- Aceitar preços não negativos em reais, com até duas casas decimais e vírgula ou ponto na entrada; apresentar dinheiro no padrão brasileiro com duas casas. Armazenar e calcular em centavos inteiros, com conferência de representabilidade, sem arredondamento silencioso ou imprecisão de ponto flutuante. Zero explícito é um preço válido.
- Preço ainda não informado não equivale a zero. Mostrar custo indisponível para um tipo com quantidade positiva sem preço e identificar o total como incompleto, sem exibir um subtotal como total completo. Tipo com quantidade zero tem custo zero e não exige preço para completar o orçamento. Permitir limpar um preço para voltar ao estado não informado.
- Entrada inválida informa a causa e não substitui o último preço confirmado por outro valor silenciosamente. Não apresentar custo antigo como correspondente à entrada inválida. Quantitativos continuam consultáveis quando um preço ou cálculo monetário estiver indisponível.

### Preservação no projeto

Preços confirmados são dados do projeto: persistir no salvamento remoto e no `.ecovit`, mantendo-os ao fechar/reabrir a consulta, sair/reabrir o projeto, importar e duplicar projeto. Projetos anteriores sem preços continuam abrindo, com valores não informados; não inventar preços ou orçamento zero completo. Duplicar/criar/remover pavimento não duplica nem remove a tabela de preços comum ao projeto.

Uma edição de preço confirmada usa o fluxo existente de histórico e salvamento, com indicação de erro e recuperação aplicáveis. Alterar preço não modifica paredes, peças, grautes, canaletas, diagnósticos ou paginação e não dispara recálculo construtivo. Apenas abrir, consultar, filtrar ou fechar o orçamento continua sem gravar o documento. Preços confirmados participam de desfazer/refazer, preservando os atalhos próprios de edição de texto dentro dos campos.

Totais monetários permanecem derivados, sem persistir valores que possam ficar desatualizados. O percentual de perdas e o filtro da consulta mantêm o contrato atual de estado da sessão: não passam a ser salvos por esta task. Ao reabrir o projeto, perdas retornam a 0%; os preços permanecem e os custos são recalculados para as quantidades então exibidas. Explicitar essa distinção na consulta.

Somente leitura permite consultar quantidades, preços e custos salvos, sem editar preços. Durante processamento ou bloqueio de salvamento, respeitar os controles e a recuperação existentes. Falha de persistência não deve anunciar preços como salvos nem apagar silenciosamente os valores em memória.

### Popup e navegação

Usar o mesmo padrão visual do Histórico de Alterações: modal amplo com pequenas margens externas, cantos arredondados, fundo atenuado e editor de origem perceptível. Manter cabeçalho e fechamento disponíveis durante a rolagem do conteúdo; ajustar tabelas e campos ao espaço disponível sem cortar informações ou impedir sua consulta.

Manter o editor montado e bloquear sua interação sob o popup. Fechamento explícito e Escape retornam ao desenho e restauram o foco ao botão Orçamento, preservando pavimento, modo, câmera, seleção e comparação confirmados. Manter as regras existentes de cancelamento de gestos/prévias ao abrir a consulta e de renomeação do projeto pelo primeiro clique. Não criar outra navegação de Planta/Fiada dentro do popup. O seletor de pavimento do detalhamento não troca o pavimento ativo do editor.

### Atualidade, pendências e limites

Usar exclusivamente as peças finais do resultado vigente, conforme CT-16 e o contrato de Quantitativos. Resultado parcial continua identificado como parcial também nos custos; não estimar material dos componentes sem composição. Resultado ausente, desatualizado ou em cálculo não expõe quantidades ou custos antigos como atuais. Preços salvos são independentes da existência do resultado.

O orçamento cobre somente os quatro tipos de peças nominais gerados. Não acrescentar mão de obra, frete, impostos, descontos, preços pesquisados, conversão monetária, consumo de peças-base para cortes, concreto, aço, volume de graute ou custos de lajes/mobiliários. Não transformar o total em declaração de custo completo da obra. Exportações PDF/CSV e impressão continuam fora desta task; o transporte solicitado é o arquivo nativo com os preços.

### Referências e contratos a atualizar na implementação

- [PRD](../Ecovit-PRD.md): RF-11, acesso do cabeçalho e apresentação da consulta; atualizar a restrição atual de ausência de preços/orçamento somente no recorte autorizado.
- [Quantitativos](../arquitetura/Quantitativos.md): preservar agregação, perdas e atualidade; acrescentar preços, aritmética monetária e popup. Atualizar a regra atual que proíbe qualquer gravação da consulta, distinguindo consultar de editar preços.
- [Estado, histórico e operações](../arquitetura/Estado-Historico-e-Operacoes.md): classificação da edição de preço como alteração sem recálculo construtivo, salvamento e desfazer/refazer.
- [Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md): dados de preços, representação remota, leitores e formato nativo, mantendo compatibilidade explícita e recusando valores inválidos. Atualizar versões somente conforme necessidade concreta, sem alterar migrações históricas ou introduzir migração SQL por formalidade.
- [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md): acesso Orçamento, campos monetários e apresentação modal consistente com o histórico. Reusar os componentes e ícones do catálogo vigente, sem nova biblioteca.
- [Caderno técnico](../Ecovit-Caderno-Tecnico.md): CT-16 continua responsável pela contagem das peças; preço não acrescenta convenção construtiva nem comprovação física.

## Critérios de aceite

- [x] **A01** — O acesso e o título passam a Orçamento, com identificação acessível coerente, mantendo resumo e detalhamento de todos os quantitativos existentes.
- [x] **A02** — O resumo permite informar preço unitário para os quatro tipos. O quadro preserva quantidades e perdas, apresenta custo na última coluna e total monetário na última linha, usando o total estimado exibido. Os exemplos de R$ 29,80 sem perdas e R$ 33,50 com 10% de perdas são reproduzidos exatamente.
- [x] **A03** — Preços válidos são tratados em centavos; zero, ausência, limpeza, entrada inválida e falha de representabilidade têm estados distintos e compreensíveis. Preço ausente em tipo com quantidade positiva impede apresentar total completo; tipo sem peças não exige preço. Nenhum erro monetário oculta os quantitativos.
- [x] **A04** — Os preços sobrevivem ao fechamento/reabertura, salvamento remoto, transporte e cópia do projeto. Formatos anteriores sem preços continuam íntegros e mostram valores não informados. Perdas/filtro mantêm seu alcance de sessão, explicitamente separado da persistência dos preços.
- [x] **A05** — Edição confirmada de preço salva e integra desfazer/refazer sem disparar o motor ou alterar composição e diagnósticos. Consultar e filtrar não gravam; somente leitura e processamento respeitam bloqueios. Falha de salvamento conserva os dados em memória e mantém recuperação acessível.
- [x] **A06** — A consulta é um popup amplo com margens visíveis, seguindo o histórico, com cabeçalho/fechamento disponíveis e conteúdo rolável. Fechar ou usar Escape restaura o foco e o contexto do editor; campos e tabelas permanecem acessíveis no espaço disponível.
- [x] **A07** — Resultado parcial mantém a indicação nos quantitativos e custos; resultado ausente/desatualizado não mostra valores antigos como atuais. Filtro de pavimento não altera o total do projeto nem o pavimento ativo do editor.
- [x] **A08** — Contratos pertinentes descrevem preços persistidos, custos derivados e alcance do orçamento, preservando IDs, regras de contagem e registros anteriores de aceite.

## Resultado

Implementada em 2026-11-17. O acesso Orçamento abre um popup amplo no padrão do histórico. O resumo preserva as quantidades, permite preços por tipo, calcula custos sobre o total estimado com perdas e distingue preços ausentes, zero e entradas inválidas. Preços são persistidos em centavos no formato nativo 22 e no documento remoto, com leitura compatível das versões 9–21, cópia, desfazer/refazer e recuperação de falha de salvamento. Alterar preços não dispara composição construtiva. Contratos pertinentes atualizados; CT-16 e suas regras de contagem preservados.

Validação proporcional: 24 testes de orçamento/quantitativos e 192 testes dos contratos de compatibilidade afetados aprovados; cinco cenários selecionados no Chrome aprovados em 39 segundos, cobrindo preços, perdas, persistência, histórico, falha e recuperação de salvamento, consulta sem escrita, resultado indisponível/parcial e apresentação em três resoluções. Tipos do frontend/servidor, lint do recorte alterado e conferência do diff aprovados. Inspeção visual do popup registrada em `.tools/t024-orcamento.png`. Logs locais em `.tools/t024-budget.log`, `.tools/t024-compatibility.log`, `.tools/t024-e2e-final.log`, `.tools/t024-types-final.log` e `.tools/t024-lint.log`. Verificação técnica não representa aceite manual, que permanece pendente.

O servidor local do solicitante precisa ser reiniciado com `./Start-Ecovit.ps1 -Task dev` antes da conferência, pois a API em desenvolvimento não recarrega automaticamente o leitor do formato nativo. Nenhum processo do solicitante na porta 5173 foi alterado.
