import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Servidores simultâneos usam configurações Supabase diferentes. Não compartilhar
  // o cache evita que os testes invalidem as dependências da aplicação aberta.
  cacheDir: process.env.ECOVIT_E2E === '1' ? 'node_modules/.vite-e2e' : 'node_modules/.vite',
  server: { port: 5173, strictPort: true },
  test: { include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'], environment: 'node' },
});
