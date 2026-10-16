# Ecovit — Plano incremental de implementação

**Estado:** M1, M2 e M3.1–M3.5 implementados e aceitos pelo solicitante. M4 e M5 previstos.
**Base:** [PRD](Ecovit-PRD.md), [arquitetura](Ecovit-Arquitetura-Tecnica.md) e [caderno técnico](Ecovit-Caderno-Tecnico.md).
**Aplicativo:** 0.7.0; arquivo versão 7; composição nominal-v8.

## 1. Como usar este plano

O plano separa o alcance de cada marco, seus critérios, verificações e aceite. M significa Marco. RF identifica requisitos do PRD; CT e EX identificam convenções e exemplos do caderno. Os IDs permanecem estáveis para relacionar especificação, implementação e testes.

Os marcos são cumulativos. Uma limitação do recorte de M1 ou M2 não descreve, por si só, o aplicativo completo: o suporte vigente resulta de M1–M3.5. Contratos de envelopes e convenções antigas permanecem necessários à validação de arquivos legados.

Os resultados de teste abaixo são evidências registradas das entregas, não uma nova execução nem uma garantia de cobertura de toda revisão posterior. Aceite global do solicitante e verificação do Codex são informações distintas; os aceites não atribuem resultado individual a cada passo manual. Os roteiros permanecem como referência de verificação.

O PRD define comportamento; a arquitetura define contratos de dados/processamento; o caderno define convenções e limites geométricos. Este plano reúne alcance e evidências sem repetir integralmente esses contratos. Funcionalidade prevista não equivale a implementação ou autorização para executar outro marco.

## 2. Sequência dos marcos

| Marco | Resultado no aplicativo | Referências | Estado |
|---|---|---|---|
| M1 — Planta editável e persistência | Projetos, paredes, histórico e arquivo nativo | RF-01/02/03/08/09/11/12 | Implementado e aceito |
| M2 — Composição e inspeção de fiadas | Catálogo nominal, retas, L/U/T/contornos, fases, diagnóstico e inspeção | RF-01/03/04/05/09/10/11/12; CT-01–06 | Implementado e aceito |
| M3.1 — Vãos | Portas, janelas, vãos e padrões de inserção | RF-04/06/09/10/12; CT-07/08 | Implementado e aceito |
| M3.2 — Canaletas | Níveis globais, faixas locais, supressão/restauração | RF-04/07/09/10/12; CT-09 | Implementado e aceito |
| M3.3 — Grautes | Categorias, distância, eixos e ajustes individuais | RF-04/07/09/10/12; CT-10 | Implementado e aceito |
| M3.4 — Edição no canvas | Continuidade/união, movimento com dependentes e módulo inicial | RF-02/03/06/07/09/10/11/12; CT-11 | Implementado e aceito |
| M3.5 — Cruz nominal | Cruz integrada a L/T/contorno, fases e elementos associados | RF-04/05/07/09/10/12; CT-12 | Implementado e aceito |
| M4 — Lajes e múltiplos pavimentos | Lajes, limites verticais, até três pavimentos e alinhamentos | RF-08/13 e integração com RF-04/05/07 | Previsto; não implementado |
| M5 — Consulta e conclusão da primeira versão | Quantitativos, duplicação de projetos e cenários restantes | RF-10/11/12 e cenários do PRD | Previsto; não implementado |

Persistência, integridade e verificação acompanham cada entrega. M4 depende de M3 e das convenções de transições verticais; M5 depende de M4. A divisão de M4 em incrementos está na seção 10.

## 3. M1 — Planta editável e persistência

**Estado:** implementado e aceito.

### Alcance

Criar, nomear, listar e abrir projetos locais; escolher base 25 × 12,5 × 7 cm, 30 × 15 × 7 cm ou personalizada 2:1; desenhar paredes ortogonais pela face externa e editar pelas duas pontas ou por comprimento. Inclui seleção de sobrepostos, exclusão, cancelamentos, histórico de 50 operações, salvamento local, bloqueio entre abas e download/importação de arquivo.

O recorte de M1 contém um térreo com piso/início da alvenaria em 0 cm e altura padrão de 280 cm, editáveis. Não inclui composição, vãos, canaletas ou grautes; esses recursos pertencem aos marcos seguintes. O envelope de M1 é versão 1, sem composição gerada. A importação cria cópia com novo ID de projeto, preservando IDs e relações dos elementos.

