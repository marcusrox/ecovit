# T-010 — Identificar a versão nos rodapés

**Tipo** — Implementação

**Execução** — Verificada

**Data de execução** — 2026-11-11

**Aceite manual** — Pendente

## Referências e pré-condições

- Solicitação de 11/11/2026: apresentar “Versão: [identificador]” nos rodapés, mantendo o identificador como link.
- [PRD — Versão e histórico de tasks](../Ecovit-PRD.md#versão-e-histórico-de-tasks).
- [Interface e iconografia — Versão e histórico de tasks](../arquitetura/Interface-e-Iconografia.md#versão-e-histórico-de-tasks).
- [T-004 — Exibir a versão e o histórico de tasks](T-004-Versao-e-Historico-de-Tasks.md), preservando os aceites anteriores.
- [Política de verificação em navegadores](../arquitetura/Qualidade-e-Desempenho.md#verificação-em-navegadores).

## Comportamento atual e objetivo

Os rodapés do login, da lista de projetos e do editor já exibem uma legenda antes do identificador da revisão como link para o histórico de tasks. Conforme a revisão solicitada da task, ajustar essa legenda para o texto fixo “Versão: ” nas três telas.

Exemplo visual solicitado: Versão: [20261011-c97e5e4](https://ecovit.idevs.com.br/#historico-de-tasks). O valor é ilustrativo; a interface continua usando a versão real da compilação.

## Escopo e limites

- Alterar somente a apresentação da versão nos três rodapés existentes. “Versão:” é texto fixo, seguido de um espaço e do link contendo o identificador dinâmico.
- Manter o destino do link, a abertura pública do histórico e o retorno à tela de origem com preservação do estado do editor.
- Preservar geração/formato do identificador, conteúdo e ordenação do histórico, alinhamento e demais informações dos rodapés. Não acrescentar ícone ou preferência configurável.
- Conservar foco visível, acesso por teclado e nome acessível coerente com o texto visível e o destino do link, conforme o contrato de interface.
- Atualizar os trechos pertinentes do PRD e de Interface e iconografia na implementação. Não alterar o texto da versão no conteúdo da página de histórico por efeito desta task.
- Implementação autorizada pelo solicitante em 11/11/2026; aceite manual permanece pendente.

## Critérios de aceite

- [x] **A01** — No login, na lista de projetos e no editor, o rodapé mostra “Versão: ” seguido do mesmo identificador real da compilação, com somente o identificador como link. Verificação por teste de navegador.
- [x] **A02** — Por clique e Enter, o link continua abrindo o histórico existente; acesso sem login e retorno ao editor preservam os comportamentos da T-004. Foco e nome acessível permanecem adequados. Verificação por teste de navegador e revisão visual.
- [x] **A03** — Em 1366×768, 1280×720 e 900×680, a legenda completa permanece legível e não sobrepõe informações, canvas ou controles, nem causa rolagem horizontal. Verificação visual no Chrome; Edge conforme a política de compatibilidade e na homologação completa.
- [x] **A04** — A geração da versão e os dados do histórico permanecem iguais aos da compilação correspondente; o exemplo não fica fixado no código. Verificação por inspeção e regressões pertinentes da T-004.

## Resultado da execução

- **Contratos atualizados** — PRD e Interface e iconografia, nas seções Versão e histórico de tasks. Apresentação compartilhada em VersionLink; nenhuma mudança na geração da versão ou no conteúdo do histórico.
- **A01** — Verificado no login, lista de projetos e editor: texto fixo Versão: seguido do identificador real da revisão compilada, com somente o identificador como link. Destino #historico-de-tasks preservado.
- **A02** — Verificado por navegador: abertura por Enter nos três rodapés, abertura por clique, foco visível e retorno ao acionador, acesso direto sem autenticação e retorno ao editor com candidato ainda em memória após falha de salvamento. Nome acessível da versão e do destino preservado.
- **A03** — Verificado no Chrome em 1366×768, 1280×720 e 900×680 nas três telas: legenda inteira dentro da janela, rodapé sem sobreposição entre elementos e sem rolagem horizontal. Nove capturas revisadas; após reservar 6 px entre legenda e link para acomodar o contorno de foco, o mesmo cenário foi revalidado integralmente e as três telas foram reinspecionadas em 900×680. Capturas finais em .tools/t010/{login,lista,editor}-chrome-{1366,1280,900}.png. Edge reservado à homologação completa conforme a política; alteração restrita a texto e apresentação com recursos já usados.
- **A04** — Verificado por inspeção e regressão: identificador dinâmico e fonte de metadados mantidos. tests/release-info.test.ts aprovado (um teste, 2,54 s), cobrindo estabilidade da revisão, filtragem e ordenação do histórico. O cenário de navegador também compara versão e lista com os metadados da compilação.
- **Verificação automatizada** — Build de produção, incluindo typecheck, e lint aprovados. test:e2e:interface com tests/e2e/release-history.spec.ts aprovado no Chrome/5174: um cenário cobrindo três telas e três resoluções, em 23,5 s na execução final. A execução inicial também passou em 22,8 s; é repetição do mesmo cenário, não cobertura adicional. Logs completos ignorados pelo Git em .tools/t010-*.log. Não foram executadas a suíte completa de navegador ou regressões de carga/domínio sem relação com a alteração.
- **Verificação visual ou operacional** — Capturas e contorno de foco conferidos pelo Codex; servidor isolado e banco de testes preparado pelo comando test:env. Porta 5173 preservada.
- **Aceite do solicitante** — Pendente; a verificação técnica não constitui confirmação manual. Commit e push autorizados pelo solicitante em 11/11/2026; essa autorização não constitui aceite manual da interface.

## Revalidação após alteração da task em 11/11/2026

- Prefixo vigente ajustado para Versão: no componente compartilhado, no teste e nos contratos de PRD/Interface e iconografia. Versão dinâmica, link, espaçamento e histórico preservados.
- **A01–A04** — O cenário existente de release-history.spec.ts passou no Chrome contra o build de produção, com a mesma API e banco isolados e servidor próprio na porta 5174. Conferiu os três rodapés em 1366×768, 1280×720 e 900×680, texto, limite da janela, ausência de sobreposição/rolagem horizontal, clique/Enter, foco, histórico público e retorno ao editor com alteração em memória. Um cenário aprovado em 11,5 s; não representa cobertura adicional ao cenário da primeira entrega.
- **Verificação automatizada desta revisão** — Build, incluindo typecheck, e lint aprovados. As duas tentativas com o servidor Vite de desenvolvimento expiraram na navegação inicial, antes das asserções dos rodapés; o diagnóstico identificou requisições de módulos pendentes. A execução aprovada usou configuração temporária .tools/t010-preview.config.ts, ignorada pelo Git, servindo o aplicativo compilado e reutilizando a preparação da API de teste. Nenhuma asserção ou limite de tempo foi alterado; nenhum arquivo de infraestrutura permanente foi modificado. Logs em .tools/t010-revisao-*.log e diagnóstico em .tools/t010-diagnostic*.log. Não houve nova execução da suíte completa nem dos testes de metadados, cujo código permaneceu inalterado.
- **Verificação visual desta revisão** — Nove capturas finais em .tools/t010-revisao/{login,lista,editor}-chrome-{1366,1280,900}.png; as três telas foram inspecionadas visualmente em 900×680, além das verificações automatizadas nas três resoluções. Rótulo completo e foco legíveis. Porta 5173 preservada.
- **Aceite do solicitante** — Pendente. Os registros acima da primeira entrega permanecem como evidência anterior; esta seção registra a validação do rótulo vigente. Sem commit ou push desta revisão.
