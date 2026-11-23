# T-032 — Continuar editando durante o salvamento de alterações não construtivas

**Tipo** — Implementação

**Resumo** — Permite continuar movendo mobiliários e fazendo outras alterações não construtivas enquanto o projeto é salvo. Alterações construtivas mantêm o bloqueio até concluir o salvamento e o recálculo.

**Execução** — Verificada

**Data de execução** — 2026-11-23

**Aceite manual** — Pendente

## Alteração e limites

Separar salvamento em andamento de bloqueio de edição. Alterações não construtivas válidas são aplicadas imediatamente ao documento local e salvas em segundo plano, permitindo outras edições enquanto a comunicação estiver funcionando. Alterações construtivas continuam bloqueando novas mutações durante seu salvamento e recálculo completo, na ordem vigente.

Desfazer e Refazer do projeto ficam bloqueados enquanto houver preparação/envio de pedido, upload do salvamento, estado local ainda não enviado ou bloqueio construtivo. A prioridade é permitir movimentos repetidos sem introduzir viagens no histórico durante confirmações remotas.

O caso principal é mover vários mobiliários ou ajustar repetidamente suas posições sem esperar uma confirmação remota entre os gestos. Entregar no editor existente. A criação desta especificação não autoriza implementação, commit, push ou publicação.

