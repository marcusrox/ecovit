# Estado, histórico e operações

[Índice da arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [PRD](../Ecovit-PRD.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md) · [Marcos](../Ecovit-Plano-Implementacao.md)

Este documento descreve contratos de software vigentes. Regras geométricas/construtivas, justificativas, fontes e exemplos independentes pertencem ao Caderno Técnico; escopo e comportamento ao PRD; verificações executadas e aceites aos registros dos marcos.

## M12 — estados remotos

Esta seção rege os projetos remotos implementados em [M12](../marcos/M12-Contas-e-Persistencia-Remota.md), com aceite pendente. Protocolo/armazenamento em [Persistência e compatibilidade](Persistencia-e-Compatibilidade.md#m12--persistência-remota); identidade em [Autenticação e acesso](Autenticacao-e-Acesso.md).

Manter eixos independentes: autenticação (verificando/autenticado/ausente/expirado), persistência (carregando/salvo/salvando/incerto/falhou/conflito/indisponível), cálculo (atual/desatualizado/calculando/falhou) e gesto. Não usar current/outdated como estado de rede. Operação carrega conta, projeto, revisão esperada e operationId; resposta só é aplicada à sessão que a iniciou, sem atualizar outro documento após troca de contexto.

Projetos remotos não dependem de Web Lock ou IndexedDB. Duas abas/dispositivos podem abrir e preparar edição da mesma revisão; a transação do servidor arbitra a gravação e o perdedor recebe conflito. Não conservar automaticamente o bloqueio exclusivo local que tornava a segunda aba somente leitura. Tamanho/ordem do histórico continuam da sessão; câmera e preferências continuam fora da revisão remota.

Fluxo único: candidato validado e uma operação no histórico; para insumos construtivos, invalidar resultado e reter visual de grautes quando aplicável; enviar novos recursos e intenção, sem resultado; aguardar confirmação remota antes de iniciar o cálculo. Uma confirmação de intenção permite calcular localmente sem segunda gravação remota. Edição não construtiva preserva resultado em memória e grava somente intenção. Estado Salvo representa intenção confirmada, sem afirmar sucesso do motor. Abertura remota recompõe em memória e não gera gravação/histórico só por calcular.

Um único fluxo de persistência/repetição/recuperação atende edição normal, renomeação, undo e redo. A origem da alteração só define o candidato e o efeito nas pilhas, sem protocolos de rede distintos. operationId e requestIssuedAt são capturados com o pedido; não há preparação de operação em chamada separada. Upload acontece antes do save somente se houver bytes novos. Estados abaixo são os estados necessários da interface, não uma biblioteca genérica de máquinas de estado.

Uma tentativa incerta continua incerta se a repetição receber 401, 429 ou outra recusa que não esclareça o efeito original. Só confirmação válida ou conciliação explícita resolve essa dúvida. Após qualquer reenvio de pedido já enviado, conferir também a revisão/estado atual antes de liberar edição, mesmo quando a consulta de recibo retornou 404 e o POST posterior devolveu um recibo antigo. Duplicação conserva nome, novo ID e operação enquanto houver dúvida; repetir não cria uma nova ação.

Lista de projetos e cotas têm estados carregando/disponível/indisponível. Falha de leitura conserva a última lista apenas como referência, bloqueia ações dependentes e oferece atualização; não apresenta lista vazia nem uso zero como resposta confirmada. Resposta de contexto anterior é ignorada. A disponibilidade da lista só controla ações da lista; não bloqueia preferências, seleção, recuperação, navegação ou download do documento já aberto e validado.

| Estado/evento | Memória e interface | Saída permitida |
|---|---|---|
| carregando | Preservar contexto anterior até validar; não aceitar edição no destino | Sucesso abre; erro retorna à lista e libera nova tentativa |
| salvando | Candidato conservado; bloquear mutações, undo/redo, troca/fechamento pelo aplicativo e novos uploads | Confirmação inicia cálculo quando necessário; erro passa a falhou/incerto |
| salvo | Revisão e momento confirmados; liberar edição após cálculo terminar | Próxima alteração parte dessa revisão |
| incerto | Timeout, interrupção, resposta ilegível ou 5xx após envio; mostrar confirmação pendente, sem afirmar rollback | Consultar/repetir mesma operação; download em memória após cessar o envio local |
| falhou | Rejeição conhecida ou indisponibilidade; candidato não salvo preservado | Tentar novamente quando aplicável; corrigir por retorno explícito ao último confirmado; baixar |
| sessão expirada | Suspender gravação sem limpar candidato/histórico | Reautenticar mesma conta e conciliar operação/revisão; outra conta não retoma candidato; se resposta do código se perdeu, consultar sessão ou solicitar novo código |
| conflito | Manter candidato e indicar versão remota mais recente; não oferecer sobrescrever forçado | Baixar candidato; abrir versão remota com descarte confirmado |
| acesso removido/projeto excluído | Bloquear mutações e não recriar remoto por retry | Baixar candidato ainda em memória; voltar após descarte explícito |
| falha do cálculo após save | Intenção já salva, resultado ausente/desatualizado; continuidade de grautes conforme contrato | Recalcular sem nova gravação ou baixar; não rotular como falha de salvamento |
| exclusão da conta incerta | Sessão pode já estar revogada; não anunciar exclusão cancelada ou login concluído | Consultar somente o recibo de exclusão com credencial específica, sem acesso aos projetos; conforme Autenticação |

Desconexão detectada em repouso suspende novos gestos/mutações; evento online sozinho não comprova servidor disponível nem resolve operação pendente. Revalidação antes de retomar não sobrescreve a memória sem decisão. Sem fila offline, polling constante ou merge. Leitura/navegação/zoom e recuperação permanecem disponíveis, sem transformar edição bloqueada em somente leitura salva.

Falha conhecida de validação/cota não habilita acumular outras edições: oferecer baixar e restaurar o último confirmado com descarte explícito, para então corrigir um novo candidato. Novo operationId é usado para novo conteúdo, nunca para repetição do mesmo pedido. Descarte de operação incerta exige conciliação antes de tratar a revisão anterior como vigente. Cálculo não começa repetidamente ao consultar recibo; histórico e revisão não avançam duas vezes.

Manter checkpoint da última intenção confirmada para a revisão, com recursos em memória e posições das pilhas de desfazer/refazer anteriores à tentativa. A tentativa continua como candidato não salvo quando falha; não removê-la silenciosamente. Ao escolher descartar após rejeição conhecida, restaurar documento, recursos e pilhas juntos, sem enviar nova gravação e sem deixar a tentativa rejeitada reaparecer por refazer. Uma confirmação registra a operação de usuário exatamente uma vez, inclusive se obtida por consulta de recibo. Undo/redo que falha conserva candidato e posições de recuperação; descartar restaura as pilhas anteriores à tentativa, não troca seu sentido duas vezes. Atualização do cálculo local pode atualizar o resultado associado ao checkpoint sem mudar revisão/histórico remoto.

Em conflito, não usar checkpoint antigo para reabrir edição sem conferir a revisão do servidor. Escolher abrir remoto substitui documento e recursos e inicia histórico vazio da revisão carregada, após confirmação de descarte do candidato local. Repetir uma operação incerta não exige que o candidato ainda seja editável; o pedido capturado permanece imutável até conciliar. Pedido fora da janela de 24 h sem recibo não é reenviado automaticamente: conferir revisão/estado e resolver descarte ou nova ação explícita, preservando download, sem pressupor que recibo ausente prova inexistência de efeito.

Fechar/trocar projeto, sair ou trocar conta com candidato não salvo exige escolha explícita: permanecer, baixar ou descartar. Baixar não prova arquivo gravado no dispositivo e não equivale a consentir descarte. Se houver pedido em voo, primeiro resolver sua situação ou informar que seu efeito pode se confirmar no servidor, sem permitir nova edição baseada em revisão antiga. Encerramento/reload do navegador pode perder memória; beforeunload é aviso de melhor esforço, sem garantia de recuperação. Não persistir automaticamente o candidato no IndexedDB como sincronização oculta.

Reautenticação por código usa diálogo na própria página editora, sem navegar/recarregar. Mesmo usuário: conferir recibo e revisão; não reenviar cegamente. Usuário diferente: bloquear candidato da conta anterior até recuperar/descartar, depois limpar caches privados antes de abrir novo contexto. Histórico permanece apenas na sessão da conta/projeto; undo/redo é nova gravação remota sobre a revisão atual, sem restaurar números de revisão antigos.

## Intenção, resultado e sessão

Zustand coordena documento confirmado, resultado gerado e estado transitório de interface. Componentes assinam os campos necessários. Cursor, câmera, seleção, pavimento/fiada ativos, rascunhos, comparação, diálogos e preferências de apresentação não duplicam o documento persistido. O domínio não depende de Zustand. Estado busy impede operações sobrepostas, sem fila ou execução concorrente.

## Classificação de operações

| Operação | Persistência e histórico | Composição |
|---|---|---|
| Mudança de insumos construtivos: base/configurações, geometria de pavimentos/paredes/vãos/lajes ou ajustes | Salvar intenção, registrar uma operação | Invalidar e recalcular o projeto inteiro |
| Renomeação; edição exclusiva de medidas, referência raster, terreno ou mobiliários; aparência de esquadrias | Salvar e registrar uma operação quando houver mudança | Preservar resultado e diagnósticos, inclusive já desatualizados |
| Seleção, câmera, troca de pavimento/fiada, hover, prévia e consulta de quantitativos | Não salvar nem registrar intenção | Não recalcular |
| Preferências globais de apresentação | Gravar somente no armazenamento de preferências | Não recalcular |

A comparação de insumos exclui terrain, measurements, referenceImages, imageElements, customImageAssets e opening.appearance; nomes dos pavimentos também são excluídos, mantendo id/level/defaultHeight. Mudança de altura padrão segue a comparação construtiva existente. Uma edição visual não promove resultado desatualizado a atual. Não classificar uma operação pela aparência do gesto; comparar os insumos reais antes/depois.

## Fluxo sequencial

Após confirmar e validar um candidato construtivo: registrar a intenção, marcar generated=null/status=outdated e limpar diagnósticos derivados; salvar intenção; permitir a pintura do estado de processamento; gerar o projeto inteiro sincronamente; substituir o resultado completo somente em memória, sem segunda gravação. Aguardar a confirmação remota, sem temporizador de salvamento, Worker, orçamento ou fila. Erro de salvamento conserva memória/download; exceção do motor conserva intenção e resultado ausente/desatualizado. Sempre liberar controles. Erro geométrico diagnosticado é resultado concluído, não exceção de execução.

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
