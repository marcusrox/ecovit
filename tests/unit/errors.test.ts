import { expect, it } from 'vitest';
import { AppError, normalizeError } from '../../src/persistence/errors';
it('normaliza códigos RPC sem depender do status HTTP', () => {
  expect(normalizeError({ message: 'NOT_FOUND', status: 400 }).code).toBe('NOT_FOUND');
  expect(normalizeError({ message: 'IDEMPOTENCY_CONFLICT', status: 500 }).code).toBe('IDEMPOTENCY_CONFLICT');
  expect(normalizeError({ status: 429 }).code).toBe('RATE_LIMITED');
  expect(normalizeError(new TypeError('Failed to fetch')).code).toBe('NETWORK_ERROR');
  expect(normalizeError(new AppError('NOT_CONFIGURED')).code).toBe('NOT_CONFIGURED');
});
it('não apresenta detalhes internos ou credenciais em falhas desconhecidas', () => {
  const result = normalizeError({ message: 'SQL failed token=secret' });
  expect(result.code).toBe('SERVICE_ERROR'); expect(result.message).not.toContain('secret');
});
