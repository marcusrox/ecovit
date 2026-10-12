# Ecovit — Documento de requisitos do produto (PRD)

**Versão:** 0.8 — edição, processamento e salvamento simplificados  
**Data:** 10 de outubro de 2026  
**Status:** decisões de escopo confirmadas; documento atualizado para revisão final antes dos marcos e tarefas  
**Plataforma:** aplicação web, inicialmente com interface e documentação em português brasileiro.

## 1. Visão do produto

O Ecovit será uma aplicação web para projetar plantas baixas de construções com tijolos ecológicos de solo-cimento. Seu diferencial será transformar a intenção arquitetônica em uma distribuição verificável das peças de cada fiada, respeitando a modulação do sistema escolhido, os encontros entre paredes, os vãos e os elementos em canaletas.

A primeira versão será inteiramente 2D, mas representará a construção em três coordenadas e por fiadas, permitindo projetar toda a altura das paredes e até três pavimentos. Não haverá visualização 3D inicial. O modelo de dados deverá permitir adicioná-la futuramente sem reconstruir os projetos existentes.

O produto apoiará o planejamento e a documentação construtiva. Compatibilidade modular, geração de fiadas e ausência de colisões não significam comprovação da capacidade estrutural da construção.

## 2. Requisitos e decisões confirmados

### Requisitos confirmados pelo solicitante

- Nome do aplicativo: **Ecovit**.
- Aplicação web especializada em tijolos ecológicos de solo-cimento.
- Referência de produto: Tijocad.
- Trabalho inicial em 2D, com planejamento de todas as fiadas.
- Atenção prioritária às dimensões predefinidas e à modulação dos tijolos.
- Representação de elementos estruturais com tijolos canaletas.
- Geração automática de encontros de paredes segundo práticas construtivas adequadas.
- Suporte a até três pavimentos.
- Dois tamanhos iniciais de tijolo (comprimento × largura × altura): 25 × 12,5 × 7 cm e 30 × 15 × 7 cm, além de dimensões configuráveis pelo usuário.
- Público principal: arquitetos e autoconstrutores.
- Validação deste PRD antes da criação de marcos e tarefas de desenvolvimento incremental.

### Escopo confirmado

- Paredes exclusivamente horizontais e verticais.
- Um único tamanho-base para toda a construção, definido no início do projeto.
- Dimensões personalizadas com comprimento igual ao dobro da largura; altura configurável.
- Até três pavimentos no total: térreo e dois superiores.
- Automação de composição e posicionamento estrutural, sem cálculos de cargas, resistência ou armaduras.
- Encontros editáveis somente na primeira fiada do pavimento, com efeito em toda a altura correspondente até o limite superior da alvenaria definido no RF-13.
- Salvamento no navegador e arquivo nativo para baixar e carregar, sem login.
- Formato nativo preparado para armazenamento futuro em banco de dados.
- Única exportação inicial: arquivo nativo para reabrir o projeto.
- Pesquisa e documentação construtiva como etapa técnica anterior à implementação dos algoritmos do motor.

## 3. Problema e objetivos

### Público e experiência de uso

O produto atenderá arquitetos e autoconstrutores. Arquitetos precisarão de precisão, edição numérica e documentação. Autoconstrutores precisarão de uma jornada guiada, explicações dos termos e diagnósticos que indiquem o problema e as alternativas disponíveis.

A mesma base de projeto atenderá os dois públicos. O editor deverá explicar conceitos como módulo, fiada, vão bruto e canaleta em contexto, sem exigir conhecimento de CAD para iniciar. Orientações de uso não serão apresentadas como aprovação técnica da construção.

Desenhar paredes como linhas ou retângulos não resolve a distribuição dos tijolos. Uma planta aparentemente correta pode produzir peças sobrepostas nos encontros, cortes não previstos, furos desalinhados, canaletas interrompidas e aberturas incompatíveis com as fiadas.

O Ecovit deverá:

1. Facilitar a criação de plantas compatíveis com o catálogo derivado do tijolo-base.
2. Gerar a posição de cada peça em todas as fiadas de cada pavimento.
3. Resolver automaticamente os encontros, permitindo alterar a composição e propagar a amarração.
4. Evidenciar situações sem solução e evitar correções silenciosas da geometria.
5. Posicionar automaticamente grauteamentos e elementos em canaletas, com ajustes pelo usuário.
6. Produzir desenhos e quantitativos consistentes com o projeto salvo.

### Indicadores propostos

- Todo projeto marcado como geometricamente válido terá zero colisões e zero regiões de parede sem solução de peças.
- A regeneração preservará as escolhas de encontros e ajustes compatíveis do usuário.
- Quantitativos exibidos corresponderão às peças geradas no estado atual do projeto.
- Um usuário do público escolhido deverá conseguir criar uma planta simples, inserir vãos, gerar fiadas e localizar uma incompatibilidade sem assistência. O tempo-alvo será definido em teste de usabilidade.

## 4. Escopo da primeira versão validável

### Incluído

- Criar, nomear, salvar, reabrir e duplicar projetos.
- Definir o tamanho-base do tijolo e receber automaticamente o catálogo padrão suportado derivado dele.
- Editor 2D com paredes ortogonais, cotas, portas e janelas.
- Até três pavimentos no total (térreo + dois superiores), com níveis e alturas independentes.
- Geração e inspeção de todas as fiadas, inclusive fiadas especiais.
- Encontros em L, T e cruz definidos automaticamente e ajustáveis pelo usuário, com propagação da amarração nas fiadas acima até o limite superior da alvenaria definido no RF-13.
- Canaletas, cintas, vergas e contravergas como elementos posicionados automaticamente e que podem ser ajustados pelo usuário.
- Grauteamentos e vigas de canaletas propostos automaticamente conforme as boas práticas internas do Ecovit.
- Lajes de piso ou cobertura com contorno e espessura definidos pelo usuário.
- Reservas verticais para reforços/graute e verificação do alinhamento dos furos.
- Ajustes contextuais de encontros, grauteamentos e canaletas, sem edição ou bloqueio de tijolos individuais.
- Diagnósticos e quantitativos para consulta no aplicativo; download e carregamento do arquivo nativo.

### Fora do escopo inicial

- Visualização 3D, renderização e geração de imagens por IA.
- Dimensionamento estrutural, cálculo de fundações, cargas ou armaduras.
- Projetos completos de instalações elétricas e hidráulicas.
- Paredes curvas, diagonais e composição de diferentes famílias na mesma parede.
- Dimensionamento resistente e detalhamento de armaduras de escadas, lajes e coberturas; a representação geométrica das lajes está incluída.
- Colaboração simultânea, marketplace, pagamentos e gestão de obras.
- Exportações PDF, SVG e CSV; importação/exportação CAD ou BIM, incluindo DWG, DXF e IFC. Podem ser acrescentadas posteriormente.
- Aprovação automática por normas ou legislação municipal.

