# T-020 — Diagnóstico de sobreposição e contornos na Fiada

**Tipo** — Implementação

**Resumo** — Localiza os trechos realmente sobrepostos e mostra os contornos das paredes com composição suspensa em Fiada, destacando a causa do conflito e mantendo visíveis as peças dos conjuntos independentes.

**Execução** — Verificada

**Data de execução** — 2026-11-16

**Aceite manual** — Confirmado pelo solicitante

## Alteração e limites

Melhorar o diagnóstico de paredes colineares sobrepostas para identificar e destacar exatamente os dois trechos envolvidos e a região real do conflito. A localização do diagnóstico deve apontar para a sobreposição, em vez da posição inicial do conjunto conectado. Distinguir as paredes que causam o conflito das demais paredes cuja composição foi suspensa por pertencerem ao mesmo conjunto.

Manter o contorno das paredes visível no modo Fiada, inclusive quando a composição estiver suspensa, para permitir reconhecer o desenho e localizar a pendência. O contorno representa a geometria das paredes na fiada exibida e deve continuar distinguível das peças efetivamente calculadas e do destaque do conflito.

Referência do problema: no arquivo `Casa Luciano.ecovit` investigado, os dois trechos da parede horizontal inferior se sobrepõem em uma região de 12,5 × 12,5 cm, junto à primeira divisória vertical a partir da esquerda. O diagnóstico atual associa as dez paredes conectadas e posiciona o marcador no canto superior esquerdo do conjunto, enquanto a Fiada fica sem peças e mostra apenas os vãos. Usar essa situação como referência de reprodução, sem depender do caminho local do arquivo.

Preservar a regra de suspensão da composição do conjunto com conflito e a composição dos conjuntos independentes. Esta task não inclui composição parcial de um mesmo conjunto, correção automática da sobreposição ou alteração da geometria do projeto.

