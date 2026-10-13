# Ecovit — Plano incremental de implementação

**Data:** 10 de outubro de 2026  
**Atualização documental:** 13 de outubro de 2026\
**Base:** [PRD 0.14](Ecovit-PRD.md) e [Arquitetura 1.7](Ecovit-Arquitetura-Tecnica.md)\
**Estado:** M1, M2, M3.1, M3.2 e M3.3 aprovados pelo solicitante; M3.4 implementado e verificado pelo Codex, aguardando teste manual/aceite; relatório na seção 8. Relatórios e roteiros anteriores na seção 7. Os aceites atuais substituem pendências globais de aprovação nos relatos históricos, sem atribuir resultados individuais aos passos manuais.

**Endereço local padrão:** `http://127.0.0.1:5173/`, conforme o README. Referências a `localhost` nos relatórios históricos preservam a origem usada naquela ocasião. Projetos salvos em `localhost` permanecem naquela origem; para transferi-los, baixar `.ecovit` na origem antiga e carregar na origem escolhida.

## 1. Como usar este plano

Cada marco acrescenta uma funcionalidade testável ao aplicativo definitivo. M1 mantém sua especificação e relatório; M2 está detalhado na seção 5, M3.1–3.3 na seção 7 e M3.4 na seção 8. M significa Marco e é a única sigla usada para essas etapas. Subdivisões usam ponto: M3.1 (Vãos), M3.2 (Canaletas), M3.3 (Grauteamentos) e M3.4 (Evolução da edição no canvas). Preservar IDs existentes M3-T01/M3-A01; M3.4 usa IDs próprios M3.4-T01/M3.4-A01, sem renumerar entregas aceitas. RF, CT e EX continuam identificando requisitos, convenções técnicas e exemplos.

Requisitos e arquitetura descrevem o comportamento atualmente especificado, distinguindo o que está implementado. Cada evolução recebe escopo, critérios e relatório no incremento vigente; relatos/aceites anteriores registram a versão entregue e não são reescritos como se já contivessem as mudanças. Correções posteriores recebem registro relacionado aos IDs afetados. Novo feedback não amplia silenciosamente o incremento: ajustar seu escopo antes de implementar; depois do aceite, criar nova revisão/incremento quando pertinente.

Fluxo: especificar a entrega → implementar → verificar os critérios pertinentes → disponibilizar roteiro de teste → incorporar feedback. A pesquisa construtiva precede os algoritmos correspondentes e será registrada no caderno técnico, por assunto. Não haverá prova técnica ou aplicativo experimental separado.

O plano organiza a implementação parcial do PRD; um requisito atendido parcialmente não será marcado como integralmente concluído. M1 foi aprovada pelo solicitante e M2 foi posteriormente autorizada e implementada; resultados na seção 6. M3.1 foi autorizado e implementado; verificação e aceite manual são registrados separadamente na seção 7.

## 2. Sequência dos marcos

| Marco | Resultado disponível no aplicativo | Referências principais | Dependência | Estado |
|---|---|---|---|---|
| M1 — Planta editável e persistência | Criar projeto, desenhar/editar paredes, desfazer, salvar e transportar arquivo | RF-01/02/03/08/09/11/12, nos recortes abaixo | Nenhuma | Aprovada pelo solicitante em 10/10/2026 |
| M2 — Composição e inspeção de fiadas | Catálogo nominal, retas, L, retângulo, T básico, transição simples de alturas, inspeção e persistência; cruz apenas reconhecida e diagnosticada | RF-01/03/04/05/09/10, persistência RF-11/12 | M1 e definições P1–P5 do caderno | Aprovada em 12/10/2026; relatório na seção 6 |
| M3 — Vãos e elementos construtivos | Portas, janelas e vãos integrados à composição; canaletas e grauteamentos automáticos e ajustáveis | RF-04/06/07/09/10 | M2 e definições nominais CT-07–10 | M3.1/M3.2/M3.3 aprovados; aceite de M3.3 em 13/10/2026 |
| M3.4 — Evolução da edição no canvas | Continuidade/união de paredes, movimento com dependentes e destaque do módulo de início | RF-02/03/06/07/09/10/11/12, CT-11 | M3.3 aprovado e decisões D34-01/02 | Implementado; teste manual/aceite pendente; relatório na seção 8 |
| M4 — Lajes e múltiplos pavimentos | Lajes, limites verticais, até três pavimentos e verificação dos alinhamentos | RF-08/13 e propagação dos RF-04/05/07 | M3 e pesquisa de transições verticais | A detalhar |
| M5 — Consulta e conclusão da primeira versão | Quantitativos, duplicação de projetos e fechamento dos cenários restantes do PRD | RF-10/11/12 e cenários de aceite | M4 | A detalhar |

Persistência, integridade e verificações evoluem junto com cada entrega. M5 não adia correções ou testes das entregas anteriores. A ordem poderá ser ajustada por feedback, com registro neste plano.

## 3. M1 — Planta editável e persistência

### Objetivo observável

O usuário cria um projeto com um térreo, desenha quatro paredes ortogonais, altera o comprimento por qualquer extremidade, desfaz uma alteração e reabre o mesmo desenho pelo navegador ou pelo arquivo `.ecovit`.

O aplicativo desta entrega é um editor de geometria de paredes. Ainda não gera tijolos ou comprova fechamento construtivo dos encontros; não exibirá classificação “geometricamente válido”, fiadas ou quantitativos fictícios.

### Requisitos associados e alcance

| Referência | Incluído em M1 | Parte que permanece para depois |
|---|---|---|
| RF-01 | Dois tamanhos-base, dimensões personalizadas positivas 2:1, precisão de 0,1 mm, base única e imutável após criar o projeto | Catálogo de peças, furos e procedimentos de preparação |
| RF-02 | Desenho, seleção, exclusão, duas alças, comprimento numérico, prévia e encaixe pela face externa | Geração das peças nos encontros |
| RF-03 | Malha de meio tijolo, coordenadas precisas e alternativas para medidas horizontais incompatíveis | Compatibilização vertical e fechamento das fiadas |
| RF-08 | Térreo inicial, cota de piso, início da alvenaria e altura padrão editáveis | Adicionar/duplicar/remover pavimentos e comparar níveis |
| RF-09 | Edição simples, preservação do documento e operação sequencial | Recálculo da composição e reconciliação de ajustes construtivos |
| RF-11 | Download e carregamento do arquivo nativo | Quantitativos |
| RF-12 | Salvamento automático, reabertura, validação de arquivo e recuperação após falha de armazenamento | Persistência de elementos adicionados nas próximas entregas |
| PRD §8; Arquitetura §§5, 6, 8 e 9 | Canvas, atalhos, precisão, desfazer/refazer e integridade | Controles específicos das funcionalidades futuras |

### Comportamento e limites

- Tela simples para criar, nomear, listar e abrir projetos locais. Duplicação de projeto fica para M5.
- A criação pede nome e tamanho-base; abre diretamente o térreo. Propriedades verticais começam visíveis e editáveis, com valores iniciais apresentados como conveniência de desenho, sem parâmetro estrutural ou promessa de compatibilidade de fiadas. Registrar os valores adotados na implementação; não inferir junta nula.
- Planta usa Selecionar e Parede, zoom, deslocamento do canvas e enquadramento. Recursos futuros não aparecem como botões desabilitados.
- Paredes têm ID estável, duas extremidades da face externa na malha, lado da espessura e altura. A espessura equivale à largura-base. A prévia permite inverter o lado; redimensionar não troca a face de referência.
- Soltar um arraste confirma uma parede de no mínimo um módulo; Escape cancela. Perda de foco cancela o gesto, sem alteração parcial. Soltar fora do canvas encerra o gesto sem deixá-lo preso; a implementação deve adotar cancelamento nesse caso.
- Alvos de conexão alinham faces externas no canto em L e permitem encostar uma extremidade no meio de outra parede em T. São conexões geométricas: preservar IDs e deixar a composição de tijolos para M2. A seleção de faixas coincidentes deve permitir escolher a parede desejada.
- Redimensionar mantém orientação, face e extremidade oposta. Não permitir cruzar a extremidade fixa ou criar comprimento menor que um módulo. O campo de comprimento indica qual extremidade muda e oferece alternativas modulares antes da confirmação.
- Cada alteração confirmada é uma operação no histórico, inicialmente limitado a 50. Zoom, seleção e prévia não entram no histórico. Desfazer/refazer também salva o modelo resultante. Reabrir não restaura o histórico anterior.
- Salvar após cada alteração persistente confirmada, uma operação por vez. M1 ainda não executa motor: manter `generated` ausente/nulo e resultado desatualizado, sem simular cálculo ou fazer uma segunda gravação desnecessária. O fluxo completo de salvar/calcular/salvar começa em M2.
- Arquivo segue o envelope da arquitetura, com `format`, `schemaVersion`, `project`, `model`, `adjustments`, `generated`, `generationState` e `metadata`. Coleções ainda não implementadas ficam vazias. O esquema deve evoluir explicitamente, com migração quando necessária, para preservar arquivos produzidos em M1.
- Validar arquivo, tamanho máximo de 50 MB, relações e medidas antes de substituir o documento aberto. Rejeitar versões ou conteúdo ainda não suportados; não descartar entidades desconhecidas silenciosamente.
- Para M1, importar um arquivo cria uma cópia local com novo ID de projeto, preservando IDs dos elementos e suas relações internas. Assim, reimportar um backup não sobrescreve o projeto local existente. Esta é uma decisão operacional desta entrega.
- Bloqueio por projeto impede edição em duas abas. Se o armazenamento falhar, preservar a memória, informar o problema e permitir download do documento atual. Sem sincronização entre abas.

### Tarefas de implementação de M1

Tarefas executadas em M1; não são entregas separadas nem autorizam antecipar M2.

- [x] M1-T01: criar a base React/TypeScript/Vite com as dependências necessárias, scripts de validação e README para execução local; criar módulos somente quando usados.
- [x] M1-T02: definir os dados mínimos do projeto, térreo e paredes, conversões de unidades, validação modular e operações de edição independentes da interface.
- [x] M1-T03: implementar criação/abertura de projeto, canvas, malha, prévias, alvos de conexão, seleção e edição das paredes.
- [x] M1-T04: integrar histórico, atalhos, navegação e tratamento de cancelamento/perda de foco.
- [x] M1-T05: implementar salvamento local, bloqueio de segunda aba, formato nativo, validação de importação e download após falha de armazenamento.
- [x] M1-T06: executar verificações pertinentes, corrigir falhas e disponibilizar o aplicativo com instruções e roteiro abaixo; atualizar o andamento com evidências reais.

### Critérios de aceite

| ID | Resultado verificável |
|---|---|
| M1-A01 | Os dois tamanhos iniciais criam malhas de 12,5 cm e 15 cm. Um tamanho personalizado 28 × 14 × 7 cm cria módulo de 14 cm. Medidas não positivas, proporção inválida ou precisão não representável são recusadas com explicação. |
| M1-A02 | Criar um projeto abre o térreo, preserva nome e base e permite consultar/editar suas propriedades sem cadastrar outros pavimentos. |
| M1-A03 | Arrastes criam apenas paredes horizontais/verticais, com referência externa modular e espessura correta. Inverter o lado na prévia altera apenas o lado ocupado pela faixa. |
| M1-A04 | Um L alinha as faces no canto; um T encaixa no alvo indicado. Selecionar uma parede mantém seu ID e permite distinguir paredes na área compartilhada. Não há indicação de composição construtiva validada. |
| M1-A05 | Ambas as alças redimensionam mantendo a outra ponta e a face fixas. Comprimento numérico incompatível oferece alternativas sem alteração silenciosa. Cruzar a ponta fixa ou reduzir abaixo de um módulo não gera parede inválida. |
| M1-A06 | Excluir, desfazer e refazer restauram geometria e IDs. Cada arraste é uma única ação. Navegação não altera o documento; Delete e atalhos do canvas não interferem na digitação. |
| M1-A07 | Escape, perda de foco e soltura fora do canvas cancelam sem resíduos; o próximo desenho funciona normalmente. |
| M1-A08 | Após indicação de salvamento concluído, recarregar e reabrir preserva nome, base, pavimento, coordenadas, lados e alturas das paredes. |
| M1-A09 | Baixar e carregar em outro navegador preserva os dados de desenho e cria uma cópia local. O arquivo não contém nós Konva, histórico ou estado de mouse. |
| M1-A10 | Arquivo inválido, versão não suportada ou limite excedido é rejeitado sem substituir o trabalho aberto. Falha de armazenamento preserva a edição em memória e permite baixá-la. |
| M1-A11 | A segunda aba não pode editar o mesmo projeto enquanto a primeira mantém o bloqueio. Após fechar a primeira e reabrir na segunda, a edição pode continuar. |
| M1-A12 | Canvas ocupa a maior parte da tela; propriedades são contextuais, controles têm rótulos acessíveis e a edição funciona em Chrome e Edge desktop. Não há ferramentas futuras ou quantitativos inventados. |

### Verificações pelo Codex

Durante a implementação, criar e executar os comandos previstos no [AGENTS.md](../AGENTS.md): tipos, lint, testes pertinentes e build. Registrar os resultados, sem presumir que estão disponíveis hoje.

- Vitest: conversão exata de unidades, validação 2:1, encaixe, edição pelas duas extremidades, preservação de IDs no histórico e ida/volta do arquivo. Usar exemplos numéricos esperados independentes da saída da função testada.
- Playwright: um fluxo de criar/desenhar/editar/desfazer/salvar/reabrir, cancelamento de gesto, importação inválida e segunda aba. Simular falha de escrita no teste para verificar preservação da memória e download; não adicionar controle de falhas na interface do produto.
- Conferir os dados reabertos, além da aparência do canvas. A aceitação de transporte compara o conteúdo do modelo, desconsiderando o novo ID de projeto e metadados da cópia.
- Informar como abrir o aplicativo e quais verificações ficaram pendentes. Os testes manuais do solicitante permanecem separados.

### Roteiro de teste manual do solicitante

Pré-condição: implementação disponível, dependências instaladas e endereço local informado pelo Codex. Usar Chrome ou Edge desktop com mouse e teclado. Não é necessário executar este roteiro agora.

| Passo | Ação | Resultado esperado / aceite |
|---|---|---|
| 1 | Criar “Teste M1” com tijolo 25 × 12,5 × 7 cm. Consultar propriedades do térreo. | Térreo imediato, módulo de 12,5 cm, nome/base e propriedades visíveis — A01/A02. |
| 2 | Desenhar quatro paredes formando um retângulo de dimensões externas 400 × 300 cm, com espessura para dentro. | Comprimentos modulares e referências externas alinhadas; espessura 12,5 cm — A03/A04. |
| 3 | Criar uma parede que termine no meio de outra e selecionar cada uma na conexão. | Prévia de conexão em T; seleção permite distinguir as paredes — A04. |
| 4 | Em uma parede isolada de 200 cm, estender uma extremidade em 25 cm; depois a outra em 25 cm. | Comprimentos de 225 e 250 cm; a extremidade oposta fica fixa a cada operação — A05. |
| 5 | Informar 203 cm nessa parede; escolher uma das alternativas apresentadas, 200 ou 212,5 cm. Tentar reduzir abaixo de 12,5 cm. | Sem arredondamento silencioso; não confirmar parede menor que um módulo — A05. |
| 6 | Excluir a parede isolada; desfazer e refazer. Desfazer um redimensionamento completo. | Restauração correta; um gesto corresponde a uma ação — A06. |
| 7 | Iniciar um desenho e pressionar Escape. Repetir soltando fora do canvas e alternando de janela durante o gesto. Desenhar novamente. | Nenhuma parede residual ou ferramenta presa — A07. |
| 8 | Usar zoom e Espaço + arraste; digitar no nome do projeto e usar Delete no campo. | Geometria intacta; digitação não exclui paredes — A06/A12. |
| 9 | Aguardar “Salvo”, recarregar e abrir “Teste M1”. | Desenho, lado da espessura, medidas e propriedades preservados — A08. |
| 10 | Baixar `.ecovit`, abrir o outro navegador e carregar o arquivo. Reimportá-lo também no navegador original. | Mesmo desenho; importação como cópia, sem sobrescrever o original — A09. |
| 11 | Tentar carregar um arquivo de texto que não seja um projeto válido enquanto o desenho estiver aberto. | Erro compreensível e projeto atual intacto — A10. |
| 12 | Abrir o mesmo projeto local em duas abas. Fechar a primeira e reabrir na segunda. | Segunda aba inicialmente impedida de editar; edição liberada após encerrar a primeira — A11. |
| 13 | Criar projetos separados com base 30 × 15 × 7 e 28 × 14 × 7 cm; tentar também 28 × 15 × 7 e altura zero. | Módulos de 15 e 14 cm; entradas incompatíveis recusadas — A01. |

Falha de armazenamento, arquivo maior que o limite e versão futura serão cobertos pelas verificações automatizadas; não é necessário manipular o armazenamento do navegador para o teste manual comum. Registrar feedback por passo, resultado observado e resultado esperado.

### Conclusão e andamento

M1 estará pronta para teste do solicitante quando seus critérios tiverem evidências de verificação, o aplicativo abrir localmente e as instruções de execução estiverem disponíveis. A conclusão após teste manual será registrada somente com o retorno do solicitante. Uma pendência não deve ser escondida por marcar toda a entrega como concluída.

| Item | Estado atual |
|---|---|
| Especificação de M1 | Preparada nesta revisão |
| Implementação | M1 aprovada; M2 implementada (relatório na seção 6) |
| Comandos e testes automatizados | Implementados; resultados no relatório abaixo |
| Teste manual do solicitante | Aprovação global recebida em 10/10/2026; sem checklist individual informado |
| Próxima ação | Teste manual e aceite de M3.4 conforme seção 8; M4 depende de solicitação própria |

## 4. Relatório da implementação de M1 — 10/10/2026

### Resultado entregue

Aplicativo React/TypeScript com canvas Konva, geometria independente da interface, estado Zustand, IndexedDB via Dexie e arquivo validado com Zod. Inclui criação/listagem/abertura de projetos, dois tamanhos-base e dimensões personalizadas, térreo editável, paredes pela face externa, alças A/B, comprimento numérico com alternativas, exclusão, desfazer/refazer, salvamento automático e transporte por `.ecovit`.

O arquivo não contém composição gerada. O aplicativo identifica essa limitação e não oferece Fiada, vãos, lajes, grauteamentos ou quantitativos. Não houve implementação de M2.

### Evidências e verificações

| Verificação | Resultado |
|---|---|
| `npm run typecheck` | Passou, sem erros de TypeScript |
| `npm run lint` | Passou, sem erros ou avisos do ESLint |
| `npm test` | 14 testes passaram: 13 de domínio/arquivo/histórico e 1 de IndexedDB |
| `npm run test:e2e` | 10 testes passaram: os mesmos 5 fluxos executados em Chrome e Edge instalados |
| `npm run build` | Passou e gerou `dist/`; avisos não impeditivos descritos abaixo |
| Revisão visual pelo Codex | Capturas da tela de projetos e do editor inspecionadas em 1440 × 1000; sem sobreposição dos controles principais |
| Teste manual do solicitante | Aprovação global recebida em 10/10/2026: “Estou satisfeito com o M1”. Não foi informado resultado individual por passo |

