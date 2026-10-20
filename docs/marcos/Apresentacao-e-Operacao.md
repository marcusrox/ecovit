# Apresentação, operação e verificação documental

[Índice dos marcos](../Ecovit-Plano-Implementacao.md) · [PRD](../Ecovit-PRD.md) · [Arquitetura](../Ecovit-Arquitetura-Tecnica.md)

## Interface e iconografia

**Implementado:** página inicial com cartões, estado vazio e orientação de backup; editor compacto centrado no canvas; Configurações no cabeçalho junto ao nome, com ícone, identificação acessível e dica. Abertura durante renomeação confirma o nome sem perder o clique. Grupos de configurações e explicações contextuais preservam espaço de desenho. Iconografia Lucide centralizada, estados, foco e dimensões conforme [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md#iconografia).

**Verificação do Codex:** tipos, lint e build aprovados nas entregas de apresentação. Chrome/Edge verificam configurações, foco/teclado, estados, nomes acessíveis e proteção dos imports de ícones; revisão visual em 1366×768, 1280×720 e 900×680. Não constitui auditoria completa de acessibilidade nem nova execução nesta reorganização.

**Aceite específico da apresentação:** pendente do solicitante, incluindo posição/dicas do botão de configurações, abertura por teclado/durante renomeação e reconhecimento dos ícones. Os aceites globais dos marcos não atribuem aprovação específica a esses ajustes. Os ajustes posteriores de cabeçalho/cartões têm situação própria em [M5](M5-Quantitativos-e-Projetos.md).

## Favicon

**Implementado:** favicon SVG local reutilizando a casa modular do logotipo, em verde profundo sobre fundo claro arredondado, declarado no HTML e distribuído pelo build. Contrato em [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md#iconografia).

**Verificação do Codex:** tipos, lint e build aprovados, com os avisos conhecidos de Zod e tamanho do bundle. Chrome/Edge em sessões isoladas na porta 5174 confirmaram declaração no HTML, resposta HTTP 200 com tipo SVG e decodificação em 16 e 32 px. Revisão visual desses tamanhos sobre fundos claro/escuro aprovada; arquivo presente em `dist/favicon.svg`. Sem alteração dos controles, fluxos ou dados do projeto; sem nova execução das suítes de domínio ou fluxos do editor. Teste manual e aceite específico do solicitante pendentes.

## Organização dos painéis de propriedades

**Implementado:** revisão visual dos painéis de pavimento, parede, porta/janela/vão, mobiliário, medida, laje/abertura, inspeção de fiadas e diagnósticos. Preserva fontes pequenas e largura lateral; padroniza cabeçalhos, seminegritos, espaçamentos, blocos com fundo suave, campos brancos e unidades alinhadas sem quebra. Separa identificação, dimensões, representação, dados de consulta, orientações e ações. Informações calculadas de vãos e lajes usam pares de rótulo/valor; Aplicar recebe destaque verde, exclusões mantêm estilo de perigo e ações da imagem de referência permanecem na mesma linha. Contrato em [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md#painéis-de-propriedades-à-direita).

**Alcance técnico:** somente apresentação e agrupamento semântico, sem mudança de cálculos, validações, arquivo, histórico ou comandos de edição. O teste legado de vãos foi alinhado ao contrato vigente da câmera: comparar escala e centro após o redimensionamento provocado por Planta/Fiada, em vez de translação em pixels. A falha anterior foi reproduzida no commit de referência; a implementação da câmera não foi alterada.

**Verificações do Codex:** tipos, lint e build aprovados; persistem os avisos conhecidos do Zod e do bundle acima de 500 kB. Os 38 casos selecionados de editor, vãos, esquadrias, lajes, imagem de referência, medidas, canaletas, grautes e espelhamento passaram em Chrome/Edge, incluindo edição, histórico, transporte, somente leitura, teclado/foco e centralização dos ícones. Conferência adicional de 13 contextos em 1366×768, 1280×720 e 900×680 nos dois navegadores (78 combinações) confirmou ausência de rolagem horizontal, controles cortados e erros de JavaScript; incluiu imagem em ajuste/calibração e diagnósticos preenchidos. Capturas superiores/inferiores revisadas por amostra verificam hierarquia, legibilidade, unidades e alinhamento das ações. Sessões isoladas na porta 5174; sem intervenção na porta 5173. Consistência documental e `git diff --check` aprovados. Não houve nova execução das suítes completas de domínio ou navegador, nem auditoria com leitor de tela; painéis extensos continuam usando rolagem vertical.

**Aceite específico do solicitante:** recebido para as melhorias nos painéis de propriedades. Não foram informados resultados individuais de teste manual para agrupamentos, legibilidade, rolagem ou ações; as verificações do Codex permanecem separadas desse aceite.

## Foco dos campos com unidade

**Implementado:** `.unitInput` centraliza foco, distribuição de largura, fundo e espaço da unidade para os campos compostos de todo o aplicativo, incluindo pavimento, parede, vãos e Configurações (aberturas, canaletas e distância de graute). O contorno envolve a caixa inteira por `:focus-within`; o input interno não desenha contorno próprio. As regras antes restritas ao painel lateral foram consolidadas na classe compartilhada. Campos simples com unidade no rótulo mantêm seu foco padrão. Contrato em [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md#campos-com-unidade).

**Verificações do Codex:** lint e build, incluindo checagem de tipos, aprovados; avisos conhecidos de Zod e bundle permanecem. Chrome/Edge em sessões isoladas na porta 5174 verificaram 13 campos compostos em três resoluções (1366×768, 1280×720 e 900×680), por mouse e teclado: 156 conferências de contorno completo, ausência de contorno interno, unidade sem quebra/sobreposição e largura sem transbordamento. Verificados também remoção do destaque ao sair, foco dos campos simples e bloqueio de somente leitura; capturas das Configurações revisadas visualmente. Consistência documental e `git diff --check` aprovados. Sem nova execução das suítes de domínio ou de fluxos completos, nem alteração de edição, validação ou persistência.

**Aceite específico do solicitante:** recebido para a correção do foco nos campos com unidade. Não foram informados resultados individuais de teste manual por campo, navegador ou forma de foco; as verificações do Codex e os aceites anteriores permanecem preservados.

## Operação e limites

Porta 5173 reservada ao solicitante e 5174 para verificações isoladas do Codex; comandos vigentes no [README](../../README.md) e [AGENTS.md](../../AGENTS.md). A separação está implementada nos scripts; sua conferência manual específica pelo solicitante permanece pendente. Uma execução histórica de bloqueio entre abas foi interrompida sem resumo final e não é contada como suíte aprovada. Evidências concluídas de bloqueio/arquivo constam dos marcos correspondentes.

Build mantém avisos conhecidos não impeditivos de anotações do Zod e tamanho do bundle. Cargas medidas em uma entrega não constituem garantia geral de desempenho nem comprovação de capacidade em revisões posteriores. Fontes atuais: [configurações](../../tests/e2e/settings.spec.ts) e [editor](../../tests/e2e/editor.spec.ts).

## Consistência documental

O plano é índice; arquivos por marco mantêm escopo, tarefas, IDs, critérios, situação final e aceite. PRD, arquitetura e caderno conservam suas responsabilidades. Referências e IDs devem ser conferidos ao mover conteúdo. Reorganização documental não muda código, formatos, convenções, resultados de teste ou aceites.
