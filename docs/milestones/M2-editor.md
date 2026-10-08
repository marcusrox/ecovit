# M2 — Editor

Marco **M2 — Editor** do [PRD 1.1](../PRD.md), seções 3, 5, 8 e 13. Status em 07/10/2026: planejado; a tela atual é o editor vazio de M0.

## Objetivo e dependências

Entregar ferramentas, snaps, propriedades, comandos, cotas, histórico e rascunho, consumindo o núcleo validado de [M1](M1-nucleo.md). Demonstrar **RF02–RF07 e RF10–RF12**.

Adicionar Zustand e Dexie quando os estados e rascunhos forem implementados. Separar documento, seleção, histórico, ferramenta e viewport; o Canvas não é a fonte dos dados.

## Entregas

- Desenho ortogonal por cliques/distância numérica e edição de extremos/alturas; prevenção de segmento nulo.
- Configuração de tijolo/juntas/altura com confirmação, recálculo e possibilidade de desfazer.
- Seleção por clique/retângulo, mover, copiar/colar, duplicar e excluir paredes/vãos.
- Ferramentas de portas e janelas, posicionamento, arraste e edição numérica.
- Grid independente do passo, snaps, sugestões modulares, pan e zoom.
- Cotas associativas, lista de elementos e alternativas DOM por teclado.
- Comandos confirmados, histórico, diagnósticos navegáveis e sugestões explícitas/desfazíveis.
- Rascunho local após comando confirmado; recuperação e sincronização confiáveis serão concluídas em M4.

## Critérios de aceite

- [ ] RF02–RF07 e RF10–RF12 demonstrados nos fluxos de interface.
- [ ] Entrada em m/cm/mm com vírgula ou ponto; valores sem representação inteira em mm recusados.
- [ ] Arraste produz prévia; soltar confirma uma operação; Esc cancela.
- [ ] Snap com raio de 8 px, prioridades e desempate por distância/ID conforme RF05.
- [ ] Sugestões modulares exigem aceitação explícita; incompatibilidade pode ser mantida para diagnóstico.
- [ ] Zoom preserva o ponto sob o cursor; pan por botão do meio ou Espaço+arraste; controles equivalentes disponíveis.
- [ ] Duplicar parede inclui vãos com novos UUIDs; excluir parede remove vãos e cotas afetadas na mesma operação desfazível.
- [ ] Reduzir parede preserva offsets e diagnostica vãos fora; inverter orientação preserva posição física e sentido de abertura.
- [ ] Cotas acompanham suas âncoras; perder referência remove a cota na mesma operação.
- [ ] Histórico mínimo de 100 operações; novo comando após undo limpa redo; autosave fica fora do histórico.
- [ ] Diagnósticos filtráveis/localizáveis; aplicar sugestão é ação explícita e desfazível.
- [ ] Atalhos não interceptam campos de texto; labels, foco e edição numérica por teclado disponíveis.
- [ ] Rascunho IndexedDB gravado até 500 ms após confirmação; falha de quota não simula salvamento.

## Verificação

Vitest para comandos e histórico: mover com vãos, excluir com cotas, trocar tijolo, undo/redo e cancelar arraste. Playwright demonstra as ações e alternativas de teclado. Manter as metas de feedback/snap/pan/zoom do PRD e registrar evidências.

## Limites e continuidade

M2 implementa interação sobre regras de M1; não inventa catálogo construtivo. Navegação completa de fiadas, elevações e relatórios é [M3 — Inspeção](M3-inspecao.md). Autosave remoto, recuperação, conflito entre abas e rascunhos particionados por usuário têm aceite completo em [M4 — Persistência](M4-persistencia.md).
