# M7 — Medidas independentes

[Índice dos marcos](../Ecovit-Plano-Implementacao.md) · [PRD](../Ecovit-PRD.md) · [Arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md)

Registro consolidado da entrega. Versões e verificações referem-se ao marco; o comportamento e os formatos vigentes são definidos nas referências por assunto. Aceite global não atribui resultado individual a roteiros manuais.

**Estado: implementado e aceito pelo solicitante, incluindo a criação por três cliques com afastamento da cota.** Origem: BL-03. Requisito: PRD RF-15, com integração aos fluxos RF-02/08/09/11/12/14; contratos: [Medidas e imagens](../arquitetura/Medidas-e-Imagens.md#medidas-independentes). Os aceites anteriores, inclusive M6, permanecem preservados.

## 14.1. Alcance e definições fechadas

Elemento Medida independente por pavimento, com segmento livre entre dois pontos e rótulo de distância em cm. Criação por três cliques (início, fim e posição da cota), com prévia do afastamento perpendicular para qualquer lado e linhas auxiliares, atração inicial/final aos alvos geométricos do ativo, prioridade de extremidades/vértices sobre linhas, indicação visual e suspensão temporária com Alt. Sem vínculo permanente: alterações dos elementos usados como referência não alteram medidas confirmadas.

Edição em Planta por seleção, movimento do corpo e alças das pontas; histórico, exclusão, salvamento, arquivo e cópias integrados. Texto centralizado legível, com até duas casas decimais e tamanho visual constante; opção Medidas em Preferências do Ecovit oculta somente o rótulo. Composição e quantitativos não consideram medidas, e editar apenas esses elementos não recalcula o motor. Comportamento pertence ao RF-15, dados/precisão/atração/persistência à [Medidas e imagens](../arquitetura/Medidas-e-Imagens.md#medidas-independentes); os critérios abaixo verificam esses contratos sem substituí-los.

Não há pendência de definição de produto neste recorte. O contrato vigente usa aplicativo 0.15.1, envelope 16 com leitura de 9–15 e atração visual de 9 px, conforme [Medidas e imagens](../arquitetura/Medidas-e-Imagens.md#medidas-independentes). Fora do marco: edição numérica de comprimento/ângulo, medidas encadeadas, reposicionamento isolado da cota após a criação, rótulo personalizado/reposicionável, vínculos automáticos, medidas em 3D/Fiada/referências e outros itens do backlog.

## 14.2. Tarefas

- [x] M7-T01: consolidar escopo aprovado, RF-15, [Medidas e imagens](../arquitetura/Medidas-e-Imagens.md#medidas-independentes) e critérios deste marco.
- [x] M7-T02: definir a evolução do contrato/versão de arquivo conforme a política vigente, acrescentar dados e validação das medidas e integrar histórico, pavimentos e cópias.
- [x] M7-T03: implementar ferramenta, geometria livre, atração inicial/final, Alt, seleção, alças, movimento e cancelamentos no próprio editor.
- [x] M7-T04: integrar salvamento sem recálculo construtivo, preservação de resultados, transporte íntegro, reabertura e somente leitura.
- [x] M7-T05: integrar rótulo, preferência Medidas com preservação das escolhas de M6, enquadramento, iconografia e ajuda.
- [x] M7-T06: executar verificações pertinentes, corrigir falhas e consolidar alcance, evidências, limitações e roteiro manual do solicitante antes da entrega para teste.

## 14.3. Critérios de aceite

Critérios da entrega; verificações do Codex e teste manual do solicitante são registrados separadamente na [M7 §14.4](M7-Medidas.md#144-andamento-verificações-e-limites).

| ID | Resultado verificável |
|---|---|
| M7-A01 | Medida disponível em Planta com ícone/texto, estado ativo e ajuda identificáveis; criação por três cliques em qualquer direção, inclusive diagonal e fora da malha: início, fim e linha paralela afastada. Os dois primeiros cliques e o movimento da prévia não salvam nem criam histórico; segundo ponto coincidente permite tentar novamente. O terceiro confirma uma única operação, com distância entre as referências preservada e afastamento possível para ambos os lados, inclusive zero. |
| M7-A02 | Início e fim atraídos aos alvos elegíveis do pavimento ativo, priorizando extremidades/vértices e depois o ponto próximo da linha; indicação visual, tolerância constante em pixels e escolha estável em empates. |
| M7-A03 | Alt suspende atração na criação/ajuste das pontas; posicionamento livre fora da tolerância. Rótulos, ícones, malha, própria medida e referência de outro pavimento não viram alvos. |
| M7-A04 | Selecionar distingue medidas e elementos sobrepostos; arraste do corpo conserva vetor/comprimento e arraste de alça mantém a outra ponta fixa, com atração. Pontas coincidentes não geram medida inválida; na criação, conservam o início para nova tentativa. Escape e perda de foco cancelam; clique fora na criação ou soltura fora na edição não deixam elemento inválido ou gesto preso. |
| M7-A05 | Distância euclidiana correta em horizontal/vertical/diagonal, sentido invertido e coordenadas negativas; exemplo de diferenças de 300 cm e 400 cm exibe 500 cm. Arredondamento apenas na exibição em cm com até duas casas, sem alterar pontos. |
| M7-A06 | Cota e linhas auxiliares acompanham o zoom; texto e marcas mantêm tamanho visual constante, com leitura sem inversão. Linhas auxiliares ligam as referências à cota e traços diagonais marcam as extremidades. Alças continuam nas referências; não há campo de texto personalizado nem alça para reposicionar a cota/rótulo isoladamente. |
| M7-A07 | Medidas em Preferências inicia visível e aplica imediatamente, oculta só o rótulo e preserva linha/alças/edição. Seleção não revela texto oculto; prévia/orientação necessária continua disponível. Carregar preferências anteriores conserva as quatro escolhas de M6. |
| M7-A08 | Mover/redimensionar/unir/excluir parede, vão, laje ou outra referência não altera medidas confirmadas nem cria diagnóstico de vínculo. Encaixe de criação não persiste referência ao alvo. |
| M7-A09 | Criar/editar/excluir corresponde a operação de histórico e salvamento; desfazer/refazer restaura IDs, pontos e afastamento. Alterar apenas medidas não chama motor nem altera resultado/diagnósticos/quantitativos ou geometria construtiva. |
| M7-A10 | Salvamento local, reabertura, download/importação e duplicação de projeto preservam referências e afastamento das medidas; edição da cópia não altera origem. Arquivos inválidos, coordenadas/precisão/referências inválidas e versões incompatíveis são recusados sem substituir trabalho aberto, segundo o contrato definido na implementação. |
| M7-A11 | Medidas pertencem ao pavimento ativo; duplicar pavimento copia XY com IDs próprios, remover exclui suas medidas e histórico restaura. Fiada e referência de outro pavimento não as desenham; enquadrar inclui referências e extremos da cota deslocada, mesmo quando só houver medidas. |
| M7-A12 | Somente leitura impede edição de medidas e preserva consulta/navegação; bloqueios entre abas, falhas de salvamento e recuperação por download permanecem íntegros. |
| M7-A13 | Regressões de M1–M6 pertinentes preservadas: desenho modular construtivo, prioridades/alças, navegação, cancelamentos, arquivos, pavimentos, preferências e status único do canvas; iconografia e apresentação conforme [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md#iconografia) nas três resoluções de referência. |

## 14.4. Andamento, verificações e limites

**Alcance implementado — M7-T01–05:** coleção independente por pavimento, criação livre/diagonal por três cliques, sem manter o botão pressionado, prévia do segmento seguida pela prévia da cota paralela e suas auxiliares, atração geométrica em ambas as pontas, prioridade de vértices/extremidades e suspensão por Alt; seleção contextual e por lista, movimento do corpo, ajuste de alças, exclusão, cancelamentos e histórico. Rótulo em cm com até duas casas e tamanho visual constante, opção Medidas com preservação das preferências anteriores, geometria incluída no enquadramento apenas do ativo. Persistência, arquivo, cópias e pavimentos integrados; readonly consultável pela seleção acessível. Operações apenas em medidas salvam sem chamar motor, inclusive quando resultado já está desatualizado. Aplicativo 0.15.1, envelope 16 com leitura de 9–15: medidas antigas sem afastamento, origem preservada; convenção nominal-v10 inalterada. Sem biblioteca, serviço, regra construtiva ou vínculo persistido novo.

**Limitações:** sem vínculos com geometria, medidas construtivas verificadas ou visualização em Fiada/3D. A atração de 9 px é auxílio de interface, não precisão física; o rótulo arredondado não altera os pontos. Coordenadas continuam inteiras em 0,1 mm. Não há edição numérica de comprimento/ângulo, texto personalizado/reposicionável ou garantia de evitar toda sobreposição em desenhos densos. Preferência local ao navegador, sem sincronização entre contas/dispositivos. Somente envelopes 9–16 suportados; aplicativos anteriores podem recusar arquivos novos. Sem auditoria completa de acessibilidade ou nova garantia geral de desempenho.

## 14.5. Aceite do solicitante

**Aceite global da entrega inicial:** M7 aprovado por confirmação explícita nesta conversa, com teste da criação por dois cliques declarado pelo solicitante. O aceite abrange o marco implementado, incluindo esse comportamento, e encerra sua pendência global de aprovação. As verificações do Codex e as limitações permanecem registradas separadamente na [M7 §14.4](M7-Medidas.md#144-andamento-verificações-e-limites). Não foram informados resultados individuais dos demais passos do roteiro. Os aceites anteriores permanecem preservados.

## Verificações da entrega inicial

Tipos, lint e build aprovados. Domínio verifica geometria, atração e persistência; navegador verifica criação por dois cliques, ponto inicial fixo, cancelamento, zoom, alças, transporte, readonly e ausência de alteração durante prévia. Revalidação final da criação: oito fluxos de medidas e 26 regressões de editor/parede aprovados em Chrome/Edge. Revisão visual nas três resoluções. Fontes: [medidas](../../tests/measurements.test.ts) e [fluxos](../../tests/e2e/measurements.spec.ts).

Referências de rastreabilidade preservadas: M7-A01–12.

## Criação por três cliques e afastamento — RF-15 / M7-A01–13

**Alcance implementado:** início/fim fixados nos dois primeiros cliques, seguidos por prévia perpendicular livre da linha de cota em ambos os lados; o terceiro clique confirma uma única operação. Pontos medidos e distância permanecem fixos durante o posicionamento. Linhas auxiliares e marcas diagonais acompanham linha/rótulo; seleção usa a geometria visível, sem linha de pega invisível sobre o segmento original. Arraste do corpo translada o conjunto, e alças continuam nas referências. Cancelamentos descartam toda a prévia. Não há controle adicional para reposicionar só o afastamento após criar.

**Persistência e integridade:** envelope 16 com afastamento inteiro opcional; ausência representa zero. Envelopes 9–15 continuam legíveis sem alterar o arquivo de origem; dados novos em envelopes anteriores são recusados. Enquadramento inclui referências e linha afastada. Histórico, reabertura, transporte, cópias de projeto/pavimento e somente leitura preservam o afastamento; convenção nominal e cálculos não mudam.

**Verificações do Codex:** 367 testes de domínio/persistência aprovados em 28 arquivos. Geometria verifica projeção com sinal, diagonal/inversão, distância independente do afastamento, seleção da linha/auxiliares, ausência de seleção invisível, limites de coordenadas e precisão. Persistência verifica versão 16, leitura de 15 sem mutação da origem, rejeição de formato anterior adulterado, arquivo, cópias, enquadramento e histórico sem motor. Os 12 casos de Medida e 26 regressões distintas pertinentes passaram em Chrome/Edge na porta 5174, incluindo prévia sem gravação, coincidência, Alt, cancelamentos nas duas etapas, dois lados, movimento/edição, preferências, pavimentos, somente leitura, abertura, imagens, mobiliários e lajes. O teste de consulta da face inferior da laje foi alinhado aos pares de rótulo/valor já implementados na revisão visual, sem alterar a laje. Capturas de cota horizontal sobre parede e cotas diagonais nas três resoluções de referência revisadas visualmente por amostra. Tipos, lint e build aprovados; avisos conhecidos de Zod e bundle permanecem. Sem nova execução completa da suíte de navegador ou auditoria de acessibilidade.

**Teste manual e aceite específico do solicitante:** concluídos para a melhoria da ferramenta Medida com três cliques e afastamento da cota. O solicitante declarou ter testado e aprovado o resultado. Não foram informados resultados individuais por cenário, navegador ou resolução; as verificações do Codex permanecem separadas do teste manual. O aceite da entrega inicial permanece preservado.
