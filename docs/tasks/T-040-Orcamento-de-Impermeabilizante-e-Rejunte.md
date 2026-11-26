# T-040 — Orçamento de impermeabilizante e rejunte

**Tipo** — Implementação

**Resumo** — Estime a compra de impermeabilizante e rejunte pela área das paredes, com percentual de aplicação, rendimento e preço por embalagem. Os custos integram o orçamento e o relatório PDF.

**Execução** — Pendente

**Data de execução** — —

**Aceite manual** — Pendente

## Alteração e limites

Acrescentar impermeabilizante e rejunte ao Orçamento do próprio aplicativo, após os grupos existentes. Cada produto tem uma linha de parâmetros, sem catálogo de marcas, tipos ou opções comerciais. O usuário escolhe o produto fora do Ecovit e informa seu rendimento; o preço pode vir da referência cadastrada na Administração ou ser informado/alterado pelo usuário no projeto. Esta task especifica a alteração; sua criação não autoriza a implementação.

### Área de aplicação

Usar a convenção nominal de área de paredes da T-035 como base geométrica: comprimento × altura confirmada, descontando a união dos vãos recortados à parede, sem desconto duplicado de vãos sobrepostos. Para estes dois novos produtos, considerar **as duas faces**: área-base = 2 × área líquida das paredes. Não alterar a área nem o consumo do assentamento existente.

Impermeabilizante e rejunte têm percentuais independentes, de 0% a 100%, aplicados sobre essa área-base. Não precisam somar 100% e podem incidir sobre a mesma superfície. Cada percentual é global por projeto e se aplica igualmente à área de cada pavimento.

O usuário estima a parcela das superfícies que receberá cada produto. Informar 50% ou 45% não seleciona paredes específicas, não identifica fachadas e não garante correspondência com a área real das paredes externas. Explicar essa convenção junto aos campos. Não criar classificação interna/externa, seleção por parede, tratamento de espessura, área de requadros ou novas regras geométricas.

### Parâmetros e compra

Para cada produto, permitir informar:

| Campo | Regra |
|---|---|
| Aplicação (%) | De 0 a 100, com até duas casas decimais; inicialmente 0% |
| Rendimento (m²/embalagem) | Positivo, com até três casas decimais; inicialmente não informado |
| Preço (R$/embalagem) | Não negativo, com até duas casas decimais; inicialmente ausente, podendo receber a referência da Administração pelo fluxo existente; editável pelo usuário; zero é válido |

O rendimento é a área coberta por **uma embalagem para o tratamento completo**, considerando todas as demãos ou aplicações previstas para o produto escolhido. Não assumir rendimento de fabricante nem acrescentar demãos, consumo, perdas ou mão de obra automaticamente. Como o rendimento já é por embalagem, não exigir peso ou volume para calcular a compra.

Para cada produto:

- Área de aplicação = área-base × percentual / 100.
- Embalagens para compra = teto(área de aplicação / rendimento por embalagem).
- Custo = embalagens para compra × preço por embalagem.

Arredondar a compra somente uma vez por produto no projeto, nunca por parede ou pavimento. Calcular com precisão inteira/racional, sem usar áreas arredondadas para exibição. Valores monetários usam centavos inteiros seguros; conservar o padrão existente de entrada decimal com ponto ou vírgula.

Aplicação confirmada de 0% significa produto não utilizado e produz área aplicada, compra e custo zero, mesmo quando a área-base estiver indisponível, sem exigir rendimento ou preço. Com percentual positivo, área-base válida igual a zero também produz esses resultados zero; área-base indisponível impede área aplicada, compra e custo, sem convertê-las em zero. Preservar a indicação de indisponibilidade e os bloqueios existentes para processamento ou composição desatualizada. Assim, projetos existentes não passam a exigir esses parâmetros nem recebem custo novo automaticamente. Com área aplicada positiva, rendimento ausente/inválido impede a compra e o custo; preço ausente/inválido preserva a compra conhecida, mas impede o custo. Não apresentar valor anterior como atual quando o respectivo rascunho for inválido. Incompletude ou estouro numérico afeta somente o produto e os totais dependentes, preservando os demais resultados.

### Apresentação e integração

Apresentar uma seção com os dois produtos, campos acessíveis e unidades explícitas. Mostrar a área-base das duas faces, a área destinada a cada produto, o rendimento informado, a quantidade inteira de embalagens e o respectivo custo. Manter a organização documental, a rolagem geral e os padrões de edição por Enter/blur do Orçamento.

Adicionar subtotais identificados de impermeabilizante e rejunte ao resumo e incluí-los no total geral, com a mesma distinção existente entre zero, ausente, incompleto e parcial. Atualizar a identificação dos materiais abrangidos pelo relatório, pelo total e pelas orientações de incompletude. Não incluir instalação ou mão de obra.

