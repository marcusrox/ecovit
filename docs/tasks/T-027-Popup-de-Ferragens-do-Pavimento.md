# T-027 — Reunir as ferragens do pavimento em um popup

**Tipo** — Implementação

**Resumo** — Reúne graute vertical, grampos dos encontros e armadura das cintas em um popup por pavimento, acessível pela lateral, com configuração conjunta e preservação dos dados do projeto.

**Execução** — Verificada

**Data de execução** — 2026-11-18

**Aceite manual** — Confirmado pelo solicitante

**Data do aceite manual** — 2026-11-18

## Alteração e limites

Retirar os formulários **Graute vertical**, **Grampos dos encontros** e **Armadura das cintas** da barra lateral **PROPRIEDADES DO PAVIMENTO** e reuni-los em um popup chamado **Ferragens do pavimento**. No lugar dos três formulários, colocar um botão textual com ícone, **Ferragens do pavimento**, que abre a nova tela para o pavimento ativo.

Esta task registra a proposta solicitada em 2026-11-18. A implementação foi autorizada explicitamente pelo solicitante na mesma data; commit, push e publicação dependem de pedido próprio. O escopo inicial reorganizou a interface. Pedido posterior do solicitante acrescentou listas de bitolas, novos padrões e o diâmetro das barras do graute por pavimento, conforme o resultado complementar abaixo.

### Acesso e contexto

- O botão fica no painel **Propriedades do Pavimento**, no lugar das três seções atuais de graute vertical, grampos e armadura. Usar o ícone semântico `settings` do componente central `Icon` (SlidersHorizontal), com rótulo visível e nome acessível. Não criar outro ícone ou biblioteca.
- A escolha **Simples/Reforçado** migra junto com o formulário **Graute vertical**. As três configurações ficam exclusivamente no popup, sem controles duplicados na lateral. Categorias automáticas e distância máxima de graute permanecem nas Configurações do Projeto.
- Respeitar o recolhimento existente da barra: quando recolhida, o acesso reaparece ao reabrir suas propriedades. Abrir/fechar o popup não altera esse estado.
- O cabeçalho do popup identifica **Ferragens do pavimento** e o nome/cota do pavimento de origem. Não oferecer outro seletor de pavimento dentro dele. Para editar outro andar, fechar a tela, trocar o pavimento pelo fluxo existente e reabri-la.
- Permitir consulta em somente leitura, com edição e aplicação desabilitadas. Impedir abertura durante envio/processamento ou ajuste de imagem que bloqueie a edição existente; não descartar esses estados ao acionar o botão.
- Preservar a confirmação de renomeação do projeto no primeiro clique, conforme os demais acessos do editor. Abertura é consulta: não salva nem recalcula.

### Apresentação do popup

Conforme ajuste solicitado após a implementação inicial, dimensionar o diálogo pelo conteúdo, com largura máxima de 1180 px, altura automática e limite da janela; não ocupar quase toda a tela por padrão. Preservar fundo atenuado, cantos arredondados e editor perceptível ao fundo. O botão de acesso recebe espaçamento vertical próprio na lateral. Centralizar e alinhar Duplicar/Excluir pavimento, removendo suas dicas verdes personalizadas e mantendo apenas as dicas nativas. Manter o editor montado, bloqueando a interação com ele enquanto o diálogo estiver aberto.

Cabeçalho e rodapé permanecem disponíveis; somente o conteúdo central rola quando necessário. O rodapé contém **Cancelar** e **Aplicar alterações**; o cabeçalho oferece **Fechar**. Em desktop amplo, apresentar os três grupos lado a lado, com títulos claros e a mesma hierarquia visual. Reorganizar em menos colunas conforme a largura disponível; em telas estreitas, empilhar na ordem Graute vertical, Grampos dos encontros e Armadura das cintas, sem cortar campos, mensagens ou botões. Não usar abas: os três conjuntos ficam acessíveis na mesma tela.

Usar foco inicial no título ou primeiro controle apropriado, conter navegação por teclado dentro do diálogo e devolver o foco ao botão de origem ao fechar. Fechar, Cancelar e Escape seguem as mesmas regras de rascunho abaixo; clicar no fundo não fecha nem aplica. Preservar pavimento, Planta/Fiada, fiada, câmera e seleção confirmados ao retornar ao editor.

### Formulários preservados

