# ============================================
# START DEVELOPMENT ENVIRONMENT
# ============================================

Write-Host "Starting EM-AI Ecosystem (Development)..."
Write-Host ""

# Set environment
$env:NODE_ENV = "development"
$env:PORT = "3001"

# Check if Docker services are needed
$useDocker = Read-Host "Start PostgreSQL and Redis via Docker? (y/n)"

if ($useDocker -eq "y") {
    Write-Host "Starting Docker services..."
    docker-compose up -d postgres redis
    Start-Sleep -Seconds 5
}

# Start API server
Write-Host "Starting API server on port 3001..."
Set-Location "C:\dev\elevated-movements\em-ai-ecosystem"
npm run dev --workspace=packages/api
