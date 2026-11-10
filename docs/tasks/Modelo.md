# T-NNN — Título da alteração ou verificação

**Tipo** — Implementação / Verificação

**Execução** — Pendente / Em execução / Verificada / Bloqueada

**Data de execução** — AAAA-MM-DD ou — enquanto pendente

**Aceite manual** — Pendente / Confirmado pelo solicitante / Não aplicável

Escolha um tipo e um estado para cada campo correspondente. Use “Verificada” quando todos os critérios aplicáveis tiverem resultado satisfatório registrado e informe a data real da conclusão. Identifique abaixo qualquer critério que dependa de validação posterior. Registre “Confirmado” apenas após confirmação explícita.

## Referências e pré-condições

Indique os IDs aplicáveis (RF, CT, EX ou aceites anteriores), os links para os contratos vigentes e as dependências. Identifique o ambiente, a versão, a conta ou o arquivo de exemplo quando forem necessários para reproduzir o cenário.

## Comportamento atual e objetivo

Descreva em que fluxo o comportamento ocorre, o que se observa hoje e o resultado pretendido. Para uma task de verificação, indique o contrato já implementado que deve ser conferido.

## Escopo e limites

Liste o que deve mudar e quais comportamentos devem ser preservados. Explicite decisões de produto que afetem dados existentes, erros, histórico, permissões ou compatibilidade, quando pertinentes. Identifique decisões em aberto que impeçam a execução de algum critério.

## Critérios de aceite

Dê a cada cenário um ID estável e um resultado observável. Inclua condições de fronteira, falhas e regressões pertinentes. Escolha a forma de verificação adequada a cada cenário.

- [ ] **A01** — Dado [estado inicial e dados], quando [ação], então [resultado verificável]. Verificação por [teste automatizado, roteiro manual ou inspeção operacional].
- [ ] **A02** — Dado [condição de falha ou comportamento a preservar], quando [ação], então [efeito esperado sobre a interface ou os dados]. Verificação por [método].

## Resultado da execução

- **Contratos atualizados** — documentos e seções alterados, ou motivo para manter os contratos vigentes.
- **Verificação automatizada** — comandos, resultado real e critérios cobertos.
- **Verificação manual ou operacional** — ambiente, revisão e resultado por critério, com referência à evidência quando houver.
- **Aceite do solicitante** — pendente, confirmado com referência à confirmação ou não aplicável. Registre critérios bloqueados e o que falta para verificá-los.
