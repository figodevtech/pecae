import { defineConfig, devices } from '@playwright/test';

/**
 * PECAÊ - Configuração do Playwright para Testes E2E
 */
export default defineConfig({
  testDir: './e2e',
  /* Tempo limite total de cada teste individual ampliado para 90s para suportar cold-starts do Metro Bundler */
  timeout: 90000,
  /* Executa os testes em série para evitar concorrência no banco de dados com seed determinístico */
  fullyParallel: false,
  /* Impede múltiplos workers concorrentes que quebrem os fluxos ordenados de testes */
  workers: 1,
  /* Repórter visual HTML e no terminal */
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  use: {
    /* URL base do Expo Web (Mobile Web) configurada no setup */
    baseURL: 'http://localhost:8083',
    /* Captura traces em falhas para depuração visual */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    /* Tempo limite de cada ação de navegação ou clique individual */
    actionTimeout: 20000,
    navigationTimeout: 30000,
  },

  /* Executa apenas em Chromium simulação mobile/desktop para o web app */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 }, // Simula tamanho Mobile Web de iPhone X/11
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      },
    },
  ],
});
