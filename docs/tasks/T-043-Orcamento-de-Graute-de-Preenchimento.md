# T-043 — Orçamento de graute de preenchimento

**Tipo** — Implementação

**Resumo** — Estime o consumo de microconcreto pelos metros lineares de grautes verticais e horizontais, com consumos em L/m, perdas por aplicação e preço por m³ editáveis, referências na Administração e total em litros e m³.

**Execução** — Verificada

**Data de execução** — 2026-11-27

**Aceite manual** — Pendente

## Alteração e limites

Acrescentar ao Orçamento o grupo **Graute de preenchimento**, estimando o consumo de microconcreto a partir dos comprimentos de grautes verticais e horizontais existentes no projeto e dos consumos por metro linear informados pelo usuário. Manter preço do material em **R$/m³** e integrar o custo ao total dos materiais.

Decisão mais recente do solicitante: substituir integralmente o cálculo geométrico de volumes por coeficientes de consumo. Não criar campos de diâmetro dos furos, largura ou profundidade das canaletas em Configurações, nem padrões dimensionais por base de tijolo. Não calcular seções internas, volumes de cavidades, interseções volumétricas ou descontos do volume ocupado pelas ferragens. A estimativa em litros resulta de comprimento × consumo informado em L/m, acrescida das perdas da aplicação correspondente, com conversão para m³ pela divisão por 1.000.

As ferragens permanecem no grupo da T-028, com quantidades e custos próprios. O novo subtotal cobre somente microconcreto, sem acrescentar mão de obra, bombeamento, frete, fundações, lajes, ingredientes, traços ou compra por sacos. Aplicar somente as perdas próprias de cada aplicação, conforme os campos abaixo; não aplicar percentuais de tijolos ou acréscimos de aço aos comprimentos ou ao consumo.

Implementação autorizada pelo solicitante nesta conversa. Commit e push para main, com publicação pelo workflow existente, autorizados posteriormente conforme AGENTS.md.

