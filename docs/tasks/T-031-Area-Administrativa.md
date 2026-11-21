# T-031 — Área administrativa: visão geral, usuários, operação e auditoria

**Tipo** — Implementação

**Resumo** — Adiciona uma área restrita para acompanhar o uso do Ecovit, consultar usuários e consumo, suspender acessos e identificar falhas operacionais, com registro das intervenções administrativas.

**Execução** — Verificada

**Data de execução** — 2026-11-20

**Aceite manual** — Confirmado pelo solicitante em 2026-11-20

## Alteração e limites

Criar a primeira versão da área administrativa dentro do aplicativo, com quatro telas: Visão geral, Usuários, Operação e Auditoria. O objetivo é permitir ao responsável acompanhar a utilização pública, atender problemas de acesso e identificar falhas sem consultar diretamente o banco ou acessar desenhos privados.

Implementação autorizada pelo solicitante em 2026-11-20, com revisão da identidade permanente por configuração privada ADMIN_EMAIL. A criação da task, por si só, não autorizou implementação; esta autorização posterior não inclui publicação ou acesso aos dados de produção.

Referências: [PRD](../Ecovit-PRD.md), [Autenticação e acesso](../arquitetura/Autenticacao-e-Acesso.md), [Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md), [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md) e [Qualidade e desempenho](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração).

### Acesso e proteção

- Disponibilizar a entrada Administração somente para contas administrativas autorizadas. A API verifica essa permissão em toda consulta e ação; ocultar a entrada não é o controle de autorização.
- O administrador permanente é definido por **ADMIN_EMAIL** no `.env` privado do servidor, configurado para **marcus.moreira@gmail.com**, conforme confirmação do solicitante. O privilégio depende da conta verificada e da configuração vigente; não criar conta já autenticada nem conceder acesso apenas porque o navegador informou esse endereço.
- A regra atende conta existente e primeiro login válido. Enquanto o endereço estiver configurado, o painel não pode retirar seu privilégio. Exclusão e recadastro com comprovação do mesmo e-mail concedem novamente acesso administrativo, sem recuperar conta, projetos ou histórico antigos. Alterar ou remover ADMIN_EMAIL exige reinício da API e encerra essa fonte de permissão; concessões explícitas pelo painel permanecem independentes.
- Todos os administradores têm as mesmas ações disponíveis, com a única proteção de que o configurado permanentemente não pode ser rebaixado pelo painel. Qualquer administrador pode adicionar outros administradores pela tela Usuários, selecionando contas existentes e ativas. Não há convite, criação administrativa de conta ou concessão para e-mail ainda não cadastrado. Contas bloqueadas ou em exclusão não podem receber o privilégio.
- Adicionar ou retirar o privilégio de outro administrador exige confirmação explícita e motivo, com registro em auditoria. Ninguém pode retirar o próprio privilégio pelo painel, e nenhum administrador pode retirar o privilégio do configurado em ADMIN_EMAIL. Repetir uma operação não duplica efeitos ou registros de sucesso da mesma operação; estado já aplicado é informado sem sucesso fictício de nova alteração.
- Preservar sessão, CSRF, validação de origem, limites e respostas privadas sem cache conforme os contratos existentes. Conta comum não pode obter dados administrativos por URL ou chamada direta.
- O acesso administrativo utiliza a sessão do login existente por código enviado por e-mail. Nesta versão não há aplicativo autenticador, códigos de recuperação, sessão administrativa separada ou nova comprovação de identidade para cada ação. Permanecem as confirmações e os motivos definidos nesta task.
- Não permitir que o administrador bloqueie a própria conta ou encerre as próprias sessões por essas ações destinadas a terceiros. Contas administrativas não são alvos de bloqueio ou encerramento de sessões isolado pelo painel nesta versão. Retirar o privilégio administrativo é permitido nas condições acima e encerra todas as sessões da conta-alvo, preservando a conta e os projetos; novo login dá acesso como usuário comum.
- Revalidar sessão, permissão do responsável e situação da conta-alvo na confirmação final de cada mutação administrativa. Coordenar mudanças concorrentes de privilégio para impedir que uma operação seja confirmada usando autorização já retirada. A tela aberta não conserva permissão após a revogação.
- A permissão administrativa dá acesso aos indicadores e metadados definidos aqui, sem ampliar as rotas comuns de leitura de projetos, documentos ou imagens de outros proprietários.

