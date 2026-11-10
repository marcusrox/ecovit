# Persistência e compatibilidade

[Índice da arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [PRD](../Ecovit-PRD.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md)

## M12 — persistência remota

O servidor mantém os projetos privados por conta. A identidade segue [Autenticação e acesso](Autenticacao-e-Acesso.md) e os formatos .ecovit seguem a matriz de leitores deste documento.

### Aplicação e infraestrutura

Frontend estático existente e API TypeScript/Node no mesmo repositório e domínio, publicada por proxy reverso HTTPS no servidor administrado pelo aaPanel. API acessa PostgreSQL e diretório privado de imagens no mesmo servidor. PostgreSQL não é exposto ao navegador; o cliente não recebe senha SQL. Reaproveitar domínio/validadores TypeScript sem importar UI/estado/Dexie na API. Não criar microserviços, Redis, fila, WebSocket ou serviço pago obrigatório sem necessidade da entrega.

Ambiente definido pelo solicitante: host emdia.idevs.com.br, Node 24.18 e PostgreSQL versão 18.0; servidor não inspecionado. Node 24.x LTS é a linha-alvo do backend, com patch completo fixado/testado na implementação. PostgreSQL 18.0 é o único banco-alvo desta entrega, sem camada de compatibilidade com outros produtos. M12 cria banco/schema próprios na instância disponibilizada pelo administrador; não instala ou migra automaticamente bancos de outros aplicativos. A escolha de versão não comprova instalação, acesso ou homologação.

A origem pública é https://ecovit.idevs.com.br, com frontend e /api no mesmo endereço e hospedagem em emdia.idevs.com.br. O DNS passa pelo Cloudflare. A validação da publicação e da saúde da API em HTTPS está registrada no [arquivo do M12](../arquivo/marcos/M12-Contas-e-Persistencia-Remota.md#aceite-e-verificações). A implementação foi verificada localmente com Fastify 5.12.7, pg 8.23.1 e Sharp 0.35.5 no Node 24.18.0. Os requisitos abaixo orientam a homologação funcional e de capacidade pelo administrador.

### Requisitos para validação pelo administrador

**Referência de dimensionamento:** uso pequeno e uma importação pesada por vez. A capacidade depende do ensaio M12-T08, previsto na [task de homologação operacional](../tasks/T-002-Homologacao-Operacional-Producao.md). Em servidor compartilhado, considerar recursos disponíveis para Ecovit/API/validador/PostgreSQL, além dos já usados por aaPanel/outros sites.

| Item | Base proposta para homologação e implantação inicial |
|---|---|
| Sistema | Linux 64 bits suportado pelo Node 24, PostgreSQL 18.0 e aaPanel, com bibliotecas do decodificador raster escolhido; não exigir distribuição específica antes da seleção das dependências |
| CPU | Pelo menos 2 vCPU disponíveis para API e validação isolada |
| Memória | Orçamento inicial de 4 GiB para Ecovit + PostgreSQL; recomendar 8 GiB para folga em host compartilhado. Disponibilidade total/contenda serão validadas pelo administrador e ensaio; swap não comprova suficiência |
| Disco | SSD com pelo menos 20 GiB livres para início, incluindo dados, uploads temporários, logs e folga SQL; dimensionar expansão com cerca de 2 GiB adicionais por conta cheia como reserva conservadora, não como cota individual nova. Sem reserva para backups nesta especificação |
| Node | Linha 24.x LTS, versão 24.18 informada como ponto de partida; processo supervisionado com reinício e início no boot, bind em loopback; execução de processo filho permitida |
| PostgreSQL | Versão 18.0, banco com encoding UTF8, schema exclusivo e roles separadas de migração/execução; API sem superuser ou criação de schema. E-mail normalizado com unicidade determinística (collation C); acesso por socket/loopback ou rede privada com TLS e autenticação SCRAM-SHA-256 |
| Documento SQL | Coluna json nativa para intenção e metadados textuais derivados; validar ida/volta de documento de até 50 MiB no driver/API, sem ampliar o limite funcional. Não há ajuste de pacote específico de outro banco neste contrato |
| Proxy/HTTPS | Certificado válido e renovação para origem pública; proxy de mesmo domínio; corpo máximo de 64 MiB nas rotas de documento/importação, mantendo arquivo até 50 MiB e imagem até 10 MiB na API. Rotas de código/sessão têm corpo pequeno próprio |
| Tempo de requisição | Proxy com pelo menos 120 s nas rotas pesadas e timeout finito na API/validador abaixo desse valor; fixar limite final em ensaio. Envio Resend tem timeout próprio de 15 s, sem alongar login por causa da importação |
| Arquivos | Diretório privado fora da raiz estática, leitura/escrita/rename/remoção pelo usuário da API, sem privilégio root; cotas/reservas temporárias e detecção de falta de espaço |
| Rede | HTTPS público 443; saída HTTPS 443 para api.resend.com, DNS funcional e relógio sincronizado. PostgreSQL e porta interna da API não precisam ficar públicos; SMTP não é requisito quando usado HTTPS |
| Limpeza | Agendador executa comando do mesmo pacote a cada 15 min, com lock SQL e logs; reinício/atraso não impede retomar pendências nem cumpre automaticamente o prazo de exclusão de 24 h |
| Segredos | Configuração privada de backend para Resend, banco e sessão; valores ausentes do frontend, Git e logs |

Dimensionar shared_buffers, work_mem e max_connections para o orçamento do PostgreSQL em host compartilhado com API/painel; work_mem pode ser usado por múltiplas operações/conexões e não é uma reserva global única. Limitar pool SQL e concorrência do validador na implementação; medir pico de RSS/CPU/disco com fixtures reais, incluindo espaço para WAL e manutenção/autovacuum. Um ambiente que falhe no ensaio precisa de ajuste de recursos/configuração, sem reduzir silenciosamente os aceites do produto. Limites de capacidade pública e quantidade de usuários simultâneos não estão demonstrados por esses números.

### Documento remoto e resultado calculado

Para reduzir escritas e volume, persistir a intenção completa validada e os recursos necessários à sua reconstrução; resultado gerado é derivado e permanece em memória. Abertura remota obtém todos os bytes de recursos próprios necessários ao documento, valida/reconstrói a memória e recompõe no navegador; não marcar abertura concluída com imagens faltantes. Isso preserva download em memória após desconexão. Falha de cálculo não torna a intenção salva inexistente. Não salvar peças/diagnósticos derivados no PostgreSQL nem fazer a segunda gravação somente para armazenar cálculo. Isso muda a representação remota prevista, sem remover o contrato atual de snapshot dos arquivos .ecovit.

Representação remota versão 1, independente de schemaVersion=18 e da versão SQL: contém campos editáveis equivalentes ao documento vigente, com generated=null e estado outdated, e substitui bytes base64 por referências privadas aos recursos confirmados. Validar schema estrito próprio desta representação; não enviar esse DTO diretamente ao leitor de .ecovit. Um adaptador explícito reconstrói o documento vigente com imagens para domínio/exportação. Não inserir URLs, proprietário ou revisões de servidor no modelo geométrico. Recusar formatos remotos desconhecidos antes de alterar a memória.

Server-side: validar intenção, referências, modularidade, limites e conteúdo real de novos recursos em toda mutação. Não confiar apenas no Zod/frontend. Gravação comum não recebe resultado derivado. Importação de .ecovit com resultado presente passa também pela conferência integral vigente, inclusive recomputação para recusar adulteração; compartilhar a validação existente no servidor. Após validação, extrair intenção para o remoto. Não remover snapshot suspeito antes de validar.

Funções puras de parse/validação/serialização ficam em document.ts; File, Image e download permanecem na camada de navegador. Compartilhar arquivos por import não autoriza chamar APIs DOM na API. Conteúdo raster passa por inspeção e decodificação real com Sharp no servidor, sem reencodar os bytes. Decodificação em Chrome/Edge continua verificação do cliente, não substitui a do servidor; dimensões e memória têm limites próprios.

Importação com recomputação não pode bloquear o processo que atende sessões/saídas. Executar validação custosa em processo filho isolado da mesma API, com uma execução por instância inicialmente, sem fila; excesso recebe indisponibilidade temporária/Retry-After. Aplicar os limites de tempo/memória descritos em Operação e implantação, encerrando a validação sem commit quando excedidos. A homologação dos recursos no servidor segue M12-T01. Não prometer que toda entrada estruturalmente válida cabe no servidor. Isso não altera limites geométricos ou usa Worker no editor. Sem microserviço ou gerador alternativo.

Preservar envelope .ecovit 18 e leitores 9–18; API/SQL têm versões próprias. Exportação reúne intenção, uploads privados e resultado atual quando aplicável, seguindo a redução vigente sem resultado se necessário. Catálogos padrão permanecem referências estáticas. Importação ordinária cria novo projeto independente; nunca atualiza um remoto só porque o arquivo tem o mesmo UUID. IDs internos são preservados; identidade remota de projeto é um novo UUID gerado pelo cliente e aceito somente após validação de unicidade pela API; não representa permissão de acesso.

### Modelo de armazenamento

| Registro | Dados e restrições essenciais |
|---|---|
| Conta/desafio/sessão | Conforme Autenticação e acesso; UUID interno, unicidade do e-mail normalizado e estado active/deleting |
| Projeto | UUID, ownerId, nome/listagem, versão remota, versão de envelope de origem, intenção em coluna json nativa, revisão inteira crescente, datas do servidor e estado active/trashed/purging com trashedAt/purgeAfter; transações PostgreSQL |
| Upload temporário/recurso privado | UUID, conta/projeto de destino, caminho interno, MIME, tamanho/reserva, hash SHA-256 e dimensões; upload tem indicação de conclusão, recurso associado é imutável |
| Associação projeto–recurso | Recursos utilizados na revisão corrente; conferência de propriedade/pertencimento, sem referências livres a arquivos de outras contas |
| Recibo de mutação | ownerId, operationId UUID recebido do cliente, tipo/alvo, requestIssuedAt, horário do servidor, hash canônico e resultado/revisão; unicidade por conta/operação, sem registro prepared |

Não normalizar paredes, peças e vãos em tabelas. Metadados de lista são derivados da intenção validada, não valores concorrentes enviados livremente. IDs usam uuid; datas usam timestamptz, geradas no servidor e expostas como ISO-8601 UTC. Revisões/contadores usam bigint; revisão trafega como string decimal validada, sem conversão insegura para number em JavaScript. Credenciais/hashes binários usam bytea quando pertinente, nunca conteúdo do arquivo .ecovit. Conferir mapeamentos do driver antes de fixá-lo.

UUIDs de rotas, operações e referências privadas são normalizados para minúsculas na entrada, compatíveis com a representação do PostgreSQL e os nomes de arquivo em sistemas sensíveis a caixa. Isso não remapeia IDs internos do desenho nem altera o arquivo importado. DATA_DIR é exclusivo do Ecovit: a limpeza não deve receber um diretório compartilhado com arquivos de outros aplicativos.

Usar json, em vez de jsonb, para o documento e nomes/metadados textuais provenientes dele: não há consulta/indexação interna do desenho nesta entrega, e json preserva o JSON recebido, inclusive escapes Unicode aceitos pelo formato vigente que jsonb restringe. Não extrair nomes arbitrários para coluna text ou operador de conversão SQL que rejeite escape de caractere nulo; transportar os metadados de apresentação como json e decodificar no adaptador. E-mail normalizado é ASCII e pode usar text com comparação determinística. Não introduzir rejeição silenciosa de arquivo suportado por mudar o banco; testar caracteres escapados, números e geometria na ida/volta. Hash canônico é calculado pela API, sem depender da ordenação/conversão de JSON no banco. Escolha de jsonb futura exigiria rever esse contrato de compatibilidade.

Limite por projeto é verificado também como intenção de transporte reconstruída com base64; separar arquivos no servidor não autoriza ultrapassar os 50 MiB vigentes. Conferir limites do driver, corpo do proxy/API, memória e precisão de ida/volta dos números com fixtures reais máximas antes de publicar; limite físico do PostgreSQL não é limite funcional do Ecovit.

### Revisão, atomicidade e respostas perdidas

Uma chamada de gravação por alteração confirmada. O cliente gera operationId UUID e captura requestIssuedAt; envia intenção, referências de imagens e expectedRevision para projeto existente. Não existe endpoint de preparação da operação nem emissão prévia de ID pelo servidor. Um único cliente HTTP do aplicativo monta/captura o pedido imutável e trata salvar, undo/redo, renomear e demais mutações. Login/desafios e saída seguem o contrato próprio de autenticação.

O identificador não concede acesso: o servidor deriva a conta da sessão e verifica propriedade/estado do alvo. Na mesma transação PostgreSQL que confirma a mutação, guardar recibo único por conta/operationId, hash canônico do pedido, revisão e horário. Mesmo ID e mesmo conteúdo retornam recibo anterior; mesmo ID com conteúdo diferente é recusado. Hash inclui tipo/rota, alvo, revisão esperada, requestIssuedAt e conteúdo; não inclui cookie, CSRF ou identificador de diagnóstico, permitindo reautenticação da mesma conta. Ordenar chaves dos objetos e preservar arrays; não depender da ordenação do JSON do banco.

Retenção de recibos: 30 dias. Para pedido ainda sem recibo, o servidor só aceita requestIssuedAt dentro das últimas 24 h e até cinco minutos no futuro, verificando novamente no commit. O cliente usa referência de horário já devolvida na sessão/leitura, sem chamada extra por alteração; preservar o horário original no retry. Essa data limita pedidos atrasados e não autentica usuário, autoriza recurso ou substitui cotas. Após 24 h, primeiro consultar eventual recibo; sem confirmação, tratar como expirado e conferir versão/estado antes de nova decisão. Nunca trocar ID/data automaticamente para contornar expiração ou tornar um pedido incerto executável. Idempotência tem janela documentada, não retenção infinita.

Usar BEGIN/COMMIT/ROLLBACK na mesma conexão do pool, isolamento READ COMMITTED, locks curtos em conta/sessão/projeto e UPDATE condicionado à revisão; UNIQUE/FK/CHECK completam as verificações. Cotas e referências são conferidas na transação, sem manter locks durante upload/validação. Revalidar conta active, sessão válida e estado do projeto no commit, coordenado com logout/lixeira/exclusão; escrita posterior à revogação não passa. Dois pedidos concorrentes com mesmo ID produzem um único efeito e recibo. Deadlock exige rollback completo e retry/consulta pelo mesmo ID, nunca repetir só metade da transação.

Timeout, resposta incompleta ou 5xx após envio pode ocorrer depois do commit. Manter candidato e bloquear novas mutações; consultar recibo ou repetir exatamente o pedido original. Recibo ausente pode significar pedido em andamento. Confirmar um recibo antigo não torna sua revisão a mais recente: conferir versão/estado atual antes de retomar edição. Rejeição íntegra com ausência de commit permite corrigir/descartar; não classificar todo 5xx como rejeição conhecida. Todos esses resultados passam pelo mesmo tratamento do editor em Estado, histórico e operações.

Criação/importação/duplicação usa novo UUID de projeto gerado pelo cliente no início da ação e conservado no retry; a API valida formato, unicidade e cota, sem upsert. UUID recebido nunca permite assumir propriedade nem substituir projeto existente. Abertura de projeto/recibo/imagens continua exigindo sessão e autorização. Exclusão da conta conserva apenas a exceção de consulta restrita descrita em Autenticação, necessária após revogar a própria sessão.

### Superfície lógica da API

Rotas HTTP implementadas; autenticação e exclusão da conta têm contrato próprio em Autenticação e acesso:

| Operação | Contrato |
|---|---|
| GET /api/session; POST /api/auth/code, /api/auth/verify, /api/logout | Sessão/códigos conforme Autenticação e acesso |
| GET /api/projects e /api/projects/:id | Metadados autorizados; documento com revisão e recursos privados; sem cálculo pela API na leitura comum |
| POST /api/projects/:id e /api/projects/:id/duplicate | POST idempotente; cópia usa revisão explícita da origem e novo ID; cancelamento não cria projeto |
| PUT /api/projects/:id; POST /api/projects/:id/trash, /restore, /purge | Revisão obrigatória, confirmação atômica; sem recriação implícita e sem edição na lixeira |
| GET /api/operations/:id | Recibo da própria conta; inexistente não comprova ausência de pedido ainda em execução |
| POST /api/uploads/:project/:asset; GET /api/images/:project/:asset | Somente para bytes novos: upload completo, validado e idempotente por uploadId; download privado autorizado |
| POST /api/account/delete e /api/account/deletion-receipt | Código novo de finalidade exclusiva, confirmação e revogação imediata; limpeza idempotente conforme D08 |

Erros estruturados com código estável, mensagem em português e requestId; sem stack/SQL/segredo. Distinguir 401, 404 privado uniforme, 409 de revisão/operação, 413 tamanho, 422 conteúdo, 429 limite de frequência e 5xx transitório. Cota de conta tem código próprio, não é confundida com falha de cálculo ou falta de conexão. Não repetir automaticamente toda falha 4xx.

### Imagens, cotas e limpeza

Documento sem imagem nova faz somente a chamada de gravação. Imagens já salvas são referências privadas, sem reenviar bytes a cada movimento, salvar ou recalcular. Quando houver bytes novos, enviar primeiro um upload completo e depois confirmar o documento. Sem upload por partes, retomada parcial ou máquina genérica de estados de recursos. O UUID do novo projeto já é conhecido pelo cliente, permitindo upload temporário antes da criação sem reservar cartão ou vaga antecipadamente.

Manter um registro pequeno de upload temporário por conta/uploadId, com projeto de destino, tamanho reservado, hash esperado, caminho interno e indicação de conclusão. A mesma chamada de upload reserva cota antes de gravar e valida bytes PNG/JPEG, dimensões e limites antes de marcar pronto; não há chamada separada para pedir autorização de upload. Mesmo uploadId/hash retorna o arquivo pronto ou permite reiniciar envio interrompido inteiro, sem reserva duplicada; dois pedidos não escrevem o mesmo arquivo simultaneamente. Conteúdo diferente com mesmo ID é recusado. Caminhos são gerados pela API, nunca usados a partir do nome enviado.

Salvar o documento associa os uploads prontos ao projeto na mesma transação de intenção/revisão/recibo, conferindo conta, destino, cota e presença do arquivo. Antes disso, não há projeto parcial nem referência confirmada a arquivo incompleto. Arquivos associados são privados e imutáveis; bytes novos geram novo recurso. Não há transação distribuída entre disco e SQL: publicar arquivo validado antes de associar e limpar sobras depois. Limpeza coordena com a associação no banco para não apagar arquivo que acaba de ser referenciado. Deduplicação/reuso fica limitado ao mesmo projeto; sem armazenamento compartilhado entre contas.

Upload temporário expira 24 h após sua criação no servidor. Falha definitiva/cancelamento inicia limpeza; reserva só é liberada após remover temporários, uma vez. Imagem associada e depois removida do documento permanece sete dias sem referência para facilitar undo. Se já tiver sido limpa, reenviar os bytes preservados na memória do histórico, sujeito a cota/conexão. Não manter heartbeat ou retenção infinita de histórico no servidor.

Uma única rotina agendada do mesmo aplicativo limpa temporários vencidos, imagens sem referência, lixeira expirada, contas em exclusão e registros vencidos de sessão/código/recibo, com as prioridades e coordenação da seção Lixeira e exclusão. Não criar serviço/fila por tipo de recurso.

Cotas: 20 projetos e 500 MiB (524.288.000 bytes) de imagens privadas por conta. Lixeira conta até eliminação. Upload em curso conta a reserva; arquivo pronto/associado/em retenção conta bytes sem somar reserva novamente. Catálogo não conta. Duplicação/importação cobra novo projeto e cópias de seus recursos. Conferir limites atomicamente sob concorrência. Conta acima de cota reduzida ainda pode renomear/remover sem aumento de uso; liberar bytes retidos só após limpeza efetiva, informando prazo. Não apagar projetos por redução de cota.

### Transição por arquivo e transporte

Para transferir um projeto salvo em uma instalação com armazenamento local, exporte o .ecovit nessa instalação e importe um arquivo suportado na conta de destino. O aplicativo remoto opera sobre arquivos importados e projetos do servidor. Os dados IndexedDB permanecem no navegador de origem.

Importação manual: mostrar conta de destino, validar envelope e imagens com as regras vigentes no cliente e servidor, verificar cotas, enviar recursos e confirmar projeto/recibo atomicamente. Novos IDs remotos, IDs internos preservados; arquivo de origem nunca é alterado. Repetir a mesma operação retorna recibo sem duplicar; nova seleção/importação explícita do mesmo arquivo pode criar nova cópia, sem deduplicação global ou correlação de origens. Não sobrescrever projeto existente pelo UUID do arquivo. Falha conserva o arquivo do usuário e os remotos anteriores.

Cancelamento antes do envio não cria projeto; após envio, tratar eventual commit com o contrato de operação incerta, sem anunciar cancelamento concluído enquanto a confirmação não for conhecida. Não implementar lote de importação nesta entrega; uma importação de cada vez reduz estados e mantém o fluxo sequencial vigente.

Arquivo incompatível/corrompido é recusado por inteiro, sem converter parcialmente. Envelope 1–8 não recebe novo conversor. Não há descoberta de projetos de outra origem/navegador nem recuperação de projeto não exportado pela nova versão. Download .ecovit autenticado reúne imagens mesmo que não estejam decodificadas no canvas; falha ao obter recurso impede anunciar arquivo completo. Se recursos necessários ao candidato já estiverem em memória após desconexão, permitir exportá-lo sem depender de nova leitura da rede.

### Lixeira e exclusão

Projeto removido vai à lixeira privada da conta; não abre no editor nem aceita save/duplicação/novos recursos. Lista ativa omite itens trashed, lista de lixeira oferece nome, momento de descarte/prazo, restaurar e excluir definitivamente. Decisão D07: expiração em 30 dias de relógio do servidor; restaurar antes da expiração muda para active, limpa prazo e incrementa revisão, sem recuperar número antigo. Nova ida à lixeira inicia novo prazo. Não há lixeira por pavimento/elemento.

Mandar para lixeira exige confirmação e expectedRevision; resposta informa prazo. Restaurar/excluir também exige revisão, acesso e estado esperado; corrida entre restauração e purga tem um vencedor transacional. Ao vencer prazo, estado é tratado como não restaurável mesmo antes da execução da rotina de limpeza. Nomes privados incluem UUID da conta e do recurso, derivados pelo servidor, permitindo limpar também arquivos sem linha SQL após exclusão da conta, sem esperar a retenção de órfãos de contas ativas. Rotina simples agendada marca purging e elimina documento/associações/arquivos, retomando se SQL/disco falharem; sem ressuscitar projeto por requisição antiga. Exclusão definitiva antes do prazo exige confirmação explícita e marca purging; acesso cessa imediatamente, limpeza física é assíncrona. Cota é liberada conforme a eliminação confirmada, sem anunciar liberação de bytes ainda existentes.

Rotina operacional do Ecovit executada por comando do mesmo pacote via agendador do aaPanel a cada 15 minutos; processar itens vencidos por relógio UTC do servidor e repetir com segurança após interrupção. Lock no banco impede duas limpezas de atuarem no mesmo lote. Alerta/log de falha e indicador de última execução permitem detectar atraso; a implantação verifica que a rotina roda antes da liberação. Prazo de 24 h da exclusão de conta é requisito a validar, não efeito presumido do agendamento. Esta rotina limpa dados ativos do aplicativo e não administra backup.

Enquanto em lixeira, manter intenção e recursos para restauração; não aplicar limpeza de imagens órfãs às referências do projeto descartado. Download .ecovit pela lixeira é permitido ao proprietário antes da expiração; não equivale a restaurar nem a consentir exclusão. Histórico de sessão antiga não permite restaurar projeto remoto purgado; conservar eventual documento em memória apenas para download e descarte explícito.

Exclusão da conta ignora o prazo da lixeira e inclui projetos descartados, uploads temporários e registros privados, conforme [Autenticação e acesso](Autenticacao-e-Acesso.md). Código e confirmação são distintos de excluir um projeto. Política de backup do servidor é exclusivamente do administrador, fora da especificação do Ecovit: sem tarefas/aceites de frequência, retenção, destino, restauração ou RPO/RTO em M12. Lixeira é funcionalidade do aplicativo e não representa backup de servidor.

Fontes: PostgreSQL 18 — [JSON](https://www.postgresql.org/docs/18/datatype-json.html), [isolamento](https://www.postgresql.org/docs/18/transaction-iso.html), [locks](https://www.postgresql.org/docs/18/explicit-locking.html), [conexões](https://www.postgresql.org/docs/18/runtime-config-connection.html), [limites físicos](https://www.postgresql.org/docs/18/limits.html) — e [linhas Node LTS](https://nodejs.org/en/about/previous-releases). Versão 18.0 definida pelo solicitante; as referências da linha 18 não comprovam instalação/homologação. Dimensionamento é recomendação própria a validar.

## Formato e leitores vigentes

Arquivo JSON UTF-8 com extensão .ecovit e format="ecovit". Gravação usa schemaVersion=18; leitura aceita somente envelopes 9–18. O envelope não versiona as regras construtivas: a composição vigente é nominal-v10. Versões 1–8 e desconhecidas são recusadas antes de substituir o trabalho aberto; arquivos incompatíveis não substituem o trabalho aberto; registros IndexedDB anteriores não são consultados nem apagados.

| Envelope lido | Normalização em memória para 18 |
|---|---|
| 9 | Acrescentar measurements, referenceImages, imageElements e customImageAssets vazios |
| 10 | Acrescentar referenceImages, imageElements e customImageAssets vazios |
| 11–12 | Acrescentar imageElements e customImageAssets vazios |
| 13–14 | Preservar ocorrências/recursos e geometria; sem espelhamento quando os campos estão ausentes |
| 15 | Preservar flags opcionais de espelhamento; medidas sem afastamento |
| 16 | Preservar afastamento opcional das medidas |
| 17 | Preservar terreno ou null, sem rosa dos ventos |
| 18 | Validar diretamente o contrato vigente, incluindo rosa dos ventos opcional no terreno |

Envelopes 9–16 recebem model.terrain=null em memória; recusar esse campo nesses formatos, inclusive null. O formato 17 persiste a intenção global do terreno e sua revisão de material, sem bytes de textura ou rasterização da área. O catálogo de aparências inclui soft (Verde suave) na revisão 1, já suportado no contrato 17 e preservado em 18. Leitores anteriores que não conheçam soft podem recusar essa aparência; não substituí-la silenciosamente. Os cinco materiais anteriores permanecem válidos. Revisão/material desconhecidos e anéis inválidos são recusados. O formato 17 conserva composição nominal-v10; aplicativos anteriores podem recusá-lo.

Preservar a origem, IDs internos, ajustes e aparência genérica opcional das esquadrias; não inferir tipo físico. Recusar campos novos disfarçados como formato anterior, UUIDs duplicados, referências órfãs, combinações inválidas e dados desconhecidos. Normalização não deve modificar o objeto original nem o arquivo fonte. O formato 14 introduziu dimensões independentes de mobiliários; arquivos 13 preservam sua geometria. O formato 15 acrescenta flipX/flipY opcionais booleanos por ocorrência; ausência significa false. Recusar esses campos em envelopes 9–14, mesmo com false, e valores não booleanos nos formatos vigentes. O formato 16 acrescenta `offset` opcional inteiro com sinal em cada medida; ausência significa zero, preservando medidas antigas sobre seus segmentos. Recusar esse campo em envelopes 9–15, inclusive zero; validar também os limites da linha deslocada. Leitura normaliza somente em memória, sem alterar a origem; gravação posterior usa 18. Aplicativos que só leem até 15 recusam arquivos 16, sem perda silenciosa do afastamento. Detalhes dos tipos têm fonte nos documentos de elementos.

## Envelope e validade

Campos obrigatórios: format, schemaVersion, project, model, adjustments, generated, generationState e metadata. project contém identificação, unidades/base, origem, referência inicial opcional de altura e configurações comuns; model contém terrain/floors/walls/openings/slabs/measurements/referenceImages/imageElements/customImageAssets; adjustments contém junctions/channels/grout. Não persistir DOM/Konva, funções, câmera, histórico ou rascunhos. A versão de migração SQL e remoteVersion são independentes de schemaVersion.

Validar com Zod e funções de domínio a estrutura estrita, relações, conteúdo de imagens, transformações e limites antes de substituir o projeto atual. Pendência geométrica íntegra pode ser transportada; laje inválida não é rascunho persistível. Um documento current exige resultado completo nominal-v10 por pavimento, diagnósticos agregados iguais aos do estado e conferência exata por recomputação, não apenas contagem de peças. Outdated exige generated=null e diagnósticos derivados vazios.

O formato 18 acrescenta terrain.compass opcional, com visible, center, size e angle; ausência significa rosa desligada, sem transformação prévia. Ocultar conserva os ajustes no arquivo. Recusar compass em envelopes 9–17, inclusive null ou visible=false; normalizar os arquivos antigos somente em memória, sem alterar sua origem. Validar estrutura estrita, finitude, precisão, tamanho e caixa rotacionada mesmo quando oculta. Leitores limitados a 17 recusam arquivos 18, sem perda silenciosa da orientação gráfica. Não serializar desenho vetorial, alças ou estado do gesto. A rosa acompanha a cópia do projeto e o terreno global entre pavimentos; exclusão do terreno remove sua configuração, restaurável pelo histórico.

<a id="atualização-de-cálculo-e-somente-leitura"></a>
<a id="armazenamento-falhas-e-sessão-de-edição"></a>

## Abertura, cálculo e sessão de edição

Documento remoto tem generated=null e estado outdated. O editor valida a intenção e decodifica imagens antes de substituir o trabalho aberto; recompõe em memória sem escrever resultado. Importação de snapshot atual exige conferência por recomputação; nominal-v9 aceito é descartado e recomposto pelo motor atual, preservando intenção e arquivo original. Não existe gerador legado. Falha de cálculo conserva intenção/download e permite Recalcular sem nova gravação.

A lista chama useStore.open(projectId). O store ativa busy/openingProjectId sincronamente e permite pintar o feedback antes da leitura. Abertura repetida do ID ativo é idempotente e não substitui candidato/histórico. Criação/importação usam open(documento, true). Troca com candidato não salvo depende de descarte explícito na interface. Hot reload aguarda operação em voo e impede novas escritas do store descartado. Sem Web Lock por projeto; concorrência é arbitrada pela revisão remota.

Câmera e preferências podem ficar no armazenamento local, sem projeto, credencial, fila offline ou sincronização oculta. Histórico permanece somente na sessão, conforme Estado, histórico e operações.

## Transporte e limites

Download usa o documento em memória e recursos já carregados, inclusive quando o save falha. Serialização respeita 50 MiB; omite resultado dispensável se necessário, preservando intenção e informando a omissão. Se a intenção exceder o limite, recusar sem gerar arquivo truncado. Importação cria novo UUID e não modifica arquivo ou projeto remoto anterior; o servidor confere novamente estrutura, recursos, cotas e snapshot recebido. Bytes raster são preservados, sem reencodificação no servidor.

## Cópia de projeto

Duplicação parte da intenção e revisão confirmadas da origem, com nome e UUID novos. Copiar imagens para recursos privados independentes, conferir cotas e associar documento/recursos na transação. IDs internos da geometria/ajustes permanecem locais ao documento e são conservados. Resultado é recomposto ao abrir a cópia; histórico/câmera da origem não são copiados. Retry usa a mesma operação e devolve o mesmo projeto. Cancelamento antes do pedido não cria cartão; falha ou resultado incerto nunca anuncia cópia concluída sem confirmação.

<a id="exclusão-local"></a>

## Exclusão e lixeira

O diálogo da lista oferece Cancelar (foco inicial), Baixar backup e Enviar à lixeira, separados. Download não comprova que o arquivo foi salvo e não confirma remoção. A remoção segue a revisão/estado do servidor, inclusive quando existe outra aba aberta; uma aba antiga não pode recriar o projeto. Sucesso fecha o diálogo e retira o cartão com a animação existente, respeitando movimento reduzido. Falha conserva diálogo e ações de recuperação. Lixeira/exclusão física seguem a seção M12; não existe exclusão de registro local pela nova versão.

Implementação: src/persistence/document.ts, files.ts, remote-document.ts, http.ts, remote.ts; src/state/store.ts e server/.

## Operação e implantação

O ambiente de produção usa HTTPS, PostgreSQL 18 e Resend. A instalação e a homologação funcional incluem os recursos e as permissões da instância. Uma instância da API e no máximo uma validação pesada por vez, sem fila. Validador: 90 s e heap V8 de 1 GiB; raster até 16 milhões de pixels. Resposta da API limitada a 100 s, cliente a 110 s e proxy a pelo menos 120 s; recepção/conexão da API têm 120 s. Pool máximo de cinco conexões: conexão/lock SQL até 5 s, cada statement até 15 s e sessão ociosa em transação até 15 s. Falha/timeout pode exigir conciliação pelo mesmo identificador, sem afirmar rollback. Esse teto de heap não é limite de memória total do sistema. O dimensionamento proposto acima continua sujeito a ensaio no servidor compartilhado.

Antes de ler/interpretar os corpos, admitir no máximo dois pedidos simultâneos de documento, duplicação ou upload por instância; o excesso recebe 429, sem fila. Dentro desse orçamento, limitar a uma validação pesada e um upload em execução. Manter a vaga até terminar o trabalho, inclusive após timeout/desconexão. Imagens privadas têm no máximo quatro respostas simultâneas, com leitura cancelada quando a conexão fecha. Esses limites contêm carga/memória e não criam novos serviços; leituras comuns de metadados e autenticação permanecem separadas.

### Configuração e banco

Usar Node 24.x e npm ci com o lockfile. Copiar .env.example para arquivo privado .env, preencher DATABASE_URL da role de execução, APP_ORIGIN, DATA_DIR absoluto fora de dist, SESSION_SECRET aleatório, RESEND_API_KEY e MAIL_FROM. Nunca usar prefixo VITE_ para esses valores. Restringir o arquivo e diretório ao usuário do serviço, sem root. Gerar o segredo com node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"; não compartilhar a saída em mensagens ou versioná-la.

Administrador cria banco UTF8 exclusivo ecovit e roles distintas ecovit_owner e ecovit, com senhas SCRAM e conexão privada. A role owner executa a migração; a role da API não é superuser, dona do banco/schema nem possui CREATE. Exemplo de concessões no banco dedicado, executadas pelo administrador após a migração (ajustar nomes se necessário):

Em uma instalação nova, conectado como administrador ao banco postgres, criar as roles e o banco antes de migrar. Substituir as senhas abaixo localmente, sem versionar ou compartilhar:

```sql
CREATE ROLE ecovit_owner LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD 'SENHA_PRIVADA_OWNER';
CREATE ROLE ecovit LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD 'SENHA_PRIVADA_API';
CREATE DATABASE ecovit OWNER ecovit_owner ENCODING 'UTF8' TEMPLATE template0;
```

Configurar DATABASE_URL com ecovit e DATABASE_MIGRATION_URL temporário com ecovit_owner; aplicar db:migrate. Depois, conectado ao banco ecovit como administrador/proprietário, conceder:

```sql
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE ecovit TO ecovit;
GRANT USAGE ON SCHEMA public TO ecovit;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ecovit;
REVOKE ALL ON TABLE ecovit_migrations FROM ecovit;
```

A migração usa DATABASE_MIGRATION_URL quando fornecida, apenas no comando db:migrate. Fornecer essa credencial temporariamente ao processo administrativo; não conservá-la no ambiente do serviço. Não executar migração automaticamente a cada requisição/startup. O comando confere PostgreSQL da linha 18 e aplica schema.sql em transação com lock, registrando versão 1. Reexecução da migração inicial preserva dados. Comandos no diretório do projeto:

```sh
npm run db:migrate
npm run build
npm run api:start
```

O build gera dist e dist-server, incluindo schema.sql e validate-worker.mjs. Instalar dependências no Linux do servidor para obter o binário de Sharp compatível. No aaPanel, cadastrar um projeto Node.js do tipo PM2, com app.js como Startup File e raiz do repositório como Run Directory. O app.js é também a entrada de npm run api:start. Ele carrega o .env do diretório de trabalho antes de iniciar dist-server/main.mjs. Usar Node da linha 24, NODE_ENV=production, uma instância, reinício e início no boot. Neste servidor, o usuário Linux de execução é www. O checkout, o .env com modo 0600 e o DATA_DIR com modo 0700 pertencem a www. Processos executados com o mesmo usuário Linux compartilham suas permissões de acesso. As roles PostgreSQL de migração e execução continuam independentes do usuário Linux. A API escuta em 127.0.0.1:3001 (API_PORT configurável). Validar /api/health e falha de conexão ao banco sem revelar detalhes.

O fluxo de atualização obtém a revisão aprovada, instala dependências com o lockfile, verifica tipos e compila frontend e API antes de reiniciar o processo `ecovit` na mesma instância do PM2 gerenciada pelo aaPanel. Conservar .env e DATA_DIR privados entre atualizações. Migrações usam a role proprietária em etapa administrativa própria. A verificação após o reinício segue o procedimento abaixo.

Neste servidor, instalar dependências com `runuser -u www -- npm ci --include=dev --cache /www/wwwroot/ecovit/npm-cache`. O administrador cria esse diretório com `install -d -o www -g www -m 0700 /www/wwwroot/ecovit/npm-cache`. Ele fica fora do checkout e da raiz pública. O script de deploy usa o mesmo cache por padrão, configurável por `ECOVIT_NPM_CACHE`. Desativar a instalação de dependências pelo painel para que a instalação manual ou o webhook seja o único responsável pelo node_modules desse checkout.

### GitHub Actions e webhook do aaPanel

1. No aaPanel, mantenha o processo `ecovit` online no PM2 e o cache npm gravável por `www`, conforme [Configuração e banco](#configuração-e-banco). O script usa por padrão o checkout `/www/wwwroot/ecovit/ecovit/ecovit`, o PM2 acessível a `www` e o Node identificado pelo processo existente. Para outra configuração, há os ajustes opcionais `ECOVIT_APP_DIR`, `ECOVIT_NPM_CACHE`, `ECOVIT_NODE_BIN`, `ECOVIT_PM2_USER` e `PM2_HOME`.
2. Em **App Store → Plug-ins → WebHook**, crie ou edite o hook dedicado ao Ecovit e cole o conteúdo integral de [scripts/deploy-aapanel.sh](../../scripts/deploy-aapanel.sh). Mantenha `BUILD` e `RECEIPT` no início de suas próprias linhas. O hook executa com permissão de alternar usuários. Copie a URL HTTPS gerada pelo painel, incluindo `access_key`.
3. No GitHub, em **Settings → Environments → production**, cadastre essa URL no segredo `AAPANEL_WEBHOOK_URL`, sem acrescentar `param`. Em **Settings → Secrets and variables → Actions → Variables**, configure a variável de repositório `AAPANEL_CD_ENABLED` com o valor `true`.
4. Envie a revisão para `main` ou, para publicar a revisão que já está nela, abra **Actions → CI e deploy do Ecovit no aaPanel → Run workflow** e selecione `main`. O workflow roda lint, testes de domínio e build com checagem de tipos em Node 24.22.1 e 24.x. Depois que ambos passam, envia `param=<sha>-<run_id>-<run_attempt>`. O aaPanel repassa esse valor como primeiro argumento do script. O SHA isolado continua aceito para compatibilidade com o workflow anterior, sem gerar recibo.

O script confere o socket e o processo do PM2, o checkout limpo, o remoto e a revisão na ponta da main. A obtenção do código, instalação e compilação rodam como `www`. O Vite preserva `dist/.user.ini` com `--no-emptyOutDir`, o que também conserva arquivos de builds anteriores. Um lock no servidor impede execuções simultâneas. O build ocorre no checkout em uso e pode causar indisponibilidade durante a atualização. A vigilância de arquivos fica desativada e o procedimento não inclui reversão automática.

Após o build, o reinício do Ecovit e a resposta saudável da API local, o script publica atomicamente `dist/ecovit-deploy.txt` e registra `ECOVIT_DEPLOY_OK=<sha>` no log do aaPanel. O recibo público contém apenas o SHA, o identificador da execução e tentativa e o SHA-256 de `dist/index.html`.

O HTTP 2xx do webhook indica que o painel aceitou a chamada. O workflow consulta a produção por até 15 minutos. Para concluir, exige um recibo da própria tentativa com o SHA do CI, confere o hash do HTML servido e verifica `/api/health` por HTTPS. A comparação remove o bloco inline de detecção JavaScript do Cloudflare quando as duas assinaturas do serviço estão presentes. O sucesso aparece como `Revisão implantada e verificada em produção: <sha>` no job. Se a confirmação expirar, consulte a execução correspondente no log do WebHook do aaPanel e confira se o domínio serve o recibo da tentativa. Acompanhe as verificações pendentes na [task de homologação operacional](../tasks/T-002-Homologacao-Operacional-Producao.md).

O Vite incorpora a versão e o histórico público no bundle do frontend. A configuração lê uma vez o SHA e a data do commit de `HEAD` e lê os arquivos de tasks pelo SHA capturado, diretamente dos objetos Git. O histórico usa o conteúdo registrado nessa revisão, inclusive em builds de desenvolvimento. O build requer um checkout Git com o commit disponível. Somente ID, título e data das tasks elegíveis são incorporados ao frontend.

### Proxy e conteúdo estático

Servir somente dist como raiz pública, incluindo recursos do catálogo; não servir a raiz do repositório, dist-server, .env, .tools ou DATA_DIR. Encaminhar /api/ para a porta interna, sem remover o prefixo. Modelo para adaptar ao site HTTPS no Nginx/aaPanel:

No aaPanel, um site estático para ecovit.idevs.com.br pode servir a raiz `/www/wwwroot/ecovit/ecovit/ecovit/dist` enquanto o PM2 supervisiona a API. Usar um único site para o domínio. Se o Mapping do projeto Node já tiver gerado um site, adaptar a configuração existente para servir dist e encaminhar somente /api/. Preservar as diretivas do painel para o certificado e para o desafio de renovação.

```nginx
root /caminho/ecovit/dist;
client_max_body_size 64m;
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy no-referrer always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" always;
location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_read_timeout 120s;
    proxy_send_timeout 120s;
}
location / { try_files $uri $uri/ /index.html; }
location = /index.html { expires -1; }
```

A API confia em encaminhamento somente do proxy em loopback. O proxy deve substituir X-Forwarded-For pelo IP validado do visitante, sem concatenar valor arbitrário enviado pelo cliente. Se houver outro proxy/CDN, o administrador valida sua cadeia antes de aceitar IPs encaminhados. Headers de segurança devem permanecer efetivos também no HTML e em respostas de erro: no Nginx, add_header de um location pode substituir a herança; repetir/incluir o conjunto comum quando houver diretivas específicas, ou configurar cache por expires. Validar configuração efetiva, HTTPS e ausência de cache de /api. Não expor API/PostgreSQL ou imagens diretamente à internet.

### Limpeza e monitoramento

Agendar a cada 15 minutos o comando do mesmo pacote, usando usuário, diretório de trabalho e ambiente da API:

```sh
node --env-file=.env dist-server/cli.mjs cleanup
```

A limpeza usa DATABASE_URL da role de execução e um lock no PostgreSQL; remove arquivos antes de liberar as respectivas cotas/linhas. Falha preserva a possibilidade de repetir, com código de saída diferente de zero. Guardar stdout/stderr em log privado do agendador e alertar falhas/atrasos. A API registra falhas 5xx com horário, requestId, padrão da rota e código seguro, sem corpo, stack, endereço, SQL ou segredo; queda de conexão ociosa do pool é registrada sem derrubar a API. Consultar ecovit_maintenance.last_success; não publicar esse indicador junto com detalhes do banco. Validar primeira execução, repetição e retomada após falha antes de liberar o site. Verificar que contas em exclusão são eliminadas em até 24 h; agendamento existente sozinho não comprova esse prazo. Backups seguem exclusivamente a administração do servidor.

### Desenvolvimento e verificações isoladas

Start-Ecovit.ps1 -Task dev inicia frontend 5173 e API local usando .env, após migração/configuração. Essa porta pertence ao solicitante. api:dev executa somente a API. Testes do Codex usam 5174 e API 3002, com banco isolado chamado ecovit_test configurado em M12_TEST_DATABASE_URL. O runner cria schema m12_browser, captura e-mails em .tools/m12/browser-mail e usa diretório privado de imagens separado. Captura exige NODE_ENV=test e nunca é habilitada em produção; não existe endpoint que revele código.

Para dev:test manual, criar .env.test privado com M12_TEST_DATABASE_URL. O servidor de testes reinicializa apenas as contas/dados desse schema: não apontar para projetos pessoais. npm run test:api usa banco ecovit_test e fixtures próprias; npm run test:e2e inicia e encerra sua API/Vite, sem reaproveitar outra instância 5174. O teardown identifica o processo por um identificador exclusivo da execução antes de encerrá-lo. Não usar 5173 nem encerrar processos desconhecidos.
