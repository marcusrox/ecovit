# M3 — Vãos, canaletas e grautes nominais

[Índice dos marcos](../Ecovit-Plano-Implementacao.md) · [PRD](../Ecovit-PRD.md) · [Arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md)

Registro consolidado da entrega. Versões e verificações referem-se ao marco; o comportamento e os formatos vigentes são definidos nas referências por assunto. Aceite global não atribui resultado individual a roteiros manuais.

**Estado:** M3.1, M3.2 e M3.3 originais implementados e aceitos. Seleção individual em Fiada, edição de grautes em qualquer parede, continuidade visual no recálculo e restauração implementadas; aceite específico pendente do solicitante.

## Alcance e referências

PRD §14, [Motor e diagnósticos](../arquitetura/Motor-e-Diagnosticos.md#canaletas-e-grautes) e CT-07–10/EX-21–35 definem vãos, padrões, canaletas e grautes. M3.1 cobre inserção/edição de aberturas e seus padrões; M3.2 cobre níveis globais e faixas locais, supressões e restauração; M3.3 cobre categorias/distância de graute e inclusão/exclusão por eixo. Geometria nominal sem dimensionamento resistente ou verificação de passagem física.

| ID | Regra de escopo |
|---|---|
| D3-01 | Alcance nominal organizado em M3.1, M3.2 e M3.3 |
| D3-02 | Sem sobreposição de volumes; vãos laterais com alturas sobrepostas exigem um módulo horizontal; empilhados exigem uma fiada intermediária, compartilhável por canaletas |
| D3-03 | Configurações fornecem valores iniciais; padrões e efeitos em PRD §14 e M3-A16 |
| D3-04 | Dimensões físicas e dimensionamento estrutural fora do escopo |
| D3-05 | Grautes configuráveis por CT-10 e PRD §14, com categorias, distância e clique por furo |
| D3-06 | Canaletas globais e junto a todos os vãos; faixa local cobre largura do vão mais um módulo por lado; remoção por parede/fiada |

## Critérios de aceite

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
| M3-A17 | Clique normal em Fiada seleciona uma parede; célula compartilhada oferece escolha. Conjunto continua pelo painel Encontros, com primeira fiada para edição. Graute vertical permite editar furos de qualquer parede do pavimento ativo, independentemente da seleção; a parede filtra somente a consulta de ajustes e define a restauração por parede. Conserva opção de pavimento inteiro e informa eixos compartilhados. Seleção não altera documento/histórico. |
| M3-A18 | Restaurar parede/pavimento confirma alcance, contagens e compartilhados; remove inclusões/exclusões e pendentes em todas as fiadas do alcance, preservando demais ajustes/pavimentos/configurações. Cancelar/Escape não muda dados; confirmar salva/recalcula em uma operação desfazível. Categorias desligadas, ausência de ajustes, bloqueios e somente leitura têm comportamento explícito conforme RF-07. |

| M3-A19 | Alterações exclusivas de ajustes de graute conservam paredes e referência de fiada visíveis durante o recálculo, com controles de fiada presentes/bloqueados e status de processamento. O resultado completo substitui o anterior; falha identifica a referência visual como desatualizada e bloqueia edição construtiva. Resultado antigo não integra documento, arquivo, histórico ou quantitativos; retenção descartada ao mudar outros insumos construtivos, abrir projeto ou fechar. |

## M3.1 — Vãos: verificações e aceite

Tipos, lint e build passaram. Foram registrados 77 testes de domínio/persistência e 40 casos de navegador em Chrome/Edge, incluindo 14 de M3.1. Cobertura: M3-A01–06; partes de A07–10/15/16 referentes a vãos. EX-21–27/29/30 conferem paginação, intervalos, seleção de empilhados, separações, edições indiretas e transporte. Configurações não redimensionam vãos existentes. Aceite global recebido, sem resultados individuais por passo.

Fontes: [vãos](../../tests/openings.test.ts), [fluxos de vãos](../../tests/e2e/openings.spec.ts) e [configurações](../../tests/e2e/settings.spec.ts).

## M3.2 — Canaletas: verificações e aceite

Tipos, lint e build passaram. Foram registrados 99 testes de domínio/persistência e 56 casos de navegador, 28 por navegador Chrome/Edge. Cobertura: M3-A07/11/12 e partes de A08–10/15/16 referentes a canaletas. EX-26/28/31/35 conferem união de regiões/origens, fiada intermediária compartilhada, supressão de faixa e restauração explícita. Revisão visual em 1440×1000. Aceite global recebido, sem resultados individuais por passo.

Fontes: [canaletas](../../tests/channels.test.ts) e [fluxos de canaletas](../../tests/e2e/channels.spec.ts).

## M3.3 — Grautes: verificações e aceite

Tipos, lint e build passaram. Foram registrados 125 testes de domínio/persistência e 72 casos de navegador, 36 por navegador Chrome/Edge, com verificações específicas de identidade e diagnósticos. Cobertura: M3-A13/14 e partes de A07–10/15/16 referentes a grautes. EX-22/32/33/34 verificam eixos por malha, categorias independentes, exclusões sem compensação e intervalos interrompidos por vãos. Aceite global recebido; a execução assistida pelo Codex e o aceite do solicitante são evidências distintas.

Carga observada: 100 paredes, 200 eixos e 300 intervalos; 2.995 ms Chrome / 2.521 ms Edge para abertura/importação/geração/salvamento. Algumas verificações concorreram na máquina; não é tempo isolado do motor nem garantia para quatro pavimentos. Fontes: [grautes](../../tests/grout.test.ts) e [fluxos de grautes](../../tests/e2e/grout.spec.ts).

### Seleção individual e restauração — M3-A17/A18

**Alcance implementado:** seleção individual pela alvenaria real em Fiada, escolha de parede em célula compartilhada e manutenção dos conjuntos pelo painel Encontros. Graute vertical permite inclusão/remoção em qualquer parede do pavimento ativo pelo canvas e seletor acessível de furos, sem trocar a seleção. O campo Parede dos grautes define somente a consulta de ajustes e a restauração por parede, com opção para todas as paredes do ativo. Ações Restaurar nesta parede… e Restaurar no pavimento… com confirmação, contagens, aviso de eixo compartilhado e respeito às categorias atuais. Remoção de ajustes por alcance, incluindo pendentes, sem modificar os demais ajustes; recálculo pelo fluxo existente, um passo no histórico, persistência e recuperação de falha. Contratos em RF-04/07 e nas arquiteturas de Editor e Estado. Sem alteração do motor construtivo, dependências ou envelope 18.

**Verificação do Codex:** tipos, lint e build passaram; suíte integral de domínio/persistência com 402 testes em 31 arquivos, incluindo cinco casos novos de escopo, associação de furos, histórico, arquivo, somente leitura e falha de armazenamento. Os cinco foram revalidados após ajuste dos tipos dos testes, sem duplicar a cobertura. Build conserva os avisos conhecidos de anotações do Zod e tamanho do bundle.

Foram aprovados 84 casos de navegador em 5 minutos, 42 por Chrome/Edge, nos arquivos de restauração, grautes, canaletas, Fiada, cruz, comparação de pavimentos e alturas diferentes. Incluem oito execuções dos quatro fluxos novos: seleção individual/conjuntos/filtro, restauração por parede/cancelamento/Escape/compartilhados, restauração do pavimento com categorias desligadas/pendentes e consulta em somente leitura. Histórico, reabertura, preservação de outros andares e ausência de mutação na seleção conferidos. Revisão visual de seleção e diálogo em 1366×768, 1280×720 e 900×680, com foco por teclado e ausência de excesso horizontal. Sessões isoladas e servidor próprio na porta 5174; porta 5173 preservada. Logs completos em `.tools/grout-restore/`, ignorados pelo Git. Não representa execução da suíte inteira de navegador. Fontes: [domínio e estado](../../tests/grout-restore.test.ts) e [fluxos de seleção/restauração](../../tests/e2e/grout-restoration.spec.ts).

**Verificação da edição em qualquer parede — M3-A17:** tipos, lint e build aprovados, com os avisos conhecidos de anotações do Zod e tamanho do bundle. Vinte e quatro testes de domínio nos arquivos grout e grout-restore aprovados. Arquivos grout-restoration.spec.ts e grout.spec.ts executados integralmente em Chrome/Edge, com 24 cenários distintos aprovados: 22 regressões e dois do novo fluxo entre paredes. O cenário novo foi revalidado em ambos os navegadores após adequação do roteiro aos contratos existentes de seleção e exclusão persistente; repetições não somam cobertura. Verificados inclusão e remoção em duas paredes diferentes sem trocar a seleção original ou sair da ferramenta, lista acessível de furos do pavimento, preservação dos demais ajustes e desfazer/refazer. Regressões de restauração por alcance, eixos compartilhados, somente leitura, vãos, persistência e carga preservadas. Capturas de seleção nas três resoluções de referência; revisão visual por amostra em Chrome/900 confirma textos legíveis e painel sem excesso horizontal. Servidor próprio na porta 5174 e sessões isoladas; porta 5173 preservada. Logs completos em `.tools/grout-all-walls/`, ignorados pelo Git. Consistência documental e git diff --check revisados. Suítes completas históricas de domínio e navegador não reexecutadas para esta alteração localizada. Teste manual e aceite desta mudança pendentes do solicitante.

**Continuidade visual no recálculo — M3-A19:** alterações exclusivas de ajustes de graute, incluindo restauração e histórico, conservam a composição anterior em referência transitória da sessão. Fiada mantém paredes, fiada de referência e controles visíveis; processamento bloqueia edição e informa Recalculando grautes no indicador inferior do canvas. O mesmo indicador mostra Desenho anterior · resultado desatualizado após falha, com ação Recalcular; não há mensagem na barra de ferramentas. O novo resultado substitui o desenho completo. Falha conserva o desenho atenuado/identificado como desatualizado, sem promovê-lo a resultado atual. Documento, arquivo, histórico e quantitativos não recebem o resultado antigo; mudanças em outros insumos construtivos descartam a referência. Sem alteração do motor, formato 18 ou dependências. Contratos atualizados no RF-07 e nos assuntos Editor, Estado e Interface.

**Verificação do Codex — M3-A19:** tipos, lint, formatação e build aprovados; permanecem os avisos conhecidos de anotações do Zod e tamanho do bundle. Consistência documental e git diff --check revisados. Suíte completa de domínio/persistência aprovada com 404 testes em 31 arquivos. Após o ajuste final da comparação por identidade, revalidados 45 testes em grout-restore, floor-state e floor-reference, sem contar repetições como cobertura adicional. Incluem retenção durante escrita pendente, documento/arquivo sem resultado antigo, substituição ao concluir, desfazer, exceção simulada no gerador e descarte ao mudar geometria/fechar. Três arquivos de navegador executados integralmente em servidor novo: grout-restoration.spec.ts, grout.spec.ts e fiada.spec.ts, com 38 cenários distintos aprovados em 4,2 minutos, 19 por Chrome/Edge. O novo cenário pausa a escrita inicial para comparar pixels reais das paredes durante inclusão e remoção nas três resoluções, verificar controles presentes/bloqueados, ausência de edição sobreposta e resultado final correto; regressões cobrem restauração, compartilhados, histórico, readonly, reabertura, falha de armazenamento e cargas. Capturas nas resoluções 1366×768, 1280×720 e 900×680; revisão visual por amostra em Chrome/900 confirma paredes, controles e aviso legíveis. Sessões isoladas e porta 5174; porta 5173 preservada. Logs completos em `.tools/grout-stable-view/`, ignorados pelo Git. A suíte histórica completa de navegador não foi executada.

**Apresentação do status — M3-A19:** mensagem removida da barra de ferramentas e concentrada no indicador inferior de composição do canvas. Durante retenção, Recalculando grautes… substitui Processando…; falha mostra Desenho anterior · resultado desatualizado no mesmo indicador e conserva Recalcular. Tipos, lint e build aprovados, com os avisos conhecidos de Zod e bundle. Cenário de continuidade visual reexecutado integralmente em Chrome/Edge: dois cenários aprovados em 47,3 segundos, com inclusão/remoção nas três resoluções, comparação das posições da barra e do canvas antes/durante, pixels das paredes preservados, controles bloqueados e estado de falha simulado na interface com recuperação real por Recalcular. Capturas de processamento nas três resoluções e falha em 900×680; revisão visual por amostra em Chrome/900 confirma textos no canto inferior, sem ocupar a barra nem sobrepor os controles de zoom. Logs em `.tools/grout-status/`, ignorados pelo Git. Esta verificação localizada não reexecutou as suítes históricas completas de domínio/navegador; os resultados anteriores permanecem separados. Teste manual e aceite específicos pendentes do solicitante.

**Limites e aceite de M3-A19:** melhora a continuidade visual, sem reduzir ou garantir o tempo do cálculo síncrono. Sem composição anterior não há desenho para reter; a referência visual permanece somente na sessão e não é restaurada ao reabrir. Teste manual e aceite específicos pendentes do solicitante.

**Limitações e aceite:** aceites anteriores preservados. A restauração usa os padrões atuais, sem recuperação de uma distribuição automática histórica ou alteração das configurações; ajuste compartilhado é removido integralmente. Não há nova validação física, auditoria completa de acessibilidade ou garantia de desempenho. Teste manual e aceite específicos de M3-A17/A18 pendentes do solicitante.

**Roteiro manual:** selecionar paredes em Fiada e escolher uma no encontro; conferir a seleção de Conjunto pelo painel. Ativar Graute com uma parede selecionada e incluir/remover furos de outras paredes sem sair da ferramenta; conferir seleção preservada, seletor de furos de todo o pavimento e desfazer/refazer. Incluir/remover grautes, restaurar uma parede e depois o pavimento, verificando contagens, compartilhados e preservação do outro andar. Cancelar/Escape, confirmar, desfazer/refazer e reabrir. Conferir também com categorias desligadas e em somente leitura. Durante inclusão/remoção, restauração e desfazer/refazer de grautes, conferir que as paredes permanecem visíveis até a atualização, sem permitir cliques de edição durante o processamento.