O limite de três pavimentos é uma capacidade de modelagem do aplicativo. A viabilidade de uma edificação concreta dependerá de projeto e análise técnica próprios.

## 5. Jornada principal

1. Criar o projeto e escolher ou informar o tamanho-base do tijolo; o Ecovit gera o catálogo automaticamente.
2. Abrir diretamente o térreo, criado com propriedades iniciais visíveis e editáveis; adicionar outros pavimentos somente quando necessário.
3. No modo Planta, desenhar paredes na malha modular e inserir vãos.
4. Consultar incompatibilidades e aceitar, quando desejado, sugestões de ajuste.
5. Alternar para Fiada e navegar pela distribuição gerada, inspecionando encontros, peças, furos e canaletas.
6. Criar lajes, definir suas espessuras e revisar canaletas, cintas, elementos sobre e sob vãos e grauteamentos posicionados automaticamente.
7. Aguardar o recálculo automático após cada alteração confirmada e resolver apenas as incompatibilidades indicadas.
8. Revisar todos os pavimentos e os alinhamentos entre eles.
9. Conferir o salvamento automático no navegador ou baixar o documento atual para backup e reabertura.

## 6. Requisitos funcionais

### RF-01 — Catálogo automático a partir do tijolo-base

O usuário escolherá **25 × 12,5 × 7 cm**, **30 × 15 × 7 cm** ou informará comprimento, largura e altura personalizados. Essa definição permitirá gerar o catálogo padrão suportado: tijolo inteiro, meio tijolo, canaleta, meia canaleta e somente as peças especiais com procedimentos de preparação documentados no caderno técnico.

O meio tijolo terá metade do comprimento-base, mantendo largura e altura. As demais variantes serão derivadas por procedimentos internos de composição e modificação. Peças especiais terão representação da preparação necessária, como corte ou abertura, e identificação nos desenhos e quantitativos.

O módulo mínimo horizontal será sempre o meio tijolo: 12,5 cm e 15 cm nos dois tamanhos iniciais, respectivamente. Não será necessário cadastrar fabricante, peças, furos, encaixes ou conjuntos de regras para habilitar a automação. O Ecovit adotará uma geometria padrão derivada das dimensões-base, com hipóteses documentadas.

O catálogo representa essa hipótese geométrica, sem garantir correspondência com qualquer peça comercial. A proporção 2:1 não garante solução para toda composição. Cada procedimento de corte ou abertura terá limites de aplicação documentados. Quando não houver composição suportada, apresentar “Sem solução automática” na região afetada; não inventar uma peça especial para preencher a lacuna. Isso também se aplica às dimensões personalizadas.

Dimensões personalizadas terão comprimento igual ao dobro da largura, garantindo meio tijolo quadrado em planta. A altura será configurável. Medidas deverão ser positivas; o formulário validará a proporção 2:1 e mostrará como corrigir valores incompatíveis antes de criar o projeto. O tamanho-base será definido no início e aplicado a todos os pavimentos; não haverá mistura de tamanhos na construção.

**Aceite:** selecionar ou informar um tamanho-base compatível gera o catálogo padrão suportado e o grid sem cadastro adicional. A criação valida comprimento igual ao dobro da largura; todos os pavimentos usam a mesma base. Peças modificadas na obra são identificadas separadamente.

### RF-02 — Editor de planta baixa: modo Planta

O editor terá um único canvas e dois modos principais: **Planta** e **Fiada**. Ambos representam o mesmo projeto; a troca de modo não duplica nem converte dados.

No modo Planta, o usuário cria e altera a arquitetura: paredes, portas, janelas, vãos e lajes. Paredes aparecem como faixas contínuas com contorno e espessura, sobre o grid de meio tijolo. A modulação das peças é calculada ao concluir cada desenho, mas a visualização padrão da Planta não mostra furos nem a divisão de cada tijolo; essa distribuição será inspecionada no modo Fiada.

Cada parede reta terá identificador próprio e poderá ser criada, selecionada, excluída e redimensionada a partir de qualquer uma das duas extremidades. Não haverá ferramentas de mover ou dividir paredes nesta versão. A seleção mostrará realce, comprimento modular e propriedades compactas.

A referência de desenho e encaixe será sempre a **face externa**, com espessura igual à largura do tijolo-base. A prévia mostrará a face de referência e o lado ocupado pela espessura, permitindo inverter esse lado antes de confirmar. Em paredes internas, “face externa” identifica a face adotada como referência, sem exigir detecção de recintos. Essa face permanecerá estável ao editar a parede. Encontros em L alinharão as faces externas no canto; o motor resolverá a região compartilhada sem duplicar peças. Cotas externas serão a referência principal; cotas internas poderão ser consultadas sem alterar o encaixe.

**Desenho de paredes:** ativar Parede, pressionar o botão esquerdo no ponto inicial e arrastar. A direção será horizontal ou vertical conforme o deslocamento predominante. Uma prévia mostrará a faixa, extremidades, comprimento efetivo e encaixe no grid. Ao soltar, confirmar a parede modular, gerar as peças e atualizar os encontros. Um arraste sem comprimento mínimo de um módulo não criará parede. Escape antes de soltar cancelará o gesto sem alterar o projeto.

**Conexões:** a proximidade de outra parede mostrará um alvo de conexão. Soltar sobre esse alvo alinhará a geometria e gerará o encontro. A tolerância visual acompanhará o zoom; uma conexão só será confirmada na posição modular indicada. As paredes participantes manterão seus identificadores; o motor evitará duplicar peças compartilhadas. Soltar no meio de uma parede poderá criar encontro em T.

**Redimensionamento:** selecionar a parede e arrastar qualquer uma das duas extremidades, mantendo a extremidade oposta fixa e a orientação da parede. Mostrar prévia e comprimento durante o gesto; ao soltar, atualizar o trecho e suas dependências. Também permitir informar o comprimento, indicando qual extremidade será alterada. Vãos existentes manterão sua posição na planta; os que deixarem de caber serão sinalizados, sem exclusão ou deslocamento silencioso. Redimensionar uma parede não moverá automaticamente as demais; encontros serão recalculados pela nova geometria.

**Seleção:** com a ferramenta Selecionar ativa, clicar seleciona um elemento e clicar em área vazia limpa a seleção. O realce de passagem do mouse será distinto da seleção. Controles do elemento terão prioridade sobre o desenho de uma nova parede. Paredes sobrepostas ou próximas permitirão escolher o elemento por um seletor contextual compacto.

