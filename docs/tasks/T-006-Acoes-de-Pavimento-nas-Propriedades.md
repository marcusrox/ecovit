# T-006 — Mover ações de pavimento para as propriedades

**Tipo** — Implementação

**Execução** — Verificada

**Data de execução** — 2026-11-11

**Aceite manual** — Confirmado pelo solicitante

## Referências e pré-condições

- [RF-08 — Até quatro pavimentos](../Ecovit-PRD.md#rf-08--até-quatro-pavimentos), incluindo operações por pavimento e comparação visual.
- [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md#iconografia) e [organização dos painéis de propriedades](../arquitetura/Interface-e-Iconografia.md#organização-visual).
- [Estado, histórico e operações](../arquitetura/Estado-Historico-e-Operacoes.md), para preservar o comportamento das ações existentes.
- [Aceites históricos M4.1-A01–14](../arquivo/marcos/M4.1-Pavimentos.md).
- Solicitação de 11/11/2026 e captura anexada: marcações vermelhas na etiqueta “Pavimento”, nos botões Duplicar e Excluir e no indicador “1/4”. O seletor e o botão “+” não foram marcados.

Implementação autorizada pelo solicitante em 11/11/2026, após a criação desta especificação. Aceite manual permanece pendente.

## Comportamento atual e objetivo

A barra de ferramentas apresenta a etiqueta visível “Pavimento”, o seletor do pavimento ativo, Novo pavimento (“+”), Duplicar pavimento, Excluir pavimento e a contagem de pavimentos sobre o limite de quatro. O indicador “1/4” significa um pavimento cadastrado de quatro permitidos, não a posição do pavimento ativo.

Economizar espaço horizontal na barra transferindo a identificação do contexto, as ações de duplicação e exclusão e a contagem para o painel existente de propriedades do pavimento ativo.

## Escopo e limites

- Retirar da barra a etiqueta visível “Pavimento”, os botões Duplicar pavimento e Excluir pavimento e o indicador de quantidade/limite.
- Manter na barra o seletor do pavimento ativo, com nome e cota nas opções, e o botão Novo pavimento (“+”). Preservar o nome acessível “Pavimento” do seletor mesmo sem a etiqueta visível.
- Usar o cabeçalho existente de propriedades do pavimento para identificar o contexto, sem acrescentar uma etiqueta redundante. Incluir nesse painel Duplicar pavimento, Excluir pavimento e o indicador dinâmico `N/4`, com identificação textual de que se trata da quantidade de pavimentos do projeto.
- As ações no painel operam sobre o pavimento ativo. Seguir a organização compacta, os controles, ícones centrais, dicas, foco e estilo de exclusão definidos no contrato de interface.
- Manter o acesso e a visibilidade atuais do painel: não criar painel, diálogo de propriedades, atalho ou acesso adicional. Ações transferidas acompanham esse painel, sem aparecer nas propriedades de outros elementos.
- Preservar os formulários e validações de duplicação, a confirmação de exclusão, cancelamento, bloqueios durante processamento/somente leitura, limites de um a quatro pavimentos, seleção do ativo, histórico, salvamento e recálculo. As regras continuam nos contratos referenciados.
- Não alterar modelo, formato de arquivo, motor, criação de pavimentos, comparação visual ou demais ferramentas.
- Na implementação, atualizar o trecho “Operações por pavimento” de RF-08, que hoje localiza os três botões na barra, e registrar a nova distribuição em Interface e iconografia. Atualizar esses contratos na mesma entrega da implementação.

## Critérios de aceite

- [x] **A01** — Ao abrir o editor, a barra mantém o seletor e Novo pavimento, sem a etiqueta visível “Pavimento”, Duplicar, Excluir ou contagem `N/4`; o espaço desses elementos é liberado, sem lacunas reservadas. O seletor continua identificado por “Pavimento” para tecnologia assistiva e permite trocar o ativo. Verificação por teste de navegador e revisão visual.
- [x] **A02** — Ao abrir as propriedades do pavimento, o cabeçalho identifica o contexto e o painel oferece Duplicar pavimento, Excluir pavimento e a quantidade `N/4`. Criar, duplicar, excluir, desfazer e refazer mantêm a contagem coerente com o projeto; ela não muda apenas por trocar o ativo. Verificação por teste de navegador com um, dois e quatro pavimentos.
- [x] **A03** — Com menos de quatro pavimentos, Duplicar nas propriedades abre o formulário referente ao ativo e preserva validações, cancelamento e confirmação do fluxo existente. A cópia confirmada torna-se ativa e mantém a independência prevista em RF-08; com quatro pavimentos, duplicar e criar permanecem bloqueados. Verificação por teste de navegador e regressões pertinentes de pavimentos.
- [x] **A04** — Excluir nas propriedades solicita a confirmação existente para o ativo. Cancelar preserva o projeto; confirmar remove somente o pavimento escolhido e seleciona o sucessor previsto em RF-08. Desfazer restaura o pavimento e seus elementos. Com um único pavimento, a exclusão permanece bloqueada. Verificação por teste de navegador e regressões pertinentes de histórico.
- [x] **A05** — As ações transferidas respeitam processamento e somente leitura, têm nomes acessíveis, dicas quando apresentadas somente com ícones e foco visível. Abrir e cancelar o formulário de duplicação pelo teclado devolve o foco ao acionador nas propriedades. Verificação por teste de navegador e roteiro manual de teclado.
- [x] **A06** — Em Chrome e Edge, nas resoluções 1366×768, 1280×720 e 900×680, a barra fica mais compacta e as propriedades permanecem legíveis, sem sobreposição ou rolagem horizontal; a rolagem vertical do painel mantém todas as ações acessíveis. Selecionar outro elemento ou recolher o painel segue o comportamento atual, sem deslocar as ações para outros painéis. Verificação por revisão visual e testes de navegador pertinentes, na porta 5174 e em sessão isolada.

## Resultado da execução

- **Contratos atualizados** — RF-08, em Operações por pavimento, e Interface e iconografia, em Controles de pavimento. Nenhuma mudança de domínio, arquivo, persistência ou motor.
- **A01** — Verificado por navegador e capturas: seletor acessível e Novo pavimento permanecem na barra; etiqueta visível, duplicação, exclusão e contagem foram retiradas, sem espaços reservados.
- **A02** — Verificado por navegador: contagem acompanha criar, duplicar, excluir, desfazer/refazer e permanece igual na troca do ativo, com um, dois e quatro pavimentos.
- **A03** — Verificado por navegador e regressões de domínio/estado: formulário e validação de cota preservados; cópia independente, seleção do novo ativo e limite de quatro mantidos, inclusive ajustes pendentes e persistência.
- **A04** — Verificado por navegador e regressões de domínio/estado: cancelar/confirmar exclusão, impedimento de remover o último e restauração pelo histórico preservados.
- **A05** — Verificado por navegador: bloqueios em somente leitura e durante salvamento pendente, nomes/dicas, ícones decorativos, centralização com tolerância de 1 px e foco de retorno após Escape. O roteiro de teclado foi automatizado; não houve confirmação manual do solicitante.
- **A06** — Verificado por navegador e inspeção visual das seis capturas em Chrome/Edge nas resoluções 1366×768, 1280×720 e 900×680: sem sobreposição ou rolagem horizontal, controles legíveis e painel com rolagem vertical. Recolher propriedades e selecionar parede ocultam as ações; retornar ao pavimento as reexibe.
- **Verificação automatizada** — Build de produção (incluindo typecheck), lint e formatação aprovados. Vitest: 70 testes aprovados nos três arquivos floors.test.ts, floor-state.test.ts e floor-reference.test.ts, em 1,83 s. Playwright: floors.spec.ts e floor-reference.spec.ts executados integralmente, 50 cenários aprovados em Chrome/Edge, em 4,5 min, na porta 5174 e com banco PostgreSQL descartável próprio. Inclui carga de quatro pavimentos/400 paredes/110 mil peças e backup grande. Após ampliar as asserções de bloqueio durante salvamento e de visibilidade ao selecionar parede, os quatro cenários afetados foram revalidados nos dois navegadores, em 31,3 s; são repetições de cobertura, não cenários adicionais. A suíte completa do aplicativo não foi executada.
- **Ambiente e evidências** — Logs completos ignorados pelo Git em .tools/t006-*.log; capturas em .tools/m41-{chrome,edge}-{1366,1280,900}.png. A primeira tentativa de navegador não iniciou sem conexão de teste; uma tentativa no sandbox teve timeouts na navegação inicial e foi interrompida. A execução fora do sandbox com banco isolado passou sem mudar limites de tempo ou asserções. Nenhum servidor na porta 5173 foi iniciado, encerrado ou reiniciado.
- **Aceite do solicitante** — Pendente. Critérios verificados tecnicamente; a aprovação visual e funcional manual depende de manifestação explícita do solicitante. Sem publicação nesta entrega.

## Confirmação de aceite — 2026-11-13

Aceite manual confirmado explicitamente pelo solicitante em 2026-11-13, ao solicitar o registro de todos os aceites pendentes. Os registros anteriores preservam a situação de cada etapa; esta confirmação encerra a pendência de aceite desta task, sem alterar as evidências de execução ou representar nova execução de testes.
