export type Account = { id: string; email: string };
export type Session = {
  account: Account | null;
  csrf: string;
  serverTime: string;
  devLogin?: true;
};
let session: Session = {
  account: null,
  csrf: "",
  serverTime: new Date().toISOString(),
};
let offset = 0;
let accountScope: string | null = null;
let sessionRevision = 0;
export const getAccountScope = () => accountScope;
export function setAccountScope(id: string | null) {
  accountScope = id;
}
export function requestAuthentication() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("ecovit:auth-required"));
}
export function requireAccount() {
  const account = session.account;
  if (!account || (accountScope && account.id !== accountScope)) {
    requestAuthentication();
    throw new RemoteError(
      account ? 409 : 401,
      account ? "account_changed" : "session_expired",
      "Entre na conta original para retomar o trabalho desta página.",
    );
  }
  return accountScope ?? account.id;
}
export class RemoteError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public confirmationPending = false,
  ) {
    super(message);
  }
  get uncertain() {
    return (
      this.confirmationPending ||
      this.status >= 500 ||
      this.code === "network" ||
      this.code === "invalid_response"
    );
  }
}
export const currentSession = () => session;
export function setSession(next: Session) {
  sessionRevision++;
  session = next;
  offset = Date.parse(next.serverTime) - Date.now();
}
export const requestTime = () => new Date(Date.now() + offset).toISOString();
export async function api<T>(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    binary?: Uint8Array;
    account?: string;
    reauth?: boolean;
  } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  let response: Response;
  try {
    response = await fetch(`/api${url}`, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(110000),
      headers: {
        ...(method !== "GET" ? { "X-CSRF-Token": session.csrf } : {}),
        ...((options.account ?? accountScope ?? session.account?.id)
          ? {
              "X-Ecovit-Account":
                options.account ?? accountScope ?? session.account!.id,
            }
          : {}),
        ...(options.binary
          ? { "Content-Type": "application/octet-stream" }
          : options.body !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
      },
      body: options.binary
        ? (options.binary as BodyInit)
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
    });
  } catch {
    throw new RemoteError(
      503,
      "network",
      "Sem confirmação do servidor. Seu trabalho está em memória; tente novamente ou baixe uma cópia.",
    );
  }
  let value;
  try {
    value = await response.json();
  } catch {
    throw new RemoteError(
      503,
      "invalid_response",
      "Resposta incompleta. Confira a confirmação antes de repetir.",
    );
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new RemoteError(
      503,
      "invalid_response",
      "Resposta incompleta. Confira a confirmação antes de repetir.",
    );
  if (!response.ok) {
    if (typeof value.code !== "string" || typeof value.message !== "string")
      throw new RemoteError(
        503,
        "invalid_response",
        "Resposta de erro incompleta. Confira a confirmação antes de repetir.",
      );
    if (
      options.reauth !== false &&
      (response.status === 401 ||
        (response.status === 409 && value.code === "account_changed"))
    )
      requestAuthentication();
    throw new RemoteError(
      response.status,
      value.code ?? "remote",
      value.message ?? "Solicitação não concluída.",
    );
  }
  return value as T;
}
function validSession(value: Session) {
  return (
    typeof value.csrf === "string" &&
    value.csrf.length >= 32 &&
    typeof value.serverTime === "string" &&
    Number.isFinite(Date.parse(value.serverTime)) &&
    (value.account === null ||
      (value.account &&
        typeof value.account.id === "string" &&
        /^[0-9a-f-]{36}$/i.test(value.account.id) &&
        typeof value.account.email === "string"))
  );
}
function incomplete() {
  return new RemoteError(
    503,
    "invalid_response",
    "Resposta incompleta. Confira a sessão antes de tentar novamente.",
  );
}
export async function bootstrap({ allowDevLogin = false } = {}) {
  const revision = sessionRevision;
  const next = await api<Session>("/session");
  if (!validSession(next)) throw incomplete();
  if (revision !== sessionRevision) return session;
  setSession(next);
  if (!allowDevLogin || next.devLogin !== true) return next;

  const devRevision = sessionRevision;
  const local = await api<Session>("/auth/dev-login", {
    method: "POST",
    reauth: false,
  });
  if (!validSession(local) || !local.account) throw incomplete();
  if (devRevision !== sessionRevision) return session;
  setSession(local);
  return local;
}
export async function loginCode(
  email: string,
  purpose: "login" | "delete" = "login",
) {
  await bootstrap();
  const result = await api<{ id: string; retryAfter: number }>("/auth/code", {
    method: "POST",
    body: { email, purpose },
  });
  if (
    typeof result.id !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(result.id) ||
    !Number.isFinite(result.retryAfter) ||
    result.retryAfter < 0
  )
    throw incomplete();
  return result;
}
export async function verifyCode(
  id: string,
  code: string,
  expectedAccount?: string,
) {
  const result = await api<
    Session & { deletion?: { proof: string; receipt: string } }
  >("/auth/verify", { method: "POST", body: { id, code } });
  if (
    result.account
      ? !validSession(result)
      : !result.deletion ||
        typeof result.deletion.proof !== "string" ||
        result.deletion.proof.length < 32 ||
        typeof result.deletion.receipt !== "string" ||
        result.deletion.receipt.length < 32
  )
    throw incomplete();
  if (
    result.account &&
    expectedAccount &&
    result.account.id !== expectedAccount
  )
    throw new RemoteError(
      409,
      "account_changed",
      "Esta conta não é a original do desenho. Baixe seu trabalho antes de trocar de conta.",
    );
  if (result.account) setSession(result);
  return result;
}