Cobertura dos critérios: A01 combina testes de precisão/proporção e criação personalizada no navegador; A02, A03, A05 e A06 são exercitados pelos fluxos de desenho, redimensionamento por ambas as pontas, alternativas numéricas e histórico. A04 combina testes de conexão L/T e escolha de parede sobreposta. A07 cobre Escape, soltura fora do canvas e evento de perda de foco. A08/A09 comparam o modelo salvo e exportado, inclusive IDs de paredes, após reabertura e importação em perfil isolado. A10 cobre arquivo inválido/futuro e falha de escrita simulada, mantendo o download atual; limite de tamanho é verificado antes da leitura em teste unitário. A11 cobre bloqueio real de duas abas e reabertura após liberar o projeto. A12 recebeu revisão visual e execução dos fluxos em ambos os navegadores; a avaliação de conforto, compreensão e uso por teclado pelo solicitante permanece no roteiro manual. Não foi feita auditoria completa de acessibilidade.

Fontes dos testes: [domínio](../tests/domain.test.ts), [persistência](../tests/database.test.ts) e [fluxos do navegador](../tests/e2e/editor.spec.ts). Cada teste do navegador usa um perfil isolado. O transporte foi verificado em um novo perfil de cada navegador; o teste manual de transportar diretamente entre Chrome e Edge permanece no roteiro.

### Decisões concretizadas

- Piso e início da alvenaria começam em 0 cm, altura padrão em 280 cm. São valores editáveis de desenho, sem hipótese de junta ou recomendação estrutural.
- Arquivo versão 1, em unidades de 0,1 mm, conserva IDs de elementos. Importar cria outro ID de projeto e acrescenta “(cópia)” ao nome.
- Histórico de até 50 operações. Prévia, zoom e seleção não geram histórico ou salvamento; não há restauração do histórico entre sessões.
- Salvamento sequencial por alteração confirmada; não há Worker, fila, temporizador de autosave ou cálculo fictício. Falha mantém a memória e disponibiliza o download.
- Bloqueio exclusivo de edição por projeto com Web Locks. Chrome/Edge precisam acessar localhost ou HTTPS.
- Validação recusa conteúdo ainda não suportado, mais de 10 mil paredes, arquivo acima de 50 MB e coordenadas/medidas além de ±100 milhões de unidades internas. São limites defensivos de arquivo/renderização, não parâmetros construtivos.
- Node não estava no PATH. Foi usado o runtime do Codex e npm local em `.tools`, sem instalação global. `Start-Ecovit.ps1` facilita a execução nesta máquina; a instalação convencional continua sendo `npm ci`.

### Correções e limites observados

Corrigidos durante a verificação: restauração de campos numéricos após valor recusado, cancelamento de campo com Escape, identificação visual A/B das alças e exibição do alvo de conexão somente quando coincide com a extremidade ortogonal resultante. Um teste de seleção foi ajustado para clicar na área compartilhada, fora da alça, respeitando sua prioridade de interação. Os testes finais foram executados após essas correções.

O build informa um bundle JavaScript de aproximadamente 778 kB (242 kB gzip) e avisos sobre comentários de otimização da dependência Zod. A compilação funciona; não foi acrescentada divisão de bundles sem evidência de necessidade. A instalação também informou depreciação da versão 9 do ESLint, dependência de desenvolvimento; a ferramenta instalada executou sem erros. As versões exatas estão no lockfile.

A navegação não persiste zoom/posição entre sessões. Para iniciar uma nova parede exatamente sobre a alça de uma parede selecionada, limpe a seleção primeiro; alças têm prioridade conforme o PRD. O conforto desse gesto deve ser avaliado no seu teste. Ainda não foi medida a carga de 100 mil peças, pois M1 não gera peças.

### Como testar agora

Abra **http://127.0.0.1:5173/**. Se precisar reiniciar o servidor, execute `./Start-Ecovit.ps1` na raiz do projeto e mantenha o terminal aberto. O [README](../README.md) contém instalação, comandos e atalhos. O servidor é apenas local; não houve publicação externa.

**Estado de entrega: M1 aprovada pelo solicitante em 10/10/2026.** Evidência: “Estou satisfeito com o M1”. A aprovação registra sua aceitação global do aplicativo; não equivale a afirmar que todos os passos manuais foram executados individualmente. As evidências automatizadas acima pertencem à implementação de M1 e não foram reexecutadas nesta revisão documental. Essa aprovação não autoriza implementar M2 automaticamente.

## 5. M2 — Composição e inspeção de fiadas

### Objetivo e referência técnica

Gerar e inspecionar todas as fiadas nominais das paredes suportadas, alternar Planta/Fiada, comparar fiadas adjacentes e ajustar a fase de um encontro suportado na primeira fiada. Salvar e reabrir a composição, preservando o modelo quando houver pendências ou falha.

Fonte técnica desta entrega: [Caderno técnico](Ecovit-Caderno-Tecnico.md), revisão 3, decisões aprovadas 1–11, CT-01 a CT-06, exemplos EX-01 a EX-18, lacunas L1 a L5 e definições aprovadas P1–P5. Suas fontes F1–F7 estão vinculadas às afirmações pertinentes. O caderno é uma especificação de geometria nominal, não um projeto executivo.

**Escopo aprovado:** retas, L com ramos de no mínimo dois módulos, retângulos fechados, T com principal contínua e ramal encostado, transição simples L → reta, navegação e persistência. O T informa “Composição geométrica resolvida; ligação complementar necessária”, sem dimensionar ou desenhar reforços no M2. A composição automática da cruz foi excluída do primeiro M2 por aprovação explícita após pesquisa; reconhecer e diagnosticar. Encontros próximos dependem da compatibilidade dos padrões em todas as fases, sem distância universal arbitrária. RF-05 permanece parcial quanto aos casos excluídos.

As onze direções iniciais foram aprovadas pelo solicitante: “Acato tudo proposto como solução”. Trata-se de aprovação das decisões de produto e do encaminhamento da pesquisa, complementada pela aprovação posterior das propostas técnicas P1–P5 após pesquisa. Não autoriza implementar nesta revisão.

### Requisitos associados

| Requisito | Incluído em M2 | Permanece fora deste recorte |
|---|---|---|
| RF-01 | Inteiro/meio nominais, bases iniciais e personalizada 2:1, eixos de furos | Geometria física de furos/encaixes, canaletas e peças preparadas |
| RF-03 | Passo nominal explícito `p = h`, alturas compatíveis e alternativas | Passo de obra universal; transições com lajes |
| RF-04 | Fiada atual/total, anterior/próxima/direta, referência adjacente, legenda compacta, intervalos relativos ao piso | Graute, canaletas e aberturas |
| RF-05 | L, T nominal com aviso de ligação complementar, transição simples de alturas e alternativas compatíveis na fiada 1 | Composição automática da cruz e combinações fora dos padrões documentados |
| RF-09 | Regeneração automática após confirmação; desfazer/refazer modelo e ajustes | Edição de tijolos individuais continua fora do produto |
| RF-10 | Modulação, colisão, lacuna, encontro sem solução, alinhamento nominal e conflito de ajuste | Diagnósticos de elementos de M3/M4 |
| RF-11/12 | Composição e pendências no `.ecovit` e banco local; migração de M1 | Tela de quantitativos, duplicação e demais itens de M5 |

### Fluxo simples de uso

1. Criar/abrir projeto como em M1. Não acrescentar cadastro de fabricante, furos ou regras.
2. Confirmar edição: salvar modelo como desatualizado → gerar integralmente → salvar composição. Uma operação de cada vez; indicador de processamento e recuperação em falha.
3. Planta mantém faixas contínuas. Fiada mostra inteiro/meio, orientação e eixos nominais. Troca de modo conserva enquadramento; lembrar a última fiada durante a sessão, ajustando-a se o total diminuir.
4. Navegar sem recalcular. Referência sobreposta é opcional, anterior **ou** próxima, sem seleção e indisponível nos limites correspondentes.
5. Selecionar encontro suportado na fiada 1, comparar prévias e confirmar a alternativa. Se alterar a fase de outros cantos conectados for necessário para fechar o conjunto, mostrar esse alcance na prévia. Nas demais fiadas, oferecer acesso à primeira.
6. Problema geométrico aparece com localização e explicação; documento continua salvável/exportável. A Planta permanece completa; em Fiada, componente conectado sem solução fica sem peças e os componentes independentes resolvidos continuam visíveis. Resultado antigo permanece claramente identificado, sem aparentar pertencer ao modelo atual.

Não acrescentar Worker, fila, backend, solver genérico ou cálculo incremental. Continuar com um térreo e edição de paredes já existente. Sem vãos, lajes, graute, canaletas, peças especiais ou tela de quantitativos.

### Tarefas para implementação posterior

- [x] **M2-T00 — Definições técnicas:** propostas P1–P5 aprovadas e incorporadas, fontes F6/F7 e exemplos EX-13–18 acrescentados; cruz excluída explicitamente. Conclusão documental, sem implementação ou testes do aplicativo.
- [x] **M2-T01 — Contratos e dados:** catálogo nominal, convenções, resultado/diagnósticos e migração versão 1 → 2; fixtures derivados dos EX, sem alterar medidas antigas.
- [x] **M2-T02 — Motor mínimo:** retas, padrões documentados de L/anel/T básico, transição simples de alturas, reconhecimento e diagnóstico da cruz, classificação dos demais encontros e validação integral da cobertura. Determinismo por coordenadas; sem dependência da ordem de criação das paredes.
- [x] **M2-T03 — Ciclo de edição e persistência:** salvar/calcular/salvar, recuperação de falhas, ajustes e histórico, download/importação e reabertura fiel.
- [x] **M2-T04 — Inspeção no aplicativo:** Planta/Fiada, navegação, intervalos, referência adjacente, legenda, seleção e prévia dos encontros, localização dos diagnósticos.
- [x] **M2-T05 — Verificação e relatório:** executar verificações abaixo, corrigir problemas, disponibilizar teste local e registrar resultados reais, limitações e alcance efetivo do RF-05.

O T básico segue CT-05 e EX-10/13: uma solução geométrica basta, com aviso persistido de ligação complementar. EX-11 verifica exclusão da cruz. EX-14–18 cobrem paridade, transição de alturas e compatibilidade; não inventar alternativas nem dimensionamentos construtivos.

### Critérios de aceite do recorte especificado

| ID | Resultado verificável | Referência |
|---|---|---|
| M2-A01 | Três bases dos exemplos produzem inteiro/meio com envelopes e eixos nominais corretos; interface informa a convenção sem pedir configuração inicial | CT-01/02; EX-01/05/06 |
| M2-A02 | Retas alternam os padrões e reproduzem contagens/posições esperadas; desenho invertido e ordem de criação não mudam a composição | CT-04; EX-01/02 |
| M2-A03 | L simples e anel fecham todas as fiadas sem duplicar cantos, sobreposição, sobra ou lacuna; alternativa apresentada também passa nessas verificações | CT-03/05/06; EX-03/04 |
| M2-A04 | Casos fora do suporte e sobreposição colinear são localizados; Planta completa; componente conectado afetado sem peças em Fiada, sem validade fictícia; componentes independentes continuam inspecionáveis | EX-12; decisão 10; P1–P4 |
| M2-A05 | Alturas e intervalos seguem a convenção; paredes curtas terminam corretamente; valores incompatíveis oferecem alternativas sem mudança silenciosa, inclusive após migração | EX-07/08/09; L5 |
| M2-A06 | Navegação percorre fiadas reais, respeita extremos, preserva câmera e última fiada da sessão; referência adjacente não pode ser editada; navegar não dispara motor | RF-04 |
| M2-A07 | Encontro só é alterável na primeira fiada; prévia mostra alcance, confirmação propaga, desfazer/refazer restaura; ajuste incompatível gera conflito explícito | CT-05; RF-05/09 |
| M2-A08 | Cada edição confirmada executa sequência única; modelo é preservado em falha de cálculo/gravação; controles são liberados e estado de salvamento é verdadeiro | Caderno §6 |
| M2-A09 | Reabrir e transportar arquivo versão 2 preserva peças, escolhas e diagnósticos; versão 1 migra sem alterar o modelo; arquivo inconsistente é recusado sem substituir o aberto | RF-11/12 |
| M2-A10 | Atualização e pendências são distinguidas; erros impedem validade geométrica; eixos coincidentes não são apresentados como passagem física comprovada | CT-06; L1/L2 |
| M2-A11 | Chrome e Edge funcionam nos fluxos principais; limites de geração impedem alocação descontrolada e não truncam peças silenciosamente | Arquitetura; Caderno §6 |
| M2-A12 | T básico reproduz EX-10/13 nas fases A/B sem colisão/lacuna; principal contínua; aviso de ligação complementar visível e salvo, sem reforços fictícios | P2; CT-05; EX-10/13 |
| M2-A13 | L com alturas diferentes muda para reta, mantendo fase e escolha inicial; términos após A e B conferem com EX-15/16 | P5; EX-15/16 |
| M2-A14 | L pares/ímpares respeitam mínimo de dois módulos por ramo; encontros próximos só oferecem alternativas compatíveis em todas as fases, com prévia do alcance | P1/P4; EX-14/17/18 |
| M2-A15 | Cruz é reconhecida e diagnosticada, com componente sem composição; não é resolvida implicitamente como dois T nem considerada geometricamente válida | P3; EX-11 |

M2-A04 verifica casos não suportados e não substitui A12/A13. As definições e exemplos de A12–A15 partiram do caderno revisão 3 e receberam as revisões de paginação registradas na seção 6. M2 aprovada globalmente pelo solicitante em 12/10/2026; evidências e histórico na seção 6. O aceite global não atribui resultados individuais a passos de teste manual.

### Verificações pelo Codex na implementação

- Executar `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e` e `npm run build`, registrando resultados reais.
- Domínio: EX-01–18; rotações/reflexões e paridades do L; mesma planta com IDs/ordem/sentido de desenho diferentes; cobertura, colisão, eixos, avisos e preservação de fase. Comparar com resultados independentes do motor; EX-11/12/18 incluem recusas esperadas.
- Integridade: migração de fixture real da versão 1; ida/volta versão 2 com escolha manual e pendência; conteúdo gerado adulterado; falhas nas duas gravações e no motor; ajuste invalidado, exclusão e restauração por histórico.
- Navegador: editar → gerar → alternar modos → navegar → escolher encontro → desfazer → reabrir → transportar; fluxo com diagnóstico e recuperação após falha simulada, sem botão de falha no produto.
- Conferir renderização/seleção com fiada adjacente sobreposta. Registrar tempo e quantidade de peças de um cenário maior, com máquina/navegador usados; não transformar em prova técnica nem alegar a meta final de 100 mil peças/3 pavimentos sem medi-la. O limite defensivo adotado deve ser informado.
- Não executar testes do aplicativo apenas por esta alteração documental. Nesta preparação, revisar links, fórmulas, exemplos, rastreabilidade e coerência do escopo.

### Roteiro manual após implementação

Usar Chrome ou Edge desktop. O relatório da implementação informará endereço local e comando para iniciar. As contagens abaixo servem como oráculo de teste; não exigem uma tela de quantitativos.

| Passo | Ação | Resultado esperado / aceite |
|---|---|---|
| 1 | Criar base 25 × 12,5 × 7; desenhar parede isolada de 100 cm e definir altura 21 cm | Fiadas 1/2/3 com 4 inteiros; 3 inteiros + 2 meios; 4 inteiros — A01/A02 |
| 2 | Alternar Planta/Fiada; aplicar zoom; voltar aos modos; navegar por setas e número | Mesma câmera; intervalos 0–7, 7–14, 14–21 cm; extremos bloqueados — A05/A06 |
| 3 | Ativar anterior e depois próxima como referência; tentar selecionar sua peça | Só uma referência por vez; fantasma sem interação — A06 |
| 4 | Em projeto separado, construir o L de EX-03: dois ramos de 37,5 cm a partir da mesma origem, espessuras para dentro do L; altura 21 cm | 2 inteiros + 1 meio por fiada; canto alterna sem duplicação — A03 |
| 5 | Trocar alternativa desse L na fiada 1; desfazer/refazer; tentar alterar na fiada 2 | Prévia e propagação corretas; edição acima da primeira oferece retorno à fiada 1 — A07 |
| 6 | Construir retângulo externo 400 × 300 cm, espessuras para dentro, altura 21 cm | Anel fechado nas três fiadas; quatro cantos alternados; 54 inteiros por fiada — A03 |
| 7 | Base 25 × 12,5 × 7; criar T de EX-13: principal de 100 cm, ramal livre de 50 cm, altura 21 cm; criar sobreposição colinear em componente independente | T com 6 inteiros em A, 4 inteiros + 4 meios em B, aviso de ligação complementar; componente inválido sem peças e Planta completa — A04/A10/A12 |
| 8 | Em duas paredes isoladas, definir alturas 21 e 14 cm; tentar 20 cm. Depois usar piso 10 e início 12 cm | Parede curta ausente na terceira; opções 14/21 sem alteração antecipada; intervalos de EX-09 — A05 |
| 9 | Aguardar salvamento, recarregar, baixar `.ecovit` e importar no outro navegador | Composição, escolha do L e diagnósticos preservados; importação continua como cópia — A08/A09 |
| 10 | Abrir backup real de M1; conferir paredes, IDs por teste automatizado e dimensões pela interface | Modelo preservado; composição gerada nominalmente; altura incompatível permanece pendente — A05/A09 |
| 11 | Repetir parede de 8 módulos com bases 30 × 15 × 7 (120 cm) e 28 × 14 × 7 (112 cm) | Mesma distribuição do passo 1; malhas de 15 e 14 cm — A01/A02 |
| 12 | Usar L de EX-03; horizontal 21 cm e vertical 14 cm; depois reduzir vertical para 7 cm | Primeiro caso: terceira fiada reta A; segundo: segunda reta B e terceira A; um inteiro + um meio nas fiadas retas, posições de EX-15/16 — A13 |
| 13 | Trocar a fase do anel EX-17; criar U de EX-18 com três células na base e três em cada ramo incluindo cantos | Anel: prévia dos quatro cantos e composição fechada; U de sete células composto com três inteiros e um meio na ponta livre em ambas as fases, conforme nominal-v3 — A14 |
| 14 | Criar a cruz de EX-11 em componente independente do T | Cruz diagnosticada e componente sem peças; T continua visível e composto — A15 |

Falhas injetadas, arquivos adulterados, limites de memória e comparação completa de dados ficam nas verificações automatizadas. Registrar feedback manual por passo, observado e esperado; não presumir aprovação.

### Estado da preparação documental (histórico anterior à implementação)

