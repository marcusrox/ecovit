# Ecovit — Requisitos do produto

O Ecovit é um editor web 2D em português brasileiro para arquitetos e autoconstrutores que projetam com tijolos ecológicos de solo-cimento. A Planta representa a intenção do usuário. A Fiada mostra a distribuição nominal das peças, os encontros, os vãos e os ajustes de canaletas e grautes. Os quantitativos representam as peças calculadas.

A aplicação pública usa conta por código de e-mail e projetos privados com salvamento remoto. O arquivo .ecovit permite baixar uma cópia e importar um projeto. A [arquitetura](Ecovit-Arquitetura-Tecnica.md) define os contratos de software, o [Caderno técnico](Ecovit-Caderno-Tecnico.md) define as convenções nominais e as [tasks](tasks/README.md) registram alterações, verificações e aceites.

## Escopo

- Editor para computador com mouse e teclado. Paredes ortogonais, uma família de tijolo-base por projeto e até quatro pavimentos com cotas independentes, inclusive negativas.
- Bases de 25 × 12,5 × 7 cm e 30 × 15 × 7 cm, com opção personalizada de comprimento igual ao dobro da largura e altura configurável.
- Lajes e aberturas ortogonais, comparação visual de pavimentos adjacentes, medidas independentes, imagem de referência, mobiliários e terreno com rosa dos ventos opcional.
- Diagnósticos de composição, quantitativos, histórico de edição, arquivo nativo, duplicação, lixeira e exclusão da própria conta.

A validação é geométrica e nominal. Cargas, resistência, armaduras, apoios, fundações e instalações exigem projeto técnico próprio. O escopo exclui visualização 3D, colaboração, edição offline e importação ou exportação CAD/BIM, PDF, SVG e CSV.

## Jornada principal

1. Entre na conta, crie um projeto e escolha o tijolo-base.
2. Desenhe paredes e vãos em Planta. Adicione pavimentos, lajes e referências conforme o projeto.
3. Inspecione as peças, os encontros e os ajustes em Fiada. Use os diagnósticos para localizar conflitos e revisar a intenção.
4. Consulte os quantitativos. Confira o estado do salvamento remoto e baixe o .ecovit quando precisar de uma cópia portátil.

## Requisitos funcionais

### RF-01 — Catálogo automático a partir do tijolo-base

O usuário escolhe **25 × 12,5 × 7 cm**, **30 × 15 × 7 cm** ou informa comprimento, largura e altura personalizados. Essa definição permite gerar o catálogo padrão suportado: tijolo inteiro, meio tijolo, canaleta, meia canaleta e somente as peças especiais com procedimentos de preparação documentados no caderno técnico.

O meio tijolo tem metade do comprimento-base, mantendo largura e altura. As demais variantes serão derivadas por procedimentos internos de composição e modificação. Peças especiais terão representação da preparação necessária, como corte ou abertura, e identificação nos desenhos e quantitativos.

O módulo mínimo horizontal é sempre o meio tijolo: 12,5 cm e 15 cm nos dois tamanhos iniciais, respectivamente. Não é necessário cadastrar fabricante, peças, furos, encaixes ou conjuntos de regras para habilitar a automação. O Ecovit adota uma geometria padrão derivada das dimensões-base, com hipóteses documentadas.

O catálogo representa essa hipótese geométrica, sem garantir correspondência com qualquer peça comercial. A proporção 2:1 não garante solução para toda composição. Cada procedimento de corte ou abertura terá limites de aplicação documentados. Quando não houver composição suportada, apresentar “Sem solução automática” na região afetada; não inventar uma peça especial para preencher a lacuna. Isso também se aplica às dimensões personalizadas.

Dimensões personalizadas terão comprimento igual ao dobro da largura, garantindo meio tijolo quadrado em planta. A altura é configurável. Medidas devem ser positivas; o formulário valida a proporção 2:1 e mostra como corrigir valores incompatíveis antes de criar o projeto. O tamanho-base é definido no início e aplicado a todos os pavimentos; não há mistura de tamanhos na construção.

**Aceite:** selecionar ou informar um tamanho-base compatível gera o catálogo padrão suportado e o grid sem cadastro adicional. A criação valida comprimento igual ao dobro da largura; todos os pavimentos usam a mesma base. Peças modificadas na obra são identificadas separadamente.

### RF-02 — Editor de planta baixa: modo Planta

O editor tem um único canvas e dois modos principais: **Planta** e **Fiada**. Ambos representam o mesmo projeto; a troca de modo não duplica nem converte dados.

No modo Planta, o usuário cria e altera a arquitetura: paredes, portas, janelas, vãos e lajes, além das medidas independentes de RF-15. Paredes aparecem como faixas contínuas com contorno e espessura, sobre o grid de meio tijolo. A modulação das peças é calculada ao concluir cada desenho construtivo, mas a visualização padrão da Planta não mostra furos nem a divisão de cada tijolo; essa distribuição é inspecionada no modo Fiada. Medidas não participam dessa composição.

Cada parede reta tem identificador próprio e pode ser criada, selecionada, excluída, redimensionada a partir de qualquer uma das duas extremidades e movida com seus dependentes. Criar ou mover uma parede para continuidade colinear pode unir paredes compatíveis, conforme §15. Não haverá ferramenta de dividir paredes. A seleção mostra realce, comprimento modular e propriedades compactas. Movimento e união fazem parte de M3.4, implementado e aceito.

A referência de desenho e encaixe é sempre a **face externa**, com espessura igual à largura do tijolo-base. A prévia mostra a face de referência e o lado ocupado pela espessura, permitindo inverter esse lado antes de confirmar. Em paredes internas, “face externa” identifica a face adotada como referência, sem exigir detecção de recintos. Essa face permanece estável ao editar a parede. Encontros em L alinham as faces externas no canto; o motor resolve a região compartilhada sem duplicar peças. Cotas externas são a referência principal; cotas internas podem ser consultadas sem alterar o encaixe.

**Desenho de paredes:** ativar Parede, pressionar o botão esquerdo no ponto inicial e arrastar. A direção é horizontal ou vertical conforme o deslocamento predominante. Uma prévia mostra a faixa, extremidades, comprimento efetivo e encaixe no grid. Ao soltar, confirmar a parede modular, gerar as peças e atualizar os encontros. Um arraste sem comprimento mínimo de um módulo não cria parede. Escape antes de soltar cancela o gesto sem alterar o projeto.

**Conexões:** a proximidade de outra parede mostra um alvo de conexão. Soltar sobre esse alvo alinha a geometria e gera o encontro. A tolerância visual acompanha o zoom; uma conexão só é confirmada na posição modular indicada. Nos encontros entre paredes distintas, as participantes mantêm seus identificadores e o motor evita duplicar peças compartilhadas. A exceção é a união colinear de §15, que consolida paredes e remapeia referências. Soltar no meio de uma parede pode criar encontro em T.

**Redimensionamento:** selecionar a parede e arrastar qualquer uma das duas extremidades, mantendo a extremidade oposta fixa e a orientação da parede. Mostrar prévia e comprimento durante o gesto; ao soltar, atualizar o trecho e suas dependências. Também permitir informar o comprimento, indicando qual extremidade será alterada. Vãos existentes mantêm sua posição na planta; os que deixarem de caber são sinalizados, sem exclusão ou deslocamento silencioso. Redimensionar uma parede não move automaticamente as demais; encontros são recalculados pela nova geometria.

**Seleção:** com a ferramenta Selecionar ativa, clicar seleciona um elemento e clicar em área vazia limpa a seleção. O realce de passagem do mouse é distinto da seleção. As listas de seleção da Planta mostram somente elementos do pavimento ativo. Controles do elemento têm prioridade sobre o desenho de uma nova parede. Paredes sobrepostas ou próximas permitem escolher o elemento por um seletor contextual compacto.

**Movimento:** em Selecionar, arrastar o corpo de uma parede na Planta desloca essa parede e seus dependentes, com prévia modular antes da soltura. Outras paredes permanecem no lugar; conexões existentes são desfeitas geometricamente e novas conexões são recalculadas. Regras de dependências, conflitos e cancelamento em §15.

**Aceite:** desenhar, selecionar, redimensionar e mover mantém a malha; continuidade compatível gera uma única parede; conexões e movimentos são antecipados visualmente; dependentes preservados conforme §15; a planta fica legível sem detalhes de tijolos; abrir Fiada apresenta a distribuição gerada para a mesma geometria. Verificação específica da evolução em M3.4.

### RF-03 — Modulação obrigatória de meio tijolo

Grid, desenho de paredes, portas, janelas e demais vãos usarão sempre o módulo mínimo de meio tijolo. Posições e comprimentos horizontais serão ajustados a essa malha, com origem comum entre pavimentos.

As extremidades da face externa de referência serão encaixadas na malha. A posição de um vão será medida ao longo dessa face, a partir da extremidade de menor coordenada da parede; a largura será a do vão bruto. Alterar essa extremidade recalculará a distância de referência, preservando a posição do vão na planta.

Durante o arraste, o usuário verá a medida modular que será efetivada. Medidas digitadas incompatíveis mostrarão alternativas antes da confirmação. Ferramentas construtivas não oferecem desenho livre fora da malha; a ferramenta independente Medida segue a exceção definida em RF-15.

Antes de iniciar paredes, portas, janelas ou vãos, destacar o quadrado do módulo correspondente ao ponto inicial que será efetivado, conforme §15. O destaque acompanha o encaixe real e não altera o projeto.

A modulação vertical considerará altura-base, passo de assentamento e fiadas. Alturas de parede, peitoris e vãos serão compatibilizadas com as fiadas, mostrando diferenças para a altura solicitada.

O motor verificará o fechamento das paredes conectadas, usando inteiros, meios, canaletas e especiais derivados. Modificações necessárias na obra serão permitidas e identificadas.

**Aceite:** paredes e vãos horizontais são confirmados apenas na malha de meio tijolo; cotas correspondem ao desenho gerado; recintos fecham sem colisões ou lacunas indevidas.

### RF-04 — Modo Fiada: inspeção e ajustes construtivos

O modo Fiada exibe a distribuição real de peças da fiada selecionada, com contornos individuais, furos, orientação e tipos. Inteiro, meio tijolo, canaleta, meia canaleta e peça especial deverão ser distinguíveis por representação geométrica, símbolos e cores. A legenda será compacta e recolhível.

Um controle mostra **Fiada atual / total**, com anterior, próxima e escolha direta pelo número. Mostrar também o intervalo de altura em relação à referência vertical do pavimento, usando o passo vertical efetivo; em M4, essa referência será sua cota única. Nos extremos, anterior/próxima fica indisponível. Paredes conectadas podem ter alturas diferentes. O cálculo considera somente a alvenaria presente em cada fiada: cada trecho termina na própria altura, sem prolongamento, igualação ou reinício da alternância. Diferença de altura por si só não gera pendência; combinações sem solução nominal verificada continuam diagnosticadas na primeira fiada afetada, suspendendo apenas o conjunto conectado correspondente. CT-14/EX-75–79 definem os casos de referência.

Ao mudar de fiada, manter pavimento, zoom e posição do canvas. Ao trocar de pavimento, recuperar sua última fiada válida. Ao entrar em Fiada pela primeira vez, iniciar na primeira fiada; visitas seguintes recuperarão a última seleção válida. Se a altura mudar e a fiada anterior deixar de existir, selecionar a última válida e informar a mudança.

Em M4, trocar de pavimento mantém zoom e posição do canvas, limpa a seleção e cancela gestos e prévias transitórios, sem confirmar alterações. A última fiada é lembrada por pavimento durante a sessão. A sobreposição de outro pavimento está disponível somente em Planta e não aparece em Fiada; a sobreposição de fiada adjacente do próprio pavimento mantém seu comportamento existente.

Em M4, um pavimento sem paredes pode ser aberto em Fiada com a mensagem “Este pavimento não tem paredes”. Não criar fiada fictícia; navegação de fiadas e ajustes construtivos ficam indisponíveis nesse estado. A sobreposição de outro pavimento é somente referência visual e não recebe cliques de edição.

É possível sobrepor a fiada anterior ou seguinte com transparência, apenas como referência visual. Essa camada não recebe cliques de edição. Vãos deverão aparecer somente onde a faixa vertical da fiada interceptar a abertura. Nas fiadas de canaletas, mostrar os canais, conexões e peças modificadas realmente gerados, incluindo cintas, vergas e contravergas.

O modo Fiada permite ajustar grauteamentos e encontros, e selecionar elementos em canaletas para ajustes previstos no RF-07. Criar ou alterar a geometria arquitetônica de paredes e vãos será feito em Planta; em Fiada, a seleção poderá oferecer ação compacta “Editar na Planta”, preservando a localização.

O clique normal na alvenaria seleciona somente a parede naquele ponto. Em uma célula compartilhada, oferecer a escolha entre as paredes presentes; clicar fora da alvenaria limpa a seleção. O painel **Encontros**, pelo botão **Conjunto**, seleciona o conjunto conectado para inspecionar/alterar sua composição, preservando a restrição de edição à primeira fiada. Selecionar uma parede limpa a seleção e a prévia do conjunto; selecionar um conjunto limpa a parede e sai da ferramenta Graute. Selecionar não altera documento, cálculo ou histórico.

**Grauteamento:** uma ferramenta contextual permite selecionar posições de furos, adicionar ou remover graute por clique no furo nominal correspondente. Cada ajuste afeta todo o trecho vertical do pavimento, desde o início da alvenaria até o topo das paredes associadas, independentemente da fiada usada para iniciar a edição. A prévia mostra o destino, os limites verticais e as interrupções antes de confirmar. Portas, janelas e demais vãos serão respeitados: não haverá graute no espaço vazio de uma abertura. O motor divide o trecho em intervalos de alvenaria aplicáveis e atualiza todas as fiadas correspondentes. Uma retomada acima de um vão é representada como intervalo separado, sem indicar continuidade física através da abertura. No M3, verificar apenas existência de alvenaria e alinhamento dos eixos nominais; não verificar passagem física nem gerar pendência por dimensão interna desconhecida. O ajuste fica restrito ao pavimento de suas paredes, independentemente da existência de laje.

**Encontros:** selecionar o encontro realça sua região e oferece alternativas gráficas. A edição estará disponível somente na primeira fiada, conforme RF-05. Em outra fiada, mostrar “Altere o encontro na primeira fiada” com ação para navegar até ela. A alternativa terá prévia antes de confirmar; a confirmação propagará a amarração até o limite superior da alvenaria e atualizará as peças e elementos relacionados.

O resultado deverá distinguir sugestão automática de ajuste manual por indicador discreto visível ao selecionar o elemento. Não haverá troca de regras, edição de código ou parâmetros técnicos do motor na interface.

**Aceite:** navegar apresenta todas as fiadas reais; canaletas aparecem nas alturas geradas; grautes são distinguíveis de furos vazios; encontro não pode ser editado acima da primeira fiada; mudar o modo preserva o projeto e o enquadramento; referências sobrepostas não são editáveis.

### RF-05 — Encontros automáticos e editáveis

O Ecovit compõe L alternado, T com principal contínua e ramal encostado, e cruz nominal integrada a L/T e contornos conforme CT-12. O T informa necessidade de ligação complementar, que exige dimensionamento próprio.

O Ecovit reconhece encontros em L, T e cruz e define automaticamente uma composição compatível com os padrões suportados, conforme as convenções nominais documentadas no caderno técnico. Considera alternância das peças, fechamento geométrico das paredes, alinhamento dos eixos nominais e representação de canaletas. Peças especiais e sua preparação só serão incorporadas quando houver procedimentos documentados; a composição nominal não comprova amarração resistente ou passagem física.

O usuário pode selecionar cada encontro, visualizar alternativas e alterar sua forma de composição. Não haverá seleção de conjuntos de regras, identificação de regras por encontro ou controle de versões de regras.

O encontro só poderá ser alterado quando a primeira fiada do pavimento estiver selecionada. A composição escolhida será aplicada desde essa fiada a toda a altura correspondente, com alternância e amarração necessárias, até o topo definido pela altura de cada parede. Nas demais fiadas, o encontro poderá ser inspecionado, mas sua edição fica indisponível, com orientação para acessar a primeira fiada. Não haverá alteração parcial iniciada em fiadas intermediárias.

O motor recalculará as paredes participantes e os elementos associados. A composição escolhida será preservada durante regenerações quando continuar aplicável. A propagação fica restrita ao próprio pavimento, independentemente da existência de laje.

**Aceite:** editar só é possível na primeira fiada; a escolha atualiza toda a altura com amarração correspondente, sem sobreposições ou propagação para outros pavimentos; desfazer restaura a escolha anterior.

### RF-06 — Portas, janelas e vãos arrastáveis

Portas, janelas e vãos serão adicionados como elementos arrastáveis com o mouse no canvas. Durante o arraste, o Ecovit mostrará uma prévia vinculada à parede, com posição e largura ajustadas ao módulo permitido de meio tijolo. Ao soltar o mouse, o elemento será inserido com indicador gráfico próprio, permitindo distinguir porta, janela e vão sem depender apenas de cores.

Cada elemento poderá ser selecionado, reposicionado com o mouse e ter sua largura alterada respeitando a malha modular. A representação atualizará a interrupção dos tijolos nas fiadas afetadas, preservando a identificação gráfica do elemento.

