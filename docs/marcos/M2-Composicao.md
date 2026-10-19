# M2 — Composição e inspeção de fiadas

[Índice dos marcos](../Ecovit-Plano-Implementacao.md) · [PRD](../Ecovit-PRD.md) · [Arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md)

Registro consolidado da entrega. Versões e verificações referem-se ao marco; o comportamento e os formatos vigentes são definidos nas referências por assunto. Aceite global não atribui resultado individual a roteiros manuais.

**Estado:** implementado e aceito.

## Alcance e referências

Gerar e inspecionar fiadas nominais, alternar Planta/Fiada, comparar fiada adjacente e ajustar fase na primeira fiada. Inclui retas pares/ímpares, L, U, ciclos/retângulos e T com principal contínua e ramal encostado, transição simples L → reta e persistência da composição. CT-01–06, EX-01–20 e P1–P5 definem os padrões e limites. A ligação física entre paredes não é dimensionada.

A cruz não integra o recorte de M2: convenções nominal-v1–v7 a reconhecem e diagnosticam; M3.5 fornece sua composição nominal. Canaletas, grautes e vãos pertencem a M3. O envelope de M2 é versão 2, com convenções nominal-v1/v2/v3 para conferência dos snapshots correspondentes.

## Tarefas concluídas

- [x] **M2-T00 — Definições técnicas:** convenções P1–P5, fontes F6/F7 e exemplos EX-13–18; cruz diagnosticada no recorte de M2.
- [x] **M2-T01 — Contratos e dados:** catálogo nominal, convenções, resultado/diagnósticos e migração versão 1 → 2; fixtures derivados dos EX, sem alterar medidas antigas.
- [x] **M2-T02 — Motor mínimo:** retas, padrões documentados de L/anel/T básico, transição simples de alturas, reconhecimento e diagnóstico da cruz, classificação dos demais encontros e validação integral da cobertura. Determinismo por coordenadas; sem dependência da ordem de criação das paredes.
- [x] **M2-T03 — Ciclo de edição e persistência:** salvar/calcular/salvar, recuperação de falhas, ajustes e histórico, download/importação e reabertura fiel.
- [x] **M2-T04 — Inspeção no aplicativo:** Planta/Fiada, navegação, intervalos, referência adjacente, legenda, seleção e prévia dos encontros, localização dos diagnósticos.
- [x] **M2-T05 — Verificação e relatório:** executar verificações abaixo, corrigir problemas, disponibilizar teste local e registrar resultados reais, limitações e alcance efetivo do RF-05.

O T básico segue CT-05 e EX-10/13: uma solução geométrica basta, com aviso persistido de ligação complementar. EX-11 verifica exclusão da cruz. EX-14–18 cobrem paridade, transição de alturas e compatibilidade; não inventar alternativas nem dimensionamentos construtivos.

## Critérios de aceite do recorte especificado

