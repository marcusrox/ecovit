# T-019 — Rótulos do desenho com zoom parcial

**Tipo** — Implementação

**Execução** — Verificada

**Data de execução** — 2026-11-13

**Aceite manual** — Confirmado pelo solicitante

## Alteração e limites

Alterar somente o tamanho das fontes dos rótulos do desenho: diminuir ao afastar e aumentar ao aproximar, parcialmente em relação ao zoom e com limites mínimo e máximo.

- Usar a regra compartilhada `fonte = limitar(fonteBase × raiz(zoom / 61), mínimo, máximo)`. Calcular o percentual pela escala real da câmera, sem arredondá-lo como no indicador de zoom.
- Etiquetas de ambientes: base de 13 px em 61%, mínimo de 10 px e máximo de 20 px. Referências aproximadas: 10 px em 25%, 13 px em 61% e 20 px em 150%.
- Demais rótulos: manter a fonte atual como base em 61%, com mínimo de 9 px e máximo de 18 px. A variação é contínua e para ao atingir os limites.
- Aplicar aos textos existentes associados ao desenho: ambientes, portas, janelas, vãos, paredes, identificadores A/B, cotas, terreno, lajes e letras cardeais, incluindo prévias associadas à geometria onde já existem. Fontes que hoje acompanham o zoom integral recebem a regra uma única vez, tomando seu tamanho em 61% como base.
- Botões, painéis, menus, status, instruções ancoradas à tela e alças mantêm tamanho fixo. Não alterar o tamanho dos símbolos geométricos.

Não incluir mudanças de caixas, quebras de linha, posicionamento, prevenção de sobreposição, seleção ou gestos, nem novos controles, preferências ou bibliotecas. A alteração é de fonte no editor existente, sem mudar dados ou cálculos do projeto.

Na implementação, atualizar somente as regras de fonte pertinentes em [Editor e interação](../arquitetura/Editor-e-Interacao.md), [Medidas e imagens](../arquitetura/Medidas-e-Imagens.md) e demais contratos que exijam tamanho constante para esses textos. Preservar os resultados anteriores da [T-018](T-018-Etiquetas-de-Area-e-Fechamento-de-Ambientes.md).

## Critérios de aceite

- [x] **A01** — As fontes variam continuamente com o zoom, respeitam os limites e apresentam os tamanhos de referência das etiquetas, sem aplicar o zoom duas vezes.
- [x] **A02** — A regra alcança os rótulos do desenho abrangidos, confirmados e em prévia, mantendo os contextos de exibição atuais.
- [x] **A05** — Textos da interface, alças e símbolos mantêm seu comportamento de tamanho atual; a alteração se limita às fontes dos rótulos.

Os IDs mantidos correspondem aos critérios pertinentes da versão anterior desta task; os critérios sobre outros comportamentos foram retirados na simplificação.

## Validação

Seguir a [política de qualidade](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração): teste específico da regra de fonte, incluindo seus limites, e conferência visual direcionada no Chrome em 25%, 61% e 150%. Sem suíte completa ou matriz de navegadores/resoluções por rotina. Registrar somente as verificações realmente realizadas.

## Resultado

Implementado somente o tamanho adaptável das fontes. `src/editor/label-font.ts` concentra a regra contínua e seus limites, aplicada aos rótulos de ambientes, paredes/A/B, prévia de parede, portas/janelas/vãos em seus modos existentes, cotas, terreno/medidas temporárias e letras cardeais. A base das letras cardeais é derivada do tamanho do símbolo em 61%, sem zoom integral adicional na fonte. Os textos atuais de lajes e do painel transitório de vão são informações ancoradas à tela e permanecem fixos.

- **A01** — Quatro testes unitários aprovados: valores de referência, bases por tipo, mínimos/máximos, continuidade sem arredondamento, monotonicidade, extremos válidos da câmera e aplicação única para fontes antes proporcionais à geometria. No Chrome, o texto efetivamente desenhado das etiquetas foi 10/13/20 px em 25%/61%/150%.
- **A02** — Conferência dos pontos de fonte nos renderizadores e três cenários direcionados no Chrome aprovados. Instrumentação do canvas verificou fontes de nome/área do ambiente, paredes, A/B, portas, janelas, vãos, cotas, terreno e rosa dos ventos nos zooms de referência. Prévias geométricas usam os mesmos pontos de fonte; não foram adicionados rótulos nem contextos de exibição.
- **A05** — Alterações de código se limitam às fontes e à função compartilhada. Mantidos os algoritmos de caixa, quebra de linha, entrelinha, afastamento, seleção e gestos; a quebra das etiquetas continua usando sua referência anterior de 13 px. Botões/painéis, HUDs fixos, alças, sinais de operação e geometria dos símbolos preservados. O teste de navegador confirmou a fonte fixa do botão e a igualdade dos dados do projeto após reabrir com cada escala de câmera. Os contratos atuais de fonte foram atualizados sem alterar os resultados anteriores da T-018.

**Validação proporcional** — Vitest: `tests/label-font.test.ts`, 4 testes aprovados em 340 ms. Chrome: `tests/e2e/label-font.spec.ts`, 3 cenários aprovados em 24,9 s, com inspeção visual das capturas `.tools/t019-fontes-{25,61,150}.png`. A primeira execução de navegador falhou porque a instrumentação estava registrada para uma navegação posterior, enquanto o login já havia aberto a página; corrigida a instalação da instrumentação na página atual, os três cenários passaram, sem mudar asserções ou timeouts. As repetições não representam cobertura adicional.

Typecheck, lint direcionado, formatação, referências e diff aprovados. Logs de saída e códigos em `.tools/t019-font.log`, `.tools/t019-typecheck.log`, `.tools/t019-lint.log`, `.tools/t019-format-check.log`, `.tools/t019-e2e.log`, `.tools/t019-e2e-final.log` e `.tools/t019-diff-check.log`. Não houve build, suíte completa, matriz de navegadores ou regressão de motor/banco: a alteração é de apresentação e o recorte cobre o cálculo das fontes e seu desenho real. O runner utilizou servidor próprio na porta 5174 e ambiente isolado já preparado; a porta 5173 não foi iniciada, encerrada ou reiniciada.

**Aceite manual na conclusão técnica** — Pendente à época da entrega; confirmação posterior registrada abaixo. Ajustes de caixas, espaçamento ou sobreposições permanecem fora deste escopo.

## Confirmação de aceite — 2026-11-13

Aceite manual confirmado explicitamente pelo solicitante ao informar que o resultado ficou bom e solicitar o registro do aceite da T-019. Esta confirmação encerra a pendência manual desta task, preservando as evidências técnicas anteriores e sem representar nova execução de testes. Refere-se somente à T-019.
