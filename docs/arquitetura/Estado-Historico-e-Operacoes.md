# Estado, histórico e operações

[Índice da arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [PRD](../Ecovit-PRD.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md) · [Marcos](../Ecovit-Plano-Implementacao.md)

Este documento descreve contratos de software vigentes. Regras geométricas/construtivas, justificativas, fontes e exemplos independentes pertencem ao Caderno Técnico; escopo e comportamento ao PRD; verificações executadas e aceites aos registros dos marcos.

## Intenção, resultado e sessão

Zustand coordena documento confirmado, resultado gerado e estado transitório de interface. Componentes assinam os campos necessários. Cursor, câmera, seleção, pavimento/fiada ativos, rascunhos, comparação, diálogos e preferências de apresentação não duplicam o documento persistido. O domínio não depende de Zustand. Estado busy impede operações sobrepostas, sem fila ou execução concorrente.

## Classificação de operações

| Operação | Persistência e histórico | Composição |
|---|---|---|
| Mudança de insumos construtivos: base/configurações, geometria de pavimentos/paredes/vãos/lajes ou ajustes | Salvar intenção, registrar uma operação | Invalidar e recalcular o projeto inteiro |
| Renomeação; edição exclusiva de medidas, referência raster, terreno ou mobiliários; aparência de esquadrias | Salvar e registrar uma operação quando houver mudança | Preservar resultado e diagnósticos, inclusive já desatualizados |
| Seleção, câmera, troca de pavimento/fiada, hover, prévia e consulta de quantitativos | Não salvar nem registrar intenção | Não recalcular |
| Preferências globais de apresentação | Gravar somente no armazenamento de preferências | Não recalcular |

A comparação de insumos exclui terrain, measurements, referenceImages, imageElements, customImageAssets e opening.appearance; nomes dos pavimentos também são excluídos, mantendo id/level/defaultHeight. Mudança de altura padrão segue a comparação construtiva existente. Uma edição visual não promove resultado desatualizado a atual. Não classificar uma operação pela aparência do gesto; comparar os insumos reais antes/depois.

## Fluxo sequencial

Após confirmar e validar um candidato construtivo: registrar a intenção, marcar generated=null/status=outdated e limpar diagnósticos derivados; salvar intenção; permitir a pintura do estado de processamento; gerar o projeto inteiro sincronamente; substituir o resultado completo e salvar novamente. Aguardar cada escrita, sem temporizador de salvamento, Worker, orçamento ou fila. Erro de salvamento conserva memória/download; exceção do motor conserva intenção e resultado ausente/desatualizado. Sempre liberar controles. Erro geométrico diagnosticado é resultado concluído, não exceção de execução.

Alterações não construtivas salvam sem invalidar resultado. Uma operação completa de usuário é atômica; prévias, cancelamentos e ausência de mudança não gravam, não alteram metadados e não geram histórico. IDs da prévia não devem materializar UUIDs definitivos a cada movimento.

## Histórico e cancelamento

Terreno usa terrainDraft e terrainEditing transitórios; Desfazer os cancela antes de consumir histórico. Criação válida, troca de material, cada arraste concluído e exclusão passam pelo commit normal com comando terrain, sem alterar insumos construtivos. Escape, blur e mudança de ferramenta/contexto descartam a prévia; soltar fora descarta o arraste.

Antes de viajar no histórico, Desfazer cancela uma prévia ativa sem consumir uma operação. Histórico tem no máximo 50 intenções, sem peças derivadas; desfazer/refazer restaura IDs e dependências e recalcula apenas quando os insumos construtivos mudam. Não persistir histórico entre sessões. Criar/duplicar/excluir pavimento ajusta ativo e referências de sessão sem restaurar preferências transitórias descartadas.

## Comandos geométricos explícitos

Contratos implementados de M3.4 para confirmação, prévia e preservação de intenções:

- **Vãos e commit:** o comando geométrico informa explicitamente seu tipo (`resize`, `move`, `create/merge`) e entrega dependentes já transformados quando move/merge. Nesse caso, commit valida o candidato e não executa a reconciliação antiga novamente. Redimensionamento mantém o caminho de preservação mundial existente; comandos de configuração/edição de vão não transladam dependentes. Não inferir o tipo por mudança de ID, comprimento ou dois endpoints. Remapear ajustes antes dos filtros de exclusão de paredes em store; esses filtros devem distinguir exclusão real de absorção por união, sem apagar dependentes remapeados.
- **Planejamento da prévia:** usar geometria/associações temporárias sem UUID persistente para desenho, cópia de graute ou migração. Materializar novos UUIDs apenas na confirmação ou migração definitiva. Prever efeito e contar cópias sem calcular todas as fiadas; usar a mesma regra na confirmação. Retornar ID selecionável sobrevivente com o resultado do comando, evitando escolher `preview.id` já absorvido. Limpar seleção de faixa/furo/componente inválida e prévias antigas; conservar câmera e fiada válida.

## Falhas e acesso concorrente

Não publicar resultados parciais de execução nem marcar gravação falha como sucesso. Retry e download usam a intenção em memória. Bloqueio exclusivo por projeto e regras de abertura idempotente/hot reload têm fonte única em [Persistência e compatibilidade](Persistencia-e-Compatibilidade.md). Somente leitura permite consultas e preferências, sem mutações do projeto.

Implementação: src/state/store.ts, src/domain/project.ts e src/domain/floors.ts.
