export function codeEmail(code: string, purpose: "login" | "delete") {
  const deleting = purpose === "delete";
  const subject = deleting
    ? "Ecovit — confirmar exclusão da conta"
    : "Seu código de acesso ao Ecovit";
  const title = deleting
    ? "Código de exclusão da conta"
    : "Seu código de acesso";
  const introduction = deleting
    ? "Use este código no Ecovit para continuar a solicitação de exclusão da sua conta."
    : "Use este código para entrar no Ecovit e continuar seus projetos.";
  const safeCode = code.replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character]!;
  });
  return {
    subject,
    text: `Seu código é ${code}. Válido por 10 minutos. ${deleting ? "Este código confirma a exclusão da sua conta e dos projetos." : "Não compartilhe este código."}`,
    html: `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f4ee;color:#263d33;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${title} do Ecovit. Válido por 10 minutos.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f4ee;">
    <tr><td align="center" style="padding:12px;">
      <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background-color:#ffffff;border:1px solid #dce5dc;border-radius:14px;">
        <tr><td style="padding:14px 20px 12px;border-bottom:1px solid #e1e8de;">
          <div style="font-size:26px;line-height:30px;font-weight:700;letter-spacing:-1px;color:#214c38;">ecovit <span style="display:inline-block;margin-left:8px;vertical-align:middle;font-size:9px;line-height:14px;font-weight:600;letter-spacing:1.5px;color:#6c7c70;">ESTÚDIO MODULAR</span></div>
        </td></tr>
        <tr><td style="padding:16px 20px;">
          <h1 style="margin:0 0 12px;font-size:20px;line-height:26px;font-weight:600;letter-spacing:-0.5px;color:#263d33;">${title}</h1>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#edf3eb;border:1px solid #d4e2d4;border-radius:10px;">
            <tr><td align="center" style="padding:12px;">
              <code style="display:block;font-family:Consolas,'Courier New',monospace;font-size:42px;line-height:54px;font-weight:700;letter-spacing:6px;white-space:nowrap;color:#245d49;">${safeCode}</code>
            </td></tr>
          </table>
          <p style="margin:10px 0 14px;text-align:center;font-size:13px;line-height:20px;color:#5e7263;">Válido por <strong style="color:#263d33;">10 minutos</strong>. Não compartilhe este código.</p>
          <p style="margin:0 0 12px;font-size:13px;line-height:20px;color:#5e7263;">${introduction}</p>
          ${deleting ? '<p style="margin:0 0 12px;font-size:13px;line-height:20px;color:#934b19;">Este código é exclusivo para excluir sua conta e seus projetos. Continue somente se foi você quem solicitou a exclusão.</p>' : ""}
          <p style="margin:0;font-size:13px;line-height:21px;color:#6c7c70;">Se você não solicitou este código, ignore este e-mail.</p>
        </td></tr>
        <tr><td style="padding:10px 20px;background-color:#f6f9f3;border-top:1px solid #e1e8de;border-radius:0 0 14px 14px;">
          <p style="margin:0;font-size:11px;line-height:16px;color:#788773;">Ecovit · Estúdio modular — Do primeiro traço ao projeto.</p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`,
  };
}
