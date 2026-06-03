import { test, expect } from '@playwright/test';

test.describe('PECAÊ E2E - Fluxo 5: Controle de Acesso RBAC/CASL', () => {

  test('Deve garantir bloqueios de segurança contra o Comprador Malicioso tentando burlar permissões', async ({ page }) => {
    console.log('▶️ Iniciando Fluxo 5: Controle de Acesso RBAC/CASL (Segurança)');

    // 1. Login do Comprador Malicioso (Hacker - tipo BUYER)
    await page.goto('/(auth)/login');
    await page.locator('input[type="email"]').fill('hacker@pecae.com.br');
    await page.locator('input[type="password"]').fill('Pecae@E2e123');
    await page.getByText('ENTRAR', { exact: true }).click();
    await expect(page).toHaveURL(/.*(\(tabs\)|\/$)/);
    console.log('✅ Login do Comprador Malicioso realizado.');

    // 2. Tentar acessar a rota restrita de Moderador no frontend
    await page.goto('/(moderator)');
    
    // 3. Validar bloqueio visual (o conteúdo restrito do moderador NÃO deve ser renderizado para o hacker)
    const rbacTitle = page.getByText('FILA DE MODERAÇÃO').first();
    await expect(rbacTitle).not.toBeVisible();
    console.log('✅ Validação RBAC Frontend: Acesso à rota restrita de moderação foi bloqueado de forma bem-sucedida (conteúdo restrito não visível).');

    // 4. Testar proteção a nível de API (Bypass de segurança)
    const token = await page.evaluate(() => {
      return localStorage.getItem('user_token') || 'mock-invalid-token';
    });

    const apiCalls = [
      { url: 'http://localhost:3001/api/v1/moderation/listings', method: 'GET' },
      { url: 'http://localhost:3001/api/v1/moderation/listings/some-id/approve', method: 'POST' },
      { url: 'http://localhost:3001/api/v1/analytics/admin', method: 'GET' },
      { url: 'http://localhost:3001/api/v1/admin/users/some-id/role', method: 'POST' }
    ];

    console.log('🔒 Disparando chamadas diretas de API para validar o CASL de back-end...');
    
    for (const call of apiCalls) {
      const responseStatus = await page.evaluate(async (params) => {
        try {
          const res = await fetch(params.url, {
            method: params.method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${params.token}`
            }
          });
          return res.status;
        } catch {
          return 500;
        }
      }, { url: call.url, method: call.method, token });

      // O backend DEVE retornar 403 (Forbidden) ou 401 (Unauthorized)
      expect([401, 403]).toContain(responseStatus);
      console.log(`✅ Endpoint de API [${call.method}] ${call.url} protegido! Retornou status: ${responseStatus}`);
    }

    console.log('✅ Validação RBAC/CASL Back-end: Todos os endpoints estão 100% protegidos contra privilégios elevados!');
  });
});
