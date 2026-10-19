# Ecovit — Caderno técnico

**Convenção vigente:** nominal-v10; extensão de alturas em CT-14.
**Estado:** M2 e M3.1–M3.5 implementados e aceitos. M4.1 implementado, revisado e aceito pelo solicitante; M4.2 implementado e aceito pelo solicitante conforme CT-13/EX-65–74, com verificações e aceite no plano; M4.3 implementado e aceito pelo solicitante conforme CT-15/EX-80–85, com verificações e aceite no plano.
**M5:** contagem nominal implementada em CT-16/EX-86–94 (§12), com M5 aceito pelo solicitante; registro e verificações no Plano §12; sem nova convenção do motor.
**Alcance implementado:** composição nominal de paredes, vãos, canaletas e grautes por pavimento independente, até quatro, e geometria de lajes/aberturas. CT-01–15 e EX-01–85 definem convenções e exemplos; CT-15/EX-80–85 pertencem a M4.3, e os casos de versões legadas são identificados explicitamente. O [PRD](Ecovit-PRD.md) define comportamento e limites do produto; o [plano](Ecovit-Plano-Implementacao.md) reúne verificações e aceite por marco.

Durante o MVP, cada marco pode adotar novo contrato sem compatibilidade com formatos de marcos anteriores, sem obrigação de manter migrações ou geradores legados. M4.1 aplica essa quebra. As fórmulas e exemplos com referências distintas de piso e início da alvenaria documentam os marcos já entregues; não exigem sua conversão em marcos futuros. As convenções de M4 estão na seção 11; lajes implementadas conforme §11.2.

## 1. Evidência, convenção e limite

Este caderno distingue **evidência da fonte**, **convenção do modelo** e **lacuna**. Os exemplos calculados abaixo são especificações geométricas próprias do Ecovit; não são detalhes executivos certificados por fabricantes. Nenhuma regra aqui dimensiona resistência, armadura, graute ou apoio.

M2 define a base de composição nominal: retas, L/U/contornos, T com principal contínua e ramal encostado e transição simples L → reta. M3 acrescenta vãos, canaletas, grautes, edição geométrica e cruz nominal. O preenchimento da área não comprova amarração resistente.

### Alcance de M2

| Item | Convenção de M2 |
|---|---|
| 1 | Passo nominal igual à altura-base, sem configuração de junta em M2; alternativas para alturas incompatíveis |
| 2 | Furos representados por eixos centrais; somente alinhamento nominal em M2 |
| 3 | Meio tijolo como peça disponível; sem rendimento presumido de corte |
| 4 | L com alternância do ramo que ocupa o canto; limites e exemplos pares/ímpares, rotações e reflexões em CT-05 |
| 5 | T básico composto em M2; uma solução basta, sem exigir várias alternativas; distinguir eventual ligação complementar da composição |
| 6 | Reconhecimento e diagnóstico da cruz em M2; composição nominal em M3.5, conforme CT-12 |
| 7 | Encontros próximos só são suportados quando fecham conjuntamente; verificar células e peças reservadas em todas as fases, sem distância universal arbitrária ou solver genérico |
| 8 | Alternativas documentadas e compatíveis; prévia de todas as regiões afetadas; alteração somente na primeira fiada |
| 9 | Encontro até o término da parede curta; acima, parede restante segue padrão reto e fase do pavimento; verificar a transição |
| 10 | Planta completa; componente conectado sem solução fica sem peças em Fiada; destacar causa e manter componentes independentes visíveis |
| 11 | M2 exige retas, L, retângulo, T básico, transição simples de alturas, inspeção e persistência; cruz somente reconhecida e diagnosticada; diagnóstico não conta como composição resolvida |

As convenções P1–P5 estão consolidadas na seção 5. As verificações e os aceites são registrados separadamente no plano.

## 2. Fontes consultadas e alcance

As páginas não informam claramente uma revisão técnica vigente. URLs públicas podem mudar; os localizadores abaixo permitem conferir a evidência. Os dois PDFs foram lidos, inclusive figuras; a paginação indicada é a do arquivo PDF, começando em 1.

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

Não foram consultados textos integrais vigentes de normas ABNT. Não se declara conformidade normativa. O desenho de produto em `https://ikigai.eco.br/download/tijolos-ikigai.pdf` não integra a evidência técnica: conteúdo não verificado; nenhuma cota adotada.

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

Nos contratos históricos e nos arquivos legados, usar início da alvenaria `z0`, piso `zf` e fiada `n`, contada a partir de 1. No contrato vigente de M4.1, `z0 = zf = cota do pavimento`, conforme §11:

- Base: `z0 + (n−1)h`; topo: `z0 + nh`.
- Mostrar o intervalo relativo ao piso, subtraindo `zf`.
- Altura de parede `H` é realizável neste modelo quando `H/h` é inteiro positivo.
- Não modificar `H` silenciosamente. Para valor incompatível, oferecer múltiplos imediatamente abaixo/acima, descartando zero.
- Em projeto de M1 já salvo com altura incompatível, conservar o valor e apontar a pendência; não cortar tijolo na última fiada nem mudar a geometria durante migração.
- Paredes com alturas diferentes só participam das fiadas que alcançam. Enquanto ambas existirem, gerar o encontro. Acima do término da parede curta, recompor a alvenaria restante (reta no L simples), mantendo a fase correspondente ao número absoluto da fiada do pavimento, sem reiniciar A. A transição simples de L é obrigatória em M2 (P5; EX-15/16). No comportamento vigente, CT-14 amplia o suporte a T e vários encontros; combinações sem solução nominal continuam diagnosticadas, sem prolongar parede ou cortar peças automaticamente.

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

**Paginação contínua — nominal-v3 e posteriores:** após separar os ramais dos T conforme P2, tratar cada percurso sem ramificações pela mesma regra, seja reta, L, U, sequência de cantos ou ciclo fechado. Não reservar a mesma orientação em todos os cantos. Parear células consecutivas no percurso; cada par ortogonal é um inteiro. A mudança de direção ocorre entre pares: o inteiro que ocupa o canto segue uma das direções, sem peça em L. Na fase seguinte, deslocar o pareamento em uma célula, alternando a orientação em cada canto e as juntas. Meios só podem aparecer nas pontas dos percursos abertos, inclusive contatos dos ramais de T; não inserir meio no interior para satisfazer orientação imposta.

Ordenação determinística: células por y e depois x. Percurso aberto começa na primeira extremidade nessa ordem. Havendo cantos, a fase A é ancorada horizontalmente somente no primeiro canto geométrico nessa ordem; a paridade do caminho determina os demais. Essa âncora conserva o padrão do L simples, sem depender de IDs, ordem ou sentido do desenho. Retas mantêm CT-04 e ramais mantêm paginação desde o contato. Ciclo começa na primeira célula e escolhe a próxima priorizando maior x e menor y; a fase B desloca esse início uma célula. Conferir fechamento e quantidade par de células. Alternativa inverte A/B do conjunto inteiro, não cada canto isoladamente.

Percursos devem visitar todas as células uma vez, ter duas extremidades ou formar ciclo, e não apresentar ramificação após a separação dos T. Em nominal-v1–v7, a cruz permanece sem composição; nominal-v8 aplica CT-12. Sobreposição colinear e transições de altura não suportadas continuam diagnosticadas. Não há mínimo universal de quatro células para a ponte do U; EX-18 define a solução coordenada. A regra não usa busca combinatória nem otimização por pontuação.

A paginação contínua é uma convenção geométrica derivada de CT-03/04 e do pareamento do anel EX-04. Não acrescenta regra física, peça especial, junta ou dimensão de fabricante. As ressalvas de ligação dos T permanecem; não há validação estrutural.

**T básico (P2):** identificar pela geometria a faixa que continua em dois sentidos, mantendo-a contínua em todas as fiadas. A célula central pertence apenas a essa faixa; o ramal é paginado a partir da face de contato, sem sobreposição. Aplicar CT-04 em cada trecho, com a mesma fase do pavimento: principal a partir da menor coordenada e ramal desde o contato para a ponta livre. O T exige ramos nos três sentidos; um trecho de uma célula mantém a limitação de CT-04, sem promessa de amarração alternativa. Não exigir classificação de parede interna/externa nem oferecer outra topologia no M2. O exemplo EX-13 fixa as posições e contagens.

F3 descreve continuidade da parede externa e ligação da interna por grampos; F6 reforça a distinção entre composição e ligação. Aplicar a continuidade ao ramo principal de qualquer T é uma convenção geométrica do Ecovit. Exibir “Composição geométrica resolvida; ligação complementar necessária”. Essa informação não impede a classificação de geometria nominal resolvida quando CT-06 passar, mas deve permanecer visível e persistida. Não desenhar/dimensionar grampos ou graute no M2, nem apresentar encosto como amarração direta.

**Cruz (P3):** nominal-v1–v7 reconhecem a cruz e emitem diagnóstico, conforme EX-11. Nominal-v8, implementada em M3.5, compõe a cruz conforme CT-12/EX-51–55. A validação de snapshots legados conserva a interpretação da convenção original.

Um componente conectado sem padrão completo fica inteiro sem composição no modo Fiada, com destaque no encontro causador. A Planta permanece completa e os componentes independentes resolvidos continuam visíveis. Essa regra preserva a integridade da composição. Isso evita peças cortadas artificialmente na fronteira de uma solução parcial. Esse comportamento é um resultado com pendência, não uma exceção de execução.

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
| EX-11 | Cruz de 5 células: centro e seus quatro vizinhos | Contrato legado nominal-v1–v7: cruz reconhecida, diagnóstico e componente sem peças. O comportamento vigente nominal-v8 é especificado em EX-51; o diagnóstico legado não implica impossibilidade física |
| EX-12 | Duas paredes colineares ocupam a mesma faixa; duas outras tocam somente por um vértice | Primeiro caso: sobreposição sinalizada. Segundo: componentes separados, sem encontro inventado |

Para reproduzir EX-03 com paredes pela face externa: horizontal de `(0,0)` a `(3m,0)` com espessura para `+y`; vertical de `(0,0)` a `(0,3m)` com espessura para `+x`. Usar ambas com altura 21 cm. Para EX-04, manter as quatro espessuras para dentro. Dimensões externas: 400 × 300 cm para base 25; 480 × 360 para base 30; 448 × 336 para base 28.

EX-04 pode ser conferido numerando as 108 células consecutivas do perímetro: A agrupa 0–1, 2–3, …, 106–107; B agrupa 1–2, 3–4, …, 107–0. São pares ortogonalmente adjacentes, inclusive no fechamento. A implementação não precisa armazenar esse percurso como estrutura permanente.

### Exemplos de paridade, transição e percurso

