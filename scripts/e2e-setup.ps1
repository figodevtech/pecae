# ============================================================
# PECAE - Script de Setup para Testes E2E (Focado em Banco/Infra)
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host "[SETUP] Iniciando ambiente de testes E2E do PECAE (Modo WSL)..." -ForegroundColor Green

# Como o usuario informou que usa o Docker no WSL, forçamos o modo WSL
$isWsl = $true

# Testar se o Docker no WSL esta de fato rodando
try {
    $wslStatus = wsl docker ps -q 2>&1
    if ($wslStatus -match "Cannot connect to the Docker daemon") {
        Write-Error "[ERROR] O daemon do Docker esta inativo no WSL. Por favor, abra o terminal do WSL e execute: sudo service docker start"
        exit 1
    }
    Write-Host "[INFO] Docker no WSL ativo e pronto para uso!" -ForegroundColor Green
} catch {
    Write-Error "[ERROR] Nao foi possivel se conectar ao Docker no WSL. Garanta que o Docker esteja instalado na sua distro Linux."
    exit 1
}

# 2. Subir infraestrutura via docker compose no WSL
Write-Host "[DOCKER] Subindo PostgreSQL (5433) e Redis (6380) no WSL..." -ForegroundColor Cyan
wsl docker compose -f docker-compose.test.yml up -d

# 3. Aguardar healthcheck dos containers
Write-Host "[WAIT] Aguardando PostgreSQL de testes no container pecae-postgres-test..." -ForegroundColor Yellow
do {
    $pgStatus = (wsl docker inspect --format='{{.State.Health.Status}}' pecae-postgres-test 2>$null).Trim()
    if ($pgStatus -eq "healthy") {
        Write-Host "[INFO] PostgreSQL respondeu ao healthcheck! Aguardando 5 segundos para boot completo do banco interno..." -ForegroundColor Green
        Start-Sleep -Seconds 5
        break
    }
    Start-Sleep -Seconds 1
} while ($true)

Write-Host "[WAIT] Aguardando Redis de testes no container pecae-redis-test..." -ForegroundColor Yellow
do {
    $redisStatus = (wsl docker inspect --format='{{.State.Health.Status}}' pecae-redis-test 2>$null).Trim()
    if ($redisStatus -eq "healthy") {
        Write-Host "[INFO] Redis esta saudavel!" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 1
} while ($true)

# 4. Backup do .env atual se existir
$envPath = "apps/api/.env"
$envBackupPath = "apps/api/.env.backup"
$envTestPath = "apps/api/.env.test"

if (Test-Path $envPath) {
    Write-Host "[FILE] Fazendo backup do arquivo .env atual para .env.backup..." -ForegroundColor Yellow
    Copy-Item $envPath $envBackupPath -Force
}

# 5. Copiar .env.test para .env
Write-Host "[FILE] Copiando .env.test para .env..." -ForegroundColor Yellow
Copy-Item $envTestPath $envPath -Force

# 6. Executar migrations do Prisma
Write-Host "[DATABASE] Executando migrations do Prisma no banco de testes..." -ForegroundColor Cyan
Set-Location apps/api
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] Falha ao aplicar migrations do Prisma."
}

# 7. Executar seeds (Catalogo principal + Atores E2E)
Write-Host "[DATABASE] Executando seed de catalogo basico..." -ForegroundColor Cyan
npx ts-node -r tsconfig-paths/register prisma/seed.ts
if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] Falha ao executar o seed basico."
}

Write-Host "[DATABASE] Executando seed de atores e dados de teste E2E..." -ForegroundColor Cyan
npx ts-node -r tsconfig-paths/register prisma/seed-e2e.ts
if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] Falha ao executar o seed E2E."
}

# Voltar para a raiz
Set-Location ../..

Write-Host "[SUCCESS] Infraestrutura e Banco de testes E2E configurados com sucesso!" -ForegroundColor Green
Write-Host "PostgreSQL rodando no WSL na porta 5433"
Write-Host "Redis rodando no WSL na porta 6380"
