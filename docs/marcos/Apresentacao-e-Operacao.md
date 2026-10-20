# Apresentação, operação e verificação documental

[Índice dos marcos](../Ecovit-Plano-Implementacao.md) · [PRD](../Ecovit-PRD.md) · [Arquitetura](../Ecovit-Arquitetura-Tecnica.md)

## Interface e iconografia

**Implementado:** página inicial com cartões, estado vazio e orientação de backup; editor compacto centrado no canvas; Configurações no cabeçalho junto ao nome, com ícone, identificação acessível e dica. Abertura durante renomeação confirma o nome sem perder o clique. Grupos de configurações e explicações contextuais preservam espaço de desenho. Iconografia Lucide centralizada, estados, foco e dimensões conforme [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md#iconografia).

**Verificação do Codex:** tipos, lint e build aprovados nas entregas de apresentação. Chrome/Edge verificam configurações, foco/teclado, estados, nomes acessíveis e proteção dos imports de ícones; revisão visual em 1366×768, 1280×720 e 900×680. Não constitui auditoria completa de acessibilidade nem nova execução nesta reorganização.

**Aceite específico da apresentação:** pendente do solicitante, incluindo posição/dicas do botão de configurações, abertura por teclado/durante renomeação e reconhecimento dos ícones. Os aceites globais dos marcos não atribuem aprovação específica a esses ajustes. Os ajustes posteriores de cabeçalho/cartões têm situação própria em [M5](M5-Quantitativos-e-Projetos.md).

## Favicon

**Implementado:** favicon SVG local reutilizando a casa modular do logotipo, em verde profundo sobre fundo claro arredondado, declarado no HTML e distribuído pelo build. Contrato em [Interface e iconografia](../arquitetura/Interface-e-Iconografia.md#iconografia).

**Verificação do Codex:** tipos, lint e build aprovados, com os avisos conhecidos de Zod e tamanho do bundle. Chrome/Edge em sessões isoladas na porta 5174 confirmaram declaração no HTML, resposta HTTP 200 com tipo SVG e decodificação em 16 e 32 px. Revisão visual desses tamanhos sobre fundos claro/escuro aprovada; arquivo presente em `dist/favicon.svg`. Sem alteração dos controles, fluxos ou dados do projeto; sem nova execução das suítes de domínio ou fluxos do editor. Teste manual e aceite específico do solicitante pendentes.

## Operação e limites

Porta 5173 reservada ao solicitante e 5174 para verificações isoladas do Codex; comandos vigentes no [README](../../README.md) e [AGENTS.md](../../AGENTS.md). A separação está implementada nos scripts; sua conferência manual específica pelo solicitante permanece pendente. Uma execução histórica de bloqueio entre abas foi interrompida sem resumo final e não é contada como suíte aprovada. Evidências concluídas de bloqueio/arquivo constam dos marcos correspondentes.

Build mantém avisos conhecidos não impeditivos de anotações do Zod e tamanho do bundle. Cargas medidas em uma entrega não constituem garantia geral de desempenho nem comprovação de capacidade em revisões posteriores. Fontes atuais: [configurações](../../tests/e2e/settings.spec.ts) e [editor](../../tests/e2e/editor.spec.ts).

## Consistência documental

O plano é índice; arquivos por marco mantêm escopo, tarefas, IDs, critérios, situação final e aceite. PRD, arquitetura e caderno conservam suas responsabilidades. Referências e IDs devem ser conferidos ao mover conteúdo. Reorganização documental não muda código, formatos, convenções, resultados de teste ou aceites.
