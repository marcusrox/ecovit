# T-001 — Homologar contas e projetos em produção

**Execução** — Verificada

**Aceite manual** — Confirmado pelo solicitante

## Referências e pré-condições

RF-12, RF-19 e RF-20. Origem no [registro de pendências do M12](../arquivo/marcos/M12-Contas-e-Persistencia-Remota.md#pendências-vigentes), com os [critérios históricos](../arquivo/marcos/M12-Contas-e-Persistencia-Remota.md#critérios-de-aceite). Contratos vigentes em [Autenticação e acesso](../arquitetura/Autenticacao-e-Acesso.md), [Persistência e compatibilidade](../arquitetura/Persistencia-e-Compatibilidade.md) e [Estado e operações](../arquitetura/Estado-Historico-e-Operacoes.md).

O solicitante conduz a conferência na revisão publicada, com conta e projetos descartáveis, duas sessões de navegador e um `.ecovit` suportado com imagem e ajustes conhecidos. A [T-002](T-002-Homologacao-Operacional-Producao.md) registra as verificações de infraestrutura e de eliminação física.

## Critérios de aceite

- [x] **A01** — Solicitar o código e usar Reenviar quando o controle estiver disponível. Com o código válido, entrar na conta de teste. Após sair, uma rota privada pede autenticação. Ao entrar novamente, a lista corresponde à mesma conta. Referência M12-A01.
- [x] **A02** — Importar o arquivo de teste, editar e aguardar a confirmação de gravação. Ao reabrir em outra sessão da mesma conta, conferir a alteração, a imagem e os ajustes conhecidos. Baixar e reimportar o arquivo em um projeto separado, verificando que esses dados acompanham a cópia. Referências M12-A04 e M12-A08–A11.
- [x] **A03** — Interromper a conexão de uma sessão durante uma edição e restaurá-la. O candidato fica disponível para download durante a falha. Após restabelecer a conexão, usar a ação de recuperação apresentada pela interface. A confirmação aplica a alteração uma única vez, com um único avanço de revisão. Referências M12-A05 e M12-A13.
- [x] **A04** — Abrir o mesmo projeto em duas sessões na mesma revisão. Salvar na primeira e editar na segunda. A segunda recebe conflito, permite baixar o candidato e abre a revisão remota após descarte explícito, preservando o que a primeira salvou. Referências M12-A07 e M12-A13.
- [x] **A05** — Enviar um projeto à lixeira. Ele deixa a lista ativa e pode ser restaurado com o mesmo conteúdo. Enviar novamente e confirmar a exclusão definitiva. O projeto deixa de estar acessível pela lista e por acesso direto. Referência M12-A14.
- [x] **A06** — Confirmar a exclusão da conta descartável com o código de finalidade exclusiva. Conferir a revogação imediata em ambas as sessões e o bloqueio de acesso e gravação. Referência M12-A15.

## Resultado da execução

Execução bem-sucedida informada pelo solicitante para o conjunto dos critérios. O relato foi global, sem evidências individuais por critério.

O M12 preserva o aceite local de entrada, importação, edição ao reabrir, imagens e download, além da cobertura automatizada anterior. A publicação e a checagem de saúde já verificadas são evidências da implantação.

## Confirmação de aceite — 2026-11-13

Aceite manual confirmado explicitamente pelo solicitante em 2026-11-13, ao solicitar o registro de todos os aceites pendentes. Os registros anteriores preservam a situação de cada etapa; esta confirmação encerra a pendência de aceite desta task, sem alterar as evidências de execução ou representar nova execução de testes.
