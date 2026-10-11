# Ecovit — Caderno técnico

**Revisão:** 3 — propostas técnicas P1–P5 aprovadas após pesquisa  
**Estado:** recorte nominal implementado em M2 em 11/10/2026; verificações no relatório do plano; teste do solicitante pendente.  
**Alcance atual:** composição geométrica de paredes sem vãos, em um pavimento, para M2/E2 do [plano](Ecovit-Plano-Implementacao.md). Este caderno será ampliado por assunto conforme as próximas entregas. O [PRD](Ecovit-PRD.md) continua sendo a referência de produto.

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
- Em projeto de E1 já salvo com altura incompatível, conservar o valor e apontar a pendência; não cortar tijolo na última fiada nem mudar a geometria durante migração.
- Paredes com alturas diferentes só participam das fiadas que alcançam. Enquanto ambas existirem, gerar o encontro. Acima do término da parede curta, continuar a restante como trecho reto, mantendo a fase correspondente ao número absoluto da fiada do pavimento, sem reiniciar A. A transição simples de L é obrigatória em M2 (P5; EX-15/16). Outras combinações não cobertas recebem diagnóstico, sem prolongar parede ou cortar peças automaticamente.

Uma futura regra com junta real exigirá revisar esta convenção e migrar explicitamente o resultado. Por exemplo, uma junta entre peças não implica automaticamente altura total `N(h+j)`: sem junta superior, seria `Nh+(N−1)j`. Não introduzir esse segundo modo de cálculo em M2.

### CT-03 — Área ocupada e referência externa

Obter a faixa de cada parede a partir de sua face externa e lado da espessura, preservando o contrato de E1. Calcular a **união das faixas** por fiada: a célula compartilhada de um canto pertence à composição uma única vez. Não deslocar faces externas para facilitar a paginação.

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

**T básico (P2):** identificar pela geometria a faixa que continua em dois sentidos, mantendo-a contínua em todas as fiadas. A célula central pertence apenas a essa faixa; o ramal é paginado a partir da face de contato, sem sobreposição. Aplicar CT-04 em cada trecho, com a mesma fase do pavimento: principal a partir da menor coordenada e ramal desde o contato para a ponta livre. O T exige ramos nos três sentidos; um trecho de uma célula mantém a limitação de CT-04, sem promessa de amarração alternativa. Não exigir classificação de parede interna/externa nem oferecer outra topologia no M2. O exemplo EX-13 fixa as posições e contagens.

F3 descreve continuidade da parede externa e ligação da interna por grampos; F6 reforça a distinção entre composição e ligação. Aplicar a continuidade ao ramo principal de qualquer T é uma convenção geométrica do Ecovit. Exibir “Composição geométrica resolvida; ligação complementar necessária”. Essa informação não impede a classificação de geometria nominal resolvida quando CT-06 passar, mas deve permanecer visível e persistida. Não desenhar/dimensionar grampos ou graute no M2, nem apresentar encosto como amarração direta.

**Cruz (P3):** composição automática excluída do primeiro M2 por aprovação explícita após a pesquisa. Reconhecer e emitir “Sem solução automática para este encontro”. Não extrapolar a solução T para dois ramais encostados nem inventar ciclo de fiadas. Retomar o tema em revisão futura de escopo, sem incluí-lo automaticamente em E3. EX-11 verifica reconhecimento e diagnóstico, não composição.

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
- **EX-18 — Encontros incompatíveis por fase:** U de células `(x,0)` para `x=0…2`, mais `(0,1),(0,2),(2,1),(2,2)`. Se ambos os cantos exigirem inteiro horizontal na mesma fiada, o esquerdo ocupa `(0,0)–(1,0)` e o direito `(1,0)–(2,0)`: disputa em `(1,0)`. Essa combinação não pode ser oferecida. O exemplo rejeita a combinação, não prova que todo U seja impossível; sem outro padrão completo documentado, o componente fica sem composição. Aumentar a distância dos cantos não dispensa conferir todas as fases.

## 5. Lacunas e consequência prática

