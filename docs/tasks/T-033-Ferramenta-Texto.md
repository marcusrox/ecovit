# T-033 — Adicionar anotações livres com a ferramenta Texto

**Tipo** — Implementação

**Resumo** — Permite inserir e editar anotações livres na planta, com várias linhas, posição e largura ajustáveis, formatação básica, rotação e destaque visual. Os textos ficam salvos no projeto e pertencem a um pavimento.

**Execução** — Verificada

**Data de execução** — 2026-11-23

**Aceite manual** — Pendente

## Alteração e limites

Acrescentar a ferramenta Texto ao editor existente para registrar nomes livres, observações de execução, materiais e lembretes. Esta task especifica somente a primeira versão. Sua criação não autoriza implementação, commit, push ou publicação.

Referências: [PRD — RF-09](../Ecovit-PRD.md#rf-09--edição-simples-e-recálculo-automático), [Editor e interação](../arquitetura/Editor-e-Interacao.md), [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md), [Medidas e imagens](../arquitetura/Medidas-e-Imagens.md), [Estado, histórico e operações](../arquitetura/Estado-Historico-e-Operacoes.md), [Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md) e [T-032 — Salvamento em segundo plano](T-032-Salvamento-em-Segundo-Plano.md).

### Inserção, conteúdo e edição

- Oferecer Texto na barra de ferramentas em Planta, com ícone do catálogo central, nome acessível e dica coerentes com os controles existentes.
- Selecionar a ferramenta e clicar na planta define o ponto de inserção no pavimento ativo e abre um rascunho de conteúdo multilinha. Mostrar prévia antes da confirmação, sem gravar um elemento vazio pelo clique inicial.
- Aceitar texto simples, acentos e quebras de linha explícitas. Não interpretar HTML, Markdown, links ou comandos; o texto não cria ações executáveis.
- Selecionar um texto por clique no corpo ou pelo seletor acessível de elementos. Duplo clique abre a edição, foca o campo de conteúdo e seleciona todo o texto; se o painel estiver recolhido, reabri-lo. Conteúdo e formatação ficam no painel de propriedades, seguindo o padrão do aplicativo.
- Sair do campo de digitação confirma o conteúdo válido e diferente do confirmado, inclusive por Tab, recolhimento ou clique em outro elemento. Na criação, confirma a anotação com o conjunto válido da prévia; não criar registro parcial. Aplicar confirma os valores válidos ainda pendentes em conjunto. Cancelar ou Escape descarta somente o que ainda não foi confirmado; clicar em Cancelar não salva o conteúdo antes de descartá-lo e clicar em Aplicar não gera duas operações. Enter dentro do campo multilinha insere nova linha, sem confirmar a edição.
- Conteúdo composto somente de espaços ou quebras de linha não pode ser aplicado. Exibir a validação e preservar o rascunho para correção, sem apagar ou substituir o texto confirmado anterior. Exclusão é uma ação própria.

### Rascunhos e confirmação

Manter somente um rascunho de Texto por vez. Considerar pendência a criação/duplicação ainda não confirmada ou campos diferentes do estado confirmado; simplesmente selecionar, abrir propriedades ou focar o conteúdo sem alterá-lo não bloqueia gestos. Conteúdo é prévia durante a digitação e confirma ao sair do campo. Na anotação existente, essa confirmação salva somente o conteúdo, preservando os ajustes de aparência pendentes, mesmo inválidos. Largura, tamanho, rotação, cor, negrito, alinhamento, fundo e contorno alteram apenas a prévia até Aplicar. Uma aplicação válida confirma os ajustes restantes em um único passo de histórico; clicar várias vezes em Girar ou Negrito durante essa edição não cria passos separados. Sem diferença efetiva, perda de foco e Aplicar não gravam nem criam histórico; remover rascunho sem diferenças para Desfazer atuar diretamente na operação confirmada.

Trocar seleção, ferramenta, pavimento, modo ou projeto descarta os ajustes ainda pendentes, após a confirmação normal do conteúdo válido ao sair do campo e sem abrir confirmação adicional. Informar no painel que conteúdo salva ao sair e demais ajustes aguardam Aplicar/Cancelar. Na criação/duplicação, cancelar elimina somente a prévia; na edição, conserva o texto confirmado. Recolher/reabrir o mesmo painel, navegar e mudar o zoom não cancelam os demais ajustes pendentes. Uma confirmação remota de salvamento também não os cancela.

Enquanto houver pendência de rascunho de Texto, impedir movimento, ajuste por alça, duplicação e exclusão da mesma anotação até Aplicar ou Cancelar. Não misturar campos pendentes com um gesto sobre o texto confirmado. Ao aplicar, partir do documento local vigente e atualizar somente a anotação editada, preservando outras alterações já aceitas. Demais bloqueios de contexto/recuperação e regras de Desfazer seguem o editor e a T-032.

### Posição, largura, tamanho e rotação

- Arrastar o corpo move a anotação inteira, com prévia transitória e confirmação ao soltar. Escape, perda de foco ou cancelamento seguem os mecanismos existentes de gestos; ausência de mudança não cria operação.
- Posicionar livremente, sem encaixe obrigatório na malha e sem vínculo com paredes, ambientes ou mobiliários. Usar coordenadas e limites de integridade do editor.
- Ajustar a largura por uma única alça no centro do lado direito local da caixa e pelo campo correspondente nas propriedades. Não oferecer alça esquerda ou de altura. A largura pertence à caixa de texto, não representa uma transformação que estica os caracteres.
- A âncora é o canto superior esquerdo da caixa na orientação 0°. Rotacionar a caixa em torno dessa âncora; tamanho, conteúdo, alinhamento e largura não mudam sua posição. Após rotação, a alça acompanha o lado direito local, e o arraste ajusta a largura nesse eixo, sem alterar posição ou rotação. Ao cruzar o mínimo permitido, manter a prévia no mínimo, sem espelhar a caixa. Ao soltar, confirmar um gesto; Escape cancela.
- Quebrar linhas automaticamente na largura disponível e conservar as quebras explícitas. Palavras maiores que uma linha são quebradas entre caracteres, sem cortar caracteres na renderização ou inserir quebras no conteúdo salvo. A altura se adapta ao conteúdo, sem corte vertical ou controle de altura fixa. Redimensionar não altera o conteúdo nem o tamanho da fonte.
- Apresentar largura e tamanho do texto em centímetros do desenho. O tamanho controla a altura nominal da fonte; não é uma dimensão física de cada glifo. Aplicar os limites explícitos abaixo, além dos limites existentes de coordenadas e arquivo.
- A anotação acompanha escala e deslocamento da câmera; seu tamanho no desenho é persistente e sua apresentação em tela varia com o zoom. Não criar tamanho fixo em pixels nem alteração automática do valor salvo para manter um mínimo visual. Câmera e navegação não gravam o projeto.
- Oferecer rotação em passos de 90°, nas orientações 0°, 90°, 180° e 270°, pelo painel e com confirmação por Aplicar. Não oferecer rotação livre ou alça de rotação nesta versão.

### Padrões e limites

Os valores abaixo são convenções de apresentação desta ferramenta, sem significado construtivo:

| Parâmetro | Regra da primeira versão |
|---|---|
| Conteúdo | Até 2.000 caracteres por anotação, incluindo espaços e quebras; contar unidades UTF-16, como os campos de texto JavaScript existentes. Normalizar CRLF/CR para LF antes da contagem e conservar as demais quebras/espaços informados. Não truncar conteúdo ao colar, aplicar ou importar; excesso é erro de validação. |
| Fonte | IBM Plex Sans já distribuída com o aplicativo; peso 400 normal e 600 no controle Negrito. Sem fonte nova, seletor de família ou formatação por trecho. |
| Tamanho | Inicial de 10 cm; intervalo de 1 a 100 cm, inclusive, com precisão de 0,01 cm. |
| Largura | Inicial de 200 cm; mínimo igual a duas vezes o tamanho nominal da fonte e máximo de 10.000 cm, com precisão de 0,01 cm. |
| Cor do texto | Inicial `#263d33`; seletor nativo de cor, RGB opaco no formato `#RRGGBB`, sem transparência ou editor de paletas. |
| Fundo e contorno | Desligados inicialmente; quando ligados, fundo `#f5f4ee` e contorno `#64794f`, sem parâmetros adicionais editáveis. |
| Demais padrões | Rotação 0°, sem negrito, alinhamento à esquerda. |

A largura mínima acompanha o tamanho no rascunho: aumentar a fonte não amplia a largura silenciosamente. Se a combinação ficar inválida, informar o mínimo exigido e impedir Aplicar até correção. Entrada inválida conserva o rascunho e o último estado confirmado. Validar conteúdo, valores numéricos, cor, orientações, IDs e pavimento tanto na confirmação quanto na leitura remota/importação; não depender apenas de controles HTML. Dimensões de layout são derivadas, sem persistir altura, métricas de glifos ou quebras automáticas. Reusar os limites globais de documento existentes, sem nova cota de quantidade de textos nesta versão.

### Aparência e propriedades

- Usar a fonte e os valores definidos em Padrões e limites, sem fonte externa nova.
- Oferecer tamanho, negrito para o bloco inteiro, cor do texto e alinhamento à esquerda, centralizado ou à direita dentro da caixa. Não há formatação diferente por palavra ou trecho.
- Permitir ligar/desligar fundo claro e contorno discreto independentemente, para destacar anotações sobre o desenho. O fundo e o contorno usam o padrão visual do aplicativo, sem editores adicionais de cor, espessura ou estilo para esses dois recursos.
- A prévia e os campos mostram os valores iniciais definidos antes de aplicar. Nenhum controle de aparência salva imediatamente; todos seguem a confirmação conjunta do painel.
- Reusar o painel lateral, seus controles de recolher/reabrir e os padrões de foco e validação. Não criar editor ou protótipo separado.
- Aplicar texto reutiliza o botão primário com ícone de confirmação; Cancelar, Girar, Duplicar e Excluir usam a linha compacta de botões com ícones, nomes acessíveis e dicas das demais ferramentas. Exclusão tem destaque de perigo. Aplicar/Cancelar ficam indisponíveis sem pendência.

### Pavimento, seleção e ações

Cada anotação tem identidade própria e pertence a um único pavimento. Criar e editar somente no pavimento ativo. Mostrar anotações somente em Planta; entrar em Fiada não as converte, remove ou desenha sobre as fiadas. Textos não substituem etiquetas de ambientes nem criam ambientes cadastrados. Não acrescentar preferência de visibilidade nesta versão.

Na ferramenta Selecionar, o corpo selecionável é a caixa inteira, incluindo espaços entre linhas e áreas vazias até sua largura, mesmo sem fundo ou contorno; aplicar a transformação da rotação ao teste de clique. Alças da seleção ativa têm prioridade; depois, textos do pavimento ativo têm prioridade sobre os corpos dos demais elementos. Entre textos sobrepostos, priorizar o último na ordem de anotações do documento. Preservar a ordem relativa de seleção dos demais tipos e permitir alcançá-los pelo seletor acessível, sem ferramenta nova para alternar camadas.

Na ferramenta Texto, clicar em texto existente seleciona-o; duplo clique abre a edição. Clicar em outra posição inicia criação, mesmo sobre outros tipos de elemento. Movimentação e ajuste por alça ocorrem em Selecionar. Após confirmar criação ou duplicação, retornar a Selecionar com o novo texto selecionado. Nas demais ferramentas de desenho, textos não interceptam os gestos destinados àquela ferramenta. Na pintura, renderizar os textos ativos sobre os elementos confirmados e abaixo dos realces/alças/prévias de interação, na mesma ordem usada para resolver sobreposição. Textos de outro pavimento não são desenhados ou selecionados como referência de comparação.

Enquadrar em Planta inclui os limites completos das caixas de textos confirmados do pavimento ativo, considerando rotação e altura derivada, junto dos elementos já considerados pelo editor. Isso permite enquadrar também um pavimento que contenha somente textos. Excluir rascunhos, alças e seleções do enquadramento; criar/editar um texto não executa Enquadrar automaticamente.

Permitir duplicar e excluir a anotação selecionada pelas propriedades. Duplicar inicia uma prévia posicionável com conteúdo e aparência copiados, confirmada com identidade independente; cancelar não cria a cópia. Delete exclui a seleção quando o foco não estiver em campo de edição, seguindo os bloqueios e atalhos existentes.

Cada criação, confirmação de conteúdo por perda de foco, aplicação conjunta dos demais ajustes do painel, movimento, ajuste de largura por alça, duplicação ou exclusão efetiva corresponde a um passo desfazível. Rotação e demais mudanças de aparência entram no passo de Aplicar, sem operações adicionais por clique. Prévias, digitação de rascunho, seleção e cancelamento não gravam nem consomem histórico. Alterar o texto original depois de duplicá-lo não altera a cópia.

### Persistência, cálculo e recuperação

Salvar conteúdo, pavimento, posição, largura, tamanho, rotação e aparência como intenção do projeto. Preservar em reabertura remota, download/importação `.ecovit`, cópia de projeto e duplicação de pavimento. Remover um pavimento remove seus textos; desfazer restaura o conjunto com as identidades correspondentes. Projetos anteriores sem anotações continuam abrindo sem criação automática de textos ou perda de dados, conforme a evolução do formato definida em Persistência.

Operações exclusivas de texto são não construtivas: não alteram geometria, ambientes, áreas, composição, diagnósticos ou orçamento e não chamam o motor. Preservar também resultado que já estava desatualizado. Integrar ao mecanismo compartilhado de histórico, salvamento em segundo plano e recuperação da T-032; não criar protocolo ou fila própria para textos. Uma mudança conjunta com insumos construtivos conserva a classificação real do documento.

Salvando permite novas edições compatíveis, enquanto histórico e Recalcular respeitam os bloqueios vigentes. O retorno da aplicação local não anuncia confirmação remota. Falha, desconexão ou sessão expirada preserva a última intenção local e seus textos para recuperação/download, sem perder alterações posteriores a um pedido em voo. Somente leitura permite visualizar e consultar propriedades, sem editar, criar, mover, redimensionar, duplicar ou excluir.

Na futura implementação autorizada, atualizar os contratos responsáveis de produto, interação, apresentação, estado e persistência, preservando IDs e aceites anteriores. Esta especificação não altera os contratos vigentes nem define antecipadamente um número de versão de arquivo ou uma migração SQL.

### Fora do escopo

Linhas de chamada, setas e vínculos com elementos; estilos reutilizáveis; controles para ocultar todas as anotações ou escolher visibilidade por modo; exibição em Fiada; bloqueio de posição; textos vinculados a dados automáticos; múltiplas fontes; formatação por trecho, itálico ou sublinhado; rotação livre; listas automáticas; novos relatórios, impressão ou exportação para PDF/imagem. Essas evoluções não são pré-requisitos desta versão.

## Critérios de aceite

- [x] **A01** — Texto está acessível em Planta. Clicar define posição e inicia prévia com conteúdo multilinha; aplicar cria uma anotação válida no pavimento ativo. Texto vazio ou só com espaços/quebras é recusado sem substituir o estado confirmado. Acentos e quebras de linha são preservados como texto simples; a normalização e o limite de 2.000 caracteres são respeitados sem truncamento silencioso.
- [x] **A02** — Clique e seletor acessível selecionam a anotação. Duplo clique abre o painel, foca e seleciona todo o conteúdo. Enter insere nova linha. Sair do campo confirma conteúdo válido em uma operação, sem aplicar aparência pendente; na criação, exige e confirma o conjunto válido. Demais controles, inclusive rotação, são rascunho até Aplicar. Cancelar/Escape descartam somente alterações não confirmadas, sem salvar antes; Aplicar não duplica a confirmação. Conteúdo inválido preserva o estado confirmado. Sem mudança não há gravação/histórico. Troca de contexto descarta os ajustes restantes; recolher painel, navegar e mudar zoom os preservam. Desfazer/refazer alcançam diretamente conteúdo confirmado sem outros ajustes pendentes. Gesto, duplicação e exclusão aguardam Aplicar/Cancelar quando houver pendência.
- [x] **A03** — Em Selecionar, arraste move a anotação livremente com prévia, sem snap obrigatório ou vínculo com outros elementos. Soltar confirma um gesto; cancelar ou não mudar a posição não gera escrita ou histórico. Uma aplicação de painel preserva a posição vigente e as demais alterações locais já aceitas, sem reaplicar snapshot antigo do projeto.
- [x] **A04** — Uma única alça direita local e o campo de largura ajustam a caixa sem deformar caracteres, mudar a âncora ou girar o texto, inclusive nas quatro orientações. A alça respeita o mínimo, sem espelhamento. Palavras longas quebram entre caracteres, quebras explícitas são preservadas e a altura se adapta sem corte vertical. Valores fora das faixas/precisão e combinações largura/tamanho inválidas impedem Aplicar. Zoom/câmera mudam somente a apresentação, sem escrita ou ajuste do tamanho salvo.
- [x] **A05** — IBM Plex Sans, pesos 400/600, tamanho inicial de 10 cm e largura inicial de 200 cm são usados conforme a tabela. Negrito de bloco, seletor nativo de cor opaca e três alinhamentos funcionam na prévia e após confirmar. Fundo e contorno têm as cores fixadas e podem ser ligados/desligados separadamente. Rotação aceita somente os quatro passos definidos e preserva a âncora superior esquerda local, assim como alterações de conteúdo/largura.
- [x] **A06** — Duplicar conserva conteúdo e aparência em uma cópia posicionável com ID independente; cancelar não cria cópia. Excluir e Delete respeitam foco e bloqueios. Desfazer/refazer restaura cada gesto e os valores anteriores, sem alterar outras anotações ou duplicar ações de histórico.
- [x] **A07** — Textos pertencem ao pavimento correto e aparecem somente em Planta. Troca de pavimento/modo não transfere ou perde anotações. Duplicação de pavimento cria cópias independentes; remover/desfazer restaura o conjunto coerente. Etiquetas de ambiente e demais elementos permanecem preservados.
- [x] **A08** — Reabertura remota, cópia de projeto e transporte `.ecovit` preservam todos os parâmetros. Projetos anteriores sem textos mantêm compatibilidade; dados inválidos são recusados sem substituir o documento válido. Download após falha usa a última intenção local, inclusive textos ainda não confirmados pelo servidor.
- [x] **A09** — Operações exclusivas de texto preservam resultado/diagnósticos atuais ou desatualizados, sem motor ou mudança de áreas/orçamento. Salvamento, respostas atrasadas, histórico bloqueado durante pendência, falhas e recuperação seguem a T-032, sem apagar texto local posterior ou rascunho mais recente pela confirmação de um pedido antigo.
- [x] **A10** — Somente leitura e demais bloqueios impedem mutações por controles, atalhos e gestos, mantendo consulta. A ferramenta e suas propriedades seguem iconografia, foco e painel compartilhados. Contratos são atualizados somente com a implementação autorizada, sem incluir as evoluções fora do escopo.
- [x] **A11** — Seleção usa toda a caixa rotacionada, com prioridade das alças ativas, depois textos, depois demais corpos; entre textos, vale a ordem do documento. Pintura e clique concordam. As ferramentas Texto, Selecionar e demais ferramentas respeitam os comportamentos definidos, sem capturar indevidamente gestos de desenho. Outros elementos continuam acessíveis pelo seletor, e textos de referência de outro pavimento permanecem ausentes.
- [x] **A12** — Enquadrar considera as caixas completas rotacionadas dos textos confirmados ativos, inclusive em pavimento contendo somente anotações, sem incluir prévias ou disparar automaticamente após edição. Os limites de conteúdo, dimensões, precisão, cor e rotação são validados também na leitura remota/importação; altura e quebras automáticas continuam derivadas, sem dados redundantes persistidos.

## Resultado

### Validações manuais pendentes — ajuste de edição

Registradas a pedido do solicitante. Os itens abaixo aguardam sua conferência na interface; não alteram os resultados técnicos já aprovados nem representam aceite manual confirmado.

- [ ] **Duplo clique (A02):** abrir a edição de uma anotação existente, inclusive com painel recolhido, e conferir foco no campo com todo o conteúdo selecionado.
- [ ] **Salvar ao sair (A01/A02):** editar conteúdo e sair por Tab, clique em outro texto ou recolhimento do painel; conferir a atualização na planta e sua conservação após aguardar Salvo e reabrir o projeto. Conteúdo vazio ou só com espaços deve ser recusado sem apagar o texto anterior.
- [ ] **Conteúdo e aparência (A02/A05):** manter uma alteração de formatação pendente, editar o conteúdo e sair do campo; conferir que somente o conteúdo foi salvo. Aplicar confirma a formatação; Cancelar a descarta preservando o conteúdo já salvo.
- [ ] **Cancelar e histórico (A02/A06):** digitar e clicar diretamente em Cancelar ou pressionar Escape; conferir que a digitação ainda não salva foi descartada. Após salvar conteúdo ao sair, conferir Desfazer/Refazer sem passos duplicados, aguardando o término do salvamento.
- [ ] **Botões (A10):** conferir clareza e acesso ao botão primário Aplicar texto e aos ícones Cancelar, Girar, Duplicar e Excluir, incluindo dicas, estados desabilitados e acesso por rolagem em janela menor.

### Ajuste de edição solicitado em 2026-11-23

Duplo clique agora seleciona todo o conteúdo. Perda de foco confirma o conteúdo válido pelo salvamento compartilhado, antes de mudar a seleção; aparência pendente continua em rascunho. Na criação, confirma somente uma anotação integralmente válida. Cancelar/Escape descartam o que ainda não foi confirmado, Aplicar não duplica operações e rascunho sem diferenças é limpo para Desfazer atuar diretamente no conteúdo salvo. Aplicar usa o botão primário existente; cancelar, girar, duplicar e excluir reutilizam a linha compacta de ícones com dicas e nomes acessíveis. Contratos e A02 atualizados, preservando os demais IDs e o registro anterior.

Validação proporcional ao impacto em foco, confirmação e histórico: três cenários existentes de Texto aprovados no Chrome em 25,4 s (`.tools/t033-blur-e2e.log`); cenário dirigido adicional de troca de seleção, seleção integral, conteúdo inválido, Cancelar, Tab, formatação pendente, aplicação única e Desfazer/Refazer aprovado em 15,3 s (`.tools/t033-blur-cases-recheck.log`). A inclusão de Desfazer/Refazer revelou uma expectativa incorreta do ensaio: o histórico limpa seleção conforme o contrato existente; corrigida a seleção no teste, sem alterar esse comportamento nem ampliar timeout. Registro da tentativa em `.tools/t033-blur-cases-final.log`. São quatro cenários distintos, sem contar repetições como cobertura adicional. Captura `.tools/t033-blur-actions-900.png` conferida: ações acessíveis por rolagem e sem excesso horizontal em 900 px.

Dez testes de domínio/estado aprovados em 0,58 s (`.tools/t033-blur-unit.log`); typecheck, lint do recorte e diff aprovados (`.tools/t033-blur-types.log`, `.tools/t033-blur-lint.log`, `.tools/t033-blur-diff.log`). Não repetida a suíte ampla ou a matriz de navegadores. Ambiente isolado nas portas 5174/3002, sem controlar 5173. Aceite manual permanece pendente.

### Histórico da especificação

Especificação criada em 2026-11-23 a pedido do solicitante, com a primeira versão da ferramenta Texto e critérios de aceite pendentes. Evoluções posteriores foram explicitamente excluídas. Nenhuma implementação ou alteração nos contratos vigentes foi realizada por esta task; execução e aceite manual permanecem pendentes.

Conferência desta etapa limitada à consistência da especificação, referências locais e diff. A futura implementação deve selecionar verificações proporcionais aos contratos afetados conforme a [política de qualidade](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração), sem impor suíte completa ou matriz ampla pela criação desta task.

Revisada em 2026-11-23 a pedido do solicitante para fechar as seis lacunas identificadas: ciclo de vida de rascunhos e troca de contexto; confirmação conjunta do painel versus gestos; pintura/seleção/sobreposição e enquadramento; âncora e uma única alça de largura; palavras longas e limites explícitos; fonte, valores iniciais e controle simples de cor. Mantidos os IDs A01–A10 e acrescentados A11/A12 para os resultados de seleção/enquadramento e validação. A revisão autoriza somente a atualização desta especificação. Nenhum código ou contrato vigente foi alterado; implementação e aceite manual continuam pendentes.

### Implementação em 2026-11-23

Implementação autorizada posteriormente pelo solicitante e concluída no editor existente. Os registros acima preservam a elaboração da especificação; os critérios marcados representam a verificação técnica desta entrega. Aceite manual permanece pendente.

- **A01/A02/A05** — Ferramenta Texto usa Icon/text→Type, painel lateral compartilhado, conteúdo simples multilinha, foco na criação/duplo clique e confirmação conjunta. Campos, limites, defaults, cor nativa, pesos 400/600 e aparência implementados; Enter insere linha, Escape/Cancelar e troca de contexto não gravam rascunho. Recolher, câmera e confirmação remota preservam a edição. Não há gravação por clique de rotação/formatação ou por tecla.
- **A03/A04/A11/A12** — Movimento livre e única alça direita local com mínimo, âncora e quatro orientações; layout derivado com quebra por grafemas, métricas da fonte local e altura automática. Previews não consomem histórico. Caixa inteira selecionável, desempate pela ordem da coleção, prioridade das alças ativas e seletor de elementos encobertos; paredes aparecem nesse seletor quando existem textos. Enquadrar inclui os textos confirmados ativos, inclusive planta sem paredes, sem enquadramento automático ou uso de rascunhos. Removida a orientação de planta vazia quando há textos. Ajustes exclusivos de imagem continuam precedendo as interações de texto.
- **A06/A07/A08** — Duplicação posicionável com identidade própria, exclusão/Delete e histórico; cópia/remoção de pavimento e merge de visão preservam isolamento. Texto aparece apenas em Planta ativa, sem referência de outro pavimento. Transporte e reabertura remota preservam dados. Formato 31 acrescenta `model.texts`; documentos 9–30 normalizam para coleção vazia, sem aceitar textos não vazios em envelope anterior. Leitor compartilhado valida campos, IDs e pavimento. Não há novo SQL, serviço ou dependência.
- **A09/A10** — Textos ficam fora dos insumos construtivos e usam o fluxo da T-032, preservando composição/diagnósticos e resultado já desatualizado. Aplicar usa documento local vigente; nenhuma resposta antiga restaura edição ou rascunho anterior. Recuperação/download conserva intenção local, e somente leitura bloqueia campos, ações e gestos. Contratos atualizados em RF-24, Medidas, Estado, Editor, Interface e Persistência; README informa envelope 31. Evoluções excluídas permanecem fora do escopo.

### Verificação técnica

A mudança de envelope afeta leitores compartilhados e o transporte de todas as famílias do documento; por esse impacto concreto, foi executada a suíte unitária, além dos cenários dirigidos de interface/fluxo. A interface nova foi conferida no Chrome; uma conferência específica no Edge cobriu fonte/canvas e segmentação de caracteres. Não foi executada matriz ampla ou build.

- **Unitários:** rodada completa com 713 casos: 674 aprovados, 31 ignorados pela configuração existente e oito falhas em 41,90 s. Seis falhas eram expectativas do modelo anterior e o adaptador legado de testes ainda limitado ao formato 30: acrescentada a coleção vazia esperada e atualizado o formato suportado, preservando comparações integrais e testes de recusa de versão futura. Dois testes de Git/Bash excederam o timeout existente durante a execução concorrente; uma única reexecução isolada, fora da restrição de subprocessos e com `--maxWorkers=1`, aprovou os cinco arquivos afetados: 47 testes em 9,20 s, sem ampliar timeout ou remover asserções. Ao todo, **682 testes distintos aprovados e 31 ignorados**, sem somar repetições. Logs: `.tools/t033-unit-all.log` e `.tools/t033-unit-recheck.log`.
- **Domínio/estado novos:** dez testes próprios cobrem limites/normalização, quatro orientações e transformações inversas, grafemas/palavras longas, formato 31/legados e dados inválidos, cópia/remoção de pavimento, histórico sem motor, confirmação atrasada, rascunho posterior, rejeição, download e descarte. Integram os 682 aprovados; rodada inicial de 0,96 s em `.tools/t033-unit-initial.log`.
- **Chrome:** **sete cenários distintos aprovados**: três de Texto, três da T-032 e um de imagem. Rodada Texto + T-032: seis aprovados em 39,2 s (`.tools/t033-e2e-final.log`). Na revisão de camadas/rascunhos, os três cenários Texto passaram novamente; a regressão de imagem revelou que o ensaio recarregava antes da confirmação remota. Mantida a comparação integral e acrescentada espera por Salvo antes de recarregar; o cenário passou em 17,5 s (`.tools/t033-image-regression-final.log`). Conferência do estado vazio/enquadramento e foco em 900 px: um cenário aprovado em 14,1 s (`.tools/t033-e2e-layout.log`). Fechamento de prioridade de alças restrita a projetos com textos e bloqueio de zoom durante arraste: dois cenários aprovados em 18,6 s (`.tools/t033-gestures-final.log`). O histórico de falhas/correções permanece em `.tools/t033-e2e-initial.log` e `.tools/t033-e2e-interaction-final.log`.
- **Correções de interface durante validação:** preservado o foco do campo de criação contra o foco padrão do clique no canvas; acrescentado acesso a paredes encobertas pelo seletor; conferidos arraste, mínimo da alça rotacionada, impedimento de movimento/duplicação com campos pendentes, cópia independente, Delete/undo, sobreposição, contexto e somente leitura. Capturas `.tools/t033-properties-900.png` e `.tools/t033-text-properties.png` conferidas; painel rolável e sem excesso horizontal na largura de 900 px.
- **Edge:** cenário dirigido de painel, multiline, formatação, foco, enquadramento, cancelamento, transporte e reabertura aprovado em 12,2 s, sem alegar homologação completa. Ambiente conferido explicitamente com `test:env --edge`, usando ecovit_test/5174/3002, sem controlar o servidor 5173 do solicitante. Logs: `.tools/t033-edge-env.log` e `.tools/t033-edge-final.log`.
- **Checagens finais:** typecheck, lint do recorte sem avisos, referências documentais e diff aprovados. Logs: `.tools/t033-types-final.log`, `.tools/t033-lint.log` e `.tools/t033-diff.log`. Resultados técnicos não constituem aceite manual; commit, push e publicação não foram solicitados nesta implementação.

Na última conferência dos atalhos/validação, Delete em prévia de criação/duplicação foi explicitamente bloqueado para não cair no comando genérico de exclusão e gerar operação vazia. A mensagem de combinação inválida agora informa a largura mínima numérica em cm, sem ampliar a caixa automaticamente. O cenário de criação confirma ambos e mantém foco, histórico e integridade: aprovado em 13,1 s (`.tools/t033-create-final.log`), sem contar a repetição como cobertura distinta. Lint dos arquivos finais e conferência documental registrados em `.tools/t033-create-lint.log`, `.tools/t033-canvas-lint.log` e `.tools/t033-doc-check.log`.
