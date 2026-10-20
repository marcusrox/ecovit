# Ecovit — Arquitetura Técnica

**Versão documental:** 1.35. Referência do software vigente: aplicativo 0.15.1, envelope 16 e composição nominal-v10. [Compatibilidade suportada](arquitetura/Persistencia-e-Compatibilidade.md#formato-e-leitores-vigentes).

## Responsabilidades da documentação

| Documento | Fonte de verdade |
|---|---|
| [PRD](Ecovit-PRD.md) | Comportamento do produto e limites de escopo |
| Arquitetura e seus assuntos | Representação em dados, módulos, algoritmos, interação, estado e persistência do software |
| [Caderno Técnico](Ecovit-Caderno-Tecnico.md) | Regras e convenções geométricas/construtivas, justificativas, fontes, exemplos independentes e limites de validade |
| [Plano e marcos](Ecovit-Plano-Implementacao.md) | Entregas, tarefas/IDs, verificações executadas, limitações e aceites |

Uma decisão de programação não estabelece uma regra construtiva. Antes de mudar o motor, consultar CT/EX do Caderno; antes de mudar comportamento, consultar RF do PRD. A arquitetura descreve como implementar esses contratos, sem repetir sua pesquisa ou tratar convenções nominais como comprovação física. Campos persistidos e códigos legados ainda aceitos conservam seus nomes; contratos/migrações abandonados ficam no histórico do Git e nos marcos.

## Assuntos

| Referência | Contratos principais |
|---|---|
| [Modelo e geometria](arquitetura/Modelo-e-Geometria.md) | Unidades, precisão, identidades e referências compartilhadas |
| [Elementos construtivos](arquitetura/Elementos-Construtivos.md) | Pavimentos, paredes, vãos, lajes e operações sobre seus dependentes |
| [Editor e interação](arquitetura/Editor-e-Interacao.md) | Planta/Fiada, câmera, seleção, gestos, camadas e comparação de pavimentos |
| [Estado, histórico e operações](arquitetura/Estado-Historico-e-Operacoes.md) | Intenção/resultado/sessão, atomicidade, histórico e critério único de recálculo |
| [Motor e diagnósticos](arquitetura/Motor-e-Diagnosticos.md) | Pipeline nominal-v10, pavimentos, ajustes, encontros, alturas e diagnósticos |
| [Persistência e compatibilidade](arquitetura/Persistencia-e-Compatibilidade.md) | Envelope, leitores 9–16, validação, armazenamento, transporte e bloqueios |
| [Medidas e imagens](arquitetura/Medidas-e-Imagens.md) | Medidas, referências raster, mobiliários, recursos, calibração e cache |
| [Interface e iconografia](arquitetura/Interface-e-Iconografia.md) | Lucide centralizado, acessibilidade, preferências, status e componentes comuns |
| [Quantitativos](arquitetura/Quantitativos.md) | Projeção das peças finais, perdas e consulta independente |
| [Qualidade e desempenho](arquitetura/Qualidade-e-Desempenho.md) | Estratégia de testes, observação de desempenho e limites de evolução |

## Aplicação e stack

Um único aplicativo web estático, executado no navegador, em JavaScript/TypeScript. Interface focada em computadores com mouse e teclado. O usuário acessa o site, trabalha localmente e salva projetos no navegador ou em arquivos .ecovit.

Não haverá backend, login, banco remoto ou serviço pago obrigatório na primeira versão. Não será criada uma prova de conceito separada: o desenvolvimento será feito diretamente no produto, com testes funcionais e de desempenho ao longo da implementação.

O aplicativo contém três responsabilidades principais: interface/editor, motor construtivo e persistência. São módulos do mesmo repositório, não aplicações ou serviços independentes.

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

## Organização do código

Um repositório, um pacote e um build. Estrutura implementada:

- src/app: tela de projetos, editor e propriedades.
- src/editor: canvas, modos Planta/Fiada, ferramentas, seleção e câmera.
- src/domain: tipos do projeto, geometria, operações de edição e motor de composição, canaletas e grautes.
- src/state: estado compartilhado e coordenação de comandos/resultados.
- src/persistence: IndexedDB e leitura/escrita estrita do formato .ecovit vigente.
- src/ui: iconografia e estilos comuns.
- tests: casos de domínio, arquivos de referência, persistência e fluxos de navegador.

A consulta de quantitativos é uma projeção de leitura do resultado confirmado. Não há diretório separado src/engine; o motor reside em src/domain.

Sem monorepo, injeção de dependências genérica, barramento de eventos global, arquitetura de plugins ou abstração de múltiplos renderizadores. Extrair uma função ou módulo quando houver responsabilidade concreta.

O domínio e o motor não importam React, Zustand, Konva ou Dexie. São funções TypeScript que recebem dados e retornam dados. Essa separação permitirá testar o cálculo sem abrir a interface e reaproveitar o modelo no futuro.

## Publicação e operação

1. Um gesto do mouse produz uma prévia transitória no editor. Operações exclusivas em medidas seguem o salvamento sem recálculo da §25; os passos de cálculo abaixo aplicam-se aos insumos construtivos.
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

Cada gesto confirmado é uma operação; atualizações automáticas pertencem à mesma operação. Desfazer restaura entradas e escolhas e segue o mesmo fluxo sequencial de salvamento, com recálculo apenas quando os insumos construtivos mudam; medidas seguem §25. Reabrir arquivo não precisa restaurar o histórico da sessão anterior.

Não adicionar event sourcing ou persistência de cada movimento do mouse.

## 9. Persistência e arquivo .ecovit

O formato vigente é envelope versão 11/composição nominal-v10, conforme §26, com leitura de envelopes 9/10 normalizados para imagens vazias; envelope 9 também recebe medidas vazias. Snapshots atuais são conferidos por recomputação completa antes de abrir; envelopes 1–8, versões desconhecidas e adulteração são recusados. Resultados nominal-v9 são descartados e atualizados pelo cálculo vigente, conforme §21; em somente leitura, atualizações ficam em memória, sem gravar o registro. Registros locais incompatíveis permanecem identificados na lista, sem exclusão automática. A tabela abaixo registra a evolução histórica; não implica outros leitores antigos.

| Marco | Envelope | Convenção de composição |
|---|---|---|
| M1 | 1 | Sem composição |
| M2 | 2 | nominal-v1/v2/v3 |
| M3.1 | 3 | nominal-v4 |
| M3.2 | 4 | nominal-v5 |
| M3.3 | 5 | nominal-v6 |
| M3.4 | 6 | nominal-v7 |
| M3.5 | 7 | nominal-v8 |
| M4.1 | 8 | nominal-v9 |
| M4.2 | 9 | nominal-v9 |
| Alturas diferentes/M5/M6 | 9 | nominal-v10 |
| M7 | 10, com leitura de 9 | nominal-v10 |
| M8 (vigente) | 11, com leitura de 9/10 | nominal-v10 |

IndexedDB, via Dexie, armazena registros de projetos com id, updatedAt e documento completo; nome e demais metadados pertencem ao documento. A interface e o motor não dependem da representação interna do banco. Referência: [Dexie e IndexedDB](https://dexie.org/docs).

Salvar o documento inteiro em uma transação após cada alteração confirmada. Para alterações que exigem cálculo, salvar primeiro o modelo com resultado desatualizado e, após sucesso, salvar o documento com a nova composição. Aguardar cada escrita nesse fluxo único; não adicionar temporizadores, fila de salvamento ou persistência de movimentos do mouse. O indicador diferencia trabalho salvo, salvamento em andamento e falha, independentemente do estado do cálculo.

Falhas de quota ou indisponibilidade manterão o documento em memória e oferecerão download após a operação. O download sempre usa a memória atual, sem exigir salvamento local bem-sucedido. Para impedir sobrescrita por outra aba, usar um único bloqueio exclusivo por projeto durante a edição; a segunda aba informa que o projeto já está aberto e não permite editá-lo. Não implementar sincronização ou mesclagem entre abas.

### Abertura pela lista de projetos

A lista chama `useStore.open(projectId)` diretamente, sem carregar/validar o documento na interface. O store verifica busy e ativa busy/openingProjectId sincronamente; antes de obter o bloqueio e chamar loadProject, aguarda requestAnimationFrame seguido de uma tarefa com setTimeout(0), permitindo a pintura do feedback. O registro é lido e validado uma vez, após tentar adquirir o bloqueio; preservar decode das referências, recomputação de integridade e atualização de resultados vigentes/desatualizados. O contrato `open(documento, true)` de criação/importação permanece validado; passar um documento sem fresh continua reabrindo seu registro por ID.

O cartão escolhido mostra seu nome e “Abrindo projeto…” com status acessível, substitui o pictograma pelo saving→LoaderCircle do componente central e mantém contraste durante disabled. O indicador gira, salvo movimento reduzido. `useLayoutEffect` aplica `data-opening-project` ao elemento html durante a operação, com cursor wait para a página e seus controles; cleanup remove o atributo, sem sobrescrever estilos de cursor anteriores. finally limpa busy/openingProjectId em sucesso ou erro. Não usar percentual fictício ou novo serviço/worker. Erros preservam o documento anterior e liberam o bloqueio candidato, exibindo a causa e permitindo nova tentativa. Esta alteração elimina a carga/validação duplicada da lista, não modifica a validação do formato nem promete animação fluida durante execução síncrona do motor.

### Visualização local por projeto

`src/editor/useProjectCamera.ts` mantém câmera e dimensões do canvas fora do documento. Preferência em `localStorage`, chave `ecovit:project-view:v1:<projectId>`, valor `{ centerX, centerY, scale }`: centro em coordenadas do desenho e escala em pixels por unidade interna. Aceitar somente números finitos e escala entre 0,0015 e 0,12; ausência/invalidez/erro de leitura usa câmera inicial. Restaurar o centro com as dimensões reais medidas por ResizeObserver; redimensionamento conserva centro e escala.

Gravar após zoom, Enquadrar, foco programático e redimensionamento; no deslocamento, somente ao terminar o gesto. Ao desmontar o canvas e em pagehide, guardar a câmera mais recente como proteção adicional. Sem temporizadores ou gravação de cada movimento do mouse. Esta escrita síncrona pequena é independente de saveProject, bloqueio do documento, updatedAt, histórico e cálculo; também se aplica em somente leitura. Erro de gravação é exibido na área de mensagens do canvas, conservando a navegação em memória. Uma preferência por projeto, sem chaves por pavimento/modo e sem transporte, migração de envelope ou sincronização entre abas; última gravação local prevalece.

### Estrutura do arquivo

JSON UTF-8 com extensão .ecovit:

- format: identificador ecovit.
- schemaVersion: 11 vigente em M8, com leitura de 9/10 conforme §26; versões 8/9 registram os contratos históricos das seções 19/20.
- project: identificadores, nome, unidades e dimensões-base.
- model: pavimentos, paredes, vãos, lajes, medidas independentes e referências verticais.
- adjustments: escolhas de encontros e ajustes de graute/canaletas.
- generated: resultado completo agrupado por pavimento ou null quando desatualizado.
- generationState: atualidade do resultado e diagnósticos.
- metadata: datas e versão do aplicativo que gravou o documento.

Não incluir nós Konva, funções, histórico inteiro ou dados de mouse. A versão do formato não é uma versão das regras construtivas.

Validar estrutura com Zod, relações entre identificadores e limites de quantidade/tamanho antes de substituir o projeto aberto. O limite de arquivo é de 50 MiB. Mensagens devem explicar a rejeição. A importação preserva o arquivo original; formato incompatível não é carregado parcialmente. [Zod](https://zod.dev/).

Na reabertura, conservar a composição salva. Regeneração posterior deve reconciliar escolhas e ajustes e mostrar incompatibilidades. Dados gerados são verificáveis e não dispensam validação.

Documento desatualizado contém resultado null e diagnósticos vazios. Com bloqueio exclusivo, recalcular automaticamente pelo mesmo fluxo; em somente leitura, conservar esse estado sem regenerar, salvo a atualização de cálculo descrita em §21. Quantitativos pertencem a M5. Reabrir um documento atualizado preserva sua composição; a próxima alteração geométrica ou construtiva dispara o recálculo normal.

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

## Manutenção

Cada contrato tem um assunto responsável; documentos de funcionalidades apontam para regras comuns de estado, persistência e interface. Alterações devem atualizar a fonte correspondente e seus links, sem duplicar versões de formato, critérios de recálculo ou limites de entrada. Aceites e resultados de execução permanecem nos marcos. Esta consolidação não altera código, formato suportado ou comportamento do aplicativo.

Reorganização conferida contra os tipos, schema e comparação de insumos do código vigente, com revisão de referências locais e fragmentos. Não representa execução de testes do aplicativo.
