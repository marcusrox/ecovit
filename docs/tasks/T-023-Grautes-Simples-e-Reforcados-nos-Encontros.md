# T-023 — Configurar grautes simples ou reforçados nos encontros

**Tipo** — Implementação

**Resumo** — Permite escolher grautes simples ou reforçados por pavimento, com um furo no simples e três no L, quatro no T e cinco na cruz no reforçado, preservando os ajustes manuais e os projetos anteriores.

**Execução** — Verificada

**Data de execução** — 2026-11-17

**Aceite manual** — Confirmado pelo solicitante

**Data do aceite manual** — 2026-11-18

## Alteração e limites

Revisão de escopo solicitada em 2026-11-17: oferecer a escolha **Simples / Reforçado** nas **Propriedades do Pavimento**, independente para cada andar. Retirar somente essa escolha das Configurações do projeto; categorias automáticas e distância máxima permanecem globais. Não haverá configuração por encontro ou parede. Os resultados da entrega global anterior permanecem registrados como histórico abaixo.

Criação da task e autorização de implementação são etapas distintas. Implementação autorizada posteriormente pelo solicitante em 2026-11-17. Não inclui commit, push ou publicação.

### Configuração e alcance

- **Simples** mantém o comportamento atual: um eixo de graute no centro nominal da célula compartilhada do encontro em L, T ou cruz.
- **Reforçado** gera o eixo central e os eixos dos furos imediatamente seguintes nos braços do encontro: três no L, quatro no T e cinco na cruz.
- Novos projetos e novos pavimentos independentes iniciam em **Simples**. Documentos anteriores sem modalidade usam Simples; formatos com modalidade global preservam seu valor em todos os andares durante a leitura. Restaurar padrões globais de graute não altera as modalidades dos pavimentos.
- A categoria Encontros continua podendo ser ligada ou desligada independentemente das demais. Com ela desligada, desabilitar a escolha de modalidade, conservar o valor escolhido e não gerar automáticos dessa categoria; reativá-la volta a usar a modalidade conservada.
- Alterar a modalidade no seletor das propriedades do pavimento aplica imediatamente pelo fluxo de alteração do pavimento, com recálculo, histórico e salvamento; desfazer/refazer restaura a escolha e o resultado.
- Laterais dos vãos, pontas livres, intervalos em paredes longas e distância máxima mantêm suas regras. Os candidatos do encontro continuam participando da distribuição intermediária conforme CT-10; o conjunto final pode mudar por causa das novas âncoras, sem criar uma regra adicional de espaçamento.

### Distribuição nominal dos furos

Usar os centros nominais das células já compostas, sem alterar a malha ou a paginação dos tijolos. Seja `C` o centro da célula compartilhada e `m` a largura-base, correspondente ao módulo horizontal de meio tijolo. Os deslocamentos abaixo são relativos a `C`, em unidades de `m`:

| Encontro de referência | Simples | Reforçado |
|---|---|---|
| L com braços para a direita e para baixo | `(0,0)` | `(0,0)`, `(1,0)`, `(0,1)` — 3 furos |
| T com barra horizontal e ramo para baixo | `(0,0)` | `(0,0)`, `(-1,0)`, `(1,0)`, `(0,1)` — 4 furos |
| Cruz com quatro braços ortogonais | `(0,0)` | `(0,0)`, `(-1,0)`, `(1,0)`, `(0,-1)`, `(0,1)` — 5 furos |

Aplicar as rotações e reflexões equivalentes, sem depender da ordem, sentido de desenho ou IDs das paredes. O eixo central está incluído em todos os padrões. Os números três, quatro e cinco descrevem os candidatos da categoria Encontros em um encontro completo e isolado, antes das exclusões manuais; não são um total imposto ao conjunto final de grautes do projeto.

