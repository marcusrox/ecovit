# Ecovit — Arquitetura Técnica

**Versão documental:** 1.14
**Base funcional:** PRD Ecovit 0.21. M1–M3.5 implementados e aceitos; M4.1 implementado com aceite manual pendente; M4.2/M4.3 e M5 previstos.
**Aplicativo:** 0.8.0; arquivo versão 8; composição nominal-v9.

As seções gerais descrevem a arquitetura do aplicativo. As seções de M3–M3.5 registram contratos históricos; M4.1 está implementado conforme §19, preservando as regras nominais locais. Lajes e comparação visual de M4 permanecem previstas. Versões de formato e convenções nominais identificam contratos de dados, não etapas pendentes de desenvolvimento.

Durante o MVP, cada marco pode quebrar compatibilidade com formatos de marcos anteriores, sem obrigação de implementar ou manter migrações, conversores ou geradores exclusivamente para esse fim. M4.1 aplica essa decisão: arquivos e documentos locais anteriores são recusados, sem conversão. Os contratos e geradores legados descritos nas seções dos marcos anteriores registram o comportamento já entregue; não constituem obrigação de mantê-los nos marcos seguintes. As diretrizes de M4 estão na seção 18 e o contrato vigente de M4.1 na seção 19. Leitores e geradores exclusivamente legados foram removidos.

## 1. Organização da aplicação

Um único aplicativo web estático, executado no navegador, em JavaScript/TypeScript. Interface focada em computadores com mouse e teclado. O usuário acessa o site, trabalha localmente e salva projetos no navegador ou em arquivos .ecovit.

Não haverá backend, login, banco remoto ou serviço pago obrigatório na primeira versão. Não será criada uma prova de conceito separada: o desenvolvimento será feito diretamente no produto, com testes funcionais e de desempenho ao longo da implementação.

O aplicativo contém três responsabilidades principais: interface/editor, motor construtivo e persistência. São módulos do mesmo repositório, não aplicações ou serviços independentes.

## 2. Stack

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

Usar releases estáveis e compatíveis, com versões fixadas no package-lock.json. A versão principal de react-konva deve acompanhar a versão principal do React segundo sua documentação. Não usar versões beta por padrão.

As dependências escolhidas são de código aberto, sem licença comercial obrigatória para esta solução. Conferir as licenças das versões instaladas e preservar seus avisos. Não será usado SDK comercial de editor.

### 2.1. Padrão de iconografia

**Implementação:** Lucide React (`lucide-react` **1.57.0**) é o catálogo único para ícones de interface, na família de contorno. Dependência exata no package.json/lockfile, compatível com React 19. `src/ui/Icon.tsx` centraliza importações individuais e nomes semânticos, sem paths autorais. Verificações e aceite específico da apresentação no Plano §11.

