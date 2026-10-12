# Ecovit — Plano incremental de implementação

**Data:** 10 de outubro de 2026  
**Atualização de implementação:** 11 de outubro de 2026  
**Base:** [PRD 0.8](Ecovit-PRD.md) e [Arquitetura 1.1](Ecovit-Arquitetura-Tecnica.md)  
**Estado:** M1/E1 aprovada. M2/E2 implementada em 11/10/2026, verificada e disponível para teste local; aguarda aceite manual. M3/E3 não iniciada.

## 1. Como usar este plano

Cada entrega acrescenta uma funcionalidade testável ao aplicativo definitivo. E1 mantém sua especificação e relatório; E2 está detalhada na seção 5. As demais indicam apenas direção e dependências. M1/M2 são os nomes usados pelo solicitante para E1/E2; os IDs originais são preservados.

Fluxo: especificar a entrega → implementar → verificar os critérios pertinentes → disponibilizar roteiro de teste → incorporar feedback. A pesquisa construtiva precede os algoritmos correspondentes e será registrada no caderno técnico, por assunto. Não haverá prova técnica ou aplicativo experimental separado.

O plano organiza a implementação parcial do PRD; um requisito atendido parcialmente não será marcado como integralmente concluído. E1 foi aprovada pelo solicitante e E2 foi posteriormente autorizada e implementada; resultados na seção 6. E3 não foi iniciada.

## 2. Sequência das entregas

| Entrega | Resultado disponível no aplicativo | Referências principais | Dependência | Estado |
|---|---|---|---|---|
| E1 — Planta editável e persistência | Criar projeto, desenhar/editar paredes, desfazer, salvar e transportar arquivo | RF-01/02/03/08/09/11/12, nos recortes abaixo | Nenhuma | Aprovada pelo solicitante em 10/10/2026 |
| E2 — Composição e inspeção de fiadas | Catálogo nominal, retas, L, retângulo, T básico, transição simples de alturas, inspeção e persistência; cruz apenas reconhecida e diagnosticada | RF-01/03/04/05/09/10, persistência RF-11/12 | E1 e definições P1–P5 do caderno | Implementada; relatório na seção 6; aceite manual pendente |
| E3 — Vãos e elementos construtivos | Portas, janelas e vãos integrados à composição; canaletas e grauteamentos automáticos e ajustáveis | RF-04/06/07/09/10 | E2 e pesquisa dos elementos correspondentes | A detalhar |
| E4 — Lajes e múltiplos pavimentos | Lajes, limites verticais, até três pavimentos e verificação dos alinhamentos | RF-08/13 e propagação dos RF-04/05/07 | E3 e pesquisa de transições verticais | A detalhar |
| E5 — Consulta e conclusão da primeira versão | Quantitativos, duplicação de projetos e fechamento dos cenários restantes do PRD | RF-10/11/12 e cenários de aceite | E4 | A detalhar |

Persistência, integridade e verificações evoluem junto com cada entrega. E5 não adia correções ou testes das entregas anteriores. A ordem poderá ser ajustada por feedback, com registro neste plano.

## 3. E1 — Planta editável e persistência

### Objetivo observável

O usuário cria um projeto com um térreo, desenha quatro paredes ortogonais, altera o comprimento por qualquer extremidade, desfaz uma alteração e reabre o mesmo desenho pelo navegador ou pelo arquivo `.ecovit`.

O aplicativo desta entrega é um editor de geometria de paredes. Ainda não gera tijolos ou comprova fechamento construtivo dos encontros; não exibirá classificação “geometricamente válido”, fiadas ou quantitativos fictícios.

### Requisitos associados e alcance

| Referência | Incluído em E1 | Parte que permanece para depois |
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

