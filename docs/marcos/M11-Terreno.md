# M11 — Terreno

[Índice dos marcos](../Ecovit-Plano-Implementacao.md) · [PRD](../Ecovit-PRD.md#rf-18--terreno) · [Arquitetura](../Ecovit-Arquitetura-Tecnica.md)

**Estado: implementado, verificado pelo Codex e aceito pelo solicitante.** Produto: RF-18; integração com RF-02/08/09/11/12/16. Este marco registra a entrega solicitada, suas tarefas e critérios de aceite. Comportamento previsto no PRD; contratos técnicos em [Editor e interação](../arquitetura/Editor-e-Interacao.md#terreno--m11).

## Alcance

Desenhar um perímetro por cliques em pontos livres, incluindo diagonais, com comprimento do segmento corrente atualizado enquanto o cursor se move. Clicar no primeiro ponto fecha o perímetro e cria o terreno. Escolher grama, terra, areia, brita ou piso intertravado e preencher a região com textura de escala consistente com o desenho, sem esticar uma imagem para ocupar o polígono. Terreno abaixo da imagem de referência de M8. Propriedades com ação Ajustar para mover o conjunto ou reposicionar seus vértices.

**Organização aprovada:** um terreno por projeto, compartilhado na Planta dos pavimentos, com um único material em toda a região e grama como aparência inicial. O solicitante autorizou a implementação, incluiu brita e piso intertravado no catálogo obrigatório e acrescentou o rótulo de área em m², também disponível nas propriedades. Não ampliar o recorte para múltiplas regiões ou paisagismo detalhado implicitamente.

## Tarefas concluídas

- [x] **M11-T01 — Contratos:** definir os dados do terreno, materiais/revisões, precisão, limites de vértices e validação do perímetro nos assuntos responsáveis da arquitetura. Atualizar modelo, estado e persistência documental junto da implementação, preservando os leitores de arquivos já suportados.
- [x] **M11-T02 — Desenho:** ferramenta no aplicativo, pontos livres, prévia do segmento com medida, indicação de fechamento, validação e cancelamento sem resíduos. Seguir [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md#iconografia).
- [x] **M11-T03 — Aparência:** preparar os cinco materiais, registrar origem/licença ou procedência das artes e escala visual; preencher com repetição contínua ou composição equivalente sem emendas visíveis, recortada no perímetro. Conferir naturalidade e densidade em terrenos de tamanhos diferentes, nos níveis de zoom usuais.
- [x] **M11-T04 — Ajuste:** propriedades, seleção acessível mesmo sob a referência, modo Ajustar, translação e movimento de vértices com prévia, medidas e proteção contra perímetro inválido; exclusão e histórico.
- [x] **M11-T05 — Integração:** camadas, pavimentos, enquadramento, salvamento local, cópia de projeto, arquivo nativo, compatibilidade e somente leitura. Operações exclusivas de terreno não recalculam a composição construtiva.
- [x] **M11-T06 — Validação e entrega:** executar verificações pertinentes, corrigir falhas, revisar visualmente o aplicativo e consolidar alcance efetivo, evidências, limitações e roteiro manual neste marco e situação no índice.

## Critérios de aceite

| ID | Resultado verificável |
|---|---|
| M11-A01 | Em Planta, cliques sucessivos fixam vértices livres, sem ortogonalidade ou modulação obrigatória. Antes do próximo clique, a prévia mostra o segmento do último ponto ao cursor e seu comprimento euclidiano em cm, atualizado sem alterar o documento. |
| M11-A02 | Com pelo menos três vértices distintos e área não nula, clicar no primeiro ponto, identificado visualmente como alvo de fechamento, cria um único terreno fechado e selecionado. A medida da prévia corresponde também ao segmento de fechamento. Nenhum terreno é salvo antes do fechamento válido. |
| M11-A03 | Aceita polígonos convexos e côncavos simples. Segmentos nulos, cruzamentos, sobreposições de arestas e contato de arestas não adjacentes não produzem terreno inválido. Uma tentativa inválida recebe explicação e permite corrigir ou cancelar, sem alterar o modelo confirmado. |
| M11-A04 | Grama, terra, areia, brita e piso intertravado têm prévias identificadas e aparência correspondente no terreno. Alterar material mantém o perímetro e permite desfazer/refazer. A textura não ultrapassa o contorno. |
| M11-A05 | Em regiões de 5 × 5 m e 50 × 50 m, o detalhe de um mesmo material mantém a mesma escala no mundo: a região maior recebe mais cobertura de textura, sem ampliar o mesmo fragmento para preencher toda a área. Zoom preserva essa relação; não há costuras, faixas ou repetição grosseira perceptível nos enquadramentos usuais da revisão visual. |
| M11-A06 | Ordem visual: fundo do canvas → terreno → imagem de referência → malha e elementos existentes, conservando a ordem relativa destes últimos. A opacidade da referência revela o terreno sob ela; uma referência opaca pode ocultá-lo. Alças e prévias de ajuste permanecem visíveis na camada de interação. |
| M11-A07 | É possível acessar as propriedades do terreno mesmo quando a referência ou a edificação o cobre. Selecionar não move a geometria. Ajustar habilita arraste do conjunto e alças dos vértices; fora desse modo não ocorre deslocamento acidental. Elementos sobrepostos mantêm seleção e edição acessíveis. |
| M11-A08 | Em Ajustar, mover o conjunto preserva forma, comprimentos e escala do material; arrastar um vértice atualiza apenas esse vértice e as arestas adjacentes, mostrando suas medidas na prévia. A textura acompanha a translação sem mudar de escala e não estica ao editar o perímetro. Geometria inválida não é confirmada. |
| M11-A09 | Fechar o desenho, trocar material, excluir ou concluir cada arraste válido produz uma operação de histórico; desfazer/refazer restaura identidade, pontos e aparência. Escape/perda de foco/troca de contexto cancelam a prévia em curso, preservando o último estado confirmado e permitindo continuar usando o editor. Navegação e zoom não alteram o terreno. |
| M11-A10 | Trocar/duplicar/remover pavimentos mantém o mesmo terreno, sem criar cópias por pavimento. Copiar projeto produz edição independente. Planta mostra o terreno, Fiada não o mostra e a comparação de pavimentos não o duplica. Enquadrar considera seu perímetro, inclusive em projeto sem paredes. |
| M11-A11 | Salvamento, recarga, reabertura e transporte `.ecovit` preservam perímetro e material. Arquivos anteriormente suportados abrem sem terreno; arquivo com terreno inválido é recusado antes de substituir o aberto. Recursos/revisões de textura são validados, sem troca silenciosa de material. Persistir intenção e referências de material, sem imagem rasterizada do terreno inteiro, prévias ou estado de cursor. |
| M11-A12 | Criar, ajustar, trocar aparência, excluir e desfazer/refazer terreno não mudam composição, diagnósticos ou quantitativos construtivos e não chamam o motor. Somente leitura bloqueia alterações. Falha de armazenamento conserva o projeto em memória e permite download; bloqueio entre abas e limite total do arquivo permanecem respeitados. |
| M11-A13 | Chrome/Edge e resoluções previstas no padrão de interface mantêm controles e medidas legíveis, sem rolagem horizontal dos painéis. Renderização de terreno grande se limita à região visível e não exige imagem ou conjunto de nós proporcional à área total. Registrar observação real de fluidez/memória e limites na entrega, sem prometer desempenho ilimitado. |
| M11-A14 | O rótulo “Terreno · <área> m²” e as propriedades mostram a área plana do polígono, com duas casas decimais em português, nos dois sentidos de desenho. A âncora fica no interior inclusive em terreno côncavo; o texto mantém tamanho legível no zoom. Prévias válidas de ajuste atualizam a área, sem persistir rótulo ou área redundantes. Fiada não mostra o rótulo. |

## Cobertura de referência

- Domínio: perímetros convexos/côncavos, diagonais, coordenadas negativas, segmentos nulos, interseções/contatos, fechamento e edição inválida; translação e histórico.
- Persistência: leitura dos formatos suportados sem terreno, ida e volta com terreno, integridade, cópia de projeto e limites, preservando o projeto aberto em falha.
- Navegador isolado na porta 5174: desenho com medida dinâmica, fechamento/cancelamento, propriedades, ajuste, materiais, camadas com referência opaca/translúcida, sobreposições, histórico, pavimentos, transporte e somente leitura. Não iniciar nem reiniciar a porta 5173.
- Revisão visual em 1366×768, 1280×720 e 900×680: escala e naturalidade dos materiais em dois tamanhos de terreno, zoom, bordas côncavas, legibilidade da malha/elementos e acesso às propriedades.
- Tipos, lint, testes pertinentes e build conforme evidências consolidadas abaixo.

## Limites da entrega

Terreno é uma representação plana em XY. Sem topografia, relevo, declividade, cotas altimétricas, terraplenagem, cálculo estrutural/geotécnico, recuos legais, georreferenciamento ou validação de limites cadastrais. Sem furos, curvas, inclusão/remoção de vértices após criar, múltiplos materiais no mesmo terreno, upload de textura, ordenação manual de camadas ou 3D neste recorte. Para mudar a quantidade de pontos, recriar o perímetro; reposicionar os pontos existentes integra Ajustar. Não deslocar automaticamente paredes, mobiliários ou referência quando o terreno se move. Aparência e escala visual dos materiais não comprovam medidas físicas de componentes reais.

## Situação consolidada e aceite

**Alcance implementado:** um terreno por projeto, visível em Planta em todos os pavimentos; perímetro livre por cliques com medidas dinâmicas e fechamento explícito; grama, terra, areia, brita e piso intertravado com textura em escala consistente; rótulo de área em m² e consulta nas propriedades. Ajustar permite transladar o conjunto e reposicionar vértices, com prévia e proteção contra contorno inválido. Integra seleção, histórico, cópias, salvamento e transporte, sem recálculo construtivo. Preenchimento abaixo da referência M8 e controles na camada de interação. Aplicativo 0.16.0, envelope 17, leitura de 9–16 sem terreno e composição nominal-v10 preservada.

**Verificações do Codex na entrega:** tipos, lint e build aprovados; suíte completa de domínio/persistência com 375 testes em 29 arquivos aprovada. Foram aprovados 48 cenários distintos selecionados em Chrome/Edge: 12 de Terreno e 36 regressões de medidas, referência M8, mobiliários, lajes/seleção e câmera. Servidor próprio na porta 5174, com sessões isoladas. Revisão visual das cinco aparências, contorno côncavo com diagonal, rótulo e enquadramento nas resoluções 1366×768, 1280×720 e 900×680. CanvasPattern e amostragem de pixels verificaram escala constante, recorte côncavo e referência opaca/translúcida sobre a textura. Fontes: [domínio/persistência](../../tests/terrain.test.ts), [câmera](../../tests/project-view.test.ts) e [fluxos M11](../../tests/e2e/terrain.spec.ts). Este registro de aceite não representa nova execução desses testes.

**Limitações preservadas:** até 256 vértices e demais limites da seção anterior. Texturas procedurais ilustrativas com tile finito podem revelar repetição em grandes extensões ou perder detalhe em aproximação extrema. Área plana em XY, exibida com duas casas decimais, sem garantia de precisão cadastral. Não houve medição formal de heap/latência, execução da suíte histórica completa de navegador ou auditoria com leitor de tela. Permanecem os avisos conhecidos de build sobre anotações do Zod e bundle acima de 500 kB. Aplicativos que só aceitam envelopes até 16 podem recusar arquivos gravados em 17.

**Teste manual e aceite funcional do solicitante:** recebidos expressamente nesta conversa. O solicitante informou que testou o terreno e aprovou a entrega, autorizando o registro do aceite do M11. O aceite global abrange o alcance consolidado acima e encerra a pendência de teste manual e aprovação funcional do marco. Não atribui execução ou resultado individual a cada critério M11-A01–A14 nem auditoria de cada detalhe; as evidências do Codex e as limitações permanecem separadas e preservadas. Não autoriza ampliar o escopo ou iniciar outro marco.
