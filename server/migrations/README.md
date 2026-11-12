# Migrações SQL

A versão 1 permanece em `../schema.sql`, sem alteração do SQL entregue.
Novas versões usam arquivos `002-descricao.sql`, `003-descricao.sql`, etc.
O executor ordena numericamente e exige versões únicas e consecutivas desde 1.
Não editar versões entregues nem incluir BEGIN/COMMIT/ROLLBACK ou controle de
transação nos arquivos: cada arquivo e seu registro são aplicados na mesma
transação pelo executor. Não usar comandos incompatíveis com transação, como
CREATE INDEX CONCURRENTLY. SQL deve respeitar o search_path do executor para
permitir verificações em schemas isolados. Não alterar ecovit_migrations nos
arquivos futuros. Incluir as concessões necessárias à role ecovit para objetos
novos, sem conceder acesso ao histórico nem privilégios de proprietário.

A estrutura é obtida aplicando a versão inicial e as incrementais. Não atualizar
schema.sql para representar uma estrutura futura: ele é a migração inicial.
Procedimentos de dev e prod: ../../docs/arquitetura/Persistencia-e-Compatibilidade.md.
