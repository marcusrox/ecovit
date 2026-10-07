import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e', fullyParallel: true, forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: false,
    env: { ECOVIT_E2E: '1', VITE_SUPABASE_URL: 'https://ecovit-test.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_e2e_mock_only' },
  },
});
