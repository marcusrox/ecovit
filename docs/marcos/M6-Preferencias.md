# M6 — Preferências do Ecovit

[Índice dos marcos](../Ecovit-Plano-Implementacao.md) · [PRD](../Ecovit-PRD.md) · [Arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md)

Registro consolidado da entrega. Versões e verificações referem-se ao marco; o comportamento e os formatos vigentes são definidos nas referências por assunto. Aceite global não atribui resultado individual a roteiros manuais.

**Estado:** implementado e aceito pelo solicitante. Origem: BL-07 e reorganização do status/ajuda aprovada pelo solicitante; requisitos: PRD RF-09/10/14 e §8; contratos técnicos: Arquitetura §24. Marco próprio por acrescentar preferências e ajustes de apresentação do aplicativo, separado das entregas concluídas de M5. Aprovação das definições não constitui aceite funcional.

## 13.1. Alcance definido

Nova área “Preferências do Ecovit”, com acesso por ícone ao lado de Configurações do projeto no cabeçalho. Visibilidade independente dos rótulos de portas, janelas, vãos e paredes; Paredes controla A/B e novo rótulo permanente de comprimento/altura em Planta. O comportamento do produto pertence ao RF-14; regras de implementação e iconografia permanecem na arquitetura. Nenhum outro item do backlog integra M6, inclusive o elemento Medida do BL-03.

Inclui também concentrar o status no canto inferior esquerdo do canvas, removendo as apresentações junto de Planta/Fiada e no rodapé; substituir a mensagem de sucesso por “Composição nominal atualizada”. Transferir instruções gerais de seleção/movimento/redimensionamento/navegação para “Como usar o editor”, mantendo orientações operacionais temporárias, avisos e acesso a Recalcular/diagnósticos. Comportamento no PRD §8 e implementação na Arquitetura §24.1; não se trata de nova opção das preferências.

## 13.2. Definições fechadas

Definições de produto consolidadas no RF-14: quatro controles por tipo, inicialmente visíveis; rótulo inteiro para aberturas; A/B e comprimento/altura para paredes; aplicação imediata e Fechar; persistência no navegador para todos os projetos; falha de gravação mantém escolha na sessão com aviso. Seleção não reexibe texto oculto, propriedades e informações temporárias continuam disponíveis. Preferência comum aos modos onde os textos aparecem, com o novo rótulo de parede somente em Planta, sem novos textos na referência de pavimento. Sem pendências de definição de produto para este recorte.

Detalhes do rótulo de parede (medida externa A/B, altura própria, formato, orientação e atualização) no RF-14; armazenamento, separação do documento e ícones na Arquitetura §24.

## 13.3. Tarefas

- [x] M6-T01: fechar as definições e consolidar RF-14, Arquitetura §24 e critérios deste marco.
- [x] M6-T02: implementar área, acesso, persistência e controles de visibilidade por tipo, incluindo o rótulo de comprimento/altura das paredes.
- [x] M6-T03: verificar os fluxos afetados, corrigir falhas e consolidar alcance, resultados, limitações e roteiro manual do solicitante.
- [x] M6-T04: reorganizar status e orientações do canvas e atualizar a ajuda, conforme PRD §8 e Arquitetura §24.1.

## 13.4. Critérios de aceite