As propriedades editáveis incluirão largura, **altura** e **base**. Base é a distância vertical entre a referência do pavimento e o início inferior do elemento. Essa referência é a cota única do pavimento; o contrato implementado de M3 usa o piso, conforme §14. O topo corresponde à base mais a altura. Para portas, a base inicial será zero; para janelas e demais vãos, será configurável.

Ao informar altura ou base, o Ecovit validará sua compatibilidade com os limites das fiadas, considerando o passo vertical efetivo e a referência vertical aplicável ao contrato. Tanto os vãos quanto as fiadas partem da cota única do pavimento. A base e o topo deverão coincidir com limites realizáveis das fiadas. Valores incompatíveis mostrarão alternativas antes da confirmação, sem arredondamento silencioso.

Os campos principais serão largura e altura do vão bruto de alvenaria e sua base. Dimensão da esquadria e folgas de instalação, quando informadas, ficarão em opções adicionais, sem alterar automaticamente o vão bruto. Posicionar automaticamente vergas e contravergas aplicáveis e atualizar os elementos associados quando posição, largura, base ou altura forem alteradas.

As propriedades serão apresentadas de forma compacta e contextual ao selecionar o elemento. Explicações sobre base, altura e modulação estarão disponíveis por ícone informativo, sem ocupar permanentemente o canvas.

**Aceite:** arrastar mostra a prévia modular; soltar insere um indicador gráfico distinto para cada tipo; mover e redimensionar respeita o módulo horizontal; editar base ou altura valida os limites das fiadas e atualiza os tijolos e elementos associados. Um vão que invade células compartilhadas de um encontro apresenta conflito localizado. Quando intercepta um eixo de graute, seus intervalos são recalculados para excluir a abertura, sem gerar conflito apenas por essa interseção. Ajustes que perderem seu alvo geométrico permanecem registrados como pendentes e localizáveis.

#### Tipos e orientação das esquadrias

Escopo aprovado para implementação: portas de giro de uma ou duas folhas iguais, de correr de uma folha ou duas com abertura central, e portão basculante de garagem; janelas de giro de uma ou duas folhas iguais, de correr com duas folhas (uma fixa e uma móvel) e basculantes. Novas portas começam em giro de uma folha; novas janelas em correr de duas folhas. Vão livre mantém seu comportamento. O seletor Tipo da esquadria reúne tipo e quantidade de folhas; não cria ferramentas adicionais.

Um único botão **Alternar orientação** percorre ciclicamente todas as posições de cada tipo. Giro simples: dobradiça no início/fim do vão e abertura para cada face (quatro posições); correr simples/janela de correr: deslocamento nos dois sentidos e folha em cada face (quatro); giro duplo, correr central e basculantes: duas faces (duas). Início/fim são a menor/maior coordenada do eixo da parede, independentes do sentido em que ela foi desenhada. Para parede vertical, a representação horizontal é rotacionada 90° no sentido horário. O painel identifica a posição atual; o botão e a troca de tipo aplicam imediatamente, com salvamento e desfazer/refazer. Trocar tipo reinicia a orientação na primeira posição, sem aplicar campos dimensionais ainda em edição.

Em Planta, folhas/arcos identificam giro, folhas deslocadas/setas identificam correr e painel/projeção tracejada identificam basculantes. Símbolos proporcionais ao vão, independentes dos rótulos e de cor, seguem a proposta visual aprovada. Basculantes representam movimento vertical esquemático: a seta em planta indica o lado da projeção, não deslizamento horizontal. A prévia no painel identifica o tipo. Referência de outro pavimento usa o mesmo desenho sem interação; Fiada conserva apenas a representação do vão nas alturas atingidas, sem folhas, arcos ou setas. Projeções visuais não geram novos alvos de seleção ou atração; selecionar/mover/redimensionar continua pelo vão.

Tipo/orientação não alteram dimensões, composição, diagnósticos ou quantitativos e não disparam recálculo. Preservam resultados atuais ou desatualizados, histórico e cópias. Ao ler projetos anteriores, conservar os símbolos genéricos sem inferir o funcionamento da esquadria; o usuário pode escolher um tipo explicitamente. Tipos e orientação pertencem ao arquivo e ao projeto, não às preferências do navegador. Escopo exclui colisões, animação, dimensionamento de ferragens/folgas, quantitativos de esquadrias, folhas desiguais, pivotantes, embutidas, camarão, sanfonadas, maxim-ar e venezianas. O desenho não constitui comprovação construtiva ou declaração de conformidade normativa.

### RF-07 — Canaletas e grauteamentos nominais configuráveis

O Ecovit gera um desenho nominal automático, configurável e editável. Não verifica passagem física em furos/canais nem dimensiona a solução. O tamanho-base determina a malha e o envelope das peças, não resistência ou armadura.

Configurações do projeto: lista de níveis de canaletas com valores iniciais, adicionar/remover nível e restaurar padrões; quatro opções independentes de graute automático (encontros, laterais dos vãos, pontas livres e intervalos em paredes longas); distância máxima entre grautes, inicialmente 100 cm. Campos de vãos e níveis seguem a referência vertical definida na seção 14. A lista de níveis é uma preferência de desenho, não um conjunto de regras estruturais.

As faixas de canaletas percorrem a parede no nível escolhido, respeitando aberturas. Além delas, gerar automaticamente uma fiada de canaletas imediatamente acima e abaixo de cada vão, independentemente de ser porta, janela ou abertura. Sem canaleta inferior quando o vão começa na primeira fiada; sem acrescentar parede acima do seu topo. Ocupações coincidentes se unificam, sem peças duplicadas. Cada faixa associada a vão cobre sua largura mais um meio tijolo de cada lado, conforme seção 14.

Graute automático obedece às opções habilitadas e ao intervalo máximo configurado. Em Fiada, um furo com graute é preenchido em cor escura; no hover, furo vazio mostra + e furo grauteado mostra −. Clique adiciona/remove o eixo vertical em toda a extensão de alvenaria correspondente no pavimento, descontando aberturas. Esses sinais também têm identificação textual acessível. Não criar graute apenas na fiada clicada.

O painel **Graute vertical** acompanha a parede selecionada e permite escolhê-la pelo campo **Parede dos grautes**. A parede selecionada filtra somente a consulta de ajustes e define o alcance da restauração por parede; sem seleção, a consulta mostra todas as paredes do pavimento ativo. Na ferramenta Graute, a lista de furos e o hover/clique no canvas permitem adicionar ou remover grautes de qualquer parede do pavimento ativo, independentemente da seleção. Um eixo compartilhado continua único: informar que sua edição também afeta as outras paredes do encontro. A seleção e a consulta filtrada permanecem disponíveis em somente leitura.

No mesmo painel, oferecer **Restaurar nesta parede…** e **Restaurar no pavimento…**. A primeira exige uma parede selecionada; a segunda abrange o pavimento ativo inteiro. Confirmar em diálogo que identifica o alcance, conta inclusões e exclusões manuais e informa que serão descartados também os ajustes pendentes em todas as fiadas. Na parede, remover por inteiro os ajustes associados a ela, inclusive compartilhados, avisando o possível efeito nas demais paredes do encontro. Preservar ajustes fora desse alcance, outros pavimentos, configurações atuais, geometria, canaletas e encontros. A distribuição automática segue as categorias e a distância atuais; se todas as categorias estiverem desligadas, informar que não serão criados automáticos. Sem ajustes no alcance, desabilitar a ação. Cancelar ou Escape não muda o projeto; confirmar produz uma operação desfazível, com recálculo e salvamento. Bloquear restauração durante cálculo, prévia de encontro, resultado desatualizado ou somente leitura.

Em M4.1, cada pavimento tem seus próprios grautes, posicionados automaticamente conforme o padrão configurado e a geometria daquele pavimento. Inclusões e exclusões individuais serão válidas somente no pavimento correspondente; ajustar um graute não alterará os grautes de outro andar, mesmo quando os eixos coincidirem nas coordenadas horizontais. O padrão comum do projeto não compartilha ajustes individuais entre pavimentos. A geração e os ajustes respeitarão a alvenaria e os limites verticais de cada pavimento, sem propagação automática para outro andar. Este isolamento está implementado em M4.1.

Permitir remover canaletas somente na Fiada onde aparecem; renderizar canaletas com canal longitudinal distinto de tijolos comuns, não apenas outra cor. Não mostrar suas peças na Planta. Preservar remoções e adições após qualquer recálculo, inclusive alteração das configurações. A automação é ponto de partida: supressões manuais prevalecem sobre a reposição automática, sem diagnóstico estrutural de ausência.

**Aceite:** configurações persistidas; faixas e grautes automáticos gerados pelas regras nominais documentadas; clique +/− afeta todo eixo respeitando vãos; remoção de canaleta afeta somente o alcance indicado na prévia; nenhuma escolha reaparece silenciosamente; desenho distinto por tipo de peça.

### RF-13 — Lajes

Permitir criar uma laje por pavimento, com contorno ortogonal simples, sem auto-interseções, e espessura positiva definida pelo usuário. Será possível editar contorno, espessura e aberturas, também ortogonais simples. Vértices do contorno e das aberturas seguem a malha horizontal de meio tijolo do projeto. Aberturas retiram efetivamente área da laje, devem ficar estritamente internas ao contorno e não podem tocar ou sobrepor umas às outras nem tocar a borda externa. Não são desenhos de referência. A laje pertence ao pavimento em que é desenhada e independe da existência de paredes nele. Não haverá classificação ou comportamento distinto de piso e cobertura.

Desenhar contorno e aberturas por vértices na malha, com prévia ortogonal entre pontos e fechamento explícito do polígono. Escape cancela o desenho ou edição em andamento sem alterar o documento. Criar ou editar usa prévia antes de confirmar. Mover a laje transporta todas as suas aberturas pela mesma translação horizontal. Uma edição que deixe abertura fora do contorno ou viole as regras de validade não é confirmada; preservar o estado anterior e indicar o impedimento, sem apagar, deslocar ou reduzir aberturas automaticamente. Permitir excluir uma abertura sem excluir a laje; excluir a laje remove suas aberturas, preservando paredes e demais elementos. Operações confirmadas são desfazíveis.

#### Interação com lajes

Na Planta do pavimento ativo, a ferramenta **Laje** inicia um contorno quando ainda não existe laje; se existir, fica indisponível com a explicação “Este pavimento já tem uma laje”. Cada clique esquerdo fixa um vértice; o trecho provisório parte do último ponto na direção horizontal ou vertical predominante do cursor, encaixado na malha (empate mantém horizontal). Não inserir cantos intermediários automaticamente. O primeiro ponto permanece indicado; clicar nele ou usar **Fechar contorno** tenta ligar o último ao primeiro por um único segmento ortogonal. Não fechar por proximidade, duplo clique ou ao sair da ferramenta. Fechamento inválido mantém o rascunho para correção ou cancelamento. Após fechar o contorno, oferecer somente **Confirmar contorno** e **Cancelar** como ações, tanto para laje quanto para abertura e redesenho. Não reabrir o rascunho fechado; para corrigir os pontos, cancelar e iniciar outro desenho. Cancelar preserva integralmente a laje e aberturas existentes. A prévia fechada apresenta espessura e **Confirmar/Cancelar**; a espessura inicial exige entrada positiva explícita, sem sugerir valor construtivo. **Retirar último vértice** está disponível enquanto o desenho está aberto; após fechar, corrigir exige cancelar e reiniciar, conforme as ações acima. Só Confirmar cria a laje.

Selecionar a laje oferece **Adicionar abertura**, usando o mesmo desenho e fechamento; a abertura não tem espessura própria. Mostrar prévia da região retirada, sem ocultar paredes no vazio. Selecionar abertura oferece suas ações e identifica a laje proprietária. Arrastar o corpo da laje já selecionada move contorno e aberturas; arrastar o interior de uma abertura já selecionada move apenas essa abertura. Um clique de seleção não inicia movimento. Soltar no canvas confirma somente candidato válido e diferente do original; Escape, perda de foco, perda de captura ou soltura fora cancelam integralmente. Trocar ferramenta, modo ou pavimento cancela desenhos, prévias e campos ainda não confirmados. Espaço + arraste navega sem fixar pontos nem mover elementos; zoom não confirma operações. Atalhos do canvas não atuam em campos de texto. Durante desenho ou arraste pendente, as ações de alteração nas propriedades da laje ficam indisponíveis; escolher outro elemento na lista cancela a prévia.

**Edição de arestas (D42-01):** usar uma alça no meio de cada aresta do contorno selecionado, inclusive de abertura. Arrastá-la desloca a aresta perpendicularmente, movendo seus dois extremos na malha e alongando/encurtando as duas arestas vizinhas; todas as demais permanecem fixas. Mostrar comprimento e deslocamento na prévia. Impedir colapso ou inversão das arestas vizinhas, mesmo quando um salto produza outro polígono simples na posição final. Não oferecer arraste livre de vértices. Para mudar a quantidade de cantos, **Redesenhar contorno** reutiliza o desenho por vértices, conservando o ID do alvo e, ao redesenhar o exterior, todas as aberturas imóveis. O original só é substituído ao confirmar um candidato integralmente válido. Esse conjunto compõe o escopo implementado de M4.2, com aceite manual da funcionalidade separado da confirmação de D42-01.

Espessura é editada nas propriedades com **Aplicar/Cancelar**, mostrando as faces superior/inferior derivadas. Aplicar espessura, cancelar espessura, adicionar abertura, redesenhar contorno e excluir usam botões compactos somente com ícones, com nomes acessíveis e dicas por mouse/foco; a exclusão identifica laje ou abertura conforme a seleção. Zero, negativo, precisão não representável e valor que exceda os limites de integridade são impedidos com mensagem; não exigir múltiplo da altura-base. Excluir abertura atua apenas na selecionada. Excluir laje pede confirmação informando que também remove suas aberturas; cancelar preserva tudo. Delete segue o alvo selecionado e a mesma confirmação da laje, sem interferir em campos. Desfazer/refazer restaura IDs, espessura, contornos e aberturas como uma operação por confirmação ou arraste.

#### Representação e seleção de lajes

Na camada editável, mostrar somente a laje do pavimento ativo, em Planta, como preenchimento discreto com contorno externo e bordas de aberturas identificáveis. Aberturas são vazios reais no preenchimento, sem retângulo opaco sobre o fundo. A malha fica ao fundo, seguida pela laje, paredes/vãos, realces de seleção e prévias/alças. Paredes e vãos continuam legíveis sobre a laje. A comparação de M4.3 acrescenta a referência não editável atrás dessa camada, conforme RF-08. Não incluir perspectiva ou representação de laje em Fiada. Pavimento com somente laje continua sem paredes/fiadas no estado vazio já definido em RF-08.

Com Selecionar, clicar na área material da laje ou em sua borda a inclui entre os candidatos; sem parede/vão nesse ponto, o vazio de uma abertura seleciona a abertura, não o corpo material da laje. No clique sem arraste, priorizar vão de parede (porta, janela ou vão livre), depois parede, depois abertura de laje e laje, somente no pavimento ativo. Não perguntar quando a prioridade resolver o alvo: parede sobre laje é selecionada diretamente, assim como vão sobre parede/laje. A caixa contextual permanece apenas para ambiguidade entre candidatos da categoria prioritária, identificando tipo e proprietário. Alças do selecionado têm prioridade sobre corpos sobrepostos. Após escolher na lista ou no seletor, o próximo arraste usa esse alvo, mesmo sob outro elemento; um clique sem arraste no ponto sobreposto volta a aplicar a prioridade descrita, mesmo com laje selecionada. A laje continua selecionável pelas áreas livres e pela lista. A ordem visual não torna nenhum elemento inacessível. Na barra de Planta, um único select **Selecionar elemento…** reúne os grupos **Laje** (laje e suas aberturas) e **Vãos de parede** (portas, janelas e vãos livres), somente do pavimento ativo. Mostrar apenas grupos com elementos e ocultar o controle quando ambos estiverem vazios; ele permanece disponível com outras ferramentas ativas. Identificar abertura de laje pelo número/proprietário e vão de parede pelo tipo, número, parede, base e topo. A escolha ativa Selecionar, descarta prévias de laje e novos vãos de parede ainda não confirmados sem gravar, encerra a escolha contextual de sobrepostos ao mudar o alvo e abre as propriedades do elemento escolhido; a seleção no canvas também se reflete na lista quando o alvo pertence a ela. As propriedades da laje mantêm sua lista local, inclusive quando suas bordas estiverem sob paredes. Clicar fora de todos os alvos limpa a seleção. Impedimentos mostram causa e região/aresta envolvida, além de cor; não são diagnósticos estruturais e não tornam inválido o estado anterior conservado.

A face superior coincide sempre com a cota do próprio pavimento; a espessura cresce para baixo. A face inferior é a cota do pavimento menos a espessura. Não há edição independente de cota da laje. A espessura será armazenada apenas nela, sem campo duplicado no pavimento. Por exemplo, no térreo de cota 0 cm, uma laje de 21 cm ocupa de −21 a 0 cm; em um pavimento de cota 280 cm, ocupa de 259 a 280 cm.

Todas as paredes começam na cota de seu pavimento, com ou sem laje. Cada parede terá altura inicial herdada do padrão do pavimento e editável; seu topo é a cota do pavimento mais essa altura. A laje não limita, recorta ou altera automaticamente a altura ou a composição de paredes de qualquer pavimento. Alturas de parede incompatíveis com fiadas completas continuam sujeitas à validação modular, sem cortes ou arredondamentos silenciosos. Grauteamentos e encontros respeitam a alvenaria definida pelas paredes e pelos vãos.

