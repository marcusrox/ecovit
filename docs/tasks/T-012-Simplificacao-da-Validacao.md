# T-012 — Simplificar a seleção e a execução das verificações

**Tipo** — Implementação

**Execução** — Verificada

**Data de execução** — 2026-11-11

**Aceite manual** — Não aplicável

## Alteração e limites

Atender à revisão solicitada em 11/11/2026: critérios de resultado sem prescrever rotinas amplas para mudanças pequenas, política central em [Qualidade e desempenho](../arquitetura/Qualidade-e-Desempenho.md), registro curto e testes selecionáveis por responsabilidade. Preservar integridade, isolamento, asserções importantes e homologação completa.

Separar os testes dos rodapés e disponibilizar fixture pública sem autenticação; conferir o rótulo compartilhado sem navegador. Comandos cotidianos de navegador devem exigir recorte ou intenção ampla explícita. Preparação da API deve dispensar navegador e portas de frontend. Sem mudança de comportamento do aplicativo, timeouts, workers ou bibliotecas.

## Critérios de aceite

- [x] **A01** — AGENTS.md e contratos remetem à política central; critérios novos descrevem resultado e risco concreto, sem transformar a matriz de homologação original em obrigação para cada ajuste. Registro curto permitido.
- [x] **A02** — Rótulo/link têm verificação de componente sem banco/navegador; cenários públicos dispensam login. Conteúdo público, teclado/foco, matriz visual das três telas/resoluções e retorno ao editor com falha de salvamento continuam cobertos por cenários independentes.
- [x] **A03** — Comandos cotidianos recusam execução sem seleção, salvo diagnóstico ou --all explícito; o comando completo preserva ambos os navegadores e todos os casos. Filtros mantêm o grupo escolhido.
- [x] **A04** — Preparação --api verifica banco/runtime sem navegador ou portas do frontend; o preparo normal e os bloqueios de encerramento permanecem. Validação e eventuais impedimentos registrados sem ampliação da investigação ambiental.

## Resultado

Implementação e validação concluídas. O impedimento de navegação inicial foi corrigido na [T-013](T-013-Carregamento-Inicial-dos-Testes.md), mediante solicitação explícita de investigação.

- **A01 — aprovado.** AGENTS.md reduzido e ligado à política única em Qualidade e desempenho. Modelo curto e guia de tasks descrevem resultado, sem matriz ampla automática. Interface, Editor e interação e Medidas e imagens distinguem cobertura mantida de execução cotidiana. Texto exato de UI não é duplicado no PRD/arquitetura; critérios solicitados, integridade e homologação completa preservados.
- **A02 — aprovado.** O teste de componente version-footer.test.ts passou sem banco/navegador. release-history.spec.ts agora tem oito cenários: público direto/conteúdo, teclado/foco em login/lista/editor, retorno com candidato após falha de salvamento e matrizes visuais independentes de login/lista/editor. Conservam controles, dados do histórico, estado vazio, foco, dimensões, ausência de sobreposição e capturas; navegação não é repetida dentro de cada resolução. publicTest prepara somente o contexto isolado/IP; a fixture autenticada mantém login e espera de navegação. A revisão e descoberta conferiram a cobertura. A primeira execução parou antes das asserções; após a correção da T-013, os oito cenários passaram no Chrome/Vite real em 24 s e a regressão autenticada de troca de pavimento passou em 13,5 s.
- **A03 — aprovado.** Testes de seleção e CLI real confirmaram recusa sem recorte (código 1), opções de diagnóstico, --all explícito, filtros e Edge explícito. Descoberta integral: 204 cenários, 408 combinações Chrome/Edge (31 interface, 164 fluxo, 9 carga). Os 196 cenários externos a release-history foram preservados; o cenário antigo foi separado em oito. Nenhum caso de carga ou navegador foi excluído da homologação.
- **A04 — aprovado.** Perfil test:env -- --api validado com serviço de teste ocupando 5174: conferiu o banco sem Chrome e preservou o serviço. O preparo normal passou com Chrome e portas livres; o encerramento mantém seus bloqueios e identificação anteriores. Perfil --api não reduz validação de conexão/nome/versão/encoding/permissões.
- **Verificações realizadas.** 12 testes em três arquivos (componente, seleção e ambiente), todos aprovados em 3,37 s; typecheck e lint aprovados. Descoberta sem navegador e comparação com o catálogo anterior aprovadas. Sem build, carga, suíte completa ou Edge real: não houve mudança de produto/empacotamento ou compatibilidade que justificasse essas execuções.
- **Impedimento ambiental inicial, resolvido na T-013.** Uma tentativa Chrome/5174 com --max-failures=1: timeout de 30 s em page.goto do histórico público. Nenhuma repetição, alteração de timeout/asserção, servidor alternativo ou investigação extensa. O critério A02 permaneceu pendente nessa etapa, até a correção e revalidação registradas na T-013. Logs completos em .tools/t012-*.log, incluindo browser.log, api-profile.log e discovery-check.log, ignorados pelo Git. Porta 5173 e alterações anteriores da T-010 preservadas.
- **Aceite manual.** Não aplicável à alteração de infraestrutura/política. Não foi declarada homologação de produto. Sem commit ou push.

Revalidação de 11/11/2026: nove cenários distintos aprovados no Chrome/5174, sem mudança de timeouts/asserções ou execução de carga/suíte completa. Logs .tools/t013-browser.log e .tools/t013-auth-regression.log; capturas das três telas/resoluções em .tools/release-history. Tipos e lint também aprovados após a correção do servidor de testes.