### Tarefas de implementação de M1

Tarefas do recorte de M1, concluídas.

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

### Roteiro de referência

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

## 4. M1 — Verificações e aceite

| Verificação registrada | Evidência |
|---|---|
| Tipos, lint e build | Passaram na entrega |
| Domínio/persistência | 14 testes passaram: precisão, proporção, geometria, histórico, arquivo e IndexedDB |
| Navegador | 10 casos passaram em Chrome/Edge: criação, edição, cancelamento, reabertura, transporte, falha de gravação e bloqueio entre abas |
| Revisão visual | Tela de projetos e editor conferidos em 1440×1000 |
| Aceite do solicitante | Global recebido; sem resultados individuais por passo informados |

Fontes: [domínio](../tests/domain.test.ts), [persistência](../tests/database.test.ts) e [editor](../tests/e2e/editor.spec.ts). Limites defensivos: arquivo de 50 MB, 10 mil paredes e coordenadas até ±100 milhões de unidades internas. Não há restauração de câmera/histórico entre sessões nem auditoria completa de acessibilidade.

## 5. M2 — Composição e inspeção de fiadas

**Estado:** implementado e aceito.

### Alcance e referências

Gerar e inspecionar fiadas nominais, alternar Planta/Fiada, comparar fiada adjacente e ajustar fase na primeira fiada. Inclui retas pares/ímpares, L, U, ciclos/retângulos e T com principal contínua e ramal encostado, transição simples L → reta e persistência da composição. CT-01–06, EX-01–20 e P1–P5 definem os padrões e limites. A ligação física entre paredes não é dimensionada.

A cruz não integra o recorte de M2: convenções nominal-v1–v7 a reconhecem e diagnosticam; M3.5 fornece sua composição nominal. Canaletas, grautes e vãos pertencem a M3. O envelope de M2 é versão 2, com convenções nominal-v1/v2/v3 para conferência dos snapshots correspondentes.

### Tarefas concluídas

- [x] **M2-T00 — Definições técnicas:** convenções P1–P5, fontes F6/F7 e exemplos EX-13–18; cruz diagnosticada no recorte de M2.
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

M2-A04 verifica casos sem suporte no recorte de M2 e não substitui A12/A13. CT-05 e EX-13–20 definem os padrões de paginação aplicáveis. M2 está implementado e aceito; as verificações constam na seção 6.

### Roteiro de referência

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
| 14 | Criar a cruz de cinco células em componente independente do T | No aplicativo vigente, cruz composta conforme EX-51 e T preservado. M2-A15/EX-11 verificam o diagnóstico somente nos contratos legados nominal-v1–v7 |

Falhas injetadas, arquivos adulterados, limites de memória e comparação completa de dados ficam nas verificações automatizadas. Registrar feedback manual por passo, observado e esperado; não presumir aprovação.

## 6. M2 — Verificações e aceite

| Verificação registrada | Evidência |
|---|---|
| Tipos, lint e build | Passaram na entrega |
| Domínio/persistência | 41 testes passaram na composição, domínio, ciclo de geração/falhas e IndexedDB |
| Navegador | 20 casos passaram em Chrome/Edge, abrangendo M1 e o recorte de M2 |
| Cobertura geométrica | Bases 25/30/28, paridades/rotações/reflexões, anel, T, U, alturas e componentes independentes |
| Persistência | Migração, conferência de snapshots, adulteração, escolhas, duas gravações, falhas e transporte |
| Carga observada | 100 paredes, 40 fiadas, 42.000 peças: 1.435 ms Chrome / 1.898 ms Edge, incluindo abertura/importação/geração/salvamento |
| Aceite do solicitante | Global recebido; sem checklist individual informado |

Fontes: [composição](../tests/composition.test.ts), [U aberto](../tests/open-u.test.ts), [estado](../tests/generation-state.test.ts) e [Fiada](../tests/e2e/fiada.spec.ts). Paginação contínua mantém pares de células ao longo dos percursos, sem impor orientação igual a todos os cantos; meios necessários ficam nas extremidades. A navegação com botão do meio ou Espaço preserva o modelo. A interface mantém controles compactos e contextuais.