| Item | Estado em 10/10/2026 |
|---|---|
| Aprovação M1 | Registrada, com manifestação explícita do solicitante |
| Caderno técnico | Revisão 3: propostas P1–P5 aprovadas após pesquisa; regras, fontes e exemplos incorporados |
| Plano de M2 | Detalhado somente para esta entrega |
| Implementação e testes de M2 | Não iniciados; nenhum resultado de execução alegado |
| Verificação documental | Links locais conferidos; cobertura dos dois padrões de L e dos 54 pares de cada fase do anel conferida por cálculo independente; testes do aplicativo não executados nesta revisão |
| Limites técnicos restantes | Ligação física do T não dimensionada; cruz excluída; casos fora do catálogo recebem diagnóstico; limitações L1–L5 preservadas |
| Próxima ação | Implementar M2 somente após solicitação; seguir as definições aprovadas e executar verificações, sem avançar para M3 |

Ao implementar, acrescentar relatório com funcionalidades efetivas, comandos/resultados, limitações, endereço local e pendências manuais. Não avançar para M3 sem solicitação.


## 6. Relatório de implementação de M2 — 11/10/2026

### Entrega disponível

Implementado o motor nominal de inteiro/meio para retas, L, anel retangular e T com principal contínua e ramal encostado. Inclui transição simples L → reta, reconhecimento de cruz, diagnósticos por componente/fiada e limites de geração. O T mantém informação de ligação complementar; a cruz permanece sem composição conforme decisão aprovada.

O modo Fiada mostra peças em tons de tijolo com contornos e eixos claros, seguindo a referência visual fornecida sem incorporar ferramentas de M3. Inclui anterior/próxima/número, altura relativa ao piso, referência adjacente tracejada sem interação e legenda recolhível. A câmera é preservada entre modos; a última fiada é lembrada durante a sessão. Seleção por canvas ou painel permite prévia/confirmar a fase do conjunto na primeira fiada, destacando todos os cantos afetados. Não existe edição de peças individuais.

Ciclo sequencial de salvar modelo desatualizado → gerar → salvar resultado. Falhas preservam a memória e liberam controles; download continua disponível. Arquivo versão 2 com migração explícita de versão 1, composição e escolhas persistidas e verificação de integridade na abertura. Desfazer/refazer conserva IDs e ajustes, sem guardar peças no histórico. Alturas novas incompatíveis oferecem opções; medidas antigas são preservadas com diagnóstico.

### Verificações reais

| Verificação | Resultado |
|---|---|
| `npm run typecheck` | Passou; também executado pelo build final |
| `npm run lint` | Passou sem avisos |
| `npm test` | 41 passaram: 13 de domínio de M1, 21 de composição, 6 de ciclo de geração/falhas e 1 de IndexedDB |
| `npm run test:e2e` | 20 passaram: 10 fluxos em cada navegador instalado, Chrome e Edge; inclui regressões de M1 e fluxos de M2 |
| `npm run build` | Passou; saída `dist/`, JS aproximadamente 796 kB / 249 kB gzip |
| Inspeção visual | Captura 1440 × 1000 inspecionada: anel, T, L curto, cruz diagnosticada, navegação e painel legíveis |
| Servidor local | Resposta HTTP 200 confirmada em `http://127.0.0.1:5173/` |
| Aceite do solicitante | Pendente; nenhum passo manual foi declarado executado pelo solicitante |

As execuções iniciais de teste/build foram bloqueadas pelo sandbox com EPERM; passaram ao executar localmente com permissão ampliada. Houve uma falha de navegador durante edição/formatação de arquivos servidos pelo Vite; a suíte completa foi repetida sem alterações simultâneas e os 20 fluxos passaram. Após essa suíte, o único ajuste de código foi limpar a mensagem antiga ao recuperar um salvamento: os 41 testes e o build foram reexecutados e passaram.

Os avisos não impeditivos do build são comentários de otimização da dependência Zod e bundle maior que 500 kB. Não foram introduzidos Worker, fila, backend, novas dependências ou divisão de pacotes para contornar avisos.

### Evidência por critérios

- **A01–A03/A14:** testes de bases 25/30/28, módulo com centro em meia unidade, paridades de L com ramos de 2–5 módulos e reflexões, retas pares/ímpares e anel com 54 inteiros por fiada; peças sem sobreposição. U sem padrão completo é recusado.
- **A04/A10/A15:** cruz, sobreposição colinear, alturas incompatíveis e limites diagnosticados; componentes independentes continuam compostos. Navegador verifica cruz ao lado de anel/T e o aviso de ligação complementar.
- **A05/A13:** intervalos relativos ao piso, alternativas 14/21 cm e términos de L após fases A/B. Altura incompatível antiga não é alterada na migração.
- **A06/A07:** troca de modos mantém câmera/última fiada; navegação mantém composição exportada; prévia não salva escolha até confirmação; edição acima da primeira orienta retorno; escolha, histórico e reabertura conferidos.
- **A08/A09:** duas gravações na ordem correta, falhas de primeira/segunda gravação e motor, tentativa de edição durante operação, recuperação, exclusão/restauração de ajuste; migração de envelope versão 1, transporte para perfil isolado e rejeição de composição adulterada. Fixtures compatíveis com M1 foram gerados para teste; não foram modificados projetos pessoais do solicitante.
- **A11/A12:** execução em Chrome/Edge, T com contagens de referência, limites defensivos e ensaio de carga abaixo. O roteiro manual continua necessário para avaliar conforto de uso.

Fontes: [composição](../tests/composition.test.ts), [estado e falhas](../tests/generation-state.test.ts), [fluxos M2](../tests/e2e/fiada.spec.ts), além dos testes anteriores. Capturas são geradas em `test-results/` (ignorado pelo Git).

### Carga e limites

Windows, Intel Core i5-1035G1, Node 24.19.0, Chrome/Edge instalados. Cenário: 100 paredes independentes de 20 módulos, altura 280 cm, 40 fiadas, **42.000 peças**. Uma execução por navegador mediu abertura da página, importação/migração, geração e salvamento: **1.435 ms no Chrome e 1.898 ms no Edge**. Não é benchmark isolado do motor nem garantia para outros computadores. Não foi medida a meta futura de 100 mil peças/3 pavimentos.

Limite defensivo anterior à geração: 20 mil módulos somados nas paredes, mil fiadas e 100 mil células estimadas no total vertical. O último valor conta células, não peças. Exceder produz diagnóstico e conserva o modelo; não há resultado truncado.

### Limitações e próximos passos

- Cruz e combinações de encontros sem padrão explícito não têm composição; o componente conectado fica sem peças em Fiada, com Planta preservada.
- Ligação física do T não é dimensionada. Furos são eixos nominais; não há verificação de passagem física, cálculo estrutural ou junta de fabricante.
- Transições de altura em T ou conjuntos com vários encontros são diagnosticadas; o suporte desta entrega cobre L simples → reta.
- Escolha incompatível após editar geometria é sinalizada; o painel permite retornar encontros ao automático. Exclusão de parede remove ajuste associado e desfazer o restaura.
- A abertura/importação valida o snapshot salvo contra uma recomputação determinística, sem substituí-lo silenciosamente. Isso pode acrescentar espera em documentos maiores.
- Sem vãos, lajes, graute, canaletas ou quantitativos. **M3 não iniciada.**

Para testar, abrir **http://127.0.0.1:5173/** e seguir o roteiro da seção 5. Se o servidor precisar ser reiniciado, executar `./Start-Ecovit.ps1` na raiz do projeto. O [README](../README.md) foi atualizado com o uso de Fiada e as limitações.

**Estado: M2 disponível para teste local; aceite manual pendente.**

### Correção após teste local — reabertura com diagnósticos (11/10/2026)

Corrigida a mensagem indevida “Composição salva inconsistente com o modelo.” ao reabrir projetos com diagnósticos, incluindo o aviso informativo de T e o encontro em cruz. A comparação utilizava JSON com ordens diferentes de propriedades entre o resultado do motor e o documento validado. Agora ambos passam pelo mesmo esquema antes da comparação; alterações reais em peças ou diagnósticos continuam sendo recusadas. Não há alteração das regras geométricas, migração ou limpeza dos projetos existentes.

Reprodução confirmada antes da correção: os dois novos testes de reabertura (T e cruz) falharam com a mensagem relatada. Após corrigir, **43 testes passaram**, incluindo IndexedDB, importação de arquivo e rejeição de diagnóstico adulterado. Os **20 testes de navegador passaram em Chrome/Edge**, com cobertura ampliada para sair/reabrir e recarregar/reabrir um projeto com T e cruz, conferindo o documento inteiro exportado. Lint e build (incluindo verificação de tipos) passaram; permanecem apenas os avisos de build já registrados. Servidor local respondeu HTTP 200 em `http://127.0.0.1:5173/`.

Para conferir no projeto pessoal: atualizar a página e abrir novamente o projeto já salvo. Os testes automatizados usaram documentos próprios, sem modificar o armazenamento pessoal do solicitante. Confirmação manual desta correção pendente; M3 não iniciada.

### Refinamento visual da página inicial — 11/10/2026

Estado anterior registrado no commit `66bf3db`, antes das alterações visuais. A pasta não possuía repositório; Git foi inicializado e o commit usou identidade local à execução `Codex <codex@localhost>`, sem alterar configuração global.

Página inicial reorganizada com cabeçalho e conteúdo alinhados, introdução compacta, cartão de criação verde profundo, lista com espaçamentos regulares e ícones de planta, nomes com quebra de linha e metadados com melhor contraste. Fundo areia com variação suave em verde, fonte de sistema e detalhe em Georgia no título, sem fonte remota ou dependência nova. Rolagem natural da página e composição em uma coluna nas larguras menores; formulário de criação ajustado à largura disponível. Diretriz visual registrada na seção 8 do PRD. Fluxos de criação, abertura e importação preservados; motor e persistência não foram alterados. M3 não iniciada.

Verificações do Codex:

- Lint passou; build com verificação de tipos passou. Permanecem os avisos já conhecidos de Zod e tamanho do bundle.
- Os 20 testes existentes de navegador passaram em Chrome e Edge, incluindo criação, reabertura, importação/exportação e fluxos do editor.
- Capturas do estado vazio, dois projetos e formulário inspecionadas em perfil isolado. Em 1359 × 636, conteúdo e orientação de backup cabem sem rolagem; em 390 × 844 não há transbordamento horizontal. Capturas em `.tools/home-*.png`, ignoradas pelo Git. Os projetos pessoais não foram alterados.
- Build e acesso ao servidor inicialmente bloqueados pelo sandbox; verificação concluída com execução autorizada fora dessa restrição. O roteiro auxiliar de captura teve seu seletor corrigido para incluir o botão “Criar projeto →”; nova execução passou.
- Testes unitários não repetidos nesta alteração de apresentação; os fluxos de navegador cobrem a integração. Após a suíte, removida somente uma regra antiga de espaçamento da página inicial; capturas e build repetidos.

Pendente do solicitante: atualizar `http://localhost:5173/` (mantendo a origem onde seus projetos já estão salvos), avaliar a aparência com os nomes reais e confirmar conforto de leitura e espaçamento. O aceite visual/manual permanece pendente. A adaptação estreita se limita à página inicial e ao formulário; o editor mantém o foco desktop.

### Composição de U aberto — 11/10/2026

Definição acordada: pontas livres e ausência de fechamento são situações normais de desenho. Não exigem correção da planta. O arquivo real do solicitante demonstrou recusa por ausência de padrão no motor, não por incompatibilidade modular. PRD, arquitetura, CT-05 e README atualizados; EX-19/20 acrescentados, EX-18 preservado como conflito da fase com reservas sobrepostas. Extensão nominal derivada das regras documentadas; sem nova regra física, peça especial ou escopo de M3.

Implementado padrão explícito de U com duas pernas paralelas no mesmo sentido, ponte com quatro ou mais células incluindo cantos e pernas com duas ou mais incluindo canto. A reserva os inteiros dos dois cantos na ponte; B os reserva nas pernas; os intervalos retos recebem inteiros/meios. Compatível com os ramais separados pelos T existentes. A alternativa inverte a fase de todo o conjunto. Não há exigência de fechamento, alteração das paredes ou solução parcial artificial.

Persistência: composição `nominal-v2`, envelope de arquivo ainda versão 2. O caminho `nominal-v1` permanece para validar snapshots antigos antes da migração. Após validar, a abertura recalcula pelo fluxo sequencial existente, preservando modelo/IDs/ajustes. Reabertura pelo IndexedDB e importação de arquivo cobertas; conteúdo adulterado continua recusado. Arquivo original em Downloads não foi modificado; cópia em `tests/fixtures/open-u-legacy.ecovit` serve como regressão.

Verificações do Codex:

- **51 testes passaram**: domínio, composição, falhas, integridade e IndexedDB. Incluem posições independentes de EX-19, comprimentos pares/ímpares, oito transformações por comprimento, cobertura exata de todas as 40 fiadas do arquivo real sem sobreposição, fases invertidas, ordem/sentido de desenho, migração e recusa de diagnóstico adulterado.
- **Lint e build com verificação de tipos passaram.** Permanecem somente os avisos conhecidos de Zod e bundle acima de 500 kB. A primeira execução de Vitest foi bloqueada por EPERM do sandbox; passou após execução autorizada fora dessa restrição.
- **Navegador:** 21 de 22 fluxos passaram na suíte inicial, incluindo o novo fluxo do projeto real nos dois navegadores. O teste anterior de liberar bloqueio após fechar outra aba falhou uma vez no Chrome (continuou somente leitura), mas passou no Edge e em três repetições isoladas no Chrome, sem mudanças no código. Causa dessa ocorrência isolada não confirmada; registrar se reaparecer.
- Fluxo novo em Chrome/Edge: importar snapshot real antigo, compor, confirmar fase B, navegar até fiada 40, baixar e recarregar/reabrir; documento exportado preservado integralmente após reabertura. Captura da fiada 40 inspecionada: todas as paredes com peças e apenas informação de ligação complementar dos T. Testes em perfis isolados.

Limitações mantidas: U com ponte de três células continua sem esse padrão completo (EX-18); não se afirma impossibilidade física. Caminhos arbitrários, cruz e alturas distintas em conjuntos com múltiplos encontros não foram adicionados. A informação de ligação complementar dos T permanece. Não houve reformulação da interface de diagnósticos nesta alteração.

**Pendente de teste manual do solicitante:** atualizar `http://localhost:5173/`, reabrir “Meu projeto FR”, entrar em Fiada e conferir primeira/segunda/última, prévia de alternativa e retorno à Planta. Esperado: 40 fiadas compostas, “Geometria nominal verificada”, sem a antiga pendência de combinação; medidas preservadas. Teste manual e aceite não presumidos.

### Revisão da paginação após feedback dos cantos — 11/10/2026

Substitui a definição do U descrita no relatório anterior. A reserva de inteiros na mesma direção nos dois cantos cobria a área, mas forçava meio tijolo no interior da parede. A convenção **nominal-v3** usa um único pareamento contínuo para percursos sem ramificações e ciclos após a separação dos ramais dos T. A orientação dos demais cantos segue a paridade do percurso; só o primeiro canto geométrico ancora a fase A horizontalmente para conservar a referência do L. B desloca os pares em uma célula. Meios ficam somente nas extremidades dos percursos, incluindo contatos dos ramais, quando necessários.

O projeto FR tem agora na primeira fase 16 inteiros horizontais até o canto direito, seguido de inteiro vertical ocupando o canto. O único meio dessa fiada fica na ponta inferior direita: 52 inteiros + 1 meio, sem alterar paredes. O U estreito de EX-18 passa a ser composto com cantos coordenados; não se mantém uma recusa causada pela antiga imposição de orientações iguais. EX-19 foi atualizado com posições independentes, e EX-20 registra o resultado real. Não há nova regra para ligação física dos T nem ampliação para cruz ou transições de altura em conjuntos múltiplos.

Documentação sincronizada: PRD, Caderno técnico revisão 4 (CT-05, EX-18/19/20), arquitetura e README. Retas, L e anel anteriores conservam seus critérios de contagem/alternância; caminhos com vários cantos e ciclos ortogonais não retangulares usam a mesma regra, sem caso especial por formato. A implementação antiga fica restrita à validação dos snapshots nominal-v1/v2.

Migração: conferir integralmente o snapshot com sua própria convenção; depois marcar desatualizado para recalcular e salvar como nominal-v3 pelo fluxo existente. Preservar modelo, IDs e escolhas. Snapshots antigos adulterados não são aceitos por migração. Fixtures v1 e v2 representam estados anteriores do projeto FR; o arquivo original do solicitante não foi modificado.

Validações de geometria: 55 testes passaram, incluindo EX-19 por posições esperadas, ausência de meios interiores em U com pontes de 3–7 módulos e oito transformações, sequência de cantos, ciclo não retangular, duas fases/40 fiadas do projeto real, ordem e sentido de desenho, migração v1/v2, adulteração e IndexedDB. Os dois testes que codificavam a antiga regra de U falharam na execução inicial e foram atualizados para os novos resultados independentes acordados (EX-18/19). Demais regressões passaram.

Aceite manual pendente: atualizar o aplicativo na mesma origem, reabrir “Meu projeto FR” e conferir primeira/segunda fiadas e alternativa. A fase A automática deve mostrar o canto direito ocupado pelo inteiro vertical; uma escolha de fase B já salva é preservada e apresenta a paginação inversa. O meio necessário permanece em ponta livre; não há promessa de eliminar todos os meios. A interface de diagnósticos não foi redesenhada.

Verificação final desta revisão: lint, typecheck e build passaram; permanecem avisos conhecidos de Zod e tamanho do bundle. A primeira rodada de navegador teve timeout no carregamento inicial do Chrome; o servidor respondeu HTTP 200 e o fluxo passou na rodada seguinte. A suíte ampliada executou 24 fluxos: 23 passaram, incluindo importar snapshots v1 e v2, conferir o único meio na ponta direita, alternar fase, chegar à fiada 40 e reabrir integralmente, em Chrome e Edge. O teste antigo de duas abas falhou no Edge por tentar reabrir antes da liberação assíncrona do Web Lock; o teste foi ajustado para aguardar a ausência do bloqueio via `navigator.locks.query()`, sem sleep fixo, desbloqueio forçado ou mudança no produto. Passou nas quatro repetições finais (duas por navegador). Não se alega uma rodada única de 24 aprovações; todos os fluxos foram verificados com essa correção específica.

Captura da primeira fiada migrada de v2 inspecionada: horizontal com inteiros e canto direito vertical, meio somente na ponta inferior direita. Evidência local em `.tools/pagination-v3.png` (ignorada pelo Git). Os 55 testes unitários passaram novamente após acrescentar a verificação de meios somente nas pontas em todas as transformações. `git diff --check` revisado. Aceite manual continua pendente.

### Editor compacto inspirado na referência TijoCAD — 11/10/2026

Aplicado no editor existente, preservando a identidade verde e a página inicial. Cabeçalho de 48 px com marca reduzida, nome e ações do arquivo; ferramentas e controles Planta/Fiada reunidos na faixa seguinte. Módulo e face externa transferidos para o rodapé compacto com térreo, contagem e estado da composição. Faixa permite quebra em larguras menores; controles mantêm nomes acessíveis, estados ativos e foco de teclado.

