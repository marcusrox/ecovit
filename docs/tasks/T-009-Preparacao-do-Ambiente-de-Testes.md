# T-009 — Preparar e verificar o ambiente isolado de testes

**Tipo** — Implementação

**Execução** — Verificada

**Data de execução** — 2026-11-11

**Aceite manual** — Não aplicável

## Referências e pré-condições

Solicitação de 11/11/2026 e [Desenvolvimento e verificações isoladas](../arquitetura/Persistencia-e-Compatibilidade.md#desenvolvimento-e-verificações-isoladas). Node.js 24, dependências instaladas e PostgreSQL 18 disponível para provisionamento local. Chrome instalado; Edge exigido quando selecionado.

## Comportamento atual e objetivo

A preparação exigia descobrir executáveis, iniciar banco e exportar a conexão a cada execução. Oferecer comandos reproduzíveis de preparação, diagnóstico e encerramento do banco gerenciado. Carregar .env.test nos runners de teste, mantendo a precedência das variáveis já definidas no ambiente.

## Escopo e limites

Usar conexão M12_TEST_DATABASE_URL existente somente para banco ecovit_test. Na ausência de conexão, criar cluster descartável em .tools/test-environment, limitado ao loopback e porta própria, usando PostgreSQL já instalado. Persistir apenas a conexão local em .env.test privado, sem sobrescrever configuração existente ou carregar/alterar .env. Sem downloads ou instalação automática de dependências.

Verificar runtime, dependências, portas 5174/3002, PostgreSQL e Chrome; Edge opcional explícito. Diagnóstico não provisiona nem inicia banco. Encerramento opera somente no cluster gerenciado identificado; nunca encerrar instância desconhecida, reutilizar servidor do aplicativo ou usar 5173. Preparação não limpa schemas/dados; a reinicialização do schema de navegador continua pertencendo ao runner existente.

## Critérios de aceite

- [x] **A01** — Preparar sem configuração cria banco local ecovit_test, grava conexão privada e verifica o ambiente; repetir reutiliza o cluster sem apagar dados.
- [x] **A02** — Os runners de navegador/API carregam .env.test automaticamente com precedência do ambiente; um teste real passa sem exportação manual da conexão.
- [x] **A03** — Diagnóstico detecta configuração inválida, conexão indisponível ou porta ocupada e retorna erro acionável; rejeita banco diferente de ecovit_test e não expõe credenciais.
- [x] **A04** — Diagnóstico não inicia banco; encerramento para somente o cluster gerenciado; preparação posterior recupera o mesmo ambiente. Porta 5173 e .env permanecem preservados.
- [x] **A05** — README, AGENTS.md e contratos registram comandos, dependências, isolamento, efeitos e limites do preparo.

## Resultado da execução

- **Contratos atualizados** — Preparo/isolamento em Persistência e compatibilidade; pré-requisitos, comandos e exemplos em README e AGENTS.md. Playwright, configuração Vitest da API e servidor de testes carregam .env.test; guardas de banco do servidor e testes de API usam validação estrita compartilhada.
- **A01** — Aprovado: provisionamento do zero com PostgreSQL 18/UTF8 em .tools/test-environment, loopback 55432, role/banco ecovit_test e configuração privada .env.test. Repetição manteve configuração e registro sentinela no banco. Conexão já configurada foi apenas verificada, sem reiniciar o processo. Preparação não migra nem limpa schemas.
- **A02** — Aprovado: cenário de interface e fluxo no Chrome passaram pelos comandos da T-008 sem exportação manual da conexão. Um teste real de API de reutilização de conta/sessão também passou, em 1,53 s; 22 cenários estavam fora do filtro. Teste unitário confirmou precedência do ambiente e ausência de carregamento de .env.
- **A03** — Aprovado: recusa de banco incorreto, nome semelhante e URL com query enganosa; mensagens sem credencial sentinela. Serviço de teste ocupando 5174 fez preparar, diagnosticar e encerrar retornarem erro, preservando o serviço. Diagnóstico com banco parado retornou erro sem iniciá-lo; produção foi recusada. Chrome e Edge foram iniciados e fechados no diagnóstico explícito --edge.
- **A04** — Aprovado: identificação divergente no marcador impediu encerramento e preservou banco conectado. Ciclo encerrar/diagnosticar/preparar preservou sentinela e .env.test. Hash de .env, quando existente, permaneceu igual. Nenhum processo desconhecido, servidor 5173 ou banco do aplicativo foi alterado. A versão final distingue cluster parado de erro de permissão na consulta de estado. O cluster gerenciado foi deixado preparado e ativo para as próximas execuções; test:env:stop permite encerrá-lo preservando os dados. Servidores 5174/3002 dos testes foram encerrados pelo runner.
- **A05** — Aprovado por revisão dos contratos e exemplos. Binários e dependências devem estar instalados; não há download/instalação automática, migração de banco externo ou exclusão automática de diretório incompleto. Localização dos binários admite ECOVIT_TEST_PG_BIN.
- **Verificação automatizada** — Typecheck, lint e três testes unitários de ambiente aprovados, executados com os três de seleção da T-008 (seis testes). Diagnósticos e ciclo real em .tools/t009-lifecycle.log, .tools/t009-ownership.log e demais logs .tools/t009-*.log, ignorados pelo Git. Provisionamento local em .tools/test-environment/setup.log e postgres.log. O protótipo inicial foi corrigido para evitar pipes herdados de pg_ctl no Windows, montar corretamente a URL de manutenção e exigir UTF8; o ambiente final foi provisionado novamente do zero, preservando os artefatos iniciais em .tools/t009-initial-cluster. Não foi executada a suíte completa de domínio/API/navegador nem o build do produto; a alteração é restrita à infraestrutura de testes.
- **Verificação manual ou operacional** — Ciclo real de preparação, reutilização, diagnóstico, bloqueios, encerramento e reinício concluído, separado de aceite de produto. Nenhuma mudança de interface ou regra construtiva.
- **Aceite do solicitante** — Não aplicável; sem homologação de versão ou publicação.

## Revisão solicitada em 11/11/2026

- Conexão explicitamente vazia passa a ser configuração inválida, impedindo provisionar e gravar outra conexão no lugar dela. Marcadores JSON nulos, arrays, primitivas, incompletos e ilegíveis recebem recusa padronizada antes de consultar ou encerrar processos.
- A descoberta de binários ignora versões diferentes de 18 no PATH e respeita diretório explícito inválido, sem fallback silencioso. A alteração foi testada com diretórios temporários e versões simuladas. Diretórios temporários dos testes são removidos ao final, limitados aos caminhos criados pelo próprio teste.
- Simplificada a carga de dependências: importar helpers não lê .env.test, e os pontos de entrada de navegador/API/servidor/preparador carregam o arquivo explicitamente. pg e Playwright são carregados apenas quando usados; consultas de portas e configuração não dependem de iniciar essas bibliotecas. Encerramento sem banco ativo é uma operação sem efeito e não exige portas livres; antes de encerrar um banco ativo, os bloqueios e a conferência de identidade permanecem.
- Validação da revisão: cinco testes de ambiente e cinco de seleção aprovados (10 em 1,62 s); seis marcadores inválidos recusados em execução real do comando, preservando o original; diagnóstico de Chrome/Edge aprovado. O cenário no Chrome e um cenário de API passaram com carregamento explícito de .env.test, sem exportação manual. API: 1 aprovado e 22 fora do filtro, em 1,28 s. Tipos, lint e build aprovados. Logs em .tools/review-008-009-*.log.
- Resultado anterior e evidências mantidos. Sem alteração de produto, publicação ou confirmação manual adicional nesta revisão; o banco gerenciado permanece disponível para as próximas execuções.