**Aceite:** desenhar, selecionar e redimensionar mantém a malha; conexões são antecipadas visualmente; a planta fica legível sem os detalhes de tijolos; abrir Fiada apresenta a distribuição gerada para a mesma geometria.

### RF-03 — Modulação obrigatória de meio tijolo

Grid, desenho de paredes, portas, janelas e demais vãos usarão sempre o módulo mínimo de meio tijolo. Posições e comprimentos horizontais serão ajustados a essa malha, com origem comum entre pavimentos.

As extremidades da face externa de referência serão encaixadas na malha. A posição de um vão será medida ao longo dessa face, a partir da extremidade de menor coordenada da parede; a largura será a do vão bruto. Alterar essa extremidade recalculará a distância de referência, preservando a posição do vão na planta.

Durante o arraste, o usuário verá a medida modular que será efetivada. Medidas digitadas incompatíveis mostrarão alternativas antes da confirmação. Não haverá modo de desenho livre fora da malha na primeira versão.

A modulação vertical considerará altura-base, passo de assentamento e fiadas. Alturas de parede, peitoris e vãos serão compatibilizadas com as fiadas, mostrando diferenças para a altura solicitada.

O motor verificará o fechamento das paredes conectadas, usando inteiros, meios, canaletas e especiais derivados. Modificações necessárias na obra serão permitidas e identificadas.

**Aceite:** paredes e vãos horizontais são confirmados apenas na malha de meio tijolo; cotas correspondem ao desenho gerado; recintos fecham sem colisões ou lacunas indevidas.

### RF-04 — Modo Fiada: inspeção e ajustes construtivos

O modo Fiada exibe a distribuição real de peças da fiada selecionada, com contornos individuais, furos, orientação e tipos. Inteiro, meio tijolo, canaleta, meia canaleta e peça especial deverão ser distinguíveis por representação geométrica, símbolos e cores. A legenda será compacta e recolhível.

Um controle mostrará **Fiada atual / total**, com anterior, próxima e escolha direta pelo número. Mostrar também o intervalo de altura em relação ao piso, usando o passo vertical efetivo. Nos extremos, anterior/próxima ficará indisponível. Quando paredes tiverem alturas diferentes, cada trecho deixará de apresentar peças ao atingir seu término, sem prolongamento artificial.

Ao mudar de fiada, manter pavimento, zoom e posição do canvas. Ao trocar de pavimento, recuperar sua última fiada válida. Ao entrar em Fiada pela primeira vez, iniciar na primeira fiada; visitas seguintes recuperarão a última seleção válida. Se a altura mudar e a fiada anterior deixar de existir, selecionar a última válida e informar a mudança.

Será possível sobrepor a fiada anterior ou seguinte com transparência, apenas como referência visual. Essa camada não receberá cliques de edição. Vãos deverão aparecer somente onde a faixa vertical da fiada interceptar a abertura. Nas fiadas de canaletas, mostrar os canais, conexões e peças modificadas realmente gerados, incluindo cintas, vergas e contravergas.

O modo Fiada permitirá ajustar grauteamentos e encontros, e selecionar elementos em canaletas para ajustes previstos no RF-07. Criar ou alterar a geometria arquitetônica de paredes e vãos será feito em Planta; em Fiada, a seleção poderá oferecer ação compacta “Editar na Planta”, preservando a localização.

**Grauteamento:** uma ferramenta contextual permitirá selecionar posições de furos, adicionar ou remover graute e mover um graute existente para posição compatível. Cada ajuste afetará todo o trecho vertical do pavimento, desde a referência de início da alvenaria até seu limite superior definido no RF-13, independentemente da fiada usada para iniciar a edição. A prévia mostrará o destino, os limites verticais e as interrupções antes de confirmar. Portas, janelas e demais vãos serão respeitados: não haverá graute no espaço vazio de uma abertura. O motor dividirá o trecho em intervalos de alvenaria aplicáveis e atualizará todas as fiadas correspondentes. Uma retomada acima de um vão será representada como intervalo separado, sem indicar continuidade física através da abertura. Posições sem passagem compatível na alvenaria serão sinalizadas, sem criação de continuidade fictícia. O ajuste não atravessará automaticamente a laje para outro pavimento.

**Encontros:** selecionar o encontro realça sua região e oferece alternativas gráficas. A edição estará disponível somente na primeira fiada, conforme RF-05. Em outra fiada, mostrar “Altere o encontro na primeira fiada” com ação para navegar até ela. A alternativa terá prévia antes de confirmar; a confirmação propagará a amarração até o limite superior da alvenaria e atualizará as peças e elementos relacionados.

O resultado deverá distinguir sugestão automática de ajuste manual por indicador discreto visível ao selecionar o elemento. Não haverá troca de regras, edição de código ou parâmetros técnicos do motor na interface.

**Aceite:** navegar apresenta todas as fiadas reais; canaletas aparecem nas alturas geradas; grautes são distinguíveis de furos vazios; encontro não pode ser editado acima da primeira fiada; mudar o modo preserva o projeto e o enquadramento; referências sobrepostas não são editáveis.

### RF-05 — Encontros automáticos e editáveis

**Recorte aprovado para M2:** L alternado e T com parede principal contínua e ramal encostado, conforme [caderno técnico](Ecovit-Caderno-Tecnico.md). O T indica necessidade de ligação complementar, sem dimensioná-la. A cruz será reconhecida e diagnosticada, mas sua composição automática fica fora do primeiro M2. O objetivo completo abaixo permanece para evolução; essa exclusão não implica implementação automática em E3.

O Ecovit reconhecerá encontros em L, T e cruz e definirá automaticamente a melhor composição com base em um conjunto único e interno de boas práticas. Considerará amarração, fechamento das paredes, continuidade de furos/canaletas e peças especiais preparadas na obra.

O usuário poderá selecionar cada encontro, visualizar alternativas e alterar sua forma de composição. Não haverá seleção de conjuntos de regras, identificação de regras por encontro ou controle de versões de regras.

O encontro só poderá ser alterado quando a primeira fiada do pavimento estiver selecionada. A composição escolhida será aplicada desde essa fiada a toda a altura correspondente, com alternância e amarração necessárias, até o limite superior da alvenaria definido no RF-13. Nas demais fiadas, o encontro poderá ser inspecionado, mas sua edição ficará indisponível, com orientação para acessar a primeira fiada. Não haverá alteração parcial iniciada em fiadas intermediárias.

O motor recalculará as paredes participantes e os elementos associados. A composição escolhida será preservada durante regenerações quando continuar aplicável. A propagação não atravessará automaticamente a laje para alterar outro pavimento.

**Aceite:** editar só é possível na primeira fiada; a escolha atualiza toda a altura com amarração correspondente, sem sobreposições ou propagação para outros pavimentos; desfazer restaura a escolha anterior.

