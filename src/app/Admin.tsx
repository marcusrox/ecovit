import { useEffect, useRef, useState } from "react";
import { api, getAccountScope, type Account } from "../persistence/http";
import {
  adminActionNames,
  type AdminAction,
  type AdminAudit,
  type AdminEvent,
  type AdminOverview,
  type AdminProject,
  type AdminUser,
} from "../persistence/admin";
import { Icon } from "../ui/Icon";
import styles from "../ui/App.module.css";
import css from "./Admin.module.css";

const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "Não disponível";
const bytes = (value: number) =>
  `${(value / 1048576).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} MiB`;
const states: Record<string, string> = {
  active: "Ativa",
  blocked: "Bloqueada",
  deleting: "Em exclusão",
  trashed: "Na lixeira",
  purging: "Em eliminação",
};
const outcomes: Record<string, string> = {
  success: "Concluída",
  refused: "Recusada",
  failure: "Falha",
  unchanged: "Situação já aplicada",
  accepted: "Pedido aceito pelo provedor",
  uncertain: "Resultado incerto",
};
const categories: Record<string, string> = {
  auth: "Autenticação",
  mail: "Envio de códigos",
  save: "Salvamento",
  upload: "Upload",
  import: "Importação",
};
type Data = {
  overview?: AdminOverview;
  users?: AdminUser[];
  account?: AdminUser;
  projects?: AdminProject[];
  events?: AdminEvent[];
  audit?: AdminAudit[];
  hasMore?: boolean;
  projectLimit?: number;
  imageLimit?: number;
  checkedAt?: string;
  lastCleanup?: string | null;
  coverageSince?: string | null;
};

