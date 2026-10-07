# PRD — Sistema Web para Projetos em Tijolo Ecológico

**Versão:** 1.1 — stack simplificada  
**Atualização:** 07/10/2026  
**Status:** especificação para implementação incremental; liberação da paginação condicionada à validação técnica do marco M1.  
**Plataforma:** navegador desktop. **Idioma:** português do Brasil.

## 1. Visão e resultado esperado

Criar um editor web que transforme uma planta arquitetônica em paredes moduladas, fiadas, peças e quantitativos rastreáveis de tijolos ecológicos de solo-cimento.

**Projeto → paredes e vãos → validação geométrica → paginação → diagnósticos → quantitativos → exportação.**

O modelo paramétrico será a fonte única para planta, fiadas e elevações. Comprimento modular sozinho não garante solução válida: encontros, aberturas, colisões e amarração também precisam ser verificados.

| Usuário | Necessidade prioritária |
|---|---|
| Projetista, arquiteto e engenheiro | Precisão, inspeção de fiadas e revisão da modulação |
| Fabricante | Configuração dimensional e estimativa de peças |
| Autoconstrutor | Explorar planta e discutir resultados com profissional |

O fluxo inicial será otimizado para projetistas. Não haverá permissões diferentes por profissão no MVP.

O MVP fornece estudo geométrico e estimativa de materiais. Não dimensiona estruturas, grautes, armaduras ou vergas e não certifica conformidade normativa. Exportações terão o aviso: “Estudo de modulação sujeito à validação do sistema construtivo e de profissional habilitado. Não constitui dimensionamento estrutural.”

## 2. Escopo fechado do MVP

### Incluído

- Contas individuais, projetos privados e lista de projetos.
- Um pavimento, elevação zero e uma configuração de tijolo por projeto.
- Paredes horizontais/verticais, espessura única igual à largura do tijolo.
- Paredes isoladas, continuidade e encontros ortogonais L/T/cruzamento conforme catálogo validado em M1.
- Portas e janelas retangulares vinculadas a uma parede.
- Seleção, edição numérica, mover, duplicar, excluir e desfazer/refazer.
- Grid, pan, zoom, snaps e sugestões modulares durante o desenho.
- Paginação com inteiros/meios e diagnóstico de regiões incompatíveis.
- Navegação de fiadas, elevação 2D e cotas associativas.
- Quantitativos por parede/projeto e perdas por tipo.
- Rascunho local, autosave remoto, recuperação e conflitos.
- Importação/exportação JSON; exportação CSV de quantitativos e SVG da vista atual.

### Fora do MVP

3D, múltiplos pavimentos editáveis, paredes diagonais/curvas, espessuras variadas, cômodos automáticos, plantas de referência, PDF, DXF, IFC, colaboração, compartilhamento público, cobrança, orçamento, catálogo de fabricantes, instalações e cálculo estrutural.

Canaletas, grautes, vergas, contravergas e peças cortadas não serão gerados ou contabilizados automaticamente. Região que requer peça especial será diagnóstico, nunca peça fictícia na lista de compra.

### Limites

Até 100 paredes, 100 aberturas, 60 fiadas por parede, 50.000 peças derivadas e extensão de 100 m por eixo. Documento JSON até 5 MiB. Recusar operações/importações acima dos limites com mensagem específica, sem truncamento silencioso.

## 3. Fluxo principal

1. Entrar, criar projeto e informar nome.
2. Escolher dimensões do tijolo, confirmar altura/juntas e altura padrão de paredes.
3. Desenhar por cliques ou distância numérica.
4. Inserir e posicionar portas/janelas.
5. Revisar diagnósticos e aceitar sugestões explicitamente.
6. Inspecionar fiadas/elevações e conferir quantitativos.
7. Salvar, exportar e reabrir sem perda do documento.

Arraste produz prévia; soltar confirma uma operação. Esc cancela. Alterações confirmadas recalculam saídas. Geometria incompatível pode ser salva, mas seus resultados aparecem como parciais.

## 4. Stack tecnológica definida