Os limites de geração são 20 mil módulos somados nas paredes, mil fiadas e 100 mil células estimadas no total vertical. Células não equivalem a peças; a estimativa é conservadora e não comprova a meta de 100 mil peças/três pavimentos. Medições são de fluxo em uma máquina Windows com Intel Core i5-1035G1, não do motor isolado nem garantia para outros dispositivos.

## 7. M3 — Vãos, canaletas e grautes nominais

**Estado:** M3.1, M3.2 e M3.3 implementados e aceitos.

### Alcance e referências

PRD §14, Arquitetura §15 e CT-07–10/EX-21–35 definem vãos, padrões, canaletas e grautes. M3.1 cobre inserção/edição de aberturas e seus padrões; M3.2 cobre níveis globais e faixas locais, supressões e restauração; M3.3 cobre categorias/distância de graute e inclusão/exclusão por eixo. Geometria nominal sem dimensionamento resistente ou verificação de passagem física.

| ID | Regra de escopo |
|---|---|
| D3-01 | Alcance nominal organizado em M3.1, M3.2 e M3.3 |
| D3-02 | Sem sobreposição de volumes; vãos laterais com alturas sobrepostas exigem um módulo horizontal; empilhados exigem uma fiada intermediária, compartilhável por canaletas |
| D3-03 | Configurações fornecem valores iniciais; padrões e efeitos em PRD §14 e M3-A16 |
| D3-04 | Dimensões físicas e dimensionamento estrutural fora do escopo |
| D3-05 | Grautes configuráveis por CT-10 e PRD §14, com categorias, distância e clique por furo |
| D3-06 | Canaletas globais e junto a todos os vãos; faixa local cobre largura do vão mais um módulo por lado; remoção por parede/fiada |

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
| M3-A16 | Novos projetos recebem os valores da tabela normativa do PRD §14; Aplicar/Cancelar/restaurar, persistência e histórico corretos; defaults não alteram vãos existentes; recálculo preserva ajustes. |

### M3.1 — Vãos: verificações e aceite

Tipos, lint e build passaram. Foram registrados 77 testes de domínio/persistência e 40 casos de navegador em Chrome/Edge, incluindo 14 de M3.1. Cobertura: M3-A01–06; partes de A07–10/15/16 referentes a vãos. EX-21–27/29/30 conferem paginação, intervalos, seleção de empilhados, separações, edições indiretas e transporte. Configurações não redimensionam vãos existentes. Aceite global recebido, sem resultados individuais por passo.

Fontes: [vãos](../tests/openings.test.ts), [fluxos de vãos](../tests/e2e/openings.spec.ts) e [configurações](../tests/e2e/settings.spec.ts).

### Roteiro de referência

Abrir `http://127.0.0.1:5173/` em Chrome ou Edge. Para iniciar, executar `./Start-Ecovit.ps1` na raiz e manter o terminal aberto. Preservar a origem de projetos existentes; transportar por `.ecovit` se necessário. Usar projetos de teste próprios com tijolo 25×12,5×7 cm e parede de 400 cm/altura 280 cm.

| Passo | Ação | Esperado |
|---|---|---|
| 1 | Desenhar Porta, Janela e Vão em regiões separadas; selecionar, mover corpo, editar ambas as alças e campos | Símbolos distintos, prévia modular, parede mantida, uma operação por gesto; medidas incompatíveis oferecem escolha |
| 2 | Configurações: alterar base, Cancelar; repetir e Aplicar; Restaurar e Aplicar; desfazer | Cancelar preserva; padrões só afetam novas inserções; persistência e histórico corretos |
| 3 | Em projetos separados, porta posição 100/largura 100/base 0/altura 210; janela posição 100/largura 100/base 98/altura 112 | Porta abre fiadas 1–30; janela 15–30. Fiada 31 retoma sem reiniciar fase; conferir EX-21/22 |
| 4 | Novo projeto: porta inferior posição 100/largura 100/base 0/altura 105; janela superior no mesmo intervalo, base 112/altura 98 | Seletor distingue ambas na Planta; fiada 16 completa, 15 e 17 com as respectivas aberturas. A composição de canaletas dessa fiada é verificada no recorte M3.2 |
| 5 | Tentar base 105 no vão superior e contato lateral entre vãos com alturas coincidentes; cancelar | Entradas recusadas sem alterar projeto; empilhamento exige uma fiada e separação lateral exige um módulo |
| 6 | Na Fiada atingida pelo vão, clicar na abertura e Editar na Planta; recolher/reabrir painel e selecionar por teclado | Seleção/localização e câmera preservadas; controles acessíveis |
| 7 | Escape durante arraste, soltar fora e alternar janela; navegar por botão central/Espaço | Nenhuma abertura residual, próxima inserção funciona e navegação não altera entidades |
| 8 | Com vão 100–200, encurtar parede para 150; usar Diagnósticos, localizar/editar; desfazer | Vão mantém posição/medidas como pendência; conjunto sem peças até corrigir; desfazer restaura |
| 9 | Excluir vão, desfazer/refazer; excluir parede com vãos e desfazer | Parede preservada ao excluir só vão; dependentes restaurados ao desfazer parede |
| 10 | Baixar, recarregar/reabrir e carregar em outro navegador; repetir com projeto antigo M2 | Geometria, escolhas, configurações e pendências preservadas; importação cria cópia; M2 sem novos elementos automáticos |
| 11 | Base personalizada 28×14×6 cm, parede altura 240; desenhar janela com defaults originais | Nenhum arredondamento oculto; confirmar medidas realizáveis, por exemplo base 108/altura 108, antes de inserir |