- Tela simples para criar, nomear, listar e abrir projetos locais. Duplicação de projeto fica para E5.
- A criação pede nome e tamanho-base; abre diretamente o térreo. Propriedades verticais começam visíveis e editáveis, com valores iniciais apresentados como conveniência de desenho, sem parâmetro estrutural ou promessa de compatibilidade de fiadas. Registrar os valores adotados na implementação; não inferir junta nula.
- Planta usa Selecionar e Parede, zoom, deslocamento do canvas e enquadramento. Recursos futuros não aparecem como botões desabilitados.
- Paredes têm ID estável, duas extremidades da face externa na malha, lado da espessura e altura. A espessura equivale à largura-base. A prévia permite inverter o lado; redimensionar não troca a face de referência.
- Soltar um arraste confirma uma parede de no mínimo um módulo; Escape cancela. Perda de foco cancela o gesto, sem alteração parcial. Soltar fora do canvas encerra o gesto sem deixá-lo preso; a implementação deve adotar cancelamento nesse caso.
- Alvos de conexão alinham faces externas no canto em L e permitem encostar uma extremidade no meio de outra parede em T. São conexões geométricas: preservar IDs e deixar a composição de tijolos para E2. A seleção de faixas coincidentes deve permitir escolher a parede desejada.
- Redimensionar mantém orientação, face e extremidade oposta. Não permitir cruzar a extremidade fixa ou criar comprimento menor que um módulo. O campo de comprimento indica qual extremidade muda e oferece alternativas modulares antes da confirmação.
- Cada alteração confirmada é uma operação no histórico, inicialmente limitado a 50. Zoom, seleção e prévia não entram no histórico. Desfazer/refazer também salva o modelo resultante. Reabrir não restaura o histórico anterior.
- Salvar após cada alteração persistente confirmada, uma operação por vez. E1 ainda não executa motor: manter `generated` ausente/nulo e resultado desatualizado, sem simular cálculo ou fazer uma segunda gravação desnecessária. O fluxo completo de salvar/calcular/salvar começa em E2.
- Arquivo segue o envelope da arquitetura, com `format`, `schemaVersion`, `project`, `model`, `adjustments`, `generated`, `generationState` e `metadata`. Coleções ainda não implementadas ficam vazias. O esquema deve evoluir explicitamente, com migração quando necessária, para preservar arquivos produzidos em E1.
- Validar arquivo, tamanho máximo de 50 MB, relações e medidas antes de substituir o documento aberto. Rejeitar versões ou conteúdo ainda não suportados; não descartar entidades desconhecidas silenciosamente.
- Para E1, importar um arquivo cria uma cópia local com novo ID de projeto, preservando IDs dos elementos e suas relações internas. Assim, reimportar um backup não sobrescreve o projeto local existente. Esta é uma decisão operacional desta entrega.
- Bloqueio por projeto impede edição em duas abas. Se o armazenamento falhar, preservar a memória, informar o problema e permitir download do documento atual. Sem sincronização entre abas.

### Tarefas de implementação de E1

Tarefas executadas em E1; não são entregas separadas nem autorizam antecipar E2.

- [x] E1-T1: criar a base React/TypeScript/Vite com as dependências necessárias, scripts de validação e README para execução local; criar módulos somente quando usados.
- [x] E1-T2: definir os dados mínimos do projeto, térreo e paredes, conversões de unidades, validação modular e operações de edição independentes da interface.
- [x] E1-T3: implementar criação/abertura de projeto, canvas, malha, prévias, alvos de conexão, seleção e edição das paredes.
- [x] E1-T4: integrar histórico, atalhos, navegação e tratamento de cancelamento/perda de foco.
- [x] E1-T5: implementar salvamento local, bloqueio de segunda aba, formato nativo, validação de importação e download após falha de armazenamento.
- [x] E1-T6: executar verificações pertinentes, corrigir falhas e disponibilizar o aplicativo com instruções e roteiro abaixo; atualizar o andamento com evidências reais.

### Critérios de aceite

