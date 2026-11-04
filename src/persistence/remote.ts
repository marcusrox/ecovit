import { type Project, withoutResult } from "../domain/project";
import {
  dehydrate,
  hydrate,
  images,
  resourceIds,
  type RemoteProject,
} from "./remote-document";
import {
  api,
  currentSession,
  getAccountScope,
  requireAccount,
  requestTime,
  RemoteError,
} from "./http";
import { validateProject, serializeFile } from "./files";

type Receipt = {
  projectId: string;
  revision: string;
  operationId: string;
  updatedAt?: string;
  createdAt?: string;
};
export type ProjectCard = {
  id: string;
  name: string;
  walls: number;
  updatedAt: string;
  compatible: boolean;
  revision: string;
  state: "active" | "trashed" | "purging";
  purgeAfter: string | null;
};
export type Usage = {
  projects: number;
  bytes: number;
  projectLimit: number;
  imageLimit: number;
};
const revisions = new Map<string, { revision: string; account: string }>();
const listedRevisions = new Map<
  string,
  { revision: string; account: string }
>();
const resources = new Map<string, { id: string; uploaded: boolean }>();
type Pending = {
  account: string;
  method: string;
  body: {
    operationId: string;
    requestIssuedAt: string;
    expectedRevision?: string;
    doc: RemoteProject;
    sourceFile?: string;
  };
  uploads: { id: string; data: string; cacheKey: string }[];
  sent: boolean;
  uncertain: boolean;
};
const pending = new Map<string, Pending>();
let usage: Usage = {
  projects: 0,
  bytes: 0,
  projectLimit: 20,
  imageLimit: 524288000,
};
export const remoteUsage = () => usage;
export const hasPending = () => pending.size > 0;
export function forgetProject(id: string) {
  for (const upload of pending.get(id)?.uploads ?? [])
    resources.delete(upload.cacheKey);
  pending.delete(id);
}
export function resetRemote() {
  revisions.clear();
  listedRevisions.clear();
  resources.clear();
  pending.clear();
  actions.clear();
  uncertainActions.clear();
  usage = { projects: 0, bytes: 0, projectLimit: 20, imageLimit: 524288000 };
}
export function pendingErrorKind(error: unknown) {
  return error instanceof RemoteError && error.uncertain
    ? "incerto"
    : error instanceof RemoteError && error.status === 409
      ? "conflito"
      : "falhou";
}
async function digest(data: string) {
  const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
function owner() {
  return requireAccount();
}
function assertCurrent(account: string) {
  if (
    (getAccountScope() ?? currentSession().account?.id) !== account ||
    currentSession().account?.id !== account
  )
    throw new RemoteError(
      409,
      "context_changed",
      "A resposta pertence à conta anterior e não foi aplicada.",
    );
}
export async function projectListing() {
  const account = owner();
  const result = await api<{ projects: ProjectCard[]; usage: Usage }>(
    "/projects",
    { account },
  );
  assertCurrent(account);
  if (
    !Array.isArray(result.projects) ||
    result.projects.some(
      (card) =>
        !card ||
        typeof card.id !== "string" ||
        typeof card.name !== "string" ||
        typeof card.revision !== "string" ||
        !/^[1-9]\d{0,18}$/.test(card.revision) ||
        !["active", "trashed", "purging"].includes(card.state) ||
        !Number.isSafeInteger(card.walls) ||
        card.walls < 0 ||
        !Number.isFinite(Date.parse(card.updatedAt)) ||
        typeof card.compatible !== "boolean",
    ) ||
    !result.usage ||
    ![
      result.usage.bytes,
      result.usage.projects,
      result.usage.projectLimit,
      result.usage.imageLimit,
    ].every(Number.isSafeInteger) ||
    result.usage.bytes < 0 ||
    result.usage.projects < 0 ||
    result.usage.projectLimit <= 0 ||
    result.usage.imageLimit <= 0
  )
    throw new RemoteError(
      503,
      "invalid_response",
      "Lista de projetos incompleta. Atualize a lista antes de continuar.",
    );
  usage = result.usage;
  for (const card of result.projects)
    listedRevisions.set(card.id, { revision: card.revision, account });
  return result;
}
export async function listProjects() {
  return (await projectListing()).projects.filter(
    (project) => project.state === "active",
  );
}
export async function loadStoredProject(id: string, activeOnly = false) {
  const account = owner();
  const result = await api<{
    remoteVersion: number;
    doc: RemoteProject;
    revision: string;
    state: string;
  }>(`/projects/${id}`, { account });
  assertCurrent(account);
  if (result.remoteVersion !== 1)
    throw new Error("Versão remota não suportada.");
  if (activeOnly && result.state !== "active")
    throw new RemoteError(
      409,
      "project_unavailable",
      "O projeto está na lixeira.",
    );
  const bytes: Record<string, string> = {};
  for (const resourceId of resourceIds(result.doc)) {
    const response = await fetch(`/api/images/${id}/${resourceId}`, {
      credentials: "same-origin",
      cache: "no-store",
      headers: { "X-Ecovit-Account": account },
    });
    if (!response.ok)
      throw new RemoteError(
        response.status,
        "asset_missing",
        "Não foi possível carregar uma imagem privada. O trabalho anterior foi preservado.",
      );
    const array = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let start = 0; start < array.length; start += 16384)
      binary += String.fromCharCode(...array.subarray(start, start + 16384));
    bytes[resourceId] = btoa(binary);
    resources.set(`${account}:${id}:${await digest(bytes[resourceId])}`, {
      id: resourceId,
      uploaded: true,
    });
  }
  const doc = validateProject(hydrate(result.doc, bytes));
  assertCurrent(account);
  revisions.set(id, { revision: result.revision, account });
  return doc;
}
export async function loadProject(id: string) {
  return loadStoredProject(id, true);
}
export async function checkRevision(id: string) {
  const known = revisions.get(id);
  if (!known || known.account !== owner())
    throw new RemoteError(
      409,
      "account_changed",
      "Abra novamente o projeto pela conta original.",
    );
  const latest = await api<{ revision: string; state: string }>(
    `/projects/${id}`,
    { account: known.account },
  );
  if (latest.state !== "active" || latest.revision !== known.revision)
    throw new RemoteError(
      409,
      "revision_conflict",
      "Outra sessão alterou ou removeu o projeto. Baixe sua versão ou abra a versão remota.",
    );
}
export async function saveProject(doc: Project) {
  const id = doc.project.id;
  let attempt = pending.get(id);
  if (!attempt) {
    const account = revisions.get(id)?.account ?? owner();
    if (account !== owner())
      throw new RemoteError(
        409,
        "account_changed",
        "Entre na conta original antes de retomar este projeto.",
      );
    const ids: Record<string, string> = {},
      uploads: Pending["uploads"] = [];
    for (const { key, image } of images(doc)) {
      const cacheKey = `${account}:${id}:${await digest(image.data)}`;
      let resource = resources.get(cacheKey);
      if (!resource) {
        resource = { id: crypto.randomUUID(), uploaded: false };
        resources.set(cacheKey, resource);
      }
      ids[key] = resource.id;
      if (
        !resource.uploaded &&
        !uploads.some((upload) => upload.id === resource.id)
      )
        uploads.push({ id: resource.id, data: image.data, cacheKey });
    }
    const known = revisions.get(id);
    attempt = {
      account,
      method: known ? "PUT" : "POST",
      body: {
        operationId: crypto.randomUUID(),
        requestIssuedAt: requestTime(),
        expectedRevision: known?.revision,
        doc: dehydrate(withoutResult(doc), ids),
        ...(!known ? { sourceFile: serializeFile(doc).text } : {}),
      },
      uploads,
      sent: false,
      uncertain: false,
    };
    pending.set(id, attempt);
  }
  try {
    if (attempt.account !== owner())
      throw new RemoteError(
        409,
        "account_changed",
        "Entre na conta original para recuperar a gravação.",
      );
    const recovered = attempt.sent;
    let receipt: Receipt | undefined;
    if (attempt.sent) {
      try {
        receipt = await api<Receipt>(
          `/operations/${attempt.body.operationId}`,
          {
            account: attempt.account,
          },
        );
      } catch (error) {
        if (!(error instanceof RemoteError) || error.status !== 404)
          throw error;
      }
    }
    if (!receipt) {
      for (const upload of attempt.uploads) {
        if (resources.get(upload.cacheKey)?.uploaded) continue;
        const bytes = Uint8Array.from(atob(upload.data), (char) =>
          char.charCodeAt(0),
        );
        const uploaded = await api<{ id: string }>(
          `/uploads/${id}/${upload.id}`,
          {
            method: "POST",
            binary: bytes,
            account: attempt.account,
          },
        );
        if (uploaded.id !== upload.id)
          throw new RemoteError(
            503,
            "invalid_response",
            "Envio de imagem sem confirmação. Tente novamente com o mesmo recurso.",
          );
        resources.set(upload.cacheKey, { id: upload.id, uploaded: true });
      }
      attempt.sent = true;
      receipt = await api<Receipt>(`/projects/${id}`, {
        method: attempt.method,
        body: attempt.body,
        account: attempt.account,
      });
    }
    if (
      !receipt ||
      receipt.projectId !== id ||
      receipt.operationId !== attempt.body.operationId ||
      typeof receipt.revision !== "string" ||
      !/^[1-9]\d{0,18}$/.test(receipt.revision) ||
      !Number.isFinite(Date.parse(receipt.updatedAt ?? "")) ||
      !Number.isFinite(Date.parse(receipt.createdAt ?? ""))
    )
      throw new RemoteError(
        503,
        "invalid_response",
        "Confirmação incompleta. Seu trabalho foi preservado; confira a operação antes de continuar.",
      );
    attempt.uncertain = false;
    assertCurrent(attempt.account);
    if (recovered) {
      let latest: { revision: string; state: string };
      try {
        latest = await api(`/projects/${id}`, { account: attempt.account });
      } catch (error) {
        if (error instanceof RemoteError && error.status === 404)
          throw new RemoteError(
            409,
            "project_unavailable",
            "A gravação foi confirmada, mas o projeto foi removido. Baixe sua versão ou confira a lista.",
          );
        throw error;
      }
      if (latest.revision !== receipt.revision || latest.state !== "active")
        throw new RemoteError(
          409,
          "revision_conflict",
          "A gravação foi confirmada, mas outra sessão já alterou o projeto. Abra a versão remota.",
        );
    }

    assertCurrent(attempt.account);
    revisions.set(id, { revision: receipt.revision, account: attempt.account });
    pending.delete(id);
    return receipt;
  } catch (error) {
    if (error instanceof RemoteError) {
      if (attempt.sent && error.uncertain) attempt.uncertain = true;
      if (attempt.uncertain) error.confirmationPending = true;
    }
    throw error;
  }
}
const uncertainActions = new Set<string>();
const actions = new Map<
  string,
  {
    operationId: string;
    requestIssuedAt: string;
    expectedRevision: string;
    name?: string;
    newId?: string;
  }
