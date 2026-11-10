# Ecovit — Índice de requisitos e aceites

> Registro histórico. O desenvolvimento incremental e as verificações pendentes do M12 são acompanhados em [Tasks](../tasks/README.md).

O [PRD](../Ecovit-PRD.md) define o comportamento atual, a [arquitetura](../Ecovit-Arquitetura-Tecnica.md) define os contratos e o [Caderno técnico](../Ecovit-Caderno-Tecnico.md) reúne convenções, fontes e exemplos. Os registros abaixo relacionam funcionalidades vigentes a seus identificadores e à situação de aceite.

| Referência | Funcionalidade | Requisitos | Aceite |
|---|---|---|---|
| [M1 — Planta editável e persistência](marcos/M1-Planta-e-Persistencia.md) | Projetos, paredes, histórico e arquivo nativo | RF-01/02/03/08/09/11/12 | Aceite recebido |
| [M2 — Composição e inspeção de fiadas](marcos/M2-Composicao.md) | Catálogo nominal, retas, L/U/T/contornos, fases, diagnóstico e inspeção | RF-01/03/04/05/09/10/11/12; CT-01–06 | Aceite recebido |
| [M3.1 — Vãos](marcos/M3-Vaos-Canaletas-Grautes.md) | Portas, janelas, vãos e padrões de inserção | RF-04/06/09/10/12; CT-07/08 | Aceite recebido |
| [M3.2 — Canaletas](marcos/M3-Vaos-Canaletas-Grautes.md) | Níveis globais, faixas locais, supressão/restauração | RF-04/07/09/10/12; CT-09 | Aceite recebido |
| [M3.3 — Grautes](marcos/M3-Vaos-Canaletas-Grautes.md) | Categorias, distância, eixos, seleção individual em Fiada e restauração por parede/pavimento | RF-04/07/09/10/12; CT-10 | Aceite recebido |
| [M3.4 — Edição no canvas](marcos/M3.4-Edicao-no-Canvas.md) | Continuidade/união, movimento com dependentes e módulo inicial | RF-02/03/06/07/09/10/11/12; CT-11 | Aceite recebido |
| [M3.5 — Cruz nominal](marcos/M3.5-Cruz-Nominal.md) | Cruz integrada a L/T/contorno, fases e elementos associados | RF-04/05/07/09/10/12; CT-12 | Aceite recebido |
| [M4 — Lajes e múltiplos pavimentos](marcos/M4-Lajes-e-Pavimentos.md) | Cota única modular, lajes independentes, até quatro pavimentos e comparação visual | RF-08/13 e integração com RF-04/05/07 | Aceite recebido |
| [M4.1 — Pavimentos](marcos/M4.1-Pavimentos.md) | Gestão de pavimentos, cotas e composição local | RF-08; EX-56–64 | Aceite recebido |
| [M4.2 — Lajes](marcos/M4.2-Lajes.md) | Lajes/aberturas, edição e extensão AH de alturas | RF-13; CT-13/14; EX-65–79; D42-01 | Aceite recebido |
| [M4.3 — Comparação visual](marcos/M4.3-Comparacao-de-Pavimentos.md) | Referência de pavimento adjacente em Planta | RF-08; CT-15; EX-80–85 | Aceite recebido |
| [M5 — Quantitativos e projetos](marcos/M5-Quantitativos-e-Projetos.md) | Quantitativos, duplicação e abertura de projetos | RF-10/11/12 e cenários do PRD | Aceite global recebido; aceites específicos no registro |
| [M6 — Preferências do Ecovit](marcos/M6-Preferencias.md) | Preferências de rótulos, comprimento/altura das paredes e status e ajuda do canvas | BL-07; RF-09/10/14 | Aceite recebido |
| [M7 — Medidas independentes](marcos/M7-Medidas.md) | Medidas livres em Planta, atração geométrica e persistência por pavimento | BL-03; RF-15, integração com RF-02/08/09/11/12/14 | Aceite recebido |
| [M8 — Imagem de referência por pavimento](marcos/M8-Imagem-de-Referencia.md) | Uma imagem de fundo calibrada, posição/rotação, opacidade e interface compacta | BL-02; RF-16, integração com RF-02/08/09/11/12 | Aceite recebido |
| [M9 — Tipos de portas e janelas](marcos/M9-Esquadrias.md) | Nove variantes e símbolos em Planta com botão único de orientação cíclica | BL-08; RF-06; [Elementos construtivos](../arquitetura/Elementos-Construtivos.md#vãos-e-aparência-de-esquadrias); CT-17 | Aceite recebido |
| [M10 — Mobiliários](marcos/M10-Mobiliarios.md) | Acervo integrado com 59 opções, ocorrências editáveis em Planta e upload incorporado ao arquivo | BL-01; RF-17; [Medidas e imagens](../arquitetura/Medidas-e-Imagens.md#mobiliários-e-acervo) | Aceite recebido |
| [M11 — Terreno](marcos/M11-Terreno.md) | Terreno global com perímetro livre, aparências, área em m² e ajuste de pontos/posição | RF-18; integração com RF-02/08/09/11/12/16 | Aceite recebido |
| [M12 — Contas e persistência remota](marcos/M12-Contas-e-Persistencia-Remota.md) | Conta por código de e-mail, projetos privados em PostgreSQL 18.0, lixeira/exclusão da conta e importação manual .ecovit | BL-04, BL-05; RF-12/19/20 | Publicado; homologação funcional e aceite global pendentes |

Os aceites de apresentação e operação estão em [Apresentação e operação](marcos/Apresentacao-e-Operacao.md). As pendências funcionais e operacionais em produção estão em [M12](marcos/M12-Contas-e-Persistencia-Remota.md#pendências-vigentes).
