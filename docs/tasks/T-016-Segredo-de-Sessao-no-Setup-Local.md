# T-016 — Gerar o segredo de sessão no setup local

**Tipo** — Implementação

**Execução** — Verificada

**Data de execução** — 2026-11-10

**Aceite manual** — Pendente

## Referências e pré-condições

[T-014](T-014-Configuracao-do-Banco-Local.md) · [Configuração e banco](../arquitetura/Persistencia-e-Compatibilidade.md#configuração-e-banco) · [Configurar e abrir](../../README.md#configurar-e-abrir)

## Comportamento atual e objetivo

O setup local configura a conexão do banco e orienta o desenvolvedor a preencher `SESSION_SECRET` manualmente. Gerar esse segredo automaticamente quando estiver vazio e preservar o valor já configurado.

## Escopo e limites

Em `npm run db:setup:local`, gerar 32 bytes criptograficamente aleatórios em base64url quando `SESSION_SECRET` estiver ausente, vazio ou contiver somente espaços, inclusive entre aspas. Gravar o valor na mesma atualização atômica do `.env`, preservando comentários e as outras configurações. Manter o segredo fora dos logs. Remover a orientação final para geração manual. Definições duplicadas devem gerar diagnóstico antes de alterar recursos.

## Critérios de aceite

- [x] **A01** — Com `.env` novo, `SESSION_SECRET` recebe 32 bytes aleatórios codificados em base64url e permanece fora da saída do setup.
- [x] **A02** — Com a variável ausente, vazia ou contendo somente espaços, inclusive entre aspas, o setup preenche uma única definição e preserva comentários e demais configurações.
- [x] **A03** — Com um segredo preenchido ou ao repetir o setup após geração, o valor existente e sua representação no arquivo são preservados.
- [x] **A04** — A mensagem final e o README orientam apenas o preenchimento dos campos restantes. Tipos, lint e regressões pertinentes do setup passam.

## Resultado da execução

- **Contratos atualizados** — README, mensagem final do comando e Configuração e banco na arquitetura de persistência.
- **Verificação do Codex** — `tests/setup-local.test.ts` aprovou 24 cenários em PostgreSQL 18 descartável na porta 55437. A cobertura inclui variável ausente, valor vazio, aspas vazias, espaços simples e entre aspas, espaços em múltiplas linhas, preservação de segredo configurado e repetição após geração, além das regressões de provisionamento e integridade do arquivo (A01–A04). Os testes verificaram comprimento, decodificação dos 32 bytes e ausência do segredo nos relatórios do setup.
- **Verificações gerais** — Tipos, lint dos arquivos afetados e `git diff --check` passaram. A mensagem final foi revisada para orientar apenas as configurações de e-mail restantes.
- **Aceite do solicitante** — pendente.
