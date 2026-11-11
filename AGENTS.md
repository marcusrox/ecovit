# Orientações para trabalhar no Ecovit

## Referências

- [PRD](docs/Ecovit-PRD.md): comportamento do produto e limites de escopo.
- [Arquitetura](docs/Ecovit-Arquitetura-Tecnica.md): visão geral e índice dos contratos de software por assunto em `docs/arquitetura/` (dados, editor, motor, estado, persistência e interface).
- [Tasks](docs/tasks/README.md) — alterações e verificações incrementais, com [modelo de especificação](docs/tasks/Modelo.md).
- [Arquivo de marcos e aceites](docs/arquivo/Ecovit-Plano-Implementacao.md) — registros históricos e IDs de rastreabilidade.
- [Caderno técnico](docs/Ecovit-Caderno-Tecnico.md): fontes, convenções nominais, exemplos e lacunas da composição. Consulte antes de implementar o motor; não trate hipóteses como medidas físicas verificadas.

Leia a task indicada pelo solicitante e consulte o assunto pertinente da arquitetura antes da alteração. O Caderno Técnico é a fonte das regras/convenções geométricas e construtivas, fontes, justificativas, exemplos e limites; a Arquitetura descreve sua representação e implementação em software. Uma decisão de programação não cria regra construtiva. Não duplique esses documentos em novas especificações. Instruções atuais do solicitante prevalecem; quando mudarem o comportamento acordado, atualize os documentos afetados. Não transforme uma ambiguidade em ampliação silenciosa do produto.

## Forma de trabalho

- Implemente somente a alteração autorizada pelo solicitante. Use o escopo e os critérios de aceite da task para delimitar a entrega. Se uma ambiguidade mudar o comportamento esperado, resolva esse ponto antes da implementação correspondente.
- Entregue funcionalidades no próprio aplicativo, sem prova técnica ou protótipo separado.
- Escreva uma task por alteração ou verificação independente. Use o modelo para registrar comportamento atual, resultado esperado, limites e critérios observáveis. Referencie os IDs de requisitos, convenções, exemplos ou aceites pertinentes.
- Ao concluir, atualize os contratos afetados na mesma entrega e registre na task o resultado por critério, com testes automatizados separados da confirmação manual. Marque o aceite manual como confirmado somente após manifestação explícita do solicitante.
- Tasks podem ser integradas de forma incremental. A decisão de publicar uma versão cabe ao solicitante.
- Corrija falhas pertinentes antes de declarar a entrega pronta para teste. Mudanças de comportamento motivadas por feedback devem atualizar especificação e código juntos.

## Uso das especificações

