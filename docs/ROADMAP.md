# Roadmap do Ecovit

Referência: [PRD 1.1](PRD.md), seção 13. Atualização: 07/10/2026.

## Como ler esta documentação

`docs/PRD.md` é o documento oficial, com o conteúdo integral da versão 1.1. A cópia duplicada da raiz foi removida após o commit `69c7c8f`, que preserva ambos os arquivos no histórico do Git. Requisitos e critérios de aceite vêm do PRD; esta organização não os substitui. Revisões futuras devem declarar a nova versão e registrar as decisões afetadas, mantendo as versões anteriores no histórico.

Cada arquivo em `milestones/` corresponde diretamente a um dos seis marcos M0–M5 do PRD, com a mesma numeração, nome, entregáveis e critérios de aceite. Paredes, tijolos, aberturas e quantitativos são assuntos dentro dos marcos, não marcos adicionais.

## Marcos de entrega oficiais

| Marco do PRD | Resultado esperado | Dependência | Situação registrada |
| --- | --- | --- | --- |
| [M0 — Base](milestones/M0-base.md) | SPA, schemas, CI, autenticação e criação/leitura na nuvem | Configuração Supabase de homologação | Base implementada; aceite de nuvem ainda sem evidência registrada |
| [M1 — Núcleo](milestones/M1-nucleo.md) | Canvas mínimo, geometria, worker, trechos, encontros, vãos e benchmark | Base M0; catálogo de encontros com revisão profissional | Planejado |
| [M2 — Editor](milestones/M2-editor.md) | Ferramentas, snaps, propriedades, comandos, cotas, histórico e rascunho | Núcleo M1 validado | Planejado |
| [M3 — Inspeção](milestones/M3-inspecao.md) | Fiadas, elevações, contagens, perdas, importação/exportação | Documento editável e saídas consistentes | Planejado |
| [M4 — Persistência](milestones/M4-persistencia.md) | RPCs completas, autosave, recuperação, revisão e conflitos | Conta/nuvem M0 e comandos/rascunhos do editor | Planejado |
| [M5 — Liberação](milestones/M5-liberacao.md) | Produção, publicação, backup/restauração e testes com usuários | Critérios anteriores comprovados | Planejado |

Conta e armazenamento remoto básico começam em M0. A configuração externa pendente não impede trabalho independente no motor. M1 precede o acabamento do editor; não liberar suporte a encontros antes da aprovação do catálogo.

## Distribuição dos assuntos

| Assunto | Desenvolvimento | Aceite relacionado |
| --- | --- | --- |
| Conta e projetos | Base M0; persistência completa M4 | RF01/RF14 |
| Canvas e interação | Canvas/worker M1; ferramentas M2; vistas M3 | RF04–RF06, RF08–RF12 |
| Paredes e tijolos | Geometria/paginação M1; desenho/configuração M2 | RF02–RF06, RF12 |
| Aberturas | Regras geométricas M1; ferramentas M2 | RF07 e vínculos com RF04/RF10/RF11/RF12 |
| Quantitativos e exportações | Agregação básica M1; inspeção/exportação M3 | RF08/RF09/RF13/RF15/RF16 |
| Produção e operação | Liberação M5 | Critérios completos de pronto do MVP |

## Pendências de M0

- Registrar aplicação das migrações e configuração Auth/SMTP em homologação.
- Comprovar cadastro, confirmação, login, recuperação e reabertura em outro navegador.
- Executar `npm run test:cloud` com duas contas distintas e registrar o resultado.
- Verificar a execução hospedada do CI; a existência do workflow não comprova que o GitHub Actions passou.

Há evidências de lint, tipos, build, 28 testes unitários e 8 E2E com rede simulada. Consulte [verificação inicial](verification/M0-verificacao.md) e [instruções operacionais](../README.md). Reconhecer as variáveis de ambiente no navegador não comprova integração real.

## M4 — Persistência

Entregar `save_project` e `delete_project`, renomeação por salvamento do documento, exclusão lógica, paginação da lista, revisão otimista, idempotência e retenção das últimas 20 revisões. Implementar rascunhos por usuário, autosave, recuperação, tratamento de quota e conflitos sem sobrescrita silenciosa.

Aceite: RF01/RF14, testes diretos de RLS/RPC, falhas de rede e respostas perdidas, sessão expirada, duas abas em conflito e reabertura em outro navegador. Versionar a purga após 30 dias e comprovar seu funcionamento antes da liberação.

Entregáveis e checklist no [documento M4](milestones/M4-persistencia.md).

## M5 — Liberação

Publicar build aprovado no Cloudflare Pages, com fallback SPA e HTTPS. Usar Supabase de produção separado da homologação, URLs de Auth corretas, backup diário com retenção mínima de 7 dias e restauração comprovada. Verificar RPO de 24 h e RTO de 8 h no ambiente contratado.

Aceite: todos os RF e testes previstos, catálogo construtivo revisado, benchmark documentado, projeto residencial de referência sem perda semântica e três usuários concluindo o fluxo principal. Testes de software não substituem revisão técnica construtiva.

Entregáveis e checklist no [documento M5](milestones/M5-liberacao.md).

## Decisões e evolução

- [ADR-001 — Stack tecnológica](adr/ADR-001-stack-tecnologica.md)
- [ADR-002 — Modelo de dados](adr/ADR-002-modelo-de-dados.md)
- [ADR-003 — Renderização 2D](adr/ADR-003-renderizacao-2d.md)
- [Visão da arquitetura](architecture/overview.md)
- [Histórico de alterações](CHANGELOG.md)

A alternativa de API própria com SQLite e eventual MySQL foi discutida, mas não adotada. A arquitetura vigente continua a do PRD 1.1. Não há prazo atribuído aos marcos; eles expressam dependências e critérios de aceite.