Referências: [PRD — RF-09](../Ecovit-PRD.md#rf-09--edição-simples-e-recálculo-automático), [Estado, histórico e operações](../arquitetura/Estado-Historico-e-Operacoes.md), [Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md), [Autenticação e acesso](../arquitetura/Autenticacao-e-Acesso.md), [Editor e interação](../arquitetura/Editor-e-Interacao.md), [Medidas e imagens](../arquitetura/Medidas-e-Imagens.md) e [Qualidade e desempenho](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração).

### Classificação e experiência de edição

Reutilizar a comparação real dos insumos construtivos vigente, sem nova lista independente por componente ou inferência pela aparência do gesto. Mover mobiliário e editar exclusivamente medidas, terreno, imagens, nomes, aparência de esquadrias ou parâmetros orçamentários seguem a classificação não construtiva existente. Campos de ferragens, etiquetas e demais casos já classificados conservam a classificação pelos dados efetivamente alterados. Uma alteração conjunta com mudança construtiva recebe o bloqueio construtivo.

| Situação | Resultado esperado |
|---|---|
| Alteração não construtiva válida | Aplicar imediatamente ao documento local, registrar o gesto no histórico e iniciar/agendar seu salvamento, sem bloquear a próxima edição apenas pela espera remota. |
| Alteração não construtiva durante outro salvamento não construtivo | Usar o documento local mais recente; conservar a ordem lógica e atualizar o estado ainda não enviado. |
| Alteração construtiva válida | Aplicar um candidato coerente com o estado local mais recente e bloquear novas mutações até confirmar sua gravação e concluir o recálculo. |
| Desfazer/refazer com salvamento ou alterações pendentes | Desabilitar botões e atalhos do projeto, sem executar nem enfileirar a ação. |
| Salvamento confirmado sem pendências posteriores | Indicar Salvo; não exigir espera artificial nem nova gravação. |
| Falha, confirmação incerta, conflito, sessão expirada ou acesso removido | Suspender novas mutações e preservar todo o estado local confirmado pelo usuário para recuperação. |

Prévia de arraste continua sendo transitória: não salvar a cada movimento do mouse. Soltar confirma um gesto; Escape, cancelamento ou ausência de mudança seguem o contrato atual. Escape continua disponível para cancelar um gesto mesmo quando Desfazer estiver bloqueado. A confirmação de uma gravação anterior não cancela um novo arraste, troca sua seleção, reinicia formulários ou move a câmera. Respeitar bloqueios independentes de sessão, somente leitura e rascunhos exclusivos, sem liberar operações incompatíveis só porque o salvamento passou a ser assíncrono.

Conservar a composição e os diagnósticos em alterações não construtivas, inclusive seu estado desatualizado anterior. Não chamar o motor nem promover resultado antigo a atual. Seleção, câmera e preferências continuam sem criar gravação do projeto.

### Alcance inicial e conclusão de formulários

Aplicar o salvamento em segundo plano somente às edições de projeto já criado, aberto e validado pelo fluxo remoto. Criação, primeira gravação, importação, duplicação e abertura/troca de projeto mantêm o fluxo e os bloqueios atuais. Não permitir edições antecipadas sobre um projeto cuja criação remota ainda não foi confirmada.

Para alteração não construtiva, a conclusão de `commit()` representa validação e aceitação local, sem aguardar o servidor. Formulários podem encerrar a aplicação local e permitir outra edição compatível, mas não anunciar salvamento remoto concluído com base nesse retorno. Falha de validação continua impedindo a aplicação e mantém o tratamento de erro do componente. Para alterações construtivas, conservar a espera pelo fluxo completo de salvamento e recálculo. Os dois casos usam o mesmo mecanismo de persistência e têm sua confirmação remota representada pelo estado de salvamento.

### Um único mecanismo de persistência

Manter um fluxo compartilhado para alterações construtivas, não construtivas, renomeação, desfazer/refazer, repetição e recuperação. Não criar um protocolo especial de mobiliários nem dois mecanismos independentes de salvamento.

Distinguir explicitamente:

- O documento local mais recente, com todos os gestos confirmados pelo usuário.
- O último documento confirmado pelo servidor, com revisão, recursos e histórico correspondentes ao estado enviado.
- O pedido de gravação em andamento, imutável, associado à conta, projeto e estado local que representa.
- O estado local mais recente ainda não enviado, quando existir.

Permitir no máximo uma gravação de intenção por vez para o projeto aberto. A próxima usa a revisão confirmada pela anterior. Não enviar vários PUTs em paralelo para disputar a mesma revisão. Preservar os contratos existentes da API, de autorização, revisão e idempotência.

Consolidar estados ainda não enviados: manter o estado pendente mais recente, sem armazenar uma fila ilimitada de snapshots ou eventos de mouse. Um pedido já preparado/em processamento, inclusive uploads associados, não pode ter seu conteúdo trocado por uma edição posterior. operationId, requestIssuedAt, revisão esperada e conteúdo são capturados para esse pedido e permanecem iguais em uma repetição; o pedido seguinte recebe identidade própria e a revisão conhecida quando for preparado.

Ao preparar um pedido, capturar também a referência da intenção local, dos recursos e do histórico que ele representa, antes de qualquer etapa assíncrona de preparação. O início dessa preparação já ocupa a única posição de envio em andamento. Novos gestos atualizam somente o estado pendente, sem iniciar outra preparação ou upload concorrente desse fluxo.

Se houver estado pendente após uma confirmação, prosseguir automaticamente com o próximo envio enquanto a sessão e a situação do projeto forem válidas, respeitando a cadência abaixo. Uma confirmação antiga atualiza somente o checkpoint do pedido correspondente: nunca substitui o documento local mais recente nem suas pilhas, rascunhos, seleção ou recursos por um snapshot anterior. Não capturar para o checkpoint o histórico local mais novo no momento em que chega a resposta de um pedido antigo.

Usar uma cadência fixa simples: sem gravação anterior no contexto, o primeiro pedido de edição inicia imediatamente. Havendo estado pendente, iniciar o próximo preparo/envio assim que o pedido anterior estiver concluído e tiver passado um segundo desde o início da última requisição de gravação de intenção (POST/PUT). Não acrescentar espera quando ambas as condições já estiverem atendidas. A espera ocorre apenas no salvamento, sem atrasar a aplicação local. Não reiniciar o prazo a cada gesto, upload ou confirmação nem esperar o usuário parar de editar: movimentos contínuos também devem ser salvos durante a sequência. Durante a espera, consolidar somente o estado pendente mais recente. Sem pendência, não manter polling ou disparar gravação periódica vazia.

Essa cadência não substitui os limites de 120 mutações por conta/minuto, compartilhados com uploads, outras ações e outras abas. Uploads mantêm a ordem e os limites existentes. Não ampliar limites do backend, introduzir agendamento adaptativo ou garantir ausência de 429; uma recusa interrompe o fluxo para recuperação explícita, respeitando Retry-After e sem loop de repetição automática.

Preservar o limite atual do histórico de 50 intenções e reutilizar referências de recursos quando possível. A consolidação de envios não elimina passos do histórico nem cria cópias integrais de imagens por gesto.

### Histórico e transição para alterações construtivas

Cada gesto efetivo continua sendo um passo independente no histórico, mesmo que vários sejam enviados em uma única gravação. Enquanto houver salvamento ou intenção local pendente, novas edições podem acrescentar passos, mas Desfazer/Refazer não podem mudar as pilhas. Isso inclui a preparação do pedido, uploads, espera de cadência e a transição entre uma confirmação e o envio seguinte: não liberar os comandos brevemente entre dois envios se ainda existir pendência.

Bloquear os botões e os atalhos de Desfazer/Refazer do projeto sem armazenar uma fila de teclas para execução posterior. Quando o estado local estiver salvo e não houver outro bloqueio, cada comando volta a estar disponível se a pilha correspondente permitir. Um desfazer/refazer aceito modifica as pilhas uma única vez e segue a classificação real antes/depois: se não construtivo, agenda o salvamento em segundo plano; se construtivo, mantém o bloqueio até salvar e recalcular. Em ambos, bloquear novos comandos de histórico imediatamente até a confirmação integral desse novo estado.

Sem pendências, Desfazer continua cancelando uma prévia antes de consumir histórico. Com pendências, usar Escape para cancelar a prévia; não abrir exceção ao bloqueio dos comandos do projeto. O tratamento de edição de texto ainda não confirmado nos campos permanece no componente, sem consumir o histórico do desenho.

Ao confirmar uma mudança construtiva enquanto há salvamento não construtivo em andamento:

1. Validar e aplicar o candidato sobre o documento local mais recente, preservando posições, nomes e demais edições anteriores.
2. Ativar o bloqueio de novas mutações, inclusive undo/redo, sem esperar o pedido anterior terminar para sinalizar esse bloqueio.
3. Conciliar/concluir o envio anterior e gravar o candidato construtivo com a revisão correta. O snapshot construtivo pode incorporar as alterações não construtivas ainda não enviadas, dispensando uma gravação intermediária exclusiva delas.
4. Somente após confirmar a intenção construtiva, executar o recálculo completo pelo fluxo vigente; liberar a edição ao terminar, respeitando os tratamentos atuais de falha.

Se ocorrer falha no envio anterior, suspender a sequência e preservar também o candidato construtivo, sem iniciar o cálculo ou enviá-lo sobre uma revisão incerta. Não aceitar uma segunda alteração construtiva enquanto a primeira estiver bloqueando a edição.

Falha do motor após gravação confirmada continua sendo falha de cálculo de uma intenção salva. Não reclassificá-la como erro de salvamento nem gerar nova gravação apenas para recalcular. A necessidade de recálculo acompanha o candidato construtivo que originou o bloqueio; não inferi-la apenas de `generationState` desatualizado. Repetir uma gravação não construtiva sobre resultado que já estava desatualizado não pode acionar o motor.

O comando manual Recalcular fica indisponível enquanto houver preparação/envio, upload de salvamento, espera de cadência, estado local pendente ou bloqueio de recuperação. Aplicar essa condição ao botão e ao acionamento do comando, sem enfileirar o clique para execução posterior. Sem pendências e respeitados os bloqueios atuais, Recalcular opera sobre a intenção confirmada vigente, bloqueia novas edições durante a tentativa de cálculo e mantém o tratamento atual de sucesso/falha, sem criar gravação apenas para recalcular.

### Recursos, status e recuperação

Imagens e recursos privados mantêm upload e associação no fluxo existente. Upload em andamento não é motivo, por si só, para bloquear outras edições não construtivas compatíveis. O pedido captura os recursos de que depende; edições posteriores não alteram seus bytes ou referências. Remoção/substituição de imagem enquanto outro estado usa esse recurso não pode quebrar o pedido anterior nem o documento local ou seu download. Cotas e validações do servidor continuam obrigatórias.

Na interface, Salvando representa intenção local ainda não integralmente confirmada e não bloqueia, por si só, a edição não construtiva. Salvo só aparece quando o servidor confirmou o estado local vigente e não há envio ou alteração posterior pendente. Não confundir estado de persistência com atualidade do cálculo. Não exigir novos ícones ou uma tela de gestão de fila.

Ao detectar falha ou indisponibilidade, interromper o agendamento de novos pedidos e impedir novas mutações. Cancelar gestos ainda não confirmados sem alterar os gestos já aceitos localmente. Preservar o pedido original, o estado local mais recente, recursos e histórico, distinguindo o que foi confirmado do que está pendente; não descartar silenciosamente alterações posteriores à tentativa que falhou.

Tratar o evento de desconexão também quando o estado for Salvando ou houver pendência ainda não enviada; não depender de o projeto estar marcado como Salvo. A desconexão suspende novos envios, mas não prova cancelamento de um pedido já iniciado. Sua confirmação ainda pode atualizar o checkpoint correspondente, sem liberar edição ou enviar a pendência até recuperação explícita. Evento online sozinho não reinicia a sequência nem comprova acesso ao servidor.

Tentar novamente resolve primeiro o pedido original, se houver, usando seus dados imutáveis. Se a gravação for confirmada e a revisão vigente ainda permitir continuidade, atualizar seu checkpoint e enviar o estado local posterior pendente. Se não houver pedido preparado, conferir a revisão antes de preparar o estado pendente. Durante toda a recuperação, manter bloqueadas as novas edições, Desfazer/Refazer e Recalcular manual até confirmar todo o estado local pendente e concluir a tentativa de recálculo construtivo quando exigida. Não liberar a edição entre a recuperação do pedido original e o salvamento do estado posterior, nem anunciar Salvo ao recuperar apenas o primeiro pedido. Falha exclusiva do motor após confirmação integral mantém o tratamento vigente de cálculo, sem transformar a intenção salva em pendência remota. Outra falha de salvamento mantém a recuperação bloqueada, com o trabalho preservado.

Em rejeição definitiva, não pular automaticamente o pedido rejeitado para tentar gravar um estado posterior, nem alterar seu conteúdo/identidade para contornar a recusa. Preservar a tentativa e o trabalho posterior; permitir a repetição explícita quando aplicável pelo contrato existente ou o download/descarte explícito desse trabalho. O descarte retorna ao checkpoint confirmado com documento, recursos e histórico capturados juntos. Não criar merge, rebase de ações ou correção automática de candidatos nesta versão.

Conciliação de operação incerta, recibos, revisão atual, reautenticação, conflito e acesso removido seguem os contratos existentes. Reautenticar não altera o conteúdo de um pedido incerto. Outra aba ou conta não pode ser sobrescrita por uma resposta antiga; conflito continua exigindo a recuperação vigente, sem sobrescrita forçada.

Download usa o documento local mais recente e seus recursos, conforme os limites atuais; não baixar apenas o último snapshot confirmado. Descarte é uma decisão explícita e restaura documento, recursos e histórico coerentes com o checkpoint confirmado, eliminando o trabalho posterior descartado sem reaparecimento pelo Refazer. Operação incerta precisa ser conciliada antes de tratar um checkpoint como revisão vigente. Não oferecer desfazer isoladamente uma operação remota rejeitada enquanto aplica silenciosamente estados posteriores que dependem dela.

Trocar/fechar projeto, sair ou trocar conta exige resolver a gravação ou a recuperação/descarte pelos fluxos existentes. Não transportar pendências entre contas/projetos. A troca de contexto, o descarte do store e o hot reload devem considerar tanto o pedido em andamento quanto o estado ainda não enviado, sem depender somente do antigo `busy`. Preservar o aviso de saída do navegador de melhor esforço; não prometer recuperação após fechar/recarregar a página. Pendências ficam na sessão, sem armazenamento automático do projeto ou fila offline em IndexedDB.

### Limites técnicos e atualização dos contratos

Sem Web Worker, edição durante recálculo, recálculo parcial, alteração das regras geométricas, novo formato de arquivo, migração SQL, fila no servidor, serviço externo ou biblioteca adicional sem necessidade concreta. O recálculo permanece completo, síncrono e posterior à confirmação remota da alteração construtiva.

Na implementação autorizada, atualizar RF-09 e os trechos pertinentes de Estado, Persistência e interação: substituir o bloqueio indiscriminado por salvamento pelas regras desta task, preservando IDs e aceites anteriores. Manter a classificação de operações em seu documento responsável e o protocolo de rede no contrato de Persistência, sem duplicá-los nos componentes. A criação desta task não muda os contratos vigentes antes dessa implementação.

## Critérios de aceite

- [x] **A01** — Com uma gravação não construtiva aguardando resposta, o usuário conclui outros movimentos de mobiliários sobre o estado local mais recente, sem perder ações ou precisar esperar entre os gestos.
- [x] **A02** — Alterações não construtivas preservam resultado e diagnósticos sem chamar o motor; a classificação existente é mantida, inclusive para alterações conjuntas e desfazer/refazer.
- [x] **A03** — Há no máximo uma gravação de intenção em andamento; estados não enviados podem ser consolidados e respostas antigas não substituem edições, rascunhos, recursos ou contexto mais recentes. O estado final remoto corresponde ao estado local confirmado pelo usuário.
- [x] **A04** — Cada gesto mantém seu passo de histórico, mas Desfazer/Refazer do projeto ficam bloqueados por botões e atalhos durante preparação, uploads, espera de envio, salvamento ou alterações pendentes, sem liberação entre pedidos consecutivos ou execução posterior das teclas. Após a confirmação integral, comandos voltam a funcionar conforme as pilhas e a classificação existente, preservando IDs e o limite do histórico.
- [x] **A05** — Alteração construtiva durante pendências preserva todo o estado local anterior e bloqueia novas mutações até concluir gravação e recálculo completo, sem gravações concorrentes ou cálculo sobre intenção remota incerta.
- [x] **A06** — Salvando não desabilita indevidamente a edição não construtiva; Salvo só aparece após confirmação do estado local vigente. A confirmação remota não interrompe um gesto posterior já iniciado.
- [x] **A07** — Falha, timeout, desconexão, conflito ou expiração de sessão interrompem novos envios e edições, preservando pedido original, trabalho local posterior e recursos. Online não retoma automaticamente; recuperação resolve o pedido original antes do posterior e não pula rejeições definitivas, duplica efeitos/histórico ou usa revisão antiga como atual. Novas edições e comandos de histórico só são liberados após confirmar todo o estado pendente e concluir eventual tentativa de recálculo construtivo, sem liberação intermediária.
- [x] **A08** — Upload, substituição e remoção de recursos respeitam dependências de cada snapshot e cotas; o download e a recuperação preservam a versão local mais recente com recursos íntegros.
- [x] **A09** — Troca de contexto, hot reload e descarte respeitam pendências, confirmação e isolamento por conta/projeto; cada checkpoint usa o histórico e os recursos do estado efetivamente enviado, sem capturar os posteriores pela chegada da resposta. Restauração não deixa trabalho descartado reaparecer por Refazer. Não há persistência oculta de fila offline.
- [x] **A10** — Fluxo construtivo e falha do motor mantêm as regras atuais; contratos são atualizados nos documentos responsáveis, com um único mecanismo de persistência e sem ampliar o escopo técnico descrito.
- [x] **A11** — O primeiro pedido de edição inicia imediatamente quando não há gravação anterior no contexto. Com pendência, o próximo preparo/envio começa assim que o anterior terminar e passar um segundo desde o início da última requisição de gravação de intenção, sem espera adicional ou reinício do prazo por gestos, uploads ou confirmações. A atualização local continua imediata; não há chamadas vazias ou aumento dos limites do servidor.
- [x] **A12** — Criação, primeira gravação, importação, duplicação e abertura/troca conservam seus bloqueios; formulários de edição não construtiva concluem a aceitação local sem aguardar a rede e sem anunciar confirmação remota por esse retorno.
- [x] **A13** — Recalcular manual é recusado por botão e comando durante salvamento, pendências ou recuperação, sem enfileirar cliques. Quando disponível, calcula a intenção confirmada vigente com bloqueio de edição e tratamento atual de sucesso/falha, sem gravação remota adicional.

## Resultado

Especificação criada em 2026-11-22 conforme o recorte solicitado. Implementação, verificações funcionais e aceite manual pendentes. Nenhuma alteração no aplicativo ou nos contratos vigentes foi realizada nesta etapa.

Revisada em 2026-11-23 a pedido do solicitante para priorizar simplicidade: Desfazer/Refazer bloqueados até confirmação integral, um pedido em andamento e um estado pendente, cadência fixa de um segundo, checkpoint ligado ao histórico enviado, recuperação do pedido original antes do posterior, desconexão sem retomada automática e distinção entre aceitação local e confirmação remota nos formulários. Criação/importação/duplicação/abertura mantêm o fluxo vigente. A revisão fecha as lacunas identificadas sem autorizar implementação, adicionar novos fluxos de persistência ou ampliar o escopo do motor.

Na revisão seguinte da mesma data, o solicitante aprovou três definições complementares: bloquear Recalcular manual enquanto houver salvamento, pendências ou recuperação; manter a edição bloqueada durante toda a recuperação até confirmar o estado local completo e terminar eventual tentativa de recálculo construtivo; iniciar o próximo envio no primeiro instante permitido pela conclusão do anterior e pelo intervalo de um segundo. As regras foram explicitadas no corpo e nos critérios A07, A11 e A13. Autorizados commit e push desta especificação, sem implementação. Execução e aceite manual da funcionalidade continuam pendentes.

Na implementação, selecionar verificações proporcionais aos contratos afetados, com foco em ordem de gravação, respostas atrasadas, histórico, transição construtiva, recursos e recuperação. Usar latência controlada e falhas dirigidas quando necessárias para observar os estados intermediários, sem exigir matriz ampla ou suíte completa por padrão. Registrar resultados reais, duração, falhas e logs conforme a política de qualidade, separando verificação técnica de aceite manual.

### Implementação em 2026-11-23

Implementação autorizada pelo solicitante nesta data e entregue no aplicativo. Os registros acima descrevem a especificação anterior; os critérios marcados representam a verificação técnica desta implementação. Aceite manual permanece pendente.

- **A01–A03/A06/A11/A12** — `busy` conserva os bloqueios de abertura/construção/cálculo/recuperação; `saving` acompanha preparo, envio e espera. Commit não construtivo aceita localmente e agenda o mesmo mecanismo compartilhado de persistência. Um pedido imutável e o último estado ainda não enviado, com cadência de um segundo contada do POST/PUT; resultado/diagnósticos preservados. Resposta antiga atualiza somente seu checkpoint e não cancela gesto ou rascunho posterior. Criação/primeira gravação/importação/abertura permanecem bloqueantes; duplicação conserva seu fluxo anterior.
- **A04/A05/A10/A13** — Histórico mantém cada gesto e o limite de 50 intenções. Botões, atalhos e comandos de histórico/recálculo bloqueados durante toda a pendência. Mudança construtiva incorpora o estado local recente, bloqueia imediatamente e só calcula depois de confirmar o candidato pela revisão correta. Recuperar intenção não construtiva desatualizada não chama o motor; falha exclusiva do motor continua sendo intenção salva. RF-09, Estado, Persistência e Editor alinhados.
- **A07/A08/A09** — Falha/desconexão/expiração suspende a sequência e preserva pedido original, estado posterior e recursos. Recuperação mantém bloqueio até o fim e não pula uma rejeição; Retry-After impede repetição antecipada sem criar retomada automática. Download usa a versão local e descarte restaura documento/recursos/pilhas do checkpoint enviado, sem refazer descartados. Fechamento/troca/importação e saída de conta consideram `saving`; hot reload transfere o estado de sessão e os snapshots após terminar o fluxo ativo, sem fila persistente. Fluxo de hot reload e bloqueios de criação/duplicação/contexto conferidos também por inspeção de código; não foi alegada homologação manual desses caminhos.

### Verificação técnica

O impacto concreto é no fluxo compartilhado de persistência, histórico e recuperação; selecionados testes de estado, protocolo e mobiliários, além de cenários dirigidos no Chrome. Sem alteração de geometria, banco, formato, dependências ou publicação; não foi necessária matriz completa ou build.

- **Unitários/protocolo:** rodada de 99 testes aprovada em cinco arquivos, 1,23 s. Na revisão final, fechado o caso de falha antes de concluir a preparação de imagens: o protocolo agora retém fonte, revisão, ID e instante antes do primeiro await, inclusive se o hash falhar. O recorte afetado foi revalidado: 32 testes aprovados em dois arquivos, 0,53 s, incluindo o novo cenário. Ao todo, 100 testes distintos aprovados, sem somar repetições. Incluem 14 casos novos de estado e três novos de protocolo, com relógio controlado, resposta atrasada, preparação/upload, consolidação, cadência sem debounce, limite de histórico, transição construtiva, falha anterior, desconexão durante conferência de revisão, download/substituição de recursos, checkpoint/descarte e Retry-After. Arquivos de regressão: generation-state, floor-state e image-elements, além de remote-protocol. Logs: `.tools/t032-unit-final.log` e `.tools/t032-preparation-final.log`.
- **Chrome:** três cenários distintos aprovados, 22,4 s: movimentos reais durante resposta atrasada, histórico bloqueado por botões/atalhos e gesto posterior preservado; recusa dirigida, download da versão local e repetição literal do pedido original antes do posterior; offline/online sem retomada, recuperação explícita e Recalcular bloqueado por botão/comando, sem gravação extra para calcular. Conferidos também revisão sequencial, ausência de PUT concorrente e igualdade entre estado final remoto/local. Log: `.tools/t032-e2e-final.log`. Uma rodada anterior dos dois primeiros cenários passou em 22,8 s; não foi somada como cobertura distinta.
- **Ambiente:** primeiro `test:env` não reconheceu o processo por restrição do sandbox e informou a porta 55432 ocupada. PID e postmaster.pid identificaram o cluster gerenciado esperado; a única reexecução, com acesso ao processo, preparou Node 24, PostgreSQL 18/ecovit_test e Chrome. Nenhum processo desconhecido foi encerrado; 5173 não foi usada. Logs: `.tools/t032-env.log` e `.tools/t032-env-recheck.log`.
- Typecheck e lint do recorte aprovados; conferência final de diff registrada nos logs `.tools/t032-types-final.log`, `.tools/t032-lint.log`, `.tools/t032-e2e-lint.log`, `.tools/t032-preparation-lint.log` e `.tools/t032-diff.log`. Na inspeção final, o estado do protocolo (revisões, recursos e pedidos originais) passou a ser reutilizado em memória no hot reload; ajuste textual no formulário de ferragens evita declarar Salvo quando apenas não há mudanças a aplicar. Aceite manual não foi presumido.
