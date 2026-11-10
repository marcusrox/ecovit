# T-005 — Redesenhar a tela de entrada

**Tipo** — Implementação

**Execução** — Verificada

**Data de execução** — 2026-11-10

**Aceite manual** — Confirmado pelo solicitante

## Referências e pré-condições

[RF-19](../Ecovit-PRD.md#rf-19--conta-e-acesso-por-código-de-e-mail) · [Tela de entrada](../arquitetura/Interface-e-Iconografia.md#tela-de-entrada) · [Versão e histórico de tasks](../arquitetura/Interface-e-Iconografia.md#versão-e-histórico-de-tasks)

## Comportamento atual e objetivo

A entrada por código era apresentada em um cartão sobre fundo neutro. Redesenhar a tela com a identidade do Ecovit e uma imagem editorial de arquitetura sustentável em tijolo ecológico.

## Escopo e limites

Usar a marca do aplicativo e um painel ilustrado adaptável a telas largas e estreitas. Preservar autenticação, mensagens de erro, reenvio, aviso de migração e rodapé com versão. A apresentação do diálogo de reautenticação no editor segue o contrato existente.

## Critérios de aceite

- [x] **A01** — Em 1366×768, 1280×720 e 900×680, o painel ilustrado aparece ao lado do formulário e a imagem é carregada pelo aplicativo. A versão segue no rodapé.
- [x] **A02** — Em 390×844 e 320×640, a imagem ocupa uma faixa acima do formulário. E-mail e Enviar código ficam acessíveis na primeira tela, sem rolagem horizontal.
- [x] **A03** — Ao enviar o e-mail por teclado, o foco passa ao campo do código e a espera do reenvio é indicada. Em 390×844, o topo do formulário mantém sua posição durante a transição. Ao confirmar um código válido, o aplicativo abre a lista de projetos. O histórico da versão continua acessível pelo rodapé.

## Resultado da execução

- **Contratos atualizados** — RF-19 e Interface e iconografia.
- **Verificação automatizada** — lint e build aprovados, incluindo a verificação de tipos. O Playwright na porta 5174 aprovou 20 cenários em Chrome e Edge, incluindo as regressões de conta e histórico. Após o ajuste de alinhamento móvel, os dois cenários específicos de entrada foram revalidados nos mesmos navegadores e o build passou novamente.
- **Verificação visual** — capturas em 1366×768, 1280×720, 900×680, 390×844 e 320×640. O roteiro conferiu imagem, campos, rodapé e transição estável para o código com foco no campo. A imagem WebP tem 294.136 bytes.
- **Aceite do solicitante** — nova tela de entrada aprovada em 10/11/2026.

## Imagem editorial

Imagem gerada com a ferramenta integrada ImageGen e convertida para [WebP](../../public/images/entrada-tijolo-ecologico.webp).

> Photorealistic editorial architecture photograph for the tall left-hand image panel of Ecovit, a Brazilian ecological brick architecture design app. Generate a vertical 4:5 composition with an elevated architectural photography aesthetic. A contemporary modest single-story Brazilian home at garden level, a simple timber eave, dark charcoal window frames, natural reddish umber compressed earth ecological interlocking brick with distinct fine horizontal seams and clean joints, shaded recessed entrance, native tropical landscaping with ferns and a slim tree. The house and prominent tactile ecological masonry are the focus, seen from a quiet three-quarter perspective, filling most of frame. Warm filtered late-afternoon sunlight, soft shadows, restrained colors of rust, olive green and sand. Keep the lower quarter naturally darker with softly shaded foreground planting suitable for a light text overlay in the website, but absolutely no text in the image. Keep the main building in central 70% so mobile landscape crop can still show brick and greenery. Realistic and grounded, refined architectural magazine photo, no people, no logos, no watermarks, no lettering, no UI, no graphic design.