### RF-06 — Portas, janelas e vãos arrastáveis

Portas, janelas e vãos serão adicionados como elementos arrastáveis com o mouse no canvas. Durante o arraste, o Ecovit mostrará uma prévia vinculada à parede, com posição e largura ajustadas ao módulo permitido de meio tijolo. Ao soltar o mouse, o elemento será inserido com indicador gráfico próprio, permitindo distinguir porta, janela e vão sem depender apenas de cores.

Cada elemento poderá ser selecionado, reposicionado com o mouse e ter sua largura alterada respeitando a malha modular. A representação atualizará a interrupção dos tijolos nas fiadas afetadas, preservando a identificação gráfica do elemento.

As propriedades editáveis incluirão largura, **altura** e **base**. Base é a distância vertical entre o piso de referência do pavimento e o início inferior do elemento. O topo corresponde à base mais a altura. Para portas, a base inicial será zero; para janelas e demais vãos, será configurável.

Ao informar altura ou base, o Ecovit validará sua compatibilidade com os limites das fiadas, considerando o passo vertical efetivo e a referência de início da alvenaria em relação ao piso. A base e o topo deverão coincidir com limites realizáveis das fiadas. Valores incompatíveis mostrarão alternativas antes da confirmação, sem arredondamento silencioso.

Os campos principais serão largura e altura do vão bruto de alvenaria e sua base. Dimensão da esquadria e folgas de instalação, quando informadas, ficarão em opções adicionais, sem alterar automaticamente o vão bruto. Posicionar automaticamente vergas e contravergas aplicáveis e atualizar os elementos associados quando posição, largura, base ou altura forem alteradas.

As propriedades serão apresentadas de forma compacta e contextual ao selecionar o elemento. Explicações sobre base, altura e modulação estarão disponíveis por ícone informativo, sem ocupar permanentemente o canvas.

**Aceite:** arrastar mostra a prévia modular; soltar insere um indicador gráfico distinto para cada tipo; mover e redimensionar respeita o módulo horizontal; editar base ou altura valida os limites das fiadas e atualiza os tijolos e elementos associados. Um vão que invade um encontro ou reforço apresenta o conflito localizado.

### RF-07 — Grauteamento e elementos em canaletas automáticos

O Ecovit posicionará automaticamente grauteamentos, vigas de canaletas, canaletas, cintas, vergas e contravergas, com possibilidade de ajuste pelo usuário.

A proposta se baseará nas boas práticas internas de construção estrutural com T.E., considerando encontros, extremidades, vãos, alturas, níveis de lajes e continuidade entre pavimentos. Os critérios concretos de espaçamento, apoios e níveis serão definidos na especificação técnica do motor. Não será necessário ao usuário cadastrar, selecionar ou validar regras.

Grauteamentos terão posição e intervalo vertical. Vigas e demais elementos em canaletas terão trajetos, fiadas e apoios. O motor verificará continuidade dos canais e passagens verticais e gerará as peças modificadas necessárias ao sistema.

O usuário poderá mover, adicionar, remover e ajustar posições, extensões e níveis. Mudanças na planta atualizarão a proposta automática, preservando ajustes compatíveis e mostrando conflitos antes de substituí-los. Para grauteamentos, adicionar, remover ou mover afetará todos os intervalos aplicáveis no trecho vertical do pavimento, respeitando portas, janelas e vãos. Alterar um vão recalculará esses intervalos e sua representação nas fiadas, preservando a escolha horizontal quando compatível.

A automação inicial abrange composição e posicionamento. O tamanho-base sozinho não determina cargas, resistência do material, diâmetros de armaduras ou dimensionamento resistente.

**Aceite:** uma planta com encontros e vãos recebe os elementos aplicáveis automaticamente; ajustes são respeitados; interrupções de grauteamentos ou canaletas são localizadas.

### RF-13 — Lajes de piso e cobertura

Permitir criar lajes por contorno ortogonal simples, sem auto-interseções, associado a pavimento e cota, com espessura definida pelo usuário. Será possível editar contorno, nível, espessura e aberturas, também ortogonais simples e contidas na laje.

A mesma ferramenta atenderá lajes de piso e de cobertura. A finalidade poderá ser indicada como informação. A cota será sempre a da face superior; a face inferior será essa cota menos a espessura. A espessura será armazenada apenas na laje, sem campo duplicado no pavimento.

Cada parede terá altura inicial herdada do padrão do pavimento e editável. Seu topo solicitado será a referência de início da alvenaria mais essa altura. Quando uma laje de fechamento associada cobrir o trecho, seu limite superior será o menor entre esse topo e a face inferior da laje. Sem laje de fechamento, valerá o topo solicitado. Limites incompatíveis com fiadas serão sinalizados com alternativas, sem cortes ou arredondamentos silenciosos. Grauteamentos e encontros respeitarão a alvenaria existente em cada trecho. Não haverá modelagem de telhados: a altura da parede será suficiente para representar seu término.

Lajes aparecerão como camada 2D e participarão da coordenação de paredes, cintas e grauteamentos. Serão limites para a propagação dos encontros quando encerrarem o trecho de parede. Sua criação não criará outro pavimento automaticamente.

**Aceite:** alterar a espessura atualiza as cotas das faces e evidencia conflitos nos elementos dependentes; a laje delimita a propagação associada. Dimensionamento resistente e armaduras da laje ficam fora desta entrega.

### RF-08 — Até três pavimentos

O projeto começará com um térreo e propriedades iniciais visíveis e editáveis, sem exigir cadastro prévio de todos os níveis. Adicionar, renomear, duplicar e remover pavimentos até o limite de três. Cada pavimento terá cota de piso acabado, referência de início da alvenaria e altura padrão para novas paredes. Alterar o padrão não modificará silenciosamente paredes existentes. A espessura pertencerá exclusivamente à laje associada.

Compartilhar origem e coordenadas horizontais. Permitir sobreposição do pavimento adjacente para comparar paredes, vãos, aberturas de laje e reservas verticais. Duplicar um pavimento criará elementos independentes com novos identificadores.

Desalinhamentos e interrupções serão informados para revisão, sem serem interpretados automaticamente como aprovação ou reprovação estrutural. Escadas e aberturas de laje poderão ser representadas por contornos de referência.

**Aceite:** o quarto pavimento é impedido; alterar uma parede duplicada não modifica a original; um reforço marcado como contínuo entre pavimentos apresenta qualquer descontinuidade geométrica.

### RF-09 — Edição simples e recálculo automático

