import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as crypto from 'crypto';
import * as path from 'path';

// Helper to execute SQL via bridge Node.js and Prisma
function runSqlQuery(sql: string): string {
  try {
    const scriptPath = path.resolve(__dirname, 'helpers/query.js');
    const command = `node "${scriptPath}"`;
    return execSync(command, { input: sql, stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
  } catch (error: any) {
    console.error(`[SQL ERROR] Failed to run query: ${sql}`);
    if (error.stderr) console.error(error.stderr.toString());
    return '';
  }
}

// Helper to execute command directly in the Redis test container via node bridge
function runRedisCommand(command: string): string {
  try {
    if (command === 'flushall') {
      const scriptPath = path.resolve(__dirname, 'helpers/redis-flush.js');
      return execSync(`node "${scriptPath}"`).toString().trim();
    }
    return '';
  } catch (error: any) {
    console.error(`[REDIS ERROR] Failed to run Redis command: ${command}`);
    return '';
  }
}

test.describe('PECAÊ E2E - Vendor Vehicle Flow Verification', () => {
  const testPlate = 'VND-7777';

  test.beforeAll(async () => {
    // Clean up test vehicle from previous executions
    console.log('🧹 [SETUP] Limpando dados de testes anteriores para a placa:', testPlate);
    runSqlQuery(`DELETE FROM listings WHERE vehicle_id IN (SELECT id FROM vehicles WHERE plate = '${testPlate}');`);
    runSqlQuery(`DELETE FROM vehicles WHERE plate = '${testPlate}';`);
    
    // Limpar catálogo customizado para garantir idempotência do teste e forçar invalidação de cache
    runSqlQuery(`DELETE FROM vehicle_years WHERE version_id IN (SELECT id FROM vehicle_versions WHERE model_id IN (SELECT id FROM vehicle_models WHERE brand_id IN (SELECT id FROM vehicle_brands WHERE LOWER(name) = 'fiatcustome2e')));`);
    runSqlQuery(`DELETE FROM vehicle_versions WHERE model_id IN (SELECT id FROM vehicle_models WHERE brand_id IN (SELECT id FROM vehicle_brands WHERE LOWER(name) = 'fiatcustome2e'));`);
    runSqlQuery(`DELETE FROM vehicle_models WHERE brand_id IN (SELECT id FROM vehicle_brands WHERE LOWER(name) = 'fiatcustome2e');`);
    runSqlQuery(`DELETE FROM vehicle_brands WHERE LOWER(name) = 'fiatcustome2e';`);

    console.log('🧹 [SETUP] Limpando cache do Redis...');
    runRedisCommand('flushall');
  });

  test('Deve executar cadastro via wizard, moderação, inativação por venda, reativação e edição pré-preenchida', async ({ page }) => {
    console.log('▶️ Iniciando Fluxo E2E: Ciclo de Vida do Veículo/Sucata do Vendedor');

    // Handle browser console logs for debugging
    page.on('console', msg => {
      console.log(`[BROWSER] [${msg.type()}] ${msg.text()}`);
    });

    // Handle browser alerts/dialogs
    page.on('dialog', async (dialog) => {
      console.log(`ℹ️ [DIALOG] Tipo: ${dialog.type()}, Mensagem: ${dialog.message().substring(0, 80)}`);
      await dialog.accept();
    });

    // 1. Login do Vendedor
    await page.goto('/(auth)/login');
    await page.locator('input[type="email"]').fill('seller-e2e@pecae.com.br');
    await page.locator('input[type="password"]').fill('Pecae@E2e123');
    await page.getByText('ENTRAR', { exact: true }).click();
    await expect(page).toHaveURL(/.*(\(seller\)|\/$)/);
    await expect(page.locator('text=/Olá, Vendedor!|Inventário|Início/').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Login do Vendedor realizado.');

    // 2. Acessar tela de cadastro
    await page.goto('/(seller)/cadastrar-sucata');
    await page.waitForLoadState('domcontentloaded');
    console.log('✅ Tela de cadastro de sucata acessada.');

    // 3. Step 1: Preenchimento do catálogo customizado
    await page.getByPlaceholder('Buscar ou digitar marca...').fill('FiatCustomE2E');
    await page.getByText('+ Cadastrar "FiatCustomE2E" como nova Marca').click();

    await page.getByPlaceholder('Buscar ou digitar modelo...').fill('MareaCustomE2E');
    await page.getByText('+ Cadastrar "MareaCustomE2E" como novo Modelo').click();

    await page.getByPlaceholder('Buscar ou digitar versão...').fill('2.4 CustomE2E');
    await page.getByText('+ Cadastrar "2.4 CustomE2E" como nova Versão').click();

    await page.getByPlaceholder('Buscar ano (ex: 2015 ou 2012/2013)...').fill('2005/2006');
    await page.getByText('+ Cadastrar Ano: 2005/2006').click();
    console.log('✅ Passo 1: Catálogo customizado preenchido.');

    // 4. Step 2: Detalhes Técnicos (Sem campo de placa)
    await page.getByPlaceholder('Ex: Prata').fill('Prata');
    await page.getByPlaceholder('Ex: São Paulo').fill('Guarulhos');
    await page.getByPlaceholder('SP').fill('SP');
    await page.getByPlaceholder('Detalhes sobre a batida, estado do motor, etc.').fill('Marea customizado para testes E2E do fluxo de inventário.');
    await page.getByText(/próximo/i).click();
    console.log('✅ Passo 2: Detalhes técnicos preenchidos.');

    // 5. Step 3: Galeria de Fotos (Injeção de mock data no Zustand para evitar janela nativa de upload)
    await page.evaluate(() => {
      const store = (window as any).useVehicleWizardStore.getState();
      store.updateData({
        photos: [
          { uri: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=200', type: 'image/jpeg', name: 'photo1.jpg' },
          { uri: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=200', type: 'image/jpeg', name: 'photo2.jpg' },
          { uri: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=200', type: 'image/jpeg', name: 'photo3.jpg' },
          { uri: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=200', type: 'image/jpeg', name: 'photo4.jpg' },
        ],
        coverPhotoUri: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=200'
      });
    });
    // Clicar em Próximo na tela de Fotos
    await page.getByText(/próximo/i).click();
    console.log('✅ Passo 3: Fotos injetadas e validadas.');

    // 6. Step 4: Inventário de Peças
    await page.getByText('MARCAR TODOS').click();
    await page.getByPlaceholder('Ex: Sucata Uno Vivace 2015 Inteira').fill('Marea Turbo Custom E2E');
    await page.getByPlaceholder('Descreva o estado geral para o comprador...').fill('Descrição completa do Marea Turbo E2E.');
    await page.getByText(/revisar cadastro/i).click();
    console.log('✅ Passo 4: Componentes inventariados.');

    // 7. Step 5: Finalizar Cadastro (Virá com plate mockado via DB ou alterado para VND-7777 via SQL posterior)
    await page.getByText('FINALIZAR CADASTRO').click();
    console.log('✅ Passo 5: Cadastro finalizado. Aguardando redirecionamento...');

    // Esperar redirecionamento automático para a lista de inventário
    await expect(page).toHaveURL(/.*inventory/);
    console.log('✅ Redirecionado para inventário do vendedor.');

    // Encontrar o veículo recém-cadastrado no banco e atualizar a placa para VND-7777 para que os próximos passos sejam determinísticos
    const vehicleId = runSqlQuery(`
      SELECT v.id FROM vehicles v
      JOIN vehicle_versions vv ON v.version_id = vv.id
      JOIN vehicle_models vm ON vv.model_id = vm.id
      JOIN vehicle_brands vb ON vm.brand_id = vb.id
      WHERE v.color = 'Prata' AND LOWER(vb.name) = 'fiatcustome2e'
      ORDER BY v.created_at DESC LIMIT 1;
    `);
    expect(vehicleId).not.toBe('');
    runSqlQuery(`UPDATE vehicles SET plate = '${testPlate}' WHERE id = '${vehicleId}';`);
    console.log(`ℹ️ [DB] Placa do veículo ID ${vehicleId} updated para ${testPlate}.`);

    // Recarregar o inventário e validar status "EM REVISÃO" (PENDING)
    await page.reload();
    await expect(page.locator(`text=Mareacustome2e`).first()).toBeVisible();
    await expect(page.locator(`text=EM REVISÃO`).first()).toBeVisible();
    console.log('✅ Status "EM REVISÃO" validado com sucesso no inventário.');

    // 8. Moderação (Aprovação via SQL/Simulação de Moderador para agilizar o teste)
    console.log('ℹ️ Simulando aprovação da listagem pelo Moderador...');
    const listingId = runSqlQuery(`SELECT id FROM listings WHERE vehicle_id = '${vehicleId}' LIMIT 1;`);
    expect(listingId).not.toBe('');
    
    // Simula a aprovação que atualiza a listagem para PUBLISHED e o veículo para ACTIVE (moderation.service)
    runSqlQuery(`UPDATE listings SET status = 'PUBLISHED', published_at = NOW() WHERE id = '${listingId}';`);
    runSqlQuery(`UPDATE vehicles SET status = 'ACTIVE' WHERE id = '${vehicleId}';`);

    // Recarregar inventário e verificar status "ATIVO" (ACTIVE)
    await page.reload();
    await expect(page.locator(`text=ATIVO`).first()).toBeVisible();
    console.log('✅ Status "ATIVO" validado no inventário após aprovação do moderador.');

    // 9. Inativação (Marcar como Vendido)
    console.log('ℹ️ Clicando em VENDIDO...');
    const card = page.locator('div').filter({ hasText: 'Mareacustome2e' }).first();
    await card.getByText('VENDIDO', { exact: true }).first().click();
    await page.waitForTimeout(1000);
    await expect(card.locator('text=VENDIDO').first()).toBeVisible();
    console.log('✅ Veículo inativado (status VENDIDO).');

    // 10. Reativação (Apertar em REATIVAR)
    console.log('ℹ️ Clicando em REATIVAR...');
    await card.getByText('REATIVAR', { exact: true }).first().click();
    await page.waitForTimeout(1000);
    await page.reload();
    await expect(card.locator('text=EM REVISÃO').first()).toBeVisible();
    console.log('✅ Veículo reativado com sucesso (retornou para EM REVISÃO).');

    // Aprovar novamente para validar o fluxo de Edição
    runSqlQuery(`UPDATE listings SET status = 'PUBLISHED', published_at = NOW() WHERE id = '${listingId}';`);
    runSqlQuery(`UPDATE vehicles SET status = 'ACTIVE' WHERE id = '${vehicleId}';`);
    await page.reload();
    await expect(card.locator('text=ATIVO').first()).toBeVisible();

    // 11. Edição Pré-preenchida
    console.log('ℹ️ Clicando em EDITAR...');
    await card.getByText('EDITAR', { exact: true }).first().click();
    
    // Aguardar carregamento da tela de cadastro com query ID
    await expect(page).toHaveURL(/.*cadastrar-sucata\?id=.*/);
    console.log('✅ Redirecionado para cadastrar-sucata com ID do veículo.');

    // Verificar se os campos no wizard foram pré-preenchidos corretamente
    // Aguarda a sincronização em cascata do catálogo terminar
    await expect(page.getByText('2005/2006').first()).toBeVisible({ timeout: 10000 });

    // Clicar em "Confirmar Veículo" para ver se os dados customizados persistem
    await page.getByText('Confirmar Veículo').click();
    console.log('✅ Passo 1 da Edição concluído com dados pré-preenchidos.');

    // No Passo 2, alterar a cor de Prata para "Preto"
    const colorInput = page.getByPlaceholder('Ex: Prata');
    await expect(colorInput).toHaveValue('Prata');
    await colorInput.fill('Preto');
    await page.getByText(/próximo/i).click();
    console.log('✅ Passo 2 da Edição concluído com alteração de cor.');

    // Passo 3: Avançar fotos
    await page.getByText(/próximo/i).click();

    // Passo 4: Avançar inventário
    await page.getByText(/revisar cadastro/i).click();

    // Passo 5: Finalizar Cadastro (Submeter PATCH)
    await page.getByText('FINALIZAR CADASTRO').click();

    // Esperar redirecionamento automático
    await expect(page).toHaveURL(/.*inventory/);
    console.log('✅ Edição finalizada com sucesso e redirecionado para o inventário.');

    // Validar se o status retornou para "EM REVISÃO" e a cor foi alterada no banco
    await page.reload();
    await expect(page.locator(`text=EM REVISÃO`).first()).toBeVisible();
    
    const dbColor = runSqlQuery(`SELECT color FROM vehicles WHERE id = '${vehicleId}';`);
    expect(dbColor).toBe('Preto');
    console.log('✅ Validação de Edição concluída com sucesso no Banco de Dados (cor alterada para Preto).');
  });
});