| ID | Lacuna | Tratamento em M2 | Condição para fechar |
|---|---|---|---|
| L1 | Altura instalada, folgas e encaixes variam; não há passo físico universal verificado | Passo nominal explícito de CT-02, sem alegação de fidelidade executiva | Desenho cotado de produto e detalhe de assentamento compatíveis; revisar regra se necessário |
| L2 | Diâmetros, rebaixos e passagem real de furos não definidos para bases genéricas | Eixos simbólicos; verificar apenas alinhamento nominal | Geometria cotada verificável; necessária antes de inferir passagem/compatibilidade física em E3 |
| L3 | Ligação física do T, cruz e combinações fora do catálogo nominal | T conforme CT-05 com aviso; cruz excluída; diagnóstico de combinações sem padrão | Nova pesquisa para ampliar suporte; ligação física não é dimensionada no M2 |
| L4 | Meio nominal não equivale automaticamente a meio cortado | Catálogo nominal, sem instrução de corte ou consumo de peça-base | Procedimento com dimensões finais e perda de corte antes dos quantitativos correspondentes |
| L5 | Transições de altura além do L simples | L → reta definido por EX-15/16; demais combinações não cobertas recebem diagnóstico | Exemplos completos antes de ampliar o suporte |

L1/L2/L4 são limitações físicas conhecidas, com tratamento nominal aprovado para M2. L3/L5 registram os limites restantes, sem bloquear os casos nominais definidos. Nenhuma delas exige cadastro de regras ou aprovação técnica na interface, nem autoriza marcar todo RF-01/04/05 como atendido.

### Resolução das definições P1–P5

| ID | Definição aprovada | Referência verificável | Limite |
|---|---|---|---|
| P1 | L alternado, mínimo geométrico de `2m` por ramo | CT-05; EX-03/14 | Verificar fechamento conjunto; não é mínimo normativo |
| P2 | Principal contínua e ramal encostado; aviso de ligação complementar | F3/F6; CT-05; EX-10/13 | Geometria derivada para o Ecovit, sem dimensionar ligação |
| P3 | Reconhecer cruz; excluir composição automática do primeiro M2 | Decisão do solicitante após pesquisa; EX-11 | Nova inclusão exige revisão de escopo, não ocorre automaticamente em E3 |
| P4 | Compatibilidade por ocupação e alternância em todas as fases | CT-05; EX-17/18 | Sem distância mínima universal ou busca genérica de solução |
| P5 | L → reta com continuidade de fase | CT-02; EX-15/16 | Convenção nominal; outras transições ainda fora do suporte |

As decisões P1–P5 estão definidas para o recorte nominal aprovado e foram implementadas em M2. Resultados de verificação estão no relatório do plano; o aceite manual do solicitante permanece pendente. Os exemplos e regras próprias do Ecovit não são reproduções de detalhes executivos das fontes.

**Definições posteriores, sem bloquear o modelo nominal de M2:** dimensões físicas de furos/encaixes antes de inferir passagem para graute ou instalações (L2); procedimento e perdas de corte antes de contabilizar peças preparadas (L4). Passo físico de fabricante (L1) só será necessário se o produto passar a prometer fidelidade a esse sistema, mediante revisão explícita da convenção atual.

## 6. Contrato de implementação

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

O [plano de E2](Ecovit-Plano-Implementacao.md), seção 5, define aceite, testes e ordem de trabalho. M2 foi autorizado e implementado; avanço para E3 exige solicitação própria.

## 7. Decisões concretizadas em M2 — 11/10/2026

- Motor em `src/domain/composition.ts`, sem dependências de interface. Padrões e recusas são cobertos por `tests/composition.test.ts`.
- Limites defensivos: soma de comprimentos de paredes até 20 mil módulos, até mil fiadas e produto dessa soma pelo total de fiadas até 100 mil células. É uma estimativa conservadora anterior à alocação, contando sobreposições na soma. Não é promessa de 100 mil peças: cenário verificado de 42 mil peças no relatório. Exceder preserva o modelo e gera diagnóstico, sem truncamento.
- Peças são verificadas por cobertura exata de células e exclusividade; eixos são derivados dos centros das células, inclusive quando ficam em meia unidade interna. Reta, L e anel usam padrões explícitos; T separa o ramal da principal no cálculo. Combinações restantes precisam passar pelos padrões; não há busca genérica.
- Somente a transição simples L → reta é suportada para encontros de alturas distintas. Transições T e conjuntos com vários encontros em alturas diferentes recebem diagnóstico.
- Composição versão 2 é persistida; a abertura/importação recomputa um resultado de conferência para validar a composição salva. Se consistente, preserva o snapshot sem substituição/gravação; se divergente, rejeita. Essa conferência é distinta da regeneração após edição. Navegação não calcula.
- Falhas do motor mantêm modelo salvo e resultado desatualizado; falhas de gravação mantêm memória e download. Histórico guarda modelo/ajustes sem peças geradas.
