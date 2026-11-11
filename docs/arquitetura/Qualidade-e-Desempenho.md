# Qualidade e desempenho

[Índice da arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [PRD](../Ecovit-PRD.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md)

## Estratégia de verificação

Os fluxos de uso são verificados no próprio aplicativo. Testes automatizados cobrem domínio, API e navegador, com aceite manual registrado separadamente.

A cobertura mantida do produto é descrita a seguir; selecionar sua execução pela política proporcional, sem repetir esta lista a cada edição.

Vitest: encaixe modular, precisão, interseções, catálogo, alternância de encontros, interrupções por vãos, canaletas, propagação vertical, quantitativos e ida/volta do arquivo.

A integração da API usa PostgreSQL 18.0 real em banco isolado: autorização, CSRF, revisões, idempotência, cotas, imagens, revogação e limpeza. Captura de e-mail e injeção de falhas ficam no ambiente de teste; envio/entrega Resend, proxy HTTPS e recursos Linux precisam de homologação na implantação. Não substituir testes HTTP diretos por verificações de botões.

Playwright: desenhar/redimensionar, cancelar gesto, alternar modos, navegar fiadas, editar encontro apenas na primeira, alterar graute respeitando vãos, desfazer, salvar/recarregar e transportar arquivo. Coordenadas dos gestos devem ser calculadas pela câmera/elementos conhecidos, evitando testes frágeis presos a pixels de uma tela específica.

A cobertura mantida inclui arquivo inválido, falha de cálculo, liberação dos controles após falha, salvamento de rascunho, download após falha de armazenamento e alterações sucessivas em pavimentos diferentes; executar somente o recorte pertinente à alteração ou à homologação solicitada. Usar os casos do Caderno técnico como resultados esperados para o motor; não validar o algoritmo apenas contra sua própria saída.

Observar desempenho no próprio aplicativo quando a alteração afetar processamento/renderização, houver sintoma de lentidão ou solicitação explícita. Selecionar o cenário pelo impacto concreto; usar o cenário de carga do PRD quando pertinente, sem torná-lo rotina por edição. A referência de geração em até 5 segundos é uma meta inicial de observação, sem exigir prova técnica prévia; a espera aceitável será avaliada pelo solicitante durante o uso.

Referências: [Vitest](https://vitest.dev/guide/) e [Playwright](https://playwright.dev/docs/intro).

## Validação proporcional à alteração

Esta é a única política operacional de testes. Os demais contratos descrevem comportamentos e a cobertura de homologação, não acrescentam rotinas obrigatórias por edição. Sem task indicada, usar o pedido como escopo e relatar a validação diretamente; não criar arquivo por iniciativa própria. Ao escrever critérios de uma task cuja criação foi explicitamente solicitada, definir o resultado solicitado; o próprio agente não deve transformar uma matriz ampla que escreveu na especificação em autorização para executá-la sem necessidade.

| Impacto concreto | Conferência padrão |
|---|---|
| Documentação | Consistência, referências e diff. Sem aplicativo, banco, navegador ou build |
| Texto/ajuste local sem mudança de estrutura, eventos ou dados | Inspeção ou teste existente do componente. Uma conferência basta; não criar teste que apenas replique uma string |
| Layout, CSS, estrutura ou foco alterados | Para ajuste visual trivial cujo efeito seja verificável pelo código e pela evidência preservada, uma inspeção basta. Usar conferência direcionada no Chrome quando houver risco concreto de quebra, sobreposição, responsividade ou foco que a inspeção não resolva. Acrescentar contextos/resoluções só se forem afetados de maneira distinta |
| Comportamento, geometria, motor, arquivo, persistência, autorização ou compatibilidade | Testes do contrato afetado e regressões das dependências relevantes, incluindo integridade e falhas. A quantidade de linhas não determina o risco |
| Suíte/homologação completa solicitada | Toda a cobertura solicitada; navegador completo em Chrome e Edge |

Ampliar precisa de motivo concreto: efeito de CSS/estrutura que a inspeção não resolva, aumento relevante do texto em contêiner limitado, sintoma observado, nova API ou dependência afetada. A mera edição de CSS/estrutura e a possibilidade abstrata de algum efeito não justificam navegador ou matriz de testes. Encurtar um texto preservando estrutura/estilo normalmente permite reaproveitar a evidência visual anterior. As resoluções de referência estão em Interface e iconografia; a repetição das três não é padrão para manutenção.

Uma correção pontual revalida os critérios afetados, sem reiniciar os demais. Exigência explícita do solicitante continua obrigatória. Evidência anterior cobre apenas aspectos preservados e não deve ser apresentada como nova execução. Métodos de verificação já prescritos em uma task podem ser atendidos por um cenário específico; não é necessário repetir o fluxo extenso de um arquivo existente.

Selecionar tipos/lint/build pelo contrato tocado. Build é pertinente a compilação, configuração, dependências ou empacotamento, ou a pedido explícito, e já inclui typecheck. Não repetir os dois nem executar build por padrão para texto. Preferir ferramentas e testes existentes; não introduzir biblioteca, fixture ou serviço só para uma conferência trivial. Registrar em uma frase o recorte e, se houver, a razão da ampliação. Aceite manual continua separado do resultado técnico.

## Falhas do ambiente

Após a primeira falha aparentemente ambiental, permitir até **2 minutos de diagnóstico adicional** e **no máximo uma reexecução**, somente após identificar e corrigir uma causa reversível/autorizada. Sem evidência de mudança, não repetir. Esse limite não encurta testes legítimos em andamento nem altera seus timeouts. Erro de asserção ou possivelmente causado pela alteração é regressão a investigar, não atalho para dispensar teste.

Usar comandos mantidos e trecho pertinente de log/trace. Não instalar componentes, descobrir clusters antigos, criar servidor/configuração alternativa, trocar runtime ou implementar contorno durante uma entrega simples. Alternativa já mantida pode ser usada dentro do limite, identificando o ambiente realmente conferido.

Ao esgotar o limite, concluir o trabalho independente e informar o comando/falha, o critério impedido e o que falta para verificá-lo. Manter a validação obrigatória pendente; não declarar aprovação nem, quando houver task, marcá-la Verificada enquanto houver critério obrigatório sem resultado satisfatório. Investigação adicional depende de solicitação explícita com escopo próprio. Informar o impedimento no relato ou na task indicada. Criar uma task ambiental somente se o solicitante pedir explicitamente; sua criação não autoriza implementá-la.

## Verificação em navegadores

Chrome é o padrão cotidiano. Edge é direcionado a falha específica ou mudança concreta de compatibilidade, como API nova, implementação de evento/layout dependente do navegador ou diferença observada. Editar um rótulo de controle que usa APIs existentes não exige automaticamente Edge. Chrome e Edge continuam suportados; homologação completa mantém ambos, todos os cenários e cargas, sem filtros ou enfraquecimento de asserções.

Comandos cotidianos exigem arquivo .spec.ts ou --grep; --list/--help são diagnósticos e --all permite execução ampla intencional. test:e2e usa Chrome, test:e2e:edge usa Edge e test:e2e:full executa a suíte completa nos dois. A chamada direta playwright test também continua completa. Exemplos no [README](../../README.md#verificações).

Navegador usa servidor próprio na 5174 e dados/sessões isolados, preservando 5173. Não repetir preparo de ambiente já disponível na sessão. Quando necessário, usar test:env; para testes de API por injeção HTTP, --api verifica somente banco/runtime, sem Chrome ou portas do frontend. O preparo e os bloqueios de encerramento pertencem a [Persistência e compatibilidade](Persistencia-e-Compatibilidade.md#desenvolvimento-e-verificações-isoladas).

## Finalidades dos testes de navegador

Cada cenário declara exatamente uma finalidade principal: @interface, @fluxo ou @carga. A descoberta automatizada confere essa classificação, inclusive dos casos parametrizados. Os comandos test:e2e:interface, test:e2e:flows e test:e2e:load selecionam os respectivos grupos no Chrome; --project=edge é explícito. Arquivos e --grep restringem o grupo; filtros nunca admitem outra finalidade. --all seleciona todo o grupo intencionalmente. Homologação completa conserva a união dos grupos nos dois navegadores.

Grupos não são promessa de execução rápida. Separar cenários por responsabilidade quando isso permitir selecionar uma conferência sem executar autenticação, matriz visual ou recuperação de falhas não relacionadas. Não diminuir asserções para economizar tempo. Testes públicos usam fixture sem login; os autenticados mantêm seu preparo próprio.

O rótulo/link da versão tem teste de componente sem navegador em tests/version-footer.test.ts. Em release-history.spec.ts, conteúdo público, teclado por contexto, matriz visual por tela e retorno ao editor após falha de salvamento são independentes. A matriz completa de três telas/três resoluções permanece disponível na suíte, mas não é necessária para alterar apenas a legenda. Novos testes devem permitir recorte semelhante quando houver utilidade concreta, sem refatoração geral obrigatória.

## Renderização e custo de processamento

O projeto de carga do PRD pode ter 100 mil peças totais; isso não significa desenhar 100 mil nós interativos simultaneamente.

- Renderizar apenas pavimento/fiada ativos e peças que interceptam a região visível.
- Não montar todas as fiadas como nós ocultos.
- Desativar eventos em grid, referências e decoração.
- Desenhar peças em lotes por parede com formas customizadas quando a contagem tornar nós individuais dispendiosos; selecionar por coordenadas e identificadores do modelo.
- Manter alças e realces em camada de interação, sem redesenhar o projeto inteiro a cada movimento.
- Simplificar furos e detalhes em zoom distante; preservar precisão de seleção.
- Calcular apenas após confirmação da edição, evitando geração e cópias integrais a cada evento do mouse.
- Quando a alteração afetar processamento/renderização, houver sintoma de lentidão ou solicitação explícita, medir somente os indicadores pertinentes: geração, quantidade de formas visíveis ou duração de gestos.

O uso de camadas reduzidas e eventos desabilitados em formas sem interação segue as [orientações de desempenho do Konva](https://konvajs.org/docs/performance/All_Performance_Tips.html).

Não adotar WebGL, índices espaciais complexos ou compressão binária inicialmente. Se um cenário real exceder as metas, identificar o gargalo antes de adicionar tecnologia.

## Evidências e limites

Registrar roteiros, resultados e situação do aceite na task indicada, quando houver, ou diretamente no relato ao solicitante. A [criação de nova task](../tasks/README.md) depende de pedido explícito. Metas de carga são referências de observação; desempenho depende do projeto e do ambiente.
