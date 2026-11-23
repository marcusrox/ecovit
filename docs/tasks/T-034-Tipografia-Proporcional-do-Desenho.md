# T-034 — Padronizar fonte e zoom dos textos do desenho

**Tipo** — Implementação

**Resumo** — Textos associados ao desenho usam a mesma fonte da ferramenta Texto e acompanham proporcionalmente o zoom da planta, com tamanhos próprios por categoria e espaçamentos coerentes.

**Execução** — Verificada

**Data de execução** — 2026-11-23

**Aceite manual** — Pendente

## Alteração e limites

Criação e implementação autorizadas pelo solicitante. Substituir a regra parcial dos rótulos pela técnica da ferramenta Texto: IBM Plex Sans local, tamanho proporcional à escala real da câmera, sem mínimos/máximos em pixels e sem arredondar o zoom. Cobrir ambientes (nome/área/revisão), paredes/A/B/prévias geométricas, portas/janelas/vãos nos modos existentes, cotas, terreno/medidas temporárias e letras cardeais.

Preservar as bases por categoria em 61%: ambientes e prévia de parede 13 px; paredes, A/B, aberturas e cotas 11 px; terreno 12 px seminegrito. Letras cardeais conservam a proporção de 14% do tamanho da rosa. Os tamanhos de referência são convenções visuais, sem novo campo ou regra construtiva. Espaçamentos, entrelinhas, fundos e caixas de seleção de etiquetas acompanham a mesma proporção. Quebra de nomes de ambiente usa a fonte comum na referência de 13 px e largura de 164 px, mantendo linhas estáveis ao mudar zoom.

Preservar conteúdo, âncoras, orientação, visibilidade, gestos e critérios existentes de colisão/recusa de rótulos fora da tela. Controles, alças, sinais de operação e painéis transitórios ancorados à tela conservam tamanho e comportamento. Sem novos controles, fontes, dependências, alterações de dados, formato, motor ou cálculos. Não modificar o comportamento já aprovado dos objetos Texto.

Referências: [Editor e interação](../arquitetura/Editor-e-Interacao.md#tamanho-adaptável-das-fontes-dos-rótulos), [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md), [PRD](../Ecovit-PRD.md), [T-019](T-019-Rotulos-do-Desenho-com-Zoom-Parcial.md) e [T-033](T-033-Ferramenta-Texto.md). Preservar evidências e aceites anteriores como histórico.

## Critérios de aceite

- [x] **A01** — Todos os rótulos no escopo usam IBM Plex Sans e tamanho proporcional ao zoom real: dobrar a escala dobra o tamanho, inclusive nos extremos permitidos, respeitando as bases por categoria e aplicando a escala apenas uma vez.
- [x] **A02** — Fundos, afastamentos, entrelinhas e caixas de seleção acompanham o texto; nomes longos mantêm suas quebras durante zoom. Seleção e edição das etiquetas continuam coerentes com a área desenhada; orientações e regras de colisão são preservadas.
- [x] **A03** — Texto livre mantém sua apresentação; interface e sinais de interação continuam fixos. Mudar zoom não altera modelo, histórico, salvamento ou cálculos. Contratos vigentes refletem a nova regra, preservando registros anteriores.

## Resultado

Implementado no aplicativo, sem novos controles, dados ou dependências. O helper existente de rótulos aplica escala linear para fonte e espaçamentos; os renderizadores Canvas, Rooms, Measurements, Terrain e TerrainCompass usam IBM Plex Sans. Quebras de ambiente e caixas de seleção compartilham as métricas da fonte; letras cardeais recebem a escala uma única vez. Texto livre e controles ancorados à tela preservados. Atualizados os contratos de Editor/interação, Interface e o trecho de medidas do PRD.

Verificação proporcional ao impacto em tipografia, layout e seleção: **35 testes unitários aprovados** em quatro arquivos (0,90 s), cobrindo regra linear/extremos, pesos, bases, rosa, ambientes e medidas; typecheck e lint do recorte aprovados. Logs: `.tools/t034-unit.log`, `.tools/t034-types.log`, `.tools/t034-lint.log` e `.tools/t034-lint-final.log`.

**Quatro cenários distintos no Chrome aprovados**: rótulos em 25%, 61% e 150% (incluindo família/tamanho efetivamente desenhados de cada categoria, entrelinha, seleção, Texto livre e interface fixa) e nome longo conservando linhas, proporção, seleção e foco pelo duplo clique após ampliar o zoom. Os dois primeiros passaram na rodada inicial de 21,5 s; nessa rodada, 150% não encontrou rótulo oculto pela regra existente de borda da tela. Ampliada somente a janela desse cenário para comportar o desenho, mantendo todas as asserções e timeouts; 150% e nome longo passaram em 12,3 s. Logs preservados em `.tools/t034-e2e.log` e `.tools/t034-e2e-final.log`. Não somar repetições como cobertura adicional. Capturas 25%/150% e nome longo conferidas em `.tools/t034-fontes-25.png`, `.tools/t034-fontes-150.png` e `.tools/t034-long-name.png`. Banco e servidores isolados (5174/3002); servidor 5173 do solicitante preservado. Sem suíte ampla, matriz de navegadores ou build.

### Validação manual pendente

- [ ] Conferir tamanhos relativos e legibilidade de ambientes, paredes, aberturas, cotas e terreno nos zooms habituais.
- [ ] Conferir visualmente seleção e edição de etiquetas, incluindo nomes longos, no projeto do solicitante.

Os critérios marcados registram verificação técnica. Aceite manual permanece pendente até manifestação explícita do solicitante.
