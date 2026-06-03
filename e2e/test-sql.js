const { execSync } = require('child_process');

function runSqlQuery(sql) {
  try {
    const command = 'wsl -u root docker exec -i pecae-postgres-test psql -U postgres -d pecae_test_db -t -A';
    const result = execSync(command, { 
      input: sql, 
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false
    }).toString().trim();
    console.log(`[SQL OK] Query: ${sql.substring(0, 60)}`);
    console.log(`[SQL OK] Result: ${result}`);
    return result;
  } catch (error) {
    console.error(`[SQL ERROR] Falha ao rodar query: ${sql}`);
    if (error.stderr) console.error('STDERR:', error.stderr.toString());
    if (error.stdout) console.log('STDOUT:', error.stdout.toString());
    console.error('Error code:', error.status);
    return '';
  }
}

// Testar
const brandId = runSqlQuery("SELECT id FROM vehicle_brands WHERE name = 'Volkswagen' LIMIT 1;");
console.log('\n=== brandId:', brandId, '===');

if (brandId) {
  const modelId = runSqlQuery(`SELECT id FROM vehicle_models WHERE name = 'Gol' AND brand_id = '${brandId}' LIMIT 1;`);
  console.log('\n=== modelId:', modelId, '===');
}