Limites do recorte M3.1: não inclui canaletas/grautes (M3.2/M3.3), cruz (M3.5), lajes/pavimentos (M4), quantitativos (M5), esquadrias/folgas ou validação estrutural. Não há auditoria completa de acessibilidade.

### M3.2 — Canaletas: verificações e aceite

Tipos, lint e build passaram. Foram registrados 99 testes de domínio/persistência e 56 casos de navegador, 28 por navegador Chrome/Edge. Cobertura: M3-A07/11/12 e partes de A08–10/15/16 referentes a canaletas. EX-26/28/31/35 conferem união de regiões/origens, fiada intermediária compartilhada, supressão de faixa e restauração explícita. Revisão visual em 1440×1000. Aceite global recebido, sem resultados individuais por passo.

Fontes: [canaletas](../tests/channels.test.ts) e [fluxos de canaletas](../tests/e2e/channels.spec.ts).

### Roteiro de referência

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

Limites do recorte M3.2: canal é representação nominal, sem dimensões físicas; grautes pertencem a M3.3, cruz a M3.5, lajes/pavimentos a M4 e quantitativos a M5. Sem armaduras, validação estrutural ou auditoria completa de acessibilidade.

### M3.3 — Grautes: verificações e aceite

Tipos, lint e build passaram. Foram registrados 125 testes de domínio/persistência e 72 casos de navegador, 36 por navegador Chrome/Edge, com verificações específicas de identidade e diagnósticos. Cobertura: M3-A13/14 e partes de A07–10/15/16 referentes a grautes. EX-22/32/33/34 verificam eixos por malha, categorias independentes, exclusões sem compensação e intervalos interrompidos por vãos. Aceite global recebido; a execução assistida pelo Codex e o aceite do solicitante são evidências distintas.

Carga observada: 100 paredes, 200 eixos e 300 intervalos; 2.995 ms Chrome / 2.521 ms Edge para abertura/importação/geração/salvamento. Algumas verificações concorreram na máquina; não é tempo isolado do motor nem garantia para três pavimentos. Fontes: [grautes](../tests/grout.test.ts) e [fluxos de grautes](../tests/e2e/grout.spec.ts).

### Roteiro de referência

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
| 9 | Baixar e importar em outro navegador; importar cópia M3.2 com canaletas suprimidas; ativar graute explicitamente | Arquivo vigente, cópia independente e ajustes preservados; arquivo legado M3.2 inicia categorias desligadas, níveis/supressões intactos; ativação explícita |
| 10 | Bases 30/28 com d=100; distância menor que um módulo e Aplicar; Restaurar padrões com exclusão existente | EX-34 passos 90/98 cm, sem 105/112; alternativa explícita para d<m; restaurar configuração não apaga exclusão |

Limites do recorte M3.3: sem dimensões físicas de furos/canais, resistência, aço, validação estrutural, lajes/pavimentos ou quantitativos. Cruz e suas transições pertencem a M3.5. Aceite global recebido; não há auditoria completa de acessibilidade.

## 8. M3.4 — Edição no canvas

**Estado:** implementado e aceito.

### Alcance e referências