O detalhamento por pavimento usa o filtro e a visibilidade existentes. Mostrar áreas de aplicação por produto e custos rateados da compra global, incluindo sobras, conforme a convenção de rateio monetário da T-035: maiores restos em centavos, desempate por cota e ID. O percentual global não muda ao filtrar pavimentos; a compra continua consolidada no projeto. Não apresentar embalagens arredondadas como compras independentes por andar nem criar total financeiro por pavimento reunindo todos os grupos.

O PDF compartilha parâmetros, áreas, compra, custos e subtotais com a consulta; continua incluindo todos os pavimentos independentemente do filtro e do detalhamento recolhido na tela.

### Preços de referência — Administração e Orçamento

Acrescentar duas referências fixas à tela Administração: impermeabilizante e rejunte, ambas em R$/embalagem, com descrição curta obrigatória ao cadastrar um preço, identificando o produto e a embalagem de referência (por exemplo, nome do produto e conteúdo em litros ou kg). Administradores podem cadastrar, alterar e limpar esses preços e suas descrições pelo fluxo existente da T-039. A descrição é contexto da referência, sem gerar novas identidades ou opções de produto. Preço e descrição formam uma única referência e devem ser consultados e confirmados em conjunto, com validação, autorização, controle de conflito, repetição segura e auditoria existentes. Não criar catálogo de marcas ou variantes comerciais. Percentuais e rendimentos continuam sendo parâmetros do projeto informados pelo usuário; não recebem referência automática.

Reutilizar o ciclo de preços de referência da T-039: ao abrir o Orçamento editável, incorporar a referência disponível somente em preço nunca preenchido, preservando preços próprios, inclusive zero, preços já incorporados e campos limpos pelo usuário. A ausência de referência mantém o preço não informado e permite informar um preço próprio. O usuário pode alterar o preço incorporado ou usar a ação existente de buscar/copiar a referência vigente. Alterações posteriores na Administração não atualizam automaticamente preços já incorporados aos projetos.

Exibir no Orçamento a descrição do produto e embalagem associados à referência. Ao incorporar automaticamente ou copiar manualmente a referência, capturar sua descrição junto ao preço no projeto; mudanças administrativas posteriores não podem alterar a descrição associada a um preço já incorporado. Mostrar essa descrição no PDF com base no projeto capturado. Se o usuário substituir o preço por um preço próprio ou limpar o campo, retirar a identificação de produto de referência associada àquele valor, sem impedir a edição nem exigir catálogo ou descrição de produto próprio. Preço e rendimento precisam corresponder à mesma embalagem do produto escolhido; orientar o usuário a conferir e ajustar o preço de referência e o rendimento conforme sua compra. A referência não comprova adequação do produto nem determina seu rendimento.

Edições do usuário alteram somente o preço do projeto, sem contribuir automaticamente para o cadastro administrativo destes dois produtos. Reutilizar identidades fixas e os mecanismos compartilhados de consulta, escrita, origem e limpeza de preços, preservando somente leitura, histórico, recuperação e estabilidade visual durante a consulta. O PDF continua usando os valores efetivos do projeto, sem consultar referências.

### Persistência e compatibilidade

Persistir somente os parâmetros dos dois produtos por projeto, seguindo histórico, salvamento em segundo plano, recuperação de falha e somente leitura existentes, sem recálculo da composição por edição exclusivamente orçamentária. Áreas, compra, custos, rateios e filtros são projeções, sem persistência de totais.

Preservar os parâmetros, as descrições capturadas das referências e os estados de origem/limpeza dos preços em reabertura, cópia de projeto, transporte `.ecovit` e desfazer/refazer. Projetos legados abrem com aplicação de 0%, rendimento e preço ausentes, sem mutação automática apenas pela leitura; a incorporação de referência ao abrir o Orçamento editável segue a operação explícita de orçamento da T-039, sem ativar aplicação ou inventar rendimento. Cliente e API devem validar os mesmos limites e distinguir preço zero de ausência. Introduzir obrigatoriamente a próxima versão livre do envelope e adaptar os leitores conforme o contrato vigente para os novos parâmetros, descrições de referência capturadas e identidades de origem/limpeza de preços; leitores incompatíveis devem recusar dados novos antes de substituir o trabalho aberto. Não alterar convenção da composição ou criar migração SQL sem necessidade concreta.

Na implementação, atualizar as regras nos documentos responsáveis: área e fórmulas no Caderno Técnico; parâmetros, disponibilidade e integração em Quantitativos; apresentação em Interface e Iconografia; transporte/compatibilidade em Persistência; abrangência do orçamento no PRD. Preservar os IDs e aceites anteriores.

