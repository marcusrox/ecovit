# Ecovit — Documento de requisitos do produto (PRD)

**Versão:** 0.15 — Suporte nominal à cruz implementado em M3.5\
**Data:** 13 de outubro de 2026\
**Status:** M1/M2 e M3.1–M3.5 aprovados pelo solicitante; aceites globais de M3.4/M3.5 registrados em 14/10/2026 no plano.\
**Plataforma:** aplicação web, inicialmente com interface e documentação em português brasileiro.

## 1. Visão do produto

O Ecovit será uma aplicação web para projetar plantas baixas de construções com tijolos ecológicos de solo-cimento. Seu diferencial será transformar a intenção arquitetônica em uma distribuição verificável das peças de cada fiada, respeitando a modulação do sistema escolhido, os encontros entre paredes, os vãos e os elementos em canaletas.

A primeira versão será inteiramente 2D, mas representará a construção em três coordenadas e por fiadas, permitindo projetar toda a altura das paredes e até três pavimentos. Não haverá visualização 3D inicial. O modelo de dados deverá permitir adicioná-la futuramente sem reconstruir os projetos existentes.

O produto produz desenhos e, em evolução futura, quantitativos. O M3 representa geometria nominal de vãos, canaletas e grautes, sem verificar dimensões físicas internas de furos/canais, dimensionar apoios, cargas ou armaduras. Compatibilidade modular e ausência de colisões não significam comprovação da capacidade estrutural da construção.

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
- Grauteamentos e vigas de canaletas propostos automaticamente conforme as convenções nominais documentadas no caderno técnico.
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

Cada parede reta terá identificador próprio e poderá ser criada, selecionada, excluída, redimensionada a partir de qualquer uma das duas extremidades e movida com seus dependentes. Criar ou mover uma parede para continuidade colinear poderá unir paredes compatíveis, conforme §21. Não haverá ferramenta de dividir paredes. A seleção mostrará realce, comprimento modular e propriedades compactas. Movimento e união estão implementados em M3.4, com aceite global recebido em 14/10/2026.

A referência de desenho e encaixe será sempre a **face externa**, com espessura igual à largura do tijolo-base. A prévia mostrará a face de referência e o lado ocupado pela espessura, permitindo inverter esse lado antes de confirmar. Em paredes internas, “face externa” identifica a face adotada como referência, sem exigir detecção de recintos. Essa face permanecerá estável ao editar a parede. Encontros em L alinharão as faces externas no canto; o motor resolverá a região compartilhada sem duplicar peças. Cotas externas serão a referência principal; cotas internas poderão ser consultadas sem alterar o encaixe.

**Desenho de paredes:** ativar Parede, pressionar o botão esquerdo no ponto inicial e arrastar. A direção será horizontal ou vertical conforme o deslocamento predominante. Uma prévia mostrará a faixa, extremidades, comprimento efetivo e encaixe no grid. Ao soltar, confirmar a parede modular, gerar as peças e atualizar os encontros. Um arraste sem comprimento mínimo de um módulo não criará parede. Escape antes de soltar cancelará o gesto sem alterar o projeto.

**Conexões:** a proximidade de outra parede mostrará um alvo de conexão. Soltar sobre esse alvo alinhará a geometria e gerará o encontro. A tolerância visual acompanhará o zoom; uma conexão só será confirmada na posição modular indicada. Nos encontros entre paredes distintas, as participantes manterão seus identificadores e o motor evitará duplicar peças compartilhadas. A exceção é a união colinear de §21, que consolida paredes e remapeia referências. Soltar no meio de uma parede poderá criar encontro em T.

**Redimensionamento:** selecionar a parede e arrastar qualquer uma das duas extremidades, mantendo a extremidade oposta fixa e a orientação da parede. Mostrar prévia e comprimento durante o gesto; ao soltar, atualizar o trecho e suas dependências. Também permitir informar o comprimento, indicando qual extremidade será alterada. Vãos existentes manterão sua posição na planta; os que deixarem de caber serão sinalizados, sem exclusão ou deslocamento silencioso. Redimensionar uma parede não moverá automaticamente as demais; encontros serão recalculados pela nova geometria.

**Seleção:** com a ferramenta Selecionar ativa, clicar seleciona um elemento e clicar em área vazia limpa a seleção. O realce de passagem do mouse será distinto da seleção. Controles do elemento terão prioridade sobre o desenho de uma nova parede. Paredes sobrepostas ou próximas permitirão escolher o elemento por um seletor contextual compacto.

**Movimento:** em Selecionar, arrastar o corpo de uma parede na Planta deslocará essa parede e seus dependentes, com prévia modular antes da soltura. Outras paredes permanecerão no lugar; conexões antigas serão desfeitas geometricamente e novas conexões serão recalculadas. Regras de dependências, conflitos e cancelamento em §21.

