# T-025 — Configurar grampos dos encontros por pavimento

**Tipo** — Implementação

**Resumo** — Permite programar grampos entre os grautes dos encontros por pavimento, escolhendo fiadas por intervalo ou lista, diâmetro do ferro e comprimento nominal de cada peça, com configurações salvas no projeto.

**Execução** — Verificada

**Data de execução** — 2026-11-17

**Aceite manual** — Confirmado pelo solicitante

**Data do aceite manual** — 2026-11-18

## Alteração e limites

Implementar a proposta visual discutida em 2026-11-17: cada ligação entre dois furos grauteados recebe uma peça independente, representada por um trecho horizontal e duas pontas dobradas para baixo, em U invertido na vista lateral. Em planta, essas peças compõem os conjuntos em L, T e cruz. Implementação autorizada pelo solicitante em 2026-11-17; commit, push e publicação não foram solicitados nesta execução.

Usar a revisão vigente de CT-10: T simples com dois grautes, centro e primeiro furo da haste; Reforçado com três furos no L, quatro no T e cinco na cruz. Não modificar a distribuição dos grautes para acomodar grampos. A configuração é independente por pavimento, fica nas Propriedades do Pavimento e é salva como intenção do projeto.

### Ligações e formato nominal

Considerar C o centro, D/E os vizinhos à direita/esquerda, A/B os vizinhos acima/abaixo. O T de referência tem haste para B; rotações e reflexões transformam as ligações junto com a geometria.

| Encontro e modalidade | Ligações | Peças por encontro em cada fiada programada |
|---|---|---|
| L simples | Nenhuma: só C está grauteado | 0 |
| T simples | C–B | 1 |
| Cruz simples | Nenhuma: só C está grauteado | 0 |
| L reforçado para direita/baixo | C–D e C–B | 2 |
| T reforçado com haste para baixo | C–E, C–D e C–B | 3 |
| Cruz reforçada | C–A, C–B, C–E e C–D | 4 |

Cada linha entre dois furos é uma peça separada; não fabricar uma peça única com três ou quatro braços, nem pressupor solda entre grampos no centro. O formato nominal é o mesmo para todos; sua orientação horizontal acompanha o par de furos. Não criar ligação diagonal, ligação entre pavimentos, grampo entre grautes intermediários de uma reta ou ligação adicional por proximidade.

Reconhecer o encontro na geometria ativa da fiada, seguindo CT-05/10/12/14, sem classificar pela quantidade/ordem dos IDs das paredes e sem combinar braços existentes em alturas diferentes. A criação de grautes manuais fora do padrão não cria novas ligações automaticamente. Ajustes manuais podem suprir ou retirar os eixos das ligações já previstas para o encontro e a modalidade selecionada.

### Diâmetro, comprimento total e padrões iniciais

Usar os seguintes campos, comuns a todos os grampos daquele pavimento, sem configurações individuais por ocorrência nesta entrega:

| Campo | Unidade e comportamento | Padrão inicial |
|---|---|---|
| Diâmetro do ferro | mm; editável, positivo, com precisão de 0,1 mm | 8,0 mm |
| Comprimento nominal de cada grampo | cm; editável; inclui trecho horizontal e as duas pontas | `m + 20 cm` |
| Comprimento de cada ponta para baixo | cm; informação derivada, não outro campo independente | 10 cm inicialmente |

`m` é a distância nominal entre os centros dos dois furos adjacentes, igual à largura-base do tijolo. Não confundir diâmetro do ferro com comprimento de ponta ou espessura de parede.

Adotar pontas simétricas e a convenção explícita:

`L = m + 2p`, em que L é o comprimento total nominal de uma peça e p é o comprimento de cada ponta para baixo. Ao editar L, manter o trecho horizontal m e recalcular p = (L − m)/2. Mostrar essa decomposição junto ao campo para deixar claro que o total já contém ambas as pontas. Não multiplicar o comprimento pelo número de grampos na identificação de uma peça.

Exemplos independentes: base 25 × 12,5 cm → L inicial 32,5 cm = 12,5 + 10 + 10; base 30 × 15 cm → L inicial 35 cm = 15 + 10 + 10. Para m=12,5 cm, editar L para 40,5 cm produz duas pontas de 14 cm. Diâmetro não altera o espaçamento nominal dos eixos nem o valor de L nesta convenção.

