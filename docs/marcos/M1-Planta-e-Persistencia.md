# M1 — Planta editável e persistência

[Índice dos marcos](../Ecovit-Plano-Implementacao.md) · [PRD](../Ecovit-PRD.md) · [Arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md)

Registro consolidado da entrega. Versões e verificações referem-se ao marco; o comportamento e os formatos vigentes são definidos nas referências por assunto. Aceite global não atribui resultado individual a roteiros manuais.

**Estado:** implementado e aceito.

## Alcance

Criar, nomear, listar e abrir projetos locais; escolher base 25 × 12,5 × 7 cm, 30 × 15 × 7 cm ou personalizada 2:1; desenhar paredes ortogonais pela face externa e editar pelas duas pontas ou por comprimento. Inclui seleção de sobrepostos, exclusão, cancelamentos, histórico de 50 operações, salvamento local, bloqueio entre abas e download/importação de arquivo.

O recorte de M1 contém um térreo com piso/início da alvenaria em 0 cm e altura padrão de 280 cm, editáveis. Não inclui composição, vãos, canaletas ou grautes; esses recursos pertencem aos marcos seguintes. O envelope de M1 é versão 1, sem composição gerada. A importação cria cópia com novo ID de projeto, preservando IDs e relações dos elementos.

## Tarefas de implementação de M1

Tarefas do recorte de M1, concluídas.

- [x] M1-T01: criar a base React/TypeScript/Vite com as dependências necessárias, scripts de validação e README para execução local; criar módulos somente quando usados.
- [x] M1-T02: definir os dados mínimos do projeto, térreo e paredes, conversões de unidades, validação modular e operações de edição independentes da interface.
- [x] M1-T03: implementar criação/abertura de projeto, canvas, malha, prévias, alvos de conexão, seleção e edição das paredes.
- [x] M1-T04: integrar histórico, atalhos, navegação e tratamento de cancelamento/perda de foco.
- [x] M1-T05: implementar salvamento local, bloqueio de segunda aba, formato nativo, validação de importação e download após falha de armazenamento.
- [x] M1-T06: executar verificações pertinentes, corrigir falhas e disponibilizar o aplicativo com instruções e critérios deste registro; atualizar o andamento com evidências reais.

## Critérios de aceite

| ID | Resultado verificável |
|---|---|
| M1-A01 | Os dois tamanhos iniciais criam malhas de 12,5 cm e 15 cm. Um tamanho personalizado 28 × 14 × 7 cm cria módulo de 14 cm. Medidas não positivas, proporção inválida ou precisão não representável são recusadas com explicação. |
| M1-A02 | Criar um projeto abre o térreo, preserva nome e base e permite consultar/editar suas propriedades sem cadastrar outros pavimentos. |
| M1-A03 | Arrastes criam apenas paredes horizontais/verticais, com referência externa modular e espessura correta. Inverter o lado na prévia altera apenas o lado ocupado pela faixa. |
| M1-A04 | Um L alinha as faces no canto; um T encaixa no alvo indicado. Selecionar uma parede mantém seu ID e permite distinguir paredes na área compartilhada. Não há indicação de composição construtiva validada. |
| M1-A05 | Ambas as alças redimensionam mantendo a outra ponta e a face fixas. Comprimento numérico incompatível oferece alternativas sem alteração silenciosa. Cruzar a ponta fixa ou reduzir abaixo de um módulo não gera parede inválida. |
| M1-A06 | Excluir, desfazer e refazer restauram geometria e IDs. Cada arraste é uma única ação. Navegação não altera o documento; Delete e atalhos do canvas não interferem na digitação. |
| M1-A07 | Escape, perda de foco e soltura fora do canvas cancelam sem resíduos; o próximo desenho funciona normalmente. |
| M1-A08 | Após indicação de salvamento concluído, recarregar e reabrir preserva nome, base, pavimento, coordenadas, lados e alturas das paredes. |
| M1-A09 | Baixar e carregar em outro navegador preserva os dados de desenho e cria uma cópia local. O arquivo não contém nós Konva, histórico ou estado de mouse. |
| M1-A10 | Arquivo inválido, versão não suportada ou limite excedido é rejeitado sem substituir o trabalho aberto. Falha de armazenamento preserva a edição em memória e permite baixá-la. |
| M1-A11 | A segunda aba não pode editar o mesmo projeto enquanto a primeira mantém o bloqueio. Após fechar a primeira e reabrir na segunda, a edição pode continuar. |
| M1-A12 | Canvas ocupa a maior parte da tela; propriedades são contextuais, controles têm rótulos acessíveis e a edição funciona em Chrome e Edge desktop. Não há ferramentas futuras ou quantitativos inventados. |

## M1 — Verificações e aceite

| Verificação registrada | Evidência |
|---|---|
| Tipos, lint e build | Passaram na entrega |
| Domínio/persistência | 14 testes passaram: precisão, proporção, geometria, histórico, arquivo e IndexedDB |
| Navegador | 10 casos passaram em Chrome/Edge: criação, edição, cancelamento, reabertura, transporte, falha de gravação e bloqueio entre abas |
| Revisão visual | Tela de projetos e editor conferidos em 1440×1000 |
| Aceite do solicitante | Global recebido; sem resultados individuais por passo informados |

Fontes: [domínio](../../tests/domain.test.ts), [persistência](../../tests/database.test.ts) e [editor](../../tests/e2e/editor.spec.ts). Limites defensivos: arquivo de 50 MB, 10 mil paredes e coordenadas até ±100 milhões de unidades internas. Não há restauração de câmera/histórico entre sessões nem auditoria completa de acessibilidade.