Lajes aparecerão como camada 2D para comparação visual. Não detectar ou diagnosticar colisões, apoio ou interseções entre elementos de pavimentos distintos: não verificar se uma parede está sobre outra ou se um volume invade outro andar. Não gerar avisos porque paredes ou grautes de pavimentos diferentes não coincidem. Essas relações não impedem a edição nem alteram o estado de validade geométrica. Todas as validações existentes no sistema continuam aplicadas a cada pavimento isoladamente, incluindo colisões na composição, cobertura de células, modulação, encontros, vãos, canaletas e ajustes. Contornos e aberturas de lajes obedecem à sua própria validade geométrica; não se acrescenta um verificador volumétrico de lajes entre pavimentos. A criação ou alteração de uma laje não cria pavimentos, não desloca paredes e não propõe atualização das cotas de outros pavimentos. Alterar sua espessura mantém a face superior e move somente a face inferior.

Para representar uma laje acima das paredes, inclusive uma cobertura, o usuário cria um pavimento na cota desejada e desenha a laje nele. Pode deixar esse pavimento sem paredes. Todos os pavimentos seguem as mesmas regras, independentemente do uso atribuído pelo usuário. Não haverá modelagem de telhados.

**Aceite:** criar laje com ou sem paredes mantém sua face superior na cota do pavimento; alterar a espessura move somente a face inferior; contorno e aberturas respeitam a malha e as regras de validade; aberturas retiram área somente da laje; edição inválida mantém o estado anterior; sobreposições com paredes não recortam a composição nem geram diagnóstico. Dimensionamento resistente e armaduras da laje ficam fora desta entrega.

### RF-08 — Até quatro pavimentos

O projeto começará com um térreo e propriedades iniciais visíveis e editáveis, sem exigir cadastro prévio de todos os níveis. Adicionar, renomear, duplicar e remover pavimentos até o limite de quatro, sem distinção de piso ou cobertura. Cada pavimento terá uma cota única, especificada pelo usuário ao criá-lo, e altura padrão para novas paredes. Essa cota define o início de todas as suas paredes e a face superior de sua laje, quando existir. Não haverá campos separados de piso acabado e início da alvenaria no comportamento de M4. Alterar a altura padrão não modificará paredes existentes.

Criar pavimento vazio apresenta a mesma altura padrão usada na criação do projeto, editável antes de confirmar e compatível com a altura-base do tijolo. Se o valor inicial não for modular para a base escolhida, exigir escolha explícita entre alternativas compatíveis, sem arredondamento silencioso. Não herdar a altura de outro pavimento. A duplicação conserva a altura padrão do pavimento de origem. A referência inicial escolhida pertence ao projeto e permanece após editar, copiar ou remover pavimentos; não muda ao editar a altura padrão de um andar.

A referência de 280 cm corresponde a 40 fiadas para a altura usual de tijolo de 7 cm, sem exigir etapa adicional de compatibilização nesse caso. As alternativas acima se aplicam somente quando o usuário escolher uma altura-base personalizada incompatível.

Ordenar pavimentos por cota crescente, inclusive após edição de cota; pavimento adjacente é o imediatamente anterior ou posterior nessa ordem. Admitir cotas negativas e zero, sempre múltiplas da altura-base do tijolo. Não admitir dois pavimentos na mesma cota. Criação e edição validam essas condições antes de confirmar; valor fora da modulação apresenta alternativas explícitas, sem arredondamento silencioso. A contagem das fiadas permanece local a cada pavimento.

Compartilhar origem e coordenadas horizontais. Somente em Planta, permitir uma sobreposição de referência por vez, escolhendo o pavimento imediatamente inferior ou superior na ordem das cotas. Mostrar sua Planta, incluindo paredes, vãos e laje com aberturas quando existirem, em aparência atenuada e com identificação do pavimento, distinta dos elementos ativos. A referência não recebe edição. A comparação não cria vínculos nem diagnósticos de alinhamento ou continuidade entre andares. Não haverá ferramenta para marcar reforços como contínuos entre pavimentos em M4.

Duplicar um pavimento copia toda a intenção editável: altura padrão, paredes, vãos, laje e aberturas, escolhas de encontros, supressões e ajustes manuais, inclusive pendentes. Exigir cota de destino válida antes de confirmar. A cópia terá novos identificadores e referências internas remapeadas, preservando geometria horizontal, alturas e medidas relativas à cota do pavimento; ajustes com cotas absolutas acompanham a diferença entre as cotas de origem e destino. A duplicação dispara o fluxo normal de recálculo completo do projeto, incluindo a cópia, sem copiar peças geradas como intenção ou alterar a intenção do pavimento original. Em M4.1, lajes e suas aberturas ainda não existem; a duplicação desses elementos passa a valer em M4.2.

Permitir remover qualquer pavimento, inclusive o térreo, desde que reste pelo menos um. Remover seus elementos e ajustes em uma única operação desfazível, preservando as cotas e elementos dos demais, sem reassociar lajes. Após excluir o ativo, selecionar o anterior na ordem de cotas ou, se não existir, o seguinte. Desfazer restaura os mesmos identificadores e relações. Não permitir duplicação ou criação além de quatro pavimentos.

Em M4.1, cada pavimento funciona como uma nova Planta, com seus elementos próprios; a numeração das fiadas reinicia em 1 a partir da cota do pavimento, independentemente da cota global. Bases de vãos e níveis de canaletas são medidos em relação à mesma cota. Alterar a cota desloca verticalmente as paredes, seus vãos e elementos associados e a laje daquele pavimento, preservando alturas e medidas relativas; não altera as cotas dos demais pavimentos. Não há sugestão de cota derivada de lajes ou das alturas do pavimento inferior, nem acréscimo presumido de camadas. Um pavimento pode conter somente a laje, somente paredes ou ambos.

**Aceite:** o quinto pavimento é impedido; cotas negativas são admitidas, cotas iguais ou fora da modulação não são confirmadas; a ordem acompanha a cota; todas as paredes começam na cota de seu pavimento, com ou sem laje; pavimento sem paredes pode conter laje e abrir Fiada em estado vazio; duplicação preserva intenção e independência; remoção preserva os demais pavimentos e não elimina o último; sobreposições e diferenças de alinhamento entre andares não geram diagnósticos; referências sobrepostas não recebem edição.

**Operações por pavimento:** criar pavimento vazio, renomear, alterar cota/altura padrão, duplicar, remover, alternar e editar paredes/vãos/ajustes nos pavimentos; na barra, manter o seletor acessível de pavimento, sem etiqueta visível, e Novo pavimento; Duplicar pavimento, Excluir pavimento e a quantidade de pavimentos do projeto (`N/4`) ficam nas propriedades do pavimento ativo. As três ações usam botões compactos somente com ícones, com nomes acessíveis e dicas por mouse/foco de teclado; navegação de fiadas e diagnóstico local; histórico, salvamento e arquivo no novo contrato. Configurações de vãos, níveis de canaletas e padrão de graute continuam comuns ao projeto, aplicadas separadamente à geometria de cada pavimento; ajustes individuais não são compartilhados. Novo projeto abre o térreo em cota 0. Os formulários de pavimento mostram nome, cota e altura padrão antes de confirmar; nome não vazio de até 100 caracteres, sem exigir nomes únicos. Criar ou duplicar seleciona o novo pavimento; renomear preserva IDs e não dispara composição. Ao reabrir, selecionar o pavimento de menor cota e Planta; câmera e última fiada por pavimento são estado da sessão. Ações Localizar/Ver fiada/Editar na Planta de diagnósticos mudam para o pavimento do alvo antes de selecionar ou enquadrar. Exemplos em EX-56–64 do Caderno Técnico. Os IDs de aceite M4.1-A01–14 estão no [registro histórico de pavimentos](arquivo/marcos/M4.1-Pavimentos.md). Sem ferramenta de laje, sobreposição entre andares, quantitativos ou migração de arquivos anteriores nesse incremento.

#### Comparação visual de pavimentos

