# T-018 — Etiquetas de área e fechamento de ambientes

**Tipo** — Implementação

**Resumo** — Adiciona etiquetas com nome e área de regiões fechadas e segmentos independentes de fechamento em Planta, com medição pelas faces internas, atualização geométrica e indicação persistente de revisão.

**Execução** — Verificada

**Data de execução** — 2026-11-13

**Aceite manual** — Confirmado pelo solicitante

## Alteração e limites

Adicionar ao editor do Ecovit duas ferramentas integradas: **Etiqueta** e **Fechamento**. Implementação autorizada pelo solicitante após as revisões da especificação.

| Texto visível do botão | Dica do botão |
|---|---|
| Etiqueta | Etiqueta com área |
| Fechamento | Fechamento de ambiente |

Usar os nomes curtos para identificar as ferramentas na interface e nesta especificação. As dicas são os textos exatos da tabela; “linha de fechamento” descreve a entidade desenhada pela ferramenta Fechamento, não um nome alternativo do botão.

### Etiqueta

- Com a ferramenta ativa, um clique no interior do ambiente identifica a região fechada e cria sua etiqueta, sem exigir desenho manual do contorno ou preenchimento prévio do nome.
- Medir a área em planta pelas faces internas das paredes do ambiente, considerando a geometria do pavimento correspondente. Não medir pelos eixos ou pelas faces externas das paredes.
- Portas, janelas e vãos do tipo abertura livre não interrompem o fechamento: para reconhecer o ambiente, considerar a continuidade da parede hospedeira nesses trechos. A troca do tipo de vão não altera a separação das áreas.
- Descontar a área ocupada por paredes isoladas no interior do ambiente. Quando houver um recinto fechado dentro de outro, excluir seu interior da área do ambiente externo; o recinto interno pode receber uma etiqueta própria.
- Aceitar fechamentos compostos por paredes, por paredes combinadas com linhas de fechamento ou somente por linhas de fechamento de ambiente, sem exigir parede real. Medir pelo limite das linhas nos trechos sem parede. Sem um contorno fechado, recusar a criação com orientação curta para conferir as paredes e linhas de fechamento, sem deixar uma etiqueta parcial.
- Cada região fechada delimitada pelo conjunto tem medição própria, independentemente do tipo de limite. Em dois retângulos de linhas, um dentro do outro, o clique entre eles mede a região externa descontando a interna; o clique dentro do menor mede somente seu interior. Terreno, mobiliários, imagens e contornos de lajes não são limites de fechamento desta ferramenta.
- Criar um nome automático na forma `Ambiente 1`, `Ambiente 2` e assim por diante, com sequência por pavimento. Não reutilizar números de etiquetas excluídas nem renumerar as existentes. Renomear não altera a sequência. A duplicação do pavimento preserva os nomes; novas etiquetas continuam a sequência da cópia.
- Um novo clique em um ambiente com etiqueta válida seleciona a etiqueta existente, mesmo que ela esteja posicionada fora dele, sem criar outra etiqueta. Etiquetas em revisão não reservam região nem impedem criar outra etiqueta válida; permanecem selecionáveis pelo próprio texto para exclusão.
- Permitir renomear pelo painel de propriedades após a criação, sem diálogo obrigatório, sem alterar a geometria ou exigir recriar a etiqueta. Aparar espaços nas extremidades e exigir nome de 1 a 100 caracteres.
- Posicionar inicialmente o centro da etiqueta no ponto clicado. Exibir o nome na primeira linha e a área em m² na segunda, com ambas as linhas centralizadas entre si. Usar duas casas decimais e vírgula decimal, como `12,00 m²`, arredondando somente a apresentação. A área é calculada pelo sistema, sem edição manual do valor.
- Manter o texto horizontal e com tamanho de tela constante, seguindo o padrão das medidas existentes. Limitar a largura visual do nome e quebrá-lo em linhas quando necessário, sem truncá-lo; a área permanece abaixo do bloco do nome e centralizada. A apresentação em duas linhas se aplica aos nomes que cabem em uma linha.
- Após criar, selecionar a etiqueta e mostrar suas propriedades, sem transferir automaticamente o foco ao campo de nome. Ao selecionar uma etiqueta válida, realçar discretamente a região correspondente, inclusive quando o texto estiver fora dela; o realce é transitório e não altera a geometria.
- Permitir mover a etiqueta após a criação para qualquer posição válida do desenho, inclusive fora do ambiente. A posição gráfica da etiqueta é independente da referência usada para identificar o ambiente: arrastá-la para outro local não troca a área medida.
- Atualizar automaticamente a área quando as paredes ou linhas que delimitam o ambiente forem alteradas e a referência continuar válida, preservando o nome e a posição escolhidos para a etiqueta.
- Se a etiqueta perder a referência do ambiente, inclusive por perda de fechamento, substituir todo o texto exibido por **Revisar ambiente**, sem nome ou área junto da mensagem. Conservar a entidade, o nome original nos dados e sua posição para permitir selecioná-la e excluí-la; mostrar o nome original nas propriedades para identificação. A correção exige excluir a etiqueta e criar outra; não oferecer reassociação nem recuperar automaticamente a etiqueta após restabelecer o fechamento. A mensagem é textual, sem depender apenas de cor.
- Nas propriedades da etiqueta em revisão, explicar que a correção exige excluí-la e criá-la novamente. A orientação não acrescenta texto ao desenho nem cria outro fluxo de recuperação.

