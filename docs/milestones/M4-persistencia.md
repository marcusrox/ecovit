# M4 — Persistência

Marco **M4 — Persistência** do [PRD 1.1](../PRD.md), seções 8, 10–13. Status em 07/10/2026: planejado; M0 oferece somente a base de conta, criação, lista e leitura, com integração real ainda sem evidência registrada.

## Objetivo e dependências

Concluir **RF01/RF14** com lista, RPCs completas, autosave, recuperação, revisão e conflitos. Parte da conta/nuvem de [M0](M0-base.md) e dos comandos/rascunhos de [M2](M2-editor.md); a reabertura deve preservar o modelo consumido por [M3](M3-inspecao.md).

## Entregas

- Criar/listar/renomear/excluir projetos próprios, com confirmação de exclusão e lista paginada de metadados.
- `save_project` transacional com revisão-base, idempotencyKey, documento e engineVersion; renomeação altera document.name.
- `delete_project` com exclusão lógica idempotente; purga após 30 dias por tarefa versionada no banco.
- Documento atual e últimas 20 revisões; histórico remoto de interface permanece fora do MVP.
- Rascunhos IndexedDB/Dexie por usuário, autosave remoto, retry, recuperação e resolução explícita de conflitos.
- Migrações evolutivas sem reescrever as já aplicadas, validação SQL/Zod e testes diretos de RLS/RPC.

## Critérios de aceite

- [ ] RF01/RF14 demonstrados; reabertura em outro navegador preserva semântica e IDs.
- [ ] Rascunho local até 500 ms após comando confirmado; sucesso somente após confirmação da camada.
- [ ] Salvamento remoto após 2 s sem edição e no máximo a cada 10 s de edição contínua; uma requisição em voo por projeto.
- [ ] Retry em 2/5/15/30 s, limitado a 30 s; rascunho mantido até confirmação remota.
- [ ] Mesma chave/conteúdo retorna resultado anterior; chave reutilizada com outro conteúdo gera conflito.
- [ ] Idempotência verificada antes da revisão-base; revisão descartada pela retenção gera conflito sem reaplicar a escrita.
- [ ] Revisão divergente retorna `REVISION_CONFLICT` e pausa sincronização, sem sobrescrita ou merge automático.
- [ ] Escolher remoto ou salvar rascunho como novo projeto preserva cópia recuperável antes de substituir o local.
- [ ] Rascunho mais recente oferece recuperação com datas/origem; falha de quota não simula sucesso.
- [ ] Sessão expirada preserva rascunho e pede login; logout limpa tokens/memória, restringe rascunhos ao mesmo usuário e oferece removê-los.
- [ ] Estados distinguem salvo neste dispositivo, sincronizando, salvo na nuvem, sem conexão, conflito e erro.
- [ ] Documento, metadados, contador e revisão são gravados na mesma transação.
- [ ] Leitura privada em projetos/revisões e escrita direta negada; RPCs validam identidade, propriedade, tamanho, schema, tipos, referências e limites.
- [ ] Exclusão some imediatamente da lista; retenção de revisões e purga agendada são verificadas.

## Verificação

Testar rede falha, resposta perdida/retry, reload antes de autosave, quota, sessão expirada e duas abas em conflito. Pela Data API/RPC, verificar que A não lê/altera/exclui B, inclusive revisões; anon não acessa; tokens inválidos/expirados e payloads inválidos são recusados.

Executar as mesmas fixtures aceitas/rejeitadas no Zod e SQL. O script M0 `test:cloud` é uma base a ampliar; ainda não cobre as RPCs e falhas futuras de M4. Testes com mocks não substituem homologação real.

## Limites e continuidade

Login/carga inicial exigem internet; uma aba já carregada pode editar offline. PWA e reabertura totalmente offline ficam fora do MVP. Publicação, backup e restauração em produção são critérios de [M5 — Liberação](M5-liberacao.md).
