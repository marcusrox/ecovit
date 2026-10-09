# ADR-003 — Renderização 2D

Registro: 07/10/2026. Revisão editorial: 08/10/2026. Estado da decisão: **vigente, conforme o PRD 1.1**.

## Contexto

O editor precisa de pan, zoom, seleção e vistas de planta/fiadas/elevações, mantendo interação responsiva durante os cálculos. O domínio deve permanecer independente da tecnologia de desenho. Referência: [PRD](../PRD.md), seções 4–5 e 11.

## Decisão

- Usar Konva + react-konva para o Canvas 2D e HTML semântico/CSS Modules para controles e edição numérica.
- Executar geometria/paginação em TypeScript puro por Web Worker, consumindo resultados identificados pela revisão do documento.
- Separar documento e estados de interação com Zustand; transformações de tela pertencem à renderização.
- Limitar o desenho à viewport e à fiada selecionada na planta. Começar com recálculo completo após comandos confirmados; adotar processamento incremental apenas se as medições justificarem.

## Motivos

Konva reduz o trabalho próprio de desenho e interação. O worker permite executar cálculos fora da thread da interface. Renderizar somente o necessário evita manter todas as peças de todas as fiadas na árvore visual. O recálculo completo inicial simplifica consistência e manutenção.

## Alternativas

- **Canvas nativo:** oferece controle direto, com mais código próprio para interação e organização da cena.
- **SVG como renderizador principal:** é uma alternativa vetorial; o PRD escolhe Konva para o editor e mantém SVG como formato de exportação.
- **Three.js/React Three Fiber:** atende à evolução 3D, fora do escopo deste MVP.

## Consequências

Canvas exige alternativas acessíveis em controles DOM. Workers introduzem comunicação assíncrona e necessidade de descartar respostas antigas. A separação entre domínio e renderização permite revisar a biblioteca sem reescrever as regras construtivas.

A escolha de biblioteca não comprova desempenho nem homologa paginação; essas evidências pertencem aos critérios dos marcos.

## Documentos relacionados

Implementação, benchmark e aceite: [M1 — Núcleo](../milestones/M1-nucleo.md), [M2 — Editor](../milestones/M2-editor.md) e [M3 — Inspeção](../milestones/M3-inspecao.md). Fluxos e fronteiras: [arquitetura](../architecture/overview.md).