| ID | Resultado verificável | Referência |
|---|---|---|
| M2-A01 | Três bases dos exemplos produzem inteiro/meio com envelopes e eixos nominais corretos; interface informa a convenção sem pedir configuração inicial | CT-01/02; EX-01/05/06 |
| M2-A02 | Retas alternam os padrões e reproduzem contagens/posições esperadas; desenho invertido e ordem de criação não mudam a composição | CT-04; EX-01/02 |
| M2-A03 | L simples e anel fecham todas as fiadas sem duplicar cantos, sobreposição, sobra ou lacuna; alternativa apresentada também passa nessas verificações | CT-03/05/06; EX-03/04 |
| M2-A04 | Casos fora do suporte e sobreposição colinear são localizados; Planta completa; componente conectado afetado sem peças em Fiada, sem validade fictícia; componentes independentes continuam inspecionáveis | EX-12; decisão 10; P1–P4 |
| M2-A05 | Alturas e intervalos seguem a convenção; paredes curtas terminam corretamente; valores incompatíveis oferecem alternativas sem mudança silenciosa, inclusive após migração | EX-07/08/09; L5 |
| M2-A06 | Navegação percorre fiadas reais, respeita extremos, preserva câmera e última fiada da sessão; referência adjacente não pode ser editada; navegar não dispara motor | RF-04 |
| M2-A07 | Encontro só é alterável na primeira fiada; prévia mostra alcance, confirmação propaga, desfazer/refazer restaura; ajuste incompatível gera conflito explícito | CT-05; RF-05/09 |
| M2-A08 | Cada edição confirmada executa sequência única; modelo é preservado em falha de cálculo/gravação; controles são liberados e estado de salvamento é verdadeiro | Caderno §6 |
| M2-A09 | Reabrir e transportar arquivo versão 2 preserva peças, escolhas e diagnósticos; versão 1 migra sem alterar o modelo; arquivo inconsistente é recusado sem substituir o aberto | RF-11/12 |
| M2-A10 | Atualização e pendências são distinguidas; erros impedem validade geométrica; eixos coincidentes não são apresentados como passagem física comprovada | CT-06; L1/L2 |
| M2-A11 | Chrome e Edge funcionam nos fluxos principais; limites de geração impedem alocação descontrolada e não truncam peças silenciosamente | Arquitetura; Caderno §6 |
| M2-A12 | T básico reproduz EX-10/13 nas fases A/B sem colisão/lacuna; principal contínua; aviso de ligação complementar visível e salvo, sem reforços fictícios | P2; CT-05; EX-10/13 |
| M2-A13 | L com alturas diferentes muda para reta, mantendo fase e escolha inicial; términos após A e B conferem com EX-15/16 | P5; EX-15/16 |
| M2-A14 | L pares/ímpares respeitam mínimo de dois módulos por ramo; encontros próximos só oferecem alternativas compatíveis em todas as fases, com prévia do alcance | P1/P4; EX-14/17/18 |
| M2-A15 | Cruz é reconhecida e diagnosticada, com componente sem composição; não é resolvida implicitamente como dois T nem considerada geometricamente válida | P3; EX-11 |

M2-A04 verifica casos sem suporte no recorte de M2 e não substitui A12/A13. CT-05 e EX-13–20 definem os padrões de paginação aplicáveis. M2 está implementado e aceito; as verificações constam na [M2](M2-Composicao.md).

## M2 — Verificações e aceite

| Verificação registrada | Evidência |
|---|---|
| Tipos, lint e build | Passaram na entrega |
| Domínio/persistência | 41 testes passaram na composição, domínio, ciclo de geração/falhas e IndexedDB |
| Navegador | 20 casos passaram em Chrome/Edge, abrangendo M1 e o recorte de M2 |
| Cobertura geométrica | Bases 25/30/28, paridades/rotações/reflexões, anel, T, U, alturas e componentes independentes |
| Persistência | Migração, conferência de snapshots, adulteração, escolhas, duas gravações, falhas e transporte |
| Carga observada | 100 paredes, 40 fiadas, 42.000 peças: 1.435 ms Chrome / 1.898 ms Edge, incluindo abertura/importação/geração/salvamento |
| Aceite do solicitante | Global recebido; sem checklist individual informado |

Fontes: [composição](../../tests/composition.test.ts), [U aberto](../../tests/open-u.test.ts), [estado](../../tests/generation-state.test.ts) e [Fiada](../../tests/e2e/fiada.spec.ts). Paginação contínua mantém pares de células ao longo dos percursos, sem impor orientação igual a todos os cantos; meios necessários ficam nas extremidades. A navegação com botão do meio ou Espaço preserva o modelo. A interface mantém controles compactos e contextuais.

No aplicativo entregue até M3.5, os limites de geração são 20 mil módulos somados nas paredes, mil fiadas e 100 mil células estimadas no total vertical; M4.1 prevê remover esse controle de orçamento. Células não equivalem a peças; a estimativa é conservadora e não comprova a meta de 100 mil peças/quatro pavimentos. Medições são de fluxo em uma máquina Windows com Intel Core i5-1035G1, não do motor isolado nem garantia para outros dispositivos.