Continuidade/união de paredes compatíveis ao criar ou mover; translação com dependentes; destaque da célula inicial; rótulos orientados de aberturas. Produto em PRD §15, convenções em CT-11/EX-36–50 e contratos na Arquitetura §16.

D34-01 preserva supressões de canaleta nos trechos originais da união. D34-02 conserva ajustes compartilhados de graute nas paredes imóveis e copia a intenção para a parede movida. Sem divisão/rotação de paredes, movimento em grupo, união ao redimensionar ou consolidação automática de arquivos legados. O contrato de arquivo do marco é v6/nominal-v7; o aplicativo vigente usa v7/nominal-v8.

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

### Verificações e aceite

Tipos, lint e build passaram. Foram registrados 152 testes de domínio/persistência; rodada completa de 82 casos em Chrome/Edge e 6 verificações pertinentes para ampliação de zoom/carga/hospedeira ambígua. Não se atribui nova execução integral à suíte ampliada de 86 casos. Cobertura por critérios: A01–03 continuidade/identidade; A04 supressões; A05–07 movimento/dependentes/cancelamentos; A08 célula inicial; A09 escolhas pendentes; A10–11 migração/histórico/falhas; A12 bases e regressões. Célula inicial EX-49/50 e rótulos de aberturas têm verificações específicas de interação e orientação.

Carga de edição: 100 paredes, 40 fiadas e 42 mil peças; movimento de uma parede em 1.214 ms Chrome / 1.251 ms Edge, incluindo gesto e salvar/calcular/salvar. Revisão visual em 1440×1000. Aceite global recebido; sem resultados individuais por passo manual. Fontes: [domínio da edição](../tests/wall-editing.test.ts), [desenho](../tests/drawing.test.ts), [edição no navegador](../tests/e2e/wall-editing.spec.ts) e [gestos](../tests/e2e/drawing.spec.ts).

### Roteiro de referência

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

## 9. M3.5 — Cruz nominal

**Estado:** implementado e aceito.

### Alcance e referências

Composição nominal de cruz isolada ou integrada a L/T/contorno; fases e alternativa global; transição cruz → reta sem reiniciar fase; vãos, canaletas, grautes, diagnósticos, histórico e migração. PRD §16, CT-12/EX-51–55 e Arquitetura §17 definem os contratos. O envelope é versão 7 e a composição nominal-v8. Cruz suportada compõe o conjunto inteiro; conflito real sem padrão completo suspende apenas o componente afetado.

### Tarefas concluídas

- [x] **M3.5-T01:** implementar nominal-v8 com separação explícita da cruz por fase e validação conjunta dos percursos/reservas, mantendo geradores legados.
- [x] **M3.5-T02:** resolver cruz integrada a L/T/contorno e a transição simples cruz → reta; manter a fase absoluta e a alternativa global.
- [x] **M3.5-T03:** integrar subtração de vãos, canaletas, grautes e ajustes/transformações de M3.4, sem duplicar células/origens/eixos.
- [x] **M3.5-T04:** seleção/prévia/confirmar/cancelar, diagnóstico com alcance das paredes e motivos atuais; preservar câmera e navegação.
- [x] **M3.5-T05:** envelope 7/nominal-v8, validação original de snapshots, migração em memória, histórico/transporte/bloqueio e recuperação de falhas.
- [x] **M3.5-T06:** testes de posições/contagens independentes, regressões, Chrome/Edge, revisão visual, build e roteiro manual; registrar resultados reais.

### Critérios de aceite