Referências: [RF-11 do PRD](../Ecovit-PRD.md#rf-11--orçamento-quantitativos-e-arquivo-nativo), [Quantitativos](../arquitetura/Quantitativos.md), [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md), [Estado e histórico](../arquitetura/Estado-Historico-e-Operacoes.md), [Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md) e [Caderno Técnico](../Ecovit-Caderno-Tecnico.md), especialmente CT-09 e CT-10.

### Parâmetros no Orçamento

Apresentar os cinco campos no resumo do grupo, comuns ao projeto e editáveis pelo usuário:

| Campo | Unidade | Regra |
|---|---|---|
| Consumo de microconcreto — grautes verticais | L/m | Consumo base por metro, sem perdas; referência administrativa inicial de 4,22 L/m |
| Consumo de microconcreto — grautes horizontais | L/m | Consumo base por metro de canaleta, sem perdas; referência administrativa inicial de 2,56 L/m |
| Perdas — grautes verticais | % | Acréscimo sobre o consumo vertical base; referência administrativa inicial de 5% |
| Perdas — grautes horizontais | % | Acréscimo sobre o consumo horizontal base; referência administrativa inicial de 10% |
| Preço do microconcreto | R$/m³ | Preço comum ao material das duas aplicações |

Consumos devem ser positivos e aceitar até três casas decimais em L/m, sem arredondamento silencioso. Preço não negativo, com até duas casas decimais; zero válido e distinto de ausência. Aceitar ponto ou vírgula pelo padrão vigente, com validação compartilhada cliente/API e erros associados aos campos. Perdas são não negativas, com até duas casas decimais; 0% é válido e elimina o acréscimo da aplicação. Os padrões administrativos de consumo são 4,22 L/m para verticais e 2,56 L/m para horizontais; não deduzi-los da base do tijolo ou dos antigos parâmetros dimensionais. Os valores efetivos do projeto seguem a incorporação de referências descrita abaixo. Preço inicia ausente quando não houver referência aplicável.

Confirmação, prévia e bloqueios seguem os formulários orçamentários vigentes. A edição desses parâmetros atualiza a projeção financeira sem recalcular a composição da alvenaria.

### Comprimentos e consumo estimado

- **Vertical:** somar o comprimento dos intervalos finais de graute, unificando eixos e intervalos coincidentes. Respeitar alturas, vãos e inclusões/exclusões manuais, sem preencher aberturas ou ligar pavimentos. Usar comprimento de graute, não comprimento de barras com emendas, sobreposições ou ancoragens.
- **Horizontal:** somar os comprimentos nominais dos trechos finais de canaletas e meias canaletas existentes, incluindo cintas, vergas e contravergas. Contar ocupação coincidente uma vez, sem repetir demandas de origem; preservar trechos perpendiculares distintos. Não usar quantidade de barras, acréscimos de aço ou prolongamentos exclusivamente gráficos. Canaletas contribuem independentemente da ativação das armaduras horizontais.
- A estimativa soma as duas aplicações independentemente. Cruzamento de graute vertical com horizontal não gera desconto de consumo: não há cálculo de interseção física entre cavidades. Não exigir novas medidas geométricas.

Com comprimentos em metros:

`Consumo vertical base (L) = comprimento vertical × consumo vertical informado (L/m)`

`Consumo vertical estimado (L) = consumo vertical base × (1 + perdas verticais / 100)`

`Consumo horizontal base (L) = comprimento horizontal × consumo horizontal informado (L/m)`

`Consumo horizontal estimado (L) = consumo horizontal base × (1 + perdas horizontais / 100)`

`Consumo total (L) = consumo vertical estimado (L) + consumo horizontal estimado (L)`

`Consumo total (m³) = consumo total (L) / 1.000`

`Custo do microconcreto = consumo total (m³) × preço por m³`

Apresentar comprimentos, coeficientes, percentuais de perdas, consumo base e estimado por aplicação, total estimado em litros e m³ e custo. Aplicar cada percentual uma única vez ao consumo base correspondente, sem alterar comprimentos ou aplicar novamente perdas sobre o total. Oferecer detalhe por pavimento, identificado por nome e cota. O filtro existente modifica o detalhe, preservando os totais globais. Não criar preço, coeficiente ou percentual de perdas por pavimento.

Exemplo meramente aritmético, sem recomendação de consumo: 100 m verticais a 4,22 L/m resultam em 422 L base e **443,1 L com 5% de perdas**; 50 m horizontais a 2,56 L/m resultam em 128 L base e **140,8 L com 10% de perdas**. Total estimado de **583,9 L = 0,5839 m³**, com custo de **R$ 583,90** a R$ 1.000,00/m³. Duas barras em uma mesma canaleta não dobram seu comprimento ou consumo.

Nesse exemplo, as perdas acrescentam 21,1 L verticais e 12,8 L horizontais, somando 33,9 L sobre os 550 L base. Com ambas as perdas em 0%, o total seria 550 L = 0,55 m³ e o custo R$ 550,00 ao mesmo preço. Alterar a perda horizontal não modifica o consumo vertical, e vice-versa.

Usar precisão decimal exata para os coeficientes e comprimentos na escala do modelo, com limites seguros. A conversão de litros para m³ é exata (1.000 L = 1 m³), sem arredondamento intermediário; as duas apresentações do total representam o mesmo consumo. Calcular custos antes do arredondamento de apresentação do consumo, arredondando o resultado monetário final em centavos pelos contratos vigentes. Não arredondar consumos locais antes de consolidar o projeto. Detalhes usam os mesmos valores integrais do total; a apresentação em litros com duas casas pode causar diferenças na soma dos textos arredondados. Não introduzir compras ou arredondamentos para embalagens.

### Disponibilidade, total e relatório

Comprimento válido zero dispensa o coeficiente e as perdas correspondentes e gera consumo zero. Sem qualquer aplicação, consumo e custo são zero, sem exigir coeficientes, perdas ou preço. Comprimento positivo com coeficiente ausente preserva o comprimento e impede consumo base, estimado e custo daquela aplicação. Percentual de perdas ausente preserva comprimento e consumo base conhecidos, mas impede consumo estimado e custo dependentes; ausência não equivale a 0%. As parcelas independentes continuam disponíveis. Consumo positivo com preço ausente preserva o quantitativo, mantendo custo e total dependente incompletos.

Resultado ausente/desatualizado não reaparece como comprimento ou consumo atual. Composição parcial conserva essa identificação e não trata parcela desconhecida como zero. Erros de rascunho e estouros seguem os contratos vigentes, sem apresentar custo anterior como válido.

Integrar o subtotal uma única vez ao total dos materiais, às pendências e ao relatório PDF. Pendências permitem acesso ao campo pertinente do Orçamento. O PDF inclui parâmetros em L/m, perdas em %, comprimentos, consumos base e estimados por aplicação, total em litros e m³ e custo de todos os pavimentos da revisão capturada, independentemente do filtro local, preservando zero, ausência, parcialidade e indisponibilidade. Não consultar referências administrativas na exportação.

### Administração — Preços

Acrescentar o item fixo **Graute de preenchimento — microconcreto** na Administração → Preços, com os mesmos cinco campos: consumo vertical em L/m, perdas verticais em %, consumo horizontal em L/m, perdas horizontais em % e preço em R$/m³. São referências comuns aos projetos, sem dimensões de furos/canaletas ou valores específicos por base de tijolo.

Inicializar o cadastro administrativo com os padrões editáveis definidos pelo solicitante: **vertical 4,22 L/m e 5% de perdas; horizontal (canaletas) 2,56 L/m e 10% de perdas**. Esses coeficientes são consumos base, sem perdas embutidas. Não impor preço padrão. A inicialização não sobrescreve valores administrativos já definidos nem repõe limpeza intencional.

Reutilizar autorização, confirmação, validação cliente/API, conflitos, auditoria e consulta existentes. Estender o ciclo de referências da T-039 aos dois coeficientes e aos dois percentuais de perdas, permitindo referência ausente por campo. Ao abrir o Orçamento editável, incorporar somente campos nunca preenchidos e com referência disponível. Permitir valores próprios e cópia explícita da referência vigente por campo, preservando valores já incorporados e limpeza intencional. Mudanças administrativas posteriores não atualizam projetos automaticamente. Edição no projeto não cadastra nem altera automaticamente referências administrativas.

Os padrões pertencem à inicialização administrativa. O projeto recebe os valores vigentes pelo ciclo de referências, sem um segundo conjunto de padrões fixos que concorra com a Administração; uma referência de perdas em 0% também deve ser incorporada normalmente.

Somente leitura e PDF não incorporam referências. Não substituir a referência de um coeficiente ou perda ao alterar outro campo ou somente o preço. Não repor padrões no projeto quando uma referência tiver sido explicitamente limpa; orientar o preenchimento do parâmetro necessário.

### Persistência e explicação breve

Preço, coeficientes, percentuais de perdas e respectivas origens/limpezas acompanham salvamento, reabertura, desfazer/refazer, cópia do projeto e arquivo nativo. Não persistir comprimentos ou consumos derivados. Projetos legados permanecem utilizáveis; novos parâmetros ausentes seguem o ciclo normal de referências, sem gerar consumos fictícios ou alterar os demais grupos. Atualizar os contratos responsáveis durante a implementação, incluindo as fórmulas e exemplos no Caderno Técnico.

Exibir junto ao grupo do Orçamento e ao item administrativo uma explicação breve, com o mesmo sentido:

> Microconcreto é uma mistura à base de cimento, água e agregados de pequena dimensão, podendo conter aditivos, usada no preenchimento dos grautes. Informe o consumo em litros por metro linear para cada aplicação, conforme o material e o projeto adotados.

A explicação não prescreve traço, resistência ou dosagem e não apresenta os coeficientes como dimensionamento estrutural.

## Critérios de aceite

- [x] **A01** — Orçamento permite informar separadamente consumos vertical e horizontal em L/m, perdas independentes em % e preço comum em R$/m³, com validação, prévias e confirmação; não há novas configurações dimensionais nem padrões por base de tijolo.
- [x] **A02** — Comprimentos verticais e horizontais derivam dos elementos finais existentes, respeitam vãos e ajustes, sem duplicar trechos coincidentes ou multiplicar por barras de aço; a estimativa segue comprimento × coeficiente × (1 + perdas / 100), sem cálculos de cavidades ou descontos entre aplicações.
- [x] **A03** — Comprimentos, perdas, consumos base e estimados por aplicação, total estimado em litros e m³ e custo estão disponíveis no resumo e detalhe por pavimento; o subtotal integra uma vez o total dos materiais, com estados corretos para ausência, zero, parcialidade e indisponibilidade.
- [x] **A04** — Administração → Preços oferece os dois consumos em L/m, suas perdas em % e o preço em R$/m³, com padrões editáveis de 4,22 L/m e 5% para verticais e 2,56 L/m e 10% para horizontais; referências, valores próprios e limpezas seguem o ciclo por campo, sem sobrescrita automática.
- [x] **A05** — Explicação breve do material e do uso dos coeficientes disponível no Orçamento e na Administração, sem recomendação de traço ou dimensionamento.
- [x] **A06** — Dados e origens persistem pelos fluxos vigentes; pendências e PDF refletem os parâmetros e resultados corretos, sem resultados antigos ou arredondamentos intermediários que alterem o custo global.

A02–A04 incluem a conferência dos exemplos acima: consumos base sem perdas embutidas, acréscimo aplicado uma única vez à aplicação correta, independência dos percentuais, 0% válido e conversão do total estimado para m³ antes de calcular o custo. Padrões administrativos não substituem valores próprios nem limpezas intencionais no projeto.

O antigo A07, sobre confirmação da geometria de interseção, foi retirado por substituição explícita do escopo pelo solicitante; não representa critério executado ou aprovado. A01–A06 foram reformulados para o modelo de consumo por metro linear, preservando os IDs para rastreabilidade.

## Resultado

Implementação concluída em 27/11/2026. Aceite manual permanece pendente. Commit e push solicitados posteriormente; a publicação segue o workflow existente.

- **A01/A02** — Grupo Microconcreto integrado ao Orçamento, com parâmetros em L/m, perdas independentes e preço em R$/m³. Comprimentos verticais unificam intervalos/eixos finais; horizontais reutilizam os trechos nominais compartilhados com as armaduras, independentemente de sua ativação ou quantidade de barras. Nenhum parâmetro dimensional novo.
- **A03** — Resumo, detalhe por pavimento, total dos materiais e pendências integrados. Cálculos inteiros exatos preservam base, estimado, zero, ausência, parcialidade e limites. Valores exibidos conservam os decimais necessários para parcelas pequenas e somas coerentes. Rateio monetário por pavimento concilia centavos com o subtotal global.
- **A04** — Cinco referências independentes integradas à Administração e ao ciclo de incorporação/cópia/limpeza. Migração SQL 006 inicializa consumos e perdas sem preço ou sobrescrita de registros anteriores. Defaults confirmados: vertical 4,22 L/m + 5%; horizontal 2,56 L/m + 10%.
- **A05/A06** — Explicação compartilhada entre telas; PDF usa os mesmos componentes da revisão capturada. Formato 39 persiste parâmetros e origens, com migração de legados sem dados fictícios, rejeição de campos novos em envelopes anteriores e cópia independente. Contratos atualizados nos documentos responsáveis.

Validação ampliada para domínio, formatos, API e dois fluxos de Chrome pelo impacto em cálculo, persistência, autorização, referências administrativas e PDF. Conferências efetivamente realizadas:

- Domínio e regressões de canaletas/ferragens/referências/pendências aprovados por recortes, com correções de fixtures e expectativas de total para incluir o novo grupo; recortes afetados reexecutados após os ajustes. Logs: .tools/logs/t043-unit.log, t043-unit-final.log e t043-precision.log. O último recorte tem 15 cenários aprovados em 1,10 s, incluindo apresentação exata de pequenas parcelas e relatório compartilhado.
- Formatos: 78 cenários aprovados em 2,17 s, com o novo teste incluído em test:formats. Log: .tools/logs/t043-formats.log.
- API T-043 e migração: 2 cenários aprovados em 3,46 s; regressões completas do arquivo de migrações: 15 aprovadas em 3,24 s. Logs: .tools/logs/t043-api.log e t043-migrations.log. Somente PostgreSQL ecovit_test; nenhum dado do aplicativo usado para teste.
- Chrome: 2 fluxos aprovados em 20 s no servidor próprio da 5174: incorporação/edição de perdas, composição preservada, download PDF e manutenção administrativa independente. Log: .tools/logs/t043-browser.log. Capturas t043-budget.png e t043-admin.png conferidas visualmente em 900 × 680; a posterior correção restrita à precisão textual foi coberta pelo teste específico, sem repetir os fluxos preservados.
- Build com verificações de tipos e lint aprovados. Logs: .tools/logs/t043-build.log e t043-lint.log. O build manteve o aviso de tamanho dos chunks, sem erro de compilação. Revisão final por diff, referências e inspeção dos campos.

O primeiro preparo de API não identificou o processo já existente devido à restrição de processos do sandbox. A instância foi identificada pelo PID/porta e pelo diretório gerenciado e o preparo foi repetido uma vez com permissão de execução adequada, com sucesso; nenhum servidor desconhecido foi encerrado. Logs: .tools/logs/t043-env.log e t043-env-retry.log. Porta 5173 preservada.

A migração 006 foi validada nos bancos isolados de teste. Consulta posterior, somente leitura, ao histórico do banco configurado do aplicativo confirmou as migrações 001–006 aplicadas, sem pendências; essa consulta não alterou o banco.

### Ajuste posterior — apresentação do microconcreto

Pedido posterior à entrega inicial: organizar a tabela de parâmetros em duas colunas de campos, com consumo e perda de cada aplicação lado a lado, preço na primeira coluna da última linha e controle de referência à direita do valor. Exibir duas casas decimais fixas nos consumos vertical/horizontal em L/m, consumo base/com perdas em litros e total estimado em litros, no Orçamento e no PDF compartilhado. Administração e apresentação de comprimentos/m³ conservam o comportamento vigente. A precisão persistida e o cálculo integral dos custos/consumos permanecem; a exibição arredondada em litros substitui a apresentação exata registrada na entrega inicial. Aceite manual deste ajuste permanece pendente.

Validação do ajuste: 15 testes de domínio/relatório aprovados em 1,16 s; um fluxo específico no Chrome aprovado em 22,9 s, com conferência da tabela de duas colunas e da seta alinhada horizontalmente ao campo. Captura em 900 × 680 inspecionada visualmente. Lint dos arquivos alterados e diff sem erros. O recorte de navegador foi necessário para conferir largura e alinhamento dos controles na tabela reorganizada. Logs: .tools/logs/t043-adjust-unit.log, t043-adjust-browser.log e t043-adjust-lint.log. Precisão dos dados/custos preservada nos testes; a apresentação em litros segue as duas casas solicitadas.
