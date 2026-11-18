# T-026 — Configurar armadura das canaletas por pavimento

**Tipo** — Implementação

**Resumo** — Permite definir a quantidade e o diâmetro dos ferros das canaletas por pavimento, com padrão de duas barras de 8 mm, compartilhado entre cintas, vergas e contravergas, salvo no projeto e visível na Fiada.

**Execução** — Verificada

**Data de execução** — 2026-11-18

**Aceite manual** — Confirmado pelo solicitante

**Data do aceite manual** — 2026-11-18

## Alteração e limites

Implementar armaduras longitudinais nominais nas canaletas existentes. Adicionar uma configuração única nas Propriedades do Pavimento, em seção **Armadura das cintas**, próxima de grautes e grampos, usando o painel recolhível existente.

Conforme decisão do solicitante em 2026-11-18, **vergas e contravergas usam exatamente a mesma configuração das cintas**. Não criar grupos, perfis, substituições por categoria ou parâmetros independentes para elas. A seção deve explicar que seus valores se aplicam a todas as canaletas daquele pavimento, inclusive as automáticas junto aos vãos.

A configuração fica salva no projeto, é independente entre pavimentos e aparece no canvas em modo Fiada. Implementação autorizada pelo solicitante em 2026-11-18; commit, push e publicação não foram solicitados nesta execução.

### Campos e padrões

| Campo | Comportamento | Padrão inicial |
|---|---|---|
| Ativar armadura das canaletas | Liga/desliga a geração nominal no pavimento, preservando os parâmetros | Desativado |
| Quantidade de barras longitudinais | Inteiro positivo, editável; mesmo valor para todas as canaletas do pavimento | 2 |
| Diâmetro das barras | Em mm, positivo, editável, com precisão de 0,1 mm | 8,0 mm |

Cada barra usa o diâmetro informado. Não criar composição com bitolas diferentes no mesmo conjunto nesta entrega. Não oferecer uma programação adicional de fiadas: as barras acompanham as faixas de canaleta efetivamente existentes, nos níveis e nos vãos definidos pelos contratos atuais. Os níveis globais de canaletas continuam nas Configurações do Projeto, sem mudança de alcance ou referência vertical.

Usar confirmação conjunta dos campos, com prévia textual do conjunto (por exemplo, `2 barras de Ø 8 mm`) e indicação explícita de aplicação a cintas, vergas e contravergas. Rejeitar quantidade zero, negativa, fracionária ou não representável e diâmetro nulo, negativo, não finito ou com precisão superior à aceita. Aceitar vírgula ou ponto no diâmetro, sem arredondar silenciosamente. Entrada inválida não substitui a configuração confirmada. Controles respeitam busy, somente leitura e bloqueios de edição existentes.

Novos projetos, novos pavimentos independentes e documentos anteriores sem esse campo começam com armadura desativada e os padrões 2/8 mm disponíveis no formulário. Ativar exige confirmação do usuário; não gerar ferragens em projetos antigos por simples abertura. Desativar não apaga quantidade e bitola. Restaurar os padrões globais de canaletas não modifica esta configuração local.

### Fontes e significado do padrão

