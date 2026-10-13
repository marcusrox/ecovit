# Ecovit — Arquitetura Técnica

**Versão:** 1.6 — M3.3, arquivo versão 5 e composição nominal-v6\
**Data:** 13 de outubro de 2026\
**Base funcional:** PRD Ecovit 0.13; M3.1/M3.2 aprovados, M3.3 implementado com teste manual/aceite pendentes\
**Objetivo:** implementar o editor e o motor construtivo com uma stack acessível, sem infraestrutura desnecessária.

## 1. Decisões de arquitetura

Um único aplicativo web estático, executado no navegador, em JavaScript/TypeScript. Interface focada em computadores com mouse e teclado. O usuário acessa o site, trabalha localmente e salva projetos no navegador ou em arquivos .ecovit.

Não haverá backend, login, banco remoto ou serviço pago obrigatório na primeira versão. Não será criada uma prova de conceito separada: o desenvolvimento será feito diretamente no produto, com testes funcionais e de desempenho ao longo da implementação.

O aplicativo conterá três responsabilidades principais: interface/editor, motor construtivo e persistência. Serão módulos do mesmo repositório, não aplicações ou serviços independentes.

## 2. Stack escolhida

| Responsabilidade | Tecnologia | Motivo no Ecovit |
|---|---|---|
| Linguagem | TypeScript em modo strict | Tipar geometria, entidades, comandos e arquivos |
| Interface | React | Componentes para barras, propriedades e modos do editor |
| Desenvolvimento e build | Vite | Gerar aplicação estática |
| Canvas 2D | Konva + react-konva | Formas, eventos, camadas, seleção e integração React |
| Estado da aplicação | Zustand | Atualizações seletivas de projeto e controles sem propagar toda mudança à interface |
| Estilos | CSS Modules e variáveis CSS | Estilo compacto sem framework visual adicional |
| Armazenamento local | IndexedDB com Dexie | Persistir documentos estruturados por projeto |
| Validação de arquivos | Zod | Validar dados carregados em tempo de execução |
| Cálculo | Funções TypeScript no fluxo principal | Uma operação por vez, aceitando espera durante o processamento |
| Testes de domínio | Vitest | Geometria, encontros, propagação e arquivos |
| Testes do produto no navegador | Playwright | Gestos, modos, salvamento e reabertura |
| Qualidade do código | TypeScript, ESLint e Prettier | Verificação de tipos e consistência |
| Pacotes e scripts | npm | Ferramenta suficiente para um único aplicativo |
| Publicação | Arquivos estáticos em Cloudflare Pages ou servidor administrado por aaPanel | Mesma compilação nos dois destinos |

Usar releases estáveis e compatíveis no início da implementação, com versões fixadas no package-lock.json. A versão principal de react-konva deve acompanhar a versão principal do React segundo sua documentação. Não usar versões beta por padrão.

As dependências escolhidas são de código aberto, sem licença comercial obrigatória para esta solução. Conferir as licenças das versões instaladas e preservar seus avisos. Não será usado SDK comercial de editor.

