# Qualidade e desempenho

[Índice da arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [PRD](../Ecovit-PRD.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md)

## Estratégia de verificação

Os fluxos de uso são verificados no próprio aplicativo. Testes automatizados cobrem domínio, API e navegador, com aceite manual registrado separadamente.

Vitest: encaixe modular, precisão, interseções, catálogo, alternância de encontros, interrupções por vãos, canaletas, propagação vertical, quantitativos e ida/volta do arquivo.

A integração da API usa PostgreSQL 18.0 real em banco isolado: autorização, CSRF, revisões, idempotência, cotas, imagens, revogação e limpeza. Captura de e-mail e injeção de falhas ficam no ambiente de teste; envio/entrega Resend, proxy HTTPS e recursos Linux precisam de homologação na implantação. Não substituir testes HTTP diretos por verificações de botões.

Playwright: desenhar/redimensionar, cancelar gesto, alternar modos, navegar fiadas, editar encontro apenas na primeira, alterar graute respeitando vãos, desfazer, salvar/recarregar e transportar arquivo. Coordenadas dos gestos devem ser calculadas pela câmera/elementos conhecidos, evitando testes frágeis presos a pixels de uma tela específica.

Testar arquivo inválido, falha de cálculo, liberação dos controles após falha, salvamento de rascunho, download após falha de armazenamento e alterações sucessivas em pavimentos diferentes. Usar os casos do Caderno técnico como resultados esperados para o motor; não validar o algoritmo apenas contra sua própria saída.

Observar desempenho no próprio aplicativo ao longo da implementação, usando também o cenário do PRD. A referência de geração em até 5 segundos é uma meta inicial de observação, sem exigir prova técnica prévia; a espera aceitável será avaliada pelo solicitante durante o uso.

Referências: [Vitest](https://vitest.dev/guide/) e [Playwright](https://playwright.dev/docs/intro).

## Verificação em navegadores

Chrome e Edge desktop continuam no escopo de compatibilidade do PRD. Google Chrome é o navegador prioritário para as tasks cotidianas. Selecionar os cenários dos fluxos afetados e suas regressões pertinentes; uma mudança apenas de apresentação não exige automaticamente executar carga, backup grande ou todos os testes do arquivo em que o cenário está localizado.

Executar verificações direcionadas no Microsoft Edge quando houver risco específico de compatibilidade ou alteração no uso de APIs/comportamentos de navegador: importação, download, decodificação de imagens, armazenamento/sessão, foco/teclado, gestos/eventos do canvas ou recursos de layout. Conferir os cenários pertinentes; mudanças apenas de posição ou estilo com recursos já usados podem ficar restritas ao Chrome, salvo falha conhecida, exigência da task ou solicitação explícita. Registrar a seleção e sua justificativa na task.

Na homologação completa de uma versão ou quando solicitada a suíte completa de navegador, executar todos os cenários em Chrome e Edge, incluindo carga e backup, sem filtros, exclusões ou enfraquecimento de asserções. Revisões visuais cotidianas usam Chrome nas resoluções previstas em Interface e iconografia; Edge participa das revisões direcionadas e da homologação completa. Preservar critérios de legibilidade, acessibilidade, foco e ausência de sobreposição/rolagem horizontal.

Os comandos são `npm run test:e2e -- <arquivo ou filtros>` para Chrome, `npm run test:e2e:edge -- <arquivo ou filtros>` para Edge direcionado e `npm run test:e2e:full` para a suíte completa nos dois. Sem filtros, os dois primeiros executam todos os cenários somente no respectivo navegador. A configuração Playwright mantém ambos os projetos disponíveis; a seleção cotidiana é feita pelos scripts. A chamada direta `playwright test` sem seleção continua executando ambos. Exemplos e execução via PowerShell no [README](../../README.md#verificações).

Todos usam servidor próprio na porta 5174, sessão isolada e banco de testes conforme Persistência e compatibilidade. Não alteram a porta 5173, timeouts, limites de carga ou quantidade de workers. Registrar na task comandos, navegadores, cenários efetivamente executados e verificações pendentes; aceite manual continua separado dos testes automatizados. A política passa a valer nas novas execuções; não reescrever os resultados históricos das tasks e marcos já verificados.

## Finalidades dos testes de navegador

Cada cenário Playwright declara exatamente uma tag principal, inclusive nos casos parametrizados. As tags são metadados explícitos, não inferências pelo nome do arquivo. Cenários mistos ficam no grupo de seu objetivo principal, conservando todas as suas asserções.

| Tag | Finalidade | Comando cotidiano |
|---|---|---|
| @interface | Apresentação, resoluções, rótulos, controles, foco e acessibilidade, incluindo as operações necessárias para verificá-los | `npm run test:e2e:interface -- <arquivo ou filtros>` |
| @fluxo | Operações funcionais, edição, histórico, persistência, transporte, falhas e recuperação | `npm run test:e2e:flows -- <arquivo ou filtros>` |
| @carga | Projetos de volume elevado, medição de desempenho e backup grande | `npm run test:e2e:load -- <arquivo ou filtros>` |

Os grupos são disjuntos e sua união conserva toda a suíte. O seletor de grupo combina a finalidade com --grep/-g adicional, preservando expressões e flags nativas do Playwright e sem permitir que o filtro inclua outra finalidade. A descoberta automatizada de infraestrutura exige exatamente uma finalidade válida por cenário; não inicia servidor ou navegador. Chrome é o padrão; --project=edge seleciona Edge explicitamente, conforme a política acima. Arquivos, --grep-invert e --list continuam disponíveis. Grupos não são promessa de execução rápida: selecionar também o recorte afetado. test:e2e:full conserva todos os grupos nos dois navegadores; sem filtros para homologação completa.

O preparo reproduzível e diagnóstico do ambiente estão no [contrato de persistência](Persistencia-e-Compatibilidade.md#desenvolvimento-e-verificações-isoladas). O grupo escolhido não altera banco, porta, timeouts ou asserções.

## Renderização e custo de processamento

O projeto de carga do PRD pode ter 100 mil peças totais; isso não significa desenhar 100 mil nós interativos simultaneamente.

- Renderizar apenas pavimento/fiada ativos e peças que interceptam a região visível.
- Não montar todas as fiadas como nós ocultos.
- Desativar eventos em grid, referências e decoração.
- Desenhar peças em lotes por parede com formas customizadas quando a contagem tornar nós individuais dispendiosos; selecionar por coordenadas e identificadores do modelo.
- Manter alças e realces em camada de interação, sem redesenhar o projeto inteiro a cada movimento.
- Simplificar furos e detalhes em zoom distante; preservar precisão de seleção.
- Calcular apenas após confirmação da edição, evitando geração e cópias integrais a cada evento do mouse.
- Medir geração, quantidade de formas visíveis e duração de gestos durante o desenvolvimento.

O uso de camadas reduzidas e eventos desabilitados em formas sem interação segue as [orientações de desempenho do Konva](https://konvajs.org/docs/performance/All_Performance_Tips.html).

Não adotar WebGL, índices espaciais complexos ou compressão binária inicialmente. Se um cenário real exceder as metas, identificar o gargalo antes de adicionar tecnologia.

## Evidências e limites

Registre os roteiros, os resultados e a situação do aceite na [task](../tasks/README.md) correspondente. Metas de carga são referências de observação; desempenho depende do projeto e do ambiente.
