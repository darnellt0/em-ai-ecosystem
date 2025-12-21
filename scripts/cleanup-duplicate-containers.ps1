# Docker Cleanup Script - Remove Duplicate n8n Container
# This script removes the standalone n8n container to avoid confusion with em-n8n

Write-Host "=== Docker Compose Project Cleanup ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify current container status
Write-Host "Step 1: Current Docker Container Status" -ForegroundColor Yellow
Write-Host "---------------------------------------" -ForegroundColor Yellow
docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}`t{{.Label `"com.docker.compose.project`"}}" | Out-String | Write-Host
Write-Host ""

# Step 2: Identify the standalone n8n container
Write-Host "Step 2: Verifying Standalone n8n Container" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Yellow

$n8nProject = docker inspect n8n --format '{{index .Config.Labels "com.docker.compose.project"}}' 2>$null
$n8nWorkDir = docker inspect n8n --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Found standalone n8n container:" -ForegroundColor Green
    Write-Host "  Project: $n8nProject"
    Write-Host "  Working Dir: $n8nWorkDir"
    Write-Host "  Port: 5678"
    Write-Host ""
} else {
    Write-Host "No standalone n8n container found - nothing to clean up" -ForegroundColor Green
    exit 0
}

# Step 3: Confirm cleanup
Write-Host "Step 3: Confirmation" -ForegroundColor Yellow
Write-Host "--------------------" -ForegroundColor Yellow
Write-Host "This will stop and remove the standalone n8n container (port 5678)." -ForegroundColor Cyan
Write-Host "The EM stack n8n container (em-n8n on port 5679) will NOT be affected." -ForegroundColor Cyan
Write-Host ""
$confirm = Read-Host "Do you want to proceed? (y/N)"

if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Cleanup cancelled." -ForegroundColor Yellow
    exit 0
}

# Step 4: Stop standalone n8n
Write-Host ""
Write-Host "Step 4: Stopping standalone n8n container..." -ForegroundColor Yellow
docker stop n8n 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Stopped successfully" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to stop (may already be stopped)" -ForegroundColor Red
}

# Step 5: Remove standalone n8n
Write-Host ""
Write-Host "Step 5: Removing standalone n8n container..." -ForegroundColor Yellow
docker rm n8n 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Removed successfully" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to remove" -ForegroundColor Red
    exit 1
}

# Step 6: Verify cleanup
Write-Host ""
Write-Host "Step 6: Verification" -ForegroundColor Yellow
Write-Host "--------------------" -ForegroundColor Yellow
Write-Host "Remaining containers:" -ForegroundColor Cyan
docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}`t{{.Label `"com.docker.compose.project`"}}" | Out-String | Write-Host

# Step 7: Document other projects
Write-Host ""
Write-Host "Step 7: Other Docker Projects on This Machine" -ForegroundColor Yellow
Write-Host "---------------------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "EM AI Ecosystem (compassionate-pike):" -ForegroundColor Cyan
docker ps --filter "label=com.docker.compose.project=compassionate-pike" --format "  - {{.Names}} ({{.Status}})" | Out-String | Write-Host

Write-Host "Deal Scout Project:" -ForegroundColor Cyan
docker ps --filter "label=com.docker.compose.project=deal-scout" --format "  - {{.Names}} ({{.Status}})" | Out-String | Write-Host

Write-Host ""
Write-Host "=== Cleanup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  ✓ Standalone n8n (port 5678) - REMOVED" -ForegroundColor Green
Write-Host "  ✓ EM n8n (em-n8n, port 5679) - ACTIVE" -ForegroundColor Green
Write-Host "  ✓ Deal Scout Redis (port 6379) - ACTIVE (different project)" -ForegroundColor Yellow
Write-Host "  ✓ EM Redis (em-redis, port 6380) - ACTIVE" -ForegroundColor Green
Write-Host ""
Write-Host "Note: deal-scout-redis-1 is part of a separate project and was not touched." -ForegroundColor Yellow
Write-Host "EM uses port 6380 for Redis to avoid port collision with deal-scout (6379)." -ForegroundColor Yellow
Write-Host ""
Write-Host "To manage EM containers, use:" -ForegroundColor Cyan
Write-Host '  $env:COMPOSE_PROJECT_NAME = "compassionate-pike"' -ForegroundColor Gray
Write-Host "  docker compose ps" -ForegroundColor Gray
Write-Host ""
Write-Host "Or use explicit project name:" -ForegroundColor Cyan
Write-Host "  docker compose -p compassionate-pike ps" -ForegroundColor Gray
Write-Host ""
