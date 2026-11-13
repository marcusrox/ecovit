# T-015 — Tornar visíveis as perguntas do setup local

**Tipo** — Implementação

**Execução** — Verificada

**Data de execução** — 2026-11-10

**Aceite manual** — Confirmado pelo solicitante

## Referências e pré-condições

[T-014](T-014-Configuracao-do-Banco-Local.md) · [Configuração e banco](../arquitetura/Persistencia-e-Compatibilidade.md#configuração-e-banco) · [Configurar e abrir](../../README.md#configurar-e-abrir)

## Comportamento atual e objetivo

O solicitante relatou perguntas invisíveis ao executar `npm run db:setup:local` no PowerShell. O texto era escrito diretamente no terminal e a pergunta era registrada no readline com uma string vazia, permitindo que a atualização do terminal apagasse o enunciado. Registrar o texto no próprio readline e explicar o uso dos valores padrão e da senha oculta.

## Escopo e limites

Exibir as perguntas de endereço, porta e usuário com seus valores padrão. Informar que Enter aceita o valor entre colchetes e indicar a entrada oculta no pedido da senha administrativa. A senha continua oculta durante digitação e edição.

## Critérios de aceite

- [x] **A01** — Em terminal PowerShell, as três perguntas e seus valores padrão ficam visíveis, inclusive após digitação, edição e Enter. O texto inicial explica a aceitação dos valores padrão.
- [x] **A02** — O pedido de senha fica visível, a senha permanece oculta durante digitação e edição e Ctrl+C permite encerrar a operação.
- [x] **A03** — A invocação via `npm run db:setup:local` encaminha os valores digitados e os padrões aceitos ao setup. Verificação por terminal isolado com o provisionamento interceptado.

## Resultado da execução

- **Contratos atualizados** — README e Configuração e banco na arquitetura de persistência.
- **Verificação do Codex** — Três cenários por `npm run db:setup:local` em terminal PowerShell isolado, interceptando o provisionamento: valores padrão por Enter, valores personalizados com edição e cancelamento durante a senha. Os enunciados ficaram visíveis, os valores recebidos foram conferidos por asserções, os caracteres da senha ficaram ocultos inclusive durante edição e Ctrl+C encerrou a operação (A01–A03).
- **Verificações gerais** — Tipos, lint do inicializador e `git diff --check` passaram. A validação do terminal dispensou a execução das operações SQL.
- **Aceite do solicitante** — pendente.

## Confirmação de aceite — 2026-11-13

Aceite manual confirmado explicitamente pelo solicitante em 2026-11-13, ao solicitar o registro de todos os aceites pendentes. Os registros anteriores preservam a situação de cada etapa; esta confirmação encerra a pendência de aceite desta task, sem alterar as evidências de execução ou representar nova execução de testes.