A escolha atende à necessidade concreta de catálogo amplo com linguagem visual consistente, SVGs configuráveis e componentes React. Importações individuais permitem incluir apenas os ícones usados. Referências oficiais: [catálogo](https://lucide.dev/icons/), [React/importações](https://lucide.dev/guide/react/getting-started), [traço](https://lucide.dev/guide/react/basics/stroke-width) e [licença](https://lucide.dev/license). Licença integral do pacote, incluindo avisos ISC/MIT dos derivados, em `public/third-party/lucide-react-LICENSE.txt`, copiada pelo build para dist. Em futuras atualizações, selecionar versão estável compatível, atualizar lockfile e conferir/manter os avisos distribuídos; sem CDN/fontes remotas.

#### Uso obrigatório na interface

- Centralizar imports de `lucide-react` e o mapa de nomes semânticos em `src/ui/Icon.tsx`. Telas usam esse componente; não importam a biblioteca diretamente, não copiam paths nem criam SVGs avulsos para controles. Preservar nomes internos como select, wall e settings para trocar desenhos sem mudar os consumidores.
- Importar explicitamente somente os ícones usados. Não carregar o catálogo inteiro por namespace, nome vindo de arquivo de projeto, CDN ou carregamento dinâmico. Ícones são apresentação, não dados persistidos do projeto.
- Uma ação tem o mesmo ícone em todas as telas. Selecionar pelo significado e pela legibilidade em tamanho real; não pelo enfeite. Ferramentas de parede/porta/janela/vão precisam ser distinguíveis entre si e conservar rótulos. A escolha visual desses quatro desenhos deve ser conferida em tamanho real, sem associar ícone a regra construtiva.
- Usar exclusivamente a família de contorno; não misturar pacotes, emoji, fontes de ícones, duotone ou estilos preenchidos nas ações. Ícones adicionais vêm do mesmo catálogo. Se faltar correspondência exata, escolher símbolo reconhecível acompanhado de rótulo; registrar a decisão no mapa central, sem criar um segundo catálogo.

#### Aparência, alinhamento e acesso

| Propriedade | Padrão da interface |
|---|---|
| Tamanho | Variantes centrais control=18 px, compact=16 px, card=24 px, feature=32 px. API aceita somente essas variantes, sem medidas arbitrárias por tela. |
| Traço | 2 unidades na grade 24×24, extremidades/junções arredondadas, sem preenchimento; conferir peso nos tamanhos previstos. Não variar traço para indicar seleção. |
| Cor | currentColor do controle, com verde profundo para ações normais, branco sobre ação principal/selecionada e cor semântica em avisos/exclusões. Não clarear ícones habilitados com opacity; indisponibilidade segue o estado disabled do controle. Cor acompanha texto/estado, sem códigos isolados por ícone. |
| Contêiner | Flex/grid centralizado nos dois eixos, SVG block e sem encolhimento. Ícone + texto com espaço de 6 px e largura suficiente para ambos. Botão somente com ícone usa variante explícita e área regular; não deduzir ausência de texto por :only-child, pois esse seletor ignora nós de texto. |
| Interação | Ícone decorativo aria-hidden/focusable=false; nome acessível e foco pertencem ao botão/summary. Ação só com ícone precisa de aria-label em português e dica visual por hover/foco. Texto de status permanece legível e anunciado; ícone/cor não são a única informação. |
| Consistência | Reusar variantes de controle e estados normal/hover/foco/selecionado/disabled. Verificar centro geométrico e aparência óptica; assimetria natural do desenho não se corrige com deslocamentos avulsos por tela. |

**Exceções de natureza, não bibliotecas alternativas:** logotipo Ecovit é identidade própria; tijolos, furos, canaletas, eixos, grautes, alças e sinais geométricos do canvas são desenhos do domínio. Não substituí-los por pictogramas genéricos. Multiplicação em medidas, sinais numéricos e unidades continuam texto. Legendas de peças/eixos devem usar amostras dos desenhos correspondentes; os caracteres ■/○/▱/● atuais são candidatos à melhoria de fidelidade, sem importar peças do Lucide.

#### Mapa semântico e verificação

O mapa central relaciona ações a ícones: select→MousePointer2, wall→BrickWall, door→DoorClosed, window→SquareSplitHorizontal, opening→SquareDashed, settings→SlidersHorizontal, undo/redo→Undo2/Redo2, left/right→ChevronLeft/ChevronRight, close→X, plus/minus→Plus/Minus, copy/delete→Copy/Trash2, download/upload→Download/Upload, fit→Scan, info→Info, plan→PanelsTopLeft. Porta representa folha/batente, janela quadro dividido, vão contorno tracejado; símbolos são ferramentas, não detalhes construtivos.

O mapa também inclui status saved/warning/saving/readonly→Check/TriangleAlert/LoaderCircle/LockKeyhole, next→ArrowRight e home→House. Estado vazio, abertura de cartão e orientação de backup usam o mesmo catálogo. Inverter lado conserva direções ↓/→/↑/← como indicação geométrica separada do texto da ação; +/− do graute e legendas técnicas permanecem desenhos/sinais do domínio. Handlers, nomes acessíveis, condições de exibição, atalhos, foco e histórico preservados. Não acrescentar ícone a todo botão de texto automaticamente; usar quando facilitar reconhecimento.

Controles usam classes explícitas iconButton/iconText; ícones sozinhos têm área regular, dicas por hover/focus-visible e title. SVG não recebe foco. Dicas ocultas usam display:none para não aumentar área rolável; na lista de canaletas, dica aparece ao lado do controle. Texto do salvamento permanece no status anunciado. Seleção usa os estados existentes; disabled conserva opacidade do controle inteiro, sem clarear ícone habilitado.

Verificar imports/paths/glifos restantes, centralização e ausência de sobreposição em todas as superfícies afetadas: início/criação, cabeçalho/status, ferramentas, Fiada, zoom, painéis, configurações/ajuda e diagnósticos. Rodar tipos/lint/build e e2e pertinentes Chrome/Edge, com revisão visual de 1366×768, 1280×720 e 900×680 e zoom habitual. Reusar verificações de centro (tolerância 1 px para a caixa SVG) e texto que não excede botões; validar também legibilidade óptica e estados. ESLint bloqueia imports/reexports estáticos (incluindo subpaths) e import()/require() literais de lucide-react fora do componente central. A regra foi verificada com casos permitidos e proibidos; não substitui revisão semântica/visual nem é uma barreira contra código deliberadamente ofuscado.

React oferece suporte a TypeScript; Konva tem integração declarativa com React e eventos para formas. A escolha é uma decisão de adequação ao produto, não uma garantia de desempenho sem medição. Referências: [React e TypeScript](https://react.dev/learn/typescript), [react-konva](https://konvajs.org/docs/react/index.html).

## 3. Organização do código

Um repositório, um pacote e um build. Estrutura implementada:

- src/app: tela de projetos, editor e propriedades.
- src/editor: canvas, modos Planta/Fiada, ferramentas, seleção e câmera.
- src/domain: tipos do projeto, geometria, operações de edição e motor de composição, canaletas e grautes.
- src/state: estado compartilhado e coordenação de comandos/resultados.
- src/persistence: IndexedDB e leitura/escrita estrita do formato .ecovit vigente.
- src/ui: iconografia e estilos comuns.
- tests: casos de domínio, arquivos de referência, persistência e fluxos de navegador.

A consulta de quantitativos pertence a M5. Não há diretório separado src/engine; o motor reside em src/domain.

Sem monorepo, injeção de dependências genérica, barramento de eventos global, arquitetura de plugins ou abstração de múltiplos renderizadores. Extrair uma função ou módulo quando houver responsabilidade concreta.

O domínio e o motor não importam React, Zustand, Konva ou Dexie. São funções TypeScript que recebem dados e retornam dados. Essa separação permitirá testar o cálculo sem abrir a interface e reaproveitar o modelo no futuro.

## 4. Fluxo principal

1. Um gesto do mouse produz uma prévia transitória no editor.
2. Ao concluir, uma operação de domínio aplica a alteração modular ao projeto.
3. A aplicação registra a alteração no histórico, marca o resultado como desatualizado e impede novas operações até terminar este fluxo.
4. Salva o documento atual no IndexedDB; se a escrita falhar, informa a falha e continua com o documento em memória.
5. Mostra “Calculando…”, permite que o navegador pinte esse estado e executa uma chamada do motor para o projeto inteiro.
6. Em caso de sucesso, substitui o resultado completo e salva novamente. Em caso de falha de cálculo, mantém o modelo com resultado ausente/desatualizado, informando o problema.
7. Libera os controles, inclusive em caso de falha. Download serializa o documento atual em memória, independentemente de sucesso do salvamento local.

Um indicador simples de operação em andamento impede sobreposição de edição, desfazer, carregamento, troca de projeto e download. Não haverá fila, cálculo concorrente ou protocolo de revisões de mensagens. O estado do resultado será atualizado ou desatualizado; isso não é controle de versões de regras construtivas.

Prévias de arraste não geram todo o projeto nem são salvas a cada movimento. Cancelar um gesto mantém o documento inalterado. Atualizações transitórias usam requestAnimationFrame para acompanhar a tela.

## 5. Canvas e interação

Um Stage Konva representa a área do desenho. Internamente poderá conter poucas camadas: grid, desenho principal e interação/seleção. São camadas do mesmo espaço de edição, sem canvases visíveis separados para Planta e Fiada.

Controles, campos e explicações serão elementos HTML acessíveis fora ou sobre o canvas. Não desenhar formulários dentro do canvas.

### Planta

Renderizar paredes como faixas contínuas, além dos símbolos de portas, janelas, vãos e projeções de lajes. O arraste é controlado pelo Ecovit: direção ortogonal, encaixe modular e prévia antes de confirmar. Não delegar a Konva um redimensionamento livre que permita medidas fora da malha.

Cada parede terá identificador estável, independente dos nós gráficos. Seleção e alças referenciam esse identificador. Conexões são detectadas pela geometria modular e distância do cursor em tela; o zoom altera a tolerância visual, não as coordenadas da conexão.

Paredes podem ser criadas, excluídas e redimensionadas por qualquer extremidade, mantendo a oposta fixa. M3.4 inclui continuidade/união colinear e translação da parede com dependentes, conforme PRD §15 e contratos de §16. Sem divisão de paredes ou edição/bloqueio de tijolos individuais. Ajustes construtivos ficam restritos a encontros, grauteamentos e canaletas. Novos projetos abrem diretamente no térreo com propriedades iniciais editáveis; outros pavimentos são adicionados sob demanda.

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

Vãos usam distância modular ao longo da face externa desde a extremidade de menor coordenada e largura do vão bruto. Ao redimensionar a parede, preservar a posição do vão na planta e recalcular essa distância; sinalizar os que não couberem. Alturas usarão o passo vertical e referência única do pavimento. O modelo nominal usa passo igual à altura-base, conforme CT-02 do [caderno técnico](Ecovit-Caderno-Tecnico.md), sem configuração adicional de junta. Essa convenção não comprova junta física nula nem passo instalado de qualquer fabricante.

Em M4.1, cada pavimento tem uma cota única, comum ao início de todas as suas paredes. Em M4.2, essa cota será também a face superior da laje. Cotas são múltiplas inteiras da altura-base, podem ser negativas e não podem coincidir entre pavimentos. O topo de cada parede é essa cota mais sua altura, sem limitação por lajes. A laje terá contorno e aberturas ortogonais simples na malha horizontal e espessura positiva armazenada somente nela; sua face superior será derivada da cota do próprio pavimento e a face inferior será essa cota menos a espessura. Alterar a espessura move somente a face inferior. Manter todas as validações existentes por pavimento isolado; não verificar colisão ou apoio entre andares nem acrescentar um verificador volumétrico de lajes. Incompatibilidades de altura de parede com fiadas continuam sujeitas à validação modular, sem arredondamento silencioso. A altura padrão do pavimento inicializa novas paredes; não substitui as alturas existentes. Não haverá entidade ou editor de telhados.

Pixels só existirão na câmera e no renderizador. Aplicar conversão tela/projeto antes de encaixar no grid. Zoom não modifica nenhuma dimensão física.

Paredes ortogonais são segmentos com espessura. O motor identifica sua rede de conexões e distribui peças no conjunto conectado. Não começar com biblioteca CAD, kernel 3D ou solver genérico.

## 7. Motor construtivo

Pipeline inicial:

1. Validar a dimensão-base e derivar o catálogo.
2. Construir a rede de paredes e seus encontros.
3. Aplicar escolhas de encontros da primeira fiada.
4. Distribuir peças ao longo de todas as fiadas.
5. Aplicar vãos e alturas das paredes; em M4, converter cotas locais pela cota única do pavimento, sem recorte por lajes.
6. Gerar a proposta de grauteamentos e elementos em canaletas.
7. Reconciliar ajustes manuais e verificar continuidade/colisões.
8. Produzir diagnósticos e quantitativos.

A ordem interna poderá ser ajustada às dependências do algoritmo; elementos estruturais que mudam peças exigirão nova composição da região afetada. Não tratar canaletas como apenas uma cor aplicada depois da geração.

Recalcular o projeto inteiro após cada alteração geométrica ou construtiva confirmada. Em M4.1, o mesmo fluxo inclui todos os pavimentos, com composição e validações locais independentes, sem detecção de interferências ou desalinhamentos entre andares e sem rastreamento de regiões pendentes. Alterações apenas de nome, seleção ou câmera não exigem geração.

Executar uma chamada síncrona do motor no fluxo principal, depois de exibir o estado de espera. Novas operações ficam indisponíveis até terminar; não enfileirar cliques para executá-los depois. Usar tratamento de erro que sempre libere os controles. Não haverá cancelamento ou progresso percentual durante essa chamada; uma espera de processamento é aceita nesta versão.

Não implementar Worker, fila de tarefas, resultados parciais ou atualização incremental inicialmente. Se o uso no aplicativo mostrar espera inaceitável, medir o gargalo antes de mudar essa decisão. A separação do motor em funções de dados permite uma evolução posterior sem antecipar sua infraestrutura.

Derivar somente o catálogo padrão e os procedimentos de preparação documentados, com seus limites de aplicação. Dimensões 2:1 não garantem solução universal nem correspondência com peças comerciais. Regiões não suportadas recebem “Sem solução automática”; peças especiais não são um recurso genérico para fechar qualquer lacuna. Ajustes de encontros, graute e canaletas incompatíveis ficam registrados como pendentes e não são aplicados até correção; não manter bloqueios de peças individuais.

A pesquisa construtiva e o Caderno técnico previstos no PRD continuam necessários antes dos algoritmos correspondentes. Esta arquitetura não inventa parâmetros de graute, apoios ou armaduras.

## 8. Estado e desfazer/refazer

Zustand manterá o documento atual, resultado gerado e estado de interface em partes separadas. Componentes assinarão somente os campos necessários. Estado de cursor e prévia não duplicará o documento persistente. [Documentação do Zustand](https://github.com/pmndrs/zustand).

Desfazer/refazer usa histórico limitado de estados do modelo editável, com compartilhamento das partes não alteradas por atualizações imutáveis. Não armazenar todas as peças geradas em cada passo do histórico. O limite é de 50 operações.

Cada gesto confirmado é uma operação; atualizações automáticas pertencem à mesma operação. Desfazer restaura entradas e escolhas e segue o mesmo fluxo sequencial de salvamento e recálculo. Reabrir arquivo não precisa restaurar o histórico da sessão anterior.

Não adicionar event sourcing ou persistência de cada movimento do mouse.

## 9. Persistência e arquivo .ecovit

O formato vigente é envelope versão 8/composição nominal-v9, conforme §19. Somente esse formato é aceito. Snapshots atuais são conferidos por recomputação completa antes de abrir; versões anteriores/futuras e adulteração são recusadas sem conversão. Em leitura bloqueada, o cálculo confere o snapshot, sem substituir ou atualizar o documento nem salvar. Registros locais incompatíveis permanecem identificados na lista, sem exclusão automática. A tabela abaixo registra a evolução histórica; não implica leitores antigos.

| Marco | Envelope | Convenção de composição |
|---|---|---|
| M1 | 1 | Sem composição |
| M2 | 2 | nominal-v1/v2/v3 |
| M3.1 | 3 | nominal-v4 |
| M3.2 | 4 | nominal-v5 |
| M3.3 | 5 | nominal-v6 |
| M3.4 | 6 | nominal-v7 |
| M3.5 | 7 | nominal-v8 |
| M4.1 (vigente) | 8 | nominal-v9 |

IndexedDB, via Dexie, armazena registros de projetos com id, updatedAt e documento completo; nome e demais metadados pertencem ao documento. A interface e o motor não dependem da representação interna do banco. Referência: [Dexie e IndexedDB](https://dexie.org/docs).

Salvar o documento inteiro em uma transação após cada alteração confirmada. Para alterações que exigem cálculo, salvar primeiro o modelo com resultado desatualizado e, após sucesso, salvar o documento com a nova composição. Aguardar cada escrita nesse fluxo único; não adicionar temporizadores, fila de salvamento ou persistência de movimentos do mouse. O indicador diferencia trabalho salvo, salvamento em andamento e falha, independentemente do estado do cálculo.

Falhas de quota ou indisponibilidade manterão o documento em memória e oferecerão download após a operação. O download sempre usa a memória atual, sem exigir salvamento local bem-sucedido. Para impedir sobrescrita por outra aba, usar um único bloqueio exclusivo por projeto durante a edição; a segunda aba informa que o projeto já está aberto e não permite editá-lo. Não implementar sincronização ou mesclagem entre abas.

### Estrutura do arquivo

JSON UTF-8 com extensão .ecovit:

- format: identificador ecovit.
- schemaVersion: 8 no contrato vigente de M4.1; contratos na seção 19.
- project: identificadores, nome, unidades e dimensões-base.
- model: pavimentos, paredes, vãos, lajes e referências verticais.
- adjustments: escolhas de encontros e ajustes de graute/canaletas.
- generated: resultado completo agrupado por pavimento ou null quando desatualizado.
- generationState: atualidade do resultado e diagnósticos.
- metadata: datas e versão do aplicativo que gravou o documento.

Não incluir nós Konva, funções, histórico inteiro ou dados de mouse. A versão do formato não é uma versão das regras construtivas.

Validar estrutura com Zod, relações entre identificadores e limites de quantidade/tamanho antes de substituir o projeto aberto. O limite de arquivo é de 50 MiB. Mensagens devem explicar a rejeição. A importação preserva o arquivo original; formato incompatível não é carregado parcialmente. [Zod](https://zod.dev/).

Na reabertura, conservar a composição salva. Regeneração posterior deve reconciliar escolhas e ajustes e mostrar incompatibilidades. Dados gerados são verificáveis e não dispensam validação.

Documento desatualizado contém resultado null e diagnósticos vazios. Com bloqueio exclusivo, recalcular automaticamente pelo mesmo fluxo; em somente leitura, conservar esse estado sem regenerar. Quantitativos pertencem a M5. Reabrir um documento atualizado preserva sua composição; a próxima alteração geométrica ou construtiva dispara o recálculo normal.

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

Operação local: `127.0.0.1:5173` é reservado ao solicitante, que inicia o servidor; o Codex somente fornece a orientação de início. Testes automatizados e verificações interativas do Codex usam `127.0.0.1:5174` e sessões isoladas. Playwright gerencia servidor próprio com porta estrita, sem reutilizar instâncias existentes. `dev:test` permite iniciar o servidor de verificações interativas. A origem dos projetos pessoais permanece 5173; esta separação não altera o bloqueio por projeto nem a atualização automática do servidor de desenvolvimento.

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

Os critérios de cada marco constam no plano. A pesquisa construtiva precede os algoritmos correspondentes; funcionalidades e desempenho são verificados no próprio aplicativo.

As referências oficiais fundamentam as escolhas de tecnologia. Evidências de testes e medições do aplicativo constam no plano, separadas por marco.

## 15. Contratos de M3 nominal

As seções 15–17 registram os contratos de dados dos marcos anteriores. Seus leitores, migrações e geradores antigos não integram M4.1; formato, persistência, resultado ausente e limites vigentes são os de §19. As regras nominais locais e operações construtivas permanecem, sem compatibilidade com arquivos anteriores.


M3.1 cobre vãos e seus padrões; M3.2 cobre canaletas e supressões; M3.3 cobre grautes nominais e ajustes. O contrato de M3.3 é arquivo versão 5/composição nominal-v6; o formato vigente de M4.1 consta nas seções 9/19. PRD §14, Plano §7 e CT-07–10 são referências; nenhuma exigência de física de cavidades, dimensionamento de apoio/armadura ou cadastro de fabricante.

### Dados persistentes

- Configuração de projeto: padrões de base/topo de vãos; lista de níveis globais de canaleta (cotas de topo relativas ao piso); quatro flags de graute e distância máxima. Identidade estável por nível, sem usar índice do array. Valores iniciais e efeitos são normativos no [PRD §14](Ecovit-PRD.md#padrões-normativos-de-m3).
- Vão: ID, wallId, tipo, distância desde menor coordenada, largura, base relativa ao piso e altura; orientação herdada, topo derivado. Redimensionar parede mantém posição mundial. Admitir offset negativo como rascunho pendente após edição indireta, sem aceitar referência órfã ou número inválido.
- Validação entre vãos: aplicar CT-07 e o recorte D3-02 desde M3.1; edição indireta incompatível preserva intenção com diagnóstico. Em M3.2, a fiada compartilhada de canaletas mantém múltiplas origens sem duplicar entidades geradas.
- Canaleta automática: origens semânticas (nível global, vão superior/inferior), parede/faixa de fiada e conjunto nominal de células, derivadas por CT-09. Unificar múltiplas origens numa ocupação. Peças geradas não são entidades editáveis individualmente.
- Graute: eixo de célula nominal com associações a paredes/origens; intervalos derivados da alvenaria menos vãos. Unificar mesma coordenada compartilhada sem multiplicar graute por parede. Canais/furos são símbolos, sem campos obrigatórios de diâmetro, aço ou apoio.
- Ajustes: inclusões/exclusões de eixos de graute e supressões de faixas de canaletas. Referências por coordenada/origem/parede/cota estáveis, nunca peça gerada/índice de array. Supressão cobre toda a parede na fiada selecionada, inclusive trechos descontínuos e origens coincidentes; não armazenar exclusão de tijolo individual.

Identificar supressão de faixa pela parede e cota absoluta escolhidas no momento da remoção, cobrindo toda sua faixa na fiada e todas as origens coincidentes. Usar a parede como alvo estável, sem congelar apenas o trecho clicado; extensão posterior da mesma parede continua abrangida pela supressão naquela cota. Mudar nível global remove a faixa antiga e gera uma faixa em outro lugar; a exclusão da cota antiga permanece, podendo voltar a valer se houver demanda lá novamente. Não deslocar exclusão silenciosamente. Para graute, guardar eixo em coordenadas mundiais e paredes relacionadas; estender/encurtar parede recalcula intervalos, sem mover o eixo. Reassociação ambígua após edição mantém ajuste não aplicado e localizável. Excluir origem arquitetônica remove dependências na mesma operação de histórico.

### Fluxo determinístico

Gerar ocupação de paredes → percurso/fase M2 → subtrair vãos → gerar demandas nominais de canaletas → unificar regiões e aplicar supressões → compor inteiro/meio/canaleta/meia conforme CT-08/09 → gerar candidatos de graute por configuração → derivar intervalos → aplicar inclusões/exclusões → validar geometria e emitir diagnósticos. Referenciar CT-10 para distribuição por malha; não completar lacuna deixada por supressão para tentar cumprir novamente a distância máxima.

Recomposição tipada e efeito geométrico das supressões seguem CT-09, sem um motor de preparação física. Configuração Aplicar e suas consequências são uma operação de histórico; salvar modelo/configuração/ajustes desatualizados → calcular inteiro → salvar resultado. Cancelar não grava. Restaurar padrões do grupo preserva ajustes, conforme PRD §14.

Disparos de cálculo por configuração seguem os efeitos definidos no PRD §14. Sem operação sobreposta, fila ou Worker. Nome/seleção/câmera/hover não calculam. Falha libera controles, preserva memória/modelo e identifica resultado antigo; download representa documento atual após término.

### Editor

Os controles e comportamentos visíveis seguem RF-04/06/07 e PRD §14; sua disponibilização por incremento segue Plano §7. O editor projeta o modelo e usa IDs estáveis para comandos, sem armazenar nós gráficos no documento.

Em ferramenta Graute na Fiada, hit testing por centro de célula/furo nominal da camada ativa, com tolerância em pixels ajustada ao zoom. Hover +/− é transitório; clique confirma uma alteração em todo eixo. Cor escura identifica presença. Canaletas também expõem seus eixos nominais para o mesmo gesto, sem pretensão de cavidade física. Bloquear ação durante processamento/somente leitura; distinguir navegação por botão central; fiada de referência não recebe ação. Oferecer rótulos e acionamento por teclado.

Renderizar canaletas e intervalos de graute a partir do resultado gerado da fiada ativa; seleção de faixa resolve parede/cota, sem transformar peça gerada em entidade editável. A ação “Editar na Planta” transporta seleção por ID e preserva câmera.

Hit testing de vãos na Planta pode retornar múltiplos IDs para o seletor contextual definido no PRD §14. Na Fiada, filtrar aberturas pela interseção vertical com a fiada ativa, conforme CT-07.

### Diagnósticos e integridade

Código estável, categoria, IDs, posição/faixa de fiadas, efeito e parâmetros de mensagem; interface deriva ações. Exemplos: opening-outside-wall, opening-off-grid, opening-overlap, opening-at-junction, channel-level-off-grid, adjustment-target-missing. Não emitir channel-support-unresolved ou grout-passage-unverified: essas verificações físicas estão fora do escopo. Remoção voluntária e ultrapassagem de d decorrente dela não são falhas. Conflitos geométricos continuam localizáveis conforme M2, sem apagar intenção arquitetônica.

O contrato de M3.2 usa envelope versão 4 e convenção nominal-v5, mantendo configurações de aberturas em `project.openingSettings` e vãos em `model.openings`. Níveis globais em `project.channelLevels: { id, top }[]`, com UUID estável e topo relativo ao piso. Supressões em `adjustments.channels: { id, wallId, top }[]`, com UUID e topo absoluto. Resultado `generated.channels` contém faixas `{ id, wallId, top, course, cells }`: identidade derivada de parede/cota, células mundiais com origens semânticas ordenadas. Peças adicionam tipos `channel`/`half-channel` e origens; estas são derivadas, não comandos persistentes de edição.

Compatibilidade dos arquivos de M3.2: validar versões 1/2/3 e snapshots nominal-v1–v4 pela convenção original antes de migrar em memória. Legados recebem níveis globais vazios: sua ativação exige adicionar níveis ou Restaurar padrões e Aplicar. As faixas locais imediatamente junto aos vãos existentes são automáticas por CT-09; a política de não acrescentar níveis globais não desativa essa composição local. Novos projetos recebem 112/224 cm, conforme PRD §14. A geração de graute pertence a M3.3.

M3.3 define `project.groutSettings: { junctions, openings, ends, intervals, distance }`, com quatro booleanos e distância inteira em 0,1 mm. Novos projetos recebem flags habilitadas/distância 10000; migrados recebem flags desligadas/distância 10000. Configuração de canaletas de arquivo versão 4 é preservada. Na migração de versões anteriores a 4, manter a inicialização sem níveis globais. A ativação de grautes legados é explícita por configuração, sem incluir automáticos na reabertura.

`adjustments.grout: { id, x, y, wallIds, action }[]`, com UUID estável, origem mundial inteira da célula nominal, paredes associadas e `include`/`exclude`. O centro exibido/atingido é derivado por x/y + m/2; não arredondar a identidade nem persistir coordenadas fracionárias quando m é ímpar em unidades de 0,1 mm. Identidade geométrica é a coordenada da célula, nunca índice de fiada ou ID de peça. Ajustes não ancoram a redistribuição automática. Exclusão prevalece sobre todas as origens do mesmo eixo; adicionar novamente conserva ID e passa a inclusão explícita. Descartar ajuste remove a intenção para permitir automação. Excluir parede retira sua associação; ajuste sem paredes remanescentes é eliminado na mesma operação de histórico. Eixo que perdeu alvenaria ou associação geométrica mantém ajuste pendente na coordenada original, sem mover para vizinho.

`generated.grouts: { id, x, y, wallIds, origins, intervals: { bottom, top }[] }[]`: identidade derivada da origem da célula, paredes/origens ordenadas, intervalos absolutos, ordenados e unidos quando contíguos. Alvenaria realmente composta define marcadores e intervalos, descontando aberturas e componentes sem solução. Origem automática identifica encontro, vão, ponta ou intervalo; manual identifica UUID do ajuste. Renderização e interação derivam os centros, incluindo células de canaletas. Uma célula compartilhada produz um eixo, sem duplicação por parede.

Processamento vigente: paginação M2 → validação/subtração M3.1 → demandas CT-09 → união por célula → supressão por parede/cota → tipagem de peças → marcadores/intervalos da alvenaria → candidatos CT-10 → ajustes de graute. Par misto divide em meios sem ampliar o alcance. Origem do nível usa UUID; origens locais usam UUID do vão e posição superior/inferior. Célula compartilhada suprimida prevalece sobre demandas de qualquer parede/origem. Mudanças indiretas fora da malha preservam níveis/ajustes com diagnóstico e sem aplicação; supressão sem demanda mas em cota válida fica dormente, sem erro. Supressão de canaleta não altera grautes. Exclusão de parede elimina ajustes dependentes na mesma operação desfazível.

A migração preserva geometria, IDs e escolhas. Sem vãos e com níveis globais vazios, a composição reproduz a geometria de nominal-v3. Aplicam-se as regras já definidas de bloqueio de edição e preservação do arquivo original. Representação na Fiada usa canal longitudinal esquemático; Planta mantém arquitetura. Seleção com múltiplas paredes oferece escolha contextual; referência adjacente permanece sem ação.

Migrar em memória e salvar somente com bloqueio de edição; nunca modificar arquivo original. Arquivo atualizado exige conferência de resultado pela própria convenção; adulterado/futuro é recusado antes de substituir aberto. Rascunho com pendência geométrica íntegra pode salvar/reabrir. Importação segue como cópia; limite 50 MB mantido. Revisar limites de vãos/faixas/eixos antes de alocar, sem truncamento.

A evolução de quantitativos permanece futura. Não deduzir volume de graute ou consumo de aço de símbolos sem dimensões. O envelope de M3.3 é v5/nominal-v6. A tabela IndexedDB armazena o documento inteiro; migrações ocorrem em memória e só são gravadas com bloqueio de edição. O aplicativo de M3.5 registrava appVersion 0.7.0; M4.1 registra 0.8.0. Resultado atual de versão 5 exige nominal-v6; versões 4/3 exigem nominal-v5/v4 antes da migração. Validar integralmente snapshots nominal-v1–v5 pela convenção original antes de adicionar configurações de graute e marcar resultado desatualizado. Leitura bloqueada mantém o resultado antigo identificado, sem gravação nem cálculo. Limites defensivos: mil vãos, 100 níveis, 10 mil supressões, 10 mil ajustes de graute, 20 mil eixos e 200 mil intervalos, além dos limites existentes e arquivo 50 MB; sem truncamento. Cálculo excedido preserva modelo e diagnostica o limite.

## 16. Contratos de M3.4 — Evolução da edição

Contrato implementado em M3.4; resultados e limitações no Plano §8. PRD §15 define os comportamentos; CT-11 define transformações e exemplos; Plano §8 define a entrega. A seção 15 define M3.1–3.3; os contratos desta seção tratam união/movimento, vínculos e supressões herdadas.

### Comandos e dependências

Operações de domínio recebem dados e retornam um documento candidato completo: criação com detecção de continuidade/união e translação de uma parede por delta modular com detecção de união no destino. Não importar bibliotecas de interface/persistência. Produzir o plano de união e a prévia a partir das mesmas regras de compatibilidade usadas na confirmação. Atualização de geometria, IDs associados e ajustes é atômica; manter mapa de IDs antigos para o sobrevivente durante a operação, sem criar serviço ou tabela de aliases persistentes. No movimento, transladar dependentes e desdobrar ajustes compartilhados antes de consolidar a cadeia; usar alcances de supressão já transladados para a herança. Não persistir, gerar ou registrar histórico do candidato intermediário.

Na união, preservar posições mundiais dos vãos e recalcular offsets; conservar IDs e remapear wallId. Para ajustes de graute, remapear wallIds e retirar associações duplicadas, sem alterar coordenadas. Para escolhas de encontros, remapear participantes e conferir identidade geométrica/fase no componente resultante; conservar a escolha se aplicável. Escolhas sem aplicação ficam pendentes e localizáveis, com retorno explícito ao automático/descarte. Não deduzir continuidade de fase só de um ID conservado nem copiar uma escolha para componente sem vínculo geométrico.

Na translação, atualizar extremidades e coordenadas dos ajustes exclusivos de graute; offsets de vãos permanecem iguais. Ajuste compartilhado é desdobrado conforme D34-02: original conserva ID e associações não movidas; cópia recebe novo UUID e só a parede movida. A criação do UUID ocorre uma vez na confirmação, nunca a cada frame; refazer recupera o mesmo UUID. Em v6, registros de intenção com IDs distintos podem coincidir na coordenada quando suas associações resultarem dessas transformações; não rejeitar apenas pela coincidência geométrica. Validar IDs únicos, paredes existentes e aplicação por associação; conservar registros coincidentes e aplicar precedência de exclusão de CT-10. O resultado gerado continua com um único eixo por coordenada. Verificar limites de quantidade e coordenadas antes da confirmação; operação que exceda limite não altera parcialmente o modelo. Escolhas de encontro não são dependentes transportáveis como os vãos: reconciliar com a topologia, mantendo intenções não aplicadas para revisão.

### Supressões e evolução de arquivo

M3.4 usa envelope versão 6 e composição nominal-v7, necessários para representar alcance herdado de supressão sem mudar retroativamente nominal-v6. A tabela IndexedDB permanece. Manter ajustes de canaleta com id/wallId/top e acrescentar escopo discriminado: `scope: { kind: "wall" }` ou `scope: { kind: "range", from, to }`. from/to são coordenadas longitudinais mundiais inteiras na face de referência, intervalo semiaberto alinhado à malha, com from < to. A orientação vem da parede; não adicionar edição de célula individual.

Supressão wall mantém o comportamento vigente: extensão/redimensionamento da mesma parede acompanha todo seu alcance. Na união, converter cada supressão wall das participantes em range correspondente à extensão da parede antes do gesto; range existente conserva seu alcance. Preservar IDs, cotas e todas as intenções, inclusive ajustes dormentes. A união não suprime o trecho novo. Ao mover parede, wall acompanha pela associação; range desloca from/to pelo componente longitudinal do delta. Interseção com alvenaria determina aplicação; alcance fora da parede fica preservado para diagnóstico, sem truncar a intenção persistida. Range não amplia ao estender a parede consolidada.

Novas remoções de faixa pela Fiada criam supressão wall. Supressões sobrepostas se aplicam pela união de células, sem duplicar peças; restaurar um ajuste não apaga os demais. Exibir parede/cota e, quando range, seus limites, permitindo restaurar o ajuste identificado. Compartilhamento de células mantém a precedência de CT-09, limitado ao alcance de cada supressão. Limite existente de supressões permanece e conta registros, sem unir IDs arbitrariamente para contorná-lo.

Migrar versões 1–5 após validação integral pela estrutura/convenção original, inclusive snapshot nominal-v6. Supressões antigas viram scope wall; preservar defaults/configurações, IDs e estados, sem consolidar paredes legadas automaticamente ou ativar categorias antes desligadas. Marcar resultado desatualizado para geração nominal-v7 somente no fluxo com bloqueio exclusivo. Documento atualizado v6 exige nominal-v7; migração não modifica arquivo original. Aplicativos sem suporte ao envelope v6 o rejeitam como versão não suportada. Contratos antigos de diagnóstico continuam verificáveis pelas convenções originais.

### Interface e fluxo

Acrescentar gesto de translação de parede à união de estados existente, com parede inicial, ponto de pega e delta modular; distinguir de movimento de vão, alças, criação e navegação. Prévia inclui dependentes e geometria da união; é descartável. Célula de hover usa o centro ativo do cursor e a mesma identificação de célula do gesto, em camada sem eventos. Tratar Escape, blur, mouseup fora e bloqueios.

Ao confirmar, registrar modelo/ajustes uma vez no histórico sem resultados gerados; executar salvar → calcular projeto inteiro → salvar, com tratamento de falhas existente. Não ampliar reconcileOpenings de modo a confundir translação explícita com redimensionamento: neste último preservar posição mundial dos vãos; na translação preservar offset e, se houver união, recalculá-lo para manter a posição mundial atingida. Cancelamento/hover não alteram metadados, histórico ou salvamento. Seleção após união aponta para sobrevivente; após movimento sem união mantém ID. Câmera permanece e controles não são exibidos como disponíveis antes da implementação.

### Integração dos comandos de edição

Contratos implementados de M3.4 para confirmação, prévia e preservação de intenções:

- **Vãos e commit:** o comando geométrico informa explicitamente seu tipo (`resize`, `move`, `create/merge`) e entrega dependentes já transformados quando move/merge. Nesse caso, commit valida o candidato e não executa a reconciliação antiga novamente. Redimensionamento mantém o caminho de preservação mundial existente; comandos de configuração/edição de vão não transladam dependentes. Não inferir o tipo por mudança de ID, comprimento ou dois endpoints. Remapear ajustes antes dos filtros de exclusão de paredes em store; esses filtros devem distinguir exclusão real de absorção por união, sem apagar dependentes remapeados.
- **Planejamento da prévia:** usar geometria/associações temporárias sem UUID persistente para desenho, cópia de graute ou migração. Materializar novos UUIDs apenas na confirmação ou migração definitiva. Prever efeito e contar cópias sem calcular todas as fiadas; usar a mesma regra na confirmação. Retornar ID selecionável sobrevivente com o resultado do comando, evitando escolher `preview.id` já absorvido. Limpar seleção de faixa/furo/componente inválida e prévias antigas; conservar câmera e fiada válida.
- **Supressões repetidas:** em v6, identidade é UUID, não par wallId/top. Aceitar vários ranges e um wall na mesma parede/cota; validar alcance inteiro/modular, IDs globalmente únicos e referência existente. Adicionar remoção completa só é no-op se já existir scope wall para a parede/cota; range existente não impede criar wall. Restaurar é por ID e exclui só esse registro. Não usar `restoreBand(wallId,top)` para trechos herdados. A conversão wall→range é exclusiva da consolidação de duas ou mais paredes existentes; extensão simples de uma parede mantém wall. Range parcialmente fora da parede aplica apenas interseção válida e diagnostica o restante; sem qualquer interseção, fica pendente, sem transferência de alvo. Range válido sem demanda de canaleta continua dormente, como wall.
- **Grautes coincidentes:** aplicar todos os include elegíveis antes de todos os exclude elegíveis; ordenar origens/diagnósticos por geometria e ID. Clique no eixo atualiza a ação dos registros elegíveis naquele eixo, preservando IDs/associações, e cria um ajuste com as associações da célula se nenhum for elegível. Registros sem associação/alvenaria aplicável ficam pendentes e não são apagados pelo clique. Verificar limites antes de adicionar. Preservar a interpretação original somente na validação das convenções legadas.

### Escolhas de encontros em v6

`adjustments.junctions` acrescenta UUID `id`, `anchor: { x, y }` em coordenadas mundiais e `binding: "active" | "pending"` aos campos atuais componentId/signature/wallIds/phase. A âncora localiza a intenção mesmo quando seu componente desaparecer; não é vínculo com nó ou peça. Todos os wallIds são remapeados para entidades existentes, sem duplicatas; escolha sem associações após exclusão real é removida. Ao excluir apenas parte das paredes de uma escolha, conservar as associações remanescentes como pending, com ID/âncora, em vez de apagar o registro inteiro. Descartar/retornar ao automático por ID afeta só a intenção escolhida; a ação global existente pode continuar como opção explicitamente global.

Nas operações novas, escolha pode continuar active ou ser revinculada somente se houver uma única correspondência do componente inteiro e a geometria de ocupação, alturas e percurso canônico de paginação permanecerem iguais, descontada apenas a substituição dos IDs/segmentação. Não basta copiar phase ou atualizar signature. Extensão, movimento que desconecta e união de componentes diferentes tornam a escolha afetada pending; componentes sem alteração preservam suas escolhas. Se várias escolhas disputarem a mesma correspondência, preservar todas como pending e pedir nova escolha, sem decidir pela ordem. Uma escolha pending não injeta phase no motor; em componente atual ainda associado, manter o tratamento de pendência de composição do M2 até resolver, sem bloquear componentes independentes. Sem componente associado, diagnóstico usa anchor e IDs remanescentes.

Migração de escolha antiga: primeiro validar snapshot/convenção original; atribuir UUID uma vez, preservar componentId/signature/wallIds/phase, obter âncora do componente validado correspondente ou, se ausente, da menor coordenada de bounds das paredes associadas. Classificar active apenas se assinatura e alternativa forem aplicáveis; caso contrário pending. Não revincular uma pendência antiga só porque os IDs coincidem. Manter campos novos fora dos schemas de versões 1–5; erros/duplicatas de dados antigos continuam recusados sob seus contratos originais.

### Convenções e compatibilidade do motor

Nominal-v7 inclui todos os estágios de nominal-v6 mais escopos de canaleta, intenções coincidentes de graute e vínculo explícito de encontros. Revisar todas as condições por convention em composition/channels/grout e validação, não apenas o enum ou o retorno final: continuousPattern, subtração de vãos, canaletas e grautes devem executar em v7. Congelar os comportamentos de v1–v6, incluindo sua identidade/ordem e esquema de saída, para conferir snapshots antigos antes de migrar. Gerar dados v7 com convenção velha não é forma válida de validar arquivo legado. v6 do envelope é distinta de nominal-v6 da composição; M3.4 usa v6/nominal-v7 e M3.3 usa v5/nominal-v6; o formato vigente de M3.5 é v7/nominal-v8.

Transformações indiretas preservam vãos mesmo quando a união causar separação/volume incompatível; usar validação estrutural do documento e diagnóstico geométrico, não `putOpening` de edição direta para bloquear ou apagar esses vãos. Checar soma de coordenadas, bounds, offset+width, alcances e quantidade de novos ajustes antes de alocar/confirmar; não salvar candidato parcialmente transformado. Arquivo íntegro com pendência geométrica é aceito; alcance não inteiro/modular, UUID duplicado ou referência órfã é recusado.

### Seleção inicial por célula

Criação usa funções de dados de drawing.ts: cursorCell identifica floor(x/m), floor(y/m), inclusive coordenadas negativas; openingCell limita a projeção à hospedeira e admite a última célula no limite final. O centro ativo do crosshair fornece clientX/clientY; não deslocar o hotspot nem manter um snap por proximidade que destaque outra célula. As fronteiras de células usam intervalos semiabertos, exceto a borda final da hospedeira, associada à última célula interior.

Gesto conserva célula escolhida e posição bruta de pressão. Depois de deslocamento de 3 px para distinguir clique de desenho, direção define início na borda inferior longitudinal para positivo e superior para negativo, cobrindo a célula inicial. Final segue encaixe modular por proximidade, com comprimento mínimo de um módulo. Em aberturas, direção vem do delta longitudinal desde a pressão, não da metade da célula onde está o mouse; deslocamento apenas perpendicular não cria abertura. Em paredes, orientação vem do delta predominante e a referência transversal considera side para que a espessura contenha a célula selecionada.

Alvos de conexão durante o arraste só são efetivados se respeitarem a faixa inicial e o ponto final modular; não deslocar o início para outro módulo ou alterar a espessura para satisfazer um alvo. Mostrar indicador de conexão somente quando coincidir com o fim efetivo. Para prolongar, escolher célula livre contígua à ponta. Movimento de parede/vão e redimensionamento continuam usando seus contratos anteriores; motor e convenção de arquivo não mudam por essa regra de interação.

### Orientação dos rótulos de aberturas

No renderer do canvas, identificar orientação pela parede hospedeira. Rótulo vertical usa rotação de −90° em coordenadas de tela e origem junto à extremidade inferior do openingBox, à esquerda, com fonte de 11 px e folga de 5 px entre texto e elemento. Horizontal continua acima. Usar métricas do texto para retângulos de colisão nas duas orientações; afastar em passos de 14 px para esquerda/cima preservando âncora longitudinal e evitando atravessar a borda correspondente do canvas. Aplicar igualmente a prévias e elementos confirmados. Painel transitório de medidas permanece horizontal. Rótulos são apresentação e não integram modelo, arquivo ou composição.

## 17. Contratos de M3.5 — Cruz nominal

**Estado:** implementado e aceito, com verificações no Plano §9. Produto em PRD §16, geometria em CT-12/EX-51–55. O motor nominal-v8 compõe a cruz suportada; os geradores nominal-v1–v7 mantêm sua interpretação de cruz bloqueada para validar arquivos antigos.

### Processamento e resultado

Nominal-v8 inclui todos os estágios de nominal-v7. Construir ocupação ativa por fiada antes de classificar encontros. Para cada fase, aplicar separação de contatos de T por CT-05 e de cruz por CT-12, sem eliminar células físicas. Separação muda conexões do percurso, não paredes/modelo. Verificar que reservas de continuidade/contato de encontros próximos não se contradizem; não resolver por ordem dos IDs. Paginar percursos/ciclos com os contratos existentes e conferir cobertura única das células e legalidade de cada inteiro/meio. Só depois subtrair vãos, tipar canaletas e gerar intervalos de graute.

A composição trata ramificações de quatro vizinhos pela separação de contatos de CT-12 antes da paginação. Identificação, fases, cobertura, alternativas, transições de altura, canaletas, grautes e validação de snapshots obedecem à convenção informada.

Componentes são os conjuntos conectados da geometria, incluindo contornos e divisórias. Cruz suportada deve compor todo o conjunto, não apenas recortar/desenhar um símbolo local. Preservar política de componente sem peças somente quando houver incompatibilidade real não resolvida, erro de geometria ou escolha pendente; componentes independentes permanecem calculados. Identificar encontros por ocupação por fiada, para suportar EX-54 sem recomeçar fase. Não persistir uma duplicação da topologia derivada nem transformar regiões separadas de paginação em paredes artificiais.

Alternativa usa a phase global e os contratos UUID/anchor/binding de M3.4; deve ser oferecida também ao conjunto com cruz sem depender da presença de um L, depois de validar suas fases. Prévia mostra todo o conjunto; cancelar não modifica documento. Fases/ajustes ativos ainda aplicáveis são preservados; pendências não se tornam ativas apenas pela migração para nominal-v8.

Manter união de células de canaleta, origens/supressões/alcances e associação de grautes com intervalo de alvenaria. O encontro em cruz produz um eixo nominal central quando a categoria estiver habilitada. Remover/restaurar canaleta ou graute não altera a classificação arquitetônica do encontro. Movimento/união/encurtamento e histórico continuam usando CT-11, sem deslocar ajustes para buscar um padrão.

### Formato e migração

Envelope versão 7 e nominal-v8 mantêm os dados de intenção de M3.4; sem controle de regra, parâmetro físico ou peça especial. Schemas/validação evoluídos explicitamente. Antes de migrar, validar snapshot inteiro nominal-v1–v7 pela convenção original, incluindo arquivos versão 6 cuja cruz tinha diagnóstico e componente vazio. Adulteração/futuro/órfãos continuam recusados; conservar algoritmo e representação legados, em vez de comparar resultado antigo com a nova composição.

Migrar em memória, conservar IDs, paredes/vãos, escolhas, níveis/categorias e ajustes; marcar resultado antigo desatualizado e recalcular pelo fluxo salvar modelo → calcular → salvar resultado, somente com bloqueio de edição. Informar que a nova convenção recompõe cruzes antes sem suporte. Categorias de graute desligadas e supressões continuam assim; configurações ativas passam a incidir na alvenaria agora composta. Não escrever no arquivo original, não recalcular/gravar em leitura bloqueada e não habilitar automáticos silenciosamente. Falhas preservam intenção, memória e controles recuperáveis.

### Diagnósticos e interação

Na convenção nominal-v8, implementada e aceita em M3.5 e preservada localmente em nominal-v9, a cruz suportada recebe composição e informação nominal por CT-12. Apenas nas convenções legadas nominal-v1–v7 a cruz permanece como limite de suporte, para validação dos snapshots antigos, sem constituir prova de erro de medida. Na convenção vigente, diagnóstico de erro exige motivo específico: reservas incompatíveis, percurso sem padrão, altura inválida, vão invadindo encontro ou ajuste pendente. Distinguir suporte, entrada, conflito geométrico, limite de processamento e exceção do motor; não classificar toda cruz como exceção de execução.

Mensagens mostram consequência no conjunto e N paredes distintas, com IDs/posição/fiadas corretos; localização realça o encontro e as paredes afetadas, com seleção/consulta na Planta/Fiada. Não usar somente “no M2” no texto operacional. Sem composição parcial apresentada como solução completa. Não criar erro estrutural para remoções voluntárias ou ausência de dimensões físicas.

## 18. Diretrizes iniciais de M4

Decisões de produto em RF-08/13; pavimentos implementados em M4.1 (§19), lajes e comparação visual previstos em M4.2/M4.3. M4 admite até quatro pavimentos, sem classificação de piso ou cobertura. Cada pavimento terá uma cota única especificada na criação, múltipla inteira da altura-base do tijolo, admitindo negativos e zero, sem cotas repetidas. Ordenar por cota crescente e derivar adjacência dessa ordem; editar cota pode alterar a ordem, sem trocar identidades ou referências. A composição e a numeração das fiadas serão locais a cada pavimento, começando em 1, com conversão para cotas globais por essa cota. Todas as suas paredes começam nela; bases de vãos e níveis de canaletas são relativos à mesma referência. Pavimentos compartilham origem horizontal, mas seus elementos e ajustes devem ser independentes.

Cada pavimento admite no máximo uma laje, pertencente a ele, com ou sem paredes. Sua face superior coincide com a cota do pavimento e não tem campo de cota editável independente; a espessura cresce para baixo. A laje não participa do recorte da alvenaria nem da determinação dos topos de paredes, encontros ou grautes. Contorno e aberturas afetam somente sua própria geometria. Usar vértices modulares, contornos ortogonais simples e aberturas estritamente internas, sem contato ou sobreposição entre si ou com a borda externa. Validar o candidato completo antes de confirmar; rejeitar edição inválida preservando o estado anterior, sem corrigir aberturas automaticamente. Exclusão de abertura preserva a laje; exclusão de laje remove suas aberturas e preserva paredes e ajustes. Uma laje acima das paredes é desenhada em outro pavimento na cota informada pelo usuário, que pode ficar sem paredes.

Conforme RF-07, gerar grautes separadamente por pavimento, aplicando o padrão configurado à geometria e aos limites verticais locais. Inclusões/exclusões individuais devem ter alcance restrito ao pavimento das paredes associadas. Associações de um mesmo ajuste não podem abranger paredes de pavimentos diferentes; coincidência de x/y não autoriza compartilhar, unificar ou aplicar ajustes entre andares. Identificação e agrupamento de eixos, aplicação de ajustes e diagnósticos devem considerar o pavimento, além da posição horizontal. Não haverá vínculos de continuidade de reforços entre andares. Os contratos vigentes de M4.1 estão na seção 19, sem migração de arquivos anteriores.

O topo de cada parede é a cota do seu pavimento mais sua altura. Não derivar limites efetivos por cobertura de laje nem propor atualizações de cotas de outros pavimentos após editar uma laje. Alterar a cota de um pavimento desloca seus elementos verticalmente, preservando alturas e medidas relativas. A transformação de ajustes persistidos em cotas absolutas deve acompanhar esse deslocamento na mesma operação de histórico; não alterar as cotas dos demais pavimentos.

Duplicação copia a intenção editável completa definida em RF-08, inclusive ajustes pendentes, atribui novos IDs e remapeia todas as referências internas. Exigir cota de destino válida, aplicar a diferença de cotas aos registros absolutos e preservar medidas relativas; recalcular resultados. Remoção elimina pavimento, elementos e ajustes em uma única operação desfazível; não remover o último nem modificar os demais. Seleção após remoção segue RF-08. Desfazer restaura identidades e relações.

Criar pavimento vazio inicializa a altura padrão conforme a criação do projeto, com edição e validação modular antes da confirmação, sem herdar outro andar; duplicação usa o padrão da origem. Troca de pavimento mantém a câmera, limpa a seleção e cancela gestos/prévias sem commit; lembrar a última fiada por pavimento durante a sessão. Sem paredes, Fiada mostra estado vazio, sem índice fictício ou controles de edição construtiva ativos.

Somente em Planta, renderizar uma referência de pavimento por vez, imediatamente inferior ou superior na ordem de cotas, escolhida pelo usuário. Exibir paredes, vãos e laje/aberturas em aparência atenuada com identificação do pavimento; a referência não participa de hit-testing ou edição. Não exibir essa camada em Fiada; conservar a referência de fiada adjacente do próprio pavimento. Não executar detecção de colisão, apoio ou interseção entre elementos de pavimentos distintos, nem gerar diagnósticos de desalinhamento/descontinuidade entre andares. Manter todas as validações existentes, inclusive colisões de composição, aplicadas separadamente a cada pavimento; o estado geométrico resulta dessas verificações locais. A laje mantém suas regras de contorno/aberturas, sem novo verificador volumétrico neste marco.

Desenho de laje/aberturas por vértices, com prévia ortogonal, fechamento explícito e cancelamento por Escape sem commit. Movimento da laje aplica uma única translação modular ao contorno e às suas aberturas, na mesma operação de histórico. Validar o candidato completo antes de confirmar. Alças/gestos de edição de bordas serão detalhados em M4.2.

M4.1 adota novo contrato de arquivo e armazenamento local com cota única, sem ler, migrar ou converter documentos de marcos anteriores. Identificar formato incompatível e informar a necessidade de criar novo projeto, sem executar geradores legados ou apagar automaticamente os dados antigos. Preservar o documento corrente em memória ao recusar importação. A implementação de M4 pode remover código de migração e geradores mantidos exclusivamente para compatibilidade anterior. M4.1 implementa envelope 8/nominal-v9 na seção 19, sem leitores ou conversores legados.

## 19. Contratos de M4.1 — Pavimentos

**Estado:** implementado; verificação do Codex e teste/aceite manual separados no Plano §10.1. Produto em RF-07/08/09/10/12; convenções e exemplos em Caderno §11.1/EX-56–64; tarefas e aceite em Plano §10.1. Envelope 8 e convenção nominal-v9 são os contratos vigentes do aplicativo 0.8.0. M4.1 não contém lajes, sobreposição visual entre pavimentos ou quantitativos.

### 19.1. Intenção persistida e referências

Manter o envelope de documento único (`format`, `schemaVersion`, `project`, `model`, `adjustments`, `generated`, `generationState`, `metadata`), com `schemaVersion: 8`. Usar inteiros em 0,1 mm e UUIDs únicos em todo o documento para entidades de intenção. Resultado derivado usa IDs determinísticos, sem UUID novo a cada geração.

| Registro | Contrato de M4.1 |
|---|---|
| `model.floors[]` | `{ id, name, level, defaultHeight }`; remover `start`. `level` é a única cota global do pavimento. Array com 1–4 registros, ordenado por `level` crescente, cotas distintas e `level % base.height === 0`. Nome aparado, 1–100 caracteres; nomes repetidos permitidos. `defaultHeight` positivo e modular. |
| `model.walls[]` | Manter `{ id, floorId, a, b, side, height }`. `floorId` obrigatório, referenciando pavimento existente. Coordenadas horizontais mundiais na malha; altura relativa à cota do pavimento. Não armazenar base/topo duplicados na parede. |
| `model.openings[]` | Manter vínculo por `wallId`, sem `floorId` redundante; proprietário derivado da parede. `base` e `height` são medidas relativas, com as validações locais existentes. |
| `model.slabs` | Array vazio obrigatório neste incremento; não aceitar registros de laje nem criar schema antecipado para M4.2. |
| `adjustments.junctions[]` | `id`, `floorId`, `anchor`, `binding`, `componentId`, `signature`, `wallIds`, `phase` obrigatórios; manter semântica de escolha ativa/pendente de M3.4/M3.5. Todas as paredes pertencem ao `floorId` declarado. |
| `adjustments.grout[]` | `{ id, floorId, x, y, wallIds, action }`; todas as paredes associadas pertencem ao mesmo pavimento. `x/y` continuam a origem inteira da célula nominal mundial, sem arredondar seu centro. |
| `adjustments.channels[]` | `{ id, floorId, wallId, top, scope }`; hospedeira do mesmo pavimento. `top` é cota global absoluta. `scope` obrigatório, `wall` ou `range`, com os mesmos alcances e regras de M3.4. |
| Referência inicial do projeto | `project.initialWallHeight`: altura modular positiva escolhida na criação, independente dos padrões editáveis dos pavimentos. Gravada em novos projetos e preservada no histórico/importação; criação de novo pavimento usa essa referência, duplicação usa o padrão do andar copiado. O campo pode estar ausente em documentos de M4.1 já salvos sem essa informação: sugerir 280 cm e exigir alternativa explícita se não modular; não inferir a referência perdida pela altura atual de outro pavimento. |
| Configurações do projeto | Manter `openingSettings`, `channelLevels` e `groutSettings` comuns ao projeto. Bases/topos de vãos e níveis de canaletas são relativos à cota de cada pavimento. IDs de níveis pertencem ao projeto e não são duplicados ao copiar pavimento. |

Referências órfãs, UUID duplicado, associação entre pavimentos e cotas não modulares/duplicadas são erros de integridade, recusados antes de substituir o documento corrente. Pendência geométrica válida continua salvável: vão que deixou de caber, altura de parede incompatível após alteração indireta ou ajuste com alvo geométrico perdido não se confundem com referência órfã. Preservar os contratos existentes para essas pendências. Não salvar registros parcialmente remapeados.

### 19.2. Coordenadas e composição

Para pavimento de cota `Z`, altura-base `h` e fiada local `n >= 1`, intervalo relativo `[(n−1)h, nh)` e global `[Z+(n−1)h, Z+nh)`. Parede ocupa `[Z,Z+H)`. Vão ocupa `[Z+base,Z+base+height)`. Nível comum de canaleta com topo `c` solicita a fiada `c/h` em cada pavimento, com topo global `Z+c`. Espessuras/juntas extras não são acrescentadas. Fase A/B depende do número local da fiada e da escolha do componente, nunca de `Z/h`.

Executar nominal-v9 por pavimento, com paginação e regras nominais de M3.5 preservadas. Selecionar apenas paredes, vãos e ajustes daquele pavimento antes de montar células, componentes, encontros, faixas e eixos. Não criar um mapa geométrico comum a todos os andares para depois tentar separá-los. Contexto de pavimento pode ser parâmetro de funções de domínio; não criar serviço, Worker, fila, biblioteca ou adaptação de arquivos antigos.

Resultado persistido: `generated: null | { convention: "nominal-v9", floors: FloorComposition[], diagnostics: Diagnostic[] }`. Cada `FloorComposition` contém `floorId`, `courses`, `components`, `channels`, `grouts` e `diagnostics`. Haverá um resultado por pavimento, na mesma ordem das cotas. `courses` usa número e `bottom/top` locais, a partir de zero; faixas de canaletas mantêm `top` global e `course` local; intervalos de graute mantêm `bottom/top` globais. Conversão para exibição não altera essas referências persistidas.

Identidade de componente, peça, faixa e eixo inclui `floorId` além da identidade geométrica/associações já usada. Resultado de outro pavimento não pode colidir por ter os mesmos `x/y`, número de fiada ou desenho. Escolhas, supressões e eixos coincidentes continuam com suas regras locais, inclusive precedência de exclusões, sem afetar outro andar. Não reiniciar fase dentro de um pavimento quando uma parede termina.

Diagnóstico local tem `floorId` obrigatório e fiadas locais, além dos IDs e localização existentes. Lista geral de diagnósticos é a concatenação determinística dos diagnósticos locais na ordem das cotas; não persistir contagens de validade independentes dessa lista. Não há diagnóstico de orçamento global de geração. Falhas de execução são informadas pelo estado da operação, sem inventar fiada ou alvo local. Qualquer erro local impede validade global, mas não elimina resultados de pavimentos ou componentes independentes. Pavimento vazio produz arrays vazios, sem fiada 1 artificial. Não verificar colisão, apoio ou alinhamento entre pavimentos.

### 19.3. Operações, isolamento e histórico

A reconciliação de escolhas considera somente alterações na geometria ou nas associações das paredes correspondentes. Recalcular o projeto inteiro não autoriza mudar vínculos de escolhas cuja geometria/associação permaneceu intacta, inclusive escolhas incompatíveis diagnosticadas. Criar ou duplicar pavimento preserva a intenção da origem e dos demais pavimentos.

Antes de reconstruir `componentId/signature` de uma escolha duplicada, conferir ambos contra as paredes associadas da origem. Se não corresponderem, a escolha da cópia terá `binding: pending`, conservando fase e âncora, até resolução explícita pelo usuário. O remapeamento não pode tornar aplicável uma escolha incompatível ainda marcada `active`. A origem permanece intacta; escolhas compatíveis continuam ativas e escolhas já pendentes continuam pendentes, sem cálculo adicional para essa conferência.

- **Criar:** candidato com nome, cota e altura padrão; iniciar vazio e selecionar após confirmar. Térreo inicial em `level=0`. Referência inicial de altura é 280 cm, modular para a altura usual de tijolo de 7 cm (40 fiadas), sem etapa adicional de compatibilização nesse caso. Somente para altura-base personalizada incompatível, aplicar as alternativas explícitas já previstas. Não usar propriedades do pavimento vizinho como padrão. Cancelar não gera ID persistido, histórico ou salvamento.
- **Editar:** cota válida mantém IDs e medidas relativas; transladar `top` absoluto das supressões pelo delta de cota, inclusive ajustes dormentes/pendentes. Ordenar pavimentos novamente. IDs, coordenadas horizontais, âncoras, escolhas e associações mantêm identidade. Altura padrão vale só para paredes futuras. Renomear é operação de histórico e salvamento, sem recálculo. Não reconciliar vínculos nem alterar intenção construtiva na renomeação, inclusive em documento válido com escolha incompatível diagnosticada; conservar o snapshot correspondente. Mudança confirmada de cota ou altura padrão segue o recálculo completo normal; valores inalterados não criam operação.
- **Duplicar:** validar cota, limite de pavimentos e integridade/limites estruturais dos registros antes de materializar a cópia, sem estimar orçamento de geração. Novo mapa de UUIDs para pavimento, paredes, vãos e ajustes, incluindo pendentes quando existirem; não exigir sua criação artificial para a duplicação. Remapear `floorId`, `wallId(s)`, IDs de vãos usados em referências, `componentId` e `signature`; estes últimos são reconstruídos com as novas associações, sem transportar IDs derivados da origem. Âncoras e alcances horizontais mantêm posição; supressões absolutas recebem delta de cota. Preservar `binding` pendente quando já existente, sem promover a ativo nem gerar nova pendência em uma cópia válida. Configurações comuns e seus IDs não mudam. Não copiar resultado gerado. Uma operação de histórico seguida de recálculo completo do projeto; selecionar a cópia.
- **Remover:** eliminar pavimento e intenção de sua propriedade, inclusive ajustes pendentes; impedir remoção do último. Preservar IDs/cotas dos restantes. Seleção segue RF-08; remoção de pavimento não ativo preserva o ativo. Desfazer/refazer recupera exatamente IDs, associações, cotas e pendências. Troca de pavimento por si só não cria histórico.
- **Editar arquitetura e ajustes:** criar, mover, redimensionar, unir, selecionar e diagnosticar somente no pavimento ativo; validações geométricas e reconciliação consideram a propriedade real dos elementos, não apenas o filtro do renderer. Configurações comuns recalculam todos os pavimentos sem apagar ajustes locais. União de paredes exige mesmo pavimento, como em M3.4.

Alterações geométricas ou construtivas confirmadas passam pelo fluxo único salvar intenção → recalcular projeto inteiro → salvar resultado, com bloqueio de novas mutações e um único bloqueio exclusivo por projeto entre abas. Renomeação salva e registra histórico sem invalidar o resultado nem disparar cálculo; troca de pavimento, seleção e câmera são transitórias e não salvam/historicizam o documento. Não mudar para processamento parcial por ter apenas um andar alterado. Histórico de até 50 operações guarda intenção, sem peças geradas; desfazer/refazer que altere composição usa o fluxo completo, enquanto desfazer/refazer apenas de nome não recalcula. Ao invalidar resultado em M4.1, usar `generated: null`, `status: "outdated"` e diagnósticos derivados vazios, evitando snapshots antigos com pavimentos/IDs já removidos. Falha do motor preserva intenção e estado desatualizado; falha de salvamento preserva memória e download conforme contratos gerais. Nenhum resultado parcial de execução é publicado se houver exceção; erros geométricos diagnosticados são resultados concluídos, não exceções.

### 19.4. Editor e sessão

Ao trocar pavimento, descartar também textos e alternativas numéricas ainda não confirmados nas propriedades. Rodapé e diagnósticos identificam o pavimento pelo nome atual. A lista de diagnósticos na Fiada apresenta os diagnósticos agregados do projeto: ao localizar um item, selecionar primeiro o proprietário e limitar a fiada ao resultado desse proprietário, como no painel geral.

Estado transitório com `activeFloorId` e última fiada válida por `floorId`, fora do arquivo/histórico. Na abertura selecionar o pavimento de menor cota em Planta. Criar/duplicar seleciona o novo e conserva o modo; se estiver em Fiada, nova visita inicia em 1 quando houver fiadas, mesmo que um componente esteja sem peças por diagnóstico. Lembrar a última fiada válida por pavimento durante a sessão; reduzir altura ajusta para a última existente e informa, conforme RF-04. Pavimento sem paredes mostra “Este pavimento não tem paredes” e desabilita navegação/ajustes, mas permite voltar à Planta e criar paredes. Com paredes e resultado ausente ou sem fiadas por falha de processamento ou incompatibilidade geométrica, mostrar o estado de cálculo/diagnóstico correspondente, sem afirmar que o pavimento não tem paredes.

Troca mantém câmera, limpa seleção, hover, prévia de encontro e gesto pendente, sem commit. Desfazer/refazer conserva o ativo se ele ainda existir; caso contrário, selecionar o de menor cota, limpando seleção e referências de UI órfãs. Localizar diagnóstico muda primeiro o pavimento, depois aplica o modo, seleção e enquadramento solicitados. Tentar trocar durante o fluxo ocupado não cancela a mutação em andamento; desabilitar o seletor até terminar. As ações Novo pavimento, Duplicar pavimento e Excluir pavimento na barra usam somente ícones Plus/Copy/Trash2 pelo componente central, classe iconButton, aria-label em português, title e data-tooltip por hover/focus-visible. Preservar os estados indisponíveis e a confirmação da exclusão. M4.1 não exibe ferramenta Laje nem controle de sobreposição entre andares. Iconografia e verificações de interface seguem §2.1.

### 19.5. Persistência, integridade e limites

Aceitar somente envelope 8 e resultados nominal-v9 em M4.1; recusar versões 1–7 e futuras sem carregar schemas/motores legados para conversão. IndexedDB mantém registros completos; lista identifica documentos incompatíveis por versão, permite informar que não podem ser abertos e criar novo projeto, sem executar cálculo nem apagar registros antigos automaticamente. Reutilizar tabela e bloqueio existentes se não houver necessidade concreta de mudança física do banco; não confundir schemaVersion do documento com versão do banco. Importação válida continua criando cópia com novo ID de projeto, preservando IDs internos do documento; importação inválida preserva memória, histórico e seleção do projeto aberto.

Documento com `status: "current"` exige resultado completo por pavimento, convenção correta e diagnóstico agregado idêntico ao recalculado deterministamente pelo motor nominal-v9; `generationState.diagnostics` deve ser igual a `generated.diagnostics`. Recusar snapshot adulterado, mesmo se a quantidade de peças coincidir. Documento `outdated` exige `generated: null` e diagnósticos derivados vazios; pode conter pendências geométricas íntegras. Validar estrutura e referências antes de substituir o documento corrente, sem estimativa de orçamento de geração. Leitura bloqueada por outra aba permite cálculo exclusivamente para conferir o snapshot, sem substituir o resultado ou atualizar/gravar o documento. Regenerar composição para atualizar o projeto exige bloqueio de edição; não regenerar documento desatualizado enquanto estiver em leitura bloqueada.

Transporte: `serializeFile` produz JSON compacto. Se o documento completo exceder 50 MiB por conter o resultado derivado, serializar `withoutResult(doc)` com toda a intenção, `generated: null` e diagnósticos vazios. Informar a reconstrução na abertura; não mudar a memória atual, seus ajustes ou resultado. Com bloqueio exclusivo, a abertura recompõe o projeto inteiro pelo fluxo normal. Resultado presente continua sujeito à verificação integral de snapshot; não ignorar adulteração. A intenção serializada sem resultado também deve caber em 50 MiB, verificada antes de confirmar mutações; esse é um limite de integridade/transporte da entrada, sem estimativa de peças ou bloqueio de geração. Arquivos JSON recebidos acima de 50 MiB continuam recusados; não introduzir compressão, biblioteca ou formato paralelo.

Não haverá controle de orçamento de geração em M4.1: remover estimativas `C_f*N_f` e tetos de geração por módulos, células, fiadas, peças, eixos ou intervalos derivados. Não recusar criação, cópia, cálculo ou reabertura pela quantidade estimada ou gerada, nem criar diagnóstico global de orçamento. Quantitativos continuam previstos em M5, para futura análise pelo usuário; não antecipar contadores ou telas nessa entrega.

Permanecem os limites de integridade/entrada: arquivo 50 MiB; 10 mil paredes, mil vãos, 100 níveis comuns, 10 mil escolhas de encontros, 10 mil supressões e 10 mil ajustes manuais de graute no projeto inteiro. Esses limites de registros de intenção não são estimativas de peças ou de custo de geração. Manter medidas representáveis e limites de coordenadas existentes (±100 milhões de unidades internas), validando também cotas globais derivadas e deltas antes de aplicar. Não truncar, descartar ajustes ou salvar candidato parcialmente transformado. Excesso dos limites estruturais/transformação recusa a operação sem mudar o documento. Falha real de execução preserva intenção e segue o estado desatualizado descrito acima; a retirada do orçamento não significa capacidade ilimitada ou garantia de tempo/memória.

Verificações de referência cobrem todas as bases e os limites de integridade acima; registrar carga observada no aplicativo, sem afirmar quatro pavimentos/100 mil peças testados por apenas existir especificação. Verificar a ausência dos antigos bloqueios de orçamento, sem transformar volumes altos em metas de teste obrigatórias. Não introduzir processamento incremental silenciosamente para cumprir metas futuras. Contratos de laje e de sobreposição permanecem nos incrementos próprios.
