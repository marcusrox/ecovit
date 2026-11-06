import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createProject } from "../src/domain/project";
import { dehydrate } from "../src/persistence/remote-document";
import {
  setSession,
  RemoteError,
  api,
  bootstrap,
  currentSession,
  setAccountScope,
  getAccountScope,
} from "../src/persistence/http";
import {
  loadProject,
  projectListing,
  resetRemote,
  saveProject,
  projectAction,
  pendingCopyName,
  remoteUsage,
} from "../src/persistence/remote";

const fetcher = vi.fn<typeof fetch>();
const account = { id: crypto.randomUUID(), email: "test@example.com" };
const answer = (body: unknown, status = 200) =>
  new Response(
    JSON.stringify(
      status >= 400
        ? { code: "test_error", message: "Teste", ...(body as object) }
        : body,
    ),
    { status },
  );
const receipt = (id: string, operationId: string, revision: string) => ({
  projectId: id,
  operationId,
  revision,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
const card = (id: string, revision: string) => ({
  id,
  revision,
  name: "Projeto",
  walls: 0,
  state: "active",
  compatible: true,
  updatedAt: new Date().toISOString(),
  purgeAfter: null,
});
const quota = {
  bytes: 0,
  projects: 0,
  projectLimit: 20,
  imageLimit: 524288000,
};
const confirm =
  (revision: string): typeof fetch =>
  async (_url, options) => {
    const body = JSON.parse(options?.body as string);
    return answer(receipt(body.doc.project.id, body.operationId, revision));
  };
beforeEach(() => {
  resetRemote();
  setAccountScope(account.id);
  fetcher.mockReset();
  vi.stubGlobal("fetch", fetcher);
  setSession({
    account,
    csrf: "test-csrf",
    serverTime: new Date().toISOString(),
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  setAccountScope(null);
});

it("faz uma única chamada por save e a listagem não avança a revisão do documento aberto", async () => {
  const doc = createProject("Aberto", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  fetcher.mockImplementationOnce(confirm("1"));
  await saveProject(doc);
  expect(fetcher).toHaveBeenCalledTimes(1);
  fetcher.mockResolvedValueOnce(
    answer({ projects: [card(doc.project.id, "9")], usage: quota }),
  );
  await projectListing();
  fetcher.mockImplementationOnce(confirm("2"));
  await saveProject(doc);
  const request = fetcher.mock.calls[2];
  expect(request[1]?.method).toBe("PUT");
  expect(JSON.parse(request[1]?.body as string).expectedRevision).toBe("1");
  expect(fetcher).toHaveBeenCalledTimes(3);
});

it("resposta perdida consulta recibo e recupera sem repetir a mutação", async () => {
  const doc = createProject("Incerto", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  fetcher.mockRejectedValueOnce(new TypeError("connection reset"));
  await expect(saveProject(doc)).rejects.toMatchObject({ code: "network" });
  const body = JSON.parse(fetcher.mock.calls[0][1]?.body as string);
  fetcher.mockResolvedValueOnce(
    answer(receipt(doc.project.id, body.operationId, "1")),
  );
  fetcher.mockResolvedValueOnce(answer({ revision: "1", state: "active" }));
  await saveProject(doc);
  expect(fetcher.mock.calls[1][0]).toBe(`/api/operations/${body.operationId}`);
  expect(
    fetcher.mock.calls.filter(([, options]) => options?.method === "POST"),
  ).toHaveLength(1);
});

it("recibo ausente repete exatamente o ID, instante e conteúdo originais", async () => {
  const doc = createProject("Repetir", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  fetcher.mockResolvedValueOnce(answer({ code: "unavailable" }, 503));
  await expect(saveProject(doc)).rejects.toBeInstanceOf(RemoteError);
  const first = fetcher.mock.calls[0][1]?.body;
  fetcher.mockResolvedValueOnce(answer({ code: "operation_unknown" }, 404));
  fetcher.mockImplementationOnce(confirm("1"));
  fetcher.mockResolvedValueOnce(answer({ revision: "1", state: "active" }));
  await saveProject({
    ...doc,
    project: {
      ...doc.project,
      name: "Não pode substituir o candidato pendente",
    },
  });
  expect(fetcher.mock.calls[2][1]?.body).toBe(first);
  expect(fetcher.mock.calls[3][0]).toBe(`/api/projects/${doc.project.id}`);
});

it("reconciliação detecta edição posterior e nunca libera candidato obsoleto", async () => {
  const doc = createProject("Conflito", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  fetcher.mockRejectedValueOnce(new Error("lost"));
  await expect(saveProject(doc)).rejects.toBeInstanceOf(RemoteError);
  fetcher.mockResolvedValueOnce(
    answer(
      receipt(
        doc.project.id,
        JSON.parse(fetcher.mock.calls[0][1]?.body as string).operationId,
        "1",
      ),
    ),
  );
  fetcher.mockResolvedValueOnce(answer({ revision: "2", state: "active" }));
  await expect(saveProject(doc)).rejects.toMatchObject({
    status: 409,
    code: "revision_conflict",
  });
});

it("abre com uma leitura e impede retomar trabalho em outra conta", async () => {
  const doc = createProject("Privado", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  fetcher.mockResolvedValueOnce(
    answer({
      remoteVersion: 1,
      doc: dehydrate(doc, {}),
      revision: "1",
      state: "active",
    }),
  );
  await loadProject(doc.project.id);
  expect(fetcher).toHaveBeenCalledTimes(1);
  setSession({
    account: { id: crypto.randomUUID(), email: "other@example.com" },
    csrf: "new",
    serverTime: new Date().toISOString(),
  });
  await expect(saveProject(doc)).rejects.toMatchObject({
    code: "account_changed",
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it.each([null, { revision: "1" }])(
  "confirmação incompleta permanece incerta e só recibo válido libera edição: %s",
  async (invalid) => {
    const doc = createProject("Resposta truncada", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify(invalid)));
    await expect(saveProject(doc)).rejects.toMatchObject({
      code: "invalid_response",
      uncertain: true,
    });
    const original = JSON.parse(fetcher.mock.calls[0][1]?.body as string);
    fetcher.mockResolvedValueOnce(
      answer(receipt(doc.project.id, original.operationId, "1")),
    );
    fetcher.mockResolvedValueOnce(answer({ revision: "1", state: "active" }));
    await expect(saveProject(doc)).resolves.toMatchObject({
      operationId: original.operationId,
    });
    expect(
      fetcher.mock.calls.filter(([, options]) => options?.method === "POST"),
    ).toHaveLength(1);
  },
);

it("recibo ausente seguido de POST repetido também confere a revisão atual antes de liberar", async () => {
  const doc = createProject("Corrida na confirmação", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  fetcher.mockRejectedValueOnce(new Error("network"));
  await expect(saveProject(doc)).rejects.toBeInstanceOf(RemoteError);
  const original = JSON.parse(fetcher.mock.calls[0][1]?.body as string);
  fetcher.mockResolvedValueOnce(answer({ code: "operation_unknown" }, 404));
  fetcher.mockResolvedValueOnce(
    answer(receipt(doc.project.id, original.operationId, "1")),
  );
  fetcher.mockResolvedValueOnce(answer({ revision: "2", state: "active" }));
  await expect(saveProject(doc)).rejects.toMatchObject({
    code: "revision_conflict",
    uncertain: false,
  });
  expect(fetcher.mock.calls[2][1]?.body).toBe(fetcher.mock.calls[0][1]?.body);
});

it("erro de repetição não converte uma tentativa ainda incerta em rejeição conhecida", async () => {
  const doc = createProject("Ainda em processamento", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  fetcher.mockRejectedValueOnce(new Error("network"));
  await expect(saveProject(doc)).rejects.toMatchObject({ uncertain: true });
  const original = JSON.parse(fetcher.mock.calls[0][1]?.body as string);
  fetcher.mockResolvedValueOnce(answer({ code: "operation_unknown" }, 404));
  fetcher.mockResolvedValueOnce(answer({ code: "rate_limit" }, 429));
  await expect(saveProject(doc)).rejects.toMatchObject({
    status: 429,
    uncertain: true,
  });
  fetcher.mockResolvedValueOnce(
    answer(receipt(doc.project.id, original.operationId, "1")),
  );
  fetcher.mockResolvedValueOnce(answer({ revision: "1", state: "active" }));
  await expect(saveProject(doc)).resolves.toMatchObject({
    operationId: original.operationId,
  });
  expect(fetcher.mock.calls[2][1]?.body).toBe(fetcher.mock.calls[0][1]?.body);
});

it("cópia incerta conserva ID, nome e instante mesmo se a repetição encontrar cota", async () => {
  const id = crypto.randomUUID();
  fetcher.mockResolvedValueOnce(
    answer({ projects: [card(id, "1")], usage: quota }),
  );
  await projectListing();
  fetcher.mockRejectedValueOnce(new Error("network"));
  await expect(
    projectAction(id, "duplicate", "Primeira cópia"),
  ).rejects.toMatchObject({ uncertain: true });
  const originalBody = fetcher.mock.calls[1][1]?.body as string,
    original = JSON.parse(originalBody);
  await expect(
    projectAction(id, "duplicate", "Outro nome"),
  ).rejects.toMatchObject({ code: "operation_pending" });
  expect(fetcher).toHaveBeenCalledTimes(2);
  fetcher.mockResolvedValueOnce(answer({ code: "project_quota" }, 422));
  await expect(
    projectAction(id, "duplicate", "Primeira cópia"),
  ).rejects.toMatchObject({ status: 422 });
  expect(pendingCopyName(id)).toBe("Primeira cópia");
  fetcher.mockResolvedValueOnce(
    answer(receipt(original.newId, original.operationId, "1")),
  );
  await expect(
    projectAction(id, "duplicate", "Primeira cópia"),
  ).resolves.toMatchObject({ projectId: original.newId });
  expect(
    fetcher.mock.calls.slice(1).map(([, options]) => options?.body),
  ).toEqual([originalBody, originalBody, originalBody]);
  expect(pendingCopyName(id)).toBeUndefined();
});

it("escopo da página não muda quando outra conta está no cookie durante reentrada", async () => {
  const other = { id: crypto.randomUUID(), email: "other@example.com" };
  setSession({
    account: other,
    csrf: "another-csrf",
    serverTime: new Date().toISOString(),
  });
  fetcher.mockResolvedValueOnce(answer({ code: "account_changed" }, 409));
  await expect(api("/projects")).rejects.toMatchObject({
    code: "account_changed",
  });
  expect(
    (fetcher.mock.calls[0][1]?.headers as Record<string, string>)[
      "X-Ecovit-Account"
    ],
  ).toBe(account.id);
  await expect(projectListing()).rejects.toMatchObject({
    code: "account_changed",
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(getAccountScope()).toBe(account.id);
});

it("resposta antiga de bootstrap não substitui sessão recém-autenticada", async () => {
  let resolve!: (response: Response) => void;
  fetcher.mockReturnValueOnce(
    new Promise<Response>((done) => {
      resolve = done;
    }),
  );
  const loading = bootstrap();
  const other = { id: crypto.randomUUID(), email: "new@example.com" };
  setSession({
    account: other,
    csrf: "verified-session-csrf-with-32-characters",
    serverTime: new Date().toISOString(),
  });
  setAccountScope(other.id);
  resolve(
    answer({
      account,
      csrf: "old-session-csrf-with-32-characters",
      serverTime: new Date().toISOString(),
    }),
  );
  expect((await loading).account?.id).toBe(other.id);
  expect(currentSession().account?.id).toBe(other.id);
  expect(getAccountScope()).toBe(other.id);
});

it("acesso direto usa o CSRF do bootstrap apenas na entrada inicial", async () => {
  const flow = {
    account: null,
    csrf: "local-flow-csrf-with-over-32-characters",
    serverTime: new Date().toISOString(),
    devLogin: true,
  };
  const local = {
    account,
    csrf: "local-session-csrf-with-over-32-characters",
    serverTime: flow.serverTime,
  };
  fetcher.mockResolvedValueOnce(answer(flow));
  expect((await bootstrap()).account).toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(1);

  fetcher
    .mockResolvedValueOnce(answer(flow))
    .mockResolvedValueOnce(answer(local));
  await expect(bootstrap({ allowDevLogin: true })).resolves.toMatchObject({
    account,
    csrf: local.csrf,
  });
  expect(fetcher).toHaveBeenLastCalledWith(
    "/api/auth/dev-login",
    expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "X-CSRF-Token": flow.csrf }),
    }),
  );
});

it("lista atrasada de outra conta não substitui uso ou revisões do contexto atual", async () => {
  let resolve!: (response: Response) => void;
  fetcher.mockReturnValueOnce(
    new Promise<Response>((done) => {
      resolve = done;
    }),
  );
  const loading = projectListing();
  const before = remoteUsage();
  const other = { id: crypto.randomUUID(), email: "new@example.com" };
  setSession({
    account: other,
    csrf: "new-session",
    serverTime: new Date().toISOString(),
  });
  setAccountScope(other.id);
  resolve(
    answer({
      projects: [card(crypto.randomUUID(), "7")],
      usage: { ...quota, bytes: 12345 },
    }),
  );
  await expect(loading).rejects.toMatchObject({ code: "context_changed" });
  expect(remoteUsage()).toBe(before);
});

it("documento atrasado não é aplicado depois de trocar explicitamente a conta", async () => {
  const doc = createProject("Da conta anterior", {
    length: 2500,
    width: 1250,
    height: 700,
  });
  let resolve!: (response: Response) => void;
  fetcher.mockReturnValueOnce(
    new Promise<Response>((done) => {
      resolve = done;
    }),
  );
  const loading = loadProject(doc.project.id);
  const other = { id: crypto.randomUUID(), email: "new@example.com" };
  setSession({
    account: other,
    csrf: "new-session",
    serverTime: new Date().toISOString(),
  });
  setAccountScope(other.id);
  resolve(
    answer({
      remoteVersion: 1,
      doc: dehydrate(doc, {}),
      revision: "1",
      state: "active",
    }),
  );
  await expect(loading).rejects.toMatchObject({ code: "context_changed" });
});
