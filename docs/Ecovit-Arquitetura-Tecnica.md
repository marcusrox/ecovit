# Ecovit — Arquitetura Técnica

Aplicação web 2D com editor no navegador, API no mesmo domínio e PostgreSQL. O contrato de transporte usa envelope 18 e composição nominal-v10, conforme a [matriz de compatibilidade](arquitetura/Persistencia-e-Compatibilidade.md#formato-e-leitores-vigentes).

## Responsabilidades da documentação

| Documento | Fonte de verdade |
|---|---|
| [PRD](Ecovit-PRD.md) | Comportamento do produto e limites de escopo |
| Arquitetura e seus assuntos | Representação em dados, módulos, algoritmos, interação, estado e persistência do software |
| [Caderno Técnico](Ecovit-Caderno-Tecnico.md) | Regras e convenções geométricas/construtivas, justificativas, fontes, exemplos independentes e limites de validade |
| [Tasks](tasks/README.md) | Escopo das alterações, verificações e aceites |

Uma decisão de programação não estabelece uma regra construtiva. Antes de mudar o motor, consultar CT/EX do Caderno; antes de mudar comportamento, consultar RF do PRD. A arquitetura descreve como implementar esses contratos, sem repetir sua pesquisa ou tratar convenções nominais como comprovação física. Campos persistidos e códigos legados ainda aceitos conservam seus nomes; a matriz de leitores é a referência de compatibilidade.

## Assuntos

| Referência | Contratos principais |
|---|---|
| [Modelo e geometria](arquitetura/Modelo-e-Geometria.md) | Unidades, precisão, identidades, terreno global e referências compartilhadas |
| [Elementos construtivos](arquitetura/Elementos-Construtivos.md) | Pavimentos, paredes, vãos, lajes e operações sobre seus dependentes |
| [Editor e interação](arquitetura/Editor-e-Interacao.md) | Planta/Fiada, câmera, seleção, gestos, camadas e comparação de pavimentos |
| [Estado, histórico e operações](arquitetura/Estado-Historico-e-Operacoes.md) | Intenção/resultado/sessão, atomicidade, histórico e critério único de recálculo |
| [Motor e diagnósticos](arquitetura/Motor-e-Diagnosticos.md) | Pipeline nominal-v10, pavimentos, ajustes, encontros, alturas e diagnósticos |
| [Persistência e compatibilidade](arquitetura/Persistencia-e-Compatibilidade.md) | Envelope, leitores 9–18, validação, armazenamento, transporte e bloqueios |
| [Autenticação e acesso](arquitetura/Autenticacao-e-Acesso.md) | código por e-mail, sessões, isolamento por proprietário e exclusão da conta |
| [Medidas e imagens](arquitetura/Medidas-e-Imagens.md) | Medidas, referências raster, mobiliários, recursos, calibração e cache |
| [Interface e iconografia](arquitetura/Interface-e-Iconografia.md) | Lucide centralizado, acessibilidade, preferências, status e componentes comuns |
| [Quantitativos](arquitetura/Quantitativos.md) | Projeção das peças finais, perdas e consulta independente |
| [Qualidade e desempenho](arquitetura/Qualidade-e-Desempenho.md) | Estratégia de testes, observação de desempenho e limites de evolução |

## M12 — organização da aplicação

### Organização simples da aplicação

Decisão de M12: uma aplicação em um repositório, com frontend existente e uma API Node dividida apenas em módulos de autenticação, projetos e uploads. Editor/motor continuam no navegador; domínio/validação pura é compartilhado. API e frontend têm builds próprios, mas são publicados na mesma origem pelo aaPanel. PostgreSQL 18.0, diretório privado de imagens e Resend são a infraestrutura utilizada, sem microserviços, Redis, barramento, WebSocket ou abstração para múltiplos bancos.

Uma chamada normal de gravação por alteração, com revisão e identificador de repetição; não preparar cada operação em outra chamada. Upload separado somente quando houver bytes novos, com temporário e associação ao salvar. Um único tratamento de falha atende editar/undo/redo e demais gravações. Uma rotina agendada do mesmo pacote limpa temporários, lixeira e contas excluídas. Processo filho transitório atende somente validação pesada, sem outro serviço persistente ou fila. Biblioteca/módulo só é extraído quando concretamente necessário.

Sessão, autorização por proprietário, validação, SQL parametrizado, CSRF e limites permanecem obrigatórios; simplificar fluxo não remove esses controles. Contrato em [Segurança comum da API](arquitetura/Autenticacao-e-Acesso.md#segurança-comum-da-api).

### Publicação e contratos

Frontend/editor/motor TypeScript e API TypeScript/Node ficam no mesmo repositório, servidos no mesmo domínio HTTPS por proxy no aaPanel. API acessa PostgreSQL e imagens em diretório privado; banco não é acessível pelo navegador. Runtime e bibliotecas usados estão na tabela de stack abaixo; o ambiente real de implantação ainda precisa de homologação. Preservar separação do domínio; não criar microserviços, fila offline ou editor paralelo.

Intenção validada é a fonte persistente remota; peças/diagnósticos são derivados localmente, sem segunda escrita só para cálculo. Documento remoto tem versão independente do envelope .ecovit. Validação de importação com recomputação roda em processo filho isolado da API, sem fila, com timeout de 90 s e heap V8 de 1 GiB; a capacidade do ambiente de produção ainda precisa de homologação; isso não introduz Worker no editor. Extrair funções puras de validação/serialização dos módulos que também contêm APIs DOM; frontend e API têm configurações de build próprias. Protocolo de revisão/idempotência, imagens e transição manual estão em [Persistência — M12](arquitetura/Persistencia-e-Compatibilidade.md#m12--persistência-remota); fluxos de falha em [Estado — M12](arquitetura/Estado-Historico-e-Operacoes.md#m12--estados-remotos); identidade em [Autenticação](arquitetura/Autenticacao-e-Acesso.md).

Conta obrigatória, com edição online e importação manual de arquivos .ecovit suportados. Código por e-mail usa Resend com idevs.com.br, via API HTTPS; domínio verificado e API key restrita ficam no backend. Produção usa aaPanel, Node 24.x e PostgreSQL 18 em emdia.idevs.com.br. Documentos usam JSON nativo, com mapeamento de tipos, transações e conexão definidos no assunto Persistência. Requisitos de recursos são fornecidos para validação do administrador, sem inspeção ou obrigação de divulgar a configuração atual. Cotas, lixeira e exclusão seguem o PRD, sem nova regra construtiva. Backup do servidor permanece a cargo do administrador, fora do escopo desta especificação.

## Aplicação e stack

Uma aplicação no mesmo repositório: frontend estático e uma API Node modular, publicados na mesma origem. Conta é obrigatória e a intenção fica no PostgreSQL; cálculo e edição continuam no navegador.

| Responsabilidade | Implementação |
|---|---|
| Frontend | TypeScript strict, React, Vite, Konva/react-konva, Zustand e CSS Modules |
| Contratos e validação | Zod e funções puras compartilhadas em src/domain e src/persistence/document.ts |
| API | Node 24.18.0, TypeScript e Fastify 5.12.7 |
| Banco | PostgreSQL 18.0 e pg 8.23.1; SQL parametrizado e transações, sem ORM |
| Imagens privadas | Arquivos fora da raiz pública; Sharp 0.35.5 para decodificação em processo filho |
| Códigos por e-mail | Resend HTTPS com fetch nativo, sem SDK ou transporte SMTP adicional |
| Qualidade | TypeScript, ESLint, Prettier, Vitest e Playwright em Chrome/Edge |
| Build | Vite para dist; esbuild 0.28.2 para dist-server; dependências fixadas no lockfile |

## Organização do código

- src/app: conta, lista privada, lixeira, diálogos e editor.
- src/editor, src/domain, src/state e src/ui: responsabilidades descritas nos assuntos acima; sem alterar as regras do motor na M12.
- src/persistence/document.ts: envelope/validação pura; files.ts: leitura/download pelo navegador; remote-document.ts: representação remota sem bytes; http.ts/remote.ts: sessão HTTP, revisões e repetição da operação.
- server/auth.ts e security.ts: códigos, sessões, autorização e proteções comuns.
- server/projects.ts: documentos, cotas, revisões, imagens e operações de projeto.
- server/db.ts e schema.sql: conexão, transações e migração inicial versionada.
- server/validation.ts e validate-worker.ts: processo filho transitório para importação e raster.
- server/cleanup.ts e cli.ts: rotina única de manutenção e comandos administrativos.

Não há microserviços, fila, Redis, ORM, WebSocket, sincronização offline ou abstração para vários bancos. O domínio não importa React, Zustand, Konva ou o backend.

## Publicação e operação

A API escuta somente em loopback. O proxy aaPanel serve dist e encaminha /api; PostgreSQL e imagens permanecem privados. Configuração, migração, privilégios e agendamento estão em [Persistência e compatibilidade](arquitetura/Persistencia-e-Compatibilidade.md#operação-e-implantação). Segredos nunca usam prefixo VITE_. O ambiente de produção não foi configurado nesta implementação.

Editor e API usam o [fluxo sequencial](arquitetura/Estado-Historico-e-Operacoes.md#fluxo-sequencial): uma confirmação remota por alteração, seguida de cálculo local quando necessário. Recuperação conserva candidato/histórico e usa o mesmo identificador; abertura recompõe sem gravar. Sem PWA ou promessa de operação offline.

## Manutenção

Cada contrato tem um assunto responsável. Atualize o assunto afetado junto com a implementação e registre os critérios, as evidências e a situação do aceite na task correspondente. Os [registros dos marcos](arquivo/Ecovit-Plano-Implementacao.md) preservam a rastreabilidade histórica.
