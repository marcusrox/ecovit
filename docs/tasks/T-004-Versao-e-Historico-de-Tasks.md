# T-004 — Exibir a versão e o histórico de tasks

**Tipo** — Implementação

**Execução** — Verificada

**Data de execução** — 2026-11-10

**Aceite manual** — Pendente

## Referências e pré-condições

[PRD — Jornada principal](../Ecovit-PRD.md#jornada-principal) · [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md) · [Editor e interação](../arquitetura/Editor-e-Interacao.md) · [Publicação da revisão](../arquitetura/Persistencia-e-Compatibilidade.md#github-actions-e-webhook-do-aapanel) · [Modelo de task](Modelo.md)

## Comportamento atual e objetivo

O Ecovit deve identificar a revisão em uso no rodapé do login, da lista de projetos e da tela do projeto. O número da versão abre uma página do aplicativo com as tasks implementadas nessa revisão, da mais recente para a mais antiga.

## Escopo e limites

- Exibir a versão como um link de texto discreto, legível e acessível por teclado, no rodapé das três telas. Usar o rodapé existente no editor, preservando suas informações e a área útil do canvas.
- Formatar a versão como `yyyyddmm-<commit>`. Usar a data do commit da compilação no fuso `America/Sao_Paulo` e os primeiros sete caracteres do SHA. Por exemplo, o commit `a1b2c3d…` de 24/03/2026 gera `20262403-a1b2c3d`. Recompilar a mesma revisão gera a mesma versão.
- Abrir a página de histórico sem exigir login. A página deve permitir retornar à tela de origem. Ao acessar pelo editor e voltar, preservar o projeto aberto e o estado de trabalho, inclusive um candidato a salvamento ainda em memória.
- Gerar a lista a partir dos arquivos `T-*.md` de `docs/tasks` da mesma revisão usada na compilação. Incluir tasks de implementação com execução `Verificada` e data de execução registrada, mesmo com aceite manual pendente. Tasks de conferência ou homologação, como T-001 a T-003, ficam fora do histórico de implementações.
- Registrar nas tasks de implementação a data real de conclusão da execução em `AAAA-MM-DD`. Uma task sem data válida fica fora da lista até que a data seja registrada. Na entrega desta task, atualizar o modelo e o guia para tornar explícitos o tipo da task e a data de execução.
- Exibir apenas o ID, o título e a data de execução em `DD/MM/AAAA`. Ordenar pela data de execução decrescente, com desempate pelo número da task em ordem decrescente. A página pública recebe apenas esses campos e a versão correspondente. Se a lista estiver vazia, exibir “Nenhuma task implementada nesta versão”.

## Critérios de aceite

- [x] **A01** — Com uma compilação de um commit conhecido, abrir login, lista de projetos e projeto. Os três rodapés exibem o mesmo identificador da revisão compilada. Para o commit de exemplo, o valor é `20262403-a1b2c3d`. Recompilar o mesmo commit conserva o identificador. Verificação automatizada.
- [x] **A02** — Em Chrome e Edge, nas resoluções 1366×768, 1280×720 e 900×680, o link aparece no rodapé das três telas, tem foco visível e abre o histórico por clique ou Enter. O editor conserva suas informações de rodapé, sem sobreposição ao canvas ou rolagem horizontal. Verificação visual e por teclado.
- [x] **A03** — Sem sessão, abrir o histórico pelo link do login. A página mostra o histórico sem redirecionar para autenticação. Ao abrir pelo editor e retornar, o mesmo projeto permanece aberto, com o estado de trabalho anterior. Verificação de navegador.
- [x] **A04** — Compilar uma revisão com tasks de implementação verificadas, incluindo duas com a mesma data, uma mais antiga e uma com aceite manual pendente. A página mostra ID, título e data das elegíveis, na ordem especificada. Tasks pendentes, de verificação e sem data válida ficam de fora, assim como arquivos de modelo, guia e dados de outra revisão. Verificação automatizada.
- [x] **A05** — Compilar uma revisão sem tasks elegíveis. O link abre a página e o estado vazio aparece. Nos dois cenários de lista, o conteúdo publicado se limita ao identificador da versão e aos três campos públicos por task. Verificação automatizada.

## Resultado da execução

- **Contratos atualizados** — PRD, Interface e iconografia, Persistência e compatibilidade e modelo e guia de tasks.
- **Verificação automatizada** — `npm run lint` e `npm run build` aprovados, incluindo os tipos. `npm test` aprovou 419 testes. O teste de metadados verificou fuso, estabilidade do identificador, filtragem, ordenação e leitura exclusiva do commit (A01, A04 e A05).
- **Navegador** — `npm run test:e2e -- tests/e2e/release-history.spec.ts tests/e2e/home-status.spec.ts tests/e2e/project-view.spec.ts` aprovou 12 cenários em Chrome e Edge na porta 5174. Na revisão `99146fa`, a versão `20260911-99146fa` apareceu nos três rodapés. As verificações cobriram foco e teclado nas três resoluções, acesso público, estado vazio e retorno a um projeto com edição ainda em memória (A01, A02, A03 e A05).
- **Build com histórico preenchido** — uma revisão de teste com três tasks elegíveis apresentou a ordem esperada e as datas em `DD/MM/AAAA` no Chrome. A inspeção do bundle confirmou a exclusão das evidências internas, das tasks inelegíveis e dos dados fora do commit (A04).
- **Aceite do solicitante** — pendente.
