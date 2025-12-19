# Complete Docker Fix - All Issues Resolved
# Run this in PowerShell

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Docker Container Complete Fix Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Pull ALL fixes
Write-Host "[1/6] Pulling latest fixes from repository..." -ForegroundColor Yellow
git pull
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git pull failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Code updated`n" -ForegroundColor Green

# Step 2: Verify all fixes are present
Write-Host "[2/6] Verifying fixes..." -ForegroundColor Yellow

# Check dispatcher export
$dispatcherCheck = Select-String -Path "packages/orchestrator/package.json" -Pattern '"./dispatcher"'
if ($dispatcherCheck) {
    Write-Host "  ✓ Dispatcher export present" -ForegroundColor Green
} else {
    Write-Host "  ✗ Dispatcher export MISSING - pull may have failed" -ForegroundColor Red
    exit 1
}

# Check P0RunRecord fix
$syntaxCheck = Get-Content "packages/api/src/services/p0RunHistory.service.ts" | Select-String -Pattern "error\?: string;" -Context 0,1
if ($syntaxCheck -match '}') {
    Write-Host "  ✓ P0RunRecord syntax fixed" -ForegroundColor Green
} else {
    Write-Host "  ✗ P0RunRecord syntax still broken" -ForegroundColor Red
    exit 1
}

# Check BullMQ fix
$bullmqCheck = Select-String -Path "packages/api/src/growth-agents/worker.ts" -Pattern "maxRetriesPerRequest: null"
if ($bullmqCheck) {
    Write-Host "  ✓ BullMQ Redis config fixed`n" -ForegroundColor Green
} else {
    Write-Host "  ✗ BullMQ fix missing`n" -ForegroundColor Red
    exit 1
}

# Step 3: Stop and clean
Write-Host "[3/6] Stopping containers and cleaning volumes..." -ForegroundColor Yellow
docker compose down -v
Write-Host "✅ Cleaned`n" -ForegroundColor Green

# Step 4: Rebuild from scratch
Write-Host "[4/6] Rebuilding containers (this takes 3-4 minutes)..." -ForegroundColor Yellow
Write-Host "  Building..." -ForegroundColor Gray
docker compose build --no-cache 2>&1 | Out-File -FilePath "build.log"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Last 30 lines of build.log:" -ForegroundColor Red
    Get-Content "build.log" -Tail 30
    exit 1
}
Write-Host "✅ Build complete`n" -ForegroundColor Green

# Step 5: Start containers
Write-Host "[5/6] Starting all containers..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Containers started`n" -ForegroundColor Green

# Step 6: Wait and test
Write-Host "[6/6] Waiting for services to initialize (45 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 45

Write-Host "`nContainer Status:" -ForegroundColor Cyan
docker compose ps

Write-Host "`nTesting Health Endpoint..." -ForegroundColor Cyan
$maxAttempts = 5
$attempt = 1
$success = $false

while ($attempt -le $maxAttempts -and -not $success) {
    try {
        Write-Host "  Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
        $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 10 -ErrorAction Stop
        $success = $true

        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host " ✅ SUCCESS - API IS RUNNING!" -ForegroundColor Green
        Write-Host "========================================`n" -ForegroundColor Green

        Write-Host "Health Check Results:" -ForegroundColor Cyan
        Write-Host "  Status: $($health.status)" -ForegroundColor $(if($health.status -eq 'healthy'){'Green'}elseif($health.status -eq 'degraded'){'Yellow'}else{'Red'})
        Write-Host "  Environment: $($health.environment)" -ForegroundColor Gray
        Write-Host "  Uptime: $($health.uptime) seconds" -ForegroundColor Gray

        Write-Host "`n  Redis:" -ForegroundColor Cyan
        Write-Host "    Status: $($health.checks.redis.status)" -ForegroundColor $(if($health.checks.redis.status -eq 'up'){'Green'}else{'Red'})
        if ($health.checks.redis.responseTime) {
            Write-Host "    Response Time: $($health.checks.redis.responseTime)ms" -ForegroundColor Gray
        }
        if ($health.checks.redis.error) {
            Write-Host "    Error: $($health.checks.redis.error)" -ForegroundColor Red
        }

        Write-Host "`n  Database:" -ForegroundColor Cyan
        Write-Host "    Status: $($health.checks.database.status)" -ForegroundColor $(if($health.checks.database.status -eq 'up'){'Green'}else{'Red'})
        if ($health.checks.database.responseTime) {
            Write-Host "    Response Time: $($health.checks.database.responseTime)ms" -ForegroundColor Gray
        }
        if ($health.checks.database.error) {
            Write-Host "    Error: $($health.checks.database.error)" -ForegroundColor Red
        }

        Write-Host "`n  Memory:" -ForegroundColor Cyan
        Write-Host "    Used: $($health.checks.memory.used)MB / $($health.checks.memory.total)MB ($($health.checks.memory.percentage)%)" -ForegroundColor Gray

        Write-Host "`nNext Steps:" -ForegroundColor Yellow
        Write-Host "  • View API logs: docker compose logs -f api" -ForegroundColor Gray
        Write-Host "  • View worker logs: docker compose logs -f worker" -ForegroundColor Gray
        Write-Host "  • View all logs: docker compose logs -f" -ForegroundColor Gray
        Write-Host "  • Open dashboard: http://localhost:3000" -ForegroundColor Gray

    } catch {
        if ($attempt -lt $maxAttempts) {
            Write-Host "    Not ready yet, waiting 10 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
            $attempt++
        } else {
            Write-Host "`n❌ Health check failed after $maxAttempts attempts" -ForegroundColor Red
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red

            Write-Host "`nChecking container status..." -ForegroundColor Yellow
            docker compose ps

            Write-Host "`nAPI Logs (last 50 lines):" -ForegroundColor Yellow
            docker compose logs api --tail=50

            Write-Host "`nWorker Logs (last 20 lines):" -ForegroundColor Yellow
            docker compose logs worker --tail=20

            exit 1
        }
    }
}

if (-not $success) {
    Write-Host "`n❌ Failed to connect to API" -ForegroundColor Red
    exit 1
}
