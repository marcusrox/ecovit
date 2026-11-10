# T-003 — Conferir a listagem e a entrada direta local

**Execução** — Verificada

**Aceite manual** — Pendente

## Referências e pré-condições

Origem no [registro de pendências do M12](../arquivo/marcos/M12-Contas-e-Persistencia-Remota.md#pendências-vigentes), com referências M12-A16 e M12-A17. Contratos em [Lista de projetos e incompatibilidade](../arquitetura/Interface-e-Iconografia.md#lista-de-projetos-e-incompatibilidade) e [Entrada direta em desenvolvimento](../arquitetura/Autenticacao-e-Acesso.md#entrada-direta-em-desenvolvimento). Para a listagem, o Codex usa `dev:test` na porta 5174, com banco, conta e sessão isolados. O solicitante confere a entrada direta em uma instância de desenvolvimento em loopback com conta descartável, conforme o [README](../../README.md). O servidor `dev:test` executa em modo de teste, no qual a rota de entrada direta fica ausente.

## Critérios de aceite

- [x] **A01** — Em Chrome e Edge, nas resoluções 1366×768, 1280×720 e 900×680, abrir a lista com projetos de teste e provocar estados de carregamento e erro. Conferir que conta, cotas, estados e ações de recuperação estão legíveis e acessíveis por teclado, sem rolagem horizontal ou dependência exclusiva de cor. Conferir cartão, data/hora e faixa de status conforme o contrato.
- [x] **A02** — Com `DEV_LOGIN_EMAIL` configurado em desenvolvimento local e uma sessão nova, abrir a aplicação. A lista abre na conta configurada sem pedir código. Ao sair, o formulário volta e permanece até nova abertura ou recarga.
- [x] **A03** — Remover `DEV_LOGIN_EMAIL`, reiniciar a instância de desenvolvimento e abrir a aplicação com a sessão direta anterior. A sessão direta deixa de dar acesso à lista e a aplicação volta a pedir código.

## Resultado da execução

Execução bem-sucedida informada pelo solicitante para o conjunto dos critérios. O relato foi global, sem evidências individuais por critério.

O aceite específico de data/hora e da faixa de status já está registrado no [M12](../arquivo/marcos/M12-Contas-e-Persistencia-Remota.md#aceite-e-verificações).
