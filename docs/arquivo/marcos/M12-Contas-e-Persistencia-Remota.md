# M12 — Contas e persistência remota

> Registro histórico. Acompanhe as pendências em [T-001](../../tasks/T-001-Homologacao-Funcional-Producao.md), [T-002](../../tasks/T-002-Homologacao-Operacional-Producao.md) e [T-003](../../tasks/T-003-Conferencia-Manual-Listagem-e-Acesso-Local.md).

[PRD](../../Ecovit-PRD.md#m12--contas-e-persistência-remota) · [Autenticação](../../arquitetura/Autenticacao-e-Acesso.md) · [Persistência](../../arquitetura/Persistencia-e-Compatibilidade.md)

Contas por código de e-mail, projetos privados em PostgreSQL, importação e download de .ecovit, recuperação de gravação, lixeira e exclusão da própria conta. A aplicação está publicada em [ecovit.idevs.com.br](https://ecovit.idevs.com.br/).

## Aceite e verificações

- O deploy em HTTPS e a confirmação do SHA servido estão validados. O [procedimento de operação](../../arquitetura/Persistencia-e-Compatibilidade.md#github-actions-e-webhook-do-aapanel) define o recibo por tentativa e a checagem pública. O [workflow](https://github.com/marcusrox/ecovit/actions/workflows/aapanel.yml) mostra as publicações.
- O solicitante confirmou localmente entrada por código, importação, edição preservada ao reabrir, imagens e download. A apresentação de data/hora e a faixa de status da lista têm aceite específico.
- A verificação automatizada cobre autorização, cotas, falhas de gravação, concorrência, integridade, lixeira e exclusão de conta. A verificação de deploy não constitui homologação funcional.

## Pendências vigentes

- Homologação funcional em produção e aceite global. Verificar login e reenvio, saída e reentrada, importação/download, edição e recuperação após perda de conexão ou conflito, lixeira e exclusão da conta com dados descartáveis.
- Homologar remetente e entrega pela Resend, configuração efetiva do proxy, capacidade do servidor, permissões dos recursos privados e agendamento/monitoramento da limpeza. O prazo operacional de exclusão depende dessa rotina.
- Conferência manual da apresentação da listagem e do acesso direto opcional em desenvolvimento.

## Critérios de aceite

| ID | Critério |
|---|---|
| M12-A01 | Código de e-mail válido e de uso único cria/reutiliza a identidade correta; código inválido/expirado/reutilizado, erro de envio e limites não criam conta/sessão parcial. Saída invalida a sessão; retorno à página privada exige autenticação. |
| M12-A02 | Conta A não lista, abre, altera, duplica, exclui ou baixa projetos/imagens/operações de B, inclusive por IDs conhecidos e requisições diretas. API nunca aceita proprietário enviado pelo cliente como autorização. |
| M12-A03 | Alteração sem imagem nova usa uma chamada de save com revisão/operationId, sem preparação anterior; documento, metadados, revisão, referências e recibo são atômicos. Validação/cota negada preserva o último salvo e não apresenta sucesso. Criar e duplicar não geram cópias adicionais no retry válido do mesmo pedido. |
| M12-A04 | Salvo significa confirmação da intenção pelo servidor; cálculo tem estado separado. Reabrir em outro navegador recupera intenção/imagens e recompõe resultados. Erro de cálculo não desfaz intenção já salva nem exibe quantitativos antigos como atuais. |
| M12-A05 | Desconexão/timeout/erro 5xx ou resposta ilegível preserva o candidato em memória e download; impede novas mutações. Timeout/5xx após commit é conciliado/repetido sem duplicação ou avanço extra de revisão. Operação expirada sem commit não executa depois de liberar a tentativa. Resposta antiga não altera outro projeto/conta. |
| M12-A06 | Sessão expirada conserva trabalho em memória. Reautenticar a mesma conta permite conferir operação/revisão antes de continuar. Outra conta não recebe nem grava o candidato anterior. |
| M12-A07 | Duas sessões partem da mesma revisão: só uma grava; a outra recebe conflito sem sobrescrever. Pode baixar seu candidato e abrir a versão remota com descarte explícito. Sem mesclagem ou salvamento forçado. |
| M12-A08 | Imagens preservam bytes/transformações; upload só ocorre para bytes novos. Falha de upload/commit não cria referência quebrada. Reserva/temporário é contabilizado uma vez e liberado após limpeza, inclusive com reinício. Criação/importação pode enviar temporário antes de existir projeto, sem projeto parcial ou cobrança dupla no retry; dois pedidos do mesmo recurso não escrevem simultaneamente. URL/ID sozinho não concede acesso. Limpeza não remove recursos referenciados; undo reenvia bytes da memória quando necessário, respeitando cotas/revisão. Backup não integra o aceite. |
| M12-A09 | Usuário importa arquivo .ecovit na conta visível/confirmada; novo projeto remoto preserva IDs internos/ajustes e não modifica o arquivo de origem. Retry da mesma operação não duplica; nova importação explícita pode gerar outra cópia. |
| M12-A10 | A importação usa arquivo .ecovit suportado. Recusar conteúdo corrompido ou incompatível antes de criar ou alterar projetos. Para transferir dados de uma instalação com armazenamento local, exportar o arquivo nessa instalação. |
| M12-A11 | .ecovit continua portátil/autossuficiente para uploads, sem tokens, dados de conta, caminhos privados ou identificadores remotos obrigatórios. O envelope de gravação é 18 e os leitores aceitam 9–18. |
| M12-A12 | Cotas são impostas no servidor também sob concorrência; importação/duplicação/exclusão contabilizam recursos conforme contrato, sem quota negativa nem perda silenciosa. Redução de cota não apaga projetos automaticamente nem bloqueia gravação sem aumento de uso, como renomear ou remover conteúdo sem novo upload. |
| M12-A13 | Saída/troca de conta, fechamento e descarte com trabalho não salvo são explícitos. Descartar rejeição conhecida restaura documento/recursos/pilhas anteriores à tentativa, sem fazê-la reaparecer por refazer. Abrir remoto após conflito começa histórico da revisão carregada. Download funciona após falha; aviso de fechamento não é apresentado como garantia contra perda ao encerrar o navegador. |
| M12-A14 | Lixeira por 30 dias conforme D07 permite restaurar e excluir definitivamente com confirmação e revisão. Projetos/imagens continuam contando nas cotas até eliminação. Projeto na lixeira não abre para edição nem aceita escrita de sessão antiga; restauração não reinicia revisão. Expiração e limpeza são idempotentes e respeitam cotas/referências. |
| M12-A15 | Exclusão da própria conta conforme D08 exige novo código de finalidade exclusiva e confirmação, revoga todas as sessões e impede gravações/reacesso imediatamente, eliminando dados ativos em até 24 horas, sem recuperação. Escrita longa iniciada antes da exclusão não confirma após revogação. Resposta perdida é conciliada por recibo restrito, sem sessão de acesso aos projetos. Limpeza interrompida retoma sem órfãos acessíveis; falha não anuncia conclusão física inexistente. Backup de servidor está fora deste aceite. |
| M12-A16 | Interface legível/acessível nas três resoluções de referência em Chrome/Edge, com endereço da conta, cotas, estados e recuperação sem depender só de cor. Instrumentação não registra tokens, códigos ou conteúdo dos projetos. |
| M12-A17 | Requisições diretas sem sessão ou com alvo de outra conta não leem/alteram dados privados; mutações sem CSRF ou de origem não autorizada são recusadas. Tentativas de SQL injection, HTML/script em nomes, travessia de diretório e imagem falsa não são executadas. Limites de código/carga/cota são verificados no servidor; cookies, cabeçalhos, segredos e isolamento do usuário SQL são conferidos na implantação. Não há atalho de teste ativo em produção. |

## Referências de rastreabilidade

`A02`, `A04`, `A07`, `A09`, `A11`, `A13`, `A14`, `A17`, `AB-A01`, `D01`, `D03`, `D06`, `D07`, `D08`, `D09`, `D10`, `D11`, `M12-D01`, `M12-D02`, `M12-D03`, `M12-D04`, `M12-D05`, `M12-D06`, `M12-D07`, `M12-D08`, `M12-D09`, `M12-D10`, `M12-D11`, `M12-T01`, `M12-T02`, `M12-T03`, `M12-T04`, `M12-T05`, `M12-T06`, `M12-T07`, `M12-T08`
