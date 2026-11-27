# Estado, histórico e operações

## Impermeabilização de bases e lajes — T-042

Percentuais em pavimento/laje e parâmetros dos produtos usam confirmação Enter/blur e operação `budget`, com prévia sem persistência, histórico, salvamento e recuperação vigentes. Não recalculam composição; o detector de insumos ignora `waterproofingPercent` nas lajes, assim como os parâmetros financeiros já excluídos dos pavimentos. Confirmar parte do documento corrente e preserva os demais campos/elementos; inválido continua rascunho. Renomear/reordenar conserva valores por identidade; cópia de pavimento replica o percentual de base e o da laje para os registros novos. Remover/desfazer/refazer restaura elemento e configuração juntos, sem registros financeiros órfãos. Produto/embalagem e origem das referências seguem T-040.

[Índice da arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [PRD](../Ecovit-PRD.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md)

## Incorporação e limpeza de preços — T-039

Abrir o Orçamento editável pode incorporar preços de referência nos campos nunca preenchidos em uma única operação `budget`; sem incorporações, a abertura continua sem escrita. Somente leitura e estado de salvamento/recuperação pendente não iniciam incorporação. Consulta assíncrona usa o documento corrente antes de confirmar, preserva preços próprios aceitos no intervalo e ignora resultado após fechamento/troca de projeto. Falha de consulta informa impedimento sem alterar intenção; falha de gravação conserva candidato, indicação Não salvo e recuperação existente.

Confirmação de campo escreve preço e origem juntos. Limpeza registra `cleared`, valor próprio registra `own`, cópia manual/automática de referência registra `reference`; origem ausente de legado é inferida pela presença do valor. Mudança de origem com preço numericamente igual é significativa; valor e origem equivalentes não geram operação. Desfazer/refazer restaura ambos, sem motor. Abertura seguinte só preenche novamente se o estado restaurado for nunca preenchido. Campos limpos não voltam a ser elegíveis automaticamente. Ação manual por campo usa referência vigente sem atualização futura, respeitando os mesmos bloqueios e a recuperação. Fórmulas, identidades e projeções seguem Quantitativos; serialização estrita segue Persistência.

## Exportação do orçamento — T-038

Gerar/baixar o relatório é leitura da revisão em memória capturada no início, sem commit, recálculo, histórico, gravação ou mudança de câmera/pavimento/filtro. Aguardar apenas as confirmações locais já disparadas pelos eventos normais dos campos, inclusive blur, antes de capturar documento e situação de salvamento juntos; não confirmar outros rascunhos automaticamente. Entradas inválidas ou ainda em rascunho exigem correção ou desfazimento. Processamento que altera dados impede iniciar; o envio remoto de uma revisão já confirmada em memória não bloqueia a geração e não é aguardado. Somente leitura permanece habilitada; revisão não salva é identificada como tal. Captura não acompanha edições posteriores. Fechar a consulta/desmontar cancela o trabalho; falha mantém o projeto e permite nova tentativa. Disponibilidade e parcialidade dos grupos seguem [Quantitativos](Quantitativos.md#relatório-de-orçamento-em-pdf--t-038).

## Orçamento de assentamento — T-035

`project.settlement` é intenção orçamentária global excluída dos insumos construtivos, como os preços existentes. Campos individuais válidos confirmam por Enter/perda de foco com operação `budget`, inclusive percentuais cuja soma esteja incompleta. Prévia inválida não confirma; valores equivalentes aos padrões ausentes não criam operação. Consultar, filtrar e derivar áreas/custos não salva nem cria histórico. Confirmação parte do documento local mais recente e altera somente o campo correspondente, preservando outras edições aceitas.

Alteração exclusiva de percentuais, rendimentos ou preços preserva composição e diagnósticos (atuais ou desatualizados), sem motor. Desfazer/refazer restaura parâmetros e ausência, sujeito aos bloqueios vigentes. Salvamento em segundo plano usa o fluxo compartilhado da T-032; falha conserva intenção local para download, repetição ou descarte explícito. Somente leitura bloqueia campos. Cópia de projeto e transporte preservam parâmetros; não há configuração independente por pavimento.

## Material e preços de esquadrias — T-036

Material de porta/janela é excluído dos insumos construtivos por `constructionOpenings`, assim como aparência. Material e `project.openingPrices` usam operação `budget`, histórico e salvamento em segundo plano, preservando composição/diagnósticos atuais ou desatualizados. Confirmação parte do documento local vigente e altera somente o campo correspondente. Preços confirmam por Enter/perda de foco, com prévia sem persistência; inválido não mostra custo anterior como atual. Falha conserva candidato para download/repetição/descarte; readonly e busy bloqueiam edição. Desfazer/refazer, cópias e transporte preservam material e preços retidos.

Predefinidos confirmam pela seleção, sem materialização de ausência equivalente. Outro mantém material/descrição em rascunho e confirma ambos válidos por Enter/perda de foco. Cancelar, Escape ou trocar elemento prevalece sobre blur, descarta rascunho inclusive válido e não gera gravação intermediária. Criação pendente conserva material no rascunho até confirmar a ocorrência. Alterar tipo/tamanho/material passa a outra chave orçamentária: usar preço da combinação de destino ou ausência, sem transferência da origem. Remover última ocorrência oculta a linha, conservando preço apenas no projeto para reinserção; limpar preço remove somente aquela chave.

## M12 — estados remotos

Esta seção rege os projetos remotos. Protocolo/armazenamento em [Persistência e compatibilidade](Persistencia-e-Compatibilidade.md#m12--persistência-remota); identidade em [Autenticação e acesso](Autenticacao-e-Acesso.md).

Manter eixos independentes: autenticação (verificando/autenticado/ausente/expirado), persistência (carregando/salvo/salvando/incerto/falhou/conflito/indisponível), cálculo (atual/desatualizado/calculando/falhou) e gesto. Não usar current/outdated como estado de rede. Operação carrega conta, projeto, revisão esperada e operationId; resposta só é aplicada à sessão que a iniciou, sem atualizar outro documento após troca de contexto.

Projetos remotos não dependem de Web Lock ou IndexedDB. Duas abas/dispositivos podem abrir e preparar edição da mesma revisão; a transação do servidor arbitra a gravação e o perdedor recebe conflito. Tamanho/ordem do histórico continuam da sessão; câmera e preferências continuam fora da revisão remota.

Fluxo único: candidato validado e uma operação no histórico; para insumos construtivos, invalidar resultado e reter visual de grautes quando aplicável; enviar novos recursos e intenção, sem resultado; aguardar confirmação remota antes de iniciar o cálculo. Uma confirmação de intenção permite calcular localmente sem segunda gravação remota. Edição não construtiva preserva resultado em memória e grava somente intenção. Estado Salvo representa intenção confirmada, sem afirmar sucesso do motor. Abertura remota recompõe em memória e não gera gravação/histórico só por calcular.

Um único fluxo de persistência/repetição/recuperação atende edição normal, renomeação, undo e redo. A origem da alteração só define o candidato e o efeito nas pilhas, sem protocolos de rede distintos. operationId e requestIssuedAt são capturados com o pedido; não há preparação de operação em chamada separada. Upload acontece antes do save somente se houver bytes novos. Estados abaixo são os estados necessários da interface, não uma biblioteca genérica de máquinas de estado.

Uma tentativa incerta continua incerta se a repetição receber 401, 429 ou outra recusa que não esclareça o efeito original. Só confirmação válida ou conciliação explícita resolve essa dúvida. Após qualquer reenvio de pedido já enviado, conferir também a revisão/estado atual antes de liberar edição, mesmo quando a consulta de recibo retornou 404 e o POST posterior devolveu um recibo antigo. Duplicação conserva nome, novo ID e operação enquanto houver dúvida; repetir não cria uma nova ação.

Lista de projetos e cotas têm estados carregando/disponível/indisponível. Falha de leitura conserva a última lista apenas como referência, bloqueia ações dependentes e oferece atualização; não apresenta lista vazia nem uso zero como resposta confirmada. Resposta de contexto anterior é ignorada. A disponibilidade da lista só controla ações da lista; não bloqueia preferências, seleção, recuperação, navegação ou download do documento já aberto e validado.

| Estado/evento | Memória e interface | Saída permitida |
|---|---|---|
| carregando | Preservar contexto anterior até validar; não aceitar edição no destino | Sucesso abre; erro retorna à lista e libera nova tentativa |
| salvando | Intenção local conservada; permitir edições não construtivas compatíveis em projeto já aberto; bloquear undo/redo, Recalcular manual e troca/fechamento. Alteração construtiva bloqueia novas mutações imediatamente | Confirmação avança somente o checkpoint enviado; iniciar cálculo quando exigido, após confirmar a intenção construtiva; erro passa a falhou/incerto |
| salvo | Revisão e momento confirmados; liberar edição após cálculo terminar | Próxima alteração parte dessa revisão |
| incerto | Timeout, interrupção, resposta ilegível ou 5xx após envio; mostrar confirmação pendente, sem afirmar rollback | Consultar/repetir mesma operação; download em memória após cessar o envio local |
| falhou | Rejeição conhecida ou indisponibilidade; candidato não salvo preservado | Tentar novamente quando aplicável; corrigir por retorno explícito ao último confirmado; baixar |
| sessão expirada | Suspender gravação sem limpar candidato/histórico | Reautenticar mesma conta e conciliar operação/revisão; outra conta não retoma candidato; se resposta do código se perdeu, consultar sessão ou solicitar novo código |
| conflito | Manter candidato e indicar versão remota mais recente; não oferecer sobrescrever forçado | Baixar candidato; abrir versão remota com descarte confirmado |
| acesso removido/projeto excluído | Bloquear mutações e não recriar remoto por retry | Baixar candidato ainda em memória; voltar após descarte explícito |
| falha do cálculo após save | Intenção já salva, resultado ausente/desatualizado; continuidade de grautes conforme contrato | Recalcular sem nova gravação ou baixar; não rotular como falha de salvamento |
| exclusão da conta incerta | Sessão pode já estar revogada; não anunciar exclusão cancelada ou login concluído | Consultar somente o recibo de exclusão com credencial específica, sem acesso aos projetos; conforme Autenticação |

Desconexão detectada em repouso, durante preparo/envio ou com intenção ainda não enviada suspende novos gestos/mutações e o próximo envio; evento online sozinho não comprova servidor disponível nem resolve operação pendente. Uma confirmação em voo pode avançar seu checkpoint, sem liberar edição ou retomar a sequência. Revalidação antes de retomar não sobrescreve a memória sem decisão. Sem fila offline, polling constante ou merge. Leitura/navegação/zoom e recuperação permanecem disponíveis, sem transformar edição bloqueada em somente leitura salva.

Falha conhecida de validação/cota não habilita acumular outras edições: oferecer baixar e restaurar o último confirmado com descarte explícito, para então corrigir um novo candidato. Novo operationId é usado para novo conteúdo, nunca para repetição do mesmo pedido. Descarte de operação incerta exige conciliação antes de tratar a revisão anterior como vigente. Cálculo não começa repetidamente ao consultar recibo; histórico e revisão não avançam duas vezes.

Manter checkpoint da última intenção confirmada para a revisão, com documento, recursos e pilhas capturados juntos antes da preparação do pedido que representa. Não capturar o histórico posterior pela chegada de uma resposta antiga, nem substituir intenção local, recursos, rascunhos ou inspeção mais recentes. A tentativa e o estado posterior continuam preservados quando há falha. Ao escolher descartar após rejeição conhecida, restaurar documento, recursos e pilhas juntos, sem enviar nova gravação e sem deixar o trabalho descartado reaparecer por refazer. Uma confirmação não duplica a operação de usuário, inclusive se obtida por consulta de recibo. Undo/redo que falha conserva candidato e posições de recuperação; descartar restaura as pilhas do checkpoint confirmado, não troca seu sentido duas vezes. Atualização do cálculo local pode atualizar o resultado associado ao checkpoint sem mudar revisão/histórico remoto.

Em conflito, não usar checkpoint antigo para reabrir edição sem conferir a revisão do servidor. Escolher abrir remoto substitui documento e recursos e inicia histórico vazio da revisão carregada, após confirmação de descarte do candidato local. Repetir uma operação incerta não exige que o candidato ainda seja editável; o pedido capturado permanece imutável até conciliar. Pedido fora da janela de 24 h sem recibo não é reenviado automaticamente: conferir revisão/estado e resolver descarte ou nova ação explícita, preservando download, sem pressupor que recibo ausente prova inexistência de efeito.

Fechar/trocar projeto, sair ou trocar conta com candidato não salvo exige escolha explícita: permanecer, baixar ou descartar. Baixar não prova arquivo gravado no dispositivo e não equivale a consentir descarte. Se houver pedido em voo, primeiro resolver sua situação ou informar que seu efeito pode se confirmar no servidor, sem permitir nova edição baseada em revisão antiga. Encerramento/reload do navegador pode perder memória; beforeunload é aviso de melhor esforço, sem garantia de recuperação. Não persistir automaticamente o candidato no IndexedDB como sincronização oculta.

Reautenticação por código usa diálogo na própria página editora, sem navegar/recarregar. Mesmo usuário: conferir recibo e revisão; não reenviar cegamente. Usuário diferente: bloquear candidato da conta anterior até recuperar/descartar, depois limpar caches privados antes de abrir novo contexto. Histórico permanece apenas na sessão da conta/projeto; undo/redo é nova gravação remota sobre a revisão atual, sem restaurar números de revisão antigos.

## Intenção, resultado e sessão

Zustand coordena intenção local, checkpoint confirmado, resultado gerado e estado transitório de interface. Componentes assinam os campos necessários. Cursor, câmera, seleção, pavimento/fiada ativos, rascunhos, comparação, diálogos e preferências de apresentação não duplicam o documento persistido. O domínio não depende de Zustand. Estado busy bloqueia abertura, alterações construtivas, cálculo e recuperação; saving acompanha preparo, envio e espera de salvamento, sem bloquear por si só a edição não construtiva.

### Salvamento em segundo plano — T-032

Usar a comparação real dos insumos abaixo para classificar commit e histórico, inclusive mudanças conjuntas. Em projeto remoto já aberto e validado, commit não construtivo conclui após validação e aceitação local; o retorno permite concluir o formulário, mas não comprova confirmação remota. Cada gesto mantém uma intenção nas pilhas, com limite vigente de 50, mesmo quando envios são consolidados. Resultado e diagnósticos são preservados, inclusive quando já desatualizados; recuperação desse pedido não chama o motor.

Preparação, upload, envio e intenção ainda não enviada bloqueiam botões e atalhos de Desfazer/Refazer e o botão/comando Recalcular manual, sem enfileirar ações nem liberar comandos entre envios. Sem pendências, desfazer continua cancelando prévia antes do histórico; com pendências, Escape cancela o gesto. Confirmação remota não cancela gesto posterior, reinicia formulário, troca seleção ou move câmera. Falha cancela somente prévias ainda não confirmadas.

Uma alteração construtiva validada usa a intenção local vigente, registra seu passo e ativa busy imediatamente. Seu snapshot pode incorporar o estado ainda não enviado. Após concluir o pedido anterior, confirmar a intenção construtiva pela revisão correta e só então recalcular o projeto inteiro. Falha anterior conserva também esse candidato, sem enviá-lo sobre revisão incerta. Necessidade de cálculo acompanha o candidato construtivo, não é inferida do resultado desatualizado em uma repetição não construtiva. Falha exclusiva do motor continua sendo intenção salva e libera os controles após terminar a tentativa.

Recuperação mantém busy/readonly até resolver o pedido original, confirmar todo o estado posterior e terminar eventual tentativa de cálculo construtivo. Não pular pedido rejeitado. Se a intenção construtiva já foi confirmada durante desconexão, conferir revisão e calcular sem nova gravação. Protocolo, cadência e captura imutável pertencem a Persistência e compatibilidade.

## Classificação de operações

Operações exclusivas de `model.texts` são não construtivas, inclusive histórico e transporte: excluir a coleção da comparação real de insumos e preservar resultado/diagnósticos atuais ou desatualizados. Criação, confirmação do conteúdo ao sair do campo, aplicação conjunta dos ajustes restantes, movimento, ajuste de largura por alça, duplicação e exclusão integram o mecanismo compartilhado da T-032. Cada confirmação efetiva gera um passo; Aplicar não repete conteúdo já confirmado. Não gravar por tecla, controle de aparência, seleção, prévia ou cancelamento. Uma resposta remota não restaura rascunho, seleção ou texto anterior.

O único rascunho de Texto fica na inspeção de sessão. Criação/cópia não confirmada ou campos diferentes do confirmado são pendência; abrir propriedades sem mudar valores não bloqueia gestos. Pendência impede movimento/alça/duplicação/exclusão da mesma anotação até aplicar/cancelar. Na edição existente, sair do conteúdo confirma somente esse campo sobre o registro vigente, preservando aparência pendente; sem outras diferenças, remover o rascunho para não consumir Desfazer apenas para limpá-lo. Na criação, sair do conteúdo exige o conjunto válido para confirmar a anotação. Aplicar parte do documento local vigente e altera somente o registro alvo, preservando outras edições; comandos de histórico respeitam pendências remotas antes de cancelar prévias ou viajar nas pilhas. Recolher painel, câmera e confirmações remotas preservam os demais rascunhos; seleção/ferramenta/pavimento/modo/projeto os descartam após a confirmação normal do conteúdo por perda de foco. Cancelar/Escape descartam somente o que ainda não foi confirmado; cancelar criação não cria registro nem passo de histórico. Cópias por pavimento recebem IDs próprios; remoção/histórico mantêm o conjunto coerente.

| Operação | Persistência e histórico | Composição |
|---|---|---|
| Mudança de insumos construtivos: base/configurações, geometria de pavimentos/paredes/vãos/lajes ou ajustes | Salvar intenção, registrar uma operação | Invalidar e recalcular o projeto inteiro |
| Renomeação; edição de preços unitários; edição exclusiva de medidas, referência raster, terreno ou mobiliários; aparência de esquadrias | Salvar e registrar uma operação quando houver mudança | Preservar resultado e diagnósticos, inclusive já desatualizados |
| Seleção, câmera, troca de pavimento/fiada, hover, prévia e consulta de orçamento/quantitativos sem editar preços | Não salvar nem registrar intenção | Não recalcular |
| Preferências globais de apresentação | Gravar somente no armazenamento de preferências | Não recalcular |

A comparação de insumos exclui terrain, measurements, referenceImages, imageElements, customImageAssets e opening.appearance; nomes dos pavimentos e project.unitPrices também são excluídos, mantendo id/level/defaultHeight/groutMode entre os insumos dos pavimentos. Mudança de altura padrão segue a comparação construtiva existente. Uma edição visual não promove resultado desatualizado a atual. Não classificar uma operação pela aparência do gesto; comparar os insumos reais antes/depois.

## Fluxo sequencial

Após confirmar e validar um candidato construtivo: registrar a intenção, marcar generated=null/status=outdated e limpar diagnósticos derivados; salvar intenção pelo mecanismo compartilhado, respeitando envio anterior e cadência; permitir a pintura do estado de processamento; gerar o projeto inteiro sincronamente; substituir o resultado completo somente em memória, sem segunda gravação. Aguardar a confirmação remota, sem Worker ou recálculo parcial. Erro de salvamento conserva memória/download e bloqueia mutações para recuperação; exceção do motor conserva intenção salva e resultado ausente/desatualizado e libera controles. Erro geométrico diagnosticado é resultado concluído, não exceção de execução.

Quando a comparação real dos insumos identificar mudança exclusiva de ajustes de graute, conservar o resultado anterior em retainedGroutResult, campo transitório da sessão, separado de doc.generated. Aplicar também à restauração e ao desfazer/refazer desses ajustes. Não reter quando geometria, base, configurações, canaletas ou encontros mudarem. O documento confirmado continua generated=null/status=outdated até concluir a geração; arquivo, salvamento, histórico e quantitativos não recebem esse resultado visual. Publicar o novo resultado e limpar a referência visual na mesma atualização de estado. Exceção de cálculo conserva a referência visual desatualizada e a mensagem de falha; mudança de outros insumos construtivos, abertura bem-sucedida de projeto e fechamento descartam a referência. Sem resultado anterior, manter o comportamento de resultado ausente.

Alterações não construtivas salvam sem invalidar resultado. Uma operação completa de usuário é atômica; prévias, cancelamentos e ausência de mudança não gravam, não alteram metadados e não geram histórico. IDs da prévia não devem materializar UUIDs definitivos a cada movimento.

Restauração de grautes usa `restore-grouts`: remover inclusões/exclusões do pavimento ativo, opcionalmente limitadas aos registros cujo `wallIds` contém a parede escolhida. Remover registros compartilhados integralmente, sem fracionar o eixo. Preservar literalmente todos os demais ajustes, inclusive pendentes, e os demais insumos. O comando valida que só houve remoções de graute do pavimento ativo, sem mudanças de geometria/configuração/canaletas/encontros, e dispensa a reconciliação geral de ajustes. Seguir o fluxo construtivo normal de uma intenção, um passo no histórico, salvamento, geração do projeto inteiro somente em memória; não introduzir recálculo parcial nem formato de arquivo novo. Alcance vazio retorna o documento original sem operação. Falha de armazenamento conserva intenção em memória e download pelo tratamento existente.

## Histórico e cancelamento

Terreno usa terrainDraft e terrainEditing transitórios; Desfazer os cancela antes de consumir histórico. Criação válida, troca de material, cada arraste concluído e exclusão passam pelo commit normal com comando terrain, sem alterar insumos construtivos. Escape, blur e mudança de ferramenta/contexto descartam a prévia; soltar fora descarta o arraste.

Antes de viajar no histórico, Desfazer cancela uma prévia ativa sem consumir uma operação. Histórico tem no máximo 50 intenções, sem peças derivadas; desfazer/refazer restaura IDs e dependências e recalcula apenas quando os insumos construtivos mudam. Não persistir histórico entre sessões. Criar/duplicar/excluir pavimento ajusta ativo e referências de sessão sem restaurar preferências transitórias descartadas.

## Comandos geométricos explícitos

Contratos implementados de M3.4 para confirmação, prévia e preservação de intenções:

- **Vãos e commit:** o comando geométrico informa explicitamente seu tipo (`resize`, `move`, `create/merge`) e entrega dependentes já transformados quando move/merge. Nesse caso, commit valida o candidato e não executa a reconciliação antiga novamente. Redimensionamento mantém o caminho de preservação mundial existente; comandos de configuração/edição de vão não transladam dependentes. Não inferir o tipo por mudança de ID, comprimento ou dois endpoints. Remapear ajustes antes dos filtros de exclusão de paredes em store; esses filtros devem distinguir exclusão real de absorção por união, sem apagar dependentes remapeados.
- **Planejamento da prévia:** usar geometria/associações temporárias sem UUID persistente para desenho, cópia de graute ou migração. Materializar novos UUIDs apenas na confirmação ou migração definitiva. Prever efeito e contar cópias sem calcular todas as fiadas; usar a mesma regra na confirmação. Retornar ID selecionável sobrevivente com o resultado do comando, evitando escolher `preview.id` já absorvido. Limpar seleção de faixa/furo/componente inválida e prévias antigas; conservar câmera e fiada válida.

## Falhas e acesso concorrente

Não publicar resultados parciais de execução nem marcar gravação falha como sucesso. Retry e download usam a intenção em memória. Revisões remotas e regras de abertura idempotente/hot reload têm fonte única em [Persistência e compatibilidade](Persistencia-e-Compatibilidade.md). Somente leitura permite consultas e preferências, sem mutações do projeto.

Implementação: src/state/store.ts, src/domain/project.ts e src/domain/floors.ts.

## Revisão de etiquetas de área

Antes de validar e registrar o candidato confirmado, reconciliar as etiquetas contra a alteração geométrica (RF-21). Geometria e `roomLabels[].review` pertencem à mesma intenção e à mesma operação de histórico/salvamento; não gravar uma segunda operação após calcular a área. A área e as faces são derivadas, mas revisão obrigatória é persistente e não é removida ao reabrir ou refechar por edição. Desfazer/refazer restaura o snapshot, sem executar a reconciliação como se fosse uma nova edição. Excluir etiquetas/linhas é desfazível.

A recuperação explícita por clique elegível na etiqueta em revisão confirma somente a remoção de `review` em uma operação `room`, desfazível e salva pelo fluxo normal. Preservar os resultados construtivos, inclusive seu estado atual/desatualizado, sem chamar o motor de tijolos. Tentativa sem região elegível e clique em etiqueta já válida não geram operação; seleção continua transitória. Falha de salvamento e bloqueios seguem os contratos comuns.

Excluir etiquetas, linhas e contador de nomes da assinatura de insumos construtivos; mudar apenas nome, posição ou fechamento conserva resultado/diagnósticos da composição. Alterações em paredes mantêm seu fluxo construtivo e reconciliam as etiquetas afetadas no mesmo candidato. Falha remota usa o fluxo único de recuperação existente.

## Configuração de grampos

model.floors[].clamps é intenção construtiva local: confirmar parâmetros/programação salva e registra uma operação, invalida o resultado e recalcula. Não altera o resultado de tijolos/grautes/canaletas por si; somente acrescenta ligações/pendências derivadas. Criar pavimento não herda a configuração de outro; duplicar copia por valor. Desfazer/refazer e exclusão/restauração preservam a configuração. Rascunhos do formulário, prévia das fiadas e hover de ligação são sessão, sem salvamento. Respeitar busy/somente leitura e a recuperação existente, conservando candidato e dados em caso de rejeição.

## Armadura das cintas por pavimento

model.floors[].channelReinforcement é intenção construtiva local, com enabled/count/diameter. A confirmação conjunta usa a operação de pavimento existente: salvar, registrar uma operação, invalidar e recalcular o resultado. Desfazer/refazer recupera o conjunto completo, sem alterar tijolos/canaletas/grautes/grampos por essa configuração. Rascunhos e hover são sessão, sem gravação. Campos confirmados em candidato com falha seguem recuperação e bloqueio existentes; não anunciar como salvo nem apagar o candidato. Criar pavimento usa ausência/desativado; duplicar copia o objeto por valor; excluir/desfazer e copiar/importar projeto preservam intenção no alcance correto.

## Confirmação das ferragens do pavimento

T-027 reúne modalidade/diâmetro das barras do graute, grampos e armadura das cintas em rascunhos locais do popup, sem escrever no documento enquanto o usuário digita. Abrir carrega somente valores do pavimento de origem; reabrir não transporta rascunhos entre andares. Antes de aplicar, conferir projeto e pavimento ativos, bloqueios e validade dos três grupos; erro em qualquer grupo impede todo o conjunto. Configurações opcionais ausentes continuam ausentes quando equivalentes aos padrões; editar um grupo conserva os demais, incluindo intenções de grampos pendentes por redução posterior da altura.

Aplicar uma mudança confirma um único candidato via editFloor/commit floor, registra um snapshot no histórico, salva e recalcula uma vez com os três parâmetros juntos. Valores equivalentes não alteram metadados, histórico, salvamento ou composição. Sucesso mantém o popup aberto e atualiza a referência do rascunho; desfazer/refazer restaura o conjunto confirmado. A bitola do graute é intenção por pavimento no formato 25; isoladamente não invalida a composição nem muda a versão do motor. Demais mudanças construtivas conservam o recálculo existente.

Fechar/Cancelar/Escape com rascunho diferente do último aplicado exige confirmação de descarte; continuar mantém os campos e descartar fecha sem escrever. Sem mudança, fecha diretamente; fundo não fecha. Durante operação em voo, impedir edição, aplicação e fechamento. Ao submeter, distinguir o candidato retido pelo store de rascunhos ainda não enviados: falha/incerteza conserva o candidato, não anuncia sucesso e bloqueia novas alterações; ao cessar busy, pode-se fechar sem descartar esse candidato para usar a recuperação existente. Retomar/reabrir carrega a intenção atual. Estado do diálogo e foco não pertencem ao projeto.

## Orçamento de ferragens — T-028

steelBudget no pavimento e steelPrices no projeto são intenção orçamentária persistida, com snapshots no histórico e o mesmo fluxo de salvamento/recuperação. Excluir esses campos da assinatura de insumos construtivos. Alteração exclusiva mantém resultado atual ou desatualizado como estava, sem motor; alteração conjunta com parâmetros construtivos continua uma operação e executa somente o recálculo pertinente. Ausência/padrões equivalentes não causam operação. Desfazer/refazer restaura parâmetros/preços, inclusive ausência, sem recomposição quando a mudança for somente orçamentária.

Ferragens do pavimento carrega três novos campos no rascunho: útil e sobreposição no graute, percentual na armadura das cintas; validar todos antes do único editFloor/commit floor. Erro impede candidato parcial; descartar rascunho não escreve. Parâmetros podem ser definidos antes de existir material. Preços do resumo por material usam commit budget em Enter/blur; durante esse salvamento a consulta conserva resultado vigente. Falha retém candidato, bloqueia edição e permite fechar para recuperação existente. Consulta, filtro, preços em prévia inválida e totais derivados não criam operações.

## Configuração da laje selecionada — T-029

Tipo, altura da estrutura e capa opcional são rascunhos das propriedades até Aplicar; confirmar exige configuração completa e espessura total coerente, validada por putSlab. Um único commit slab confirma todos os campos e o total, registra histórico e segue salvamento/recuperação e recálculo de lajes existentes. Valores equivalentes não geram operação. Cancelar/Escape no formulário e mudanças de contexto descartam campos não confirmados; recolher o painel conserva o rascunho. Somente leitura, busy e edição de contorno/abertura bloqueiam os controles. Falha conserva o candidato em memória pelo fluxo existente, sem anunciar salvamento.

Desfazer/refazer recupera o conjunto inteiro e pode restaurar uma laje com somente thickness, sem construction. Duplicar pavimento e copiar projeto preservam parâmetros sem vínculo; editar tipo/espessura não altera contorno, aberturas ou alvenaria. O fluxo de criação por contorno não passa a exigir os novos campos.

## Percentual de perdas de tijolos persistido

project.brickLossPercent guarda o percentual confirmado em centésimos de ponto percentual; ausência equivale a zero. Edição no Orçamento é rascunho até Enter/perda de foco. Confirmação válida e diferente do valor atual usa uma operação budget com histórico e salvamento, excluída dos insumos construtivos; não invalidar nem recalcular composição. Zero equivalente à ausência não cria operação só por consultar/confirmar o padrão.

Desfazer/refazer restaura o percentual, inclusive ausência. Abrir/reabrir e cópias carregam o valor do projeto. Falha conserva o candidato em memória e aplica bloqueios/recuperação existentes; somente leitura e busy impedem edição. Não persistir texto inválido, filtros ou totais calculados.

### Inclusão dos ambientes nas áreas — 2026-11-26

Alterar `model.roomLabels[].excludedFromAreas` é uma operação room: confirma uma intenção, histórico e salvamento existentes, sem chamar composição. Desfazer/refazer restaura a marca e os totais derivados. Renomear, mover o texto, reconciliar/revalidar a referência e duplicar o pavimento preservam a escolha. O formato 35 e as cópias remotas/arquivos a transportam; ausência preserva inclusão anterior. Somente leitura/processamento bloqueiam a edição.

## Impermeabilizante e rejunte — T-040

project.surface contém somente intenção orçamentária, excluída dos insumos construtivos. Confirmações por Enter/blur usam budget, documento local mais recente, histórico e salvamento em segundo plano existentes, sem recomposição. A cópia de referência de superfície grava preço, origem, identificação de produto/embalagem e rendimento juntos; preço próprio ou limpeza remove a descrição capturada da origem, preservando a identificação editável productDescription. Este campo confirma por Enter/blur em budget, com o mesmo histórico/salvamento e preservação no PDF. Desfazer/refazer restaura todo o conjunto. Percentuais não recebem referência; rendimento acompanha produto/embalagem e preço nas quatro referências de superfície. A incorporação automática preserva rendimento e identificação próprios; a cópia manual substitui o conjunto completo. Rascunhos inválidos não confirmam e impedem captura de PDF até correção; somente leitura/processamento e recuperação mantêm os bloqueios existentes.
