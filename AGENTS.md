# Orientações para trabalhar no Ecovit

## Referências

- [PRD](docs/Ecovit-PRD.md): comportamento e limites do produto.
- [Arquitetura](docs/Ecovit-Arquitetura-Tecnica.md): contratos por assunto em docs/arquitetura.
- [Caderno técnico](docs/Ecovit-Caderno-Tecnico.md): convenções geométricas/construtivas, fontes, exemplos e lacunas.
- [Tasks](docs/tasks/README.md) e [modelo](docs/tasks/Modelo.md): recorte autorizado e resultados.
- [Arquivo de marcos e aceites](docs/arquivo/Ecovit-Plano-Implementacao.md): rastreabilidade histórica.

## Forma de trabalho

- Implementar somente o autorizado. Usar o pedido como escopo e ler a task quando indicada, além do trecho pertinente da arquitetura; especificação existente não autoriza implementar funcionalidade nova. Resolver ambiguidade que mude o comportamento antes da alteração correspondente.
- Entregar no aplicativo, sem protótipo separado. Consultar iconografia quando houver alteração de ícones/controles; uma edição de texto não exige revisar o catálogo de ícones.
- Criar nova task somente quando o solicitante pedir explicitamente. Pedidos de investigação, implementação, revisão ou correção podem ser executados sem nova task e sem pedir sua criação por formalidade. Quando houver task indicada, usá-la como referência e atualizar seus resultados quando pertinente; caso contrário, informar o resultado diretamente ao solicitante.
- Atualizar contratos quando mudar uma regra ou comportamento acordado. Manter cada regra em seu documento responsável, preservando IDs e aceites anteriores. Texto literal de interface fica no componente e, quando solicitado, no critério da task; não duplicá-lo desnecessariamente no PRD e na arquitetura.
- Para geometria/motor, consultar o Caderno Técnico antes dos algoritmos. Não inventar peças, espaçamentos, apoios ou regras construtivas nem tratar convenções nominais como comprovação física/estrutural.
- Não introduzir bibliotecas, serviços ou abstrações sem necessidade concreta e compatibilidade arquitetural.
- Corrigir falhas pertinentes antes de declarar a entrega pronta. Registrar o resultado real; confirmar aceite manual somente após manifestação explícita. Integração de tasks e decisão de publicar são etapas distintas.

## Validação

A [política de qualidade](docs/arquitetura/Qualidade-e-Desempenho.md#validação-proporcional-à-alteração) é a fonte única para seleção de testes, navegadores, matrizes e limite de investigação ambiental. As listas de verificação dos assuntos descrevem a cobertura mantida; não são comandos para repetir a homologação a cada edição.

- Mudança simples: escolher uma conferência mínima, por inspeção ou teste específico do componente. Não disparar automaticamente navegador, build, matriz visual ou regressões amplas.
- Ampliar somente por impacto concreto nos contratos afetados, falha pertinente ou pedido explícito; registrar a razão em uma frase. Ao escrever uma task, descrever o resultado esperado sem impor validação ampla não solicitada.
- Em correção pontual, revalidar o que mudou e aproveitar evidência dos aspectos preservados. Falha ambiental não autoriza infraestrutura de contorno; seguir o limite da política e informar os critérios impedidos, sem declará-los aprovados.
- Não enfraquecer asserções nem ampliar timeouts para obter aprovação. Uma suíte completa solicitada deve permanecer completa. Aceite manual e verificação técnica são registros separados.

## Portas e ambiente

- **5173** é exclusiva do solicitante. Não iniciar, encerrar ou reiniciar seu servidor. Quando necessário, orientar a executar ./Start-Ecovit.ps1 -Task dev e abrir http://127.0.0.1:5173/.
- Verificações do Codex usam **5174**, sessões e dados isolados. Interação: dev:test. E2E inicia servidor próprio, sem reaproveitar outro. Se ocupado, identificar a instância; não encerrar processos desconhecidos ou usar 5173.
- Usar test:env quando o ambiente precisar de preparação/retomada, sem repetir diagnóstico de ambiente já disponível na mesma sessão. Para API por injeção HTTP, usar --api, dispensando Chrome e portas do frontend; --edge é explícito quando pertinente.
- Runners carregam .env.test com precedência das variáveis existentes. Nunca usar .env ou o banco do aplicativo nos testes. Comandos e pré-requisitos no [README](README.md#verificações); Start-Ecovit.ps1 -Task <tarefa> também usa o runtime local do Codex.

## Execução eficiente

- Selecionar cenários antes de executar. Comandos cotidianos de navegador exigem arquivo/filtro; --all expressa execução ampla e test:e2e:full cobre todos os grupos em Chrome/Edge. Cada cenário tem uma finalidade principal: @interface, @fluxo ou @carga.
- Guardar stdout/stderr e código de saída em log local ignorado pelo Git. Relatar apenas resultado, duração, falhas e diagnóstico pertinente, sem retransmitir logs inteiros.
- Usar sessões de processo e esperas longas; evitar consultas curtas repetidas. Não tratar ausência de saída como travamento e não concorrer cargas pesadas. Respeitar os tempos esperados e limites dos testes em andamento.
- Concluir a edição e as asserções antes da validação final. Repetir somente o recorte afetado por nova alteração/falha; não somar repetições como cobertura adicional.
