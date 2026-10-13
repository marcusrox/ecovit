# Ecovit — Caderno técnico

**Revisão:** 9 — M3.3 implementado com composição nominal-v6
**Estado:** M2 e M3.1 aprovados em 12/10/2026; M3.2 aprovado em 13/10/2026. CT-10 implementado em M3.3, aguardando teste manual/aceite.\
**Alcance implementado:** composição geométrica de paredes, vãos, canaletas e grautes em um pavimento, conforme [plano §7](Ecovit-Plano-Implementacao.md). O [PRD](Ecovit-PRD.md) continua sendo a referência de produto. CT-07/08/09 preservados; CT-10 e EX-22/32–34 exercitados por posições/intervalos independentes, categorias e ajustes. Evidências e limites por critério estão no plano.

## 1. Evidência, convenção e limite

Este caderno distingue **evidência da fonte**, **convenção do modelo** e **lacuna**. Os exemplos calculados abaixo são especificações geométricas próprias do Ecovit; não são detalhes executivos certificados por fabricantes. Nenhuma regra aqui dimensiona resistência, armadura, graute ou apoio.

O solicitante aprovou as onze direções de solução e, após a pesquisa, as propostas técnicas P1–P5 desta revisão. M2 inclui T com parede principal contínua e ramal encostado, identificado como composição geométrica que requer ligação complementar. Inclui também a transição simples L → reta. A cruz será reconhecida, mas sua composição automática fica explicitamente fora do primeiro M2. Não transformar preenchimento de área em amarração estrutural validada.

### Decisões aprovadas — correspondência com a lista apresentada

| Item | Decisão |
|---|---|
| 1 | Passo nominal igual à altura-base, sem configuração de junta em M2; alternativas para alturas incompatíveis |
| 2 | Furos representados por eixos centrais; somente alinhamento nominal em M2 |
| 3 | Meio tijolo como peça disponível; sem rendimento presumido de corte |
| 4 | L com alternância do ramo que ocupa o canto; completar limites e exemplos pares/ímpares, rotações e reflexões |
| 5 | T básico resolvido obrigatório em M2, após pesquisa; uma solução basta, sem exigir várias alternativas; distinguir eventual ligação complementar da composição |
| 6 | Após pesquisa e decisão do solicitante, reconhecer cruz e diagnosticar; composição automática excluída do primeiro M2 |
| 7 | Encontros próximos só são suportados quando fecham conjuntamente; verificar células e peças reservadas em todas as fases, sem distância universal arbitrária ou solver genérico |
| 8 | Alternativas documentadas e compatíveis; prévia de todas as regiões afetadas; alteração somente na primeira fiada |
| 9 | Encontro até o término da parede curta; acima, parede restante segue padrão reto e fase do pavimento; verificar a transição |
| 10 | Planta completa; componente conectado sem solução fica sem peças em Fiada; destacar causa e manter componentes independentes visíveis |
| 11 | M2 exige retas, L, retângulo, T básico, transição simples de alturas, inspeção e persistência; cruz somente reconhecida e diagnosticada; diagnóstico não conta como composição resolvida |

As definições aprovadas P1–P5 estão consolidadas na seção 5. A verificação do aplicativo ainda ocorrerá na implementação; não se confunde aprovação da especificação com teste executado.

## 2. Fontes consultadas e alcance

Consulta em 10/10/2026. As páginas não informam claramente uma revisão técnica vigente. URLs públicas podem mudar; os localizadores abaixo permitem conferir a evidência. Os dois PDFs foram lidos, inclusive figuras; a paginação indicada é a do arquivo PDF, começando em 1.