**Graute vertical** mantém a escolha Simples/Reforçado por pavimento e a explicação dos padrões de furos da T-023 e suas revisões. Preservar a modalidade existente e a condição que desabilita sua edição quando a categoria global Encontros está desligada, sem apagar a escolha ou alterar as categorias globais. No popup, trocar a modalidade passa a editar um rascunho, sem salvamento imediato: sua confirmação ocorre no Aplicar alterações junto com os demais grupos.

**Grampos dos encontros** mantém ativação, diâmetro, comprimento nominal total, decomposição das pontas, programação por lista/intervalo, conversão entre modos, prévia de fiadas, validações e textos de limite nominal da T-025. Não criar espaçamento ou dimensões estruturais novos.

**Armadura das cintas** mantém ativação, quantidade de barras, diâmetro e prévia da T-026. Continuar com uma única configuração por pavimento para cintas, vergas e contravergas; usar o padrão atual editável de duas barras de 10 mm e a explicação de aplicação compartilhada.

Abrir a tela carrega os valores confirmados do pavimento; projetos sem configuração mantêm Simples como padrão de graute e grampos/armadura desativados, conforme os padrões existentes. Os campos e avisos devem aproveitar a largura do popup, sem herdar desnecessariamente a largura estreita dos controles da lateral. Identificações de grampos e armaduras no painel de **inspeção de fiadas**, bem como hover e desenhos no canvas, permanecem disponíveis nos locais atuais; são consultas, não os formulários que estão sendo movidos.

### Aplicação conjunta, rascunhos e recuperação

Proposta de confirmação: substituir a aplicação imediata da modalidade de graute e os dois botões de aplicar por **um único Aplicar alterações no rodapé**. Esse botão valida os três grupos integralmente antes de gravar. Havendo erro em qualquer grupo, não aplicar os demais parcialmente; mostrar a causa junto aos campos pertinentes, mantendo todos os valores para correção.

Após validação, confirmar as três configurações no mesmo pavimento em **uma operação de histórico e salvamento**, usando o fluxo existente e um único recálculo. Alterar apenas um grupo conserva os outros dois. O recálculo usa a modalidade de graute recém-confirmada junto das configurações de grampos e armadura, sem um estado intermediário salvo. Se os valores não mudaram, não criar operação, metadados, gravação ou recálculo redundante. Aplicar com sucesso mantém o popup aberto, atualiza a referência confirmada dos campos e informa o estado salvo. O usuário pode continuar editando ou fechar.

Campos digitados antes de Aplicar são rascunhos locais do diálogo, sem alteração no documento. Fechar, Cancelar ou Escape sem rascunho alterado simplesmente fecha. Com rascunho diferente do último aplicado, solicitar **Descartar alterações não aplicadas?**, oferecendo **Continuar editando** e **Descartar e fechar**. Não gravar ao sair nem descartar silenciosamente.

Durante envio/processamento, bloquear nova aplicação, edição e fechamento, conforme a operação existente, sem enfileirar ações. Em falha/incerteza de salvamento, conservar o candidato e a recuperação do projeto; não informar sucesso ou devolver campos aos valores anteriores. Mostrar no popup que não foi salvo, bloquear novas alterações e permitir fechá-lo após cessar a operação em voo para acessar o aviso existente de recuperação no editor. Fechar o diálogo não descarta o candidato já submetido ao salvamento: esse caso é distinto do rascunho ainda não aplicado.

Validar projeto/pavimento de origem contra o estado atual antes de confirmar. Não aplicar um rascunho ao pavimento ou projeto que venha a substituí-lo. Reabrir carrega os dados do contexto corrente, sem transportar rascunhos de outro andar.

### Dados, histórico e limites

Manter a modalidade de graute e as configurações de grampos e armadura nos campos por pavimento existentes, incluindo transporte, reabertura, importação e cópias. A reorganização inicial não exigia novo campo; o ajuste posterior de bitolas acrescenta groutDiameter opcional no formato 25. Não há migração SQL ou alteração de convenção do motor. Visibilidade do popup, rascunhos e foco são estado de sessão, sem persistência no projeto.

Preservar desfazer/refazer dos parâmetros aplicados, operações de pavimentos e falha/recuperação existentes. Desenhos em L/T, comprimentos nominais, regras de geração, diagnósticos e Orçamento de tijolos permanecem regidos pelos contratos atuais. Não mover os níveis globais de canaletas ou as categorias/distância de graute das Configurações do Projeto.

Na implementação, atualizar somente os documentos responsáveis pelo comportamento alterado:

