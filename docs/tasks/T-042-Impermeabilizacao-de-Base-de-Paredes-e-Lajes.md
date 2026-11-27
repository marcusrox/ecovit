# T-042 — Impermeabilização de base de paredes e lajes

**Tipo** — Implementação

**Resumo** — Estime a compra de impermeabilizante para a base das paredes e para lajes, com percentuais por pavimento e por laje, produtos independentes e preços de referência da Administração no orçamento e PDF.

**Execução** — Verificada

**Data de execução** — 2026-11-27

**Aceite manual** — Pendente

## Alteração e limites

Acrescentar ao Orçamento do aplicativo o grupo **Impermeabilização de base de paredes e lajes**, aplicado sobre o concreto abaixo da primeira fiada e sobre as superfícies das lajes escolhidas pelo usuário. A impermeabilização existente nas faces das paredes, da T-040, permanece com seus parâmetros, referências, cálculo e custos próprios; o novo grupo não a substitui nem reutiliza seus valores automaticamente. Rejunte e demais materiais permanecem nos contratos atuais.

Criar dois itens independentes, sem catálogo de marcas ou variantes:

- **Base das paredes**: um produto comum ao projeto, com percentual de aplicação independente em cada pavimento.
- **Superfície das lajes**: outro produto comum ao projeto, com percentual de aplicação independente em cada laje existente.

O produto das lajes pode ser diferente do produto das bases. Não exigir produtos distintos nem consolidar suas compras automaticamente quando as descrições coincidirem. Não há escolha de produto por parede, pavimento ou laje: somente os percentuais variam localmente. O usuário pode deixar qualquer pavimento ou laje em 0%, sem aplicação nem custo correspondente. Não acrescentar outras aplicações sobre concreto, identificação automática de exposição, seleção de paredes individuais, demãos, serviços, mão de obra ou dimensionamento construtivo.

Criação desta especificação solicitada em 27/11/2026. A autorização abrange somente a task, sem implementação, commit, push ou publicação.

### Base das paredes — por pavimento

Apresentar todos os pavimentos existentes, identificados por nome e cota, com o campo **Paredes com base impermeabilizada (%)**. Percentual de 0% a 100%, com até duas casas decimais e valor inicial de 0%.

Para cada pavimento, somar uma vez por identidade as paredes pertencentes a ele. Usar o comprimento em planta entre os extremos confirmados e a espessura nominal vigente da parede. A convenção acordada é:

`Área-base do pavimento = soma(comprimento da parede × espessura da parede × 1,5)`

`Área aplicada nas bases = área-base do pavimento × percentual do pavimento / 100`

A margem fixa de 50% aumenta a largura total da faixa: uma parede com 15 cm corresponde a uma faixa de 22,5 cm, não a 30 cm. Não aplicar os 50% novamente no rendimento, na compra ou na área da laje. O percentual estima a parcela do comprimento das paredes que receberá a faixa, sem selecionar trechos no desenho.

Usar o comprimento integral de cada parede nesta estimativa linear, sem multiplicar pela altura ou pelas duas faces, sem descontar portas/janelas/vãos e sem criar união geométrica ou compensações de cruzamentos entre faixas. Esta soma nominal não é a área de revestimento vertical da T-040 nem a área construída/útil. Não modificar paredes, espessuras, apoios ou composição para produzir o orçamento.

Exemplo: 100 m lineares de paredes de 15 cm produzem 22,5 m² de faixa com a margem; aplicação de 60% resulta em **13,5 m²**. Outro pavimento com 40 m lineares e a mesma espessura, a 50%, acrescenta **4,5 m²**. O produto de base cobre **18 m²** no projeto. Um pavimento a 0% não contribui, independentemente dos demais.

### Superfície das lajes — por laje

Apresentar cada laje existente, identificada pelo pavimento e pela identificação disponível no modelo, com o campo **Área da laje impermeabilizada (%)**. Percentual de 0% a 100%, com até duas casas decimais e valor inicial de 0%. Não criar laje ou ampliar o limite de lajes do modelo vigente.

Usar a área horizontal líquida da laje: interior do contorno externo menos as aberturas existentes, conforme a geometria de CT-13. Aplicar o percentual sobre essa área, sem margem adicional, sem multiplicar por espessura, sem faces inferiores ou áreas laterais e sem descontar a faixa das paredes. As duas aplicações representam etapas independentes e não se anulam por coincidirem em planta.