**Aceite:** desenhar, selecionar, redimensionar e mover mantém a malha; continuidade compatível gera uma única parede; conexões e movimentos são antecipados visualmente; dependentes preservados conforme §21; a planta fica legível sem detalhes de tijolos; abrir Fiada apresenta a distribuição gerada para a mesma geometria. Verificação específica da evolução em M3.4.

### RF-03 — Modulação obrigatória de meio tijolo

Grid, desenho de paredes, portas, janelas e demais vãos usarão sempre o módulo mínimo de meio tijolo. Posições e comprimentos horizontais serão ajustados a essa malha, com origem comum entre pavimentos.

As extremidades da face externa de referência serão encaixadas na malha. A posição de um vão será medida ao longo dessa face, a partir da extremidade de menor coordenada da parede; a largura será a do vão bruto. Alterar essa extremidade recalculará a distância de referência, preservando a posição do vão na planta.

Durante o arraste, o usuário verá a medida modular que será efetivada. Medidas digitadas incompatíveis mostrarão alternativas antes da confirmação. Não haverá modo de desenho livre fora da malha na primeira versão.

Antes de iniciar paredes, portas, janelas ou vãos, destacar o quadrado do módulo correspondente ao ponto inicial que será efetivado, conforme §21. O destaque acompanha o encaixe real e não altera o projeto.

A modulação vertical considerará altura-base, passo de assentamento e fiadas. Alturas de parede, peitoris e vãos serão compatibilizadas com as fiadas, mostrando diferenças para a altura solicitada.

O motor verificará o fechamento das paredes conectadas, usando inteiros, meios, canaletas e especiais derivados. Modificações necessárias na obra serão permitidas e identificadas.

**Aceite:** paredes e vãos horizontais são confirmados apenas na malha de meio tijolo; cotas correspondem ao desenho gerado; recintos fecham sem colisões ou lacunas indevidas.

### RF-04 — Modo Fiada: inspeção e ajustes construtivos

O modo Fiada exibe a distribuição real de peças da fiada selecionada, com contornos individuais, furos, orientação e tipos. Inteiro, meio tijolo, canaleta, meia canaleta e peça especial deverão ser distinguíveis por representação geométrica, símbolos e cores. A legenda será compacta e recolhível.

Um controle mostrará **Fiada atual / total**, com anterior, próxima e escolha direta pelo número. Mostrar também o intervalo de altura em relação ao piso, usando o passo vertical efetivo. Nos extremos, anterior/próxima ficará indisponível. Quando paredes tiverem alturas diferentes, cada trecho deixará de apresentar peças ao atingir seu término, sem prolongamento artificial.

Ao mudar de fiada, manter pavimento, zoom e posição do canvas. Ao trocar de pavimento, recuperar sua última fiada válida. Ao entrar em Fiada pela primeira vez, iniciar na primeira fiada; visitas seguintes recuperarão a última seleção válida. Se a altura mudar e a fiada anterior deixar de existir, selecionar a última válida e informar a mudança.

Será possível sobrepor a fiada anterior ou seguinte com transparência, apenas como referência visual. Essa camada não receberá cliques de edição. Vãos deverão aparecer somente onde a faixa vertical da fiada interceptar a abertura. Nas fiadas de canaletas, mostrar os canais, conexões e peças modificadas realmente gerados, incluindo cintas, vergas e contravergas.

O modo Fiada permitirá ajustar grauteamentos e encontros, e selecionar elementos em canaletas para ajustes previstos no RF-07. Criar ou alterar a geometria arquitetônica de paredes e vãos será feito em Planta; em Fiada, a seleção poderá oferecer ação compacta “Editar na Planta”, preservando a localização.

**Grauteamento:** uma ferramenta contextual permitirá selecionar posições de furos, adicionar ou remover graute por clique no furo nominal correspondente. Cada ajuste afetará todo o trecho vertical do pavimento, desde a referência de início da alvenaria até seu limite superior definido no RF-13, independentemente da fiada usada para iniciar a edição. A prévia mostrará o destino, os limites verticais e as interrupções antes de confirmar. Portas, janelas e demais vãos serão respeitados: não haverá graute no espaço vazio de uma abertura. O motor dividirá o trecho em intervalos de alvenaria aplicáveis e atualizará todas as fiadas correspondentes. Uma retomada acima de um vão será representada como intervalo separado, sem indicar continuidade física através da abertura. No M3, verificar apenas existência de alvenaria e alinhamento dos eixos nominais; não verificar passagem física nem gerar pendência por dimensão interna desconhecida. O ajuste não atravessará automaticamente a laje para outro pavimento.

