# Ecovit — Plano incremental de implementação

Índice dos marcos e de seus registros finais. Comportamento vigente no [PRD](Ecovit-PRD.md), contratos na [Arquitetura](Ecovit-Arquitetura-Tecnica.md), convenções no [Caderno técnico](Ecovit-Caderno-Tecnico.md) e propostas futuras no [Backlog](Ecovit-Backlog.md).

## Como usar

- Consultar o arquivo do marco para alcance, tarefas, critérios de aceite, verificações, limitações e aceite do solicitante. M3.1–M3.3 compartilham um arquivo por utilizarem critérios comuns; M4 tem um resumo e três entregas independentes.
- Preservar os IDs de tarefas/aceite e de referências RF/CT/EX/D/AH. O número do marco identifica a entrega; a numeração interna preservada nos arquivos permite reconhecer as referências anteriores.
- Os marcos são cumulativos em funcionalidades. Formatos e limitações de uma entrega antiga são históricos; o contrato suportado atualmente é definido na arquitetura. O aceite de um marco não autoriza executar outros itens.
- Verificações do Codex são evidências da entrega, sem atribuir nova execução a revisões posteriores. Aceite global do solicitante não comprova execução individual de cada roteiro ou auditoria de cada detalhe.
- Manter um resumo final por marco, sem diário de tentativas, logs intermediários, contagens acumuladas de reexecuções ou cópias dos contratos de produto/arquitetura. Resultados transitórios ficam no histórico do Git. Preservar limitações e pendências reais, inclusive aceites específicos de ajustes posteriores.

## Marcos

| Marco | Resultado | Referências | Situação final |
|---|---|---|---|
| [M1 — Planta editável e persistência](marcos/M1-Planta-e-Persistencia.md) | Projetos, paredes, histórico e arquivo nativo | RF-01/02/03/08/09/11/12 | Implementado e aceito pelo solicitante |
| [M2 — Composição e inspeção de fiadas](marcos/M2-Composicao.md) | Catálogo nominal, retas, L/U/T/contornos, fases, diagnóstico e inspeção | RF-01/03/04/05/09/10/11/12; CT-01–06 | Implementado e aceito pelo solicitante |
| [M3.1 — Vãos](marcos/M3-Vaos-Canaletas-Grautes.md) | Portas, janelas, vãos e padrões de inserção | RF-04/06/09/10/12; CT-07/08 | Implementado e aceito pelo solicitante |
| [M3.2 — Canaletas](marcos/M3-Vaos-Canaletas-Grautes.md) | Níveis globais, faixas locais, supressão/restauração | RF-04/07/09/10/12; CT-09 | Implementado e aceito pelo solicitante |
| [M3.3 — Grautes](marcos/M3-Vaos-Canaletas-Grautes.md) | Categorias, distância, eixos e ajustes individuais | RF-04/07/09/10/12; CT-10 | Implementado e aceito pelo solicitante |
| [M3.4 — Edição no canvas](marcos/M3.4-Edicao-no-Canvas.md) | Continuidade/união, movimento com dependentes e módulo inicial | RF-02/03/06/07/09/10/11/12; CT-11 | Implementado e aceito pelo solicitante |
| [M3.5 — Cruz nominal](marcos/M3.5-Cruz-Nominal.md) | Cruz integrada a L/T/contorno, fases e elementos associados | RF-04/05/07/09/10/12; CT-12 | Implementado e aceito pelo solicitante |
| [M4 — Lajes e múltiplos pavimentos](marcos/M4-Lajes-e-Pavimentos.md) | Cota única modular, lajes independentes, até quatro pavimentos e comparação visual | RF-08/13 e integração com RF-04/05/07 | Implementado e aceito pelo solicitante |
| [M4.1 — Pavimentos](marcos/M4.1-Pavimentos.md) | Gestão de pavimentos, cotas e composição local | RF-08; EX-56–64 | Implementado e aceito pelo solicitante |
| [M4.2 — Lajes](marcos/M4.2-Lajes.md) | Lajes/aberturas, edição e extensão AH de alturas | RF-13; CT-13/14; EX-65–79; D42-01 | Implementado e aceito pelo solicitante |
| [M4.3 — Comparação visual](marcos/M4.3-Comparacao-de-Pavimentos.md) | Referência de pavimento adjacente em Planta | RF-08; CT-15; EX-80–85 | Implementado e aceito pelo solicitante |
| [M5 — Consulta e conclusão da primeira versão](marcos/M5-Quantitativos-e-Projetos.md) | Quantitativos, duplicação de projetos e cenários restantes | RF-10/11/12 e cenários do PRD | Implementado e aceito pelo solicitante |
| [M6 — Preferências do Ecovit](marcos/M6-Preferencias.md) | Preferências de rótulos, comprimento/altura das paredes e reorganização do status/ajuda do canvas | BL-07; RF-09/10/14 | Implementado e aceito pelo solicitante |
| [M7 — Medidas independentes](marcos/M7-Medidas.md) | Segmentos de medição livres em Planta, atração geométrica e persistência por pavimento | BL-03; RF-15, integração com RF-02/08/09/11/12/14 | Implementado e aceito pelo solicitante |
| [M8 — Imagem de referência por pavimento](marcos/M8-Imagem-de-Referencia.md) | Uma imagem de fundo calibrada, posição/rotação, opacidade e interface compacta | BL-02; RF-16, integração com RF-02/08/09/11/12 | Implementado e aceito pelo solicitante |
| [M9 — Tipos de portas e janelas](marcos/M9-Esquadrias.md) | Nove variantes e símbolos em Planta com botão único de orientação cíclica | BL-08; RF-06; [Elementos construtivos](arquitetura/Elementos-Construtivos.md#vãos-e-aparência-de-esquadrias); CT-17 | Implementado e aceito pelo solicitante |
| [M10 — Mobiliários](marcos/M10-Mobiliarios.md) | Acervo integrado com 40 opções, ocorrências editáveis em Planta e upload incorporado ao arquivo | BL-01; RF-17; [Medidas e imagens](arquitetura/Medidas-e-Imagens.md#mobiliários-e-acervo) | Implementado e aceito pelo solicitante |

Persistência, integridade e verificação acompanham cada entrega. M4 depende de M3; M5 depende de M4. Os subitens de M4 têm seus próprios critérios, verificações e aceites.

## Ajustes transversais e pendências específicas

[Apresentação e operação](marcos/Apresentacao-e-Operacao.md) reúne interface, iconografia e limites operacionais que não pertencem a um único marco. Seus aceites específicos pendentes permanecem separados dos aceites globais.

O [registro de M5](marcos/M5-Quantitativos-e-Projetos.md) preserva também a situação dos ajustes posteriores de exclusão de projetos, cartões e cabeçalho, inclusive os aceites específicos ainda pendentes. M1–M10 aprovados não implica aprovação automática dessas alterações.

BL-01/02/03/06/07/08 estão implementados; BL-04/05 permanecem sem escopo de implementação aprovado, conforme o backlog. Nenhum novo marco foi iniciado nesta reorganização.

## Verificação da reorganização

Separação documental conferida por inventário de IDs, comparação das tabelas de critérios/tarefas, estados de aceite e validação dos links locais e fragmentos. Não altera o aplicativo nem representa nova execução de testes. Evidências de implementação continuam nos registros de cada marco.
