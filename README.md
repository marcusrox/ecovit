# Ecovit

Editor local de plantas com paredes ortogonais, malha de meio tijolo e composição nominal de fiadas. Aplicativo 0.7.0, arquivo versão 7 e composição nominal-v8.

| Marco | Funcionalidade | Estado |
|---|---|---|
| M1 | Projetos, paredes, histórico e persistência | Implementado e aceito |
| M2 | Composição, inspeção de fiadas e fases | Implementado e aceito |
| M3.1 | Portas, janelas e vãos, inclusive empilhados | Implementado e aceito |
| M3.2 | Canaletas, níveis, supressão e restauração | Implementado e aceito |
| M3.3 | Grautes automáticos e ajustes individuais | Implementado e aceito |
| M3.4 | Continuidade/união e movimento com dependentes | Implementado e aceito |
| M3.5 | Cruz nominal integrada a contorno/divisórias | Implementado e aceito |
| M4 | Lajes e até três pavimentos | Previsto |
| M5 | Quantitativos e duplicação de projetos | Previsto |

O aplicativo trabalha com um pavimento. A composição é nominal, sem dimensionamento estrutural ou comprovação de passagem física em furos/canais. Requisitos e limites no [PRD](docs/Ecovit-PRD.md); verificações e aceites no [plano](docs/Ecovit-Plano-Implementacao.md). O aceite específico das revisões de apresentação está pendente, conforme Plano §11.

## Abrir nesta máquina

O servidor de desenvolvimento usa **http://127.0.0.1:5173/**. Para iniciar no PowerShell, dentro desta pasta:

```powershell
.\Start-Ecovit.ps1
```

O script usa o Node instalado ou o runtime incluído no Codex. Nesta máquina, npm foi preparado na pasta local ignorada `.tools`; o script não baixa ou instala nada. Mantenha o terminal aberto e use Ctrl+C para encerrar. Se a porta 5173 estiver ocupada pelo Ecovit, abra o endereço já existente.

## Instalação convencional

Em outra máquina, instale Node.js 22.12+ ou 24 LTS com npm e execute:

```sh
npm ci
npm run dev
```

Use Chrome ou Edge desktop. O aplicativo exige localhost ou HTTPS para o bloqueio de edição entre abas. Use sempre a mesma origem: mudar entre `localhost` e `127.0.0.1`, ou trocar a porta, muda o armazenamento local. O arquivo `.ecovit` permite transportar projetos entre origens e navegadores.

O endereço padrão é **http://127.0.0.1:5173/**. Projetos salvos em outra origem, como `localhost`, permanecem nela. Para transferi-los, baixar o arquivo `.ecovit` na origem de armazenamento e carregá-lo na origem escolhida.

## Uso

1. Crie um projeto e escolha o tamanho-base.
2. Na ferramenta Parede, arraste para criar uma parede. Continuidade colinear compatível prolonga/une as paredes, inclusive ao preencher um intervalo entre duas existentes. A prévia mostra o comprimento total; “Inverter lado” muda o lado da espessura antes do próximo desenho. O quadrado cinza marca o módulo que contém o centro da cruz, também nas ferramentas de vãos. Ao arrastar em qualquer direção, esse módulo integra o elemento criado; para prolongar, selecione o módulo livre contíguo à ponta.
3. Selecione uma parede e arraste as alças A/B, ou altere seu comprimento no painel escolhendo a extremidade. As alças têm prioridade, inclusive com Parede ativa. Para começar outra parede exatamente sobre uma alça, limpe a seleção primeiro usando Selecionar e clicando em área vazia.
4. Em Selecionar, arraste o corpo da parede para mover com seus vãos e ajustes; no destino, continuidade compatível também une as paredes. Alças/vãos mantêm prioridade. Escape ou soltar fora cancela; um desfazer recupera movimento e união.
5. Use roda do mouse para zoom, botão do meio + arraste para navegar (ou Espaço + botão esquerdo + arraste), Escape para cancelar, Delete para excluir e Ctrl+Z / Ctrl+Y (ou Ctrl+Shift+Z) para desfazer/refazer.
6. Alterne para Fiada para navegar, consultar o intervalo de altura e sobrepor uma fiada adjacente. Selecione um conjunto com alternativa disponível, como L ou cruz, na primeira fiada, para visualizar e confirmar outra fase; a prévia destaca os cantos afetados. Diagnósticos podem ser clicados para localizar o problema.
7. Aguarde a indicação “Salvo no navegador”. Baixe uma cópia regularmente: dados locais podem ser apagados pelo navegador. Carregar arquivo cria uma cópia de projeto, sem substituir o original salvo.