### Visão geral

Apresentar indicadores com data/hora de atualização e seleção dos últimos 7 ou 30 dias, inicialmente 7. O período usa dias de calendário em America/Sao_Paulo, incluindo o dia atual até o instante da consulta.

| Indicador | Definição |
|---|---|
| Usuários cadastrados | Total atual de contas existentes, separando ativas, bloqueadas e em exclusão. Não representar esse valor como total histórico de pessoas que já utilizaram o produto. |
| Novos cadastros | Contas existentes criadas no período escolhido. Informar que contas já eliminadas não entram na contagem. |
| Usuários ativos | Contas distintas com ao menos uma abertura bem-sucedida de projeto ou uma alteração de projeto confirmada no período. Login, consulta de sessão e acesso ao painel administrativo não contam como atividade. |
| Projetos | Quantidade atual de projetos fora da lixeira e na lixeira, em totais separados. |
| Armazenamento | Consumo atual contabilizado pelas cotas existentes, com identificação da unidade e do alcance; não apresentar como ocupação total do disco do servidor. |

Totais atuais não mudam de significado ao selecionar o período. Não incluir usuários online em tempo real, rastreamento de gestos, conteúdo dos desenhos ou ranking de usuários.

Dados de atividade podem exigir instrumentação nova e persistente. Informar o início da cobertura e identificar períodos incompletos; não reconstruir aberturas passadas a partir da data de edição nem apresentar ausência de coleta como zero. Agregação e retenção devem sustentar as duas janelas sem guardar um histórico detalhado de navegação.

### Usuários

Lista paginada com busca por e-mail e filtro por situação. Mostrar e-mail, data de cadastro, última atividade conhecida, situação, quantidade de projetos e consumo da cota. Ausência de atividade registrada aparece como informação indisponível, sem inferir inatividade anterior à coleta.

No detalhe da conta, apresentar:

- Identidade interna, dados da listagem, limites e consumo de cotas, sem edição de e-mail ou cotas.
- Projetos paginados com identificador, nome, criação, última alteração, revisão, tamanho contabilizado e situação na lixeira. Não carregar o documento ou gerar prévia do desenho para montar essa consulta.
- Ações de bloquear, desbloquear e encerrar todas as sessões, com confirmação explícita e motivo obrigatório. O resultado deve distinguir sucesso, falha e estado já aplicado, sem duplicar a intervenção por repetição técnica.
- Ações de adicionar e retirar administrador, disponíveis a todos os administradores nas condições da seção Acesso e proteção. Identificar contas administrativas na lista e no detalhe, separadamente da situação da conta, sem nível ou hierarquia adicional.

Bloquear impede novos acessos e revoga todas as sessões, preservando projetos, imagens e cotas. Operações em andamento devem revalidar a situação da conta antes da confirmação final, conforme o contrato existente. Desbloquear permite novo login, sem recuperar sessões antigas. Encerrar sessões não bloqueia a conta. Contas em exclusão permanecem no fluxo vigente e não podem ser reativadas pelo painel.

Não incluir exclusão administrativa de contas/projetos, restauração de projetos de terceiros, troca de e-mail, transferência de propriedade, abertura de desenhos ou acesso como outro usuário.

### Continuidade do acesso administrativo

