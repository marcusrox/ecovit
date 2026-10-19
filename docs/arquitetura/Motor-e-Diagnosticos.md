# Motor e diagnósticos

[Índice da arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [PRD](../Ecovit-PRD.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md) · [Marcos](../Ecovit-Plano-Implementacao.md)

Este documento descreve contratos de software vigentes. Regras geométricas/construtivas, justificativas, fontes e exemplos independentes pertencem ao Caderno Técnico; escopo e comportamento ao PRD; verificações executadas e aceites aos registros dos marcos.

## Composição vigente

Pipeline vigente:

1. Validar a dimensão-base e derivar o catálogo.
2. Construir a rede de paredes e seus encontros.
3. Aplicar escolhas de encontros da primeira fiada.
4. Distribuir peças ao longo de todas as fiadas.
5. Aplicar vãos e alturas das paredes; em M4, converter cotas locais pela cota única do pavimento, sem recorte por lajes.
6. Gerar a proposta de grauteamentos e elementos em canaletas.
7. Reconciliar ajustes manuais e verificar continuidade/colisões.
8. Produzir o resultado e os diagnósticos; quantitativos são uma projeção de leitura separada.

A ordem interna poderá ser ajustada às dependências do algoritmo; elementos estruturais que mudam peças exigirão nova composição da região afetada. Não tratar canaletas como apenas uma cor aplicada depois da geração.

Recalcular o projeto inteiro após cada alteração geométrica ou construtiva confirmada. Em M4.1, o mesmo fluxo inclui todos os pavimentos, com composição e validações locais independentes, sem detecção de interferências ou desalinhamentos entre andares e sem rastreamento de regiões pendentes. Alterações apenas de nome, seleção ou câmera não exigem geração.

Executar uma chamada síncrona do motor no fluxo principal, depois de exibir o estado de espera. Novas operações ficam indisponíveis até terminar; não enfileirar cliques para executá-los depois. Usar tratamento de erro que sempre libere os controles. Não haverá cancelamento ou progresso percentual durante essa chamada; uma espera de processamento é aceita nesta versão.

Não implementar Worker, fila de tarefas, resultados parciais ou atualização incremental inicialmente. Se o uso no aplicativo mostrar espera inaceitável, medir o gargalo antes de mudar essa decisão. A separação do motor em funções de dados permite uma evolução posterior sem antecipar sua infraestrutura.

Derivar somente o catálogo padrão e os procedimentos de preparação documentados, com seus limites de aplicação. Dimensões 2:1 não garantem solução universal nem correspondência com peças comerciais. Regiões não suportadas recebem “Sem solução automática”; peças especiais não são um recurso genérico para fechar qualquer lacuna. Ajustes de encontros, graute e canaletas incompatíveis ficam registrados como pendentes e não são aplicados até correção; não manter bloqueios de peças individuais.

A pesquisa construtiva e o Caderno técnico previstos no PRD continuam necessários antes dos algoritmos correspondentes. Esta arquitetura não inventa parâmetros de graute, apoios ou armaduras.

## Pipeline de células e encontros

Construir ocupação ativa por fiada antes de classificar encontros. Para cada fase, aplicar separação de contatos de T por CT-05 e de cruz por CT-12, sem eliminar células físicas. Separação muda conexões do percurso, não paredes/modelo. Verificar que reservas de continuidade/contato de encontros próximos não se contradizem; não resolver por ordem dos IDs. Paginar percursos/ciclos com os contratos existentes e conferir cobertura única das células e legalidade de cada inteiro/meio. Só depois subtrair vãos, tipar canaletas e gerar intervalos de graute.

A composição trata ramificações de quatro vizinhos pela separação de contatos de CT-12 antes da paginação. Identificação, fases, cobertura, alternativas, transições de altura, canaletas, grautes e validação de snapshots obedecem à convenção informada.

Componentes são os conjuntos conectados da geometria, incluindo contornos e divisórias. Cruz suportada deve compor todo o conjunto, não apenas recortar/desenhar um símbolo local. Preservar política de componente sem peças somente quando houver incompatibilidade real não resolvida, erro de geometria ou escolha pendente; componentes independentes permanecem calculados. Identificar encontros por ocupação por fiada, para suportar EX-54 sem recomeçar fase. Não persistir uma duplicação da topologia derivada nem transformar regiões separadas de paginação em paredes artificiais.

Alternativa usa a phase global e os contratos UUID/anchor/binding de M3.4; deve ser oferecida também ao conjunto com cruz sem depender da presença de um L, depois de validar suas fases. Prévia mostra todo o conjunto; cancelar não modifica documento. Fases/ajustes ativos ainda aplicáveis são preservados; pendências não se tornam ativas apenas por atualizar o cálculo.

Manter união de células de canaleta, origens/supressões/alcances e associação de grautes com intervalo de alvenaria. O encontro em cruz produz um eixo nominal central quando a categoria estiver habilitada. Remover/restaurar canaleta ou graute não altera a classificação arquitetônica do encontro. Movimento/união/encurtamento e histórico continuam usando CT-11, sem deslocar ajustes para buscar um padrão.

## Alturas diferentes

RF-04/12 e CT-14/EX-75–79 estendem o motor existente sem novos campos de intenção, controles ou marcos M4.3/M5. Resultado vigente: nominal-v10. Remover a recusa geral de T/vários encontros por alturas distintas; por fiada, reconstruir células e suas paredes ativas, reconhecer L/T/cruz e aplicar os padrões correspondentes nas duas fases. A fase absoluta do pavimento e a escolha global do componente original não reiniciam após términos ou separações. Component.junctions reúne os tipos/posições presentes nas faixas distintas; permanece sem intervalo persistido próprio. As peças conservam somente referências a paredes ativas. Canaletas e grautes continuam derivados da alvenaria composta; pontas livres são avaliadas na ocupação da fiada, com acúmulo de candidatos por eixo sem guardar um segundo volume de células de todas as fiadas.

Não publicar composição parcial de um conjunto com conflito real; informar a primeira fiada que falhou, preservar intenção e demais componentes. Alturas ainda respeitam a precisão/modulação do arquivo. Sem dimensionamento, cortes, apoios ou transições arbitrárias por busca genérica.

## Isolamento por pavimento e resultado

Para pavimento de cota `Z`, altura-base `h` e fiada local `n >= 1`, intervalo relativo `[(n−1)h, nh)` e global `[Z+(n−1)h, Z+nh)`. Parede ocupa `[Z,Z+H)`. Vão ocupa `[Z+base,Z+base+height)`. Nível comum de canaleta com topo `c` solicita a fiada `c/h` em cada pavimento, com topo global `Z+c`. Espessuras/juntas extras não são acrescentadas. Fase A/B depende do número local da fiada e da escolha do componente, nunca de `Z/h`.

Executar nominal-v10 por pavimento, com paginação e regras nominais de M3.5 preservadas. Selecionar apenas paredes, vãos e ajustes daquele pavimento antes de montar células, componentes, encontros, faixas e eixos. Não criar um mapa geométrico comum a todos os andares para depois tentar separá-los. Contexto de pavimento pode ser parâmetro de funções de domínio; não criar serviço, Worker, fila, biblioteca ou adaptação de arquivos antigos.

Resultado persistido: `generated: null | { convention: "nominal-v10", floors: FloorComposition[], diagnostics: Diagnostic[] }`. Cada `FloorComposition` contém `floorId`, `courses`, `components`, `channels`, `grouts` e `diagnostics`. Haverá um resultado por pavimento, na mesma ordem das cotas. `courses` usa número e `bottom/top` locais, a partir de zero; faixas de canaletas mantêm `top` global e `course` local; intervalos de graute mantêm `bottom/top` globais. Conversão para exibição não altera essas referências persistidas.

Identidade de componente, peça, faixa e eixo inclui `floorId` além da identidade geométrica/associações já usada. Resultado de outro pavimento não pode colidir por ter os mesmos `x/y`, número de fiada ou desenho. Escolhas, supressões e eixos coincidentes continuam com suas regras locais, inclusive precedência de exclusões, sem afetar outro andar. Não reiniciar fase dentro de um pavimento quando uma parede termina.

Diagnóstico local tem `floorId` obrigatório e fiadas locais, além dos IDs e localização existentes. Lista geral de diagnósticos é a concatenação determinística dos diagnósticos locais na ordem das cotas; não persistir contagens de validade independentes dessa lista. Não há diagnóstico de orçamento global de geração. Falhas de execução são informadas pelo estado da operação, sem inventar fiada ou alvo local. Qualquer erro local impede validade global, mas não elimina resultados de pavimentos ou componentes independentes. Pavimento vazio produz arrays vazios, sem fiada 1 artificial. Não verificar colisão, apoio ou alinhamento entre pavimentos.

## Canaletas e grautes

project.channelLevels armazena { id, top } com topo relativo à cota do pavimento; project.groutSettings contém junctions/openings/ends/intervals e distance inteiro. Novos projetos usam os padrões do PRD. Não acrescentar níveis ou habilitar categorias ao normalizar arquivos legados; preservar a intenção lida. Demandas locais, distâncias e preparação nominal seguem CT-09/10 do Caderno.

`adjustments.grout: { id, x, y, wallIds, action }[]`, com UUID estável, origem mundial inteira da célula nominal, paredes associadas e `include`/`exclude`. O centro exibido/atingido é derivado por x/y + m/2; não arredondar a identidade nem persistir coordenadas fracionárias quando m é ímpar em unidades de 0,1 mm. Identidade geométrica é a coordenada da célula, nunca índice de fiada ou ID de peça. Ajustes não ancoram a redistribuição automática. Exclusão prevalece sobre todas as origens do mesmo eixo; adicionar novamente conserva ID e passa a inclusão explícita. Descartar ajuste remove a intenção para permitir automação. Excluir parede retira sua associação; ajuste sem paredes remanescentes é eliminado na mesma operação de histórico. Eixo que perdeu alvenaria ou associação geométrica mantém ajuste pendente na coordenada original, sem mover para vizinho.

`generated.grouts: { id, x, y, wallIds, origins, intervals: { bottom, top }[] }[]`: identidade derivada da origem da célula, paredes/origens ordenadas, intervalos absolutos, ordenados e unidos quando contíguos. Alvenaria realmente composta define marcadores e intervalos, descontando aberturas e componentes sem solução. Origem automática identifica encontro, vão, ponta ou intervalo; manual identifica UUID do ajuste. Renderização e interação derivam os centros, incluindo células de canaletas. Uma célula compartilhada produz um eixo, sem duplicação por parede.

Processamento vigente: paginação M2 → validação/subtração M3.1 → demandas CT-09 → união por célula → supressão por parede/cota → tipagem de peças → marcadores/intervalos da alvenaria → candidatos CT-10 → ajustes de graute. Par misto divide em meios sem ampliar o alcance. Origem do nível usa UUID; origens locais usam UUID do vão e posição superior/inferior. Célula compartilhada suprimida prevalece sobre demandas de qualquer parede/origem. Mudanças indiretas fora da malha preservam níveis/ajustes com diagnóstico e sem aplicação; supressão sem demanda mas em cota válida fica dormente, sem erro. Supressão de canaleta não altera grautes. Exclusão de parede elimina ajustes dependentes na mesma operação desfazível.

generated.channels contém faixas { id, wallId, top, course, cells }, com identidade derivada de parede/cota, células mundiais e origens semânticas ordenadas. Peças finais usam tipos channel/half-channel quando aplicável e conservam suas origens; esses campos são derivados, não comandos persistentes. Ajustes de supressão têm scope opcional: ausência equivale ao alcance wall legado; quando informado, admite wall ou range.

## Escopos de supressão

Ajustes de canaleta mantêm id/floorId/wallId/top e escopo discriminado: `scope: { kind: "wall" }` ou `scope: { kind: "range", from, to }`. from/to são coordenadas longitudinais mundiais inteiras na face de referência, intervalo semiaberto alinhado à malha, com from < to. A orientação vem da parede; não adicionar edição de célula individual.

Supressão wall mantém o comportamento vigente: extensão/redimensionamento da mesma parede acompanha todo seu alcance. Na união, converter cada supressão wall das participantes em range correspondente à extensão da parede antes do gesto; range existente conserva seu alcance. Preservar IDs, cotas e todas as intenções, inclusive ajustes dormentes. A união não suprime o trecho novo. Ao mover parede, wall acompanha pela associação; range desloca from/to pelo componente longitudinal do delta. Interseção com alvenaria determina aplicação; alcance fora da parede fica preservado para diagnóstico, sem truncar a intenção persistida. Range não amplia ao estender a parede consolidada.

Novas remoções de faixa pela Fiada criam supressão wall. Supressões sobrepostas se aplicam pela união de células, sem duplicar peças; restaurar um ajuste não apaga os demais. Exibir parede/cota e, quando range, seus limites, permitindo restaurar o ajuste identificado. Compartilhamento de células mantém a precedência de CT-09, limitado ao alcance de cada supressão. Limite existente de supressões permanece e conta registros, sem unir IDs arbitrariamente para contorná-lo.

## Escolhas de encontros

`adjustments.junctions` acrescenta UUID `id`, `anchor: { x, y }` em coordenadas mundiais e `binding: "active" | "pending"` aos campos atuais componentId/signature/wallIds/phase. A âncora localiza a intenção mesmo quando seu componente desaparecer; não é vínculo com nó ou peça. Todos os wallIds são remapeados para entidades existentes, sem duplicatas; escolha sem associações após exclusão real é removida. Ao excluir apenas parte das paredes de uma escolha, conservar as associações remanescentes como pending, com ID/âncora, em vez de apagar o registro inteiro. Descartar/retornar ao automático por ID afeta só a intenção escolhida; a ação global existente pode continuar como opção explicitamente global.

Nas operações novas, escolha pode continuar active ou ser revinculada somente se houver uma única correspondência do componente inteiro e a geometria de ocupação, alturas e percurso canônico de paginação permanecerem iguais, descontada apenas a substituição dos IDs/segmentação. Não basta copiar phase ou atualizar signature. Extensão, movimento que desconecta e união de componentes diferentes tornam a escolha afetada pending; componentes sem alteração preservam suas escolhas. Se várias escolhas disputarem a mesma correspondência, preservar todas como pending e pedir nova escolha, sem decidir pela ordem. Uma escolha pending não injeta phase no motor; em componente atual ainda associado, manter o tratamento de pendência de composição do M2 até resolver, sem bloquear componentes independentes. Sem componente associado, diagnóstico usa anchor e IDs remanescentes.

## Aplicação de ajustes coincidentes

- **Supressões repetidas:** identidade é UUID, não par wallId/top. Aceitar vários ranges e um wall na mesma parede/cota; validar alcance inteiro/modular, IDs globalmente únicos e referência existente. Adicionar remoção completa só é no-op se já existir scope wall para a parede/cota; range existente não impede criar wall. Restaurar é por ID e exclui só esse registro. Não usar `restoreBand(wallId,top)` para trechos herdados. A conversão wall→range é exclusiva da consolidação de duas ou mais paredes existentes; extensão simples de uma parede mantém wall. Range parcialmente fora da parede aplica apenas interseção válida e diagnostica o restante; sem qualquer interseção, fica pendente, sem transferência de alvo. Range válido sem demanda de canaleta continua dormente, como wall.
- **Grautes coincidentes:** aplicar todos os include elegíveis antes de todos os exclude elegíveis; ordenar origens/diagnósticos por geometria e ID. Clique no eixo atualiza a ação dos registros elegíveis naquele eixo, preservando IDs/associações, e cria um ajuste com as associações da célula se nenhum for elegível. Registros sem associação/alvenaria aplicável ficam pendentes e não são apagados pelo clique. Verificar limites antes de adicionar. Preservar a interpretação original somente na validação das convenções legadas.

## Diagnósticos

Código estável, categoria, IDs, posição/faixa de fiadas, efeito e parâmetros de mensagem; interface deriva ações. Exemplos: opening-outside-wall, opening-off-grid, opening-overlap, opening-at-junction, channel-level-off-grid, adjustment-target-missing. Não emitir channel-support-unresolved ou grout-passage-unverified: essas verificações físicas estão fora do escopo. Remoção voluntária e ultrapassagem de d decorrente dela não são falhas. Conflitos geométricos continuam localizáveis conforme M2, sem apagar intenção arquitetônica.

Na convenção vigente, a cruz suportada é composta. Erros exigem motivo específico: reservas incompatíveis, percurso sem padrão, altura inválida, vão invadindo encontro ou ajuste pendente. Mensagens mostram consequência no conjunto e número de paredes distintas, com floorId, IDs, posição e fiadas locais corretos. Localização realça o encontro e as paredes, preservando componentes independentes. Não usar nomes de marcos como causa operacional nem erro estrutural para ausência de parâmetros físicos.

## Integridade de transformações

Transformações indiretas preservam vãos mesmo quando a união causar separação/volume incompatível; usar validação estrutural do documento e diagnóstico geométrico, não `putOpening` de edição direta para bloquear ou apagar esses vãos. Checar soma de coordenadas, bounds, offset+width, alcances e quantidade de novos ajustes antes de alocar/confirmar; não salvar candidato parcialmente transformado. Arquivo íntegro com pendência geométrica é aceito; alcance não inteiro/modular, UUID duplicado ou referência órfã é recusado.

Implementação: src/domain/composition.ts, src/domain/channels.ts e src/domain/grout.ts. CT-01–14 e seus exemplos independentes definem a convenção nominal; o software implementa essas regras sem criar uma comprovação física ou dimensionamento estrutural.
