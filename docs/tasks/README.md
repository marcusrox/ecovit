# Tasks do Ecovit

Criar uma nova task somente mediante pedido explícito do solicitante. Pedidos de investigação, implementação, revisão ou correção não implicam criação de task: podem ser executados diretamente, com resultado informado ao solicitante e contratos atualizados quando necessário. Não exigir um arquivo de task para iniciar ou concluir o trabalho.

Quando a criação for solicitada, cada task especifica uma alteração ou verificação independente. Copie o [modelo](Modelo.md) para `T-NNN-descricao-curta.md`, usando um ID livre, e referencie os requisitos e contratos pertinentes. A criação da especificação não autoriza sua implementação. Quando o pedido indicar uma task existente, use-a como referência e registre nela os resultados pertinentes, sem criar automaticamente outro arquivo.

O [PRD](../Ecovit-PRD.md), a [Arquitetura](../Ecovit-Arquitetura-Tecnica.md) e o [Caderno Técnico](../Ecovit-Caderno-Tecnico.md) descrevem o produto vigente. Quando houver task, ela registra o recorte autorizado, os critérios e a evidência da entrega. Uma mudança posterior no mesmo comportamento também depende de pedido explícito para ganhar nova task; preserve os registros anteriores e informe a revisão na task indicada ou no relato da entrega.

Registre separadamente a situação da execução e a do aceite manual. Um critério executado com sucesso pode continuar aguardando confirmação do solicitante. Pendências remanescentes precisam de critério e estado identificáveis. Os [registros dos marcos](../arquivo/Ecovit-Plano-Implementacao.md) preservam os aceites anteriores e sua rastreabilidade.

Critérios descrevem o resultado solicitado, sem impor matriz de telas ou fluxos extensos por padrão. A escolha da conferência segue exclusivamente [Qualidade e desempenho](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração); o método só deve ser obrigatório quando explicitamente pedido ou justificado por impacto concreto.

Use `**Tipo** — Implementação` para entregas de código e `**Tipo** — Verificação` para conferências e homologações. Ao concluir, registre `**Execução** — Verificada` e `**Data de execução** — AAAA-MM-DD` antes da primeira seção da task. O histórico público inclui apenas o ID, o título e a data das implementações verificadas e datadas presentes no commit compilado. Escreva os títulos dessas tasks como informação pública.

A integração das tasks e a decisão de publicar uma versão são etapas distintas. A versão pode ser identificada por uma tag no commit escolhido, com notas das mudanças incluídas. O [workflow do aaPanel](../arquitetura/Persistencia-e-Compatibilidade.md#github-actions-e-webhook-do-aapanel) publica a partir de `main` quando o deploy está habilitado. Considere esse gatilho ao organizar integrações que devem aguardar publicação.
