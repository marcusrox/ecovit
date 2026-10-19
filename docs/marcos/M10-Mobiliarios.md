# M10 — Mobiliários

[Índice dos marcos](../Ecovit-Plano-Implementacao.md) · [PRD](../Ecovit-PRD.md) · [Arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md)

Registro consolidado da entrega. Versões e verificações referem-se ao marco; o comportamento e os formatos vigentes são definidos nas referências por assunto. Aceite global não atribui resultado individual a roteiros manuais.

**Estado: implementado, verificado pelo Codex e aceito pelo solicitante.** Origem: BL-01. Produto: PRD RF-17; contratos: Arquitetura §28. Aceite funcional global recebido do solicitante para o escopo consolidado, incluindo qualidade de imagem e Preferências. M1–M9 conservam seus estados e evidências.

## 17.1. Alcance e catálogo inicial

Biblioteca distribuída com o Ecovit, categorias/busca e inserção de ocorrências por clique em Planta. Seleção, posição livre, rotação, redimensionamento proporcional pelos cantos/campos e independente por duas alças quadradas, nome, duplicação, exclusão e histórico. Manter quatro alças circulares nos cantos, que preservam a proporção atual. Adicionar exatamente duas alças quadradas nos pontos médios: inferior, oposta ao controle de giro, ajusta só profundidade; direita ajusta só largura. As posições acompanham os eixos locais do objeto girado. Cada alça quadrada mantém a aresta oposta fixa e permite aumentar ou diminuir a dimensão sem cruzá-la; a outra dimensão e o ângulo não mudam. A imagem pode ser deformada por eixo, sem alterar os bytes da arte. Propriedades com nome, largura/profundidade em cm e ângulo, sem campos de posição X/Y. Posição ajustada por arraste; rotação pela alça atrai múltiplos de 45° quando a diferença é de até 5°, conservando ângulos livres fora dessa faixa. O campo numérico de rotação permanece livre. Dimensões sugeridas para catálogo e definição de uma dimensão para upload; nenhuma calibração de dois pontos. Associação por pavimento, persistência e cópias independentes. Integração visual e ausência de efeito construtivo conforme RF-17, sem confundir estes objetos com a referência de fundo de M8.

| Categoria | Opções incluídas | Quantidade |
|---|---|---|
| Sala | Sofá; Poltrona; Mesa de centro; Rack; Cadeira; Mesa retangular; Mesa redonda com 4 cadeiras; Mesa retangular com 6 cadeiras | 8 |
| Quarto | Cama de solteiro; Cama de casal; Cama queen; Cama king; Mesa de cabeceira; Guarda-roupa | 6 |
| Cozinha | Armário; Bancada; Pia; Geladeira; Cooktop; Micro-ondas | 6 |
| Banheiro | Lavatório; Vaso sanitário; Chuveiro; Box | 4 |
| Lavanderia | Tanque; Máquina de lavar; Armário | 3 |
| Outros | Carro; Caixa-d’água; Condensadora de ar; Extintor | 4 |
| Varanda | Mesa redonda; Banco; Banqueta; Espreguiçadeira; Piscina | 5 |
| Paisagismo | Árvore ornamental; Vaso com planta; Canteiro; Cerca viva | 4 |
| Total | Opções de catálogo, com possibilidade de compartilhar artes | 40 |

Padrão aprovado: vista superior ortogonal, contorno fino, cores suaves e acabamento da [prancha de estudo](../images/M10-Estudo-Acervo.png), com folhagem simplificada. A prancha é referência documental gerada por IA, não entrega das artes finais. Conservar a mesma arte na miniatura e no canvas; arquivos finais individuais com transparência. O padrão visual aprovado abrange acabamento/paleta/direção de vista e simplificação da vegetação; o aceite global da M10 abrange o acervo implementado, sem atribuir uma inspeção individual de cada arte ao solicitante. Acervo de 39 PNGs para as 40 opções, com Armário compartilhado entre Cozinha/Lavanderia. As mesas com cadeiras são duas imagens únicas na categoria Sala: dimensões sugeridas de 200 × 200 cm para a redonda com quatro cadeiras e 260 × 190 cm para a retangular com seis, incluindo todas as cadeiras. As cadeiras não são elementos separados. Dimensões genéricas no manifesto src/domain/image-catalog.ts e procedência/prompts em public/catalog/m10/provenance.json.