Painéis laterais de 224 px (208 px até 1000 px) com tipografia e espaçamento mais compactos. Propriedades continuam recolhíveis; inspeção de fiadas agora também pode ser recolhida/reaberta, liberando a largura do canvas. Legenda inicia recolhida, com conteúdo preservado. Não foram adicionados 3D, instalações, graute, junta, login ou ferramentas vistas somente na referência. Motor, projetos e persistência não foram alterados nesta entrega.

Verificação visual pelo Codex: perfis isolados, Planta/Fiada em 1359 × 636 e Fiada em 1024 × 768, painel aberto e recolhido. Canvas medido em 1135 × 522, começando em y=88 na tela maior; sem transbordamento horizontal em 1024 px. Conferido aumento de largura ao recolher inspeção e reabertura acessível. Capturas em `.tools/compact-*.png` (ignoradas pelo Git). PRD atualizado na organização dos controles. Lint e build com verificação de tipos passaram; permanecem avisos conhecidos de Zod e tamanho do bundle. Testes unitários não repetidos por se tratar de apresentação e recolhimento local do painel; integração verificada no navegador.

Pendente de teste manual do solicitante: atualizar o aplicativo, avaliar leitura na resolução e zoom usados, alternar Planta/Fiada e recolher/reabrir ambos os painéis. Editor continua focado em desktop; o mínimo de 800 px de largura foi preservado. Aprovação visual/manual não presumida.

Resultado final do navegador nesta alteração: **24 testes passaram em Chrome e Edge**, incluindo criação/edição, salvamento, bloqueio entre abas, importação/migração, navegação de fiadas, alternativa de encontros e reabertura. Nenhuma falha nessa execução.

### Navegação com botão do meio — 11/10/2026

Decisão de usabilidade registrada no PRD, seção 8 (organização dos controles), e no README: botão do meio pressionado + arraste é o gesto principal para deslocar o viewport; Espaço + botão esquerdo + arraste permanece como alternativa. Roda continua controlando zoom. Ambos funcionam em Planta/Fiada sem trocar a ferramenta nem editar paredes; navegação permanece permitida em somente leitura e bloqueada durante processamento.

Implementado em `src/editor/Canvas.tsx`: gesto guarda qual botão o iniciou; eventos de movimento/liberação na janela permitem continuar fora do canvas e encerrar ao soltar o botão correto. Soltar outro botão não confirma desenho nem encerra navegação; Espaço não interrompe arraste central. Perda de foco e Escape cancelam; perda do estado de botão pressionado também libera o gesto. Mão fechada durante navegação. Mousedown/auxclick central no canvas suprimem ação padrão do navegador. Um gesto em andamento não é substituído por outro botão. Orientação principal no canvas atualizada e alternativa disponível na dica de navegação.

Verificações: lint e build com tipos passaram, com os avisos conhecidos de Zod e tamanho de bundle. Novo fluxo de navegador confere deslocamento exato da câmera em Planta/Fiada, cursor, combinação de botões, liberação dentro/fora do canvas, perda de foco, alternativa Espaço, zoom pela roda e documento exportado integralmente inalterado. Testes unitários do motor não repetidos, pois geometria/persistência não foram alteradas.

Pendente do solicitante: atualizar a página e testar com seu mouse, incluindo arrastar além da borda do canvas e soltar. Teste físico/manual e aceite não presumidos. Nenhuma função futura foi adicionada.

Conclusão registrada em 12/10/2026: **26 testes de navegador passaram em Chrome e Edge**, incluindo o novo gesto com botão central, alternativa Espaço, saída do canvas, liberação de botões, perda de foco, zoom e preservação integral do projeto. Lint e build com tipos passaram. Aceite manual do solicitante permanece pendente.

### Aceite global de M2 — 12/10/2026

O solicitante declarou: **“O M2 está validado por mim.”** M2 aprovada, incluindo refinamentos até o commit `4ca4b82`. Substitui a pendência de aceite global nos registros históricos, sem atribuir resultados individuais a testes manuais. Limitações do motor permanecem documentadas. A solicitação de M3 autoriza neste momento apenas documentação.

## 7. M3 — Vãos, canaletas e grautes nominais

**Revisão:** 13/10/2026. **Estado:** M3.1, M3.2 e M3.3 aprovados pelo solicitante. O usuário confirmou desenho nominal, configurações de projeto, automação como ponto de partida e ajustes persistentes. PRD §20, Arquitetura §15 e Caderno revisão 9 CT-07–10/EX-21–35 são as referências. Os antigos bloqueios por apoios dimensionados e passagem física deixam de se aplicar. Aceites globais e relatórios ao final desta seção.

### Escopo e sequência

Desenhar portas, janelas e vãos; gerar canaletas por níveis e junto a todos os tipos de aberturas; gerar graute pelas categorias escolhidas e intervalo configurado; permitir inclusão/remoção nominal preservada. M3 não calcula estrutura, cargas, armaduras, grampos, apoios resistentes ou dimensões internas de furos/canais. Desenhos são o objetivo atual; quantitativos evoluem posteriormente. Lajes/múltiplos pavimentos seguem em M4; quantitativos em M5. Cruz e transições de altura ainda não suportadas não entram automaticamente em M3.

| Incremento | Entrega | Dependências reais |
|---|---|---|
| M3.1 | Vãos, configuração do projeto para padrões de aberturas, composição nominal, diagnósticos e persistência | CT-07/08, padrões e recorte D3-02 confirmados; implementação autorizada em 12/10/2026 |
| M3.2 | Lista de níveis globais, canaletas automáticas superiores/inferiores, representação e remoção em Fiada | M3.1, CT-09, largura do vão + um módulo por lado e remoção da parede/fiada inteira confirmados; não depende de cálculo de apoio |
| M3.3 | Categorias e distância de graute, geração por malha, clique +/− e preservação de ajustes | M3.1/M3.2, CT-10, quatro seletores inicialmente habilitados |

Cada incremento entra no aplicativo real e recebe testes; não criar protótipo. M3.1/M3.2 estão aprovados. M3.3 autorizado e implementado em 13/10/2026. Não incluir lajes, múltiplos pavimentos ou quantitativos nesta entrega.

### Referências de implementação por incremento

