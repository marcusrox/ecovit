# M8 — Imagem de referência por pavimento

[Índice dos marcos](../Ecovit-Plano-Implementacao.md) · [PRD](../Ecovit-PRD.md) · [Arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md)

Registro consolidado da entrega. Versões e verificações referem-se ao marco; o comportamento e os formatos vigentes são definidos nas referências por assunto. Aceite global não atribui resultado individual a roteiros manuais.

**Estado: implementado, verificado pelo Codex e aceito pelo solicitante.** Origem: BL-02. Requisito: PRD RF-16; contratos: Arquitetura §26. Os marcos anteriores, inclusive o aceite de M7 com criação por dois cliques, permanecem preservados. BL-01 não integra esta entrega.

## 15.1. Escopo aprovado

Uma imagem PNG/JPEG por pavimento como fundo em Planta do ativo, abaixo da malha e elementos. Acesso em Propriedades do pavimento, com botões/textos compactos e controles revelados conforme a operação; sem ocupar grande área do canvas nem criar barra permanente. Calibrar por dois cliques livres sobre um trecho conhecido e distância real em cm; preservar proporção, marcar pontos e mostrar prévia, sem criar uma Medida. Permitir posição livre e ângulo com prévia no modo Ajustar, além de recalibração com primeiro ponto fixo. Imagem inicialmente visível a 40% de opacidade, com controle de 0 a 100% e Mostrar imagem independente.

Concluir/Cancelar para inclusão, ajuste e substituição; cancelamento mantém a referência anterior. Fora de Ajustar, imagem não captura gestos do desenho. Salvar conteúdo e ajustes no projeto/.ecovit, integrar histórico/cópias/pavimentos, sem alterar composição nem chamar motor. Limites individuais aprovados: 10 MiB e 16 megapixels, com validação do limite total de 50 MiB do arquivo; nenhuma redução silenciosa de qualidade. O comportamento completo pertence ao RF-16, e os contratos à Arquitetura §26.

Fora do marco: múltiplas imagens no mesmo pavimento, PDF/outros formatos, imagens como objetos (BL-01), correção de perspectiva, recorte/tratamento, deformação por eixo, reconhecimento/vetorização, desenho automático, alvos de atração derivados dos pixels, exibição em Fiada ou na referência de outro pavimento. A imagem é apoio visual; calibração não comprova precisão física de uma foto/digitalização. Sem novo serviço, biblioteca ou algoritmo construtivo previsto.

## 15.2. Tarefas

- [x] **M8-T01:** consolidar escopo aprovado, RF-16, Arquitetura §26 e critérios deste marco, incluindo a exigência de interface compacta.
- [x] **M8-T02:** consolidar contrato de dados, evolução do envelope e leitura de versões anteriores conforme a política vigente; integrar validação de conteúdo/tamanho, imagem incorporada, cópias, pavimentos e arquivo.
- [x] **M8-T03:** implementar inclusão/substituição, calibração por dois cliques/distância, transformação uniforme, posição/rotação, prévia e Concluir/Cancelar no editor existente.
- [x] **M8-T04:** integrar seção compacta em Propriedades do pavimento, opacidade/visibilidade, remoção, ajuda curta e iconografia/acessibilidade conforme §2.1 da Arquitetura.
- [x] **M8-T05:** integrar salvamento/histórico sem recálculo construtivo, descarte de prévias ao mudar contexto, bloqueios de edição, falhas de gravação e recuperação por download.
- [x] **M8-T06:** executar verificações pertinentes e corrigir falhas; consolidar alcance implementado, resultados reais, limitações e roteiro manual antes de entregar para teste, mantendo aceite do solicitante separado das verificações do Codex.

## 15.3. Critérios de aceite