Imagens padrão ficam referenciadas por ID/revisão, sem conteúdo incorporado ao documento local ou .ecovit. Imagens personalizadas PNG/JPEG ficam incorporadas uma vez por recurso e podem atender várias ocorrências. Manter limite total de 50 MiB. A revisão do catálogo suportada pela distribuição é necessária para reabrir; ausência de recurso deve ser informada antes de substituir o documento aberto. Envelope 14 com leitura de 9–13 e validações na Arquitetura §28.

Fora do recorte: demais itens das capturas, edição/recorte/remoção de fundo, biblioteca global de uploads, agrupamento, ordenação manual de camadas, 3D, geração de imagens no aplicativo, instalações e verificação de circulação/colisão. Referência de outro pavimento e Fiada não mostram estes objetos. Não alterar o motor, diagnósticos ou quantitativos construtivos.

Versões reduzidas dos mobiliários padrão/uploads são geradas sob demanda e compartilhadas somente em memória, com escolha pela dimensão na tela/densidade do monitor. A opção Suavização em qualidade alta fica nas Preferências, inicialmente ativada e persistida neste navegador, sem alterar projeto/histórico/exportação. Envelope 14 e motor nominal-v10 permanecem iguais; referência M8 conserva sua renderização.

## 17.2. Tarefas

- [x] M10-T01: preparar e revisar o acervo uniforme, transparência, proporções/dimensões genéricas e procedência; simplificar vegetação e criar manifesto estático das 40 opções.
- [x] M10-T02: implementar modelo de ocorrências/recursos, transformações e comandos de edição proporcional e independente por eixo, mantendo isolamento do motor.
- [x] M10-T03: implementar catálogo, busca, upload, prévia, inserção, seleção de sobrepostos e propriedades no aplicativo; seguir Arquitetura §2.1.
- [x] M10-T04: integrar histórico, pavimentos, cópia de projeto, arquivo previsto, validação e falhas de armazenamento, sem incorporar imagens padrão.
- [x] M10-T05: executar verificações pertinentes, corrigir falhas, revisar apresentação e disponibilizar para teste manual; consolidar evidências reais nesta seção.

## 17.3. Critérios de aceite

