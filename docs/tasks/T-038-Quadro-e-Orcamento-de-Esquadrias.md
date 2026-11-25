# T-038 — Consultar e orçar esquadrias presentes no projeto

**Tipo** — Implementação

**Resumo** — Reúne portas e janelas presentes no projeto em um quadro com quantidades e dimensões, permite informar preços das opções utilizadas e inclui seus custos no orçamento e no relatório PDF.

**Execução** — Pendente

**Data de execução** — —

**Aceite manual** — Pendente

## Alteração e limites

Acrescentar ao Orçamento um quadro de portas e janelas efetivamente inseridas no projeto, com identificação da opção, dimensões de referência, quantidade, preço unitário e custo. Incluir subtotal de esquadrias no resumo e no total geral junto de tijolos, ferragens e assentamento. Integrar o mesmo quadro, preços e custos ao [relatório PDF da T-036](T-036-Relatorio-de-Orcamento-em-PDF.md).

Não listar opções do catálogo sem ocorrências no projeto e não exigir preço para opções ausentes. Vãos livres não representam esquadrias e ficam fora do quadro. Portas/janelas sem aparência configurada devem permanecer identificáveis como opção genérica legada, sem inferir modelo comercial ou descartar a ocorrência.

### Agrupamento proposto para revisão

Propor uma linha por combinação de porta/janela, tipo de aparência e largura/altura registradas, agregando ocorrências iguais nos pavimentos. Orientação, face, posição e peitoril não separam o preço da mesma opção. Assim, modelos ou dimensões diferentes podem ter preços diferentes. Confirmar esta definição de “opção” com o solicitante antes de implementar agrupamento e persistência; o pedido exige preço por opção inserida, mas não define a chave de agrupamento.

As dimensões disponíveis hoje são do vão bruto de alvenaria: identificá-las como referência, sem apresentá-las como medida de fabricação ou compra da esquadria. Esta task não cria dimensões próprias de esquadria, folgas, fabricante, material ou instalação; esses campos exigem especificação posterior.

### Preços, cálculo e estado

O usuário informa preço unitário em reais para cada opção utilizada. O preço vale no projeto e o custo é quantidade de ocorrências × preço unitário, sem aplicar perdas de tijolos ou acréscimos de ferragens. Aceitar valor não negativo com até duas casas decimais, vírgula ou ponto, usando centavos inteiros e conferência de representabilidade conforme o orçamento existente. Permitir limpar preço; ausência difere de zero explícito. Entrada inválida mantém erro e não é corrigida silenciosamente.

Opção presente sem preço mantém quantidade visível e custo/subtotal/total dependentes incompletos. Projeto sem portas ou janelas tem subtotal zero e nenhuma linha de catálogo. Exemplo: três ocorrências da mesma opção a R$ 500,00 custam R$ 1.500,00; duas de outra a R$ 800,00 custam R$ 1.600,00; subtotal R$ 3.100,00. Sem preço da segunda opção, não apresentar R$ 1.500,00 como subtotal completo.

Contar ocorrências confirmadas por identidade, uma vez cada, incluindo as preservadas com pendência geométrica e indicando sua situação. O quadro estima as esquadrias da intenção arquitetônica, sem comprovar viabilidade física. Não derivar quantidade de peças de alvenaria, símbolos desenhados ou soma de paredes participantes. Detalhamento identifica pavimentos por nome e cota; o filtro local não muda resumo global, preços ou total geral. Dados indisponíveis não podem ser tratados como projeto vazio.

Preços confirmados são intenção persistida, com histórico, salvamento em segundo plano, recuperação e somente leitura conforme o orçamento existente, sem recálculo construtivo. Preservar em reabertura, cópia de projeto, transporte .ecovit e desfazer/refazer. Projetos anteriores não recebem preços inventados. Ao remover a última ocorrência, a opção deixa de aparecer e contribuir no orçamento; definir na revisão do agrupamento a retenção dos preços para reinserção e o comportamento ao mudar tipo/dimensões, sem transferir preço silenciosamente entre opções diferentes.

Referências: [PRD — RF-06/RF-11](../Ecovit-PRD.md), [Elementos construtivos — Vãos e aparência](../arquitetura/Elementos-Construtivos.md#vãos-e-aparência-de-esquadrias), [Quantitativos](../arquitetura/Quantitativos.md), [Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md) e [Estado e histórico](../arquitetura/Estado-Historico-e-Operacoes.md). Na implementação, atualizar contratos e compatibilidade dos formatos afetados; não introduzir novas regras geométricas.

## Critérios de aceite

- [ ] **A01** — O quadro lista somente opções de portas/janelas presentes, com quantidades e dimensões de referência coerentes; vãos livres e tipos ausentes não aparecem, e legados genéricos permanecem identificáveis.
- [ ] **A02** — A definição de opção e o ciclo de preços são revisados e registrados antes da implementação; ocorrências iguais compartilham preço conforme essa definição, sem transferência silenciosa para outra opção.
- [ ] **A03** — Preços válidos, zero, ausência, entradas inválidas e limites monetários seguem as regras descritas; exemplo de R$ 3.100,00 e incompletude por preço ausente são atendidos.
- [ ] **A04** — Subtotal e total geral incluem esquadrias no aplicativo e no PDF da T-036; opções ausentes não exigem preço, e projeto sem esquadrias tem subtotal zero. Filtro local não altera totais globais.
- [ ] **A05** — Quantidades contam a intenção confirmada sem duplicação, identificam pendências e não confundem vão bruto com dimensão comercial; preços não alteram alvenaria nem recebem margens de outros materiais.
- [ ] **A06** — Preços e identidade das opções seguem histórico, salvamento, transporte, cópias e recuperação; somente leitura não edita e legados não recebem valores inventados. Contratos e verificações pertinentes são registrados.

## Resultado

Task criada a pedido do solicitante em 2026-11-25. Confirmados pelo pedido: esquadrias entram no relatório de orçamento, preço informado pelo usuário por opção utilizada e exclusão dos tipos ausentes. Agrupamento e ciclo de preços estão propostos para revisão. Implementação e verificação técnica pendentes; a criação desta especificação não autoriza implementação, commit, push ou publicação.
