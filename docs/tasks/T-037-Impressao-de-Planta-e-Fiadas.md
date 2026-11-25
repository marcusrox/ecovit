# T-037 — Imprimir planta e fiadas do projeto

**Tipo** — Implementação

**Resumo** — Prepara plantas e fiadas para impressão em escala, com identificação de projeto e pavimento, legenda e paginação, permitindo consultar os desenhos fora do editor sem alterar o projeto.

**Execução** — Pendente

**Data de execução** — —

**Aceite manual** — Pendente

## Alteração e limites

Adicionar ao aplicativo uma saída de impressão para a Planta e as Fiadas existentes. Permitir escolher pavimento e modo; para Fiada, selecionar a fiada atual ou um intervalo válido, identificado por número e altura. Preparar páginas com nome do projeto, nome/cota do pavimento, modo, escala, data e numeração; Fiada inclui sua identificação e legenda das peças e símbolos presentes.

Usar a intenção e os resultados vigentes do editor. Preservar conteúdo, orientação, convenções geométricas e distinções visuais relevantes, incluindo vãos, medidas e anotações aplicáveis à Planta. Remover da saída os controles de edição, seleção, alças, hover e prévias transitórias. Não criar desenho paralelo ou inferir detalhamento executivo. Diagnósticos e composição parcial continuam identificados; ausência de resultado atual não pode imprimir fiada antiga como válida.

Oferecer prévia e escolha explícita de escala e papel. Se o desenho não couber na área imprimível, informar antes de imprimir e permitir paginação em folhas identificadas ou ajuste de escala explícito; nunca reduzir silenciosamente uma escala declarada. A impressão deve poder ser usada para salvar PDF pelo diálogo do navegador. O relatório financeiro separado pertence à [T-036](T-036-Relatorio-de-Orcamento-em-PDF.md).

### Definições antes da implementação

Revisar com o solicitante os formatos de papel e escalas oferecidos, margens, política de divisão entre folhas e conteúdo das camadas opcionais (imagem, mobiliário, terreno e referências). Esses detalhes não foram definidos no pedido; resolver os que alterem o comportamento antes de implementar o trecho correspondente. A saída deve distinguir desenho nominal de documentação executiva.

Imprimir ou cancelar não altera documento, histórico, câmera, seleção, modo, pavimento ativo ou salvamento. Permitir a saída em somente leitura quando os dados necessários estiverem disponíveis; falhas preservam o trabalho aberto.

Referências: [PRD — RF-04/RF-11](../Ecovit-PRD.md), [Editor e interação](../arquitetura/Editor-e-Interacao.md), [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md), [Motor e diagnósticos](../arquitetura/Motor-e-Diagnosticos.md) e [Caderno Técnico](../Ecovit-Caderno-Tecnico.md). Na implementação, atualizar os contratos responsáveis para a saída de impressão, atualmente fora do escopo; não ampliar algoritmos construtivos.

## Critérios de aceite

- [ ] **A01** — O usuário escolhe pavimento e Planta ou Fiada; em Fiada, escolhe a atual ou um intervalo válido. A prévia identifica inequivocamente cada desenho e sua escala.
- [ ] **A02** — Papel, escala e paginação seguem as definições revisadas; o desenho não é cortado ou reduzido silenciosamente e medidas impressas correspondem à escala declarada, considerando impressão a 100%.
- [ ] **A03** — Conteúdo e símbolos representam os mesmos dados do editor, sem controles ou prévias de edição; legenda, rótulos e paginação são legíveis. Camadas opcionais seguem a decisão registrada.
- [ ] **A04** — Composição parcial ou indisponível é identificada, pavimento vazio não recebe fiada fictícia e resultados antigos não são apresentados como atuais.
- [ ] **A05** — Impressão, cancelamento, somente leitura e falhas preservam o projeto e o contexto do editor. Contratos e resultado da verificação pertinente são registrados.

## Resultado

Task criada a pedido do solicitante em 2026-11-25. Definições de papel, escala, paginação e camadas continuam abertas para revisão antes da implementação. Implementação e verificação técnica pendentes; a criação desta especificação não autoriza implementação, commit, push ou publicação.