Exemplo de apresentação válida:

```text
Sala de estar
  18,50 m²
```

O alinhamento efetivo deve ser centralizado pelo renderizador; os espaços do exemplo são apenas ilustrativos.

### Fechamento

- Oferecer uma ferramenta própria para desenhar a linha que complementa um contorno aberto, como a borda aberta de uma varanda, ou delimita uma região somente com linhas.
- A linha funciona como limite para reconhecimento e cálculo da área, combinada com as paredes e demais linhas de fechamento do mesmo pavimento ou apenas com outras linhas. Sua inclusão só habilita a etiqueta quando o conjunto realmente formar uma região fechada.
- A linha é um limite geométrico sem espessura construtiva. Não cria parede, tijolos, vãos ou quantitativos e não interfere na composição de fiadas.
- Permitir selecionar, ajustar e excluir a linha no editor. Criar, editar ou remover esse limite deve atualizar as etiquetas afetadas, inclusive sua condição de fechamento.
- Criar cada segmento com dois cliques, início e fim, com prévia entre eles e cancelamento por Escape. Aceitar qualquer direção, com atração para faces/extremidades de paredes e outras linhas de fechamento; Alt suspende a atração, seguindo o padrão de Medida.
- Destacar visualmente o ponto de conexão e mostrar na prévia a posição efetiva que será confirmada pelo clique, para tornar a atração compreensível.
- A atração apenas posiciona os segmentos e não cria vínculo permanente com paredes ou outras linhas. Mover ou redimensionar uma parede não desloca automaticamente as linhas; se isso abrir o contorno, a etiqueta entra em revisão. Explicitar esse comportamento na orientação de uso, sem acrescentar vínculos automáticos.
- Permitir ajustar as extremidades ou mover o corpo inteiro da linha. Usar traço interrompido, distinguível de parede, para localizar e editar o limite acrescentado.
- Exigir contato geométrico efetivo para fechar o contorno. A atração auxilia a conexão, mas uma lacuna, mesmo pequena ou imperceptível no zoom atual, continua aberta.
- Cruzamentos e encontros em T conectam as linhas geometricamente, sem exigir divisão manual dos segmentos. Uma linha que chega à face ou entra na faixa ocupada pela parede estabelece conexão com ela. Recusar segmentos de comprimento zero.
- Trechos coincidentes representam um único limite para o cálculo, sem mesclar, excluir ou modificar automaticamente os objetos desenhados. Não gerar regiões artificiais por duplicação de limites ou erro numérico; regiões pequenas realmente presentes na geometria continuam válidas, sem tolerância arbitrária para eliminá-las.
- Preservar no cálculo as conexões entre linhas diagonais, inclusive quando a interseção ocorrer entre unidades da precisão de entrada. Não arredondar interseções de forma que abra lacunas ou mude o fechamento; isso não acrescenta controle de precisão à interface.

### Integração e preservação