Na implementação, atualizar os contratos pertinentes de [Motor e diagnósticos](../arquitetura/Motor-e-Diagnosticos.md#diagnósticos) e [Editor e interação](../arquitetura/Editor-e-Interacao.md), mantendo a distinção entre causa local e consequência no conjunto. Respeitar a ocupação e os encontros definidos em CT-03 do [Caderno técnico](../Ecovit-Caderno-Tecnico.md#ct-03--área-ocupada-e-referência-externa).

## Critérios de aceite

- [x] **A01** — Ao detectar sobreposição colinear, o diagnóstico identifica os dois trechos causadores e destaca a região efetivamente sobreposta. Ao localizar a pendência, o foco e o marcador apontam para o conflito real, independentemente do início do conjunto ou da ordem das paredes.
- [x] **A02** — A apresentação diferencia os dois trechos causadores das demais paredes afetadas pela suspensão, sem sugerir que todas as paredes do conjunto estão sobrepostas.
- [x] **A03** — Na Fiada, os contornos das paredes permanecem visíveis com a composição suspensa, permitindo reconhecer o desenho e o local do conflito. A apresentação respeita o pavimento e a altura da fiada exibidos, mantém os vãos identificáveis e não confunde contornos com peças geradas.
- [x] **A04** — O conjunto com conflito continua sem peças, os conjuntos independentes continuam compostos e a melhoria não altera paredes, vãos, paginação ou quantitativos. Contatos colineares sem área sobreposta e compartilhamento normal entre paredes ortogonais não são apresentados como essa pendência.

A conferência segue a [política de qualidade](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração), com cobertura direcionada ao diagnóstico e à apresentação afetados, sem impor homologação ampla.

## Resultado

Implementação realizada em 2026-11-16. `src/editor/diagnostics.ts` deriva os pares e suas interseções para apresentação compartilhada pelos painéis e pelo canvas. Ao localizar, o destaque usa somente os IDs do par e a câmera recebe o centro da região. O resultado nominal-v10 persistido e a validação por recomputação foram preservados. A Fiada desenha contornos neutros tracejados das paredes ativas mesmo sem peças; o destaque do conflito aparece sobre o desenho e os vãos. Os contratos de motor/diagnósticos e editor/interação foram atualizados.

- **A01 — Verificado:** testes confirmam IDs do par, região e foco exatos, ordem/sentido invertidos, múltiplos pares e lado negativo da espessura. A execução com o arquivo `Casa Luciano.ecovit` confirmou paredes 2 e 3, região de 12,5 × 12,5 cm e consequência em dez paredes conectadas, sem modificar o documento ou o arquivo. Na retomada em Chrome, as asserções confirmaram somente dois trechos destacados e câmera centralizada no conflito; a captura foi inspecionada e mostrou o marcador sobre a área comum real.
- **A02 — Verificado:** a projeção e a integração nos dois painéis foram conferidas por testes e inspeção. A mensagem identifica o par separadamente do conjunto suspenso; a localização recebe somente os dois IDs causadores.
- **A03 — Verificado:** cenário direcionado de Chrome aprovado. Conferidos quatro contornos na primeira fiada, três após o término da parede mais curta e somente um no outro pavimento, sem marcador de conflito indevido. A inspeção de `fiada-suspensa.png` confirmou contorno neutro da divisória conectada, destaque vermelho apenas do par, região do conflito localizada, porta com rótulo e peças do conjunto independente visíveis e distintas dos contornos suspensos.
- **A04 — Verificado:** testes conferem a manutenção da suspensão, peças dos conjuntos independentes, ausência de mutação e leitura do snapshot anterior, além de contatos válidos. O motor e os quantitativos não foram alterados; a nova geometria é apenas uma projeção de apresentação.

Conferências executadas:

- `test -- tests/diagnostics.test.ts tests/composition.test.ts`: 26 testes aprovados em 1,14 s; log `test-results/t020-unit.log`.
- `typecheck`: aprovado; log `test-results/t020-typecheck.log`. Lint dos arquivos TypeScript alterados aprovado; log `test-results/t020-lint.log`.
- Leitura e projeção do arquivo anexado: aprovadas, documento e arquivo preservados; log `test-results/t020-casa-luciano.log`.
- `test:e2e:interface -- tests/e2e/diagnostics.spec.ts`: impedido durante a preparação de `page`, em `auth.ts:63`, após 30,1 s. A navegação inicial a `http://127.0.0.1:5174/` excedeu o timeout antes do login, com módulos pendentes na rede. Nenhuma asserção da T-020 foi executada. Log `test-results/t020-e2e.log` e trace no diretório do cenário em `test-results/`. Não houve ampliação de timeout, mudança de infraestrutura ou nova tentativa sem causa ambiental corrigida.

O preparo inicial informou a porta 55432 ocupada; a instância foi identificada pelo cluster gerenciado em `.tools/test-environment/pgdata` e a conferência mantida `test:env:check` aprovou banco isolado, portas 5174/3002 e Chrome (`test-results/t020-env-check.log`). A falha posterior de navegação foi inspecionada pelo trace, dentro do limite de investigação ambiental da política.

### Retomada da validação visual em 2026-11-16

Investigação adicional explicitamente solicitada. A falha de carregamento foi reproduzida com logs de tempos do Vite e trace (`test-results/t020-chrome-investigation.log`). A instrumentação temporária do servidor isolado mostrou espera no processamento inicial; requisições diretas também excederam 5 s, afastando a hipótese de falha exclusiva do Chrome. Depois de processar os módulos, os mesmos recursos responderam em 24–82 ms e o login abriu no Chrome em 1,854 s (`.tools/t020-direct-http-ready.log` e `.tools/t020-browser-login-ready.log`).

Corrigida a prontidão de `server/test-main.ts`: o servidor responde 503 durante o processamento inicial de `/src/main.tsx` e seus imports estáticos, liberando a sondagem do Playwright somente após `waitForRequestsIdle()`. A identificação do processo e seu encerramento permanecem disponíveis durante essa preparação. Não houve aumento de timeout ou alteração das asserções, da porta 5173 ou da produção. O contrato foi registrado em Persistência e compatibilidade.

- `test:e2e:interface -- tests/e2e/diagnostics.spec.ts --trace=on`: **aprovado**, cenário em 5,9 s e execução total de 1,7 min incluindo inicialização. O log registra 503 durante a preparação e 200 antes do início do cenário: `.tools/t020-validacao/t020-chrome-readiness.log`.
- Captura inspecionada: `.tools/t020-validacao/fiada-suspensa.png`. O arquivo `.tools/t020-validacao/trace.zip` preserva o fluxo, incluindo troca de fiada/pavimento e exportação sem alteração do modelo.
- `typecheck`, lint de `server/test-main.ts` e conferência de formatação: aprovados após a correção de prontidão. Logs `t020-readiness-typecheck.log`, `t020-readiness-lint.log` e `t020-readiness-format.log` em `.tools/t020-validacao/`.

Os resultados unitários e estáticos da primeira rodada foram aproveitados, sem repetir os recortes preservados. Seus caminhos em `test-results/`, assim como os logs das primeiras falhas de carregamento, são registros históricos: a limpeza automática do runner substituiu esses arquivos. As evidências da conclusão foram copiadas para `.tools/t020-validacao/`, ignorado pelo Git, para preservá-las nas próximas execuções.

Verificação técnica concluída nos quatro critérios. Aceite manual permanece pendente; aprovação técnica não representa manifestação do solicitante.

## Confirmação de aceite — 2026-11-16

Aceite manual confirmado explicitamente pelo solicitante ao pedir o registro dos dois aceites pendentes, T-018 e T-020. Esta confirmação encerra a pendência manual desta task, preservando as evidências técnicas e os registros históricos anteriores, sem representar nova execução de testes.
