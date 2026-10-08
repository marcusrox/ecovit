# M5 — Liberação

Marco **M5 — Liberação** do [PRD 1.1](../PRD.md), seções 11–13. Status em 07/10/2026: planejado; não há comprovação registrada de publicação, restauração ou teste de usuários.

## Objetivo e dependências

Publicar a aplicação estática, configurar Supabase de produção, comprovar backup/restauração e validar o fluxo com usuários. Depende dos critérios de [M0](M0-base.md), [M1](M1-nucleo.md), [M2](M2-editor.md), [M3](M3-inspecao.md) e [M4](M4-persistencia.md).

## Entregas

- Cloudflare Pages publicando build aprovado da branch principal, diretório `dist`, HTTPS e fallback SPA.
- Supabase de produção separado da homologação; previews usam somente homologação.
- Auth, SMTP, templates e URLs de confirmação/recuperação para os domínios corretos.
- Backup gerenciado diário, retenção mínima de 7 dias e ensaio de restauração documentado.
- Procedimentos de publicação, rollback estático, recuperação, migração e privacidade.
- Projeto residencial de referência e teste do fluxo principal com três usuários.
- README e documentação operacional atualizados com limitações e resultados comprovados.

## Critérios de aceite

- [ ] Todos os RF e testes obrigatórios do PRD passam; CI hospedado verde.
- [ ] Instalação/desenvolvimento com npm, sem Docker ou servidor próprio; build estático publicado.
- [ ] Abertura direta de rota do editor e retornos de confirmação/recuperação funcionam no domínio publicado.
- [ ] Login, criação e reabertura em outro navegador comprovados com serviço real.
- [ ] RLS/RPCs impedem acesso entre usuários mesmo fora da interface; bundle sem credenciais administrativas.
- [ ] Catálogo de encontros versionado/revisado e sem anúncio de suporte a padrões não validados.
- [ ] Projeto residencial salva/reabre sem alteração semântica; contagens conferidas por fixtures/revisão independente.
- [ ] Resultados parciais identificados em todas as saídas e exportações.
- [ ] Worker descarta respostas antigas; benchmark demonstra metas do PRD com equipamento e versões registrados.
- [ ] Rede falha e conflitos entre abas não causam perda silenciosa; recuperação e exportações demonstradas.
- [ ] Plano contratado atende ao backup diário/7 dias; restauração prova metas de RPO 24 h e RTO 8 h antes de liberar dados reais.
- [ ] Exclusão lógica, purga após 30 dias e expiração de backups documentadas e verificadas.
- [ ] Três usuários concluem o fluxo central, com bloqueios corrigidos.
- [ ] README cobre setup, variáveis, migrações, testes, publicação, recuperação e limitações.

## Verificação e evidências

Registrar ambiente, versão/build, data e resultado para publicação, Auth, segurança, benchmark, exportações e restauração. A existência de workflow, política RLS, plano de backup ou botão de recuperação não comprova sua execução.

Executar o fluxo completo: login → criar → desenhar → inserir vãos → revisar → salvar → reabrir em outro contexto de navegador → exportar. Validar Chrome/Edge desktop conforme versões e resolução mínima do PRD, com controles DOM e foco por teclado.

## Limites da liberação

Não incluir 3D, múltiplos pavimentos, colaboração, orçamento ou cálculo estrutural. O produto fornece estudo geométrico e estimativa; revisão técnica construtiva permanece distinta dos testes de software. Evoluções posteriores exigem especificação própria e, quando necessário, revisão do PRD/ADR.
