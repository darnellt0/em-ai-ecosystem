# Docker Fix Script - Run this in PowerShell
# Purpose: Pull latest fixes and rebuild Docker containers

Write-Host "`n=== Docker Container Fix Script ===" -ForegroundColor Cyan
Write-Host "This will fix the API container startup issues`n" -ForegroundColor Gray

# Step 1: Pull latest code (includes all fixes)
Write-Host "[1/7] Pulling latest code..." -ForegroundColor Yellow
git pull
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git pull failed" -ForegroundColor Red
    exit 1
}

# Step 2: Verify dispatcher export exists
Write-Host "`n[2/7] Verifying dispatcher export..." -ForegroundColor Yellow
$dispatcherExport = Select-String -Path "packages/orchestrator/package.json" -Pattern '"./dispatcher"'
if ($dispatcherExport) {
    Write-Host "✓ Dispatcher export found" -ForegroundColor Green
} else {
    Write-Host "✗ Dispatcher export missing!" -ForegroundColor Red
    exit 1
}

# Step 3: Verify P0RunRecord interface is fixed
Write-Host "`n[3/7] Verifying P0RunRecord syntax fix..." -ForegroundColor Yellow
$syntaxCheck = Select-String -Path "packages/api/src/services/p0RunHistory.service.ts" -Pattern "error\?: string;" -Context 0,2
if ($syntaxCheck -match '}') {
    Write-Host "✓ P0RunRecord interface closing brace found" -ForegroundColor Green
} else {
    Write-Host "✗ P0RunRecord interface still missing closing brace!" -ForegroundColor Red
    exit 1
}

# Step 4: Stop all containers
Write-Host "`n[4/7] Stopping containers..." -ForegroundColor Yellow
docker compose down
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Failed to stop containers (they may not be running)" -ForegroundColor Yellow
}

# Step 5: Force clean rebuild (no cache)
Write-Host "`n[5/7] Building containers (this will take 2-3 minutes)..." -ForegroundColor Yellow
docker compose build --no-cache 2>&1 | Tee-Object -FilePath "build.log"
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed! Check build.log for details" -ForegroundColor Red
    Write-Host "Last 20 lines of build.log:" -ForegroundColor Yellow
    Get-Content build.log -Tail 20
    exit 1
}
Write-Host "✓ Build completed successfully" -ForegroundColor Green

# Step 6: Start containers
Write-Host "`n[6/7] Starting containers..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start containers" -ForegroundColor Red
    exit 1
}

# Wait for API to start
Write-Host "`n[7/7] Waiting for API to start (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check container status
Write-Host "`nContainer Status:" -ForegroundColor Cyan
docker compose ps

# Test health endpoint
Write-Host "`nTesting health endpoint..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -ErrorAction Stop

    Write-Host "`n✓✓✓ SUCCESS! API is running ✓✓✓" -ForegroundColor Green
    Write-Host "`nHealth Check Results:" -ForegroundColor Cyan
    Write-Host "  Overall Status: $($health.status)" -ForegroundColor $(if($health.status -eq 'healthy'){'Green'}else{'Yellow'})
    Write-Host "  Redis Status: $($health.checks.redis.status)" -ForegroundColor $(if($health.checks.redis.status -eq 'up'){'Green'}else{'Red'})
    Write-Host "  Database Status: $($health.checks.database.status)" -ForegroundColor $(if($health.checks.database.status -eq 'up'){'Green'}else{'Red'})
    Write-Host "  Memory Usage: $($health.checks.memory.used)MB / $($health.checks.memory.total)MB ($($health.checks.memory.percentage)%)" -ForegroundColor Gray

    if ($health.checks.redis.responseTime) {
        Write-Host "  Redis Response Time: $($health.checks.redis.responseTime)ms" -ForegroundColor Gray
    }
    if ($health.checks.database.responseTime) {
        Write-Host "  Database Response Time: $($health.checks.database.responseTime)ms" -ForegroundColor Gray
    }

    Write-Host "`nView logs:" -ForegroundColor Cyan
    Write-Host "  docker compose logs -f api" -ForegroundColor Gray

} catch {
    Write-Host "`n✗ Health check failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "`nChecking API logs for errors..." -ForegroundColor Yellow
    docker compose logs api --tail=50
    exit 1
}