`Área aplicada na laje = área líquida da laje × percentual da laje / 100`

Não inferir quais lajes estão expostas ou precisam de tratamento. Essa escolha pertence ao usuário, que pode manter 0% em uma laje e informar outro percentual nas demais. Sem lajes, este item tem área e custo zero, sem criar linha fictícia ou exigir parâmetros de compra.

Exemplos: laje de 80 m² líquidos a 50% resulta em **40 m²**; outra laje de 30 m² a 0% não acrescenta área. Uma laje com contorno de 100 m² e abertura de 20 m² tem 80 m² líquidos; a 50%, também resulta em **40 m²**, sem margem de 50%.

### Produtos, rendimento e compra

Cada um dos dois itens tem seus próprios campos globais no projeto, seguindo os padrões de edição da T-040:

| Campo | Regra |
|---|---|
| Produto e embalagem de referência | Primeiro campo editável de cada item; texto opcional de até 160 caracteres, que pode ser informado, alterado ou limpo e permanece ao editar/limpar o preço |
| Rendimento (m²/embalagem) | Positivo, com até três casas decimais; inicialmente ausente; área coberta por uma embalagem para o tratamento completo |
| Preço (R$/embalagem) | Não negativo, com até duas casas decimais; inicialmente ausente; editável, com zero válido e integração às referências administrativas |

Percentuais pertencem aos pavimentos/lajes, não a um percentual global do produto. As referências administrativas não preenchem percentuais ou rendimento. O usuário confere se rendimento e preço correspondem ao produto e à mesma embalagem identificados; não inferir consumo físico, peso/volume, quantidade de demãos ou adequação técnica do produto.

Consolidar a área de cada item separadamente no projeto. Compra = teto(área aplicada total do item / rendimento); custo = compra × preço por embalagem. Arredondar uma única vez por item no projeto, sem comprar embalagens independentes por pavimento ou laje. A quantidade de embalagens para compra e a área estimada de aplicação devem ser identificadas como medidas diferentes, sem afirmar consumo exato do conteúdo adquirido.

Exemplo combinado: os 18 m² de bases, com rendimento de 10 m²/embalagem e preço de R$ 100,00, exigem **2 embalagens e R$ 200,00**. Os 40 m² de lajes, com outro produto de 30 m²/embalagem a R$ 150,00, exigem **2 embalagens e R$ 300,00**. O novo grupo acrescenta **R$ 500,00** ao total, preservando os custos anteriores. Os exemplos são convenções de orçamento, sem recomendação de aplicação ou comprovação de consumo físico.

Usar a precisão inteira/racional existente e arredondar somente a apresentação das áreas e a compra global. Custos usam centavos inteiros seguros. Ratear o custo de cada compra global pelas respectivas áreas aplicadas locais, com maiores restos e desempates vigentes da T-035. No exemplo das bases, 13,5 m² e 4,5 m² recebem **R$ 150,00 e R$ 50,00**. As somas locais fecham no custo global; não apresentar embalagens locais arredondadas como novas compras.

### Administração — Preços

Acrescentar duas referências fixas e independentes em R$/embalagem, claramente identificadas como impermeabilizante para **Base das paredes** e para **Superfície das lajes**. Preservar a referência já existente para impermeabilização das faces das paredes. Cada referência nova tem **Produto e embalagem de referência** e preço, confirmados juntos pelo fluxo Enter/blur, sem botão Salvar, com descrição obrigatória quando houver preço.

Reutilizar autorização, validação cliente/API, conflito, repetição segura, auditoria, consulta e limpeza da T-039/T-040. Preço e descrição de um item não alteram os do outro. Não cadastrar automaticamente como referência um produto digitado no projeto.

Ao abrir o Orçamento editável, incorporar referência somente em preço nunca preenchido; capturar preço e descrição coerentes no projeto. Permitir preço próprio e a ação existente de copiar a referência vigente. Preservar zero, preço já incorporado e limpeza intencional. Alterações administrativas posteriores não atualizam nem renomeiam valores já incorporados. Edição/limpeza do preço retira a descrição capturada da origem, conservando a identificação editável do produto. Copiar nova referência substitui essa identificação conforme o fluxo vigente. Somente leitura e PDF não incorporam referências.

### Consulta, integridade e ciclo dos elementos

