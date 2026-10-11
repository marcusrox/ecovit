# Orientações para trabalhar no Ecovit

## Referências

- [PRD](docs/Ecovit-PRD.md): comportamento do produto e limites de escopo.
- [Arquitetura](docs/Ecovit-Arquitetura-Tecnica.md): stack, modelo, processamento e persistência.
- [Plano incremental](docs/Ecovit-Plano-Implementacao.md): entrega atual, critérios de aceite, verificações e andamento.
- [Caderno técnico](docs/Ecovit-Caderno-Tecnico.md): fontes, convenções nominais, exemplos e lacunas da composição. Consulte antes de implementar o motor; não trate hipóteses como medidas físicas verificadas.

Consulte as seções pertinentes à alteração. Não duplique esses documentos em novas especificações. Instruções atuais do solicitante prevalecem; quando mudarem o comportamento acordado, atualize os documentos afetados. Não transforme uma ambiguidade em ampliação silenciosa do produto.

## Forma de trabalho

- Implemente somente a entrega ou alteração solicitada. O plano não autoriza executar todas as entregas de uma vez.
- Entregue funcionalidades no próprio aplicativo, sem prova técnica ou protótipo separado.
- Detalhe entregas futuras apenas quando forem iniciadas. Preserve os IDs de requisitos e aceite para relacionar implementação e verificações.
- Ao concluir, registre no plano o que foi implementado, verificações executadas, limitações e o que falta testar. Separe verificação do Codex de teste manual do solicitante; não declare este último concluído sem seu retorno.
- Corrija falhas pertinentes antes de declarar a entrega pronta para teste. Mudanças de comportamento motivadas por feedback devem atualizar especificação e código juntos.

## Restrições do projeto

- Um aplicativo estático, um pacote, sem backend ou login. Siga a stack da arquitetura; não introduza bibliotecas, serviços ou abstrações sem necessidade concreta da entrega.
- Domínio independente de React, Konva, Zustand e Dexie. Dados do projeto não são nós do canvas.
- Face externa como referência, paredes ortogonais, espessura igual à largura do tijolo-base e coordenadas inteiras em décimos de milímetro.
- Criar, excluir e redimensionar paredes por ambas as extremidades; sem mover/dividir paredes ou editar tijolos individuais.
- Processamento sequencial, sem Worker, filas ou atualização incremental. A espera é aceitável; falhas devem liberar os controles e preservar o trabalho.
- Interface em português brasileiro, centrada no canvas, com controles contextuais. Não exiba ferramentas ainda não implementadas.
- Não invente regras construtivas, peças especiais, espaçamentos ou apoios. Consulte e registre a pesquisa no caderno técnico antes dos algoritmos correspondentes. Modelagem geométrica não é aprovação estrutural.

## Validação

Os scripts abaixo estão implementados no `package.json`. Consulte o README para instalação e execução; nesta máquina, `Start-Ecovit.ps1 -Task <tarefa>` também utiliza o runtime local do Codex.

| Comando | Finalidade |
|---|---|
| `npm run dev` | Abrir o aplicativo para teste local |
| `npm run typecheck` | Verificar tipos |
| `npm run lint` | Verificar o código |
| `npm test` | Executar testes de domínio e persistência, sem modo de observação |
| `npm run test:e2e` | Executar fluxos relevantes no navegador |
| `npm run build` | Verificar a compilação de produção |

Em alterações de código, execute as verificações pertinentes e informe o resultado real. Priorize testes de geometria, integridade do arquivo e fluxos essenciais; não crie testes que apenas reproduzam a implementação. Alterações somente de documentação exigem revisão de consistência, não instalação de dependências ou execução de testes do aplicativo.