Critérios da entrega; verificação do Codex e teste manual do solicitante são registrados separadamente na [M6 §13.5](M6-Preferencias.md#135-andamento-verificações-e-limites).

| ID | Resultado verificável |
|---|---|
| M6-A01 | Diálogo compacto “Preferências do Ecovit”, grupo “Visibilidade dos rótulos”, engrenagem ao lado do ícone de ajustes existente, nome acessível, dica, teclado e retorno de foco; renomeação em andamento preservada. |
| M6-A02 | Portas/Janelas/Vãos/Paredes têm checkboxes independentes; aberturas ocultam o rótulo inteiro, Paredes oculta A/B e comprimento/altura. Desenho, alças e demais tipos preservados; reexibir restaura os textos. |
| M6-A03 | Alterar preferências não altera geometria, composição, quantitativos, intenção salva, arquivo `.ecovit` ou histórico do projeto. |
| M6-A04 | Todos visíveis sem preferências salvas; alteração imediata, Fechar/Escape sem reversão, escolha preservada ao trocar projeto e recarregar no mesmo navegador, independente do arquivo importado. |
| M6-A05 | Cabeçalho e área legíveis nas resoluções de referência da Arquitetura §2.1, inclusive com nome longo; iconografia consistente e fluxos existentes de configurações/navegação preservados. |
| M6-A06 | Parede confirmada em Planta exibe comprimento externo A/B e altura própria em cm, com orientação/posição do RF-14; medidas corretas em paredes horizontais/verticais, sentido invertido, alturas distintas e com vãos, sem descontar aberturas. |
| M6-A07 | Rótulo da parede acompanha movimento, redimensionamento, altura, desfazer/refazer e reabertura, sem entidade ou texto duplicado no arquivo; sem linhas/alças de cota ou novos rótulos em Fiada/referências. |
| M6-A08 | Seleção não revela rótulo oculto; propriedades, medidas e informações temporárias de edição, avisos e orientações permanecem. Portas/janelas/vãos seguem preferência comum em Planta/Fiada onde já aparecem. |
| M6-A09 | Falha de gravação mantém preferência em memória com aviso acessível; leitura ausente/inválida/falha usa padrões sem impedir uso. Preferências funcionam em somente leitura sem alterar registro ou bloqueio do projeto. |
| M6-A10 | Status único no canto inferior esquerdo do canvas em Planta/Fiada, sem repetição junto aos modos ou no rodapé; prioridade Processando… → Resultado desatualizado → Atualizado · com pendências → Composição nominal atualizada, sem mostrar sucesso antigo durante processamento. |
| M6-A11 | Ajuda contém clique para selecionar, arraste do corpo/alças e navegação com botão central ou Espaço; canvas sem instrução genérica fixa, mantendo orientações temporárias de desenho/graute, prévias, avisos e somente leitura. Status e zoom permanecem visíveis e acessíveis nas resoluções de referência. |
| M6-A12 | Recalcular e diagnósticos continuam acessíveis, com bloqueios existentes; mudanças de status são anunciadas sem duplicação/foco forçado. Preferências de rótulos não ocultam status, avisos ou instruções operacionais. |

## 13.5. Andamento, verificações e limites

**Aceite global do solicitante:** M6 testado e aprovado por confirmação explícita nesta conversa, abrangendo preferências, rótulos de paredes e reorganização do status/ajuda do canvas. O aceite encerra a pendência funcional global do marco, preservando verificações do Codex e limitações abaixo, sem atribuir resultados individuais aos passos do roteiro manual. Não autoriza iniciar outros itens do backlog.

**Alcance implementado — M6-T01/02/04:** preferências em diálogo nativo compacto, quatro controles imediatos e persistência local independente por navegador, padrões visíveis, validação de leitura e recuperação de falha de gravação com manutenção em memória e aviso. Engrenagem junto aos ajustes existentes, abertura durante renomeação e retorno de foco, inclusive somente leitura. Paredes exibem comprimento externo/altura própria em Planta, com texto de tamanho visual constante, orientação horizontal/vertical e separação entre rótulos; mesmo controle oculta A/B preservando alças. Aberturas mantêm desenho/alças ao ocultar seus rótulos. Status único na parte inferior do canvas com prioridade de processamento, resultado desatualizado, pendências e sucesso; Recalcular preservado, anúncios acessíveis e ajuda geral transferida para a lateral. Sem dependências novas, mudança de motor, modelo, envelope 9 ou convenção nominal-v10; preferências ausentes do documento/histórico e do arquivo.

**Limitações:** preferências locais ao navegador, sem sincronização de contas/dispositivos ou atualização em tempo real entre abas; sem novos tipos de rótulo além dos especificados, cotas vinculadas ou garantia de evitar toda sobreposição em desenhos densos. Limpar dados do navegador pode apagar as preferências; o arquivo do projeto não as transporta. Sem auditoria completa de acessibilidade ou nova garantia geral de desempenho.

## Verificações consolidadas

Tipos, lint e build aprovados. Suíte de domínio/persistência da entrega: 301 testes em 21 arquivos; 48 casos distintos em Chrome/Edge. Cobertura: apresentação efetiva dos rótulos, persistência local, falha de armazenamento, readonly, histórico intacto, status e ajuda. Revisão visual nas três resoluções. Fontes: [preferências](../../tests/preferences.test.ts) e [fluxos](../../tests/e2e/preferences.spec.ts).

Referências de rastreabilidade preservadas: M6-A01–12.