| ID | Resultado verificável |
|---|---|
| M10-A01 | Catálogo oferece as oito categorias e exatamente as 40 opções de [M10 §17.1](M10-Mobiliarios.md#171-alcance-e-catálogo-inicial), com busca, nomes e miniaturas correspondentes às artes de Planta, incluindo as duas mesas com cadeiras em Sala. Não requer upload para usar o acervo padrão. |
| M10-A02 | Artes têm vista superior, acabamento/paleta aprovados e alpha real; vegetação simplificada mantém legibilidade. Nenhuma arte traz marca ou rótulo incorporado. Dimensões sugeridas são editáveis e identificadas como genéricas. |
| M10-A03 | Escolher item mostra prévia; clique confirma no pavimento ativo. Escape, perda de foco e troca de contexto cancelam sem resíduos, gravação ou histórico; catálogo e busca não alteram o projeto. |
| M10-A04 | Selecionar, mover livremente, girar, redimensionar pelos quatro cantos/campos na proporção atual e por exatamente duas alças quadradas independentes, renomear, duplicar e excluir funcionam; nos cantos/campos a dimensão complementar acompanha a proporção atual. As alças quadradas inferior/direita ajustam profundidade/largura local, mantêm a aresta oposta fixa e não permitem cruzá-la, inclusive com objeto girado. Valores inválidos não alteram a intenção confirmada. A alça de rotação atrai múltiplos de 45° dentro de 5°, permite giro livre fora da faixa e integra histórico; o campo numérico não aplica atração. As propriedades não exibem X/Y nem alteram a posição ao aplicar os demais campos. |
| M10-A05 | Uma confirmação/gesto gera uma operação; desfazer/refazer restaura IDs, geometria, fontes e uploads. Navegação, cancelamento e ausência de alteração não geram operações. Atalhos preservam digitação. |
| M10-A06 | Upload aceita PNG/JPEG válidos e exige dimensão em cm; mantém proporção inicial e bytes originais; as ocorrências podem ser deformadas depois. Conteúdo corrompido, tipo/limite inválido e arquivo total acima de 50 MiB são recusados antes do commit, sem perda do aberto. |
| M10-A07 | Exportação contém referências ID/revisão para padrões, sem seus bytes/miniaturas. Um recurso personalizado usado por várias ocorrências aparece uma vez; transporte/reabertura preserva conteúdo e transformações. |
| M10-A08 | Recurso padrão/revisão indisponível ou referência personalizada órfã impede abertura com mensagem clara, preservando projeto atual. O catálogo não substitui artes silenciosamente; arquivos incompatíveis são recusados. |
| M10-A09 | Cópia de projeto/pavimento preserva os objetos com edição independente; remoção de pavimento e histórico restauram suas ocorrências/recursos. Nenhum elemento fica associado a pavimento inexistente. |
| M10-A10 | Planta mostra objetos do ativo acima das lajes e abaixo dos traços técnicos; seleção de sobrepostos continua acessível. Enquadramento inclui cantos rotacionados em pavimento só com objetos; Fiada e comparação não mostram esses objetos. |
| M10-A11 | Operações exclusivas de imagens não chamam o motor nem mudam composição, diagnósticos ou quantitativos, com resultado atual ou desatualizado e também no histórico. M8 e suas calibrações permanecem independentes. |
| M10-A12 | Salvamento/reabertura, falha de quota com retenção em memória/download e bloqueio entre abas preservam integridade. Somente leitura impede inserção/edição; interface e teclado seguem §2.1 nas resoluções e navegadores previstos. |
| M10-A13 | Resoluções alternativas compartilham a mesma fonte apenas em memória, preservam enquadramento/alpha/geometria e usam a original ao aproximar. Qualidade alta é opção local inicialmente ativada, aplicada imediatamente e preservada após reabrir. Alternar não altera projeto, histórico, motor ou bytes do .ecovit. A camada de mobiliários mantém o ajuste após redimensionar a janela. |

## 17.5. Estado consolidado, limitações e teste manual

**Alcance implementado:** biblioteca com 40 opções/39 artes PNG, categorias/busca, upload reutilizável, inserção com prévia, seleção, movimento, redimensionamento proporcional pelos quatro cantos/campos, independente por duas alças quadradas e rotação, nome/duplicação/exclusão, histórico e cópias por pavimento/projeto. Envelope 14 guarda padrões como referências e uploads uma vez por recurso; preserva o motor nominal-v10. Verificações pertinentes do Codex concluídas; aceite funcional global recebido do solicitante.

**Limitações:** as dimensões são sugestões genéricas, sem verificação de medidas comerciais ou capacidade física; imagens não comprovam instalação, circulação ou colisões. Envelope 14 permite dimensões independentes; aplicativos anteriores podem recusá-lo. A leitura das versões 9–13 permanece disponível. O acervo padrão depende das revisões distribuídas com o Ecovit e não é incorporado ao projeto. Os 39 PNGs somam aproximadamente 65 MiB na distribuição estática; carregamento do catálogo por categoria e miniaturas sob demanda, sem alterar o tamanho do .ecovit. Até 2.000 ocorrências, 200 recursos personalizados e 50 MiB por arquivo, além dos limites individuais de imagem. Não foi executada toda a suíte histórica de navegador nem auditoria com leitor de tela. O aceite global do solicitante não altera estes limites nem comprova inspeção individual de cada arte.

**Qualidade de imagem:** resoluções alternativas em memória e preferência local de qualidade alta implementadas conforme M10-A13 e Arquitetura §28.1.1. Navegador verifica uso efetivo de fonte reduzida a 40%, qualidade high/low no contexto real da camada, reaplicação após redimensionar, preferência preservada ao reabrir, isolamento de projeto/histórico e exportação idêntica byte a byte antes/depois da alternância. Exercita compartilhamento da decodificação/níveis, liberação da última ocorrência e retorno à original ao ampliar.

**Aceite do solicitante:** M10 aprovada expressamente pelo solicitante neste chat. O aceite global abrange o escopo consolidado: acervo em vista superior com 40 opções, upload e transporte, edição e histórico, atração angular, propriedades compactas, quatro alças proporcionais e duas independentes, resoluções alternativas em memória e suavização em qualidade alta nas Preferências. Encerra a pendência de aceite funcional da M10. Não atribuir execução individual de cada passo do roteiro manual, inspeção de cada arte ou medições de desempenho ao solicitante; as verificações do Codex permanecem identificadas separadamente neste registro.

## Verificações consolidadas

Tipos, lint e build aprovados. Suíte completa da entrega final: 344 testes em 25 arquivos. Navegador: 22 casos em Chrome/Edge, 14 de Mobiliários e oito de Preferências. Verificadas as alças, atração angular, catálogo, uploads, histórico, pavimentos, transporte, cache compartilhado/liberado, resolução reduzida a 40%, high/low real no canvas e exportação idêntica antes/depois da preferência. Revisão visual nas três resoluções. Fontes: [domínio](../../tests/image-elements.test.ts), [preferências](../../tests/preferences.test.ts), [fluxos M10](../../tests/e2e/image-elements.spec.ts) e [preferências no navegador](../../tests/e2e/preferences.spec.ts).
