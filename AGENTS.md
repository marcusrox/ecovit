# Orientações para trabalhar no Ecovit

## Referências

- [PRD](docs/Ecovit-PRD.md): comportamento do produto e limites de escopo.
- [Arquitetura](docs/Ecovit-Arquitetura-Tecnica.md): visão geral e índice dos contratos de software por assunto em `docs/arquitetura/` (dados, editor, motor, estado, persistência e interface).
- [Índice de requisitos e aceites](docs/Ecovit-Plano-Implementacao.md): rastreabilidade de funcionalidades vigentes, aceites e pendências em [docs/marcos](docs/marcos).
- [Caderno técnico](docs/Ecovit-Caderno-Tecnico.md): fontes, convenções nominais, exemplos e lacunas da composição. Consulte antes de implementar o motor; não trate hipóteses como medidas físicas verificadas.

Consulte o assunto pertinente da arquitetura e o arquivo do marco antes da alteração. O Caderno Técnico é a fonte das regras/convenções geométricas e construtivas, fontes, justificativas, exemplos e limites; a Arquitetura descreve sua representação e implementação em software. Uma decisão de programação não cria regra construtiva. Não duplique esses documentos em novas especificações. Instruções atuais do solicitante prevalecem; quando mudarem o comportamento acordado, atualize os documentos afetados. Não transforme uma ambiguidade em ampliação silenciosa do produto.

## Forma de trabalho

- Implemente somente a entrega ou alteração solicitada. O índice serve para consulta e rastreabilidade.
- Entregue funcionalidades no próprio aplicativo, sem prova técnica ou protótipo separado.
- Detalhe entregas futuras apenas quando forem iniciadas. Preserve os IDs de requisitos e aceite para relacionar implementação e verificações.
- Ao concluir, atualize os contratos vigentes e a situação de aceite em `docs/marcos/` e no índice. Preserve IDs, aceites e pendências. Registre evidências de verificação no resultado da tarefa e mantenha separados os testes automatizados e a confirmação manual do solicitante.
- Não duplique o conteúdo dos marcos no índice; comportamento, contratos e convenções continuam nos documentos responsáveis.
- Corrija falhas pertinentes antes de declarar a entrega pronta para teste. Mudanças de comportamento motivadas por feedback devem atualizar especificação e código juntos.

## Uso das especificações

- Use o PRD para comportamento e limites do produto, a arquitetura para decisões técnicas e contratos de dados, o caderno técnico para convenções geométricas/construtivas e o índice para rastreabilidade, aceite e pendências.
- Não mantenha cópias dessas regras neste arquivo. Ao alterar comportamento ou contrato técnico, atualize o documento responsável junto com a implementação e consolide o estado no arquivo do marco e no índice do plano. A documentação descreve o produto por assunto e marco, sem diário de decisões, datas de ajustes ou relatos de tentativas intermediárias. Preserve IDs e contratos legados necessários à compatibilidade de arquivos; distinga-os do comportamento vigente.
- Distinga funcionalidade especificada de funcionalidade implementada e aprovada; não trate a existência de uma especificação como autorização para implementá-la.
- Não introduza bibliotecas, serviços ou abstrações sem necessidade concreta da entrega e compatibilidade com a arquitetura.
- Para mudanças de interface, consulte o padrão de iconografia na [Interface e iconografia](docs/arquitetura/Interface-e-Iconografia.md#iconografia), incluindo a implementação e as verificações exigidas; mantenha as regras no assunto Interface e iconografia.
- Não invente regras construtivas, peças especiais, espaçamentos ou apoios. Consulte e registre a pesquisa no caderno técnico antes dos algoritmos correspondentes; não apresente convenções nominais como comprovação física ou aprovação estrutural.

## Validação

### Portas e inicialização

- A porta **5173** (`http://127.0.0.1:5173/`) é reservada ao uso do solicitante. O Codex não deve iniciar o aplicativo nessa porta; quando necessário, apenas orientar o solicitante a executar `./Start-Ecovit.ps1 -Task dev` e abrir o endereço. Não encerrar nem reiniciar o servidor do solicitante.
- Todos os testes de navegador e verificações interativas do Codex devem usar a porta **5174** (`http://127.0.0.1:5174/`) e sessões de navegador isoladas dos projetos pessoais. Para servidor interativo, usar `./Start-Ecovit.ps1 -Task dev:test` ou `npm run dev:test`.
- `npm run test:e2e` inicia seu próprio servidor na porta 5174, sem reaproveitar servidores existentes. Se a porta estiver ocupada, identificar a instância; não recorrer à porta 5173 nem encerrar processos de origem desconhecida.

Os scripts abaixo estão implementados no `package.json`. Consulte o README para instalação e execução; nesta máquina, `Start-Ecovit.ps1 -Task <tarefa>` também utiliza o runtime local do Codex.

| Comando | Finalidade |
|---|---|
| `npm run dev` | Solicitante inicia o aplicativo na porta 5173 |
| `npm run dev:test` | Codex inicia o aplicativo para verificações na porta 5174 |
| `npm run typecheck` | Verificar tipos |
| `npm run lint` | Verificar o código |
| `npm test` | Executar testes de domínio e persistência, sem modo de observação |
| `npm run test:e2e` | Executar fluxos relevantes no navegador |
| `npm run build` | Verificar a compilação de produção |

Em alterações de código, execute as verificações pertinentes e informe o resultado real. Priorize testes de geometria, integridade do arquivo e fluxos essenciais; não crie testes que apenas reproduzam a implementação. Alterações somente de documentação exigem revisão de consistência, não instalação de dependências ou execução de testes do aplicativo.

### Execução eficiente e acompanhamento de testes

- Reduzir o consumo de tokens pelo acompanhamento, sem reduzir cobertura. Quando solicitada a suíte completa, executar todos os testes e navegadores previstos; não omitir casos, enfraquecer asserções ou ampliar limites de tempo apenas para obter aprovação.
- Salvar stdout/stderr completos em log local ignorado pelo Git, preservando o código de saída. Preferir relatórios compactos já disponíveis no runner; trazer à conversa somente totais, duração, falhas e trechos necessários ao diagnóstico. Consultar detalhes e traces de forma direcionada, sem reler ou retransmitir todo o log.
- Manter a execução em uma sessão de processo e usar esperas longas compatíveis com as ferramentas e instruções vigentes. Evitar consultas curtas repetidas e retomadas do modelo apenas para narrar progresso inalterado. Manter a comunicação exigida, com atualizações concisas sobre mudanças relevantes.
- Antes de interromper uma execução silenciosa, conferir os tempos esperados dos testes de carga e evidências de atividade. Ausência de novas linhas não comprova travamento. Evitar concorrência de cargas pesadas que cause disputa de recursos e falhas de tempo artificiais.
- Após corrigir falhas, reexecutar os arquivos afetados e suas regressões pertinentes; repetir toda a suíte quando o alcance da mudança exigir. Informar o que foi executado integralmente e o que foi revalidado, contando cenários distintos sem somar repetições como cobertura adicional.
