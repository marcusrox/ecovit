# M3 — Vãos, canaletas e grautes nominais

[Índice dos marcos](../Ecovit-Plano-Implementacao.md) · [PRD](../Ecovit-PRD.md) · [Arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md)

Registro consolidado da entrega. Versões e verificações referem-se ao marco; o comportamento e os formatos vigentes são definidos nas referências por assunto. Aceite global não atribui resultado individual a roteiros manuais.

**Estado:** M3.1, M3.2 e M3.3 implementados e aceitos.

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

## M3.1 — Vãos: verificações e aceite

Tipos, lint e build passaram. Foram registrados 77 testes de domínio/persistência e 40 casos de navegador em Chrome/Edge, incluindo 14 de M3.1. Cobertura: M3-A01–06; partes de A07–10/15/16 referentes a vãos. EX-21–27/29/30 conferem paginação, intervalos, seleção de empilhados, separações, edições indiretas e transporte. Configurações não redimensionam vãos existentes. Aceite global recebido, sem resultados individuais por passo.

Fontes: [vãos](../../tests/openings.test.ts), [fluxos de vãos](../../tests/e2e/openings.spec.ts) e [configurações](../../tests/e2e/settings.spec.ts).

## M3.2 — Canaletas: verificações e aceite

Tipos, lint e build passaram. Foram registrados 99 testes de domínio/persistência e 56 casos de navegador, 28 por navegador Chrome/Edge. Cobertura: M3-A07/11/12 e partes de A08–10/15/16 referentes a canaletas. EX-26/28/31/35 conferem união de regiões/origens, fiada intermediária compartilhada, supressão de faixa e restauração explícita. Revisão visual em 1440×1000. Aceite global recebido, sem resultados individuais por passo.

Fontes: [canaletas](../../tests/channels.test.ts) e [fluxos de canaletas](../../tests/e2e/channels.spec.ts).

## M3.3 — Grautes: verificações e aceite

Tipos, lint e build passaram. Foram registrados 125 testes de domínio/persistência e 72 casos de navegador, 36 por navegador Chrome/Edge, com verificações específicas de identidade e diagnósticos. Cobertura: M3-A13/14 e partes de A07–10/15/16 referentes a grautes. EX-22/32/33/34 verificam eixos por malha, categorias independentes, exclusões sem compensação e intervalos interrompidos por vãos. Aceite global recebido; a execução assistida pelo Codex e o aceite do solicitante são evidências distintas.

Carga observada: 100 paredes, 200 eixos e 300 intervalos; 2.995 ms Chrome / 2.521 ms Edge para abertura/importação/geração/salvamento. Algumas verificações concorreram na máquina; não é tempo isolado do motor nem garantia para quatro pavimentos. Fontes: [grautes](../../tests/grout.test.ts) e [fluxos de grautes](../../tests/e2e/grout.spec.ts).