**Encontros:** selecionar o encontro realça sua região e oferece alternativas gráficas. A edição estará disponível somente na primeira fiada, conforme RF-05. Em outra fiada, mostrar “Altere o encontro na primeira fiada” com ação para navegar até ela. A alternativa terá prévia antes de confirmar; a confirmação propagará a amarração até o limite superior da alvenaria e atualizará as peças e elementos relacionados.

O resultado deverá distinguir sugestão automática de ajuste manual por indicador discreto visível ao selecionar o elemento. Não haverá troca de regras, edição de código ou parâmetros técnicos do motor na interface.

**Aceite:** navegar apresenta todas as fiadas reais; canaletas aparecem nas alturas geradas; grautes são distinguíveis de furos vazios; encontro não pode ser editado acima da primeira fiada; mudar o modo preserva o projeto e o enquadramento; referências sobrepostas não são editáveis.

### RF-05 — Encontros automáticos e editáveis

**Recorte histórico aprovado para M2:** L alternado e T com parede principal contínua e ramal encostado, conforme [caderno técnico](Ecovit-Caderno-Tecnico.md). O T indica necessidade de ligação complementar, sem dimensioná-la. A cruz foi reconhecida e diagnosticada, com composição automática excluída de M2 e dos incrementos implementados até M3.4. Por solicitação de 13/10/2026, M3.5 passa a exigir suporte nominal à cruz conforme §22 e CT-12; essa especificação não representa funcionalidade já implementada.

O Ecovit reconhecerá encontros em L, T e cruz e definirá automaticamente uma composição compatível com os padrões suportados, conforme as convenções nominais documentadas no caderno técnico. Considerará alternância das peças, fechamento geométrico das paredes, alinhamento dos eixos nominais e representação de canaletas. Peças especiais e sua preparação só serão incorporadas quando houver procedimentos documentados; a composição nominal não comprova amarração resistente ou passagem física.

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

**Aceite:** arrastar mostra a prévia modular; soltar insere um indicador gráfico distinto para cada tipo; mover e redimensionar respeita o módulo horizontal; editar base ou altura valida os limites das fiadas e atualiza os tijolos e elementos associados. Um vão que invade células compartilhadas de um encontro apresenta conflito localizado. Quando intercepta um eixo de graute, seus intervalos são recalculados para excluir a abertura, sem gerar conflito apenas por essa interseção. Ajustes que perderem seu alvo geométrico permanecem registrados como pendentes e localizáveis.

### RF-07 — Canaletas e grauteamentos nominais configuráveis

O Ecovit gera um desenho nominal automático, configurável e editável. Não verifica passagem física em furos/canais nem dimensiona a solução. O tamanho-base determina a malha e o envelope das peças, não resistência ou armadura.

Configurações do projeto: lista de níveis de canaletas com valores iniciais, adicionar/remover nível e restaurar padrões; quatro opções independentes de graute automático (encontros, laterais dos vãos, pontas livres e intervalos em paredes longas); distância máxima entre grautes, inicialmente 100 cm. Campos de vãos e níveis seguem a referência vertical definida na seção 20. A lista de níveis é uma preferência de desenho, não um conjunto de regras estruturais.

As faixas de canaletas percorrem a parede no nível escolhido, respeitando aberturas. Além delas, gerar automaticamente uma fiada de canaletas imediatamente acima e abaixo de cada vão, independentemente de ser porta, janela ou abertura. Sem canaleta inferior quando o vão começa na primeira fiada; sem acrescentar parede acima do seu topo. Ocupações coincidentes se unificam, sem peças duplicadas. Cada faixa associada a vão cobre sua largura mais um meio tijolo de cada lado, conforme seção 20.

Graute automático obedece às opções habilitadas e ao intervalo máximo configurado. Em Fiada, um furo com graute é preenchido em cor escura; no hover, furo vazio mostra + e furo grauteado mostra −. Clique adiciona/remove o eixo vertical em toda a extensão de alvenaria correspondente no pavimento, descontando aberturas. Esses sinais também têm identificação textual acessível. Não criar graute apenas na fiada clicada.

Permitir remover canaletas somente na Fiada onde aparecem; renderizar canaletas com canal longitudinal distinto de tijolos comuns, não apenas outra cor. Não mostrar suas peças na Planta. Preservar remoções e adições após qualquer recálculo, inclusive alteração das configurações. A automação é ponto de partida: supressões manuais prevalecem sobre a reposição automática, sem diagnóstico estrutural de ausência.

**Aceite:** configurações persistidas; faixas e grautes automáticos gerados pelas regras nominais documentadas; clique +/− afeta todo eixo respeitando vãos; remoção de canaleta afeta somente o alcance indicado na prévia; nenhuma escolha reaparece silenciosamente; desenho distinto por tipo de peça.

### RF-13 — Lajes de piso e cobertura

