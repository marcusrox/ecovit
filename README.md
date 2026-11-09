# Ecovit

O Ecovit oferece Planta e Fiada, até quatro pavimentos, lajes com aberturas, comparação entre pavimentos, medidas, imagens de referência, mobiliários e terreno. O editor trabalha com paredes ortogonais e malha de meio tijolo. O terreno tem seis aparências e rosa dos ventos opcional. Os quantitativos usam a composição nominal. A aplicação pública está em [ecovit.idevs.com.br](https://ecovit.idevs.com.br/).

A conta por código de e-mail dá acesso aos projetos privados. O salvamento remoto exige conexão. O arquivo .ecovit é portátil e suporta importação manual, conforme a [matriz de formatos](docs/arquitetura/Persistencia-e-Compatibilidade.md#formato-e-leitores-vigentes).

## Configurar e abrir

Requer Node 24.x, npm e PostgreSQL 18 em execução, local ou acessível por conexão privada. Para testar o envio real, precisa também da Resend com domínio verificado, chave de envio e remetente autorizados. Não enviar chaves/senhas por mensagem nem usar variáveis VITE_ para segredos.

No PowerShell, dentro de C:\Projects\ecovit:

```powershell
node --version
npm ci
Copy-Item .env.example .env
```

Não sobrescrever um .env já configurado. Edite esse arquivo privado com DATABASE_URL da role de execução, APP_ORIGIN=http://127.0.0.1:5173, API_PORT=3001, DATA_DIR exclusivo, RESEND_API_KEY e MAIL_FROM. Gere SESSION_SECRET localmente:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Copie a saída para SESSION_SECRET, sem compartilhá-la. Crie banco/roles e aplique a migração com a role proprietária, usando temporariamente DATABASE_MIGRATION_URL. Os comandos SQL e privilégios estão em [Configuração e banco](docs/arquitetura/Persistencia-e-Compatibilidade.md#configuração-e-banco). Após migrar, conceda os privilégios de execução indicados e remova a credencial de migração do ambiente de uso diário:

```powershell
.\Start-Ecovit.ps1 -Task db:migrate
.\Start-Ecovit.ps1 -Task dev
```

O comando dev inicia frontend em **http://127.0.0.1:5173/** e API em loopback, com configuração .env. Mantenha o terminal aberto; Ctrl+C encerra a instância iniciada nesse terminal. Não iniciar outra instância se essa porta já estiver em uso. Chrome e Edge desktop são os navegadores previstos. Entre com seu e-mail e o código recebido. A API não é opcional: abrir só o frontend não permite entrar ou salvar. Consulte /api/health pelo mesmo endereço para verificar a API; configuração incompleta é informada no terminal.

Para abrir a lista diretamente no desenvolvimento local, configure `DEV_LOGIN_EMAIL=seu-email@example.com` no `.env` privado, mantenha `APP_ORIGIN=http://127.0.0.1:5173` e reinicie o comando `dev`. O Ecovit entra na conta correspondente do banco configurado ou cria a conta no primeiro acesso. Para voltar à entrada por código, remova a chave e reinicie. O atalho é exclusivo do desenvolvimento em loopback e deve ser usado em uma instância e um banco de uso local.

Para conferir limpeza durante teste local, execute .\Start-Ecovit.ps1 -Task data:cleanup em outro terminal com o mesmo .env. Sem agendamento, a aplicação revoga acesso normalmente, mas a eliminação física depende da execução desse comando; no servidor deve rodar a cada 15 minutos. Procedimento completo de proxy/aaPanel, limites e monitoramento em [Operação e implantação](docs/arquitetura/Persistencia-e-Compatibilidade.md#operação-e-implantação).

### Avaliação descartável sem envio de e-mail

Para explorar a interface antes de configurar a Resend, use exclusivamente um banco PostgreSQL separado chamado ecovit_test. Crie esse banco com um usuário proprietário exclusivo e configure .env.test privado (sem alterar .env):

```dotenv
M12_TEST_DATABASE_URL=postgresql://USUARIO:SENHA@127.0.0.1:5432/ecovit_test
```

Inicie .\Start-Ecovit.ps1 -Task dev:test e abra **http://127.0.0.1:5174/**. Ao solicitar código, a mensagem é capturada em .tools/m12/browser-mail; consulte o arquivo mais recente no seu terminal:

```powershell
Get-ChildItem .tools/m12/browser-mail/*.json |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1 |
  Get-Content
```

Use o campo code dessa mensagem. Nenhum e-mail é enviado nesse modo. **O servidor de testes reinicializa as contas do schema m12_browser a cada início; use apenas projetos descartáveis ou cópias exportadas.** Não use esse banco durante a suíte automatizada nem exponha esse servidor à internet. A captura testa o fluxo do aplicativo e não comprova envio/entrega pela Resend. O teste de aceite com dados que você deseja conservar deve usar o modo dev e o banco normal acima.

## Verificações

- npm run typecheck, npm run lint, npm test e npm run build verificam tipos, estilo, domínio/estado e builds.
- npm run test:api exige M12_TEST_DATABASE_URL para PostgreSQL isolado chamado ecovit_test; cobre HTTP real, segurança e persistência.
- npm run test:e2e usa o mesmo banco de testes, schema próprio, captura de e-mail e API/Vite na porta **5174**; inicia servidor novo, sem reaproveitar a instância do solicitante.
- Para verificação interativa isolada, configure .env.test com M12_TEST_DATABASE_URL e execute .\Start-Ecovit.ps1 -Task dev:test. Esse servidor reinicializa as contas de teste; não usar dados pessoais. Códigos ficam apenas em .tools/m12/browser-mail nesse ambiente, sem endpoint especial de login.

Em produção, o PM2 inicia `app.js` na raiz do repositório com `NODE_ENV=production` e proxy HTTPS da mesma origem. Servir somente `dist` e manter `dist-server`, `.env` e imagens fora da raiz pública. Agendar a limpeza a cada 15 minutos. Para publicar atualizações, siga o [procedimento de deploy no aaPanel](docs/arquitetura/Persistencia-e-Compatibilidade.md#github-actions-e-webhook-do-aapanel). A validação em produção e a homologação funcional são registradas no [marco M12](docs/marcos/M12-Contas-e-Persistencia-Remota.md#aceite-e-verificações). Backup do servidor continua sob administração do responsável.

## Uso

1. Entre pelo código enviado ao seu e-mail, crie um projeto e escolha o tamanho-base.
2. Na ferramenta Parede, arraste para criar uma parede. Continuidade colinear compatível prolonga/une as paredes, inclusive ao preencher um intervalo entre duas existentes. A prévia mostra o comprimento total; “Inverter lado” muda o lado da espessura antes do próximo desenho. O quadrado cinza marca o módulo que contém o centro da cruz, também nas ferramentas de vãos. Ao arrastar em qualquer direção, esse módulo integra o elemento criado; para prolongar, selecione o módulo livre contíguo à ponta.
3. Selecione uma parede e arraste as alças A/B, ou altere seu comprimento no painel escolhendo a extremidade. As alças têm prioridade, inclusive com Parede ativa. Para começar outra parede exatamente sobre uma alça, limpe a seleção primeiro usando Selecionar e clicando em área vazia.
4. Em Selecionar, arraste o corpo da parede para mover com seus vãos e ajustes; no destino, continuidade compatível também une as paredes. Alças/vãos mantêm prioridade. Escape ou soltar fora cancela; um desfazer recupera movimento e união.
5. Use roda do mouse para zoom, botão do meio + arraste para navegar (ou Espaço + botão esquerdo + arraste), Escape para cancelar, Delete para excluir e Ctrl+Z / Ctrl+Y (ou Ctrl+Shift+Z) para desfazer/refazer.
6. Alterne para Fiada para navegar, consultar o intervalo de altura e sobrepor uma fiada adjacente. Selecione um conjunto com alternativa disponível, como L ou cruz, na primeira fiada, para visualizar e confirmar outra fase; a prévia destaca os cantos afetados. Diagnósticos podem ser clicados para localizar o problema.
7. Aguarde a indicação “Salvo”, que confirma a intenção no servidor. Baixar .ecovit conserva uma cópia sob seu controle. Importar arquivo cria outro projeto, sem substituir o original.

A engrenagem ao lado de Configurações do projeto abre Preferências do Ecovit. As cinco opções de rótulos (Portas, Janelas, Vãos, Paredes e Medidas) são imediatas e ficam salvas neste navegador para todos os projetos; Paredes controla A/B e o texto de comprimento/altura em Planta. O grupo Imagens dos mobiliários oferece Suavização em qualidade alta, inicialmente ativada; desative para usar a suavização básica. Versões menores da mesma imagem são escolhidas automaticamente conforme o tamanho na tela e mantidas apenas em memória, sem aumentar o `.ecovit`. Essas preferências não entram no arquivo `.ecovit`. O estado da composição aparece no canto inferior esquerdo do canvas; instruções gerais estão em Como usar o editor, na lateral.

O térreo começa na cota 0 cm, com altura de novas paredes em 280 cm. No seletor Pavimento, crie, duplique ou exclua andares; edite nome, cota e altura padrão no painel. Cotas podem ser negativas, são distintas e múltiplas da altura-base. Todas as paredes de um pavimento começam na sua cota, e as fiadas reiniciam em 1. Trocar de andar preserva câmera e última fiada local, limpando seleção e gestos. Para altura-base personalizada incompatível com 280 cm, escolha uma altura modular explicitamente. A altura inicial escolhida fica gravada no projeto e é sugerida para pavimentos novos, mesmo após editar ou remover o térreo. O passo nominal adotado é a altura-base (7 cm resulta em 40 fiadas para 280 cm); não representa junta ou encaixe físico de um fabricante. Furos representam somente eixos. O T usa principal contínua e ramal encostado. A cruz nominal alterna continuidade horizontal/vertical, compondo também contorno e divisórias conectados; a ligação entre paredes não é dimensionada. Combinações sem padrão completo recebem diagnóstico: o conjunto afetado fica sem peças em Fiada, com a Planta preservada.

Pontas livres e contornos abertos são permitidos. Retas conectadas, L, U e ciclos sem ramificações após o tratamento dos encontros usam paginação contínua: inteiros pareiam células consecutivas, cantos seguem a paridade do percurso e meios ficam nas extremidades quando necessários. Não há obrigação de orientar todos os cantos igualmente nem mínimo de quatro módulos para a ponte de um U. Reservas incompatíveis entre encontros próximos, sobreposições e transições de altura sem padrão continuam diagnosticadas; cruz → reta conforme altura é suportada.

O arquivo vigente usa envelope versão 18 e composição `nominal-v10`, com leitura de envelopes 9–18. O download usa JSON compacto; se o resultado calculado ultrapassar o limite de 50 MiB do arquivo, a cópia conserva todos os desenhos, medidas, imagens, configurações e ajustes e reconstrói o resultado ao abrir, com aviso. A composição nesta aba permanece intacta. Snapshots atuais são conferidos por recomputação antes de importar; adulteração é recusada. Abertura remota recompõe o resultado apenas em memória, sem gravação adicional. Outra aba pode editar, e a revisão do servidor impede sobrescrita silenciosa. Configurações são comuns, mas paredes, vãos, medidas e ajustes são independentes por pavimento. Lajes e aberturas são independentes das paredes.

## Tipos de portas e janelas

Selecione uma porta ou janela e escolha Tipo da esquadria nas propriedades. Portas oferecem giro de uma/duas folhas, correr de uma folha/abertura central e basculante de garagem; janelas oferecem giro de uma/duas folhas, correr de duas folhas e basculante. O único botão **Alternar orientação** percorre as posições e volta à primeira. Trocas são imediatas e desfazíveis, sem aplicar dimensões ainda em edição nem recalcular a alvenaria. Novas portas começam em giro simples e novas janelas em correr; as antigas mantêm símbolo genérico até uma escolha explícita. Na Planta e na comparação, folhas/arcos, setas e projeções identificam os tipos; na Fiada permanece apenas o vão. Basculantes são esquemáticos, com movimento vertical: a seta indica a face projetada. Aparência salva no projeto/arquivo e preservada nas cópias..

## Imagem de referência

Em Planta, sem elemento selecionado, use Adicionar imagem em Propriedades do pavimento. Aceita uma PNG/JPEG por pavimento, até 10 MiB e 16 megapixels. Marque dois pontos de um trecho conhecido e informe a distância em cm; Calibrar ajusta a proporção. Ajustar libera posição, ângulo e recalibração; Concluir salva, Cancelar preserva o anterior. Mostrar e Opacidade controlam o fundo sem atrapalhar o desenho. O menu compacto oferece Substituir/Remover. Imagem e ajustes viajam no .ecovit, com histórico e cópias independentes; o arquivo completo mantém limite de 50 MiB. Sem PDF, perspectiva, reconhecimento automático ou exibição em Fiada/referência de outro pavimento.

## Medidas independentes

Em Planta, escolha Medida, clique no ponto inicial, depois no ponto final e use um terceiro clique para posicionar a linha da cota. Entre o segundo e o terceiro clique, o mouse mostra o afastamento perpendicular com linhas auxiliares, para qualquer lado do segmento, sem alterar a distância medida. Funciona também fora da malha e em diagonal. O alvo destacado indica atração a extremidades/vértices e linhas próximas; Alt suspende a atração. A medida permanece independente depois de confirmada. Em Selecionar, arraste o corpo para mover ou uma ponta para ajustar; Delete ou Excluir medida remove, com desfazer/refazer. A opção Medidas nas preferências controla apenas o rótulo. Segmentos pertencem ao pavimento, são salvos no arquivo e não entram na composição/quantitativos; não aparecem em Fiada ou na referência de outro pavimento.

## Lajes

Em Planta, escolha Laje, clique nos vértices e feche pelo primeiro ponto ou por Fechar contorno. Informe espessura positiva e confirme a prévia. Selecione a laje para adicionar aberturas, editar espessura ou redesenhar. Arraste o corpo para mover a laje com seus vazios; selecione uma abertura para movê-la isoladamente. As alças deslocam arestas perpendicularmente na malha; Redesenhar contorno permite acrescentar ou retirar cantos. Contatos, sobreposições ou abertura fora da laje impedem a confirmação integralmente. Escape cancela; Desfazer durante prévia cancela primeiro a prévia. Há até uma laje por pavimento, com topo na cota do andar e espessura para baixo; paredes e composição permanecem independentes.

## Edição de paredes

Desenhe duas paredes compatíveis separadas e preencha o intervalo: a prévia e o resultado devem ser uma parede. Em Selecionar, mova uma parede até a continuidade de outra e confira a união; teste Desfazer/Refazer. Vãos acompanham a parede movida e ficam na posição mundial atingida após unir. Alturas/lados incompatíveis não se unem; sobreposição positiva permanece diagnosticada. Redimensionar pelas alças não dispara união.

Supressões de canaleta herdadas de uma união mostram limites do trecho e são restauradas individualmente; remover uma nova faixa continua abrangendo a parede inteira. Graute manual compartilhado conserva a intenção na parede que fica e cria uma cópia na movida. Escolhas de encontros invalidadas ficam pendentes na Fiada, com ação Descartar escolha de encontro.

## Grautes

Em Configurações → Graute vertical, escolher Encontros, Laterais dos vãos, Pontas livres e Intervalos em paredes longas. Categorias são independentes; novos projetos recebem quatro habilitadas e distância 100 cm. Aplicar/Cancelar/Restaurar preservam ajustes manuais e vãos existentes.

Na Fiada, ativar Graute. Passe sobre um furo: + adiciona; − remove um eixo preenchido escuro. Clique confirma inclusão/remoção em todos os seus intervalos de alvenaria, respeitando os vazios das aberturas. O seletor de furos oferece a mesma ação por teclado. Selecionar ou Escape encerra a ferramenta; navegação e referência não editam. Uma exclusão não gera substituto automático. Ajustes sem alvo ficam preservados com diagnóstico e ação Descartar ajuste de graute.

## Canaletas

Em Configurações, grupo Canaletas, adicionar/remover níveis e consultar topo/fiada. Aplicar confirma uma operação; Cancelar preserva o projeto; Restaurar padrões recupera 112/224 cm sem apagar supressões. Novos projetos recebem esses níveis; sua referência é local a cada pavimento.

Na Fiada, clicar numa canaleta ou usar Selecionar faixa. A prévia verde mostra todos os trechos da parede naquela fiada. Remover faixa de canaleta devolve tijolos comuns; Restaurar faixa suprimida recupera a composição automática. Desfazer/refazer, reabrir e transportar por `.ecovit` preservam os ajustes. Canais são esquemáticos.

## Vãos

Em Planta, escolha Porta, Janela ou Vão e arraste sobre uma parede. Selecionar permite mover o corpo, redimensionar pelas duas alças ou editar posição/largura/base/altura e usar Aplicar vão. Medidas incompatíveis oferecem alternativas explícitas; Cancelar edição preserva o documento. Delete ou Excluir vão remove a abertura e pode ser desfeito. A seleção de empilhados identifica tipo/base/topo; há também um seletor acessível por teclado. Configurações expõe apenas padrões de vãos, com Aplicar/Cancelar/Restaurar; alterações não modificam aberturas existentes.

Na Fiada, abertura aparece somente na altura atingida; clicar fora da ferramenta Graute oferece Editar na Planta. Diagnósticos no rodapé permite localizar, ver fiada e editar o elemento. Encurtar parede mantém a posição do vão, sinalizando os que não couberem. Uma fiada de alvenaria entre empilhados é exigida e pode compartilhar as canaletas dos dois vãos. Grautes respeitam os intervalos de alvenaria restantes.

## Comparação de pavimentos

Em Planta, abra Propriedades do pavimento sem elemento selecionado e escolha um vizinho em **Referência de pavimento**. A sobreposição serve de guia visual e Enquadrar considera as duas plantas. Cada pavimento guarda sua escolha durante a sessão. Entrar em Fiada limpa a referência do pavimento ativo, e reabrir o projeto inicia sem referências.

## Mobiliários

Em Planta, abra **Mobiliários**, escolha um item do catálogo ou carregue uma imagem PNG/JPEG e clique para posicionar. Arraste para mover, use os cantos para redimensionar proporcionalmente e as duas alças quadradas para ajustar largura ou profundidade. Use o controle externo para girar e as propriedades para espelhar a imagem. As imagens personalizadas acompanham o arquivo .ecovit.

## Quantitativos e cópias de projeto

No projeto aberto, use **Quantitativos** para consultar peças por tipo, pavimento e fiada e informar perdas opcionais. O percentual vale para a sessão e não é salvo no arquivo. Voltar ao desenho conserva seu contexto confirmado.

Na lista inicial, **Duplicar** cria outro projeto a partir do último estado salvo, com nome próprio e edições independentes.

## Documentação

- [Índice de requisitos e aceites](docs/Ecovit-Plano-Implementacao.md): identificadores, situação de aceite e pendências.
- [PRD](docs/Ecovit-PRD.md) e [Arquitetura](docs/Ecovit-Arquitetura-Tecnica.md): requisitos e decisões.
- [Caderno técnico](docs/Ecovit-Caderno-Tecnico.md): fontes, regras geométricas, exemplos e lacunas.
- [AGENTS.md](AGENTS.md): orientações para trabalhar no repositório.

Dependências e suas versões estão registradas em `package-lock.json`. Os avisos e licenças dos pacotes são preservados na instalação npm. React, react-dom, react-konva, Konva, Zustand, Zod e Vite usam licença MIT; Dexie (somente fixture histórica de teste) usa Apache-2.0. Não há fontes, bibliotecas ou APIs carregadas de CDN durante o uso.

Ícones de interface usam Lucide React 1.57.0 através de `src/ui/Icon.tsx`, com variantes comuns e imports protegidos pelo lint. Padrão na [Interface e iconografia](docs/arquitetura/Interface-e-Iconografia.md#iconografia). A licença integral do Lucide (ISC e avisos MIT dos ícones derivados) é distribuída em [public/third-party/lucide-react-LICENSE.txt](public/third-party/lucide-react-LICENSE.txt), copiada também para `dist/third-party/` pelo build. Logotipo e desenhos técnicos do canvas preservam suas representações próprias.