As peças serão geradas pelo motor, sem substituição, orientação ou bloqueio manual de tijolos individuais. Na Planta, o usuário criará, excluirá e alterará o tamanho das paredes por ambas as extremidades, conforme RF-02. Em Fiada, permanecerão apenas os ajustes de encontros, grauteamentos e canaletas definidos nos RF-04, RF-05 e RF-07.

Após cada alteração geométrica ou construtiva confirmada, marcar o resultado como desatualizado e recalcular automaticamente o projeto inteiro, uma operação por vez. Alterações de nome, seleção e câmera não exigirão cálculo. É aceitável aguardar o processamento com novas edições temporariamente indisponíveis; não haverá fila de edições ou botão de regeneração no fluxo normal. Preservar ajustes compatíveis. Ajustes incompatíveis permanecerão registrados como pendentes, sem aplicação à composição, com ação para localizar e corrigir ou descartar o ajuste. Uma falha de cálculo manterá o modelo editável e permitirá tentar novamente.

**Aceite:** ambas as extremidades permitem redimensionar paredes; alterações confirmadas recalculam automaticamente; ajustes incompatíveis não desaparecem silenciosamente; resultados desatualizados não são apresentados como atuais nem usados nos quantitativos.

### RF-10 — Diagnóstico e estado do projeto

Exibir problemas por gravidade, pavimento, fiada e elemento, com acesso à localização e explicação simples do problema. Categorias mínimas: modulação, colisão, lacuna, encontro sem solução, vão incompatível, canaleta descontínua, furo desalinhado e conflito com ajuste construtivo.

Mostrar de forma simples se o resultado está atualizado e se há pendências geométricas. Não haverá fluxo obrigatório de aprovação técnica ou regras na interface.

**Aceite:** qualquer erro impeditivo bloqueia a classificação “geometricamente válido”; o projeto pode ser salvo e exportado como rascunho com pendências claramente declaradas.

### RF-11 — Quantitativos e arquivo nativo

Contar peças por tipo, pavimento e fiada, sem duplicar peças dos encontros. Separar cortes e peças especiais. Para peças modificadas na obra, distinguir a peça-base consumida da peça resultante, evitando dupla contagem. Eventual margem de perdas será informada pelo usuário e separada da quantidade geométrica.

Quantitativos serão consultados em tela separada do canvas. A única exportação inicial será o arquivo nativo, para baixar e reabrir o projeto. PDF, SVG, CSV e documentos de impressão ficam para evolução posterior.

Não estimar volume de graute nem quantidade de aço sem dados suficientes; essas estimativas ficam fora da primeira versão.

**Aceite:** a soma por fiada coincide com a soma do pavimento e do projeto; consulta usa o estado atualizado; download e carregamento preservam o projeto, inclusive pendências e ajustes.

### RF-12 — Salvamento local, arquivo portátil e armazenamento futuro

Salvar automaticamente no navegador, indicar o estado do salvamento e permitir baixar e carregar o arquivo nativo. Não haverá login ou dependência de servidor na primeira versão. Informar discretamente que os dados locais estão associados ao navegador/dispositivo e podem ser apagados; o arquivo baixado permite backup e transferência.

Salvar o documento após cada alteração confirmada, antes do cálculo, com resultado marcado como desatualizado; salvar novamente após o cálculo terminar. Não salvar movimentos intermediários do mouse. Falha no cálculo não impedirá salvar o rascunho. Falha no armazenamento manterá o trabalho em memória e permitirá baixar o documento atual, mesmo que ainda não tenha sido salvo no navegador. Durante o processamento, o download aguardará o término da operação. O arquivo poderá conter a última composição disponível, explicitamente desatualizada, ou nenhuma composição se ainda não houve geração.

Adotar documento estruturado em JSON, com extensão proposta **.ecovit**, identificação do aplicativo e versão do formato. Versionar o formato é necessário para leitura e migração de arquivos; isso não implica versionamento de regras construtivas.

Armazenar identificadores estáveis para projeto e elementos, unidades, tamanho-base, origem modular, pavimentos, paredes, vãos, lajes, encontros escolhidos, elementos automáticos e ajustes manuais. Preservar a composição gerada necessária à reabertura fiel e o estado atualizado ou pendente. Relações entre elementos usarão identificadores, sem depender de objetos da interface ou caminhos locais.

Separar o modelo do projeto das funções de armazenamento. A mesma estrutura deverá poder ser persistida futuramente em banco de dados, por documento ou mapeamento de entidades, sem redesenhar o modelo de domínio. Conta, sincronização e permissões de acesso serão tratadas somente nessa evolução.

Validar arquivos carregados, preservar o original durante migrações e impedir que uma importação inválida sobrescreva o trabalho aberto.

**Aceite:** recarregar recupera o último salvamento concluído; baixar e carregar em outro navegador preserva geometria, escolhas e ajustes; arquivo inválido mantém o trabalho existente; o formato pode ser lido independentemente da interface.

## 7. Modelo de domínio e diretrizes de implementação

| Entidade | Responsabilidade |
|---|---|
| Projeto | Metadados, unidades, origem modular e tamanho-base definido na criação |
| Catálogo derivado | Peças e procedimentos de modificação gerados a partir do tijolo-base |
| Encontro | Paredes participantes, composição definida na primeira fiada e limite superior |
| Laje | Contorno, aberturas, cota e espessura |
| Pavimento | Níveis, referências verticais e elementos arquitetônicos |
| Parede | Geometria de referência, espessura, altura e conexões |
| Vão | Relação com parede e limites horizontais/verticais |
| Elemento estrutural representado | Grauteamentos, vigas de canaletas, cintas, vergas e contravergas |
| Fiada | Índice, cotas e peças geradas |
| Instância de peça | Tipo, posição, orientação, vínculo com a região de parede e com o ajuste construtivo que originou a peça, quando houver |
| Diagnóstico | Regra violada, gravidade, localização e estado de resolução |
| Resultado gerado | Estado do projeto usado nos desenhos e quantitativos |

Haverá apenas um canvas, ocupando a maior parte da tela, onde o usuário fará o desenho, alteração ou exclusão de elementos. Quantitativos abrirão em tela separada.
Usar unidades internas precisas e tolerância documentada; a representação numérica escolhida não poderá acumular erros a cada fiada. Coordenadas verticais e orientação existirão desde a primeira versão para sustentar uma futura visualização 3D.

A stack e as decisões de implementação estão propostas no documento complementar [Arquitetura Técnica do Ecovit](Ecovit-Arquitetura-Tecnica.md). O PRD mantém os requisitos de produto como referência.

## 8. Requisitos não funcionais

### Apresentação da página inicial

A página inicial reúne criação, abertura de projetos locais e carregamento de arquivos `.ecovit`, com introdução breve e ações visíveis em telas de notebook. Cabeçalho e conteúdo compartilham alinhamento; os cartões usam espaçamentos regulares, nomes com quebra de linha e metadados legíveis. A rolagem pertence à página, sem painel interno rolável. Em larguras menores, a composição passa para uma coluna.

