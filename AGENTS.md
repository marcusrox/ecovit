# Orientações para trabalhar no Ecovit

## Referências

- [PRD](docs/Ecovit-PRD.md): comportamento do produto e limites de escopo.
- [Arquitetura](docs/Ecovit-Arquitetura-Tecnica.md): stack, modelo, processamento e persistência.
- [Plano incremental](docs/Ecovit-Plano-Implementacao.md): entrega atual, critérios de aceite, verificações e andamento.
- [Caderno técnico](docs/Ecovit-Caderno-Tecnico.md): fontes, convenções nominais, exemplos e lacunas da composição. Consulte antes de implementar o motor; não trate hipóteses como medidas físicas verificadas.

Consulte as seções pertinentes à alteração. Não duplique esses documentos em novas especificações. Instruções atuais do solicitante prevalecem; quando mudarem o comportamento acordado, atualize os documentos afetados. Não transforme uma ambiguidade em ampliação silenciosa do produto.

## Forma de trabalho

- Implemente somente a entrega ou alteração solicitada. O plano não autoriza executar todas as entregas de uma vez.
- Entregue funcionalidades no próprio aplicativo, sem prova técnica ou protótipo separado.
- Detalhe entregas futuras apenas quando forem iniciadas. Preserve os IDs de requisitos e aceite para relacionar implementação e verificações.
- Ao concluir, mantenha no plano um resumo consolidado por marco do alcance implementado, verificações executadas, limitações e testes pendentes. Separe verificação do Codex de teste manual do solicitante; não declare este último concluído sem seu retorno.
- Corrija falhas pertinentes antes de declarar a entrega pronta para teste. Mudanças de comportamento motivadas por feedback devem atualizar especificação e código juntos.

## Uso das especificações

- Use o PRD para comportamento e limites do produto, a arquitetura para decisões técnicas e contratos de dados, o caderno técnico para convenções geométricas/construtivas e o plano para escopo, andamento e aceite da entrega solicitada.
- Não mantenha cópias dessas regras neste arquivo. Ao alterar comportamento ou contrato técnico, atualize o documento responsável junto com a implementação e consolide o estado do marco no plano. A documentação descreve o produto por assunto e marco, sem diário de decisões, datas de ajustes ou relatos de tentativas intermediárias. Preserve IDs e contratos legados necessários à compatibilidade de arquivos; distinga-os do comportamento vigente.
- Distinga funcionalidade especificada de funcionalidade implementada e aprovada; não trate a existência de uma especificação como autorização para implementá-la.
- Não introduza bibliotecas, serviços ou abstrações sem necessidade concreta da entrega e compatibilidade com a arquitetura.
- Para mudanças de interface, consulte o padrão de iconografia na [Arquitetura §2.1](docs/Ecovit-Arquitetura-Tecnica.md#21-padrão-de-iconografia), incluindo a implementação e as verificações exigidas; mantenha as regras nesse documento.
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
