# Ecovit

Editor local de plantas com paredes ortogonais e malha de meio tijolo. M1 e M2 incluem desenho/edição de paredes, histórico, composição nominal de fiadas, inspeção, salvamento no navegador e arquivo `.ecovit`. Vãos, graute, canaletas, lajes e quantitativos permanecem fora desta entrega.

## Abrir nesta máquina

O servidor de desenvolvimento usa **http://127.0.0.1:5173/**. Para iniciar novamente no PowerShell, dentro desta pasta:

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

O endereço padrão das instruções atuais é **http://127.0.0.1:5173/**. Projetos anteriormente salvos em `localhost` permanecem naquela origem. Para transferi-los, baixar o arquivo `.ecovit` na origem antiga e carregá-lo na origem escolhida. Endereços diferentes citados nos relatórios históricos registram a origem usada naquela ocasião.

## Uso

1. Crie um projeto e escolha o tamanho-base.
2. Na ferramenta Parede, arraste para criar uma parede. A prévia mostra o comprimento modular; “Inverter lado” muda o lado da espessura antes do próximo desenho.
3. Selecione uma parede e arraste as alças A/B, ou altere seu comprimento no painel escolhendo a extremidade. As alças têm prioridade, inclusive com Parede ativa. Para começar outra parede exatamente sobre uma alça, limpe a seleção primeiro usando Selecionar e clicando em área vazia.
4. Use roda do mouse para zoom, botão do meio + arraste para navegar (ou Espaço + botão esquerdo + arraste), Escape para cancelar, Delete para excluir e Ctrl+Z / Ctrl+Y (ou Ctrl+Shift+Z) para desfazer/refazer.
5. Alterne para Fiada para navegar, consultar o intervalo de altura e sobrepor uma fiada adjacente. Selecione um conjunto em L, na primeira fiada, para visualizar e confirmar outra fase; a prévia destaca os cantos afetados. Diagnósticos podem ser clicados para localizar o problema.
6. Aguarde a indicação “Salvo no navegador”. Baixe uma cópia regularmente: dados locais podem ser apagados pelo navegador. Carregar arquivo cria uma cópia de projeto, sem substituir o original salvo.

As propriedades verticais começam com piso e início da alvenaria em 0 cm, e altura de novas paredes em 280 cm. O passo nominal adotado é a altura-base (7 cm resulta em 40 fiadas para 280 cm); não representa junta ou encaixe físico de um fabricante. Furos representam somente eixos. O T usa principal contínua e ramal encostado, com aviso de ligação complementar. A cruz e combinações sem padrão recebem diagnóstico: o conjunto afetado fica sem peças em Fiada, com a Planta preservada.

Pontas livres e contornos abertos são permitidos. Retas conectadas, L, U e ciclos sem ramificações após o tratamento dos T usam paginação contínua: inteiros pareiam células consecutivas, cantos seguem a paridade do percurso e meios ficam nas extremidades quando necessários. Não há obrigação de orientar todos os cantos igualmente nem mínimo de quatro módulos para a ponte de um U. Cruz, sobreposições e transições de altura ainda não suportadas continuam diagnosticadas.

Arquivos versão 1 são migrados sem alterar paredes. Arquivos versão 2 preservam modelo e ajustes. Snapshots antigos `nominal-v1` e `nominal-v2` são conferidos com suas regras originais antes de serem marcados desatualizados e recalculados/salvos como `nominal-v3`. Snapshots v3 consistentes são preservados. Atualize o aplicativo e reabra o projeto na mesma origem do navegador para aplicar a nova paginação.

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

## Documentação e relatório

- [Plano e relatórios de M1/M2](docs/Ecovit-Plano-Implementacao.md): andamento, critérios, evidências e roteiro manual.
- [PRD](docs/Ecovit-PRD.md) e [Arquitetura](docs/Ecovit-Arquitetura-Tecnica.md): requisitos e decisões.
- [Caderno técnico](docs/Ecovit-Caderno-Tecnico.md): fontes, regras geométricas, exemplos e lacunas.
- [AGENTS.md](AGENTS.md): orientações para trabalhar no repositório.

Dependências e suas versões estão registradas em `package-lock.json`. Os avisos e licenças dos pacotes são preservados na instalação npm. React, react-dom, react-konva, Konva, Zustand, Zod e Vite usam licença MIT; Dexie usa Apache-2.0. Não há fontes, bibliotecas ou APIs carregadas de CDN durante o uso.