Persistir diâmetro e comprimento nominal total conforme a precisão inteira das unidades do projeto, sem números não finitos ou arredondamento silencioso. Aceitar vírgula/ponto na entrada; validar L > m e p positivo e representável em 0,1 mm. Se a divisão das pontas não for representável, informar a precisão aceita sem substituir o valor digitado por outro. Valores inválidos não confirmam nem substituem a configuração anterior. A conferência de operações/comprimentos derivados respeita os limites numéricos existentes.

**Origem dos padrões:** a [cartilha Eco Produção hospedada pela Jarfel/Sahara](https://www.jarfel.com.br/pdf-jarfel-sahara/cartilha-eco-producao.pdf), página PDF 9 (impressas 16–17), apresenta ligação por grampos e cita ferro de 8 mm. O valor inicial de 8 mm é uma preferência editável de cadastro; não é um mínimo universal. As pontas de 10 cm são um padrão nominal de produto definido nesta task a pedido do solicitante, sem comprovação de ancoragem e sem atribuição à cartilha. Não importar a periodicidade de construção da fonte como regra automática.

L é um comprimento esquemático de três segmentos. Não apresentá-lo como comprimento de corte/fabricação: não inclui modelagem dos arcos de dobra, raio de mandril, compensações de dobramento, cobrimento, ganchos adicionais ou folgas físicas. Mostrar na configuração que dimensões e distribuição são nominais e não substituem o detalhamento estrutural. Não deduzir classe do aço ou capacidade resistente a partir do diâmetro. Modelagem física de fabricação fica para evolução futura documentada.

### Programação das fiadas

Adicionar a seção Grampos dos encontros no painel recolhível existente de Propriedades do Pavimento, preservando o estado de recolhimento. Permitir ativar/desativar a geração sem apagar a configuração. Novos pavimentos/projetos e projetos antigos sem o campo começam com grampos desativados, diâmetro/comprimento nos padrões acima e nenhuma programação pronta para gerar; não assumir periodicidade estrutural.

Oferecer duas formas alternativas, aplicadas somente ao pavimento editado:

- **Por intervalo:** primeira fiada, repetir a cada N fiadas e última fiada, todos inteiros positivos. Exigir primeira ≤ última e N ≥ 1. Gerar primeira + kN enquanto o resultado for ≤ última; não acrescentar a última se ela não estiver na sequência.
- **Por lista:** números de fiadas separados por vírgula, todos inteiros positivos. Aceitar espaços, ordenar e eliminar repetição sem multiplicar peças. Recusar tokens inválidos, decimais, negativos ou números fora do alcance do pavimento. Uma lista vazia é permitida enquanto desativado, mas impede ativar/aplicar uma programação habilitada.

Mostrar uma prévia das fiadas resultantes antes de aplicar. Em intervalo, primeira=5, N=4, última=14 gera 5,9,13; a lista `13, 5, 9, 9` gera o mesmo conjunto. São exemplos de interface, não espaçamento recomendado.

Limite da programação: maior número de fiada completa alcançado pelas paredes do pavimento, conforme CT-02/14. Não usar altura padrão de uma nova parede como altura de todas as paredes existentes. Pavimento sem parede completa pode conservar configuração desativada; não oferece programação habilitada válida. Se a geometria for reduzida depois de salvar e deixar fiadas fora do alcance, conservar a intenção, indicar os números não aplicados e não deslocar, truncar ou reescrever silenciosamente a programação.

Ao trocar o modo, preservar o conjunto de fiadas atual: intervalo → lista copia a sequência; lista → intervalo só converte quando a sequência é aritmética (um único número admite primeira=última e N=1). Para lista irregular, solicitar nova definição de intervalo antes de aplicar; não aproximar silenciosamente a seleção. Persistir apenas o modo e sua programação confirmada, sem dois conjuntos conflitantes.

O número N refere-se ao pavimento local: **sobre a fiada N**, com cota nominal `Z + N×h`, onde Z é o nível do pavimento e h a altura-base. As pontas descem a partir dessa cota. Em Fiada N, exibir os grampos programados sobre N, sem reiniciar a contagem em mudanças de altura ou de fase.

### Elegibilidade, alturas e pendências

Gerar grampos depois de resolver composição, vãos, canaletas e grautes finais. Uma ligação só é aplicada se ambos os eixos previstos estiverem efetivamente grauteados e houver intervalo contínuo de graute/alvenaria em cada eixo cobrindo a descida nominal das respectivas pontas. Considerar o intervalo de descida [Z+N×h−p, Z+N×h), sem conectar trechos separados por abertura.

Furo excluído manualmente, vazio, falta de comprimento vertical para a ponta ou resultado construtivo indisponível impede a ligação correspondente. Identificar a pendência por pavimento, encontro, fiada e motivo, mantendo as demais ligações elegíveis. Não criar graute, alterar janela/parede, encurtar ponta, usar outro furo ou mudar fiada para compensar. Restaurar o alvo válido permite a aplicação da configuração salva. L/cruz simples, que não preveem ligação, não são pendência só por não gerarem grampos.

Fiadas acima do fim de um encontro não prolongam suas paredes: respeitar o encontro realmente existente naquela fiada. Resultados ausentes/desatualizados não podem apresentar grampos antigos como atuais. Conservar a política vigente de componente sem composição quando o motor detectar conflito; não resolver uma pendência de paginação pelo desenho de um grampo.

Unificar uma mesma ligação física pelo pavimento, fiada e par de eixos não orientado, preservando suas origens. Não desenhar nem contar duas vezes C–D/D–C. Peças que apenas compartilham C continuam distintas. A incidência esquemática no centro não comprova que várias barras caibam no furo; não inventar deslocamentos verticais para evitar colisão.

### Interface, salvamento e histórico

Na Fiada, distinguir grampos de graute, parede e canaleta, com orientação e identificação acessível. Mostrar fiada, diâmetro, comprimento total nominal e decomposição das pontas na identificação da ligação, sem espessar fisicamente o tijolo ou o furo para acomodar a barra. O traço deve permanecer perceptível no zoom, sem representar seu peso gráfico como diâmetro físico em escala. A Planta geral preserva a apresentação atual; não sobrepor todas as alturas de grampos em um único desenho. Não introduzir editor manual de peças individuais nesta entrega.

As configurações confirmadas participam do fluxo existente de salvamento, falha/recuperação e desfazer/refazer. Respeitar busy/somente leitura, sem fechar o painel ou perder campos por falha de persistência. Apenas consultar ou navegar fiadas não salva. Alterar grampos não muda peças de tijolo, paginação, fases, grautes ou canaletas; novos resultados derivados obedecem ao fluxo de recálculo e atualidade.

Persistir a configuração por pavimento no documento remoto e no arquivo nativo .ecovit. Manter valores ao reabrir, importar e copiar projeto. Criar pavimento independente usa os padrões desativados, duplicar copia configuração por valor e excluir remove só a configuração do pavimento excluído, com restauração por desfazer. Não compartilhar mutações entre cópia/origem.

Na implementação, definir contrato estrito de dados, versão de formato/leitores e normalização compatível quando necessários; preservar intenção e fonte dos formatos anteriores. Valores e combinações inválidas devem ser recusados antes de substituir o projeto aberto. Campos novos em formatos antigos não podem ser aceitos por ignorância silenciosa. Resultados derivados incompatíveis devem ser descartados/recompostos conforme o contrato existente, sem reinterpretar snapshot antigo como atual. Não acrescentar migração SQL se os campos couberem no documento remoto existente.

### Fora do escopo e contratos responsáveis

Não acrescentar orçamento de aço, preços, peso, aproveitamento de barras comerciais, perdas de corte, exportação de ferragens, laudo de resistência, verificação física de ancoragem ou liberação de fabricação. O comprimento de cada peça solicitado fica disponível na configuração/identificação; novas tabelas de quantitativos de aço dependem de pedido específico.

Na implementação, atualizar os contratos pertinentes, preservando IDs, aceites históricos e a separação entre produto vigente e evolução futura:

- [PRD](../Ecovit-PRD.md): grampos por pavimento, dimensões nominais editáveis e alcance da visualização.
- [Caderno técnico](../Ecovit-Caderno-Tecnico.md): CT-05/10/12/14, forma esquemática, identidade das ligações, cota, pontas, fontes e limitações. Não apagar o aceite histórico do M2 nem transformar convenções em aprovação estrutural.
- [Motor e diagnósticos](../arquitetura/Motor-e-Diagnosticos.md): geração após grautes, elegibilidade, alturas, deduplicação, pendências e atualidade.
- [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md): painel existente, programação, campos, representação e acessibilidade; reusar controles/ícones do catálogo.
- [Estado, histórico e operações](../arquitetura/Estado-Historico-e-Operacoes.md): confirmação, desfazer/refazer, falha e operações de pavimentos.
- [Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md): configuração, integridade e leitura de projetos anteriores.

## Critérios de aceite

- [x] **A01** — Os encontros completos produzem as ligações e quantidades da tabela, com rotações/reflexões e sem alterar grautes ou paginação. L/cruz simples não geram grampos nem pendência indevida.
- [x] **A02** — Propriedades do Pavimento permite ativar/desativar e programar por intervalo ou lista, com prévia, validação e troca de modo sem mudar silenciosamente o conjunto de fiadas. O estado de recolhimento do painel é preservado.
- [x] **A03** — Diâmetro inicia em 8 mm, L em m+20 cm e cada ponta em 10 cm. Diâmetro e L são editáveis por pavimento, com pontas derivadas, exemplos exatos e recusa de valores inválidos/não representáveis. A identificação distingue comprimento nominal de comprimento de fabricação.
- [x] **A04** — Os grampos aparecem nas fiadas programadas e na cota definida. Alturas diferentes, vãos, ausência/exclusão de grautes e pontas sem intervalo elegível geram pendências localizadas, sem criar substitutos ou esconder intenção; ligações coincidentes não duplicam peças.
- [x] **A05** — As configurações sobrevivem a salvamento remoto, arquivo, reabertura, importação e cópia. Projetos anteriores continuam íntegros com grampos desativados. Novos pavimentos são independentes; duplicação e remoção seguem o histórico existente.
- [x] **A06** — Confirmação, desfazer/refazer, somente leitura, processamento e falha/recuperação preservam dados e comportamento existente. Consulta não grava e resultado desatualizado não apresenta grampos antigos como atuais.
- [x] **A07** — A representação em Fiada e a identificação tornam distinguíveis peças, furos e ligações, com diâmetro, comprimento e pontas compreensíveis. Não há alegação de escala física, capacidade estrutural ou acomodação de várias barras no centro.
- [x] **A08** — Contratos responsáveis documentam origem/limites dos padrões, compatibilidade, regras geométricas e persistência, preservando os aceites anteriores. O orçamento vigente de tijolos não passa a incluir aço nesta entrega.

## Resultado

Implementada em 2026-11-17. A01/A03/A04: motor acrescenta ligações elegíveis e pendências após os grautes finais, com dimensões nominais e validação de precisão, sem alterar as peças, canaletas ou eixos existentes. A02/A06/A07: formulário nas Propriedades do Pavimento, prévia, confirmação conjunta, validação, histórico e recuperação; desenho na Fiada ativa, identificação por hover e consulta textual acessível na inspeção. A05/A08: configuração no formato nativo 23, leitura compatível de 9–22 e resultado nominal-v12; documento remoto mantém sua versão, sem migração SQL. Contratos responsáveis atualizados, incluindo CT-17.

Conferência proporcional: dez testes novos do domínio aprovados, cobrindo padrões em três módulos, rotações/reflexões, programação, dimensões, exclusões/restauração, alturas, interrupção por abertura, transporte/cópia e leitores. Regressões de compatibilidade selecionadas (180 testes) e operações de documentos/referência (28 testes) aprovadas; nova execução do recorte de domínio/pavimentos teve 43 testes aprovados. As contagens de recortes sobrepostos não representam cobertura adicional. A ampliação se deve ao novo campo de intenção por pavimento e ao novo formato/leitor compartilhado. Tipos do frontend/servidor, lint do código afetado e conferência do diff aprovados.

Dois cenários selecionados no Chrome aprovados em 25,1 segundos: edição por lista/intervalo, dimensões, prévia, desfazer/refazer, validação sem gravar valor inválido, preservação de composição/grautes, desenho real no canvas apenas na fiada programada, arquivo, reabertura remota e falha/recuperação de salvamento. Inspeção visual em `.tools/t025-propriedades.png` e `.tools/t025-fiada.png`. Logs ignorados pelo Git: `.tools/t025-domain-final.log`, `.tools/t025-compatibility.log`, `.tools/t025-document-flows.log`, `.tools/t025-e2e-final.log`, `.tools/t025-types.log`, `.tools/t025-lint.log` e `.tools/t025-diff-check.log`.

Na conclusão dessa etapa, o aceite manual ainda estava pendente. A API local do solicitante precisa ser reiniciada com `./Start-Ecovit.ps1 -Task dev` para carregar o leitor 23; em seguida, reabrir o projeto. Nenhum processo do solicitante na porta 5173 foi alterado.

## Aceite manual — 2026-11-18

Confirmado explicitamente pelo solicitante nesta data: “As T-023, T-024 e T-025 estão aprovadas.” A aprovação inclui os ajustes entregues até o commit 481b023. Os resultados técnicos e as datas de execução anteriores permanecem preservados; as menções de aceite pendente nos relatos anteriores descrevem a situação naquelas etapas.
