# T-014 — Automatizar a configuração do banco local

**Tipo** — Implementação

**Execução** — Verificada

**Data de execução** — 2026-11-10

**Aceite manual** — Confirmado pelo solicitante

## Referências e pré-condições

[Configuração e banco](../arquitetura/Persistencia-e-Compatibilidade.md#configuração-e-banco) · [Desenvolvimento e verificações isoladas](../arquitetura/Persistencia-e-Compatibilidade.md#desenvolvimento-e-verificações-isoladas) · [Configurar e abrir](../../README.md#configurar-e-abrir) · [Migração existente](../../server/db.ts) · [Modelo de ambiente](../../.env.example)

PostgreSQL 18 instalado e em execução na máquina do desenvolvedor, dependências npm instaladas e acesso administrativo local ao PostgreSQL. A automação será executada explicitamente pelo desenvolvedor com `npm run db:setup:local`.

## Comportamento atual e objetivo

O comando `db:migrate` aplica o schema, mas pressupõe que o banco e as roles já existam. O desenvolvedor precisa executar SQL administrativo, conceder permissões e configurar a conexão no `.env` manualmente. Automatizar esse preparo local com um único comando, reutilizando a migração e as permissões definidas na arquitetura.

## Escopo e limites

- Disponibilizar `npm run db:setup:local`. Solicitar os dados de conexão administrativa local, com entrada de senha oculta, e conferir que o servidor é PostgreSQL da linha 18 antes de alterar recursos.
- Criar o banco UTF8 `ecovit`, a role proprietária `ecovit_owner` e a role de execução `ecovit`, gerando senhas para as roles novas e aplicando os privilégios previstos no contrato de configuração e banco.
- Executar a migração existente com a role proprietária e aplicar as concessões à role da API. Validar a conexão e os privilégios efetivos da role de execução antes de informar sucesso.
- Criar `.env` a partir de `.env.example` quando ausente e configurar `DATABASE_URL` com a role de execução. Preservar os demais valores, comentários e configurações existentes. Conexão já configurada para outro destino exige diagnóstico do conflito antes de qualquer substituição.
- Usar credenciais administrativas e de migração somente durante a operação. Solicitar as credenciais necessárias para recursos existentes. Preservar senhas existentes, manter segredos fora dos logs e conservar apenas a conexão de execução no `.env` gerenciada pelo setup.
- Permitir reexecução e retomada após falha parcial, preservando dados e recursos compatíveis já criados. Detectar recursos homônimos incompatíveis e explicar o conflito antes de alterá-los. Evitar duplicação de configurações e registrar somente um resumo seguro das etapas concluídas e do que falta corrigir.
- Restringir o comando à instância PostgreSQL em loopback. O preparo é uma etapa explícita, independente da inicialização diária do aplicativo. Documentar no README a sequência de instalação das dependências, setup e início do desenvolvimento, incluindo as configurações de ambiente que ainda exigem preenchimento pelo desenvolvedor.

## Critérios de aceite

- [x] **A01** — Em PostgreSQL 18 local sem recursos do Ecovit, executar `npm run db:setup:local`. O banco UTF8 e as duas roles são criados, o schema é migrado e a conexão com a role da API funciona. Verificação em instância descartável isolada.
- [x] **A02** — Conferir os privilégios após o setup. A role da API pode executar as operações de dados previstas, possui acesso ao schema e permanece sem superuser, propriedade do banco/schema, CREATE e acesso à tabela de controle de migrações. A migração usa a role proprietária. Verificação SQL.
- [x] **A03** — Executar com `.env` ausente e depois com `.env` existente contendo outros valores e comentários. O arquivo resultante contém uma única configuração ativa de `DATABASE_URL`, com credencial de execução válida, preserva os outros campos e fica sem credenciais administrativas ou de migração gravadas pelo setup. Verificação de arquivo sem divulgar segredos.
- [x] **A04** — Reexecutar após uma configuração bem-sucedida e após interrupção entre criação dos recursos e migração. O comando preserva dados, senhas e configurações válidas e conclui as etapas restantes com os acessos necessários. Verificação em ambiente descartável.
- [x] **A05** — Simular banco indisponível, autenticação recusada, versão incompatível, destino fora de loopback, recurso homônimo incompatível e `.env` apontando para outro destino. O comando encerra com erro e orientação acionável, sem anunciar sucesso, substituir configurações em conflito ou divulgar credenciais. Verificação operacional isolada.
- [x] **A06** — Seguir o roteiro atualizado do README desde a instalação das dependências até o setup. O desenvolvedor identifica como executar o comando, fornecer as credenciais localmente, completar o ambiente e iniciar o aplicativo. Verificação documental e operacional.

## Resultado da execução

- **Contratos atualizados** — Configuração e banco na arquitetura de persistência e roteiro de instalação local no README. O comando exige administrador superuser local. A sessão de migração assume `ecovit_owner`, permitindo retomar o setup sem gravar ou trocar a senha proprietária.
- **Verificação automatizada do Codex** — 15 cenários em `tests/setup-local.test.ts` passaram contra PostgreSQL 18 descartável na porta 55437. Cobriram criação, propriedade das tabelas, DML e recusa de CREATE/acesso às migrações pela API, arquivo novo/existente, senhas com caracteres especiais, preservação de dados e hashes das senhas, retomada, conflitos, autenticação, conexão recusada e concorrência (A01–A05). O limite de versão incompatível foi simulado sobre a conexão real. A suíte exige `ECOVIT_SETUP_TEST_ADMIN_URL`, porta distinta de 5432 e cluster marcado com `cluster_name=ecovit_setup_tests`; ela recria os recursos fixos exclusivamente nesse ambiente e fica desabilitada sem a variável.
- **Fluxo interativo do Codex** — `npm run db:setup:local` concluiu em uma cópia isolada com `.env` ausente, criando banco, roles, migração e permissões. A senha administrativa ficou oculta no terminal e o comando indicou os campos restantes de ambiente. Execução sem terminal interativo foi recusada com orientação (A01, A03, A06).
- **Verificações gerais** — Tipos, lint, build e `git diff --check` passaram. O build emitiu avisos de anotações de uma dependência e tamanho do bundle. A suíte geral de domínio e os fluxos de navegador ficaram fora desta validação de provisionamento.
- **Aceite do solicitante** — pendente. A execução no PostgreSQL pessoal do desenvolvedor fica a seu cargo, com a credencial administrativa informada localmente.

## Preservação após atualização do repositório — 2026-11-11

Esta task era identificada como T-007 no trabalho local e foi renumerada para evitar colisão com a T-007 recebida do remoto. As antigas T-008 e T-009 do setup passaram a T-015 e T-016. Os resultados acima registram a execução anterior; não representam uma nova execução após o pull.

Foram preservados o setup, sua interface de terminal, seus testes e os contratos correspondentes, com restauração do comando npm. As alterações locais de inicialização diária, sincronização dos testes de navegador, fixture da API e política de aceite foram descartadas a pedido do solicitante.

Conferência após a preservação: typecheck, lint e revisão do diff passaram. A suíte PostgreSQL do setup não foi reexecutada: ECOVIT_SETUP_TEST_ADMIN_URL não está definida nesta sessão. O banco do aplicativo não foi alterado.

Revisão de consistência após o pull: implementação e testes do setup conferidos por hash contra o stash original, sem diferenças. Migração, schema, configuração, modelo de ambiente e lockfile não mudaram no pull. Build de produção (incluindo tipos) aprovado; tipos e lint da preservação anterior continuam aplicáveis, sem mudanças de código posteriores. O comando npm foi executado sem TTY e recusou corretamente a entrada não interativa com código 1. PostgreSQL isolado em 55437 sem resposta; testes de banco não foram repetidos. Não foram encontradas incompatibilidades na integração revisada.

## Confirmação de aceite — 2026-11-13

Aceite manual confirmado explicitamente pelo solicitante em 2026-11-13, ao solicitar o registro de todos os aceites pendentes. Os registros anteriores preservam a situação de cada etapa; esta confirmação encerra a pendência de aceite desta task, sem alterar as evidências de execução ou representar nova execução de testes.