Permitir criar lajes por contorno ortogonal simples, sem auto-interseções, associado a pavimento e cota, com espessura definida pelo usuário. Será possível editar contorno, nível, espessura e aberturas, também ortogonais simples e contidas na laje. No M4, permitir no máximo uma laje por pavimento, cadastrada como fechamento do pavimento inferior; ela poderá servir de piso ao superior ou de cobertura quando não houver outro andar. Múltiplas lajes em níveis distintos no mesmo pavimento ficam para evolução futura.

A mesma ferramenta atenderá lajes de piso e de cobertura. A finalidade poderá ser indicada como informação. A cota será sempre a da face superior; a face inferior será essa cota menos a espessura. A espessura será armazenada apenas na laje, sem campo duplicado no pavimento.

Cada parede terá altura inicial herdada do padrão do pavimento e editável. Seu topo solicitado será a referência de início da alvenaria mais essa altura. Quando uma laje de fechamento associada cobrir o trecho, seu limite superior será o menor entre esse topo e a face inferior da laje. Sem laje de fechamento, valerá o topo solicitado. Limites incompatíveis com fiadas serão sinalizados com alternativas, sem cortes ou arredondamentos silenciosos. Grauteamentos e encontros respeitarão a alvenaria existente em cada trecho. Não haverá modelagem de telhados: a altura da parede será suficiente para representar seu término.

Lajes aparecerão como camada 2D e participarão da coordenação de paredes, cintas e grauteamentos. Serão limites para a propagação dos encontros quando encerrarem o trecho de parede. Sua criação não criará outro pavimento automaticamente.

Decisão de produto de 14/10/2026 para M4: preservar a altura solicitada de cada parede e limitar somente sua composição nos trechos cobertos pela laje. Em trechos fora do contorno ou sob aberturas da laje, manter o topo solicitado. A mesma parede poderá ter limites efetivos diferentes ao longo de sua extensão. Se o limite não comportar fiadas completas, apresentar alternativas para decisão do usuário, sem cortes ou arredondamentos silenciosos. Essa definição é nominal e não determina apoio ou dimensionamento estrutural.

Após alterar a cota ou espessura da laje, propor a atualização das cotas do pavimento superior afetadas pela mudança, explicitando valores anteriores e propostos; aplicar essas alterações somente após confirmação. Até essa confirmação, conservar as cotas existentes e informar eventuais conflitos. Não presumir deslocamento automático em cascata de outros pavimentos ou substituição de cotas personalizadas; os detalhes da proposta serão definidos no incremento correspondente.

**Aceite:** alterar a espessura atualiza as cotas das faces e evidencia conflitos nos elementos dependentes; a laje delimita a propagação associada. Dimensionamento resistente e armaduras da laje ficam fora desta entrega.

### RF-08 — Até três pavimentos

O projeto começará com um térreo e propriedades iniciais visíveis e editáveis, sem exigir cadastro prévio de todos os níveis. Adicionar, renomear, duplicar e remover pavimentos até o limite de três. Cada pavimento terá cota de piso acabado, referência de início da alvenaria e altura padrão para novas paredes. Alterar o padrão não modificará silenciosamente paredes existentes. A espessura pertencerá exclusivamente à laje associada.

Compartilhar origem e coordenadas horizontais. Permitir sobreposição do pavimento adjacente para comparar paredes, vãos, aberturas de laje e reservas verticais. Duplicar um pavimento criará elementos independentes com novos identificadores.

Decisões de produto de 14/10/2026 para M4: cada pavimento funciona como uma nova Planta, com seus elementos próprios; a numeração das fiadas reinicia em 1 a partir de sua referência de início da alvenaria, independentemente da cota global. Ao criar um pavimento superior, sugerir o início da alvenaria na face superior da laje de fechamento do inferior. Sem laje cadastrada, sugerir a referência de início da alvenaria inferior mais sua altura padrão de paredes. A sugestão será apresentada para conferência e edição antes de confirmar; não acrescentar espessuras presumidas de laje, contrapiso, revestimento ou outras camadas. A regra de sugestão não confunde início da alvenaria com cota de piso acabado, que permanece propriedade distinta.

Desalinhamentos e interrupções serão informados para revisão, sem serem interpretados automaticamente como aprovação ou reprovação estrutural. Escadas e aberturas de laje poderão ser representadas por contornos de referência.

**Aceite:** o quarto pavimento é impedido; alterar uma parede duplicada não modifica a original; um reforço marcado como contínuo entre pavimentos apresenta qualquer descontinuidade geométrica.

### RF-09 — Edição simples e recálculo automático

As peças serão geradas pelo motor, sem substituição, orientação ou bloqueio manual de tijolos individuais. Na Planta, o usuário criará, excluirá e alterará o tamanho das paredes por ambas as extremidades, conforme RF-02. Em Fiada, permanecerão apenas os ajustes de encontros, grauteamentos e canaletas definidos nos RF-04, RF-05 e RF-07.

