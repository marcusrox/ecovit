# Tasks do Ecovit

Cada task especifica uma alteração ou verificação independente. Copie o [modelo](Modelo.md) para `T-NNN-descricao-curta.md`, usando um ID livre. Referencie os requisitos e contratos afetados. Implemente a task quando o solicitante pedir sua execução.

O [PRD](../Ecovit-PRD.md), a [Arquitetura](../Ecovit-Arquitetura-Tecnica.md) e o [Caderno Técnico](../Ecovit-Caderno-Tecnico.md) descrevem o produto vigente. A task registra o recorte autorizado, os critérios e a evidência da entrega. Se uma mudança posterior alterar o mesmo comportamento, ela tem sua própria task.

Registre separadamente a situação da execução e a do aceite manual. Um critério executado com sucesso pode continuar aguardando confirmação do solicitante. Pendências remanescentes precisam de critério e estado identificáveis. Os [registros dos marcos](../arquivo/Ecovit-Plano-Implementacao.md) preservam os aceites anteriores e sua rastreabilidade.

Use `**Tipo** — Implementação` para entregas de código e `**Tipo** — Verificação` para conferências e homologações. Ao concluir, registre `**Execução** — Verificada` e `**Data de execução** — AAAA-MM-DD` antes da primeira seção da task. O histórico público inclui apenas o ID, o título e a data das implementações verificadas e datadas presentes no commit compilado. Escreva os títulos dessas tasks como informação pública.

A integração das tasks e a decisão de publicar uma versão são etapas distintas. A versão pode ser identificada por uma tag no commit escolhido, com notas das mudanças incluídas. O [workflow do aaPanel](../arquitetura/Persistencia-e-Compatibilidade.md#github-actions-e-webhook-do-aapanel) publica a partir de `main` quando o deploy está habilitado. Considere esse gatilho ao organizar integrações que devem aguardar publicação.
