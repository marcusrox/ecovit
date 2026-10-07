import { ZodError } from 'zod';

const messages = {
  UNAUTHENTICATED: 'Sua sessão expirou. Entre novamente.',
  NOT_FOUND: 'Projeto não encontrado ou indisponível para esta conta.',
  REVISION_CONFLICT: 'Há uma revisão mais recente. Reabra o projeto antes de continuar.',
  IDEMPOTENCY_CONFLICT: 'Esta operação já foi usada com outro conteúdo.',
  DOCUMENT_TOO_LARGE: 'O documento excede o limite de 5 MiB.',
  INVALID_DOCUMENT: 'Documento inválido. Confira as dimensões, referências e limites do projeto.',
  RATE_LIMITED: 'Limite de solicitações atingido. Aguarde e tente novamente.',
  NETWORK_ERROR: 'Não foi possível conectar. Confira sua conexão e tente novamente.',
  SERVICE_ERROR: 'Não foi possível concluir a operação. Tente novamente.',
  NOT_CONFIGURED: 'Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY em .env.local e reinicie a aplicação.',
} as const;
export type ErrorCode = keyof typeof messages;
export class AppError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode) { super(messages[code]); this.code = code; }
}
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) return new AppError('INVALID_DOCUMENT');
  const data = error as { message?: string; status?: number; code?: string } | null;
  const message = data?.message ?? '';
  for (const code of Object.keys(messages) as ErrorCode[]) if (message.includes(code)) return new AppError(code);
  if (data?.status === 429 || data?.code === 'over_request_rate_limit') return new AppError('RATE_LIMITED');
  if (data?.status === 401 || data?.code === 'PGRST301' || data?.code === 'PGRST303') return new AppError('UNAUTHENTICATED');
  if (error instanceof TypeError || /fetch|network/i.test(message)) return new AppError('NETWORK_ERROR');
  return new AppError('SERVICE_ERROR');
}