| ID | Resultado verificável |
|---|---|
| M3.5-A01 | EX-51: cruz mínima composta, centro único, pares/meios explícitos A/B; sem diagnóstico genérico de cruz não suportada em nominal-v8. |
| M3.5-A02 | EX-52: 13 células, 5 inteiros + 3 meios por fase; principal horizontal/vertical conforme CT-12, sem peça especial ou ligação inferida. |
| M3.5-A03 | EX-53: seis paredes, cruz/L/T/anel no mesmo componente; 70 células, A 34 inteiros + 2 meios, B 33 + 4; contorno e divisórias visíveis. Caso independente com topologia das imagens, não dimensões inferidas dos pixels. |
| M3.5-A04 | Determinismo por ordem/IDs/sentido, bases 25/30/28/personalizada, coordenadas negativas e rotações/reflexões; arranjo inicial por eixos mundiais, geometria íntegra nas duas fases. |
| M3.5-A05 | Alternativa na fiada 1 inverte fase global; prévia inclui o conjunto todo, confirmação uma operação, cancelar/Escape/navegação sem gravação. |
| M3.5-A06 | EX-54: cruz → reta conforme altura, fase absoluta preservada; demais alturas compatíveis com padrões não prolongam paredes nem reiniciam paginação. |
| M3.5-A07 | EX-55: subtração do vão depois da paginação, células/limites corretos, canaletas/supressões preservadas e graute central único com intervalos descontados. |
| M3.5-A08 | Encontros próximos com reservas contraditórias, sobreposição colinear, altura inválida, vão no centro e escolhas pendentes diagnosticados com motivo/alcance; componentes independentes preservados; nenhuma solução inventada pela ordem. |
| M3.5-A09 | Diagnóstico informa N paredes e consequência, localiza encontro/conjunto; distingue limite de suporte de medida fora da malha e falha do motor; sem texto operacional dependente de M2 ou erro estrutural por supressão. |
| M3.5-A10 | Envelope 7/nominal-v8; snapshot nominal-v7 com cruz bloqueada validado antes de migrar; adulteração recusada; IDs/configurações/ajustes/pendências e arquivo original preservados; somente leitura sem cálculo/gravação. |
| M3.5-A11 | Histórico, reabertura, transporte, movimento/união/encurtamento e ajustes de M3.4 íntegros; falhas de ambas as gravações/motor liberam controles e preservam trabalho. |
| M3.5-A12 | Typecheck, lint, domínio/persistência, e2e Chrome/Edge e build; posições/cobertura independentes e regressões M1–M3.4. Revisão visual e registro de limites/carga sem prometer estrutura ou três pavimentos. |

### Verificações e aceite

Tipos, lint e build passaram. Foram registrados 183 testes em 11 arquivos: 162 regressões, 19 de domínio/persistência de cruz e 2 de estado/histórico/falhas/somente leitura. Há registro de rodada integral de 102 casos Chrome/Edge e de repetição dos 12 cenários de cruz para aviso de migração e janela acima da parede encerrada; não se atribui outra rodada integral a essas alterações.

Cobertura: A01–04 posições, cobertura, paridades e determinismo; A05 prévia/histórico; A06 transição por altura; A07 elementos associados; A08–09 conflitos e localização; A10 versões/adulteração/somente leitura; A11 persistência e falhas; A12 verificações técnicas e carga. Revisão visual de contorno/divisórias, fases, transições e diagnósticos em 1440×1000. Aceite global recebido, sem checklist individual nem aprovação estrutural.

Carga observada: 20 contornos com cruz, 40 fiadas e 29.200 peças; 2.618 ms Chrome / 2.481 ms Edge para abertura/importação/geração/salvamento. Contagens de 720/740 peças nas fases A/B conferidas. Fontes: [cruz](../tests/cross.test.ts) e [fluxos de cruz](../tests/e2e/cross.spec.ts). Não há promessa de solução universal para encontros próximos ou alturas fora dos padrões.

### Roteiro de referência

| Passo | Ação | Esperado |
|---|---|---|
| 1 | Desenhar cruz de EX-51/52; navegar nas fiadas 1/2/3 | Peças nas duas direções/fases especificadas, centro único, sem vazio do conjunto por ser cruz. |
| 2 | Reproduzir seis paredes de EX-53; selecionar o conjunto | Contorno/divisórias presentes, 70 células; conferir contagens A/B e prévia global, cancelar e confirmar/desfazer. |
| 3 | Encerrar uma parede na fiada 2 (EX-54) | Fiada 3 reta no mesmo número de fase, sem trecho acima da altura. |
| 4 | Inserir janela de EX-55; configurar canaletas/grautes e remover/restaurar ajustes | Vazio respeitado, origens/eixos únicos e ajustes persistentes; a cruz não elimina o contorno. |
| 5 | Aproximar encontros até incompatibilidade, invadir centro com vão e manter parede independente distante | Motivo específico e alcance das paredes; só conjunto afetado suspenso; independente continua composto. |
| 6 | Mover/unir/encurtar, desfazer/refazer, reabrir e transportar; importar cópia M3.4 com cruz diagnosticada | Intenção/IDs preservados, snapshot original conferido e nova composição após migração; arquivos adulterados recusados. |