A exclusão da própria conta mantém o fluxo vigente, inclusive para o último administrador e para o configurado permanentemente. Não exigir transferência de privilégio nem impedir a exclusão para manter um administrador disponível. Não eleger substituto; um novo cadastro verificado do endereço de ADMIN_EMAIL volta a ter acesso administrativo por essa configuração, sem recuperar os dados excluídos.

Se não restar administrador com acesso, disponibilizar comando restrito no servidor para conceder o privilégio a uma conta existente, ativa e com e-mail verificado. O acesso autorizado ao servidor é o requisito operacional desse procedimento; o navegador e a simples declaração de um e-mail não o substituem. O comando exige confirmação do alvo e motivo, registra a recuperação na auditoria e não altera e-mail, propriedade de projetos ou autentica uma sessão em nome do usuário. Essa recuperação não depende de uma sessão administrativa existente nem constitui uma rota pública de recuperação. A recuperação da caixa de e-mail continua a cargo do provedor.

### Operação

Apresentar estado e horário da última verificação da API e do acesso ao banco, além da última limpeza automática concluída. Distinguir funcionamento confirmado, falha e informação indisponível; um indicador saudável isolado não comprova disponibilidade de todos os fluxos.

Permitir consultar ocorrências dos últimos 7 ou 30 dias, com filtros por período, categoria e código seguro. Categorias: autenticação, envio de códigos por e-mail, salvamento, upload e importação. Mostrar horário, categoria, código, identificador técnico da requisição quando disponível e descrição segura. Separar falhas operacionais de recusas esperadas, como limite de tentativas, cota excedida ou arquivo inválido.

Registrar apenas dados técnicos necessários para diagnóstico, sem e-mail, identificador de conta, conteúdo de projetos ou vínculo persistido com a identidade do usuário. Não mostrar corpos de requisição, desenhos, imagens, códigos de login, cookies, tokens, credenciais, SQL, caminhos privados, stack ou erros brutos do provedor. O identificador técnico da requisição não autoriza incluir dados pessoais em registros correlatos. O painel não é um visualizador de arquivos de log do servidor.

Para e-mails, distinguir pedido aceito pelo provedor de falha ou resultado incerto; não afirmar entrega na caixa do destinatário. Não introduzir webhooks ou consulta de saldo/plano do provedor nesta versão. Falta de histórico coletado deve aparecer como cobertura indisponível ou parcial.

Operação é uma consulta: sem reiniciar serviços, executar limpeza manual, restaurar backups, alterar configurações, executar SQL ou disparar publicação. Backup continua sob administração do servidor.

### Auditoria

Registrar as intervenções de bloqueio, desbloqueio, encerramento de sessões, adição e retirada de administrador com identificador único, data/hora, administrador responsável, conta-alvo, ação, motivo e resultado. Registrar o reconhecimento do administrador configurado como ação do servidor e a recuperação como procedimento restrito no servidor, sem inventar um administrador autenticado responsável. A recuperação registra a origem, o alvo e o motivo, com a mesma exigência de consistência entre concessão e auditoria.

Uma intervenção bem-sucedida e seu registro devem ser consistentes: falha ao persistir a auditoria impede a confirmação da mudança. Repetição técnica não cria duas mudanças ou dois registros de sucesso para a mesma intervenção. Tentativas recusadas e falhas devem ser distinguíveis dos sucessos, sem afirmar execução que não ocorreu.

Disponibilizar consulta paginada por período, administrador, conta-alvo e ação. O painel não permite editar ou apagar registros; a remoção automática por retenção ou exclusão de conta é a exceção definida abaixo. Motivos devem ter tamanho limitado e orientação para não incluir segredos, dados pessoais de terceiros ou conteúdo privado. Auditoria não substitui eventos operacionais nem histórico de edição dos projetos.

### Retenção e exclusão