| ID | Resultado verificável |
|---|---|
| E1-A01 | Os dois tamanhos iniciais criam malhas de 12,5 cm e 15 cm. Um tamanho personalizado 28 × 14 × 7 cm cria módulo de 14 cm. Medidas não positivas, proporção inválida ou precisão não representável são recusadas com explicação. |
| E1-A02 | Criar um projeto abre o térreo, preserva nome e base e permite consultar/editar suas propriedades sem cadastrar outros pavimentos. |
| E1-A03 | Arrastes criam apenas paredes horizontais/verticais, com referência externa modular e espessura correta. Inverter o lado na prévia altera apenas o lado ocupado pela faixa. |
| E1-A04 | Um L alinha as faces no canto; um T encaixa no alvo indicado. Selecionar uma parede mantém seu ID e permite distinguir paredes na área compartilhada. Não há indicação de composição construtiva validada. |
| E1-A05 | Ambas as alças redimensionam mantendo a outra ponta e a face fixas. Comprimento numérico incompatível oferece alternativas sem alteração silenciosa. Cruzar a ponta fixa ou reduzir abaixo de um módulo não gera parede inválida. |
| E1-A06 | Excluir, desfazer e refazer restauram geometria e IDs. Cada arraste é uma única ação. Navegação não altera o documento; Delete e atalhos do canvas não interferem na digitação. |
| E1-A07 | Escape, perda de foco e soltura fora do canvas cancelam sem resíduos; o próximo desenho funciona normalmente. |
| E1-A08 | Após indicação de salvamento concluído, recarregar e reabrir preserva nome, base, pavimento, coordenadas, lados e alturas das paredes. |
| E1-A09 | Baixar e carregar em outro navegador preserva os dados de desenho e cria uma cópia local. O arquivo não contém nós Konva, histórico ou estado de mouse. |
| E1-A10 | Arquivo inválido, versão não suportada ou limite excedido é rejeitado sem substituir o trabalho aberto. Falha de armazenamento preserva a edição em memória e permite baixá-la. |
| E1-A11 | A segunda aba não pode editar o mesmo projeto enquanto a primeira mantém o bloqueio. Após fechar a primeira e reabrir na segunda, a edição pode continuar. |
| E1-A12 | Canvas ocupa a maior parte da tela; propriedades são contextuais, controles têm rótulos acessíveis e a edição funciona em Chrome e Edge desktop. Não há ferramentas futuras ou quantitativos inventados. |

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
| 1 | Criar “Teste E1” com tijolo 25 × 12,5 × 7 cm. Consultar propriedades do térreo. | Térreo imediato, módulo de 12,5 cm, nome/base e propriedades visíveis — A01/A02. |
| 2 | Desenhar quatro paredes formando um retângulo de dimensões externas 400 × 300 cm, com espessura para dentro. | Comprimentos modulares e referências externas alinhadas; espessura 12,5 cm — A03/A04. |
| 3 | Criar uma parede que termine no meio de outra e selecionar cada uma na conexão. | Prévia de conexão em T; seleção permite distinguir as paredes — A04. |
| 4 | Em uma parede isolada de 200 cm, estender uma extremidade em 25 cm; depois a outra em 25 cm. | Comprimentos de 225 e 250 cm; a extremidade oposta fica fixa a cada operação — A05. |
| 5 | Informar 203 cm nessa parede; escolher uma das alternativas apresentadas, 200 ou 212,5 cm. Tentar reduzir abaixo de 12,5 cm. | Sem arredondamento silencioso; não confirmar parede menor que um módulo — A05. |
| 6 | Excluir a parede isolada; desfazer e refazer. Desfazer um redimensionamento completo. | Restauração correta; um gesto corresponde a uma ação — A06. |
| 7 | Iniciar um desenho e pressionar Escape. Repetir soltando fora do canvas e alternando de janela durante o gesto. Desenhar novamente. | Nenhuma parede residual ou ferramenta presa — A07. |
| 8 | Usar zoom e Espaço + arraste; digitar no nome do projeto e usar Delete no campo. | Geometria intacta; digitação não exclui paredes — A06/A12. |
| 9 | Aguardar “Salvo”, recarregar e abrir “Teste E1”. | Desenho, lado da espessura, medidas e propriedades preservados — A08. |
| 10 | Baixar `.ecovit`, abrir o outro navegador e carregar o arquivo. Reimportá-lo também no navegador original. | Mesmo desenho; importação como cópia, sem sobrescrever o original — A09. |
| 11 | Tentar carregar um arquivo de texto que não seja um projeto válido enquanto o desenho estiver aberto. | Erro compreensível e projeto atual intacto — A10. |
| 12 | Abrir o mesmo projeto local em duas abas. Fechar a primeira e reabrir na segunda. | Segunda aba inicialmente impedida de editar; edição liberada após encerrar a primeira — A11. |
| 13 | Criar projetos separados com base 30 × 15 × 7 e 28 × 14 × 7 cm; tentar também 28 × 15 × 7 e altura zero. | Módulos de 15 e 14 cm; entradas incompatíveis recusadas — A01. |