Após cada alteração geométrica ou construtiva confirmada, marcar o resultado como desatualizado e recalcular automaticamente o projeto inteiro, uma operação por vez. Alterações de nome, seleção e câmera não exigirão cálculo. É aceitável aguardar o processamento com novas edições temporariamente indisponíveis; não haverá fila de edições ou botão de regeneração no fluxo normal. Preservar ajustes compatíveis. Ajustes incompatíveis permanecerão registrados como pendentes, sem aplicação à composição, com ação para localizar e corrigir ou descartar o ajuste. Uma falha de cálculo manterá o modelo editável e permitirá tentar novamente.

**Aceite:** ambas as extremidades permitem redimensionar paredes; alterações confirmadas recalculam automaticamente; ajustes incompatíveis não desaparecem silenciosamente; resultados desatualizados não são apresentados como atuais nem usados nos quantitativos.

### RF-10 — Diagnóstico e estado do projeto

Exibir problemas por gravidade, pavimento, fiada e elemento, com acesso à localização e explicação simples do problema. Categorias mínimas: modulação, colisão, lacuna, encontro sem solução, vão incompatível, canaleta descontínua, furo desalinhado e conflito com ajuste construtivo. Lista contextual acionada pelo indicador mostra causa, IDs/localização, faixa de fiadas, consequência e ações Localizar/Ver fiada/Editar na Planta conforme o alvo.

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

### Iconografia consistente