| ID | Fonte e localizador | Evidência utilizada | Limite |
|---|---|---|---|
| F1 | Ponto Eco — [Manual para projetos](https://tijolo.eco.br/manual_projeto_tijolo_ecologico/), seções Modulação e Primeira fiada | Exemplo 30 × 15 × 7 cm; malha baseada no meio tijolo; necessidade de estudar a primeira fiada | Não fornece regra universal para toda base personalizada ou todo encontro |
| F2 | Ponto Eco — [Tijolo ecológico](https://tijolo.eco.br/produtos/tijolo_ecologico/), dimensões e apresentação do encaixe/junta seca | Produto nominal 30 × 15 × 7 cm e possibilidade de montagem por encaixe sem argamassa | Não demonstra que todo produto tem altura instalada igual à altura nominal; não universalizar diâmetros |
| F3 | Ponto Eco — [Manual de construção](https://tijolo.eco.br/manual_construcao_tijolo_ecologico/), Posicionamento da primeira fiada e Malha estrutural | Conferência inicial da planta; nivelamento da primeira fiada; tratamento específico da ligação entre paredes internas e externas com grampos | Ligação por grampo não comprova amarração apenas pela alternância dos tijolos; não adotar seus dimensionamentos no Ecovit |
| F4 | Jarfel/Sahara — [Brick](https://www.jarfel.com.br/pdf-jarfel-sahara/brick.pdf), PDF p. 23 | Figura apresenta afastamento de 1–2 mm entre peças lado a lado | Essa cota não determina a junta horizontal de assentamento nem autoriza somar 2 mm à altura de cada fiada |
| F5 | Eco Produção — [Cartilha de construção](https://www.jarfel.com.br/pdf-jarfel-sahara/cartilha-eco-producao.pdf), PDF pp. 5, 7, 10 e 12 (impressas 8–9, 12–13, 18–19 e 22–23) | Exemplo com altura 6,25 cm; meios tijolos em encontros; preparação por molde ou corte; ligações também usam elementos metálicos | Não equivale à base de 7 cm; meio nominal não comprova rendimento de corte sem perda; a cartilha se baseia no material Sahara, não é confirmação independente |
| F6 | Márcio Albuquerque Buson / FAU-UnB — [Autoconstrução com tijolos prensados de solo estabilizado](https://www.jarfel.com.br/pdf-jarfel-sahara/autoconstrucao.pdf), 2007, §6.7, p. impressa 61 | Descreve ligações entre paredes por grampos para as peças utilizadas no sistema apresentado | Não fornece padrão universal de paginação para nosso catálogo; não adotar dimensionamentos de reforço |
| F7 | Parsekian e Medeiros / UFSCar — [Parâmetros de projeto de alvenaria estrutural com blocos de concreto](https://abcp.org.br/wp-content/uploads/2021/11/Alvenaria_Estrutural_Parametros_Projeto_2ed.pdf), 2021, capítulo 9 | Distingue ligação direta por interpenetração das peças e indireta por armaduras na interface | Trata de blocos de concreto; não transferir detalhes ou requisitos estruturais automaticamente para solo-cimento |

**Divergências relevantes:** junta seca em F2 não elimina as folgas ilustradas em F4/F5; dimensões nominais e dimensões instaladas precisam ser distinguidas. A altura de F5 não deve substituir os 7 cm escolhidos no produto. Os desenhos de ligação em F3/F5 não autorizam inventar uma solução de T ou cruz com dois padrões alternados.

Não foram consultados textos integrais vigentes de normas ABNT. Não se declara conformidade normativa. O desenho de produto encontrado em `https://ikigai.eco.br/download/tijolos-ikigai.pdf` não pôde ser aberto nesta consulta (HTTP 503); suas cotas não foram adotadas como evidência.

## 3. Convenção geométrica mínima

### CT-01 — Catálogo nominal

Para comprimento `L`, largura `W` e altura `h`, manter `L = 2W` e módulo `m = W`. Unidades persistentes: décimos de milímetro, sem tolerância de arredondamento.

| Peça de M2 | Envelope nominal | Ocupação da malha | Representação de furos |
|---|---|---|---|
| Inteiro | `2m × m × h` | Duas células adjacentes | Dois marcadores, nos centros das células |
| Meio | `m × m × h` | Uma célula | Um marcador no centro |

Rotações apenas de 0° e 90°. Meio é uma peça nominal do catálogo; não declarar que um inteiro cortado produz dois meios utilizáveis. Não gerar peças especiais, cortes, canaletas ou meia canaleta nesta entrega. Não modelar saliências, rebaixos ou espessuras de paredes internas do tijolo sem cotas verificadas.

Os marcadores indicam **eixos nominais**, sem diâmetro físico. O tamanho do símbolo é visual e não participa de validação. A coincidência dos centros permite conferir alinhamento nominal, mas não passagem livre para graute ou instalações. Centros de células podem cair em meia unidade interna quando `m` é ímpar: compará-los por coordenadas duplicadas inteiras; não arredondar nem mudar a precisão do projeto.

### CT-02 — Passo vertical explícito

Para o catálogo geométrico padrão de M2, adotar explicitamente **passo nominal `p = h`**, sem espessura adicional de junta ou de encaixe. É uma convenção de simulação, apoiada na existência de sistemas de encaixe seco em F2, e não uma medida de obra confirmada para todo fabricante. Não inferir esse passo de F4 nem apresentar junta física zero como fato universal.

Essa convenção resolve a geração nominal sem cadastro de fabricante ou novo formulário inicial. Na legenda/propriedades da composição, apresentar uma informação curta: “Modelo nominal: passo igual à altura-base; furos indicam eixos. Confira as dimensões do produto utilizado.” Registrar internamente a convenção no resultado salvo. A lacuna física permanece em L1/L2 abaixo.

Para início da alvenaria `z0`, piso `zf` e fiada `n`, contada a partir de 1:

- Base: `z0 + (n−1)h`; topo: `z0 + nh`.
- Mostrar o intervalo relativo ao piso, subtraindo `zf`.
- Altura de parede `H` é realizável neste modelo quando `H/h` é inteiro positivo.
- Não modificar `H` silenciosamente. Para valor incompatível, oferecer múltiplos imediatamente abaixo/acima, descartando zero.
- Em projeto de M1 já salvo com altura incompatível, conservar o valor e apontar a pendência; não cortar tijolo na última fiada nem mudar a geometria durante migração.
- Paredes com alturas diferentes só participam das fiadas que alcançam. Enquanto ambas existirem, gerar o encontro. Acima do término da parede curta, continuar a restante como trecho reto, mantendo a fase correspondente ao número absoluto da fiada do pavimento, sem reiniciar A. A transição simples de L é obrigatória em M2 (P5; EX-15/16). Outras combinações não cobertas recebem diagnóstico, sem prolongar parede ou cortar peças automaticamente.

Uma futura regra com junta real exigirá revisar esta convenção e migrar explicitamente o resultado. Por exemplo, uma junta entre peças não implica automaticamente altura total `N(h+j)`: sem junta superior, seria `Nh+(N−1)j`. Não introduzir esse segundo modo de cálculo em M2.

### CT-03 — Área ocupada e referência externa

Obter a faixa de cada parede a partir de sua face externa e lado da espessura, preservando o contrato de M1. Calcular a **união das faixas** por fiada: a célula compartilhada de um canto pertence à composição uma única vez. Não deslocar faces externas para facilitar a paginação.

Contato apenas por vértice não cria encontro. Identificar L/T/cruz pela área ocupada e pelos ramos que chegam à região, não apenas pela coincidência de extremidades. A peça compartilhada pode referenciar mais de uma parede; não duplicá-la por parede. Trechos colineares contíguos podem ser tratados juntos no cálculo, conservando IDs. Sobreposição colinear de área positiva, paredes duplicadas e regiões de encontros adjacentes que não caibam nos padrões suportados devem gerar diagnóstico, sem conserto automático do modelo.

### CT-04 — Paredes retas

Em trecho isolado com `N` células, alternar dois padrões:

- A: inteiros a partir da extremidade de menor coordenada; meio no final se necessário.
- B: meio no início, inteiros em seguida e meio no final se necessário.
- Usar A na primeira fiada e B na segunda, repetindo. Inverter o sentido de desenho não altera esse resultado.
- Trecho de uma célula comporta somente um meio, sem alternativa de amarração: sinalizar essa limitação. Não apresentar duas opções idênticas.

### CT-05 — Encontros e alcance da automação

Usar padrões locais explícitos e verificados; não introduzir otimizador, busca combinatória, catálogo de regras editável ou “melhor solução” por pontuação arbitrária. “Alternativa” significa outro arranjo suportado para a mesma região, com cobertura conferida nas fiadas afetadas.

**L simples (P1):** cada ramo deve ter no mínimo `2m`, incluindo a célula compartilhada do canto. É limite geométrico do padrão automático, não distância normativa. Na fase A, paginar o ramo horizontal desde o canto com inteiro e completar com inteiros, deixando meio na ponta livre quando necessário; paginar o ramo vertical restante desde a célula seguinte ao canto do mesmo modo. Na fase B, trocar os papéis dos ramos. Isso cobre comprimentos pares/ímpares sem duplicar o canto. Aplicar rotações/reflexões do padrão. Ramo menor que `2m` permanece desenhável, mas o L recebe diagnóstico de padrão não suportado. A alternativa troca a fase inicial A/B do componente conectado, somente se todos os cantos fecharem. O anel de EX-04 é um padrão explícito para o conjunto, não uma soma de escolhas locais independentes.

**Paginação contínua — nominal-v3 (substitui a regra de U nominal-v2):** após separar os ramais dos T conforme P2, tratar cada percurso sem ramificações pela mesma regra, seja reta, L, U, sequência de cantos ou ciclo fechado. Não reservar a mesma orientação em todos os cantos. Parear células consecutivas no percurso; cada par ortogonal é um inteiro. A mudança de direção ocorre entre pares: o inteiro que ocupa o canto segue uma das direções, sem peça em L. Na fase seguinte, deslocar o pareamento em uma célula, alternando a orientação em cada canto e as juntas. Meios só podem aparecer nas pontas dos percursos abertos, inclusive contatos dos ramais de T; não inserir meio no interior para satisfazer orientação imposta.

Ordenação determinística: células por y e depois x. Percurso aberto começa na primeira extremidade nessa ordem. Havendo cantos, a fase A é ancorada horizontalmente somente no primeiro canto geométrico nessa ordem; a paridade do caminho determina os demais. Essa âncora conserva o padrão do L simples, sem depender de IDs, ordem ou sentido do desenho. Retas mantêm CT-04 e ramais mantêm paginação desde o contato. Ciclo começa na primeira célula e escolhe a próxima priorizando maior x e menor y; a fase B desloca esse início uma célula. Conferir fechamento e quantidade par de células. Alternativa inverte A/B do conjunto inteiro, não cada canto isoladamente.

Percursos devem visitar todas as células uma vez, ter duas extremidades ou formar ciclo, e não apresentar ramificação após a separação dos T. Cruz, sobreposição colinear e transições de altura não suportadas continuam diagnosticadas. O antigo mínimo de quatro células na ponte do U era consequência da reserva simultânea de cantos e deixa de existir. EX-18 demonstra agora a solução coordenada. A regra não usa busca combinatória nem otimização por pontuação.

Revisão motivada pelo feedback sobre o projeto FR: a primeira implementação cobria a área, mas impunha cantos iguais e criava meio junto ao encontro. Esta substituição é uma definição geométrica nominal derivada de CT-03/04 e do pareamento já usado no anel EX-04; não acrescenta regra física, peça especial, junta ou dimensão de fabricante. Fontes construtivas e ressalvas de ligação dos T permanecem; não se alega validação estrutural.

**T básico (P2):** identificar pela geometria a faixa que continua em dois sentidos, mantendo-a contínua em todas as fiadas. A célula central pertence apenas a essa faixa; o ramal é paginado a partir da face de contato, sem sobreposição. Aplicar CT-04 em cada trecho, com a mesma fase do pavimento: principal a partir da menor coordenada e ramal desde o contato para a ponta livre. O T exige ramos nos três sentidos; um trecho de uma célula mantém a limitação de CT-04, sem promessa de amarração alternativa. Não exigir classificação de parede interna/externa nem oferecer outra topologia no M2. O exemplo EX-13 fixa as posições e contagens.

F3 descreve continuidade da parede externa e ligação da interna por grampos; F6 reforça a distinção entre composição e ligação. Aplicar a continuidade ao ramo principal de qualquer T é uma convenção geométrica do Ecovit. Exibir “Composição geométrica resolvida; ligação complementar necessária”. Essa informação não impede a classificação de geometria nominal resolvida quando CT-06 passar, mas deve permanecer visível e persistida. Não desenhar/dimensionar grampos ou graute no M2, nem apresentar encosto como amarração direta.

**Cruz (P3):** composição automática excluída do primeiro M2 por aprovação explícita após a pesquisa. Reconhecer e emitir “Sem solução automática para este encontro”. Não extrapolar a solução T para dois ramais encostados nem inventar ciclo de fiadas. Retomar o tema em revisão futura de escopo, sem incluí-lo automaticamente em M3. EX-11 verifica reconhecimento e diagnóstico, não composição.

Um componente conectado sem padrão completo fica inteiro sem composição no modo Fiada, com destaque no encontro causador. A Planta permanece completa e os componentes independentes resolvidos continuam visíveis. Essa é a regra aprovada, não uma opção de implementação. Isso evita peças cortadas artificialmente na fronteira de uma solução parcial. Esse comportamento é um resultado com pendência, não uma exceção de execução.

**Encontros próximos (P4):** não existe distância universal adotada. Conferir as peças/células exigidas por cada padrão em todas as fases; a mesma peça requerida identicamente pode ser compartilhada uma única vez, mas exigências diferentes sobre a mesma célula são incompatíveis. Conferir também cobertura e alternância do trecho intermediário. Se os padrões não fecharem juntos, diagnosticar o componente; não procurar arranjos arbitrários. Alternativas são oferecidas somente após validação do conjunto e prévia de todas as regiões afetadas. Se houver uma só solução documentada, não inventar alternativas.

Exemplo de reserva local: encontro que usa sua célula central e a vizinha em direção ao outro tem reservas distintas quando os centros estão separados por `3m`; a `2m`, compartilham uma célula. Isso identifica possível disputa, não estabelece mínimo construtivo nem garante o fechamento a `3m`. O padrão explícito do anel e os exemplos EX-17/18 ilustram compatibilidade e conflito.

Escolha manual somente na fiada 1, com prévia e confirmação. Em outra fiada, ação para voltar à primeira. Preservar escolha enquanto a mesma região e alternativa forem aplicáveis. Se uma edição a invalidar, informar conflito e pedir nova escolha ou retorno ao automático; não perder o ajuste silenciosamente. Excluir as paredes do encontro remove o ajuste associado na mesma operação, recuperável por desfazer.

### CT-06 — Validação do resultado

Antes de considerar uma região resolvida, conferir em todas as suas fiadas:

1. Peças pertencem ao catálogo e estão orientadas/posicionadas na malha.
2. Interiores das peças não se intersectam; compartilhar borda é permitido.
3. União das peças é exatamente a área de alvenaria prevista, sem sobra nem célula faltante.
4. Centros nominais coincidem verticalmente onde há alvenaria nas fiadas comparadas.
5. Alternância corresponde ao padrão documentado e alturas respeitam CT-02.

Ausência de colisão não basta para declarar validade. Resultado atualizado pode conter pendências; erro de execução deixa resultado desatualizado. O texto “geometricamente válido” só pode se referir ao **modelo nominal e às verificações implementadas**. Não indicar passagem física de furos, validade estrutural ou atendimento integral ao PRD.

## 4. Exemplos esperados independentes do algoritmo

Coordenadas de células `(x,y)` abaixo são índices inteiros; cada célula mede `m × m`. Um par de células adjacentes representa um inteiro. Exemplos se aplicam a `m = 12,5`, `15` ou `14 cm`, sem alterar sua topologia.

| ID | Entrada | Resultado esperado |
|---|---|---|
| EX-01 | Base 25 × 12,5 × 7; parede isolada 100 cm, altura 21 cm, início/piso zero | 8 células por fiada; 3 fiadas. A: 4 inteiros. B: 3 inteiros + 2 meios. Sequência A/B/A; intervalos 0–7, 7–14 e 14–21 cm |
| EX-02 | Mesma base; parede 87,5 cm | 7 células. A e B: 3 inteiros + 1 meio, em pontas opostas |
| EX-03 | L com células `(0,0),(1,0),(2,0),(0,1),(0,2)` | A: inteiros `[(0,0),(1,0)]` e `[(0,1),(0,2)]`, meio `(2,0)`. B: inteiros `[(0,0),(0,1)]` e `[(1,0),(2,0)]`, meio `(0,2)`. 5 células cobertas, 2 inteiros + 1 meio, sem duplicar canto |
| EX-04 | Anel com dimensões externas `32m × 24m`, espessura `m`, sem divisórias | 108 células por fiada: `32×24 − 30×22`. Duas paginações alternadas ao longo do ciclo, 54 inteiros por fiada; nenhuma célula duplicada nos quatro cantos |
| EX-05 | Base 30 × 15 × 7; parede 120 cm, altura 21 cm | Mesmo resultado topológico de EX-01: 8 células, 3 fiadas; módulo 15 cm |
| EX-06 | Base personalizada 28 × 14 × 7; parede 112 cm, altura 21 cm | Mesmo resultado de EX-01, módulo 14 cm; sem supor fabricante ou diâmetro de furo |
| EX-07 | Alturas 21 e 14 cm em paredes isoladas, `h = 7` | 3 e 2 fiadas; na terceira, a segunda parede não tem peças |
| EX-08 | Altura solicitada 20 cm, `h = 7` | Alternativas 14 e 21 cm, sem alterar antes de escolher. Projeto antigo com 20 cm preserva esse valor e apresenta pendência |
| EX-09 | Piso 10 cm, início 12 cm, altura 21 cm | Bases absolutas 12/19/26 e topo final 33 cm; intervalos relativos ao piso 2–9, 9–16, 16–23 cm |
| EX-10 | T de 5 células: `(-1,0),(0,0),(1,0),(0,1),(0,2)` | A: inteiro `(-1,0)–(0,0)`, meio `(1,0)`, inteiro `(0,1)–(0,2)`. B: meio `(-1,0)`, inteiro `(0,0)–(1,0)`, meios `(0,1)` e `(0,2)`. 2 inteiros + 1 meio em A; 1 inteiro + 3 meios em B; aviso de ligação complementar |
| EX-11 | Cruz de 5 células: centro e seus quatro vizinhos | Cruz reconhecida, diagnóstico e componente sem peças em Fiada. Exclusão aprovada para o primeiro M2; não implica impossibilidade física de outros padrões |
| EX-12 | Duas paredes colineares ocupam a mesma faixa; duas outras tocam somente por um vértice | Primeiro caso: sobreposição sinalizada. Segundo: componentes separados, sem encontro inventado |

Para reproduzir EX-03 com paredes pela face externa: horizontal de `(0,0)` a `(3m,0)` com espessura para `+y`; vertical de `(0,0)` a `(0,3m)` com espessura para `+x`. Usar ambas com altura 21 cm. Para EX-04, manter as quatro espessuras para dentro. Dimensões externas: 400 × 300 cm para base 25; 480 × 360 para base 30; 448 × 336 para base 28.

EX-04 pode ser conferido numerando as 108 células consecutivas do perímetro: A agrupa 0–1, 2–3, …, 106–107; B agrupa 1–2, 3–4, …, 107–0. São pares ortogonalmente adjacentes, inclusive no fechamento. A implementação não precisa armazenar esse percurso como estrutura permanente.

### Exemplos adicionais das definições aprovadas

- **EX-13 — T de 12 células:** principal `(x,0)`, com `x = -4…3`; ramal `(0,y)`, com `y = 1…4`. A: pares horizontais `[-4,-3],[-2,-1],[0,1],[2,3]` e verticais `[1,2],[3,4]`: 6 inteiros. B: meios nas pontas `x=-4,3`, pares `[-3,-2],[-1,0],[1,2]`; no ramal, meios `y=1,4` e par `[2,3]`: 4 inteiros + 4 meios. A célula central nunca pertence ao ramal. Para `m=12,5 cm`, principal de 100 cm e ramal livre de 50 cm, altura de 21 cm, sequência A/B/A. Desenhar principal de `(-4m,0)` a `(4m,0)` com espessura `+y` e ramal de `(0,m)` a `(0,5m)` com espessura `+x`.
- **EX-14 — Paridade e mínimo do L:** ramos de `a,b` células incluindo o canto. A: `floor(a/2)+floor((b−1)/2)` inteiros e `(a mod 2)+((b−1) mod 2)` meios. B troca `a,b`. Para `(2,2)`: 1 inteiro + 1 meio nas duas fases; `(2,3)`: A 2 inteiros, B 1 inteiro + 2 meios; `(3,3)`: 2 inteiros + 1 meio nas duas; `(4,3)`: A 3 inteiros, B 2 inteiros + 2 meios. Ramo com uma célula não atende ao padrão L automático. Posições seguem CT-05, não apenas contagens.
- **EX-15 — Término após fase B:** L de EX-03, horizontal com altura 21 cm e vertical com 14 cm, `h=7 cm`. Fiadas 1/2 seguem EX-03 A/B. Fiada 3: inteiro `(0,0)–(1,0)` e meio `(2,0)`. A faixa vertical acima de 14 cm desaparece; a célula do canto permanece na horizontal.
- **EX-16 — Término após fase A:** mesmo L, vertical com 7 cm. Fiada 1 segue EX-03 A; fiada 2: meio `(0,0)` e inteiro `(1,0)–(2,0)`; fiada 3 igual à terceira de EX-15. A fase não reinicia. Ao inverter a fase inicial por escolha do usuário, inverter toda a sequência, inclusive a reta acima do término.
- **EX-17 — Encontros compatíveis:** anel EX-04. A e B são as duas paginações completas do ciclo; cada opção altera os quatro cantos na prévia. Não oferecer troca isolada que misture fases e produza disputa. Ambas cobrem 108 células com 54 inteiros.
- **EX-18 — U estreito coordenado:** ponte `(0,0),(1,0),(2,0)`, pernas `(0,1),(0,2),(2,1),(2,2)`. A: inteiros `(0,0)–(1,0)`, `(2,0)–(2,1)`, `(0,1)–(0,2)` e meio `(2,2)`. B: inteiros `(0,0)–(0,1)`, `(1,0)–(2,0)`, `(2,1)–(2,2)` e meio `(0,2)`. Ambas cobrem sete células sem disputa. A antiga exigência de dois cantos horizontais era conflitante e foi removida, não a verificação de colisão.
- **EX-19 — U com ponte ímpar:** ponte `(x,0)`, `x=0…4`, pernas `(0,1),(0,2),(4,1),(4,2)`. A: inteiros `(0,0)–(1,0)`, `(2,0)–(3,0)`, `(4,0)–(4,1)`, `(0,1)–(0,2)` e meio `(4,2)`. B: inteiros `(0,0)–(0,1)`, `(1,0)–(2,0)`, `(3,0)–(4,0)`, `(4,1)–(4,2)` e meio `(0,2)`. Cada fase tem quatro inteiros e um meio; nenhum meio no interior ou no canto.
- **EX-20 — Regressão FR:** seis paredes de 412,5/200/200/200/75/225 cm, altura 280 cm e base 25 × 12,5 × 7 cm. Fase A: 16 inteiros horizontais cobrem 400 cm do topo; inteiro vertical em `(525;25)` cm ocupa o canto direito e continua na lateral; o único meio da fiada fica na ponta livre `(525;225)` cm. Total A: 52 inteiros + 1 meio. Conferir as 40 fiadas, a fase invertida e a informação de ligação dos T. Fixtures nominal-v1 e nominal-v2 devem ser validadas antes da migração, preservando geometria, IDs e escolhas.

## 5. Lacunas e consequência prática

| ID | Lacuna | Tratamento em M2 | Condição para fechar |
|---|---|---|---|
| L1 | Altura instalada, folgas e encaixes variam; não há passo físico universal verificado | Passo nominal explícito de CT-02, sem alegação de fidelidade executiva | Desenho cotado de produto e detalhe de assentamento compatíveis; revisar regra se necessário |
| L2 | Diâmetros, rebaixos e passagem real de furos não definidos para bases genéricas | Eixos simbólicos; verificar apenas alinhamento nominal | Geometria cotada verificável; necessária somente numa evolução que prometa passagem física; M3 nominal não faz essa inferência |
| L3 | Ligação física do T, cruz e combinações fora do catálogo nominal | T conforme CT-05 com aviso; cruz excluída; diagnóstico de combinações sem padrão | Nova pesquisa para ampliar suporte; ligação física não é dimensionada no M2 |
| L4 | Meio nominal não equivale automaticamente a meio cortado | Catálogo nominal, sem instrução de corte ou consumo de peça-base | Procedimento com dimensões finais e perda de corte antes dos quantitativos correspondentes |
| L5 | Transições de altura além do L simples | L → reta definido por EX-15/16; demais combinações não cobertas recebem diagnóstico | Exemplos completos antes de ampliar o suporte |

L1/L2/L4 são limitações físicas conhecidas, com tratamento nominal aprovado para M2. L3/L5 registram os limites restantes, sem bloquear os casos nominais definidos. Nenhuma delas exige cadastro de regras ou aprovação técnica na interface, nem autoriza marcar todo RF-01/04/05 como atendido.

### Resolução das definições P1–P5

| ID | Definição aprovada | Referência verificável | Limite |
|---|---|---|---|
| P1 | L alternado, mínimo geométrico de `2m` por ramo | CT-05; EX-03/14 | Verificar fechamento conjunto; não é mínimo normativo |
| P2 | Principal contínua e ramal encostado; aviso de ligação complementar | F3/F6; CT-05; EX-10/13 | Geometria derivada para o Ecovit, sem dimensionar ligação |
| P3 | Reconhecer cruz; excluir composição automática do primeiro M2 | Decisão do solicitante após pesquisa; EX-11 | Nova inclusão exige revisão de escopo, não ocorre automaticamente em M3 |
| P4 | Compatibilidade por ocupação e alternância em todas as fases | CT-05; EX-17/18 | Sem distância mínima universal ou busca genérica de solução |
| P5 | L → reta com continuidade de fase | CT-02; EX-15/16 | Convenção nominal; outras transições ainda fora do suporte |

As decisões P1–P5 estão definidas para o recorte nominal aprovado e foram implementadas em M2. Resultados de verificação estão no relatório do plano; aceite global do solicitante recebido em 12/10/2026. Os exemplos e regras próprias do Ecovit não são reproduções de detalhes executivos das fontes.

**Definições posteriores, sem bloquear o modelo nominal de M2:** dimensões físicas de furos/encaixes antes de inferir passagem para graute ou instalações (L2); procedimento e perdas de corte antes de contabilizar peças preparadas (L4). Passo físico de fabricante (L1) só será necessário se o produto passar a prometer fidelidade a esse sistema, mediante revisão explícita da convenção atual.

## 6. Contrato de implementação

Contrato original de M2, preservado para compatibilidade. A evolução de documento/composição e persistência de M3.1 está na Arquitetura §15; o relatório vigente de execução fica no Plano §7.

- Domínio puro: entradas são modelo, ajustes e convenções; saída é composição e diagnósticos. Sem dependência de canvas ou banco.
- Regeneração integral e sequencial após alteração confirmada. Salvar modelo desatualizado, calcular, salvar resultado. Sem Worker, filas, debounce ou recálculo por região. Liberar controles em sucesso e falha.
- Falha na primeira gravação: manter edição em memória, informar falha e permitir download; não indicar “Salvo”. Evitar iniciar outra operação persistente enquanto a atual termina.
- Falha no motor: preservar modelo e último resultado, identificado como antigo. Falha ao salvar resultado: mantê-lo em memória e indicar que a gravação falhou. Download deve representar o estado atual e sua condição real.
- Separar atualização do cálculo e pendências geométricas. Casos não suportados são diagnósticos normais, não falhas técnicas.
- Evoluir arquivo para versão 2 com migração explícita da versão 1: preservar modelo, alturas, IDs e ajustes; iniciar resultado ausente/desatualizado e gerar conforme as regras. Não modificar o arquivo original.
- Persistir convenção nominal usada, composição por fiada, tipos/posições/orientações, relações com paredes, escolhas e diagnósticos. Não persistir nós Konva nem histórico de resultados. IDs de peças devem ser determinísticos para a mesma entrada, mas não precisam sobreviver a uma alteração geométrica.
- Reabrir versão 2 atualizada recupera a composição salva, sem regenerar silenciosamente. Validar relações e geometria do conteúdo importado; resultado inconsistente deve ser rejeitado com explicação, preservando o projeto aberto.
- Desfazer/refazer guarda modelo e ajustes, e regenera; não coloca milhares de peças em cada entrada do histórico. Navegação entre fiadas não recalcula.
- Não materializar malha vazia de todo o terreno: trabalhar com faixas/componentes ocupados. Sem otimização antecipada, mas com limites defensivos antes de alocar peças. O valor do limite e o ensaio realizado devem constar no relatório; limite excedido preserva o modelo e gera mensagem, nunca truncamento silencioso.

O [plano de M2](Ecovit-Plano-Implementacao.md), seção 5, define aceite, testes e ordem de trabalho. M2 foi autorizado e implementado; avanço para M3 exige solicitação própria.

## 7. Decisões concretizadas em M2 — 11/10/2026

- Motor em `src/domain/composition.ts`, sem dependências de interface. Padrões e recusas são cobertos por `tests/composition.test.ts`.
- Limites defensivos: soma de comprimentos de paredes até 20 mil módulos, até mil fiadas e produto dessa soma pelo total de fiadas até 100 mil células. É uma estimativa conservadora anterior à alocação, contando sobreposições na soma. Não é promessa de 100 mil peças: cenário verificado de 42 mil peças no relatório. Exceder preserva o modelo e gera diagnóstico, sem truncamento.
- Peças são verificadas por cobertura exata de células e exclusividade; eixos são derivados dos centros das células, inclusive quando ficam em meia unidade interna. Na convenção nominal-v3, percursos sem ramificação e ciclos usam pareamento contínuo; T separa o ramal da principal no cálculo. Não há busca combinatória. As implementações antigas permanecem somente para validar snapshots legados.
- Somente a transição simples L → reta é suportada para encontros de alturas distintas. Transições T e conjuntos com vários encontros em alturas diferentes recebem diagnóstico.
- Composição versão 2 é persistida; a abertura/importação recomputa um resultado de conferência para validar a composição salva. Se consistente e nominal-v3, preserva o snapshot; convenções antigas validadas são marcadas desatualizadas para regeneração pelo fluxo normal. Se divergente da própria convenção, rejeita. Essa conferência é distinta da regeneração após edição. Navegação não calcula.
- Falhas do motor mantêm modelo salvo e resultado desatualizado; falhas de gravação mantêm memória e download. Histórico guarda modelo/ajustes sem peças geradas.

## 8. M3 nominal: pesquisa e definições — 12/10/2026

**Situação:** alcance nominal e configurações confirmados pelo solicitante. CT-07/08 implementados em M3.1, CT-09 em M3.2 e CT-10 em M3.3. Resultados e pendências manuais no plano §7. Fórmulas de ocupação são convenções nominais do Ecovit, não dimensionamento de apoios ou reforços.

### Evidências consultadas nesta revisão

Mantêm-se os IDs das fontes. Os localizadores abaixo ampliam a pesquisa anterior, sem tratar duas páginas do mesmo fornecedor como confirmação independente.

| Fonte | Localizador consultado em 12/10/2026 | Evidência e consequência para a proposta |
|---|---|---|
| F1 — [Manual de projeto Ponto Eco](https://www.tijolo.eco.br/manual_projeto_tijolo_ecologico/) | Modulação; Planta de Primeira Fiada | Usa meio tijolo como módulo e exemplifica interrupção de colunas na janela, com retomada acima. Apoia distinguir intervalos separados, sem inferir continuidade através do vazio. |
| F3 — [Manual de construção Ponto Eco](https://www.tijolo.eco.br/manual_construcao_tijolo_ecologico/) | Gráute; Canaletas; Malha Estrutural | Descreve graute junto a aberturas/encontros e canaletas em níveis de vergas, contravergas e respaldo. Seus espaçamentos são apresentados no contexto do sistema e do projeto; o próprio manual atribui a especificação estrutural ao responsável técnico. Não converter essas medidas em constantes universais. |
| F6 — [Buson / FAU-UnB, 2007](https://www.jarfel.com.br/pdf-jarfel-sahara/autoconstrucao.pdf) | §6.8 e §6.9, páginas do PDF 68–69, impressas 62–63 | Relaciona vergas à alvenaria sobre aberturas, contravergas às janelas e apoios a colunas. Número de fiadas depende do vão/carga. Cintas podem ser interrompidas por portas. Não fornece uma regra universal derivável apenas de comprimento/largura/altura do tijolo. |
| F2 — [Produto Ponto Eco](https://tijolo.eco.br/produtos/tijolo_ecologico/) | Apresentação de inteiro, meio e canaleta; desenho técnico anunciado de 30 × 15 × 7 cm | Confirma variantes no sistema apresentado; não estabelece cotas universais de canais ou passagens para as três bases do Ecovit. Nenhuma dimensão interna nova foi adotada. |

F6 foi consultada pelo texto extraído do PDF. A captura das páginas 68–69 falhou por cache/timeout; nenhuma medida foi inferida das figuras nesta revisão. A tentativa de reabrir F5 falhou por timeout; suas figuras não foram usadas como nova evidência. Não foram consultadas normas integrais nesta revisão e não se declara atendimento normativo.

**Síntese técnica:** as fontes permitem identificar funções e dependências dos elementos, mas não fecham um catálogo universal de apoios, canais, preparações e espaçamentos. O solicitante optou por desenho nominal, sem verificar essas dimensões. L6/L8 não bloqueiam mais M3: não se implementa dimensionamento ou comprovação física. L7 passa a ser convenção configurável de distribuição geométrica, não recomendação estrutural.

### CT-07 — Volume do vão e validação nominal

Usar `m = largura-base`, `h = altura-base`, `F = cota do piso`, `S = início absoluto da alvenaria`, `H = altura da parede`. Vão possui posição `s` desde a extremidade de menor coordenada, largura `w`, base relativa ao piso `b` e altura `a`. Sua projeção ocupa toda a espessura da parede e o intervalo longitudinal `[s, s+w)`; seu intervalo absoluto é `[B,T)`, com `B = F+b` e `T = B+a`.

- `s` e `w` são múltiplos de `m`; `w >= m`, `a > 0`, medidas representáveis em décimos de milímetro. Inserção/edição direta exige `0 <= s`, `s+w <= comprimento`, `S <= B < T <= S+H` e base/topo em limites de fiadas: `(B-S) mod h = (T-S) mod h = 0`. Não exigir `b mod h = 0` quando piso e alvenaria diferem.
- Porta inicia proposta com base zero; se zero for incompatível com `S`, solicitar escolha explícita de uma base realizável, sem criar soleira ou cortar fiada. Nenhum tipo autoriza recorte parcial de altura. Valores digitados mostram alternativas válidas próximas e respectivas diferenças; sem alternativa dentro dos limites, explicar o impedimento.
- Fiada `k`, numerada desde 1, ocupa `[S+(k-1)h, S+kh)`. Remover células somente quando houver interseção vertical de comprimento positivo com `[B,T)`. Limite compartilhado não remove a fiada vizinha.
- Recorte D3-02 confirmado em 12/10/2026: na mesma parede, proibir interseção de comprimento positivo simultaneamente nos intervalos horizontais e verticais de dois vãos (sobreposição de volumes). Se os intervalos verticais se sobrepõem, exigir distância horizontal entre projeções de pelo menos `m`; contato lateral sem célula separadora é recusado. Não unir aberturas automaticamente.
- Permitir empilhamento quando as projeções horizontais se intersectam com comprimento positivo, parcial ou totalmente: ordenando os vãos por altura, exigir `B_superior - T_inferior >= h`. Limites já modulados garantem pelo menos uma fiada completa de alvenaria entre eles. Contato vertical e intervalo menor que `h` são recusados em edição direta. Esses `m`/`h` são limites do desenho nominal, não dimensões resistentes verificadas. Edições indiretas que violem a separação preservam os vãos e recebem diagnóstico localizável, conforme a política de pendências.
- A separação vertical vale desde M3.1. Em M3.2, quando `B_superior - T_inferior = h`, a canaleta superior do vão inferior e a inferior do superior usam a mesma fiada: unificar as células coincidentes e preservar ambas as origens, sem duplicar peças. Para separações maiores, gerar cada faixa imediatamente junto ao respectivo vão. Supressão voluntária de canaleta não muda o mínimo geométrico nem gera pendência estrutural.
- Vão pode chegar à ponta livre ou ao topo da parede; isso não é erro de desenho. Ausência de alvenaria superior dispensa candidato de verga nesse limite. Ausência de apoio lateral não bloqueia canaleta nominal nem cria pendência estrutural.
- Vão que invade células compartilhadas de um encontro fica salvo como intenção arquitetônica com conflito localizado, sem apagar a outra parede. Vão próximo, sem invadir encontro, é aceito geometricamente; não avaliar apoios resistentes no M3. Sem afastamento estrutural arbitrário.
- Redimensionamento da parede mantém coordenadas mundiais do vão e recalcula `s` (pode ficar negativo como pendência). Mudança de piso mantém `b`; mudança de início/altura mantém o vão e diagnostica incompatibilidades. Não deslocar, reduzir ou excluir vãos automaticamente. Exclusão da parede remove seus vãos e ajustes dependentes na mesma operação de histórico.

### CT-08 — Paginação junto aos vãos

Conservar o percurso e a fase de M2 para cada fiada antes da abertura. Subtrair da ocupação as células dos vãos válidos, sem reancorar a fase em cada trecho restante: par com duas células restantes conserva inteiro; par sem células desaparece; par com uma célula restante gera meio nominal nessa extremidade do vão. Meio anterior permanece se sua célula não for removida. Isso é escolha do catálogo, não instrução para cortar fisicamente um inteiro.

Nas fiadas abaixo/acima do vão, usar a paginação original daquela fiada, sem reiniciar A/B. A alternativa de encontro ainda inverte a fase do conjunto e deve ser conferida em toda a altura, agora incluindo aberturas. Casos sem vãos devem produzir a mesma geometria de nominal-v3. Canaletas, quando habilitadas, exigirão recomposição tipada e validação próprias de CT-09; não basta mudar a cor do inteiro.

Aplicar apenas em componentes já suportados por M2 e sem remoção de células do encontro. Não usar a abertura para esconder cruz ou transição de altura ainda sem suporte. Verificar cobertura exata da união das faixas menos os volumes válidos dos vãos, colisões e eixos. Um componente com conflito geométrico permanece sem peças em todas as suas fiadas, conforme política de M2; componentes independentes continuam visíveis. Distinguir falta de geometria de elemento construtivo ainda não calculado.

No incremento M3.1, a alvenaria acima de uma abertura é apenas composição nominal: exibir informação persistida “Elementos sobre e sob vãos ainda não calculados nesta entrega”. Não desenhar uma verga fictícia nem classificar o conjunto como solução construtiva completa. No incremento M3.2, apenas incompatibilidade geométrica gera pendência; ausência de dimensionamento físico ou remoção voluntária não gera alerta de insuficiência estrutural.

### CT-09 — Canaletas nominais configuráveis

Decisão confirmada: faixas globais por parede em níveis configurados e uma fiada automática imediatamente acima/abaixo de qualquer vão. Sem armadura, apoio calculado, extensão lateral resistente, verificação de cavidade ou peça preparada na obra. Canaleta inteira/meia usa envelope nominal de inteiro/meio e canal longitudinal esquemático. Contornos da malha e fase permanecem; símbolo de canal distingue a peça de um tijolo comum. Encontro mostra trajeto nominal; não gera pendência apenas porque falta dimensão física de conexão.

Nível global `c` é topo da fiada em relação ao piso: `k=(F+c−S)/h`, inteiro positivo. A faixa ocupa `[F+c−h,F+c)`. Se esse intervalo não estiver contido na parede, não criar material adicional; nível fora da altura daquela parede não gera peças ali. Valor fora dos limites de fiada pede alternativa explícita. Valores iniciais estão na [tabela normativa do PRD §20](Ecovit-PRD.md#padrões-normativos-de-m3); não hardcodificar número de fiada independentemente de h/piso/início.

Vão `[B,T)`: faixa superior `[T,T+h)` se houver alvenaria até `T+h`; inferior `[B−h,B)` se houver alvenaria desde `B−h`. A regra independe do tipo: porta na primeira fiada não tem faixa inferior, porta elevada tem. Vão até topo da parede não cria faixa acima. Não tratar essas ausências como erro estrutural. A faixa superior nunca começa dentro do vazio.

Alcance horizontal confirmado: largura do vão mais meio tijolo de cada lado. Para posição s, largura w e módulo m, intervalo solicitado [s−m,s+w+m), comprimento w+2m. Extensão por lado: 12,5 cm na base 25, 15 cm na base 30 e 14 cm na base 28. É convenção nominal escolhida pelo solicitante, sem dimensionamento de apoio e sem depender de eixo de graute. Intersectar com alvenaria existente da parede; não prolongar a parede ou preencher aberturas para completar a extensão. Descontar todos os vãos que interceptam a fiada, inclusive um segundo vão mais alto. Unificar demandas globais/de vãos em uma única ocupação, com múltiplas origens. Nos encontros, compor pela união de células e preservar uma única peça compartilhada; representar conexões apenas nominalmente. Onde uma demanda cobre uma célula de um inteiro e não a outra, separar em dois meios nominais (um canaleta e um comum), sem mudar a fase restante; não ampliar a faixa nem invadir abertura para manter inteiro.

A remoção confirmada cobre toda a faixa da parede naquela fiada, não um trecho ou tijolo. Inclui trechos separados por aberturas; preserva outras fiadas. A seleção deve identificar a parede hospedeira. Realçar antes de remover, inclusive células compartilhadas afetadas. Converter área suprimida em tijolos comuns da mesma paginação, recompondo pares quando possível; não apagar alvenaria. Supressão prevalece sobre todas as origens automáticas coincidentes, inclusive vizinhas, e é preservada após regeneração. Não recriar uma faixa por outra origem nem gerar alerta de reforço faltante.

### CT-10 — Graute nominal automático e clique por furo

Categorias habilitadas e distância máxima `d` positiva vêm da configuração do projeto, cujos campos, efeitos e valores iniciais estão no [PRD §20](Ecovit-PRD.md#padrões-normativos-de-m3). A geração usa as convenções abaixo, sem consulta de diâmetro, aço, resistência ou ligação física entre canal e furo.

Convenção geométrica simples para implementação: encontros usam centros das células compartilhadas do encontro suportado (um eixo no canto L ou centro T); laterais usam o centro da célula imediatamente anterior/posterior ao vão, quando existente; ponta livre usa a célula terminal sem encontro. Duplicatas se unificam por coordenada, sem triplicar automaticamente os furos do canto. Essas escolhas são convenções de desenho do Ecovit, não regras construtivas das fontes. Cruz permanece fora da composição suportada.

Para distribuição intermediária, trabalhar por parede em ordem de coordenadas, usando candidatos das categorias habilitadas como âncoras. Primeiro/último centros de células são referências virtuais quando ponta livre não estiver habilitada; não criam graute por si. Em cada intervalo entre âncoras, acrescentar eixos em passos máximos `q=floor(d/m)` células, desde a menor coordenada, até a distância restante ser `<=d`. Se `d<m`, explicar que não existe espaçamento entre eixos distintos nessa malha, oferecendo `m`, sem arredondamento silencioso. Espaçamento efetivo nunca excede d antes dos ajustes manuais, onde existirem eixos elegíveis. Não gerar candidatos num eixo que não tenha nenhum intervalo de alvenaria. Onde houver abertura, descontar seu vazio dos intervalos de graute, conforme EX-22/33; não exigir alvenaria contínua na altura inteira para aceitar os trechos acima/abaixo. Interrupção por abertura é condição de desenho, não insuficiência estrutural.

Graute representa a interseção do eixo com a alvenaria do pavimento: início/topo das paredes associadas, descontados todos os vãos. Intervalos separados não se conectam através do vazio. Eixos de células de canaletas continuam clicáveis como marcadores nominais, sem alegar geometria interna física. Não atravessar laje/outro pavimento.

Em Fiada, ferramenta contextual Graute: somente marcador de furo existente na fiada ativa recebe hover/clique. Vazio mostra +; existente tem preenchimento escuro e mostra −. Clique adiciona/remove o eixo completo, incluindo intervalos acima/abaixo de aberturas. Furo da referência sobreposta e espaço vazio não recebem edição. Rótulos acessíveis “Adicionar graute”/“Remover graute”, foco de teclado e acionamento equivalente. Fora dessa ferramenta, manter seleção normal; navegação nunca altera graute.

Resultado final = automáticos e inclusões manuais, menos exclusões explícitas. Aplicar exclusões depois de distribuir automáticos: não recolocar outro graute para compensar remoção e atingir d. d é parâmetro da proposta automática, não restrição imposta ao usuário após ajustes. Adicionar em eixo excluído cancela a exclusão; remover inclusão manual também bloqueia eventual automático naquele eixo. Mudança de abertura recalcula intervalos mantendo coordenada horizontal. Eixo sem nenhuma alvenaria mantém ajuste não aplicado, com ação de descarte; não transferir para furo vizinho.

### Situação das dependências após decisão nominal

| ID | Situação em M3 | Tratamento |
|---|---|---|
| L2/L8 | Dimensões físicas de furos/canais fora do alcance | Sem verificação física nem bloqueio de geração; marcadores e canais esquemáticos, sem volumes inferidos. |
| L6 | Apoios e dimensionamento fora do alcance | Uma fiada superior/inferior nominal; níveis globais configurados. Alcance local confirmado: largura do vão + um módulo por lado, como convenção nominal, sem dimensionamento de apoio. |
| L7 | Distribuição convertida em configuração de desenho | Categorias opcionais e máximo inicial 100 cm; convenção por malha acima; usuário pode remover/adicionar. |

Fontes anteriores permanecem como contexto histórico. Não exigem cadastro de fabricante ou aprovação estrutural. Sem armaduras, grampos ou peças de corte físico no M3. Quantitativos serão evoluídos futuramente; nenhuma regra atual calcula volume de graute a partir de diâmetro desconhecido.

### Exemplos de M3 independentes do algoritmo (propostos)

Todos os valores abaixo são casos de teste geométricos, não dimensões recomendadas de esquadrias ou apoios. Base padrão 25 × 12,5 × 7 cm, piso/início zero, parede horizontal 400 cm (`x=0…31` células), altura 280 cm (40 fiadas), salvo indicação contrária.

| ID | Entrada | Resultado esperado |
|---|---|---|
| EX-21 | Porta `s=100`, `w=100`, `b=0`, `a=210` cm | Células 8…15 ausentes nas fiadas 1…30; fiada 31 em 210–217 cm inteira. Fase A interrompida: 12 inteiros; B: 10 inteiros + 4 meios (células 0,7,16,31). Sem abertura: A 16 inteiros; B 15 inteiros + 2 meios. |
| EX-22 | Janela `s=100`, `w=100`, `b=98`, `a=112` cm | Base 98, topo 210: fiadas 1…14 completas, 15…30 abertas, 31…40 completas. Fase não reinicia na 15 ou 31. Eixo x=106,25 cm tem intervalos nominais de alvenaria [0,98) e [210,280); em M3.3 graute jamais ocupa [98,210). |
| EX-23 | Porta `s=100`, `w=87,5`; janela `s=250`, `w=100`; cotas verticais de EX-21/22 | Na fiada 15 (A), retirar células 8…14 e 20…27: sobram 17 células, 8 inteiros e meio em 15. Fiada 16 (B): 6 inteiros + 5 meios (0,7,19,28,31); 15 pareia com 16. Sem peça cruzando abertura e sem meios interiores artificiais. |
| EX-24 | Piso 10, início 12; base solicitada 0; depois janela base 100 e altura 112 cm | Porta a zero está abaixo do início e não entra silenciosamente; primeira base realizável 2 cm. Janela B=110 e T=222: (110−12)/7=14; fiadas 15…30 abertas. Com piso/início zero, base 100 oferece 98/105; largura 103 oferece 100/112,5 cm, sujeitas ao espaço disponível. |
| EX-25 | Parede 0…400; vão absoluto 100…200. Mover extremidade menor para 25; depois para 125 cm | Primeiro: posição absoluta intacta, s=75. Depois: s=−25, manter vão e diagnosticar fora da parede; desfazer restaura. Encurtar pela extremidade maior para 187,5 também deixa vão pendente, sem redução automática. |
| EX-26 | Vãos 100…200 e 187,5…250 com intervalos verticais coincidentes; depois segundo em 200…250; depois 212,5…250 cm. Empilhamento: ambos em 100…200, inferior [0,105), superior [112,210); variantes com base superior 105 e 119 cm. | Edição direta recusa sobreposição de volumes e contato lateral sem célula separadora; aceita separação horizontal de 12,5 cm. Empilhamento com base 112 aceito: fiada 16 [105,112) de alvenaria, compartilhada por canaletas superior/inferior em M3.2; faixa local 87,5…212,5, 5 canaletas inteiras na fase B, ambas as origens sem duplicação. Fiadas 1…15 e 17…30 abertas; demais completas. Base 105 recusada por contato vertical; base 119 aceita, com canaletas distintas nas fiadas 16 e 17. Sobreposição horizontal parcial segue o mesmo mínimo de uma fiada. Nenhum espaçamento afirma suficiência estrutural. |
| EX-27 | L: horizontal [0,100)×[0,12,5), vertical [0,12,5)×[0,100), ambas altura 280. Vão horizontal [0,25), depois [12,5;37,5), b=0,a=210 | Primeiro invade célula comum (0,0): conflito de encontro, componente sem peças. Segundo preserva a célula comum: aplicar CT-08; A deixa meio no canto quando a célula (1,0) é removida, B mantém inteiro vertical. Esse meio é término junto ao vão, não orientação imposta. Apoio não é validado pela distância. |
| EX-28 | Janela de EX-22, h=7 | Canaleta inferior em [91,98), fiada 14; superior em [210,217), fiada 31. Nenhuma no vazio. Porta de EX-21: apenas superior. Vão com topo 280: nenhuma acima. Vão 100…200 cm: faixa solicitada 87,5…212,5 cm (10 células). Sem faixas globais coincidentes: fiada 14, fase B, 5 canaletas inteiras; fiada 31, fase A, 4 canaletas inteiras + 2 meias canaletas. As demais células permanecem tijolos comuns. |
| EX-29 | Base 30×15×7: parede 480, vão 120…240, b=98,a=112. Base 28×14×7: parede 448, vão 112…224, mesmas cotas | Mesmos índices/contagens de EX-22, módulos 15/14. Base 28×14×6: parede altura 240, vão b=84,a=96: abre fiadas 15…30 e retoma na 31, demonstrando que altura-base não é fixada em 7. |
| EX-30 | Projeto M2 sem vãos, seguido de EX-21; salvar/reabrir, inverter fase e desfazer; adulterar uma peça no arquivo atualizado | Projeto antigo preserva geometria/IDs/escolhas; vão e estado dos elementos associados sobrevivem ao transporte; desfazer restaura modelo e composição correspondente; peça adulterada é recusada sem substituir projeto aberto. |

### Exemplos adicionais das decisões nominais

- **EX-31 — Nível global:** piso/início zero, h=7, níveis padrão confirmados 112/224: fiadas 16/32, intervalos 105–112/217–224. Vão com topo 217 também solicita canaleta em 217–224: uma única ocupação. Piso 10/início 12 e nível relativo 112 dá (10+112−12)/7 não inteiro: pedir alternativa 107 ou 114 cm relativos ao piso.
- **EX-32 — Grautes por intervalo:** parede reta 400 cm, m=12,5; somente distribuição por intervalos habilitada, d=100. Âncoras virtuais 6,25 e 393,75 cm; intermediários 106,25/206,25/306,25 cm. Habilitar pontas acrescenta 6,25/393,75. Remover 206,25 preserva sua ausência mesmo após recálculo; não inserir substituto para compensar o novo intervalo de 200 cm.
- **EX-33 — Clique em janela:** eixo 106,25 em EX-22: na fiada 10 há furo clicável; incluir cria [0,98) e [210,280). Fiada 20 é vazio nesse eixo e não admite clique. Remover na fiada 35 retira ambos os intervalos. Isso substitui o antigo roteiro que tentava clicar dentro do vazio da janela.
- **EX-34 — Bases e distância:** d=100 e m=15 usam passos de até 6 células = 90 cm; m=14 usa até 7 células = 98 cm. Nenhum arredondamento para 105/112 cm. d menor que m pede correção explícita.
- **EX-35 — Supressão coincidente:** uma faixa solicitada por nível global e por topo de vão é mostrada uma vez. Remover a faixa na fiada remove todas as origens em toda a parede selecionada, inclusive trechos separados e devolve tijolos comuns, mantendo grautes existentes. Regenerar ou reabrir não a restaura. Restaurar o ajuste explicitamente permite a automação novamente.

Exemplo de aplicação dos padrões normativos do PRD §20: para h=7 e piso/início zero, janela com base 112/topo 217 (altura 105 cm) ocupa fiadas 17…31; canaleta inferior na 16 e superior na 32. Níveis globais com topo 112/224 coincidem com essas faixas e não duplicam peças. Os números deste exemplo são mantidos como resultado esperado independente, sem representar implementação nem teste do aplicativo.