| Informação | Prazo e alcance |
|---|---|
| Atividade para usuários ativos | Um registro por conta/dia, por 30 dias de calendário em America/Sao_Paulo: dia atual e 29 anteriores. Sem histórico de cliques, desenhos ou lista de projetos abertos. |
| Última atividade | Um único horário atualizado enquanto a conta existir, usando a mesma definição de atividade da Visão geral. Não depende de conservar registros diários antigos. |
| Ocorrências operacionais | 30 dias a partir da ocorrência, contendo apenas os dados técnicos definidos em Operação. |
| Auditoria administrativa | 180 dias a partir da intervenção, salvo exclusão antecipada por eliminação da conta identificada no registro. |

Aplicar a remoção dos registros vencidos na rotina de limpeza existente. Consultas respeitam as janelas de retenção mesmo antes da próxima execução física da limpeza. Não manter cópia histórica adicional desses registros no aplicativo.

Na exclusão de uma conta, eliminar sua atividade diária, última atividade e registros de auditoria que a identifiquem como responsável ou alvo, inclusive concessões e recuperação, em até 24 horas da confirmação da exclusão, junto ao fluxo vigente. Excluir o registro de auditoria inteiro, sem conservar UUID vinculável ou texto identificável como substituto da remoção. Não criar novas intervenções sobre uma conta em exclusão que reintroduzam seus dados após a limpeza.

A consequência acordada é a perda de rastreabilidade dessas intervenções, inclusive da participação de outras contas no mesmo registro. Usuários ativos são calculados com a atividade remanescente das contas existentes, sem preservar a identidade de contas eliminadas para congelar estatísticas anteriores. A regra permanente de ADMIN_EMAIL é configuração do responsável e não preserva dados da conta excluída.

Ocorrências operacionais sem identidade seguem o prazo de 30 dias. Backups permanecem sob administração do servidor conforme o contrato vigente; a limpeza dos dados ativos não é apresentada como eliminação de backups externos. Atualizar o aviso de privacidade para refletir as finalidades, retenções e exclusões efetivamente implementadas.

### Implementação e contratos

Manter frontend e API no repositório e na origem existentes, com PostgreSQL e módulos pequenos, sem serviço separado de administração, fila ou plataforma externa de analytics. Consultas devem usar agregações e paginação no servidor, sem carregar todos os documentos nem recalcular o motor para obter indicadores.

Atualizar os contratos responsáveis quando a implementação for autorizada: acesso administrativo, concessão de privilégios e bloqueio em Autenticação; persistência de atividade, eventos, auditoria, retenção e migrações em Persistência; comportamento público pertinente no PRD. Preservar IDs e aceites anteriores. Consultar a iconografia central para novos controles.

Ficam fora desta versão avisos públicos, funil de adoção, central de chamados, exportação de relatórios, cobrança, planos, edição de cotas e alterações do editor/motor.

### Decisões acordadas

Decisões acordadas pelo solicitante nesta revisão:

- **D01 — Identidade e concessão — Acordada, revisada na autorização de implementação:** ADMIN_EMAIL no `.env` privado define marcus.moreira@gmail.com como administrador permanente. Exigir conta verificada; proteger o privilégio no painel e aplicá-lo também a recadastro verificado após exclusão, sem restaurar dados antigos. Substitui a concessão inicial única da revisão anterior.
- **D02 — Autenticação simplificada — Acordada:** usar o login existente por código de e-mail e a sessão vigente, sem autenticador adicional ou códigos de recuperação nesta versão. Não introduzir uma nova etapa de autenticação para as ações administrativas.

- **D03 — Retenção — Acordada:** atividade por 30 dias, última atividade enquanto existir a conta, ocorrências operacionais por 30 dias e auditoria por 180 dias. Exclusão da conta elimina atividade e registros de auditoria que a identifiquem em até 24 horas, com perda de rastreabilidade aceita, conforme Retenção e exclusão.
- **D04 — Delegação — Acordada:** todos os administradores podem adicionar outros entre contas cadastradas e ativas. Não há níveis de ações administrativas; a identidade de ADMIN_EMAIL tem proteção permanente contra retirada pelo painel.
- **D05 — Revogação e continuidade — Acordada, revisada na autorização de implementação:** qualquer administrador pode retirar o privilégio de outro, exceto do configurado em ADMIN_EMAIL, mas não o próprio pelo painel. A retirada preserva conta/projetos e encerra todas as sessões. A exclusão da própria conta permanece permitida, inclusive para o último administrador. Recuperação por comando restrito no servidor para conta existente e verificada continua disponível; recadastro do endereço configurado segue D01.

