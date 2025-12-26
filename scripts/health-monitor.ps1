# ============================================
# EM-AI ECOSYSTEM - HEALTH MONITOR
# ============================================
# Run this script periodically to check system health

param(
    [string]$ApiUrl = "http://localhost:3001",
    [switch]$Verbose
)

function Test-Endpoint {
    param([string]$Name, [string]$Url, [string]$Method = "GET", [string]$Body = $null)
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 10
            Headers = @{ "Content-Type" = "application/json" }
        }
        
        if ($Body) { $params.Body = $Body }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        
        return @{
            Name = $Name
            Status = "OK"
            StatusCode = $response.StatusCode
            Data = $data
        }
    } catch {
        return @{
            Name = $Name
            Status = "FAIL"
            Error = $_.Exception.Message
        }
    }
}

Write-Host "============================================"
Write-Host "EM-AI ECOSYSTEM HEALTH CHECK"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "============================================"
Write-Host ""

# Check API Health
$healthCheck = Test-Endpoint -Name "API Health" -Url "$ApiUrl/api/exec-admin/dispatch" -Method "POST" -Body '{"intent":"health_check","payload":{}}'

if ($healthCheck.Status -eq "OK") {
    Write-Host "✅ API Server: HEALTHY" -ForegroundColor Green
    
    $p0Count = ($healthCheck.Data.data.p0Agents.PSObject.Properties | Measure-Object).Count
    $p1Count = ($healthCheck.Data.data.p1Agents.PSObject.Properties | Measure-Object).Count
    
    Write-Host "   P0 Agents: $p0Count/6"
    Write-Host "   P1 Agents: $p1Count/12"
    Write-Host "   Total: $($p0Count + $p1Count)/18"
} else {
    Write-Host "❌ API Server: DOWN" -ForegroundColor Red
    Write-Host "   Error: $($healthCheck.Error)"
}

Write-Host ""

# Check Docker containers (if Docker is available)
try {
    $containers = docker ps --format "{{.Names}}:{{.Status}}" 2>$null
    if ($containers) {
        Write-Host "Docker Containers:"
        $containers | ForEach-Object {
            $parts = $_ -split ":"
            $name = $parts[0]
            $status = $parts[1]
            
            if ($status -match "Up") {
                Write-Host "   ✅ $name: $status" -ForegroundColor Green
            } else {
                Write-Host "   ❌ $name: $status" -ForegroundColor Red
            }
        }
    }
} catch {
    Write-Host "Docker: Not available or not running"
}

Write-Host ""

# Check N8N (if running)
$n8nCheck = Test-Endpoint -Name "N8N" -Url "http://localhost:5678/healthz"
if ($n8nCheck.Status -eq "OK") {
    Write-Host "✅ N8N: RUNNING" -ForegroundColor Green
} else {
    Write-Host "⚠️ N8N: Not accessible (may not be running)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================"