Falha de armazenamento, arquivo maior que o limite e versão futura serão cobertos pelas verificações automatizadas; não é necessário manipular o armazenamento do navegador para o teste manual comum. Registrar feedback por passo, resultado observado e resultado esperado.

### Conclusão e andamento

E1 estará pronta para teste do solicitante quando seus critérios tiverem evidências de verificação, o aplicativo abrir localmente e as instruções de execução estiverem disponíveis. A conclusão após teste manual será registrada somente com o retorno do solicitante. Uma pendência não deve ser escondida por marcar toda a entrega como concluída.

| Item | Estado atual |
|---|---|
| Especificação de E1 | Preparada nesta revisão |
| Implementação | E1 aprovada; E2 implementada (relatório na seção 6) |
| Comandos e testes automatizados | Implementados; resultados no relatório abaixo |
| Teste manual do solicitante | Aprovação global recebida em 10/10/2026; sem checklist individual informado |
| Próxima ação | Testar M2 conforme seção 5; consultar resultados na seção 6 |

## 4. Relatório da implementação de E1 — 10/10/2026

### Resultado entregue

Aplicativo React/TypeScript com canvas Konva, geometria independente da interface, estado Zustand, IndexedDB via Dexie e arquivo validado com Zod. Inclui criação/listagem/abertura de projetos, dois tamanhos-base e dimensões personalizadas, térreo editável, paredes pela face externa, alças A/B, comprimento numérico com alternativas, exclusão, desfazer/refazer, salvamento automático e transporte por `.ecovit`.

O arquivo não contém composição gerada. O aplicativo identifica essa limitação e não oferece Fiada, vãos, lajes, grauteamentos ou quantitativos. Não houve implementação de E2.

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

A navegação não persiste zoom/posição entre sessões. Para iniciar uma nova parede exatamente sobre a alça de uma parede selecionada, limpe a seleção primeiro; alças têm prioridade conforme o PRD. O conforto desse gesto deve ser avaliado no seu teste. Ainda não foi medida a carga de 100 mil peças, pois E1 não gera peças.

### Como testar agora

Abra **http://127.0.0.1:5173/**. Se precisar reiniciar o servidor, execute `./Start-Ecovit.ps1` na raiz do projeto e mantenha o terminal aberto. O [README](../README.md) contém instalação, comandos e atalhos. O servidor é apenas local; não houve publicação externa.

**Estado de entrega: M1/E1 aprovada pelo solicitante em 10/10/2026.** Evidência: “Estou satisfeito com o M1”. A aprovação registra sua aceitação global do aplicativo; não equivale a afirmar que todos os passos manuais foram executados individualmente. As evidências automatizadas acima pertencem à implementação de E1 e não foram reexecutadas nesta revisão documental. Essa aprovação não autoriza implementar E2 automaticamente.

## 5. E2 — Composição e inspeção de fiadas (M2)

### Objetivo e referência técnica

Gerar e inspecionar todas as fiadas nominais das paredes suportadas, alternar Planta/Fiada, comparar fiadas adjacentes e ajustar a fase de um encontro suportado na primeira fiada. Salvar e reabrir a composição, preservando o modelo quando houver pendências ou falha.