- Use o PRD para comportamento e limites do produto, a arquitetura para decisões técnicas e contratos de dados e o Caderno Técnico para convenções geométricas e construtivas.
- Mantenha cada regra no documento responsável e descreva apenas o recorte da alteração na task. Preserve os IDs de rastreabilidade, os aceites anteriores e os contratos legados necessários à compatibilidade. Distinga esses contratos do comportamento vigente.
- Distinga funcionalidade especificada de funcionalidade implementada e aprovada; não trate a existência de uma especificação como autorização para implementá-la.
- Não introduza bibliotecas, serviços ou abstrações sem necessidade concreta da entrega e compatibilidade com a arquitetura.
- Para mudanças de interface, consulte o padrão de iconografia na [Interface e iconografia](docs/arquitetura/Interface-e-Iconografia.md#iconografia), incluindo a implementação e as verificações exigidas; mantenha as regras no assunto Interface e iconografia.
- Não invente regras construtivas, peças especiais, espaçamentos ou apoios. Consulte e registre a pesquisa no caderno técnico antes dos algoritmos correspondentes; não apresente convenções nominais como comprovação física ou aprovação estrutural.

## Validação

### Portas e inicialização

- A porta **5173** (`http://127.0.0.1:5173/`) é reservada ao uso do solicitante. O Codex não deve iniciar o aplicativo nessa porta; quando necessário, apenas orientar o solicitante a executar `./Start-Ecovit.ps1 -Task dev` e abrir o endereço. Não encerrar nem reiniciar o servidor do solicitante.
- Todos os testes de navegador e verificações interativas do Codex devem usar a porta **5174** (`http://127.0.0.1:5174/`) e sessões de navegador isoladas dos projetos pessoais. Para servidor interativo, usar `./Start-Ecovit.ps1 -Task dev:test` ou `npm run dev:test`.
- Todos os comandos `test:e2e`, `test:e2e:edge` e `test:e2e:full` iniciam seu próprio servidor na porta 5174, sem reaproveitar servidores existentes. Se a porta estiver ocupada, identificar a instância; não recorrer à porta 5173 nem encerrar processos de origem desconhecida.

Os scripts abaixo estão implementados no `package.json`. Consulte o README para instalação e execução; nesta máquina, `Start-Ecovit.ps1 -Task <tarefa>` também utiliza o runtime local do Codex.

| Comando | Finalidade |
|---|---|
| `npm run dev` | Solicitante inicia o aplicativo na porta 5173 |
| `npm run dev:test` | Codex inicia o aplicativo para verificações na porta 5174 |
| `npm run typecheck` | Verificar tipos |
| `npm run lint` | Verificar o código |
| `npm test` | Executar testes de domínio e persistência, sem modo de observação |
| `npm run test:env` | Preparar e verificar banco isolado, portas e Chrome; repetir para reutilizar/iniciar o cluster |
| `npm run test:env:check` | Somente diagnosticar; usar `-- --edge` para verificar também Edge |
| `npm run test:env:stop` | Encerrar somente o cluster gerenciado, preservando seus dados |
| `npm run test:e2e:interface -- <arquivo ou filtros>` | Revisão de interface no Chrome, sem cenários de carga |
| `npm run test:e2e:flows -- <arquivo ou filtros>` | Fluxos funcionais no Chrome, sem cenários de carga |
| `npm run test:e2e:load -- <arquivo ou filtros>` | Carga e backup grande no Chrome |
| `npm run test:e2e -- <arquivo ou filtros>` | Executar cenários afetados no Google Chrome, padrão cotidiano |
| `npm run test:e2e:edge -- <arquivo ou filtros>` | Executar verificações específicas no Microsoft Edge |
| `npm run test:e2e:full` | Executar toda a suíte de navegador em Chrome e Edge, para homologação completa |
| `npm run build` | Verificar a compilação de produção |

Em alterações de código, execute as verificações pertinentes e informe o resultado real. Priorize testes de geometria, integridade do arquivo e fluxos essenciais; não crie testes que apenas reproduzam a implementação. Alterações somente de documentação exigem revisão de consistência, não instalação de dependências ou execução de testes do aplicativo.

### Preparação do ambiente

- Antes da primeira verificação de navegador/API, executar `npm run test:env`; para Edge, acrescentar `-- --edge`. O comando usa M12_TEST_DATABASE_URL do ambiente/.env.test ou provisiona o PostgreSQL 18 local descartável. Não descobrir/iniciar clusters anteriores manualmente. Detalhes e pré-requisitos no [README](README.md#preparação-do-ambiente-de-testes).
- Os runners carregam .env.test automaticamente, mantendo a precedência das variáveis já definidas. Nunca usar .env ou banco do aplicativo nos testes. Se houver porta ocupada ou configuração incompatível, diagnosticar a instância e corrigir a causa; não encerrar processos desconhecidos.
- Cada cenário Playwright deve declarar exatamente uma finalidade principal: @interface, @fluxo ou @carga. Selecionar o grupo e o arquivo/cenário afetado antes de executar. Filtros adicionais nos comandos de grupo restringem o alcance e não removem a finalidade. O comando completo mantém todos os grupos.

### Seleção dos navegadores

- Priorizar Google Chrome nas tasks cotidianas, selecionando os cenários afetados. Executar Edge em verificações específicas de compatibilidade e nas homologações completas, conforme [Qualidade e desempenho](docs/arquitetura/Qualidade-e-Desempenho.md#verificação-em-navegadores).
- Aplicar essa política também às revisões visuais de interface. Manter as resoluções e os critérios de acessibilidade definidos nos contratos; registrar o navegador e o recorte realmente verificados na task.
- Uma solicitação de suíte completa de navegador ou homologação completa exige `npm run test:e2e:full`, sem filtros e com ambos os navegadores. O comando cotidiano sem filtros executa toda a suíte apenas no Chrome; não equivale à homologação completa.
- Selecionar arquivos/cenários e concluir as asserções antes da execução final. Não incluir automaticamente testes de carga ou backup grande em mudanças apenas de apresentação; incluí-los quando o impacto da alteração os justificar ou quando a suíte completa for solicitada.

### Execução eficiente e acompanhamento de testes

- Reduzir o consumo de tokens pelo acompanhamento, sem reduzir cobertura. Quando solicitada a suíte completa, executar todos os testes e navegadores previstos; não omitir casos, enfraquecer asserções ou ampliar limites de tempo apenas para obter aprovação.
- Salvar stdout/stderr completos em log local ignorado pelo Git, preservando o código de saída. Preferir relatórios compactos já disponíveis no runner; trazer à conversa somente totais, duração, falhas e trechos necessários ao diagnóstico. Consultar detalhes e traces de forma direcionada, sem reler ou retransmitir todo o log.
- Manter a execução em uma sessão de processo e usar esperas longas compatíveis com as ferramentas e instruções vigentes. Evitar consultas curtas repetidas e retomadas do modelo apenas para narrar progresso inalterado. Manter a comunicação exigida, com atualizações concisas sobre mudanças relevantes.
- Antes de interromper uma execução silenciosa, conferir os tempos esperados dos testes de carga e evidências de atividade. Ausência de novas linhas não comprova travamento. Evitar concorrência de cargas pesadas que cause disputa de recursos e falhas de tempo artificiais.
- Após corrigir falhas, reexecutar os arquivos afetados e suas regressões pertinentes; repetir toda a suíte quando o alcance da mudança exigir. Informar o que foi executado integralmente e o que foi revalidado, contando cenários distintos sem somar repetições como cobertura adicional.
