# Ecovit — Plano incremental de implementação

Índice dos marcos e de seus registros finais. Comportamento vigente no [PRD](Ecovit-PRD.md), contratos na [Arquitetura](Ecovit-Arquitetura-Tecnica.md), convenções no [Caderno técnico](Ecovit-Caderno-Tecnico.md) e propostas futuras no [Backlog](Ecovit-Backlog.md).

## Como usar

- Consultar o arquivo do marco para alcance, tarefas, critérios de aceite, verificações, limitações e aceite do solicitante. M3.1–M3.3 compartilham um arquivo por utilizarem critérios comuns; M4 tem um resumo e três entregas independentes.
- Preservar os IDs de tarefas/aceite e de referências RF/CT/EX/D/AH. O número do marco identifica a entrega; a numeração interna preservada nos arquivos permite reconhecer as referências anteriores.
- Os marcos são cumulativos em funcionalidades. Formatos e limitações de uma entrega antiga são históricos; o contrato suportado atualmente é definido na arquitetura. O aceite de um marco não autoriza executar outros itens.
- Verificações do Codex são evidências da entrega, sem atribuir nova execução a revisões posteriores. Aceite global do solicitante não comprova execução individual de cada roteiro ou auditoria de cada detalhe.
- Manter um resumo final por marco, sem diário de tentativas, logs intermediários, contagens acumuladas de reexecuções ou cópias dos contratos de produto/arquitetura. Resultados transitórios ficam no histórico do Git. Preservar limitações e pendências reais, inclusive aceites específicos de ajustes posteriores.

## Marcos