Diretriz registrada em 14/10/2026: ações e indicadores da interface atual e futura devem usar um único catálogo amplo, com traços uniformes, aparência refinada, contraste legível e alinhamento central. Mesma ação conserva símbolo e significado em todo o aplicativo. Ícones complementam rótulos; controles sem texto têm nome acessível e dica visual. Não misturar emoji ou caracteres de fonte com ícones de ação/status. Logotipo e desenhos técnicos do canvas preservam sua identidade e significado. Biblioteca, variantes, exceções e verificações são definidos na [Arquitetura §2.1](Ecovit-Arquitetura-Tecnica.md#21-padrão-de-iconografia--14102026). Migração para Lucide React implementada, com resultados no plano e teste manual/aceite pendentes; formatos e regras do motor preservados.

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

Atualização de M3: o alcance nominal confirmado na seção 20 dispensa pesquisa de dimensões internas, apoios e armaduras como pré-condição do desenho. As fontes físicas permanecem contexto, não parâmetros automáticos. Novos procedimentos físicos exigirão evidência apenas se futuramente incorporados ao produto.

O Ecovit terá um conjunto único de convenções nominais documentadas no caderno técnico, sem seleção de conjuntos de regras pelo usuário, regras versionadas na interface ou fluxo complexo de aprovação. A pesquisa construtiva fundamentará os algoritmos correspondentes, distinguindo evidências físicas de convenções do modelo e respeitando o alcance nominal de M3 definido na seção 20. Poderá ocorrer durante a implementação do canvas e da persistência no próprio aplicativo.

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

O caderno técnico foi posteriormente produzido para M2 e ampliado com a proposta de M3. A seção 13 preserva a consulta inicial; o caderno registra as evidências e lacunas atuais por entrega.

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
| Reserva vertical de reforço | Eixos nominais alinhados nos intervalos de alvenaria aplicáveis, sem comprovação de passagem física |
| Ajustar graute em qualquer fiada | Todas as fiadas do trecho vertical são atualizadas, respeitando vãos |
| Graute na posição de uma janela | Intervalos abaixo/acima separados, sem graute no vazio |
| Incluir ou remover graute | Clique no eixo nominal afeta todos os seus intervalos de alvenaria no pavimento, respeitando aberturas e sem atravessar a laje; movimentação por arraste fora de M3 |
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

Registro histórico da definição inicial: os marcos foram posteriormente criados no plano incremental. M1 e M2 estão aprovados; o estado de M3 está na seção 20.

## 13. Referências e limites da pesquisa

Consulta realizada em 10 de outubro de 2026, em páginas públicas. Não houve avaliação prática do editor Tijocad, de seus algoritmos ou dos resultados construtivos gerados.

- [TijoCAD — site oficial](https://www.tijocad.com.br/): anuncia editor web, modulação de paredes/vãos e visualização de fiadas, além de recursos 3D. Serve como referência de experiência e categoria de produto; não é fonte de regras técnicas para o Ecovit.
- [Tijolo Ponto Eco — Manual de Projeto com Tijolo Ecológico](https://tijolo.eco.br/manual_projeto_tijolo_ecologico/): apresenta, para seu exemplo de tijolo 30 × 15 × 7 cm, modulação de 15 cm; descreve a primeira fiada com posicionamento de elementos e recomenda projeto estrutural. A medida citada é específica desse exemplo, não requisito universal do Ecovit.
- [Permaq — Tijolos](https://permaq.com.br/maquina/tijolos): a descrição pública localizada na pesquisa menciona diferentes tamanhos e tipos, incluindo meios e canaletas. A página não abriu integralmente nesta consulta; deverá ser confirmada com documentação do fornecedor antes de compor qualquer catálogo.

As especificações funcionais deste PRD são propostas para o Ecovit. A pesquisa pública não valida padrões executivos de encontros, detalhamento de armaduras ou viabilidade de edificações com três pavimentos.

## 14. Alterações da versão 0.3

As seções 14 a 19 registram a evolução das decisões. Os requisitos funcionais devem refletir as definições atuais; para M3, prevalecem as decisões confirmadas na seção 20 sobre formulações anteriores.

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

## 20. Definições de M3 após retorno do solicitante — 12/10/2026

**Decisões confirmadas:** alcance exclusivamente nominal; configurações de projeto para canaletas e grautes; canaletas globais por níveis e automáticas acima/abaixo de todos os tipos de vãos; grautes opcionais por categoria, intervalo máximo padrão 100 cm; inclusão/remoção por clique +/−; supressões preservadas. M3.1 implementa vãos e seus padrões; M3.2 implementa canaletas, níveis globais e supressões/restauração; M3.3 implementa grautes e seus controles. Evidências e aceite manual no plano.

Tela “Configurações do projeto”, acessível no editor, compacta e inspirada no print fornecido: grupos Vãos, Canaletas e Graute vertical. Não copiar abas ou controles sem função solicitada, como armaduras, grampos e idioma. Aplicar confirma uma única operação de histórico e recálculo; Cancelar não modifica nada. Restaurar padrões atua no grupo e só efetiva ao aplicar; não apaga ajustes manuais existentes.

Apresentação revisada em 14/10/2026 por solicitação: três grupos lado a lado em telas de computador, com campos/padrões visíveis sem rolagem nos tamanhos comuns. Explicações longas ficam nos ícones “i”, acessíveis por clique e teclado; altura resultante e fiadas permanecem visíveis. Aplicar e Cancelar ficam em rodapé sempre acessível. Listas extensas de canaletas podem rolar dentro do grupo; telas pequenas/baixas permitem rolagem do conteúdo, sem esconder ações ou limitar a quantidade de níveis. Sem alterar valores, regras, ajustes ou formato do projeto.

Restaurar padrões de configuração é diferente de restaurar ajustes automáticos: a primeira ação preserva inclusões/exclusões e supressões; a segunda remove explicitamente o ajuste escolhido para permitir novamente a automação.

| Grupo | Campos e comportamento |
|---|---|
| Vãos | Base padrão de janela/vão elevado e topo padrão dos vãos, em relação ao piso; porta inicia na base zero. Altura é topo menos base, sempre visível. Os valores inicializam novas inserções, não redimensionam vãos existentes. |
| Canaletas | Lista de alturas em cm referidas ao piso, interpretadas como topo da fiada de canaleta; mostrar número da fiada. Adicionar/remover nível e restaurar padrões. Alterar níveis regenera as faixas globais existentes. |
| Graute vertical | Quatro opções independentes: encontros, laterais dos vãos, pontas livres e intervalos em paredes longas. Distância máxima positiva utilizada na distribuição por intervalos. Desabilitar uma categoria remove seus automáticos, preservando inclusões manuais. |

### Padrões normativos de M3

Esta tabela é a referência dos valores iniciais para novos projetos. Os efeitos de Aplicar, Cancelar e Restaurar e os campos configuráveis estão definidos acima; a inicialização de projetos legados está na [Arquitetura §15](Ecovit-Arquitetura-Tecnica.md#15-contratos-de-m3-nominal--12102026).

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

**Recorte de vãos confirmado em 12/10/2026 (D3-02):** proibir sobreposição de volumes de aberturas. Na mesma parede, vãos lado a lado cujos intervalos verticais se sobrepõem exigem separação horizontal mínima de um módulo (largura-base); contato sem essa separação não é permitido e aberturas não são unidas automaticamente. Permitir vãos empilhados, com projeções horizontais parcial ou totalmente coincidentes, desde que haja pelo menos uma fiada completa de alvenaria entre eles. Essa fiada pode atender simultaneamente à canaleta superior do vão inferior e à inferior do vão superior; unificar as regiões coincidentes, sem duplicar peças nem exigir duas fiadas distintas. São limites de desenho nominal, sem validação estrutural. A separação vertical é validada desde M3.1, com canaletas geradas em M3.2; ajustes voluntários de canaleta continuam permitidos e não alteram a regra de separação dos vãos.

Na Planta, permitir escolher entre vãos empilhados na mesma posição por seletor contextual, identificando tipo, base e topo; na Fiada, mostrar somente as aberturas que atingem a altura ativa.

Em Planta, arrastar sobre parede fixa define início/fim modular do vão. Prévia mostra posição, largura e base/topo dos padrões do projeto. Selecionar permite editar campos, arrastar corpo na mesma parede ou ambas as alças com ponta oposta fixa. Não reatribuir vão a outra parede implicitamente. Escape, perda de foco e soltura fora cancelam; navegação central/Espaço não altera elementos. Porta/janela/vão têm símbolos distintos, além da cor; folha/sentido de abertura não são inferidos. Excluir parede informa o alcance e remove seus dependentes na mesma operação desfazível.

Um vão selecionado na Planta poderá ser excluído por ação contextual ou pela tecla Delete, quando o foco não estiver em um campo de edição. A exclusão remove somente o vão e suas dependências, preservando a parede e as demais aberturas. O aplicativo recalcula a alvenaria. Excluir, desfazer e refazer constituem operações de histórico; desfazer restaura o mesmo ID, posição, dimensões e relações do vão.

Canaleta imediatamente acima do vão tem sua base no topo da abertura; canaleta inferior tem seu topo na base da abertura. A regra vale para porta elevada também. Se não houver alvenaria inferior/superior, não criar peça fora da parede. Faixas globais atravessam toda parede, excluindo células dos vãos; uma faixa coincidente com outra automática produz uma única ocupação. Não exigir colunas de apoio nem pesquisa de cotas físicas para gerar esse desenho nominal.

**Alcances confirmados pelo solicitante:** canaleta associada a vão ocupa sua largura mais meio tijolo de cada lado, ou seja, um módulo horizontal por lado. Remover canaleta afeta toda a faixa da parede selecionada naquela fiada, incluindo trechos separados por aberturas e todas as origens automáticas coincidentes. Outras fiadas são preservadas. Não é exclusão de tijolo individual. A extensão lateral é uma convenção nominal de desenho escolhida pelo usuário, não apoio dimensionado.

Grautes ocupam eixos nominais e todos os intervalos de alvenaria correspondentes no pavimento, sem atravessar o vazio. Só furos da fiada ativa recebem clique/hover; camada de referência não é editável. Furo vazio: + e “Adicionar graute”; preenchido escuro: − e “Remover graute”. Fora da ferramenta contextual de graute, clique mantém seleção normal. Remover um automático grava exclusão persistente; adicionar novamente desfaz essa exclusão. Não recalcular preenchimento intermediário para contornar a intenção do usuário.

Canaletas são visíveis apenas em Fiada, desenhadas com canal longitudinal e distinção de inteiro/meio nominal; não se infere corte executado ou dimensão física de cavidades. Selecionar faixa na fiada oferece Remover e realça o alcance inteiro antes da ação. A célula volta a tijolo comum da mesma paginação; remover canaleta não abre buraco na alvenaria. Supressão vale também quando várias origens automáticas exigem a mesma faixa.

Ajustes autorizados neste recorte: incluir/remover grautes e remover/restaurar canaletas; configurar níveis globais. Movimento livre de elementos, apoios, aço, grampos, dimensionamento e verificações físicas ficam fora. Retirar um elemento não representa erro estrutural nem demanda reposição compulsória. Diagnósticos cobrem somente integridade, modulação, ocupação e ajustes sem alvo geométrico. Desenhos são o objetivo atual; quantitativos permanecem previstos para evolução futura, sem volumes de graute inferidos de furos sem dimensões.

O [plano, seção 7](Ecovit-Plano-Implementacao.md) organiza a implementação por incremento e registra os resultados de M3.1/M3.2/M3.3. CT-09/10 e exemplos do [caderno, seção 8](Ecovit-Caderno-Tecnico.md) substituem os antigos bloqueios físicos de M3; fontes anteriores continuam como contexto, não parâmetros estruturais do aplicativo. Na migração para M3.2, níveis globais iniciam vazios e sua ativação exige configuração explícita; as faixas locais de vãos existentes seguem CT-09 automaticamente. Na migração para M3.3, categorias automáticas de graute iniciam desligadas, ativadas explicitamente por configuração; níveis/supressões existentes são preservados. Canaletas e controles de graute aparecem somente na Fiada.

As fórmulas, limites geométricos, paginação e exemplos são definidos em CT-07–10 do caderno; representação persistente, identidade dos ajustes e processamento estão na Arquitetura §15. Os critérios e evidências de cada incremento ficam no plano.

## 21. M3.4 — Evolução da edição no canvas — 13/10/2026

Esta revisão evolui RF-02/03/06/07/09/10/11/12. M1/M2/M3.1–3.3 mantêm os relatos e aceites da versão entregue; M3.4 tem verificações próprias e recebeu aceite global em 14/10/2026. Implementação de M3.4 foi solicitada após a revisão documental; resultados e aceite separado no Plano §8. As regras abaixo substituem a antiga proibição de mover paredes e complementam as regras de identidade e supressão de §20, apenas nas operações novas.

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

### Decisões de preservação confirmadas

- **D34-01 — Supressão ao unir:** preservar somente os trechos das paredes originais; não suprimir o novo intervalo de ligação nem ampliar para outra parede anteriormente não suprimida. Ajustes existentes mantêm IDs. Novas remoções pela Fiada continuam abrangendo a parede consolidada inteira. A interface deve distinguir supressão de trecho herdado da supressão da parede inteira e permitir restaurar cada ajuste identificado; não é edição de tijolo individual.
- **D34-02 — Graute compartilhado ao mover:** preservar o ajuste nas associações das paredes que ficam e criar uma cópia com novo ID, coordenada transladada e associação à parede movida. Vale para inclusão e exclusão. Se o ajuste pertencer somente à parede movida, transladar o original sem cópia. Não mover o eixo da parede vizinha. Reconciliação de eixos coincidentes segue a precedência de exclusão de CT-10, sem perda dos registros de intenção.

Se ajustes preservados coincidirem no mesmo eixo, qualquer exclusão aplicável prevalece sobre inclusões, independentemente da ordem dos registros. Adicionar/remover pelo furo define a ação explicitamente em todos os ajustes aplicáveis daquele eixo, conservando IDs e associações; não apagar ajustes pendentes na mesma coordenada. Descartar um ajuste continua agindo apenas pelo seu ID. Supressões de canaleta também são restauradas pelo ID escolhido; não restaurar todos os trechos da mesma parede/cota implicitamente.

As regras geométricas e exemplos estão em CT-11/EX-36–48 do caderno; dados/migração na Arquitetura §16; tarefas, aceite e roteiro no Plano §8. Sem nova regra resistente, divisão/rotação de paredes, edição de tijolos, lajes, pavimentos ou quantitativos.

## 22. M3.5 — Composição nominal de encontros em cruz — 13/10/2026

**Solicitação:** incluir suporte à cruz, inclusive quando integrada a um contorno fechado com encontros L/T. Implementação posteriormente autorizada e entregue no aplicativo 0.7.0; verificações e aceite global de 14/10/2026 no Plano §9. Complementa RF-04/05/07/09/10/12 e substitui a exclusão da cruz somente na nova entrega; os relatos e contratos anteriores permanecem históricos.

Uma cruz ortogonal com quatro ramos de alvenaria deve receber composição automática conforme CT-12, sem exigir que o usuário altere medidas, separe paredes ou transforme o cruzamento em dois T. Resolver o componente conectado inteiro, incluindo contorno externo e divisórias; uma cruz suportada não pode apagar as peças desse conjunto. Não basta mostrar apenas uma cruz isolada resolvida. Modelagem nominal não comprova ligação resistente entre paredes.

A convenção geométrica de CT-12 usa uma faixa principal contínua horizontal na fase A e vertical na B, com os dois ramos transversais terminando na face de contato. A célula central é ocupada uma vez. Manter pareamento de células, alternância global e limites geométricos documentados; não desenhar peça em L/cruz nem alterar faces, espessuras ou comprimentos. Não apresentar a troca de direção como amarração estrutural comprovada. Alternativa na primeira fiada inverte a fase do componente inteiro, com prévia/confirmar/cancelar; sem escolhas independentes que disputem a mesma ocupação.

Integrar vãos, canaletas e grautes pelos contratos existentes após compor a alvenaria. Vãos não podem invadir a célula compartilhada do encontro nas alturas em que as paredes coexistem; um vão acima de uma parede encerrada não invade o encontro inferior. Preservar edição indireta incompatível com diagnóstico. Canaletas coincidentes e eixo de graute do cruzamento não duplicam por parede/origem. Ajustes, movimento/união de paredes, histórico e transporte permanecem aplicáveis. Classificar a geometria existente em cada fiada, preservando fase quando a cruz se tornar reta após terminar uma das paredes.

Para conflito real de ocupação, alturas sem padrão, escolha pendente ou combinação de encontros incompatível, manter diagnóstico localizável e componente afetado sem composição; outros componentes continuam visíveis. Não usar o simples reconhecimento de cruz como erro. Informar a consequência: “Composição suspensa em N paredes conectadas: [motivo]”, destacando encontro e paredes afetadas. Snapshots antigos com cruz bloqueada permanecem validados pelo contrato original antes da migração; o editor atual não deve atribuir suporte ausente à modulação nem usar mensagem operacional dependente de “no M2”.

CT-12/EX-51–55 define geometria/exemplos; Arquitetura §17 define processamento/migração; Plano §9 define tarefas/aceite. Sem lajes, múltiplos pavimentos, quantitativos, aço, peças especiais ou validação estrutural. M3.4 também recebeu aceite global em 14/10/2026.