- [Manual de construção Ponto Eco — Canaletas](https://tijolo.eco.br/manual_construcao_tijolo_ecologico/): apresenta dois ferros horizontais nas canaletas e atribui a especificação estrutural ao responsável técnico.
- [Cartilha Eco Produção hospedada pela Jarfel/Sahara](https://www.jarfel.com.br/pdf-jarfel-sahara/cartilha-eco-producao.pdf), página PDF 10 (impressas 18–19): cita vergalhão de 8 mm nas canaletas da cinta de amarração.

O padrão **duas barras de 8 mm** é uma preferência nominal de cadastro escolhida para o Ecovit a partir dessas referências e confirmada pelo solicitante, não uma prescrição normativa universal. A configuração compartilhada com vergas e contravergas é uma decisão de produto; as fontes não demonstram que esse conjunto seja suficiente para qualquer vão, apoio ou carga.

Não atribuir automaticamente classe de aço, resistência, cobrimento, espaçamento físico entre barras ou dimensões internas do canal. O catálogo atual fornece envelopes e canais esquemáticos, sem seção interna suficiente para conferir acomodação física. Mostrar que a representação não substitui o detalhamento estrutural.

### Geração e preservação das canaletas existentes

Usar exclusivamente as canaletas e meias canaletas finais da composição vigente, após demandas globais/de vãos, união e supressões de CT-09. A armadura não cria canaleta, não aumenta sua extensão, não muda a paginação, não preenche abertura e não restaura faixa removida manualmente.

Aplicar o mesmo conjunto à canaleta de nível, à faixa acima do vão e à faixa abaixo do vão. Se não houver faixa acima/abaixo pelas condições existentes de altura/base, não acrescentar aço ali. O resultado da armadura é derivado da configuração e da geometria atual; não persistir barras geradas como intenção independente ou conservar comprimentos antigos após uma edição.

Tratar os trechos retilíneos pela orientação das faixas hospedeiras e ocupação realmente tipada como canaleta. Trechos adjacentes e colineares sem lacuna podem formar uma representação contínua; abertura, supressão ou fim de canaleta interrompe o trecho. Não ligar intervalos separados por vazio ou material comum.

Deduplicar trechos coincidentes no mesmo pavimento, fiada e direção, preservando as origens e paredes associadas: uma canaleta solicitada simultaneamente por nível e por vão recebe o conjunto uma vez. Divisão de uma parede em entidades contíguas ou inversão do sentido de desenho não pode multiplicar barras sobrepostas. Barras em direções perpendiculares são conjuntos distintos; não confundir o cruzamento gráfico com uma ligação metálica executada.

Nos encontros L/T/cruz, representar os percursos incidentes conforme os trechos existentes e manter a indicação de conexão nominal. Não inventar dobras, soldas, ancoragens, emendas ou transpasses para transformar esses percursos em uma peça física contínua. Conexão física e detalhamento de fabricação ficam para evolução futura. A quantidade de barras é a de cada seção do trecho, não uma quantidade de peças comerciais prontas para compra.

Se a composição do componente estiver indisponível, não desenhar aço onde não há canaleta calculada. Preservar a intenção e os diagnósticos existentes, sem substituir a ausência de resultado por comprimento zero confirmado. Resultado desatualizado/em processamento não pode mostrar armaduras antigas como atuais. Ausência legítima de canaleta em uma fiada não é, por si só, erro ou insuficiência estrutural.

### Visualização e identificação na Fiada

No canvas em modo **Fiada**, desenhar a armadura apenas nos trechos de canaleta da fiada ativa, com linhas longitudinais distinguíveis dos canais, grautes e grampos. Para o padrão inicial, mostrar duas linhas paralelas esquemáticas ao longo de cada trecho. Quantidades diferentes precisam de representação e identificação coerentes, sem confundir espessura de traço ou afastamento gráfico com bitola/cobrimento físicos. Não aumentar a peça para acomodar as linhas.

As barras devem permanecer perceptíveis nos limites de zoom existentes; a identificação textual é a referência para quantidade e bitola quando não houver espaço para separar todos os traços. Identificação por hover e alternativa acessível por teclado na inspeção informam pavimento, fiada, quantidade, diâmetro e trecho hospedeiro. Incluir o comprimento geométrico nominal do trecho quando disponível, claramente separado de comprimento de corte/fabricação e sem somar categorias coincidentes.

Comprimento nominal refere-se à extensão retilínea efetivamente coberta pela faixa de canaletas, pelas suas faces inicial/final; não descontar ou acrescentar valores de ancoragem, ganchos, transpasses ou dobras. Exemplo: trecho reto contínuo de quatro canaletas de 25 cm tem extensão nominal de 100 cm; no padrão 2/8 mm, a identificação informa duas barras de Ø8 nesse trecho de 100 cm. Isso não define duas peças de corte prontas para obra nem autoriza somar aço comercial.

Em Planta, preservar a apresentação atual, sem sobrepor armaduras de todas as alturas. Não desenhar barras da fiada de referência como se pertencessem à fiada ativa. Preservar navegação, seleção de paredes/faixas, remoção/restauração de canaletas, ferramenta de graute, pan e zoom. Hover e consulta não produzem gravação ou histórico.

### Persistência, histórico e operações de pavimentos

Persistir ativação, quantidade e diâmetro por pavimento no documento remoto e no arquivo nativo `.ecovit`. Diâmetro usa a representação inteira da precisão de 0,1 mm; quantidade é inteira positiva, com conferência dos limites numéricos e de integridade existentes. Não persistir traços de canvas, posições de legenda ou cópias desnecessárias da geometria derivada.

Confirmar alteração salva pelo fluxo existente, registra uma operação e atualiza o resultado derivado. Desfazer/refazer restaura a configuração e sua representação correspondente. Alterar esses parâmetros não modifica tijolos, canaletas, grautes, grampos ou seus ajustes. A contagem e o orçamento vigente de tijolos permanecem iguais.

Falha de persistência conserva o candidato em memória, informa que não foi salvo e mantém a recuperação existente; não anunciar confirmação nem apagar campos silenciosamente. Respeitar os bloqueios durante envio/processamento e somente leitura. Configuração não aplicada é rascunho do formulário, não dado confirmado do projeto.

Fechar/reabrir, transportar e importar preservam os parâmetros confirmados. Duplicar projeto preserva a configuração; duplicar pavimento copia os dados por valor, sem vínculo com a origem; criar pavimento independente usa os padrões desativados. Excluir pavimento remove somente sua configuração e desfazer a exclusão a restaura. Troca de pavimento carrega seus próprios valores, sem transferir rascunhos de um andar para outro.

Na implementação, definir contrato estrito de dados e a evolução necessária do formato/leitor e do resultado derivado. Projetos anteriores continuam íntegros e desativados; valores/tipos desconhecidos e novos campos disfarçados em envelopes antigos são recusados antes de substituir o projeto aberto. Preservar IDs, configurações de grampos/grautes, preços e ajustes existentes. Normalização não modifica a fonte. Não criar migração SQL se os campos puderem permanecer no documento remoto existente.

### Fora do escopo e contratos a atualizar

Não implementar perfis diferentes de armadura para vergas/contravergas, edição individual de barras, estribos, ganchos, dobras físicas, transpasses, comprimento de ancoragem, corte/dobra para fabricação, conferência de seção interna, dimensionamento por cargas ou compatibilização física com grampos/grautes. Não acrescentar peso, preço, perdas, barras comerciais, novas tabelas de aço no Orçamento ou exportações de ferragens nesta entrega.

Atualizar na implementação, mantendo cada regra em seu documento responsável e preservando IDs e aceites históricos:

- [PRD](../Ecovit-PRD.md): configuração única de armadura por pavimento, uso compartilhado e visualização na Fiada.
- [Caderno técnico](../Ecovit-Caderno-Tecnico.md): extensão de CT-09 para barras nominais, exemplos, deduplicação, limites de fontes e separação entre trecho geométrico e fabricação.
- [Motor e diagnósticos](../arquitetura/Motor-e-Diagnosticos.md): derivação sobre canaletas finais, continuidade retilínea, atualidade e preservação dos demais resultados.
- [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md): seção no painel recolhível existente, campos, identificação acessível e desenho distinto; reusar controles e catálogo de ícones.
- [Estado, histórico e operações](../arquitetura/Estado-Historico-e-Operacoes.md): confirmação, cópias/pavimentos, desfazer/refazer e falha/recuperação.
- [Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md): representação, integridade, normalização e formatos/resultados anteriores.
- [Quantitativos](../arquitetura/Quantitativos.md): preservar o alcance atual da consulta e orçamento de tijolos, sem incluir aço por esta task.

## Critérios de aceite

- [x] **A01** — Propriedades do Pavimento oferece uma única seção de armadura das cintas, com ativação, quantidade e diâmetro, padrões 2/8 mm e indicação de que vergas/contravergas usam os mesmos valores. Não existem perfis separados ou nova programação de fiadas; recolhimento do painel é preservado.
- [x] **A02** — Campos válidos são confirmados em conjunto; quantidade fracionária/não positiva e diâmetro inválido ou não representável são recusados sem gravação/arredondamento silencioso. Projetos antigos e novos pavimentos começam desativados e sem afetar a composição ao abrir.
- [x] **A03** — A armadura acompanha somente as canaletas/meias canaletas finais, com orientação correta, interrupção por vãos/supressões e deduplicação de demandas coincidentes/entidades contíguas. Alterar a configuração não muda tijolos, faixas, grautes, grampos ou orçamento de tijolos.
- [x] **A04** — Fiada mostra e identifica o conjunto da fiada ativa, com quantidade, Ø e trecho nominal; padrão de duas barras é visualmente distinguível. Navegação/edição existentes permanecem utilizáveis; Planta, referência e resultado desatualizado não mostram armadura antiga como atual.
- [x] **A05** — Configurações sobrevivem ao salvamento remoto, reabertura, arquivo, importação e cópia. Pavimentos são independentes; duplicação/exclusão/desfazer preservam os parâmetros conforme seu alcance. Leitores recusam dados inválidos e preservam a intenção dos projetos anteriores.
- [x] **A06** — Confirmação, desfazer/refazer, bloqueios e falha/recuperação mantêm dados e histórico coerentes; consultar/identificar/navegar não salva. Representação e identificação não alegam conexão física ou comprimento de fabricação.
- [x] **A07** — Contratos pertinentes registram a configuração compartilhada, fontes e limites do padrão nominal, compatibilidade e resultados reais da execução, preservando os aceites anteriores e o alcance do Orçamento.

## Resultado

Código implementado em 2026-11-18: formulário único nas Propriedades do Pavimento, configuração opcional local com padrões 2/8 mm e confirmação conjunta, derivação de trechos sobre canaletas finais, renderização em linhas paralelas na Fiada, hover e identificação textual acessível. Configuração participa das operações de pavimento e histórico existentes. Formato nativo 24, leitores 9–24 e resultado nominal-v13; snapshots anteriores são descartados para recomposição, sem mudar intenção, grautes, grampos, preços ou ajustes. Representação remota e SQL mantêm suas versões. Contratos pertinentes atualizados.

Conferência técnica: 95 testes de armadura/canaletas/grampos/pavimentos/quantitativos/orçamento aprovados, incluindo os 12 testes novos; outros 221 testes selecionados de compatibilidade e operações de documentos aprovados. Tipos de frontend/servidor, lint do código afetado e conferência do diff aprovados. A ampliação se deve ao novo campo por pavimento e à atualização do leitor compartilhado. Logs locais ignorados: `.tools/t026-domain.log`, `.tools/t026-compatibility.log`, `.tools/t026-types.log`, `.tools/t026-lint.log` e `.tools/t026-diff-check.log`.

**Impedimento inicial, superado na conferência seguinte:** o preparo existente informou ambiente pronto (Node 24, PostgreSQL 18 isolado, Chrome e portas 5174/3002 livres), mas o webServer do Playwright não ficou disponível dentro de seus 60 segundos. Naquela tentativa, nenhum dos dois cenários chegou a executar e o diagnóstico limitado não identificou causa reversível. Evidência histórica em `.tools/t026-environment.log` e `.tools/t026-e2e.log`.

Após pedido explícito de investigação em 2026-11-18, o servidor voltou a iniciar e o timeout inicial não se reproduziu; não foi possível atribuir sua causa histórica com os logs anteriores. Acrescentados registros de tempo por etapa (schema/migrações, API, frontend e transformação de módulos) ao servidor isolado e habilitada a saída de stdout no runner, sem expor credenciais, ampliar timeouts ou alterar o servidor de desenvolvimento/produção. Os novos registros permitem localizar a etapa caso o incidente reapareça.

Na primeira execução efetiva, o cenário de recuperação passou e o cenário de interface identificou uma diferença de rasterização: o traço de 1,8 px não produzia núcleo de cor sólida no alinhamento usado pelo canvas (RGB observado 122/82/168, em vez de 107/63/160), embora as duas barras estivessem visíveis. Corrigido o traço nominal para 2 px, preservando geometria, quantidade, asserções e limites de tempo do teste. O diagnóstico temporário de cores foi removido.

**Validação final no Chrome:** dois cenários aprovados em 25,1 segundos, com servidor pronto em 5,6 segundos. A01/A04/A06 concluídos: configuração comum a cintas/vergas/contravergas, independência entre pavimentos, desfazer/refazer, recusa de valor inválido sem gravá-lo, barras reais no canvas nas fiadas corretas, ausência em outras fiadas/Planta, arquivo, reabertura remota, recolher/reabrir painel e falha/recuperação de salvamento. Capturas `.tools/t026-propriedades.png` e `.tools/t026-fiada.png` conferidas visualmente. Tipos de frontend/servidor e lint do recorte corrigido aprovados. Evidências em `.tools/t026-server-investigation.log`, `.tools/t026-render-diagnosis.log`, `.tools/t026-e2e-final.log`, `.tools/t026-final-types.log` e `.tools/t026-final-lint.log`. A task foi tecnicamente verificada nessa etapa; o aceite manual foi confirmado posteriormente, conforme registro abaixo.

Para conferir no ambiente local do solicitante, reiniciar `./Start-Ecovit.ps1 -Task dev` e reabrir o projeto, carregando o leitor 24. Nenhum processo do solicitante na porta 5173 foi alterado.

## Aceite manual — 2026-11-18

Confirmado explicitamente pelo solicitante nesta data: “A T-026 está aprovada.” A aprovação abrange a entrega do commit 4a41391. As datas de execução e as evidências técnicas anteriores permanecem preservadas.