Manter edição por Enter/blur, prévias, salvamento, histórico e recuperação existentes, sem recalcular a composição por alteração exclusivamente orçamentária. Percentuais, rendimento, preço, identificação e origem dos preços persistem em reabertura, histórico, cópia de projeto/pavimento e arquivo. Associar percentuais por identidade estável, sem usar nome, cota ou posição na lista como chave. Renomear/reordenar preserva a configuração; duplicar preserva os valores com as referências corretas do destino, sem compartilhar mutações. Elementos novos iniciam em 0%; remover, desfazer e refazer mantém os vínculos coerentes, sem configuração órfã contribuir no cálculo.

Projetos legados continuam utilizáveis com os novos percentuais em 0%, sem transferir parâmetros da impermeabilização vertical e sem custo novo automático. Estender o contrato de persistência pela política vigente de versão/migração e validação compartilhada cliente/API, sem descarte silencioso de parâmetros incompatíveis. Não fixar antecipadamente um número de versão nesta task.

Aplicação confirmada de 0% dispensa rendimento/preço da respectiva parcela. Área válida zero produz zero; área indisponível necessária ao cálculo não pode ser convertida em zero ou substituída por revisão anterior. Com área positiva, rendimento ausente/inválido impede compra/custo; preço ausente/inválido preserva a compra conhecida e impede o custo. Rascunhos inválidos, estouro numérico, bloqueios de processamento e parcialidade devem conservar a distinção entre resultado conhecido, zero, parcial e indisponível, afetando somente os derivados dependentes. Reutilizar as validações de geometria do modelo, sem uma nova análise construtiva.

Integrar os dois itens ao resumo, ao total geral, ao detalhamento e ao PDF. Mostrar por pavimento a área de faixa e seu percentual; por laje, área líquida, percentual e área aplicada. Mostrar área global, rendimento, compra inteira, produto/embalagem, custos separados e subtotal do novo grupo. O filtro de pavimento e o recolhimento não alteram percentuais, compras ou totais globais; o PDF abrange todos os pavimentos/lajes e usa os mesmos valores da revisão capturada. Não criar total financeiro por pavimento reunindo todos os grupos.

Incluir as pendências aplicáveis no fluxo da T-041, com identificação do produto e do pavimento/laje e destino no campo pertinente do Orçamento. Não criar navegação nova à planta para estes percentuais, correção automática ou ampliação dos bloqueios de exportação além do necessário aos novos rascunhos pelo contrato existente. Manter somente leitura e as mensagens de salvamento/recuperação.

Na implementação, registrar a convenção e os exemplos no Caderno Técnico, fórmulas/disponibilidade em Quantitativos, parâmetros e vínculos no contrato responsável, integração de referências e persistência nos contratos atuais e apresentação/navegação em Interface e Iconografia. Ajustar RF-11 e o contrato de lajes somente para esta projeção orçamentária; a exclusão atual de quantitativos de lajes não deve impedir a área necessária ao novo produto, nem autorizar volume, concreto, aço ou outros quantitativos. Preservar IDs e aceites anteriores. Não atualizar agora os contratos como se a funcionalidade já estivesse entregue.