Pontos explicitados para evitar ambiguidade: adicionar administrador não altera propriedade nem permite abrir seus desenhos; conta administrativa continua sendo uma conta do produto; a proteção permanente decorre exclusivamente da configuração privada vigente e da identidade verificada; autenticação simplificada preserva as proteções existentes da API.

Revisão documental desta atualização: D01–D05 resolvidas, sem pendência funcional identificada. Paginação, índices e organização interna do código são escolhas de implementação e devem respeitar os resultados e contratos definidos aqui; não representam autorização para ampliar o escopo.

## Critérios de aceite

- [x] **A01** — Administrador autorizado acessa as quatro telas no aplicativo; conta comum, sessão expirada ou privilégio revogado não obtêm os dados ou executam ações por chamadas diretas.
- [x] **A02** — Visão geral apresenta os indicadores definidos, separa totais atuais de métricas por período e informa início da coleta e cobertura parcial sem inventar histórico.
- [x] **A03** — Usuários permite busca, filtros e paginação, com detalhe de cotas e metadados dos projetos, sem carregar documentos ou imagens privados de terceiros.
- [x] **A04** — Bloqueio, desbloqueio e encerramento de sessões usam a sessão válida por código de e-mail, confirmação e motivo, sem autenticação adicional; preservam os dados e impedem confirmação de operações após bloqueio, inclusive quando já estavam em andamento.
- [x] **A05** — Autoações restritas, alvos administrativos e contas em exclusão são tratados conforme o escopo; contas comuns não podem conceder privilégios e nenhuma conta em exclusão é reativada pelo painel.
- [x] **A06** — Operação apresenta estados, atualização, limpeza e ocorrências filtráveis, distingue falhas de recusas previstas e não expõe dados sensíveis nem confunde aceitação de e-mail com entrega.
- [x] **A07** — Auditoria permite rastrear e filtrar as intervenções; sucesso depende de registro consistente e repetição técnica não duplica efeitos ou sucessos.
- [x] **A08** — Telas distinguem carregamento, ausência de registros, cobertura indisponível e falha de consulta; erros não mostram sucesso fictício nem dados de outra sessão após troca de conta.
- [x] **A09** — Decisões D01–D05 estão resolvidas e registradas antes das alterações dependentes; migrações e contratos refletem o comportamento entregue, preservando contas, projetos, isolamento e fluxo de exclusão existentes.
- [x] **A10** — ADMIN_EMAIL concede privilégio permanente à conta verificada configurada e protege contra rebaixamento pelo painel; a regra atende conta existente e recadastro verificado sem recuperar dados excluídos, e não depende de endereço declarado pelo navegador.
- [x] **A11** — Qualquer administrador adiciona outros administradores entre contas existentes e ativas com confirmação, motivo e auditoria consistente; chamadas diretas e repetições respeitam autorização e idempotência, sem conceder acesso a documentos de terceiros.
- [x] **A12** — Qualquer administrador retira o privilégio de outro, exceto do configurado permanentemente, preservando conta/projetos e encerrando suas sessões; auto-revogação é recusada e operações concorrentes não confirmam com autorização já retirada.
- [x] **A13** — Exclusão da própria conta permanece possível para o último administrador; o procedimento restrito no servidor recupera a administração para uma conta existente, ativa e verificada, com auditoria e sem criar sessão ou transferência de projetos.
- [x] **A14** — Consultas e limpeza respeitam os prazos de D03; exclusão da conta remove atividade e auditoria que a identifique em até 24 horas, tanto como responsável quanto como alvo, sem conservar vínculo pessoal alternativo. A configuração permanente do responsável segue D01.