O [PRD §20](Ecovit-PRD.md#20-definições-de-m3-após-retorno-do-solicitante--12102026) define configurações, valores iniciais, interação e alcance dos ajustes. As fórmulas, limites geométricos e exemplos estão no [Caderno §8](Ecovit-Caderno-Tecnico.md#8-m3-nominal-pesquisa-e-definições--12102026); os contratos de dados, identidade dos ajustes e migração estão na [Arquitetura §15](Ecovit-Arquitetura-Tecnica.md#15-contratos-de-m3-nominal--12102026).

- **M3.1 — Vãos:** implementar os controles de aberturas e seu grupo de configurações, incluindo seleção de empilhados na Planta; aplicar CT-07/08 e D3-02. A separação vertical já é validada, embora canaletas/grautes ainda não estejam disponíveis. Verificar M3-A01–06 e os critérios transversais pertinentes.
- **M3.2 — Canaletas:** disponibilizar níveis e faixas automáticas, representação na Fiada e supressão/restauração conforme PRD §20 e CT-09. Verificar M3-A07/11/12, incluindo fiada compartilhada entre vãos empilhados.
- **M3.3 — Grautes:** disponibilizar categorias, distância, geração e clique +/− conforme PRD §20 e CT-10. Verificar M3-A13/14, preservação dos ajustes e integração com vãos/canaletas.
- **Todos os incrementos:** expor somente controles implementados; aplicar os contratos sequenciais e de persistência da arquitetura, preservando cancelamentos, histórico, memória e download após falhas. Verificar M3-A08–10/15/16 conforme o alcance disponível.

Diagnósticos devem cumprir RF-10 e os contratos da Arquitetura §15; verificar que a interface diferencia resultado desatualizado/falhou de pendência geométrica, oferece localização e não acrescenta verificações físicas excluídas do recorte.


### Critérios de aceite

| ID | Resultado verificável |
|---|---|
| M3-A01 | Inserir três tipos por arraste, valores iniciais visíveis e símbolos distintos; cancelamentos não deixam alterações. |
| M3-A02 | Mover/alças/campos mantêm malha, IDs e parede; um gesto é uma operação. |
| M3-A03 | Base/topo respeitam piso/início/h; defaults incompatíveis oferecem alternativas sem arredondamento silencioso — EX-24/29/31. |
| M3-A04 | Fiadas e contagens seguem EX-21–23; fase preservada, peças não invadem abertura. |
| M3-A05 | Sobreposição de volumes e contato lateral sem módulo recusados; empilhamento com coincidência horizontal parcial/total aceito com uma fiada intermediária, contato vertical recusado; seleção na Planta distingue tipo/base/topo; encontro invadido localizado; sem apoio mínimo inventado — EX-26/27. |
| M3-A06 | Redimensionar parede preserva posição do vão pendente — EX-25. Excluir um vão preserva a parede e as demais aberturas; desfazer restaura o mesmo ID e suas propriedades. Excluir uma parede remove seus dependentes na mesma operação, também desfazível, restaurando dependências e ajustes. |
| M3-A07 | Planta/Fiada preservam câmera; canaleta só aparece em Fiada e tem canal representativo; referência não recebe cliques. |
| M3-A08 | Lista diferencia entrada, conflito geométrico, limite e falha; não gera pendência estrutural ou por supressão voluntária. |
| M3-A09 | Migrar/reabrir/transportar conserva configuração, geometria, ajustes e pendências; snapshot adulterado recusado — EX-30. |
| M3-A10 | Aplicar configuração/edição salva modelo → calcula inteiro → salva resultado; falhas preservam trabalho e liberam controles. |
| M3-A11 | Faixas locais cobrem largura do vão + um módulo de cada lado; níveis/fiadas corretos, primeira fiada sem inferior, coincidências sem duplicação; fiada entre vãos empilhados compartilha canaletas superior/inferior e conserva ambas as origens; contagens de EX-26/28/31 conferem. |
| M3-A12 | Remover canaleta realça toda a parede na fiada, incluindo trechos separados; devolve tijolos comuns, preserva outras fiadas e persiste apesar de múltiplas origens — EX-35. |
| M3-A13 | Quatro categorias independentes; padrão 100 cm; passos 90/98 cm para m=15/14; sem validação física — EX-32/34. |
| M3-A14 | Hover +/− e clique afetam eixo completo; cor escura, vazios sem alvo; remoção não é compensada pelo motor — EX-22/32/33. |
| M3-A15 | Chrome/Edge, bases padrão/personalizada, rotações, referências e limites defensivos; regressões M2 preservadas onde novos elementos estejam desativados. |
| M3-A16 | Novos projetos recebem os valores da tabela normativa do PRD §20; Aplicar/Cancelar/restaurar, persistência e histórico corretos; defaults não alteram vãos existentes; recálculo preserva ajustes. |

### Recorte de verificação de M3.1

Executar integralmente M3-A01–06. Nos critérios compartilhados, verificar:

- **M3-A07:** preservação da câmera entre Planta/Fiada e referência sem interação.
- **M3-A08:** diagnósticos de vãos, distinção entre pendência geométrica e falha de processamento, sem alertas estruturais.
- **M3-A09:** migração, reabertura e transporte de vãos, configurações de aberturas, escolhas de encontros e pendências; rejeição de snapshots adulterados.
- **M3-A10:** fluxo salvar/calcular/salvar e preservação do trabalho após falhas.
- **M3-A15:** Chrome/Edge, bases padrão e personalizada, rotações, limites defensivos e regressões de M2.
- **M3-A16:** padrões de aberturas, Aplicar/Cancelar/Restaurar, persistência e histórico; alteração dos padrões não modifica vãos existentes.

M3-A11–14 e as partes de A07–10/15/16 relacionadas a canaletas e grautes permanecem para os incrementos correspondentes. Registrar o resultado por parte verificada, sem declarar critérios compartilhados integralmente concluídos antes de sua cobertura completa. M3.1 não inclui dimensões de esquadrias ou folgas de instalação; os campos representam o vão bruto.

### Verificações e roteiro manual futuros

Executar tipos, lint, domínio/persistência, e2e pertinentes e build durante implementação. Domínio verifica CT-07–10 e EX-21–35 por posições/contagens independentes, união de células, níveis, intervalos e determinismo por ordem/sentido/IDs. Não criar testes de dimensão física ou carga. Ensaiar migração, arquivo adulterado, rascunho inválido geometricamente mas íntegro, falhas em ambas as gravações/motor e segunda aba. Medir cenário com vãos/canaletas/grautes no aplicativo, sem alegar desempenho de três pavimentos.

| Passo | Ação manual futura | Esperado |
|---|---|---|
| 1 | Configurar padrões, cancelar; repetir e aplicar; reabrir | Cancelar preserva; aplicar persiste; uma operação desfazível — A03/09/10/16. |
| 2 | Parede 400×280 com base 25; porta EX-21 e janela EX-22 em projetos separados | Conferir fiadas 1/14/15/30/31/40 e paginação — A01–04. |
| 3 | Mover/alças/campos, cancelar, encurtar parede, localizar conflito e desfazer | Nenhum deslocamento/exclusão silencioso — A02/05/06/08. |
| 3a | Inserir vãos empilhados de EX-26; selecionar ambos na Planta, inspecionar fiadas 15/16/17; tentar contato vertical e sobreposição | Seleção identifica tipo/base/topo; fiada 16 preservada e canaletas compartilhadas em M3.2 sem duplicação; entradas incompatíveis recusadas — A04/05/11. |
| 4 | Configurar faixas; inspecionar 16/32 para os padrões confirmados; inserir porta elevada | Faixas corretas, porta na base sem inferior, elevada com inferior, sem duplicar — A07/11. |
| 5 | Remover faixa coincidente de EX-35; recalcular; reabrir; restaurar | Tijolos comuns, supressão preservada e restauração explícita — A12. |
| 6 | Habilitar categorias de graute separadamente; conferir EX-32 e outras bases | Seletores independentes; máximo respeitado pela proposta inicial — A13/16. |
| 7 | Clicar + na fiada 10 do eixo EX-33; inspecionar fiada 20; clicar − na 35 | Dois intervalos criados; vazio não clicável; ambos removidos — A14. |
| 8 | Remover graute intermediário; mudar configuração e vão; desfazer/reabrir/exportar/importar | Sem reposição compensatória; ajustes/configuração preservados — A09/14/16. |

Nenhum passo foi executado nesta revisão documental; aceite manual de M3 permanece futuro.

### Decisões confirmadas

| ID | Estado |
|---|---|
| D3-01 | Alcance nominal confirmado. Sequência M3.1/M3.2/M3.3 mantida como organização de trabalho; M3.1 autorizado em 12/10/2026, sem antecipar os demais incrementos. |
| D3-02 | Confirmado em 12/10/2026: proibir sobreposição de volumes; vãos lado a lado com alturas sobrepostas exigem um módulo horizontal; empilhados são permitidos com coincidência horizontal parcial/total e uma fiada completa intermediária, que pode compartilhar canaletas superior/inferior. Sem união automática ou validação estrutural. Substitui a proposta anterior que excluía empilhamento. |
| D3-03 | Substituída proposta de preenchimento obrigatório inicial por configurações de padrões; valores confirmados na tabela normativa do PRD §20, verificados por M3-A16. |
| D3-04 | Confirmado: não verificar dimensões físicas nem dimensionar estrutura. Bloqueios físicos L2/L6/L8 retirados de M3 nominal. |
| D3-05 | Confirmadas configurações e interação de graute do PRD §20, com distribuição por CT-10; padrões verificados por M3-A13/A16 e gesto por M3-A14. |
| D3-06 | Confirmadas faixas globais e automáticas acima/abaixo de todos os vãos. Confirmado pelo solicitante: faixas locais com largura do vão + meio tijolo de cada lado; remoção de toda a faixa da parede na fiada. |

As três perguntas sobre alcance horizontal, remoção e padrões receberam resposta explícita e foram incorporadas em 12/10/2026. D3-02 foi posteriormente confirmado com permissão de empilhamento e fiada compartilhada. Essas confirmações e o pedido de registro são documentais, sem autorização de programação. A extensão de meio tijolo por lado é uma regra nominal de desenho escolhida pelo solicitante.

### Relatório documental

Atualizados os quatro documentos, sem código, dependências ou testes do aplicativo. Removidas exigências físicas incompatíveis com o novo alcance; incluídos configuração, convenção de distribuição nominal, visualização/click +/−, supressões, exemplos e critérios A11–A16 revisados. Verificação documental concluída: links locais válidos; EX-31 conferido (fiadas 16/32), EX-34 conferido (passos 90/98 cm para módulos 15/14); git diff --check sem erros. Nenhum teste do aplicativo executado, pois não houve alteração de código. Implementação e testes manuais de M3 ainda não iniciados; dados pessoais do solicitante preservados.

Registro das confirmações: PRD, arquitetura, CT-09/10, EX-28/31/35 e aceites A11/A12/A16 sincronizados. EX-28: extensão 87,5…212,5 cm para vão 100…200; fiada 14 com 5 canaletas inteiras, fiada 31 com 4 inteiras + 2 meias, sem outra faixa coincidente. Permanecem configurações adaptáveis à altura-base e referências verticais, sem arredondamento silencioso. Revisão apenas documental; testes do aplicativo não executados.

### Padronização da nomenclatura — 12/10/2026

Por solicitação do usuário, M passa a significar Marco em toda a documentação. Marcos M1–M5, subdivisões M3.1/M3.2/M3.3, tarefas M1-T01 (incluindo T00 onde já existia tarefa inicial) e critérios M3-A01 mantêm sua numeração e vínculos. RF, CT, EX e IDs de decisões permanecem inalterados. Referências históricas foram normalizadas, sem mudar resultados, escopo ou aceite. Os cinco títulos de testes de navegador do primeiro marco também foram renomeados para M1, sem alterar seus passos ou verificações.

Verificação desta alteração: busca sem referências à nomenclatura antiga nos documentos, código e títulos de testes; links locais conferidos; git diff --check sem erros. Testes do aplicativo não reexecutados, pois somente documentação e rótulos de testes foram alterados; nenhuma mudança de comportamento ou implementação de M3.

### Registro do recorte de vãos — 12/10/2026

Por confirmação do solicitante, D3-02 permite vãos empilhados com uma fiada completa intermediária, compartilhável pelas canaletas superior/inferior; proíbe sobreposição de volumes e mantém separação horizontal de um módulo para vãos lado a lado com intervalos verticais sobrepostos. Atualizados PRD §20, Arquitetura §15, CT-07, EX-26, critérios M3-A05/A11 e roteiro manual. A seleção contextual na Planta identifica tipo/base/topo. Mantidas supressões voluntárias e alcance nominal, sem exigir duas fiadas de canaleta ou dimensionamento estrutural.

Verificação pelo Codex: revisão de consistência entre os quatro documentos, conferência do exemplo EX-26 e de links locais; `git diff --check`. Sem código ou testes do aplicativo nesta alteração. Implementação de M3 e testes manuais do solicitante permanecem futuros.

### Correções de consistência documental — 12/10/2026

Aplicados os itens 1–6 aprovados pelo solicitante: cenário de graute por inclusão/remoção, distinção entre conflito de encontro e interrupção de graute por vão, linguagem de composição nominal, atualização do estado vigente de M2 e próxima ação M3.1, precedência de PRD §20 para M3 e endereço operacional padrão `http://127.0.0.1:5173/`. PRD, plano e README atualizados. Preservados os relatos históricos e suas origens de navegador, com orientação para transporte por `.ecovit`. As reorganizações e reduções de redundância dos itens 7–9 não foram aplicadas.

Verificação pelo Codex: revisão dos trechos corrigidos contra as definições de M3, busca das formulações substituídas, links locais e `git diff --check`. Alteração somente documental; testes do aplicativo não executados. Implementação e teste manual de M3 permanecem futuros; aceite global de M2 preservado sem atribuir resultados individuais ao solicitante.

### Consolidação das referências documentais — 12/10/2026

Aplicados os itens 7–9 aprovados pelo solicitante. PRD §20 concentra a tabela normativa dos padrões e o comportamento do usuário; CT-07–10 mantém fórmulas, limites e exemplos; Arquitetura §15 mantém representação, identidade dos ajustes, processamento e migração; Plano §7 concentra sequência, critérios, verificações e decisões com referências. Descrições repetidas de M3 foram reduzidas, preservando RF/CT/EX/M3-A/D3, os números dos exemplos e os relatos históricos. Comportamentos antes presentes apenas no plano foram incorporados ao PRD.

Arquitetura §9 descreve somente o contrato vigente de arquivo/composição e a validação de snapshots antigos, remetendo a evolução de paginação e suas evidências ao relatório de M2 na seção 6 deste plano. Nenhuma regra de produto, código, schema ou dado de projeto foi alterado.

Verificação pelo Codex: consistência das responsabilidades e referências, preservação dos IDs e exemplos, links locais/âncoras adicionadas e `git diff --check`. Sem testes do aplicativo por se tratar de documentação. Implementação e testes manuais de M3 permanecem futuros.

### Explicitação da entrega M3.1 — 12/10/2026

Registrados os três complementos aprovados pelo solicitante: exclusão individual de vão no PRD §20 e M3-A06; envelope versão 3/composição nominal-v4 desde M3.1 na Arquitetura §15, com geração de canaletas/grautes desativada até seus incrementos; recorte explícito dos critérios de verificação de M3.1 nesta seção. Preservadas as decisões de empilhamento, modulação e migração de legados. Dimensões de esquadrias/folgas permanecem fora de M3.1.

Verificação pelo Codex: consistência dos complementos com CT-07/08, padrões e contratos existentes, links locais/âncoras e `git diff --check`. Alteração documental, sem testes do aplicativo ou implementação de M3.1. Teste manual permanece futuro. Commit documental reúne a consolidação de M3 e estas revisões; alteração preexistente de títulos em `tests/e2e/editor.spec.ts` fica fora deste commit.

### Relatório da implementação de M3.1 — 12/10/2026

Implementado no aplicativo existente (versão 0.3.0): ferramentas Porta/Janela/Vão por arraste, prévia modular, movimento na mesma parede, duas alças, campos de posição/largura/base/altura, Aplicar/Cancelar e exclusão individual. Seleção de empilhados identifica tipo/base/topo; seletor adicional permite seleção por teclado. Os símbolos são esquemáticos, sem folha/sentido de abertura. Painel de vão recolhível e Configurações expõe somente Vãos, com Aplicar/Cancelar/Restaurar, altura resultante e consulta de fiadas. Defaults só inicializam novas aberturas.

CT-07/08 aplicados: subtrair células após a paginação original, conservar fase e converter par interrompido em meio nominal. Sobreposição de volumes e separações incompatíveis são recusadas em edição direta; empilhamento com coincidência parcial/total usa mínimo de uma fiada. Vão que invade encontro permanece como intenção com diagnóstico; componente afetado fica sem peças, preservando componentes independentes. Edição indireta mantém posição mundial, ID e medidas do vão, inclusive offset negativo pendente. Exclusão da parede remove seus vãos e escolhas dependentes na mesma operação desfazível.

Arquivo versão 3, composição nominal-v4 e configurações em `project.openingSettings`. Vãos em `model.openings`; nenhum campo/resultado de canaleta ou graute foi antecipado. Arquivos v1/v2 e snapshots nominal-v1/v2/v3 são conferidos com sua convenção original antes da migração; resultado atual de v3 exige nominal-v4. Snapshots adulterados, órfãos, IDs duplicados, versões futuras e limites excedidos são recusados. Rascunhos geometricamente pendentes podem salvar/reabrir. Limite defensivo de mil vãos, além dos limites existentes de parede/fiada/células/50 MB. A tabela IndexedDB permanece a mesma.

Diagnósticos contextualizados pelo indicador do rodapé: localização, faixa de fiadas, consequência e ações Localizar/Ver fiada/Editar na Planta. Seleção de abertura na Fiada também oferece Editar na Planta com câmera preservada. Informação de elementos sobre/sob vãos ainda não calculados é persistida, sem diagnóstico estrutural. Processamento salva modelo → calcula inteiro → salva resultado; falha da primeira gravação não impede cálculo em memória, falhas preservam trabalho e liberam controles. Nome/seleção/câmera não disparam geração; desfazer de nome também conserva o resultado.

#### Verificações pelo Codex

| Verificação | Resultado |
|---|---|
| `npm run typecheck` | Passou, sem erros |
| `npm run lint` | Passou, sem erros ou avisos |
| `npm test` | 77 testes passaram: 18 de vãos, 10 de estado/histórico/falhas e 49 de regressões de domínio, composição e IndexedDB |
| `npm run test:e2e` | Suíte final completa: 40 fluxos passaram em Chrome/Edge (20 por navegador), incluindo 14 de M3.1; antes dela, 38 fluxos completos e verificações específicas também passaram |
| `npm run build` | Passou; bundle 821,18 kB (256,51 kB gzip). Avisos conhecidos de comentários de otimização do Zod e bundle acima de 500 kB, não impeditivos |
| Revisão visual | Planta, empilhados e configurações em 1440×1000 inspecionados; rótulos coincidentes foram separados e informação repetida no painel removida. Capturas em `.tools/m3-*.png`, ignoradas pelo Git |
| Integridade documental | Links/âncoras locais e `git diff --check` conferidos no encerramento |
| Teste manual do solicitante | Aceite global de M3.1 recebido em 12/10/2026: “M3.1 validado com sucesso.” Sem resultados individuais por passo informados |

Rodadas intermediárias identificaram expectativas antigas de versão/fluxo e preparação mutável de fixture de estado, corrigidas para as convenções atuais e operações imutáveis. A primeira execução de Vitest encontrou EPERM do sandbox; testes executados posteriormente com autorização fora dessa restrição. A alteração preexistente em `tests/e2e/editor.spec.ts` foi preservada integralmente, sem edição adicional ou commit nesta implementação.

#### Cobertura dos critérios no recorte M3.1

| Critérios | Evidência e alcance |
|---|---|
| M3-A01/A02 | Fluxos em navegador: três tipos, corpo, ambas as alças, campos, cancelamento/Escape/perda de foco/saída, exclusão e histórico. IDs, posição e largura conferidos no documento baixado |
| M3-A03/A04 | Casos pertinentes EX-21–24/29 por contagens/posições independentes; piso/início diferentes, passo de 6 cm, bases 25/30/28 e módulo 12,51 cm herdado de M2; alternativas explícitas e retomada da paginação |
| M3-A05/A06 | EX-25–27: contato/sobreposição recusados, coincidência horizontal parcial/total com fiada intermediária, seleção de empilhados, encontro invadido, parede encurtada preservando pendência e exclusão/desfazer de dependentes |
| M3-A07/A08 (parte M3.1) | Câmera Planta/Fiada, referência não interativa herdada, edição contextual, diagnósticos e informação de recursos futuros; sem verificação de canaleta/graute |
| M3-A09/A10 (parte M3.1) | Migração original, reabertura/importação como cópia, adulteração, rascunho pendente, histórico, duas gravações, falhas do motor/armazenamento e bloqueio entre abas |
| M3-A15 (parte M3.1) | Chrome/Edge, rotações/reflexões/sentido, bases padrão/personalizada, limites defensivos e regressões M2. Sem alegação de três pavimentos |
| M3-A16 (parte M3.1) | Grupo Vãos: padrões, Aplicar/Cancelar/Restaurar, preservação de existentes, persistência e histórico. Grupos de canaleta/graute não verificados |
| M3-A11–14 e partes futuras dos critérios compartilhados | Pendentes para M3.2/M3.3; não declarados concluídos |

Observação de carga no aplicativo: 100 paredes de 20 módulos, cada uma com porta de 8 módulos a partir do módulo 5, base zero/topo 217 cm, altura de parede 280 cm e 40 fiadas. Resultado esperado independente: 31 fiadas × 7 peças + 5 fiadas × 11 + 4 × 10 = 312 peças por parede, total 31.200. Primeira medição desse fluxo: 5.118 ms em Chrome e 4.171 ms em Edge; rodada final: 2.359 ms em Chrome e 5.813 ms em Edge. Inclui abertura da página, importação, geração e salvamento; houve concorrência com outras verificações em parte das rodadas. Não é tempo isolado do motor nem garantia da referência de cinco segundos. Nenhuma medição de 100 mil peças/três pavimentos ou canaletas/grautes.

#### Roteiro manual específico de M3.1

Abrir `http://127.0.0.1:5173/` em Chrome ou Edge. Para iniciar, executar `./Start-Ecovit.ps1` na raiz e manter o terminal aberto. Preservar a origem de projetos existentes; transportar por `.ecovit` se necessário. Usar projetos de teste próprios com tijolo 25×12,5×7 cm e parede de 400 cm/altura 280 cm.

| Passo | Ação | Esperado |
|---|---|---|
| 1 | Desenhar Porta, Janela e Vão em regiões separadas; selecionar, mover corpo, editar ambas as alças e campos | Símbolos distintos, prévia modular, parede mantida, uma operação por gesto; medidas incompatíveis oferecem escolha |
| 2 | Configurações: alterar base, Cancelar; repetir e Aplicar; Restaurar e Aplicar; desfazer | Cancelar preserva; padrões só afetam novas inserções; persistência e histórico corretos |
| 3 | Em projetos separados, porta posição 100/largura 100/base 0/altura 210; janela posição 100/largura 100/base 98/altura 112 | Porta abre fiadas 1–30; janela 15–30. Fiada 31 retoma sem reiniciar fase; conferir EX-21/22 |
| 4 | Novo projeto: porta inferior posição 100/largura 100/base 0/altura 105; janela superior no mesmo intervalo, base 112/altura 98 | Seletor distingue ambas na Planta; fiada 16 completa, 15 e 17 com as respectivas aberturas. Canaletas ainda não aparecem |
| 5 | Tentar base 105 no vão superior e contato lateral entre vãos com alturas coincidentes; cancelar | Entradas recusadas sem alterar projeto; empilhamento exige uma fiada e separação lateral exige um módulo |
| 6 | Na Fiada atingida pelo vão, clicar na abertura e Editar na Planta; recolher/reabrir painel e selecionar por teclado | Seleção/localização e câmera preservadas; controles acessíveis |
| 7 | Escape durante arraste, soltar fora e alternar janela; navegar por botão central/Espaço | Nenhuma abertura residual, próxima inserção funciona e navegação não altera entidades |
| 8 | Com vão 100–200, encurtar parede para 150; usar Diagnósticos, localizar/editar; desfazer | Vão mantém posição/medidas como pendência; conjunto sem peças até corrigir; desfazer restaura |
| 9 | Excluir vão, desfazer/refazer; excluir parede com vãos e desfazer | Parede preservada ao excluir só vão; dependentes restaurados ao desfazer parede |
| 10 | Baixar, recarregar/reabrir e carregar em outro navegador; repetir com projeto antigo M2 | Geometria, escolhas, configurações e pendências preservadas; importação cria cópia; M2 sem novos elementos automáticos |
| 11 | Base personalizada 28×14×6 cm, parede altura 240; desenhar janela com defaults originais | Nenhum arredondamento oculto; confirmar medidas realizáveis, por exemplo base 108/altura 108, antes de inserir |

Limitações: canaletas/grautes seguem sem geração/controles; cruz e transições de altura fora do suporte M2 não foram ampliadas. Lajes, múltiplos pavimentos, quantitativos, esquadrias/folgas e validação estrutural ficam fora. Aceite manual global recebido, sem checklist individual de conforto/teclado; não houve auditoria completa de acessibilidade. Nenhum arquivo pessoal foi alterado pelos testes, que usam perfis isolados.

### Aceite global de M3.1 — 12/10/2026

O solicitante declarou: **“M3.1 validado com sucesso.”** M3.1 aprovado globalmente, substituindo a pendência de aceite nos registros de implementação. Não foram informados resultados individuais por passo do roteiro. Limitações de escopo permanecem: canaletas em M3.2, grautes em M3.3. O próximo incremento é M3.2; pedido de prompt não inicia sua implementação.

Atualizados os estados vigentes de PRD, caderno, plano e README. Revisão documental de consistência e `git diff --check`; sem alteração de código, commit ou repetição de testes do aplicativo nesta atualização.

### Recorte de verificação de M3.2

Executar M3-A07 (canaletas em Fiada), M3-A11 e M3-A12. Nos critérios compartilhados A08/09/10/15/16, verificar somente a parte de canaletas: diagnósticos e localização, integridade/migração/transporte, processamento e recuperação de falhas, bases/direções/limites e configurações com histórico. Manter regressões M1/M2/M3.1. M3-A13/14 e partes de graute dos critérios compartilhados permanecem para M3.3.

### Relatório da implementação de M3.2 — 12/10/2026

Implementado no aplicativo existente, versão 0.4.0. Configurações inclui grupo Canaletas com lista de níveis, UUID estável, cotas de topo relativas ao piso e consulta de fiadas. Adicionar/remover, Aplicar/Cancelar/Restaurar; cotas incompatíveis oferecem alternativas explícitas, sem arredondar silenciosamente, e cotas duplicadas são recusadas. Restaurar padrões recupera 112/224 cm e preserva supressões. Configurar somente canaletas não exige corrigir padrões de vãos inalterados que estejam fora da malha de uma base personalizada.

CT-09 implementado após a paginação/subtração M3.1: níveis globais abrangem alvenaria existente da parede; todos os tipos de vãos demandam fiadas imediatamente acima/abaixo, quando existentes, com largura do vão mais um módulo horizontal por lado. Demandas coincidentes se unem por célula, mantendo origens de nível e de vão superior/inferior; a fiada intermediária dos empilhados é compartilhada. Inteira/meia canaleta usam a fase já escolhida; par misto divide em meios comuns/canaleta sem ampliar alcance ou preencher vazio. Canal longitudinal esquemático e cores distintas somente na Fiada.

Seleção por canvas ou lista realça o alcance completo na parede/fiada, inclusive trechos separados por aberturas. Célula compartilhada oferece escolha de parede. Remover faixa aplica supressão persistente por UUID/parede/cota absoluta, prevalecendo sobre todas as origens coincidentes, inclusive numa célula comum a paredes diferentes. Retorna tijolos comuns e preserva outras fiadas. Restaurar faixa suprimida, desfazer/refazer, reabrir e transportar mantêm identidade e resultado. Extensão da parede permanece abrangida; mudança do nível não desloca a supressão, que pode ficar dormente e voltar a valer. Exclusão de parede elimina seus ajustes dependentes na mesma operação desfazível.

Níveis/supressões incompatíveis após edição indireta são preservados e não aplicados, com diagnóstico. Nível informa a cota e oferece Editar níveis de canaleta; supressão informa cota absoluta e restauração na Fiada. Ver fiada/Localizar continuam disponíveis. Sem demanda numa cota ainda válida, a supressão fica dormente sem erro. Nenhuma remoção voluntária gera alerta estrutural.

Envelope versão 4/composição nominal-v5, sem alterar a tabela IndexedDB. Snapshots de arquivos anteriores são conferidos pela convenção original antes de migrar; adulterados/futuros/órfãos/duplicados são recusados. Legados recebem níveis globais vazios; as faixas locais junto aos vãos existentes passam a ser calculadas por CT-09. Novos projetos recebem os níveis normativos. Preservados IDs, geometria, escolhas e arquivo original; salvar somente com bloqueio de edição. Limites defensivos adicionais: 100 níveis e 10 mil supressões, sem truncamento; mantidos limites de células/fiadas/arquivo. Histórico guarda intenção, sem peças. Processamento sequencial salva modelo → calcula → salva resultado; falhas mantêm trabalho em memória e liberam controles.

#### Verificações pelo Codex

| Verificação | Resultado real |
|---|---|
| `npm run typecheck` | Passou, sem erros; repetido pelo build final |
| `npm run lint` | Passou, sem erros ou avisos |
| `npm test` | 99 passaram: 19 de canaletas, 13 de estado/histórico/falhas e 67 de regressões de domínio, composição, vãos e IndexedDB |
| `npm run test:e2e` | Rodada final completa: 56 passaram, 28 em Chrome e 28 em Edge; 16 fluxos de M3.2 e 40 de regressões M1/M2/M3.1 |
| `npm run build` | Passou; JS 833,16 kB / 260,16 kB gzip. Avisos conhecidos de comentários de otimização do Zod e bundle maior que 500 kB, não impeditivos |
| Revisão visual | Capturas 1440×1000: configurações, canaletas/aberturas, faixa selecionada e carga. Canal longitudinal, meios, vazio do vão, realce e ações legíveis; corrigida posição do título Encontros. Capturas `.tools/m32-*.png`, ignoradas pelo Git |
| Servidor local | HTTP 200 confirmado em `http://127.0.0.1:5173/` no encerramento |
| Integridade documental/Git | Links locais sem arquivos ausentes; `git diff --check` sem erros. Alterações anteriores de M3.1 preservadas, sem revertê-las ou fazer commit; hash de `tests/e2e/editor.spec.ts` igual ao inicial |
| Teste manual/aceite de M3.2 | Aceite global recebido em 13/10/2026: “M3.2 validado.” Sem resultados individuais por passo informados |

Duas rodadas intermediárias de e2e passaram 50/52: corrigidos seletor de título ambíguo e expectativa de teste que atribuía origem local também às células fora do alcance do vão. A asserção final confere independentemente as dez posições 87,5–200 cm com duas origens, dentro da faixa global de 32 células. Não houve alteração do comportamento aprovado para satisfazer o teste. A suíte final foi executada após as correções, sem editar código durante sua execução. Testes usam perfis isolados e cópias; arquivos pessoais não foram alterados.

Observação de carga no aplicativo: 100 paredes de 20 módulos, altura 280 cm/40 fiadas; cada janela ocupa módulos 5–12, base 112/topo 217 cm; globais 112/224 coincidem com faixas inferior/superior. Resultado independente por parede: fiadas 1–16 = 8×10 + 8×11 = 168 peças; fiadas 17–31 = 15×7 = 105; fiadas 32–40 = 4×10 + 5×11 = 95; total 368 peças/parede, 36.800 no projeto. Duas faixas por parede, 200 no total; fiada 16 com 900 inteiras e 200 meias canaletas. Fluxo abertura/importação/geração/salvamento: 4.065 ms em Chrome e 3.255 ms em Edge. Chrome executou durante verificações de build/lint. Não é medição isolada do motor nem garantia de cinco segundos; sem alegação de três pavimentos/100 mil peças.

#### Cobertura dos critérios no recorte M3.2

| Critérios | Evidência e alcance |
|---|---|
| M3-A07 (parte canaletas) | Inteira/meia canaleta distintas com canal longitudinal; seleção e alcance na Fiada; câmera preservada e referência sem ação; nenhuma canaleta na Planta |
| M3-A11 | EX-26/28/31: alcance por célula, posições/contagens independentes, limites de altura/abertura, porta no início sem inferior, superior ausente no topo, coincidências locais/globais e fiada compartilhada entre empilhados |
| M3-A12 | EX-35: remover toda parede/fiada, inclusive trechos descontínuos; retornam comuns sem tocar outras fiadas; precedência sobre origens vizinhas coincidentes; restauração e persistência |
| M3-A08 (parte canaletas) | Nível fora da malha e supressão sem fiada válida preservados, IDs/cotas/localização e ação de correção; supressão dormente válida sem erro; sem alerta estrutural |
| M3-A09 (parte canaletas) | Arquivo versão 4/nominal-v5, reabertura e cópia entre navegadores, convenções anteriores conferidas antes da migração; adulteração de células/origens/snapshots e referência órfã recusadas |
| M3-A10 (parte canaletas) | Salvar/calcular/salvar, histórico de níveis/supressão/restauração/dependentes; falhas do motor e gravação, retry e download do resultado em memória; regressões do bloqueio entre abas |
| M3-A15 (parte canaletas) | Chrome/Edge; bases 25/30/28, altura personalizada 6 cm, direções/lados, limites defensivos e determinismo por ordem; carga de 100 janelas com níveis coincidentes |
| M3-A16 (parte canaletas) | Adicionar/remover níveis, alternativas modulares, duplicatas, Aplicar/Cancelar/Restaurar, defaults de novos projetos, legados sem globais, preservação de supressões e vãos, histórico |
| Partes de graute dos critérios compartilhados e M3-A13/14 | Pendentes para M3.3; não declaradas verificadas |

#### Roteiro manual específico de M3.2 — referência do aceite global

Executar `./Start-Ecovit.ps1` na raiz e manter o terminal aberto; abrir `http://127.0.0.1:5173/` em Chrome ou Edge. Usar projetos de teste com base 25×12,5×7 cm, parede 400×280 cm, piso/início zero. Para isolar faixas locais, remover os níveis globais nas configurações. Não usar arquivos pessoais para os testes de adulteração/falha.

| Passo | Ação | Esperado |
|---|---|---|
| 1 | Novo projeto; Configurações → Canaletas; consultar níveis, adicionar 119, cancelar; repetir e aplicar; remover/restaurar padrões e desfazer | Novos níveis 112/224 e fiadas 16/32; cancelar não muda documento; aplicar/remoção/restauração são desfazíveis; sem alteração de vãos existentes |
| 2 | Adicionar topo 100 e Aplicar; escolher 98 ou 105 explicitamente; tentar duplicar uma cota | Alternativas compatíveis sem arredondamento oculto; duplicata recusada; número da fiada consultável |
| 3 | Sem globais, janela posição 100/largura 100/base 98/altura 112 | EX-28: faixa 87,5–212,5 cm; fiada 14 com 5 inteiras, fiada 31 com 4 inteiras + 2 meias; restantes comuns |
| 4 | Janela padrão base 112/topo 217; adicionar globais 112/224 | EX-31: fiadas 16/32; união das origens sem duplicar peças; outros níveis/fiadas mantidos |
| 5 | Sem globais, porta posição 100/largura 100/base 0/topo 105 e janela superior no mesmo intervalo, base 112/topo 210 | EX-26: fiada 16 compartilhada por superior da porta/inferior da janela, uma ocupação; nenhuma canaleta abaixo da porta |
| 6 | Janela EX-28 com global 112; fiada 16, clicar num trecho e conferir prévia; Remover faixa | EX-35: remover também o outro lado separado pelo vão e origens coincidentes; preencher com comuns; fiadas 14/31 inalteradas |
| 7 | Desfazer/refazer, recarregar/reabrir, baixar e importar em outro navegador; Restaurar faixa suprimida | Supressão mantém identidade/cota, importação cria cópia; restauração retorna composição automática; nenhuma edição do arquivo original |
| 8 | Com faixa global 112 suprimida, estender parede; mudar global para 119; depois voltar a 112 | Extensão abrangida pela supressão; 119 aparece; supressão permanece em 112 e volta a valer; Restaurar padrões não apaga ajuste |
| 9 | Encontro L com nível global; clicar célula compartilhada, escolher parede e remover; usar referência adjacente | Escolha contextual define toda faixa da parede; célula compartilhada torna-se comum; referência não aceita remoção |
| 10 | Alterar altura/início/base de modo a tornar uma cota/ajuste incompatível; usar Diagnósticos | Intenção preservada; cota e ação de correção visíveis; nenhuma faixa aplicada fora da malha; desfazer recupera |
| 11 | Importar cópia de projeto M3.1 e reabrir; ativar globais por Restaurar padrões/Aplicar | Vãos/IDs/escolhas preservados, globais vazios inicialmente, faixas locais calculadas; ativação global explícita |

Limitações: grautes, lajes, múltiplos pavimentos, quantitativos, armaduras e validação estrutural permanecem fora da entrega. Cruz/transições não suportadas de M2 não foram ampliadas. Canal é representação nominal, sem dimensões físicas. Não houve auditoria completa de acessibilidade. Aceite global de M3.2 recebido em 13/10/2026, sem checklist individual dos passos; M3.1 continua aprovado.

### Aceite global de M3.2 — 13/10/2026

O solicitante declarou: **“M3.2 validado.”** Registrado aceite global de M3.2, substituindo a pendência de aprovação; nenhum resultado individual por passo foi informado. Preservados os resultados automatizados e as limitações da entrega.

M3.3 é o próximo incremento. Suas dependências M3.1/M3.2 estão aprovadas, e as regras nominais de graute estão definidas no PRD §20, CT-10/EX-22/32–34 e Arquitetura §15. Configurações, distribuição por malha, intervalos interrompidos por vãos, clique por eixo e precedência dos ajustes têm critérios M3-A13/A14 e partes aplicáveis dos critérios compartilhados. Não identificada pendência de decisão de produto que impeça iniciar esse recorte. Representação concreta de configuração/ajustes, limites defensivos e evolução explícita de formato/convenção serão implementadas junto com a migração e seus testes, sem alterar regras aprovadas. Projetos legados devem iniciar com categorias de graute desligadas, conforme a arquitetura.

Atualizados plano, PRD, caderno, arquitetura e README. Revisão documental de consistência e `git diff --check`; sem mudanças de código, commit ou repetição de testes do aplicativo. Este registro e a avaliação de prontidão não iniciam a implementação de M3.3.

### Recorte de verificação de M3.3

Verificar M3-A13/A14 integralmente no alcance nominal. Nos critérios compartilhados A07–10/A15/A16, verificar graute, sua integração com vãos/canaletas, configurações, edição, histórico, integridade/migração e falhas. Reexecutar regressões M1/M2/M3.1/M3.2. Resultados automatizados não substituem teste manual/aceite do solicitante; lajes/múltiplos pavimentos/quantitativos não fazem parte da verificação.

### Relatório da implementação de M3.3 — 13/10/2026

Antes da implementação, por solicitação expressa, commit **e25ed2d** reuniu M3.1/M3.2 e seus aceites/documentação; push para `origin/main` concluído. Alteração preexistente em `tests/e2e/editor.spec.ts` ficou fora desse commit e foi preservada. M3.3 foi implementado depois desse push; suas alterações permanecem locais para validação, sem segundo commit/push nesta entrega.

Implementado no aplicativo existente, versão 0.5.0. Grupo Graute vertical nas Configurações: Encontros, Laterais dos vãos, Pontas livres e Intervalos em paredes longas, independentes; distância positiva, padrão 100 cm; Aplicar/Cancelar/Restaurar por grupo preservam ajustes e vãos. Novos projetos recebem quatro categorias habilitadas; projetos legados recebem quatro desligadas, com ativação explícita. Distância menor que o módulo, quando distribuição está habilitada, oferece o módulo como alternativa explícita. Nenhum arredondamento oculto; passo nominal por CT-10.

O motor usa a alvenaria efetivamente composta após vãos/canaletas: centros das células nominais, candidatos por categoria, referências virtuais nas pontas e âncoras automáticas habilitadas para distribuir desde a menor coordenada. Coincidências se unem por coordenada com origens preservadas, inclusive encontros L/T, sem multiplicar grautes por parede. Graute ocupa todos os intervalos de alvenaria do eixo, descontando aberturas; permite trechos separados acima/abaixo, conforme EX-22/33. Explicitada essa leitura de CT-10 para eliminar a ambiguidade da frase anterior sobre alvenaria na altura inteira, preservando os exemplos e comportamento aprovado. Referências virtuais não criam graute sozinhas. Exclusões aplicam depois da distribuição, sem reposição compensatória; inclusões manuais não viram âncoras de redistribuição.

Na Fiada, ferramenta Graute exibe marcadores e preenchimento escuro; hover +/− indica adicionar/remover, clique confirmado na soltura afeta todo o eixo. Canais de canaleta expõem marcadores nominais nesta ferramenta; grautes existentes continuam visíveis fora dela. Seletor de furos e botão contextual oferecem ação equivalente por teclado, consulta de coordenada e intervalos. Escape, soltura fora ou deslocamento de arraste cancelam; navegação central/Espaço e camada de referência não editam. Selecionar e Planta encerram Graute; ferramentas não aparecem simultaneamente selecionadas. Zoom reduzido sem marcador legível não recebe clique de graute; ampliar zoom ou usar o seletor. Fora de Graute, seleção de vãos/canaletas/encontros é preservada.

Inclusões/exclusões persistem por UUID e coordenada mundial da célula, com paredes associadas. Adicionar novamente conserva ID e muda para inclusão explícita; descartar ajuste permite novamente a automação. Edição de vão recalcula intervalos; extensão/encurtamento preserva coordenada. Sem alvenaria/associação elegível, conservar ajuste não aplicado com diagnóstico, localização e descarte, sem transferir ao vizinho. Excluir parede remove sua associação e elimina ajuste sem parede remanescente na mesma operação desfazível. Supressão/restauração de canaleta preserva grautes. Restaurar configuração preserva ajustes.

Arquivo versão 5/composição nominal-v6. `project.groutSettings`, `adjustments.grout` e `generated.grouts` seguem Arquitetura §15; coordenadas persistidas são inteiras na origem da célula, centro derivado, inclusive módulo 12,51 cm. Origem de encontro usa tipo/coordenada, evitando copiar a longa identidade de todo o componente em cada eixo. Dados do domínio independem de canvas/React; eixos/intervalos gerados não entram no histórico. Snapshots anteriores são conferidos com convenção original antes de migrar; versão 4 preserva níveis/supressões de M3.2, sem ativar grautes. Arquivo original intacto, IndexedDB na mesma tabela, importação como cópia, leitura bloqueada sem gravação nem recálculo. Rejeitados snapshots adulterados, órfãos, duplicatas e versões futuras. Limites adicionais: 10 mil ajustes, 20 mil eixos e 200 mil intervalos, além dos existentes; sem truncamento.

#### Verificações pelo Codex

| Verificação | Resultado real |
|---|---|
| `npm run typecheck` | Passou explicitamente durante implementação e no build final |
| `npm run lint` | Passou, sem erros ou avisos na versão final |
| `npm test` | 125 passaram: 21 de graute, 17 de estado/histórico/falhas, 5 de IndexedDB e 82 de regressões de domínio/composição/vãos/canaletas |
| `npm run test:e2e` | Suíte completa: 72 passaram, 36 em Chrome e 36 em Edge, incluindo 16 de M3.3 e 56 de regressões. Após ajuste da identidade compacta de origens de encontro, 16 fluxos pertinentes de M3.3 passaram novamente; após explicitar os rótulos de entrada/geometria/limite, 2 fluxos de diagnóstico/correção passaram nos dois navegadores |
| `npm run build` | Passou; JS final 845,44 kB / 263,96 kB gzip. Avisos conhecidos sobre comentários de otimização do Zod e bundle maior que 500 kB, não impeditivos |
| Revisão visual | Configurações, canaleta com graute, eixo selecionado e carga em 1440×1000 inspecionados; botão/realce/intervalos legíveis. Corrigida indicação simultânea de Selecionar/Graute. Capturas `.tools/m33-*.png`, ignoradas pelo Git |
| Git e documentação | Base aprovada enviada como e25ed2d; alteração preexistente de editor.spec.ts preservada com hash inicial; links locais e `git diff --check` conferidos no encerramento |
| Servidor local | HTTP 200 confirmado em `http://127.0.0.1:5173/` |
| Teste manual/aceite de M3.3 | Pendente do solicitante; nenhum passo declarado concluído |

Rodada intermediária de navegador: 70/72 passaram; o cenário de carga inicial excedia o limite defensivo existente de 100 mil células/fiadas estimadas (100×32×40=128 mil), causando recusa de geração corretamente. Corrigida a preparação do cenário para 100 paredes de 20 módulos (80 mil estimadas), sem ampliar limite ou alterar comportamento para satisfazer o teste. Corrigidos dois imports/variáveis não usados encontrados pelo lint. Executadas verificações finais depois das correções; o ajuste final de identidade compacta também foi seguido por domínio/persistência, lint, build e e2e pertinentes. Testes em perfis isolados/cópias, sem alterar arquivos pessoais.

Carga de M3.3 no aplicativo: 100 paredes de 250 cm/altura 280 cm, cada janela em 100–200 cm/base 98/topo 210; somente categoria Intervalos habilitada, d=100. Posições independentes 106,25 e 206,25 cm por parede: primeiro eixo com [0,98) e [210,280), segundo com [0,280). Total 200 eixos/300 intervalos, conferidos no arquivo baixado. Medição final: 2.995 ms em Chrome e 2.521 ms em Edge, incluindo abertura da página, importação, geração e salvamento. Algumas verificações concorreram na máquina. Não é tempo isolado do motor nem garantia de cinco segundos/100 mil peças/três pavimentos.

#### Cobertura dos critérios no recorte M3.3

| Critérios | Evidência e alcance |
|---|---|
| M3-A13 | Quatro categorias independentes, referências virtuais, distância 100, EX-32/34 por posições independentes, passos 90/98 cm e módulo ímpar; sem dimensionamento físico |
| M3-A14 | Hover +/−, clique e botão por teclado afetam eixo inteiro; EX-33 acima/abaixo de janela, vazio sem alvo, camada de referência/navegação/cancelamentos sem edição; exclusão sem compensação |
| M3-A07 (parte grautes) | Representação na Fiada, marcadores em canaletas, preenchimento escuro e câmera preservada; referência sem ação; Planta mantém arquitetura |
| M3-A08 (parte grautes) | Distância incompatível como entrada, ajuste sem alvenaria como geometria, limite separado de falha do motor; intenção/cota/eixo localizáveis; descarte explícito; sem alerta estrutural |
| M3-A09 (parte grautes) | Envelope 5/nominal-v6, transporte, reabertura, migração M3.2 por convenção original, IndexedDB sem sobrescrita na leitura; adulteração/órfãos/duplicatas/futuro recusados; bloqueio de edição preserva snapshot antigo |
| M3-A10 (parte grautes) | Histórico mantém IDs/configurações, exclusão/desfazer de dependentes; duas gravações, motor, quota e recuperação com download íntegro; sem filas ou controles presos |
| M3-A15 (parte grautes) | Chrome/Edge, bases 25/30/28 e módulo 12,51, altura 6 cm, lados/direções, piso/início diferentes, limites e determinismo; regressões M1/M2/M3.1/M3.2 passaram |
| M3-A16 (parte grautes) | Defaults de novos projetos, legados com categorias desligadas, categorias/distância, Aplicar/Cancelar/Restaurar, alternativas explícitas, inclusões/exclusões preservadas e histórico |

#### Roteiro manual específico de M3.3 — pendente do solicitante

Executar `./Start-Ecovit.ps1` na raiz, manter o terminal aberto e acessar `http://127.0.0.1:5173/` em Chrome ou Edge. Usar projetos de teste com base 25×12,5×7 cm, parede 400×280 cm, piso/início zero. Ampliar o zoom para distinguir furos; o seletor também permite ação por teclado.

| Passo | Ação | Esperado |
|---|---|---|
| 1 | Novo projeto; Configurações → Graute vertical; consultar quatro categorias/distância; alterar e Cancelar; repetir e Aplicar; Restaurar e desfazer | Defaults quatro habilitadas/100 cm; cancelar não modifica; aplicar/restaurar desfazíveis; vãos e ajustes existentes preservados |
| 2 | Parede reta 400; deixar somente Intervalos habilitado, d=100; Fiada 1 | EX-32: eixos 106,25/206,25/306,25; pontas 6,25/393,75 não preenchidas; habilitar Pontas livres acrescenta ambas |
| 3 | Ativar Graute; hover e remover 206,25; mudar fiada, recarregar/reabrir e recalcular; adicionar novamente | Eixo removido em toda altura e sem substituto compensatório; exclusão persiste; adicionar desfaz a exclusão com ID mantido |
| 4 | Desligar todas as categorias; janela posição 100/largura 100/base 98/altura 112; fiada 10, incluir em x=106,25 | EX-33: intervalos [0,98) e [210,280), preenchidos escuros; fiada 20 é vazio sem clique; remover na 35 elimina ambos |
| 5 | No projeto anterior, fiada 31, selecionar furo em canaleta e consultar intervalos; sair de Graute, remover/restaurar faixa de canaleta | Marcador nominal clicável no canal; canaleta retorna comum, graute preservado; Planta sem canal/graute; Selecionar encerra ferramenta |
| 6 | Criar L/T com Encontros habilitado e testar Laterais/Pontas separadamente; no canto compartilhado incluir/remover | Um eixo compartilhado por coordenada; laterais nos centros imediatamente junto ao vão; sem pontas internas em retas conectadas |
| 7 | Usar seletor de furos e botão Adicionar/Remover; Escape antes de soltar; soltar fora, navegar com central/Espaço e clicar referência adjacente | Ação equivalente por teclado; cancelamentos/navegação/referência sem mudanças; sem inclusão residual |
| 8 | Incluir eixo e encurtar parede além dele; abrir Diagnósticos; desfazer; repetir e Descartar ajuste | Coordenada/ID preservados com pendência, sem transferência; desfazer reativa; descarte elimina somente o ajuste; excluir/desfazer parede restaura dependentes |
| 9 | Baixar e importar em outro navegador; importar cópia M3.2 com canaletas suprimidas; ativar graute explicitamente | Arquivo versão 5, cópia independente e ajustes preservados; M3.2 inicia categorias desligadas, níveis/supressões intactos; ativação explícita |
| 10 | Bases 30/28 com d=100; distância menor que um módulo e Aplicar; Restaurar padrões com exclusão existente | EX-34 passos 90/98 cm, sem 105/112; alternativa explícita para d<m; restaurar configuração não apaga exclusão |

Limitações: representação nominal, sem dimensões físicas de furos/canais, resistência, aço, aprovação estrutural ou quantitativos. Lajes/múltiplos pavimentos permanecem em M4; cruz/transições sem suporte de M2 não foram ampliadas. Não houve auditoria completa de acessibilidade. M3.3 aguarda teste manual e aceite; M3.1/M3.2 continuam aprovados. Não iniciar M4 automaticamente.

### Verificação geral do projeto — 13/10/2026

Solicitação: revisar o estado atual e orientar a continuidade. Revisados PRD, arquitetura, plano, convenções pertinentes do caderno, domínio, coordenação de estado, persistência, pontos de integração do editor e testes. Nenhuma funcionalidade nova ou alteração de código nesta revisão. O estado atual contém M3.3 no commit `0e3dc1e`; a descrição de alterações locais no relatório anterior registra o momento daquela entrega. Há alterações preexistentes em `package.json`/`package-lock.json`, incluindo Vitest de `^3.2.0` para `^5.0.4`; preservadas e usadas nas verificações abaixo.

| Verificação pelo Codex | Resultado nesta revisão |
|---|---|
| `./Start-Ecovit.ps1 -Task typecheck` | Passou |
| `./Start-Ecovit.ps1 -Task lint` | Passou |
| `./Start-Ecovit.ps1 -Task test` | 125 testes passaram em 8 arquivos, com Vitest 5.0.4 |
| `./Start-Ecovit.ps1 -Task test:e2e` | 72 fluxos passaram, 36 em Chrome e 36 em Edge, em aproximadamente 2,4 minutos |
| `./Start-Ecovit.ps1 -Task build` | Passou; JS 845,47 kB / 263,97 kB gzip; permanecem avisos de comentários do Zod e bundle acima de 500 kB |
| Inspeção visual | Captura gerada pelo e2e de janela/canaleta/graute em 1440×1000 inspecionada, com seleção, intervalos e controles legíveis; não equivale a auditoria completa de interface/acessibilidade |
| Teste manual do solicitante | Não realizado nesta revisão; aceite de M3.3 permanece pendente |

Não foram encontradas falhas impeditivas nos verificadores executados ou nos trechos revisados. O domínio continua independente de React/Konva/Zustand/Dexie. Histórico exclui resultados gerados; persistência mantém o fluxo sequencial e liberação de controles em falhas. Testes de navegador usam perfis isolados. Esta revisão não incluiu auditoria de vulnerabilidades de dependências, teste em instalação limpa ou comprovação da meta de três pavimentos/100 mil peças.

Observações para continuidade:

- O modelo, a validação de arquivo e várias funções de composição/editor usam explicitamente um único térreo (`floors[0]`); lajes ainda são uma coleção vazia. M4 exige evolução conjunta de dados, resultado por pavimento, seleção, histórico, dependências e migração. Não basta adicionar um seletor à interface.
- A proteção atual de geração limita a estimativa de células multiplicada pelas fiadas a 100 mil, não uma capacidade comprovada de 100 mil peças efetivas. As cargas aprovadas continuam úteis como regressão; a meta completa deverá ser medida no cenário de M4.
- Canvas e App concentram bastante código. Extrair responsabilidades concretas tocadas pela próxima entrega pode reduzir risco; não há necessidade demonstrada de reescrita ou nova biblioteca. O aviso de bundle pede avaliação de carregamento quando houver cenário de publicação, sem invalidar o build atual.

Próxima ação recomendada: executar o roteiro manual de M3.3 acima e registrar o retorno do solicitante. Depois, quando M4 for solicitado, detalhar somente seu primeiro incremento, consultando/pesquisando as transições verticais no caderno antes dos algoritmos. Uma sequência possível para discussão é pavimentos e migração; lajes e limites da alvenaria; sobreposição/alinhamentos e carga conjunta. Essa sequência é orientação, não novos marcos aprovados nem autorização de implementação. Quantitativos e duplicação de projetos continuam em M5; cruz e demais casos não suportados devem permanecer explícitos na avaliação de fechamento do PRD.

### Execução assistida do roteiro de M3.3 pelo Codex — 13/10/2026

A pedido do solicitante, executados fluxos reais no navegador por Playwright, com perfis isolados e projetos sintéticos, downloads e reabertura. Não usados projetos pessoais. Esta é verificação do Codex, não execução manual/aceite do solicitante. Nenhuma mudança no código do aplicativo. Complementos locais reproduzíveis em `.tools/m33-review.spec.ts` e `.tools/m33-review.config.ts`, ignorados pelo Git; capturas `.tools/m33-roteiro-*.png` e arquivo efetivamente transportado `.tools/m33-transferencia.ecovit`.

| Passo do roteiro | Cobertura executada e resultado |
|---|---|
| 1 | Projeto criado pela tela, parede desenhada, quatro defaults/100 cm conferidos no download; Cancelar preservou configuração; Aplicar, Restaurar e Desfazer cobertos nos fluxos existentes. Passou. |
| 2 | Parede 400 cm, somente Intervalos: centros 106,25/206,25/306,25; habilitar Pontas acrescentou 6,25/393,75. Passou. |
| 3 | Hover de remover/adicionar inspecionado nas capturas; exclusão de 206,25 persistiu após mudar fiada, reabrir e recalcular, sem substituto. Reinclusão preservou ID. Passou. |
| 4 | Janela de EX-33: inclusão gerou [0,98) e [210,280); fiada 20 sem alvo; remoção na 35 retirou o eixo completo. Passou. |
| 5 | Furo na canaleta selecionável; supressão e restauração conservaram grautes, com peças da fiada restauradas; Selecionar encerrou Graute. Passou. |
| 6 | L e T importados como geometrias de teste e editados pela interface: um eixo compartilhado entre duas paredes, remoção/reinclusão por clique. Laterais de janela em 93,75/206,25; reta conectada com pontas só em 6,25/193,75. Passou. |
| 7 | Seletor e botão focado acionado com Enter adicionaram/removeram; Escape, soltura fora, navegação central e Espaço e referência sem edição cobertos por fluxos de navegador. Passou. |
| 8 | Encurtamento preservou ajuste pendente, diagnóstico/descarte/desfazer verificados; excluir parede pela tela removeu ajuste e desfazer restaurou parede, ID e graute. Passou. |
| 9 | Arquivo baixado do Chrome e importado efetivamente no Edge, com novo ID de projeto e composição/ajustes iguais. Legado M3.2 migrou com categorias desligadas e supressão preservada; Restaurar padrões/Aplicar ativou graute explicitamente sem apagar supressão. Passou. |
| 10 | Bases 30/28: posições e passos 90/98 cm conferidos no navegador e domínio; d=12 cm ofereceu explicitamente módulo 15/14 cm e só mudou após escolha. Restaurar configuração com exclusão preservada coberto na suíte existente. Passou. |

Resultados: `./Start-Ecovit.ps1 -Task test` passou com 125 testes. Suíte geral de navegador: 71/72 passaram na primeira rodada; a carga M2 no Edge teve `download.path: canceled` e arquivos de trace ausentes enquanto a execução complementar usava a mesma pasta de saída. Conflito de artefatos atribuído à execução simultânea dos verificadores, não a uma falha de geometria constatada. Configuração complementar passou a usar saída separada; o teste afetado passou sozinho na repetição (42 mil peças, 1.498 ms no fluxo medido). Os 16 fluxos de M3.3 da suíte geral passaram, oito por navegador. Complementos: sete passaram inicialmente, nove passaram na rodada ampliada e o décimo, adicionado para Enter/exclusão de parede, passou isoladamente. Não se declara uma nova rodada completa de 72/72 após a correção da execução.

Capturas de pontas, encontros L/T, hover +/− e importação no Edge inspecionadas. Marcadores, preenchimento, seleção e intervalos legíveis no cenário de 1440×1000. O T conserva informação de ligação complementar, conforme escopo aprovado. Carga M3.3 desta rodada: 100 janelas, 200 eixos e 300 intervalos; 1.519 ms em Chrome e 1.538 ms em Edge, incluindo abertura/importação/geração/salvamento e com verificações concorrentes; não é benchmark isolado.

Não encontrada falha do aplicativo nos cenários verificados. Pendente do solicitante: avaliar conforto dos gestos e leitura no monitor/zoom habitual, experimentar um projeto representativo próprio com backup e confirmar o aceite de M3.3. A automação dos passos e a inspeção de capturas não encerram essas avaliações. M4 não iniciado.

### Aceite global de M3.3 — 13/10/2026

O solicitante declarou: **“ok. registre o aceite o m3.3”**. Registrado aceite global de M3.3, concluindo a aprovação dos três incrementos de M3 no alcance nominal acordado. Esse aceite substitui as pendências globais de aprovação nos relatórios históricos, preservando os resultados reais das verificações do Codex. Não foram informados resultados individuais por passo do roteiro manual nem uma auditoria de acessibilidade; não se atribui ao solicitante a execução dos testes automatizados.

Mantidas as limitações documentadas: sem dimensionamento estrutural, cruz/transições ainda não suportadas, lajes/múltiplos pavimentos em M4 e quantitativos em M5. M4 permanece a detalhar mediante solicitação própria; o aceite não inicia sua implementação.

Atualizados os estados atuais no plano, PRD, arquitetura, caderno técnico e README. Revisão documental de consistência e `git diff --check`; sem alteração de código ou repetição dos testes do aplicativo.

## 8. M3.4 — Evolução da edição no canvas

**Data:** 13/10/2026. **Estado:** implementado na versão 0.6.0, aguardando teste manual/aceite. Implementação solicitada após a revisão documental; M3.3 permanece aprovado. A prioridade solicitada é ajustar a edição antes de M4. Não foi autorizado implementar M4 nem os demais marcos.

### Escopo e referências

Três ajustes no aplicativo existente: criar continuidade que prolonga/une paredes compatíveis; mover parede com dependentes por arraste e prévia; destacar o módulo de início das quatro ferramentas de criação. Fonte de comportamento: [PRD §21](Ecovit-PRD.md#21-m34--evolução-da-edição-no-canvas--13102026); transformações e exemplos: [Caderno §9](Ecovit-Caderno-Tecnico.md#9-m34--convenções-de-edição-geométrica--13102026); dados, migração e execução: [Arquitetura §16](Ecovit-Arquitetura-Tecnica.md#16-contratos-de-m34--evolução-da-edição--13102026). Preservar RF existentes. Este plano organiza a entrega, sem repetir contratos completos.

D34-01 e D34-02 foram confirmadas pelo solicitante durante a preparação: supressões de canaleta ficam nos trechos originais ao unir; ajuste manual de graute compartilhado fica nas paredes imóveis e é copiado com a parede movida. Demais regras de compatibilidade, identidade, cancelamento e limites estão especificadas nas referências e serão verificadas nos critérios abaixo. Nenhuma nova regra construtiva foi criada.

Fora deste recorte: dividir/rotacionar paredes, selecionar/mover grupos, união ao redimensionar, consolidação geral de arquivos antigos, solução genérica de sobreposições, edição de tijolos, ampliação do catálogo de encontros, lajes, pavimentos e quantitativos. União ao mover faz parte do escopo: posicionar em continuidade colinear compatível consolida a cadeia. Paredes incompatíveis mantêm entidades distintas com motivo na prévia. Novo feedback poderá revisar o recorte explicitamente antes de sua implementação.

### Tarefas

- [x] **M3.4-T01 — Especificação:** atualizar PRD, arquitetura, caderno, plano, AGENTS e indicação de disponibilidade no README; registrar decisões de preservação.
- [x] **M3.4-T02 — Contratos e migração:** arquivo v6/nominal-v7, supressões wall/range, IDs/âncoras/vínculos de encontros, registros de graute coincidentes, validação de estrutura/alcance e convenções antigas; preservar snapshots originais e bloqueio entre abas. Evoluir os comandos e o commit para impedir dupla reconciliação de vãos ou perda de dependentes absorvidos.
- [x] **M3.4-T03 — Continuidade/união:** operação de domínio, compatibilidade, identidade sobrevivente, remapeamento de dependentes, prévia e confirmação pelos gestos de criação e movimento.
- [x] **M3.4-T04 — Movimento:** translação modular, dependentes exclusivos/compartilhados, união no destino, prioridade dos alvos, cancelamentos e integração atômica com histórico/fluxo sequencial.
- [x] **M3.4-T05 — Hover inicial e ajustes herdados:** destaque nas quatro ferramentas, ocultação por modo/estado, identificação e restauração de supressões herdadas na Fiada.
- [x] **M3.4-T06 — Verificação e entrega:** critérios abaixo, regressões pertinentes, inspeção visual, relatório real, roteiro para solicitante e aceite separado.

### Critérios de aceite

| ID | Resultado verificável |
|---|---|
| M3.4-A01 | Extensão por criação mantém uma parede e ID; ponte entre duas compatíveis consolida a cadeia; ambos os sentidos, horizontal/vertical e diferentes lados equivalentes — EX-36/37. |
| M3.4-A02 | Distância não desenhada/ocupada, altura/faixa incompatíveis e sobreposição não geram união indevida; motivo da incompatibilidade na prévia; ramal perpendicular preservado. Sem união global ao reabrir/importar nem por redimensionamento — EX-41. |
| M3.4-A03 | Sobrevivente determinístico, seleção atualizada, IDs de vãos/ajustes preservados e referências remapeadas; vãos não mudam posição mundial; desfazer/refazer recupera exatamente entidades e IDs — EX-37. |
| M3.4-A04 | União mantém supressão nos trechos originais, ponte não suprimida; extensão de entidade única conserva alcance wall; novas remoções cobrem parede inteira mesmo havendo ranges; restauração por UUID preserva outros ajustes na mesma parede/cota. Faixas/células/origens sem duplicação — EX-38/44. |
| M3.4-A05 | Arrastar corpo em Selecionar move só parede e dependentes com prévia modular; sem união, comprimento/orientação/altura/offset/cotas e IDs exclusivos preservados; vizinhas imóveis. Destino em continuidade compatível une a cadeia, preservando posições mundiais de destino e atualizando seleção/offsets; movimento+união em um gesto e um histórico — EX-39/43. |
| M3.4-A06 | Ajustes compartilhados de inclusão/exclusão conservam original nas paredes imóveis e cópia transladada com novo ID na movida; undo/redo preservam identidade; exclusão coincidente prevalece independentemente da ordem; clique muda apenas registros elegíveis preservando IDs e descarte age por ID; limites sem perda de intenção — EX-40/45. |
| M3.4-A07 | Clique simples seleciona; alças/vãos/seletor de sobrepostos mantêm prioridade; navegação não move; Escape/blur/soltura fora cancelam, zero delta sem histórico; bloqueios respeitados — EX-41. |
| M3.4-A08 | Destaque corresponde à célula que contém o centro da cruz nas quatro ferramentas, inclusive coordenadas negativas; a criação inclui a célula inteira em ambos os sentidos, inclusive arraste inverso pela extremidade; hospedeira ambígua exige escolha; zoom/câmera/ferramenta atualizam hover sem novo mousemove; hover não salva/calcula/historiciza e não fica preso — EX-42/48/49/50. |
| M3.4-A09 | Encontros e automáticos recompostos sem transportar peças; escolhas preservadas com ID/âncora e vínculo verificável, sem colisão de componentId apagar registros; intenções incompatíveis localizáveis e descartáveis individualmente; conflitos entre vãos reunidos não apagam trabalho — CT-11/EX-46/47. |
| M3.4-A10 | Arquivos v1–v5 validados com schemas/motores originais antes da migração; defaults/IDs/supressões preservados; v6 nominal-v7 executa todos os estágios e preserva ranges, escolhas e registros coincidentes após save/reopen/download/import; IDs duplicados, alcance não modular, referências órfãs e snapshots adulterados recusados; bloqueio entre abas preservado. |
| M3.4-A11 | Salvar/calcular/salvar e falhas do motor/duas gravações liberam controles e preservam memória/download; sem cálculo durante hover/prévia; histórico não guarda resultados gerados. |
| M3.4-A12 | Regressões M1/M2/M3.1–3.3, Chrome/Edge, bases 25/30/28 e módulo 12,51 cm, sentidos/lados, múltiplos ajustes e cancelamentos; limites sem truncamento; evidências automatizadas e aceite do solicitante registrados separadamente. |

### Verificações na implementação

Executar typecheck, lint, domínio/persistência, e2e pertinentes e build. Usar EX-36–48 com entradas/saídas independentes; conferir intervalos, posições mundiais, associações, cobertura e IDs, não apenas quantidade de paredes. Repetir transformações/reflexões e ordem/sentido do desenho para identidade determinística. Ensaiar supressões distintas/dormentes/concorrentes, vãos pendentes, ajustes include/exclude compartilhados, limites de cópias e diagnóstico de topologia alterada. Incluir movimento até uma ponta e até o intervalo entre duas paredes, prévia consolidada, cancelamento, desfazer/refazer e dependentes exclusivos/compartilhados; garantir ausência de gravação intermediária. Testar snapshots v5 antes da migração e v6 após ela, com adulteração e leitura bloqueada. Não exigir solução de cruz/transições excluídas nem testar dimensão resistente.

Gestos de navegador em perfis isolados; verificar hover, prévia e integridade do download após confirmação/cancelamento. Suítes complementares devem ter saídas de artefatos separadas ou executar sequencialmente para evitar o conflito registrado na execução assistida de M3.3. Medir carga pertinente à edição sem declarar desempenho de M4. Só extrair responsabilidades concretas necessárias; sem nova biblioteca, Worker ou protótipo separado.

### Roteiro manual após implementação

| Passo | Ação | Esperado |
|---|---|---|
| 1 | Desenhar A de 100 cm; prolongar até 200; repetir em vertical e sentido inverso | Prévia do total; uma parede; ID mantido; desfazer volta a 100 — A01. |
| 2 | Duas paredes [0,100) e [200,300); inserir ponte; incluir janela na segunda antes | Uma parede 300, janela no mesmo lugar; desfazer/refazer restaura dependências — A01/A03. |
| 3 | Repetir com alturas/lados incompatíveis e ramal perpendicular | Incompatibilidade visível, paredes distintas; ramal não desaparece — A02. |
| 4 | Suprimir canaleta só de A e fazer ponte; remover faixa da consolidada e restaurar este último ajuste | Herança restrita a A; nova remoção integral; restauração não apaga a herança — A04. |
| 5 | Selecionar e mover parede com janela/graute por 25×50 cm; Escape, soltura fora e desfazer | Prévia inclui vãos; cancelamentos intactos; só parede escolhida se move — A05/A07. |
| 6 | L com inclusão e depois exclusão compartilhada; mover uma das paredes e desfazer/refazer | Intenção imóvel mais cópia transladada, IDs recuperáveis e vizinha imóvel — A06/A09. |
| 7 | Passar cursor nas quatro ferramentas, mudar zoom, navegar, sair do canvas | Célula de início legível e correspondente ao gesto; nenhum efeito no projeto — A08. |
| 8 | Reabrir, baixar/importar e conferir supressões/ajustes após edição; testar cópia antiga | Integridade e migração corretas; nenhum arquivo original modificado — A10. |
| 9 | Mover C para uma ponta compatível e depois repetir preenchendo o intervalo entre A/B, com janela/supressão em C; cancelar, confirmar e desfazer/refazer | Prévia consolidada; uma parede ao confirmar; dependentes no destino, supressão no trecho transladado, um único desfazer restaura paredes separadas — A05/EX-43. |

### Registro documental

PRD 0.14, arquitetura 1.7 e caderno revisão 10 atualizados. AGENTS permite a nova evolução sem liberar divisão/edição de tijolos. README distingue funções implementadas de especificadas. Aceites e relatos anteriores preservados. Revisão de consistência, referências locais e `git diff --check`; nenhum teste do aplicativo executado por se tratar apenas de documentação. Implementação, verificação de código, roteiro manual e aceite de M3.4 permanecem pendentes; M4 não iniciado.

Refinamento solicitado em 13/10/2026: união automática também ao mover para continuidade compatível, substituindo a delimitação inicial ao desenho. Atualizados PRD §21, Arquitetura §16, CT-11/EX-43, tarefas, critérios e roteiro. Mantidas D34-01/02 e a exclusão de união por redimensionamento. Revisão documental; nenhuma implementação iniciada.

### Revisão de prontidão de M3.4 — 13/10/2026

Revisados contratos contra `project.ts`, `openings.ts`, `grout.ts`, `channels.ts`, `composition.ts`, `files.ts`, `store.ts`, Canvas e Fiada. Não foram alterados arquivos de código. Identificados e fechados os seguintes pontos de integração na Arquitetura §16 e nos critérios existentes, sem renumerá-los:

| Ponto encontrado no código vigente | Contrato de M3.4 e verificação |
|---|---|
| commit aplica reconcileOpenings a toda mudança de parede, inclusive um candidato já transladado | Tipo explícito de comando; transformar uma vez e preservar offsets/posição conforme operação — A03/A05/A11. |
| Filtros do store eliminam dependentes de IDs ausentes, podendo confundir absorção por união com exclusão | Remapear primeiro; validar relações no candidato final; ID sobrevivente retornado à seleção — A03/A09/A10. |
| Supressão é única por parede/cota, e restoreBand elimina todos os registros do alvo | v6 admite alcances múltiplos com IDs distintos; adicionar wall apesar de ranges; restaurar só ID escolhido — A04/A10, EX-38/44. |
| Graute é único por coordenada; toggle remove todos os registros e applyGrout depende da ordem das ações | Validação v6 permite intenções coincidentes; inclusões antes de exclusões; clique atualiza elegíveis preservando IDs — A06/A10, EX-45. |
| Escolhas de encontro só têm componentId/signature, dependentes da segmentação/IDs; não há identidade própria nem âncora persistida | UUID/anchor/binding, critério conservador de correspondência geométrica, pendências localizáveis e descarte individual — A09/A10, EX-46. |
| Motor contém condições explícitas para cada nominal-vN; novo enum sozinho deixaria estágios de fora | Incluir pipeline completo v7, manter algoritmos/schemas antigos para validar snapshots — A10/A12. |
| Vãos válidos em hospedeiras separadas podem ficar incompatíveis depois de consolidadas | Tratar transformação como edição indireta, conservar vãos/IDs e diagnosticar; não usar putOpening para apagar/bloquear intenção — A03/A09, EX-47. |
| makeWall gera UUID durante a prévia, seleção atual usa preview.id e alvo de vão pega primeira hospedeira | Planejamento sem IDs persistentes, ID final retornado ao editor, escolha de hospedeira explícita e mesma âncora de hover/gesto — A03/A07/A08, EX-48. |

Também explicitados extensão simples versus consolidação para o alcance de supressão, altura do trecho novo quando houver incompatibilidade direta, fim da propagação em cadeia incompatível, delta relativo ao ponto de pega e prioridade das alças. União por redimensionamento e sobreposição positiva continuam fora do recorte especificado; união por movimento permanece incluída.

EX-44–48 acrescentados ao caderno e incorporados aos critérios existentes. Na implementação, verificar tanto operações em memória quanto exportação/reabertura; nenhuma pendência de decisão de produto identificada nos casos revisados. Os contratos estão prontos para orientar a implementação solicitada, sem garantir ausência de erros de código futuro. M3.4 ainda não implementado, testado ou aceito. As verificações desta revisão foram documentais: consistência de contratos, exemplos e referências, links locais e git diff --check; nenhum teste do aplicativo ou instalação de dependências.

### Organização do AGENTS.md — 13/10/2026

Por solicitação, AGENTS.md passa a concentrar orientações de trabalho, consulta às referências e validação. Retiradas as cópias de regras de produto/arquitetura e a referência específica a M3.4; substituídas por instruções para usar e atualizar o documento responsável. PRD, arquitetura e caderno continuam sendo as fontes dessas regras; nenhum comportamento, escopo ou aceite foi alterado. Preservadas orientações contra ampliação silenciosa, invenção de regras construtivas e implementação sem solicitação. Revisão documental e `git diff --check`, sem mudança de código ou testes do aplicativo.

### Relatório de implementação de M3.4 — 13/10/2026

Solicitação: registrar commit e depois implementar M3.4. Commit preparatório **3cdaa2e** reuniu documentação/aceite de M3.3, especificação/revisão de M3.4, organização do AGENTS e atualização local do Vitest já verificada. Nenhum push foi solicitado/executado. Implementação posterior permanece no working tree para teste, sem segundo commit automático.

Aplicativo versão **0.6.0**. Operações de domínio em `src/domain/wall-editing.ts`: criação de continuidade prolonga/une a cadeia compatível; movimento translada uma parede com seus dependentes e une no destino. Preview usa a mesma geometria, sem geração de fiadas ou UUID persistente; confirmação retorna o ID sobrevivente. União não depende de ordem/sentido, respeita face/faixa/altura/pavimento, mantém ramais e diagnostica incompatibilidades/sobreposição. Alças continuam prioritárias; para criar sobre a ponta selecionada, limpar seleção primeiro. Redimensionar não dispara união.

Planta/Selecionar permite arrastar corpo da parede. Janela/porta/vão acompanha o movimento; vãos imóveis mantêm posição mundial após unir. Remapeamento precede filtros de exclusão e commit move/create evita dupla reconciliação de offsets. Cancelamentos, navegação, clique simples e delta zero preservam documento. Graute manual compartilhado é desdobrado em original imóvel e cópia transladada; inclusões/exclusões coincidentes são preservadas, com exclusão prevalecendo independentemente de ordem. Desfazer/refazer recupera IDs/associações e o estado anterior à união/movimento em uma operação.

Supressão wall segue extensão simples. Consolidação de duas ou mais existentes converte wall em range herdado, limitado ao trecho original ou já transladado. Remoção completa posterior é independente de ranges; restauração usa UUID e não elimina as demais intenções da mesma parede/cota. Fiada identifica alcance herdado/parede inteira. Escolhas de encontros têm UUID, âncora e binding; mudanças de topologia conservam pendências localizáveis, com descarte individual e opção global explicitamente rotulada. Componentes independentes permanecem disponíveis.

Quadrado cinza de início em Parede/Porta/Janela/Vão, alinhado ao alvo real. Abertura pela extremidade final mostra última célula interior com âncora final; alvo múltiplo exige seleção de hospedeira antes de novo arraste. Zoom/câmera/ferramenta recalculam destaque sem modificar projeto. Correção visual após captura: camada cinza passou para cima do desenho, pois ficava encoberta pela parede.

Arquivo **v6 / nominal-v7**; schema vigente exige scope de canaleta e identidade/âncora/binding de encontro. Domínio aceita representação antiga para conferir convenções anteriores. Leitura v1–v5 valida snapshot original antes de migrar; preserva geometrias/IDs/configurações, sem união geral ou ativação de categorias desligadas. Em leitura bloqueada, preserva resultado antigo desatualizado, sem salvar/calcular. Tabela IndexedDB e limite de arquivo 50 MB mantidos. Aplicativos anteriores rejeitam v6 como versão futura; manter backup de arquivos antigos. Download/importação não modifica arquivo fonte.

#### Verificações reais pelo Codex

| Verificação | Resultado |
|---|---|
| `./Start-Ecovit.ps1 -Task typecheck` | Passou, incluindo última ampliação dos testes de navegador |
| `./Start-Ecovit.ps1 -Task lint` | Passou, sem erros/avisos |
| `./Start-Ecovit.ps1 -Task test` | **152 passaram**: 125 regressões atualizadas ao contrato vigente, 24 testes de domínio M3.4 e 3 de estado/histórico/falha M3.4 |
| `./Start-Ecovit.ps1 -Task test:e2e` | Rodada completa **82 passaram**, 41 por navegador: 72 regressões + 10 fluxos iniciais de M3.4. Depois de ampliar o teste de zoom e acrescentar carga/hospedeira ambígua, **6 verificações pertinentes passaram** (3 por navegador). Suíte atual contém 86 casos; não se declara nova execução integral de 86 após essa ampliação |
| `./Start-Ecovit.ps1 -Task build` | Passou; JS 857,94 kB / 267,75 kB gzip. Permanecem avisos conhecidos de comentários de otimização do Zod e bundle maior que 500 kB |
| Inspeção visual | Capturas de ponte, movimento/união com janela e célula cinza em 1440×1000 inspecionadas; comprimento total, posição da janela e marcador legíveis. Capturas `.tools/m34-*.png`, ignoradas pelo Git |
| Carga de edição | 100 paredes, 40 fiadas, 42 mil peças; mover uma parede em **1.214 ms Chrome / 1.251 ms Edge**, incluindo gesto e salvar/calcular/salvar. Conferidas extremidades, vizinhas intactas e contagem no download. Não é benchmark isolado ou garantia para outros computadores/M4 |
| Servidor | HTTP 200 em `http://127.0.0.1:5173/` |
| Documentação/Git | Estados atuais e README atualizados, referências locais e `git diff --check` conferidos; sem alteração de escopo de M4 |
| Teste manual/aceite do solicitante | **Pendente**; não atribuído resultado individual ou aceite automaticamente |

Rodadas intermediárias identificaram falhas corrigidas antes da entrega: enum de composição v7 incompleto na validação, restrição antiga de coordenada única para grautes, ajustes dos fixtures/expectativas para v6, seleção de parede em sobreposição que estava omitindo o seletor, e camada de hover encoberta. Uma rodada de regressão durante edição teve 69/72 e um timeout de download no Chrome; a rodada completa estabilizada de 82 passou após as correções, assim como as ampliações pertinentes. Casos que antes recusavam duplicata de coordenada foram atualizados para recusar UUID duplicado; a coexistência legítima tem novo teste de ordem/precedência. Fixtures de arquivos antigos mantêm campos originais antes da migração, sem acrescentar scope/IDs novos artificialmente. Testes usam perfis isolados e documentos sintéticos, sem usar projetos pessoais.

#### Evidências por critérios

| Critérios | Alcance verificado |
|---|---|
| A01–03 | EX-36/37 em horizontal/vertical, dois sentidos/lados; ordem das paredes, sobrevivente, ponte, ramal preservado e undo/redo; browser confirma preview/arquivo/seleção |
| A04 | EX-38/44: extensão wall, herança range, novo wall apesar de range e restauração por ID, sem suprimir ponte/vizinha; domínio e Fiada |
| A05–07 | EX-39/40/41/43: delta modular, janela, vizinha imóvel, cópia compartilhada include/exclude, uma operação, Escape/blur/soltura fora/zero; estado verifica duas gravações e recuperação de falha |
| A08 | EX-42/48: quatro ferramentas, alvo inverso pela ponta final, zoom mantendo âncora, hospedeira múltipla sem inserção arbitrária e hover sem alterar documento; inspeção visual |
| A09 | EX-46/47: escolha com ID/âncora pendente após desconectar, descarte na interface; vãos conservados com diagnóstico de separação após união |
| A10–11 | Snapshot v5 conferido/adulteração recusada; regressões v1–v4, arquivo v6 de ranges/coincidências/pendências, ID duplicado e alcance não modular/orfão; commit explícito, histórico sem resultado e retry; regressões de quota/bloqueio entre abas |
| A12 | Bases 25/30/28 e módulo 12,51 no domínio, rotações/sentidos/lados, Chrome/Edge, 100 paredes na edição; verificações automatizadas separadas do aceite manual |

#### Limites e próximo teste

Sem lajes/pavimentos/quantitativos, divisão/rotação/grupos ou união por redimensionamento. União trata contato contíguo colinear, não sobreposição longitudinal positiva; paredes incompatíveis permanecem separadas. Cruz/transições sem suporte continuam diagnosticadas. Escolhas de encontro que perderem vínculo exigem revisão/descarte e não são transplantadas automaticamente. Modelo nominal, sem validação estrutural. Não realizada auditoria completa de acessibilidade nem desempenho de três pavimentos/100 mil peças.

Para testar: atualizar `http://127.0.0.1:5173/`, baixar backup antes de abrir projeto pessoal e seguir os nove passos do roteiro desta seção. Priorizar ponte entre duas paredes, movimento com união, janela/graute compartilhado e restauração individual das supressões herdadas; conferir conforto do drag/zoom e leitura do quadrado cinza no monitor habitual. M3.4 disponível para teste, aguardando aceite; M4 não iniciado.

### Correção de usabilidade do módulo inicial — 13/10/2026

Feedback do solicitante: destaque podia saltar para a célula vizinha sem o centro da cruz sair da célula atual; ao arrastar para cima/esquerda, o desenho não incluía o módulo inicialmente destacado. Diagnóstico: uso de Math.round para o vértice mais próximo e âncora fixa na borda inferior longitudinal. Correção solicitada e implementada no aplicativo, mantendo M3.4 aguardando aceite.

Nova regra: o hotspot da cruz seleciona a célula que contém o ponto por floor, incluindo coordenadas negativas. Parede/Porta/Janela/Vão compartilham identificação da célula na prévia e na pressão. Arraste conserva célula e posição bruta de pressão; direção escolhe a borda inicial e garante a célula inteira no elemento. Lado da espessura mantém a parede sobre a célula escolhida. O final continua modular; não se altera o comportamento de alças, movimento de parede ou movimento de vão. Na ponta final de hospedeira, a última célula interior é elegível. Pequeno deslocamento até 3 px não cria elemento; abertura considera delta longitudinal, sem criação por arraste puramente transversal. Conexão só é mostrada/efetivada no fim quando compatível com a faixa escolhida; não desloca o início para outro módulo. Prolongamento pode ser iniciado na célula livre contígua à ponta.

Funções de dados em `src/domain/drawing.ts`, integradas ao Canvas. PRD §21, Arquitetura §16, CT-11/EX-49/50, A08 e README atualizados. Sem evolução de arquivo ou convenção de composição; paredes/vãos salvos não são deslocados pela correção. Sem commit/push adicional.

Verificações reais:

- Tipos e lint passaram.
- **162 testes passaram**: 152 anteriores mais 10 de seleção por célula/negativas/bases 25/30/28/12,51, quatro sentidos/dois lados, abertura inversa e conexão que não deve deslocar a faixa inicial.
- Navegador: rodada completa com **88/90 passando**; os dois casos de seleção/exclusão L/T ainda procuravam rótulo de 100 cm do gesto antigo. Atualizada a expectativa para 112,5 cm, pois a parede desenhada para cima agora inclui o módulo inicial [100;112,5). **Ambos passaram na repetição isolada em Chrome/Edge.** Não se declara outra rodada integral de 90/90; todos os 90 cenários foram verificados após considerar essa repetição. Os quatro novos cenários de navegador exercitam várias posições dentro da mesma célula, quatro sentidos de parede e Porta/Janela/Vão em ambos eixos/sentidos, conferindo geometria no download.
- Build passou; JS 858,43 kB / 267,98 kB gzip. Avisos conhecidos de Zod/bundle grande permanecem.
- Documentação e git diff --check conferidos. Testes em perfis isolados e projetos sintéticos.

Pendente do solicitante: atualizar o aplicativo na mesma origem e conferir o centro da cruz nas metades/quadrantes de uma célula, depois desenhar para cima/esquerda e verificar a inclusão do módulo inicial. Conferir também prolongamento a partir de célula livre adjacente e conforto do encaixe/zoom. Esta verificação do Codex não constitui aceite manual.


### Ajuste de orientação dos rótulos de aberturas — 13/10/2026

Feedback do solicitante: rótulos de portas, janelas e vãos verticais devem acompanhar a orientação do elemento, à esquerda e ancorados embaixo, como indicado no print. Implementado no canvas: leitura de baixo para cima, origem na extremidade inferior visual, independente do sentido da parede; horizontais continuam acima. Mantido conteúdo tipo/base–topo, fonte de 11 px e folga de 5 px. Retângulos de colisão consideram rotação e métricas do texto; em conflito, deslocar para esquerda/cima sem perder âncora longitudinal. Mesmo renderer cobre prévia, movimento e redimensionamento. Painel transitório de medidas continua horizontal. Sem mudança de dados, formato de arquivo ou motor. PRD §21 e Arquitetura §16 atualizados.

Verificações do Codex: typecheck, lint e build passaram (avisos já existentes sobre anotações do Zod e tamanho do bundle). Verificação dirigida por Playwright em Chrome e Edge confirmou os três tipos em ambos eixos, parede vertical desenhada no sentido inverso, rotação, âncora inferior, afastamento e colisões horizontais/verticais; capturas conferidas visualmente. Regressões pertinentes de criação/edição de aberturas: **18 testes passaram**, nove por navegador, nos arquivos openings.spec.ts e drawing.spec.ts. Não houve nova execução integral da suíte de domínio ou de todos os fluxos e2e, pois a alteração está restrita à apresentação dos rótulos.

Teste manual do solicitante pendente: atualizar o aplicativo, conferir os três tipos em paredes verticais e horizontais no zoom habitual, incluindo prévia, movimento e redimensionamento. Textos podem ultrapassar a extensão de aberturas curtas e ficam sujeitos ao recorte do canvas; não reduzir fonte nem mudar os dados para acomodá-los. M3.4 continua aguardando aceite; M4 não iniciado.