As propriedades verticais começam com piso e início da alvenaria em 0 cm, e altura de novas paredes em 280 cm. O passo nominal adotado é a altura-base (7 cm resulta em 40 fiadas para 280 cm); não representa junta ou encaixe físico de um fabricante. Furos representam somente eixos. O T usa principal contínua e ramal encostado. A cruz nominal alterna continuidade horizontal/vertical, compondo também contorno e divisórias conectados; a ligação entre paredes não é dimensionada. Combinações sem padrão completo recebem diagnóstico: o conjunto afetado fica sem peças em Fiada, com a Planta preservada.

Pontas livres e contornos abertos são permitidos. Retas conectadas, L, U e ciclos sem ramificações após o tratamento dos encontros usam paginação contínua: inteiros pareiam células consecutivas, cantos seguem a paridade do percurso e meios ficam nas extremidades quando necessários. Não há obrigação de orientar todos os cantos igualmente nem mínimo de quatro módulos para a ponte de um U. Reservas incompatíveis entre encontros próximos, sobreposições e transições de altura sem padrão continuam diagnosticadas; cruz → reta conforme altura é suportada.

O arquivo vigente usa envelope versão 7 e composição `nominal-v8`. O contrato legado de M3.4 é v6/nominal-v7. Snapshots anteriores são validados pela convenção original antes da migração e marcados desatualizados para recálculo. Modelo, IDs, escolhas de encontros e supressões permanecem. Em somente leitura, o resultado antigo é preservado sem calcular/salvar; uma migração de cruz antes bloqueada informa a atualização após salvamento bem-sucedido. Arquivos atuais não são compatíveis com versões anteriores do aplicativo. Projetos anteriores a M3.3 iniciam com categorias automáticas de graute desligadas; para ativar, marcar categorias ou Restaurar padrões de graute e Aplicar. Níveis globais de canaleta existentes em M3.2 são preservados; legados anteriores iniciam sem globais, com faixas locais conforme CT-09. A versão do documento é diferente da convenção de composição.

## Testar edição de M3.4

Desenhe duas paredes compatíveis separadas e preencha o intervalo: a prévia e o resultado devem ser uma parede. Em Selecionar, mova uma parede até a continuidade de outra e confira a união; teste Desfazer/Refazer. Vãos acompanham a parede movida e ficam na posição mundial atingida após unir. Alturas/lados incompatíveis não se unem; sobreposição positiva permanece diagnosticada. Redimensionar pelas alças não dispara união.

Supressões de canaleta herdadas de uma união mostram limites do trecho e são restauradas individualmente; remover uma nova faixa continua abrangendo a parede inteira. Graute manual compartilhado conserva a intenção na parede que fica e cria uma cópia na movida. Escolhas de encontros invalidadas ficam pendentes na Fiada, com ação Descartar escolha de encontro. Confirme esses casos pelo roteiro do plano §8.

Arquivos antigos são validados antes da migração, sem unir suas paredes automaticamente. Aplicativos sem suporte ao envelope vigente rejeitam o arquivo; conserve uma cópia de segurança. O arquivo original importado não é modificado. Categorias de graute/configurações já existentes são preservadas.

## Testar grautes de M3.3

Em Configurações → Graute vertical, escolher Encontros, Laterais dos vãos, Pontas livres e Intervalos em paredes longas. Categorias são independentes; novos projetos recebem quatro habilitadas e distância 100 cm. Aplicar/Cancelar/Restaurar preservam ajustes manuais e vãos existentes.

Na Fiada, ativar Graute. Passe sobre um furo: + adiciona; − remove um eixo preenchido escuro. Clique confirma inclusão/remoção em todos os seus intervalos de alvenaria, respeitando os vazios das aberturas. O seletor de furos oferece a mesma ação por teclado. Selecionar ou Escape encerra a ferramenta; navegação e referência não editam. Uma exclusão não gera substituto automático. Ajustes sem alvo ficam preservados com diagnóstico e ação Descartar ajuste de graute. Roteiro e resultados reais no plano §7.

## Testar canaletas de M3.2

