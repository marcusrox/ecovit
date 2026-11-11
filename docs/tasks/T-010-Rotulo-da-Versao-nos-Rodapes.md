# T-010 — Identificar a versão do João nos rodapés

**Tipo** — Implementação

**Execução** — Pendente

**Data de execução** — —

**Aceite manual** — Pendente

## Referências e pré-condições

- Solicitação de 11/11/2026: apresentar “Versão do João: [identificador]” nos rodapés, mantendo o identificador como link.
- [PRD — Versão e histórico de tasks](../Ecovit-PRD.md#versão-e-histórico-de-tasks).
- [Interface e iconografia — Versão e histórico de tasks](../arquitetura/Interface-e-Iconografia.md#versão-e-histórico-de-tasks).
- [T-004 — Exibir a versão e o histórico de tasks](T-004-Versao-e-Historico-de-Tasks.md), preservando os aceites anteriores.
- [Política de verificação em navegadores](../arquitetura/Qualidade-e-Desempenho.md#verificação-em-navegadores).

## Comportamento atual e objetivo

Os rodapés do login, da lista de projetos e do editor exibem somente o identificador da revisão como link para o histórico de tasks. Acrescentar o texto fixo “Versão do João: ” antes desse link nas três telas.

Exemplo visual solicitado: Versão do João: [20261011-c97e5e4](https://ecovit.idevs.com.br/#historico-de-tasks). O valor é ilustrativo; a interface continua usando a versão real da compilação.

## Escopo e limites

- Alterar somente a apresentação da versão nos três rodapés existentes. “Versão do João:” é texto fixo, seguido de um espaço e do link contendo o identificador dinâmico.
- Manter o destino do link, a abertura pública do histórico e o retorno à tela de origem com preservação do estado do editor.
- Preservar geração/formato do identificador, conteúdo e ordenação do histórico, alinhamento e demais informações dos rodapés. Não acrescentar ícone ou preferência configurável.
- Conservar foco visível, acesso por teclado e nome acessível coerente com o texto visível e o destino do link, conforme o contrato de interface.
- Atualizar os trechos pertinentes do PRD e de Interface e iconografia na implementação. Não alterar o texto da versão no conteúdo da página de histórico por efeito desta task.
- Esta entrega cria somente a especificação; implementar apenas após solicitação explícita.

## Critérios de aceite

- [ ] **A01** — No login, na lista de projetos e no editor, o rodapé mostra “Versão do João: ” seguido do mesmo identificador real da compilação, com somente o identificador como link. Verificação por teste de navegador.
- [ ] **A02** — Por clique e Enter, o link continua abrindo o histórico existente; acesso sem login e retorno ao editor preservam os comportamentos da T-004. Foco e nome acessível permanecem adequados. Verificação por teste de navegador e revisão visual.
- [ ] **A03** — Em 1366×768, 1280×720 e 900×680, a legenda completa permanece legível e não sobrepõe informações, canvas ou controles, nem causa rolagem horizontal. Verificação visual no Chrome; Edge conforme a política de compatibilidade e na homologação completa.
- [ ] **A04** — A geração da versão e os dados do histórico permanecem iguais aos da compilação correspondente; o exemplo não fica fixado no código. Verificação por inspeção e regressões pertinentes da T-004.

## Resultado da execução

- **Contratos atualizados** — Nenhum nesta etapa; somente esta task foi criada. Atualizações do PRD e de Interface e iconografia previstas para a implementação.
- **Verificação automatizada** — Não executada para esta task, restrita à documentação.
- **Verificação manual ou operacional** — Especificação revisada quanto ao recorte dos três rodapés e à preservação do contrato de versão/histórico. A01–A04 pendentes de implementação.
- **Aceite do solicitante** — Pendente; nenhuma implementação ou confirmação manual declarada.