Fonte técnica desta entrega: [Caderno técnico](Ecovit-Caderno-Tecnico.md), revisão 3, decisões aprovadas 1–11, CT-01 a CT-06, exemplos EX-01 a EX-18, lacunas L1 a L5 e definições aprovadas P1–P5. Suas fontes F1–F7 estão vinculadas às afirmações pertinentes. O caderno é uma especificação de geometria nominal, não um projeto executivo.

**Escopo aprovado:** retas, L com ramos de no mínimo dois módulos, retângulos fechados, T com principal contínua e ramal encostado, transição simples L → reta, navegação e persistência. O T informa “Composição geométrica resolvida; ligação complementar necessária”, sem dimensionar ou desenhar reforços no M2. A composição automática da cruz foi excluída do primeiro M2 por aprovação explícita após pesquisa; reconhecer e diagnosticar. Encontros próximos dependem da compatibilidade dos padrões em todas as fases, sem distância universal arbitrária. RF-05 permanece parcial quanto aos casos excluídos.

As onze direções iniciais foram aprovadas pelo solicitante: “Acato tudo proposto como solução”. Trata-se de aprovação das decisões de produto e do encaminhamento da pesquisa, complementada pela aprovação posterior das propostas técnicas P1–P5 após pesquisa. Não autoriza implementar nesta revisão.

### Requisitos associados

| Requisito | Incluído em E2 | Permanece fora deste recorte |
|---|---|---|
| RF-01 | Inteiro/meio nominais, bases iniciais e personalizada 2:1, eixos de furos | Geometria física de furos/encaixes, canaletas e peças preparadas |
| RF-03 | Passo nominal explícito `p = h`, alturas compatíveis e alternativas | Passo de obra universal; transições com lajes |
| RF-04 | Fiada atual/total, anterior/próxima/direta, referência adjacente, legenda compacta, intervalos relativos ao piso | Graute, canaletas e aberturas |
| RF-05 | L, T nominal com aviso de ligação complementar, transição simples de alturas e alternativas compatíveis na fiada 1 | Composição automática da cruz e combinações fora dos padrões documentados |
| RF-09 | Regeneração automática após confirmação; desfazer/refazer modelo e ajustes | Edição de tijolos individuais continua fora do produto |
| RF-10 | Modulação, colisão, lacuna, encontro sem solução, alinhamento nominal e conflito de ajuste | Diagnósticos de elementos de E3/E4 |
| RF-11/12 | Composição e pendências no `.ecovit` e banco local; migração de E1 | Tela de quantitativos, duplicação e demais itens de E5 |

### Fluxo simples de uso

1. Criar/abrir projeto como em E1. Não acrescentar cadastro de fabricante, furos ou regras.
2. Confirmar edição: salvar modelo como desatualizado → gerar integralmente → salvar composição. Uma operação de cada vez; indicador de processamento e recuperação em falha.
3. Planta mantém faixas contínuas. Fiada mostra inteiro/meio, orientação e eixos nominais. Troca de modo conserva enquadramento; lembrar a última fiada durante a sessão, ajustando-a se o total diminuir.
4. Navegar sem recalcular. Referência sobreposta é opcional, anterior **ou** próxima, sem seleção e indisponível nos limites correspondentes.
5. Selecionar encontro suportado na fiada 1, comparar prévias e confirmar a alternativa. Se alterar a fase de outros cantos conectados for necessário para fechar o conjunto, mostrar esse alcance na prévia. Nas demais fiadas, oferecer acesso à primeira.
6. Problema geométrico aparece com localização e explicação; documento continua salvável/exportável. A Planta permanece completa; em Fiada, componente conectado sem solução fica sem peças e os componentes independentes resolvidos continuam visíveis. Resultado antigo permanece claramente identificado, sem aparentar pertencer ao modelo atual.

