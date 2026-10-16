# Ecovit — Backlog de ideias

Registro de ideias para desenvolvimento futuro, criado em 15 de outubro de 2026. Os itens ainda não têm prioridade, prazo ou escopo de implementação aprovado. Quando uma ideia for iniciada, suas decisões e critérios serão incorporados ao [PRD](Ecovit-PRD.md), à [arquitetura](Ecovit-Arquitetura-Tecnica.md) e ao [plano incremental](Ecovit-Plano-Implementacao.md), conforme necessário.

## BL-01 — Imagens como elementos do projeto

Permitir importar imagens e utilizá-las como elementos posicionáveis no desenho, por exemplo para representar mobiliário, equipamentos ou referências visuais. A ideia inclui selecionar, mover, redimensionar e remover essas imagens, preservando sua proporção e sua associação ao projeto ao salvar e reabrir.

## BL-02 — Imagens de fundo com transparência

Permitir importar imagens de background, como plantas de referência, mantendo-as abaixo dos elementos do desenho. Oferecer ajuste de posição, escala e transparência, além de controle de visibilidade, para que a referência possa aparecer de forma discreta durante a edição sem prejudicar a leitura das paredes e dos demais componentes.

## BL-03 — Régua ou linha de cota vinculada à parede

Adicionar um elemento de régua ou linha de cota que possa ser aderido a qualquer linha de parede e exiba o comprimento medido. A cota deverá acompanhar as alterações da parede vinculada, permitindo posicionar sua indicação de forma legível; a referência exata da medição e o comportamento ao dividir ou excluir a parede serão definidos ao iniciar a funcionalidade.

## BL-04 — Persistência em SQLite

Evoluir o armazenamento para salvar os dados dos projetos em um banco SQLite, com preservação da integridade e possibilidade de migração dos projetos existentes. Antes da implementação, definir onde o banco será executado e como se relacionará com o salvamento no navegador e com os arquivos `.ecovit`, pois essa ideia representa uma evolução da arquitetura atual de aplicação estática com persistência local.

## BL-05 — Controle de acesso com Google ou código por e-mail

Implementar autenticação por conta Google ou por e-mail, sem senha própria: na opção por e-mail, o usuário receberá um código para validar o acesso. Definir a associação entre contas e projetos, o tratamento dos projetos locais existentes e os fluxos de entrada e saída; a implementação exigirá revisar a arquitetura atual sem login e estabelecer a infraestrutura necessária para validar identidades e enviar os códigos.

## BL-06 — Configurações ao lado do nome do projeto

Mover o botão “Configurações” para o topo da interface, ao lado do nome do projeto, aproximando o acesso aos ajustes do contexto do projeto aberto. A mudança deverá manter o botão fácil de identificar e acessar, inclusive quando o nome do projeto for longo ou houver menos espaço disponível no cabeçalho.

## BL-07 — Tela de Opções e visibilidade dos rótulos

Criar uma tela de “Opções” com controles de apresentação do editor, inicialmente permitindo ocultar ou exibir os rótulos de componentes como portas, vãos e janelas para reduzir a poluição visual da planta. Ao detalhar a entrega, definir se o controle será global ou por tipo de componente e se a preferência será salva por projeto ou por usuário, distinguindo essas opções dos ajustes do projeto.

## BL-08 — Diferentes tipos de portas e janelas

Ampliar as opções de portas e janelas para permitir escolher diferentes tipos e suas respectivas representações em planta. Os tipos iniciais e suas propriedades serão definidos ao iniciar a entrega, preservando a relação com o vão existente e distinguindo a representação visual de eventuais efeitos sobre dimensões, composição e validações construtivas.
