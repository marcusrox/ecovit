# ADR-003 — Renderização 2D

Data do registro: 07/10/2026. Status: **escolha definida no PRD 1.1; implementação e validação de desempenho pendentes em M1**.

## Contexto

O editor precisa de pan, zoom, seleção, snapping, fiadas e elevações sem bloquear a interação. Até 50.000 peças podem ser derivadas, mas não precisam aparecer simultaneamente na árvore visual.

Referências: [PRD](../PRD.md), seções 4–5 e 11; [M1 — Núcleo](../milestones/M1-nucleo.md) e [M2 — Editor](../milestones/M2-editor.md).

## Decisão

- Usar Konva + react-konva para o Canvas 2D quando M1 começar.
- Manter controles, formulários e alternativas numéricas em HTML semântico com CSS Modules.
- Calcular geometria/paginação em módulos TypeScript puros, executados por Web Worker.
- Separar documento, seleção, histórico, ferramentas e viewport; usar Zustand quando esses estados forem implementados.
- Aplicar inversão de Y apenas na transformação de coordenadas para a tela.
- Renderizar a fiada selecionada na planta, recortar pela viewport e organizar redesenho por camadas.
- Recalcular o projeto inteiro após comando confirmado; durante arraste, calcular apenas prévia/snap. Otimização incremental depende do benchmark.

O worker recebe e devolve identificadores de requisição, revisão e motor. Resultados antigos são descartados; resultados em cálculo não podem aparecer como exportação atualizada.

## Alternativas e limites

Canvas nativo e SVG seriam alternativas de renderização, mas a decisão do PRD usa Konva para reduzir implementação própria de interação. SVG permanece formato de exportação. Three.js/React Three Fiber ficam para evolução posterior ao 2D, sem dependências 3D neste MVP.

A tela de M0 usa HTML/CSS e um fundo quadriculado; **não é um Canvas Konva nem prova de desempenho**. Konva/react-konva e worker ainda não estão implementados.

## Consequências

Canvas exige atenção a escala, seleção e acessibilidade. Lista de paredes/vãos com edição numérica, foco visível e botões equivalentes a atalhos continuam necessários. Acessibilidade espacial integral requer validação específica.

O modelo independente permite trocar renderizador sem reescrever as regras construtivas. A escolha de biblioteca não homologa encontros ou paginação.

## Validação e revisão

Em M1, medir build de produção em equipamento/navegador registrados, com 30 execuções após aquecimento. Demonstrar as metas de pan/zoom, snap, feedback, motor e abertura previstas no PRD.

Se o benchmark não atender às metas, registrar medições e alternativas antes de alterar a escolha. Catálogo de encontros revisado e desempenho são critérios distintos, ambos pendentes.
