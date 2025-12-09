# scripts/railway-deploy.ps1
# Usage (from repo root, in PowerShell):
#   .\scripts\railway-deploy.ps1

$ErrorActionPreference = "Stop"

$projectName = "em-ai-ecosystem"

function Invoke-Railway {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]] $RailwayArgs
    )

    # This runs: npx @railway/cli@latest <args> with auto-confirm so it doesn't hang on the install prompt
    & npx -y '@railway/cli@latest' @RailwayArgs
}

Write-Host "🚂 EM-AI Ecosystem – Railway Deployment" -ForegroundColor Cyan

# 0) Ensure we're in repo root
if (-not (Test-Path "railway.toml")) {
    Write-Host "❌ railway.toml not found. Run this from the em-ai-ecosystem root." -ForegroundColor Red
    exit 1
}

# 1) Check npx
$npxPath = Get-Command npx -ErrorAction SilentlyContinue
if (-not $npxPath) {
    Write-Host "❌ npx not found. You need Node.js + npm installed on Windows." -ForegroundColor Red
    exit 1
}

# 2) Login (no-op if already logged in)
Write-Host "🔐 Checking Railway login status..." -ForegroundColor Yellow
$loggedIn = $true
try {
    Invoke-Railway status | Out-Null
} catch {
    $loggedIn = $false
}

if (-not $loggedIn) {
    Invoke-Railway login
}

# 3) Link or init project
Write-Host "🔗 Linking to Railway project..." -ForegroundColor Yellow

$linked = $true
try {
    Invoke-Railway link --project $projectName | Out-Null
} catch {
    $linked = $false
}

if (-not $linked) {
    Write-Host "ℹ️ No existing project named '$projectName' found. Creating a new one..." -ForegroundColor Yellow
    Invoke-Railway init --name $projectName
}

Write-Host "✅ Project linked: $projectName" -ForegroundColor Green

# 4) Show environments
Write-Host "🌱 Current Railway environments:" -ForegroundColor Yellow
try {
    Invoke-Railway environments
} catch {
    Write-Host "⚠️ Could not list environments (this is non-fatal)." -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "⚠️ IMPORTANT: Make sure your production environment variables are set in Railway." -ForegroundColor Yellow
Write-Host "   Use .env.production and docs/DEPLOYMENT_READINESS.md as your source of truth."
Write-Host "   You can set variables via:"
Write-Host "     npx @railway/cli@latest variables set KEY=VALUE"
Write-Host "   or via the Railway dashboard (Recommended for secrets)."
Write-Host ""

$confirm = Read-Host "Have you configured the necessary env vars in Railway? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Aborting deploy. Configure env vars first, then re-run this script." -ForegroundColor Red
    exit 1
}

# 5) Deploy using railway.toml + Dockerfile.production
Write-Host "🚀 Deploying using railway.toml and Dockerfile.production..." -ForegroundColor Cyan
Invoke-Railway up

Write-Host ""
Write-Host "✅ Deployment triggered." -ForegroundColor Green
Write-Host "   Check the Railway dashboard for build logs and the public URL."
Write-Host "   Once live, verify health endpoints (from DEPLOYMENT_READINESS.md):"
Write-Host "     GET  /api/health"
Write-Host "     GET  /api/orchestrator/health"
Write-Host "     GET  /api/orchestrator/agents/health"
Write-Host "     POST /api/orchestrator/qa/phase6"
