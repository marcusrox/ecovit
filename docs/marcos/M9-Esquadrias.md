# M9 — Tipos e orientação de portas e janelas

[Índice dos marcos](../Ecovit-Plano-Implementacao.md) · [PRD](../Ecovit-PRD.md) · [Arquitetura](../Ecovit-Arquitetura-Tecnica.md) · [Caderno técnico](../Ecovit-Caderno-Tecnico.md)

Registro consolidado da entrega. Versões e verificações referem-se ao marco; o comportamento e os formatos vigentes são definidos nas referências por assunto. Aceite global não atribui resultado individual a roteiros manuais.

**Estado: implementado, verificado pelo Codex e aceito pelo solicitante.** Origem BL-08; RF-06, [Elementos construtivos](../arquitetura/Elementos-Construtivos.md#vãos-e-aparência-de-esquadrias), CT-17/EX-95–99. Aceite funcional global na [M9 §16.4](M9-Esquadrias.md#164-aceite-do-solicitante), separado das verificações do Codex.

## 16.1. Alcance

Nove variantes: portas de giro simples/duplo, correr simples/central e basculante de garagem; janelas de giro simples/duplo, correr de duas folhas e basculante. Símbolos conforme proposta aprovada, seletor contextual e um único botão Alternar orientação com ciclo completo. Padrões novos, preservação de genéricos legados, prévia, referências, arquivo/cópias/histórico e ausência de recálculo visual conforme contratos responsáveis. Fora do marco: demais tipos, colisões, animação, ferragens e contagem de esquadrias.

## 16.2. Tarefas e aceite

- [x] M9-T01: consolidar escopo aprovado e convenção visual nos documentos responsáveis.
- [x] M9-T02: dados, validação e normalização de arquivos/local para envelope 12.
- [x] M9-T03: símbolos compartilhados, seletor, botão cíclico e integração ao editor.
- [x] M9-T04: verificar regressões, corrigir falhas e consolidar evidências/limites.

| ID | Resultado verificável |
|---|---|
| M9-A01 | Nove variantes reconhecíveis sem cor/rótulo, proporcionais, nas duas direções de parede; tipos e defaults corretos. |
| M9-A02 | Um único botão percorre quatro ou duas orientações e retorna à inicial; texto acessível identifica posição. Tipo/orientação aplicam sem confirmar dimensões em edição. |
| M9-A03 | Seleção/movimento/alças pelo vão, leitura das dimensões e validações mantidos; cópias, histórico, reabertura e arquivo preservam aparência. |
| M9-A04 | Mudança exclusivamente visual não chama motor nem altera resultado/diagnósticos/quantidades, inclusive resultado desatualizado e undo/redo. |
| M9-A05 | Leitura íntegra de 9/10/11 preserva genéricos/origem; 12 recusa tipo/orientação/combinação inválidos e snapshot adulterado. |
| M9-A06 | Referência usa símbolos sem interação, Fiada sem folhas/arcos/setas, preferências ocultam somente rótulos e readonly bloqueia alterações. |
| M9-A07 | Chrome/Edge, teclado, foco e painel/canvas legíveis em 1366×768, 1280×720 e 900×680; tipos/lint/build e testes pertinentes aprovados. |

## 16.3. Verificações, limites e aceite

**Alcance implementado:** nove variantes em Planta e na referência de pavimento; geometria compartilhada com a prévia contextual. Seletor Tipo da esquadria e único botão Alternar orientação, ciclos completos de duas/quatro posições, indicação acessível da posição e preservação do foco após salvamento para uso repetido por teclado. Alterações visuais imediatas independentes dos campos dimensionais em edição; criação pendente só confirma com dimensões válidas. Novas portas em giro simples e janelas em correr; genéricos anteriores preservados até escolha explícita. Enquadramento inclui projeções em Planta; Fiada conserva o vão sem folhas/arcos/setas. Histórico, readonly, gravação/recuperação, arquivo e cópias integrados, incluindo cópia independente de appearance na duplicação de pavimento. Alterações visuais não chamam motor nem invalidam resultados atuais/desatualizados. Aplicativo 0.14.0, envelope 12 com leitura de 9/10/11, nominal-v10 preservado; sem dependências novas.

**Limites:** símbolos esquemáticos sem simulação, colisões ou declaração normativa; projeção basculante não informa altura/curso físico. Quantitativos permanecem de peças da composição, sem esquadrias. Projeções não viram alvos de seleção/atração; selecionar pelo vão ou pela lista de elementos. Rótulos podem sobrepor símbolos em desenhos densos; a preferência permite ocultá-los. Envelope 12 pode ser recusado por aplicativos anteriores. Aceites dos marcos anteriores preservados; aceite funcional global do M9 registrado na [M9 §16.4](M9-Esquadrias.md#164-aceite-do-solicitante), sem alterar estes limites.

**Integridade da sessão e bloqueios — RF-12/[Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md#formato-e-leitores-vigentes):** abertura repetida do mesmo projeto editável a partir do registro salvo conserva documento/histórico e trava; inicialização explícita reutiliza a trava própria e preserva a sessão anterior em caso de validação inválida. Descarte do store no hot reload impede novas alterações naquela instância, aguarda operação em andamento e libera a trava antes da substituição. Voltar à lista não mantém bloqueio de edição. O solicitante confirmou o funcionamento após a correção, conforme o aceite global deste marco.

## 16.4. Aceite do solicitante

**Aceite global do solicitante:** M9 testado e aprovado por confirmação explícita nesta conversa. O solicitante declarou ter testado os tipos de portas e janelas e confirmou o funcionamento após a correção do bloqueio de edição. O aceite encerra a pendência funcional global do marco, preservando as verificações do Codex e as limitações registradas na [M9 §16.3](M9-Esquadrias.md#163-verificações-limites-e-aceite). Os resultados individuais do roteiro manual não foram informados. Não autoriza iniciar outros itens do backlog.

No servidor habitual iniciado pelo solicitante com `./Start-Ecovit.ps1 -Task dev`, na porta 5173:

## Verificações consolidadas

Tipos, lint e build aprovados. Testes verificam tipos/orientações permitidos, combinações inválidas, normalização dos arquivos anteriores e preservação de aparência no histórico/cópias. Chrome/Edge verificam nove variantes, orientação cíclica, símbolos, seleção e transporte, com revisão visual nas três resoluções. Fontes: [aparência](../../tests/opening-appearance.test.ts) e [fluxos](../../tests/e2e/opening-appearance.spec.ts).

Referências de rastreabilidade preservadas: M9-A01–07.
