# T-013 — Corrigir o carregamento inicial do navegador de testes

**Tipo** — Implementação

**Execução** — Verificada

**Data de execução** — 2026-11-11

**Aceite manual** — Não aplicável

## Alteração e limites

Investigar o timeout recorrente na navegação inicial do Chrome/5174 e concluir a validação pendente da [T-012](T-012-Simplificacao-da-Validacao.md). Escopo adicional expressamente autorizado pelo solicitante em 11/11/2026, conforme a política de [falhas ambientais](../arquitetura/Qualidade-e-Desempenho.md#falhas-do-ambiente).

Manter servidor de desenvolvimento real, isolamento, timeouts e asserções. Não usar a porta 5173, encerrar processos desconhecidos ou ampliar a suíte.

## Critérios de aceite

- [x] **A01** — Causa identificada com evidência e correção no responsável pelo carregamento, sem contorno por servidor de produção.
- [x] **A02** — Os oito cenários de release-history e a regressão autenticada de troca de pavimento passam no Chrome/5174; T-012 atualizada com o resultado real.

## Resultado

- **A01 — aprovado.** No ambiente Chrome 156.0.8078.82/Node 24.18.0/Vite 7.3.7, a navegação ficava interactive com módulos pendentes. Consultas HTTP diretas aos mesmos arquivos retornaram 200 rapidamente. Instrumentação de CDP/HTTP identificou requisições aguardando reutilização de conexões HTTP/1.1; desativar cache não resolveu (15 s), enquanto encerrar conexões após cada resposta fez load concluir em 5,48 s. Isso isolou o mecanismo local de transporte; não foi atribuída uma causa interna a um bug específico do Chrome ou Node.
- **Correção.** server/test-main.ts define maxRequestsPerSocket=1 no servidor HTTP do Vite antes de listen. O ajuste limita reutilização de conexões apenas na instância isolada da 5174. Cache do navegador, configuração de HMR, API, porta 5173 e produção permanecem com suas configurações anteriores. Sem servidor de build/preview como contorno e sem alteração de timeouts, workers ou asserções. Contrato de ambiente isolado atualizado.
- **A02 — aprovado.** release-history.spec.ts integral no Chrome: oito cenários em 24,0 s, incluindo conteúdo público, teclado/foco nos três contextos, matrizes visuais das três telas/resoluções e preservação de candidato após falha de salvamento. Regressão autenticada de floors.spec.ts, filtro troca descarta: um cenário em 13,5 s. Ambas as execuções iniciaram servidores Vite reais novos na 5174, confirmando navegação inicial com a correção. T-012 marcada Verificada com A02 concluído.
- **Demais conferências.** Typecheck, lint e revisão do diff aprovados. Não houve build, suíte completa, Edge ou carga, conforme o recorte solicitado. Os diagnósticos não foram contados como cenários adicionais de cobertura. Nenhuma execução silenciosa legítima foi interrompida; instâncias de diagnóstico próprias foram encerradas ao terminar.
- **Evidências.** Logs ignorados pelo Git em .tools/t013-*.log: diagnostic, cdp, http-client/http-server, compare, browser, auth-regression, types e lint. Capturas finais em .tools/release-history. Autorizações e dados do aplicativo não foram alterados; banco de testes segue isolado.
- **Aceite manual.** Não aplicável à correção de infraestrutura. Sem commit ou push.
