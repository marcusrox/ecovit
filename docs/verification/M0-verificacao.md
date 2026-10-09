# Verificação do M0 — 07/10/2026

## Executado nesta pasta

Ambiente: Windows, Node 24.18.0, npm 11.16.0. Navegador dos testes: Chromium do Playwright 1.63.0.

| Verificação | Resultado |
| --- | --- |
| Instalação npm e lockfile | Concluídos; dependências exatas |
| `npm run lint` | Aprovado, sem warnings ESLint |
| `npm run typecheck` | Aprovado |
| `npm test` | 28 testes aprovados |
| `npm run schema:check` | Estrutura Zod igual ao JSON Schema embutido na migração |
| `npm run build` | Aprovado; `dist` gerado com `_redirects` |
| `npm run test:e2e` | 8 testes aprovados, Supabase **simulado** |
| Aplicação sem variáveis Supabase | Aviso visível, login desabilitado, rota privada redirecionada; zero erros JS no smoke do Chromium |
| Revisão visual | Login em 1440×900; projetos/editor em 1280×720, sem sobreposição observada |
| Servidor de desenvolvimento | HTTP 200 em `http://127.0.0.1:5173/` |
| PRD original | Preservado byte a byte, hash abaixo |

SHA-256 do PRD antes/depois:

```text
13CD71592C69674D54075910396B628994FD161F01A50C993F8FA6D27F1BCAFB
```

Os testes unitários cobrem documentos vazios, referências, UUIDs, limites, tamanhos UTF-8, versão desconhecida, round-trip, configurações inválidas e normalização de falhas. As mesmas fixtures estão disponíveis para o teste real SQL.

Os oito E2E cobrem: navegação protegida/login/criação/editor/reload/lista/logout; credenciais inválidas; cadastro/solicitação de recuperação; link ausente/expirado; falha na listagem; projeto ausente; schema futuro; retry após resposta de criação perdida. Interceptações de rede ficam exclusivamente nos testes, não na aplicação. Esses testes **não comprovam RLS, transações SQL, entrega de e-mails ou persistência remota real**.

## Preparado, mas não executado

- Migrações PostgreSQL/pg_jsonschema, RLS e RPC `create_project`: não aplicadas em servidor Supabase.
- `npm run test:cloud`: depende de `.env.cloud`, duas contas confirmadas e migrações aplicadas em homologação. Sem esses dados, não foi executado.
- Cadastro/login/recuperação com serviço real, envio SMTP e reabertura em outro navegador: pendentes de configuração externa.
- GitHub Actions e Cloudflare Pages: workflow e fallback preparados; sem execução hospedada/publicação.
- Backup diário/retencão: disponibilidade e preço consultados na documentação; plano e restauração reais não configurados/testados.

O código independente de configuração externa do M0 está entregue. O aceite completo do marco permanece aberto até comprovar login e criação/leitura na nuvem. As instruções e variáveis exatas estão no README. M1–M5 não estão implementados nesta entrega.
