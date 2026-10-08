# ADR-002 — Modelo de dados

Data do registro: 07/10/2026. Status: **decisão vigente do PRD 1.1; implementação parcial em M0**.

## Contexto

Planta, fiadas, elevações e quantitativos precisam representar a mesma revisão, sem divergência entre desenhos independentes. A persistência deve preservar identidade, permitir evolução do formato e suportar recuperação/conflitos.

Referências: [PRD](../PRD.md), seções 5–7 e 10; [modelo detalhado](../architecture/data-model.md).

## Decisão

- Persistir um documento paramétrico versionado (`schemaVersion: 1`), validado por Zod e pelo banco.
- Usar milímetros inteiros no modelo e UUIDs para entidades/referências; rótulos não são chaves.
- Um pavimento de elevação zero, uma configuração de tijolo e espessura derivada da largura do tijolo.
- Paredes com eixos orientados; aberturas vinculadas por `wallId`; cotas com âncoras associativas.
- Derivar peças, encontros, diagnósticos e quantitativos a partir do modelo; não salvar objetos Konva como fonte principal.
- Separar `schemaVersion`, revisão do documento/remota e `engineVersion`.
- Persistir documento atual em `projects` e histórico em `project_revisions`, com proprietário definido pela sessão do banco.
- Mutações por RPC transacional e idempotente; escrita direta de clientes nas tabelas revogada.

## Estado de implementação

O [schema TypeScript](../../src/domain/project.ts) e as migrações iniciais representam paredes, aberturas e cotas, embora as respectivas ferramentas ainda não existam. M0 oferece criação/revisão 1, lista e leitura. A equivalência estrutural entre Zod e JSON Schema SQL é conferida por `npm run schema:check`.

Referências, unicidade, proporção dimensional e limites têm verificações complementares nas duas camadas. A prova comportamental no banco depende da execução de `npm run test:cloud`; comparar schemas não a substitui.

`save_project`, `delete_project`, retenção de 20 revisões, recuperação e conflitos estão previstos para M4. Não interpretar colunas já criadas como implementação dessas operações.

## Consequências

O documento facilita exportação JSON e mantém renderização desacoplada. A duplicação de snapshots no histórico exige retenção e limites. UUIDs estáveis permitem vínculos e diagnósticos rastreáveis.

Uma incompatibilidade geométrica editável pode ser salva e diagnosticada pelo motor; ela não deve ser confundida com schema inválido. Versões futuras desconhecidas são recusadas sem substituir o projeto aberto.

SQLite/MySQL poderiam armazenar o mesmo documento, mas exigiriam adaptação da persistência, autorização, SQL e transações. A portabilidade do modelo não torna portáveis as RPCs e políticas atuais.

## Alternativas e revisão

Não adotar desenho independente por vista nem tijolos persistidos como fonte principal. Normalizar cada peça em tabela ampliaria armazenamento e risco de divergência sem necessidade no MVP.

Novos pavimentos, perfis construtivos ou formatos exigem migração explícita do documento. Migrações de banco já aplicadas são imutáveis; evoluções geram novos arquivos e testes de compatibilidade.
