# T-NNN — Título da alteração ou verificação

Usar este modelo somente quando o solicitante pedir explicitamente a criação de uma nova task. Trabalho sem task pode ser executado e relatado diretamente, conforme o [guia](README.md).

**Tipo** — Implementação / Verificação

**Execução** — Pendente / Em execução / Verificada / Bloqueada

**Data de execução** — AAAA-MM-DD ou — enquanto pendente

**Aceite manual** — Pendente / Confirmado pelo solicitante / Não aplicável

## Alteração e limites

Descrever o resultado desejado e o que deve ser preservado. Referenciar somente requisitos/contratos pertinentes. Para correção pequena, bastam poucas linhas; acrescentar pré-condições, dependências e casos de fronteira apenas quando relevantes. Não duplicar regras de outros documentos.

## Critérios de aceite

- [ ] **A01** — Resultado observável solicitado.
- [ ] **A02** — Acrescentar somente se houver outro comportamento independente a conferir.

Critérios descrevem resultados. Escolher a verificação mínima conforme [Qualidade e desempenho](../arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração); não prescrever navegador, matriz de resoluções ou suíte completa por hábito. Exigência mais ampla precisa de solicitação explícita ou impacto concreto identificado. Para contratos sensíveis, incluir integridade, falhas e regressões pertinentes.

## Resultado

Registrar brevemente o resultado por critério e a conferência realmente realizada. Se houver comandos, informar resultado e logs; distinguir evidência anterior de execução nova. Justificar ampliação de testes em uma frase. Não é necessário preencher categorias vazias para uma correção trivial.

Se houver impedimento, identificar critério pendente e causa, respeitando o limite de diagnóstico ambiental. Marcar Verificada e datar somente com resultados satisfatórios nos critérios aplicáveis. Aceite manual confirmado exige manifestação explícita; nunca inferi-lo da autorização de implementação, commit ou push.