Referências: [PRD — RF-11](../Ecovit-PRD.md#rf-11--orçamento-quantitativos-e-arquivo-nativo), [Caderno Técnico — CT-13](../Ecovit-Caderno-Tecnico.md#112-m42--geometria-de-lajes), [Elementos construtivos — Lajes](../arquitetura/Elementos-Construtivos.md#lajes), [Quantitativos](../arquitetura/Quantitativos.md), [Estado, Histórico e Operações](../arquitetura/Estado-Historico-e-Operacoes.md), [Persistência e Compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md), [Interface e Iconografia](../arquitetura/Interface-e-Iconografia.md), [T-039](T-039-Precos-de-Referencia-na-Administracao.md), [T-040](T-040-Orcamento-de-Impermeabilizante-e-Rejunte.md) e [T-041](T-041-Pendencias-do-Orcamento.md).

## Critérios de aceite

- [x] **A01** — A impermeabilização existente das faces das paredes e o rejunte preservam parâmetros, referências e custos. O novo grupo distingue Base das paredes e Superfície das lajes, com produtos, descrições, rendimentos e preços independentes.
- [x] **A02** — Percentual independente de 0–100% por pavimento aplica-se à soma nominal comprimento × espessura × 1,5, sem altura, faces ou desconto de vãos. Os exemplos de 13,5 m² e 4,5 m² resultam em 18 m²; 0% permite dispensar qualquer pavimento e 50% extra significa largura total de 1,5 vez a espessura.
- [x] **A03** — Cada laje existente tem percentual independente de 0–100% sobre sua área líquida, descontadas aberturas e sem margem. Laje de 100 m² com abertura de 20 m² a 50% resulta em 40 m². Uma laje pode ficar em 0% sem impedir outra; ausência de lajes gera zero, sem exigir produto, rendimento ou preço.
- [x] **A04** — Cada item permite editar/limpar Produto e embalagem de referência, rendimento e preço, com unidades e regras da T-040. Compra arredonda uma vez por item no projeto. O exemplo combinado exige duas embalagens para bases e duas para lajes, custa R$ 500,00 e rateia R$ 150,00/R$ 50,00 nas bases, sem duplicar compras locais.
- [x] **A05** — Administração mantém duas referências novas com produto/embalagem e preço independentes da referência vertical. Confirmação conjunta por Enter/blur, limpeza, conflito, autorização, auditoria e repetição segura seguem os contratos atuais. Incorporação/cópia preserva descrição e preço juntos; zero, preço próprio, limpeza e alterações administrativas posteriores conservam a estabilidade dos dados do projeto.
- [x] **A06** — Parâmetros e vínculos persistem em arquivo, reabertura, histórico e cópias; renomear/reordenar não troca percentuais entre elementos, e excluir/desfazer/refazer não deixa contribuição órfã. Legados e elementos novos iniciam em 0%, sem custo novo automático. Validação/versão preservam os parâmetros sem perda silenciosa, e edição orçamentária não recalcula a composição.
- [x] **A07** — Zero, área indisponível, rascunhos inválidos, parâmetros ausentes, limites numéricos e parcialidade mantêm os derivados coerentes e os demais grupos conhecidos. Pendências identificam item e pavimento/laje, levando aos campos do Orçamento. Somente leitura, salvamento, recuperação e bloqueios de exportação conservam os fluxos atuais.
- [x] **A08** — Resumo, detalhe, filtro e PDF exibem áreas, percentuais, identificação dos produtos, compra e custos coerentes; os novos custos integram o total uma vez. Filtrar/recolher não altera compra global e o PDF contém todos os pavimentos/lajes, sem mudar o documento ou incorporar referências durante a exportação.

Escolher a conferência proporcional conforme [Qualidade e desempenho](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração). Estes critérios descrevem resultados e não impõem suíte completa, matriz de telas ou homologação ampla.

## Resultado

Especificação criada em 27/11/2026, conforme solicitação. Conferência documental de escopo, convenções, referências e diff. Nenhuma implementação, teste do aplicativo, banco, navegador ou build executado; execução dos critérios e aceite manual pendentes. Sem commit, push ou publicação.

### Implementação e verificação — 2026-11-27

Implementação autorizada posteriormente pelo solicitante e realizada no aplicativo. O registro anterior descreve somente a criação da especificação. Aceite manual permanece pendente; sem commit, push ou publicação.

| Critérios | Resultado técnico |
|---|---|
| A01–A04 | Dois produtos novos no grupo próprio, mantendo impermeabilizante vertical/rejunte. Percentuais pertencem aos registros de pavimento e laje; bases usam margem de largura de 50%, lajes descontam aberturas sem margem. Exemplos de 18 m²/R$200 e 40 m²/R$300, compra global e rateio R$150/R$50 verificados em domínio. Frações de meia unidade preservadas por escala racional duplicada; zero, rendimento/preço ausentes e limite numérico cobertos. |
| A05 | As duas identidades adicionais reutilizam referência atômica de superfície, com produto/embalagem, sem nova tabela/migração SQL. API com PostgreSQL real verificou os dois produtos novos e o impermeabilizante vertical: autorização, descrição obrigatória, conflito de descrição, repetição segura, limpeza e auditoria. Catálogo administrativo com 19 itens fixos verificado. Chrome conferiu incorporação automática dos novos produtos e estabilidade de preço próprio, zero e limpeza, além de cópia manual no fluxo existente. |
| A06 | Formato 38, com normalização de 9–37 sem aplicação automática e rejeição dos campos novos em formatos anteriores; validação compartilhada cliente/API. Transporte, cópia de projeto/pavimento, IDs de destino, exclusão, ausência de compartilhamento dos novos parâmetros e percentuais inválidos cobertos em domínio. Regressores existentes de cópia/pavimentos e recorte mantido de formatos aprovados. Chrome confirmou preservação da composição/estado ao editar e dados após reabrir o projeto remoto; desfazer/refazer mantém os snapshots existentes por inspeção. |
| A07–A08 | Prévia de percentual inválido não grava nem mostra custo anterior como atual; a pendência identifica o pavimento e foca seu campo. Outros elementos/grupos preservam informação conhecida. Campos usam os bloqueios compartilhados de somente leitura/processamento e o rastreamento de confirmações/exportação. Chrome verificou edição/blur, foco, reabertura, produtos/áreas nos blocos reais do relatório e download de PDF válido. Tabelas globais preservam todos os percentuais; detalhe filtrado mantém rateios globais, por inspeção e renderização compartilhada. Não foi repetida homologação de rede, recuperação ou matriz de navegadores. |

Contratos atualizados em RF-11, Caderno Técnico, Quantitativos, Elementos Construtivos, Estado/Histórico, Persistência e Interface. Nenhum ícone novo. Nenhuma dependência adicionada. A aplicação de percentuais não inicia recomposição, e a área horizontal de lajes fica limitada à impermeabilização, sem volume/concreto/aço.

Validação proporcional: domínio, transporte/cópias, API de referências e dois cenários de Chrome, pois a alteração modifica cálculos, contrato de arquivo, identidade dos preços e eventos de edição/PDF. Sem suíte completa, build ou matriz de telas; não somar repetições ou sobreposição entre os recortes como cobertura adicional.

- **Domínio e regressões selecionadas:** 79 testes aprovados em oito arquivos, 2,70 s (comando: 4,80 s), log `.tools/logs/t042-unit.log`. Os quatro testes novos tiveram conferência final após acrescentar asserções de preservação de parcelas conhecidas: 587 ms (comando: 2,26 s), log `.tools/logs/t042-unit-final.log`. A primeira rodada identificou expectativas desatualizadas de quantidade de linhas e formatação decimal; corrigidas para incluir explicitamente os dois itens novos em zero e o formato numérico vigente, preservando as asserções dos produtos anteriores.
- **Compatibilidade:** `test:formats`, agora incluindo o contrato novo, com 77 testes aprovados e 234 fora do filtro em 24 arquivos, 2,41 s (comando: 4,20 s), log `.tools/logs/t042-formats.log`. Não são 311 testes executados.
- **API:** três cenários de confirmação de superfície aprovados em 2,47 s (comando: 3,37 s), log `.tools/logs/t042-api.log`; cenário de catálogo/concorrência aprovado em 1,29 s (comando: 2,15 s), log `.tools/logs/t042-api-catalog.log`. Os demais cenários ficaram fora dos filtros.
- **Chrome — T-042:** cenário de edição, persistência e PDF aprovado em 8,7 s (rodada: 16,9 s; comando: 17,82 s), log `.tools/logs/t042-browser.log`. Captura `.tools/logs/t042-budget.png` inspecionada sem sobreposição dos campos; PDF `.tools/logs/t042-budget.pdf`. A primeira tentativa esperou o Orçamento após recarregar a página, que retorna à lista de projetos; corrigida a fixture para reabrir o projeto pelo fluxo existente, sem ampliar timeout ou reduzir asserções.
- **Chrome — referências:** cenário existente de incorporação/cópia/estabilidade aprovado em 7,1 s (rodada: 13,2 s; comando: 14,07 s), log `.tools/logs/t042-reference-browser.log`. Atualizada a quantidade esperada para 19 origens neste cenário e acrescentadas asserções das descrições dos dois produtos novos. A primeira rodada parou no seletor antigo que exigia remover a mensagem de consulta do DOM; o contrato atual mantém o texto invisível para reservar espaço. O seletor agora exige invisibilidade do texto exato e mantém a exigência de status Salvo, sem mudar o aplicativo ou os timeouts.
- **Tipos e lint finais:** aprovados em 10,17 s e 3,63 s, logs `.tools/logs/t042-types-final.log` e `.tools/logs/t042-lint.log`. Erros iniciais de tipos na extensão dos parâmetros foram corrigidos antes da validação funcional. Diff e referências locais conferidos no fechamento.
- **Ambiente:** reaproveitado o preparo já disponível nesta sessão. API e Chrome usaram PostgreSQL 18/ecovit_test e schemas isolados; navegador com API 3002 e frontend próprio na 5174, sem intervenção na 5173, sem banco do aplicativo e sem processos desconhecidos encerrados.

### Revisões posteriores e preparação da entrega — 2026-11-27

Após a implementação inicial, o solicitante autorizou as revisões abaixo e, posteriormente, solicitou commit e push da T-042 e de todas as melhorias do Orçamento/Administração → Preços. Os registros anteriores descrevem as etapas em que ainda não havia autorização de envio. Aceite manual permanece pendente.

- A impermeabilização vertical passa a ser identificada como impermeabilizante de superfície de paredes nos parâmetros, referências administrativas, pendências e PDF; o subtotal distingue explicitamente a superfície de paredes. Seções e orientações foram ajustadas. A expectativa textual correspondente foi atualizada, sem testes nessa edição, conforme solicitado.
- As quatro referências de superfície (paredes, bases, lajes e rejunte) passam a confirmar produto/embalagem, rendimento e preço juntos. Esta revisão substitui a restrição anterior desta especificação que deixava rendimento somente no projeto. Percentuais permanecem exclusivamente no projeto. Incorporação automática exige referência completa e ausência de preço, rendimento e identificação próprios; cópia manual substitui o conjunto. Valores já capturados não recebem atualizações administrativas automáticas.
- A migração SQL 005 adiciona rendimento opcional às referências antigas, sem inventar valores ou apagar produto/preço. Referências incompletas continuam visíveis e precisam ser completadas antes de uso. API compara também o rendimento anterior e mantém autorização, conflito, repetição segura e auditoria. O formato do projeto permanece 38, pois já guarda rendimento. A migração foi aplicada somente nos schemas isolados dos testes, não manualmente no banco do aplicativo; o servidor do solicitante deve ser reiniciado pelo fluxo de desenvolvimento mantido para aplicá-la localmente.
- Administração apresenta os nomes dos itens em negrito e os campos de identificação, rendimento e preço lado a lado, com rótulo visível de preço. Validação individual destaca somente o campo incorreto, com mensagem adjacente e associação acessível; falta de rendimento não torna preço ou descrição válidos vermelhos. Mensagens de erro não se sobrepõem aos campos. O alinhamento vertical dos cartões foi ajustado por inspeção após a captura.

Evidências das revisões, sem somar repetições ou sobreposição como cobertura adicional:

- Domínio de referências/rendimento e regressões de superfície: **21 testes aprovados** em quatro arquivos, 1,97 s (comando: 4,84 s), `.tools/logs/reference-yield-unit.log`. Cobertura de cópia conjunta, rendimento modificado com mesmo preço, ausência de operação redundante, legados incompletos, ajustes próprios, limpeza e transporte.
- API/migração: **sete testes aprovados**, 47 fora do filtro em dois arquivos, 2,94 s (comando: 3,98 s), `.tools/logs/reference-yield-api.log`. Cobertura dos quatro produtos, validação, conflito exclusivo de rendimento, repetição, autorização, limpeza, catálogo e migração incremental preservando referências antigas.
- Chrome: **dois fluxos distintos aprovados**, 25,0 s na rodada (comando: 25,98 s), `.tools/logs/reference-yield-browser.log`: completar referência antiga, cadastrar os quatro rendimentos, incorporar o conjunto e preservar ajustes/cópia manual. O fluxo afetado foi revalidado após a indicação individual dos erros: 7,0 s (rodada: 13,2 s; comando: 14,11 s), `.tools/logs/reference-field-errors-browser.log`, com asserções de borda/aria-invalid somente no campo correto e mensagem visível junto a rendimento, descrição e preço. Capturas `.tools/logs/reference-yield-admin.png` e `.tools/logs/reference-field-errors.png` inspecionadas.
- Tipos aprovados em 16,24 s, `.tools/logs/reference-yield-types.log`; lint da revisão de rendimento em 2,21 s, `.tools/logs/reference-yield-lint.log`, e do recorte da indicação de erros em 1,62 s, `.tools/logs/reference-field-errors-lint.log`. Conferência final do diff em `.tools/logs/t042-delivery-diff.log`. Não foram repetidas suítes neste pedido de commit/push.

Contratos de produto, disponibilidade, persistência, estado e interface refletem as revisões. Nenhuma task adicional, dependência ou ícone novo; nenhuma intervenção na porta 5173 ou no banco do aplicativo durante as verificações.
