# Ecovit — Arquitetura Técnica

**Versão documental:** 1.35. Referência do software vigente: aplicativo 0.15.1, envelope 14 e composição nominal-v10. [Compatibilidade suportada](arquitetura/Persistencia-e-Compatibilidade.md#formato-e-leitores-vigentes).

## Responsabilidades da documentação

| Documento | Fonte de verdade |
|---|---|
| [PRD](Ecovit-PRD.md) | Comportamento do produto e limites de escopo |
| Arquitetura e seus assuntos | Representação em dados, módulos, algoritmos, interação, estado e persistência do software |
| [Caderno Técnico](Ecovit-Caderno-Tecnico.md) | Regras e convenções geométricas/construtivas, justificativas, fontes, exemplos independentes e limites de validade |
| [Plano e marcos](Ecovit-Plano-Implementacao.md) | Entregas, tarefas/IDs, verificações executadas, limitações e aceites |

Uma decisão de programação não estabelece uma regra construtiva. Antes de mudar o motor, consultar CT/EX do Caderno; antes de mudar comportamento, consultar RF do PRD. A arquitetura descreve como implementar esses contratos, sem repetir sua pesquisa ou tratar convenções nominais como comprovação física. Campos persistidos e códigos legados ainda aceitos conservam seus nomes; contratos/migrações abandonados ficam no histórico do Git e nos marcos.

## Assuntos

| Referência | Contratos principais |
|---|---|
| [Modelo e geometria](arquitetura/Modelo-e-Geometria.md) | Unidades, precisão, identidades e referências compartilhadas |
| [Elementos construtivos](arquitetura/Elementos-Construtivos.md) | Pavimentos, paredes, vãos, lajes e operações sobre seus dependentes |
| [Editor e interação](arquitetura/Editor-e-Interacao.md) | Planta/Fiada, câmera, seleção, gestos, camadas e comparação de pavimentos |
| [Estado, histórico e operações](arquitetura/Estado-Historico-e-Operacoes.md) | Intenção/resultado/sessão, atomicidade, histórico e critério único de recálculo |
| [Motor e diagnósticos](arquitetura/Motor-e-Diagnosticos.md) | Pipeline nominal-v10, pavimentos, ajustes, encontros, alturas e diagnósticos |
| [Persistência e compatibilidade](arquitetura/Persistencia-e-Compatibilidade.md) | Envelope, leitores 9–14, validação, armazenamento, transporte e bloqueios |
| [Medidas e imagens](arquitetura/Medidas-e-Imagens.md) | Medidas, referências raster, mobiliários, recursos, calibração e cache |
| [Interface e iconografia](arquitetura/Interface-e-Iconografia.md) | Lucide centralizado, acessibilidade, preferências, status e componentes comuns |
| [Quantitativos](arquitetura/Quantitativos.md) | Projeção das peças finais, perdas e consulta independente |
| [Qualidade e desempenho](arquitetura/Qualidade-e-Desempenho.md) | Estratégia de testes, observação de desempenho e limites de evolução |

## Aplicação e stack

Um único aplicativo web estático, executado no navegador, em JavaScript/TypeScript. Interface focada em computadores com mouse e teclado. O usuário acessa o site, trabalha localmente e salva projetos no navegador ou em arquivos .ecovit.

Não haverá backend, login, banco remoto ou serviço pago obrigatório na primeira versão. Não será criada uma prova de conceito separada: o desenvolvimento será feito diretamente no produto, com testes funcionais e de desempenho ao longo da implementação.

O aplicativo contém três responsabilidades principais: interface/editor, motor construtivo e persistência. São módulos do mesmo repositório, não aplicações ou serviços independentes.

| Responsabilidade | Tecnologia | Motivo no Ecovit |
|---|---|---|
| Linguagem | TypeScript em modo strict | Tipar geometria, entidades, comandos e arquivos |
| Interface | React | Componentes para barras, propriedades e modos do editor |
| Desenvolvimento e build | Vite | Gerar aplicação estática |
| Canvas 2D | Konva + react-konva | Formas, eventos, camadas, seleção e integração React |
| Estado da aplicação | Zustand | Atualizações seletivas de projeto e controles sem propagar toda mudança à interface |
| Estilos | CSS Modules e variáveis CSS | Estilo compacto sem framework visual adicional |
| Armazenamento local | IndexedDB com Dexie | Persistir documentos estruturados por projeto |
| Validação de arquivos | Zod | Validar dados carregados em tempo de execução |
| Cálculo | Funções TypeScript no fluxo principal | Uma operação por vez, aceitando espera durante o processamento |
| Testes de domínio | Vitest | Geometria, encontros, propagação e arquivos |
| Testes do produto no navegador | Playwright | Gestos, modos, salvamento e reabertura |
| Qualidade do código | TypeScript, ESLint e Prettier | Verificação de tipos e consistência |
| Pacotes e scripts | npm | Ferramenta suficiente para um único aplicativo |
| Publicação | Arquivos estáticos em Cloudflare Pages ou servidor administrado por aaPanel | Mesma compilação nos dois destinos |

Usar releases estáveis e compatíveis, com versões fixadas no package-lock.json. A versão principal de react-konva deve acompanhar a versão principal do React segundo sua documentação. Não usar versões beta por padrão.

As dependências escolhidas são de código aberto, sem licença comercial obrigatória para esta solução. Conferir as licenças das versões instaladas e preservar seus avisos. Não será usado SDK comercial de editor.

## Organização do código

Um repositório, um pacote e um build. Estrutura implementada:

- src/app: tela de projetos, editor e propriedades.
- src/editor: canvas, modos Planta/Fiada, ferramentas, seleção e câmera.
- src/domain: tipos do projeto, geometria, operações de edição e motor de composição, canaletas e grautes.
- src/state: estado compartilhado e coordenação de comandos/resultados.
- src/persistence: IndexedDB e leitura/escrita estrita do formato .ecovit vigente.
- src/ui: iconografia e estilos comuns.
- tests: casos de domínio, arquivos de referência, persistência e fluxos de navegador.

A consulta de quantitativos é uma projeção de leitura do resultado confirmado. Não há diretório separado src/engine; o motor reside em src/domain.

Sem monorepo, injeção de dependências genérica, barramento de eventos global, arquitetura de plugins ou abstração de múltiplos renderizadores. Extrair uma função ou módulo quando houver responsabilidade concreta.

O domínio e o motor não importam React, Zustand, Konva ou Dexie. São funções TypeScript que recebem dados e retornam dados. Essa separação permitirá testar o cálculo sem abrir a interface e reaproveitar o modelo no futuro.

## Publicação e operação

O build gera a pasta dist. Ela poderá ser publicada no Cloudflare Pages ou no servidor web configurado no aaPanel. Não será necessário executar Node.js no servidor de produção.

Cloudflare Pages: comando npm run build e diretório dist. Em aaPanel: publicar o conteúdo de dist em diretório do site, configurar HTTPS, tipo adequado para módulos JavaScript e fallback de navegação quando houver rotas. Configurar base do Vite se o aplicativo estiver em subdiretório.

Preferir um endereço estável, por exemplo um subdomínio dedicado, pois IndexedDB pertence à origem do site. Mudar domínio/protocolo não transfere os projetos locais; arquivos .ecovit permitem transporte.

Operação local: `127.0.0.1:5173` é reservado ao solicitante, que inicia o servidor; o Codex somente fornece a orientação de início. Testes automatizados e verificações interativas do Codex usam `127.0.0.1:5174` e sessões isoladas. Playwright gerencia servidor próprio com porta estrita, sem reutilizar instâncias existentes. `dev:test` permite iniciar o servidor de verificações interativas. A origem dos projetos pessoais permanece 5173; esta separação não altera o bloqueio por projeto nem a atualização automática do servidor de desenvolvimento.

Inicialmente o acesso exige conexão para carregar o aplicativo. Depois de aberto, operações locais não dependem de API remota, mas recarregamento offline não será garantido. Sem PWA ou Service Worker nesta fase, pois funcionamento offline não é requisito.

Publicar recursos estáticos com nomes de conteúdo gerados pelo build e evitar cache prolongado do HTML. Não carregar dependências essenciais por CDN externa em tempo de uso.

Referências: [publicação estática do Vite](https://vite.dev/guide/static-deploy.html) e [configuração de build do Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/build-configuration/).

## Manutenção

Cada contrato tem um assunto responsável; documentos de funcionalidades apontam para regras comuns de estado, persistência e interface. Alterações devem atualizar a fonte correspondente e seus links, sem duplicar versões de formato, critérios de recálculo ou limites de entrada. Aceites e resultados de execução permanecem nos marcos. Esta consolidação não altera código, formato suportado ou comportamento do aplicativo.

Reorganização conferida contra os tipos, schema e comparação de insumos do código vigente, com revisão de referências locais e fragmentos. Não representa execução de testes do aplicativo.
