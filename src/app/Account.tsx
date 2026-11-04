import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  bootstrap,
  currentSession,
  setAccountScope,
  loginCode,
  RemoteError,
  setSession,
  verifyCode,
  type Account,
} from "../persistence/http";
import {
  loadStoredProject,
  projectAction,
  projectListing,
  remoteUsage,
  resetRemote,
  type ProjectCard,
} from "../persistence/remote";
import { download } from "../persistence/files";
import { useStore } from "../state/store";
import { Icon } from "../ui/Icon";
import styles from "../ui/App.module.css";

const AccountContext = createContext<{
  account: Account;
  open: () => void;
} | null>(null);
export function AccountButton() {
  const context = useContext(AccountContext);
  if (!context) return null;
  return (
    <button
      className={styles.iconText}
      title={context.account.email}
      onClick={context.open}
    >
      <Icon name="readonly" /> Conta
    </button>
  );
}
function Login({
  expected,
  done,
}: {
  expected?: Account;
  done: (account: Account) => void;
}) {
  const [email, setEmail] = useState(expected?.email ?? "");
  const [challenge, setChallenge] = useState("");
  const [code, setCode] = useState("");
  const [waitUntil, setWaitUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const update = () =>
      setRemaining(Math.max(0, Math.ceil((waitUntil - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [waitUntil]);
  async function send() {
    setWorking(true);
    setError("");
    try {
      const result = await loginCode(email);
      setChallenge(result.id);
      setCode("");
      setWaitUntil(Date.now() + result.retryAfter * 1000);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setWorking(false);
    }
  }
  async function enter() {
    setWorking(true);
    setError("");
    try {
      const result = await verifyCode(challenge, code, expected?.id);
      if (result.account) done(result.account);
    } catch (failure) {
      if (failure instanceof RemoteError && failure.uncertain) {
        try {
          const recovered = await bootstrap();
          if (
            recovered.account &&
            (!expected || recovered.account.id === expected.id)
          ) {
            done(recovered.account);
            return;
          }
        } catch {
          /* Keep the candidate and let the user retry. */
        }
      }
      setError((failure as Error).message);
    } finally {
      setWorking(false);
    }
  }
  return (
    <div className={styles.accountForm}>
      <h1>{expected ? "Entre novamente" : "Entrar no Ecovit"}</h1>
      <p>
        {expected
          ? "Seu desenho continua nesta página. Entre na mesma conta para retomar."
          : "Receba um código por e-mail. Seus projetos ficam privados e salvos na sua conta."}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void (challenge ? enter() : send());
        }}
      >
        <label className={styles.field}>
          E-mail
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            disabled={working || !!expected || !!challenge}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        {challenge && (
          <>
            <p>Código solicitado. Confira seu e-mail e a pasta de spam.</p>
            <label className={styles.field}>
              Código de acesso
              <input
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                required
                maxLength={6}
                value={code}
                disabled={working}
                onChange={(event) => setCode(event.target.value)}
              />
            </label>
          </>
        )}
        {error && (
          <p role="alert" className={styles.errorText}>
            {error}
          </p>
        )}
        <div className={styles.accountActions}>
          <button className={styles.primary} disabled={working} type="submit">
            {working ? "Aguarde…" : challenge ? "Entrar" : "Enviar código"}
          </button>
          {challenge && (
            <button
              type="button"
              disabled={working || remaining > 0}
              onClick={() => void send()}
            >
              {remaining ? `Reenviar em ${remaining}s` : "Reenviar código"}
            </button>
          )}
          {challenge && !expected && (
            <button
              type="button"
              disabled={working}
              onClick={() => {
                setChallenge("");
                setCode("");
              }}
            >
              Alterar e-mail
            </button>
          )}
        </div>
      </form>
      {!expected && (
        <p className={styles.help}>
          Projetos da versão anterior precisam ser exportados em .ecovit antes
          da atualização e importados após entrar.
        </p>
      )}
    </div>
  );
}
function AccountPanel({
  account,
  close,
  exited,
}: {
  account: Account;
  close: () => void;
  exited: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [usage, setUsage] = useState(remoteUsage());
  const [listingState, setListingState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState("");
  const [code, setCode] = useState("");
  const [proof, setProof] = useState<{ proof: string; receipt: string } | null>(
    null,
  );
  const [deletionPending, setDeletionPending] = useState(false);
  async function refresh() {
    setListingState("loading");
    try {
      const result = await projectListing();
      setProjects(result.projects);
      setUsage(result.usage);
      setListingState("ready");
    } catch (failure) {
      setListingState("error");
      throw failure;
    }
  }
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    void refresh().catch((failure) => setError(failure.message));
    return () => element?.close();
  }, []);
  async function act(action: () => Promise<void>) {
    setError("");
    setWorking(true);
    try {
      await action();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setWorking(false);
    }
  }
  function resolveEditor() {
    const state = useStore.getState();
    if (state.busy) throw new Error("Aguarde a operação do projeto.");
    if (
      state.doc &&
      state.saved !== "saved" &&
      !window.confirm(
        "Há trabalho não salvo. Baixe sua versão antes de sair. Deseja descartar a memória? Uma gravação pendente pode já ter sido confirmada.",
      )
    )
      return false;
    state.close();
    resetRemote();
    return true;
  }
  return (
    <dialog
      ref={dialog}
      className={`${styles.modal} ${styles.accountDialog}`}
      aria-labelledby="account-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!working) close();
      }}
    >
      <h2 id="account-title">Sua conta</h2>
      <p>{account.email}</p>
      {listingState === "ready" ? (
        <p>
          {usage.projects} de {usage.projectLimit} projetos ·{" "}
          {(usage.bytes / 1048576).toFixed(1)} de{" "}
          {(usage.imageLimit / 1048576).toFixed(0)} MiB de imagens
        </p>
      ) : (
        <p aria-live="polite">
          {listingState === "loading"
            ? "Consultando os dados da conta…"
            : "Dados da conta indisponíveis. Tente atualizar."}
        </p>
      )}
      <button
        disabled={working || listingState === "loading"}
        onClick={() => void act(refresh)}
      >
        Atualizar dados da conta
      </button>
      <h3>Lixeira</h3>
      <p>
        Retenção de 30 dias. Projetos e imagens continuam contando nas cotas até
        a eliminação.
      </p>
      <div className={styles.trashList}>
        {projects
          .filter((project) => project.state === "trashed")
          .map((project) => (
            <section key={project.id} className={styles.trashCard}>
              <strong>{project.name}</strong>
              <span>
                Até{" "}
                {project.purgeAfter
                  ? new Date(project.purgeAfter).toLocaleDateString("pt-BR")
                  : "—"}
              </span>
              <div className={styles.accountActions}>
                <button
                  disabled={working || listingState !== "ready"}
                  onClick={() =>
                    void act(async () => {
                      await projectAction(project.id, "restore");
                      await refresh();
                      window.dispatchEvent(
                        new Event("ecovit:projects-changed"),
                      );
                    })
                  }
                >
                  Restaurar
                </button>
                <button
                  disabled={working || listingState !== "ready"}
                  onClick={() =>
                    void act(async () => {
                      download(await loadStoredProject(project.id));
                    })
                  }
                >
                  Baixar .ecovit
                </button>
                <button
                  disabled={working || listingState !== "ready"}
                  onClick={() =>
                    void act(async () => {
                      if (
                        window.confirm(
                          `Excluir definitivamente ${project.name}? Não será possível restaurar.`,
                        )
                      ) {
                        await projectAction(project.id, "purge");
                        await refresh();
                      }
                    })
                  }
                >
                  Excluir definitivamente
                </button>
              </div>
            </section>
          ))}
      </div>
      {listingState === "ready" &&
        !projects.some((project) => project.state === "trashed") && (
          <p>Lixeira vazia.</p>
        )}
      <hr />
      <h3>Excluir minha conta</h3>
      <p>
        A exclusão encerra todas as sessões imediatamente e elimina projetos,
        imagens e lixeira em até 24 horas, sem recuperação. Baixe os projetos
        que quiser manter antes de confirmar.
      </p>
      {!challenge && (
        <button
          disabled={working}
          onClick={() =>
            void act(async () => {
              if (useStore.getState().busy)
                throw new Error("Aguarde a operação atual.");
              const result = await loginCode(account.email, "delete");
              setChallenge(result.id);
            })
          }
        >
          Solicitar código para excluir conta
        </button>
      )}
      {challenge && !proof && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void act(async () => {
              const result = await verifyCode(challenge, code);
              if (result.deletion) setProof(result.deletion);
            });
          }}
        >
          <label className={styles.field}>
            Código de exclusão
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </label>
          <button disabled={working}>Verificar código de exclusão</button>
          <button
            type="button"
            disabled={working}
            onClick={() =>
              void act(async () => {
                const result = await loginCode(account.email, "delete");
                setChallenge(result.id);
                setCode("");
              })
            }
          >
            Solicitar outro código de exclusão
          </button>
        </form>
      )}
      {proof && (
        <button
          disabled={working}
          onClick={() =>
            void act(async () => {
              if (deletionPending) {
                const receipt = await api<{ accepted: boolean }>(
                  "/account/deletion-receipt",
                  {
                    method: "POST",
                    body: { receipt: proof.receipt },
                    reauth: false,
                  },
                );
                if (typeof receipt.accepted !== "boolean")
                  throw new RemoteError(
                    503,
                    "invalid_response",
                    "O recibo está incompleto. Confira novamente antes de concluir a exclusão.",
                  );
                if (!receipt.accepted) {
                  setDeletionPending(false);
                  throw new Error(
                    "Exclusão não confirmada. Você pode confirmar novamente com o mesmo comprovante enquanto estiver válido.",
                  );
                }
              } else {
                if (
                  !window.confirm(
                    "Confirmar a exclusão permanente da conta e de TODOS os projetos, inclusive lixeira?",
                  )
                )
                  return;
                if (!resolveEditor()) return;
                setDeletionPending(true);
                try {
                  const result = await api<{ accepted: boolean }>(
                    "/account/delete",
                    { method: "POST", body: proof, reauth: false },
                  );
                  if (result.accepted !== true)
                    throw new RemoteError(
                      503,
                      "invalid_response",
                      "Exclusão sem confirmação. Use Conferir exclusão solicitada.",
                    );
                } catch (failure) {
                  if (
                    failure instanceof RemoteError &&
                    failure.code === "deletion_proof"
                  ) {
                    setProof(null);
                    setChallenge("");
                    setCode("");
                    setDeletionPending(false);
                  }
                  throw failure;
                }
              }
              setSession({
                account: null,
                csrf: "",
                serverTime: new Date().toISOString(),
              });
              resetRemote();
              exited();
            })
          }
        >
          {deletionPending
            ? "Conferir exclusão solicitada"
            : "Confirmar exclusão de toda a conta"}
        </button>
      )}
      {error && (
        <p role="alert" className={styles.errorText}>
          {error}
        </p>
      )}
      <div className={styles.accountActions}>
        <button disabled={working} onClick={close}>
          Fechar
        </button>
        <button
          disabled={working || deletionPending}
          onClick={() =>
            void act(async () => {
              if (!resolveEditor()) return;
              try {
                const result = await api<{ ok: boolean }>("/logout", {
                  method: "POST",
                  reauth: false,
                });
                if (result.ok !== true)
                  throw new RemoteError(
                    503,
                    "invalid_response",
                    "Saída sem confirmação. Tente sair novamente.",
                  );
              } catch (failure) {
                if (
                  !(failure instanceof RemoteError) ||
                  ![401, 403].includes(failure.status) ||
                  (await bootstrap()).account
                )
                  throw failure;
              }
              setSession({
                account: null,
                csrf: "",
                serverTime: new Date().toISOString(),
              });
              exited();
            })
          }
        >
          Sair da conta
        </button>
      </div>
    </dialog>
  );
}
function Reauthenticate({
  account,
  done,
  close,
}: {
  account: Account;
  done: (account: Account) => void;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`${styles.modal} ${styles.accountDialog}`}
      aria-label="Sessão expirada"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <Login expected={account} done={done} />
      <button onClick={close}>Voltar ao desenho para baixar</button>
    </dialog>
  );
}
export function AccountShell({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [panel, setPanel] = useState(false);
  const hasDocument = useStore((state) => !!state.doc);
  async function start() {
    setError("");
    try {
      const next = await bootstrap();
      setAccountScope(next.account?.id ?? null);
      setAccount(next.account);
      setReady(true);
    } catch (failure) {
      setError((failure as Error).message);
    }
  }
  function entered(next: Account, resume: boolean) {
    setAccountScope(next.id);
    setAccount(next);
    setNeedsAuth(false);
    setExpired(false);
    if (resume) void useStore.getState().retry();
  }
  useEffect(() => {
    void start();
    const expire = () => {
      useStore.setState({ readonly: true });
      setNeedsAuth(true);
      setExpired(true);
    };
    window.addEventListener("ecovit:auth-required", expire);
    return () => window.removeEventListener("ecovit:auth-required", expire);
  }, []);
  if (!ready)
    return (
      <main className={styles.loginPage}>
        <p role="status">Conectando ao Ecovit…</p>
        {error && (
          <>
            <p role="alert">{error}</p>
            <button onClick={() => void start()}>
              Tentar conexão novamente
            </button>
          </>
        )}
      </main>
    );
  if (!account)
    return (
      <main className={styles.loginPage}>
        <Login
          done={(next) => {
            resetRemote();
            entered(next, false);
          }}
        />
      </main>
    );
  if (needsAuth && !hasDocument)
    return (
      <main className={styles.loginPage}>
        <Login expected={account} done={(next) => entered(next, true)} />
        <button
          onClick={() => {
            resetRemote();
            setAccountScope(null);
            setAccount(null);
            setNeedsAuth(false);
            setExpired(false);
          }}
        >
          Usar outro e-mail
        </button>
      </main>
    );
  return (
    <AccountContext.Provider
      value={{
        account,
        open: () => {
          if (needsAuth || currentSession().account?.id !== account.id) {
            useStore.setState({ readonly: true });
            setNeedsAuth(true);
            setExpired(true);
          } else setPanel(true);
        },
      }}
    >
      {children}
      {expired && (
        <Reauthenticate
          account={account}
          done={(next) => entered(next, true)}
          close={() => setExpired(false)}
        />
      )}
      {panel && (
        <AccountPanel
          account={account}
          close={() => setPanel(false)}
          exited={() => {
            setAccountScope(null);
            setPanel(false);
            setAccount(null);
            setNeedsAuth(false);
            setExpired(false);
            void bootstrap();
          }}
        />
      )}
    </AccountContext.Provider>
  );
}