A identidade visual usa verde profundo, verde oliva e fundo areia, com fonte de sistema para controles e detalhe serifado no título inicial, sem depender de fontes remotas. A lista vazia explica onde aparecerão os projetos, e a orientação de backup permanece visível após os cartões. Essa adaptação da página inicial não altera o foco do editor em computadores com mouse e teclado.

### Interface centrada no canvas

Revisão da paginação: retas conectadas e cantos devem seguir a continuidade do percurso. Orientação igual para todos os cantos de uma fiada não é requisito. Inteiros ocupam o canto conforme a paridade do trecho; meios não devem ser introduzidos no interior para atender orientação imposta. As duas fases devem alternar cada canto e cobrir exatamente a geometria. Meios necessários nas extremidades permanecem permitidos. A definição nominal e o tratamento específico dos T estão em CT-05.

Paredes com pontas livres e contornos abertos, inclusive U, são estados normais do projeto e não exigem fechamento de recintos para compor fiadas. A composição deve atender aos padrões nominais documentados no caderno técnico, incluindo U aberto com T compatíveis. Ausência de padrão implementado é limitação do motor, não prova de erro no desenho. Permanecem as verificações de malha, alturas, cobertura e conflitos entre peças.

O canvas de desenho será o foco da interface e ocupará a maior parte da área disponível. Barras de ferramentas, seletores, controles e indicadores deverão ser discretos e compactos, preservando espaço para desenhar.

Propriedades serão apresentadas de forma contextual ao selecionar um elemento, em painel compacto recolhível ou controle próximo à seleção. Painéis auxiliares não deverão permanecer abertos sem necessidade. A interface evitará grandes blocos de texto e painéis fixos que reduzam a área útil do desenho.

Informações adicionais e explicações serão acessíveis ao clicar em ícones informativos. Esses controles terão identificação acessível e poderão ser acionados por teclado. A apresentação de uma explicação poderá ser fechada facilmente para retomar o desenho.

### Organização dos controles e interação comum

Refinamento visual do editor (11/10/2026), inspirado na referência TijoCAD fornecida: cabeçalho de 48 px, seguido de faixa compacta reunindo ferramentas, Planta/Fiada e controles de fiada. Em larguras menores, permitir quebra da faixa sem ocultar ações. Preservar identidade verde do Ecovit. Propriedades e inspeção de fiadas usam painel estreito recolhível; legenda inicia recolhida e pode ser aberta. Rodapé compacto reúne térreo, módulo, referência externa, contagem de paredes e situação da composição. Não acrescentar ferramentas, modos ou parâmetros presentes apenas na referência.

A barra compacta do editor mostrará projeto, salvamento, desfazer/refazer, pavimento e os modos Planta/Fiada. Ferramentas mudarão com o modo: Selecionar, Parede, Porta, Janela, Vão e Laje em Planta; Selecionar, Grauteamento e Encontro em Fiada, com controles das fiadas. Funções secundárias ficarão em menu; não incluir botões para 3D ou funcionalidades ainda indisponíveis.

A ferramenta e o modo ativos terão indicação persistente por realce e texto acessível. O cursor, a prévia e uma orientação curta explicarão o gesto em andamento. O canvas vazio oferecerá instrução breve que desaparecerá após o primeiro desenho.

Usar roda do mouse para zoom centrado no cursor; botão do meio pressionado + arraste como gesto principal para deslocar o viewport, mantendo Espaço + botão esquerdo + arraste como alternativa para touchpads e mouses sem botão central, sem modificar elementos; oferecer também controles compactos de ampliar, reduzir e enquadrar projeto. Impedir que gestos de navegação criem ou redimensionem paredes, alterem seleção ou troquem a ferramenta ativa. Ambos funcionam em Planta/Fiada, inclusive somente leitura, respeitando o bloqueio durante processamento. Mostrar mão fechada durante o arraste; um clique central isolado não desloca. Suprimir a rolagem automática/ação auxiliar do navegador apenas no canvas. Acompanhar o deslocamento fora do canvas e encerrar ao soltar o botão que iniciou o gesto, ao perder foco ou ao cancelar. Soltar Espaço encerra apenas o gesto iniciado com Espaço, não o iniciado pelo botão central. Não substituir um desenho/redimensionamento em andamento por navegação; soltar outro botão não confirma nem encerra o gesto original. Escape cancelará o gesto ou fechará a edição contextual; ao sair de uma ferramenta, retornará à seleção. Delete excluirá a seleção quando o foco não estiver num campo de texto. Ctrl+Z e Ctrl+Y/Ctrl+Shift+Z desfazem/refazem; cada arraste concluído e suas atualizações automáticas constituem uma única ação.

Selecionar uma ferramenta de desenho permitirá repetir a operação até trocar a ferramenta ou pressionar Escape. Campos numéricos não poderão acionar atalhos do canvas durante digitação. Zoom reduzido poderá simplificar detalhes visuais; a geometria e a edição continuarão com precisão modular. Definir o limiar de detalhe por testes, sem prometer um valor específico nesta etapa.

Erro de inserção terá aviso curto perto do local e manterá o trabalho existente. Mudanças com recalculação mostrarão “Calculando…” antes de iniciar o processamento; não apresentar resultado antigo como concluído. Ícones informativos abrirão explicações sob demanda, incluindo o significado da altura da fiada e o alcance de alterações.

Quantitativos e relatórios abrirão em telas separadas, conforme a diretriz existente. No canvas, manter apenas dados essenciais, como módulo e estado de salvamento. Não adotar valores de altura ou espaçamento de graute vistos nos prints como parâmetros construtivos do Ecovit.

### Critérios de usabilidade a verificar durante a implementação

Testar com representantes de arquitetos e autoconstrutores: criar um recinto e um encontro em T, redimensionar parede, inserir janela e editar base/altura, alternar Planta/Fiada, encontrar uma fiada de canaleta, alterar encontro na primeira fiada e salvar/reabrir.

Observar confusão entre modos, ações acidentais, compreensão da modulação, descoberta dos controles e percepção do alcance de ajustes. Antes de concluir a implementação do editor, os dois públicos deverão conseguir completar esses fluxos sem instrução verbal do avaliador. Os prints orientam a separação dos modos e o aproveitamento do canvas; os controles finais serão verificados por esses testes.

**Aceite:** sem seleção, o canvas ocupa a maior parte da área útil; selecionar uma parede ou um vão mostra apenas os controles pertinentes; fechar ou recolher propriedades libera o espaço; explicações extensas só aparecem quando solicitadas. A prévia de arraste, os indicadores dos elementos e os problemas que exigem ação continuam visíveis no desenho.