Referências: [PRD — Orçamento](../Ecovit-PRD.md), [Caderno Técnico — T-035](../Ecovit-Caderno-Tecnico.md#t-035--convenção-nominal-de-área-e-consumo-de-assentamento), [Quantitativos](../arquitetura/Quantitativos.md), [Interface e Iconografia](../arquitetura/Interface-e-Iconografia.md), [Persistência e Compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md) e [Estado, Histórico e Operações](../arquitetura/Estado-Historico-e-Operacoes.md).

## Critérios de aceite

- [ ] **A01** — A área-base corresponde às duas faces das paredes, descontando os vãos conforme a convenção existente, sem alterar o assentamento. Em 100 m² líquidos de paredes, a base é 200 m²; aplicação de 50% resulta em 100 m² e de 45% em 90 m². A interface informa que o percentual é uma estimativa, sem identificação automática de paredes externas.
- [ ] **A02** — Os dois produtos têm percentuais, rendimentos e preços independentes, sem catálogo de marcas ou variantes. Admitir impermeabilizante a 50% e rejunte a 45%, bem como ambos a 100%, sem exigir soma de 100%. Rendimento é informado em m² por embalagem para o tratamento completo, sem instalação ou demãos adicionais automáticas. Preço pode ser incorporado da Administração e permanece editável pelo usuário.
- [ ] **A03** — Com área-base de 200 m²: impermeabilizante a 50%, rendimento de 30 m²/embalagem e preço de R$ 150,00 exige 4 embalagens e custa R$ 600,00; rejunte a 45%, rendimento de 20 m²/embalagem e preço de R$ 80,00 exige 5 embalagens e custa R$ 400,00. Os novos materiais acrescentam R$ 1.000,00 ao total geral.
- [ ] **A04** — Compra global arredonda uma vez por produto. Em dois pavimentos com 10 m² e 20 m² de aplicação de impermeabilizante, rendimento de 30 m²/embalagem e preço de R$ 150,00, comprar uma embalagem por R$ 150,00; ratear R$ 50,00 e R$ 100,00. Arredondar por pavimento compraria incorretamente duas embalagens; não usar essa soma. Rateios fracionários conciliam exatamente em centavos pela regra existente.
- [ ] **A05** — Aplicação confirmada de 0% dispensa rendimento/preço e produz custo zero mesmo com área-base indisponível. Com percentual positivo, área válida zero produz custo zero, mas área indisponível mantém os derivados indisponíveis, sem mostrar zero ou revisão anterior como atual. Com área positiva, ausências, entradas inválidas e limites numéricos mantêm a informação conhecida e impedem somente derivados dependentes. Preço zero é aceito; rendimento zero, negativo ou aplicação fora de 0–100% não é confirmado. Preservar a distinção entre indisponibilidade e parcialidade da base existente.
- [ ] **A06** — Resumo, total geral, filtro/detalhamento e PDF incluem os dois novos materiais de forma coerente. Filtrar ou recolher o detalhamento não altera áreas globais, compra ou custos; o PDF inclui todos os pavimentos. Preservar os grupos existentes, a consulta de preços de referência e a estabilidade do status.
- [ ] **A07** — Parâmetros persistem em reabertura, cópia, arquivo e histórico; edição não recalcula a composição. Somente leitura, salvamento e recuperação seguem os fluxos existentes. Legados permanecem utilizáveis com aplicação inicial de 0%; a nova versão obrigatória do envelope e a validação cliente/API preservam parâmetros, descrições capturadas e estados de origem/limpeza dos preços, recusando dados incompatíveis sem perda silenciosa.
- [ ] **A08** — Administração permite cadastrar, alterar e limpar as duas referências em R$/embalagem. O Orçamento incorpora somente preços nunca preenchidos, permite edição própria e uso manual da referência vigente, preserva zero e limpeza intencional e não propaga mudanças administrativas automaticamente a preços já incorporados. Edição no projeto não altera o cadastro global; origem e limpeza acompanham histórico, cópia e arquivo. Percentual/rendimento não são preenchidos pela referência, e a interface orienta a correspondência entre preço e rendimento da mesma embalagem. Consulta preserva valores exibidos e espaço do status; somente leitura e PDF não incorporam referências.

- [ ] **A09** — Cada referência com preço cadastrado identifica produto e embalagem por descrição curta na Administração e no Orçamento. Incorporação automática e cópia manual capturam preço e descrição coerentes no projeto, preservados em histórico, cópia, arquivo e PDF; mudança administrativa não renomeia referência já incorporada. Preço próprio ou limpeza retira a identificação associada à referência anterior. Cadastro/alteração mantém preço e descrição consistentes inclusive em conflito, repetição ou falha, sem criar catálogo de variantes.

Escolher a conferência proporcional conforme [Qualidade e Desempenho](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração), respeitando as instruções do solicitante para a execução. Esta especificação não impõe homologação ampla.

## Resultado

Task criada com área-base de duas faces descontando vãos e parâmetros de percentual, rendimento por embalagem e preço por embalagem confirmados pelo solicitante para ambos os produtos. Escopo atualizado a pedido do solicitante para incluir referências administrativas dos dois preços, reutilizadas e editáveis no Orçamento conforme a T-039. Revisão aprovada pelo solicitante acrescenta descrição curta do produto e embalagem de referência, distingue aplicação zero de área indisponível, exige nova versão do envelope e corrige o exemplo de compra consolidada para diferenciar o arredondamento por pavimento. Implementação e aceite manual pendentes. Nenhuma alteração funcional ou teste realizado na criação ou atualização desta task.