Uma aplicação **React + TypeScript + Vite**, conectada diretamente ao **Supabase**. O editor, a geometria e a paginação executam no navegador. A operação inicial terá dois serviços: Cloudflare Pages para a aplicação estática e Supabase para autenticação e banco de dados.

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Aplicação | React + TypeScript strict + Vite | SPA, modelo e motores |
| Rotas | React Router | Autenticação, projetos e editor |
| Aparência | CSS Modules | Estilos locais sem framework visual adicional |
| Canvas 2D | Konva + react-konva | Planta, fiadas e elevações |
| Estado do editor | Zustand | Documento, seleção, histórico e ferramentas separados |
| Conta e nuvem | Supabase Auth + PostgreSQL, via @supabase/supabase-js | E-mail/senha, confirmação, recuperação e projetos privados |
| Validação | Zod | Documentos importados/carregados e comandos |
| Motor | Módulos TypeScript internos | Geometria, paginação e quantitativos independentes da interface |
| Processamento | Web Worker nativo | Recálculo sem bloquear interface |
| Persistência local | IndexedDB + Dexie | Rascunhos e alterações pendentes |
| Testes | Vitest + Playwright | Motor, invariantes, persistência e fluxos completos |
| Publicação | Cloudflare Pages | Build estático com HTTPS |

Usar **npm e um único package.json**. Node.js 24 LTS será ferramenta de desenvolvimento/build, sem processo Node em produção. GitHub Actions executará verificações; Cloudflare Pages publicará o build aprovado da branch principal. Não exigir Docker para instalar, desenvolver ou executar testes do front-end; testes de banco usam um projeto Supabase de homologação isolado de produção.

Fastify, Prisma, TanStack Query, Tailwind, Radix, monorepo, VPS e Caddy saem da primeira versão. Konva, Zustand e Dexie permanecem por reduzir trabalho próprio em desenho, estado e armazenamento. Componentes visuais usarão HTML semântico, CSS Modules e os recursos nativos do navegador, mantendo os critérios de acessibilidade.

Sem filas distribuídas, Redis, Storage, funções de servidor ou dependências 3D no MVP. Exportações são geradas no navegador. Three.js + React Three Fiber entram após validar o 2D, sob demanda, derivados do mesmo documento.

### Versões e configuração

M0 fixará versões exatas compatíveis no package-lock.json e a versão Node usada em desenvolvimento/CI. Registrar comandos no README: `npm install`, `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm test` e `npm run test:e2e`. CI usa `npm ci`. Atualizações passam pelos testes.

Variáveis públicas do Vite: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Não incluir senha do banco, chave secreta ou service_role no bundle. Credenciais administrativas ficam somente no ambiente autorizado de aplicação das migrações e testes de homologação, nunca em variáveis VITE_.

Supabase Auth gerencia a sessão; Supabase valida os tokens nas chamadas. No banco, a identidade vem de `auth.uid()`. Não implementar verificação JWT/JWKS própria. Configurar URLs de confirmação/recuperação para desenvolvimento e produção; previews usam somente homologação.

Publicar o diretório `dist` gerado por `npm run build`, com fallback de SPA para as rotas do React Router. Migrações SQL ficam versionadas e são aplicadas por ferramenta administrativa do Supabase, sem ORM ou serviço permanente adicional.

### Referências oficiais