Em Configurações, grupo Canaletas, adicionar/remover níveis e consultar topo/fiada. Aplicar confirma uma operação; Cancelar preserva o projeto; Restaurar padrões recupera 112/224 cm sem apagar supressões. Novos projetos recebem esses níveis; projetos migrados permitem ativá-los explicitamente.

Na Fiada, clicar numa canaleta ou usar Selecionar faixa. A prévia verde mostra todos os trechos da parede naquela fiada. Remover faixa de canaleta devolve tijolos comuns; Restaurar faixa suprimida recupera a composição automática. Desfazer/refazer, reabrir e transportar por `.ecovit` preservam os ajustes. Canais são esquemáticos. Roteiro detalhado e resultados reais no plano §7.

## Testar vãos de M3.1

Em Planta, escolha Porta, Janela ou Vão e arraste sobre uma parede. Selecionar permite mover o corpo, redimensionar pelas duas alças ou editar posição/largura/base/altura e usar Aplicar vão. Medidas incompatíveis oferecem alternativas explícitas; Cancelar edição preserva o documento. Delete ou Excluir vão remove a abertura e pode ser desfeito. A seleção de empilhados identifica tipo/base/topo; há também um seletor acessível por teclado. Configurações expõe apenas padrões de vãos, com Aplicar/Cancelar/Restaurar; alterações não modificam aberturas existentes.

Na Fiada, abertura aparece somente na altura atingida; clicar fora da ferramenta Graute oferece Editar na Planta. Diagnósticos no rodapé permite localizar, ver fiada e editar o elemento. Encurtar parede mantém a posição do vão, sinalizando os que não couberem. Uma fiada de alvenaria entre empilhados é exigida e pode compartilhar as canaletas dos dois vãos. Grautes respeitam os intervalos de alvenaria restantes. O roteiro completo e as evidências estão no plano §7.

## Verificações

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

Nesta máquina, pode-se usar `./Start-Ecovit.ps1 -Task typecheck` e o mesmo formato com `lint`, `test`, `test:e2e` ou `build`.

Vitest cobre geometria, arquivo, histórico e IndexedDB. Playwright usa Chrome e Edge instalados, com perfis isolados que não alteram seus projetos pessoais; é preciso ter ambos os navegadores instalados para executar a suíte completa. As capturas e traces de falhas ficam em `test-results/`, fora do controle de versão. O build estático fica em `dist/`.

A porta **5173** é reservada ao solicitante: o Codex apenas orienta sua inicialização com `./Start-Ecovit.ps1 -Task dev`, sem iniciar, encerrar ou reiniciar esse servidor. Os testes de navegador usam **http://127.0.0.1:5174/**. Playwright inicia e encerra seu próprio servidor, sem reaproveitar instâncias existentes; se 5174 estiver ocupada, a execução falha. Para verificações interativas do Codex, usar `./Start-Ecovit.ps1 -Task dev:test` ou `npm run dev:test`, com sessão de navegador isolada. Encerrar esse servidor antes de executar a suíte e2e. Projetos pessoais continuam na origem 5173; a separação de portas não elimina as atualizações automáticas do Vite quando o código é alterado.

## Documentação

- [Plano incremental](docs/Ecovit-Plano-Implementacao.md): alcance, estado, critérios, evidências e roteiros por marco.
- [PRD](docs/Ecovit-PRD.md) e [Arquitetura](docs/Ecovit-Arquitetura-Tecnica.md): requisitos e decisões.
- [Caderno técnico](docs/Ecovit-Caderno-Tecnico.md): fontes, regras geométricas, exemplos e lacunas.
- [AGENTS.md](AGENTS.md): orientações para trabalhar no repositório.

Dependências e suas versões estão registradas em `package-lock.json`. Os avisos e licenças dos pacotes são preservados na instalação npm. React, react-dom, react-konva, Konva, Zustand, Zod e Vite usam licença MIT; Dexie usa Apache-2.0. Não há fontes, bibliotecas ou APIs carregadas de CDN durante o uso.

Ícones de interface usam Lucide React 1.57.0 através de `src/ui/Icon.tsx`, com variantes comuns e imports protegidos pelo lint. Padrão na Arquitetura §2.1. A licença integral do Lucide (ISC e avisos MIT dos ícones derivados) é distribuída em [public/third-party/lucide-react-LICENSE.txt](public/third-party/lucide-react-LICENSE.txt), copiada também para `dist/third-party/` pelo build. Logotipo e desenhos técnicos do canvas preservam suas representações próprias.
