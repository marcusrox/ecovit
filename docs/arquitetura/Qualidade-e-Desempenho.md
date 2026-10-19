# Qualidade e desempenho

[Índice da arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [PRD](../Ecovit-PRD.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md) · [Marcos](../Ecovit-Plano-Implementacao.md)

Este documento descreve contratos de software vigentes. Regras geométricas/construtivas, justificativas, fontes e exemplos independentes pertencem ao Caderno Técnico; escopo e comportamento ao PRD; verificações executadas e aceites aos registros dos marcos.

## Estratégia de verificação

Não haverá prova técnica, prova de conceito ou protótipo separado. O solicitante testará diretamente no aplicativo após cada implementação e poderá ajustar os rumos durante o desenvolvimento. Testes automatizados pertinentes acompanharão as alterações, sem constituir uma fase independente de aprovação.

Vitest: encaixe modular, precisão, interseções, catálogo, alternância de encontros, interrupções por vãos, canaletas, propagação vertical, quantitativos e ida/volta do arquivo.

Playwright: desenhar/redimensionar, cancelar gesto, alternar modos, navegar fiadas, editar encontro apenas na primeira, alterar graute respeitando vãos, desfazer, salvar/recarregar e transportar arquivo. Coordenadas dos gestos devem ser calculadas pela câmera/elementos conhecidos, evitando testes frágeis presos a pixels de uma tela específica.

Testar arquivo inválido, falha de cálculo, liberação dos controles após falha, salvamento de rascunho, download após falha de armazenamento e alterações sucessivas em pavimentos diferentes. Usar os casos do Caderno técnico como resultados esperados para o motor; não validar o algoritmo apenas contra sua própria saída.

Observar desempenho no próprio aplicativo ao longo da implementação, usando também o cenário do PRD. A referência de geração em até 5 segundos é uma meta inicial de observação, sem exigir prova técnica prévia; a espera aceitável será avaliada pelo solicitante durante o uso.

Referências: [Vitest](https://vitest.dev/guide/) e [Playwright](https://playwright.dev/docs/intro).

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

## Evolução condicionada a necessidade

| Necessidade futura | Evolução prevista |
|---|---|
| Projetos na nuvem e login | Adicionar backend e persistência do documento por projeto |
| Consulta 3D | Novo renderizador consumindo a mesma geometria e cotas |
| PDF/SVG/CSV | Geradores usando modelo e resultado, sem depender de captura de tela |
| Abertura offline | Service Worker/PWA quando virar requisito |
| Projetos maiores | Otimizar o gargalo medido, preservando o domínio |

Não selecionar banco remoto, provedor de autenticação ou biblioteca 3D agora. Preservar dados independentes da interface já atende à preparação necessária.

## Evidências e limites

Medições, suítes executadas, revisões visuais e aceites têm fonte única nos arquivos dos marcos; esta referência não acumula contagens, logs ou tamanhos intermediários de build. Metas de carga são objetivos de observação, não garantia geral de desempenho. Não considerar estratégias recomendadas como otimizações já implementadas sem evidência no código. Reorganização documental não é nova execução dos testes do aplicativo.