React oferece suporte a TypeScript; Konva tem integração declarativa com React e eventos para formas. A escolha é uma decisão de adequação ao produto, não uma garantia de desempenho sem medição. Referências: [React e TypeScript](https://react.dev/learn/typescript), [react-konva](https://konvajs.org/docs/react/index.html).

## 3. Organização do código

Um repositório, um pacote e um build. Estrutura inicial sugerida:

- src/app: inicialização, tela de projetos e navegação simples entre editor e quantitativos.
- src/editor: canvas, modos Planta/Fiada, ferramentas, seleção, câmera e propriedades.
- src/domain: tipos do projeto, operações de edição, geometria e validações.
- src/engine: catálogo derivado, encontros, fiadas, graute e canaletas.
- src/state: estado compartilhado e coordenação de comandos/resultados.
- src/persistence: IndexedDB, leitura/escrita de .ecovit e migrações do formato.
- src/ui: controles compactos reutilizados e estilos comuns.
- tests: casos do motor, arquivos de referência e fluxos do navegador.

Sem monorepo, injeção de dependências genérica, barramento de eventos global, arquitetura de plugins ou abstração de múltiplos renderizadores. Extrair uma função ou módulo quando houver responsabilidade concreta.

O domínio e o motor não importarão React, Zustand, Konva ou Dexie. Serão funções TypeScript que recebem dados e retornam dados. Essa separação permitirá testar o cálculo sem abrir a interface e reaproveitar o modelo no futuro.

## 4. Fluxo principal

1. Um gesto do mouse produz uma prévia transitória no editor.
2. Ao concluir, uma operação de domínio aplica a alteração modular ao projeto.
3. A aplicação registra a alteração no histórico, marca o resultado como desatualizado e impede novas operações até terminar este fluxo.
4. Salva o documento atual no IndexedDB; se a escrita falhar, informa a falha e continua com o documento em memória.
5. Mostra “Calculando…”, permite que o navegador pinte esse estado e executa uma chamada do motor para o projeto inteiro.
6. Em caso de sucesso, substitui o resultado completo e salva novamente. Em caso de falha de cálculo, mantém o modelo e o resultado anterior desatualizado, informando o problema.
7. Libera os controles, inclusive em caso de falha. Download serializa o documento atual em memória, independentemente de sucesso do salvamento local.

Um indicador simples de operação em andamento impede sobreposição de edição, desfazer, carregamento, troca de projeto e download. Não haverá fila, cálculo concorrente ou protocolo de revisões de mensagens. O estado do resultado será atualizado ou desatualizado; isso não é controle de versões de regras construtivas.

Prévias de arraste não geram todo o projeto nem são salvas a cada movimento. Cancelar um gesto mantém o documento inalterado. Atualizações transitórias usam requestAnimationFrame para acompanhar a tela.

## 5. Canvas e interação

Um Stage Konva representa a área do desenho. Internamente poderá conter poucas camadas: grid, desenho principal e interação/seleção. São camadas do mesmo espaço de edição, sem canvases visíveis separados para Planta e Fiada.

Controles, campos e explicações serão elementos HTML acessíveis fora ou sobre o canvas. Não desenhar formulários dentro do canvas.

### Planta

Renderizar paredes como faixas contínuas, além dos símbolos de portas, janelas, vãos e projeções de lajes. O arraste é controlado pelo Ecovit: direção ortogonal, encaixe modular e prévia antes de confirmar. Não delegar a Konva um redimensionamento livre que permita medidas fora da malha.

Cada parede terá identificador estável, independente dos nós gráficos. Seleção e alças referenciam esse identificador. Conexões são detectadas pela geometria modular e distância do cursor em tela; o zoom altera a tolerância visual, não as coordenadas da conexão.

Paredes poderão ser criadas, excluídas e redimensionadas por qualquer extremidade, mantendo a oposta fixa. Não implementar ferramentas de mover ou dividir paredes, nem edição ou bloqueio de tijolos individuais. Ajustes construtivos ficam restritos a encontros, grauteamentos e canaletas. Novos projetos abrem diretamente no térreo com propriedades iniciais editáveis; outros pavimentos são adicionados sob demanda.

### Fiada

Renderizar apenas a fiada ativa e, opcionalmente, uma fiada adjacente como referência sem interação. Cada peça terá contorno e símbolos de furos/canais. Graute e peças especiais terão representação distinta.

Encontros só são editáveis na primeira fiada. A opção escolhida é armazenada no projeto e aplicada pelo motor a toda a altura correspondente. Grauteamentos são editados como trechos verticais do pavimento, respeitando intervalos interrompidos por vãos; não como pontos isolados de cada fiada.

Planta e Fiada compartilham geometria, câmera e seleção por identificador. Nós Konva são uma representação descartável, nunca o formato nativo do projeto.

### Estado dos gestos

Implementar estados explícitos simples: inativo, desenhando, movendo, redimensionando e navegando. Usar uma união TypeScript e funções; não adicionar biblioteca de máquina de estados inicialmente.

Tratar mouse solto fora do canvas, perda de foco e Escape para evitar gestos presos. Priorizar alças e seleção sobre início de novo desenho. Ignorar atalhos de canvas durante edição de campos.

## 6. Geometria e precisão

Adotar coordenadas internas inteiras em décimos de milímetro. Assim 12,5 cm equivale a 1.250 unidades internas e 7 cm a 700. Comprimento, largura, altura, níveis e espessuras usarão essa unidade; a interface converte para centímetros ou metros.

Aceitar dimensões-base com precisão de 0,1 mm, validar comprimento igual a duas larguras e rejeitar valores que não possam ser representados na precisão adotada. Isso evita arredondamento acumulado entre módulos e fiadas.

As extremidades da face externa de referência de cada parede serão múltiplos do módulo horizontal. A espessura será a largura do tijolo-base. Armazenar a face e o lado ocupado pela espessura, preservando esse lado ao redimensionar qualquer extremidade. A prévia permite inverter o lado antes da criação. Em paredes internas, a face externa é a face de referência escolhida, sem inferência de recintos. Encontros em L alinham as faces externas e têm composição compartilhada sem peças duplicadas.

Vãos usam distância modular ao longo da face externa desde a extremidade de menor coordenada e largura do vão bruto. Ao redimensionar a parede, preservar a posição do vão na planta e recalcular essa distância; sinalizar os que não couberem. Alturas usarão o passo vertical e referências do piso/alvenaria. Para o modelo nominal de M2, foi aprovado passo igual à altura-base, conforme CT-02 do [caderno técnico](Ecovit-Caderno-Tecnico.md), sem configuração adicional de junta. Essa convenção não comprova junta física nula nem passo instalado de qualquer fabricante.

A laje terá contorno e aberturas ortogonais simples, cota da face superior e espessura armazenada somente nela. A face inferior é a cota superior menos a espessura. O topo da parede será o início da alvenaria mais sua altura, limitado pela face inferior de uma laje de fechamento associada onde ela cobrir a parede. Sem essa laje, vale a altura da parede. Incompatibilidades com fiadas geram diagnóstico, sem arredondamento silencioso. A altura padrão do pavimento inicializa novas paredes; não substitui as alturas existentes. Não haverá entidade ou editor de telhados.

Pixels só existirão na câmera e no renderizador. Aplicar conversão tela/projeto antes de encaixar no grid. Zoom não modifica nenhuma dimensão física.

Paredes ortogonais são segmentos com espessura. O motor identifica sua rede de conexões e distribui peças no conjunto conectado. Não começar com biblioteca CAD, kernel 3D ou solver genérico.

## 7. Motor construtivo

Pipeline inicial:

1. Validar a dimensão-base e derivar o catálogo.
2. Construir a rede de paredes e seus encontros.
3. Aplicar escolhas de encontros da primeira fiada.
4. Distribuir peças ao longo de todas as fiadas.
5. Aplicar vãos, alturas das paredes e limites de lajes de fechamento.
6. Gerar a proposta de grauteamentos e elementos em canaletas.
7. Reconciliar ajustes manuais e verificar continuidade/colisões.
8. Produzir diagnósticos e quantitativos.

A ordem interna poderá ser ajustada às dependências do algoritmo; elementos estruturais que mudam peças exigirão nova composição da região afetada. Não tratar canaletas como apenas uma cor aplicada depois da geração.

Começar recalculando o projeto inteiro após cada alteração geométrica ou construtiva confirmada. Isso inclui todos os pavimentos e verificações entre eles, sem rastreamento de regiões pendentes. Alterações apenas de nome, seleção ou câmera não exigem geração.

Executar uma chamada síncrona do motor no fluxo principal, depois de exibir o estado de espera. Novas operações ficam indisponíveis até terminar; não enfileirar cliques para executá-los depois. Usar tratamento de erro que sempre libere os controles. Não haverá cancelamento ou progresso percentual durante essa chamada; uma espera de processamento é aceita nesta versão.

Não implementar Worker, fila de tarefas, resultados parciais ou atualização incremental inicialmente. Se o uso no aplicativo mostrar espera inaceitável, medir o gargalo antes de mudar essa decisão. A separação do motor em funções de dados permite uma evolução posterior sem antecipar sua infraestrutura.

Derivar somente o catálogo padrão e os procedimentos de preparação documentados, com seus limites de aplicação. Dimensões 2:1 não garantem solução universal nem correspondência com peças comerciais. Regiões não suportadas recebem “Sem solução automática”; peças especiais não são um recurso genérico para fechar qualquer lacuna. Ajustes de encontros, graute e canaletas incompatíveis ficam registrados como pendentes e não são aplicados até correção; não manter bloqueios de peças individuais.

A pesquisa construtiva e o Caderno técnico previstos no PRD continuam necessários antes dos algoritmos correspondentes. Esta arquitetura não inventa parâmetros de graute, apoios ou armaduras.

## 8. Estado e desfazer/refazer

Zustand manterá o documento atual, resultado gerado e estado de interface em partes separadas. Componentes assinarão somente os campos necessários. Estado de cursor e prévia não duplicará o documento persistente. [Documentação do Zustand](https://github.com/pmndrs/zustand).

Desfazer/refazer usará histórico limitado de estados do modelo editável, com compartilhamento das partes não alteradas por atualizações imutáveis. Não armazenar todas as peças geradas em cada passo do histórico. Começar com limite de 50 operações e ajustar se memória/uso justificarem.

Cada gesto confirmado é uma operação; atualizações automáticas pertencem à mesma operação. Desfazer restaura entradas e escolhas e segue o mesmo fluxo sequencial de salvamento e recálculo. Reabrir arquivo não precisa restaurar o histórico da sessão anterior.

Não adicionar event sourcing ou persistência de cada movimento do mouse.

## 9. Persistência e arquivo .ecovit

Contrato original de M2: envelope de arquivo versão 2 e composição `nominal-v3`; contrato vigente de M3.3 na seção 15. Snapshots anteriores são conferidos integralmente por recomputação com sua convenção original antes de serem marcados desatualizados para recálculo pelo fluxo normal. Preservar modelo, IDs e escolhas; snapshots adulterados são recusados. Em leitura bloqueada por outra aba, conservar resultado antigo identificado como desatualizado, sem salvar. A geometria de M2 está em CT-05 do caderno; a evolução e as evidências das migrações permanecem no [relatório de M2, Plano §6](Ecovit-Plano-Implementacao.md#6-relatório-de-implementação-de-m2--11102026).

IndexedDB, via Dexie, armazenará registros de projetos com id, nome, datas e documento. Usar localStorage somente para pequenas preferências de interface, se necessário. [Dexie e IndexedDB](https://dexie.org/docs).

Salvar o documento inteiro em uma transação após cada alteração confirmada. Para alterações que exigem cálculo, salvar primeiro o modelo com resultado desatualizado e, após sucesso, salvar o documento com a nova composição. Aguardar cada escrita nesse fluxo único; não adicionar temporizadores, fila de salvamento ou persistência de movimentos do mouse. O indicador diferencia trabalho salvo, salvamento em andamento e falha, independentemente do estado do cálculo.

Falhas de quota ou indisponibilidade manterão o documento em memória e oferecerão download após a operação. O download sempre usa a memória atual, sem exigir salvamento local bem-sucedido. Para impedir sobrescrita por outra aba, usar um único bloqueio exclusivo por projeto durante a edição; a segunda aba informa que o projeto já está aberto e não permite editá-lo. Não implementar sincronização ou mesclagem entre abas.

### Estrutura do arquivo

JSON UTF-8 com extensão .ecovit:

- format: identificador ecovit.
- schemaVersion: versão do formato; M1 usa 1, M2 usa 2, M3.1 usa 3, M3.2 usa 4 e M3.3 vigente usa 5; contratos na seção 15.
- project: identificadores, nome, unidades e dimensões-base.
- model: pavimentos, paredes, vãos, lajes e referências verticais.
- adjustments: escolhas de encontros e ajustes de graute/canaletas.
- generated: última composição disponível e catálogo, ou ausência de resultado antes da primeira geração.
- generationState: atualidade do resultado e diagnósticos.
- metadata: datas e versão do aplicativo que gravou o documento.

Não incluir nós Konva, funções, histórico inteiro ou dados de mouse. A versão do formato não é uma versão das regras construtivas.

Validar estrutura com Zod, relações entre identificadores e limites de quantidade/tamanho antes de substituir o projeto aberto. Começar com limite de arquivo de 50 MB, revisando-o se o projeto de carga exigir. Mensagens devem explicar a rejeição. Migrações preservam o arquivo original; formato futuro não reconhecido não é carregado parcialmente. [Zod](https://zod.dev/).

Na reabertura, conservar a composição salva. Regeneração posterior deve reconciliar escolhas e ajustes e mostrar incompatibilidades. Dados gerados são verificáveis e não dispensam validação.

Se o arquivo contiver resultado desatualizado ou ausente, recalcular automaticamente pelo mesmo fluxo antes de disponibilizar quantitativos. Resultado antigo pode ser preservado como referência identificada, mas nunca apresentado como composição atual. Reabrir um documento atualizado preserva sua composição; a próxima alteração geométrica ou construtiva dispara o recálculo normal.

No futuro, um backend poderá armazenar esse documento por projeto, sem mudar o canvas ou o motor. Criar apenas funções específicas de salvar/carregar/listar agora, sem construir camadas genéricas para bancos ainda inexistentes.

## 10. Desempenho

O projeto de carga do PRD pode ter 100 mil peças totais; isso não significa desenhar 100 mil nós interativos simultaneamente.

- Renderizar apenas pavimento/fiada ativos e peças que interceptam a região visível.
- Não montar todas as fiadas como nós ocultos.
- Desativar eventos em grid, referências e decoração.
- Desenhar peças em lotes por parede com formas customizadas quando a contagem tornar nós individuais dispendiosos; selecionar por coordenadas e identificadores do modelo.
- Manter alças e realces em camada de interação, sem redesenhar o projeto inteiro a cada movimento.
- Simplificar furos e detalhes em zoom distante; preservar precisão de seleção.
- Calcular apenas após confirmação da edição, evitando geração e cópias integrais a cada evento do mouse.
- Medir geração, quantidade de formas visíveis e duração de gestos durante o desenvolvimento.

O uso de camadas reduzidas e eventos desabilitados em formas sem interação segue as [orientações de desempenho do Konva](https://konvajs.org/docs/performance/All_Performance_Tips.html).

Não adotar WebGL, índices espaciais complexos ou compressão binária inicialmente. Se um cenário real exceder as metas, identificar o gargalo antes de adicionar tecnologia.

## 11. Publicação e conexão

O build gera a pasta dist. Ela poderá ser publicada no Cloudflare Pages ou no servidor web configurado no aaPanel. Não será necessário executar Node.js no servidor de produção.

Cloudflare Pages: comando npm run build e diretório dist. Em aaPanel: publicar o conteúdo de dist em diretório do site, configurar HTTPS, tipo adequado para módulos JavaScript e fallback de navegação quando houver rotas. Configurar base do Vite se o aplicativo estiver em subdiretório.

Preferir um endereço estável, por exemplo um subdomínio dedicado, pois IndexedDB pertence à origem do site. Mudar domínio/protocolo não transfere os projetos locais; arquivos .ecovit permitem transporte.

Inicialmente o acesso exige conexão para carregar o aplicativo. Depois de aberto, operações locais não dependem de API remota, mas recarregamento offline não será garantido. Sem PWA ou Service Worker nesta fase, pois funcionamento offline não é requisito.

Publicar recursos estáticos com nomes de conteúdo gerados pelo build e evitar cache prolongado do HTML. Não carregar dependências essenciais por CDN externa em tempo de uso.

Referências: [publicação estática do Vite](https://vite.dev/guide/static-deploy.html) e [configuração de build do Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/build-configuration/).

## 12. Testes durante implementação

Não haverá prova técnica, prova de conceito ou protótipo separado. O solicitante testará diretamente no aplicativo após cada implementação e poderá ajustar os rumos durante o desenvolvimento. Testes automatizados pertinentes acompanharão as alterações, sem constituir uma fase independente de aprovação.

Vitest: encaixe modular, precisão, interseções, catálogo, alternância de encontros, interrupções por vãos, canaletas, propagação vertical, quantitativos e ida/volta do arquivo.

Playwright: desenhar/redimensionar, cancelar gesto, alternar modos, navegar fiadas, editar encontro apenas na primeira, alterar graute respeitando vãos, desfazer, salvar/recarregar e transportar arquivo. Coordenadas dos gestos devem ser calculadas pela câmera/elementos conhecidos, evitando testes frágeis presos a pixels de uma tela específica.

Testar arquivo inválido, falha de cálculo, liberação dos controles após falha, salvamento de rascunho, download após falha de armazenamento e alterações sucessivas em pavimentos diferentes. Usar os casos do Caderno técnico como resultados esperados para o motor; não validar o algoritmo apenas contra sua própria saída.

Observar desempenho no próprio aplicativo ao longo da implementação, usando também o cenário do PRD. A referência de geração em até 5 segundos é uma meta inicial de observação, sem exigir prova técnica prévia; a espera aceitável será avaliada pelo solicitante durante o uso.

Referências: [Vitest](https://vitest.dev/guide/) e [Playwright](https://playwright.dev/docs/intro).

## 13. Evolução com necessidade concreta

| Necessidade futura | Evolução prevista |
|---|---|
| Projetos na nuvem e login | Adicionar backend e persistência do documento por projeto |
| Consulta 3D | Novo renderizador consumindo a mesma geometria e cotas |
| PDF/SVG/CSV | Geradores usando modelo e resultado, sem depender de captura de tela |
| Abertura offline | Service Worker/PWA quando virar requisito |
| Projetos maiores | Otimizar o gargalo medido, preservando o domínio |

Não selecionar banco remoto, provedor de autenticação ou biblioteca 3D agora. Preservar dados independentes da interface já atende à preparação necessária.

## 14. Critério de conclusão da arquitetura

Esta proposta escolhe a stack e define como implementar o PRD sem infraestrutura comercial obrigatória. O editor, o motor sequencial e a persistência serão construídos diretamente no aplicativo.

Esta revisão não cria marcos ou tarefas. A pesquisa construtiva continua prevista antes dos algoritmos correspondentes; as funcionalidades serão verificadas no próprio aplicativo após cada implementação.

Documentação oficial consultada em 10 de outubro de 2026. Não foram executados testes de implementação nem de desempenho nesta etapa.

## 15. Contratos de M3 nominal — 12/10/2026

M3.1 implementa vãos e seus padrões; M3.2 acrescenta canaletas e supressões; M3.3 acrescenta grautes nominais e ajustes, arquivo versão 5 e composição nominal-v6. Stack e fluxo sequencial mantidos. PRD §20, Plano §7 e CT-07–10 são referências; nenhuma exigência de física de cavidades, dimensionamento de apoio/armadura ou cadastro de fabricante.

### Dados persistentes

- Configuração de projeto: padrões de base/topo de vãos; lista de níveis globais de canaleta (cotas de topo relativas ao piso); quatro flags de graute e distância máxima. Identidade estável por nível, sem usar índice do array. Valores iniciais e efeitos são normativos no [PRD §20](Ecovit-PRD.md#padrões-normativos-de-m3).
- Vão: ID, wallId, tipo, distância desde menor coordenada, largura, base relativa ao piso e altura; orientação herdada, topo derivado. Redimensionar parede mantém posição mundial. Admitir offset negativo como rascunho pendente após edição indireta, sem aceitar referência órfã ou número inválido.
- Validação entre vãos: aplicar CT-07 e o recorte D3-02 desde M3.1; edição indireta incompatível preserva intenção com diagnóstico. Em M3.2, a fiada compartilhada de canaletas mantém múltiplas origens sem duplicar entidades geradas.
- Canaleta automática: origens semânticas (nível global, vão superior/inferior), parede/faixa de fiada e conjunto nominal de células, derivadas por CT-09. Unificar múltiplas origens numa ocupação. Peças geradas não são entidades editáveis individualmente.
- Graute: eixo de célula nominal com associações a paredes/origens; intervalos derivados da alvenaria menos vãos. Unificar mesma coordenada compartilhada sem multiplicar graute por parede. Canais/furos são símbolos, sem campos obrigatórios de diâmetro, aço ou apoio.
- Ajustes: inclusões/exclusões de eixos de graute e supressões de faixas de canaletas. Referências por coordenada/origem/parede/cota estáveis, nunca peça gerada/índice de array. Supressão cobre toda a parede na fiada selecionada, inclusive trechos descontínuos e origens coincidentes; não armazenar exclusão de tijolo individual.

Identificar supressão de faixa pela parede e cota absoluta escolhidas no momento da remoção, cobrindo toda sua faixa na fiada e todas as origens coincidentes. Usar a parede como alvo estável, sem congelar apenas o trecho clicado; extensão posterior da mesma parede continua abrangida pela supressão naquela cota. Mudar nível global remove a faixa antiga e gera uma faixa em outro lugar; a exclusão da cota antiga permanece, podendo voltar a valer se houver demanda lá novamente. Não deslocar exclusão silenciosamente. Para graute, guardar eixo em coordenadas mundiais e paredes relacionadas; estender/encurtar parede recalcula intervalos, sem mover o eixo. Reassociação ambígua após edição mantém ajuste não aplicado e localizável. Excluir origem arquitetônica remove dependências na mesma operação de histórico.

### Fluxo determinístico

Gerar ocupação de paredes → percurso/fase M2 → subtrair vãos → gerar demandas nominais de canaletas → unificar regiões e aplicar supressões → compor inteiro/meio/canaleta/meia conforme CT-08/09 → gerar candidatos de graute por configuração → derivar intervalos → aplicar inclusões/exclusões → validar geometria e emitir diagnósticos. Referenciar CT-10 para distribuição por malha; não completar lacuna deixada por supressão para tentar cumprir novamente a distância máxima.

Recomposição tipada e efeito geométrico das supressões seguem CT-09, sem um motor de preparação física. Configuração Aplicar e suas consequências são uma operação de histórico; salvar modelo/configuração/ajustes desatualizados → calcular inteiro → salvar resultado. Cancelar não grava. Restaurar padrões do grupo preserva ajustes, conforme PRD §20.

Disparos de cálculo por configuração seguem os efeitos definidos no PRD §20. Sem operação sobreposta, fila ou Worker. Nome/seleção/câmera/hover não calculam. Falha libera controles, preserva memória/modelo e identifica resultado antigo; download representa documento atual após término.

### Editor

Os controles e comportamentos visíveis seguem RF-04/06/07 e PRD §20; sua disponibilização por incremento segue Plano §7. O editor projeta o modelo e usa IDs estáveis para comandos, sem armazenar nós gráficos no documento.

Em ferramenta Graute na Fiada, hit testing por centro de célula/furo nominal da camada ativa, com tolerância em pixels ajustada ao zoom. Hover +/− é transitório; clique confirma uma alteração em todo eixo. Cor escura identifica presença. Canaletas também expõem seus eixos nominais para o mesmo gesto, sem pretensão de cavidade física. Bloquear ação durante processamento/somente leitura; distinguir navegação por botão central; fiada de referência não recebe ação. Oferecer rótulos e acionamento por teclado.

Renderizar canaletas e intervalos de graute a partir do resultado gerado da fiada ativa; seleção de faixa resolve parede/cota, sem transformar peça gerada em entidade editável. A ação “Editar na Planta” transporta seleção por ID e preserva câmera.

Hit testing de vãos na Planta pode retornar múltiplos IDs para o seletor contextual definido no PRD §20. Na Fiada, filtrar aberturas pela interseção vertical com a fiada ativa, conforme CT-07.

### Diagnósticos e integridade

Código estável, categoria, IDs, posição/faixa de fiadas, efeito e parâmetros de mensagem; interface deriva ações. Exemplos: opening-outside-wall, opening-off-grid, opening-overlap, opening-at-junction, channel-level-off-grid, adjustment-target-missing. Não emitir channel-support-unresolved ou grout-passage-unverified: essas verificações físicas foram excluídas. Remoção voluntária e ultrapassagem de d decorrente dela não são falhas. Conflitos geométricos continuam localizáveis conforme M2, sem apagar intenção arquitetônica.

M3.2 introduz envelope versão 4 e convenção nominal-v5, mantendo configurações de aberturas em `project.openingSettings` e vãos em `model.openings`. Níveis globais em `project.channelLevels: { id, top }[]`, com UUID estável e topo relativo ao piso. Supressões em `adjustments.channels: { id, wallId, top }[]`, com UUID e topo absoluto. Resultado `generated.channels` contém faixas `{ id, wallId, top, course, cells }`: identidade derivada de parede/cota, células mundiais com origens semânticas ordenadas. Peças adicionam tipos `channel`/`half-channel` e origens; estas são derivadas, não comandos persistentes de edição.

Contrato original de M3.2: validar versões 1/2/3 e snapshots nominal-v1–v4 pela convenção original antes de migrar em memória. Legados recebem níveis globais vazios: sua ativação exige adicionar níveis ou Restaurar padrões e Aplicar. As faixas locais imediatamente junto aos vãos existentes são automáticas por CT-09; a política de não acrescentar níveis globais não desativa essa composição local. Novos projetos recebem 112/224 cm, conforme PRD §20. Esse incremento não introduziu configurações/geração de graute; a evolução vigente está abaixo.

M3.3 acrescenta `project.groutSettings: { junctions, openings, ends, intervals, distance }`, com quatro booleanos e distância inteira em 0,1 mm. Novos projetos recebem flags habilitadas/distância 10000; migrados recebem flags desligadas/distância 10000. Configuração de canaletas de arquivo versão 4 é preservada. Na migração de versões anteriores a 4, manter a inicialização sem níveis globais. A ativação de grautes legados é explícita por configuração, sem incluir automáticos na reabertura.

`adjustments.grout: { id, x, y, wallIds, action }[]`, com UUID estável, origem mundial inteira da célula nominal, paredes associadas e `include`/`exclude`. O centro exibido/atingido é derivado por x/y + m/2; não arredondar a identidade nem persistir coordenadas fracionárias quando m é ímpar em unidades de 0,1 mm. Identidade geométrica é a coordenada da célula, nunca índice de fiada ou ID de peça. Ajustes não ancoram a redistribuição automática. Exclusão prevalece sobre todas as origens do mesmo eixo; adicionar novamente conserva ID e passa a inclusão explícita. Descartar ajuste remove a intenção para permitir automação. Excluir parede retira sua associação; ajuste sem paredes remanescentes é eliminado na mesma operação de histórico. Eixo que perdeu alvenaria ou associação geométrica mantém ajuste pendente na coordenada original, sem mover para vizinho.

`generated.grouts: { id, x, y, wallIds, origins, intervals: { bottom, top }[] }[]`: identidade derivada da origem da célula, paredes/origens ordenadas, intervalos absolutos, ordenados e unidos quando contíguos. Alvenaria realmente composta define marcadores e intervalos, descontando aberturas e componentes sem solução. Origem automática identifica encontro, vão, ponta ou intervalo; manual identifica UUID do ajuste. Renderização e interação derivam os centros, incluindo células de canaletas. Uma célula compartilhada produz um eixo, sem duplicação por parede.

Processamento vigente: paginação M2 → validação/subtração M3.1 → demandas CT-09 → união por célula → supressão por parede/cota → tipagem de peças → marcadores/intervalos da alvenaria → candidatos CT-10 → ajustes de graute. Par misto divide em meios sem ampliar o alcance. Origem do nível usa UUID; origens locais usam UUID do vão e posição superior/inferior. Célula compartilhada suprimida prevalece sobre demandas de qualquer parede/origem. Mudanças indiretas fora da malha preservam níveis/ajustes com diagnóstico e sem aplicação; supressão sem demanda mas em cota válida fica dormente, sem erro. Supressão de canaleta não altera grautes. Exclusão de parede elimina ajustes dependentes na mesma operação desfazível.

A migração preserva geometria, IDs e escolhas. Sem vãos e com níveis globais vazios, a composição reproduz a geometria de nominal-v3. Aplicam-se as regras já definidas de bloqueio de edição e preservação do arquivo original. Representação na Fiada usa canal longitudinal esquemático; Planta mantém arquitetura. Seleção com múltiplas paredes oferece escolha contextual; referência adjacente permanece sem ação.

Migrar em memória e salvar somente com bloqueio de edição; nunca modificar arquivo original. Arquivo atualizado exige conferência de resultado pela própria convenção; adulterado/futuro é recusado antes de substituir aberto. Rascunho com pendência geométrica íntegra pode salvar/reabrir. Importação segue como cópia; limite 50 MB mantido. Revisar limites de vãos/faixas/eixos antes de alocar, sem truncamento.

A evolução de quantitativos permanece futura. Não deduzir volume de graute ou consumo de aço de símbolos sem dimensões. M3.3 preserva a tabela IndexedDB existente; migra em memória antes do salvamento com bloqueio e registra versão do aplicativo 0.5.0 quando grava. Resultado atual de versão 5 exige nominal-v6; versões 4/3 exigem nominal-v5/v4 antes da migração. Validar integralmente snapshots nominal-v1–v5 pela convenção original antes de adicionar configurações de graute e marcar resultado desatualizado. Leitura bloqueada mantém o resultado antigo identificado, sem gravação nem cálculo. Limites defensivos: mil vãos, 100 níveis, 10 mil supressões, 10 mil ajustes de graute, 20 mil eixos e 200 mil intervalos, além dos limites existentes e arquivo 50 MB; sem truncamento. Cálculo excedido preserva modelo e diagnostica o limite.
