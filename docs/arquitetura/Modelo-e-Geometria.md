# Modelo e geometria

[Índice da arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [PRD](../Ecovit-PRD.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md) · [Marcos](../Ecovit-Plano-Implementacao.md)

Este documento descreve contratos de software vigentes. Regras geométricas/construtivas, justificativas, fontes e exemplos independentes pertencem ao Caderno Técnico; escopo e comportamento ao PRD; verificações executadas e aceites aos registros dos marcos.

## Unidades e precisão

Coordenadas construtivas usam inteiros seguros em 0,1 mm: 12,5 cm = 1.250 unidades e 7 cm = 700. A base exige comprimento igual a duas larguras e dimensões representáveis nessa precisão. A interface converte unidades; câmera e pixels não mudam dimensões do projeto. Modulação e convenções nominais seguem CT-01/02 do Caderno, sem inferir junta física nula ou comprovação de fabricante.

## Coordenadas e propriedade

Paredes, vértices de lajes, medidas e âncoras usam o espaço XY mundial. [Elementos construtivos](Elementos-Construtivos.md) respeitam a malha horizontal; cotas/alturas seguem o passo vertical. Imagens de referência e mobiliários admitem transformações finitas fracionárias, sem alterar a precisão dos demais tipos. Centros de furos podem ser derivados fracionários quando o módulo inteiro é ímpar; a identidade persistida permanece na origem inteira da célula.

## Identidade e referências

Entidades de intenção têm UUIDs únicos em todo o documento. IDs derivados de componentes, peças, faixas e eixos são determinísticos e incluem floorId quando necessário, sem UUID novo a cada geração. Não persistir nós Konva, topologia ou coordenadas de tela como identidade. Duplicação de projeto preserva IDs internos e cria novo ID de projeto; duplicação de pavimento remapeia IDs internos e suas relações.

floorId identifica o proprietário de paredes, lajes, medidas, referências, mobiliários e ajustes. Vãos derivam o pavimento pela parede e aberturas de laje pela inclusão na laje, sem referência redundante. Referências órfãs, UUIDs duplicados e associações construtivas entre pavimentos são erros de integridade; pendências geométricas íntegras não são referências órfãs.

## Validação e limites

Validar candidato completo por funções puras de domínio antes de confirmar: tipos, finitude, precisão, modulação quando aplicável, referências e extensões derivadas. Predicados de anéis usam segmentos e aritmética exata quando produtos ultrapassam inteiros seguros; não usar tolerância de tela para decidir contato ou validade geométrica. Não reparar, truncar ou salvar parte de um candidato inválido. Limites quantitativos e de arquivo têm fonte única em [Persistência e compatibilidade](Persistencia-e-Compatibilidade.md).

Implementação: src/domain/project.ts, src/domain/slabs.ts e src/persistence/files.ts. Contratos específicos dos tipos em [Elementos construtivos](Elementos-Construtivos.md) e [Medidas e imagens](Medidas-e-Imagens.md).