- **EX-13 — T de 12 células:** principal `(x,0)`, com `x = -4…3`; ramal `(0,y)`, com `y = 1…4`. A: pares horizontais `[-4,-3],[-2,-1],[0,1],[2,3]` e verticais `[1,2],[3,4]`: 6 inteiros. B: meios nas pontas `x=-4,3`, pares `[-3,-2],[-1,0],[1,2]`; no ramal, meios `y=1,4` e par `[2,3]`: 4 inteiros + 4 meios. A célula central nunca pertence ao ramal. Para `m=12,5 cm`, principal de 100 cm e ramal livre de 50 cm, altura de 21 cm, sequência A/B/A. Desenhar principal de `(-4m,0)` a `(4m,0)` com espessura `+y` e ramal de `(0,m)` a `(0,5m)` com espessura `+x`.
- **EX-14 — Paridade e mínimo do L:** ramos de `a,b` células incluindo o canto. A: `floor(a/2)+floor((b−1)/2)` inteiros e `(a mod 2)+((b−1) mod 2)` meios. B troca `a,b`. Para `(2,2)`: 1 inteiro + 1 meio nas duas fases; `(2,3)`: A 2 inteiros, B 1 inteiro + 2 meios; `(3,3)`: 2 inteiros + 1 meio nas duas; `(4,3)`: A 3 inteiros, B 2 inteiros + 2 meios. Ramo com uma célula não atende ao padrão L automático. Posições seguem CT-05, não apenas contagens.
- **EX-15 — Término após fase B:** L de EX-03, horizontal com altura 21 cm e vertical com 14 cm, `h=7 cm`. Fiadas 1/2 seguem EX-03 A/B. Fiada 3: inteiro `(0,0)–(1,0)` e meio `(2,0)`. A faixa vertical acima de 14 cm desaparece; a célula do canto permanece na horizontal.
- **EX-16 — Término após fase A:** mesmo L, vertical com 7 cm. Fiada 1 segue EX-03 A; fiada 2: meio `(0,0)` e inteiro `(1,0)–(2,0)`; fiada 3 igual à terceira de EX-15. A fase não reinicia. Ao inverter a fase inicial por escolha do usuário, inverter toda a sequência, inclusive a reta acima do término.
- **EX-17 — Encontros compatíveis:** anel EX-04. A e B são as duas paginações completas do ciclo; cada opção altera os quatro cantos na prévia. Não oferecer troca isolada que misture fases e produza disputa. Ambas cobrem 108 células com 54 inteiros.
- **EX-18 — U estreito coordenado:** ponte `(0,0),(1,0),(2,0)`, pernas `(0,1),(0,2),(2,1),(2,2)`. A: inteiros `(0,0)–(1,0)`, `(2,0)–(2,1)`, `(0,1)–(0,2)` e meio `(2,2)`. B: inteiros `(0,0)–(0,1)`, `(1,0)–(2,0)`, `(2,1)–(2,2)` e meio `(0,2)`. Ambas cobrem sete células sem disputa. Cada fase usa orientação dos cantos determinada pelo percurso, com cobertura e ausência de colisão verificadas.
- **EX-19 — U com ponte ímpar:** ponte `(x,0)`, `x=0…4`, pernas `(0,1),(0,2),(4,1),(4,2)`. A: inteiros `(0,0)–(1,0)`, `(2,0)–(3,0)`, `(4,0)–(4,1)`, `(0,1)–(0,2)` e meio `(4,2)`. B: inteiros `(0,0)–(0,1)`, `(1,0)–(2,0)`, `(3,0)–(4,0)`, `(4,1)–(4,2)` e meio `(0,2)`. Cada fase tem quatro inteiros e um meio; nenhum meio no interior ou no canto.
- **EX-20 — Regressão FR:** seis paredes de 412,5/200/200/200/75/225 cm, altura 280 cm e base 25 × 12,5 × 7 cm. Fase A: 16 inteiros horizontais cobrem 400 cm do topo; inteiro vertical em `(525;25)` cm ocupa o canto direito e continua na lateral; o único meio da fiada fica na ponta livre `(525;225)` cm. Total A: 52 inteiros + 1 meio. Conferir as 40 fiadas, a fase invertida e a informação de ligação dos T. Fixtures nominal-v1 e nominal-v2 devem ser validadas antes da migração, preservando geometria, IDs e escolhas.

## 5. Lacunas e consequência prática

| ID | Lacuna | Tratamento em M2 | Condição para fechar |
|---|---|---|---|
| L1 | Altura instalada, folgas e encaixes variam; não há passo físico universal verificado | Passo nominal explícito de CT-02, sem alegação de fidelidade executiva | Desenho cotado de produto e detalhe de assentamento compatíveis; revisar regra se necessário |
| L2 | Diâmetros, rebaixos e passagem real de furos não definidos para bases genéricas | Eixos simbólicos; verificar apenas alinhamento nominal | Geometria cotada verificável; necessária somente numa evolução que prometa passagem física; M3 nominal não faz essa inferência |
| L3 | Ligação física do T, cruz e combinações fora do catálogo nominal | T conforme CT-05 e cruz conforme CT-12; combinações sem padrão recebem diagnóstico | Suporte geométrico não comprova ligação física; ligação resistente fora do escopo |
| L4 | Meio nominal não equivale automaticamente a meio cortado | Catálogo nominal, sem instrução de corte ou consumo de peça-base | Procedimento com dimensões finais e perda de corte antes dos quantitativos correspondentes |
| L5 | Transições de altura | CT-14/EX-75–79 ampliam L/cruz para T e vários encontros por ocupação ativa; combinações sem solução continuam diagnosticadas | Convenção nominal, sem dimensionamento de ligação física |

L1/L2/L4 são limitações físicas conhecidas, com tratamento nominal aprovado para M2. L3/L5 registram os limites restantes, sem bloquear os casos nominais definidos. Nenhuma delas exige cadastro de regras ou aprovação técnica na interface, nem autoriza marcar todo RF-01/04/05 como atendido.

### Convenções P1–P5 por marco

| ID | Convenção | Referência verificável | Limite |
|---|---|---|---|
| P1 | L alternado, mínimo geométrico de `2m` por ramo | CT-05; EX-03/14 | Verificar fechamento conjunto; não é mínimo normativo |
| P2 | Principal contínua e ramal encostado; aviso de ligação complementar | F3/F6; CT-05; EX-10/13 | Geometria derivada para o Ecovit, sem dimensionar ligação |
| P3 | Reconhecer cruz; excluir composição automática do primeiro M2 | Contrato legado; EX-11 | Preservado em nominal-v1–v7; composição implementada em M3.5, CT-12/EX-51–55 |
| P4 | Compatibilidade por ocupação e alternância em todas as fases | CT-05; EX-17/18 | Sem distância mínima universal ou busca genérica de solução |
| P5 | L → reta com continuidade de fase | CT-02; EX-15/16 | Convenção nominal; outras transições ainda fora do suporte |

As decisões P1–P5 estão definidas para o recorte nominal aprovado e foram implementadas em M2. Resultados de verificação estão no relatório do plano; M2 aceito pelo solicitante. Os exemplos e regras próprias do Ecovit não são reproduções de detalhes executivos das fontes.

**Definições posteriores, sem bloquear o modelo nominal de M2:** dimensões físicas de furos/encaixes antes de inferir passagem para graute ou instalações (L2); procedimento e perdas de corte antes de contabilizar peças preparadas (L4). Passo físico de fabricante (L1) só será necessário se o produto passar a prometer fidelidade a esse sistema, mediante revisão explícita da convenção atual.

## 6. Contrato de implementação

Contrato de processamento de M2. A representação vigente e a matriz de compatibilidade estão na Arquitetura §9/15–17; verificações e aceite de M2 no Plano §6.

- Domínio puro: entradas são modelo, ajustes e convenções; saída é composição e diagnósticos. Sem dependência de canvas ou banco.
- Regeneração integral e sequencial após alteração confirmada. Salvar modelo desatualizado, calcular, salvar resultado. Sem Worker, filas, debounce ou recálculo por região. Liberar controles em sucesso e falha.
- Falha na primeira gravação: manter edição em memória, informar falha e permitir download; não indicar “Salvo”. Evitar iniciar outra operação persistente enquanto a atual termina.
- Falha no motor: preservar modelo e último resultado, identificado como antigo. Falha ao salvar resultado: mantê-lo em memória e indicar que a gravação falhou. Download deve representar o estado atual e sua condição real.
- Separar atualização do cálculo e pendências geométricas. Casos não suportados são diagnósticos normais, não falhas técnicas.
- Compatibilidade de M2: envelope versão 2, com migração explícita da versão 1; preservar modelo, alturas, IDs e ajustes; iniciar resultado ausente/desatualizado e gerar conforme as regras. Não modificar o arquivo original.
- Persistir convenção nominal usada, composição por fiada, tipos/posições/orientações, relações com paredes, escolhas e diagnósticos. Não persistir nós Konva nem histórico de resultados. IDs de peças devem ser determinísticos para a mesma entrada, mas não precisam sobreviver a uma alteração geométrica.
- Reabrir versão 2 atualizada recupera a composição salva, sem regenerar silenciosamente. Validar relações e geometria do conteúdo importado; resultado inconsistente deve ser rejeitado com explicação, preservando o projeto aberto.
- Desfazer/refazer guarda modelo e ajustes, e regenera; não coloca milhares de peças em cada entrada do histórico. Navegação entre fiadas não recalcula.
- Não materializar malha vazia de todo o terreno: trabalhar com faixas/componentes ocupados. Sem otimização antecipada, mas com limites defensivos antes de alocar peças. O valor do limite e o ensaio realizado devem constar no relatório; limite excedido preserva o modelo e gera mensagem, nunca truncamento silencioso.

O [plano de M2](Ecovit-Plano-Implementacao.md), seção 5, define aceite, testes e ordem de trabalho. M2 está implementado e aceito. Os contratos de M3 estão na seção 8.

## 7. M2 — Motor, persistência e limites

**Alcance desta seção:** contrato histórico de composição de M2 e seu envelope versão 2; CT-14 amplia o suporte vigente a alturas diferentes. O aplicativo vigente usa envelope versão 11/nominal-v10 (M8), com leitura de envelopes 9/10 conforme a Arquitetura §26, sem nova convenção construtiva e inclui os contratos de M3.1–M4.2 nas seções seguintes. Transições de cruz por altura são definidas em CT-12.

- Motor em `src/domain/composition.ts`, sem dependências de interface. Padrões e recusas são cobertos por `tests/composition.test.ts`.
- No aplicativo entregue até M3.5, limites defensivos: soma de comprimentos de paredes até 20 mil módulos, até mil fiadas e produto dessa soma pelo total de fiadas até 100 mil células. É uma estimativa conservadora anterior à alocação, contando sobreposições na soma. Não é promessa de 100 mil peças: cenário verificado de 42 mil peças no relatório. Exceder preserva o modelo e gera diagnóstico, sem truncamento. M4.1 remove esse controle de orçamento de geração, conforme §11.1.
- Peças são verificadas por cobertura exata de células e exclusividade; eixos são derivados dos centros das células, inclusive quando ficam em meia unidade interna. Na convenção nominal-v3, percursos sem ramificação e ciclos usam pareamento contínuo; T separa o ramal da principal no cálculo. Não há busca combinatória. As implementações antigas permanecem somente para validar snapshots legados.
- Somente a transição simples L → reta é suportada para encontros de alturas distintas. Transições T e conjuntos com vários encontros em alturas diferentes recebem diagnóstico.
- Composição versão 2 é persistida; a abertura/importação recomputa um resultado de conferência para validar a composição salva. Se consistente e nominal-v3, preserva o snapshot; convenções antigas validadas são marcadas desatualizadas para regeneração pelo fluxo normal. Se divergente da própria convenção, rejeita. Essa conferência é distinta da regeneração após edição. Navegação não calcula.
- Falhas do motor mantêm modelo salvo e resultado desatualizado; falhas de gravação mantêm memória e download. Histórico guarda modelo/ajustes sem peças geradas.

## 8. M3 — Vãos, canaletas e grautes nominais

**Estado:** implementado e aceito. CT-07/08 implementados em M3.1, CT-09 em M3.2 e CT-10 em M3.3. Verificações e aceites no Plano §7. Fórmulas de ocupação são convenções nominais do Ecovit, não dimensionamento de apoios ou reforços.

### Evidências sobre vãos, canaletas e grautes

Os localizadores complementam as fontes F1–F7. Duas páginas do mesmo fornecedor não constituem confirmação independente.

