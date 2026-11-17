# T-022 — Apresentar o histórico de alterações em popup

**Tipo** — Implementação

**Resumo** — Apresenta o histórico em um popup sobre a tela atual, com lista rolável e data e hora do commit de entrega de cada alteração, preservando o contexto do editor e restaurando o foco ao fechar o diálogo.

**Execução** — Verificada

**Data de execução** — 2026-11-16

**Aceite manual** — Confirmado pelo solicitante

## Alteração e limites

Renomear a apresentação pública de histórico para “Histórico de Alterações”, incluindo título e nomes acessíveis dos links que o abrem. Preservar o endereço `#historico-de-tasks` e o acesso público sem autenticação.

Exibir o conteúdo em um popup modal sobre a tela atual, ocupando quase toda a largura e altura disponíveis, com pequenas margens externas que deixem a tela de origem perceptível. Substituir a apresentação atual de página inteira por um painel com fundo próprio, cantos arredondados, sombra discreta e fundo externo atenuado, seguindo cores, tipografia e controles do aplicativo. Não criar protótipo ou página separada.

O popup deve ser compacto: cabeçalho com título, identificação da versão e controle de fechar; lista com espaçamento contido e colunas alinhadas para ID, título da alteração e data/hora. Evitar blocos introdutórios, cartões altos ou espaços vazios excessivos. Manter cabeçalho e fechamento disponíveis enquanto somente a lista rola. Em telas menores, permitir quebra dos títulos e reorganização dos campos sem corte do conteúdo ou rolagem horizontal.

### Data e hora de cada alteração

Mostrar em cada item a data e hora do **commit que entregou a alteração**, usando o timestamp de committer (`%cI`) convertido para `America/Sao_Paulo`, no formato `DD/MM/AAAA HH:mm`, com relógio de 24 horas. Identificar a coluna como data/hora da entrega para distinguir esse dado da data de execução registrada na task.

Para associar uma task à entrega, considerar o primeiro commit alcançável a partir da revisão compilada em que ela já atende às condições de inclusão do histórico: tipo Implementação, execução Verificada e data de execução válida. Edições posteriores de documentação, registro de aceite manual ou recompilações não devem substituir esse instante pelo do último commit que tocou o arquivo. Incluir somente entregas pertencentes à revisão compilada; não consultar revisões posteriores nem relógio de compilação, publicação ou navegador.

Ordenar os itens pelo instante de entrega decrescente, com desempate pelo ID numérico decrescente. As tasks antigas elegíveis também recebem a data/hora de seu commit de entrega, sem inventar horários a partir da data de execução. A geração dos metadados deve dispor do histórico Git necessário; se a informação não puder ser determinada, informar a causa na geração, sem atribuir um horário fictício. Manter o navegador independente de acesso ao Git ou a serviços externos e publicar apenas os metadados necessários à listagem.

### Abertura, fechamento e preservação

Ao abrir pelo rodapé do login, da lista ou do editor, manter a tela de origem montada e bloquear sua interação enquanto o popup estiver aberto. Disponibilizar fechamento explícito por controle acessível no cabeçalho, Escape e retorno do navegador; restaurar o foco ao link acionador e conservar projeto, câmera, histórico de edição e alterações em memória. Manter contenção de foco no diálogo e nome acessível pelo título.

No acesso direto a `#historico-de-tasks`, usar a mesma apresentação de popup sobre um fundo do aplicativo, sem exigir autenticação ou inventar uma tela de origem com projeto. Oferecer retorno à entrada do Ecovit. O estado vazio também usa o mesmo popup e informa a ausência de alterações elegíveis em linguagem de produto.

Preservar os filtros de elegibilidade das tasks e o formato da versão definido na [T-021](T-021-Data-e-Hora-do-Commit-no-Rodape.md). Não alterar datas de execução ou aceites históricos para obter horários de entrega. Não incluir pesquisa, filtros interativos, paginação, detalhes adicionais das tasks ou mudanças no editor.

