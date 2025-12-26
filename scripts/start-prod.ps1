# ============================================
# START PRODUCTION ENVIRONMENT
# ============================================

Write-Host "Starting EM-AI Ecosystem (Production)..."
Write-Host ""

Set-Location "C:\dev\elevated-movements\em-ai-ecosystem"

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ ERROR: .env.production not found!" -ForegroundColor Red
    Write-Host "   Run the setup script first to create it."
    exit 1
}

# Start all services
Write-Host "Starting all Docker services..."
docker-compose --env-file .env.production up -d

Write-Host ""
Write-Host "Waiting for services to be ready..."
Start-Sleep -Seconds 10

# Run health check
Write-Host ""
& ".\scripts\health-monitor.ps1"

Write-Host ""
Write-Host "============================================"
Write-Host "Production environment started!"
Write-Host ""
Write-Host "Services:"
Write-Host "   API:      http://localhost:3001"
Write-Host "   N8N:      http://localhost:5678"
Write-Host "   Postgres: localhost:5432"
Write-Host "   Redis:    localhost:6379"
Write-Host ""
Write-Host "To view logs:  docker-compose logs -f"
Write-Host "To stop:       docker-compose down"
Write-Host "============================================"