- **Uso:** desktop primeiro, com mouse e teclado; consulta em telas menores poderá ser posterior. Interface em português e unidades métricas.
- **Orientação:** criação guiada do projeto, explicações em contexto e mensagens compreensíveis para autoconstrutores; entrada numérica e ferramentas de precisão disponíveis para arquitetos.
- **Desempenho proposto:** interação de seleção/zoom fluida fora do cálculo; geração completa em até 5 segundos como referência inicial de observação. O solicitante avaliará a espera aceitável no próprio aplicativo, sem prova técnica prévia. 
- **Referência de carga proposta:** três pavimentos, 100 paredes por pavimento, até 50 fiadas por pavimento e 100 mil peças totais, em computador com 8 GB de RAM e navegador desktop atual. Essas são metas de teste, não limites arquitetônicos já demonstrados.
- **Processamento:** uma operação por vez, com aviso de espera e edição temporariamente indisponível. Não exigir progresso percentual ou cancelamento durante o cálculo inicial. Ao terminar ou falhar, liberar os controles.
- **Integridade:** salvamento, exportação e regeneração não poderão misturar revisões.
- **Acessibilidade:** controles e diagnósticos utilizáveis por teclado; cores acompanhadas de símbolos ou texto.
- **Segurança:** tratar arquivos importados como dados; limitar tamanho e validar estrutura; impedir execução de conteúdo importado.
- **Compatibilidade proposta:** Chrome e Edge desktop; outros navegadores serão avaliados antes do lançamento.
- **Evolução:** formato de arquivo com migrações quando necessárias e testes de regressão; sem controle de versões de regras construtivas como funcionalidade do produto.

## 9. Pesquisa e especificação técnica do motor único

O Ecovit terá um conjunto único e interno de boas práticas, sem seleção pelo usuário, regras versionadas ou fluxo complexo de aprovação. Como não há referência construtiva fornecida pelo solicitante, a pesquisa será uma atividade explícita anterior à implementação dos algoritmos de amarração e posicionamento automático. Poderá ocorrer durante a implementação do canvas e da persistência no próprio aplicativo.

### Entrega: Caderno técnico do motor Ecovit

A pesquisa deverá priorizar manuais técnicos de fabricantes, publicações técnicas de instituições e referências normativas pertinentes, verificando sua aplicabilidade ao tijolo modular de solo-cimento. A documentação registrará links, datas, trechos ou figuras relevantes e o contexto de aplicação. Não generalizar uma recomendação específica de fabricante sem avaliar sua compatibilidade com o sistema padrão.

O caderno deverá cobrir:

1. Geometria padrão derivada do tijolo-base, furos, encaixes, canaletas e procedimentos de preparação de peças especiais.
2. Encontros em L, T e cruz, com desenhos da primeira fiada e alternâncias superiores.
3. Continuidade e posições propostas de grauteamentos, incluindo extremidades, encontros e regiões de vãos.
4. Canaletas, vigas, cintas, vergas e contravergas, com critérios de posição, continuidade e apoios.
5. Transições junto a lajes, cobertura e entre pavimentos.
6. Diferenças entre recomendações encontradas, hipóteses adotadas e questões não resolvidas.
7. Tradução das conclusões para decisões objetivas do algoritmo e exemplos de entrada/resultado esperado.

Não inventar valores de espaçamento ou apoios para preencher lacunas. Quando uma indicação depender de cargas ou dimensionamento resistente, registrar essa dependência e definir o limite da proposta geométrica do Ecovit.

### Condição de prontidão para implementar o motor

Haverá desenhos e casos de teste para os dois tamanhos iniciais e pelo menos um tamanho personalizado 2:1; cada comportamento automático previsto terá critério documentado; contradições e lacunas estarão explicitadas. Casos cobrirão recintos fechados, encontros, vãos, canaletas, lajes e propagação desde a primeira fiada.

A revisão técnica ocorrerá como parte do desenvolvimento, sem exigir que usuários cadastrem ou aprovem regras. O caderno orientará implementação e testes, mantendo o cálculo de cargas, resistência e armaduras fora do produto inicial.

Esta seção define a pesquisa futura; a consulta pública inicial registrada na seção 13 ainda não constitui o caderno técnico.

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
| Criar laje | Contorno e espessura editáveis, cotas e limites atualizados |
| Definir tamanho-base | Catálogo completo derivado; base única em toda a construção |
| Personalizar dimensões | Proporção comprimento/largura 2:1 validada |
| Gerar elementos estruturais | Grauteamentos e canaletas posicionados automaticamente e ajustáveis |
| Comprimento fora do módulo | Diferença e alternativas mostradas, sem ajuste silencioso |
| Porta, janela e vão por arraste | Prévia modular e indicadores gráficos distintos ao soltar |
| Editar altura e base de vão | Limites de fiadas validados e peças associadas atualizadas |
| Porta e janela na mesma parede | Interrupções, base e elementos especiais nas fiadas corretas |
| Interface centrada no canvas | Controles compactos, propriedades contextuais e explicações por ícone |
| Canaleta atravessando encontro | Continuidade resolvida por regra ou conflito localizado |
| Reserva vertical de reforço | Passagens compatíveis nos intervalos de alvenaria aplicáveis |
| Ajustar graute em qualquer fiada | Todas as fiadas do trecho vertical são atualizadas, respeitando vãos |
| Graute na posição de uma janela | Intervalos abaixo/acima separados, sem graute no vazio |
| Mover ou remover graute | Operação aplicada a todo o trecho do pavimento, sem atravessar a laje |
| Três pavimentos | Origem comum, fiadas independentes e comparação entre níveis |
| Mudança após ajuste construtivo | Ajustes compatíveis preservados; incompatíveis pendentes com opção de corrigir ou descartar |
| Salvar, reabrir e regenerar | Composição e ajustes preservados |
| Baixar e carregar arquivo nativo | Geometria, ajustes, composição e pendências preservados |
| Falha no cálculo | Modelo salvo como rascunho, controles liberados e quantitativos antigos indisponíveis |
| Falha no salvamento local | Trabalho mantido em memória e download contém a última edição confirmada |
| Alterar pavimentos sucessivamente | Uma operação por vez, com projeto inteiro recalculado sem perder alterações de outro pavimento |
| Composição fora dos procedimentos documentados | Diagnóstico “Sem solução automática”, sem peça especial inventada |
| Criar projeto | Térreo aberto com propriedades editáveis, sem cadastro obrigatório de outros pavimentos |
| Reabrir em outro navegador | Projeto recuperado pelo arquivo sem login |