| ID | Resultado verificável |
|---|---|
| M8-A01 | Propriedades do pavimento oferece Adicionar imagem e permite uma única referência PNG/JPEG por pavimento; outra inclusão usa Substituir, sem acumular imagens. |
| M8-A02 | Primeiro/segundo clique marcam livremente um trecho da imagem sem arraste nem atração à geometria; distância conhecida em cm calibra proporcionalmente. Inclusão só conclui após escala válida; não cria elemento Medida. |
| M8-A03 | Distância positiva finita e pontos distintos obrigatórios; caso conhecido de calibração corresponde à distância mundial informada. Recalibrar mantém o primeiro ponto fixo, inclusive com câmera/rotação diferentes; zoom/navegação não alteram a escala real. |
| M8-A04 | Ajustar permite posição livre e ângulo com prévia, sem deformar proporção. Imagem não captura seleção/gestos construtivos fora da edição, e não modifica paredes, vãos, lajes ou medidas durante o ajuste. |
| M8-A05 | Prévia de inclusão é acessível em pavimento vazio; Concluir confirma uma operação válida, Cancelar/mudar contexto preserva estado anterior sem histórico/salvamento parcial. Substituição mantém a imagem anterior até confirmar. |
| M8-A06 | Imagem aparece abaixo da malha/elementos, acompanha a câmera, inicia visível a 40% e aceita opacidade 0–100%. Mostrar imagem preserva conteúdo e transformação; controles pertencem ao pavimento e persistem no projeto. Enquadrar inclui a imagem visível do ativo; ajustar uma imagem oculta conserva sua visibilidade ao concluir/cancelar, e confirmação sem mudanças apenas encerra. |
| M8-A07 | Apenas a imagem do pavimento ativo aparece em Planta; Fiada e referência de outro pavimento não a renderizam. Medidas/atração/desenho modular existentes continuam funcionando sem novos alvos nos pixels. |
| M8-A08 | PNG/JPEG inválido, outro formato, mais de 10 MiB, mais de 16 megapixels ou arquivo total acima de 50 MiB são recusados com causa e sem perda do projeto/imagem anterior. Limites inclusivos e expansão da codificação são considerados, sem redução silenciosa de qualidade. |
| M8-A09 | Salvar/reabrir e baixar/importar preservam imagem, escala, posição, rotação, opacidade e visibilidade, sem acesso ao arquivo original. Duplicar projeto/pavimento produz edição independente; excluir pavimento e desfazer restauram sua referência. |
| M8-A10 | Inclusão, ajuste, recalibração, substituição, remoção e mudança de visibilidade/opacidade são desfazíveis; prévias não geram operações, e gesto de opacidade gera uma única operação. Mudanças só de imagem preservam resultados/diagnósticos/quantitativos e não chamam motor, inclusive com composição já desatualizada. |
| M8-A11 | Somente leitura e processamento impedem alteração; travas entre abas, falhas de gravação e download permanecem íntegros. Erros de carregamento/decodificação não substituem imagem confirmada nem trabalho aberto. |
| M8-A12 | Controles/textos compactos, campos revelados apenas quando pertinentes, sem nova barra permanente ou grandes instruções sobre o canvas. Nomes acessíveis, dicas, teclado, foco, unidades e erros legíveis, sem reduzir área de clique exigida. Chrome/Edge em 1366×768, 1280×720 e 900×680 sem sobreposição de status/zoom nem rolagem horizontal. |

## 15.4. Andamento, verificações e limites

**Alcance implementado — M8-T01–05:** referência opcional única por pavimento em model.referenceImages; PNG/JPEG incorporado em base64, escala uniforme, posição/rotação, opacidade/visibilidade e enquadramento do ativo visível. Inclusão/substituição com dois cliques e distância real em cm, recalibração com primeiro ponto fixo, prévias transitórias e confirmação/cancelamento; ausência de captura fora de Ajustar. Interface compacta na lateral, ações secundárias em menu, campos apenas na etapa pertinente, orientações breves na faixa existente e ajuda estável. Imagem abaixo da malha/geometria, apenas em Planta do ativo. Histórico, cópias, remoção/merge de pavimento, persistência e transporte integrados; mudanças só de imagem não chamam motor nem invalidam resultados, inclusive desatualizados. Aplicativo 0.13.0/envelope 11 com leitura de 9/10 por normalização aditiva em memória e preservação da origem. Convenção nominal-v10 e regras construtivas inalteradas, sem nova dependência ou serviço.

**Limitações:** PNG/JPEG, uma imagem por pavimento, até 10 MiB e 16 megapixels, com limite adicional da intenção serializada de 50 MiB; quatro imagens no limite individual podem ultrapassar o total por causa da expansão base64. Sem redução silenciosa. Decodificação e memória dependem do navegador/dispositivo, sem nova garantia geral de desempenho. Sem PDF, perspectiva, recorte/tratamento, deformação por eixo, vetorização, reconhecimento, vínculo/atração aos pixels, Fiada ou imagem do vizinho na comparação. Calibração uniforme não comprova precisão física ou corrige distorção. Aplicativos anteriores podem recusar envelope 11. Aceites anteriores permanecem preservados.

## 15.5. Aceite do solicitante

**Aceite global do solicitante:** M8 aprovado por confirmação explícita nesta conversa, com teste do marco declarado pelo solicitante. O aceite abrange a implementação consolidada nesta seção e encerra a pendência global de aprovação. As verificações do Codex e as limitações permanecem registradas separadamente na [M8 §15.4](M8-Imagem-de-Referencia.md#154-andamento-verificações-e-limites). Não foram informados resultados individuais dos passos do roteiro; não se atribui execução específica. Os aceites anteriores permanecem preservados.

## Verificações consolidadas

Tipos, lint e build aprovados. Domínio/estado verificam calibração, âncora sob rotação, limites de arquivo, conteúdo real e vínculos por pavimento, sem recálculo construtivo. Chrome/Edge verificam PNG/JPEG, dois cliques, zoom, cancelamento, substituição/corrupção, histórico, transporte e bloqueios entre abas; revisão visual nas três resoluções. Fontes: [imagem](../../tests/reference-image.test.ts) e [fluxos](../../tests/e2e/reference-image.spec.ts).

Referências de rastreabilidade preservadas: M8-A01–12.
