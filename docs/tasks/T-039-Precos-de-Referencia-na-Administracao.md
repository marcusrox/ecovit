# T-039 — Preços de referência na Administração

**Tipo** — Implementação

**Resumo** — Adiciona preços de referência na Administração para preencher valores ausentes nos projetos, preservando preços próprios e formando o cadastro de esquadrias a partir das combinações utilizadas pelos usuários.

**Execução** — Verificada

**Data de execução** — 2026-11-25

**Aceite manual** — Pendente

## Alteração e limites

Acrescentar a aba Preços à Administração existente da T-031. O administrador informa e mantém preços de referência comuns ao aplicativo para tijolos, ferragens, materiais de assentamento e esquadrias. Esses valores servem ao preenchimento inicial de preços ausentes nos orçamentos; não constituem atualização automática dos custos dos projetos.

Referências: [PRD — RF-11 e RF-23](../Ecovit-PRD.md), [Quantitativos](../arquitetura/Quantitativos.md), [Autenticação e acesso — Administração](../arquitetura/Autenticacao-e-Acesso.md#administração--t-031), [Estado e histórico](../arquitetura/Estado-Historico-e-Operacoes.md), [Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md) e [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md). Na implementação, atualizar os contratos responsáveis pelo novo cadastro e pelo preenchimento, sem antecipar alterações funcionais nesta especificação.

### Materiais com catálogo existente

Apresentar os tipos de tijolo, categorias/bitolas de aço e produtos de assentamento já contemplados pelo Orçamento, reutilizando suas identidades, unidades e precisão. Preços são por unidade de tijolo, kg de aço e embalagem de assentamento, conforme os contratos vigentes. Não incluir rendimentos, perdas, percentuais, emendas ou outros parâmetros na manutenção de preços, nem criar novos materiais por esta aba.

Preço de referência pode estar ausente. Zero é um preço válido e difere de ausência. Conservar parsing decimal, centavos inteiros seguros e tratamento dos limites monetários existentes. Ausência não inventa preço nem transforma orçamento incompleto em completo.

### Preenchimento e prioridade no projeto

- Ao abrir o Orçamento em modo editável, consultar as referências e incorporar somente preços elegíveis de projetos novos ou existentes. A elegibilidade é por item/combinação, sem substituir o conjunto inteiro de preços de um projeto parcialmente preenchido. Não incorporar apenas por abrir o projeto no editor ou exportar um relatório.
- Um preço já informado pelo usuário no projeto sempre prevalece sobre a referência administrativa, inclusive zero. Isso vale igualmente para tijolos, ferragens, assentamento e esquadrias; não identificar ausência por teste de valor verdadeiro/falso.
- Ao receber uma referência, o projeto conserva o valor recebido. Alterações posteriores da Administração atendem futuras incorporações e não atualizam valores já incorporados, mesmo quando o usuário nunca os editou. Não manter consulta dinâmica à tabela administrativa como fonte do preço de um orçamento já preenchido.
- O usuário continua podendo alterar preços pelo Orçamento existente. O novo valor vale naquele projeto e não modifica preços de outros projetos nem uma referência já cadastrada. A edição não passa a acompanhar futuras mudanças administrativas.
- Incorporar referências como dados orçamentários do projeto, sem persistir totais, modificar fórmulas ou recalcular o motor construtivo. Valores incorporados e posteriores alterações devem conservar sua estabilidade ao salvar, reabrir, copiar, transportar arquivo e exportar o relatório da T-038.
- Reunir os valores incorporados nessa abertura em uma única operação orçamentária, com histórico e salvamento pelo fluxo existente, sem recalcular a geometria. A incorporação é uma alteração explícita desse fluxo, distinta da consulta/exportação sem alteração. Sem valores novos a incorporar, não criar operação nem gravar repetidamente ao consultar ou reabrir um projeto já preenchido.
- Se não houver referência para um item elegível, mantê-lo sem preço e voltar a consultar nas próximas aberturas do Orçamento. Itens/combinações novos no projeto seguem a mesma regra na próxima abertura, sem modificar preços de itens já preenchidos.
- Em somente leitura, apresentar os preços já existentes no projeto, sem incorporar referências novas. A ação manual de usar referência também não altera projetos em somente leitura.
- Falha no salvamento da incorporação mantém o candidato em memória e a indicação de Não salvo, com a recuperação existente. Não anunciar os valores como salvos nem misturar novas incorporações à operação pendente de recuperação.

### Limpeza explícita e uso manual de referência

Distinguir persistentemente os estados abaixo por item/combinação. A representação técnica deve ser definida nos contratos responsáveis durante a implementação; não deduzir limpeza explícita somente pela ausência de um número.

| Estado do campo | Comportamento |
|---|---|
| Nunca preenchido | Elegível à incorporação automática ao abrir o Orçamento |
| Referência já incorporada | Conservar o valor recebido, sem acompanhar atualizações administrativas |
| Preço informado pelo usuário, inclusive zero | Conservar o valor próprio |
| Limpo explicitamente pelo usuário | Permanecer sem preço, sem preenchimento automático nas próximas aberturas |

Limpar um preço é uma decisão confirmada do usuário: remover o valor efetivo, conservar a identificação de limpeza explícita e apresentar os custos dependentes como incompletos quando o item exigir preço. Não restaurar a referência automaticamente ao sair do campo, reabrir o Orçamento ou atualizar a tabela administrativa. Valores de projetos anteriores sem essa distinção devem preservar todo preço existente como próprio, inclusive zero; ausência sem registro de limpeza permanece elegível.

Oferecer a ação Usar preço de referência junto de cada campo de preço nos quatro grupos, inclusive esquadrias. Na tabela, apresentar somente um ícone discreto em botão, sem texto visível permanente, com hint/dica Usar preço de referência por hover e foco. Usar o componente e catálogo centrais de ícones; a discrição visual não reduz contraste, área de interação ou foco. O botão deve ter nome acessível em português que identifique a ação e o item, com acionamento por teclado.

A ação consulta a referência vigente para aquele item/combinação e copia o valor somente para o campo escolhido, substituindo seu preço atual quando houver ou preenchendo um campo limpo. É uma escolha explícita que permite abandonar o preço próprio/estado de limpeza; o valor copiado volta ao estado de referência incorporada e continua fixo diante de futuras atualizações administrativas. Confirmar pelo fluxo orçamentário de histórico, salvamento e recuperação, sem recalcular a geometria nem alterar a referência comum. Se o valor e o estado já forem equivalentes, não criar operação redundante.

Sem referência disponível ou identidade elegível, indicar a indisponibilidade e impedir substituição; não apagar o valor existente, aplicar zero ou inventar referência. Preservar os bloqueios de processamento, salvamento e somente leitura. Salvar/reabrir, copiar projeto, transportar arquivo e desfazer/refazer devem conservar tanto o valor quanto os estados de elegibilidade/limpeza. O PDF consome o preço efetivo confirmado em memória; não consulta referências para preencher lacunas durante a exportação.

### Cadastro de esquadrias por uso real

Não enumerar previamente combinações possíveis de esquadrias. A aba recebe uma combinação inédita quando um usuário informa e confirma um preço para uma esquadria realmente presente em seu projeto. Reutilizar a identidade da T-036: porta/janela, tipo de aparência, largura/altura confirmadas do vão bruto e material, incluindo a normalização vigente de Outro. Orientação, posição ou pavimento não criam outra referência.

O primeiro preço confirmado para uma combinação ainda sem referência inicia seu cadastro. Depois, administradores podem editar essa referência; preços posteriores dos usuários para a mesma combinação permanecem próprios de seus projetos e não sobrescrevem a tabela comum. Duas contribuições concorrentes não podem criar referências duplicadas nem substituir uma referência já estabelecida. Rascunho inválido, edição cancelada ou gravação recusada não contribuem com um preço como se estivesse confirmado.

Combinação genérica ou incompleta sem identidade elegível para preço segue as restrições da T-036. Vão livre não entra. Não criar esquadrias nunca usadas em projetos, criar ocorrências no desenho ou transformar o cadastro em catálogo de fabricação. A manutenção administrativa atua nas combinações recebidas por uso real, sem inclusão manual de combinações fictícias.

### Acesso, integridade e apresentação

Integrar a aba à Administração existente, com identificação dos grupos, unidades e campos de preço. Preservar autenticação, autorização administrativa no servidor, validação, proteção das mutações e auditoria de alterações administrativas conforme os contratos existentes. Conta comum não pode consultar ou alterar a manutenção administrativa por chamada direta; consumo das referências e contribuição de esquadria inédita seguem apenas os fluxos autorizados do orçamento.

O cadastro comum contém somente a identificação comercial necessária e o preço de referência, sem expor nomes de usuários, projetos, desenhos ou documentos de terceiros. Falhas de leitura/gravação devem ser informadas sem apagar preços próprios ou apresentar valores antigos como confirmação de nova alteração. Não introduzir serviço externo de preços, atualização de mercado, importação em massa ou novas regras de orçamento nesta task.

## Critérios de aceite

- [x] **A01** — A Administração oferece a aba Preços com os grupos e unidades existentes de tijolos, ferragens e assentamento; administradores podem informar/alterar referências com confirmação ao sair do campo ou por Enter, distinguindo preço ausente, zero e entrada inválida, sem botão de salvamento por item, alteração de parâmetros ou criação de materiais novos.
- [x] **A02** — Ao abrir o Orçamento editável, projetos novos e existentes recebem referências somente nos itens elegíveis, reunidas em uma única operação orçamentária sem recálculo. Preços próprios já informados, inclusive zero, permanecem intactos nos quatro grupos. Referência ausente mantém o campo elegível sem preço para nova consulta em abertura posterior; itens novos seguem essa regra. Abertura sem incorporações não grava.
- [x] **A03** — Após incorporação, o valor do projeto permanece estável diante de mudanças administrativas. Alterações feitas pelo usuário prevalecem somente naquele projeto; salvar/reabrir, copiar, arquivo e PDF mantêm os preços efetivos, sem atualização retroativa ou cálculo paralelo.
- [x] **A04** — Uma esquadria inédita realmente presente, com identidade elegível e primeiro preço confirmado, alimenta a aba Preços. Combinações nunca utilizadas, vãos livres, configurações incompletas, rascunhos e confirmações recusadas não criam referências válidas.
- [x] **A05** — A mesma combinação de esquadria não duplica por orientação, posição, pavimento ou concorrência. Após o cadastro inicial, preços posteriores dos usuários não substituem sua referência; alteração administrativa afeta apenas futuras incorporações, preservando projetos já preenchidos.
- [x] **A06** — Incorporação, consulta, edição e exportação respeitam persistência, histórico e recuperação de falhas, sem gravação repetida, perda de preço próprio ou recálculo construtivo. Somente leitura apresenta os preços existentes sem incorporação automática/manual; falha de salvamento conserva candidato e indicação de Não salvo. Exportar não incorpora referências.
- [x] **A07** — A manutenção é protegida no servidor e alterações administrativas são auditadas. Referências não expõem conteúdo ou identificação de projetos/usuários de origem. Falhas e valores inválidos mantêm os dados íntegros e permitem correção/nova tentativa.
- [x] **A08** — Limpeza explícita mantém o campo sem preço e os custos dependentes incompletos quando aplicável, sem restauração automática nas próximas aberturas. Nunca preenchido, referência incorporada, preço próprio e limpeza explícita permanecem distintos ao salvar/reabrir, copiar, transportar arquivo e desfazer/refazer; preços legados existentes, inclusive zero, são preservados.
- [x] **A09** — Cada campo de preço oferece Usar preço de referência como ícone discreto na tabela, com dica por hover/foco, nome acessível por item e operação por teclado. A ação copia a referência vigente somente para o campo escolhido, inclusive após limpeza, salva pelo fluxo existente e não cria vínculo de atualização futura. Ausência de referência/identidade elegível e bloqueios existentes impedem alteração sem apagar o valor atual.

- [x] **A10** — Todas as abas da Administração usam controles e tabelas compactos; a visão geral tem indicadores menores com cores discretas. Preços apresenta dois materiais por linha em telas grandes e um em telas menores, com validação discreta sem alterar as dimensões dos campos/linhas. Navegação por Tab preserva foco e rascunhos durante salvamentos em sequência; falha permite repetir o mesmo pedido e retomar alterações seguintes sem perda de valores.

## Resultado

Task criada a pedido do solicitante em 2026-11-25, sem implementação. Confirmado que valores recebidos como referência não acompanham atualizações da Administração e que preços digitados pelo usuário sempre prevalecem, inclusive para esquadrias. Registrado o cadastro inicial de esquadrias pelo primeiro preço confirmado de combinação inédita utilizada, com manutenção posterior pelo administrador e sem sobrescrita por outros preços de projetos.

No registro inicial, momento de incorporação/persistência e comportamento ao limpar um preço aguardavam detalhamento, definido no refinamento abaixo. Conferência documental de escopo, referências e diff; sem execução de testes do aplicativo. A criação desta task não autoriza implementação, commit, push ou publicação.

Refinamento aprovado pelo solicitante em 2026-11-25: incorporar referências ao abrir o Orçamento editável, em uma única operação orçamentária sem recálculo; consultar novamente apenas itens ainda elegíveis e sem referência disponível. Fixadas ausência de incorporação em somente leitura, recuperação de falha e preservação de limpeza explícita. Acrescentada ação manual por campo para copiar a referência vigente, apresentada na tabela somente como ícone discreto com hint, nome acessível e suporte a teclado. A02/A06 atualizados e A08/A09 acrescentados, preservando os IDs anteriores. Implementação, verificação técnica e aceite manual permanecem pendentes; autorizada somente atualização documental, sem implementação, commit, push ou publicação.

### Implementação e verificação técnica — 2026-11-25

Implementação autorizada pelo solicitante nesta data, sem commit ou push. A01–A09 verificados nos recortes pertinentes abaixo; aceite manual permanece pendente. As checagens gerais com impedimentos locais são registradas separadamente e não foram declaradas aprovadas. Não houve publicação nem acesso ao banco de produção.

- **A01/A07** — Aba Preços integrada à Administração, com os 15 itens fixos e esquadrias observadas paginadas. Preços ausentes/zero, validação associada ao campo, salvamento, atualização e repetição de pedido preservam os valores. API protege sessão/escopo/origem/CSRF e privilégio, revalida autorização na transação e registra auditoria `price` com valor anterior esperado e idempotência. Sem manutenção por conta comum ou inclusão manual de esquadria fictícia; nenhum identificador de projeto/contribuinte no cadastro comum.
- **A02/A03/A06** — Abertura editável consulta as identidades necessárias e incorpora somente campos elegíveis em uma operação `budget`. Preço próprio, inclusive zero, e referências incorporadas permanecem fixos. Ausência sem referência continua elegível; somente leitura não incorpora. Consulta descartada após fechar/trocar projeto e revalidação do documento corrente evitam confirmação tardia indevida. Falhas de consulta não alteram intenção; falha ao salvar conserva candidato e Não salvo/recuperação. PDF continua lendo os preços efetivos, sem buscar referências.
- **A04/A05** — Primeira alteração confirmada de preço próprio de esquadria presente alimenta a referência na mesma transação de salvamento, com chave normalizada única, ordem estável de inserção e sem sobrescrita em conflito. API verificou duas contribuições concorrentes, preço posterior próprio, alteração administrativa e gravação inválida sem alterar a referência ou revisão válida. Criação/importação sem digitação de preço no orçamento não contribui; não há varredura retroativa de projetos.
- **A08/A09** — Escritor comum para os quatro grupos preserva estados próprio/referência/limpo; ausência de metadado e valor é nunca preenchido. Limpeza explícita não reaplica referência em outra abertura. Ação por campo consulta o valor vigente, copia somente o escolhido e conserva a estabilidade futura. Ícone central compacto ao lado do input, hint por hover/foco e nome acessível por item; acionamento por teclado aprovado. Layout do Orçamento e da Administração inspecionado em 900 × 680. Histórico/undo/redo e arquivo conservam origem/limpeza sem motor; cópia e transporte usam os mesmos campos estritos.

Formato de projeto elevado para 34, com normalização de 9–33 sem estados/preços inventados e recusa de metadados novos em envelope anterior. Referências em `server/migrations/003-price-references.sql`, com DML para a role de execução e sem alterar migrações entregues. Leitor compartilhado valida identidade, duplicação e coerência entre origem e preço. Novos estados ficam fora dos insumos construtivos. PRD e contratos de Quantitativos, Persistência, Estado, Autenticação e Interface atualizados; sem biblioteca/serviço novo. Catálogo comum também passou a ser limpo por cenário no ambiente de navegador, pois o isolamento por conta não basta para esse dado global.

#### Verificação pertinente

Escopo ampliado pela evolução do leitor compartilhado, migração SQL, autorização e confirmação de preços nos quatro grupos; navegador somente no Chrome, sem matriz ampla.

- **Unitários:** suíte geral inicial com 781 casos: 735 aprovados, 31 ignorados pela configuração existente e 15 falhas, em 138,26 s. Dez falhas eram expectativas de versão futura/listagem legada ainda fixadas em 33/34, ajustadas para saída 34 e recusa de 35, preservando as asserções. Rechecagem dos 11 arquivos afetados incluiu o novo cenário de origem/histórico: 150 aprovados e um timeout de 5 s em cenário geométrico de grampos preservado, já aprovado na rodada inicial; aproveitada essa evidência anterior, sem mudar motor ou timeout. Recorte final de referências/estado: nove testes aprovados em 3,32 s. Resultado consolidado por casos distintos, incluindo o novo teste de histórico: **750 aprovados, 31 ignorados e uma checagem geral não aprovada**, sem somar reexecuções.
- **API:** dois cenários T-039 aprovados em 6,15 s incluindo preparo; 34 demais casos não selecionados pelo filtro. **Migrações:** 13 testes mantidos aprovados em 4,61 s, com schema descartável, preservação de dados/histórico, reexecução e rollback. Usado somente ecovit_test.
- **Chrome:** três cenários novos distintos aprovados: incorporação/zero/limpeza/teclado/arquivo; Administração/esquadria real/auditoria/validação; somente leitura e falhas de consulta/gravação. Caso de incorporação/alinhamento aprovado em 18,6 s; os dois últimos revalidados juntos em 51,3 s com preparo após corrigir seletores de status/cartão e aguardar a resposta real da importação. Quatro regressões existentes aprovadas, uma por grupo (T-024/T-028/T-035/T-036), em 1,8 min com preparo. Total: **sete cenários distintos**, sem somar repetições. Nenhum timeout foi ampliado.
- **Build/diff:** build com typecheck aprovado (Vite 43,23 s), preservando avisos de chunk principal e anotações da dependência Zod. Lint dos arquivos alterados e conferência do diff aprovados.

#### Ressalvas das checagens gerais

A suíte unitária completa não foi declarada aprovada: `tests/e2e-selection.test.ts`, caso de descoberta/classificação de todos os cenários, excedeu 5 s na rodada inicial e na única reexecução autorizada pelo limite ambiental. A tentativa em sequência fora do sandbox corrigiu os dois testes de Bash bloqueados por NtCreateDirectoryObject/EACCES e os dois testes de histórico de versão, mas a descoberta permaneceu em timeout. Não houve nova repetição, mudança de timeout, redução de asserções ou infraestrutura de contorno. A classificação dos sete cenários efetivamente executados e os novos rótulos de finalidade foram conferidos no recorte; a checagem geral permanece pendente.

`npm run lint` sobre toda a pasta encontrou `no-unsafe-finally` em `.data/check-dev-watch.mjs`, arquivo local ignorado pelo Git e fora desta alteração. Não foi modificado nem incluído em exceções; lint de todos os arquivos alterados aprovou. Esses impedimentos gerais não foram convertidos em aceite dos aspectos impedidos e ficam separados da evidência funcional A01–A09 acima.

Logs e capturas ignorados pelo Git em `.tools/t039/`: `unit-all.log`, `unit-recheck.log`, `unit-final.log`, `environment-tests.log`, `api.log`, `migrations.log`, `browser-final.log`, `browser-recheck.log`, `browser-regression.log`, `build-final.log`, `lint-final.log`, `lint-changed.log`, `diff-final.log`, `budget-prices.png` e `admin-prices.png`. Servidores de teste próprios na 5174/3002; porta 5173 preservada. Commit, push, publicação e aceite manual permanecem sem autorização/confirmação.

### Refinamento da Administração — 2026-11-25

Solicitante pediu compactação das tabelas/formulários de todas as abas, indicadores menores e com cores discretas, remoção dos botões de salvar preço, confirmação ao sair do campo, validação discreta sem deslocamento e dois materiais por linha em telas grandes. A01 atualizado e A10 acrescentado; aceites anteriores preservados e aceite manual desta revisão permanece pendente.

Implementado no aplicativo: cabeçalho, navegação, filtros, tabelas, confirmações e controles mais compactos em `Admin.module.css`; métricas menores sem sombras, com tons suaves em verde, azul e areia. Grade de preços com duas colunas a partir de 1100 px e uma abaixo; validação em dica absoluta por hover/foco com descrição acessível e marcação do campo, sem impacto nas dimensões. Status de gravação ocupa espaço reservado. Aba ativa mantém destaque durante hover.

`AdminPrices.tsx` confirma no blur/Enter e não tem botão de salvar por item. Atualização do item confirmado ocorre em memória sem recarregar/remontar a lista, preservando foco por Tab. Envios seguem em sequência; valores mais novos em rascunho não são apagados pela resposta anterior. Falha mantém o identificador/conteúdo do pedido e as alterações seguintes aguardando repetição, com ação global de nova tentativa. Atualizar/paginar após editar aguarda a confirmação válida antes de trocar a consulta. Nenhuma mudança nos endpoints, autorização, auditoria, banco, formato 34 ou regras de incorporação/preços dos projetos.

Validação proporcional pelo efeito no layout/foco e na confirmação dos campos: **três cenários distintos no Chrome aprovados em 1,1 min com preparo**, usando servidor próprio na 5174 e dados isolados. Cenário administrativo existente percorreu Visão geral/Usuários/Operação/Auditoria, inclusive intervenção e auditoria; caso de preços verificou salvamento ao sair do campo, ausência do botão por item, duas colunas em 1440 px/uma em 900 px, dimensões estáveis com erro e preservação do foco seguinte. Novo cenário verificou dois campos percorridos por Tab com resposta retida, falha do segundo envio, rascunho de valor zero durante a falha e repetição idêntica seguida da retomada da fila, conferindo os três valores salvos. Typecheck e lint do recorte aprovados; diff sem erros. Inspeção visual de visão geral, preços e validação em capturas reais do aplicativo. Ajuste local da precedência de hover da aba ativa conferido por inspeção CSS.

Evidências em `.tools/admin-compact/`: `browser.log`, `types.log`, `lint-final.log`, `diff.log`, `overview-wide.png`, `overview-narrow.png`, `prices-wide.png` e `prices-invalid-wide.png`; captura estreita de preços também em `.tools/t039/admin-prices.png`. Reutilizada a evidência anterior de API/migração/compatibilidade, preservadas por esta revisão. Sem repetição de build, suítes amplas ou diagnóstico dos impedimentos gerais já registrados acima. Porta 5173 preservada. Sem commit, push ou publicação.

### Aprovação do refinamento — 2026-11-25

Solicitante aprovou o refinamento visual e de edição da Administração com a manifestação explícita: ‘Ficou bom’. Aceite manual desse refinamento confirmado; demais critérios funcionais conservam o registro anterior. Commit e push das alterações acumuladas de T-038, T-039 e documentação operacional autorizados nesta data.