## Resultado

Implementação e verificação técnica concluídas em 2026-11-20. A autorização de implementação revisou D01/D04/D05 para proteger permanentemente o endereço configurado em ADMIN_EMAIL; a confirmação corrigiu o endereço digitado para marcus.moreira@gmail.com. Variável adicionada ao `.env` local privado e ao exemplo de configuração. Nenhum dado de produção consultado ou alterado. Aceite manual continua pendente.

As quatro consultas foram integradas ao aplicativo. API e migração incremental 002 incluem permissões, bloqueio, revogação de sessões, auditoria atômica, recuperação por comando no servidor e retenção pela limpeza existente. A abertura de projetos e suas alterações confirmadas alimentam atividade diária e último horário. Foi corrigida a varredura de arquivos para preservar imagens de contas bloqueadas.

| Critérios | Evidência técnica |
|---|---|
| A01, A05, A10 | Requisições diretas com sessão ausente, comum, escopo divergente e CSRF inválido; proteção do permanente e recadastro verificado; inspeção da configuração privada, sem divulgar segredos. |
| A02, A03 | Agregação diária sem duplicação, metadados sem documento, busca e paginação; cobertura completa/parcial nas janelas de calendário de São Paulo; conferência da Visão geral e Usuários no Chrome. |
| A04, A12 | Bloqueio impede leitura/gravação com sessão antiga; desbloqueio não restaura sessões; revogação encerra sessões e preserva projetos; revogações concorrentes não confirmam com autorização retirada; limpeza preserva imagens de bloqueados. |
| A06 | Categorias e códigos filtráveis, dados técnicos sem conteúdo privado, envio aceito distinto de entrega; Operação conferida no Chrome e consulta à manutenção existente inspecionada. |
| A07, A11 | Delegação por administrador adicionado, repetição sem duplicar sucesso, conteúdo divergente recusado, rollback da concessão quando a gravação da auditoria falha; confirmação e registro vistos no Chrome. |
| A08 | Inspeção dos estados de carregamento/erro/vazio, descarte de respostas tardias por contexto e fechamento por evento de autenticação; transições e restauração de foco verificadas no Chrome. |
| A09 | Contratos de produto, acesso, persistência e interface atualizados; migração testada de schema legado e por repetição, preservando contas. |
| A13, A14 | Recuperação no servidor sem criar sessão, exclusão/limpeza com cascata tanto do responsável quanto do alvo e retenções vencidas; regressões de exclusão da API preservadas. Fluxo de exclusão não impõe presença de outro administrador. |

Validação ampliada porque a entrega altera autorização, sessões, persistência, limpeza e interface. Evidência combinada, sem somar repetições como cobertura adicional:

- API: 32 cenários únicos cobertos. A primeira execução teve 31 aprovações e uma falha na asserção legada do login local, que ainda não esperava `admin: false` na resposta. A asserção foi atualizada e o cenário passou na repetição direcionada. Os nove cenários novos da T-031 passaram. Execução inicial: 75,06 s.
- Migrações: 13 cenários aprovados, incluindo atualização real para versão 2 e repetição sem mudar dados/histórico. Execução conjunta com a repetição do login local: 6,39 s.
- Cobertura por calendário: cenário de métricas reexecutado após substituir a estimativa no cliente por comparação com o início do período no servidor; aprovado em 3,53 s.
- Chrome: um cenário específico percorre as quatro consultas, adiciona administrador e confere auditoria/foco; aprovado em 16,88 s. A tentativa inicial revelou seletor ambíguo entre mensagens de sucesso e carregamento; corrigido para identificar exatamente o sucesso esperado, mantendo a asserção. Capturas da Visão geral e confirmação inspecionadas visualmente.
- CLI: seis regressões de migração aprovadas, 20,85 s.
- Build final com TypeScript, frontend e API aprovados, 54,39 s; lint dos módulos afetados aprovado, 9,10 s. Build mantém aviso de tamanho do bundle, sem erro de compilação.

