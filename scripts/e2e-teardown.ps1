# ============================================================
# PECAE - Script de Teardown para Testes E2E
# ============================================================

Write-Host "[TEARDOWN] Encerrando ambiente de testes E2E do PECAE..." -ForegroundColor Red

# 1. Parar os processos de API (3001) e Web (8083) usando as portas ativas no Windows
Write-Host "[TEARDOWN] Finalizando processos ativos nas portas de testes..." -ForegroundColor Yellow

$apiConnection = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($apiConnection) {
    $apiPid = $apiConnection.OwningProcess[0]
    Write-Host "[TEARDOWN] Parando processo da API na porta 3001 (PID: $apiPid)..."
    Stop-Process -Id $apiPid -Force -ErrorAction SilentlyContinue
}

$webConnection = Get-NetTCPConnection -LocalPort 8083 -ErrorAction SilentlyContinue
if ($webConnection) {
    $webPid = $webConnection.OwningProcess[0]
    Write-Host "[TEARDOWN] Parando processo do Expo Web na porta 8083 (PID: $webPid)..."
    Stop-Process -Id $webPid -Force -ErrorAction SilentlyContinue
}

# Remover arquivo temporário de PIDs se existir
Remove-Item "scripts/.e2e-pids.txt" -Force -ErrorAction SilentlyContinue

# 2. Restaurar arquivo .env original
$envPath = "apps/api/.env"
$envBackupPath = "apps/api/.env.backup"

if (Test-Path $envBackupPath) {
    Write-Host "[FILE] Restaurando o arquivo .env original..."
    Move-Item $envBackupPath $envPath -Force
} else {
    if (Test-Path $envPath) {
        Write-Host "[FILE] Removendo o arquivo .env de teste temporario..."
        Remove-Item $envPath -Force
    }
}

# 3. Derrubar os containers de testes com seus volumes no WSL
Write-Host "[DOCKER] Derrubando PostgreSQL e Redis de testes e limpando volumes no WSL..." -ForegroundColor Yellow
wsl docker compose -f docker-compose.test.yml down -v

Write-Host "[SUCCESS] Ambiente de testes E2E limpo com sucesso!" -ForegroundColor Green