- [PRD](../Ecovit-PRD.md): novo acesso, localização dos formulários e confirmação conjunta por pavimento.
- [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md): modal, botão, layout, foco, navegação, consulta e estados de bloqueio/erro.
- [Estado, histórico e operações](../arquitetura/Estado-Historico-e-Operacoes.md): rascunhos locais, confirmação atômica dos três grupos, fechamento e recuperação.
- Preservar o [Caderno técnico](../Ecovit-Caderno-Tecnico.md), os contratos de geração/persistência e os aceites históricos de [T-023](T-023-Grautes-Simples-e-Reforcados-nos-Encontros.md), [T-025](T-025-Grampos-nos-Encontros-por-Pavimento.md) e [T-026](T-026-Armadura-das-Canaletas-por-Pavimento.md); não reescrever seus resultados anteriores como se a nova interface já existisse naquelas entregas.

## Critérios de aceite

- [x] **A01** — Os três formulários (Graute vertical, Grampos dos encontros e Armadura das cintas) saem das Propriedades do Pavimento e são substituídos pelo botão Ferragens do pavimento. A escolha Simples/Reforçado fica no popup; o recolhimento existente é preservado.
- [x] **A02** — O popup dimensionado pelo conteúdo identifica corretamente o pavimento e oferece os três grupos completos, lado a lado ou empilhados conforme o espaço. Conteúdo rolável, cabeçalho/rodapé acessíveis, foco e retorno ao editor funcionam sem perda do contexto.
- [x] **A03** — Campos, padrões, conversões, prévias, validações e alcance por pavimento são preservados. Consulta em somente leitura funciona e não grava; formulários não se duplicam na lateral nem surgem configurações extras por categoria.
- [x] **A04** — Aplicar valida e salva os três grupos, incluindo a modalidade de graute, em uma operação, sem aplicação parcial diante de erro, nem operação redundante sem mudança. Desfazer/refazer conserva esse conjunto confirmado e os demais dados do pavimento.
- [x] **A05** — Fechamento/Escape/Cancelar respeitam rascunhos e confirmação de descarte. Processamento e falha/incerteza mantêm bloqueios, candidato e recuperação acessível, sem fechar durante envio ou anunciar sucesso indevido.
- [x] **A06** — Dados existentes e compatibilidade são preservados; o ajuste posterior de bitolas usa formato 25 com leitura dos anteriores, sem mudar a convenção do motor. Visualização na Fiada, identificação de ferragens, seleção, câmera e operações de pavimento continuam coerentes; contratos de interface/estado e resultados reais são atualizados.

## Resultado

Implementada em 2026-11-18, após autorização explícita. Os três formulários foram substituídos por um único botão nas propriedades do pavimento. O popup modal identifica o andar, usa os controles existentes como rascunhos e confirma o conjunto via uma única operação de pavimento. Configurações opcionais equivalentes aos padrões não são materializadas; grupos não editados permanecem intactos, incluindo grampos pendentes após redução posterior da altura das paredes.

A confirmação de descarte diferencia rascunhos locais de candidatos já submetidos. Envio bloqueia edição/fechamento; falha preserva o candidato e permite fechar para recuperar pelo aviso existente. Consulta em somente leitura, foco inicial/retorno, renomeação no primeiro clique, Escape, fundo, desfazer/refazer e troca de pavimento foram conferidos. PRD e contratos de interface/estado atualizados. Sem alteração de formato, motor, Caderno Técnico, persistência ou aceites históricos das T-023/T-025/T-026.

Validação proporcional: mudança de modal/foco/layout e confirmação atômica justificou cenários direcionados no Chrome, testes dos rascunhos e tipos/lint; sem build, Edge ou suíte ampla.