Referências: [PRD — Versão e histórico de tasks](../Ecovit-PRD.md#versão-e-histórico-de-tasks), [Interface e iconografia — Versão e histórico de tasks](../arquitetura/Interface-e-Iconografia.md#versão-e-histórico-de-tasks), [guia de tasks](README.md), [T-004](T-004-Versao-e-Historico-de-Tasks.md) e [T-010](T-010-Rotulo-da-Versao-nos-Rodapes.md). Na implementação, atualizar os contratos responsáveis e, quando necessário, o empacotamento dos metadados, preservando registros históricos. Consultar o catálogo existente se acrescentar ou alterar ícones de controles.

## Critérios de aceite

- [x] **A01** — Título e nomes acessíveis usam “Histórico de Alterações”. Os links existentes continuam abrindo `#historico-de-tasks`, e a versão exibida permanece coerente com os rodapés.
- [x] **A02** — Abertura a partir de login, lista ou editor mostra um popup quase do tamanho da janela, com margens externas e origem perceptível ao fundo. Apresentação compacta e consistente com o aplicativo, cabeçalho e fechamento disponíveis, rolagem interna da lista e conteúdo legível sem corte ou rolagem horizontal, inclusive em janela menor.
- [x] **A03** — Cada item elegível apresenta ID, título e data/hora real de seu commit de entrega em São Paulo. Conversão com mudança de dia e entregas no mesmo dia em horários distintos são corretas; ordenação segue o instante decrescente e o desempate especificado.
- [x] **A04** — Tasks antigas recebem o instante da entrega original; alteração documental ou aceite posterior não muda esse instante. Recompilar a mesma revisão mantém os dados, e commits posteriores à revisão compilada não entram na listagem. Ausência do histórico necessário produz diagnóstico na geração em vez de horário inventado.
- [x] **A05** — Popup tem nome acessível, foco contido e fechamento explícito, por Escape e pelo retorno do navegador. Fechar restaura o foco ao acionador e preserva o estado da tela de origem, inclusive alterações ainda em memória no editor.
- [x] **A06** — Acesso direto continua público e mostra o mesmo popup, com retorno à entrada do Ecovit. Estado vazio permanece compreensível. Filtros de elegibilidade e identificação da versão da T-021 são preservados.

A conferência segue a [política de qualidade](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração), com recorte pertinente aos metadados de entrega, layout do popup, foco e preservação da tela de origem, sem exigir suíte completa ou matriz ampla por padrão.

## Resultado

Task especificada em 2026-11-16 a pedido do solicitante, após confirmação do título e da origem da data/hora. Implementação autorizada posteriormente e concluída na mesma data.

- **A01/A02** — Título e nomes acessíveis atualizados. Popup modal com margens de 20 px (10 px em telas estreitas), cabeçalho fixo na estrutura, colunas alinhadas e lista com rolagem própria. Cenário direcionado de Chrome conferiu login, lista e editor; capturas inspecionadas em 900×680, 390×640 e 900×420. Não houve corte horizontal; no editor de pouca altura, rolar a lista manteve o fechamento no mesmo lugar. Nenhum ícone acrescentado ou alterado.
- **A03/A04** — Metadados leem os objetos da revisão compilada e seus ancestrais em lote. Testes confirmam entrega original, passagem de Pendente para Verificada, data de execução distinta da entrega, horários no mesmo dia, conversão com mudança de dia, desempate por ID, integração por merge, edição documental posterior, exclusão de entrega de branch ainda não integrada e estabilidade de recompilação. Checkout raso é recusado com diagnóstico. CI ajustada para fetch-depth: 0; build local com histórico real aprovado. Não houve nova publicação nem execução remota da CI nesta entrega.
- **A05** — Chrome confirmou modalidade, contenção de foco entre fechamento e lista rolável, bloqueio de foco no acionador ao fundo, Escape, fechamento explícito, retorno pelo navegador e restauração de foco. Fluxo direcionado preservou o candidato em memória após falha de salvamento e retorno do popup; a estrutura de montagem do editor não foi alterada.
- **A06** — Fluxo público aprovado: acesso direto/recarregamento sem autenticação, conteúdo comparado com os metadados e retorno à entrada pelo cabeçalho. Elegibilidade e histórico sem tasks cobertos pelos testes de metadados; apresentação do texto vazio no mesmo diálogo conferida por inspeção do componente. Versão da T-021 preservada.

**Validação proporcional** — Cinco testes em dois arquivos Vitest aprovados em 8,16 s. Cenário Chrome de interface em 6,7 s (30,2 s com inicialização); dois fluxos em 3,0 s e 4,2 s (30,7 s com inicialização). Build com typecheck, lint direcionado, formatação e diff aprovados. Build emite aviso de tamanho de bundle e anotação de dependência, sem erro. Layout, foco e origem justificaram os cenários direcionados; não houve suíte completa ou matriz Chrome/Edge. Contratos atualizados em PRD, Interface e iconografia, Persistência e compatibilidade e guia de tasks.

**Ocorrências e correções** — A primeira leitura do histórico abria processos Git por arquivo/revisão e provocou timeouts nos testes. Substituída por log único e leitura em lote via cat-file, sem ampliar timeouts. Ajustada também a expectativa de representação UTC do timestamp, que Git emite com Z. Na primeira conferência de interface, a nova asserção esperava Tab restrito ao botão; o Chrome inclui a lista rolável na navegação. O teste passou a conferir esse percurso e seu retorno, preservando a verificação de foco contido; a lista recebeu contorno de foco visível no padrão do aplicativo. Somente o cenário afetado foi repetido. Formatação do workflow normalizou finais de linha, sem alterações adicionais de configuração. Servidor próprio do runner na porta 5174 e dados isolados; porta 5173 preservada.

**Evidências locais ignoradas pelo Git** — Logs `.tools/t022-unit.log`, `.tools/t022-unit-final.log`, `.tools/t022-build.log`, `.tools/t022-lint.log`, `.tools/t022-lint-final.log`, `.tools/t022-interface.log`, `.tools/t022-interface-final.log`, `.tools/t022-flows.log`, `.tools/t022-format-check-final.log` e `.tools/t022-diff.log`. Capturas `.tools/t022-login-900.png`, `.tools/t022-login-390.png`, `.tools/t022-lista-900.png` e `.tools/t022-editor-900.png`.

**Aceite manual na conclusão técnica** — Pendente à época; confirmação posterior registrada abaixo. Verificação técnica concluída; sem commit, push ou publicação naquela etapa.


## Confirmação de aceite — 2026-11-16

Aceite manual confirmado explicitamente pelo solicitante ao informar que o resultado ficou bom e solicitar o registro dos aceites da T-021 e da T-022, com commit e push. Esta confirmação encerra a pendência manual desta task, preservando as evidências técnicas anteriores, sem representar nova execução de testes.