Não gerar material, furo ou eixo fora da alvenaria efetivamente composta. Em braços curtos, aberturas ou mudanças de altura, usar somente os eixos elegíveis e seus intervalos reais, sem completar a quantidade deslocando candidatos para furos mais distantes. Preservar as regras vigentes de reconhecimento dos encontros, de associação às paredes e de alcance vertical de CT-10/12/14: não prolongar paredes, não atravessar vazios e não propagar eixos entre pavimentos. Componentes sem composição continuam sem grautes derivados.

Encontros próximos e categorias diferentes podem propor o mesmo eixo: unificar por coordenada, preservando as origens e as associações aplicáveis, sem multiplicar grautes por peça, parede ou encontro. A troca de modalidade não altera paredes, vãos, escolhas de paginação, canaletas ou quantitativos de peças.

### Ajustes manuais e persistência

Preservar inclusões, exclusões e ajustes pendentes ao mudar a modalidade. Exclusões explícitas continuam prevalecendo sobre qualquer origem automática; não criar um substituto para compensá-las. Inclusões manuais permanecem mesmo quando deixarem de ser propostas automaticamente. Remover ou restaurar ajustes por parede/pavimento mantém o alcance e as confirmações existentes.

Persistir a modalidade por pavimento no arquivo `.ecovit`, salvamento remoto, reabertura, importação e duplicação do projeto. Novo pavimento independente inicia em Simples; duplicar pavimento copia a modalidade da origem por valor, sem vínculo. Formatos anteriores suportados sem o novo campo assumem Simples; valores desconhecidos ou inválidos não são convertidos silenciosamente. Atualizar o contrato de formato, leitores e resultado derivado conforme necessário, sem alterar versões históricas já entregues ou introduzir migração SQL sem necessidade concreta.

**Limite nominal:** os nomes Simples e Reforçado identificam padrões de distribuição de eixos no desenho. Não implementar dimensionamento de ferro, concreto, diâmetro, cavidades, resistência ou ligação física, nem inferir volume de graute ou quantidade de aço. A ampliação não declara adequação estrutural.

### Referências e contratos a atualizar na implementação