O conjunto de testes deverá incluir casos que precisam falhar, além de exemplos bem-sucedidos. O solicitante testará as funcionalidades diretamente no aplicativo após cada implementação, incluindo o uso de três pavimentos, e ajustará os rumos quando necessário. Não haverá prova técnica, prova de conceito ou protótipo separado.

## 11. Riscos e tratamento previsto

| Risco | Tratamento |
|---|---|
| Geometria real diferente do sistema padrão | Documentar hipóteses da derivação e modificações necessárias |
| Soluções locais incompatíveis | Resolver a rede de paredes conectadas e verificar fechamento global |
| Misturar desenho estrutural e cálculo | Limites explícitos no produto e parâmetros informados por responsável |
| Perder ajustes ao regenerar | Preservação dos ajustes de encontros, graute e canaletas, desfazer e indicação de incompatibilidades |
| Quantitativo divergente do desenho | Estado gerado comum para desenho e consulta de quantitativos |
| Excesso de escopo na primeira versão | Ortogonalidade e uma família ativa; demais geometrias fora do início |
| Desempenho insuficiente | Observar a espera no próprio aplicativo após cada implementação e otimizar apenas quando necessário |

## 12. Decisões para validar o PRD — respostas consolidadas

| Decisão | Definição confirmada |
|---|---|
| Público | Arquitetos e autoconstrutores |
| Direção de paredes | Horizontais e verticais |
| Tamanho-base | Único para toda a construção, definido no início |
| Dimensões personalizadas | Comprimento igual ao dobro da largura; altura configurável |
| Pavimentos | Até três: térreo e dois superiores |
| Automação estrutural | Composição e posicionamento, sem cálculo de cargas, resistência ou armaduras |
| Referência construtiva | Pesquisa e caderno técnico antes dos algoritmos do motor, conforme seção 9 |
| Alteração de encontros | Somente na primeira fiada, aplicada a toda a altura até o limite superior da alvenaria |
| Ajuste de grauteamentos | Todo o trecho vertical do pavimento, respeitando portas, janelas e vãos |
| Salvamento | No navegador, com download e carregamento de arquivo, sem login |
| Armazenamento futuro | Formato estruturado e modelo independentes do armazenamento, preparados para banco de dados |
| Exportação inicial | Somente arquivo nativo para reabrir |

As perguntas de escopo desta seção foram respondidas pelo solicitante. A pesquisa do motor é trabalho técnico definido para a próxima fase, não uma decisão de produto sem resposta.

O documento está atualizado para revisão final. Não foram criados marcos ou tarefas de implementação nesta revisão; eles serão derivados do PRD após sua validação.

## 13. Referências e limites da pesquisa

Consulta realizada em 10 de outubro de 2026, em páginas públicas. Não houve avaliação prática do editor Tijocad, de seus algoritmos ou dos resultados construtivos gerados.

- [TijoCAD — site oficial](https://www.tijocad.com.br/): anuncia editor web, modulação de paredes/vãos e visualização de fiadas, além de recursos 3D. Serve como referência de experiência e categoria de produto; não é fonte de regras técnicas para o Ecovit.
- [Tijolo Ponto Eco — Manual de Projeto com Tijolo Ecológico](https://tijolo.eco.br/manual_projeto_tijolo_ecologico/): apresenta, para seu exemplo de tijolo 30 × 15 × 7 cm, modulação de 15 cm; descreve a primeira fiada com posicionamento de elementos e recomenda projeto estrutural. A medida citada é específica desse exemplo, não requisito universal do Ecovit.
- [Permaq — Tijolos](https://permaq.com.br/maquina/tijolos): a descrição pública localizada na pesquisa menciona diferentes tamanhos e tipos, incluindo meios e canaletas. A página não abriu integralmente nesta consulta; deverá ser confirmada com documentação do fornecedor antes de compor qualquer catálogo.

As especificações funcionais deste PRD são propostas para o Ecovit. A pesquisa pública não valida padrões executivos de encontros, detalhamento de armaduras ou viabilidade de edificações com três pavimentos.

## 14. Alterações da versão 0.3

As seções 14 a 18 registram decisões históricas; os requisitos atuais e a seção 19 prevalecem onde houve simplificação posterior.

Catálogo derivado somente do tamanho-base; módulo mínimo obrigatório de meio tijolo; conjunto interno único sem versionamento de regras; encontros automáticos editáveis com propagação vertical; grauteamentos e elementos em canaletas automáticos; lajes com espessura configurável; editor com paredes identificáveis e desenho/redimensionamento por arraste.

## 15. Alterações da versão 0.4

RF-06 detalhado com portas, janelas e vãos arrastáveis, indicadores gráficos, propriedades de altura e base referidas ao piso e validação vertical pelas fiadas. Interface definida com foco no canvas, controles discretos, propriedades contextuais e informações adicionais por ícones.

## 16. Alterações da versão 0.5

Consolidação das decisões do solicitante: paredes horizontais/verticais, base única e proporção personalizada 2:1, térreo mais dois pavimentos, encontros editáveis somente na primeira fiada, salvamento local sem login, arquivo nativo preparado para banco de dados e retirada de PDF/SVG/CSV do escopo inicial. Definida a entrega de pesquisa “Caderno técnico do motor Ecovit” antes dos algoritmos construtivos.

## 17. Alterações da versão 0.6

Editor detalhado a partir dos prints fornecidos: modo Planta para arquitetura e modo Fiada para composição construtiva, navegação de fiadas, representação de canaletas, seleção, prévias, gestos, atalhos, cancelamento e testes de usabilidade. Os prints mostram a interface de referência; não comprovam seu algoritmo ou critérios estruturais. O alcance dos ajustes de grauteamento foi confirmado na versão 0.7.

## 18. Alterações da versão 0.7

Confirmado o alcance dos ajustes de grauteamento: todo o trecho vertical entre laje/base inferior e laje/telhado superior, respeitando portas, janelas e demais vãos, com intervalos separados onde houver interrupções e atualização de todas as fiadas afetadas.


## 19. Alterações da versão 0.8

Face externa como referência fixa de paredes, espessura igual à largura do tijolo-base e redimensionamento por ambas as extremidades. RF-09 simplificado, sem edição ou bloqueio de tijolos individuais. Recálculo automático do projeto inteiro, uma operação por vez, com espera aceita e sem filas ou Worker. Salvamento do modelo antes do cálculo e do resultado após sucesso; download do documento atual em memória. Lajes ortogonais simples, espessura armazenada somente na laje e limite superior da alvenaria definido por altura e laje de fechamento, sem editor de telhados. Catálogo restrito aos procedimentos documentados, com diagnóstico para composições sem solução automática. Início direto no térreo e testes no aplicativo após cada implementação, sem prova técnica separada. Nenhum marco ou tarefa criado.