>();
export const pendingCopyName = (id: string) =>
  actions.get(`${id}:duplicate`)?.name;
export async function projectAction(
  id: string,
  action: "trash" | "restore" | "purge" | "duplicate",
  name?: string,
) {
  const account = owner();
  const key = `${id}:${action}`;
  let body = actions.get(key);
  if (!body) {
    const known = listedRevisions.get(id) ?? revisions.get(id);
    if (!known) throw new Error("Atualize a lista antes de continuar.");
    body = {
      operationId: crypto.randomUUID(),
      requestIssuedAt: requestTime(),
      expectedRevision: known.revision,
      ...(name ? { name, newId: crypto.randomUUID() } : {}),
    };
    actions.set(key, body);
  }
  if (body.name !== name)
    throw new RemoteError(
      409,
      "operation_pending",
      "Confira a cópia pendente antes de alterar o nome.",
    );
  try {
    const result = await api<Receipt & { state?: string }>(
      `/projects/${id}/${action}`,
      {
        method: "POST",
        body,
        account,
      },
    );
    if (
      !result ||
      result.projectId !== (body.newId ?? id) ||
      result.operationId !== body.operationId ||
      typeof result.revision !== "string" ||
      !/^[1-9]\d{0,18}$/.test(result.revision) ||
      (action !== "duplicate" &&
        result.state !==
          ({ trash: "trashed", restore: "active", purge: "purging" } as const)[
            action
          ])
    )
      throw new RemoteError(
        503,
        "invalid_response",
        "Confirmação incompleta. Tente novamente para conferir a mesma operação.",
      );
    assertCurrent(account);
    actions.delete(key);
    uncertainActions.delete(key);
    return result;
  } catch (error) {
    if (error instanceof RemoteError && error.uncertain)
      uncertainActions.add(key);
    if (
      !uncertainActions.has(key) &&
      error instanceof RemoteError &&
      [
        "revision_conflict",
        "project_missing",
        "project_unavailable",
        "trash_expired",
        "project_quota",
        "image_quota",
        "invalid_input",
        "copy",
        "server_busy",
        "rate_limit",
      ].includes(error.code)
    )
      actions.delete(key);
    throw error;
  }
}
export async function deleteProject(id: string) {
  return projectAction(id, "trash");
}
export async function duplicateProject(id: string, name: string) {
  return projectAction(id, "duplicate", name);
}
