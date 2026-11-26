export type AdminUser = {
  id: string;
  email: string;
  state: "active" | "blocked" | "deleting";
  admin: boolean;
  permanent: boolean;
  created_at: string;
  last_activity: string | null;
  projects: number;
  bytes: number;
};
export type AdminProject = {
  id: string;
  name: string;
  state: string;
  created_at: string;
  updated_at: string;
  revision: string;
  bytes: number;
};
export type AdminAudit = {
  id: string;
  actor_id: string | null;
  target_id: string;
  actor_email: string | null;
  target_email: string;
  source: string;
  action: string;
  reason: string;
  outcome: string;
  created_at: string;
};
export type AdminEvent = {
  category: string;
  code: string;
  outcome: string;
  request_id: string | null;
  created_at: string;
};
export type AdminOverview = {
  updated_at: string;
  coverage_since: string;
  coverage_partial: boolean;
  days: number;
  accounts: number;
  active_accounts: number;
  blocked_accounts: number;
  deleting_accounts: number;
  new_accounts: number;
  active_users: number;
  projects: number;
  trashed_projects: number;
  bytes: number;
};
export type AdminAction = "block" | "unblock" | "sessions" | "grant" | "revoke";
export const adminActionNames: Record<
  AdminAction | "recover" | "configured" | "price",
  string
> = {
  block: "Bloquear conta",
  unblock: "Desbloquear conta",
  sessions: "Encerrar sessões",
  grant: "Adicionar administrador",
  revoke: "Retirar administrador",
  recover: "Recuperar administração",
  configured: "Administrador configurado",
  price: "Alterar preço de referência",
};