| Marco | Resultado | Referências | Situação final |
|---|---|---|---|
| [M1 — Planta editável e persistência](marcos/M1-Planta-e-Persistencia.md) | Projetos, paredes, histórico e arquivo nativo | RF-01/02/03/08/09/11/12 | Implementado e aceito, incluindo a correção de abertura e reabertura |
| [M2 — Composição e inspeção de fiadas](marcos/M2-Composicao.md) | Catálogo nominal, retas, L/U/T/contornos, fases, diagnóstico e inspeção | RF-01/03/04/05/09/10/11/12; CT-01–06 | Implementado e aceito pelo solicitante |
| [M3.1 — Vãos](marcos/M3-Vaos-Canaletas-Grautes.md) | Portas, janelas, vãos e padrões de inserção | RF-04/06/09/10/12; CT-07/08 | Implementado e aceito pelo solicitante |
| [M3.2 — Canaletas](marcos/M3-Vaos-Canaletas-Grautes.md) | Níveis globais, faixas locais, supressão/restauração | RF-04/07/09/10/12; CT-09 | Implementado e aceito pelo solicitante |
| [M3.3 — Grautes](marcos/M3-Vaos-Canaletas-Grautes.md) | Categorias, distância, eixos e ajustes individuais | RF-04/07/09/10/12; CT-10 | Implementado e aceito pelo solicitante |
| [M3.4 — Edição no canvas](marcos/M3.4-Edicao-no-Canvas.md) | Continuidade/união, movimento com dependentes e módulo inicial | RF-02/03/06/07/09/10/11/12; CT-11 | Implementado e aceito pelo solicitante |
| [M3.5 — Cruz nominal](marcos/M3.5-Cruz-Nominal.md) | Cruz integrada a L/T/contorno, fases e elementos associados | RF-04/05/07/09/10/12; CT-12 | Implementado e aceito pelo solicitante |
| [M4 — Lajes e múltiplos pavimentos](marcos/M4-Lajes-e-Pavimentos.md) | Cota única modular, lajes independentes, até quatro pavimentos e comparação visual | RF-08/13 e integração com RF-04/05/07 | Implementado e aceito pelo solicitante |
| [M4.1 — Pavimentos](marcos/M4.1-Pavimentos.md) | Gestão de pavimentos, cotas e composição local | RF-08; EX-56–64 | Implementado e aceito pelo solicitante |
| [M4.2 — Lajes](marcos/M4.2-Lajes.md) | Lajes/aberturas, edição e extensão AH de alturas | RF-13; CT-13/14; EX-65–79; D42-01 | Implementado e aceito pelo solicitante |
| [M4.3 — Comparação visual](marcos/M4.3-Comparacao-de-Pavimentos.md) | Referência de pavimento adjacente em Planta | RF-08; CT-15; EX-80–85 | Implementado e aceito pelo solicitante |
| [M5 — Consulta e conclusão da primeira versão](marcos/M5-Quantitativos-e-Projetos.md) | Quantitativos, duplicação de projetos e cenários restantes | RF-10/11/12 e cenários do PRD | Implementado e aceito pelo solicitante |
| [M6 — Preferências do Ecovit](marcos/M6-Preferencias.md) | Preferências de rótulos, comprimento/altura das paredes e reorganização do status/ajuda do canvas | BL-07; RF-09/10/14 | Implementado e aceito pelo solicitante |
| [M7 — Medidas independentes](marcos/M7-Medidas.md) | Segmentos de medição livres em Planta, atração geométrica e persistência por pavimento | BL-03; RF-15, integração com RF-02/08/09/11/12/14 | Implementado e aceito pelo solicitante |
| [M8 — Imagem de referência por pavimento](marcos/M8-Imagem-de-Referencia.md) | Uma imagem de fundo calibrada, posição/rotação, opacidade e interface compacta | BL-02; RF-16, integração com RF-02/08/09/11/12 | Implementado e aceito pelo solicitante |
| [M9 — Tipos de portas e janelas](marcos/M9-Esquadrias.md) | Nove variantes e símbolos em Planta com botão único de orientação cíclica | BL-08; RF-06; [Elementos construtivos](arquitetura/Elementos-Construtivos.md#vãos-e-aparência-de-esquadrias); CT-17 | Implementado e aceito pelo solicitante |
| [M10 — Mobiliários](marcos/M10-Mobiliarios.md) | Acervo integrado com 59 opções, ocorrências editáveis em Planta e upload incorporado ao arquivo | BL-01; RF-17; [Medidas e imagens](arquitetura/Medidas-e-Imagens.md#mobiliários-e-acervo) | Entrega inicial aceita; ampliações do acervo, bloco de contenção em vista plana, espelhamento e ajustes de interface implementados, com teste manual e aceite específicos pendentes |

Persistência, integridade e verificação acompanham cada entrega. M4 depende de M3; M5 depende de M4. Os subitens de M4 têm seus próprios critérios, verificações e aceites.

## Ajustes transversais e pendências específicas

[Apresentação e operação](marcos/Apresentacao-e-Operacao.md) reúne interface, iconografia e limites operacionais que não pertencem a um único marco, incluindo o favicon implementado e a organização visual dos painéis e o foco padronizado dos campos com unidade implementados e aceitos. Os demais aceites específicos pendentes permanecem separados dos aceites globais.

O [registro de M5](marcos/M5-Quantitativos-e-Projetos.md) preserva também a situação dos ajustes posteriores de exclusão de projetos, cartões e cabeçalho, inclusive os aceites específicos ainda pendentes. M1–M10 aprovados não implica aprovação automática dessas alterações.

BL-01/02/03/06/07/08 estão implementados; BL-04/05 permanecem sem escopo de implementação aprovado, conforme o backlog. Nenhum novo marco foi iniciado nesta reorganização.

## Verificação da reorganização

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

No aplicativo entregue até M3.5, os limites de geração são 20 mil módulos somados nas paredes, mil fiadas e 100 mil células estimadas no total vertical; M4.1 prevê remover esse controle de orçamento. Células não equivalem a peças; a estimativa é conservadora e não comprova a meta de 100 mil peças/quatro pavimentos. Medições são de fluxo em uma máquina Windows com Intel Core i5-1035G1, não do motor isolado nem garantia para outros dispositivos.

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

Carga observada: 100 paredes, 200 eixos e 300 intervalos; 2.995 ms Chrome / 2.521 ms Edge para abertura/importação/geração/salvamento. Algumas verificações concorreram na máquina; não é tempo isolado do motor nem garantia para quatro pavimentos. Fontes: [grautes](../tests/grout.test.ts) e [fluxos de grautes](../tests/e2e/grout.spec.ts).

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

D34-01 preserva supressões de canaleta nos trechos originais da união. D34-02 conserva ajustes compartilhados de graute nas paredes imóveis e copia a intenção para a parede movida. Sem divisão/rotação de paredes, movimento em grupo, união ao redimensionar ou consolidação automática de arquivos legados. O contrato de arquivo do marco é v6/nominal-v7; o aplicativo vigente de M4.1 usa v8/nominal-v9.

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
| M3.5-A12 | Typecheck, lint, domínio/persistência, e2e Chrome/Edge e build; posições/cobertura independentes e regressões M1–M3.4. Revisão visual e registro de limites/carga sem prometer estrutura ou quatro pavimentos. |

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

## 10. M4 — Lajes e múltiplos pavimentos

**Estado:** M4.1 (Pavimentos), M4.2 (Lajes) e M4.3 (Comparação visual entre pavimentos) implementados, revisados e aceitos pelo solicitante. Alcance e verificações nas §§10.1–10.3. M5 está implementado e aceito pelo solicitante separadamente na §12.

**Aceite global do solicitante:** registrado para M4.1, M4.2 e M4.3 por confirmação explícita nesta conversa. Abrange as implementações e revisões consolidadas abaixo e substitui as pendências globais de aprovação desses marcos. Os roteiros manuais permanecem como referência, sem atribuição de execução ou resultado individual aos seus passos. As verificações do Codex conservam seus resultados próprios. Este aceite não autoriza iniciar M5.

**Verificação deste registro documental:** estados de PRD, arquitetura, caderno técnico, plano e README conferidos; referências locais e `git diff --check` verificados. Nenhuma alteração de código nem nova execução de testes do aplicativo.

O comportamento é definido em RF-07/08/13; as diretrizes estão na Arquitetura §18 e os contratos vigentes de M4.1 na §19 e as convenções no Caderno §11. Até quatro pavimentos, sem distinção de piso ou cobertura, ordenados por cota crescente. A cota única é especificada na criação, múltipla inteira da altura-base do tijolo, admitindo negativos e zero, sem valores repetidos. Todas as paredes começam nessa cota; bases de vãos e níveis de canaletas usam essa referência, e a numeração de fiadas reinicia em 1. A altura de cada parede define seu topo. Não há campos separados de piso acabado e início da alvenaria no contrato de M4.

Até uma laje por pavimento, pertencente a ele e independente de suas paredes, com face superior na cota do pavimento e espessura positiva crescendo para baixo. Contorno e aberturas ortogonais na malha horizontal; aberturas retiram área da laje, ficam estritamente internas e não podem tocar ou sobrepor outras aberturas. Edição inválida não é confirmada e não corrige aberturas silenciosamente. Para uma laje acima das paredes, criar outro pavimento, podendo deixá-lo sem paredes. A laje não recorta a composição nem altera alturas ou cotas de outros pavimentos. Alterar a cota de um pavimento desloca seus elementos e ajustes, preservando medidas relativas, sem deslocar os demais.

Duplicação copia toda a intenção editável, inclusive laje, escolhas e ajustes pendentes, exige cota válida de destino, remapeia IDs e referências e recalcula a composição. Remoção é desfazível, preserva os demais e impede excluir o último pavimento, com seleção definida em RF-08. Cada pavimento tem seus próprios grautes conforme o padrão configurado; inclusões/exclusões individuais afetam somente aquele pavimento, inclusive com eixos nas mesmas coordenadas horizontais em outros andares. Verificar isolamento, medidas relativas, recálculo, histórico e transporte no novo contrato. A regra não altera o escopo das canaletas.

Novo pavimento vazio recebe a altura padrão da criação do projeto, editável e modular, sem herdar outro andar. Troca de pavimento mantém câmera, limpa seleção e cancela gestos/prévias, lembrando a última fiada local durante a sessão. Sem paredes, Fiada apresenta estado vazio, sem fiada fictícia.

Comparação somente em Planta, com uma referência não editável por vez, inferior ou superior adjacente, em aparência atenuada e identificada. Não detectar colisões, apoio ou interseções entre pavimentos, nem emitir avisos de desalinhamento/descontinuidade entre andares ou criar vínculos de continuidade. Todas as validações existentes, inclusive colisões na composição, continuam por pavimento isolado; lajes mantêm a validade de contorno/aberturas, sem novo verificador volumétrico neste marco. Desenho de lajes e aberturas por vértices, prévia ortogonal e fechamento explícito; Escape cancela. Mover laje transporta suas aberturas.

M4 invalida arquivos e documentos locais anteriores, sem migração ou conversão. Informar incompatibilidade e necessidade de novo projeto, sem apagar automaticamente dados antigos ou substituir o trabalho atual ao recusar importação. Não exigir manutenção de geradores e migrações exclusivamente para compatibilidade anterior.

Contratos de pavimentos, ajustes locais, resultado e formato vigente de M4.1 na Arquitetura §19; convenções/exemplos no Caderno §11.1. Verificações de M4.1 e roteiro manual de referência consolidados abaixo. M4.2 detalhado em RF-13, Arquitetura §20, CT-13/EX-65–74 e seção 10.2; D42-01 confirma alças nas arestas e redesenho para acrescentar ou retirar cantos.

### 10.1. M4.1 — Pavimentos

**Estado:** implementado e revisado no aplicativo 0.8.0; corrigidas as pendências de navegação da Fiada, alternativas numéricas, reconciliação de escolhas não afetadas e identificação do pavimento ativo, além de renomeação, transporte e altura inicial. A duplicação de escolhas incompatíveis também foi corrigida e verificada, preservando a pendência na cópia e a intenção da origem. Aceite global do solicitante registrado na seção 10; execução individual do roteiro manual não informada. Lajes e comparação implementadas estão registradas separadamente nas §§10.2–10.3; não integram o recorte original de M4.1.

#### Alcance e limites

Gestão e edição de 1–4 pavimentos com cota única, composição nominal isolada, configurações comuns, ajustes locais, navegação, diagnóstico, histórico e arquivo novo. RF-07/08/09/10/12 e integração com RF-02/04/05/06. Contratos em Arquitetura §19.1–5 e convenções/exemplos em Caderno §11.1/EX-56–64. Manter comportamentos de paredes, união/movimento, vãos empilhados, L/T/cruz, canaletas e grautes já entregues, executados no pavimento correto.

Não inclui lajes ou suas aberturas, sobreposição visual de andares, vínculos/diagnósticos entre pavimentos, quantitativos, novas peças/regras construtivas ou compatibilidade com arquivos anteriores. `model.slabs` permanece vazio. Duplicação de laje prevista em RF-08 somente entra com M4.2. Não criar telas, ícones ou controles de funções futuras. A ausência de lajes não impede testar cotas, propriedade e isolamento dos quatro pavimentos no próprio aplicativo.

#### Tarefas

- [x] **M4.1-T01 — Especificação documental:** delimitar recorte de RF-08 e recálculo completo da duplicação; definir envelope 8/nominal-v9, propriedade local, limites, exemplos EX-56–64, tarefas e critérios abaixo. Conclusão somente documental.
- [x] **M4.1-T02 — Domínio e contrato:** tipos e schemas estritos de pavimentos/resultados/ajustes conforme §19.1/2; validar cotas, UUIDs, referências, propriedade e limites de integridade antes de confirmar; remover dependência funcional de `floors[0]` e das referências separadas `level/start` no contrato novo.
- [x] **M4.1-T03 — Composição por pavimento:** nominal-v9 com paginação local de M3.5 preservada, fase local, faixas/eixos/IDs isolados e diagnósticos locais/agregados. Recálculo completo determinístico, sem orçamento ou tetos de geração por módulos/células/fiadas/peças/eixos/intervalos derivados. Remover os bloqueios antigos no cálculo e nos schemas de resultado. Sem truncamento ou detecção geométrica entre andares.
- [x] **M4.1-T04 — Operações e histórico:** criar, renomear, alterar cota/altura padrão, duplicar e remover com remapeamento atômico; preservar medidas relativas e deslocar supressões absolutas; manter pendências. Integrar edição de paredes/vãos/ajustes e configurações comuns sem compartilhamento indevido.
- [x] **M4.1-T05 — Interface e navegação:** seletor ordenado, propriedades/ações de pavimento, estado vazio de Fiada, câmera compartilhada, seleção e última fiada por andar; diagnóstico muda para o proprietário antes de localizar. Cancelamento, foco, operações ocupadas e iconografia conforme Arquitetura §2.1/19.4.
- [x] **M4.1-T06 — Persistência e recusa de formatos:** gravar e importar envelope 8, validar snapshot nominal-v9 e rascunho sem resultado; identificar registros locais/arquivos anteriores como incompatíveis sem conversão ou exclusão automática. Preservar bloqueio por projeto, original importado, trabalho aberto e recuperação de falhas. Remover código mantido exclusivamente para compatibilidade anterior quando necessário, preservando regressões do comportamento atual.
- [x] **M4.1-T07 — Verificação:** implementar verificações significativas de EX-56–64 e A01–14, testes de domínio/persistência e fluxos Chrome/Edge na porta 5174, verificações de tipos/lint/build e revisão visual; registrar carga real e limites. Adaptar regressões funcionais para envelope 8, sem manter geradores antigos para testar formatos recusados.
- [x] **M4.1-T08 — Consolidação e entrega para teste:** corrigir falhas pertinentes, atualizar estado implementado no PRD/arquitetura/README e consolidar alcance, evidências, limitações e testes pendentes neste marco. Entregar roteiro manual ao solicitante e manter seu aceite separado das verificações do Codex.

#### Critérios de aceite

| ID | Resultado verificável |
|---|---|
| M4.1-A01 | Novo projeto abre térreo em cota 0. Criar pavimento vazio exige nome/cota/altura padrão, permite cancelar sem efeito e apresenta padrão de criação do projeto sem herdar vizinho. Referência de 280 cm válida diretamente para tijolo usual de 7 cm; alternativas só para altura personalizada incompatível. Alterar padrão não redimensiona paredes existentes. Renomear e desfazer/refazer apenas o nome preservam composição e ajustes (inclusive escolhas incompatíveis), salvam/historicizam sem cálculo — EX-62; RF-08. |
| M4.1-A02 | Entre 1 e 4 pavimentos; quinto e último removido são impedidos. Cotas negativas/zero permitidas, cotas iguais/não modulares recusadas; alternativas não confirmam duplicata. Ordenação após criar/editar depende da cota e preserva UUIDs — EX-56; RF-08. |
| M4.1-A03 | Envelope 8 contém cota única (`level`, sem `start`), propriedade por `floorId` e referências válidas. UUID duplicado, órfão e associação de ajustes entre pavimentos recusados sem substituir o aberto. Pendência geométrica íntegra continua salvável — EX-63; §19.1. |
| M4.1-A04 | Mesma geometria em andares distintos compõe independentemente: fiadas reiniciam em 1, fase não depende da cota, conversão global correta inclusive negativa e IDs derivados distintos. L/T/cruz, transições de altura, vãos empilhados e união/movimento mantêm suas regras dentro do pavimento. Sobreposição indevida no mesmo andar mantém diagnóstico; não há colisão/apoio/alinhamento verificado entre andares — EX-57/58 e regressões CT-07–12. |
| M4.1-A05 | Níveis/categorias/padrões comuns se aplicam a cada pavimento na referência local; inclusão/exclusão de graute, escolhas de encontro e supressões/restauração atingem só o proprietário. Eixos coincidentes em x/y não compartilham ajustes; alterar configuração não apaga intenção local ou pendente — EX-58/59. |
| M4.1-A06 | Editar cota conserva alturas, medidas relativas e UUIDs; supressões globais, inclusive dormentes/pendentes, recebem o delta correto. Ordenação atualizada, demais pavimentos intactos; desfazer/refazer restaura exatidão — EX-59. |
| M4.1-A07 | Duplicação exige destino válido, copia toda intenção de M4.1 com novos IDs/referências/componentId/signature coerentes e não cria pendências em uma cópia válida. Escolhas já pendentes são preservadas quando existirem, sem exigir criá-las para executar o caso principal. Escolha ainda ativa com componentId/signature incompatíveis na origem é copiada como pendente, sem se tornar aplicável apenas pelo remapeamento de IDs. Configurações comuns conservam IDs. Uma operação de histórico e recálculo completo do projeto; sem transportar peças ou alterar a origem; desfazer/refazer não cria novos UUIDs — EX-60. |
| M4.1-A08 | Remoção elimina somente proprietário e dependentes, inclusive pendentes; preserva demais cotas/IDs. Seleção de ativo removido vai ao anterior ou seguinte; remover não ativo mantém ativo. Desfazer restaura relações originais e refazer repete a operação, respeitando o mínimo de um — EX-61. |
| M4.1-A09 | Troca conserva câmera, limpa seleção/gestos/prévias sem commit e recupera fiada local da sessão. Vazio não tem fiada fictícia ou ajustes ativos; abrir projeto seleciona menor cota em Planta. Localizar/Ver fiada/Editar na Planta abre o andar do alvo, sem editar o anteriormente ativo; seletor indisponível durante operação ocupada. Novo/Duplicar/Excluir na barra usam botões compactos somente com ícones, nomes acessíveis e dicas por mouse/teclado. Sem ferramentas de laje ou sobreposição entre andares — EX-61; RF-04/10. |
| M4.1-A10 | Reabrir/transportar envelope 8 preserva os quatro pavimentos e intenções, com snapshot completo quando cabe no arquivo ou recomposição determinística ao abrir backup sem resultado derivado; importação mantém IDs internos e gera novo ID de projeto. Resultado atual completo é validado por recomputação nominal-v9, recusando adulteração com mesma contagem de peças. Rascunho desatualizado íntegro tem resultado ausente e reabre sem validade fictícia — EX-63. |
| M4.1-A11 | Arquivos versões 1–7 e futuras são recusados sem migração ou execução de geradores legados, preservando arquivo original, documento aberto, histórico e seleção. Registros locais antigos são identificados como incompatíveis sem apagamento automático; criar novo projeto continua possível. Leitura bloqueada permite somente cálculo para conferir snapshot, sem atualizar/substituir o resultado ou gravar; regeneração para atualizar o projeto exige bloqueio exclusivo — EX-63; RF-12. |
| M4.1-A12 | Limites de integridade de §19.5 verificados: cotas derivadas, registros e tamanho do arquivo/intenção serializada. Download compacto acima de 50 MiB por resultado derivado preserva toda intenção, sem resultado, e avisa que a abertura o recompõe; não altera a memória atual. Excesso estrutural recusa mutação/cópia inteira. Não há orçamento/tetos de geração ou diagnóstico correspondente; cálculo e schemas de resultado não recusam documento pela quantidade derivada ou estimada. Sem truncamento ou perda de ajustes; não exige gerar volumes altos para provar ausência do bloqueio — EX-64. |
| M4.1-A13 | Alteração geométrica/construtiva: salvar intenção → calcular projeto inteiro → salvar resultado, sem operações concorrentes. Renomeação apenas salva/historiciza; seleção/câmera/troca de andar são transitórias. Falhas do motor/primeiro ou segundo salvamento liberam controles e preservam intenção/download. Exceção deixa resultado ausente/desatualizado; erro geométrico concluído não elimina pavimentos independentes. Histórico até 50 intenções, sem peças, e bloqueio entre abas por projeto preservados — EX-64; RF-09/12. |
| M4.1-A14 | Typecheck, lint, domínio/persistência, fluxos e2e pertinentes em Chrome/Edge e build com resultados registrados; revisão de interface/iconografia conforme §2.1 em 1366×768, 1280×720 e 900×680. Bases 25/30 e personalizada 2:1, altura-base diferente de 7 e módulo 12,51 cm; carga de quatro pavimentos dentro dos limites com tempos e limitações reais. Aceite manual do solicitante permanece separado; não declarar a meta de 100 mil peças comprovada sem medição pertinente. |

#### Roteiro manual de referência

| Passo | Ação | Esperado |
|---|---|---|
| 1 | Criar projeto, adicionar cotas −21/280/350, tentar quinto, cota repetida e 281 cm com h=7 | Ordem por cota, quatro no máximo, alternativas explícitas e cancelamentos sem alteração — A01/02. |
| 2 | Desenhar geometria coincidente em dois andares; criar vãos, canaletas, grautes e ajustar um encontro só em um | Composição/fiadas e ajustes independentes, mantendo regras atuais — A04/05. |
| 3 | Alterar cota de um andar e altura padrão; desfazer/refazer | Medidas relativas e IDs preservados, demais imóveis; padrão não redimensiona existentes — A06. |
| 4 | Duplicar um andar válido com encontro e supressão, editar a cópia | Independência, sem novas pendências; IDs/referências preservados no histórico, recálculo completo — A07. |
| 5 | Remover ativo, não ativo e tentar remover o último; desfazer/refazer | Seleção previsível, dependentes restaurados e outros andares preservados — A08. |
| 6 | Alternar pavimentos em Planta/Fiada, visitar vazio e localizar diagnóstico de outro andar | Câmera e última fiada, vazio correto e localização no proprietário — A09. |
| 7 | Reabrir, baixar/importar em outro navegador; tentar arquivo anterior e projeto local incompatível | Novo contrato íntegro; incompatibilidade sem conversão/perda do aberto — A10/11. |
| 8 | Usar quatro pavimentos e conferir status, espera e persistência no uso habitual | Resultado atualizado, sem compartilhamento de ajustes, espera observável; registrar problemas e limites — A12–14. |

#### Estado consolidado, verificação e aceite

**Alcance implementado:** envelope 8/nominal-v9; criação, edição de nome/cota/altura padrão, cópia e remoção de 1–4 pavimentos; composição e validações locais, ajustes independentes, navegação/diagnósticos no proprietário, histórico e persistência. Cópia remapeia toda a intenção e recalcula o projeto inteiro; alterar cota desloca supressões absolutas. Renomear salva e participa do histórico sem calcular. A fiada local é preservada também durante o recálculo de uma edição e ao trocar de proprietário pelo Desfazer. Se uma redução de altura a elimina, selecionar a última válida e manter o aviso após salvar. Abertura seleciona menor cota em Planta. Formatos antigos são recusados, sem leitores/migrações legados e sem apagar registros locais. Sem orçamento de geração, preservando limites de integridade de §19.5.

**Verificação do Codex:** revisão atual sem novas falhas reproduzíveis confirmadas. Suíte integral de domínio/persistência: 215 testes aprovados em 14 arquivos. Uma matriz adicional de revisão aprovou 16 cenários de cópias encadeadas, cotas de origem/destino negativas e positivas, escolhas válidas/pendentes e incompatibilidade de assinatura ou componente, com origem intacta e arquivo reabrível. Dez fluxos pertinentes passaram em Chrome/Edge na porta 5174: duplicação incompatível com histórico/reabertura/resolução explícita, duplicação válida, renomeação com escolha incompatível, alternativas numéricas descartadas/rodapé e localização do diagnóstico pela Fiada. Logs locais em `.tools/m41-review-copy-correction-*.txt` e fontes/log da matriz em `.tools/m41-copy-review-matrix.*`. Nenhuma alteração de código de produto nesta revisão. Tipos, lint e build passaram na verificação da última correção (`.tools/m41-copy-fix-*.txt`), sem repetição nesta revisão. A suíte integral de navegador de referência confirmou 124 cenários distintos (123 na rodada integral e o fluxo interrompido pela recarga do Vite aprovado na repetição com código estável); ela não foi repetida nesta revisão focada. A verificação anterior dos nomes acessíveis, dicas por foco, centralização dos SVGs (tolerância de 1 px), largura dos botões até 32 px e integrações dos controles compactos permanece registrada; nenhuma alteração de interface/iconografia nem nova auditoria visual foi feita. Referências locais e `git diff --check` conferidos.

**Carga observada na rodada final de pavimentos:** quatro pavimentos, 100 paredes e 50 fiadas por andar, 400 paredes e 110.000 peças totais; abertura/importação/cálculo/salvamento em 3.249 ms no Chrome e 3.195 ms no Edge. Conferidas 500/600 peças por andar nas fases A/B, 50 fiadas locais em cada andar e ausência de diagnósticos. Cenário com canaletas e grautes automáticos desligados; não representa medição de todas as combinações, gestos ou projetos desse tamanho. Não há garantia geral de desempenho. Logs locais em `.tools/m41-final-e2e.txt`, capturas de carga abaixo.

**Rastreabilidade:** [domínio/persistência dos pavimentos](../tests/floors.test.ts) cobre EX-56–64, bases 25/30/28/25,02, alturas-base 6/7 cm, cotas negativas, IDs/propriedade, cotas derivadas, cópia/remoção, snapshots adulterados, versões recusadas e ausência dos tetos antigos; [estado e falhas](../tests/floor-state.test.ts) cobre renomeação sem cálculo, recálculo completo, histórico, última fiada/aviso após salvar, bloqueio e recuperação de falhas do motor/duas gravações. [Fluxos de pavimentos](../tests/e2e/floors.spec.ts) exercitam CRUD, cancelamentos, isolamento de graute coincidente, cópia de encontro/supressão, alteração de cota, reabertura, diagnóstico de outro pavimento, importação recusada e segunda aba. As regressões de paredes, união/movimento, L/T/cruz, vãos empilhados, canaletas e grautes usam o formato atual; testes exclusivamente de migração foram retirados, pois os formatos são incompatíveis neste marco.

**Interface:** revisão visual em 1366×768, 1280×720 e 900×680; seletor e ações de pavimento legíveis, botões sem excesso de conteúdo. A barra de pavimentos usa botões compactos somente com ícones centrais Lucide Plus/Copy/Trash2 para Novo/Duplicar/Excluir, com nomes acessíveis e dicas por hover/foco; ações, bloqueios e confirmação preservados. Sem catálogo ou SVG avulso. Capturas locais em `.tools/m41-<navegador>-<largura>.png` e `.tools/m41-load-<navegador>.png`. Não representa auditoria completa de acessibilidade.

**Limitações:** M4.2/M4.3/M5 fora do recorte; `model.slabs` vazio, sem controles de laje ou comparação entre andares. Nenhuma validação de apoio, continuidade ou colisão entre pavimentos. Processamento síncrono com espera, sem garantia geral de tempo/memória; a retirada dos tetos não significa capacidade ilimitada. Build com avisos não impeditivos de anotações do Zod e bundle de 882,37 kB (275,22 kB gzip), acima de 500 kB.

**Correções da revisão:** renomear preserva ajustes e snapshot sem reconciliação/cálculo, inclusive quando há escolha incompatível diagnosticada; a referência de altura inicial escolhida é gravada em `project.initialWallHeight` e não depende de outro pavimento; o transporte usa JSON compacto e, se necessário para caber em 50 MiB, salva toda a intenção com resultado ausente e aviso de recomposição na abertura. A validação recusa intenção acima do limite de transporte antes de confirmar alterações. Sem orçamento ou teto de geração. Arquivos de M4.1 sem referência inicial gravada conservam a sugestão de 280 cm, com escolha explícita quando não modular; não há dados suficientes para recuperar retroativamente a referência original.

**Cobertura das correções:** [estado e renomeação](../tests/floor-state.test.ts) verifica escolha incompatível, snapshot, ausência de recálculo, desfazer/refazer e arquivo reabrível; [transporte e referência inicial](../tests/transport.test.ts) verifica referência modular persistida, arquivo completo quando cabe e backup sem resultado derivado. O caso de domínio gera e recompõe quatro pavimentos, 400 paredes, 200 fiadas por andar e 440 mil peças, preservando modelo, configurações, ajustes e metadados, sem modificar o resultado em memória. [Fluxos no navegador](../tests/e2e/floors.spec.ts) confirmam em Chrome/Edge a altura personalizada após edição/reabertura/remoção do térreo, renomeação com escolha incompatível e download/importação/recomposição do backup grande com aviso. Esses fluxos de navegador pertencem à suíte integral de referência; nesta revisão foram repetidos os dez fluxos pertinentes descritos acima. A suíte atual de domínio tem 215 testes e inclui o caso de 440 mil peças, com timeout de teste de 120 s: verifica integridade, sem exigir uma meta de desempenho ou impor limite de geração ao aplicativo. Não há promessa geral de tempo/memória nem medição de todas as combinações em 440 mil peças.

**Correções de isolamento e navegação — A05/A07/A09:** a lista agregada da Fiada identifica o nome real do proprietário e o seleciona antes de localizar, usando o limite de fiadas desse proprietário. Trocar pavimento remonta as propriedades para descartar edição e alternativas numéricas transitórias, sem alterar o modelo ou criar histórico. A reconciliação de escolhas verifica se suas paredes/associações realmente mudaram, preservando a intenção incompatível diagnosticada na origem ao criar/duplicar e ao editar outro andar. O rodapé acompanha o nome do pavimento ativo. Regressões permanentes em [estado](../tests/floor-state.test.ts) conferem criação/cópia/edição de outro andar, snapshot, transporte e desfazer/refazer; [navegador](../tests/e2e/floors.spec.ts) confere descarte das alternativas, ausência de mutação/histórico na troca, rodapé e localização na Fiada em Chrome/Edge. Sem novos limites de geração ou funcionalidades de M4.2.

**Duplicação de escolhas incompatíveis — RF-08, A07/A10:** antes de reconstruir componentId/signature com os novos IDs, a cópia confere ambos contra as paredes associadas da origem. Incompatibilidade converte somente o vínculo da cópia para pending, conservando fase/âncora e a intenção original sem alteração. Escolhas válidas permanecem ativas; escolhas já pendentes permanecem pendentes. Não há cálculo adicional nessa conferência, migração, novo formato ou limite de geração. [Domínio](../tests/floors.test.ts) cobre assinatura incompatível, componente incompatível e ambos, origem intacta, diagnóstico na cópia e snapshot reabrível; [estado](../tests/floor-state.test.ts) confere cópia pendente, transporte e desfazer/refazer. [Navegador](../tests/e2e/floors.spec.ts) confirma preservação da pendência e dos IDs no histórico/reabertura, zero peças no componente da cópia até a resolução explícita e origem inalterada após descartar a escolha somente na cópia. A cópia válida continua sem novas pendências.

**Aceite do solicitante:** registrado na seção 10. Sem resultados individuais informados para o roteiro manual; como referência, realizar os oito passos do roteiro acima no monitor e navegador habituais. Conferir especialmente cotas/alternativas, independência das edições, cópia, alteração de cota, troca de fiada/câmera, altura personalizada após reabrir e transporte entre navegadores, inclusive o aviso de backup sem resultado calculado. No passo 6, deixar uma alternativa numérica aberta antes de trocar andar, conferir seu descarte e o nome no rodapé, e localizar pela Fiada um diagnóstico de outro pavimento. Nos passos 2/4, conferir que criar/copiar/editar outro andar preserva as escolhas da origem, inclusive incompatíveis diagnosticadas. Na cópia, conferir que a escolha incompatível permanece pendente após desfazer/refazer e reabrir; descartá-la ou escolhê-la novamente só deve liberar a composição da cópia, sem resolver a pendência da origem. Nenhum resultado individual de passo manual foi atribuído ao solicitante. Conferir também os botões somente com ícones e suas dicas no monitor habitual.

### 10.2. M4.2 — Lajes

**Estado:** implementado no aplicativo 0.9.0/envelope 9, com verificações consolidadas abaixo e aceite global do solicitante registrado na seção 10. M4.1 preserva os comportamentos de pavimentos e composição, com evidências e roteiro manual de referência próprios na §10.1. D42-01 confirmada e implementada: alças nas arestas e redesenho para acrescentar ou retirar cantos. M4.3 e M5 não integram esta entrega.

#### Alcance e contratos

RF-13 define desenho por vértices, confirmação/cancelamento, representação/seleção e edição da laje no pavimento ativo; RF-08/09/11/12 mantêm pavimentos, histórico, arquivo e recuperação. Arquitetura §20 define intenção `Slab`/aberturas aninhadas, envelope 9 implementado, validação atômica, comandos e integração. CT-13/EX-65–74 definem oráculos geométricos. Esses documentos são as fontes dos contratos; as tabelas abaixo relacionam execução e resultado observável.

Até uma laje por pavimento, independente de paredes; sem distinção piso/cobertura, cota própria, recorte de alvenaria ou mudança em seus ajustes. Sem dimensionamento estrutural, armaduras, quantitativos, validação volumétrica, orçamento ou limite de geração. A representação é apenas em Planta do ativo; comparação de andares pertence a M4.3. Espessura positiva é informada explicitamente, sem valor construtivo sugerido.

#### Decisão de produto confirmada

| ID | Comportamento acordado | Estado |
|---|---|---|
| D42-01 | Alça no meio de cada aresta, com arraste perpendicular modular; sem alça livre de vértice. Para incluir/remover cantos, Redesenhar contorno reutiliza o desenho por vértices, conservando ID e aberturas até confirmar. Mesmo comportamento para exterior e abertura. | Confirmada pelo solicitante como suficiente para M4.2 e implementada após autorização. Aceite global da funcionalidade registrado na seção 10. |

O comportamento confirmado está especificado em RF-13/Arquitetura §20. Critérios, verificações e roteiro de alças/redesenho integram o escopo de M4.2 sem condição de aprovação adicional. Não há decisão de produto bloqueante identificada neste recorte. Essa confirmação do escopo não equivale a implementação, teste ou aceite da funcionalidade.

#### Tarefas identificadas

- [x] **M4.2-T01 — Detalhamento documental:** distribuir comportamento, contratos, CT-13/EX-65–74, tarefas/aceite/roteiro entre os quatro documentos existentes, sem implementar código.
- [x] **M4.2-T02 — Fechar D42-01:** confirmação do solicitante registrada para alças nas arestas e redesenho para acrescentar ou retirar cantos; comportamento, contratos, critérios e roteiro atualizados nos documentos existentes, sem implementar código.
- [x] **M4.2-T03 — Geometria de domínio:** validar anéis, concavidade, contatos e contenção de regiões; candidatos de translação/edição sem mutação parcial, espessura/face inferior e precisão. Cobrir EX-65–72 por oráculos independentes, sem rasterização da área ou regras construtivas novas.
- [x] **M4.2-T04 — Modelo e arquivo:** implementar envelope 9 com Slab e aberturas aninhadas, UUIDs/propriedade, schema/referências/validade e round trip. Recusar outros envelopes sem migração, preservar incompatíveis e aberto, manter snapshot nominal-v9 e backup compacto. EX-74; Arquitetura §20.1/20.2/20.4.
- [x] **M4.2-T05 — Comandos e estado:** CRUD/movimento de laje/abertura, espessura e contorno; uma operação por confirmação/gesto, histórico/recálculo completo/salvamento, no-op/cancelamento sem efeito e recuperação real de falha. Integrar duplicação/exclusão/cota, incluindo face inferior derivada e remapeamento de IDs. Preservar ajustes de M4.1 inalterados, inclusive incompatíveis diagnosticados. EX-71–74.
- [x] **M4.2-T06 — Desenho no aplicativo:** Laje/Adicionar abertura, vértices/prévia/retirar último, fechamento explícito, revisão/confirmar/cancelar, espessura, troca de contexto e navegação sem commit; mensagens de impedimento com alvo. Sem ferramenta futura.
- [x] **M4.2-T07 — Seleção e edição:** camadas com vazios reais, seleção do ativo, lista de alvos sobrepostos e acesso por propriedades, movimento de laje/abertura e exclusão. Implementar alças/redesenho conforme D42-01 confirmada. Enquadramento inclusive sem paredes; Fiada conserva M4.1.
- [x] **M4.2-T08 — Verificação integrada:** verificações abaixo, regressões essenciais de M4.1, correção das falhas pertinentes e revisão visual/iconografia conforme Arquitetura §2.1. Resultados consolidados abaixo; aceite global do solicitante registrado na seção 10; resultados individuais do roteiro manual não informados.

#### Critérios de aceite verificáveis

| ID | Resultado verificável |
|---|---|
| M4.2-A01 | Criar laje funciona com ou sem paredes; segunda laje no mesmo andar impedida com explicação. Até quatro lajes, uma por proprietário; trocar de andar mostra somente a própria. Criar pavimento não herda laje — RF-08/13. |
| M4.2-A02 | Clique fixa vértice modular, prévia tem um segmento ortogonal e não inventa cantos; retirar último funciona. Fechar exige ação explícita e anel válido. Fechar não cria entidade: Confirmar exige espessura positiva explícita. Após fechar, somente Confirmar contorno e Cancelar; corrigir pontos exige cancelar e reiniciar, preservando o original em edições. Cancelar/Escape/troca de contexto/foco antes do commit preservam documento, snapshot e histórico. Novo desenho funciona após cancelar — CT-13, EX-69. |
| M4.2-A03 | Retângulo e concavidade válidos, anéis invertidos/rotacionados equivalentes; cruzamento, auto-toque, segmento zero, repetição, retorno, redundância colinear e ponto fora da malha são recusados. Aberturas não tocam/sobrepõem borda nem outras aberturas, inclusive canto, coincidência e contenção. EX-65–70 têm os resultados descritos; não validar concavidade somente pelos vértices. |
| M4.2-A04 | Espessura 21/14/14,01 cm em Z=280 produz inferiores 259/266/265,99 cm, mantendo topo 280; zero/negativo/precisão inválida e inferior fora do limite impedidos. Nenhum múltiplo de h exigido ou cota independente persistida — EX-72. |
| M4.2-A05 | Movimento de laje translada exatamente todos os anéis e preserva IDs/t; movimento de abertura altera só seu anel. Prévia/soltura válida geram uma única operação. Arraste inválido/fora/perda de foco/Escape/zero não muda intenção, ajustes, resultado, histórico ou estado de salvamento — EX-71; Arquitetura §20.3. |
| M4.2-A06 | Alças deslocam aresta apenas perpendicularmente, conservando ortogonalidade e vizinhos; colapso/toque/invasão impedem commit. Redesenho muda cantos, conserva ID e aberturas originais, confirmando somente conjunto válido; cancelamento restaura integralmente. Mesmo contrato no anel de abertura — D42-01 confirmada; EX-71. |
| M4.2-A07 | Malha/laje/parede-vão/realces/prévias na ordem definida; vazios deixam ver fundo e paredes, sem máscara opaca. Clique prioriza vão de parede, parede, abertura de laje e laje, sem caixa entre categorias; ambiguidades restantes oferecem alvos identificáveis. Alças e arraste do alvo escolhido pela lista têm prioridade, sem movimento acidental ao clicar. Laje/aberturas acessíveis também pela lista; clicar vazio sem alvo limpa seleção. Enquadrar inclui laje isolada; Fiada sem paredes continua vazia — RF-13; §20.5. |
| M4.2-A08 | Excluir abertura preserva laje/irmãs; excluir laje remove todas as aberturas após confirmação e cancelar conserva tudo. Delete não atua em campos. Desfazer/refazer restaura IDs/geometria/t/relações, uma operação por gesto, sem peças no histórico. Durante prévia, primeiro Desfazer só a cancela — RF-09/13. |
| M4.2-A09 | Duplicar andar com laje/aberturas remapeia todos os UUIDs locais e preserva anéis/t; faces seguem cota de destino. Alterar cota conserva anéis/IDs/t e desloca ajustes absolutos de M4.1. Remover andar elimina somente seus dependentes e mantém regra do último/seleção. Desfazer/refazer restaura IDs sem gerar outros; falha de integridade recusa operação completa — EX-72/74. |
| M4.2-A10 | Inserir/editar/excluir laje, inclusive vazio sobre parede, conserva paredes, alturas, vãos, ajustes, composição nominal-v9 e pendências anteriores. Não cria diagnóstico de apoio/colisão/interseção entre laje e paredes ou pavimentos; colisão indevida de paredes no mesmo andar mantém diagnóstico existente. Grautes/eixos e fiadas permanecem locais — EX-73; regressões CT-07–12 e EX-58–60. |
| M4.2-A11 | Envelope 9 válido reabre/transporta anéis, t, UUIDs e proprietário, com e sem resultado; importação muda somente ID do projeto. Versão 8/outras, ID duplicado, proprietário órfão, segunda laje, anel/abertura inválidos ou snapshot adulterado são recusados antes de substituir memória/histórico/seleção. Backup compacto conserva toda intenção de laje e recomposição; bloqueio de outra aba preservado — EX-74. |
| M4.2-A12 | Fluxo salvar intenção → calcular projeto inteiro → salvar resultado, sem nova política de cálculo parcial e sem reconciliação de escolhas inalteradas. Falhas do motor ou de qualquer gravação liberam controles e conservam intenção/download e atualidade real; nenhum candidato inválido vira rascunho persistido. Limites de integridade mantidos, sem orçamento de geração — §20.2/20.3. |
| M4.2-A13 | Typecheck/lint/testes de domínio e persistência/e2e pertinentes/build executados com resultado real. Chrome/Edge na 5174, sessões isoladas, revisão visual em 1366×768, 1280×720 e 900×680 conforme §2.1. Separar verificação do Codex de teste/aceite manual do solicitante; sem alegar implementação ou aprovação por existir este plano. |

#### Verificações previstas para a implementação

| Camada | Evidência a executar e registrar |
|---|---|
| Geometria | EX-65–71 com oráculos de segmentos, pontos materiais/vazios e áreas independentes; sentido/rotação/reflexão/translação; fronteiras de toque, colinearidade e concavidade em U; deltas e estado anterior integral em candidatos inválidos. Bases 25/30/personalizada 28×14×6 e módulo 12,51 cm; t não modular, cotas negativas e aritmética exata perto dos limites. |
| Integridade/persistência | EX-72/74: UUIDs únicos/proprietário, cópia e remoção com histórico, anel aninhado inválido, referência órfã e versão incompatível, snapshot adulterado, round trip, rascunho com resultado ausente e backup sem resultado preservando intenção. Fronteira de 50 MiB e cotas derivadas sem gerar grande número de peças como condição. |
| Estado e regressão | Uma operação por gesto, no-op/cancelamento não salvam/calculam, falhas nas duas gravações/motor e bloqueio por projeto. M4.1: origem com escolha incompatível continua igual ao criar/copiar/editar laje em outro andar; cópia mantém pendência, supressão recebe delta e renomeação não calcula. Conferir também últimas fiadas, alternativas descartadas e rodapé. |
| Navegador | Criar exterior/aberturas côncavos, prévia/fechamento/cancelamentos, movimentos válidos/inválidos, espessura, seleção sob paredes, exclusão/histórico, duplicação/cota/remoção, reabrir/importar e recusa preservando aberto. D42-01: alças/redesenho e aberturas conservadas. Exercitar teclado/campos, perda de foco/soltura fora, zoom/pan e troca Planta/Fiada/andar. Chrome e Edge. |
| Interface | Legibilidade do preenchimento/bordas/vazios/realces com parede sobreposta, alcance de alças com zoom, nomes acessíveis e impedimento além de cor. Imports Lucide centrais, SVG/alinhamento e texto nos controles conforme §2.1, três resoluções. Não exigir auditoria completa de acessibilidade ou metas de desempenho não medidas. |

Na implementação, executar `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e` para os fluxos pertinentes e `npm run build`, usando runtime/README conforme AGENTS.md. O runner de e2e inicia seu servidor exclusivo na 5174; se ocupada, identificar a instância sem encerrar processo desconhecido. Revisão interativa também usa 5174 (`dev:test`); nunca iniciar/reiniciar/encerrar o servidor do solicitante na 5173. Não repetir cargas altas de M4.1 sem mudança ou preocupação concreta que justifique; preservar o teste relevante de integridade/transporte.

#### Roteiro manual de referência

Projeto de referência com base 25×12,5×7 cm; usar EX-65 (exterior 200×150 cm; aberturas 25×25 cm a partir de 25/25 e 50×37,5 cm a partir de 100/75). Usar também EX-66 para concavidade. Não há resultados manuais atribuídos a este roteiro.

| Passo | Ação | Resultado esperado / aceite |
|---|---|---|
| 1 | No térreo sem paredes, iniciar Laje, desenhar pontos e tentar fechamento diagonal; retirar último e corrigir. Fechar e conferir somente Confirmar contorno/Cancelar; cancelar, reiniciar, fechar, informar t=21 e confirmar. Tentar segunda laje. | Prévia/fechamento explícitos, nenhum commit antes de Confirmar; inferior −21 e superior 0; segunda impedida — A01/02/04. |
| 2 | Criar as duas aberturas de EX-65 e uma concavidade em outro andar (EX-66). Tentar abertura tocando exterior, outra abertura por borda/canto e uma dentro de outra. | Vazios reais, tentativas inválidas explicadas sem alterar laje/aberturas já confirmadas — A03. |
| 3 | Iniciar abertura e cancelar com Escape; repetir trocando modo/andar, janela e escolhendo um vão de parede pela lista. Durante arraste, cancelar com Escape e soltar fora. Reduzir zoom e desenhar um contorno de um módulo de lado, fechando explicitamente. | Sem resíduo, operação presa ou passo indevido de histórico; a lista cancela a prévia, e um vértice vizinho não vira fechamento por proximidade — A02/03/05. |
| 4 | Selecionar laje e mover por dois módulos; selecionar uma abertura e mover só ela. Tentar levá-la à borda externa/irmã; desfazer/refazer movimento válido. | Laje leva todos os vazios, abertura move isoladamente; inválido conserva integralmente o anterior, um gesto por histórico — A05/08. |
| 5 | Arrastar aresta externa sem atingir aberturas; tentar cruzar uma abertura/colapsar aresta e, numa laje sem aberturas, saltar a aresta para além da oposta. Redesenhar exterior côncavo válido e outro que deixe uma abertura fora; cancelar e confirmar. Repetir alça/redesenho numa abertura. | Prévia perpendicular modular, sem inversão de vizinhas mesmo quando o anel final seria simples; novos cantos pelo redesenho. ID/aberturas preservados, inválido e cancelamento sem commit — A06. |
| 6 | Desenhar parede e vão sobre laje/borda/abertura. Clicar sobre vão/parede/laje e conferir prioridade direta sem caixa entre categorias; selecionar a laje pela área livre e pela lista. Selecionar a parede nas propriedades do vão, arrastá-la por um ponto sobre o vão e depois mover a laje escolhida pela lista pelo mesmo ponto; testar alça sobre parede. Conferir escolha contextual quando há vãos empilhados. Trocar andar e conferir a lista de vãos. Testar zoom, pan e enquadramento em andar só com laje. | Clique prioriza vão, parede e laje; alças e arraste usam o alvo escolhido sem troca silenciosa, e a lista contém só elementos do ativo. Parede permanece visível no vazio, enquadramento inclui laje e Fiada do andar só com laje fica vazia — A07/10. |
| 7 | Em Z=280, alterar t para 14 e 14,01; tentar 0 e negativo. Cancelar campo, digitar usando Delete; aplicar válido e desfazer. Excluir abertura e depois laje, cancelando a confirmação antes de excluir; desfazer/refazer. | Faces derivadas corretas, campo não exclui elemento, paredes intactas; exclusões e histórico restituem toda intenção — A04/08. |
| 8 | Duplicar andar com laje/aberturas, paredes e ajustes; mudar cota da cópia, editar abertura só nela, remover e desfazer. Tentar excluir último andar. | Origem intacta, cópia independente, faces e ajustes acompanham cota; dependentes restaurados e último protegido — A09/10. |
| 9 | Aguardar “Salvo”, recarregar/reabrir, baixar e importar em outro navegador. Tentar arquivo M4.1/versão 8 com projeto aberto; conferir segunda aba bloqueada. | Geometria/propriedade preservadas, cópia importada sem substituir original; incompatibilidade sem perda, bloqueio mantido — A11/12. |
| 10 | Conferir uso habitual nas resoluções suportadas: dicas/foco, mensagens de impedimento, contraste da laje e seleção sobreposta. Retornar problemas e aceite do marco. | Interface legível e operável; registrar retorno real separadamente da verificação do Codex — A13. |

#### Estado consolidado e evidências da implementação

**Alcance implementado:** aplicativo 0.9.0/envelope 9/nominal-v10, com extensão de alturas AH abaixo; laje independente por pavimento, desenho/fechamento/revisão explícitos, espessura, aberturas, translação com dependentes, alças perpendiculares e redesenho conforme D42-01. Validação por segmentos com predicados exatos, incluindo concavidade/contatos/contenção; cancelamentos e edições inválidas preservam intenção/resultado/histórico. Camada em Planta com vazios reais, seletor de sobrepostos e acesso por lista, propriedades e enquadramento. Integração com pavimentos, remapeamento de UUIDs, cota derivada, histórico, salvamento/recálculo completo, reabertura/importação e recusa de outros envelopes sem migração. Alvenaria, ajustes e regras de M4.1 preservados; a ordenação de lajes acompanha a nova ordem após mudança de cota.

**Correções consolidadas da revisão — A02/A05/A06/A07/A09:** o gesto de aresta confere os sentidos das vizinhas contra o original e recusa salto para além da oposta, inclusive em laje sem aberturas e quando o anel final isoladamente seria simples; prévia e soltura tratam a recusa sem exceção, gravação ou passo de histórico. Fechamento pelo primeiro ponto exige também coincidência após snap, permitindo desenhar um módulo com zoom reduzido. A seleção compartilhada cancela a prévia de laje ao escolher outro elemento, inclusive pela lista de vãos de parede; o alvo explícito de parede/vão do seletor de sobrepostos é encaminhado ao próximo arraste antes da prioridade normal dos vãos. A lista de vãos usa somente o pavimento ativo, preservando navegação e propriedade do M4.1. Soltar fora também descarta a escolha transitória de arraste de parede sobre laje. Sem mudança de envelope, convenção nominal, regras construtivas ou escopo de M4.3/M5.

**Verificação do Codex — revisão atual:** tipos, lint e build passaram. Suíte integral de domínio/persistência: 240 testes aprovados em 15 arquivos, incluindo 21 casos de lajes e 17 de estado de pavimentos. A revisão acrescentou regressões de inversão por aresta e cancelamento ao selecionar outro elemento, além de enumeração de uniões simples de células numa malha 3×3 confrontadas com um oráculo independente de ocupação; concavidades, sentidos invertidos, precisão e integridade de arquivo permanecem cobertos. No navegador passaram 68 execuções pertinentes (34 fluxos em Chrome e Edge) na porta 5174, com sessões isoladas: lajes, pavimentos, vãos e edição de paredes, incluindo os novos casos de zoom reduzido, salto por alça sem mutação/histórico, arraste da parede escolhida sob vão/laje e lista de vãos restrita ao ativo com cancelamento de prévia. Os novos testes reproduziram as falhas antes da correção. Build: 903,06 kB (281,48 kB gzip), com os avisos não impeditivos conhecidos de anotações do Zod e bundle acima de 500 kB. Referências locais dos documentos/README e `git diff --check` conferidos.

**Alcance das execuções de navegador:** a implementação tem como referência a suíte integral anterior de 138 execuções aprovadas e a revalidação posterior de 12 fluxos de laje; essas rodadas não foram repetidas integralmente nesta revisão. A rodada atual selecionou os quatro arquivos pertinentes e excluiu cargas grandes e o fluxo de backup grande do navegador, pois não houve mudança no motor ou transporte que justificasse repetir essas cargas. A suíte integral atual de domínio/persistência foi executada, incluindo integridade/transporte e recuperação de falhas. Não atribuir esses resultados a teste ou aceite manual do solicitante.

**Rastreabilidade e revisão visual:** [geometria e integridade de lajes](../tests/slabs.test.ts) cobre CT-13/EX-65–74 com bases 25/30/personalizada, módulo 12,51 cm, sentido/rotação/reflexão, concavidade em U, contato/contenção, limites/aritmética exata, cópia/cota/remoção e arquivo. [Estado e falhas](../tests/floor-state.test.ts) verifica preservação integral do inválido, cancelamento antes do histórico, recálculo completo, ajustes incompatíveis conservados e recuperação de falhas de gravação/motor. [Fluxos de laje](../tests/e2e/slabs.spec.ts) exercita desenho/fechamento/revisão, vazios, alças/redesenho, movimentos, seleção sobreposta, exclusão/histórico, campos, cancelamentos/captura, cópia de pavimento com prévia pendente, Fiada vazia, reabertura e recusa de envelope 8. Regressões existentes de M1–M4.1 passaram na suíte integral. Revisão visual em 1366×768, 1280×720 e 900×680: preenchimento, vazios, bordas/alças, propriedades e controles legíveis, sem rolagem horizontal; Lucide centralizado para Laje, sem biblioteca nova. Capturas locais `.tools/m42-<navegador>-<largura>.png`. O preenchimento da prévia foi corrigido para revelar os novos vazios antes da confirmação; não há alteração geométrica no documento durante essa revisão. Não constitui auditoria completa de acessibilidade nem aceite manual.

**Prioridade de clique — A07:** no clique sem arraste, selecionar diretamente vão de parede, parede, abertura de laje ou laje, pela primeira categoria presente. Não abrir caixa por sobreposição entre categorias; manter escolha para ambiguidades da categoria prioritária. A laje continua acessível por área livre e lista. Preservar alças e arraste do alvo escolhido, inclusive laje sob parede/vão e parede sob vão; clique sem movimento aplica a prioridade e não grava histórico. Nomes dos vãos no seletor contextual incluem base/topo para distinguir empilhados. Verificação do Codex: tipos, lint e build passaram; 54 execuções aprovadas em Chrome/Edge isolados na porta 5174 (27 fluxos por navegador, arquivos lajes/vãos/edição de paredes, excluindo cargas grandes). Cobertos clique de porta/janela/vão sobre parede/laje, parede sobre laje já selecionada, área livre, ausência de commit/histórico ao clicar, arraste da laje escolhida pela lista sob vão, alça da laje sobre parede, arraste da parede escolhida sob vão, ambiguidades entre empilhados e regressões de cancelamento/pavimentos. Os fluxos existentes de interface continuam cobrindo as três resoluções. A suíte integral de domínio/persistência não foi repetida: não há alteração em anéis, arquivo ou motor. Build mantém avisos conhecidos de Zod e tamanho do bundle. Aceite global registrado na seção 10; passo 6 mantido como referência, sem resultado individual informado; M4.3/M5 permanecem fora do escopo.

**Seleção unificada na barra — A07/A09:** Selecionar elemento… substitui as listas separadas de laje/aberturas e vãos de parede, usando grupos Laje e Vãos de parede apenas do pavimento ativo. Grupos vazios são omitidos; sem elementos o controle não aparece. A escolha ativa Selecionar, apresenta propriedades e cancela prévias sem commit, preservando o acesso local no painel da laje. Descarta também novos vãos de parede aguardando confirmação, evitando que suas propriedades substituam as do alvo escolhido ou reapareçam ao limpar a seleção. Mudar o alvo encerra a lista contextual de sobrepostos da laje, sem cancelar o gesto válido do novo alvo. Trocar pavimento descarta inclusive contorno fechado ainda em revisão, sem gravar ou criar histórico. Nomes distinguem tipo, número e proprietário, com base/topo nos vãos de parede. Verificação do Codex: tipos, lint e build passaram; 36 execuções pertinentes aprovadas na revisão em Chrome/Edge na porta 5174 (18 fluxos, incluindo três casos consolidados do seletor, por navegador). Os dois casos novos reproduziram as falhas de vão pendente e lista de sobreposição antes das correções. Passaram também os 17 testes de estado de pavimentos. Cobertos grupos e IDs do ativo, seleção de laje/abertura/porta/janela/vão livre, teclado, sincronização com o painel, troca de ferramenta/pavimento, descarte de novo vão pendente, fechamento de sobrepostos e cancelamento de contorno fechado sem alteração no arquivo/histórico, além de ocultação em Fiada/pavimento vazio. Revisão visual em 1366×768, 1280×720 e 900×680, sem rolagem horizontal; capturas locais .tools/m42-elements-<navegador>-<largura>.png. Build mantém os avisos conhecidos de Zod e tamanho do bundle. A suíte integral de domínio/persistência e as cargas grandes de navegador não foram repetidas nesta revisão de interface; o contrato persistido e a geometria permanecem os mesmos. Roteiro manual de referência: conferir lista com ambos os grupos, seleção por teclado, troca de pavimento com contorno fechado pendente, escolha após novo vão não confirmado, fechamento de sobrepostos e espaço liberado na barra.

**Prévia fechada — A02/A06:** após fechamento de laje, abertura ou redesenho, o painel apresenta somente Confirmar contorno e Cancelar. Não há retorno ao rascunho aberto; para corrigir pontos, cancelar e iniciar outro desenho. Cancelar descarta apenas a prévia e preserva integralmente o original e o histórico; confirmar continua condicionado à validade e à espessura explícita na criação. Verificação do Codex: tipos, lint e build passaram; 26 execuções de lajes aprovadas em Chrome/Edge isolados na porta 5174, incluindo cancelar criação fechada/reiniciar, confirmação, cancelamento de redesenho e abertura inválida preservando o original. Os testes conferem as duas únicas ações após cada fechamento. Capturas .tools/m42-closed-<navegador>-<largura>.png revisadas em 1366×768, 1280×720 e 900×680. A suíte de domínio/persistência não foi repetida, pois não houve alteração geométrica ou de arquivo. Build mantém os avisos conhecidos de Zod e tamanho do bundle. Roteiro manual de referência: conferir as duas ações no monitor habitual e cancelar uma criação e um redesenho antes de reiniciar.

**Apresentação compacta das propriedades:** os cinco botões de aplicar/cancelar espessura, adicionar abertura, redesenhar e excluir exibem somente ícones Lucide centralizados, em dois grupos compactos. Preservam ações, estados disabled e nomes acessíveis; dicas por mouse/foco e title identificam cada ação, incluindo exclusão da abertura selecionada. Verificação do Codex desta alteração: tipos, lint e build passaram; 18 execuções funcionais de laje em Chrome/Edge e duas de apresentação passaram na porta 5174. Conferidos ícones sem texto, nomes/dicas, hover e navegação real por Tab, centro SVG com tolerância de 1 px e ausência de rolagem horizontal nas três resoluções; capturas visuais revisadas. Sem repetição da suíte de domínio, pois a alteração é de apresentação. Build com os avisos conhecidos de Zod e tamanho do bundle. Conferir manualmente o reconhecimento dos ícones e as dicas por mouse/Tab no monitor habitual; aceite global do solicitante registrado na seção 10.

**Limitações e pendências:** M4.1 e M4.2 aceitos globalmente conforme seção 10, incluindo as revisões consolidadas; resultados individuais dos roteiros manuais não informados. A confirmação de D42-01 é uma decisão de escopo distinta desse aceite. Sem comprovação estrutural, auditoria completa de acessibilidade ou garantia geral de tempo/memória. M4.3 tem implementação separada na §10.3; M5 permanece previsto, fora deste recorte.

#### Extensão do motor — alturas diferentes (AH)

**Alcance implementado:** RF-04/08/09/12, CT-14/EX-75–79 e Arquitetura §21. Envelope 9 preservado; resultado nominal-v10. Não integra M4.3/M5. A diferença de altura não bloqueia T ou vários encontros; cada fiada usa células e referências ativas, reconhece seus encontros e herda a fase absoluta do conjunto. Conflitos sem solução nas duas fases continuam suspendendo apenas o conjunto correspondente. Grautes de ponta livre consideram cada fiada, com eixos/intervalos existentes; lajes não entram no motor de alvenaria.

- [x] **AH-T01:** registrar convenção e exemplos independentes antes do algoritmo.
- [x] **AH-T02:** substituir bloqueios gerais por composição das ocupações ativas; preservar referências, fases, alternativas e conflitos reais.
- [x] **AH-T03:** conferir vãos, canaletas e grautes; evitar material ou referências acima do topo e reconhecer pontas livres após término de vizinhas.
- [x] **AH-T04:** aceitar resultados nominal-v9 no envelope 9, descartar somente derivados e atualizar cálculo ao abrir arquivo/registro local, preservando intenção e bloqueio de edição. Somente leitura atualiza em memória; resultados vigentes adulterados e versões desconhecidas são recusados.
- [x] **AH-T05:** acrescentar regressões de geometria, arquivo, estado e navegador com o projeto real; executar verificações pertinentes e registrar evidências abaixo. Aceite manual permanece separado.

| Aceite | Verificação esperada |
|---|---|
| AH-A01 | EX-75/76: T com barra ou ramo encerrando em alturas diferentes; cobertura exata, duas fases, nenhuma referência a parede encerrada. |
| AH-A02 | EX-77: vários encontros, término simultâneo e separação de conjunto sem reset de fase; alternativa global e ordem de paredes determinísticas. Bases de módulo 12,5/15/12,51 cm e altura 6/7 cm. |
| AH-A03 | EX-78: arquivo real preserva seis paredes, alturas 280/294, vãos e laje; 42 fiadas, últimas duas somente com internas, sem erro por altura distinta. Canaletas/grautes respeitam alvenaria; avisos nominais não são comprovação estrutural. |
| AH-A04 | EX-79: leitura de v9 invalida derivados sem alterar intenção/arquivo fonte; abertura gera v10 e reabertura confere o novo resultado. Snapshot v10 adulterado, intenção inválida e envelope desconhecido recusados. Falhas preservam desenho acessível e backup; aba sem bloqueio não grava. Falha de recálculo em somente leitura abre a intenção desatualizada e informa a falha junto ao bloqueio, permitindo reabertura. |
| AH-A05 | Edição de altura/desfazer/refazer, cópia e troca de pavimento, seleção/lajes, salvamento e importação preservados. Nenhum comando de conversão ou limite de geração novo. |

**Revisão consolidada — AH:** corrigida a abertura em somente leitura quando o recálculo lança exceção: a intenção validada permanece aberta e pode ser baixada, sem gravação compartilhada nem resultado parcial. Regressões cobrem falha em abertura editável/somente leitura, preservação de ajustes e histórico vazio, backup e nova tentativa editável; intenção inválida e convenção desconhecida são recusadas sem substituir o projeto aberto, liberando apenas o bloqueio da tentativa recusada. Casos adicionais conferem cruz → T → L → reta com 13/10/7/4 células, fase absoluta e referências ativas; vão no cruzamento acima da vizinha encerrada, canaleta superior e interrupção do graute; o mesmo vão abaixo do término mantém diagnóstico e suspende o conjunto inteiro. Não foram necessárias mudanças nos padrões de composição ou no formato/convenção.

**Verificação do Codex — AH:** tipos, lint e build passaram. Domínio/persistência: 257 casos aprovados em 16 arquivos, em duas execuções sem sobreposição (254 na suíte sem transporte e três no transporte separado), incluindo 11 casos de alturas e 23 de estado de pavimentos. A carga de backup com 440 mil peças passou em execução separada. As medições não estabelecem garantia geral de tempo/memória nem limite de geração. Navegador nesta revisão: 38 casos distintos aprovados, 19 por Chrome/Edge, em três arquivos (alturas, pavimentos e cruzes), na porta 5174 com sessões isoladas. Resultados conferidos entre a suíte pertinente e a reexecução dos fluxos de alturas; o status esperado distingue edição salva de Somente leitura. Cargas grandes de navegador não foram repetidas; o backup grande passou no domínio. A cobertura ampliada da implementação reúne ainda 146 execuções aprovadas em 12 arquivos. A revisão inclui importação do arquivo real, reabertura de registro local v9, edição de altura/desfazer/refazer, últimas fiadas, pavimento vazio, controle de outra aba e regressões de M4.1. O novo fluxo de somente leitura verifica por igualdade o registro IndexedDB intacto, o backup com v10 em memória e a reabertura editável após liberar o bloqueio. As verificações existentes de interface nos três tamanhos passaram. Arquivo fonte e fixture permanecem idênticos por hash; nenhuma intenção do arquivo original foi alterada. Snapshot v10 adulterado e intenção v9 inválida foram recusados nos testes. Referências locais e git diff --check conferidos. Build: 905,08 kB (282,30 kB gzip), com avisos conhecidos de Zod e bundle acima de 500 kB. Estes resultados não constituem aceite manual nem validação estrutural.

**Roteiro manual de referência:** (1) importar o projeto de referência, abrir fiadas 40/41/42 e conferir desaparecimento das externas sem alterar alturas ou laje; (2) editar uma externa para 273 cm, desfazer/refazer e confirmar desenho e atualização; (3) baixar/reabrir e abrir um registro local com cálculo anterior, conferindo atualização automática sem novo passo no histórico; (4) conferir canaletas/grautes, copiar/trocar pavimento e confirmar independência; abrir o registro antigo em outra aba para conferir somente leitura, cálculo em memória e ausência de gravação compartilhada. A verificação do Codex não constitui aceite do solicitante.

### 10.3. M4.3 — Comparação visual entre pavimentos

**Estado:** implementado no aplicativo 0.10.0, mantendo envelope 9 e composição nominal-v10. Verificações pertinentes do Codex concluídas; aceite global do solicitante registrado na seção 10; execução individual do roteiro manual não informada. Os resultados dos marcos anteriores não substituem as verificações próprias desta entrega.

#### Alcance e referências

RF-08 define produto e interação; Arquitetura §22 define sessão, resolução, camadas e integração; CT-15/EX-80–85 no Caderno §11.4 fornece oráculos independentes. Preservar M4.1, M4.2 e a atualização de cálculo da extensão AH. Até uma referência inferior/superior imediatamente adjacente, somente em Planta, atrás do ativo, identificada e sem interação. Comparação desligada ao abrir e no ativo ao entrar em Fiada. Trocar ativo recupera sua direção lembrada por pavimento na sessão, sem novos dados persistidos; envelope 9 e nominal-v10 preservados. Sem vínculos, alinhamento automático, comparação volumétrica, reforços contínuos, quantitativos ou avanço para M5.

#### Tarefas identificadas

- [x] **M4.3-T01 — Contratos documentais:** detalhar RF-08, Arquitetura §22 e CT-15/EX-80–85; relacionar tarefas, aceite e roteiro neste plano. Contratos preservados na implementação, sem ampliação para M5.
- [x] **M4.3-T02 — Sessão e adjacência:** resolver vizinho por cota e direção; normalizar referência inexistente; integrar memória por pavimento nas trocas de ativo, limpeza ao abrir/fechar e no ativo ao entrar em Fiada; manter referência local de fiada independente. Cobrir renomeação, reordenação e histórico.
- [x] **M4.3-T03 — Apresentação:** integrar seletor compacto e identificação acessível; renderizar intenção da referência com projeção comum e camadas previstas, sem preenchimentos opacos sobre vazios, elementos gerados ou controles do outro andar.
- [x] **M4.3-T04 — Interação e câmera:** excluir referência de todos os caminhos de seleção, hover, alças, arraste, encaixe, união e propriedades; preservar alvos e prioridades ativos; enquadrar união somente por ação explícita e manter zoom/pan comuns.
- [x] **M4.3-T05 — Integração e integridade:** preservar histórico, alterações de cota/duplicação/exclusão e cancelamentos de M4.1/M4.2; arquivo/IndexedDB sem preferência de comparação, sem salvamento ou recálculo por alteração visual; consulta readonly sem escrita; manter atualização v9→v10 existente.
- [x] **M4.3-T06 — Verificações pertinentes:** executar casos de resolução/projeção/limites, estado/persistência, fluxos de navegador e regressões associados aos aceites abaixo; corrigir falhas encontradas.
- [x] **M4.3-T07 — Consolidação da entrega:** registrar alcance efetivamente implementado, comandos/resultados, limitações e roteiro manual de referência; preservar a distinção entre verificação do Codex e aceite do solicitante.

#### Critérios de aceite verificáveis

| ID | Resultado verificável | Evidência prevista |
|---|---|---|
| M4.3-A01 | Um seletor Comparar pavimento somente em Planta com ≥2 pavimentos; nenhuma, inferior e superior disponíveis conforme a ordem de cotas. Nomes repetidos distinguíveis por direção/cota; nunca listar o ativo, andar não adjacente ou vizinho inexistente. | EX-80; resolver e navegador com 1/2/4 pavimentos, cotas negativas e criação fora de ordem. |
| M4.3-A02 | Uma única planta de referência, com identificação de nome/cota/direção; mesma transformação mundial do ativo, paredes/vãos/laje/aberturas corretos. Vazio real sem tampa opaca, referência atrás do ativo, sem alças/seleção ou peças/grautes/canaletas do outro andar. | EX-82/83; conferência visual e coordenadas sob pan/zoom, inclusive coincidência exata. |
| M4.3-A03 | Referência não produz alvo de clique/hover/lista, movimento, exclusão, propriedade, encaixe ou união; ativo continua editável com prioridades de vãos/parede/laje e com alça/arraste do alvo escolhido pela lista. | EX-83; testes sobre geometria exclusiva e sobreposta, incluindo parede nova que toca apenas parede de referência. |
| M4.3-A04 | Comparação não muda câmera/seleção, confirma prévias, grava, calcula ou historiciza. Enquadrar usa a caixa da união e conserva fallback sem geometria. Zoom/pan transformam ambas juntas. | EX-84/85; limites numéricos, estado antes/depois, spies de saveProject/generate sem campos pendentes e gestos no navegador. Confirmação/cancelamento de campos por foco conserva seu contrato; cancelamentos de desenho continuam conforme M4.2. |
| M4.3-A05 | Abrir/reabrir/importar limpa todas as preferências; trocar ativo recupera sua escolha válida por ID; entrar em Fiada limpa a escolha do ativo e voltar à Planta não restaura. Fiada anterior/próxima continua local ao ativo e sem planta de outro andar. Troca ativa preserva câmera e cancela prévias sem commit. | EX-80/85; fluxo Planta/Fiada, troca por seletor/diagnóstico e histórico que remova o ativo. |
| M4.3-A06 | Com mesmo ativo, renomeação/edição atualiza a referência; reordenar cotas ou criar/remover outro andar resolve o novo vizinho na mesma direção. Sem vizinho, retorna a nenhuma, inclusive nas preferências de inativos, sem restauração automática por desfazer. Preferências de IDs removidos são descartadas; novos/duplicados iniciam sem referência. | EX-81; alteração de cota do ativo e do vizinho, exclusão do referenciado/não referenciado, desfazer/refazer e duplicação que troque ativo. |
| M4.3-A07 | Ativo vazio admite referência e desenho próprio; vizinho vazio permanece vizinho sem busca de outro; andar só com laje é exibido. Cálculo ausente ou pendente não elimina a intenção da referência, nem gera diagnóstico entre andares. | EX-80/82/85, com paredes de alturas diferentes de EX-78 e um componente local pendente. |
| M4.3-A08 | Só comparar/navegar conserva integralmente modelo/ajustes, generated, diagnostics, metadata, histórico e bytes do download. Preferência ausente no arquivo/IndexedDB; abertura inicia nenhuma. Readonly consulta sem escrita; atualização de resultado antigo segue AH, sem novo conversor. | EX-85; igualdade do documento, serialização e registro armazenado; importação/reabertura, arquivo inválido preservando aberto e bloqueio entre abas. |
| M4.3-A09 | Seletor e rótulos operáveis/legíveis por teclado e mouse, direção/cota identificáveis sem depender só de cor; busy impede alteração e readonly permite consulta. Sem sobreposição de controles ou rolagem horizontal nos tamanhos previstos. | Chrome/Edge, 1366×768, 1280×720 e 900×680; Tab/setas/Enter, foco e estados; iconografia conforme Arquitetura §2.1 se utilizada. |
| M4.3-A10 | Regressões de lajes/aberturas e pavimentos preservadas: gestos canceláveis, alças/arraste sob sobreposição, lista só do ativo, cotas, cópia, exclusão, histórico, round trip e alturas diferentes. Sem alteração do resultado nominal por ligar/desligar referência. | Casos pertinentes de M4.1/M4.2/AH; comandos de qualidade e navegador abaixo, com evidências reais no encerramento. |

#### Verificações previstas para a implementação

1. **Resolução/geometria:** automatizar EX-80/81/84 com vizinhos esperados por ID e caixas explícitas, sem usar a própria função sob teste como oráculo. Conferir identidade de projeção em EX-83 com módulo 12,51 cm e coordenadas negativas. Não recalcular alvenaria para resolver referência ou limites de exibição.
2. **Estado/integridade:** observar ausência de chamadas de geração/gravação e igualdade do documento/histórico/metadados ao alterar apenas comparação. Conferir normalização após operações confirmadas e histórico, ausência de campos de sessão no arquivo, download/reabertura/importação, readonly e recusa de arquivo inválido sem perder o aberto. Regressão da atualização de cálculo antigo continua no alcance AH existente.
3. **Navegador:** fluxos reais em Chrome/Edge com sessões isoladas na porta 5174; nunca usar, encerrar ou reiniciar o servidor do solicitante na 5173. Usar o servidor próprio de npm run test:e2e, sem reaproveitamento; se 5174 ocupada, identificar a instância antes de prosseguir. Exercitar hit testing manual e Konva, cancela/confirmar de desenhos ativos, seleção/alças/arraste, cópia/cotas/histórico, readonly, enquadramento, zoom e pan. Conferir visualmente camadas, vazios, rótulos e três tamanhos; não se limitar a constatar a existência do seletor.
4. **Comandos:** após implementar, executar npm run typecheck, npm run lint, npm test, fluxos pertinentes de npm run test:e2e e npm run build. Registrar os comandos, casos realmente executados e eventuais falhas/limitações; ampliar verificação quando achados justificarem. Sem nova carga obrigatória de geração, teto de peças, biblioteca ou regra estrutural para esta sobreposição visual.

#### Roteiro manual de referência

1. Preparar três pavimentos em −21/0/280 cm, com 0 ativo; usar nomes repetidos em dois deles. No ativo, desenhar parede com porta e laje com abertura; no superior, laje e janela parcialmente deslocadas. Manter inferior vazio. Sem elemento selecionado, abrir Propriedades do pavimento e conferir que a comparação inicia desligada e o seletor identifica cada vizinho pela direção/nome/cota.
2. Selecionar inferior: conferir indicação sem elementos e ausência de salto para o superior. Selecionar superior: conferir paredes, símbolos e todas as bordas da laje/aberturas atenuados/tracejados atrás do ativo. Nenhuma área vazia deve receber tampa opaca; não devem aparecer alças ou grautes do superior.
3. Fazer coincidir previamente algumas geometrias entre ativo e superior. Clicar em vão, parede e área livre da laje ativos, usar lista, alça e arraste do escolhido; conferir a prioridade já conhecida. Clicar só em elemento de referência não deve selecioná-lo, exibir propriedades ou permitir Delete. Desenhar parede tocando apenas a referência não deve uni-la ao outro andar.
4. Ligar/trocar/desligar referência com elemento ativo selecionado: manter seleção e câmera, sem novo passo em Desfazer e sem confirmar edição pendente. Conferir prévias e cancelamentos de parede/laje/abertura por Escape, perda de foco e troca de pavimento; o original deve permanecer quando cancelado.
5. Aplicar zoom e arraste central/Espaço: ambas as plantas devem acompanhar. Mover a câmera e escolher outra referência não deve reenquadrar sozinho. Acionar Enquadrar e conferir ambas; repetir com ativo vazio e com ambos vazios.
6. Com referência superior, renomear o ativo e alterar sua cota sem trocar seu ID; conferir identificação e resolução do novo vizinho imediato. Quando a direção ficar sem vizinho, nenhuma deve permanecer mesmo após desfazer, até nova escolha. Para conferir renomeação do vizinho, ativá-lo, renomear e voltar: recuperar a direção anterior com nome atualizado. A remoção de não ativo com manutenção do ativo é conferida nos testes de estado; a interface existente exclui o andar ativo e não recebe um novo fluxo de exclusão em M4.3.
7. Trocar ativo pelo seletor e por Localizar diagnóstico, depois criar/duplicar/remover ativo e desfazer/refazer. Escolher direções diferentes em dois pavimentos e conferir recuperação independente ao alternar e retornar, inclusive Sem referência. Novo/duplicado inicia sem referência; excluído perde a preferência, sem restauração pelo histórico. Conferir normalização de inativos quando perdem vizinho, câmera preservada e gestos cancelados; lajes, alturas, cotas e ajustes seguem seus comportamentos próprios.
8. Com comparação ligada, entrar em Fiada: não deve existir planta de outro pavimento. Usar referência de fiada anterior/próxima e retornar à Planta: comparação de pavimentos deve continuar desligada. Pavimento só com laje mantém Fiada sem paredes.
9. Baixar, reabrir e importar cópia: conferir desenho preservado e comparação desligada. Reabrir registro com cálculo antigo e conferir atualização AH sem mudança de desenho. Em segunda aba, comparar em somente leitura e baixar; o registro compartilhado não deve ser alterado pela consulta.
10. Conferir seletor por teclado, foco e leitura dos rótulos no monitor habitual; reduzir para os três tamanhos previstos. Conferir que o seletor fica na lateral, não na barra, e que recolher propriedades ou selecionar um elemento preserva a comparação; limpar a seleção/reabrir propriedades permite alterá-la. Confirmar ausência de controles encobertos/rolagem horizontal e reportar resultados por passo. Conferir que o projeto sem comparação mantém a aparência e seleção habituais.

#### Estado consolidado e verificações

**Implementação:** comparação disponível em Planta pelo campo Referência de pavimento nas Propriedades do pavimento na lateral, com uma referência adjacente por cota, indicação de direção/nome/cota e estado vazio explícito. Referência tracejada atrás do ativo, vazios transparentes, símbolos de vãos compartilhados com a Planta existente e exclusão dos caminhos de interação. Enquadrar considera a união; escolher a referência conserva câmera/seleção e não dispara cálculo, gravação ou histórico. Direção lembrada por pavimento ao trocar ativo, limpa ao abrir e no ativo ao entrar em Fiada; mapa inteiro normalizado após cotas/exclusão/histórico; readonly permite consulta. Aplicativo 0.10.0, envelope 9 e nominal-v10 preservados, sem bibliotecas ou migrações novas.

**Revisão consolidada — M4.3-A04/A08/A09:** corrigido transbordo da identificação do ativo com nome de 100 caracteres em comparação; as identificações do ativo e da referência quebram palavras longas dentro do canvas, preservando controles e os limites de nomes existentes. No rodapé, somente o nome longo recebe largura limitada/reticências e dica completa, sem empurrar medidas e estado do cálculo ou ampliar a página. Cobertura ampliada para comparação com prévia fechada, Desfazer cancelando primeiro o rascunho sem consumir histórico, nomes/restauração por Desfazer/Refazer, referência exclusiva sem hover/seleção/Delete e igualdade de documento/IndexedDB. Testes de estado verificam também que comparar não apaga erro de gravação nem altera mensagem/histórico/backup, e que falha de cálculo conserva novo vizinho/intenção, com retry e histórico sem restaurar direção limpa. Não foram necessárias mudanças na seleção, persistência, formato ou motor.

**Verificação do Codex — revisão:** tipos, lint e build passaram. A suíte completa de domínio/persistência passou em uma única execução: 269 testes em 17 arquivos, com Vitest run --maxWorkers=1, incluindo 12 casos de comparação/estado e backup de 440 mil peças. A rodada pertinente de navegador executou 78 casos em quatro arquivos na porta 5174: 77 passaram; o caso Chrome de nomes máximos identificou o transbordo do rodapé, corrigido em seguida. A reexecução final dos 18 fluxos de M4.3 passou integralmente em Chrome/Edge, incluindo a correção. Assim, os 78 casos distintos da revisão foram aprovados entre a rodada pertinente e a reexecução final. As regressões de pavimentos, lajes e atualização de cálculo passaram na rodada pertinente. Capturas .tools/m43-review-long-<navegador>-<largura>.png; conferência de nomes máximos nas três resoluções, sem mudar limites de nomes ou dados persistidos. Referências locais (58), IDs e git diff --check conferidos. Build: 907,91 kB (283,25 kB gzip), com avisos conhecidos de Zod e bundle acima de 500 kB. A entrega permanece 0.10.0/envelope 9/nominal-v10; sem avanço para M5.

**Interface e memória da comparação — M4.3-A01/A05/A06/A08/A09:** seletor nas Propriedades do pavimento, abaixo do nome. Recolher o painel ou selecionar outro elemento apenas oculta o campo. Cada pavimento conserva sua direção durante a sessão ao alternar e retornar, inclusive Sem referência; escolhas são independentes e a primeira visita inicia sem comparação. Mapa transitório normalizado para todos os pavimentos após alterações/histórico, descartando IDs excluídos e direções sem vizinho, sem restaurá-los por Desfazer. Criar/duplicar não copia a preferência; histórico que troca o ativo recupera a escolha válida do destino. Abertura/fechamento limpa o mapa; entrar em Fiada limpa a escolha do ativo conforme RF-08. Sem mudanças no motor, envelope, cálculo ou dados persistidos. PRD, arquitetura, caderno e README consistentes com esse contrato. Verificação do Codex: tipos, lint e build passaram; **38 testes de estado de pavimentos e comparação em dois arquivos**, incluindo memória independente em edição/somente leitura, escolha none, exclusão e normalização de inativos, histórico, reabertura e ausência de gravação/cálculo. **20 fluxos de navegador** passaram (10 por Chrome/Edge), em sessões isoladas na porta 5174; a alternância recupera direção e camada corretas, cancela prévia sem restaurá-la e conserva por igualdade download/IndexedDB. Mantidos testes de teclado e apresentação nas três resoluções, seleção, alças e readonly. Logs locais .tools/floor-reference-memory-browser.txt e .tools/floor-reference-memory-build.txt. Suíte integral de domínio/persistência não repetida nesta mudança de sessão; geometria e formato não foram alterados. Build: 918,68 kB (286,38 kB gzip), com avisos conhecidos de Zod e tamanho do bundle. Aplicativo 0.11.0/envelope 9/nominal-v10 e aceites globais de M4.1–M4.3/M5 preservados. Conferência manual específica do local e memória por pavimento ainda não informada; roteiro nos passos 1, 6, 7 e 10 acima.

**Limitações e pendências:** aceite global do solicitante registrado na seção 10; resultados individuais dos dez passos manuais não informados. Verificações automatizadas do Codex não substituem o aceite do solicitante nem representam auditoria completa de acessibilidade. Nenhuma validação estrutural/volumétrica ou garantia geral de tempo/memória. Estados/aceites de M4.1/M4.2 preservados. M5 está implementado e aceito pelo solicitante separadamente na §12.

## 11. Apresentação, operação e verificação documental

### Interface e iconografia

**Configurações no cabeçalho:** acesso somente pelo ícone settings junto ao nome editável do projeto, em grupo compacto, sem botão na barra de desenho. Preserva estados busy/readonly, diálogo e ações de configuração; aria-label Configurações, title e dica por mouse/Tab Configurações do projeto, exibida abaixo do cabeçalho. Abrir por clique durante renomeação mantém a gravação do nome sem perder o clique. Verificação do Codex: tipos, lint e build passaram; seis execuções de configurações/iconografia aprovadas em Chrome/Edge isolados na porta 5174, incluindo abertura por teclado e durante edição do nome. Revisão visual em 1366×768, 1280×720 e 900×680, com alinhamento junto ao campo, centro SVG até 1 px, dicas legíveis e ausência de rolagem horizontal; capturas .tools/settings-header-<navegador>-<largura>.png. A conferência de conteúdo dos botões considera caixas reais de SVG/texto, sem tratar a dica que se estende abaixo como conteúdo excedente. Sem repetição da suíte de domínio, pois a mudança é de interface. Build conserva avisos conhecidos de Zod/tamanho do bundle. Aceite manual pendente: conferir o local e a dica por mouse/Tab, abrir com Enter e clicar enquanto altera o nome.

Página inicial com cartões, estado vazio, orientação de backup e layout responsivo; editor compacto centrado no canvas. Configurações com grupos Vãos/Canaletas/Graute lado a lado, explicações contextuais e ações acessíveis. A lista extensa de níveis rola localmente. Iconografia Lucide centralizada em src/ui/Icon.tsx, conforme Arquitetura §2.1.

Tipos, lint e build passaram na entrega de apresentação. Há registro de 34 verificações pertinentes em Chrome/Edge, 17 por navegador, incluindo edição, Fiada, configurações, estados e dicas. Revisão visual em 1366×768, 1280×720 e 900×680; centro SVG com tolerância de 1 px, texto sem excesso e estados/foco conferidos. Oito verificações de proteção de imports passaram; licença distribuída e inclusão somente de ícones usados conferidas. Esses resultados não representam execução integral da suíte nem auditoria completa de acessibilidade.

**Aceite específico da apresentação:** pendente do solicitante. Os aceites de M3.4/M3.5 não atribuem aprovação específica às revisões de configurações e iconografia. Roteiro: conferir início/criação, barra de ferramentas, Fiada, zoom, painéis, dicas por mouse/Tab e Configurações com Aplicar/Cancelar/Restaurar no monitor habitual.

### Operação e limites

Porta 5173 reservada ao solicitante; porta 5174 para verificações do Codex, com perfis isolados e servidor próprio do Playwright, sem reaproveitar instâncias. Os scripts e instruções estão no README e AGENTS.md. Há registro de dois casos de bloqueio/liberação entre abas na 5174, em Chrome/Edge; o runner foi interrompido sem resumo final. Esse registro não equivale a uma execução concluída da suíte. Teste manual específico da separação de portas permanece pendente.

Build com avisos não impeditivos de anotações do Zod e JavaScript acima de 500 kB; saída de referência com Lucide: aproximadamente 876 kB / 273 kB gzip. As cargas históricas anteriores a M4.1 não comprovam 100 mil peças/quatro pavimentos; a medição específica de M4.1 está na seção 10.1. Navegadores e perfis de teste são isolados dos projetos pessoais.

### Consistência documental

Documentação organizada por comportamento e marco, com IDs de requisitos, tarefas, critérios, convenções e exemplos preservados. Verificação documental: revisão cruzada de PRD/arquitetura/caderno/plano, referências locais, identificação de versões legadas e git diff --check. A consolidação não modifica código, formato, regras ou aceites e não constitui nova execução de testes do aplicativo.

## 12. M5 — Consulta e conclusão da primeira versão

**Estado:** implementado e revisado no aplicativo 0.11.0, mantendo envelope 9 e composição nominal-v10. Verificações do Codex e aceite global do solicitante consolidados na §12.6; resultados individuais dos passos manuais não informados. M4.1–M4.3 preservados, com aceites na §10. Percentual opcional de perdas incluído conforme confirmação do solicitante.

### 12.1. Alcance e contratos

RF-11 define consulta, atualidade/parcialidade e perdas; RF-12 define duplicação de projetos e preservação do arquivo. Arquitetura §23 define projeção de leitura, estado da consulta, arredondamento e cópia. CT-16/EX-86–94 contém convenções e exemplos independentes. Este plano relaciona trabalho e verificação, sem substituir esses contratos.

Entregar no aplicativo a tela Quantitativos, resumo do projeto por quatro tipos de peça, detalhamento de pavimento por fiada local e estimativa opcional de perdas sobre o total de cada tipo do projeto. Percentual é ajuste de consulta da sessão, identificado como não salvo; sem dados novos no arquivo. Entregar Duplicar na lista de projetos, com nome confirmado, novo projeto independente e preservação da origem. Manter envelope 9, nominal-v10 e atualização de cálculo da §21 da arquitetura. Não requer migração entre marcos do MVP.

“Conclusão da primeira versão” significa verificar os cenários existentes pertinentes do PRD e consolidar limitações reais; não autoriza implementar o backlog, regras construtivas ausentes, exportações PDF/SVG/CSV, impressão, quantitativos de laje/concreto/graute/aço, lista de compra por peças-base, preços, autenticação, servidor, publicação ou nova versão de formato. M5 não cria limites de geração nem altera paginação. Falta de rendimento físico de corte não bloqueia a contagem geométrica, mas deve ficar explícita, conforme L4/CT-16. Não há decisão de produto indispensável em aberto para este recorte; a persistência do percentual de perdas não integra esta proposta.

### 12.2. Tarefas identificadas

- [x] **M5-T01 — Detalhamento documental:** atualizar RF-11/12, Arquitetura §23, CT-16/EX-86–94, estados e este roteiro, preservando IDs anteriores e aceites de M4. Sem implementação.
- [x] **M5-T02 — Agregação nominal:** função pura sobre peças finais atuais, quatro tipos, totais por fiada/pavimento/projeto, vazios, identidade contextual, indisponibilidade e parcialidade por diagnósticos. Cobrir EX-86–91, incluindo encontros, vãos e canaletas compartilhadas, sem modificar o motor.
- [x] **M5-T03 — Consulta e perdas:** tela HTML, resumo global/detalhamento por andar, retorno ao editor, acesso aos diagnósticos, percentual transitório e arredondamento exato. Cobrir EX-89/90/92/94; não gravar nem gerar histórico ao consultar, preservar contexto confirmado e cancelar prévias sem commit.
- [x] **M5-T04 — Duplicação de projetos:** ação na lista, formulário de nome, leitura/validação do salvo, cópia profunda independente, novo ID/metadados, persistência atômica do novo registro e atualização da lista. Cobrir EX-93, falhas, formato incompatível, origem bloqueada e resultados antigos/desatualizados; não duplicar estado de sessão nem remapear referências internas.
- [x] **M5-T05 — Integração e integridade:** conferir atualização após edição, desfazer/refazer, criar/copiar/remover/mudar cota de pavimento, salvar/reabrir/importar/download compacto, nominal-v9 e somente leitura. Preservar M4.1–M4.3, escolhas pendentes, lajes, comparação, bloqueios e recuperação de falhas. Cobrir EX-94 e regressões existentes.
- [x] **M5-T06 — Verificação no aplicativo:** executar tipos/lint/domínio/persistência/e2e/build, corrigir falhas pertinentes e conferir interface/iconografia conforme Arquitetura §2.1; usar Chrome/Edge isolados na 5174, três resoluções e cargas observadas, sem alegar garantia de desempenho.
- [x] **M5-T07 — Consolidação e entrega para teste:** atualizar alcance implementado, matriz de cobertura, resultados reais, limitações, roteiro pendente e aceite no plano. Manter o teste manual do solicitante separado da verificação do Codex; não marcar M5 aceito por estar especificado ou por testes automatizados passarem.

### 12.3. Critérios de aceite verificáveis

| ID | Resultado verificável |
|---|---|
| M5-A01 | EX-86/87 reproduzem vetores literais por fiada e totais; inteiro/meio/canaleta/meia canaleta contam uma unidade cada, sem multiplicação por paredes/origens. A soma das fiadas fecha com o andar e dos andares com o projeto para cada tipo e para total de peças. |
| M5-A02 | EX-88/91 e integração de EX-26 mostram canaleta compartilhada contada uma vez e somente as peças finais após recomposição. Sem contar células, peça anterior substituída, lajes, grautes, projeções ou peças-base supostas; consulta informa a limitação de preparação/corte. |
| M5-A03 | EX-89 distingue até quatro pavimentos por ID/nome/cota, inclusive nomes iguais e cotas negativas. Vazios têm zeros e nenhuma linha de fiada fictícia. Escolher o andar da consulta não muda o ativo do editor nem o resumo do projeto. |
| M5-A04 | Atualizado com erro mostra Parcial e os andares afetados, mantém peças independentes e oferece os diagnósticos existentes. Info isolado não marca parcial. Ausente/desatualizado/em processamento não exibe valores antigos nem zero de sucesso; falha de salvamento com cálculo atual e somente leitura conservam consulta correta — EX-90/94. |
| M5-A05 | EX-92 confere 0%, 10%, decimal com vírgula/ponto, 0,01%, zero peças e arredondamento de fronteira; geométrico, acréscimo e estimado ficam separados. Margem somente sobre o total do projeto por tipo, sem soma de arredondamentos locais. Parcial também identifica a estimativa. Inválidos/overflow não alteram geometria, não aplicam valor silencioso e não mostram estimativa antiga como válida para o campo inválido. |
| M5-A06 | Sem edição de nome a confirmar, abrir/filtrar/perdas/voltar preservam documento, geração, diagnósticos, metadados, histórico e armazenamento por igualdade; nenhuma chamada ao motor ou gravação. Entrar cancela prévia aberta/fechada de laje, vão e alternativa de encontro sem commit; retorno preserva modo, pavimento, câmera, seleção e comparação confirmados. Localizar diagnóstico usa o fluxo existente; renomeação confirma pelo fluxo normal e a consulta abre no primeiro clique — EX-94. |
| M5-A07 | Duplicar pede nome válido até 100 caracteres, sugestão com sufixo sem exceder limite e permite nomes repetidos. Cancelar/Escape não cria registro; confirmação cria exatamente um novo registro e permanece na lista, com cópia abrível pelo fluxo habitual. Sem projeto novo para duplo acionamento durante processamento. |
| M5-A08 | EX-93 preserva intenção integral/referências e pendências; só ID/nome/metadados do projeto mudam. Edição/salvamento/histórico na cópia não afetam origem, inclusive após reabrir. Origem aberta em outra aba fornece último salvo, identificado na ação; cópia tem bloqueio independente e não escreve na origem. |
| M5-A09 | Falha de leitura/validação/quota ou intenção final acima de 50 MiB após nome/metadados na duplicação não cria cartão de sucesso nem registro parcial e mantém origem por igualdade. Formato incompatível é recusado sem cópia parcial. Atual nominal-v10 íntegro é preservado; cópia desatualizada/v9 abre e recalcula pelo fluxo normal, mantendo desenho e ajustes — EX-93/94. |
| M5-A10 | Arquivo vigente continua envelope 9/nominal-v10, sem totais/filtros/percentual persistidos. Download/reabertura/importação preservam intenção e quantidades após cálculo; backup sem resultado recompõe; atualização de v9 preserva desenho. Percentual reinicia em 0% ao reabrir/trocar projeto e permanece ao apenas voltar ao mesmo editor — EX-94. |
| M5-A11 | Regressões de M4.1–M4.3 passam: isolamento/copiar/remover/cotas/fiadas, seleção e alças de parede/vão/laje, cancelamento, histórico, persistência, alturas diferentes, comparação e acesso a diagnósticos. Nenhuma consulta gera recorte de laje/parede, regra estrutural, limite de geração ou vínculo entre pavimentos. |
| M5-A12 | Tipos, lint, domínio/persistência, fluxos pertinentes em Chrome/Edge na 5174 e build executados com resultado real. Nas três resoluções da §2.1, controles/tabelas legíveis, foco/retorno/teclado operantes, sem rolagem horizontal da página; tabelas extensas rolam localmente. Nomes máximos e repetidos testados, ícones Lucide pelo componente central e licença preservada. Cobertura, cargas observadas, falhas corrigidas e pendências manuais registradas sem declarar aceite do solicitante. |

### 12.4. Estratégia de verificação do Codex

1. **Domínio e geometria:** expectativas independentes de CT-16; comparar vetores literais de EX-86/87 e canaletas compartilhadas de EX-26. Variar orientação/ordem de paredes, bases e precisão, alturas diferentes, vãos e cruz. Testar todos os estados de atualidade/parcialidade e perdas em fronteiras de arredondamento; fixtures de agregação não substituem integração com composição real. Não criar testes que apenas somem o resultado da própria função sob teste para definir o esperado.
2. **Estado e arquivo:** igualdade do documento/histórico e ausência de geração/escrita ao consultar, inclusive alterações do percentual. Independência profunda da cópia, referências/pendências, quatro andares/lajes, esquema vigente, snapshot adulterado/incompatível, nominal-v9, backup sem resultado, leitura bloqueada, falhas de quota/leitura/cálculo e atualidade em memória. Arquivos recusados mantêm o aberto e o original intactos.
3. **Navegador:** percorrer roteiro abaixo em Chrome/Edge com perfis isolados e servidor de teste na 5174. Cobrir teclado/foco/Escape, nomes de 100 caracteres e nomes iguais, estados vazios/parciais/indisponíveis, perdas inválidas, cancelamento de prévias, cópia e abertura em outra aba. Executar regressões pertinentes de pavimentos, lajes, vãos, alturas e comparação, mantendo os testes existentes. Conferir visualmente 1366×768, 1280×720 e 900×680, dicas, alinhamento e rolagem local de tabelas.
4. **Carga e conclusão:** reaproveitar cenário controlado de quatro pavimentos/110 mil peças da §10.1 para conferir contagem e consulta, registrando tempo/ambiente observado e ausência de contagem duplicada, sem meta universal ou novos tetos. Executar `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e` com seleção pertinente explicitada e `npm run build`; registrar o alcance real, sem declarar suíte completa quando filtrada. Revisar os cenários do PRD §10 e relacionar cobertura existente/nova e limitações, sem implementar o backlog ou exigir certificação estrutural. O runner inicia servidor próprio; se 5174 estiver ocupada, identificar origem sem encerrar processo desconhecido nem usar 5173.

### 12.5. Roteiro manual de referência

O solicitante inicia `./Start-Ecovit.ps1 -Task dev` e usa seu navegador habitual na 5173. O Codex usa exclusivamente a 5174. Nenhum passo abaixo foi declarado executado pelo solicitante.

| Passo | Ação no aplicativo | Resultado esperado / critério |
|---|---|---|
| 1 | Criar projeto 25×12,5×7; desligar canaletas/grautes automáticos, desenhar parede de 100 cm e altura 21 cm; abrir Quantitativos. | Três fiadas 4/5/4 peças; tipos (11 inteiros, 2 meios), total 13; retornar ao mesmo desenho — A01/A06. |
| 2 | Informar perdas 10%, depois 0%, 2,50% e um negativo/mais de duas casas; voltar e consultar novamente. | A 10%, estimado 13 inteiros + 3 meios = 16 (+3); a 0%, 13 (+0). Campo decimal aceito; inválido explica sem estimativa enganosa. Percentual válido permanece na sessão e não entra no desfazer — A05/A06. |
| 3 | Duplicar o pavimento em outra cota, inclusive negativa; criar outro vazio e um com somente laje/abertura. Usar nomes repetidos e filtrar os andares na consulta. | Projeto soma 22 inteiros + 4 meios = 26; vazios zero sem fiada. IDs/cotas distinguem nomes; filtro não muda resumo nem ativo do desenho. Sem cópia da referência visual na contagem — A03/A11. |
| 4 | Em projeto de trabalho com L/T/cruz e vãos, consultar fiadas de canaletas e faixa compartilhada entre vãos empilhados. | Tipos refletem as peças visíveis de Fiada, sem duplicação por encontro/origem. Consumo de preparação não é apresentado como inteiro extra; lajes/grautes não entram nos tipos — A01/A02. |
| 5 | Consultar projeto com diagnóstico impeditivo e componente independente, depois um com somente informações. Localizar a pendência pela consulta. | Primeiro mostra parcial e mantém as peças geradas; segundo não ganha selo de parcialidade apenas por info. Diagnóstico retorna ao pavimento/alvo correto — A04/A06. |
| 6 | Iniciar prévia de laje/abertura, fechar sem confirmar e abrir consulta; repetir com novo vão e alternativa de encontro. Voltar; conferir também modo Fiada, seleção, câmera e comparação de pavimentos. | Prévia descartada sem alteração ou histórico; contexto confirmado preservado; consulta não muda o ativo. Comparação não acrescenta peças — A06/A11. |
| 7 | Editar altura/vão, desfazer/refazer e consultar após cada cálculo; baixar/reabrir e carregar backup sem resultado ou projeto nominal-v9 suportado. | Números acompanham as peças recalculadas; durante cálculo/ausência não há número antigo. Desenho preservado, perdas reiniciam em 0% na abertura; arquivo sem dados de consulta — A04/A10/A11. |
| 8 | Na lista, Duplicar projeto com lajes, quatro andares e ajustes pendentes; cancelar uma vez e confirmar outra, editando o nome. Abrir a cópia e editar geometria/ajustes; reabrir origem. | Cancelamento não cria cartão. Cópia confirmada aparece uma vez, nome/ID próprios, mesma intenção/pendências; origem permanece intacta após edições na cópia — A07/A08. |
| 9 | Abrir origem em outra aba, salvar uma alteração e duplicar pela lista; abrir cópia e consultar. Se possível, repetir leitura do mesmo projeto bloqueado e conferir a indicação do último salvo. | Cópia usa último salvo e possui bloqueio independente; consulta em somente leitura disponível quando atual, sem gravar origem. Falhas injetadas de quota/cálculo ficam nas verificações do Codex e não exigem alterar configurações pessoais — A04/A08/A09. |
| 10 | Conferir tela/tabelas e duplicação no monitor habitual, nomes longos, teclado/Tab/Enter/Escape, dicas e rolagem. Abrir a consulta enquanto altera o nome do projeto e voltar. Informar problemas e aceite do marco. | Conteúdo e totais legíveis, consulta abre no primeiro clique durante renomeação, foco retorna ao acionador, ações identificáveis, retorno ao editor claro; registro do retorno separado das verificações do Codex — A12. |

### 12.6. Andamento, limitações e aceite

**Aceite global do solicitante:** M5 aceito por confirmação explícita nesta conversa, abrangendo a implementação e a revisão consolidadas abaixo, com seus resultados de verificação e limitações preservados. Este registro substitui as pendências globais de aprovação de M5, sem atribuir execução ou resultado individual aos passos do roteiro manual. Os aceites de M4.1–M4.3 permanecem preservados; não há autorização para ampliar o escopo ou iniciar itens do backlog.

**Verificação deste registro documental:** estados do README, PRD, arquitetura, caderno e plano alinhados; referências e `git diff --check` conferidos. Nenhuma alteração de código nem nova execução de testes do aplicativo.

**Alcance implementado e revisado — M5-T01–07:** agregação de peças finais por tipo/fiada/pavimento/projeto, consulta HTML própria com editor montado, perdas opcionais transitórias com aritmética inteira exata, estados parcial/indisponível e acesso aos diagnósticos. Duplicação na lista com nome confirmado, novo ID/metadados, cópia profunda do último registro salvo, bloqueio independente e preservação integral da origem/ajustes pendentes. Aplicativo 0.11.0, envelope 9 e nominal-v10; sem novas dependências, campos persistidos, migrações ou alteração do motor. Percentual/filtros não são salvos nem entram no histórico. M4.1–M4.3 mantêm suas implementações e aceites.

**Correções consolidadas — A06/A09/A10:** a consulta abre no primeiro clique durante renomeação, deixando o campo confirmar o nome pelo fluxo normal; foco retorna explicitamente ao acionador, aguardando a liberação dos controles se a consulta for fechada durante processamento. Antes de gravar uma duplicação, validar também o documento final com nome/metadados novos: uma origem válida próxima de 50 MiB não pode produzir cópia acima do limite de intenção transportável. O candidato inválido é recusado antes de reservar/gravar, mantendo a origem intacta; o snapshot íntegro conferido na leitura não é recomposto nessa segunda validação. As duas falhas foram reproduzidas antes das correções e ganharam regressões. Não foram encontradas novas falhas reproduzíveis na agregação ou no arredondamento das perdas. Permanecem os ajustes de teclado, contorno/prévia e diálogo compacto da implementação, com contexto/câmera preservados.

**Verificação do Codex — revisão:** tipos, lint e build passaram. Suíte completa de domínio/persistência: **293 testes em 19 arquivos**, em uma execução `vitest run --maxWorkers=1`, incluindo integridade/transporte, backup de 440 mil peças e intenção válida a um byte do limite de 50 MiB com renomeação da cópia recusada. Navegador: **78 regressões de M4.1–M4.3 aprovadas** em quatro arquivos de pavimentos, lajes, comparação e alturas; **14 fluxos pertinentes de M5 aprovados** na revalidação final, sete por Chrome/Edge. São 92 casos distintos validados entre a rodada integrada e a revalidação de M5, com servidor próprio na porta 5174 e sessões isoladas. Não é declaração de execução da suíte integral de navegador: cargas e backup grande do navegador foram excluídos desta revisão por não haver mudança de geometria, paginação ou transporte; domínio/persistência integral inclui o backup grande. Logs locais `.tools/m5-review-unit.txt`, `.tools/m5-review-browser.txt`, `.tools/m5-review-recheck.txt` e `.tools/m5-review-build-final.txt`. Falhas pertinentes corrigidas e revalidadas; teste manual do solicitante separado.

**Cobertura de aceite:**

| Critérios | Evidência |
|---|---|
| A01–03 | [Contagens de domínio](../tests/quantities.test.ts): EX-86/87 com valores literais, bases 25/30/personalizada, altura 6 cm e módulo 12,51 cm, giro/translação, quatro pavimentos/vazios, EX-88/91 de peças finais e integração real com canaleta compartilhada de EX-26. |
| A04–06/A10 | Mesmos testes e [fluxos de M5](../tests/e2e/quantities.spec.ts): parcial real com componente independente, info sem selo parcial, indisponibilidade, readonly, perdas exatas/entrada inválida/overflow, arredondamento independente dos quatro tipos e filtros/contexto. Revisão cobre abrir durante renomeação, foco de retorno normal/após busy e falha real de `IDBObjectStore.put`: consulta e download usam o resultado atual em memória, registro salvo fica idêntico e consultar/perdas não alteram documento/histórico. |
| A07–09 | [Cópia e armazenamento](../tests/project-copy.test.ts): intenção/referências/pendências, edição da geometria da cópia salva/reaberta com origem intacta, rascunho sem resultado e nominal-v9, falhas de quota/leitura/nome/formato e candidato final acima de 50 MiB recusado sem registro adicional. Navegador cobre cancelamento/Escape, nome, gravação, origem aberta em outra aba, edição independente e consulta readonly. |
| A11 | Regressões de M4.1–M4.3 na rodada integrada: seleção/prioridade/alças/arraste e lista unificada, cópia/remoção/cotas/histórico, vazios, comparação/projeção/câmera, alturas distintas, nominal-v9, importação e bloqueios entre abas. Suíte completa de domínio/persistência aprovada. |
| A12 | Tipos/lint/build e fluxos nas três resoluções; nomes máximos, Tab/Enter/Escape, foco, tabelas e ausência de rolagem horizontal. Sem novo layout ou ícone nesta revisão; o catálogo Lucide central e a licença distribuída permanecem preservados. |

**Carga e apresentação:** evidência da implementação preservada: quatro pavimentos, 400 paredes, 50 fiadas por andar e 110 mil peças, com canaletas/grautes automáticos desligados. Consulta (clique até resumo visível) em 131 ms no Chrome e 162 ms no Edge; abertura/importação/cálculo/salvamento do cenário de M4.1 em 4.954/4.856 ms. Essas cargas não foram repetidas nesta revisão e não representam garantia geral de desempenho. Capturas de referência/fluxos de consulta e cópia em `.tools/m5-<navegador>-<largura>.png` e `.tools/m5-copy-<navegador>-<largura>.png`, nos tamanhos 1366×768, 1280×720 e 900×680. Build da revisão: 918,40 kB de JavaScript (286,24 kB gzip), com avisos conhecidos não impeditivos de anotações do Zod e bundle acima de 500 kB. Referências locais, IDs e `git diff --check` conferidos.

**Limitações e teste manual:** consulta geométrica sem rastreio de fabricação; percentual de perdas não persistido, sem estimativa de graute/concreto/aço ou lajes, sem comprovação estrutural, auditoria completa de acessibilidade ou garantia geral de tempo/memória. Roteiro manual da §12.5 mantido como referência; resultados individuais dos passos não informados pelo solicitante. Aceite global de M5 registrado nesta seção. Nenhum item do backlog ou funcionalidade além deste recorte foi iniciado.

### 12.7. Exclusão de projetos — RF-12

**Alcance implementado:** Duplicar/Excluir como ícones internos à direita dos cartões na lista, inclusive para projetos incompatíveis; confirmação identifica o projeto e oferece cancelar, baixar backup `.ecovit` do último salvo e excluir sem backup. O download mantém o diálogo aberto e orienta conferir o arquivo antes da exclusão explícita. Cancelar/Escape preservam o registro e devolvem foco ao acionador; exclusão concluída fecha a confirmação e aplica fade out de 280 ms ao cartão inerte com redução sincronizada da altura e do espaçamento, fazendo os cartões seguintes subirem suavemente antes de atualizar lista/contador, respeitando movimento reduzido (1 ms); não altera outros projetos ou arquivos baixados. Bloqueio de edição em outra aba impede excluir; erros de download/armazenamento preservam o cartão e permitem nova tentativa. Contratos no PRD RF-12 e Arquitetura §23.4; sem mudança de schema ou motor.

**Verificação do Codex:** tipos, lint e build aprovados; build com avisos conhecidos de anotações do Zod e bundle acima de 500 kB. Oito testes de persistência aprovados nos arquivos `project-delete.test.ts` e `project-copy.test.ts`, incluindo remoção seletiva, registro incompatível, bloqueio, falha de escrita e nova tentativa. Oito fluxos de exclusão aprovados (quatro em cada Chrome/Edge), com servidor próprio na 5174 e sessões isoladas: cancelamento/foco, backup validado e reaberto após excluir/recarregar, backup legado sem conversão, exclusão sem backup, bloqueio real entre abas e falhas de download/exclusão. Quatorze regressões de quantitativos/duplicação aprovadas em Chrome/Edge. Apresentação e alinhamento de SVG/texto verificados em 1366×768, 1280×720 e 900×680, sem sobreposição/rolagem horizontal; capturas locais `.tools/delete-home-<navegador>-<largura>.png` e `.tools/delete-dialog-<navegador>-<largura>.png`. O fade out foi revalidado com tipos/lint/build e os oito fluxos existentes de exclusão em Chrome/Edge; revisão de código conferiu saída após sucesso. Verificação interativa adicional em contexto isolado confirmou posições intermediárias do cartão seguinte durante a perda de opacidade, ocupação final do espaço e remoção com movimento reduzido; tipos/lint/build e os oito fluxos de exclusão foram revalidados para a saída com redução de altura/espaçamento. O teste de falhas aguarda explicitamente a liberação do Web Lock após fechar a aba concorrente. Não foi executada a suíte integral do aplicativo neste recorte.

**Limitações e teste manual do solicitante:** navegador informa solicitação de download, sem comprovar que o usuário salvou o arquivo; confirmação permanece aberta para essa conferência. Exclusão local definitiva, sem lixeira/desfazer; arquivo incompatível baixado continua incompatível com a versão vigente. Aceite desta alteração pendente: conferir os ícones Duplicar/Excluir dentro do cartão, cancelar, baixar/conferir o backup, confirmar exclusão, conferir o fade out do cartão e a subida suave dos itens seguintes e carregar o arquivo compatível para recuperar o projeto. Nenhum desses passos foi declarado executado pelo solicitante.

### 12.8. Explicação no cartão incompatível — RF-12

**Alcance implementado:** indicação de incompatibilidade permanente, sem seta de abertura nos cartões da lista. Clique ou Enter revela no próprio cartão o motivo e a orientação de criar novo projeto, sem tentar abrir o documento nem emitir aviso global. Estado de expansão só da sessão, com anúncio acessível; rolagem ajustada ao mínimo necessário para mostrar a explicação no fim da lista. Abertura normal de projetos compatíveis, duplicação e exclusão mantêm seus contratos. PRD RF-12 e Arquitetura §23.5 descrevem o comportamento.

**Verificação do Codex:** tipos, lint e build aprovados, com os avisos conhecidos de anotações do Zod e bundle acima de 500 kB. Verificação interativa em Chrome/Edge com 12 projetos e o incompatível por último, nas resoluções 1366×768, 1280×720 e 900×680: explicação visível por clique e Enter, ausência de aviso global/abertura do editor, seta ausente nos cartões conforme apresentação compacta da §12.9, exclusão habilitada e ausência de rolagem horizontal. Capturas locais `.tools/incompatible-<navegador>-<largura>.png`. Oito regressões de exclusão/backup/bloqueio/falhas aprovadas, quatro por Chrome/Edge, com servidor próprio na porta 5174 e sessões isoladas; `git diff --check` aprovado. Sem alteração de motor ou persistência; suíte integral de domínio não reexecutada neste recorte.

**Limitações e teste manual do solicitante:** explicação apenas para registros identificados como formato incompatível na lista; outros erros de leitura seguem a mensagem existente. Sem conversão de arquivos. Aceite pendente: no fim de uma lista longa, clicar no projeto incompatível e conferir texto local visível, ausência da seta e disponibilidade de Excluir; comparar com a abertura de um projeto compatível. Nenhum desses passos foi declarado executado pelo solicitante.
### 12.9. Lista compacta e ações internas — RF-12

**Alcance implementado:** cartões comuns com 80 px de altura e 8 px de intervalo; nome em uma linha com reticências/title completo, paredes/data na segunda e mensagem de incompatibilidade com expansão natural. Ícone de projeto preservado em bloco de 48 px e pictograma de 24 px; bloco Novo projeto preservado. Sem setas de abertura na lista. Duplicar/Excluir em ícones internos à direita, lado a lado, com espaço reservado, nomes acessíveis e dicas. Ações visíveis por hover/foco dentro do cartão; em dispositivos sem hover, sempre visíveis. Botões irmãos independentes, preservando abertura/explicação, duplicação, confirmação de exclusão/backup, retorno de foco e saída animada. Contratos no PRD RF-12 e Arquitetura §23.6.

**Verificação do Codex:** tipos, lint e build aprovados, com avisos conhecidos de anotações do Zod e bundle acima de 500 kB. Oito fluxos de exclusão e quatorze regressões de duplicação/quantitativos aprovados em Chrome/Edge (22 casos distintos); teste de apresentação atualizado para ações horizontais internas, altura de 80 px, revelação por hover, sequência de Tab, foco e geometria central dos ícones. Servidor próprio na 5174 e sessões isoladas. Conferência interativa adicional em ambos os navegadores, em 1366×768, 1280×720 e 900×680, com oito projetos, nome longo e incompatível: tamanho do ícone mantido, ausência de deslocamento ao revelar ações, dicas legíveis, mensagem local visível e ausência de rolagem horizontal; emulação sem hover confirma ações sempre visíveis. Capturas `.tools/compact-<navegador>-<largura>.png` e `.tools/compact-tooltip-<navegador>-<largura>.png`. Sem alteração de motor, dados ou nova dependência; suíte integral de domínio não reexecutada neste recorte.

**Limitações e teste manual do solicitante:** nomes longos abreviados visualmente, disponíveis completos no título/nome acessível; cartões com informação incompatível/explicação podem crescer. Emulação de toque não representa teste em dispositivo físico. Aceite pendente: conferir densidade da lista, ações no hover/foco, dicas e cliques independentes de abrir/duplicar/excluir, preservação do bloco Novo projeto e do ícone original. Nenhum desses passos foi declarado executado pelo solicitante.
### 12.10. Navegação e ações de arquivo no cabeçalho — RF-11/12

**Alcance implementado:** Projetos após o logotipo, antes do nome/configurações, com seta à esquerda (back→ArrowLeft), texto visível, mesma aparência de Quantitativos e dica de retorno à lista. Quantitativos preservado. Carregar arquivo/Baixar projeto somente com ícones à direita, sem borda/fundo em repouso, com área de 32 px, realce por hover, foco por teclado e nomes acessíveis; dicas abaixo e alinhadas à direita identificam os arquivos `.ecovit`. Cabeçalho inicial preservado. Handlers e bloqueios existentes mantidos, inclusive confirmação ao voltar à lista com falha no salvamento. Regras no PRD §Organização dos controles e Arquitetura §2.1.

**Verificação do Codex:** tipos, lint, build e `git diff --check` aprovados; build com avisos conhecidos de anotações do Zod e bundle acima de 500 kB. Vinte regressões aprovadas em Chrome/Edge nos arquivos settings.spec.ts e quantities.spec.ts, excluindo cargas: navegação/configurações, ícones/estados/foco, quantitativos e duplicação/transporte, incluindo download após falha de gravação. Verificação interativa adicional em ambos os navegadores com sessões isoladas na porta 5174: ordem dos controles, ausência de sobreposição/rolagem horizontal e centralização dos ícones em 1366×768, 1280×720 e 900×680; dicas por Tab, download de `.ecovit` íntegro, upload pelo ícone e confirmação de saída com erro tanto cancelada quanto aceita. A aparência padrão de Projetos, igual à de Quantitativos inclusive na tipografia em larguras menores, foi revalidada com tipos/lint/build e seis regressões de cabeçalho/ícones/foco em settings.spec.ts (Chrome/Edge), com capturas nas três resoluções `.tools/settings-header-<navegador>-<largura>.png`. O uso do estilo compartilhado elimina preenchimento, borda reforçada e sombra específicos; posição, texto, seta e handlers preservados. Capturas `.tools/header-navigation-<navegador>-<largura>.png`. Sem nova dependência ou mudança de contrato/motor; suíte integral de domínio não reexecutada neste recorte.

**Limitações e teste manual do solicitante:** nomes acessíveis preservam Carregar arquivo/Baixar projeto e as dicas identificam o formato, mas essas duas ações não têm texto visível em repouso. Aceite pendente: conferir destaque e posição de Projetos, dicas e foco dos dois ícones, carregar/baixar arquivo e voltar à lista, verificando que Quantitativos permanece como antes. Nenhum desses passos foi declarado executado pelo solicitante.

## 13. M6 — Preferências do Ecovit

**Estado:** implementado e aceito pelo solicitante. Origem: BL-07 e reorganização do status/ajuda aprovada pelo solicitante; requisitos: PRD RF-09/10/14 e §8; contratos técnicos: Arquitetura §24. Marco próprio por acrescentar preferências e ajustes de apresentação do aplicativo, separado das entregas concluídas de M5. Aprovação das definições não constitui aceite funcional.

### 13.1. Alcance definido

Nova área “Preferências do Ecovit”, com acesso por ícone ao lado de Configurações do projeto no cabeçalho. Visibilidade independente dos rótulos de portas, janelas, vãos e paredes; Paredes controla A/B e novo rótulo permanente de comprimento/altura em Planta. O comportamento do produto pertence ao RF-14; regras de implementação e iconografia permanecem na arquitetura. Nenhum outro item do backlog integra M6, inclusive o elemento Medida do BL-03.

Inclui também concentrar o status no canto inferior esquerdo do canvas, removendo as apresentações junto de Planta/Fiada e no rodapé; substituir a mensagem de sucesso por “Composição nominal atualizada”. Transferir instruções gerais de seleção/movimento/redimensionamento/navegação para “Como usar o editor”, mantendo orientações operacionais temporárias, avisos e acesso a Recalcular/diagnósticos. Comportamento no PRD §8 e implementação na Arquitetura §24.1; não se trata de nova opção das preferências.

### 13.2. Definições fechadas

Definições de produto consolidadas no RF-14: quatro controles por tipo, inicialmente visíveis; rótulo inteiro para aberturas; A/B e comprimento/altura para paredes; aplicação imediata e Fechar; persistência no navegador para todos os projetos; falha de gravação mantém escolha na sessão com aviso. Seleção não reexibe texto oculto, propriedades e informações temporárias continuam disponíveis. Preferência comum aos modos onde os textos aparecem, com o novo rótulo de parede somente em Planta, sem novos textos na referência de pavimento. Sem pendências de definição de produto para este recorte.

Detalhes do rótulo de parede (medida externa A/B, altura própria, formato, orientação e atualização) no RF-14; armazenamento, separação do documento e ícones na Arquitetura §24.

### 13.3. Tarefas

- [x] M6-T01: fechar as definições e consolidar RF-14, Arquitetura §24 e critérios deste marco.
- [x] M6-T02: implementar área, acesso, persistência e controles de visibilidade por tipo, incluindo o rótulo de comprimento/altura das paredes.
- [x] M6-T03: verificar os fluxos afetados, corrigir falhas e consolidar alcance, resultados, limitações e roteiro manual do solicitante.
- [x] M6-T04: reorganizar status e orientações do canvas e atualizar a ajuda, conforme PRD §8 e Arquitetura §24.1.

### 13.4. Critérios de aceite

Critérios da entrega; verificação do Codex e teste manual do solicitante são registrados separadamente na §13.5.

| ID | Resultado verificável |
|---|---|
| M6-A01 | Diálogo compacto “Preferências do Ecovit”, grupo “Visibilidade dos rótulos”, engrenagem ao lado do ícone de ajustes existente, nome acessível, dica, teclado e retorno de foco; renomeação em andamento preservada. |
| M6-A02 | Portas/Janelas/Vãos/Paredes têm checkboxes independentes; aberturas ocultam o rótulo inteiro, Paredes oculta A/B e comprimento/altura. Desenho, alças e demais tipos preservados; reexibir restaura os textos. |
| M6-A03 | Alterar preferências não altera geometria, composição, quantitativos, intenção salva, arquivo `.ecovit` ou histórico do projeto. |
| M6-A04 | Todos visíveis sem preferências salvas; alteração imediata, Fechar/Escape sem reversão, escolha preservada ao trocar projeto e recarregar no mesmo navegador, independente do arquivo importado. |
| M6-A05 | Cabeçalho e área legíveis nas resoluções de referência da Arquitetura §2.1, inclusive com nome longo; iconografia consistente e fluxos existentes de configurações/navegação preservados. |
| M6-A06 | Parede confirmada em Planta exibe comprimento externo A/B e altura própria em cm, com orientação/posição do RF-14; medidas corretas em paredes horizontais/verticais, sentido invertido, alturas distintas e com vãos, sem descontar aberturas. |
| M6-A07 | Rótulo da parede acompanha movimento, redimensionamento, altura, desfazer/refazer e reabertura, sem entidade ou texto duplicado no arquivo; sem linhas/alças de cota ou novos rótulos em Fiada/referências. |
| M6-A08 | Seleção não revela rótulo oculto; propriedades, medidas e informações temporárias de edição, avisos e orientações permanecem. Portas/janelas/vãos seguem preferência comum em Planta/Fiada onde já aparecem. |
| M6-A09 | Falha de gravação mantém preferência em memória com aviso acessível; leitura ausente/inválida/falha usa padrões sem impedir uso. Preferências funcionam em somente leitura sem alterar registro ou bloqueio do projeto. |
| M6-A10 | Status único no canto inferior esquerdo do canvas em Planta/Fiada, sem repetição junto aos modos ou no rodapé; prioridade Processando… → Resultado desatualizado → Atualizado · com pendências → Composição nominal atualizada, sem mostrar sucesso antigo durante processamento. |
| M6-A11 | Ajuda contém clique para selecionar, arraste do corpo/alças e navegação com botão central ou Espaço; canvas sem instrução genérica fixa, mantendo orientações temporárias de desenho/graute, prévias, avisos e somente leitura. Status e zoom permanecem visíveis e acessíveis nas resoluções de referência. |
| M6-A12 | Recalcular e diagnósticos continuam acessíveis, com bloqueios existentes; mudanças de status são anunciadas sem duplicação/foco forçado. Preferências de rótulos não ocultam status, avisos ou instruções operacionais. |

### 13.5. Andamento, verificações e limites

**Aceite global do solicitante:** M6 testado e aprovado por confirmação explícita nesta conversa, abrangendo preferências, rótulos de paredes e reorganização do status/ajuda do canvas. O aceite encerra a pendência funcional global do marco, preservando verificações do Codex e limitações abaixo, sem atribuir resultados individuais aos passos do roteiro manual. Não autoriza iniciar outros itens do backlog.

**Verificação deste registro documental:** estados do README, backlog, PRD, arquitetura e plano alinhados; referências e `git diff --check` conferidos. Sem alteração de código ou nova execução de testes do aplicativo.

**Alcance implementado — M6-T01/02/04:** preferências em diálogo nativo compacto, quatro controles imediatos e persistência local independente por navegador, padrões visíveis, validação de leitura e recuperação de falha de gravação com manutenção em memória e aviso. Engrenagem junto aos ajustes existentes, abertura durante renomeação e retorno de foco, inclusive somente leitura. Paredes exibem comprimento externo/altura própria em Planta, com texto de tamanho visual constante, orientação horizontal/vertical e separação entre rótulos; mesmo controle oculta A/B preservando alças. Aberturas mantêm desenho/alças ao ocultar seus rótulos. Status único na parte inferior do canvas com prioridade de processamento, resultado desatualizado, pendências e sucesso; Recalcular preservado, anúncios acessíveis e ajuda geral transferida para a lateral. Sem dependências novas, mudança de motor, modelo, envelope 9 ou convenção nominal-v10; preferências ausentes do documento/histórico e do arquivo.

**Verificação do Codex:** tipos (`tsc --noEmit`), lint (`eslint .`) e build (`vite build`, após tipos) aprovados. Suíte completa de domínio/persistência: **301 testes em 21 arquivos**, com `vitest run --maxWorkers=1`, incluindo preferências com armazenamento inválido/inacessível, falha de gravação e nova tentativa. Navegador: **48 casos distintos aprovados em Chrome/Edge**, 24 por navegador, nos arquivos preferences.spec.ts, settings.spec.ts, editor.spec.ts, fiada.spec.ts e openings.spec.ts, excluindo os cenários de carga. O fluxo de estados/readonly/falha de preferência foi revalidado nos dois navegadores com acionamento real de Recalcular no novo local. Servidor próprio na porta 5174, sessões isoladas; nenhuma utilização da porta 5173 pelo Codex. Logs: `.tools/m6-unit.txt`, `.tools/m6-browser-final.txt`, `.tools/m6-recovery.txt` e `.tools/m6-build.txt`. Não é declaração de execução da suíte integral de navegador ou repetição das cargas anteriores.

**Cobertura — M6-A01–12:** fluxos novos verificam quatro tipos independentemente, textos efetivamente desenhados no canvas, medidas literais de paredes horizontal/vertical invertida com alturas distintas e vãos, A/B, atualização de comprimento/altura/movimento por operação confirmada, desfazer/refazer, reabertura, seleção/propriedades, Planta/Fiada, aplicação imediata, persistência e igualdade do documento/histórico antes/depois das preferências. Estados ocupado/desatualizado/pendente/atual e readonly são injetados para conferir a interface; o recálculo final usa o fluxo real. Regressões cobrem gestos, cancelamentos, bloqueio real entre abas, arquivos, download após falha, aberturas, configurações e navegação. Atributos de anúncio acessível conferidos por código; sem auditoria com leitor de tela.

**Apresentação:** capturas automatizadas de canvas e diálogo em 1366×768, 1280×720 e 900×680 nos dois navegadores; verificações de foco, centro do SVG (tolerância de 1 px), ordem dos controles e ausência de rolagem horizontal. Revisão visual das capturas por amostra em Chrome/Edge confirma separação dos rótulos, acesso às preferências e faixa inferior sem conflito com zoom. Referências locais `.tools/m6-canvas-<navegador>-<largura>.png` e `.tools/m6-preferences-<navegador>-<largura>.png`. Build: JavaScript 926,14 kB (288,84 kB gzip), com os avisos conhecidos não impeditivos de anotações do Zod e bundle acima de 500 kB. Referências documentais e `git diff --check` conferidos. Aceite global do solicitante registrado nesta seção; roteiro de referência na §13.6.

**Limitações:** preferências locais ao navegador, sem sincronização de contas/dispositivos ou atualização em tempo real entre abas; sem novos tipos de rótulo além dos especificados, cotas vinculadas ou garantia de evitar toda sobreposição em desenhos densos. Limpar dados do navegador pode apagar as preferências; o arquivo do projeto não as transporta. Sem auditoria completa de acessibilidade ou nova garantia geral de desempenho.

### 13.6. Roteiro manual do solicitante

**Estado: aceite global recebido.** O solicitante informou que testou o M6 e aprovou a entrega. Resultados individuais dos passos não foram informados; o roteiro abaixo permanece como referência, sem atribuir execução ou resultado específico a cada passo. No servidor habitual da porta 5173:

1. Abrir um projeto e acessar a engrenagem ao lado das configurações, inclusive durante renomeação. Conferir título, quatro opções, teclado, Fechar/Escape e retorno de foco.
2. Alternar Portas/Janelas/Vãos/Paredes separadamente; conferir desaparecimento apenas dos textos correspondentes, A/B ocultos com Paredes e alças ainda disponíveis. Confirmar que selecionar não revela o rótulo oculto e as propriedades continuam acessíveis.
3. Conferir comprimento/altura em paredes horizontais e verticais, com alturas diferentes e vãos. Mover, redimensionar, alterar altura, desfazer/refazer; conferir atualização do rótulo e medidas temporárias de edição.
4. Trocar projeto e recarregar; conferir persistência das escolhas. Alternar Planta/Fiada e conferir ausência de novos rótulos de parede em Fiada ou na referência de outro pavimento.
5. Conferir status somente no canto inferior esquerdo, sem duplicações no rodapé ou junto aos modos; durante edição observar Processando… e a conclusão. Conferir instruções gerais em Como usar o editor e orientações temporárias ao desenhar ou usar Graute.
6. Conferir legibilidade do cabeçalho, diálogo e faixa inferior no monitor habitual; informar problemas e aceite funcional do M6. Falhas artificiais e estados injetados ficam nas verificações do Codex, sem exigir alterações nas configurações pessoais.

## 14. M7 — Medidas independentes

**Estado: implementado e aceito pelo solicitante, incluindo a criação por dois cliques.** Origem: BL-03. Requisito: PRD RF-15, com integração aos fluxos RF-02/08/09/11/12/14; contratos: Arquitetura §25. Os aceites anteriores, inclusive M6, permanecem preservados.

### 14.1. Alcance e definições fechadas

Elemento Medida independente por pavimento, com segmento livre entre dois pontos e rótulo de distância em cm. Criação por dois cliques (início e fim), atração inicial/final aos alvos geométricos do ativo, prioridade de extremidades/vértices sobre linhas, indicação visual e suspensão temporária com Alt. Sem vínculo permanente: alterações dos elementos usados como referência não alteram medidas confirmadas.

Edição em Planta por seleção, movimento do corpo e alças das pontas; histórico, exclusão, salvamento, arquivo e cópias integrados. Texto centralizado legível, com até duas casas decimais e tamanho visual constante; opção Medidas em Preferências do Ecovit oculta somente o rótulo. Composição e quantitativos não consideram medidas, e editar apenas esses elementos não recalcula o motor. Comportamento pertence ao RF-15, dados/precisão/atração/persistência à Arquitetura §25; os critérios abaixo verificam esses contratos sem substituí-los.

Não há pendência de definição de produto neste recorte. M7 usa aplicativo 0.12.0, envelope 10 com leitura de 9 e atração visual de 9 px, conforme Arquitetura §25. Fora do marco: edição numérica de comprimento/ângulo, medidas encadeadas, linhas auxiliares de cota, rótulo personalizado/reposicionável, vínculos automáticos, medidas em 3D/Fiada/referências e outros itens do backlog.

### 14.2. Tarefas

- [x] M7-T01: consolidar escopo aprovado, RF-15, Arquitetura §25 e critérios deste marco.
- [x] M7-T02: definir a evolução do contrato/versão de arquivo conforme a política vigente, acrescentar dados e validação das medidas e integrar histórico, pavimentos e cópias.
- [x] M7-T03: implementar ferramenta, geometria livre, atração inicial/final, Alt, seleção, alças, movimento e cancelamentos no próprio editor.
- [x] M7-T04: integrar salvamento sem recálculo construtivo, preservação de resultados, transporte íntegro, reabertura e somente leitura.
- [x] M7-T05: integrar rótulo, preferência Medidas com preservação das escolhas de M6, enquadramento, iconografia e ajuda.
- [x] M7-T06: executar verificações pertinentes, corrigir falhas e consolidar alcance, evidências, limitações e roteiro manual do solicitante antes da entrega para teste.

### 14.3. Critérios de aceite

Critérios da entrega; verificações do Codex e teste manual do solicitante são registrados separadamente na §14.4.

| ID | Resultado verificável |
|---|---|
| M7-A01 | Medida disponível em Planta com ícone/texto, estado ativo e ajuda identificáveis; criação por dois cliques em qualquer direção, inclusive diagonal e fora da malha, com prévia da distância e pontas confirmadas conforme indicadas. Soltar o primeiro clique mantém apenas a prévia, sem salvar/histórico; segundo ponto coincidente permite tentar novamente. |
| M7-A02 | Início e fim atraídos aos alvos elegíveis do pavimento ativo, priorizando extremidades/vértices e depois o ponto próximo da linha; indicação visual, tolerância constante em pixels e escolha estável em empates. |
| M7-A03 | Alt suspende atração na criação/ajuste das pontas; posicionamento livre fora da tolerância. Rótulos, ícones, malha, própria medida e referência de outro pavimento não viram alvos. |
| M7-A04 | Selecionar distingue medidas e elementos sobrepostos; arraste do corpo conserva vetor/comprimento e arraste de alça mantém a outra ponta fixa, com atração. Pontas coincidentes não geram medida inválida; na criação, conservam o início para nova tentativa. Escape e perda de foco cancelam; clique fora na criação ou soltura fora na edição não deixam elemento inválido ou gesto preso. |
| M7-A05 | Distância euclidiana correta em horizontal/vertical/diagonal, sentido invertido e coordenadas negativas; exemplo de diferenças de 300 cm e 400 cm exibe 500 cm. Arredondamento apenas na exibição em cm com até duas casas, sem alterar pontos. |
| M7-A06 | Linha e texto centralizado acompanham câmera, zoom e edição com leitura sem inversão e tamanho visual constante; não há linhas auxiliares, campo de texto personalizado ou alça para reposicionar o rótulo. |
| M7-A07 | Medidas em Preferências inicia visível e aplica imediatamente, oculta só o rótulo e preserva linha/alças/edição. Seleção não revela texto oculto; prévia/orientação necessária continua disponível. Carregar preferências anteriores conserva as quatro escolhas de M6. |
| M7-A08 | Mover/redimensionar/unir/excluir parede, vão, laje ou outra referência não altera medidas confirmadas nem cria diagnóstico de vínculo. Encaixe de criação não persiste referência ao alvo. |
| M7-A09 | Criar/editar/excluir corresponde a operação de histórico e salvamento; desfazer/refazer restaura IDs e pontos. Alterar apenas medidas não chama motor nem altera resultado/diagnósticos/quantitativos ou geometria construtiva. |
| M7-A10 | Salvamento local, reabertura, download/importação e duplicação de projeto preservam medidas; edição da cópia não altera origem. Arquivos inválidos, coordenadas/precisão/referências inválidas e versões incompatíveis são recusados sem substituir trabalho aberto, segundo o contrato definido na implementação. |
| M7-A11 | Medidas pertencem ao pavimento ativo; duplicar pavimento copia XY com IDs próprios, remover exclui suas medidas e histórico restaura. Fiada e referência de outro pavimento não as desenham; enquadrar inclui extremos, mesmo quando só houver medidas. |
| M7-A12 | Somente leitura impede edição de medidas e preserva consulta/navegação; bloqueios entre abas, falhas de salvamento e recuperação por download permanecem íntegros. |
| M7-A13 | Regressões de M1–M6 pertinentes preservadas: desenho modular construtivo, prioridades/alças, navegação, cancelamentos, arquivos, pavimentos, preferências e status único do canvas; iconografia e apresentação conforme Arquitetura §2.1 nas três resoluções de referência. |

### 14.4. Andamento, verificações e limites

**Alcance implementado — M7-T01–05:** coleção independente por pavimento, criação livre/diagonal por dois cliques, sem manter o botão pressionado, prévia, atração geométrica em ambas as pontas, prioridade de vértices/extremidades e suspensão por Alt; seleção contextual e por lista, movimento do corpo, ajuste de alças, exclusão, cancelamentos e histórico. Rótulo em cm com até duas casas e tamanho visual constante, opção Medidas com preservação das preferências anteriores, geometria incluída no enquadramento apenas do ativo. Persistência, arquivo, cópias e pavimentos integrados; readonly consultável pela seleção acessível. Operações apenas em medidas salvam sem chamar motor, inclusive quando resultado já está desatualizado. Aplicativo 0.12.0, envelope 10 com leitura de 9 e coleção vazia adicionada, arquivo de origem preservado; convenção nominal-v10 inalterada. Sem biblioteca, serviço, regra construtiva ou vínculo persistido novo.

**Verificação do Codex — código e domínio:** tipos (`tsc --noEmit`), lint (`eslint .`) e build (`vite build`, após tipos) aprovados. Suíte completa de domínio/persistência: **309 testes em 22 arquivos**, em `vitest run --maxWorkers=1`, incluindo o backup de 440 mil peças, integridade/transporte e os novos casos de medidas/preferências. Log `.tools/m7-unit-release.txt`. Build: JavaScript 937,32 kB (292,39 kB gzip), com os avisos conhecidos não impeditivos de anotações do Zod e bundle acima de 500 kB; log `.tools/m7-build-final.txt`. Sem nova dependência ou mudança de algoritmo/convenção construtiva.

**Verificação do Codex — navegador/M7-A13:** **138 casos distintos aprovados em Chrome/Edge**, 69 por navegador, em dez arquivos de medidas, preferências, editor, configurações, quantitativos, paredes, pavimentos, lajes, comparação e alturas diferentes. Execução com servidor limpo próprio na porta 5174, sessões isoladas e código estável; log `.tools/m7-browser-release.txt`. Excluídos os cenários de carga/backup grande do navegador; o backup grande está coberto na suíte completa de domínio/persistência. Não é declaração de execução da suíte integral de navegador. Nenhum uso da porta 5173 pelo Codex. A seleção de casos cobre também leitura de envelope 9, atualização de resultado anterior e preservação do registro em somente leitura.

**Verificação do Codex — criação por dois cliques/M7-A01/A03/A04/A07/A13:** oito fluxos de medidas aprovados em Chrome/Edge, incluindo início fixado sem gravação, prévia sem botão pressionado, ausência de confirmação ao soltar um arraste, segundo ponto coincidente com nova tentativa, zoom entre cliques, cancelamentos e criação após reativar a ferramenta; confirmação com uma única operação de histórico. Mantidos os casos de atração/Alt, corpo/alças, rótulo oculto, transporte, pavimentos, somente leitura e três resoluções. Log `.tools/m7-clicks-browser-recheck.txt`. Outras 26 regressões de editor/parede aprovadas em Chrome/Edge no log `.tools/m7-clicks-browser.txt`; os casos de medidas desse log foram substituídos pela revalidação acima, totalizando 34 casos distintos verificados neste ajuste. Tipos, lint, build e os dez testes de domínio de medidas/preferências aprovados; logs `.tools/m7-clicks-unit.txt` e `.tools/m7-clicks-build.txt`. Build JavaScript 937,63 kB (292,52 kB gzip), com os avisos conhecidos de Zod e tamanho de bundle. Servidor próprio na porta 5174; nenhum uso da porta 5173. Ajuda, PRD, arquitetura, backlog e roteiro manual atualizados para dois cliques. O teste da criação por dois cliques e o aceite global de M7 foram confirmados pelo solicitante, conforme §14.5.

**Cobertura — M7-A01–12:** domínio verifica distância euclidiana 3–4–5, diagonal irracional e arredondamento apenas na exibição, projeção em segmentos finitos, prioridade de vértices, empate estável, tolerância em pixels/zoom, Alt, alvos de paredes/vãos/lajes/aberturas e isolamento por pavimento. Validação e transporte cobrem precisão, pontos coincidentes, referência inválida, UUID duplicado, envelope 9 normalizado sem alterar origem, cópias, remoção e merge de pavimento, medidas em enquadramento e preferências anteriores preservadas. Estado verifica ausência de chamadas ao motor ao salvar/desfazer/refazer medidas, tanto com resultado atual quanto desatualizado, falha de gravação com retenção em memória/download e bloqueio de outro pavimento/somente leitura. Os fluxos de navegador exercitam gestos reais de criação, movimento, alças, atração, Alt e cancelamento, comparação com o resultado anterior, seleção acessível, visibilidade do texto desenhado, exportação/reabertura, cópia de pavimento e bloqueio real entre abas.

**Apresentação:** capturas de Medida, propriedades/alças e preferências nos tamanhos 1366×768, 1280×720 e 900×680, em Chrome/Edge, com verificações de alinhamento do ícone, foco, controles em tela e ausência de rolagem horizontal. Revisão visual por amostra confere linha diagonal, texto legível, nova opção nas preferências, ferramentas e status/zoom sem sobreposição. Referências locais `.tools/m7-<navegador>-<largura>.png` e `.tools/m7-preferences-<navegador>-<largura>.png`. A revisão não representa auditoria com leitor de tela nem nova garantia geral de tempo/memória. Roteiro manual separado na §14.5.

**Limitações:** sem vínculos com geometria, medidas construtivas verificadas, cotas auxiliares ou visualização em Fiada/3D. A atração de 9 px é auxílio de interface, não precisão física; o rótulo arredondado não altera os pontos. Coordenadas continuam inteiras em 0,1 mm. Não há edição numérica de comprimento/ângulo, texto personalizado/reposicionável ou garantia de evitar toda sobreposição em desenhos densos. Preferência local ao navegador, sem sincronização entre contas/dispositivos. Somente envelopes 9/10 suportados; aplicativos anteriores podem recusar arquivos novos. Sem auditoria completa de acessibilidade ou nova garantia geral de desempenho.

### 14.5. Aceite do solicitante e roteiro manual de referência

**Aceite global do solicitante:** M7 aprovado por confirmação explícita nesta conversa, com teste da criação por dois cliques declarado pelo solicitante. O aceite abrange o marco implementado, incluindo esse comportamento, e encerra sua pendência global de aprovação. As verificações do Codex e as limitações permanecem registradas separadamente na §14.4. Não foram informados resultados individuais dos demais passos do roteiro; eles permanecem como referência, sem atribuição de execução. Os aceites anteriores permanecem preservados.

Roteiro de referência para o servidor habitual da porta 5173:

1. Em Planta, escolher Medida, clicar no início e soltar; mover o mouse sem botão pressionado e clicar no fim, inclusive diagonal e fora da malha. Conferir início marcado, prévia, comprimento em cm e repetição da ferramenta; soltar após arrastar não deve confirmar. Clicar no mesmo ponto mantém o início para nova tentativa. Conferir zoom entre cliques e cancelamentos por Escape, perda de foco e clique fora.
2. Aproximar início/fim de faces de parede, extremidades, aberturas e lajes; conferir alvo antes de cada clique de criação ou de soltar uma alça em edição. Usar Alt para posicionar livremente, inclusive ao ajustar uma ponta.
3. Selecionar pelo corpo e pela lista, mover e ajustar ambas as pontas; conferir que a outra ponta fica fixa no ajuste, que o corpo mantém comprimento e que seleção de sobrepostos permite distinguir elementos. Excluir, desfazer e refazer.
4. Mover ou excluir uma parede usada como referência; conferir medida imóvel. Alternar pavimentos, duplicar/remover um pavimento com medidas e desfazer; conferir independência das cópias.
5. Ocultar Medidas nas preferências e conferir linha/alças preservadas; reexibir. Enquadrar e usar zoom/navegação. Alternar Fiada ou referência de outro pavimento e conferir ausência dessas medidas.
6. Salvar, reabrir e baixar/importar arquivo; conferir pontos e comprimentos. Abrir o mesmo projeto em outra aba para consulta somente leitura e conferir edição bloqueada. Falhas artificiais e inspeção de chamadas ao motor ficam nas verificações do Codex.
7. Conferir legibilidade da ferramenta, rótulos e propriedades no monitor habitual; comunicar eventuais problemas.

## 15. M8 — Imagem de referência por pavimento

**Estado: implementado, verificado pelo Codex e aceito pelo solicitante.** Origem: BL-02. Requisito: PRD RF-16; contratos: Arquitetura §26. Os marcos anteriores, inclusive o aceite de M7 com criação por dois cliques, permanecem preservados. BL-01 não integra esta entrega.

### 15.1. Escopo aprovado

Uma imagem PNG/JPEG por pavimento como fundo em Planta do ativo, abaixo da malha e elementos. Acesso em Propriedades do pavimento, com botões/textos compactos e controles revelados conforme a operação; sem ocupar grande área do canvas nem criar barra permanente. Calibrar por dois cliques livres sobre um trecho conhecido e distância real em cm; preservar proporção, marcar pontos e mostrar prévia, sem criar uma Medida. Permitir posição livre e ângulo com prévia no modo Ajustar, além de recalibração com primeiro ponto fixo. Imagem inicialmente visível a 40% de opacidade, com controle de 0 a 100% e Mostrar imagem independente.

Concluir/Cancelar para inclusão, ajuste e substituição; cancelamento mantém a referência anterior. Fora de Ajustar, imagem não captura gestos do desenho. Salvar conteúdo e ajustes no projeto/.ecovit, integrar histórico/cópias/pavimentos, sem alterar composição nem chamar motor. Limites individuais aprovados: 10 MiB e 16 megapixels, com validação do limite total de 50 MiB do arquivo; nenhuma redução silenciosa de qualidade. O comportamento completo pertence ao RF-16, e os contratos à Arquitetura §26.

Fora do marco: múltiplas imagens no mesmo pavimento, PDF/outros formatos, imagens como objetos (BL-01), correção de perspectiva, recorte/tratamento, deformação por eixo, reconhecimento/vetorização, desenho automático, alvos de atração derivados dos pixels, exibição em Fiada ou na referência de outro pavimento. A imagem é apoio visual; calibração não comprova precisão física de uma foto/digitalização. Sem novo serviço, biblioteca ou algoritmo construtivo previsto.

### 15.2. Tarefas

- [x] **M8-T01:** consolidar escopo aprovado, RF-16, Arquitetura §26 e critérios deste marco, incluindo a exigência de interface compacta.
- [x] **M8-T02:** consolidar contrato de dados, evolução do envelope e leitura de versões anteriores conforme a política vigente; integrar validação de conteúdo/tamanho, imagem incorporada, cópias, pavimentos e arquivo.
- [x] **M8-T03:** implementar inclusão/substituição, calibração por dois cliques/distância, transformação uniforme, posição/rotação, prévia e Concluir/Cancelar no editor existente.
- [x] **M8-T04:** integrar seção compacta em Propriedades do pavimento, opacidade/visibilidade, remoção, ajuda curta e iconografia/acessibilidade conforme §2.1 da Arquitetura.
- [x] **M8-T05:** integrar salvamento/histórico sem recálculo construtivo, descarte de prévias ao mudar contexto, bloqueios de edição, falhas de gravação e recuperação por download.
- [x] **M8-T06:** executar verificações pertinentes e corrigir falhas; consolidar alcance implementado, resultados reais, limitações e roteiro manual antes de entregar para teste, mantendo aceite do solicitante separado das verificações do Codex.

### 15.3. Critérios de aceite

| ID | Resultado verificável |
|---|---|
| M8-A01 | Propriedades do pavimento oferece Adicionar imagem e permite uma única referência PNG/JPEG por pavimento; outra inclusão usa Substituir, sem acumular imagens. |
| M8-A02 | Primeiro/segundo clique marcam livremente um trecho da imagem sem arraste nem atração à geometria; distância conhecida em cm calibra proporcionalmente. Inclusão só conclui após escala válida; não cria elemento Medida. |
| M8-A03 | Distância positiva finita e pontos distintos obrigatórios; caso conhecido de calibração corresponde à distância mundial informada. Recalibrar mantém o primeiro ponto fixo, inclusive com câmera/rotação diferentes; zoom/navegação não alteram a escala real. |
| M8-A04 | Ajustar permite posição livre e ângulo com prévia, sem deformar proporção. Imagem não captura seleção/gestos construtivos fora da edição, e não modifica paredes, vãos, lajes ou medidas durante o ajuste. |
| M8-A05 | Prévia de inclusão é acessível em pavimento vazio; Concluir confirma uma operação válida, Cancelar/mudar contexto preserva estado anterior sem histórico/salvamento parcial. Substituição mantém a imagem anterior até confirmar. |
| M8-A06 | Imagem aparece abaixo da malha/elementos, acompanha a câmera, inicia visível a 40% e aceita opacidade 0–100%. Mostrar imagem preserva conteúdo e transformação; controles pertencem ao pavimento e persistem no projeto. Enquadrar inclui a imagem visível do ativo; ajustar uma imagem oculta conserva sua visibilidade ao concluir/cancelar, e confirmação sem mudanças apenas encerra. |
| M8-A07 | Apenas a imagem do pavimento ativo aparece em Planta; Fiada e referência de outro pavimento não a renderizam. Medidas/atração/desenho modular existentes continuam funcionando sem novos alvos nos pixels. |
| M8-A08 | PNG/JPEG inválido, outro formato, mais de 10 MiB, mais de 16 megapixels ou arquivo total acima de 50 MiB são recusados com causa e sem perda do projeto/imagem anterior. Limites inclusivos e expansão da codificação são considerados, sem redução silenciosa de qualidade. |
| M8-A09 | Salvar/reabrir e baixar/importar preservam imagem, escala, posição, rotação, opacidade e visibilidade, sem acesso ao arquivo original. Duplicar projeto/pavimento produz edição independente; excluir pavimento e desfazer restauram sua referência. |
| M8-A10 | Inclusão, ajuste, recalibração, substituição, remoção e mudança de visibilidade/opacidade são desfazíveis; prévias não geram operações, e gesto de opacidade gera uma única operação. Mudanças só de imagem preservam resultados/diagnósticos/quantitativos e não chamam motor, inclusive com composição já desatualizada. |
| M8-A11 | Somente leitura e processamento impedem alteração; travas entre abas, falhas de gravação e download permanecem íntegros. Erros de carregamento/decodificação não substituem imagem confirmada nem trabalho aberto. |
| M8-A12 | Controles/textos compactos, campos revelados apenas quando pertinentes, sem nova barra permanente ou grandes instruções sobre o canvas. Nomes acessíveis, dicas, teclado, foco, unidades e erros legíveis, sem reduzir área de clique exigida. Chrome/Edge em 1366×768, 1280×720 e 900×680 sem sobreposição de status/zoom nem rolagem horizontal. |

### 15.4. Andamento, verificações e limites

**Alcance implementado — M8-T01–05:** referência opcional única por pavimento em model.referenceImages; PNG/JPEG incorporado em base64, escala uniforme, posição/rotação, opacidade/visibilidade e enquadramento do ativo visível. Inclusão/substituição com dois cliques e distância real em cm, recalibração com primeiro ponto fixo, prévias transitórias e confirmação/cancelamento; ausência de captura fora de Ajustar. Interface compacta na lateral, ações secundárias em menu, campos apenas na etapa pertinente, orientações breves na faixa existente e ajuda estável. Imagem abaixo da malha/geometria, apenas em Planta do ativo. Histórico, cópias, remoção/merge de pavimento, persistência e transporte integrados; mudanças só de imagem não chamam motor nem invalidam resultados, inclusive desatualizados. Aplicativo 0.13.0/envelope 11 com leitura de 9/10 por normalização aditiva em memória e preservação da origem. Convenção nominal-v10 e regras construtivas inalteradas, sem nova dependência ou serviço.

**Verificação do Codex — domínio/persistência:** 315 testes aprovados em 23 arquivos, com um caso pesado de backup de 440 mil peças excluído desta rodada (não reexecutado); log .tools/m8-unit.txt. Os 14 casos de medidas/imagem foram revalidados após os ajustes finais de integridade PNG, transformação e contrato estrito de versão, sem somá-los novamente ao total; log .tools/m8-unit-recheck.txt. Cobertura inclui os sete novos casos de M8, inclusive quatro imagens dentro do limite individual que ultrapassam 50 MiB após base64. Tipos e lint aprovados; logs .tools/m8-types.txt e .tools/m8-lint.txt.

**Verificação do Codex — navegador/M8-A01–12:** 52 casos distintos aprovados em Chrome/Edge (26 por navegador), nos arquivos de editor, comparação de pavimentos, medidas, imagens e alturas diferentes/arquivos anteriores. As 46 regressões estão em .tools/m8-browser-final.txt; os seis fluxos de M8 foram revalidados com correção de integridade PNG e preservação da visibilidade/ajuste sem mudanças em .tools/m8-browser-recheck.txt, substituindo os resultados anteriores desses mesmos casos, sem duplicar contagem. PNG/JPEG reais, zoom na calibração, conteúdo corrompido, erro de distância, limite individual, substituição/cancelamento, opacidade/visibilidade, âncora, histórico, cópia, Fiada, arquivo e readonly exercitados. Servidor próprio na porta 5174 e sessões isoladas, sem iniciar, encerrar ou reiniciar a 5173. Não é declaração de execução de toda a suíte de navegador.

**Build e revisão:** produção aprovada, JavaScript 953,84 kB (296,88 kB gzip), com os avisos conhecidos não impeditivos de anotação do Zod e bundle acima de 500 kB; log .tools/m8-build.txt. Capturas finais revisadas por amostra: ações Mostrar/Ajustar/menu na mesma linha no painel estreito, controles de ajuste legíveis e status/zoom separados. Revisão de consistência documental e git diff --check aprovados. Nenhum resultado acima representa teste manual ou aceite funcional do solicitante.

**Cobertura e apresentação:** calibração euclidiana/âncora sob rotação, transformação inversa, limites de transformação, tipo/estrutura/dimensões de imagem, limite individual e expansão base64 no limite total, versões 9/10/11, associações por pavimento e recusa íntegra. Estado verifica histórico sem motor, resultado atual/desatualizado, falha de salvamento com retenção em memória/download e somente leitura. Navegador exercita PNG/JPEG reais, cliques e zoom, distância inválida/pontos coincidentes, posição/ângulo, recalibração/cancelamento, opacidade/visibilidade, substituição e conteúdo corrompido, arquivo, cópia de pavimento e bloqueio entre abas. Capturas normal/ajuste em Chrome/Edge nas resoluções 1366×768, 1280×720 e 900×680: .tools/m8-<navegador>-<largura>.png e .tools/m8-adjust-<navegador>-<largura>.png. Revisão visual por amostra e verificações de controles em tela/ausência de rolagem horizontal; não constitui auditoria completa com leitor de tela.

**Limitações:** PNG/JPEG, uma imagem por pavimento, até 10 MiB e 16 megapixels, com limite adicional da intenção serializada de 50 MiB; quatro imagens no limite individual podem ultrapassar o total por causa da expansão base64. Sem redução silenciosa. Decodificação e memória dependem do navegador/dispositivo, sem nova garantia geral de desempenho. Sem PDF, perspectiva, recorte/tratamento, deformação por eixo, vetorização, reconhecimento, vínculo/atração aos pixels, Fiada ou imagem do vizinho na comparação. Calibração uniforme não comprova precisão física ou corrige distorção. Aplicativos anteriores podem recusar envelope 11. Aceites anteriores permanecem preservados.

### 15.5. Aceite do solicitante e roteiro manual de referência

**Aceite global do solicitante:** M8 aprovado por confirmação explícita nesta conversa, com teste do marco declarado pelo solicitante. O aceite abrange a implementação consolidada nesta seção e encerra a pendência global de aprovação. As verificações do Codex e as limitações permanecem registradas separadamente na §15.4. Não foram informados resultados individuais dos passos do roteiro; eles permanecem como referência, sem atribuição de execução específica. Os aceites anteriores permanecem preservados.

Roteiro de referência para o servidor habitual da porta 5173:

1. Em Planta, sem elemento selecionado, abrir Adicionar imagem em Propriedades do pavimento. Escolher uma PNG/JPEG de planta conhecida; marcar dois pontos por cliques e informar a distância em cm. Conferir proporção em relação a uma parede/Medida conhecida, depois Concluir. A calibração não cria uma Medida no projeto.
2. Ajustar: arrastar a imagem, mudar ângulo e usar Definir escala novamente. Conferir prévia/âncora do primeiro ponto, Concluir/Cancelar e desfazer/refazer. Usar zoom/navegação entre cliques sem alterar a escala real.
3. Conferir opacidade inicial de 40%, variar até zero/100% e Mostrar. Desenhar/selecionar paredes e medidas sobre o fundo fora de Ajustar; a imagem não deve se mover. Conferir o espaço ocupado pela seção e o menu compacto no monitor habitual.
4. Substituir por outra imagem e cancelar, preservando a anterior; repetir e concluir. Tentar arquivo inválido/excessivo e conferir mensagem e preservação. Remover e desfazer. Trocar ferramenta, modo ou pavimento com prévia aberta e conferir descarte sem alterar a referência confirmada.
5. Alternar/duplicar pavimento e conferir referências independentes; remover o pavimento e desfazer. Em Fiada e na referência de outro pavimento, conferir ausência da imagem daquele vizinho.
6. Salvar, reabrir, baixar e importar o .ecovit; conferir imagem e ajustes mesmo sem o arquivo original no computador. Abrir outra aba em somente leitura e conferir visualização, com alterações bloqueadas. Falhas artificiais, limite total e chamadas ao motor ficam nas verificações do Codex.
7. Comunicar eventuais problemas observados no uso do M8.

## 16. Complemento de RF-14 — Visualização local por projeto

**Alcance implementado:** zoom e ponto central do desenho salvos automaticamente por ID de projeto no mesmo navegador, com restauração ao reabrir e conservação do centro/escala ao redimensionar a área de trabalho. Uma visualização compartilhada entre pavimentos e Planta/Fiada, sem restaurar modo, pavimento, seleção ou ferramenta. Gravação ao concluir deslocamento, após zoom/Enquadrar/foco/redimensionamento e proteção ao sair/ocultar a página. Preferência separada do documento, cálculo, histórico, updatedAt e transporte `.ecovit`, inclusive em somente leitura. Sem nova dependência, serviço ou versão de arquivo. Produto em RF-14; contrato na Arquitetura §9.

| ID | Critério de aceite |
|---|---|
| VL-A01 | Reabrir pela lista ou após recarregar recupera zoom e centro; outro projeto conserva sua própria visualização. |
| VL-A02 | Janela/área de trabalho de tamanho diferente mantém centro e escala; Enquadrar segue disponível e é lembrado. |
| VL-A03 | Navegação não altera documento, histórico, data de edição ou cálculo. |
| VL-A04 | Preferência ausente/inválida/inacessível usa câmera inicial; erro de escrita informa a falha sem bloquear navegação/edição. |

**Verificações do Codex — VL-A01–04:** cinco testes de preferências aprovados em dois arquivos (project-view e preferences), cobrindo isolamento por ID, leitura válida, corrupção, tipos/coordenadas/escala inválidos e indisponibilidade de leitura. Dezesseis testes de navegador aprovados em Chrome/Edge (oito por navegador), nos arquivos project-view e editor: zoom real com roda/botão, deslocamento com botão central, saída pela lista, atualização/reabertura, janela de tamanho diferente, redimensionamento aberto, independência entre projetos, Enquadrar, conteúdo inválido, falha de escrita com aviso e comparação do documento/histórico antes/depois da navegação. Regressões de desenho, edição, arquivo, falha de salvamento, bloqueio entre abas e gestos de navegação preservadas. Servidor próprio e sessões isoladas na porta 5174; 5173 não foi iniciada, encerrada ou reiniciada. A inicialização do navegador exigiu execução fora do sandbox. Tipos, lint sem avisos e compilação de produção aprovados; build conserva os avisos conhecidos de anotações do Zod e bundle acima de 500 kB. Consistência entre PRD, arquitetura e plano e git diff --check revisados. Não foi executada toda a suíte de domínio ou navegador; esses resultados não representam teste manual nem aceite do solicitante.

**Limitações:** preferência restrita ao navegador/origem e ao ID local do projeto; limpar os dados do navegador remove a preferência. Cópias/importações com novo ID começam sem visualização salva. Não sincroniza abas/dispositivos nem transporta câmera no arquivo. Com áreas de trabalho diferentes, conserva centro e zoom, não a extensão total visível. Última gravação por uma aba prevalece. Encerramento abrupto durante arraste pode recuperar somente o último gesto concluído.

**Teste manual do solicitante: pendente.** No servidor habitual da porta 5173, abrir um projeto, aproximar e deslocar para uma região reconhecível, sair pela lista e reabrir; repetir após atualizar a página e com janela de outro tamanho. Alternar dois projetos com vistas diferentes e conferir independência; usar Enquadrar e reabrir. Informar problemas observados; os testes automáticos não constituem aceite do solicitante.

## 17. Complemento de RF-12 — Feedback e fluxo único de abertura

**Alcance implementado:** abertura da lista diretamente pelo ID, com uma leitura/validação do registro sob a política existente de bloqueio. Estado de abertura ativado ao clique, cartão com nome preservado, texto “Abrindo projeto…” e indicador saving→LoaderCircle do mapa central, antes do trabalho pesado. Cursor wait em toda a página e controles, ações conflitantes desabilitadas e proteção no store contra chamadas concorrentes. Retorno ao cursor/controles normais ao concluir ou falhar; erro mantém a lista e permite nova tentativa. Sem mudança de arquivo, dependência, worker ou regras de integridade/cálculo. Produto em RF-12; contrato na Arquitetura §9 e iconografia conforme §2.1.

| ID | Critério de aceite |
|---|---|
| AB-A01 | Clique mostra “Abrindo projeto…” e cursor de espera antes da leitura/validação pesada, preservando nome e legibilidade do cartão. |
| AB-A02 | Abertura da lista carrega e valida uma única vez, sem permitir outra abertura nem ações conflitantes durante a operação. |
| AB-A03 | Sucesso abre o editor; falha preserva a lista/trabalho anterior, informa a causa e libera cursor, controles e bloqueio candidato para nova tentativa. |
| AB-A04 | Integridade, readonly, criação/importação e zoom/enquadramento preservados; indicador centralizado, texto legível e sem rolagem horizontal em Chrome/Edge nas resoluções de referência. |

**Verificações do Codex — AB-A01–04:** 43 testes aprovados em quatro arquivos (project-opening, database, floor-state e floor-reference). Cobrem ativação do estado antes da leitura, proteção contra abertura concorrente, uma carga e uma validação por abertura, falha com liberação do bloqueio candidato/preservação do trabalho e nova tentativa, além das regressões de persistência e estado de pavimentos. Vinte testes de navegador aprovados em Chrome/Edge (dez por navegador), nos arquivos project-opening, editor e project-view: feedback e CSS cursor wait observados antes da leitura, uma leitura efetiva do registro, controles bloqueados, erro/nova tentativa, restauração do cursor, editor, integridade/importação, bloqueio entre abas, navegação e vista salva. Servidor próprio na porta 5174 e sessões isoladas; execução do navegador fora do sandbox, sem iniciar/encerrar/reiniciar a 5173.

**Apresentação e revisão:** capturas em Chrome/Edge nas resoluções 1366×768, 1280×720 e 900×680 (.tools/opening-<navegador>-<largura>.png), verificações de centro do ícone (tolerância 1 px) e ausência de rolagem horizontal; revisão visual por amostra confirma nome/aviso legíveis e bloqueio visível dos controles. Reutiliza somente Icon/saving, sem imports de catálogo fora do mapa central. Tipos, lint sem avisos e build de produção aprovados; permanecem os avisos conhecidos de anotação do Zod e bundle acima de 500 kB. Revisão de consistência entre PRD/arquitetura/plano e git diff --check aprovados. Não foi executada toda a suíte de domínio/navegador nem auditoria com leitor de tela; nenhum resultado representa teste manual ou aceite do solicitante.

**Limitações:** o formato exato do cursor depende do sistema/navegador (ampulheta ou círculo). A validação e o motor permanecem síncronos; o estado é pintado antes, mas o indicador pode parar de animar durante processamento pesado. Não há percentual, cancelamento da abertura ou nova garantia de tempo; projetos grandes continuam sujeitos ao custo de conferência/decodificação/cálculo. Movimento reduzido conserva texto e indicador estático.

**Aceite da correção de abertura e reabertura: recebido.** O solicitante declarou ter testado a abertura e a reabertura dos projetos, confirmou o funcionamento correto e aprovou explicitamente a correção. Registro consolidado no [M1](marcos/M1-Planta-e-Persistencia.md#revisão-da-abertura-de-projetos-existentes--rf-12). Não foram informados resultados individuais dos demais passos do roteiro; as verificações automáticas e a revisão visual do Codex permanecem separadas do teste manual declarado.