Logs locais ignorados: `.tools/t031/api.log`, `api-followup.log`, `calendar-coverage.log`, `browser-followup.log`, `cli-regression.log`, `build-final.log` e `lint-final.log`. O preparo inicial do banco isolado foi impedido pelo sandbox; a única retomada com a permissão adequada concluiu o preparo pela ferramenta mantida. Nenhum navegador ou servidor na porta 5173 foi iniciado, encerrado ou reiniciado.

Ativação no ambiente do solicitante ainda exige aplicar a migração pelo fluxo existente e reiniciar sua API para carregar ADMIN_EMAIL. Isso não foi executado contra o banco do aplicativo, nem houve commit, push ou publicação. A rotina agendada e seus aceites operacionais anteriores foram preservados; este trabalho verificou a limpeza em dados isolados, sem nova homologação de produção.

### Ativação local solicitada — 2026-11-20

Solicitante autorizou aplicar a migração ao banco local, reservando para si o reinício do servidor. Conferidas as conexões de execução e migração: ambas apontam para 127.0.0.1:5432/ecovit. O comando mantido `./Start-Ecovit.ps1 -Task db:migrate` falhou em 2,73 s, código de saída 1. Diagnóstico limitado identificou recusa de autenticação da conexão proprietária `DATABASE_MIGRATION_URL` (PostgreSQL 28P01). A conexão de execução alcança o banco, mas não tem acesso ao histórico de migrações, conforme a separação de privilégios prevista.

A autenticação proprietária falhou antes da execução das migrações; nenhuma alteração de schema foi aplicada por essa tentativa. Não houve reexecução sem correção de causa nem uso de outra role para contornar o contrato. Ativação local pendente de correção da credencial de ecovit_owner no `.env` privado. Senhas e URLs completas não foram exibidas. Servidor do solicitante não foi reiniciado. Logs ignorados: `.tools/t031/local-migration.log` e `local-migration-diagnostic.log`. Verificação técnica anterior da implementação e aceite manual permanecem separados dessa ativação.

### Ativação local conferida — 2026-11-20

Após execução do procedimento interativo pelo solicitante, conferida novamente a conexão local sem alterar dados: ecovit_owner autentica com a credencial do `.env`, permanece sem superuser e é proprietário do banco. Histórico contém versões 1 e 2; as quatro tabelas administrativas e as colunas is_admin/last_activity estão presentes. A role de execução autentica, possui SELECT/INSERT/UPDATE/DELETE nas novas tabelas e USAGE na sequência de ocorrências; o histórico de migrações continua restrito. ADMIN_EMAIL está configurado para o endereço acordado.

Impedimento de autenticação resolvido e migração local aplicada. Verificação concluída em aproximadamente 1 s, sem reiniciar o servidor do solicitante e sem consultar conteúdo de projetos. Evidências locais ignoradas: `.tools/t031/owner-repair-result.json`, `owner-repair.log` e `owner-repair-verification.log`. Aceite manual da área administrativa permanece pendente; o solicitante reiniciará seu servidor para testar.

### Aceite manual e integração — 2026-11-20

O solicitante informou que reiniciou o servidor, testou a área administrativa e confirmou que está funcionando. Aceite manual da T-031 registrado por manifestação explícita, com autorização para commit e push para main e publicação pelo workflow existente.

Na conferência anterior ao commit, o cenário de atualização futura do setup foi ajustado para acrescentar a próxima versão disponível, em vez de fixar versão 2, agora ocupada pela migração administrativa. A asserção continua exigindo todo o histórico anterior mais a versão acrescentada. Alteração restrita ao teste, sem mudar o provisionamento ou executar o setup no banco do aplicativo.