- Disponibilizar as duas ferramentas e suas entidades somente em Planta, sem renderização ou edição em Fiada. Entregar no aplicativo existente, respeitando pavimento ativo, seleção, cancelamento de gestos, bloqueios de edição e padrões de acessibilidade. Ferramentas e controles seguem o catálogo central de [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md#iconografia).
- Posicionar os botões Etiqueta e Fechamento próximos de Medida, com textos e dicas conforme a tabela, ícones distintos e identificação acessível, seguindo o padrão da barra existente e preservando legibilidade e espaço útil do desenho. Não redesenhar a barra inteira nem criar painel novo. Conferir de forma direcionada o espaço dos novos controles.
- Após criar uma etiqueta ou concluir um segmento, manter a ferramenta ativa para novas criações. Escape cancela primeiro o segmento em andamento, quando houver; sem gesto em andamento, sai da ferramenta para seleção.
- Priorizar a interação com entidades existentes sobre a criação: clicar no texto seleciona a etiqueta e arrastá-la move somente sua posição gráfica, respeitando o limiar de arraste existente. Alças e corpo de linha selecionada têm prioridade sobre iniciar outro segmento. A criação de etiqueta ocorre por clique livre no interior da região, sem confundir seleção ou arraste com nova criação.
- Integrar criação, renomeação, deslocamento, ajuste e exclusão ao histórico e ao salvamento existentes. Desfazer/refazer deve restaurar o estado da etiqueta registrado na operação correspondente, inclusive referência válida ou revisão necessária. Restaurar pelo histórico um estado anterior válido não é recuperação automática por nova edição da geometria.
- A área é derivada, mas o estado de revisão obrigatória é persistente. A alteração geométrica e a entrada das etiquetas afetadas em revisão pertencem à mesma operação de histórico e salvamento, sem segunda gravação posterior para registrar a revisão. Reabrir não pode inferir recuperação apenas porque a geometria voltou a fechar.
- Preservar nomes, posições, linhas e referência do ambiente ao salvar/reabrir e exportar/importar o projeto. A área e sua validade devem corresponder à geometria atual, sem depender de um número antigo persistido.
- Integrar as entidades às operações de duplicação e remoção de pavimento, preservando independência entre origem e cópia e sem referências cruzadas entre pavimentos.
- Alterações apenas em etiquetas ou linhas de fechamento não devem disparar composição construtiva. Alterações em paredes continuam seguindo o fluxo construtivo existente e também atualizam as áreas afetadas.
- Manter o reconhecimento de regiões e o cálculo de áreas separados da composição de tijolos. Atualizar sobre alterações confirmadas, sem recomputar toda a geometria a cada movimento do mouse; prévias de interação continuam transitórias.
- Não introduzir avaliação estrutural, regras de acabamento, dedução de revestimentos, quantitativos de ambientes, geração automática de etiquetas para toda a planta, diagnóstico automático para localizar todas as falhas de fechamento ou outras ferramentas além das duas solicitadas.

### Referências e contratos a atualizar na implementação

- [PRD](../Ecovit-PRD.md): registrar o comportamento das duas ferramentas, mantendo os requisitos e aceites existentes.
- [Caderno técnico](../Ecovit-Caderno-Tecnico.md): documentar a convenção geométrica de área pelas faces internas, as exclusões de paredes internas e recintos, a continuidade através de portas/janelas/aberturas livres e o papel das linhas de fechamento, sem atribuir significado estrutural à medição.
- [Modelo e geometria](../arquitetura/Modelo-e-Geometria.md) e [Elementos construtivos](../arquitetura/Elementos-Construtivos.md): respeitar precisão, identidades, geometria de paredes e propriedade por pavimento.
- [Medidas e imagens](../arquitetura/Medidas-e-Imagens.md) e [Editor e interação](../arquitetura/Editor-e-Interacao.md): registrar as novas entidades e os gestos, distinguindo a posição da etiqueta de sua referência geométrica. A medida linear existente permanece independente.
- [Estado, histórico e operações](../arquitetura/Estado-Historico-e-Operacoes.md) e [Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md): registrar intenção persistente, atualização derivada, histórico, validação e evolução compatível dos documentos.

Atualizar os contratos pertinentes junto da implementação autorizada.

### Divisão, união e perda de referência

Guardar como referência um ponto interno no local do clique inicial, independente da posição gráfica da etiqueta. Alterações de dimensões atualizam a área enquanto o ambiente continuar identificável e a referência permanecer em seu interior.

O ponto de referência permanece fixo: reduzir o ambiente pode deixá-lo fora, mesmo que o usuário considere que continua sendo o mesmo ambiente. Esse caso exige revisão e recriação da etiqueta, conforme a simplificação acordada; não reposicionar automaticamente a referência.

Dividir um ambiente ou unir ambientes coloca as etiquetas afetadas em **Revisar ambiente**, sem escolher automaticamente uma parte, unir etiquetas ou escolher uma sobrevivente. A comparação entre a região anterior e a nova deve reconhecer essas mudanças; somente verificar se o ponto ainda pertence a uma região fechada não basta. Perda do fechamento, referência fora do ambiente ou coberta por parede também exigem revisão.

Exemplos que distinguem alteração dimensional de divisão ou união, aplicáveis a paredes e linhas conforme o limite envolvido:

- Deslocar uma divisória mantendo dois ambientes fechados atualiza as duas áreas, desde que suas referências continuem internas. A simples sobreposição entre contornos antigos e novos não caracteriza união ou divisão.
- Remover a divisória e formar uma única região coloca as etiquetas dos ambientes unidos em revisão.
- Acrescentar uma divisória completa coloca a etiqueta do ambiente dividido em revisão, sem escolher uma das partes pelo ponto de referência.
- Acrescentar uma parede isolada que não divide a região apenas desconta sua ocupação e atualiza a área, desde que não cubra o ponto de referência.

Depois de entrar em revisão, a etiqueta permanece assim mesmo após novas edições que restabeleçam o fechamento; a exceção é a restauração de um estado anterior pelo histórico. Não excluir etiquetas automaticamente. O usuário realiza as correções geométricas necessárias, exclui a etiqueta em revisão e cria outra no ambiente desejado, sem reassociação ou fluxo de recuperação.

As definições acordadas, incluindo os refinamentos da revisão e os fechamentos somente por linhas, estão incorporadas às seções e aos critérios desta task. A aprovação da especificação e a autorização de implementação não constituem aceite manual da funcionalidade.

## Critérios de aceite

- [x] **A01** — Com a ferramenta Etiqueta ativa, um clique no interior de um ambiente fechado cria a etiqueta com nome automático, sem contorno manual ou diálogo obrigatório de nome; a etiqueta fica selecionada e suas propriedades são mostradas, sem foco automático no campo de nome. Um clique em região sem fechamento é recusado com orientação legível para conferir paredes e linhas, sem criação parcial.
- [x] **A02** — A área corresponde ao contorno pelas faces internas. Um ambiente com dimensões internas de 3 m × 4 m mede 12 m², independentemente da espessura das paredes externas; contornos não retangulares são medidos por sua geometria real, sem aproximação pela caixa envolvente. Paredes isoladas internas têm sua ocupação descontada; um recinto interno fechado não integra a área externa e pode receber sua própria etiqueta. A separação de regiões internas também se aplica a limites somente por linhas ou mistos: em dois retângulos de linhas aninhados, medir a região entre eles exclui a interna, que admite etiqueta própria. Terreno, mobiliários, imagens e contornos de lajes não fecham ambientes.
- [x] **A03** — Inserir, alterar ou remover portas, janelas e aberturas livres de uma parede que mantém seu traçado não rompe o reconhecimento do ambiente nem une as áreas através desses elementos. Trocar o tipo de vão conserva a separação das áreas.
- [x] **A04** — A etiqueta nasce centrada no clique e apresenta nome acima da área, centralizados entre si, com área formatada como `12,00 m²`. Texto permanece horizontal e com tamanho de tela constante ao variar o zoom; nomes longos quebram dentro de largura visual limitada, sem truncamento. Renomear nas propriedades aceita de 1 a 100 caracteres após aparar espaços e modifica somente o nome; deslocar a etiqueta, inclusive para fora do ambiente ou sobre outro ambiente, conserva sua referência e o valor da área original. Somente o texto da área é arredondado.
- [x] **A05** — Alterações confirmadas das dimensões atualizam a área sem reposicionar ou renomear a etiqueta enquanto o ambiente continuar identificável e o ponto de referência inicial permanecer interno. Dividir ou unir ambientes coloca as etiquetas afetadas em revisão, mesmo que o ponto continue em região fechada. Perda do fechamento, ponto fora do ambiente ou coberto por parede também fazem a etiqueta exibir apenas **Revisar ambiente**, sem nome ou área no desenho; o nome original permanece nos dados e nas propriedades, junto da orientação de excluir e recriar a etiqueta. Novas edições não recuperam a etiqueta; a correção exige exclusão e recriação, sem reassociação, deslocamento automático da referência ou exclusão automática.
- [x] **A06** — Uma varanda aberta não aceita etiqueta inicialmente; acrescentar a linha que completa seu contorno permite criar a etiqueta e medir a região delimitada pelas faces internas das paredes e pela linha. Um contorno fechado formado somente por linhas também aceita etiqueta e mede sua área, sem exigir parede; um retângulo de linhas de 3 m × 4 m mede 12 m².
- [x] **A07** — Linhas são criadas em qualquer direção por dois cliques, com prévia e cancelamento por Escape, atração para paredes e outras linhas de fechamento e suspensão por Alt. Aparecem com traço interrompido e permitem seleção, ajuste das extremidades, translação do corpo e exclusão. Alterar a região atualiza a área enquanto a referência permanecer válida; remover um trecho necessário ao fechamento faz a etiqueta exibir apenas **Revisar ambiente**. Linhas que deixam lacunas não são tratadas como contorno fechado por proximidade visual ou zoom.
- [x] **A08** — Etiquetas e linhas não criam peças nem alteram quantitativos ou composição de fiadas. Operações exclusivas dessas entidades preservam o resultado construtivo existente. Reconhecimento e cálculo de áreas são separados da composição de tijolos e ocorrem sobre alterações confirmadas, sem recomputar toda a geometria a cada movimento do mouse.
- [x] **A09** — Desfazer/refazer restaura nomes, posições, linhas e o estado de referência válido ou de revisão registrado na operação correspondente, seguindo o fluxo único de histórico e salvamento e os bloqueios existentes. Desfazer a operação que perdeu a referência restaura a etiqueta válida; refazê-la restaura a revisão necessária. A alteração geométrica e a entrada em revisão são registradas na mesma operação de histórico e salvamento, sem segunda gravação posterior; o estado de revisão é persistente, enquanto a área é derivada.
- [x] **A10** — Salvar/reabrir e exportar/importar preservam as entidades e sua associação geométrica, inclusive etiquetas fora do ambiente e etiquetas em revisão. Uma etiqueta em revisão continua exibindo apenas **Revisar ambiente** após reabertura, mesmo que o fechamento tenha sido restabelecido por edição posterior. Documentos anteriores continuam aceitos conforme a evolução de compatibilidade acordada; dados inválidos são recusados sem substituir parcialmente o projeto aberto.
- [x] **A11** — Ambientes de pavimentos distintos não se misturam. Duplicar pavimento copia as entidades e remapeia suas relações com independência; remover e desfazer a remoção do pavimento mantém a integridade correspondente.
- [x] **A12** — Na implementação, os contratos foram atualizados em seus documentos responsáveis de acordo com esta especificação, preservando IDs e aceites anteriores.
- [x] **A13** — A numeração automática é independente por pavimento, não reutiliza números após exclusão e não renumera etiquetas existentes; renomear não altera a sequência. A cópia de pavimento preserva os nomes e continua sua própria sequência. Clicar em ambiente com etiqueta válida seleciona a etiqueta existente, mesmo fora dele, sem duplicá-la. Uma etiqueta em revisão não reserva região nem impede criar nova etiqueta válida; seu texto permite selecioná-la para exclusão.
- [x] **A14** — As duas ferramentas e suas entidades ficam disponíveis somente em Planta, sem renderização ou edição em Fiada, respeitando os padrões de seleção, acessibilidade e bloqueios do editor.
- [x] **A15** — Cruzamentos e encontros em T entre linhas estabelecem conexão sem divisão manual. Alcançar a face ou entrar na faixa ocupada pela parede conecta a linha à parede. Segmentos de comprimento zero são recusados. Trechos coincidentes contam como um único limite, sem alterar automaticamente os objetos; não surgem regiões artificiais por limites duplicados ou erro numérico, mas regiões pequenas reais continuam válidas. Interseções diagonais entre unidades da precisão de entrada preservam as conexões, sem lacunas por arredondamento; lacunas reais continuam abertas.
- [x] **A16** — A atração destaca o ponto de conexão e a prévia mostra a posição efetiva confirmada pelo clique. Selecionar uma etiqueta válida realça discretamente a região medida, mesmo com o texto fora dela; desfazer a seleção remove o realce transitório.
- [x] **A17** — Os botões exibem exatamente **Etiqueta** e **Fechamento**, com as dicas **Etiqueta com área** e **Fechamento de ambiente**, respectivamente. Ficam próximos de Medida, com ícones distintos e identificação acessível, sem sobreposição ou perda de legibilidade na barra existente. Após criar uma etiqueta ou um segmento, a ferramenta permanece ativa; Escape cancela primeiro o segmento em andamento e, sem gesto, retorna à seleção. A criação repetida não depende de foco automático no campo de nome. Clicar no texto seleciona a etiqueta e arrastá-la move seu texto, com o limiar de arraste existente; alças e corpo de linha selecionada têm prioridade sobre novo segmento. Interagir com entidade existente não cria etiqueta ou segmento adicional.
- [x] **A18** — A atração não cria vínculo permanente: mover ou redimensionar uma parede não desloca automaticamente as linhas de fechamento. Se a operação abrir o contorno, a etiqueta entra em revisão. A orientação de uso explica esse comportamento.
- [x] **A19** — Deslocar uma divisória mantendo dois ambientes fechados e suas referências internas atualiza ambas as áreas; sobreposição entre contornos antigos e novos, por si só, não exige revisão. Remover a divisória e unir as regiões coloca as etiquetas afetadas em revisão; acrescentar divisória completa exige revisão da etiqueta do ambiente dividido. Acrescentar parede isolada sem dividir a região nem cobrir sua referência apenas desconta sua ocupação e atualiza a área. Reduzir um ambiente de modo que a referência fixa fique fora dele exige revisão, sem reposicionar a referência automaticamente.

Selecionar as verificações pela [política de qualidade](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração), considerando o impacto concreto em geometria, interação, histórico e persistência, sem impor homologação completa nesta task.

## Resultado

Implementado no editor existente, com as duas ferramentas e os nomes/dicas acordados. Nenhuma biblioteca ou serviço acrescentado. Aceite manual permanece pendente.

- **A01/A04/A13** — Criação por clique, nome automático por pavimento, seleção sem duplicação, renomeação e posição gráfica independente da referência verificados por domínio e Chrome. Texto centralizado, quebra de nome longo, tamanho de tela constante e propriedades conferidos por inspeção do renderizador e captura em 1280×720. Contador e cópia independente de pavimento cobertos pelo domínio.
- **A02/A03/A06/A15** — Testes geométricos aprovados: retângulo interno de 3×4 m = 12 m², concavidade, paredes isoladas, regiões aninhadas, fechamento misto e somente por linhas, continuidade de portas/janelas/aberturas livres, T/cruzamentos, coincidências, lacuna de uma unidade, regiões pequenas, interseções fracionárias e coordenadas próximas ao limite. Predicados e conectividade usam frações exatas; a atração diagonal só destaca pontos de entrada realmente pertencentes ao segmento.
- **A05/A09/A18/A19** — Revisão persistente e correção por exclusão/recriação verificadas. Testes distinguem mover divisória mantendo ambientes, dividir, unir, criar recinto aninhado, acrescentar parede isolada e deixar a referência fora da região. Parede movida não desloca linhas. Histórico restaura revisão/geometria; o estado de revisão é enviado no mesmo salvamento. Chrome cobriu perda de fechamento, desfazer/refazer, recriação com próximo número e arraste do corpo/ponta de linha.
- **A07/A16/A17** — Dois cliques, cancelamento por Escape, prioridades de texto/alças/corpo, prévia, atração e Alt conferidos por testes direcionados e inspeção. A interação foi ajustada para cancelar o segmento antes dos manipuladores genéricos de Escape existentes. Segmento novo não recebe seleção automática, permitindo iniciar o próximo na extremidade anterior. Ícones/dicas, realce da região, orientação de revisão e ausência de sobreposição/rolagem horizontal conferidos no Chrome. Em tela compacta, o seletor de elementos limita sua largura a 160 px para não deixar Refazer isolado em outra linha.
- **A08/A10/A11/A14** — Operações exclusivas preservam a composição, sem chamar o motor. Transporte e reabertura remota preservam nome/posição/referência/revisão; duplicação e remoção de pavimento mantêm integridade. Leitor normaliza envelopes 9–18 para 19, sem alterar a origem; dados inválidos e etiquetas válidas sem região exclusiva são recusados. Chrome verificou salvar/reabrir, exportar, somente leitura e ausência dos controles/instruções em Fiada; o renderizador não monta as entidades nesse modo.
- **A12** — Contratos atualizados em RF-21, CT-18, Modelo e geometria, Medidas e imagens, Editor e interação, Estado/histórico, Interface/iconografia e Persistência. Envelope 19 contém as duas coleções e contador opcional por pavimento; área/faces permanecem derivadas. Representação remota e SQL mantêm suas versões independentes, sem migração de banco nesta alteração.

**Validação proporcional** — A nova geometria e a intenção persistente justificam testes de domínio/estado/transporte e fluxos direcionados no Chrome. Foram conferidos 192 testes distintos em 13 arquivos Vitest, aproveitando os resultados dos recortes preservados após as correções; repetições não representam cobertura adicional. Execução inicial do recorte: 28,60 s; revalidação dos quatro arquivos com expectativas de compatibilidade ajustadas: 73 testes aprovados em 1,74 s; após ampliar os casos geométricos, os 14 testes de ambientes passaram em 686 ms. Inclui observação de 100 regiões/400 segmentos sem rasterização da planta. Build com typecheck e lint aprovados; formatação e diff conferidos. O build emite os avisos de anotação de dependência e tamanho do bundle, sem erro.

Quatro cenários distintos da T-018 passaram no Chrome: revisão/histórico/recriação (23,3 s), criação/transporte/reabertura (14,3 s), edição de corpo/ponta (4,4 s) e interface compacta/cancelamento/bloqueios/Fiada (10,9 s). As últimas execuções filtradas de fluxo e interface duraram 26,1 s e 16,1 s, incluindo o runner. Capturas inspecionadas em `.tools/t018-planta-1280.png` e `.tools/t018-revisao.png`. A suíte completa do aplicativo e a matriz Chrome/Edge não foram executadas.

**Falhas e correções** — A primeira preparação no sandbox não reconheceu o processo PostgreSQL já existente. A identidade do cluster de teste foi confirmada pela conexão e pelo diretório, e a única repetição fora do sandbox passou. A primeira navegação do Chrome excedeu o prazo carregando módulos; a execução seguinte, com dependências já preparadas, completou a navegação sem alterar timeouts. As demais falhas foram corrigidas: prioridade do Escape e expectativas dos testes sobre envelope vigente, novas coleções vazias e reabertura pelo cartão da lista. Nenhuma asserção foi enfraquecida e nenhum limite de tempo foi ampliado.

**Logs locais ignorados pelo Git** — `.tools/t018-validation-summary.log`, `t018-contracts.log`, `t018-contracts-final.log`, `t018-rooms-final.log`, `t018-build-final.log`, `t018-lint-final.log`, `t018-lint-last.log`, `t018-format-check.log`, `t018-e2e.log`, `t018-e2e-correction.log`, `t018-e2e-final.log` e `t018-interface-final.log` (todos sob `.tools/`). Execuções de navegador usaram servidor próprio na 5174, banco e contas isolados; a porta 5173 não foi iniciada, encerrada ou reiniciada.

**Aceite do solicitante** — Pendente. Os critérios acima foram verificados tecnicamente; confirmação manual depende de manifestação explícita do solicitante. Sem publicação nesta entrega.

## Verificação de integração — 2026-11-15

Após merge e push autorizados para publicação, a [CI da revisão 90d115b](https://github.com/marcusrox/ecovit/actions/runs/43788379920) encontrou uma expectativa legada em `tests/unequal-heights.test.ts` (EX-78/79): o objeto esperado não incluía as coleções vazias `roomLabels` e `roomBoundaries`, acrescentadas pela normalização do envelope 19. O deploy foi bloqueado antes de publicar essa revisão. Atualizada somente a expectativa de normalização, preservando a comparação integral do modelo e as demais asserções de geometria, fiadas, ida/volta e recusa de arquivo adulterado; nenhuma mudança no aplicativo ou enfraquecimento de teste.

Revalidação local direcionada: 11 testes aprovados no arquivo em 2,44 s, código de saída 0, com log em `.tools/t018-publish-legacy-test.log`. O novo push será submetido novamente ao workflow completo de CI e deploy. Este registro complementa as evidências anteriores e não altera o aceite manual da task.

## Confirmação de aceite — 2026-11-16

Aceite manual confirmado explicitamente pelo solicitante ao pedir o registro dos dois aceites pendentes, T-018 e T-020. Esta confirmação encerra a pendência manual desta task, preservando as evidências técnicas e os registros históricos anteriores, sem representar nova execução de testes.