- Quatro testes de unidade em tests/floor-reinforcement-draft.test.ts aprovados (706 ms): padrões sem gravação, validação integral, conjunto válido e preservação de grupos/intenções existentes.
- Oito cenários distintos de Chrome aprovados no recorte dos arquivos floor-reinforcement, junction-grout, clamps e channel-reinforcement: confirmação atômica, descarte/responsividade/renomeação, envio/falha/consulta bloqueada, modalidades por andar, formulários e recuperação de grampos/armadura. Os cenários preservam as asserções de persistência, arquivo, histórico e visualização na Fiada.
- A primeira execução apontou quatro falhas de seletor/ambiguidade de status: nome acessível do seletor corrigido e aviso do popup mantido com aria-live sem duplicar o role do indicador global. Os cinco cenários afetados, incluindo o ensaio ampliado de envio em voo/somente leitura, passaram na execução seguinte (38,7 s). Conferência adicional do aviso de lista irregular passou no cenário específico de grampos (19,5 s), sem contar repetição como cobertura adicional.
- Conferência visual das capturas de 1440×1000 e 600×720: três colunas ou grupos empilhados, sem corte horizontal, conteúdo rolável e cabeçalho/rodapé disponíveis. Evidências locais ignoradas: .tools/t027/desktop.png e narrow.png.
- Typecheck aprovado; lint aprovado com um aviso preexistente de dependência de useEffect em src/editor/Rooms.tsx, sem erros; diff conferido. Logs e códigos de saída em .tools/t027/.
- A primeira preparação foi bloqueada pelo sandbox na verificação de porta; a execução autorizada do mesmo test:env confirmou o ambiente isolado e permitiu concluir os testes. Nenhum processo desconhecido foi encerrado e a porta 5173 foi preservada.

O aceite manual estava pendente ao concluir a verificação técnica desta etapa. Sem commit ou push nesta execução.

### Ajuste de apresentação após a entrega inicial

A pedido do solicitante, o popup passou a acompanhar o conteúdo, com largura máxima de 1180 px e altura fit-content limitada à janela; conserva a rolagem central em telas estreitas. Espaçamento do acesso na lateral ajustado; Duplicar/Excluir pavimento centralizados e alinhados, mantendo title nativo e retirando data-tooltip personalizado. Contratos de interface e PRD atualizados.

Dois cenários direcionados no Chrome aprovados (13,4 s), com conferência visual de desktop/largura estreita e da lateral. A primeira conferência identificou que height:auto ainda esticava o diálogo nativo; corrigido para fit-content e revalidado sem ampliar timeout ou cobertura. Capturas e logs em .tools/t027/. O aceite manual ainda aguardava confirmação nesta etapa.

### Listas de bitolas e barras do graute vertical

Pedido posterior implementado em 2026-11-18: Diâmetro do ferro usa lista de 5,0 mm (3/16"), 6,3 mm (1/4", padrão) e 8,0 mm (5/16"); Diâmetro das barras das cintas usa 8,0 mm (5/16"), 10,0 mm (3/8", padrão) e 12,5 mm (1/2"). Graute vertical ganha lista própria de 8,0 mm (5/16", padrão), 10,0 mm (3/8") e 12,5 mm (1/2"). Os valores são independentes por pavimento e confirmados no mesmo Aplicar alterações.

Valores anteriores permanecem intactos, inclusive bitolas fora do catálogo, apresentadas como valor salvo em opção desabilitada. Ausência usa os novos padrões, sem gravação redundante. O diâmetro do graute é intenção persistida e copiada; sozinho não recalcula nem muda o desenho. Formato atual 25, leitura 9–25, sem migração SQL ou alteração de nominal-v13. Contratos de dados, persistência, estado/interface, PRD e Caderno Técnico atualizados; aceites históricos da T-025/T-026 preservados.

Validação direcionada: 64 casos distintos dos arquivos floor-reinforcement-draft, clamps, channel-reinforcement, transport e floors conferidos. A primeira execução revelou expectativas antigas de padrão e recusa da versão 25, agora vigente; atualizadas para os novos padrões e para recusa de 26, mantendo todas as asserções de validade/adulteração. A execução de cinco arquivos teve 63 sucessos e somente o caso do novo limite de versão falhou; o recorte de dez envelopes passou após corrigir essa expectativa, sem repetir os aspectos já aprovados.

Seis cenários distintos do Chrome aprovados: listas/nomes/padrões, aplicação atômica, desfazer/refazer/reabertura, arquivo, visualização e recuperação de falhas de grampos/cintas, preservação de bitolas legadas ao editar somente o graute. Cinco passaram na rodada de 41 s; o cenário legado passou em 8,9 s após usar a propriedade DOM disabled da option, que não é reconhecida por toBeDisabled do Playwright. Typecheck e lint aprovados, com somente o aviso preexistente em Rooms.tsx. Logs locais em .tools/t027/diameters-*. Sem testes amplos ou build. O aceite manual ainda aguardava confirmação nesta etapa; sem commit/push.

### Aceite manual

Em 2026-11-18, o solicitante aprovou explicitamente a T-027, incluindo o popup Ferragens do pavimento, os ajustes de apresentação e da lateral e as configurações de diâmetro das ferragens. Aceite manual confirmado, separado dos resultados técnicos registrados acima.