Não acrescentar Worker, fila, backend, solver genérico ou cálculo incremental. Continuar com um térreo e edição de paredes já existente. Sem vãos, lajes, graute, canaletas, peças especiais ou tela de quantitativos.

### Tarefas para implementação posterior

- [x] **E2-T0 — Definições técnicas:** propostas P1–P5 aprovadas e incorporadas, fontes F6/F7 e exemplos EX-13–18 acrescentados; cruz excluída explicitamente. Conclusão documental, sem implementação ou testes do aplicativo.
- [x] **E2-T1 — Contratos e dados:** catálogo nominal, convenções, resultado/diagnósticos e migração versão 1 → 2; fixtures derivados dos EX, sem alterar medidas antigas.
- [x] **E2-T2 — Motor mínimo:** retas, padrões documentados de L/anel/T básico, transição simples de alturas, reconhecimento e diagnóstico da cruz, classificação dos demais encontros e validação integral da cobertura. Determinismo por coordenadas; sem dependência da ordem de criação das paredes.
- [x] **E2-T3 — Ciclo de edição e persistência:** salvar/calcular/salvar, recuperação de falhas, ajustes e histórico, download/importação e reabertura fiel.
- [x] **E2-T4 — Inspeção no aplicativo:** Planta/Fiada, navegação, intervalos, referência adjacente, legenda, seleção e prévia dos encontros, localização dos diagnósticos.
- [x] **E2-T5 — Verificação e relatório:** executar verificações abaixo, corrigir problemas, disponibilizar teste local e registrar resultados reais, limitações e alcance efetivo do RF-05.

O T básico segue CT-05 e EX-10/13: uma solução geométrica basta, com aviso persistido de ligação complementar. EX-11 verifica exclusão da cruz. EX-14–18 cobrem paridade, transição de alturas e compatibilidade; não inventar alternativas nem dimensionamentos construtivos.

### Critérios de aceite do recorte especificado

| ID | Resultado verificável | Referência |
|---|---|---|
| E2-A01 | Três bases dos exemplos produzem inteiro/meio com envelopes e eixos nominais corretos; interface informa a convenção sem pedir configuração inicial | CT-01/02; EX-01/05/06 |
| E2-A02 | Retas alternam os padrões e reproduzem contagens/posições esperadas; desenho invertido e ordem de criação não mudam a composição | CT-04; EX-01/02 |
| E2-A03 | L simples e anel fecham todas as fiadas sem duplicar cantos, sobreposição, sobra ou lacuna; alternativa apresentada também passa nessas verificações | CT-03/05/06; EX-03/04 |
| E2-A04 | Casos fora do suporte e sobreposição colinear são localizados; Planta completa; componente conectado afetado sem peças em Fiada, sem validade fictícia; componentes independentes continuam inspecionáveis | EX-12; decisão 10; P1–P4 |
| E2-A05 | Alturas e intervalos seguem a convenção; paredes curtas terminam corretamente; valores incompatíveis oferecem alternativas sem mudança silenciosa, inclusive após migração | EX-07/08/09; L5 |
| E2-A06 | Navegação percorre fiadas reais, respeita extremos, preserva câmera e última fiada da sessão; referência adjacente não pode ser editada; navegar não dispara motor | RF-04 |
| E2-A07 | Encontro só é alterável na primeira fiada; prévia mostra alcance, confirmação propaga, desfazer/refazer restaura; ajuste incompatível gera conflito explícito | CT-05; RF-05/09 |
| E2-A08 | Cada edição confirmada executa sequência única; modelo é preservado em falha de cálculo/gravação; controles são liberados e estado de salvamento é verdadeiro | Caderno §6 |
| E2-A09 | Reabrir e transportar arquivo versão 2 preserva peças, escolhas e diagnósticos; versão 1 migra sem alterar o modelo; arquivo inconsistente é recusado sem substituir o aberto | RF-11/12 |
| E2-A10 | Atualização e pendências são distinguidas; erros impedem validade geométrica; eixos coincidentes não são apresentados como passagem física comprovada | CT-06; L1/L2 |
| E2-A11 | Chrome e Edge funcionam nos fluxos principais; limites de geração impedem alocação descontrolada e não truncam peças silenciosamente | Arquitetura; Caderno §6 |
| E2-A12 | T básico reproduz EX-10/13 nas fases A/B sem colisão/lacuna; principal contínua; aviso de ligação complementar visível e salvo, sem reforços fictícios | P2; CT-05; EX-10/13 |
| E2-A13 | L com alturas diferentes muda para reta, mantendo fase e escolha inicial; términos após A e B conferem com EX-15/16 | P5; EX-15/16 |
| E2-A14 | L pares/ímpares respeitam mínimo de dois módulos por ramo; encontros próximos só oferecem alternativas compatíveis em todas as fases, com prévia do alcance | P1/P4; EX-14/17/18 |
| E2-A15 | Cruz é reconhecida e diagnosticada, com componente sem composição; não é resolvida implicitamente como dois T nem considerada geometricamente válida | P3; EX-11 |