## 10. M4 — Lajes e múltiplos pavimentos (previsto)

**Estado:** não implementado; divisão proposta em M4.1 (Pavimentos), M4.2 (Lajes e limites verticais) e M4.3 (Coordenação entre pavimentos). Sem tarefas ou critérios detalhados até o início do incremento correspondente.

O comportamento é definido em RF-07/08/13; os contratos previstos estão na Arquitetura §18 e as lacunas no Caderno §11. Cada pavimento tem Planta própria e numeração de fiadas iniciando em 1. Até uma laje de fechamento por pavimento, pertencente ao inferior. A sugestão editável de início da alvenaria usa o topo da laje inferior ou, sem laje, o início da alvenaria inferior mais sua altura padrão. Não há espessuras adicionais presumidas.

A laje limita a composição somente nos trechos cobertos, preservando a altura solicitada nos dados e nos trechos descobertos/aberturas. Incompatibilidade com fiadas completas exige decisão explícita. Alterações de laje propõem atualização das cotas do superior, sem aplicação automática ou cascata presumida.

Cada pavimento tem seus próprios grautes conforme o padrão configurado; inclusões/exclusões individuais afetam somente aquele pavimento, inclusive com eixos nas mesmas coordenadas horizontais em outros andares. A implementação deve verificar isolamento, limites locais, recálculo, histórico e transporte; a migração conserva ajustes do térreo. A regra não altera o escopo das canaletas.

Pendências de detalhamento: cobertura parcial da espessura da parede, limites fora da malha, transições junto a encontros/vãos/elementos associados, vínculos por pavimento e proposta de atualização das cotas. Pesquisa e exemplos precedem os algoritmos. Testes e aceite de M4 não realizados.

## 11. Apresentação, operação e verificação documental

### Interface e iconografia

Página inicial com cartões, estado vazio, orientação de backup e layout responsivo; editor compacto centrado no canvas. Configurações com grupos Vãos/Canaletas/Graute lado a lado, explicações contextuais e ações acessíveis. A lista extensa de níveis rola localmente. Iconografia Lucide centralizada em src/ui/Icon.tsx, conforme Arquitetura §2.1.

Tipos, lint e build passaram na entrega de apresentação. Há registro de 34 verificações pertinentes em Chrome/Edge, 17 por navegador, incluindo edição, Fiada, configurações, estados e dicas. Revisão visual em 1366×768, 1280×720 e 900×680; centro SVG com tolerância de 1 px, texto sem excesso e estados/foco conferidos. Oito verificações de proteção de imports passaram; licença distribuída e inclusão somente de ícones usados conferidas. Esses resultados não representam execução integral da suíte nem auditoria completa de acessibilidade.

**Aceite específico da apresentação:** pendente do solicitante. Os aceites de M3.4/M3.5 não atribuem aprovação específica às revisões de configurações e iconografia. Roteiro: conferir início/criação, barra de ferramentas, Fiada, zoom, painéis, dicas por mouse/Tab e Configurações com Aplicar/Cancelar/Restaurar no monitor habitual.

### Operação e limites

Porta 5173 reservada ao solicitante; porta 5174 para verificações do Codex, com perfis isolados e servidor próprio do Playwright, sem reaproveitar instâncias. Os scripts e instruções estão no README e AGENTS.md. Há registro de dois casos de bloqueio/liberação entre abas na 5174, em Chrome/Edge; o runner foi interrompido sem resumo final. Esse registro não equivale a uma execução concluída da suíte. Teste manual específico da separação de portas permanece pendente.

Build com avisos não impeditivos de anotações do Zod e JavaScript acima de 500 kB; saída de referência com Lucide: aproximadamente 876 kB / 273 kB gzip. Os cenários de carga registrados não comprovam 100 mil peças/três pavimentos. Navegadores e perfis de teste são isolados dos projetos pessoais.

### Consistência documental

Documentação organizada por comportamento e marco, com IDs de requisitos, tarefas, critérios, convenções e exemplos preservados. Verificação documental: revisão cruzada de PRD/arquitetura/caderno/plano, referências locais, identificação de versões legadas e git diff --check. A consolidação não modifica código, formato, regras ou aceites e não constitui nova execução de testes do aplicativo.