- [Vite](https://vite.dev/guide/) e [Web Workers](https://vite.dev/guide/features.html): aplicação estática e processamento em worker.
- [Desempenho Konva](https://konvajs.org/docs/performance/All_Performance_Tips.html): camadas e redesenho seletivo.
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) e [chaves de API](https://supabase.com/docs/guides/getting-started/api-keys): acesso do navegador com autorização no banco.
- [Funções PostgreSQL no Supabase](https://supabase.com/docs/guides/database/functions): salvamento transacional via RPC.
- [Publicação estática com Vite](https://vite.dev/guide/static-deploy.html): build e publicação.

Fontes fundamentam decisões de software, não regras construtivas. Integração e versões serão verificadas em M0.

## 5. Arquitetura

Uma aplicação com módulos internos, sem pacotes publicados ou workspaces:

```text
src/
  app/                 # navegação, autenticação e lista de projetos
  editor/              # ferramentas, Canvas, estado e worker
  domain/              # modelo, schemas, geometria, paginação e quantitativos
  persistence/         # sessão, Supabase, rascunhos locais e sincronização
supabase/
  migrations/          # tabelas, permissões, validação e funções SQL
tests/
  fixtures/            # entradas e resultados de referência
  e2e/                 # fluxos completos
```

`domain` não depende de React, Konva, Zustand ou Supabase. Renderização e persistência consomem o documento de domínio. Um módulo em `persistence` concentra criar, listar, carregar, salvar e excluir projetos; componentes não fazem consultas dispersas ao Supabase. Estados de carregamento/erro e a fila de autosave pertencem a esse módulo e aos hooks que o expõem, sem cache remoto adicional.

Fluxo: **interface → comandos do editor → documento → worker → peças/diagnósticos/quantitativos**. Em paralelo, **documento → rascunho local → Supabase**. Login ou latência de rede não participam do cálculo geométrico.

Salvar apenas documento paramétrico. Não persistir objetos Konva ou tijolos como fonte principal. Peças/encontros/quantitativos são derivados. Viewport, ferramenta e seleção ficam em estado separado.

Worker recebe `{ requestId, documentRevision, engineVersion, document }`; retorna mesmos identificadores, peças, diagnósticos, quantitativos e duração. Descartar respostas antigas. Indicar cálculo em andamento e bloquear exportações de resultados desatualizados; JSON do modelo permanece disponível.

Primeiro motor recalcula projeto inteiro após comando confirmado. Arraste calcula apenas prévia/snap. Recálculo incremental só se benchmark exigir.

## 6. Modelo de domínio

### Unidades e coordenadas

- Milímetros inteiros no modelo; X para direita, Y para cima na planta e Z para altura.
- Interface aceita m/cm/mm, vírgula ou ponto decimal; valores sem representação inteira em mm são recusados.
- Inverter Y somente na transformação para Canvas.
- Faces de largura ímpar podem estar em 0,5 mm; não arredondar. Interseções calculadas podem ser fracionárias.
- Tolerância de 0,1 mm em resultados calculados; não corrige incompatibilidade dimensional.
- Parede é segmento de eixo orientado start/end. Comprimento informado é entre nós de eixo; comprimento ocupado por peças depende dos encontros.
- Origem modular global (0,0). Posição de vão medida ao longo do eixo desde start.

### Tijolo

Presets de base: 250 × 125 e 300 × 150 mm. São atalhos dimensionais sem homologação de fabricante. Altura exige confirmação; 70 mm é exemplo demonstrativo.

MVP aceita comprimento igual ao dobro da largura, dimensões positivas, junta horizontal entre 0 e 10 mm e junta vertical zero. Meio tijolo tem metade do comprimento, mesma largura/altura. Não modelar furos.

`courseHeightMm = heightMm + horizontalJointMm`. Altura da parede inclui módulo superior com sua junta; mostrar convenção na configuração. Perfil versionado: `orthogonal-half-bond-v1`.

### Documento persistido

```ts
type Point = { x: number; y: number };
type DimensionAnchor =
  | { kind: 'wallEndpoint'; wallId: string; endpoint: 'start' | 'end' }
  | { kind: 'openingEdge'; openingId: string; edge: 'start' | 'end' };
type ProjectDocument = {
  schemaVersion: 1;
  ruleSetId: 'orthogonal-half-bond-v1';
  units: 'mm'; name: string;
  brickSystem: {
    lengthMm: number; widthMm: number; heightMm: number;
    horizontalJointMm: number; verticalJointMm: 0;
  };
  defaultWallHeightMm: number; wastePercent: number;
  floor: {
    id: string; name: string; elevationMm: 0;
    walls: Array<{
      id: string; label: string; start: Point; end: Point;
      heightMm: number; phase: 0 | 1;
    }>;
    openings: Array<{
      id: string; label: string; wallId: string;
      kind: 'door' | 'window'; offsetMm: number;
      widthMm: number; heightMm: number; sillMm: number;
      hinge?: 'start' | 'end'; swingSide?: 'left' | 'right';
    }>;
    dimensions: Array<{
      id: string; axis: 'x' | 'y'; from: DimensionAnchor;
      to: DimensionAnchor; offsetMm: number;
    }>;
  };
};
```

Zod valida intervalos, inteiros, UUIDs únicos, referências e limites. Rótulos P01/D01/J01 não são chaves. Espessura deriva de widthMm. Múltiplos pavimentos exigirão migração explícita.

schemaVersion, revisão remota e engineVersion são distintos. Schema futuro desconhecido é recusado sem alterar projeto aberto.

### Saídas

Peça: ID determinístico, tipo full/half, fiada a partir de 1, X/Y/Z, dimensões, rotação 0°/90°, ownerWallId e relatedWallIds em encontros. Peça compartilhada tem proprietário único por regra estável de ID; contar uma vez.

Diagnóstico: código, severidade info/warning/error, mensagem pt-BR, IDs afetados, fiadas, região e sugestões estruturadas opcionais. Aplicar sugestão é ação explícita/desfazível.

## 7. Regras de paginação

### Sequência

1. Validar schema/limites, segmentos nulos, diagonais e sobreposição colinear.
2. Construir grafo por interseções/coincidências reais; proximidade visual não conecta paredes.
3. Classificar continuidade/L/T/cruzamento; segmentos virtuais preservam IDs originais.
4. Resolver encontros conforme catálogo alternado.
5. Gerar fiadas completas, subtrair vãos e preencher trechos compatíveis.
6. Verificar colisões/cobertura/juntas e agregar peças válidas.

Geometria inválida não recebe preenchimento arbitrário. Problemas locais deixam regiões excluídas e resultados parciais visíveis.

### Trechos retos

Semimódulo = comprimento do tijolo/2. Fase 0 inicia fiada ímpar com inteiro; fase 1 com meio, quando compatível com encontros. Fiada seguinte desloca padrão por semimódulo. Meios terminais entram na contagem.

Fixture: parede isolada de 3.125 mm; tijolo 250 × 125 × 70; juntas zero; altura 140 mm:

- Fiada 1: 12 inteiros + 1 meio.
- Fiada 2: 1 meio + 12 inteiros.
- Total: 24 inteiros e 2 meios; cobertura 3.125 mm nas duas.

3.110 mm gera NON_MODULAR_LENGTH, sem arredondamento automático. Sugerir módulos inferior/superior. Sobra não recebe peça fictícia.

### Encontros: validação obrigatória

Resolver conjunto conectado, sem somar paredes independentes. Continuidade equivale a trecho único mantendo vínculos originais. Em L/T/cruzamento, alternar direção que atravessa o encontro conforme padrões explícitos para ambas as paridades.

**M1 entrega catálogo versionado de fixtures**, com duas fiadas, coordenadas, regiões compartilhadas, propriedade e contagens esperadas, revisado por profissional experiente no sistema construtivo. Não inventar regra executiva a partir de ilustrações genéricas.

Encontro sem solução gera UNSUPPORTED_JUNCTION; região destacada fora da contagem. Liberação do suporte completo depende da aprovação desse catálogo. Essa revisão é entrega do projeto; este PRD não homologa a regra construtiva.

### Altura e vãos

Fiadas completas = floor(wallHeightMm/courseHeightMm). Resto gera NON_MODULAR_HEIGHT; faixa superior sem peças e quantitativo parcial.

Vão é espaço livre de alvenaria, não dimensão comercial de esquadria. Não adicionar folgas implicitamente.

- Horizontal: [offsetMm, offsetMm + widthMm).
- Vertical: [sillMm, sillMm + heightMm); porta tem peitoril zero.
- Limites horizontais coincidem com semimódulos do trecho; verticais com fronteiras de fiada.
- Remover somente peças totalmente contidas no vão. Interseção parcial gera OPENING_PARTIAL_PIECE; peça inválida fora da contagem, região marcada.
- Vão não ultrapassa parede, sobrepõe outro ou intercepta região de encontro; diagnosticar sem corrigir silenciosamente.
- Reduzir parede mantém offsets e aponta vãos fora. Inverter orientação preserva posição física: novoOffset = comprimento − offset − largura; transformar também sentido de abertura.
- Verga/contraverga não inferida; paginação acima do vão não implica dimensionamento de apoio.

### Juntas e invariantes

Detectar juntas internas coincidentes em fiadas adjacentes dentro da tolerância, onde há alvenaria em ambas. Excluir bordas externas e de vãos. Emitir ALIGNED_JOINT com posição/fiadas; alerta geométrico sem certificação estrutural.

Em regiões resolvidas, nenhuma peça tem interseção de área positiva com outra. União das peças cobre exatamente região esperada, descontados vãos e regiões não resolvidas. Testar essas invariantes.

## 8. Requisitos funcionais e aceite

| ID | Requisito | Critério verificável |
|---|---|---|
| RF01 | Projetos | Criar/listar/renomear/excluir próprios; confirmação de exclusão; isolamento por usuário |
| RF02 | Configuração | Alteração de tijolo/juntas/altura recalcula após confirmação e pode ser desfeita |
| RF03 | Paredes | Cliques/distância numérica; restrição X/Y; edição de extremos/altura; segmento nulo impedido |
| RF04 | Edição | Seleção clique/retângulo, mover, copiar/colar, duplicar/excluir; duplicação inclui vãos e novos IDs |
| RF05 | Grid/snap | Grid independente do passo; prioridade extremo/interseção, face, meio, alinhamento, grid; raio 8 px; desempate por distância/ID |
| RF06 | Assistência | Medida e opções inferior/superior; Enter aceita destacada; incompatível pode ser mantida |
| RF07 | Vãos | Inserir/arrastar/editar; excluir parede remove vãos em operação desfazível |
| RF08 | Fiadas | Índices válidos, distinção inteiro/meio e problemas; vistas na mesma revisão |
| RF09 | Elevação | Comprimento local × Z, vãos, peças, índices e identificação de peças compartilhadas |
| RF10 | Cotas | Âncoras em extremos/bordas; atualização automática; perder âncora remove cota na mesma operação |
| RF11 | Histórico | Mínimo 100 operações/sessão; novo comando após undo limpa redo; autosave fora do histórico |
| RF12 | Diagnóstico | Filtro severidade/parede; clique localiza; sugestão aplicada desfazível |
| RF13 | Quantitativo | Projeto/parede sem duplicação; parcial identifica regiões excluídas |
| RF14 | Persistência | Reabertura preserva modelo; falha mantém rascunho; conflito não sobrescreve |
| RF15 | Exportação | JSON preserva semântica/IDs; CSV confere com painel; SVG inclui escala/legenda/status |
| RF16 | Importação | Validar tamanho/schema/referências; novo projeto; falha preserva aberto |

Atalhos: V seleção, W parede, D porta, J janela, Delete excluir, Ctrl/Cmd+Z desfazer, Ctrl/Cmd+Shift+Z ou Ctrl+Y refazer, Ctrl/Cmd+C/V copiar/colar, Esc cancelar. Não interceptar ferramentas em campos de texto. Pan: botão do meio ou Espaço+arraste; zoom preserva ponto sob cursor. Oferecer botões equivalentes.

## 9. Quantitativos e exportação

Por tipo: necessario = peças válidas; perda = ceil(necessario × percentual/100); comprar = necessario + perda. Percentual de 0 a 30. Aplicar perdas no total do projeto por tipo; visão por parede apenas líquida, evitando arredondamento cumulativo.

Inteiros/meios são produtos separados; não converter dois meios em inteiro ou corte em meio comercial.

Relatório contém nome, data, revisão, motor, configuração, quantidades/perdas/status. Com regiões não resolvidas, exportar explicitamente “PARCIAL — não utilizar como lista final de compra” e resumo dos problemas. Zero peças com erro não equivale a projeto vazio válido.

CSV UTF-8 com BOM, ponto e vírgula, tipo, quantidade líquida, perda e compra; escapar textos interpretáveis como fórmula. SVG em mm, viewBox, vista/fiada e legenda; não promete prancha normativa. JSON contém documento/metadados, nunca tokens ou preferências privadas.

## 10. Persistência com Supabase

### Salvamento

- IndexedDB até 500 ms após comando confirmado.
- Remoto após 2 s sem edição e no máximo a cada 10 s de edição contínua; uma requisição em voo/projeto.
- Estados: salvo neste dispositivo, sincronizando, salvo na nuvem, sem conexão, conflito e erro. Sucesso só após confirmação da camada.
- Retry 2/5/15/30 s, limitado a 30 s; manter rascunho até confirmação.
- A operação de salvar envia revisão-base/idempotencyKey por RPC; mesma chave/conteúdo retorna resultado anterior; conteúdo diferente com mesma chave gera conflito.
- Revisão divergente retorna REVISION_CONFLICT e pausa. Oferecer remoto ou rascunho como novo projeto; preservar cópia recuperável antes de substituir local. Sem merge automático.
- Reabrir com rascunho mais recente oferece recuperação mostrando datas/origem.
- Logout limpa tokens/memória; rascunhos particionados por usuário só aparecem após autenticar o mesmo usuário; oferecer removê-los.
- Login/carga inicial exigem internet; aba carregada pode editar offline. PWA/reabertura totalmente offline fora do MVP.

### Banco

`projects`: id UUID, owner_id, name, schema_version, current_revision, document JSONB, created_at, updated_at, deleted_at.

`project_revisions`: project_id, revision, document JSONB, created_at, engine_version, idempotency_key e hash de conteúdo. Unicidade por projeto/revisão e projeto/chave. Guardar últimas 20 revisões e documento atual; interface de histórico remoto futura.

Salvar documento, metadados, contador e revisão na mesma transação condicionada à revisão-base. Conferir a chave de idempotência antes da revisão-base, para reconhecer retry de salvamento já concluído. Se a revisão antiga já tiver sido descartada pela retenção, retornar conflito sem reaplicar ou sobrescrever a versão atual. Lista retorna só metadados, cursor e 20 itens/página.

### Interface interna de persistência

O front-end usará um único módulo com os contratos abaixo; eles são funções TypeScript internas, não endpoints de uma API própria.

| Operação | Entrada/saída | Implementação |
|---|---|---|
| listProjects | Cursor opcional → metadados e próximo cursor | Consulta Supabase a projects, sujeita a RLS |
| loadProject | ID → documento, revisão e updatedAt | Consulta Supabase e validação Zod da resposta |
| createProject | projectId gerado no cliente e document → ID/revisão 1 | RPC create_project; retry com mesmo ID/documento não duplica projeto |
| saveProject | projectId, baseRevision, idempotencyKey, document e engineVersion → nova revisão | RPC save_project, transacional |
| deleteProject | ID → confirmação | RPC delete_project, exclusão lógica idempotente |

Renomear usa saveProject alterando document.name. Importação valida e usa createProject com novo ID. O proprietário é determinado por auth.uid(), não por parâmetro enviado pelo navegador. O ID fornecido na criação não permite acessar, reutilizar ou alterar projeto de outro usuário.

O módulo normaliza falhas em `{ code, message, details? }`: UNAUTHENTICATED, NOT_FOUND, REVISION_CONFLICT, IDEMPOTENCY_CONFLICT, DOCUMENT_TOO_LARGE, INVALID_DOCUMENT, RATE_LIMITED, NETWORK_ERROR e SERVICE_ERROR. Ausência e falta de acesso são indistinguíveis para o cliente. Códigos internos não dependem do status HTTP específico retornado pelo Supabase. Não criar rotas /api/projects, /health ou /ready.

### Permissões e validação no banco

- Habilitar RLS nas duas tabelas. Leitura exige usuário autenticado e proprietário do projeto; revisões herdam a verificação de propriedade do projeto. Projetos excluídos não aparecem em consultas normais.
- Permitir leitura autorizada pela Data API; revogar escrita direta nas tabelas para anon/authenticated. Mutações passam pelas três RPCs para garantir revisão, validação e histórico.
- RPCs de mutação usam SECURITY DEFINER com search_path vazio, nomes de objetos qualificados, conferência explícita de auth.uid() e de propriedade. Revogar execução de PUBLIC/anon e conceder apenas a authenticated. O privilégio da função não substitui essas verificações nem as políticas de leitura.
- As funções validam tamanho de 5 MiB do JSON serializado em UTF-8, versão/formato, tipos, intervalos, referências e limites persistidos antes de gravar. Zod oferece feedback no cliente; constraints e validação SQL protegem chamadas diretas. Testar o mesmo conjunto de documentos aceitos/rejeitados nas duas camadas.
- UUID, owner_id, contadores e datas de controle não podem ser modificados livremente pelo cliente. Quantitativos derivados não são persistidos como dados autoritativos.
- Incompatibilidades geométricas editáveis, como comprimento não modular, continuam salváveis; não confundir diagnóstico de paginação com documento estruturalmente inválido.

## 11. Requisitos não funcionais

### Desempenho

Referência: notebook 4 núcleos, 8 GB RAM, GPU integrada, 1920 × 1080, Chrome/Edge estável. Registrar equipamento/versões/fixture; medir build de produção, 30 execuções após aquecimento.

| Operação | Meta |
|---|---|
| Pan/zoom | ≥ 50 FPS em 95% dos frames |
| Snap | p95 < 16 ms |
| Feedback de comando | p95 < 50 ms sem aguardar motor |
| Motor: 50 paredes/30 vãos/40 fiadas | p95 ≤ 1 s |
| Motor: 50.000 peças | ≤ 3 s com interface interativa |
| Abrir documento de referência | ≤ 3 s após resposta do Supabase |

Recortar pela viewport e renderizar apenas fiada selecionada na planta. Evitar árvore React com todas as peças de todas as fiadas. Benchmark M1 confirma Konva e orienta otimização.

Suportar duas versões estáveis mais recentes Chrome/Edge desktop; mínimo 1280 × 720. Worker/IndexedDB necessários. Falha de quota local não simula salvamento. Safari/mobile futuros.

### Segurança/operação

- HTTPS na aplicação estática e no Supabase. Autorização depende de RLS e das verificações das RPCs, não de ocultar a chave publicável ou restringir a origem do navegador.
- Aplicar as permissões e validações da seção 10; testar acesso pela Data API/RPC diretamente, além da interface. Nenhuma credencial administrativa será publicada.
- Usar os limites configuráveis do Supabase Auth e os limites do serviço de dados contratado. Tratar respostas de excesso com espera/retry; não prometer os limites por IP/usuário de uma API própria que não existe. Autosave mantém uma requisição em voo por projeto.
- Usar logs do Supabase e da publicação, além de códigos/duração de falhas da aplicação, sem tokens, senhas ou documentos integrais. Verificar falhas de login, salvamento e publicação em homologação.
- Sessão expirada preserva rascunho e pede login para sincronizar.
- Exigir backup gerenciado diário com retenção mínima de 7 dias no plano Supabase escolhido para produção; verificar disponibilidade/custo em M0 e provar restauração antes de liberar dados reais. Metas RPO 24 h e RTO 8 h devem ser verificadas nesse ambiente. Exportação JSON pelo usuário é complementar.
- Exclusão lógica imediata da lista; purga após 30 dias por tarefa agendada no banco, com configuração versionada. Backups expiram pela retenção; documentar privacidade.
- Homologação e produção usam projetos Supabase separados. Migrações SQL passam por homologação antes de produção. Manter rollback do build estático e migrações compatíveis com documentos existentes.

### Acessibilidade

Labels, foco visível, diálogos e controles DOM por teclado. Lista de paredes/vãos com edição numérica alternativa ao Canvas. Cor acompanhada por texto/padrão. Erros explicam elemento, motivo e ação. Acessibilidade integral espacial exige validação específica.

## 12. Testes obrigatórios

| Grupo | Casos |
|---|---|
| Geometria | Faces 0,5 mm, reversão, interseções, colinearidade, nulos e limites |
| Trechos | 3.125/duas fiadas = 24 inteiros + 2 meios; 3.110 com resto; 2.800/70 = 40; 2.805/70 resto 5 |
| Encontros | L/T/cruzamento nas duas paridades, reversão e ordem de entrada alterada; resultado normalizado idêntico |
| Vãos | Porta 1.000 × 2.100; janela 1.000 × 980, peitoril 1.120, fiada 70; limites, cortes parciais e sobreposição |
| Invariantes | Sem colisão; cobertura resolvida; IDs determinísticos; soma única de peças |
| Histórico | Mover com vãos, excluir com cotas, trocar tijolo, undo/redo, cancelar arraste |
| Persistência | Rede falha, resposta perdida/retry, reload antes de autosave, quota e conflito entre abas |
| Segurança | A não lê/altera/exclui B pela Data API/RPC, incluindo revisões; anon sem acesso; escrita direta negada; token inválido/expirado; schema/payload inválidos |
| Exportação | JSON round-trip, CSV igual ao painel, parcialidade e unidade/legenda SVG |
| E2E | Login → criar → desenhar → vãos → revisar → salvar → reabrir em outro contexto de navegador → exportar |
| Publicação | Build estático; abertura direta de rota do editor; confirmação/recuperação de conta; bundle sem segredos |

Vitest executa fixtures com resultados esperados independentes do algoritmo e conjuntos determinísticos de casos para verificar invariantes. Snapshots complementam verificações numéricas. Playwright cobre navegação, conta, edição e recuperação; testes de integração verificam permissões e RPCs em homologação. Não incluir biblioteca adicional de geração de testes no MVP. Revisão técnica construtiva é distinta dos testes de software.

## 13. Marcos e definição de pronto

Marcos representam dependências, não estimativas de semanas.

| Marco | Entregáveis | Aceite |
|---|---|---|
| M0 Base | Aplicação Vite única, npm, CSS Modules, schemas, CI, README, Supabase de homologação e migrações iniciais | npm install/npm run dev sem servidor próprio ou Docker; lint/typecheck/testes/build; login e criação/leitura de projeto pela nuvem comprovados |
| M1 Núcleo | Canvas mínimo, geometria, worker, trechos/encontros/vãos, benchmark | Fixtures/invariantes, catálogo revisado e desempenho demonstrado |
| M2 Editor | Ferramentas/snaps/propriedades/comandos/cotas/histórico/rascunho | RF02–RF07 e RF10–RF12 demonstrados |
| M3 Inspeção | Fiadas/elevação/contagens/perdas/exportações | RF08/09/13/15/16 completos e parciais |
| M4 Persistência | Lista, RPCs completas, autosave, recuperação, revisão e conflitos | RF01/14; testes diretos de RLS/RPC; reabertura em outro navegador e recuperação após falha |
| M5 Liberação | Cloudflare Pages, Supabase de produção, backup, documentação e teste de usuários | Build estático publicado e todos os critérios abaixo |

Conta e armazenamento remoto básico começam em M0; o fluxo inicial já usa nuvem. M1 precede acabamento das telas de conta/lista. Rascunho local começa no protótipo/editor; confiabilidade completa da sincronização é concluída em M4.

MVP pronto quando:

- Todos os RF/testes passam; CI verde.
- Instalação e desenvolvimento com npm, sem servidor próprio ou Docker; build servido como aplicação estática no Cloudflare Pages.
- Login, criação e reabertura do projeto em outro navegador pela nuvem comprovados; RLS/RPCs impedem acesso entre usuários mesmo sem passar pela interface.
- Catálogo de encontros versionado/revisado, sem padrões anunciados sem suporte.
- Projeto residencial de referência salva/reabre sem mudança semântica.
- Contagens conferidas por fixtures/revisão independente; parcialidade visível em todas as saídas.
- Worker descarta resultados antigos; conflitos preservam rascunho.
- Falha de conexão preserva alterações locais e duas abas detectam revisão divergente, sem sobrescrita silenciosa.
- Benchmark/exportações/restauração comprovados.
- Três usuários concluem fluxo central; bloqueios corrigidos.
- README cobre setup, variáveis, migrações, testes, publicação, recuperação e limitações.

## 14. Métricas e evolução

Medir conclusão do fluxo, tempo até primeira planta, falhas de salvamento, conflitos recuperados, divergências de contagem e latência do motor.

Indicador geométrico = área coberta por peças válidas / área esperada de alvenaria descontados vãos × 100. Denominador zero: “Sem alvenaria”. Mostrar alertas de juntas separadamente. Não representa segurança estrutural. A antiga métrica “paredes construíveis sem cortes” exige validação construtiva adicional e fica fora do MVP. Usar fixtures/sessões consentidas; não coletar documentos para telemetria.

| Fase | Recursos | Dependência |
|---|---|---|
| 2 | 3D, pavimentos, cômodos e imagem calibrada | Núcleo estável, migrações, benchmarks |
| 3 | Canaletas/grautes/vergas/fabricantes | Furos e regras técnicas validadas |
| 4 | Instalações/cortes/pranchas/PDF executivo | Modelo ampliado e revisão documental |
| 5 | Compartilhamento/colaboração/orçamento/IFC/DXF | Membros, versionamento e intercâmbio |

### Evolução da stack por necessidade

| Recurso | Evolução prevista |
|---|---|
| 3D e inspeção de tijolos | Three.js + React Three Fiber sob demanda, derivados do documento e das peças do motor |
| Pavimentos, telhados e instalações | Novas entidades/regras em domain e migrações do documento |
| Pranchas e PDF | Exportador específico que consome o modelo existente |
| Imagens de referência e arquivos | Supabase Storage quando o recurso for implementado |
| Renderização por IA e pagamentos | Funções de servidor para credenciais, integrações e processamento confiável |
| Compartilhamento | Políticas de acesso e membros com escopo explícito |
| Colaboração simultânea | Projeto próprio de sincronização/conflitos; eventos em tempo real isoladamente não resolvem edição concorrente |

Adicionar componentes somente ao implementar o recurso que os exige. A separação entre domínio, renderização e persistência permite evolução sem substituir a base do editor. A referência a recursos avançados equivalentes aos do TijoCad orienta o roadmap, sem ampliar os critérios do MVP.

## 15. Decisões e pendências controladas

**Definido:** aplicação única React/TypeScript/Vite; Supabase direto; Cloudflare Pages; npm; CSS Modules; motor independente em worker; nuvem desde o início e 3D após validar 2D. Um pavimento; ortogonalidade; inteiros/meios; sem cortes automáticos; JSON/CSV/SVG; persistência local/remota com revisão otimista.

**Resolver em M0:** versões exatas compatíveis, homologação Supabase, SMTP/URLs de autenticação, permissões/RPCs e disponibilidade do backup gerenciado para produção. Credenciais operacionais são configuradas fora do bundle. Não impede iniciar motor.

**Resolver em M1:** catálogo aprovado de encontros e desempenho Canvas. Até lá, protótipo experimental; regiões sem regra diagnosticadas. Não afirmar paginação executiva pronta.

**Premissas confirmadas:** manter React/TypeScript, nuvem desde a primeira versão e 3D depois de validar o 2D. Contas individuais e projetos privados; sem cobrança/colaboração no MVP. Simplificação altera infraestrutura e dependências, preservando o escopo funcional do editor e a validação técnica da modulação.

Visão de longo prazo: BIM especializado em tijolos ecológicos. Recursos futuros terão especificações próprias, sem ampliar MVP. Mudanças arquiteturais atualizam PRD e geram ADR.
