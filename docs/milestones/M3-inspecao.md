# M3 — Inspeção

Marco **M3 — Inspeção** do [PRD 1.1](../PRD.md), seções 8–9 e 13. Status em 07/10/2026: planejado; não há vistas de fiadas, motor ou quantitativos na aplicação M0.

## Objetivo e dependências

Entregar fiadas, elevação, contagens, perdas e exportações, demonstrando **RF08/RF09/RF13/RF15/RF16** para resultados completos e parciais. Depende das saídas validadas de [M1](M1-nucleo.md) e do documento editável de [M2](M2-editor.md).

## Entregas

- Navegação de fiadas com índices válidos, distinção de inteiros/meios e indicação de problemas.
- Elevação local comprimento × Z com vãos, peças, índices e identificação de peças compartilhadas.
- Quantidades rastreáveis por parede/projeto, contagem única e perdas por tipo.
- Relatórios com nome, data, revisão, motor, configuração, quantidades, perdas e status.
- JSON do modelo, CSV de quantitativos, SVG da vista atual e importação JSON como novo projeto.

## Critérios de aceite

- [ ] RF08/RF09/RF13/RF15/RF16 demonstrados; vistas e quantitativos representam a mesma revisão.
- [ ] Renderizar apenas fiada selecionada na planta e recortar pela viewport, conforme o PRD.
- [ ] `perda = ceil(necessario × percentual / 100)` e `comprar = necessario + perda`; percentual entre 0 e 30.
- [ ] Perdas aplicadas no total por tipo; visão por parede líquida, sem arredondamento cumulativo.
- [ ] Peças compartilhadas contadas uma vez; inteiros/meios são produtos separados e não se convertem implicitamente.
- [ ] Fixture de 3.125 mm/duas fiadas confere com 24 inteiros + 2 meios.
- [ ] Regiões excluídas identificadas e resultados marcados como `PARCIAL — não utilizar como lista final de compra`.
- [ ] Zero peças com erro não equivale a projeto vazio válido.
- [ ] CSV UTF-8 com BOM, separador `;`, proteção contra fórmulas e valores iguais aos do painel.
- [ ] SVG em mm com viewBox, escala, legenda, vista/fiada e status, sem promessa de prancha normativa.
- [ ] JSON preserva semântica/UUIDs; importação válida cria novo projeto e inválida preserva o aberto; limite de 5 MiB respeitado.
- [ ] Resultados desatualizados não são exportados; JSON do modelo permanece disponível durante o cálculo.
- [ ] Exportações incluem o aviso construtivo obrigatório do PRD, sem tokens ou preferências privadas.

## Verificação

Vitest para propriedade única, agregação, arredondamentos, importação e round-trip. Playwright compara painel/arquivos, navega vistas e verifica bloqueio de exportação desatualizada. Fixtures devem cobrir resultados completos e parciais.

## Limites e continuidade

Não gerar quantitativos de canaletas, cortes, grautes, armaduras, vergas ou contravergas. Não substituir incompatibilidades por peças fictícias. Relatórios não representam orçamento ou certificação estrutural.

A confiabilidade da gravação e recuperação dos projetos é concluída em [M4 — Persistência](M4-persistencia.md). Publicação e validação com usuários ficam em [M5 — Liberação](M5-liberacao.md).
