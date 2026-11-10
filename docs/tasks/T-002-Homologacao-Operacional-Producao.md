# T-002 — Homologar a operação em produção

**Execução** — Verificada

**Aceite manual** — Pendente

## Referências e pré-condições

Origem no [registro de pendências do M12](../arquivo/marcos/M12-Contas-e-Persistencia-Remota.md#pendências-vigentes), com referências M12-A15, M12-A17 e M12-T08. Usar os [requisitos de dimensionamento](../arquitetura/Persistencia-e-Compatibilidade.md#requisitos-para-validação-pelo-administrador), os [contratos de implantação](../arquitetura/Persistencia-e-Compatibilidade.md#operação-e-implantação) e [Autenticação e acesso](../arquitetura/Autenticacao-e-Acesso.md). A inspeção da instância e os ensaios de carga e limpeza dependem do administrador. Usar dados descartáveis e registrar evidências sem segredos ou dados pessoais.

## Critérios de aceite

- [x] **A01** — Solicitar um código para uma caixa de teste em produção. Conferir que o remetente autorizado na Resend é o recebido e que a entrega permite concluir o login dentro da validade do código.
- [x] **A02** — Conferir a configuração efetiva do proxy contra o contrato, incluindo HTTPS, origem única para frontend e API, acesso ao backend por loopback e timeout do proxy. Verificar que os recursos privados ficam fora da raiz pública e que o acesso via API exige autorização.
- [x] **A03** — Conferir permissões efetivas do ambiente, diretório de imagens e roles de banco contra o contrato de implantação. A API tem acesso aos recursos necessários com os privilégios previstos para execução.
- [x] **A04** — Executar o ensaio M12-T08 com fixture representativa de importação pesada. A importação termina dentro dos limites de tempo vigentes e a revisão importada pode ser aberta. Registrar duração e picos de RSS, CPU e disco. As medições devem caber no orçamento disponível da instância, considerando os outros serviços do host.
- [x] **A05** — Conferir a execução da limpeza a cada 15 minutos, o indicador de última execução e a sinalização de falha ou atraso. Em ensaio controlado, verificar repetição e retomada após interrupção. Após excluir uma conta descartável, conferir a eliminação dos dados ativos em até 24 horas.

## Resultado da execução

Execução bem-sucedida informada pelo solicitante para o conjunto dos critérios. O relato foi global, sem evidências individuais por critério.

A publicação em HTTPS e a confirmação do SHA servido constam do [aceite histórico do M12](../arquivo/marcos/M12-Contas-e-Persistencia-Remota.md#aceite-e-verificações). Backup segue sob responsabilidade da administração do servidor.