- [PRD](../Ecovit-PRD.md): RF-04/07 e padrões nominais do §14.
- [Caderno técnico](../Ecovit-Caderno-Tecnico.md): CT-10 e sua relação com CT-05/12/14; registrar os padrões e exemplos independentes antes de alterar os algoritmos. Atualizar a restrição atual de CT-12 a um único eixo central, preservando-a como comportamento de Simples.
- [Motor e diagnósticos](../arquitetura/Motor-e-Diagnosticos.md#canaletas-e-grautes): configuração, candidatos, origens, deduplicação e ajustes manuais.
- [Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md): representação da escolha, formatos suportados e atualização de resultados anteriores.
- [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md): integração compacta da escolha no formulário existente. Sem novos controles por encontro ou painel separado.

## Critérios de aceite

- [x] **A01** — Propriedades do Pavimento oferecem Simples/Reforçado para o andar ativo, com padrão Simples e aplicação imediata. As Configurações do projeto mantêm somente categorias e distância, sem seletor de modalidade. Desligar Encontros conserva e desabilita as escolhas dos pavimentos; restaurar padrões globais não as altera.
- [x] **A02** — Em encontros completos e isolados, com somente a categoria Encontros habilitada e sem ajustes manuais, Simples gera somente o centro; Reforçado gera exatamente os centros definidos na tabela: três no L, quatro no T e cinco na cruz, incluindo o central. Rotações, reflexões e sentido/ordem do desenho conservam os padrões nas bases iniciais e em uma base personalizada 2:1.
- [x] **A03** — Furos compartilhados são únicos, com origens e associações preservadas, inclusive em encontros próximos. Trechos curtos, vãos e alturas diferentes não geram eixos em vazio nem deslocamento para completar a quantidade; os intervalos respeitam a alvenaria real e o isolamento entre pavimentos.
- [x] **A04** — Alternar modalidade mantém ajustes manuais, inclusive pendentes, e exclusões prevalecem sem compensação automática. Demais categorias e restaurações mantêm seus contratos; novas âncoras são consideradas pela distribuição intermediária vigente.
- [x] **A05** — As escolhas independentes sobrevivem a salvar/reabrir, transportar e duplicar projeto. Novo pavimento inicia Simples e cópia preserva a modalidade da origem sem vínculo. Documentos anteriores sem escolha mantêm Simples; modalidade global anterior é copiada para os pavimentos sem mutar a fonte. Valores inválidos são recusados.
- [x] **A06** — Aplicar a alteração é desfazível/refazível pelo fluxo existente, sem modificar intenção arquitetônica, paginação dos tijolos, canaletas ou quantitativos de peças. Somente leitura e processamento preservam os bloqueios do formulário.
- [x] **A07** — Contratos e exemplos pertinentes descrevem o comportamento implementado e seus limites nominais, sem alegar dimensionamento estrutural, consumo de concreto ou aço.

## Resultado da implementação inicial, com modalidade global

Implementado em 2026-11-17 no formulário e no motor existentes, sem biblioteca, serviço ou migração SQL. Na conclusão dessa etapa, o aceite manual ainda estava pendente.

- **A01/A06** — Cenário direcionado de Chrome aprovado: padrão Simples, escolha global em dois pavimentos, desabilitação com categoria desligada sem perder a escolha, cancelamento, aplicação, desfazer/refazer, restauração dos padrões no formulário e bloqueio dos controles em somente leitura. Paredes conferidas integralmente por ID, respeitando a reordenação já existente das coleções em commits de visão de pavimento; peças por fiada preservadas. Captura ".tools/t023-settings.png" conferida visualmente.
- **A02/A03/A04** — Dez testes específicos aprovados, com expectativas independentes para L/T/cruz em rotações/reflexões, sentidos invertidos e módulos 12,5/15/12,51 cm. Cobrem deduplicação com duas origens, vãos e alturas diferentes, candidato ausente sem substituição, âncoras de intervalos, exclusões sem compensação, inclusões e pendências preservadas, restauração e isolamento entre andares. As 44 regressões mantidas de graute, cruz e restauração também passaram.
- **A05** — Formato nativo 20, leitores 9–20; junctionMode opcional simple/reinforced, ausência equivale a Simples. Leitura de 19 preserva intenção e resultado consistente sem mutar a fonte; campo em versão anterior, valor inválido e snapshot adulterado são recusados. Dez arquivos de regressão de domínio/compatibilidade e os testes de cópia e protocolo remoto cobriram 180 casos distintos aprovados. O cenário de Chrome também confirmou download, leitura do arquivo, salvamento remoto e reabertura com Reforçado.
- **A07** — PRD, CT-10/12 e EX-100–105, Motor e diagnósticos, Persistência e compatibilidade e Interface e iconografia atualizados. Composição permanece nominal-v10: a modalidade é insumo explícito do cálculo, não uma nova paginação. Representação remota versão 1 e versões SQL permanecem independentes.

Validação ampliada somente pelo impacto concreto em geração e no formato compartilhado por elementos/pavimentos. Conferências de tipos do frontend e servidor e lint aprovadas; diff sem erros. Sem suíte completa, build ou homologação ampla. Aceite manual não foi inferido da autorização de implementação.

Logs locais ignorados pelo Git: .tools/t023-patterns-final.log, .tools/t023-domain.log, .tools/t023-compatibility.log, .tools/t023-compatibility-recheck.log, .tools/t023-e2e-verified.log, .tools/t023-types-final.log, .tools/t023-server-types.log e .tools/t023-lint-final.log. O log inicial de domínio contém três falhas de expectativa por zero negativo nas transformações dos exemplos; a conferência final normaliza somente essa representação matemática e mantém as posições exatas. Na compatibilidade, a recusa de formato futuro e a matriz do helper histórico de testes foram atualizadas para o formato 20 e seus casos revalidados. As tentativas anteriores de navegador registram correções do nome acessível do seletor e das premissas do cenário sobre ordenação de coleções e bloqueio de acesso às configurações; o cenário final passou sem enfraquecer as conferências de identidade ou ampliar timeouts.

## Correção de contatos entre paredes — 2026-11-17

O solicitante identificou ausência de reforço em braços que apenas encostam na face da célula do encontro. A condição inicial exigia wallId comum entre centro e vizinho; os exemplos isolados anteriores compartilhavam a célula e não exercitavam essa situação. A regressão reproduziu um canto com somente dois candidatos, em vez dos três esperados.

A elegibilidade agora exige célula adjacente do mesmo componente conectado e intervalos de alvenaria sobrepostos aos do centro. Mantidas as regras de material existente, origens, ajustes manuais e isolamento entre pavimentos. Não mudou o padrão 3/4/5, apenas o reconhecimento dos braços válidos. CT-10, EX-100–102 e Motor e diagnósticos corrigidos.

Validação da correção: 55 testes de domínio aprovados em quatro arquivos, incluindo o conjunto de sete paredes com quatro cantos L, quatro T e uma cruz, verificando coordenadas exatas e origens dos nove encontros com todas as categorias automáticas ligadas. Logs .tools/t023-contact-reproduce.log (falha reproduzida antes da correção) e .tools/t023-contact-domain.log (correção aprovada). Cenário direcionado de Chrome aprovado (1 cenário, 20,4 s), com captura conferida visualmente em .tools/t023-contatos-corrigidos.png e log .tools/t023-contact-e2e.log. Tipos e lint aprovados; logs .tools/t023-contact-types.log e .tools/t023-contact-lint.log. Na conclusão dessa etapa, o aceite manual ainda estava pendente.

## Revisão: modalidade por pavimento — 2026-11-17

A pedido do solicitante, a modalidade deixou de ser global. Somente Simples/Reforçado foi movido para Propriedades do Pavimento; categorias e distância permanecem no projeto. O seletor salva imediatamente pelo fluxo de alteração do pavimento e participa dos insumos de recálculo. Cada andar é calculado com sua própria modalidade. Novos pavimentos iniciam Simples e duplicações preservam o valor da origem sem vínculo.

Formato vigente 21, leitores 9–21. A leitura do formato 20 transfere a modalidade global válida para cada pavimento, removendo o campo global sem mutar a fonte e preservando snapshots consistentes. Ausência implica Simples. Campos novos em envelopes anteriores, modalidade inválida e campo global em 21 são recusados. Sem mudança de versão SQL ou da representação remota.

Conferência técnica: 71 testes de domínio/grautes/pavimentos e 147 testes de compatibilidade passaram; dois cenários no Chrome aprovados, incluindo conjunto conectado com braços encostados e alternância independente de dois pavimentos (5/1, 5/5, 1/5 e desfazer/refazer), seletor ausente do diálogo global, categorias globais, salvamento/reabertura, download e somente leitura. Captura .tools/t023-por-pavimento.png conferida visualmente. Logs .tools/t023-floor-domain.log, .tools/t023-floor-compatibility.log e .tools/t023-floor-e2e.log. PRD, Caderno Técnico e contratos pertinentes atualizados. Na conclusão dessa etapa, o aceite manual ainda estava pendente; não houve commit ou push nessa etapa.

## Aceite manual — 2026-11-18

Confirmado explicitamente pelo solicitante nesta data: “As T-023, T-024 e T-025 estão aprovadas.” A aprovação inclui os ajustes entregues até o commit 481b023. Os resultados técnicos e as datas de execução anteriores permanecem preservados; as menções de aceite pendente nos relatos anteriores descrevem a situação naquelas etapas.
