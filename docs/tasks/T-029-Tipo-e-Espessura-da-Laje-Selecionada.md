# T-029 — Configurar tipo, estrutura e capa da laje selecionada

**Tipo** — Implementação

**Resumo** — Permite escolher o tipo de laje e a altura da estrutura nas propriedades, acrescentar uma capa de concreto opcional e consultar a espessura total calculada, preservando a posição da laje no pavimento.

**Execução** — Verificada

**Data de execução** — 2026-11-18

**Aceite manual** — Pendente

## Alteração e limites

Nas propriedades da laje selecionada, substituir a edição direta da espessura total por tipo de laje, altura da estrutura e capa de concreto opcional. A espessura total passa a ser calculada pela soma dos componentes confirmados.

Referências: [PRD — RF-13](../Ecovit-PRD.md#rf-13--lajes), [Elementos construtivos — Lajes](../arquitetura/Elementos-Construtivos.md#lajes), [Caderno técnico — CT-13](../Ecovit-Caderno-Tecnico.md#ct-13--anéis-ortogonais-e-subtração-de-aberturas), [Estado e histórico](../arquitetura/Estado-Historico-e-Operacoes.md) e [Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md).

### Campos e espessura total

- **Tipo de laje:** seletor com as opções Treliçada com lajotas, Treliçada com EPS, Laje alveolar e Laje de concreto maciço. Registrar a escolha na laje. O tipo identifica a configuração, sem mudar o contorno ou introduzir cálculo estrutural.
- **Altura da estrutura (H):** seletor com 8, 12, 16, 20, 25 e 30 cm, disponível para os quatro tipos. Não manter entrada livre para a espessura total.
- **Capa de concreto:** adição opcional, com espessura informada pelo usuário. Exibir uma orientação curta de que o valor usual é em torno de 5 cm. Essa indicação não é uma exigência nem uma verificação de dimensionamento; não acrescentar 5 cm automaticamente.
- **Espessura total:** informação calculada e não editável diretamente: H + espessura da capa. Sem capa, total igual a H. Capa habilitada exige valor positivo representável na precisão existente; respeitar os limites de integridade também na soma e na face inferior derivada, sem exigir modularidade vertical.

Preservar Aplicar/Cancelar e a confirmação conjunta: tipo, H e capa são rascunhos até aplicar uma configuração válida; não confirmar somente parte dos campos. Cancelar ou abandonar a edição segue os mecanismos existentes, sem gravar rascunhos. Selecionar tipo não inventa uma altura ou capa padrão. O aviso sobre os 5 cm permanece apenas uma orientação textual.

A face superior continua na cota do pavimento e a face inferior é a cota menos a espessura total. Manter a explicação já adicionada sobre a criação da laje na parte inferior do pavimento. Tipo, H e capa não alteram alvenaria, contorno, aberturas ou posição horizontal, nem criam quantitativos, custos ou verificações de capacidade resistente, apoio ou compatibilidade construtiva entre os tipos e alturas oferecidos.

### Criação e compatibilidade

O popup inicial Contorno da laje permanece como está, incluindo a entrada explícita da espessura inicial. A alteração desta task se restringe à configuração posterior nas propriedades da laje selecionada.

Lajes existentes e lajes criadas pelo fluxo inicial podem ter somente uma espessura, sem tipo, H ou capa registrados. Preservar essa espessura e as faces derivadas até o usuário confirmar a nova configuração completa. Não inferir tipo pela espessura, escolher H por aproximação, dividir a espessura anterior em estrutura/capa ou converter silenciosamente uma medida fora da lista. Indicar nas propriedades quando a configuração de tipo/estrutura ainda não estiver definida, mantendo a espessura atual consultável.

Após configuração explícita, persistir os parâmetros necessários para reabrir os controles com os valores confirmados. A espessura usada pela geometria deve corresponder à soma desses parâmetros; não aceitar dados contraditórios no documento. Preservar configurações em salvamento/reabertura, arquivo/importação, cópia de projeto e duplicação de pavimento, sem vínculo entre cópias. Desfazer/refazer deve restaurar o conjunto e permitir retornar ao estado anterior com apenas espessura, quando aplicável. Aplicar os bloqueios de somente leitura, processamento e recuperação de salvamento existentes.

Na implementação, atualizar os contratos pertinentes de PRD, Caderno Técnico, Elementos construtivos, Estado/Histórico e Persistência, preservando os aceites anteriores e a compatibilidade dos documentos. Consultar a iconografia existente se houver alteração de controles com ícones. Esta especificação não altera os contratos vigentes por si só.

## Critérios de aceite

- [x] **A01** — As propriedades oferecem os quatro tipos e as seis alturas H especificados, sem edição direta da espessura total. Escolhas ainda não confirmadas não alteram a laje.
- [x] **A02** — Capa opcional tem orientação sobre o valor usual de aproximadamente 5 cm, sem inclusão automática. H de 12 cm sem capa resulta em 12 cm; com capa de 5 cm, em 17 cm; removê-la retorna a 12 cm. Entrada inválida ou soma fora dos limites impede a confirmação conjunta e preserva a configuração anterior.
- [x] **A03** — Aplicar confirma tipo, estrutura e capa em uma única operação; cancelar, desfazer/refazer e bloqueios existentes preservam a integridade. A face superior permanece na cota do pavimento, a inferior reflete a espessura total e o aviso de posicionamento continua disponível. Contorno, aberturas e alvenaria permanecem preservados.
- [x] **A04** — O popup inicial permanece inalterado. Lajes sem configuração, inclusive com espessura fora da lista H, preservam sua medida até confirmação explícita, sem tipo atribuído ou conversão automática. Configurações confirmadas sobrevivem a reabertura, transporte e cópias; dados inconsistentes são recusados sem substituir o documento válido.
- [x] **A05** — Contratos pertinentes são alinhados à implementação, com resultados técnicos registrados e aceite manual separado. Não são acrescentados cálculos estruturais, quantitativos ou custos de laje.

## Resultado

Task criada a pedido do solicitante, inicialmente sem autorização de implementação. Implementação autorizada posteriormente e concluída em 2026-11-18. Aceite manual permanece pendente.

- **A01/A02** — Propriedades oferecem os quatro tipos e seis alturas, sem espessura total editável. Capa começa ausente, sem preenchimento automático; orientação de aproximadamente 5 cm e prévia da soma. Confirmar exige configuração completa, capa positiva representável e faces dentro dos limites.
- **A03** — Configuração e espessura confirmadas em uma operação. Cancelamento, troca de seleção, desfazer/refazer para laje sem configuração, recuperação de salvamento e bloqueios de somente leitura/processamento/edição de contorno conferidos. Posição, contorno, aberturas e alvenaria preservados.
- **A04** — Criação inicial preservada, inclusive espessura livre. Laje anterior de 14,01 cm continua sem classificação até confirmação. Formato 27 armazena construction opcional e valida igualdade da soma; leitores normalizam 9–26 sem inferir dados. Transporte, reabertura remota e cópias preservam configuração; duplicação de pavimento e cópia de projeto não compartilham o objeto dos parâmetros.
- **A05** — Atualizados PRD, Caderno Técnico, Elementos construtivos, Estado/Histórico, Persistência e README. Nenhum cálculo estrutural, quantitativo ou custo de laje introduzido.

### Verificação técnica

A mudança de envelope afeta os leitores usados por todo o domínio; por isso foi executada a suíte unitária, além do recorte de interface/fluxo da laje. Não foi solicitada homologação completa de navegadores.

- Rodada unitária inicial: 543 testes aprovados, 5 falhas e 31 ignorados (149,46 s). Corrigidos o caso de envelope futuro, que passou de 27 para 28, e a cópia por valor da nova configuração. Duas falhas de execução de Bash por restrição do sandbox e o timeout da descoberta de cenários foram resolvidos em uma reexecução direcionada fora do sandbox, sem mudar timeouts ou asserções: quatro arquivos, 67 testes aprovados (6,26 s). Ao todo, 548 testes distintos aprovados e 31 ignorados pela configuração existente, sem contar repetições como cobertura adicional.
- Após preservar a mensagem de incompatibilidade dos envelopes não suportados, o arquivo de lajes passou novamente: 25 testes (0,85 s), incluindo recusa de envelope 8 com configuração nova.
- Chrome: três cenários distintos aprovados (38,1 s), cobrindo criação/fechamento/movimento/aberturas/transporte existentes, configuração conjunta, legado, capa, entrada inválida/overflow, cancelamento, histórico, reabertura remota, transporte, descarte de rascunhos e bloqueios. Na primeira rodada, corrigida a mensagem de recusa de formato incompatível no leitor; os testes novos foram ajustados para reselecionar a laje após histórico e usar Cancelar contorno no desenho aberto. Nenhuma asserção foi removida ou timeout ampliado.
- Capturas .tools/t029-properties-900.png e .tools/t029-properties-desktop.png conferidas visualmente. A lateral mantém os controles acessíveis e sem excesso horizontal na largura de 900 px.
- Typecheck, lint do recorte e conferência de diff aprovados. Logs locais: .tools/t029-unit.log, .tools/t029-unit-recheck.log, .tools/t029-unit-final.log, .tools/t029-e2e.log, .tools/t029-e2e-final.log, .tools/t029-types-final.log, .tools/t029-lint.log e .tools/t029-diff.log.

Sem commit, push ou publicação nesta execução. Verificação técnica não constitui aceite manual.
