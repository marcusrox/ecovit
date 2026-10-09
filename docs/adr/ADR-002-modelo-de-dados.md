# ADR-002 — Modelo de dados

Registro: 07/10/2026. Revisão editorial: 08/10/2026. Estado da decisão: **vigente, conforme o PRD 1.1**.

## Contexto

Planta, fiadas, elevações e quantitativos precisam representar o mesmo projeto, preservando identidade e permitindo evolução do formato, recuperação e tratamento de conflitos. Referência: [PRD](../PRD.md), seções 5–7 e 10.

## Decisão

- Persistir um documento paramétrico versionado, em milímetros inteiros, com UUIDs para entidades/referências e validação por Zod e pelo banco.
- Derivar peças, encontros, diagnósticos e quantitativos desse documento; viewport, seleção e objetos de renderização ficam separados.
- Distinguir versão de schema, revisão do documento e versão do motor.
- Guardar documento atual e snapshots de revisões; mutações transacionais e idempotentes por RPC, com proprietário determinado pela sessão do banco.

## Motivos

Uma fonte paramétrica única evita divergência entre vistas e permite recalcular resultados. Milímetros inteiros tornam explícita a precisão dos dados de entrada; UUIDs preservam vínculos independentemente dos rótulos. Versionamento e revisão separados permitem evoluir o formato e controlar concorrência sem confundir essas operações.

## Alternativas

- **Persistir desenhos independentes por vista:** exigiria sincronização adicional e criaria risco de versões divergentes.
- **Persistir cada tijolo como fonte principal:** aumentaria armazenamento e manutenção de dados derivados. O MVP pode reconstruí-los a partir do documento.

## Consequências

O documento facilita exportação JSON e desacopla o domínio da renderização. Snapshots exigem retenção e limites de tamanho. Cálculos podem produzir coordenadas fracionárias, apesar de as medidas de entrada serem inteiras.

Uma incompatibilidade geométrica editável pode ser salva e diagnosticada pelo motor; ela não deve ser confundida com schema inválido. Versões futuras desconhecidas são recusadas sem substituir o projeto aberto.

Novos formatos exigem migração explícita; migrações de banco já aplicadas são imutáveis. O documento pode ser reutilizado com outro banco, mas isso não torna portáveis as RPCs e políticas PostgreSQL.

## Documentos relacionados

Contrato e campos: [modelo de dados](../architecture/data-model.md). Entregas e aceite: [M0 — Base](../milestones/M0-base.md), [M1 — Núcleo](../milestones/M1-nucleo.md), [M3 — Inspeção](../milestones/M3-inspecao.md) e [M4 — Persistência](../milestones/M4-persistencia.md).