A referência segue CT-15/EX-80–85 e o contrato de [Editor e interação](arquitetura/Editor-e-Interacao.md#comparação-visual-de-pavimentos).

Em Planta, dentro de **Propriedades do pavimento** na lateral, oferecer o campo **Referência de pavimento**, com nome acessível **Comparar pavimento**, com **Sem referência** e os vizinhos disponíveis: **Inferior — nome · cota** e **Superior — nome · cota**, em centímetros. Identificar o controle por nome acessível, sem diálogo ou painel adicional. Mostrar somente com dois ou mais pavimentos e desabilitar durante processamento. O campo acompanha o painel do pavimento: não aparece na barra nem nos painéis de parede, vão ou laje. Recolher propriedades ou selecionar um elemento não desliga a referência; limpar a seleção e reabrir o painel permite alterá-la. Não listar o ativo, vizinhos inexistentes ou andares não adjacentes. Direção e cota distinguem nomes repetidos.

Junto à identificação da Planta, mostrar **Referência: direção · nome · cota**, sem encobrir controles ou interceptar o canvas. O ativo mantém sua identificação. Referência vazia permanece selecionável e identificada como **sem elementos**; não pular para outro andar. Um ativo vazio pode mostrar a referência e receber desenho próprio, mantendo seu estado vazio de Fiada.

Usar a mesma origem, escala e câmera, sem deslocamento horizontal pela cota ou alinhamento automático. Atrás dos elementos ativos, mostrar contornos atenuados e tracejados das faixas das paredes, símbolos de portas/janelas/vãos e bordas da laje e de suas aberturas. Vazios não recebem preenchimento opaco; paredes e vãos da referência permanecem distinguíveis sobre sua própria laje. Não reproduzir seleção, alças, prévias, diagnósticos, cotas de edição, canaletas ou grautes do outro andar. Na coincidência exata, o ativo tem prioridade visual; não afastar linhas para simular separação.

Clique, hover, seleção por lista, propriedades, alças, arraste e Delete continuam restritos ao ativo. A referência não participa de seleção, encaixe do cursor, continuidade/união de paredes ou validação de candidatos. Clicar apenas sobre ela equivale a clicar em área sem elemento ativo. Desenhar na mesma posição pela malha comum não cria vínculo. Preservar a lista Selecionar elemento… e a prioridade de clique de M4.2, somente com elementos ativos.

Escolher/trocar/remover a referência conserva câmera e seleção ativa e, por si só, não confirma desenhos ou prévias, nem salva, recalcula ou cria histórico. Campos e gestos conservam suas regras atuais de confirmação/cancelamento por foco; uma edição de campo confirmada por perda de foco continua sendo operação própria, sem mudar seu comportamento por causa da comparação. Zoom e navegação movem ambas as plantas juntas. **Enquadrar**, quando solicitado, considera a união da geometria ativa e da referência visível; sem referência, conserva o comportamento atual. Não reenquadrar automaticamente ao escolher uma referência. Sem geometria em ambas, usar o enquadramento vazio existente.

Abrir/reabrir/importar projeto inicia todos os pavimentos em **Sem referência**. Durante a sessão, lembrar a direção escolhida separadamente por pavimento, inclusive **Sem referência**: ao trocar o ativo e retornar, recuperar sua escolha válida. Entrar em Fiada limpa a escolha do pavimento ativo; voltar à Planta não a restaura automaticamente. Conservar o funcionamento independente da referência de fiada anterior/próxima do próprio pavimento. Permitir comparação para consulta em aba somente leitura, sem gravar no registro compartilhado.

Enquanto o ativo permanecer o mesmo, conservar a direção escolhida após renomear, alterar cotas, criar/remover outro pavimento ou desfazer/refazer. Resolver novamente o vizinho imediato na ordem atual, atualizando nome/cota/geometria; se a direção ficar sem vizinho, voltar a **Sem referência**. Não manter um ID que se tornou não adjacente nem restaurar comparação já limpa ao desfazer. Criar/duplicar inicia o novo pavimento sem referência, sem copiar a preferência da origem; remover descarta a preferência do pavimento excluído. Trocas do ativo, inclusive por diagnóstico ou histórico, recuperam a escolha do destino. Após mudanças de cota, exclusão ou histórico, normalizar também as escolhas dos pavimentos inativos: se a direção perder o vizinho, limpá-la e não restaurá-la ao desfazer. A comparação é estado da sessão, ausente do arquivo e do histórico; não muda cálculo, validade, alturas, lajes ou ajustes.

**Critério de comparação:** referência única adjacente identificada e sem interação, alinhamento horizontal exato, vazios legíveis, prioridade do ativo, enquadramento da união e atualização após mudanças de ordem; comparação ausente em Fiada e ao reabrir; intenção, composição e persistência invariantes ao operar somente a comparação. Os IDs de aceite M4.3-A01–10 estão no [registro histórico de comparação](arquivo/marcos/M4.3-Comparacao-de-Pavimentos.md). Sem comparação volumétrica, continuidade estrutural ou quantitativos.

### RF-09 — Edição simples e recálculo automático

As peças são geradas pelo motor, sem substituição, orientação ou bloqueio manual de tijolos individuais. Na Planta, o usuário cria, exclui e altera o tamanho das paredes por ambas as extremidades, conforme RF-02. Em Fiada, permanecem apenas os ajustes de encontros, grauteamentos e canaletas definidos nos RF-04, RF-05 e RF-07.

Após cada alteração geométrica ou construtiva confirmada que afete os insumos do motor, marcar o resultado como desatualizado e recalcular automaticamente o projeto inteiro, uma operação por vez. Alterações de nome, seleção, câmera e medidas independentes não exigem cálculo. É aceitável aguardar o processamento com novas edições temporariamente indisponíveis; não há fila de edições ou botão de regeneração no fluxo normal. Preservar ajustes compatíveis. Ajustes incompatíveis permanecem registrados como pendentes, sem aplicação à composição, com ação para localizar e corrigir ou descartar o ajuste. Uma falha de cálculo mantém o modelo editável e permite tentar novamente.

A geração não aplica orçamento ou teto por quantidade de módulos, células, fiadas, peças, eixos ou intervalos derivados. Manter validações geométricas existentes e limites de integridade de arquivos/dados; falhas reais de processamento preservam a intenção. A análise de quantidades pelo usuário pertence aos quantitativos futuros de M5, sem criar controle de orçamento em M4.1.

**Aceite:** ambas as extremidades permitem redimensionar paredes; alterações confirmadas recalculam automaticamente; ajustes incompatíveis não desaparecem silenciosamente; resultados desatualizados não são apresentados como atuais nem usados nos quantitativos.

### RF-10 — Diagnóstico e estado do projeto

Exibir problemas por gravidade, pavimento, fiada e elemento, com acesso à localização e explicação simples do problema. Categorias mínimas: modulação, colisão, lacuna, encontro sem solução, vão incompatível, canaleta descontínua, furo desalinhado e conflito com ajuste construtivo. Lista contextual acionada pelo indicador mostra causa, IDs/localização, faixa de fiadas, consequência e ações Localizar/Ver fiada/Editar na Planta conforme o alvo.

Mostrar de forma simples se o resultado está atualizado e se há pendências geométricas. Não haverá fluxo obrigatório de aprovação técnica ou regras na interface.

**Aceite:** qualquer erro impeditivo bloqueia a classificação “geometricamente válido”; o projeto pode ser salvo e exportado como rascunho com pendências claramente declaradas.

### RF-11 — Quantitativos e arquivo nativo

Contar peças por tipo, pavimento e fiada, sem duplicar peças dos encontros. Separar cortes e peças especiais. Para peças modificadas na obra, distinguir a peça-base consumida da peça resultante, evitando dupla contagem. Eventual margem de perdas será informada pelo usuário e separada da quantidade geométrica.

**Consulta:** acesso identificado como Quantitativos no projeto aberto, em tela própria, com retorno ao desenho. Ao acessar durante renomeação, abrir no primeiro clique; a saída do campo confirma o nome pelo fluxo normal e a consulta aguarda a operação antes de apresentar quantidades. Mostrar o nome do projeto e a base nominal, resumo do projeto e detalhamento de um pavimento por vez, com totais e linhas por fiada local. Ordenar pavimentos pela cota e identificar também sua cota, distinguindo nomes repetidos. Contar os quatro tipos realmente gerados: inteiro, meio, canaleta e meia canaleta, em unidades inteiras; o total de peças soma esses tipos. Usar as peças finais da composição, sem contar novamente suas paredes participantes, origens de canaletas, células, grautes ou referências de comparação. Pavimento vazio, inclusive com somente laje, tem totais zero e nenhuma fiada artificial.

O catálogo atual não registra peças preparadas na obra nem rendimento de cortes. Identificar a consulta como quantidade geométrica nominal: meios não são automaticamente cortes de inteiros, e canaletas não são automaticamente inteiros consumidos na preparação. Informar que consumo de peças-base para preparação não é determinado neste catálogo; não apresentar esse consumo como zero ou somá-lo às peças resultantes. Não incluir novas peças, procedimentos, áreas/volumes de lajes, concreto, graute, aço, preços ou orçamento em M5.

**Perdas opcionais:** campo percentual único para o projeto, inicial 0%, não negativo e com até duas casas decimais, aceitando vírgula. No resumo do projeto, mostrar por tipo a quantidade geométrica, o acréscimo de perdas e o total estimado com perdas. Arredondar para cima somente o total estimado de cada tipo, após somar o projeto inteiro; o acréscimo é a diferença para a quantidade geométrica. Não somar estimativas arredondadas por fiada/pavimento e não misturar unidades de tipos distintos. A estimativa é uma margem indicada pelo usuário, sem recomendação de fabricante ou conversão em peças-base. Campo inválido informa o motivo sem aplicar outro valor silenciosamente. Percentual é estado de consulta da sessão do projeto: conserva-se ao voltar ao desenho e consultar novamente, reinicia em 0% ao abrir outro projeto ou reabrir e não é salvo no arquivo. Não altera composição, histórico ou salvamento; a tela identifica que o percentual não é salvo.

**Atualidade e pendências:** consultar somente o resultado vigente e atualizado do documento em memória, inclusive em somente leitura ou após falha de salvamento remoto. Resultado atualizado com erros de composição pode ser consultado como **Parcial — há pendências**, contando apenas peças efetivamente geradas; identificar os pavimentos afetados e oferecer acesso aos diagnósticos existentes. Não exigir correção ou aprovação técnica para consultar o parcial. Resultado desatualizado, ausente ou em cálculo não apresenta números antigos nem zeros que simulem cálculo concluído: informar indisponibilidade e manter o fluxo existente de recálculo. Avisos informativos sem erro não tornam a contagem parcial. Não há novo cálculo ao apenas consultar. Abrir a consulta cancela prévias sem confirmá-las; voltar conserva pavimento, modo, câmera e seleção confirmada do editor, sem aplicar ajustes ou gerar histórico.

Quantitativos são consultados em tela separada do canvas. A única exportação inicial será o arquivo nativo, para baixar e reabrir o projeto. PDF, SVG, CSV e documentos de impressão ficam para evolução posterior.

Não estimar volume de graute nem quantidade de aço sem dados suficientes; a consulta cobre peças da composição.

**Aceite:** a soma geométrica por fiada coincide com a soma do pavimento e do projeto; consulta usa o estado atualizado e identifica totais parciais; perdas opcionais ficam separadas e arredondadas por tipo no total do projeto. Download e carregamento preservam o projeto, inclusive pendências e ajustes; filtros e percentual de consulta não são persistidos.

### RF-12 — Salvamento remoto e arquivo portátil

Os projetos são salvos no servidor. A abertura, a importação e o download seguem os formatos suportados em [Persistência e compatibilidade](arquitetura/Persistencia-e-Compatibilidade.md#formato-e-leitores-vigentes).

Ao acionar um projeto compatível na lista, apresentar imediatamente “Abrindo projeto…” no cartão escolhido, preservando seu nome, com indicador de espera e cursor de espera em toda a página antes de iniciar leitura/validação pesada. Não mostrar porcentagem sem progresso mensurável. Impedir aberturas concorrentes, criação, importação, duplicação ou exclusão durante a operação. Manter o feedback de abertura até o canvas ter dimensões reais, câmera restaurada e primeiro desenho completo, incluindo as imagens visíveis. Exibir o editor já com zoom e centro salvos, sem enquadramento automático ou quadros intermediários; sem preferência válida, usar a câmera inicial habitual. No sucesso, abrir o editor e restaurar o cursor; na falha, permanecer na lista, mostrar a causa e liberar controles/cursor para nova tentativa. O indicador respeita movimento reduzido e mantém texto acessível. Carregar e validar o registro uma única vez no fluxo de abertura, preservando conferência de integridade, controle remoto por revisão e atualização de resultados.

A tela de projetos reserva uma faixa de status logo abaixo de “Seu espaço de projetos”, alinhada ao conteúdo e com espaço mínimo mantido mesmo em repouso. Mostrar “Importando arquivo…” durante a leitura/importação, “Abrindo projeto…” durante a abertura e até o primeiro desenho pronto, e “Atualizando lista…” durante a consulta dos projetos. Abertura tem prioridade sobre importação, que tem prioridade sobre atualização da lista. Reusar o indicador de espera, respeitar movimento reduzido e anunciar progresso somente na faixa; o cartão ativo pode conservar seu feedback visual. Falhas da lista, importação ou abertura permanecem na mesma faixa até resolução ou fechamento quando aplicável; falha de lista conserva a ação Atualizar lista. Avisos de salvamento e recuperação no editor mantêm seu próprio local. A faixa não exibe porcentagem nem altera validação, persistência ou preparação do canvas.

A lista usa cartões compactos, com altura mínima visual de 80 px e 8 px entre itens. Preservar o bloco Novo projeto e o tamanho do ícone de projeto (bloco de 48 px, pictograma de 24 px). Nome na primeira linha, quantidade de paredes e data/hora da última atualização na segunda, no formato dd/mm/aaaa às HH:mm e fuso local do navegador; nomes longos usam reticências e título com nome completo. A indicação curta de incompatibilidade integra a linha de informações e pode exigir quebra; a explicação expandida aumenta o cartão conforme necessário. Duplicar e Excluir são botões somente com ícones dentro da borda do cartão, alinhados horizontalmente à direita, com espaço sempre reservado. Mostrar em hover sobre o cartão ou foco dentro dele; sem capacidade de hover, manter visíveis. Nomes acessíveis em português e dicas por mouse/foco identificam as ações. Corpo e ações são controles independentes: abrir/explicar, duplicar ou excluir não acionam os demais. Nenhum cartão da lista mostra seta de abertura.

Na lista, projetos de formato incompatível conservam a indicação permanente de incompatibilidade e não mostram a seta de abertura. Clicar no cartão ou acioná-lo pelo teclado exibe a explicação no próprio cartão: o projeto está em formato incompatível e é necessário criar um novo projeto. Essa ação não tenta abrir o documento nem emite o aviso global no topo. A explicação permanece junto ao projeto selecionado, com anúncio acessível e ajuste mínimo da rolagem caso necessário para mantê-la visível no final da lista. Duplicar continua indisponível; Excluir e seu backup permanecem disponíveis.

Na lista de projetos, oferecer **Excluir** como ícone dentro do cartão, à direita, para projetos da conta. Ao clicar, identificar o projeto e perguntar se o usuário deseja baixar um backup `.ecovit` antes da exclusão. Oferecer Cancelar (foco inicial), Baixar backup e Enviar à lixeira sem backup; após solicitar o download, manter a confirmação aberta com Enviar à lixeira e orientação para conferir o arquivo salvo. Escape cancela sem excluir. O backup usa o último registro salvo e não converte formatos antigos; a política vigente de tamanho continua aplicada. A exclusão confirmada envia o projeto para a lixeira por 30 dias, com restauração e eliminação definitiva pela conta, conforme RF-19/20. Não bloquear pela existência de outra aba: revisão e estado no servidor impedem que uma aba antiga recrie ou sobrescreva o projeto removido. Falhas preservam o diálogo e permitem conferir/repetir a mesma operação.

O download gera JSON compacto com extensão .ecovit. Quando o resultado calculado faria o arquivo exceder 50 MiB, a cópia conserva toda a intenção e informa que a composição será reconstruída na abertura. O trabalho aberto permanece em memória. Um arquivo inválido é recusado antes de substituir o trabalho ou criar um projeto.

#### Duplicação de projetos

Na lista de projetos, oferecer Duplicar para registros do formato suportado. Solicitar o nome da cópia antes de confirmar, sugerindo o nome de origem com sufixo “ (cópia)” dentro do limite de 100 caracteres. Aceitar nome não vazio após remover espaços externos; nomes repetidos continuam permitidos. Cancelar não cria registro. A cópia usa novo ID de projeto e novas datas, preserva toda a intenção confirmada (quatro pavimentos, lajes, aberturas, configurações, escolhas e ajustes inclusive pendentes) e não altera a origem. Identificadores internos permanecem estáveis dentro de cada documento independente, como na importação; não se trata de duplicação de pavimento.

Confirmar cria e salva um novo projeto independente, atualiza a lista e permanece nela, permitindo abrir a cópia pelo fluxo habitual. Não copiar histórico, câmera, seleção, comparação, prévias ou percentual de perdas da sessão. Falha de leitura, validação ou gravação informa o problema sem apresentar uma cópia salva nem modificar a origem. Formato incompatível conserva o aviso atual e não é duplicado parcialmente. O projeto aberto em outra aba pode ser copiado a partir do último registro salvo, identificado dessa forma; a cópia não lê alterações não salvas nem escreve na origem.

### RF-14 — Preferências do Ecovit

Diálogo compacto denominado “Preferências do Ecovit”, separado de Configurações do projeto, com grupo “Visibilidade dos rótulos”. Acesso por botão com ícone de engrenagem ao lado do botão de configurações do projeto no cabeçalho, com nome acessível e dica “Preferências do Ecovit”. Preservar acesso e identificação dos dois controles, inclusive com nome de projeto longo e em telas menores; seguir a [Interface e iconografia](arquitetura/Interface-e-Iconografia.md#iconografia). O botão existente mantém seu ícone de ajustes.

Seis caixas de seleção independentes — Portas, Janelas, Vãos, Paredes, Medidas e Terreno — iniciam marcadas. Medidas controla os textos das cotas independentes do RF-15. Terreno controla o rótulo de área do RF-18; ocultá-lo mantém o preenchimento, contorno, área nas propriedades e medidas temporárias de edição. Para portas, janelas e vãos, cada controle abrange o rótulo inteiro de tipo/base/topo, sem opções por parte do texto. Para paredes, um único controle abrange os identificadores A/B das extremidades quando selecionadas e o novo rótulo permanente de comprimento e altura de cada parede confirmada no pavimento ativo em Planta. Ocultar um tipo não oculta os demais nem o desenho dos elementos.

O rótulo de parede apresenta “C: 200 cm · H: 280 cm”, com valores reais do elemento: comprimento do segmento de referência externa entre A/B e altura total da parede, sem descontar vãos, usar altura-padrão do pavimento ou confundir altura com cota/fiada. Atualiza ao mover, redimensionar ou alterar altura, inclusive desfazer/refazer e reabrir. Segue a orientação da parede, centralizado junto ao segmento, acima nas horizontais e à esquerda com leitura de baixo para cima nas verticais, independente do sentido A/B. Texto e afastamento mantêm tamanho visual legível no zoom. Não inclui linhas de cota, alças de posicionamento ou entidade independente; o elemento Medida do BL-03 segue RF-15.

Alterações têm aplicação imediata, sem Aplicar/Cancelar, com botão Fechar e Escape preservando as escolhas. As preferências valem para todos os projetos no mesmo navegador e persistem entre sessões; outro navegador tem suas próprias preferências. Falha de gravação mantém a escolha em memória e informa que não foi salva para a próxima abertura. Ausência ou conteúdo inválido usa os padrões visíveis. Sem conta, sincronização entre dispositivos ou transporte no `.ecovit`.

Uma única preferência por tipo vale nos modos onde seus rótulos aparecem: os rótulos de portas/janelas/vãos seguem a presença atual em Planta/Fiada; o novo rótulo de parede é exclusivo de Planta. Selecionar não reexibe texto oculto; propriedades permanecem disponíveis. Informações temporárias de inserção/movimento/redimensionamento, avisos, orientações e controles de edição continuam visíveis. A referência de outro pavimento conserva sua apresentação sem novos textos. Lajes, grautes e outros tipos ficam fora desse controle.

O grupo Imagens dos mobiliários oferece a opção Suavização em qualidade alta, inicialmente ativada. A opção aplica-se imediatamente à redução e rotação dos mobiliários padrão e personalizados em Planta, inclusive em somente leitura, e persiste só neste navegador. Desativá-la mantém a suavização básica. A escolha não altera o projeto, seu histórico, resultado construtivo ou arquivo .ecovit.

#### Visualização local por projeto

Preservar automaticamente o zoom e o ponto do desenho no centro da área de trabalho ao sair e reabrir um projeto no mesmo navegador. Guardar uma visualização por projeto, compartilhada entre Planta/Fiada e pavimentos, sem restaurar modo, pavimento ou seleção. Ao mudar o tamanho da área de desenho, conservar escala e ponto central; a extensão visível pode mudar. Enquadrar continua disponível e sua visualização também é lembrada.

Essa preferência é independente das opções globais de rótulos. Não altera documento, data de edição, cálculo, histórico ou arquivo `.ecovit`; cópias/importações com novo ID começam sem preferência. Funciona também em somente leitura. Ausência, conteúdo inválido ou leitura indisponível usa a câmera inicial habitual. Falha de gravação informa que a visualização não foi salva para a próxima abertura, sem impedir navegação ou edição. Sem sincronização entre abas, dispositivos ou navegadores.

### RF-15 — Medidas independentes

**Criação:** três cliques esquerdos: início, fim e posição da linha da cota. Após o segundo clique, as duas referências ficam fixas e mover o mouse mostra a linha paralela afastada, suas auxiliares e a distância, para qualquer lado do segmento. O terceiro clique confirma a medida inteira em uma única operação de histórico/salvamento; o afastamento pode ser zero e não altera o comprimento medido. Prévias e solturas dos dois primeiros cliques não gravam. Atração aplica-se somente às duas referências, com prioridade para extremidades/vértices próximos e depois o ponto mais próximo de uma linha elegível. A tolerância é visual, constante em tela ao mudar o zoom; Alt pressionado suspende a atração temporariamente. O afastamento é perpendicular e livre, sem atração ou vínculo geométrico. Escape, perda de foco, clique fora ou troca de contexto cancelam a criação inteira; pontas coincidentes conservam o início para tentar outro ponto final. Navegação e zoom permanecem disponíveis entre os três cliques. A ferramenta permite repetir a criação até trocar de ferramenta ou cancelar.

**Alvos:** geometria confirmada do pavimento ativo: faces e extremidades de paredes, limites de portas/janelas/vãos, arestas e vértices de lajes e suas aberturas, e extremidades de outras medidas. Incluir também os vértices confirmados do terreno global em qualquer pavimento, na criação e no ajuste das pontas; arestas do terreno e rosa dos ventos não são alvos. Rótulos, ícones, malha visual e referências de outro pavimento não são alvos. O encaixe é somente auxílio ao posicionamento: guardar pontos, sem vínculo permanente. Mover, redimensionar, unir ou excluir outro elemento não atualiza, desloca ou exclui medidas já confirmadas.

**Edição:** Selecionar permite selecionar a linha, arrastar seu corpo para transladar as duas pontas mantendo comprimento/direção, ou arrastar qualquer alça mantendo a ponta oposta fixa, com atração durante o ajuste da extremidade. Corpo move livremente, sem reposicionar uma das pontas de forma independente. Realce, seleção de sobrepostos e alças devem permitir distinguir a medida de outros elementos sem interceptar indevidamente sua edição. Delete/Excluir e desfazer/refazer seguem os atalhos existentes, sem afetar campos em digitação. Um gesto confirmado corresponde a uma operação de histórico. Somente leitura permite consulta e navegação, sem alterar medidas.

**Apresentação:** linha de cota paralela ao segmento medido, posicionada por afastamento perpendicular em qualquer um dos lados. Linhas auxiliares ligam os pontos medidos à cota; pequenos traços diagonais marcam suas extremidades. O rótulo fica centralizado junto à linha, acompanhando sua direção, com leitura legível e sem texto invertido. Mostrar comprimento em cm, com até duas casas decimais; arredondar apenas a exibição, preservando os pontos. Fonte, folga do texto e traços de extremidade têm tamanho visual constante; o afastamento da cota pertence ao desenho e acompanha o zoom. Seleção mostra alças nos pontos medidos; não há reposicionamento independente do rótulo. Acrescentar “Medidas” ao grupo Visibilidade dos rótulos das Preferências do Ecovit, inicialmente visível e com o mesmo alcance local e aplicação imediata de RF-14. Ocultar esse rótulo conserva linha, auxiliares e alças; selecionar não reexibe o texto oculto, preservando a orientação temporária necessária durante criação/edição.

**Persistência e integração:** medidas pertencem ao pavimento, são salvas no projeto remoto e no `.ecovit`, preservadas na reabertura, importação e duplicação do projeto. Duplicar pavimento copia suas medidas com identidades próprias; remover pavimento remove também suas medidas, com restauração por histórico. Medidas aparecem e são editadas somente em Planta, não em Fiada nem na referência de outro pavimento. Não alteram paredes, vãos, lajes, composição, diagnósticos construtivos ou quantitativos, nem disparam recálculo construtivo apenas por sua edição. Enquadrar considera suas extremidades, inclusive em pavimento com somente medidas.

**Fora do recorte:** edição numérica de comprimento/ângulo, medidas encadeadas, linhas auxiliares de cota, rótulo personalizado ou reposicionável, vínculos automáticos com elementos e medição em 3D. A geometria livre da Medida não libera desenho não modular para paredes, vãos ou lajes. Dados, precisão e interação em [Medidas e imagens](arquitetura/Medidas-e-Imagens.md#medidas-independentes).

### RF-16 — Imagem de referência por pavimento

Cada pavimento pode ter uma única imagem de referência, abaixo da malha e dos elementos, somente em Planta do pavimento ativo. Ela acompanha zoom/navegação e serve de apoio visual ao desenho. Enquadrar inclui a referência visível do ativo, inclusive durante a prévia; imagens ocultas e de outro pavimento não ampliam esse enquadramento. Não gera composição, quantitativos, diagnóstico construtivo ou atração às linhas da imagem. Não aparece em Fiada nem como referência de outro pavimento. BL-01, imagens como objetos do projeto, permanece fora deste recorte.

**Acesso e apresentação compacta:** seção “Imagem de referência” em Propriedades do pavimento. Sem imagem, oferecer Adicionar imagem. Com imagem, mostrar controles curtos de visibilidade e Opacidade, ação Ajustar e acesso compacto a Substituir/Remover; revelar campos de ajuste apenas durante a operação. Não acrescentar uma barra permanente de ferramentas nem um painel grande sobre o canvas. Usar ícones do catálogo central com nomes acessíveis/dicas e textos breves, mantendo foco, legibilidade e área de clique conforme a [Interface e iconografia](arquitetura/Interface-e-Iconografia.md#iconografia). Orientações da etapa ativa ficam na faixa operacional do canvas; explicações gerais em Como usar o editor. Compactação não pode esconder erros, unidade ou ações Concluir/Cancelar.

**Inclusão e escala:** aceitar PNG/JPEG locais. Exibir a imagem enquadrada como prévia, ainda sem escala real confirmada. Orientar “Marque dois pontos” de uma distância conhecida: primeiro clique fixa o início e segundo fixa o fim, sem botão pressionado, com marcação e prévia. Os pontos são livres sobre a imagem, sem atração à malha/geometria. Informar a distância real em cm, positiva e finita; pontos coincidentes não permitem calibrar. Ajustar a escala uniformemente, preservando a proporção: por exemplo, dois pontos que representam 400 cm devem ficar separados por 400 cm no desenho. Não criar elemento Medida nem alterar as medidas existentes. Exigir calibração válida antes de Concluir a inclusão. Recomendar trecho longo e identificável na ajuda. Depois de calibrar, permitir posicionar e rotacionar a prévia antes de concluir.

**Ajuste e proteção do desenho:** posição livre, sem encaixe modular obrigatório. Arrastar a imagem apenas dentro de Ajustar; fora dessa operação, a referência não captura seleção ou arraste das ferramentas. Campo de ângulo com prévia para rotação e ação Definir escala novamente. Na recalibração, o primeiro ponto marcado fica fixo no mundo enquanto o restante da imagem muda proporcionalmente. Zoom e navegação não alteram a escala calibrada nem confirmam a operação. Não permitir deformação independente por eixo. Inclusão, ajuste, recalibração e substituição usam Concluir/Cancelar; prévias não salvam nem geram histórico. Concluir sem mudanças apenas encerra o ajuste, sem histórico. Durante a prévia, a imagem oculta pode ser mostrada temporariamente para edição; confirmar/cancelar conserva a escolha de visibilidade. Cancelar ou trocar de ferramenta, modo ou pavimento descarta a operação pendente e preserva a referência confirmada. Durante o ajuste, impedir alterações concorrentes do desenho.

**Opacidade e visibilidade:** imagem inicialmente visível, com opacidade 40%, ajustável de 0 a 100%. Mostrar imagem oculta/reexibe sem perder conteúdo, posição, escala ou rotação; opacidade zero não remove a imagem. Esses controles pertencem à referência do pavimento e são salvos no projeto, sem nova preferência global de rótulos. Alterações são imediatas fora da prévia e desfazíveis; um arraste do controle de opacidade constitui uma única operação, sem gravar cada passo intermediário.

**Substituição, remoção e integridade:** Substituir exige escolher, calibrar e posicionar a nova imagem; preservar a anterior até Concluir com candidato válido. Cancelamento, arquivo inválido ou falha de leitura não alteram a referência anterior. Remover retira somente a referência e pode ser desfeito. Imagem e ajustes são incorporados ao salvamento remoto e ao .ecovit, sem depender do arquivo original no computador, rede ou serviço externo. Duplicar projeto/pavimento preserva imagem e ajustes com edição independente; remover pavimento remove sua referência e desfazer restaura. Operações apenas na imagem não chamam o motor nem invalidam composição/quantitativos existentes. Somente leitura permite visualizar/navegar, sem alterar a referência.

**Limites:** até 10 MiB (10 × 1024² bytes) por imagem e 16 megapixels (16.000.000 pixels decodificados), ambos inclusivos. Recusar conteúdo inválido ou excessivo com mensagem curta e causa, preservando o projeto e a imagem anterior. Conferir também o limite total vigente de 50 MiB do .ecovit, incluindo a codificação da imagem; não prometer que quatro imagens no limite individual cabem no arquivo. Sem redução silenciosa de resolução ou qualidade. A calibração uniforme não corrige perspectiva ou deformações de fotos/digitalizações. Fora do escopo estão PDF, outros formatos, recorte, tratamento de imagem, correção de perspectiva, múltiplas imagens no mesmo pavimento, reconhecimento/vetorização ou desenho automático. Contratos implementados na [Medidas e imagens](arquitetura/Medidas-e-Imagens.md#imagem-de-referência).


### RF-17 — Mobiliários

**Biblioteca e inserção:** ferramenta Mobiliários em Planta abre catálogo integrado ao Ecovit com categorias, miniaturas, nomes e busca. O núcleo contém 59 opções nas nove categorias da tabela do [catálogo](arquitetura/Medidas-e-Imagens.md#opções-do-catálogo), incluindo Sofá em L, Escrivaninha, Cadeira de escritório, Berço, Banheira, Churrasqueira, Bicicleta e Aparador. Escolher um item apresenta prévia junto ao cursor; clicar no canvas confirma uma ocorrência no pavimento ativo. Após confirmar, selecionar a ocorrência e retornar a Selecionar. Escape cancela. Abrir, buscar ou fechar o catálogo não altera o projeto. O acervo é distribuído com o aplicativo, sem exigir upload ou consulta a serviço externo de imagens durante a edição.

**Categoria Arquitetura:** onze elementos em vista superior e estilo neutro: cinco escadas (reta, U, U assimétrica, L e U com três lances), caminho de placas, caminho de blocos intertravados, bloco de concreto para contenção, rampa reta, floreira e banco de concreto. Cada escada representa exatamente 16 pisos de degrau; patamares não entram nessa contagem. São imagens ilustrativas com dimensões genéricas editáveis, sem cálculo de altura de espelho, conexão automática entre pavimentos, dimensionamento de contenção ou efeito na composição/quantitativos. A seta indica o percurso a partir do ponto inicial. O bloco de contenção usa vista ortogonal plana de cima, com contorno retangular, dois vazados e preenchimento uniforme, sem perspectiva ou faces laterais.

**Edição:** selecionar, mover livremente, girar, redimensionar, duplicar e excluir ocorrências. Propriedades apresentam nome, largura, profundidade e rotação, sem campos X/Y; posição é ajustada por arraste. A alça de rotação atrai múltiplos de 45° (0°, 45°, 90°, 135°, 180°, 225°, 270° e 315°), com tolerância angular de 5° e continuidade em 360°/0°. Fora dessa faixa o giro é livre, e o campo numérico permite qualquer ângulo válido; dimensões em cm, positivas e finitas. Nos campos numéricos, alterar largura ou profundidade recalcula a outra, conservando a proporção atual da ocorrência. Manter quatro alças circulares nos cantos, que preservam a proporção atual. Adicionar exatamente duas alças quadradas nos pontos médios: inferior, oposta ao controle de giro, ajusta só profundidade; direita ajusta só largura. As posições acompanham os eixos locais do objeto girado. Cada alça quadrada mantém a aresta oposta fixa e permite aumentar ou diminuir a dimensão sem cruzá-la; a outra dimensão e o ângulo não mudam. A imagem pode ser deformada por eixo, sem alterar os bytes da arte. Itens padrão têm dimensões iniciais sugeridas e editáveis, identificadas como referências genéricas; não representam medidas verificadas de um produto comercial. Upload exige definir uma dimensão em cm antes de confirmar a inclusão, usando a proporção da imagem para a outra. Não exigir calibração por dois pontos como no M8, modulação dos tijolos ou vínculo com paredes. Prévia e cancelamento não gravam; cada gesto ou alteração confirmada gera uma operação de histórico. Somente leitura permite consultar, sem inserir ou editar.

**Espelhamento:** nas propriedades do mobiliário selecionado, oferecer os controles alternáveis Espelhar horizontalmente e Espelhar verticalmente. Espelhar horizontalmente/verticalmente, duplicar e excluir aparecem em uma linha compacta somente com ícones, nomes acessíveis e dicas; Aplicar imagem conserva seu texto. Cada clique liga/desliga uma orientação e produz uma operação de histórico com salvamento automático; o estado ativo fica visível e acessível. Inverter a arte nos eixos do próprio objeto, antes da rotação, conservando posição do centro, dimensões e ângulo. Funciona para padrões de todas as categorias e imagens personalizadas, inclusive giradas ou deformadas; não altera a fonte nem seus bytes. Desfazer/refazer, duplicação, cópias, reabertura e transporte preservam o estado. Somente leitura/processamento bloqueiam os controles. Não se aplica à imagem de referência do pavimento nem modifica composição ou quantitativos.

**Qualidade no zoom:** gerar versões em resoluções diferentes da mesma imagem sob demanda, apenas em memória, e selecionar conforme tamanho efetivo na tela e densidade do monitor. Compartilhar entre ocorrências da mesma fonte e descartar quando deixam de ser exibidas. Preservar transparência, enquadramento, dimensões, rotação e deformação; usar a original quando a aproximação exigir. Não incorporar versões reduzidas ao projeto nem ao .ecovit. A preferência de qualidade alta segue RF-14 e não afeta a imagem de referência de M8. A redução suaviza detalhes finos, sem garantir a leitura de detalhes menores que um pixel.

**Padrão visual:** vista superior ortogonal, contornos finos, cores suaves e detalhes discretos de materiais. A vegetação usa folhagem simplificada. As imagens têm fundo transparente e as miniaturas usam as mesmas artes. Dimensões e proporções são ilustrativas e constam do catálogo.

**Apresentação e limites:** ocorrências aparecem somente em Planta do pavimento ativo, acima das lajes e abaixo dos traços técnicos de paredes, vãos e medidas, sem impedir a seleção de elementos sobrepostos. Enquadrar considera sua extensão rotacionada, inclusive em pavimento sem paredes. Não aparecem em Fiada nem na comparação de outro pavimento. Nome é consultável no catálogo/propriedades, sem novo rótulo permanente sobre o canvas. Imagens são representações visuais independentes: não geram peças, quantitativos, atração geométrica ou diagnósticos construtivos; não modificam a composição nem disparam seu recálculo. Equipamentos não têm instalação ou altura física modelada.

**Upload e persistência:** aceitar PNG/JPEG personalizados, com validação de conteúdo e limites antes de confirmar. PNG é recomendado para transparência; JPEG mantém o fundo original. Reutilizar a mesma imagem personalizada em várias ocorrências no projeto. Salvar os bytes personalizados em recursos privados do servidor e incorporá-los uma única vez ao `.ecovit`, mantendo referências nas ocorrências. Imagens padrão ficam somente referenciadas pelo catálogo, sem bytes ou miniaturas incorporados ao documento remoto ou arquivo exportado. Reabrir depende de uma distribuição do Ecovit que contenha os itens/revisões referenciados. Ausência de recurso padrão deve ser explicada antes de substituir o trabalho aberto, sem troca silenciosa da arte. Preservar posição, dimensões, rotação e nomes em salvamento, reabertura, importação e cópia de projeto/pavimento; remover pavimento remove suas ocorrências, com restauração por histórico. O limite total de arquivo continua em 50 MiB.

**Limites:** edição/recorte de arte, remoção de fundo, agrupamentos, ordenação manual de camadas, biblioteca personalizada global, 3D, geração de imagens por IA dentro do aplicativo, projetos de instalações e verificação de colisão/circulação. A imagem de referência por pavimento e seu fluxo de calibração seguem RF-16.

### RF-18 — Terreno

Em Planta, desenhar o perímetro por cliques em pontos livres, sem restrição ortogonal ou modular. Enquanto o cursor se move, mostrar o segmento entre o último ponto fixado e o próximo ponto, com comprimento euclidiano nas unidades de medida do editor. Clicar no primeiro ponto fecha o polígono e cria o terreno, desde que haja pelo menos três vértices distintos, área não nula e contorno simples sem cruzamentos, sobreposições ou contatos entre arestas não adjacentes. Aceitar concavidade. Antes de fechar, o desenho é apenas uma prévia cancelável.

Durante a criação, atrair a direção do segmento a múltiplos de 45° com tolerância inclusiva de 5°, a partir do último ponto confirmado e em relação aos eixos da Planta. Preservar a distância ao cursor, limitada pela precisão de coordenadas do editor. Fora dessa tolerância, o ponto é livre. Alt pressionado suspende a atração, inclusive sem mover o mouse; soltar restaura a prévia alinhada. Enquanto houver atração ativa, exibir o ângulo junto da medida do segmento. Prévia e clique usam o mesmo critério. O primeiro ponto não tem atração angular; a proximidade ao primeiro vértice para fechar o polígono tem prioridade e permanece disponível com Alt. Essa assistência aplica-se à criação, sem alterar o ajuste dos vértices existentes ou impor regra construtiva.

Oferecer grama, terra, areia, brita, piso intertravado e Verde suave. Verde suave é preenchimento liso e opaco em verde muito claro (#eef3e8), próximo do fundo do canvas, sem granulação ou padrão de textura, mantendo o contorno vigente e a malha acima. É uma aparência visual, sem representar material construtivo específico. Nos cinco materiais texturizados, preencher a região com material de escala visual consistente no espaço do projeto, por repetição contínua ou composição equivalente recortada pelo contorno. Aumentar o terreno deve aumentar a cobertura da textura, sem esticar uma imagem única. Evitar costuras visíveis e padrões grosseiros que comprometam a aparência natural.

Desenhar o terreno abaixo da imagem de referência de RF-16 e manter a ordem dos demais elementos. A referência conserva sua opacidade: uma imagem opaca pode encobrir o terreno. Garantir acesso às propriedades mesmo sob outros elementos. Selecionar não habilita deslocamento acidental; nas propriedades, Ajustar habilita mover o terreno inteiro ou arrastar seus vértices existentes, com prévia e medidas das arestas afetadas. Edição inválida não substitui o contorno confirmado. A textura acompanha a translação e conserva escala ao mudar a forma. Mover o terreno não move os demais elementos.

**Rosa dos ventos opcional:** em Propriedades do terreno, oferecer somente Mostrar rosa dos ventos, inicialmente desligada. Quando ligada, desenhar uma rosa vetorial com N/L/S/O na Planta, acima dos demais elementos e compartilhada entre pavimentos. Na ferramenta Selecionar, arrastar o corpo para posicionar livremente, os cantos para alterar o tamanho proporcionalmente em torno do centro e a alça externa para girar livremente. Não incluir campos numéricos de posição, tamanho ou giro nas propriedades. Ocultar/reexibir conserva os ajustes; excluir o terreno remove a rosa, restaurável por desfazer. A rosa tem seleção própria; Delete nessa seleção apenas a oculta. Sua posição não acompanha o movimento do terreno. Mudanças integram histórico e arquivo, sem efeito no motor, malha, eixos da Planta ou direção de atração angular. É orientação gráfica definida pelo usuário, sem georreferenciamento ou determinação automática de norte real. Sem rosa em Fiada ou duplicação na referência de outro pavimento.

**Organização:** um terreno por projeto, visível na Planta de todos os pavimentos, com um material único e grama inicial. Troca/duplicação/remoção de pavimento não duplica nem remove o terreno. Não mostrar em Fiada nem duplicar na comparação de pavimentos. Incluir o contorno no enquadramento. Exibir o rótulo “Terreno · <área> m²”, com área plana calculada pelo polígono, independente do sentido do desenho e com duas casas decimais em português. Atualizar o rótulo nas prévias válidas e nas edições confirmadas; mantê-lo legível no zoom. As propriedades também mostram a área. Quando habilitado em Preferências, posicionar o rótulo centralizado horizontalmente acima do limite superior do terreno, inclusive em contornos côncavos, com afastamento visual constante no zoom. Não posicioná-lo no centro do interior. O rótulo é uma informação visual, sem volume ou quantitativo construtivo.

Criação, material, edição e exclusão integram histórico, salvamento remoto, cópia de projeto e arquivo `.ecovit`; cada gesto confirmado corresponde a uma operação. Prévia/cancelamento não gravam. Não modificar composição, diagnósticos ou quantitativos construtivos nem disparar o motor. Somente leitura permite consulta. Arquivos já suportados sem terreno continuam abrindo, conforme [Persistência e compatibilidade](arquitetura/Persistencia-e-Compatibilidade.md#formato-e-leitores-vigentes).

Recorte plano e visual, sem topografia, terraplenagem, georreferenciamento, recuos legais ou validação estrutural. Sem furos, curvas, múltiplas regiões/materiais, upload de textura ou inclusão/remoção de vértices após criar o terreno. É possível ajustar a posição dos vértices existentes.

## M12 — Contas e persistência remota

O acesso é por conta e os projetos ficam no servidor. A situação da homologação está na [task de verificação em produção](tasks/T-001-Homologacao-Funcional-Producao.md).

### RF-19 — Conta e acesso por código de e-mail

A tela de entrada apresenta a identidade do Ecovit e uma imagem editorial de arquitetura em tijolo ecológico. Em telas largas, a imagem acompanha o formulário lado a lado. Em telas estreitas, a imagem ocupa uma faixa compacta acima do formulário. A entrada por e-mail e código, o aviso sobre projetos da versão anterior e o link de versão permanecem acessíveis nos dois formatos.

Acesso gratuito pela internet, com conta obrigatória para criar, editar, importar e acessar projetos remotos. Entrada exclusivamente por código enviado ao e-mail na aplicação pública; primeira confirmação válida cria a conta e entradas posteriores recuperam a mesma identidade. Em desenvolvimento local, o administrador pode configurar um e-mail fixo para abrir a lista diretamente, usando a conta correspondente no banco da instância. Sem senha própria, Google ou vinculação de métodos nesta entrega. Mostrar endereço da conta e permitir Sair. Erro de envio, código inválido/expirado/usado e excesso de tentativas têm mensagem e recuperação próprias, sem criar conta parcialmente. Envio aceito pelo servidor de e-mail não garante entrega na caixa; orientar pasta de spam e reenvio limitado.

Cada conta acessa somente seus projetos e imagens, mesmo que alguém conheça o identificador ou endereço de um recurso de outro usuário. Gratuidade não torna os projetos públicos. Sem organizações, compartilhamento ou transferência de propriedade. Não há edição offline nem modo de criação local. Preferências e câmera podem continuar no navegador, sem sincronização entre dispositivos.

Sessão expirada durante uso conserva trabalho em memória, suspende gravação e oferece reentrada por código na própria página. Mesma conta retoma somente após conferência do salvamento/revisão; outra conta não recebe o trabalho anterior. Fechar ou recarregar a página pode perder alterações ainda não salvas, mesmo com aviso. Saída/troca de conta com trabalho não salvo exige escolha explícita, sem descarte silencioso. Formatos de endereço e parâmetros de código/sessão seguem [Autenticação e acesso](arquitetura/Autenticacao-e-Acesso.md); entrada fora do formato suportado é informada antes de enviar código.

### Salvamento remoto e recuperação de falhas

Servidor é a fonte persistente dos projetos; acesso em outro navegador autenticado recupera o último salvamento confirmado. Editor/cálculo continuam no navegador. Lista, criação, nome, duplicação e arquivos conservam os comportamentos aplicáveis; duplicação produz projeto independente do último salvo, sem copiar memória de outra sessão.

Salvar automaticamente uma alteração confirmada, sem persistir movimentos de prévia. Distinguir Salvo, Salvando, Confirmação pendente, Não salvo e Conflito; estado de cálculo é separado. Salvo significa intenção e imagens confirmadas pelo servidor, sem afirmar sucesso do cálculo. Ao reabrir, reconstruir o cálculo em memória; falha conserva intenção salva e informa resultado indisponível/desatualizado. Sem garantia nova de tempo de geração.

Conexão/servidor indisponível mantém candidato em memória e bloqueia novas alterações; oferece recuperação e download .ecovit com o conteúdo disponível, sem limpar trabalho. Timeout, erro 5xx ou resposta incompleta podem ocorrer após gravação: verificar a operação antes de concluir falha ou repeti-la. Outra sessão que salvou antes provoca conflito; não sobrescrever nem mesclar automaticamente. Oferecer baixar a versão em memória ou abrir a remota mediante descarte explícito. Descartar tentativa rejeitada restaura também o histórico e recursos anteriores, sem reapresentar a alteração recusada por Refazer. Abrir a versão remota após conflito inicia histórico da revisão carregada.

Cotas iniciais por conta: 20 projetos e 500 MiB de imagens privadas, configuráveis; imagens do catálogo não consomem essa cota. Preservar os limites estruturais e de arquivo/imagem vigentes por projeto. Ao atingir limite, informar motivo e meios de liberar espaço, mantendo leitura/download/exclusão; não apagar projetos automaticamente. Contabilização de lixeira e retenção de recursos conforme D07 e contrato de persistência.

Projetos de instalações que armazenavam dados no navegador só podem ser transferidos por exportação .ecovit na instalação de origem e importação manual na conta. A recuperação depende de um arquivo em formato suportado. Registros IndexedDB permanecem no armazenamento de origem.

Importar cria novo projeto privado na conta identificada, mantendo geometria, imagens, escolhas e ajustes dos formatos suportados. Não modifica arquivo original nem substitui projeto por coincidência de ID. Falha recusa o arquivo inteiro e preserva remotos anteriores. Repetição técnica da mesma requisição não duplica; nova importação explícita pode criar outra cópia. .ecovit continua autossuficiente para imagens personalizadas, sem credenciais ou dependência de caminhos privados do servidor.

Detalhes técnicos pertencem a Persistência e Estado; representação remota não muda regras construtivas ou formatos suportados por si só.

### RF-20 — Lixeira e exclusão da própria conta

Remover projeto envia à lixeira privada, separada da lista ativa. Exibir prazo, permitir restaurar ou excluir definitivamente com confirmação; impedir edição e gravação por sessões antigas. Restaurar preserva intenção e imagens; exclusão definitiva e expiração impedem restauração pelo aplicativo. Retenção de 30 dias; projetos e imagens da lixeira continuam contando nas cotas até eliminação, conforme D07 definido pelo solicitante.

Área de conta permite solicitar exclusão de todos os dados ativos, inclusive lixeira, sem intervenção do administrador no fluxo normal. Conforme D08 definido pelo solicitante, exigir novo código de e-mail exclusivo para a ação e confirmação explícita; revogar todas as sessões e encerrar acesso imediatamente, eliminar dados ativos em até 24 h, sem recuperação. Não há período de recuperação; antes da confirmação, oferecer oportunidade de baixar projetos. Sair não exclui a conta; baixar não confirma exclusão.

Lixeira e exclusão ativa pertencem ao Ecovit. Política de backup do servidor fica integralmente com o administrador, fora da especificação do produto; não prometer recuperação, frequência, retenção ou eliminação de cópias externas pelo aplicativo.

Não há painel de administração, lixeira de elementos individuais ou compartilhamento nesta entrega.

## 7. Modelo de domínio e diretrizes de implementação

| Entidade | Responsabilidade |
|---|---|
| Projeto | Metadados, unidades, origem modular e tamanho-base definido na criação |
| Catálogo derivado | Peças e procedimentos de modificação gerados a partir do tijolo-base |
| Encontro | Paredes participantes, composição definida na primeira fiada e limite superior |
| Laje | Pavimento, contorno, aberturas e espessura; cotas das faces derivadas |
| Pavimento | Cota única, altura padrão para novas paredes e elementos arquitetônicos (M4.1 implementado; lajes em M4.2) |
| Parede | Geometria de referência, espessura, altura e conexões |
| Vão | Relação com parede e limites horizontais/verticais |
| Elemento estrutural representado | Grauteamentos, vigas de canaletas, cintas, vergas e contravergas |
| Fiada | Índice, cotas e peças geradas |
| Instância de peça | Tipo, posição, orientação, vínculo com a região de parede e com o ajuste construtivo que originou a peça, quando houver |
| Diagnóstico | Regra violada, gravidade, localização e estado de resolução |
| Resultado gerado | Estado do projeto usado nos desenhos e quantitativos |

Haverá apenas um canvas, ocupando a maior parte da tela, onde o usuário fará o desenho, alteração ou exclusão de elementos. Quantitativos abrirão em tela separada.
Usar unidades internas precisas e tolerância documentada; a representação numérica escolhida não poderá acumular erros a cada fiada. O modelo registra coordenadas verticais e orientação, independentes do renderizador.

A stack e as decisões de implementação estão propostas no documento complementar [Arquitetura Técnica do Ecovit](Ecovit-Arquitetura-Tecnica.md). O PRD mantém os requisitos de produto como referência.

## 8. Requisitos não funcionais

### Versão e histórico de tasks

Exibir no rodapé do login, da lista de projetos e do editor o texto fixo “Versão do João: ” seguido de um link discreto contendo somente o identificador da versão da compilação. Usar a data do commit no fuso de São Paulo em `yyyyddmm`, um hífen e os sete primeiros caracteres do SHA. O link abre o histórico público das tasks de implementação verificadas e datadas na revisão exibida. Mostrar ID, título e data de execução em `DD/MM/AAAA`, da mais recente para a mais antiga, com desempate pelo ID numérico decrescente. Aceite manual pendente não exclui uma implementação verificada. Informar quando não houver tasks elegíveis. Ao retornar ao editor, conservar o projeto e o estado de trabalho, inclusive alterações ainda em memória.

### Apresentação da página inicial

A página inicial reúne criação, abertura de projetos locais e carregamento de arquivos `.ecovit`, com introdução breve e ações visíveis em telas de notebook. Cabeçalho e conteúdo compartilham alinhamento; os cartões usam espaçamentos regulares, nomes com quebra de linha e metadados legíveis. A rolagem pertence à página, sem painel interno rolável. Em larguras menores, a composição passa para uma coluna.

A identidade visual usa verde profundo, verde oliva e fundo areia, com fonte de sistema para controles e detalhe serifado no título inicial, sem depender de fontes remotas. A lista vazia explica onde aparecerão os projetos, e a orientação de backup permanece visível após os cartões. Essa adaptação da página inicial não altera o foco do editor em computadores com mouse e teclado.

### Iconografia consistente

Ações e indicadores da interface usam um único catálogo amplo, com traços uniformes, aparência refinada, contraste legível e alinhamento central. Mesma ação conserva símbolo e significado em todo o aplicativo. Ícones complementam rótulos; controles sem texto têm nome acessível e dica visual. Não misturar emoji ou caracteres de fonte com ícones de ação/status. Logotipo e desenhos técnicos do canvas preservam sua identidade e significado. Biblioteca, variantes, exceções e verificações são definidos na [Interface e iconografia](arquitetura/Interface-e-Iconografia.md#iconografia). A interface usa Lucide React.

### Interface centrada no canvas

Retas conectadas e cantos devem seguir a continuidade do percurso. Orientação igual para todos os cantos de uma fiada não é requisito. Inteiros ocupam o canto conforme a paridade do trecho; meios não devem ser introduzidos no interior para atender orientação imposta. As duas fases devem alternar cada canto e cobrir exatamente a geometria. Meios necessários nas extremidades permanecem permitidos. A definição nominal e o tratamento específico dos T estão em CT-05.

Paredes com pontas livres e contornos abertos, inclusive U, são estados normais do projeto e não exigem fechamento de recintos para compor fiadas. A composição deve atender aos padrões nominais documentados no caderno técnico, incluindo U aberto com T compatíveis. Ausência de padrão implementado é limitação do motor, não prova de erro no desenho. Permanecem as verificações de malha, alturas, cobertura e conflitos entre peças.

O canvas de desenho será o foco da interface e ocupará a maior parte da área disponível. Barras de ferramentas, seletores, controles e indicadores deverão ser discretos e compactos, preservando espaço para desenhar.

Propriedades serão apresentadas de forma contextual ao selecionar um elemento, em painel compacto recolhível ou controle próximo à seleção. Painéis auxiliares não deverão permanecer abertos sem necessidade. A interface evitará grandes blocos de texto e painéis fixos que reduzam a área útil do desenho.

Informações adicionais e explicações serão acessíveis ao clicar em ícones informativos. Esses controles terão identificação acessível e poderão ser acionados por teclado. A apresentação de uma explicação poderá ser fechada facilmente para retomar o desenho.

### Organização dos controles e interação comum

No cabeçalho do projeto aberto, o retorno à lista fica à esquerda, após o logotipo e antes do nome/configurações: seta à esquerda e texto Projetos, com a mesma aparência padrão de Quantitativos e dica de retorno à lista. Preservar bloqueio durante processamento/importação e confirmação ao sair com falha de salvamento. Quantitativos mantém ícone, texto e apresentação existentes. Carregar arquivo e Baixar projeto ficam à direita, sempre visíveis e somente com ícones, sem contorno/fundo em repouso, com realce discreto no hover, foco visível por teclado, nomes acessíveis e dicas indicando `.ecovit`. A tela inicial mantém Carregar .ecovit com texto; essa compactação pertence ao cabeçalho do editor.

O editor usa cabeçalho de 48 px, seguido de faixa compacta com ferramentas, Planta/Fiada e controles de fiada. Em larguras menores, a faixa pode quebrar sem ocultar ações. Propriedades e inspeção usam painel estreito recolhível; a legenda inicia recolhida e pode ser aberta. O rodapé compacto reúne térreo, módulo, referência externa e contagem de paredes; a situação da composição fica concentrada no canvas conforme a seção abaixo. O canvas ocupa o espaço principal, preservando a identidade verde do Ecovit. Ferramentas e parâmetros da interface correspondem ao alcance implementado.

### Status e orientações do canvas

Concentrar o estado do processamento em um único local no canto inferior esquerdo do canvas, ocupando o espaço da orientação fixa de seleção. Retirar o status junto de Planta/Fiada e sua duplicação no rodapé; manter os demais controles e informações dessas áreas.

Exibir, por prioridade: “Processando…” durante processamento; “Resultado desatualizado” quando não houver resultado atual; “Atualizado · com pendências” para resultado atual com diagnósticos de erro; “Composição nominal atualizada” para resultado atual sem erros. O último texto substitui “Geometria nominal verificada” sem sugerir comprovação estrutural. Processamento não pode deixar uma mensagem de conclusão antiga visível; falhas, diagnósticos e a ação Recalcular quando cabível continuam acessíveis.

Transferir as instruções gerais de selecionar por clique, mover pelo corpo, redimensionar pelas alças e navegar com botão do meio ou Espaço + arraste para “Como usar o editor”, preservando as demais instruções dessa seção. Remover a orientação fixa “Clique para selecionar…” e o lembrete permanente de navegação do canvas. Manter orientações temporárias necessárias a operações, como desenhar parede ou adicionar/remover graute, além de medidas de prévia, avisos e indicação de somente leitura. Essas informações devem coexistir sem ocultar o status ou os controles de zoom. O status e as orientações operacionais não são rótulos de elementos e não são ocultados pelas preferências do RF-14.

A barra compacta do editor mostrará projeto, salvamento, desfazer/refazer, pavimento e os modos Planta/Fiada. Ferramentas mudarão com o modo: Selecionar, Parede, Porta, Janela, Vão e Laje em Planta; Selecionar, Grauteamento e Encontro em Fiada, com controles das fiadas. Medida também está disponível em Planta conforme RF-15. Funções secundárias ficarão em menu; não incluir botões para 3D ou funcionalidades ainda indisponíveis.

A ferramenta e o modo ativos terão indicação persistente por realce e texto acessível. O cursor, a prévia e uma orientação curta explicarão o gesto em andamento. O canvas vazio oferecerá instrução breve que desaparecerá após o primeiro desenho.

Usar roda do mouse para zoom centrado no cursor; botão do meio pressionado + arraste como gesto principal para deslocar o viewport, mantendo Espaço + botão esquerdo + arraste como alternativa para touchpads e mouses sem botão central, sem modificar elementos; oferecer também controles compactos de ampliar, reduzir e enquadrar projeto. Impedir que gestos de navegação criem ou redimensionem paredes, alterem seleção ou troquem a ferramenta ativa. Ambos funcionam em Planta/Fiada, inclusive somente leitura, respeitando o bloqueio durante processamento. Mostrar mão fechada durante o arraste; um clique central isolado não desloca. Suprimir a rolagem automática/ação auxiliar do navegador apenas no canvas. Acompanhar o deslocamento fora do canvas e encerrar ao soltar o botão que iniciou o gesto, ao perder foco ou ao cancelar. Soltar Espaço encerra apenas o gesto iniciado com Espaço, não o iniciado pelo botão central. Não substituir um desenho/redimensionamento em andamento por navegação; soltar outro botão não confirma nem encerra o gesto original. Escape cancela o gesto ou fechará a edição contextual; ao sair de uma ferramenta, retornará à seleção. Delete excluirá a seleção quando o foco não estiver num campo de texto. Ctrl+Z e Ctrl+Y/Ctrl+Shift+Z desfazem/refazem; cada arraste concluído e suas atualizações automáticas constituem uma única ação.

Selecionar uma ferramenta de desenho permitirá repetir a operação até trocar a ferramenta ou pressionar Escape. Campos numéricos não poderão acionar atalhos do canvas durante digitação. Zoom reduzido poderá simplificar detalhes visuais; a geometria e a edição continuarão com precisão modular. Definir o limiar de detalhe por testes, sem prometer um valor específico nesta etapa.

Erro de inserção terá aviso curto perto do local e manterá o trabalho existente. Mudanças com recalculação mostrarão “Calculando…” antes de iniciar o processamento; não apresentar resultado antigo como concluído. Ícones informativos abrirão explicações sob demanda, incluindo o significado da altura da fiada e o alcance de alterações.

Quantitativos e relatórios abrirão em telas separadas, conforme a diretriz existente. No canvas, manter apenas dados essenciais, como módulo e estado de salvamento. Não adotar valores de altura ou espaçamento de graute vistos nos prints como parâmetros construtivos do Ecovit.

### Critérios de usabilidade

Testar com representantes de arquitetos e autoconstrutores: criar um recinto e um encontro em T, redimensionar parede, inserir janela e editar base/altura, alternar Planta/Fiada, encontrar uma fiada de canaleta, alterar encontro na primeira fiada e salvar/reabrir.

Observar confusão entre modos, ações acidentais, compreensão da modulação, descoberta dos controles e percepção do alcance de ajustes. Antes de concluir a implementação do editor, os dois públicos deverão conseguir completar esses fluxos sem instrução verbal do avaliador. Os prints orientam a separação dos modos e o aproveitamento do canvas; os controles finais serão verificados por esses testes.

**Aceite:** sem seleção, o canvas ocupa a maior parte da área útil; selecionar uma parede ou um vão mostra apenas os controles pertinentes; fechar ou recolher propriedades libera o espaço; explicações extensas só aparecem quando solicitadas. A prévia de arraste, os indicadores dos elementos e os problemas que exigem ação continuam visíveis no desenho.

- **Uso:** desktop primeiro, com mouse e teclado; consulta em telas menores poderá ser posterior. Interface em português e unidades métricas.
- **Orientação:** criação guiada do projeto, explicações em contexto e mensagens compreensíveis para autoconstrutores; entrada numérica e ferramentas de precisão disponíveis para arquitetos.
- **Desempenho proposto:** interação de seleção/zoom fluida fora do cálculo; geração completa em até 5 segundos como referência inicial de observação. O solicitante avaliará a espera aceitável no próprio aplicativo, sem prova técnica prévia. 
- **Referência de carga proposta:** quatro pavimentos, 100 paredes por pavimento, até 50 fiadas por pavimento e 100 mil peças totais, em computador com 8 GB de RAM e navegador desktop atual. Essas são metas de teste, não limites arquitetônicos já demonstrados.
- **Processamento:** uma operação por vez, com aviso de espera e edição temporariamente indisponível. Não exigir progresso percentual ou cancelamento durante o cálculo inicial. Ao terminar ou falhar, liberar os controles.
- **Integridade:** salvamento, exportação e regeneração não poderão misturar revisões.
- **Acessibilidade:** controles e diagnósticos utilizáveis por teclado; cores acompanhadas de símbolos ou texto.
- **Segurança:** tratar arquivos importados como dados; limitar tamanho e validar estrutura; impedir execução de conteúdo importado.
- **Compatibilidade proposta:** Chrome e Edge desktop; outros navegadores serão avaliados antes do lançamento.
- **Evolução:** formato identificado e testes de regressão das funcionalidades preservadas; a compatibilidade segue a matriz de leitores vigente. Sem controle de versões de regras construtivas como funcionalidade do produto.

## 9. Pesquisa e especificação técnica do motor único

O alcance nominal de M3, definido na seção 14, não depende de dimensões internas, apoios ou armaduras para gerar o desenho. As fontes físicas contextualizam os elementos e seus limites; não fornecem parâmetros automáticos universais. Procedimentos de preparação física exigem evidência específica para integrar o produto.

O Ecovit usa um conjunto único de convenções nominais documentadas no caderno técnico, sem seleção de conjuntos de regras pelo usuário, regras versionadas na interface ou fluxo de aprovação técnica. A pesquisa construtiva distingue evidências físicas de convenções do modelo, respeitando o alcance nominal de M3 definido na seção 14. Convenções e exemplos são definidos antes dos algoritmos correspondentes.

### Caderno técnico do motor Ecovit

A pesquisa prioriza manuais técnicos de fabricantes, publicações técnicas de instituições e referências normativas pertinentes, verificando sua aplicabilidade ao tijolo modular de solo-cimento. O caderno registra fontes, localizadores, evidências e contexto de aplicação. Não generalizar uma recomendação específica de fabricante sem avaliar sua compatibilidade com o sistema padrão.

O caderno organiza os seguintes assuntos, identificando o alcance implementado e as lacunas conhecidas:

1. Geometria padrão derivada do tijolo-base, furos, encaixes, canaletas e procedimentos de preparação de peças especiais.
2. Encontros em L, T e cruz, com desenhos da primeira fiada e alternâncias superiores.
3. Continuidade e posições propostas de grauteamentos, incluindo extremidades, encontros e regiões de vãos.
4. Canaletas, vigas, cintas, vergas e contravergas, com critérios de posição, continuidade e apoios.
5. Geometria independente de lajes e pavimentos, edição modular e comparação visual entre andares.
6. Diferenças entre recomendações encontradas, hipóteses adotadas e questões não resolvidas.
7. Tradução das conclusões para decisões objetivas do algoritmo e exemplos de entrada/resultado esperado.

Não inventar valores de espaçamento ou apoios para preencher lacunas. Quando uma indicação depender de cargas ou dimensionamento resistente, registrar essa dependência e definir o limite da proposta geométrica do Ecovit.

### Condições para ampliar o motor

Cada ampliação do motor exige desenhos e casos de teste para os dois tamanhos iniciais e pelo menos uma base personalizada 2:1, critérios para o comportamento automático e lacunas explícitas. A cobertura de M2–M3.5 inclui recintos, encontros, vãos, canaletas e propagação desde a primeira fiada. Lajes e comparação visual entre pavimentos dependem dos exemplos e contratos de M4.

A revisão técnica integra o desenvolvimento, sem exigir cadastro ou aprovação de regras pelos usuários. O caderno orienta implementação e testes; cálculo de cargas, resistência e armaduras está fora do produto.

O caderno técnico define as convenções implementadas e reúne fontes, exemplos e lacunas por assunto. A seção 13 reúne referências de produto; a pesquisa construtiva é detalhada no caderno.

## 10. Cenários mínimos de aceite do produto

| Cenário | Resultado esperado |
|---|---|
| Recinto retangular modular | Todas as fiadas fecham, com encontros consistentes e sem peças duplicadas |
| Encontros em L, T e cruz | Composição automática e alternativa editável |
| Alteração de encontro | Edição somente na primeira fiada; propagação até o limite superior da alvenaria |
| Tentativa de edição em outra fiada | Edição indisponível e orientação para acessar a primeira |
| Desenho e edição por arraste | Prévia modular, parede contínua em Planta e tijolos gerados visíveis em Fiada |
| Encontro em L pela face externa | Faces de referência alinhadas na malha, espessura de um tijolo-base e nenhuma peça duplicada |
| Redimensionar por qualquer extremidade | Extremidade oposta fixa; vãos mantêm posição na planta e incompatibilidades são indicadas |
| Troca Planta/Fiada | Mesmo projeto e enquadramento; ferramentas adequadas a cada modo |
| Cancelar ou desfazer arraste | Sem peça residual; dependências revertidas como uma ação |
| Navegar até fiada de canaletas | Canais e peças geradas representados corretamente |
| Criar laje | Topo na cota do próprio pavimento, espessura para baixo; paredes preservadas, inclusive sob aberturas |
| Definir tamanho-base | Catálogo completo derivado; base única em toda a construção |
| Personalizar dimensões | Proporção comprimento/largura 2:1 validada |
| Gerar elementos estruturais | Grauteamentos e canaletas posicionados automaticamente e ajustáveis |
| Comprimento fora do módulo | Diferença e alternativas mostradas, sem ajuste silencioso |
| Porta, janela e vão por arraste | Prévia modular e indicadores gráficos distintos ao soltar |
| Editar altura e base de vão | Limites de fiadas validados e peças associadas atualizadas |
| Porta e janela na mesma parede | Interrupções, base e elementos especiais nas fiadas corretas |
| Interface centrada no canvas | Controles compactos, propriedades contextuais e explicações por ícone |
| Canaleta atravessando encontro | Continuidade resolvida por regra ou conflito localizado |
| Reserva vertical de reforço | Eixos nominais alinhados nos intervalos de alvenaria aplicáveis, sem comprovação de passagem física |
| Ajustar graute em qualquer fiada | Todas as fiadas do trecho vertical são atualizadas, respeitando vãos |
| Graute na posição de uma janela | Intervalos abaixo/acima separados, sem graute no vazio |
| Incluir ou remover graute | Clique no eixo nominal afeta todos os seus intervalos de alvenaria no pavimento, respeitando aberturas e sem propagar para outro pavimento; movimentação por arraste fora de M3 |
| Quatro pavimentos | Origem comum; cotas distintas, múltiplas da altura-base e ordenadas; fiadas independentes e comparação somente visual |
| Pavimento sem paredes | Fiada exibe estado vazio, sem criar fiada fictícia |
| Duplicar ou remover pavimento | Cópia independente da intenção editável; remoção desfazível preserva os demais e impede excluir o último |
| Abrir arquivo de formato incompatível | Incompatibilidade informada; o arquivo de origem e o trabalho corrente são preservados |
| Mudança após ajuste construtivo | Ajustes compatíveis preservados; incompatíveis pendentes com opção de corrigir ou descartar |
| Salvar, reabrir e regenerar | Composição e ajustes preservados |
| Baixar e carregar arquivo nativo | Geometria, ajustes, composição e pendências preservados |
| Consultar quantitativos | Peças finais por tipo, fiada e pavimento fecham com o total do projeto, sem duplicação nos encontros ou nas canaletas compartilhadas |
| Informar perdas opcionais | Geométrico, acréscimo e total estimado separados; arredondamento por tipo no total do projeto; consulta não modifica o desenho ou o arquivo |
| Consultar com pendências ou sem resultado | Resultado atual incompleto identificado como parcial; cálculo ausente/desatualizado não apresenta números antigos como atuais |
| Duplicar projeto salvo | Projeto independente do último salvo. A lista só anuncia a cópia após confirmação; uma resposta perdida é conciliada pelo mesmo identificador. |
| Falha no cálculo | Modelo salvo como rascunho, controles liberados e quantitativos antigos indisponíveis |
| Falha no salvamento remoto | Candidato mantido em memória e disponível para download com os dados acessíveis na sessão |
| Alterar pavimentos sucessivamente | Uma operação por vez, com projeto inteiro recalculado sem perder alterações de outro pavimento |
| Composição fora dos procedimentos documentados | Diagnóstico “Sem solução automática”, sem peça especial inventada |
| Criar projeto | Térreo aberto com propriedades editáveis, sem cadastro obrigatório de outros pavimentos |
| Reabrir em outro navegador | A mesma conta recupera o último salvamento confirmado pelo servidor. Importar um .ecovit compatível cria um projeto independente. |

Os cenários incluem operações bem-sucedidas, recusas e recuperação de falhas. A [estratégia de verificação](arquitetura/Qualidade-e-Desempenho.md#estratégia-de-verificação) separa testes automatizados de aceite manual.

## 11. Riscos e tratamento previsto

| Risco | Tratamento |
|---|---|
| Geometria real diferente do sistema padrão | Documentar hipóteses da derivação e modificações necessárias |
| Soluções locais incompatíveis | Resolver a rede de paredes conectadas e verificar fechamento global |
| Misturar desenho estrutural e cálculo | Limites explícitos no produto e parâmetros informados por responsável |
| Perder ajustes ao regenerar | Preservação dos ajustes de encontros, graute e canaletas, desfazer e indicação de incompatibilidades |
| Quantitativo divergente do desenho | Estado gerado comum para desenho e consulta de quantitativos |
| Geometria fora do escopo | Paredes ortogonais e uma família ativa por projeto |
| Desempenho insuficiente | Observar a espera no próprio aplicativo após cada implementação e otimizar apenas quando necessário |

## 13. Referências e limites da pesquisa

As referências são páginas públicas. Não há avaliação prática do editor Tijocad, de seus algoritmos ou dos resultados construtivos gerados.

- [TijoCAD — site oficial](https://www.tijocad.com.br/): anuncia editor web, modulação de paredes/vãos e visualização de fiadas, além de recursos 3D. Serve como referência de experiência e categoria de produto; não é fonte de regras técnicas para o Ecovit.
- [Tijolo Ponto Eco — Manual de Projeto com Tijolo Ecológico](https://tijolo.eco.br/manual_projeto_tijolo_ecologico/): apresenta, para seu exemplo de tijolo 30 × 15 × 7 cm, modulação de 15 cm; descreve a primeira fiada com posicionamento de elementos e recomenda projeto estrutural. A medida citada é específica desse exemplo, não requisito universal do Ecovit.
- [Permaq — Tijolos](https://permaq.com.br/maquina/tijolos): a descrição pública localizada na pesquisa menciona diferentes tamanhos e tipos, incluindo meios e canaletas. Sem leitura integral ou desenho cotado confirmado, não fundamenta dimensões do catálogo.

Os requisitos deste PRD distinguem o alcance implementado do previsto. A pesquisa pública não valida padrões executivos de encontros, detalhamento de armaduras ou viabilidade de edificações com quatro pavimentos.

## 14. Vãos, canaletas e grautes nominais

Configurações e ajustes de vãos, canaletas e grautes usam a cota única do pavimento como referência vertical.

Tela “Configurações do projeto”, acessível por botão somente com ícone ao lado do nome editável do projeto no cabeçalho, com nome acessível e dica por mouse/teclado, sem ocupar a barra de desenho. O acesso preserva a renomeação em andamento e abre em um único clique. Tela compacta, com grupos Vãos, Canaletas e Graute vertical; não há abas de armaduras, grampos ou idioma. Aplicar confirma uma única operação de histórico e recálculo; Cancelar não modifica nada. Restaurar padrões atua no grupo e só efetiva ao aplicar; não apaga ajustes manuais existentes.

A apresentação dispõe os três grupos lado a lado em telas de computador, com campos/padrões visíveis sem rolagem nos tamanhos comuns. Explicações longas ficam nos ícones “i”, acessíveis por clique e teclado; altura resultante e fiadas permanecem visíveis. Aplicar e Cancelar ficam em rodapé sempre acessível. Listas extensas de canaletas podem rolar dentro do grupo; telas pequenas/baixas permitem rolagem do conteúdo, sem esconder ações ou limitar a quantidade de níveis. Sem alterar valores, regras, ajustes ou formato do projeto.

Restaurar padrões de configuração é diferente de restaurar ajustes automáticos: a primeira ação preserva inclusões/exclusões e supressões; a segunda remove explicitamente o ajuste escolhido para permitir novamente a automação.

| Grupo | Campos e comportamento |
|---|---|
| Vãos | Base padrão de janela/vão elevado e topo padrão dos vãos, em relação ao piso; porta inicia na base zero. Altura é topo menos base, sempre visível. Os valores inicializam novas inserções, não redimensionam vãos existentes. |
| Canaletas | Lista de alturas em cm referidas ao piso, interpretadas como topo da fiada de canaleta; mostrar número da fiada. Adicionar/remover nível e restaurar padrões. Alterar níveis regenera as faixas globais existentes. |
| Graute vertical | Quatro opções independentes: encontros, laterais dos vãos, pontas livres e intervalos em paredes longas. Distância máxima positiva utilizada na distribuição por intervalos. Desabilitar uma categoria remove seus automáticos, preservando inclusões manuais. |

### Padrões nominais

Esta tabela é a referência dos valores iniciais para novos projetos. Os efeitos de Aplicar, Cancelar e Restaurar e os campos configuráveis estão definidos acima; a inicialização de projetos legados está na [Motor e diagnósticos](arquitetura/Motor-e-Diagnosticos.md#canaletas-e-grautes).

| Parâmetro | Valor inicial | Efeito |
|---|---|---|
| Base de porta | 0 cm | Inicializa novas portas, sujeita à modulação e ao início da alvenaria |
| Base de janela/vão elevado | 112 cm | Inicializa novas janelas e vãos elevados |
| Topo de aberturas | 217 cm | Inicializa novas aberturas; com as bases padrão, alturas de porta 217 cm e janela/vão elevado 105 cm |
| Topos dos níveis globais de canaleta | 112 e 224 cm | Solicita faixas nas cotas referidas ao piso, respeitando parede e vãos |
| Categorias de graute | Quatro habilitadas | Ativa encontros, laterais dos vãos, pontas livres e intervalos em paredes longas |
| Distância máxima de graute | 100 cm | Orienta a distribuição automática por malha antes dos ajustes manuais |

São padrões configuráveis de desenho. Outra altura-base ou início de alvenaria exige alternativas explícitas para valores incompatíveis, sem arredondamento oculto. Configurações de vãos não alteram aberturas existentes; níveis/categorias/distância recalculam a proposta existente, preservando ajustes. Não incorporar armaduras ou grampos. A correspondência numérica com fiadas está em EX-31 e nos exemplos adicionais do caderno.

Vãos mantêm posição/largura modulares e limites verticais em fiadas; editar parede conserva sua posição mundial e sinaliza o que não couber. Preservar paginação do M2 e gerar meio nominal apenas na nova borda quando um par for interrompido. Sem recorte parcial de altura ou preparação física de peça.

**Separação de vãos (D3-02):** proibir sobreposição de volumes de aberturas. Na mesma parede, vãos lado a lado cujos intervalos verticais se sobrepõem exigem separação horizontal mínima de um módulo (largura-base); contato sem essa separação não é permitido e aberturas não são unidas automaticamente. Permitir vãos empilhados, com projeções horizontais parcial ou totalmente coincidentes, desde que haja pelo menos uma fiada completa de alvenaria entre eles. Essa fiada pode atender simultaneamente à canaleta superior do vão inferior e à inferior do vão superior; unificar as regiões coincidentes, sem duplicar peças nem exigir duas fiadas distintas. São limites de desenho nominal, sem validação estrutural. A separação vertical é validada desde M3.1, com canaletas geradas em M3.2; ajustes voluntários de canaleta continuam permitidos e não alteram a regra de separação dos vãos.

Na Planta, permitir escolher entre vãos empilhados na mesma posição por seletor contextual, identificando tipo, base e topo; na Fiada, mostrar somente as aberturas que atingem a altura ativa.

Em Planta, arrastar sobre parede fixa define início/fim modular do vão. Prévia mostra posição, largura e base/topo dos padrões do projeto. Selecionar permite editar campos, arrastar corpo na mesma parede ou ambas as alças com ponta oposta fixa. Não reatribuir vão a outra parede implicitamente. Escape, perda de foco e soltura fora cancelam; navegação central/Espaço não altera elementos. Porta/janela/vão têm símbolos distintos, além da cor; folha/sentido de abertura não são inferidos. Excluir parede informa o alcance e remove seus dependentes na mesma operação desfazível.

Um vão selecionado na Planta pode ser excluído por ação contextual ou pela tecla Delete, quando o foco não estiver em um campo de edição. A exclusão remove somente o vão e suas dependências, preservando a parede e as demais aberturas. O aplicativo recalcula a alvenaria. Excluir, desfazer e refazer constituem operações de histórico; desfazer restaura o mesmo ID, posição, dimensões e relações do vão.

Canaleta imediatamente acima do vão tem sua base no topo da abertura; canaleta inferior tem seu topo na base da abertura. A regra vale para porta elevada também. Se não houver alvenaria inferior/superior, não criar peça fora da parede. Faixas globais atravessam toda parede, excluindo células dos vãos; uma faixa coincidente com outra automática produz uma única ocupação. Não exigir colunas de apoio nem pesquisa de cotas físicas para gerar esse desenho nominal.

**Alcance das faixas:** canaleta associada a vão ocupa sua largura mais meio tijolo de cada lado, ou seja, um módulo horizontal por lado. Remover canaleta afeta toda a faixa da parede selecionada naquela fiada, incluindo trechos separados por aberturas e todas as origens automáticas coincidentes. Outras fiadas são preservadas. Não é exclusão de tijolo individual. A extensão lateral é uma convenção nominal de desenho escolhida pelo usuário, não apoio dimensionado.

Grautes ocupam eixos nominais e todos os intervalos de alvenaria correspondentes no pavimento, sem atravessar o vazio. Só furos da fiada ativa recebem clique/hover; camada de referência não é editável. Furo vazio: + e “Adicionar graute”; preenchido escuro: − e “Remover graute”. Fora da ferramenta contextual de graute, clique mantém seleção normal. Remover um automático grava exclusão persistente; adicionar novamente desfaz essa exclusão. Não recalcular preenchimento intermediário para contornar a intenção do usuário. Ao recalcular uma alteração exclusiva de grautes, manter a composição anterior visível em Fiada e os controles de fiada presentes, bloqueados durante o processamento, com indicação de recálculo no indicador inferior do canvas, sem alterar o espaço da barra de ferramentas. Substituir o desenho pelo novo resultado completo. Se o cálculo falhar, identificar o desenho anterior como desatualizado e impedir edição construtiva sobre ele; a intenção salva permanece íntegra.

Canaletas são visíveis apenas em Fiada, desenhadas com canal longitudinal e distinção de inteiro/meio nominal; não se infere corte executado ou dimensão física de cavidades. Selecionar faixa na fiada oferece Remover e realça o alcance inteiro antes da ação. A célula volta a tijolo comum da mesma paginação; remover canaleta não abre buraco na alvenaria. Supressão vale também quando várias origens automáticas exigem a mesma faixa.

Ajustes autorizados neste recorte: incluir/remover grautes e remover/restaurar canaletas; configurar níveis globais. Movimento livre de elementos, apoios, aço, grampos, dimensionamento e verificações físicas ficam fora. Retirar um elemento não representa erro estrutural nem demanda reposição compulsória. Diagnósticos cobrem somente integridade, modulação, ocupação e ajustes sem alvo geométrico. Desenhos são o objetivo atual; quantitativos permanecem previstos para evolução futura, sem volumes de graute inferidos de furos sem dimensões.

CT-09/10 e exemplos do [caderno, seção 8](Ecovit-Caderno-Tecnico.md) definem as convenções nominais; as fontes não constituem parâmetros estruturais do aplicativo. Na migração para M3.2, níveis globais iniciam vazios e sua ativação exige configuração explícita; as faixas locais de vãos existentes seguem CT-09 automaticamente. Na migração para M3.3, categorias automáticas de graute iniciam desligadas, ativadas explicitamente por configuração; níveis/supressões existentes são preservados. Canaletas e controles de graute aparecem somente na Fiada.

As fórmulas, limites geométricos, paginação e exemplos são definidos em CT-07–10 do caderno; representação persistente, identidade dos ajustes e processamento estão na [Motor e diagnósticos](arquitetura/Motor-e-Diagnosticos.md#canaletas-e-grautes).

## 15. Edição no canvas

### Continuidade e união ao desenhar ou mover

Com Parede ativa, desenhar para fora a partir da extremidade de uma parede compatível prolonga essa parede. Desenhar o intervalo entre duas paredes existentes contíguas ao novo trecho, colineares e compatíveis, consolida a cadeia em uma única parede. Vale nas duas direções de desenho, em horizontal ou vertical. A prévia deve realçar as paredes participantes e mostrar o comprimento total resultante antes de soltar. Uma parede perpendicular ligada à cadeia permanece independente.

Compatibilidade exige mesmo pavimento, mesma linha da face de referência, mesma faixa ocupada pela espessura e mesma altura solicitada. Não considerar só o eixo visual: referências/lados que produzam faixas diferentes não se unem. O trecho novo de continuidade herda a altura da parede tocada; se tocar duas com alturas diferentes, não escolher uma altura silenciosamente. A prévia informa a incompatibilidade e que os elementos permanecerão separados; confirmar cria somente o trecho novo com suas propriedades visíveis, sem alterar as paredes incompatíveis. Sobreposição longitudinal de comprimento positivo não é tratada como continuidade neste recorte: mantém o tratamento de conflito geométrico existente, sem recurso genérico de apagar sobreposições.

A união exige contato efetivo na malha, não mera proximidade. Não preencher distâncias que não foram desenhadas ou ocupadas pela parede movida. Aplicar à cadeia alcançada pelo gesto, incluindo paredes já contíguas aos seus extremos; não consolidar todo o projeto ao abrir, importar ou recalcular. Mover uma parede para uma ponta ou intervalo entre paredes colineares compatíveis também desencadeia união automática. A prévia realça toda a cadeia e mostra a geometria consolidada antes da soltura. Neste incremento, redimensionar pelas alças/campo continua sem união automática.

Sem outra parede atingida, a extensão mantém o ID da parede existente. Na união de várias existentes, conservar o ID da participante cuja extremidade de menor coordenada estiver mais próxima do início geométrico da cadeia; empate por ID. A regra independe do sentido de arraste e da ordem de armazenamento. Remapear referências para esse ID, preservando IDs de vãos e ajustes. Vãos conservam posição mundial, dimensões e cotas; recalcular apenas sua distância à nova origem longitudinal. Supressões conservam os trechos originais conforme decisão D34-01. Grautes manuais conservam coordenadas mundiais e suas associações remapeadas; proposta automática é recalculada para a parede consolidada, podendo mudar sua distribuição.

Uma união é uma operação de histórico: desfazer restaura todas as paredes originais, seus IDs, vãos e ajustes; refazer restaura a mesma consolidação. Intenções de encontros são reconciliadas com a nova topologia, sem fabricar solução para casos não suportados nem apagar ajustes incompatíveis silenciosamente.

Extensão de uma única parede conserva suas supressões de parede inteira, que continuam abrangendo a extensão conforme M3.2. Converter para trechos herdados somente quando duas ou mais paredes existentes forem consolidadas. Se o novo desenho tocar diretamente paredes com alturas distintas, não unir parcialmente com apenas uma delas: manter o novo trecho independente com a altura padrão do pavimento explicitamente mostrada na prévia. Propagação pela cadeia para ao alcançar participante incompatível; não atravessá-la para unir outra parede. Depois da união, vãos antes pertencentes a paredes distintas podem apresentar conflito de separação: conservar todos, diagnosticar e permitir correção, sem apagar ou reposicionar.

### Movimento de parede

Em Planta e Selecionar, pressionar o corpo da parede e arrastar desloca somente essa parede. Um clique sem deslocamento seleciona; iniciar em vão ou alça conserva a edição própria desse elemento. Botão central e Espaço continuam exclusivos para navegação. Havendo alvos sobrepostos, resolver primeiro a parede pelo seletor contextual; não mover arbitrariamente um dos elementos.

Movimento é translação horizontal/vertical combinada na malha, sem rotação ou alteração de comprimento, altura ou lado de espessura. Preservar o deslocamento entre ponto de pega e parede; mostrar a faixa proposta e seus vãos antes de soltar. A prévia não altera dados, não salva e não calcula o projeto inteiro. Escape, perda de foco ou soltura fora do canvas cancelam. Deslocamento modular zero não registra histórico. Durante processamento/somente leitura não permitir edição.

Calcular o delta modular a partir do deslocamento desde o ponto de pega, sem encaixar novamente esse ponto à face da parede e provocar salto inicial. Alças da parede selecionada continuam prioritárias, inclusive com Parede ativa. Para desenhar a partir dessa ponta em vez de redimensionar, limpar a seleção primeiro. Em movimento, não reorientar a parede pelo deslocamento predominante do mouse.

Vãos, inclusive pendentes, acompanham a mesma translação e mantêm IDs, posição relativa na parede, base e altura. Supressões acompanham a parede; suas cotas não mudam. Ajustes manuais exclusivos de graute acompanham o deslocamento com ID mantido. Ajustes compartilhados seguem D34-02. Não transportar peças geradas: encontros, canaletas e grautes automáticos são recalculados após confirmar. Paredes vizinhas e seus vãos não se movem; ajustes de encontro deixam de se aplicar se a associação perder validade e devem permanecer localizáveis para revisão/descarte, conforme RF-10.

Conexões no novo local são determinadas pela geometria modular. Sobreposição ou encontro sem composição suportada preserva a nova intenção arquitetônica com diagnóstico, conforme a política existente; não empurrar vizinhas, girar, recortar ou deslocar novamente para corrigir o conflito. Uma operação de desfazer recupera a parede e todas as dependências, incluindo cópias de ajustes compartilhados.

Ao encontrar continuidade compatível no destino, primeiro transladar a parede e seus dependentes; depois consolidar a cadeia pela mesma regra de identidade usada no desenho. Sem união, o ID da parede movida permanece; com união, prevalece o ID sobrevivente da cadeia e a seleção aponta para ele. Vãos da parede movida conservam a posição mundial atingida no destino, com offset recalculado na consolidada; vãos das demais paredes conservam a posição mundial anterior. Supressões da parede movida acompanham o delta antes de congelar o trecho herdado; supressões das vizinhas conservam seus trechos. Desdobrar graute compartilhado antes de remapear associações para a consolidada. Movimento e união confirmam em uma única operação, sem salvar ou gerar um estado intermediário. Desfazer restaura inclusive a posição anterior ao movimento e todas as paredes separadas.

### Destaque do módulo de início

Com Parede, Porta, Janela ou Vão ativos na Planta, o ponto ativo do cursor (centro da cruz) seleciona a célula que o contém. Mostrar preenchimento cinza discreto com contorno nesse quadrado de lado igual à largura-base, sem arredondar a posição para o vértice mais próximo. Seleção e início usam a mesma conversão tela/projeto e identificação de célula. Não confundir com seleção ou prévia de comprimento. Para aberturas, projetar o ponto na parede hospedeira; apenas uma posição inicial elegível recebe destaque. Onde houver múltiplas hospedeiras, resolver o alvo contextual antes de indicar um início confirmado. Não afirmar que o tamanho final do vão será válido antes do arraste.

O destaque acompanha zoom e câmera e permanece dentro da faixa hospedeira para aberturas. Em desenho de parede, destacar a célula sob a cruz; a prévia de arraste resolve orientação, borda inicial e face de referência conforme o lado da espessura. Não interceptar eventos. Ocultar fora do canvas, durante navegação, em outra ferramenta/modo, somente leitura ou processamento. Hover não grava, calcula nem cria histórico; cancelamento não deixa destaque preso.

A célula inicial inteira deve pertencer ao elemento criado, independentemente do sentido do arraste. A direção determina qual borda longitudinal da célula é usada como início; o fim continua modular. Para paredes, o lado da espessura determina a face que mantém a faixa dentro da célula escolhida. Na extremidade final da parede, abertura pode iniciar arraste no sentido inverso: destacar a última célula interior. Havendo várias hospedeiras, clicar apresenta a escolha contextual e não inicia o arraste ambíguo; após escolher, novo arraste usa a hospedeira escolhida. O destaque é recalculado ao mudar ferramenta, câmera, alvo ou estado, mesmo sem novo movimento do mouse.

### Orientação dos rótulos de aberturas

Portas, janelas e vãos verticais exibem o rótulo à esquerda, com leitura de baixo para cima, ancorado na extremidade inferior visual do elemento, independentemente do sentido do desenho. Elementos horizontais mantêm o rótulo acima. O rótulo informa tipo, base e topo em cm e acompanha prévia, movimento e redimensionamento, com afastamento visual constante. Em conflito entre rótulos, afastar o vertical para a esquerda e o horizontal para cima, mantendo a âncora longitudinal.

### Preservação de ajustes

- **D34-01 — Supressão ao unir:** preservar somente os trechos das paredes originais; não suprimir o novo intervalo de ligação nem ampliar para outra parede anteriormente não suprimida. Ajustes existentes mantêm IDs. Novas remoções pela Fiada continuam abrangendo a parede consolidada inteira. A interface deve distinguir supressão de trecho herdado da supressão da parede inteira e permitir restaurar cada ajuste identificado; não é edição de tijolo individual.
- **D34-02 — Graute compartilhado ao mover:** preservar o ajuste nas associações das paredes que ficam e criar uma cópia com novo ID, coordenada transladada e associação à parede movida. Vale para inclusão e exclusão. Se o ajuste pertencer somente à parede movida, transladar o original sem cópia. Não mover o eixo da parede vizinha. Reconciliação de eixos coincidentes segue a precedência de exclusão de CT-10, sem perda dos registros de intenção.

Se ajustes preservados coincidirem no mesmo eixo, qualquer exclusão aplicável prevalece sobre inclusões, independentemente da ordem dos registros. Adicionar/remover pelo furo define a ação explicitamente em todos os ajustes aplicáveis daquele eixo, conservando IDs e associações; não apagar ajustes pendentes na mesma coordenada. Descartar um ajuste continua agindo apenas pelo seu ID. Supressões de canaleta também são restauradas pelo ID escolhido; não restaurar todos os trechos da mesma parede/cota implicitamente.

As regras geométricas e exemplos estão em CT-11/EX-36–48 do caderno; dados/migração na [Elementos construtivos](arquitetura/Elementos-Construtivos.md#paredes-e-dependentes). Sem nova regra resistente, divisão/rotação de paredes, edição de tijolos, lajes, pavimentos ou quantitativos.

## 16. Composição nominal de encontros em cruz

Uma cruz ortogonal com quatro ramos de alvenaria deve receber composição automática conforme CT-12, sem exigir que o usuário altere medidas, separe paredes ou transforme o cruzamento em dois T. Resolver o componente conectado inteiro, incluindo contorno externo e divisórias; uma cruz suportada não pode apagar as peças desse conjunto. Não basta mostrar apenas uma cruz isolada resolvida. Modelagem nominal não comprova ligação resistente entre paredes.

A convenção geométrica de CT-12 usa uma faixa principal contínua horizontal na fase A e vertical na B, com os dois ramos transversais terminando na face de contato. A célula central é ocupada uma vez. Manter pareamento de células, alternância global e limites geométricos documentados; não desenhar peça em L/cruz nem alterar faces, espessuras ou comprimentos. Não apresentar a troca de direção como amarração estrutural comprovada. Alternativa na primeira fiada inverte a fase do componente inteiro, com prévia/confirmar/cancelar; sem escolhas independentes que disputem a mesma ocupação.

Integrar vãos, canaletas e grautes pelos contratos existentes após compor a alvenaria. Vãos não podem invadir a célula compartilhada do encontro nas alturas em que as paredes coexistem; um vão acima de uma parede encerrada não invade o encontro inferior. Preservar edição indireta incompatível com diagnóstico. Canaletas coincidentes e eixo de graute do cruzamento não duplicam por parede/origem. Ajustes, movimento/união de paredes, histórico e transporte permanecem aplicáveis. Classificar a geometria existente em cada fiada, preservando fase quando a cruz se tornar reta após terminar uma das paredes.

Para conflito real de ocupação, alturas sem padrão, escolha pendente ou combinação de encontros incompatível, manter diagnóstico localizável e componente afetado sem composição; outros componentes continuam visíveis. Não usar o simples reconhecimento de cruz como erro. Informar a consequência: “Composição suspensa em N paredes conectadas: [motivo]”, destacando encontro e paredes afetadas. A compatibilidade de resultados salvos segue a matriz de formatos suportados.

CT-12/EX-51–55 define a geometria e os exemplos. [Motor e diagnósticos](arquitetura/Motor-e-Diagnosticos.md#pipeline-de-células-e-encontros) define o processamento. A composição da cruz é nominal e não dimensiona aço, peças especiais ou ligações.