E2-A04 verifica casos não suportados e não substitui A12/A13. As definições e exemplos de A12–A15 estão no caderno revisão 3. As evidências executadas constam na seção 6. O aceite manual do solicitante continua pendente; a aprovação da especificação não equivale a esse aceite.

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
| 10 | Abrir backup real de E1; conferir paredes, IDs por teste automatizado e dimensões pela interface | Modelo preservado; composição gerada nominalmente; altura incompatível permanece pendente — A05/A09 |
| 11 | Repetir parede de 8 módulos com bases 30 × 15 × 7 (120 cm) e 28 × 14 × 7 (112 cm) | Mesma distribuição do passo 1; malhas de 15 e 14 cm — A01/A02 |
| 12 | Usar L de EX-03; horizontal 21 cm e vertical 14 cm; depois reduzir vertical para 7 cm | Primeiro caso: terceira fiada reta A; segundo: segunda reta B e terceira A; um inteiro + um meio nas fiadas retas, posições de EX-15/16 — A13 |
| 13 | Trocar a fase do anel EX-17; criar U de EX-18 com três células na base e três em cada ramo incluindo cantos | Anel: prévia dos quatro cantos e composição fechada; combinação do U que disputa célula central não é oferecida; sem padrão completo alternativo, diagnóstico do componente — A14 |
| 14 | Criar a cruz de EX-11 em componente independente do T | Cruz diagnosticada e componente sem peças; T continua visível e composto — A15 |

Falhas injetadas, arquivos adulterados, limites de memória e comparação completa de dados ficam nas verificações automatizadas. Registrar feedback manual por passo, observado e esperado; não presumir aprovação.

### Estado da preparação documental (histórico anterior à implementação)

| Item | Estado em 10/10/2026 |
|---|---|
| Aprovação M1/E1 | Registrada, com manifestação explícita do solicitante |
| Caderno técnico | Revisão 3: propostas P1–P5 aprovadas após pesquisa; regras, fontes e exemplos incorporados |
| Plano de M2/E2 | Detalhado somente para esta entrega |
| Implementação e testes de E2 | Não iniciados; nenhum resultado de execução alegado |
| Verificação documental | Links locais conferidos; cobertura dos dois padrões de L e dos 54 pares de cada fase do anel conferida por cálculo independente; testes do aplicativo não executados nesta revisão |
| Limites técnicos restantes | Ligação física do T não dimensionada; cruz excluída; casos fora do catálogo recebem diagnóstico; limitações L1–L5 preservadas |
| Próxima ação | Implementar M2 somente após solicitação; seguir as definições aprovadas e executar verificações, sem avançar para E3 |

Ao implementar, acrescentar relatório com funcionalidades efetivas, comandos/resultados, limitações, endereço local e pendências manuais. Não avançar para E3 sem solicitação.


## 6. Relatório de implementação de M2/E2 — 11/10/2026

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
- Sem vãos, lajes, graute, canaletas ou quantitativos. **M3/E3 não iniciada.**

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