| Fonte | Localizador | Evidência e consequência para a proposta |
|---|---|---|
| F1 — [Manual de projeto Ponto Eco](https://www.tijolo.eco.br/manual_projeto_tijolo_ecologico/) | Modulação; Planta de Primeira Fiada | Usa meio tijolo como módulo e exemplifica interrupção de colunas na janela, com retomada acima. Apoia distinguir intervalos separados, sem inferir continuidade através do vazio. |
| F3 — [Manual de construção Ponto Eco](https://www.tijolo.eco.br/manual_construcao_tijolo_ecologico/) | Gráute; Canaletas; Malha Estrutural | Descreve graute junto a aberturas/encontros e canaletas em níveis de vergas, contravergas e respaldo. Seus espaçamentos são apresentados no contexto do sistema e do projeto; o próprio manual atribui a especificação estrutural ao responsável técnico. Não converter essas medidas em constantes universais. |
| F6 — [Buson / FAU-UnB, 2007](https://www.jarfel.com.br/pdf-jarfel-sahara/autoconstrucao.pdf) | §6.8 e §6.9, páginas do PDF 68–69, impressas 62–63 | Relaciona vergas à alvenaria sobre aberturas, contravergas às janelas e apoios a colunas. Número de fiadas depende do vão/carga. Cintas podem ser interrompidas por portas. Não fornece uma regra universal derivável apenas de comprimento/largura/altura do tijolo. |
| F2 — [Produto Ponto Eco](https://tijolo.eco.br/produtos/tijolo_ecologico/) | Apresentação de inteiro, meio e canaleta; desenho técnico anunciado de 30 × 15 × 7 cm | Confirma variantes no sistema apresentado; não estabelece cotas universais de canais ou passagens para as três bases do Ecovit. Nenhuma dimensão interna nova foi adotada. |

A evidência de F6 nas páginas 68–69 é textual; não há medida inferida dessas figuras. F5 fundamenta somente as evidências da seção 2. Não há consulta integral de normas nem declaração de atendimento normativo.

**Síntese técnica:** as fontes permitem identificar funções e dependências dos elementos, mas não fecham um catálogo universal de apoios, canais, preparações e espaçamentos. O desenho nominal não verifica essas dimensões. L6/L8 delimitam as inferências físicas excluídas de M3. L7 define distribuição geométrica configurável, sem recomendação estrutural.

### CT-07 — Volume do vão e validação nominal

Usar `m = largura-base`, `h = altura-base`, `F = cota do piso`, `S = início absoluto da alvenaria`, `H = altura da parede`. As referências distintas `F` e `S` descrevem o contrato histórico e os exemplos legados; no contrato vigente de M4.1, `F = S = cota do pavimento`, conforme §11. Vão possui posição `s` desde a extremidade de menor coordenada, largura `w`, base relativa ao piso `b` e altura `a`. Sua projeção ocupa toda a espessura da parede e o intervalo longitudinal `[s, s+w)`; seu intervalo absoluto é `[B,T)`, com `B = F+b` e `T = B+a`.

- `s` e `w` são múltiplos de `m`; `w >= m`, `a > 0`, medidas representáveis em décimos de milímetro. Inserção/edição direta exige `0 <= s`, `s+w <= comprimento`, `S <= B < T <= S+H` e base/topo em limites de fiadas: `(B-S) mod h = (T-S) mod h = 0`. Não exigir `b mod h = 0` quando piso e alvenaria diferem.
- Porta inicia proposta com base zero; se zero for incompatível com `S`, solicitar escolha explícita de uma base realizável, sem criar soleira ou cortar fiada. Nenhum tipo autoriza recorte parcial de altura. Valores digitados mostram alternativas válidas próximas e respectivas diferenças; sem alternativa dentro dos limites, explicar o impedimento.
- Fiada `k`, numerada desde 1, ocupa `[S+(k-1)h, S+kh)`. Remover células somente quando houver interseção vertical de comprimento positivo com `[B,T)`. Limite compartilhado não remove a fiada vizinha.
- Separação de vãos (D3-02): na mesma parede, proibir interseção de comprimento positivo simultaneamente nos intervalos horizontais e verticais de dois vãos (sobreposição de volumes). Se os intervalos verticais se sobrepõem, exigir distância horizontal entre projeções de pelo menos `m`; contato lateral sem célula separadora é recusado. Não unir aberturas automaticamente.
- Permitir empilhamento quando as projeções horizontais se intersectam com comprimento positivo, parcial ou totalmente: ordenando os vãos por altura, exigir `B_superior - T_inferior >= h`. Limites já modulados garantem pelo menos uma fiada completa de alvenaria entre eles. Contato vertical e intervalo menor que `h` são recusados em edição direta. Esses `m`/`h` são limites do desenho nominal, não dimensões resistentes verificadas. Edições indiretas que violem a separação preservam os vãos e recebem diagnóstico localizável, conforme a política de pendências.
- A separação vertical vale desde M3.1. Em M3.2, quando `B_superior - T_inferior = h`, a canaleta superior do vão inferior e a inferior do superior usam a mesma fiada: unificar as células coincidentes e preservar ambas as origens, sem duplicar peças. Para separações maiores, gerar cada faixa imediatamente junto ao respectivo vão. Supressão voluntária de canaleta não muda o mínimo geométrico nem gera pendência estrutural.
- Vão pode chegar à ponta livre ou ao topo da parede; isso não é erro de desenho. Ausência de alvenaria superior dispensa candidato de verga nesse limite. Ausência de apoio lateral não bloqueia canaleta nominal nem cria pendência estrutural.
- Vão que invade células compartilhadas de um encontro fica salvo como intenção arquitetônica com conflito localizado, sem apagar a outra parede. Vão próximo, sem invadir encontro, é aceito geometricamente; não avaliar apoios resistentes no M3. Sem afastamento estrutural arbitrário.
- Redimensionamento da parede mantém coordenadas mundiais do vão e recalcula `s` (pode ficar negativo como pendência). Mudança de piso mantém `b`; mudança de início/altura mantém o vão e diagnostica incompatibilidades. Não deslocar, reduzir ou excluir vãos automaticamente. Exclusão da parede remove seus vãos e ajustes dependentes na mesma operação de histórico.

### CT-08 — Paginação junto aos vãos

Conservar o percurso e a fase de M2 para cada fiada antes da abertura. Subtrair da ocupação as células dos vãos válidos, sem reancorar a fase em cada trecho restante: par com duas células restantes conserva inteiro; par sem células desaparece; par com uma célula restante gera meio nominal nessa extremidade do vão. Meio anterior permanece se sua célula não for removida. Isso é escolha do catálogo, não instrução para cortar fisicamente um inteiro.

Nas fiadas abaixo/acima do vão, usar a paginação original daquela fiada, sem reiniciar A/B. A alternativa de encontro ainda inverte a fase do conjunto e deve ser conferida em toda a altura, agora incluindo aberturas. Casos sem vãos devem produzir a mesma geometria de nominal-v3. Canaletas, quando habilitadas, exigirão recomposição tipada e validação próprias de CT-09; não basta mudar a cor do inteiro.

Aplicar apenas em componentes já suportados por M2 e sem remoção de células do encontro. Não usar a abertura para esconder cruz ou transição de altura sem suporte. Verificar cobertura exata da união das faixas menos os volumes válidos dos vãos, colisões e eixos. Um componente com conflito geométrico permanece sem peças em todas as suas fiadas, conforme política de M2; componentes independentes continuam visíveis. Distinguir falta de geometria de elemento construtivo ainda não calculado.

No incremento M3.1, a alvenaria acima de uma abertura é apenas composição nominal: exibir informação persistida “Elementos sobre e sob vãos ainda não calculados nesta entrega”. Não desenhar uma verga fictícia nem classificar o conjunto como solução construtiva completa. No incremento M3.2, apenas incompatibilidade geométrica gera pendência; ausência de dimensionamento físico ou remoção voluntária não gera alerta de insuficiência estrutural.

### CT-09 — Canaletas nominais configuráveis

Decisão confirmada: faixas globais por parede em níveis configurados e uma fiada automática imediatamente acima/abaixo de qualquer vão. Sem armadura, apoio calculado, extensão lateral resistente, verificação de cavidade ou peça preparada na obra. Canaleta inteira/meia usa envelope nominal de inteiro/meio e canal longitudinal esquemático. Contornos da malha e fase permanecem; símbolo de canal distingue a peça de um tijolo comum. Encontro mostra trajeto nominal; não gera pendência apenas porque falta dimensão física de conexão.

Nível global `c` é topo da fiada em relação ao piso: `k=(F+c−S)/h`, inteiro positivo. A faixa ocupa `[F+c−h,F+c)`. Se esse intervalo não estiver contido na parede, não criar material adicional; nível fora da altura daquela parede não gera peças ali. Valor fora dos limites de fiada pede alternativa explícita. Valores iniciais estão na [tabela normativa do PRD §14](Ecovit-PRD.md#padrões-normativos-de-m3); não hardcodificar número de fiada independentemente de h/piso/início.

Vão `[B,T)`: faixa superior `[T,T+h)` se houver alvenaria até `T+h`; inferior `[B−h,B)` se houver alvenaria desde `B−h`. A regra independe do tipo: porta na primeira fiada não tem faixa inferior, porta elevada tem. Vão até topo da parede não cria faixa acima. Não tratar essas ausências como erro estrutural. A faixa superior nunca começa dentro do vazio.

Alcance horizontal: largura do vão mais meio tijolo de cada lado. Para posição s, largura w e módulo m, intervalo solicitado [s−m,s+w+m), comprimento w+2m. Extensão por lado: 12,5 cm na base 25, 15 cm na base 30 e 14 cm na base 28. É convenção nominal de desenho, sem dimensionamento de apoio e sem depender de eixo de graute. Intersectar com alvenaria existente da parede; não prolongar a parede ou preencher aberturas para completar a extensão. Descontar todos os vãos que interceptam a fiada, inclusive um segundo vão mais alto. Unificar demandas globais/de vãos em uma única ocupação, com múltiplas origens. Nos encontros, compor pela união de células e preservar uma única peça compartilhada; representar conexões apenas nominalmente. Onde uma demanda cobre uma célula de um inteiro e não a outra, separar em dois meios nominais (um canaleta e um comum), sem mudar a fase restante; não ampliar a faixa nem invadir abertura para manter inteiro.

A remoção confirmada cobre toda a faixa da parede naquela fiada, não um trecho ou tijolo. Inclui trechos separados por aberturas; preserva outras fiadas. A seleção deve identificar a parede hospedeira. Realçar antes de remover, inclusive células compartilhadas afetadas. Converter área suprimida em tijolos comuns da mesma paginação, recompondo pares quando possível; não apagar alvenaria. Supressão prevalece sobre todas as origens automáticas coincidentes, inclusive vizinhas, e é preservada após regeneração. Não recriar uma faixa por outra origem nem gerar alerta de reforço faltante.

### CT-10 — Graute nominal automático e clique por furo

Categorias habilitadas e distância máxima `d` positiva vêm da configuração do projeto, cujos campos, efeitos e valores iniciais estão no [PRD §14](Ecovit-PRD.md#padrões-normativos-de-m3). A geração usa as convenções abaixo, sem consulta de diâmetro, aço, resistência ou ligação física entre canal e furo.

Convenção geométrica simples para implementação: encontros usam centros das células compartilhadas do encontro suportado (um eixo no canto L ou centro T); laterais usam o centro da célula imediatamente anterior/posterior ao vão, quando existente; ponta livre usa a célula terminal sem encontro. Duplicatas se unificam por coordenada, sem triplicar automaticamente os furos do canto. Essas escolhas são convenções de desenho do Ecovit, não regras construtivas das fontes. A cruz de M3.5 usa o eixo central nominal de CT-12.

Para distribuição intermediária, trabalhar por parede em ordem de coordenadas, usando candidatos das categorias habilitadas como âncoras. Primeiro/último centros de células são referências virtuais quando ponta livre não estiver habilitada; não criam graute por si. Em cada intervalo entre âncoras, acrescentar eixos em passos máximos `q=floor(d/m)` células, desde a menor coordenada, até a distância restante ser `<=d`. Se `d<m`, explicar que não existe espaçamento entre eixos distintos nessa malha, oferecendo `m`, sem arredondamento silencioso. Espaçamento efetivo nunca excede d antes dos ajustes manuais, onde existirem eixos elegíveis. Não gerar candidatos num eixo que não tenha nenhum intervalo de alvenaria. Onde houver abertura, descontar seu vazio dos intervalos de graute, conforme EX-22/33; não exigir alvenaria contínua na altura inteira para aceitar os trechos acima/abaixo. Interrupção por abertura é condição de desenho, não insuficiência estrutural.

Graute representa a interseção do eixo com a alvenaria do pavimento: início/topo das paredes associadas, descontados todos os vãos. Intervalos separados não se conectam através do vazio. Eixos de células de canaletas continuam clicáveis como marcadores nominais, sem alegar geometria interna física. Não propagar para outro pavimento. Em M4, lajes não recortam os intervalos nem geram diagnósticos de interferência, conforme §11.

Em Fiada, ferramenta contextual Graute: somente marcador de furo existente na fiada ativa recebe hover/clique. Vazio mostra +; existente tem preenchimento escuro e mostra −. Clique adiciona/remove o eixo completo, incluindo intervalos acima/abaixo de aberturas. Furo da referência sobreposta e espaço vazio não recebem edição. Rótulos acessíveis “Adicionar graute”/“Remover graute”, foco de teclado e acionamento equivalente. Fora dessa ferramenta, manter seleção normal; navegação nunca altera graute.

Resultado final = automáticos e inclusões manuais, menos exclusões explícitas. Aplicar exclusões depois de distribuir automáticos: não recolocar outro graute para compensar remoção e atingir d. d é parâmetro da proposta automática, não restrição imposta ao usuário após ajustes. Adicionar em eixo excluído cancela a exclusão; remover inclusão manual também bloqueia eventual automático naquele eixo. Mudança de abertura recalcula intervalos mantendo coordenada horizontal. Eixo sem nenhuma alvenaria mantém ajuste não aplicado, com ação de descarte; não transferir para furo vizinho.

### Limitações físicas de M3

| ID | Situação em M3 | Tratamento |
|---|---|---|
| L2/L8 | Dimensões físicas de furos/canais fora do alcance | Sem verificação física nem bloqueio de geração; marcadores e canais esquemáticos, sem volumes inferidos. |
| L6 | Apoios e dimensionamento fora do alcance | Uma fiada superior/inferior nominal; níveis globais configurados. Alcance local confirmado: largura do vão + um módulo por lado, como convenção nominal, sem dimensionamento de apoio. |
| L7 | Distribuição convertida em configuração de desenho | Categorias opcionais e máximo inicial 100 cm; convenção por malha acima; usuário pode remover/adicionar. |

As fontes contextualizam funções e limites dos elementos. Não exigem cadastro de fabricante ou aprovação estrutural. Sem armaduras, grampos ou peças de corte físico no M3. Quantitativos serão evoluídos futuramente; nenhuma regra atual calcula volume de graute a partir de diâmetro desconhecido.

### Exemplos de M3 independentes do algoritmo

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

### Exemplos de padrões e ajustes nominais

- **EX-31 — Nível global:** piso/início zero, h=7, níveis padrão confirmados 112/224: fiadas 16/32, intervalos 105–112/217–224. Vão com topo 217 também solicita canaleta em 217–224: uma única ocupação. Piso 10/início 12 e nível relativo 112 dá (10+112−12)/7 não inteiro: pedir alternativa 107 ou 114 cm relativos ao piso.
- **EX-32 — Grautes por intervalo:** parede reta 400 cm, m=12,5; somente distribuição por intervalos habilitada, d=100. Âncoras virtuais 6,25 e 393,75 cm; intermediários 106,25/206,25/306,25 cm. Habilitar pontas acrescenta 6,25/393,75. Remover 206,25 preserva sua ausência mesmo após recálculo; não inserir substituto para compensar o novo intervalo de 200 cm.
- **EX-33 — Clique em janela:** eixo 106,25 em EX-22: na fiada 10 há furo clicável; incluir cria [0,98) e [210,280). Fiada 20 é vazio nesse eixo e não admite clique. Remover na fiada 35 retira ambos os intervalos. O vazio da janela não é alvo de edição.
- **EX-34 — Bases e distância:** d=100 e m=15 usam passos de até 6 células = 90 cm; m=14 usa até 7 células = 98 cm. Nenhum arredondamento para 105/112 cm. d menor que m pede correção explícita.
- **EX-35 — Supressão coincidente:** uma faixa solicitada por nível global e por topo de vão é mostrada uma vez. Remover a faixa na fiada remove todas as origens em toda a parede selecionada, inclusive trechos separados e devolve tijolos comuns, mantendo grautes existentes. Regenerar ou reabrir não a restaura. Restaurar o ajuste explicitamente permite a automação novamente.

Exemplo de aplicação dos padrões normativos do PRD §14: para h=7 e piso/início zero, janela com base 112/topo 217 (altura 105 cm) ocupa fiadas 17…31; canaleta inferior na 16 e superior na 32. Níveis globais com topo 112/224 coincidem com essas faixas e não duplicam peças. Os números deste exemplo são mantidos como resultado esperado independente, sem representar implementação nem teste do aplicativo.

## 9. M3.4 — Convenções de edição geométrica

Definições do produto, não pesquisa ou recomendação construtiva. Sem novo apoio, espaçamento resistente ou peça especial. CT-07–10 permanecem; CT-11 explicita exceções de transformação para operações de edição autorizadas no PRD §15. Exemplos abaixo são resultados esperados independentes; sua verificação na implementação está registrada no Plano §8.

### CT-11 — União e translação com preservação de intenção

Normalizar intervalos longitudinais [a,b), a < b, pela face externa e faixa de espessura ocupada. Continuidade liga extremidades sem lacuna na posição confirmada; diferenças de sentido de desenho não alteram compatibilidade. A união de intervalos contíguos é [min(a),max(b)); não eliminar uma parede perpendicular no encontro. Altura/pavimento/faixa devem coincidir. Não usar união para resolver sobreposição longitudinal positiva.

Vão em posição mundial u passa a offset u − a_novo ao unir; mantém u, largura, base e altura. Na translação (dx,dy), preservar offset e somar delta às coordenadas da parede. Eixo manual exclusivo soma o mesmo delta; compartilhado mantém original nas associações imóveis e copia intenção transladada para a parede movida. Inclusões e exclusões recebem o mesmo tratamento; eixos automáticos são recalculados por CT-10. Deslocamento deve ser múltiplo de m nos dois eixos; não arredondar centros fracionários de módulos ímpares, pois a identidade persiste na origem inteira da célula.

Na união, alcance de supressão é a extensão original da parede à qual se aplicava, não o comprimento final. Intersectar intervalos herdados com células de alvenaria da parede consolidada; manter união das supressões sobrepostas e preservar suas identidades. Novas remoções continuam cobrindo a parede/fiada inteira. Desfazer deve recuperar alcance original e associações, além da geometria. Para translação, cotas verticais permanecem; alcances longitudinais herdados acompanham o delta e supressões de parede inteira acompanham sua entidade.

Redimensionamento continua regido por CT-07: conserva posição mundial dos vãos e eixos; não confundir com movimento. União não garante fase idêntica à paginação independente das antigas paredes: recompor o percurso resultante preservando escolhas aplicáveis, nunca conservar peças antigas como entradas. Conflitos de encontros e alturas continuam diagnosticados; nenhuma edição implica aprovação estrutural.

Movimento que cria continuidade compatível compõe translação e união atomicamente. Calcular os alcances herdados depois do delta, preservando trechos das paredes imóveis. Vãos movidos conservam a posição mundial de destino e vãos imóveis sua posição anterior; offsets são derivados da origem final consolidada. Desdobrar ajustes compartilhados antes de remapear associações; desfazer restaura o estado anterior a ambas as transformações. A prévia usa essa mesma composição de operações.

### Exemplos de aceite de M3.4

Base 25×12,5×7 cm, piso/início zero, altura 280 cm, parede horizontal ocupando y=0…12,5, salvo indicação contrária. Coordenadas em cm nesta tabela.

| ID | Entrada | Resultado esperado |
|---|---|---|
| EX-36 | Parede A [0,100); desenhar [100,200) | Uma parede [0,200), ID de A, uma operação de histórico; desenhar em sentido inverso dá mesma geometria. |
| EX-37 | A [0,100), B [200,300); desenhar ponte [100,200); janela de B em [225,250) | Uma parede [0,300), ID de A, janela com mesmo ID e offset 225; desfazer restaura A/B e offset 25 em B. Parede perpendicular na coordenada 100 permanece independente. |
| EX-38 | Mesmo EX-37; A tem supressão no topo absoluto 112 e B não | Supressão herdada somente [0,100), mesma identidade; ponte/B conservam canaletas quando houver demanda. Nova remoção completa suprime [0,300); restaurar só esta última deixa supressão herdada. |
| EX-39 | Parede [0,400), janela offset 100/largura 100/base 98/altura 112, eixo manual em origem (100,0); mover delta (25,50) | Parede [25,425), y=50; janela [125,225), cotas iguais; origem de graute (125,50), intervalos [0,98) e [210,280). Vizinha fica onde estava; IDs exclusivos preservados. |
| EX-40 | L com ajuste manual compartilhado na origem (0,0); mover só parede horizontal por (25,50) | Original mantém ID, origem (0,0) e associação vertical; cópia em (25,50) com novo ID e associação horizontal. Mesma regra para exclusão. Desfazer recupera um único ajuste compartilhado. |
| EX-41 | Ponte de EX-37 com B altura 273; depois variante B com faixa de espessura no lado oposto; tentativa de mover para sobreposição | Paredes incompatíveis não são unidas, motivo na prévia; movimento para conflito mantém intenção com diagnóstico, sem mover vizinha. Escape/soltura fora preservam todo documento. |
| EX-42 | Hover nas quatro ferramentas, bases de m=12,5/15/14, vários zooms; abertura fora de parede; navegar com Espaço | Destaque representa mesmo encaixe do início confirmado, quadrado de lado m; abertura sem hospedeira não tem destaque elegível; navegar/hover não alteram documento, cálculo ou histórico. |
| EX-43 | A [0,100), B [200,300), ambas y=0; C [0,100), y=50, com janela offset 25/largura 25 e supressão em 112; mover C por (100,−50) | Prévia e confirmação de uma parede [0,300), ID de A; janela de C em [125,150), mesmo ID, offset 125; supressão herdada só [100,200). Desfazer restaura A/B/C e janela em [25,50), y=50, offset 25; refazer recupera mesmos IDs. |

### CT-11 — Identidade, alcance e reconciliação de ajustes

Extensão de uma única entidade preserva supressão de parede inteira abrangendo o novo trecho. Congelar alcance somente na consolidação de duas ou mais entidades existentes. No desenho que toca diretamente alturas distintas, não escolher uma participante por ordem nem fazer união parcial: prévia mostra a altura padrão para o novo trecho independente. Na cadeia transitiva compatível, interromper a busca em fronteira incompatível. Extensão/união de zero comprimento e movimento de delta zero não são comandos para normalizar paredes antigas.

Deslocamento é snap do delta desde o ponto de pega; não snap da posição inicial do mouse. A face/espessura conserva a referência durante todo o gesto. Alças selecionadas mantêm prioridade sobre criação, e o eixo da parede não muda quando o usuário arrasta diagonalmente.

Exclusões de graute aplicáveis prevalecem sobre inclusões coincidentes pela geometria, não pela ordem dos registros. Clique explícito muda a ação de todos os registros elegíveis no eixo sem perder IDs; descarte age em uma intenção identificada. Alcances de canaleta compartilham parede/cota sem compartilhar identidade; restauração é por UUID. A união de duas entidades não deve apagar registros geométricos iguais que representam intenções distintas.

Escolha de encontro só continua aplicada após troca de IDs/segmentação se ocupação, alturas e percurso canônico do componente inteiro permanecerem equivalentes. Se a geometria muda ou duas escolhas passam a disputar um componente, conservar escolhas pendentes com âncora e ID, sem escolher uma fase arbitrária. Não reancorar fase usando apenas ID sobrevivente. Regras de persistência/diagnóstico em Arquitetura §16.

| ID | Entrada | Resultado esperado |
|---|---|---|
| EX-44 | A [0,100) com supressão wall em 112; B [250,300); prolongar A até 200; redimensionar início de B até 200, sem união; desenhar extensão [300,400) consolidando A/B | Extensão simples mantém wall abrangendo [0,200); posterior união converte para range [0,200), não [0,100), sem suprimir B nem a nova extensão [300,400). Mesmo ID do ajuste. |
| EX-45 | Dois ajustes elegíveis no mesmo eixo, um include e outro exclude com IDs distintos; inverter ordem no arquivo; depois Adicionar pelo furo | Antes do clique, eixo ausente nas duas ordens; após adicionar, ambos viram include com seus IDs/associações preservados. Descartar um não apaga o outro; ajuste inelegível na mesma coordenada permanece pendente. |
| EX-46 | Escolha B num L; mover um ramo para desconectar; depois desfazer; variante: componentes com escolhas distintas unidos pelo gesto | Primeira escolha preservada pending com ID/âncora localizável; desfazer recupera escolha aplicada. Na união de componentes, nenhuma fase prevalece pela ordem; intenções afetadas ficam pending até escolha explícita/descarte. |
| EX-47 | A [0,100) com porta [75,100), B [100,200) com porta [100,125), ambas base 0/topo 105; desenhar extensão [200,300) que consolida a cadeia | Uma parede [0,300), duas portas com IDs/posições preservados; ausência de módulo entre elas gera diagnóstico de separação, sem recuar, reduzir ou excluir portas. Desfazer restaura hospedeiras originais. |
| EX-48 | Parede [0,100); iniciar janela na extremidade 100 e arrastar até 75; depois usar múltiplas hospedeiras e mudar zoom sem mover mouse | Hover mostra célula interior [87,5;100); direção negativa usa borda inicial 100 e gesto propõe vão [75,100). Alvo ambíguo pede escolha antes do novo arraste; destaque acompanha câmera/ferramenta sem alteração do documento. |

### CT-11 — Célula inicial da criação

A posição ativa da cruz seleciona a célula que contém o ponto, sem aproximação ao vértice mais próximo. Para coordenadas negativas, usar floor, não truncamento para zero. Direção do arraste determina a borda longitudinal inicial, garantindo inclusão da célula inteira tanto em positivo quanto em negativo. O ponto final continua modular; sua interpretação é distinta da seleção da célula inicial. A célula inicial orienta o gesto de criação; não desloca elementos salvos nem integra o formato do arquivo.

- **EX-49:** m=12,5; cursor em (52,5;52,5), (58,75;52,5), (52,5;58,75) ou (58,75;58,75) cm destaca a mesma célula [50,62,5)×[50,62,5). Em (-41,25;-41,25), destaca [-50,-37,5) em ambos os eixos.
- **EX-50:** célula inicial longitudinal [50,62,5), cursor de pressão 58,75; arrastar até 25 em sentido negativo gera [25,62,5), comprimento 37,5; até 100 em positivo gera [50,100), comprimento 50. Vale para abertura na hospedeira e para parede com faixa transversal contendo a célula, nas duas orientações/lados. Não excluir a célula inicial por usar sua borda inferior como âncora fixa.

## 10. M3.5 — Convenção da cruz nominal

### CT-12 — Cruz, fases e composição do conjunto

**Estado:** implementado e aceito em M3.5. Verificações no Plano §9. CT-12 usa CT-02/03/04/05/06/08/09/10 e os exemplos independentes abaixo. É uma convenção de desenho nominal, sem dimensão física, regra de fabricante ou ligação resistente confirmada. EX-11 e nominal-v1–v7 definem o contrato legado de cruz bloqueada; nominal-v8 aplica a composição de CT-12.

Reconhecer cruz pela célula com quatro vizinhos ortogonais na união da alvenaria ativa, não pelo número/IDs das paredes nem só por extremidades coincidentes. Cada ramo deve existir nessa fiada. Contato por vértice, sobreposição colinear e região mais espessa que os padrões existentes não viram cruz válida automaticamente.

Definição de fase: `p=((n−1) mod 2) XOR phase_do_componente`, sem reiniciar em mudança de altura. A usa continuidade horizontal pela célula central; B usa continuidade vertical. Os dois ramos perpendiculares terminam no contato com a faixa principal, sem ocupar a célula central. A mudança de direção é uma convenção geométrica de duas fases, não evidência de amarração resistente. Informar “Composição nominal; ligação entre paredes não dimensionada”, uma vez por componente, sem classificar como erro estrutural.

Separar os contatos dos ramos transversais no percurso de paginação, sem retirar células do modelo, criar paredes novas ou abrir vazios. Aplicar CT-04 e a paginação contínua de CT-05 aos percursos restantes: pares de células ortogonalmente adjacentes são inteiros; células terminais não pareadas são meios. Percursos retos sem cantos começam na menor coordenada; ramal com um contato inicia nesse contato; com dois contatos usar ordenação geométrica dos extremos. Cantos e ciclos seguem a ordenação/fechamento de CT-05. Na separação, a faixa principal conserva suas duas conexões; se outro encontro exigir cortar/ocupar essa mesma conexão de modo incompatível, diagnosticar o conflito, sem decidir pela ordem ou inserir peças arbitrárias.

A separação de T permanece a de CT-05. Cruzes usam CT-12 em cada fase; depois disso cada região deve ser percurso sem ramificação ou ciclo par. Verificar as duas fases no conjunto inteiro, com uma ocupação por célula, sem peça em L/cruz, meios interiores artificiais ou disputa entre reservas. Meios no contato de ramos separados são términos nominais, como em T; não afirmar corte executado. Não adotar distância mínima universal entre encontros: conferir compatibilidade por células/peças nas duas fases. O cenário de contorno fechado de EX-53 é obrigatório.

Para alturas diferentes, obter a ocupação ativa antes de identificar/separar encontros naquela fiada. A transição simples cruz → reta de EX-54 é obrigatória. Aplicar CT-05 a L/T ainda presentes, sem prolongar parede encerrada ou reiniciar fase. Outras transições/combinações só são resolvidas se os padrões documentados cobrirem integralmente ambas as fases; caso contrário conservar diagnóstico específico. Não prometer solução universal para qualquer desenho com cruz.

Só após a paginação, subtrair vãos por CT-07/08, preservando sua validação de encontro; depois tipar canaletas e gerar grautes por CT-09/10. A invasão de encontro considera sobreposição vertical efetiva: o vão acima do topo de uma parede encerrada não invade aquele encontro das fiadas inferiores. Graute de encontro usa um eixo no centro da célula compartilhada, com associações das paredes presentes e intervalos reais de alvenaria; não gerar quatro eixos por quatro ramos. Canaletas compartilham ocupação/origens, respeitando supressões e alcances herdados de CT-11. Seleção/prévia inverte a fase global do componente; escolhas pendentes de M3.4 não passam a ativas silenciosamente.

### Exemplos independentes de M3.5

Índices de células inteiros `(x,y)`, lado m, altura-base h; A/B como acima. Desativar faixas globais/categorias de graute para conferir apenas peças comuns. Aplicam-se às bases 25/30/28 e módulos personalizados compatíveis, sem nova hipótese física.

| ID | Entrada | Resultado esperado |
|---|---|---|
| EX-51 | Cruz mínima: `(0,0),(-1,0),(1,0),(0,-1),(0,1)` | 5 células. A: inteiro `(-1,0)–(0,0)`, meios `(1,0),(0,-1),(0,1)`. B: inteiro `(0,0)–(0,1)`, meios `(0,-1),(-1,0),(1,0)`. Cada fase tem 1 inteiro + 3 meios; nenhum inteiro liga duas células através do centro já ocupado. EX-11 continua exigindo diagnóstico nas convenções antigas. |
| EX-52 | Horizontal `x=-3…3,y=0`; vertical `y=-3…3,x=0` | 13 células, 5 inteiros + 3 meios em cada fase. A: principal horizontal com pares `(-3,-2),(-1,0),(1,2)` e meio x=3; ramais verticais pareiam distâncias 1/2 desde o contato e deixam meio em ±3. B: principal vertical com meio y=-3, pares `(-2,-1),(0,1),(2,3)`; ramais horizontais deixam meio em ±1 e pareiam distâncias 2/3. Centro único, alternância de direção, sentido do desenho/IDs sem efeito. |
| EX-53 | Contorno externo `16m×12m`, espessura m para dentro; vertical interior células `(8,y),y=1…7`; horizontal interior `(x,4),x=1…12`; todas altura 3h | Seis paredes, um componente: perímetro `2×16+2×12−4=52` células; interior `7+12−1=18`; total 70. T em `(8,0)` e `(0,4)`, cruz `(8,4)`, quatro L externos. A: anel 26 inteiros, horizontal interior 6, dois ramais verticais de 3 células com 1 inteiro + 1 meio cada: total 34 inteiros + 2 meios. B: anel 26, principal vertical 3 inteiros + 1 meio, ramal horizontal de 7 células 3 inteiros + 1 meio, de 4 células 1 inteiro + 2 meios: total 33 inteiros + 4 meios. Nada do contorno desaparece; inverter fase troca a sequência inteira. |
| EX-54 | EX-52 com horizontal altura 3h e vertical 2h; variante alturas trocadas | Primeiras duas fiadas cruz A/B; terceira tem só a reta de 7 células, 3 inteiros + 1 meio, na fase absoluta A. Com alternativa global começa B/A e terceira é B; posição do meio segue CT-04, sem reset de fase. Nenhum trecho acima de sua altura. |
| EX-55 | EX-53 com m=12,5,h=7,altura 280; janela na parede inferior, células x=4/5,y=11, base 98/topo 210; incluir graute manual em origem `(4m,11m)` e testar níveis/supressões | 70 células nas fiadas completas; 68 nas fiadas 15–30, descontadas só as duas células do vão. Sem peça invadindo o vazio ou reinício de fase. Graute nesse eixo ocupa [0,98) e [210,280), sem trecho no vazio; centro da cruz tem um eixo quando Encontros está habilitado. Canaletas e ajustes seguem CT-09/10/11 sem duplicação. Salvar/desfazer/mover/transportar preserva intenção e composição correspondente. |

Conferência independente: `2I+M` reproduz 5/13/70 células; EX-53 tem contorno compartilhado só uma vez e divisão explícita das regiões nas duas fases. As verificações do Plano §9 incluem essas contagens, rotações/reflexões e encontros próximos. Orientação padrão é pelos eixos mundiais, não pelos IDs ou ordem de desenho. EX-53 define medidas próprias; não deriva dimensões de pixels de imagens de referência.

## 11. M4 — Pavimentos e lajes

**Estado:** pavimentos implementados em M4.1; lajes (M4.2) implementadas conforme §11.2; comparação visual (M4.3) implementada conforme §11.4, com aceite global do solicitante registrado no Plano §10. Sem pesquisa construtiva específica adicional. M4 admite até quatro pavimentos, sem distinção de piso ou cobertura. Cada pavimento tem cota única `Z`, especificada na criação, com `Z/h` inteiro, onde `h` é a altura-base. Admitir negativos e zero; impedir cotas iguais. Ordenar por cota crescente e derivar adjacência dessa ordem. Todas as paredes começam em `Z`, e a numeração das fiadas reinicia em 1. O topo de cada parede é `Z+H`, com compatibilidade modular de `H` por CT-02. Bases de vãos e níveis de canaletas são relativos a `Z`. Não há referência separada de piso acabado nem conversão de arquivos anteriores, que são incompatíveis com M4.1.

Cada pavimento admite no máximo uma laje, com ou sem paredes. A face superior coincide com a cota do próprio pavimento e a face inferior é essa cota menos a espessura positiva. A espessura cresce para baixo. A laje não limita ou recorta a composição das paredes de qualquer pavimento; suas aberturas não mudam as alturas dessas paredes. Para representar uma laje acima das paredes, criar outro pavimento na cota desejada e desenhar a laje nele, podendo deixá-lo sem paredes. Não há sugestão ou proposta de atualização de cotas em função das lajes. Comportamento normativo em RF-08/13; diretrizes técnicas na Arquitetura §18.

Exemplos nominais de referência para detalhar as verificações de M4, com altura-base de 7 cm: cotas −21, 0 e 280 cm são admissíveis e ordenadas assim, independentemente da ordem de criação; cota 281 cm não é confirmada e exige alternativa modular explícita; cota 280 cm repetida é recusada. Pavimento em 0 cm com laje de 21 cm ocupa [−21,0]; pavimento em 280 cm com laje de 21 cm ocupa [259,280]. Paredes inferiores em 0 cm podem ter altura 259 ou 280 cm, sem recorte pela laje e sem diagnóstico por contato ou interseção com ela. Alterar a espessura de 21 para 14 cm move a face inferior para 266 cm, mantendo a face superior, as paredes e as cotas dos pavimentos. Paredes fora do contorno ou sob aberturas mantêm as mesmas alturas. A espessura não precisa ser múltipla de `h`.

Contornos e aberturas de laje são ortogonais simples, com vértices na malha horizontal de meio tijolo. Desenhar por vértices com prévia ortogonal, fechamento explícito e cancelamento por Escape; mover a laje translada suas aberturas pelo mesmo vetor. Aberturas retiram área da laje e ficam estritamente internas, sem tocar ou sobrepor umas às outras ou a borda externa. Uma edição que viole essas condições não é confirmada, preservando o estado anterior; não excluir, mover ou reduzir aberturas automaticamente. CT-13 e EX-65–74 detalham a validade antes dos algoritmos; edição de bordas confirmada em D42-01/RF-13.

Não executar detecção de colisão, apoio ou interseção entre elementos de pavimentos distintos, nem gerar avisos de desalinhamento ou interrupção entre andares. Todas as validações existentes continuam dentro de cada pavimento isolado, incluindo colisões de peças, cobertura de células, modulação, encontros, vãos, canaletas e ajustes. A laje mantém a validade de contorno/aberturas; não acrescentar um verificador volumétrico neste marco. Incluir nas verificações duas paredes com mesma geometria horizontal: no mesmo pavimento, a sobreposição indevida mantém o diagnóstico existente; em pavimentos distintos, não criar encontro nem diagnóstico de colisão ou apoio entre elas.

A referência de pavimento é exclusiva de Planta: escolher um adjacente por vez, inferior ou superior, com aparência atenuada e identificação, sem edição. Em Fiada, conservar somente a referência de fiada adjacente do próprio pavimento. Troca de pavimento mantém câmera, limpa seleção, cancela gestos/prévias e recupera a última fiada local da sessão. Sem paredes, Fiada apresenta estado vazio, sem índice fictício. Novo pavimento vazio usa a altura padrão da criação do projeto, com edição e validação modular antes de confirmar, sem herdar outro andar. Não inventar apoios, resistência ou continuidade física através da laje. Não se considera esta definição uma comprovação estrutural.

A independência dos grautes e de seus ajustes por pavimento é definida em RF-07, com contrato técnico na Arquitetura §18. Ao detalhar os exemplos de M4, incluir dois pavimentos com eixos nas mesmas coordenadas horizontais e inclusão/exclusão individual em apenas um deles, verificando a preservação do outro e os limites verticais próprios. Essa decisão define o alcance da edição nominal; não estabelece continuidade física entre andares nem acrescenta espaçamentos ou regras estruturais.

Duplicação e mudança de cota preservam medidas relativas, transladando também cotas absolutas de ajustes pela diferença de cotas. Duplicação usa novos IDs e referências internas remapeadas, inclusive para escolhas e ajustes pendentes; remoção desfazível preserva os demais e impede excluir o último pavimento, conforme RF-08. Os exemplos de M4 deverão cobrir esses casos e a recusa de documentos anteriores sem migração.

### 11.1. M4.1 — Referências e exemplos para pavimentos

**Estado:** implementado em nominal-v9. Exemplos EX-56–64 são referências geométricas independentes; as verificações efetivamente executadas e o aceite global do solicitante estão no Plano §§10–10.1. Contrato de dados em Arquitetura §19, tarefas/aceite em Plano §10.1. Não acrescentam convenção resistente nem mudam a paginação de CT-01–12.

Usar cota única `Z`, `m = largura-base`, `h = altura-base`, e sempre número local da fiada. Aplicar CT-02/07/09 com `F=S=Z`. Configurações comuns do projeto são avaliadas separadamente em cada pavimento; inclusões/exclusões, supressões e escolhas têm propriedade local explícita. Nenhuma comparação geométrica entre andares faz parte do motor. M4.1 mantém lajes ausentes; os exemplos de laje da seção 11 pertencem a M4.2.

| ID | Entrada nominal | Resultado esperado |
|---|---|---|
| EX-56 | Base 25×12,5×7; térreo inicial 0 e novos em 280, −21 e 350 cm. Durante a criação do terceiro ou quarto, tentar 281 e repetir 280; depois tentar criar o quinto | Ordem final −21/0/280/350, independente da ordem de criação e sem mudar UUIDs. Cota 281 apresenta alternativas 280/287, sendo 280 indisponível por duplicação; não confirmar sem escolha válida. Cota repetida e quinto pavimento recusados, sem estado parcial. |
| EX-57 | Dois pavimentos `Z=0` e `Z=41h`; reta nas mesmas coordenadas, comprimento `8m`, altura `3h`, sem vãos ou canaletas. Executar com bases 25×12,5×7, 30×15×7 e 28×14×6 | Ambos têm três fiadas locais e sequência A/B/A: 4 inteiros; 3 inteiros + 2 meios; 4 inteiros. `2I+M=8` células em cada fiada. Para h=7, primeira fiada superior local [0,7), global [287,294); a cota de 41h não troca a fase local. Peças/componentes têm identidades distintas entre andares; nenhum diagnóstico por sobreposição horizontal. |
| EX-58 | EX-57 com automáticos de graute desligados; incluir eixo em origem de célula `(0,0)` só no inferior; depois incluir no superior e excluir no inferior. Variante: superior em `Z=2h`, com paredes de altura `3h` nos dois andares | Primeiro somente inferior tem intervalo [0,3h). Após as duas últimas ações, só superior mantém [41h,44h). Ações preservam UUIDs e associações locais; ordem de armazenamento não mistura os eixos. Na variante, volumes dos dois andares se sobrepõem em altura por `h`, sem diagnóstico entre pavimentos. Inserir uma segunda parede colinear sobreposta no mesmo inferior continua gerando o diagnóstico existente só no conjunto afetado; superior permanece composto. |
| EX-59 | h=7; pavimento em 280 com parede altura 280, janela base 112/altura 105, nível comum 112, supressão absoluta em 392; outro pavimento em 0 com geometria coincidente. Alterar 280 para 350 | Delta +70: janela mantém base/altura; global passa de [392,497) para [462,567). Supressão passa de 392 para 462, conservando fiada 16 e ID; alcances e âncoras x/y não mudam. Supressões dormentes/pendentes também recebem delta. Outro pavimento e configurações comuns ficam intactos. Desfazer/refazer restaura cotas, IDs e aplicabilidade. |
| EX-60 | Base 25×12,5×7; pavimento em 280, paredes de altura 280 formando L: faixas horizontais [0,400)×[0,12,5) e verticais [0,12,5)×[0,100). Escolher alternativa válida do encontro, usar o nível comum 112 já existente nas configurações iniciais e suprimir uma faixa no topo absoluto 392. Duplicar para cota 420 e editar a cópia | Novos UUIDs para intenção copiada; associações e componentId/signature reconstruídos sem perder a escolha ativa ou criar pendência. Supressão 392 torna-se 532. IDs de configurações comuns mantidos. Após recálculo completo, editar/restaurar a supressão na cópia não altera a origem; desfazer/refazer mantém identidade da cópia. Não fabricar ajustes pendentes para este exemplo; quando já existirem, a cópia conserva seu estado sem promovê-los ou descartá-los. |
| EX-61 | Pavimentos −21, 0, 280 e 350; ativo 0. Remover ativo, desfazer, remover não ativo e depois tentar remover o último remanescente | Ao remover 0, selecionar −21, sem deslocar os demais. Desfazer restaura mesmo pavimento, paredes e ajustes; ativo existente permanece conforme contrato de sessão. Remover não ativo não troca o ativo. Último não pode ser removido. Trocar de pavimento mantém câmera, cancela prévia sem commit e recupera fiada local lembrada; pavimento vazio mostra mensagem e nenhum índice fictício. |
| EX-62 | Criar pavimento vazio com a altura usual de tijolo de 7 cm, após editar a altura padrão de outro pavimento para 210; referência inicial 280 | Novo não herda 210: apresenta 280 cm, editável e diretamente modular (40 fiadas), sem etapa adicional de compatibilização. Altura padrão editada não redimensiona paredes existentes. Renomear, desfazer e refazer apenas o nome não mudam composição nem geram cálculo. Alturas-base personalizadas continuam sujeitas às validações modulares já previstas, sem mudança do padrão usual de 7 cm. Variante h=6 cm com altura inicial escolhida de 276 cm: novos pavimentos continuam propondo 276 após editar o padrão de um andar, reabrir ou remover o térreo; a referência pertence ao projeto. |
| EX-63 | Baixar/reabrir envelope 8 com quatro pavimentos, configurações e ajustes pendentes; adulterar snapshot atual; forjar ajuste com paredes de dois pavimentos; tentar arquivo versão 7 | Reabertura válida preserva intenção e composição nominal-v9; importação cria novo ID de projeto, preservando IDs internos. Snapshot adulterado, referência entre pavimentos, UUID duplicado e versão incompatível são recusados antes de substituir o aberto. Arquivo desatualizado íntegro usa resultado ausente e pode conter pendências geométricas. Se o resultado derivado exceder o limite do transporte compacto, o backup mantém toda a intenção nesse estado e recompõe na abertura; a memória atual não é modificada e o usuário recebe aviso. Documento local antigo permanece armazenado, identificado como incompatível, sem conversão ou cálculo. |
| EX-64 | Quatro pavimentos em 0/70/140/210, h=7, um trecho de `8m×3h` por andar; conferir limites de integridade da entrada e injetar falhas de cálculo/salvamento | Caso pequeno cobre 96 células ao todo e gera 12 fiadas locais no total, não 33 pelo alcance global. Não estimar ou controlar orçamento de geração, nem publicar diagnóstico de quantidade máxima de células/fiadas/peças/eixos. Excesso de limite estrutural de entrada na duplicação recusa a cópia inteira. Exceção real mantém estado desatualizado sem snapshot e libera controles; falha de armazenamento preserva memória/download. Não exige gerar volumes altos como condição deste exemplo. |

Nas verificações de referência, repetir cotas negativas e translações com bases de alturas diferentes, rotação/reflexão dos desenhos existentes e módulo representável de 12,51 cm para não arredondar centros de furos. Integrar vãos empilhados, L/T/cruz e supressões de alcance conforme CT-07–12, com o mesmo conjunto geométrico em mais de um pavimento. Esses casos verificam isolamento e preservação das regras existentes; não autorizam novo padrão construtivo. Limites de integridade de arquivo, registros de intenção e precisão seguem Arquitetura §19.5 e exigem casos de fronteira e recusa. Remover os antigos bloqueios por células/fiadas/eixos/intervalos gerados; não criar controles ou quantitativos antecipados para substituí-los. A análise de quantidades pelo usuário permanece futura em M5, com evidências de carga registradas exclusivamente no Plano §10.1.

### 11.2. M4.2 — Geometria de lajes

#### CT-13 — Anéis ortogonais e subtração de aberturas

**Estado:** geometria implementada em M4.2, sem comprovação estrutural; verificações e aceite separados no Plano §10.2. Não altera CT-01–12 nem nominal-v9. Produto em RF-13, persistência/comandos na Arquitetura §20 e verificações no Plano §10.2. D42-01 está confirmada: alças nas arestas e redesenho para acrescentar ou retirar cantos, sujeitos à validade abaixo. Não são necessárias novas hipóteses de fabricante para validar polígonos: não há neste marco cálculo de apoios, vãos resistentes, armaduras ou espessura estrutural recomendada.

Usar `m = largura-base`, vértices em `(i*m,j*m)` com `i/j` inteiros em relação à origem da malha do projeto, inclusive negativos. Cada anel é um polígono simples fechado, com área não nula, ao menos quatro vértices e arestas horizontais/verticais de comprimento positivo. Não repetir vértices, incluindo primeiro/último, nem manter vértice intermediário colinear redundante. Arestas consecutivas compartilham somente seu extremo comum; arestas não consecutivas não podem cruzar, sobrepor ou tocar, nem por ponto. Proibir retorno sobre a mesma aresta e contato que forme estrangulamento de largura zero. Concavidade e dimensões mínimas resultantes de um passo de malha são válidas geometricamente; isso não dimensiona largura construtiva.

No desenho, ponto repetido, trecho zero, retorno, continuação colinear redundante ou interseção já conhecida não fixa novo vértice; indicar causa, mantendo os pontos anteriores. Clicar no ponto inicial é tentativa explícita de fechamento, não inserção duplicada. Fechamento só é válido com última aresta ortogonal simples; não acrescentar um cotovelo de fechamento oculto. Para corrigir, retirar os últimos pontos ou cancelar. O rascunho pode permanecer aberto, mas nunca é uma laje persistida.

Cada abertura é um anel com as mesmas regras. Toda sua região fechada deve estar no interior estrito do anel externo, sem encontro entre as bordas. Entre duas aberturas, as regiões fechadas são disjuntas: proibir cruzamento, sobreposição, borda compartilhada, toque por canto, coincidência e abertura totalmente contida em outra. Não basta testar interseção das bordas: o caso de uma abertura dentro de outra também deve ser recusado. Para exterior côncavo, não basta testar os vértices das aberturas. A separação positiva resulta da malha e da ausência de contato; não estabelecer distância física adicional.

Material da laje é o interior externo menos os interiores das aberturas; bordas são referências selecionáveis. A subtração não apaga elementos desenhados em outras camadas. Área líquida usada somente como oráculo de geometria nos exemplos abaixo, sem quantitativo, painel de área ou volume em M4.2. Topo `Z`, inferior `Z−t`, espessura `t>0` representável, sem passo vertical obrigatório. Translações e edição de arestas submetem a laje completa às mesmas regras. Nenhuma relação com alvenaria ou volumes de outros pavimentos muda essa validade.

#### Exemplos independentes EX-65–74

Coordenadas em unidades de `m`; `R(a,b,c,d)` denota retângulo com vértices `(a,b),(c,b),(c,d),(a,d)`, com `a<c` e `b<d`. Anéis não repetem o primeiro ponto. Repetir casos geométricos com ordem invertida e vértice inicial diferente, rotação, reflexão, translação negativa e bases de módulos 12,5/15/14/12,51 cm. Oráculos abaixo não dependem de rasterização ou da ordem de criação.

| ID | Entrada | Resultado esperado |
|---|---|---|
| EX-65 | Exterior `R(0,0,16,12)`; aberturas `R(2,2,4,4)` e `R(8,6,12,9)` | Válido, exterior 192m², vazios 4m² e 12m², material 176m². Um ponto em `(3,3)` é vazio; `(6,3)` é material. Aberturas não cobrem paredes nessa posição. Sem aberturas, material 192m². |
| EX-66 | Exterior côncavo `(0,0),(12,0),(12,4),(6,4),(6,10),(0,10)`; abertura `R(1,5,4,8)` | Válido: exterior 84m², vazio 9m² e material 75m². `R(7,5,9,7)` está fora e é recusada; ponto sobre `(6,6)` está na borda, não no interior estrito. |
| EX-67 | Exterior `R(0,0,16,12)`; tentar `R(0,2,2,4)`, `R(-1,2,2,4)` e `R(15,2,17,4)` | Recusar respectivamente contato com borda e invasões esquerda/direita; `R(1,1,2,2)` é válida. No exterior de EX-66, abertura `(4,3),(6,3),(6,4),(5,4),(5,5),(4,5)` toca o canto côncavo `(6,4)` e é recusada. |
| EX-68 | Exterior `R(0,0,16,12)`, abertura A `R(2,2,5,5)`; candidatas B `R(5,2,7,4)`, `R(5,5,7,7)`, `R(4,4,7,7)`, `R(3,3,4,4)` ou igual a A | Todas recusadas: aresta compartilhada, toque por canto, interseção, contenção e coincidência. `R(6,2,8,4)` é válida. Inverter ordem A/B não muda a decisão. |
| EX-69 | Anéis com diagonal de fechamento, vértice repetido, aresta zero, ida/volta colinear ou ponto fora da malha; cruzamento ortogonal `(0,0),(6,0),(6,6),(2,6),(2,-2),(4,-2),(4,4),(0,4)` | Todos recusados, sem reparo automático. O último anel cruza y=0 em x=2 e x=4. Um retângulo `R(0,0,1,1)` é válido como geometria, sem recomendação construtiva. |
| EX-70 | Exterior em U `(0,0),(10,0),(10,10),(7,10),(7,3),(3,3),(3,10),(0,10)`; abertura `R(2,5,8,7)` | Os quatro vértices da abertura ficam dentro dos braços do U, mas suas arestas atravessam o recorte central. Recusar por saída do interior; validar somente vértices daria resultado incorreto. |
| EX-71 | EX-65 transladada por `(−3m,+2m)`; mover depois só a primeira abertura; D42-01: deslocar borda externa direita de x=16 para x=11 e tentar mover borda esquerda da primeira abertura de x=2 para x=4. Variante sem aberturas: saltar a borda direita de x=16 para x=−1 | Translação válida preserva todos os deltas/IDs e espessura. Na variante original, a borda externa em x=11 invade a segunda abertura; a primeira abertura com borda em x=4 colapsa. Recusar ambas integralmente. A variante sem aberturas também é recusada: o salto inverte as duas arestas vizinhas, embora o anel final volte a ser simples; o gesto conserva os sentidos, conforme Arquitetura §20.3. Mover só a abertura para `R(3,3,5,5)` é válido e preserva exterior/segunda abertura. |
| EX-72 | EX-65 em Z=280 cm, t=21 cm; editar t=14 e depois 14,01; mudar Z para 350 e para −21; duplicar para 0 | Topo 280 cm e inferiores 259/266/265,99 cm antes de mudar Z. Com t=14,01 e Z=350, inferior 335,99; em Z=−21, inferior −35,01. Cópia em 0 tem inferior −14,01 e topo 0 cm, com novos IDs e mesmos anéis/t; nenhum recorte de parede. Tentar t=0/negativo ou face inferior além do limite é recusado. |
| EX-73 | Retas/L/T/cruz com vãos, canaletas, grautes e escolhas válidas/pendentes em dois andares; inserir EX-65, mover, abrir vazio sobre paredes, alterar t e excluir laje em um deles | Paredes/ajustes e composição nominal-v9 conservam conteúdo/IDs e pendências de origem; mesma posição em andares distintos não cria relação. Pavimento com somente laje continua sem fiadas. Sobreposição indevida entre paredes no mesmo andar mantém seu diagnóstico existente. |
| EX-74 | Envelope 9 com quatro andares/lajes, dois vazios na primeira e ajustes pendentes; copiar/remover/desfazer/refazer/reabrir/importar; adulterar laje sem mudar snapshot | Round trip e histórico restauram intenção/IDs, importação muda só ID do projeto; cópia usa novos IDs e referências locais. Recusar abertura tocando borda, laje órfã/duplicada por andar, UUID repetido, espessura inválida e versão 8 antes de substituir o aberto; snapshot de paredes idêntico não legitima laje inválida. Backup sem resultado preserva toda intenção, inclusive lajes. |

EX-71 cobre as alças de D42-01, confirmada pelo solicitante; seus casos integram as verificações obrigatórias da implementação, junto aos de validade, translação e preservação integral. Não há novos ensaios físicos ou pesquisa de dimensionamento neste marco.

### 11.3. Alturas diferentes — CT-14

Convenção nominal-v10: alturas diferentes são permitidas, sempre múltiplas da altura-base. Na fiada n participam somente paredes com altura >= n*h. Reconstruir células e referências ativas antes de reconhecer encontros e percursos. Aplicar CT-05 a L/T e CT-12 a cruz presente naquela altura, verificando cobertura sem colisão nas duas fases. Cada trecho independente herda a fase absoluta ((n-1) mod 2) XOR alternativa do conjunto original; não reiniciar a alternância ao desaparecer ou separar paredes. Não prolongar paredes curtas, igualar alturas ou cortar peças para resolver o encontro. A restrição histórica de M2 a L simples não bloqueia nominal-v10.

Componentes conservam identidade pelas paredes do conjunto original; junctions reúne posições/tipos realmente encontrados nas diferentes faixas de altura, sem novo campo persistido. Uma alternativa global aplica-se a todas as fiadas, inclusive quando L surge após T/cruz. A ausência de solução nas duas fases gera diagnóstico na primeira fiada afetada e suspende esse conjunto inteiro, preservando componentes independentes. Diferença de altura isoladamente não é erro. Preservar avisos nominais de ligação complementar, sem dimensionamento estrutural.

Vãos só removem células nas respectivas alturas e hospedeiras; canaletas respeitam o topo da parede e o material composto. Grautes continuam eixos nominais aplicados aos intervalos de alvenaria existentes, sem vazio ou prolongamento acima de topo; surgimento de ponta livre numa faixa superior também pode propor esse eixo para a coluna de alvenaria, conforme CT-09. Não introduzir reforços ou apoios novos.

| Exemplo | Entrada | Resultado independente esperado |
|---|---|---|
| EX-75 | T: barra horizontal 5 células em y=0, x=0..4; ramo em x=2, y=1..2. Barra 3h, ramo 2h. | Fiadas 1/2: sete células com T nas fases A/B. Fiada 3: cinco células da reta, dois inteiros e um meio, fase A; alternativa global inverte fases. |
| EX-76 | Mesmo T; barra 2h, ramo 3h. | Fiadas 1/2: T. Na terceira restam as duas células do ramo, um inteiro em A. O centro da barra desaparece; nenhuma peça ou relação referencia a barra encerrada. |
| EX-77 | Anel 8m × 6m com altura 2h, divisória vertical de cinco células em x=3, y=1..5 com altura 4h. | Fiadas 1/2 cobrem união de 24 células do anel e quatro novas da divisória (28 ao todo), com T nos contatos. Fiadas 3/4: cinco células da divisória, dois inteiros e um meio em pontas alternadas; sem paredes do anel nas referências. |
| EX-78 | Arquivo de referência Meu projeto R3__2: quatro paredes externas 280 cm, duas internas 294 cm, h=7 cm, laje e vãos preservados. | Quarenta fiadas com as seis paredes; fiadas 41/42 somente as duas internas. Cobertura exata descontando vãos, sem erro por diferença de altura; canaletas/grautes limitados ao material existente. |
| EX-79 | Envelope 9 com resultado nominal-v9, incluindo EX-78; variante nominal-v10 adulterada e variante de envelope futuro. | Resultado v9 é descartado e recalculado preservando intenção; resultado v10 inconsistente e envelope desconhecido continuam recusados. Arquivo original intacto. |

### 11.4. M4.3 — Comparação visual (CT-15)

**Estado:** implementado e aceito pelo solicitante em M4.3; verificações no Plano §10.3 e aceite global na §10. Produto em RF-08, contratos de sessão/renderização na Arquitetura §22, tarefas e aceite no Plano §10.3. CT-15 define projeção e exemplos de comparação, sem alterar composição nominal-v10 ou acrescentar hipótese construtiva, regra de apoio, continuidade ou ensaio físico. Não há pesquisa estrutural nova a realizar para sobrepor desenhos existentes.

Uma planta de referência é uma projeção horizontal da intenção confirmada de um único vizinho na ordem das cotas. Para qualquer ponto mundial `(x,y)`, sua posição em tela é a mesma em ambos os andares sob a mesma câmera; cotas negativas, distância vertical entre andares, espessura da laje e alturas de parede não alteram x/y. Projetar os anéis de CT-13 sem alterar, corrigir ou unir polígonos. Um vazio da laje de referência não subtrai paredes ou material do ativo; um vazio ativo não corta a referência. Não há união, diferença booleana ou teste de contato entre geometrias de andares distintos. Sobreposição não comprova apoio ou alinhamento construtivo.

Nos exemplos, `m = largura-base`, `h = altura-base`, e `R(a,b,c,d)` usa coordenadas em módulos como em EX-65. Repetir projeção com módulos 12,5/15/14/12,51 cm, coordenadas negativas, diferentes zooms e bases de altura 6/7 cm. Esses valores exercitam precisão e independência de referências, sem dimensionamento.

| ID | Entrada | Resultado independente esperado |
|---|---|---|
| EX-80 | Andares A/B/C criados fora de ordem, cotas −3h/0/40h; B ativo, A vazio, C com paredes/laje. | Inferior resolve A, superior C, um por vez. Inferior permanece A sem elementos, sem salto para C. Ativar A recupera sua escolha da sessão (nenhuma na primeira visita) e só oferece superior B; voltar a B recupera a direção anteriormente escolhida; projeto com único andar não oferece comparação. Nomes repetidos não mudam a resolução. |
| EX-81 | A/B/C/D em −3h/0/40h/50h; B ativo e superior escolhido. Mudar C para 60h, remover D, depois remover C, sem trocar B. Desfazer e renomear. | Referência passa C→D→C→nenhuma. Desfazer a última remoção restaura C, mas mantém nenhuma; escolher superior de novo resolve C e acompanha seu novo nome. Se B mudar de posição na ordem sem trocar ID, resolver seu novo vizinho na direção escolhida. Se o ativo efetivamente mudar, recuperar a direção válida lembrada para o destino. Normalizar também direções de inativos; perder o último vizinho limpa a escolha mesmo sem visitar o proprietário, sem restaurá-la ao desfazer. |
| EX-82 | Referência com laje de EX-65 e uma parede/janela; ativo com laje própria e parede cruzando `(3m,3m)`, interior da primeira abertura da referência. | As duas bordas de abertura da referência são visíveis como contornos, sem tampa opaca; a parede ativa segue inteira no vazio da referência. Laje ativa não recebe recorte pelo outro andar. Coincidência exata prioriza traço ativo; não deslocar linhas. Não desenhar seleção ou grautes da referência. |
| EX-83 | Paredes de dois andares ocupam a mesma faixa mundial; adicionar vão ativo coincidente com borda de laje de referência. Repetir em coordenadas negativas e módulo 12,51 cm. | Correspondência de pixels sob a mesma câmera, sem arredondar coordenadas mundiais nem deslocar pela cota. Clique resolve somente vão/parede/laje ativos conforme M4.2; alça e arraste do alvo ativo escolhido pela lista permanecem operantes. Região só de referência não produz alvo/hover/encaixe/união e não permite exclusão ou edição. |
| EX-84 | Ativo com faixa de parede R(0,0,4,1), referência com laje R(−8,−4,−2,2); depois ativo vazio e, por fim, ambos vazios. | Limites da união: x de −8m a 4m, y de −4m a 2m, largura 12m e altura 6m. Enquadrar aplica margem/limites de zoom existentes a essa caixa, não às legendas. Com ativo vazio, usar só a caixa da referência; com ambos vazios, fallback atual. Escolher a referência não muda a câmera. |
| EX-85 | Documento envelope 9 com resultado atual ou intenção desatualizada; comparar, navegar, baixar/reabrir/importar, entrar em Fiada e consultar em aba readonly. Variante com alturas diferentes de EX-78 e v9 aceito conforme §11.3. | Somente comparar/navegar preserva integralmente intenção, resultados, diagnósticos, metadados e histórico, sem salvar/calcular. Abertura válida inicia sem comparação; atualização de cálculo segue CT-14 independentemente dela. Fiada nunca inclui outro pavimento e conserva referência local. Readonly não grava. Pendência de composição não impede mostrar intenção confirmada nem gera diagnóstico entre andares. |

Oráculos de geometria são a identidade das coordenadas e as caixas explícitas acima, não pixels estimados de capturas ou comparação do algoritmo contra si mesmo. Verificações de interface e persistência devem observar também os efeitos ausentes: nenhum alvo da referência, mutação, cálculo, gravação ou vínculo entre pavimentos ao usar somente a comparação.

## 12. M5 — Contagem nominal (CT-16)

**Estado:** convenção de contagem implementada em M5, aceito pelo solicitante; registro e verificações do Codex no Plano §12. RF-11/12 define o produto; Arquitetura §23 define projeção, perdas transitórias e cópia; Plano §12 reúne tarefas/aceite/roteiro. CT-16 não muda nominal-v10 nem a geometria de CT-01–15.

Contar unidades das peças finais, após subtração de vãos e tipagem/recomposição de canaletas, uma vez por pavimento/fiada. Inteiro e canaleta inteira ocupam duas células; meio e meia canaleta, uma, mas cada um conta como uma peça. Paredes de um encontro e origens coincidentes são associações de uma peça, não multiplicadores. Somar peças de todos os andares mesmo que suas coordenadas horizontais coincidam; referências visuais não são material adicional. A soma dos quatro tipos deve fechar tanto entre fiadas e pavimentos quanto entre pavimentos e projeto.

O meio é peça nominal do catálogo, conforme CT-01/08 e L4. CT-09 representa canaletas nominais e não peças preparadas na obra. Não há procedimento ou informação de origem suficiente para converter cada meio/canaleta em consumo de inteiros, determinar aproveitamento de sobras, largura de corte ou taxa de preparação. M5 conta os quatro tipos separadamente e informa essa lacuna; consumo não determinado não equivale a zero. Peças especiais não geradas não recebem linhas fictícias. Lajes, eixos de graute e seus intervalos não entram em contagem de tijolos. Não calcular concreto, aço, área líquida de laje, cavidade ou volume de graute. Estas regras são convenções de contagem da composição existente, sem pesquisa construtiva nova ou comprovação física.

Margem de perdas é estimativa aritmética indicada pelo usuário. Arredondar para cima por tipo sobre o total geométrico do projeto, uma vez, sem converter meios em inteiros. Não aplicar à quantidade de fiadas, a eixos ou a percentuais de ocupação. Geometria e perdas têm totais separados; estimativa de um projeto parcial também é parcial. Os exemplos de percentual não recomendam taxas para a obra.

Nos exemplos a ordem dos vetores é **(inteiro, meio, canaleta, meia canaleta)**. Salvo indicação contrária, desligar canaletas/grautes automáticos para obter o oráculo geométrico isolado; a consulta em si não altera configurações. Variar bases 25×12,5×7, 30×15×7 e personalizada, incluindo módulo 12,51 cm e altura 6 cm, conservando o número de módulos/fiadas.

| ID | Entrada | Resultado independente esperado |
|---|---|---|
| EX-86 | Parede isolada de EX-01, oito células e três fiadas A/B/A; base 25×12,5×7, comprimento 100 cm, altura 21 cm. | Vetores por fiada (4,0,0,0), (3,2,0,0), (4,0,0,0). Pavimento/projeto (11,2,0,0), total 13 peças, cobrindo 24 células. Girar, refletir ou deslocar a parede não muda os totais. |
| EX-87 | Contorno/T/cruz de EX-53, três fiadas A/B/A, sem vãos ou canaletas. | Por fiada (34,2,0,0), (33,4,0,0), (34,2,0,0). Total (101,8,0,0), 109 peças e 210 células. Associações de várias paredes no canto/T/cruz não multiplicam a peça; não somar as contagens de cada parede isoladamente. |
| EX-88 | Fixture de agregação com duas fiadas finais: (1,2,3,1) e (2,0,1,2); uma canaleta tem duas origens e duas paredes associadas. Integração adicional: canaleta compartilhada entre vãos de EX-26. | Vetor total (3,2,4,3), 12 peças. A canaleta associada conta uma vez. Em EX-26, a faixa compartilhada de cinco canaletas inteiras continua com cinco peças, não dez; contar demais peças da fiada pela lista final, sem somar novamente a faixa. |
| EX-89 | Dois pavimentos contendo EX-86 nas mesmas coordenadas, cotas −3h e 40h, nomes repetidos; terceiro vazio; quarto com somente laje/abertura de EX-65. | Cada um dos dois primeiros tem (11,2,0,0); os demais têm zeros e nenhuma fiada. Projeto (22,4,0,0), total 26. Filtrar um andar não altera o total global nem o pavimento ativo do editor. Remover/desfazer um andar muda/restaura o total sem alterar o outro. |
| EX-90 | EX-86 em componente independente de outro componente sem solução; resultado atualizado com erro. Variantes com somente diagnóstico info e com resultado ausente/desatualizado. | Contar as 13 peças existentes e identificar o projeto/pavimento afetado como parcial; não preencher componente suspenso por estimativa. Somente info mantém contagem sem selo de parcialidade. Resultado ausente/desatualizado fica indisponível, nunca zero completo nem último total conhecido. |
| EX-91 | Fixture da lista final após CT-09 dividir uma peça de duas células em um meio e uma meia canaleta; adicionar laje, graute e referência de outro andar. | Contar (0,1,0,1), duas peças. Não acrescentar o inteiro anterior, faixa de canaleta, eixos de graute, laje ou projeção visual. Não afirmar consumo de um inteiro preparado ou rendimento de corte. |
| EX-92 | EX-86 com perdas 0%, 10% e entrada inválida; fixture de 10 peças a 10%, 10.000 peças a 0,01%; dois andares com um meio cada a 10%. | A 0%: geométrico/estimado 13, acréscimo 0. A 10%: inteiro 11→13 (+2), meio 2→3 (+1), demais zero; total estimado 16 (+3). Dez peças a 10% dão 11, não 12; 10.000 a 0,01% dão 10.001. Dois meios no projeto dão três estimados (+1), sem arredondar um por andar. Vazio a qualquer percentual válido dá zero. Negativo, mais de duas casas, vazio não confirmado, NaN/Infinity, exponencial ou número não representável não aplicam margem silenciosa nem escondem contagens geométricas. |
| EX-93 | Duplicar documento com quatro pavimentos, lajes, aberturas, vãos, escolhas incompatíveis pendentes, supressões e ajustes de graute. Variante em cálculo nominal-v9/desatualizado e origem aberta em outra aba. | Só ID/nome/metadados de projeto mudam; referências internas e intenção são idênticas por valor, inclusive bindings pendentes. A cópia não compartilha mutações, histórico ou trava com a origem. Resultado v10 válido preservado; v9 descartado e refeito ao abrir, sem mudar intenção. A cópia usa o último registro salvo, sem ler alterações não gravadas da outra aba. Cancelamento/falha de gravação não criam cópia nem mudam a origem. Se o novo nome/metadados fizerem a intenção exceder 50 MiB, recusar antes de gravar, mantendo íntegro o registro de origem. |
| EX-94 | EX-89 com vãos/alturas de EX-78, escolhas e supressões válidas/pendentes; editar/desfazer/refazer e baixar/reabrir, inclusive backup sem snapshot e nominal-v9. Consultar também em somente leitura e após falha de salvamento. | A consulta reflete exclusivamente as peças atuais após cada recálculo; somas fecham em toda versão atual, resultados parciais mantêm seu estado. Backup recompõe antes de disponibilizar valores; atualização de v9 preserva desenho. Apenas consultar/filtrar/perdas não altera documento, metadados, histórico, resultado, diagnósticos ou armazenamento. Reabrir reinicia perdas em 0%; o arquivo não contém totais, filtros ou percentual. |

EX-88/91 isolam agregação sobre peças finais, com contagens dadas previamente; não substituem testes de integração com o motor de EX-26/53/78. As verificações devem usar expectativas literais acima e inspecionar peças/estados, sem produzir o valor esperado chamando a própria função de agregação.