# Modelo de dados

Referência: [PRD 1.1](../PRD.md), seções 6–7 e 10; decisão em [ADR-002](../adr/ADR-002-modelo-de-dados.md).

## Documento paramétrico

O contrato executável está em [src/domain/project.ts](../../src/domain/project.ts). A definição completa de `ProjectDocument` está no PRD.

| Campo/entidade | Responsabilidade e regras |
| --- | --- |
| `schemaVersion` | Versão do formato; atualmente 1. Versões desconhecidas são recusadas |
| `ruleSetId` | Perfil `orthogonal-half-bond-v1`; não significa homologação construtiva |
| `units` | `mm`; medidas persistidas em milímetros inteiros |
| `name` | Nome do projeto; implementação M0 exige conteúdo não vazio e até 160 caracteres |
| `brickSystem` | Comprimento, largura, altura e juntas; comprimento = 2 × largura; junta vertical zero |
| `defaultWallHeightMm` | Altura inicial das paredes; convenção inclui módulo superior com junta |
| `wastePercent` | Percentual de perdas, entre 0 e 30 |
| `floor` | Um pavimento com UUID, nome e elevação zero |
| `floor.walls` | UUID, rótulo, start/end, altura e fase 0/1; espessura deriva do tijolo |
| `floor.openings` | UUID, rótulo, wallId, tipo, offset, largura, altura, peitoril e opções de abertura |
| `floor.dimensions` | UUID, eixo, offset e duas âncoras em extremos de paredes ou bordas de vãos |

UUIDs identificam entidades; rótulos como P01/D01/J01 são apresentação. UUIDs são únicos no documento e referências devem resolver. Porta tem peitoril zero.

X cresce para a direita, Y para cima e Z representa altura. A inversão de Y pertence à renderização. Faces e interseções calculadas podem ser fracionárias; não arredondar faces de 0,5 mm. Comprimento de parede é medido entre nós de eixo, não pela soma ingênua de peças nos encontros.

## Limites e validação

- Documento JSON de até 5 MiB em UTF-8.
- Até 100 paredes, 100 aberturas e 60 fiadas por parede.
- Extensão máxima de 100 m por eixo.
- Até 50.000 peças derivadas; verificação caberá ao motor M1.
- Dimensões positivas, junta horizontal de 0 a 10 mm e referências válidas.

M0 valida estrutura e vínculos; não executa diagnóstico geométrico completo. Comprimento não modular e outras incompatibilidades editáveis podem ser persistidos. Nulos, diagonais, colisões, cobertura e compatibilidade de vãos terão tratamento pelo núcleo e comandos nos marcos correspondentes.

Zod dá feedback no frontend. O banco usa JSON Schema e verificações SQL complementares, sem confiar no cliente. `schema:check` compara a estrutura gerada; as [fixtures compartilhadas](../../tests/fixtures/documents.ts) devem ser executadas contra SQL por `test:cloud` para provar equivalência comportamental.

## Tabelas remotas

| Tabela | Campos e integridade |
| --- | --- |
| `projects` | `id` UUID, `owner_id` → `auth.users`, `name`, `schema_version`, `current_revision`, `document` JSONB, `created_at`, `updated_at`, `deleted_at` |
| `project_revisions` | `project_id` → `projects`, `revision`, `document` JSONB, `created_at`, `engine_version`, `idempotency_key`, `content_hash` |

Projeto/revisão e projeto/chave de idempotência são únicos no histórico. A migração inicial cria índice para listagem de projetos ativos por proprietário, data de criação e ID. O proprietário, os contadores e as datas de controle são determinados pelo banco.

Migrações existentes:

- [Validação do documento](../../supabase/migrations/202610070001_document_validation.sql)
- [Tabelas, políticas e criação](../../supabase/migrations/202610070002_projects.sql)

## Operações e implementação

| Contrato | Estado M0 | Comportamento |
| --- | --- | --- |
| `listProjects` | Implementado | Metadados, cursor por created_at/ID, 20 itens por página |
| `loadProject` | Implementado | Leitura autorizada e validação Zod antes de abrir |
| `createProject` | Implementado | ID do cliente; RPC cria projeto e revisão 1 na mesma transação |
| `saveProject` | Planejado para M4 | Revisão-base, idempotencyKey, documento e engineVersion |
| `deleteProject` | Planejado para M4 | Exclusão lógica idempotente |

Na criação, repetir o mesmo ID/documento retorna o resultado original; mesmo ID com conteúdo diferente gera conflito. O ID de outro proprietário não concede acesso. `m0-no-engine` é o marcador da revisão inicial, não uma versão de motor de paginação implementado.

No salvamento futuro, conferir idempotência antes da revisão-base; conflito pausa sincronização e preserva rascunho. Manter últimas 20 revisões, além do documento atual. Rascunhos, retenção e purga após 30 dias não estão implementados em M0.

## Dados derivados e estado de interface

Peças terão IDs determinísticos, tipo full/half, fiada, coordenadas/dimensões/rotação, proprietário único e paredes relacionadas. Diagnósticos terão código, severidade, IDs afetados, região e sugestões opcionais. Quantitativos derivam somente das peças válidas.

Essas saídas não são a fonte persistida. Viewport, seleção e ferramenta também ficam fora do documento paramétrico. Revisão remota, versão de schema e versão do motor têm propósitos diferentes.
