# Ecovit — Backlog de ideias

Registro de ideias para desenvolvimento futuro, criado em 15 de outubro de 2026. Salvo indicação de estado no próprio item, as ideias ainda não têm prioridade, prazo ou escopo de implementação aprovado. Quando uma ideia for iniciada, suas decisões e critérios serão incorporados ao [PRD](Ecovit-PRD.md), à [arquitetura](Ecovit-Arquitetura-Tecnica.md) e ao [plano incremental](Ecovit-Plano-Implementacao.md), conforme necessário. Registro documental não autoriza implementação.

## BL-01 — Imagens como elementos do projeto

**Estado: implementado no M10, verificado pelo Codex e aceito pelo solicitante.** Biblioteca integrada ao Ecovit com núcleo de 40 opções em oito categorias, vista superior, cores suaves e acabamento uniforme aprovado, com vegetação simplificada. Inserção e edição de ocorrências por pavimento em Planta, dimensões proporcionais pelos cantos/campos e independentes por duas alças quadradas, rotação, duplicação e histórico, sem efeito construtivo. Imagens padrão são referenciadas pelo catálogo e não incorporadas ao `.ecovit`; PNG/JPEG personalizados são incorporados uma vez e reutilizados por suas ocorrências. Comportamento no PRD RF-17, contratos na Arquitetura §28, catálogo e tarefas/aceite no Plano §17. O aceite funcional global da entrega está registrado no Plano §17.

## BL-02 — Imagens de fundo com transparência

**Estado: implementado no M8 — Imagem de referência por pavimento e aceito pelo solicitante.** Uma imagem PNG/JPEG por pavimento, abaixo da malha e dos elementos em Planta. Inclusão por Propriedades do pavimento, calibração por dois cliques e distância conhecida em cm, posição livre, rotação, opacidade e visibilidade. Controles e textos compactos, com edição explícita para evitar deslocamentos acidentais. Imagem incorporada ao projeto e ao arquivo, preservada nas cópias; sem efeito construtivo. Produto no [PRD RF-16](Ecovit-PRD.md#rf-16--imagem-de-referência-por-pavimento), contratos na Arquitetura §26 e escopo/aceite no Plano §15. BL-01 permanece separado e não integra M8.

## BL-03 — Medida independente

**Estado: implementado no M7 — Medidas independentes e aceito pelo solicitante.** Elemento independente “Medida”: segmento reto em qualquer direção, inclusive diagonal, com rótulo de comprimento. Criação por dois cliques (início e fim), atração geométrica nas duas pontas com suspensão por Alt, edição por corpo/alças, persistência por pavimento e controle do rótulo nas preferências. O encaixe não cria vínculo permanente com os elementos próximos. Requisito no [PRD RF-15](Ecovit-PRD.md#rf-15--medidas-independentes), contratos na Arquitetura §25 e escopo, verificações e aceite no Plano §14.

## BL-04 — Persistência em SQLite

Evoluir o armazenamento para salvar os dados dos projetos em um banco SQLite, com preservação da integridade e possibilidade de migração dos projetos existentes. Antes da implementação, definir onde o banco será executado e como se relacionará com o salvamento no navegador e com os arquivos `.ecovit`, pois essa ideia representa uma evolução da arquitetura atual de aplicação estática com persistência local.

## BL-05 — Controle de acesso com Google ou código por e-mail

Implementar autenticação por conta Google ou por e-mail, sem senha própria: na opção por e-mail, o usuário receberá um código para validar o acesso. Definir a associação entre contas e projetos, o tratamento dos projetos locais existentes e os fluxos de entrada e saída; a implementação exigirá revisar a arquitetura atual sem login e estabelecer a infraestrutura necessária para validar identidades e enviar os códigos.

## BL-06 — Configurações ao lado do nome do projeto

**Estado: implementado.** O botão de configurações do projeto fica no cabeçalho, ao lado do nome editável, com ícone, nome acessível e dica. Comportamento no [PRD §14](Ecovit-PRD.md#14-m3--vãos-canaletas-e-grautes-nominais), apresentação na [Arquitetura §2.1](Ecovit-Arquitetura-Tecnica.md#21-padrão-de-iconografia) e verificações no [plano §12.10](Ecovit-Plano-Implementacao.md#1210-navegação-e-ações-de-arquivo-no-cabeçalho--rf-1112). A marcação não atribui novo aceite ou execução de teste manual.

## BL-07 — Preferências do Ecovit e visibilidade dos rótulos

**Estado: implementado no M6 e aceito pelo solicitante.** Área “Preferências do Ecovit”, com visibilidade independente de portas, janelas, vãos e paredes; Paredes inclui A/B e novo rótulo de comprimento/altura. Acesso por ícone ao lado de Configurações do projeto. Requisito no [PRD RF-14](Ecovit-PRD.md#rf-14--preferências-do-ecovit), diretrizes na Arquitetura §24 e escopo, verificações e aceite no Plano §13. M6 inclui também reorganização do status e da ajuda do canvas; os demais itens do backlog permanecem fora desse marco.

## BL-08 — Diferentes tipos de portas e janelas

**Estado: implementado no M9 e aceito pelo solicitante.** Portas de giro simples/duplo, correr simples/central e basculante de garagem; janelas de giro simples/duplo, correr de duas folhas e basculante. Símbolos esquemáticos aprovados na proposta visual, seletor contextual e um único botão Alternar orientação com ciclo completo. Tipo/orientação preservam vão bruto e resultado construtivo. Produto no PRD RF-06, contrato na Arquitetura §27, convenção CT-17 e alcance/verificações/roteiro no Plano §16. Aceite funcional global registrado no Plano §16.4, separado das verificações do Codex.