export function Admin({
  account,
  close,
}: {
  account: Account;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState("overview"),
    [days, setDays] = useState(7),
    [page, setPage] = useState(1);
  const [search, setSearch] = useState(""),
    [state, setState] = useState(""),
    [target, setTarget] = useState("");
  const [category, setCategory] = useState(""),
    [code, setCode] = useState(""),
    [actor, setActor] = useState(""),
    [auditTarget, setAuditTarget] = useState(""),
    [action, setAction] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const [revision, setRevision] = useState(0),
    [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [working, setWorking] = useState(false),
    [reason, setReason] = useState("");
  const [pending, setPending] = useState<{
    action: AdminAction;
    operationId: string;
    requestIssuedAt: string;
    reason?: string;
  } | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    const element = dialog.current,
      trigger = document.activeElement;
    element?.showModal();
    element?.querySelector<HTMLHeadingElement>("h2")?.focus();
    return () => {
      element?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected)
        trigger.focus();
    };
  }, []);
  useEffect(() => {
    let active = true;
    const version = ++generation.current;
    setData(null);
    setError("");
    const query = new URLSearchParams({
      days: String(days),
      page: String(page),
    });
    let endpoint = tab;
    if (tab === "users") {
      query.set("search", search);
      query.set("state", state);
      if (target) endpoint = `users/${target}`;
    }
    if (tab === "operation") {
      query.set("category", category);
      query.set("code", code);
    }
    if (tab === "audit") {
      query.set("actor", actor);
      query.set("target", auditTarget);
      query.set("action", action);
      if (from)
        query.set("from", new Date(`${from}T00:00:00-03:00`).toISOString());
      if (to)
        query.set("to", new Date(`${to}T23:59:59.999-03:00`).toISOString());
    }
    void api<
      AdminOverview &
        Data & { items?: AdminUser[] | AdminEvent[] | AdminAudit[] }
    >(`/admin/${endpoint}?${query}`, { account: account.id })
      .then((result) => {
        if (
          !active ||
          version !== generation.current ||
          getAccountScope() !== account.id
        )
          return;
        setData(
          tab === "overview"
            ? { overview: result }
            : tab === "users" && !target
              ? { users: result.items as AdminUser[], hasMore: result.hasMore }
              : tab === "operation"
                ? { ...result, events: result.items as AdminEvent[] }
                : tab === "audit"
                  ? {
                      audit: result.items as AdminAudit[],
                      hasMore: result.hasMore,
                    }
                  : result,
        );
      })
      .catch((failure: Error) => {
        if (active && version === generation.current) setError(failure.message);
      });
    return () => {
      active = false;
    };
  }, [
    account.id,
    tab,
    days,
    page,
    search,
    state,
    target,
    category,
    code,
    actor,
    auditTarget,
    action,
    from,
    to,
    revision,
  ]);
  async function apply() {
    if (!pending || !target) return;
    const input = { ...pending, reason: pending.reason ?? reason.trim() };
    setPending(input);
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const result = await api<{ outcome: string }>(
        `/admin/users/${target}/actions`,
        { method: "POST", account: account.id, body: input },
      );
      if (getAccountScope() !== account.id) return;
      setMessage(
        outcomes[result.outcome] ??
          "Resultado não reconhecido. Atualize os dados.",
      );
      setPending(null);
      setReason("");
      setRevision((value) => value + 1);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setWorking(false);
    }
  }
  function navigate(next: string) {
    setTab(next);
    setPage(1);
    setTarget("");
    setPending(null);
    setMessage("");
  }
  const overview = data?.overview,
    user = data?.account;
  return (
    <dialog
      ref={dialog}
      className={`${styles.modal} ${css.dialog}`}
      aria-labelledby="admin-title"
      onKeyDown={(event) => event.stopPropagation()}
      onCancel={(event) => {
        event.preventDefault();
        if (!working) close();
      }}
    >
      <header className={css.header}>
        <div>
          <span className={styles.eyebrow}>ECOVIT</span>
          <h2 id="admin-title" tabIndex={-1}>
            Administração
          </h2>
          <p>{account.email}</p>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Fechar administração"
          disabled={working}
          onClick={close}
        >
          <Icon name="close" />
        </button>
      </header>
      <nav className={css.tabs} aria-label="Administração">
        {[
          ["overview", "Visão geral"],
          ["users", "Usuários"],
          ["operation", "Operação"],
          ["audit", "Auditoria"],
        ].map(([key, label]) => (
          <button
            key={key}
            disabled={working || !!pending}
            aria-pressed={tab === key}
            onClick={() => navigate(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className={css.body}>
        <div className={css.filters}>
          {(tab === "overview" || tab === "operation") && (
            <label>
              Período
              <select
                disabled={working}
                value={days}
                onChange={(event) => {
                  setDays(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value={7}>Últimos 7 dias</option>
                <option value={30}>Últimos 30 dias</option>
              </select>
            </label>
          )}
          {tab === "users" && !target && (
            <>
              <label>
                Buscar e-mail
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  maxLength={254}
                />
              </label>
              <label>
                Situação
                <select
                  value={state}
                  onChange={(event) => {
                    setState(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Todas</option>
                  {Object.entries(states)
                    .slice(0, 3)
                    .map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                </select>
              </label>
            </>
          )}
          {tab === "operation" && (
            <>
              <label>
                Categoria
                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Todas</option>
                  {Object.entries(categories).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Código técnico
                <input
                  maxLength={64}
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value);
                    setPage(1);
                  }}
                />
              </label>
            </>
          )}
          {tab === "audit" && (
            <>
              <label>
                Administrador (UUID)
                <input
                  value={actor}
                  onChange={(event) => {
                    setActor(event.target.value);
                    setPage(1);
                  }}
                />
              </label>
              <label>
                Conta-alvo (UUID)
                <input
                  value={auditTarget}
                  onChange={(event) => {
                    setAuditTarget(event.target.value);
                    setPage(1);
                  }}
                />
              </label>
              <label>
                Ação
                <select
                  value={action}
                  onChange={(event) => {
                    setAction(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Todas</option>
                  {Object.entries(adminActionNames).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                De
                <input
                  type="date"
                  value={from}
                  onChange={(event) => {
                    setFrom(event.target.value);
                    setPage(1);
                  }}
                />
              </label>
              <label>
                Até
                <input
                  type="date"
                  value={to}
                  onChange={(event) => {
                    setTo(event.target.value);
                    setPage(1);
                  }}
                />
              </label>
            </>
          )}
          <button
            disabled={working}
            onClick={() => setRevision((value) => value + 1)}
          >
            Atualizar
          </button>
        </div>
        {error && (
          <p role="alert" className={styles.errorText}>
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        {!data && !error && <p role="status">Consultando administração…</p>}
        {overview && (
          <>
            <p>
              Atualizado em {date(overview.updated_at)} · Horários de São Paulo.
            </p>
            <div className={css.metrics}>
              {[
                ["Contas existentes", overview.accounts],
                ["Contas ativas", overview.active_accounts],
                ["Contas bloqueadas", overview.blocked_accounts],
                ["Contas em exclusão", overview.deleting_accounts],
                ["Novos cadastros no período", overview.new_accounts],
                ["Usuários ativos no período", overview.active_users],
                ["Projetos fora da lixeira", overview.projects],
                [
                  "Projetos na lixeira / em eliminação",
                  overview.trashed_projects,
                ],
                [
                  "Armazenamento contabilizado nas cotas",
                  bytes(overview.bytes),
                ],
              ].map(([label, value]) => (
                <section key={label}>
                  <h3>{label}</h3>
                  <strong>{value}</strong>
                </section>
              ))}
            </div>
            <p>
              Atividade registrada desde {date(overview.coverage_since)}.{" "}
              {overview.coverage_partial
                ? "Cobertura parcial do período selecionado."
                : ""}
            </p>
            <p>
              Ativo: abriu ou alterou um projeto com sucesso. Totais atuais não
              variam com o período. Contas eliminadas não entram nas métricas;
              armazenamento não representa o disco total do servidor.
            </p>
          </>
        )}
        {data?.users && (
          <div className={css.table}>
            <table>
              <caption>Contas cadastradas</caption>
              <thead>
                <tr>
                  {[
                    "E-mail",
                    "Perfil",
                    "Situação",
                    "Cadastro",
                    "Última atividade",
                    "Projetos",
                    "Uso de imagens",
                    "Detalhe",
                  ].map((text) => (
                    <th key={text}>{text}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.users.map((item) => (
                  <tr key={item.id}>
                    <td>{item.email}</td>
                    <td>
                      {item.permanent
                        ? "Administrador permanente"
                        : item.admin
                          ? "Administrador"
                          : "Usuário"}
                    </td>
                    <td>{states[item.state]}</td>
                    <td>{date(item.created_at)}</td>
                    <td>{date(item.last_activity)}</td>
                    <td>{item.projects}</td>
                    <td>{bytes(item.bytes)}</td>
                    <td>
                      <button
                        onClick={() => {
                          setTarget(item.id);
                          setPage(1);
                        }}
                      >
                        Consultar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.users.length && <p>Nenhuma conta encontrada.</p>}
          </div>
        )}
        {user && (
          <>
            <button
              disabled={working || !!pending}
              onClick={() => {
                setTarget("");
                setPage(1);
                setMessage("");
              }}
            >
              Voltar aos usuários
            </button>
            <h3>{user.email}</h3>
            <p>Identificador: {user.id}</p>
            <p>
              {states[user.state]} ·{" "}
              {user.permanent
                ? "Administrador permanente"
                : user.admin
                  ? "Administrador"
                  : "Usuário"}{" "}
              · Cadastro: {date(user.created_at)} · Última atividade:{" "}
              {date(user.last_activity)}
            </p>
            <p>
              Projetos: {user.projects} / {data.projectLimit} · Imagens:{" "}
              {bytes(user.bytes)} / {bytes(data.imageLimit ?? 0)}
            </p>
            {user.permanent && (
              <p>Privilégio permanente definido na configuração do servidor.</p>
            )}
            {user.id !== account.id && user.state !== "deleting" && (
              <div className={css.actions}>
                {(user.admin
                  ? user.permanent
                    ? []
                    : ["revoke"]
                  : user.state === "blocked"
                    ? ["unblock", "sessions"]
                    : ["block", "sessions", "grant"]
                ).map((name) => (
                  <button
                    key={name}
                    disabled={working || !!pending}
                    onClick={() => {
                      setPending({
                        action: name as AdminAction,
                        operationId: crypto.randomUUID(),
                        requestIssuedAt: new Date().toISOString(),
                      });
                      setReason("");
                      setMessage("");
                    }}
                  >
                    {adminActionNames[name as AdminAction]}
                  </button>
                ))}
              </div>
            )}
            {pending && (
              <form
                className={css.confirm}
                onSubmit={(event) => {
                  event.preventDefault();
                  void apply();
                }}
              >
                <h3>Confirmar: {adminActionNames[pending.action]}</h3>
                <p>
                  Conta: {user.email}.{" "}
                  {pending.action === "revoke"
                    ? "A conta e os projetos serão preservados e todas as sessões serão encerradas."
                    : pending.action === "block"
                      ? "O acesso será bloqueado e as sessões serão encerradas."
                      : "Confira o alvo antes de confirmar."}
                </p>
                <label>
                  Motivo (sem segredos ou dados pessoais de terceiros)
                  <textarea
                    required
                    minLength={3}
                    maxLength={300}
                    value={reason}
                    disabled={working || pending.reason !== undefined}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
                <div className={css.actions}>
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => {
                      setPending(null);
                      setReason("");
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={working || reason.trim().length < 3}
                  >
                    {working
                      ? "Aguardando confirmação…"
                      : pending.reason !== undefined
                        ? "Conferir / repetir mesma operação"
                        : "Confirmar ação"}
                  </button>
                </div>
                <p>
                  Em falha de comunicação, a ação pode ter sido aplicada.
                  Repetir conserva o identificador da operação.
                </p>
              </form>
            )}
            <div className={css.table}>
              <table>
                <caption>Metadados dos projetos</caption>
                <thead>
                  <tr>
                    {[
                      "Projeto / identificador",
                      "Situação",
                      "Criado",
                      "Alterado",
                      "Revisão",
                      "Imagens contabilizadas",
                    ].map((text) => (
                      <th key={text}>{text}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.projects?.map((project) => (
                    <tr key={project.id}>
                      <td>
                        {project.name}
                        <br />
                        {project.id}
                      </td>
                      <td>{states[project.state]}</td>
                      <td>{date(project.created_at)}</td>
                      <td>{date(project.updated_at)}</td>
                      <td>{project.revision}</td>
                      <td>{bytes(project.bytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.projects?.length && <p>Nenhum projeto nesta página.</p>}
            </div>
          </>
        )}
        {data?.events && (
          <>
            <p>
              API: disponível · Banco: acesso confirmado em{" "}
              {date(data.checkedAt)}.
            </p>
            <p>
              Última limpeza concluída: {date(data.lastCleanup)}. Sem registro
              não comprova execução.
            </p>
            <p>
              Coleta desde {date(data.coverageSince)}. Períodos anteriores não
              têm cobertura. Aceitação do provedor não comprova entrega do
              e-mail.
            </p>
            <div className={css.table}>
              <table>
                <caption>Ocorrências técnicas</caption>
                <thead>
                  <tr>
                    {[
                      "Horário",
                      "Categoria",
                      "Código",
                      "Descrição",
                      "Resultado",
                      "Requisição",
                    ].map((text) => (
                      <th key={text}>{text}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((event, index) => (
                    <tr key={index}>
                      <td>{date(event.created_at)}</td>
                      <td>{categories[event.category]}</td>
                      <td>{event.code}</td>
                      <td>
                        {event.outcome === "accepted"
                          ? "O provedor aceitou o pedido; entrega não confirmada."
                          : event.outcome === "uncertain"
                            ? "O envio pode ter ocorrido; aguarde antes de solicitar outro código."
                            : event.outcome === "refused"
                              ? "Solicitação recusada pelas regras de acesso, formato ou limites."
                              : "Não foi possível concluir a operação. Use o código e a requisição para diagnóstico."}
                      </td>
                      <td>{outcomes[event.outcome]}</td>
                      <td>{event.request_id ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.events.length && (
                <p>Nenhuma ocorrência encontrada na cobertura disponível.</p>
              )}
            </div>
          </>
        )}
        {data?.audit && (
          <>
            <p>
              Retenção de até 180 dias. Excluir uma conta também elimina os
              registros em que ela seja responsável ou alvo.
            </p>
            <div className={css.table}>
              <table>
                <caption>Intervenções administrativas</caption>
                <thead>
                  <tr>
                    {[
                      "Horário",
                      "Responsável",
                      "Conta-alvo",
                      "Ação",
                      "Motivo",
                      "Resultado",
                    ].map((text) => (
                      <th key={text}>{text}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.audit.map((item) => (
                    <tr key={item.id}>
                      <td>{date(item.created_at)}</td>
                      <td>
                        {item.actor_email ??
                          (item.source === "server"
                            ? "Procedimento no servidor"
                            : "Sistema")}
                        <br />
                        {item.actor_id}
                      </td>
                      <td>
                        {item.target_email}
                        <br />
                        {item.target_id}
                      </td>
                      <td>
                        {adminActionNames[
                          item.action as AdminAction | "recover"
                        ] ?? item.action}
                      </td>
                      <td>{item.reason}</td>
                      <td>{outcomes[item.outcome]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.audit.length && <p>Nenhuma intervenção encontrada.</p>}
            </div>
          </>
        )}
        {data && tab !== "overview" && (
          <div className={css.actions}>
            <button
              disabled={page === 1 || working || !!pending}
              onClick={() => setPage((value) => value - 1)}
            >
              Anterior
            </button>
            <span>Página {page}</span>
            <button
              disabled={!data.hasMore || working || !!pending}
              onClick={() => setPage((value) => value + 1)}
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
