# M1 — Núcleo

Marco **M1 — Núcleo** do [PRD 1.1](../PRD.md), seções 5–7 e 11–13. Status em 07/10/2026: planejado; motor, Canvas e worker ainda não implementados.

## Objetivo e dependências

Entregar Canvas mínimo, geometria, worker, paginação de trechos/encontros/vãos e benchmark. Parte da base de [M0](M0-base.md); configuração externa pendente não impede trabalho independente no núcleo.

O domínio permanece TypeScript puro. Konva/react-konva e worker entram neste marco. A paginação e o suporte a encontros dependem do catálogo validado em M1, conforme o PRD e as regras do projeto; não inventar padrões executivos.

## Entregas

- Canvas mínimo para demonstrar coordenadas e saídas; ainda sem o conjunto de ferramentas de M2.
- Geometria: eixos orientados, interseções, continuidade, nulos, diagonais e sobreposição colinear.
- Perfil `orthogonal-half-bond-v1`: tijolo com comprimento = 2 × largura, altura confirmada, junta horizontal de 0 a 10 mm e vertical zero.
- Catálogo versionado de continuidade e encontros L/T/cruzamento, com duas fiadas, coordenadas, regiões compartilhadas, propriedade e contagens esperadas.
- Trechos com inteiros/meios, alternância de fases e diagnósticos de comprimento/altura não modulares.
- Regras de portas/janelas: intervalos livres, subtração, limites, reversão, sobreposição e relação com encontros.
- Peças com IDs determinísticos e proprietário único, diagnósticos e agregação básica de quantitativos.
- Worker com `{ requestId, documentRevision, engineVersion, document }`; retorno identificado, duração e descarte de respostas antigas.
- Benchmark de renderização e motor nas condições definidas no PRD.

## Critérios de aceite

- [ ] Catálogo de encontros revisado por profissional experiente antes de implementar/liberar as regras correspondentes.
- [ ] Parede de 3.125 mm, tijolo 250 × 125 × 70, juntas zero e altura 140: 24 inteiros + 2 meios nas duas fiadas.
- [ ] Comprimento 3.110 mm gera `NON_MODULAR_LENGTH`, com sugestões sem arredondamento automático.
- [ ] Altura 2.800/70 resulta em 40 fiadas; 2.805/70 mantém resto de 5 mm diagnosticado.
- [ ] Faces em 0,5 mm e interseções fracionárias são preservadas; inversão de Y ocorre apenas na renderização.
- [ ] Reversão dos eixos e mudança da ordem de entrada mantêm resultados normalizados equivalentes.
- [ ] Regiões resolvidas têm cobertura exata e nenhuma colisão de área positiva; peças compartilhadas são contadas uma vez.
- [ ] Vão remove apenas peças totalmente contidas; interseção parcial gera `OPENING_PARTIAL_PIECE` e exclui a peça inválida da contagem.
- [ ] Porta 1.000 × 2.100 e janela 1.000 × 980, peitoril 1.120 e fiada 70, cobertas por fixtures.
- [ ] Reversão preserva posição física do vão com `novoOffset = comprimento − offset − largura` e transforma sentido de abertura.
- [ ] Limites de 100 paredes, 100 aberturas, 60 fiadas por parede, 50.000 peças e extensão de 100 m por eixo respeitados.
- [ ] Encontro sem solução recebe `UNSUPPORTED_JUNCTION`; regiões excluídas e resultados parciais ficam explícitos.
- [ ] Worker descarta respostas antigas e mantém a interface interativa durante o cálculo.

## Desempenho e verificação

Vitest usa resultados esperados independentes do algoritmo e testes de invariantes. Registrar equipamento, navegador, fixture e build de produção; medir 30 execuções após aquecimento.

Metas do PRD: pan/zoom ≥ 50 FPS em 95% dos frames; snap p95 < 16 ms e feedback p95 < 50 ms quando demonstrados; motor p95 ≤ 1 s para 50 paredes/30 vãos/40 fiadas e ≤ 3 s para 50.000 peças com interface interativa. Não afirmar metas antes da medição.

## Limites e continuidade

Não modelar peças especiais, furos, armaduras, folgas implícitas, vergas ou dimensionamento estrutural. Vão representa espaço livre de alvenaria. Paginação acima de abertura não comprova dimensionamento de apoio.

As ferramentas de desenho/edição ficam em [M2 — Editor](M2-editor.md). Inspeção, apresentação de quantitativos e exportações ficam em [M3 — Inspeção](M3-inspecao.md). Decisão de renderização: [ADR-003](../adr/ADR-003-renderizacao-2d.md).
